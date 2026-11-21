/**
 * 펀펀 플레이 무료 개방 (선생님이 마스터 관리실에서 기간을 정함)
 *  - 모아팡팡 Firebase 'config/taja' 에 저장 (학생은 읽기만)
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { fs, isTeacherUser, ensureUser, errText } from './moaFirebase';

export interface FunfunFreeInfo {
  freeFrom: number;
  freeUntil: number;
  note: string;
  active: boolean;
}

const LOCAL_KEY = 'typang_funfun_free_local';
const EMPTY: FunfunFreeInfo = { freeFrom: 0, freeUntil: 0, note: '', active: false };

function readLocal(): FunfunFreeInfo {
  try {
    const v = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    if (!v) return EMPTY;
    const now = Date.now();
    return { freeFrom: v.freeFrom || 0, freeUntil: v.freeUntil || 0, note: v.note || '', active: v.freeUntil > now && v.freeFrom <= now };
  } catch {
    return EMPTY;
  }
}

export function isFreeActive(info: FunfunFreeInfo | null | undefined) {
  if (!info) return false;
  const now = Date.now();
  return info.freeUntil > now && info.freeFrom <= now;
}

const CONF = () => doc(fs, 'config', 'taja');
const toInfo = (v: any): FunfunFreeInfo => {
  const now = Date.now();
  const freeFrom = Number(v?.freeFrom) || 0;
  const freeUntil = Number(v?.freeUntil) || 0;
  return { freeFrom, freeUntil, note: String(v?.note || ''), active: freeUntil > now && freeFrom <= now };
};

export async function fetchFunfunFree(): Promise<FunfunFreeInfo> {
  try {
    await ensureUser();
    const snap = await getDoc(CONF());
    const info = toInfo(snap.exists() ? (snap.data() as any).funfun : null);
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(info));
    } catch {}
    return info;
  } catch {
    return readLocal();
  }
}

/** 선생님이 무료 개방 기간 정하기 (off: true 면 끄기) */
export async function saveFunfunFree(v: { freeFrom?: number; freeUntil?: number; note?: string; off?: boolean }): Promise<{ success: boolean; message?: string; info?: FunfunFreeInfo }> {
  if (!isTeacherUser()) return { success: false, message: '선생님 계정으로 로그인해 주세요.' };
  const val = v.off ? { freeFrom: 0, freeUntil: 0, note: '' } : { freeFrom: v.freeFrom || Date.now(), freeUntil: v.freeUntil || 0, note: String(v.note || '').slice(0, 60) };
  try {
    await setDoc(CONF(), { funfun: val }, { merge: true });
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(val));
    } catch {}
    window.dispatchEvent(new Event('funfun-free-updated'));
    return { success: true, info: toInfo(val) };
  } catch (e) {
    return { success: false, message: errText(e) };
  }
}

export function formatKDate(ms: number) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
