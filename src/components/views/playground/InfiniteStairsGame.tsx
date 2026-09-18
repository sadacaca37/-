import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, RotateCcw, Trophy, Zap, Sparkles } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface InfiniteStairsGameProps {
  onBack?: () => void;
  currentUser?: any;
}

interface Stair {
  id: number;
  x: number; // grid x position relative to origin
  y: number; // stair step number (0, 1, 2...)
}

const CHARACTERS = [
  { id: 'business', name: '김과장 (비즈니스맨)', emoji: '👨‍💼', desc: '서류가방을 든 샐러리맨', color: '#2563eb' },
  { id: 'student', name: '열혈 학생', emoji: '🏃‍♂️', desc: '전력질주 학생', color: '#3b82f6' },
  { id: 'cheerleader', name: '치어리더', emoji: '👱‍♀️', desc: '경쾌한 응원', color: '#ec4899' },
  { id: 'cat', name: '점핑 냥이', emoji: '🐱', desc: '귀여운 고양이', color: '#f59e0b' },
];

export const InfiniteStairsGame: React.FC<InfiniteStairsGameProps> = ({ onBack }) => {
  const [stairs, setStairs] = useState<Stair[]>([]);
  const [characterIndex, setCharacterIndex] = useState<number>(0);
  const [coins, setCoins] = useState<number>(600);
  const [gems, setGems] = useState<number>(0);

  // Player state
  const [playerStep, setPlayerStep] = useState<number>(0);
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
  const [playerX, setPlayerX] = useState<number>(0);

  // Game state
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [stamina, setStamina] = useState<number>(100);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('infinite_stairs_high') || '0');
    } catch {
      return 0;
    }
  });

  const nextStairIdRef = useRef<number>(1);
  const staminaTimerRef = useRef<number | null>(null);

  // Generate stairs ahead
  const generateInitialStairs = () => {
    const list: Stair[] = [{ id: 0, x: 0, y: 0 }];
    let curX = 0;
    let curDir: 'left' | 'right' = 'right';

    for (let i = 1; i <= 60; i++) {
      // 40% chance of turning direction
      if (Math.random() < 0.38) {
        curDir = curDir === 'right' ? 'left' : 'right';
      }
      curX += curDir === 'right' ? 1 : -1;
      list.push({ id: i, x: curX, y: i });
    }
    nextStairIdRef.current = 61;
    return list;
  };

  const startGame = () => {
    const initialStairs = generateInitialStairs();
    setStairs(initialStairs);
    setPlayerStep(0);
    setPlayerFacing('right');
    setPlayerX(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setStamina(100);
    setGameState('playing');
    soundManager.playSuccess();
  };

  // Stamina countdown loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setStamina((prev) => {
        // Decrease faster as score goes up
        const drain = 1.2 + Math.min(3.5, score * 0.025);
        const next = prev - drain;
        if (next <= 0) {
          handleGameOver('시간 초과! 체력이 다 떨어졌습니다.');
          return 0;
        }
        return next;
      });
    }, 50);

    staminaTimerRef.current = interval as any;
    return () => clearInterval(interval);
  }, [gameState, score]);

  const handleGameOver = (reason?: string) => {
    setGameState('gameover');
    soundManager.playError();
  };

  // Step action: climb or turn
  const takeAction = useCallback(
    (action: 'climb' | 'turn') => {
      if (gameState !== 'playing') return;

      let newFacing = playerFacing;
      if (action === 'turn') {
        newFacing = playerFacing === 'right' ? 'left' : 'right';
        setPlayerFacing(newFacing);
      }

      const nextX = playerX + (newFacing === 'right' ? 1 : -1);
      const nextStep = playerStep + 1;

      // Find the expected stair at nextStep
      const expectedStair = stairs.find((s) => s.y === nextStep);

      if (!expectedStair || expectedStair.x !== nextX) {
        // Misstep! Fell off the stairs
        handleGameOver('계단에서 헛디뎌 떨어졌습니다!');
        return;
      }

      // Success!
      soundManager.playClick();
      setPlayerX(nextX);
      setPlayerStep(nextStep);
      const newScore = score + 1;
      setScore(newScore);

      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      // Refill stamina slightly
      setStamina((prev) => Math.min(100, prev + 12));

      // Check high score
      if (newScore > highScore) {
        setHighScore(newScore);
        try {
          localStorage.setItem('infinite_stairs_high', String(newScore));
        } catch {}
      }

      // Dynamically append stairs if close to end
      if (nextStep + 25 >= stairs.length) {
        setStairs((prev) => {
          const last = prev[prev.length - 1];
          let curX = last.x;
          let curDir: 'left' | 'right' = Math.random() > 0.5 ? 'right' : 'left';
          const newBatch: Stair[] = [];

          for (let i = 1; i <= 40; i++) {
            if (Math.random() < 0.38) {
              curDir = curDir === 'right' ? 'left' : 'right';
            }
            curX += curDir === 'right' ? 1 : -1;
            const newY = last.y + i;
            newBatch.push({ id: nextStairIdRef.current++, x: curX, y: newY });
          }
          return [...prev, ...newBatch];
        });
      }
    },
    [gameState, playerFacing, playerX, playerStep, stairs, score, combo, highScore]
  );

  // Keyboard controls:
  // Space or K or Up = Climb (오르기)
  // Left/Right or J or Z = Turn (방향 전환)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.code === 'Space' && (gameState === 'idle' || gameState === 'gameover')) {
          e.preventDefault();
          startGame();
        }
        return;
      }

      if (e.code === 'Space' || e.code === 'KeyK' || e.code === 'ArrowUp') {
        e.preventDefault();
        takeAction('climb');
      } else if (
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyJ' ||
        e.code === 'KeyZ'
      ) {
        e.preventDefault();
        takeAction('turn');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, takeAction]);

  const activeChar = CHARACTERS[characterIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>놀이터 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🪜</span>
          <h1 className="text-xl sm:text-2xl font-black font-arcade text-white tracking-wider">
            무한의 계단 (Infinite Stairs)
          </h1>
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono font-black text-amber-400">
            {highScore} 층
          </span>
        </div>
      </div>

      {/* Main Game Stage Frame matching Capture 3 */}
      <div className="relative w-full max-w-md h-[560px] bg-[#3B1214] rounded-3xl border-4 border-[#F59E0B] shadow-2xl overflow-hidden flex flex-col justify-between p-3.5">
        {/* Retro Brick Wall with Apartment Windows (Matches Capture 3) */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="grid grid-cols-4 gap-4 p-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-10 bg-[#1E293B] rounded-xs border-2 border-[#0F172A] opacity-70 flex items-center justify-center">
                <div className="w-1/2 h-1/2 bg-[#FEF08A]/20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Capture 3 Top Banner: "INFINITE 무한의 계단" */}
        <div className="relative z-20 flex flex-col items-center">
          <div className="px-5 py-1 rounded-xl bg-gradient-to-b from-[#FDE047] via-[#EAB308] to-[#CA8A04] border-2 border-amber-200 shadow-md flex items-center gap-2">
            <span className="text-[10px] font-black tracking-widest text-[#78350F] uppercase">INFINITE</span>
            <span className="text-sm font-black text-amber-950 font-arcade">무한의 계단</span>
          </div>

          {/* Top HUD: Score & Coins/Gems (Matches Capture 3) */}
          <div className="w-full flex items-center justify-between mt-2 px-1">
            {/* Left: Score font */}
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-[#38BDF8] font-mono tracking-tight drop-shadow-md">
                {score}
              </span>
              <span className="text-xs font-bold text-amber-300 font-arcade">층</span>
            </div>

            {/* Right: Coins and Gems */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full border border-amber-400/40 text-xs font-bold text-amber-300">
                <span>🪙</span>
                <span className="font-mono font-black">{coins}</span>
                <span className="text-amber-400 text-[10px] font-black">+</span>
              </div>
              <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full border border-sky-400/40 text-xs font-bold text-sky-300">
                <span>💎</span>
                <span className="font-mono font-black">{gems}</span>
                <span className="text-sky-400 text-[10px] font-black">+</span>
              </div>
            </div>
          </div>

          {/* Stamina Timer Bar */}
          <div className="w-full bg-slate-950/80 h-2.5 mt-2 rounded-full border border-amber-900/60 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-75 rounded-full ${
                stamina > 50
                  ? 'bg-gradient-to-r from-emerald-400 to-amber-400'
                  : stamina > 25
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500'
                  : 'bg-rose-600 animate-pulse'
              }`}
              style={{ width: `${stamina}%` }}
            />
          </div>
        </div>

        {/* Stairs World Canvas (Perspective Centered on Player) */}
        <div className="relative flex-1 w-full overflow-hidden flex items-end justify-center my-2">
          <div
            className="absolute transition-transform duration-100 ease-out"
            style={{
              bottom: '100px',
              left: '50%',
              transform: `translate(calc(-50% - ${playerX * 42}px), ${playerStep * 30}px)`
            }}
          >
            {/* Render 3D Stone Stairs with grip dots (Matches Capture 3) */}
            {stairs
              .filter((s) => s.y >= Math.max(0, playerStep - 4) && s.y <= playerStep + 16)
              .map((stair) => {
                const isPassed = stair.y < playerStep;
                const isCurrent = stair.y === playerStep;

                return (
                  <div
                    key={stair.id}
                    className="absolute"
                    style={{
                      left: `${stair.x * 42}px`,
                      bottom: `${stair.y * 30}px`,
                      width: '56px',
                      height: '24px'
                    }}
                  >
                    {/* 3D Concrete Stone Stair Block with circular grip dots */}
                    <div
                      className={`w-full h-full rounded-md border-b-4 border-r-2 transition-all shadow-lg flex flex-col justify-between p-0.5 ${
                        isCurrent
                          ? 'bg-[#FDE047] border-[#B45309] shadow-amber-500/50'
                          : isPassed
                          ? 'bg-[#94A3B8] border-[#475569] opacity-70'
                          : stair.y % 10 === 0
                          ? 'bg-[#34D399] border-[#047857]'
                          : 'bg-[#E2E8F0] border-[#64748B]'
                      }`}
                    >
                      {/* Top Surface Grip Dots */}
                      <div className="flex justify-around items-center px-1 pt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500/30"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500/30"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500/30"></div>
                      </div>

                      {stair.y % 10 === 0 && (
                        <span className="text-[9px] font-black text-emerald-950 font-mono text-center">
                          {stair.y}F
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Player Character: Business Man & Corgi Dog (Matches Capture 3) */}
            <div
              className="absolute transition-all duration-100 ease-out z-30 flex items-center gap-1"
              style={{
                left: `${playerX * 42 + 2}px`,
                bottom: `${playerStep * 30 + 20}px`,
                transform: playerFacing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
              }}
            >
              {/* Business Man */}
              <div className="text-3xl drop-shadow-xl filter animate-bounce">
                {activeChar.emoji}
              </div>
              {/* Pet Companion (Corgi dog from Capture 3) */}
              <div className="text-xl drop-shadow-md">
                🐕
              </div>
            </div>
          </div>
        </div>

        {/* Character Selector (in idle) */}
        {gameState === 'idle' && (
          <div className="relative z-30 flex items-center justify-center gap-2 mb-2">
            {CHARACTERS.map((char, idx) => (
              <button
                key={char.id}
                onClick={() => setCharacterIndex(idx)}
                className={`p-2 rounded-2xl border-2 transition cursor-pointer text-xl ${
                  characterIndex === idx
                    ? 'bg-amber-400 border-white scale-110 shadow-lg'
                    : 'bg-slate-900 border-slate-700 opacity-60 hover:opacity-100'
                }`}
                title={char.name}
              >
                {char.emoji}
              </button>
            ))}
          </div>
        )}

        {/* 2 Big 3D Arcade Buttons Matching Capture 3 */}
        <div className="relative z-30 grid grid-cols-2 gap-3 pt-2">
          {/* Left Button: 방향 전환 ↺ (Blue/Cyan 3D) */}
          <button
            onClick={() => takeAction('turn')}
            disabled={gameState !== 'playing'}
            className="py-4 px-3 rounded-2xl bg-gradient-to-b from-[#0284C7] to-[#0369A1] hover:from-[#0EA5E9] hover:to-[#0284C7] active:translate-y-1 border-b-6 border-[#075985] text-white font-black text-sm shadow-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40"
          >
            <div className="flex items-center gap-1.5 text-base sm:text-lg">
              <span className="text-xl">↺</span>
              <span>방향 전환</span>
            </div>
            <span className="text-[10px] text-sky-200 font-mono font-normal">
              [← / →] or [J]
            </span>
          </button>

          {/* Right Button: 계단 오르기 ↑ (Fiery Orange/Red 3D) */}
          <button
            onClick={() => takeAction('climb')}
            disabled={gameState !== 'playing'}
            className="py-4 px-3 rounded-2xl bg-gradient-to-b from-[#EA580C] to-[#C2410C] hover:from-[#F97316] hover:to-[#EA580C] active:translate-y-1 border-b-6 border-[#9A3412] text-white font-black text-sm shadow-xl flex flex-col items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40"
          >
            <div className="flex items-center gap-1.5 text-base sm:text-lg">
              <span className="text-xl">↑</span>
              <span>계단 오르기</span>
            </div>
            <span className="text-[10px] text-amber-200 font-mono font-normal">
              [SPACE] or [K]
            </span>
          </button>
        </div>

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs z-40 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-5xl mb-2 animate-bounce">🪜</div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-400 font-arcade mb-1">
              무한의 계단
            </h2>
            <p className="text-xs text-slate-300 font-bold max-w-xs mb-6 leading-relaxed">
              방향 전환과 오르기를 번갈아 누르며 끝없이 계단을 정복하세요!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-base shadow-xl active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>계단 오르기 시작!</span>
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs z-40 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <div className="text-4xl mb-2">💫</div>
            <h2 className="text-2xl font-black text-rose-500 font-arcade mb-1">GAME OVER</h2>
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 my-3 w-52 text-center space-y-1 shadow-lg">
              <div className="text-[10px] font-bold text-slate-400">도달한 층수</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{score} 층</div>
              <div className="text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-800">
                최대 콤보: {maxCombo} 회
              </div>
            </div>
            <button
              onClick={startGame}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 오르기</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
