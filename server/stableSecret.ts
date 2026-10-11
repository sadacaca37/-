/**
 * 서버를 다시 켜도 바뀌지 않는 비밀값
 *  - AI 스튜디오 서버는 한동안 아무도 안 쓰면 꺼졌다가 빈 상태로 다시 켜짐 → 파일에 저장한 비밀값도 사라짐
 *  - 그래서 서버 설정(환경 변수)에 있는 값에서 비밀값을 만들어, 다시 켜져도 같은 값이 나오게 함
 *    (TYPANG_SECRET 를 따로 정하면 그것을, 없으면 AI 스튜디오가 넣어 주는 GEMINI_API_KEY 에서 만듦)
 *  - 환경 변수가 하나도 없으면 null (그때는 기능이 꺼지고 예전처럼 동작)
 */
import crypto from 'crypto';

export function stableSecret(purpose: string): string | null {
  const base = process.env.TYPANG_SECRET || process.env.SESSION_SECRET || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!base) return null;
  return crypto.createHmac('sha256', base).update(`typang:${purpose}`).digest('hex');
}

/** 비밀값으로 서명한 짧은 증명서 만들기 / 확인하기 */
export function signPayload(secret: string, payload: any): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verifyPayload(secret: string, token: string | undefined): any | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [body, mac] = token.split('.');
  const expect = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  try {
    if (mac.length !== expect.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expect))) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * 내용을 감춰서 봉인 (AES-256-GCM): 학생 컴퓨터에 두는 회원증처럼, 다른 사람이 열어 봐도 내용을 알 수 없고 고칠 수도 없게
 */
export function sealPayload(secret: string, payload: any): string {
  const key = crypto.createHash('sha256').update(`seal:${secret}`).digest();
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(JSON.stringify(payload), 'utf-8'), c.final()]);
  return ['s1', iv.toString('base64url'), enc.toString('base64url'), c.getAuthTag().toString('base64url')].join('.');
}

export function unsealPayload(secret: string, token: string | undefined): any | null {
  if (!token || typeof token !== 'string' || token.length > 8000) return null;
  const [v, iv, enc, tag] = token.split('.');
  if (v !== 's1' || !iv || !enc || !tag) return null;
  try {
    const key = crypto.createHash('sha256').update(`seal:${secret}`).digest();
    const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
    d.setAuthTag(Buffer.from(tag, 'base64url'));
    const out = Buffer.concat([d.update(Buffer.from(enc, 'base64url')), d.final()]);
    return JSON.parse(out.toString('utf-8'));
  } catch {
    return null;
  }
}
