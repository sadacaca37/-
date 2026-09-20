import React from "react";
import { BlockType, BLOCK_DEFINITIONS } from "../types";

interface HotbarProps {
  activeSlot: number;
  hotbarBlocks: BlockType[];
  icons: Record<BlockType, string>;
  onSelectSlot: (slotIndex: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({
  activeSlot,
  hotbarBlocks,
  icons,
  onSelectSlot,
}) => {
  const activeMeta = BLOCK_DEFINITIONS[hotbarBlocks[activeSlot] || BlockType.GRASS];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto select-none z-30">
      {/* Selected Block Name Banner */}
      <div className="bg-neutral-900/85 backdrop-blur-md px-4 py-1 rounded-md border border-neutral-700/60 shadow-lg text-white text-xs font-mono tracking-wide transition-all">
        <span className="text-amber-400 font-semibold mr-1.5">[{activeSlot + 1}]</span>
        <span>{activeMeta.nameKo}</span>
        <span className="text-neutral-400 text-[11px] ml-1.5">({activeMeta.name})</span>
      </div>

      {/* 9 Hotbar Slots */}
      <div className="flex items-center bg-neutral-900/90 p-1.5 rounded-xl border-2 border-neutral-700/80 shadow-2xl backdrop-blur-md gap-1.5">
        {hotbarBlocks.map((blockType, idx) => {
          const isActive = idx === activeSlot;
          const meta = BLOCK_DEFINITIONS[blockType] || BLOCK_DEFINITIONS[BlockType.GRASS];
          const iconUrl = icons[blockType];

          return (
            <button
              key={idx}
              id={`hotbar-slot-${idx + 1}`}
              onClick={() => onSelectSlot(idx)}
              title={`${idx + 1}: ${meta.nameKo} (${meta.name})`}
              className={`relative w-12 h-12 md:w-13 md:h-13 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-neutral-700/90 border-2 border-amber-400 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.6)] z-10"
                  : "bg-neutral-800/80 border border-neutral-700 hover:bg-neutral-750 hover:border-neutral-500"
              }`}
            >
              {/* Slot Number Badge */}
              <span
                className={`absolute top-0.5 left-1 text-[10px] font-mono font-bold leading-none ${
                  isActive ? "text-amber-300" : "text-neutral-400"
                }`}
              >
                {idx + 1}
              </span>

              {/* Block Texture Icon */}
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={meta.name}
                  className="w-8 h-8 md:w-9 md:h-9 image-rendering-pixelated drop-shadow-md pointer-events-none"
                  style={{ imageRendering: "pixelated" }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded border border-black/30 shadow-inner"
                  style={{ backgroundColor: meta.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
