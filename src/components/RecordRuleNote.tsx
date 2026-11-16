import React from 'react';
import { requiredAccuracy } from '../utils/typingScore';

/** 결과 창 안내: 타수 계산 방법 + 명예의 전당 기록 인정 기준 (한컴타자 방식) */
export const RecordRuleNote: React.FC<{ cpm: number; accuracy: number; ranked?: boolean }> = ({ cpm, accuracy, ranked = true }) => {
  const need = requiredAccuracy(cpm);
  const ok = accuracy >= need;
  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-700 space-y-1" data-testid="record-rule">
      <div>📏 타수는 <b>맞게 친 자음·모음만</b> 세요. 틀린 글자는 타수에서 빠지고 오타로 남아요.</div>
      {ranked && (
        <div className={ok ? 'text-emerald-700' : 'text-rose-600'}>
          {ok ? '🏆' : '✋'} 명예의 전당은 {cpm}타일 때 정확도 {need}% 이상이어야 올라가요 → 이번 정확도 {accuracy}% {ok ? '· 기록 인정!' : '· 이번 기록은 올라가지 않아요'}
        </div>
      )}
    </div>
  );
};
