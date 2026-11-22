/**
 * 타자팡 학생 승인 (선생님이 승인한 학생만 아이디·포인트·기록이 저장됨)
 *  - 승인 명단은 Firestore config/taja_approved 문서에 둠: { ok: { [학생 id]: 승인한 시각 } }
 *    · 선생님만 쓸 수 있고(규칙: 선생님은 모두 쓰기), 학생은 읽기만 (config/* 읽기 허용)
 *    · 홈페이지를 고쳐 올려도(업데이트) Firebase 에 남아 있으므로 승인이 풀리지 않음
 *  - 승인 전 학생: 타자 연습은 그대로 할 수 있지만 포인트·기록·명예의 전당·학생 정보는 저장하지 않음
 */
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { fs } from './moaFirebase';

const ref = () => doc(fs, 'config', 'taja_approved');

let cache: { at: number; ok: Record<string, number> } | null = null;

/** 승인 명단 전체 (선생님 화면·학생 확인 모두 사용) */
export async function readApprovals(force = false): Promise<Record<string, number>> {
  if (!force && cache && Date.now() - cache.at < 15000) return cache.ok;
  try {
    const snap = await getDoc(ref());
    const ok = (snap.exists() && (snap.data() as any).ok) || {};
    cache = { at: Date.now(), ok };
    return ok;
  } catch {
    return cache?.ok || {};
  }
}

export async function isApprovedStudent(userId: string, force = false): Promise<boolean> {
  if (!userId) return false;
  const ok = await readApprovals(force);
  return !!ok[userId];
}

/** 선생님: 승인하기 / 승인 풀기 (여러 명 한꺼번에) */
export async function setApprovals(ids: string[], on: boolean): Promise<boolean> {
  if (!ids.length) return true;
  const ok: Record<string, any> = {};
  for (const id of ids) ok[id] = on ? Date.now() : deleteField();
  try {
    await setDoc(ref(), { ok }, { merge: true });
    cache = null;
    return true;
  } catch {
    return false;
  }
}

/* ---------------- 이 컴퓨터의 학생 승인 상태 ---------------- */
const CUR = 'typang_current_user';

/** 지금 로그인한 학생의 승인 상태를 서버에서 다시 확인해 저장 (바뀌었으면 true) */
export async function refreshMyApproval(): Promise<boolean> {
  let u: any = null;
  try {
    u = JSON.parse(localStorage.getItem(CUR) || 'null');
  } catch {}
  if (!u || !u.id || u.role === 'master') return false;
  const ok = await isApprovedStudent(String(u.id), true);
  if (!!u.isApproved === ok) return false;
  try {
    const now = JSON.parse(localStorage.getItem(CUR) || 'null');
    if (!now || now.id !== u.id) return false;
    localStorage.setItem(CUR, JSON.stringify({ ...now, isApproved: ok }));
  } catch {}
  window.dispatchEvent(new CustomEvent('taja-approval-changed', { detail: { approved: ok } }));
  return true;
}
