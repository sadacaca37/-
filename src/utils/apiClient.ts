/**
 * 타자팡 자료 창구 (모아팡 Firebase)
 *  - 예전에는 AI 스튜디오 서버의 파일에 저장해서, 서버가 잠들었다 깨면 기록이 사라졌음
 *  - 이제는 모아팡과 같은 Firebase에 저장: 학생 = 모아팡 반 + 이름, 선생님 = 모아팡 선생님 계정
 */
import { isApprovedNow } from './session';
import { noteWeekBest } from './weekBest';
import { readApprovals, setApprovals } from './tajaApproval';
import { readParentPhones } from './moaStudentImport';
import { readArchive, putArchive, dropArchive, markGone, ArchiveEntry } from './tajaArchive';
import { collection, collectionGroup, deleteField, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { get, ref, set } from 'firebase/database';
import { UserSession, LeaderboardEntry } from '../types';
import { fs, rt, ensureUser, isTeacherUser, teacherSignIn, signOutTeacher, parseUserId, pickTaja, userIdOf, kstMonth, errText, MEMBER_CID, MEMBER_CLASS, memberKey, phoneDigits, prettyPhone, rebuildLoginIndex } from './moaFirebase';

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
  pendingChanges: number;
  fixedUpdatedAt: number;
  masterPasswordSet: boolean;
}

const USERS_CACHE_KEY = 'typang_users_db';
const BOARD_KEY = 'typang_leaderboard';
const MOA_ONLY = '학생은 모아팡 첫 화면에서 방번호와 이름으로 들어오면 저절로 등록돼요. 따로 등록할 필요가 없어요.';

/* ---------------- 명예의 전당 정리 (예전 서버와 같은 규칙) ---------------- */
const LB_MAX_CPM = 1200;
const LB_PER_STUDENT = 3;
const lbWho = (e: any) => String(e?.userId || e?.userName || '');
const lbNum = (v: any, max: number) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
/** RTDB 칸 이름으로 쓸 수 있게 */
const safeKey = (s: string) => String(s || 'x').replace(/[.#$\[\]\/]/g, '_').slice(0, 120) || 'x';

export function tidyLeaderboard(list: any[], perStudent = LB_PER_STUDENT): LeaderboardEntry[] {
  const seen = new Set<string>();
  const per = new Map<string, number>();
  const out: any[] = [];
  const sorted = [...(Array.isArray(list) ? list : [])]
    .filter((e) => e && e.userName && Number(e.cpm) > 0 && Number(e.cpm) <= LB_MAX_CPM)
    .sort((a, b) => (b.cpm || 0) - (a.cpm || 0) || (b.accuracy || 0) - (a.accuracy || 0) || (b.score || 0) - (a.score || 0));
  for (const e of sorted) {
    const sig = [lbWho(e), e.cpm, e.accuracy, e.elapsedSeconds || 0, e.completedSentences || 0, e.modeTitle || ''].join('|');
    if (seen.has(sig) || seen.has(`id:${e.id}`)) continue;
    seen.add(sig);
    seen.add(`id:${e.id}`);
    const n = per.get(lbWho(e)) || 0;
    if (n >= perStudent) continue;
    per.set(lbWho(e), n + 1);
    out.push(e);
  }
  return out;
}

export function cleanLeaderboardEntry(raw: any): (LeaderboardEntry & { ts: number }) | null {
  if (!raw || !raw.userName) return null;
  const cpm = Number(raw.cpm);
  if (!(cpm > 0) || cpm > LB_MAX_CPM) return null;
  const now = Date.now();
  const ts = Number(raw.ts) > 1600000000000 && Number(raw.ts) < now + 86400000 ? Number(raw.ts) : now;
  const grade = Number(raw.grade);
  const e: any = {
    id: /^lead_[A-Za-z0-9_]{6,48}$/.test(String(raw.id || '')) ? String(raw.id) : `lead_${now}_${Math.random().toString(36).substring(2, 8)}`,
    userName: String(raw.userName).slice(0, 30),
    mode: String(raw.mode || 'sentence').slice(0, 20),
    modeTitle: String(raw.modeTitle || '').slice(0, 60),
    score: lbNum(raw.score, 1000000),
    cpm: lbNum(raw.cpm, 2000),
    accuracy: lbNum(raw.accuracy, 100),
    date: new Date(ts + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, '.'),
    ts,
  };
  if (raw.userId) e.userId = String(raw.userId).slice(0, 160);
  if (raw.userAvatar) e.userAvatar = String(raw.userAvatar).slice(0, 8);
  if (grade >= 1 && grade <= 6) e.grade = grade;
  if (raw.details) e.details = String(raw.details).slice(0, 80);
  if (raw.completedSentences) e.completedSentences = lbNum(raw.completedSentences, 9999);
  if (raw.elapsedSeconds) e.elapsedSeconds = lbNum(raw.elapsedSeconds, 86400);
  if (raw.errorCount != null) e.errorCount = lbNum(raw.errorCount, 99999);
  return e;
}

function flattenMonth(val: any): LeaderboardEntry[] {
  const all: any[] = [];
  if (val && typeof val === 'object') for (const v of Object.values<any>(val)) if (v && Array.isArray(v.entries)) all.push(...v.entries);
  return tidyLeaderboard(all).slice(0, 300);
}

class TypangApiClient {
  /* ---------------- helpers (예전 화면들이 씀) ---------------- */
  public extractDigits(phone: string): string {
    return (phone || '').replace(/[^0-9]/g, '');
  }
  public getLast4Digits(phone: string): string {
    const d = this.extractDigits(phone);
    return d.length >= 4 ? d.slice(-4) : d.padEnd(4, '0');
  }
  public formatPhone(raw: string): string {
    const d = this.extractDigits(raw);
    if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return raw;
  }

  /* ---------------- 선생님 = 모아팡 선생님 계정으로 로그인한 상태 ---------------- */
  public getMasterKey(): string {
    return isTeacherUser() ? 'moa-teacher' : '';
  }
  public setMasterKey(_key: string) {}
  public clearMasterKey() {
    void signOutTeacher();
  }

  public getCachedUsers(): UserSession[] {
    try {
      const raw = localStorage.getItem(USERS_CACHE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /* ---------------- 학생 명단 = 타자팡 회원 (이름 + 전화번호, 선생님 승인) ---------------- */
  public async getUsers(): Promise<UserSession[]> {
    if (!isTeacherUser()) return [];
    try {
      let [sts, approved, arc] = await Promise.all([getDocs(collectionGroup(fs, 'students')), readApprovals(true), readArchive(true)]);
      // 예전에 엑셀로 모아팡 반에 올린 학생(학부모 전화번호 있음)을 타자팡 회원으로 옮김 (한 번만, 승인 그대로, 완전히 삭제한 학생은 빼고)
      if (await this.migrateRoomStudents(sts.docs, approved, arc.gone)) {
        [sts, approved] = await Promise.all([getDocs(collectionGroup(fs, 'students')), readApprovals(true)]);
      }
      const users: UserSession[] = [];
      const archived: UserSession[] = [];
      for (const d of sts.docs) {
        const cid = d.ref.parent.parent?.id;
        if (cid !== MEMBER_CID) continue;
        const v = d.data() as any;
        const t = v.taja || {};
        const grade = Number(t.grade) || undefined;
        const id = userIdOf(cid, d.id);
        users.push({
          id,
          name: String(v.name || ''),
          studentId: grade ? `${grade}학년` : '학년 미정', // 타자팡은 학년만 (모아팡 반과 따로)
          grade,
          avatar: t.avatar || '⭐',
          avatarBg: t.avatarBg || 'bg-yellow-100',
          levelTitle: t.levelTitle || (grade ? `${grade}학년 타자 꿈나무` : '타자 꿈나무'),
          isApproved: !!approved[id],
          parentPhone: t.phone ? prettyPhone(t.phone) : undefined,
          role: 'student',
          createdAt: Number(v.created?.toMillis?.() || 0),
          lastLoginAt: Number(v.seen?.toMillis?.() || 0),
          totalPracticeCount: Number(t.totalPracticeCount) || 0,
          highestCpm: Number(t.highestCpm) || 0,
          moaOutfit: v.outfit || null, // 모아팡 캐릭터 옷차림 (성적표에 그림)
          school: String(t.school || ''),
        } as UserSession);
        // 보관함에 넣은 학생은 명단에서 빼서 보관함 목록으로
        const ar = arc.a[id];
        if (ar) {
          const u = users.pop()!;
          archived.push({ ...u, isApproved: false, archivedAt: Number(ar.at) || 0 });
        }
      }
      archived.sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
      this.archivedUsers = archived;
      users.sort((a, b) => Number(!!a.isApproved) - Number(!!b.isApproved) || (a.grade || 9) - (b.grade || 9) || a.name.localeCompare(b.name));
      // 뒷자리 로그인 목록 (승인한 회원만)
      void rebuildLoginIndex(
        sts.docs
          .filter((d) => d.ref.parent.parent?.id === MEMBER_CID)
          .map((d) => ({ key: d.id, name: String((d.data() as any).name || ''), phone: String((d.data() as any).taja?.phone || ''), approved: !!approved[userIdOf(MEMBER_CID, d.id)] })),
      );
      try {
        localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
      } catch {}
      return users;
    } catch {
      return this.getCachedUsers();
    }
  }

  /** 모아팡 반에 있던(엑셀로 올린) 학생 중 학부모 전화번호가 있는 학생 → 타자팡 회원으로 (이미 있으면 건너뜀) */
  private async migrateRoomStudents(docs: any[], approved: Record<string, number>, gone: Record<string, number> = {}): Promise<boolean> {
    const phones = await readParentPhones();
    if (!Object.keys(phones).length) return false;
    const members = new Set(docs.filter((d) => d.ref.parent.parent?.id === MEMBER_CID).map((d) => d.id));
    const classNames = new Map<string, string>();
    try {
      (await getDocs(collection(fs, 'classes'))).docs.forEach((c) => classNames.set(c.id, String((c.data() as any).name || '')));
    } catch {}
    const newIds: string[] = [];
    let created = 0;
    for (const d of docs) {
      const cid = d.ref.parent.parent?.id;
      if (!cid || cid === MEMBER_CID) continue;
      const oldId = userIdOf(cid, d.id);
      const phone = phones[oldId];
      if (!phone) continue;
      const v = d.data() as any;
      const key = await memberKey(String(v.name || ''), phone);
      if (members.has(key) || gone[key]) continue;
      const t = v.taja || {};
      const taja: Record<string, any> = { ...t, phone: phoneDigits(phone), className: MEMBER_CLASS }; // 모아팡 반 이름은 가져오지 않음
      try {
        await setDoc(doc(fs, 'classes', MEMBER_CID, 'students', key), { name: String(v.name || ''), uid: '', score: 0, outfit: null, created: serverTimestamp(), seen: serverTimestamp(), taja });
        members.add(key);
        created++;
        if (approved[oldId]) newIds.push(userIdOf(MEMBER_CID, key));
      } catch {}
    }
    if (newIds.length) await setApprovals(newIds, true);
    return created > 0;
  }

  public async syncUsers(_users: UserSession[]): Promise<boolean> {
    return true;
  }

  public async login(_identifier: string, _password?: string): Promise<{ success: boolean; user?: UserSession; message: string; pending?: boolean }> {
    return { success: false, message: '모아팡 방번호와 이름으로 들어와 주세요.' };
  }

  public async registerStudent(_p: { name: string; parentPhone: string; phone?: string; grade?: number; avatar?: string; avatarBg?: string }): Promise<{ success: boolean; user?: UserSession; message: string; pending?: boolean }> {
    return { success: false, message: MOA_ONLY };
  }

  public async batchRegisterStudents(students: Array<{ name: string; parentPhone: string; grade?: number; avatar?: string }>, _autoApprove = true): Promise<BatchRegisterResult> {
    return { success: false, addedCount: 0, skippedCount: students.length, totalUsers: 0, message: MOA_ONLY };
  }

  /** 학년·아바타·최고 기록 같은 타자팡 정보만 저장 (이름은 모아팡 것을 그대로 씀) */
  public async updateUser(id: string, updates: Partial<UserSession>): Promise<boolean> {
    const p = parseUserId(id);
    if (!p) return id === 'master_admin';
    if (!isTeacherUser() && !isApprovedNow()) return true; // 선생님 승인 전 학생: 학생 정보는 저장하지 않음
    const taja = pickTaja(updates as any);
    if (!Object.keys(taja).length) return true;
    try {
      const patch: Record<string, any> = {};
      for (const [k, v] of Object.entries(taja)) patch[`taja.${k}`] = v;
      await updateDoc(doc(fs, 'classes', p.cid, 'students', p.key), patch);
      return true;
    } catch {
      try {
        await setDoc(doc(fs, 'classes', p.cid, 'students', p.key), { taja }, { merge: true });
        return true;
      } catch {
        return false;
      }
    }
  }

  /** 선생님: 이 학생의 타자팡 기록만 지움 (모아팡 이름·캐릭터는 그대로) */
  public async deleteUser(id: string): Promise<boolean> {
    const p = parseUserId(id);
    if (!p || !isTeacherUser()) return false;
    try {
      await deleteDoc(doc(fs, 'classes', p.cid, 'students', p.key, 'taja', 'progress'));
      // 타자팡 회원은 로그인에 쓰는 전화번호·반은 남기고 연습 기록만 지움
      const keep: Record<string, any> = {};
      if (p.cid === MEMBER_CID) {
        const snap = await getDoc(doc(fs, 'classes', p.cid, 'students', p.key)).catch(() => null);
        const t = ((snap?.exists() && snap.data()) as any)?.taja || {};
        if (t.phone) keep.phone = t.phone;
        if (t.className) keep.className = t.className;
        if (t.grade) keep.grade = t.grade;
        if (t.school) keep.school = t.school;
      }
      await updateDoc(doc(fs, 'classes', p.cid, 'students', p.key), { taja: Object.keys(keep).length ? keep : deleteField() }).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  /** 선생님: 가입 신청 거절 / 완전히 삭제 (회원 기록·포인트·연습 기록·승인 모두 지움, 되돌릴 수 없음) */
  public async removeMember(id: string): Promise<boolean> {
    const p = parseUserId(id);
    if (!p || p.cid !== MEMBER_CID || !isTeacherUser()) return false;
    try {
      await deleteDoc(doc(fs, 'classes', p.cid, 'students', p.key, 'taja', 'progress')).catch(() => {});
      await deleteDoc(doc(fs, 'classes', p.cid, 'students', p.key));
      await setApprovals([id], false);
      await dropArchive([id]);
      await markGone([p.key]); // 예전 엑셀 명단에서 저절로 다시 생기지 않게
      this.archivedUsers = this.archivedUsers.filter((u) => u.id !== id);
      return true;
    } catch {
      return false;
    }
  }

  /** 선생님: 학생들의 학교 정하기 ('' 이면 학교 미정) */
  public async setSchool(ids: string[], school: string): Promise<number> {
    if (!isTeacherUser()) return 0;
    const sc = String(school || '').replace(/\s+/g, ' ').trim().slice(0, 20);
    let n = 0;
    for (const id of ids) {
      const p = parseUserId(id);
      if (!p || p.cid !== MEMBER_CID) continue;
      try {
        // 예전부터 늘 같은 값이던 className('타자팡 회원')은 지워서 칸 수 여유를 둠
        await updateDoc(doc(fs, 'classes', p.cid, 'students', p.key), { 'taja.school': sc || deleteField(), 'taja.className': deleteField() });
        n++;
      } catch {}
    }
    return n;
  }

  /* ---------------- 보관함 ---------------- */
  private archivedUsers: UserSession[] = [];

  /** 보관함에 있는 학생 (getUsers 를 부를 때 함께 새로 읽음) */
  public async getArchivedUsers(refresh = false): Promise<UserSession[]> {
    if (refresh) await this.getUsers();
    return this.archivedUsers;
  }

  /** 선생님: 보관하기 — 명단에서 빠지고 로그인은 막히지만, 이름·포인트·연습 기록은 그대로 남음 */
  public async archiveMembers(list: UserSession[]): Promise<number> {
    if (!isTeacherUser()) return 0;
    const items = list.filter((u) => parseUserId(u.id)?.cid === MEMBER_CID);
    if (!items.length) return 0;
    const entries: Record<string, ArchiveEntry> = {};
    for (const u of items) entries[u.id] = { at: Date.now(), name: String(u.name || '').slice(0, 20), ...(u.grade ? { grade: u.grade } : {}), approved: !!u.isApproved };
    if (!(await putArchive(entries))) return 0;
    await setApprovals(
      items.filter((u) => u.isApproved).map((u) => u.id),
      false,
    );
    return items.length;
  }

  /** 선생님: 보관함에서 되살리기 — 보관하기 전에 승인돼 있던 학생은 다시 승인 */
  public async restoreMembers(ids: string[]): Promise<number> {
    if (!isTeacherUser() || !ids.length) return 0;
    const arc = await readArchive(true);
    const reApprove = ids.filter((id) => arc.a[id]?.approved);
    if (reApprove.length && !(await setApprovals(reApprove, true))) return 0;
    if (!(await dropArchive(ids))) return 0;
    this.archivedUsers = this.archivedUsers.filter((u) => !ids.includes(u.id));
    return ids.length;
  }

  /* ---------------- 선생님 로그인 ---------------- */
  public async masterLogin(password: string, _localPasswordOk = false): Promise<{ success: boolean; message?: string; status?: MembersStatus }> {
    try {
      const u = await teacherSignIn(password.trim());
      if (!isTeacherUser(u)) return { success: false, message: '선생님 계정이 아니에요.' };
      return { success: true, status: (await this.getMembersStatus()) || undefined };
    } catch (e) {
      return { success: false, message: errText(e) };
    }
  }

  public async checkMasterKey(): Promise<'ok' | 'bad' | 'noserver'> {
    return isTeacherUser() ? 'ok' : 'bad';
  }

  public async getMembersStatus(): Promise<MembersStatus | null> {
    if (!isTeacherUser()) return null;
    const users = await this.getUsers();
    return { total: users.length, pendingApproval: 0, pendingChanges: 0, fixedUpdatedAt: Date.now(), masterPasswordSet: true };
  }

  private download(name: string, data: any) {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  private stamp() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }

  /** 명단 파일 (모아팡 반 학생 목록) */
  public async downloadMembersFile(): Promise<boolean> {
    if (!isTeacherUser()) return false;
    const users = await this.getUsers();
    this.download(`타자팡_명단_${this.stamp()}.json`, { version: 2, savedAt: Date.now(), members: [...users, ...this.archivedUsers] });
    return true;
  }

  /** 전체 백업: 학생 자료 + 명예의 전당 + 보고 */
  public async downloadBackup(): Promise<boolean> {
    if (!isTeacherUser()) return false;
    try {
      const [prog, reps, lb] = await Promise.all([getDocs(collectionGroup(fs, 'taja')), getDocs(collection(fs, 'taja_reports')), get(ref(rt, 'taja/lb'))]);
      const progress: Record<string, any> = {};
      prog.docs.forEach((d) => {
        const st = d.ref.parent.parent;
        const cid = st?.parent?.parent?.id;
        if (d.id !== 'progress' || !st || !cid) return;
        const v = d.data() as any;
        try {
          progress[userIdOf(cid, st.id)] = { data: JSON.parse(v.json || '{}'), updatedAt: v.updatedAt || 0 };
        } catch {}
      });
      const lbAll = lb.val() || {};
      const months = Object.keys(lbAll).sort();
      const current = kstMonth();
      const leaderboardArchive: Record<string, any[]> = {};
      for (const m of months) if (m !== current) leaderboardArchive[m] = flattenMonth(lbAll[m]);
      this.download(`타자팡_백업_${this.stamp()}.json`, {
        version: 2,
        savedAt: Date.now(),
        members: { members: [...(await this.getUsers()), ...this.archivedUsers] },
        progress,
        leaderboard: flattenMonth(lbAll[current]),
        leaderboardArchive,
        reports: reps.docs.map((d) => d.data()),
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 백업 파일로 되돌리기
   *  - 명예의 전당(이번 달·지난달)과 받은 보고를 합쳐 넣음
   *  - 예전 서버의 학생 자료는 학생 id가 달라서(전화번호 방식) 그대로 옮기지 않음
   */
  public async restoreBackup(backup: any): Promise<{ success: boolean; message?: string }> {
    if (!isTeacherUser()) return { success: false, message: '선생님 계정으로 로그인해 주세요.' };
    const b = backup?.backup || backup;
    try {
      const byMonth: Record<string, any[]> = {};
      const add = (list: any[]) => {
        for (const raw of list || []) {
          const e = cleanLeaderboardEntry(raw);
          if (e) (byMonth[kstMonth(e.ts)] = byMonth[kstMonth(e.ts)] || []).push(e);
        }
      };
      add(Array.isArray(b?.leaderboard) ? b.leaderboard : []);
      if (b?.leaderboardArchive && typeof b.leaderboardArchive === 'object') for (const l of Object.values<any>(b.leaderboardArchive)) add(l);
      let n = 0;
      for (const [m, list] of Object.entries(byMonth)) {
        const snap = await get(ref(rt, `taja/lb/${m}`));
        const cur = snap.val() || {};
        const groups: Record<string, any[]> = {};
        for (const e of list) (groups[safeKey(lbWho(e))] = groups[safeKey(lbWho(e))] || []).push(e);
        for (const [who, es] of Object.entries(groups)) {
          const merged = tidyLeaderboard([...(cur[who]?.entries || []), ...es]).slice(0, LB_PER_STUDENT);
          await set(ref(rt, `taja/lb/${m}/${who}`), { userName: es[0].userName, entries: merged, t: Date.now() });
          n += es.length;
        }
        await set(ref(rt, `taja/lbMonths/${m}`), true);
      }
      let r = 0;
      for (const rep of Array.isArray(b?.reports) ? b.reports : []) {
        if (!rep?.id || !rep.userId || !rep.day) continue;
        await setDoc(doc(fs, 'taja_reports', safeKey(rep.id)), { ...rep, checkedAt: Number(rep.checkedAt) || 0 }, { merge: true });
        r++;
      }
      return { success: true, message: `명예의 전당 기록 ${n}개, 보고 ${r}개를 합쳤어요.` };
    } catch (e) {
      return { success: false, message: errText(e) };
    }
  }

  public async setMasterPassword(_password: string): Promise<{ success: boolean; message?: string }> {
    return { success: false, message: "선생님 비밀번호는 모아팡 선생님 계정 비밀번호예요. 바꾸려면 모아팡 선생님 로그인 화면의 '비밀번호를 잊었어요'를 눌러 주세요." };
  }

  /* ---------------- 명예의 전당 (Realtime Database: taja/lb/달/학생) ---------------- */
  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const list = await this.getLeaderboardMonth(kstMonth());
      try {
        localStorage.setItem(BOARD_KEY, JSON.stringify(list));
      } catch {}
      return list;
    } catch {
      try {
        return JSON.parse(localStorage.getItem(BOARD_KEY) || '[]');
      } catch {
        return [];
      }
    }
  }

  public async getLeaderboardMonth(month: string): Promise<LeaderboardEntry[]> {
    await ensureUser(); // 로그인 안 한 손님도 순위표는 볼 수 있게 (익명으로)
    const snap = await get(ref(rt, `taja/lb/${month}`));
    return flattenMonth(snap.val());
  }

  /** 기록이 있는 달 (최근 것부터) */
  public async getLeaderboardMonths(): Promise<string[]> {
    try {
      await ensureUser();
      const snap = await get(ref(rt, 'taja/lbMonths'));
      return Object.keys(snap.val() || {}).sort().reverse();
    } catch {
      return [];
    }
  }

  public async recordScore(entry: Omit<LeaderboardEntry, 'id' | 'date'> & { ts?: number; id?: string }): Promise<LeaderboardEntry[]> {
    const e = cleanLeaderboardEntry(entry);
    if (!e) return this.getLeaderboard();
    if (!isTeacherUser() && !isApprovedNow()) return this.getLeaderboard(); // 승인 전: 명예의 전당에 저장 안 함
    if (!isTeacherUser() && (e.mode === 'sentence' || !e.mode)) noteWeekBest(e.userId, e.cpm, e.accuracy, e.ts); // 주간 랭킹 보상용
    const month = kstMonth(e.ts);
    const who = safeKey(lbWho(e));
    try {
      await ensureUser();
      const r = ref(rt, `taja/lb/${month}/${who}`);
      const snap = await get(r);
      const prev = (snap.val() && snap.val().entries) || [];
      // 학생마다 짧은 글 최고 기록 1개 + 긴 글 최고 기록 1개는 꼭 남기고, 남는 칸은 다음 좋은 기록
      const all = tidyLeaderboard([...prev, e], 99);
      const isLong = (x: any) => x.mode === 'long';
      const better = (a: any, b: any) => (b.cpm || 0) - (a.cpm || 0) || (a.errorCount ?? 9999) - (b.errorCount ?? 9999);
      const bestShort = all.filter((x) => !isLong(x)).sort(better)[0];
      const bestLong = all.filter(isLong).sort(better)[0];
      const keep = [bestShort, bestLong].filter(Boolean) as any[];
      for (const x of all.sort(better)) if (keep.length < LB_PER_STUDENT && !keep.includes(x)) keep.push(x);
      const entries = keep.slice(0, LB_PER_STUDENT);
      const rec: any = { userName: e.userName, entries, t: Date.now() };
      if (e.grade) rec.grade = e.grade;
      await set(r, rec);
      await set(ref(rt, `taja/lbMonths/${month}`), true);
    } catch {}
    return this.getLeaderboard();
  }
}

export const typangApi = new TypangApiClient();
