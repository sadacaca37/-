import React, { useState } from 'react';
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

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ entries, onStartSentencePractice }) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');

  // Only sentence-practice records count; entries without a grade get a stable 1~6 grade
  const ranked = entries
    .filter((e) => e.mode === 'sentence' || !e.mode)
    .map((e, index) => ({ ...e, grade: e.grade || (index % 6) + 1 }))
    .filter((e) => selectedGrade === 'all' || e.grade === selectedGrade)
    .sort((a, b) => b.cpm - a.cpm);

  const podium = [ranked[1], ranked[0], ranked[2]]; // 2 · 1 · 3
  const rest = ranked.slice(3, 10);
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
                      {p.cpm} CPM · {p.accuracy}%
                    </span>
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
                <th>Speed (CPM)</th>
                <th>Accuracy (%)</th>
                <th className="cy-hide-sm">Grade</th>
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
                    <td className="cy-hide-sm">{e.grade}학년</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="cy-none">
                    {ranked.length === 0 ? '아직 기록이 없어요. 첫 번째 챔피언이 되어 보세요!' : '4위부터는 아직 비어 있어요.'}
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
