// Handcrafted 10 Distinct Stages for Super Mario Action Web

import { StageData, Block, Enemy, ItemEntity, BlockType, EnemyType, ItemContentType } from '../types';

function createBlock(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  type: BlockType,
  content?: ItemContentType,
  props: Partial<Block> = {}
): Block {
  return {
    id,
    x,
    y,
    width: w,
    height: h,
    type,
    content,
    bumpOffset: 0,
    bumpVy: 0,
    ...props,
  };
}

function createEnemy(id: string, x: number, y: number, type: EnemyType, props: Partial<Enemy> = {}): Enemy {
  const isBowser = type === 'bowser';
  const isPlant = type === 'piranha_plant';
  const width = isBowser ? 64 : isPlant ? 24 : 24;
  const height = isBowser ? 64 : isPlant ? 32 : 24;
  return {
    id,
    x,
    y,
    vx: type === 'bullet_bill' ? -2.5 : -1,
    vy: 0,
    width,
    height,
    type,
    facing: 'left',
    isGrounded: false,
    isDead: false,
    deathTimer: 0,
    health: isBowser ? 20 : 1,
    maxHealth: isBowser ? 20 : 1,
    animTimer: 0,
    animFrame: 0,
    ...props,
  };
}

function createItem(id: string, x: number, y: number, type: ItemContentType): ItemEntity {
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    width: 20,
    height: 20,
    type,
    isGrounded: false,
    spawnTimer: 0,
  };
}

// Generate Stage 1: "Green Plains (1-1)"
function getStage1(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  // Ground segments with small pit gaps
  blocks.push(createBlock('g1', 0, 400, 720, 80, 'ground'));
  blocks.push(createBlock('g2', 780, 400, 750, 80, 'ground'));
  blocks.push(createBlock('g3', 1600, 400, 1000, 80, 'ground'));

  // Question blocks & Bricks row 1 (Intro to items)
  blocks.push(createBlock('q1', 200, 290, 24, 24, 'question', 'coin'));
  blocks.push(createBlock('b1', 260, 290, 24, 24, 'brick'));
  blocks.push(createBlock('q2', 284, 290, 24, 24, 'question', 'super_mushroom'));
  blocks.push(createBlock('b2', 308, 290, 24, 24, 'brick'));
  blocks.push(createBlock('q3', 332, 290, 24, 24, 'question', 'coin'));

  // Green Pipe 1 (Accessible Low height - 32px)
  blocks.push(createBlock('p1_tl', 440, 368, 20, 16, 'pipe_top_left'));
  blocks.push(createBlock('p1_tr', 460, 368, 20, 16, 'pipe_top_right'));
  blocks.push(createBlock('p1_bl', 440, 384, 20, 16, 'pipe_body_left'));
  blocks.push(createBlock('p1_br', 460, 384, 20, 16, 'pipe_body_right'));

  // Green Pipe 2 (Standard height - 48px)
  blocks.push(createBlock('p2_tl', 580, 352, 20, 16, 'pipe_top_left'));
  blocks.push(createBlock('p2_tr', 600, 352, 20, 16, 'pipe_top_right'));
  blocks.push(createBlock('p2_bl', 580, 368, 20, 32, 'pipe_body_left'));
  blocks.push(createBlock('p2_br', 600, 368, 20, 32, 'pipe_body_right'));

  // Question block with Fire Flower
  blocks.push(createBlock('q_fire1', 660, 280, 24, 24, 'question', 'fire_flower'));

  // Green Pipe 3 across the pit (Accessible Medium height - 52px)
  blocks.push(createBlock('p3_tl', 840, 348, 20, 16, 'pipe_top_left'));
  blocks.push(createBlock('p3_tr', 860, 348, 20, 16, 'pipe_top_right'));
  blocks.push(createBlock('p3_bl', 840, 364, 20, 36, 'pipe_body_left'));
  blocks.push(createBlock('p3_br', 860, 364, 20, 36, 'pipe_body_right'));

  // Mid-stage brick bridge with star power
  blocks.push(createBlock('b_m1', 980, 280, 24, 24, 'brick'));
  blocks.push(createBlock('q_star', 1004, 280, 24, 24, 'question', 'starman'));
  blocks.push(createBlock('b_m2', 1028, 280, 24, 24, 'brick'));
  blocks.push(createBlock('q_fire2', 1052, 280, 24, 24, 'question', 'fire_flower'));
  blocks.push(createBlock('b_m3', 1076, 280, 24, 24, 'brick'));

  // Stepped Brick Stairs (Gentle 24px step increments)
  blocks.push(createBlock('b_pyr_s0', 1176, 376, 24, 24, 'hard_block'));
  blocks.push(createBlock('b_pyr_s1', 1200, 352, 24, 24, 'hard_block'));
  for (let bx = 0; bx < 4; bx++) {
    blocks.push(createBlock(`b_pyr_${bx}`, 1224 + bx * 24, 328, 24, 24, 'brick', bx === 1 ? 'propeller_mushroom' : 'coin'));
  }
  blocks.push(createBlock('b_pyr_s2', 1320, 352, 24, 24, 'hard_block'));
  blocks.push(createBlock('b_pyr_s3', 1344, 376, 24, 24, 'hard_block'));

  // Elevated floating bricks over second pit
  blocks.push(createBlock('b_float1', 1520, 330, 24, 24, 'brick'));
  blocks.push(createBlock('b_float2', 1544, 330, 24, 24, 'brick', 'coin'));
  blocks.push(createBlock('b_float3', 1568, 330, 24, 24, 'brick'));

  // High Air Brick Runway
  for (let bx = 0; bx < 4; bx++) {
    blocks.push(createBlock(`b_air_${bx}`, 1820 + bx * 24, 280, 24, 24, 'brick', bx === 1 ? 'coin' : undefined));
  }

  // Pipe with Piranha Plant (Accessible height - 48px)
  blocks.push(createBlock('p4_tl', 1740, 352, 20, 16, 'pipe_top_left'));
  blocks.push(createBlock('p4_tr', 1760, 352, 20, 16, 'pipe_top_right'));
  blocks.push(createBlock('p4_bl', 1740, 368, 20, 32, 'pipe_body_left'));
  blocks.push(createBlock('p4_br', 1760, 368, 20, 32, 'pipe_body_right'));
  enemies.push(createEnemy('pir1', 1748, 322, 'piranha_plant', { pipeTopY: 322, pipeBaseY: 356 }));

  // Classic Stepped Flag Staircase (Smooth 24px increments)
  const stairX = 2050;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= i; j++) {
      blocks.push(createBlock(`st_${i}_${j}`, stairX + i * 24, 400 - (j + 1) * 24, 24, 24, 'hard_block'));
    }
  }

  // Flagpole
  blocks.push(createBlock('flag_pole', 2320, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2320, 140, 24, 20, 'flag_top'));

  // Enemies: Goombas and Green & Red Koopas
  enemies.push(createEnemy('g1', 320, 376, 'goomba'));
  enemies.push(createEnemy('g2', 510, 376, 'goomba'));
  enemies.push(createEnemy('k1', 720, 376, 'koopa_green'));
  enemies.push(createEnemy('g3', 920, 376, 'goomba'));
  enemies.push(createEnemy('g4', 960, 376, 'goomba'));
  enemies.push(createEnemy('k2', 1140, 376, 'koopa_red'));
  enemies.push(createEnemy('g5', 1300, 376, 'goomba'));
  enemies.push(createEnemy('k3', 1650, 376, 'koopa_green'));
  enemies.push(createEnemy('k4', 1880, 376, 'koopa_red'));

  return {
    id: 1,
    title: 'Stage 1: Green Plains',
    subtitle: '초원 지대: 반응형 점프 & 슈퍼 버섯 / 파이어 플라워',
    theme: 'grassland',
    width: 2500,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#5c94fc',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2320,
  };
}

// Stage 2: Underground Caverns (1-2)
function getStage2(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  // Solid Ceiling
  blocks.push(createBlock('ceil', 0, 0, 2600, 36, 'brick'));

  // Cavern Floor with multiple bottomless chasms
  blocks.push(createBlock('g1', 0, 400, 680, 80, 'brick'));
  blocks.push(createBlock('g2', 760, 400, 600, 80, 'brick'));
  blocks.push(createBlock('g3', 1440, 400, 480, 80, 'brick'));
  blocks.push(createBlock('g4', 1980, 400, 600, 80, 'brick'));

  // Question blocks with Fire Flower & Super Mushroom
  blocks.push(createBlock('q1', 180, 280, 24, 24, 'question', 'super_mushroom'));
  blocks.push(createBlock('b1', 220, 280, 24, 24, 'brick'));
  blocks.push(createBlock('q2', 244, 280, 24, 24, 'question', 'fire_flower'));
  blocks.push(createBlock('b2', 268, 280, 24, 24, 'brick', 'coin'));
  blocks.push(createBlock('b3', 292, 280, 24, 24, 'brick'));

  // Pipe with Piranha Plant in cavern
  blocks.push(createBlock('p1_tl', 460, 340, 20, 20, 'pipe_top_left'));
  blocks.push(createBlock('p1_tr', 480, 340, 20, 20, 'pipe_top_right'));
  blocks.push(createBlock('p1_bl', 460, 360, 20, 40, 'pipe_body_left'));
  blocks.push(createBlock('p1_br', 480, 360, 20, 40, 'pipe_body_right'));
  enemies.push(createEnemy('pir1', 468, 310, 'piranha_plant', { pipeTopY: 310, pipeBaseY: 344 }));

  // Bouncing Note Block across the first gap
  blocks.push(createBlock('note1', 710, 330, 24, 24, 'note_block'));

  // Moving cavern platform across second pit
  blocks.push(
    createBlock('mov_cav1', 1340, 310, 70, 16, 'moving_platform', undefined, {
      vx: 1.4,
      minX: 1300,
      maxX: 1420,
    })
  );

  // High brick highway with coin clusters and 1-Up
  for (let i = 0; i < 16; i++) {
    blocks.push(
      createBlock(
        `high_${i}`,
        960 + i * 24,
        220,
        24,
        24,
        'brick',
        i === 4 ? 'coin' : i === 8 ? '1up_mushroom' : i === 12 ? 'fire_flower' : undefined
      )
    );
  }

  // Floating stepping stones over wide second gap
  blocks.push(createBlock('step1', 1375, 340, 40, 20, 'hard_block'));
  blocks.push(createBlock('step2', 1935, 320, 40, 20, 'hard_block'));

  // Question block with Starman before exit
  blocks.push(createBlock('q_exit_star', 1600, 260, 24, 24, 'question', 'starman'));

  // Intermediate Spikes Hazard
  blocks.push(createBlock('spikes_cav', 1700, 450, 140, 30, 'spikes'));

  // Pipe at the end
  blocks.push(createBlock('p2_tl', 2040, 320, 20, 20, 'pipe_top_left'));
  blocks.push(createBlock('p2_tr', 2060, 320, 20, 20, 'pipe_top_right'));
  blocks.push(createBlock('p2_bl', 2040, 340, 20, 60, 'pipe_body_left'));
  blocks.push(createBlock('p2_br', 2060, 340, 20, 60, 'pipe_body_right'));
  enemies.push(createEnemy('pir2', 2048, 290, 'piranha_plant', { pipeTopY: 290, pipeBaseY: 324 }));

  // Flagpole
  blocks.push(createBlock('flag_pole', 2400, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2400, 140, 24, 20, 'flag_top'));

  // Enemies: Goombas and patrolling Koopas
  enemies.push(createEnemy('g1', 340, 376, 'goomba'));
  enemies.push(createEnemy('k1', 540, 376, 'koopa_green'));
  enemies.push(createEnemy('k2', 820, 376, 'koopa_red'));
  enemies.push(createEnemy('g2', 900, 376, 'goomba'));
  enemies.push(createEnemy('g3', 1040, 196, 'goomba')); // on upper bridge
  enemies.push(createEnemy('k3', 1180, 196, 'koopa_red')); // on upper bridge
  enemies.push(createEnemy('g4', 1500, 376, 'goomba'));
  enemies.push(createEnemy('k4', 1680, 376, 'koopa_green'));
  enemies.push(createEnemy('k5', 2160, 376, 'koopa_red'));

  return {
    id: 2,
    title: 'Stage 2: Underground Cavern',
    subtitle: '지하 동굴: 파이어 플라워 & 껍질 콤보 킥',
    theme: 'underground',
    width: 2550,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#000000',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2400,
  };
}

// Stage 3: Mushroom Peaks (1-3)
function getStage3(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  // Start Platform
  blocks.push(createBlock('g1', 0, 400, 320, 80, 'ground'));

  // Giant Mushroom Stalk 1 & Cap
  blocks.push(createBlock('m1_top', 380, 300, 160, 24, 'hard_block'));
  blocks.push(createBlock('m1_stalk', 448, 324, 24, 160, 'pipe_body_left'));

  // Moving Platform 1 (Horizontal patrol)
  blocks.push(
    createBlock('mov1', 580, 280, 80, 16, 'moving_platform', undefined, {
      vx: 1.5,
      minX: 520,
      maxX: 800,
    })
  );

  // Giant Mushroom Stalk 2 & Cap with Question blocks
  blocks.push(createBlock('m2_top', 880, 240, 200, 24, 'hard_block'));
  blocks.push(createBlock('m2_stalk', 968, 264, 24, 220, 'pipe_body_left'));
  blocks.push(createBlock('q1', 920, 160, 24, 24, 'question', 'super_mushroom'));
  blocks.push(createBlock('q2', 960, 160, 24, 24, 'question', 'fire_flower'));
  blocks.push(createBlock('q3', 1000, 160, 24, 24, 'question', 'starman'));

  // Moving Platform 2 (Vertical elevator)
  blocks.push(
    createBlock('mov2', 1160, 260, 80, 16, 'moving_platform', undefined, {
      vy: 1.4,
      minY: 160,
      maxY: 340,
    })
  );

  // Giant Mushroom Stalk 3 & Cap
  blocks.push(createBlock('m3_top', 1320, 260, 180, 24, 'hard_block'));
  blocks.push(createBlock('m3_stalk', 1400, 284, 24, 200, 'pipe_body_left'));

  // High Cloud Platform & Bridge step
  blocks.push(createBlock('cloud1', 1540, 200, 90, 20, 'cloud_platform'));
  blocks.push(createBlock('cloud_step', 1650, 290, 70, 20, 'cloud_platform'));
  blocks.push(createBlock('q_cloud_fire', 1580, 120, 24, 24, 'question', 'fire_flower'));

  // Final Island with Flagpole
  blocks.push(createBlock('g_end', 1740, 400, 700, 80, 'ground'));

  // Staircase to Flag
  const stairX = 1950;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j <= i; j++) {
      blocks.push(createBlock(`st_${i}_${j}`, stairX + i * 24, 400 - (j + 1) * 24, 24, 24, 'hard_block'));
    }
  }

  // Flagpole
  blocks.push(createBlock('flag_pole', 2250, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2250, 140, 24, 20, 'flag_top'));

  // Enemies: Goombas and Red/Green Koopas
  enemies.push(createEnemy('g1', 200, 376, 'goomba'));
  enemies.push(createEnemy('k1', 420, 276, 'koopa_red')); // Patrolling Mushroom 1
  enemies.push(createEnemy('g2', 920, 216, 'goomba')); // Mushroom 2
  enemies.push(createEnemy('k2', 1020, 216, 'koopa_green')); // Mushroom 2
  enemies.push(createEnemy('k3', 1380, 236, 'koopa_red')); // Mushroom 3
  enemies.push(createEnemy('g3', 1800, 376, 'goomba'));
  enemies.push(createEnemy('g4', 1840, 376, 'goomba'));
  enemies.push(createEnemy('k4', 1900, 376, 'koopa_green'));

  return {
    id: 3,
    title: 'Stage 3: Mushroom Peaks',
    subtitle: '버섯 고원: 고공 절벽 점프 & 무빙 발판',
    theme: 'grassland',
    width: 2450,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#5c94fc',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2250,
  };
}

// Stage 4: Propeller Skyway (2-1)
function getStage4(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  blocks.push(createBlock('g1', 0, 400, 350, 80, 'cloud_platform'));

  // Question block with Propeller Mushroom & Spiny Helmet & Fire Flower
  blocks.push(createBlock('q_prop', 180, 280, 24, 24, 'question', 'propeller_mushroom'));
  blocks.push(createBlock('q_fire4', 220, 280, 24, 24, 'question', 'fire_flower'));
  blocks.push(createBlock('q_spiny', 260, 280, 24, 24, 'question', 'spiny_shell'));

  // High clouds requiring propeller lift
  blocks.push(createBlock('c1', 450, 240, 100, 20, 'cloud_platform'));
  blocks.push(createBlock('c2', 650, 140, 120, 20, 'cloud_platform'));
  blocks.push(createBlock('q_high', 700, 60, 24, 24, 'question', '1up_mushroom'));

  // Moving cloud elevator
  blocks.push(
    createBlock('mov_c1', 780, 200, 70, 16, 'moving_platform', undefined, {
      vy: 1.6,
      minY: 120,
      maxY: 300,
    })
  );

  // High hard brick ceiling that can be smashed with Spiny Helmet
  blocks.push(createBlock('hb1', 880, 160, 24, 24, 'brick'));
  blocks.push(createBlock('hb2', 904, 160, 24, 24, 'brick'));
  blocks.push(createBlock('hb3', 928, 160, 24, 24, 'brick'));

  blocks.push(createBlock('c3', 1050, 260, 140, 20, 'cloud_platform'));
  blocks.push(createBlock('c4', 1300, 180, 140, 20, 'cloud_platform'));

  // Note block jump & Bullet Bills
  blocks.push(createBlock('note1', 1550, 320, 24, 24, 'note_block'));
  blocks.push(createBlock('c_end', 1700, 400, 700, 80, 'cloud_platform'));

  // Flagpole
  blocks.push(createBlock('flag_pole', 2250, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2250, 140, 24, 20, 'flag_top'));

  enemies.push(createEnemy('bb_sky1', 400, 160, 'bullet_bill'));
  enemies.push(createEnemy('sp1', 500, 216, 'spiny'));
  enemies.push(createEnemy('bb_sky2', 880, 220, 'bullet_bill'));
  enemies.push(createEnemy('k1', 1100, 236, 'koopa_red'));
  enemies.push(createEnemy('sp2', 1350, 156, 'spiny'));
  enemies.push(createEnemy('bb_sky3', 1600, 180, 'bullet_bill'));

  return {
    id: 4,
    title: 'Stage 4: Propeller Skyway',
    subtitle: '프로펠러 버섯 활공 & 찌르기 헬멧',
    theme: 'sky',
    width: 2400,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#3bb9ff',
    gravity: 0.42,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2250,
  };
}

// Stage 5: Yoshi's Forest Valley (2-2)
function getStage5(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  blocks.push(createBlock('g1', 0, 400, 400, 80, 'ground'));

  // Yoshi Egg block!
  blocks.push(createBlock('q_yoshi', 180, 280, 24, 24, 'question', 'yoshi_egg'));
  blocks.push(createBlock('b1', 240, 280, 24, 24, 'brick', 'coin'));

  // Wide spike pits requiring Yoshi Flutter Jump (with fair stepping stones)
  blocks.push(createBlock('spikes1', 400, 450, 240, 30, 'spikes'));
  blocks.push(createBlock('step_sp1_a', 440, 360, 36, 20, 'hard_block'));
  blocks.push(createBlock('p1_tl', 520, 340, 20, 20, 'pipe_top_left'));
  blocks.push(createBlock('p1_tr', 540, 340, 20, 20, 'pipe_top_right'));
  blocks.push(createBlock('p1_bl', 520, 360, 20, 40, 'pipe_body_left'));
  blocks.push(createBlock('p1_br', 540, 360, 20, 40, 'pipe_body_right'));
  enemies.push(createEnemy('pir_y1', 528, 308, 'piranha_plant', { pipeTopY: 308, pipeBaseY: 344 }));
  blocks.push(createBlock('step_sp1_b', 600, 360, 36, 20, 'hard_block'));

  blocks.push(createBlock('g2', 640, 400, 350, 80, 'ground'));
  blocks.push(createBlock('q2', 750, 280, 24, 24, 'question', 'super_mushroom'));
  blocks.push(createBlock('q_fire5', 800, 280, 24, 24, 'question', 'fire_flower'));

  blocks.push(createBlock('spikes2', 990, 450, 300, 30, 'spikes'));
  blocks.push(createBlock('step_sp2_a', 1030, 360, 40, 20, 'hard_block'));
  blocks.push(createBlock('p2_tl', 1120, 340, 20, 20, 'pipe_top_left'));
  blocks.push(createBlock('p2_tr', 1140, 340, 20, 20, 'pipe_top_right'));
  blocks.push(createBlock('p2_bl', 1120, 360, 20, 40, 'pipe_body_left'));
  blocks.push(createBlock('p2_br', 1140, 360, 20, 40, 'pipe_body_right'));
  enemies.push(createEnemy('pir_y2', 1128, 308, 'piranha_plant', { pipeTopY: 308, pipeBaseY: 344 }));
  blocks.push(createBlock('step_sp2_b', 1220, 360, 40, 20, 'hard_block'));

  blocks.push(createBlock('g3', 1290, 400, 1100, 80, 'ground'));

  // Flagpole
  blocks.push(createBlock('flag_pole', 2250, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2250, 140, 24, 20, 'flag_top'));

  // Many delicious enemies for Yoshi to eat!
  enemies.push(createEnemy('g1', 300, 376, 'goomba'));
  enemies.push(createEnemy('k1', 700, 376, 'koopa_green'));
  enemies.push(createEnemy('g2', 800, 376, 'goomba'));
  enemies.push(createEnemy('bb_yoshi', 1100, 200, 'bullet_bill'));
  enemies.push(createEnemy('k2', 1400, 376, 'koopa_red'));
  enemies.push(createEnemy('sp_y1', 1480, 376, 'spiny'));
  enemies.push(createEnemy('g3', 1580, 376, 'goomba'));
  enemies.push(createEnemy('k3', 1700, 376, 'koopa_green'));

  return {
    id: 5,
    title: "Stage 5: Yoshi's Forest Valley",
    subtitle: '요시 탑승: 혓바닥 삼키기 & 플러터 2단 점프',
    theme: 'grassland',
    width: 2400,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#4c905c',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2250,
  };
}

// Stage 6: Acorn Canyon & Flying Glides (2-3)
function getStage6(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  blocks.push(createBlock('g1', 0, 400, 300, 80, 'hard_block'));

  // Super Acorn Suit & Fire Flower Block
  blocks.push(createBlock('q_acorn', 160, 280, 24, 24, 'question', 'super_acorn'));
  blocks.push(createBlock('q_fire6', 220, 280, 24, 24, 'question', 'fire_flower'));

  // Massive canyon gaps requiring gliding (with stepping cloud platforms)
  blocks.push(createBlock('c_step0', 390, 340, 60, 20, 'cloud_platform'));
  blocks.push(createBlock('c1', 500, 280, 80, 20, 'cloud_platform'));
  blocks.push(createBlock('c_step1', 670, 260, 60, 20, 'cloud_platform'));
  blocks.push(createBlock('c2', 850, 240, 80, 20, 'cloud_platform'));
  blocks.push(createBlock('q_high', 880, 140, 24, 24, 'question', '1up_mushroom'));

  blocks.push(createBlock('c_step2', 1030, 250, 60, 20, 'cloud_platform'));
  blocks.push(createBlock('c3', 1200, 260, 80, 20, 'cloud_platform'));
  blocks.push(createBlock('c_step3', 1380, 240, 60, 20, 'cloud_platform'));
  blocks.push(createBlock('c4', 1550, 220, 80, 20, 'cloud_platform'));
  blocks.push(createBlock('c_step4', 1690, 310, 60, 20, 'cloud_platform'));

  blocks.push(createBlock('g_end', 1800, 400, 600, 80, 'hard_block'));

  // Flagpole
  blocks.push(createBlock('flag_pole', 2250, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2250, 140, 24, 20, 'flag_top'));

  // Flying enemies
  enemies.push(createEnemy('bb1', 700, 200, 'bullet_bill'));
  enemies.push(createEnemy('k1', 1220, 236, 'koopa_red'));
  enemies.push(createEnemy('bb2', 1400, 180, 'bullet_bill'));

  return {
    id: 6,
    title: 'Stage 6: Acorn Canyon',
    subtitle: '날다람쥐 도토리 슈트: 공중 활공 & 에어 팝 점프',
    theme: 'canyon',
    width: 2400,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#b87333',
    gravity: 0.44,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2250,
  };
}

// Stage 7: Spiny Mountain Fortress (3-1)
function getStage7(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  blocks.push(createBlock('g1', 0, 400, 400, 80, 'hard_block'));
  blocks.push(createBlock('q_spiny', 160, 280, 24, 24, 'question', 'spiny_shell'));
  blocks.push(createBlock('q_fire', 220, 280, 24, 24, 'question', 'fire_flower'));

  // Fortress towers with Hammer Bros (with accessible climbing steps)
  blocks.push(createBlock('t1_step', 460, 360, 40, 40, 'brick'));
  blocks.push(createBlock('t1', 500, 320, 120, 160, 'brick'));
  enemies.push(createEnemy('hb1', 540, 280, 'hammer_bro'));

  blocks.push(createBlock('spikes1', 620, 450, 200, 30, 'spikes'));
  blocks.push(createBlock('bridge_ledge', 700, 320, 60, 20, 'hard_block'));

  blocks.push(createBlock('t2_step', 780, 320, 40, 80, 'brick'));
  blocks.push(createBlock('t2', 820, 260, 140, 220, 'brick'));
  enemies.push(createEnemy('hb2', 860, 220, 'hammer_bro'));

  blocks.push(createBlock('t3_step', 1110, 340, 40, 60, 'brick'));
  blocks.push(createBlock('t3', 1150, 300, 140, 180, 'brick'));
  enemies.push(createEnemy('sp1', 1180, 276, 'spiny'));

  blocks.push(createBlock('g_end', 1400, 400, 1000, 80, 'hard_block'));

  // Flagpole
  blocks.push(createBlock('flag_pole', 2250, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 2250, 140, 24, 20, 'flag_top'));

  enemies.push(createEnemy('sp2', 1500, 376, 'spiny'));
  enemies.push(createEnemy('hb3', 1750, 350, 'hammer_bro'));

  return {
    id: 7,
    title: 'Stage 7: Spiny Fortress',
    subtitle: '요새 공방전: 해머브러스 & 가시돌이 방어',
    theme: 'mountain',
    width: 2400,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#303848',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 2250,
  };
}

// Stage 8: Dark Land Lava Fortress (3-2 / World 8-1)
function getStage8(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  // 1. Entry Fortress Platform
  blocks.push(createBlock('g1', 0, 400, 360, 80, 'hard_block'));
  blocks.push(createBlock('q_drybones', 140, 280, 24, 24, 'question', 'dry_bones_shell'));
  blocks.push(createBlock('q_fire', 200, 280, 24, 24, 'question', 'fire_flower'));
  blocks.push(createBlock('b1', 260, 280, 24, 24, 'brick', 'coin'));
  enemies.push(createEnemy('db_entry', 300, 376, 'dry_bones'));

  // 2. The Molten Lava Sea & Moving Ferries
  blocks.push(createBlock('lava1', 360, 420, 900, 60, 'lava'));

  // Stepping Basalt Rocks & High-Speed Moving Platforms
  blocks.push(createBlock('rock1', 440, 360, 50, 30, 'hard_block'));
  blocks.push(
    createBlock('mov_lava1', 530, 340, 65, 16, 'moving_platform', undefined, {
      vx: 2.0,
      minX: 500,
      maxX: 660,
    })
  );
  blocks.push(createBlock('isl1', 680, 340, 90, 40, 'hard_block'));
  enemies.push(createEnemy('db1', 720, 316, 'dry_bones'));

  blocks.push(
    createBlock('mov_lava2', 810, 320, 65, 16, 'moving_platform', undefined, {
      vy: 1.8,
      minY: 220,
      maxY: 380,
    })
  );
  blocks.push(createBlock('isl2', 920, 330, 90, 40, 'hard_block'));
  blocks.push(createBlock('q_star8', 950, 230, 24, 24, 'question', 'starman'));
  enemies.push(createEnemy('sp1', 940, 306, 'spiny'));

  blocks.push(
    createBlock('mov_lava3', 1050, 330, 65, 16, 'moving_platform', undefined, {
      vx: 2.2,
      minX: 1020,
      maxX: 1200,
    })
  );

  // 3. Central Fortress Junction (Dual Route: Upper Parapet vs Lower Spike Hazard)
  blocks.push(createBlock('g_mid', 1260, 390, 320, 90, 'hard_block'));
  enemies.push(createEnemy('db2', 1320, 366, 'dry_bones'));
  enemies.push(createEnemy('k_red8', 1450, 366, 'koopa_red'));

  // High Upper Battlement Route (Hammer Bros & 1-Up)
  blocks.push(createBlock('t_up1', 1300, 240, 160, 24, 'brick'));
  blocks.push(createBlock('q_up_1up', 1360, 150, 24, 24, 'question', '1up_mushroom'));
  enemies.push(createEnemy('hb_up1', 1400, 196, 'hammer_bro'));

  // Lower Spike Hazard Pit
  blocks.push(createBlock('spikes_pit', 1580, 450, 420, 30, 'spikes'));
  blocks.push(createBlock('step_spk1', 1640, 350, 50, 20, 'hard_block'));
  blocks.push(createBlock('note_spk', 1740, 320, 24, 24, 'note_block'));
  blocks.push(createBlock('step_spk2', 1830, 330, 50, 20, 'hard_block'));
  blocks.push(createBlock('q_fire_mid', 1840, 230, 24, 24, 'question', 'fire_flower'));

  // High Upper Bridge continuing
  blocks.push(createBlock('t_up2', 1620, 210, 140, 24, 'brick'));
  enemies.push(createEnemy('hb_up2', 1680, 166, 'hammer_bro'));

  // 4. Bullet Bill Artillery & Piranha Fortress
  blocks.push(createBlock('g_artillery', 2000, 390, 700, 90, 'hard_block'));

  // Multi-tier Pipes with Piranha Plants
  blocks.push(createBlock('p8_1_tl', 2120, 334, 20, 16, 'pipe_top_left'));
  blocks.push(createBlock('p8_1_tr', 2140, 334, 20, 16, 'pipe_top_right'));
  blocks.push(createBlock('p8_1_bl', 2120, 350, 20, 40, 'pipe_body_left'));
  blocks.push(createBlock('p8_1_br', 2140, 350, 20, 40, 'pipe_body_right'));
  enemies.push(createEnemy('pir8_1', 2128, 304, 'piranha_plant', { pipeTopY: 304, pipeBaseY: 338 }));

  blocks.push(createBlock('p8_2_tl', 2300, 314, 20, 16, 'pipe_top_left'));
  blocks.push(createBlock('p8_2_tr', 2320, 314, 20, 16, 'pipe_top_right'));
  blocks.push(createBlock('p8_2_bl', 2300, 330, 20, 60, 'pipe_body_left'));
  blocks.push(createBlock('p8_2_br', 2320, 330, 20, 60, 'pipe_body_right'));
  enemies.push(createEnemy('pir8_2', 2308, 284, 'piranha_plant', { pipeTopY: 284, pipeBaseY: 318 }));

  // Flying Bullet Bill Salvos
  enemies.push(createEnemy('bb8_1', 1100, 180, 'bullet_bill'));
  enemies.push(createEnemy('bb8_2', 1500, 260, 'bullet_bill'));
  enemies.push(createEnemy('bb8_3', 1900, 160, 'bullet_bill'));
  enemies.push(createEnemy('bb8_4', 2200, 240, 'bullet_bill'));
  enemies.push(createEnemy('bb8_5', 2450, 170, 'bullet_bill'));
  enemies.push(createEnemy('db_last1', 2400, 366, 'dry_bones'));
  enemies.push(createEnemy('db_last2', 2550, 366, 'dry_bones'));

  // 5. Grand Fortress Gate & Staircase
  blocks.push(createBlock('g_end', 2700, 400, 600, 80, 'hard_block'));
  const stairX = 2780;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= i; j++) {
      blocks.push(createBlock(`st8_${i}_${j}`, stairX + i * 24, 400 - (j + 1) * 24, 24, 24, 'hard_block'));
    }
  }

  // Flagpole
  blocks.push(createBlock('flag_pole', 3050, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 3050, 140, 24, 20, 'flag_top'));

  return {
    id: 8,
    title: 'Stage 8: Dark Land Lava Fortress',
    subtitle: '다크랜드 용암 요새: 2단 루트 & 해머브러스 방어선',
    theme: 'lava',
    width: 3200,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#2e0a0a',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 3050,
  };
}

// Stage 9: Bowser's Doom Airship Armada (3-3 / World 8-2)
function getStage9(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  // 1. Infiltration Airship Deck
  blocks.push(createBlock('g1', 0, 400, 320, 80, 'hard_block'));
  blocks.push(createBlock('q_car', 120, 280, 24, 24, 'question', 'clown_car'));
  blocks.push(createBlock('q_acorn9', 180, 280, 24, 24, 'question', 'super_acorn'));
  blocks.push(createBlock('q_prop9', 240, 280, 24, 24, 'question', 'propeller_mushroom'));

  // Stormy Chasm Below
  blocks.push(createBlock('lava1', 320, 440, 2600, 40, 'lava'));

  // 2. Airship Armada Masts & Sky Fortresses
  // Airship 1 Mast & Hull
  blocks.push(createBlock('mast1', 480, 220, 120, 24, 'brick'));
  blocks.push(createBlock('hull1', 420, 360, 220, 30, 'hard_block'));
  enemies.push(createEnemy('k_ship1', 520, 336, 'koopa_red'));

  // Rotating & Moving Propeller Platforms
  blocks.push(
    createBlock('mov_ship1', 680, 280, 70, 16, 'moving_platform', undefined, {
      vx: 2.2,
      minX: 660,
      maxX: 820,
    })
  );

  // Airship 2 Dual Deck (Cannon Battery)
  blocks.push(createBlock('hull2_low', 860, 350, 260, 30, 'hard_block'));
  blocks.push(createBlock('hull2_high', 900, 220, 180, 24, 'brick'));
  blocks.push(createBlock('q_star9', 980, 140, 24, 24, 'question', 'starman'));
  enemies.push(createEnemy('hb_ship1', 940, 176, 'hammer_bro'));
  enemies.push(createEnemy('sp_ship1', 980, 326, 'spiny'));

  // Airborne Obstacle Barriers for Clown Car Shooting
  blocks.push(createBlock('obs1_t', 1200, 60, 36, 150, 'brick'));
  blocks.push(createBlock('obs1_b', 1200, 270, 36, 150, 'brick'));
  blocks.push(createBlock('obs_mid_q', 1200, 220, 36, 24, 'question', '1up_mushroom'));

  // Airship 3 Central Heavy Cruiser
  blocks.push(createBlock('hull3', 1340, 340, 320, 30, 'hard_block'));
  blocks.push(createBlock('m3_l', 1380, 200, 100, 20, 'brick'));
  blocks.push(createBlock('m3_r', 1520, 160, 100, 20, 'brick'));
  enemies.push(createEnemy('hb_ship2', 1420, 156, 'hammer_bro'));
  enemies.push(createEnemy('k_ship2', 1480, 316, 'koopa_red'));

  // Vertical Moving Elevators over abyss
  blocks.push(
    createBlock('mov_elev1', 1720, 260, 70, 16, 'moving_platform', undefined, {
      vy: 2.0,
      minY: 120,
      maxY: 360,
    })
  );

  // Airship 4 Escort Gunship
  blocks.push(createBlock('hull4', 1860, 330, 260, 30, 'hard_block'));
  blocks.push(createBlock('q_fire9', 1960, 230, 24, 24, 'question', 'fire_flower'));
  enemies.push(createEnemy('db_ship1', 1920, 306, 'dry_bones'));
  enemies.push(createEnemy('sp_ship2', 2040, 306, 'spiny'));

  // Second Sky Barrier Gate
  blocks.push(createBlock('obs2_t', 2200, 80, 36, 140, 'brick'));
  blocks.push(createBlock('obs2_b', 2200, 280, 36, 140, 'brick'));

  // Fast Cloud Stepping Run
  blocks.push(createBlock('c_step1', 2300, 320, 70, 20, 'cloud_platform'));
  blocks.push(createBlock('c_step2', 2420, 260, 70, 20, 'cloud_platform'));
  blocks.push(createBlock('c_step3', 2540, 200, 70, 20, 'cloud_platform'));
  blocks.push(createBlock('c_step4', 2660, 280, 70, 20, 'cloud_platform'));

  // Bullet Bill Barrage Armada (Continuous aerial crossfire)
  enemies.push(createEnemy('bb9_1', 600, 140, 'bullet_bill'));
  enemies.push(createEnemy('bb9_2', 750, 260, 'bullet_bill'));
  enemies.push(createEnemy('bb9_3', 1050, 100, 'bullet_bill'));
  enemies.push(createEnemy('bb9_4', 1150, 240, 'bullet_bill'));
  enemies.push(createEnemy('bb9_5', 1450, 120, 'bullet_bill'));
  enemies.push(createEnemy('bb9_6', 1650, 300, 'bullet_bill'));
  enemies.push(createEnemy('bb9_7', 1800, 160, 'bullet_bill'));
  enemies.push(createEnemy('bb9_8', 2100, 220, 'bullet_bill'));
  enemies.push(createEnemy('bb9_9', 2400, 130, 'bullet_bill'));
  enemies.push(createEnemy('bb9_10', 2600, 250, 'bullet_bill'));

  // 3. Flagship Main Deck & Castle Goal
  blocks.push(createBlock('g_end', 2800, 400, 650, 80, 'hard_block'));
  const stairX = 2920;
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= i; j++) {
      blocks.push(createBlock(`st9_${i}_${j}`, stairX + i * 24, 400 - (j + 1) * 24, 24, 24, 'hard_block'));
    }
  }

  // Flagpole
  blocks.push(createBlock('flag_pole', 3200, 160, 24, 240, 'flagpole'));
  blocks.push(createBlock('flag_top', 3200, 140, 24, 20, 'flag_top'));

  return {
    id: 9,
    title: "Stage 9: Bowser's Doom Airship Armada",
    subtitle: '쿠파 비행선 대함대: 클라운 카 공중전 & 탄막 포격',
    theme: 'boss_castle',
    width: 3500,
    height: 480,
    timeLimit: 300,
    backgroundColor: '#1b0c24',
    gravity: 0.43,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 350 },
    player2Spawn: { x: 90, y: 350 },
    flagpoleX: 3200,
  };
}

// Stage 10: Bowser's Infernal Castle & Final Showdown (4-Boss / World 8-Castle)
function getStage10(): StageData {
  const blocks: Block[] = [];
  const enemies: Enemy[] = [];
  const items: ItemEntity[] = [];

  // ==========================================
  // CHAMBER 1: The Molten Trap Gauntlet
  // ==========================================
  blocks.push(createBlock('g_start', 0, 390, 340, 90, 'hard_block'));

  // Super Armory for Final Battle
  blocks.push(createBlock('q_car10', 100, 270, 24, 24, 'question', 'clown_car'));
  blocks.push(createBlock('q_shroom10', 140, 270, 24, 24, 'question', 'super_mushroom'));
  blocks.push(createBlock('q_flower10', 180, 270, 24, 24, 'question', 'fire_flower'));
  blocks.push(createBlock('q_acorn10', 220, 270, 24, 24, 'question', 'super_acorn'));
  blocks.push(createBlock('q_star10', 260, 270, 24, 24, 'question', 'starman'));

  // Guarding Dry Bones & Spiny
  enemies.push(createEnemy('db_guard', 290, 366, 'dry_bones'));

  // Pre-Boss Trap Corridor with Upper Hammer Bro
  blocks.push(createBlock('trap_spikes1', 340, 450, 200, 30, 'spikes'));
  blocks.push(createBlock('trap_ledge1', 380, 320, 60, 20, 'hard_block'));
  blocks.push(createBlock('trap_ledge2', 480, 300, 60, 20, 'hard_block'));
  blocks.push(createBlock('t_hb_arch', 420, 180, 100, 20, 'brick'));
  enemies.push(createEnemy('hb_boss_guard', 460, 136, 'hammer_bro'));

  // Intermediate Safe Platform
  blocks.push(createBlock('g_arena_entry', 540, 390, 160, 90, 'hard_block'));
  blocks.push(createBlock('q_extra_fire', 600, 270, 24, 24, 'question', 'fire_flower'));

  // ==========================================
  // CHAMBER 2: The Colossal Lava Crucible & Drawbridge
  // ==========================================
  const bridgeStartX = 700;
  const bridgeEndX = 1660;

  // Giant Molten Lava Lake under Bowser
  blocks.push(createBlock('lava_pit', bridgeStartX, 430, bridgeEndX - bridgeStartX + 100, 50, 'lava'));

  // Chained Drawbridge (800px wide arena)
  for (let bx = bridgeStartX; bx < bridgeEndX; bx += 24) {
    blocks.push(createBlock(`bridge_${bx}`, bx, 390, 24, 16, 'bridge_chain'));
  }

  // Bowser - High Health, Multi-Phase Boss
  enemies.push(
    createEnemy('boss_bowser', 1280, 326, 'bowser', {
      facing: 'left',
      health: 30,
      maxHealth: 30,
      bossPhase: 1,
    })
  );

  // Victory Castle Axe Switch at the far right of the bridge
  blocks.push(createBlock('axe_switch', bridgeEndX + 20, 330, 32, 40, 'castle_axe'));

  // Princess Peach / Victory Throne Platform
  blocks.push(createBlock('g_end', bridgeEndX, 390, 450, 90, 'hard_block'));

  return {
    id: 10,
    title: "Stage 10: Bowser's Infernal Throne Keep",
    subtitle: '최종 결전: 대마왕 쿠파 3단계 격전 & 스위치 도끼 낙하',
    theme: 'boss_castle',
    width: 2150,
    height: 480,
    timeLimit: 400,
    backgroundColor: '#160004',
    gravity: 0.45,
    blocks,
    enemies,
    items,
    playerSpawn: { x: 50, y: 330 },
    player2Spawn: { x: 90, y: 330 },
    bossArena: true,
  };
}

export function getStageData(stageId: number): StageData {
  switch (stageId) {
    case 1:
      return getStage1();
    case 2:
      return getStage2();
    case 3:
      return getStage3();
    case 4:
      return getStage4();
    case 5:
      return getStage5();
    case 6:
      return getStage6();
    case 7:
      return getStage7();
    case 8:
      return getStage8();
    case 9:
      return getStage9();
    case 10:
    default:
      return getStage10();
  }
}
