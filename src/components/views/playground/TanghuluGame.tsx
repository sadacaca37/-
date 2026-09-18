import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles, Flame, Check } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface TanghuluGameProps {
  onBack?: () => void;
}

interface FruitItem {
  id: number;
  type: string;
  name: string;
  emoji: string;
  color: string;
  x: number;
  speed: number;
}

const AVAILABLE_FRUITS = [
  { type: 'strawberry', name: '딸기', emoji: '🍓', color: 'text-rose-500' },
  { type: 'muscat', name: '샤인머스캣', emoji: '🍇', color: 'text-lime-500' },
  { type: 'orange', name: '통귤', emoji: '🍊', color: 'text-orange-500' },
  { type: 'blueberry', name: '블루베리', emoji: '🫐', color: 'text-indigo-500' },
  { type: 'tomato', name: '방울토마토', emoji: '🍅', color: 'text-red-500' },
];

export const TanghuluGame: React.FC<TanghuluGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'idle' | 'skewering' | 'coating' | 'completed' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [stage, setStage] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('tanghulu_high_score') || '0');
    } catch {
      return 0;
    }
  });

  // Skewer recipe: 5 fruits required
  const [recipe, setRecipe] = useState<string[]>([]);
  const [skewered, setSkewered] = useState<string[]>([]);
  const [glazeProgress, setGlazeProgress] = useState<number>(0);

  // Moving fruits on the conveyor track
  const [fruits, setFruits] = useState<FruitItem[]>([]);
  const nextFruitId = useRef<number>(1);
  const animRef = useRef<number | null>(null);

  // Generate target recipe
  const generateRecipe = useCallback((stg: number) => {
    const list: string[] = [];
    for (let i = 0; i < 5; i++) {
      const rand = AVAILABLE_FRUITS[Math.floor(Math.random() * AVAILABLE_FRUITS.length)];
      list.push(rand.type);
    }
    return list;
  }, []);

  const startGame = () => {
    setScore(0);
    setStage(1);
    const newRecipe = generateRecipe(1);
    setRecipe(newRecipe);
    setSkewered([]);
    setGlazeProgress(0);
    setFruits([]);
    setGameState('skewering');
    soundManager.playSuccess();
  };

  const nextStage = () => {
    const nextStg = stage + 1;
    setStage(nextStg);
    setRecipe(generateRecipe(nextStg));
    setSkewered([]);
    setGlazeProgress(0);
    setFruits([]);
    setGameState('skewering');
    soundManager.playSuccess();
  };

  // Fruit spawner & movement loop
  useEffect(() => {
    if (gameState !== 'skewering') return;

    let lastSpawn = Date.now();
    const spawnInterval = Math.max(700, 1500 - stage * 80);
    const baseSpeed = 2.4 + stage * 0.35;

    const loop = () => {
      const now = Date.now();

      // Spawn new fruit
      if (now - lastSpawn > spawnInterval) {
        lastSpawn = now;
        const randomFruit = AVAILABLE_FRUITS[Math.floor(Math.random() * AVAILABLE_FRUITS.length)];
        setFruits((prev) => [
          ...prev,
          {
            id: nextFruitId.current++,
            type: randomFruit.type,
            name: randomFruit.name,
            emoji: randomFruit.emoji,
            color: randomFruit.color,
            x: 0, // starts from left
            speed: baseSpeed,
          },
        ]);
      }

      // Move fruits across track (width: ~340px)
      setFruits((prev) =>
        prev
          .map((f) => ({ ...f, x: f.x + f.speed }))
          .filter((f) => f.x < 380) // remove offscreen
      );

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, stage]);

  // Attempt to skewer the current aligned fruit
  const handleSkewer = useCallback(() => {
    if (gameState !== 'skewering') return;

    // Target zone is centered between x=140 and x=200
    const targetZoneMin = 135;
    const targetZoneMax = 205;

    const hitIndex = fruits.findIndex((f) => f.x >= targetZoneMin && f.x <= targetZoneMax);

    if (hitIndex !== -1) {
      const hitFruit = fruits[hitIndex];
      const neededFruitType = recipe[skewered.length];

      // Remove hit fruit
      setFruits((prev) => prev.filter((_, idx) => idx !== hitIndex));

      if (hitFruit.type === neededFruitType) {
        // Perfect match!
        soundManager.play('pop');
        const nextSkewered = [...skewered, hitFruit.type];
        setSkewered(nextSkewered);
        setScore((s) => s + 50 * stage);

        // Check if skewer is complete (5 fruits)
        if (nextSkewered.length === 5) {
          soundManager.playSuccess();
          setGameState('coating');
        }
      } else {
        // Wrong fruit! Penalty
        soundManager.playError();
        setScore((s) => Math.max(0, s - 30));
      }
    } else {
      // Missed completely!
      soundManager.playClick();
    }
  }, [gameState, fruits, recipe, skewered, stage]);

  // Coating phase: tap to glaze sugar syrup
  const handleCoat = useCallback(() => {
    if (gameState !== 'coating') return;

    soundManager.play('pop');
    setGlazeProgress((prev) => {
      const next = prev + 15;
      if (next >= 100) {
        // Completed tanghulu!
        soundManager.play('achievement');
        const stageBonus = 300 * stage;
        setScore((s) => {
          const total = s + stageBonus;
          if (total > highScore) {
            setHighScore(total);
            try {
              localStorage.setItem('tanghulu_high_score', String(total));
            } catch {}
          }
          return total;
        });
        setGameState('completed');
        return 100;
      }
      return next;
    });
  }, [gameState, stage, highScore]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'idle') startGame();
        else if (gameState === 'skewering') handleSkewer();
        else if (gameState === 'coating') handleCoat();
        else if (gameState === 'completed') nextStage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleSkewer, handleCoat, nextStage]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center select-none animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>놀이터 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🍡</span>
          <h1 className="text-xl sm:text-2xl font-black font-arcade text-white tracking-wider">
            탕후루 마스터 (Tanghulu)
          </h1>
        </div>

        <button
          onClick={startGame}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>재시작</span>
        </button>
      </div>

      {/* Main Game Card */}
      <div className="w-full max-w-lg bg-slate-900 border-4 border-amber-400 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-arcade">
              STAGE {stage}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-xs font-black text-amber-400 font-mono">
              SCORE: {score.toLocaleString()}
            </div>
            <div className="text-xs font-black text-slate-400 font-mono">
              BEST: {highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Target Recipe Display */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center">
          <div className="text-[11px] font-black text-amber-300 font-arcade mb-2">
            🎯 주문 레시피 (순서대로 꽂아주세요!)
          </div>
          <div className="flex items-center justify-center gap-2">
            {recipe.map((fType, idx) => {
              const fruit = AVAILABLE_FRUITS.find((f) => f.type === fType);
              const isDone = idx < skewered.length;
              const isCurrent = idx === skewered.length;

              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${
                    isDone
                      ? 'bg-emerald-950/70 border-emerald-500 scale-95 opacity-50'
                      : isCurrent
                      ? 'bg-amber-500/20 border-amber-400 scale-110 shadow-lg ring-2 ring-amber-300'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <span className="text-2xl">{fruit?.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-300">{fruit?.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conveyor Belt Track */}
        {gameState === 'skewering' && (
          <div className="relative h-44 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden flex flex-col justify-between p-2">
            {/* Target Aim Zone in Center */}
            <div className="absolute left-[135px] top-0 bottom-0 w-[70px] bg-amber-400/10 border-x-2 border-dashed border-amber-400 pointer-events-none flex items-center justify-center">
              <span className="text-[10px] font-black text-amber-300 font-arcade opacity-70">
                HIT ZONE
              </span>
            </div>

            {/* Conveyor Moving Belt */}
            <div className="relative h-20 w-full mt-4">
              {fruits.map((f) => (
                <div
                  key={f.id}
                  className="absolute top-2 -translate-x-1/2 flex flex-col items-center animate-bounce"
                  style={{ left: `${f.x}px` }}
                >
                  <span className="text-3xl filter drop-shadow-md">{f.emoji}</span>
                  <span className="text-[9px] font-bold text-white bg-slate-900/80 px-1 rounded-sm">
                    {f.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Skewer Launcher at Bottom */}
            <div className="flex flex-col items-center justify-center pb-2">
              <div className="w-1.5 h-10 bg-amber-600 rounded-full shadow-md" />
              <button
                onClick={handleSkewer}
                className="mt-1 px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-xs shadow-lg cursor-pointer active:scale-95 transition"
              >
                꼬치 꽂기! [SPACE]
              </button>
            </div>
          </div>
        )}

        {/* Coating Glaze Phase */}
        {gameState === 'coating' && (
          <div className="bg-gradient-to-b from-amber-950/60 to-slate-950 p-6 rounded-2xl border-2 border-amber-400 text-center space-y-4 animate-in zoom-in-95">
            <div className="text-3xl animate-bounce">🍯✨</div>
            <h3 className="text-lg font-black text-amber-300 font-arcade">
              바삭바삭 설탕 코팅 시럽 바르기!
            </h3>
            <p className="text-xs text-slate-300">
              버튼을 연속으로 눌러 100%까지 설탕 코팅을 완성하세요!
            </p>

            {/* Glaze Gauge */}
            <div className="w-full bg-slate-950 h-5 rounded-full border border-amber-500/50 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-200 rounded-full transition-all duration-150 shadow-inner"
                style={{ width: `${glazeProgress}%` }}
              />
            </div>

            <button
              onClick={handleCoat}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition cursor-pointer"
            >
              설탕 시럽 붓기! 🍯 ({glazeProgress}%)
            </button>
          </div>
        )}

        {/* Completed Phase */}
        {gameState === 'completed' && (
          <div className="bg-slate-950 p-6 rounded-2xl border-2 border-emerald-500 text-center space-y-3 animate-in zoom-in-95">
            <div className="text-4xl animate-bounce">🍡✨👑</div>
            <h3 className="text-xl font-black text-emerald-400 font-arcade">
              반짝반짝 명품 탕후루 완성!
            </h3>
            <p className="text-xs text-slate-300">
              손님이 너무 좋아해요! 보너스 +{300 * stage}점을 획득했습니다!
            </p>
            <button
              onClick={nextStage}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-lg active:scale-95 transition cursor-pointer"
            >
              다음 스테이지 도전! [SPACE]
            </button>
          </div>
        )}

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="bg-slate-950 p-8 rounded-2xl border-2 border-amber-500 text-center space-y-3">
            <div className="text-5xl animate-bounce">🍡</div>
            <h2 className="text-2xl font-black text-white font-arcade">탕후루 마스터</h2>
            <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
              주문 순서에 맞는 과일이 지나갈 때 타이밍 맞춰 꼬치를 꽂고 달콤한 설탕을 입혀보세요!
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-black text-sm shadow-lg active:scale-95 transition cursor-pointer"
            >
              가게 오픈하기! [SPACE]
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
