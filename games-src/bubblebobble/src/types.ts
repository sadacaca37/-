export type GameMode = '1P' | '2P';

export type GameStatus = 'TITLE' | 'PLAYING' | 'PAUSED' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity extends Point, Size {
  vx: number;
  vy: number;
}

export type EnemyType = 'MONSTA' | 'ZEN_CHAN' | 'MIGHTA' | 'BOSS_BARON';

export interface Player extends Entity {
  id: 1 | 2;
  color: 'green' | 'blue';
  facing: 'left' | 'right';
  isGrounded: boolean;
  isJumping: boolean;
  shootingTimer: number;
  invulnerableTimer: number;
  score: number;
  lives: number;
  isDead: boolean;
  deathTimer: number;
  speedMultiplier: number;
  bubbleRange: number;
  extendLetters: string[]; // E, X, T, E, N, D
  powerupRapidTimer?: number; // Rapid fire & fast speed bubble
  powerupRangeTimer?: number; // Extended long range bubble
  lastMilestoneScore?: number; // Tracks every 5,000 pts milestone for auto powerups
}

export interface Enemy extends Entity {
  id: string;
  type: EnemyType;
  facing: 'left' | 'right';
  isGrounded: boolean;
  state: 'NORMAL' | 'TRAPPED' | 'ANGRY' | 'DEAD';
  trappedTimer: number;
  trappedByPlayerId?: 1 | 2;
  angryTimer: number;
  jumpTimer: number;
  shootTimer: number;
  health?: number; // For Boss
  maxHealth?: number;
  color: string;
}

export interface Bubble extends Entity {
  id: string;
  playerId: 1 | 2;
  type: 'NORMAL' | 'WATER' | 'FIRE' | 'LETTER';
  letter?: string; // 'E', 'X', 'T', 'E', 'N', 'D'
  facing: 'left' | 'right';
  lifetime: number; // in frames
  maxLifetime: number;
  burstDuration?: number; // Duration of initial high-speed forward travel
  containsEnemy?: EnemyType;
  floatVx: number;
  floatVy: number;
  isPopping?: boolean;
  popTimer?: number;
}

export type ItemType = 'CHERRY' | 'BANANA' | 'APPLE' | 'STRAWBERRY' | 'CAKE' | 'DIAMOND' | 'BOOTS' | 'CANDY_PINK' | 'CANDY_BLUE' | 'EXTEND_LETTER';

export interface Item extends Entity {
  id: string;
  type: ItemType;
  points: number;
  letter?: string;
  lifetime: number;
  isGrounded: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  text?: string;
}

export interface StageConfig {
  stageNumber: number;
  name: string;
  theme: 'CANDY' | 'PYRAMID' | 'JUNGLE' | 'ICE' | 'NEON' | 'VOLCANO' | 'COSMIC' | 'HAUNTED' | 'VAULT' | 'BOSS';
  bgColor: string;
  brickColor: string;
  brickAccent: string;
  grid: number[][]; // 0: empty, 1: wall/brick, 2: pass-through platform, 3: hazard
  playerSpawns: { p1: Point; p2: Point };
  enemies: { type: EnemyType; x: number; y: number }[];
  timeLimitLimitSeconds: number;
}

export interface HighScoreRecord {
  name: string;
  score: number;
  round: number;
  timeElapsedSeconds: number;
  date: string;
}
