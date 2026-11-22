/**
 * 펀펀 플레이 무료 개방 (선생님이 마스터 관리실에서 기간을 정함)
 *  - 모아팡 Firebase 'config/taja' 에 저장 (학생은 읽기만)
 */
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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

/** 지금 로그인한 학생 id (없으면 '') */
function myId(): string {
  try {
    const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
    return u?.id ? String(u.id) : '';
  } catch {
    return '';
  }
}

/** 전체 무료 개방 + 이 학생에게만 준 무료 개방을 합쳐서 하나로 */
function mergePersonal(all: any, uid: string): FunfunFreeInfo {
  const base = toInfo(all);
  const mine = uid ? all?.students?.[uid] : null;
  const pf = Number(mine?.from) || 0;
  const pu = Number(mine?.until) || 0;
  const now = Date.now();
  if (pu > now && pf <= now && (!base.active || pu > base.freeUntil)) {
    return { freeFrom: pf, freeUntil: pu, note: base.active ? base.note : '🎁 선생님이 나에게 준 무료 개방이에요!', active: true };
  }
  return base;
}

/** 선생님: 학생별 무료 개방 목록 { 학생 id: 끝나는 시각 } (끝난 것 빼고) */
export async function fetchStudentFree(): Promise<Record<string, number>> {
  try {
    const snap = await getDoc(CONF());
    const st = (snap.exists() && (snap.data() as any).funfun?.students) || {};
    const now = Date.now();
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries<any>(st)) if (Number(v?.until) > now) out[k] = Number(v.until);
    return out;
  } catch {
    return {};
  }
}

/** 선생님: 고른 학생들만 무료 개방 (until 0 이면 끄기) */
export async function saveStudentFree(ids: string[], until: number): Promise<{ success: boolean; message?: string }> {
  if (!isTeacherUser()) return { success: false, message: '선생님 계정으로 로그인해 주세요.' };
  try {
    const snap = await getDoc(CONF());
    const old = (snap.exists() && (snap.data() as any).funfun?.students) || {};
    const now = Date.now();
    const next: Record<string, { from: number; until: number }> = {};
    for (const [k, v] of Object.entries<any>(old)) if (Number(v?.until) > now) next[k] = { from: Number(v.from) || 0, until: Number(v.until) };
    for (const id of ids) {
      if (until > now) next[id] = { from: now, until };
      else delete next[id];
    }
    if (snap.exists()) await updateDoc(CONF(), { 'funfun.students': next }); // 통째로 바꿔야 끈 학생이 빠짐
    else await setDoc(CONF(), { funfun: { students: next } });
    window.dispatchEvent(new Event('funfun-free-updated'));
    return { success: true };
  } catch (e) {
    return { success: false, message: errText(e) };
  }
}

export async function fetchFunfunFree(): Promise<FunfunFreeInfo> {
  try {
    await ensureUser();
    const snap = await getDoc(CONF());
    const info = mergePersonal(snap.exists() ? (snap.data() as any).funfun : null, myId());
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
    await setDoc(CONF(), { funfun: val }, { merge: true }); // 학생별 무료 개방(students)은 그대로 남음
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
