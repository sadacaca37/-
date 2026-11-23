/**
 * 학생: 타자 대회 도전 창 (대회 시간에 딱 한 번)
 *  - 줄마다 치고 Enter → 다음 줄. 마지막 줄에서 Enter 또는 시간이 끝나면 자동 제출
 *  - 붙여넣기는 막음
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { UserSession } from '../types';
import { Contest, ContestResult, contestLines, gradeContest, gradeLine, myContestResult, submitContest, ERROR_PENALTY, ContestRanking } from '../utils/contest';
import { soundManager } from '../utils/sound';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export const ContestModal: React.FC<{ contest: Contest; result?: ContestRanking; user: UserSession | null; onClose: () => void; onLogin: () => void }> = ({ contest, result, user, onClose, onLogin }) => {
  const lines = useMemo(() => contestLines(contest.text), [contest.text]);
  const [now, setNow] = useState(Date.now());
  const [mine, setMine] = useState<ContestResult | null | undefined>(undefined);
  const [typed, setTyped] = useState<string[]>([]);
  const [cur, setCur] = useState('');
  const [startedAt, setStartedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    if (!user || user.role === 'master') return setMine(null);
    void myContestResult(contest.id).then(setMine);
  }, [contest.id, user?.id]);

  const live = now >= contest.startAt && now < contest.endAt;
  const canPlay = !!user && user.role !== 'master' && user.isApproved === true && live && mine === null;

  const lastTypedRef = useRef<string[]>([]);
  const [failed, setFailed] = useState(false);
  const finish = async (allTyped: string[]) => {
    if (doneRef.current || !user) return;
    doneRef.current = true;
    lastTypedRef.current = allTyped;
    setFailed(false);
    setBusy(true);
    const seconds = Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 1000));
    const g = gradeContest(lines, allTyped, seconds);
    const r = { userId: user.id, name: user.name, grade: user.grade || undefined, cpm: g.cpm, errors: g.errors, accuracy: g.accuracy, score: g.score, seconds };
    const res = await submitContest(contest.id, r as any);
    setBusy(false);
    if (res.success) {
      setMine({ ...(r as any), ts: Date.now() });
      try {
        soundManager.playVictory();
      } catch {}
    } else {
      setMsg(`❌ ${res.message}`);
      // 인터넷 문제면 다시 낼 수 있게 (이미 낸 경우는 서버가 막음)
      doneRef.current = false;
      setFailed(true);
    }
  };

  // 시간이 끝나면 친 데까지 자동 제출
  useEffect(() => {
    if (startedAt && !doneRef.current && now >= contest.endAt) void finish([...typed, cur]);
  }, [now]);

  const advancingRef = useRef(false);
  const advance = (value: string) => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setTyped((prev) => {
      const next = [...prev, value];
      if (next.length >= lines.length) void finish(next);
      return next;
    });
    setCur('');
    window.setTimeout(() => (advancingRef.current = false), 50);
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    // 한글 조합 중에 Enter를 누르면 마지막 글자가 들어간 뒤에 다음 줄로
    if ((e.nativeEvent as any).isComposing) window.setTimeout(() => advance(inputRef.current?.value || ''), 20);
    else advance(cur);
  };

  const idx = typed.length;
  const target = lines[idx] || '';
  const g = target ? gradeLine(target, cur) : null;

  return (
    <div className="fixed inset-0 z-[85] bg-slate-900/70 flex items-center justify-center p-3" data-testid="contest-modal">
      <div className="w-full max-w-3xl max-h-[94vh] overflow-y-auto rounded-3xl border-4 border-[#1b2340] bg-[#fffdf6] shadow-[0_8px_0_#1b2340] p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black text-pink-600">🏁 타자 대회</div>
            <h2 className="text-2xl font-black text-[#1b2340]">{contest.title}</h2>
            <p className="text-xs font-bold text-slate-500 mt-1">
              {new Date(contest.startAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ~{' '}
              {new Date(contest.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} · 딱 한 번 도전 · 점수 = 타수 − 오타×{ERROR_PENALTY}
            </p>
          </div>
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-xl border-2 border-[#1b2340] bg-white font-black text-sm cursor-pointer">
            닫기
          </button>
        </div>

        {/* 결과 발표 */}
        {result && result.ranking.length > 0 && (
          <div className="p-4 rounded-2xl border-[3px] border-[#1b2340] bg-[#fff3cf]">
            <div className="font-black text-[#1b2340] mb-2">🏆 대회 결과</div>
            <ol className="space-y-1 text-sm font-bold text-[#3d4a66]">
              {result.ranking.slice(0, 10).map((r) => (
                <li key={r.place} className="flex justify-between gap-2">
                  <span>
                    {r.place <= 3 ? ['🥇', '🥈', '🥉'][r.place - 1] : `${r.place}.`} {r.name}
                    {r.grade ? ` (${r.grade}학년)` : ''}
                  </span>
                  <span>
                    {r.score}점 · {r.cpm}타 · 오타 {r.errors}
                    {r.prize ? ` · 🎁${r.prize}P` : ''}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {mine ? (
          <div className="p-5 rounded-2xl border-[3px] border-[#1b2340] bg-[#eafaf3] text-center space-y-1">
            <div className="text-3xl">🎉</div>
            <div className="text-lg font-black text-[#1b2340]">도전 완료! 내 점수 {mine.score}점</div>
            <div className="text-sm font-bold text-slate-600">
              {mine.cpm}타 · 오타 {mine.errors}개 · 정확도 {mine.accuracy}% · {mine.seconds}초
            </div>
            <div className="text-xs font-bold text-slate-500">대회가 끝나면 순위가 발표돼요. 1·2·3등은 포인트 선물을 받아요!</div>
          </div>
        ) : !user ? (
          <div className="p-5 rounded-2xl border-2 border-amber-300 bg-amber-50 text-center space-y-3">
            <div className="font-black text-amber-900">로그인해야 대회에 나갈 수 있어요.</div>
            <button type="button" onClick={onLogin} className="px-5 py-2 rounded-xl bg-sky-500 text-white font-black cursor-pointer">
              🔑 로그인
            </button>
          </div>
        ) : user.role === 'master' ? (
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-600">선생님 계정이에요. 대회 열기·결과는 마스터 관리실 → 🏁 타자 대회에서 볼 수 있어요.</div>
        ) : user.isApproved !== true ? (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-sm font-bold text-amber-900">선생님 승인을 받아야 대회에 나갈 수 있어요.</div>
        ) : now < contest.startAt ? (
          <div className="p-5 rounded-2xl border-[3px] border-[#1b2340] bg-[#dff4ff] text-center">
            <div className="text-sm font-black text-[#1b2340]">대회 시작까지</div>
            <div className="text-4xl font-black text-[#1b2340] font-mono">{fmt(contest.startAt - now)}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">시작하면 여기에 대회 글이 나와요.</div>
          </div>
        ) : !live ? (
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-600 text-center">대회가 끝났어요. {result ? '' : '선생님이 결과를 곧 발표해요.'}</div>
        ) : mine === undefined ? (
          <div className="p-4 text-center font-bold text-slate-500">확인하는 중…</div>
        ) : canPlay ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-black text-[#1b2340]">
              <span>
                {Math.min(idx + 1, lines.length)} / {lines.length} 줄
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#1b2340] text-[#ffd43b] font-mono">⏱ 남은 시간 {fmt(contest.endAt - now)}</span>
            </div>
            <div className="p-4 rounded-2xl border-[3px] border-[#1b2340] bg-white space-y-1">
              {lines.map((l, i) => (
                <div key={i} className={`text-base sm:text-lg font-bold leading-relaxed ${i < idx ? 'text-slate-300 line-through' : i === idx ? 'text-[#1b2340]' : 'text-slate-400'}`}>
                  {i === idx
                    ? [...l].map((ch, j) => (
                        <span key={j} className={j < [...cur].length ? ([...cur][j] === ch ? 'text-emerald-600' : 'text-rose-500 underline') : ''}>
                          {ch}
                        </span>
                      ))
                    : l}
                </div>
              ))}
            </div>
            {idx < lines.length && (
              <input
                ref={inputRef}
                autoFocus
                value={cur}
                disabled={busy}
                onChange={(e) => {
                  if (!startedAt) setStartedAt(Date.now());
                  setCur(e.target.value);
                }}
                onKeyDown={onKey}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                autoComplete="off"
                spellCheck={false}
                placeholder="위 글을 그대로 치고 Enter"
                className="w-full px-4 py-3 rounded-2xl border-[3px] border-[#1b2340] text-lg font-bold bg-[#fffaf0] outline-none"
                data-testid="contest-input"
              />
            )}
            {g && <div className="text-xs font-bold text-slate-500">이 줄 오타 {g.errors}개 (빠진 글자·더 친 글자도 오타)</div>}
            {busy && <div className="text-center font-black text-[#1b2340]">제출하는 중…</div>}
          </div>
        ) : null}
        {msg && <div className="text-sm font-bold text-rose-600">{msg}</div>}
        {failed && !mine && (
          <button type="button" className="w-full py-3 rounded-2xl bg-amber-500 text-white font-black cursor-pointer" onClick={() => void finish(lastTypedRef.current)}>
            🔁 다시 제출하기
          </button>
        )}
      </div>
    </div>
  );
};
