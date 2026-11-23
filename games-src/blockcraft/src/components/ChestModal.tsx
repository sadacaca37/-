import React from "react";
import { X, Package, ArrowLeftRight } from "lucide-react";
import { BlockType, BLOCK_DEFINITIONS } from "../types";

export type ItemCounts = Record<number, number>;

interface ChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  icons: Record<BlockType, string>;
  chestItems: ItemCounts; // what's inside this chest
  playerItems: ItemCounts; // what the player can put in (survival: counts; creative: hotbar items)
  unlimited: boolean; // creative: player items never run out
  onStore: (type: BlockType, count: number) => void; // player -> chest
  onTake: (type: BlockType, count: number) => void; // chest -> player
}

const ItemGrid: React.FC<{
  items: Record<number, number>;
  icons: Record<BlockType, string>;
  infinite?: boolean;
  empty: string;
  onClick: (type: BlockType, all: boolean) => void;
}> = ({ items, icons, infinite, empty, onClick }) => {
  const entries = Object.entries(items).filter(([, c]) => c > 0).map(([t, c]) => [Number(t) as BlockType, c] as const);
  if (entries.length === 0) {
    return <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-stone-700 text-xs text-stone-500">{empty}</div>;
  }
  return (
    <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-stone-800 bg-stone-950/70 p-2.5 sm:grid-cols-5">
      {entries.map(([type, count]) => {
        const meta = BLOCK_DEFINITIONS[type];
        return (
          <button
            key={type}
            type="button"
            title={`${meta?.nameKo ?? type} — 클릭: 1개 옮기기 / Shift+클릭: 전부`}
            onClick={(e) => onClick(type, e.shiftKey)}
            className="relative flex aspect-square flex-col items-center justify-center rounded-lg border border-stone-700 bg-stone-900 p-1 transition hover:border-amber-500/60 hover:bg-stone-800"
          >
            {icons[type] ? (
              <img src={icons[type]} alt={meta?.name} className="h-8 w-8" style={{ imageRendering: "pixelated" }} />
            ) : (
              <div className="h-6 w-6 rounded" style={{ backgroundColor: meta?.color }} />
            )}
            <span className="mt-0.5 w-full truncate text-center text-[9px] text-stone-300">{meta?.nameKo}</span>
            <span className="absolute bottom-0.5 right-1 rounded bg-black/70 px-1 text-[10px] font-bold text-amber-200">{infinite ? "∞" : `x${count}`}</span>
          </button>
        );
      })}
    </div>
  );
};

export const ChestModal: React.FC<ChestModalProps> = ({ isOpen, onClose, icons, chestItems, playerItems, unlimited, onStore, onTake }) => {
  const myItems = playerItems;
  const creative = unlimited;
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-[min(94vw,720px)] rounded-2xl border border-amber-700/50 bg-stone-950/95 p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-700/30 text-amber-300">
              <Package size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-amber-200">상자</h2>
              <p className="text-xs text-stone-400">클릭하면 1개, Shift+클릭하면 전부 옮겨요. {creative ? "크리에이티브: 내 아이템은 무제한." : ""}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:bg-stone-700">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">상자 안 ({Object.values(chestItems).reduce((a, b) => a + b, 0)}개)</p>
            <ItemGrid items={chestItems} icons={icons} empty="비어 있어요. 오른쪽에서 아이템을 눌러 넣으세요." onClick={(t, all) => onTake(t, all ? chestItems[t] ?? 0 : 1)} />
          </div>
          <div className="hidden items-center justify-center self-center text-stone-600 sm:flex">
            <ArrowLeftRight size={20} />
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-500">내 아이템</p>
            <ItemGrid items={myItems} icons={icons} infinite={creative} empty="가진 아이템이 없어요." onClick={(t, all) => onStore(t, creative ? (all ? 64 : 1) : all ? myItems[t] ?? 0 : 1)} />
          </div>
        </div>
      </div>
    </div>
  );
};
