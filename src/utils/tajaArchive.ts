/**
 * 타자팡 학생 보관함
 *  - 선생님이 학생을 '보관'하면 명단에서 빠지고 로그인할 수 없게 되지만(승인 풀림), 이름·포인트·연습 기록은 그대로 남음
 *    → 보관함에서 [되살리기]를 누르면 예전 승인 상태 그대로 명단에 돌아옴
 *  - '완전히 삭제'한 학생은 gone 에 적어 두어, 예전 엑셀 명단(학부모 전화번호)에서 저절로 다시 생기지 않게 함
 *  - Firestore config/taja_archived 문서: { a: { [학생 id]: 보관 정보 }, gone: { [회원 key]: 지운 시각 } }
 *    (config/* 는 주 선생님만 쓰기, 학생은 읽기만)
 */
import { doc, getDoc, setDoc, deleteField } from 'firebase/firestore';
import { fs } from './moaFirebase';

export interface ArchiveEntry {
  /** 보관한 시각 */
  at: number;
  name: string;
  grade?: number;
  /** 보관하기 전에 승인돼 있었는지 (되살릴 때 그대로) */
  approved: boolean;
}

const ref = () => doc(fs, 'config', 'taja_archived');

let cache: { at: number; a: Record<string, ArchiveEntry>; gone: Record<string, number> } | null = null;

export async function readArchive(force = false): Promise<{ a: Record<string, ArchiveEntry>; gone: Record<string, number> }> {
  if (!force && cache && Date.now() - cache.at < 15000) return cache;
  try {
    const snap = await getDoc(ref());
    const v = (snap.exists() && (snap.data() as any)) || {};
    cache = { at: Date.now(), a: v.a || {}, gone: v.gone || {} };
    return cache;
  } catch {
    return cache || { a: {}, gone: {} };
  }
}

/** 보관함에 넣기 */
export async function putArchive(entries: Record<string, ArchiveEntry>): Promise<boolean> {
  if (!Object.keys(entries).length) return true;
  try {
    await setDoc(ref(), { a: entries }, { merge: true });
    cache = null;
    return true;
  } catch {
    return false;
  }
}

/** 보관함에서 빼기 (되살리기·완전히 삭제) */
export async function dropArchive(ids: string[]): Promise<boolean> {
  if (!ids.length) return true;
  const a: Record<string, any> = {};
  for (const id of ids) a[id] = deleteField();
  try {
    await setDoc(ref(), { a }, { merge: true });
    cache = null;
    return true;
  } catch {
    return false;
  }
}

/** 완전히 삭제한 회원 표시 (예전 엑셀 명단에서 다시 만들어지지 않게) */
export async function markGone(memberKeys: string[]): Promise<void> {
  if (!memberKeys.length) return;
  const gone: Record<string, number> = {};
  for (const k of memberKeys) gone[k] = Date.now();
  try {
    await setDoc(ref(), { gone }, { merge: true });
    cache = null;
  } catch {}
}
