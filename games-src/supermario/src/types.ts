export type GameState =
  | 'MENU'
  | 'STAGE_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY'
  | 'LEADERBOARD'
  | 'GUIDE';

export type PlayerMode = '1P' | '2P';

export type CharacterType = 'mario' | 'luigi' | 'toad' | 'peach' | 'yoshi';

export type PowerUpType =
  | 'none'
  | 'super'
  | 'fire'
  | 'propeller'
  | 'squirrel'
  | 'spiny_helmet';

export type VehicleType =
  | 'none'
  | 'yoshi'
  | 'clown_car'
  | 'fire_clown_car'
  | 'dry_bones_shell';

export interface Player {
  id: number;
  character: CharacterType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isJumping: boolean;
  isCrouching: boolean;
  isGliding: boolean; // Squirrel suit
  isPropellerSpinning: boolean; // Propeller suit launch
  propellerTimer: number;
  canDoubleJump: boolean; // Squirrel pop
  flutterTimer: number; // Yoshi flutter
  isFluttering: boolean;
  isDeadBonesDucking: boolean; // Dry bones shell invulnerable state
  deadBonesTimer: number;
  powerUp: PowerUpType;
  vehicle: VehicleType;
  invincibleTimer: number; // Starman or damage recovery
  starmanTimer: number; // True super star
  lives: number;
  coins: number;
  score: number;
  chargeTimer: number; // Clown car charge shot
  isCharging: boolean;
  attackSpinTimer?: number; // Melee spin attack when hitting Attack without Fire power
  isDead: boolean;
  deathTimer: number;
  walkFrame: number;
  animTimer: number;
  respawnBubbleTimer: number; // 2P catch up
  coyoteTimer?: number; // Grace period after walking off ledge
  jumpBufferTimer?: number; // Buffer jump press before landing
  peachFloatTimer?: number; // Princess Peach Royal Float duration
  isSlidingPole?: boolean; // Flagpole sliding animation
  isEnteringCastle?: boolean; // Walking into castle after flag drop
  slidePoleTimer?: number;
}

export type BlockType =
  | 'ground'
  | 'brick'
  | 'question'
  | 'question_used'
  | 'hard_block'
  | 'pipe_top_left'
  | 'pipe_top_right'
  | 'pipe_body_left'
  | 'pipe_body_right'
  | 'cloud_platform'
  | 'note_block'
  | 'spikes'
  | 'lava'
  | 'moving_platform'
  | 'flagpole'
  | 'flag_top'
  | 'castle_axe'
  | 'bridge_chain';

export type ItemContentType =
  | 'coin'
  | 'super_mushroom'
  | 'fire_flower'
  | 'propeller_mushroom'
  | 'super_acorn'
  | 'spiny_shell'
  | 'starman'
  | 'yoshi_egg'
  | 'clown_car'
  | 'dry_bones_shell'
  | '1up_mushroom';

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BlockType;
  content?: ItemContentType;
  bumpOffset: number;
  bumpVy: number;
  isDestroyed?: boolean;
  vx?: number; // For moving platform
  vy?: number;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  flagY?: number; // Smooth sliding position of flag down the flagpole
}

export type EnemyType =
  | 'goomba'
  | 'koopa_green'
  | 'koopa_red'
  | 'koopa_shell'
  | 'spiny'
  | 'piranha_plant'
  | 'dry_bones'
  | 'hammer_bro'
  | 'bullet_bill'
  | 'bowser';

export interface Enemy {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: EnemyType;
  facing: 'left' | 'right';
  isGrounded: boolean;
  isDead: boolean;
  deathTimer: number;
  isShellSpinning?: boolean;
  shellSpeed?: number;
  bonesCrumpledTimer?: number;
  attackTimer?: number;
  jumpTimer?: number;
  health?: number;
  maxHealth?: number;
  animTimer: number;
  animFrame: number;
  bossPhase?: number;
  isLeaping?: boolean;
  fireChargeTimer?: number;
  isFallingInLava?: boolean;
  pipeTopY?: number; // Base position for piranha plant inside pipe
  pipeBaseY?: number;
  plantState?: 'emerging' | 'extended' | 'retreating' | 'hidden';
  plantStateTimer?: number;
}

export interface ItemEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: ItemContentType;
  isGrounded: boolean;
  spawnTimer: number; // Rising out of block
  lifeTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: 'player_fireball' | 'charge_fireball' | 'enemy_fireball' | 'hammer' | 'bullet' | 'bowser_fire';
  ownerId: number; // 1 = P1, 2 = P2, -1 = enemy
  lifeTimer: number;
  bounces?: number;
}

export interface YoshiTongue {
  active: boolean;
  playerId: number;
  x: number;
  y: number;
  length: number;
  maxLength: number;
  state: 'extending' | 'retracting';
  facing: 'left' | 'right';
  caughtEnemy?: Enemy;
  caughtItem?: ItemEntity;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  type: 'spark' | 'smoke' | 'brick_debris' | 'star_sparkle' | 'floating_text' | 'ring' | 'fire_trail' | 'firework' | 'confetti';
  text?: string;
  gravity?: number;
}

export interface StageData {
  id: number;
  title: string;
  subtitle: string;
  theme: 'grassland' | 'underground' | 'sky' | 'canyon' | 'mountain' | 'lava' | 'boss_castle';
  width: number;
  height: number;
  timeLimit: number;
  backgroundColor: string;
  gravity: number;
  blocks: Block[];
  enemies: Enemy[];
  items: ItemEntity[];
  playerSpawn: { x: number; y: number };
  player2Spawn: { x: number; y: number };
  flagpoleX?: number;
  bossArena?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  name: string;
  score: number;
  stageReached: number;
  timeSeconds: number;
  mode: PlayerMode;
  date: string;
  isNew?: boolean;
}

export interface KeyControls {
  // P1
  p1Left: boolean;
  p1Right: boolean;
  p1Up: boolean;
  p1Down: boolean;
  p1Jump: boolean;
  p1Attack: boolean;
  // P2
  p2Left: boolean;
  p2Right: boolean;
  p2Up: boolean;
  p2Down: boolean;
  p2Jump: boolean;
  p2Attack: boolean;
}
