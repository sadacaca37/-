import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS } from "../types";

interface VoxelParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scale: number;
}

export class ParticleManager {
  public scene: THREE.Scene;
  private particles: VoxelParticle[] = [];
  private particleGeo: THREE.BoxGeometry;
  private materialCache: Map<string, THREE.MeshBasicMaterial> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    // Tiny 0.12 unit cube for voxel debris
    this.particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  }

  private getMaterial(colorHex: string): THREE.MeshBasicMaterial {
    if (!this.materialCache.has(colorHex)) {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.95,
      });
      this.materialCache.set(colorHex, mat);
    }
    return this.materialCache.get(colorHex)!;
  }

  // Spawn debris particles at block coordinates
  public spawnBlockBreakParticles(x: number, y: number, z: number, blockType: BlockType, count: number = 18) {
    const meta = BLOCK_DEFINITIONS[blockType];
    const baseColor = meta ? meta.color : "#737373";

    for (let i = 0; i < count; i++) {
      // Slight color variation for voxel texture feel
      const color = new THREE.Color(baseColor);
      const varVal = (Math.random() - 0.5) * 0.18;
      color.offsetHSL(0, 0, varVal);

      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1.0,
      });

      const mesh = new THREE.Mesh(this.particleGeo, mat);
      // Spawn within the 1x1x1 block volume
      mesh.position.set(
        x + 0.15 + Math.random() * 0.7,
        y + 0.15 + Math.random() * 0.7,
        z + 0.15 + Math.random() * 0.7
      );

      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      // Random burst velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.5;
      const upward = 2.5 + Math.random() * 3.5;

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed * 0.6,
        upward,
        Math.sin(angle) * speed * 0.6
      );

      const life = 0.5 + Math.random() * 0.4; // 0.5 - 0.9s duration

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life,
        maxLife: life,
        scale: 0.8 + Math.random() * 0.5,
      });
    }
  }

  // Hit sparks when mining without breaking
  public spawnHitCrackParticles(x: number, y: number, z: number, blockType: BlockType, count: number = 4) {
    this.spawnBlockBreakParticles(x, y, z, blockType, count);
  }

  public update(deltaTime: number) {
    const gravity = -18.0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        (p.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics update
      p.velocity.y += gravity * deltaTime;
      p.mesh.position.addScaledVector(p.velocity, deltaTime);

      // Tumble rotation
      p.mesh.rotation.x += 6.0 * deltaTime;
      p.mesh.rotation.y += 8.0 * deltaTime;

      // Shrink and fade
      const progress = p.life / p.maxLife; // 1.0 -> 0.0
      const currentScale = p.scale * Math.max(0.01, progress);
      p.mesh.scale.set(currentScale, currentScale, currentScale);

      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, progress);
    }
  }

  public dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    this.particles = [];
    this.particleGeo.dispose();
    this.materialCache.clear();
  }
}
