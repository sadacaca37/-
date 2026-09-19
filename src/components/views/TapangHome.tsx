import React, { useEffect, useMemo, useRef, useState } from 'react';
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
/* 타퐁 (Typong) – retro CRT-TV robot */
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
const BOLT = ['...KKK', '..KYYK', '.KYYK.', 'KYYYYK', 'KKYYK.', '.KYK..', '.KK...', 'K.....'];
const BOLT_PAL = { K: '#7a4a00', Y: '#ffe14a' };
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

/* 타퐁 robot with optional name plate + speech bubble */
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
        타퐁
      </span>
    </div>
  </div>
);

/* ================================================================== */
/*  Data                                                                */
/* ================================================================== */
interface ModeCard {
  mode: AppMode;
  name: string;
  en: string;
  emoji: string;
  rim: string;
  fill: string;
}
const CAROUSEL: ModeCard[] = [
  { mode: 'key-practice', name: '자리 연습', en: 'KEY PRACTICE', emoji: '⌨️', rim: '#43c05a', fill: '#6b3f1d' },
  { mode: 'word-practice', name: '낱말 팡팡', en: 'WORD PANG PANG', emoji: '🔤', rim: '#ff9f1c', fill: '#1f63d8' },
  { mode: 'sentence-practice', name: '짧은 글', en: 'SHORT TEXT', emoji: '✏️', rim: '#ff5470', fill: '#7a2e8f' },
  { mode: 'long-practice', name: '긴 글', en: 'LONG TEXT', emoji: '📜', rim: '#29b6f6', fill: '#12406b' },
  { mode: 'knowledge-hub', name: '팡팡 지식 타자', en: 'KNOWLEDGE', emoji: '🌏', rim: '#ffd700', fill: '#1e6b3a' },
  { mode: 'mini-games', name: '미니 타자게임', en: 'MINI GAMES', emoji: '🕹️', rim: '#ff6bd6', fill: '#3b1f7a' },
  { mode: 'playground', name: '놀이터', en: 'PLAYGROUND', emoji: '🎡', rim: '#6ff6ff', fill: '#0f5a6b' },
  { mode: 'tamagotchi', name: '다마고치', en: 'TAMAGOTCHI', emoji: '🐣', rim: '#ffca28', fill: '#8a4b16' },
  { mode: 'leaderboard', name: '명예의 전당', en: 'HALL OF FAME', emoji: '🏆', rim: '#ffd700', fill: '#5a1f1f' },
];

const SIGNS: { mode: AppMode; step: string; name: string; emoji: string; gold?: boolean }[] = [
  { mode: 'word-practice', step: '2단계', name: '낱말연습', emoji: '🔤' },
  { mode: 'sentence-practice', step: '3단계', name: '짧은글', emoji: '💬' },
  { mode: 'long-practice', step: '4단계', name: '긴글연습', emoji: '📄' },
  { mode: 'knowledge-hub', step: '스페셜', name: '팡팡지식타자', emoji: '❓', gold: true },
  { mode: 'leaderboard', step: '5단계', name: '명예의전당', emoji: '🏆' },
];

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
  { mode: 'key-practice', label: '1 STAGE', name: '자리 연습', icon: '⌨️', goal: 10, x: 23, y: 79, mx: 70, my: 15 },
  { mode: 'word-practice', label: '2 STAGE', name: '낱말 연습', icon: '💣', goal: 10, x: 41, y: 76, mx: 30, my: 31 },
  { mode: 'sentence-practice', label: '3 STAGE', name: '짧은 글', icon: '👟', goal: 10, x: 43, y: 36, mx: 72, my: 47 },
  { mode: 'long-practice', label: '4 STAGE', name: '긴 글 연습', icon: '📜', goal: 5, x: 66, y: 45, mx: 30, my: 63 },
  { mode: 'knowledge-hub', label: 'SPECIAL', name: '팡팡 지식 타자', icon: '🌏', goal: 3, x: 71, y: 84, mx: 72, my: 78, kind: 'special' },
  { mode: 'leaderboard', label: '5 STAGE', name: '명예의 전당', icon: '🏆', goal: 1, x: 87.5, y: 42, mx: 44, my: 96, kind: 'arch' },
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

/* keyboard layout: [label, korean, code, width, hand] */
type Key = { l: string; k?: string; c: string; w?: number; h?: 'L' | 'R' | 'N' };
const KB: Key[][] = [
  [
    { l: '~', c: 'Backquote', h: 'L' }, { l: '1', c: 'Digit1', h: 'L' }, { l: '2', c: 'Digit2', h: 'L' }, { l: '3', c: 'Digit3', h: 'L' },
    { l: '4', c: 'Digit4', h: 'L' }, { l: '5', c: 'Digit5', h: 'L' }, { l: '6', c: 'Digit6', h: 'R' }, { l: '7', c: 'Digit7', h: 'R' },
    { l: '8', c: 'Digit8', h: 'R' }, { l: '9', c: 'Digit9', h: 'R' }, { l: '0', c: 'Digit0', h: 'R' }, { l: '-', c: 'Minus', h: 'R' },
    { l: '=', c: 'Equal', h: 'R' }, { l: '← Back', c: 'Backspace', w: 2, h: 'N' },
  ],
  [
    { l: 'Tab', c: 'Tab', w: 1.5, h: 'N' }, { l: 'Q', k: 'ㅂ', c: 'KeyQ', h: 'L' }, { l: 'W', k: 'ㅈ', c: 'KeyW', h: 'L' },
    { l: 'E', k: 'ㄷ', c: 'KeyE', h: 'L' }, { l: 'R', k: 'ㄱ', c: 'KeyR', h: 'L' }, { l: 'T', k: 'ㅅ', c: 'KeyT', h: 'L' },
    { l: 'Y', k: 'ㅛ', c: 'KeyY', h: 'R' }, { l: 'U', k: 'ㅕ', c: 'KeyU', h: 'R' }, { l: 'I', k: 'ㅑ', c: 'KeyI', h: 'R' },
    { l: 'O', k: 'ㅐ', c: 'KeyO', h: 'R' }, { l: 'P', k: 'ㅔ', c: 'KeyP', h: 'R' }, { l: '[', c: 'BracketLeft', h: 'R' },
    { l: ']', c: 'BracketRight', h: 'R' }, { l: '\\', c: 'Backslash', w: 1.5, h: 'R' },
  ],
  [
    { l: 'Caps', c: 'CapsLock', w: 1.8, h: 'N' }, { l: 'A', k: 'ㅁ', c: 'KeyA', h: 'L' }, { l: 'S', k: 'ㄴ', c: 'KeyS', h: 'L' },
    { l: 'D', k: 'ㅇ', c: 'KeyD', h: 'L' }, { l: 'F', k: 'ㄹ', c: 'KeyF', h: 'L' }, { l: 'G', k: 'ㅎ', c: 'KeyG', h: 'L' },
    { l: 'H', k: 'ㅗ', c: 'KeyH', h: 'R' }, { l: 'J', k: 'ㅓ', c: 'KeyJ', h: 'R' }, { l: 'K', k: 'ㅏ', c: 'KeyK', h: 'R' },
    { l: 'L', k: 'ㅣ', c: 'KeyL', h: 'R' }, { l: ';', c: 'Semicolon', h: 'R' }, { l: "'", c: 'Quote', h: 'R' },
    { l: 'Enter ↵', c: 'Enter', w: 2.2, h: 'N' },
  ],
  [
    { l: '⇧ Shift', c: 'ShiftLeft', w: 2.4, h: 'N' }, { l: 'Z', k: 'ㅋ', c: 'KeyZ', h: 'L' }, { l: 'X', k: 'ㅌ', c: 'KeyX', h: 'L' },
    { l: 'C', k: 'ㅊ', c: 'KeyC', h: 'L' }, { l: 'V', k: 'ㅍ', c: 'KeyV', h: 'L' }, { l: 'B', k: 'ㅠ', c: 'KeyB', h: 'L' },
    { l: 'N', k: 'ㅜ', c: 'KeyN', h: 'R' }, { l: 'M', k: 'ㅡ', c: 'KeyM', h: 'R' }, { l: ',', c: 'Comma', h: 'R' },
    { l: '.', c: 'Period', h: 'R' }, { l: '/', c: 'Slash', h: 'R' }, { l: '⇧ Shift', c: 'ShiftRight', w: 2.6, h: 'N' },
  ],
  [
    { l: 'Ctrl', c: 'ControlLeft', w: 1.6, h: 'N' }, { l: 'Alt', c: 'AltLeft', w: 1.4, h: 'N' }, { l: '', c: 'Space', w: 7.2, h: 'L' },
    { l: '한/영', c: 'AltRight', w: 1.4, h: 'N' }, { l: 'Ctrl', c: 'ControlRight', w: 1.6, h: 'N' },
  ],
];
/* demo: ㅌㅏㅈㅏㅍㅏㅇㅍㅏㅇ */
const DEMO = ['KeyX', 'KeyK', 'KeyW', 'KeyK', 'KeyV', 'KeyK', 'KeyD', 'KeyV', 'KeyK', 'KeyD'];

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
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return soundManager.getMuted();
    } catch {
      return false;
    }
  });
  const [pressed, setPressed] = useState<string | null>(null);
  const [userTyping, setUserTyping] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

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

  /* keyboard demo + live key glow */
  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      if (userTyping) return;
      setPressed(DEMO[i % DEMO.length]);
      i++;
    }, 520);
    return () => window.clearInterval(t);
  }, [userTyping]);

  useEffect(() => {
    let idle: number | undefined;
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      setUserTyping(true);
      setPressed(e.code);
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setUserTyping(false), 2500);
    };
    const up = () => setPressed(null);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.clearTimeout(idle);
    };
  }, []);

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

  const toggleSound = () => {
    try {
      setMuted(soundManager.toggleMute());
    } catch {}
  };

  const slide = (dir: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.tp-mode');
    el.scrollBy({ left: dir * ((card?.offsetWidth || 200) + 16), behavior: 'smooth' });
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
                    <span className="qm-sign-icon">{s.icon}</span>
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

            {/* 타퐁 on tracks */}
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
              <span className="qm-pouch-bag">👜</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= START SCREEN (CRT + wood board) ================= */}
      <section className="tp-space tp-crt-wrap">
        <div className="tp-planet tp-planet--a" />
        <div className="tp-planet tp-planet--b" />

        {/* top status bar */}
        <div className="tp-statusbar">
          <span className="tp-statusbar-title">타팡 · 타자팡팡 (Typing Pang Pang)</span>
          <span className="tp-sep">|</span>
          <span className="text-[#7ee06a]">LV.{stats.level}</span>
          <span className="tp-sep hidden sm:inline">|</span>
          <button type="button" onClick={toggleSound} className="hidden sm:inline tp-sound">
            8-BIT SOUND: <b className={muted ? 'text-[#ff5470]' : 'text-[#7ee06a]'}>{muted ? 'OFF' : 'ON'}</b>
          </button>
          <span className="ml-auto flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <Pixel key={i} grid={HEART} pal={HEART_PAL} size={20} />
            ))}
          </span>
        </div>

        {/* CRT billboard */}
        <div className="tp-billboard">
          <div className="tp-scan" />
          {['A', ';', 'F', 'K', 'L', 'A', 'S', 'D', 'F', 'J', 'L'].map((k, i) => (
            <span key={i} className={`tp-floatkey tp-floatkey--${i}`}>
              {k}
            </span>
          ))}

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] items-center gap-4 px-4 sm:px-10 py-8 sm:py-10">
            <div className="flex flex-col items-center">
              <span className="tp-mini-tag">타팡</span>
              <div className="tp-logo-box">
                <Pixel grid={BOLT} pal={BOLT_PAL} size={34} className="tp-bolt tp-bolt--l" />
                <Pixel grid={BOLT} pal={BOLT_PAL} size={34} className="tp-bolt tp-bolt--r" />
                <span className="tp-burst" />
                <h1 className="tp-logo">
                  <span className="tp-logo-a" data-text="타자">
                    타자
                  </span>
                  <span className="tp-logo-b" data-text="팡팡">
                    팡팡
                  </span>
                </h1>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <TvBot size={150} bubble="READY, SET, TYPE! 팡팡!" bubbleSide="top" className="tp-bob" />
              <button
                type="button"
                onClick={() => (currentUser ? go('key-practice') : onOpenAuth())}
                className="tp-press-start"
              >
                [ PRESS START ]
              </button>
            </div>
          </div>
        </div>

        {/* posts + wooden carousel board */}
        <div className="tp-posts">
          <span />
          <span />
        </div>
        <div className="tp-woodboard">
          <span className="tp-rivet tp-rivet--tl" />
          <span className="tp-rivet tp-rivet--tr" />
          <span className="tp-rivet tp-rivet--bl" />
          <span className="tp-rivet tp-rivet--br" />
          <button type="button" className="tp-arrow" aria-label="이전" onClick={() => slide(-1)}>
            ◀
          </button>
          <div ref={carouselRef} className="tp-carousel no-scrollbar">
            {CAROUSEL.map((c) => (
              <button
                key={c.mode}
                type="button"
                onClick={() => go(c.mode)}
                className="tp-mode"
                style={{ ['--rim' as any]: c.rim, ['--fill' as any]: c.fill }}
              >
                <span className="tp-mode-icon">{c.emoji}</span>
                <span className="tp-mode-name">{c.name}</span>
                <span className="tp-mode-en">({c.en})</span>
              </button>
            ))}
          </div>
          <button type="button" className="tp-arrow" aria-label="다음" onClick={() => slide(1)}>
            ▶
          </button>
        </div>
      </section>

      {/* ================= NEON KEYBOARD + STAGE SIGNS ================= */}
      <section className="tp-monitor">
        <div className="tp-hud-plank">
          <span>
            <b>PLAYER:</b> {playerName}
            {playerTitle ? ` (${playerTitle})` : ''}
          </span>
          <span>
            <b>SCORE:</b> {points.toLocaleString()} P
          </span>
          <span className="hidden sm:inline">
            <b>SPEED:</b> {stats.top} CPM
          </span>
          <span className="hidden md:inline">
            <b>ACCURACY:</b> {stats.acc.toFixed(0)}%
          </span>
          <span className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <Pixel key={i} grid={HEART} pal={HEART_PAL} size={20} />
            ))}
          </span>
          {!currentUser && (
            <button type="button" className="tp-hud-login" onClick={onOpenAuth}>
              LOGIN
            </button>
          )}
        </div>

        <div className="tp-monitor-screen">
          <div className="tp-scan" />
          <div className="relative z-10 flex flex-col items-center gap-5 px-3 sm:px-8 pt-7 pb-8">
            <div className="tp-neon-hello">
              안녕하세요, <span>타자팡팡</span>입니다!
            </div>

            <div className="relative w-full flex items-end justify-center gap-4">
              <div className="tp-kb" role="img" aria-label="네온 키보드">
                {KB.map((row, ri) => (
                  <div key={ri} className="tp-kb-row">
                    {row.map((key) => (
                      <span
                        key={key.c}
                        className={`tp-key tp-key--${key.h || 'N'} ${pressed === key.c ? 'is-on' : ''} ${
                          key.c === 'KeyF' || key.c === 'KeyJ' ? 'is-home' : ''
                        }`}
                        style={{ flexGrow: key.w || 1 }}
                      >
                        <span className="tp-key-l">{key.l}</span>
                        {key.k && <span className="tp-key-k">{key.k}</span>}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
              <div className="hidden lg:block">
                <TvBot size={96} bubble={currentUser ? `화이팅! ${currentUser.name}!` : '화이팅!'} bubbleSide="top" className="tp-wave" />
              </div>
            </div>

            <button type="button" className="tp-scroll-btn" onClick={() => go('key-practice')}>
              <span>1단계: 자리연습</span>
            </button>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-7 w-full pt-3">
              {SIGNS.map((s) => (
                <button key={s.mode} type="button" onClick={() => go(s.mode)} className={`tp-sign ${s.gold ? 'is-gold' : ''}`}>
                  <span className="tp-sign-hook tp-sign-hook--l" />
                  <span className="tp-sign-hook tp-sign-hook--r" />
                  <span className="tp-sign-icon">{s.emoji}</span>
                  <span className="tp-sign-text">
                    {s.step}:
                    <br />
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
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
      <TvBot size={78} bubble="또 만나요!" bubbleSide="right" className="tp-wave" />
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
