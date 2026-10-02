import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CHARACTER_PRESETS, CharacterPreset, GameMode } from "../types";
import { drawCharacterPreview } from "../game/CharacterSkin";

interface CharacterSelectProps {
  onSelect: (characterId: number, gameMode: GameMode) => void;
  initialSelected?: number | null;
  initialMode?: GameMode;
}

// Full-screen character-select step shown before the Lobby. Players pick
// 1 of 4 preset "skins" here; that choice is what makes them visually
// distinguishable to other players in multiplayer (previously everyone
// looked like the same generic avatar and only the floating nickname
// differed, which read as "다른 사람들은 이름만 보이고 캐릭터가 안 보임").
export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect, initialSelected = null, initialMode = "creative" }) => {
  const [picked, setPicked] = useState<number | null>(initialSelected);
  const [mode, setMode] = useState<GameMode>(initialMode);

  const handleConfirm = () => {
    if (picked === null) return;
    onSelect(picked, mode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/90 backdrop-blur-sm px-4">
      <div className="w-[min(92vw,640px)] rounded-2xl border border-amber-500/30 bg-stone-900/95 p-6 shadow-2xl">
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-amber-300">캐릭터 선택</h2>
        <p className="mt-1 text-center text-sm text-stone-400">
          함께 플레이할 때 다른 플레이어에게 보여질 캐릭터를 골라주세요.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CHARACTER_PRESETS.map((preset) => {
            const isPicked = picked === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setPicked(preset.id)}
                className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-all ${
                  isPicked
                    ? "scale-[1.03] border-amber-400 bg-amber-500/10"
                    : "border-stone-700 bg-stone-800/60 hover:border-amber-500/50"
                }`}
              >
                {isPicked && (
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-stone-900">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
                <CharacterPreview preset={preset} />
                <span className="text-sm font-bold text-stone-100">
                  {preset.emoji} {preset.nameKo}
                </span>
              </button>
            );
          })}
        </div>

        {/* Game mode: creative (fly, infinite items) vs survival (hunger, no flying, death) */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-stone-400">게임 모드</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("creative")}
              className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                mode === "creative" ? "border-sky-400 bg-sky-500/10" : "border-stone-700 bg-stone-800/60 hover:border-sky-500/50"
              }`}
            >
              <div className="text-sm font-extrabold text-stone-100">🪽 크리에이티브</div>
              <div className="mt-1 text-[11px] leading-snug text-stone-400">자유롭게 날고(F) 아이템 무제한. 집 짓기와 구경에 좋아요.</div>
            </button>
            <button
              type="button"
              onClick={() => setMode("survival")}
              className={`rounded-xl border-2 px-3 py-3 text-left transition ${
                mode === "survival" ? "border-red-400 bg-red-500/10" : "border-stone-700 bg-stone-800/60 hover:border-red-500/50"
              }`}
            >
              <div className="text-sm font-extrabold text-stone-100">⚔️ 서바이벌</div>
              <div className="mt-1 text-[11px] leading-snug text-stone-400">비행 불가, 배고픔 게이지, 몬스터와 폭발에 죽으면 리스폰. 폭탄은 1회용.</div>
            </button>
          </div>
          <p className="mt-2 text-[11px] text-stone-500">멀티플레이에서는 방을 만든 사람의 모드가 모두에게 적용돼요.</p>
        </div>

        <button
          type="button"
          disabled={picked === null}
          onClick={handleConfirm}
          className="mt-6 w-full rounded-xl bg-amber-500 py-3 text-base font-extrabold text-stone-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {picked === null ? "캐릭터를 선택해주세요" : "이 캐릭터로 입장하기"}
        </button>
      </div>
    </div>
  );
};

// Pixel-art front view drawn from the exact same skin painter the in-game
// 3D model uses (CharacterSkin.ts), so what you pick is what others see.
const CharacterPreview: React.FC<{ preset: CharacterPreset }> = ({ preset }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) drawCharacterPreview(ref.current, preset, preset.shirtColor, 5);
  }, [preset]);
  return (
    <canvas
      ref={ref}
      className="h-40 w-20"
      style={{ imageRendering: "pixelated" }}
      aria-label={preset.nameKo}
    />
  );
};
