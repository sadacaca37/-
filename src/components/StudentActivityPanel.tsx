import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, FileText, RefreshCw, Search } from 'lucide-react';
import { UserSession } from '../types';
import { fetchAllActivity, StudentActivity } from '../utils/studentActivity';
import { dayActive, dayKey, dayKeys, daySeconds, DayStat, lastNDayKeys, monthKey, PeriodSummary, summarizeMonth } from '../utils/activityLog';

interface Props {
  /** 학생 명단 (마스터 제외) */
  students: UserSession[];
  /** 바로 자세히 볼 학생 (명단에서 '기록' 버튼을 눌렀을 때) */
  focusStudentId?: string | null;
  onFocusHandled?: () => void;
  onOpenReport?: (student: UserSession) => void;
}

type SortKey = 'today' | 'month' | 'cpm' | 'progress' | 'last' | 'name';

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const MODE_NAME: Record<string, string> = { key: '자리', word: '낱말', sent: '짧은 글', long: '긴 글', etc: '지식·명곡' };
const num = (n: number) => n.toLocaleString();
/** 'YYYY-MM-DD' → 이 컴퓨터 시간 기준 날짜 */
const keyToDate = (k: string) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));

function agoText(ts: number, now: number) {
  if (!ts) return '기록 없음';
  const d = new Date(ts);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const today = dayKey(now);
  if (dayKey(ts) === today) return `오늘 ${hm}`;
  const diff = Math.round((keyToDate(today).getTime() - keyToDate(dayKey(ts)).getTime()) / 86400000);
  if (diff === 1) return `어제 ${hm}`;
  if (diff < 7) return `${diff}일 전`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 하루 칸 색: 연습량이 많을수록 진하게 */
function heat(d: DayStat | undefined) {
  if (!dayActive(d)) return 'bg-slate-100 text-slate-400 border-slate-200';
  const n = d!.n || 0;
  if (n >= 6) return 'bg-emerald-600 text-white border-emerald-700';
  if (n >= 3) return 'bg-emerald-400 text-white border-emerald-500';
  if (n >= 1) return 'bg-emerald-200 text-emerald-900 border-emerald-300';
  return 'bg-amber-100 text-amber-800 border-amber-300'; // 쳤지만 세트를 끝내지는 못함
}

export const StudentActivityPanel: React.FC<Props> = ({ students, focusStudentId, onFocusHandled, onOpenReport }) => {
  const [data, setData] = useState<Record<string, StudentActivity>>({});
  const [fromServer, setFromServer] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState(0);
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState<number | 'all'>('all');
  const [onlyIdleToday, setOnlyIdleToday] = useState(false);
  const [sort, setSort] = useState<SortKey>('today');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const now = useMemo(() => new Date(), [loadedAt]);
  const [ym, setYm] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 }));

  const ids = useMemo(() => students.map((s) => s.id).join(','), [students]);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetchAllActivity(ids ? ids.split(',') : []);
    setData(r.users);
    setFromServer(r.fromServer);
    setError(r.error || '');
    setLoadedAt(Date.now());
    setLoading(false);
  }, [ids]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 60000); // 1분마다 새로 받아 옴
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (focusStudentId) {
      setSelectedId(focusStudentId);
      onFocusHandled?.();
    }
  }, [focusStudentId, onFocusHandled]);

  const todayKey = dayKey(now);
  const week = useMemo(() => lastNDayKeys(7, now), [now]);
  const isThisMonth = ym.y === now.getFullYear() && ym.m === now.getMonth() + 1;
  const moveMonth = (delta: number) => {
    const d = new Date(ym.y, ym.m - 1 + delta, 1);
    if (d.getTime() > new Date(now.getFullYear(), now.getMonth(), 1).getTime()) return;
    setYm({ y: d.getFullYear(), m: d.getMonth() + 1 });
  };

  const rows = useMemo(() => {
    return students.map((s) => {
      const a = data[s.id];
      const days = a?.days || {};
      const today = days[todayKey];
      const month: PeriodSummary = summarizeMonth(days, ym.y, ym.m);
      return { s, a, days, today, month, activeToday: dayActive(today) };
    });
  }, [students, data, todayKey, ym]);

  const grades = useMemo(() => [...new Set(students.map((s) => s.grade || 0).filter(Boolean))].sort((a, b) => a - b), [students]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (grade !== 'all' && (r.s.grade || 0) !== grade) return false;
      if (onlyIdleToday && r.activeToday) return false;
      if (q && !`${r.s.name} ${r.s.studentId || ''} ${r.s.phone || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const byName = (x: (typeof rows)[number], y: (typeof rows)[number]) => x.s.name.localeCompare(y.s.name, 'ko');
    list = [...list].sort((x, y) => {
      switch (sort) {
        case 'today':
          return dayKeys(y.today) - dayKeys(x.today) || (y.today?.n || 0) - (x.today?.n || 0) || byName(x, y);
        case 'month':
          return y.month.activeDays - x.month.activeDays || y.month.sets - x.month.sets || byName(x, y);
        case 'cpm':
          return y.month.avgCpm - x.month.avgCpm || byName(x, y);
        case 'progress':
          return (y.a?.questPercent || 0) - (x.a?.questPercent || 0) || byName(x, y);
        case 'last':
          return (y.a?.lastAt || 0) - (x.a?.lastAt || 0) || byName(x, y);
        default:
          return byName(x, y);
      }
    });
    return list;
  }, [rows, query, grade, onlyIdleToday, sort]);

  const totals = useMemo(() => {
    const weekSet = new Set(week);
    return {
      all: rows.length,
      today: rows.filter((r) => r.activeToday).length,
      week: rows.filter((r) => Object.entries(r.days).some(([k, d]) => weekSet.has(k) && dayActive(d))).length,
      month: rows.filter((r) => r.month.activeDays > 0).length,
    };
  }, [rows, week]);

  const downloadCsv = () => {
    const head = ['이름', '학년', '오늘 세트', '오늘 글자수', '오늘 분', `${ym.m}월 연습일`, `${ym.m}월 세트`, `${ym.m}월 글자수`, `${ym.m}월 분`, `${ym.m}월 평균타수`, `${ym.m}월 최고타수`, `${ym.m}월 정확도`, '진도율(%)', '자리', '낱말', '짧은 글', '긴 글', '마지막 연습'];
    const lines = shown.map((r) => {
      const q = r.a?.quest;
      const f = (m: 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice') => (q ? `${q[m].done}/${q[m].total}` : '');
      return [
        r.s.name,
        r.s.grade || '',
        r.today?.n || 0,
        dayKeys(r.today),
        Math.round(daySeconds(r.today) / 60),
        r.month.activeDays,
        r.month.sets,
        r.month.keys,
        r.month.minutes,
        r.month.avgCpm,
        r.month.bestCpm,
        r.month.avgAcc,
        r.a?.questPercent || 0,
        f('key-practice'),
        f('word-practice'),
        f('sentence-practice'),
        f('long-practice'),
        r.a?.lastAt ? new Date(r.a.lastAt).toLocaleString('ko-KR') : '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
    });
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `타자팡팡_학습현황_${ym.y}년${ym.m}월_${todayKey}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  const selected = selectedId ? rows.find((r) => r.s.id === selectedId) : null;

  /* ------------------------------ 한 학생 자세히 ------------------------------ */
  if (selected) {
    const { s, a, days, month } = selected;
    const first = new Date(ym.y, ym.m - 1, 1);
    const lastDate = new Date(ym.y, ym.m, 0).getDate();
    const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: lastDate }, (_, i) => i + 1)];
    const monthRecords = (a?.history || []).filter((r) => {
      const d = new Date(r.timestamp || 0);
      return d.getFullYear() === ym.y && d.getMonth() + 1 === ym.m;
    });
    const records = monthRecords.length ? monthRecords : a?.history || [];
    return (
      <div className="flex-1 flex flex-col gap-3 overflow-hidden" data-testid="activity-detail">
        <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSelectedId(null)} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1 cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /> 전체 학생
            </button>
            <span className="text-base font-black text-slate-900">
              {s.name} <span className="text-xs font-bold text-slate-500">{s.grade ? `${s.grade}학년` : ''}</span>
            </span>
            <span className="text-xs font-bold text-slate-500">마지막 연습: {agoText(a?.lastAt || 0, now.getTime())}</span>
          </div>
          <div className="flex items-center gap-2">
            <MonthNav ym={ym} onMove={moveMonth} canNext={!isThisMonth} />
            {onOpenReport && (
              <button type="button" onClick={() => onOpenReport(s)} className="px-3 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white text-xs font-black flex items-center gap-1 cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> 성적표
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center">
            <Stat label={`${ym.m}월 연습한 날`} value={`${month.activeDays}일`} tone="emerald" />
            <Stat label="끝낸 세트" value={`${num(month.sets)}세트`} />
            <Stat label="친 글자 수" value={`${num(month.keys)}타`} />
            <Stat label="연습 시간" value={`${num(month.minutes)}분`} />
            <Stat label="평균 타수" value={month.sets ? `${month.avgCpm}타` : '-'} tone="sky" />
            <Stat label="최고 타수" value={month.sets ? `${month.bestCpm}타` : '-'} tone="purple" />
            <Stat label="정확도" value={month.sets ? `${month.avgAcc}%` : '-'} />
          </div>

          <div className="grid lg:grid-cols-2 gap-3">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
              <div className="text-xs font-black text-slate-700 mb-2">
                📅 {ym.y}년 {ym.m}월 연습 달력 <span className="font-bold text-slate-400">(칸 안 숫자 = 끝낸 세트 수)</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK.map((w) => (
                  <div key={w} className="text-[10px] font-black text-slate-400">
                    {w}
                  </div>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />;
                  const k = `${monthKey(ym.y, ym.m)}-${String(d).padStart(2, '0')}`;
                  const st = days[k];
                  const future = k > todayKey;
                  return (
                    <div
                      key={k}
                      title={dayActive(st) ? `${ym.m}월 ${d}일 · ${st!.n}세트 · ${num(dayKeys(st))}타 · ${Math.round(daySeconds(st) / 60)}분${st!.n ? ` · 평균 ${Math.round(st!.cpmSum / st!.n)}타` : ''}` : `${ym.m}월 ${d}일 · 연습 안 함`}
                      className={`rounded-lg border py-1 ${future ? 'bg-white text-slate-300 border-slate-100' : heat(st)} ${k === todayKey ? 'ring-2 ring-pink-400' : ''}`}
                    >
                      <div className="text-[10px] font-bold leading-none">{d}</div>
                      <div className="text-[11px] font-black leading-tight">{dayActive(st) ? st!.n || '·' : future ? '' : '–'}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-2 text-[10px] font-bold text-slate-500 flex-wrap">
                <span className="px-1.5 rounded bg-slate-100 border border-slate-200">– 안 함</span>
                <span className="px-1.5 rounded bg-amber-100 border border-amber-300 text-amber-800">· 치다가 그만둠</span>
                <span className="px-1.5 rounded bg-emerald-200 border border-emerald-300">1~2세트</span>
                <span className="px-1.5 rounded bg-emerald-400 text-white">3~5세트</span>
                <span className="px-1.5 rounded bg-emerald-600 text-white">6세트 이상</span>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-slate-200 bg-white p-3 space-y-3">
              <div>
                <div className="text-xs font-black text-slate-700 mb-1.5">📋 진도 (끝낸 코스) · 전체 {a?.questPercent || 0}%</div>
                <div className="space-y-1.5">
                  {(
                    [
                      ['자리 연습', 'key-practice'],
                      ['낱말 연습', 'word-practice'],
                      ['짧은 글', 'sentence-practice'],
                      ['긴 글', 'long-practice'],
                    ] as const
                  ).map(([label, m]) => {
                    const q = a?.quest?.[m];
                    const pct = q && q.total ? Math.round((q.done / q.total) * 100) : 0;
                    return (
                      <div key={m} className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                        <span className="w-16 shrink-0">{label}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-pink-400'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-16 text-right tabular-nums">
                          {q?.done || 0} / {q?.total || 0}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-xs font-black text-slate-700 mb-1.5">🧩 {ym.m}월에 연습한 종류</div>
                <div className="flex flex-wrap gap-1.5">
                  {month.sets === 0 && <span className="text-[11px] font-bold text-slate-400">끝낸 세트가 없어요.</span>}
                  {Object.entries(month.byMode)
                    .filter(([, c]) => c > 0)
                    .sort((x, y) => y[1] - x[1])
                    .map(([m, c]) => (
                      <span key={m} className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-black">
                        {MODE_NAME[m] || m} {c}세트
                      </span>
                    ))}
                </div>
              </div>
              {a?.points != null && <div className="text-[11px] font-bold text-slate-600">💰 보유 포인트: {num(a.points)} P</div>}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
            <div className="text-xs font-black text-slate-700 mb-2">
              📝 {monthRecords.length ? `${ym.m}월 연습 기록` : '최근 연습 기록'} ({records.length}개)
              <span className="font-bold text-slate-400"> · 최근 100개까지 보관돼요</span>
            </div>
            {records.length === 0 ? (
              <p className="py-6 text-center text-xs font-bold text-slate-400">끝까지 친 연습 기록이 아직 없어요.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] font-bold text-slate-700">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-200">
                      <th className="py-1 pr-2">날짜</th>
                      <th className="py-1 pr-2">연습</th>
                      <th className="py-1 pr-2 text-right">타수</th>
                      <th className="py-1 pr-2 text-right">정확도</th>
                      <th className="py-1 pr-2 text-right">오타</th>
                      <th className="py-1 pr-2 text-right">글자 수</th>
                      <th className="py-1 text-right">시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id || r.timestamp} className="border-b border-slate-100">
                        <td className="py-1 pr-2 whitespace-nowrap text-slate-500">{r.dateStr}</td>
                        <td className="py-1 pr-2">{r.modeTitle || r.stageTitle}</td>
                        <td className="py-1 pr-2 text-right text-sky-700 tabular-nums">{r.cpm}</td>
                        <td className="py-1 pr-2 text-right text-teal-700 tabular-nums">{r.accuracy}%</td>
                        <td className="py-1 pr-2 text-right text-rose-500 tabular-nums">{r.errorCount || 0}</td>
                        <td className="py-1 pr-2 text-right tabular-nums">{num(r.totalKeystrokes || 0)}</td>
                        <td className="py-1 text-right tabular-nums">{Math.floor((r.elapsedSeconds || 0) / 60)}분 {(r.elapsedSeconds || 0) % 60}초</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ 전체 학생 표 ------------------------------ */
  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden" data-testid="activity-panel">
      <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap text-xs font-black">
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300" data-testid="activity-today-count">
            오늘 연습 {totals.today} / {totals.all}명
          </span>
          <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">최근 7일 {totals.week}명</span>
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
            {ym.m}월 {totals.month}명
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <MonthNav ym={ym} onMove={moveMonth} canNext={!isThisMonth} />
          <button type="button" onClick={downloadCsv} className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-black flex items-center gap-1 cursor-pointer hover:bg-slate-50" title="지금 보이는 표를 엑셀에서 열 수 있는 파일로 저장">
            <Download className="w-3.5 h-3.5" /> 엑셀 저장
          </button>
          <button type="button" onClick={() => void load()} className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1 cursor-pointer">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 새로고침
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap shrink-0 text-xs font-bold">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="이름 찾기" className="pl-8 pr-2 py-1.5 rounded-xl border border-slate-300 bg-white w-36" />
        </div>
        <select value={grade} onChange={(e) => setGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="px-2 py-1.5 rounded-xl border border-slate-300 bg-white">
          <option value="all">전체 학년</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="px-2 py-1.5 rounded-xl border border-slate-300 bg-white">
          <option value="today">오늘 많이 친 순</option>
          <option value="month">{ym.m}월 연습일 많은 순</option>
          <option value="cpm">{ym.m}월 평균 타수 순</option>
          <option value="progress">진도 순</option>
          <option value="last">최근에 친 순</option>
          <option value="name">이름 순</option>
        </select>
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 cursor-pointer select-none">
          <input type="checkbox" checked={onlyIdleToday} onChange={(e) => setOnlyIdleToday(e.target.checked)} />
          오늘 안 친 학생만
        </label>
        <span className="text-[11px] text-slate-400 ml-auto">{loadedAt ? `${new Date(loadedAt).toLocaleTimeString('ko-KR')} 기준 · 1분마다 자동 갱신` : ''}</span>
      </div>

      {error && <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shrink-0">❌ {error}</div>}
      {!fromServer && !error && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shrink-0">
          미리보기에는 서버가 없어서 이 컴퓨터에서 연습한 기록만 보여요. 실제 사이트에서는 모든 학생의 기록이 보여요.
        </div>
      )}

      <div className="flex-1 overflow-auto border-2 border-slate-200 rounded-2xl bg-white">
        <table className="w-full text-xs font-bold text-slate-700 min-w-[880px]">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-left text-[11px] text-slate-500 border-b-2 border-slate-200">
              <th className="py-2 pl-3 pr-2">학생</th>
              <th className="py-2 pr-2">오늘</th>
              <th className="py-2 pr-2">
                최근 7일
                <div className="flex gap-0.5 mt-0.5 font-bold text-[9px] text-slate-400">
                  {week.map((k) => (
                    <span key={k} className="w-4 text-center">
                      {WEEK[keyToDate(k).getDay()]}
                    </span>
                  ))}
                </div>
              </th>
              <th className="py-2 pr-2">{ym.m}월 연습량</th>
              <th className="py-2 pr-2">{ym.m}월 타수</th>
              <th className="py-2 pr-2">진도</th>
              <th className="py-2 pr-2 whitespace-nowrap">마지막 연습</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  {loading ? '불러오는 중…' : onlyIdleToday ? '오늘은 모든 학생이 연습했어요! 🎉' : '표시할 학생이 없어요.'}
                </td>
              </tr>
            )}
            {shown.map((r) => {
              const q = r.a?.quest;
              return (
                <tr key={r.s.id} className="border-b border-slate-100 hover:bg-pink-50/40 cursor-pointer" onClick={() => setSelectedId(r.s.id)} data-testid="activity-row">
                  <td className="py-2 pl-3 pr-2 whitespace-nowrap">
                    <span className="text-sm font-black text-slate-900">{r.s.name}</span>
                    {r.s.grade ? <span className="ml-1 text-[10px] text-slate-400">{r.s.grade}학년</span> : null}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    {r.activeToday ? (
                      <span className={`px-2 py-0.5 rounded-full border ${r.today!.n ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'}`}>
                        {r.today!.n ? `✅ ${r.today!.n}세트` : '✏️ 연습 중'} · {num(dayKeys(r.today))}타 · {Math.max(1, Math.round(daySeconds(r.today) / 60))}분
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">안 함</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex gap-0.5">
                      {week.map((k) => {
                        const d = r.days[k];
                        return (
                          <span
                            key={k}
                            title={`${Number(k.slice(5, 7))}월 ${Number(k.slice(8))}일 · ${dayActive(d) ? `${d!.n}세트 · ${num(dayKeys(d))}타` : '안 함'}`}
                            className={`w-4 h-4 rounded-[5px] border text-[9px] leading-[14px] text-center font-black ${heat(d)}`}
                          >
                            {dayActive(d) ? d!.n || '·' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    {r.month.activeDays ? (
                      <>
                        <span className="text-slate-900 font-black">{r.month.activeDays}일</span>
                        <span className="text-slate-500">
                          {' '}
                          · {num(r.month.sets)}세트 · {num(r.month.keys)}타 · {num(r.month.minutes)}분
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-300">–</span>
                    )}
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    {r.month.sets ? (
                      <>
                        <span className="text-sky-700 font-black">평균 {r.month.avgCpm}</span>
                        <span className="text-slate-500">
                          {' '}
                          · 최고 {r.month.bestCpm} · {r.month.avgAcc}%
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-300">–</span>
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-14 h-2 rounded-full bg-slate-100 overflow-hidden shrink-0">
                        <div className="h-full bg-pink-400 rounded-full" style={{ width: `${r.a?.questPercent || 0}%` }} />
                      </div>
                      <span className="tabular-nums text-slate-900 font-black">{r.a?.questPercent || 0}%</span>
                    </div>
                    <div className="text-[10px] text-slate-400 whitespace-nowrap">
                      자리 {q?.['key-practice'].done || 0}/{q?.['key-practice'].total || 0} · 낱말 {q?.['word-practice'].done || 0}/{q?.['word-practice'].total || 0} · 짧은 글 {q?.['sentence-practice'].done || 0}/
                      {q?.['sentence-practice'].total || 0} · 긴 글 {q?.['long-practice'].done || 0}/{q?.['long-practice'].total || 0}
                    </div>
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap text-slate-500">{agoText(r.a?.lastAt || 0, now.getTime())}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-right">
                    <button type="button" className="px-2 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 font-black cursor-pointer hover:bg-sky-200">
                      자세히
                    </button>
                    {onOpenReport && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReport(r.s);
                        }}
                        className="ml-1 px-2 py-1 rounded-lg bg-pink-100 text-pink-800 border border-pink-200 font-black cursor-pointer hover:bg-pink-200"
                      >
                        성적표
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] font-bold text-slate-400 shrink-0">
        세트 = 한 코스를 끝까지 친 횟수. 끝까지 못 쳐도 타자 연습 화면에서 실제로 친 글자 수와 시간은 함께 셉니다. 학생이 치는 동안 약 15초마다 서버에 저장돼요.
      </p>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: 'emerald' | 'sky' | 'purple' }> = ({ label, value, tone }) => (
  <div
    className={`rounded-2xl border-2 px-2 py-2 ${
      tone === 'emerald' ? 'bg-emerald-50 border-emerald-200' : tone === 'sky' ? 'bg-sky-50 border-sky-200' : tone === 'purple' ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'
    }`}
  >
    <div className="text-[10px] font-bold text-slate-500">{label}</div>
    <div className="text-sm font-black text-slate-900 tabular-nums">{value}</div>
  </div>
);

const MonthNav: React.FC<{ ym: { y: number; m: number }; onMove: (d: number) => void; canNext: boolean }> = ({ ym, onMove, canNext }) => (
  <div className="flex items-center rounded-xl border border-slate-300 bg-white text-xs font-black text-slate-800">
    <button type="button" onClick={() => onMove(-1)} className="px-1.5 py-1.5 cursor-pointer hover:bg-slate-100 rounded-l-xl" aria-label="이전 달">
      <ChevronLeft className="w-4 h-4" />
    </button>
    <span className="px-1.5 tabular-nums" data-testid="activity-month">
      {ym.y}년 {ym.m}월
    </span>
    <button type="button" onClick={() => onMove(1)} disabled={!canNext} className="px-1.5 py-1.5 cursor-pointer hover:bg-slate-100 rounded-r-xl disabled:opacity-30 disabled:cursor-default" aria-label="다음 달">
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);
