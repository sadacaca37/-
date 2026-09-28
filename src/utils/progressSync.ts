/**
 * 학생 자료(포인트·연습 기록·별·퀘스트·다마고치 등)를 서버에 보관해서
 * 어느 컴퓨터에서 로그인해도 이어서 쓰도록 맞춰 주는 도구.
 *
 * - 로그인할 때: 서버에 보관된 자료를 받아 이 브라우저에 깔아 줌
 * - 쓰는 동안: 바뀐 내용을 몇 초마다(그리고 창을 닫을 때) 서버에 올려 둠
 * - 서버가 없는 미리보기에서는 조용히 아무 일도 하지 않음(브라우저에만 저장)
 */

/** 학생 한 명에게 딸린 자료의 키 앞부분 */
const USER_KEY_PREFIXES = [
  'taja_practice_points_wallet_v2',
  'typang_history_user_',
  'typang_star_mission_v1_',
  'typang_daily_missions_',
  'typang_last_practice_',
  'typang_autosave_session_',
  'pangpang_python_',
  'pangpang_conquered_',
  'pangpang_best_sentence_cpm_',
  'typang_sentence_progress_',
];

/** 이 브라우저에 하나만 있지만 학생 개인 것에 가까운 자료 */
const SHARED_PERSONAL_KEYS = [
  'taja_unlocked_avatar_items_v2',
  'avatar_favorites',
  'tamagotchi_animal_pet_v2',
  'suika_high_score',
  'brick_breaker_high_score',
  'cat_runner_high_score',
];

const SYNC_INTERVAL_MS = 15000;
/** 이 브라우저가 서버에 마지막으로 올린 시각(학생별) — 서버가 비워져 옛날 백업으로 돌아갔는지 판단용 */
const PUSHED_AT_PREFIX = 'typang_progress_pushed_at_';

function belongsToUser(key: string, userId: string): boolean {
  if (SHARED_PERSONAL_KEYS.includes(key)) return true;
  if (key.includes(userId)) return USER_KEY_PREFIXES.some((p) => key.startsWith(p)) || key.includes(userId);
  return false;
}

function collect(userId: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === 'typang_current_user' || key === 'typang_users_db' || key === 'typang_master_key') continue;
      if (key.startsWith(PUSHED_AT_PREFIX)) continue;
      if (!belongsToUser(key, userId)) continue;
      const v = localStorage.getItem(key);
      if (v != null && v.length < 400000) out[key] = v;
    }
  } catch {}
  return out;
}

function apply(data: Record<string, string>) {
  try {
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') localStorage.setItem(k, v);
    }
  } catch {}
}

class ProgressSync {
  private userId = '';
  private timer: number | null = null;
  private lastSent = '';
  private serverAvailable = true;

  /** 로그인 직후: 서버 자료를 내려받아 이 브라우저에 깔고, 이후 자동 보관 시작 */
  public async start(userId: string): Promise<{ restored: boolean }> {
    this.stop();
    if (!userId) return { restored: false };
    this.userId = userId;

    let restored = false;
    try {
      const res = await fetch(`/api/progress/${encodeURIComponent(userId)}`);
      const json = await res.json();
      if (json && json.success) {
        if (json.data && Object.keys(json.data).length) {
          const mine = collect(userId);
          const localCount = Object.keys(mine).length;
          let pushedAt = 0;
          try {
            pushedAt = Number(localStorage.getItem(PUSHED_AT_PREFIX + userId)) || 0;
          } catch {}
          // 서버 자료가 이 컴퓨터가 마지막으로 올린 것보다 오래됐으면(서버가 업데이트로 비워졌다가
          // 옛 백업으로 돌아간 경우) 이 컴퓨터의 최신 포인트·기록을 지키고 서버에 다시 올림
          if (!localCount || (json.updatedAt || 0) >= pushedAt) {
            apply(json.data);
            restored = true;
          }
        }
      } else {
        this.serverAvailable = false;
      }
    } catch {
      this.serverAvailable = false; // 서버 없는 미리보기
    }

    if (this.serverAvailable) {
      this.push();
      this.timer = window.setInterval(() => this.push(), SYNC_INTERVAL_MS);
      window.addEventListener('beforeunload', this.flush);
      window.addEventListener('pagehide', this.flush);
    }
    return { restored };
  }

  public stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener('beforeunload', this.flush);
    window.removeEventListener('pagehide', this.flush);
    this.userId = '';
    this.lastSent = '';
  }

  /** 지금 바로 한 번 올리기 (로그아웃 전 등) */
  public flush = () => {
    this.push(true);
  };

  private push(useBeacon = false) {
    if (!this.userId || !this.serverAvailable) return;
    const data = collect(this.userId);
    const body = JSON.stringify({ data, updatedAt: Date.now() });
    const fingerprint = JSON.stringify(data);
    if (fingerprint === this.lastSent) return; // 바뀐 게 없으면 건너뜀
    this.lastSent = fingerprint;
    const url = `/api/progress/${encodeURIComponent(this.userId)}`;
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
        return;
      }
      const uid = this.userId;
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
        .then((r) => r.json())
        .then((j) => {
          if (j?.success && !j.skipped) {
            try {
              localStorage.setItem(PUSHED_AT_PREFIX + uid, String(j.updatedAt || Date.now()));
            } catch {}
          }
        })
        .catch(() => {});
    } catch {}
  }
}

export const progressSync = new ProgressSync();
