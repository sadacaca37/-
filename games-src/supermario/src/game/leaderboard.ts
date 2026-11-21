// Top 30 High Scores & Leaderboard System

import { LeaderboardEntry, PlayerMode } from '../types';

const STORAGE_KEY = 'mario_action_web_leaderboard_v1';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { id: 'd1', name: 'MARIO_PRO', score: 125000, stageReached: 10, timeSeconds: 210, mode: '1P', date: '2026-08-25' },
  { id: 'd2', name: 'PEACH_SAVIOR', score: 112000, stageReached: 10, timeSeconds: 245, mode: '1P', date: '2026-08-24' },
  { id: 'd3', name: 'BROS_DUO', score: 98500, stageReached: 10, timeSeconds: 280, mode: '2P', date: '2026-08-23' },
  { id: 'd4', name: 'YOSHI_RIDER', score: 86400, stageReached: 9, timeSeconds: 310, mode: '1P', date: '2026-08-22' },
  { id: 'd5', name: 'SPEED_RUNNER', score: 79200, stageReached: 8, timeSeconds: 190, mode: '1P', date: '2026-08-21' },
  { id: 'd6', name: 'TOAD_HERO', score: 71500, stageReached: 8, timeSeconds: 260, mode: '1P', date: '2026-08-20' },
  { id: 'd7', name: 'FIRE_CLOWN', score: 65800, stageReached: 7, timeSeconds: 220, mode: '1P', date: '2026-08-19' },
  { id: 'd8', name: 'LUIGI_TIME', score: 58900, stageReached: 6, timeSeconds: 290, mode: '2P', date: '2026-08-18' },
  { id: 'd9', name: 'ACORN_GLIDER', score: 52400, stageReached: 6, timeSeconds: 240, mode: '1P', date: '2026-08-17' },
  { id: 'd10', name: 'PROPELLER_X', score: 46700, stageReached: 5, timeSeconds: 215, mode: '1P', date: '2026-08-16' },
  { id: 'd11', name: 'DRY_BONES', score: 41200, stageReached: 5, timeSeconds: 270, mode: '1P', date: '2026-08-15' },
  { id: 'd12', name: 'STAR_CHASER', score: 36500, stageReached: 4, timeSeconds: 195, mode: '1P', date: '2026-08-14' },
  { id: 'd13', name: 'HAMMER_SLAYER', score: 32000, stageReached: 4, timeSeconds: 230, mode: '1P', date: '2026-08-13' },
  { id: 'd14', name: 'SUPER_JUMP', score: 28400, stageReached: 3, timeSeconds: 180, mode: '1P', date: '2026-08-12' },
  { id: 'd15', name: 'COIN_COLLECTOR', score: 25100, stageReached: 3, timeSeconds: 250, mode: '1P', date: '2026-08-11' },
];

export class LeaderboardManager {
  static getEntries(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.saveEntries(DEFAULT_LEADERBOARD);
        return DEFAULT_LEADERBOARD;
      }
      const parsed: LeaderboardEntry[] = JSON.parse(data);
      return parsed.sort((a, b) => b.score - a.score).slice(0, 30);
    } catch {
      return DEFAULT_LEADERBOARD;
    }
  }

  static saveEntries(entries: LeaderboardEntry[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
  }

  static addScore(entry: Omit<LeaderboardEntry, 'id' | 'rank' | 'date'>): LeaderboardEntry[] {
    const list = this.getEntries();
    const today = new Date().toISOString().split('T')[0];
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      date: today,
      isNew: true,
    };

    list.push(newEntry);
    const sorted = list
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));

    this.saveEntries(sorted);
    return sorted;
  }

  static resetLeaderboard(): LeaderboardEntry[] {
    this.saveEntries(DEFAULT_LEADERBOARD);
    return DEFAULT_LEADERBOARD;
  }
}
