/**
 * 타팡 의견함 — 학생이 게임·타자 연습에서 불편한 점을 타팡(챗봇)에게 말하면 선생님께 감
 *
 *  - 저장: 모아팡 Firebase Firestore `taja_feedback/{학생id}_{시각}`
 *      (읽기·확인·답장·지우기는 선생님만, 학생은 자기 것만 읽음 — Firestore 규칙에 taja_feedback 한 덩어리가 있어야 바로 감)
 *  - 규칙이 아직 없거나 인터넷이 끊겨도 잃지 않게: 학생 컴퓨터의 `typang_tapang_box_{학생id}`에도 적어 둠
 *      → 이 자리는 학생 자료 보관(progressSync)에 같이 실려 가므로, 선생님 의견함이 '학생 기록에서 찾기'로 가져옴
 *      → 학생이 다음에 타팡을 열면 못 간 것을 다시 보내 봄
 */
import { collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { UserSession } from '../types';
import { ensureUser, fs, parseUserId } from './moaFirebase';
import { progressSync } from './progressSync';

export type FeedbackCat = 'game' | 'typing' | 'bug' | 'idea' | 'etc';
export type FeedbackStatus = 'new' | 'seen' | 'fixed';

export const CAT_LABEL: Record<FeedbackCat, string> = {
  game: '🎮 게임',
  typing: '⌨️ 타자 연습',
  bug: '🐞 고장·오류',
  idea: '💡 바라는 점',
  etc: '💬 그 밖에',
};
export const STATUS_LABEL: Record<FeedbackStatus, string> = {
  new: '새 의견',
  seen: '선생님이 봤어요',
  fixed: '고쳤어요',
};

export const TEXT_MAX = 300;
const COL = 'taja_feedback';
const BOX_PREFIX = 'typang_tapang_box_';

export interface FeedbackMsg {
  id: string;
  userId: string;
  cid: string;
  key: string;
  name: string;
  grade: number;
  school: string;
  cat: FeedbackCat;
  /** 어디에서 (화면 이름·방금 한 게임) */
  where: string;
  text: string;
  /** 보낸 시각 (ms) */
  at: number;
  st: FeedbackStatus;
  /** 선생님 답장 */
  reply: string;
}

/** 학생 컴퓨터에 적어 둔 내 이야기 (sent: 선생님 의견함에 들어갔는지) */
export interface MyFeedback extends FeedbackMsg {
  sent: boolean;
}

const clip = (s: unknown, n: number) => String(s ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);
const okCat = (c: any): FeedbackCat => (['game', 'typing', 'bug', 'idea', 'etc'].includes(c) ? c : 'etc');
const okSt = (s: any): FeedbackStatus => (s === 'seen' || s === 'fixed' ? s : 'new');
const toMs = (v: any) => (typeof v?.toMillis === 'function' ? v.toMillis() : Number(v) || 0);

export function canSendFeedback(u: UserSession | null): boolean {
  return !!u && u.role !== 'master' && !!parseUserId(u.id);
}

/* ---------------- 학생 컴퓨터에 적어 두기 ---------------- */
export function readMyBox(userId: string): MyFeedback[] {
  try {
    const v = JSON.parse(localStorage.getItem(BOX_PREFIX + userId) || '[]');
    return Array.isArray(v) ? v.filter((x) => x && x.id && x.text) : [];
  } catch {
    return [];
  }
}
function writeMyBox(userId: string, list: MyFeedback[]) {
  try {
    localStorage.setItem(BOX_PREFIX + userId, JSON.stringify(list.slice(-40)));
  } catch {}
}
function patchMine(userId: string, id: string, patch: Partial<MyFeedback>) {
  writeMyBox(
    userId,
    readMyBox(userId).map((m) => (m.id === id ? { ...m, ...patch } : m)),
  );
}

/** 10분에 6개까지 (장난으로 여러 번 누르는 것 막기) */
export function sentRecently(userId: string): number {
  const cut = Date.now() - 10 * 60000;
  return readMyBox(userId).filter((m) => m.at > cut).length;
}

function docData(m: FeedbackMsg) {
  return {
    id: m.id,
    userId: m.userId,
    cid: m.cid,
    key: m.key,
    name: m.name,
    grade: m.grade,
    school: m.school,
    cat: m.cat,
    where: m.where,
    text: m.text,
    at: serverTimestamp(),
    st: 'new',
    reply: '',
  };
}

/** 학생: 타팡에게 말하기 → 선생님 의견함으로 */
export async function sendFeedback(
  u: UserSession,
  input: { cat: FeedbackCat; text: string; where: string },
): Promise<{ ok: boolean; delivered: boolean; msg?: MyFeedback; error?: string }> {
  const p = parseUserId(u.id);
  if (!p || u.role === 'master') return { ok: false, delivered: false, error: '학생으로 로그인하면 보낼 수 있어요.' };
  const text = clip(input.text, TEXT_MAX);
  if (text.length < 2) return { ok: false, delivered: false, error: '두 글자 넘게 써 줘.' };
  if (sentRecently(u.id) >= 6) return { ok: false, delivered: false, error: '조금 쉬었다가 보내 줘. (10분에 6개까지)' };
  const at = Date.now();
  const msg: MyFeedback = {
    id: `${u.id}_${at}`,
    userId: u.id,
    cid: p.cid,
    key: p.key,
    name: clip(u.name, 10) || '학생',
    grade: Math.max(0, Math.min(6, Math.round(Number(u.grade) || 0))),
    school: clip(u.school, 20),
    cat: okCat(input.cat),
    where: clip(input.where, 40),
    text,
    at,
    st: 'new',
    reply: '',
    sent: false,
  };
  writeMyBox(u.id, [...readMyBox(u.id), msg]);
  const delivered = await deliver(msg);
  if (delivered) patchMine(u.id, msg.id, { sent: true });
  else void progressSync.flush(); // 학생 자료 보관함에 실려 선생님께 가도록 바로 올림
  return { ok: true, delivered, msg: { ...msg, sent: delivered } };
}

/** 인터넷이 끊기면 Firestore는 답을 끝없이 기다리므로 8초까지만 기다림 */
function within<T>(p: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => window.setTimeout(() => rej(new Error('timeout')), ms))]);
}

async function deliver(m: FeedbackMsg): Promise<boolean> {
  try {
    await within(ensureUser());
    await within(setDoc(doc(fs, COL, m.id), docData(m)));
    return true;
  } catch {
    return false;
  }
}

/** 학생: 못 간 이야기 다시 보내기 + 선생님 확인·답장 받아 오기 */
export async function refreshMine(userId: string): Promise<MyFeedback[]> {
  const list = readMyBox(userId);
  for (const m of list.slice(-12)) {
    if (!m.sent) {
      // 늦게라도 들어갔으면 그대로 두고(선생님 확인을 덮어쓰지 않게), 없으면 다시 보냄
      const got = await within(getDoc(doc(fs, COL, m.id))).catch(() => null);
      if (got?.exists()) patchMine(userId, m.id, { sent: true });
      else if (await deliver(m)) patchMine(userId, m.id, { sent: true });
      else break; // 아직 못 보내는 상태 — 다음에
      continue;
    }
    try {
      const s = await within(getDoc(doc(fs, COL, m.id)));
      if (s.exists()) {
        const v = s.data() as any;
        patchMine(userId, m.id, { st: okSt(v.st), reply: clip(v.reply, 200) });
      } else if (m.st === 'new') {
        // 선생님이 지운 이야기: 내 화면에서는 '선생님이 봤어요'로
        patchMine(userId, m.id, { st: 'seen' });
      }
    } catch {
      break; // 규칙이 아직 없으면 읽을 수 없음 — 그대로 둠
    }
  }
  return readMyBox(userId);
}

/* ---------------- 선생님 ---------------- */
function fromDoc(id: string, v: any): FeedbackMsg {
  return {
    id,
    userId: clip(v.userId, 200),
    cid: clip(v.cid, 60),
    key: clip(v.key, 200),
    name: clip(v.name, 20) || '학생',
    grade: Number(v.grade) || 0,
    school: clip(v.school, 20),
    cat: okCat(v.cat),
    where: clip(v.where, 40),
    text: clip(v.text, TEXT_MAX),
    at: toMs(v.at) || Number(String(id).split('_').pop()) || 0,
    st: okSt(v.st),
    reply: clip(v.reply, 200),
  };
}

/** 선생님: 받은 의견 실시간으로 (최근 300개) */
export function watchInbox(onList: (list: FeedbackMsg[]) => void, onError: (e: unknown) => void): () => void {
  try {
    return onSnapshot(
      query(collection(fs, COL), orderBy('at', 'desc'), limit(300)),
      (snap) => onList(snap.docs.map((d) => fromDoc(d.id, d.data()))),
      onError,
    );
  } catch (e) {
    onError(e);
    return () => {};
  }
}

export async function setFeedbackStatus(id: string, st: FeedbackStatus) {
  await updateDoc(doc(fs, COL, id), { st, doneAt: Date.now() });
}
export async function setFeedbackReply(id: string, reply: string) {
  await updateDoc(doc(fs, COL, id), { reply: clip(reply, 200), st: 'seen', doneAt: Date.now() });
}
/** 선생님이 지운 의견 (학생 기록에서 찾기로 다시 들어오지 않게) */
const DELETED_KEY = 'taja_feedback_deleted';
function deletedIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export async function removeFeedback(id: string) {
  await deleteDoc(doc(fs, COL, id));
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds().filter((x) => x !== id), id].slice(-500)));
  } catch {}
}

const SCAN_KEY = 'taja_feedback_scan_at';
export const lastScanAt = () => Number(localStorage.getItem(SCAN_KEY)) || 0;

/**
 * 선생님: 규칙이 없거나 인터넷이 끊겨 바로 못 온 이야기를 학생 자료 보관함에서 찾아 의견함으로 옮김
 *  (모든 학생 자료를 받으므로 조금 걸림 — 몇 시간에 한 번만)
 */
export async function importFromProgress(known: Set<string>): Promise<number> {
  const snap = await getDocs(collectionGroup(fs, 'taja'));
  deletedIds().forEach((id) => known.add(id));
  let added = 0;
  for (const d of snap.docs) {
    if (d.id !== 'progress') continue;
    let data: Record<string, string> = {};
    try {
      data = JSON.parse((d.data() as any).json || '{}');
    } catch {
      continue;
    }
    for (const [k, raw] of Object.entries(data)) {
      if (!k.startsWith(BOX_PREFIX)) continue;
      let list: any[] = [];
      try {
        list = JSON.parse(raw);
      } catch {}
      if (!Array.isArray(list)) continue;
      for (const m of list) {
        if (!m?.id || !m.text || m.sent || known.has(m.id)) continue;
        const v = fromDoc(String(m.id), m);
        if (!v.userId || !parseUserId(v.userId)) continue;
        known.add(v.id);
        if ((await getDoc(doc(fs, COL, v.id))).exists()) continue; // 이미 들어와 있음 (선생님 확인을 덮어쓰지 않게)
        await setDoc(doc(fs, COL, v.id), { ...docData(v), at: new Date(v.at || Date.now()) });
        added++;
      }
    }
  }
  try {
    localStorage.setItem(SCAN_KEY, String(Date.now()));
  } catch {}
  return added;
}

/** 선생님: Claude에게 붙여 넣기 좋게 글로 */
export function feedbackAsText(list: FeedbackMsg[]): string {
  const when = (t: number) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const lines = list.map((m, i) => {
    const who = `${m.name}${m.grade ? ` ${m.grade}학년` : ''}${m.school ? ` · ${m.school}` : ''}`;
    return `${i + 1}. [${CAT_LABEL[m.cat].replace(/^\S+\s/, '')}${m.where ? ` · ${m.where}` : ''}] ${m.text}  (${who}, ${when(m.at)})`;
  });
  return `타자팡 학생 의견 ${list.length}개\n${lines.join('\n')}`;
}
