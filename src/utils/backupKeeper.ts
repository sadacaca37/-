/**
 * 선생님 컴퓨터 자동 백업
 *
 * 예전에는 서버가 비워질 때를 대비해 선생님 컴퓨터(IndexedDB)에 몇 분마다 백업하고 되살렸음.
 * 이제 자료는 모아팡 Firebase에 저장되어 서버가 꺼져도 사라지지 않음.
 * 그래도 혹시 모를 때를 위해, 선생님이 로그인해 있으면 하루에 한 번 이 컴퓨터에도 사본을 남겨 둠.
 */
import { collection, collectionGroup, getDocs } from 'firebase/firestore';
import { get, ref } from 'firebase/database';
import { fs, rt, isTeacherUser } from './moaFirebase';

const DB_NAME = 'typang_backup_keeper';
const STORE = 'backups';
const DAY_MS = 24 * 3600 * 1000;
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

class BackupKeeper {
  private busy = false;

  public start() {
    window.addEventListener('moa-auth-changed', () => void this.tick());
    void this.tick();
  }

  /** 선생님이면, 오늘 아직 사본을 안 남겼을 때 한 번 */
  public async tick(force = false): Promise<{ restored?: number } | void> {
    if (this.busy || !isTeacherUser()) return;
    let last = 0;
    try {
      last = Number(localStorage.getItem(LAST_AUTO_BACKUP_KEY)) || 0;
    } catch {}
    if (!force && Date.now() - last < DAY_MS) return;
    this.busy = true;
    try {
      const [prog, reps, lb, sts] = await Promise.all([
        getDocs(collectionGroup(fs, 'taja')),
        getDocs(collection(fs, 'taja_reports')),
        get(ref(rt, 'taja/lb')),
        getDocs(collectionGroup(fs, 'students')),
      ]);
      const backup = {
        version: 2,
        savedAt: Date.now(),
        students: sts.docs.map((d) => ({ path: d.ref.path, ...(d.data() as any), created: null, seen: null })),
        progress: Object.fromEntries(prog.docs.map((d) => [d.ref.path, d.data()])),
        reports: reps.docs.map((d) => d.data()),
        leaderboard: lb.val() || {},
      };
      const prev = await idbGet<any>('latest');
      if (prev) await idbSet('previous', prev);
      await idbSet('latest', backup);
      try {
        localStorage.setItem(LAST_AUTO_BACKUP_KEY, String(Date.now()));
      } catch {}
      return {};
    } catch {
      return;
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
