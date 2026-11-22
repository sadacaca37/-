import { BlockType, BLOCK_DEFINITIONS, ToolMaterial } from "../types";

// What you get when you break a block in SURVIVAL mode, given the item in
// hand. Returns null when nothing drops (wrong tool, or the block simply
// shatters, like glass).

const MATERIAL_TIER: Record<ToolMaterial, number> = { wood: 1, iron: 2, diamond: 3 };

function pickaxeTier(held: BlockType): number {
  const ts = BLOCK_DEFINITIONS[held]?.toolStats;
  if (!ts || ts.toolType !== "pickaxe") return 0;
  return MATERIAL_TIER[ts.material] ?? 1;
}

export interface BlockDrop {
  type: BlockType;
  count: number;
}

export function getBlockDrop(block: BlockType, held: BlockType): BlockDrop | null {
  const tier = pickaxeTier(held);
  switch (block) {
    case BlockType.AIR:
    case BlockType.WATER:
      return null;
    // Ores: need a pickaxe; the better the ore the better the pick
    case BlockType.COAL_ORE:
      return tier >= 1 ? { type: BlockType.COAL, count: 1 + (Math.random() < 0.25 ? 1 : 0) } : null;
    case BlockType.IRON_ORE:
      return tier >= 1 ? { type: BlockType.IRON_INGOT, count: 1 } : null;
    case BlockType.DIAMOND_ORE:
      return tier >= 2 ? { type: BlockType.DIAMOND, count: 1 } : null;
    case BlockType.OBSIDIAN:
      return tier >= 3 ? { type: BlockType.OBSIDIAN, count: 1 } : null;
    // Stone-type blocks need any pickaxe
    case BlockType.STONE:
      return tier >= 1 ? { type: BlockType.COBBLESTONE, count: 1 } : null;
    case BlockType.DEEPSLATE:
    case BlockType.COBBLESTONE:
    case BlockType.STONE_BRICK:
    case BlockType.BRICK:
    case BlockType.GOLD_BLOCK:
    case BlockType.ANVIL:
    case BlockType.ENCHANTING_TABLE:
      return tier >= 1 ? { type: block, count: 1 } : null;
    // Soft blocks
    case BlockType.GRASS:
      return { type: BlockType.DIRT, count: 1 };
    case BlockType.LEAVES:
      return Math.random() < 0.12 ? { type: BlockType.STICK, count: 1 } : null;
    case BlockType.GLASS:
    case BlockType.WINDOW:
    case BlockType.BED_FOOT:
      return null; // shatters / second half of the bed
    case BlockType.GLOWSTONE:
      return { type: BlockType.GLOWSTONE, count: 1 };
    default:
      return { type: block, count: 1 };
  }
}
