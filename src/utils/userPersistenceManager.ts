import { UserSession } from '../types';
import { typangApi } from './apiClient';

/**
 * 회원 명단 관리자
 * - 명단의 기준은 서버(members.json 고정 명단 + 실행 중 변경)입니다.
 * - 브라우저에는 마지막으로 받은 명단을 "캐시"로만 보관하고, 서버로 다시 밀어넣지 않습니다.
 *   (그래서 마스터가 삭제한 학생이 다른 컴퓨터의 옛 기록 때문에 되살아나지 않습니다.)
 * - 추가·삭제·승인·비밀번호 변경은 마스터만 가능합니다(서버에서 마스터 비밀번호로 확인).
 */
class UserPersistenceManager {
  public getLocalUsers(): UserSession[] {
    return typangApi.getCachedUsers();
  }

  public saveUsers(users: UserSession[]) {
    try {
      localStorage.setItem('typang_users_db', JSON.stringify(users));
    } catch {}
  }

  public async reconcileWithServer(serverUsers: UserSession[]): Promise<UserSession[]> {
    this.saveUsers(serverUsers);
    return serverUsers;
  }

  public isMaster(user: UserSession | null): boolean {
    if (!user) return false;
    return user.role === 'master' || user.studentId === 'master' || user.id === 'master_admin';
  }
}

export const userPersistenceManager = new UserPersistenceManager();
