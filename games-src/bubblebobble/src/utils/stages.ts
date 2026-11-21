import { StageConfig } from '../types';

export const STAGE_WIDTH = 28; // 28 tiles wide
export const STAGE_HEIGHT = 20; // 20 tiles high
export const TILE_SIZE = 20; // 20px per tile -> 560px x 400px Canvas

// Helper to generate empty grid with open ceiling and floor passages for vertical wrap-around
function createEmptyGrid(): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < STAGE_HEIGHT; r++) {
    const row: number[] = [];
    for (let c = 0; c < STAGE_WIDTH; c++) {
      // Left and right side outer boundary walls
      if (c === 0 || c === STAGE_WIDTH - 1) {
        row.push(1); // Solid Wall
      } else if (r === 0) {
        // Ceiling: Open gap in the center (c=10..17) for vertical wrap-around jumping/bubbles
        if (c >= 10 && c <= 17) {
          row.push(0); // Open Air Gap
        } else {
          row.push(1); // Solid Ceiling Brick
        }
      } else if (r === STAGE_HEIGHT - 1) {
        // Floor: Open gap in the center (c=10..17) for vertical drop-down wrap-around
        if (c >= 10 && c <= 17) {
          row.push(0); // Open Air Gap
        } else {
          row.push(1); // Solid Floor Brick
        }
      } else {
        row.push(0); // Air
      }
    }
    grid.push(row);
  }
  return grid;
}

// Stage 1: Sweet Candy Wonderland (User Image 2 style - Rainbow & Cake Palace)
function buildStage1(): StageConfig {
  const grid = createEmptyGrid();

  // Tier 1 (y = 5)
  for (let c = 4; c <= 23; c++) grid[5][c] = 2;

  // Tier 2 (y = 9) - split jump shelves
  for (let c = 4; c <= 11; c++) grid[9][c] = 2;
  for (let c = 16; c <= 23; c++) grid[9][c] = 2;

  // Tier 3 (y = 13)
  for (let c = 3; c <= 24; c++) grid[13][c] = 2;

  // Tier 4 (y = 16) - bottom platforms
  for (let c = 7; c <= 20; c++) grid[16][c] = 2;

  return {
    stageNumber: 1,
    name: 'Round 1: Sweet Candy Wonderland',
    theme: 'CANDY',
    bgColor: '#122240',
    brickColor: '#0088FF',
    brickAccent: '#FFD700',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'MONSTA', x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MONSTA', x: 20 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MONSTA', x: 7 * TILE_SIZE, y: 12 * TILE_SIZE },
      { type: 'MONSTA', x: 19 * TILE_SIZE, y: 12 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 60,
  };
}

// Stage 2: Ancient Sandstone Pyramid (User Image 1 style - Sphinx & Pyramid)
function buildStage2(): StageConfig {
  const grid = createEmptyGrid();

  // Pyramid stepped tiers
  for (let c = 5; c <= 22; c++) grid[15][c] = 2;
  for (let c = 7; c <= 20; c++) grid[12][c] = 2;
  for (let c = 9; c <= 18; c++) grid[9][c] = 2;
  for (let c = 11; c <= 16; c++) grid[6][c] = 2;

  // Left & right observation ledges
  for (let c = 2; c <= 5; c++) grid[10][c] = 2;
  for (let c = 22; c <= 25; c++) grid[10][c] = 2;

  return {
    stageNumber: 2,
    name: 'Round 2: Ancient Sandstone Pyramid',
    theme: 'PYRAMID',
    bgColor: '#331c0a',
    brickColor: '#FF69B4', // Pink & cream candy striped stone
    brickAccent: '#FFF0F5',
    grid,
    playerSpawns: {
      p1: { x: 3 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 24 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'ZEN_CHAN', x: 13 * TILE_SIZE, y: 5 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 10 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 17 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'MONSTA', x: 13 * TILE_SIZE, y: 14 * TILE_SIZE },
      { type: 'MONSTA', x: 3 * TILE_SIZE, y: 9 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 60,
  };
}

// Stage 3: Emerald Jungle Sanctuary
function buildStage3(): StageConfig {
  const grid = createEmptyGrid();

  // Canopy tree platforms
  for (let c = 2; c <= 10; c++) grid[5][c] = 2;
  for (let c = 17; c <= 25; c++) grid[5][c] = 2;

  for (let c = 8; c <= 19; c++) grid[8][c] = 2;

  for (let c = 2; c <= 9; c++) grid[12][c] = 2;
  for (let c = 18; c <= 25; c++) grid[12][c] = 2;

  for (let c = 6; c <= 21; c++) grid[15][c] = 2;

  return {
    stageNumber: 3,
    name: 'Round 3: Emerald Jungle Sanctuary',
    theme: 'JUNGLE',
    bgColor: '#061d10',
    brickColor: '#2E7D32',
    brickAccent: '#76FF03',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'ZEN_CHAN', x: 5 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 22 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MIGHTA', x: 13 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'MONSTA', x: 5 * TILE_SIZE, y: 11 * TILE_SIZE },
      { type: 'MONSTA', x: 22 * TILE_SIZE, y: 11 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 65,
  };
}

// Stage 4: Crystal Glacier Cavern
function buildStage4(): StageConfig {
  const grid = createEmptyGrid();

  // Ice stairs & jump balconies
  for (let c = 3; c <= 12; c++) grid[5][c] = 2;
  for (let c = 15; c <= 24; c++) grid[5][c] = 2;

  for (let c = 7; c <= 20; c++) grid[9][c] = 2;

  for (let c = 2; c <= 11; c++) grid[13][c] = 2;
  for (let c = 16; c <= 25; c++) grid[13][c] = 2;

  for (let c = 9; c <= 18; c++) grid[16][c] = 2;

  return {
    stageNumber: 4,
    name: 'Round 4: Crystal Glacier Cavern',
    theme: 'ICE',
    bgColor: '#08172c',
    brickColor: '#00B0FF',
    brickAccent: '#E0F7FA',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'MIGHTA', x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MIGHTA', x: 21 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 13 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'MONSTA', x: 6 * TILE_SIZE, y: 12 * TILE_SIZE },
      { type: 'MONSTA', x: 21 * TILE_SIZE, y: 12 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 13 * TILE_SIZE, y: 15 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 65,
  };
}

// Stage 5: Retro Neon Grid City
function buildStage5(): StageConfig {
  const grid = createEmptyGrid();

  // Heart / Cyber Matrix pattern
  const heartTiles = [
    [5, 8], [5, 9], [5, 10], [5, 17], [5, 18], [5, 19],
    [6, 6], [6, 7], [6, 11], [6, 12], [6, 15], [6, 16], [6, 20], [6, 21],
    [7, 5], [7, 22],
    [8, 4], [8, 23],
    [9, 4], [9, 23],
    [10, 5], [10, 22],
    [11, 6], [11, 21],
    [12, 7], [12, 20],
    [13, 8], [13, 19],
    [14, 9], [14, 18],
    [15, 10], [15, 17],
    [16, 12], [16, 13], [16, 14], [16, 15],
  ];

  heartTiles.forEach(([r, c]) => {
    if (r < STAGE_HEIGHT && c < STAGE_WIDTH) grid[r][c] = 2;
  });

  // Central platform
  for (let c = 10; c <= 17; c++) grid[10][c] = 2;

  return {
    stageNumber: 5,
    name: 'Round 5: Retro Neon Grid City',
    theme: 'NEON',
    bgColor: '#140624',
    brickColor: '#E91E63',
    brickAccent: '#00E5FF',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'MIGHTA', x: 8 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MIGHTA', x: 19 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 6 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 21 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'MONSTA', x: 13 * TILE_SIZE, y: 9 * TILE_SIZE },
      { type: 'MONSTA', x: 13 * TILE_SIZE, y: 14 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 70,
  };
}

// Stage 6: Burning Magma Volcano
function buildStage6(): StageConfig {
  const grid = createEmptyGrid();

  // Tiered magma chimneys
  for (let c = 4; c <= 10; c++) grid[5][c] = 2;
  for (let c = 17; c <= 23; c++) grid[5][c] = 2;

  for (let c = 8; c <= 19; c++) grid[8][c] = 2;

  for (let c = 3; c <= 11; c++) grid[12][c] = 2;
  for (let c = 16; c <= 24; c++) grid[12][c] = 2;

  for (let c = 6; c <= 21; c++) grid[15][c] = 2;

  return {
    stageNumber: 6,
    name: 'Round 6: Burning Magma Volcano',
    theme: 'VOLCANO',
    bgColor: '#200505',
    brickColor: '#C62828',
    brickAccent: '#FF9100',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'ZEN_CHAN', x: 6 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 21 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MIGHTA', x: 10 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'MIGHTA', x: 17 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 7 * TILE_SIZE, y: 11 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 20 * TILE_SIZE, y: 11 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 70,
  };
}

// Stage 7: Cosmic Nebula Galaxy
function buildStage7(): StageConfig {
  const grid = createEmptyGrid();

  // Planetary ring terraces
  for (let c = 5; c <= 22; c++) grid[4][c] = 2;
  for (let c = 2; c <= 8; c++) grid[8][c] = 2;
  for (let c = 19; c <= 25; c++) grid[8][c] = 2;

  for (let c = 7; c <= 20; c++) grid[11][c] = 2;

  for (let c = 3; c <= 10; c++) grid[14][c] = 2;
  for (let c = 17; c <= 24; c++) grid[14][c] = 2;

  for (let c = 9; c <= 18; c++) grid[16][c] = 2;

  return {
    stageNumber: 7,
    name: 'Round 7: Cosmic Nebula Galaxy',
    theme: 'COSMIC',
    bgColor: '#050218',
    brickColor: '#6A1B9A',
    brickAccent: '#EA80FC',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'MONSTA', x: 8 * TILE_SIZE, y: 3 * TILE_SIZE },
      { type: 'MONSTA', x: 19 * TILE_SIZE, y: 3 * TILE_SIZE },
      { type: 'MIGHTA', x: 5 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'MIGHTA', x: 22 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 13 * TILE_SIZE, y: 10 * TILE_SIZE },
      { type: 'MONSTA', x: 6 * TILE_SIZE, y: 13 * TILE_SIZE },
      { type: 'MONSTA', x: 21 * TILE_SIZE, y: 13 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 75,
  };
}

// Stage 8: Haunted Phantom Catacombs
function buildStage8(): StageConfig {
  const grid = createEmptyGrid();

  // Intricate double-helix crypt maze
  for (let c = 3; c <= 11; c++) grid[5][c] = 2;
  for (let c = 16; c <= 24; c++) grid[5][c] = 2;

  for (let c = 7; c <= 20; c++) grid[8][c] = 2;

  for (let c = 2; c <= 9; c++) grid[11][c] = 2;
  for (let c = 18; c <= 25; c++) grid[11][c] = 2;

  for (let c = 6; c <= 21; c++) grid[14][c] = 2;

  for (let c = 10; c <= 17; c++) grid[16][c] = 2;

  return {
    stageNumber: 8,
    name: 'Round 8: Haunted Phantom Catacombs',
    theme: 'HAUNTED',
    bgColor: '#0a0614',
    brickColor: '#283593',
    brickAccent: '#82B1FF',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'MIGHTA', x: 5 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MIGHTA', x: 22 * TILE_SIZE, y: 4 * TILE_SIZE },
      { type: 'MIGHTA', x: 13 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 5 * TILE_SIZE, y: 10 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 22 * TILE_SIZE, y: 10 * TILE_SIZE },
      { type: 'MONSTA', x: 10 * TILE_SIZE, y: 13 * TILE_SIZE },
      { type: 'MONSTA', x: 17 * TILE_SIZE, y: 13 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 75,
  };
}

// Stage 9: Royal Golden Treasure Vault
function buildStage9(): StageConfig {
  const grid = createEmptyGrid();

  // Grand vault platforms with dual escape ladders
  for (let c = 4; c <= 23; c++) grid[4][c] = 2;

  for (let c = 2; c <= 8; c++) grid[8][c] = 2;
  for (let c = 11; c <= 16; c++) grid[8][c] = 2;
  for (let c = 19; c <= 25; c++) grid[8][c] = 2;

  for (let c = 5; c <= 22; c++) grid[12][c] = 2;

  for (let c = 3; c <= 10; c++) grid[15][c] = 2;
  for (let c = 17; c <= 24; c++) grid[15][c] = 2;

  return {
    stageNumber: 9,
    name: 'Round 9: Royal Golden Treasure Vault',
    theme: 'VAULT',
    bgColor: '#201502',
    brickColor: '#FF8F00',
    brickAccent: '#FFF8E1',
    grid,
    playerSpawns: {
      p1: { x: 2 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 25 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'ZEN_CHAN', x: 6 * TILE_SIZE, y: 3 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 21 * TILE_SIZE, y: 3 * TILE_SIZE },
      { type: 'MIGHTA', x: 13 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 5 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 22 * TILE_SIZE, y: 7 * TILE_SIZE },
      { type: 'MONSTA', x: 8 * TILE_SIZE, y: 11 * TILE_SIZE },
      { type: 'MONSTA', x: 19 * TILE_SIZE, y: 11 * TILE_SIZE },
      { type: 'MIGHTA', x: 6 * TILE_SIZE, y: 14 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 80,
  };
}

// Stage 10: Final Boss Citadel (Baron von Blubba Grand Showdown!)
function buildStage10(): StageConfig {
  const grid = createEmptyGrid();

  // Tier 1: Boss Throne Altar (Solid center)
  for (let c = 9; c <= 18; c++) grid[5][c] = 1;

  // Tier 2: Side battle balconies
  for (let c = 2; c <= 8; c++) grid[9][c] = 2;
  for (let c = 19; c <= 25; c++) grid[9][c] = 2;

  // Tier 3: Mid arena platform
  for (let c = 6; c <= 21; c++) grid[13][c] = 2;

  // Tier 4: Lower escape ledges
  for (let c = 3; c <= 9; c++) grid[16][c] = 2;
  for (let c = 18; c <= 24; c++) grid[16][c] = 2;

  return {
    stageNumber: 10,
    name: 'Round 10: Final Boss Citadel',
    theme: 'BOSS',
    bgColor: '#120205',
    brickColor: '#311B92',
    brickAccent: '#FF1744',
    grid,
    playerSpawns: {
      p1: { x: 3 * TILE_SIZE, y: 17 * TILE_SIZE },
      p2: { x: 24 * TILE_SIZE, y: 17 * TILE_SIZE },
    },
    enemies: [
      { type: 'BOSS_BARON', x: 12 * TILE_SIZE, y: 3 * TILE_SIZE },
      { type: 'MIGHTA', x: 4 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'MIGHTA', x: 23 * TILE_SIZE, y: 8 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 8 * TILE_SIZE, y: 12 * TILE_SIZE },
      { type: 'ZEN_CHAN', x: 19 * TILE_SIZE, y: 12 * TILE_SIZE },
    ],
    timeLimitLimitSeconds: 100,
  };
}

export const STAGES: Record<number, () => StageConfig> = {
  1: buildStage1,
  2: buildStage2,
  3: buildStage3,
  4: buildStage4,
  5: buildStage5,
  6: buildStage6,
  7: buildStage7,
  8: buildStage8,
  9: buildStage9,
  10: buildStage10,
};
