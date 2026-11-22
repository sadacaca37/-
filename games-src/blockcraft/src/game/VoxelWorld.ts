import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, RaycastResult } from "../types";
import { Chunk, CHUNK_WIDTH, CHUNK_DEPTH, CHUNK_HEIGHT } from "./Chunk";
import { NoiseGenerator } from "./Noise";
import { VoxelTextureAtlas } from "./TextureAtlas";
import { buildVillage, StructureMap } from "./Village";

/** 좌표로 정해지는 0~1 난수 (같은 자리는 언제나 같은 값) */
function hash2(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// ---------------------------------------------------------------------------
// Terrain generation tuning constants (multi-octave elevation, rivers, biomes)
// ---------------------------------------------------------------------------
const SEA_LEVEL = 22; // Water surface / beach reference height
const BEACH_BAND = 2; // surfaceHeight <= SEA_LEVEL + BEACH_BAND -> sand
const MOUNTAIN_BASE = SEA_LEVEL + 20; // Above this: exposed stone slopes
const SNOW_LEVEL = SEA_LEVEL + 28; // Above this: snow caps
const MAX_TERRAIN_HEIGHT = CHUNK_HEIGHT - 4;
const MIN_TERRAIN_HEIGHT = 4;
const RIVER_WIDTH = 0.05; // Narrow band around the "river noise" midline
const RIVER_BED_DEPTH = 3; // How far below sea level a river carves down to

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Per-column terrain description, computed once per (x, z) and reused for
// every block in that vertical stack (and for face-culling queries into
// not-yet-generated neighboring chunks).
interface TerrainColumn {
  surfaceHeight: number;
  riverFactor: number; // 0 = no river, 1 = river center
  isMountain: boolean; // true once above the rocky/snow threshold
  mountainMask: number; // 0 = 평지, 1 = 산악 지대 한가운데
}

export class VoxelWorld {
  public scene: THREE.Scene;
  public atlas: VoxelTextureAtlas;
  public noise: NoiseGenerator;
  public chunks: Map<string, Chunk> = new Map();
  public modifiedBlocks: Map<string, BlockType> = new Map();
  public worldGroup: THREE.Group;

  // Torches placed in the world with dynamic point lights
  public torches: Map<string, THREE.PointLight> = new Map();

  // Generated structures (starter village): world-block overrides applied on
  // top of terrain + trees when a chunk is built. Deterministic, so every
  // client in a room sees the same village without any network traffic.
  public structures: StructureMap = new Map();
  // Where players spawn: the village plaza (chosen on dry, flattish land)
  public spawnOrigin: { x: number; z: number } = { x: 0.5, z: 0.5 };
  private structuresByChunk: Map<string, Array<[number, number, number, BlockType]>> = new Map();

  // Active physics queues for gravity blocks and fluid spread
  private gravityQueue: Array<{ x: number; y: number; z: number }> = [];
  private waterQueue: Array<{ x: number; y: number; z: number; step: number; type?: BlockType; delay?: number }> = [];
  // Set while the physics tick itself places water, so those blocks are
  // "flowing" (they inherit a step) instead of becoming brand-new sources.
  private placingFlow: boolean = false;
  // Total blocks a stream may travel including drops (keeps a river leak finite)
  private static readonly MAX_FLOW_TOTAL = 14;

  // Small non-cube decorations (flower pot, lantern, torch) drawn as their
  // own little meshes instead of full textured cubes.
  private decor: Map<string, THREE.Object3D> = new Map();
  private decorGroup: THREE.Group = new THREE.Group();
  public static isDecorBlock(t: BlockType): boolean {
    return t === BlockType.FLOWER_POT || t === BlockType.LANTERN || t === BlockType.TORCH || t === BlockType.ANVIL || t === BlockType.FENCE;
  }
  private physicsTimer: number = 0;
  private gravityTimer: number = 0;
  // Falling blocks step down one block every GRAVITY_TICK seconds (was 0.12 — too fast)
  private static readonly GRAVITY_TICK = 0.28;

  // Hooks fired by the gravity/water simulation so the game can sync the
  // change to other players and react to heavy blocks landing.
  public onPhysicsBlockChange?: (x: number, y: number, z: number, type: BlockType) => void;
  public onFallingBlockLanded?: (x: number, y: number, z: number, type: BlockType, fallDistance: number) => void;
  public onFallingBlockMoved?: (x: number, y: number, z: number, type: BlockType) => void;
  private fallDistances: Map<string, number> = new Map();

  // Selection wireframe for targeted block
  public selectionBox: THREE.LineSegments;

  // Render distance in chunks radius
  public renderRadius: number = 3;

  // Sea level exposed for other systems (water rendering, fishing, etc.)
  public readonly seaLevel: number = SEA_LEVEL;

  // Chunk generation is spread across multiple frames (closest chunks first)
  // so that streaming in new terrain while the player moves/flies never
  // causes a single-frame hitch, however many chunks just entered range.
  private chunkGenQueue: Array<{ cx: number; cz: number }> = [];
  private chunkGenQueued: Set<string> = new Set();
  public maxChunkGenPerFrame: number = 3;

  constructor(scene: THREE.Scene, atlas: VoxelTextureAtlas, seed: number = 1337) {
    this.scene = scene;
    this.atlas = atlas;
    this.noise = new NoiseGenerator(seed);

    this.worldGroup = new THREE.Group();
    this.worldGroup.name = "voxel_world";
    this.scene.add(this.worldGroup);
    this.decorGroup.name = "decor";
    this.worldGroup.add(this.decorGroup);

    // Starter village: find dry, reasonably flat land near the origin, put
    // the village there and make its plaza the spawn point.
    const groundAt = (x: number, z: number) => this.computeTerrainColumn(x, z).surfaceHeight;
    const isWater = (x: number, z: number) => {
      const c = this.computeTerrainColumn(x, z);
      return c.riverFactor > 0.2 || c.surfaceHeight <= SEA_LEVEL + BEACH_BAND;
    };
    const center = this.findVillageCenter(isWater, groundAt);
    this.spawnOrigin = { x: center.x + 0.5, z: center.z + 0.5 };
    this.addStructure(buildVillage(groundAt, isWater, center.x, center.z));

    // Create selection outline box
    const boxGeo = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      linewidth: 2,
      depthTest: true,
      transparent: true,
      opacity: 0.85,
    });
    this.selectionBox = new THREE.LineSegments(edgesGeo, lineMat);
    this.selectionBox.visible = false;
    this.selectionBox.renderOrder = 10;
    this.scene.add(this.selectionBox);
  }

  public getChunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getBlockKey(x: number, y: number, z: number): string {
    return `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);

    if (by < 0 || by >= CHUNK_HEIGHT) return BlockType.AIR;

    // Check modified blocks first
    const key = `${bx},${by},${bz}`;
    if (this.modifiedBlocks.has(key)) {
      return this.modifiedBlocks.get(key)!;
    }

    const cx = Math.floor(bx / CHUNK_WIDTH);
    const cz = Math.floor(bz / CHUNK_DEPTH);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));

    if (!chunk) {
      // If chunk is not generated yet, calculate from terrain formula
      return this.getProceduralBlock(bx, by, bz);
    }

    const lx = bx - cx * CHUNK_WIDTH;
    const lz = bz - cz * CHUNK_DEPTH;
    return chunk.getBlock(lx, by, lz);
  }

  // Find a nearby dry-land (x, z) to spawn on: not inside a river/lake and
  // above the beach band. Spirals outward from (originX, originZ) so it
  // stays cheap even when the origin itself lands in a river or on a
  // shoreline — terrain columns are evaluated directly from the noise
  // functions, so this works before any chunk around the origin exists.
  /** 그 자리에 나무가 심기는지 (숲 생성과 같은 규칙) */
  public hasTreeAt(wx: number, wz: number): boolean {
    const cellSize = 10; // 10x10 칸마다 최대 한 그루 (나뭇잎이 크니 넉넉히 띄움)
    const cellX = Math.floor(wx / cellSize);
    const cellZ = Math.floor(wz / cellSize);
    if (hash2(cellX, cellZ) >= 0.8) return false; // 칸의 20%는 빈터
    const treeX = cellX * cellSize + 3 + Math.floor(hash2(cellX + 17, cellZ - 9) * 4);
    const treeZ = cellZ * cellSize + 3 + Math.floor(hash2(cellX - 23, cellZ + 31) * 4);
    if (wx !== treeX || wz !== treeZ) return false;
    return this.computeTerrainColumn(wx, wz).mountainMask <= 0.45;
  }

  /** 처음 태어나는 자리: 강·바닷가·산을 피해 평평한 평지를 찾음 */
  public findSafeSpawnXZ(originX: number = 0, originZ: number = 0, maxRadius: number = 64): { x: number; z: number } {
    const ox = Math.floor(originX);
    const oz = Math.floor(originZ);

    const isDryLand = (c: TerrainColumn) => c.riverFactor < 0.2 && c.surfaceHeight > SEA_LEVEL + BEACH_BAND;

    // 주변이 얼마나 평평한지 (높이 차이가 작을수록 평지)
    const flatnessAt = (wx: number, wz: number): number => {
      let min = Infinity;
      let max = -Infinity;
      for (let dx = -3; dx <= 3; dx += 3) {
        for (let dz = -3; dz <= 3; dz += 3) {
          const c = this.computeTerrainColumn(wx + dx, wz + dz);
          if (!isDryLand(c)) return Infinity;
          if (c.surfaceHeight < min) min = c.surfaceHeight;
          if (c.surfaceHeight > max) max = c.surfaceHeight;
        }
      }
      return max - min;
    };

    let fallback: { x: number; z: number } | null = null;
    for (let radius = 0; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const wx = ox + dx;
          const wz = oz + dz;
          const column = this.computeTerrainColumn(wx, wz);
          if (!isDryLand(column)) continue;
          if (!fallback) fallback = { x: wx + 0.5, z: wz + 0.5 };
          if (column.mountainMask > 0.12) continue; // 산은 피하고 평지로
          if (flatnessAt(wx, wz) > 2) continue; // 언덕배기도 피함
          // 나무 밑에서 시작하지 않도록 둘레를 비워 둠
          let treeNear = false;
          for (let tx = -6; tx <= 6 && !treeNear; tx++) {
            for (let tz = -6; tz <= 6; tz++) {
              if (this.hasTreeAt(wx + tx, wz + tz)) {
                treeNear = true;
                break;
              }
            }
          }
          if (treeNear) continue;
          return { x: wx + 0.5, z: wz + 0.5 };
        }
      }
    }
    // 평지를 못 찾으면 그냥 마른 땅, 그것도 없으면 원점
    return fallback ?? { x: originX, z: originZ };
  }

  // Returns highest solid block Y at world coordinate (wx, wz)
  public getSurfaceHeight(wx: number, wz: number): number {
    const bx = Math.floor(wx);
    const bz = Math.floor(wz);
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const b = this.getBlock(bx, y, bz);
      if (BLOCK_DEFINITIONS[b]?.solid) {
        return y;
      }
    }
    return 14;
  }

  // -------------------------------------------------------------------
  // Multi-octave elevation + mountain ridges + river carving + biome
  // layering. Computed once per (x, z) column and reused for every block
  // in that column, whether we're filling a freshly generated chunk or
  // answering a getBlock() query into a chunk that hasn't been built yet
  // (both paths must agree, or chunk seams / face-culling would desync).
  // -------------------------------------------------------------------
  private computeTerrainColumn(wx: number, wz: number): TerrainColumn {
    // 1. Large-scale continental noise: gentle base elevation across the
    //    whole map (very low frequency -> broad landmasses).
    const continental = this.noise.fbm2D(wx * 0.006, wz * 0.006, 3, 0.5);

    // 2. Rolling hills / plains detail (multi-octave, moderate frequency).
    const rolling = this.noise.fbm2D(wx * 0.025, wz * 0.025, 4, 0.5, 2.1);

    // 3. Mountain region mask: an independent low-frequency noise field,
    //    smoothstep-thresholded so mountain RANGES occupy large, smoothly
    //    bordered regions instead of speckling the whole map.
    const mountainMaskRaw = this.noise.fbm2D(wx * 0.007 + 500, wz * 0.007 + 500, 2, 0.5);
    // 산악 지대를 조금 더 넓게 잡아, 산은 확실히 산답게
    const mountainMask = smoothstep(0.46, 0.74, mountainMaskRaw);

    // 4. Ridged multifractal noise for jagged mountain peaks/ridges. Only
    //    contributes height where mountainMask is > 0, so plains and hills
    //    stay untouched by the ridge shape.
    let ridge = 0;
    let ridgeNorm = 0;
    let freq = 0.018;
    let amp = 1;
    for (let i = 0; i < 4; i++) {
      const n = this.noise.noise2D(wx * freq + 91, wz * freq + 91);
      const r = 1 - Math.abs(n * 2 - 1);
      ridge += r * r * amp;
      ridgeNorm += amp;
      freq *= 2.15;
      amp *= 0.5;
    }
    ridge /= ridgeNorm;

    // 평지는 아주 평평하게, 산 쪽으로 갈수록 울퉁불퉁하게
    const roughness = 0.25 + 0.75 * mountainMask;
    const baseHeight = SEA_LEVEL + 5 + continental * 9 * (0.45 + 0.55 * mountainMask) + (rolling - 0.5) * 6 * roughness;
    // 산은 더 높고 뾰족하게
    const mountainHeight = mountainMask * ridge * 40;
    let elevation = baseHeight + mountainHeight;

    // 5. River carving: a thin, winding band where a domain-warped noise
    //    field crosses its own midline. Rivers avoid the interior of
    //    mountain ranges (mostly) so they read as valleys, not canyons
    //    slicing through peaks.
    const warpX = wx + (this.noise.noise2D(wx * 0.003 + 77, wz * 0.003 + 77) - 0.5) * 40;
    const warpZ = wz + (this.noise.noise2D(wx * 0.003 + 177, wz * 0.003 + 177) - 0.5) * 40;
    const riverNoise = this.noise.fbm2D(warpX * 0.01 + 1000, warpZ * 0.01 + 1000, 2, 0.5);
    const riverLine = Math.abs(riverNoise * 2 - 1);
    let riverFactor = riverLine < RIVER_WIDTH ? 1 - riverLine / RIVER_WIDTH : 0;
    riverFactor *= 1 - mountainMask * 0.85; // faint mountain streams, strong lowland rivers

    if (riverFactor > 0) {
      const riverBed = SEA_LEVEL - RIVER_BED_DEPTH;
      elevation = elevation * (1 - riverFactor) + riverBed * riverFactor;
    }

    const surfaceHeight = Math.min(
      MAX_TERRAIN_HEIGHT,
      Math.max(MIN_TERRAIN_HEIGHT, Math.round(elevation))
    );

    return {
      surfaceHeight,
      riverFactor,
      isMountain: mountainMask > 0.05 && surfaceHeight >= MOUNTAIN_BASE,
      mountainMask,
    };
  }

  // Deterministic sand/gravel pick for river & beach beds (no extra state)
  private riverBedMaterial(wx: number, wz: number): BlockType {
    const n = this.noise.noise2D(wx * 0.3 + 300, wz * 0.3 + 300);
    return n > 0.45 ? BlockType.SAND : BlockType.GRAVEL;
  }

  // Surface (topmost solid) block for a column, given its biome layer
  private surfaceBlockFor(column: TerrainColumn, wx: number, wz: number): BlockType {
    if (column.riverFactor > 0.55) return this.riverBedMaterial(wx, wz);
    if (column.surfaceHeight <= SEA_LEVEL + BEACH_BAND) return BlockType.SAND;
    if (column.surfaceHeight >= SNOW_LEVEL) return BlockType.SNOW;
    if (column.surfaceHeight >= MOUNTAIN_BASE) return BlockType.STONE;
    return BlockType.GRASS;
  }

  // Full block-type resolution for one voxel, given its column's terrain info
  private blockAtColumn(column: TerrainColumn, wx: number, wy: number, wz: number): BlockType {
    if (wy <= 0) return BlockType.STONE; // Bedrock floor

    if (wy > column.surfaceHeight) {
      // Above the terrain surface: fill up to sea level with water
      // (river channels, lakes, ocean-level basins), air above that.
      if (wy <= SEA_LEVEL) return BlockType.WATER;
      return BlockType.AIR;
    }

    if (wy === column.surfaceHeight) {
      return this.surfaceBlockFor(column, wx, wz);
    }

    // Sub-surface layering, matched to the surface biome
    if (wy >= column.surfaceHeight - 3) {
      const surface = this.surfaceBlockFor(column, wx, wz);
      if (surface === BlockType.SAND || surface === BlockType.GRAVEL) {
        return this.riverBedMaterial(wx, wz);
      }
      if (surface === BlockType.STONE || surface === BlockType.SNOW) {
        return BlockType.STONE;
      }
      return BlockType.DIRT;
    }

    // Deep underground: stone with ore veins (coal shallow, iron mid, diamond deep)
    const oreNoise = Math.sin(wx * 12.3 + wy * 31.7 + wz * 7.1);
    const oreNoise2 = Math.sin(wx * 7.7 + wy * 19.1 + wz * 13.3 + 2.0);
    const oreNoise3 = Math.sin(wx * 5.1 + wy * 23.7 + wz * 9.9 + 4.0);
    // Diamonds: only in the deepslate layer and rare (about 1 in 400 deep blocks)
    if (wy < 8 && oreNoise > 0.985) return BlockType.DIAMOND_ORE;
    if (wy < 20 && oreNoise2 > 0.86) return BlockType.IRON_ORE;
    if (wy < 34 && oreNoise3 > 0.8) return BlockType.COAL_ORE;

    // Lava pools right above bedrock (y 1..4), in blobby patches
    if (wy >= 1 && wy <= 4) {
      const lavaNoise = Math.sin(wx * 0.33 + 1.3) * Math.cos(wz * 0.29 - 0.7) + Math.sin((wx + wz) * 0.11) * 0.4;
      if (lavaNoise > 0.95) return BlockType.LAVA;
    }

    // Deepslate below y=12 with a ragged transition band
    const deepEdge = 12 + Math.floor(((Math.sin(wx * 0.37 + wz * 0.23) + 1) / 2) * 3);
    if (wy < deepEdge) return BlockType.DEEPSLATE;

    return BlockType.STONE;
  }

  // Returns procedural block type at world coord
  // Spiral out from the origin and pick the first 44x44 area with no water
  // and little height variation (falls back to the least-bad candidate).
  private findVillageCenter(
    isWater: (x: number, z: number) => boolean,
    groundAt: (x: number, z: number) => number
  ): { x: number; z: number } {
    let best = { x: 0, z: 0, score: Infinity };
    const score = (cx: number, cz: number) => {
      let water = 0, minH = Infinity, maxH = -Infinity;
      for (let dx = -22; dx <= 22; dx += 4) {
        for (let dz = -22; dz <= 22; dz += 4) {
          if (isWater(cx + dx, cz + dz)) water++;
          const h = groundAt(cx + dx, cz + dz);
          if (h < minH) minH = h;
          if (h > maxH) maxH = h;
        }
      }
      return water * 10 + (maxH - minH);
    };
    for (let r = 0; r <= 120; r += 12) {
      const candidates: Array<[number, number]> = r === 0 ? [[0, 0]] : [];
      if (r > 0) {
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          candidates.push([Math.round(Math.cos(ang) * r), Math.round(Math.sin(ang) * r)]);
        }
      }
      for (const [cx, cz] of candidates) {
        const sc = score(cx, cz);
        if (sc < best.score) best = { x: cx, z: cz, score: sc };
        if (sc <= 6) return { x: cx, z: cz };
      }
    }
    return { x: best.x, z: best.z };
  }

  public addStructure(map: StructureMap) {
    for (const [key, type] of map.entries()) {
      this.structures.set(key, type);
      const [x, y, z] = key.split(",").map(Number);
      const ck = this.getChunkKey(Math.floor(x / CHUNK_WIDTH), Math.floor(z / CHUNK_DEPTH));
      let list = this.structuresByChunk.get(ck);
      if (!list) {
        list = [];
        this.structuresByChunk.set(ck, list);
      }
      list.push([x, y, z, type]);
    }
  }

  // Decoration models: flower pot (clay pot + flower), lantern (hanging box),
  // torch (stick + flame). The chunk mesher skips these block types.
  private syncDecor(bx: number, by: number, bz: number, prevType: BlockType, type: BlockType) {
    const key = `${bx},${by},${bz}`;
    const isDecor = VoxelWorld.isDecorBlock;
    if (isDecor(prevType) && prevType !== type) {
      const old = this.decor.get(key);
      if (old) {
        this.decorGroup.remove(old);
        this.decor.delete(key);
      }
    }
    if (isDecor(type) && !this.decor.has(key)) {
      const g = new THREE.Group();
      g.userData.blockKey = key;
      const lam = (c: number) => new THREE.MeshLambertMaterial({ color: c });
      if (type === BlockType.ANVIL) {
        // Classic anvil: wide base, narrow waist, long top with a horn
        const iron = lam(0x3f3f46), dark = lam(0x27272a);
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.2, 0.55), dark);
        base.position.set(0, 0.1, 0);
        const step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.4), iron);
        step.position.set(0, 0.26, 0);
        const waist = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), dark);
        waist.position.set(0, 0.45, 0);
        const top = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.28, 0.45), iron);
        top.position.set(0, 0.74, 0);
        const horn = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.28), iron);
        horn.position.set(0.56, 0.74, 0);
        g.add(base, step, waist, top, horn);
      } else if (type === BlockType.FENCE) {
        const wood = lam(0xa3702e);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, 0.25), wood);
        post.position.set(0, 0.5, 0);
        g.add(post);
        // Rails toward neighbouring fences / solid blocks
        const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dz] of dirs) {
          const n = this.getBlock(bx + dx, by, bz + dz);
          const connects = n === BlockType.FENCE || (n !== BlockType.AIR && !!BLOCK_DEFINITIONS[n]?.solid && !BLOCK_DEFINITIONS[n]?.transparent);
          if (!connects) continue;
          for (const ry of [0.38, 0.78]) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(dx !== 0 ? 0.5 : 0.12, 0.14, dz !== 0 ? 0.5 : 0.12), wood);
            rail.position.set(dx * 0.31, ry, dz * 0.31);
            g.add(rail);
          }
        }
      } else if (type === BlockType.FLOWER_POT) {
        const pot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.3, 0.36), lam(0xb45309));
        pot.position.set(0, 0.15, 0);
        const soil = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.28), lam(0x5b3a1e));
        soil.position.set(0, 0.31, 0);
        const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.05), lam(0x15803d));
        stem.position.set(0, 0.48, 0);
        const petals = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.2), lam(0xf472b6));
        petals.position.set(0, 0.66, 0);
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), lam(0xfde047));
        core.position.set(0, 0.66, 0);
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.08), lam(0x22c55e));
        leaf.position.set(0.08, 0.45, 0);
        g.add(pot, soil, stem, petals, core, leaf);
      } else if (type === BlockType.LANTERN) {
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.34), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
        body.position.set(0, 0.32, 0);
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.4), lam(0x1f2937));
        frame.position.set(0, 0.55, 0);
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.4), lam(0x1f2937));
        base.position.set(0, 0.09, 0);
        const chain = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), lam(0x374151));
        chain.position.set(0, 0.8, 0);
        for (const [px, pz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), lam(0x1f2937));
          post.position.set(px, 0.32, pz);
          g.add(post);
        }
        g.add(body, frame, base, chain);
      } else {
        const stick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 0.12), lam(0x92400e));
        stick.position.set(0, 0.3, 0);
        const flame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
        flame.position.set(0, 0.66, 0);
        g.add(stick, flame);
      }
      g.position.set(bx + 0.5, by, bz + 0.5);
      this.decorGroup.add(g);
      this.decor.set(key, g);
    }
    // Fences next door may need new rails (a fence/solid block appeared or vanished)
    if (!this.refreshingFences && (prevType !== type)) {
      this.refreshingFences = true;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
        const nx = bx + dx, nz = bz + dz;
        if (this.getBlock(nx, by, nz) === BlockType.FENCE) {
          const nk = `${nx},${by},${nz}`;
          const old = this.decor.get(nk);
          if (old) {
            this.decorGroup.remove(old);
            this.decor.delete(nk);
          }
          this.syncDecor(nx, by, nz, BlockType.AIR, BlockType.FENCE);
        }
      }
      this.refreshingFences = false;
    }
  }
  private refreshingFences: boolean = false;

  // Create/remove the point light that a light-emitting block carries
  private syncBlockLight(bx: number, by: number, bz: number, prevType: BlockType, type: BlockType) {
    const key = `${bx},${by},${bz}`;
    const prevLight = BLOCK_DEFINITIONS[prevType]?.lightLevel ?? 0;
    const newLight = BLOCK_DEFINITIONS[type]?.lightLevel ?? 0;
    if (prevLight > 0 && type !== prevType) {
      const light = this.torches.get(key);
      if (light) {
        this.worldGroup.remove(light);
        light.dispose();
        this.torches.delete(key);
      }
    }
    if (newLight > 0 && type !== BlockType.GLOWSTONE) {
      if (!this.torches.has(key)) {
        const isLantern = type === BlockType.LANTERN;
        const isEnchant = type === BlockType.ENCHANTING_TABLE;
        const torchLight = new THREE.PointLight(isEnchant ? 0xa78bfa : isLantern ? 0xffd27a : 0xffb74d, isEnchant ? 1.4 : isLantern ? 2.2 : 1.8, isEnchant ? 8 : isLantern ? 13 : 11, 1.4);
        torchLight.position.set(bx + 0.5, by + 0.65, bz + 0.5);
        this.worldGroup.add(torchLight);
        this.torches.set(key, torchLight);
      }
    }
  }

  private getProceduralBlock(wx: number, wy: number, wz: number): BlockType {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockType.AIR;
    const structured = this.structures.get(`${wx},${wy},${wz}`);
    if (structured !== undefined) return structured;
    const column = this.computeTerrainColumn(wx, wz);
    return this.blockAtColumn(column, wx, wy, wz);
  }

  // Generate terrain blocks for a newly created chunk
  private generateChunkTerrain(chunk: Chunk) {
    const startWx = chunk.chunkX * CHUNK_WIDTH;
    const startWz = chunk.chunkZ * CHUNK_DEPTH;

    // First pass: generate base terrain (one noise sample per column, reused
    // for every block in that vertical stack for both speed & consistency).
    for (let lz = 0; lz < CHUNK_DEPTH; lz++) {
      for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
        const wx = startWx + lx;
        const wz = startWz + lz;
        const column = this.computeTerrainColumn(wx, wz);

        for (let wy = 0; wy < CHUNK_HEIGHT; wy++) {
          const bType = this.blockAtColumn(column, wx, wy, wz);
          if (bType !== BlockType.AIR) {
            chunk.setBlock(lx, wy, lz, bType);
          }
        }
      }
    }

    // Second pass: Trees (Oak Log + Leaves)
    for (let lz = 2; lz < CHUNK_DEPTH - 2; lz++) {
      for (let lx = 2; lx < CHUNK_WIDTH - 2; lx++) {
        const wx = startWx + lx;
        const wz = startWz + lz;

        // 나무 위치: 4x4 칸마다 최대 한 그루 (예전에는 6칸 중 1칸꼴로 빽빽했음)
        // 7x7 칸마다 한 그루, 바위산에는 심지 않음
        if (this.hasTreeAt(wx, wz)) {
          // Find surface
          let surfaceY = -1;
          for (let y = CHUNK_HEIGHT - 7; y >= 6; y--) {
            if (chunk.getBlock(lx, y, lz) === BlockType.GRASS) {
              surfaceY = y;
              break;
            }
          }

          if (surfaceY > 0 && surfaceY + 6 < CHUNK_HEIGHT) {
            // Place 4 log blocks
            const trunkHeight = 4;
            for (let ty = 1; ty <= trunkHeight; ty++) {
              chunk.setBlock(lx, surfaceY + ty, lz, BlockType.WOOD);
            }

            // Leaves canopy (sphere-like 3x3 to 5x5)
            const topY = surfaceY + trunkHeight;
            for (let dy = -1; dy <= 2; dy++) {
              const radius = dy === 2 ? 1 : 2;
              for (let dx = -radius; dx <= radius; dx++) {
                for (let dz = -radius; dz <= radius; dz++) {
                  // Don't place in corners of outer radius
                  if (Math.abs(dx) === 2 && Math.abs(dz) === 2 && dy >= 1) continue;
                  const tlx = lx + dx;
                  const tly = topY + dy;
                  const tlz = lz + dz;

                  if (
                    tlx >= 0 &&
                    tlx < CHUNK_WIDTH &&
                    tly >= 0 &&
                    tly < CHUNK_HEIGHT &&
                    tlz >= 0 &&
                    tlz < CHUNK_DEPTH
                  ) {
                    if (chunk.getBlock(tlx, tly, tlz) === BlockType.AIR) {
                      chunk.setBlock(tlx, tly, tlz, BlockType.LEAVES);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Third pass: generated structures (village) override terrain and trees
    const structs = this.structuresByChunk.get(this.getChunkKey(chunk.chunkX, chunk.chunkZ));
    if (structs) {
      for (const [x, y, z, type] of structs) {
        if (y < 0 || y >= CHUNK_HEIGHT) continue;
        chunk.setBlock(x - startWx, y, z - startWz, type);
        // Only lamp posts (lantern on a fence) get a real point light — every
        // light makes all materials costlier, so indoor lanterns stay visual-only.
        if (type === BlockType.LANTERN && this.structures.get(`${x},${y - 1},${z}`) === BlockType.FENCE) {
          this.syncBlockLight(x, y, z, BlockType.AIR, type);
        }
      }
      // Decor models after every structure block exists (fence rails need neighbours)
      this.refreshingFences = true;
      for (const [x, y, z, type] of structs) {
        if (VoxelWorld.isDecorBlock(type)) this.syncDecor(x, y, z, BlockType.AIR, type);
      }
      this.refreshingFences = false;
    }

    // Apply any previously stored user modifications in this chunk
    for (const [key, type] of this.modifiedBlocks.entries()) {
      const [bx, by, bz] = key.split(",").map(Number);
      const cx = Math.floor(bx / CHUNK_WIDTH);
      const cz = Math.floor(bz / CHUNK_DEPTH);
      if (cx === chunk.chunkX && cz === chunk.chunkZ) {
        const lx = bx - cx * CHUNK_WIDTH;
        const lz = bz - cz * CHUNK_DEPTH;
        chunk.setBlock(lx, by, lz, type);
      }
    }
  }

  // Set or update a block in the world
  public setBlock(x: number, y: number, z: number, type: BlockType) {
    const bx = Math.floor(x);
    const by = Math.floor(y);
    const bz = Math.floor(z);

    if (by < 0 || by >= CHUNK_HEIGHT) return;

    const key = `${bx},${by},${bz}`;
    const prevType = this.getBlock(bx, by, bz);

    // Light-emitting blocks (torch, lantern, enchanting table)
    this.syncBlockLight(bx, by, bz, prevType, type);

    this.modifiedBlocks.set(key, type);

    const cx = Math.floor(bx / CHUNK_WIDTH);
    const cz = Math.floor(bz / CHUNK_DEPTH);
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));

    if (chunk) {
      const lx = bx - cx * CHUNK_WIDTH;
      const lz = bz - cz * CHUNK_DEPTH;
      chunk.setBlock(lx, by, lz, type);
      this.rebuildChunkMesh(chunk);

      // If at chunk boundaries, rebuild neighbor chunks so their face culling updates
      if (lx === 0) this.rebuildChunkAt(cx - 1, cz);
      if (lx === CHUNK_WIDTH - 1) this.rebuildChunkAt(cx + 1, cz);
      if (lz === 0) this.rebuildChunkAt(cx, cz - 1);
      if (lz === CHUNK_DEPTH - 1) this.rebuildChunkAt(cx, cz + 1);
    }

    // Trigger gravity block checks
    const meta = BLOCK_DEFINITIONS[type];
    if (meta?.gravityAffected) {
      this.gravityQueue.push({ x: bx, y: by, z: bz });
    }
    // If block beneath was broken, check if block above is gravity affected
    if (type === BlockType.AIR) {
      const aboveType = this.getBlock(bx, by + 1, bz);
      if (BLOCK_DEFINITIONS[aboveType]?.gravityAffected) {
        this.gravityQueue.push({ x: bx, y: by + 1, z: bz });
      }
    }

    // Trigger water flow simulation. Water placed by a player (or terrain
    // edits) is a SOURCE (step 0). Water the physics tick places is flowing
    // water and carries its own step, so it never re-seeds a fresh source.
    if (type === BlockType.WATER || type === BlockType.LAVA) {
      if (!this.placingFlow) this.waterQueue.push({ x: bx, y: by, z: bz, step: 0, type });
    } else if (type === BlockType.AIR) {
      // A gap opened next to water: neighbours leak in, but only a little
      const around = [
        [bx + 1, by, bz], [bx - 1, by, bz], [bx, by, bz + 1], [bx, by, bz - 1], [bx, by + 1, bz],
      ];
      for (const [nx, ny, nz] of around) {
        const nt = this.getBlock(nx, ny, nz);
        if (nt === BlockType.WATER || nt === BlockType.LAVA) {
          this.waterQueue.push({ x: nx, y: ny, z: nz, step: 3, type: nt, delay: nt === BlockType.LAVA ? 3 : 0 });
        }
      }
    }

    // Decorations: swap the cube for a little model
    this.syncDecor(bx, by, bz, prevType, type);
  }

  // Check if a torch light is within given radius
  public isTorchNearby(wx: number, wy: number, wz: number, radius: number = 9): boolean {
    const rSq = radius * radius;
    for (const light of this.torches.values()) {
      const dx = light.position.x - wx;
      const dy = light.position.y - wy;
      const dz = light.position.z - wz;
      if (dx * dx + dy * dy + dz * dz <= rSq) {
        return true;
      }
    }
    return false;
  }

  // Physics update for gravity blocks (sand/gravel) and water flow
  public updatePhysics(deltaTime: number) {
    this.physicsTimer += deltaTime;
    this.gravityTimer += deltaTime;
    if (this.physicsTimer < 0.14) return;
    this.physicsTimer = 0;
    const gravityTick = this.gravityTimer >= VoxelWorld.GRAVITY_TICK;
    if (gravityTick) this.gravityTimer = 0;

    // 1. Tick Gravity Blocks (Sand, Gravel, Anvil)
    if (gravityTick && this.gravityQueue.length > 0) {
      const nextGravityQueue: Array<{ x: number; y: number; z: number }> = [];
      const seen = new Set<string>();
      for (const pos of this.gravityQueue) {
        const key = `${pos.x},${pos.y},${pos.z}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const currentType = this.getBlock(pos.x, pos.y, pos.z);
        if (!BLOCK_DEFINITIONS[currentType]?.gravityAffected) continue;

        const belowY = pos.y - 1;
        if (belowY < 0) continue;

        const belowType = this.getBlock(pos.x, belowY, pos.z);
        const belowMeta = BLOCK_DEFINITIONS[belowType];
        const canFallInto = belowType === BlockType.AIR || belowType === BlockType.WATER || belowMeta?.isFluid || belowMeta?.solid === false;
        if (canFallInto) {
          // Drop block down 1 block
          this.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);
          this.setBlock(pos.x, belowY, pos.z, currentType);
          if (this.onPhysicsBlockChange) {
            this.onPhysicsBlockChange(pos.x, pos.y, pos.z, BlockType.AIR);
            this.onPhysicsBlockChange(pos.x, belowY, pos.z, currentType);
          }
          const dist = (this.fallDistances.get(key) ?? 0) + 1;
          this.fallDistances.delete(key);
          this.fallDistances.set(`${pos.x},${belowY},${pos.z}`, dist);
          if (this.onFallingBlockMoved) this.onFallingBlockMoved(pos.x, belowY, pos.z, currentType);
          nextGravityQueue.push({ x: pos.x, y: belowY, z: pos.z });

          // Also check block above current position (stacked sand falls as a column)
          const aboveType = this.getBlock(pos.x, pos.y + 1, pos.z);
          if (BLOCK_DEFINITIONS[aboveType]?.gravityAffected) {
            nextGravityQueue.push({ x: pos.x, y: pos.y + 1, z: pos.z });
          }
        } else {
          // Landed on something solid
          const dist = this.fallDistances.get(key) ?? 0;
          this.fallDistances.delete(key);
          if (dist > 0 && this.onFallingBlockLanded) {
            this.onFallingBlockLanded(pos.x, pos.y, pos.z, currentType, dist);
          }
        }
      }
      this.gravityQueue = nextGravityQueue;
    }

    // 2. Tick Water Flow
    if (this.waterQueue.length > 0) {
      const nextWaterQueue: Array<{ x: number; y: number; z: number; step: number; type?: BlockType; delay?: number }> = [];
      // Process batch of water flow steps
      const batch = this.waterQueue.splice(0, 12);
      for (const item of batch) {
        const fluid = item.type ?? BlockType.WATER;
        const isLava = fluid === BlockType.LAVA;
        // Lava is sluggish: each step waits a few ticks
        if (item.delay && item.delay > 0) {
          nextWaterQueue.push({ ...item, delay: item.delay - 1 });
          continue;
        }
        if (this.getBlock(item.x, item.y, item.z) !== fluid) continue;

        const other = isLava ? BlockType.WATER : BlockType.LAVA;
        // Fluids can enter air and wash away small decorations (torch, flower pot, lantern)
        const canFlowInto = (t: BlockType) => t === BlockType.AIR || (t !== BlockType.WATER && t !== BlockType.LAVA && BLOCK_DEFINITIONS[t]?.solid === false);
        const maxH = isLava ? 3 : 6;
        const nextDelay = isLava ? 3 : 0;
        // step encodes: total blocks travelled (hundreds) + horizontal distance (max 6)
        const total = Math.floor(item.step / 100);
        const hstep = item.step % 100;
        if (total >= VoxelWorld.MAX_FLOW_TOTAL) continue;

        // Try flowing downwards first
        const belowY = item.y - 1;
        if (belowY >= 0) {
          const belowType = this.getBlock(item.x, belowY, item.z);
          if (belowType === other) {
            // Water meets lava: it hardens into cobblestone
            this.setBlock(item.x, belowY, item.z, BlockType.COBBLESTONE);
            continue;
          }
          if (canFlowInto(belowType)) {
            this.placingFlow = true;
            this.setBlock(item.x, belowY, item.z, fluid);
            this.placingFlow = false;
            nextWaterQueue.push({ x: item.x, y: belowY, z: item.z, step: (total + 1) * 100, type: fluid, delay: nextDelay });
            continue; // Downward flow takes priority
          }
        }

        // Otherwise spread horizontally if max flow distance not reached
        if (hstep < maxH) {
          const neighbors = [
            { x: item.x + 1, y: item.y, z: item.z },
            { x: item.x - 1, y: item.y, z: item.z },
            { x: item.x, y: item.y, z: item.z + 1 },
            { x: item.x, y: item.y, z: item.z - 1 },
          ];
          for (const n of neighbors) {
            const nt = this.getBlock(n.x, n.y, n.z);
            if (nt === other) {
              this.setBlock(n.x, n.y, n.z, BlockType.COBBLESTONE);
              continue;
            }
            if (canFlowInto(nt)) {
              this.placingFlow = true;
              this.setBlock(n.x, n.y, n.z, fluid);
              this.placingFlow = false;
              nextWaterQueue.push({ x: n.x, y: n.y, z: n.z, step: (total + 1) * 100 + hstep + 1, type: fluid, delay: nextDelay });
            }
          }
        }
      }
      this.waterQueue.push(...nextWaterQueue);
    }
  }

  private rebuildChunkAt(cx: number, cz: number) {
    const chunk = this.chunks.get(this.getChunkKey(cx, cz));
    if (chunk) {
      this.rebuildChunkMesh(chunk);
    }
  }

  public rebuildChunkMesh(chunk: Chunk) {
    this.worldGroup.remove(chunk.group);
    const group = chunk.buildMesh(this.atlas, (wx, wy, wz) => this.getBlock(wx, wy, wz));
    this.worldGroup.add(group);
  }

  // Load / unload chunks dynamically around player position. Chunk terrain
  // generation itself is O(1) per call (queued), so this can be called every
  // frame to stream in an effectively infinite world with no per-frame spike:
  // only `maxChunkGenPerFrame` chunks are actually built on any given frame,
  // closest to the player first.
  public updateChunksAroundPlayer(playerX: number, playerZ: number) {
    const centerCx = Math.floor(playerX / CHUNK_WIDTH);
    const centerCz = Math.floor(playerZ / CHUNK_DEPTH);
    const r = this.renderRadius;

    const activeKeys = new Set<string>();

    // 1. Enqueue any missing chunks within range (skip ones already built
    //    or already waiting in the generation queue).
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const cx = centerCx + dx;
        const cz = centerCz + dz;
        const key = this.getChunkKey(cx, cz);
        activeKeys.add(key);

        if (!this.chunks.has(key) && !this.chunkGenQueued.has(key)) {
          this.chunkGenQueue.push({ cx, cz });
          this.chunkGenQueued.add(key);
        }
      }
    }

    // 2. Drop queued chunks the player has since moved away from, so the
    //    queue never grows unbounded while flying/sprinting.
    if (this.chunkGenQueue.length > 0) {
      this.chunkGenQueue = this.chunkGenQueue.filter((item) => {
        const dist = Math.max(Math.abs(item.cx - centerCx), Math.abs(item.cz - centerCz));
        if (dist > r) {
          this.chunkGenQueued.delete(this.getChunkKey(item.cx, item.cz));
          return false;
        }
        return true;
      });
    }

    // 3. Build the closest queued chunks first, capped per frame.
    if (this.chunkGenQueue.length > 0) {
      this.chunkGenQueue.sort((a, b) => {
        const da = Math.abs(a.cx - centerCx) + Math.abs(a.cz - centerCz);
        const db = Math.abs(b.cx - centerCx) + Math.abs(b.cz - centerCz);
        return da - db;
      });

      let built = 0;
      while (built < this.maxChunkGenPerFrame && this.chunkGenQueue.length > 0) {
        const { cx, cz } = this.chunkGenQueue.shift()!;
        const key = this.getChunkKey(cx, cz);
        this.chunkGenQueued.delete(key);
        if (this.chunks.has(key)) continue;

        const chunk = new Chunk(cx, cz);
        this.generateChunkTerrain(chunk);
        this.chunks.set(key, chunk);
        this.rebuildChunkMesh(chunk);
        built++;
      }
    }

    // 4. Unload far chunks to preserve memory & FPS
    for (const [key, chunk] of this.chunks.entries()) {
      if (!activeKeys.has(key)) {
        const dist = Math.max(
          Math.abs(chunk.chunkX - centerCx),
          Math.abs(chunk.chunkZ - centerCz)
        );
        if (dist > r + 1) {
          this.worldGroup.remove(chunk.group);
          chunk.dispose();
          this.chunks.delete(key);
        }
      }
    }
  }

  // Fast raycast from camera into voxel world
  public raycast(
    camera: THREE.Camera,
    maxDistance: number = 6.5
  ): RaycastResult {
    const raycaster = new THREE.Raycaster();
    // Ray from screen center
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    raycaster.far = maxDistance;

    // Collect all chunk meshes
    const meshes: THREE.Mesh[] = [];
    for (const chunk of this.chunks.values()) {
      if (chunk.mesh) meshes.push(chunk.mesh);
      if (chunk.transparentMesh) meshes.push(chunk.transparentMesh);
    }

    const intersects = raycaster.intersectObjects(meshes, false);
    // Decorations (torch, lantern, pot, anvil, fence) are separate models
    const decorHits = raycaster.intersectObjects(this.decorGroup.children, true);
    for (const h of decorHits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.blockKey) o = o.parent;
      if (!o) continue;
      const [bx, by, bz] = (o.userData.blockKey as string).split(",").map(Number);
      // Insert into the ordered list so the nearest thing wins
      (intersects as any).push({ ...h, decorBlock: [bx, by, bz] });
    }
    intersects.sort((a, b) => a.distance - b.distance);

    // Water can't be targeted (you can't mine it, and placing happens against
    // the solid block behind it) — skip water hits and take the next one.
    for (const hit of intersects) {
      const decorBlock = (hit as any).decorBlock as [number, number, number] | undefined;
      if (decorBlock && hit.face) {
        const n = hit.face.normal.clone();
        // Snap the normal to the dominant axis so placement lands on a neighbour cell
        const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        const snapped = ax >= ay && ax >= az ? [Math.sign(n.x), 0, 0] : ay >= az ? [0, Math.sign(n.y), 0] : [0, 0, Math.sign(n.z)];
        return {
          hit: true,
          point: [hit.point.x, hit.point.y, hit.point.z],
          blockPos: decorBlock,
          faceNormal: snapped as [number, number, number],
          blockType: this.getBlock(decorBlock[0], decorBlock[1], decorBlock[2]),
          distance: hit.distance,
        };
      }
      if (hit.point && hit.face) {
        const probeNormal = hit.face.normal;
        const probe = hit.point.clone().sub(probeNormal.clone().multiplyScalar(0.05));
        const pType = this.getBlock(Math.floor(probe.x), Math.floor(probe.y), Math.floor(probe.z));
        if (pType === BlockType.WATER || pType === BlockType.LAVA) continue;
      }
      if (hit.point && hit.face) {
        const normal = hit.face.normal.clone();
        // Shift point slightly inside the block along opposite normal
        const inside = hit.point.clone().sub(normal.clone().multiplyScalar(0.05));
        const bx = Math.floor(inside.x);
        const by = Math.floor(inside.y);
        const bz = Math.floor(inside.z);

        const bType = this.getBlock(bx, by, bz);

        return {
          hit: true,
          point: [hit.point.x, hit.point.y, hit.point.z],
          blockPos: [bx, by, bz],
          faceNormal: [normal.x, normal.y, normal.z],
          blockType: bType,
          distance: hit.distance,
        };
      }
    }

    return { hit: false };
  }

  // Update visual selection box
  public updateSelectionBox(result: RaycastResult) {
    if (result.hit && result.blockPos) {
      const [bx, by, bz] = result.blockPos;
      this.selectionBox.position.set(bx + 0.5, by + 0.5, bz + 0.5);
      this.selectionBox.visible = true;
    } else {
      this.selectionBox.visible = false;
    }
  }

  // Apply batch modified blocks (e.g. when joining multiplayer room)
  public applyModifiedBlocks(mods: Record<string, number>) {
    if (!mods) return;
    for (const [key, type] of Object.entries(mods)) {
      this.modifiedBlocks.set(key, type as BlockType);
      const [bx, by, bz] = key.split(",").map(Number);
      const cx = Math.floor(bx / CHUNK_WIDTH);
      const cz = Math.floor(bz / CHUNK_DEPTH);
      const chunk = this.chunks.get(this.getChunkKey(cx, cz));
      if (chunk) {
        const lx = bx - cx * CHUNK_WIDTH;
        const lz = bz - cz * CHUNK_DEPTH;
        chunk.setBlock(lx, by, lz, type as BlockType);
        this.rebuildChunkMesh(chunk);
      }
    }
  }

  public dispose() {
    for (const chunk of this.chunks.values()) {
      chunk.dispose();
    }
    this.chunks.clear();
    this.scene.remove(this.worldGroup);
    this.scene.remove(this.selectionBox);
  }
}
