/**
 * 타자팡 학교 목록 (선생님이 수업하는 학교)
 *  - Firestore config/taja_schools 문서: { list: ['○○초', '△△초', ...] }
 *    · 선생님만 고칠 수 있고, 학생은 읽기만 (가입할 때 학교 고르기에 씀)
 *  - 학생마다 고른 학교는 학생 기록의 taja.school 에 저장 (가입할 때 학생이, 나중에는 선생님이 바꿈)
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { fs } from './moaFirebase';

const ref = () => doc(fs, 'config', 'taja_schools');
export const SCHOOL_MAX = 20;

let cache: { at: number; list: string[] } | null = null;

export const cleanSchool = (s: string) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, SCHOOL_MAX);

export async function readSchools(force = false): Promise<string[]> {
  if (!force && cache && Date.now() - cache.at < 15000) return cache.list;
  try {
    const snap = await getDoc(ref());
    const raw = (snap.exists() && (snap.data() as any).list) || [];
    const list = (Array.isArray(raw) ? raw : []).map(cleanSchool).filter(Boolean);
    cache = { at: Date.now(), list };
    return list;
  } catch {
    return cache?.list || [];
  }
}

/** 선생님: 학교 목록 저장 (순서 그대로) */
export async function saveSchools(list: string[]): Promise<boolean> {
  const clean = [...new Set(list.map(cleanSchool).filter(Boolean))].slice(0, 40);
  try {
    await setDoc(ref(), { list: clean, at: Date.now() });
    cache = { at: Date.now(), list: clean };
    return true;
  } catch {
    return false;
  }
}
