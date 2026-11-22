import React, { useMemo, useState } from "react";
import { X, Sparkles, Gem } from "lucide-react";
import { BlockType, BLOCK_DEFINITIONS, ENCHANTMENTS, EnchantTarget, EnchantType, GameMode, SlotEnchantments } from "../types";

interface EnchantModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotbarBlocks: BlockType[];
  icons: Record<BlockType, string>;
  enchantments: Record<number, SlotEnchantments>;
  gameMode: GameMode;
  // How many diamonds the player holds (survival cost: 1 per level)
  diamondCount: number;
  onEnchant: (slotIndex: number, id: EnchantType, level: number) => void;
}

function canApply(block: BlockType, appliesTo: EnchantTarget[]): boolean {
  const meta = BLOCK_DEFINITIONS[block];
  if (!meta?.toolStats) return false;
  const t = meta.toolStats.toolType as string;
  return appliesTo.includes(t as EnchantTarget);
}

export const EnchantModal: React.FC<EnchantModalProps> = ({
  isOpen,
  onClose,
  hotbarBlocks,
  icons,
  enchantments,
  gameMode,
  diamondCount,
  onEnchant,
}) => {
  const [slot, setSlot] = useState<number | null>(null);

  const toolSlots = useMemo(
    () => hotbarBlocks.map((b, i) => ({ b, i })).filter(({ b }) => !!BLOCK_DEFINITIONS[b]?.toolStats),
    [hotbarBlocks]
  );

  if (!isOpen) return null;

  const activeSlot = slot !== null && BLOCK_DEFINITIONS[hotbarBlocks[slot]]?.toolStats ? slot : toolSlots[0]?.i ?? null;
  const activeBlock = activeSlot !== null ? hotbarBlocks[activeSlot] : null;
  const current: SlotEnchantments = activeSlot !== null ? enchantments[activeSlot] ?? {} : {};
  const isSurvival = gameMode === "survival";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-[min(94vw,680px)] rounded-2xl border border-violet-500/40 bg-stone-950/95 p-5 shadow-[0_0_40px_rgba(124,58,237,0.35)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/30 text-violet-300">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-violet-200">마법 부여대</h2>
              <p className="text-xs text-stone-400">
                {isSurvival ? (
                  <>
                    레벨당 <Gem size={11} className="inline -mt-0.5 text-cyan-300" /> 다이아몬드 1개 · 보유{" "}
                    <span className="font-bold text-cyan-300">{diamondCount}</span>개
                  </>
                ) : (
                  "크리에이티브: 무료로 부여"
                )}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:bg-stone-700">
            <X size={16} />
          </button>
        </div>

        {toolSlots.length === 0 ? (
          <div className="mt-6 rounded-xl border border-stone-700 bg-stone-900/60 p-6 text-center text-sm text-stone-400">
            퀵슬롯에 검이나 도구가 없어요. 인벤토리(E)에서 검·곡괭이·도끼·삽을 퀵슬롯에 넣고 다시 오세요.
          </div>
        ) : (
          <>
            {/* Tool picker */}
            <p className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">마법을 부여할 아이템</p>
            <div className="flex flex-wrap gap-2">
              {toolSlots.map(({ b, i }) => {
                const meta = BLOCK_DEFINITIONS[b];
                const has = Object.keys(enchantments[i] ?? {}).length > 0;
                const active = i === activeSlot;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSlot(i)}
                    className={`relative flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                      active ? "border-violet-400 bg-violet-500/15 text-violet-100" : "border-stone-700 bg-stone-900/70 text-stone-300 hover:border-violet-500/50"
                    }`}
                  >
                    <span className="text-[10px] text-stone-500">[{i + 1}]</span>
                    {icons[b] && <img src={icons[b]} alt="" className="h-6 w-6" style={{ imageRendering: "pixelated" }} />}
                    {meta.nameKo}
                    {has && <span className="text-violet-300">✦</span>}
                  </button>
                );
              })}
            </div>

            {/* Enchantment list */}
            {activeBlock !== null && activeSlot !== null && (
              <div className="mt-4 grid max-h-[52vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {[...ENCHANTMENTS]
                  .map((e, i) => ({ e, i, ok: canApply(activeBlock, e.appliesTo) }))
                  .sort((a, b) => Number(b.ok) - Number(a.ok) || a.i - b.i)
                  .map(({ e, ok: applicable }) => {
                  const lvl = current[e.id] ?? 0;
                  const nextLvl = lvl + 1;
                  const maxed = lvl >= e.maxLevel;
                  const cost = isSurvival ? nextLvl : 0;
                  const affordable = !isSurvival || diamondCount >= cost;
                  const disabled = !applicable || maxed || !affordable;
                  return (
                    <div
                      key={e.id}
                      className={`rounded-xl border p-3 ${
                        applicable ? (e.curse ? "border-red-900/70 bg-red-950/30" : "border-stone-700 bg-stone-900/70") : "border-stone-800 bg-stone-950/40 opacity-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-extrabold text-stone-100">
                            {e.nameKo}{" "}
                            <span className="text-xs font-bold text-violet-300">{lvl > 0 ? ["I", "II", "III", "IV", "V"][Math.min(lvl, 5) - 1] : ""}</span>
                            {e.curse && <span className="ml-1 text-[10px] font-bold text-red-400">저주</span>}
                            {!applicable && <span className="ml-1 text-[10px] text-stone-500">({e.appliesTo.filter((t) => !["sword", "pickaxe", "axe", "shovel", "shield"].includes(t)).length > 0 ? "아직 없는 장비용" : "이 아이템엔 불가"})</span>}
                          </div>
                          <div className="text-[11px] text-stone-400">{e.description}</div>
                        </div>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => onEnchant(activeSlot, e.id, nextLvl)}
                          className="shrink-0 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-extrabold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-stone-700 disabled:text-stone-400"
                        >
                          {!applicable ? "불가" : maxed ? "최대" : isSurvival ? `부여 (💎${cost})` : "부여"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
