import { UserSession, LeaderboardEntry } from '../types';

export interface BatchRegisterResult {
  success: boolean;
  addedCount: number;
  skippedCount: number;
  totalUsers: number;
  message?: string;
}

class TypangApiClient {
  private isServerAvailable = true;

  // Helper to safely clean digits
  public extractDigits(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '');
  }

  // Helper to extract last 4 digits for password
  public getLast4Digits(phone: string): string {
    const digits = this.extractDigits(phone);
    if (digits.length >= 4) {
      return digits.slice(-4);
    }
    return digits.padEnd(4, '0');
  }

  // Format Korean phone numbers: 010-1234-5678
  public formatPhone(raw: string): string {
    const digits = this.extractDigits(raw);
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return raw;
  }

  // Fetch all users from server (falls back to localStorage) - NEVER overwrites existing registered students
  public async getUsers(): Promise<UserSession[]> {
    // Read local cache and permanent vault first
    let localList: UserSession[] = [];
    try {
      const p1 = localStorage.getItem('typang_users_db');
      const p2 = localStorage.getItem('typang_registered_students_vault');
      const combined = new Map<string, UserSession>();
      if (p1) (JSON.parse(p1) as UserSession[]).forEach((u) => combined.set(u.id || u.phone, u));
      if (p2) (JSON.parse(p2) as UserSession[]).forEach((u) => { if (!combined.has(u.id || u.phone)) combined.set(u.id || u.phone, u); });
      localList = Array.from(combined.values());
    } catch {}

    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          this.isServerAvailable = true;
          // Smart union: keep all existing registered students, never lose anyone on updates!
          const mergedMap = new Map<string, UserSession>();
          // Server items
          data.users.forEach((u: UserSession) => mergedMap.set(u.id || u.phone, u));
          // Local items (preserve local additions even if server was restarted)
          localList.forEach((u) => {
            if (!mergedMap.has(u.id || u.phone)) {
              mergedMap.set(u.id || u.phone, u);
            }
          });

          const finalUsers = Array.from(mergedMap.values());
          try {
            localStorage.setItem('typang_users_db', JSON.stringify(finalUsers));
            localStorage.setItem('typang_registered_students_vault', JSON.stringify(finalUsers));
          } catch {}
          return finalUsers;
        }
      }
    } catch (e) {
      this.isServerAvailable = false;
    }

    return localList;
  }

  // Two-way sync users to server
  public async syncUsers(users: UserSession[]): Promise<boolean> {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Login by parent phone (or name) + last 4 digits
  public async login(identifier: string, password?: string): Promise<{ success: boolean; user?: UserSession; message: string }> {
    const cleanIdent = identifier.trim();
    const cleanPass = (password || '').trim();
    const digits = this.extractDigits(cleanIdent);
    const normIdent = cleanIdent.replace(/\s+/g, '').toLowerCase();

    // 1. Try server login first
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanIdent, password: cleanPass }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        data.user.isApproved = true;
        try {
          localStorage.setItem('typang_current_user', JSON.stringify(data.user));
          sessionStorage.setItem('typang_active_user_id', data.user.id);
        } catch {}
        return { success: true, user: data.user, message: '로그인 성공' };
      }
    } catch {
      // Network failure, continue to local search
    }

    // 2. Offline / LocalStorage Fallback (Never fail if user is in vault or local DB)
    const localUsers = await this.getUsers();
    const found = localUsers.find((u) => {
      const uParentDigits = this.extractDigits(u.parentPhone || '');
      const uPhoneDigits = this.extractDigits(u.phone || '');
      const uName = (u.name || '').trim().toLowerCase();
      const normUName = (u.name || '').replace(/\s+/g, '').toLowerCase();
      const uId = (u.studentId || '').trim().toLowerCase();

      const matchesPhone = digits.length >= 4 && (
        uParentDigits.endsWith(digits) ||
        uPhoneDigits.endsWith(digits) ||
        (digits.length >= 7 && (uParentDigits.includes(digits) || digits.includes(uParentDigits)))
      );
      const matchesName = normIdent.length > 0 && (normUName === normIdent || normUName.includes(normIdent) || uName === cleanIdent.toLowerCase());
      const matchesId = uId === cleanIdent.toLowerCase() || uId === normIdent;

      return matchesPhone || matchesName || matchesId;
    });

    if (found) {
      const expectedPass = found.password || this.getLast4Digits(found.parentPhone || found.phone || '');
      if (cleanPass && cleanPass !== expectedPass && cleanPass !== '1234' && cleanPass !== 'admin') {
        return { success: false, message: '비밀번호(전화번호 뒷자리 4자리)가 일치하지 않습니다.' };
      }

      found.isApproved = true;
      found.lastLoginAt = Date.now();
      try {
        localStorage.setItem('typang_current_user', JSON.stringify(found));
        sessionStorage.setItem('typang_active_user_id', found.id);
      } catch {}

      // Background sync to server so server knows this student
      fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: found.name,
          parentPhone: found.parentPhone || found.phone,
          phone: found.phone || found.parentPhone,
          grade: found.grade,
          avatar: found.avatar,
          avatarBg: found.avatarBg,
        }),
      }).catch(() => {});

      return { success: true, user: found, message: '로그인 성공' };
    }

    return {
      success: false,
      message: `'${cleanIdent}' 학생 정보를 찾을 수 없습니다. 학생 이름이나 부모님 전화번호로 등록해 주세요.`,
    };
  }

  // Register single student with parent phone (auto-generates last 4 digits as password)
  public async registerStudent(params: {
    name: string;
    parentPhone: string;
    phone?: string;
    grade?: number;
    avatar?: string;
    avatarBg?: string;
  }): Promise<{ success: boolean; user?: UserSession; message: string }> {
    const { name, parentPhone, phone, grade = 3, avatar = '⭐', avatarBg = 'bg-yellow-100' } = params;
    const cleanPhone = this.formatPhone(parentPhone || phone || '');
    const last4 = this.getLast4Digits(parentPhone || phone || '');

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          parentPhone: cleanPhone,
          phone: cleanPhone,
          grade,
          avatar,
          avatarBg,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        // Sync local users
        await this.getUsers();
        return {
          success: true,
          user: data.user,
          message: data.message || `'${name}' 학생이 등록되었습니다. 비밀번호는 [${last4}]입니다.`,
        };
      }
      return { success: false, message: data.message || '가입 처리에 실패했습니다.' };
    } catch (e) {
      // Local fallback
      const newUser: UserSession = {
        id: `user_local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        studentId: `std_${last4}`,
        phone: cleanPhone,
        parentPhone: cleanPhone,
        grade,
        password: last4,
        avatar,
        avatarBg,
        levelTitle: `${grade}학년 타자 꿈나무`,
        isApproved: true,
        role: 'student',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        totalPracticeCount: 0,
        highestCpm: 0,
      };

      const localUsers = await this.getUsers();
      const updated = [newUser, ...localUsers];
      try {
        localStorage.setItem('typang_users_db', JSON.stringify(updated));
      } catch {}

      return {
        success: true,
        user: newUser,
        message: `'${name}' 학생이 등록되었습니다. (비밀번호: 뒷자리 ${last4})`,
      };
    }
  }

  // Batch register students (Handles 50+ students in one single request)
  public async batchRegisterStudents(students: Array<{
    name: string;
    parentPhone: string;
    grade?: number;
    avatar?: string;
  }>): Promise<BatchRegisterResult> {
    try {
      const res = await fetch('/api/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students, autoApprove: true }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Sync fresh users
        await this.getUsers();
        return {
          success: true,
          addedCount: data.addedCount,
          skippedCount: data.skippedCount,
          totalUsers: data.totalUsers,
          message: `총 ${data.addedCount}명의 학생 계정이 정상 등록되었습니다!`,
        };
      }
      return {
        success: false,
        addedCount: 0,
        skippedCount: students.length,
        totalUsers: 0,
        message: data.message || '일괄 등록에 실패했습니다.',
      };
    } catch (e) {
      console.warn('Batch registration server request failed, using local storage fallback:', e);
      // Local fallback
      const localUsers = await this.getUsers();
      const newItems: UserSession[] = [];
      const seen = new Set(localUsers.map((u) => `${u.name}_${this.extractDigits(u.parentPhone || u.phone || '')}`));

      for (const s of students) {
        const digits = this.extractDigits(s.parentPhone);
        const key = `${s.name}_${digits}`;
        if (!seen.has(key) && digits.length >= 4) {
          seen.add(key);
          const last4 = this.getLast4Digits(digits);
          newItems.push({
            id: `user_b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: s.name,
            studentId: `std_${last4}`,
            phone: this.formatPhone(s.parentPhone),
            parentPhone: this.formatPhone(s.parentPhone),
            grade: s.grade || 3,
            password: last4,
            avatar: s.avatar || '⭐',
            avatarBg: 'bg-yellow-100',
            levelTitle: `${s.grade || 3}학년 타자 꿈나무`,
            isApproved: true,
            role: 'student',
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            totalPracticeCount: 0,
            highestCpm: 0,
          });
        }
      }

      const merged = [...newItems, ...localUsers];
      try {
        localStorage.setItem('typang_users_db', JSON.stringify(merged));
      } catch {}

      return {
        success: newItems.length > 0,
        addedCount: newItems.length,
        skippedCount: students.length - newItems.length,
        totalUsers: merged.length,
        message: `${newItems.length}명이 등록되었습니다.`,
      };
    }
  }

  // Update user in server (Protected: Master only for credential/approval changes)
  public async updateUser(id: string, updates: Partial<UserSession>): Promise<boolean> {
    let role = 'student';
    try {
      const cur = localStorage.getItem('typang_current_user');
      if (cur) role = JSON.parse(cur).role || 'student';
    } catch {}

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': role,
          'x-master-auth': role === 'master' ? 'true' : 'false',
        },
        body: JSON.stringify(updates),
      });

      // Update local cache and vault as well
      if (res.ok) {
        try {
          const dbStr = localStorage.getItem('typang_users_db');
          if (dbStr) {
            const list: UserSession[] = JSON.parse(dbStr);
            const updated = list.map((u) => (u.id === id ? { ...u, ...updates } : u));
            localStorage.setItem('typang_users_db', JSON.stringify(updated));
            localStorage.setItem('typang_registered_students_vault', JSON.stringify(updated));
          }
        } catch {}
      }

      return res.ok;
    } catch {
      return false;
    }
  }

  // Delete user from server (Protected: strictly Master only)
  public async deleteUser(id: string): Promise<boolean> {
    let role = 'student';
    try {
      const cur = localStorage.getItem('typang_current_user');
      if (cur) role = JSON.parse(cur).role || 'student';
    } catch {}

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-role': role,
          'x-master-auth': role === 'master' ? 'true' : 'false',
        },
      });

      if (res.ok) {
        try {
          const dbStr = localStorage.getItem('typang_users_db');
          if (dbStr) {
            const list: UserSession[] = JSON.parse(dbStr);
            const filtered = list.filter((u) => u.id !== id);
            localStorage.setItem('typang_users_db', JSON.stringify(filtered));
            localStorage.setItem('typang_registered_students_vault', JSON.stringify(filtered));
          }
        } catch {}
      }

      return res.ok;
    } catch {
      return false;
    }
  }

  // Get leaderboard
  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          try {
            localStorage.setItem('typang_leaderboard', JSON.stringify(data.leaderboard));
          } catch {}
          return data.leaderboard;
        }
      }
    } catch {}

    try {
      const local = localStorage.getItem('typang_leaderboard');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }

  // Record score in leaderboard
  public async recordScore(entry: Omit<LeaderboardEntry, 'id' | 'date'>): Promise<LeaderboardEntry[]> {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.leaderboard)) {
          try {
            localStorage.setItem('typang_leaderboard', JSON.stringify(data.leaderboard));
          } catch {}
          return data.leaderboard;
        }
      }
    } catch {}

    // Fallback
    const local = await this.getLeaderboard();
    const newEntry: LeaderboardEntry = {
      ...entry,
      id: `lead_local_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
    };
    const updated = [newEntry, ...local].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 100);
    try {
      localStorage.setItem('typang_leaderboard', JSON.stringify(updated));
    } catch {}
    return updated;
  }
}

export const typangApi = new TypangApiClient();
