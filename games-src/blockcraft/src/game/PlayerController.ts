import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, EnchantType, BombType, Difficulty, DIFFICULTY_SETTINGS, GameMode, SlotEnchantments, RaycastResult } from "../types";
import { SoundEffects, soundFx } from "./SoundEffects";
import { VoxelTextureAtlas } from "./TextureAtlas";
import { VoxelWorld } from "./VoxelWorld";
import { AnimalManager } from "./AnimalManager";
import { MonsterManager } from "./MonsterManager";
import type { VillagerManager } from "./VillagerManager";
import { ParticleManager } from "./ParticleManager";
import { getBlockDrop } from "./Drops";
import { createCharacterModel, CharacterModel } from "./CharacterSkin";
import { getCharacterPreset } from "../types";

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
  public villagerManager: VillagerManager | null = null;
  public onTradeVillager?: (villagerIndex: number, nameKo: string) => void;
  // Bucket swapped: (item used up, item received)
  public onBucketUse?: (from: BlockType, to: BlockType) => void;
  private lavaTimer: number = 0;
  public particleManager: ParticleManager | null = null;

  // Game mode: creative = fly, no hunger; survival = no flying, hunger, death resets
  public gameMode: GameMode = "creative";
  public difficulty: Difficulty = "normal";
  // Survival: items gained from mining / drops, and blocks used up when placed
  public onItemGained?: (type: BlockType, count: number) => void;
  public onBlockConsumed?: (slotIndex: number, type: BlockType) => void;
  // Survival mining progress (0..1) for the HUD crack bar; -1 = not mining
  public onMiningProgress?: (progress: number) => void;
  private miningHeld: boolean = false;
  private miningTarget: string | null = null;
  private miningProgress: number = 0;
  private miningTickTimer: number = 0;
  // Fall damage tracking
  private peakY: number = 0;
  private wasGrounded: boolean = true;
  public onDeath?: () => void;
  // Effect bombs / TNT (handled by EffectsManager via App)
  public onUseBomb?: (kind: BombType, origin: THREE.Vector3, dir: THREE.Vector3) => void;
  public onIgniteTnt?: (x: number, y: number, z: number) => void;

  // Health and Combat System
  public health: number = 20;
  public maxHealth: number = 20;
  public isHurt: boolean = false;
  public onHealthChange?: (health: number, maxHealth: number) => void;
  public onOpenCraftingTable?: () => void;
  public onOpenEnchantingTable?: () => void;
  public onOpenChest?: (x: number, y: number, z: number) => void;
  public onUseBed?: (x: number, y: number, z: number) => void;
  // Respawn point set by sleeping in a bed (null = village spawn)
  public respawnPoint: { x: number; y: number; z: number } | null = null;

  // Enchantments per hotbar slot (set at the Enchanting Table)
  public enchantments: Map<number, SlotEnchantments> = new Map();
  public onEnchantmentsChange?: () => void;
  public onBonusDrop?: (blockType: BlockType) => void;

  public getEnchantLevel(slot: number, id: keyof SlotEnchantments): number {
    return this.enchantments.get(slot)?.[id] ?? 0;
  }

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
  // F5: first-person <-> third-person (camera behind the player, own body visible)
  public viewMode: "first" | "third" = "first";
  public onViewModeChange?: (mode: "first" | "third") => void;
  private ownModel: CharacterModel | null = null;
  private ownWalkTimer: number = 0;
  private scene: THREE.Scene | null = null;
  // Off-hand (left hand): press F to swap the active hotbar item in/out of it.
  public offhandPivot: THREE.Group;
  public offhandBlock: BlockType = BlockType.AIR;
  public onOffhandChange?: (block: BlockType) => void;
  // Day/night: monsters only spawn at night (survival)
  public isNightProvider?: () => boolean;
  private buildingBlock: BlockType = BlockType.AIR;
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
    this.handPivot.scale.setScalar(0.8);
    this.offhandPivot = new THREE.Group();
    this.offhandPivot.position.set(-0.42, -0.32, -0.65);
    this.offhandPivot.rotation.set(0.2, 0.4, -0.1);
    this.offhandPivot.scale.setScalar(0.8);
    this.camera.add(this.offhandPivot);
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
    if (this.miningHeld) this.stopMining();
  }

  public lastSpawnIndex: number = 0;

  public resetToSpawn(spawnIndex: number = 0) {
    this.lastSpawnIndex = spawnIndex;
    this.resetKeys();
    this.velocity.set(0, 0, 0);
    // MULTIPLAYER FIX: every player used to spawn on the exact same block. With
    // player-vs-player collision on, six people stacked in one spot meant every
    // move was blocked by someone else's hitbox ("방향키가 안 먹음"). Each
    // player now gets their own spot on a ring around the spawn point.
    const ringAngle = (spawnIndex % 8) * (Math.PI * 2 / 8);
    const ringRadius = spawnIndex === 0 ? 0 : 2.5 + Math.floor(spawnIndex / 8) * 2.5;
    const ox = this.world.spawnOrigin.x + Math.cos(ringAngle) * ringRadius;
    const oz = this.world.spawnOrigin.z + Math.sin(ringAngle) * ringRadius;
    // Find dry land near that spot rather than assuming it is safe — with
    // rivers/lakes now part of terrain gen, it can land underwater.
    const spawn = this.world.findSafeSpawnXZ(ox, oz);
    const groundY = this.world.getSurfaceHeight(spawn.x, spawn.z);
    this.position.set(spawn.x, groundY + 1.0, spawn.z);
    // Slept in a bed? Wake up next to it instead (if the bed still exists)
    if (this.respawnPoint) {
      const rp = this.respawnPoint;
      if (this.world.getBlock(rp.x, rp.y, rp.z) === BlockType.BED) {
        const gy = this.world.getSurfaceHeight(rp.x + 0.5, rp.z + 1.5);
        this.position.set(rp.x + 0.5, Math.max(gy, rp.y) + 1.0, rp.z + 1.5);
      } else {
        this.respawnPoint = null;
      }
    }
    this.isGrounded = true;
    this.isFlying = false;
    this.camera.position.set(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );
  }

  // Eye position (independent of where the camera actually sits in 3rd person)
  public eyePos(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + this.eyeHeight, this.position.z);
  }

  // Build the player's own body model (shown in third-person view)
  public setOwnCharacter(scene: THREE.Scene, characterId: number, color: string) {
    this.scene = scene;
    if (this.ownModel) {
      scene.remove(this.ownModel.group);
      this.ownModel = null;
    }
    const model = createCharacterModel(getCharacterPreset(characterId), color);
    model.group.visible = this.viewMode === "third";
    scene.add(model.group);
    this.ownModel = model;
  }

  public toggleViewMode() {
    this.viewMode = this.viewMode === "first" ? "third" : "first";
    const third = this.viewMode === "third";
    this.handPivot.visible = !third;
    this.offhandPivot.visible = !third;
    if (this.ownModel) this.ownModel.group.visible = third;
    if (this.onViewModeChange) this.onViewModeChange(this.viewMode);
    soundFx.playSwitchSlot();
  }

  public get selectedBlock(): BlockType {
    return this.hotbarBlocks[this.activeSlot] ?? BlockType.AIR;
  }

  // Swap the active hotbar item with the off-hand (F)
  public swapOffhand() {
    const main = this.hotbarBlocks[this.activeSlot] ?? BlockType.AIR;
    // Curse of Binding: the item refuses to leave the hand it's in
    if (this.getEnchantLevel(this.activeSlot, "binding_curse") > 0 || (this.offhandEnchants.binding_curse ?? 0) > 0) {
      soundFx.playToolBreak();
      return;
    }
    this.hotbarBlocks[this.activeSlot] = this.offhandBlock;
    this.offhandBlock = main;
    // Enchantments/durability travel with the item between the two hands
    const slotEnch = this.enchantments.get(this.activeSlot);
    const slotDur = this.toolDurabilities.get(this.activeSlot);
    if (Object.keys(this.offhandEnchants).length > 0) this.enchantments.set(this.activeSlot, this.offhandEnchants);
    else this.enchantments.delete(this.activeSlot);
    if (this.offhandDurability !== null) this.toolDurabilities.set(this.activeSlot, this.offhandDurability);
    else this.toolDurabilities.delete(this.activeSlot);
    this.offhandEnchants = slotEnch ?? {};
    this.offhandDurability = slotDur ?? null;
    if (this.onEnchantmentsChange) this.onEnchantmentsChange();
    this.updateHandMesh();
    if (this.onSlotChange) this.onSlotChange(this.activeSlot, this.selectedBlock);
    if (this.onOffhandChange) this.onOffhandChange(this.offhandBlock);
    soundFx.playSwitchSlot();
  }

  public offhandEnchants: SlotEnchantments = {};
  public offhandDurability: number | null = null;

  // Enchant level on the shield, whichever hand it's in
  public shieldEnchant(id: EnchantType): number {
    const isShield = (b: BlockType) => BLOCK_DEFINITIONS[b]?.toolStats?.toolType === "shield";
    if (isShield(this.selectedBlock)) return this.getEnchantLevel(this.activeSlot, id);
    if (isShield(this.offhandBlock)) return this.offhandEnchants[id] ?? 0;
    return 0;
  }

  // Options passed to the monster manager for a melee hit
  private meleeOptions() {
    const s = this.activeSlot;
    return {
      bonusDamage: this.getEnchantLevel(s, "sharpness") * 1.5,
      knockbackMult: 1 + this.getEnchantLevel(s, "knockback") * 0.8,
      vsZombie: this.getEnchantLevel(s, "smite") * 2.5,
      vsSlime: this.getEnchantLevel(s, "bane_of_arthropods") * 2.5,
      fireSeconds: this.getEnchantLevel(s, "fire_aspect") * 4,
      looting: this.getEnchantLevel(s, "looting"),
      sweep: this.getEnchantLevel(s, "sweeping"),
      onKill: () => this.mendActiveTool(2),
    };
  }

  // Mending: repair the held item a little
  private mendActiveTool(amount: number) {
    if (this.getEnchantLevel(this.activeSlot, "mending") <= 0) return;
    const meta = BLOCK_DEFINITIONS[this.selectedBlock];
    if (!meta?.toolStats) return;
    const maxDur = meta.toolStats.maxDurability;
    const cur = this.toolDurabilities.get(this.activeSlot) ?? maxDur;
    const next = Math.min(maxDur, cur + amount);
    this.toolDurabilities.set(this.activeSlot, next);
    if (this.onToolDurabilityChange) this.onToolDurabilityChange(this.activeSlot, next, maxDur);
  }

  public get isHoldingShield(): boolean {
    const t = (b: BlockType) => BLOCK_DEFINITIONS[b]?.toolStats?.toolType === "shield";
    return t(this.selectedBlock) || t(this.offhandBlock);
  }

  // Create 1st person held item pivot & mesh
  private createHandMesh() {
    this.handPivot.position.set(0.42, -0.32, -0.65);
    this.handPivot.rotation.set(0.2, -0.4, 0.1);
    this.updateHandMesh();
  }

  public updateHandMesh() {
    // Right hand: active hotbar item. Left hand: off-hand item (F to swap).
    this.buildingBlock = this.selectedBlock;
    this.buildHandMesh();
    const savedPivot = this.handPivot;
    this.handPivot = this.offhandPivot;
    this.buildingBlock = this.offhandBlock;
    this.buildHandMesh();
    this.handPivot = savedPivot;
    // Everything under the hand pivots lives on render layer 1 (drawn in a
    // second pass on top of the world — see App.tsx render loop)
    this.handPivot.traverse((o) => o.layers.set(1));
    this.offhandPivot.traverse((o) => o.layers.set(1));
  }

  private buildHandMesh() {
    // Clean up whatever this pivot held before
    this.handPivot.clear();
    this.handItemMesh = null;
    this.handBlockMesh = null;

    const block = this.buildingBlock;

    // 0. Empty hand: show the arm itself
    if (block === BlockType.AIR) {
      const armMat = new THREE.MeshLambertMaterial({ color: 0xd9a578 });
      const sleeveMat = new THREE.MeshLambertMaterial({ color: 0x2fa3a0 });
      const arm = new THREE.Group();
      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.5), armMat);
      forearm.position.set(0, -0.1, 0.1);
      arm.add(forearm);
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 0.18), sleeveMat);
      sleeve.position.set(0, -0.1, 0.4);
      arm.add(sleeve);
      // Angle the arm so its top and inner side are both visible (not a flat quad)
      arm.rotation.set(0.55, this.handPivot === this.offhandPivot ? 0.35 : -0.35, 0);
      arm.position.set(0, -0.12, 0.05);
      this.handItemMesh = arm;
      this.handPivot.add(arm);
      return;
    }
    const meta = BLOCK_DEFINITIONS[block] || BLOCK_DEFINITIONS[BlockType.GRASS];

    // 1. Tool Models (Axe, Pickaxe, Sword, Shovel)
    if (meta.isTool && meta.toolStats) {
      const toolGroup = new THREE.Group();
      const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a5827 });
      const goldMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
      // Head material follows the tool's material (wood / iron / diamond)
      const headColor = meta.toolStats.material === "diamond" ? 0x2dd4bf : meta.toolStats.material === "iron" ? 0xd4d4d8 : 0xb48448;
      const headMat = new THREE.MeshLambertMaterial({ color: headColor });
      const kind = meta.toolStats.toolType;

      if (kind === "axe") {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.04), woodMat);
        handle.position.set(0, 0.15, 0);
        toolGroup.add(handle);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.18), headMat);
        blade.position.set(0, 0.32, 0.08);
        toolGroup.add(blade);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.08), headMat);
        back.position.set(0, 0.32, -0.06);
        toolGroup.add(back);
      } else if (kind === "pickaxe") {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.52, 0.04), woodMat);
        handle.position.set(0, 0.15, 0);
        toolGroup.add(handle);
        const pick = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.38), headMat);
        pick.position.set(0, 0.38, 0);
        toolGroup.add(pick);
      } else if (kind === "sword") {
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.04), woodMat);
        grip.position.set(0, -0.04, 0);
        toolGroup.add(grip);
        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), goldMat);
        guard.position.set(0, 0.06, 0);
        toolGroup.add(guard);
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.56, 0.09), headMat);
        blade.position.set(0, 0.36, 0);
        toolGroup.add(blade);
      } else if (kind === "shovel") {
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.54, 0.04), woodMat);
        handle.position.set(0, 0.15, 0);
        toolGroup.add(handle);
        const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 0.16), headMat);
        scoop.position.set(0, 0.42, 0);
        toolGroup.add(scoop);
      } else if (kind === "shield") {
        // Kite shield held up in front: wooden face, iron rim, cross boss
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.44, 0.04), new THREE.MeshLambertMaterial({ color: 0xb45309 }));
        face.position.set(0, 0.2, 0);
        toolGroup.add(face);
        const rim = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.48, 0.03), new THREE.MeshLambertMaterial({ color: 0x9ca3af }));
        rim.position.set(0, 0.2, -0.01);
        toolGroup.add(rim);
        const bossV = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.36, 0.05), new THREE.MeshLambertMaterial({ color: 0x7c2d12 }));
        bossV.position.set(0, 0.2, 0.025);
        toolGroup.add(bossV);
        const bossH = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 0.05), new THREE.MeshLambertMaterial({ color: 0x7c2d12 }));
        bossH.position.set(0, 0.26, 0.025);
        toolGroup.add(bossH);
        const center = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), new THREE.MeshLambertMaterial({ color: 0xe5e7eb }));
        center.position.set(0, 0.26, 0.03);
        toolGroup.add(center);
        toolGroup.rotation.set(0.1, 0.9, 0);
        toolGroup.position.set(-0.08, -0.12, 0.05);
        this.handItemMesh = toolGroup;
        this.handPivot.add(toolGroup);
        return;
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

    // 4b. Items without a 3D model (bread, coal, ingots, bombs, ...): hold a
    // flat pixel-art card of the item's icon instead of a generic cube
    if (meta.isPlaceable === false && this.atlas.icons[block]) {
      const card = new THREE.Group();
      const tex = new THREE.TextureLoader().load(this.atlas.icons[block]);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.34),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide })
      );
      plane.rotation.set(0, 0.5, 0.15);
      card.add(plane);
      card.position.set(0, 0.05, 0);
      this.handItemMesh = card;
      this.handPivot.add(card);
      return;
    }

    // 5. Standard Placeable 3D Voxel Cube
    const geo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
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
    // BUGFIX: the atlas materials use vertexColors, and a plain BoxGeometry has
    // no "color" attribute, so the GPU read zeros and the held block drew as a
    // solid black square. Give every vertex a white color.
    const vCount = geo.getAttribute("position").count;
    geo.setAttribute("color", new THREE.Float32BufferAttribute(new Array(vCount * 3).fill(1), 3));

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
      if (this.miningHeld && this.dragMoved > 6) this.stopMining();
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
      // Survival free-look: start mining right away while the button is held;
      // if the mouse starts dragging (look-around) the mining is cancelled.
      if (e.button === 0 && this.gameMode === "survival" && !this.attackInCrosshair()) {
        this.miningHeld = true;
        this.miningTarget = null;
        this.miningProgress = 0;
      }
      return;
    }

    if (e.button === 0) {
      // Left click: attack, or break block (creative: instant / survival: hold to mine)
      if (this.gameMode === "survival") {
        if (!this.attackInCrosshair()) {
          this.miningHeld = true;
          this.miningTarget = null;
          this.miningProgress = 0;
        }
      } else {
        this.breakTargetedBlock();
      }
    } else if (e.button === 2) {
      // Right click: Place block
      this.placeSelectedBlock();
    }
  }

  private onMouseUp(e: MouseEvent) {
    if (e.button === 0 && this.miningHeld) {
      this.stopMining();
    }
    if (!this.freeLook || !this.dragging) return;
    this.dragging = false;
    if (!this.isLocked || this.dragMoved > 6 || e.button !== this.dragButton) return;
    if (e.button === 0) {
      // Survival: attack/mining already handled on mousedown + update()
      if (this.gameMode !== "survival") this.breakTargetedBlock();
    } else if (e.button === 2) this.placeSelectedBlock();
  }

  private stopMining() {
    this.miningHeld = false;
    this.miningTarget = null;
    this.miningProgress = 0;
    if (this.onMiningProgress) this.onMiningProgress(-1);
  }

  // Hit a monster or animal in the crosshair. Returns true if something was hit.
  private attackInCrosshair(): boolean {
    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);
    if (
      this.monsterManager &&
      this.monsterManager.attackMonster(
        this.eyePos(),
        lookDir,
        this.selectedBlock,
        this.meleeOptions()
      )
    ) {
      this.triggerSwing();
      soundFx.playToolSlash();
      return true;
    }
    if (this.animalManager && this.animalManager.interactWithAnimalAt(this.eyePos(), lookDir, "attack", this.selectedBlock)) {
      this.triggerSwing();
      return true;
    }
    return false;
  }

  // Seconds needed to mine a block with the held item (survival)
  private miningTimeFor(block: BlockType): number {
    const meta = BLOCK_DEFINITIONS[block];
    const hardness = meta?.hardness ?? 0.6;
    const ts = BLOCK_DEFINITIONS[this.selectedBlock]?.toolStats;
    let mult = 1;
    if (ts && meta?.preferredTool && ts.toolType === meta.preferredTool) mult = ts.miningSpeedMultiplier;
    else if (ts && (ts.toolType === "pickaxe" || ts.toolType === "axe" || ts.toolType === "shovel")) mult = 1.5;
    // Efficiency: +25% per level
    if (ts) mult *= 1 + this.getEnchantLevel(this.activeSlot, "efficiency") * 0.25;
    // Base: 1.5s per hardness point by hand; stone-type blocks by hand are very slow
    let t = (hardness * 1.5) / mult;
    if (meta?.preferredTool === "pickaxe" && (!ts || ts.toolType !== "pickaxe")) t *= 3;
    return Math.max(0.25, t);
  }

  // Hold-to-mine tick (survival)
  private updateMining(dt: number) {
    if (!this.miningHeld || this.gameMode !== "survival") return;
    if (!this.currentRaycast.hit || !this.currentRaycast.blockPos) {
      if (this.miningTarget) {
        this.miningTarget = null;
        this.miningProgress = 0;
        if (this.onMiningProgress) this.onMiningProgress(-1);
      }
      return;
    }
    const [bx, by, bz] = this.currentRaycast.blockPos;
    const key = `${bx},${by},${bz}`;
    if (key !== this.miningTarget) {
      this.miningTarget = key;
      this.miningProgress = 0;
    }
    const blockType = this.currentRaycast.blockType ?? this.world.getBlock(bx, by, bz);
    if (blockType === BlockType.WATER || blockType === BlockType.AIR) return;
    const needed = this.miningTimeFor(blockType);
    this.miningProgress += dt / needed;
    this.miningTickTimer += dt;
    if (this.miningTickTimer >= 0.22) {
      this.miningTickTimer = 0;
      this.triggerSwing();
      soundFx.playMiningHit();
      if (this.particleManager) this.particleManager.spawnHitCrackParticles(bx, by, bz, blockType, 3);
    }
    if (this.onMiningProgress) this.onMiningProgress(Math.min(1, this.miningProgress));
    if (this.miningProgress >= 1) {
      this.miningTarget = null;
      this.miningProgress = 0;
      this.breakTargetedBlock(true);
      if (this.onMiningProgress) this.onMiningProgress(-1);
    }
  }

  public breakTargetedBlock(skipAttack: boolean = false) {
    this.triggerSwing();

    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);

    // 1. Check if attacking a monster in crosshair
    if (
      !skipAttack &&
      this.monsterManager &&
      this.monsterManager.attackMonster(
        this.eyePos(),
        lookDir,
        this.selectedBlock,
        this.meleeOptions()
      )
    ) {
      soundFx.playToolSlash();
      return;
    }

    // 2. Check if attacking an animal in crosshair
    if (
      !skipAttack &&
      this.animalManager &&
      this.animalManager.interactWithAnimalAt(this.eyePos(), lookDir, "attack", this.selectedBlock)
    ) {
      return;
    }

    // 3. Otherwise, break targeted block
    if (this.currentRaycast.hit && this.currentRaycast.blockPos) {
      const [bx, by, bz] = this.currentRaycast.blockPos;
      const brokenType = this.currentRaycast.blockType ?? this.world.getBlock(bx, by, bz);
      // Water can't be mined
      if (brokenType === BlockType.WATER || brokenType === BlockType.AIR) return;

      // Spawn authentic particle burst
      if (this.particleManager) {
        this.particleManager.spawnBlockBreakParticles(bx, by, bz, brokenType);
      }

      const toolMeta = BLOCK_DEFINITIONS[this.selectedBlock];
      if (toolMeta?.isTool) {
        soundFx.playToolSlash();
      }
      soundFx.playBreak();

      // Tool durability logic
      if (toolMeta?.toolStats) {
        // BUGFIX: `toolStats.durability` doesn't exist on ToolStats (only `maxDurability`),
        // so this read undefined and every durability comparison became NaN.
        const maxDur = toolMeta.toolStats.maxDurability;
        const currentDur = this.toolDurabilities.get(this.activeSlot) ?? maxDur;
        // Unbreaking: level N skips wear with probability N/(N+1)
        const unb = this.getEnchantLevel(this.activeSlot, "unbreaking");
        const skipWear = unb > 0 && Math.random() < unb / (unb + 1);
        const nextDur = skipWear ? currentDur : currentDur - 1;
        // Power: chance of a bonus drop of the broken block
        const pow = this.getEnchantLevel(this.activeSlot, "power");
        if (pow > 0 && Math.random() < pow * 0.2 && this.onBonusDrop) {
          this.onBonusDrop(brokenType);
        }

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

      // Beds come apart as a pair
      if (brokenType === BlockType.BED || brokenType === BlockType.BED_FOOT) {
        const partner = brokenType === BlockType.BED ? BlockType.BED_FOOT : BlockType.BED;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (this.world.getBlock(bx + dx, by, bz + dz) === partner) {
            this.world.setBlock(bx + dx, by, bz + dz, BlockType.AIR);
            if (this.onBlockBreak) this.onBlockBreak(bx + dx, by, bz + dz);
            break;
          }
        }
      }

      // Survival: the block drops an item (ore -> mineral, stone -> cobblestone, ...)
      if (this.gameMode === "survival" && this.onItemGained) {
        const silk = this.getEnchantLevel(this.activeSlot, "silk_touch") > 0;
        let drop = getBlockDrop(brokenType, this.selectedBlock);
        if (silk && drop && BLOCK_DEFINITIONS[brokenType]?.isPlaceable) drop = { type: brokenType, count: 1 };
        if (silk && !drop && (brokenType === BlockType.GLASS || brokenType === BlockType.WINDOW)) drop = { type: brokenType, count: 1 };
        if (drop) {
          // Fortune: ores/minerals get extra drops
          const fortune = this.getEnchantLevel(this.activeSlot, "fortune");
          const isOreDrop = !silk && (brokenType === BlockType.COAL_ORE || brokenType === BlockType.IRON_ORE || brokenType === BlockType.DIAMOND_ORE || brokenType === BlockType.GLOWSTONE);
          if (fortune > 0 && isOreDrop && Math.random() < fortune * 0.3) drop = { ...drop, count: drop.count + 1 + Math.floor(Math.random() * fortune) };
          this.onItemGained(drop.type, drop.count);
          this.mendActiveTool(1);
        }
      }
    }
  }

  private useBucket(lookDir: THREE.Vector3) {
    const held = this.selectedBlock;
    if (held === BlockType.BUCKET) {
      // Walk along the view ray and grab the first fluid block before any solid one
      const origin = this.eyePos();
      for (let d = 0.3; d <= 5; d += 0.2) {
        const p = origin.clone().add(lookDir.clone().multiplyScalar(d));
        const bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
        const t = this.world.getBlock(bx, by, bz);
        if (t === BlockType.WATER || t === BlockType.LAVA) {
          this.world.setBlock(bx, by, bz, BlockType.AIR);
          if (this.onBlockBreak) this.onBlockBreak(bx, by, bz);
          if (this.onBucketUse) this.onBucketUse(BlockType.BUCKET, t === BlockType.WATER ? BlockType.WATER_BUCKET : BlockType.LAVA_BUCKET);
          return;
        }
        if (BLOCK_DEFINITIONS[t]?.solid) return; // hit a wall first
      }
      return;
    }
    // Pour: into the block in front of the face we're looking at
    const fluid = held === BlockType.WATER_BUCKET ? BlockType.WATER : BlockType.LAVA;
    if (!this.currentRaycast.hit || !this.currentRaycast.blockPos || !this.currentRaycast.faceNormal) return;
    const [bx, by, bz] = this.currentRaycast.blockPos;
    const [nx, ny, nz] = this.currentRaycast.faceNormal;
    const px = bx + nx, py = by + ny, pz = bz + nz;
    const existing = this.world.getBlock(px, py, pz);
    if (BLOCK_DEFINITIONS[existing]?.solid) return;
    if (existing === BlockType.WATER || existing === BlockType.LAVA) return;
    this.world.setBlock(px, py, pz, fluid);
    if (this.onBlockPlace) this.onBlockPlace(px, py, pz, fluid);
    if (this.onBucketUse) this.onBucketUse(held, BlockType.BUCKET);
  }

  public placeSelectedBlock() {
    this.triggerSwing();

    const lookDir = new THREE.Vector3();
    this.camera.getWorldDirection(lookDir);

    // 1a-0. Chest / Bed
    if (this.currentRaycast.hit && this.currentRaycast.blockPos) {
      const [tx, ty, tz] = this.currentRaycast.blockPos;
      if (this.currentRaycast.blockType === BlockType.CHEST && this.onOpenChest) {
        this.onOpenChest(tx, ty, tz);
        return;
      }
      if ((this.currentRaycast.blockType === BlockType.BED || this.currentRaycast.blockType === BlockType.BED_FOOT) && this.onUseBed) {
        this.onUseBed(tx, ty, tz);
        return;
      }
    }

    // 1a-1. Villagers: right-click to trade
    if (this.villagerManager && this.onTradeVillager) {
      const v = this.villagerManager.findVillagerAt(this.eyePos(), lookDir);
      if (v) {
        this.onTradeVillager(v.index, v.nameKo);
        return;
      }
    }

    // 1a-2. Buckets: scoop up / pour out water and lava
    if (
      this.selectedBlock === BlockType.BUCKET ||
      this.selectedBlock === BlockType.WATER_BUCKET ||
      this.selectedBlock === BlockType.LAVA_BUCKET
    ) {
      this.useBucket(lookDir);
      return;
    }

    // 1a. Enchanting table
    if (this.currentRaycast.hit && this.currentRaycast.blockType === BlockType.ENCHANTING_TABLE) {
      if (this.onOpenEnchantingTable) {
        this.onOpenEnchantingTable();
        return;
      }
    }

    // 1. Check if right-clicking on Crafting Table block in the world
    if (this.currentRaycast.hit && this.currentRaycast.blockType === BlockType.CRAFTING_TABLE) {
      if (this.onOpenCraftingTable) {
        this.onOpenCraftingTable();
        return;
      }
    }

    // 1b. Right-clicking a placed TNT block lights its fuse
    if (this.currentRaycast.hit && this.currentRaycast.blockType === BlockType.TNT && this.currentRaycast.blockPos) {
      const [tx, ty, tz] = this.currentRaycast.blockPos;
      if (this.onIgniteTnt) {
        this.onIgniteTnt(tx, ty, tz);
        return;
      }
    }

    // 1c. Effect bombs (firework / smoke / heal / thunder): throw where you look
    const heldMeta = BLOCK_DEFINITIONS[this.selectedBlock];
    if (heldMeta?.bombType && heldMeta.bombType !== "tnt") {
      if (this.onUseBomb) {
        this.onUseBomb(heldMeta.bombType, this.eyePos(), lookDir.clone());
        if (this.gameMode === "survival" && this.onConsumeItem) this.onConsumeItem(this.activeSlot);
      }
      return;
    }

    // 2. Check if feeding an animal in crosshair
    if (
      this.animalManager &&
      this.animalManager.interactWithAnimalAt(this.eyePos(), lookDir, "feed", this.selectedBlock)
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
      const pPos = this.eyePos().add(lookDir.clone().multiplyScalar(0.7));
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
      // Torches / flower pots / lanterns can't stand in water (they would
      // just replace the water block); solid blocks displace water as usual.
      const existing = this.world.getBlock(px, py, pz);
      if ((existing === BlockType.WATER || existing === BlockType.LAVA) && BLOCK_DEFINITIONS[type]?.solid === false) {
        return;
      }
      // Beds are two blocks long: head here, foot one block away from the player
      if (type === BlockType.BED) {
        const fdx = -Math.sin(this.yaw), fdz = -Math.cos(this.yaw);
        const dx = Math.abs(fdx) >= Math.abs(fdz) ? Math.sign(fdx) : 0;
        const dz = dx === 0 ? Math.sign(fdz) || 1 : 0;
        const fx = px + dx, fz = pz + dz;
        const footCell = this.world.getBlock(fx, py, fz);
        const footFree = footCell === BlockType.AIR || BLOCK_DEFINITIONS[footCell]?.solid === false;
        const pMinX = this.position.x - this.width / 2, pMaxX = this.position.x + this.width / 2;
        const pMinZ = this.position.z - this.width / 2, pMaxZ = this.position.z + this.width / 2;
        const footHitsPlayer = pMinX < fx + 1 && pMaxX > fx && this.position.y < py + 1 && this.position.y + this.height > py && pMinZ < fz + 1 && pMaxZ > fz;
        if (!footFree || footHitsPlayer) return;
        soundFx.playPlace();
        this.world.setBlock(px, py, pz, BlockType.BED);
        this.world.setBlock(fx, py, fz, BlockType.BED_FOOT);
        if (this.onBlockPlace) {
          this.onBlockPlace(px, py, pz, BlockType.BED);
          this.onBlockPlace(fx, py, fz, BlockType.BED_FOOT);
        }
        if (this.gameMode === "survival" && this.onBlockConsumed) this.onBlockConsumed(this.activeSlot, type);
        return;
      }
      soundFx.playPlace();
      this.world.setBlock(px, py, pz, type);

      if (this.onBlockPlace) {
        this.onBlockPlace(px, py, pz, type);
      }
      if (this.gameMode === "survival" && this.onBlockConsumed) {
        this.onBlockConsumed(this.activeSlot, type);
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
      if (this.hotbarBlocks[slotIndex] !== blockType) {
        // A different item now lives here: enchantments & wear belong to the old one
        this.enchantments.delete(slotIndex);
        this.toolDurabilities.delete(slotIndex);
        if (this.onEnchantmentsChange) this.onEnchantmentsChange();
      }
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
    if (code === "F5") {
      e.preventDefault(); // F5 would reload the page
      this.toggleViewMode();
      return;
    }
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

    // F: swap the active item with the left (off) hand
    if (code === "KeyF") {
      this.swapOffhand();
    }

    // Space: Jump or Flight Ascend
    if (code === "Space") {
      const now = performance.now();
      const timeSinceLastSpace = now - this.lastSpacePressTime;
      this.lastSpacePressTime = now;

      // Double tap Space within 320ms toggles Flight Mode (creative only)
      if (timeSinceLastSpace < 320 && this.gameMode === "creative") {
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

    // MULTIPLAYER FIX: a move is only blocked when it brings us CLOSER to a
    // player we would overlap. If we already overlap someone (spawn pile-up,
    // lag, someone walked into us) moving away is always allowed, so nobody
    // gets stuck in place.
    const curXZ = new THREE.Vector2(this.position.x, this.position.z);
    const candXZ = new THREE.Vector2(candidatePos.x, candidatePos.z);

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

      if (overlap) {
        const oXZ = new THREE.Vector2(other.x, other.z);
        const movingCloser = candXZ.distanceTo(oXZ) < curXZ.distanceTo(oXZ) - 1e-4;
        if (movingCloser) return true;
      }
    }

    return false;
  }

  // Gently push apart from any player we are overlapping with (e.g. after
  // spawning on the same block) so the pile untangles on its own.
  private separateFromPlayers(dt: number) {
    if (!this.getOtherPlayerPositions) return;
    const others = this.getOtherPlayerPositions();
    for (const other of others) {
      const dx = this.position.x - other.x;
      const dz = this.position.z - other.z;
      const dist = Math.hypot(dx, dz);
      const minDist = this.width * 1.05;
      const overlapY = this.position.y < other.y + this.height && this.position.y + this.height > other.y;
      if (dist < minDist && overlapY) {
        let px: number, pz: number;
        if (dist < 1e-3) {
          const a = Math.random() * Math.PI * 2;
          px = Math.cos(a);
          pz = Math.sin(a);
        } else {
          px = dx / dist;
          pz = dz / dist;
        }
        const push = (minDist - dist) * Math.min(1, dt * 6);
        const cand = this.position.clone();
        cand.x += px * push;
        cand.z += pz * push;
        if (!this.isCollidingAt(cand)) {
          this.position.x = cand.x;
          this.position.z = cand.z;
        }
      }
    }
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
    const isSprinting = this.keys["ControlLeft"] || this.keys["ControlRight"];

    let speed = isSprinting ? this.sprintSpeed : this.walkSpeed;
    {
      const under = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 0.1), Math.floor(this.position.z));
      const at = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.1), Math.floor(this.position.z));
      const soul = this.shieldEnchant("soul_speed");
      if (soul > 0 && (under === BlockType.SAND || under === BlockType.GRAVEL)) speed *= 1 + soul * 0.15;
      const strider = this.shieldEnchant("depth_strider");
      if (at === BlockType.WATER) speed *= 0.6 + strider * 0.13;
      const sneak = this.shieldEnchant("swift_sneak");
      if (sneak > 0 && (this.keys["ShiftLeft"] || this.keys["ShiftRight"])) speed *= 1 + sneak * 0.15;
    }
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

    this.separateFromPlayers(dt);

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

    // Perform Raycast from camera center (camera is at the eye here)
    this.currentRaycast = this.world.raycast(this.camera, 6.0);
    this.world.updateSelectionBox(this.currentRaycast);

    // Third person: move the camera back behind the player, stopping early if
    // a block is in the way; animate the visible body model.
    if (this.viewMode === "third") {
      const back = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
      const eye = this.eyePos();
      let dist = 0;
      const maxDist = 4.2;
      for (let d = 0.3; d <= maxDist; d += 0.3) {
        const probe = eye.clone().addScaledVector(back, d);
        const b = this.world.getBlock(probe.x, probe.y, probe.z);
        if (BLOCK_DEFINITIONS[b]?.solid) break;
        dist = d;
      }
      this.camera.position.copy(eye).addScaledVector(back, dist);
    }
    if (this.ownModel) {
      const g = this.ownModel.group;
      g.position.set(this.position.x, this.position.y, this.position.z);
      // Model's face is on +z; the player looks down -z, so turn it around
      g.rotation.y = this.yaw + Math.PI;
      this.ownModel.head.rotation.x = -this.pitch;
      const moving = moveVector.length() > 0.1 && this.isGrounded;
      if (moving) {
        this.ownWalkTimer += dt * 11;
        const swing = Math.sin(this.ownWalkTimer) * 0.55;
        this.ownModel.leftLeg.rotation.x = swing;
        this.ownModel.rightLeg.rotation.x = -swing;
        this.ownModel.leftArm.rotation.x = -swing;
        this.ownModel.rightArm.rotation.x = swing;
      } else {
        for (const o of [this.ownModel.leftLeg, this.ownModel.rightLeg, this.ownModel.leftArm, this.ownModel.rightArm]) {
          o.rotation.x = THREE.MathUtils.lerp(o.rotation.x, 0, 0.2);
        }
      }
    }

    // Survival hold-to-mine
    this.updateMining(dt);

    // Fall damage (survival): track the highest point of the fall and hurt on landing
    if (this.isFlying) {
      this.peakY = this.position.y;
      this.wasGrounded = true;
    } else {
      if (!this.isGrounded) {
        if (this.wasGrounded) this.peakY = this.position.y;
        this.peakY = Math.max(this.peakY, this.position.y);
      } else if (!this.wasGrounded) {
        const fall = this.peakY - this.position.y;
        if (this.gameMode === "survival" && fall > 3.5) {
          let dmg = Math.floor(fall - 3);
          const ff = this.shieldEnchant("feather_falling");
          if (ff > 0) dmg = Math.floor(dmg * Math.max(0, 1 - ff * 0.25));
          if (dmg > 0) this.takeDamage(dmg, undefined, "fall");
        }
        this.peakY = this.position.y;
      }
      this.wasGrounded = this.isGrounded;
    }

    // Animate First-Person hand held item
    this.animateHand(dt, moveVector.length() > 0.1);

    // Hunger exhaustion & Natural health regeneration (survival mode only)
    if (this.gameMode === "creative") {
      if (this.hunger < this.maxHunger) {
        this.hunger = this.maxHunger;
        if (this.onHungerChange) this.onHungerChange(this.hunger, this.maxHunger);
      }
      if (this.health < this.maxHealth) {
        this.regenTimer += dt;
        if (this.regenTimer >= 1.0) {
          this.regenTimer = 0;
          this.heal(1);
        }
      }
    } else if (!this.isFlying) {
      // Walking / running exhaustion
      if (moveVector.length() > 0.1) {
        this.hungerTimer += dt * (isSprinting ? 0.35 : 0.12) * DIFFICULTY_SETTINGS[this.difficulty].hungerRate;
        if (this.hungerTimer >= 10.0) {
          this.hungerTimer = 0;
          this.hunger = Math.max(0, this.hunger - 1);
          if (this.onHungerChange) this.onHungerChange(this.hunger, this.maxHunger);
        }
      }
    }

    // Lava burns: standing in it (feet or head) hurts every half second
    {
      const feet = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.1), Math.floor(this.position.z));
      const headB = this.world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 1.5), Math.floor(this.position.z));
      if (feet === BlockType.LAVA || headB === BlockType.LAVA) {
        this.lavaTimer += dt;
        if (this.lavaTimer >= 0.5) {
          this.lavaTimer = 0;
          this.takeDamage(4, undefined, "lava");
        }
      } else {
        this.lavaTimer = 0;
      }
    }

    // Health regeneration when well-fed (>= 18)
    if (this.gameMode === "survival" && this.hunger >= 18 && this.health < this.maxHealth) {
      this.regenTimer += dt;
      if (this.regenTimer >= 3.0) {
        this.regenTimer = 0;
        this.heal(1);
        this.hunger = Math.max(0, this.hunger - 0.5);
        if (this.onHungerChange) this.onHungerChange(this.hunger, this.maxHunger);
      }
    } else if (this.gameMode === "survival" && this.hunger <= 0) {
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
      const night = this.isNightProvider ? this.isNightProvider() : false;
      this.monsterManager.update(dt, this.position, this.gameMode === "survival" && night);
    }
  }

  // Damage & Health system
  // Reduce durability of the item in hand by 1 (respects Unbreaking); breaks it at 0
  public wearActiveTool() {
    const meta = BLOCK_DEFINITIONS[this.selectedBlock];
    if (!meta?.toolStats) return;
    const unb = this.getEnchantLevel(this.activeSlot, "unbreaking");
    if (unb > 0 && Math.random() < unb / (unb + 1)) return;
    const maxDur = meta.toolStats.maxDurability;
    const cur = this.toolDurabilities.get(this.activeSlot) ?? maxDur;
    const next = cur - 1;
    if (next <= 0) {
      this.toolDurabilities.delete(this.activeSlot);
      if (this.onConsumeItem) this.onConsumeItem(this.activeSlot);
    } else {
      this.toolDurabilities.set(this.activeSlot, next);
      if (this.onToolDurabilityChange) this.onToolDurabilityChange(this.activeSlot, next, maxDur);
    }
  }

  public takeDamage(amount: number, attackerPos?: THREE.Vector3, source: "mob" | "fall" | "lava" | "blast" | "other" = "other") {
    // Creative mode: invulnerable (no damage from mobs, falls, explosions, hunger)
    if (this.gameMode === "creative") return;
    if (attackerPos && source === "other") source = "mob";
    if (source === "mob") amount = Math.max(1, Math.round(amount * DIFFICULTY_SETTINGS[this.difficulty].mobDamage));
    // Shield in hand: block 70% of the damage and ignore knockback
    const holdingShield = this.isHoldingShield;
    if (holdingShield) {
      // Protection enchantments on the shield (our stand-in for armour)
      let block = 0.7 + this.shieldEnchant("protection") * 0.05;
      if (source === "lava") block += this.shieldEnchant("fire_protection") * 0.2;
      if (source === "blast") block += this.shieldEnchant("blast_protection") * 0.2;
      block = Math.min(0.95, block);
      amount = Math.max(1, Math.round(amount * (1 - block)));
      // Thorns: whoever hit us gets hurt back
      const thorns = this.shieldEnchant("thorns");
      if (thorns > 0 && attackerPos && this.monsterManager) {
        this.monsterManager.damageNearest(attackerPos, 1.6, 1 + Math.floor(Math.random() * thorns));
      }
      attackerPos = undefined;
      soundFx.playToolBreak();
      this.wearActiveTool();
    }
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
      // Curse of Vanishing: cursed items are gone for good
      for (let i = 0; i < 9; i++) {
        if (this.getEnchantLevel(i, "vanishing_curse") > 0) {
          this.enchantments.delete(i);
          this.toolDurabilities.delete(i);
          if (this.onConsumeItem) this.onConsumeItem(i);
        }
      }
      if ((this.offhandEnchants.vanishing_curse ?? 0) > 0) {
        this.offhandBlock = BlockType.AIR;
        this.offhandEnchants = {};
        this.offhandDurability = null;
        if (this.onOffhandChange) this.onOffhandChange(this.offhandBlock);
      }
      if (this.onEnchantmentsChange) this.onEnchantmentsChange();
      if (this.onDeath) this.onDeath();
      setTimeout(() => {
        this.resetToSpawn(this.lastSpawnIndex);
        this.health = this.maxHealth;
        this.hunger = this.maxHunger;
        if (this.onHealthChange) {
          this.onHealthChange(this.health, this.maxHealth);
        }
        if (this.onHungerChange) this.onHungerChange(this.hunger, this.maxHunger);
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
    this.offhandPivot.position.set(-0.42 - bobX, -0.32 + bobY, -0.65);
  }

  public dispose() {
    this.detachEventListeners();
    if (this.handBlockMesh) {
      this.handPivot.remove(this.handBlockMesh);
      this.handBlockMesh.geometry.dispose();
      this.handBlockMesh = null;
    }
    this.camera.remove(this.handPivot);
    this.camera.remove(this.offhandPivot);
    if (this.ownModel && this.scene) this.scene.remove(this.ownModel.group);
  }
}
