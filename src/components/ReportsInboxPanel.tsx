import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { UserSession } from '../types';
import { checkReports, DailyReport, fetchReports } from '../utils/dailyReport';
import { dayKey } from '../utils/activityLog';

interface Props {
  /** 학생 명단 (마스터 제외) */
  students: UserSession[];
  /** 학생 이름을 눌렀을 때: 그 학생의 학습 현황(달력·기록) 열기 */
  onOpenStudent?: (student: UserSession) => void;
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MODE_NAME: Record<string, string> = { key: '자리', word: '낱말', sent: '짧은 글', long: '긴 글', etc: '지식·명곡' };
const keyToDate = (k: string) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
const hm = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};
const dayLabel = (k: string, today: string) => {
  const d = keyToDate(k);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEK[d.getDay()]})${k === today ? ' · 오늘' : ''}`;
};

/** 선생님: 학생들이 보낸 '오늘의 연습'을 한곳에 모아 보는 창 */
export const ReportsInboxPanel: React.FC<Props> = ({ students, onOpenStudent }) => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [fromServer, setFromServer] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0);
  const [view, setView] = useState<'list' | 'table'>('list');
  const [onlyNew, setOnlyNew] = useState(false);
  const [ym, setYm] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 }));
  const today = dayKey();

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchReports(100);
    setReports(r.reports);
    setFromServer(r.fromServer);
    setError(r.error || '');
    setLoadedAt(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(t);
  }, [load]);

  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const unchecked = reports.filter((r) => !r.checkedAt).length;

  const mark = async (ids: string[], on = true) => {
    if (!ids.length) return;
    // 화면에 먼저 반영하고 서버에 저장
    setReports((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, checkedAt: on ? Date.now() : 0 } : r)));
    await checkReports({ ids }, on);
  };
  const markAll = async () => {
    setReports((prev) => prev.map((r) => (r.checkedAt ? r : { ...r, checkedAt: Date.now() })));
    await checkReports({ all: true });
  };

  /* 날짜별 묶음 (최근 날짜가 위) */
  const groups = useMemo(() => {
    const m = new Map<string, DailyReport[]>();
    for (const r of reports) {
      if (onlyNew && r.checkedAt) continue;
      if (!m.has(r.day)) m.set(r.day, []);
      m.get(r.day)!.push(r);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([day, list]) => ({ day, list: list.sort((a, b) => a.name.localeCompare(b.name, 'ko')) }));
  }, [reports, onlyNew]);

  const sentByDay = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const r of reports) {
      if (!m.has(r.day)) m.set(r.day, new Set());
      m.get(r.day)!.add(r.userId);
    }
    return m;
  }, [reports]);

  /* 달력표 */
  const now = new Date();
  const isThisMonth = ym.y === now.getFullYear() && ym.m === now.getMonth() + 1;
  const moveMonth = (delta: number) => {
    const d = new Date(ym.y, ym.m - 1 + delta, 1);
    if (d.getTime() > new Date(now.getFullYear(), now.getMonth(), 1).getTime()) return;
    setYm({ y: d.getFullYear(), m: d.getMonth() + 1 });
  };
  const monthDays = useMemo(() => {
    const last = new Date(ym.y, ym.m, 0).getDate();
    return Array.from({ length: last }, (_, i) => `${ym.y}-${String(ym.m).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`);
  }, [ym]);
  const cell = useMemo(() => {
    const m = new Map<string, DailyReport>();
    for (const r of reports) m.set(r.id, r);
    return m;
  }, [reports]);

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden" data-testid="reports-inbox">
      <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-black">
          <span className={`px-2.5 py-1 rounded-full border ${unchecked ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'}`} data-testid="reports-unchecked">
            {unchecked ? `📮 새 보고 ${unchecked}건` : '✅ 새 보고 없음 · 모두 확인함'}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
            오늘 보낸 학생 {sentByDay.get(today)?.size || 0} / {students.length}명
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-black">
            <button type="button" onClick={() => setView('list')} className={`px-2.5 py-1 rounded-lg cursor-pointer ${view === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>
              날짜별 목록
            </button>
            <button type="button" onClick={() => setView('table')} className={`px-2.5 py-1 rounded-lg cursor-pointer ${view === 'table' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}>
              한 달 표
            </button>
          </div>
          <button type="button" onClick={markAll} disabled={!unchecked} className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-black flex items-center gap-1 cursor-pointer disabled:cursor-default" data-testid="reports-check-all">
            <CheckCheck className="w-3.5 h-3.5" /> 모두 확인
          </button>
          <button type="button" onClick={() => void load()} className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 새로고침
          </button>
        </div>
      </div>

      {error && <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shrink-0">❌ {error}</div>}
      {!fromServer && !error && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shrink-0">미리보기에는 서버가 없어서 이 컴퓨터에서 보낸 보고만 보여요. 실제 사이트에서는 모든 학생의 보고가 모여요.</div>
      )}

      {view === 'list' ? (
        <>
          <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 cursor-pointer select-none">
              <input type="checkbox" checked={onlyNew} onChange={(e) => setOnlyNew(e.target.checked)} />
              아직 확인 안 한 것만
            </label>
            <span className="text-[11px] text-slate-400 ml-auto">{loadedAt ? `${new Date(loadedAt).toLocaleTimeString('ko-KR')} 기준 · 1분마다 자동 갱신 · 최근 100일` : ''}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {groups.length === 0 && (
              <div className="py-14 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-2xl">
                {loading ? '불러오는 중…' : onlyNew ? '확인하지 않은 보고가 없어요. 🎉' : '아직 받은 보고가 없어요. 학생이 연습을 마치고 [선생님께 보내기]를 누르면 여기에 모여요.'}
              </div>
            )}
            {groups.map(({ day, list }) => {
              const sent = sentByDay.get(day) || new Set<string>();
              const missing = students.filter((s) => !sent.has(s.id));
              const newIds = list.filter((r) => !r.checkedAt).map((r) => r.id);
              return (
                <div key={day} className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden" data-testid="reports-day">
                  <div className="flex items-center justify-between gap-2 flex-wrap px-3 py-2 bg-slate-50 border-b border-slate-200">
                    <div className="text-sm font-black text-slate-900">
                      {dayLabel(day, today)}
                      <span className="ml-2 text-xs font-bold text-slate-500">
                        보낸 학생 {sent.size} / {students.length}명
                      </span>
                    </div>
                    <button type="button" onClick={() => void mark(newIds)} disabled={!newIds.length} className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black cursor-pointer disabled:opacity-40 disabled:cursor-default">
                      이 날 모두 확인
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-bold text-slate-700 min-w-[760px]">
                      <thead>
                        <tr className="text-left text-[11px] text-slate-400 border-b border-slate-100">
                          <th className="py-1.5 pl-3 pr-2">학생</th>
                          <th className="py-1.5 pr-2">보낸 시각</th>
                          <th className="py-1.5 pr-2">연습량</th>
                          <th className="py-1.5 pr-2">타수</th>
                          <th className="py-1.5 pr-2">무엇을</th>
                          <th className="py-1.5 pr-2">진도</th>
                          <th className="py-1.5 pr-2">한마디</th>
                          <th className="py-1.5 pr-3 text-right">확인</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((r) => {
                          const s = r.summary;
                          const st = byId.get(r.userId);
                          return (
                            <tr key={r.id} className={`border-b border-slate-100 ${r.checkedAt ? '' : 'bg-rose-50/50'}`} data-testid="reports-row">
                              <td className="py-1.5 pl-3 pr-2 whitespace-nowrap">
                                <button type="button" onClick={() => st && onOpenStudent?.(st)} className={`text-sm font-black text-slate-900 ${st && onOpenStudent ? 'cursor-pointer hover:text-sky-600 underline decoration-dotted underline-offset-2' : ''}`} title="이 학생의 달력·연습 기록 보기">
                                  {r.name}
                                </button>
                                {r.grade ? <span className="ml-1 text-[10px] text-slate-400">{r.grade}학년</span> : null}
                              </td>
                              <td className="py-1.5 pr-2 whitespace-nowrap text-slate-500">{hm(r.sentAt)}</td>
                              <td className="py-1.5 pr-2 whitespace-nowrap">
                                <span className="text-slate-900 font-black">{s.sets}세트</span>
                                <span className="text-slate-500">
                                  {' '}
                                  · {s.keys.toLocaleString()}타 · {s.minutes}분
                                </span>
                              </td>
                              <td className="py-1.5 pr-2 whitespace-nowrap">
                                {s.sets ? (
                                  <>
                                    <span className="text-sky-700 font-black">평균 {s.avgCpm}</span>
                                    <span className="text-slate-500">
                                      {' '}
                                      · 최고 {s.bestCpm} · {s.avgAcc}%
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-300">–</span>
                                )}
                              </td>
                              <td className="py-1.5 pr-2">
                                {Object.entries(s.byMode || {})
                                  .filter(([, c]) => c > 0)
                                  .map(([m, c]) => `${MODE_NAME[m] || m} ${c}`)
                                  .join(' · ') || <span className="text-slate-300">–</span>}
                              </td>
                              <td className="py-1.5 pr-2 whitespace-nowrap tabular-nums">{s.questPercent}%</td>
                              <td className="py-1.5 pr-2 text-slate-600 max-w-[180px]">{r.note || <span className="text-slate-300">–</span>}</td>
                              <td className="py-1.5 pr-3 text-right whitespace-nowrap">
                                {r.checkedAt ? (
                                  <button type="button" onClick={() => void mark([r.id], false)} className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-black cursor-pointer" title="확인 표시 지우기">
                                    💮 확인함
                                  </button>
                                ) : (
                                  <button type="button" onClick={() => void mark([r.id])} className="px-2 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-black cursor-pointer" data-testid="reports-check">
                                    확인
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {!onlyNew && missing.length > 0 && (
                    <div className="px-3 py-2 text-[11px] font-bold text-slate-500 bg-slate-50/60">
                      <span className="text-rose-600 font-black">안 보낸 학생 {missing.length}명</span> : {missing.map((m) => m.name).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 shrink-0 text-xs font-bold">
            <div className="flex items-center rounded-xl border border-slate-300 bg-white font-black text-slate-800">
              <button type="button" onClick={() => moveMonth(-1)} className="px-1.5 py-1.5 cursor-pointer hover:bg-slate-100 rounded-l-xl" aria-label="이전 달">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 tabular-nums">
                {ym.y}년 {ym.m}월
              </span>
              <button type="button" onClick={() => moveMonth(1)} disabled={isThisMonth} className="px-1.5 py-1.5 cursor-pointer hover:bg-slate-100 rounded-r-xl disabled:opacity-30 disabled:cursor-default" aria-label="다음 달">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <span className="text-[11px] text-slate-500">📮 보냄(아직 확인 안 함) · 💮 확인함 · 칸을 누르면 확인 표시</span>
          </div>
          <div className="flex-1 overflow-auto border-2 border-slate-200 rounded-2xl bg-white">
            <table className="text-[11px] font-bold text-slate-700 border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50">
                <tr>
                  <th className="sticky left-0 bg-slate-50 py-1.5 px-3 text-left border-b-2 border-slate-200 min-w-[96px]">학생</th>
                  {monthDays.map((k) => {
                    const d = keyToDate(k);
                    const weekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={k} className={`py-1 w-7 min-w-7 text-center border-b-2 border-slate-200 ${k === today ? 'bg-pink-100 text-pink-700' : weekend ? 'text-slate-300' : 'text-slate-500'}`}>
                        <div className="leading-none">{d.getDate()}</div>
                        <div className="text-[9px] leading-none mt-0.5">{WEEK[d.getDay()]}</div>
                      </th>
                    );
                  })}
                  <th className="py-1.5 px-2 text-center border-b-2 border-slate-200 whitespace-nowrap">보낸 날</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  let count = 0;
                  return (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-sky-50/40">
                      <td className="sticky left-0 bg-white py-1 px-3 whitespace-nowrap">
                        <button type="button" onClick={() => onOpenStudent?.(s)} className="font-black text-slate-900 cursor-pointer hover:text-sky-600">
                          {s.name}
                        </button>
                      </td>
                      {monthDays.map((k) => {
                        const r = cell.get(`${s.id}_${k}`);
                        if (r) count += 1;
                        return (
                          <td key={k} className={`text-center ${k === today ? 'bg-pink-50' : ''}`}>
                            {r ? (
                              <button
                                type="button"
                                onClick={() => void mark([r.id], !r.checkedAt)}
                                title={`${r.name} · ${dayLabel(k, today)} ${hm(r.sentAt)} · ${r.summary.sets}세트 · ${r.summary.keys.toLocaleString()}타 · ${r.summary.minutes}분${r.summary.sets ? ` · 평균 ${r.summary.avgCpm}타` : ''}${r.note ? ` · "${r.note}"` : ''}`}
                                className="cursor-pointer text-sm leading-none"
                              >
                                {r.checkedAt ? '💮' : '📮'}
                              </button>
                            ) : k > today ? (
                              ''
                            ) : (
                              <span className="text-slate-200">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center font-black text-slate-900 tabular-nums">{count}일</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
