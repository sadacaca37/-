import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS } from "../types";
import { VoxelTextureAtlas } from "./TextureAtlas";

export const CHUNK_WIDTH = 16;
export const CHUNK_DEPTH = 16;
// Raised from 32 -> 64 to give mountain terrain enough vertical headroom
// (steep peaks + snowcaps) above the new sea level. All height-dependent
// code reads this constant (or VoxelWorld.getSurfaceHeight()), so nothing
// else needs to hardcode the old value.
export const CHUNK_HEIGHT = 64;

// Face normals and directional brightness shading (Minecraft style)
const FACE_CONFIGS = [
  // 0: +X (Right)
  {
    dir: [1, 0, 0],
    normal: [1, 0, 0],
    brightness: 0.8,
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
  },
  // 1: -X (Left)
  {
    dir: [-1, 0, 0],
    normal: [-1, 0, 0],
    brightness: 0.8,
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
  },
  // 2: +Y (Top)
  {
    dir: [0, 1, 0],
    normal: [0, 1, 0],
    brightness: 1.0,
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  // 3: -Y (Bottom)
  {
    dir: [0, -1, 0],
    normal: [0, -1, 0],
    brightness: 0.5,
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
  },
  // 4: +Z (Front)
  {
    dir: [0, 0, 1],
    normal: [0, 0, 1],
    brightness: 0.68,
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
  },
  // 5: -Z (Back)
  {
    dir: [0, 0, -1],
    normal: [0, 0, -1],
    brightness: 0.68,
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  },
];

export class Chunk {
  public chunkX: number;
  public chunkZ: number;
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public transparentMesh: THREE.Mesh | null = null;
  public group: THREE.Group;
  public isDirty: boolean = true;

  constructor(chunkX: number, chunkZ: number) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.blocks = new Uint8Array(CHUNK_WIDTH * CHUNK_HEIGHT * CHUNK_DEPTH);
    this.group = new THREE.Group();
    this.group.name = `chunk_${chunkX}_${chunkZ}`;
  }

  public getIndex(x: number, y: number, z: number): number {
    return (y * CHUNK_DEPTH + z) * CHUNK_WIDTH + x;
  }

  public getBlock(localX: number, localY: number, localZ: number): BlockType {
    if (
      localX < 0 ||
      localX >= CHUNK_WIDTH ||
      localY < 0 ||
      localY >= CHUNK_HEIGHT ||
      localZ < 0 ||
      localZ >= CHUNK_DEPTH
    ) {
      return BlockType.AIR;
    }
    return this.blocks[this.getIndex(localX, localY, localZ)] as BlockType;
  }

  public setBlock(localX: number, localY: number, localZ: number, type: BlockType) {
    if (
      localX < 0 ||
      localX >= CHUNK_WIDTH ||
      localY < 0 ||
      localY >= CHUNK_HEIGHT ||
      localZ < 0 ||
      localZ >= CHUNK_DEPTH
    ) {
      return;
    }
    this.blocks[this.getIndex(localX, localY, localZ)] = type;
    this.isDirty = true;
  }

  // Generate optimized chunk mesh with hidden face culling
  public buildMesh(
    atlas: VoxelTextureAtlas,
    worldGetBlock: (wx: number, wy: number, wz: number) => BlockType
  ): THREE.Group {
    // Buffers for opaque blocks
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    // Buffers for transparent/cutout blocks (leaves, glass)
    const transPositions: number[] = [];
    const transNormals: number[] = [];
    const transUvs: number[] = [];
    const transColors: number[] = [];
    const transIndices: number[] = [];

    let vertexCount = 0;
    let transVertexCount = 0;

    const startWx = this.chunkX * CHUNK_WIDTH;
    const startWz = this.chunkZ * CHUNK_DEPTH;

    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      for (let z = 0; z < CHUNK_DEPTH; z++) {
        for (let x = 0; x < CHUNK_WIDTH; x++) {
          const blockType = this.getBlock(x, y, z);
          if (blockType === BlockType.AIR) continue;

          const meta = BLOCK_DEFINITIONS[blockType];
          const isTransparentBlock = meta.transparent;

          const wx = startWx + x;
          const wy = y;
          const wz = startWz + z;

          // Check each of the 6 faces
          for (let f = 0; f < 6; f++) {
            const face = FACE_CONFIGS[f];
            const nx = wx + face.dir[0];
            const ny = wy + face.dir[1];
            const nz = wz + face.dir[2];

            // Face culling test: only draw face if neighbor is transparent or AIR
            let neighborType: BlockType;
            if (
              nx >= startWx &&
              nx < startWx + CHUNK_WIDTH &&
              ny >= 0 &&
              ny < CHUNK_HEIGHT &&
              nz >= startWz &&
              nz < startWz + CHUNK_DEPTH
            ) {
              neighborType = this.getBlock(nx - startWx, ny, nz - startWz);
            } else {
              neighborType = worldGetBlock(nx, ny, nz);
            }

            const neighborMeta = BLOCK_DEFINITIONS[neighborType];
            const shouldRenderFace =
              neighborType === BlockType.AIR ||
              (!isTransparentBlock && neighborMeta.transparent) ||
              (isTransparentBlock && neighborType !== blockType && neighborMeta.transparent);

            if (!shouldRenderFace) continue;

            // Target buffer arrays
            const targetPos = isTransparentBlock ? transPositions : positions;
            const targetNorm = isTransparentBlock ? transNormals : normals;
            const targetUv = isTransparentBlock ? transUvs : uvs;
            const targetCol = isTransparentBlock ? transColors : colors;
            const targetIdx = isTransparentBlock ? transIndices : indices;
            const baseIndex = isTransparentBlock ? transVertexCount : vertexCount;

            // UV mapping from atlas
            const tileId = atlas.getTileForFace(blockType, f);
            const uvTile = atlas.getUV(tileId);

            // 4 corners of face quad
            const [c0, c1, c2, c3] = face.corners;
            const br = face.brightness;

            // Add 4 vertices
            // Vertex 0
            targetPos.push(wx + c0[0], wy + c0[1], wz + c0[2]);
            targetNorm.push(face.normal[0], face.normal[1], face.normal[2]);
            targetUv.push(uvTile.u0, uvTile.v0);
            targetCol.push(br, br, br);

            // Vertex 1
            targetPos.push(wx + c1[0], wy + c1[1], wz + c1[2]);
            targetNorm.push(face.normal[0], face.normal[1], face.normal[2]);
            targetUv.push(uvTile.u1, uvTile.v0);
            targetCol.push(br, br, br);

            // Vertex 2
            targetPos.push(wx + c2[0], wy + c2[1], wz + c2[2]);
            targetNorm.push(face.normal[0], face.normal[1], face.normal[2]);
            targetUv.push(uvTile.u1, uvTile.v1);
            targetCol.push(br, br, br);

            // Vertex 3
            targetPos.push(wx + c3[0], wy + c3[1], wz + c3[2]);
            targetNorm.push(face.normal[0], face.normal[1], face.normal[2]);
            targetUv.push(uvTile.u0, uvTile.v1);
            targetCol.push(br, br, br);

            // Indices for two triangles (0, 1, 2) and (0, 2, 3)
            targetIdx.push(
              baseIndex,
              baseIndex + 1,
              baseIndex + 2,
              baseIndex,
              baseIndex + 2,
              baseIndex + 3
            );

            if (isTransparentBlock) {
              transVertexCount += 4;
            } else {
              vertexCount += 4;
            }
          }
        }
      }
    }

    // Clean up old meshes
    this.disposeMeshes();

    // Build Opaque Mesh
    if (positions.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      geo.setIndex(indices);

      this.mesh = new THREE.Mesh(geo, atlas.opaqueMaterial);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.mesh.userData = { chunkX: this.chunkX, chunkZ: this.chunkZ };
      this.group.add(this.mesh);
    }

    // Build Transparent/Cutout Mesh
    if (transPositions.length > 0) {
      const transGeo = new THREE.BufferGeometry();
      transGeo.setAttribute("position", new THREE.Float32BufferAttribute(transPositions, 3));
      transGeo.setAttribute("normal", new THREE.Float32BufferAttribute(transNormals, 3));
      transGeo.setAttribute("uv", new THREE.Float32BufferAttribute(transUvs, 2));
      transGeo.setAttribute("color", new THREE.Float32BufferAttribute(transColors, 3));
      transGeo.setIndex(transIndices);

      this.transparentMesh = new THREE.Mesh(transGeo, atlas.transparentMaterial);
      this.transparentMesh.userData = { chunkX: this.chunkX, chunkZ: this.chunkZ };
      this.group.add(this.transparentMesh);
    }

    this.isDirty = false;
    return this.group;
  }

  public disposeMeshes() {
    if (this.mesh) {
      this.group.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    if (this.transparentMesh) {
      this.group.remove(this.transparentMesh);
      this.transparentMesh.geometry.dispose();
      this.transparentMesh = null;
    }
  }

  public dispose() {
    this.disposeMeshes();
  }
}
