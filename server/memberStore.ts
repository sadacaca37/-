/**
 * 회원 명단 저장소 (마스터 전용 관리 · 코드 수정/재배포 후에도 유지)
 *
 * ▸ members.json (프로젝트 최상위, 코드와 함께 커밋되는 "고정 명단")
 *     재배포하면 서버의 임시 폴더(data/)는 비워지지만, members.json 은 코드에 들어 있으므로 그대로 남습니다.
 *     마스터 관리실 ▸ [명단 고정 파일 받기] 로 받은 파일을 이 위치에 덮어쓰면 명단이 영구 고정됩니다.
 *
 * ▸ data/members-live.json (서버 실행 중의 최신 상태)
 *     마스터가 추가·삭제·승인하면 즉시 여기에 저장되어 서버가 재시작해도 유지됩니다.
 *
 * 개인정보 보호: 공개 저장소에 올라가도 안전하도록 전화번호는 뒷 4자리만 보이게 가리고(010-****-1234)
 * 전체 번호와 비밀번호는 해시(SHA-256)로만 저장합니다. 평문 비밀번호는 어디에도 저장하지 않습니다.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const SALT = 'tajapangpang::v1';
export const hash = (s: string) => crypto.createHash('sha256').update(SALT + String(s)).digest('hex');
export const digitsOf = (s: string) => String(s || '').replace(/[^0-9]/g, '');
const last4 = (d: string) => (d.length >= 4 ? d.slice(-4) : d.padEnd(4, '0'));

export interface Member {
  id: string;
  name: string;
  studentId?: string;
  grade?: number;
  role: 'student';
  isApproved: boolean;
  phoneMasked: string; // 010-****-1234
  phoneLast4: string;
  phoneHash: string; // 전체 번호 해시 (정확히 일치하는 번호로 로그인할 때 사용)
  passwordHash: string;
  avatar?: string;
  avatarBg?: string;
  levelTitle?: string;
  createdAt: number;
  lastLoginAt?: number;
  totalPracticeCount?: number;
  highestCpm?: number;
  timeSpentSeconds?: number;
  updatedAt?: number;
}

interface FixedFile {
  version: number;
  updatedAt: number;
  masterPasswordHash?: string;
  members: Member[];
}

interface LiveFile extends FixedFile {
  baseUpdatedAt: number; // 이 상태가 기반으로 한 members.json 의 updatedAt
  pendingChanges: number; // members.json 에 아직 고정되지 않은 변경 수
}

export const maskPhone = (raw: string) => {
  const d = digitsOf(raw);
  if (d.length < 4) return '';
  const head = d.length >= 10 ? d.slice(0, 3) : '';
  return head ? `${head}-****-${d.slice(-4)}` : `****-${d.slice(-4)}`;
};

/** 예전 형식(평문 전화번호/비밀번호) 레코드를 새 형식으로 변환 */
const normalize = (u: any): Member | null => {
  if (!u || !u.name || u.role === 'master') return null;
  const d = digitsOf(u.parentPhone || u.phone || '');
  const phoneLast4 = u.phoneLast4 || (d ? last4(d) : '');
  return {
    id: String(u.id || `user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    name: String(u.name).trim(),
    studentId: u.studentId,
    grade: Number(u.grade) || 3,
    role: 'student',
    isApproved: u.isApproved !== false,
    phoneMasked: u.phoneMasked || maskPhone(d),
    phoneLast4,
    phoneHash: u.phoneHash || (d ? hash(d) : ''),
    passwordHash: u.passwordHash || hash(u.password || phoneLast4),
    avatar: u.avatar || '⭐',
    avatarBg: u.avatarBg || 'bg-yellow-100',
    levelTitle: u.levelTitle || `${Number(u.grade) || 3}학년 타자 꿈나무`,
    createdAt: Number(u.createdAt) || Date.now(),
    lastLoginAt: Number(u.lastLoginAt) || 0,
    totalPracticeCount: Number(u.totalPracticeCount) || 0,
    highestCpm: Number(u.highestCpm) || 0,
    timeSpentSeconds: Number(u.timeSpentSeconds) || 0,
  };
};

const STAT_FIELDS = ['lastLoginAt', 'totalPracticeCount', 'highestCpm', 'timeSpentSeconds', 'avatar', 'avatarBg'] as const;

export class MemberStore {
  members: Member[] = [];
  byId = new Map<string, Member>();
  masterPasswordHash = '';
  baseUpdatedAt = 0;
  pendingChanges = 0;
  private writeTimer: NodeJS.Timeout | null = null;
  private writing = false;
  private writeAgain = false;

  constructor(private fixedPath: string, private livePath: string) {
    this.load();
  }

  private readJson(p: string): any {
    try {
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
    } catch (e) {
      console.warn('[members] 읽기 실패', p, e);
    }
    return null;
  }

  private load() {
    const fixedRaw = this.readJson(this.fixedPath);
    const fixed: FixedFile = {
      version: 1,
      updatedAt: Number(fixedRaw?.updatedAt) || 0,
      masterPasswordHash: fixedRaw?.masterPasswordHash || '',
      members: (Array.isArray(fixedRaw?.members) ? fixedRaw.members : []).map(normalize).filter(Boolean) as Member[],
    };

    // 실행 중 상태: 새 형식 → 예전 data/users.json(평문 배열) 순서로 찾음
    let liveRaw = this.readJson(this.livePath);
    if (!liveRaw) {
      const legacy = this.readJson(path.join(path.dirname(this.livePath), 'users.json'));
      if (Array.isArray(legacy)) liveRaw = { baseUpdatedAt: fixed.updatedAt, pendingChanges: legacy.length ? 1 : 0, members: legacy };
    }
    const live: LiveFile | null = liveRaw
      ? {
          version: 1,
          updatedAt: Number(liveRaw.updatedAt) || 0,
          baseUpdatedAt: Number(liveRaw.baseUpdatedAt) || 0,
          pendingChanges: Number(liveRaw.pendingChanges) || 0,
          masterPasswordHash: liveRaw.masterPasswordHash || '',
          members: (Array.isArray(liveRaw.members) ? liveRaw.members : []).map(normalize).filter(Boolean) as Member[],
        }
      : null;

    if (live && live.baseUpdatedAt >= fixed.updatedAt) {
      // 서버가 재시작만 된 경우: 마지막 상태 그대로
      this.members = live.members;
      this.masterPasswordHash = live.masterPasswordHash || fixed.masterPasswordHash || '';
      this.baseUpdatedAt = live.baseUpdatedAt;
      this.pendingChanges = live.pendingChanges;
    } else {
      // 새로 배포됨(또는 더 새 members.json 이 올라옴): 고정 명단이 기준, 연습 기록만 이어받음
      const stats = new Map((live?.members || []).map((m) => [m.id, m]));
      this.members = fixed.members.map((m) => {
        const s = stats.get(m.id);
        if (!s) return m;
        const merged: any = { ...m };
        for (const k of STAT_FIELDS) if ((s as any)[k] !== undefined) merged[k] = (s as any)[k];
        merged.highestCpm = Math.max(m.highestCpm || 0, s.highestCpm || 0);
        merged.totalPracticeCount = Math.max(m.totalPracticeCount || 0, s.totalPracticeCount || 0);
        return merged;
      });
      this.masterPasswordHash = fixed.masterPasswordHash || '';
      this.baseUpdatedAt = fixed.updatedAt;
      this.pendingChanges = 0;
      this.saveSoon();
    }
    this.reindex();
    console.log(`[members] 명단 ${this.members.length}명 로드 (고정 파일 기준시각 ${this.baseUpdatedAt || '없음'})`);
  }

  private reindex() {
    this.byId = new Map(this.members.map((m) => [m.id, m]));
  }

  /* ---------------- 저장 (여러 명이 동시에 바꿔도 한 번에 모아서 원자적으로 기록) ---------------- */
  saveSoon() {
    if (this.writeTimer) return;
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.flush();
    }, 300);
  }

  flush(sync = false) {
    const data: LiveFile = {
      version: 1,
      updatedAt: Date.now(),
      baseUpdatedAt: this.baseUpdatedAt,
      pendingChanges: this.pendingChanges,
      masterPasswordHash: this.masterPasswordHash,
      members: this.members,
    };
    const body = JSON.stringify(data);
    const tmp = `${this.livePath}.tmp`;
    if (sync) {
      try {
        fs.writeFileSync(tmp, body, 'utf-8');
        fs.renameSync(tmp, this.livePath);
      } catch (e) {
        console.error('[members] 저장 실패', e);
      }
      return;
    }
    if (this.writing) {
      this.writeAgain = true;
      return;
    }
    this.writing = true;
    fs.writeFile(tmp, body, 'utf-8', (err) => {
      const done = () => {
        this.writing = false;
        if (this.writeAgain) {
          this.writeAgain = false;
          this.flush();
        }
      };
      if (err) {
        console.error('[members] 저장 실패', err);
        return done();
      }
      fs.rename(tmp, this.livePath, done);
    });
  }

  private changed() {
    this.pendingChanges++;
    this.saveSoon();
  }

  /* ---------------- 마스터 ---------------- */
  checkMaster(pw: string | undefined): boolean {
    const p = String(pw || '').trim();
    if (!p) return false;
    if (process.env.MASTER_PASSWORD) return p === process.env.MASTER_PASSWORD;
    if (this.masterPasswordHash) return hash(p) === this.masterPasswordHash;
    return p === '1234' || p === 'admin'; // 아직 마스터 비밀번호를 정하지 않은 경우의 기본값
  }

  setMasterPassword(pw: string) {
    this.masterPasswordHash = hash(pw.trim());
    this.changed();
  }

  /* ---------------- 조회 ---------------- */
  /** 화면에 보낼 모양 (해시는 절대 내보내지 않음) */
  toClient(m: Member, full: boolean) {
    const base: any = {
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      avatarBg: m.avatarBg,
      grade: m.grade,
      role: 'student',
      levelTitle: m.levelTitle,
      highestCpm: m.highestCpm || 0,
      totalPracticeCount: m.totalPracticeCount || 0,
      createdAt: m.createdAt,
      lastLoginAt: m.lastLoginAt || 0,
      isApproved: m.isApproved,
    };
    if (full) {
      base.studentId = m.studentId;
      base.phone = m.phoneMasked;
      base.parentPhone = m.phoneMasked;
      base.passwordIsDefault = m.passwordHash === hash(m.phoneLast4);
      base.password = base.passwordIsDefault ? `뒷자리(${m.phoneLast4})` : '변경됨';
    }
    return base;
  }

  list(full: boolean) {
    // 마스터가 아니면 승인된 학생의 이름·아바타만
    return (full ? this.members : this.members.filter((m) => m.isApproved)).map((m) => this.toClient(m, full));
  }

  findForLogin(identifier: string, password: string): { member?: Member; reason?: 'notfound' | 'password' } {
    const ident = String(identifier || '').trim();
    const d = digitsOf(ident);
    const norm = ident.replace(/\s+/g, '').toLowerCase();
    const pwHash = hash(String(password || '').trim());
    const candidates = this.members.filter((m) => {
      const byName = norm.length > 0 && m.name.replace(/\s+/g, '').toLowerCase() === norm;
      const byId = !!m.studentId && m.studentId.toLowerCase() === norm;
      const byPhone = d.length >= 7 ? m.phoneHash === hash(d) : d.length === 4 && m.phoneLast4 === d;
      return byName || byId || byPhone;
    });
    if (!candidates.length) return { reason: 'notfound' };
    // 같은 이름/같은 번호(형제)가 있어도 비밀번호가 맞는 학생으로 로그인
    const hit = candidates.find((m) => m.passwordHash === pwHash);
    return hit ? { member: hit } : { reason: 'password' };
  }

  /* ---------------- 변경 ---------------- */
  add(input: { name: string; phone: string; grade?: number; avatar?: string; avatarBg?: string; approved: boolean; password?: string }) {
    const d = digitsOf(input.phone);
    const name = input.name.trim();
    const dup = this.members.find((m) => m.name === name && m.phoneHash === hash(d));
    if (dup) return { member: dup, existing: true };
    const grade = Number(input.grade) || 3;
    const m: Member = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      studentId: `std_${last4(d)}_${Math.random().toString(36).slice(2, 5)}`,
      grade,
      role: 'student',
      isApproved: input.approved,
      phoneMasked: maskPhone(d),
      phoneLast4: last4(d),
      phoneHash: hash(d),
      passwordHash: hash(input.password || last4(d)),
      avatar: input.avatar || '⭐',
      avatarBg: input.avatarBg || 'bg-yellow-100',
      levelTitle: `${grade}학년 타자 꿈나무`,
      createdAt: Date.now(),
      lastLoginAt: 0,
      totalPracticeCount: 0,
      highestCpm: 0,
    };
    this.members.unshift(m);
    this.byId.set(m.id, m);
    this.changed();
    return { member: m, existing: false };
  }

  update(id: string, patch: any, asMaster: boolean) {
    const m = this.byId.get(id);
    if (!m) return null;
    let rosterChange = false;
    if (asMaster) {
      if (typeof patch.name === 'string' && patch.name.trim()) { m.name = patch.name.trim(); rosterChange = true; }
      if (patch.grade !== undefined) { m.grade = Number(patch.grade) || m.grade; rosterChange = true; }
      if (typeof patch.isApproved === 'boolean') { m.isApproved = patch.isApproved; rosterChange = true; }
      if (typeof patch.password === 'string' && patch.password.trim().length >= 4) { m.passwordHash = hash(patch.password.trim()); rosterChange = true; }
      if (typeof patch.phone === 'string' && digitsOf(patch.phone).length >= 4) {
        const d = digitsOf(patch.phone);
        m.phoneMasked = maskPhone(d); m.phoneLast4 = last4(d); m.phoneHash = hash(d); rosterChange = true;
      }
    }
    // 연습 기록·아바타는 본인도 바꿀 수 있음
    if (patch.highestCpm !== undefined) m.highestCpm = Math.max(m.highestCpm || 0, Number(patch.highestCpm) || 0);
    if (patch.totalPracticeCount !== undefined) m.totalPracticeCount = Math.max(m.totalPracticeCount || 0, Number(patch.totalPracticeCount) || 0);
    if (patch.timeSpentSeconds !== undefined) m.timeSpentSeconds = Number(patch.timeSpentSeconds) || 0;
    if (patch.lastLoginAt !== undefined) m.lastLoginAt = Number(patch.lastLoginAt) || Date.now();
    if (typeof patch.avatar === 'string') m.avatar = patch.avatar.slice(0, 16);
    if (typeof patch.avatarBg === 'string') m.avatarBg = patch.avatarBg.slice(0, 40);
    m.updatedAt = Date.now();
    if (rosterChange) this.changed();
    else this.saveSoon();
    return m;
  }

  remove(id: string) {
    const before = this.members.length;
    this.members = this.members.filter((m) => m.id !== id);
    if (this.members.length === before) return false;
    this.byId.delete(id);
    this.changed();
    return true;
  }

  touchLogin(m: Member) {
    m.lastLoginAt = Date.now();
    this.saveSoon();
  }

  /** members.json 으로 내려받을 고정 명단 */
  exportFixed(): FixedFile {
    const now = Date.now();
    this.baseUpdatedAt = now;
    this.pendingChanges = 0;
    this.saveSoon();
    return {
      version: 1,
      updatedAt: now,
      masterPasswordHash: this.masterPasswordHash || undefined,
      members: this.members,
    };
  }

  /** 백업 파일에서 명단 되돌리기 (같은 id는 최신 것으로 덮어씀) */
  importFixed(file: FixedFile): number {
    if (!file || !Array.isArray(file.members)) return 0;
    let count = 0;
    for (const raw of file.members) {
      if (!raw || !raw.id || !raw.name) continue;
      const exist = this.byId.get(raw.id);
      const merged = { ...(exist || {}), ...raw } as Member;
      if (exist) {
        const idx = this.members.indexOf(exist);
        this.members[idx] = merged;
      } else {
        this.members.push(merged);
      }
      this.byId.set(merged.id, merged);
      count++;
    }
    if (file.masterPasswordHash) this.masterPasswordHash = file.masterPasswordHash;
    this.changed();
    this.flush(true);
    return count;
  }

  status() {
    return {
      total: this.members.length,
      pendingApproval: this.members.filter((m) => !m.isApproved).length,
      pendingChanges: this.pendingChanges,
      fixedUpdatedAt: this.baseUpdatedAt,
      masterPasswordSet: !!(process.env.MASTER_PASSWORD || this.masterPasswordHash),
    };
  }
}
