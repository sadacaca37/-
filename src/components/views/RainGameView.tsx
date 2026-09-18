import React, { useState, useEffect, useRef } from 'react';
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
    addTypingPracticePoints(earnedPoints, `타자비 방어 (${score}점)`);
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
          ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 p-2 sm:p-4 overflow-y-auto flex flex-col space-y-3 animate-in fade-in'
          : 'space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto'
      }
    >
      {/* Top Navigation & Controls Bar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border-2 border-sky-300 shadow-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                soundManager.play('click');
                if (isFullscreen) setIsFullscreen(false);
                onBack();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-600" />
              <span>미니게임 목록</span>
            </button>
          )}

          <span className="font-arcade font-black text-sm text-slate-800 flex items-center gap-1.5">
            <span>🌧️</span>
            <span>타자비 방어</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.play('pop');
              setIsFullscreen(!isFullscreen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? '창 복원' : '전체보기 전환'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-sky-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 arcade-card-glow">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-black border border-sky-300 flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-sky-600" />
              <span>신규 아케이드 타자 게임</span>
            </span>
            {!currentUser && (
              <span className="text-[11px] font-bold text-slate-400">
                (비로그인 자유 플레이)
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 font-arcade">
            🌧️ 타자비 (Word Rain Defense)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            하늘에서 쏟아지는 빗방울 단어를 바닥에 닿기 전에 신속하게 방어하세요!
          </p>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex items-center p-1 bg-sky-50 rounded-2xl border border-sky-200">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevel(lvl as 1 | 2 | 3);
                  if (isPlaying) startGame();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  level === lvl
                    ? 'bg-sky-500 text-white shadow-xs scale-105'
                    : 'text-sky-800 hover:bg-sky-100'
                }`}
              >
                {lvl === 1 ? '1단계 (온화한 비)' : lvl === 2 ? '2단계 (소나기)' : '3단계 (폭풍우)'}
              </button>
            ))}
          </div>

          <button
            onClick={startGame}
            className="px-5 py-2.5 rounded-2xl arcade-btn-sky text-sky-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-sky-900" />}
            <span>{isPlaying ? '다시하기' : '게임 시작'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Arena */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-slate-900 via-indigo-950 to-sky-950 p-4 sm:p-6 border-4 border-sky-300 shadow-2xl min-h-[460px] flex flex-col justify-between select-none">
        {/* HUD Info Bar */}
        <div className="flex items-center justify-between bg-white/15 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-md z-20">
          {/* Lives */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-sky-200 mr-1">도시 방어력:</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-transform ${
                  i < lives
                    ? 'text-rose-400 fill-rose-400 scale-100'
                    : 'text-slate-600 fill-slate-700 scale-90'
                }`}
              />
            ))}
          </div>

          {/* Score & Combo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-yellow-300 font-black text-xs sm:text-sm">
              <Flame className="w-4 h-4 fill-yellow-300 animate-bounce" />
              <span>{combo} COMBO</span>
            </div>
            <div className="bg-sky-500 text-white font-mono text-sm sm:text-base font-black px-4 py-1 rounded-xl shadow-inner border border-sky-300">
              {score.toLocaleString()} 점
            </div>
          </div>
        </div>

        {/* Rain Falling Stage Canvas Area */}
        <div className="relative flex-1 min-h-[300px] overflow-hidden my-2">
          {drops.map((drop) => {
            if (drop.isHit) {
              return (
                <div
                  key={drop.id}
                  className="absolute text-xl sm:text-2xl font-black text-yellow-300 animate-ping pointer-events-none"
                  style={{ left: `${drop.x}%`, top: `${drop.y}%` }}
                >
                  ⚡ ZAP!
                </div>
              );
            }

            return (
              <div
                key={drop.id}
                className="absolute transition-transform pointer-events-none"
                style={{
                  left: `${drop.x}%`,
                  top: `${drop.y}%`,
                }}
              >
                <div className={`px-3 py-1.5 rounded-2xl bg-gradient-to-b ${drop.color} border-2 shadow-lg flex items-center gap-1 font-black text-xs sm:text-sm tracking-wide animate-pulse`}>
                  <span>💧</span>
                  <span>{drop.word}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ground Defense Base Barrier */}
        <div className="relative z-10 bg-gradient-to-r from-sky-500 via-teal-400 to-indigo-500 p-2.5 rounded-2xl border-2 border-white/40 shadow-inner flex items-center justify-between text-white text-xs font-black">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-yellow-200" />
            <span>하단 방어선 (빗방울이 닿으면 피해를 입습니다)</span>
          </div>
          <span className="bg-white/20 px-2 py-0.5 rounded-lg">
            격추: {destroyedCount}개
          </span>
        </div>

        {/* Game Over / Start Prompt Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-sky-400 text-sky-950 flex items-center justify-center text-3xl mb-3 shadow-lg animate-bounce">
              {isGameOver ? '🌧️' : '🎮'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-sky-300 font-arcade">
              {isGameOver ? '방어선 침몰!' : '타자비 게임 (Word Rain Defense)'}
            </h3>
            <p className="text-xs text-slate-200 mt-1 max-w-sm">
              {isGameOver
                ? `빗방울이 바닥에 닿아 방어력이 소진되었습니다! 최종 점수: ${score.toLocaleString()}점`
                : '하늘에서 떨어지는 빗방울 단어를 빠르게 타이핑하여 레이저 빔으로 격추하세요!'}
            </p>

            <button
              onClick={startGame}
              className="mt-5 px-8 py-3.5 rounded-2xl arcade-btn-sky text-sky-950 font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {isGameOver ? '다시 도전하기' : '게임 시작하기'}
            </button>
          </div>
        )}

        {/* Typing Input Box */}
        <div className="mt-3 bg-white/95 backdrop-blur-xs p-3 rounded-2xl border-2 border-sky-300 shadow-lg flex flex-col sm:flex-row items-center gap-3 z-20">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isPlaying || isGameOver}
            placeholder={isPlaying ? '떨어지는 빗방울 단어를 입력하세요!' : '게임 시작 버튼을 누르세요'}
            className="w-full text-center sm:text-left pl-4 pr-4 py-2.5 text-lg font-black rounded-xl border-2 border-sky-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 outline-hidden bg-sky-50/50 text-slate-800 placeholder-slate-400 shadow-inner font-arcade"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          <button
            onClick={() => {
              setInputVal('');
              inputRef.current?.focus();
            }}
            className="px-6 py-2.5 rounded-xl arcade-btn-sky text-sky-950 font-black text-sm shadow-md whitespace-nowrap"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
};
