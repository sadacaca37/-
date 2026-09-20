/**
 * 마크(블록 크래프트) 멀티플레이 방 — 원본 게임(GAME/마크) server.ts의 소켓 부분을 그대로 옮김.
 * 방·블록 정보는 메모리에만 두고, 모두 나가면 사라집니다. (개인 월드는 브라우저에 저장)
 */
import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface PlayerData {
  id: string;
  socketId: string;
  userId?: string;
  nickname: string;
  position: [number, number, number];
  rotation: [number, number]; // pitch, yaw
  selectedBlock: number;
  color: string;
  isHost: boolean;
}

interface Room {
  code: string;
  hostId: string;
  players: Record<string, PlayerData>;
  seed: number;
  modifiedBlocks: Record<string, number>; // "x,y,z" => blockType (0 = air)
  started: boolean;
  maxPlayers: number;
}

const rooms: Record<string, Room> = {};

const PLAYER_COLORS = [
  "#22c55e", // emerald green
  "#3b82f6", // royal blue
  "#f97316", // bright orange
  "#ec4899", // pink
  "#a855f7", // purple
  "#eab308", // yellow
  "#06b6d4", // cyan
  "#ef4444", // red
];

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms[code] ? generateRoomCode() : code;
}

export function attachBlockcraft(server: HttpServer) {
  const io = new Server(server, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e6,
  });
  io.on("connection", (socket: Socket) => {
    let currentRoomCode: string | null = null;
    let currentPlayerId: string | null = null;
    let currentUserId: string | null = null;

    // Attach user id if authenticated
    socket.on("authenticate_player", (data: { token?: string }) => {
      if (data?.token) {
        const user = { id: String(data.token).slice(0, 40) };
        if (user) {
          currentUserId = user.id;
          if (currentRoomCode && currentPlayerId && rooms[currentRoomCode]?.players[currentPlayerId]) {
            rooms[currentRoomCode].players[currentPlayerId].userId = user.id;
          }
        }
      }
    });

    // Create a new room
    socket.on("create_room", (data: { nickname: string; userId?: string }, callback: (res: any) => void) => {
      const roomCode = generateRoomCode();
      const playerId = socket.id;
      const color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

      const hostPlayer: PlayerData = {
        id: playerId,
        socketId: socket.id,
        userId: data.userId || currentUserId || undefined,
        nickname: (data.nickname || "Player").trim().slice(0, 16) || "Player",
        position: [0, 20, 0],
        rotation: [0, 0],
        selectedBlock: 1, // grass
        color,
        isHost: true,
      };

      // Load any existing saved world blocks for this room if any
      const savedBlocks: Record<string, number> = {};

      const newRoom: Room = {
        code: roomCode,
        hostId: playerId,
        players: { [playerId]: hostPlayer },
        seed: Math.floor(Math.random() * 1000000),
        modifiedBlocks: { ...savedBlocks },
        started: false,
        maxPlayers: 6,
      };

      rooms[roomCode] = newRoom;
      currentRoomCode = roomCode;
      currentPlayerId = playerId;

      socket.join(roomCode);

      callback({
        success: true,
        room: {
          code: newRoom.code,
          hostId: newRoom.hostId,
          players: Object.values(newRoom.players),
          seed: newRoom.seed,
          started: newRoom.started,
          maxPlayers: newRoom.maxPlayers,
          modifiedBlocks: newRoom.modifiedBlocks,
        },
        selfId: playerId,
        player: hostPlayer,
      });
    });

    // Join an existing room
    socket.on("join_room", (data: { roomCode: string; nickname: string; userId?: string }, callback: (res: any) => void) => {
      const code = (data.roomCode || "").toUpperCase().trim();
      const room = rooms[code];

      if (!room) {
        return callback({ success: false, error: "해당 방을 찾을 수 없습니다." });
      }

      if (Object.keys(room.players).length >= room.maxPlayers) {
        return callback({ success: false, error: "방이 꽉 찼습니다 (최대 6명)." });
      }

      const playerId = socket.id;
      const usedColors = Object.values(room.players).map((p) => p.color);
      const availableColor = PLAYER_COLORS.find((c) => !usedColors.includes(c)) || PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];

      const newPlayer: PlayerData = {
        id: playerId,
        socketId: socket.id,
        userId: data.userId || currentUserId || undefined,
        nickname: (data.nickname || "Player").trim().slice(0, 16) || `Player_${Object.keys(room.players).length + 1}`,
        position: [0, 20, 0],
        rotation: [0, 0],
        selectedBlock: 1,
        color: availableColor,
        isHost: false,
      };

      room.players[playerId] = newPlayer;
      currentRoomCode = code;
      currentPlayerId = playerId;

      socket.join(code);

      // Notify others in room
      socket.to(code).emit("player_joined", {
        player: newPlayer,
        players: Object.values(room.players),
      });

      callback({
        success: true,
        room: {
          code: room.code,
          hostId: room.hostId,
          players: Object.values(room.players),
          seed: room.seed,
          started: room.started,
          maxPlayers: room.maxPlayers,
          modifiedBlocks: room.modifiedBlocks,
        },
        selfId: playerId,
        player: newPlayer,
      });
    });

    // Host starts game
    socket.on("start_game", () => {
      if (!currentRoomCode) return;
      const room = rooms[currentRoomCode];
      if (!room || room.hostId !== socket.id) return;

      room.started = true;
      io.to(currentRoomCode).emit("game_started", {
        seed: room.seed,
        modifiedBlocks: room.modifiedBlocks,
      });
    });

    // Player movement & rotation update
    socket.on("player_move", (data: { position: [number, number, number]; rotation: [number, number]; selectedBlock: number }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms[currentRoomCode];
      if (!room) return;

      const player = room.players[currentPlayerId];
      if (player) {
        player.position = data.position;
        player.rotation = data.rotation;
        player.selectedBlock = data.selectedBlock;

        socket.to(currentRoomCode).emit("player_moved", {
          id: currentPlayerId,
          position: data.position,
          rotation: data.rotation,
          selectedBlock: data.selectedBlock,
        });
      }
    });

    // Block place event (persists to SQLite database in real-time)
    socket.on("block_place", (data: { x: number; y: number; z: number; type: number }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms[currentRoomCode];
      if (!room) return;

      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      room.modifiedBlocks[key] = data.type;

      // Broadcast to all other players in room
      socket.to(currentRoomCode).emit("block_placed", {
        x: data.x,
        y: data.y,
        z: data.z,
        type: data.type,
        by: currentPlayerId,
      });
    });

    // Block break event (persists to SQLite database in real-time)
    socket.on("block_break", (data: { x: number; y: number; z: number }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms[currentRoomCode];
      if (!room) return;

      const key = `${Math.floor(data.x)},${Math.floor(data.y)},${Math.floor(data.z)}`;
      room.modifiedBlocks[key] = 0; // Air

      // Broadcast to all other players in room
      socket.to(currentRoomCode).emit("block_broken", {
        x: data.x,
        y: data.y,
        z: data.z,
        by: currentPlayerId,
      });
    });

    // In-game Chat
    socket.on("chat_message", (data: { message: string }) => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms[currentRoomCode];
      if (!room) return;

      const player = room.players[currentPlayerId];
      const msg = (data.message || "").trim().slice(0, 100);
      if (!msg) return;

      io.to(currentRoomCode).emit("chat_message", {
        id: Math.random().toString(36).substring(2, 9),
        senderId: currentPlayerId,
        senderName: player ? player.nickname : "Player",
        color: player ? player.color : "#ffffff",
        message: msg,
        timestamp: Date.now(),
      });
    });

    // Disconnection handling
    socket.on("disconnect", () => {
      if (!currentRoomCode || !currentPlayerId) return;
      const room = rooms[currentRoomCode];
      if (!room) return;

      const disconnectingPlayer = room.players[currentPlayerId];

      delete room.players[currentPlayerId];
      const remainingPlayers = Object.values(room.players);

      if (remainingPlayers.length === 0) {
        delete rooms[currentRoomCode];
      } else {
        if (room.hostId === currentPlayerId) {
          room.hostId = remainingPlayers[0].id;
          remainingPlayers[0].isHost = true;
          io.to(currentRoomCode).emit("host_changed", { hostId: room.hostId });
        }

        io.to(currentRoomCode).emit("player_left", {
          id: currentPlayerId,
          players: remainingPlayers,
        });
      }
    });
  });
  return io;
}
