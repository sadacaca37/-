import React, { useEffect, useMemo, useState } from 'react';
import { AppMode, UserSession, PracticeHistoryRecord } from '../../types';
import { soundManager } from '../../utils/sound';
import { pointsManager } from '../../utils/pointsManager';

/* ================================================================== */
/*  Pixel sprite helper                                                 */
/* ================================================================== */
export const Pixel: React.FC<{
  grid: string[];
  pal: Record<string, string>;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}> = ({ grid, pal, size, className, style }) => {
  const w = Math.max(...grid.map((r) => r.length));
  return (
    <svg
      viewBox={`0 0 ${w} ${grid.length}`}
      width={size}
      height={(size * grid.length) / w}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {grid.flatMap((row, y) =>
        row.split('').map((ch, x) =>
          pal[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1.03} height={1.03} fill={pal[ch]} /> : null,
        ),
      )}
    </svg>
  );
};

/* ---------- sprites ---------- */
/* 파팡 (Typong) – retro CRT-TV robot */
const TV_BOT = [
  '....Y..........Y......',
  '.....K........K.......',
  '......K......K........',
  '..KKKKKKKKKKKKKKKKKK..',
  '.KLLLLLLLLLLLLLLLLLgK.',
  '.KLKKKKKKKKKKKKKKKLgK.',
  '.KLKSSSSSSSSSSSSSKLgK.',
  '.KLKSSCCSSSSSSCCSKLgK.',
  '.KLKSSCCSSSSSSCCSKLgK.',
  '.KLKSPSSSSSSSSSSPKLgK.',
  '.KLKSSSCSSSSSSCSSKLgK.',
  '.KLKSSSSCCCCCCSSSKLgK.',
  '.KLKSSSSSSSSSSSSSKLgK.',
  '.KLKKKKKKKKKKKKKKKLgK.',
  '.KLLLLLLLLLLLLOLRLLgK.',
  '.KggggggggggggggggggK.',
  '..KKKKKKKKKKKKKKKKKK..',
  '.....KBBBBBBBBBBBK....',
  '..KK.KBTTTTTTTTTBK.KK.',
  '.KGGKKBTTTTTTTTTBKKGGK',
  '.KGGK.KBBBBBBBBBK.KGGK',
  '..KK..KBBBBBBBBBK..KK.',
  '......KBBK...KBBK.....',
  '.....KKKKK...KKKKK....',
];
const TV_PAL = {
  K: '#1b2340',
  L: '#dfe6ef',
  g: '#9aa7b8',
  S: '#0d2a40',
  C: '#6ff6ff',
  P: '#ff8ab3',
  Y: '#ffca28',
  O: '#ff9f1c',
  R: '#ff5470',
  B: '#b9c5d3',
  G: '#dfe6ef',
  T: '#f4e3b5',
};

const COIN = ['.KKKK.', 'KYYLYK', 'KYLYDK', 'KYLYDK', 'KYYDDK', '.KKKK.'];
const COIN_PAL = { K: '#8a5a00', Y: '#ffca28', L: '#fff59d', D: '#f0a500' };
const STAR = ['...K...', '..KYK..', 'KKKYKKK', 'KYYYYYK', '.KYYYK.', '.KYKYK.', 'KK...KK'];
const STAR_PAL = { K: '#b56b00', Y: '#ffd83a' };
const HEART = ['.KK.KK.', 'KRRKRRK', 'KRWRRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...'];
const HEART_PAL = { K: '#5a0a1e', R: '#ff3b5c', W: '#ffc2cf' };
const TROPHY = [
  'KKKKKKKKKKKK',
  'KYYLYYYYYYYK',
  'YKYLYYYYYYKY',
  'YKYLYYYYYYKY',
  '.KYYLYYYYYK.',
  '..KYYYYYYK..',
  '...KKYYKK...',
  '....KYYK....',
  '...KYYYYK...',
  '..KBBBBBBK..',
  '..KKKKKKKK..',
];
const TROPHY_PAL = { K: '#7a4a00', Y: '#ffca28', L: '#fff59d', B: '#8d5524' };
const BUSH = ['..KKKK..', '.KGGgGK.', 'KGGGGGgK', 'KGgGGGGK', 'KGGGGgGK', '.KKKKKK.'];
const BUSH_PAL = { K: '#1f5a22', G: '#3fae4a', g: '#6fd26b' };
const FLOWER = ['.P.', 'PYP', '.P.', '.G.', 'GG.'];


/* ---------- unified pixel icon set (same outline + palette) ---------- */
export const PIXEL_ICONS: Record<string, { grid: string[]; pal: Record<string, string> }> = {
  keyboard: {
    grid: ['............', '.KKKKKKKKKK.', 'KGGGGGGGGGGK', 'KGWGWGWGWGGK', 'KGGGGGGGGGGK', 'KGGWGWGWGWGK', 'KGGGGGGGGGGK', 'KGWWWWWWWGGK', 'KGGGGGGGGGGK', '.KKKKKKKKKK.'],
    pal: { K: '#1b2340', G: '#9aa7b8', W: '#ffffff' },
  },
  bomb: {
    grid: ['.......YR...', '......Y.....', '.....KK.....', '...KKKKKK...', '..KDDDDDDK..', '.KDLDDDDDDK.', '.KDLDDDDDDK.', '.KDDDDDDDDK.', '.KDDDDDDDDK.', '..KDDDDDDK..', '...KKKKKK...'],
    pal: { K: '#1b2340', D: '#3a3f55', L: '#8a90a8', Y: '#ffd700', R: '#ff4757' },
  },
  sneaker: {
    grid: ['............', '..R.........', '.RO.........', 'ROY..KKKK...', '.RO.KWWWWK..', '..RKWWBWWWK.', '...KWWBWWWWK', '..KWWWWWWWWK', '.KRRRRRRRRRK', '.KKKKKKKKKKK'],
    pal: { K: '#1b2340', R: '#ff4757', O: '#ff9f1c', Y: '#ffd700', W: '#ffffff', B: '#38b6ff' },
  },
  scroll: {
    grid: ['.........QQ.', '........QQ..', '.KKKKKKKQK..', 'KPPPPPPQPPK.', '.KPLLLLQLPK.', '.KPPPPQPPPK.', '.KPLLLLLLPK.', '.KPPPPPPPPK.', '.KPLLLLLLPK.', 'KPPPPPPPPPPK', '.KKKKKKKKKK.'],
    pal: { K: '#5a3417', P: '#f6e7c1', L: '#b58a5a', Q: '#8a6cff' },
  },
  globe: {
    grid: ['...Y.Y.Y....', '...YYYYY....', '..KKKKKKK...', '.KBBGGBBBK..', 'KBGGGGBBBBK.', 'KBBGGBBGGBK.', 'KBBBBBGGGBK.', 'KBGBBBBGBBK.', '.KBGGBBBBK..', '..KKKKKKK...'],
    pal: { K: '#1b2340', B: '#38b6ff', G: '#78e08f', Y: '#ffd700' },
  },
  code: {
    grid: ['.KKKKKKKKKKK.', 'KBBBBBBBBBBBK', 'KBWWBBBBBBBBK', 'KBBBBBBBBBBBK', 'KBBYBBBBBYBBK', 'KBYBBBBBBBYBK', 'KYBBBWWBBBBYK', 'KBYBBBBBBBYBK', 'KBBYBBBBBYBBK', 'KBBBBBBBBBBBK', '.KKKKKKKKKKK.'],
    pal: { K: '#1b2340', B: '#16204a', W: '#6ff6ff', Y: '#ffd700' },
  },
  crown: {
    grid: ['.R...RR...R.', '.Y...YY...Y.', '.YY.YYYY.YY.', 'YYYYYYYYYYYY', 'YLYYYYYYYYLY', 'YYYBYYYYBYYY', 'YYYYYYYYYYYY', 'KKKKKKKKKKKK'],
    pal: { K: '#7a4a00', Y: '#ffd700', L: '#fff59d', R: '#ff4757', B: '#38b6ff' },
  },
  music: {
    grid: ['.....KKKKKKK', '.....KPPPPPK', '.....KKKKKPK', '.....K....PK', '.....K....PK', '.....K....PK', '..KKKK..KKPK', '.KPPPK.KPPPK', 'KPPPPK.KPPPK', '.KPPK...KPK.', '..KK.....K..'],
    pal: { K: '#5a0a48', P: '#ff6bb5' },
  },
  trophy: { grid: TROPHY, pal: TROPHY_PAL },
  coin: { grid: COIN, pal: COIN_PAL },
  bag: {
    grid: ['....KKKK....', '...K....K...', '..KKKKKKKK..', '.KBBBBBBBBK.', 'KBBBBYYBBBBK', 'KBBBBYYBBBBK', 'KBBBBBBBBBBK', 'KBBBBBBBBBBK', '.KBBBBBBBBK.', '..KKKKKKKK..'],
    pal: { K: '#3d220d', B: '#b8783b', Y: '#ffd700' },
  },
};
export const PixelIcon: React.FC<{ name: keyof typeof PIXEL_ICONS | string; size?: number; className?: string }> = ({ name, size = 26, className }) => {
  const ic = PIXEL_ICONS[name];
  return ic ? <Pixel grid={ic.grid} pal={ic.pal} size={size} className={className} /> : null;
};

/* 파팡 robot with optional name plate + speech bubble */
export const TvBot: React.FC<{ size?: number; bubble?: string; bubbleSide?: 'left' | 'right' | 'top'; className?: string }> = ({
  size = 150,
  bubble,
  bubbleSide = 'top',
  className = '',
}) => (
  <div className={`tp-bot ${className}`} style={{ width: size }}>
    {bubble && <div className={`tp-bubble tp-bubble--${bubbleSide}`}>{bubble}</div>}
    <div className="relative">
      <Pixel grid={TV_BOT} pal={TV_PAL} size={size} />
      <span className="tp-bot-plate" style={{ fontSize: Math.max(8, size * 0.075) }}>
        파팡
      </span>
    </div>
  </div>
);

/* ================================================================== */
/*  Data                                                                */
/* ================================================================== */
interface MapStop {
  mode: AppMode;
  label: string;
  name: string;
  icon: string;
  goal: number;
  /** desktop position (% of field) – bottom of the post */
  x: number;
  y: number;
  /** mobile position */
  mx: number;
  my: number;
  kind?: 'arch' | 'special';
}
const MAP_STOPS: MapStop[] = [
  { mode: 'key-practice', label: '1 STAGE', name: '자리 연습', icon: 'keyboard', goal: 10, x: 26, y: 79, mx: 70, my: 15 },
  { mode: 'word-practice', label: '2 STAGE', name: '낱말 연습', icon: 'bomb', goal: 10, x: 41, y: 76, mx: 30, my: 31 },
  { mode: 'sentence-practice', label: '3 STAGE', name: '짧은 글', icon: 'sneaker', goal: 10, x: 43, y: 36, mx: 72, my: 47 },
  { mode: 'long-practice', label: '4 STAGE', name: '긴 글 연습', icon: 'scroll', goal: 5, x: 66, y: 45, mx: 30, my: 63 },
  { mode: 'knowledge-hub', label: 'SPECIAL', name: '팡팡 지식 타자', icon: 'globe', goal: 3, x: 71, y: 84, mx: 72, my: 78, kind: 'special' },
  { mode: 'leaderboard', label: '5 STAGE', name: '명예의 전당', icon: 'trophy', goal: 1, x: 87.5, y: 42, mx: 44, my: 96, kind: 'arch' },
];
const DESK_PATH = 'M-3 87 L 37 87 C 44 87, 44 79, 42 74 C 40 69, 34 67, 34 58 L 34 49 C 34 44, 36 43, 42 43 L 52 43 C 57 43, 58 53, 63 54 L 84 54 C 88 54, 88 50, 88 45';
const MOB_PATH = 'M-3 5 L 50 5 C 64 5, 64 17, 50 20 L 40 22 C 20 26, 22 38, 40 41 L 58 43 C 76 47, 76 56, 58 59 L 44 62 C 24 66, 26 79, 44 82 L 46 92';

const CLOUD = [
  '..............KKKK..........',
  '...........KKKWWWWKK........',
  '..........KWWWWWWWWWK.......',
  '.....KKKK.KWWWWWWWWWWK......',
  '....KWWWWKWWWWWWWWWWWWKKK...',
  '...KWWWWWWWWWWWWWWWWWWWWWK..',
  '..KWWWWWWWWWWWWWWWWWWWWWWWK.',
  '.KWWWWWWWWWWWWWWWWWWWWWWWWWK',
  'KWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'KSSWWWWWWWWSSSWWWWWWWWSSSWWW',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSS',
];
const CLOUD_PAL = { K: '#bfe6ff', W: '#ffffff', S: '#dff2ff' };

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/* ================================================================== */
/*  Main                                                                */
/* ================================================================== */
interface Props {
  currentUser: UserSession | null;
  records: PracticeHistoryRecord[];
  onSelectMode: (mode: AppMode) => void;
  onOpenAuth: () => void;
  onOpenProfile?: (tab?: 'avatar' | 'account') => void;
}

export const TapangHome: React.FC<Props> = ({ currentUser, records, onSelectMode, onOpenAuth, onOpenProfile }) => {
  const [points, setPoints] = useState<number>(() => {
    try {
      return pointsManager.getPoints(currentUser?.id);
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    const refresh = () => {
      try {
        setPoints(pointsManager.getPoints(currentUser?.id));
      } catch {}
    };
    refresh();
    window.addEventListener('points-updated', refresh);
    window.addEventListener('typing-points-earned', refresh);
    return () => {
      window.removeEventListener('points-updated', refresh);
      window.removeEventListener('typing-points-earned', refresh);
    };
  }, [currentUser]);

  const stats = useMemo(() => {
    const byMode: Record<string, number> = {};
    records.forEach((r) => {
      const m = r.mode === 'transcription-challenge' ? 'long-practice' : r.mode;
      byMode[m] = (byMode[m] || 0) + 1;
    });
    const days = new Set(records.map((r) => dayKey(r.timestamp)));
    let streak = 0;
    const cur = new Date();
    if (!days.has(dayKey(cur.getTime()))) cur.setDate(cur.getDate() - 1);
    while (days.has(dayKey(cur.getTime()))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
    const total = records.length || currentUser?.totalPracticeCount || 0;
    const top = Math.max(currentUser?.highestCpm || 0, ...records.map((r) => r.cpm || 0), 0);
    const avg = records.length ? Math.round(records.reduce((a, r) => a + (r.cpm || 0), 0) / records.length) : 0;
    const acc = records.length ? records.reduce((a, r) => a + (r.accuracy || 0), 0) / records.length : 100;
    const level = Math.floor(total / 5) + 1;
    const recent = [...records].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
    return { byMode, streak, level, top, avg, acc, recent };
  }, [records, currentUser]);

  const go = (mode: AppMode) => {
    try {
      soundManager.play('click');
    } catch {}
    onSelectMode(mode);
  };

  const playerName = currentUser ? currentUser.name : 'PLAYER 1';
  const playerTitle = currentUser?.levelTitle;

  return (
    <div className="tp-home space-y-12">
      {/* ================= QUEST MAP (main) ================= */}
      <section className="qm">
        <Pixel grid={CLOUD} pal={CLOUD_PAL} size={260} className="qm-cloud qm-cloud--1" />
        <Pixel grid={CLOUD} pal={CLOUD_PAL} size={200} className="qm-cloud qm-cloud--2" />
        <Pixel grid={CLOUD} pal={CLOUD_PAL} size={240} className="qm-cloud qm-cloud--3" />
        <Pixel grid={CLOUD} pal={CLOUD_PAL} size={180} className="qm-cloud qm-cloud--4" />

        <div className="qm-title">
          <span className="qm-cap qm-cap--tl" />
          <span className="qm-cap qm-cap--tr" />
          <span className="qm-cap qm-cap--bl" />
          <span className="qm-cap qm-cap--br" />
          타자팡팡 퀘스트 맵!
        </div>
        <div className="qm-sub">★ 5단계 퀘스트 학습 로드맵 ★</div>

        <div className="qm-frame">
          <span className="qm-cap qm-cap--tl" />
          <span className="qm-cap qm-cap--tr" />
          <span className="qm-cap qm-cap--bl" />
          <span className="qm-cap qm-cap--br" />

          <div className="qm-field">
            <svg className="absolute inset-0 w-full h-full hidden sm:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={DESK_PATH} className="qm-path-edge" vectorEffect="non-scaling-stroke" />
              <path d={DESK_PATH} className="qm-path" vectorEffect="non-scaling-stroke" />
              <path d={DESK_PATH} className="qm-path-dots" vectorEffect="non-scaling-stroke" />
            </svg>
            <svg className="absolute inset-0 w-full h-full sm:hidden" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path d={MOB_PATH} className="qm-path-edge" vectorEffect="non-scaling-stroke" />
              <path d={MOB_PATH} className="qm-path" vectorEffect="non-scaling-stroke" />
              <path d={MOB_PATH} className="qm-path-dots" vectorEffect="non-scaling-stroke" />
            </svg>

            {/* flowers & bushes */}
            {[
              [5, 14, '#ff8ab3'], [9, 12, '#ffffff'], [12, 20, '#c38bff'], [6, 27, '#ff4757'], [15, 11, '#ffd700'],
              [50, 90, '#ffb38a'], [54, 84, '#ffffff'], [57, 92, '#ff8ab3'], [47, 94, '#ffffff'], [60, 86, '#ff4757'],
            ].map(([x, y, c], i) => (
              <Pixel key={`f${i}`} grid={FLOWER} pal={{ P: c as string, Y: '#ffe14a', G: '#2f8f2f' }} size={18} className="absolute qm-deco" style={{ left: `${x}%`, top: `${y}%` }} />
            ))}
            {[
              [16, 40, 46], [21, 36, 40], [91, 70, 46], [95, 66, 36],
            ].map(([x, y, sz], i) => (
              <Pixel key={`b${i}`} grid={BUSH} pal={BUSH_PAL} size={sz} className="absolute qm-deco hidden sm:block" style={{ left: `${x}%`, top: `${y}%` }} />
            ))}

            {/* stages */}
            {MAP_STOPS.map((s) => {
              const cleared = (stats.byMode[s.mode] || 0) >= s.goal;
              return (
                <button
                  key={s.mode}
                  type="button"
                  onClick={() => go(s.mode)}
                  className={`qm-stop ${s.kind ? `qm-stop--${s.kind}` : ''}`}
                  style={{ ['--x' as any]: `${s.x}%`, ['--y' as any]: `${s.y}%`, ['--mx' as any]: `${s.mx}%`, ['--my' as any]: `${s.my}%` }}
                  aria-label={`${s.label} ${s.name}`}
                >
                  <span className="qm-shadow" />
                  {s.kind === 'arch' ? (
                    <span className="qm-arch">
                      <span className="qm-arch-rays" />
                      <Pixel grid={TROPHY} pal={TROPHY_PAL} size={44} className="qm-arch-trophy" />
                      <span className="qm-pillar qm-pillar--l" />
                      <span className="qm-pillar qm-pillar--r" />
                    </span>
                  ) : (
                    <>
                      <span className="qm-post" />
                      {!s.kind && <span className="qm-flag" />}
                    </>
                  )}
                  <span className="qm-sign">
                    <span className="qm-sign-icon"><PixelIcon name={s.icon} size={26} /></span>
                    <span className="qm-sign-text">
                      <b>{s.label}:</b>
                      <span>{s.name}</span>
                    </span>
                    {cleared && <i className="qm-clear">CLEAR</i>}
                  </span>
                  {s.kind === 'special' && (
                    <>
                      <Pixel grid={STAR} pal={STAR_PAL} size={18} className="qm-spark qm-spark--1" />
                      <Pixel grid={STAR} pal={STAR_PAL} size={14} className="qm-spark qm-spark--2" />
                      <Pixel grid={STAR} pal={STAR_PAL} size={12} className="qm-spark qm-spark--3" />
                    </>
                  )}
                </button>
              );
            })}

            {/* 파팡 on tracks */}
            <div className="qm-bot">
              <div className="qm-bot-bubble">
                {currentUser ? `${currentUser.name}! ` : ''}차근차근 퀘스트를 깨고 전설의 타자 왕에 도전해봐!
              </div>
              <Pixel grid={TV_BOT} pal={TV_PAL} size={70} />
              <span className="qm-tracks" />
            </div>

            {/* coin pouch */}
            <button type="button" className="qm-pouch" onClick={() => (currentUser ? onOpenProfile?.('avatar') : onOpenAuth())}>
              <Pixel grid={COIN} pal={COIN_PAL} size={22} />
              <span className="qm-pouch-num">{points.toLocaleString()}</span>
              <span className="qm-pouch-bag"><PixelIcon name="bag" size={30} /></span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= SCORECARD (arcade cabinet) ================= */}
      <section className="tp-cabinet">
        <div className="tp-cabinet-screen">
          <div className="tp-scan" />
          <div className="relative z-10 px-4 sm:px-10 pt-8 pb-10">
            <h2 className="tp-score-title">
              <span className="tp-chev hidden sm:inline">»</span>
              <span className="tp-logo-a" data-text="타자팡팡">
                타자팡팡
              </span>{' '}
              <span className="tp-logo-b" data-text="기록 성적표">
                기록 성적표
              </span>
              <span className="tp-chev hidden sm:inline">«</span>
            </h2>

            <div className="tp-chains">
              <span />
              <span />
            </div>
            <button type="button" className="tp-plaque" onClick={() => (currentUser ? onOpenProfile?.('account') : onOpenAuth())}>
              <span className="tp-plaque-avatar">{currentUser?.avatar || '🙂'}</span>
              <span className="text-left">
                <span className="tp-plaque-name">
                  {playerName}
                  {playerTitle ? <small> ({playerTitle})</small> : null}
                </span>
                <span className="tp-plaque-pts">
                  {points.toLocaleString()} P
                  <span className="tp-coinstack">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Pixel key={i} grid={COIN} pal={COIN_PAL} size={22} style={{ marginLeft: i ? -12 : 0 }} />
                    ))}
                  </span>
                </span>
              </span>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mt-10">
              {[
                { icon: <Pixel grid={TROPHY} pal={TROPHY_PAL} size={40} />, label: 'Average Speed', val: String(stats.avg), unit: 'CPM', tone: 'cyan' },
                { icon: <Pixel grid={STAR} pal={STAR_PAL} size={46} />, label: 'Top Speed', val: String(stats.top), unit: 'CPM', tone: 'gold' },
                { icon: <Pixel grid={HEART} pal={HEART_PAL} size={40} />, label: 'Precision', val: stats.acc.toFixed(1), unit: '%', tone: 'cyan' },
              ].map((b) => (
                <div key={b.label} className={`tp-seg tp-seg--${b.tone}`}>
                  <span className="tp-seg-icon">{b.icon}</span>
                  <span className="tp-seg-label">{b.label}</span>
                  <span className="tp-seg-digits">
                    <span className="tp-seg-num">
                      <span className="tp-seg-ghost">{b.val.replace(/[0-9]/g, '8').padStart(4, '8')}</span>
                      <span className="tp-seg-val">{b.val}</span>
                    </span>
                    <small>{b.unit}</small>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-end gap-6 mt-8">
              <div className="tp-log">
                <div className="tp-log-row tp-log-head">
                  <span>Date</span>
                  <span>Sentence</span>
                  <span>CPM</span>
                  <span>Accuracy</span>
                </div>
                {(stats.recent.length ? stats.recent : [null, null, null]).map((r, i) => (
                  <div key={r ? r.id : i} className="tp-log-row">
                    <span>{r ? new Date(r.timestamp).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }).replace(/\. ?/g, '/').replace(/\/$/, '') : '--/--'}</span>
                    <span className="truncate">{r ? r.sampleText || r.modeTitle : '- - -'}</span>
                    <span>{r ? `${r.cpm}` : '---'}</span>
                    <span>{r ? `${r.accuracy}%` : '---'}</span>
                  </div>
                ))}
              </div>
              <div className="tp-thumbs">
                <TvBot size={120} bubble="👍" bubbleSide="top" />
              </div>
            </div>
          </div>
        </div>
        <div className="tp-cabinet-panel">
          <span className="tp-btn-r" />
          <span className="tp-btn-y" />
          <span className="tp-joy" />
          <span className="tp-btn-b" />
          <span className="tp-btn-g" />
        </div>
      </section>
    </div>
  );
};

/* ================================================================== */
/*  Frame for the existing dashboard blocks                             */
/* ================================================================== */
export const RetroFrame: React.FC<{
  variant: 'sky' | 'wood' | 'arcade' | 'grass';
  tag: string;
  title: string;
  children: React.ReactNode;
}> = ({ variant, tag, title, children }) => (
  <section className={`tp-frame tp-frame--${variant}`}>
    <div className="tp-frame-head">
      <span className="tp-frame-tag">{tag}</span>
      <span className="tp-frame-title">{title}</span>
    </div>
    <div className="tp-frame-inner">{children}</div>
  </section>
);

/* ================================================================== */
/*  Footer                                                              */
/* ================================================================== */
export const TapangFooter: React.FC<{ isMaster?: boolean; onOpenMaster?: () => void }> = ({ isMaster, onOpenMaster }) => (
  <footer className="mt-auto tp-footer">
    <div className="relative max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-center gap-6">
      <TvBot size={78} bubble="또 만나요!" bubbleSide="top" className="tp-wave" />
      <div className="flex flex-col items-center sm:items-start gap-2">
        <div className="tp-footer-logo">
          <span className="tp-logo-a" data-text="타자">
            타자
          </span>
          <span className="tp-logo-b" data-text="팡팡">
            팡팡
          </span>
        </div>
        <div className="tp-footer-credit">
          <span>김은경</span>
          <span className="opacity-40">|</span>
          <a href="mailto:sadacaca@naver.com">sadacaca@naver.com</a>
          {isMaster && onOpenMaster && (
            <>
              <span className="opacity-40">|</span>
              <button type="button" onClick={onOpenMaster}>
                👑 마스터 관리실
              </button>
            </>
          )}
        </div>
        <div className="tp-footer-copy">© 2026 TAPANG · INSERT COIN TO CONTINUE</div>
      </div>
    </div>
  </footer>
);

/* ================================================================== */
/*  파팡 robots + clouds that fill the empty side gutters               */
/* ================================================================== */
export const GutterBots: React.FC = () => (
  <div className="gb" aria-hidden="true">
    <Pixel grid={CLOUD} pal={CLOUD_PAL} size={130} className="gb-cloud gb-cloud--1" />
    <Pixel grid={CLOUD} pal={CLOUD_PAL} size={100} className="gb-cloud gb-cloud--2" />
    <Pixel grid={CLOUD} pal={CLOUD_PAL} size={120} className="gb-cloud gb-cloud--3" />
    <div className="gb-bot gb-bot--l1"><TvBot size={60} bubble="화이팅!" bubbleSide="top" /></div>
    <div className="gb-bot gb-bot--r1"><TvBot size={56} bubble="팡팡!" bubbleSide="top" /></div>
    <div className="gb-bot gb-bot--l2"><TvBot size={48} /></div>
    <div className="gb-bot gb-bot--r2"><TvBot size={52} bubble="탁탁!" bubbleSide="top" /></div>
  </div>
);
