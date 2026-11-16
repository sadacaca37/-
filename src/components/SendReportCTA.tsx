import React, { useMemo } from 'react';
import { dayKey, KEY_ROUNDS_PER_SET } from '../utils/activityLog';
import { readLocalActivity } from '../utils/studentActivity';

/** 어디서든 '선생님께 보내기' 창 열기 */
export const openSendReport = () => window.dispatchEvent(new Event('typang-open-send-report'));

function currentStudentId(): string {
  try {
    const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
    return u && u.role !== 'master' && u.id ? String(u.id) : '';
  } catch {
    return '';
  }
}

/**
 * 세트를 끝낸 결과 창 안에 크게 보이는 [선생님께 보내기]
 *  - 자리 연습은 3번 쳐야 1세트 → 1·2번째에는 남은 횟수를 보여 주고, 3번째에 보내기 버튼
 */
export const SendReportCTA: React.FC<{ kind?: 'key' | 'other'; className?: string }> = ({ kind = 'other', className = '' }) => {
  const uid = currentStudentId();
  const keyRounds = useMemo(() => {
    if (!uid || kind !== 'key') return 0;
    try {
      return readLocalActivity(uid).days[dayKey()]?.m?.key || 0;
    } catch {
      return 0;
    }
  }, [uid, kind]);
  if (!uid) return null;

  if (kind === 'key' && keyRounds % KEY_ROUNDS_PER_SET !== 0) {
    const left = KEY_ROUNDS_PER_SET - (keyRounds % KEY_ROUNDS_PER_SET);
    return (
      <div className={`rounded-2xl border-2 border-sky-200 bg-sky-50 px-4 py-3 text-sky-900 ${className}`} data-testid="send-cta-progress">
        <div className="text-lg font-black">
          ⌨️ 자리 연습 {keyRounds % KEY_ROUNDS_PER_SET} / {KEY_ROUNDS_PER_SET}번
        </div>
        <div className="text-sm font-bold text-sky-700">자리 연습은 3번 치면 1세트예요. {left}번 더 치면 선생님께 보낼 수 있어요!</div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openSendReport}
      data-testid="send-cta"
      className={`w-full rounded-3xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white px-5 py-5 shadow-lg ring-4 ring-sky-200 cursor-pointer animate-pulse hover:animate-none ${className}`}
    >
      <div className="text-2xl sm:text-3xl font-black">📮 선생님께 보내기</div>
      <div className="text-sm sm:text-base font-bold text-sky-50 mt-1">오늘 연습을 다 했으면 눌러서 선생님께 보내요</div>
    </button>
  );
};
