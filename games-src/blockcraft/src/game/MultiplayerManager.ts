import * as THREE from "three";
import { io, Socket } from "socket.io-client";
import { BlockType, BLOCK_DEFINITIONS, ChatMessage, PlayerData, RoomState } from "../types";
import { soundFx } from "./SoundEffects";
import { VoxelTextureAtlas } from "./TextureAtlas";
import { VoxelWorld } from "./VoxelWorld";

interface RemotePlayerVisual {
  data: PlayerData;
  group: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  handBlock: THREE.Mesh;
  nameSprite: THREE.Sprite;
  targetPosition: THREE.Vector3;
  targetRotation: [number, number]; // [pitch, yaw]
  walkAnimTimer: number;
}

export class MultiplayerManager {
  public socket: Socket | null = null;
  public scene: THREE.Scene;
  public world: VoxelWorld;
  public atlas: VoxelTextureAtlas;

  public selfId: string = "";
  public currentRoom: RoomState | null = null;
  public remotePlayers: Map<string, RemotePlayerVisual> = new Map();

  // Callbacks to notify React UI
  public onRoomUpdate?: (room: RoomState) => void;
  public onGameStart?: (seed: number) => void;
  public onChatMessage?: (msg: ChatMessage) => void;
  public onHostChanged?: (newHostId: string) => void;

  // Throttling network position updates (15 times per sec is optimal)
  private lastSentTime: number = 0;
  private readonly sendInterval: number = 1000 / 20; // 50ms

  constructor(scene: THREE.Scene, world: VoxelWorld, atlas: VoxelTextureAtlas) {
    this.scene = scene;
    this.world = world;
    this.atlas = atlas;
    this.initSocket();
  }

  private initSocket() {
    this.socket = io({
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
    });

    this.socket.on("connect", () => {
      this.selfId = this.socket?.id || "";
    });

    // Remote player joined room
    this.socket.on("player_joined", (data: { player: PlayerData; players: PlayerData[] }) => {
      if (this.currentRoom) {
        this.currentRoom.players = data.players;
        if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
      }
      this.createRemoteAvatar(data.player);
      soundFx.playChatChime();
    });

    // Remote player moved
    this.socket.on(
      "player_moved",
      (data: { id: string; position: [number, number, number]; rotation: [number, number]; selectedBlock: number }) => {
        const visual = this.remotePlayers.get(data.id);
        if (visual) {
          visual.targetPosition.set(data.position[0], data.position[1], data.position[2]);
          visual.targetRotation = data.rotation;

          if (visual.data.selectedBlock !== data.selectedBlock) {
            visual.data.selectedBlock = data.selectedBlock as BlockType;
            this.updateRemoteHandBlock(visual, data.selectedBlock as BlockType);
          }
        }
      }
    );

    // Block placed by remote player
    this.socket.on(
      "block_placed",
      (data: { x: number; y: number; z: number; type: number; by: string }) => {
        this.world.setBlock(data.x, data.y, data.z, data.type as BlockType);
        soundFx.playPlace();
      }
    );

    // Block broken by remote player
    this.socket.on(
      "block_broken",
      (data: { x: number; y: number; z: number; by: string }) => {
        this.world.setBlock(data.x, data.y, data.z, BlockType.AIR);
        soundFx.playBreak();
      }
    );

    // Host started game
    this.socket.on("game_started", (data: { seed: number; modifiedBlocks: Record<string, number> }) => {
      if (this.currentRoom) {
        this.currentRoom.started = true;
        if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
      }
      this.world.applyModifiedBlocks(data.modifiedBlocks);
      if (this.onGameStart) {
        this.onGameStart(data.seed);
      }
    });

    // Chat message
    this.socket.on("chat_message", (msg: ChatMessage) => {
      if (this.onChatMessage) {
        this.onChatMessage(msg);
      }
      soundFx.playChatChime();
    });

    // Remote player left
    this.socket.on("player_left", (data: { id: string; players: PlayerData[] }) => {
      if (this.currentRoom) {
        this.currentRoom.players = data.players;
        if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
      }
      this.removeRemoteAvatar(data.id);
    });

    // Host reassigned
    this.socket.on("host_changed", (data: { hostId: string }) => {
      if (this.currentRoom) {
        this.currentRoom.hostId = data.hostId;
        for (const p of this.currentRoom.players) {
          p.isHost = p.id === data.hostId;
        }
        if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
      }
      if (this.onHostChanged) {
        this.onHostChanged(data.hostId);
      }
    });
  }

  // Create room
  public createRoom(nickname: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, error: "서버와 연결되지 않았습니다." });

      const OFFLINE = "멀티플레이 서버에 연결되지 않았어요. (혼자 하기는 바로 할 수 있어요)";
      if (!this.socket.connected) {
        // 연결이 안 되면 기다리지 않고 바로 알려 줌
        const t = setTimeout(() => resolve({ success: false, error: OFFLINE }), 3000);
        this.socket.once("connect", () => clearTimeout(t));
      }
      this.socket.timeout(5000).emit("create_room", { nickname }, (err: any, res: any) => {
        if (err) return resolve({ success: false, error: OFFLINE });
        if (res && res.success) {
          this.selfId = res.selfId;
          this.currentRoom = res.room;
          if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom!);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: res?.error || "방 생성 실패" });
        }
      });
    });
  }

  // Join room
  public joinRoom(roomCode: string, nickname: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket) return resolve({ success: false, error: "서버와 연결되지 않았습니다." });

      const OFFLINE = "멀티플레이 서버에 연결되지 않았어요. (혼자 하기는 바로 할 수 있어요)";
      if (!this.socket.connected) {
        // 연결이 안 되면 기다리지 않고 바로 알려 줌
        const t = setTimeout(() => resolve({ success: false, error: OFFLINE }), 3000);
        this.socket.once("connect", () => clearTimeout(t));
      }
      this.socket.timeout(5000).emit("join_room", { roomCode, nickname }, (err: any, res: any) => {
        if (err) return resolve({ success: false, error: OFFLINE });
        if (res && res.success) {
          this.selfId = res.selfId;
          this.currentRoom = res.room;

          // Apply modified blocks
          if (res.room.modifiedBlocks) {
            this.world.applyModifiedBlocks(res.room.modifiedBlocks);
          }

          // Build existing avatars
          for (const p of res.room.players) {
            if (p.id !== this.selfId) {
              this.createRemoteAvatar(p);
            }
          }

          if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom!);
          resolve({ success: true });
        } else {
          resolve({ success: false, error: res?.error || "방 참가 실패" });
        }
      });
    });
  }

  // Host starts game
  public startGame() {
    if (this.socket && this.currentRoom) {
      this.socket.emit("start_game");
    }
  }

  // Send local player position & view updates
  public sendMovement(
    position: THREE.Vector3,
    pitch: number,
    yaw: number,
    selectedBlock: BlockType
  ) {
    const now = performance.now();
    if (now - this.lastSentTime < this.sendInterval) return;
    this.lastSentTime = now;

    if (this.socket && this.socket.connected && this.currentRoom) {
      this.socket.emit("player_move", {
        position: [position.x, position.y, position.z],
        rotation: [pitch, yaw],
        selectedBlock,
      });
    }
  }

  // Send block place event
  public sendBlockPlace(x: number, y: number, z: number, type: BlockType) {
    if (this.socket && this.socket.connected && this.currentRoom) {
      this.socket.emit("block_place", { x, y, z, type });
    }
  }

  // Send block break event
  public sendBlockBreak(x: number, y: number, z: number) {
    if (this.socket && this.socket.connected && this.currentRoom) {
      this.socket.emit("block_break", { x, y, z });
    }
  }

  // Send chat message
  public sendChatMessage(message: string) {
    if (this.socket && this.socket.connected && this.currentRoom && message.trim()) {
      this.socket.emit("chat_message", { message });
    }
  }

  // Construct 3D Minecraft Avatar with Billboard Nickname & Held Block
  private createRemoteAvatar(data: PlayerData) {
    if (this.remotePlayers.has(data.id)) return;

    const group = new THREE.Group();
    group.position.set(data.position[0], data.position[1], data.position[2]);

    const playerColor = new THREE.Color(data.color || "#3b82f6");
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe0a982 }); // Peach skin tone
    const shirtMat = new THREE.MeshLambertMaterial({ color: playerColor });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2b3856 }); // Dark blue pants
    const hairMat = new THREE.MeshLambertMaterial({ color: 0x4a2e1b }); // Brown hair

    // Head (0.45 x 0.45 x 0.45)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.45, 0);

    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Hair cap
    const hairGeo = new THREE.BoxGeometry(0.44, 0.15, 0.44);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 0.18, 0);
    headGroup.add(hair);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.1, 0.02, 0.22);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.1, 0.02, 0.22);
    headGroup.add(leftEye, rightEye);

    group.add(headGroup);

    // Torso (0.48 x 0.65 x 0.26)
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.62, 0.26);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.set(0, 0.95, 0);
    torso.castShadow = true;
    group.add(torso);

    // Left Arm
    const armGeo = new THREE.BoxGeometry(0.18, 0.62, 0.18);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.35, 0.95, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    // Right Arm (holds the block)
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.35, 1.25, 0); // Pivot at shoulder
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0, -0.3, 0);
    rightArm.castShadow = true;
    rightArmGroup.add(rightArm);

    // 3D Block held in hand
    const handBlockGeo = new THREE.BoxGeometry(0.24, 0.24, 0.24);
    const handBlock = new THREE.Mesh(handBlockGeo, this.atlas.opaqueMaterial);
    handBlock.position.set(0, -0.58, 0.15);
    rightArmGroup.add(handBlock);
    group.add(rightArmGroup);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.62, 0.2);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.12, 0.32, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.12, 0.32, 0);
    rightLeg.castShadow = true;
    group.add(leftLeg, rightLeg);

    // Billboard Nickname Sprite
    const nameSprite = this.createNicknameSprite(data.nickname, data.color, data.isHost);
    nameSprite.position.set(0, 2.05, 0);
    group.add(nameSprite);

    this.scene.add(group);

    const visual: RemotePlayerVisual = {
      data,
      group,
      head,
      torso,
      leftArm,
      rightArm: rightArm as any,
      leftLeg,
      rightLeg,
      handBlock,
      nameSprite,
      targetPosition: new THREE.Vector3(...data.position),
      targetRotation: data.rotation,
      walkAnimTimer: 0,
    };

    this.updateRemoteHandBlock(visual, data.selectedBlock || BlockType.GRASS);
    this.remotePlayers.set(data.id, visual);
  }

  // Create crisp 2D Billboard Sprite for Player Nickname
  private createNicknameSprite(nickname: string, color: string, isHost?: boolean): THREE.Sprite {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 70;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, 320, 70);

    // Pill background
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(10, 10, 300, 50, 25);
    ctx.fill();

    // Border with player color
    ctx.strokeStyle = color || "#3b82f6";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text: Nickname with host crown if applicable
    ctx.font = "bold 24px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const label = (isHost ? "👑 " : "") + nickname;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, 160, 35);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      transparent: true,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1.6, 0.35, 1);
    return sprite;
  }

  // Update visual block attached to remote player's right hand
  private updateRemoteHandBlock(visual: RemotePlayerVisual, blockType: BlockType) {
    const meta = BLOCK_DEFINITIONS[blockType];
    visual.handBlock.material = meta.transparent
      ? this.atlas.transparentMaterial
      : this.atlas.opaqueMaterial;

    const geo = visual.handBlock.geometry as THREE.BoxGeometry;
    const uvs: number[] = [];
    for (let faceIdx = 0; faceIdx < 6; faceIdx++) {
      const tileId = this.atlas.getTileForFace(blockType, faceIdx);
      const uv = this.atlas.getUV(tileId);
      uvs.push(
        uv.u0, uv.v1,
        uv.u1, uv.v1,
        uv.u0, uv.v0,
        uv.u1, uv.v0
      );
    }
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  }

  // Remove remote avatar
  private removeRemoteAvatar(id: string) {
    const visual = this.remotePlayers.get(id);
    if (visual) {
      this.scene.remove(visual.group);
      this.remotePlayers.delete(id);
    }
  }

  // Update loop: smooth interpolation and leg/arm walking animations
  public update(dt: number) {
    for (const visual of this.remotePlayers.values()) {
      // Position lerp
      const oldPos = visual.group.position.clone();
      visual.group.position.lerp(visual.targetPosition, 0.22);

      // Rotation lerp
      const [pitch, yaw] = visual.targetRotation;
      visual.group.rotation.y = THREE.MathUtils.lerp(visual.group.rotation.y, yaw, 0.25);
      visual.head.rotation.x = THREE.MathUtils.lerp(visual.head.rotation.x, pitch, 0.25);

      // Walking animation based on speed
      const distMoved = visual.group.position.distanceTo(oldPos);
      if (distMoved > 0.01) {
        visual.walkAnimTimer += dt * 11;
        const swing = Math.sin(visual.walkAnimTimer) * 0.55;
        visual.leftLeg.rotation.x = swing;
        visual.rightLeg.rotation.x = -swing;
        visual.leftArm.rotation.x = -swing;
      } else {
        visual.leftLeg.rotation.x = THREE.MathUtils.lerp(visual.leftLeg.rotation.x, 0, 0.2);
        visual.rightLeg.rotation.x = THREE.MathUtils.lerp(visual.rightLeg.rotation.x, 0, 0.2);
        visual.leftArm.rotation.x = THREE.MathUtils.lerp(visual.leftArm.rotation.x, 0, 0.2);
      }
    }
  }

  // Return positions of other players for collision detection
  public getOtherPlayerPositions(): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    for (const visual of this.remotePlayers.values()) {
      positions.push(visual.group.position.clone());
    }
    return positions;
  }

  public dispose() {
    for (const visual of this.remotePlayers.values()) {
      this.scene.remove(visual.group);
    }
    this.remotePlayers.clear();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
