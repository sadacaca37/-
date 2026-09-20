import React, { useState } from "react";
import { Users, Copy, Check, Crown, Info, X, Database, Hammer } from "lucide-react";
import { PlayerData, RoomState, UserAccount } from "../types";

interface GameHUDProps {
  room: RoomState | null;
  selfId: string;
  playerPos: [number, number, number];
  fps: number;
  isLocked: boolean;
  onRequestLock: () => void;
  isFlying?: boolean;
  onToggleFly?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuthModal?: () => void;
  onOpenCrafting?: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  room,
  selfId,
  playerPos,
  fps,
  isLocked,
  onRequestLock,
  isFlying = false,
  onToggleFly,
  currentUser,
  onOpenAuthModal,
  onOpenCrafting,
}) => {
  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [x, y, z] = playerPos;

  return (
    <>
      {/* 1. Center Crosshair (+) */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="relative w-5 h-5 flex items-center justify-center">
          {/* Horizontal line */}
          <div className="absolute w-4 h-0.5 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
          {/* Vertical line */}
          <div className="absolute h-4 w-0.5 bg-white/90 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
          {/* Center dot */}
          <div className="w-1 h-1 bg-white rounded-full shadow" />
        </div>
      </div>

      {/* 2. Top-Left Coordinates & Room Info */}
      <div className="fixed top-4 left-4 z-30 pointer-events-auto flex flex-col gap-2 font-mono">
        <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-white shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">XYZ:</span>
            <span>
              {x.toFixed(1)} / {y.toFixed(1)} / {z.toFixed(1)}
            </span>
            <span className="text-neutral-500">|</span>
            <span className="text-emerald-400 font-bold">{fps} FPS</span>
          </div>

          {/* Flying Mode Indicator */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
            <button
              id="btn-toggle-flight"
              onClick={onToggleFly}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                isFlying
                  ? "bg-sky-500/80 text-white border border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  : "bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20"
              }`}
            >
              <span>🚀 비행 모드:</span>
              <span>{isFlying ? "ON (Space:상승)" : "OFF [F]"}</span>
            </button>
          </div>

          {room && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-white/10">
              <span className="text-neutral-400">
                방 코드: <strong className="text-amber-300 font-bold">{room.code}</strong>
              </span>
              <button
                id="btn-hud-copy-code"
                onClick={handleCopyCode}
                className="text-[10px] text-neutral-300 hover:text-white px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "복사됨" : "복사"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Top-Right Buttons: Crafting, Account/DB, Players, Help */}
      <div className="fixed top-4 right-4 z-30 pointer-events-auto flex items-center gap-2 font-mono">
        {/* Quick Crafting Table Button */}
        <button
          id="btn-hud-crafting"
          onClick={onOpenCrafting}
          className="bg-amber-950/70 hover:bg-amber-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-amber-500/50 text-amber-300 hover:text-white text-xs flex items-center gap-1.5 shadow-xl transition-all cursor-pointer"
          title="작업대 / 조합 UI 열기"
        >
          <Hammer className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline font-bold">조합대</span>
        </button>

        {/* SQLite Database / User Account Button */}
        <button
          id="btn-hud-auth"
          onClick={onOpenAuthModal}
          className={`backdrop-blur-md px-3 py-2 rounded-xl border text-xs flex items-center gap-1.5 shadow-xl transition-all cursor-pointer ${
            currentUser
              ? "bg-emerald-950/70 hover:bg-emerald-900/80 border-emerald-500/50 text-emerald-300 hover:text-white"
              : "bg-black/60 hover:bg-black/80 border-white/10 text-neutral-300 hover:text-white"
          }`}
          title="계정 로그인 및 데이터 영구 저장"
        >
          <Database className={`w-3.5 h-3.5 ${currentUser ? "text-emerald-400" : "text-neutral-400"}`} />
          <span className="font-bold">
            {currentUser ? currentUser.username : "로그인 / 저장"}
          </span>
          {currentUser && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Help / Controls Guide Button */}
        <button
          id="btn-toggle-help"
          onClick={() => setShowHelp(!showHelp)}
          className="bg-black/60 hover:bg-black/80 backdrop-blur-md px-2.5 py-2 rounded-xl border border-white/10 text-neutral-300 hover:text-white text-xs flex items-center gap-1.5 shadow-xl transition-all cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">조작법</span>
        </button>

        {/* Players List Button */}
        {room && (
          <div className="relative">
            <button
              id="btn-toggle-players"
              onClick={() => setShowPlayerList(!showPlayerList)}
              className="bg-black/60 hover:bg-black/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 text-white text-xs flex items-center gap-2 shadow-xl transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {room.players.length}/{room.maxPlayers}
              </span>
            </button>

            {/* Dropdown Players Popup */}
            {showPlayerList && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-900/95 border border-neutral-700 rounded-2xl p-3 shadow-2xl backdrop-blur-xl z-40 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase">
                  <span>접속자 목록 ({room.players.length}명)</span>
                  <button onClick={() => setShowPlayerList(false)} className="cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {room.players.map((p) => {
                    const isMe = p.id === selfId;
                    const isHost = p.id === room.hostId;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-neutral-800/80 text-xs"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-neutral-200 truncate flex-1">
                          {p.nickname} {isMe && "(나)"}
                        </span>
                        {isHost && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Controls Help Overlay Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl font-mono text-xs text-neutral-300 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-white font-bold text-sm">🎮 게임 조작 가이드</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">WASD</span>
                <span>전후좌우 이동</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">마우스 이동</span>
                <span>1인칭 시점 회전</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">Space</span>
                <span>점프 / (비행 시) 위로 상승</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">F 키 / Space 더블탭</span>
                <span>비행 모드 토글 (공중 부양)</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">Shift</span>
                <span>달리기 / (비행 시) 아래로 하강</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">마우스 좌클릭</span>
                <span>블록 파괴 / 도끼·칼 휘두르기 / 동물 타격</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">마우스 우클릭</span>
                <span>블록 설치 / 동물 소환(알) / 먹이 주기 / 음식 섭취</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">숫자 1~9 / 휠</span>
                <span>도구·알·블록 퀵슬롯 교체</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">E 키</span>
                <span>전체 인벤토리 열기</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">Enter 키</span>
                <span>채팅 입력창 토글</span>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg border border-neutral-800">
                <span className="text-amber-400 font-bold block mb-0.5">ESC 키</span>
                <span>마우스 잠금 해제</span>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 5. Click-to-Play Overlay Banner if mouse is not locked */}
      {!isLocked && (
        <div
          onClick={onRequestLock}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-20 cursor-pointer pointer-events-auto bg-black/75 hover:bg-black/90 text-white px-5 py-2.5 rounded-2xl border border-amber-400/50 shadow-2xl backdrop-blur-md text-xs font-mono flex items-center gap-2 animate-bounce transition-all"
        >
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>화면을 클릭하여 1인칭 마우스 시점을 활성화하세요</span>
        </div>
      )}
    </>
  );
};
