import { UserSession, LeaderboardEntry } from '../types';

export interface BatchRegisterResult {
  success: boolean;
  addedCount: number;
  skippedCount: number;
  totalUsers: number;
  message?: string;
}

export interface MembersStatus {
  total: number;
  pendingApproval: number;
  pendingChanges: number; // members.json 에 아직 고정되지 않은 변경 수
  fixedUpdatedAt: number;
  masterPasswordSet: boolean;
}

const USERS_CACHE_KEY = 'typang_users_db';
const MASTER_KEY = 'typang_master_key';

/**
 * 서버가 회원 명단의 유일한 기준입니다.
 * (예전처럼 브라우저에 남은 명단을 서버에 다시 밀어넣지 않으므로, 마스터가 삭제한 학생이 되살아나지 않습니다.)
 */
class TypangApiClient {
  /* ---------------- helpers ---------------- */
  public extractDigits(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '');
  }

  public getLast4Digits(phone: string): string {
    const digits = this.extractDigits(phone);
    return digits.length >= 4 ? digits.slice(-4) : digits.padEnd(4, '0');
  }

  public formatPhone(raw: string): string {
    const d = this.extractDigits(raw);
    if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return raw;
  }

  /* ---------------- master key (이 브라우저에서 마스터로 인증한 동안만 보관) ---------------- */
  public getMasterKey(): string {
    try {
      return localStorage.getItem(MASTER_KEY) || '';
    } catch {
      return '';
    }
  }
  public setMasterKey(key: string) {
    try {
      localStorage.setItem(MASTER_KEY, key);
    } catch {}
  }
  public clearMasterKey() {
    try {
      localStorage.removeItem(MASTER_KEY);
    } catch {}
  }

  private headers(json = true): Record<string, string> {
    const h: Record<string, string> = {};
    if (json) h['Content-Type'] = 'application/json';
    const k = this.getMasterKey();
    if (k) h['x-master-key'] = k;
    return h;
  }

  private async request<T = any>(url: string, init: RequestInit = {}, timeoutMs = 10000): Promise<{ ok: boolean; status: number; data: T | any }> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ctrl.signal });
      let data: any = null;
      try {
        data = await res.json();
      } catch {}
      return { ok: res.ok, status: res.status, data };
    } finally {
      clearTimeout(t);
    }
  }

  /** 서버 API 가 실제로 응답했는지 (정적 미리보기처럼 서버가 없으면 HTML/404 가 옴) */
  private isApi(r: { data: any }) {
    return !!r.data && typeof r.data === 'object' && 'success' in r.data;
  }

  /* ---- 서버가 없는 곳(미리보기)에서 쓰는 이 브라우저 전용 명단 ---- */
  private localList(): UserSession[] {
    return this.getCachedUsers();
  }
  private localSave(list: UserSession[]) {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(list));
    } catch {}
  }
  private localAdd(p: { name: string; phone: string; grade?: number; avatar?: string; avatarBg?: string; approved: boolean }) {
    const d = this.extractDigits(p.phone);
    const list = this.localList();
    const dup = list.find((u) => u.name === p.name.trim() && this.extractDigits(u.parentPhone || u.phone || '') === d);
    if (dup) return { user: dup, existing: true };
    const grade = Number(p.grade) || 3;
    const user: UserSession = {
      id: `user_local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: p.name.trim(),
      studentId: `std_${this.getLast4Digits(d)}`,
      phone: this.formatPhone(d),
      parentPhone: this.formatPhone(d),
      grade,
      password: this.getLast4Digits(d),
      avatar: p.avatar || '⭐',
      avatarBg: p.avatarBg || 'bg-yellow-100',
      levelTitle: `${grade}학년 타자 꿈나무`,
      isApproved: p.approved,
      role: 'student',
      createdAt: Date.now(),
      lastLoginAt: 0,
      totalPracticeCount: 0,
      highestCpm: 0,
    };
    this.localSave([user, ...list]);
    return { user, existing: false };
  }

  private cacheUsers(users: UserSession[]) {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
      localStorage.removeItem('typang_registered_students_vault'); // 예전 "영구 볼트"는 더 이상 쓰지 않음
    } catch {}
  }

  public getCachedUsers(): UserSession[] {
    try {
      const raw = localStorage.getItem(USERS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /* ---------------- members ---------------- */
  /** 서버 명단 (마스터 인증 상태면 관리용 정보 포함). 서버에 닿지 않으면 마지막으로 받은 명단 */
  public async getUsers(): Promise<UserSession[]> {
    try {
      const r = await this.request('/api/users', { headers: this.headers(false) });
      if (r.ok && r.data?.success && Array.isArray(r.data.users)) {
        this.cacheUsers(r.data.users);
        return r.data.users;
      }
    } catch {}
    return this.getCachedUsers();
  }

  /** 더 이상 사용하지 않음 (호환용) */
  public async syncUsers(_users: UserSession[]): Promise<boolean> {
    return true;
  }

  public async login(identifier: string, password?: string): Promise<{ success: boolean; user?: UserSession; message: string; pending?: boolean }> {
    try {
      const r = await this.request('/api/users/login', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ identifier: identifier.trim(), password: (password || '').trim() }),
      });
      if (r.ok && r.data?.success && r.data.user) {
        try {
          localStorage.setItem('typang_current_user', JSON.stringify(r.data.user));
          sessionStorage.setItem('typang_active_user_id', r.data.user.id);
        } catch {}
        return { success: true, user: r.data.user, message: '로그인 성공' };
      }
      if (!this.isApi(r)) return this.localLogin(identifier, password || '');
      return { success: false, pending: !!r.data?.pending, message: r.data?.message || '로그인에 실패했어요.' };
    } catch {
      return this.localLogin(identifier, password || '');
    }
  }

  private localLogin(identifier: string, password: string) {
    const ident = identifier.trim().replace(/\s+/g, '').toLowerCase();
    const d = this.extractDigits(identifier);
    const pw = password.trim();
    const hit = this.localList().find((u) => {
      const ud = this.extractDigits(u.parentPhone || u.phone || '');
      const match = u.name.replace(/\s+/g, '').toLowerCase() === ident || (d.length >= 7 && ud === d) || (d.length === 4 && ud.endsWith(d));
      const okPw = (u.password && u.password === pw) || (ud && ud.slice(-4) === pw);
      return match && okPw;
    });
    if (!hit) return { success: false, message: '학생 정보를 찾을 수 없거나 비밀번호가 맞지 않아요.' };
    if (!hit.isApproved) return { success: false, pending: true, message: `'${hit.name}' 학생은 선생님 승인 대기 중이에요.` };
    try {
      localStorage.setItem('typang_current_user', JSON.stringify(hit));
    } catch {}
    return { success: true, user: hit, message: '로그인 성공' };
  }

  /** 학생이 하면 "가입 신청"(승인 대기), 마스터가 하면 바로 등록 */
  public async registerStudent(params: {
    name: string;
    parentPhone: string;
    phone?: string;
    grade?: number;
    avatar?: string;
    avatarBg?: string;
  }): Promise<{ success: boolean; user?: UserSession; message: string; pending?: boolean }> {
    const { name, parentPhone, phone, grade = 3, avatar = '⭐', avatarBg = 'bg-yellow-100' } = params;
    try {
      const r = await this.request('/api/users/register', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ name: name.trim(), parentPhone: parentPhone || phone, grade, avatar, avatarBg }),
      });
      if (r.ok && r.data?.success) {
        return { success: true, user: r.data.user, pending: !!r.data.pending, message: r.data.message };
      }
      if (!this.isApi(r)) return this.localRegister(name, parentPhone || phone || '', grade, avatar, avatarBg);
      return { success: false, message: r.data?.message || '등록에 실패했어요.' };
    } catch {
      return this.localRegister(name, parentPhone || phone || '', grade, avatar, avatarBg);
    }
  }

  private localRegister(name: string, phone: string, grade: number, avatar: string, avatarBg: string) {
    if (!name.trim() || this.extractDigits(phone).length < 8) return { success: false, message: '이름과 부모님 전화번호를 확인해 주세요.' };
    const master = !!this.getMasterKey();
    const r = this.localAdd({ name, phone, grade, avatar, avatarBg, approved: master });
    return {
      success: true,
      user: r.user,
      pending: !r.user.isApproved,
      message: master ? `'${r.user.name}' 학생을 등록했어요.` : `'${r.user.name}' 가입 신청이 접수됐어요. 선생님 승인 후 로그인할 수 있어요.`,
    };
  }

  public async batchRegisterStudents(
    students: Array<{ name: string; parentPhone: string; grade?: number; avatar?: string }>,
    autoApprove = true,
  ): Promise<BatchRegisterResult> {
    try {
      const r = await this.request('/api/users/batch', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ students, autoApprove }),
      }, 30000);
      if (r.ok && r.data?.success) {
        return {
          success: true,
          addedCount: r.data.addedCount,
          skippedCount: r.data.skippedCount,
          totalUsers: r.data.totalUsers,
          message: `총 ${r.data.addedCount}명의 학생을 등록했어요.`,
        };
      }
      if (!this.isApi(r)) return this.localBatch(students, autoApprove);
      return { success: false, addedCount: 0, skippedCount: students.length, totalUsers: 0, message: r.data?.message || '일괄 등록에 실패했어요.' };
    } catch {
      return this.localBatch(students, autoApprove);
    }
  }

  private localBatch(students: Array<{ name: string; parentPhone: string; grade?: number; avatar?: string }>, autoApprove: boolean): BatchRegisterResult {
    let added = 0;
    let skipped = 0;
    for (const st of students) {
      if (!st.name || this.extractDigits(st.parentPhone).length < 7) { skipped++; continue; }
      const r = this.localAdd({ name: st.name, phone: st.parentPhone, grade: st.grade, avatar: st.avatar, approved: autoApprove });
      if (r.existing) skipped++; else added++;
    }
    return { success: true, addedCount: added, skippedCount: skipped, totalUsers: this.localList().length, message: `총 ${added}명의 학생을 등록했어요.` };
  }

  public async updateUser(id: string, updates: Partial<UserSession>): Promise<boolean> {
    try {
      const r = await this.request(`/api/users/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify(updates),
      });
      if (r.ok) return true;
      if (!this.isApi(r)) return this.localUpdate(id, updates);
      return false;
    } catch {
      return this.localUpdate(id, updates);
    }
  }

  private localUpdate(id: string, updates: Partial<UserSession>) {
    const list = this.localList();
    if (!list.some((u) => u.id === id)) return false;
    this.localSave(list.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    return true;
  }

  public async deleteUser(id: string): Promise<boolean> {
    try {
      const r = await this.request(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers: this.headers(false) });
      if (r.ok) return true;
      if (!this.isApi(r)) return this.localDelete(id);
      return false;
    } catch {
      return this.localDelete(id);
    }
  }

  private localDelete(id: string) {
    const list = this.localList();
    const next = list.filter((u) => u.id !== id);
    if (next.length === list.length) return false;
    this.localSave(next);
    return true;
  }

  /* ---------------- master ---------------- */
  /**
   * 마스터 로그인
   * 1) 서버에서 확인
   * 2) 서버가 거절했지만 이 브라우저에 예전에 저장한 마스터 비밀번호(localPasswordOk)와 같고,
   *    서버는 아직 기본 비밀번호(1234)라면 → 기본값으로 들어간 뒤 서버 비밀번호를 예전 것으로 맞춰 줌
   * 3) 서버가 없는 곳(미리보기 등)에서는 이 브라우저의 마스터 설정으로 확인
   */
  public async masterLogin(password: string, localPasswordOk = false): Promise<{ success: boolean; message?: string; status?: MembersStatus }> {
    const pw = password.trim();
    const tryServer = async (p: string) =>
      this.request('/api/master/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: p }),
      });
    try {
      const r = await tryServer(pw);
      if (r.ok && r.data?.success) {
        this.setMasterKey(pw);
        return { success: true, status: r.data.status };
      }
      const serverAnswered = !!r.data && typeof r.data === 'object' && 'success' in r.data;
      if (!serverAnswered) {
        // 서버 API 가 없는 곳 (정적 미리보기 등)
        if (localPasswordOk) {
          this.setMasterKey(pw);
          return { success: true };
        }
        return { success: false, message: '마스터 비밀번호가 올바르지 않습니다.' };
      }
      if (localPasswordOk && pw !== '1234') {
        const def = await tryServer('1234');
        if (def.ok && def.data?.success) {
          this.setMasterKey('1234');
          const moved = await this.setMasterPassword(pw);
          if (moved.success) return { success: true, status: def.data.status };
          return { success: true, status: def.data.status };
        }
      }
      return { success: false, message: r.data?.message || '마스터 비밀번호가 올바르지 않습니다.' };
    } catch {
      if (localPasswordOk) {
        this.setMasterKey(pw);
        return { success: true };
      }
      return { success: false, message: '서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.' };
    }
  }

  /** 저장된 마스터 키가 서버에서 아직 유효한지: 'ok' | 'bad' | 'noserver' */
  public async checkMasterKey(): Promise<'ok' | 'bad' | 'noserver'> {
    if (!this.getMasterKey()) return 'bad';
    try {
      const r = await this.request('/api/members/status', { headers: this.headers(false) });
      if (r.ok && r.data?.success) return 'ok';
      return this.isApi(r) ? 'bad' : 'noserver';
    } catch {
      return 'noserver';
    }
  }

  public async getMembersStatus(): Promise<MembersStatus | null> {
    try {
      const r = await this.request('/api/members/status', { headers: this.headers(false) });
      return r.ok && r.data?.status ? r.data.status : null;
    } catch {
      return null;
    }
  }

  /** members.json 파일을 내려받음 */
  public async downloadMembersFile(): Promise<boolean> {
    try {
      const res = await fetch('/api/members/export', { headers: this.headers(false) });
      if (!res.ok) return false;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'members.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return true;
    } catch {
      return false;
    }
  }

  public async setMasterPassword(password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const r = await this.request('/api/master/password', {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ password }),
      });
      if (r.ok && r.data?.success) {
        this.setMasterKey(password);
        return { success: true };
      }
      return { success: false, message: r.data?.message || '변경에 실패했어요.' };
    } catch {
      return { success: false, message: '서버에 연결할 수 없어요.' };
    }
  }

  /* ---------------- leaderboard ---------------- */
  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const r = await this.request('/api/leaderboard');
      if (r.ok && r.data?.success && Array.isArray(r.data.leaderboard)) {
        try {
          localStorage.setItem('typang_leaderboard', JSON.stringify(r.data.leaderboard));
        } catch {}
        return r.data.leaderboard;
      }
    } catch {}
    try {
      const local = localStorage.getItem('typang_leaderboard');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }

  public async recordScore(entry: Omit<LeaderboardEntry, 'id' | 'date'>): Promise<LeaderboardEntry[]> {
    try {
      const r = await this.request('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (r.ok && r.data?.success && Array.isArray(r.data.leaderboard)) {
        try {
          localStorage.setItem('typang_leaderboard', JSON.stringify(r.data.leaderboard));
        } catch {}
        return r.data.leaderboard;
      }
    } catch {}
    const local = await this.getLeaderboard();
    const newEntry: LeaderboardEntry = { ...entry, id: `lead_local_${Date.now()}`, date: new Date().toISOString().slice(0, 10).replace(/-/g, '.') } as LeaderboardEntry;
    const updated = [newEntry, ...local].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 100);
    try {
      localStorage.setItem('typang_leaderboard', JSON.stringify(updated));
    } catch {}
    return updated;
  }
}

export const typangApi = new TypangApiClient();
