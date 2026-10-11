/**
 * 서버 되살리기 (학생 컴퓨터 쪽)
 *
 * AI 스튜디오에 올린 서버는 한동안 아무도 쓰지 않으면 꺼졌다가, 다시 켜질 때 저장해 둔 파일이 모두 사라진 '빈 서버'로 켜짐.
 * 예전에는 선생님 컴퓨터가 들어와야만 복원됐고, 명예의 전당은 아예 백업에 없어서 매번 사라졌음.
 *
 * 그래서 학생 컴퓨터도 자기 것을 기억해 두었다가, 서버가 새로 켜진 것을 알아채면 다시 올려 줌:
 *  1) 회원증  : 로그인할 때 서버가 봉인해서 준 회원증 → 빈 서버에 내밀면 그 학생이 명단에 다시 생김
 *  2) 명예의 전당 : 내가 세운 기록 + 마지막으로 본 순위표 → 서버와 합침
 *  3) 학습 자료 : progressSync 로 다시 올림
 *  4) 선생님께 보낸 보고 : 최근 것 다시 올림
 *  + 화면이 열려 있는 동안 몇 분마다 접속 신호를 보내 수업 중에는 서버가 잠들지 않게 함
 */
import type { LeaderboardEntry } from '../types';

const PASS_PREFIX = 'typang_member_pass_';
const MY_LB_PREFIX = 'typang_my_lb_';
const MY_REPORTS_PREFIX = 'typang_my_reports_';
const BOARD_KEY = 'typang_leaderboard';
const BOOT_KEY = 'typang_server_boot_id';
const PING_MS = 4 * 60 * 1000;

const isJson = (r: Response) => (r.headers.get('content-type') || '').includes('application/json');

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, v: any) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}
function keysWithPrefix(prefix: string): string[] {
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) out.push(k);
    }
  } catch {}
  return out;
}

async function postJson(url: string, body: any): Promise<any | null> {
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
    if (!isJson(r)) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ 회원증 */
export function rememberMemberPass(userId: string, pass: string | undefined) {
  if (!userId || !pass) return;
  try {
    localStorage.setItem(PASS_PREFIX + userId, pass);
  } catch {}
}
export function forgetMemberPass(userId: string) {
  try {
    localStorage.removeItem(PASS_PREFIX + userId);
  } catch {}
}

/** 이 컴퓨터에 있는 회원증을 모두 서버에 내밀어, 빈 서버면 명단에 다시 올림. 되살린 학생 수를 돌려줌 */
export async function rejoinMembers(): Promise<number> {
  const keys = keysWithPrefix(PASS_PREFIX);
  if (!keys.length) return 0;
  const passes = keys.map((k) => localStorage.getItem(k) || '').filter(Boolean).slice(0, 20);
  const j = await postJson('/api/members/rejoin', { passes });
  if (!j?.success || !j.result) return 0;
  let restored = 0;
  for (const [uid, state] of Object.entries<string>(j.result)) {
    if (state === 'restored') restored++;
    if (state === 'removed') forgetMemberPass(uid); // 선생님이 지운 학생은 회원증도 버림
  }
  return restored;
}

/** 로그인한 학생: 회원증을 새로 받아 둠 (이름·학년·비밀번호가 바뀐 것도 반영) */
export async function refreshMemberPass(userId: string) {
  if (!userId || userId === 'master_admin') return;
  const j = await postJson('/api/members/pass', {});
  if (j?.success && j.memberPass) rememberMemberPass(userId, j.memberPass);
}

/* ------------------------------------------------------------- 명예의 전당 */
const kstMonth = (ts = Date.now()) => new Date(ts + 9 * 3600 * 1000).toISOString().slice(0, 7);
const VALID_ID = /^lead_[A-Za-z0-9_]{6,48}$/;

/** 새 기록 만들기: 서버와 학생 컴퓨터가 같은 기록을 알아볼 수 있게 고유 번호·시각을 붙임 */
export function makeLeaderboardEntry(base: Omit<LeaderboardEntry, 'id' | 'date'>, extra: Partial<LeaderboardEntry>): LeaderboardEntry & { ts: number } {
  const ts = Date.now();
  const d = new Date(ts + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '.');
  return { ...base, ...extra, id: `lead_${ts}_${Math.random().toString(36).slice(2, 8)}`, date: d, ts } as LeaderboardEntry & { ts: number };
}

/** 내가 세운 기록을 이 컴퓨터에도 적어 둠 (이번 달·지난달 것만, 좋은 기록 위주로) */
export function rememberMyRecord(userId: string, entry: LeaderboardEntry & { ts?: number }) {
  if (!userId) return;
  const now = kstMonth();
  const prevMonth = kstMonth(Date.now() - 32 * 86400000);
  const list = readJson<any[]>(MY_LB_PREFIX + userId, []).filter((e) => {
    const m = e?.ts ? kstMonth(e.ts) : '';
    return m === now || m === prevMonth;
  });
  if (!list.some((e) => e.id === entry.id)) list.push(entry);
  list.sort((a, b) => (b.cpm || 0) - (a.cpm || 0));
  writeJson(MY_LB_PREFIX + userId, list.slice(0, 30));
}

export function readCachedBoard(): LeaderboardEntry[] {
  const v = readJson<LeaderboardEntry[]>(BOARD_KEY, []);
  return Array.isArray(v) ? v.filter((e) => e && VALID_ID.test(String(e.id || ''))) : [];
}
export function saveCachedBoard(list: LeaderboardEntry[]) {
  writeJson(BOARD_KEY, Array.isArray(list) ? list.slice(0, 300) : []);
}

/** 이 컴퓨터가 아는 기록(내 기록 + 마지막으로 본 순위표)을 서버와 합쳐서, 합쳐진 순위표를 돌려줌 */
export async function syncLeaderboard(): Promise<LeaderboardEntry[] | null> {
  const mine: any[] = [];
  for (const k of keysWithPrefix(MY_LB_PREFIX)) mine.push(...readJson<any[]>(k, []));
  const entries = [...mine, ...readCachedBoard()].filter((e) => e && VALID_ID.test(String(e.id || ''))).slice(0, 400);
  if (!entries.length) {
    try {
      const r = await fetch('/api/leaderboard', { cache: 'no-store' });
      if (!isJson(r)) return null;
      const j = await r.json();
      if (j?.success && Array.isArray(j.leaderboard)) {
        saveCachedBoard(j.leaderboard);
        return j.leaderboard;
      }
    } catch {}
    return null;
  }
  const j = await postJson('/api/leaderboard/sync', { entries });
  if (j?.success && Array.isArray(j.leaderboard)) {
    saveCachedBoard(j.leaderboard);
    return j.leaderboard;
  }
  return null;
}

/* ----------------------------------------------------------- 선생님께 보낸 보고 */
export function rememberMyReport(report: any) {
  if (!report?.userId || !report?.day) return;
  const key = MY_REPORTS_PREFIX + report.userId;
  const limit = Date.now() - 20 * 86400000;
  const list = readJson<any[]>(key, []).filter((r) => r && r.day !== report.day && (r.sentAt || 0) >= limit);
  list.push(report);
  writeJson(key, list.slice(-20));
}
/** 서버가 알려 준 '선생님 확인' 표시를 내 사본에도 적어 둠 */
export function markMyReportsChecked(userId: string, mine: { day: string; checkedAt: number }[]) {
  const key = MY_REPORTS_PREFIX + userId;
  const list = readJson<any[]>(key, []);
  if (!list.length) return;
  let changed = false;
  for (const r of list) {
    const s = mine.find((x) => x.day === r.day);
    if (s && (s.checkedAt || 0) > (r.checkedAt || 0)) {
      r.checkedAt = s.checkedAt;
      changed = true;
    }
  }
  if (changed) writeJson(key, list);
}
export async function syncMyReports(): Promise<number> {
  const all: any[] = [];
  for (const k of keysWithPrefix(MY_REPORTS_PREFIX)) all.push(...readJson<any[]>(k, []));
  if (!all.length) return 0;
  const j = await postJson('/api/reports/sync', { reports: all.slice(-40) });
  return Number(j?.added) || 0;
}

/* --------------------------------------------------------------- 전체 묶음 */
type HealHooks = {
  /** 순위표가 새로 합쳐졌을 때 */
  onBoard?: (list: LeaderboardEntry[]) => void;
  /** 서버가 새로 켜진 것을 알아챘을 때 (학습 자료 다시 올리기 등) */
  onServerRestart?: () => void;
  /** 지금 로그인한 학생 id */
  currentUserId?: () => string;
};

class ServerHeal {
  private hooks: HealHooks = {};
  private timer: number | null = null;
  private running: Promise<void> | null = null;
  private lastRun = 0;

  start(hooks: HealHooks) {
    this.hooks = hooks;
    void this.check(true);
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => void this.check(false), PING_MS);
    const onFocus = () => {
      if (Date.now() - this.lastRun > 60 * 1000) void this.check(false);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
  }

  /** 접속 신호를 보내고, 서버가 새로 켜졌으면(또는 처음이면) 되살리기 */
  check(first: boolean): Promise<void> {
    if (this.running) return this.running;
    this.lastRun = Date.now();
    this.running = (async () => {
      let bootId = '';
      try {
        const r = await fetch('/api/ping', { cache: 'no-store' });
        if (!isJson(r)) return; // 서버 없는 미리보기
        bootId = String((await r.json())?.bootId || '');
      } catch {
        return;
      }
      let known = '';
      try {
        known = localStorage.getItem(BOOT_KEY) || '';
      } catch {}
      const restarted = !!bootId && bootId !== known;
      if (!first && !restarted) return;
      await this.healNow(restarted);
      try {
        localStorage.setItem(BOOT_KEY, bootId);
      } catch {}
    })().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  /** 회원증 → 명예의 전당 → 보고 → 학습 자료 순서로 다시 올림 */
  async healNow(restarted = true) {
    await rejoinMembers();
    const board = await syncLeaderboard();
    if (board && this.hooks.onBoard) this.hooks.onBoard(board);
    await syncMyReports();
    if (restarted && this.hooks.onServerRestart) this.hooks.onServerRestart();
    const uid = this.hooks.currentUserId?.() || '';
    if (uid) void refreshMemberPass(uid);
  }
}

export const serverHeal = new ServerHeal();
