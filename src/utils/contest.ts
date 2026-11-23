/**
 * 타자 대회
 *  - 선생님이 대회 글과 시간을 정함 → config/taja_contest (학생은 읽기만)
 *  - 학생은 대회 시간에 딱 한 번 도전 → 실시간 DB live/tajacontest/answers/{대회}/{내 uid} (한 번 쓰면 못 바꿈)
 *  - 점수 = 타수 − 오타 × 5 (높은 순, 같으면 오타 적은 순)
 *  - 대회가 끝나면 선생님 화면이 순위를 내고 1·2·3등에게 500·200·100P 선물
 */
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { get, ref, set } from 'firebase/database';
import { fs, rt, ensureUser, isTeacherUser, errText } from './moaFirebase';
import { sendGift } from './tajaGifts';
import { countKeystrokes } from './hangul';
import { netCpm } from './typingScore';

export const ERROR_PENALTY = 5;
export const CONTEST_PRIZES = [500, 200, 100];
const CONF = () => doc(fs, 'config', 'taja_contest');
const ansPath = (cid: string, uid?: string) => `live/tajacontest/answers/${cid}${uid ? `/${uid}` : ''}`;

export interface Contest {
  id: string;
  title: string;
  text: string;
  startAt: number;
  endAt: number;
  createdAt: number;
}
export interface ContestResult {
  userId: string;
  name: string;
  grade?: number;
  cpm: number;
  errors: number;
  accuracy: number;
  score: number;
  seconds: number;
  ts: number;
}
export interface ContestRanking {
  at: number;
  paid: boolean;
  ranking: (Omit<ContestResult, 'userId'> & { place: number; prize: number })[];
}

export const contestScore = (cpm: number, errors: number) => Math.max(0, Math.round(cpm - errors * ERROR_PENALTY));
export const contestLines = (text: string) =>
  String(text || '')
    .split(/\n+/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

/** 한 줄 채점: 글자마다 비교 (빠진 글자·더 친 글자도 오타) */
export function gradeLine(target: string, typed: string): { correctStrokes: number; correctChars: number; errors: number; chars: number } {
  const t = [...target];
  const y = [...typed];
  let correctStrokes = 0;
  let correctChars = 0;
  let errors = 0;
  for (let i = 0; i < Math.max(t.length, y.length); i++) {
    if (t[i] !== undefined && t[i] === y[i]) {
      correctChars++;
      correctStrokes += t[i] === ' ' ? 1 : countKeystrokes(t[i]);
    } else errors++;
  }
  return { correctStrokes, correctChars, errors, chars: t.length };
}

export function gradeContest(lines: string[], typed: string[], seconds: number) {
  let strokes = 0;
  let correct = 0;
  let errors = 0;
  let chars = 0;
  lines.forEach((l, i) => {
    const g = gradeLine(l, typed[i] || '');
    strokes += g.correctStrokes;
    correct += g.correctChars;
    errors += g.errors;
    chars += g.chars;
  });
  const cpm = netCpm(strokes, Math.max(1, seconds));
  const accuracy = chars ? Math.round((correct / chars) * 100) : 0;
  return { cpm, errors, accuracy, score: contestScore(cpm, errors) };
}

export async function readContest(): Promise<{ cur: Contest | null; results: Record<string, ContestRanking> }> {
  try {
    await ensureUser();
    const snap = await getDoc(CONF());
    const v = snap.exists() ? (snap.data() as any) : {};
    return { cur: v.cur && v.cur.id ? (v.cur as Contest) : null, results: v.results || {} };
  } catch {
    return { cur: null, results: {} };
  }
}

/** 선생님: 대회 열기 (예전 대회는 결과만 남음) */
export async function saveContest(c: Omit<Contest, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> {
  if (!isTeacherUser()) return { success: false, message: '선생님 계정으로 로그인해 주세요.' };
  if (!c.title.trim() || contestLines(c.text).length === 0) return { success: false, message: '대회 이름과 대회 글을 써 주세요.' };
  if (!(c.endAt > c.startAt)) return { success: false, message: '끝나는 시각이 시작보다 뒤여야 해요.' };
  const id = `c${Date.now().toString(36)}`;
  try {
    await setDoc(CONF(), { cur: { id, title: c.title.trim().slice(0, 40), text: String(c.text).slice(0, 3000), startAt: c.startAt, endAt: c.endAt, createdAt: Date.now() } }, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, message: errText(e) };
  }
}

/** 선생님: 지금 끝내기 */
export async function endContestNow(): Promise<boolean> {
  if (!isTeacherUser()) return false;
  try {
    await updateDoc(CONF(), { 'cur.endAt': Date.now() });
    return true;
  } catch {
    return false;
  }
}

/** 선생님: 대회 지우기 (결과 기록은 남김) */
export async function removeContest(): Promise<boolean> {
  if (!isTeacherUser()) return false;
  try {
    await updateDoc(CONF(), { cur: deleteField() });
    return true;
  } catch {
    return false;
  }
}

/** 학생: 내 결과 (이미 쳤는지) */
export async function myContestResult(cid: string): Promise<ContestResult | null> {
  try {
    const u = await ensureUser();
    const snap = await get(ref(rt, ansPath(cid, u.uid)));
    return snap.exists() ? (snap.val() as ContestResult) : null;
  } catch {
    try {
      return JSON.parse(localStorage.getItem(`taja_contest_done_${cid}`) || 'null');
    } catch {
      return null;
    }
  }
}

/** 학생: 결과 내기 (딱 한 번) */
export async function submitContest(cid: string, r: Omit<ContestResult, 'ts'>): Promise<{ success: boolean; message?: string }> {
  const rec: ContestResult = { ...r, ts: Date.now() };
  try {
    const u = await ensureUser();
    await set(ref(rt, ansPath(cid, u.uid)), rec);
    try {
      localStorage.setItem(`taja_contest_done_${cid}`, JSON.stringify(rec));
    } catch {}
    return { success: true };
  } catch (e) {
    return { success: false, message: /permission/i.test(String(e)) ? '이미 이 대회에 도전했어요. (한 번만 할 수 있어요)' : errText(e) };
  }
}

/** 선생님: 지금까지 들어온 결과 (점수 순) */
export async function readContestResults(cid: string): Promise<ContestResult[]> {
  if (!isTeacherUser()) return [];
  try {
    const snap = await get(ref(rt, ansPath(cid)));
    const v = snap.val() || {};
    return Object.values<any>(v)
      .filter((x) => x && x.name)
      .sort((a, b) => b.score - a.score || a.errors - b.errors || a.ts - b.ts) as ContestResult[];
  } catch {
    return [];
  }
}

/** 선생님: 대회가 끝났으면 순위를 내고 상(포인트)을 줌. 이미 줬으면 그대로 */
export async function finalizeContest(force = false): Promise<{ done: boolean; title?: string; winners?: string[] }> {
  if (!isTeacherUser()) return { done: false };
  const { cur, results } = await readContest();
  if (!cur) return { done: false };
  if (!force && Date.now() < cur.endAt) return { done: false };
  if (results[cur.id]?.paid) return { done: false };
  const list = await readContestResults(cur.id);
  const ranking = list.slice(0, 30).map(({ userId: _u, ...x }, i) => ({ ...x, place: i + 1, prize: CONTEST_PRIZES[i] || 0 }));
  // 먼저 '줬음'을 적어 두 번 주지 않게
  await setDoc(CONF(), { results: { [cur.id]: { at: Date.now(), paid: true, ranking, title: cur.title } } }, { merge: true });
  const winners: string[] = [];
  for (let i = 0; i < Math.min(3, list.length); i++) {
    const w = list[i];
    if (w.userId) {
      const r = await sendGift([w.userId], CONTEST_PRIZES[i], `🏁 ${cur.title} ${i + 1}등!`);
      if (r.success) winners.push(`${i + 1}등 ${w.name}`);
    }
  }
  return { done: true, title: cur.title, winners };
}
