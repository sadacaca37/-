/**
 * 짧은 글에서 250타 이상을 쳐야 긴 글 연습이 열림 (선생님 계정은 언제나 열림)
 */
import { UserSession } from '../types';

export const SHORT_TO_LONG_CPM = 250;

/** 이 학생의 짧은 글 최고 타수 (이 컴퓨터·보관 자료 기준) */
export function bestShortCpm(user: UserSession | null): number {
  const id = user?.id || 'guest';
  let best = 0;
  try {
    for (const lang of ['ko', 'en']) best = Math.max(best, parseInt(localStorage.getItem(`pangpang_best_sentence_cpm_${id}_${lang}`) || '0', 10) || 0);
    const hist: any[] = JSON.parse(localStorage.getItem(`typang_history_user_${id}`) || '[]');
    for (const r of hist) if (r?.mode === 'sentence-practice') best = Math.max(best, Number(r.cpm) || 0);
    const wk = JSON.parse(localStorage.getItem(`typang_week_best_${id}`) || '{}');
    for (const v of Object.values<any>(wk || {})) best = Math.max(best, Number(v?.cpm) || 0);
  } catch {}
  return Math.min(best, 1200);
}

export function longUnlocked(user: UserSession | null): boolean {
  if (user?.role === 'master') return true;
  return bestShortCpm(user) >= SHORT_TO_LONG_CPM;
}
