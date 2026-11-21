import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppMode, UserSession, PracticeHistoryRecord } from '../../types';
import { soundManager } from '../../utils/sound';
import { pointsManager } from '../../utils/pointsManager';
import { getQuestProgress, QuestMode } from '../../utils/questProgress';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';

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
  goal: number;
  flagNum: string;
  kind?: 'arch' | 'special';
  /** Overall clickable bounding box (% of 1376x768 illustration) */
  box: { l: number; t: number; w: number; h: number };
  /** Parchment scroll inner writing area (% of illustration) */
  scroll: { cx: number; cy: number; w: number; h: number };
  /** Painted rainbow pennant center (% of illustration) */
  flag: { cx: number; cy: number };
  /** Stone pedestal / temple highlight area (% of illustration) */
  ped: { cx: number; cy: number; w: number; h: number };
}

/* Exact coordinates measured directly from /public/assets/quest-map.webp (1376x768) */
const MAP_STOPS: MapStop[] = [
  {
    mode: 'key-practice',
    label: 'STAGE 01',
    name: '자리 연습',
    goal: 10,
    flagNum: '1',
    box: { l: 6.0, t: 37.5, w: 14.2, h: 24.5 },
    scroll: { cx: 13.1, cy: 42.4, w: 11.4, h: 6.8 },
    flag: { cx: 16.9, cy: 53.0 },
    ped: { cx: 12.4, cy: 58.1, w: 4.8, h: 6.6 },
  },
  {
    mode: 'word-practice',
    label: 'STAGE 02',
    name: '낱말 연습',
    goal: 10,
    flagNum: '2',
    box: { l: 20.8, t: 54.8, w: 13.8, h: 23.2 },
    scroll: { cx: 27.9, cy: 59.6, w: 11.4, h: 6.8 },
    flag: { cx: 31.7, cy: 69.0 },
    ped: { cx: 27.3, cy: 74.2, w: 5.0, h: 6.6 },
  },
  {
    mode: 'sentence-practice',
    label: 'STAGE 03',
    name: '짧은 글',
    goal: 10,
    flagNum: '3',
    box: { l: 34.7, t: 37.5, w: 13.9, h: 24.0 },
    scroll: { cx: 41.4, cy: 42.4, w: 11.6, h: 6.8 },
    flag: { cx: 45.3, cy: 52.6 },
    ped: { cx: 41.0, cy: 57.6, w: 5.0, h: 6.6 },
  },
  {
    mode: 'long-practice',
    label: 'STAGE 04',
    name: '긴 글 연습',
    goal: 5,
    flagNum: '4',
    box: { l: 56.0, t: 38.0, w: 13.8, h: 24.0 },
    scroll: { cx: 63.1, cy: 43.0, w: 11.4, h: 6.8 },
    flag: { cx: 66.8, cy: 52.9 },
    ped: { cx: 62.4, cy: 58.1, w: 4.8, h: 6.6 },
  },
  {
    mode: 'knowledge-hub',
    label: 'SPECIAL',
    name: '팡팡 지식 타자',
    goal: 3,
    flagNum: '★',
    kind: 'special',
    box: { l: 69.9, t: 57.5, w: 13.5, h: 22.5 },
    scroll: { cx: 76.5, cy: 62.0, w: 11.6, h: 6.6 },
    flag: { cx: 80.3, cy: 71.8 },
    ped: { cx: 75.7, cy: 76.6, w: 4.8, h: 6.2 },
  },
  {
    mode: 'leaderboard',
    label: 'STAGE 05',
    name: '명예의 전당',
    goal: 1,
    flagNum: '5',
    kind: 'arch',
    box: { l: 83.5, t: 33.0, w: 14.5, h: 32.5 },
    scroll: { cx: 90.3, cy: 37.8, w: 11.6, h: 6.8 },
    flag: { cx: 95.5, cy: 60.9 },
    ped: { cx: 89.8, cy: 53.0, w: 9.6, h: 20.5 },
  },
];

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
const CLOUD_PAL = { K: '#9bd4fa', W: '#ffffff', S: '#d4eeff' };

interface RoadPoint {
  x: number;
  y: number;
}

/* Ordered waypoints along the ochre dirt road & wooden bridge (% of 1376x768 map) */
const ROAD_WAYPOINTS: RoadPoint[] = [
  { x: 10.6, y: 78.2 }, // 0: Left start clearing (guest / teacher)
  { x: 12.2, y: 70.0 }, // 1: Path leaving start clearing
  { x: 16.5, y: 66.0 }, // 2: STAGE 01 pedestal side
  { x: 21.8, y: 71.5 }, // 3: Curve down toward Stage 02
  { x: 25.0, y: 81.2 }, // 4: Road below Stage 02
  { x: 31.8, y: 81.4 }, // 5: STAGE 02 pedestal side
  { x: 35.8, y: 76.2 }, // 6: Curve up toward Stage 03
  { x: 38.6, y: 68.2 }, // 7: Entering Stage 03 stretch
  { x: 44.2, y: 65.4 }, // 8: STAGE 03 pedestal side
  { x: 47.4, y: 65.0 }, // 9: Wooden bridge west entrance
  { x: 52.4, y: 64.0 }, // 10: Wooden bridge center over river
  { x: 57.6, y: 65.0 }, // 11: Wooden bridge east exit
  { x: 65.6, y: 66.2 }, // 12: STAGE 04 pedestal side
  { x: 69.2, y: 77.6 }, // 13: Curve down toward SPECIAL
  { x: 73.2, y: 84.0 }, // 14: Road below SPECIAL
  { x: 79.4, y: 83.6 }, // 15: SPECIAL pedestal side
  { x: 84.8, y: 80.6 }, // 16: Curve up toward Temple
  { x: 88.8, y: 73.2 }, // 17: Approaching Greek Temple
  { x: 89.2, y: 67.6 }, // 18: STAGE 05 Hall of Fame Temple front
];

/* Stage index (0..5) -> index in ROAD_WAYPOINTS */
const STAGE_WAYPOINT_IDX = [2, 5, 8, 12, 15, 18];

const BOT_STAGE_KEY = (userId: string) => `tp_quest_bot_stage_${userId}`;

/** Korean particle 으로/로 (받침 없거나 ㄹ 받침이면 '로', 그 외 '으로') */
const withRo = (word: string) => {
  const trimmed = word.trim();
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    return jong === 0 || jong === 8 ? `${trimmed}로` : `${trimmed}으로`;
  }
  return `${trimmed}으로`;
};

/** Sample a point along a polyline by uniform perceived arc-length progress t in [0, 1] */
const sampleRoadPoint = (pts: RoadPoint[], t: number): RoadPoint => {
  if (pts.length <= 1 || t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = (pts[i + 1].y - pts[i].y) * (768 / 1376);
    const d = Math.hypot(dx, dy);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return pts[pts.length - 1];
  let dist = t * total;
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i] || i === segLens.length - 1) {
      const f = segLens[i] > 0 ? dist / segLens[i] : 1;
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
      };
    }
    dist -= segLens[i];
  }
  return pts[pts.length - 1];
};

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

  // 단계별 '모두 완료' 진행도 (자리 8단계·낱말 8단계·짧은 글 주제·긴 글 작품을 모두 끝까지)
  const [questTick, setQuestTick] = useState(0);
  useEffect(() => {
    const bump = () => setQuestTick((t) => t + 1);
    window.addEventListener('quest-progress-updated', bump);
    window.addEventListener('focus', bump);
    return () => {
      window.removeEventListener('quest-progress-updated', bump);
      window.removeEventListener('focus', bump);
    };
  }, []);
  const quest = useMemo(() => getQuestProgress(currentUser?.id, records), [currentUser, records, questTick]);

  // 로그인한 학생이 나가기 직전에 치던 곳 → 퀘스트 맵에 표시하고, 누르면 그 단계로 바로 들어감
  const [lastPractice, setLastPractice] = useState(() => (currentUser ? dailyMissionsManager.getLastPractice(currentUser.id) : null));
  useEffect(() => {
    const refresh = () => setLastPractice(currentUser ? dailyMissionsManager.getLastPractice(currentUser.id) : null);
    refresh();
    window.addEventListener('last-practice-updated', refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('last-practice-updated', refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [currentUser]);
  const lastMode = lastPractice?.mode === 'transcription-challenge' ? 'long-practice' : lastPractice?.mode;

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

  // 로그인한 학생(마스터/선생님 제외)의 로봇 위치 계산:
  // 마지막으로 치던/방금 친 단계("▶ 여기까지 쳤어요 · 이어서"와 같은 단계)로 이동하고,
  // 마지막 연습 기록이 없으면 아직 안 끝낸 첫 단계에 배치
  const isStudent = !!currentUser && currentUser.role !== 'master';
  const targetStageIdx = useMemo(() => {
    if (!isStudent) return -1;
    if (lastMode) {
      const lastIdx = MAP_STOPS.findIndex((s) => s.mode === lastMode);
      if (lastIdx >= 0) return lastIdx;
    }
    for (let i = 0; i < MAP_STOPS.length; i++) {
      const s = MAP_STOPS[i];
      const q = quest[s.mode as QuestMode];
      const done = q ? q.complete : (stats.byMode[s.mode] || 0) >= s.goal;
      if (!done) return i;
    }
    return MAP_STOPS.length - 1; // 모두 완료 → 명예의 전당 신전 앞
  }, [isStudent, lastMode, quest, stats.byMode]);

  const targetPoint = targetStageIdx >= 0 ? ROAD_WAYPOINTS[STAGE_WAYPOINT_IDX[targetStageIdx]] : ROAD_WAYPOINTS[0];
  const [botPos, setBotPos] = useState<RoadPoint>(targetPoint);
  const [isWalking, setIsWalking] = useState(false);
  const [arrivedStageIdx, setArrivedStageIdx] = useState<number | null>(null);
  const [showSparkle, setShowSparkle] = useState(false);
  const botLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 비로그인 또는 선생님 계정: 왼쪽 출발점 고정
    if (!isStudent || !currentUser?.id || targetStageIdx < 0) {
      setBotPos(ROAD_WAYPOINTS[0]);
      setIsWalking(false);
      setArrivedStageIdx(null);
      setShowSparkle(false);
      if (botLayerRef.current) {
        botLayerRef.current.style.transform = `translate3d(${ROAD_WAYPOINTS[0].x}%, ${ROAD_WAYPOINTS[0].y}%, 0)`;
      }
      return;
    }

    const storageKey = BOT_STAGE_KEY(currentUser.id);
    let prevIdx: number | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        const parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed < MAP_STOPS.length) {
          prevIdx = parsed;
        }
      }
    } catch {}

    const dest = ROAD_WAYPOINTS[STAGE_WAYPOINT_IDX[targetStageIdx]];
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 첫 방문이거나 같은 단계이면 바로 현재 위치에 표시
    if (prevIdx === null || targetStageIdx === prevIdx) {
      try {
        localStorage.setItem(storageKey, String(targetStageIdx));
      } catch {}
      setBotPos(dest);
      setIsWalking(false);
      setShowSparkle(false);
      if (botLayerRef.current) {
        botLayerRef.current.style.transform = `translate3d(${dest.x}%, ${dest.y}%, 0)`;
      }
      return;
    }

    // prefers-reduced-motion: 이동 애니메이션 없이 바로 새 단계 자리에 표시
    if (reducedMotion) {
      try {
        localStorage.setItem(storageKey, String(targetStageIdx));
      } catch {}
      setBotPos(dest);
      setIsWalking(false);
      setArrivedStageIdx(targetStageIdx);
      setShowSparkle(false);
      if (botLayerRef.current) {
        botLayerRef.current.style.transform = `translate3d(${dest.x}%, ${dest.y}%, 0)`;
      }
      return;
    }

    // 이전 단계 → 새 단계까지 흙길(나무 다리 포함)을 따라 양방향으로 걸어가기 (transform만 업데이트)
    const startWp = STAGE_WAYPOINT_IDX[prevIdx];
    const endWp = STAGE_WAYPOINT_IDX[targetStageIdx];
    const pathPts =
      startWp <= endWp
        ? ROAD_WAYPOINTS.slice(startWp, endWp + 1)
        : ROAD_WAYPOINTS.slice(endWp, startWp + 1).reverse();
    const startPt = pathPts[0];
    const duration = Math.min(2900, 2000 + Math.max(0, Math.abs(targetStageIdx - prevIdx) - 1) * 350);

    setBotPos(startPt);
    setIsWalking(true);
    setShowSparkle(false);
    if (botLayerRef.current) {
      botLayerRef.current.style.transform = `translate3d(${startPt.x}%, ${startPt.y}%, 0)`;
    }

    let rafId = 0;
    let sparkleTimer = 0;
    let t0 = 0;

    const tick = (now: number) => {
      if (!t0) t0 = now;
      const rawT = Math.min(1, (now - t0) / duration);
      // 부드러운 가감속 (easeInOutQuad)
      const eased = rawT < 0.5 ? 2 * rawT * rawT : 1 - Math.pow(-2 * rawT + 2, 2) / 2;
      const pt = sampleRoadPoint(pathPts, eased);
      if (botLayerRef.current) {
        botLayerRef.current.style.transform = `translate3d(${pt.x}%, ${pt.y}%, 0)`;
      }

      if (rawT < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        try {
          localStorage.setItem(storageKey, String(targetStageIdx));
        } catch {}
        setBotPos(dest);
        setIsWalking(false);
        setArrivedStageIdx(targetStageIdx);
        setShowSparkle(true);
        sparkleTimer = window.setTimeout(() => setShowSparkle(false), 950);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (sparkleTimer) window.clearTimeout(sparkleTimer);
    };
  }, [isStudent, currentUser?.id, targetStageIdx]);

  const activeBotStop = targetStageIdx >= 0 ? MAP_STOPS[targetStageIdx] : MAP_STOPS[0];
  const isResumingStage = !!lastMode && activeBotStop.mode === lastMode;
  const botBubbleText = !isStudent
    ? '오늘의 퀘스트 맵: 1단계부터 5단계까지 도전!'
    : isWalking
      ? `${activeBotStop.label} ${withRo(activeBotStop.name)} 이동 중!`
      : arrivedStageIdx === targetStageIdx
        ? `${activeBotStop.label} ${withRo(activeBotStop.name)} 도착!`
        : isResumingStage
          ? `${activeBotStop.label} ${activeBotStop.name} 이어서 도전!`
          : `오늘의 퀘스트: ${activeBotStop.name} 도전!`;

  // 오른쪽 끝이나 코인 주머니 근처에서는 말풍선만 살짝 안쪽으로 당겨 잘리지 않게 유지
  const bubbleNudgeCqw =
    botPos.x > 84 ? -2.8 : botPos.x > 74 && botPos.y > 78 ? -3.4 : 0;

  const playerName = currentUser ? currentUser.name : 'PLAYER 1';
  const playerTitle = currentUser?.levelTitle;

  return (
    <div className="tp-home space-y-12">
      {/* ================= QUEST MAP (16-bit Pixel RPG World Map Illustration) ================= */}
      <section className="qm" aria-label="타자팡 모험 지도">
        <div className="qm-frame">
          <span className="qm-cap qm-cap--tl" />
          <span className="qm-cap qm-cap--tr" />
          <span className="qm-cap qm-cap--bl" />
          <span className="qm-cap qm-cap--br" />

          <div className="qm-world">
            {/* Full 16-bit pixel-art RPG world map illustration */}
            <img
              src="./assets/quest-map.webp"
              alt="타자팡 16비트 픽셀아트 RPG 모험 지도"
              className="qm-bg"
              referrerPolicy="no-referrer"
              draggable={false}
            />

            {/* Text overlay aligned to the blank hanging wooden signboard */}
            <header className="qm-signboard">
              <h1 className="qm-signboard-main">타자팡 모험 지도:</h1>
              <p className="qm-signboard-sub">타자 용사 기본 훈련</p>
            </header>

            {/* 6 interactive stage zones aligned to each parchment scroll + pedestal/temple + rainbow flag */}
            {MAP_STOPS.map((s) => {
              const q = quest[s.mode as QuestMode];
              const complete = q ? q.complete : false;
              const cleared = !q && (stats.byMode[s.mode] || 0) >= s.goal;
              const isLast = !!currentUser && lastMode === s.mode;

              const lx = (gx: number) => `${((gx - s.box.l) / s.box.w) * 100}%`;
              const ly = (gy: number) => `${((gy - s.box.t) / s.box.h) * 100}%`;
              const lw = (gw: number) => `${(gw / s.box.w) * 100}%`;
              const lh = (gh: number) => `${(gh / s.box.h) * 100}%`;

              return (
                <button
                  key={s.mode}
                  type="button"
                  onClick={() => go(s.mode)}
                  className={`qm-stop ${s.kind ? `qm-stop--${s.kind}` : ''} ${complete ? 'qm-stop--complete' : ''} ${isLast ? 'qm-stop--last' : ''}`}
                  data-testid={isLast ? 'quest-last' : undefined}
                  style={{
                    left: `${s.box.l}%`,
                    top: `${s.box.t}%`,
                    width: `${s.box.w}%`,
                    height: `${s.box.h}%`,
                  }}
                  aria-label={`${s.label} ${s.name}${q ? ` (${q.done}/${q.total}${complete ? ' 모두 완료' : ''})` : ''}`}
                >
                  {/* Parchment scroll text overlay */}
                  <span
                    className="qm-scroll"
                    style={{
                      left: lx(s.scroll.cx),
                      top: ly(s.scroll.cy),
                      width: lw(s.scroll.w),
                      height: lh(s.scroll.h),
                    }}
                  >
                    <b>{s.label}</b>
                    <span>{s.name}</span>
                    {cleared && <i className="qm-clear">CLEAR</i>}
                    {q && !complete && (
                      <i className="qm-prog" title={`${q.total}개 중 ${q.done}개 완료`}>
                        {q.done}/{q.total}
                      </i>
                    )}
                    {complete && (
                      <i className="qm-done" title="이 단계를 모두 완료했어요!">
                        <b>✔</b>완료!
                      </i>
                    )}
                  </span>

                  {/* Subtle interactive ring on the stone pedestal / temple */}
                  <span
                    className="qm-ped-ring"
                    style={{
                      left: lx(s.ped.cx),
                      top: ly(s.ped.cy),
                      width: lw(s.ped.w),
                      height: lh(s.ped.h),
                    }}
                    aria-hidden="true"
                  />

                  {/* Stage number painted onto the rainbow flag */}
                  <span
                    className="qm-flag-num"
                    style={{
                      left: lx(s.flag.cx),
                      top: ly(s.flag.cy),
                    }}
                    aria-hidden="true"
                  >
                    {s.flagNum}
                  </span>

                  {/* Last-practiced badge directly below the pedestal */}
                  {isLast && (
                    <i
                      className="qm-last"
                      style={{
                        left: lx(s.ped.cx),
                        top: ly(s.ped.cy + s.ped.h / 2 + 1.4),
                      }}
                      title="지난번에 여기까지 쳤어요. 누르면 바로 이어서 쳐요!"
                    >
                      <b>▶</b>여기까지 쳤어요 · 이어서
                      {lastPractice?.stageTitle ? <small>{lastPractice.stageTitle}</small> : null}
                    </i>
                  )}
                </button>
              );
            })}

            {/* Progress-tracking TV robot mascot walking along the dirt road (pure transform) */}
            <div
              ref={botLayerRef}
              className="qm-bot-layer"
              style={{ transform: `translate3d(${botPos.x}%, ${botPos.y}%, 0)` }}
            >
              <button
                type="button"
                onClick={() => go(activeBotStop.mode)}
                className={`qm-bot-btn ${isWalking ? 'qm-bot-btn--walk' : ''}`}
                aria-label={`${activeBotStop.label} ${activeBotStop.name} 바로 시작하기`}
              >
                {showSparkle && (
                  <span className="qm-bot-sparkles" aria-hidden="true">
                    <Pixel grid={STAR} pal={STAR_PAL} size={18} className="qm-bot-star qm-bot-star--1" />
                    <Pixel grid={STAR} pal={STAR_PAL} size={14} className="qm-bot-star qm-bot-star--2" />
                    <Pixel grid={STAR} pal={STAR_PAL} size={16} className="qm-bot-star qm-bot-star--3" />
                    <Pixel grid={STAR} pal={STAR_PAL} size={12} className="qm-bot-star qm-bot-star--4" />
                  </span>
                )}
                <span className="qm-bot-sprite">
                  <Pixel grid={TV_BOT} pal={TV_PAL} size={64} className="qm-bot-tv" />
                  <span className="qm-tracks" aria-hidden="true" />
                </span>
                <span
                  className="qm-bot-bubble"
                  style={
                    bubbleNudgeCqw
                      ? ({ ['--qm-bn' as any]: `${bubbleNudgeCqw}cqw` } as React.CSSProperties)
                      : undefined
                  }
                >
                  {botBubbleText}
                </span>
              </button>
            </div>

            {/* Coin pouch */}
            <button
              type="button"
              className="qm-pouch"
              onClick={() => (currentUser ? onOpenProfile?.('account') : onOpenAuth())}
              aria-label={`보유 포인트 ${points.toLocaleString()}P`}
            >
              <Pixel grid={COIN} pal={COIN_PAL} size={20} className="qm-pouch-coin" />
              <span className="qm-pouch-num">{points.toLocaleString()}</span>
              <span className="qm-pouch-bag">
                <PixelIcon name="bag" size={26} className="qm-pouch-bag-svg" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= SCORECARD (16-bit RPG Adventurer Guild Notice Board) ================= */}
      <section className="tp-guild" aria-label="타자팡 기록 성적표">
        <div className="qm-frame tp-guild-frame">
          <span className="qm-cap qm-cap--tl" aria-hidden="true" />
          <span className="qm-cap qm-cap--tr" aria-hidden="true" />
          <span className="qm-cap qm-cap--bl" aria-hidden="true" />
          <span className="qm-cap qm-cap--br" aria-hidden="true" />

          <div className="tp-guild-stage">
            <img
              src="./assets/guild-board.webp"
              alt=""
              aria-hidden="true"
              className="tp-guild-bg"
              referrerPolicy="no-referrer"
              draggable={false}
            />
            <div className="tp-guild-scrim" aria-hidden="true" />

            <div className="tp-guild-body">
              <div className="tp-guild-head">
                <h2 className="tp-guild-title">
                  <span className="tp-guild-title-a">타자팡</span>{' '}
                  <span className="tp-guild-title-b">기록 성적표</span>
                </h2>
              </div>

              <div className="tp-guild-board">
                <button
                  type="button"
                  className="tp-plaque"
                  onClick={() => (currentUser ? onOpenProfile?.('account') : onOpenAuth())}
                >
                  <span className="tp-plaque-avatar">{currentUser?.avatar || '🙂'}</span>
                  <span className="text-left min-w-0">
                    <span className="tp-plaque-name">
                      {playerName}
                      {playerTitle ? <small> ({playerTitle})</small> : null}
                    </span>
                    <span className="tp-plaque-pts">
                      {points.toLocaleString()} P
                      <span className="tp-coinstack" aria-hidden="true">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Pixel key={i} grid={COIN} pal={COIN_PAL} size={22} style={{ marginLeft: i ? -12 : 0 }} />
                        ))}
                      </span>
                    </span>
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mt-8">
                  {[
                    { icon: <Pixel grid={TROPHY} pal={TROPHY_PAL} size={38} />, label: 'Average Speed', val: String(stats.avg), unit: 'CPM', tone: 'forest' },
                    { icon: <Pixel grid={STAR} pal={STAR_PAL} size={42} />, label: 'Top Speed', val: String(stats.top), unit: 'CPM', tone: 'gold' },
                    { icon: <Pixel grid={HEART} pal={HEART_PAL} size={38} />, label: 'Precision', val: stats.acc.toFixed(1), unit: '%', tone: 'crimson' },
                  ].map((b) => (
                    <div key={b.label} className={`tp-seg tp-seg--${b.tone}`}>
                      <span className="tp-seg-icon" aria-hidden="true">{b.icon}</span>
                      <span className="tp-seg-label">{b.label}</span>
                      <span className="tp-seg-digits">
                        <span className="tp-seg-val">{b.val}</span>
                        <small>{b.unit}</small>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col lg:flex-row items-center lg:items-end gap-5 mt-6">
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
                    <TvBot size={112} bubble="👍" bubbleSide="top" />
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    <div className="tp-frame-bg-wrap" aria-hidden="true">
      <img
        src="./assets/wood-frame.webp"
        alt=""
        className="tp-frame-bg"
        referrerPolicy="no-referrer"
        draggable={false}
      />
    </div>
    <span className="qm-cap qm-cap--tl" aria-hidden="true" />
    <span className="qm-cap qm-cap--tr" aria-hidden="true" />
    <span className="qm-cap qm-cap--bl" aria-hidden="true" />
    <span className="qm-cap qm-cap--br" aria-hidden="true" />
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
    <img
      src="./assets/footer-meadow.webp"
      alt=""
      aria-hidden="true"
      className="tp-footer-bg"
      referrerPolicy="no-referrer"
      draggable={false}
    />
    <div className="tp-footer-scrim" aria-hidden="true" />
    <div className="relative z-10 max-w-7xl mx-auto px-4 py-9 sm:py-11 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-7">
      <TvBot size={78} bubble="또 만나요!" bubbleSide="top" className="tp-wave" />
      <div className="flex flex-col items-center sm:items-start gap-2.5">
        <div className="tp-footer-logo">
          <span className="tp-footer-logo-a">타자</span>
          <span className="tp-footer-logo-b">팡팡</span>
        </div>
        <div className="tp-footer-credit">
          <span>김은경</span>
          <span className="opacity-45" aria-hidden="true">|</span>
          <a href="mailto:sadacaca@naver.com">sadacaca@naver.com</a>
          {isMaster && onOpenMaster && (
            <>
              <span className="opacity-45" aria-hidden="true">|</span>
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
