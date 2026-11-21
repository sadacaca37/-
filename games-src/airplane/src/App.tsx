import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, PlaneId, HighScoreEntry, GameSettings, GameMode } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_HIGH_SCORES, DEFAULT_SETTINGS, PLANES, STAGES } from './game/constants';
import { GameEngine } from './game/engine';
import { SpriteRenderer } from './game/sprites';
import { retroAudio } from './audio/retroAudio';
import { duo } from './duo';
import { TitleScreen } from './components/TitleScreen';
import { PlaneSelectModal } from './components/PlaneSelectModal';
import { GameOverModal } from './components/GameOverModal';
import { StageClearModal } from './components/StageClearModal';
import { VictoryModal } from './components/VictoryModal';
import { HighScoresModal } from './components/HighScoresModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PauseMenu } from './components/PauseMenu';
import { ArcadeHUD } from './components/ArcadeHUD';
import { MobileControls } from './components/MobileControls';
import { Volume2, VolumeX, Coins, Monitor, HelpCircle, Trophy, Users, User } from 'lucide-react';

const HIGH_SCORES_KEY = 'retro_1945_high_scores';
const SETTINGS_KEY = 'retro_1945_settings';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // States
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('1P');
  const [selectedPlane, setSelectedPlane] = useState<PlaneId>('AV8_HARRIER');
  const [selectedPlane2, setSelectedPlane2] = useState<PlaneId>('F22_RAPTOR');
  const [credits, setCredits] = useState<number>(3);
  const [highScores, setHighScores] = useState<HighScoreEntry[]>(() => {
    try {
      const saved = localStorage.getItem(HIGH_SCORES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_HIGH_SCORES;
    } catch {
      return INITIAL_HIGH_SCORES;
    }
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Modal overlays
  const [showHighScores, setShowHighScores] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // In-game reactive HUD states for UI
  const [hudScore, setHudScore] = useState(0);
  const [hudLives, setHudLives] = useState(3);
  const [hudBombs, setHudBombs] = useState(3);
  const [hudLoops, setHudLoops] = useState(3);
  const [hudPower, setHudPower] = useState(1);
  const [hud2PScore, setHud2PScore] = useState(0);
  const [hud2PLives, setHud2PLives] = useState(3);
  const [hud2PBombs, setHud2PBombs] = useState(3);
  const [hud2PLoops, setHud2PLoops] = useState(3);
  const [hud2PPower, setHud2PPower] = useState(1);
  const [hudStageIndex, setHudStageIndex] = useState(0);
  const [hudWarningTimer, setHudWarningTimer] = useState(0);

  // Controls input tracking
  const keysRef = useRef<{ [k: string]: boolean }>({});
  const mousePosRef = useRef<{ x: number; y: number; isDown: boolean } | undefined>(undefined);
  const virtualDirectionRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Initialize Audio & Game Engine on start
  const handleInsertCoin = useCallback(() => {
    retroAudio.playCoin();
    setCredits((c) => c + 1);
  }, []);

  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      } catch {}
      if (engineRef.current) {
        engineRef.current.settings = updated;
      }
      return updated;
    });
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = retroAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  const startNewGame = useCallback((planeId1: PlaneId, planeId2?: PlaneId, mode: GameMode = gameMode) => {
    setSelectedPlane(planeId1);
    const p2Id = planeId2 || selectedPlane2;
    if (planeId2) setSelectedPlane2(planeId2);
    setGameMode(mode);

    if (!engineRef.current) {
      engineRef.current = new GameEngine(planeId1, settings, mode, p2Id);
    } else {
      engineRef.current.restart(planeId1, p2Id, mode);
    }
    setGameState('PLAYING');
  }, [settings, gameMode, selectedPlane2]);

  // ---------- 2인 대결: 각자 컴퓨터에서 방 번호로 들어와 같은 스테이지를 동시에 (../_duo/duo.js) ----------
  // 한 판 = 한 스테이지. 스테이지를 깨고 방장이 다음 스테이지를 누르면 두 화면이 같이 다음 스테이지 시작
  const selectedPlaneRef = useRef(selectedPlane);
  const duoRef = useRef({ gameState, startNewGame });
  duoRef.current = { gameState, startNewGame };
  useEffect(() => {
    duo()?.init({
      game: 'airplane',
      title: '하늘 비행 대작전',
      mode: 'score',
      btnStyle: 'top:6px;left:50%;right:auto;transform:translateX(-50%)',
      hudStyle: 'top:auto;bottom:8px',
      onStart: (s) => {
        const stage = Math.max(0, Math.min(STAGES.length - 1, Number(s?.stage) || 0));
        const cur = duoRef.current;
        const eng = engineRef.current;
        if (stage > 0 && eng && cur.gameState === 'STAGE_CLEAR' && eng.currentStageIndex + 1 === stage) {
          eng.nextStage();
          setGameState('PLAYING');
          return;
        }
        cur.startNewGame(selectedPlaneRef.current, undefined, '1P');
        for (let i = 0; i < stage; i++) engineRef.current?.nextStage();
      },
    });
  }, []);
  useEffect(() => {
    const dd = duo();
    if ((gameState === 'TITLE' || gameState === 'PLANE_SELECT') && dd && dd.playing) dd.finish({ cleared: false, score: 0, label: '중간에 나감' });
  }, [gameState]);

  // Eagerly initialize all sprite caches on mount
  useEffect(() => {
    SpriteRenderer.initBgImages();
    SpriteRenderer.initPlayerImages();
    SpriteRenderer.initEnemyImages();
  }, []);

  // BGM Stage & GameState Synchronization
  useEffect(() => {
    if (gameState === 'TITLE') {
      retroAudio.playBgm('TITLE');
    } else if (gameState === 'PLANE_SELECT') {
      retroAudio.playBgm('PLANE_SELECT');
    } else if (gameState === 'PLAYING') {
      if (engineRef.current?.bossActive) {
        retroAudio.playBgm('BOSS');
      } else {
        const stageTrack = hudStageIndex === 0 ? 'STAGE_1' : hudStageIndex === 1 ? 'STAGE_2' : hudStageIndex === 2 ? 'STAGE_3' : 'STAGE_4';
        retroAudio.playBgm(stageTrack);
      }
    } else if (gameState === 'STAGE_CLEAR') {
      retroAudio.playBgm('STAGE_CLEAR');
    } else if (gameState === 'VICTORY') {
      retroAudio.playBgm('VICTORY');
    } else if (gameState === 'GAME_OVER') {
      retroAudio.playBgm('GAME_OVER');
    }
  }, [gameState, hudStageIndex]);

  // Main 60FPS Game Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const renderLoop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const canvas = canvasRef.current;
      const engine = engineRef.current;

      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = false;

          // Merge virtual joystick into keys (affects 1P)
          const activeKeys = { ...keysRef.current };
          if (virtualDirectionRef.current.dx < -0.3) {
            activeKeys['KeyA'] = true;
            if (engine.gameMode === '1P') activeKeys['ArrowLeft'] = true;
          }
          if (virtualDirectionRef.current.dx > 0.3) {
            activeKeys['KeyD'] = true;
            if (engine.gameMode === '1P') activeKeys['ArrowRight'] = true;
          }
          if (virtualDirectionRef.current.dy < -0.3) {
            activeKeys['KeyW'] = true;
            if (engine.gameMode === '1P') activeKeys['ArrowUp'] = true;
          }
          if (virtualDirectionRef.current.dy > 0.3) {
            activeKeys['KeyS'] = true;
            if (engine.gameMode === '1P') activeKeys['ArrowDown'] = true;
          }

          // Update Engine State if PLAYING
          if (gameState === 'PLAYING') {
            const nextState = engine.update(dt, activeKeys, mousePosRef.current);
            if (nextState) {
              // 2인 대결: 스테이지를 깨면 완주, 게임 오버면 탈락
              const dd = duo();
              if (dd && dd.playing) {
                const sc = engine.player.score;
                if (nextState === 'STAGE_CLEAR' || nextState === 'VICTORY') dd.finish({ cleared: true, score: sc, label: sc.toLocaleString() + '점' });
                else if (nextState === 'GAME_OVER') dd.finish({ cleared: false, score: sc, label: sc.toLocaleString() + '점' });
              }
              setGameState(nextState);
            }
            {
              const dd = duo();
              const me = engine.player;
              if (dd && dd.playing && me.lives > 0) {
                dd.send({ x: me.x, y: me.y, pl: me.planeId, t: me.tilt, lp: me.isLooping ? me.loopProgress : 0, stage: engine.currentStageIndex, score: me.score, label: me.score.toLocaleString() + '점' });
              }
            }

            // Sync 1P HUD
            setHudScore(engine.player.score);
            setHudLives(engine.player.lives);
            setHudBombs(engine.player.bombs);
            setHudLoops(engine.player.loopsRemaining);
            setHudPower(engine.player.powerLevel);

            // Sync 2P HUD if present
            if (engine.player2) {
              setHud2PScore(engine.player2.score);
              setHud2PLives(engine.player2.lives);
              setHud2PBombs(engine.player2.bombs);
              setHud2PLoops(engine.player2.loopsRemaining);
              setHud2PPower(engine.player2.powerLevel);
            }

            setHudStageIndex(engine.currentStageIndex);
            setHudWarningTimer(engine.warningTimer);
          }

          // Screen Shake Offset (Gentle smooth decay, no jarring disorienting jumps)
          ctx.save();
          if (engine.screenShakeTime > 0) {
            const decay = Math.min(1.0, Math.max(0, engine.screenShakeTime / 0.3));
            const shakeX = (Math.random() - 0.5) * (engine.screenShakeIntensity * decay);
            const shakeY = (Math.random() - 0.5) * (engine.screenShakeIntensity * decay * 0.7);
            ctx.translate(shakeX, shakeY);
          }

          // 1. Draw Parallax Background
          const currentStage = STAGES[engine.currentStageIndex] || STAGES[0];
          SpriteRenderer.drawBackground(
            ctx,
            currentStage.stageNumber,
            currentStage.theme,
            engine.scrollOffset,
            engine.gameTime
          );

          // 2. Draw Sea & Ground Enemies
          for (const e of engine.enemies) {
            if (e.isGroundOrSea) {
              SpriteRenderer.drawEnemy(ctx, e, engine.gameTime);
            }
          }

          // 3. Draw Collectible Items
          for (const item of engine.items) {
            SpriteRenderer.drawItem(ctx, item, engine.gameTime);
          }

          // 4. Draw Airborne Enemies & Bosses
          for (const e of engine.enemies) {
            if (!e.isGroundOrSea) {
              SpriteRenderer.drawEnemy(ctx, e, engine.gameTime);
            }
          }

          // 4-1. 2인 대결: 친구 비행기를 반투명으로
          {
            const dd = duo();
            const ps = dd && dd.inRoom && gameState !== 'TITLE' ? dd.peerState() : null;
            if (ps && ps.stage === engine.currentStageIndex) {
              ctx.save();
              ctx.globalAlpha = 0.45;
              SpriteRenderer.drawPlayer(ctx, { ...engine.player, x: ps.x, y: ps.y, planeId: ps.pl, tilt: ps.t || 0, isLooping: ps.lp > 0, loopProgress: ps.lp || 0, isInvincible: false, options: 0, playerNumber: 2 } as any, engine.gameTime);
              ctx.restore();
              dd!.drawTag(ctx, ps.x, ps.y - engine.player.height / 2 - 6);
            }
          }

          // 5. Draw Player Planes & Escort Drones (1P and 2P)
          if (engine.player.lives > 0) {
            SpriteRenderer.drawPlayer(ctx, engine.player, engine.gameTime);
          }
          if (engine.player2 && engine.player2.lives > 0) {
            SpriteRenderer.drawPlayer(ctx, engine.player2, engine.gameTime);
          }

          // 6. Draw Projectiles
          for (const b of engine.playerBullets) {
            SpriteRenderer.drawBullet(ctx, b, engine.gameTime);
          }
          for (const eb of engine.enemyBullets) {
            SpriteRenderer.drawBullet(ctx, eb, engine.gameTime);
          }

          // 7. Draw Bomb Shockwaves
          for (const bomb of engine.bombEffects) {
            SpriteRenderer.drawBombEffect(ctx, bomb);
          }

          // 8. Draw Particles & Sparks
          SpriteRenderer.drawParticles(ctx, engine.particles);

          // 9. Draw Floating Score Popups
          for (const ft of engine.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 10px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  // Global Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;

      // Start Audio Context on any key
      retroAudio.init();

      // Insert Coin on '5'
      if (e.code === 'Digit5') {
        handleInsertCoin();
      }

      // Quick Actions in PLAYING state
      if (gameState === 'PLAYING' && engineRef.current) {
        // 1P Bomb & Loop
        if (e.code === 'KeyX') {
          engineRef.current.triggerBomb(1);
        } else if (e.code === 'KeyC') {
          engineRef.current.triggerLoop(1);
        }

        // 2P Bomb & Loop
        if (e.code === 'KeyN' || e.code === 'Numpad2') {
          engineRef.current.triggerBomb(2);
        } else if (e.code === 'KeyM' || e.code === 'Numpad3') {
          engineRef.current.triggerLoop(2);
        }

        if (e.code === 'Escape') {
          setGameState('PAUSED');
        }
      } else if (gameState === 'PAUSED' && e.code === 'Escape') {
        setGameState('PLAYING');
      } else if (gameState === 'TITLE' && (e.code === 'Space' || e.code === 'Enter')) {
        setGameState('PLANE_SELECT');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleInsertCoin]);

  // Mouse / Touch Move Coordinates mapped to Canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    mousePosRef.current = {
      x,
      y,
      isDown: mousePosRef.current?.isDown || false,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    retroAudio.init();
    if (gameState !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    mousePosRef.current = { x, y, isDown: true };
  };

  const handlePointerUp = () => {
    if (mousePosRef.current) {
      mousePosRef.current.isDown = false;
    }
  };

  // Save High Score (Top 30 Leaderboard)
  const handleSaveHighScore = (name: string) => {
    if (!engineRef.current) return;
    const newEntry: HighScoreEntry = {
      rank: 0,
      name,
      score: engineRef.current.stats.score,
      stage: engineRef.current.stats.stageNumber,
      planeId: selectedPlane,
      date: new Date().toLocaleDateString('ko-KR'),
    };

    const updated = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

    setHighScores(updated);
    try {
      localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const topHighScore = highScores.length > 0 ? highScores[0].score : 250000;

  return (
    <div className="w-screen h-screen bg-[#020617] text-slate-200 overflow-hidden font-mono select-none flex flex-col justify-between">
      {/* Top Mobile/Header Bar (Visible on mobile/tablet or compact) */}
      <header className="w-full flex lg:hidden justify-between items-center px-3 py-2 bg-[#0f172a] border-b border-slate-800 z-30 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 font-bold italic tracking-tight">
            SKY VANGUARD : 1945 {gameMode === '2P' && <span className="text-cyan-400 text-[10px] ml-1">[2P MODE]</span>}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={handleInsertCoin}
            className="flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-[10px] rounded cursor-pointer active:scale-95 transition-all"
          >
            <Coins className="w-3 h-3" />
            <span>CREDIT {credits}</span>
          </button>
          <button
            onClick={() => handleUpdateSettings({ scanlines: !settings.scanlines })}
            className={`p-1 rounded border text-[10px] cursor-pointer ${
              settings.scanlines
                ? 'bg-slate-800 border-amber-500/60 text-amber-400'
                : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
            title="Scanlines"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleMute}
            className="p-1 rounded bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
          </button>
        </div>
      </header>

      {/* Main Tactical Operations Layout (3-Column on Desktop / Responsive on mobile) */}
      <div className="flex-1 w-full h-full flex items-stretch justify-center overflow-hidden">
        {/* LEFT TACTICAL COMMAND PANEL (Professional Polish Theme) */}
        <aside className="hidden lg:flex w-64 bg-[#0f172a] border-r border-slate-800 p-5 flex-col justify-between z-10 shrink-0">
          <div className="space-y-6">
            {/* Header Brand */}
            <div className="border-b border-slate-700/80 pb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs animate-pulse" />
                <h1 className="text-amber-400 text-xl font-black italic tracking-tighter leading-none">
                  SKY<br />VANGUARD
                </h1>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-widest font-mono flex items-center justify-between">
                <span>TACTICAL AIR COMMAND</span>
                <span className={`px-1 rounded text-[9px] font-bold ${gameMode === '2P' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-amber-500/20 text-amber-400'}`}>
                  {gameMode}
                </span>
              </p>
            </div>

            {/* Score & Telemetry */}
            <div className="space-y-3 font-mono">
              <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
                <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  <span>1P SCORE</span>
                  <span className="text-amber-400">PLAYER 1</span>
                </div>
                <p className="text-xl text-white font-bold tracking-widest mt-0.5">
                  {hudScore.toString().padStart(7, '0')}
                </p>
              </div>

              {gameMode === '2P' && (
                <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    <span>2P SCORE</span>
                    <span className="text-cyan-400">PLAYER 2</span>
                  </div>
                  <p className="text-xl text-cyan-300 font-bold tracking-widest mt-0.5">
                    {hud2PScore.toString().padStart(7, '0')}
                  </p>
                </div>
              )}

              <div className="p-2.5 bg-slate-900/90 rounded border border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">RECORD HIGH</p>
                <p className="text-lg text-amber-400 font-bold tracking-widest mt-0.5">
                  {Math.max(topHighScore, hudScore, hud2PScore).toString().padStart(7, '0')}
                </p>
              </div>
            </div>

            {/* Weapon & Hull Integrity 1P */}
            <div className="space-y-1.5 font-mono">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="uppercase text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 1P FIREPOWER
                </span>
                <span className="text-amber-400 font-bold">LVL {hudPower} / 5</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 border border-slate-700 p-0.5 rounded-xs">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-xs transition-all duration-300"
                  style={{ width: `${(hudPower / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Weapon & Hull Integrity 2P */}
            {gameMode === '2P' && (
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="uppercase text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 2P FIREPOWER
                  </span>
                  <span className="text-cyan-400 font-bold">LVL {hud2PPower} / 5</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 border border-slate-700 p-0.5 rounded-xs">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-xs transition-all duration-300"
                    style={{ width: `${(hud2PPower / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Tactical System Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400">CREDIT RESERVES</span>
                <button
                  onClick={handleInsertCoin}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 rounded text-amber-300 text-[10px] font-bold active:scale-95 cursor-pointer transition-all"
                >
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span>COIN ({credits})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Left Footer Mission Progress & Unit Tag */}
          <div className="space-y-4">
            <div className="p-3 bg-slate-800/50 border border-slate-700 rounded">
              <p className="text-[10px] text-slate-400 uppercase mb-2 font-semibold flex justify-between">
                <span>MISSION PROGRESS</span>
                <span className="text-amber-400">STAGE {hudStageIndex + 1}/4</span>
              </p>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((stg) => (
                  <div
                    key={`stage-marker-${stg}`}
                    className={`flex-1 h-2.5 rounded-xs transition-all ${
                      stg < hudStageIndex
                        ? 'bg-emerald-500'
                        : stg === hudStageIndex
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[9px] text-slate-400 text-center uppercase tracking-tighter">
              © 1945-2026 ARCADE TACTICAL AIR COMMAND
            </p>
          </div>
        </aside>

        {/* CENTER FLIGHT COMBAT SCREEN */}
        <main className="flex-1 flex flex-col items-center justify-center p-1 sm:p-2 overflow-hidden relative">
          {/* Bezel / Combat Airspace Container */}
          <div
            className={`relative w-full aspect-[3/4] max-h-[88vh] max-w-[560px] bg-[#020617] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.85)] border-2 border-slate-800 rounded-lg flex items-center justify-center ${
              settings.scanlines ? 'crt-overlay' : ''
            }`}
          >
            {/* Telemetry badges in top corners */}
            <div className="absolute top-2 left-2 z-20 flex gap-1.5 pointer-events-none">
              <div className="px-1.5 py-0.5 bg-black/70 border border-slate-700/70 text-[9px] text-emerald-400 font-mono">
                FPS: 60.0
              </div>
              <div className="px-1.5 py-0.5 bg-black/70 border border-slate-700/70 text-[9px] text-slate-300 font-mono">
                SECTOR: {STAGES[hudStageIndex]?.title.split('-')[0] || 'PACIFIC'}
              </div>
            </div>

            {/* HTML5 Pixel Game Canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerMove={handlePointerMove}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="w-full h-full object-contain pixelated cursor-crosshair"
            />

            {/* IN-GAME HUD Overlay */}
            {gameState === 'PLAYING' && engineRef.current && (
              <ArcadeHUD
                player={engineRef.current.player}
                player2={engineRef.current.player2 || undefined}
                gameMode={gameMode}
                highScore={topHighScore}
                stageIndex={hudStageIndex}
                warningTimer={hudWarningTimer}
                activeBoss={engineRef.current.enemies.find((e) => e.isBoss)}
                onPause={() => setGameState('PAUSED')}
              />
            )}

            {/* Modal Overlays */}
            {gameState === 'TITLE' && (
              <TitleScreen
                onStart={(mode) => {
                  retroAudio.playPowerUp();
                  setGameMode(mode);
                  setGameState('PLANE_SELECT');
                }}
                onOpenScores={() => setShowHighScores(true)}
                onOpenHowToPlay={() => setShowHowToPlay(true)}
                credits={credits}
                onInsertCoin={handleInsertCoin}
                highScore={topHighScore}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {gameState === 'PLANE_SELECT' && (
              <PlaneSelectModal
                mode={gameMode}
                onSelect={(p1, p2) => {
                  if (gameMode === '1P') {
                    setSelectedPlane(p1);
                    selectedPlaneRef.current = p1;
                    if (duo()?.requestStart({ stage: 0 })) return;
                  }
                  startNewGame(p1, p2, gameMode);
                }}
                onBack={() => setGameState('TITLE')}
              />
            )}

            {gameState === 'PAUSED' && (
              <PauseMenu
                onResume={() => setGameState('PLAYING')}
                onRestart={() => {
                  if (gameMode === '1P' && duo()?.requestStart({ stage: 0 })) return;
                  startNewGame(selectedPlane, gameMode === '2P' ? selectedPlane2 : undefined, gameMode);
                }}
                onReturnTitle={() => {
                  retroAudio.stopBgm();
                  setGameState('TITLE');
                }}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {gameState === 'STAGE_CLEAR' && engineRef.current && (
              <StageClearModal
                stats={engineRef.current.stats}
                stageNumber={hudStageIndex + 1}
                bombsRemaining={hudBombs}
                onNextStage={() => {
                  if (gameMode === '1P' && hudStageIndex + 1 < STAGES.length && duo()?.requestStart({ stage: hudStageIndex + 1 })) return;
                  const res = engineRef.current?.nextStage();
                  if (res === 'VICTORY') {
                    setGameState('VICTORY');
                  } else {
                    setGameState('PLAYING');
                  }
                }}
              />
            )}

            {gameState === 'GAME_OVER' && engineRef.current && (
              <GameOverModal
                stats={engineRef.current.stats}
                planeId={selectedPlane}
                credits={credits}
                onContinue={() => {
                  if (gameMode === '1P' && duo()?.requestStart({ stage: 0 })) return;
                  if (credits > 0) {
                    setCredits((c) => c - 1);
                  }
                  startNewGame(selectedPlane, gameMode === '2P' ? selectedPlane2 : undefined, gameMode);
                }}
                onReturnTitle={() => {
                  retroAudio.stopBgm();
                  setGameState('TITLE');
                }}
                onSaveScore={handleSaveHighScore}
                onOpenHighScores={() => setShowHighScores(true)}
              />
            )}

            {gameState === 'VICTORY' && engineRef.current && (
              <VictoryModal
                stats={engineRef.current.stats}
                planeId={selectedPlane}
                onReturnTitle={() => {
                  retroAudio.stopBgm();
                  setGameState('TITLE');
                }}
                onPlayAgain={() => {
                  if (gameMode === '1P' && duo()?.requestStart({ stage: 0 })) return;
                  startNewGame(selectedPlane, gameMode === '2P' ? selectedPlane2 : undefined, gameMode);
                }}
                onSaveScore={handleSaveHighScore}
                onOpenHighScores={() => setShowHighScores(true)}
              />
            )}

            {/* High Scores Modal */}
            {showHighScores && (
              <HighScoresModal
                scores={highScores}
                onClose={() => setShowHighScores(false)}
                onResetScores={() => {
                  setHighScores(INITIAL_HIGH_SCORES);
                  localStorage.removeItem(HIGH_SCORES_KEY);
                }}
              />
            )}

            {/* How to Play Modal */}
            {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
          </div>

          {/* Mobile Virtual Controls Bar (Visible only on touch/mobile in PLAYING mode) */}
          {gameState === 'PLAYING' && (
            <div className="w-full max-w-[560px] lg:hidden">
              <MobileControls
                onDirectionChange={(dx, dy) => {
                  virtualDirectionRef.current = { dx, dy };
                }}
                onFirePress={(isDown) => {
                  if (mousePosRef.current) {
                    mousePosRef.current.isDown = isDown;
                  } else {
                    mousePosRef.current = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, isDown };
                  }
                }}
                onBombPress={() => {
                  engineRef.current?.triggerBomb(1);
                }}
                onLoopPress={() => {
                  engineRef.current?.triggerLoop(1);
                }}
                bombsCount={hudBombs}
                loopsCount={hudLoops}
                autoFire={settings.autoFire}
              />
            </div>
          )}
        </main>

        {/* RIGHT TACTICAL FLIGHT STATUS & TELEMETRY PANEL (Professional Polish Theme) */}
        <aside className="hidden lg:flex w-64 bg-[#0f172a] border-l border-slate-800 p-5 flex-col justify-between z-10 shrink-0">
          {/* Pilot & Ordnance Status */}
          <div className="space-y-5">
            {/* 1P PILOT STATUS */}
            <div>
              <p className="text-[10px] text-amber-400 uppercase border-b border-slate-700 pb-1 mb-2 font-bold flex items-center justify-between">
                <span>1P PILOT STATUS</span>
                <span>PLAYER 1</span>
              </p>
              <div className="flex items-center gap-2.5 mb-2.5 p-2 bg-slate-900/80 rounded border border-slate-800">
                <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-base shadow-inner">
                  {PLANES[selectedPlane]?.flag || '✈️'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase font-mono truncate">
                    {PLANES[selectedPlane]?.name.split(' ')[0] || 'HARRIER'}
                  </p>
                  <p className="text-[9px] text-emerald-400 font-mono">
                    {gameState === 'PLAYING' && hudLives > 0 ? 'ACTIVE IN COMBAT' : hudLives <= 0 ? 'DOWNED' : 'READY'}
                  </p>
                </div>
              </div>

              {/* 1P Ordnance gauges */}
              <div className="space-y-2 font-mono text-[10px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">1P BOMBS:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((bIdx) => (
                      <div
                        key={`1p-bomb-${bIdx}`}
                        className={`w-2 h-3 rounded-xs ${
                          bIdx <= hudBombs ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]' : 'bg-slate-800 border border-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold">1P LIVES:</span>
                  <div className="flex gap-1 text-[10px]">
                    {Array.from({ length: Math.max(0, hudLives) }).map((_, idx) => (
                      <span key={`1p-life-${idx}`} className="text-amber-400">
                        ✈️
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2P PILOT STATUS (If 2P mode) */}
            {gameMode === '2P' && (
              <div>
                <p className="text-[10px] text-cyan-400 uppercase border-b border-slate-700 pb-1 mb-2 font-bold flex items-center justify-between">
                  <span>2P PILOT STATUS</span>
                  <span>PLAYER 2</span>
                </p>
                <div className="flex items-center gap-2.5 mb-2.5 p-2 bg-slate-900/80 rounded border border-slate-800">
                  <div className="w-8 h-8 bg-slate-800 border border-slate-700 rounded flex items-center justify-center text-base shadow-inner">
                    {PLANES[selectedPlane2]?.flag || '✈️'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white uppercase font-mono truncate">
                      {PLANES[selectedPlane2]?.name.split(' ')[0] || 'RAPTOR'}
                    </p>
                    <p className="text-[9px] text-cyan-400 font-mono">
                      {gameState === 'PLAYING' && hud2PLives > 0 ? 'ACTIVE IN COMBAT' : hud2PLives <= 0 ? 'DOWNED' : 'READY'}
                    </p>
                  </div>
                </div>

                {/* 2P Ordnance gauges */}
                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">2P BOMBS:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((bIdx) => (
                        <div
                          key={`2p-bomb-${bIdx}`}
                          className={`w-2 h-3 rounded-xs ${
                            bIdx <= hud2PBombs ? 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.7)]' : 'bg-slate-800 border border-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">2P LIVES:</span>
                    <div className="flex gap-1 text-[10px]">
                      {Array.from({ length: Math.max(0, hud2PLives) }).map((_, idx) => (
                        <span key={`2p-life-${idx}`} className="text-cyan-400">
                          ✈️
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Coordinates */}
            <div>
              <p className="text-[10px] text-slate-400 uppercase border-b border-slate-700 pb-1 mb-2 font-semibold">
                TACTICAL NAVIGATION
              </p>
              <div className="text-[10px] space-y-1.5 text-slate-300 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">THEATER:</span>
                  <span className="text-amber-300">{STAGES[hudStageIndex]?.title.split('-')[0] || 'PACIFIC'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PRIMARY OBJ:</span>
                  <span className="text-red-400">{STAGES[hudStageIndex]?.bossName.split(' ')[0] || 'FLAGSHIP'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Controls Cheatsheet Matrix */}
          <div className="mt-auto pt-2 border-t border-slate-800">
            <p className="text-[10px] text-slate-400 uppercase mb-2 font-semibold flex items-center justify-between">
              <span>{gameMode === '2P' ? '2P DUAL CONTROLS' : 'TACTICAL CONTROLS'}</span>
            </p>
            {gameMode === '2P' ? (
              <div className="space-y-1 text-[9px] font-mono">
                <div className="p-1 bg-slate-900/90 border border-slate-800 rounded">
                  <span className="text-amber-400 font-bold">1P : </span>
                  <span className="text-slate-300">WASD 이동 | J 발사 | X 폭탄 | C 회피</span>
                </div>
                <div className="p-1 bg-slate-900/90 border border-slate-800 rounded">
                  <span className="text-cyan-400 font-bold">2P : </span>
                  <span className="text-slate-300">방향키 이동 | B 발사 | N 폭탄 | M 회피</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 font-mono">
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-amber-400 font-bold rounded-xs">
                  WASD / 방향키
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-slate-300 rounded-xs">
                  이동
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-amber-400 font-bold rounded-xs">
                  SPACE / J
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-slate-300 rounded-xs">
                  기총 발사
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-red-400 font-bold rounded-xs">
                  X 키
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-slate-300 rounded-xs">
                  특수 폭탄
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-emerald-400 font-bold rounded-xs">
                  C 키
                </div>
                <div className="p-1 border border-slate-700 text-center text-[9px] bg-slate-800 text-slate-300 rounded-xs">
                  360° 회피
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

