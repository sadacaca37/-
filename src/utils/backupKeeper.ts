/**
 * 선생님(마스터) 컴퓨터에 전체 백업(학생 계정·아이디·전화번호·포인트·기록)을 자동으로 보관하고,
 * 코드 업데이트/재배포로 서버가 비워지면 선생님이 접속하는 순간 자동으로 되살리는 도구.
 *
 * - 마스터로 로그인해 있는 동안 몇 분마다 서버 백업을 이 브라우저(IndexedDB)에 저장
 * - 서버가 "새로 시작(비어 있음)"이라고 알려 주면, 저장해 둔 백업을 서버에 합쳐 넣음
 *   (없는 학생만 추가, 학생 자료는 더 최신 것만 → 새 자료를 덮어쓰지 않음)
 */
import { typangApi } from './apiClient';

const DB_NAME = 'typang_backup_keeper';
const STORE = 'backups';
const INTERVAL_MS = 3 * 60 * 1000;
export const LAST_AUTO_BACKUP_KEY = 'typang_last_auto_backup_at';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T = any>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      r.onsuccess = () => resolve((r.result as T) ?? null);
      r.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: any): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

let keyOverride = '';
function headers(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-master-key': keyOverride || typangApi.getMasterKey() };
}

function countOf(b: any) {
  return {
    members: Array.isArray(b?.members?.members) ? b.members.members.length : 0,
    progress: b?.progress ? Object.keys(b.progress).length : 0,
  };
}

class BackupKeeper {
  private timer: number | null = null;
  private busy = false;

  /** 앱이 켜질 때 한 번 호출. 마스터가 아니면 아무 일도 하지 않음 */
  public start() {
    if (this.timer) return;
    void this.tick();
    this.timer = window.setInterval(() => void this.tick(), INTERVAL_MS);
  }

  /** 마스터 로그인 직후 등 바로 한 번 확인 */
  public async tick(): Promise<{ restored?: number } | void> {
    if (this.busy || !typangApi.getMasterKey()) return;
    this.busy = true;
    try {
      keyOverride = '';
      const getStatus = () => fetch('/api/backup/status', { headers: headers() }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      let st = await getStatus();
      if (!st?.success && typangApi.getMasterKey() !== '1234') {
        // 업데이트로 서버가 비면 마스터 비밀번호도 기본값(1234)으로 돌아가 있음 → 기본값으로 되살린 뒤
        // 백업 속 선생님 비밀번호가 함께 복원됨
        keyOverride = '1234';
        st = await getStatus();
        if (!st?.success || !st.needsRestore) {
          keyOverride = '';
          return;
        }
      }
      if (!st?.success) return;

      let restored: number | undefined;
      if (st.needsRestore) {
        const saved = await idbGet<any>('latest');
        if (saved && (countOf(saved).members || countOf(saved).progress)) {
          const r = await fetch('/api/backup/restore', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ backup: saved, mode: 'merge' }),
          })
            .then((x) => x.json())
            .catch(() => null);
          if (r?.success) {
            restored = Number(r.restoredMembers) || 0;
            console.log('[백업] 선생님 컴퓨터의 자동 백업으로 서버를 되살렸어요.', r.message);
            window.dispatchEvent(new CustomEvent('typang-backup-restored', { detail: r }));
            keyOverride = '';
          }
        }
        // 이 컴퓨터에 보관된 백업이 없으면 되살릴 것이 없으니, 지금 서버 내용부터 보관 시작
      }

      const b = await fetch('/api/backup', { headers: headers() }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      if (b?.success && b.backup) {
        const prev = await idbGet<any>('latest');
        if (prev) await idbSet('previous', prev);
        await idbSet('latest', b.backup);
        try {
          localStorage.setItem(LAST_AUTO_BACKUP_KEY, String(Date.now()));
        } catch {}
      }
      return { restored };
    } finally {
      this.busy = false;
    }
  }

  /** 이 컴퓨터에 보관된 최신 자동 백업 (마스터 관리실에서 파일로 받을 때 사용) */
  public getLatest() {
    return idbGet<any>('latest');
  }
}

export const backupKeeper = new BackupKeeper();
