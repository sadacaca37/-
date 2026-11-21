import {
  TamagotchiState,
  TamagotchiPetId,
  TamagotchiPetRecord,
} from '../types';
import { pointsManager } from './pointsManager';
import { getTamagotchiPetDef } from '../data/tamagotchiPetsData';

export const DEFAULT_PET_ID: TamagotchiPetId = 'tori';

export function createInitialPetRecord(petId: TamagotchiPetId): TamagotchiPetRecord {
  const def = getTamagotchiPetDef(petId);
  const now = Date.now();
  return {
    petId,
    name: def.name,
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
    lastFed: now,
    lastPlayed: now,
  };
}

export const INITIAL_TAMAGOTCHI_STATE: TamagotchiState = {
  name: '토리',
  petType: 'shiba',
  selectedPetId: DEFAULT_PET_ID,
  hasChosenPet: false,
  pets: {},
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
  practicePoints: 200,
  unlockedDecors: [
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

const LEGACY_STORAGE_KEY = 'tamagotchi_animal_pet_v2';

function readLoggedInUserId(): string | null {
  try {
    const raw = localStorage.getItem('typang_current_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === 'string' && parsed.id ? parsed.id : null;
  } catch {
    return null;
  }
}

export function getTamagotchiStorageKey(userId?: string | null): string {
  const uid = userId !== undefined ? userId : readLoggedInUserId();
  return uid ? `${LEGACY_STORAGE_KEY}_${uid}` : LEGACY_STORAGE_KEY;
}

function extractActivePetRecord(state: TamagotchiState, petId: TamagotchiPetId): TamagotchiPetRecord {
  const def = getTamagotchiPetDef(petId);
  return {
    petId,
    name: state.name || def.name,
    level: state.level ?? 1,
    exp: state.exp ?? 0,
    maxExp: state.maxExp ?? 100,
    happiness: state.happiness ?? 80,
    hunger: state.hunger ?? 70,
    stress: state.stress ?? 10,
    cleanliness: state.cleanliness ?? 90,
    totalMissionsSuccess: state.totalMissionsSuccess ?? 0,
    totalMissionsFailed: state.totalMissionsFailed ?? 0,
    mood: state.mood || 'happy',
    lastFed: state.lastFed ?? Date.now(),
    lastPlayed: state.lastPlayed ?? Date.now(),
  };
}

function normalizeTamagotchiState(parsed: any): TamagotchiState {
  const selectedPetId: TamagotchiPetId =
    parsed?.selectedPetId && typeof parsed.selectedPetId === 'string'
      ? getTamagotchiPetDef(parsed.selectedPetId).id
      : DEFAULT_PET_ID;
  const def = getTamagotchiPetDef(selectedPetId);

  const hadLegacyProgress =
    (parsed?.level ?? 1) > 1 ||
    (parsed?.exp ?? 0) > 0 ||
    (parsed?.totalMissionsSuccess ?? 0) > 0 ||
    (Array.isArray(parsed?.unlockedThemes) && parsed.unlockedThemes.length > 1);

  const hasChosenPet =
    typeof parsed?.hasChosenPet === 'boolean'
      ? parsed.hasChosenPet
      : Boolean(parsed?.selectedPetId) || hadLegacyProgress;

  const existingPets: Partial<Record<TamagotchiPetId, TamagotchiPetRecord>> =
    parsed?.pets && typeof parsed.pets === 'object' ? { ...parsed.pets } : {};

  const merged: TamagotchiState = {
    ...INITIAL_TAMAGOTCHI_STATE,
    ...parsed,
    selectedPetId,
    hasChosenPet,
    name: parsed?.name && parsed.name !== '초롱이' ? parsed.name : def.name,
    unlockedThemes: parsed?.unlockedThemes || ['warm_living'],
    unlockedDecors: parsed?.unlockedDecors || INITIAL_TAMAGOTCHI_STATE.unlockedDecors,
    practicePoints: pointsManager.getBalance(),
    roomDecor: {
      ...INITIAL_TAMAGOTCHI_STATE.roomDecor!,
      ...(parsed?.roomDecor || {}),
    },
    pets: existingPets,
  };

  if (hasChosenPet && !merged.pets![selectedPetId]) {
    merged.pets = {
      ...merged.pets,
      [selectedPetId]: extractActivePetRecord(merged, selectedPetId),
    };
  }

  return merged;
}

export function getStoredTamagotchi(userId?: string | null): TamagotchiState {
  const key = getTamagotchiStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return normalizeTamagotchiState(JSON.parse(raw));
    }
    // Migrate legacy single-slot data once for returning students who already raised Tori
    if (key !== LEGACY_STORAGE_KEY) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw);
        const hadLegacyProgress =
          (legacyParsed?.level ?? 1) > 1 ||
          (legacyParsed?.exp ?? 0) > 0 ||
          (legacyParsed?.totalMissionsSuccess ?? 0) > 0 ||
          Boolean(legacyParsed?.hasChosenPet);
        if (hadLegacyProgress) {
          return normalizeTamagotchiState(legacyParsed);
        }
      }
    }
  } catch {}

  return {
    ...INITIAL_TAMAGOTCHI_STATE,
    practicePoints: pointsManager.getBalance(),
  };
}

export function saveStoredTamagotchi(
  state: TamagotchiState,
  userId?: string | null,
  silent: boolean = false
): void {
  const key = getTamagotchiStorageKey(userId);
  const activePetId = getTamagotchiPetDef(state.selectedPetId).id;
  const nextState: TamagotchiState = {
    ...state,
    selectedPetId: activePetId,
    pets: state.hasChosenPet
      ? {
          ...(state.pets || {}),
          [activePetId]: extractActivePetRecord(state, activePetId),
        }
      : state.pets || {},
  };

  try {
    localStorage.setItem(key, JSON.stringify(nextState));
    if (!silent) {
      window.dispatchEvent(new CustomEvent('tamagotchi-updated', { detail: nextState }));
    }
  } catch {}
}

/**
 * Switch to another pet while preserving the current pet's progress and restoring the target pet's saved progress.
 */
export function switchTamagotchiPet(
  current: TamagotchiState,
  nextPetId: TamagotchiPetId
): TamagotchiState {
  const prevPetId = getTamagotchiPetDef(current.selectedPetId).id;
  const updatedPets: Partial<Record<TamagotchiPetId, TamagotchiPetRecord>> = {
    ...(current.pets || {}),
  };

  if (current.hasChosenPet) {
    updatedPets[prevPetId] = extractActivePetRecord(current, prevPetId);
  }

  const targetRecord = updatedPets[nextPetId] || createInitialPetRecord(nextPetId);
  const targetDef = getTamagotchiPetDef(nextPetId);
  updatedPets[nextPetId] = {
    ...targetRecord,
    petId: nextPetId,
    name: targetRecord.name || targetDef.name,
  };

  return {
    ...current,
    selectedPetId: nextPetId,
    hasChosenPet: true,
    name: updatedPets[nextPetId]!.name,
    level: targetRecord.level,
    exp: targetRecord.exp,
    maxExp: targetRecord.maxExp,
    happiness: targetRecord.happiness,
    hunger: targetRecord.hunger,
    stress: targetRecord.stress,
    cleanliness: targetRecord.cleanliness,
    totalMissionsSuccess: targetRecord.totalMissionsSuccess,
    totalMissionsFailed: targetRecord.totalMissionsFailed,
    mood: targetRecord.mood,
    lastFed: targetRecord.lastFed,
    lastPlayed: targetRecord.lastPlayed,
    pets: updatedPets,
  };
}

/**
 * Reset only the currently selected pet back to Lv.1 egg while keeping all other pets & room unlocks intact.
 */
export function resetActiveTamagotchiPet(current: TamagotchiState): TamagotchiState {
  const activePetId = getTamagotchiPetDef(current.selectedPetId).id;
  const fresh = createInitialPetRecord(activePetId);
  return {
    ...current,
    selectedPetId: activePetId,
    hasChosenPet: true,
    name: fresh.name,
    level: fresh.level,
    exp: fresh.exp,
    maxExp: fresh.maxExp,
    happiness: fresh.happiness,
    hunger: fresh.hunger,
    stress: fresh.stress,
    cleanliness: fresh.cleanliness,
    totalMissionsSuccess: fresh.totalMissionsSuccess,
    totalMissionsFailed: fresh.totalMissionsFailed,
    mood: fresh.mood,
    lastFed: fresh.lastFed,
    lastPlayed: fresh.lastPlayed,
    pets: {
      ...(current.pets || {}),
      [activePetId]: fresh,
    },
  };
}

/**
 * Add typing practice points earned from any typing practice/game
 */
export function addTypingPracticePoints(amount: number, reason?: string): number {
  if (amount <= 0) return pointsManager.getBalance();

  const nextPoints = pointsManager.addPoints(amount, reason || '타자 연습 완주');
  const awardedAmount = Math.max(1, Math.round(amount / 6));

  const current = getStoredTamagotchi();

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
