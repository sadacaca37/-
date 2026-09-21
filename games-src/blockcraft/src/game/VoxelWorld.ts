import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, RaycastResult } from "../types";
import { Chunk, CHUNK_WIDTH, CHUNK_DEPTH, CHUNK_HEIGHT } from "./Chunk";
import { NoiseGenerator } from "./Noise";
import { VoxelTextureAtlas } from "./TextureAtlas";

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

  // Active physics queues for gravity blocks and fluid spread
  private gravityQueue: Array<{ x: number; y: number; z: number }> = [];
  private waterQueue: Array<{ x: number; y: number; z: number; step: number }> = [];
  private physicsTimer: number = 0;

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
  public findSafeSpawnXZ(originX: number = 0, originZ: number = 0, maxRadius: number = 48): { x: number; z: number } {
    const ox = Math.floor(originX);
    const oz = Math.floor(originZ);
    for (let radius = 0; radius <= maxRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== radius) continue;
          const wx = ox + dx;
          const wz = oz + dz;
          const column = this.computeTerrainColumn(wx, wz);
          if (column.riverFactor < 0.2 && column.surfaceHeight > SEA_LEVEL + BEACH_BAND) {
            return { x: wx + 0.5, z: wz + 0.5 };
          }
        }
      }
    }
    // Fallback: couldn't find dry land nearby (unlikely) - just use origin
    return { x: originX, z: originZ };
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
    const mountainMask = smoothstep(0.5, 0.8, mountainMaskRaw);

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

    const baseHeight = SEA_LEVEL + 5 + continental * 9 + (rolling - 0.5) * 6;
    const mountainHeight = mountainMask * ridge * 28;
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

    // Deep underground: Stone with occasional Diamond Ore
    const oreNoise = Math.sin(wx * 12.3 + wy * 31.7 + wz * 7.1);
    if (wy < 6 && oreNoise > 0.88) {
      return BlockType.DIAMOND_ORE;
    }

    return BlockType.STONE;
  }

  // Returns procedural block type at world coord
  private getProceduralBlock(wx: number, wy: number, wz: number): BlockType {
    if (wy < 0 || wy >= CHUNK_HEIGHT) return BlockType.AIR;
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
        const cellSize = 5;
        const cellX = Math.floor(wx / cellSize);
        const cellZ = Math.floor(wz / cellSize);
        const hasTree = hash2(cellX, cellZ) < 0.8; // 칸의 20%는 빈터로 남겨 둠
        // 칸 가장자리는 비워 둬서 옆 칸 나무와 최소 3칸은 떨어지게
        const treeX = cellX * cellSize + 1 + Math.floor(hash2(cellX + 17, cellZ - 9) * 3);
        const treeZ = cellZ * cellSize + 1 + Math.floor(hash2(cellX - 23, cellZ + 31) * 3);
        if (hasTree && wx === treeX && wz === treeZ) {
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

    // Handle Torch light management
    if (prevType === BlockType.TORCH && type !== BlockType.TORCH) {
      const light = this.torches.get(key);
      if (light) {
        this.worldGroup.remove(light);
        light.dispose();
        this.torches.delete(key);
      }
    } else if (type === BlockType.TORCH) {
      if (!this.torches.has(key)) {
        const torchLight = new THREE.PointLight(0xffb74d, 1.8, 11, 1.4);
        torchLight.position.set(bx + 0.5, by + 0.65, bz + 0.5);
        this.worldGroup.add(torchLight);
        this.torches.set(key, torchLight);
      }
    }

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

    // Trigger water flow simulation
    if (type === BlockType.WATER) {
      this.waterQueue.push({ x: bx, y: by, z: bz, step: 0 });
    }
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
    if (this.physicsTimer < 0.12) return; // 8-9 ticks per second for smooth, authentic block physics
    this.physicsTimer = 0;

    // 1. Tick Gravity Blocks (Sand, Gravel)
    if (this.gravityQueue.length > 0) {
      const nextGravityQueue: Array<{ x: number; y: number; z: number }> = [];
      for (const pos of this.gravityQueue) {
        const currentType = this.getBlock(pos.x, pos.y, pos.z);
        if (!BLOCK_DEFINITIONS[currentType]?.gravityAffected) continue;

        const belowY = pos.y - 1;
        if (belowY < 0) continue;

        const belowType = this.getBlock(pos.x, belowY, pos.z);
        if (belowType === BlockType.AIR || belowType === BlockType.WATER) {
          // Drop block down 1 block
          this.setBlock(pos.x, pos.y, pos.z, BlockType.AIR);
          this.setBlock(pos.x, belowY, pos.z, currentType);
          nextGravityQueue.push({ x: pos.x, y: belowY, z: pos.z });

          // Also check block above current position
          const aboveType = this.getBlock(pos.x, pos.y + 1, pos.z);
          if (BLOCK_DEFINITIONS[aboveType]?.gravityAffected) {
            nextGravityQueue.push({ x: pos.x, y: pos.y + 1, z: pos.z });
          }
        }
      }
      this.gravityQueue = nextGravityQueue;
    }

    // 2. Tick Water Flow
    if (this.waterQueue.length > 0) {
      const nextWaterQueue: Array<{ x: number; y: number; z: number; step: number }> = [];
      // Process batch of water flow steps
      const batch = this.waterQueue.splice(0, 12);
      for (const item of batch) {
        if (this.getBlock(item.x, item.y, item.z) !== BlockType.WATER) continue;

        // Try flowing downwards first
        const belowY = item.y - 1;
        if (belowY >= 0) {
          const belowType = this.getBlock(item.x, belowY, item.z);
          if (belowType === BlockType.AIR) {
            this.setBlock(item.x, belowY, item.z, BlockType.WATER);
            nextWaterQueue.push({ x: item.x, y: belowY, z: item.z, step: 0 });
            continue; // Downward flow takes priority
          }
        }

        // Otherwise spread horizontally if max flow step (4) not reached
        if (item.step < 4) {
          const neighbors = [
            { x: item.x + 1, y: item.y, z: item.z },
            { x: item.x - 1, y: item.y, z: item.z },
            { x: item.x, y: item.y, z: item.z + 1 },
            { x: item.x, y: item.y, z: item.z - 1 },
          ];
          for (const n of neighbors) {
            if (this.getBlock(n.x, n.y, n.z) === BlockType.AIR) {
              this.setBlock(n.x, n.y, n.z, BlockType.WATER);
              nextWaterQueue.push({ x: n.x, y: n.y, z: n.z, step: item.step + 1 });
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

    if (intersects.length > 0) {
      const hit = intersects[0];
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
