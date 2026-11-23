/**
 * 타자팡(모아팡) 안에서 쓰는 Firebase 방 — 서버 없이 최대 10명이 같은 월드에서 논다.
 *
 * 자리: 모아팡 Firebase Realtime Database `taja/duo/blockcraft/<4자리 방번호>`
 *   (다른 게임의 2인 대결과 같은 자리 — Firebase 규칙 `taja/duo`가 있어야 열림)
 *
 *   host            방장 id
 *   t               방을 만든 시각(ms) — 오래된 빈 방은 새로 만들 때 덮어씀
 *   gameMode, seed  방장이 고른 모드
 *   started         방장이 시작하면 true (그 뒤에 들어온 친구는 바로 게임으로)
 *   players/<id>    { nickname, characterId, color, slot, joined }
 *   st/<id>         { p:[x,y,z], r:[pitch,yaw], b:손에 든 블록 }  — 초당 8번
 *   blocks/<x,y,z>  { t:블록 종류(0 = 부숨), by }                  — 새로 들어온 친구도 전부 받음
 *   chat/<push>     ChatMessage
 *   fx/<push>       { kind, pos, dir, by }  — 폭탄·TNT, 8초 뒤 지움
 *
 * 한 컴퓨터의 여러 탭이 같은 Firebase 로그인을 써도 서로 다른 사람이 되도록 id = 로그인uid_탭번호.
 * 시험할 때는 window.DUO_FB_SDK 로 가짜 Firebase 주소를 넣는다.
 */
import type { GameMode, PlayerData, RoomState } from "../types";

const FB_CFG = {
  apiKey: "AIzaSyBlA9TN1BKvnsKrzuq2fMalCrATTeFgkUo",
  authDomain: "moaboard-943a3.firebaseapp.com",
  projectId: "moaboard-943a3",
  appId: "1:986530203160:web:b48121b7113f38a49c656d",
  databaseURL: "https://moaboard-943a3-default-rtdb.asia-southeast1.firebasedatabase.app",
};

export const FB_MAX_PLAYERS = 10;
const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#ec4899", "#a855f7", "#eab308", "#06b6d4", "#ef4444", "#84cc16", "#f472b6"];
const MOVE_EVERY_MS = 125; // 초당 8번
const STALE_ROOM_MS = 6 * 3600 * 1000;

type Emit = (event: string, data: any) => void;
interface FbApi {
  D: any;
  db: any;
  uid: string;
}

let fbReady: Promise<FbApi | null> | null = null;
const TAB = Math.random().toString(36).slice(2, 7);

/** 정적 사이트(모아팡·GitHub Pages)처럼 게임 서버가 없는 곳인지 */
export function isStaticHost(): boolean {
  try {
    if ((window as any).BC_FORCE_FB) return true;
    const h = location.hostname;
    return /(^|\.)moapang\.kr$/.test(h) || /\.github\.io$/.test(h);
  } catch {
    return false;
  }
}

function getFb(): Promise<FbApi | null> {
  if (fbReady) return fbReady;
  fbReady = (async () => {
    try {
      const base: string = (window as any).DUO_FB_SDK || "https://www.gstatic.com/firebasejs/10.12.2/";
      const [A, Au, D] = await Promise.all([
        import(/* @vite-ignore */ base + "firebase-app.js"),
        import(/* @vite-ignore */ base + "firebase-auth.js"),
        import(/* @vite-ignore */ base + "firebase-database.js"),
      ]);
      const app = A.getApps().length ? A.getApp() : A.initializeApp(FB_CFG);
      const auth = Au.getAuth(app);
      let u = auth.currentUser;
      if (!u) {
        u = await new Promise<any>((ok) => {
          const off = Au.onAuthStateChanged(auth, (x: any) => {
            off();
            ok(x);
          });
          setTimeout(() => ok(null), 4000);
        });
      }
      if (!u) u = (await Au.signInAnonymously(auth)).user;
      return { D, db: D.getDatabase(app), uid: String(u.uid) };
    } catch (e) {
      console.warn("[blockcraft] firebase", e);
      fbReady = null;
      return null;
    }
  })();
  return fbReady;
}

export function fbErrorText(e: any): string {
  const m = String((e && (e.code || e.message)) || e);
  if (/permission/i.test(m)) return "방 자리가 아직 열려 있지 않아요. 선생님이 Firebase 규칙에 taja/duo 를 추가해 주세요. (혼자 하기는 바로 할 수 있어요)";
  return "방에 연결하지 못했어요. 잠시 뒤 다시 눌러 주세요. (혼자 하기는 바로 할 수 있어요)";
}

const r2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;
const r3 = (n: number) => Math.round((Number(n) || 0) * 1000) / 1000;

export class FbRoom {
  base = "";
  code = "";
  selfId = "";
  host = "";
  started = false;
  startedAtJoin = false;
  gameMode: GameMode = "creative";
  seed = 0;
  players: Record<string, any> = {};
  private me: any = null;
  private api: FbApi | null = null;
  private offs: Array<() => void> = [];
  private knownBlocks = new Map<string, number>();
  private seenChat = new Set<string>();
  private seenFx = new Set<string>();
  private stSeen = new Map<string, string>();
  private lastMoveAt = 0;
  private lastMoveKey = "";
  private pendingMove: any = null;
  private moveTimer: number | null = null;
  private wasConnected = false;
  private closed = false;

  constructor(private emit: Emit) {}

  private ref(path = "") {
    return this.api!.D.ref(this.api!.db, this.base + path);
  }

  private toPlayer(id: string, p: any): PlayerData {
    const st = this.lastSt[id];
    return {
      id,
      socketId: id,
      nickname: String(p?.nickname || "친구").slice(0, 16),
      position: st && Array.isArray(st.p) ? [st.p[0], st.p[1], st.p[2]] : [0, 20, 0],
      rotation: st && Array.isArray(st.r) ? [st.r[0], st.r[1]] : [0, 0],
      selectedBlock: (st && st.b) || 1,
      color: String(p?.color || COLORS[0]),
      isHost: id === this.host,
      characterId: Number(p?.characterId) || 0,
    };
  }
  private lastSt: Record<string, any> = {};

  playerList(): PlayerData[] {
    return Object.keys(this.players)
      .map((id) => ({ id, p: this.players[id] || {} }))
      .sort((a, b) => (a.p.slot ?? 99) - (b.p.slot ?? 99) || (a.p.joined || 0) - (b.p.joined || 0))
      .map(({ id, p }) => this.toPlayer(id, p));
  }

  view(): RoomState {
    return {
      code: this.code,
      hostId: this.host,
      gameMode: this.gameMode,
      players: this.playerList(),
      seed: this.seed,
      started: this.started,
      maxPlayers: FB_MAX_PLAYERS,
      modifiedBlocks: Object.fromEntries(this.knownBlocks),
    };
  }

  /** 방 만들기·들어가기 */
  async enter(
    kind: "create" | "join",
    payload: { roomCode?: string; nickname?: string; characterId?: number; gameMode?: GameMode },
  ): Promise<{ success: boolean; error?: string }> {
    const api = await getFb();
    if (!api) return { success: false, error: fbErrorText("offline") };
    this.api = api;
    const D = api.D;
    const me = `${api.uid}_${TAB}`;
    this.selfId = me;
    const nickname = String(payload.nickname || "").trim().slice(0, 16) || "친구";
    const characterId = Number(payload.characterId) || 0;
    const now = Date.now();
    try {
      let room: any;
      if (kind === "create") {
        let code = "";
        for (let i = 0; i < 15 && !code; i++) {
          const c = String(1000 + Math.floor(Math.random() * 9000));
          const v = (await D.get(D.ref(api.db, `taja/duo/blockcraft/${c}`))).val();
          const busy = v && v.players && Object.keys(v.players).length && now - (v.t || 0) < STALE_ROOM_MS;
          if (!busy) code = c;
        }
        if (!code) return { success: false, error: "빈 방 번호를 찾지 못했어요. 다시 눌러 주세요." };
        this.code = code;
        this.base = `taja/duo/blockcraft/${code}`;
        this.me = { nickname, characterId, color: COLORS[0], slot: 0, joined: now };
        room = {
          host: me,
          t: now,
          gameMode: payload.gameMode === "survival" ? "survival" : "creative",
          seed: Math.floor(Math.random() * 1000000),
          started: false,
          players: { [me]: this.me },
        };
        await D.set(this.ref(), room);
      } else {
        const code = String(payload.roomCode || "").replace(/\D/g, "").slice(0, 4);
        if (code.length !== 4) return { success: false, error: "방 번호 4자리를 넣어 주세요." };
        this.code = code;
        this.base = `taja/duo/blockcraft/${code}`;
        room = (await D.get(this.ref())).val();
        const ids = room && room.players ? Object.keys(room.players) : [];
        if (!room || !ids.length) return { success: false, error: `${code}번 방이 없어요. 방 번호를 다시 확인해 주세요.` };
        if (ids.length >= FB_MAX_PLAYERS && !ids.includes(me)) return { success: false, error: `방이 꽉 찼어요 (최대 ${FB_MAX_PLAYERS}명).` };
        const used = new Set(ids.filter((id) => id !== me).map((id) => room.players[id]?.slot));
        let slot = 0;
        while (used.has(slot)) slot++;
        let nm = nickname;
        const names = new Set(ids.filter((id) => id !== me).map((id) => String(room.players[id]?.nickname || "")));
        for (let k = 2; names.has(nm); k++) nm = `${nickname}(${k})`;
        this.me = { nickname: nm, characterId, color: COLORS[slot % COLORS.length], slot, joined: now };
        await D.set(this.ref(`/players/${me}`), this.me);
        room.players[me] = this.me;
      }
      D.onDisconnect(this.ref(`/players/${me}`)).remove();
      D.onDisconnect(this.ref(`/st/${me}`)).remove();

      this.host = room.host || me;
      this.players = room.players || {};
      this.gameMode = room.gameMode === "survival" ? "survival" : "creative";
      this.seed = Number(room.seed) || 0;
      this.started = !!room.started;
      this.startedAtJoin = kind === "join" && this.started;
      this.lastSt = { ...(room.st || {}) };
      for (const [k, b] of Object.entries<any>(room.blocks || {})) this.knownBlocks.set(this.keyToCoord(k), Number(b?.t) || 0);
      for (const k of Object.keys(room.chat || {})) this.seenChat.add(k);
      for (const k of Object.keys(room.fx || {})) this.seenFx.add(k);
      this.listen();
      window.addEventListener("pagehide", this.onPageHide);
      return { success: true };
    } catch (e) {
      console.warn("[blockcraft] enter", e);
      return { success: false, error: fbErrorText(e) };
    }
  }

  private onPageHide = () => this.leave();

  // Firebase 키에는 '.'을 못 쓰지만 좌표는 정수라 "x,y,z" 그대로 씀
  private keyToCoord(k: string) {
    return k;
  }

  private listen() {
    const D = this.api!.D;
    const me = this.selfId;
    const on = (path: string, fn: (s: any) => void) => this.offs.push(D.onValue(this.ref(path), fn));
    const onChild = (path: string, fn: (s: any) => void) => {
      this.offs.push(D.onChildAdded(this.ref(path), fn));
      this.offs.push(D.onChildChanged(this.ref(path), fn));
    };

    on("/players", (s: any) => {
      if (this.closed) return;
      const next: Record<string, any> = s.val() || {};
      const prev = this.players;
      this.players = next;
      if (!next[me]) return; // 잠깐 끊겼을 때 — '.info/connected'에서 다시 들어감
      for (const id of Object.keys(next)) {
        if (id !== me && !prev[id]) this.emit("player_joined", { player: this.toPlayer(id, next[id]), players: this.playerList() });
      }
      for (const id of Object.keys(prev)) {
        if (!next[id]) {
          delete this.lastSt[id];
          this.stSeen.delete(id);
          this.emit("player_left", { id, players: this.playerList() });
        }
      }
      // 방장이 나갔으면 남은 사람 중 첫 번째가 방장이 됨
      if (!next[this.host]) {
        const first = this.playerList()[0];
        if (first && first.id === me) D.set(this.ref("/host"), me).catch(() => {});
      }
    });

    on("/host", (s: any) => {
      const v = s.val();
      if (!v || v === this.host || this.closed) return;
      this.host = v;
      this.emit("host_changed", { hostId: v });
    });

    on("/started", (s: any) => {
      if (this.closed || !s.val() || this.started) return;
      this.started = true;
      if (this.host !== me) this.emit("game_started", { seed: this.seed, gameMode: this.gameMode, modifiedBlocks: {} });
    });

    on("/st", (s: any) => {
      if (this.closed) return;
      const v: Record<string, any> = s.val() || {};
      for (const id of Object.keys(v)) {
        if (id === me) continue;
        const x = v[id];
        if (!x || !Array.isArray(x.p)) continue;
        const key = JSON.stringify(x);
        if (this.stSeen.get(id) === key) continue;
        this.stSeen.set(id, key);
        this.lastSt[id] = x;
        this.emit("player_moved", { id, position: x.p, rotation: Array.isArray(x.r) ? x.r : [0, 0], selectedBlock: Number(x.b) || 1 });
      }
    });

    onChild("/blocks", (s: any) => {
      if (this.closed) return;
      const k = String(s.key);
      const v = s.val() || {};
      const t = Number(v.t) || 0;
      if (this.knownBlocks.get(k) === t) return;
      this.knownBlocks.set(k, t);
      if (v.by === me) return;
      const [x, y, z] = k.split(",").map(Number);
      if (![x, y, z].every(Number.isFinite)) return;
      if (t) this.emit("block_placed", { x, y, z, type: t, by: v.by });
      else this.emit("block_broken", { x, y, z, by: v.by });
    });

    this.offs.push(
      D.onChildAdded(this.ref("/chat"), (s: any) => {
        if (this.closed || this.seenChat.has(s.key)) return;
        this.seenChat.add(s.key);
        const m = s.val();
        if (m && m.message) this.emit("chat_message", m);
      }),
    );

    this.offs.push(
      D.onChildAdded(this.ref("/fx"), (s: any) => {
        if (this.closed || this.seenFx.has(s.key)) return;
        this.seenFx.add(s.key);
        const f = s.val();
        if (!f || f.by === me || !Array.isArray(f.pos)) return;
        this.emit("effect", { kind: String(f.kind), pos: f.pos, dir: Array.isArray(f.dir) ? f.dir : [0, 0, 0] });
      }),
    );

    // 와이파이가 잠깐 끊겼다 붙으면 onDisconnect로 지워진 내 자리를 다시 만듦
    this.offs.push(
      D.onValue(D.ref(this.api!.db, ".info/connected"), (s: any) => {
        if (this.closed) return;
        const ok = !!s.val();
        if (ok && this.wasConnected && this.me) {
          D.onDisconnect(this.ref(`/players/${me}`)).remove();
          D.onDisconnect(this.ref(`/st/${me}`)).remove();
          D.set(this.ref(`/players/${me}`), this.me).catch(() => {});
        }
        if (ok) this.wasConnected = true;
      }),
    );
  }

  /** 방 안에서 일어난 일 보내기 (서버판 이벤트 이름 그대로) */
  send(event: string, data: any) {
    if (!this.api || this.closed) return;
    const D = this.api.D;
    const me = this.selfId;
    const fail = (e: any) => console.warn("[blockcraft] send", event, e);
    switch (event) {
      case "start_game":
        if (this.host !== me) return;
        this.started = true;
        D.update(this.ref(), { started: true, startedAt: D.serverTimestamp() }).catch(fail);
        return;
      case "player_move": {
        if (!data) return;
        this.pendingMove = {
          p: [r2(data.position[0]), r2(data.position[1]), r2(data.position[2])],
          r: [r3(data.rotation[0]), r3(data.rotation[1])],
          b: Number(data.selectedBlock) || 1,
        };
        this.flushMove();
        return;
      }
      case "block_place":
      case "block_break": {
        if (!data) return;
        const x = Math.floor(data.x),
          y = Math.floor(data.y),
          z = Math.floor(data.z);
        const t = event === "block_place" ? Number(data.type) || 0 : 0;
        const k = `${x},${y},${z}`;
        this.knownBlocks.set(k, t);
        D.set(this.ref(`/blocks/${k}`), { t, by: me }).catch(fail);
        return;
      }
      case "chat_message": {
        const msg = String(data?.message || "").trim().slice(0, 100);
        if (!msg) return;
        const r = D.push(this.ref("/chat"));
        D.set(r, {
          id: String(r.key),
          senderId: me,
          senderName: String(this.me?.nickname || "친구"),
          color: String(this.me?.color || COLORS[0]),
          message: msg,
          timestamp: Date.now(),
        }).catch(fail);
        return;
      }
      case "effect": {
        if (!data || !Array.isArray(data.pos)) return;
        const r = D.push(this.ref("/fx"));
        this.seenFx.add(String(r.key));
        D.set(r, { kind: String(data.kind).slice(0, 24), pos: data.pos.slice(0, 3).map(r2), dir: (Array.isArray(data.dir) ? data.dir : [0, 0, 0]).slice(0, 3).map(r3), by: me }).catch(fail);
        setTimeout(() => D.remove(r).catch(() => {}), 8000);
        return;
      }
      case "leave_room":
        this.leave();
        return;
    }
  }

  /** 이동은 초당 8번까지만, 마지막 위치는 꼭 보냄 */
  private flushMove() {
    if (!this.pendingMove || this.moveTimer != null) return;
    const wait = MOVE_EVERY_MS - (performance.now() - this.lastMoveAt);
    if (wait > 0) {
      this.moveTimer = window.setTimeout(() => {
        this.moveTimer = null;
        this.flushMove();
      }, wait);
      return;
    }
    const m = this.pendingMove;
    this.pendingMove = null;
    const key = JSON.stringify(m);
    const now = performance.now();
    // 가만히 있으면 2초에 한 번만
    if (key === this.lastMoveKey && now - this.lastMoveAt < 2000) return;
    this.lastMoveKey = key;
    this.lastMoveAt = now;
    this.api!.D.set(this.ref(`/st/${this.selfId}`), m).catch(() => {});
  }

  leave() {
    if (this.closed || !this.api) return;
    this.closed = true;
    window.removeEventListener("pagehide", this.onPageHide);
    if (this.moveTimer != null) clearTimeout(this.moveTimer);
    for (const off of this.offs) {
      try {
        off();
      } catch {}
    }
    this.offs = [];
    const D = this.api.D;
    const me = this.selfId;
    const others = this.playerList().filter((p) => p.id !== me);
    if (others.length) {
      const u: Record<string, any> = { [`players/${me}`]: null, [`st/${me}`]: null };
      if (this.host === me) u.host = others[0].id;
      D.update(this.ref(), u).catch(() => {});
    } else {
      D.remove(this.ref()).catch(() => {});
    }
  }
}
