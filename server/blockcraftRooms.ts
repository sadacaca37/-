/**
 * 마크(블록 크래프트) 멀티플레이 방.
 *  - 소켓(socket.io)으로 접속한 친구와, 소켓이 막힌 곳에서 HTTP(일반 인터넷 요청)로 접속한 친구가
 *    같은 방에서 함께 놀 수 있도록 방 관리 부분을 하나로 묶었습니다.
 *  - 방·블록 정보는 메모리에만 두고, 모두 나가면 사라집니다. (개인 월드는 브라우저에 저장)
 */
import type { Server as HttpServer } from 'http';
import type { Express, Request, Response } from 'express';
import { Server, Socket } from 'socket.io';

interface PlayerData {
  id: string;
  socketId: string;
  userId?: string;
  nickname: string;
  position: [number, number, number];
  rotation: [number, number]; // pitch, yaw
  selectedBlock: number;
  color: string;
  isHost: boolean;
  /** 캐릭터 고르기에서 고른 모습(0~3) */
  characterId: number;
}

function normalizeCharacterId(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
}

interface Room {
  code: string;
  hostId: string;
  players: Record<string, PlayerData>;
  seed: number;
  modifiedBlocks: Record<string, number>; // "x,y,z" => blockType (0 = air)
  started: boolean;
  maxPlayers: number;
}

export interface RoomHooks {
  /** 방을 만들 때 저장해 둔 블록 불러오기 (없으면 빈 월드) */
  loadRoomBlocks?: (code: string) => Record<string, number>;
  /** 블록이 바뀔 때마다 (저장용) */
  onBlockChange?: (code: string, x: number, y: number, z: number, type: number) => void;
  /** 플레이어가 나갈 때 (저장용) */
  onPlayerLeave?: (player: PlayerData, room: Room | null) => void;
  /** 토큰으로 사용자 id 찾기 */
  resolveUserId?: (token: string) => string | null;
}

type Sink = (event: string, data: any) => void;

const rooms: Record<string, Room> = {};
const sinks = new Map<string, Sink>(); // playerId -> 이벤트 보내는 곳
const playerRoom = new Map<string, string>(); // playerId -> roomCode

const PLAYER_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ec4899', '#a855f7', '#eab308', '#06b6d4', '#ef4444'];

/** 지금 열려 있는 방 수 */
export function activeRoomCount() {
  return Object.keys(rooms).length;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return rooms[code] ? generateRoomCode() : code;
}

function roomView(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: Object.values(room.players),
    seed: room.seed,
    started: room.started,
    maxPlayers: room.maxPlayers,
    modifiedBlocks: room.modifiedBlocks,
  };
}

function broadcast(code: string, event: string, data: any, exceptId?: string) {
  const room = rooms[code];
  if (!room) return;
  for (const pid of Object.keys(room.players)) {
    if (pid === exceptId) continue;
    try {
      sinks.get(pid)?.(event, data);
    } catch {}
  }
}

function makeCore(hooks: RoomHooks) {
  const cleanName = (n: string, fallback: string) => (n || '').trim().slice(0, 16) || fallback;

  const leave = (pid: string) => {
    const code = playerRoom.get(pid);
    playerRoom.delete(pid);
    const room = code ? rooms[code] : null;
    if (!room || !code) {
      sinks.delete(pid);
      return;
    }
    const leaving = room.players[pid];
    delete room.players[pid];
    sinks.delete(pid);
    if (leaving) hooks.onPlayerLeave?.(leaving, room);
    const remaining = Object.values(room.players);
    if (remaining.length === 0) {
      delete rooms[code];
      return;
    }
    if (room.hostId === pid) {
      room.hostId = remaining[0].id;
      remaining[0].isHost = true;
      broadcast(code, 'host_changed', { hostId: room.hostId });
    }
    broadcast(code, 'player_left', { id: pid, players: remaining });
  };

  return {
    leave,
    create(pid: string, sink: Sink, data: { nickname?: string; userId?: string; characterId?: number }) {
      if (playerRoom.has(pid)) leave(pid);
      const code = generateRoomCode();
      const host: PlayerData = {
        id: pid,
        socketId: pid,
        userId: data?.userId || undefined,
        nickname: cleanName(data?.nickname || '', 'Player'),
        position: [0, 20, 0],
        rotation: [0, 0],
        selectedBlock: 1,
        color: PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
        isHost: true,
        characterId: normalizeCharacterId(data?.characterId),
      };
      const room: Room = {
        code,
        hostId: pid,
        players: { [pid]: host },
        seed: Math.floor(Math.random() * 1000000),
        modifiedBlocks: { ...(hooks.loadRoomBlocks?.(code) || {}) },
        started: false,
        maxPlayers: 6,
      };
      rooms[code] = room;
      sinks.set(pid, sink);
      playerRoom.set(pid, code);
      return { success: true, room: roomView(room), selfId: pid, player: host };
    },
    join(pid: string, sink: Sink, data: { roomCode?: string; nickname?: string; userId?: string; characterId?: number }) {
      const code = String(data?.roomCode || '').toUpperCase().trim();
      const room = rooms[code];
      if (!room) return { success: false, error: '해당 방을 찾을 수 없어요. 방 코드를 다시 확인해 주세요.' };
      if (Object.keys(room.players).length >= room.maxPlayers) return { success: false, error: '방이 꽉 찼어요 (최대 6명).' };
      if (playerRoom.has(pid)) leave(pid);
      const used = Object.values(room.players).map((p) => p.color);
      const player: PlayerData = {
        id: pid,
        socketId: pid,
        userId: data?.userId || undefined,
        nickname: cleanName(data?.nickname || '', `Player_${Object.keys(room.players).length + 1}`),
        position: [0, 20, 0],
        rotation: [0, 0],
        selectedBlock: 1,
        color: PLAYER_COLORS.find((c) => !used.includes(c)) || PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)],
        isHost: false,
        characterId: normalizeCharacterId(data?.characterId),
      };
      room.players[pid] = player;
      sinks.set(pid, sink);
      playerRoom.set(pid, code);
      broadcast(code, 'player_joined', { player, players: Object.values(room.players) }, pid);
      return { success: true, room: roomView(room), selfId: pid, player };
    },
    /** 방 안에서 일어난 일(시작·이동·블록·채팅) */
    act(pid: string, event: string, data: any) {
      const code = playerRoom.get(pid);
      const room = code ? rooms[code] : null;
      if (!room || !code) return;
      const player = room.players[pid];
      if (!player) return;
      switch (event) {
        case 'start_game':
          if (room.hostId !== pid) return;
          room.started = true;
          broadcast(code, 'game_started', { seed: room.seed, modifiedBlocks: room.modifiedBlocks });
          return;
        case 'player_move':
          if (!data) return;
          player.position = data.position;
          player.rotation = data.rotation;
          player.selectedBlock = data.selectedBlock;
          broadcast(code, 'player_moved', { id: pid, position: data.position, rotation: data.rotation, selectedBlock: data.selectedBlock }, pid);
          return;
        case 'block_place':
        case 'block_break': {
          if (!data) return;
          const x = Math.floor(data.x), y = Math.floor(data.y), z = Math.floor(data.z);
          const type = event === 'block_place' ? Number(data.type) || 0 : 0;
          room.modifiedBlocks[`${x},${y},${z}`] = type;
          hooks.onBlockChange?.(code, x, y, z, type);
          if (event === 'block_place') broadcast(code, 'block_placed', { x: data.x, y: data.y, z: data.z, type, by: pid }, pid);
          else broadcast(code, 'block_broken', { x: data.x, y: data.y, z: data.z, by: pid }, pid);
          return;
        }
        case 'chat_message': {
          const msg = String(data?.message || '').trim().slice(0, 100);
          if (!msg) return;
          broadcast(code, 'chat_message', {
            id: Math.random().toString(36).substring(2, 9),
            senderId: pid,
            senderName: player.nickname,
            color: player.color,
            message: msg,
            timestamp: Date.now(),
          });
          return;
        }
        case 'authenticate_player': {
          const uid = data?.token ? hooks.resolveUserId?.(String(data.token)) ?? String(data.token).slice(0, 40) : null;
          if (uid) player.userId = uid;
          return;
        }
        case 'leave_room':
          leave(pid);
          return;
      }
    },
  };
}

/* ---------------------------------------------------------------------------
 * HTTP 접속 (소켓이 막힌 곳용): 보내기 = POST, 받기 = 기다렸다가 받는 GET(롱폴링)
 * ------------------------------------------------------------------------- */
interface HttpClient {
  secret: string;
  queue: { event: string; data: any }[];
  waiter: Response | null;
  waiterTimer: NodeJS.Timeout | null;
  lastSeen: number;
}
const httpClients = new Map<string, HttpClient>();

function flush(c: HttpClient) {
  if (!c.waiter || c.queue.length === 0) return;
  const res = c.waiter;
  c.waiter = null;
  if (c.waiterTimer) clearTimeout(c.waiterTimer);
  c.waiterTimer = null;
  const events = c.queue.splice(0, c.queue.length);
  try {
    res.json({ success: true, events });
  } catch {}
}

function httpSink(pid: string): Sink {
  return (event, data) => {
    const c = httpClients.get(pid);
    if (!c) return;
    // 이동 정보는 가장 최근 것만 남김 (쌓이지 않게)
    if (event === 'player_moved') {
      const i = c.queue.findIndex((q) => q.event === 'player_moved' && q.data?.id === data?.id);
      if (i >= 0) c.queue.splice(i, 1);
    }
    c.queue.push({ event, data });
    if (c.queue.length > 500) c.queue.splice(0, c.queue.length - 500);
    flush(c);
  };
}

function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

let singletonCore: ReturnType<typeof makeCore> | null = null;
function getCore(hooks: RoomHooks = {}) {
  if (!singletonCore) singletonCore = makeCore(hooks);
  return singletonCore;
}

/** HTTP 방 API 등록 — 반드시 다른 '/api' 404 처리보다 먼저 호출 */
export function registerBlockcraftHttp(app: Express, hooks: RoomHooks = {}) {
  const core = getCore(hooks);
  const auth = (req: Request) => {
    const pid = String((req.body && req.body.pid) || req.query.pid || '');
    const secret = String((req.body && req.body.secret) || req.query.secret || '');
    const c = httpClients.get(pid);
    if (!c || c.secret !== secret) return null;
    c.lastSeen = Date.now();
    return { pid, c };
  };

  const enter = (kind: 'create' | 'join') => (req: Request, res: Response) => {
    const pid = newId('h_');
    const secret = newId('');
    httpClients.set(pid, { secret, queue: [], waiter: null, waiterTimer: null, lastSeen: Date.now() });
    const out: any = kind === 'create' ? core.create(pid, httpSink(pid), req.body || {}) : core.join(pid, httpSink(pid), req.body || {});
    if (!out.success) {
      httpClients.delete(pid);
      return res.json(out);
    }
    res.json({ ...out, secret });
  };
  app.post('/api/bc/create', enter('create'));
  app.post('/api/bc/join', enter('join'));

  app.post('/api/bc/send', (req, res) => {
    const a = auth(req);
    if (!a) return res.status(401).json({ success: false, error: '방 연결이 끊겼어요. 다시 들어와 주세요.' });
    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 50) : [];
    for (const e of events) if (e && typeof e.event === 'string') core.act(a.pid, e.event, e.data);
    if (events.some((e: any) => e?.event === 'leave_room')) httpClients.delete(a.pid);
    res.json({ success: true });
  });

  app.get('/api/bc/poll', (req, res) => {
    const a = auth(req);
    if (!a) return res.status(401).json({ success: false, error: 'gone' });
    const { c } = a;
    if (c.waiter) {
      try {
        c.waiter.json({ success: true, events: [] });
      } catch {}
    }
    c.waiter = res;
    if (c.queue.length) return flush(c);
    c.waiterTimer = setTimeout(() => {
      if (c.waiter === res) {
        c.waiter = null;
        try {
          res.json({ success: true, events: [] });
        } catch {}
      }
    }, 20000);
    req.on('close', () => {
      if (c.waiter === res) {
        c.waiter = null;
        if (c.waiterTimer) clearTimeout(c.waiterTimer);
      }
    });
  });

  // 30초 넘게 소식이 없는 HTTP 접속은 방에서 내보냄
  setInterval(() => {
    const now = Date.now();
    for (const [pid, c] of httpClients) {
      if (!c.waiter && now - c.lastSeen > 30000) {
        httpClients.delete(pid);
        core.leave(pid);
      }
    }
  }, 5000).unref?.();
}

/** 소켓 접속 연결 */
export function attachBlockcraft(server: HttpServer, hooks: RoomHooks = {}) {
  const core = getCore(hooks);
  const io = new Server(server, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6,
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });
  io.on('connection', (socket: Socket) => {
    const pid = socket.id;
    const sink: Sink = (event, data) => socket.emit(event, data);
    socket.on('create_room', (data: any, cb: (res: any) => void) => {
      const r = core.create(pid, sink, data || {});
      if (typeof cb === 'function') cb(r);
    });
    socket.on('join_room', (data: any, cb: (res: any) => void) => {
      const r = core.join(pid, sink, data || {});
      if (typeof cb === 'function') cb(r);
    });
    for (const ev of ['start_game', 'player_move', 'block_place', 'block_break', 'chat_message', 'authenticate_player', 'leave_room']) {
      socket.on(ev, (data: any) => core.act(pid, ev, data));
    }
    socket.on('disconnect', () => core.leave(pid));
  });
  return io;
}
