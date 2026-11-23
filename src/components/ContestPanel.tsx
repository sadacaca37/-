/**
 * 선생님: 타자 대회 열기 · 진행 보기 · 결과 발표(1·2·3등 포인트)
 */
import React, { useEffect, useState } from 'react';
import { SENTENCE_PRACTICE_DATA } from '../data/practiceData';
import { Contest, ContestRanking, ContestResult, CONTEST_PRIZES, ERROR_PENALTY, endContestNow, finalizeContest, readContest, readContestResults, removeContest, saveContest, contestLines } from '../utils/contest';
import { askConfirm } from '../utils/dialog';

const toInput = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export const ContestPanel: React.FC = () => {
  const [cur, setCur] = useState<Contest | null>(null);
  const [res, setRes] = useState<ContestRanking | undefined>();
  const [list, setList] = useState<ContestResult[]>([]);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [start, setStart] = useState(() => toInput(Date.now() + 5 * 60000));
  const [minutes, setMinutes] = useState(10);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);

  const load = async () => {
    const r = await readContest();
    setCur(r.cur);
    setRes(r.cur ? r.results[r.cur.id] : undefined);
    if (r.cur) setList(await readContestResults(r.cur.id));
  };
  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(t);
  }, []);
  const say = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(''), 8000);
  };

  const pickSentences = () => {
    const all = (SENTENCE_PRACTICE_DATA as any[]).filter((c) => !String(c.category).includes('5분')).flatMap((c) => c.sentences as string[]);
    const picks: string[] = [];
    while (picks.length < 6 && all.length) picks.push(all.splice(Math.floor(Math.random() * all.length), 1)[0]);
    setText(picks.join('\n'));
  };

  const now = Date.now();
  const state = !cur ? '' : now < cur.startAt ? '⏳ 시작 전' : now < cur.endAt ? '🔴 진행 중' : res?.paid ? '🏆 결과 발표함' : '⏹ 끝남 (발표 전)';

  return (
    <div className="px-3 py-2 rounded-xl border-2 border-violet-300 bg-violet-50 text-xs font-bold text-violet-950 space-y-2 shrink-0" data-testid="contest-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[13px] font-black" title={`정해진 시간에 한 번만 · 점수 = 타수 − 오타×${ERROR_PENALTY} · 1·2·3등 ${CONTEST_PRIZES.join('·')}P`}>🏁 타자 대회</span>
        <button type="button" className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-black cursor-pointer" onClick={() => setOpen(!open)}>
          {open ? '접기' : cur ? '대회 보기' : '대회 열기'}
        </button>
      </div>
      {cur && (
        <div className="flex flex-wrap items-center gap-2">
          <b>{cur.title}</b>
          <span className="px-2 py-0.5 rounded bg-white border border-violet-200">{state}</span>
          <span>
            {new Date(cur.startAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ~ {new Date(cur.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>참가 {list.length}명</span>
        </div>
      )}
      {open && (
        <div className="space-y-3">
          {cur && (
            <div className="space-y-2">
              <div className="max-h-56 overflow-y-auto rounded-lg border border-violet-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-violet-100">
                    <tr>
                      <th className="px-2 py-1">순위</th>
                      <th className="px-2 py-1 text-left">이름</th>
                      <th className="px-2 py-1">점수</th>
                      <th className="px-2 py-1">타수</th>
                      <th className="px-2 py-1">오타</th>
                      <th className="px-2 py-1">정확도</th>
                      <th className="px-2 py-1">걸린 시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-slate-400">아직 도전한 학생이 없어요.</td>
                      </tr>
                    )}
                    {list.map((r, i) => (
                      <tr key={r.userId + i} className="border-t border-violet-100 text-center">
                        <td className="px-2 py-1">{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
                        <td className="px-2 py-1 text-left">
                          {r.name}
                          {r.grade ? ` (${r.grade}학년)` : ''}
                        </td>
                        <td className="px-2 py-1 font-black">{r.score}</td>
                        <td className="px-2 py-1">{r.cpm}</td>
                        <td className="px-2 py-1">{r.errors}</td>
                        <td className="px-2 py-1">{r.accuracy}%</td>
                        <td className="px-2 py-1">{r.seconds}초</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="px-3 py-1.5 rounded-lg bg-white border border-violet-300 cursor-pointer" onClick={() => void load()}>
                  🔄 새로 고침
                </button>
                {now < cur.endAt && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-rose-500 text-white cursor-pointer"
                    onClick={async () => {
                      if (!(await askConfirm('대회를 지금 끝낼까요?', '지금 끝내기'))) return;
                      say((await endContestNow()) ? '⏹ 대회를 끝냈어요. [결과 발표]를 눌러 주세요.' : '❌ 끝내지 못했어요.');
                      window.dispatchEvent(new Event('contest-updated'));
                      void load();
                    }}
                  >
                    ⏹ 지금 끝내기
                  </button>
                )}
                {!res?.paid && (
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-white cursor-pointer disabled:opacity-40"
                    disabled={now < cur.endAt}
                    title={now < cur.endAt ? '대회가 끝나면 누를 수 있어요' : ''}
                    onClick={async () => {
                      if (!(await askConfirm(`결과를 발표하고 1·2·3등에게 ${CONTEST_PRIZES.join('·')}P를 줄까요?`, '결과 발표'))) return;
                      const r = await finalizeContest();
                      say(r.done ? `🏆 결과 발표! ${r.winners?.join(', ') || '참가자 없음'}` : '❌ 발표하지 못했어요. (이미 발표했거나 아직 대회 중)');
                      window.dispatchEvent(new Event('contest-updated'));
                      void load();
                    }}
                  >
                    🏆 결과 발표 + 상 주기
                  </button>
                )}
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 cursor-pointer"
                  onClick={async () => {
                    if (!(await askConfirm('이 대회를 첫 화면에서 내릴까요? (결과 기록은 남아요)', '내리기'))) return;
                    await removeContest();
                    window.dispatchEvent(new Event('contest-updated'));
                    setList([]);
                    void load();
                  }}
                >
                  대회 내리기
                </button>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-white border border-violet-200 space-y-2">
            <div className="font-black">{cur ? '새 대회 열기 (지금 대회는 내려가요)' : '새 대회 열기'}</div>
            <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 40))} placeholder="대회 이름 (예: 11월 타자왕 대회)" className="w-full px-3 py-2 rounded-lg border border-violet-200" />
            <div className="flex items-center gap-2">
              <span>대회 글 (한 줄에 한 문장)</span>
              <button type="button" className="px-2 py-1 rounded bg-violet-100 border border-violet-200 cursor-pointer" onClick={pickSentences}>
                🎲 짧은 글에서 6문장 고르기
              </button>
              <span className="ml-auto text-slate-500">{contestLines(text).length}줄</span>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder="대회 때 칠 글을 써 주세요. 줄마다 Enter로 넘어가요." className="w-full px-3 py-2 rounded-lg border border-violet-200 font-medium" />
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1">
                시작
                <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="px-2 py-1 rounded border border-violet-200" />
              </label>
              <label className="flex items-center gap-1">
                시간
                <input type="number" min={1} max={120} value={minutes} onChange={(e) => setMinutes(Math.max(1, Math.min(120, Number(e.target.value) || 10)))} className="w-16 px-2 py-1 rounded border border-violet-200" />분
              </label>
              <button type="button" className="px-2 py-1 rounded bg-violet-100 border border-violet-200 cursor-pointer" onClick={() => setStart(toInput(Date.now() + 60000))}>
                1분 뒤 시작
              </button>
              <button
                type="button"
                className="ml-auto px-4 py-2 rounded-lg bg-violet-600 text-white font-black cursor-pointer"
                onClick={async () => {
                  const startAt = new Date(start).getTime();
                  const r = await saveContest({ title, text, startAt, endAt: startAt + minutes * 60000 });
                  if (r.success) {
                    say('🏁 대회를 열었어요! 학생 첫 화면에 대회 알림이 떠요.');
                    setTitle('');
                    setText('');
                    window.dispatchEvent(new Event('contest-updated'));
                    void load();
                  } else say(`❌ ${r.message}`);
                }}
                data-testid="contest-save"
              >
                🏁 대회 열기
              </button>
            </div>
          </div>
        </div>
      )}
      {msg && <div>{msg}</div>}
    </div>
  );
};
