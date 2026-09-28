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

  // ---------------------------------------------------------------------------
  // 네트워크: 소켓(socket.io)이 되면 소켓, 막혀 있으면 HTTP(롱폴링)로 자동 전환
  // ---------------------------------------------------------------------------
  private mode: "socket" | "http" = "socket";
  private httpPid = "";
  private httpSecret = "";
  private httpOutbox: { event: string; data: any }[] = [];
  private httpFlushTimer: number | null = null;
  private httpPolling = false;
  private readonly apiBase = "/api/bc";

  private handlers(): Record<string, (data: any) => void> {
    return {
      // Remote player joined room
      player_joined: (data: { player: PlayerData; players: PlayerData[] }) => {
        if (this.currentRoom) {
          this.currentRoom.players = data.players;
          if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
        }
        this.createRemoteAvatar(data.player);
        soundFx.playChatChime();
      },
      // Remote player moved
      player_moved: (data: { id: string; position: [number, number, number]; rotation: [number, number]; selectedBlock: number }) => {
        const visual = this.remotePlayers.get(data.id);
        if (visual) {
          visual.targetPosition.set(data.position[0], data.position[1], data.position[2]);
          visual.targetRotation = data.rotation;
          if (visual.data.selectedBlock !== data.selectedBlock) {
            visual.data.selectedBlock = data.selectedBlock as BlockType;
            this.updateRemoteHandBlock(visual, data.selectedBlock as BlockType);
          }
        }
      },
      block_placed: (data: { x: number; y: number; z: number; type: number; by: string }) => {
        this.world.setBlock(data.x, data.y, data.z, data.type as BlockType);
        soundFx.playPlace();
      },
      block_broken: (data: { x: number; y: number; z: number; by: string }) => {
        this.world.setBlock(data.x, data.y, data.z, BlockType.AIR);
        soundFx.playBreak();
      },
      // Host started game
      game_started: (data: { seed: number; modifiedBlocks: Record<string, number> }) => {
        if (this.currentRoom) {
          this.currentRoom.started = true;
          if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
        }
        this.world.applyModifiedBlocks(data.modifiedBlocks);
        if (this.onGameStart) this.onGameStart(data.seed);
      },
      chat_message: (msg: ChatMessage) => {
        if (this.onChatMessage) this.onChatMessage(msg);
        soundFx.playChatChime();
      },
      player_left: (data: { id: string; players: PlayerData[] }) => {
        if (this.currentRoom) {
          this.currentRoom.players = data.players;
          if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
        }
        this.removeRemoteAvatar(data.id);
      },
      host_changed: (data: { hostId: string }) => {
        if (this.currentRoom) {
          this.currentRoom.hostId = data.hostId;
          for (const p of this.currentRoom.players) p.isHost = p.id === data.hostId;
          if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom);
        }
        if (this.onHostChanged) this.onHostChanged(data.hostId);
      },
    };
  }

  private initSocket() {
    try {
      this.socket = io({
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 3,
        timeout: 4000,
      });
    } catch {
      this.socket = null;
      return;
    }
    this.socket.on("connect", () => {
      if (this.mode === "socket") this.selfId = this.socket?.id || "";
    });
    const hs = this.handlers();
    for (const [ev, fn] of Object.entries(hs)) {
      this.socket.on(ev, (data: any) => {
        if (this.mode === "socket") fn(data);
      });
    }
    window.addEventListener("pagehide", () => this.leaveHttp());
  }

  /** 소켓이 연결될 때까지 잠깐 기다림 (안 되면 false) */
  private waitSocket(ms: number): Promise<boolean> {
    return new Promise((resolve) => {
      const s = this.socket;
      if (!s) return resolve(false);
      if (s.connected) return resolve(true);
      const t = setTimeout(() => resolve(false), ms);
      s.once("connect", () => {
        clearTimeout(t);
        resolve(true);
      });
    });
  }

  private socketRequest(event: string, payload: any): Promise<any | null> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) return resolve(null);
      this.socket.timeout(5000).emit(event, payload, (err: any, res: any) => resolve(err ? null : res));
    });
  }

  private async httpRequest(path: string, body: any): Promise<any | null> {
    try {
      const r = await fetch(`${this.apiBase}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) return null; // 서버가 없는 곳(미리보기 등)
      return await r.json();
    } catch {
      return null;
    }
  }

  private offlineMessage() {
    const host = location.hostname;
    const preview = /claude\.ai|claudeusercontent|localhost-preview/.test(host) || location.protocol === "file:";
    return preview
      ? "이 미리보기 화면에는 멀티플레이 서버가 없어서 방을 만들 수 없어요. 실제 타자팡팡 사이트에서 해 주세요. (혼자 하기는 바로 할 수 있어요)"
      : "멀티플레이 서버에 연결하지 못했어요. 잠시 후 다시 눌러 주세요. (혼자 하기는 바로 할 수 있어요)";
  }

  /** 방 만들기·참가: 소켓 → 안 되면 HTTP */
  private async enterRoom(kind: "create" | "join", payload: any): Promise<{ success: boolean; error?: string }> {
    this.leaveHttp();
    let res: any = null;
    let via: "socket" | "http" = "socket";
    if (await this.waitSocket(2500)) {
      res = await this.socketRequest(kind === "create" ? "create_room" : "join_room", payload);
    }
    if (!res) {
      via = "http";
      res = await this.httpRequest(kind, payload);
    }
    if (!res) return { success: false, error: this.offlineMessage() };
    if (!res.success) return { success: false, error: res.error || (kind === "create" ? "방 만들기 실패" : "방 참가 실패") };

    this.mode = via;
    this.selfId = res.selfId;
    this.currentRoom = res.room;
    if (via === "http") {
      this.httpPid = res.selfId;
      this.httpSecret = res.secret;
      this.startHttpPolling();
    }
    if (kind === "join") {
      if (res.room.modifiedBlocks) this.world.applyModifiedBlocks(res.room.modifiedBlocks);
      for (const p of res.room.players) if (p.id !== this.selfId) this.createRemoteAvatar(p);
    }
    if (this.onRoomUpdate) this.onRoomUpdate(this.currentRoom!);
    return { success: true };
  }

  private startHttpPolling() {
    if (this.httpPolling) return;
    this.httpPolling = true;
    const hs = this.handlers();
    const loop = async () => {
      while (this.mode === "http" && this.httpPid) {
        const pid = this.httpPid;
        try {
          const r = await fetch(`${this.apiBase}/poll?pid=${encodeURIComponent(pid)}&secret=${encodeURIComponent(this.httpSecret)}`);
          if (r.status === 401) break;
          const j = await r.json();
          if (pid !== this.httpPid) break;
          for (const e of j?.events || []) {
            try {
              hs[e.event]?.(e.data);
            } catch {}
          }
        } catch {
          await new Promise((ok) => setTimeout(ok, 1000));
        }
      }
      this.httpPolling = false;
    };
    void loop();
  }

  private send(event: string, data: any) {
    if (!this.currentRoom) return;
    if (this.mode === "socket") {
      if (this.socket && this.socket.connected) this.socket.emit(event, data);
      return;
    }
    if (!this.httpPid) return;
    // 이동은 최신 것 하나만 보냄
    if (event === "player_move") {
      const i = this.httpOutbox.findIndex((e) => e.event === "player_move");
      if (i >= 0) this.httpOutbox.splice(i, 1);
    }
    this.httpOutbox.push({ event, data });
    if (this.httpFlushTimer == null) {
      this.httpFlushTimer = window.setTimeout(() => {
        this.httpFlushTimer = null;
        const events = this.httpOutbox.splice(0, this.httpOutbox.length);
        if (!events.length || !this.httpPid) return;
        void this.httpRequest("send", { pid: this.httpPid, secret: this.httpSecret, events });
      }, event === "player_move" ? 100 : 30);
    }
  }

  private leaveHttp() {
    if (this.mode !== "http" || !this.httpPid) return;
    const body = JSON.stringify({ pid: this.httpPid, secret: this.httpSecret, events: [{ event: "leave_room", data: null }] });
    try {
      navigator.sendBeacon?.(`${this.apiBase}/send`, new Blob([body], { type: "application/json" }));
    } catch {}
    this.httpPid = "";
    this.httpSecret = "";
    this.mode = "socket";
  }

  // Create room
  public createRoom(nickname: string): Promise<{ success: boolean; error?: string }> {
    return this.enterRoom("create", { nickname });
  }

  // Join room
  public joinRoom(roomCode: string, nickname: string): Promise<{ success: boolean; error?: string }> {
    return this.enterRoom("join", { roomCode: roomCode.toUpperCase().trim(), nickname });
  }

  // Host starts game
  public startGame() {
    this.send("start_game", null);
  }

  // Send local player position & view updates
  public sendMovement(position: THREE.Vector3, pitch: number, yaw: number, selectedBlock: BlockType) {
    const now = performance.now();
    if (now - this.lastSentTime < this.sendInterval) return;
    this.lastSentTime = now;
    this.send("player_move", {
      position: [position.x, position.y, position.z],
      rotation: [pitch, yaw],
      selectedBlock,
    });
  }

  // Send block place event
  public sendBlockPlace(x: number, y: number, z: number, type: BlockType) {
    this.send("block_place", { x, y, z, type });
  }

  // Send block break event
  public sendBlockBreak(x: number, y: number, z: number) {
    this.send("block_break", { x, y, z });
  }

  // Send chat message
  public sendChatMessage(message: string) {
    if (message.trim()) this.send("chat_message", { message });
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
    this.leaveHttp();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
