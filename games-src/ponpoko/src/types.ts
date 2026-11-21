export type GameMode = 'TITLE' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER' | 'RANKING';

export type DifficultyLevel = 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';

export interface DifficultySettings {
  level: DifficultyLevel;
  label: string;
  koreanLabel: string;
  speedMultiplier: number;
  timeMultiplier: number;
  color: string;
  badgeBg: string;
  description: string;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultySettings> = {
  EASY: {
    level: 'EASY',
    label: 'EASY',
    koreanLabel: '쉬움',
    speedMultiplier: 0.75,
    timeMultiplier: 1.3,
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-950 border-emerald-500 text-emerald-300',
    description: '적 속도 0.75배, 제한시간 +30%',
  },
  NORMAL: {
    level: 'NORMAL',
    label: 'NORMAL',
    koreanLabel: '보통',
    speedMultiplier: 1.0,
    timeMultiplier: 1.0,
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-950 border-yellow-500 text-yellow-300',
    description: '1982 오리지널 아케이드 표준 밸런스',
  },
  HARD: {
    level: 'HARD',
    label: 'HARD',
    koreanLabel: '어려움',
    speedMultiplier: 1.35,
    timeMultiplier: 0.8,
    color: 'text-orange-400',
    badgeBg: 'bg-orange-950 border-orange-500 text-orange-300',
    description: '적 속도 1.35배, 제한시간 -20%',
  },
  EXPERT: {
    level: 'EXPERT',
    label: 'EXPERT',
    koreanLabel: '전문가',
    speedMultiplier: 1.7,
    timeMultiplier: 0.65,
    color: 'text-red-400',
    badgeBg: 'bg-red-950 border-red-500 text-red-300',
    description: '적 속도 1.7배, 제한시간 -35%',
  },
};

export type FruitType = 
  | 'carrot'     // Stage 1
  | 'cherry'     // Stage 2
  | 'mushroom'   // Stage 3
  | 'corn'       // Stage 4
  | 'watermelon' // Stage 5/10
  | 'strawberry' // Stage 5
  | 'banana'     // Stage 6
  | 'melon'      // Stage 7
  | 'pineapple'  // Stage 8
  | 'grape';     // Stage 9

export type PowerUpType = 'speed_boost' | 'power_hammer' | 'extra_life';

export type ItemType = FruitType | 'jar' | 'power_speed' | 'power_hammer' | 'power_life';

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  isBreakable?: boolean;
}

export interface Ladder {
  x: number;
  yMin: number;
  yMax: number;
  width: number;
}

export interface Spike {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMoving?: boolean;
  minX?: number;
  maxX?: number;
  vx?: number;
  isDestroyed?: boolean;
}

export interface Item {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  points: number;
  collected: boolean;
  hasSnake?: boolean; // Jar opening hazard
  containedPowerUp?: 'power_speed' | 'power_hammer' | 'power_life'; // Jar hidden power-up
}

export type EnemyType = 'mouse' | 'snake' | 'frog' | 'bat' | 'ghost' | 'flame';

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy?: number;
  minX: number;
  maxX: number;
  platformY: number;
  animFrame: number;
  facing: 'left' | 'right';
  baseY?: number; // For flying / floating enemies (bats, ghosts)
  jumpTimer?: number; // For frogs
  isDestroyed?: boolean;
}

export interface Player {
  id?: 1 | 2;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isOnLadder: boolean;
  isJumping: boolean;
  facing: 'left' | 'right';
  animFrame: number;
  animTimer: number;
  invulnerableTimer: number;
  speedBoostTimer: number; // Duration of speed boots (in frames/seconds)
  hammerTimer: number;     // Duration of super hammer (in frames/seconds)
  color?: 'red' | 'blue' | 'gold';
  isAlive?: boolean;
  isDying?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface FloatingScoreText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  vy: number;
  scale?: number;
}

export interface GamePlayerState {
  id: 1 | 2;
  score: number;
  lives: number;
  currentStage: number;
  color: 'red' | 'blue';
  isGameOver: boolean;
}

export interface HighScoreItem {
  rank: string;
  name: string;
  score: number;
  date: string;
  stage?: number;
  difficulty?: DifficultyLevel;
}

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  bgFruit: FruitType;
  platforms: Platform[];
  ladders: Ladder[];
  spikes: Spike[];
  items: Item[];
  enemies: Enemy[];
  timeLimit: number; // in seconds
  initialPlayerPos: { x: number; y: number };
}
