import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Trophy, Sparkles, Zap, Award } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface RetroBrickBreakerGameProps {
  onScoreEarned?: (score: number) => void;
}

export const RetroBrickBreakerGame: React.FC<RetroBrickBreakerGameProps> = ({ onScoreEarned }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('brick_breaker_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef({
    paddleX: 260,
    paddleW: 90,
    paddleH: 12,
    ballX: 300,
    ballY: 200,
    ballVX: 3.5,
    ballVY: -3.5,
    ballR: 6,
    bricks: [] as { x: number; y: number; w: number; h: number; color: string; points: number; alive: boolean }[],
    lives: 3,
    score: 0,
    combo: 0,
    keys: { left: false, right: false },
  });

  const initBricks = () => {
    const bricks = [];
    const rows = 4;
    const cols = 8;
    const padding = 6;
    const brickW = 68;
    const brickH = 16;
    const offsetTop = 30;
    const offsetLeft = 24;

    const colors = ['#F43F5E', '#FB923C', '#FACC15', '#4ADE80'];
    const rowPoints = [40, 30, 20, 10];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        bricks.push({
          x: offsetLeft + c * (brickW + padding),
          y: offsetTop + r * (brickH + padding),
          w: brickW,
          h: brickH,
          color: colors[r % colors.length],
          points: rowPoints[r % rowPoints.length],
          alive: true,
        });
      }
    }
    return bricks;
  };

  const startGame = () => {
    const s = stateRef.current;
    s.paddleX = 260;
    s.ballX = 300;
    s.ballY = 200;
    s.ballVX = (Math.random() > 0.5 ? 1 : -1) * 3.5;
    s.ballVY = -3.5;
    s.bricks = initBricks();
    s.lives = 3;
    s.score = 0;
    s.combo = 0;

    setScore(0);
    setLives(3);
    setCombo(0);
    setGameState('playing');
    soundManager.play('achievement');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = true;
      }
      if (e.code === 'Space') {
        if (gameState !== 'playing') {
          e.preventDefault();
          startGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.keys.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Mouse / Touch paddle control
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const s = stateRef.current;
    s.paddleX = Math.max(0, Math.min(canvas.width - s.paddleW, mouseX - s.paddleW / 2));
  };

  // Main game loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const s = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Clear retro background
      ctx.fillStyle = '#0F172A'; // Slate-900
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (gameState === 'playing') {
        // Paddle keyboard physics
        const paddleSpeed = 6.5;
        if (s.keys.left) s.paddleX = Math.max(0, s.paddleX - paddleSpeed);
        if (s.keys.right) s.paddleX = Math.min(width - s.paddleW, s.paddleX + paddleSpeed);

        // Ball movement
        s.ballX += s.ballVX;
        s.ballY += s.ballVY;

        // Wall collisions
        if (s.ballX - s.ballR <= 0) {
          s.ballX = s.ballR;
          s.ballVX *= -1;
          soundManager.playKeyClick(true);
        } else if (s.ballX + s.ballR >= width) {
          s.ballX = width - s.ballR;
          s.ballVX *= -1;
          soundManager.playKeyClick(true);
        }

        if (s.ballY - s.ballR <= 0) {
          s.ballY = s.ballR;
          s.ballVY *= -1;
          soundManager.playKeyClick(true);
        }

        // Paddle collision
        const paddleY = height - 26;
        if (
          s.ballY + s.ballR >= paddleY &&
          s.ballY - s.ballR <= paddleY + s.paddleH &&
          s.ballX >= s.paddleX &&
          s.ballX <= s.paddleX + s.paddleW &&
          s.ballVY > 0
        ) {
          // Angle bounce depending on hit position
          const hitPos = (s.ballX - (s.paddleX + s.paddleW / 2)) / (s.paddleW / 2);
          s.ballVX = hitPos * 5;
          s.ballVY = -Math.abs(s.ballVY);
          s.combo = 0;
          setCombo(0);
          soundManager.playKeyClick(true);
        }

        // Brick collision
        let remainingBricks = 0;
        for (let i = 0; i < s.bricks.length; i++) {
          const b = s.bricks[i];
          if (!b.alive) continue;
          remainingBricks++;

          if (
            s.ballX + s.ballR > b.x &&
            s.ballX - s.ballR < b.x + b.w &&
            s.ballY + s.ballR > b.y &&
            s.ballY - s.ballR < b.y + b.h
          ) {
            b.alive = false;
            s.ballVY *= -1;
            s.combo += 1;
            const pointsGained = b.points * s.combo;
            s.score += pointsGained;
            setScore(s.score);
            setCombo(s.combo);
            soundManager.play('success');
            break;
          }
        }

        // Victory check
        if (remainingBricks === 0) {
          setGameState('victory');
          soundManager.playVictory();
          if (s.score > highScore) {
            setHighScore(s.score);
            try {
              localStorage.setItem('brick_breaker_high_score', s.score.toString());
            } catch {}
          }
          if (onScoreEarned) onScoreEarned(s.score);
        }

        // Bottom drop / lose life
        if (s.ballY - s.ballR > height) {
          s.lives -= 1;
          setLives(s.lives);
          soundManager.play('error');

          if (s.lives <= 0) {
            setGameState('gameover');
            if (s.score > highScore) {
              setHighScore(s.score);
              try {
                localStorage.setItem('brick_breaker_high_score', s.score.toString());
              } catch {}
            }
            if (onScoreEarned) onScoreEarned(s.score);
          } else {
            // Reset ball
            s.ballX = s.paddleX + s.paddleW / 2;
            s.ballY = height - 45;
            s.ballVX = (Math.random() > 0.5 ? 1 : -1) * 3.5;
            s.ballVY = -3.5;
          }
        }
      }

      // Draw Bricks
      s.bricks.forEach((b) => {
        if (!b.alive) return;
        ctx.save();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();

        // Highlight sheen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(b.x + 2, b.y + 2, b.w - 4, 3);
        ctx.restore();
      });

      // Draw Paddle (Neon Cyan)
      ctx.save();
      const paddleY = height - 26;
      ctx.fillStyle = '#38BDF8';
      ctx.shadowColor = '#0284C7';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(s.paddleX, paddleY, s.paddleW, s.paddleH, 6);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(s.paddleX + 10, paddleY + 3, s.paddleW - 20, 2);
      ctx.restore();

      // Draw Ball (Glowing yellow)
      ctx.save();
      ctx.fillStyle = '#FDE047';
      ctx.shadowColor = '#EAB308';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, s.ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, highScore]);

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-cyan-500/40">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-cyan-900/60 text-cyan-300 border border-cyan-500/40">
              ⚡ 레트로 아케이드
            </span>
            <span className="text-xs text-slate-400 font-bold hidden sm:inline">
              방향키 ← → 또는 마우스로 패들을 조종하세요!
            </span>
          </div>
          <h3 className="text-lg font-black text-white font-arcade mt-0.5">
            네온 블록 브레이커 (벽돌깨기)
          </h3>
        </div>

        <div className="flex items-center gap-2.5 font-mono font-black text-sm">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>최고: {highScore}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-rose-300">
            <span>❤️ x {lives}</span>
          </div>

          {combo > 1 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500 text-amber-300 animate-pulse">
              <span>🔥 {combo} COMBO!</span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500 text-cyan-300">
            <span>점수: {score}</span>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full aspect-[16/8] max-h-[360px] rounded-2xl overflow-hidden shadow-2xl border-2 border-cyan-500/30 bg-slate-950 select-none">
        <canvas
          ref={canvasRef}
          width={640}
          height={280}
          onMouseMove={handleMouseMove}
          className="w-full h-full object-cover block cursor-ew-resize"
        />

        {/* Start Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-3xl shadow-lg mb-3 animate-pulse">
              🧱
            </div>
            <h4 className="text-xl sm:text-2xl font-black font-arcade mb-1 text-cyan-300">
              네온 블록 브레이커
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 font-bold mb-4 text-center">
              패들로 공을 튕겨 화려한 네온 블록을 모두 격파하세요!
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>게임 시작 (Space)</span>
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <div className="text-3xl mb-1">💥</div>
            <h4 className="text-xl sm:text-2xl font-black font-arcade text-rose-400 mb-1">
              GAME OVER
            </h4>
            <p className="text-sm font-bold text-slate-200 mb-3">
              최종 점수: <span className="text-cyan-300 font-mono font-black">{score}</span>점
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다시 도전하기 (Space)</span>
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 animate-fade-in">
            <div className="text-3xl mb-1">🏆✨</div>
            <h4 className="text-xl sm:text-2xl font-black font-arcade text-yellow-300 mb-1">
              STAGE CLEAR!
            </h4>
            <p className="text-sm font-bold text-slate-200 mb-3">
              모든 네온 블록을 격파했습니다! 점수: <span className="text-yellow-300 font-mono font-black">{score}</span>점
            </p>
            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>한 번 더 플레이!</span>
            </button>
          </div>
        )}
      </div>

      {/* Control instruction footer */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-bold px-1">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
            ← / → 키 또는 마우스 좌우 이동
          </span>
          <span>: 패들 이동</span>
        </div>
        <div className="text-cyan-400 font-black flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>플레이그라운드 아케이드</span>
        </div>
      </div>
    </div>
  );
};
