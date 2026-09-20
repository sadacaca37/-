import { BlockType, CraftingRecipe } from "../types";

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  // 1. Oak Wood -> 4 Planks
  {
    id: "wood_to_planks",
    name: "Oak Planks",
    nameKo: "참나무 판자 (4개)",
    shapeless: [BlockType.WOOD],
    result: { blockType: BlockType.PLANK, count: 4 },
  },
  // 2. 4 Planks (2x2) -> Crafting Table
  {
    id: "planks_to_crafting_table",
    name: "Crafting Table",
    nameKo: "제작대 (조합대)",
    pattern: ["PP", "PP"],
    key: { P: BlockType.PLANK },
    result: { blockType: BlockType.CRAFTING_TABLE, count: 1 },
  },
  // 3. 2 Planks (vertically stacked) -> 4 Sticks
  {
    id: "planks_to_sticks",
    name: "Sticks",
    nameKo: "막대기 (4개)",
    pattern: ["P", "P"],
    key: { P: BlockType.PLANK },
    result: { blockType: BlockType.STICK, count: 4 },
  },
  // 4. Wooden Sword: 2 Planks on top of 1 Stick
  {
    id: "wooden_sword",
    name: "Wooden Sword",
    nameKo: "나무 검",
    pattern: ["P", "P", "S"],
    key: { P: BlockType.PLANK, S: BlockType.STICK },
    result: { blockType: BlockType.WOODEN_SWORD, count: 1 },
  },
  // 5. Wooden Pickaxe (3x3 only): 3 Planks top, 2 Sticks center
  {
    id: "wooden_pickaxe",
    name: "Wooden Pickaxe",
    nameKo: "나무 곡괭이",
    is3x3Only: true,
    pattern: ["PPP", " S ", " S "],
    key: { P: BlockType.PLANK, S: BlockType.STICK },
    result: { blockType: BlockType.WOODEN_PICKAXE, count: 1 },
  },
  // 6. Wooden Axe: 3 Planks, 2 Sticks
  {
    id: "wooden_axe",
    name: "Wooden Axe",
    nameKo: "나무 도끼",
    is3x3Only: true,
    pattern: ["PP ", "PS ", " S "],
    key: { P: BlockType.PLANK, S: BlockType.STICK },
    result: { blockType: BlockType.WOODEN_AXE, count: 1 },
  },
  // 7. Diamond Sword: 2 Diamonds on top of 1 Stick
  {
    id: "diamond_sword",
    name: "Diamond Sword",
    nameKo: "다이아몬드 검",
    pattern: ["D", "D", "S"],
    key: { D: BlockType.DIAMOND, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_SWORD, count: 1 },
  },
  // Also allow Diamond Sword from Diamond Ore in simplified sandbox
  {
    id: "diamond_sword_alt",
    name: "Diamond Sword",
    nameKo: "다이아몬드 검",
    pattern: ["D", "D", "S"],
    key: { D: BlockType.DIAMOND_ORE, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_SWORD, count: 1 },
  },
  // 8. Diamond Pickaxe (3x3 only)
  {
    id: "diamond_pickaxe",
    name: "Diamond Pickaxe",
    nameKo: "다이아몬드 곡괭이",
    is3x3Only: true,
    pattern: ["DDD", " S ", " S "],
    key: { D: BlockType.DIAMOND, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_PICKAXE, count: 1 },
  },
  {
    id: "diamond_pickaxe_alt",
    name: "Diamond Pickaxe",
    nameKo: "다이아몬드 곡괭이",
    is3x3Only: true,
    pattern: ["DDD", " S ", " S "],
    key: { D: BlockType.DIAMOND_ORE, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_PICKAXE, count: 1 },
  },
  // 9. Diamond Axe (3x3 only)
  {
    id: "diamond_axe",
    name: "Diamond Axe",
    nameKo: "다이아몬드 도끼",
    is3x3Only: true,
    pattern: ["DD ", "DS ", " S "],
    key: { D: BlockType.DIAMOND, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_AXE, count: 1 },
  },
  {
    id: "diamond_axe_alt",
    name: "Diamond Axe",
    nameKo: "다이아몬드 도끼",
    is3x3Only: true,
    pattern: ["DD ", "DS ", " S "],
    key: { D: BlockType.DIAMOND_ORE, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_AXE, count: 1 },
  },
  // 10. Diamond Shovel: 1 Diamond, 2 Sticks
  {
    id: "diamond_shovel",
    name: "Diamond Shovel",
    nameKo: "다이아몬드 삽",
    pattern: ["D", "S", "S"],
    key: { D: BlockType.DIAMOND, S: BlockType.STICK },
    result: { blockType: BlockType.DIAMOND_SHOVEL, count: 1 },
  },
  // 11. Bread: 3 Wheat in horizontal row
  {
    id: "wheat_to_bread",
    name: "Bread",
    nameKo: "갓 구운 빵",
    pattern: ["WWW"],
    key: { W: BlockType.WHEAT },
    result: { blockType: BlockType.BREAD, count: 1 },
  },
  // 12. Golden Apple (3x3): 8 Gold Blocks surrounding 1 Apple or Bread
  {
    id: "golden_apple_recipe",
    name: "Golden Apple",
    nameKo: "황금 사과",
    is3x3Only: true,
    pattern: ["GGG", "GAG", "GGG"],
    key: { G: BlockType.GOLD_BLOCK, A: BlockType.BREAD },
    result: { blockType: BlockType.GOLDEN_APPLE, count: 1 },
  },
  // 13. Bookshelf (3x3): 6 Planks + 3 Sticks/etc
  {
    id: "bookshelf_recipe",
    name: "Bookshelf",
    nameKo: "책장",
    is3x3Only: true,
    pattern: ["PPP", "SSS", "PPP"],
    key: { P: BlockType.PLANK, S: BlockType.STICK },
    result: { blockType: BlockType.BOOKSHELF, count: 1 },
  },
  // 14. TNT: 4 Sand + 1 Slimeball/Flesh in X
  {
    id: "tnt_recipe",
    name: "TNT",
    nameKo: "TNT 폭탄",
    pattern: [" S ", "SFS", " S "],
    key: { S: BlockType.SAND, F: BlockType.ROTTEN_FLESH },
    result: { blockType: BlockType.TNT, count: 1 },
  },
  // 15. Torch: 1 Coal on top of 1 Stick -> 4 Torches
  {
    id: "torch_recipe",
    name: "Torch",
    nameKo: "횃불 (4개)",
    pattern: ["C", "S"],
    key: { C: BlockType.COAL, S: BlockType.STICK },
    result: { blockType: BlockType.TORCH, count: 4 },
  },
  // 16. Iron Sword: 2 Iron Ingots on top of 1 Stick
  {
    id: "iron_sword",
    name: "Iron Sword",
    nameKo: "철 검",
    pattern: ["I", "I", "S"],
    key: { I: BlockType.IRON_INGOT, S: BlockType.STICK },
    result: { blockType: BlockType.IRON_SWORD, count: 1 },
  },
  // 17. Iron Pickaxe (3x3 only): 3 Iron Ingots, 2 Sticks
  {
    id: "iron_pickaxe",
    name: "Iron Pickaxe",
    nameKo: "철 곡괭이",
    is3x3Only: true,
    pattern: ["III", " S ", " S "],
    key: { I: BlockType.IRON_INGOT, S: BlockType.STICK },
    result: { blockType: BlockType.IRON_PICKAXE, count: 1 },
  },
  // 18. Iron Axe (3x3 only): 3 Iron Ingots, 2 Sticks
  {
    id: "iron_axe",
    name: "Iron Axe",
    nameKo: "철 도끼",
    is3x3Only: true,
    pattern: ["II ", "IS ", " S "],
    key: { I: BlockType.IRON_INGOT, S: BlockType.STICK },
    result: { blockType: BlockType.IRON_AXE, count: 1 },
  },
  // 19. Iron Shovel: 1 Iron Ingot, 2 Sticks
  {
    id: "iron_shovel",
    name: "Iron Shovel",
    nameKo: "철 삽",
    pattern: ["I", "S", "S"],
    key: { I: BlockType.IRON_INGOT, S: BlockType.STICK },
    result: { blockType: BlockType.IRON_SHOVEL, count: 1 },
  },
  // 20. Wooden Shovel: 1 Plank, 2 Sticks
  {
    id: "wooden_shovel",
    name: "Wooden Shovel",
    nameKo: "나무 삽",
    pattern: ["P", "S", "S"],
    key: { P: BlockType.PLANK, S: BlockType.STICK },
    result: { blockType: BlockType.WOODEN_SHOVEL, count: 1 },
  },
];

export interface RecipeRequirement {
  blockType: BlockType;
  count: number;
}

// Calculate the total item requirements for any recipe
export function getRecipeRequirements(recipe: CraftingRecipe): RecipeRequirement[] {
  const counts = new Map<BlockType, number>();

  if (recipe.shapeless) {
    for (const b of recipe.shapeless) {
      counts.set(b, (counts.get(b) || 0) + 1);
    }
  } else if (recipe.pattern && recipe.key) {
    for (const row of recipe.pattern) {
      for (const ch of row) {
        if (ch !== " " && recipe.key[ch] !== undefined) {
          const bt = recipe.key[ch];
          counts.set(bt, (counts.get(bt) || 0) + 1);
        }
      }
    }
  }

  return Array.from(counts.entries()).map(([blockType, count]) => ({ blockType, count }));
}

// Get all recipes that can currently be crafted from the given inventory slots
export function getAvailableQuickCrafts(
  inventory: Array<{ blockType: BlockType; count: number } | null>,
  isCraftingTableOpen: boolean
): Array<{ recipe: CraftingRecipe; canCraft: boolean; requirements: RecipeRequirement[] }> {
  // Tally all inventory items
  const totalStock = new Map<BlockType, number>();
  for (const slot of inventory) {
    if (slot && slot.blockType !== BlockType.AIR && slot.count > 0) {
      totalStock.set(slot.blockType, (totalStock.get(slot.blockType) || 0) + slot.count);
    }
  }

  const results: Array<{ recipe: CraftingRecipe; canCraft: boolean; requirements: RecipeRequirement[] }> = [];

  for (const recipe of CRAFTING_RECIPES) {
    if (recipe.is3x3Only && !isCraftingTableOpen) continue;

    const reqs = getRecipeRequirements(recipe);
    if (reqs.length === 0) continue;

    let canCraft = true;
    for (const req of reqs) {
      const held = totalStock.get(req.blockType) || 0;
      if (held < req.count) {
        canCraft = false;
        break;
      }
    }

    results.push({ recipe, canCraft, requirements: reqs });
  }

  return results;
}

export function findMatchingRecipe(
  grid: (BlockType | null)[],
  dim: 2 | 3
): { recipe: CraftingRecipe; result: { blockType: BlockType; count: number } } | null {
  // Extract non-null items in grid
  const items = grid.filter((item): item is BlockType => item !== null && item !== BlockType.AIR);
  if (items.length === 0) return null;

  // 1. Check Shapeless Recipes
  for (const r of CRAFTING_RECIPES) {
    if (r.shapeless) {
      if (r.is3x3Only && dim < 3) continue;
      if (items.length === r.shapeless.length) {
        const sortedGrid = [...items].sort();
        const sortedRecipe = [...r.shapeless].sort();
        const match = sortedGrid.every((val, idx) => val === sortedRecipe[idx]);
        if (match) {
          return { recipe: r, result: r.result };
        }
      }
    }
  }

  // 2. Check Patterned Recipes
  // Calculate bounding box of non-empty cells in the grid
  let minR: number = dim;
  let maxR: number = -1;
  let minC: number = dim;
  let maxC: number = -1;
  for (let r = 0; r < dim; r++) {
    for (let c = 0; c < dim; c++) {
      const idx = r * dim + c;
      const b = grid[idx];
      if (b !== null && b !== BlockType.AIR) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  if (maxR === -1) return null; // empty

  const subH = maxR - minR + 1;
  const subW = maxC - minC + 1;

  for (const r of CRAFTING_RECIPES) {
    if (!r.pattern || !r.key) continue;
    if (r.is3x3Only && dim < 3) continue;

    const patH = r.pattern.length;
    const patW = r.pattern[0].length;

    if (patH !== subH || patW !== subW) continue;

    let matched = true;
    for (let pr = 0; pr < patH; pr++) {
      for (let pc = 0; pc < patW; pc++) {
        const char = r.pattern[pr][pc];
        const gridIdx = (minR + pr) * dim + (minC + pc);
        const actualBlock = grid[gridIdx];

        if (char === " ") {
          if (actualBlock !== null && actualBlock !== BlockType.AIR) {
            matched = false;
            break;
          }
        } else {
          const expectedBlock = r.key[char];
          if (actualBlock !== expectedBlock) {
            matched = false;
            break;
          }
        }
      }
      if (!matched) break;
    }

    if (matched) {
      return { recipe: r, result: r.result };
    }
  }

  return null;
}
