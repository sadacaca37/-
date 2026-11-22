/**
 * 학생 자료(포인트·연습 기록·별·퀘스트·다마고치 등)를 모아팡 Firebase에 보관해서
 * 어느 컴퓨터에서 들어와도 이어서 쓰도록 맞춰 주는 도구.
 *
 * - 들어올 때: 보관된 자료를 받아 이 브라우저에 깔아 줌
 * - 쓰는 동안: 바뀐 내용을 1분마다(그리고 창을 닫거나 다른 창으로 갈 때) 올려 둠
 * - 보관 자리: classes/{반}/students/{학생}/taja/progress  (서버가 꺼져도 지워지지 않음)
 */

import { isApprovedNow } from './session';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { activityTracker } from './activityLog';
import { fs, parseUserId } from './moaFirebase';

/** 학생 한 명에게 딸린 자료의 키 앞부분 */
const USER_KEY_PREFIXES = [
  'taja_practice_points_wallet_v2',
  'typang_history_user_',
  'typang_activity_log_',
  'tp_quest_done_',
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

const SYNC_INTERVAL_MS = 60000;
/** Firestore 문서 한 개는 1MB까지라 넉넉히 줄여서 올림 */
const MAX_JSON = 900000;
/** 줄여야 할 때도 꼭 지키는 자료 (포인트·진도·일지) */
const KEEP_FIRST = ['taja_practice_points_wallet_v2', 'tp_quest_done_', 'typang_activity_log_', 'typang_star_mission_v1_'];
/** 이 브라우저가 마지막으로 올린 시각(학생별) */
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

/** 너무 크면 덜 중요한 큰 자료부터 빼서 1MB 안으로 */
function fit(data: Record<string, string>): string {
  let json = JSON.stringify(data);
  if (json.length <= MAX_JSON) return json;
  const keys = Object.keys(data)
    .filter((k) => !KEEP_FIRST.some((p) => k.startsWith(p)))
    .sort((a, b) => data[b].length - data[a].length);
  const d = { ...data };
  for (const k of keys) {
    delete d[k];
    json = JSON.stringify(d);
    if (json.length <= MAX_JSON) break;
  }
  return json;
}

function apply(data: Record<string, string>) {
  try {
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string') localStorage.setItem(k, v);
    }
  } catch {}
}

const progressRef = (userId: string) => {
  const p = parseUserId(userId);
  return p ? doc(fs, 'classes', p.cid, 'students', p.key, 'taja', 'progress') : null;
};

/** 선생님 화면용: 한 학생의 보관 자료 읽기 */
export async function readProgress(userId: string): Promise<{ data: Record<string, string>; updatedAt: number } | null> {
  const r = progressRef(userId);
  if (!r) return null;
  const snap = await getDoc(r);
  if (!snap.exists()) return null;
  const v = snap.data() as any;
  try {
    return { data: JSON.parse(v.json || '{}'), updatedAt: Number(v.updatedAt) || 0 };
  } catch {
    return { data: {}, updatedAt: Number(v.updatedAt) || 0 };
  }
}

class ProgressSync {
  private userId = '';
  private timer: number | null = null;
  private lastSent = '';
  private busy = false;
  private readyUser = '';

  /** 보관된 자료를 다 받아 깐 뒤인지 (선물 포인트 받기 등은 이 뒤에) */
  public isReady(userId: string) {
    return !!userId && this.readyUser === userId;
  }

  /** 들어온 직후: 보관된 자료를 받아 이 브라우저에 깔고, 이후 자동 보관 시작 */
  public async start(userId: string): Promise<{ restored: boolean }> {
    this.stop();
    if (!userId || !progressRef(userId)) return { restored: false };
    this.userId = userId;

    let restored = false;
    try {
      const got = await readProgress(userId);
      if (got && Object.keys(got.data).length) {
        const localCount = Object.keys(collect(userId)).length;
        let pushedAt = 0;
        try {
          pushedAt = Number(localStorage.getItem(PUSHED_AT_PREFIX + userId)) || 0;
        } catch {}
        // 보관본이 이 컴퓨터가 마지막으로 올린 것보다 오래됐으면 이 컴퓨터의 최신 자료를 지킴
        if (!localCount || got.updatedAt >= pushedAt) {
          apply(got.data);
          restored = true;
        }
      }
    } catch {}
    if (this.userId !== userId) return { restored };
    this.readyUser = userId;

    this.push();
    this.timer = window.setInterval(() => this.push(), SYNC_INTERVAL_MS);
    window.addEventListener('pagehide', this.flush);
    document.addEventListener('visibilitychange', this.onHide);
    return { restored };
  }

  public stop() {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    window.removeEventListener('pagehide', this.flush);
    document.removeEventListener('visibilitychange', this.onHide);
    this.userId = '';
    this.readyUser = '';
    this.lastSent = '';
  }

  /** 바뀐 게 없어도 이 컴퓨터의 자료를 다시 통째로 올림 */
  public resync() {
    if (!this.userId) return;
    this.lastSent = '';
    activityTracker.flush();
    this.push();
  }

  /** 지금 바로 한 번 올리기 (로그아웃 전 등) */
  public flush = () => {
    activityTracker.flush(); // 방금까지 친 글자 수·시간을 일지에 먼저 적어 두고 올림
    return this.push();
  };

  private onHide = () => {
    if (document.visibilityState === 'hidden') this.flush();
  };

  private async push(): Promise<void> {
    if (!this.userId || this.busy) return;
    if (!isApprovedNow()) return; // 선생님 승인 전에는 Firebase 에 올리지 않음
    const r = progressRef(this.userId);
    if (!r) return;
    const json = fit(collect(this.userId));
    if (json === this.lastSent) return; // 바뀐 게 없으면 건너뜀
    const uid = this.userId;
    const updatedAt = Date.now();
    this.busy = true;
    try {
      await setDoc(r, { json, updatedAt });
      this.lastSent = json;
      try {
        localStorage.setItem(PUSHED_AT_PREFIX + uid, String(updatedAt));
      } catch {}
    } catch {
      // 인터넷이 끊겼으면 다음 차례에 다시
    } finally {
      this.busy = false;
    }
  }
}

export const progressSync = new ProgressSync();
