/**
 * 모아팡과 함께 쓰는 Firebase 연결
 *  - 타자팡은 모아팡 홈페이지 안(/moa/taja/)에 있어서, 같은 주소의 로그인·저장소를 그대로 씀
 *  - 학생: 모아팡 첫 화면에서 방번호 + 이름으로 들어온 기록(localStorage 'moa_session')으로 바로 로그인
 *  - 선생님: 모아팡 선생님 계정(이메일·비밀번호)으로 로그인하면 타자팡 마스터
 *  - 자료: Firestore(학생 자료·보고), Realtime Database(명예의 전당) — 서버가 꺼져도 지워지지 않음
 */
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import type { UserSession } from '../types';

const app = initializeApp({
  apiKey: 'AIzaSyBlA9TN1BKvnsKrzuq2fMalCrATTeFgkUo',
  authDomain: 'moaboard-943a3.firebaseapp.com',
  projectId: 'moaboard-943a3',
  storageBucket: 'moaboard-943a3.firebasestorage.app',
  messagingSenderId: '986530203160',
  appId: '1:986530203160:web:b48121b7113f38a49c656d',
  databaseURL: 'https://moaboard-943a3-default-rtdb.asia-southeast1.firebasedatabase.app',
});
export const auth = getAuth(app);
export const fs = getFirestore(app);
export const rt = getDatabase(app);
export const TEACHER_EMAIL = 'sadacaca37@gmail.com';

/* ---------------- 로그인 상태 ---------------- */
let current: User | null = null;
let resolved = false;
const waiters: Array<(u: User | null) => void> = [];
onAuthStateChanged(auth, (u) => {
  current = u;
  if (!resolved) {
    resolved = true;
    waiters.splice(0).forEach((f) => f(u));
  }
  window.dispatchEvent(new Event('moa-auth-changed'));
});
export function authReady(): Promise<User | null> {
  return resolved ? Promise.resolve(current) : new Promise((res) => waiters.push(res));
}
export const isTeacherUser = (u: User | null = current) => !!u && !u.isAnonymous && u.email === TEACHER_EMAIL;
let anonPending: Promise<User> | null = null;
export async function ensureUser(): Promise<User> {
  await authReady();
  if (auth.currentUser) return auth.currentUser;
  // 여러 곳에서 동시에 불러도 익명 로그인은 한 번만
  if (!anonPending) anonPending = signInAnonymously(auth).then((c) => c.user).finally(() => (anonPending = null));
  return anonPending;
}
export async function teacherSignIn(password: string): Promise<User> {
  return (await signInWithEmailAndPassword(auth, TEACHER_EMAIL, password)).user;
}
export async function teacherResetMail() {
  await sendPasswordResetEmail(auth, TEACHER_EMAIL);
}
export async function signOutTeacher() {
  if (isTeacherUser()) await signOut(auth);
}

/* ---------------- 모아팡 입장 기록 (같은 주소라 함께 씀) ---------------- */
export interface MoaSession {
  cid: string;
  room: string;
  className: string;
  color?: string;
  name: string;
  key: string;
  outfit?: any;
}
const SKEY = 'moa_session';
export function getMoaSession(): MoaSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(SKEY) || 'null');
    return s && s.cid && s.name && s.key ? s : null;
  } catch {
    return null;
  }
}
export function setMoaSession(s: MoaSession) {
  try {
    localStorage.setItem(SKEY, JSON.stringify(s));
  } catch {}
}

/** 모아팡과 같은 규칙: 같은 반에서 같은 이름이면 같은 학생 */
export function nameKey(name: string) {
  const n = String(name || '').normalize('NFC').replace(/\s+/g, '').toLowerCase();
  return 'n_' + Array.from(n).map((ch) => (/[0-9a-z가-힣]/.test(ch) ? ch : '_' + ch.codePointAt(0)!.toString(16))).join('').slice(0, 120);
}
export const cleanName = (s: string) => String(s || '').normalize('NFC').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 10);

/** 타자팡 학생 id = 반 + 이름 */
export const userIdOf = (cid: string, key: string) => `m_${cid}_${key}`;
export function parseUserId(id: string): { cid: string; key: string } | null {
  const m = /^m_([A-Za-z0-9]+)_(n_.+)$/.exec(String(id || ''));
  return m ? { cid: m[1], key: m[2] } : null;
}

/** 타자팡 전용 학생 정보 (모아팡 학생 기록의 taja 칸) */
export const TAJA_FIELDS = ['grade', 'avatar', 'avatarBg', 'levelTitle', 'totalPracticeCount', 'highestCpm', 'timeSpentSeconds', 'nickname', 'avatarConfig'] as const;
export function pickTaja(u: Partial<UserSession> & Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of TAJA_FIELDS) if (u[k] !== undefined && u[k] !== null) out[k] = u[k];
  return out;
}

export function studentSession(s: MoaSession, taja: Record<string, any> = {}, approved = false): UserSession {
  const grade = Number(taja.grade) || undefined;
  return {
    id: userIdOf(s.cid, s.key),
    name: s.name,
    studentId: s.className,
    grade,
    avatar: taja.avatar || '⭐',
    avatarBg: taja.avatarBg || 'bg-yellow-100',
    avatarConfig: taja.avatarConfig,
    nickname: taja.nickname,
    levelTitle: taja.levelTitle || (grade ? `${grade}학년 타자 꿈나무` : '타자 꿈나무'),
    isApproved: approved,
    role: 'student',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    totalPracticeCount: Number(taja.totalPracticeCount) || 0,
    highestCpm: Number(taja.highestCpm) || 0,
    ...(taja.timeSpentSeconds ? { timeSpentSeconds: taja.timeSpentSeconds } : {}),
  } as UserSession;
}

export function teacherSession(): UserSession {
  return {
    id: 'master_admin',
    name: '선생님',
    studentId: 'master',
    avatar: '👑',
    role: 'master',
    isApproved: true,
    levelTitle: '최고 관리자',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    totalPracticeCount: 0,
    highestCpm: 0,
  };
}

/** 모아팡 입장 기록으로 학생 정보 만들기 (타자 정보는 Firestore에서) */
export async function loadStudent(s: MoaSession): Promise<UserSession> {
  const u = await ensureUser();
  let taja: Record<string, any> = {};
  try {
    const sref = doc(fs, 'classes', s.cid, 'students', s.key);
    const snap = await getDoc(sref);
    if (snap.exists()) {
      const v = snap.data() as any;
      taja = v.taja || {};
      // 모아팡 캐릭터 꾸미기에서 입힌 옷을 이 컴퓨터에도 맞춰 둠 (타자팡 상단·내 정보에 보임)
      if (v.outfit && JSON.stringify(v.outfit) !== JSON.stringify(s.outfit || null)) {
        const cur = getMoaSession();
        if (cur && cur.cid === s.cid && cur.key === s.key) {
          setMoaSession({ ...cur, outfit: v.outfit });
          window.dispatchEvent(new Event('moa-outfit-changed'));
        }
      }
      // 다른 컴퓨터에서 들어온 적이 있으면 이 컴퓨터를 '지금 쓰는 기기'로 (그래야 내 자료를 읽고 저장할 수 있음)
      if (v.uid !== u.uid) await setDoc(sref, { name: v.name || s.name, uid: u.uid, seen: serverTimestamp() }, { merge: true });
    } else {
      // 선생님이 명단에서 지웠으면 모아팡처럼 새로 만듦
      await setDoc(sref, { name: s.name, uid: u.uid, score: 0, outfit: null, created: serverTimestamp(), seen: serverTimestamp() });
    }
  } catch {}
  return studentSession(s, taja, await approvedByTeacher(userIdOf(s.cid, s.key)));
}

/** 선생님이 타자팡 저장을 승인한 학생인지 (config/taja_approved, 선생님만 씀) */
export async function approvedByTeacher(userId: string, strict = false): Promise<boolean> {
  try {
    const snap = await getDoc(doc(fs, 'config', 'taja_approved'));
    return !!(snap.exists() && (snap.data() as any).ok?.[userId]);
  } catch (e) {
    if (strict) throw e; // 인터넷이 잠깐 끊긴 것을 '승인 안 됨'으로 착각하지 않게
    return false;
  }
}

/** 방번호 + 이름으로 들어오기 (모아팡 첫 화면과 같은 방식) */
export async function enterByRoom(room: string, rawName: string, grade = 0): Promise<{ ok: boolean; message?: string; user?: UserSession; isNew?: boolean }> {
  const name = cleanName(rawName);
  if (!/^\d{5}$/.test(room)) return { ok: false, message: '방번호 5자리를 써 주세요.' };
  if (!name) return { ok: false, message: '이름을 써 주세요.' };
  const u = await ensureUser();
  const r = await getDoc(doc(fs, 'rooms', room));
  if (!r.exists()) return { ok: false, message: '그런 방번호가 없어요. 다시 확인해 주세요.' };
  const rd = r.data() as any;
  const key = nameKey(name);
  const sref = doc(fs, 'classes', rd.cid, 'students', key);
  const snap = await getDoc(sref);
  // 새로 가입하면서 학년을 골랐으면 학생 기록(taja)에 함께 남김
  const prevTaja = (snap.exists() && (snap.data() as any).taja) || {};
  const taja = grade >= 1 && grade <= 6 ? { ...prevTaja, grade, levelTitle: `${grade}학년 타자 꿈나무` } : null;
  if (snap.exists()) await setDoc(sref, { name, uid: u.uid, seen: serverTimestamp(), ...(taja ? { taja } : {}) }, { merge: true });
  else await setDoc(sref, { name, uid: u.uid, score: 0, outfit: null, created: serverTimestamp(), seen: serverTimestamp(), ...(taja ? { taja } : {}) });
  const s: MoaSession = { cid: rd.cid, room, className: rd.name || '우리 반', color: rd.color, name, key, outfit: snap.exists() ? (snap.data() as any).outfit || null : null };
  setMoaSession(s);
  return { ok: true, isNew: !snap.exists(), user: studentSession(s, taja || prevTaja, await approvedByTeacher(userIdOf(s.cid, s.key))) };
}

export function errText(e: any): string {
  const c = String(e?.code || '');
  if (/permission/i.test(c)) return '권한이 없어요. 다시 로그인해 주세요.';
  if (/unavailable|network/i.test(c)) return '인터넷 연결이 끊겼어요. 잠시 뒤에 다시 해 주세요.';
  if (/wrong-password|invalid-credential|user-not-found|invalid-email/.test(c)) return '비밀번호가 맞지 않아요.';
  if (/too-many-requests/.test(c)) return '여러 번 틀렸어요. 잠시 뒤에 다시 해 주세요.';
  return '잘 안 됐어요. 잠시 뒤에 다시 해 주세요.' + (c ? ` (${c})` : '');
}

/** 한국 시간 기준 달 '2026-11' */
export const kstMonth = (ts: number = Date.now()) => new Date(ts + 9 * 3600 * 1000).toISOString().slice(0, 7);

/* ---------------- 타자팡 회원 (이름 + 전화번호, 선생님 승인) ----------------
 * - 모아팡 방번호로 들어오면 연습만 하고(저장 안 함), 미니게임·놀이터·기록 저장은 타자팡 회원 로그인 뒤에
 * - 회원 기록은 모아팡 학생 기록과 같은 모양으로 classes/tajapang/students/{key} 에 둠 (지금 규칙 그대로 씀)
 *   · key = 이름+전화번호를 섞어 만든 값 → 이름과 전화번호를 아는 사람만 찾을 수 있음
 * - 선생님이 승인(config/taja_approved)해야 로그인 가능
 */
export const MEMBER_CID = 'tajapang';
export const MEMBER_CLASS = '타자팡 회원';
export const phoneDigits = (s: string) => {
  let d = String(s || '').replace(/[^0-9]/g, '');
  if (/^1[0-9]{9}$/.test(d)) d = '0' + d;
  return d;
};
export const prettyPhone = (s: string) => {
  const d = phoneDigits(s);
  return d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d;
};
export async function memberKey(name: string, phone: string): Promise<string> {
  const text = `${cleanName(name).replace(/\s+/g, '')}|${phoneDigits(phone)}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return 'n_t' + hex.slice(0, 30);
}
const memberRef = (key: string) => doc(fs, 'classes', MEMBER_CID, 'students', key);
/** 타자팡 회원의 캐릭터(옷차림) — 모아팡 '캐릭터 꾸미기'(dress.html?who=member)와 함께 씀 */
export const MEMBER_DRESS_KEY = 'taja_member_dress';
export function getMemberDress(): { cid: string; key: string; name: string; className: string; outfit: any } | null {
  try {
    const d = JSON.parse(localStorage.getItem(MEMBER_DRESS_KEY) || 'null');
    return d && d.cid === MEMBER_CID && d.key ? d : null;
  } catch {
    return null;
  }
}
/**
 * 이 컴퓨터에 남아 있는 '다른 사람'의 캐릭터·이름 기록을 지움
 *  - 타자팡에 선생님이나 다른 학생이 로그인했는데 예전 학생(모아팡 방번호 입장 등)의 옷·이름이 게임에 남는 문제 막기
 *  - user 가 없으면(로그아웃) 둘 다 지움
 */
export function purgeStaleIdentities(user: { id: string; role?: string } | null) {
  try {
    const p = user && user.role !== 'master' ? parseUserId(user.id) : null;
    const ses = getMoaSession();
    if (ses && !(p && ses.cid === p.cid && ses.key === p.key)) localStorage.removeItem(SKEY);
    const d = JSON.parse(localStorage.getItem(MEMBER_DRESS_KEY) || 'null');
    if (d && !(p && p.cid === MEMBER_CID && d.key === p.key)) localStorage.removeItem(MEMBER_DRESS_KEY);
    window.dispatchEvent(new Event('moa-outfit-changed'));
  } catch {}
}
export function clearMemberDress() {
  try {
    localStorage.removeItem(MEMBER_DRESS_KEY);
  } catch {}
}
const memberSession = (key: string, v: any, approved: boolean): UserSession => {
  const taja = v?.taja || {};
  const s: MoaSession = { cid: MEMBER_CID, room: '', className: taja.className || MEMBER_CLASS, name: String(v?.name || ''), key };
  try {
    localStorage.setItem(MEMBER_DRESS_KEY, JSON.stringify({ cid: MEMBER_CID, key, name: s.name, className: s.className, outfit: v?.outfit || null }));
    window.dispatchEvent(new Event('moa-outfit-changed'));
  } catch {}
  return { ...studentSession(s, taja, approved), parentPhone: taja.phone ? prettyPhone(taja.phone) : undefined };
};
const checkInput = (name: string, phone: string) => {
  if (!cleanName(name)) return '이름을 써 주세요.';
  if (!/^01[016789][0-9]{7,8}$/.test(phoneDigits(phone))) return '전화번호를 010-0000-0000 처럼 써 주세요.';
  return '';
};

/** 새로 가입하기: 승인 대기로 만듦 */
export async function signupMember(rawName: string, phone: string, grade = 0): Promise<{ ok: boolean; message: string }> {
  const bad = checkInput(rawName, phone);
  if (bad) return { ok: false, message: bad };
  const name = cleanName(rawName);
  const u = await ensureUser();
  const key = await memberKey(name, phone);
  const snap = await getDoc(memberRef(key));
  if (snap.exists()) {
    const ok = await approvedByTeacher(userIdOf(MEMBER_CID, key));
    return { ok: false, message: ok ? '이미 가입했어요. [로그인]에서 이름과 전화번호로 들어오세요.' : '이미 가입 신청을 했어요. 선생님이 승인하면 로그인할 수 있어요.' };
  }
  const taja: Record<string, any> = { phone: phoneDigits(phone), className: MEMBER_CLASS };
  if (grade >= 1 && grade <= 6) {
    taja.grade = grade;
    taja.levelTitle = `${grade}학년 타자 꿈나무`;
  }
  await setDoc(memberRef(key), { name, uid: u.uid, score: 0, outfit: null, created: serverTimestamp(), seen: serverTimestamp(), taja });
  return { ok: true, message: `가입 신청 완료! 선생님이 승인하면 '${name}' 이름과 전화번호로 로그인할 수 있어요.` };
}

/** 로그인: 이름 + 전화번호, 승인된 회원만 */
/* ---- 전화번호 뒷자리로 로그인: 선생님이 승인한 회원만 '이름+뒷자리 → 회원' 목록(config/taja_login)에 올라감 ---- */
const LOGIN_IDX = () => doc(fs, 'config', 'taja_login');
async function loginKey(name: string, last4: string): Promise<string> {
  const text = `login|${cleanName(name).replace(/\s+/g, '')}|${last4}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return 'l' + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

/** 선생님: 승인한 회원 목록으로 뒷자리 로그인 목록을 새로 만듦 (바뀐 게 있을 때만 저장) */
export async function rebuildLoginIndex(members: { key: string; name: string; phone: string; approved: boolean }[]): Promise<void> {
  if (!isTeacherUser()) return;
  const idx: Record<string, string[]> = {};
  for (const m of members) {
    const d = phoneDigits(m.phone);
    if (!m.approved || d.length < 10) continue;
    const k = await loginKey(m.name, d.slice(-4));
    (idx[k] = idx[k] || []).push(m.key);
  }
  Object.values(idx).forEach((a) => a.sort());
  try {
    const snap = await getDoc(LOGIN_IDX());
    const old = snap.exists() ? (snap.data() as any).idx || {} : null;
    const same = old && JSON.stringify(Object.keys(old).sort().map((k) => [k, old[k]])) === JSON.stringify(Object.keys(idx).sort().map((k) => [k, idx[k]]));
    if (!same) await setDoc(LOGIN_IDX(), { idx, at: Date.now() });
  } catch {}
}

export async function loginMember(rawName: string, phone: string): Promise<{ ok: boolean; message?: string; user?: UserSession }> {
  if (!cleanName(rawName)) return { ok: false, message: '이름을 써 주세요.' };
  const digits = phoneDigits(phone);
  const u = await ensureUser();
  let key = '';
  if (digits.length === 4) {
    // 전화번호 뒷자리 4자리로 로그인
    let found: string[] = [];
    try {
      const snap = await getDoc(LOGIN_IDX());
      const v = snap.exists() ? (snap.data() as any).idx?.[await loginKey(rawName, digits)] : null;
      found = Array.isArray(v) ? v : v ? [String(v)] : [];
    } catch {}
    if (!found.length) return { ok: false, message: '이름과 전화번호 뒷자리가 맞지 않거나, 아직 선생님 승인 전이에요. 처음이면 [새로 가입하기]를 해 주세요.' };
    if (found.length > 1) return { ok: false, message: '이름과 뒷자리가 같은 친구가 있어요. 전화번호를 모두(010-0000-0000) 써 주세요.' };
    key = found[0];
  } else {
    const bad = checkInput(rawName, phone);
    if (bad) return { ok: false, message: '전화번호 뒷자리 4자리를 써 주세요.' };
    key = await memberKey(rawName, phone);
  }
  const snap = await getDoc(memberRef(key));
  if (!snap.exists()) return { ok: false, message: '가입한 기록이 없어요. 이름과 전화번호를 확인하거나 [새로 가입하기]를 해 주세요.' };
  if (!(await approvedByTeacher(userIdOf(MEMBER_CID, key)))) return { ok: false, message: '아직 선생님 승인 전이에요. 선생님께 승인해 달라고 말씀드려 주세요.' };
  const v = snap.data() as any;
  // 이 컴퓨터를 '지금 쓰는 기기'로 (그래야 내 연습 자료를 읽고 저장할 수 있음)
  if (v.uid !== u.uid) await setDoc(memberRef(key), { name: v.name, uid: u.uid, seen: serverTimestamp() }, { merge: true });
  else await setDoc(memberRef(key), { name: v.name, seen: serverTimestamp() }, { merge: true });
  return { ok: true, user: memberSession(key, v, true) };
}

/** 저장된 로그인으로 다시 들어오기 (승인이 풀렸으면 null) */
/**
 * 이 컴퓨터에 로그인해 둔 회원을 다시 확인
 *  - null: 지워졌거나 승인이 풀린 회원 → 로그아웃
 *  - 'offline': 인터넷·Firebase에 잠깐 닿지 않음 → 로그인은 그대로 두고 나중에 다시 확인
 *    (예전에는 이때도 null 이라 학교 와이파이가 느린 날 학생이 저절로 로그아웃됐음)
 */
export async function reloadMember(userId: string): Promise<UserSession | null | 'offline'> {
  const p = parseUserId(userId);
  if (!p || p.cid !== MEMBER_CID) return null;
  try {
    const u = await ensureUser();
    const snap = await getDoc(memberRef(p.key));
    if (!snap.exists() || !(await approvedByTeacher(userId, true))) return null;
    const v = snap.data() as any;
    if (v.uid !== u.uid) await setDoc(memberRef(p.key), { name: v.name, uid: u.uid, seen: serverTimestamp() }, { merge: true });
    return memberSession(p.key, v, true);
  } catch {
    return 'offline';
  }
}
