import { AppMode, TypingStats } from '../types';

export interface InProgressTypingSession {
  mode: AppMode;
  userId: string;
  language: 'ko' | 'en';
  stageId?: number | string;
  categoryId?: string;
  categoryIndex?: number;
  textId?: string;
  itemIndex: number; // sampleIndex, wordIndex, sentenceIndex, or paragraphIndex
  inputVal: string;  // text typed so far in current item
  stats: TypingStats;
  is5MinMode?: boolean;
  remainingTime5Min?: number;
  updatedAt: number;
}

const AUTOSAVE_PREFIX = 'typang_autosave_session_';

export const sessionAutoSaveManager = {
  saveSession(session: Omit<InProgressTypingSession, 'updatedAt'>): void {
    try {
      const data: InProgressTypingSession = {
        ...session,
        updatedAt: Date.now(),
      };
      const key = `${AUTOSAVE_PREFIX}${session.mode}_${session.userId || 'guest'}`;
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to auto-save typing session', err);
    }
  },

  getSession(mode: AppMode, userId?: string): InProgressTypingSession | null {
    try {
      const key = `${AUTOSAVE_PREFIX}${mode}_${userId || 'guest'}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data: InProgressTypingSession = JSON.parse(raw);
      // Expire if older than 7 days
      if (Date.now() - data.updatedAt > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },

  clearSession(mode: AppMode, userId?: string): void {
    try {
      const key = `${AUTOSAVE_PREFIX}${mode}_${userId || 'guest'}`;
      localStorage.removeItem(key);
    } catch (err) {
      console.warn('Failed to clear auto-saved session', err);
    }
  },
};
