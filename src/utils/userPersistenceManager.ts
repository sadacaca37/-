import { UserSession } from '../types';
import { typangApi } from './apiClient';

const DB_KEY = 'typang_users_db';
const PERMANENT_VAULT_KEY = 'typang_registered_students_vault';

// Helper to extract clean digits from phone
function cleanDigits(phone?: string): string {
  return (phone || '').replace(/[^0-9]/g, '');
}

/**
 * 🛡️ 학생 데이터 영구 고정 및 마스터 전용 권한 관리자
 * - 데이터 업데이트/새로고침 시에도 가입한 학생 계정이 절대 유실되지 않음
 * - 로컬 스토리지 + 영구 볼트 + 서버 DB 3중 스마트 머지
 * - 수정 및 삭제 권한은 오직 마스터(Master)만 가능하도록 보호
 */
class UserPersistenceManager {
  // Read all locally registered users from primary DB and permanent vault
  public getLocalUsers(): UserSession[] {
    const userMap = new Map<string, UserSession>();

    // 1. Load from primary DB
    try {
      const primaryRaw = localStorage.getItem(DB_KEY);
      if (primaryRaw) {
        const list: UserSession[] = JSON.parse(primaryRaw);
        if (Array.isArray(list)) {
          list.forEach((u) => {
            const key = u.id || `${(u.name || '').trim().toLowerCase()}_${cleanDigits(u.parentPhone || u.phone)}`;
            if (key) userMap.set(key, u);
          });
        }
      }
    } catch (e) {
      console.warn('Error reading primary users db:', e);
    }

    // 2. Load from permanent backup vault (safety fallback if primary is reset)
    try {
      const vaultRaw = localStorage.getItem(PERMANENT_VAULT_KEY);
      if (vaultRaw) {
        const vaultList: UserSession[] = JSON.parse(vaultRaw);
        if (Array.isArray(vaultList)) {
          vaultList.forEach((u) => {
            const key = u.id || `${(u.name || '').trim().toLowerCase()}_${cleanDigits(u.parentPhone || u.phone)}`;
            if (key && !userMap.has(key)) {
              userMap.set(key, u);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Error reading permanent vault:', e);
    }

    return Array.from(userMap.values());
  }

  // Save users into both primary DB and permanent vault
  public saveUsers(users: UserSession[]) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(users));
      // Only keep registered student accounts in vault (filter out non-students if needed, keep all active users)
      localStorage.setItem(PERMANENT_VAULT_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving to storage:', e);
    }
  }

  // Register a new user permanently
  public addPermanentStudent(user: UserSession): UserSession[] {
    const current = this.getLocalUsers();
    const cleanUserPhone = cleanDigits(user.parentPhone || user.phone);
    const cleanUserName = (user.name || '').trim().toLowerCase();

    // Check duplicate
    const exists = current.some((u) => {
      if (u.id === user.id) return true;
      const sameName = (u.name || '').trim().toLowerCase() === cleanUserName;
      const samePhone = cleanDigits(u.parentPhone || u.phone) === cleanUserPhone;
      return sameName && samePhone;
    });

    const updated = exists
      ? current.map((u) => (u.id === user.id ? { ...u, ...user } : u))
      : [user, ...current];

    this.saveUsers(updated);
    return updated;
  }

  // Smart Union Merge with Server (never delete existing students during updates)
  public async reconcileWithServer(serverUsers: UserSession[]): Promise<UserSession[]> {
    const localUsers = this.getLocalUsers();
    const mergedMap = new Map<string, UserSession>();

    // 1. Add all local registered users first (highest retention priority)
    localUsers.forEach((u) => {
      const key = u.id || `${(u.name || '').trim().toLowerCase()}_${cleanDigits(u.parentPhone || u.phone)}`;
      mergedMap.set(key, u);
    });

    // 2. Merge server users
    const missingOnServer: UserSession[] = [];
    serverUsers.forEach((su) => {
      const key = su.id || `${(su.name || '').trim().toLowerCase()}_${cleanDigits(su.parentPhone || su.phone)}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, su);
      } else {
        // Keep progress and practice stats merged
        const local = mergedMap.get(key)!;
        mergedMap.set(key, {
          ...su,
          ...local,
          highestCpm: Math.max(local.highestCpm || 0, su.highestCpm || 0),
          totalPracticeCount: Math.max(local.totalPracticeCount || 0, su.totalPracticeCount || 0),
        });
      }
    });

    // Find any locally registered student that the server doesn't know about yet
    const serverIdSet = new Set(serverUsers.map((s) => s.id));
    const serverPhoneSet = new Set(serverUsers.map((s) => cleanDigits(s.parentPhone || s.phone)));

    localUsers.forEach((lu) => {
      const p = cleanDigits(lu.parentPhone || lu.phone);
      if (lu.role !== 'master' && (!serverIdSet.has(lu.id) && !serverPhoneSet.has(p))) {
        missingOnServer.push(lu);
      }
    });

    const finalUsers = Array.from(mergedMap.values());
    this.saveUsers(finalUsers);

    // If local has students that server is missing (e.g. server container restarted/updated), sync them to server!
    if (missingOnServer.length > 0) {
      try {
        await typangApi.syncUsers(finalUsers);
      } catch (err) {
        console.warn('Auto-sync local students to server:', err);
      }
    }

    return finalUsers;
  }

  // Authority check: Only Master can modify or delete student accounts
  public isMaster(user: UserSession | null): boolean {
    if (!user) return false;
    return user.role === 'master' || user.studentId === 'master' || user.id === 'master_admin';
  }
}

export const userPersistenceManager = new UserPersistenceManager();
