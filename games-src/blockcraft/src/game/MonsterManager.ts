import * as THREE from "three";
import { BlockType, MobType } from "../types";
import { VoxelWorld } from "./VoxelWorld";
import { soundFx } from "./SoundEffects";

export interface MonsterEntity {
  id: string;
  type: MobType;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  targetRotationY: number;
  health: number;
  maxHealth: number;
  isHurt: boolean;
  hurtTimer: number;
  walkCycle: number;
  soundTimer: number;
  jumpTimer: number;
  isGrounded: boolean;
  attackCooldown: number;
  // Node references for procedural animation
  head?: THREE.Object3D;
  leftArm?: THREE.Object3D;
  rightArm?: THREE.Object3D;
  leftLeg?: THREE.Object3D;
  rightLeg?: THREE.Object3D;
  innerBody?: THREE.Object3D;
  bodyMesh: THREE.Mesh;
  originalMaterial: THREE.Material | THREE.Material[];
}

export interface DroppedItem {
  id: string;
  blockType: BlockType;
  count: number;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  spawnTime: number;
  baseY: number;
}

interface SmokeParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class MonsterManager {
  private scene: THREE.Scene;
  private world: VoxelWorld;
  public monsters: MonsterEntity[] = [];
  public droppedItems: DroppedItem[] = [];
  private particles: SmokeParticle[] = [];
  private hurtMaterial: THREE.MeshBasicMaterial;

  public onPlayerDamaged?: (damage: number, attackerPos: THREE.Vector3) => void;
  public onItemPickup?: (blockType: BlockType, count: number) => void;

  constructor(scene: THREE.Scene, world: VoxelWorld) {
    this.scene = scene;
    this.world = world;

    this.hurtMaterial = new THREE.MeshBasicMaterial({
      color: 0xff2222,
      transparent: true,
      opacity: 0.85,
    });
  }

  // --- Monster Spawning ---
  public spawnMonster(type: MobType, pos: THREE.Vector3): MonsterEntity {
    const id = `mob_${type}_${Math.random().toString(36).substring(2, 9)}`;
    const group = new THREE.Group();
    group.position.copy(pos);

    let monster: MonsterEntity;

    if (type === "zombie") {
      monster = this.createZombie(id, group, pos);
    } else {
      monster = this.createSlime(id, group, pos);
    }

    this.scene.add(group);
    this.monsters.push(monster);
    soundFx.playSpawn();
    return monster;
  }

  // 1. Zombie 3D Mesh
  private createZombie(id: string, group: THREE.Group, pos: THREE.Vector3): MonsterEntity {
    // Head: Rotten green skin with dark hollow eyes
    const headMat = new THREE.MeshLambertMaterial({ color: 0x4d7c0f });
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.45, 0);
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
    const eyeGeo = new THREE.BoxGeometry(0.09, 0.09, 0.05);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.13, 0.05, 0.25);
    head.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.13, 0.05, 0.25);
    head.add(rightEye);

    // Torso: Cyan shirt
    const torsoMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.3);
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 0.85, 0);
    torso.castShadow = true;
    group.add(torso);

    // Arms: Outstretched forward in classic zombie pose
    const armMat = new THREE.MeshLambertMaterial({ color: 0x4d7c0f });
    const armGeo = new THREE.BoxGeometry(0.18, 0.18, 0.65);

    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-0.36, 1.05, 0.25);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(0.36, 1.05, 0.25);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs: Dark blue trousers
    const legMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const legGeo = new THREE.BoxGeometry(0.2, 0.65, 0.22);

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, 0.32, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, 0.32, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return {
      id,
      type: "zombie",
      group,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      rotationY: 0,
      targetRotationY: 0,
      health: 20,
      maxHealth: 20,
      isHurt: false,
      hurtTimer: 0,
      walkCycle: 0,
      soundTimer: 4 + Math.random() * 6,
      jumpTimer: 0,
      isGrounded: true,
      attackCooldown: 0,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      bodyMesh: torso,
      originalMaterial: torsoMat,
    };
  }

  // 2. Slime 3D Mesh: Translucent green cube with internal core
  private createSlime(id: string, group: THREE.Group, pos: THREE.Vector3): MonsterEntity {
    // Outer translucent jelly body
    const outerMat = new THREE.MeshLambertMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.68,
    });
    const outerGeo = new THREE.BoxGeometry(0.75, 0.75, 0.75);
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    outerMesh.position.set(0, 0.38, 0);
    outerMesh.castShadow = true;
    group.add(outerMesh);

    // Inner core
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const coreGeo = new THREE.BoxGeometry(0.38, 0.38, 0.38);
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(0, 0.38, 0);
    group.add(coreMesh);

    // Eyes on core
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x052e16 });
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.04);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.08, 0.2);
    coreMesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.08, 0.2);
    coreMesh.add(rightEye);

    return {
      id,
      type: "slime",
      group,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      rotationY: 0,
      targetRotationY: 0,
      health: 12,
      maxHealth: 12,
      isHurt: false,
      hurtTimer: 0,
      walkCycle: 0,
      soundTimer: 5 + Math.random() * 5,
      jumpTimer: 1.5 + Math.random() * 1.5,
      isGrounded: true,
      attackCooldown: 0,
      innerBody: coreMesh,
      bodyMesh: outerMesh,
      originalMaterial: outerMat,
    };
  }

  // --- Dropped Items in 3D Space ---
  public spawnDroppedItem(blockType: BlockType, pos: THREE.Vector3, count: number = 1): DroppedItem {
    const id = `drop_${Math.random().toString(36).substring(2, 9)}`;
    const group = new THREE.Group();

    // Create 3D miniature item model
    const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    let color = 0x38bdf8; // default diamond

    if (blockType === BlockType.ROTTEN_FLESH) color = 0x9a3412;
    else if (blockType === BlockType.SLIME_BALL) color = 0x4ade80;
    else if (blockType === BlockType.BONE) color = 0xf8fafc;
    else if (blockType === BlockType.DIAMOND) color = 0x38bdf8;
    else if (blockType === BlockType.GOLD_BLOCK) color = 0xfacc15;
    else if (blockType === BlockType.BREAD) color = 0xd97706;

    const mat = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    group.position.copy(pos);

    const drop: DroppedItem = {
      id,
      blockType,
      count,
      group,
      position: pos.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        3.5,
        (Math.random() - 0.5) * 2
      ),
      spawnTime: performance.now(),
      baseY: pos.y,
    };

    this.scene.add(group);
    this.droppedItems.push(drop);
    return drop;
  }

  // --- Combat: Player Hits Monster ---
  public attackMonster(rayOrigin: THREE.Vector3, rayDir: THREE.Vector3, heldItem: BlockType): boolean {
    let nearestMob: MonsterEntity | null = null;
    let minDistance = 3.6;

    for (const mob of this.monsters) {
      const mobCenter = mob.position.clone().add(new THREE.Vector3(0, 0.7, 0));
      const toMob = mobCenter.clone().sub(rayOrigin);
      const proj = toMob.dot(rayDir);

      if (proj > 0 && proj < minDistance) {
        const perpDist = toMob.clone().sub(rayDir.clone().multiplyScalar(proj)).length();
        if (perpDist < 0.8) {
          minDistance = proj;
          nearestMob = mob;
        }
      }
    }

    if (!nearestMob) return false;

    // Calculate Damage based on held item
    let damage = 2; // hand
    if (heldItem === BlockType.DIAMOND_SWORD) damage = 7;
    else if (heldItem === BlockType.DIAMOND_AXE) damage = 6;
    else if (heldItem === BlockType.WOODEN_SWORD) damage = 4;
    else if (heldItem === BlockType.WOODEN_AXE) damage = 3;
    else if (heldItem === BlockType.DIAMOND_PICKAXE) damage = 3;

    // Apply hit feedback
    nearestMob.isHurt = true;
    nearestMob.hurtTimer = 0.35;
    nearestMob.bodyMesh.material = this.hurtMaterial;

    if (nearestMob.type === "zombie") soundFx.playZombieHurt();
    else soundFx.playSlimeHurt();

    // Knockback
    const kbDir = nearestMob.position.clone().sub(rayOrigin).normalize();
    kbDir.y = 0.5;
    nearestMob.velocity.copy(kbDir.multiplyScalar(5.0));

    // Spawn hit particles
    this.spawnParticles(nearestMob.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xffffff, 6);

    nearestMob.health -= damage;

    if (nearestMob.health <= 0) {
      this.killMonster(nearestMob);
    }

    return true;
  }

  public killMonster(mob: MonsterEntity): void {
    // Monster Death Puff & Drops
    this.spawnParticles(mob.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0xd1d5db, 16);
    this.scene.remove(mob.group);

    // Drops
    if (mob.type === "zombie") {
      this.spawnDroppedItem(BlockType.ROTTEN_FLESH, mob.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 1 + Math.floor(Math.random() * 2));
      if (Math.random() < 0.4) {
        this.spawnDroppedItem(BlockType.BONE, mob.position.clone().add(new THREE.Vector3(0.2, 0.5, 0.2)), 1);
      }
      if (Math.random() < 0.15) {
        this.spawnDroppedItem(BlockType.DIAMOND, mob.position.clone().add(new THREE.Vector3(-0.2, 0.5, -0.2)), 1);
      }
    } else if (mob.type === "slime") {
      this.spawnDroppedItem(BlockType.SLIME_BALL, mob.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 1 + Math.floor(Math.random() * 3));
    }

    const idx = this.monsters.indexOf(mob);
    if (idx !== -1) this.monsters.splice(idx, 1);
  }

  public spawnSmokeParticle(pos: THREE.Vector3): void {
    this.spawnParticles(pos, 0xef4444, 2);
  }

  private spawnTimer: number = 0;

  // --- Main Update Loop ---
  public update(deltaTime: number, playerPos: THREE.Vector3, isNight: boolean = false): void {
    const timeSec = performance.now() * 0.001;

    // 0. Automatic Monster Spawning at Night or in Dark
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= 3.5) {
      this.spawnTimer = 0;
      if (isNight && this.monsters.length < 10) {
        // Find random position 18-32 blocks away from player
        const angle = Math.random() * Math.PI * 2;
        const dist = 18 + Math.random() * 14;
        const sx = Math.floor(playerPos.x + Math.cos(angle) * dist);
        const sz = Math.floor(playerPos.z + Math.sin(angle) * dist);
        const sy = this.world.getSurfaceHeight(sx, sz) + 1;

        // Check if area is illuminated by a torch
        const isTorchLit = this.world.isTorchNearby(sx, sy, sz, 9);
        if (!isTorchLit) {
          const mobType: MobType = Math.random() < 0.75 ? "zombie" : "slime";
          this.spawnMonster(mobType, new THREE.Vector3(sx + 0.5, sy, sz + 0.5));
        }
      }
    }

    // 1. Update Monsters
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const mob = this.monsters[i];

      // Zombie burn in daylight if not in shade
      if (!isNight && mob.type === "zombie" && mob.position.y >= this.world.getSurfaceHeight(mob.position.x, mob.position.z)) {
        mob.health -= deltaTime * 1.5;
        if (Math.random() < 0.2) {
          this.spawnSmokeParticle(mob.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
        }
        if (mob.health <= 0) {
          this.killMonster(mob);
          continue;
        }
      }

      // Hurt timer
      if (mob.isHurt) {
        mob.hurtTimer -= deltaTime;
        if (mob.hurtTimer <= 0) {
          mob.isHurt = false;
          mob.bodyMesh.material = mob.originalMaterial;
        }
      }

      // Attack cooldown
      if (mob.attackCooldown > 0) {
        mob.attackCooldown -= deltaTime;
      }

      // Sounds
      mob.soundTimer -= deltaTime;
      if (mob.soundTimer <= 0) {
        const dist = mob.position.distanceTo(playerPos);
        if (dist < 16) {
          if (mob.type === "zombie") soundFx.playZombieGroan();
        }
        mob.soundTimer = 6 + Math.random() * 8;
      }

      // AI Tracking toward player
      const toPlayer = playerPos.clone().sub(mob.position);
      toPlayer.y = 0;
      const distToPlayer = toPlayer.length();

      if (mob.type === "zombie") {
        // Zombie Walking AI
        if (distToPlayer > 0.8 && distToPlayer < 20) {
          mob.targetRotationY = Math.atan2(toPlayer.x, toPlayer.z);
          const walkDir = toPlayer.normalize();
          const speed = 2.2;
          mob.velocity.x = walkDir.x * speed;
          mob.velocity.z = walkDir.z * speed;

          mob.walkCycle += deltaTime * 7;
          if (mob.leftLeg && mob.rightLeg) {
            mob.leftLeg.rotation.x = Math.sin(mob.walkCycle) * 0.6;
            mob.rightLeg.rotation.x = -Math.sin(mob.walkCycle) * 0.6;
          }
        } else {
          mob.velocity.x *= 0.8;
          mob.velocity.z *= 0.8;
        }

        // Zombie attack contact with player
        if (distToPlayer < 1.4 && Math.abs(mob.position.y - playerPos.y) < 1.8 && mob.attackCooldown <= 0) {
          mob.attackCooldown = 1.2; // 1.2s between attacks
          if (this.onPlayerDamaged) {
            this.onPlayerDamaged(2, mob.position); // 2 damage = 1 full heart
          }
        }
      } else if (mob.type === "slime") {
        // Slime Bouncing AI
        mob.jumpTimer -= deltaTime;
        if (mob.jumpTimer <= 0 && mob.isGrounded) {
          mob.jumpTimer = 1.2 + Math.random() * 1.5;
          soundFx.playSlimeBounce();

          mob.targetRotationY = Math.atan2(toPlayer.x, toPlayer.z);
          const jumpDir = distToPlayer < 20 ? toPlayer.normalize() : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

          mob.velocity.y = 4.2;
          mob.velocity.x = jumpDir.x * 3.5;
          mob.velocity.z = jumpDir.z * 3.5;
        }

        // Squash & stretch animation
        if (!mob.isGrounded) {
          mob.group.scale.set(0.85, 1.25, 0.85);
        } else {
          mob.group.scale.set(1.15, 0.85, 1.15);
        }

        // Attack contact
        if (distToPlayer < 1.3 && Math.abs(mob.position.y - playerPos.y) < 1.2 && mob.attackCooldown <= 0) {
          mob.attackCooldown = 1.0;
          if (this.onPlayerDamaged) {
            this.onPlayerDamaged(1, mob.position); // 1 damage = 0.5 heart
          }
        }
      }

      // Gravity & Physics
      mob.velocity.y -= 18.0 * deltaTime;
      mob.position.x += mob.velocity.x * deltaTime;
      mob.position.z += mob.velocity.z * deltaTime;
      mob.position.y += mob.velocity.y * deltaTime;

      // Ground collision
      const checkX = Math.floor(mob.position.x);
      const checkZ = Math.floor(mob.position.z);
      let groundY = 0;
      for (let y = Math.floor(mob.position.y) + 1; y >= 0; y--) {
        const b = this.world.getBlock(checkX, y, checkZ);
        if (b !== BlockType.AIR) {
          groundY = y + 1;
          break;
        }
      }

      if (mob.position.y <= groundY) {
        mob.position.y = groundY;
        mob.velocity.y = 0;
        mob.isGrounded = true;
      } else {
        mob.isGrounded = false;
      }

      // Smooth rotation
      mob.rotationY = THREE.MathUtils.lerp(mob.rotationY, mob.targetRotationY, deltaTime * 8);
      mob.group.position.copy(mob.position);
      mob.group.rotation.y = mob.rotationY;
    }

    // 2. Update Dropped Items (Physics & Magnetic Auto-Pickup)
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.droppedItems[i];

      // Gravity / Floor
      drop.velocity.y -= 12 * deltaTime;
      drop.position.addScaledVector(drop.velocity, deltaTime);
      drop.velocity.x *= 0.9;
      drop.velocity.z *= 0.9;

      const blockX = Math.floor(drop.position.x);
      const blockZ = Math.floor(drop.position.z);
      let groundY = 0;
      for (let y = Math.floor(drop.position.y) + 1; y >= 0; y--) {
        const b = this.world.getBlock(blockX, y, blockZ);
        if (b !== BlockType.AIR) {
          groundY = y + 1;
          break;
        }
      }

      if (drop.position.y <= groundY + 0.15) {
        drop.position.y = groundY + 0.15;
        drop.velocity.set(0, 0, 0);
      }

      // Floating gentle bob & 360 rotation
      drop.group.rotation.y += deltaTime * 2.5;
      const bobOffset = Math.sin(timeSec * 3 + i) * 0.08;
      drop.group.position.set(drop.position.x, drop.position.y + bobOffset, drop.position.z);

      // Magnet attraction towards player
      const distToPlayer = drop.position.distanceTo(playerPos);
      if (distToPlayer < 2.8) {
        // Attract toward player
        const attractDir = playerPos.clone().add(new THREE.Vector3(0, 0.8, 0)).sub(drop.position).normalize();
        drop.position.addScaledVector(attractDir, 7.5 * deltaTime);

        // Pickup threshold
        if (distToPlayer < 0.8) {
          soundFx.playItemPickup();
          if (this.onItemPickup) {
            this.onItemPickup(drop.blockType, drop.count);
          }
          this.scene.remove(drop.group);
          this.droppedItems.splice(i, 1);
          continue;
        }
      }
    }

    // 3. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += deltaTime;
      p.mesh.position.addScaledVector(p.velocity, deltaTime);
      p.mesh.scale.setScalar(1 - p.life / p.maxLife);

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  // Helper: Particle burst
  private spawnParticles(pos: THREE.Vector3, color: number, count: number) {
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 3
      );
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: vel,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
      });
    }
  }

  public populateInitialMonsters() {
    if (this.monsters.length >= 4) return;
    const spawns: { type: MobType; x: number; z: number }[] = [
      { type: "zombie", x: -10, z: 12 },
      { type: "zombie", x: 12, z: -10 },
      { type: "slime", x: -8, z: -8 },
      { type: "slime", x: 9, z: 9 },
    ];

    for (const sp of spawns) {
      let gy = 20;
      for (let y = 30; y >= 0; y--) {
        const bt = this.world.getBlock(Math.floor(sp.x), y, Math.floor(sp.z));
        if (bt !== BlockType.AIR) {
          gy = y + 1;
          break;
        }
      }
      this.spawnMonster(sp.type, new THREE.Vector3(sp.x, gy, sp.z));
    }
  }

  public dispose() {
    for (const mob of this.monsters) {
      this.scene.remove(mob.group);
    }
    this.monsters = [];

    for (const drop of this.droppedItems) {
      this.scene.remove(drop.group);
    }
    this.droppedItems = [];

    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}
