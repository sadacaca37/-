/**
 * 내 기록 지키기 (학생 컴퓨터 쪽)
 *
 * 예전 AI 스튜디오 서버는 잠들었다 깨면 저장 파일이 모두 사라져서, 학생 컴퓨터가 기억해 둔 것을 다시 올려 주었음.
 * 이제는 모아팡팡 Firebase에 바로 저장되어 사라지지 않으니, 남은 일은 하나:
 *  - 인터넷이 끊겨서 명예의 전당에 못 올라간 내 기록이 있으면, 다음에 들어올 때 다시 올려 줌
 * (회원증·서버 깨우기 신호는 이제 필요 없어서 아무 일도 하지 않음)
 */
import type { LeaderboardEntry } from '../types';
import { typangApi } from './apiClient';

const MY_LB_PREFIX = 'typang_my_lb_';
const MY_REPORTS_PREFIX = 'typang_my_reports_';
const BOARD_KEY = 'typang_leaderboard';

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

/* ------------------------------------------- 예전 회원증 (이제 쓰지 않음, 화면 코드와 맞추려고 남겨 둠) */
export function rememberMemberPass(_userId: string, _pass: string | undefined) {}
export function forgetMemberPass(_userId: string) {}
export async function rejoinMembers(): Promise<number> {
  return 0;
}
export async function refreshMemberPass(_userId: string) {}

/* --------------------------------------------------------------- 명예의 전당 */
const kstMonth = (ts = Date.now()) => new Date(ts + 9 * 3600 * 1000).toISOString().slice(0, 7);
const VALID_ID = /^lead_[A-Za-z0-9_]{6,48}$/;
/** 서버와 같은 기준: 이보다 빠른 타수는 오류로 생긴 기록이라 버림 */
const MAX_CPM = 1200;
const plausible = (e: any) => !!e && VALID_ID.test(String(e.id || '')) && Number(e.cpm) > 0 && Number(e.cpm) <= MAX_CPM;

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
  if (!plausible(entry)) return;
  const list = readJson<any[]>(MY_LB_PREFIX + userId, []).filter(plausible).filter((e) => {
    const m = e?.ts ? kstMonth(e.ts) : '';
    return m === now || m === prevMonth;
  });
  if (!list.some((e) => e.id === entry.id)) list.push(entry);
  list.sort((a, b) => (b.cpm || 0) - (a.cpm || 0));
  writeJson(MY_LB_PREFIX + userId, list.slice(0, 5)); // 좋은 기록 몇 개만 (서버에도 학생마다 3개까지만 남음)
}

export function readCachedBoard(): LeaderboardEntry[] {
  const v = readJson<LeaderboardEntry[]>(BOARD_KEY, []);
  return Array.isArray(v) ? v.filter(plausible) : [];
}
export function saveCachedBoard(list: LeaderboardEntry[]) {
  writeJson(BOARD_KEY, Array.isArray(list) ? list.slice(0, 300) : []);
}

/** 명예의 전당을 새로 받고, 못 올라간 내 기록이 있으면 다시 올림 */
export async function syncLeaderboard(): Promise<LeaderboardEntry[] | null> {
  try {
    let board = await typangApi.getLeaderboard();
    const now = kstMonth();
    const have = new Set(board.map((e) => e.id));
    const mine: any[] = [];
    for (const k of keysWithPrefix(MY_LB_PREFIX)) mine.push(...readJson<any[]>(k, []));
    const missing = mine.filter(plausible).filter((e) => e.ts && kstMonth(e.ts) === now && !have.has(e.id));
    // 이번 달 순위표에 학생마다 3개까지만 남으니, 순위표보다 낮은 기록은 다시 올릴 필요 없음
    const worst = new Map<string, number>();
    for (const e of board) {
      const w = String(e.userId || e.userName);
      worst.set(w, Math.min(worst.get(w) ?? Infinity, e.cpm || 0));
    }
    const count = new Map<string, number>();
    for (const e of board) count.set(String(e.userId || e.userName), (count.get(String(e.userId || e.userName)) || 0) + 1);
    for (const e of missing.slice(0, 10)) {
      const w = String(e.userId || e.userName);
      if ((count.get(w) || 0) >= 3 && (e.cpm || 0) <= (worst.get(w) || 0)) continue;
      board = await typangApi.recordScore(e);
      count.set(w, (count.get(w) || 0) + 1);
    }
    saveCachedBoard(board);
    return board;
  } catch {
    return null;
  }
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
  return 0;
}

/* --------------------------------------------------------------- 전체 묶음 */
type HealHooks = {
  /** 순위표가 새로 합쳐졌을 때 */
  onBoard?: (list: LeaderboardEntry[]) => void;
  /** (예전 서버용) */
  onServerRestart?: () => void;
  /** 지금 로그인한 학생 id */
  currentUserId?: () => string;
};

class ServerHeal {
  private hooks: HealHooks = {};
  private running: Promise<void> | null = null;
  private lastRun = 0;
  private started = false;

  start(hooks: HealHooks) {
    this.hooks = hooks;
    void this.check(true);
    if (this.started) return;
    this.started = true;
    // 다른 창에 갔다가 돌아오면 순위표를 새로 (1분에 한 번까지만)
    const onFocus = () => {
      if (Date.now() - this.lastRun > 60 * 1000) void this.check(false);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
  }

  check(_first: boolean): Promise<void> {
    if (this.running) return this.running;
    this.lastRun = Date.now();
    this.running = this.healNow().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  async healNow(_restarted = false) {
    const board = await syncLeaderboard();
    if (board && this.hooks.onBoard) this.hooks.onBoard(board);
  }
}

export const serverHeal = new ServerHeal();
