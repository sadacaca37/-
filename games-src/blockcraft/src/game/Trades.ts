import { BlockType } from "../types";

// What each villager job will trade. "give" is what the player hands over,
// "get" is what they receive.
export interface TradeOffer {
  give: Array<{ type: BlockType; count: number }>;
  get: { type: BlockType; count: number };
}

export const VILLAGER_TRADES: Record<string, TradeOffer[]> = {
  농부: [
    { give: [{ type: BlockType.WHEAT, count: 3 }], get: { type: BlockType.BREAD, count: 2 } },
    { give: [{ type: BlockType.COAL, count: 1 }], get: { type: BlockType.WHEAT, count: 4 } },
    { give: [{ type: BlockType.BREAD, count: 6 }], get: { type: BlockType.GOLDEN_APPLE, count: 1 } },
  ],
  사서: [
    { give: [{ type: BlockType.PLANK, count: 6 }], get: { type: BlockType.BOOKSHELF, count: 1 } },
    { give: [{ type: BlockType.COBBLESTONE, count: 8 }], get: { type: BlockType.TORCH, count: 4 } },
    { give: [{ type: BlockType.DIAMOND, count: 2 }, { type: BlockType.OBSIDIAN, count: 4 }], get: { type: BlockType.ENCHANTING_TABLE, count: 1 } },
  ],
  대장장이: [
    { give: [{ type: BlockType.COBBLESTONE, count: 6 }], get: { type: BlockType.IRON_INGOT, count: 1 } },
    { give: [{ type: BlockType.IRON_INGOT, count: 3 }], get: { type: BlockType.BUCKET, count: 1 } },
    { give: [{ type: BlockType.IRON_INGOT, count: 3 }, { type: BlockType.STICK, count: 2 }], get: { type: BlockType.IRON_PICKAXE, count: 1 } },
    { give: [{ type: BlockType.IRON_INGOT, count: 2 }, { type: BlockType.STICK, count: 1 }], get: { type: BlockType.IRON_SWORD, count: 1 } },
    { give: [{ type: BlockType.IRON_INGOT, count: 6 }], get: { type: BlockType.SHIELD, count: 1 } },
  ],
  상인: [
    { give: [{ type: BlockType.COAL, count: 10 }], get: { type: BlockType.DIAMOND, count: 1 } },
    { give: [{ type: BlockType.DIAMOND, count: 1 }], get: { type: BlockType.GOLDEN_APPLE, count: 1 } },
    { give: [{ type: BlockType.WOOL_WHITE, count: 3 }, { type: BlockType.PLANK, count: 3 }], get: { type: BlockType.BED, count: 1 } },
    { give: [{ type: BlockType.GOLD_BLOCK, count: 1 }], get: { type: BlockType.FIREWORK, count: 3 } },
  ],
  어부: [
    { give: [{ type: BlockType.SAND, count: 6 }], get: { type: BlockType.GLASS, count: 4 } },
    { give: [{ type: BlockType.IRON_INGOT, count: 3 }], get: { type: BlockType.WATER_BUCKET, count: 1 } },
    { give: [{ type: BlockType.WOOD, count: 4 }], get: { type: BlockType.CHEST, count: 1 } },
    { give: [{ type: BlockType.BREAD, count: 2 }], get: { type: BlockType.STICK, count: 8 } },
  ],
};
