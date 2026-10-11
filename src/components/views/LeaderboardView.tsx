import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../../types';
import { Pixel, TvBot } from './TapangHome';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  onClearLeaderboard?: () => void;
  onStartSentencePractice: () => void;
}

/* neon pixel trophies (1 gold, 2 cyan, 3 magenta) */
const CUP = [
  'KKKKKKKKKKKKKK',
  'KHHLHHHHHHHHHK',
  'HKHLHHNNHHHHKH',
  'HKHLHHNNHHHHKH',
  'HKHHLHNNHHHHKH',
  '.KHHLHNNHHHHK.',
  '..KHHHNNHHHK..',
  '...KKHHHHKK...',
  '.....KHHK.....',
  '.....KHHK.....',
  '...KHHHHHHK...',
  '..KKKKKKKKKK..',
];
const cupPal = (h: string, l: string, k: string) => ({ K: k, H: h, L: l, N: '#0b0e2a' });
const CUPS = [cupPal('#ffd700', '#fff59d', '#7a4a00'), cupPal('#6ff6ff', '#e0fdff', '#0b3a4a'), cupPal('#ff5ad6', '#ffd0f4', '#5a0a48')];

/* small pixel racers standing on the podium (original sprites) */
const RACER = [
  '....KKKK....',
  '...KHHHHK...',
  '..KHVVVVHK..',
  '..KHVCCVHK..',
  '..KHHHHHHK..',
  '...KBBBBK...',
  '.KKBBSSBBKK.',
  'KBBKBSSBKBBK',
  '.KK.BBBB.KK.',
  '....BKKB....',
  '...KBK.KBK..',
  '...KKK.KKK..',
];
const RACER_PALS = [
  { K: '#1b1030', H: '#ffd700', V: '#29b6f6', C: '#e0fdff', B: '#d99a00', S: '#ff4757' },
  { K: '#0b1a1a', H: '#2e4a5a', V: '#43e08f', C: '#bfffe0', B: '#1f3a44', S: '#43e08f' },
  { K: '#1a1030', H: '#9aa7b8', V: '#b36bff', C: '#f0e0ff', B: '#6b7690', S: '#ff5ad6' },
];

const GRADES: Array<number | 'all'> = ['all', 1, 2, 3, 4, 5, 6];

const monthLabel = (m: string) => `${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월`;
const thisMonth = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 7);

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ entries, onStartSentencePractice }) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  // 지난달 순위는 보관함에서 볼 수 있음 ('' = 이번 달)
  const [month, setMonth] = useState<string>('');
  const [months, setMonths] = useState<string[]>([]);
  const [archived, setArchived] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    let alive = true;
    const q = month ? `?month=${encodeURIComponent(month)}` : '';
    fetch(`/api/leaderboard${q}`, { cache: 'no-store' })
      .then((r) => ((r.headers.get('content-type') || '').includes('application/json') ? r.json() : null))
      .then((j) => {
        if (!alive || !j?.success) return;
        if (Array.isArray(j.months)) setMonths(j.months.filter((m: string) => m !== j.currentMonth));
        setArchived(month ? (Array.isArray(j.leaderboard) ? j.leaderboard : []) : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [month]);

  const source = month ? archived || [] : entries;

  // 짧은 글 기록만, 한 학생은 가장 좋은 기록 하나만 (같은 학생이 순위를 다 차지하지 않게)
  const bestByStudent = new Map<string, LeaderboardEntry>();
  for (const e of source) {
    if (!(e.mode === 'sentence' || !e.mode)) continue;
    const who = e.userId || e.userName;
    const prev = bestByStudent.get(who);
    if (!prev || (e.cpm || 0) > (prev.cpm || 0) || ((e.cpm || 0) === (prev.cpm || 0) && (e.accuracy || 0) > (prev.accuracy || 0))) bestByStudent.set(who, e);
  }
  const ranked = [...bestByStudent.values()]
    .filter((e) => selectedGrade === 'all' || e.grade === selectedGrade)
    .sort((a, b) => (b.cpm || 0) - (a.cpm || 0) || (b.accuracy || 0) - (a.accuracy || 0));

  const podium = [ranked[1], ranked[0], ranked[2]]; // 2 · 1 · 3
  const rest = ranked.slice(3, 30);
  const fmtTime = (sec?: number) => {
    if (!sec || sec <= 0) return '-';
    const m = Math.floor(sec / 60);
    const s2 = sec % 60;
    return m > 0 ? `${m}분 ${String(s2).padStart(2, '0')}초` : `${s2}초`;
  };
  const placeOf = [2, 1, 3];

  return (
    <section className="cy-rank">
      <div className="cy-grid-floor" />

      <header className="cy-title">
        <span className="cy-star">★</span>
        사이버 랭킹전 <small>(CYBER RANKING)</small>
        <span className="cy-star">★</span>
      </header>

      <nav className="cy-tabs" aria-label="학년 선택">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            className={`cy-tab ${selectedGrade === g ? 'is-on' : ''}`}
            onClick={() => setSelectedGrade(g)}
          >
            [{g === 'all' ? '전체' : `${g}학년`}]
          </button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center justify-center gap-2 -mt-1 mb-2 text-[12px] font-black" style={{ position: 'relative', zIndex: 2 }}>
        <span style={{ color: '#9fe8ff' }}>📅 {month ? `${monthLabel(month)} 기록 (보관함)` : `${monthLabel(thisMonth())} 명예의 전당 · 매달 1일 새로 시작`}</span>
        {months.length > 0 && (
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-900 text-cyan-100 border border-cyan-400/60 cursor-pointer"
            aria-label="달 고르기"
            data-testid="lb-month"
          >
            <option value="">이번 달</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* podium */}
      <div className="cy-podium">
        {podium.map((p, i) => {
          const place = placeOf[i];
          return (
            <div key={place} className={`cy-step cy-step--${place}`}>
              <div className="cy-step-top">
                <span className="cy-cupbox">
                  <Pixel grid={CUP} pal={CUPS[place - 1]} size={place === 1 ? 84 : 64} className="cy-cup" />
                  <span className="cy-cup-num">{place}</span>
                </span>
                {p ? (
                  <Pixel grid={RACER} pal={RACER_PALS[place - 1]} size={place === 1 ? 58 : 48} className="cy-racer" />
                ) : null}
              </div>
              <div className="cy-plate">
                {p ? (
                  <>
                    <b>
                      {p.userAvatar ? `${p.userAvatar} ` : ''}
                      {p.userName}
                    </b>
                    <span>
                      {p.cpm}타 · 정확도 {p.accuracy}%
                    </span>
                    <span>⏱ {fmtTime(p.elapsedSeconds)}</span>
                  </>
                ) : (
                  <span className="cy-empty">- 도전자 대기 -</span>
                )}
              </div>
              <div className="cy-base">
                <span className="cy-base-light" />
              </div>
            </div>
          );
        })}
      </div>

      {/* table 4th ~ 10th */}
      <div className="cy-board">
        <div className="cy-table-wrap">
          <table className="cy-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student Name</th>
                <th>타수 (CPM)</th>
                <th>정확도</th>
                <th>걸린 시간</th>
                <th className="cy-hide-sm">학년</th>
              </tr>
            </thead>
            <tbody>
              {rest.length > 0 ? (
                rest.map((e, i) => (
                  <tr key={e.id}>
                    <td>{i + 4}th</td>
                    <td className="cy-name">
                      {e.userAvatar ? `${e.userAvatar} ` : ''}
                      {e.userName}
                    </td>
                    <td className="cy-num">{e.cpm}</td>
                    <td className="cy-acc">{e.accuracy}%</td>
                    <td className="cy-num">{fmtTime(e.elapsedSeconds)}</td>
                    <td className="cy-hide-sm">{e.grade ? `${e.grade}학년` : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="cy-none">
                    {ranked.length === 0 ? (month ? '이 달에는 기록이 없어요.' : '이번 달 기록이 아직 없어요. 첫 번째 챔피언이 되어 보세요!') : '4위부터는 아직 비어 있어요.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cy-board-foot">
          <button type="button" className="cy-coin" onClick={onStartSentencePractice}>
            ▶ INSERT COIN · 짧은 글 도전
          </button>
        </div>

        <div className="cy-bot">
          <TvBot size={78} bubble="최고 기록에 도전!" bubbleSide="top" />
        </div>
      </div>
    </section>
  );
};
