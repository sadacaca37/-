import * as THREE from "three";
import { BlockType } from "../types";

export interface AtlasTile {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

// 8x8 grid of 16x16 tiles -> 128x128 atlas
const GRID_SIZE = 8;
const TILE_PX = 16;
const ATLAS_PX = GRID_SIZE * TILE_PX; // 128

export enum TileID {
  GRASS_TOP = 0,
  GRASS_SIDE = 1,
  DIRT = 2,
  STONE = 3,
  WOOD_SIDE = 4,
  WOOD_TOP = 5,
  LEAVES = 6,
  PLANK = 7,
  BRICK = 8,
  GLASS = 9,
  COBBLESTONE = 10,
  SAND = 11,
  DIAMOND_ORE = 12,
  OBSIDIAN = 13,
  GOLD_BLOCK = 14,
  TNT_SIDE = 15,
  TNT_TOP = 16,
  BOOKSHELF = 17,
  GLOWSTONE = 18,
  TORCH = 19,
  WATER = 20,
  GRAVEL = 21,
  CRAFTING_TOP = 22,
  CRAFTING_SIDE = 23,
  COAL = 24,
  IRON_INGOT = 25,
  SNOW = 26,
}

// Deterministic pseudo-random noise for pixel art
function noise(x: number, y: number, seed: number = 42): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
  return n - Math.floor(n);
}

export class VoxelTextureAtlas {
  public atlasTexture: THREE.CanvasTexture;
  public opaqueMaterial: THREE.MeshLambertMaterial;
  public transparentMaterial: THREE.MeshLambertMaterial;
  public icons: Record<BlockType, string> = {} as any;

  private tileMap: Record<TileID, AtlasTile> = {} as any;

  constructor() {
    const canvas = document.createElement("canvas");
    canvas.width = ATLAS_PX;
    canvas.height = ATLAS_PX;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.imageSmoothingEnabled = false;

    // Helper to paint a 16x16 tile into the atlas
    const paintTile = (
      tileId: TileID,
      painter: (tctx: CanvasRenderingContext2D, px: number, py: number) => void
    ) => {
      const col = tileId % GRID_SIZE;
      const row = Math.floor(tileId / GRID_SIZE);
      const startX = col * TILE_PX;
      const startY = row * TILE_PX;

      // Temporary canvas for single tile
      const tCanvas = document.createElement("canvas");
      tCanvas.width = TILE_PX;
      tCanvas.height = TILE_PX;
      const tCtx = tCanvas.getContext("2d")!;
      tCtx.imageSmoothingEnabled = false;

      painter(tCtx, TILE_PX, TILE_PX);
      ctx.drawImage(tCanvas, startX, startY);

      // Calculate UV coordinates (WebGL UV: (0,0) is bottom-left)
      const u0 = col / GRID_SIZE;
      const u1 = (col + 1) / GRID_SIZE;
      const v0 = 1 - (row + 1) / GRID_SIZE;
      const v1 = 1 - row / GRID_SIZE;

      this.tileMap[tileId] = { u0, v0, u1, v1 };
    };

    // 1. DIRT
    paintTile(TileID.DIRT, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 101);
          const v = Math.floor(n * 24);
          tctx.fillStyle = `rgb(${134 + v},${96 + v},${67 + v})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 2. GRASS TOP
    paintTile(TileID.GRASS_TOP, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 202);
          const r = Math.floor(82 + n * 24);
          const g = Math.floor(142 + n * 40);
          const b = Math.floor(42 + n * 18);
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 3. GRASS SIDE
    paintTile(TileID.GRASS_SIDE, (tctx) => {
      // Dirt base
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 101);
          const v = Math.floor(n * 24);
          tctx.fillStyle = `rgb(${134 + v},${96 + v},${67 + v})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
      // Grass overhang
      for (let x = 0; x < TILE_PX; x++) {
        const overhang = Math.floor(2 + noise(x, 0, 303) * 3);
        for (let y = 0; y < overhang; y++) {
          const n = noise(x, y, 404);
          const r = Math.floor(82 + n * 24);
          const g = Math.floor(142 + n * 40);
          const b = Math.floor(42 + n * 18);
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 4. STONE
    paintTile(TileID.STONE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 505);
          const shade = Math.floor(115 + n * 35);
          const speck = noise(x, y, 606) > 0.82 ? (noise(x, y, 707) > 0.5 ? 20 : -20) : 0;
          const v = Math.min(255, Math.max(0, shade + speck));
          tctx.fillStyle = `rgb(${v},${v},${v})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 5. WOOD SIDE
    paintTile(TileID.WOOD_SIDE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const column = (x % 3 === 0 ? -12 : 8);
          const grain = noise(x, y, 808) * 18;
          const base = 85 + column + grain;
          tctx.fillStyle = `rgb(${Math.floor(base * 1.1)},${Math.floor(base * 0.8)},${Math.floor(base * 0.5)})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 6. WOOD TOP
    paintTile(TileID.WOOD_TOP, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const dx = x - 7.5;
          const dy = y - 7.5;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= 7) {
            tctx.fillStyle = "#543d2b";
          } else {
            const ring = Math.sin(dist * 2.3) * 14;
            const base = 155 + ring + noise(x, y, 909) * 14;
            tctx.fillStyle = `rgb(${Math.floor(base * 1.05)},${Math.floor(base * 0.85)},${Math.floor(base * 0.6)})`;
          }
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 7. LEAVES
    paintTile(TileID.LEAVES, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 1010);
          if (n > 0.78) {
            tctx.clearRect(x, y, 1, 1);
          } else {
            const r = Math.floor(35 + n * 30);
            const g = Math.floor(100 + n * 60);
            const b = Math.floor(18 + n * 22);
            tctx.fillStyle = `rgb(${r},${g},${b})`;
            tctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 8. PLANK
    paintTile(TileID.PLANK, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        const isSeam = y % 4 === 3;
        for (let x = 0; x < TILE_PX; x++) {
          if (isSeam) {
            tctx.fillStyle = "#694d29";
          } else {
            const n = noise(x, y, 1111);
            const base = 150 + n * 24;
            tctx.fillStyle = `rgb(${Math.floor(base * 1.15)},${Math.floor(base * 0.88)},${Math.floor(base * 0.55)})`;
          }
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 9. BRICK
    paintTile(TileID.BRICK, (tctx) => {
      tctx.fillStyle = "#b5a398";
      tctx.fillRect(0, 0, TILE_PX, TILE_PX);
      for (let row = 0; row < 4; row++) {
        const yStart = row * 4;
        const offset = row % 2 === 0 ? 0 : 4;
        for (let col = -1; col < 3; col++) {
          const xStart = col * 8 + offset;
          for (let by = 0; by < 3; by++) {
            for (let bx = 0; bx < 7; bx++) {
              const px = xStart + bx;
              const py = yStart + by;
              if (px >= 0 && px < TILE_PX && py >= 0 && py < TILE_PX) {
                const n = noise(px, py, 1212);
                tctx.fillStyle = `rgb(${Math.floor(155 + n * 35)},${Math.floor(65 + n * 25)},${Math.floor(50 + n * 20)})`;
                tctx.fillRect(px, py, 1, 1);
              }
            }
          }
        }
      }
    });

    // 10. GLASS
    paintTile(TileID.GLASS, (tctx) => {
      tctx.fillStyle = "rgba(180, 230, 255, 0.25)";
      tctx.fillRect(0, 0, TILE_PX, TILE_PX);
      tctx.fillStyle = "rgba(220, 245, 255, 0.9)";
      tctx.strokeRect(0.5, 0.5, 15, 15);
      tctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      tctx.fillRect(3, 3, 2, 2);
      tctx.fillRect(5, 5, 2, 2);
      tctx.fillRect(11, 11, 2, 2);
    });

    // 11. COBBLESTONE
    paintTile(TileID.COBBLESTONE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 1313);
          const isSeam = (x % 5 === 0 && y % 3 === 0) || ((x + y) % 7 === 0);
          const val = isSeam ? Math.floor(60 + n * 20) : Math.floor(100 + n * 35);
          tctx.fillStyle = `rgb(${val},${val},${val})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 12. SAND
    paintTile(TileID.SAND, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 1414);
          tctx.fillStyle = `rgb(${Math.floor(215 + n * 22)},${Math.floor(198 + n * 18)},${Math.floor(135 + n * 18)})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // SNOW (mountain peak biome layer)
    paintTile(TileID.SNOW, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 1919);
          const v = Math.floor(232 + n * 20);
          tctx.fillStyle = `rgb(${v},${v},${Math.min(255, v + 6)})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 13. DIAMOND ORE
    paintTile(TileID.DIAMOND_ORE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 505);
          const shade = Math.floor(115 + n * 35);
          tctx.fillStyle = `rgb(${shade},${shade},${shade})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
      const gemPositions = [
        [3, 4], [4, 4], [4, 5],
        [10, 3], [11, 3], [10, 4],
        [6, 9], [7, 9], [7, 10], [8, 10],
        [11, 12], [12, 12], [12, 13],
      ];
      for (const [gx, gy] of gemPositions) {
        tctx.fillStyle = "#5ffbf1";
        tctx.fillRect(gx, gy, 1, 1);
        if (gx > 0) {
          tctx.fillStyle = "#2aa8a0";
          tctx.fillRect(gx - 1, gy, 1, 1);
        }
      }
    });

    // 14. OBSIDIAN
    paintTile(TileID.OBSIDIAN, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 999);
          const r = Math.floor(18 + n * 16);
          const g = Math.floor(10 + n * 12);
          const b = Math.floor(35 + n * 30);
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
      // Purple crystal flecks
      const flecks = [[3, 5], [7, 2], [11, 8], [4, 13], [13, 12]];
      for (const [fx, fy] of flecks) {
        tctx.fillStyle = "#8a4af3";
        tctx.fillRect(fx, fy, 1, 1);
      }
    });

    // 15. GOLD BLOCK
    paintTile(TileID.GOLD_BLOCK, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 777);
          const isBorder = x === 0 || y === 0 || x === 15 || y === 15;
          const isInner = x === 1 || y === 1 || x === 14 || y === 14;
          if (isBorder) {
            tctx.fillStyle = "#d4a017";
          } else if (isInner) {
            tctx.fillStyle = "#fff380";
          } else {
            const val = Math.floor(220 + n * 30);
            tctx.fillStyle = `rgb(${val},${Math.floor(val * 0.85)},30)`;
          }
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 16. TNT SIDE
    paintTile(TileID.TNT_SIDE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const isBand = y >= 6 && y <= 9;
          if (isBand) {
            tctx.fillStyle = "#f5f5f5";
          } else {
            const n = noise(x, y, 888);
            tctx.fillStyle = `rgb(${Math.floor(200 + n * 40)},30,25)`;
          }
          tctx.fillRect(x, y, 1, 1);
        }
      }
      // TNT text in black on white band
      tctx.fillStyle = "#111111";
      // T
      tctx.fillRect(2, 6, 3, 1);
      tctx.fillRect(3, 7, 1, 3);
      // N
      tctx.fillRect(6, 6, 1, 4);
      tctx.fillRect(7, 7, 1, 2);
      tctx.fillRect(8, 6, 1, 4);
      // T
      tctx.fillRect(11, 6, 3, 1);
      tctx.fillRect(12, 7, 1, 3);
    });

    // 17. TNT TOP
    paintTile(TileID.TNT_TOP, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 666);
          tctx.fillStyle = `rgb(${Math.floor(180 + n * 40)},35,25)`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
      // Fuse center
      tctx.fillStyle = "#444444";
      tctx.fillRect(7, 7, 2, 2);
      tctx.fillStyle = "#cccccc";
      tctx.fillRect(7, 6, 1, 1);
    });

    // 18. BOOKSHELF
    paintTile(TileID.BOOKSHELF, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          // Wood frame
          const isFrame = y < 2 || y === 7 || y === 8 || y > 13 || x === 0 || x === 15;
          if (isFrame) {
            const n = noise(x, y, 333);
            tctx.fillStyle = `rgb(${160 + Math.floor(n * 20)},${115 + Math.floor(n * 15)},60)`;
          } else {
            // Book spines
            const colors = ["#b91c1c", "#1d4ed8", "#15803d", "#a16207", "#7e22ce"];
            const colorIdx = Math.floor(noise(x, y < 7 ? 1 : 2, 123) * colors.length);
            tctx.fillStyle = colors[colorIdx];
          }
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 19. GLOWSTONE
    paintTile(TileID.GLOWSTONE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 444);
          const r = Math.floor(230 + n * 25);
          const g = Math.floor(180 + n * 50);
          const b = Math.floor(80 + n * 50);
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 20. TORCH (16x16 with wooden stick and flame tip)
    paintTile(TileID.TORCH, (tctx) => {
      // Clear
      tctx.clearRect(0, 0, TILE_PX, TILE_PX);
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const isStick = x >= 7 && x <= 8 && y >= 6 && y <= 15;
          const isFlame = x >= 6 && x <= 9 && y >= 1 && y <= 5;
          if (isStick) {
            tctx.fillStyle = y % 2 === 0 ? "#78350f" : "#92400e";
            tctx.fillRect(x, y, 1, 1);
          } else if (isFlame) {
            const isCenter = x >= 7 && x <= 8 && y >= 2 && y <= 4;
            tctx.fillStyle = isCenter ? "#fef08a" : "#f97316";
            tctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // 21. WATER (Semi-transparent animated blue ripples)
    paintTile(TileID.WATER, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 555);
          const r = Math.floor(40 + n * 20);
          const g = Math.floor(110 + n * 40);
          const b = Math.floor(225 + n * 30);
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 22. GRAVEL (Natural textured pebbles)
    paintTile(TileID.GRAVEL, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 666);
          const val = Math.floor(100 + n * 45);
          tctx.fillStyle = `rgb(${val + 5},${val},${val - 5})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 23. CRAFTING_TOP (3x3 grid engraved in oak plank)
    paintTile(TileID.CRAFTING_TOP, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 777);
          let r = Math.floor(170 + n * 20);
          let g = Math.floor(130 + n * 18);
          let b = Math.floor(75 + n * 15);

          // Grid lines
          const isGridBorder = x === 2 || x === 13 || y === 2 || y === 13;
          const isInnerLine = x === 6 || x === 9 || y === 6 || y === 9;
          if (isGridBorder || isInnerLine) {
            r = Math.floor(r * 0.65);
            g = Math.floor(g * 0.65);
            b = Math.floor(b * 0.65);
          }
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 24. CRAFTING_SIDE (Plank with saw and shears pixel illustration)
    paintTile(TileID.CRAFTING_SIDE, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 888);
          let r = Math.floor(165 + n * 22);
          let g = Math.floor(125 + n * 18);
          let b = Math.floor(70 + n * 15);

          // Tool motif in center
          if (x >= 4 && x <= 11 && y >= 4 && y <= 11) {
            if (x === y || x === 15 - y) {
              r = 90; g = 90; b = 95; // iron shear blades
            }
          }
          tctx.fillStyle = `rgb(${r},${g},${b})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 25. COAL
    paintTile(TileID.COAL, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 999);
          const v = Math.floor(25 + n * 30);
          tctx.fillStyle = `rgb(${v},${v},${v})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // 26. IRON_INGOT
    paintTile(TileID.IRON_INGOT, (tctx) => {
      for (let y = 0; y < TILE_PX; y++) {
        for (let x = 0; x < TILE_PX; x++) {
          const n = noise(x, y, 1111);
          const v = Math.floor(210 + n * 35);
          tctx.fillStyle = `rgb(${v},${v},${v + 5})`;
          tctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // Create Three.js Texture
    this.atlasTexture = new THREE.CanvasTexture(canvas);
    this.atlasTexture.magFilter = THREE.NearestFilter;
    this.atlasTexture.minFilter = THREE.NearestFilter;
    this.atlasTexture.generateMipmaps = false;
    this.atlasTexture.colorSpace = THREE.SRGBColorSpace;

    // Materials
    this.opaqueMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      side: THREE.FrontSide,
    });

    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
    });

    // Generate 2D preview icon Data URLs for UI (Hotbar / Inventory)
    this.generateIcons(canvas);
  }

  private generateIcons(atlasCanvas: HTMLCanvasElement) {
    const tileForBlock: Partial<Record<BlockType, TileID>> = {
      [BlockType.AIR]: TileID.DIRT,
      [BlockType.GRASS]: TileID.GRASS_SIDE,
      [BlockType.DIRT]: TileID.DIRT,
      [BlockType.STONE]: TileID.STONE,
      [BlockType.WOOD]: TileID.WOOD_SIDE,
      [BlockType.LEAVES]: TileID.LEAVES,
      [BlockType.PLANK]: TileID.PLANK,
      [BlockType.BRICK]: TileID.BRICK,
      [BlockType.GLASS]: TileID.GLASS,
      [BlockType.COBBLESTONE]: TileID.COBBLESTONE,
      [BlockType.SAND]: TileID.SAND,
      [BlockType.DIAMOND_ORE]: TileID.DIAMOND_ORE,
      [BlockType.OBSIDIAN]: TileID.OBSIDIAN,
      [BlockType.GOLD_BLOCK]: TileID.GOLD_BLOCK,
      [BlockType.TNT]: TileID.TNT_SIDE,
      [BlockType.BOOKSHELF]: TileID.BOOKSHELF,
      [BlockType.GLOWSTONE]: TileID.GLOWSTONE,
      [BlockType.TORCH]: TileID.TORCH,
      [BlockType.WATER]: TileID.WATER,
      [BlockType.GRAVEL]: TileID.GRAVEL,
      [BlockType.COAL]: TileID.COAL,
      [BlockType.IRON_INGOT]: TileID.IRON_INGOT,
      [BlockType.CRAFTING_TABLE]: TileID.CRAFTING_TOP,
      [BlockType.SNOW]: TileID.SNOW,
    };

    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = 32;
    iconCanvas.height = 32;
    const ictx = iconCanvas.getContext("2d")!;
    ictx.imageSmoothingEnabled = false;

    // 1. Generate standard blocks
    for (const [bTypeStr, tileId] of Object.entries(tileForBlock)) {
      const bt = Number(bTypeStr) as BlockType;
      const col = tileId % GRID_SIZE;
      const row = Math.floor(tileId / GRID_SIZE);

      ictx.clearRect(0, 0, 32, 32);
      ictx.drawImage(
        atlasCanvas,
        col * TILE_PX,
        row * TILE_PX,
        TILE_PX,
        TILE_PX,
        0,
        0,
        32,
        32
      );
      this.icons[bt] = iconCanvas.toDataURL();
    }

    // 2. Helper to draw pixel art egg
    const drawEggIcon = (baseColor: string, speckleColor: string, innerSpeckle?: string): string => {
      ictx.clearRect(0, 0, 32, 32);
      // Oval Egg shape
      ictx.fillStyle = baseColor;
      ictx.beginPath();
      ictx.ellipse(16, 17, 10, 13, 0, 0, Math.PI * 2);
      ictx.fill();
      // Border outline
      ictx.strokeStyle = "rgba(0,0,0,0.3)";
      ictx.lineWidth = 1.5;
      ictx.stroke();
      // Egg specks
      ictx.fillStyle = speckleColor;
      ictx.fillRect(11, 12, 3, 3);
      ictx.fillRect(17, 10, 4, 3);
      ictx.fillRect(13, 19, 4, 4);
      ictx.fillRect(19, 21, 3, 3);
      if (innerSpeckle) {
        ictx.fillStyle = innerSpeckle;
        ictx.fillRect(14, 14, 3, 3);
        ictx.fillRect(18, 16, 2, 2);
      }
      return iconCanvas.toDataURL();
    };

    // 3. Helper to draw pixel art tools (Diagonal Minecraft style)
    // Diamond Axe
    ictx.clearRect(0, 0, 32, 32);
    // Wooden stick handle
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    // Diamond head
    ictx.fillStyle = "#2dd4bf";
    ictx.fillRect(18, 5, 8, 4);
    ictx.fillRect(22, 9, 5, 8);
    ictx.fillRect(16, 8, 4, 5);
    ictx.fillStyle = "#5eead4"; // Highlight
    ictx.fillRect(19, 6, 5, 2);
    ictx.fillRect(23, 10, 2, 5);
    this.icons[BlockType.DIAMOND_AXE] = iconCanvas.toDataURL();

    // Diamond Pickaxe
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    ictx.fillStyle = "#2dd4bf";
    ictx.fillRect(14, 5, 13, 3);
    ictx.fillRect(24, 8, 3, 6);
    ictx.fillRect(11, 8, 3, 6);
    ictx.fillStyle = "#5eead4";
    ictx.fillRect(16, 5, 8, 2);
    this.icons[BlockType.DIAMOND_PICKAXE] = iconCanvas.toDataURL();

    // Diamond Sword
    ictx.clearRect(0, 0, 32, 32);
    // Pommel & Guard
    ictx.fillStyle = "#8a5827";
    ictx.fillRect(6, 26, 4, 4);
    ictx.fillStyle = "#b45309";
    ictx.fillRect(9, 21, 6, 2);
    ictx.fillRect(10, 20, 2, 4);
    // Blade
    ictx.fillStyle = "#2dd4bf";
    for (let i = 0; i < 12; i++) {
      ictx.fillRect(12 + i, 18 - i, 4, 4);
    }
    ictx.fillStyle = "#99f6e4";
    for (let i = 0; i < 10; i++) {
      ictx.fillRect(13 + i, 17 - i, 2, 2);
    }
    this.icons[BlockType.DIAMOND_SWORD] = iconCanvas.toDataURL();

    // Diamond Shovel
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    ictx.fillStyle = "#2dd4bf";
    ictx.fillRect(20, 5, 7, 7);
    ictx.fillStyle = "#5eead4";
    ictx.fillRect(21, 6, 4, 4);
    this.icons[BlockType.DIAMOND_SHOVEL] = iconCanvas.toDataURL();

    // Spawn Eggs
    this.icons[BlockType.DUCK_SPAWN_EGG] = drawEggIcon("#22c55e", "#ff8c00", "#15803d");
    this.icons[BlockType.CHICKEN_SPAWN_EGG] = drawEggIcon("#f8fafc", "#ef4444", "#f59e0b");
    this.icons[BlockType.SHEEP_SPAWN_EGG] = drawEggIcon("#e2e8f0", "#94a3b8", "#cbd5e1");
    this.icons[BlockType.COW_SPAWN_EGG] = drawEggIcon("#78350f", "#3b1a07", "#fef3c7");

    // Golden Apple
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#fbbf24"; // Radiant gold
    ictx.beginPath();
    ictx.arc(12, 18, 9, 0, Math.PI * 2);
    ictx.arc(20, 18, 9, 0, Math.PI * 2);
    ictx.fill();
    // Stem
    ictx.fillStyle = "#78350f";
    ictx.fillRect(15, 6, 2, 5);
    // Green leaf
    ictx.fillStyle = "#4ade80";
    ictx.fillRect(17, 7, 4, 3);
    // Golden shine
    ictx.fillStyle = "#fef08a";
    ictx.fillRect(10, 14, 4, 4);
    this.icons[BlockType.GOLDEN_APPLE] = iconCanvas.toDataURL();

    // Wheat
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#eab308";
    ictx.fillRect(8, 24, 3, 5);
    ictx.fillRect(11, 20, 3, 5);
    ictx.fillRect(14, 15, 4, 6);
    ictx.fillRect(17, 10, 4, 6);
    ictx.fillRect(20, 5, 4, 6);
    ictx.fillStyle = "#fef08a";
    ictx.fillRect(15, 12, 2, 4);
    ictx.fillRect(18, 7, 2, 4);
    this.icons[BlockType.WHEAT] = iconCanvas.toDataURL();

    // Crafting Table Icon
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#a16207";
    ictx.fillRect(2, 2, 28, 28);
    ictx.fillStyle = "#ca8a04";
    ictx.fillRect(4, 4, 24, 24);
    ictx.fillStyle = "#78350f";
    ictx.fillRect(6, 6, 20, 2);
    ictx.fillRect(6, 15, 20, 2);
    ictx.fillRect(6, 24, 20, 2);
    ictx.fillRect(6, 6, 2, 20);
    ictx.fillRect(15, 6, 2, 20);
    ictx.fillRect(24, 6, 2, 20);
    // Draw miniature hammer & saw tools
    ictx.fillStyle = "#f8fafc";
    ictx.fillRect(9, 9, 3, 2);
    ictx.fillRect(10, 11, 2, 3);
    this.icons[BlockType.CRAFTING_TABLE] = iconCanvas.toDataURL();

    // Stick Icon
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#78350f";
    for (let s = 0; s < 18; s++) {
      ictx.fillRect(7 + s, 25 - s, 3, 3);
    }
    ictx.fillStyle = "#92400e";
    for (let s = 0; s < 18; s++) {
      ictx.fillRect(7 + s, 25 - s, 1, 2);
    }
    this.icons[BlockType.STICK] = iconCanvas.toDataURL();

    // Wooden Pickaxe
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#78350f"; // stick handle
    for (let s = 0; s < 14; s++) {
      ictx.fillRect(6 + s, 26 - s, 2, 2);
    }
    ictx.fillStyle = "#b45309"; // wood head
    ictx.fillRect(15, 6, 12, 4);
    ictx.fillRect(23, 10, 4, 6);
    ictx.fillRect(11, 10, 4, 4);
    this.icons[BlockType.WOODEN_PICKAXE] = iconCanvas.toDataURL();

    // Wooden Sword
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#78350f"; // stick handle
    ictx.fillRect(6, 24, 3, 3);
    ictx.fillRect(8, 22, 3, 3);
    ictx.fillStyle = "#92400e"; // crossguard
    ictx.fillRect(8, 19, 7, 3);
    ictx.fillRect(11, 22, 3, 4);
    ictx.fillStyle = "#b45309"; // blade
    for (let s = 0; s < 12; s++) {
      ictx.fillRect(12 + s, 18 - s, 4, 4);
    }
    this.icons[BlockType.WOODEN_SWORD] = iconCanvas.toDataURL();

    // Wooden Axe
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#78350f";
    for (let s = 0; s < 16; s++) {
      ictx.fillRect(6 + s, 26 - s, 2, 2);
    }
    ictx.fillStyle = "#b45309";
    ictx.fillRect(16, 5, 10, 10);
    ictx.fillRect(14, 7, 4, 7);
    this.icons[BlockType.WOODEN_AXE] = iconCanvas.toDataURL();

    // Rotten Flesh
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#9a3412";
    ictx.beginPath();
    ictx.ellipse(16, 17, 10, 8, 0.2, 0, Math.PI * 2);
    ictx.fill();
    ictx.fillStyle = "#7c2d12";
    ictx.fillRect(11, 14, 4, 4);
    ictx.fillRect(17, 18, 5, 3);
    ictx.fillStyle = "#4ade80"; // slimy mold
    ictx.fillRect(14, 11, 3, 2);
    this.icons[BlockType.ROTTEN_FLESH] = iconCanvas.toDataURL();

    // Slime Ball
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#22c55e";
    ictx.beginPath();
    ictx.arc(16, 16, 10, 0, Math.PI * 2);
    ictx.fill();
    ictx.fillStyle = "#86efac";
    ictx.beginPath();
    ictx.arc(13, 13, 4, 0, Math.PI * 2);
    ictx.fill();
    ictx.fillStyle = "#15803d";
    ictx.beginPath();
    ictx.arc(18, 19, 4, 0, Math.PI * 2);
    ictx.fill();
    this.icons[BlockType.SLIME_BALL] = iconCanvas.toDataURL();

    // Bone
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#f8fafc";
    for (let s = 0; s < 14; s++) {
      ictx.fillRect(8 + s, 24 - s, 3, 3);
    }
    // Knobs
    ictx.fillRect(5, 23, 4, 4);
    ictx.fillRect(7, 26, 4, 4);
    ictx.fillRect(20, 7, 4, 4);
    ictx.fillRect(23, 10, 4, 4);
    this.icons[BlockType.BONE] = iconCanvas.toDataURL();

    // Diamond Gem
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#38bdf8";
    ictx.beginPath();
    ictx.moveTo(16, 5);
    ictx.lineTo(26, 13);
    ictx.lineTo(16, 27);
    ictx.lineTo(6, 13);
    ictx.closePath();
    ictx.fill();
    ictx.fillStyle = "#e0f2fe";
    ictx.beginPath();
    ictx.moveTo(16, 5);
    ictx.lineTo(21, 13);
    ictx.lineTo(16, 27);
    ictx.closePath();
    ictx.fill();
    this.icons[BlockType.DIAMOND] = iconCanvas.toDataURL();

    // Bread
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#d97706";
    ictx.beginPath();
    ictx.ellipse(16, 16, 12, 6, -0.2, 0, Math.PI * 2);
    ictx.fill();
    ictx.fillStyle = "#fde68a";
    ictx.fillRect(10, 13, 2, 4);
    ictx.fillRect(15, 14, 2, 4);
    ictx.fillRect(20, 15, 2, 4);
    this.icons[BlockType.BREAD] = iconCanvas.toDataURL();

    // Monster Spawn Eggs
    this.icons[BlockType.ZOMBIE_SPAWN_EGG] = drawEggIcon("#059669", "#064e3b", "#0284c7");
    this.icons[BlockType.SLIME_SPAWN_EGG] = drawEggIcon("#22c55e", "#15803d", "#86efac");

    // Iron Tools
    // Iron Pickaxe
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    ictx.fillStyle = "#cbd5e1";
    ictx.fillRect(14, 5, 13, 3);
    ictx.fillRect(24, 8, 3, 6);
    ictx.fillRect(11, 8, 3, 6);
    ictx.fillStyle = "#ffffff";
    ictx.fillRect(16, 5, 8, 2);
    this.icons[BlockType.IRON_PICKAXE] = iconCanvas.toDataURL();

    // Iron Axe
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    ictx.fillStyle = "#cbd5e1";
    ictx.fillRect(18, 5, 8, 4);
    ictx.fillRect(22, 9, 5, 8);
    ictx.fillRect(16, 8, 4, 5);
    ictx.fillStyle = "#ffffff";
    ictx.fillRect(19, 6, 5, 2);
    this.icons[BlockType.IRON_AXE] = iconCanvas.toDataURL();

    // Iron Shovel
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    ictx.fillStyle = "#cbd5e1";
    ictx.fillRect(20, 5, 7, 7);
    ictx.fillStyle = "#ffffff";
    ictx.fillRect(21, 6, 4, 4);
    this.icons[BlockType.IRON_SHOVEL] = iconCanvas.toDataURL();

    // Iron Sword
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    ictx.fillRect(6, 26, 4, 4);
    ictx.fillStyle = "#64748b";
    ictx.fillRect(9, 21, 6, 2);
    ictx.fillRect(10, 20, 2, 4);
    ictx.fillStyle = "#cbd5e1";
    for (let i = 0; i < 12; i++) {
      ictx.fillRect(12 + i, 18 - i, 4, 4);
    }
    ictx.fillStyle = "#f8fafc";
    for (let i = 0; i < 10; i++) {
      ictx.fillRect(13 + i, 17 - i, 2, 2);
    }
    this.icons[BlockType.IRON_SWORD] = iconCanvas.toDataURL();

    // Wooden Shovel
    ictx.clearRect(0, 0, 32, 32);
    ictx.fillStyle = "#8a5827";
    for (let i = 0; i < 16; i++) {
      ictx.fillRect(6 + i, 26 - i, 2, 2);
    }
    ictx.fillStyle = "#b45309";
    ictx.fillRect(20, 5, 7, 7);
    ictx.fillStyle = "#d97706";
    ictx.fillRect(21, 6, 4, 4);
    this.icons[BlockType.WOODEN_SHOVEL] = iconCanvas.toDataURL();
  }

  // Returns which TileID to use for each of the 6 faces of a block
  public getTileForFace(blockType: BlockType, faceIndex: number): TileID {
    // Face indices: 0: +X, 1: -X, 2: +Y (top), 3: -Y (bottom), 4: +Z, 5: -Z
    switch (blockType) {
      case BlockType.CRAFTING_TABLE:
        if (faceIndex === 2) return TileID.CRAFTING_TOP;
        return TileID.CRAFTING_SIDE;
      case BlockType.TORCH:
        return TileID.TORCH;
      case BlockType.WATER:
        return TileID.WATER;
      case BlockType.GRAVEL:
        return TileID.GRAVEL;
      case BlockType.COAL:
        return TileID.COAL;
      case BlockType.IRON_INGOT:
        return TileID.IRON_INGOT;
      case BlockType.GRASS:
        if (faceIndex === 2) return TileID.GRASS_TOP;
        if (faceIndex === 3) return TileID.DIRT;
        return TileID.GRASS_SIDE;
      case BlockType.DIRT:
        return TileID.DIRT;
      case BlockType.STONE:
        return TileID.STONE;
      case BlockType.WOOD:
        if (faceIndex === 2 || faceIndex === 3) return TileID.WOOD_TOP;
        return TileID.WOOD_SIDE;
      case BlockType.LEAVES:
        return TileID.LEAVES;
      case BlockType.PLANK:
        return TileID.PLANK;
      case BlockType.BRICK:
        return TileID.BRICK;
      case BlockType.GLASS:
        return TileID.GLASS;
      case BlockType.COBBLESTONE:
        return TileID.COBBLESTONE;
      case BlockType.SAND:
        return TileID.SAND;
      case BlockType.DIAMOND_ORE:
        return TileID.DIAMOND_ORE;
      case BlockType.OBSIDIAN:
        return TileID.OBSIDIAN;
      case BlockType.GOLD_BLOCK:
        return TileID.GOLD_BLOCK;
      case BlockType.TNT:
        if (faceIndex === 2 || faceIndex === 3) return TileID.TNT_TOP;
        return TileID.TNT_SIDE;
      case BlockType.BOOKSHELF:
        if (faceIndex === 2 || faceIndex === 3) return TileID.PLANK;
        return TileID.BOOKSHELF;
      case BlockType.GLOWSTONE:
        return TileID.GLOWSTONE;
      case BlockType.SNOW:
        return TileID.SNOW;
      default:
        return TileID.DIRT;
    }
  }

  public getUV(tileId: TileID): AtlasTile {
    return this.tileMap[tileId] || this.tileMap[TileID.DIRT];
  }
}
