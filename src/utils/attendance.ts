/**
 * 타자팡 출석하기
 *  - 학생이 [출석하기]를 누르면 attend/{학생 id}_{한국 날짜 번호} 에 하루 한 번 남김 (보안 규칙이 서버 시각으로 날짜를 확인)
 *  - 선생님 '문자함'(moapang.kr/sms.html)이 열려 있으면 부모님께 출석 문자가 감
 *  - 문자를 보냈는지(sms.st)는 선생님 화면이 적고, 학생은 자기 출석만 읽을 수 있음
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { fs, ensureUser, parseUserId } from './moaFirebase';
import type { UserSession } from '../types';

/** 한국 시간으로 1970-01-01부터 센 날 수 (보안 규칙과 같은 계산) */
export const kstDayNum = (t: number = Date.now()) => Math.floor((t + 9 * 3600 * 1000) / 86400000);

export interface AttendInfo {
  at: number; // 출석한 시각 (ms)
  sms: string; // 부모님 문자: '' 아직 · 'sent' 보냄 · 'fail' 못 보냄 등 (선생님 화면이 적음)
}

const refOf = (userId: string, dn: number) => doc(fs, 'attend', `${userId}_${dn}`);
const canAttend = (u: UserSession | null) => !!u && u.role !== 'master' && !!parseUserId(u.id);

/* 화면 여러 곳(위 메뉴 · 첫 화면 띠)이 같은 상태를 보게 */
let cache: { id: string; dn: number; info: AttendInfo | null } | null = null;
const emit = () => window.dispatchEvent(new Event('typang-attend-changed'));
export const cachedAttend = (u: UserSession | null): AttendInfo | null | undefined =>
  u && cache && cache.id === u.id && cache.dn === kstDayNum() ? cache.info : undefined;

const toInfo = (v: any): AttendInfo => ({
  at: typeof v?.at?.toMillis === 'function' ? v.at.toMillis() : Date.now(),
  sms: String(v?.sms?.st || ''),
});

/** 오늘 출석했는지 (undefined: 확인 못 함) */
export async function loadAttend(u: UserSession | null): Promise<AttendInfo | null | undefined> {
  if (!canAttend(u)) return null;
  const dn = kstDayNum();
  try {
    await ensureUser();
    const s = await getDoc(refOf(u!.id, dn));
    cache = { id: u!.id, dn, info: s.exists() ? toInfo(s.data()) : null };
    emit();
    return cache.info;
  } catch {
    return undefined;
  }
}

/** 출석하기 */
export async function attendNow(u: UserSession | null): Promise<{ ok: boolean; already?: boolean; info?: AttendInfo; message?: string }> {
  if (!u || u.role === 'master') return { ok: false, message: '학생으로 로그인하면 출석할 수 있어요.' };
  const p = parseUserId(u.id);
  if (!p) return { ok: false, message: '로그인한 뒤에 출석할 수 있어요.' };
  const dn = kstDayNum();
  const ref = refOf(u.id, dn);
  try {
    await ensureUser();
    const old = await getDoc(ref).catch(() => null);
    if (old && old.exists()) {
      cache = { id: u.id, dn, info: toInfo(old.data()) };
      emit();
      return { ok: true, already: true, info: cache.info! };
    }
    const grade = Math.max(0, Math.min(6, Number(u.grade) || 0));
    await setDoc(ref, { id: `${u.id}_${dn}`, userId: u.id, cid: p.cid, key: p.key, name: String(u.name || '').slice(0, 10), grade, dn, at: serverTimestamp() });
    cache = { id: u.id, dn, info: { at: Date.now(), sms: '' } };
    emit();
    return { ok: true, info: cache.info! };
  } catch (e: any) {
    const c = String(e?.code || '');
    if (/permission/i.test(c)) return { ok: false, message: '출석을 남기지 못했어요. 로그아웃했다가 다시 로그인한 뒤 눌러 주세요.' };
    if (/unavailable|network/i.test(c)) return { ok: false, message: '인터넷 연결이 끊겼어요. 잠시 뒤에 다시 눌러 주세요.' };
    return { ok: false, message: '출석을 남기지 못했어요. 잠시 뒤에 다시 눌러 주세요.' };
  }
}

export const timeText = (t: number) =>
  new Date(t).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Seoul' });
