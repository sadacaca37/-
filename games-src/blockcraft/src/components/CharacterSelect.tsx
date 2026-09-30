import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CHARACTER_PRESETS, CharacterPreset } from "../types";
import { drawCharacterPreview } from "../game/CharacterSkin";

interface CharacterSelectProps {
  onSelect: (characterId: number) => void;
  initialSelected?: number | null;
}

// Full-screen character-select step shown before the Lobby. Players pick
// 1 of 4 preset "skins" here; that choice is what makes them visually
// distinguishable to other players in multiplayer (previously everyone
// looked like the same generic avatar and only the floating nickname
// differed, which read as "다른 사람들은 이름만 보이고 캐릭터가 안 보임").
export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect, initialSelected = null }) => {
  const [picked, setPicked] = useState<number | null>(initialSelected);

  const handleConfirm = () => {
    if (picked === null) return;
    onSelect(picked);
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
