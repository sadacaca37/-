import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, CharacterPreset } from "../types";
import { VoxelWorld } from "./VoxelWorld";
import { MonsterManager } from "./MonsterManager";
import { CharacterModel } from "./CharacterSkin";

// Villagers (wandering NPCs) and the Iron Golem that guards the village.
// Purely local/visual: every client runs its own copy, so in multiplayer the
// villagers may stand in different spots per player (like the animals do).

const VILLAGER_PRESETS: CharacterPreset[] = [
  { id: 10, nameKo: "농부", emoji: "🌾", skinColor: "#d9a578", hairColor: "#3b2a1a", shirtColor: "#8b5a2b", pantsColor: "#5c3d1e", accessory: "cap", accessoryColor: "#c9a227" },
  { id: 11, nameKo: "사서", emoji: "📚", skinColor: "#e0b48a", hairColor: "#6b4f2a", shirtColor: "#f5f5f4", pantsColor: "#44403c", accessory: "none" },
  { id: 12, nameKo: "대장장이", emoji: "⚒️", skinColor: "#c99466", hairColor: "#1c1917", shirtColor: "#374151", pantsColor: "#1f2937", accessory: "none" },
  { id: 13, nameKo: "상인", emoji: "💰", skinColor: "#d9a578", hairColor: "#57534e", shirtColor: "#7c2d12", pantsColor: "#3f2a1d", accessory: "hood", accessoryColor: "#9a3412" },
  { id: 14, nameKo: "어부", emoji: "🎣", skinColor: "#d4a070", hairColor: "#292524", shirtColor: "#0e7490", pantsColor: "#164e63", accessory: "cap", accessoryColor: "#155e75" },
];

interface Npc {
  kind: "villager" | "golem";
  model: CharacterModel | null;
  group: THREE.Group;
  parts: { leftLeg: THREE.Object3D; rightLeg: THREE.Object3D; leftArm: THREE.Object3D; rightArm: THREE.Object3D };
  position: THREE.Vector3;
  target: THREE.Vector3 | null;
  waitTimer: number;
  walkTimer: number;
  yaw: number;
  attackCooldown: number;
  nameKo: string;
  presetId?: number;
}

function makeNameSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
  ctx.beginPath();
  ctx.roundRect(8, 10, 240, 44, 22);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = "bold 22px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sprite.scale.set(1.3, 0.33, 1);
  return sprite;
}

export class VillagerManager {
  private scene: THREE.Scene;
  private world: VoxelWorld;
  public monsterManager: MonsterManager | null = null;
  private npcs: Npc[] = [];
  private center = new THREE.Vector3();
  private radius = 18;

  constructor(scene: THREE.Scene, world: VoxelWorld) {
    this.scene = scene;
    this.world = world;
  }

  public populate(centerX: number, centerZ: number, villagers: number = 5, golems: number = 1) {
    this.clear();
    this.center.set(centerX, 0, centerZ);
    for (let i = 0; i < villagers; i++) {
      const preset = VILLAGER_PRESETS[i % VILLAGER_PRESETS.length];
      const v = this.buildVillager(preset);
      const a = (i / villagers) * Math.PI * 2;
      const x = centerX + Math.cos(a) * 5, z = centerZ + Math.sin(a) * 5;
      const y = this.world.getSurfaceHeight(x, z) + 1;
      v.group.position.set(x, y, z);
      const tag = makeNameSprite(`${preset.emoji} ${preset.nameKo}`, "#d6d3d1");
      tag.position.set(0, 2.25, 0);
      v.group.add(tag);
      this.scene.add(v.group);
      this.npcs.push({
        kind: "villager",
        model: null,
        group: v.group,
        parts: v.parts,
        position: new THREE.Vector3(x, y, z),
        target: null,
        waitTimer: Math.random() * 3,
        walkTimer: 0,
        yaw: 0,
        attackCooldown: 0,
        nameKo: preset.nameKo,
        presetId: preset.id,
      });
    }
    for (let i = 0; i < golems; i++) {
      const g = this.buildGolem();
      const x = centerX + 3, z = centerZ + 3;
      const y = this.world.getSurfaceHeight(x, z) + 1;
      g.group.position.set(x, y, z);
      const tag = makeNameSprite("🛡️ 철 골렘", "#9ca3af");
      tag.position.set(0, 3.85, 0);
      g.group.add(tag);
      this.scene.add(g.group);
      this.npcs.push({
        kind: "golem",
        model: null,
        group: g.group,
        parts: g.parts,
        position: new THREE.Vector3(x, y, z),
        target: null,
        waitTimer: 1,
        walkTimer: 0,
        yaw: 0,
        attackCooldown: 0,
        nameKo: "철 골렘",
      });
    }
  }

  // Robed villager: tall head with a big nose and heavy brow, a single long
  // robe instead of legs, arms folded across the chest. Robe colour = job.
  private buildVillager(preset: CharacterPreset) {
    const group = new THREE.Group();
    const lam = (c: string | number) => new THREE.MeshLambertMaterial({ color: new THREE.Color(c as any) });
    const skin = lam(preset.skinColor);
    const robe = lam(preset.shirtColor);
    const robeDark = lam(new THREE.Color(preset.shirtColor).offsetHSL(0, 0, -0.12).getHex());
    const mk = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    // Feet (dark, peeking out under the hem)
    const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
    mk(0.2, 0.22, 0.26, lam(0x3f3f46), -0.12, 0.11, 0, leftLeg);
    mk(0.2, 0.22, 0.26, lam(0x3f3f46), 0.12, 0.11, 0, rightLeg);
    group.add(leftLeg, rightLeg);
    // Robe: one long body from the feet to the shoulders, lighter upper panel
    mk(0.55, 1.15, 0.38, robeDark, 0, 0.2 + 1.15 / 2, 0);
    mk(0.57, 0.45, 0.4, robe, 0, 1.15, 0);
    mk(0.2, 0.9, 0.05, lam(0x8b7355), 0, 0.75, 0.2); // apron / sash stripe
    // Arms folded across the chest
    const leftArm = new THREE.Group(), rightArm = new THREE.Group();
    leftArm.position.set(0, 1.12, 0);
    rightArm.position.set(0, 1.12, 0);
    mk(0.72, 0.22, 0.24, robe, 0, 0.04, 0.3, leftArm); // forearms crossed
    mk(0.2, 0.2, 0.2, skin, 0.34, 0.04, 0.3, leftArm); // hand
    mk(0.2, 0.2, 0.2, skin, -0.34, 0.04, 0.3, leftArm);
    mk(0.22, 0.5, 0.24, robe, -0.38, 0.0, 0.08, rightArm); // upper arms at the sides
    mk(0.22, 0.5, 0.24, robe, 0.38, 0.0, 0.08, rightArm);
    group.add(leftArm, rightArm);
    // Head: taller than wide, with a long nose and a heavy brow
    const head = new THREE.Group();
    head.position.set(0, 1.4, 0);
    mk(0.5, 0.62, 0.5, skin, 0, 0.31, 0, head);
    mk(0.12, 0.26, 0.12, skin, 0, 0.2, 0.3, head); // nose
    mk(0.42, 0.06, 0.04, lam(0x4a3426), 0, 0.42, 0.26, head); // brow
    mk(0.1, 0.07, 0.03, lam(0xf1f5f9), -0.12, 0.33, 0.26, head); // eye whites
    mk(0.1, 0.07, 0.03, lam(0xf1f5f9), 0.12, 0.33, 0.26, head);
    mk(0.05, 0.07, 0.03, lam(0x2f8f4e), -0.1, 0.33, 0.265, head); // pupils
    mk(0.05, 0.07, 0.03, lam(0x2f8f4e), 0.1, 0.33, 0.265, head);
    mk(0.2, 0.04, 0.03, lam(0x8c6b52), 0, 0.12, 0.26, head); // mouth
    // Hair / job hat
    if (preset.accessory === "cap") {
      mk(0.56, 0.1, 0.56, lam(preset.accessoryColor || preset.hairColor), 0, 0.66, 0, head);
      mk(0.62, 0.04, 0.62, lam(preset.accessoryColor || preset.hairColor), 0, 0.6, 0, head);
    } else if (preset.accessory === "hood") {
      mk(0.56, 0.3, 0.56, lam(preset.accessoryColor || preset.hairColor), 0, 0.52, -0.02, head);
    } else {
      mk(0.52, 0.12, 0.52, lam(preset.hairColor), 0, 0.64, 0, head);
    }
    group.add(head);
    return { group, parts: { leftLeg, rightLeg, leftArm, rightArm } };
  }

  // Iron golem (~3.2 tall): pale stone-grey body with darker joints, a wide
  // head with a heavy brow over red eyes and a long nose, huge arms and
  // short legs, with vines and little yellow flowers creeping over it.
  private buildGolem() {
    const group = new THREE.Group();
    const pale = new THREE.MeshLambertMaterial({ color: 0xd6d3c8 });
    const pale2 = new THREE.MeshLambertMaterial({ color: 0xc4c0b2 });
    const joint = new THREE.MeshLambertMaterial({ color: 0x8f8a7c });
    const brow = new THREE.MeshLambertMaterial({ color: 0x4b4842 });
    const vine = new THREE.MeshLambertMaterial({ color: 0x4d8a3a });
    const bloom = new THREE.MeshLambertMaterial({ color: 0xeab308 });
    const eye = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
    const mk = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = group) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      parent.add(m);
      return m;
    };
    // Flat vine patches stuck on a surface (z is the surface offset)
    const vines = (parent: THREE.Object3D, spots: Array<[number, number, number, number, number]>) => {
      for (const [x, y, z, w, h] of spots) {
        mk(w, h, 0.03, vine, x, y, z, parent);
        if (Math.random() < 0.5) mk(0.08, 0.08, 0.035, bloom, x + (Math.random() - 0.5) * w * 0.6, y + (Math.random() - 0.5) * h * 0.6, z, parent);
      }
    };
    // Short, stocky legs (pivot at the hip)
    const makeLeg = (x: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.2, 0);
      mk(0.48, 0.7, 0.52, pale2, 0, -0.35, 0, pivot); // thigh
      mk(0.5, 0.5, 0.54, joint, 0, -0.95, 0, pivot); // dark lower leg
      vines(pivot, [[0.1, -0.4, 0.27, 0.12, 0.4]]);
      group.add(pivot);
      return pivot;
    };
    const leftLeg = makeLeg(-0.34), rightLeg = makeLeg(0.34);
    // Torso: wide chest with a narrower dark waist, shoulder slabs on top
    mk(0.95, 0.4, 0.62, joint, 0, 1.4, 0); // waist
    mk(1.35, 1.0, 0.8, pale, 0, 2.1, 0); // chest
    mk(1.55, 0.25, 0.85, pale2, 0, 2.7, 0); // shoulders
    mk(0.5, 0.9, 0.06, pale2, 0, 2.1, 0.41); // chest plate stripe
    vines(group, [[-0.45, 2.05, 0.41, 0.14, 0.7], [0.4, 1.95, 0.41, 0.1, 0.5], [0.3, 2.2, -0.41, 0.16, 0.6], [0.0, 1.45, 0.32, 0.1, 0.3]]);
    // Long, massive arms (pivot at the shoulder)
    const makeArm = (x: number) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 2.75, 0);
      mk(0.5, 1.0, 0.55, pale, 0, -0.5, 0, pivot); // upper arm
      mk(0.52, 1.05, 0.57, pale2, 0, -1.5, 0, pivot); // forearm
      mk(0.56, 0.3, 0.6, joint, 0, -2.1, 0, pivot); // fist
      vines(pivot, [[x < 0 ? -0.26 : 0.26, -0.9, 0.0, 0.03, 0.9], [0.05, -1.4, 0.29, 0.14, 0.6]]);
      group.add(pivot);
      return pivot;
    };
    const leftArm = makeArm(-0.98), rightArm = makeArm(0.98);
    // Head: wide block with a heavy dark brow, red eyes and a long nose
    const head = new THREE.Group();
    head.position.set(0, 2.82, 0);
    mk(0.72, 0.72, 0.7, pale, 0, 0.36, 0, head);
    mk(0.76, 0.2, 0.74, pale2, 0, 0.65, 0, head); // cap of the head
    mk(0.72, 0.16, 0.12, brow, 0, 0.5, 0.36, head); // brow band
    mk(0.12, 0.1, 0.05, eye, -0.2, 0.4, 0.37, head);
    mk(0.12, 0.1, 0.05, eye, 0.2, 0.4, 0.37, head);
    mk(0.2, 0.42, 0.2, pale2, 0, 0.18, 0.42, head); // long nose
    vines(head, [[-0.28, 0.25, 0.36, 0.08, 0.3]]);
    group.add(head);
    return { group, parts: { leftLeg, rightLeg, leftArm, rightArm } };
  }

  private pickTarget(npc: Npc) {
    for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * (npc.kind === "golem" ? this.radius : this.radius - 4);
      const x = this.center.x + Math.cos(a) * r, z = this.center.z + Math.sin(a) * r;
      const y = this.world.getSurfaceHeight(x, z) + 1;
      // Avoid water and big height jumps
      const ground = this.world.getBlock(x, y - 1, z);
      if (ground === BlockType.WATER || Math.abs(y - npc.position.y) > 3) continue;
      npc.target = new THREE.Vector3(x, y, z);
      return;
    }
    npc.target = null;
  }

  public update(dt: number) {
    for (const npc of this.npcs) {
      npc.attackCooldown = Math.max(0, npc.attackCooldown - dt);
      const speed = npc.kind === "golem" ? 1.6 : 1.3;
      let moving = false;

      // Golem: chase the nearest monster within 8 blocks and hit it
      if (npc.kind === "golem" && this.monsterManager) {
        let nearest: { position: THREE.Vector3; health: number } | null = null;
        let best = 8;
        for (const mob of this.monsterManager.monsters) {
          const d = mob.position.distanceTo(npc.position);
          if (d < best) {
            best = d;
            nearest = mob;
          }
        }
        if (nearest) {
          npc.target = nearest.position.clone();
          if (best < 2.0 && npc.attackCooldown <= 0) {
            npc.attackCooldown = 1.0;
            const mob = this.monsterManager.monsters.find((m) => m.position === nearest!.position);
            if (mob) {
              mob.health -= 10;
              mob.isHurt = true;
              mob.hurtTimer = 0.4;
              const kb = mob.position.clone().sub(npc.position).normalize();
              kb.y = 0.9;
              mob.velocity.copy(kb.multiplyScalar(9));
              if (mob.health <= 0) this.monsterManager.killMonster(mob);
            }
            // Arm swing
            npc.parts.leftArm.rotation.x = -1.6;
            npc.parts.rightArm.rotation.x = -1.6;
          }
        }
      }

      if (!npc.target) {
        npc.waitTimer -= dt;
        if (npc.waitTimer <= 0) {
          this.pickTarget(npc);
          npc.waitTimer = 2 + Math.random() * 4;
        }
      } else {
        const to = npc.target.clone().sub(npc.position);
        to.y = 0;
        const dist = to.length();
        if (dist < 0.4) {
          npc.target = null;
        } else {
          to.normalize();
          const step = Math.min(dist, speed * dt);
          const nx = npc.position.x + to.x * step, nz = npc.position.z + to.z * step;
          const gy = this.world.getSurfaceHeight(nx, nz) + 1;
          // Blocked by a wall taller than one step? Give up on this target
          if (gy - npc.position.y > 1.1) {
            npc.target = null;
          } else {
            npc.position.set(nx, gy, nz);
            npc.yaw = Math.atan2(to.x, to.z);
            moving = true;
          }
        }
      }

      // Apply transform + walk animation
      npc.group.position.copy(npc.position);
      npc.group.rotation.y = npc.yaw;
      if (moving) {
        npc.walkTimer += dt * (npc.kind === "golem" ? 6 : 10);
        const swing = Math.sin(npc.walkTimer) * (npc.kind === "golem" ? 0.35 : 0.55);
        npc.parts.leftLeg.rotation.x = swing;
        npc.parts.rightLeg.rotation.x = -swing;
        if (npc.kind === "golem" && npc.attackCooldown <= 0.6) {
          npc.parts.leftArm.rotation.x = -swing * 0.8;
          npc.parts.rightArm.rotation.x = swing * 0.8;
        }
        if (npc.kind === "villager") npc.group.position.y = npc.position.y + Math.abs(Math.sin(npc.walkTimer)) * 0.04;
      } else {
        for (const o of [npc.parts.leftLeg, npc.parts.rightLeg]) o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, 0, 0.15);
        if (npc.attackCooldown <= 0.6) {
          for (const o of [npc.parts.leftArm, npc.parts.rightArm]) o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, 0, 0.15);
        }
      }
    }
  }

  // Which villager (if any) is in the crosshair within reach
  public findVillagerAt(origin: THREE.Vector3, dir: THREE.Vector3): { index: number; nameKo: string; presetId: number } | null {
    const ray = new THREE.Ray(origin, dir);
    let best: Npc | null = null;
    let bestIdx = -1;
    let minDist = 4.5;
    this.npcs.forEach((npc, i) => {
      if (npc.kind !== "villager") return;
      const center = npc.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      if (ray.distanceToPoint(center) < 0.9 && origin.distanceTo(center) < minDist) {
        minDist = origin.distanceTo(center);
        best = npc;
        bestIdx = i;
      }
    });
    if (!best) return null;
    const b = best as Npc;
    return { index: bestIdx, nameKo: b.nameKo, presetId: b.presetId ?? 10 };
  }

  public getPositions(): THREE.Vector3[] {
    return this.npcs.map((n) => n.position.clone());
  }

  public clear() {
    for (const n of this.npcs) this.scene.remove(n.group);
    this.npcs = [];
  }

  public dispose() {
    this.clear();
  }
}

// Keep the import used (BLOCK_DEFINITIONS is handy for future villager jobs)
void BLOCK_DEFINITIONS;
