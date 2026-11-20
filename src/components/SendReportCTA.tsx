import React, { useMemo } from 'react';
import { dayKey, KEY_ROUNDS_PER_SET } from '../utils/activityLog';
import { readLocalActivity } from '../utils/studentActivity';

/** 어디서든 '선생님께 보내기' 창 열기 */
export const openSendReport = () => window.dispatchEvent(new Event('typang-open-send-report'));

function currentUserInfo(): { id: string; role: string } | null {
  try {
    const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
    return u && u.id ? { id: String(u.id), role: String(u.role || 'student') } : null;
  } catch {
    return null;
  }
}

/**
 * 세트를 끝낸 결과 창 안에 크게 보이는 [선생님께 보내기]
 *  - 자리 연습은 '같은 자리(단계)'를 3번 쳐야 1세트 → 1·2번째에는 남은 횟수를 보여 주고, 3번째에 보내기 버튼
 *  - 선생님 계정·로그인 안 한 상태에서도 버튼 자리는 보이게 하고, 왜 못 보내는지 알려 줌
 */
export const SendReportCTA: React.FC<{ kind?: 'key' | 'other'; keyStage?: string; stageLabel?: string; className?: string }> = ({
  kind = 'other',
  keyStage,
  stageLabel,
  className = '',
}) => {
  const who = currentUserInfo();
  const isStudent = !!who && who.role !== 'master' && who.id !== 'master_admin';
  const stageRounds = useMemo(() => {
    if (!isStudent || kind !== 'key') return 0;
    try {
      const d = readLocalActivity(who!.id).days[dayKey()];
      if (keyStage && d?.ks) return d.ks[keyStage] || 0;
      return d?.m?.key || 0;
    } catch {
      return 0;
    }
  }, [isStudent, kind, keyStage, who?.id]);

  if (isStudent && kind === 'key' && stageRounds % KEY_ROUNDS_PER_SET !== 0) {
    const done = stageRounds % KEY_ROUNDS_PER_SET;
    const left = KEY_ROUNDS_PER_SET - done;
    return (
      <div className={`rounded-3xl border-4 border-sky-200 bg-sky-50 px-5 py-4 text-sky-900 ${className}`} data-testid="send-cta-progress">
        <div className="text-xl sm:text-2xl font-black">
          ⌨️ {stageLabel ? `${stageLabel} ` : '이 자리 '}
          {done} / {KEY_ROUNDS_PER_SET}번
        </div>
        <div className="text-sm sm:text-base font-bold text-sky-700 mt-1">
          같은 자리를 3번 치면 1세트예요. 이 자리를 {left}번 더 치면 선생님께 보낼 수 있어요!
        </div>
      </div>
    );
  }

  const note = isStudent ? '오늘 연습을 다 했으면 눌러서 선생님께 보내요' : who ? '학생 계정으로 들어오면 이 버튼으로 선생님께 보내요 (지금은 선생님 계정)' : '로그인한 학생만 선생님께 보낼 수 있어요';

  return (
    <button
      type="button"
      onClick={isStudent ? openSendReport : undefined}
      disabled={!isStudent}
      data-testid="send-cta"
      className={`w-full rounded-3xl px-5 py-5 shadow-lg ring-4 ${
        isStudent
          ? 'bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white ring-sky-200 cursor-pointer animate-pulse hover:animate-none'
          : 'bg-slate-200 text-slate-500 ring-slate-100 cursor-default'
      } ${className}`}
    >
      <div className="text-2xl sm:text-3xl font-black">📮 선생님께 보내기</div>
      <div className={`text-sm sm:text-base font-bold mt-1 ${isStudent ? 'text-sky-50' : 'text-slate-500'}`}>{note}</div>
    </button>
  );
};
