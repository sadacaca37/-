import React, { useEffect, useMemo, useState } from 'react';
import { Send, X } from 'lucide-react';
import { UserSession } from '../types';
import { buildTodaySummary, fetchMyReports, MyReport, sendTodayReport } from '../utils/dailyReport';
import { lastNDayKeys } from '../utils/activityLog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
}

const MODE_NAME: Record<string, string> = { key: '자리', word: '낱말', sent: '짧은 글', long: '긴 글', etc: '지식·명곡' };
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const hm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 학생: 오늘 연습한 것을 선생님께 보내는 창 */
export const SendReportModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [note, setNote] = useState('');
  const [mine, setMine] = useState<MyReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [tick, setTick] = useState(0);

  const today = useMemo(() => buildTodaySummary(currentUser.id), [currentUser.id, tick, isOpen]);
  const week = useMemo(() => lastNDayKeys(7), [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setMsg('');
    void fetchMyReports(currentUser.id).then(setMine);
    // 연습 창에서 방금 친 것이 반영되도록 창이 열려 있는 동안 다시 계산
    const t = window.setInterval(() => setTick((n) => n + 1), 4000);
    return () => window.clearInterval(t);
  }, [isOpen, currentUser.id]);

  if (!isOpen) return null;

  const sent = mine.find((r) => r.day === today.day);
  const changedSinceSent = !!sent && (sent.sets !== today.summary.sets || sent.keys !== today.summary.keys);
  const s = today.summary;

  const handleSend = async () => {
    setBusy(true);
    const r = await sendTodayReport(currentUser, note.trim());
    setBusy(false);
    if (r.success) {
      setMsg('✅ 선생님께 보냈어요! 수고했어요 👏');
      setNote('');
      setMine(await fetchMyReports(currentUser.id));
    } else setMsg(`❌ ${r.message || '보내지 못했어요.'}`);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl border-4 border-sky-200 relative" onClick={(e) => e.stopPropagation()} data-testid="send-report-modal">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer" aria-label="닫기">
          <X className="w-4 h-4 text-slate-600" />
        </button>
        <h2 className="text-lg font-black text-slate-900">📮 오늘 연습, 선생님께 보내기</h2>
        <p className="text-xs font-bold text-slate-500 mt-0.5">오늘 연습을 다 했으면 보내 주세요. 선생님이 모아서 확인해요.</p>

        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
          <Cell label="끝낸 세트" value={`${s.sets}세트`} />
          <Cell label="친 글자 수" value={`${s.keys.toLocaleString()}타`} />
          <Cell label="연습 시간" value={`${s.minutes}분`} />
          <Cell label="평균 타수" value={s.sets ? `${s.avgCpm}타` : '-'} />
          <Cell label="정확도" value={s.sets ? `${s.avgAcc}%` : '-'} />
          <Cell label="전체 진도" value={`${s.questPercent}%`} />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[22px]">
          {Object.entries(s.byMode)
            .filter(([, c]) => c > 0)
            .map(([m, c]) => (
              <span key={m} className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-black">
                {MODE_NAME[m] || m} {c}세트
              </span>
            ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 120))}
          placeholder="선생님께 한마디 (안 써도 돼요)"
          rows={2}
          className="mt-3 w-full px-3 py-2 rounded-2xl border-2 border-slate-200 focus:border-sky-400 text-sm font-bold text-slate-800 outline-hidden resize-none"
        />

        {!today.active ? (
          <div className="mt-3 px-3 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold text-center">오늘 친 타자가 아직 없어요. 연습을 하고 나서 보내 주세요!</div>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={busy || (!!sent && !changedSinceSent && !note.trim())}
            data-testid="send-report-btn"
            className="mt-3 w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-300 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-default"
          >
            <Send className="w-4 h-4" />
            {busy ? '보내는 중…' : !sent ? '선생님께 보내기' : changedSinceSent || note.trim() ? '더 연습한 것 다시 보내기' : `오늘 보냈어요 (${hm(sent.sentAt)})`}
          </button>
        )}

        {msg && <div className="mt-2 text-center text-sm font-black text-slate-800">{msg}</div>}
        {sent && !msg && (
          <div className="mt-2 text-center text-xs font-bold text-slate-500">
            {sent.checkedAt ? '💮 선생님이 확인했어요!' : '선생님이 아직 확인하지 않았어요.'}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-black text-slate-500 mb-1.5">최근 7일</div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {week.map((k) => {
              const r = mine.find((x) => x.day === k);
              const d = new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
              return (
                <div key={k} className={`rounded-xl border py-1 ${r ? (r.checkedAt ? 'bg-emerald-100 border-emerald-300' : 'bg-sky-100 border-sky-300') : 'bg-slate-50 border-slate-200'}`}>
                  <div className="text-[10px] font-bold text-slate-500">
                    {d.getDate()}({WEEK[d.getDay()]})
                  </div>
                  <div className="text-sm leading-tight">{r ? (r.checkedAt ? '💮' : '📮') : '·'}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 text-[10px] font-bold text-slate-400">📮 보냄 · 💮 선생님 확인</div>
        </div>
      </div>
    </div>
  );
};

const Cell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 py-2">
    <div className="text-[10px] font-bold text-slate-500">{label}</div>
    <div className="text-sm font-black text-slate-900 tabular-nums">{value}</div>
  </div>
);
