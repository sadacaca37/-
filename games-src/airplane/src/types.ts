export type GameState = 'TITLE' | 'PLANE_SELECT' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER' | 'VICTORY' | 'PAUSED';

export type GameMode = '1P' | '2P';

export type PlaneId =
  | 'AV8_HARRIER'
  | 'FA18_SUPER_HORNET'
  | 'F4_PHANTOM'
  | 'F117_NIGHTHAWK'
  | 'VIOLET_SERAPH'
  | 'X36';

export interface PlaneConfig {
  id: PlaneId;
  name: string;
  koreanName: string;
  codename: string;
  type: 'SPREAD' | 'FOCUSED';
  koreanType: string;
  /** 기체마다 다른 무기 방식 */
  weapon: 'WIDE' | 'FOCUS' | 'PIERCE' | 'HOMING' | 'SERAPH' | 'LASER';
  /** 화면에 보여 줄 한 줄 특징 (아이들용 쉬운 설명) */
  strength: string;
  weakness: string;
  /** 폭탄 위력 (적 전체에 주는 피해) */
  bombPower: number;
  isElite?: boolean;
  country: string;
  flag: string;
  speed: number;
  fireRate: number; // shots per second
  power: number;
  bombType: 'SUPER_TOMAHAWK' | 'SAMURAI_SWORD' | 'CLUSTER_BOMB' | 'THUNDERBOLT' | 'MEGA_SMASH';
  bombName: string;
  koreanBombName: string;
  bombDesc: string;
  specialMove: string;
  color: string;
  accentColor: string;
  description: string;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  planeId: PlaneId;
  speed: number;
  powerLevel: number; // 1 to 5
  bombs: number;
  lives: number;
  maxLives: number;
  score: number;
  options: number; // 0 to 2 escort drones
  isInvincible: boolean;
  invincibleTimer: number;
  isLooping: boolean; // 360 loop-the-loop evasion roll
  loopProgress: number; // 0 to 1
  loopsRemaining: number;
  tilt: number; // -1 (left) to 1 (right) for banking sprite
  propellerAngle: number;
  lastShotTime: number;
  hitboxRadius: number;
  playerNumber: 1 | 2;
}

export type EnemyType = 
  | 'SCOUT_GREEN' 
  | 'SCOUT_ORANGE' 
  | 'SCOUT_DART'
  | 'FIGHTER_RED' 
  | 'HEAVY_BOMBER' 
  | 'STEALTH_JET' 
  | 'GUNBOAT' 
  | 'BATTLESHIP' 
  | 'ISLAND_TURRET' 
  | 'GROUND_ARTILLERY'
  | 'BOSS_STAGE_1' 
  | 'BOSS_STAGE_2' 
  | 'BOSS_STAGE_3' 
  | 'BOSS_STAGE_4'
  | 'BOSS_STAGE_5'
  | 'BOSS_STAGE_6'
  | 'BOSS_STAGE_7'
  | 'BOSS_STAGE_8'
  | 'BOSS_STAGE_9'
  | 'BOSS_STAGE_10';

export type EnemyBehavior =
  | 'STRAIGHT'
  | 'SWOOP_LEFT'
  | 'SWOOP_RIGHT'
  | 'ZIGZAG'
  | 'HOVER_RETREAT'
  | 'TURRET_AIM'
  | 'BOSS_PATTERN'
  | 'HEART_FORMATION_L'
  | 'HEART_FORMATION_R'
  | 'V_FORMATION'
  | 'CIRCLE_DIVE'
  | 'DART_SWOOP';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  shootTimer: number;
  shootInterval: number;
  patternTimer: number;
  behavior: EnemyBehavior;
  isGroundOrSea: boolean; // rendered below airborne planes
  rotation: number;
  color?: string;
  spriteKey?: string;
  stageIndex?: number;
  isBoss?: boolean;
  bossPhase?: number;
  bossName?: string;
  parts?: BossPart[];
  /** 맞았을 때 잠깐 반짝이는 시간(초) */
  hitFlash?: number;
}

export interface BossPart {
  id: string;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isDestroyed: boolean;
  type: 'TURRET' | 'ENGINE' | 'WING_CANNON' | 'CORE';
  shootTimer: number;
  angle: number;
}

export type BulletOwner = 'PLAYER' | 'PLAYER_1' | 'PLAYER_2' | 'ENEMY' | 'OPTION';
export type BulletType = 'VULCAN' | 'LASER' | 'HOMING_MISSILE' | 'ENEMY_ORB' | 'ENEMY_NEEDLE' | 'ENEMY_HEAVY' | 'PLASMA_BLAST';

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  owner: BulletOwner;
  type: BulletType;
  damage: number;
  color: string;
  glowColor?: string;
  angle?: number;
  targetEnemyId?: string;
  piercing?: boolean;
  /** 관통탄이 이미 맞힌 적 (같은 적을 매 프레임 때리지 않도록) */
  hitIds?: string[];
}

export type ItemType = 'POWER_UP' | 'BOMB' | 'SPEED_UP' | 'OPTION' | 'MEDAL' | 'SHIELD';

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: ItemType;
  medalTier: number; // 1 to 5 (100, 200, 500, 1000, 2000, 5000 pts)
  timer: number;
  blinkTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'CIRCLE' | 'SQUARE' | 'SPARK' | 'SMOKE' | 'RING';
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
}

export interface BombEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  type: string;
  duration: number;
  maxDuration: number;
  damage: number;
}

export interface StageInfo {
  stageNumber: number;
  title: string;
  subtitle: string;
  theme: 'RAILWAY_FOREST' | 'OCEAN' | 'FORTRESS' | 'SUNSET_CLOUDS' | 'NIGHT_BASE';
  bgSpeed: number;
  bossType: EnemyType;
  bossName: string;
  durationSeconds: number;
  difficultyRating: string;
  dangerLevel: number; // 1 to 4 stars
  description: string;
}

export interface HighScoreEntry {
  rank: number;
  name: string;
  score: number;
  stage: number;
  planeId: PlaneId;
  date: string;
}

export interface GameStats {
  score: number;
  player1Score: number;
  player2Score?: number;
  stageNumber: number;
  enemiesDestroyed: number;
  totalEnemies: number;
  shotsFired: number;
  shotsHit: number;
  medalsCollected: number;
  bombsUsed: number;
}

export interface GameSettings {
  soundVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  crtFilter: boolean;
  scanlines: boolean;
  screenShake: boolean;
  autoFire: boolean;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'INSANE';
  controls: 'KEYBOARD' | 'MOUSE' | 'TOUCH';
}
