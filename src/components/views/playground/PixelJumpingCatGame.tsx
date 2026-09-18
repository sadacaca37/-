import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Volume2, VolumeX, Sparkles, Flame, ShieldAlert } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface PixelJumpingCatGameProps {
  onScoreEarned?: (score: number) => void;
}

export const PixelJumpingCatGame: React.FC<PixelJumpingCatGameProps> = ({ onScoreEarned }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('cat_runner_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Game internal variables ref to prevent re-render lags
  const gameRef = useRef({
    catY: 0,
    catVelocityY: 0,
    isJumping: false,
    groundY: 180,
    obstacles: [] as { x: number; width: number; height: number; type: 'yarn' | 'crate' | 'fence'; speed: number }[],
    collectables: [] as { x: number; y: number; size: number; collected: boolean }[],
    clouds: [] as { x: number; y: number; speed: number; size: number }[],
    gameSpeed: 4.5,
    frameCount: 0,
    score: 0,
    coins: 0,
  });

  const jump = () => {
    if (gameState !== 'playing') return;
    const g = gameRef.current;
    if (!g.isJumping) {
      g.catVelocityY = -11.5;
      g.isJumping = true;
      soundManager.playKeyClick(true);
    }
  };

  const startGame = () => {
    const g = gameRef.current;
    g.catY = 0;
    g.catVelocityY = 0;
    g.isJumping = false;
    g.obstacles = [];
    g.collectables = [];
    g.clouds = [
      { x: 50, y: 30, speed: 0.8, size: 30 },
      { x: 220, y: 45, speed: 0.6, size: 22 },
      { x: 420, y: 25, speed: 0.9, size: 28 },
    ];
    g.gameSpeed = 4.5;
    g.frameCount = 0;
    g.score = 0;
    g.coins = 0;
    setScore(0);
    setCoins(0);
    setGameState('playing');
    soundManager.play('achievement');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing') {
          jump();
        } else {
          startGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Main animation loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;
      const groundLevel = height - 40;
      g.groundY = groundLevel;

      // 1. Clear background (Cute pastel sky)
      ctx.fillStyle = '#E0F2FE'; // sky-100
      ctx.fillRect(0, 0, width, height);

      // Sun
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(width - 50, 45, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(width - 50, 45, 18, 0, Math.PI * 2);
      ctx.fill();

      // Clouds
      ctx.fillStyle = '#FFFFFF';
      g.clouds.forEach((cloud) => {
        if (gameState === 'playing') {
          cloud.x -= cloud.speed;
          if (cloud.x + cloud.size * 2 < 0) cloud.x = width + 20;
        }
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - 4, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distant hills
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(100, groundLevel + 40, 90, Math.PI, 0);
      ctx.arc(320, groundLevel + 50, 120, Math.PI, 0);
      ctx.arc(540, groundLevel + 30, 80, Math.PI, 0);
      ctx.fill();

      // Ground (Pastel grass & soil)
      ctx.fillStyle = '#4ADE80'; // Emerald/green grass top
      ctx.fillRect(0, groundLevel, width, 8);
      ctx.fillStyle = '#FDE68A'; // Sand/earth
      ctx.fillRect(0, groundLevel + 8, width, height - groundLevel - 8);

      // Ground pattern lines
      ctx.fillStyle = '#F59E0B';
      for (let i = 0; i < width; i += 30) {
        ctx.fillRect(i + ((g.frameCount * g.gameSpeed) % 30) * -1, groundLevel + 16, 12, 3);
      }

      if (gameState === 'playing') {
        g.frameCount++;

        // Increase score
        if (g.frameCount % 5 === 0) {
          g.score += 1;
          setScore(g.score);

          // Speed up gradually
          if (g.score % 150 === 0 && g.gameSpeed < 9.5) {
            g.gameSpeed += 0.4;
          }
        }

        // Spawn obstacles
        if (g.frameCount % 95 === 0 && Math.random() > 0.15) {
          const types: ('yarn' | 'crate' | 'fence')[] = ['yarn', 'crate', 'fence'];
          const type = types[Math.floor(Math.random() * types.length)];
          const h = type === 'crate' ? 28 : type === 'yarn' ? 24 : 32;
          const w = type === 'crate' ? 24 : type === 'yarn' ? 24 : 20;
          g.obstacles.push({
            x: width + 20,
            width: w,
            height: h,
            type,
            speed: g.gameSpeed,
          });
        }

        // Spawn golden fish coins
        if (g.frameCount % 70 === 0 && Math.random() > 0.3) {
          g.collectables.push({
            x: width + 20,
            y: groundLevel - 45 - Math.random() * 40,
            size: 16,
            collected: false,
          });
        }

        // Physics: Cat gravity
        g.catVelocityY += 0.65; // gravity
        g.catY += g.catVelocityY;

        if (g.catY >= 0) {
          g.catY = 0;
          g.catVelocityY = 0;
          g.isJumping = false;
        }
      }

      // Draw Collectable Golden Fish Coins
      g.collectables.forEach((item) => {
        if (gameState === 'playing') item.x -= g.gameSpeed;
        if (!item.collected) {
          ctx.save();
          ctx.translate(item.x, item.y);
          // Golden fish icon
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tail
          ctx.beginPath();
          ctx.moveTo(7, 0);
          ctx.lineTo(13, -5);
          ctx.lineTo(13, 5);
          ctx.closePath();
          ctx.fill();
          // Eye
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-4, -1, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Collision with Cat
          const catBox = { x: 50, y: groundLevel - 32 + g.catY, w: 32, h: 32 };
          if (
            item.x > catBox.x &&
            item.x < catBox.x + catBox.w &&
            item.y > catBox.y &&
            item.y < catBox.y + catBox.h
          ) {
            item.collected = true;
            g.coins += 1;
            g.score += 25;
            setCoins(g.coins);
            setScore(g.score);
            soundManager.play('success');
          }
        }
      });
      g.collectables = g.collectables.filter((c) => c.x > -20 && !c.collected);

      // Draw Obstacles & Check Collision
      const catBox = { x: 50, y: groundLevel - 30 + g.catY, w: 26, h: 26 };

      for (let i = 0; i < g.obstacles.length; i++) {
        const obs = g.obstacles[i];
        if (gameState === 'playing') obs.x -= g.gameSpeed;

        const obsY = groundLevel - obs.height;

        // Draw obstacle
        ctx.save();
        if (obs.type === 'yarn') {
          // Rolling yarn ball
          ctx.fillStyle = '#EC4899'; // Pink yarn
          ctx.beginPath();
          ctx.arc(obs.x + obs.width / 2, obsY + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#F472B6';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (obs.type === 'crate') {
          // Wooden crate
          ctx.fillStyle = '#D97706';
          ctx.fillRect(obs.x, obsY, obs.width, obs.height);
          ctx.strokeStyle = '#92400E';
          ctx.lineWidth = 2;
          ctx.strokeRect(obs.x, obsY, obs.width, obs.height);
          ctx.beginPath();
          ctx.moveTo(obs.x, obsY);
          ctx.lineTo(obs.x + obs.width, obsY + obs.height);
          ctx.stroke();
        } else {
          // Wooden fence
          ctx.fillStyle = '#EA580C';
          ctx.fillRect(obs.x + 3, obsY, 6, obs.height);
          ctx.fillRect(obs.x + 12, obsY, 6, obs.height);
          ctx.fillRect(obs.x, obsY + 8, obs.width, 5);
        }
        ctx.restore();

        // Hitbox collision check
        if (
          gameState === 'playing' &&
          catBox.x + catBox.w > obs.x + 4 &&
          catBox.x < obs.x + obs.width - 4 &&
          catBox.y + catBox.h > obsY + 4
        ) {
          // Game Over!
          setGameState('gameover');
          soundManager.play('error');
          if (g.score > highScore) {
            setHighScore(g.score);
            try {
              localStorage.setItem('cat_runner_high_score', g.score.toString());
            } catch {}
          }
          if (onScoreEarned) onScoreEarned(g.score);
          break;
        }
      }
      g.obstacles = g.obstacles.filter((o) => o.x > -40);

      // Draw Pixel Cat
      const catDrawX = 50;
      const catDrawY = groundLevel - 32 + g.catY;

      ctx.save();
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(catDrawX + 16, groundLevel - 2, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cat Body (Orange Cheese Cat)
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.roundRect(catDrawX + 2, catDrawY + 8, 24, 18, 6);
      ctx.fill();

      // Cat Head
      ctx.beginPath();
      ctx.arc(catDrawX + 20, catDrawY + 8, 10, 0, Math.PI * 2);
      ctx.fill();

      // Cat Ears
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(catDrawX + 15, catDrawY + 2);
      ctx.lineTo(catDrawX + 19, catDrawY - 6);
      ctx.lineTo(catDrawX + 22, catDrawY + 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(catDrawX + 22, catDrawY + 2);
      ctx.lineTo(catDrawX + 26, catDrawY - 6);
      ctx.lineTo(catDrawX + 29, catDrawY + 2);
      ctx.fill();

      // Cat Eye & Cheeks
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(catDrawX + 23, catDrawY + 7, 2, 0, Math.PI * 2);
      ctx.fill();

      // Pink blush
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(catDrawX + 24, catDrawY + 11, 2, 0, Math.PI * 2);
      ctx.fill();

      // Running paws or jumping pose
      ctx.fillStyle = '#EA580C';
      if (g.isJumping) {
        // Tucked paws
        ctx.fillRect(catDrawX + 6, catDrawY + 24, 6, 4);
        ctx.fillRect(catDrawX + 18, catDrawY + 24, 6, 4);
      } else {
        // Alternating paws
        const legOffset = Math.sin(g.frameCount * 0.4) * 4;
        ctx.fillRect(catDrawX + 6 + legOffset, catDrawY + 24, 5, 5);
        ctx.fillRect(catDrawX + 18 - legOffset, catDrawY + 24, 5, 5);
      }

      // Tail
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(catDrawX + 3, catDrawY + 14);
      const tailWiggle = Math.sin(g.frameCount * 0.3) * 6;
      ctx.quadraticCurveTo(catDrawX - 6, catDrawY + 6 + tailWiggle, catDrawX - 4, catDrawY + 2 + tailWiggle);
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, highScore]);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-md border-2 border-orange-200">
      {/* Top Header info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 border border-orange-300">
              🐱 점핑 냥이 아케이드
            </span>
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">
              스페이스바 또는 화면 터치로 장애물을 뛰어넘으세요!
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-800 font-arcade mt-0.5">
            픽셀 점핑 냥이 러너
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono font-black text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>최고: {highScore}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-orange-50 text-orange-700 border border-orange-200">
            <span>🐟 {coins}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200">
            <span>점수: {score}</span>
          </div>
        </div>
      </div>

      {/* Canvas Area with overlay */}
      <div
        className="relative w-full aspect-[16/7] max-h-[360px] rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 bg-sky-100 cursor-pointer select-none"
        onClick={() => {
          if (gameState === 'playing') jump();
          else startGame();
        }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={260}
          className="w-full h-full object-cover block"
        />

        {/* Start / Idle Screen Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-400 to-amber-300 flex items-center justify-center text-3xl shadow-lg animate-bounce mb-3">
              🐱
            </div>
            <h4 className="text-xl sm:text-2xl font-black font-arcade mb-1">
              픽셀 점핑 냥이 러너
            </h4>
            <p className="text-xs sm:text-sm text-orange-200 font-bold mb-4 text-center">
              털실 뭉치와 장애물을 피해 황금 물고기를 모으세요!
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>게임 시작 (Space)</span>
            </button>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <div className="text-3xl mb-1">😿</div>
            <h4 className="text-xl sm:text-2xl font-black font-arcade text-rose-400 mb-1">
              GAME OVER
            </h4>
            <p className="text-sm font-bold text-slate-200 mb-3">
              최종 점수: <span className="text-amber-300 font-mono font-black">{score}</span>점 (물고기: {coins}개)
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 도전하기 (Space)</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Instruction Tip */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-bold px-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[11px] border border-slate-300">
            스페이스바 / ↑키 / 화면 터치
          </span>
          <span>: 냥이 점프!</span>
        </div>
        <div className="text-orange-600 font-black flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>플레이그라운드 전용 오리지널 아케이드</span>
        </div>
      </div>
    </div>
  );
};
