import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, BombType } from "../types";
import { VoxelWorld } from "./VoxelWorld";
import { MonsterManager } from "./MonsterManager";
import { soundFx } from "./SoundEffects";

// Effect bombs & TNT: thrown projectiles, fuses, explosions, fireworks,
// smoke clouds, healing bursts and thunder strikes. Visuals are built from
// cheap box particles so hundreds can be alive at once without hurting FPS.
//
// Multiplayer: the client that triggers an effect broadcasts it (see
// onBroadcast). Every other client plays the same visual at the same spot.
// Block destruction from TNT is sent through the normal block_break path by
// the triggering client, so the world stays in sync; damage is applied on
// each client to its own player/monsters, which is how a healing bomb thrown
// by one player heals a friend standing nearby.

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  shrink: boolean;
}

interface Projectile {
  kind: BombType;
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  fromNetwork: boolean;
}

interface Fuse {
  x: number;
  y: number;
  z: number;
  timer: number;
  flash: THREE.Mesh;
  fromNetwork: boolean;
}

const EXPLOSION_RADIUS = 3;
const EXPLOSION_DAMAGE_RADIUS = 5.5;

export class EffectsManager {
  private scene: THREE.Scene;
  private world: VoxelWorld;
  public monsterManager: MonsterManager | null = null;

  private particles: Particle[] = [];
  private projectiles: Projectile[] = [];
  private fuses: Fuse[] = [];
  private lights: Array<{ light: THREE.PointLight; life: number; maxLife: number; intensity: number }> = [];
  private beams: Array<{ mesh: THREE.Mesh; life: number }> = [];

  private particleGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private bigParticleGeo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  private materialCache = new Map<number, THREE.MeshBasicMaterial>();

  // Hooks
  public getPlayerPosition?: () => THREE.Vector3;
  public damagePlayer?: (amount: number, from: THREE.Vector3) => void;
  public healPlayer?: (amount: number) => void;
  public onBlockDestroyed?: (x: number, y: number, z: number) => void;
  public onBroadcast?: (kind: BombType, pos: [number, number, number], dir: [number, number, number]) => void;
  public onScreenFlash?: (color: string, duration: number) => void;
  public onNotice?: (text: string) => void;

  constructor(scene: THREE.Scene, world: VoxelWorld) {
    this.scene = scene;
    this.world = world;
  }

  private mat(color: number): THREE.MeshBasicMaterial {
    let m = this.materialCache.get(color);
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      this.materialCache.set(color, m);
    }
    return m;
  }

  private spawnParticle(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    color: number,
    life: number,
    opts: { gravity?: number; drag?: number; big?: boolean; shrink?: boolean } = {}
  ) {
    const mesh = new THREE.Mesh(opts.big ? this.bigParticleGeo : this.particleGeo, this.mat(color).clone());
    mesh.position.copy(pos);
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    this.scene.add(mesh);
    this.particles.push({
      mesh,
      velocity: vel,
      life,
      maxLife: life,
      gravity: opts.gravity ?? 9,
      drag: opts.drag ?? 0.98,
      shrink: opts.shrink ?? true,
    });
  }

  private flashLight(pos: THREE.Vector3, color: number, intensity: number, distance: number, life: number) {
    const light = new THREE.PointLight(color, intensity, distance, 1.6);
    light.position.copy(pos);
    this.scene.add(light);
    this.lights.push({ light, life, maxLife: life, intensity });
  }

  // ---------------- Public API ----------------

  /** Right-click on a placed TNT block: light the fuse (3s), then explode. */
  public igniteTnt(x: number, y: number, z: number, fromNetwork = false, fuseSeconds = 3) {
    if (this.fuses.some((f) => f.x === x && f.y === y && f.z === z)) return;
    const flash = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 1.04, 1.04),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0 })
    );
    flash.position.set(x + 0.5, y + 0.5, z + 0.5);
    this.scene.add(flash);
    this.fuses.push({ x, y, z, timer: fuseSeconds, flash, fromNetwork });
    soundFx.playFuse();
    if (!fromNetwork && this.onBroadcast) this.onBroadcast("tnt", [x, y, z], [0, 0, 0]);
  }

  /** Right-click with a bomb item: throw it from the camera in the look direction. */
  public throwBomb(kind: BombType, origin: THREE.Vector3, dir: THREE.Vector3, fromNetwork = false) {
    if (kind === "tnt") return;
    const color = kind === "firework" ? 0xef4444 : kind === "smoke" ? 0x6b7280 : kind === "heal" ? 0x22c55e : 0xfacc15;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), new THREE.MeshLambertMaterial({ color }));
    mesh.position.copy(origin).add(dir.clone().multiplyScalar(0.6));
    this.scene.add(mesh);

    let velocity: THREE.Vector3;
    if (kind === "firework") {
      velocity = new THREE.Vector3(dir.x * 2, 14, dir.z * 2);
      soundFx.playFireworkLaunch();
    } else {
      velocity = dir.clone().multiplyScalar(13).add(new THREE.Vector3(0, 4, 0));
    }
    this.projectiles.push({ kind, mesh, velocity, life: kind === "firework" ? 1.3 : 6, fromNetwork });
    if (!fromNetwork && this.onBroadcast) {
      this.onBroadcast(kind, [origin.x, origin.y, origin.z], [dir.x, dir.y, dir.z]);
    }
  }

  /** Called when another player's effect arrives over the network. */
  public playRemote(kind: BombType, pos: [number, number, number], dir: [number, number, number]) {
    if (kind === "tnt") {
      this.igniteTnt(pos[0], pos[1], pos[2], true);
      return;
    }
    this.throwBomb(kind, new THREE.Vector3(...pos), new THREE.Vector3(...dir), true);
  }

  // ---------------- Effects ----------------

  private explode(center: THREE.Vector3, fromNetwork: boolean) {
    soundFx.playExplosion();
    this.flashLight(center, 0xffa040, 12, 18, 0.5);
    if (this.onScreenFlash) this.onScreenFlash("rgba(255,180,80,0.35)", 180);

    // Fire & smoke particles
    for (let i = 0; i < 70; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(4 + Math.random() * 9);
      const c = i < 30 ? 0xfbbf24 : i < 50 ? 0xf97316 : 0x4b5563;
      this.spawnParticle(center.clone(), v, c, 0.8 + Math.random() * 1.2, { big: i % 3 === 0, gravity: i >= 50 ? -0.5 : 7, drag: 0.95 });
    }

    // Destroy blocks (only the client that lit the fuse edits the world; it
    // then broadcasts each removal through the normal block_break channel).
    if (!fromNetwork) {
      const r = EXPLOSION_RADIUS;
      const cx = Math.floor(center.x), cy = Math.floor(center.y), cz = Math.floor(center.z);
      const chain: Array<[number, number, number]> = [];
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dz = -r; dz <= r; dz++) {
            if (dx * dx + dy * dy + dz * dz > r * r + 1) continue;
            const bx = cx + dx, by = cy + dy, bz = cz + dz;
            if (by <= 0) continue; // bedrock floor
            const t = this.world.getBlock(bx, by, bz);
            if (t === BlockType.AIR || t === BlockType.WATER) continue;
            if (t === BlockType.OBSIDIAN) continue; // blast-proof
            if (t === BlockType.TNT) chain.push([bx, by, bz]);
            this.world.setBlock(bx, by, bz, BlockType.AIR);
            if (this.onBlockDestroyed) this.onBlockDestroyed(bx, by, bz);
          }
        }
      }
      // Chain reaction: neighbouring TNT goes off almost immediately
      for (const [bx, by, bz] of chain) {
        this.world.setBlock(bx, by, bz, BlockType.TNT);
        this.igniteTnt(bx, by, bz, false, 0.35);
      }
    }

    // Damage monsters (local) and the player
    this.damageArea(center, EXPLOSION_DAMAGE_RADIUS, 16, 9, true);
  }

  private damageArea(center: THREE.Vector3, radius: number, monsterDamage: number, playerDamage: number, knockback: boolean) {
    if (this.monsterManager) {
      for (const mob of [...this.monsterManager.monsters]) {
        const d = mob.position.distanceTo(center);
        if (d <= radius) {
          const scale = 1 - (d / radius) * 0.6;
          mob.health -= Math.ceil(monsterDamage * scale);
          mob.isHurt = true;
          mob.hurtTimer = 0.4;
          if (knockback) {
            const kb = mob.position.clone().sub(center).normalize();
            kb.y = 0.6;
            mob.velocity.copy(kb.multiplyScalar(9));
          }
          if (mob.health <= 0) this.monsterManager.killMonster(mob);
        }
      }
    }
    if (playerDamage > 0 && this.getPlayerPosition && this.damagePlayer) {
      const p = this.getPlayerPosition();
      const d = p.clone().add(new THREE.Vector3(0, 0.9, 0)).distanceTo(center);
      if (d <= radius) {
        const amt = Math.max(1, Math.round(playerDamage * (1 - d / radius)));
        this.damagePlayer(amt, center);
      }
    }
  }

  private burstFirework(pos: THREE.Vector3) {
    soundFx.playFireworkBurst();
    const palettes = [
      [0xef4444, 0xfbbf24, 0xffffff],
      [0x3b82f6, 0x22d3ee, 0xffffff],
      [0xa855f7, 0xf472b6, 0xfde047],
      [0x22c55e, 0xbef264, 0xffffff],
    ];
    const pal = palettes[Math.floor(Math.random() * palettes.length)];
    this.flashLight(pos, pal[0], 8, 25, 0.9);
    for (let i = 0; i < 110; i++) {
      const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const speed = 5 + Math.random() * 5;
      this.spawnParticle(pos.clone(), dir.multiplyScalar(speed), pal[i % pal.length], 1.4 + Math.random() * 1.2, { gravity: 2.2, drag: 0.96 });
    }
    // sparkle trail ring
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      this.spawnParticle(pos.clone(), new THREE.Vector3(Math.cos(a) * 7, 1, Math.sin(a) * 7), 0xffffff, 1.0, { gravity: 3, drag: 0.94 });
    }
  }

  private smokeCloud(pos: THREE.Vector3) {
    soundFx.playSmokePuff();
    for (let i = 0; i < 140; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.6, Math.random() - 0.5).normalize().multiplyScalar(1.5 + Math.random() * 3);
      const g = 90 + Math.floor(Math.random() * 60);
      const color = (g << 16) | (g << 8) | g;
      this.spawnParticle(pos.clone().add(new THREE.Vector3(0, 0.3, 0)), v, color, 5 + Math.random() * 4, { big: true, gravity: -0.15, drag: 0.93, shrink: false });
    }
  }

  private healBurst(pos: THREE.Vector3) {
    soundFx.playHealChime();
    this.flashLight(pos, 0x4ade80, 6, 14, 0.8);
    for (let i = 0; i < 80; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 3.5;
      const p = pos.clone().add(new THREE.Vector3(Math.cos(a) * r, 0.1, Math.sin(a) * r));
      this.spawnParticle(p, new THREE.Vector3(0, 1.5 + Math.random() * 2, 0), i % 4 === 0 ? 0xffffff : 0x4ade80, 1.2 + Math.random(), { gravity: -1, drag: 0.98 });
    }
    if (this.getPlayerPosition && this.healPlayer) {
      const d = this.getPlayerPosition().distanceTo(pos);
      if (d <= 5) {
        this.healPlayer(8);
        if (this.onNotice) this.onNotice("💚 치유 폭탄: 체력 +8");
      }
    }
  }

  private thunderStrike(pos: THREE.Vector3) {
    soundFx.playThunder();
    if (this.onScreenFlash) this.onScreenFlash("rgba(255,255,255,0.75)", 120);
    this.flashLight(pos.clone().add(new THREE.Vector3(0, 2, 0)), 0xfef9c3, 20, 30, 0.6);
    // Lightning beam: tall bright column from the sky
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.35, 40, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.95, side: THREE.DoubleSide })
    );
    beam.position.copy(pos).add(new THREE.Vector3(0, 20, 0));
    this.scene.add(beam);
    this.beams.push({ mesh: beam, life: 0.45 });
    for (let i = 0; i < 50; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random(), Math.random() - 0.5).normalize().multiplyScalar(3 + Math.random() * 6);
      this.spawnParticle(pos.clone(), v, i % 2 ? 0xfde047 : 0xffffff, 0.6 + Math.random() * 0.6, { gravity: 6 });
    }
    // Scorch: burn grass to dirt around impact
    const bx = Math.floor(pos.x), by = Math.floor(pos.y) - 1, bz = Math.floor(pos.z);
    if (this.world.getBlock(bx, by, bz) === BlockType.GRASS) this.world.setBlock(bx, by, bz, BlockType.DIRT);
    this.damageArea(pos, 5, 20, 3, true);
  }

  private triggerAt(kind: BombType, pos: THREE.Vector3, fromNetwork: boolean) {
    switch (kind) {
      case "firework":
        this.burstFirework(pos);
        break;
      case "smoke":
        this.smokeCloud(pos);
        break;
      case "heal":
        this.healBurst(pos);
        break;
      case "thunder":
        this.thunderStrike(pos);
        break;
      case "tnt":
        this.explode(pos, fromNetwork);
        break;
    }
  }

  private isSolidAt(p: THREE.Vector3): boolean {
    const t = this.world.getBlock(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z));
    return t !== BlockType.AIR && !!BLOCK_DEFINITIONS[t]?.solid;
  }

  // ---------------- Frame update ----------------

  public update(dt: number) {
    // Fuses
    for (let i = this.fuses.length - 1; i >= 0; i--) {
      const f = this.fuses[i];
      f.timer -= dt;
      const blink = Math.sin(f.timer * (f.timer < 1 ? 40 : 14)) > 0;
      (f.flash.material as THREE.MeshBasicMaterial).opacity = blink ? 0.55 : 0.0;
      if (f.timer <= 0 || this.world.getBlock(f.x, f.y, f.z) !== BlockType.TNT) {
        this.scene.remove(f.flash);
        f.flash.geometry.dispose();
        (f.flash.material as THREE.Material).dispose();
        this.fuses.splice(i, 1);
        if (f.timer <= 0) {
          if (!f.fromNetwork) {
            this.world.setBlock(f.x, f.y, f.z, BlockType.AIR);
            if (this.onBlockDestroyed) this.onBlockDestroyed(f.x, f.y, f.z);
          }
          this.explode(new THREE.Vector3(f.x + 0.5, f.y + 0.5, f.z + 0.5), f.fromNetwork);
        }
      }
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.kind === "firework") {
        p.mesh.position.addScaledVector(p.velocity, dt);
        // sparkle trail
        if (Math.random() < 0.8) {
          this.spawnParticle(p.mesh.position.clone(), new THREE.Vector3((Math.random() - 0.5) * 1.5, -2, (Math.random() - 0.5) * 1.5), 0xfde047, 0.5, { gravity: 2 });
        }
        if (p.life <= 0 || this.isSolidAt(p.mesh.position)) {
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          this.triggerAt("firework", p.mesh.position.clone(), p.fromNetwork);
        }
        continue;
      }
      p.velocity.y -= 18 * dt;
      const next = p.mesh.position.clone().addScaledVector(p.velocity, dt);
      if (this.isSolidAt(next) || p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        this.triggerAt(p.kind, p.mesh.position.clone(), p.fromNetwork);
        continue;
      }
      p.mesh.position.copy(next);
      p.mesh.rotation.x += dt * 8;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        (pt.mesh.material as THREE.Material).dispose();
        this.particles.splice(i, 1);
        continue;
      }
      pt.velocity.y -= pt.gravity * dt;
      pt.velocity.multiplyScalar(pt.drag);
      pt.mesh.position.addScaledVector(pt.velocity, dt);
      const t = pt.life / pt.maxLife;
      (pt.mesh.material as THREE.MeshBasicMaterial).opacity = pt.shrink ? t : Math.min(1, t * 2);
      if (pt.shrink) pt.mesh.scale.setScalar(0.3 + t * 0.7);
      else pt.mesh.scale.setScalar(1 + (1 - t) * 2.2);
    }

    // Lights
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      l.life -= dt;
      if (l.life <= 0) {
        this.scene.remove(l.light);
        l.light.dispose();
        this.lights.splice(i, 1);
        continue;
      }
      l.light.intensity = l.intensity * (l.life / l.maxLife);
    }

    // Beams
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= dt;
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, b.life / 0.45);
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.beams.splice(i, 1);
      }
    }
  }

  public dispose() {
    for (const p of this.particles) this.scene.remove(p.mesh);
    for (const p of this.projectiles) this.scene.remove(p.mesh);
    for (const f of this.fuses) this.scene.remove(f.flash);
    for (const l of this.lights) this.scene.remove(l.light);
    for (const b of this.beams) this.scene.remove(b.mesh);
    this.particles = [];
    this.projectiles = [];
    this.fuses = [];
    this.lights = [];
    this.beams = [];
  }
}
