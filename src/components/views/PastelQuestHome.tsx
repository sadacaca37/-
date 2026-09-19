import React, { useEffect, useMemo, useState } from 'react';
import { AppMode, UserSession, PracticeHistoryRecord } from '../../types';
import { soundManager } from '../../utils/sound';
import { pointsManager } from '../../utils/pointsManager';

/* ================================================================== */
/*  Pixel sprite helper                                                 */
/* ================================================================== */
const Pixel: React.FC<{
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

/* 타자봇 – white helmet robot with green "DEV" style headband */
const ROBOT = [
  '.......KKKKKK.......',
  '.....KKWWWWWWKK.....',
  '....KWWWWWWWWWWK....',
  '...KHHHHHHHHHHHHK.hh',
  '...KHHhhHHHHhhHHKhH.',
  '..KWVVVVVVVVVVVVWKH.',
  '..KWVVCCVVVVVVCCVWK.',
  '.KGWVVCCVVVVVVVVVWGK',
  '.KGWVVVVVVVVVVVVVWGK',
  '.KGWVVVVVMMMMVVVVWGK',
  '..KWWVVVVVMMVVVVWWK.',
  '..KWWWWWWWWWWWWWWWK.',
  '...KKWWWWWWWWWWWKK..',
  '.....KKKKKKKKKKK....',
  '....KBBWWWWWWWBBK...',
  '...KWBWWWWYYWWWWBWK.',
  '..KWWKWWWWYYWWWWKWWK',
  '...KK.KWWWWWWWWK.KK.',
  '......KWWK..KWWK....',
  '......KKKK..KKKK....',
];
const ROBOT_PAL = {
  K: '#1b2340',
  W: '#ffffff',
  G: '#cfdcec',
  V: '#101a33',
  C: '#34e7e4',
  H: '#62d13c',
  h: '#3a9a25',
  M: '#ff5470',
  B: '#29b6f6',
  Y: '#ffca28',
};

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
  'KWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'KSSWWWWWWWWSSSWWWWWWWWSSSWWW',
  'SSSSSSSSSSSSSSSSSSSSSSSSSSSS',
];
const CLOUD_PAL = { K: '#9fd0ff', W: '#ffffff', S: '#d6ebff' };
const COIN = ['.KKKK.', 'KYYLYK', 'KYLYDK', 'KYLYDK', 'KYYDDK', '.KKKK.'];
const COIN_PAL = { K: '#8a5a00', Y: '#ffca28', L: '#fff59d', D: '#f0a500' };
const STAR = ['...K...', '..KYK..', 'KKKYKKK', 'KYYYYYK', '.KYYYK.', '.KYKYK.', 'KK...KK'];
const STAR_PAL = { K: '#b56b00', Y: '#ffd83a' };
const HEART = ['.KK.KK.', 'KRRKRRK', 'KRRRRRK', '.KRRRK.', '..KRK..', '...K...'];
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
  '..KBBBBBBK..',
  '..KKKKKKKK..',
];
const TROPHY_PAL = { K: '#7a4a00', Y: '#ffca28', L: '#fff59d', B: '#8d5524' };

/* ================================================================== */
/*  Data                                                                */
/* ================================================================== */
interface Stage {
  mode: AppMode;
  no: number;
  name: string;
  emoji: string;
  goal: number;
  /** desktop position (% of map) */
  x: number;
  y: number;
  /** mobile position (% of map) */
  mx: number;
  my: number;
}
const STAGES: Stage[] = [
  { mode: 'key-practice', no: 1, name: '자리 연습', emoji: '⌨️', goal: 10, x: 13, y: 78, mx: 24, my: 27 },
  { mode: 'word-practice', no: 2, name: '낱말 연습', emoji: '🍎', goal: 10, x: 32, y: 50, mx: 74, my: 42 },
  { mode: 'sentence-practice', no: 3, name: '짧은 글', emoji: '✏️', goal: 10, x: 51, y: 78, mx: 26, my: 58 },
  { mode: 'long-practice', no: 4, name: '긴 글', emoji: '📜', goal: 5, x: 69, y: 50, mx: 74, my: 74 },
  { mode: 'leaderboard', no: 5, name: '명예의 전당', emoji: '🏆', goal: 1, x: 88, y: 70, mx: 30, my: 90 },
];

const ZONES: { mode: AppMode; name: string; emoji: string; tone: string }[] = [
  { mode: 'mini-games', name: '미니 타자게임', emoji: '🕹️', tone: '#ff6b8b' },
  { mode: 'playground', name: '놀이터', emoji: '🎡', tone: '#29b6f6' },
  { mode: 'knowledge-hub', name: '지식 타자', emoji: '🌏', tone: '#43c05a' },
  { mode: 'tamagotchi', name: '다마고치', emoji: '🐣', tone: '#ab47bc' },
];

const BADGES = [
  { need: 100, icon: '🥉' },
  { need: 200, icon: '🥈' },
  { need: 300, icon: '🥇' },
  { need: 400, icon: '👑' },
];

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

export const PastelQuestHome: React.FC<Props> = ({ currentUser, records, onSelectMode, onOpenAuth, onOpenProfile }) => {
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
    const best = Math.max(currentUser?.highestCpm || 0, ...records.map((r) => r.cpm || 0), 0);
    const level = Math.floor(total / 5) + 1;
    const exp = ((total % 5) / 5) * 100;
    return { byMode, streak, level, exp, best };
  }, [records, currentUser]);

  const go = (mode: AppMode) => {
    try {
      soundManager.play('click');
    } catch {}
    onSelectMode(mode);
  };

  return (
    <div className="rq-home space-y-9">
      {/* ======================= HERO (slide 1 style) ======================= */}
      <section className="rq-hero relative overflow-hidden">
        <div className="rq-rays" />
        <div className="rq-sparkles" />
        <Pixel grid={CLOUD} pal={CLOUD_PAL} size={420} className="rq-pixcloud rq-pixcloud--l" />
        <Pixel grid={CLOUD} pal={CLOUD_PAL} size={420} className="rq-pixcloud rq-pixcloud--r" />

        <Pixel grid={STAR} pal={STAR_PAL} size={46} className="absolute left-[7%] top-[46%] rq-twinkle" />
        <Pixel grid={STAR} pal={STAR_PAL} size={36} className="absolute right-[9%] top-[38%] rq-twinkle rq-delay" />
        <Pixel grid={STAR} pal={STAR_PAL} size={26} className="absolute left-[22%] top-[10%] rq-twinkle rq-delay" />
        <Pixel grid={COIN} pal={COIN_PAL} size={26} className="absolute right-[20%] top-[14%] rq-spin" />
        <Pixel grid={HEART} pal={{ K: '#8a1030', R: '#ff5470' }} size={26} className="absolute right-[24%] bottom-[30%] rq-hop" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-8 sm:pt-10 pb-8">
          <h1 className="rq-title text-[40px] sm:text-6xl lg:text-7xl">
            <span className="rq-title-a" data-text="타닥타닥">타닥타닥</span>{' '}
            <span className="rq-title-b" data-text="타자랜드!">타자랜드!</span>
          </h1>

          <div className="rq-ribbon mt-4 sm:mt-5">
            <span>오늘의 타자 모험 출발!</span>
          </div>

          <div className="relative mt-4 flex items-end justify-center gap-2 sm:gap-6">
            <div className="rq-bubble hidden sm:block">
              {currentUser ? `${currentUser.name}, 같이 달려볼까?` : '안녕! 같이 달려볼까?'}
            </div>
            <div className="rq-robot">
              <Pixel grid={ROBOT} pal={ROBOT_PAL} size={170} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => (currentUser ? go('key-practice') : onOpenAuth())}
            className="rq-start mt-3"
          >
            PRESS START
          </button>
        </div>
      </section>

      {/* ======================= PLAYER HUD (wood plank) ======================= */}
      <section className="rq-plank">
        <span className="rq-nail rq-nail--tl" />
        <span className="rq-nail rq-nail--tr" />
        <span className="rq-nail rq-nail--bl" />
        <span className="rq-nail rq-nail--br" />
        {currentUser ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <button type="button" onClick={() => onOpenProfile?.('avatar')} className="flex items-center gap-3">
              <span className="rq-avatar">{currentUser.avatar || '🐱'}</span>
              <span className="text-left">
                <span className="block rq-plank-name">{currentUser.name}</span>
                <span className="rq-lv">LV.{stats.level}</span>
              </span>
            </button>

            <div className="flex-1 min-w-[170px]">
              <div className="flex justify-between rq-hud-label">
                <span>EXP</span>
                <span>{Math.round(stats.exp)}%</span>
              </div>
              <div className="rq-bar">
                <div className="rq-bar__fill" style={{ width: `${Math.max(5, stats.exp)}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rq-chip">🔥 {stats.streak}</span>
              <span className="rq-chip">
                <Pixel grid={COIN} pal={COIN_PAL} size={16} /> {points.toLocaleString()}
              </span>
              <span className="rq-chip">⚡ {stats.best}</span>
              <span className="flex gap-1">
                {BADGES.map((b) => (
                  <span key={b.need} className={`rq-badge ${stats.best >= b.need ? '' : 'is-locked'}`}>
                    {b.icon}
                  </span>
                ))}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rq-avatar">
                <Pixel grid={ROBOT} pal={ROBOT_PAL} size={40} />
              </span>
              <span className="rq-plank-name">PLAYER 1</span>
            </div>
            <button type="button" onClick={onOpenAuth} className="rq-btn rq-btn--green">
              로그인 ▶
            </button>
          </div>
        )}
      </section>

      {/* ======================= QUEST MAP (slide 2 style) ======================= */}
      <section className="rq-map">
        {/* hanging wooden title */}
        <div className="rq-hang">
          <span className="rq-rope rq-rope--l" />
          <span className="rq-rope rq-rope--r" />
          <div className="rq-hang-board">오늘의 퀘스트 맵</div>
        </div>

        <div className="rq-field relative w-full">
          {/* background: sky, hills, grass */}
          <div className="rq-sky" />
          <div className="rq-pillhill" style={{ left: '3%', height: '46%', width: '6%', background: '#58c35c' }} />
          <div className="rq-pillhill" style={{ left: '8%', height: '56%', width: '7%', background: '#6fd26b' }} />
          <div className="rq-pillhill" style={{ left: '13.5%', height: '38%', width: '6%', background: '#f4d58d' }} />
          <div className="rq-pillhill hidden sm:block" style={{ right: '5%', height: '40%', width: '5%', background: '#6fd26b' }} />
          <div className="rq-pillhill hidden sm:block" style={{ right: '10%', height: '30%', width: '5%', background: '#f4d58d' }} />
          <div className="rq-cloud" style={{ left: '30%', top: '5%' }} />
          <div className="rq-cloud rq-cloud--sm" style={{ right: '22%', top: '10%' }} />
          <div className="rq-grass" />

          {/* winding dirt road – desktop */}
          <svg className="absolute inset-0 w-full h-full hidden sm:block" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M-2 88 C 6 88, 8 78, 13 78 C 20 78, 22 50, 32 50 C 42 50, 42 78, 51 78 C 60 78, 60 50, 69 50 C 78 50, 80 70, 88 70 C 94 70, 96 80, 104 80"
              className="rq-road-edge"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M-2 88 C 6 88, 8 78, 13 78 C 20 78, 22 50, 32 50 C 42 50, 42 78, 51 78 C 60 78, 60 50, 69 50 C 78 50, 80 70, 88 70 C 94 70, 96 80, 104 80"
              className="rq-road"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          {/* winding dirt road – mobile */}
          <svg className="absolute inset-0 w-full h-full sm:hidden" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M24 22 C 24 36, 74 30, 74 42 C 74 54, 26 47, 26 58 C 26 69, 74 63, 74 74 C 74 85, 30 81, 30 90 L 30 104"
              className="rq-road-edge"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M24 22 C 24 36, 74 30, 74 42 C 74 54, 26 47, 26 58 C 26 69, 74 63, 74 74 C 74 85, 30 81, 30 90 L 30 104"
              className="rq-road"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* coins & flowers */}
          {[
            [6, 60],
            [9, 66],
            [44, 92],
            [60, 38],
            [95, 48],
          ].map(([x, y], i) => (
            <Pixel
              key={`c${i}`}
              grid={COIN}
              pal={COIN_PAL}
              size={20}
              className="absolute rq-spin hidden sm:block"
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s` }}
            />
          ))}
          {[
            [4, 92, '#ff5470'],
            [23, 90, '#ffca28'],
            [78, 90, '#ff8ab3'],
            [96, 60, '#ffffff'],
            [40, 60, '#ff5470'],
          ].map(([x, y, c], i) => (
            <span key={`f${i}`} className="rq-flower" style={{ left: `${x}%`, top: `${y}%`, ['--petal' as any]: c }} />
          ))}

          {/* stages */}
          {STAGES.map((s) => {
            const done = stats.byMode[s.mode] || 0;
            const cleared = done >= s.goal;
            return (
              <button
                key={s.mode}
                type="button"
                onClick={() => go(s.mode)}
                className="rq-stage group"
                style={{
                  ['--x' as any]: `${s.x}%`,
                  ['--y' as any]: `${s.y}%`,
                  ['--mx' as any]: `${s.mx}%`,
                  ['--my' as any]: `${s.my}%`,
                }}
                aria-label={`레벨 ${s.no} ${s.name}`}
              >
                <span className="rq-stage-flag">
                  <span className="rq-flag-pole" />
                  <span className="rq-flag-cloth">{s.no}</span>
                </span>
                <span className="rq-stage-bubble">
                  <span className="rq-stage-emoji">{s.emoji}</span>
                  {cleared && <span className="rq-clear">CLEAR</span>}
                </span>
                <span className="rq-stump" />
                <span className="rq-stage-label">
                  <b>Level {s.no}</b> {s.name}
                </span>
              </button>
            );
          })}

          <div className="rq-dirt" />
        </div>
      </section>

      {/* ======================= GAME ZONE (wood board) ======================= */}
      <section className="rq-board">
        <div className="rq-board-title">놀이 존</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {ZONES.map((z) => (
            <button key={z.mode} type="button" onClick={() => go(z.mode)} className="rq-panel group" style={{ ['--tone' as any]: z.tone }}>
              <span className="rq-panel-screen">
                <span className="rq-panel-emoji">{z.emoji}</span>
              </span>
              <span className="rq-panel-name">{z.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ================================================================== */
/*  Footer (slide 12 "퀘스트 완료" style)                               */
/* ================================================================== */
export const PastelFooter: React.FC<{ isMaster?: boolean; onOpenMaster?: () => void }> = ({ isMaster, onOpenMaster }) => (
  <footer className="mt-auto rq-footer">
    <div className="rq-confetti" />
    <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-7 flex flex-col items-center gap-3 text-center">
      <div className="flex items-end gap-3">
        <Pixel grid={STAR} pal={STAR_PAL} size={26} className="rq-twinkle" />
        <Pixel grid={TROPHY} pal={TROPHY_PAL} size={58} className="rq-hop" />
        <Pixel grid={STAR} pal={STAR_PAL} size={26} className="rq-twinkle rq-delay" />
      </div>
      <div className="rq-ribbon rq-ribbon--gold">
        <span>퀘스트 완료!</span>
      </div>
      <div className="rq-scroll mt-1">
        <span>강사 김은경</span>
        <span className="opacity-40">|</span>
        <a href="mailto:sadacaca@naver.com" className="hover:underline">
          sadacaca@naver.com
        </a>
        {isMaster && onOpenMaster && (
          <>
            <span className="opacity-40">|</span>
            <button type="button" onClick={onOpenMaster} className="hover:underline">
              👑 마스터 관리실
            </button>
          </>
        )}
      </div>
      <div className="text-xs font-bold text-[#6b4a2b]/70">© 2026 타닥타닥 타자랜드</div>
    </div>
  </footer>
);

/* ================================================================== */
/*  RetroFrame – game-style frame + hanging title for dashboard blocks  */
/* ================================================================== */
export const RetroFrame: React.FC<{
  variant: 'sky' | 'wood' | 'arcade' | 'grass';
  tag: string;
  title: string;
  children: React.ReactNode;
}> = ({ variant, tag, title, children }) => (
  <section className={`rq-frame rq-frame--${variant}`}>
    <div className="rq-frame-head">
      <span className="rq-frame-tag">{tag}</span>
      <span className="rq-frame-title">{title}</span>
    </div>
    {variant === 'arcade' && (
      <>
        <Pixel grid={STAR} pal={STAR_PAL} size={22} className="rq-frame-deco rq-frame-deco--l rq-twinkle" />
        <Pixel grid={COIN} pal={COIN_PAL} size={20} className="rq-frame-deco rq-frame-deco--r rq-spin" />
      </>
    )}
    {variant === 'sky' && (
      <Pixel grid={HEART} pal={{ K: '#8a1030', R: '#ff5470' }} size={22} className="rq-frame-deco rq-frame-deco--r rq-hop" />
    )}
    <div className="rq-frame-inner">{children}</div>
  </section>
);
