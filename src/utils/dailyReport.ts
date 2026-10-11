/**
 * 오늘의 연습 보고 (학생 → 선생님)
 *  - 학생: 연습을 마치고 [선생님께 보내기] → 오늘 연습 요약이 선생님께 감
 *  - 선생님: 마스터 관리실 '받은 보고'에서 날짜별로 모아 보고 [확인]
 *  - 서버가 없는 미리보기에서는 이 브라우저에만 저장
 */
import type { UserSession } from '../types';
import { typangApi } from './apiClient';
import { activityTracker, dayActive, dayKey, dayKeys, daySeconds } from './activityLog';
import { readLocalActivity } from './studentActivity';
import { markMyReportsChecked, rejoinMembers, rememberMyReport } from './serverHeal';

export interface ReportSummary {
  sets: number;
  keys: number;
  minutes: number;
  avgCpm: number;
  bestCpm: number;
  avgAcc: number;
  byMode: Record<string, number>;
  questPercent: number;
  /** 단계별 [끝낸 코스, 전체 코스] */
  quest: Record<string, [number, number]>;
}

export interface DailyReport {
  id: string;
  userId: string;
  name: string;
  grade: number;
  day: string;
  sentAt: number;
  checkedAt: number;
  note: string;
  summary: ReportSummary;
}

export interface MyReport {
  day: string;
  sentAt: number;
  checkedAt: number;
  sets: number;
  keys: number;
}

const LOCAL_KEY = 'typang_daily_reports_local';

function localAll(): DailyReport[] {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function localSave(list: DailyReport[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(-500)));
  } catch {}
}

const isJson = (r: Response) => (r.headers.get('content-type') || '').includes('application/json');

/** 오늘 연습 요약 (이 브라우저의 학습 일지에서) */
export function buildTodaySummary(userId: string): { day: string; active: boolean; summary: ReportSummary } {
  activityTracker.flush(); // 방금까지 친 것도 포함
  const act = readLocalActivity(userId);
  const day = dayKey();
  const d = act.days[day];
  const quest: Record<string, [number, number]> = {};
  for (const [m, q] of Object.entries(act.quest)) quest[m] = [q.done, q.total];
  return {
    day,
    active: dayActive(d),
    summary: {
      sets: d?.n || 0,
      keys: dayKeys(d),
      minutes: Math.round(daySeconds(d) / 60),
      avgCpm: d && d.n ? Math.round(d.cpmSum / d.n) : 0,
      bestCpm: d?.best || 0,
      avgAcc: d && d.n ? Math.round((d.accSum / d.n) * 10) / 10 : 0,
      byMode: { ...(d?.m || {}) },
      questPercent: act.questPercent,
      quest,
    },
  };
}

/** 학생: 오늘의 연습을 선생님께 보내기 */
export async function sendTodayReport(user: UserSession, note: string): Promise<{ success: boolean; message?: string; report?: DailyReport }> {
  const { day, active, summary } = buildTodaySummary(user.id);
  if (!active) return { success: false, message: '오늘 친 타자가 아직 없어요. 연습을 하고 나서 보내 주세요.' };
  try {
    const send = () =>
      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, day, summary, note }),
      });
    let r = await send();
    // 서버가 새로 켜져 학생 명단이 비어 있으면 회원증으로 되살리고 한 번 더
    if (r.status === 400 && isJson(r) && (await rejoinMembers()) > 0) r = await send();
    if (isJson(r)) {
      const j = await r.json();
      if (j?.success) {
        if (j.report) rememberMyReport(j.report); // 서버가 비워져도 다시 올릴 수 있게 사본 보관
        window.dispatchEvent(new Event('daily-report-updated'));
        return { success: true, report: j.report };
      }
      if ('success' in (j || {})) return { success: false, message: j.message || '보내지 못했어요. 잠시 뒤 다시 해 주세요.' };
    }
  } catch {}
  // 서버 없는 미리보기
  const id = `${user.id}_${day}`;
  const list = localAll().filter((x) => x.id !== id);
  const report: DailyReport = { id, userId: user.id, name: user.name, grade: user.grade || 0, day, sentAt: Date.now(), checkedAt: 0, note: note.slice(0, 120), summary };
  localSave([...list, report]);
  window.dispatchEvent(new Event('daily-report-updated'));
  return { success: true, report };
}

/** 학생: 내가 최근에 보낸 보고 (보냈는지 · 선생님이 확인했는지) */
export async function fetchMyReports(userId: string): Promise<MyReport[]> {
  try {
    const r = await fetch(`/api/reports/mine?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
    if (isJson(r)) {
      const j = await r.json();
      if (j?.success && Array.isArray(j.reports)) {
        markMyReportsChecked(userId, j.reports);
        return j.reports;
      }
    }
  } catch {}
  return localAll()
    .filter((x) => x.userId === userId)
    .map((x) => ({ day: x.day, sentAt: x.sentAt, checkedAt: x.checkedAt, sets: x.summary.sets, keys: x.summary.keys }));
}

export interface InboxResult {
  fromServer: boolean;
  error?: string;
  reports: DailyReport[];
}

/** 선생님: 받은 보고 */
export async function fetchReports(days = 62): Promise<InboxResult> {
  try {
    const r = await fetch(`/api/reports?days=${days}`, { headers: { 'x-master-key': typangApi.getMasterKey() }, cache: 'no-store' });
    if (isJson(r)) {
      const j = await r.json();
      if (j?.success && Array.isArray(j.reports)) return { fromServer: true, reports: j.reports };
      if (r.status === 403) return { fromServer: true, error: j?.message || '마스터 관리실에 다시 로그인해 주세요.', reports: [] };
    }
  } catch {}
  return { fromServer: false, reports: localAll().sort((a, b) => b.sentAt - a.sentAt) };
}

/** 선생님: 확인 표시 */
export async function checkReports(target: { ids?: string[]; all?: boolean }, checked = true): Promise<boolean> {
  try {
    const r = await fetch('/api/reports/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-master-key': typangApi.getMasterKey() },
      body: JSON.stringify({ ...target, checked }),
    });
    if (isJson(r)) {
      const j = await r.json();
      if (j && 'success' in j) {
        window.dispatchEvent(new Event('daily-report-updated'));
        return !!j.success;
      }
    }
  } catch {}
  const ids = new Set(target.ids || []);
  localSave(localAll().map((x) => (target.all ? (x.checkedAt ? x : { ...x, checkedAt: Date.now() }) : ids.has(x.id) ? { ...x, checkedAt: checked ? Date.now() : 0 } : x)));
  window.dispatchEvent(new Event('daily-report-updated'));
  return true;
}

/** 선생님: 아직 확인하지 않은 보고 수 (관리실 버튼의 숫자) */
export async function fetchUncheckedCount(): Promise<number> {
  try {
    const r = await fetch('/api/reports/count', { headers: { 'x-master-key': typangApi.getMasterKey() }, cache: 'no-store' });
    if (isJson(r)) {
      const j = await r.json();
      if (j?.success) return Number(j.unchecked) || 0;
      if ('success' in (j || {})) return 0;
    }
  } catch {}
  return localAll().filter((x) => !x.checkedAt).length;
}
