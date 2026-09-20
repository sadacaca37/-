import React, { useState, useEffect } from "react";
import { X, Sparkles, HelpCircle, Wrench, Egg, Box, Apple, Layers, Hammer } from "lucide-react";
import { BlockType, BLOCK_DEFINITIONS, ItemCategory } from "../types";
import { CraftingGrid } from "./CraftingGrid";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlot: number;
  hotbarBlocks: BlockType[];
  icons: Record<BlockType, string>;
  onAssignToSlot: (slotIndex: number, block: BlockType) => void;
  initialTab?: "all" | "crafting" | "tools" | "animals" | "blocks" | "items";
}

type TabType = "all" | "crafting" | "tools" | "animals" | "blocks" | "items";

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  activeSlot,
  hotbarBlocks,
  icons,
  onAssignToSlot,
  initialTab = "all",
}) => {
  const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setSelectedTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Categorized lists
  const toolsList = [
    BlockType.DIAMOND_SWORD,
    BlockType.DIAMOND_PICKAXE,
    BlockType.DIAMOND_AXE,
    BlockType.DIAMOND_SHOVEL,
    BlockType.WOODEN_SWORD,
    BlockType.WOODEN_PICKAXE,
    BlockType.WOODEN_AXE,
  ];

  const animalsList = [
    BlockType.DUCK_SPAWN_EGG,
    BlockType.CHICKEN_SPAWN_EGG,
    BlockType.SHEEP_SPAWN_EGG,
    BlockType.COW_SPAWN_EGG,
    BlockType.ZOMBIE_SPAWN_EGG,
    BlockType.SLIME_SPAWN_EGG,
  ];

  const blocksList = [
    BlockType.CRAFTING_TABLE,
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.STONE,
    BlockType.WOOD,
    BlockType.LEAVES,
    BlockType.PLANK,
    BlockType.BRICK,
    BlockType.GLASS,
    BlockType.COBBLESTONE,
    BlockType.SAND,
    BlockType.DIAMOND_ORE,
    BlockType.OBSIDIAN,
    BlockType.GOLD_BLOCK,
    BlockType.TNT,
    BlockType.BOOKSHELF,
    BlockType.GLOWSTONE,
    BlockType.SNOW,
  ];

  const itemsList = [
    BlockType.STICK,
    BlockType.ROTTEN_FLESH,
    BlockType.SLIME_BALL,
    BlockType.BONE,
    BlockType.DIAMOND,
    BlockType.BREAD,
    BlockType.GOLDEN_APPLE,
    BlockType.WHEAT,
  ];

  let displayItems: BlockType[] = [];
  if (selectedTab === "all") {
    displayItems = [...toolsList, ...animalsList, ...itemsList, ...blocksList];
  } else if (selectedTab === "tools") {
    displayItems = toolsList;
  } else if (selectedTab === "animals") {
    displayItems = animalsList;
  } else if (selectedTab === "blocks") {
    displayItems = blocksList;
  } else if (selectedTab === "items") {
    displayItems = itemsList;
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "all", label: "전체", icon: <Layers className="w-3.5 h-3.5" />, count: toolsList.length + animalsList.length + blocksList.length + itemsList.length },
    { id: "crafting", label: "조합/제작대", icon: <Hammer className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "tools", label: "도구/무기", icon: <Wrench className="w-3.5 h-3.5" />, count: toolsList.length },
    { id: "animals", label: "생명체 알", icon: <Egg className="w-3.5 h-3.5" />, count: animalsList.length },
    { id: "blocks", label: "건축 블록", icon: <Box className="w-3.5 h-3.5" />, count: blocksList.length },
    { id: "items", label: "드롭/소모품", icon: <Apple className="w-3.5 h-3.5" />, count: itemsList.length },
  ];

  const handleCraftedItem = (craftedBlock: BlockType, count: number) => {
    // Equip crafted item directly into current active slot!
    onAssignToSlot(activeSlot, craftedBlock);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border-2 border-neutral-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">블록 인벤토리 & 조합</h2>
              <p className="text-xs text-neutral-400 font-mono">
                아이템 보관함, 2x2/3x3 조합대, 좀비/슬라임 사냥 드롭 아이템
              </p>
            </div>
          </div>
          <button
            id="btn-close-inventory"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 px-6 pt-3 pb-1 border-b border-neutral-800/80 bg-neutral-950/40 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-inventory-${tab.id}`}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                selectedTab === tab.id
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold"
                  : "bg-neutral-800/50 border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedTab === tab.id ? "bg-amber-500/30 text-amber-200" : "bg-neutral-700/50 text-neutral-400"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {selectedTab === "crafting" ? (
            // Crafting Workspace
            <div>
              <CraftingGrid
                dim={3}
                onCraftItem={handleCraftedItem}
                icons={icons}
              />
              <p className="text-xs text-stone-400 text-center mt-2 font-mono">
                제작 완료 시 현재 선택된 퀵슬롯 [{activeSlot + 1}]에 자동으로 등록됩니다!
              </p>
            </div>
          ) : (
            // Palette Grid
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                  아이템 목록 ({displayItems.length})
                </h3>
                <span className="text-[11px] text-amber-400/90 font-mono">
                  클릭하여 퀵슬롯 [{activeSlot + 1}]에 등록
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5 bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800 max-h-56 overflow-y-auto">
                {displayItems.map((blockType) => {
                  const meta = BLOCK_DEFINITIONS[blockType] || BLOCK_DEFINITIONS[BlockType.GRASS];
                  const iconUrl = icons[blockType];
                  const isEquippedInHotbar = hotbarBlocks.includes(blockType);
                  const isSelectedInActiveSlot = hotbarBlocks[activeSlot] === blockType;

                  return (
                    <button
                      key={blockType}
                      id={`inv-block-${blockType}`}
                      onClick={() => {
                        onAssignToSlot(activeSlot, blockType);
                      }}
                      title={`${meta.nameKo} (${meta.name})\n${meta.description || ""}`}
                      className={`group relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isSelectedInActiveSlot
                          ? "bg-amber-950/40 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)] scale-105"
                          : "bg-neutral-900 border-neutral-700/80 hover:bg-neutral-800 hover:border-neutral-500"
                      }`}
                    >
                      {/* Item Icon */}
                      <div className="w-10 h-10 flex items-center justify-center mb-1">
                        {iconUrl ? (
                          <img
                            src={iconUrl}
                            alt={meta.name}
                            className="w-8 h-8 image-rendering-pixelated drop-shadow-md group-hover:scale-110 transition-transform"
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded border border-black/30"
                            style={{ backgroundColor: meta.color }}
                          />
                        )}
                      </div>

                      <span className="text-[10px] font-medium text-neutral-200 text-center truncate w-full">
                        {meta.nameKo}
                      </span>

                      {/* Badge if currently in hotbar */}
                      {isEquippedInHotbar && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center shadow">
                          ✓
                        </span>
                      )}

                      {/* Category indicator dot */}
                      {meta.category === ItemCategory.TOOL && (
                        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                      {meta.category === ItemCategory.SPAWN_EGG && (
                        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                      {meta.category === ItemCategory.FOOD && (
                        <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Current Hotbar Preview & Assignment */}
          <div className="border-t border-neutral-800/80 pt-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider font-mono">
                하단 퀵슬롯 [1~9] (클릭하여 슬롯 전환)
              </h3>
              <span className="text-[11px] text-neutral-400 font-mono">
                현재 선택: 슬롯 {activeSlot + 1}
              </span>
            </div>
            <div className="grid grid-cols-9 bg-neutral-950/70 p-2 rounded-xl border border-neutral-800 gap-1.5">
              {hotbarBlocks.map((bType, idx) => {
                const meta = BLOCK_DEFINITIONS[bType] || BLOCK_DEFINITIONS[BlockType.GRASS];
                const icon = icons[bType];
                const isActive = idx === activeSlot;

                return (
                  <button
                    key={idx}
                    id={`inv-hotbar-slot-${idx + 1}`}
                    onClick={() => {
                      onAssignToSlot(idx, bType);
                    }}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? "bg-neutral-800 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] scale-105 z-10"
                        : "bg-neutral-900 border border-neutral-700 hover:border-neutral-500"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-1 text-[9px] font-mono font-bold ${
                        isActive ? "text-amber-400" : "text-neutral-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {icon ? (
                      <img
                        src={icon}
                        alt={meta.name}
                        className="w-7 h-7 image-rendering-pixelated"
                        style={{ imageRendering: "pixelated" }}
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded"
                        style={{ backgroundColor: meta.color }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick instructions footer */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-950/50 px-3.5 py-2.5 rounded-lg border border-neutral-800/80 font-mono">
            <HelpCircle className="w-4 h-4 text-amber-400/90 shrink-0" />
            <span>
              <strong>전투 & 제작 팁:</strong> 칼/도끼로 몬스터(좀비, 슬라임)를 타격하면 데미지를 입히며, 처치 시 드롭되는 전리품(살점, 슬라임볼 등)에 다가가면 자동으로 획득됩니다!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
