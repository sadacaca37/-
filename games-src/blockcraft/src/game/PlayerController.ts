import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, RaycastResult } from "../types";
import { SoundEffects, soundFx } from "./SoundEffects";
import { VoxelTextureAtlas } from "./TextureAtlas";
import { VoxelWorld } from "./VoxelWorld";
import { AnimalManager } from "./AnimalManager";
import { MonsterManager } from "./MonsterManager";
import { ParticleManager } from "./ParticleManager";

/** 1~9번 퀵슬롯 기본 구성: 1 잔디 · 2 돌 · 3 나무 · 4 판자 · 5 벽돌 · 6 유리 · 7 곡괭이 · 8 칼 · 9 조합대 */
export const DEFAULT_HOTBAR: BlockType[] = [
  BlockType.GRASS,
  BlockType.STONE,
  BlockType.WOOD,
  BlockType.PLANK,
  BlockType.BRICK,
  BlockType.GLASS,
  BlockType.WOODEN_PICKAXE,
  BlockType.WOODEN_SWORD,
  BlockType.CRAFTING_TABLE,
];

// 한글 자판 상태여도 WASD가 먹도록 (ㅈ=W, ㅁ=A, ㄴ=S, ㅇ=D, ㄷ=E, ㄹ=F)
const HANGUL_KEY: Record<string, string> = { "ㅈ": "KeyW", "ㅉ": "KeyW", "ㅁ": "KeyA", "ㄴ": "KeyS", "ㅇ": "KeyD", "ㄷ": "KeyE", "ㄸ": "KeyE", "ㄹ": "KeyF" };
function keyCodeOf(e: KeyboardEvent): string {
  if (e.code && e.code !== "Unidentified") return e.code;
  const k = e.key || "";
  if (HANGUL_KEY[k]) return HANGUL_KEY[k];
  if (/^[a-z]$/i.test(k)) return "Key" + k.toUpperCase();
  if (/^[1-9]$/.test(k)) return "Digit" + k;
  if (k === " ") return "Space";
  return k;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public world: VoxelWorld;
  public atlas: VoxelTextureAtlas;
  public domElement: HTMLElement;
  public animalManager: AnimalManager | null = null;
  public monsterManager: MonsterManager | null = null;
  public particleManager: ParticleManager | null = null;

  // Health and Combat System
  public health: number = 20;
  public maxHealth: number = 20;
  public isHurt: boolean = false;
  public onHealthChange?: (health: number, maxHealth: number) => void;
  public onOpenCraftingTable?: () => void;

  // Hunger and Food System
  public hunger: number = 20; // 0..20
  public maxHunger: number = 20;
  public hungerTimer: number = 0;
  public regenTimer: number = 0;
  public onHungerChange?: (hunger: number, maxHunger: number) => void;
  public onConsumeItem?: (slotIndex: number) => void;

  // Tool Durability Tracker (activeSlot -> remaining durability)
  public toolDurabilities: Map<number, number> = new Map();
  public onToolDurabilityChange?: (slot: number, current: number, max: number) => void;

  // Player position (feet position)
  public position: THREE.Vector3 = new THREE.Vector3(0, 22, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public yaw: number = 0;
  public pitch: number = 0;
  public isGrounded: boolean = false;

  // Player Dimensions
  public readonly width: number = 0.6;
  public readonly height: number = 1.8;
  public readonly eyeHeight: number = 1.62;

  // Movement parameters
  public walkSpeed: number = 6.0;
  public sprintSpeed: number = 9.0;
  public jumpForce: number = 8.5;
  public gravity: number = -24.0;

  // Creative Flight Mode ("스페이스 누르면 위로 날아감 / F키로 토글")
  public isFlying: boolean = false;
  public flySpeed: number = 10.0;
  private lastSpacePressTime: number = 0;
  public onFlyChange?: (flying: boolean) => void;

  // 마우스 잠금(Pointer Lock)이 막힌 곳(사이트 안 창·미리보기)에서는 드래그로 둘러보기
  public freeLook: boolean = false;
  private dragging: boolean = false;
  private dragMoved: number = 0;
  private dragButton: number = -1;
  private lockTimer: number = 0;
  private boundOnMouseUp: (e: MouseEvent) => void;

  // Input states
  private keys: Record<string, boolean> = {};
  public isLocked: boolean = false;

  // Active Hotbar & Selected Block
  public activeSlot: number = 0; // 0..8
  // 화면 아래 퀵슬롯과 똑같은 목록 (App이 시작할 때 다시 맞춰 줌)
  public hotbarBlocks: BlockType[] = [...DEFAULT_HOTBAR];

  // Callback hooks
  public onBlockBreak?: (x: number, y: number, z: number) => void;
  public onBlockPlace?: (x: number, y: number, z: number, type: BlockType) => void;
  public onSlotChange?: (slot: number, block: BlockType) => void;
  public onLockChange?: (locked: boolean) => void;
  public onToggleInventory?: () => void;

  // Other players' bounding boxes for collision checking
  public getOtherPlayerPositions?: () => THREE.Vector3[];

  // 1st-person held item (hand viewmodel)
  public handPivot: THREE.Group;
  public handItemMesh: THREE.Object3D | null = null;
  public handBlockMesh: THREE.Mesh | null = null; // backward compatibility
  private swingProgress: number = 0;
  private isSwinging: boolean = false;
  private walkBobTimer: number = 0;

  // Current targeted block result
  public currentRaycast: RaycastResult = { hit: false };

  // Listeners stored for cleanup
  private boundOnMouseMove: (e: MouseEvent) => void;
  private boundOnMouseDown: (e: MouseEvent) => void;
  private boundOnKeyDown: (e: KeyboardEvent) => void;
  private boundOnKeyUp: (e: KeyboardEvent) => void;
  private boundOnWheel: (e: WheelEvent) => void;
  private boundOnPointerLockChange: () => void;
  private boundOnContextMenu: (e: MouseEvent) => void;
  private boundOnBlur: () => void;

  constructor(
    camera: THREE.PerspectiveCamera,
    world: VoxelWorld,
    atlas: VoxelTextureAtlas,
    domElement: HTMLElement
  ) {
    this.camera = camera;
    this.world = world;
    this.atlas = atlas;
    this.domElement = domElement;

    // Hand item attached to camera
    this.handPivot = new THREE.Group();
    this.camera.add(this.handPivot);
    this.createHandMesh();

    // Bind event handlers
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);
    this.boundOnKeyUp = this.onKeyUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnPointerLockChange = this.onPointerLockChange.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnContextMenu = (e) => e.preventDefault();
    this.boundOnBlur = () => {
      this.resetKeys();
    };

    this.attachEventListeners();
    this.updateHandMesh();
  }

  public resetKeys() {
    this.keys = {};
  }

  public resetToSpawn() {
    this.resetKeys();
    this.velocity.set(0, 0, 0);
    // Find dry land near the world origin rather than assuming (0.5, 0.5)
    // is safe — with rivers/lakes now part of terrain gen, that spot can
    // land underwater depending on the seed.
    const spawn = this.world.findSafeSpawnXZ(0.5, 0.5);
    const groundY = this.world.getSurfaceHeight(spawn.x, spawn.z);
    this.position.set(spawn.x, groundY + 1.0, spawn.z);
    this.isGrounded = true;
    this.isFlying = false;
    this.camera.position.set(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );
  }

  public get selectedBlock(): BlockType {
    return this.hotbarBlocks[this.activeSlot] || BlockType.GRASS;
  }

  // Create 1st person held item pivot & mesh
  private createHandMesh() {
    this.handPivot.position.set(0.42, -0.32, -0.65);
    this.handPivot.rotation.set(0.2, -0.4, 0.1);
    this.updateHandMesh();
  }

  public updateHandMesh() {
    // Clean up old held item mesh
    if (this.handItemMesh) {
      this.handPivot.remove(this.handItemMesh);
      this.handItemMesh = null;
    }
    if (this.handBlockMesh) {
      this.handPivot.remove(this.handBlockMesh);
      this.handBlockMesh = null;
    }

    const block = this.selectedBlock;
    const meta = BLOCK_DEFINITIONS[block] || BLOCK_DEFINITIONS[BlockType.GRASS];

    // 1. Tool Models (Axe, Pickaxe, Sword, Shovel)
    if (meta.isTool) {
      const toolGroup = new THREE.Group();
      const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a5827 });
      const diamondMat = new THREE.MeshLambertMaterial({ color: 0x2dd4bf });
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });

      if (block === BlockType.DIAMOND_AXE) {
        // Handle
        const handleGeo = new THREE.BoxGeometry(0.04, 0.52, 0.04);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.position.set(0, 0.15, 0);
        toolGroup.add(handle);
        // Diamond Axe Blade
        const bladeGeo = new THREE.BoxGeometry(0.06, 0.22, 0.18);
        const blade = new THREE.Mesh(bladeGeo, diamondMat);
        blade.position.set(0, 0.32, 0.08);
        toolGroup.add(blade);
        // Axe Back Point
        const backGeo = new THREE.BoxGeometry(0.06, 0.1, 0.08);
        const back = new THREE.Mesh(backGeo, diamondMat);
        back.position.set(0, 0.32, -0.06);
        toolGroup.add(back);
      } else if (block === BlockType.DIAMOND_PICKAXE) {
        // Handle
        const handleGeo = new THREE.BoxGeometry(0.04, 0.52, 0.04);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.position.set(0, 0.15, 0);
        toolGroup.add(handle);
        // Curved Pickaxe Head
        const pickGeo = new THREE.BoxGeometry(0.06, 0.09, 0.38);
        const pick = new THREE.Mesh(pickGeo, diamondMat);
        pick.position.set(0, 0.38, 0);
        toolGroup.add(pick);
      } else if (block === BlockType.DIAMOND_SWORD) {
        // Grip
        const gripGeo = new THREE.BoxGeometry(0.04, 0.16, 0.04);
        const grip = new THREE.Mesh(gripGeo, woodMat);
        grip.position.set(0, -0.04, 0);
        toolGroup.add(grip);
        // Crossguard
        const guardGeo = new THREE.BoxGeometry(0.06, 0.04, 0.22);
        const guard = new THREE.Mesh(guardGeo, goldMat);
        guard.position.set(0, 0.06, 0);
        toolGroup.add(guard);
        // Sword Blade
        const bladeGeo = new THREE.BoxGeometry(0.03, 0.56, 0.09);
        const blade = new THREE.Mesh(bladeGeo, diamondMat);
        blade.position.set(0, 0.36, 0);
        toolGroup.add(blade);
      } else if (block === BlockType.DIAMOND_SHOVEL) {
        // Handle
        const handleGeo = new THREE.BoxGeometry(0.04, 0.54, 0.04);
        const handle = new THREE.Mesh(handleGeo, woodMat);
        handle.position.set(0, 0.15, 0);
        toolGroup.add(handle);
        // Shovel Scoop
        const scoopGeo = new THREE.BoxGeometry(0.05, 0.18, 0.16);
        const scoop = new THREE.Mesh(scoopGeo, diamondMat);
        scoop.position.set(0, 0.42, 0);
        toolGroup.add(scoop);
      }

      toolGroup.rotation.set(-0.35, 0.2, -0.15);
      toolGroup.position.set(0, -0.1, 0);
      this.handItemMesh = toolGroup;
      this.handPivot.add(toolGroup);
      return;
    }

    // 2. Spawn Eggs
    if (meta.isEgg) {
      const eggGroup = new THREE.Group();
      const eggMat = new THREE.MeshLambertMaterial({ color: meta.color });
      const eggGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const egg = new THREE.Mesh(eggGeo, eggMat);
      egg.scale.set(1, 1.35, 1);
      eggGroup.add(egg);

      // Spots on egg
      const spotMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const spotGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
      for (let s = 0; s < 4; s++) {
        const spot = new THREE.Mesh(spotGeo, spotMat);
        spot.position.set(
          Math.sin(s * 1.6) * 0.13,
          (s - 1.5) * 0.06,
          Math.cos(s * 1.6) * 0.13
        );
        eggGroup.add(spot);
      }

      this.handItemMesh = eggGroup;
      this.handPivot.add(eggGroup);
      return;
    }

    // 3. Golden Apple
    if (block === BlockType.GOLDEN_APPLE) {
      const appleGroup = new THREE.Group();
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xfbbf24 });
      const appleGeo = new THREE.SphereGeometry(0.14, 8, 8);
      const apple = new THREE.Mesh(appleGeo, goldMat);
      appleGroup.add(apple);

      // Stem
      const stemMat = new THREE.MeshLambertMaterial({ color: 0x78350f });
      const stemGeo = new THREE.BoxGeometry(0.03, 0.08, 0.03);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.set(0, 0.15, 0);
      appleGroup.add(stem);

      // Leaf
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
      const leafGeo = new THREE.BoxGeometry(0.06, 0.02, 0.04);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(0.04, 0.17, 0);
      appleGroup.add(leaf);

      this.handItemMesh = appleGroup;
      this.handPivot.add(appleGroup);
      return;
    }

    // 4. Wheat
    if (block === BlockType.WHEAT) {
      const wheatGroup = new THREE.Group();
      const wheatMat = new THREE.MeshLambertMaterial({ color: 0xeab308 });
      const wheatGeo = new THREE.BoxGeometry(0.04, 0.45, 0.12);
      const wheat = new THREE.Mesh(wheatGeo, wheatMat);
      wheatGroup.add(wheat);
      wheatGroup.rotation.set(-0.2, 0.2, 0);
      this.handItemMesh = wheatGroup;
      this.handPivot.add(wheatGroup);
      return;
    }

    // 5. Standard Placeable 3D Voxel Cube
    const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const mat = meta.transparent
      ? this.atlas.transparentMaterial
      : this.atlas.opaqueMaterial;

    const blockMesh = new THREE.Mesh(geo, mat);
    const uvs: number[] = [];
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const tileId = this.atlas.getTileForFace(block, faceIdx);
      const uv = this.atlas.getUV(tileId);
      uvs.push(
        uv.u0, uv.v1,
        uv.u1, uv.v1,
        uv.u0, uv.v0,
        uv.u1, uv.v0
      );
    }
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));

    this.handBlockMesh = blockMesh;
    this.handItemMesh = blockMesh;
    this.handPivot.add(blockMesh);
  }

  public triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  // Pointer lock request
  public requestLock() {
    // 매번 진짜 마우스 잠금부터 시도 (잠깐 실패했다고 계속 드래그 모드로 남지 않게)
    try {
      const r: any = (this.domElement as any).requestPointerLock();
      if (r && typeof r.catch === "function") r.catch(() => this.enableFreeLook());
    } catch {
      this.enableFreeLook();
    }
    // 잠금이 조용히 거부되는 경우도 있어서 잠깐 뒤 확인
    window.clearTimeout(this.lockTimer);
    this.lockTimer = window.setTimeout(() => {
      if (document.pointerLockElement !== this.domElement) this.enableFreeLook();
    }, 450);
  }

  private enableFreeLook() {
    if (document.pointerLockElement === this.domElement) return;
    this.freeLook = true;
    this.setLocked(true);
  }

  private setLocked(v: boolean) {
    if (this.isLocked === v) return;
    this.isLocked = v;
    if (!v) {
      this.resetKeys();
      this.dragging = false;
    }
    if (this.onLockChange) this.onLockChange(v);
  }

  public exitLock() {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    } else if (this.freeLook) {
      this.setLocked(false);
    }
  }

  private onPointerLockChange() {
    const locked = document.pointerLockElement === this.domElement;
    if (locked) {
      window.clearTimeout(this.lockTimer);
      this.freeLook = false;
    } else if (this.freeLook) {
      return;
    }
    this.isLocked = locked;
    if (!this.isLocked) {
      this.resetKeys();
    }
    if (this.onLockChange) {
      this.onLockChange(this.isLocked);
    }
  }

  private onMouseMove(e: MouseEvent) {
    if (!this.isLocked) return;
    if (this.freeLook) {
      // 잠금 없이: 마우스 버튼을 누른 채 끌면 시점 회전
      if (!this.dragging) return;
      this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY);
    }

    // Filter out mouse delta spikes that occur when pointer lock is first acquired
    const mx = Math.max(-120, Math.min(120, e.movementX));
    const my = Math.max(-120, Math.min(120, e.movementY));

    const sensitivity = 0.0022;
    this.yaw -= mx * sensitivity;
    this.pitch -= my * sensitivity;

    // Clamp pitch between -85 and +85 degrees
    const maxPitch = (Math.PI / 2) * 0.95;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  private onMouseDown(e: MouseEvent) {
    if (!this.isLocked) {
      this.requestLock();
      return;
    }

    if (this.freeLook) {
      // 드래그로 둘러보고, 거의 안 움직이고 떼면 클릭(부수기/놓기)
      this.dragging = true;
      this.dragMoved = 0;
      this.dragButton = e.button;
      return;
    }

    if (e.button === 0) {
      // Left click: Break block
      this.breakTargetedBlock();
    } else if (e.button === 2) {
      // Right click: Place block
      this.placeSelectedBlock();
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (!this.freeLook || !this.dragging) return;
    this.dragging = false;
    if (!this.isLocked || this.dragMoved > 6 || e.button !== this.dragButton) return;
    if (e.button === 0) this.breakTargetedBlock();
    else if (e.button === 2) this.placeSelectedBlock();
  }

  public breakTargetedBlock() {
    this.triggerSwing();

    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);

    // 1. Check if attacking a monster in crosshair
    if (
      this.monsterManager &&
      this.monsterManager.attackMonster(this.camera.position, lookDir, this.selectedBlock)
    ) {
      soundFx.playToolSlash();
      return;
    }

    // 2. Check if attacking an animal in crosshair
    if (
      this.animalManager &&
      this.animalManager.interactWithAnimalAt(this.camera.position, lookDir, "attack", this.selectedBlock)
    ) {
      return;
    }

    // 3. Otherwise, break targeted block
    if (this.currentRaycast.hit && this.currentRaycast.blockPos) {
      const [bx, by, bz] = this.currentRaycast.blockPos;
      const brokenType = this.currentRaycast.blockType ?? this.world.getBlock(bx, by, bz);

      // Spawn authentic particle burst
      if (this.particleManager && brokenType !== BlockType.AIR) {
        this.particleManager.spawnBlockBreakParticles(bx, by, bz, brokenType);
      }

      const toolMeta = BLOCK_DEFINITIONS[this.selectedBlock];
      if (toolMeta?.isTool) {
        soundFx.playToolSlash();
      }
      soundFx.playBreak();

      // Tool durability logic
      if (toolMeta?.toolStats) {
        // BUGFIX: `toolStats.durability` doesn't exist on ToolStats (only `maxDurability`
        // does — see types.ts), so this always read `undefined`, making every durability
        // comparison NaN. That silently broke tool wear (tools never reached 0 and the
        // durability HUD showed NaN).
        const maxDur = toolMeta.toolStats.maxDurability;
        const currentDur = this.toolDurabilities.get(this.activeSlot) ?? maxDur;
        const nextDur = currentDur - 1;

        if (nextDur <= 0) {
          soundFx.playToolBreak();
          this.toolDurabilities.delete(this.activeSlot);
          if (this.onConsumeItem) this.onConsumeItem(this.activeSlot);
        } else {
          this.toolDurabilities.set(this.activeSlot, nextDur);
          if (this.onToolDurabilityChange) {
            this.onToolDurabilityChange(this.activeSlot, nextDur, maxDur);
          }
        }
      }

      this.world.setBlock(bx, by, bz, BlockType.AIR);

      if (this.onBlockBreak) {
        this.onBlockBreak(bx, by, bz);
      }
    }
  }

  public placeSelectedBlock() {
    this.triggerSwing();

    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);

    // 1. Check if right-clicking on Crafting Table block in the world
    if (this.currentRaycast.hit && this.currentRaycast.blockType === BlockType.CRAFTING_TABLE) {
      if (this.onOpenCraftingTable) {
        this.onOpenCraftingTable();
        return;
      }
    }

    // 2. Check if feeding an animal in crosshair
    if (
      this.animalManager &&
      this.animalManager.interactWithAnimalAt(this.camera.position, lookDir, "feed", this.selectedBlock)
    ) {
      return;
    }

    const meta = BLOCK_DEFINITIONS[this.selectedBlock];

    // 3. Check if using a Monster / Animal Spawn Egg
    if (meta?.isEgg && meta.spawnType) {
      if (
        this.currentRaycast.hit &&
        this.currentRaycast.blockPos &&
        this.currentRaycast.faceNormal
      ) {
        const [bx, by, bz] = this.currentRaycast.blockPos;
        const [nx, ny, nz] = this.currentRaycast.faceNormal;
        const spawnPos = new THREE.Vector3(bx + nx + 0.5, by + ny, bz + nz + 0.5);

        if (meta.spawnType === "zombie" || meta.spawnType === "slime") {
          this.monsterManager?.spawnMonster(meta.spawnType, spawnPos);
        } else {
          this.animalManager?.spawnAnimal(meta.spawnType as any, spawnPos, true);
        }
        return;
      }
    }

    // 4. Check if eating Food (Golden Apple, Bread, Rotten Flesh)
    if (
      this.selectedBlock === BlockType.GOLDEN_APPLE ||
      this.selectedBlock === BlockType.BREAD ||
      this.selectedBlock === BlockType.ROTTEN_FLESH
    ) {
      soundFx.playEat();
      const pPos = this.camera.position.clone().add(lookDir.clone().multiplyScalar(0.7));
      const particleColor =
        this.selectedBlock === BlockType.GOLDEN_APPLE
          ? 0xfbbf24
          : this.selectedBlock === BlockType.BREAD
          ? 0xd97706
          : 0x4d7c0f;
      this.animalManager?.spawnParticles(pPos, particleColor, 8);

      if (this.selectedBlock === BlockType.GOLDEN_APPLE) {
        this.heal(8);
        this.hunger = Math.min(20, this.hunger + 6);
      } else if (this.selectedBlock === BlockType.BREAD) {
        this.heal(2);
        this.hunger = Math.min(20, this.hunger + 5);
      } else if (this.selectedBlock === BlockType.ROTTEN_FLESH) {
        this.hunger = Math.min(20, this.hunger + 2);
      }

      if (this.onHungerChange) {
        this.onHungerChange(this.hunger, this.maxHunger);
      }
      if (this.onConsumeItem) {
        this.onConsumeItem(this.activeSlot);
      }
      return;
    }

    // 5. Tools or non-placeable items cannot place blocks
    if (meta?.isTool || meta?.isPlaceable === false) {
      return;
    }

    // 6. Standard block placement
    if (
      this.currentRaycast.hit &&
      this.currentRaycast.blockPos &&
      this.currentRaycast.faceNormal
    ) {
      const [bx, by, bz] = this.currentRaycast.blockPos;
      const [nx, ny, nz] = this.currentRaycast.faceNormal;

      const px = bx + nx;
      const py = by + ny;
      const pz = bz + nz;

      // Check collision with player's own bounding box
      const playerMinX = this.position.x - this.width / 2;
      const playerMaxX = this.position.x + this.width / 2;
      const playerMinY = this.position.y;
      const playerMaxY = this.position.y + this.height;
      const playerMinZ = this.position.z - this.width / 2;
      const playerMaxZ = this.position.z + this.width / 2;

      const blockMinX = px;
      const blockMaxX = px + 1;
      const blockMinY = py;
      const blockMaxY = py + 1;
      const blockMinZ = pz;
      const blockMaxZ = pz + 1;

      const collidesWithSelf =
        playerMinX < blockMaxX &&
        playerMaxX > blockMinX &&
        playerMinY < blockMaxY &&
        playerMaxY > blockMinY &&
        playerMinZ < blockMaxZ &&
        playerMaxZ > blockMinZ;

      if (collidesWithSelf) return;

      // Check collision with other players
      if (this.getOtherPlayerPositions) {
        const others = this.getOtherPlayerPositions();
        for (const otherPos of others) {
          const otherMinX = otherPos.x - this.width / 2;
          const otherMaxX = otherPos.x + this.width / 2;
          const otherMinY = otherPos.y;
          const otherMaxY = otherPos.y + this.height;
          const otherMinZ = otherPos.z - this.width / 2;
          const otherMaxZ = otherPos.z + this.width / 2;

          if (
            otherMinX < blockMaxX &&
            otherMaxX > blockMinX &&
            otherMinY < blockMaxY &&
            otherMaxY > blockMinY &&
            otherMinZ < blockMaxZ &&
            otherMaxZ > blockMinZ
          ) {
            return; // Can't place block inside another player
          }
        }
      }

      const type = this.selectedBlock;
      soundFx.playPlace();
      this.world.setBlock(px, py, pz, type);

      if (this.onBlockPlace) {
        this.onBlockPlace(px, py, pz, type);
      }
    }
  }

  private onWheel(e: WheelEvent) {
    if (!this.isLocked) return;
    const dir = e.deltaY > 0 ? 1 : -1;
    let newSlot = (this.activeSlot + dir) % 9;
    if (newSlot < 0) newSlot += 9;
    this.setActiveSlot(newSlot);
  }

  public setActiveSlot(slot: number) {
    if (slot >= 0 && slot < 9 && slot !== this.activeSlot) {
      this.activeSlot = slot;
      soundFx.playSwitchSlot();
      this.updateHandMesh();
      if (this.onSlotChange) {
        this.onSlotChange(this.activeSlot, this.selectedBlock);
      }
    }
  }

  public setSlotBlock(slotIndex: number, blockType: BlockType) {
    if (slotIndex >= 0 && slotIndex < 9) {
      this.hotbarBlocks[slotIndex] = blockType;
      if (slotIndex === this.activeSlot) {
        this.updateHandMesh();
        if (this.onSlotChange) {
          this.onSlotChange(this.activeSlot, this.selectedBlock);
        }
      }
    }
  }

  public setAnimalManager(manager: AnimalManager) {
    this.animalManager = manager;
  }

  private onKeyDown(e: KeyboardEvent) {
    // If typing in an input field (chat), don't trigger game controls
    const target = e.target as HTMLElement;
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
      return;
    }

    const code = keyCodeOf(e);
    if (!code) return;
    this.keys[code] = true;

    if (code === "Escape" && this.freeLook) {
      this.setLocked(false);
      return;
    }

    // Hotbar slots 1 to 9
    if (code.startsWith("Digit")) {
      const digit = parseInt(code.replace("Digit", ""), 10);
      if (digit >= 1 && digit <= 9) {
        this.setActiveSlot(digit - 1);
      }
    }

    // Toggle Inventory with 'E'
    if (code === "KeyE") {
      if (this.onToggleInventory) {
        this.onToggleInventory();
      }
    }

    // Toggle Creative Flight mode with 'F'
    if (code === "KeyF") {
      this.isFlying = !this.isFlying;
      this.velocity.y = 0;
      if (this.onFlyChange) {
        this.onFlyChange(this.isFlying);
      }
      soundFx.playSwitchSlot();
    }

    // Space: Jump or Flight Ascend
    if (code === "Space") {
      const now = performance.now();
      const timeSinceLastSpace = now - this.lastSpacePressTime;
      this.lastSpacePressTime = now;

      // Double tap Space within 320ms toggles Flight Mode
      if (timeSinceLastSpace < 320) {
        this.isFlying = !this.isFlying;
        this.velocity.y = 0;
        if (this.onFlyChange) {
          this.onFlyChange(this.isFlying);
        }
        soundFx.playSwitchSlot();
      } else {
        if (!this.isFlying) {
          // Standard jump when grounded
          if (this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            soundFx.playJump();
          }
        }
      }
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    const code = keyCodeOf(e);
    if (code) this.keys[code] = false;
  }

  private attachEventListeners() {
    this.domElement.addEventListener("contextmenu", this.boundOnContextMenu);
    this.domElement.addEventListener("mousedown", this.boundOnMouseDown);
    window.addEventListener("mousemove", this.boundOnMouseMove);
    window.addEventListener("mouseup", this.boundOnMouseUp);
    document.addEventListener("pointerlockerror", () => this.enableFreeLook());
    window.addEventListener("keydown", this.boundOnKeyDown);
    window.addEventListener("keyup", this.boundOnKeyUp);
    window.addEventListener("wheel", this.boundOnWheel, { passive: true });
    window.addEventListener("blur", this.boundOnBlur);
    document.addEventListener("pointerlockchange", this.boundOnPointerLockChange);
  }

  public detachEventListeners() {
    this.domElement.removeEventListener("contextmenu", this.boundOnContextMenu);
    this.domElement.removeEventListener("mousedown", this.boundOnMouseDown);
    window.removeEventListener("mousemove", this.boundOnMouseMove);
    window.removeEventListener("mouseup", this.boundOnMouseUp);
    window.removeEventListener("keydown", this.boundOnKeyDown);
    window.removeEventListener("keyup", this.boundOnKeyUp);
    window.removeEventListener("wheel", this.boundOnWheel);
    window.removeEventListener("blur", this.boundOnBlur);
    document.removeEventListener("pointerlockchange", this.boundOnPointerLockChange);
  }

  // Check if an AABB intersects solid blocks in the voxel world
  private isCollidingAt(pos: THREE.Vector3): boolean {
    const minX = Math.floor(pos.x - this.width / 2 + 0.001);
    const maxX = Math.floor(pos.x + this.width / 2 - 0.001);
    const minY = Math.floor(pos.y + 0.001);
    const maxY = Math.floor(pos.y + this.height - 0.001);
    const minZ = Math.floor(pos.z - this.width / 2 + 0.001);
    const maxZ = Math.floor(pos.z + this.width / 2 - 0.001);

    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const bType = this.world.getBlock(x, y, z);
          const meta = BLOCK_DEFINITIONS[bType];
          if (meta?.solid) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Check if position collides with other players (Player-Player Bounding Box Collision)
  private checkPlayerCollision(candidatePos: THREE.Vector3): boolean {
    if (!this.getOtherPlayerPositions) return false;
    const others = this.getOtherPlayerPositions();

    const minX = candidatePos.x - this.width / 2;
    const maxX = candidatePos.x + this.width / 2;
    const minY = candidatePos.y;
    const maxY = candidatePos.y + this.height;
    const minZ = candidatePos.z - this.width / 2;
    const maxZ = candidatePos.z + this.width / 2;

    for (const other of others) {
      const oMinX = other.x - this.width / 2;
      const oMaxX = other.x + this.width / 2;
      const oMinY = other.y;
      const oMaxY = other.y + this.height;
      const oMinZ = other.z - this.width / 2;
      const oMaxZ = other.z + this.width / 2;

      const overlap =
        minX < oMaxX &&
        maxX > oMinX &&
        minY < oMaxY &&
        maxY > oMinY &&
        minZ < oMaxZ &&
        maxZ > oMinZ;

      if (overlap) return true;
    }

    return false;
  }

  // Main physics & update loop
  public update(deltaTime: number) {
    // Limit delta time to avoid large jumps on stutter
    const dt = Math.min(deltaTime, 0.1);

    // Calculate movement direction from WASD / Arrow keys relative to camera yaw
    const forward =
      (this.keys["KeyW"] || this.keys["ArrowUp"] ? 1 : 0) -
      (this.keys["KeyS"] || this.keys["ArrowDown"] ? 1 : 0);
    const strafe =
      (this.keys["KeyD"] || this.keys["ArrowRight"] ? 1 : 0) -
      (this.keys["KeyA"] || this.keys["ArrowLeft"] ? 1 : 0);
    const isSprinting = this.keys["ShiftLeft"] || this.keys["ShiftRight"];

    let speed = isSprinting ? this.sprintSpeed : this.walkSpeed;
    if (this.isFlying) {
      speed = isSprinting ? this.flySpeed * 1.5 : this.flySpeed;
    }

    const moveVector = new THREE.Vector3(0, 0, 0);
    if (forward !== 0 || strafe !== 0) {
      const sinYaw = Math.sin(this.yaw);
      const cosYaw = Math.cos(this.yaw);

      // Forward vector along horizontal plane
      const fX = -sinYaw;
      const fZ = -cosYaw;
      // Right vector along horizontal plane
      const rX = cosYaw;
      const rZ = -sinYaw;

      moveVector.x = fX * forward + rX * strafe;
      moveVector.z = fZ * forward + rZ * strafe;
      moveVector.normalize().multiplyScalar(speed);
    }

    // Movement collision resolution per axis (X, Z, Y)
    // 1. Move X
    if (moveVector.x !== 0) {
      const newPosX = this.position.clone();
      newPosX.x += moveVector.x * dt;
      if (!this.isCollidingAt(newPosX) && !this.checkPlayerCollision(newPosX)) {
        this.position.x = newPosX.x;
      }
    }

    // 2. Move Z
    if (moveVector.z !== 0) {
      const newPosZ = this.position.clone();
      newPosZ.z += moveVector.z * dt;
      if (!this.isCollidingAt(newPosZ) && !this.checkPlayerCollision(newPosZ)) {
        this.position.z = newPosZ.z;
      }
    }

    // 3. Move Y (Vertical)
    if (this.isFlying) {
      // In flight mode: zero gravity, Space to fly UP, Shift/C to fly DOWN
      let flyY = 0;
      if (this.keys["Space"]) flyY += 1;
      if (this.keys["ShiftLeft"] || this.keys["ShiftRight"] || this.keys["KeyC"]) flyY -= 1;
      this.velocity.y = flyY * this.flySpeed;

      if (this.velocity.y !== 0) {
        const newPosY = this.position.clone();
        newPosY.y += this.velocity.y * dt;
        if (!this.isCollidingAt(newPosY)) {
          this.position.y = newPosY.y;
        }
      }
      this.isGrounded = false;
    } else {
      // Apply gravity
      this.velocity.y += this.gravity * dt;
      if (this.velocity.y < -35) this.velocity.y = -35;

      const newPosY = this.position.clone();
      newPosY.y += this.velocity.y * dt;

      if (this.velocity.y <= 0) {
        // Falling / moving down: test ground collision
        if (this.isCollidingAt(newPosY)) {
          // Find highest solid block surface directly beneath player's AABB
          const minX = Math.floor(this.position.x - this.width / 2 + 0.001);
          const maxX = Math.floor(this.position.x + this.width / 2 - 0.001);
          const minZ = Math.floor(this.position.z - this.width / 2 + 0.001);
          const maxZ = Math.floor(this.position.z + this.width / 2 - 0.001);
          const testY = Math.floor(newPosY.y + 0.001);

          let highestTop = testY + 1.0;
          for (let x = minX; x <= maxX; x++) {
            for (let z = minZ; z <= maxZ; z++) {
              const bType = this.world.getBlock(x, testY, z);
              if (BLOCK_DEFINITIONS[bType]?.solid) {
                highestTop = Math.max(highestTop, testY + 1.0);
              }
            }
          }

          this.position.y = highestTop;
          this.velocity.y = 0;
          this.isGrounded = true;
        } else {
          this.position.y = newPosY.y;
          this.isGrounded = false;
        }
      } else if (this.velocity.y > 0) {
        // Moving up: test ceiling collision
        if (this.isCollidingAt(newPosY)) {
          this.velocity.y = 0;
        } else {
          this.position.y = newPosY.y;
          this.isGrounded = false;
        }
      }
    }

    // Keep player from falling into void
    if (this.position.y < -15) {
      this.resetToSpawn();
    }

    // Update Camera position and rotation
    this.camera.position.set(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );

    // Apply Euler rotation: Yaw (Y) and Pitch (X)
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ");
    this.camera.quaternion.setFromEuler(euler);

    // Perform Raycast from camera center
    this.currentRaycast = this.world.raycast(this.camera, 6.0);
    this.world.updateSelectionBox(this.currentRaycast);

    // Animate First-Person hand held item
    this.animateHand(dt, moveVector.length() > 0.1);

    // Hunger exhaustion & Natural health regeneration
    if (!this.isFlying) {
      // Walking / running exhaustion
      if (moveVector.length() > 0.1) {
        this.hungerTimer += dt * (this.keys["ControlLeft"] || this.keys["ShiftLeft"] ? 0.35 : 0.12);
        if (this.hungerTimer >= 10.0) {
          this.hungerTimer = 0;
          this.hunger = Math.max(0, this.hunger - 1);
          if (this.onHungerChange) this.onHungerChange(this.hunger, this.maxHunger);
        }
      }
    }

    // Health regeneration when well-fed (>= 18)
    if (this.hunger >= 18 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= 3.0) {
        this.regenTimer = 0;
        this.heal(1);
        this.hunger = Math.max(0, this.hunger - 0.5);
        if (this.onHungerChange) this.onHungerChange(this.hunger, this.maxHunger);
      }
    } else if (this.hunger <= 0) {
      // Starvation damage when hunger is 0
      this.regenTimer += dt;
      if (this.regenTimer >= 4.0 && this.health > 1) {
        this.regenTimer = 0;
        this.takeDamage(1);
      }
    }

    // Update Particles
    if (this.particleManager) {
      this.particleManager.update(dt);
    }

    // Update Monster AI & Dropped Items
    if (this.monsterManager) {
      this.monsterManager.update(dt, this.position);
    }
  }

  // Damage & Health system
  public takeDamage(amount: number, attackerPos?: THREE.Vector3) {
    this.health = Math.max(0, this.health - amount);
    this.isHurt = true;
    soundFx.playPlayerHurt();
    setTimeout(() => {
      this.isHurt = false;
    }, 300);

    if (attackerPos) {
      const kb = this.position.clone().sub(attackerPos).normalize();
      kb.y = 0.35;
      this.velocity.add(kb.multiplyScalar(5.5));
    }

    if (this.onHealthChange) {
      this.onHealthChange(this.health, this.maxHealth);
    }

    // Respawn if dead
    if (this.health <= 0) {
      setTimeout(() => {
        this.resetToSpawn();
        this.health = this.maxHealth;
        if (this.onHealthChange) {
          this.onHealthChange(this.health, this.maxHealth);
        }
      }, 1000);
    }
  }

  public heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.onHealthChange) {
      this.onHealthChange(this.health, this.maxHealth);
    }
  }

  private animateHand(dt: number, isMoving: boolean) {
    if (!this.handPivot) return;

    // Walking bobbing
    if (isMoving && this.isGrounded) {
      this.walkBobTimer += dt * 10;
    }
    const bobX = Math.cos(this.walkBobTimer * 0.5) * 0.015;
    const bobY = Math.abs(Math.sin(this.walkBobTimer)) * 0.025;

    // Punch swing animation
    let swingRotX = 0;
    let swingRotY = 0;
    let swingPosZ = 0;

    if (this.isSwinging) {
      this.swingProgress += dt * 7;
      if (this.swingProgress >= 1) {
        this.isSwinging = false;
        this.swingProgress = 0;
      } else {
        const t = Math.sin(this.swingProgress * Math.PI);
        swingRotX = t * 0.7;
        swingRotY = -t * 0.5;
        swingPosZ = -t * 0.15;
      }
    }

    this.handPivot.position.set(
      0.42 + bobX,
      -0.32 + bobY,
      -0.65 + swingPosZ
    );
    this.handPivot.rotation.set(
      0.2 + swingRotX,
      -0.4 + swingRotY,
      0.1
    );
  }

  public dispose() {
    this.detachEventListeners();
    if (this.handBlockMesh) {
      this.handPivot.remove(this.handBlockMesh);
      this.handBlockMesh.geometry.dispose();
      this.handBlockMesh = null;
    }
    this.camera.remove(this.handPivot);
  }
}
