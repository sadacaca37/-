/**
 * 학습 일지 (학생별 · 날짜별 타자 연습 기록)
 *
 * - 학생이 타자를 칠 때마다 "오늘" 칸에 쌓임: 끝낸 세트 수, 친 글자 수, 연습 시간, 평균·최고 타수, 정확도
 * - 세트를 끝까지 못 쳐도, 타자 연습 화면에서 실제로 친 글자 수와 시간은 따로 쌓임
 * - 학생 자료와 함께 서버에 보관되므로, 선생님이 마스터 관리실에서 모든 학생의
 *   "오늘 쳤는지 / 이번 달 얼마나 했는지 / 진도"를 볼 수 있고 성적표도 이 실제 기록으로 만듦
 * - 최근 연습 기록(100개)은 학생이 지울 수 있지만, 이 일지는 지워지지 않음
 */
import type { PracticeHistoryRecord } from '../types';

export interface DayStat {
  /** 끝까지 친 세트 수 */
  n: number;
  /** 끝낸 세트에서 친 글자 수 */
  keys: number;
  /** 끝낸 세트에 걸린 시간(초) */
  sec: number;
  /** 평균 타수 계산용 합계 */
  cpmSum: number;
  /** 그날 최고 타수 */
  best: number;
  /** 평균 정확도 계산용 합계 */
  accSum: number;
  /** 타자 연습 화면에서 실제로 누른 글자 수(세트를 못 끝내도 쌓임) */
  k?: number;
  /** 타자 연습 화면에서 실제로 친 시간(초) */
  t?: number;
  /** 종류별 세트 수: key(자리) word(낱말) sent(짧은 글) long(긴 글) etc(지식·명곡 등) */
  m?: Record<string, number>;
}

export interface ActivityLog {
  v: 1;
  days: Record<string, DayStat>;
  lastAt?: number;
  updatedAt: number;
}

export const ACTIVITY_LOG_PREFIX = 'typang_activity_log_';
const KEEP_DAYS = 500;

const pad = (n: number) => String(n).padStart(2, '0');
export function dayKey(ts: number | Date = Date.now()): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export const monthKey = (year: number, month: number) => `${year}-${pad(month)}`;

export function modeCategory(mode?: string): 'key' | 'word' | 'sent' | 'long' | 'etc' {
  if (mode === 'key-practice') return 'key';
  if (mode === 'word-practice') return 'word';
  if (mode === 'sentence-practice') return 'sent';
  if (mode === 'long-practice') return 'long';
  return 'etc';
}

const emptyDay = (): DayStat => ({ n: 0, keys: 0, sec: 0, cpmSum: 0, best: 0, accSum: 0 });

function addRecordToDay(day: DayStat, r: Pick<PracticeHistoryRecord, 'mode' | 'cpm' | 'accuracy' | 'totalKeystrokes' | 'elapsedSeconds'>) {
  day.n += 1;
  day.keys += Math.max(0, Math.round(Number(r.totalKeystrokes) || 0));
  day.sec += Math.max(0, Math.round(Number(r.elapsedSeconds) || 0));
  day.cpmSum += Math.max(0, Math.round(Number(r.cpm) || 0));
  day.best = Math.max(day.best, Math.round(Number(r.cpm) || 0));
  day.accSum += Math.max(0, Math.min(100, Number(r.accuracy) || 0));
  const c = modeCategory(r.mode);
  day.m = day.m || {};
  day.m[c] = (day.m[c] || 0) + 1;
}

/** 기록의 날짜(학생 컴퓨터 기준). dateStr("2026.10.02 14:05")이 있으면 그것을 씀 → 서버·선생님 컴퓨터 시간대와 무관 */
function recordDay(r: { timestamp?: number; dateStr?: string }): string {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})/.exec(r.dateStr || '');
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return dayKey(r.timestamp || Date.now());
}

/** 일지에 없는 날짜를 연습 기록에서 채워 넣음 (일지가 생기기 전에 한 연습) */
export function mergeHistoryIntoDays(days: Record<string, DayStat>, records: PracticeHistoryRecord[] | undefined | null): Record<string, DayStat> {
  if (!records?.length) return days;
  const out: Record<string, DayStat> = { ...days };
  const fresh = new Set<string>();
  for (const r of records) {
    const k = recordDay(r);
    if (out[k] && out[k].n > 0 && !fresh.has(k)) continue; // 일지에 이미 있는 날은 그대로 둠
    if (!fresh.has(k)) {
      out[k] = { ...emptyDay(), k: out[k]?.k, t: out[k]?.t };
      fresh.add(k);
    }
    addRecordToDay(out[k], r);
  }
  return out;
}

export function parseActivityLog(raw: string | null | undefined): ActivityLog | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v && typeof v === 'object' && v.days && typeof v.days === 'object') return v as ActivityLog;
  } catch {}
  return null;
}

function historyOf(userId: string): PracticeHistoryRecord[] {
  try {
    const v = JSON.parse(localStorage.getItem(`typang_history_user_${userId}`) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

/** 이 브라우저에 있는 학생 일지 (없으면 예전 연습 기록으로 처음 한 번 만들어 줌) */
export function readActivityLog(userId: string): ActivityLog {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(ACTIVITY_LOG_PREFIX + userId);
  } catch {}
  const parsed = parseActivityLog(raw);
  if (parsed) return parsed;
  const records = historyOf(userId);
  const days = mergeHistoryIntoDays({}, records);
  return { v: 1, days, lastAt: records.reduce((a, r) => Math.max(a, r.timestamp || 0), 0) || undefined, updatedAt: Date.now() };
}

function writeActivityLog(userId: string, log: ActivityLog) {
  const keys = Object.keys(log.days).sort();
  if (keys.length > KEEP_DAYS) for (const k of keys.slice(0, keys.length - KEEP_DAYS)) delete log.days[k];
  log.updatedAt = Date.now();
  try {
    localStorage.setItem(ACTIVITY_LOG_PREFIX + userId, JSON.stringify(log));
  } catch {}
}

/** 세트를 끝까지 쳤을 때 (연습 기록 저장과 함께 호출) */
export function logPracticeRecord(r: PracticeHistoryRecord) {
  if (!r?.userId || r.userId === 'guest') return;
  const log = readActivityLog(r.userId);
  const k = dayKey(r.timestamp || Date.now());
  const day = (log.days[k] = log.days[k] || emptyDay());
  addRecordToDay(day, r);
  log.lastAt = r.timestamp || Date.now();
  writeActivityLog(r.userId, log);
}

/* ------------------------------------------------------------------------
 * 실제로 친 글자 수·시간 재기 (세트를 못 끝내도 "오늘 쳤다"가 남도록)
 * ---------------------------------------------------------------------- */
const TYPING_MODES = new Set([
  'key-practice',
  'word-practice',
  'sentence-practice',
  'long-practice',
  'knowledge-hub',
  'capital-journey',
  'joseon-journey',
  'lyrics-challenge',
  'python-coding',
  'transcription-challenge',
  'word-crush',
  'mole-game',
  'rain-game',
  'shortcut-quiz',
]);

class ActivityTracker {
  private userId = '';
  private mode = '';
  private pendingKeys = 0;
  private pendingSec = 0;
  private lastKeyAt = 0;
  private timer: number | null = null;
  private attached = false;

  /** 지금 로그인한 학생과 보고 있는 화면을 알려 줌 (선생님·로그아웃 상태는 재지 않음) */
  public setContext(userId: string | undefined | null, mode: string) {
    const next = userId || '';
    if (next !== this.userId) this.flush();
    this.userId = next;
    this.mode = mode;
    this.attach();
  }

  private attach() {
    if (this.attached || typeof window === 'undefined') return;
    this.attached = true;
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('pagehide', this.flush);
    window.addEventListener('beforeunload', this.flush);
    this.timer = window.setInterval(this.flush, 10000);
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.userId || !TYPING_MODES.has(this.mode)) return;
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    // 글자·숫자·기호·스페이스·엔터·지우기만 셈 (한글 조합 중에는 key 가 'Process' 로 옴)
    const k = e.key;
    if (!(k.length === 1 || k === 'Process' || k === 'Enter' || k === 'Backspace')) return;
    const now = Date.now();
    if (this.lastKeyAt) {
      const gap = (now - this.lastKeyAt) / 1000;
      if (gap > 0 && gap <= 20) this.pendingSec += gap; // 20초 넘게 쉬면 쉰 시간은 빼고 셈
    }
    this.lastKeyAt = now;
    this.pendingKeys += 1;
  };

  public flush = () => {
    if (!this.userId || (!this.pendingKeys && this.pendingSec < 1)) return;
    const log = readActivityLog(this.userId);
    const k = dayKey();
    const day = (log.days[k] = log.days[k] || emptyDay());
    day.k = (day.k || 0) + this.pendingKeys;
    day.t = Math.round((day.t || 0) + this.pendingSec);
    log.lastAt = Date.now();
    this.pendingKeys = 0;
    this.pendingSec = 0;
    writeActivityLog(this.userId, log);
  };
}

export const activityTracker = new ActivityTracker();

/* ------------------------------------------------------------------------
 * 요약 (선생님 화면 · 성적표가 함께 씀)
 * ---------------------------------------------------------------------- */
export interface PeriodSummary {
  /** 연습한 날 수 */
  activeDays: number;
  /** 끝낸 세트 수 */
  sets: number;
  /** 친 글자 수 (끝낸 세트 기준과 실제로 누른 수 중 큰 값) */
  keys: number;
  /** 연습 시간(분) */
  minutes: number;
  avgCpm: number;
  bestCpm: number;
  avgAcc: number;
  byMode: Record<string, number>;
}

export const dayKeys = (d: DayStat | undefined) => (d ? Math.max(d.keys || 0, d.k || 0) : 0);
export const daySeconds = (d: DayStat | undefined) => (d ? Math.max(d.sec || 0, d.t || 0) : 0);
/** 그날 타자를 쳤는지 (세트를 끝냈거나, 30글자 넘게 침) */
export const dayActive = (d: DayStat | undefined) => !!d && (d.n > 0 || (d.k || 0) >= 30);

export function summarizeDays(days: Record<string, DayStat>, filter: (key: string) => boolean): PeriodSummary {
  let activeDays = 0,
    sets = 0,
    keys = 0,
    sec = 0,
    cpmSum = 0,
    best = 0,
    accSum = 0;
  const byMode: Record<string, number> = {};
  for (const [k, d] of Object.entries(days)) {
    if (!filter(k) || !d) continue;
    if (dayActive(d)) activeDays += 1;
    sets += d.n || 0;
    keys += dayKeys(d);
    sec += daySeconds(d);
    cpmSum += d.cpmSum || 0;
    accSum += d.accSum || 0;
    best = Math.max(best, d.best || 0);
    for (const [m, c] of Object.entries(d.m || {})) byMode[m] = (byMode[m] || 0) + (c || 0);
  }
  return {
    activeDays,
    sets,
    keys,
    minutes: Math.round(sec / 60),
    avgCpm: sets ? Math.round(cpmSum / sets) : 0,
    bestCpm: best,
    avgAcc: sets ? Math.round((accSum / sets) * 10) / 10 : 0,
    byMode,
  };
}

export const summarizeMonth = (days: Record<string, DayStat>, year: number, month: number) => {
  const p = monthKey(year, month) + '-';
  return summarizeDays(days, (k) => k.startsWith(p));
};

/** 오늘부터 거꾸로 n일의 날짜 키 (오래된 날 → 오늘 순서) */
export function lastNDayKeys(n: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)));
  return out;
}
