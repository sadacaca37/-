import { isSavableUser } from './session';
import { soundManager } from './sound';

const STAR_MISSION_KEY_PREFIX = 'typang_star_mission_v1_';

export interface StarMissionState {
  stars: number; // 0 to 10
  isApproved: boolean; // Teacher inspection approved
  approvedAt?: string;
  historyCount: number;
  /** 자리 연습: 하루 세트(별 1개)를 채우려고 지금까지 친 횟수 (3번이면 별 1개) */
  runs: number;
}

export class StarMissionManager {
  private static instance: StarMissionManager;

  public static getInstance(): StarMissionManager {
    if (!StarMissionManager.instance) {
      StarMissionManager.instance = new StarMissionManager();
    }
    return StarMissionManager.instance;
  }

  /** scope: 단계별로 별을 따로 셈 (예: 'key_ko_1' = 한글 자리 1단계). 없으면 예전 공용 별 */
  private getStorageKey(userId?: string, scope?: string): string {
    const effectiveId = userId || this.resolveCurrentUserId() || 'guest';
    return `${STAR_MISSION_KEY_PREFIX}${effectiveId}${scope ? `__${scope}` : ''}`;
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

  public getState(userId?: string, scope?: string): StarMissionState {
    try {
      const key = this.getStorageKey(userId, scope);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          stars: Math.max(0, Math.min(10, Number(parsed.stars) || 0)),
          isApproved: Boolean(parsed.isApproved),
          approvedAt: parsed.approvedAt,
          historyCount: Number(parsed.historyCount) || 0,
          runs: Math.max(0, Number(parsed.runs) || 0),
        };
      }
    } catch {}
    return {
      stars: 0,
      isApproved: false,
      historyCount: 0,
      runs: 0,
    };
  }

  /**
   * 자리 연습: 한 번 완주할 때마다 호출. per(3)번을 채우면 '하루 세트' 별 1개.
   * 별이 이미 10개면 더 세지 않음.
   */
  public addRun(missionTitle: string, userId?: string, scope?: string, per = 3): { stars: number; runs: number; starEarned: boolean; justFilled: boolean } {
    if (!isSavableUser(userId || this.resolveCurrentUserId())) return { stars: 0, runs: 0, starEarned: false, justFilled: false };
    const cur = this.getState(userId, scope);
    if (cur.stars >= 10) return { stars: cur.stars, runs: 0, starEarned: false, justFilled: false };
    const runs = cur.runs + 1;
    if (runs < per) {
      try {
        localStorage.setItem(this.getStorageKey(userId, scope), JSON.stringify({ ...cur, runs, historyCount: cur.historyCount + 1 }));
      } catch {}
      window.dispatchEvent(new CustomEvent('star-mission-updated', { detail: { ...cur, runs, scope, userId: userId || this.resolveCurrentUserId() } }));
      return { stars: cur.stars, runs, starEarned: false, justFilled: false };
    }
    try {
      localStorage.setItem(this.getStorageKey(userId, scope), JSON.stringify({ ...cur, runs: 0 }));
    } catch {}
    const r = this.addStar(missionTitle, userId, scope);
    return { stars: r.stars, runs: 0, starEarned: true, justFilled: r.justFilled };
  }

  /** 선생님 검사(운지법 등) 통과 표시 — 별은 그대로 둠 */
  public markApproved(userId?: string, scope?: string): void {
    if (!isSavableUser(userId || this.resolveCurrentUserId())) return;
    const cur = this.getState(userId, scope);
    try {
      localStorage.setItem(this.getStorageKey(userId, scope), JSON.stringify({ ...cur, isApproved: true, approvedAt: new Date().toISOString() }));
    } catch {}
    window.dispatchEvent(new CustomEvent('star-mission-updated', { detail: { ...cur, isApproved: true, scope, userId: userId || this.resolveCurrentUserId() } }));
  }

  /**
   * Add a star when a practice mission is completed.
   * Max 10 stars.
   */
  public addStar(missionTitle: string, userId?: string, scope?: string): { stars: number; isFull: boolean; justFilled: boolean } {
    if (!isSavableUser(userId || this.resolveCurrentUserId())) {
      return { stars: 0, isFull: false, justFilled: false }; // 로그아웃 상태: 저장 안 함
    }
    const key = this.getStorageKey(userId, scope);
    const current = this.getState(userId, scope);

    const prevStars = current.stars;
    const nextStars = Math.min(10, prevStars + 1);
    const isFull = nextStars >= 10;
    const justFilled = prevStars < 10 && nextStars === 10;

    const updated: StarMissionState = {
      stars: nextStars,
      isApproved: justFilled ? false : current.isApproved,
      approvedAt: justFilled ? undefined : current.approvedAt,
      historyCount: current.historyCount + 1,
      runs: 0,
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
          scope,
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
      runs: 0,
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
      runs: 0,
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
