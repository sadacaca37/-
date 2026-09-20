import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { BlockType, BLOCK_DEFINITIONS, ChatMessage, RoomState, UserAccount } from "./types";
import { VoxelTextureAtlas } from "./game/TextureAtlas";
import { VoxelWorld } from "./game/VoxelWorld";
import { PlayerController } from "./game/PlayerController";
import { MultiplayerManager } from "./game/MultiplayerManager";
import { AnimalManager } from "./game/AnimalManager";
import { MonsterManager } from "./game/MonsterManager";
import { authService } from "./game/AuthService";
import { soundFx } from "./game/SoundEffects";
import { Lobby } from "./components/Lobby";
import { Hotbar } from "./components/Hotbar";
import { InventoryModal } from "./components/InventoryModal";
import { ChatBox } from "./components/ChatBox";
import { GameHUD } from "./components/GameHUD";
import { HealthBar } from "./components/HealthBar";
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
  const monsterManagerRef = useRef<MonsterManager | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Persistence Refs
  const modifiedBlocksRef = useRef<Array<{ x: number; y: number; z: number; type: BlockType }>>([]);
  const currentUserRef = useRef<UserAccount | null>(authService.getCurrentUser());

  // UI State
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selfId, setSelfId] = useState<string>("");
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [hotbarBlocks, setHotbarBlocks] = useState<BlockType[]>([
    BlockType.WOODEN_SWORD,
    BlockType.WOODEN_PICKAXE,
    BlockType.WOODEN_AXE,
    BlockType.CRAFTING_TABLE,
    BlockType.ZOMBIE_SPAWN_EGG,
    BlockType.SLIME_SPAWN_EGG,
    BlockType.DUCK_SPAWN_EGG,
    BlockType.BREAD,
    BlockType.GOLDEN_APPLE,
  ]);
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
  gameStartedRef.current = gameStarted;

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
      hotbarBlocks,
      modifiedBlocksRef.current
    );

    setSaveStatusText("저장 완료");
    setTimeout(() => setSaveStatusText(null), 1800);
  }, [hotbarBlocks]);

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

        setPickupNotice(`💾 ${user.username} 님의 월드 & 소지품 복원 완료!`);
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

    // 6. Voxel World (Chunks & Meshing)
    const world = new VoxelWorld(scene, atlas);
    worldRef.current = world;

    // 7. Multiplayer Manager
    const multi = new MultiplayerManager(scene, world, atlas);
    multiRef.current = multi;

    multi.onRoomUpdate = (updatedRoom) => {
      setRoom({ ...updatedRoom });
    };

    multi.onGameStart = () => {
      setGameStarted(true);
      gameStartedRef.current = true;
      world.updateChunksAroundPlayer(0, 0);
      player.resetToSpawn();
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

    // 9. Monster Manager (Zombies & Slimes + Loot Drops)
    const monsters = new MonsterManager(scene, world);
    monsterManagerRef.current = monsters;

    // 10. Player Controller
    const player = new PlayerController(camera, world, atlas, renderer.domElement);
    playerRef.current = player;
    player.setAnimalManager(animals);
    player.monsterManager = monsters;

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

      // Equip into current active slot or add to hotbar
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
    player.onLockChange = (locked) => {
      setIsLocked(locked);
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
    world.updateChunksAroundPlayer(0, 0);
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

      if (gameStartedRef.current) {
        // Update Player, Monsters & Physics
        player.update(deltaTime);

        // Keep sun following player for consistent lighting
        sunLight.position.set(
          player.position.x + 40,
          player.position.y + 65,
          player.position.z + 25
        );
        sunLight.target.position.copy(player.position);

        // Dynamic chunk generation around player
        world.updateChunksAroundPlayer(player.position.x, player.position.z);

        // Multiplayer updates & position broadcasting
        multi.sendMovement(
          player.position,
          player.pitch,
          player.yaw,
          player.selectedBlock
        );
        multi.update(deltaTime);

        // Update React UI states
        setPlayerPos([player.position.x, player.position.y, player.position.z]);
      } else {
        // In lobby: show scenic rotating panorama
        const timeSec = currentTime * 0.0003;
        camera.position.set(24 * Math.sin(timeSec), 22, 24 * Math.cos(timeSec));
        camera.lookAt(0, 10, 0);
      }

      // Render
      renderer.render(scene, camera);
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
      monsters.dispose();
      player.dispose();
      multi.dispose();
      world.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [performSave]);

  // Keyboard shortcut for Enter -> Chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isInventoryOpen && !isAuthOpen) {
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
  }, [isInventoryOpen, isAuthOpen]);

  // Handler: Create Room
  const handleCreateRoom = async (nickname: string) => {
    if (!multiRef.current) return { success: false, error: "Multiplayer offline" };
    const res = await multiRef.current.createRoom(nickname);
    if (res.success && multiRef.current.currentRoom) {
      setSelfId(multiRef.current.selfId);
      setRoom({ ...multiRef.current.currentRoom });
    }
    return res;
  };

  // Handler: Join Room
  const handleJoinRoom = async (code: string, nickname: string) => {
    if (!multiRef.current) return { success: false, error: "Multiplayer offline" };
    const res = await multiRef.current.joinRoom(code, nickname);
    if (res.success && multiRef.current.currentRoom) {
      setSelfId(multiRef.current.selfId);
      setRoom({ ...multiRef.current.currentRoom });
    }
    return res;
  };

  // Handler: Start Game (Host)
  const handleStartGame = () => {
    if (multiRef.current) {
      multiRef.current.startGame();
    }
    setGameStarted(true);
    gameStartedRef.current = true;
    worldRef.current?.updateChunksAroundPlayer(0, 0);
    animalManagerRef.current?.populateInitialFauna();
    playerRef.current?.resetToSpawn();
    setTimeout(() => {
      playerRef.current?.requestLock();
    }, 120);
  };

  // Handler: Singleplayer Play Direct
  const handleSingleplayer = (_nickname: string) => {
    setGameStarted(true);
    gameStartedRef.current = true;
    worldRef.current?.updateChunksAroundPlayer(0, 0);
    animalManagerRef.current?.populateInitialFauna();
    playerRef.current?.resetToSpawn();
    setTimeout(() => {
      playerRef.current?.requestLock();
    }, 120);
  };

  // Handler: Toggle Flight
  const handleToggleFly = () => {
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

      {/* Lobby Overlay Screen (before game start) */}
      {!gameStarted && (
        <Lobby
          room={room}
          selfId={selfId}
          onStartGame={handleStartGame}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onSingleplayer={handleSingleplayer}
        />
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
            <HealthBar health={playerHealth} maxHealth={20} isHurt={isHurt} />
            <Hotbar
              activeSlot={activeSlot}
              hotbarBlocks={hotbarBlocks}
              icons={icons}
              onSelectSlot={handleSelectSlot}
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
