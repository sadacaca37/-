import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles, ArrowUp } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface JellyRunnerGameProps {
  onBack?: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'pit' | 'flying';
}

interface Item {
  id: number;
  x: number;
  y: number;
  type: 'star' | 'candy';
  collected: boolean;
}

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 280;
const GROUND_Y = 220;

export const JellyRunnerGame: React.FC<JellyRunnerGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [distance, setDistance] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('jelly_runner_high_score') || '0');
    } catch {
      return 0;
    }
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Player state
  const playerRef = useRef<{
    x: number;
    y: number;
    vy: number;
    isGrounded: boolean;
    jumpCount: number;
    invincibleTimer: number;
  }>({
    x: 60,
    y: GROUND_Y - 32,
    vy: 0,
    isGrounded: true,
    jumpCount: 0,
    invincibleTimer: 0,
  });

  // World elements
  const obstaclesRef = useRef<Obstacle[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const speedRef = useRef<number>(4);
  const nextItemId = useRef<number>(1);
  const frameCountRef = useRef<number>(0);

  const jump = useCallback(() => {
    if (gameState !== 'playing') return;

    const p = playerRef.current;
    if (p.jumpCount < 2) {
      p.vy = -7.6;
      p.isGrounded = false;
      p.jumpCount++;
      soundManager.play('click');
    }
  }, [gameState]);

  const startGame = () => {
    playerRef.current = {
      x: 60,
      y: GROUND_Y - 32,
      vy: 0,
      isGrounded: true,
      jumpCount: 0,
      invincibleTimer: 0,
    };
    obstaclesRef.current = [];
    itemsRef.current = [];
    speedRef.current = 4.2;
    frameCountRef.current = 0;
    setDistance(0);
    setScore(0);
    setGameState('playing');
    soundManager.playSuccess();
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'idle') startGame();
        else if (gameState === 'playing') jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump]);

  // Main game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let isRunning = true;

    const loop = () => {
      if (!isRunning) return;

      frameCountRef.current++;
      const p = playerRef.current;
      const currentSpeed = speedRef.current;

      // Update distance & speed
      if (frameCountRef.current % 5 === 0) {
        setDistance((d) => d + 1);
      }
      if (frameCountRef.current % 400 === 0) {
        speedRef.current = Math.min(8.5, speedRef.current + 0.3);
      }

      // Physics (Gravity & Jump)
      p.vy += 0.42; // gravity
      p.y += p.vy;

      if (p.y >= GROUND_Y - 32) {
        p.y = GROUND_Y - 32;
        p.vy = 0;
        p.isGrounded = true;
        p.jumpCount = 0;
      }

      if (p.invincibleTimer > 0) p.invincibleTimer--;

      // Spawn obstacles (every 90-140 frames)
      if (frameCountRef.current % Math.floor(Math.max(65, 120 - distance * 0.05)) === 0) {
        const rand = Math.random();
        if (rand < 0.6) {
          // Candy Spike
          obstaclesRef.current.push({
            x: CANVAS_WIDTH + 20,
            y: GROUND_Y - 28,
            width: 24,
            height: 28,
            type: 'spike',
          });
        } else {
          // Flying Bat / Obstacle
          obstaclesRef.current.push({
            x: CANVAS_WIDTH + 20,
            y: GROUND_Y - 65,
            width: 26,
            height: 22,
            type: 'flying',
          });
        }
      }

      // Spawn Star & Candy items
      if (frameCountRef.current % 45 === 0) {
        itemsRef.current.push({
          id: nextItemId.current++,
          x: CANVAS_WIDTH + 20,
          y: GROUND_Y - (Math.random() < 0.5 ? 40 : 80),
          type: Math.random() < 0.85 ? 'star' : 'candy',
          collected: false,
        });
      }

      // Move obstacles & collision check
      const toRemoveObstacles: number[] = [];
      for (let i = 0; i < obstaclesRef.current.length; i++) {
        const obs = obstaclesRef.current[i];
        obs.x -= currentSpeed;

        // Collision box check
        const playerBox = { x: p.x + 4, y: p.y + 4, w: 24, h: 24 };
        const obsBox = { x: obs.x, y: obs.y, w: obs.width, h: obs.height };

        if (
          playerBox.x < obsBox.x + obsBox.w &&
          playerBox.x + playerBox.w > obsBox.x &&
          playerBox.y < obsBox.y + obsBox.h &&
          playerBox.y + playerBox.h > obsBox.y
        ) {
          if (p.invincibleTimer <= 0) {
            // Hit!
            soundManager.playError();
            setGameState('gameover');
            return;
          }
        }

        if (obs.x + obs.width < -20) {
          toRemoveObstacles.push(i);
        }
      }
      obstaclesRef.current = obstaclesRef.current.filter((_, idx) => !toRemoveObstacles.includes(idx));

      // Move items & collect check
      for (const item of itemsRef.current) {
        item.x -= currentSpeed;
        if (!item.collected) {
          const dx = (p.x + 16) - item.x;
          const dy = (p.y + 16) - item.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 26) {
            item.collected = true;
            soundManager.play('pop');
            const bonus = item.type === 'candy' ? 100 : 20;
            if (item.type === 'candy') {
              p.invincibleTimer = 180; // 3s rainbow boost
            }
            setScore((s) => {
              const ns = s + bonus;
              if (ns > highScore) {
                setHighScore(ns);
                try {
                  localStorage.setItem('jelly_runner_high_score', String(ns));
                } catch {}
              }
              return ns;
            });
          }
        }
      }
      itemsRef.current = itemsRef.current.filter((item) => item.x > -20 && !item.collected);

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Sky gradient
          const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
          sky.addColorStop(0, '#312e81'); // indigo
          sky.addColorStop(1, '#831843'); // pink
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          // Candy Ground
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 4);

          // Draw Items
          for (const item of itemsRef.current) {
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.type === 'candy' ? '🍬' : '⭐', item.x, item.y);
          }

          // Draw Obstacles
          for (const obs of obstaclesRef.current) {
            if (obs.type === 'spike') {
              ctx.font = '22px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';
              ctx.fillText('🔺', obs.x + obs.width / 2, obs.y + obs.height + 2);
            } else {
              ctx.font = '20px sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🦇', obs.x + obs.width / 2, obs.y + obs.height / 2);
            }
          }

          // Draw Jelly Player
          ctx.save();
          const isBoosted = p.invincibleTimer > 0;
          if (isBoosted) {
            ctx.shadowColor = '#facc15';
            ctx.shadowBlur = 15;
          }

          ctx.font = '32px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(isBoosted ? '🌈' : '🍮', p.x + 16, p.y + 16);
          ctx.restore();
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      isRunning = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState, distance, highScore]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>놀이터 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🏃</span>
          <h1 className="text-xl sm:text-2xl font-black font-arcade text-white tracking-wider">
            젤리 점프 러너 (Jelly Runner)
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

      {/* Main Canvas & Overlay */}
      <div className="relative p-2 rounded-3xl bg-slate-950 border-4 border-pink-500 shadow-2xl overflow-hidden">
        {/* Top Hud Bar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-xs border border-white/10 text-white font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-pink-400 font-black">거리: {distance}m</span>
            <span className="text-amber-400 font-black">점수: {score}P</span>
          </div>
          <div className="text-slate-300 flex items-center gap-1">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>BEST: {highScore}P</span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={jump}
          className="rounded-2xl cursor-pointer touch-none block"
        />

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <div className="text-5xl mb-2 animate-bounce">🍮✨</div>
            <h2 className="text-2xl font-black text-white font-arcade mb-1">
              젤리 점프 러너
            </h2>
            <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
              장애물을 뛰어넘고 별과 무지개 사탕을 모아 최고 거리를 달성하세요! (2단 점프 가능)
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm shadow-lg active:scale-95 transition cursor-pointer"
            >
              달리기 시작! [SPACE]
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
            <div className="text-4xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-rose-500 font-arcade mb-1">GAME OVER</h2>
            <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 my-2 w-48 text-center">
              <div className="text-xs text-slate-400">달린 거리</div>
              <div className="text-xl font-black text-pink-400 font-mono">{distance} m</div>
              <div className="text-xs text-slate-400 mt-1">최종 점수</div>
              <div className="text-lg font-black text-amber-400 font-mono">{score} P</div>
            </div>
            <button
              onClick={startGame}
              className="px-8 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-sm shadow-lg active:scale-95 transition cursor-pointer"
            >
              다시 달리기 [SPACE]
            </button>
          </div>
        )}
      </div>

      {/* Jump Control for Touch */}
      <div className="mt-3 w-full max-w-xs sm:hidden">
        <button
          onClick={jump}
          disabled={gameState !== 'playing'}
          className="w-full py-4 rounded-2xl bg-pink-600 active:bg-pink-500 text-white font-black text-base shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowUp className="w-5 h-5" />
          <span>점프 (2단 점프)</span>
        </button>
      </div>
    </div>
  );
};
