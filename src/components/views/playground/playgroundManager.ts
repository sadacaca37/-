import { pointsManager } from '../../../utils/pointsManager';
import { soundManager } from '../../../utils/sound';
import { currentUserId } from '../../../utils/session';

export const PLAYGROUND_MIN_POINTS = 1000;
export const POINTS_PER_MINUTE = 100; // 10분 = 1000포인트 (분당 100P)

// 남은 이용 시간은 학생마다 따로 (같은 컴퓨터에서 다른 학생 시간을 쓰지 못하게)
const userSuffix = () => currentUserId() || 'guest';
const K_TIME = () => `playground_remaining_seconds_v3_${userSuffix()}`;
const K_TICK = () => `playground_last_tick_v3_${userSuffix()}`;
const K_ACTIVE = () => `playground_is_active_v3_${userSuffix()}`;

export class PlaygroundManager {
  private static instance: PlaygroundManager;
  private remainingSeconds: number = 0;
  private timerInterval: any = null;
  private isRunning: boolean = false;

  private constructor() {
    this.syncFromStorage();

    // Listen to storage events for cross-tab and cross-window real-time synchronization
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === K_TIME() && e.newValue !== null) {
          const parsed = parseInt(e.newValue, 10);
          if (!isNaN(parsed)) {
            this.remainingSeconds = Math.max(0, parsed);
            window.dispatchEvent(new CustomEvent('playground-tick', {
              detail: { remainingSeconds: this.remainingSeconds }
            }));
          }
        }
      });
    }
  }

  private syncFromStorage(): void {
    try {
      const saved = localStorage.getItem(K_TIME());
      if (saved !== null) {
        this.remainingSeconds = Math.max(0, parseInt(saved, 10));
      } else {
        this.remainingSeconds = 0;
      }
    } catch {
      this.remainingSeconds = 0;
    }
  }

  public static getInstance(): PlaygroundManager {
    if (!PlaygroundManager.instance) {
      PlaygroundManager.instance = new PlaygroundManager();
    }
    return PlaygroundManager.instance;
  }

  /**
   * 기본 플레이는 포인트 차감 없이 누구나 자유롭게 이용 가능!
   * 펀펀 플레이는 10분에 1,000포인트 차감 방식으로 운영됩니다. (새 창에서도 연동)
   */
  public canAccessPlayground(_isMaster: boolean = false): boolean {
    return true;
  }

  public getPoints(): number {
    return pointsManager.getBalance();
  }

  public getRemainingSeconds(): number {
    this.syncFromStorage();
    return this.remainingSeconds;
  }

  public isTimerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Exchange points for playground play time (펀펀 플레이: 10분에 1,000P)
   * @param minutes minutes to purchase (기본 10분 = 1000 P)
   */
  public purchasePlayTime(minutes: number = 10): { success: boolean; message: string } {
    const cost = minutes * POINTS_PER_MINUTE; // 10분 * 100 = 1000P
    const currentPoints = pointsManager.getBalance();

    if (currentPoints < cost) {
      soundManager.play('error');
      return {
        success: false,
        message: `포인트가 부족합니다! 10분 이용에는 1,000P가 필요합니다. (현재 보유: ${currentPoints.toLocaleString()}P)`
      };
    }

    const spent = pointsManager.spendPoints(cost, `🎮 펀펀 플레이 이용시간 ${minutes}분 충전 (새 창 연동)`);
    if (!spent) {
      return { success: false, message: '포인트 차감에 실패했습니다.' };
    }

    this.syncFromStorage();
    this.remainingSeconds += minutes * 60;
    this.persistTime();
    this.startTimer();

    window.dispatchEvent(new CustomEvent('playground-time-updated', {
      detail: { remainingSeconds: this.remainingSeconds, addedMinutes: minutes }
    }));

    return {
      success: true,
      message: `🎮 펀펀 플레이 ${minutes}분 (${cost.toLocaleString()}P 차감) 이용 시간이 충전되었습니다! (새 창에서도 동일 적용)`
    };
  }

  /**
   * Start or resume the countdown timer
   */
  public startTimer(): void {
    this.syncFromStorage();
    if (this.isRunning) return;
    if (this.remainingSeconds <= 0) return;

    this.isRunning = true;
    try {
      localStorage.setItem(K_ACTIVE(), 'true');
    } catch {}

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      this.syncFromStorage();
      if (this.remainingSeconds > 0) {
        this.remainingSeconds -= 1;
        this.persistTime();

        window.dispatchEvent(new CustomEvent('playground-tick', {
          detail: { remainingSeconds: this.remainingSeconds }
        }));

        if (this.remainingSeconds === 0) {
          // Check if auto-deduct is possible for active 펀펀 플레이 (10분당 1,000P)
          const curBal = pointsManager.getBalance();
          if (curBal >= 1000) {
            const autoRecharge = this.purchasePlayTime(10);
            if (autoRecharge.success) {
              soundManager.play('achievement');
              window.dispatchEvent(new CustomEvent('playground-auto-renewed', {
                detail: { message: '🎮 10분이 경과하여 1,000P가 차감되고 10분이 자동 연장되었습니다.' }
              }));
              return;
            }
          }

          this.pauseTimer();
          soundManager.play('error');
          window.dispatchEvent(new CustomEvent('playground-time-expired'));
        }
      } else {
        this.pauseTimer();
      }
    }, 1000);
  }

  /**
   * Pause countdown timer (e.g. when exiting game or paused)
   */
  public pauseTimer(): void {
    this.isRunning = false;
    try {
      localStorage.setItem(K_ACTIVE(), 'false');
    } catch {}
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private persistTime(): void {
    try {
      localStorage.setItem(K_TIME(), this.remainingSeconds.toString());
      localStorage.setItem(K_TICK(), Date.now().toString());
    } catch {}
  }

  public formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

export const playgroundManager = PlaygroundManager.getInstance();
