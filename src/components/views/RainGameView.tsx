import React, { useState, useEffect, useRef } from 'react';
import { GAME_POINTS } from '../../utils/pointRules';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/sound';
import { UserSession, LeaderboardEntry } from '../../types';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  Heart, 
  Flame, 
  Award, 
  CloudRain, 
  Play, 
  Lock,
  Zap,
  ShieldAlert,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface RainGameViewProps {
  currentUser: UserSession | null;
  onRecordScore: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  onBack?: () => void;
}

interface RainDrop {
  id: number;
  word: string;
  x: number; // percentage 5% to 85%
  y: number; // percentage 0% to 100%
  speed: number;
  color: string;
  isHit?: boolean;
}

const RAIN_WORDS_POOL = [
  '비구름', '무지개', '소나기', '이슬비', '빗방울', '우산', '장화', '달팽이', '개구리', 
  '연못', '바다', '시냇물', '물방울', '파도', '조개', '물고기', '바람', '햇살', '초록숲',
  '하늘', '은하수', '별똥별', '단풍잎', '민들레', '해바라기', '코스모스', '수련', '백합'
];

export const RainGameView: React.FC<RainGameViewProps> = ({
  currentUser,
  onRecordScore,
  onBack,
}) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [destroyedCount, setDestroyedCount] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [drops, setDrops] = useState<RainDrop[]>([]);
  const dropsRef = useRef<RainDrop[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(5);
    setCombo(0);
    setMaxCombo(0);
    setDestroyedCount(0);
    setInputVal('');
    dropsRef.current = [];
    setDrops([]);
    lastSpawnTimeRef.current = Date.now();
    lastRenderTimeRef.current = performance.now();
    inputRef.current?.focus();
  };

  // Main rain animation and spawn loop
  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTick = performance.now();

    const loop = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTick) / 1000, 0.1);
      lastTick = currentTime;

      const now = Date.now();
      const spawnInterval = level === 1 ? 2200 : level === 2 ? 1600 : 1100;

      const currentDrops = [...dropsRef.current];

      // Spawn rain drop
      if (now - lastSpawnTimeRef.current > spawnInterval && currentDrops.length < 8) {
        lastSpawnTimeRef.current = now;
        const randomWord = RAIN_WORDS_POOL[Math.floor(Math.random() * RAIN_WORDS_POOL.length)];
        const colors = [
          'from-sky-400 to-blue-500 border-sky-300 text-white',
          'from-pink-400 to-rose-500 border-pink-300 text-white',
          'from-teal-400 to-emerald-500 border-teal-300 text-white',
          'from-purple-400 to-indigo-500 border-purple-300 text-white',
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        currentDrops.push({
          id: Date.now() + Math.random(),
          word: randomWord,
          x: Math.floor(Math.random() * 75) + 8, // 8% to 83%
          y: 0,
          speed: (level === 1 ? 9 : level === 2 ? 14 : 20) + Math.random() * 4,
          color: randomColor,
        });
      }

      // Move drops down & track missed count
      let missedCount = 0;
      const nextDrops: RainDrop[] = [];

      for (const drop of currentDrops) {
        if (drop.isHit) continue;

        const nextY = drop.y + drop.speed * delta;

        if (nextY >= 88) {
          missedCount++;
        } else {
          nextDrops.push({ ...drop, y: nextY });
        }
      }

      dropsRef.current = nextDrops;

      // Throttle React state updates to ~30 FPS (every ~33ms) to prevent CPU lag and browser freezing
      if (currentTime - lastRenderTimeRef.current >= 33) {
        lastRenderTimeRef.current = currentTime;
        setDrops(nextDrops);
      }

      if (missedCount > 0) {
        soundManager.playError();
        setCombo(0);
        setLives((l) => {
          const nextL = Math.max(0, l - missedCount);
          if (nextL <= 0) {
            setTimeout(() => handleGameOver(), 0);
          }
          return nextL;
        });
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, isGameOver, level]);

  const destroyDrop = (target: typeof drops[0]) => {
    // Vaporize drop!
    soundManager.playRainHit();
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setMaxCombo((prev) => Math.max(prev, nextCombo));

    const earned = (level * 80) + nextCombo * 20;
    setScore((s) => s + earned);
    setDestroyedCount((c) => c + 1);

    if (nextCombo >= 3) {
      soundManager.playCombo(nextCombo);
    }

    dropsRef.current = dropsRef.current.map((d) => (d.id === target.id ? { ...d, isHit: true } : d));
    setDrops([...dropsRef.current]);

    setInputVal('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const trimmed = val.trim();

    if (!trimmed) {
      setInputVal(val);
      return;
    }

    // Check if trimmed matches any falling raindrop
    // Priority to drop closest to ground (highest y)
    const matchingDrops = drops.filter((d) => !d.isHit && d.word === trimmed);

    if (matchingDrops.length > 0) {
      matchingDrops.sort((a, b) => b.y - a.y);
      destroyDrop(matchingDrops[0]);
      return;
    }

    // Check maximum word length of active drops
    const activeDrops = drops.filter((d) => !d.isHit);
    const maxActiveLen = activeDrops.length > 0 ? Math.max(...activeDrops.map((d) => d.word.length)) : 6;

    // If typed length exceeds longest active falling drop length, reset immediately
    if (val.length > maxActiveLen) {
      soundManager.playError();
      setInputVal('');
      return;
    }

    setInputVal(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (!trimmed) return;

      const matchingDrops = drops.filter((d) => !d.isHit && d.word === trimmed);
      if (matchingDrops.length > 0) {
        matchingDrops.sort((a, b) => b.y - a.y);
        destroyDrop(matchingDrops[0]);
      } else {
        soundManager.playError();
        setInputVal('');
      }
    }
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    soundManager.playError();

    const earnedPoints = Math.min(150, Math.max(15, Math.round(score / 50)));
    addTypingPracticePoints(GAME_POINTS, `타자비 방어 (${score}점)`);
    dailyMissionsManager.incrementProgress('game', 1, currentUser?.id);

    if (currentUser && score > 200) {
      onRecordScore({
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '🌧️',
        mode: 'rain-game',
        modeTitle: `타자비 방어 (${level}단계)`,
        score: score,
        cpm: Math.round((destroyedCount * 60) / 2),
        accuracy: 100,
        details: `빗방울 ${destroyedCount}개 방어 성공 (최대 ${maxCombo}콤보)`,
      });
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#0c182c] p-2 sm:p-4 overflow-y-auto flex flex-col space-y-3 animate-in fade-in'
          : 'space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto'
      }
    >
      {/* Top Navigation & Controls Bar */}
      <div className="mg-topbar flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                if (isFullscreen) setIsFullscreen(false);
                onBack();
              }}
              className="tp-rpg-btn tp-rpg-btn--wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#ffe066]" />
              <span>미니게임 목록</span>
            </button>
          )}

          <span className="font-arcade font-black text-sm text-[#2c1507]">
            산성비 (단어 소나기)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundManager.play('pop');
              setIsFullscreen(!isFullscreen);
            }}
            className="tp-rpg-btn tp-rpg-btn--gold flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? '창 복원' : '전체보기 전환'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="mg-banner p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6e3d18]">
            <span>비구름 아래 마을 수비 타자</span>
            {!currentUser && (
              <>
                <span aria-hidden="true">·</span>
                <span>비로그인 자유 플레이</span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#2c1507] tracking-tight mt-0.5 font-arcade">
            산성비 (단어 소나기)
          </h1>
          <p className="text-xs sm:text-sm text-[#5c3314] font-medium">
            비구름에서 떨어지는 빗방울 단어가 마을에 닿기 전에 빠르게 입력해 막아 내세요!
          </p>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <div className="flex items-center p-1 bg-[#e8cfa0] rounded-xl border-2 border-[#5c3314]">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setLevel(lvl as 1 | 2 | 3);
                  if (isPlaying) startGame();
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  level === lvl
                    ? 'bg-[#1d4ed8] text-white shadow-xs'
                    : 'text-[#3b1e08] hover:bg-[#f6e5c3]'
                }`}
              >
                {lvl === 1 ? '1단계 (온화한 비)' : lvl === 2 ? '2단계 (소나기)' : '3단계 (폭풍우)'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startGame}
            className="tp-rpg-btn tp-rpg-btn--gold px-5 py-2.5 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? '다시하기' : '게임 시작'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Arena (16-bit Pixel Rainy Village) */}
      <div className="mg-stage relative rounded-2xl overflow-hidden border-4 border-[#2c1507] shadow-2xl p-3.5 sm:p-5 bg-[#122646] min-h-[460px] flex flex-col justify-between select-none">
        <img
          src="./assets/minigames/bg-rain.webp"
          alt=""
          aria-hidden="true"
          className="mg-stage-bg"
          referrerPolicy="no-referrer"
          draggable={false}
        />
        <div className="mg-stage-scrim mg-stage-scrim--rain" aria-hidden="true" />

        {/* HUD Info Bar */}
        <div className="relative z-20 mg-hud-bar flex items-center justify-between flex-wrap gap-2 p-3 sm:px-4">
          {/* Lives */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-[#fff4d4] mr-1">마을 방어력:</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-transform ${
                  i < lives
                    ? 'text-rose-400 fill-rose-500 scale-100'
                    : 'text-slate-600 fill-slate-700 scale-90'
                }`}
              />
            ))}
          </div>

          {/* Score & Combo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1 text-[#ffe066] font-black text-xs sm:text-sm tabular-nums">
              <Flame className="w-4 h-4 fill-[#ff9f1c] text-[#ffe066]" />
              <span>{combo} COMBO</span>
            </div>
            <div className="bg-[#fdf5dd] text-[#2c1507] font-mono tabular-nums text-sm sm:text-base font-black px-3.5 py-1 rounded-lg border-2 border-[#2c1507]">
              {score.toLocaleString()} 점
            </div>
          </div>
        </div>

        {/* Rain Falling Stage Canvas Area */}
        <div className="relative z-10 flex-1 min-h-[300px] overflow-hidden my-2">
          {drops.map((drop) => {
            if (drop.isHit) {
              return (
                <div
                  key={drop.id}
                  className="absolute text-lg sm:text-xl font-black text-[#ffe066] drop-shadow-[0_2px_0_#1a1008] pointer-events-none"
                  style={{ left: `${drop.x}%`, top: `${drop.y}%` }}
                >
                  ⚡ ZAP!
                </div>
              );
            }

            const isPrefixMatch = Boolean(inputVal.trim() && drop.word.startsWith(inputVal.trim()));

            return (
              <div
                key={drop.id}
                className="absolute pointer-events-none"
                style={{
                  left: `${drop.x}%`,
                  top: `${drop.y}%`,
                }}
              >
                <div
                  className={`px-3 py-1 rounded-lg border-2 flex items-center gap-1 font-black text-xs sm:text-sm tracking-wide shadow-[0_3px_0_rgba(12,18,36,0.85)] ${
                    isPrefixMatch
                      ? 'bg-[#ffe066] text-[#261106] border-[#261106] scale-105'
                      : `bg-gradient-to-b ${drop.color} border-[#101c33]`
                  }`}
                >
                  <span aria-hidden="true">💧</span>
                  <span className={isPrefixMatch ? '' : 'drop-shadow-[0_1.5px_0_rgba(0,0,0,0.85)]'}>
                    {drop.word}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ground Defense Base Barrier */}
        <div className="relative z-20 bg-[#1b2944]/88 px-3 py-2 rounded-xl border-2 border-[#7ea8d8] flex items-center justify-between text-[#f0f7ff] text-xs font-black">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#ffe066] shrink-0" />
            <span>마을 방어선 (빗방울이 닿으면 방어력이 줄어들어요)</span>
          </div>
          <span className="bg-[#2c1507]/85 text-[#ffe066] px-2.5 py-0.5 rounded border border-[#c68646] tabular-nums whitespace-nowrap ml-2">
            격추: {destroyedCount}개
          </span>
        </div>

        {/* Game Over / Start Prompt Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-[#0d172a]/78 flex flex-col items-center justify-center p-5 text-center z-30 animate-in fade-in">
            <div className="mg-overlay-card max-w-sm w-full">
              <div className="text-3xl mb-1">{isGameOver ? '🌧️' : '🛡️'}</div>
              <h3 className="text-2xl font-black text-[#2c1507] font-arcade">
                {isGameOver ? '마을 방어 종료!' : '산성비 (단어 소나기)'}
              </h3>
              <p className="text-xs sm:text-sm text-[#4a2810] font-bold mt-1.5 leading-relaxed">
                {isGameOver
                  ? `빗방울이 마을에 닿아 방어력이 모두 소진되었습니다! 최종 점수: ${score.toLocaleString()}점`
                  : '비구름에서 떨어지는 빗방울 단어를 빠르게 타이핑해 마을을 지켜 내세요!'}
              </p>

              <button
                type="button"
                onClick={startGame}
                className="mt-4 tp-rpg-btn tp-rpg-btn--gold px-7 py-3 font-black text-sm cursor-pointer"
              >
                {isGameOver ? '다시 도전하기' : '게임 시작하기'}
              </button>
            </div>
          </div>
        )}

        {/* Typing Input Box */}
        <div className="relative z-20 mt-3 mg-input-bar p-3 flex flex-col sm:flex-row items-center gap-2.5">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isPlaying || isGameOver}
            placeholder={isPlaying ? '떨어지는 빗방울 단어를 입력하세요!' : '게임 시작 버튼을 누르세요'}
            className="w-full text-center sm:text-left px-4 py-2.5 text-lg font-black rounded-lg border-3 border-[#4a2810] focus:border-[#1d4ed8] outline-hidden bg-[#fffdf7] text-[#261106] placeholder-[#947252] shadow-inner font-arcade"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          <button
            type="button"
            onClick={() => {
              setInputVal('');
              inputRef.current?.focus();
            }}
            className="tp-rpg-btn tp-rpg-btn--wood px-5 py-2.5 font-black text-sm whitespace-nowrap cursor-pointer"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
};
