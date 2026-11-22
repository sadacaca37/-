/**
 * 선생님 → 학생 포인트 선물
 *  - 선생님이 학생을 골라 포인트를 보내면 config/taja_gifts 에 적어 둠 (선생님만 쓰기, 학생은 읽기)
 *  - 학생 화면이 30초마다 확인해서 아직 안 받은 선물을 지갑에 넣고 "선물 도착" 창을 띄움
 *  - 받은 선물 번호는 학생 자료(typang_gift_claimed_{id})에 남아 다른 컴퓨터에서도 두 번 받지 않음
 */
import { deleteField, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { fs, isTeacherUser, errText } from './moaFirebase';
import { pointsManager } from './pointsManager';
import { isSavableUser } from './session';

const REF = () => doc(fs, 'config', 'taja_gifts');
const CLAIMED = (id: string) => `typang_gift_claimed_${id}`;
const KEEP_MS = 120 * 24 * 3600 * 1000; // 넉 달 지난 선물 기록은 정리

export interface GiftArrival {
  total: number;
  notes: string[];
}

/** 선생님: 고른 학생들에게 포인트 선물 */
export async function sendGift(ids: string[], points: number, note: string): Promise<{ success: boolean; message?: string }> {
  if (!isTeacherUser()) return { success: false, message: '선생님 계정으로 로그인해 주세요.' };
  const p = Math.round(Number(points) || 0);
  if (p <= 0 || p > 100000) return { success: false, message: '선물할 포인트를 1~100,000 사이로 써 주세요.' };
  if (!ids.length) return { success: false, message: '학생을 골라 주세요.' };
  const at = Date.now();
  const gid = `g${at.toString(36)}${Math.random().toString(36).slice(2, 5)}`;
  const gift = { p, note: String(note || '').slice(0, 40), at };
  try {
    const snap = await getDoc(REF());
    if (!snap.exists()) await setDoc(REF(), { g: {} });
    const upd: Record<string, unknown> = {};
    for (const id of ids) upd[`g.${id}.${gid}`] = gift;
    // 오래된 선물 기록 정리
    const old = (snap.exists() && (snap.data() as any).g) || {};
    for (const [uid, list] of Object.entries<any>(old)) {
      for (const [k, v] of Object.entries<any>(list || {})) {
        if (Number(v?.at) < at - KEEP_MS) upd[`g.${uid}.${k}`] = deleteField();
      }
    }
    await updateDoc(REF(), upd);
    return { success: true };
  } catch (e) {
    return { success: false, message: errText(e) };
  }
}

/** 선생님: 학생별로 지금까지 보낸 선물 합계 (최근 넉 달) */
export async function readGiftTotals(): Promise<Record<string, number>> {
  try {
    const snap = await getDoc(REF());
    const g = (snap.exists() && (snap.data() as any).g) || {};
    const out: Record<string, number> = {};
    for (const [uid, list] of Object.entries<any>(g)) {
      out[uid] = Object.values<any>(list || {}).reduce((a, v) => a + (Number(v?.p) || 0), 0);
    }
    return out;
  } catch {
    return {};
  }
}

/** 학생: 아직 안 받은 선물을 지갑에 넣기. 받은 게 있으면 합계를 돌려줌 */
export async function claimGifts(userId: string): Promise<GiftArrival | null> {
  if (!userId || !isSavableUser(userId)) return null;
  let list: Record<string, any> = {};
  try {
    const snap = await getDoc(REF());
    list = (snap.exists() && (snap.data() as any).g?.[userId]) || {};
  } catch {
    return null;
  }
  let claimed: string[] = [];
  try {
    claimed = JSON.parse(localStorage.getItem(CLAIMED(userId)) || '[]');
    if (!Array.isArray(claimed)) claimed = [];
  } catch {}
  let total = 0;
  const notes: string[] = [];
  for (const [gid, v] of Object.entries(list).sort((a, b) => (a[1]?.at || 0) - (b[1]?.at || 0))) {
    if (!v || claimed.includes(gid)) continue;
    const p = Math.round(Number(v.p) || 0);
    if (p <= 0) continue;
    const note = String(v.note || '');
    pointsManager.addPoints(p, `🎁 선생님 선물${note ? ` · ${note}` : ''}`, userId);
    claimed.push(gid);
    total += p;
    if (note) notes.push(note);
  }
  if (!total) return null;
  try {
    localStorage.setItem(CLAIMED(userId), JSON.stringify(claimed.slice(-300)));
  } catch {}
  return { total, notes };
}
