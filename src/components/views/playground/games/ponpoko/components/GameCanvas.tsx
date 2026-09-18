import React, { useEffect, useRef, useCallback } from 'react';
import { Player, Enemy, Item, StageConfig, DifficultyLevel, DIFFICULTY_CONFIGS, Particle, FloatingScoreText, Spike } from '../types';
import { STAGES, CANVAS_WIDTH, CANVAS_HEIGHT } from '../utils/stages';
import { CanvasRenderer } from '../utils/renderer';
import { soundManager } from '../utils/audio';

interface GameCanvasProps {
  currentStageId: number;
  difficulty?: DifficultyLevel;
  numPlayers?: 1 | 2;
  p1Score: number;
  p2Score: number;
  p1Lives: number;
  p2Lives: number;
  touchDirection: 'left' | 'right' | 'up' | 'down' | null;
  isTouchJumping: boolean;
  onUpdateP1Score: (newScore: number) => void;
  onUpdateP2Score: (newScore: number) => void;
  onUpdateP1Lives: (newLives: number) => void;
  onUpdateP2Lives: (newLives: number) => void;
  onUpdateStageInfo: (stageId: number, timeLeft: number, maxTime: number) => void;
  onStageCleared: (bonus: number) => void;
  onGameOver: (p1FinalScore: number, p2FinalScore: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  currentStageId,
  difficulty = 'NORMAL',
  numPlayers = 1,
  p1Score,
  p2Score,
  p1Lives,
  p2Lives,
  touchDirection,
  isTouchJumping,
  onUpdateP1Score,
  onUpdateP2Score,
  onUpdateP1Lives,
  onUpdateP2Lives,
  onUpdateStageInfo,
  onStageCleared,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stageConfigRef = useRef<StageConfig>(STAGES[currentStageId - 1] || STAGES[0]);
  const difficultyRef = useRef<DifficultyLevel>(difficulty);

  // Keep difficulty ref updated
  useEffect(() => {
    difficultyRef.current = difficulty;
  }, [difficulty]);

  // Player 1 (Red Raccoon)
  const player1Ref = useRef<Player>({
    id: 1,
    x: stageConfigRef.current.initialPlayerPos.x,
    y: stageConfigRef.current.initialPlayerPos.y,
    width: 22,
    height: 25,
    vx: 0,
    vy: 0,
    isGrounded: true,
    isOnLadder: false,
    isJumping: false,
    facing: 'right',
    animFrame: 0,
    animTimer: 0,
    invulnerableTimer: 60,
    speedBoostTimer: 0,
    hammerTimer: 0,
    color: 'red',
    isAlive: true,
    isDying: false,
  });

  // Player 2 (Blue Raccoon)
  const player2Ref = useRef<Player>({
    id: 2,
    x: stageConfigRef.current.initialPlayerPos.x + 20,
    y: stageConfigRef.current.initialPlayerPos.y,
    width: 22,
    height: 25,
    vx: 0,
    vy: 0,
    isGrounded: true,
    isOnLadder: false,
    isJumping: false,
    facing: 'left',
    animFrame: 0,
    animTimer: 0,
    invulnerableTimer: 60,
    speedBoostTimer: 0,
    hammerTimer: 0,
    color: 'blue',
    isAlive: numPlayers === 2,
    isDying: false,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const spikesRef = useRef<Spike[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingScoreText[]>([]);
  const dodgedHazardsRef = useRef<Set<string>>(new Set());

  const timeLeftRef = useRef<number>(60);
  const maxTimeRef = useRef<number>(60);
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const isClearingRef = useRef<boolean>(false);

  const p1ScoreRef = useRef(p1Score);
  const p2ScoreRef = useRef(p2Score);
  const p1LivesRef = useRef(p1Lives);
  const p2LivesRef = useRef(p2Lives);

  const lastReportedTimeRef = useRef<number>(-1);

  // Store callbacks in ref to avoid stale closures inside 60fps loop
  const callbacksRef = useRef({
    onUpdateP1Score,
    onUpdateP2Score,
    onUpdateP1Lives,
    onUpdateP2Lives,
    onUpdateStageInfo,
    onStageCleared,
    onGameOver,
  });

  useEffect(() => {
    callbacksRef.current = {
      onUpdateP1Score,
      onUpdateP2Score,
      onUpdateP1Lives,
      onUpdateP2Lives,
      onUpdateStageInfo,
      onStageCleared,
      onGameOver,
    };
    p1ScoreRef.current = p1Score;
    p2ScoreRef.current = p2Score;
    p1LivesRef.current = p1Lives;
    p2LivesRef.current = p2Lives;
  });

  // Spawn visual particle burst
  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: Math.random() * 4 + 2,
        life: 25 + Math.random() * 15,
        maxLife: 40,
      });
    }
  };

  // Add floating text popup
  const addFloatingText = (text: string, x: number, y: number, color = '#FFD700') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      opacity: 1.0,
      life: 45,
    });
  };

  // Add score with notification
  const addScore = (playerId: 1 | 2, points: number, text?: string, x?: number, y?: number, color?: string) => {
    if (playerId === 1) {
      const newScore = p1ScoreRef.current + points;
      p1ScoreRef.current = newScore;
      callbacksRef.current.onUpdateP1Score(newScore);
    } else {
      const newScore = p2ScoreRef.current + points;
      p2ScoreRef.current = newScore;
      callbacksRef.current.onUpdateP2Score(newScore);
    }

    if (text && x !== undefined && y !== undefined) {
      addFloatingText(text, x, y, color || (playerId === 1 ? '#FFEA00' : '#00E5FF'));
    }
  };

  // Initialize Level State with Difficulty Multipliers
  const initStage = useCallback((stageId: number) => {
    const config = STAGES.find((s) => s.id === stageId) || STAGES[0];
    stageConfigRef.current = config;

    const diffConfig = DIFFICULTY_CONFIGS[difficultyRef.current] || DIFFICULTY_CONFIGS.NORMAL;
    const speedMult = diffConfig.speedMultiplier;
    const timeMult = diffConfig.timeMultiplier;

    itemsRef.current = config.items.map((it) => ({ ...it, collected: false }));
    spikesRef.current = config.spikes.map((spk) => ({ ...spk, isDestroyed: false }));
    
    // Scale enemy patrol speeds based on selected difficulty level
    enemiesRef.current = config.enemies.map((en) => ({
      ...en,
      vx: Number((en.vx * speedMult).toFixed(2)),
      isDestroyed: false,
    }));
    
    particlesRef.current = [];
    floatingTextsRef.current = [];
    dodgedHazardsRef.current.clear();

    // Reset Player 1
    player1Ref.current = {
      id: 1,
      x: numPlayers === 2 ? 30 : config.initialPlayerPos.x,
      y: config.initialPlayerPos.y,
      width: 22,
      height: 25,
      vx: 0,
      vy: 0,
      isGrounded: true,
      isOnLadder: false,
      isJumping: false,
      facing: 'right',
      animFrame: 0,
      animTimer: 0,
      invulnerableTimer: 60,
      speedBoostTimer: 0,
      hammerTimer: 0,
      color: 'red',
      isAlive: p1LivesRef.current > 0,
      isDying: false,
    };

    // Reset Player 2 (Opposite side in 2P mode)
    player2Ref.current = {
      id: 2,
      x: numPlayers === 2 ? CANVAS_WIDTH - 52 : config.initialPlayerPos.x + 15,
      y: config.initialPlayerPos.y,
      width: 22,
      height: 25,
      vx: 0,
      vy: 0,
      isGrounded: true,
      isOnLadder: false,
      isJumping: false,
      facing: 'left',
      animFrame: 0,
      animTimer: 0,
      invulnerableTimer: 60,
      speedBoostTimer: 0,
      hammerTimer: 0,
      color: 'blue',
      isAlive: numPlayers === 2 && p2LivesRef.current > 0,
      isDying: false,
    };

    const calculatedTimeLimit = Math.max(15, Math.round(config.timeLimit * timeMult));
    timeLeftRef.current = calculatedTimeLimit;
    maxTimeRef.current = calculatedTimeLimit;
    lastReportedTimeRef.current = calculatedTimeLimit;
    isClearingRef.current = false;

    callbacksRef.current.onUpdateStageInfo(config.id, calculatedTimeLimit, calculatedTimeLimit);
  }, [numPlayers]);

  useEffect(() => {
    initStage(currentStageId);
  }, [currentStageId, initStage]);

  // Keyboard listeners (Supports Arrow, WASD, and Numpad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.code] = true;
      keysRef.current[e.key] = true;

      // Prevent scrolling on game control keys
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'Numpad4', 'Numpad6', 'Numpad8', 'Numpad2', 'Numpad5', 'Numpad0', 'NumpadEnter', 'NumpadAdd'].includes(e.code) ||
        ['4', '6', '8', '2', '5', '0', '+'].includes(e.key)
      ) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Player physics update logic
  const updatePlayerMovement = (
    p: Player,
    moveLeft: boolean,
    moveRight: boolean,
    moveUp: boolean,
    moveDown: boolean,
    jumpRequested: boolean,
    stage: StageConfig
  ) => {
    if (!p.isAlive || p.isDying) return;

    // Power-up timers countdown
    if (p.speedBoostTimer > 0) p.speedBoostTimer--;
    if (p.hammerTimer > 0) p.hammerTimer--;

    const speedMultiplier = p.speedBoostTimer > 0 ? 1.55 : 1.0;
    const baseWalkSpeed = 2.6 * speedMultiplier;
    const baseClimbSpeed = 2.2 * (p.speedBoostTimer > 0 ? 1.3 : 1.0);

    const currentLadder = stage.ladders.find(
      (l) =>
        p.x + p.width / 2 >= l.x - 12 &&
        p.x + p.width / 2 <= l.x + l.width + 12 &&
        p.y + p.height >= l.yMin - 8 &&
        p.y <= l.yMax + 8
    );

    if (p.isOnLadder) {
      p.vx = 0;
      if (currentLadder) {
        p.x = currentLadder.x + currentLadder.width / 2 - p.width / 2;
      }

      if (moveUp) {
        p.vy = -baseClimbSpeed;
        soundManager.playStep();
        p.animFrame += 0.25;
      } else if (moveDown) {
        p.vy = baseClimbSpeed;
        soundManager.playStep();
        p.animFrame += 0.25;
      } else {
        p.vy = 0;
      }

      // Off top/bottom of ladder or Jump dismount
      if (currentLadder) {
        if (moveUp && p.y + p.height <= currentLadder.yMin + 2) {
          p.isOnLadder = false;
          p.y = currentLadder.yMin - p.height;
          p.isGrounded = true;
          p.isJumping = false;
          p.vy = 0;
        } else if (moveDown && p.y + p.height >= currentLadder.yMax) {
          p.isOnLadder = false;
          p.y = currentLadder.yMax - p.height;
          p.isGrounded = true;
          p.isJumping = false;
          p.vy = 0;
        } else if (jumpRequested) {
          // Explicit jump dismount from ladder with Space
          p.isOnLadder = false;
          p.vy = -4.8;
          p.isJumping = true;
          soundManager.playJump();
        }
      } else {
        p.isOnLadder = false;
      }
    } else {
      // Horizontal Movement
      if (moveLeft) {
        p.vx = -baseWalkSpeed;
        p.facing = 'left';
      } else if (moveRight) {
        p.vx = baseWalkSpeed;
        p.facing = 'right';
      } else {
        p.vx = 0;
      }

      // Mount Ladder Check
      if (currentLadder && (moveUp || moveDown)) {
        const pBottom = p.y + p.height;
        if (moveUp && pBottom > currentLadder.yMin + 2 && pBottom <= currentLadder.yMax + 8) {
          p.isOnLadder = true;
          p.isGrounded = false;
          p.isJumping = false;
          p.vx = 0;
          p.vy = -baseClimbSpeed;
          p.x = currentLadder.x + currentLadder.width / 2 - p.width / 2;
        } else if (moveDown && pBottom >= currentLadder.yMin - 8 && pBottom < currentLadder.yMax) {
          p.isOnLadder = true;
          p.isGrounded = false;
          p.isJumping = false;
          p.vx = 0;
          p.vy = baseClimbSpeed;
          p.x = currentLadder.x + currentLadder.width / 2 - p.width / 2;
        }
      }

      // Jump Execution & Gravity (Tuned for classic Ponpoko single-floor jump arc)
      if (!p.isOnLadder) {
        if (jumpRequested && p.isGrounded) {
          p.vy = p.speedBoostTimer > 0 ? -5.4 : -5.0;
          p.isGrounded = false;
          p.isJumping = true;
          soundManager.playJump();
        }
        p.vy += 0.38;
      }
    }

    // Update Position
    p.x += p.vx;
    p.y += p.vy;

    // Screen Side Boundaries
    if (p.x < 10) p.x = 10;
    if (p.x + p.width > CANVAS_WIDTH - 10) p.x = CANVAS_WIDTH - 10 - p.width;

    // Ceiling Collision (Prevent jumping into or through upper platform floors, except at ladder openings)
    if (!p.isOnLadder && p.vy < 0) {
      stage.platforms.forEach((plat) => {
        const isLadderOpening = stage.ladders.some(
          (l) =>
            p.x + p.width / 2 >= l.x - 8 &&
            p.x + p.width / 2 <= l.x + l.width + 8 &&
            Math.abs(plat.y - l.yMin) <= 10
        );
        if (isLadderOpening) return;

        const platBottom = plat.y + plat.height;
        const prevTop = p.y - p.vy;

        if (
          p.x + p.width > plat.x + 2 &&
          p.x < plat.x + plat.width - 2 &&
          prevTop >= platBottom - 3 &&
          p.y <= platBottom
        ) {
          p.y = platBottom;
          p.vy = 0.5; // Head bump, immediately start falling
        }
      });
    }

    // Platform Landing Collisions (Floor support)
    if (!p.isOnLadder && p.vy >= 0) {
      stage.platforms.forEach((plat) => {
        const pBottom = p.y + p.height;
        const prevBottom = pBottom - p.vy;

        if (
          p.x + p.width > plat.x &&
          p.x < plat.x + plat.width &&
          prevBottom <= plat.y + 6 &&
          pBottom >= plat.y
        ) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.isGrounded = true;
          p.isJumping = false;
        }
      });
    }

    // Bottom Screen Fall Death
    if (p.y > CANVAS_HEIGHT + 30) {
      handlePlayerDeath(p);
    }

    // Invulnerability timer countdown
    if (p.invulnerableTimer > 0) {
      p.invulnerableTimer--;
    }

    // Walk Animation Frame
    if (p.vx !== 0 || p.vy !== 0 || p.isOnLadder) {
      p.animTimer += 1;
      if (p.animTimer > 5) {
        p.animFrame = (p.animFrame + 1) % 4;
        p.animTimer = 0;
      }
    }
  };

  // Handle Player Death
  const handlePlayerDeath = (p: Player) => {
    if (!p.isAlive || p.isDying || isClearingRef.current) return;
    p.isDying = true;
    p.speedBoostTimer = 0;
    p.hammerTimer = 0;
    soundManager.playDeath();
    spawnParticles(p.x + p.width / 2, p.y + p.height / 2, '#EF4444', 16);

    if (p.id === 1) {
      const newLives = p1LivesRef.current - 1;
      p1LivesRef.current = newLives;
      callbacksRef.current.onUpdateP1Lives(newLives);

      if (newLives <= 0) {
        p.isAlive = false;
        p.isDying = false;
      } else {
        setTimeout(() => {
          const config = stageConfigRef.current;
          p.x = numPlayers === 2 ? 30 : config.initialPlayerPos.x;
          p.y = config.initialPlayerPos.y;
          p.facing = 'right';
          p.vx = 0;
          p.vy = 0;
          p.isGrounded = true;
          p.isOnLadder = false;
          p.invulnerableTimer = 90;
          p.isDying = false;
        }, 1000);
      }
    } else {
      const newLives = p2LivesRef.current - 1;
      p2LivesRef.current = newLives;
      callbacksRef.current.onUpdateP2Lives(newLives);

      if (newLives <= 0) {
        p.isAlive = false;
        p.isDying = false;
      } else {
        setTimeout(() => {
          const config = stageConfigRef.current;
          p.x = numPlayers === 2 ? CANVAS_WIDTH - 52 : config.initialPlayerPos.x + 15;
          p.y = config.initialPlayerPos.y;
          p.facing = 'left';
          p.vx = 0;
          p.vy = 0;
          p.isGrounded = true;
          p.isOnLadder = false;
          p.invulnerableTimer = 90;
          p.isDying = false;
        }, 1000);
      }
    }

    // Check if ALL active players are dead => Game Over!
    const p1Dead = p1LivesRef.current <= 0;
    const p2Dead = numPlayers === 2 ? p2LivesRef.current <= 0 : true;

    if (p1Dead && p2Dead) {
      callbacksRef.current.onGameOver(p1ScoreRef.current, p2ScoreRef.current);
    }
  };

  // Main 60FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const stage = stageConfigRef.current;
      const p1 = player1Ref.current;
      const p2 = player2Ref.current;

      // 1. Time Update
      if (!isClearingRef.current && (p1.isAlive || p2.isAlive)) {
        timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
        const secDisplay = Math.ceil(timeLeftRef.current);
        if (secDisplay !== lastReportedTimeRef.current) {
          lastReportedTimeRef.current = secDisplay;
          callbacksRef.current.onUpdateStageInfo(stage.id, secDisplay, maxTimeRef.current);
        }

        if (timeLeftRef.current <= 0) {
          if (p1.isAlive) handlePlayerDeath(p1);
          if (p2.isAlive) handlePlayerDeath(p2);
        }
      }

      // 2. Input mapping
      const keys = keysRef.current;

      // Player 1 Inputs (Arrow / WASD / Touch)
      const p1Left = keys['ArrowLeft'] || keys['a'] || keys['A'] || touchDirection === 'left';
      const p1Right = keys['ArrowRight'] || keys['d'] || keys['D'] || touchDirection === 'right';
      const p1Up = keys['ArrowUp'] || keys['w'] || keys['W'] || touchDirection === 'up';
      const p1Down = keys['ArrowDown'] || keys['s'] || keys['S'] || touchDirection === 'down';
      const p1Jump = keys[' '] || keys['Space'] || keys['KeyZ'] || keys['z'] || keys['Z'] || keys['KeyK'] || keys['k'] || keys['K'] || isTouchJumping;

      // Player 2 Inputs (Numpad)
      const p2Left = keys['Numpad4'] || keys['4'];
      const p2Right = keys['Numpad6'] || keys['6'];
      const p2Up = keys['Numpad8'] || keys['8'];
      const p2Down = keys['Numpad2'] || keys['2'] || keys['Numpad5'] || keys['5'];
      const p2Jump = keys['Numpad0'] || keys['0'] || keys['NumpadEnter'] || keys['NumpadAdd'] || keys['+'] || keys['Enter'];

      if (!isClearingRef.current) {
        updatePlayerMovement(p1, p1Left, p1Right, p1Up, p1Down, p1Jump, stage);
        if (numPlayers === 2) {
          updatePlayerMovement(p2, p2Left, p2Right, p2Up, p2Down, p2Jump, stage);
        }

        // 3. Dynamic Spikes (Moving Spikes)
        spikesRef.current.forEach((spk) => {
          if (spk.isDestroyed) return;
          if (spk.isMoving && spk.vx && spk.minX !== undefined && spk.maxX !== undefined) {
            spk.x += spk.vx;
            if (spk.x <= spk.minX) {
              spk.x = spk.minX;
              spk.vx = Math.abs(spk.vx);
            } else if (spk.x + spk.width >= spk.maxX) {
              spk.x = spk.maxX - spk.width;
              spk.vx = -Math.abs(spk.vx);
            }
          }
        });

        // 4. Enemy AI & Movement Loop
        enemiesRef.current.forEach((en) => {
          if (en.isDestroyed) return;

          // Special behaviors by enemy type
          if (en.type === 'bat') {
            // Flying Bat sine-wave oscillation
            en.x += en.vx;
            if (en.baseY !== undefined) {
              en.y = en.baseY + Math.sin(now / 200 + en.x * 0.05) * 16;
            }
          } else if (en.type === 'ghost') {
            // Hovering Ghost
            en.x += en.vx;
            if (en.baseY !== undefined) {
              en.y = en.baseY + Math.sin(now / 300) * 8;
            }
          } else if (en.type === 'frog') {
            // Hopping Frog
            en.x += en.vx;
            if (en.jumpTimer !== undefined) {
              en.jumpTimer--;
              if (en.jumpTimer <= 0) {
                en.jumpTimer = 60 + Math.floor(Math.random() * 40);
                en.vy = -3.5;
              }
            }
            if (en.vy !== undefined) {
              en.y += en.vy;
              en.vy += 0.3; // Gravity on frog
              if (en.platformY && en.y + en.height >= en.platformY) {
                en.y = en.platformY - en.height;
                en.vy = 0;
              }
            }
          } else {
            // Mouse, Snake, Flame patrol
            en.x += en.vx;
          }

          // Boundary bounce
          if (en.x <= en.minX) {
            en.x = en.minX;
            en.vx = Math.abs(en.vx);
            en.facing = 'right';
          } else if (en.x + en.width >= en.maxX) {
            en.x = en.maxX - en.width;
            en.vx = -Math.abs(en.vx);
            en.facing = 'left';
          }

          en.animFrame += 0.16;

          // --- Collision against Player 1 ---
          const activePlayers: Player[] = [];
          if (p1.isAlive && !p1.isDying) activePlayers.push(p1);
          if (numPlayers === 2 && p2.isAlive && !p2.isDying) activePlayers.push(p2);

          activePlayers.forEach((player) => {
            const enemyBottom = en.platformY || (en.y + en.height);
            const playerBottom = player.y + player.height;
            const isSameFloorLevel = Math.abs(playerBottom - enemyBottom) < 32;

            // Dodge Detection: Player jumping directly over enemy on the same floor
            if (
              isSameFloorLevel &&
              player.isJumping &&
              player.y + player.height <= en.y + 6 &&
              player.y + player.height >= en.y - 30 &&
              player.x + player.width > en.x - 4 &&
              player.x < en.x + en.width + 4
            ) {
              const dodgeKey = `dodge_en_${player.id}_${en.id}`;
              if (!dodgedHazardsRef.current.has(dodgeKey)) {
                dodgedHazardsRef.current.add(dodgeKey);
                soundManager.playDodgeBonus();
                addScore(player.id as 1 | 2, 70, 'DODGE! +70', player.x, player.y - 12, '#38BDF8');
                spawnParticles(player.x + 10, player.y + 20, '#38BDF8', 6);
              }
            }

            // Direct Touch Collision (Only on the same floor level)
            const overlaps =
              isSameFloorLevel &&
              player.x < en.x + en.width - 3 &&
              player.x + player.width > en.x + 3 &&
              player.y < en.y + en.height - 3 &&
              player.y + player.height > en.y + 3;

            if (overlaps) {
              // Super Hammer Mode: Smash Enemy!
              if (player.hammerTimer > 0) {
                en.isDestroyed = true;
                soundManager.playHammerHit();
                spawnParticles(en.x + en.width / 2, en.y + en.height / 2, '#FFD700', 20);
                addScore(player.id as 1 | 2, 300, 'SMASH! +300', en.x, en.y - 15, '#F59E0B');
              } else if (player.invulnerableTimer <= 0) {
                handlePlayerDeath(player);
              }
            }
          });
        });

        // 5. Spike Collision Check & Dodge Detection
        spikesRef.current.forEach((spk) => {
          if (spk.isDestroyed) return;

          const activePlayers: Player[] = [];
          if (p1.isAlive && !p1.isDying) activePlayers.push(p1);
          if (numPlayers === 2 && p2.isAlive && !p2.isDying) activePlayers.push(p2);

          activePlayers.forEach((player) => {
            const spikeBottom = spk.y + spk.height;
            const playerBottom = player.y + player.height;
            const isSameFloorLevel = Math.abs(playerBottom - spikeBottom) < 32;

            // Dodge Spike bonus (Only on the same floor level)
            if (
              isSameFloorLevel &&
              player.isJumping &&
              player.y + player.height <= spk.y + 4 &&
              player.y + player.height >= spk.y - 30 &&
              player.x + player.width > spk.x - 4 &&
              player.x < spk.x + spk.width + 4
            ) {
              const dodgeKey = `dodge_spk_${player.id}_${spk.id}`;
              if (!dodgedHazardsRef.current.has(dodgeKey)) {
                dodgedHazardsRef.current.add(dodgeKey);
                soundManager.playDodgeBonus();
                addScore(player.id as 1 | 2, 50, 'JUMP! +50', player.x, player.y - 12, '#4ADE80');
                spawnParticles(spk.x + 7, spk.y, '#4ADE80', 5);
              }
            }

            // Spike Touch (Only on the same floor level)
            const hitSpike =
              isSameFloorLevel &&
              player.x < spk.x + spk.width - 2 &&
              player.x + player.width > spk.x + 2 &&
              player.y + player.height > spk.y + 4 &&
              player.y < spk.y + spk.height;

            if (hitSpike) {
              // Super Hammer Mode: Crush Spike!
              if (player.hammerTimer > 0) {
                spk.isDestroyed = true;
                soundManager.playHammerHit();
                spawnParticles(spk.x + spk.width / 2, spk.y + spk.height / 2, '#EF4444', 15);
                addScore(player.id as 1 | 2, 150, 'CRUSH! +150', spk.x, spk.y - 15, '#EF4444');
              } else if (player.invulnerableTimer <= 0) {
                handlePlayerDeath(player);
              }
            }
          });
        });

        // 6. Item Collection Check & Power-Up Trigger
        itemsRef.current.forEach((item) => {
          if (item.collected) return;

          let collector: Player | null = null;

          if (
            p1.isAlive &&
            !p1.isDying &&
            p1.x < item.x + item.width &&
            p1.x + p1.width > item.x &&
            p1.y < item.y + item.height &&
            p1.y + p1.height > item.y
          ) {
            collector = p1;
          } else if (
            numPlayers === 2 &&
            p2.isAlive &&
            !p2.isDying &&
            p2.x < item.x + item.width &&
            p2.x + p2.width > item.x &&
            p2.y < item.y + item.height &&
            p2.y + p2.height > item.y
          ) {
            collector = p2;
          }

          if (collector) {
            item.collected = true;

            // Power-Up Type Handling
            if (item.type === 'power_speed') {
              collector.speedBoostTimer = 480; // 8 seconds at 60fps
              soundManager.playPowerUp();
              spawnParticles(item.x + 10, item.y + 10, '#38BDF8', 20);
              addScore(collector.id as 1 | 2, item.points, `SPEED BOOTS! +${item.points}`, item.x, item.y - 16, '#38BDF8');
            } else if (item.type === 'power_hammer') {
              collector.hammerTimer = 600; // 10 seconds hammer smash
              soundManager.playPowerUp();
              spawnParticles(item.x + 10, item.y + 10, '#FACC15', 25);
              addScore(collector.id as 1 | 2, item.points, `SUPER HAMMER! +${item.points}`, item.x, item.y - 16, '#FACC15');
            } else if (item.type === 'power_life') {
              if (collector.id === 1) {
                const updated = p1LivesRef.current + 1;
                p1LivesRef.current = updated;
                callbacksRef.current.onUpdateP1Lives(updated);
              } else {
                const updated = p2LivesRef.current + 1;
                p2LivesRef.current = updated;
                callbacksRef.current.onUpdateP2Lives(updated);
              }
              soundManager.playOneUp();
              spawnParticles(item.x + 10, item.y + 10, '#EC4899', 30);
              addScore(collector.id as 1 | 2, item.points, `1-UP EXTRA LIFE! +${item.points}`, item.x, item.y - 16, '#EC4899');
            } else if (item.type === 'jar') {
              soundManager.playJar();
              spawnParticles(item.x + 10, item.y + 10, '#F59E0B', 15);

              // Contained Power-Up in Jar
              if (item.containedPowerUp) {
                if (item.containedPowerUp === 'power_speed') {
                  collector.speedBoostTimer = 480;
                  soundManager.playPowerUp();
                  addScore(collector.id as 1 | 2, item.points, `SPEED BOOTS! +${item.points}`, item.x, item.y - 16, '#38BDF8');
                } else if (item.containedPowerUp === 'power_hammer') {
                  collector.hammerTimer = 600;
                  soundManager.playPowerUp();
                  addScore(collector.id as 1 | 2, item.points, `SUPER HAMMER! +${item.points}`, item.x, item.y - 16, '#FACC15');
                } else if (item.containedPowerUp === 'power_life') {
                  if (collector.id === 1) {
                    const updated = p1LivesRef.current + 1;
                    p1LivesRef.current = updated;
                    callbacksRef.current.onUpdateP1Lives(updated);
                  } else {
                    const updated = p2LivesRef.current + 1;
                    p2LivesRef.current = updated;
                    callbacksRef.current.onUpdateP2Lives(updated);
                  }
                  soundManager.playOneUp();
                  addScore(collector.id as 1 | 2, item.points, `1-UP LIFE! +${item.points}`, item.x, item.y - 16, '#EC4899');
                }
              } else {
                addScore(collector.id as 1 | 2, item.points, `+${item.points}`, item.x, item.y - 10, '#F59E0B');
              }

              // Snake trap jar
              if (item.hasSnake) {
                const currentDiff = DIFFICULTY_CONFIGS[difficultyRef.current] || DIFFICULTY_CONFIGS.NORMAL;
                const snakeSpeed = Number((1.5 * currentDiff.speedMultiplier).toFixed(2));
                enemiesRef.current.push({
                  id: `snake_jar_${Date.now()}`,
                  type: 'snake',
                  x: item.x,
                  y: item.y - 10,
                  width: 22,
                  height: 16,
                  vx: collector.facing === 'right' ? -snakeSpeed : snakeSpeed,
                  minX: 20,
                  maxX: CANVAS_WIDTH - 20,
                  platformY: item.y + 20,
                  animFrame: 0,
                  facing: collector.facing === 'right' ? 'left' : 'right',
                });
              }
            } else {
              soundManager.playCollect(item.points);
              spawnParticles(item.x + 8, item.y + 8, '#22C55E', 8);
              addScore(collector.id as 1 | 2, item.points, `+${item.points}`, item.x, item.y - 10);
            }

            // Check Stage Clear: All non-jar fruit items collected!
            const uncollectedFruits = itemsRef.current.filter((it) => it.type !== 'jar' && !it.collected);
            if (uncollectedFruits.length === 0 && !isClearingRef.current) {
              isClearingRef.current = true;
              const bonus = Math.floor(timeLeftRef.current) * 100;
              soundManager.playStageClear();
              setTimeout(() => {
                callbacksRef.current.onStageCleared(bonus);
              }, 2200);
            }
          }
        });
      }

      // 7. Update Particles & Floating Texts
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.life--;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      floatingTextsRef.current.forEach((ft) => {
        ft.y -= 0.55;
        ft.life--;
        ft.opacity = Math.max(0, ft.life / 45);
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.life > 0);

      // 8. RENDER CANVAS (Custom Stage Retro Background)
      CanvasRenderer.drawBackground(ctx, stage.id, CANVAS_WIDTH, CANVAS_HEIGHT, performance.now() / 1000);

      // Draw Platforms & Ladders
      CanvasRenderer.drawPlatformsAndLadders(ctx, stage.platforms, stage.ladders);

      // Draw Spikes
      spikesRef.current.forEach((spk) => CanvasRenderer.drawSpike(ctx, spk));

      // Draw Items & Power-ups
      itemsRef.current.forEach((item) => CanvasRenderer.drawItem(ctx, item));

      // Draw Enemies
      enemiesRef.current.forEach((en) => CanvasRenderer.drawEnemy(ctx, en));

      // Draw Player 1 (Red Raccoon)
      if (p1.isAlive && (!p1.isDying || Math.floor(performance.now() / 100) % 2 === 0)) {
        CanvasRenderer.drawPlayer(ctx, p1);
      }

      // Draw Player 2 (Blue Raccoon)
      if (numPlayers === 2 && p2.isAlive && (!p2.isDying || Math.floor(performance.now() / 100) % 2 === 0)) {
        CanvasRenderer.drawPlayer(ctx, p2);
      }

      // Draw Particles
      CanvasRenderer.drawParticles(ctx, particlesRef.current);

      // Draw Floating Score Texts
      CanvasRenderer.drawFloatingTexts(ctx, floatingTextsRef.current);

      // Stage Clear Banner Overlay
      if (isClearingRef.current) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'extrabold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('STAGE CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 25);

        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`TIME BONUS: +${Math.floor(timeLeftRef.current) * 100}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);

        ctx.fillStyle = '#A7F3D0';
        ctx.font = '14px monospace';
        ctx.fillText('NEXT STAGE LOADING...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [numPlayers, touchDirection, isTouchJumping]);

  return (
    <div className="relative w-full max-w-[560px] flex flex-col items-center bg-black border-2 border-cyan-500 rounded-t-lg overflow-hidden shadow-2xl">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-auto bg-black block cursor-crosshair aspect-[4/3]"
      />
    </div>
  );
};
