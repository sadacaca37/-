import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy, Sparkles, ArrowDown } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface SuikaGameProps {
  onBack?: () => void;
}

interface FruitDef {
  name: string;
  emoji: string;
  radius: number;
  color: string;
  score: number;
  faceType: 'happy' | 'cheeky' | 'wink' | 'cat' | 'melon' | 'watermelon';
}

const FRUIT_TIERS: FruitDef[] = [
  { name: '체리', emoji: '🍒', radius: 16, color: '#f43f5e', score: 2, faceType: 'happy' },
  { name: '딸기', emoji: '🍓', radius: 22, color: '#fb7185', score: 4, faceType: 'cheeky' },
  { name: '포도', emoji: '🍇', radius: 28, color: '#a855f7', score: 8, faceType: 'happy' },
  { name: '귤', emoji: '🍊', radius: 34, color: '#fb923c', score: 16, faceType: 'wink' },
  { name: '감', emoji: '🍅', radius: 40, color: '#f97316', score: 32, faceType: 'happy' },
  { name: '사과', emoji: '🍎', radius: 46, color: '#ef4444', score: 64, faceType: 'cheeky' },
  { name: '배', emoji: '🍐', radius: 52, color: '#eab308', score: 128, faceType: 'happy' },
  { name: '복숭아', emoji: '🍑', radius: 58, color: '#f472b6', score: 256, faceType: 'cat' },
  { name: '파인애플', emoji: '🍍', radius: 65, color: '#facc15', score: 512, faceType: 'cheeky' },
  { name: '멜론', emoji: '🍈', radius: 72, color: '#4ade80', score: 1024, faceType: 'melon' },
  { name: '수박', emoji: '🍉', radius: 82, color: '#22c55e', score: 2048, faceType: 'watermelon' },
];

interface FruitBody {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

const BOX_WIDTH = 340;
const BOX_HEIGHT = 480;
const DEAD_LINE_Y = 70;
const GRAVITY = 0.28;
const RESTITUTION = 0.3; // bounce
const FRICTION = 0.985;

export const SuikaGame: React.FC<SuikaGameProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('suika_high_score') || '0');
    } catch {
      return 0;
    }
  });

  const [dropX, setDropX] = useState<number>(BOX_WIDTH / 2);
  const [currentTier, setCurrentTier] = useState<number>(0);
  const [nextTier, setNextTier] = useState<number>(0);
  const [canDrop, setCanDrop] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fruitsRef = useRef<FruitBody[]>([]);
  const nextIdRef = useRef<number>(1);
  const dangerTimerRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const getRandomSpawnTier = () => {
    // Spawns tiers 0 to 3 (체리, 딸기, 포도, 귤)
    return Math.floor(Math.random() * 4);
  };

  const initGame = () => {
    fruitsRef.current = [];
    dangerTimerRef.current = 0;
    setScore(0);
    setCurrentTier(getRandomSpawnTier());
    setNextTier(getRandomSpawnTier());
    setDropX(BOX_WIDTH / 2);
    setCanDrop(true);
    setGameState('playing');
    soundManager.playSuccess();
  };

  const handleDrop = useCallback(() => {
    if (gameState !== 'playing' || !canDrop) return;

    setCanDrop(false);
    soundManager.playClick();

    const tierDef = FRUIT_TIERS[currentTier];
    const clampedX = Math.max(tierDef.radius + 5, Math.min(BOX_WIDTH - tierDef.radius - 5, dropX));

    const newFruit: FruitBody = {
      id: nextIdRef.current++,
      tier: currentTier,
      x: clampedX,
      y: 45,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 2.0,
      radius: tierDef.radius,
    };

    fruitsRef.current.push(newFruit);

    // Switch to next fruit
    setTimeout(() => {
      setCurrentTier(nextTier);
      setNextTier(getRandomSpawnTier());
      setCanDrop(true);
    }, 550);
  }, [gameState, canDrop, currentTier, dropX, nextTier]);

  // Handle keyboard & touch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.code === 'Space') initGame();
        return;
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        setDropX((x) => Math.max(30, x - 20));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        setDropX((x) => Math.min(BOX_WIDTH - 30, x + 20));
      } else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleDrop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleDrop]);

  // Main physics & rendering loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let isRunning = true;

    const updatePhysics = () => {
      const fruits = fruitsRef.current;
      const subSteps = 6; // sub-stepping for smooth, stable physics

      for (let step = 0; step < subSteps; step++) {
        // 1. Gravity & Position update
        for (let i = 0; i < fruits.length; i++) {
          const f = fruits[i];
          f.vy += (GRAVITY / subSteps);
          f.vx *= Math.pow(FRICTION, 1 / subSteps);
          f.vy *= Math.pow(FRICTION, 1 / subSteps);
          f.x += f.vx / subSteps;
          f.y += f.vy / subSteps;

          // Wall boundaries
          if (f.x - f.radius < 0) {
            f.x = f.radius;
            f.vx = -f.vx * RESTITUTION;
          } else if (f.x + f.radius > BOX_WIDTH) {
            f.x = BOX_WIDTH - f.radius;
            f.vx = -f.vx * RESTITUTION;
          }

          // Floor boundary
          if (f.y + f.radius > BOX_HEIGHT) {
            f.y = BOX_HEIGHT - f.radius;
            f.vy = -f.vy * RESTITUTION;
            f.vx *= 0.95; // ground friction
          }
        }

        // 2. Fruit-to-Fruit Collisions & Merging
        const toRemove = new Set<number>();
        const toAdd: FruitBody[] = [];

        for (let i = 0; i < fruits.length; i++) {
          for (let j = i + 1; j < fruits.length; j++) {
            const f1 = fruits[i];
            const f2 = fruits[j];

            if (toRemove.has(f1.id) || toRemove.has(f2.id)) continue;

            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = f1.radius + f2.radius;

            if (dist < minDist) {
              // Same tier merge!
              if (f1.tier === f2.tier && f1.tier < FRUIT_TIERS.length - 1) {
                toRemove.add(f1.id);
                toRemove.add(f2.id);

                const nextT = f1.tier + 1;
                const nextDef = FRUIT_TIERS[nextT];
                const midX = (f1.x + f2.x) / 2;
                const midY = (f1.y + f2.y) / 2;

                toAdd.push({
                  id: nextIdRef.current++,
                  tier: nextT,
                  x: midX,
                  y: midY,
                  vx: (f1.vx + f2.vx) * 0.4,
                  vy: -1.5, // slight pop upward
                  radius: nextDef.radius,
                });

                soundManager.play('pop');

                // Add score
                const gain = nextDef.score;
                setScore((prev) => {
                  const ns = prev + gain;
                  if (ns > highScore) {
                    setHighScore(ns);
                    try {
                      localStorage.setItem('suika_high_score', String(ns));
                    } catch {}
                  }
                  return ns;
                });
                break;
              }

              // Elastic circle collision resolution
              const overlap = minDist - dist;
              const nx = dist === 0 ? 1 : dx / dist;
              const ny = dist === 0 ? 0 : dy / dist;

              // Separate
              f1.x -= nx * overlap * 0.5;
              f1.y -= ny * overlap * 0.5;
              f2.x += nx * overlap * 0.5;
              f2.y += ny * overlap * 0.5;

              // Velocity impulse
              const kx = f1.vx - f2.vx;
              const ky = f1.vy - f2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2;

              f1.vx -= p * nx * 0.5;
              f1.vy -= p * ny * 0.5;
              f2.vx += p * nx * 0.5;
              f2.vy += p * ny * 0.5;
            }
          }
        }

        if (toRemove.size > 0) {
          fruitsRef.current = fruitsRef.current.filter((f) => !toRemove.has(f.id)).concat(toAdd);
        }
      }

      // Check Danger / Game Over condition (fruits above dead line for 2+ seconds)
      let dangerous = false;
      for (const f of fruitsRef.current) {
        if (f.y - f.radius < DEAD_LINE_Y && Math.abs(f.vy) < 0.2) {
          dangerous = true;
          break;
        }
      }

      if (dangerous) {
        dangerTimerRef.current += 16;
        if (dangerTimerRef.current > 2200) {
          setGameState('gameover');
          soundManager.playError();
          return;
        }
      } else {
        dangerTimerRef.current = Math.max(0, dangerTimerRef.current - 30);
      }
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background: warm paper inside a wooden crate (classic merge-fruit look)
      ctx.clearRect(0, 0, BOX_WIDTH, BOX_HEIGHT);
      const bgG = ctx.createLinearGradient(0, 0, 0, BOX_HEIGHT);
      bgG.addColorStop(0, '#fff6dc'); bgG.addColorStop(1, '#ffe6b3');
      ctx.fillStyle = bgG; ctx.fillRect(0, 0, BOX_WIDTH, BOX_HEIGHT);
      ctx.fillStyle = 'rgba(232,170,90,0.14)';
      for (let yy = 0; yy < BOX_HEIGHT; yy += 24) for (let xx = (yy / 24) % 2 ? 12 : 0; xx < BOX_WIDTH; xx += 24) ctx.fillRect(xx, yy, 12, 12);

      // Dead Line
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = dangerTimerRef.current > 0 ? '#ef4444' : '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, DEAD_LINE_Y);
      ctx.lineTo(BOX_WIDTH, DEAD_LINE_Y);
      ctx.stroke();
      ctx.restore();

      // Render fruits with authentic Capture 2 kawaii graphics
      for (const f of fruitsRef.current) {
        renderFruitGraphic(ctx, f.x, f.y, f.radius, f.tier);
      }

      // Draw dropper guide line & fruit on top
      if (canDrop) {
        const currDef = FRUIT_TIERS[currentTier];
        const clampedX = Math.max(currDef.radius + 5, Math.min(BOX_WIDTH - currDef.radius - 5, dropX));

        ctx.save();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(clampedX, 42);
        ctx.lineTo(clampedX, BOX_HEIGHT);
        ctx.stroke();
        ctx.restore();

        // Dropping preview fruit
        renderFruitGraphic(ctx, clampedX, 42, currDef.radius * 0.92, currentTier);
      }
    };

    const loop = () => {
      if (!isRunning) return;
      updatePhysics();
      draw();
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      isRunning = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState, canDrop, currentTier, dropX, highScore]);

  // Render cute Kawaii fruit with face and details (Matches Capture 2!)
  const renderFruitGraphic = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    tier: number
  ) => {
    const def = FRUIT_TIERS[tier];

    // 1. Soft Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y + 3, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.fill();
    ctx.restore();

    // 2. Main Fruit Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = def.color;
    ctx.fill();

    // Special Patterns per tier
    if (tier === 10) {
      // Watermelon (Capture 2 style)
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = Math.max(5, r * 0.14);
      for (let angle = -0.7; angle <= 0.7; angle += 0.35) {
        ctx.beginPath();
        ctx.ellipse(x + angle * r * 0.9, y, r * 0.25, r * 1.05, angle * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (tier === 9) {
      // Melon grid
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let lx = -r; lx <= r; lx += 12) {
        ctx.moveTo(x + lx, y - r);
        ctx.lineTo(x + lx, y + r);
        ctx.moveTo(x - r, y + lx);
        ctx.lineTo(x + r, y + lx);
      }
      ctx.stroke();
      ctx.restore();
    } else if (tier === 1) {
      // Strawberry seeds & leaf hat
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#fef08a';
      const seedPositions = [
        { dx: -0.3, dy: -0.2 }, { dx: 0.3, dy: -0.2 },
        { dx: 0, dy: 0.1 }, { dx: -0.35, dy: 0.4 }, { dx: 0.35, dy: 0.4 }
      ];
      seedPositions.forEach((s) => {
        ctx.beginPath();
        ctx.arc(x + s.dx * r, y + s.dy * r, Math.max(1.5, r * 0.06), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(x, y - r + 3, r * 0.35, r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Outer border
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Glossy reflection shine on top-left
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fill();
    ctx.restore();

    // 3. Cute Kawaii Facial Expression
    ctx.save();
    const eyeR = Math.max(2, r * 0.08);
    const cheekR = Math.max(3, r * 0.12);
    const eyeOffsetX = r * 0.32;
    const eyeOffsetY = -r * 0.05;

    // Rosy cheeks
    ctx.fillStyle = 'rgba(244, 114, 182, 0.7)';
    ctx.beginPath();
    ctx.arc(x - eyeOffsetX - 2, y + eyeOffsetY + 6, cheekR, 0, Math.PI * 2);
    ctx.arc(x + eyeOffsetX + 2, y + eyeOffsetY + 6, cheekR, 0, Math.PI * 2);
    ctx.fill();

    // Eyes & Mouth
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.lineCap = 'round';

    if (tier === 10) {
      // Watermelon: ( > 3 < ) exactly like Capture 2!
      ctx.beginPath();
      ctx.moveTo(x - eyeOffsetX + eyeR, y + eyeOffsetY - eyeR);
      ctx.lineTo(x - eyeOffsetX - eyeR, y + eyeOffsetY);
      ctx.lineTo(x - eyeOffsetX + eyeR, y + eyeOffsetY + eyeR);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + eyeOffsetX - eyeR, y + eyeOffsetY - eyeR);
      ctx.lineTo(x + eyeOffsetX + eyeR, y + eyeOffsetY);
      ctx.lineTo(x + eyeOffsetX - eyeR, y + eyeOffsetY + eyeR);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y + eyeOffsetY + 3, eyeR * 0.9, 0.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
    } else if (def.faceType === 'cheeky') {
      ctx.beginPath();
      ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeR * 1.2, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeR * 1.2, Math.PI, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y + eyeOffsetY + 3, eyeR * 1.4, 0, Math.PI);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.stroke();
    } else if (def.faceType === 'wink') {
      ctx.beginPath();
      ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeR * 1.2, Math.PI, 0);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y + eyeOffsetY + 4, eyeR * 0.9, 0, Math.PI);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeR, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - eyeOffsetX + 1, y + eyeOffsetY - 1, eyeR * 0.4, 0, Math.PI * 2);
      ctx.arc(x + eyeOffsetX + 1, y + eyeOffsetY - 1, eyeR * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y + eyeOffsetY + 3, eyeR * 0.9, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Handle canvas touch/mouse dragging to aim
  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setDropX(Math.max(30, Math.min(BOX_WIDTH - 30, x)));
  };

  return (
    <div className="sk max-w-4xl mx-auto p-3 sm:p-5 flex flex-col items-center select-none animate-in fade-in duration-300 rounded-3xl bg-gradient-to-b from-[#FDE8B5] via-[#F8D288] to-[#F5C776] shadow-xl border-4 border-[#E2A64E]">
      {/* Top Header Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white/90 hover:bg-white text-amber-950 text-xs font-black transition cursor-pointer shadow-sm border border-amber-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>놀이터 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🍉</span>
          <h1 className="text-lg sm:text-2xl font-black font-arcade text-amber-950 tracking-wider drop-shadow-xs">
            수박게임 (Suika Game)
          </h1>
        </div>

        <button
          onClick={initGame}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-2xl bg-white/90 hover:bg-white text-amber-900 text-xs font-black transition cursor-pointer shadow-sm border border-amber-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>재시작</span>
        </button>
      </div>

      {/* Main Layout Matching Capture 2 */}
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-5">
        {/* Left Side: Capture 2 Score HUD + NEXT Fruit Capsule */}
        <div className="w-full md:w-40 flex md:flex-col justify-between gap-3">
          {/* Cyan Bubbly Current Score (Matches Capture 2 "1 622") */}
          <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-white/95 border-2 border-amber-300 shadow-md text-center">
            <div className="text-[11px] font-black text-amber-800 font-arcade mb-0.5">
              SCORE
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#0284c7] font-mono tracking-tight drop-shadow-xs">
              {score.toLocaleString()}
            </div>
          </div>

          {/* NEXT Fruit Capsule (Matches Capture 2) */}
          <div className="flex-1 md:flex-initial p-3.5 rounded-2xl bg-white/95 border-2 border-amber-300 shadow-md text-center">
            <div className="text-[11px] font-black text-amber-800 font-arcade mb-1">
              NEXT
            </div>
            <div className="w-16 h-16 mx-auto bg-amber-50/70 rounded-2xl border-2 border-amber-200 flex flex-col items-center justify-center shadow-inner">
              <span className="text-3xl drop-shadow-sm">{FRUIT_TIERS[nextTier]?.emoji}</span>
            </div>
            <div className="text-xs font-black text-amber-900 mt-1">
              {FRUIT_TIERS[nextTier]?.name}
            </div>
          </div>

          {/* High Score Trophy */}
          <div className="flex-1 md:flex-initial p-3 rounded-2xl bg-white/90 border-2 border-amber-300 shadow-md text-center">
            <div className="text-[10px] font-black text-amber-700 flex items-center justify-center gap-1 font-arcade">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>BEST</span>
            </div>
            <div className="text-lg font-black text-amber-950 font-mono mt-0.5">
              {highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Suika Physics Box Canvas */}
        <div className="relative flex flex-col items-center">
          <div className="relative p-2.5 rounded-3xl bg-[#FFFDF7] border-4 border-[#E2A64E] shadow-2xl">
            <canvas
              ref={canvasRef}
              width={BOX_WIDTH}
              height={BOX_HEIGHT}
              onPointerMove={handleCanvasPointer}
              onClick={handleDrop}
              className="rounded-2xl bg-[#FFFBF0] cursor-crosshair touch-none"
            />

            {/* Start Screen */}
            {gameState === 'idle' && (
              <div className="absolute inset-0 bg-amber-950/70 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="text-6xl mb-2 animate-bounce">🍉</div>
                <h2 className="text-2xl font-black text-white font-arcade mb-1">수박게임</h2>
                <p className="text-xs text-amber-100 mb-4 max-w-xs leading-relaxed font-medium">
                  과일을 떨어뜨려 같은 과일끼리 합쳐보세요! 최종 목표는 둥글고 거대한 수박 만들기! 🍉
                </p>
                <button
                  onClick={initGame}
                  className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl cursor-pointer flex items-center gap-2 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>게임 시작 [SPACE]</span>
                </button>
              </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 bg-amber-950/80 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
                <div className="text-5xl mb-2">💥</div>
                <h2 className="text-2xl font-black text-rose-400 font-arcade mb-1">GAME OVER</h2>
                <div className="bg-white/95 p-4 rounded-2xl border-2 border-amber-300 my-3 w-48 text-center shadow-lg">
                  <div className="text-[11px] font-bold text-slate-500">최종 점수</div>
                  <div className="text-2xl font-black text-[#0284c7] font-mono">{score.toLocaleString()}</div>
                </div>
                <button
                  onClick={initGame}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 도전하기</span>
                </button>
              </div>
            )}
          </div>

          {/* Cute Pastel Blue Pedestal (Matches Capture 2 bottom) */}
          <div className="w-[360px] h-4 mt-[-2px] bg-[#93C5FD] border-2 border-[#60A5FA] rounded-full shadow-md"></div>
        </div>

        {/* Right Side: Capture 2 Circular Evolution Chain */}
        <div className="w-full md:w-36 flex flex-col gap-1 p-3 rounded-2xl bg-white/95 border-2 border-amber-300 shadow-md">
          <div className="text-[11px] font-black text-amber-800 font-arcade mb-1 text-center">
            진화 순서
          </div>
          <div className="grid grid-cols-4 md:grid-cols-2 gap-1 text-[11px] font-bold text-amber-950">
            {FRUIT_TIERS.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-1 bg-amber-50/80 px-1.5 py-1 rounded-xl border border-amber-200/80"
                title={`${f.name} (+${f.score}P)`}
              >
                <span className="text-sm">{f.emoji}</span>
                <span className="truncate text-[10px] font-bold">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On-screen Drop Button for touch screens */}
      <div className="mt-4 sm:hidden w-full max-w-xs flex gap-2">
        <button
          onClick={handleDrop}
          disabled={!canDrop || gameState !== 'playing'}
          className="flex-1 py-3.5 rounded-2xl bg-emerald-600 active:bg-emerald-500 disabled:opacity-30 text-white font-black text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowDown className="w-4 h-4" />
          <span>과일 떨어뜨리기</span>
        </button>
      </div>
    </div>
  );
};
