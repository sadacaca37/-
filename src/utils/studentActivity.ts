/**
 * 학생별 학습 현황 불러오기
 *  - 선생님(마스터): 서버에 보관된 모든 학생의 학습 일지·연습 기록·진도
 *  - 학생 본인 / 서버 없는 미리보기: 이 브라우저에 있는 자료
 */
import type { PracticeHistoryRecord } from '../types';
import { typangApi } from './apiClient';
import { ACTIVITY_LOG_PREFIX, DayStat, mergeHistoryIntoDays, parseActivityLog } from './activityLog';
import { computeQuestProgress, QuestMode, QuestStageProgress } from './questProgress';

export interface StudentActivity {
  /** 서버에 마지막으로 보관된 시각 (0 = 보관된 자료 없음) */
  updatedAt: number;
  /** 날짜별 연습량 (일지 + 예전 연습 기록에서 채운 것) */
  days: Record<string, DayStat>;
  /** 최근 연습 기록 (최대 100개, 최신순) */
  history: PracticeHistoryRecord[];
  quest: Record<QuestMode, QuestStageProgress>;
  /** 전체 진도율(%) : 자리·낱말·짧은 글·긴 글 코스 완료 비율 */
  questPercent: number;
  points: number | null;
  /** 마지막으로 타자를 친 시각 */
  lastAt: number;
}

function build(raw: { updatedAt?: number; log?: any; quest?: any; history?: any[]; points?: number | null }): StudentActivity {
  const history: PracticeHistoryRecord[] = (Array.isArray(raw.history) ? raw.history : [])
    .filter(Boolean)
    .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
  const log = raw.log && typeof raw.log === 'object' && raw.log.days ? raw.log : null;
  const days = mergeHistoryIntoDays(log?.days || {}, history);
  const quest = computeQuestProgress(raw.quest, history);
  const modes = Object.values(quest);
  const total = modes.reduce((a, m) => a + m.total, 0);
  const done = modes.reduce((a, m) => a + m.done, 0);
  const lastAt = Math.max(Number(log?.lastAt) || 0, history[0]?.timestamp || 0);
  return {
    updatedAt: Number(raw.updatedAt) || 0,
    days,
    history,
    quest,
    questPercent: total ? Math.round((done / total) * 100) : 0,
    points: typeof raw.points === 'number' ? raw.points : null,
    lastAt,
  };
}

const parse = (k: string) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};

/** 이 브라우저에 있는 한 학생의 자료 */
export function readLocalActivity(userId: string): StudentActivity {
  let logRaw: string | null = null;
  try {
    logRaw = localStorage.getItem(ACTIVITY_LOG_PREFIX + userId);
  } catch {}
  const wallet = parse(`taja_practice_points_wallet_v2_${userId}`);
  return build({
    updatedAt: 0,
    log: parseActivityLog(logRaw),
    quest: parse(`tp_quest_done_${userId}`),
    history: parse(`typang_history_user_${userId}`) || [],
    points: typeof wallet?.points === 'number' ? wallet.points : null,
  });
}

export interface AllActivityResult {
  /** 서버에서 받았는지 (false = 서버가 없어 이 브라우저 자료만 보여 줌) */
  fromServer: boolean;
  error?: string;
  users: Record<string, StudentActivity>;
}

/** 선생님: 모든 학생의 학습 현황 */
export async function fetchAllActivity(userIds: string[]): Promise<AllActivityResult> {
  try {
    const r = await fetch('/api/activity', { headers: { 'x-master-key': typangApi.getMasterKey() }, cache: 'no-store' });
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await r.json();
      if (j?.success && j.users) {
        const users: Record<string, StudentActivity> = {};
        for (const [uid, raw] of Object.entries<any>(j.users)) users[uid] = build(raw);
        for (const id of userIds) if (id && !users[id]) users[id] = build({}); // 아직 한 번도 저장된 적 없는 학생
        return { fromServer: true, users };
      }
      if (r.status === 403) return { fromServer: true, error: j?.message || '마스터 관리실에 다시 로그인해 주세요.', users: {} };
    }
  } catch {}
  // 서버가 없는 미리보기: 이 브라우저에 있는 자료만
  const users: Record<string, StudentActivity> = {};
  for (const id of userIds) users[id] = readLocalActivity(id);
  return { fromServer: false, users };
}

/** 한 학생의 학습 현황: 선생님이면 서버에서, 아니면(본인) 이 브라우저에서 */
export async function fetchStudentActivity(userId: string, asMaster: boolean): Promise<StudentActivity> {
  if (asMaster) {
    const all = await fetchAllActivity([userId]);
    if (all.users[userId]) return all.users[userId];
    if (all.fromServer) return build({});
  }
  return readLocalActivity(userId);
}
