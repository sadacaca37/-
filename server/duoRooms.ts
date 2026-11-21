/**
 * 펀펀 플레이 2인 대결 방 (마크를 뺀 게임 7종이 함께 씀)
 *  - 한 사람이 [방 만들기] → 4자리 방 번호가 나옴 → 친구는 자기 컴퓨터에서 같은 게임을 열고 번호 입력
 *  - 방장이 게임을 시작하면 두 화면에서 3·2·1 뒤 같은 판이 동시에 시작
 *  - 게임 중에는 서로의 위치·점수를 주고받아 상대가 반투명(유령)으로 보이고, 끝나면 승패를 보여 줌
 *  - 소켓(socket.io '/duo')이 막힌 학교 인터넷에서는 HTTP로 주고받음 (마크와 같은 방식)
 *  - 방 정보는 메모리에만 있고, 두 사람이 모두 나가면 사라짐
 */
import crypto from 'crypto';
import type { Express, Request, Response } from 'express';
import type { Server as IoServer, Socket } from 'socket.io';

type Sink = (event: string, data: any) => void;

interface Player {
  id: string;
  name: string;
  slot: 1 | 2;
}

interface Room {
  key: string;
  game: string;
  code: string;
  hostId: string;
  players: Record<string, Player>;
  round: number;
}

const GAME_ID = /^[a-z0-9_-]{2,20}$/;
const rooms = new Map<string, Room>(); // "game:code" -> room
const sinks = new Map<string, Sink>(); // playerId -> 보내는 곳
const playerRoom = new Map<string, string>(); // playerId -> room key
const lastState = new Map<string, number>(); // playerId -> 마지막 위치 보낸 시각 (너무 잦으면 버림)

const newId = (p: string) => p + crypto.randomBytes(9).toString('base64url');
const cleanName = (n: unknown) => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 12);

/** 지금 열려 있는 2인 방 수 */
export function duoRoomCount() {
  return rooms.size;
}

function view(room: Room) {
  return {
    game: room.game,
    code: room.code,
    hostId: room.hostId,
    round: room.round,
    players: Object.values(room.players).sort((a, b) => a.slot - b.slot),
  };
}

function send(pid: string, event: string, data: any) {
  try {
    sinks.get(pid)?.(event, data);
  } catch {}
}

function toRoom(room: Room, event: string, data: any, exceptId?: string) {
  for (const pid of Object.keys(room.players)) if (pid !== exceptId) send(pid, event, data);
}

function newCode(game: string) {
  for (let i = 0; i < 200; i++) {
    const code = String(1000 + Math.floor(Math.random() * 9000));
    if (!rooms.has(`${game}:${code}`)) return code;
  }
  return String(Date.now() % 9000 + 1000);
}

const core = {
  create(pid: string, sink: Sink, body: any, serverName: string) {
    const game = String(body?.game || '');
    if (!GAME_ID.test(game)) return { success: false, error: '게임 이름이 잘못됐어요.' };
    core.leave(pid);
    const code = newCode(game);
    const room: Room = { key: `${game}:${code}`, game, code, hostId: pid, players: {}, round: 0 };
    room.players[pid] = { id: pid, name: serverName || cleanName(body?.name) || '친구1', slot: 1 };
    rooms.set(room.key, room);
    sinks.set(pid, sink);
    playerRoom.set(pid, room.key);
    return { success: true, selfId: pid, room: view(room) };
  },

  join(pid: string, sink: Sink, body: any, serverName: string) {
    const game = String(body?.game || '');
    const code = String(body?.code || '').replace(/[^0-9]/g, '');
    const room = rooms.get(`${game}:${code}`);
    if (!room) return { success: false, error: `${code || '그'} 번 방이 없어요. 번호와 게임이 맞는지 확인해 주세요.` };
    if (room.players[pid]) return { success: true, selfId: pid, room: view(room) };
    if (Object.keys(room.players).length >= 2) return { success: false, error: '이 방은 벌써 2명이 꽉 찼어요.' };
    core.leave(pid);
    const taken = Object.values(room.players).map((p) => p.slot);
    const slot: 1 | 2 = taken.includes(1) ? 2 : 1;
    const other = Object.values(room.players)[0];
    let name = serverName || cleanName(body?.name) || `친구${slot}`;
    if (other && other.name === name) name = `${name}(${slot})`;
    room.players[pid] = { id: pid, name, slot };
    sinks.set(pid, sink);
    playerRoom.set(pid, room.key);
    toRoom(room, 'room', view(room), pid);
    return { success: true, selfId: pid, room: view(room) };
  },

  leave(pid: string) {
    const key = playerRoom.get(pid);
    playerRoom.delete(pid);
    sinks.delete(pid);
    lastState.delete(pid);
    const room = key ? rooms.get(key) : null;
    if (!room) return;
    delete room.players[pid];
    const left = Object.keys(room.players);
    if (!left.length) {
      rooms.delete(room.key);
      return;
    }
    if (room.hostId === pid) room.hostId = left[0];
    toRoom(room, 'peer_left', { room: view(room) });
  },

  act(pid: string, event: string, data: any) {
    const key = playerRoom.get(pid);
    const room = key ? rooms.get(key) : null;
    if (!room) return;
    if (event === 'leave') return core.leave(pid);
    if (event === 'start') {
      if (room.hostId !== pid) return;
      if (Object.keys(room.players).length < 2) return send(pid, 'notice', { text: '친구가 아직 들어오지 않았어요.' });
      let settings: any = data?.settings ?? null;
      try {
        if (JSON.stringify(settings).length > 2000) settings = null;
      } catch {
        settings = null;
      }
      room.round += 1;
      toRoom(room, 'start', { round: room.round, settings, seed: Math.floor(Math.random() * 2 ** 31), delay: 3200 });
      return;
    }
    if (event === 'st') {
      // 위치·점수: 1초에 25번까지만, 크기도 제한
      const now = Date.now();
      if (now - (lastState.get(pid) || 0) < 40) return;
      lastState.set(pid, now);
      let s = '';
      try {
        s = JSON.stringify(data);
      } catch {
        return;
      }
      if (!s || s.length > 1500) return;
      toRoom(room, 'st', data, pid);
      return;
    }
    if (event === 'fin') {
      toRoom(room, 'fin', { round: Number(data?.round) || room.round, result: data?.result ?? null }, pid);
      return;
    }
    if (event === 'emote') {
      toRoom(room, 'emote', { e: String(data?.e || '').slice(0, 4) }, pid);
    }
  },
};

/* ------------------------------------------------------------------ HTTP 길 */
interface HttpClient {
  secret: string;
  queue: { event: string; data: any }[];
  waiter: Response | null;
  timer: NodeJS.Timeout | null;
  lastSeen: number;
}
const httpClients = new Map<string, HttpClient>();

function httpSink(pid: string): Sink {
  return (event, data) => {
    const c = httpClients.get(pid);
    if (!c) return;
    if (event === 'st') {
      // 위치는 가장 최근 것 하나만 있으면 됨
      const i = c.queue.findIndex((e) => e.event === 'st');
      if (i >= 0) c.queue.splice(i, 1);
    }
    c.queue.push({ event, data });
    if (c.queue.length > 60) c.queue.splice(0, c.queue.length - 60);
    if (c.waiter) flush(c);
  };
}

function flush(c: HttpClient) {
  const res = c.waiter;
  if (!res) return;
  c.waiter = null;
  if (c.timer) clearTimeout(c.timer);
  c.timer = null;
  const events = c.queue.splice(0, c.queue.length);
  try {
    res.json({ success: true, events });
  } catch {}
}

/**
 * @param nameOf 로그인한 학생 이름 찾기 (없으면 '')
 */
export function registerDuo(app: Express, nameOf: (req: Request) => string) {
  const enter = (kind: 'create' | 'join') => (req: Request, res: Response) => {
    const pid = newId('d_');
    const secret = newId('');
    httpClients.set(pid, { secret, queue: [], waiter: null, timer: null, lastSeen: Date.now() });
    const out: any = core[kind](pid, httpSink(pid), req.body || {}, nameOf(req));
    if (!out.success) {
      httpClients.delete(pid);
      return res.json(out);
    }
    res.json({ ...out, secret });
  };
  app.post('/api/duo/create', enter('create'));
  app.post('/api/duo/join', enter('join'));

  // 보내기 + 받기를 한 번에: 보낼 것을 넘기고, 받을 것이 생길 때까지(최대 1.5초) 기다렸다가 돌려줌
  app.post('/api/duo/sync', (req, res) => {
    const pid = String(req.body?.pid || '');
    const c = httpClients.get(pid);
    if (!c || c.secret !== String(req.body?.secret || '')) return res.status(401).json({ success: false, error: 'gone' });
    c.lastSeen = Date.now();
    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 20) : [];
    for (const e of events) if (e && typeof e.event === 'string') core.act(pid, e.event, e.data);
    if (events.some((e: any) => e?.event === 'leave')) {
      httpClients.delete(pid);
      return res.json({ success: true, events: [] });
    }
    if (c.waiter) flush(c);
    c.waiter = res;
    if (c.queue.length) return flush(c);
    c.timer = setTimeout(() => flush(c), 1500);
    req.on('close', () => {
      if (c.waiter === res) {
        c.waiter = null;
        if (c.timer) clearTimeout(c.timer);
      }
    });
  });

  // 15초 넘게 소식이 없는 HTTP 접속은 방에서 내보냄
  setInterval(() => {
    const now = Date.now();
    for (const [pid, c] of httpClients) {
      if (!c.waiter && now - c.lastSeen > 15000) {
        httpClients.delete(pid);
        core.leave(pid);
      }
    }
  }, 5000).unref?.();
}

/** 소켓 길: 마크가 만든 socket.io 서버에 '/duo' 이름 공간을 붙임 */
export function attachDuo(io: IoServer, nameOfHeaders: (headers: Record<string, any>) => string) {
  io.of('/duo').on('connection', (socket: Socket) => {
    const pid = 's_' + socket.id;
    const sink: Sink = (event, data) => socket.emit(event, data);
    const name = () => nameOfHeaders(socket.handshake.headers || {});
    socket.on('create', (data: any, cb: (r: any) => void) => {
      const r = core.create(pid, sink, data || {}, name());
      if (typeof cb === 'function') cb(r);
    });
    socket.on('join', (data: any, cb: (r: any) => void) => {
      const r = core.join(pid, sink, data || {}, name());
      if (typeof cb === 'function') cb(r);
    });
    for (const ev of ['start', 'st', 'fin', 'emote', 'leave']) socket.on(ev, (data: any) => core.act(pid, ev, data));
    socket.on('disconnect', () => core.leave(pid));
  });
}
