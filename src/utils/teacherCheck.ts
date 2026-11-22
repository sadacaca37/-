/**
 * 선생님 확인 번호 (운지법 검사 통과 등)
 *  - 선생님이 마스터 관리실에서 4자리 번호를 정함 → config/taja.checkPin 에 '뒤섞은 값'(해시)만 저장
 *  - 학생 화면에서 선생님이 번호를 넣으면 같은 방식으로 섞어서 맞는지 비교
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { fs, isTeacherUser, ensureUser, errText } from './moaFirebase';

const CONF = () => doc(fs, 'config', 'taja');

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`tajapang-check|${pin.trim()}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 선생님: 확인 번호 정하기 (숫자 4~6자리) */
export async function setCheckPin(pin: string): Promise<{ success: boolean; message?: string }> {
  if (!isTeacherUser()) return { success: false, message: '선생님 계정으로 로그인해 주세요.' };
  if (!/^[0-9]{4,6}$/.test(pin.trim())) return { success: false, message: '숫자 4~6자리로 정해 주세요.' };
  try {
    await setDoc(CONF(), { checkPin: await hashPin(pin), checkPinAt: Date.now() }, { merge: true });
    return { success: true };
  } catch (e) {
    return { success: false, message: errText(e) };
  }
}

/** 선생님: 확인 번호를 정해 두었는지 */
export async function hasCheckPin(): Promise<boolean> {
  try {
    const snap = await getDoc(CONF());
    return !!(snap.exists() && (snap.data() as any).checkPin);
  } catch {
    return false;
  }
}

/** 학생 화면: 선생님이 넣은 번호가 맞는지 */
export async function verifyCheckPin(pin: string): Promise<'ok' | 'wrong' | 'unset' | 'offline'> {
  try {
    await ensureUser();
    const snap = await getDoc(CONF());
    const h = snap.exists() ? (snap.data() as any).checkPin : '';
    if (!h) return 'unset';
    return (await hashPin(pin)) === h ? 'ok' : 'wrong';
  } catch {
    return 'offline';
  }
}
