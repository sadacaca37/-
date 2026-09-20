import React, { useState, useEffect } from "react";
import { Hammer, BookOpen, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { BlockType, BLOCK_DEFINITIONS } from "../types";
import { findMatchingRecipe, CRAFTING_RECIPES } from "../game/Recipes";
import { soundFx } from "../game/SoundEffects";

interface CraftingGridProps {
  dim?: 2 | 3;
  onCraftItem: (blockType: BlockType, count: number) => void;
  icons: Record<BlockType, string>;
  playerInventory?: Array<{ id: number; count: number }>;
}

export const CraftingGrid: React.FC<CraftingGridProps> = ({
  dim: initialDim = 3,
  onCraftItem,
  icons,
}) => {
  const [dim, setDim] = useState<2 | 3>(initialDim);
  const [grid, setGrid] = useState<(BlockType | null)[]>(new Array(initialDim * initialDim).fill(null));
  const [showRecipeBook, setShowRecipeBook] = useState(false);

  // Resize grid when dimension changes
  useEffect(() => {
    setGrid(new Array(dim * dim).fill(null));
  }, [dim]);

  // Check matching recipe
  const match = findMatchingRecipe(grid, dim);

  const handleCellClick = (idx: number) => {
    // If cell has item, remove it
    if (grid[idx] !== null) {
      const next = [...grid];
      next[idx] = null;
      setGrid(next);
      soundFx.playSwitchSlot();
    }
  };

  const handleTakeResult = () => {
    if (!match) return;

    soundFx.playCraft();
    onCraftItem(match.result.blockType, match.result.count);

    // Consume 1 from each occupied cell
    const next = [...grid];
    for (let i = 0; i < next.length; i++) {
      if (next[i] !== null && next[i] !== BlockType.AIR) {
        next[i] = null; // consume 1
      }
    }
    setGrid(next);
  };

  const handleQuickFill = (recipe: typeof CRAFTING_RECIPES[0]) => {
    soundFx.playSwitchSlot();
    const newGrid: (BlockType | null)[] = new Array(dim * dim).fill(null);

    if (recipe.shapeless) {
      recipe.shapeless.forEach((item, i) => {
        if (i < newGrid.length) newGrid[i] = item;
      });
    } else if (recipe.pattern && recipe.key) {
      if (recipe.is3x3Only && dim < 3) {
        setDim(3);
        // Will apply after dim set
        setTimeout(() => handleQuickFill(recipe), 50);
        return;
      }
      const pat = recipe.pattern;
      for (let r = 0; r < pat.length; r++) {
        for (let c = 0; c < pat[r].length; c++) {
          const ch = pat[r][c];
          if (ch !== " " && recipe.key[ch]) {
            newGrid[r * dim + c] = recipe.key[ch];
          }
        }
      }
    }
    setGrid(newGrid);
  };

  const handleClear = () => {
    setGrid(new Array(dim * dim).fill(null));
    soundFx.playSwitchSlot();
  };

  return (
    <div className="flex flex-col gap-4 bg-stone-900/90 border border-stone-700/80 rounded-xl p-4 text-stone-100">
      {/* Header with Mode Toggle & Recipe Book Button */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Hammer className="text-amber-400" size={18} />
          <h3 className="font-bold text-sm text-stone-200">
            {dim === 3 ? "3x3 작업대 (Crafting Table)" : "2x2 기본 제작 (Survival Crafting)"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDim(dim === 2 ? 3 : 2)}
            className="px-2.5 py-1 text-xs font-semibold bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-md transition"
          >
            {dim === 2 ? "3x3 작업대로 전환" : "2x2 인벤토리로 전환"}
          </button>

          <button
            type="button"
            onClick={() => setShowRecipeBook(!showRecipeBook)}
            className={`p-1.5 rounded-md border text-xs flex items-center gap-1 transition ${
              showRecipeBook
                ? "bg-amber-600/30 border-amber-500 text-amber-300"
                : "bg-stone-800 border-stone-700 text-stone-300 hover:text-white"
            }`}
            title="레시피 도감 열기"
          >
            <BookOpen size={15} />
            레시피 도감
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-md border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition"
            title="그리드 비우기"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Crafting Workspace: Grid -> Arrow -> Result */}
      <div className="flex items-center justify-center gap-6 py-2">
        {/* Crafting Grid */}
        <div
          className="grid gap-1.5 p-2 bg-stone-950 border-2 border-stone-800 rounded-lg shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${dim}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((item, idx) => {
            const meta = item ? BLOCK_DEFINITIONS[item] : null;
            return (
              <div
                key={idx}
                onClick={() => handleCellClick(idx)}
                className="w-12 h-12 bg-stone-900 border-2 border-stone-700/80 rounded flex items-center justify-center cursor-pointer hover:border-amber-400/80 hover:bg-stone-800/80 transition relative select-none"
                title={meta ? `${meta.nameKo} (클릭하여 제거)` : "재료 슬롯"}
              >
                {item && icons[item] ? (
                  <img
                    src={icons[item]}
                    alt="item"
                    className="w-8 h-8 object-contain pointer-events-none drop-shadow"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-stone-800" />
                )}
              </div>
            );
          })}
        </div>

        {/* Crafting Arrow */}
        <div className="flex flex-col items-center text-stone-500">
          <ArrowRight size={24} className={match ? "text-amber-400 animate-pulse" : "text-stone-600"} />
        </div>

        {/* Result Slot */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            onClick={handleTakeResult}
            className={`w-16 h-16 rounded-xl flex items-center justify-center transition border-2 relative select-none ${
              match
                ? "bg-amber-950/40 border-amber-400 shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105 active:scale-95"
                : "bg-stone-950 border-stone-800 border-dashed cursor-not-allowed opacity-60"
            }`}
            title={match ? `${BLOCK_DEFINITIONS[match.result.blockType]?.nameKo} 클릭하여 제작하기` : "결과물 없음"}
          >
            {match && icons[match.result.blockType] ? (
              <>
                <img
                  src={icons[match.result.blockType]}
                  alt="result"
                  className="w-10 h-10 object-contain drop-shadow-md"
                  referrerPolicy="no-referrer"
                />
                {match.result.count > 1 && (
                  <span className="absolute bottom-1 right-1.5 bg-stone-900/90 text-amber-300 text-xs font-mono font-bold px-1 rounded shadow">
                    x{match.result.count}
                  </span>
                )}
                <Sparkles size={12} className="absolute top-1 right-1 text-amber-300" />
              </>
            ) : (
              <span className="text-xs text-stone-600 font-mono">Empty</span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-stone-400 text-center max-w-[80px] truncate">
            {match ? BLOCK_DEFINITIONS[match.result.blockType]?.nameKo : "제작 결과"}
          </span>
        </div>
      </div>

      {/* Recipe Book Drawer */}
      {showRecipeBook && (
        <div className="mt-1 bg-stone-950 border border-stone-800 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
          <div className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
            <BookOpen size={13} />
            조합 레시피 목록 (클릭 시 자동 채우기)
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CRAFTING_RECIPES.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => handleQuickFill(rec)}
                className="flex items-center gap-2 p-1.5 rounded bg-stone-900 hover:bg-amber-950/40 border border-stone-800 hover:border-amber-600/50 text-left transition group"
              >
                {icons[rec.result.blockType] && (
                  <img
                    src={icons[rec.result.blockType]}
                    alt=""
                    className="w-6 h-6 object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-stone-200 group-hover:text-amber-300 truncate">
                    {rec.nameKo}
                  </div>
                  <div className="text-[10px] text-stone-500">
                    {rec.is3x3Only ? "3x3 작업대 전용" : "2x2 / 3x3 제작 가능"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
