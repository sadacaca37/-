/** 타자 등급 (평균 타수로 정하는 동물 칭호) — 타자 기록장과 같은 기준 */
export const TIERS = [
  { min: 0, emoji: '🐢', title: '아기 거북이' },
  { min: 100, emoji: '🐰', title: '날쌘 토끼' },
  { min: 200, emoji: '🐱', title: '질풍 고양이' },
  { min: 300, emoji: '🦅', title: '바람 독수리' },
  { min: 400, emoji: '🚀', title: '번개 로켓' },
  { min: 500, emoji: '👑', title: '불꽃 타자왕' },
];

/** 이 학생의 지금 타자 등급 (연습 기록의 평균 타수) */
export function myTier(userId?: string | null): { emoji: string; title: string; avg: number } {
  let avg = 0;
  try {
    const hist: any[] = JSON.parse(localStorage.getItem(`typang_history_user_${userId || 'guest'}`) || '[]');
    if (hist.length) avg = Math.round(hist.reduce((a, r) => a + (Number(r?.cpm) || 0), 0) / hist.length);
  } catch {}
  const t = [...TIERS].reverse().find((x) => avg >= x.min) || TIERS[0];
  return { ...t, avg };
}
