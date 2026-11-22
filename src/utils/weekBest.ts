/**
 * 학생별 '이번 주 짧은 글 최고 타수' (주간 랭킹 보상용)
 *  - 짧은 글 기록이 명예의 전당에 올라갈 때마다 이 주의 최고 기록을 학생 자료에 적어 둠 → 학생 자료와 함께 서버에 보관
 *  - 주는 한국 시간 월요일 0시 ~ 일요일 밤
 */
export const WEEK_BEST_PREFIX = 'typang_week_best_';
const KST = 9 * 3600 * 1000;
const DAY = 86400000;

/** 그 시각이 속한 주의 월요일 날짜 (예: '2026-11-16') */
export function weekKey(ts = Date.now()): string {
  const d = new Date(ts + KST);
  const back = (d.getUTCDay() + 6) % 7;
  const m = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - back * DAY);
  return m.toISOString().slice(0, 10);
}

/** 주 시작(월요일 0시, 한국 시간)의 ms */
export function weekStartMs(key: string): number {
  return Date.parse(`${key}T00:00:00Z`) - KST;
}

export function weekLabel(key: string): string {
  const s = new Date(Date.parse(`${key}T00:00:00Z`));
  const e = new Date(s.getTime() + 6 * DAY);
  return `${s.getUTCMonth() + 1}/${s.getUTCDate()}~${e.getUTCMonth() + 1}/${e.getUTCDate()}`;
}

export interface WeekBest {
  cpm: number;
  accuracy: number;
  ts: number;
}

/** 짧은 글 기록 하나를 이 주 최고 기록에 반영 */
export function noteWeekBest(userId: string | undefined, cpm: number, accuracy: number, ts = Date.now()) {
  if (!userId || !(cpm > 0)) return;
  const k = WEEK_BEST_PREFIX + userId;
  try {
    const all: Record<string, WeekBest> = JSON.parse(localStorage.getItem(k) || '{}') || {};
    const wk = weekKey(ts);
    const old = all[wk];
    if (!old || cpm > old.cpm || (cpm === old.cpm && accuracy > old.accuracy)) all[wk] = { cpm, accuracy, ts };
    const keep = Object.keys(all).sort().slice(-10); // 최근 10주만
    const out: Record<string, WeekBest> = {};
    keep.forEach((w) => (out[w] = all[w]));
    localStorage.setItem(k, JSON.stringify(out));
  } catch {}
}
