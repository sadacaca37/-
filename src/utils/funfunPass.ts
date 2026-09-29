/**
 * 펀펀 플레이 게임 입장권 (서버가 확인)
 *  - 'ok': 입장 가능 / 'login': 다시 로그인 필요 / 'noserver': 서버 없는 미리보기(그대로 진행)
 */
export async function requestFunPass(seconds: number): Promise<'ok' | 'login' | 'noserver'> {
  try {
    const r = await fetch('/api/funfun/pass', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds: Math.max(60, Math.round(seconds || 0)) }),
    });
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return 'noserver';
    if (r.status === 401) return 'login';
    const j = await r.json();
    return j?.success ? 'ok' : 'login';
  } catch {
    return 'noserver';
  }
}

export function leaveFunPass() {
  try {
    fetch('/api/funfun/leave', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {});
  } catch {}
}

export function serverLogout() {
  try {
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(() => {});
  } catch {}
}
