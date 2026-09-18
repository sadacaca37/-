import { soundManager } from './sound';

const STAR_MISSION_KEY_PREFIX = 'typang_star_mission_v1_';

export interface StarMissionState {
  stars: number; // 0 to 10
  isApproved: boolean; // Teacher inspection approved
  approvedAt?: string;
  historyCount: number;
}

export class StarMissionManager {
  private static instance: StarMissionManager;

  public static getInstance(): StarMissionManager {
    if (!StarMissionManager.instance) {
      StarMissionManager.instance = new StarMissionManager();
    }
    return StarMissionManager.instance;
  }

  private getStorageKey(userId?: string): string {
    const effectiveId = userId || this.resolveCurrentUserId() || 'guest';
    return `${STAR_MISSION_KEY_PREFIX}${effectiveId}`;
  }

  private resolveCurrentUserId(): string | undefined {
    try {
      const raw = localStorage.getItem('typang_current_user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user && user.id) return String(user.id);
      }
    } catch {}
    return undefined;
  }

  public getState(userId?: string): StarMissionState {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          stars: Math.max(0, Math.min(10, Number(parsed.stars) || 0)),
          isApproved: Boolean(parsed.isApproved),
          approvedAt: parsed.approvedAt,
          historyCount: Number(parsed.historyCount) || 0,
        };
      }
    } catch {}
    return {
      stars: 0,
      isApproved: false,
      historyCount: 0,
    };
  }

  /**
   * Add a star when a practice mission is completed.
   * Max 10 stars.
   */
  public addStar(missionTitle: string, userId?: string): { stars: number; isFull: boolean; justFilled: boolean } {
    const key = this.getStorageKey(userId);
    const current = this.getState(userId);

    const prevStars = current.stars;
    const nextStars = Math.min(10, prevStars + 1);
    const isFull = nextStars >= 10;
    const justFilled = prevStars < 10 && nextStars === 10;

    const updated: StarMissionState = {
      stars: nextStars,
      isApproved: justFilled ? false : current.isApproved,
      approvedAt: justFilled ? undefined : current.approvedAt,
      historyCount: current.historyCount + 1,
    };

    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save star state', e);
    }

    // Broadcast update across components
    window.dispatchEvent(
      new CustomEvent('star-mission-updated', {
        detail: {
          ...updated,
          missionTitle,
          justFilled,
          userId: userId || this.resolveCurrentUserId(),
        },
      })
    );

    return { stars: nextStars, isFull, justFilled };
  }

  /**
   * Teacher approves and hands out MyChew!
   * Resets stars to 0 so the student can start collecting again.
   */
  public approveByTeacher(userId?: string): StarMissionState {
    const key = this.getStorageKey(userId);
    const now = new Date();
    const approvedAt = `${now.getHours()}시 ${String(now.getMinutes()).padStart(2, '0')}분 ${String(now.getSeconds()).padStart(2, '0')}초`;

    const updated: StarMissionState = {
      stars: 0, // Reset to 0 after teacher inspection & MyChew reward
      isApproved: true,
      approvedAt,
      historyCount: (this.getState(userId).historyCount || 0),
    };

    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}

    window.dispatchEvent(
      new CustomEvent('star-mission-updated', {
        detail: {
          ...updated,
          userId: userId || this.resolveCurrentUserId(),
        },
      })
    );

    return updated;
  }

  /**
   * Reset stars manually if needed
   */
  public resetStars(userId?: string): StarMissionState {
    const key = this.getStorageKey(userId);
    const updated: StarMissionState = {
      stars: 0,
      isApproved: false,
      historyCount: 0,
    };
    try {
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {}
    window.dispatchEvent(
      new CustomEvent('star-mission-updated', {
        detail: {
          ...updated,
          userId: userId || this.resolveCurrentUserId(),
        },
      })
    );
    return updated;
  }
}

export const starMissionManager = StarMissionManager.getInstance();
