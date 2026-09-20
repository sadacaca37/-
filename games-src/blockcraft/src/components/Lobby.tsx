import React, { useState } from "react";
import {
  Users,
  Play,
  Copy,
  Check,
  Crown,
  Sparkles,
  ArrowRight,
  Shield,
  Gamepad2,
  Dice5,
} from "lucide-react";
import { PlayerData, RoomState } from "../types";

interface LobbyProps {
  room: RoomState | null;
  selfId: string;
  onStartGame: () => void;
  onCreateRoom: (nickname: string) => Promise<{ success: boolean; error?: string }>;
  onJoinRoom: (roomCode: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  onSingleplayer: (nickname: string) => void;
}

const DEFAULT_NICKNAMES = [
  "Steve",
  "Alex",
  "Miner_99",
  "BlockMaster",
  "PixelHero",
  "CraftPro",
  "DiamondGuy",
  "Redstone",
];

export const Lobby: React.FC<LobbyProps> = ({
  room,
  selfId,
  onStartGame,
  onCreateRoom,
  onJoinRoom,
  onSingleplayer,
}) => {
  const [nickname, setNickname] = useState(() => {
    // 타자팡팡에 로그인한 이름을 그대로 닉네임으로
    try {
      const u = JSON.parse(localStorage.getItem("typang_current_user") || "null");
      const n = String(u?.name || u?.nickname || "").trim().slice(0, 16);
      if (n) return n;
    } catch {}
    return DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)];
  });
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const randomizeNickname = () => {
    const random = DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    setNickname(`${random}_${num}`);
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async () => {
    if (!nickname.trim()) {
      setErrorMsg("닉네임을 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    const res = await onCreateRoom(nickname.trim());
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "방 생성 실패");
    }
  };

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setErrorMsg("닉네임을 입력해 주세요.");
      return;
    }
    if (!joinCode.trim()) {
      setErrorMsg("방 코드를 입력해 주세요.");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    const res = await onJoinRoom(joinCode.trim(), nickname.trim());
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.error || "방 참가 실패");
    }
  };

  const isHost = room?.hostId === selfId;
  const playerCount = room?.players.length || 0;
  const maxPlayers = room?.maxPlayers || 6;
  const isFull = playerCount >= maxPlayers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 select-none">
      {/* Background Minecraft block atmosphere decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative w-full max-w-lg bg-neutral-900/95 border-2 border-neutral-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Logo Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/20 mb-3 border border-emerald-400/40">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            3D BLOCK BUILDER
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-mono">
            Three.js & Socket.io 기반 실시간 6인 멀티플레이어 Voxel Sandbox
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-4 px-4 py-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MODE A: Inside Waiting Room (Lobby) */}
        {room ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Room Code Card */}
            <div className="bg-neutral-950/80 p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono text-neutral-400 block uppercase tracking-wider">
                  멀티플레이 방 코드 (친구 초대용)
                </span>
                <span className="text-2xl font-black tracking-widest text-amber-400 font-mono">
                  {room.code}
                </span>
              </div>
              <button
                id="btn-copy-code"
                onClick={handleCopyCode}
                className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-neutral-700 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>코드 복사</span>
                  </>
                )}
              </button>
            </div>

            {/* Connected Players List (Max 6) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-300">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="font-bold">대기 중인 플레이어</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${
                    isFull
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-neutral-800 text-neutral-300"
                  }`}
                >
                  {playerCount} / {maxPlayers} {isFull && "(정원 완료)"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800">
                {room.players.map((p) => {
                  const isMe = p.id === selfId;
                  const isPlayerHost = p.id === room.hostId;

                  return (
                    <div
                      key={p.id}
                      className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border ${
                        isMe
                          ? "bg-neutral-800/90 border-blue-500/60 shadow-md"
                          : "bg-neutral-900/80 border-neutral-800"
                      }`}
                    >
                      {/* Avatar Color Orb */}
                      <div
                        className="w-4 h-4 rounded-full border border-black/40 shadow shrink-0"
                        style={{ backgroundColor: p.color }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold text-white truncate">
                            {p.nickname}
                          </span>
                          {isPlayerHost && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-400 block font-mono">
                          {isMe ? "(나)" : isPlayerHost ? "방장" : "참가자"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Empty Slots */}
                {Array.from({ length: maxPlayers - playerCount }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-neutral-800 text-neutral-600 text-[11px] font-mono"
                  >
                    빈 슬롯
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {isHost ? (
                <button
                  id="btn-start-game"
                  onClick={onStartGame}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>게임 시작 (모든 플레이어 동시 입장)</span>
                </button>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-2xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>방장이 게임을 시작하기를 기다리는 중...</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MODE B: Main Menu (Nickname + Create / Join Room / Singleplayer) */
          <div className="space-y-5">
            {/* Nickname Input */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono mb-2">
                플레이어 닉네임
              </label>
              <div className="flex gap-2">
                <input
                  id="input-nickname"
                  type="text"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 입력 (예: Steve)"
                  className="flex-1 px-4 py-2.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  id="btn-random-name"
                  onClick={randomizeNickname}
                  title="랜덤 닉네임 생성"
                  className="px-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-neutral-300 transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Dice5 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Multiplayer Room Creation & Joining */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Create Room Button */}
              <button
                id="btn-create-room"
                disabled={isLoading}
                onClick={handleCreate}
                className="group flex flex-col items-start p-4 rounded-2xl bg-neutral-950/80 hover:bg-neutral-800/90 border-2 border-neutral-800 hover:border-emerald-500/70 text-left transition-all duration-200 cursor-pointer shadow-lg"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-white font-bold text-sm block">새 방 만들기</span>
                <span className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                  새로운 멀티플레이 방을 생성하고 코드를 친구들에게 공유합니다.
                </span>
              </button>

              {/* Join Room Section */}
              <div className="flex flex-col p-4 rounded-2xl bg-neutral-950/80 border-2 border-neutral-800 focus-within:border-blue-500/70 transition-all shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-white font-bold text-sm">방 참가하기</span>
                </div>
                <div className="flex gap-1.5 mt-auto pt-1">
                  <input
                    id="input-room-code"
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="방 코드 5자리"
                    className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-xs font-mono tracking-widest uppercase focus:outline-none focus:border-blue-500"
                  />
                  <button
                    id="btn-join-room"
                    disabled={isLoading}
                    onClick={handleJoin}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Singleplayer Direct Play */}
            <div className="pt-2">
              <button
                id="btn-singleplayer"
                onClick={() => onSingleplayer(nickname.trim() || "Miner")}
                className="w-full py-3 px-4 rounded-2xl bg-neutral-800/80 hover:bg-neutral-750 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-neutral-400" />
                <span>혼자 연습 / 싱글 플레이어로 즉시 시작</span>
              </button>
            </div>
          </div>
        )}

        {/* Game Features Highlights Footer */}
        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-[11px] text-neutral-500 flex items-center justify-around font-mono">
          <span>FPS 마우스 시점</span>
          <span>•</span>
          <span>청크 & 면 컬링 최적화</span>
          <span>•</span>
          <span>실시간 6인 동기화</span>
        </div>
      </div>
    </div>
  );
};
