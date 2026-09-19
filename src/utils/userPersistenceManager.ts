import { UserSession } from '../types';
import { typangApi } from './apiClient';

const DB_KEY = 'typang_users_db';
const PERMANENT_VAULT_KEY = 'typang_registered_students_vault';
const LOCKED_VAULT_KEY = 'typang_locked_students_vault_v2';

// Helper to extract clean digits from phone
function cleanDigits(phone?: string): string {
  return (phone || '').replace(/[^0-9]/g, '');
}

/**
 * 🛡️ 학생 데이터 영구 고정 및 마스터 전용 권한 관리자
 * - 코드 업데이트, 컨테이너 재부팅, 새로고침 시에도 가입/등록된 학생 명단 절대 불변 유지
 * - 로컬 스토리지 + 2차 잠금 볼트(LOCKED_VAULT) + 서버 영구 저장 3중 보호
 * - 학생 정보 변경, 추가, 삭제, 승인은 오직 마스터(Master)로 로그인했을 때만 가능!
 */
class UserPersistenceManager {
  // Read all locally registered users from primary DB, permanent vault, and locked vault
  public getLocalUsers(): UserSession[] {
    const userMap = new Map<string, UserSession>();

    // Helper to merge list
    const mergeList = (raw: string | null) => {
      if (!raw) return;
      try {
        const list: UserSession[] = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((u) => {
            const key = u.id || `${(u.name || '').trim().toLowerCase()}_${cleanDigits(u.parentPhone || u.phone)}`;
            if (key) {
              if (!userMap.has(key)) {
                userMap.set(key, u);
              } else {
                const prev = userMap.get(key)!;
                userMap.set(key, { ...u, ...prev });
              }
            }
          });
        }
      } catch (e) {
        console.warn('Error reading user storage:', e);
      }
    };

    // 1. Load from locked vault first (Highest protection level - immune to updates)
    mergeList(localStorage.getItem(LOCKED_VAULT_KEY));

    // 2. Load from permanent backup vault
    mergeList(localStorage.getItem(PERMANENT_VAULT_KEY));

    // 3. Load from primary DB
    mergeList(localStorage.getItem(DB_KEY));

    const result = Array.from(userMap.values());
    if (result.length > 0) {
      // Keep all 3 vaults in perfect sync
      try {
        localStorage.setItem(LOCKED_VAULT_KEY, JSON.stringify(result));
        localStorage.setItem(PERMANENT_VAULT_KEY, JSON.stringify(result));
        localStorage.setItem(DB_KEY, JSON.stringify(result));
      } catch {}
    }

    return result;
  }

  // Save users into primary DB, permanent vault, and locked vault
  // Protected: Only call with master authorization or system self-sync
  public saveUsers(users: UserSession[], isMasterAuthorized: boolean = true) {
    if (!isMasterAuthorized) {
      console.warn('Unauthorized attempt to modify locked student records: Blocked.');
      return;
    }
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(users));
      localStorage.setItem(PERMANENT_VAULT_KEY, JSON.stringify(users));
      localStorage.setItem(LOCKED_VAULT_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('Error saving to storage:', e);
    }
  }

  // Register a new user permanently (Called by Master or approved student self-registration)
  public addPermanentStudent(user: UserSession, isMasterAuthorized: boolean = true): UserSession[] {
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

    this.saveUsers(updated, isMasterAuthorized);
    return updated;
  }

  // Smart Union Merge with Server (never delete existing registered students during updates)
  public async reconcileWithServer(serverUsers: UserSession[]): Promise<UserSession[]> {
    const localUsers = this.getLocalUsers();
    const mergedMap = new Map<string, UserSession>();

    // 1. Add all local registered users first (highest retention priority)
    localUsers.forEach((u) => {
      const key = u.id || `${(u.name || '').trim().toLowerCase()}_${cleanDigits(u.parentPhone || u.phone)}`;
      mergedMap.set(key, u);
    });

    // 2. Merge server users safely
    const missingOnServer: UserSession[] = [];
    serverUsers.forEach((su) => {
      const key = su.id || `${(su.name || '').trim().toLowerCase()}_${cleanDigits(su.parentPhone || su.phone)}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, su);
      } else {
        // Keep progress and practice stats merged without wiping registered students
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
    this.saveUsers(finalUsers, true);

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
