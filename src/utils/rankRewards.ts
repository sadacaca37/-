/**
 * 주간 랭킹 보상 (학년별 짧은 글 최고 타수 1등 500P · 2등 200P · 3등 100P)
 *  - 선생님(마스터)이 타자팡에 들어오면 지난주(월~일) 보상을 아직 안 줬는지 보고 자동으로 줌
 *  - 순위: 학생 자료에 남은 '그 주 짧은 글 최고 타수' (같으면 정확도 높은 순)
 *  - 주는 방법: 포인트 선물(tajaGifts) → 학생 화면에 '선물 도착' 창
 *  - 준 기록: config/taja.rankPaid.{주} = { at, winners } (학생도 읽어서 명예의 전당에 지난주 1~3등을 보여 줌)
 */
import { collectionGroup, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { fs, isTeacherUser, userIdOf } from './moaFirebase';
import { typangApi } from './apiClient';
import { sendGift } from './tajaGifts';
import { weekKey, weekStartMs, weekLabel, WEEK_BEST_PREFIX, WeekBest } from './weekBest';

export const RANK_POINTS = [500, 200, 100];
/** 이 주부터 보상 시작 (기능을 넣은 주) */
const FIRST_WEEK = '2026-11-16';
const WEEK = 7 * 86400000;
const CONF = () => doc(fs, 'config', 'taja');

export interface RankWinner {
  id: string;
  name: string;
  grade: number;
  place: number;
  cpm: number;
  accuracy: number;
  points: number;
}

/** 아직 끝나지 않은 이번 주를 빼고, 보상할 수 있는 지난 주들 (최근 4주까지) */
function closedWeeks(now = Date.now()): string[] {
  const out: string[] = [];
  let ts = weekStartMs(weekKey(now)) - WEEK;
  for (let i = 0; i < 4; i++, ts -= WEEK) {
    const k = weekKey(ts + 3600000);
    if (k < FIRST_WEEK) break;
    out.push(k);
  }
  return out.reverse();
}

/** 선생님: 주 하나의 학년별 1~3등 계산 */
export async function computeWeekWinners(week: string): Promise<RankWinner[]> {
  const [users, prog] = await Promise.all([typangApi.getUsers(), getDocs(collectionGroup(fs, 'taja'))]);
  const from = weekStartMs(week);
  const to = from + WEEK;
  const best = new Map<string, WeekBest>();
  prog.docs.forEach((d) => {
    const st = d.ref.parent.parent;
    const cid = st?.parent?.parent?.id;
    if (d.id !== 'progress' || !st || !cid) return;
    const id = userIdOf(cid, st.id);
    let data: Record<string, string> = {};
    try {
      data = JSON.parse((d.data() as any).json || '{}');
    } catch {
      return;
    }
    let b: WeekBest | undefined;
    try {
      b = (JSON.parse(data[WEEK_BEST_PREFIX + id] || '{}') || {})[week];
    } catch {}
    // 예전 기록(연습 기록의 짧은 글)도 함께 봄
    try {
      const hist: any[] = JSON.parse(data[`typang_history_user_${id}`] || '[]');
      for (const r of hist) {
        if (r?.mode !== 'sentence-practice' || !(r.timestamp >= from && r.timestamp < to)) continue;
        const cpm = Number(r.cpm) || 0;
        if (cpm > 0 && cpm <= 1200 && (!b || cpm > b.cpm || (cpm === b.cpm && r.accuracy > b.accuracy))) b = { cpm, accuracy: Number(r.accuracy) || 0, ts: r.timestamp };
      }
    } catch {}
    if (b && b.cpm > 0) best.set(id, b);
  });
  const winners: RankWinner[] = [];
  for (let g = 1; g <= 6; g++) {
    const list = users
      .filter((u) => u.role !== 'master' && u.isApproved && Number(u.grade) === g && best.has(u.id))
      .map((u) => ({ u, b: best.get(u.id)! }))
      .sort((a, b) => b.b.cpm - a.b.cpm || b.b.accuracy - a.b.accuracy || a.b.ts - b.b.ts)
      .slice(0, 3);
    list.forEach(({ u, b }, i) => winners.push({ id: u.id, name: u.name, grade: g, place: i + 1, cpm: b.cpm, accuracy: b.accuracy, points: RANK_POINTS[i] }));
  }
  return winners;
}

/** 선생님이 들어올 때: 아직 안 준 지난 주 보상을 줌. 준 주의 수와 받은 학생 수 */
export async function payWeeklyRankRewards(): Promise<{ weeks: string[]; count: number }> {
  if (!isTeacherUser()) return { weeks: [], count: 0 };
  const snap = await getDoc(CONF());
  const paid = (snap.exists() && (snap.data() as any).rankPaid) || {};
  const done: string[] = [];
  let count = 0;
  for (const week of closedWeeks()) {
    if (paid[week]) continue;
    const winners = await computeWeekWinners(week);
    // 먼저 '줬음'을 적어 두어 두 번 주지 않게
    await setDoc(CONF(), { rankPaid: { [week]: { at: Date.now(), winners: winners.map(({ id: _id, ...w }) => w) } } }, { merge: true });
    for (const w of winners) {
      const r = await sendGift([w.id], w.points, `🏆 ${weekLabel(week)} 주간 랭킹 ${w.grade}학년 ${w.place}등!`);
      if (r.success) count++;
    }
    done.push(week);
  }
  return { weeks: done, count };
}

/** 누구나: 가장 최근에 보상한 주와 학년별 1~3등 */
export async function readLastRankWinners(): Promise<{ week: string; winners: Omit<RankWinner, 'id'>[] } | null> {
  try {
    const snap = await getDoc(CONF());
    const paid = (snap.exists() && (snap.data() as any).rankPaid) || {};
    const week = Object.keys(paid).sort().pop();
    if (!week) return null;
    return { week, winners: Array.isArray(paid[week]?.winners) ? paid[week].winners : [] };
  } catch {
    return null;
  }
}
