import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  GameMode,
  GameStatus,
  Player,
  Enemy,
  Bubble,
  Item,
  Particle,
  StageConfig,
  ItemType,
  EnemyType,
} from '../types';
import { STAGES, STAGE_WIDTH, STAGE_HEIGHT, TILE_SIZE } from '../utils/stages';
import { drawDragon, drawEnemy, drawBubble, drawItem, drawStageBrick, drawStageBackgroundArt } from '../utils/pixelArt';
import { audioEngine } from '../utils/audio';

interface ArcadeCanvasProps {
  mode: GameMode;
  status: GameStatus;
  currentStageNumber: number;
  crtEffect: boolean;
  onStageClear: (scoreP1: number, scoreP2?: number) => void;
  onGameOver: (finalScoreP1: number, finalScoreP2: number, round: number, isVictory: boolean) => void;
  onUpdatePlayers: (players: Player[]) => void;
  externalKeys: Record<string, boolean>;
}

const CANVAS_WIDTH = STAGE_WIDTH * TILE_SIZE; // 560px
const CANVAS_HEIGHT = STAGE_HEIGHT * TILE_SIZE; // 400px
const GRAVITY = 0.42;
const JUMP_FORCE = -8.2;
const MOVE_SPEED = 2.4;

export const ArcadeCanvas: React.FC<ArcadeCanvasProps> = ({
  mode,
  status,
  currentStageNumber,
  crtEffect,
  onStageClear,
  onGameOver,
  onUpdatePlayers,
  externalKeys,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stage Config
  const [stage, setStage] = useState<StageConfig>(() => STAGES[currentStageNumber]());

  // Game Entities Refs (to prevent closure stale state in requestAnimationFrame)
  const playersRef = useRef<Player[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const bubblesRef = useRef<Bubble[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // Stage Time & Hurry Up State
  const stageTimerRef = useRef<number>(60);
  const isHurryUpRef = useRef<boolean>(false);
  const animFrameRef = useRef<number>(0);

  // Sync and capture Keyboard keys without re-triggering animation cancellation
  const keysRef = useRef<Record<string, boolean>>({});

  // Merge externalKeys (touch controls) into keysRef without replacing the whole object
  useEffect(() => {
    if (externalKeys) {
      Object.entries(externalKeys).forEach(([key, val]) => {
        keysRef.current[key] = val;
      });
    }
  }, [externalKeys]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default scroll/action for game keys
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key) ||
        ['Slash', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)
      ) {
        e.preventDefault();
      }
      keysRef.current[e.code] = true;
      keysRef.current[e.key] = true;
      if (e.key) {
        keysRef.current[e.key.toLowerCase()] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key] = false;
      if (e.key) {
        keysRef.current[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize Stage Entities
  const initStage = useCallback(
    (stageNum: number, currentPlayers?: Player[]) => {
      const cfg = STAGES[stageNum]();
      setStage(cfg);
      stageTimerRef.current = cfg.timeLimitLimitSeconds;
      isHurryUpRef.current = false;

      // Initialize Players
      let p1Lives = 3;
      let p1Score = 0;
      let p2Lives = 3;
      let p2Score = 0;

      if (currentPlayers && currentPlayers.length > 0) {
        const existingP1 = currentPlayers.find((p) => p.id === 1);
        if (existingP1) {
          p1Lives = existingP1.lives;
          p1Score = existingP1.score;
        }
        const existingP2 = currentPlayers.find((p) => p.id === 2);
        if (existingP2) {
          p2Lives = existingP2.lives;
          p2Score = existingP2.score;
        }
      }

      const p1: Player = {
        id: 1,
        color: 'green',
        x: cfg.playerSpawns.p1.x,
        y: cfg.playerSpawns.p1.y,
        width: 24,
        height: 24,
        vx: 0,
        vy: 0,
        facing: 'right',
        isGrounded: false,
        isJumping: false,
        shootingTimer: 0,
        invulnerableTimer: 60,
        score: p1Score,
        lives: p1Lives,
        isDead: false,
        deathTimer: 0,
        speedMultiplier: 1,
        bubbleRange: 160,
        extendLetters: [],
        powerupRapidTimer: 0,
        powerupRangeTimer: 0,
        lastMilestoneScore: Math.floor(p1Score / 5000) * 5000,
      };

      const newPlayers: Player[] = [p1];

      if (mode === '2P') {
        const p2: Player = {
          id: 2,
          color: 'blue',
          x: cfg.playerSpawns.p2.x,
          y: cfg.playerSpawns.p2.y,
          width: 24,
          height: 24,
          vx: 0,
          vy: 0,
          facing: 'left',
          isGrounded: false,
          isJumping: false,
          shootingTimer: 0,
          invulnerableTimer: 60,
          score: p2Score,
          lives: p2Lives,
          isDead: false,
          deathTimer: 0,
          speedMultiplier: 1,
          bubbleRange: 160,
          extendLetters: [],
          powerupRapidTimer: 0,
          powerupRangeTimer: 0,
          lastMilestoneScore: Math.floor(p2Score / 5000) * 5000,
        };
        newPlayers.push(p2);
      }

      playersRef.current = newPlayers;
      onUpdatePlayers([...newPlayers]);

      // Initialize Enemies
      enemiesRef.current = cfg.enemies.map((e, idx) => ({
        id: `enemy_${idx}_${Date.now()}`,
        type: e.type,
        x: e.x,
        y: e.y,
        width: e.type === 'BOSS_BARON' ? 40 : 24,
        height: e.type === 'BOSS_BARON' ? 40 : 24,
        vx: (idx % 2 === 0 ? 1 : -1) * (e.type === 'BOSS_BARON' ? 1.2 : 1.5),
        vy: 0,
        facing: idx % 2 === 0 ? 'right' : 'left',
        isGrounded: false,
        state: 'NORMAL',
        trappedTimer: 0,
        angryTimer: 0,
        jumpTimer: Math.random() * 120,
        shootTimer: Math.random() * 180,
        health: e.type === 'BOSS_BARON' ? 15 : 1,
        maxHealth: e.type === 'BOSS_BARON' ? 15 : 1,
        color: e.type === 'MONSTA' ? '#FF0000' : e.type === 'ZEN_CHAN' ? '#FFA500' : '#8A2BE2',
      }));

      bubblesRef.current = [];
      itemsRef.current = [];
      particlesRef.current = [];

      audioEngine.startBgm(1.0);
    },
    [mode]
  );

  useEffect(() => {
    initStage(currentStageNumber);
  }, [currentStageNumber, initStage]);

  // Stage Timer countdown
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const timer = setInterval(() => {
      if (stageTimerRef.current > 0) {
        stageTimerRef.current -= 1;
        if (stageTimerRef.current <= 15 && !isHurryUpRef.current) {
          isHurryUpRef.current = true;
          audioEngine.playHurryUp();
          audioEngine.startBgm(1.4); // Faster 8-bit BGM!
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Spawn Float Floating EXTEND Bubbles
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const letters = ['E', 'X', 'T', 'E', 'N', 'D'];
    const interval = setInterval(() => {
      if (Math.random() < 0.35 && bubblesRef.current.length < 15) {
        const randomLetter = letters[Math.floor(Math.random() * letters.length)];
        const randomX = Math.floor(Math.random() * (STAGE_WIDTH - 4) + 2) * TILE_SIZE;
        bubblesRef.current.push({
          id: `letter_bubble_${Date.now()}`,
          playerId: 1,
          type: 'LETTER',
          letter: randomLetter,
          x: randomX,
          y: (STAGE_HEIGHT - 2) * TILE_SIZE,
          width: 22,
          height: 22,
          vx: 0,
          vy: -1.2,
          facing: 'right',
          lifetime: 0,
          maxLifetime: 450,
          floatVx: (Math.random() - 0.5) * 0.5,
          floatVy: -0.8 - Math.random() * 0.4,
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [status]);

  // Main Physics & Collisions Update Loop
  const updatePhysics = useCallback(() => {
    const grid = stage.grid;
    const players = playersRef.current;
    const enemies = enemiesRef.current;
    const bubbles = bubblesRef.current;
    const items = itemsRef.current;
    const particles = particlesRef.current;

    // Helper: Tile collision
    const isTileSolid = (r: number, c: number, checkPassThrough: boolean = false): boolean => {
      // Solid left and right outer boundary walls
      if (c < 0 || c >= STAGE_WIDTH) return true;
      // Allow passing through the top ceiling opening and bottom floor opening
      if (r < 0 || r >= STAGE_HEIGHT) return false;
      const tile = grid[r][c];
      if (tile === 1) return true; // Solid wall
      if (checkPassThrough && tile === 2) return true; // Pass through top platform
      return false;
    };

    // --- 1. UPDATE PLAYERS ---
    players.forEach((p) => {
      if (p.isDead) {
        p.deathTimer++;
        if (p.deathTimer > 90) {
          if (p.lives > 0) {
            // Respawn
            p.isDead = false;
            p.deathTimer = 0;
            const spawnPos = p.id === 1 ? stage.playerSpawns.p1 : stage.playerSpawns.p2;
            p.x = spawnPos.x;
            p.y = spawnPos.y;
            p.vx = 0;
            p.vy = 0;
            p.invulnerableTimer = 120;
          }
        }
        return;
      }

      if (p.invulnerableTimer > 0) p.invulnerableTimer--;
      if (p.shootingTimer > 0) p.shootingTimer--;
      if (p.powerupRapidTimer && p.powerupRapidTimer > 0) p.powerupRapidTimer--;
      if (p.powerupRangeTimer && p.powerupRangeTimer > 0) p.powerupRangeTimer--;

      // Score Milestone Power-Up Check: Every 5,000 points reached, activate bonus power-up!
      const currentMilestone = Math.floor(p.score / 5000) * 5000;
      if (currentMilestone > 0 && currentMilestone > (p.lastMilestoneScore || 0)) {
        p.lastMilestoneScore = currentMilestone;
        // Grant 10 seconds of Rapid Speed + Extended Range powerups!
        p.powerupRapidTimer = 600;
        p.powerupRangeTimer = 600;
        audioEngine.playPowerUp();

        particles.push({
          x: p.x + p.width / 2,
          y: p.y - 12,
          vx: 0,
          vy: -1.5,
          color: '#FF1493',
          size: 14,
          life: 0,
          maxLife: 45,
          text: `★ SCORE POWER-UP! ★`,
        });

        // Spawn bonus Candy Powerup Drop as well
        items.push({
          id: `item_bonus_${Date.now()}`,
          type: Math.random() < 0.5 ? 'CANDY_PINK' : 'CANDY_BLUE',
          x: p.x,
          y: Math.max(20, p.y - 30),
          width: 20,
          height: 20,
          vx: (Math.random() - 0.5) * 3,
          vy: -4,
          points: 1000,
          lifetime: 0,
          isGrounded: false,
        });
      }

      // Controls Input Processing via keysRef for zero-lag responsiveness
      let moveDir = 0;
      let shouldJump = false;
      let shouldShoot = false;
      const keys = keysRef.current;

      if (p.id === 1) {
        // Player 1 Left: A / a / ㅁ / p1_left / or ArrowLeft in 1P mode
        if (
          keys['KeyA'] ||
          keys['a'] ||
          keys['A'] ||
          keys['ㅁ'] ||
          keys['p1_left'] ||
          (mode === '1P' && (keys['ArrowLeft'] || keys['Left'] || keys['arrowleft']))
        ) {
          moveDir -= 1;
        }

        // Player 1 Right: D / d / ㅇ / p1_right / or ArrowRight in 1P mode
        if (
          keys['KeyD'] ||
          keys['d'] ||
          keys['D'] ||
          keys['ㅇ'] ||
          keys['p1_right'] ||
          (mode === '1P' && (keys['ArrowRight'] || keys['Right'] || keys['arrowright']))
        ) {
          moveDir += 1;
        }

        // Player 1 Jump: W / w / ㅈ / Z / z / p1_jump / or ArrowUp in 1P mode
        if (
          keys['KeyW'] ||
          keys['w'] ||
          keys['W'] ||
          keys['ㅈ'] ||
          keys['KeyZ'] ||
          keys['z'] ||
          keys['KeyC'] ||
          keys['c'] ||
          keys['p1_jump'] ||
          (mode === '1P' && (keys['ArrowUp'] || keys['Up'] || keys['arrowup']))
        ) {
          shouldJump = true;
        }

        // Player 1 Shoot: Space / F / f / ㄹ / X / x / V / v / p1_shoot
        if (
          keys['Space'] ||
          keys[' '] ||
          keys['space'] ||
          keys['KeyF'] ||
          keys['f'] ||
          keys['F'] ||
          keys['ㄹ'] ||
          keys['KeyX'] ||
          keys['x'] ||
          keys['KeyV'] ||
          keys['v'] ||
          keys['p1_shoot'] ||
          (mode === '1P' && (keys['Slash'] || keys['/'] || keys['Enter']))
        ) {
          shouldShoot = true;
        }
      } else if (p.id === 2) {
        // Player 2 controls in 2P mode: Full Arrow Keys / Numpad / J-K-L-I / Slash / Enter support
        // Player 2 Left (좌측 이동 및 방향 전환)
        if (
          keys['ArrowLeft'] ||
          keys['Left'] ||
          keys['arrowleft'] ||
          keys['KeyJ'] ||
          keys['j'] ||
          keys['J'] ||
          keys['ㅓ'] ||
          keys['Numpad4'] ||
          keys['4'] ||
          keys['p2_left']
        ) {
          moveDir -= 1;
        }

        // Player 2 Right (우측 이동 및 방향 전환)
        if (
          keys['ArrowRight'] ||
          keys['Right'] ||
          keys['arrowright'] ||
          keys['KeyL'] ||
          keys['l'] ||
          keys['L'] ||
          keys['ㅣ'] ||
          keys['Numpad6'] ||
          keys['6'] ||
          keys['p2_right']
        ) {
          moveDir += 1;
        }

        // Player 2 Jump (점프)
        if (
          keys['ArrowUp'] ||
          keys['Up'] ||
          keys['arrowup'] ||
          keys['KeyI'] ||
          keys['i'] ||
          keys['I'] ||
          keys['ㅑ'] ||
          keys['Numpad8'] ||
          keys['Numpad5'] ||
          keys['8'] ||
          keys['5'] ||
          keys['p2_jump']
        ) {
          shouldJump = true;
        }

        // Player 2 Shoot (버블 발사)
        if (
          keys['Slash'] ||
          keys['/'] ||
          keys['?'] ||
          keys['Enter'] ||
          keys['enter'] ||
          keys['NumpadEnter'] ||
          keys['Period'] ||
          keys['.'] ||
          keys['KeyM'] ||
          keys['m'] ||
          keys['M'] ||
          keys['ㅡ'] ||
          keys['KeyK'] ||
          keys['k'] ||
          keys['K'] ||
          keys['ㅏ'] ||
          keys['ShiftRight'] ||
          keys['Shift'] ||
          keys['shift'] ||
          keys['Numpad0'] ||
          keys['0'] ||
          keys['p2_shoot']
        ) {
          shouldShoot = true;
        }
      }

      // Smooth Horizontal physics (Acceleration & Inertial Friction)
      const maxTargetSpeed = MOVE_SPEED * p.speedMultiplier;
      const accel = p.isGrounded ? 0.65 : 0.45;
      const friction = p.isGrounded ? 0.76 : 0.90;

      if (moveDir !== 0) {
        p.vx += moveDir * accel;
        p.vx = Math.max(-maxTargetSpeed, Math.min(maxTargetSpeed, p.vx));
        if (moveDir < 0) p.facing = 'left';
        if (moveDir > 0) p.facing = 'right';
      } else {
        p.vx *= friction;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
      }

      p.x += p.vx;

      // Wall collision X
      const leftCol = Math.floor(p.x / TILE_SIZE);
      const rightCol = Math.floor((p.x + p.width - 1) / TILE_SIZE);
      const topRow = Math.floor(p.y / TILE_SIZE);
      const botRow = Math.floor((p.y + p.height - 1) / TILE_SIZE);

      if (topRow >= 0 && topRow < STAGE_HEIGHT && isTileSolid(topRow, leftCol)) {
        p.x = (leftCol + 1) * TILE_SIZE;
      } else if (botRow >= 0 && botRow < STAGE_HEIGHT && isTileSolid(botRow, leftCol)) {
        p.x = (leftCol + 1) * TILE_SIZE;
      } else if (topRow >= 0 && topRow < STAGE_HEIGHT && isTileSolid(topRow, rightCol)) {
        p.x = rightCol * TILE_SIZE - p.width;
      } else if (botRow >= 0 && botRow < STAGE_HEIGHT && isTileSolid(botRow, rightCol)) {
        p.x = rightCol * TILE_SIZE - p.width;
      }

      // Strict clamp X to ensure player stays within left/right side boundaries
      p.x = Math.max(TILE_SIZE, Math.min(CANVAS_WIDTH - TILE_SIZE - p.width, p.x));

      // Jumping
      if (shouldJump && p.isGrounded) {
        p.vy = JUMP_FORCE;
        p.isGrounded = false;
        p.isJumping = true;
        audioEngine.playJump();
      }

      // Gravity Y
      p.vy += GRAVITY;
      p.y += p.vy;

      // Vertical wrap-around (Passing through top & bottom opening)
      if (p.y > CANVAS_HEIGHT) {
        // Falling down through the bottom floor opening -> wrap to top ceiling
        p.y = -p.height;
      } else if (p.y < -p.height && p.vy < 0) {
        // Jumping up through the top ceiling opening -> wrap to bottom floor
        p.y = CANVAS_HEIGHT - 2;
      }

      // Platform Landing Collision Y
      const newBotRow = Math.floor((p.y + p.height) / TILE_SIZE);
      const footLeftCol = Math.floor((p.x + 4) / TILE_SIZE);
      const footRightCol = Math.floor((p.x + p.width - 5) / TILE_SIZE);

      p.isGrounded = false;
      if (p.vy >= 0 && newBotRow >= 0 && newBotRow < STAGE_HEIGHT) {
        if (
          isTileSolid(newBotRow, footLeftCol, true) ||
          isTileSolid(newBotRow, footRightCol, true)
        ) {
          const tileTopY = newBotRow * TILE_SIZE;
          if (p.y + p.height - p.vy <= tileTopY + 8) {
            p.y = tileTopY - p.height;
            p.vy = 0;
            p.isGrounded = true;
            p.isJumping = false;
          }
        }
      }

      // Ride / Bounce on Bubbles
      bubbles.forEach((b) => {
        if (b.isPopping) return;
        const bx = b.x + b.width / 2;
        const by = b.y + b.height / 2;
        const px = p.x + p.width / 2;
        const py = p.y + p.height;

        // Feet landing on bubble top
        if (p.vy > 0 && Math.abs(px - bx) < 14 && Math.abs(py - by) < 12) {
          p.y = b.y - p.height;
          p.vy = -3.5; // Gentle bounce upward
          p.isGrounded = true;

          // Pop bubble if pressed jump hard
          if (shouldJump) {
            p.vy = JUMP_FORCE * 1.1;
            b.isPopping = true;
            b.popTimer = 0;
            audioEngine.playPop();
          }
        }
      });

      // Shooting Bubbles with dynamic speed and range buffs
      if (shouldShoot && p.shootingTimer <= 0) {
        const isRapid = (p.powerupRapidTimer || 0) > 0;
        const isLongRange = (p.powerupRangeTimer || 0) > 0;

        // Rapid fire reduces cooldown delay from 16 to 7 frames
        p.shootingTimer = isRapid ? 7 : 16;
        audioEngine.playShoot();

        const spawnX = p.facing === 'right' ? p.x + p.width : p.x - 18;
        const spawnY = p.y + 2;

        // Bubble velocity boosted by +60% if rapid powerup active
        const baseSpeed = isRapid ? 8.8 : 5.5;
        const shootVx = p.facing === 'right' ? baseSpeed : -baseSpeed;

        // Horizontal burst duration: normal 18 frames vs long range 35 frames
        const burstDuration = isLongRange ? 35 : 18;

        bubbles.push({
          id: `bubble_${p.id}_${Date.now()}`,
          playerId: p.id,
          type: 'NORMAL',
          x: spawnX,
          y: spawnY,
          width: 22,
          height: 22,
          vx: shootVx,
          vy: 0,
          facing: p.facing,
          lifetime: 0,
          burstDuration,
          maxLifetime: 360,
          floatVx: (Math.random() - 0.5) * 0.4,
          floatVy: -1.0 - Math.random() * 0.5,
        });
      }
    });

    onUpdatePlayers([...players]);

    // --- 2. UPDATE BUBBLES ---
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];

      if (b.isPopping) {
        b.popTimer = (b.popTimer || 0) + 1;
        if (b.popTimer > 6) {
          bubbles.splice(i, 1);
        }
        continue;
      }

      b.lifetime++;
      if (b.lifetime > b.maxLifetime) {
        b.isPopping = true;
        b.popTimer = 0;
        continue;
      }

      // Initial horizontal shoot burst (using custom burstDuration), then float upwards
      const burstLimit = b.burstDuration || 18;
      if (b.lifetime < burstLimit) {
        b.x += b.vx;
        b.vx *= 0.92; // Smooth decelerate
      } else {
        b.x += b.floatVx;
        b.y += b.floatVy;
      }

      // Wrap-around top/bottom
      if (b.y < -b.height) b.y = CANVAS_HEIGHT;

      // Check collision with Players (Popping enemy bubbles or collecting EXTEND letter)
      players.forEach((p) => {
        if (p.isDead) return;
        const dx = p.x + p.width / 2 - (b.x + b.width / 2);
        const dy = p.y + p.height / 2 - (b.y + b.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 22) {
          if (b.type === 'LETTER' && b.letter) {
            // Collect EXTEND Letter!
            audioEngine.playExtendLetter();
            if (!p.extendLetters.includes(b.letter)) {
              p.extendLetters.push(b.letter);
            }
            p.score += 500;
            particles.push({
              x: b.x,
              y: b.y,
              vx: 0,
              vy: -1,
              color: '#FFD700',
              size: 12,
              life: 0,
              maxLife: 30,
              text: `LETTER ${b.letter}! +500`,
            });
            b.isPopping = true;
            b.popTimer = 0;

            // Check if full EXTEND collected!
            if (p.extendLetters.length >= 6) {
              p.lives += 1; // 1UP!
              p.score += 10000;
              p.extendLetters = [];
              audioEngine.playCollectFruit();
            }
          } else if (b.containsEnemy) {
            // Pop Trapped Enemy Bubble!
            b.isPopping = true;
            b.popTimer = 0;
            audioEngine.playPop();

            p.score += 1000;

            // Spawn Delicious Fruit Item or Rare Powerup Candy
            const isPowerupCandidate = Math.random() < 0.22;
            let itemType: ItemType = 'CHERRY';
            let pts = 500;

            if (isPowerupCandidate) {
              itemType = Math.random() < 0.5 ? 'CANDY_PINK' : 'CANDY_BLUE';
              pts = 1000;
            } else {
              const fruits: ItemType[] = ['CHERRY', 'BANANA', 'APPLE', 'STRAWBERRY', 'CAKE', 'DIAMOND', 'BOOTS'];
              itemType = fruits[Math.floor(Math.random() * fruits.length)];
              if (itemType === 'BANANA') pts = 700;
              if (itemType === 'APPLE') pts = 1000;
              if (itemType === 'CAKE') pts = 2000;
              if (itemType === 'DIAMOND') pts = 5000;
              if (itemType === 'BOOTS') pts = 800;
            }

            items.push({
              id: `item_${Date.now()}_${Math.random()}`,
              type: itemType,
              x: b.x,
              y: b.y,
              width: 20,
              height: 20,
              vx: (Math.random() - 0.5) * 2,
              vy: -3,
              points: pts,
              lifetime: 0,
              isGrounded: false,
            });

            // Defeat enemy ref
            const trappedEnemyIdx = enemies.findIndex((e) => e.state === 'TRAPPED' && Math.abs(e.x - b.x) < 20 && Math.abs(e.y - b.y) < 20);
            if (trappedEnemyIdx >= 0) {
              const e = enemies[trappedEnemyIdx];
              e.health = (e.health || 1) - 1;
              if (e.health <= 0) {
                enemies.splice(trappedEnemyIdx, 1);
              } else {
                e.state = 'ANGRY'; // Boss gets angry when popped
                e.angryTimer = 180;
              }
            }
          }
        }
      });
    }

    // --- 3. UPDATE ENEMIES ---
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Enemy Trapped State
      if (e.state === 'TRAPPED') {
        e.trappedTimer++;
        // Sync position with trapped bubble if still floating
        const trappedBubble = bubbles.find(
          (b) => b.containsEnemy === e.type && Math.abs(b.x - e.x) < 36 && Math.abs(b.y - e.y) < 36 && !b.isPopping
        );
        if (trappedBubble) {
          e.x = trappedBubble.x;
          e.y = trappedBubble.y;
        } else {
          e.y -= 0.6; // Fallback slow float up
        }

        if (e.y < -e.height) e.y = CANVAS_HEIGHT;
        if (e.y > CANVAS_HEIGHT + e.height) e.y = -e.height;

        // Escape trapped bubble if not popped in time
        if (e.trappedTimer > 300) {
          e.state = 'ANGRY';
          e.angryTimer = 240;
          e.trappedTimer = 0;
          if (trappedBubble) {
            trappedBubble.isPopping = true;
            trappedBubble.popTimer = 0;
          }
        }
        continue;
      }

      // Rage Angry Timer
      if (e.state === 'ANGRY') {
        e.angryTimer--;
        if (e.angryTimer <= 0 && !isHurryUpRef.current) {
          e.state = 'NORMAL';
        }
      }

      const speedMod = e.state === 'ANGRY' || isHurryUpRef.current ? 1.8 : 1.0;

      // Boss Movement Logic
      if (e.type === 'BOSS_BARON') {
        e.x += e.vx * speedMod;
        if (e.x < 2 * TILE_SIZE || e.x > (STAGE_WIDTH - 4) * TILE_SIZE) {
          e.vx *= -1;
          e.facing = e.vx > 0 ? 'right' : 'left';
        }

        e.shootTimer++;
        if (e.shootTimer > 100) {
          e.shootTimer = 0;
          // Spawn fireball bubble
          bubbles.push({
            id: `fireball_${Date.now()}`,
            playerId: 1,
            type: 'FIRE',
            x: e.x + 10,
            y: e.y + 20,
            width: 20,
            height: 20,
            vx: (Math.random() - 0.5) * 4,
            vy: 2.5,
            facing: 'left',
            lifetime: 0,
            maxLifetime: 240,
            floatVx: (Math.random() - 0.5) * 2,
            floatVy: 1.5,
          });
        }
      } else {
        // Normal Enemy Patrol
        e.x += e.vx * speedMod;

        // Wall collisions
        const colLeft = Math.floor(e.x / TILE_SIZE);
        const colRight = Math.floor((e.x + e.width) / TILE_SIZE);
        const rowBot = Math.floor((e.y + e.height - 1) / TILE_SIZE);

        if (rowBot >= 0 && rowBot < STAGE_HEIGHT) {
          if (isTileSolid(rowBot, colLeft) || isTileSolid(rowBot, colRight)) {
            e.vx *= -1;
            e.facing = e.vx > 0 ? 'right' : 'left';
          }
        }

        // Random Jump to higher platforms
        e.jumpTimer++;
        if (e.jumpTimer > 120 && e.isGrounded && Math.random() < 0.4) {
          e.vy = JUMP_FORCE * 0.9;
          e.isGrounded = false;
          e.jumpTimer = 0;
        }

        // Gravity
        e.vy += GRAVITY;
        e.y += e.vy;

        // Vertical wrap-around for enemy
        if (e.y > CANVAS_HEIGHT) {
          e.y = -e.height;
        } else if (e.y < -e.height && e.vy < 0) {
          e.y = CANVAS_HEIGHT - 2;
        }

        // Platform landing
        const newBot = Math.floor((e.y + e.height) / TILE_SIZE);
        const eFootCol = Math.floor((e.x + e.width / 2) / TILE_SIZE);

        e.isGrounded = false;
        if (e.vy >= 0 && newBot >= 0 && newBot < STAGE_HEIGHT && isTileSolid(newBot, eFootCol, true)) {
          const tileTopY = newBot * TILE_SIZE;
          if (e.y + e.height - e.vy <= tileTopY + 8) {
            e.y = tileTopY - e.height;
            e.vy = 0;
            e.isGrounded = true;
          }
        }

        // Check Collision with Flying Normal Player Bubbles -> Trapping Enemy!
        bubbles.forEach((b) => {
          if (b.isPopping || b.containsEnemy || b.type !== 'NORMAL') return;
          const dx = b.x + b.width / 2 - (e.x + e.width / 2);
          const dy = b.y + b.height / 2 - (e.y + e.height / 2);
          if (Math.sqrt(dx * dx + dy * dy) < 22) {
            // Trapped inside bubble!
            e.state = 'TRAPPED';
            e.trappedTimer = 0;
            b.containsEnemy = e.type;
            b.type = 'TRAPPED';
            b.vx = 0;
            b.floatVy = -0.7 - Math.random() * 0.3; // Float up slowly
            b.lifetime = 0;
            b.maxLifetime = 300; // 5 seconds before escape
            b.isPopping = false; // KEEP BUBBLE ALIVE FOR PLAYER TO POP!
            audioEngine.playTrap();
          }
        });
      }

      // Check Collision with Active Players
      players.forEach((p) => {
        if (p.isDead || p.invulnerableTimer > 0) return;
        const dx = p.x + p.width / 2 - (e.x + e.width / 2);
        const dy = p.y + p.height / 2 - (e.y + e.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 22) {
          if (e.state === 'TRAPPED') {
            // Touch trapped enemy directly -> Pop & Eat!
            p.score += 1000;
            audioEngine.playPop();
            audioEngine.playCollectFruit();

            particles.push({
              x: e.x,
              y: e.y,
              vx: 0,
              vy: -1.2,
              color: '#FFD700',
              size: 14,
              life: 0,
              maxLife: 35,
              text: '1000',
            });

            const fruits: ItemType[] = ['CHERRY', 'BANANA', 'APPLE', 'STRAWBERRY', 'CAKE', 'DIAMOND'];
            const fruitType = fruits[Math.floor(Math.random() * fruits.length)];
            let pts = 500;
            if (fruitType === 'BANANA') pts = 700;
            if (fruitType === 'APPLE') pts = 1000;
            if (fruitType === 'CAKE') pts = 2000;
            if (fruitType === 'DIAMOND') pts = 5000;

            items.push({
              id: `item_${Date.now()}_${Math.random()}`,
              type: fruitType,
              x: e.x,
              y: e.y,
              width: 20,
              height: 20,
              vx: (Math.random() - 0.5) * 2.5,
              vy: -3.5,
              points: pts,
              lifetime: 0,
              isGrounded: false,
            });

            const matchingBubble = bubbles.find((b) => b.containsEnemy === e.type && Math.abs(b.x - e.x) < 32 && Math.abs(b.y - e.y) < 32);
            if (matchingBubble) {
              matchingBubble.isPopping = true;
              matchingBubble.popTimer = 0;
            }

            enemies.splice(i, 1);
            return;
          }

          // Normal / Angry enemy hits player
          p.lives -= 1;
          p.isDead = true;
          p.deathTimer = 0;
          audioEngine.playPlayerDeath();

          // Particle burst
          for (let k = 0; k < 8; k++) {
            particles.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: '#FF0000',
              size: 4,
              life: 0,
              maxLife: 20,
            });
          }
        }
      });
    }

    // --- 4. UPDATE ITEMS ---
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.lifetime++;
      if (it.lifetime > 400) {
        items.splice(i, 1);
        continue;
      }

      if (!it.isGrounded) {
        it.vy += GRAVITY;
        it.y += it.vy;
        it.x += it.vx;

        // Wrap through bottom to top
        if (it.y > CANVAS_HEIGHT) {
          it.y = -it.height;
        }

        const bRow = Math.floor((it.y + it.height) / TILE_SIZE);
        const bCol = Math.floor((it.x + it.width / 2) / TILE_SIZE);
        if (bRow >= 0 && bRow < STAGE_HEIGHT && isTileSolid(bRow, bCol, true)) {
          const tileTopY = bRow * TILE_SIZE;
          if (it.y + it.height - it.vy <= tileTopY + 8) {
            it.y = tileTopY - it.height;
            it.vy = 0;
            it.vx = 0;
            it.isGrounded = true;
          }
        }
      }

      // Player Item Pickup
      players.forEach((p) => {
        if (p.isDead) return;
        const dx = p.x + p.width / 2 - (it.x + it.width / 2);
        const dy = p.y + p.height / 2 - (it.y + it.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 22) {
          p.score += it.points;

          if (it.type === 'CANDY_PINK') {
            // Pink Candy: Rapid Fire + High Velocity Bubbles (for 10 seconds / 600 frames)
            p.powerupRapidTimer = 600;
            audioEngine.playPowerUp();
            particles.push({
              x: it.x,
              y: it.y,
              vx: 0,
              vy: -1.4,
              color: '#FF1493',
              size: 12,
              life: 0,
              maxLife: 35,
              text: '⚡ RAPID SPEED! +1000',
            });
          } else if (it.type === 'CANDY_BLUE') {
            // Blue Candy: Extended Long Range Bubbles (for 10 seconds / 600 frames)
            p.powerupRangeTimer = 600;
            audioEngine.playPowerUp();
            particles.push({
              x: it.x,
              y: it.y,
              vx: 0,
              vy: -1.4,
              color: '#00BFFF',
              size: 12,
              life: 0,
              maxLife: 35,
              text: '🎯 LONG RANGE! +1000',
            });
          } else if (it.type === 'BOOTS') {
            // Speed Boots: Player movement speed increase
            p.speedMultiplier = 1.35;
            audioEngine.playPowerUp();
            particles.push({
              x: it.x,
              y: it.y,
              vx: 0,
              vy: -1.4,
              color: '#FF4500',
              size: 12,
              life: 0,
              maxLife: 30,
              text: '👟 SPEED UP! +800',
            });
          } else {
            audioEngine.playCollectFruit();
            particles.push({
              x: it.x,
              y: it.y,
              vx: 0,
              vy: -1,
              color: '#FFFF00',
              size: 10,
              life: 0,
              maxLife: 25,
              text: `+${it.points}`,
            });
          }

          items.splice(i, 1);
        }
      });
    }

    // --- 5. UPDATE PARTICLES ---
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.life++;
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (pt.life >= pt.maxLife) particles.splice(i, 1);
    }

    // Periodic Player State sync to React UI (every 10 frames)
    if (animFrameRef.current % 10 === 0) {
      onUpdatePlayers([...players]);
    }

    // --- 6. CHECK STAGE CLEAR / GAME OVER CONDITIONS ---
    const activeEnemies = enemies.filter((e) => e.state !== 'DEAD');
    if (activeEnemies.length === 0) {
      // Stage Cleared!
      audioEngine.playStageClear();
      const scoreP1 = players.find((p) => p.id === 1)?.score || 0;
      const scoreP2 = players.find((p) => p.id === 2)?.score;
      onStageClear(scoreP1, scoreP2);
    }

    const allDead = players.every((p) => p.lives <= 0);
    if (allDead) {
      audioEngine.stopBgm();
      const p1Final = players.find((p) => p.id === 1)?.score || 0;
      const p2Final = players.find((p) => p.id === 2)?.score || 0;
      onGameOver(p1Final, p2Final, currentStageNumber, false);
    }
  }, [stage, onStageClear, onGameOver, currentStageNumber, mode, onUpdatePlayers]);

  // Main Canvas Render Loop
  useEffect(() => {
    let animationId: number;

    const render = () => {
      animFrameRef.current++;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Turn off anti-aliasing for crisp retro 8-bit pixel art
      ctx.imageSmoothingEnabled = false;

      if (status === 'PLAYING') {
        updatePhysics();
      }

      // 1. Draw Retro Arcade Background Canvas & Themed Backdrop Art
      drawStageBackgroundArt(
        ctx,
        stage.theme || 'CANDY',
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
        animFrameRef.current
      );

      // Draw Retro Arcade Dot Matrix Background Grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
      for (let x = 10; x < CANVAS_WIDTH; x += 20) {
        for (let y = 10; y < CANVAS_HEIGHT; y += 20) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      // Stage Title Banner Inside Canvas Top Bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 18);
      ctx.fillStyle = stage.brickAccent;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`★ STAGE ${stage.stageNumber}/10 : ${stage.name.toUpperCase()} ★`, CANVAS_WIDTH / 2, 13);

      // 2. Draw Bricks / Platforms
      for (let r = 0; r < STAGE_HEIGHT; r++) {
        for (let c = 0; c < STAGE_WIDTH; c++) {
          const tile = stage.grid[r][c];
          if (tile > 0) {
            drawStageBrick(
              ctx,
              c * TILE_SIZE,
              r * TILE_SIZE,
              TILE_SIZE,
              tile,
              stage.brickColor,
              stage.brickAccent
            );
          }
        }
      }

      // 3. Draw Items (with seamless vertical wrap rendering)
      itemsRef.current.forEach((it) => {
        drawItem(ctx, it, animFrameRef.current);
        if (it.y < 0) {
          drawItem(ctx, { ...it, y: it.y + CANVAS_HEIGHT }, animFrameRef.current);
        } else if (it.y > CANVAS_HEIGHT - it.height) {
          drawItem(ctx, { ...it, y: it.y - CANVAS_HEIGHT }, animFrameRef.current);
        }
      });

      // 4. Draw Bubbles (with seamless vertical wrap rendering)
      bubblesRef.current.forEach((b) => {
        drawBubble(ctx, b, animFrameRef.current);
        if (b.y < 0) {
          drawBubble(ctx, { ...b, y: b.y + CANVAS_HEIGHT }, animFrameRef.current);
        } else if (b.y > CANVAS_HEIGHT - b.height) {
          drawBubble(ctx, { ...b, y: b.y - CANVAS_HEIGHT }, animFrameRef.current);
        }
      });

      // 5. Draw Enemies (with seamless vertical wrap rendering)
      enemiesRef.current.forEach((e) => {
        drawEnemy(ctx, e, animFrameRef.current);
        if (e.y < 0) {
          drawEnemy(ctx, { ...e, y: e.y + CANVAS_HEIGHT }, animFrameRef.current);
        } else if (e.y > CANVAS_HEIGHT - e.height) {
          drawEnemy(ctx, { ...e, y: e.y - CANVAS_HEIGHT }, animFrameRef.current);
        }
      });

      // 6. Draw Players (with seamless vertical wrap rendering)
      playersRef.current.forEach((p) => {
        if (!p.isDead) {
          drawDragon(ctx, p, animFrameRef.current);
          if (p.y < 0) {
            drawDragon(ctx, { ...p, y: p.y + CANVAS_HEIGHT }, animFrameRef.current);
          } else if (p.y > CANVAS_HEIGHT - p.height) {
            drawDragon(ctx, { ...p, y: p.y - CANVAS_HEIGHT }, animFrameRef.current);
          }
        }
      });

      // 7. Draw Floating Score Text Particles
      particlesRef.current.forEach((pt) => {
        ctx.save();
        if (pt.text) {
          ctx.fillStyle = pt.color;
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(pt.text, pt.x, pt.y);
        } else {
          ctx.fillStyle = pt.color;
          ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
        }
        ctx.restore();
      });

      // 8. Draw "HURRY UP!" Banner Overlay
      if (isHurryUpRef.current && Math.floor(animFrameRef.current / 12) % 2 === 0) {
        ctx.save();
        ctx.shadowColor = '#FF0055';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'black 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ HURRY UP! ⚡', CANVAS_WIDTH / 2, 45);
        ctx.restore();
      }

      // 9. Draw EXTEND Letters Tray at bottom left
      const p1 = playersRef.current.find((p) => p.id === 1);
      if (p1) {
        const letters = ['E', 'X', 'T', 'E', 'N', 'D'];
        ctx.font = 'bold 12px monospace';
        letters.forEach((char, idx) => {
          const collected = p1.extendLetters.includes(char);
          ctx.fillStyle = collected ? '#00FF00' : '#333344';
          ctx.fillText(char, 12 + idx * 14, CANVAS_HEIGHT - 8);
        });

        // Draw Active Power-Up Badges on Bottom Right of Canvas
        let badgeX = CANVAS_WIDTH - 12;
        if (p1.powerupRapidTimer && p1.powerupRapidTimer > 0) {
          const secs = Math.ceil(p1.powerupRapidTimer / 60);
          ctx.save();
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#FF1493';
          ctx.fillText(`⚡RAPID ${secs}s`, badgeX, CANVAS_HEIGHT - 8);
          ctx.restore();
          badgeX -= 75;
        }

        if (p1.powerupRangeTimer && p1.powerupRangeTimer > 0) {
          const secs = Math.ceil(p1.powerupRangeTimer / 60);
          ctx.save();
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#00BFFF';
          ctx.fillText(`🎯RANGE ${secs}s`, badgeX, CANVAS_HEIGHT - 8);
          ctx.restore();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [status, stage, updatePhysics]);

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center select-none my-2">
      {/* Retro Arcade Machine Cabinet Bezel Frame */}
      <div className="bento-card p-3 sm:p-5 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-pink-500/60 shadow-2xl rounded-2xl w-full flex flex-col items-center relative overflow-hidden">
        {/* Top Marquee Header Bar */}
        <div className="w-full max-w-[720px] flex items-center justify-between px-3 py-1.5 mb-2 bg-slate-950/90 border border-pink-500/40 rounded-lg text-xs font-mono">
          <div className="flex items-center gap-2 text-pink-400 font-bold glow-pink">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping"></span>
            <span>TAITO 1986 ARCADE</span>
          </div>
          <div className="text-yellow-300 font-bold glow-yellow hidden sm:block">
            CREDIT 01 • FREE PLAY
          </div>
          <div className="text-emerald-400 font-bold glow-green">
            STAGE {currentStageNumber}/10
          </div>
        </div>

        {/* Screen Bezel Container */}
        <div
          className={`relative border-4 border-slate-800 ring-2 ring-pink-500/40 rounded-xl overflow-hidden bg-black shadow-[0_0_30px_rgba(236,72,153,0.25)] w-full max-w-[720px] ${
            crtEffect ? 'crt-scanline-effect' : ''
          }`}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="w-full h-auto aspect-[14/10] block bg-black"
          />

          {/* CRT Scanline Filter CSS Overlay */}
          {crtEffect && (
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-70 z-10"></div>
          )}
        </div>
      </div>
    </div>
  );
};
