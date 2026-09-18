import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Zap, Shield, Sparkles } from 'lucide-react';

interface PocketKartGameProps {
  onBack?: () => void;
  currentUser?: any;
}

export const PocketKartGame: React.FC<PocketKartGameProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [lap, setLap] = useState(1);
  const [position, setPosition] = useState(1);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [raceTime, setRaceTime] = useState(0);
  const [bestTime, setBestTime] = useState(() => {
    try {
      return localStorage.getItem('typang_pocketkart_best') || '--:--';
    } catch {
      return '--:--';
    }
  });
  const [isMuted, setIsMuted] = useState(false);

  // Audio synthesizer ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playKartSfx = (type: 'engine' | 'drift' | 'boost' | 'item' | 'hit' | 'finish') => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'boost') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'item') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'drift') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'finish') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.15);
        osc.frequency.setValueAtTime(783, now + 0.3);
        osc.frequency.setValueAtTime(1046, now + 0.45);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
      }
    } catch {}
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let startTime = Date.now();

    const keys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
      if (e.code === 'KeyZ' || e.code === 'ControlLeft') {
        useStoredItem();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Track Waypoints (circular Grand Prix track)
    const trackCenter = { x: canvas.width / 2, y: canvas.height / 2 };
    const trackRadiusX = 210;
    const trackRadiusY = 150;
    const trackWidth = 75;

    // Player Kart State
    const player = {
      x: trackCenter.x,
      y: trackCenter.y + trackRadiusY,
      angle: 0,
      speed: 0,
      maxSpeed: 6.2,
      accel: 0.14,
      friction: 0.97,
      turnSpeed: 0.048,
      drift: false,
      driftTime: 0,
      boostTimer: 0,
      spinTimer: 0,
      currentLap: 1,
      lastCheckPoint: 0,
    };

    // AI Karts (3 competitors)
    const aiKarts = [
      { id: 'ai1', angleOnTrack: 0.1, speed: 4.8, color: '#3b82f6', currentLap: 1, lastCheckPoint: 0, spinTimer: 0 },
      { id: 'ai2', angleOnTrack: 0.2, speed: 4.5, color: '#10b981', currentLap: 1, lastCheckPoint: 0, spinTimer: 0 },
      { id: 'ai3', angleOnTrack: 0.3, speed: 4.2, color: '#f59e0b', currentLap: 1, lastCheckPoint: 0, spinTimer: 0 },
    ];

    // Obstacles & Items on track
    interface ItemBox { angle: number; active: boolean; respawnTimer: number }
    interface Hazard { x: number; y: number; type: 'banana' | 'oil'; life: number }
    interface Particle { x: number; y: number; vx: number; vy: number; color: string; life: number }

    let itemBoxes: ItemBox[] = [
      { angle: 0.8, active: true, respawnTimer: 0 },
      { angle: 2.4, active: true, respawnTimer: 0 },
      { angle: 4.0, active: true, respawnTimer: 0 },
      { angle: 5.5, active: true, respawnTimer: 0 },
    ];
    let hazards: Hazard[] = [];
    let particles: Particle[] = [];
    let heldItem: 'boost' | 'banana' | 'shield' | null = null;

    const useStoredItem = () => {
      if (!heldItem) return;
      if (heldItem === 'boost') {
        player.boostTimer = 70;
        playKartSfx('boost');
        for (let i = 0; i < 20; i++) {
          particles.push({
            x: player.x,
            y: player.y,
            vx: -Math.cos(player.angle) * 4 + (Math.random() - 0.5) * 3,
            vy: -Math.sin(player.angle) * 4 + (Math.random() - 0.5) * 3,
            color: '#f97316',
            life: 25,
          });
        }
      } else if (heldItem === 'banana') {
        hazards.push({
          x: player.x - Math.cos(player.angle) * 25,
          y: player.y - Math.sin(player.angle) * 25,
          type: 'banana',
          life: 600,
        });
        playKartSfx('item');
      }
      heldItem = null;
      setActiveItem(null);
    };

    const update = () => {
      if (isPlaying && !isFinished) {
        setRaceTime(Math.floor((Date.now() - startTime) / 1000));

        // Player Controls
        if (player.spinTimer > 0) {
          player.spinTimer--;
          player.angle += 0.25;
          player.speed *= 0.9;
        } else {
          // Acceleration / Reverse
          const isBoosting = player.boostTimer > 0;
          if (player.boostTimer > 0) player.boostTimer--;

          const topSpeed = isBoosting ? player.maxSpeed * 1.5 : player.maxSpeed;

          if (keys['ArrowUp'] || keys['KeyW']) {
            player.speed = Math.min(topSpeed, player.speed + player.accel);
          } else if (keys['ArrowDown'] || keys['KeyS']) {
            player.speed = Math.max(-2, player.speed - player.accel);
          } else {
            player.speed *= player.friction;
          }

          // Steering & Drift
          const isDrifting = (keys['ShiftLeft'] || keys['ShiftRight'] || keys['Space']) && Math.abs(player.speed) > 1.5;
          player.drift = isDrifting;

          if (isDrifting) {
            player.driftTime++;
            if (player.driftTime % 10 === 0) playKartSfx('drift');
            // Drift sparks
            particles.push({
              x: player.x - Math.cos(player.angle) * 12,
              y: player.y - Math.sin(player.angle) * 12,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              color: player.driftTime > 40 ? '#ef4444' : '#38bdf8',
              life: 15,
            });
          } else {
            if (player.driftTime > 30) {
              // Mini Turbo Boost!
              player.boostTimer = 40;
              playKartSfx('boost');
            }
            player.driftTime = 0;
          }

          const turnMultiplier = isDrifting ? 1.4 : 1.0;
          if (keys['ArrowLeft'] || keys['KeyA']) {
            player.angle -= player.turnSpeed * turnMultiplier * (player.speed / player.maxSpeed);
          }
          if (keys['ArrowRight'] || keys['KeyD']) {
            player.angle += player.turnSpeed * turnMultiplier * (player.speed / player.maxSpeed);
          }

          // Move player
          player.x += Math.cos(player.angle) * player.speed;
          player.y += Math.sin(player.angle) * player.speed;

          // Check track surface (off-road slow down)
          const distToCenter = Math.hypot(
            (player.x - trackCenter.x) / trackRadiusX,
            (player.y - trackCenter.y) / trackRadiusY
          );
          if (Math.abs(distToCenter - 1.0) > 0.28) {
            // Grass friction
            player.speed *= 0.94;
          }

          setCurrentSpeed(Math.round(Math.abs(player.speed) * 20));

          // Lap Progress Checkpoint (track angle from center)
          let currentTrackAngle = Math.atan2(player.y - trackCenter.y, player.x - trackCenter.x);
          if (currentTrackAngle < 0) currentTrackAngle += Math.PI * 2;

          // Check finish line (around angle = Math.PI / 2)
          if (currentTrackAngle > 1.4 && currentTrackAngle < 1.7) {
            if (player.lastCheckPoint === 3) {
              player.currentLap++;
              setLap(player.currentLap);
              player.lastCheckPoint = 0;

              if (player.currentLap > 3) {
                // RACE FINISHED!
                setIsFinished(true);
                setIsPlaying(false);
                playKartSfx('finish');
                const totalSec = Math.floor((Date.now() - startTime) / 1000);
                const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
                const sec = String(totalSec % 60).padStart(2, '0');
                const finalTimeStr = `${min}:${sec}`;
                setBestTime(finalTimeStr);
                try {
                  localStorage.setItem('typang_pocketkart_best', finalTimeStr);
                } catch {}
              }
            }
          } else if (currentTrackAngle > 3.0 && currentTrackAngle < 3.4) {
            player.lastCheckPoint = 1;
          } else if (currentTrackAngle > 4.5 && currentTrackAngle < 4.9) {
            player.lastCheckPoint = 2;
          } else if (currentTrackAngle > 5.8 && currentTrackAngle < 6.2) {
            player.lastCheckPoint = 3;
          }
        }

        // Update AI Karts
        aiKarts.forEach(ai => {
          if (ai.spinTimer > 0) {
            ai.spinTimer--;
          } else {
            ai.angleOnTrack += (ai.speed / (trackRadiusX * 2 * Math.PI)) * 1.5;
            if (ai.angleOnTrack > Math.PI * 2) {
              ai.angleOnTrack -= Math.PI * 2;
              ai.currentLap++;
            }
          }
        });

        // Calculate rankings
        let rank = 1;
        aiKarts.forEach(ai => {
          if (ai.currentLap > player.currentLap) rank++;
        });
        setPosition(rank);

        // Update Item boxes
        itemBoxes.forEach(box => {
          if (!box.active) {
            box.respawnTimer--;
            if (box.respawnTimer <= 0) box.active = true;
          } else {
            const bx = trackCenter.x + Math.cos(box.angle) * trackRadiusX;
            const by = trackCenter.y + Math.sin(box.angle) * trackRadiusY;
            if (Math.hypot(player.x - bx, player.y - by) < 26) {
              box.active = false;
              box.respawnTimer = 180;
              playKartSfx('item');
              const itemType = Math.random() > 0.5 ? 'boost' : 'banana';
              heldItem = itemType;
              setActiveItem(itemType);
            }
          }
        });

        // Check Hazards (Bananas)
        hazards.forEach((haz, idx) => {
          if (Math.hypot(player.x - haz.x, player.y - haz.y) < 22) {
            hazards.splice(idx, 1);
            player.spinTimer = 45;
            playKartSfx('hit');
          }
        });
      }

      // Update particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter(p => p.life > 0);

      // ================= DRAW CANVAS =================
      // Grass Background
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Circuit Road (Outer & Inner Track border)
      ctx.save();
      // Asphalt Track
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackRadiusX, trackRadiusY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = trackWidth;
      ctx.stroke();

      // Red/White Curb Edges
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackRadiusX + trackWidth / 2, trackRadiusY + trackWidth / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackRadiusX - trackWidth / 2, trackRadiusY - trackWidth / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Infield Grass Oval
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(trackCenter.x, trackCenter.y, trackRadiusX - trackWidth / 2 - 2, trackRadiusY - trackWidth / 2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Finish / Start Line (Checkered Pattern)
      const finishY = trackCenter.y + trackRadiusY;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(trackCenter.x - 8, finishY - trackWidth / 2, 16, trackWidth);
      ctx.fillStyle = '#000000';
      for (let r = 0; r < trackWidth / 10; r++) {
        for (let c = 0; c < 2; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(trackCenter.x - 8 + c * 8, finishY - trackWidth / 2 + r * 10, 8, 10);
          }
        }
      }

      // Draw Item Boxes
      itemBoxes.forEach(box => {
        if (box.active) {
          const bx = trackCenter.x + Math.cos(box.angle) * trackRadiusX;
          const by = trackCenter.y + Math.sin(box.angle) * trackRadiusY;
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(bx - 10, by - 10, 20, 20);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.strokeRect(bx - 10, by - 10, 20, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('?', bx - 4, by + 4);
        }
      });

      // Draw Hazards (Bananas)
      hazards.forEach(haz => {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(haz.x, haz.y, 7, 0, Math.PI);
        ctx.fill();
      });

      // Draw AI Karts
      aiKarts.forEach(ai => {
        const ax = trackCenter.x + Math.cos(ai.angleOnTrack) * trackRadiusX;
        const ay = trackCenter.y + Math.sin(ai.angleOnTrack) * trackRadiusY;
        const aiAngle = ai.angleOnTrack + Math.PI / 2;

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(aiAngle);
        ctx.fillStyle = ai.color;
        ctx.fillRect(-10, -6, 20, 12);
        // Tires
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-9, -8, 5, 2);
        ctx.fillRect(4, -8, 5, 2);
        ctx.fillRect(-9, 6, 5, 2);
        ctx.fillRect(4, 6, 5, 2);
        ctx.restore();
      });

      // Draw Particles
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Player Kart
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // Kart Body (Red Racer)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(-12, -7, 24, 14, 4);
      ctx.fill();
      ctx.strokeStyle = '#fee2e2';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Driver Helmet (Yellow)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-11, -9, 6, 2.5);
      ctx.fillRect(5, -9, 6, 2.5);
      ctx.fillRect(-11, 6.5, 6, 2.5);
      ctx.fillRect(5, 6.5, 6, 2.5);

      // Exhaust Flame when boosting
      if (player.boostTimer > 0) {
        ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#facc15';
        ctx.fillRect(-18, -3, 6, 6);
      }

      ctx.restore();

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isFinished, isMuted]);

  const startRace = () => {
    setIsPlaying(true);
    setIsFinished(false);
    setLap(1);
    setPosition(1);
    setActiveItem(null);
  };

  return (
    <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-950 border-2 border-red-500/40 shadow-2xl p-2 sm:p-4 select-none">
      {/* Top Bar */}
      <div className="w-full max-w-[560px] flex items-center justify-between bg-slate-900/90 px-4 py-2.5 rounded-t-xl border-b border-red-500/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏎️</span>
          <div>
            <h2 className="text-xs sm:text-sm font-black text-red-400 font-arcade">
              포켓 카트라이더 (Pocket Kart Grand Prix)
            </h2>
            <span className="text-[10px] text-slate-400">깃허브 정식 수록 카트 레이싱</span>
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
        </div>
      </div>

      {/* Race HUD */}
      <div className="w-full max-w-[560px] bg-slate-900 px-4 py-2 flex items-center justify-between text-xs font-mono border-b border-slate-800">
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-black text-sm">
            {position === 1 ? '🥇 1ST' : position === 2 ? '🥈 2ND' : position === 3 ? '🥉 3RD' : '4TH'}
          </span>
          <span className="text-sky-300 font-bold">LAP: {Math.min(lap, 3)} / 3</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">SPEED: {currentSpeed} km/h</span>
          <span className="text-slate-400">BEST: {bestTime}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full max-w-[560px] aspect-[4/3] bg-emerald-700 flex items-center justify-center overflow-hidden border border-slate-800">
        <canvas
          ref={canvasRef}
          width={560}
          height={420}
          className="w-full h-full object-contain"
        />

        {/* Start / Finish Overlay */}
        {(!isPlaying || isFinished) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
            <span className="text-5xl animate-bounce">🏁</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-300 to-yellow-400 font-arcade">
                {isFinished ? 'GOAL IN! RACE FINISHED' : 'POCKET KART GP'}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                {isFinished ? `최종 순위: ${position}위 | 기록: ${bestTime}` : '드리프트와 아이템으로 3바퀴를 1등으로 완주하세요!'}
              </p>
            </div>

            <button
              onClick={startRace}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white font-black text-sm tracking-wide shadow-lg shadow-red-500/30 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isFinished ? '다시 달리기' : '레이스 시작 (START)'}</span>
            </button>

            <div className="text-[11px] text-slate-400 space-y-1">
              <p>조작: 방향키 (가속/후진/핸들링) | Shift 또는 Space (드리프트 & 부스터 충전)</p>
              <p className="text-amber-400/90">아이템 사용: [Z] 키 또는 화면 아이템 버튼</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Item & Drift Controls */}
      <div className="w-full max-w-[560px] bg-slate-900/90 px-4 py-2 rounded-b-xl flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span>획득 아이템:</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">
            {activeItem === 'boost' ? '🚀 니트로 부스터' : activeItem === 'banana' ? '🍌 바나나 트랩' : '없음 (상자 획득)'}
          </span>
        </div>

        <button
          onClick={() => {
            const ev = new KeyboardEvent('keydown', { code: 'KeyZ' });
            window.dispatchEvent(ev);
          }}
          className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50"
          disabled={!activeItem}
        >
          아이템 사용 [Z]
        </button>
      </div>
    </div>
  );
};
