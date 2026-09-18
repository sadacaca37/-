import { AppMode } from '../types';
import { addTypingPracticePoints } from './tamagotchiStorage';
import { soundManager } from './sound';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  rewardPoints: number;
  isClaimed: boolean;
  icon: string;
  type: 'chars' | 'game' | 'lesson';
}

export interface LastPracticeLocation {
  mode: AppMode;
  modeTitle: string;
  stageTitle?: string;
  stageId?: string | number;
  language: 'ko' | 'en';
  timestamp: number;
  cpm?: number;
  accuracy?: number;
}

const MISSIONS_KEY_PREFIX = 'typang_daily_missions_';
const LAST_PRACTICE_PREFIX = 'typang_last_practice_';

// In-memory buffering for typing character increments to prevent storage thrashing
const pendingCharsByUser: Record<string, number> = {};
let flushTimer: any = null;
let lastPracticeSaveTime: Record<string, number> = {};

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_MISSIONS_DEF: Omit<DailyMission, 'current' | 'isClaimed'>[] = [
  {
    id: 'mission_chars_500',
    title: '타자 500자 입력하기',
    description: '자리, 낱말, 짧은 글 등에서 500타 이상 타이핑하세요',
    target: 500,
    unit: '자',
    rewardPoints: 80,
    icon: '⌨️',
    type: 'chars',
  },
  {
    id: 'mission_play_game',
    title: '타자 미니게임 1회 플레이',
    description: '워드크러시, 두더지, 타자비, 단축키 퀴즈 중 1회 완주하기',
    target: 1,
    unit: '회',
    rewardPoints: 60,
    icon: '🎮',
    type: 'game',
  },
  {
    id: 'mission_complete_lesson',
    title: '타자 레슨 1개 완주하기',
    description: '자리 연습, 낱말 연습, 짧은 글 중 1개 단계를 완료하세요',
    target: 1,
    unit: '개',
    rewardPoints: 100,
    icon: '🏆',
    type: 'lesson',
  },
];

export const dailyMissionsManager = {
  getTodayKey(userId?: string): string {
    const today = getTodayString();
    return `${MISSIONS_KEY_PREFIX}${today}_${userId || 'guest'}`;
  },

  getMissions(userId?: string): DailyMission[] {
    try {
      const key = this.getTodayKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const initial: DailyMission[] = DEFAULT_MISSIONS_DEF.map((def) => ({
      ...def,
      current: 0,
      isClaimed: false,
    }));

    this.saveMissions(initial, userId);
    return initial;
  },

  saveMissions(missions: DailyMission[], userId?: string): void {
    try {
      if (!Array.isArray(missions)) return;
      const key = this.getTodayKey(userId);
      localStorage.setItem(key, JSON.stringify(missions));
      window.dispatchEvent(new CustomEvent('daily-missions-updated', { detail: missions }));
    } catch (err) {
      console.warn('Failed to save daily missions', err);
    }
  },

  // Flush any in-memory buffered character keystrokes to storage
  flushPendingProgress(userId?: string): void {
    const userKey = userId || 'guest';
    const pending = pendingCharsByUser[userKey] || 0;
    if (pending <= 0) return;

    pendingCharsByUser[userKey] = 0;
    this.applyIncrement('chars', pending, userId);
  },

  applyIncrement(type: 'chars' | 'game' | 'lesson', amount: number, userId?: string): DailyMission[] {
    const missions = this.getMissions(userId);
    let changed = false;

    const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (safeAmount <= 0) return missions;

    const updated = missions.map((m) => {
      if (m.type === type && m.current < m.target) {
        const nextVal = Math.min(m.target, m.current + safeAmount);
        if (nextVal !== m.current) {
          changed = true;
          return { ...m, current: nextVal };
        }
      }
      return m;
    });

    if (changed) {
      this.saveMissions(updated, userId);
    }
    return updated;
  },

  // Optimized increment: buffers typing character counts in memory to eliminate input keystroke load
  incrementProgress(type: 'chars' | 'game' | 'lesson', amount: number = 1, userId?: string): DailyMission[] {
    const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (safeAmount <= 0) return this.getMissions(userId);

    if (type === 'chars') {
      const userKey = userId || 'guest';
      pendingCharsByUser[userKey] = (pendingCharsByUser[userKey] || 0) + safeAmount;

      if (!flushTimer) {
        flushTimer = setTimeout(() => {
          flushTimer = null;
          dailyMissionsManager.flushPendingProgress(userId);
        }, 1500);
      }
      return this.getMissions(userId);
    }

    // Games and Lessons complete at session ends; apply immediately and flush any pending chars
    this.flushPendingProgress(userId);
    return this.applyIncrement(type, safeAmount, userId);
  },

  claimReward(missionId: string, userId?: string): { success: boolean; points: number } {
    if (!missionId) return { success: false, points: 0 };
    const missions = this.getMissions(userId);
    const mission = missions.find((m) => m.id === missionId);

    if (!mission || mission.current < mission.target || mission.isClaimed) {
      return { success: false, points: 0 };
    }

    mission.isClaimed = true;
    this.saveMissions(missions, userId);

    // Award Tamagotchi practice points
    addTypingPracticePoints(mission.rewardPoints, `일일 미션 달성 보상: ${mission.title}`);
    soundManager.playVictory();

    return { success: true, points: mission.rewardPoints };
  },

  isAllMissionsCompleted(userId?: string): boolean {
    const missions = this.getMissions(userId);
    return missions.length > 0 && missions.every((m) => m.current >= m.target);
  },

  // Save last practiced mode and stage with throttled writes during typing sessions
  saveLastPractice(
    location: Omit<LastPracticeLocation, 'timestamp'>, 
    userId?: string, 
    immediate: boolean = false
  ): void {
    try {
      if (!location || !location.mode) return;

      const userKey = userId || 'guest';
      const now = Date.now();
      const lastSave = lastPracticeSaveTime[userKey] || 0;

      // Throttle: don't write to storage more than once every 3 seconds unless immediate is true
      if (!immediate && now - lastSave < 3000) {
        return;
      }
      lastPracticeSaveTime[userKey] = now;

      const data: LastPracticeLocation = {
        mode: location.mode,
        modeTitle: String(location.modeTitle || ''),
        stageTitle: location.stageTitle ? String(location.stageTitle) : undefined,
        stageId: location.stageId !== undefined ? location.stageId : undefined,
        language: location.language === 'en' ? 'en' : 'ko',
        timestamp: now,
        cpm: typeof location.cpm === 'number' && Number.isFinite(location.cpm) ? Math.round(location.cpm) : undefined,
        accuracy: typeof location.accuracy === 'number' && Number.isFinite(location.accuracy) ? Math.round(location.accuracy) : undefined,
      };

      const key = `${LAST_PRACTICE_PREFIX}${userKey}`;
      localStorage.setItem(key, JSON.stringify(data));

      // Also save language-specific last practice
      const lang = data.language;
      const langKey = `${LAST_PRACTICE_PREFIX}${userKey}_${lang}`;
      localStorage.setItem(langKey, JSON.stringify(data));

      window.dispatchEvent(new CustomEvent('last-practice-updated', { detail: data }));
    } catch (err) {
      console.warn('Failed to save last practice', err);
    }
  },

  getLastPractice(userId?: string): LastPracticeLocation | null {
    try {
      const key = `${LAST_PRACTICE_PREFIX}${userId || 'guest'}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  },

  getLastPracticeByLanguage(language: 'ko' | 'en', userId?: string): LastPracticeLocation | null {
    try {
      const userKey = userId || 'guest';
      const langKey = `${LAST_PRACTICE_PREFIX}${userKey}_${language}`;
      const raw = localStorage.getItem(langKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  },
};
