import * as THREE from "three";
import { AnimalType, BLOCK_DEFINITIONS, BlockType } from "../types";
import { VoxelWorld } from "./VoxelWorld";
import { soundFx } from "./SoundEffects";

export interface AnimalEntity {
  id: string;
  type: AnimalType;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotationY: number;
  targetRotationY: number;
  walkSpeed: number;
  walkCycle: number;
  isGrounded: boolean;
  state: "idle" | "walk" | "panic" | "peck";
  stateTimer: number;
  soundTimer: number;
  health: number;
  isHurt: boolean;
  hurtTimer: number;
  loveTimer: number;
  // Node references for procedural animation
  head: THREE.Object3D;
  beakOrSnout?: THREE.Object3D;
  leftWingOrArm?: THREE.Object3D;
  rightWingOrArm?: THREE.Object3D;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftBackLeg?: THREE.Object3D;
  rightBackLeg?: THREE.Object3D;
  bodyMesh: THREE.Mesh;
  originalMaterial: THREE.Material | THREE.Material[];
}

interface FloatingParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class AnimalManager {
  private scene: THREE.Scene;
  private world: VoxelWorld;
  public animals: AnimalEntity[] = [];
  private particles: FloatingParticle[] = [];
  private hurtMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene, world: VoxelWorld) {
    this.scene = scene;
    this.world = world;

    this.hurtMaterial = new THREE.MeshBasicMaterial({
      color: 0xff3333,
      transparent: true,
      opacity: 0.85,
    });
  }

  // Initial population of world with ducks, chickens, and pastures
  public spawnInitialPopulation(centerX: number = 0, centerZ: number = 0) {
    // Clear any previous animals
    this.clear();

    // Spawn Ducks (around grassy shores or meadows)
    const duckCount = 7;
    for (let i = 0; i < duckCount; i++) {
      const angle = (i / duckCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 6 + Math.random() * 16;
      const x = Math.round(centerX + Math.cos(angle) * radius) + 0.5;
      const z = Math.round(centerZ + Math.sin(angle) * radius) + 0.5;
      const y = this.world.getSurfaceHeight(Math.floor(x), Math.floor(z)) + 1.0;
      this.spawnAnimal("duck", new THREE.Vector3(x, y, z), false);
    }

    // Spawn Chickens
    const chickenCount = 7;
    for (let i = 0; i < chickenCount; i++) {
      const angle = (i / chickenCount) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 8 + Math.random() * 18;
      const x = Math.round(centerX + Math.cos(angle) * radius) + 0.5;
      const z = Math.round(centerZ + Math.sin(angle) * radius) + 0.5;
      const y = this.world.getSurfaceHeight(Math.floor(x), Math.floor(z)) + 1.0;
      this.spawnAnimal("chicken", new THREE.Vector3(x, y, z), false);
    }

    // Spawn Sheep
    const sheepCount = 4;
    for (let i = 0; i < sheepCount; i++) {
      const angle = (i / sheepCount) * Math.PI * 2;
      const radius = 12 + Math.random() * 14;
      const x = Math.round(centerX + Math.cos(angle) * radius) + 0.5;
      const z = Math.round(centerZ + Math.sin(angle) * radius) + 0.5;
      const y = this.world.getSurfaceHeight(Math.floor(x), Math.floor(z)) + 1.0;
      this.spawnAnimal("sheep", new THREE.Vector3(x, y, z), false);
    }

    // Spawn Cows
    const cowCount = 3;
    for (let i = 0; i < cowCount; i++) {
      const angle = (i / cowCount) * Math.PI * 2 + 1.2;
      const radius = 14 + Math.random() * 15;
      const x = Math.round(centerX + Math.cos(angle) * radius) + 0.5;
      const z = Math.round(centerZ + Math.sin(angle) * radius) + 0.5;
      const y = this.world.getSurfaceHeight(Math.floor(x), Math.floor(z)) + 1.0;
      this.spawnAnimal("cow", new THREE.Vector3(x, y, z), false);
    }
  }

  // Clear all animal meshes
  public clear() {
    for (const animal of this.animals) {
      this.scene.remove(animal.group);
    }
    this.animals = [];
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }

  // Create a 3D procedural voxel animal model
  public spawnAnimal(type: AnimalType, pos: THREE.Vector3, playSound: boolean = true): AnimalEntity {
    const group = new THREE.Group();
    group.position.copy(pos);

    let animal: AnimalEntity;

    if (type === "duck") {
      animal = this.buildDuck(group);
    } else if (type === "chicken") {
      animal = this.buildChicken(group);
    } else if (type === "sheep") {
      animal = this.buildSheep(group);
    } else {
      animal = this.buildCow(group);
    }

    this.scene.add(group);
    this.animals.push(animal);

    if (playSound) {
      soundFx.playSpawn();
      if (type === "duck") soundFx.playDuckQuack();
      else if (type === "chicken") soundFx.playChickenCluck();
      // Spawn cheerful heart/star burst
      this.spawnParticles(pos.clone().add(new THREE.Vector3(0, 0.6, 0)), 0xffe066, 6);
    }

    return animal;
  }

  // 1. Build Adorable Duck Model (Mallard Green head, Orange bill, feather body)
  private buildDuck(group: THREE.Group): AnimalEntity {
    const isMallard = Math.random() > 0.4;
    const bodyColor = isMallard ? 0x3d7042 : 0xf6d854; // Mallard dark feather green or yellow duckling
    const headColor = isMallard ? 0x1b4d3e : 0xf6d854;
    const billColor = 0xff8c00; // Bright orange duck bill
    const footColor = 0xff7700;

    // Body
    const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
    const bodyGeo = new THREE.BoxGeometry(0.46, 0.38, 0.6);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.35, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Cute upturned tail feathers
    const tailGeo = new THREE.BoxGeometry(0.24, 0.14, 0.22);
    const tailMesh = new THREE.Mesh(tailGeo, bodyMat);
    tailMesh.position.set(0, 0.16, -0.32);
    tailMesh.rotation.x = -0.35;
    bodyMesh.add(tailMesh);

    // Head Pivot & Mesh
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.25, 0.26);
    bodyMesh.add(headPivot);

    const headMat = new THREE.MeshLambertMaterial({ color: headColor });
    const headGeo = new THREE.BoxGeometry(0.3, 0.34, 0.3);
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 0.15, 0);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    // Eyes (left & right)
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.BoxGeometry(0.04, 0.08, 0.08);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.155, 0.04, 0.05);
    headMesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.155, 0.04, 0.05);
    headMesh.add(rightEye);

    // Wide flat duck bill
    const billMat = new THREE.MeshLambertMaterial({ color: billColor });
    const billGeo = new THREE.BoxGeometry(0.22, 0.08, 0.22);
    const billMesh = new THREE.Mesh(billGeo, billMat);
    billMesh.position.set(0, -0.06, 0.2);
    headMesh.add(billMesh);

    // Wings
    const wingMat = new THREE.MeshLambertMaterial({ color: isMallard ? 0x2d5530 : 0xebb734 });
    const wingGeo = new THREE.BoxGeometry(0.07, 0.28, 0.42);

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.25, 0.02, 0);
    bodyMesh.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.25, 0.02, 0);
    bodyMesh.add(rightWing);

    // Legs & Webbed Feet
    const legMat = new THREE.MeshLambertMaterial({ color: footColor });
    const legGeo = new THREE.BoxGeometry(0.08, 0.22, 0.08);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.14, 0.2, 0.02);
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(0, -0.11, 0);
    leftLegGroup.add(leftLeg);
    // Foot
    const footGeo = new THREE.BoxGeometry(0.14, 0.04, 0.16);
    const leftFoot = new THREE.Mesh(footGeo, legMat);
    leftFoot.position.set(0, -0.2, 0.04);
    leftLegGroup.add(leftFoot);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.14, 0.2, 0.02);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0, -0.11, 0);
    rightLegGroup.add(rightLeg);
    const rightFoot = new THREE.Mesh(footGeo, legMat);
    rightFoot.position.set(0, -0.2, 0.04);
    rightLegGroup.add(rightFoot);
    group.add(rightLegGroup);

    return {
      id: "duck_" + Math.random().toString(36).substring(2, 9),
      type: "duck",
      group,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: Math.random() * Math.PI * 2,
      targetRotationY: Math.random() * Math.PI * 2,
      walkSpeed: 1.8 + Math.random() * 0.4,
      walkCycle: 0,
      isGrounded: true,
      state: "idle",
      stateTimer: 2 + Math.random() * 4,
      soundTimer: 5 + Math.random() * 12,
      health: 4,
      isHurt: false,
      hurtTimer: 0,
      loveTimer: 0,
      head: headPivot,
      beakOrSnout: billMesh,
      leftWingOrArm: leftWing,
      rightWingOrArm: rightWing,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      bodyMesh,
      originalMaterial: bodyMat,
    };
  }

  // 2. Build Chicken Model (White feathers, yellow beak, red wattle & comb)
  private buildChicken(group: THREE.Group): AnimalEntity {
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    const bodyGeo = new THREE.BoxGeometry(0.44, 0.4, 0.54);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 0.38, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Head Pivot
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.24, 0.24);
    bodyMesh.add(headPivot);

    const headGeo = new THREE.BoxGeometry(0.28, 0.32, 0.26);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 0.16, 0);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.BoxGeometry(0.04, 0.06, 0.06);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.145, 0.04, 0.04);
    headMesh.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.145, 0.04, 0.04);
    headMesh.add(rightEye);

    // Yellow Beak
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
    const beakGeo = new THREE.BoxGeometry(0.14, 0.08, 0.14);
    const beakMesh = new THREE.Mesh(beakGeo, beakMat);
    beakMesh.position.set(0, -0.04, 0.16);
    headMesh.add(beakMesh);

    // Red Wattle under beak
    const redMat = new THREE.MeshLambertMaterial({ color: 0xef4444 });
    const wattleGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
    const wattleMesh = new THREE.Mesh(wattleGeo, redMat);
    wattleMesh.position.set(0, -0.12, 0.1);
    headMesh.add(wattleMesh);

    // Red Comb on top of head
    const combGeo = new THREE.BoxGeometry(0.08, 0.1, 0.16);
    const combMesh = new THREE.Mesh(combGeo, redMat);
    combMesh.position.set(0, 0.2, -0.02);
    headMesh.add(combMesh);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.06, 0.26, 0.38);
    const leftWing = new THREE.Mesh(wingGeo, bodyMat);
    leftWing.position.set(-0.24, 0.02, 0);
    bodyMesh.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, bodyMat);
    rightWing.position.set(0.24, 0.02, 0);
    bodyMesh.add(rightWing);

    // Chicken Legs
    const legGeo = new THREE.BoxGeometry(0.06, 0.24, 0.06);
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.12, 0.22, 0.02);
    const leftLeg = new THREE.Mesh(legGeo, beakMat);
    leftLeg.position.set(0, -0.12, 0);
    leftLegGroup.add(leftLeg);
    group.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.12, 0.22, 0.02);
    const rightLeg = new THREE.Mesh(legGeo, beakMat);
    rightLeg.position.set(0, -0.12, 0);
    rightLegGroup.add(rightLeg);
    group.add(rightLegGroup);

    return {
      id: "chicken_" + Math.random().toString(36).substring(2, 9),
      type: "chicken",
      group,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: Math.random() * Math.PI * 2,
      targetRotationY: Math.random() * Math.PI * 2,
      walkSpeed: 1.6 + Math.random() * 0.4,
      walkCycle: 0,
      isGrounded: true,
      state: "idle",
      stateTimer: 2 + Math.random() * 3,
      soundTimer: 4 + Math.random() * 10,
      health: 4,
      isHurt: false,
      hurtTimer: 0,
      loveTimer: 0,
      head: headPivot,
      beakOrSnout: beakMesh,
      leftWingOrArm: leftWing,
      rightWingOrArm: rightWing,
      leftLeg: leftLegGroup,
      rightLeg: rightLegGroup,
      bodyMesh,
      originalMaterial: bodyMat,
    };
  }

  // 3. Build Sheep Model
  private buildSheep(group: THREE.Group): AnimalEntity {
    const woolMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const bodyGeo = new THREE.BoxGeometry(0.68, 0.6, 0.95);
    const bodyMesh = new THREE.Mesh(bodyGeo, woolMat);
    bodyMesh.position.set(0, 0.65, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Head
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.3, 0.5);
    bodyMesh.add(headPivot);

    const skinMat = new THREE.MeshLambertMaterial({ color: 0xcdb498 });
    const headGeo = new THREE.BoxGeometry(0.36, 0.36, 0.38);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.1, 0.1);
    headPivot.add(headMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.45, 0.16);
    const legMat = new THREE.MeshLambertMaterial({ color: 0xcdb498 });

    const flLeg = new THREE.Group();
    flLeg.position.set(-0.22, 0.45, 0.3);
    flLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(flLeg);

    const frLeg = new THREE.Group();
    frLeg.position.set(0.22, 0.45, 0.3);
    frLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(frLeg);

    const blLeg = new THREE.Group();
    blLeg.position.set(-0.22, 0.45, -0.3);
    blLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(blLeg);

    const brLeg = new THREE.Group();
    brLeg.position.set(0.22, 0.45, -0.3);
    brLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(brLeg);

    return {
      id: "sheep_" + Math.random().toString(36).substring(2, 9),
      type: "sheep",
      group,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: Math.random() * Math.PI * 2,
      targetRotationY: Math.random() * Math.PI * 2,
      walkSpeed: 1.4,
      walkCycle: 0,
      isGrounded: true,
      state: "idle",
      stateTimer: 3,
      soundTimer: 10,
      health: 8,
      isHurt: false,
      hurtTimer: 0,
      loveTimer: 0,
      head: headPivot,
      leftLeg: flLeg,
      rightLeg: frLeg,
      leftBackLeg: blLeg,
      rightBackLeg: brLeg,
      bodyMesh,
      originalMaterial: woolMat,
    };
  }

  // 4. Build Cow Model
  private buildCow(group: THREE.Group): AnimalEntity {
    const cowMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
    const bodyGeo = new THREE.BoxGeometry(0.75, 0.68, 1.1);
    const bodyMesh = new THREE.Mesh(bodyGeo, cowMat);
    bodyMesh.position.set(0, 0.72, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    // Head
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.35, 0.55);
    bodyMesh.add(headPivot);

    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.42);
    const headMesh = new THREE.Mesh(headGeo, cowMat);
    headMesh.position.set(0, 0.15, 0.12);
    headPivot.add(headMesh);

    // Snout
    const snoutMat = new THREE.MeshLambertMaterial({ color: 0xcca691 });
    const snoutGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    const snoutMesh = new THREE.Mesh(snoutGeo, snoutMat);
    snoutMesh.position.set(0, -0.08, 0.28);
    headMesh.add(snoutMesh);

    // Horns
    const hornMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const hornGeo = new THREE.BoxGeometry(0.08, 0.14, 0.08);
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.position.set(-0.22, 0.24, -0.05);
    headMesh.add(leftHorn);
    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.position.set(0.22, 0.24, -0.05);
    headMesh.add(rightHorn);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.5, 0.18);
    const legMat = new THREE.MeshLambertMaterial({ color: 0x422a19 });

    const flLeg = new THREE.Group();
    flLeg.position.set(-0.25, 0.45, 0.35);
    flLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(flLeg);

    const frLeg = new THREE.Group();
    frLeg.position.set(0.25, 0.45, 0.35);
    frLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(frLeg);

    const blLeg = new THREE.Group();
    blLeg.position.set(-0.25, 0.45, -0.35);
    blLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(blLeg);

    const brLeg = new THREE.Group();
    brLeg.position.set(0.25, 0.45, -0.35);
    brLeg.add(new THREE.Mesh(legGeo, legMat));
    group.add(brLeg);

    return {
      id: "cow_" + Math.random().toString(36).substring(2, 9),
      type: "cow",
      group,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      rotationY: Math.random() * Math.PI * 2,
      targetRotationY: Math.random() * Math.PI * 2,
      walkSpeed: 1.3,
      walkCycle: 0,
      isGrounded: true,
      state: "idle",
      stateTimer: 3,
      soundTimer: 12,
      health: 10,
      isHurt: false,
      hurtTimer: 0,
      loveTimer: 0,
      head: headPivot,
      leftLeg: flLeg,
      rightLeg: frLeg,
      leftBackLeg: blLeg,
      rightBackLeg: brLeg,
      bodyMesh,
      originalMaterial: cowMat,
    };
  }

  // Floating heart / sparkle particles
  public spawnParticles(pos: THREE.Vector3, color: number = 0xff3366, count: number = 5) {
    const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const pMat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.copy(pos);
      pMesh.position.x += (Math.random() - 0.5) * 0.4;
      pMesh.position.y += Math.random() * 0.3;
      pMesh.position.z += (Math.random() - 0.5) * 0.4;

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        1.5 + Math.random() * 1.2,
        (Math.random() - 0.5) * 1.5
      );

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: vel,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
      });
    }
  }

  // Main update loop for all entities: AI, physics, terrain collision, and animations
  public update(deltaTime: number, playerPos?: THREE.Vector3) {
    const dt = Math.min(deltaTime, 0.1);

    // Update floating particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 3.0 * dt; // light gravity
      p.mesh.scale.setScalar(Math.max(0, 1 - p.life / p.maxLife));

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.animals.length - 1; i >= 0; i--) {
      const animal = this.animals[i];

      // Hurt timer & flash recovery
      if (animal.isHurt) {
        animal.hurtTimer -= dt;
        if (animal.hurtTimer <= 0) {
          animal.isHurt = false;
          animal.bodyMesh.material = animal.originalMaterial;
        }
      }

      // Sounds
      animal.soundTimer -= dt;
      if (animal.soundTimer <= 0) {
        if (animal.type === "duck") {
          soundFx.playDuckQuack();
          animal.soundTimer = 8 + Math.random() * 16;
        } else if (animal.type === "chicken") {
          soundFx.playChickenCluck();
          animal.soundTimer = 7 + Math.random() * 14;
        } else {
          animal.soundTimer = 12 + Math.random() * 20;
        }
      }

      // AI Decision State Machine
      animal.stateTimer -= dt;
      if (animal.stateTimer <= 0) {
        const rand = Math.random();
        if (rand < 0.45) {
          // Wander/Walk
          animal.state = "walk";
          animal.stateTimer = 2.5 + Math.random() * 4.5;
          animal.targetRotationY = animal.rotationY + (Math.random() - 0.5) * Math.PI * 1.5;
        } else if (rand < 0.75) {
          // Idle stand & look around
          animal.state = "idle";
          animal.stateTimer = 2 + Math.random() * 4;
        } else {
          // Peck ground (duck / chicken pecks for seeds/worms)
          animal.state = "peck";
          animal.stateTimer = 1.5 + Math.random() * 2;
        }
      }

      // React if player is nearby holding food
      if (playerPos) {
        const distToPlayer = animal.position.distanceTo(playerPos);
        if (distToPlayer < 6 && distToPlayer > 1.2) {
          // Gently turn toward player
          const dx = playerPos.x - animal.position.x;
          const dz = playerPos.z - animal.position.z;
          const targetAngle = Math.atan2(dx, dz);
          animal.targetRotationY = targetAngle;
        }
      }

      // Smooth rotation interpolation
      let angleDiff = animal.targetRotationY - animal.rotationY;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      animal.rotationY += angleDiff * Math.min(1, 5 * dt);
      animal.group.rotation.y = animal.rotationY;

      // Movement vector
      const moveVec = new THREE.Vector3(0, 0, 0);
      if (animal.state === "walk" || animal.state === "panic") {
        const speed = animal.state === "panic" ? animal.walkSpeed * 2.2 : animal.walkSpeed;
        moveVec.x = Math.sin(animal.rotationY) * speed;
        moveVec.z = Math.cos(animal.rotationY) * speed;
        animal.walkCycle += speed * dt * 7;
      } else {
        // Slow down walk cycle smoothly
        animal.walkCycle = THREE.MathUtils.lerp(animal.walkCycle, 0, dt * 5);
      }

      // Gravity (ducks and chickens flutter down slowly!)
      const isWinged = animal.type === "duck" || animal.type === "chicken";
      const gravity = isWinged ? -12 : -22;
      animal.velocity.y += gravity * dt;
      if (isWinged && animal.velocity.y < -3.5) {
        animal.velocity.y = -3.5; // Fluttering slow fall!
      }

      // Proposed new positions
      const newPos = animal.position.clone();
      newPos.x += moveVec.x * dt;
      newPos.z += moveVec.z * dt;

      // Obstacle & Terrain collision
      const checkX = Math.floor(newPos.x);
      const checkZ = Math.floor(newPos.z);
      const curY = Math.floor(animal.position.y);

      // Check if walking into a 1-block obstacle (step up!)
      const frontBlock = this.world.getBlock(checkX, curY, checkZ);
      const frontBlockAbove = this.world.getBlock(checkX, curY + 1, checkZ);

      if (BLOCK_DEFINITIONS[frontBlock]?.solid) {
        if (!BLOCK_DEFINITIONS[frontBlockAbove]?.solid && animal.isGrounded) {
          // Auto step up / hop over block
          animal.velocity.y = 4.8;
          animal.isGrounded = false;
        } else {
          // Wall hit: turn away
          animal.targetRotationY += Math.PI * 0.75;
          moveVec.set(0, 0, 0);
        }
      }

      animal.position.x += moveVec.x * dt;
      animal.position.z += moveVec.z * dt;

      // Vertical movement & floor snap
      animal.position.y += animal.velocity.y * dt;
      const groundBlockY = Math.floor(animal.position.y);
      const blockBelow = this.world.getBlock(
        Math.floor(animal.position.x),
        groundBlockY,
        Math.floor(animal.position.z)
      );

      if (BLOCK_DEFINITIONS[blockBelow]?.solid) {
        animal.position.y = groundBlockY + 1.0;
        animal.velocity.y = 0;
        animal.isGrounded = true;
      } else {
        animal.isGrounded = false;
      }

      // Keep from falling into void
      if (animal.position.y < -5) {
        const topY = this.world.getSurfaceHeight(Math.floor(animal.position.x), Math.floor(animal.position.z));
        animal.position.y = topY + 1.0;
        animal.velocity.set(0, 0, 0);
      }

      // Procedural Animations
      // 1. Leg walking cycle
      const legAngle = Math.sin(animal.walkCycle) * 0.55;
      animal.leftLeg.rotation.x = legAngle;
      animal.rightLeg.rotation.x = -legAngle;

      if (animal.leftBackLeg && animal.rightBackLeg) {
        animal.leftBackLeg.rotation.x = -legAngle;
        animal.rightBackLeg.rotation.x = legAngle;
      }

      // 2. Wings (Flapping when in air, or gentle sway while walking)
      if (animal.leftWingOrArm && animal.rightWingOrArm) {
        if (!animal.isGrounded) {
          // Fast fluttering wings in air!
          const flutter = Math.sin(performance.now() * 0.03) * 0.7 + 0.3;
          animal.leftWingOrArm.rotation.z = flutter;
          animal.rightWingOrArm.rotation.z = -flutter;
        } else {
          const sway = Math.sin(animal.walkCycle * 2) * 0.15;
          animal.leftWingOrArm.rotation.z = 0.1 + sway;
          animal.rightWingOrArm.rotation.z = -0.1 - sway;
        }
      }

      // 3. Head motion (pecking vs walking vs idle)
      if (animal.state === "peck") {
        // Fast pecking ground motion
        animal.head.rotation.x = 0.7 + Math.sin(performance.now() * 0.015) * 0.35;
      } else if (animal.state === "walk") {
        // Head bob
        animal.head.rotation.x = Math.sin(animal.walkCycle * 2) * 0.12;
      } else {
        // Gentle breathing idle
        animal.head.rotation.x = Math.sin(performance.now() * 0.003) * 0.05;
      }
    }
  }

  // Handle player interaction: attacking or feeding an animal
  public interactWithAnimalAt(
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3,
    action: "attack" | "feed" | "use",
    heldItem: BlockType
  ): boolean {
    const ray = new THREE.Ray(rayOrigin, rayDirection);
    let nearestAnimal: AnimalEntity | null = null;
    let minDistance = 4.2; // Maximum interaction range

    for (const animal of this.animals) {
      const center = animal.position.clone().add(new THREE.Vector3(0, 0.4, 0));
      const distToRay = ray.distanceToPoint(center);
      const distFromOrigin = rayOrigin.distanceTo(center);

      if (distToRay < 0.75 && distFromOrigin < minDistance) {
        minDistance = distFromOrigin;
        nearestAnimal = animal;
      }
    }

    if (!nearestAnimal) return false;

    // BUGFIX: this used to be `action === "feed" || heldItem === WHEAT || heldItem === GOLDEN_APPLE`.
    // PlayerController always calls this with action="feed" on every right-click near an animal
    // (see placeSelectedBlock step 2), so that OR made the "feed" branch fire for ANY held item —
    // not just food. Right-clicking near a duck/chicken/sheep/cow while holding a block (e.g. Bricks)
    // silently ate the click, blocked normal block placement, and had a 25% chance to spawn a baby
    // animal regardless of what was held. It must require BOTH the feed action AND an actual food item.
    const isFoodItem = heldItem === BlockType.WHEAT || heldItem === BlockType.GOLDEN_APPLE;
    if (action === "feed" && isFoodItem) {
      // Feed animal!
      soundFx.playEat();
      this.spawnParticles(nearestAnimal.position.clone().add(new THREE.Vector3(0, 0.7, 0)), 0xff3366, 8);
      nearestAnimal.velocity.y = 3.2; // Happy little hop!
      nearestAnimal.state = "idle";
      nearestAnimal.stateTimer = 3;

      if (nearestAnimal.type === "duck") soundFx.playDuckQuack();
      else if (nearestAnimal.type === "chicken") soundFx.playChickenCluck();

      // If fed golden apple, high chance of spawning a cute baby!
      if (heldItem === BlockType.GOLDEN_APPLE || Math.random() < 0.25) {
        const babyPos = nearestAnimal.position.clone().add(new THREE.Vector3(0.5, 0, 0.5));
        const baby = this.spawnAnimal(nearestAnimal.type, babyPos, true);
        baby.group.scale.setScalar(0.55); // Cute mini baby!
      }
      return true;
    }

    if (action === "attack") {
      // Attack animal!
      soundFx.playToolSlash();
      soundFx.playAnimalHit();
      nearestAnimal.isHurt = true;
      nearestAnimal.hurtTimer = 0.35;
      nearestAnimal.bodyMesh.material = this.hurtMaterial;

      // Knockback away from player
      const kbDir = nearestAnimal.position.clone().sub(rayOrigin).normalize();
      kbDir.y = 0.6;
      nearestAnimal.velocity.copy(kbDir.multiplyScalar(4.5));
      nearestAnimal.state = "panic";
      nearestAnimal.stateTimer = 4.0;
      nearestAnimal.targetRotationY = Math.atan2(kbDir.x, kbDir.z);

      // Hit particles
      this.spawnParticles(nearestAnimal.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xffffff, 5);

      nearestAnimal.health -= (heldItem === BlockType.DIAMOND_SWORD ? 4 : heldItem === BlockType.DIAMOND_AXE ? 3 : 1);
      if (nearestAnimal.health <= 0) {
        // Animal death puff
        this.spawnParticles(nearestAnimal.position.clone().add(new THREE.Vector3(0, 0.4, 0)), 0xcccccc, 12);
        this.scene.remove(nearestAnimal.group);
        const idx = this.animals.indexOf(nearestAnimal);
        if (idx !== -1) this.animals.splice(idx, 1);
      }
      return true;
    }

    return false;
  }

  public populateInitialFauna() {
    if (this.animals.length >= 6) return;
    // Spawn initial peaceful fauna near origin
    const spawns: { type: AnimalType; x: number; z: number }[] = [
      { type: "duck", x: -3, z: 4 },
      { type: "duck", x: -5, z: 6 },
      { type: "chicken", x: 4, z: -3 },
      { type: "chicken", x: 6, z: -5 },
      { type: "sheep", x: -6, z: -4 },
      { type: "cow", x: 5, z: 5 },
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
      this.spawnAnimal(sp.type, new THREE.Vector3(sp.x, gy, sp.z), false);
    }
  }

  public dispose() {
    for (const animal of this.animals) {
      this.scene.remove(animal.group);
    }
    this.animals = [];
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
    }
    this.particles = [];
  }
}
