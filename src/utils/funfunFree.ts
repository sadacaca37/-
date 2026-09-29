/**
 * 펀펀 플레이 무료 개방 (선생님이 마스터 관리실에서 기간을 정함)
 *  - 서버가 있으면 서버 설정을 따르고, 서버가 없는 미리보기에서는 이 브라우저에 저장
 */
import { typangApi } from './apiClient';

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

export async function fetchFunfunFree(): Promise<FunfunFreeInfo> {
  try {
    const r = await fetch('/api/funfun/free', { credentials: 'same-origin' });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return readLocal();
    const j = await r.json();
    if (!j?.success) return readLocal();
    return { freeFrom: j.freeFrom || 0, freeUntil: j.freeUntil || 0, note: j.note || '', active: !!j.active };
  } catch {
    return readLocal();
  }
}

/** 선생님이 무료 개방 기간 정하기 (off: true 면 끄기) */
export async function saveFunfunFree(v: { freeFrom?: number; freeUntil?: number; note?: string; off?: boolean }): Promise<{ success: boolean; message?: string; info?: FunfunFreeInfo }> {
  try {
    const r = await fetch('/api/funfun/free', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'x-master-key': typangApi.getMasterKey() },
      body: JSON.stringify(v),
    });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('noserver');
    const j = await r.json();
    if (!j?.success) return { success: false, message: j?.message || '저장하지 못했어요.' };
    window.dispatchEvent(new Event('funfun-free-updated'));
    return { success: true, info: { freeFrom: j.freeFrom, freeUntil: j.freeUntil, note: j.note, active: j.active } };
  } catch {
    // 서버 없는 미리보기: 이 브라우저에만 저장
    try {
      if (v.off) localStorage.removeItem(LOCAL_KEY);
      else localStorage.setItem(LOCAL_KEY, JSON.stringify({ freeFrom: v.freeFrom || Date.now(), freeUntil: v.freeUntil || 0, note: v.note || '' }));
    } catch {}
    window.dispatchEvent(new Event('funfun-free-updated'));
    return { success: true, info: readLocal() };
  }
}

export function formatKDate(ms: number) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
