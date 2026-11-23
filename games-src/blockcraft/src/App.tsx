import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, ChatMessage, Difficulty, DIFFICULTY_SETTINGS, EnchantType, GameMode, RoomState, SlotEnchantments, UserAccount } from "./types";
import { VoxelTextureAtlas } from "./game/TextureAtlas";
import { VoxelWorld } from "./game/VoxelWorld";
import { PlayerController, DEFAULT_HOTBAR } from "./game/PlayerController";
import { MultiplayerManager } from "./game/MultiplayerManager";
import { AnimalManager } from "./game/AnimalManager";
import { MonsterManager } from "./game/MonsterManager";
import { DayNightCycle } from "./game/DayNightCycle";
import { VillagerManager } from "./game/VillagerManager";
import { EffectsManager } from "./game/EffectsManager";
import { authService } from "./game/AuthService";
import { soundFx } from "./game/SoundEffects";
import { Lobby } from "./components/Lobby";
import { CharacterSelect } from "./components/CharacterSelect";
import { Hotbar } from "./components/Hotbar";
import { InventoryModal } from "./components/InventoryModal";
import { ChatBox } from "./components/ChatBox";
import { GameHUD } from "./components/GameHUD";
import { HealthBar } from "./components/HealthBar";
import { HungerBar } from "./components/HungerBar";
import { EnchantModal } from "./components/EnchantModal";
import { ChestModal, ItemCounts } from "./components/ChestModal";
import { TradeModal } from "./components/TradeModal";
import { VILLAGER_TRADES, TradeOffer } from "./game/Trades";
import { AuthModal } from "./components/AuthModal";

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Engine Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const atlasRef = useRef<VoxelTextureAtlas | null>(null);
  const worldRef = useRef<VoxelWorld | null>(null);
  const playerRef = useRef<PlayerController | null>(null);
  const multiRef = useRef<MultiplayerManager | null>(null);
  const animalManagerRef = useRef<AnimalManager | null>(null);
  const villagersRef = useRef<VillagerManager | null>(null);
  const monsterManagerRef = useRef<MonsterManager | null>(null);
  const effectsRef = useRef<EffectsManager | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Persistence Refs
  const modifiedBlocksRef = useRef<Array<{ x: number; y: number; z: number; type: BlockType }>>([]);
  const currentUserRef = useRef<UserAccount | null>(authService.getCurrentUser());

  // UI State
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selfId, setSelfId] = useState<string>("");
  // Character chosen on the pre-Lobby character-select screen (1 of 4 presets).
  // null = not chosen yet, so we show CharacterSelect instead of the Lobby.
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const selectedCharacterRef = useRef<number | null>(null);
  selectedCharacterRef.current = selectedCharacterId;
  // 지난번에 고른 캐릭터를 기억해 두었다가 미리 골라 둠
  const lastCharacterId = (() => {
    try {
      const raw = localStorage.getItem("blockcraft_character_id");
      const v = raw === null ? NaN : Number(raw);
      return Number.isInteger(v) && v >= 0 && v <= 3 ? v : null;
    } catch {
      return null;
    }
  })();
  // Creative (fly, infinite) or Survival (hunger, no flying, death). In
  // multiplayer the host's choice wins and arrives with game_started.
  const [gameMode, setGameMode] = useState<GameMode>("creative");
  const gameModeRef = useRef<GameMode>("creative");
  gameModeRef.current = gameMode;
  const [playerHunger, setPlayerHunger] = useState<number>(20);
  const [screenFlash, setScreenFlash] = useState<string | null>(null);
  const [isEnchantOpen, setIsEnchantOpen] = useState<boolean>(false);
  // Chests: contents per block position ("x,y,z"), kept for the whole session
  const chestsRef = useRef<Map<string, ItemCounts>>(new Map());
  const [openChestKey, setOpenChestKey] = useState<string | null>(null);
  const [tradeVillager, setTradeVillager] = useState<string | null>(null);
  const [chestVersion, setChestVersion] = useState<number>(0);
  const [offhandBlock, setOffhandBlock] = useState<BlockType>(BlockType.AIR);
  const [isNightUI, setIsNightUI] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  // Survival inventory: BlockType -> count. Creative ignores it (everything is free).
  const [inventory, setInventory] = useState<Record<number, number>>({});
  const inventoryRef = useRef<Record<number, number>>({});
  inventoryRef.current = inventory;
  const [miningProgress, setMiningProgress] = useState<number>(-1);
  const [enchantments, setEnchantments] = useState<Record<number, SlotEnchantments>>({});
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [hotbarBlocks, setHotbarBlocks] = useState<BlockType[]>(() => [...DEFAULT_HOTBAR]);
  const [icons, setIcons] = useState<Record<BlockType, string>>({} as any);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [inventoryTab, setInventoryTab] = useState<"all" | "crafting" | "tools" | "animals" | "blocks" | "items">("all");
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 20, 0]);
  const [fps, setFps] = useState<number>(60);

  // Health & Combat State
  const [playerHealth, setPlayerHealth] = useState<number>(20);
  const [isHurt, setIsHurt] = useState<boolean>(false);

  // Auth & Persistence State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(authService.getCurrentUser());
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [pickupNotice, setPickupNotice] = useState<string | null>(null);
  const [saveStatusText, setSaveStatusText] = useState<string | null>(null);

  currentUserRef.current = currentUser;
  const gameStartedRef = useRef<boolean>(false);
  // 로비 → 게임 화면: 로비가 부드럽게 사라진 뒤 치움
  const [showLobby, setShowLobby] = useState<boolean>(true);
  useEffect(() => {
    if (!gameStarted) {
      setShowLobby(true);
      return;
    }
    const t = setTimeout(() => setShowLobby(false), 460);
    return () => clearTimeout(t);
  }, [gameStarted]);
  gameStartedRef.current = gameStarted;

  // 퀵슬롯 목록을 ref로도 들고 있어서, 저장 함수가 바뀌지 않게 함
  // (예전에는 퀵슬롯이 바뀔 때마다 게임 전체가 새로 만들어져서
  //  좀비알을 골라도 벽돌이 나오고, 갑자기 안 움직이는 문제가 있었음)
  const hotbarRef = useRef<BlockType[]>(hotbarBlocks);
  hotbarRef.current = hotbarBlocks;

  // --- Survival inventory helpers (counts live in inventoryRef; hotbar slots point at types) ---
  const addItem = useCallback((type: BlockType, count: number) => {
    if (type === BlockType.AIR || count <= 0) return;
    const next = { ...inventoryRef.current, [type]: (inventoryRef.current[type] ?? 0) + count };
    inventoryRef.current = next;
    setInventory(next);
    // Put a brand-new item type into the first empty hotbar slot
    setHotbarBlocks((prev) => {
      if (prev.includes(type)) return prev;
      const idx = prev.findIndex((b) => b === BlockType.AIR);
      if (idx < 0) return prev;
      const n = [...prev];
      n[idx] = type;
      playerRef.current?.setSlotBlock(idx, type);
      return n;
    });
  }, []);
  const removeItem = useCallback((type: BlockType, count: number) => {
    const have = inventoryRef.current[type] ?? 0;
    const left = have - count;
    const next = { ...inventoryRef.current };
    if (left <= 0) delete next[type];
    else next[type] = left;
    inventoryRef.current = next;
    setInventory(next);
    if (left <= 0) {
      const p = playerRef.current;
      if (p && p.offhandBlock === type) {
        p.offhandBlock = BlockType.AIR;
        setOffhandBlock(BlockType.AIR);
        p.updateHandMesh();
      }
      setHotbarBlocks((prev) => {
        if (!prev.includes(type)) return prev;
        const n = prev.map((b) => (b === type ? BlockType.AIR : b));
        prev.forEach((b, i) => { if (b === type) playerRef.current?.setSlotBlock(i, BlockType.AIR); });
        return n;
      });
    }
  }, []);
  const SURVIVAL_STARTER: Array<[BlockType, number]> = [[BlockType.BREAD, 3]];
  const resetSurvivalInventory = useCallback(() => {
    const inv: Record<number, number> = {};
    const bar: BlockType[] = new Array(9).fill(BlockType.AIR);
    SURVIVAL_STARTER.forEach(([t, c], i) => { inv[t] = c; bar[i] = t; });
    inventoryRef.current = inv;
    setInventory(inv);
    setHotbarBlocks(bar);
    const p = playerRef.current;
    if (p) {
      p.hotbarBlocks = [...bar];
      p.enchantments.clear();
      p.toolDurabilities.clear();
      p.offhandBlock = BlockType.AIR;
      setOffhandBlock(BlockType.AIR);
      p.setActiveSlot(0);
      p.isFlying = false;
      setIsFlying(false);
    }
  }, []);

  // Manual & Auto-save helper
  const performSave = useCallback(async () => {
    const user = currentUserRef.current;
    const player = playerRef.current;
    if (!user || !player) return;

    const currentPos: [number, number, number] = [
      Math.round(player.position.x * 10) / 10,
      Math.round(player.position.y * 10) / 10,
      Math.round(player.position.z * 10) / 10,
    ];

    await authService.savePlayerData(
      user.username,
      currentPos,
      player.health,
      hotbarRef.current,
      modifiedBlocksRef.current
    );

    setSaveStatusText("저장 완료");
    setTimeout(() => setSaveStatusText(null), 1800);
  }, []);

  // Load user data on login
  const handleUserChanged = useCallback(async (user: UserAccount | null) => {
    setCurrentUser(user);
    currentUserRef.current = user;

    if (user && worldRef.current && playerRef.current) {
      const data = await authService.loadGameData(user.username);
      if (data.success) {
        // Restore blocks
        if (data.blocks && Array.isArray(data.blocks)) {
          for (const b of data.blocks) {
            worldRef.current.setBlock(b.x, b.y, b.z, b.type);
          }
        }

        // Restore player position & health
        if (data.player) {
          if (data.player.position && Array.isArray(data.player.position)) {
            playerRef.current.position.set(
              data.player.position[0],
              data.player.position[1],
              data.player.position[2]
            );
          }
          if (typeof data.player.health === "number") {
            playerRef.current.health = data.player.health;
            setPlayerHealth(data.player.health);
          }
          if (data.player.inventory && Array.isArray(data.player.inventory) && data.player.inventory.length > 0) {
            setHotbarBlocks(data.player.inventory);
            playerRef.current.hotbarBlocks = [...data.player.inventory];
            playerRef.current.setActiveSlot(playerRef.current.activeSlot);
          }
        }

        setPickupNotice(`[SQLite DB] ${user.username} 님의 월드 & 소지품 복원 완료!`);
        setTimeout(() => setPickupNotice(null), 3000);
      }
    }
  }, []);

  // Periodic Auto-Save every 6 seconds when logged in
  useEffect(() => {
    if (!currentUser || !gameStarted) return;
    const interval = setInterval(() => {
      performSave();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentUser, gameStarted, performSave]);

  // Initialize Three.js Game World
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Minecraft Day Sky Color & Atmospheric Fog
    const skyColor = new THREE.Color(0x78a7ff);
    scene.background = skyColor;
    scene.fog = new THREE.Fog(skyColor, 28, 85);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    scene.add(camera);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    // 4. Procedural Texture Atlas
    const atlas = new VoxelTextureAtlas();
    atlasRef.current = atlas;
    setIcons(atlas.icons);

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.72);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.15);
    sunLight.position.set(40, 80, 20);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x78a7ff, 0x5a7d3c, 0.35);
    scene.add(hemiLight);
    // Lights must also illuminate the hand layer (1)
    ambientLight.layers.enable(1);
    sunLight.layers.enable(1);
    hemiLight.layers.enable(1);

    // Day / night cycle (240s per day). Monsters only spawn at night and
    // zombies burn in daylight — see MonsterManager.update(isNight).
    const dayNight = new DayNightCycle(scene, ambientLight, hemiLight, sunLight);
    dayNight.moonLight.layers.enable(1);
    let lastNightUI = false;

    // 6. Voxel World (Chunks & Meshing)
    const world = new VoxelWorld(scene, atlas);
    worldRef.current = world;

    // 7. Multiplayer Manager
    const multi = new MultiplayerManager(scene, world, atlas);
    multiRef.current = multi;

    multi.onRoomUpdate = (updatedRoom) => {
      setRoom({ ...updatedRoom });
    };

    multi.onGameStart = (_seed, hostMode) => {
      if (hostMode) {
        setGameMode(hostMode);
        gameModeRef.current = hostMode;
        player.gameMode = hostMode;
      }
      setGameStarted(true);
      gameStartedRef.current = true;
      world.updateChunksAroundPlayer(world.spawnOrigin.x, world.spawnOrigin.z);
      applyOwnCharacter();
      villagers.populate(world.spawnOrigin.x, world.spawnOrigin.z);
      player.resetToSpawn(multi.getSelfIndex());
      setTimeout(() => {
        player.requestLock();
      }, 120);
    };

    multi.onChatMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // 8. Animal Manager (Ducks, Chickens, Sheep, Cows)
    const animals = new AnimalManager(scene, world);
    animalManagerRef.current = animals;

    // Villagers + iron golem living around the spawn village
    const villagers = new VillagerManager(scene, world);
    villagersRef.current = villagers;

    // 9. Monster Manager (Zombies & Slimes + Loot Drops)
    const monsters = new MonsterManager(scene, world);
    monsterManagerRef.current = monsters;
    villagers.monsterManager = monsters;

    // 9b. Effects (TNT, fireworks, smoke, heal, thunder)
    const effects = new EffectsManager(scene, world);
    effectsRef.current = effects;
    effects.monsterManager = monsters;

    // 10. Player Controller
    const player = new PlayerController(camera, world, atlas, renderer.domElement);
    playerRef.current = player;
    player.gameMode = gameModeRef.current;

    // Falling blocks: keep other players in sync and make anvils dangerous.
    // Every client simulates the fall locally (it is deterministic), and only
    // the host (or a solo player) broadcasts the result, so the room agrees
    // on the final world without six copies of every event.
    world.onPhysicsBlockChange = (x, y, z, type) => {
      const roomNow = multi.currentRoom;
      const isAuthority = !roomNow || roomNow.hostId === multi.selfId;
      if (!isAuthority) return;
      if (type === BlockType.AIR) multi.sendBlockBreak(x, y, z);
      else multi.sendBlockPlace(x, y, z, type);
      modifiedBlocksRef.current.push({ x, y, z, type });
    };
    const crushCheck = (x: number, y: number, z: number, type: BlockType, falling: boolean) => {
      const dmg = BLOCK_DEFINITIONS[type]?.fallDamage ?? 0;
      if (dmg <= 0) return;
      const p = player.position;
      const inColumn = Math.floor(p.x) === x && Math.floor(p.z) === z;
      const headY = p.y + 1.8;
      // The block occupies [y, y+1]; hit if it overlaps the player's body
      if (inColumn && y < headY && y + 1 > p.y) {
        player.takeDamage(dmg, new THREE.Vector3(x + 0.5, y + 2, z + 0.5));
        setPickupNotice("🪨 떨어지는 모루에 맞았어요!");
        setTimeout(() => setPickupNotice(null), 2000);
      }
      if (monsters.monsters.length > 0) {
        for (const mob of [...monsters.monsters]) {
          if (Math.floor(mob.position.x) === x && Math.floor(mob.position.z) === z && y < mob.position.y + 1.6 && y + 1 > mob.position.y) {
            mob.health -= dmg;
            mob.isHurt = true;
            mob.hurtTimer = 0.4;
            if (mob.health <= 0) monsters.killMonster(mob);
          }
        }
      }
      if (!falling) soundFx.playPlace();
    };
    world.onFallingBlockMoved = (x, y, z, type) => crushCheck(x, y, z, type, true);
    world.onFallingBlockLanded = (x, y, z, type, dist) => {
      crushCheck(x, y, z, type, false);
      if (dist >= 2) soundFx.playPlace();
    };

    // Effects <-> player / network wiring
    effects.getPlayerPosition = () => player.position.clone();
    effects.damagePlayer = (amount, from) => player.takeDamage(amount, from, "blast");
    effects.healPlayer = (amount) => player.heal(amount);
    effects.onBlockDestroyed = (x, y, z) => {
      multi.sendBlockBreak(x, y, z);
      modifiedBlocksRef.current.push({ x, y, z, type: BlockType.AIR });
    };
    effects.onBroadcast = (kind, pos, dir) => multi.sendEffect(kind, pos, dir);
    effects.onScreenFlash = (color, duration) => {
      setScreenFlash(color);
      setTimeout(() => setScreenFlash(null), duration);
    };
    effects.onNotice = (text) => {
      setPickupNotice(text);
      setTimeout(() => setPickupNotice(null), 2000);
    };
    multi.onEffect = (kind, pos, dir) => effects.playRemote(kind, pos, dir);
    player.onUseBomb = (kind, origin, dir) => effects.throwBomb(kind, origin, dir);
    player.onIgniteTnt = (x, y, z) => effects.igniteTnt(x, y, z);
    player.onHungerChange = (h) => setPlayerHunger(h);
    player.onConsumeItem = (slotIdx) => {
      // Survival: bombs, food and broken tools use up one item
      if (gameModeRef.current !== "survival") return;
      const type = player.hotbarBlocks[slotIdx];
      if (type === BlockType.AIR) return;
      removeItem(type, 1);
    };
    player.onBlockConsumed = (_slotIdx, type) => removeItem(type, 1);
    player.onItemGained = (type, count) => {
      addItem(type, count);
      const def = BLOCK_DEFINITIONS[type];
      setPickupNotice(`+${count} ${def ? def.nameKo : "아이템"}`);
      setTimeout(() => setPickupNotice(null), 1200);
    };
    player.onMiningProgress = (p) => setMiningProgress(p);
    player.onDeath = () => {
      setPickupNotice("💀 쓰러졌습니다... 스폰 지점에서 다시 시작합니다");
      setTimeout(() => setPickupNotice(null), 3000);
    };
    // 화면 퀵슬롯과 실제 손에 든 블록을 같은 목록으로 (잔디를 골랐는데 몹이 나오던 문제)
    player.hotbarBlocks = [...hotbarRef.current];
    player.setActiveSlot(0);
    player.setAnimalManager(animals);
    player.monsterManager = monsters;
    player.villagerManager = villagers;
    player.onTradeVillager = (_idx, nameKo) => {
      setTradeVillager(nameKo);
      player.exitLock();
    };
    // Bucket filled or emptied: swap the item in hand
    player.onBucketUse = (from, to) => {
      const slot = player.activeSlot;
      if (player.gameMode === "survival") {
        removeItem(from, 1);
        addItem(to, 1);
        // Keep the new bucket in the same hotbar slot
        setHotbarBlocks((prev) => {
          if (prev.includes(to)) return prev;
          const n = [...prev];
          n[slot] = to;
          player.setSlotBlock(slot, to);
          return n;
        });
      } else {
        setHotbarBlocks((prev) => {
          const n = [...prev];
          n[slot] = to;
          return n;
        });
        player.setSlotBlock(slot, to);
      }
      player.updateHandMesh();
    };

    // Hook monster events
    monsters.onPlayerDamaged = (amount, attackerPos) => {
      player.takeDamage(amount, attackerPos);
    };

    monsters.onItemPickup = (itemType, count) => {
      soundFx.playPickup();
      const def = BLOCK_DEFINITIONS[itemType];
      const name = def ? def.nameKo : "아이템";
      setPickupNotice(`[전리품 획득] ${name} x${count}`);
      setTimeout(() => setPickupNotice(null), 2500);

      if (gameModeRef.current === "survival") {
        addItem(itemType, count);
        return;
      }
      // Creative: equip into current active slot
      setHotbarBlocks((prev) => {
        const next = [...prev];
        next[player.activeSlot] = itemType;
        return next;
      });
      player.setSlotBlock(player.activeSlot, itemType);
    };

    // Hook health changes
    player.onHealthChange = (hp) => {
      setPlayerHealth(hp);
      setIsHurt(player.isHurt);
    };

    // Chest: open its storage (village chests come with starter loot)
    player.onOpenChest = (x, y, z) => {
      const key = `${x},${y},${z}`;
      if (!chestsRef.current.has(key)) {
        const loot: ItemCounts = {};
        if (world.structures.get(key) === BlockType.CHEST) {
          // Deterministic loot by position so everyone sees the same
          const h = Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % 4;
          if (h === 0) { loot[BlockType.WOODEN_PICKAXE] = 1; loot[BlockType.TORCH] = 6; loot[BlockType.BREAD] = 2; }
          else if (h === 1) { loot[BlockType.WOOD] = 12; loot[BlockType.PLANK] = 16; loot[BlockType.STICK] = 8; }
          else if (h === 2) { loot[BlockType.COBBLESTONE] = 24; loot[BlockType.COAL] = 5; loot[BlockType.IRON_INGOT] = 2; }
          else { loot[BlockType.WHEAT] = 6; loot[BlockType.BREAD] = 3; loot[BlockType.WOOL_WHITE] = 4; loot[BlockType.GOLDEN_APPLE] = 1; }
        }
        chestsRef.current.set(key, loot);
      }
      setOpenChestKey(key);
      player.exitLock();
    };

    // Bed: sleep through the night (sets your respawn point)
    player.onUseBed = (x, y, z) => {
      if (!dayNight.isNight) {
        setPickupNotice("🛏️ 밤에만 잘 수 있어요 (지금은 낮)");
        setTimeout(() => setPickupNotice(null), 1800);
        player.respawnPoint = { x, y, z };
        return;
      }
      player.respawnPoint = { x, y, z };
      setScreenFlash("rgba(0,0,0,0.95)");
      setTimeout(() => {
        dayNight.time = 60; // morning
        if (player.gameMode === "survival") player.heal(4);
        setScreenFlash(null);
        setPickupNotice("☀️ 푹 잤어요. 아침이 됐고, 여기서 다시 깨어나요.");
        setTimeout(() => setPickupNotice(null), 2500);
      }, 1200);
    };

    // Enchanting table
    player.onOpenEnchantingTable = () => {
      setIsEnchantOpen(true);
      player.exitLock();
    };
    player.onEnchantmentsChange = () => {
      const next: Record<number, SlotEnchantments> = {};
      for (const [k, v] of player.enchantments.entries()) next[k] = { ...v };
      setEnchantments(next);
    };
    player.onBonusDrop = (blockType) => {
      const def = BLOCK_DEFINITIONS[blockType];
      setPickupNotice(`✦ 채굴 강화: ${def ? def.nameKo : "아이템"} 추가 획득!`);
      setTimeout(() => setPickupNotice(null), 1500);
      addItem(blockType, 1);
    };

    // Hook Crafting Table interaction
    player.onOpenCraftingTable = () => {
      setInventoryTab("crafting");
      setIsInventoryOpen(true);
      player.exitLock();
    };

    // Link other players' positions for collision detection
    player.getOtherPlayerPositions = () => {
      return multi.getOtherPlayerPositions();
    };

    // Forward block actions to multiplayer socket & track for SQLite auto-save
    player.onBlockPlace = (x, y, z, type) => {
      multi.sendBlockPlace(x, y, z, type);
      modifiedBlocksRef.current.push({ x, y, z, type });
      if (currentUserRef.current) {
        performSave();
      }
    };
    player.onBlockBreak = (x, y, z) => {
      multi.sendBlockBreak(x, y, z);
      modifiedBlocksRef.current.push({ x, y, z, type: BlockType.AIR });
      if (currentUserRef.current) {
        performSave();
      }
    };
    player.onSlotChange = (slot, _block) => {
      setActiveSlot(slot);
    };
    let freeLookNoticeShown = false;
    player.onLockChange = (locked) => {
      setIsLocked(locked);
      if (locked && player.freeLook && !freeLookNoticeShown) {
        freeLookNoticeShown = true;
        setPickupNotice("🖱️ 마우스를 누른 채 끌면 둘러보기 · 클릭 = 부수기 · 오른쪽 클릭 = 놓기 · Esc = 멈춤");
        setTimeout(() => setPickupNotice(null), 5000);
      }
    };
    player.isNightProvider = () => dayNight.isNight;
    player.onOffhandChange = (b) => {
      setOffhandBlock(b);
      // The swap also changed the active hotbar slot — mirror it into React state
      setHotbarBlocks([...player.hotbarBlocks]);
    };
    player.onFlyChange = (flying) => {
      setIsFlying(flying);
    };
    player.onToggleInventory = () => {
      setIsInventoryOpen((prev) => {
        const next = !prev;
        if (next) {
          player.exitLock();
        }
        return next;
      });
    };

    // Pre-generate initial chunks around spawn
    world.updateChunksAroundPlayer(world.spawnOrigin.x, world.spawnOrigin.z);
    // Spawn initial peaceful fauna
    animals.populateInitialFauna();

    // 11. Animation & Physics Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = (currentTime: number) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // FPS tracking
      frameCount++;
      if (currentTime - lastFpsUpdate >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsUpdate = currentTime;
      }

      // Update animal AI and procedural animations
      animals.update(deltaTime);
      if (gameStartedRef.current) villagers.update(deltaTime);

      if (gameStartedRef.current) {
        // Update Player, Monsters & Physics
        player.update(deltaTime);

        // Sun/moon, sky color and light levels follow the clock
        dayNight.update(deltaTime, player.position);
        if (dayNight.isNight !== lastNightUI) {
          lastNightUI = dayNight.isNight;
          setIsNightUI(lastNightUI);
        }

        // Dynamic chunk generation around player
        world.updateChunksAroundPlayer(player.position.x, player.position.z);

        // Block physics: falling sand/gravel/anvil & water flow. (This tick
        // existed in VoxelWorld but was never called, so gravity blocks just
        // hung in the air.)
        world.updatePhysics(deltaTime);

        // Multiplayer updates & position broadcasting
        multi.sendMovement(
          player.position,
          player.pitch,
          player.yaw,
          player.selectedBlock
        );
        multi.update(deltaTime);
        effects.update(deltaTime);

        // Update React UI states
        setPlayerPos([player.position.x, player.position.y, player.position.z]);
      } else {
        // In lobby: show scenic rotating panorama
        const timeSec = currentTime * 0.0003;
        camera.position.set(24 * Math.sin(timeSec), 22, 24 * Math.cos(timeSec));
        camera.lookAt(0, 10, 0);
      }

      // Render
      // Two-pass render: world first, then the first-person hand on its own
      // layer with a cleared depth buffer, so the held item always draws on
      // top (it used to vanish whenever the player stood next to a block,
      // because the hand sits 0.65 units in front of the camera and was
      // simply inside the neighbouring geometry).
      camera.layers.set(0);
      renderer.render(scene, camera);
      // (A Color background forces a clear on every render() call, which
      // would wipe the world pass — so drop it for the hand pass.)
      const bg = scene.background;
      scene.background = null;
      renderer.autoClear = false;
      renderer.clearDepth();
      camera.layers.set(1);
      renderer.render(scene, camera);
      camera.layers.set(0);
      renderer.autoClear = true;
      scene.background = bg;
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Window Resize Handling
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameIdRef.current);
      animals.dispose();
      villagers.dispose();
      monsters.dispose();
      effects.dispose();
      player.dispose();
      multi.dispose();
      world.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // 게임 월드는 처음 한 번만 만듦 (performSave는 이제 바뀌지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut for Enter -> Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 채팅 칸에서 누른 Enter는 그 칸이 보내기로 처리 (여기서 먼저 닫으면 글이 안 보내짐)
      const tg = e.target as HTMLElement | null;
      if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA")) return;
      if (e.key === "Enter" && !isInventoryOpen && !isAuthOpen && !isEnchantOpen && openChestKey === null) {
        setIsChatOpen((prev) => {
          const next = !prev;
          if (next && playerRef.current) {
            playerRef.current.exitLock();
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInventoryOpen, isAuthOpen, isEnchantOpen, openChestKey]);

  // Handler: Create Room
  const handleCreateRoom = async (nickname: string) => {
    if (!multiRef.current) return { success: false, error: "Multiplayer offline" };
    const res = await multiRef.current.createRoom(nickname, selectedCharacterId ?? 0, gameMode);
    if (res.success && multiRef.current.currentRoom) {
      setSelfId(multiRef.current.selfId);
      setRoom({ ...multiRef.current.currentRoom });
    }
    return res;
  };

  // Handler: Join Room
  const handleJoinRoom = async (code: string, nickname: string) => {
    if (!multiRef.current) return { success: false, error: "Multiplayer offline" };
    const res = await multiRef.current.joinRoom(code, nickname, selectedCharacterId ?? 0);
    if (res.success && multiRef.current.currentRoom) {
      setSelfId(multiRef.current.selfId);
      setRoom({ ...multiRef.current.currentRoom });
      const roomMode = multiRef.current.currentRoom.gameMode;
      if (roomMode) {
        setGameMode(roomMode);
        gameModeRef.current = roomMode;
        if (playerRef.current) playerRef.current.gameMode = roomMode;
      }
    }
    return res;
  };

  // Handler: Start Game (Host)
  // Own body model for third-person view (F5): same skin as others see
  const applyOwnCharacter = () => {
    const player = playerRef.current;
    const scene = sceneRef.current;
    if (!player || !scene) return;
    const me = multiRef.current?.currentRoom?.players.find((p) => p.id === multiRef.current?.selfId);
    const charId = me?.characterId ?? selectedCharacterRef.current ?? 0;
    player.setOwnCharacter(scene, charId, me?.color ?? "#3b82f6");
  };

  const handleStartGame = () => {
    if (multiRef.current) {
      multiRef.current.startGame();
    }
    setGameStarted(true);
    gameStartedRef.current = true;
    worldRef.current?.updateChunksAroundPlayer(worldRef.current?.spawnOrigin.x ?? 0, worldRef.current?.spawnOrigin.z ?? 0);
    animalManagerRef.current?.populateInitialFauna();
    villagersRef.current?.populate(worldRef.current?.spawnOrigin.x ?? 0, worldRef.current?.spawnOrigin.z ?? 0);
    if (playerRef.current) playerRef.current.gameMode = gameMode;
    if (gameMode === "survival") resetSurvivalInventory();
    applyOwnCharacter();
    playerRef.current?.resetToSpawn(multiRef.current?.getSelfIndex() ?? 0);
    setTimeout(() => {
      playerRef.current?.requestLock();
    }, 120);
  };

  // Handler: Singleplayer Play Direct
  const applyDifficulty = (d: Difficulty) => {
    setDifficulty(d);
    const cfg = DIFFICULTY_SETTINGS[d];
    if (playerRef.current) playerRef.current.difficulty = d;
    if (monsterManagerRef.current) {
      monsterManagerRef.current.maxMonsters = cfg.maxMonsters;
      monsterManagerRef.current.spawnInterval = cfg.spawnInterval;
    }
  };

  const handleSingleplayer = (_nickname: string, modeOverride?: GameMode) => {
    const mode = modeOverride ?? gameMode;
    setGameStarted(true);
    gameStartedRef.current = true;
    worldRef.current?.updateChunksAroundPlayer(worldRef.current?.spawnOrigin.x ?? 0, worldRef.current?.spawnOrigin.z ?? 0);
    animalManagerRef.current?.populateInitialFauna();
    villagersRef.current?.populate(worldRef.current?.spawnOrigin.x ?? 0, worldRef.current?.spawnOrigin.z ?? 0);
    if (playerRef.current) playerRef.current.gameMode = mode;
    if (mode === "survival") resetSurvivalInventory();
    applyOwnCharacter();
    playerRef.current?.resetToSpawn(0);
    setTimeout(() => {
      playerRef.current?.requestLock();
    }, 120);
  };

  // Handler: Survival crafting — consume ingredients, add the result
  const handleSurvivalCraft = (blockType: BlockType, count: number, consumed: Record<number, number>) => {
    for (const k of Object.keys(consumed)) removeItem(Number(k) as BlockType, consumed[Number(k)]);
    addItem(blockType, count);
    setPickupNotice(`🔨 ${BLOCK_DEFINITIONS[blockType]?.nameKo ?? "아이템"} x${count} 제작!`);
    setTimeout(() => setPickupNotice(null), 1500);
  };

  // Handler: Apply enchantment (survival pays diamonds from the hotbar)
  const handleEnchant = (slotIdx: number, id: EnchantType, level: number) => {
    const player = playerRef.current;
    if (!player) return;
    if (gameMode === "survival") {
      if ((inventoryRef.current[BlockType.DIAMOND] ?? 0) < level) return;
      removeItem(BlockType.DIAMOND, level);
    }
    const cur = { ...(player.enchantments.get(slotIdx) ?? {}) };
    cur[id] = level;
    player.enchantments.set(slotIdx, cur);
    player.onEnchantmentsChange?.();
    soundFx.playCraft();
    setPickupNotice("✦ 마법 부여 완료!");
    setTimeout(() => setPickupNotice(null), 1500);
  };

  // Handler: Quick play — skip the lobby and start solo right away
  const handleQuickPlay = (characterId: number, mode: GameMode, diff: Difficulty) => {
    setSelectedCharacterId(characterId);
    selectedCharacterRef.current = characterId;
    setGameMode(mode);
    gameModeRef.current = mode;
    applyDifficulty(diff);
    if (playerRef.current) playerRef.current.gameMode = mode;
    handleSingleplayer("", mode);
  };

  // Handler: Toggle Flight
  const handleToggleFly = () => {
    if (gameMode === "survival") {
      setPickupNotice("⚔️ 서바이벌 모드에서는 날 수 없어요");
      setTimeout(() => setPickupNotice(null), 1500);
      return;
    }
    if (playerRef.current) {
      playerRef.current.isFlying = !playerRef.current.isFlying;
      playerRef.current.velocity.y = 0;
      setIsFlying(playerRef.current.isFlying);
    }
  };

  // Handler: Hotbar slot change
  const handleSelectSlot = (slotIdx: number) => {
    setActiveSlot(slotIdx);
    playerRef.current?.setActiveSlot(slotIdx);
  };

  // Handler: Assign block from inventory
  const handleAssignToSlot = (slotIdx: number, blockType: BlockType) => {
    if (gameMode === "survival" && blockType !== BlockType.AIR && (inventoryRef.current[blockType] ?? 0) <= 0) return;
    setHotbarBlocks((prev) => {
      const next = [...prev];
      next[slotIdx] = blockType;
      return next;
    });
    playerRef.current?.setSlotBlock(slotIdx, blockType);
  };

  // Handler: Send Chat
  const handleSendMessage = (text: string) => {
    if (multiRef.current) {
      multiRef.current.sendChatMessage(text);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={canvasContainerRef}
        id="game-canvas-container"
        className="w-full h-full cursor-crosshair"
      />

      {/* Character Select (1-of-4 preset look), shown once before the Lobby */}
      {!gameStarted && selectedCharacterId === null && (
        <CharacterSelect
          initialSelected={lastCharacterId}
          onSelect={(id, mode, diff) => {
            try {
              localStorage.setItem("blockcraft_character_id", String(id));
            } catch {}
            setSelectedCharacterId(id);
            setGameMode(mode);
            gameModeRef.current = mode;
            applyDifficulty(diff);
            if (playerRef.current) playerRef.current.gameMode = mode;
          }}
          initialMode={gameMode}
          onQuickPlay={handleQuickPlay}
        />
      )}

      {/* Lobby Overlay Screen (before game start, after a character is chosen) */}
      {showLobby && selectedCharacterId !== null && (
        <div
          style={{ opacity: gameStarted ? 0 : 1, transition: "opacity 450ms ease", pointerEvents: gameStarted ? "none" : "auto" }}
        >
        <Lobby
          room={room}
          selfId={selfId}
          onStartGame={handleStartGame}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSingleplayer={handleSingleplayer}
        />
        {!gameStarted && !room && (
          <button
            type="button"
            onClick={() => setSelectedCharacterId(null)}
            className="fixed left-4 top-4 z-50 rounded-lg border border-amber-500/40 bg-stone-900/80 px-3 py-1.5 text-xs font-bold text-amber-300 backdrop-blur-md hover:bg-stone-800"
          >
            캐릭터 변경
          </button>
        )}
        </div>
      )}

      {/* In-Game HUD (Crosshair, Stats, Hotbar, Chat) */}
      {gameStarted && (
        <>
          <GameHUD
            room={room}
            selfId={selfId}
            playerPos={playerPos}
            fps={fps}
            isLocked={isLocked}
            onRequestLock={() => playerRef.current?.requestLock()}
            isFlying={isFlying}
            onToggleFly={handleToggleFly}
            currentUser={currentUser}
            onOpenAuthModal={() => {
              setIsAuthOpen(true);
              playerRef.current?.exitLock();
            }}
            onOpenCrafting={() => {
              setInventoryTab("crafting");
              setIsInventoryOpen(true);
              playerRef.current?.exitLock();
            }}
          />

          {/* Explosion / thunder screen flash */}
          {screenFlash && (
            <div className="pointer-events-none fixed inset-0 z-50" style={{ background: screenFlash }} />
          )}

          {/* Survival mining progress (hold left mouse) */}
          {miningProgress >= 0 && (
            <div className="pointer-events-none fixed left-1/2 top-1/2 z-30 mt-6 w-24 -translate-x-1/2 overflow-hidden rounded-full border border-black/50 bg-black/50">
              <div className="h-1.5 bg-amber-400" style={{ width: `${Math.round(miningProgress * 100)}%` }} />
            </div>
          )}

          {/* Game mode badge */}
          <div
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-30 rounded-full border px-3 py-0.5 text-[11px] font-bold backdrop-blur-md ${
              gameMode === "survival"
                ? "border-red-500/50 bg-red-950/70 text-red-300"
                : "border-sky-500/50 bg-sky-950/70 text-sky-300"
            }`}
          >
            {gameMode === "survival" ? `⚔️ 서바이벌 · ${DIFFICULTY_SETTINGS[difficulty].nameKo}` : "🪽 크리에이티브"}
            {" · "}{isNightUI ? "🌙 밤" : "☀️ 낮"}
          </div>

          {/* Item Pickup / Toast Notification */}
          {pickupNotice && (
            <div
              id="item-pickup-toast"
              className="fixed top-20 right-6 z-40 bg-stone-900/90 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200"
            >
              {pickupNotice}
            </div>
          )}

          {/* SQLite Auto-Save Notification */}
          {saveStatusText && (
            <div
              id="sqlite-save-badge"
              className="fixed top-20 left-6 z-40 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-md"
            >
              {saveStatusText}
            </div>
          )}

          {/* Bottom HUD: Health Bar & Hotbar */}
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto">
            <div className="flex items-end gap-6">
              <HealthBar health={playerHealth} maxHealth={20} isHurt={isHurt} />
              {gameMode === "survival" && <HungerBar hunger={Math.round(playerHunger)} maxHunger={20} />}
            </div>
            <Hotbar
              activeSlot={activeSlot}
              hotbarBlocks={hotbarBlocks}
              icons={icons}
              onSelectSlot={handleSelectSlot}
              counts={gameMode === "survival" ? inventory : undefined}
              offhandBlock={offhandBlock}
              enchantedSlots={new Set(Object.keys(enchantments).filter((k) => Object.keys(enchantments[Number(k)] ?? {}).length > 0).map(Number))}
            />
          </div>

          <ChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isChatOpen={isChatOpen}
            setIsChatOpen={(open) => {
              setIsChatOpen(open);
              if (!open && !isInventoryOpen && !isAuthOpen) {
                playerRef.current?.requestLock();
              }
            }}
          />

          <InventoryModal
            isOpen={isInventoryOpen}
            onClose={() => {
              setIsInventoryOpen(false);
              playerRef.current?.requestLock();
            }}
            activeSlot={activeSlot}
            hotbarBlocks={hotbarBlocks}
            icons={icons}
            onAssignToSlot={handleAssignToSlot}
            initialTab={inventoryTab}
            survivalInventory={gameMode === "survival" ? inventory : undefined}
            onCraft={gameMode === "survival" ? handleSurvivalCraft : undefined}
          />

          <TradeModal
            isOpen={tradeVillager !== null}
            villagerName={tradeVillager ?? ""}
            offers={(tradeVillager && VILLAGER_TRADES[tradeVillager]) || []}
            playerItems={gameMode === "survival" ? inventory : {}}
            unlimited={gameMode !== "survival"}
            icons={icons}
            onClose={() => {
              setTradeVillager(null);
              playerRef.current?.requestLock();
            }}
            onTrade={(offer: TradeOffer) => {
              if (gameMode === "survival") {
                if (!offer.give.every((g) => (inventoryRef.current[g.type] ?? 0) >= g.count)) return;
                offer.give.forEach((g) => removeItem(g.type, g.count));
                addItem(offer.get.type, offer.get.count);
              } else {
                const p = playerRef.current;
                if (p) {
                  const idx = p.hotbarBlocks.findIndex((b) => b === BlockType.AIR);
                  const slot = idx >= 0 ? idx : p.activeSlot;
                  setHotbarBlocks((prev) => {
                    const n = [...prev];
                    n[slot] = offer.get.type;
                    return n;
                  });
                  p.setSlotBlock(slot, offer.get.type);
                }
              }
              const def = BLOCK_DEFINITIONS[offer.get.type];
              setPickupNotice(`🤝 거래 완료: ${def?.nameKo ?? "아이템"} x${offer.get.count}`);
              setTimeout(() => setPickupNotice(null), 1500);
            }}
          />

          <ChestModal
            key={`chest-${chestVersion}`}
            isOpen={openChestKey !== null}
            onClose={() => {
              setOpenChestKey(null);
              playerRef.current?.requestLock();
            }}
            chestItems={(openChestKey && chestsRef.current.get(openChestKey)) || {}}
            playerItems={
              gameMode === "survival"
                ? inventory
                : Object.fromEntries(hotbarBlocks.filter((b) => b !== BlockType.AIR).map((b) => [b, 1]))
            }
            unlimited={gameMode !== "survival"}
            icons={icons}
            onStore={(type, count) => {
              if (!openChestKey) return;
              const chest = chestsRef.current.get(openChestKey) ?? {};
              if (gameMode === "survival") {
                const have = inventoryRef.current[type] ?? 0;
                const n = Math.min(count, have);
                if (n <= 0) return;
                removeItem(type, n);
                chest[type] = (chest[type] ?? 0) + n;
              } else {
                chest[type] = (chest[type] ?? 0) + count;
              }
              chestsRef.current.set(openChestKey, chest);
              setChestVersion((v) => v + 1);
              soundFx.playSwitchSlot();
            }}
            onTake={(type, count) => {
              if (!openChestKey) return;
              const chest = chestsRef.current.get(openChestKey) ?? {};
              const n = Math.min(count, chest[type] ?? 0);
              if (n <= 0) return;
              chest[type] -= n;
              if (chest[type] <= 0) delete chest[type];
              chestsRef.current.set(openChestKey, chest);
              setChestVersion((v) => v + 1);
              if (gameMode === "survival") {
                addItem(type, n);
              } else {
                setHotbarBlocks((prev) => {
                  if (prev.includes(type)) return prev;
                  const idx = prev.findIndex((b) => b === BlockType.AIR);
                  const next = [...prev];
                  const slot = idx >= 0 ? idx : activeSlot;
                  next[slot] = type;
                  playerRef.current?.setSlotBlock(slot, type);
                  return next;
                });
              }
              soundFx.playPickup();
            }}
          />

          <EnchantModal
            isOpen={isEnchantOpen}
            onClose={() => {
              setIsEnchantOpen(false);
              playerRef.current?.requestLock();
            }}
            hotbarBlocks={hotbarBlocks}
            icons={icons}
            enchantments={enchantments}
            gameMode={gameMode}
            diamondCount={inventory[BlockType.DIAMOND] ?? 0}
            onEnchant={handleEnchant}
          />

          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => {
              setIsAuthOpen(false);
              playerRef.current?.requestLock();
            }}
            currentUser={currentUser}
            onUserChanged={handleUserChanged}
            onAutoSaveRequested={performSave}
          />
        </>
      )}
    </div>
  );
}
