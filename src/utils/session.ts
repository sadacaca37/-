/** 지금 로그인한 학생의 id. 로그아웃 상태면 undefined (로그아웃 상태에서는 아무것도 저장하지 않음) */
export function currentUserId(): string | undefined {
  try {
    const raw = localStorage.getItem('typang_current_user');
    if (!raw) return undefined;
    const u = JSON.parse(raw);
    return u && u.id ? String(u.id) : undefined;
  } catch {
    return undefined;
  }
}

/** 저장해도 되는 학생 id 인지 (로그인한 학생 본인만) */
export function isSavableUser(userId?: string | null): boolean {
  if (!userId || userId === 'guest') return false;
  return currentUserId() === String(userId);
}
