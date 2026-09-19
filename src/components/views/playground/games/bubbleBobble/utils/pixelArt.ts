// Pixel Art Canvas Drawing Utilities for Authentic Retro 8-Bit Arcade Bubble Bobble

// Palette definitions strictly matching original Arcade / Master System / NES Bubble Bobble
export const PALETTE = {
  // Bub (Green Dragon)
  BUB_GREEN: '#00EA00',
  BUB_DARK_GREEN: '#00A800',
  BUB_YELLOW: '#FFF000',
  BUB_OUTLINE: '#331800',
  BUB_PINK: '#FF6878',
  BUB_BELLY: '#FFFFFF',

  // Bob (Blue Dragon)
  BOB_BLUE: '#00B8FF',
  BOB_DARK_BLUE: '#0078D8',
  BOB_CYAN: '#50E8FF',
  BOB_OUTLINE: '#331800',
  BOB_PINK: '#FF6878',
  BOB_BELLY: '#FFFFFF',

  // Shared Eyes & Details
  EYE_WHITE: '#FFFFFF',
  PUPIL_BLACK: '#000000',
  MOUTH_RED: '#E01830',

  // Enemies (Authentic Arcade Colors)
  ZEN_BLUE: '#3090F8',
  ZEN_ORANGE: '#F87800',
  ZEN_YELLOW: '#F8D800',
  MIGHTA_WHITE: '#F8F8F8',
  MIGHTA_PURPLE: '#8038A8',
  MIGHTA_RED: '#F83838',
  MONSTA_PURPLE: '#6828A8',
  MONSTA_RED_EYE: '#F82020',
  STAR_PINK: '#F87888',
  STAR_YELLOW: '#F8E000',
  BOSS_RED: '#D81838',
  BOSS_DARK: '#400010',

  // Bubbles
  BUBBLE_GREEN: 'rgba(0, 240, 0, 0.65)',
  BUBBLE_BLUE: 'rgba(0, 184, 255, 0.65)',
  BUBBLE_CYAN: 'rgba(80, 232, 255, 0.75)',
  BUBBLE_OUTLINE: '#FFFFFF',

  // Fruits / Items
  CHERRY_RED: '#FF0033',
  BANANA_YELLOW: '#FFE135',
  APPLE_RED: '#E32636',
  STRAWBERRY_RED: '#FC5A8D',
  CAKE_CREAM: '#FFF8DC',
  CAKE_PINK: '#FFB6C1',
  DIAMOND_BLUE: '#00FFFF',
  EXTEND_TEXT: '#00FF00',

  // Bricks
  BRICK_PINK_1: '#FF1493',
  BRICK_PINK_2: '#FFB6C1',
  BRICK_GOLD_1: '#D4AF37',
  BRICK_GOLD_2: '#FFD700',
  BRICK_CYAN_1: '#008B8B',
  BRICK_CYAN_2: '#00FFFF',
  BRICK_RED_1: '#8B0000',
  BRICK_RED_2: '#FF4500',
  BRICK_DARK_1: '#2F4F4F',
  BRICK_DARK_2: '#708090',
};

// 16x16 Pixel Matrices for Bub / Bob strictly drawn from authentic Bubble Bobble Arcade Sprites
// Legend:
// . = Transparent
// B = Brown/Black Outline (#331800)
// G = Dragon Body Color (Green for Bub / Cyan-Blue for Bob)
// Y = Spikes & Cheek Accent (Yellow for Bub / Bright Cyan for Bob)
// W = Pure White (Eye, Belly, Tooth)
// K = Black (Eye Pupil, Mouth Slit)
// P = Coral Pink (Arm, Foot, Tongue)

// Frame 1: Idle / Walk Stand
const DRAGON_FRAME_STAND = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '.BGGPPPPWWWWWB..',
  '.BYYGGGGPPPPPB..',
  '..BBBBBBBBBBBB..'
];

// Frame 2: Walk Step 1 (Left Foot Stepping)
const DRAGON_FRAME_WALK_1 = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '.BGGPPPPWWWWWB..',
  '..BYGGGG.PPPB...',
  '...BBBBB..BBB...'
];

// Frame 3: Walk Step 2 (Foot Plant & Rebound)
const DRAGON_FRAME_WALK_2 = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '.BGGPPPPWWWWWB..',
  '.BYYGGGG.PPPB...',
  '..BBBBBB.BBB....'
];

// Frame 4: Walk Step 3 (Right Foot Lifting)
const DRAGON_FRAME_WALK_3 = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '.BGGPPPPWWWWWB..',
  '...PPGGGGPPPB...',
  '...BBBBBBBBBB...'
];

// Frame 5: Walk Step 4 (Full Stride)
const DRAGON_FRAME_WALK_4 = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '.BGGPPPPWWWWWB..',
  '.PPYGGGGPPPPPB..',
  '.BBBBBBBBBBBBB..'
];

// Jumping Frame (Legs tucked up, back spines flared)
const DRAGON_FRAME_JUMP = [
  '......BBBB......',
  '.....BYYYYB.....',
  '..BB..BYYYB.....',
  '.BYYB.GGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '..BGPPPPWWWWWB..',
  '...PPBB.PPPPB...',
  '...BB....BBB....'
];

// Shooting Frame (Mouth wide open spitting bubble)
const DRAGON_FRAME_SHOOT = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYBKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPKWWWB...',
  '.BGGPPPPWWWWWB..',
  '.BYYGGGGPPPPPB..',
  '..BBBBBBBBBBBB..'
];

// Idle Breathing Frame 2
const DRAGON_FRAME_IDLE_2 = [
  '.......BBB......',
  '......BYYYB.....',
  '..BBB.BYYYB.....',
  '.BYYYBGGGGGB....',
  '.BYYYGGGGGGGB...',
  '..BBGGGGWWWWGB..',
  '.BYYYGGWKKWWGB..',
  '.BYYYGGWKKWWGB..',
  '..BBGGGWKKWWGB..',
  '.BYYYGGWWWWWGGB.',
  '.BYYYYYGKKKKKB..',
  '..BBGGPPKKKKKB..',
  '.BGGPPPPWWWWWB..',
  '..BGPPPPWWWWWB..',
  '..BYGGGGPPPPPB..',
  '..BBBBBBBBBBBB..'
];

// Helper to draw a pixel grid onto Canvas
export function drawPixelMatrix(
  ctx: CanvasRenderingContext2D,
  matrix: string[],
  colorMap: Record<string, string>,
  x: number,
  y: number,
  pixelSize: number = 2,
  flipX: boolean = false
) {
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const char = matrix[r][c];
      if (char !== '.' && colorMap[char]) {
        ctx.fillStyle = colorMap[char];
        const drawC = flipX ? cols - 1 - c : c;
        ctx.fillRect(
          Math.floor(x + drawC * pixelSize),
          Math.floor(y + r * pixelSize),
          pixelSize,
          pixelSize
        );
      }
    }
  }
}

// Draw Player Dragon (Bub / Bob)
export function drawDragon(
  ctx: CanvasRenderingContext2D,
  player: {
    color: 'green' | 'blue';
    facing: 'left' | 'right';
    isJumping: boolean;
    shootingTimer: number;
    invulnerableTimer: number;
    vx?: number;
    x: number;
    y: number;
    width: number;
    height: number;
  },
  animFrame: number
) {
  // Invulnerable flashing
  if (player.invulnerableTimer > 0 && Math.floor(player.invulnerableTimer / 4) % 2 === 0) {
    return;
  }

  const isGreen = player.color === 'green';
  const mainColor = isGreen ? PALETTE.BUB_GREEN : PALETTE.BOB_BLUE;
  const spineColor = isGreen ? PALETTE.BUB_YELLOW : PALETTE.BOB_CYAN;
  const outlineColor = isGreen ? PALETTE.BUB_OUTLINE : PALETTE.BOB_OUTLINE;
  const pinkColor = isGreen ? PALETTE.BUB_PINK : PALETTE.BOB_PINK;
  const bellyColor = isGreen ? PALETTE.BUB_BELLY : PALETTE.BOB_BELLY;

  const colorMap: Record<string, string> = {
    B: outlineColor,
    G: mainColor,
    Y: spineColor,
    W: bellyColor,
    K: PALETTE.PUPIL_BLACK,
    P: pinkColor,
  };

  const flipX = player.facing === 'left';
  const pSize = player.width / 16;

  let matrix = DRAGON_FRAME_STAND;

  if (player.shootingTimer > 0) {
    matrix = DRAGON_FRAME_SHOOT;
  } else if (player.isJumping) {
    matrix = DRAGON_FRAME_JUMP;
  } else {
    // Check if player is moving
    const isMoving = Math.abs(player.vx || 0) > 0.12;
    if (isMoving) {
      // 8-step continuous walk animation cycle
      const walkStep = Math.floor(animFrame / 3) % 8;
      if (walkStep === 0 || walkStep === 4) matrix = DRAGON_FRAME_STAND;
      else if (walkStep === 1) matrix = DRAGON_FRAME_WALK_1;
      else if (walkStep === 2) matrix = DRAGON_FRAME_WALK_2;
      else if (walkStep === 3) matrix = DRAGON_FRAME_WALK_3;
      else if (walkStep === 5) matrix = DRAGON_FRAME_WALK_4;
      else if (walkStep === 6) matrix = DRAGON_FRAME_WALK_3;
      else matrix = DRAGON_FRAME_WALK_2;
    } else {
      // Idle bobbing cycle
      matrix = Math.floor(animFrame / 24) % 2 === 0 ? DRAGON_FRAME_STAND : DRAGON_FRAME_IDLE_2;
    }
  }

  drawPixelMatrix(ctx, matrix, colorMap, player.x, player.y, pSize, flipX);
}

// Authentic Master System / Arcade Monsta Enemy (Purple blob whale)
const MONSTA_MATRIX_1 = [
  '.....BBBB.......',
  '...BBPYYPBB.....',
  '..BPYYYYYYPB....',
  '.BPYYYYYYYYPB...',
  '.BPWWYYYYWWPB...',
  'BPWKKWYYWKKWPB..',
  'BPWKKWYYWKKWPB..',
  'BPWWWWYYWWWWPB..',
  'BPYYYYYYYYYYPB..',
  '.BPYYYKKKYYPB...',
  '.BPYYKKKKKYYPB..',
  '..BPYYYYYYYYPB..',
  '..BBPYYYYYYPB...',
  '..BBP.BBP.BBP...',
  '...BB..BB..BB...',
  '................',
];

const MONSTA_MATRIX_2 = [
  '.....BBBB.......',
  '...BBPYYPBB.....',
  '..BPYYYYYYPB....',
  '.BPYYYYYYYYPB...',
  '.BPWWYYYYWWPB...',
  'BPWKKWYYWKKWPB..',
  'BPWKKWYYWKKWPB..',
  'BPWWWWYYWWWWPB..',
  'BPYYKKKKYYYPB...',
  '.BPYKKKKKYYPB...',
  '.BPYYYYYYYYYPB..',
  '..BPYYYYYYYPB...',
  '...BBPYYYYPB....',
  '....BBP..BBP....',
  '.....BB...BB....',
  '................',
];

// Authentic Zen-Chan Enemy (Wind-up Clockwork Robot)
const ZEN_MATRIX_1 = [
  '......YYB.......',
  '....BYYYYYB.....',
  '....BYYYYYB.....',
  '......YYB.......',
  '....BBBBBBB.....',
  '..BBOOOOOOOBB...',
  '.BBOOWWWWWWOOB..',
  '.BBOOWKKWWWOOB..',
  '.BBOOWKKWWWOOB..',
  '.BBOOWWWWWWOOB..',
  '..BBOOOOOOOBB...',
  '..BBOOPPPPOOB...',
  '...BBBBBBBBB....',
  '....RRRB.RRRB...',
  '....RRRB.RRRB...',
  '....BBBB.BBBB...'
];

const ZEN_MATRIX_2 = [
  '......YYB.......',
  '....BYYYYYB.....',
  '....BYYYYYB.....',
  '......YYB.......',
  '....BBBBBBB.....',
  '..BBOOOOOOOBB...',
  '.BBOOWWWWWWOOB..',
  '.BBOOWKKWWWOOB..',
  '.BBOOWKKWWWOOB..',
  '.BBOOWWWWWWOOB..',
  '..BBOOOOOOOBB...',
  '..BBOOPPPPOOB...',
  '...BBBBBBBBB....',
  '...RRRB...RRRB..',
  '...RRRB...RRRB..',
  '...BBBB...BBBB..'
];

// Authentic Mighta Enemy (Ghost Wizard in robe)
const MIGHTA_MATRIX_1 = [
  '.....BBBB.......',
  '....BWWWWBB.....',
  '...BWWWWWWWB....',
  '..BWWWWWWWWWB...',
  '..BWWBBBBBBWB...',
  '..BWBRRBRRBWB...',
  '..BWBRRBRRBWB...',
  '..BWWBBBBBBWB...',
  '..BWWWWWWWWWB...',
  '..BWWWWWWWWWB...',
  '.BWWWWWWWWWWWB..',
  '.BWWWWWWWWWWWB..',
  '..BWWWWWWWWWB...',
  '..BWWBB.BWWWB...',
  '...BB....BBB....',
  '................'
];

const MIGHTA_MATRIX_2 = [
  '.....BBBB.......',
  '....BWWWWBB.....',
  '...BWWWWWWWB....',
  '..BWWWWWWWWWB...',
  '..BWWBBBBBBWB...',
  '..BWBRRBRRBWB...',
  '..BWBRRBRRBWB...',
  '..BWWBBBBBBWB...',
  '..BWWWWWWWWWB...',
  '..BWWWWWWWWWB...',
  '.BWWWWWWWWWWWB..',
  '..BWWWWWWWWWB...',
  '...BWWWWWWWB....',
  '....BWW.BWW.....',
  '.....BB..BB.....',
  '................'
];

// Authentic Starfish Pulsator Enemy (Pink & Yellow star)
const STAR_MATRIX = [
  '.......YY.......',
  '......YYYY......',
  '.....YYYYYY.....',
  '...PPPYYYYYPPP..',
  '..PPPPYYYYPPPP..',
  '..PPPPWWWWPPPP..',
  '..PPPWWKKWWPPP..',
  '..PPPWWKKWWPPP..',
  '..PPPPWWWWPPPP..',
  '..PPPPPPPPPPPP..',
  '...PPPPPPPPPP...',
  '..PPPYYPPYYPPP..',
  '.PPYYYYPPYYYYPP.',
  '.YYYYY....YYYYY.',
  '..YYY......YYY..',
  '................'
];

// Draw Boss Baron (Skull Monster)
const BOSS_MATRIX = [
  '....RRRRRRRR....',
  '..RRRRRRRRRRRR..',
  '.RRRWWWRRRWWWRR.',
  '.RRWKKKWRWKKKWR.',
  '.RRWKKKWRWKKKWR.',
  '.RRRWWWRRRWWWRR.',
  '.RRRRRRRRRRRRRR.',
  '.RRRRRYYYYYRRRR.',
  '.RRRWWWWWWWWWRR.',
  '.RRRWKWKWKWKWRR.',
  '..RRWWWWWWWWWR..',
  '..RRRRRRRRRRRR..',
  '...RRR....RRR...',
  '...RRR....RRR...',
  '..RRRR....RRRR..',
  '................',
];

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: {
    type: string;
    state: string;
    facing: 'left' | 'right';
    x: number;
    y: number;
    width: number;
    height: number;
  },
  animFrame: number
) {
  const pSize = enemy.width / 16;
  const flipX = enemy.facing === 'left';

  const isEnraged = enemy.state === 'ANGRY';
  const walkFrame = Math.floor(animFrame / 6) % 2;

  // Trapped Enemy inside Bubble
  if (enemy.state === 'TRAPPED') {
    // Draw bubble enclosing enemy
    drawBubble(ctx, {
      x: enemy.x,
      y: enemy.y,
      width: enemy.width,
      height: enemy.height,
      type: 'NORMAL',
      playerId: 1,
    }, animFrame);

    // Mini trapped enemy sprite inside
    ctx.save();
    ctx.globalAlpha = 0.85;
    const colorMap: Record<string, string> = {
      B: '#220800',
      P: PALETTE.MONSTA_PURPLE,
      O: PALETTE.ZEN_BLUE,
      W: PALETTE.EYE_WHITE,
      K: PALETTE.PUPIL_BLACK,
      Y: PALETTE.ZEN_YELLOW,
      R: PALETTE.ZEN_ORANGE,
    };
    let m = MONSTA_MATRIX_1;
    if (enemy.type === 'ZEN_CHAN') m = ZEN_MATRIX_1;
    if (enemy.type === 'MIGHTA') m = MIGHTA_MATRIX_1;
    if (enemy.type === 'BOSS_BARON') m = BOSS_MATRIX;

    drawPixelMatrix(ctx, m, colorMap, enemy.x + 2, enemy.y + 2, pSize * 0.8, flipX);
    ctx.restore();
    return;
  }

  // Pick matrix and color map according to enemy type
  let matrix = MONSTA_MATRIX_1;
  let colorMap: Record<string, string> = {};

  if (enemy.type === 'ZEN_CHAN') {
    matrix = walkFrame === 0 ? ZEN_MATRIX_1 : ZEN_MATRIX_2;
    colorMap = {
      B: '#201000',
      O: isEnraged ? '#F83838' : PALETTE.ZEN_BLUE,
      W: PALETTE.EYE_WHITE,
      K: PALETTE.PUPIL_BLACK,
      Y: PALETTE.ZEN_YELLOW,
      P: isEnraged ? '#FFA0A0' : '#88CCFF',
      R: isEnraged ? '#FF7000' : PALETTE.ZEN_ORANGE,
    };
  } else if (enemy.type === 'MIGHTA') {
    matrix = walkFrame === 0 ? MIGHTA_MATRIX_1 : MIGHTA_MATRIX_2;
    colorMap = {
      B: '#201020',
      W: isEnraged ? '#FFA8B8' : PALETTE.MIGHTA_WHITE,
      R: isEnraged ? '#FF0000' : PALETTE.MIGHTA_RED,
    };
  } else if (enemy.type === 'BOSS_BARON') {
    matrix = BOSS_MATRIX;
    colorMap = {
      R: isEnraged ? '#FF0000' : PALETTE.BOSS_RED,
      W: PALETTE.EYE_WHITE,
      K: PALETTE.PUPIL_BLACK,
      Y: PALETTE.BANANA_YELLOW,
    };
  } else {
    // Monsta / Star
    matrix = walkFrame === 0 ? MONSTA_MATRIX_1 : MONSTA_MATRIX_2;
    colorMap = {
      B: '#200830',
      P: isEnraged ? '#FF2020' : PALETTE.MONSTA_PURPLE,
      Y: isEnraged ? '#FFA0A0' : '#9048D8',
      W: PALETTE.EYE_WHITE,
      K: isEnraged ? '#FFFFFF' : PALETTE.PUPIL_BLACK,
    };
  }

  drawPixelMatrix(ctx, matrix, colorMap, enemy.x, enemy.y, pSize, flipX);
}

// Draw Bubble
export function drawBubble(
  ctx: CanvasRenderingContext2D,
  bubble: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    letter?: string;
    playerId: 1 | 2;
    containsEnemy?: string;
  },
  animFrame: number
) {
  const cx = bubble.x + bubble.width / 2;
  const cy = bubble.y + bubble.height / 2;
  const r = bubble.width / 2;

  ctx.save();

  // Wobbly radius
  const wobble = Math.sin(animFrame * 0.15 + bubble.x) * 1.5;
  const currentR = Math.max(4, r + wobble);

  // Outer circle fill
  if (bubble.containsEnemy) {
    // Trapped enemy bubble glows green/pink and wobbly
    ctx.fillStyle = Math.floor(animFrame / 10) % 2 === 0 ? 'rgba(0, 255, 127, 0.85)' : 'rgba(255, 105, 180, 0.85)';
  } else if (bubble.playerId === 1) {
    ctx.fillStyle = PALETTE.BUBBLE_GREEN;
  } else {
    ctx.fillStyle = PALETTE.BUBBLE_BLUE;
  }
  if (bubble.type === 'WATER') ctx.fillStyle = 'rgba(0, 191, 255, 0.7)';
  if (bubble.type === 'LETTER') ctx.fillStyle = 'rgba(255, 20, 147, 0.7)';

  ctx.beginPath();
  ctx.arc(cx, cy, currentR, 0, Math.PI * 2);
  ctx.fill();

  // Pixelated border
  ctx.strokeStyle = bubble.containsEnemy ? '#FFFF00' : PALETTE.BUBBLE_OUTLINE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Gloss highlight
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(cx - currentR * 0.35, cy - currentR * 0.35, currentR * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Trapped Enemy inside bubble
  if (bubble.containsEnemy) {
    drawEnemy(
      ctx,
      {
        type: bubble.containsEnemy,
        x: bubble.x + 1,
        y: bubble.y + 1,
        width: 18,
        height: 18,
        facing: 'left',
        state: 'TRAPPED',
      },
      animFrame
    );
  }

  // Letter if EXTEND bubble
  if (bubble.type === 'LETTER' && bubble.letter) {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(bubble.letter, cx, cy);
  }

  ctx.restore();
}

// Draw Fruit & Items
export function drawItem(
  ctx: CanvasRenderingContext2D,
  item: {
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    letter?: string;
  },
  animFrame: number
) {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  const floatY = Math.sin(animFrame * 0.1 + item.x) * 2;

  ctx.save();

  if (item.type === 'CHERRY') {
    // Cherry
    ctx.fillStyle = PALETTE.CHERRY_RED;
    ctx.beginPath();
    ctx.arc(cx - 3, cy + floatY + 2, 4, 0, Math.PI * 2);
    ctx.arc(cx + 3, cy + floatY + 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + floatY - 2);
    ctx.lineTo(cx, cy + floatY - 6);
    ctx.lineTo(cx + 3, cy + floatY - 1);
    ctx.stroke();
  } else if (item.type === 'BANANA') {
    // Banana
    ctx.fillStyle = PALETTE.BANANA_YELLOW;
    ctx.beginPath();
    ctx.arc(cx, cy + floatY, 7, 0.2, Math.PI * 0.9);
    ctx.fill();
  } else if (item.type === 'APPLE') {
    // Apple
    ctx.fillStyle = PALETTE.APPLE_RED;
    ctx.beginPath();
    ctx.arc(cx, cy + floatY + 1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#228B22';
    ctx.fillRect(cx - 1, cy + floatY - 6, 2, 3);
  } else if (item.type === 'DIAMOND') {
    // Diamond Gem
    ctx.fillStyle = PALETTE.DIAMOND_BLUE;
    ctx.beginPath();
    ctx.moveTo(cx, cy + floatY - 7);
    ctx.lineTo(cx + 7, cy + floatY);
    ctx.lineTo(cx, cy + floatY + 7);
    ctx.lineTo(cx - 7, cy + floatY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
  } else if (item.type === 'BOOTS') {
    // Speed Boots (Speed up)
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(cx - 6, cy + floatY - 4, 6, 8);
    ctx.fillRect(cx, cy + floatY - 4, 6, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 6, cy + floatY - 4, 12, 2);
  } else if (item.type === 'CANDY_PINK') {
    // Pink Power Candy: Rapid Fire & High Velocity Bubble
    ctx.fillStyle = '#FF1493';
    ctx.beginPath();
    ctx.arc(cx, cy + floatY, 6, 0, Math.PI * 2);
    ctx.fill();
    // Candy wrapper twist ends
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + floatY);
    ctx.lineTo(cx - 10, cy + floatY - 4);
    ctx.lineTo(cx - 10, cy + floatY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy + floatY);
    ctx.lineTo(cx + 10, cy + floatY - 4);
    ctx.lineTo(cx + 10, cy + floatY + 4);
    ctx.closePath();
    ctx.fill();
    // Inner swirl
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 2, cy + floatY - 2, 4, 4);
  } else if (item.type === 'CANDY_BLUE') {
    // Blue Power Candy: Extended Long Range Bubble
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(cx, cy + floatY, 6, 0, Math.PI * 2);
    ctx.fill();
    // Candy wrapper twist ends
    ctx.fillStyle = '#87CEFA';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy + floatY);
    ctx.lineTo(cx - 10, cy + floatY - 4);
    ctx.lineTo(cx - 10, cy + floatY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy + floatY);
    ctx.lineTo(cx + 10, cy + floatY - 4);
    ctx.lineTo(cx + 10, cy + floatY + 4);
    ctx.closePath();
    ctx.fill();
    // Inner star
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx - 1, cy + floatY - 3, 2, 6);
    ctx.fillRect(cx - 3, cy + floatY - 1, 6, 2);
  } else if (item.type === 'EXTEND_LETTER' && item.letter) {
    // EXTEND Bubble Letter
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(cx, cy + floatY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.letter, cx, cy + floatY);
  } else {
    // Cake / Default
    ctx.fillStyle = PALETTE.CAKE_CREAM;
    ctx.fillRect(cx - 6, cy + floatY - 4, 12, 8);
    ctx.fillStyle = PALETTE.CAKE_PINK;
    ctx.fillRect(cx - 6, cy + floatY - 4, 12, 3);
  }

  ctx.restore();
}

// Draw Stage Tile / Bricks (Classic 8-Bit Arcade Style)
export function drawStageBrick(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  tileSize: number,
  type: number, // 1: Wall, 2: Pass platform
  brickColor: string,
  accentColor: string
) {
  ctx.save();

  if (type === 1) {
    // Solid Wall Brick with 8-Bit Bevel & Mortar Texture
    ctx.fillStyle = brickColor;
    ctx.fillRect(x, y, tileSize, tileSize);

    // Staggered Mortar Texture Lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    const midY = Math.floor(tileSize / 2);
    ctx.fillRect(x, y + midY, tileSize, 1); // Mid horizontal line

    // Alternating vertical mortar joints (row 1 vs row 2)
    const isEvenRow = Math.floor(y / tileSize) % 2 === 0;
    if (isEvenRow) {
      ctx.fillRect(x + Math.floor(tileSize / 2), y, 1, midY);
    } else {
      ctx.fillRect(x + Math.floor(tileSize / 4), y + midY, 1, midY);
      ctx.fillRect(x + Math.floor((tileSize * 3) / 4), y + midY, 1, midY);
    }

    // Top & Left Highlight Bevels
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, tileSize, 2);
    ctx.fillRect(x, y, 2, tileSize);

    // Bottom & Right Dark Shadow Bevels
    ctx.fillStyle = '#080812';
    ctx.fillRect(x + tileSize - 2, y, 2, tileSize);
    ctx.fillRect(x, y + tileSize - 2, tileSize, 2);

    // Subtle 8-bit pixel specular dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillRect(x + 2, y + 2, 2, 2);
  } else if (type === 2) {
    // Pass-through Platform (Lighter Top Ledge with Jump-Through Visual Indicator)
    // Dark bottom gap
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(x, y + tileSize - 2, tileSize, 2);

    // Main Platform Body
    ctx.fillStyle = brickColor;
    ctx.fillRect(x, y + 3, tileSize, tileSize - 5);

    // Top Glowing Ledge Cap (Gives clear visual feedback that players can land on or jump through)
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, tileSize, 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, tileSize, 1);

    // Side border caps
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x, y + 3, 1, tileSize - 5);
    ctx.fillRect(x + tileSize - 1, y + 3, 1, tileSize - 5);
  }

  ctx.restore();
}

// Draw Rich 8-Bit Retro Stage Backdrop for all 10 Themes
export function drawStageBackgroundArt(
  ctx: CanvasRenderingContext2D,
  theme: string,
  width: number,
  height: number,
  frame: number
) {
  ctx.save();

  switch (theme) {
    case 'CANDY': {
      // Stage 1: Candy Wonderland - Rainbow, Pastel Clouds, Candy Canes & Stars
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#102a5c');
      grad.addColorStop(0.6, '#241b4e');
      grad.addColorStop(1, '#3b1c42');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Rainbow Arc in background
      const colors = ['#FF1493', '#FF8C00', '#FFD700', '#00FF7F', '#00BFFF', '#8A2BE2'];
      colors.forEach((col, i) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.22;
        ctx.beginPath();
        ctx.arc(width / 2, height + 40, 240 - i * 6, Math.PI, 0, false);
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;

      // Candy Clouds
      ctx.fillStyle = 'rgba(255, 192, 203, 0.15)';
      ctx.beginPath();
      ctx.arc(100 + Math.sin(frame * 0.02) * 8, 70, 30, 0, Math.PI * 2);
      ctx.arc(135 + Math.sin(frame * 0.02) * 8, 65, 36, 0, Math.PI * 2);
      ctx.arc(170 + Math.sin(frame * 0.02) * 8, 72, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(420 + Math.cos(frame * 0.02) * 8, 110, 32, 0, Math.PI * 2);
      ctx.arc(455 + Math.cos(frame * 0.02) * 8, 105, 40, 0, Math.PI * 2);
      ctx.arc(490 + Math.cos(frame * 0.02) * 8, 112, 28, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling Candy Stars
      ctx.fillStyle = '#FFE4E1';
      for (let s = 0; s < 12; s++) {
        const sx = ((s * 47 + 23) % (width - 40)) + 20;
        const sy = ((s * 31 + 17) % (height - 80)) + 30;
        const blink = Math.sin(frame * 0.08 + s) > 0.3;
        if (blink) {
          ctx.fillRect(sx, sy, 3, 3);
          ctx.fillRect(sx - 2, sy + 1, 7, 1);
          ctx.fillRect(sx + 1, sy - 2, 1, 7);
        }
      }
      break;
    }

    case 'PYRAMID': {
      // Stage 2: Sandstone Desert & Pyramid Silhouettes (Inspired by user image 1)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1c0f06');
      grad.addColorStop(0.5, '#421a08');
      grad.addColorStop(1, '#66300a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Great Pyramid Silhouette
      ctx.fillStyle = 'rgba(20, 8, 3, 0.45)';
      ctx.beginPath();
      ctx.moveTo(80, height - 20);
      ctx.lineTo(220, 90);
      ctx.lineTo(360, height - 20);
      ctx.closePath();
      ctx.fill();

      // Second smaller Pyramid
      ctx.beginPath();
      ctx.moveTo(310, height - 20);
      ctx.lineTo(430, 140);
      ctx.lineTo(530, height - 20);
      ctx.closePath();
      ctx.fill();

      // Giant Desert Crescent Moon
      ctx.fillStyle = '#FFE0B2';
      ctx.beginPath();
      ctx.arc(100, 70, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1c0f06';
      ctx.beginPath();
      ctx.arc(108, 66, 22, 0, Math.PI * 2);
      ctx.fill();

      // Sand Dune Horizon Lines
      ctx.strokeStyle = 'rgba(255, 183, 77, 0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height - 60);
      ctx.bezierCurveTo(150, height - 90, 350, height - 40, width, height - 70);
      ctx.stroke();
      break;
    }

    case 'JUNGLE': {
      // Stage 3: Emerald Jungle Sanctuary - Vines & Giant Leaf Silhouettes
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#04140a');
      grad.addColorStop(0.6, '#082614');
      grad.addColorStop(1, '#0e3a1f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Distant Canopy Trees
      ctx.fillStyle = 'rgba(10, 40, 20, 0.4)';
      for (let t = 0; t < 6; t++) {
        const tx = t * 100 + 30;
        ctx.beginPath();
        ctx.arc(tx, 140, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      // Dangling Glowing Vines
      ctx.strokeStyle = 'rgba(118, 255, 3, 0.25)';
      ctx.lineWidth = 2;
      for (let v = 0; v < 8; v++) {
        const vx = v * 65 + 35;
        const sway = Math.sin(frame * 0.03 + v) * 6;
        ctx.beginPath();
        ctx.moveTo(vx, 0);
        ctx.quadraticCurveTo(vx + sway, 70, vx - sway, 130);
        ctx.stroke();
      }

      // Fireflies floating
      ctx.fillStyle = '#AEEA00';
      for (let f = 0; f < 10; f++) {
        const fx = (f * 55 + Math.sin(frame * 0.04 + f * 2) * 20) % width;
        const fy = 60 + ((f * 35 + Math.cos(frame * 0.05 + f)) % 260);
        ctx.fillRect(fx, fy, 2, 2);
      }
      break;
    }

    case 'ICE': {
      // Stage 4: Crystal Glacier - Aurora Borealis & Ice Shards
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#040d1a');
      grad.addColorStop(0.5, '#071d38');
      grad.addColorStop(1, '#0a2d54');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Aurora Wave
      ctx.fillStyle = 'rgba(0, 229, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(0, 40);
      for (let x = 0; x <= width; x += 20) {
        const ay = 60 + Math.sin((x * 0.015) + (frame * 0.03)) * 30;
        ctx.lineTo(x, ay);
      }
      ctx.lineTo(width, 160);
      ctx.lineTo(0, 160);
      ctx.closePath();
      ctx.fill();

      // Stalactites hanging from top
      ctx.fillStyle = 'rgba(128, 222, 234, 0.2)';
      for (let i = 0; i < 14; i++) {
        const ix = i * 40 + 15;
        const ih = 15 + ((i * 17) % 25);
        ctx.beginPath();
        ctx.moveTo(ix - 6, 0);
        ctx.lineTo(ix + 6, 0);
        ctx.lineTo(ix, ih);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'NEON': {
      // Stage 5: Retro 80s Synthwave Grid & Sunset
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#120420');
      grad.addColorStop(0.5, '#2e0840');
      grad.addColorStop(1, '#0a0214');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Neon Sun
      ctx.fillStyle = '#FF007F';
      ctx.beginPath();
      ctx.arc(width / 2, 130, 45, 0, Math.PI * 2);
      ctx.fill();
      // Sun scanlines
      ctx.fillStyle = '#120420';
      for (let s = 100; s <= 175; s += 6) {
        ctx.fillRect(width / 2 - 50, s, 100, 2);
      }

      // Neon Cyber Grid Floor Perspective
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.22)';
      ctx.lineWidth = 1;
      const horizonY = 220;
      for (let y = horizonY; y < height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let x = 0; x <= width; x += 35) {
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(x * 1.6 - width * 0.3, height);
        ctx.stroke();
      }
      break;
    }

    case 'VOLCANO': {
      // Stage 6: Magma Volcano - Molten Lava & Ember Sparks
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1a0303');
      grad.addColorStop(0.7, '#380a0a');
      grad.addColorStop(1, '#541208');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Mountain Volcano Silhouette
      ctx.fillStyle = 'rgba(20, 3, 3, 0.6)';
      ctx.beginPath();
      ctx.moveTo(40, height);
      ctx.lineTo(200, 80);
      ctx.lineTo(280, 80);
      ctx.lineTo(440, height);
      ctx.closePath();
      ctx.fill();

      // Lava Crater Glow
      ctx.fillStyle = 'rgba(255, 87, 34, 0.4)';
      ctx.fillRect(200, 80, 80, 10);

      // Rising Lava Embers
      for (let e = 0; e < 15; e++) {
        const ex = (e * 37 + Math.sin(frame * 0.05 + e) * 20) % width;
        const ey = (height - ((frame * 1.5 + e * 25) % height));
        ctx.fillStyle = e % 2 === 0 ? '#FF5722' : '#FFD600';
        ctx.fillRect(ex, ey, 2, 3);
      }
      break;
    }

    case 'COSMIC': {
      // Stage 7: Cosmic Nebula Galaxy - Planets & Starfields
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#040114');
      grad.addColorStop(0.5, '#0c0326');
      grad.addColorStop(1, '#180738');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Distant Ringed Planet
      ctx.fillStyle = '#7B1FA2';
      ctx.beginPath();
      ctx.arc(430, 80, 26, 0, Math.PI * 2);
      ctx.fill();
      // Planet Rings
      ctx.strokeStyle = 'rgba(234, 128, 252, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(430, 80, 48, 12, -Math.PI / 8, 0, Math.PI * 2);
      ctx.stroke();

      // Cosmic Star Dust Clouds
      ctx.fillStyle = 'rgba(156, 39, 176, 0.15)';
      ctx.beginPath();
      ctx.arc(180, 140, 80, 0, Math.PI * 2);
      ctx.arc(280, 180, 90, 0, Math.PI * 2);
      ctx.fill();

      // Colorful Stars
      const starColors = ['#FFFFFF', '#00E5FF', '#EA80FC', '#FFD700'];
      for (let s = 0; s < 25; s++) {
        const sx = (s * 33 + 11) % width;
        const sy = (s * 23 + 7) % height;
        ctx.fillStyle = starColors[s % starColors.length];
        ctx.fillRect(sx, sy, 2, 2);
      }
      break;
    }

    case 'HAUNTED': {
      // Stage 8: Haunted Catacombs - Gothic Spires & Ghostly Moon
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#06030d');
      grad.addColorStop(0.6, '#10081f');
      grad.addColorStop(1, '#1c1033');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Spooky Pale Moon
      ctx.fillStyle = '#E8EAF6';
      ctx.beginPath();
      ctx.arc(130, 60, 28, 0, Math.PI * 2);
      ctx.fill();

      // Castle Spire Silhouettes
      ctx.fillStyle = 'rgba(10, 4, 18, 0.7)';
      for (let sp = 0; sp < 4; sp++) {
        const sx = sp * 130 + 50;
        ctx.fillRect(sx, 120, 30, height - 120);
        // Spire roof triangle
        ctx.beginPath();
        ctx.moveTo(sx - 5, 120);
        ctx.lineTo(sx + 15, 60);
        ctx.lineTo(sx + 35, 120);
        ctx.closePath();
        ctx.fill();
      }

      // Eerie fog layer
      ctx.fillStyle = 'rgba(130, 177, 255, 0.08)';
      ctx.fillRect(0, height - 80, width, 80);
      break;
    }

    case 'VAULT': {
      // Stage 9: Royal Golden Treasure Vault - Pillars & Gleaming Heaps
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1c1202');
      grad.addColorStop(0.6, '#332104');
      grad.addColorStop(1, '#4a3006');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Majestic Golden Pillars
      ctx.fillStyle = 'rgba(255, 179, 0, 0.18)';
      for (let p = 0; p < 5; p++) {
        const px = p * 110 + 40;
        ctx.fillRect(px, 30, 20, height - 30);
        ctx.fillRect(px - 6, 22, 32, 8); // Capital top
        ctx.fillRect(px - 6, height - 10, 32, 10); // Base
      }

      // Treasure Sparkles
      ctx.fillStyle = '#FFF8E1';
      for (let spk = 0; spk < 15; spk++) {
        const sx = ((spk * 41 + 19) % (width - 40)) + 20;
        const sy = ((spk * 29 + 13) % (height - 60)) + 40;
        if (Math.sin(frame * 0.1 + spk) > 0.4) {
          ctx.fillRect(sx, sy, 3, 3);
          ctx.fillRect(sx - 2, sy + 1, 7, 1);
          ctx.fillRect(sx + 1, sy - 2, 1, 7);
        }
      }
      break;
    }

    case 'BOSS': {
      // Stage 10: Final Boss Citadel - Baron von Blubba's Dark Fortress with Lightning
      const isLightning = Math.random() < 0.035;
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (isLightning) {
        grad.addColorStop(0, '#4a0815');
        grad.addColorStop(0.5, '#7a1024');
        grad.addColorStop(1, '#30040c');
      } else {
        grad.addColorStop(0, '#0d0103');
        grad.addColorStop(0.6, '#1a0307');
        grad.addColorStop(1, '#29050c');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Giant Skull Fortress in background
      ctx.fillStyle = isLightning ? 'rgba(255, 23, 68, 0.4)' : 'rgba(30, 3, 8, 0.85)';
      ctx.beginPath();
      // Skull dome
      ctx.arc(width / 2, 120, 60, Math.PI, 0, false);
      ctx.lineTo(width / 2 + 45, 170);
      ctx.lineTo(width / 2 - 45, 170);
      ctx.closePath();
      ctx.fill();

      // Skull Eye Sockets
      ctx.fillStyle = '#FF1744';
      ctx.fillRect(width / 2 - 32, 105, 18, 22);
      ctx.fillRect(width / 2 + 14, 105, 18, 22);

      // Animated Lightning Bolt
      if (isLightning) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width / 2 - 80, 0);
        ctx.lineTo(width / 2 - 40, 60);
        ctx.lineTo(width / 2 - 60, 75);
        ctx.lineTo(width / 2 - 10, 150);
        ctx.stroke();
      }
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

