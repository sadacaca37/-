/**
 * 펀펀 플레이 게임 입장권
 *  - 예전에는 서버가 입장권을 확인했지만, 이제는 모아팡으로 들어온 학생이면 바로 입장
 *  - 'ok': 입장 가능 / 'login': 다시 들어와야 함 / 'noserver': (예전 서버 없는 미리보기)
 */
import { auth } from './moaFirebase';

export async function requestFunPass(_seconds: number): Promise<'ok' | 'login' | 'noserver'> {
  return auth.currentUser ? 'ok' : 'login';
}

export function leaveFunPass() {}

export function serverLogout() {}
