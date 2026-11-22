import { BlockType } from "../types";

// A small starter village around the spawn point. Deterministic (no random),
// so every player in a room generates exactly the same buildings. Returns a
// map of world-block overrides ("x,y,z" -> block). AIR entries carve space.

export type StructureMap = Map<string, BlockType>;

const k = (x: number, y: number, z: number) => `${x},${y},${z}`;

function fillBox(m: StructureMap, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, t: BlockType) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) m.set(k(x, y, z), t);
}

interface HouseSpec {
  x0: number; // west edge
  z0: number; // north edge
  w: number;
  d: number;
  wall: BlockType;
  roof: BlockType;
  kind: "home" | "workshop" | "library" | "storage";
}

// gy = y of the ground surface block under the house (floor sits ON gy+1? no: floor replaces gy)
function house(m: StructureMap, s: HouseSpec, gy: number) {
  const { x0, z0, w, d, wall, roof } = s;
  const x1 = x0 + w - 1, z1 = z0 + d - 1;
  const fy = gy; // floor level (replaces the ground surface block)
  const h = 3; // interior height (walls from fy+1 .. fy+h)
  // Foundation under the floor so houses on slopes don't float
  fillBox(m, x0, fy - 3, z0, x1, fy - 1, z1, BlockType.COBBLESTONE);
  // Floor
  fillBox(m, x0, fy, z0, x1, fy, z1, BlockType.PLANK);
  // Clear interior + a bit above the roof (trees/leaves out of the way)
  fillBox(m, x0 - 1, fy + 1, z0 - 1, x1 + 1, fy + h + 4, z1 + 1, BlockType.AIR);
  // Walls
  fillBox(m, x0, fy + 1, z0, x1, fy + h, z0, wall);
  fillBox(m, x0, fy + 1, z1, x1, fy + h, z1, wall);
  fillBox(m, x0, fy + 1, z0, x0, fy + h, z1, wall);
  fillBox(m, x1, fy + 1, z0, x1, fy + h, z1, wall);
  // Corner logs
  for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) fillBox(m, cx, fy + 1, cz, cx, fy + h, cz, BlockType.WOOD);
  // Windows on the long walls
  const mz = Math.floor((z0 + z1) / 2);
  m.set(k(x0, fy + 2, mz), BlockType.WINDOW);
  m.set(k(x1, fy + 2, mz), BlockType.WINDOW);
  const mx = Math.floor((x0 + x1) / 2);
  m.set(k(mx, fy + 2, z0), BlockType.WINDOW);
  // Doorway on the south wall (open, 2 high) with a lantern above it
  m.set(k(mx, fy + 1, z1), BlockType.AIR);
  m.set(k(mx, fy + 2, z1), BlockType.AIR);
  m.set(k(mx, fy + 3, z1), BlockType.LANTERN);
  // Flat roof with a raised rim
  fillBox(m, x0, fy + h + 1, z0, x1, fy + h + 1, z1, roof);
  fillBox(m, x0, fy + h + 2, z0, x1, fy + h + 2, z0, roof);
  fillBox(m, x0, fy + h + 2, z1, x1, fy + h + 2, z1, roof);
  fillBox(m, x0, fy + h + 2, z0, x0, fy + h + 2, z1, roof);
  fillBox(m, x1, fy + h + 2, z0, x1, fy + h + 2, z1, roof);
  // Ceiling lantern
  m.set(k(mx, fy + h, mz), BlockType.LANTERN);

  // Furniture by house type (inside, against the north wall)
  const iy = fy + 1;
  switch (s.kind) {
    case "home":
      m.set(k(x0 + 1, iy, z0 + 1), BlockType.BED);
      m.set(k(x0 + 2, iy, z0 + 1), BlockType.BED_FOOT);
      m.set(k(x1 - 1, iy, z0 + 1), BlockType.TABLE);
      m.set(k(x1 - 2, iy, z0 + 1), BlockType.CHAIR);
      m.set(k(x1 - 1, iy, z0 + 2), BlockType.FLOWER_POT);
      break;
    case "workshop":
      m.set(k(x0 + 1, iy, z0 + 1), BlockType.CRAFTING_TABLE);
      m.set(k(x0 + 2, iy, z0 + 1), BlockType.ANVIL);
      m.set(k(x1 - 1, iy, z0 + 1), BlockType.CHEST);
      m.set(k(x1 - 1, iy, z0 + 2), BlockType.CHEST);
      break;
    case "library":
      m.set(k(x0 + 1, iy, z0 + 1), BlockType.BOOKSHELF);
      m.set(k(x0 + 2, iy, z0 + 1), BlockType.BOOKSHELF);
      m.set(k(x0 + 1, iy + 1, z0 + 1), BlockType.BOOKSHELF);
      m.set(k(x0 + 2, iy + 1, z0 + 1), BlockType.BOOKSHELF);
      m.set(k(mx, iy, mz), BlockType.ENCHANTING_TABLE);
      m.set(k(x1 - 1, iy, z0 + 1), BlockType.TABLE);
      m.set(k(x1 - 1, iy, z0 + 2), BlockType.CHAIR);
      break;
    case "storage":
      m.set(k(x0 + 1, iy, z0 + 1), BlockType.CHEST);
      m.set(k(x0 + 2, iy, z0 + 1), BlockType.CHEST);
      m.set(k(x0 + 3, iy, z0 + 1), BlockType.CHEST);
      m.set(k(x1 - 1, iy, z0 + 1), BlockType.WOOL_WHITE);
      m.set(k(x1 - 1, iy, z0 + 2), BlockType.WOOL_YELLOW);
      m.set(k(x1 - 2, iy, z0 + 1), BlockType.WOOL_RED);
      break;
  }
}

// Straight path segment on the ground between two points (L-shaped)
function path(m: StructureMap, groundAt: (x: number, z: number) => number, ax: number, az: number, bx: number, bz: number) {
  const step = (x: number, z: number) => {
    const gy = groundAt(x, z);
    m.set(k(x, gy, z), BlockType.COBBLESTONE);
    m.set(k(x, gy + 1, z), BlockType.AIR);
    m.set(k(x, gy + 2, z), BlockType.AIR);
  };
  const dx = Math.sign(bx - ax), dz = Math.sign(bz - az);
  for (let x = ax; x !== bx; x += dx) step(x, az);
  for (let z = az; z !== bz + dz; z += dz) step(bx, z);
}

/**
 * Build the village. `groundAt(x,z)` returns the y of the surface block for a
 * column (ignoring structures). Houses that would land in water are skipped.
 */
export function buildVillage(
  groundAtWorld: (x: number, z: number) => number,
  isWaterWorld: (x: number, z: number) => boolean,
  centerX: number = 0,
  centerZ: number = 0
): StructureMap {
  const raw: StructureMap = new Map();
  // Everything below is built in village-local coordinates around (0,0) and
  // shifted to the chosen centre at the end.
  const groundAt = (x: number, z: number) => groundAtWorld(x + centerX, z + centerZ);
  const isWater = (x: number, z: number) => isWaterWorld(x + centerX, z + centerZ);
  const m = raw;

  // Clearing: remove trees (anything above ground) in a circle around the
  // village so houses and paths stand in the open. Structures set later
  // overwrite these entries.
  for (let x = -30; x <= 30; x++) {
    for (let z = -30; z <= 30; z++) {
      if (x * x + z * z > 30 * 30) continue;
      const g = groundAt(x, z);
      for (let y = g + 1; y <= g + 9; y++) m.set(k(x, y, z), BlockType.AIR);
    }
  }

  // Flat plaza around the spawn point: 9x9 cobblestone at one height, with a
  // well and lamp posts. Ground is filled up / carved down to the plaza level.
  const pg = groundAt(0, 0);
  for (let x = -4; x <= 4; x++) {
    for (let z = -4; z <= 4; z++) {
      const g = groundAt(x, z);
      for (let y = Math.min(g, pg) - 2; y < pg; y++) m.set(k(x, y, z), BlockType.DIRT);
      m.set(k(x, pg, z), (x + z) % 2 === 0 ? BlockType.COBBLESTONE : BlockType.STONE_BRICK);
      for (let y = pg + 1; y <= Math.max(g, pg) + 7; y++) m.set(k(x, y, z), BlockType.AIR);
    }
  }
  // Well (off-centre so the spawn stays clear)
  const wx = 3, wz = -3, wg = pg;
  fillBox(m, wx - 1, wg + 1, wz - 1, wx + 1, wg + 1, wz + 1, BlockType.STONE_BRICK);
  m.set(k(wx, wg + 1, wz), BlockType.WATER);
  m.set(k(wx, wg, wz), BlockType.WATER);
  m.set(k(wx, wg - 1, wz), BlockType.STONE_BRICK);
  // Lamp posts at the plaza corners
  for (const [lx, lz] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) {
    const g = pg;
    m.set(k(lx, g + 1, lz), BlockType.FENCE);
    m.set(k(lx, g + 2, lz), BlockType.FENCE);
    m.set(k(lx, g + 3, lz), BlockType.LANTERN);
  }

  const houses: HouseSpec[] = [
    { x0: -16, z0: -14, w: 7, d: 6, wall: BlockType.PLANK, roof: BlockType.STONE_BRICK, kind: "home" },
    { x0: 10, z0: -15, w: 7, d: 6, wall: BlockType.STONE_BRICK, roof: BlockType.PLANK, kind: "workshop" },
    { x0: -15, z0: 10, w: 7, d: 6, wall: BlockType.PLANK, roof: BlockType.STONE_BRICK, kind: "library" },
    { x0: 11, z0: 11, w: 8, d: 6, wall: BlockType.COBBLESTONE, roof: BlockType.PLANK, kind: "storage" },
    { x0: -24, z0: -3, w: 6, d: 6, wall: BlockType.PLANK, roof: BlockType.COBBLESTONE, kind: "home" },
    { x0: 19, z0: -5, w: 6, d: 7, wall: BlockType.STONE_BRICK, roof: BlockType.PLANK, kind: "home" },
    { x0: -5, z0: 17, w: 9, d: 6, wall: BlockType.BRICK, roof: BlockType.STONE_BRICK, kind: "home" },
    { x0: -2, z0: -24, w: 7, d: 6, wall: BlockType.PLANK, roof: BlockType.PLANK, kind: "workshop" },
  ];

  for (const h of houses) {
    const cx = h.x0 + Math.floor(h.w / 2), cz = h.z0 + Math.floor(h.d / 2);
    if (isWater(cx, cz)) continue;
    // Ground = median of the four corners + centre (keeps the floor sensible on slopes)
    const samples = [groundAt(h.x0, h.z0), groundAt(h.x0 + h.w - 1, h.z0), groundAt(h.x0, h.z0 + h.d - 1), groundAt(h.x0 + h.w - 1, h.z0 + h.d - 1), groundAt(cx, cz)].sort((a, b) => a - b);
    const gy = samples[2];
    house(m, h, gy);
    // Path from the house door (south wall centre) to the plaza edge
    const doorX = Math.floor((h.x0 + h.x0 + h.w - 1) / 2);
    const doorZ = h.z0 + h.d; // one block south of the door
    const targetX = Math.max(-4, Math.min(4, doorX));
    const targetZ = doorZ < 0 ? -5 : 5;
    path(m, groundAt, doorX, doorZ, targetX, targetZ);
  }

  // Small fenced farm with wheat-coloured wool "crops" east of the plaza
  const fx0 = 6, fz0 = -3, fw = 6, fd = 7;
  for (let x = fx0; x < fx0 + fw; x++) {
    for (let z = fz0; z < fz0 + fd; z++) {
      const g = groundAt(x, z);
      const edge = x === fx0 || x === fx0 + fw - 1 || z === fz0 || z === fz0 + fd - 1;
      m.set(k(x, g, z), edge ? BlockType.GRASS : BlockType.DIRT);
      m.set(k(x, g + 1, z), edge ? BlockType.FENCE : (x % 2 === 0 ? BlockType.WOOL_YELLOW : BlockType.AIR));
      for (let y = g + 2; y <= g + 4; y++) m.set(k(x, y, z), BlockType.AIR);
    }
  }
  // Gate on the west side of the farm
  m.set(k(fx0, groundAt(fx0, fz0 + 3), fz0 + 3), BlockType.COBBLESTONE);
  m.set(k(fx0, groundAt(fx0, fz0 + 3) + 1, fz0 + 3), BlockType.AIR);

  if (centerX === 0 && centerZ === 0) return raw;
  const shifted: StructureMap = new Map();
  for (const [key, t] of raw.entries()) {
    const [x, y, z] = key.split(",").map(Number);
    shifted.set(k(x + centerX, y, z + centerZ), t);
  }
  return shifted;
}
