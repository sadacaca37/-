import React from "react";
import { X, Handshake, ArrowRight } from "lucide-react";
import { BlockType, BLOCK_DEFINITIONS } from "../types";
import { TradeOffer } from "../game/Trades";
import { ItemCounts } from "./ChestModal";

interface TradeModalProps {
  isOpen: boolean;
  villagerName: string;
  offers: TradeOffer[];
  playerItems: ItemCounts;
  unlimited: boolean;
  icons: Record<BlockType, string>;
  onTrade: (offer: TradeOffer) => void;
  onClose: () => void;
}

const Item: React.FC<{ type: BlockType; count: number; icons: Record<BlockType, string>; dim?: boolean }> = ({ type, count, icons, dim }) => {
  const meta = BLOCK_DEFINITIONS[type];
  return (
    <div className={`flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-900 px-2 py-1 ${dim ? "opacity-50" : ""}`}>
      {icons[type] ? (
        <img src={icons[type]} alt={meta?.name} className="h-6 w-6" style={{ imageRendering: "pixelated" }} />
      ) : (
        <div className="h-5 w-5 rounded" style={{ backgroundColor: meta?.color }} />
      )}
      <span className="text-[11px] text-stone-200">{meta?.nameKo}</span>
      <span className="text-[11px] font-bold text-amber-200">x{count}</span>
    </div>
  );
};

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, villagerName, offers, playerItems, unlimited, icons, onTrade, onClose }) => {
  if (!isOpen) return null;
  const canAfford = (o: TradeOffer) => unlimited || o.give.every((g) => (playerItems[g.type] ?? 0) >= g.count);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-[min(94vw,640px)] rounded-2xl border border-emerald-700/50 bg-stone-950/95 p-5 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700/30 text-emerald-300">
              <Handshake size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-emerald-200">{villagerName}와(과) 거래</h2>
              <p className="text-xs text-stone-400">{unlimited ? "크리에이티브: 재료 없이도 거래할 수 있어요." : "왼쪽 재료를 주면 오른쪽 아이템을 받아요."}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:bg-stone-700">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
          {offers.map((o, i) => {
            const ok = canAfford(o);
            return (
              <button
                key={i}
                type="button"
                disabled={!ok}
                onClick={() => onTrade(o)}
                className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition ${
                  ok ? "border-stone-700 bg-stone-900/70 hover:border-emerald-500/70 hover:bg-stone-800" : "cursor-not-allowed border-stone-800 bg-stone-950/60"
                }`}
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  {o.give.map((g, j) => (
                    <Item key={j} type={g.type} count={g.count} icons={icons} dim={!unlimited && (playerItems[g.type] ?? 0) < g.count} />
                  ))}
                </div>
                <ArrowRight size={16} className={ok ? "text-emerald-400" : "text-stone-600"} />
                <Item type={o.get.type} count={o.get.count} icons={icons} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
