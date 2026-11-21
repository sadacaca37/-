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

export function studentSession(s: MoaSession, taja: Record<string, any> = {}): UserSession {
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
    isApproved: true,
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
  return studentSession(s, taja);
}

/** 방번호 + 이름으로 들어오기 (모아팡 첫 화면과 같은 방식) */
export async function enterByRoom(room: string, rawName: string): Promise<{ ok: boolean; message?: string; user?: UserSession }> {
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
  if (snap.exists()) await setDoc(sref, { name, uid: u.uid, seen: serverTimestamp() }, { merge: true });
  else await setDoc(sref, { name, uid: u.uid, score: 0, outfit: null, created: serverTimestamp(), seen: serverTimestamp() });
  const s: MoaSession = { cid: rd.cid, room, className: rd.name || '우리 반', color: rd.color, name, key, outfit: snap.exists() ? (snap.data() as any).outfit || null : null };
  setMoaSession(s);
  return { ok: true, user: studentSession(s, snap.exists() ? (snap.data() as any).taja || {} : {}) };
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
