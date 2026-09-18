import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, ExternalLink, Shield, Zap, Bomb, Trophy } from 'lucide-react';

interface AirplaneShootingGameProps {
  onBack?: () => void;
  currentUser?: any;
}

export const AirplaneShootingGame: React.FC<AirplaneShootingGameProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem('typang_aircombat_highscore') || '5000', 10);
    } catch {
      return 5000;
    }
  });
  const [lives, setLives] = useState(3);
  const [bombs, setBombs] = useState(2);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [stage, setStage] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Audio synthesizer ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSfx = (type: 'shoot' | 'hit' | 'explosion' | 'item' | 'bomb' | 'boss') => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'item') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'bomb') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(30, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Audio not supported
    }
  };

  const externalUrl = "https://ai.studio/apps/f98914ba-df64-4cb5-8b8c-e9c1c4a9c8f2?fullscreenApplet=true";

  // Game loop and canvas logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frameCount = 0;

    const keys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyB' || e.code === 'KeyX') {
        triggerBomb();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Player state
    const player = {
      x: canvas.width / 2,
      y: canvas.height - 70,
      w: 36,
      h: 36,
      speed: 5.5,
      invuln: 60,
    };

    let pLives = 3;
    let pBombs = 2;
    let pWeapon = 1;
    let pScore = 0;
    let pStage = 1;

    // Game objects
    interface Bullet { x: number; y: number; vx: number; vy: number; isEnemy?: boolean; radius?: number }
    interface Enemy { x: number; y: number; vx: number; vy: number; w: number; h: number; hp: number; maxHp: number; type: 'small' | 'medium' | 'boss'; color: string; shootTimer: number }
    interface Item { x: number; y: number; type: 'p' | 'b' | 's' }
    interface Particle { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; size: number }

    let bullets: Bullet[] = [];
    let enemies: Enemy[] = [];
    let items: Item[] = [];
    let particles: Particle[] = [];
    let stars: { x: number; y: number; speed: number; size: number }[] = [];

    // Background starfield / clouds
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 2,
        size: Math.random() * 2 + 1,
      });
    }

    let bossSpawned = false;
    let bossInstance: Enemy | null = null;

    const triggerBomb = () => {
      if (pBombs <= 0) return;
      pBombs--;
      setBombs(pBombs);
      playSfx('bomb');

      // Clear all enemy bullets
      bullets = bullets.filter(b => !b.isEnemy);

      // Damage all enemies
      enemies.forEach(en => {
        en.hp -= 20;
        for (let i = 0; i < 15; i++) {
          particles.push({
            x: en.x + Math.random() * en.w,
            y: en.y + Math.random() * en.h,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: '#f59e0b',
            life: 25,
            maxLife: 25,
            size: 4,
          });
        }
      });
    };

    const spawnEnemy = () => {
      if (bossInstance) return;
      const typeRand = Math.random();
      if (typeRand < 0.65) {
        // Small swift scout
        enemies.push({
          x: 20 + Math.random() * (canvas.width - 40),
          y: -30,
          vx: (Math.random() - 0.5) * 2,
          vy: 2.2 + Math.random() * 1.5,
          w: 26,
          h: 24,
          hp: 2,
          maxHp: 2,
          type: 'small',
          color: '#ef4444',
          shootTimer: 40 + Math.random() * 50,
        });
      } else {
        // Medium bomber
        enemies.push({
          x: 40 + Math.random() * (canvas.width - 80),
          y: -45,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1.2 + Math.random() * 0.8,
          w: 42,
          h: 38,
          hp: 8,
          maxHp: 8,
          type: 'medium',
          color: '#8b5cf6',
          shootTimer: 30 + Math.random() * 40,
        });
      }
    };

    const spawnBoss = () => {
      bossSpawned = true;
      bossInstance = {
        x: canvas.width / 2 - 60,
        y: -90,
        vx: 1.8,
        vy: 1.0,
        w: 120,
        h: 80,
        hp: 120 + pStage * 40,
        maxHp: 120 + pStage * 40,
        type: 'boss',
        color: '#dc2626',
        shootTimer: 30,
      };
      enemies.push(bossInstance);
    };

    let lastShotFrame = 0;

    // Game loop
    const update = () => {
      frameCount++;

      if (isPlaying && !isGameOver) {
        // Controls
        if ((keys['ArrowLeft'] || keys['KeyA']) && player.x > player.w / 2) player.x -= player.speed;
        if ((keys['ArrowRight'] || keys['KeyD']) && player.x < canvas.width - player.w / 2) player.x += player.speed;
        if ((keys['ArrowUp'] || keys['KeyW']) && player.y > player.h / 2) player.y -= player.speed;
        if ((keys['ArrowDown'] || keys['KeyS']) && player.y < canvas.height - player.h / 2) player.y += player.speed;

        // Auto/Key Shoot
        if (keys['Space'] || frameCount % 9 === 0) {
          if (frameCount - lastShotFrame > 8) {
            lastShotFrame = frameCount;
            playSfx('shoot');

            if (pWeapon === 1) {
              bullets.push({ x: player.x - 8, y: player.y - 12, vx: 0, vy: -10 });
              bullets.push({ x: player.x + 8, y: player.y - 12, vx: 0, vy: -10 });
            } else if (pWeapon === 2) {
              bullets.push({ x: player.x - 12, y: player.y - 10, vx: -1.5, vy: -10 });
              bullets.push({ x: player.x, y: player.y - 14, vx: 0, vy: -11 });
              bullets.push({ x: player.x + 12, y: player.y - 10, vx: 1.5, vy: -10 });
            } else {
              // Level 3 Spread
              bullets.push({ x: player.x - 16, y: player.y - 8, vx: -3, vy: -9.5 });
              bullets.push({ x: player.x - 6, y: player.y - 14, vx: -0.8, vy: -11 });
              bullets.push({ x: player.x + 6, y: player.y - 14, vx: 0.8, vy: -11 });
              bullets.push({ x: player.x + 16, y: player.y - 8, vx: 3, vy: -9.5 });
            }
          }
        }

        // Spawn logic
        if (!bossSpawned && pScore > pStage * 2500) {
          spawnBoss();
        } else if (!bossInstance && frameCount % 55 === 0) {
          spawnEnemy();
        }

        if (player.invuln > 0) player.invuln--;
      }

      // Update stars
      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > canvas.height) {
          s.y = 0;
          s.x = Math.random() * canvas.width;
        }
      });

      // Update bullets
      bullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
      });
      bullets = bullets.filter(b => b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height);

      // Update enemies
      enemies.forEach(en => {
        en.x += en.vx;
        en.y += en.vy;

        if (en.type === 'boss') {
          if (en.y < 70) en.vy = 1;
          else en.vy = 0;

          if (en.x <= 20 || en.x >= canvas.width - en.w - 20) {
            en.vx = -en.vx;
          }

          en.shootTimer--;
          if (en.shootTimer <= 0) {
            en.shootTimer = 40;
            // Boss 3-way shot
            bullets.push({ x: en.x + en.w / 2, y: en.y + en.h, vx: -2, vy: 4.5, isEnemy: true, radius: 4 });
            bullets.push({ x: en.x + en.w / 2, y: en.y + en.h, vx: 0, vy: 5, isEnemy: true, radius: 4 });
            bullets.push({ x: en.x + en.w / 2, y: en.y + en.h, vx: 2, vy: 4.5, isEnemy: true, radius: 4 });
          }
        } else {
          en.shootTimer--;
          if (en.shootTimer <= 0) {
            en.shootTimer = 75;
            bullets.push({ x: en.x + en.w / 2, y: en.y + en.h, vx: 0, vy: 4, isEnemy: true, radius: 3 });
          }
        }
      });

      // Check bullet-enemy collisions
      bullets.forEach((b, bIdx) => {
        if (b.isEnemy) return;
        enemies.forEach((en, eIdx) => {
          if (
            b.x > en.x &&
            b.x < en.x + en.w &&
            b.y > en.y &&
            b.y < en.y + en.h
          ) {
            en.hp--;
            bullets.splice(bIdx, 1);

            // Sparks
            for (let i = 0; i < 4; i++) {
              particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#fde047',
                life: 12,
                maxLife: 12,
                size: 2,
              });
            }

            if (en.hp <= 0) {
              playSfx('explosion');
              pScore += en.type === 'boss' ? 3000 : en.type === 'medium' ? 300 : 100;
              setScore(pScore);
              if (pScore > highScore) {
                setHighScore(pScore);
                try {
                  localStorage.setItem('typang_aircombat_highscore', String(pScore));
                } catch {}
              }

              // Explosions
              for (let i = 0; i < (en.type === 'boss' ? 40 : 15); i++) {
                particles.push({
                  x: en.x + Math.random() * en.w,
                  y: en.y + Math.random() * en.h,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  color: Math.random() > 0.5 ? '#ef4444' : '#f59e0b',
                  life: 25,
                  maxLife: 25,
                  size: 3.5,
                });
              }

              // Drop item
              if (Math.random() < 0.25 || en.type === 'boss') {
                const iType: 'p' | 'b' | 's' = Math.random() < 0.6 ? 'p' : Math.random() < 0.85 ? 'b' : 's';
                items.push({ x: en.x + en.w / 2, y: en.y + en.h / 2, type: iType });
              }

              if (en.type === 'boss') {
                bossInstance = null;
                bossSpawned = false;
                pStage++;
                setStage(pStage);
              }

              enemies.splice(eIdx, 1);
            }
          }
        });
      });

      // Filter off-screen enemies
      enemies = enemies.filter(en => en.y < canvas.height + 60);

      // Update items
      items.forEach((it, idx) => {
        it.y += 1.8;
        // Collision with player
        if (
          Math.hypot(it.x - player.x, it.y - player.y) < 28
        ) {
          playSfx('item');
          if (it.type === 'p') {
            if (pWeapon < 3) pWeapon++;
            setWeaponLevel(pWeapon);
          } else if (it.type === 'b') {
            pBombs = Math.min(pBombs + 1, 5);
            setBombs(pBombs);
          } else if (it.type === 's') {
            pScore += 500;
            setScore(pScore);
          }
          items.splice(idx, 1);
        }
      });
      items = items.filter(it => it.y < canvas.height + 20);

      // Check player damage
      if (isPlaying && !isGameOver && player.invuln <= 0) {
        // Bullets hit player
        bullets.forEach((b, idx) => {
          if (b.isEnemy && Math.hypot(b.x - player.x, b.y - player.y) < 14) {
            bullets.splice(idx, 1);
            handlePlayerHit();
          }
        });

        // Enemies hit player
        enemies.forEach(en => {
          if (
            player.x > en.x &&
            player.x < en.x + en.w &&
            player.y > en.y &&
            player.y < en.y + en.h
          ) {
            handlePlayerHit();
          }
        });
      }

      function handlePlayerHit() {
        playSfx('explosion');
        pLives--;
        setLives(pLives);
        player.invuln = 90;
        pWeapon = Math.max(1, pWeapon - 1);
        setWeaponLevel(pWeapon);

        for (let i = 0; i < 25; i++) {
          particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: '#f87171',
            life: 20,
            maxLife: 20,
            size: 3,
          });
        }

        if (pLives <= 0) {
          setIsGameOver(true);
          setIsPlaying(false);
        }
      }

      // Update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter(p => p.life > 0);

      // ================= DRAWING =================
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Stars
      ctx.fillStyle = '#94a3b8';
      stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Draw Items
      items.forEach(it => {
        ctx.fillStyle = it.type === 'p' ? '#38bdf8' : it.type === 'b' ? '#f59e0b' : '#34d399';
        ctx.beginPath();
        ctx.arc(it.x, it.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(it.type === 'p' ? 'P' : it.type === 'b' ? 'B' : '★', it.x, it.y);
      });

      // Draw Enemies
      enemies.forEach(en => {
        ctx.save();
        ctx.translate(en.x + en.w / 2, en.y + en.h / 2);
        if (en.type === 'boss') {
          // Giant Red Bomber Fortress
          ctx.fillStyle = en.color;
          ctx.beginPath();
          ctx.moveTo(0, en.h / 2);
          ctx.lineTo(en.w / 2, -en.h / 2 + 10);
          ctx.lineTo(en.w / 4, -en.h / 2);
          ctx.lineTo(-en.w / 4, -en.h / 2);
          ctx.lineTo(-en.w / 2, -en.h / 2 + 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fca5a5';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Boss Health bar
          ctx.restore();
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(en.x, en.y - 12, en.w, 6);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(en.x, en.y - 12, en.w * (en.hp / en.maxHp), 6);
        } else if (en.type === 'medium') {
          // Medium Bomber
          ctx.fillStyle = en.color;
          ctx.beginPath();
          ctx.moveTo(0, en.h / 2);
          ctx.lineTo(en.w / 2, -en.h / 4);
          ctx.lineTo(-en.w / 2, -en.h / 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        } else {
          // Small Jet
          ctx.fillStyle = en.color;
          ctx.beginPath();
          ctx.moveTo(0, en.h / 2);
          ctx.lineTo(en.w / 2, -en.h / 2);
          ctx.lineTo(0, -en.h / 4);
          ctx.lineTo(-en.w / 2, -en.h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Bullets
      bullets.forEach(b => {
        if (b.isEnemy) {
          ctx.fillStyle = '#f87171';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius || 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(b.x - 2, b.y - 8, 4, 10);
        }
      });

      // Draw Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Draw Player Fighter
      if (isPlaying && !isGameOver) {
        if (player.invuln % 6 < 3) {
          ctx.save();
          ctx.translate(player.x, player.y);

          // Jet Body (P-38 style Twin Boom)
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(16, 12);
          ctx.lineTo(6, 16);
          ctx.lineTo(0, 10);
          ctx.lineTo(-6, 16);
          ctx.lineTo(-16, 12);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Cockpit glass
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.ellipse(0, -4, 4, 9, 0, 0, Math.PI * 2);
          ctx.fill();

          // Jet Engine flame
          ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#facc15';
          ctx.fillRect(-4, 12, 3, 6 + Math.random() * 4);
          ctx.fillRect(1, 12, 3, 6 + Math.random() * 4);

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver, isMuted]);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    setBombs(2);
    setWeaponLevel(1);
    setStage(1);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border-2 border-sky-500/40 shadow-2xl p-2 sm:p-4 select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-[500px] flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-t-xl border-b border-sky-500/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">✈️</span>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-sky-300 font-arcade">
              1945 레트로 공중전 (Air Combat)
            </h2>
            <span className="text-[10px] text-slate-400">깃허브 정식 수록 비행기 슈팅</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30 text-[11px] font-bold"
            title="원본 AI Studio 앱 전체화면 열기"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Studio 원본</span>
          </a>
        </div>
      </div>

      {/* Game Stage & HUD */}
      <div className="w-full max-w-[500px] bg-slate-900 px-4 py-1.5 flex items-center justify-between text-xs font-mono border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-amber-300 font-bold">SCORE: {score}</span>
          <span className="text-slate-400">HI: {highScore}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-rose-400 font-bold">LIVES: {'❤️'.repeat(Math.max(0, lives))}</span>
          <span className="text-amber-400 font-bold">BOMB: {'💣'.repeat(Math.max(0, bombs))}</span>
          <span className="px-1.5 py-0.5 rounded bg-sky-900 text-sky-200 text-[10px]">ST {stage}</span>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="relative w-full max-w-[500px] aspect-[4/5] bg-black flex items-center justify-center overflow-hidden border border-slate-800">
        <canvas
          ref={canvasRef}
          width={450}
          height={550}
          className="w-full h-full object-contain"
        />

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
            <span className="text-5xl animate-bounce">🛩️</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-yellow-300 to-amber-400 font-arcade">
                {isGameOver ? 'MISSION FAILED' : '1945 AIR COMBAT'}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                {isGameOver ? `최종 점수: ${score}점` : '적 편대를 격추하고 보스를 격파하세요!'}
              </p>
            </div>

            <button
              onClick={startGame}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-sm tracking-wide shadow-lg shadow-sky-500/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isGameOver ? '다시 도전하기' : '게임 시작 (START)'}</span>
            </button>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>조작키: 방향키 (이동) | 스페이스바 (발사) | B / X키 (폭탄 필살기)</p>
              <p className="text-amber-400/90">아이템: P (파워업) | B (폭탄 충전) | ★ (보너스 점수)</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls / Mobile Touch Bar */}
      <div className="w-full max-w-[500px] bg-slate-900/90 px-4 py-2 rounded-b-xl flex items-center justify-between text-[11px] text-slate-400">
        <span>폭탄키: [B] 또는 [X]</span>
        <button
          onClick={() => {
            const ev = new KeyboardEvent('keydown', { code: 'KeyB' });
            window.dispatchEvent(ev);
          }}
          className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md"
        >
          💣 필살 폭탄 투하
        </button>
      </div>
    </div>
  );
};
