import React from "react";
import { BlockType, BLOCK_DEFINITIONS } from "../types";

interface HotbarProps {
  activeSlot: number;
  hotbarBlocks: BlockType[];
  icons: Record<BlockType, string>;
  onSelectSlot: (slotIndex: number) => void;
  enchantedSlots?: Set<number>;
  counts?: Record<number, number>; // survival: item counts by block type
  offhandBlock?: BlockType; // left hand item (F to swap)
}

export const Hotbar: React.FC<HotbarProps> = ({
  activeSlot,
  hotbarBlocks,
  icons,
  onSelectSlot,
  enchantedSlots,
  counts,
  offhandBlock = BlockType.AIR,
}) => {
  const activeBlock = hotbarBlocks[activeSlot] ?? BlockType.AIR;
  const activeMeta = activeBlock === BlockType.AIR
    ? { nameKo: "빈 손", name: "Empty hand" }
    : BLOCK_DEFINITIONS[activeBlock];
  const offMeta = offhandBlock !== BlockType.AIR ? BLOCK_DEFINITIONS[offhandBlock] : null;

  return (
    <div className="relative flex flex-col items-center gap-2 pointer-events-auto select-none z-30">
      {/* Selected Block Name Banner */}
      <div className="bg-neutral-900/85 backdrop-blur-md px-4 py-1 rounded-md border border-neutral-700/60 shadow-lg text-white text-xs font-mono tracking-wide transition-all">
        <span className="text-amber-400 font-semibold mr-1.5">[{activeSlot + 1}]</span>
        <span>{activeMeta.nameKo}</span>
        <span className="text-neutral-400 text-[11px] ml-1.5">({activeMeta.name})</span>
      </div>

      <div className="flex items-end gap-2">
      {/* Off-hand slot (left hand) */}
      <div
        title={offMeta ? `왼손: ${offMeta.nameKo} (F로 바꾸기)` : "왼손 비어 있음 (F로 아이템 바꾸기)"}
        className="relative w-12 h-12 rounded-lg flex items-center justify-center bg-neutral-900/90 border-2 border-dashed border-neutral-600/80 shadow-xl backdrop-blur-md"
      >
        <span className="absolute top-0.5 left-1 text-[9px] font-mono font-bold text-neutral-400">F</span>
        {offMeta && icons[offhandBlock] ? (
          <img src={icons[offhandBlock]} alt={offMeta.name} className="w-8 h-8 pointer-events-none" style={{ imageRendering: "pixelated" }} />
        ) : (
          <span className="text-neutral-600 text-lg">🤚</span>
        )}
        {counts && offMeta && (counts[offhandBlock] ?? 0) > 1 && (
          <span className="absolute bottom-0.5 right-1 text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">{counts[offhandBlock]}</span>
        )}
      </div>

      {/* 9 Hotbar Slots */}
      <div className="flex items-center bg-neutral-900/90 p-1.5 rounded-xl border-2 border-neutral-700/80 shadow-2xl backdrop-blur-md gap-1.5">
        {hotbarBlocks.map((blockType, idx) => {
          const isActive = idx === activeSlot;
          const meta = BLOCK_DEFINITIONS[blockType] || BLOCK_DEFINITIONS[BlockType.GRASS];
          const iconUrl = icons[blockType];
          const isEnchanted = enchantedSlots?.has(idx) ?? false;
          const count = counts && blockType !== BlockType.AIR ? counts[blockType] ?? 0 : 0;

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
              {isEnchanted && (
                <>
                  <span className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_0_10px_rgba(167,139,250,0.9)]" />
                  <span className="absolute -top-1 -right-1 text-[11px] text-violet-300 drop-shadow">✦</span>
                </>
              )}
              {counts && count > 1 && (
                <span className="absolute bottom-0.5 right-1 text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                  {count}
                </span>
              )}
              {/* Slot Number Badge */}
              <span
                className={`absolute top-0.5 left-1 text-[10px] font-mono font-bold leading-none ${
                  isActive ? "text-amber-300" : "text-neutral-400"
                }`}
              >
                {idx + 1}
              </span>

              {/* Block Texture Icon (empty slot shows nothing) */}
              {blockType === BlockType.AIR ? null : iconUrl ? (
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
    </div>
  );
};
