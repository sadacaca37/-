/**
 * 오늘의 연습 보고 (학생 → 선생님)
 *  - 학생: 연습을 마치고 [선생님께 보내기] → 오늘 연습 요약이 선생님께 감
 *  - 선생님: 마스터 관리실 '받은 보고'에서 날짜별로 모아 보고 [확인]
 *  - 저장: 모아팡 Firebase 'taja_reports/{학생}_{날짜}' (서버가 꺼져도 지워지지 않음)
 */
import { collection, doc, getCountFromServer, getDoc, getDocs, onSnapshot, query, setDoc, where, writeBatch } from 'firebase/firestore';
import type { UserSession } from '../types';
import { activityTracker, dayActive, dayKey, dayKeys, dayKeySets, daySeconds, daySets } from './activityLog';
import { readLocalActivity } from './studentActivity';
import { markMyReportsChecked, rememberMyReport } from './serverHeal';
import { fs, isTeacherUser, parseUserId, errText } from './moaFirebase';

export interface ReportSummary {
  /** 끝낸 세트 (자리 연습 3번 = 1세트) */
  sets: number;
  /** 끝낸 횟수 (자리 연습은 1번씩) */
  rounds?: number;
  /** 자리 연습 세트 (같은 자리 3번 = 1세트) */
  keySets?: number;
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

const COL = 'taja_reports';
const MY_REPORTS_PREFIX = 'typang_my_reports_';
const reportId = (userId: string, day: string) => `${userId}_${day}`;

function myLocal(userId: string): DailyReport[] {
  try {
    const v = JSON.parse(localStorage.getItem(MY_REPORTS_PREFIX + userId) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
const toMine = (x: DailyReport): MyReport => ({ day: x.day, sentAt: x.sentAt, checkedAt: x.checkedAt || 0, sets: x.summary?.sets || 0, keys: x.summary?.keys || 0 });

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
      sets: daySets(d),
      rounds: d?.n || 0,
      keySets: dayKeySets(d),
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
  const p = parseUserId(user.id);
  if (!p) return { success: false, message: '모아팡에서 방번호와 이름으로 들어온 학생만 보낼 수 있어요.' };
  // 함께 쓰는 선생님(반 문서에 owner가 있는 반)은 아직 타자팡 보고함이 없어서, 보고는 주 선생님 반만 받는다
  try {
    const c = await getDoc(doc(fs, 'classes', p.cid));
    if (c.exists() && (c.data() as any).owner) return { success: false, message: '우리 반 선생님은 아직 타자팡 보고 받기를 쓰지 않아요. 연습은 그대로 계속할 수 있어요!' };
  } catch {}
  const report: DailyReport & { cid: string; key: string } = {
    id: reportId(user.id, day),
    userId: user.id,
    cid: p.cid,
    key: p.key,
    name: user.name,
    grade: user.grade || 0,
    day,
    sentAt: Date.now(),
    checkedAt: 0,
    note: String(note || '').slice(0, 120),
    summary,
  };
  try {
    await setDoc(doc(fs, COL, report.id), report);
    rememberMyReport(report); // 이 컴퓨터에도 사본 (지난 보고 목록용)
    window.dispatchEvent(new Event('daily-report-updated'));
    return { success: true, report };
  } catch (e) {
    return { success: false, message: errText(e) };
  }
}

/* 학생: 오늘 보고는 실시간으로 지켜보고(선생님이 확인하면 바로 표시), 지난 보고는 가끔만 새로 읽음 */
let watch: { id: string; unsub: () => void; data: DailyReport | null; ready: Promise<void> } | null = null;
const fullReadAt = new Map<string, number>();
const FULL_EVERY_MS = 30 * 60 * 1000;

function watchToday(userId: string, day: string) {
  const id = reportId(userId, day);
  if (watch?.id === id) return watch;
  watch?.unsub();
  let done: () => void = () => {};
  const w = { id, unsub: () => {}, data: null as DailyReport | null, ready: new Promise<void>((r) => (done = r)) };
  w.unsub = onSnapshot(
    doc(fs, COL, id),
    (snap) => {
      const before = w.data?.checkedAt || 0;
      w.data = snap.exists() ? (snap.data() as DailyReport) : null;
      done();
      if ((w.data?.checkedAt || 0) !== before) window.dispatchEvent(new Event('daily-report-updated'));
    },
    () => done(),
  );
  watch = w;
  return w;
}

/** 학생: 내가 최근에 보낸 보고 (보냈는지 · 선생님이 확인했는지) */
export async function fetchMyReports(userId: string): Promise<MyReport[]> {
  if (!parseUserId(userId)) return [];
  const today = dayKey();
  const w = watchToday(userId, today);
  await Promise.race([w.ready, new Promise((r) => setTimeout(r, 4000))]);
  const byDay = new Map<string, DailyReport>();
  for (const x of myLocal(userId)) if (x?.day) byDay.set(x.day, x);
  // 지난 2주 보고의 '확인' 표시는 30분에 한 번만 새로 읽음
  if (Date.now() - (fullReadAt.get(userId) || 0) > FULL_EVERY_MS) {
    fullReadAt.set(userId, Date.now());
    const days = [...byDay.keys()].filter((d) => d !== today).sort().slice(-14);
    const got = await Promise.all(days.map((d) => getDoc(doc(fs, COL, reportId(userId, d))).catch(() => null)));
    for (const g of got) if (g?.exists()) byDay.set((g.data() as DailyReport).day, g.data() as DailyReport);
  }
  if (w.data) byDay.set(today, w.data);
  else byDay.delete(today);
  const list = [...byDay.values()].sort((a, b) => b.sentAt - a.sentAt).map(toMine);
  markMyReportsChecked(userId, list);
  return list;
}

export interface InboxResult {
  fromServer: boolean;
  error?: string;
  reports: DailyReport[];
}

/** 선생님: 받은 보고 */
export async function fetchReports(days = 62): Promise<InboxResult> {
  if (!isTeacherUser()) return { fromServer: true, error: '선생님 계정으로 로그인해 주세요.', reports: [] };
  try {
    const since = dayKey(Date.now() - days * 86400000);
    const snap = await getDocs(query(collection(fs, COL), where('day', '>=', since)));
    return { fromServer: true, reports: snap.docs.map((d) => d.data() as DailyReport).sort((a, b) => b.sentAt - a.sentAt) };
  } catch (e) {
    return { fromServer: true, error: errText(e), reports: [] };
  }
}

/** 선생님: 받은 보고를 실시간으로 (처음 한 번 읽고, 그 뒤로는 바뀐 보고만 받아서 읽기 수가 적음) */
export function watchReports(days: number, cb: (r: InboxResult) => void): () => void {
  if (!isTeacherUser()) {
    cb({ fromServer: true, error: '선생님 계정으로 로그인해 주세요.', reports: [] });
    return () => {};
  }
  const since = dayKey(Date.now() - days * 86400000);
  return onSnapshot(
    query(collection(fs, COL), where('day', '>=', since)),
    (snap) => cb({ fromServer: true, reports: snap.docs.map((d) => d.data() as DailyReport).sort((a, b) => b.sentAt - a.sentAt) }),
    (e) => cb({ fromServer: true, error: errText(e), reports: [] }),
  );
}

/** 선생님: 확인 표시 */
export async function checkReports(target: { ids?: string[]; all?: boolean }, checked = true): Promise<boolean> {
  if (!isTeacherUser()) return false;
  try {
    let ids = target.ids || [];
    if (target.all) ids = (await getDocs(query(collection(fs, COL), where('checkedAt', '==', 0)))).docs.map((d) => d.id);
    const at = checked ? Date.now() : 0;
    for (let i = 0; i < ids.length; i += 400) {
      const b = writeBatch(fs);
      for (const id of ids.slice(i, i + 400)) b.update(doc(fs, COL, id), { checkedAt: at });
      await b.commit();
    }
    window.dispatchEvent(new Event('daily-report-updated'));
    return true;
  } catch {
    return false;
  }
}

/** 선생님: 아직 확인하지 않은 보고 수 (관리실 버튼의 숫자) */
export async function fetchUncheckedCount(): Promise<number> {
  if (!isTeacherUser()) return 0;
  try {
    const c = await getCountFromServer(query(collection(fs, COL), where('checkedAt', '==', 0)));
    return c.data().count;
  } catch {
    return 0;
  }
}
