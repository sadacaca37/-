import { TamagotchiState, RoomDecorState, AnimalPetType, TamagotchiThemeType } from '../types';
import { pointsManager } from './pointsManager';

export const INITIAL_TAMAGOTCHI_STATE: TamagotchiState = {
  name: '초롱이',
  petType: 'shiba',
  level: 1,
  exp: 0,
  maxExp: 100,
  happiness: 80,
  hunger: 70,
  stress: 10,
  cleanliness: 90,
  totalMissionsSuccess: 0,
  totalMissionsFailed: 0,
  mood: 'happy',
  lastFed: Date.now(),
  lastPlayed: Date.now(),
  homeTheme: 'warm_living',
  unlockedThemes: ['warm_living'],
  practicePoints: 200, // Initial starter points to let students try decorating!
  unlockedDecors: [
    // Free default items
    'warm_cream',
    'wood_oak',
    'sunny_sky',
    'circle_sun',
    'cozy_sofa',
    'family_photo',
    'play_ball',
    'warm_pendant',
    'none',
  ],
  roomDecor: {
    wallpaper: 'warm_cream',
    flooring: 'wood_oak',
    rug: 'circle_sun',
    windowView: 'sunny_sky',
    wallDecor: 'family_photo',
    furniture: 'cozy_sofa',
    floorToy: 'play_ball',
    lighting: 'warm_pendant',
  },
};

const STORAGE_KEY = 'tamagotchi_animal_pet_v2';

export function getStoredTamagotchi(): TamagotchiState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_TAMAGOTCHI_STATE,
        ...parsed,
        unlockedThemes: parsed.unlockedThemes || ['warm_living'],
        unlockedDecors: parsed.unlockedDecors || INITIAL_TAMAGOTCHI_STATE.unlockedDecors,
        practicePoints: pointsManager.getBalance(),
        roomDecor: {
          ...INITIAL_TAMAGOTCHI_STATE.roomDecor!,
          ...(parsed.roomDecor || {}),
        },
      };
    }
  } catch {}
  return {
    ...INITIAL_TAMAGOTCHI_STATE,
    practicePoints: pointsManager.getBalance(),
  };
}

export function saveStoredTamagotchi(state: TamagotchiState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('tamagotchi-updated', { detail: state }));
  } catch {}
}

/**
 * Add typing practice points earned from any typing practice/game
 */
export function addTypingPracticePoints(amount: number, reason?: string): number {
  if (amount <= 0) return pointsManager.getBalance();
  
  // Credit the centralized point wallet (포인트 지급량 1/2로 감소)
  const nextPoints = pointsManager.addPoints(amount, reason || '타자 연습 완주');
  const awardedAmount = Math.max(1, Math.round(amount / 6));
  
  const current = getStoredTamagotchi();
  
  // Also slightly feed/cheer pet when user practices typing anywhere in the app!
  const nextExp = current.exp + Math.max(1, Math.round(awardedAmount / 2));
  let nextLvl = current.level;
  let nextMaxExp = current.maxExp;
  let remainingExp = nextExp;
  
  if (nextExp >= current.maxExp) {
    nextLvl += 1;
    remainingExp = nextExp - current.maxExp;
    nextMaxExp = Math.round(current.maxExp * 1.35);
  }

  const updated: TamagotchiState = {
    ...current,
    level: nextLvl,
    exp: remainingExp,
    maxExp: nextMaxExp,
    happiness: Math.min(100, current.happiness + 2),
    hunger: Math.min(100, current.hunger + 1),
    stress: Math.max(0, current.stress - 2),
    practicePoints: nextPoints,
  };

  saveStoredTamagotchi(updated);

  // Dispatch point earn notification event
  window.dispatchEvent(
    new CustomEvent('typing-points-earned', {
      detail: {
        points: awardedAmount,
        total: nextPoints,
        reason: reason || '타자 연습 완주',
      },
    })
  );

  return nextPoints;
}

export function spendTypingPracticePoints(amount: number, reason?: string): boolean {
  if (amount <= 0) return true;
  const success = pointsManager.spendPoints(amount, reason || '아이템 구매');
  if (!success) return false;

  const current = getStoredTamagotchi();
  const updated: TamagotchiState = {
    ...current,
    practicePoints: pointsManager.getBalance(),
  };

  saveStoredTamagotchi(updated);
  return true;
}

