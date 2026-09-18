import { soundManager } from './sound';
import { getStoredTamagotchi, saveStoredTamagotchi } from './tamagotchiStorage';
import { typangSync } from './excelStudentManager';

const POINTS_STORAGE_KEY = 'taja_practice_points_wallet_v2';
const UNLOCKED_AVATAR_KEY = 'taja_unlocked_avatar_items_v2';

export interface PointTransaction {
  id: string;
  timestamp: number;
  type: 'earn' | 'spend';
  amount: number;
  reason: string;
}

// Helper to resolve currently logged in user ID safely
function resolveCurrentUserId(): string | undefined {
  try {
    const raw = localStorage.getItem('typang_current_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id) return String(user.id);
    }
  } catch {}
  return undefined;
}

// Default free avatar items
export const DEFAULT_UNLOCKED_AVATAR_ITEMS: string[] = [
  // Basic hairs
  'hair_short', 'hair_long', 'hair_straight', 'hair_curly', 'hair_two_block', 'hair_bob', 'hair_bun',
  'hair_two_block_dandy', 'hair_comma_hair', 'hair_dandy_perm', 'hair_neat_straight_bob',
  // Basic tops
  'top_white_tshirt', 'top_casual_oversized_tee', 'top_cable_knit', 'top_school_cardigan', 'top_varsity_jacket',
  // Basic bottoms
  'bottom_relaxed_baggy_jeans', 'bottom_boyfriend_jeans', 'bottom_sporty_sweatpants', 'bottom_denim_shorts',
  // Basic shoes
  'shoes_white_sneakers', 'shoes_chunky_sneakers', 'shoes_hightop_canvas', 'shoes_slippers',
  // Basic accessories & bg
  'acc_none', 'acc_glasses_round', 'acc_ribbon',
  'bg_terrace', 'bg_park', 'bg_room',
  'sticker_none', 'sticker_sparkle_stars',
];

// Premium Item Prices
export const AVATAR_ITEM_PRICES: Record<string, { name: string; price: number; category: string }> = {
  // Premium Hairs (100 ~ 200 P)
  'hair_blonde_curly_side_pony': { name: '블론드 사이드 포니', price: 150, category: '헤어' },
  'hair_brown_curly_side_pony': { name: '브라운 컬리 포니', price: 120, category: '헤어' },
  'hair_wavy_bob_bangs': { name: '웨이브 단발 뱅', price: 120, category: '헤어' },
  'hair_loose_wavy_twintails': { name: '러블리 트윈테일', price: 160, category: '헤어' },
  'hair_straight_half_up': { name: '청순 반묶음 머리', price: 140, category: '헤어' },
  'hair_hime_cut': { name: '엘레강스 히메컷', price: 180, category: '헤어' },
  'hair_blonde_wavy_headband': { name: '헤어밴드 웨이브', price: 150, category: '헤어' },
  'hair_beret_side_pony': { name: '베레모 사이드 포니', price: 180, category: '헤어' },
  'hair_wavy_bob_cat_ears': { name: '고양이 귀 숏컷', price: 200, category: '헤어' },
  'hair_pink_pigtails_bows': { name: '핑크 리본 트윈테일', price: 200, category: '헤어' },
  'hair_wolf_cut_messy': { name: '와일드 울프컷', price: 150, category: '헤어' },
  'hair_short_spiky': { name: '스파이키 숏컷', price: 130, category: '헤어' },

  // Premium Tops (100 ~ 250 P)
  'top_denim_jacket': { name: '클래식 청자켓', price: 120, category: '상의' },
  'top_streetwear_hoodie': { name: '스트릿 오버핏 후드', price: 130, category: '상의' },
  'top_formal_blazer_tie': { name: '포멀 블레이저 & 타이', price: 160, category: '상의' },
  'top_bomber_ma1': { name: 'MA-1 항공점퍼', price: 150, category: '상의' },
  'top_off_shoulder': { name: '오프숄더 블라우스', price: 180, category: '상의' },
  'top_crop_top_floral': { name: '플로럴 크롭탑', price: 150, category: '상의' },
  'top_hanbok_top': { name: '전통 비단 한복 저고리', price: 250, category: '상의' },
  'top_trench_coat': { name: '어텀 트렌치코트', price: 200, category: '상의' },
  'top_gothic_jacket': { name: '고딕 로얄 자켓', price: 220, category: '상의' },
  'top_techwear_tank': { name: '테크웨어 베스트', price: 190, category: '상의' },

  // Premium Bottoms (80 ~ 180 P)
  'bottom_wide_cargo_pants': { name: '와이드 카고 팬츠', price: 120, category: '하의' },
  'bottom_tailored_slacks': { name: '슬림 테일러드 슬랙스', price: 130, category: '하의' },
  'bottom_pleated_skirt': { name: '테니스 플리츠 스커트', price: 150, category: '하의' },
  'bottom_leather_pants': { name: '시크 가죽 팬츠', price: 160, category: '하의' },
  'bottom_ripped_jeans': { name: '데미지 찢청 팬츠', price: 130, category: '하의' },
  'bottom_skater_skirt': { name: '발랄 스케이터 스커트', price: 140, category: '하의' },
  'bottom_maxi_skirt': { name: '엘레강스 롱 맥시스커트', price: 160, category: '하의' },

  // Premium Accessories (100 ~ 300 P)
  'acc_sunglasses': { name: '선글라스', price: 100, category: '악세서리' },
  'acc_headphones': { name: '게이밍 헤드셋', price: 160, category: '악세서리' },
  'acc_crown': { name: '황금 왕관', price: 280, category: '악세서리' },
  'acc_cat_ears': { name: '고양이 귀 머리띠', price: 200, category: '악세서리' },
  'acc_halo': { name: '천사의 링 헤일로', price: 300, category: '악세서리' },
  'acc_star_pin': { name: '반짝 별빛 핀', price: 120, category: '악세서리' },
  'acc_hairpin_flower': { name: '화사한 꽃잎 핀', price: 110, category: '악세서리' },
  'acc_beret': { name: '파리지앵 베레모', price: 140, category: '악세서리' },

  // Premium Backgrounds (150 ~ 250 P)
  'bg_beach': { name: '에메랄드빛 해변', price: 150, category: '배경' },
  'bg_city_night': { name: '화려한 도시 야경', price: 200, category: '배경' },
  'bg_forest': { name: '신비로운 숲속', price: 220, category: '배경' },

  // Premium Stickers (100 ~ 150 P)
  'sticker_floating_hearts': { name: '두근두근 하트', price: 130, category: '스티커' },
  'sticker_cherry_blossom': { name: '흩날리는 벚꽃', price: 150, category: '스티커' },
  'sticker_music_notes': { name: '신나는 음표', price: 120, category: '스티커' },
  'sticker_bubbles': { name: '반짝이는 비눗방울', price: 140, category: '스티커' },
};

export class PointsManager {
  private static instance: PointsManager;

  private constructor() {
    this.ensureInitialized();
    this.listenForSync();
  }

  public static getInstance(): PointsManager {
    if (!PointsManager.instance) {
      PointsManager.instance = new PointsManager();
    }
    return PointsManager.instance;
  }

  private getStorageKey(userId?: string): string {
    const uid = userId || resolveCurrentUserId();
    return uid ? `${POINTS_STORAGE_KEY}_${uid}` : POINTS_STORAGE_KEY;
  }

  private listenForSync() {
    typangSync.onMessage((type, payload) => {
      if (type === 'USERS_UPDATED' || type === 'POINTS_UPDATED') {
        window.dispatchEvent(new CustomEvent('points-updated', { detail: payload }));
      }
    });
  }

  private ensureInitialized(userId?: string) {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Check if legacy global wallet exists
        let initialPoints = 300;
        let initialHistory: PointTransaction[] = [{
          id: 'init_welcome',
          timestamp: Date.now(),
          type: 'earn',
          amount: 300,
          reason: '타자 연습 시작 웰컴 보너스 🎁',
        }];

        const legacyRaw = localStorage.getItem(POINTS_STORAGE_KEY);
        if (legacyRaw && key !== POINTS_STORAGE_KEY) {
          try {
            const parsed = JSON.parse(legacyRaw);
            if (typeof parsed.points === 'number') initialPoints = parsed.points;
            if (Array.isArray(parsed.history)) initialHistory = parsed.history;
          } catch {}
        }

        // Initial welcome starter bonus for students
        localStorage.setItem(key, JSON.stringify({
          points: initialPoints,
          history: initialHistory,
        }));
      }

      const unlockedRaw = localStorage.getItem(UNLOCKED_AVATAR_KEY);
      if (!unlockedRaw) {
        localStorage.setItem(UNLOCKED_AVATAR_KEY, JSON.stringify(DEFAULT_UNLOCKED_AVATAR_ITEMS));
      }
    } catch (err) {
      console.warn('PointsManager initialization warning', err);
    }
  }

  public getPoints(userId?: string): number {
    try {
      const key = this.getStorageKey(userId);
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.points === 'number' && Number.isFinite(parsed.points)) {
          return Math.max(0, Math.round(parsed.points));
        }
      }
    } catch {}
    return 300;
  }

  public getBalance(userId?: string): number {
    return this.getPoints(userId);
  }

  public addPoints(amount: number, reason: string, userId?: string): number {
    const rawAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (rawAmount <= 0 || !Number.isFinite(rawAmount)) {
      return this.getPoints(userId);
    }

    // 점수가 너무 빨리 쌓이지 않도록 지급 포인트를 기존 대비 반(1/2)으로 축소
    const safeAmount = Math.max(1, Math.round(rawAmount / 6));

    try {
      const key = this.getStorageKey(userId);
      let currentPoints = 300;
      let history: PointTransaction[] = [];
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        currentPoints = (typeof parsed.points === 'number' && Number.isFinite(parsed.points)) ? parsed.points : 300;
        history = Array.isArray(parsed.history) ? parsed.history : [];
      }

      const newTotal = currentPoints + safeAmount;
      const newTx: PointTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        type: 'earn',
        amount: safeAmount,
        reason: String(reason || '포인트 획득'),
      };

      const updatedHistory = [newTx, ...history].slice(0, 50);
      localStorage.setItem(key, JSON.stringify({
        points: newTotal,
        history: updatedHistory,
      }));

      // Sync with Tamagotchi practice points
      const tamagotchi = getStoredTamagotchi();
      if (tamagotchi) {
        tamagotchi.practicePoints = newTotal;
        saveStoredTamagotchi(tamagotchi);
      }

      // Dispatch global events and broadcast across tabs
      const detail = { points: newTotal, change: safeAmount, reason, type: 'earn', userId: userId || resolveCurrentUserId() };
      window.dispatchEvent(new CustomEvent('points-updated', { detail }));
      typangSync.broadcast('POINTS_UPDATED' as any, detail);

      // Show floating notification
      this.showRewardToast(`+${safeAmount} P 획득! 🪙`, reason);

      return newTotal;
    } catch (err) {
      console.error('Failed to add points', err);
      return this.getPoints(userId);
    }
  }

  public spendPoints(amount: number, reason: string, userId?: string): boolean {
    const safeAmount = Math.max(0, Math.round(Number(amount) || 0));
    if (safeAmount <= 0) return true;

    try {
      const key = this.getStorageKey(userId);
      let currentPoints = this.getPoints(userId);
      if (currentPoints < safeAmount) {
        soundManager.play('error');
        return false;
      }

      let history: PointTransaction[] = [];
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        history = Array.isArray(parsed.history) ? parsed.history : [];
      }

      const newTotal = Math.max(0, currentPoints - safeAmount);
      const newTx: PointTransaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: Date.now(),
        type: 'spend',
        amount: safeAmount,
        reason: String(reason || '포인트 사용'),
      };

      const updatedHistory = [newTx, ...history].slice(0, 50);
      localStorage.setItem(key, JSON.stringify({
        points: newTotal,
        history: updatedHistory,
      }));

      // Sync with Tamagotchi practice points
      const tamagotchi = getStoredTamagotchi();
      if (tamagotchi) {
        tamagotchi.practicePoints = newTotal;
        saveStoredTamagotchi(tamagotchi);
      }

      soundManager.play('achievement');

      // Dispatch global events and broadcast
      const detail = { points: newTotal, change: -safeAmount, reason, type: 'spend', userId: userId || resolveCurrentUserId() };
      window.dispatchEvent(new CustomEvent('points-updated', { detail }));
      typangSync.broadcast('POINTS_UPDATED' as any, detail);

      return true;
    } catch (err) {
      console.error('Failed to spend points', err);
      return false;
    }
  }

  public isAvatarItemUnlocked(itemId: string): boolean {
    // If not priced or in default list, it's free
    if (!AVATAR_ITEM_PRICES[itemId] || DEFAULT_UNLOCKED_AVATAR_ITEMS.includes(itemId)) {
      return true;
    }

    try {
      const raw = localStorage.getItem(UNLOCKED_AVATAR_KEY);
      if (raw) {
        const list: string[] = JSON.parse(raw);
        return list.includes(itemId);
      }
    } catch {}
    return false;
  }

  public unlockAvatarItem(itemId: string): { success: boolean; message: string } {
    const itemInfo = AVATAR_ITEM_PRICES[itemId];
    if (!itemInfo) {
      return { success: true, message: '기본 무료 아이템입니다.' };
    }

    if (this.isAvatarItemUnlocked(itemId)) {
      return { success: true, message: '이미 해금된 아이템입니다.' };
    }

    const currentPoints = this.getPoints();
    if (currentPoints < itemInfo.price) {
      return { 
        success: false, 
        message: `포인트가 부족합니다! (필요: ${itemInfo.price} P / 보유: ${currentPoints} P)` 
      };
    }

    const spent = this.spendPoints(itemInfo.price, `아바타 ${itemInfo.name} 아이템 해금`);
    if (!spent) {
      return { success: false, message: '포인트 결제에 실패했습니다.' };
    }

    try {
      const raw = localStorage.getItem(UNLOCKED_AVATAR_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [...DEFAULT_UNLOCKED_AVATAR_ITEMS];
      if (!list.includes(itemId)) {
        list.push(itemId);
        localStorage.setItem(UNLOCKED_AVATAR_KEY, JSON.stringify(list));
      }
      window.dispatchEvent(new CustomEvent('avatar-items-updated', { detail: { itemId, list } }));
      return { success: true, message: `${itemInfo.name} 아이템을 멋지게 해금했습니다! 🎉` };
    } catch {
      return { success: true, message: '해금되었습니다.' };
    }
  }

  public getUnlockedAvatarItems(): string[] {
    try {
      const raw = localStorage.getItem(UNLOCKED_AVATAR_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return [...DEFAULT_UNLOCKED_AVATAR_ITEMS];
  }

  private showRewardToast(title: string, subtitle: string) {
    const toastContainer = document.getElementById('points-toast-container');
    if (!toastContainer) {
      const div = document.createElement('div');
      div.id = 'points-toast-container';
      div.className = 'fixed top-18 right-4 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(div);
    }

    const container = document.getElementById('points-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-950 px-4 py-2.5 rounded-2xl shadow-xl border-2 border-yellow-200 flex items-center gap-3 animate-bounce font-black text-xs pointer-events-auto backdrop-blur-sm transition-all duration-300';
    toast.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-base shadow-xs">
        🪙
      </div>
      <div>
        <div class="text-sm font-black tracking-tight text-amber-950">${title}</div>
        <div class="text-[11px] font-bold text-amber-900 opacity-90">${subtitle}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2800);
  }
}

export const pointsManager = PointsManager.getInstance();
