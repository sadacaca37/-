import React, { useState, useEffect } from 'react';
import { RoomDecorState } from '../../types';
import { soundManager } from '../../utils/sound';
import { ParchmentModalContainer } from '../ParchmentModalContainer';
import { 
  Sparkles, 
  Palette, 
  Image as ImageIcon, 
  Sun, 
  Lamp, 
  Sofa, 
  Gamepad2, 
  RotateCcw,
  Check,
  Lock,
  Coins,
  Wand2,
  AlertCircle,
  HelpCircle,
  Trophy,
  X,
  Crown
} from 'lucide-react';

export interface DecorItemMeta {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cost: number; // 0 = free default, > 0 = unlock with points
  previewBg?: string;
  previewColor?: string;
}

export type DecorCategory = 
  | 'wallpaper' 
  | 'flooring' 
  | 'windowView' 
  | 'rug' 
  | 'furniture' 
  | 'wallDecor' 
  | 'floorToy' 
  | 'lighting';

export const DECOR_CATEGORIES: Array<{
  id: DecorCategory;
  label: string;
  icon: React.ReactNode;
  desc: string;
}> = [
  { id: 'wallpaper', label: '벽지', icon: <Palette className="w-4 h-4" />, desc: '방의 분위기를 결정하는 컬러풀 벽지' },
  { id: 'flooring', label: '바닥', icon: <div className="text-base leading-none">🪵</div>, desc: '원목, 대리석, 다다미, 타일 바닥' },
  { id: 'windowView', label: '창밖 풍경', icon: <Sun className="w-4 h-4" />, desc: '창문 밖으로 보이는 날씨와 계절' },
  { id: 'rug', label: '러그/카페트', icon: <div className="text-base leading-none">🧶</div>, desc: '바닥 중앙에 까는 푹신한 러그' },
  { id: 'furniture', label: '가구 & 쉼터', icon: <Sofa className="w-4 h-4" />, desc: '소파, 캣타워, 오락기, 피아노, 텐트' },
  { id: 'wallDecor', label: '벽 장식', icon: <ImageIcon className="w-4 h-4" />, desc: '액자, 네온시계, 식물선반, 황금 트로피' },
  { id: 'floorToy', label: '장난감 & 소품', icon: <Gamepad2 className="w-4 h-4" />, desc: '공, 테디베어, 로봇, 황금 식기, 요술봉' },
  { id: 'lighting', label: '조명 & 특수효과', icon: <Lamp className="w-4 h-4" />, desc: '펜던트등, 미러볼, 페어리전구, 오로라' },
];

export const DECOR_ITEMS: Record<DecorCategory, DecorItemMeta[]> = {
  wallpaper: [
    { id: 'warm_cream', name: '크림 옐로우 벽지', icon: '🟡', desc: '따뜻하고 포근한 기본 크림 벽지', cost: 0, previewBg: 'bg-amber-100' },
    { id: 'pastel_pink', name: '딸기 우유 핑크', icon: '🌸', desc: '사랑스럽고 화사한 베이비 핑크', cost: 40, previewBg: 'bg-pink-100' },
    { id: 'sky_cloud', name: '스카이 블루 구름', icon: '☁️', desc: '맑은 하늘과 둥실둥실 구름', cost: 60, previewBg: 'bg-sky-100' },
    { id: 'mint_forest', name: '상쾌한 민트 포레스트', icon: '🍃', desc: '피톤치드가 뿜어져 나오는 숲', cost: 70, previewBg: 'bg-emerald-100' },
    { id: 'lavender_dream', name: '라벤더 드림', icon: '💜', desc: '향긋한 파스텔 보랏빛 벽지', cost: 80, previewBg: 'bg-purple-100' },
    { id: 'night_stars', name: '신비로운 은하수 밤하늘', icon: '🌌', desc: '별빛이 쏟아지는 보랏빛 밤하늘', cost: 120, previewBg: 'bg-indigo-900 text-white' },
    { id: 'candy_sweet', name: '달콤 캔디 스트라이프', icon: '🍭', desc: '줄무늬 롤리팝 파스텔 벽지', cost: 100, previewBg: 'bg-rose-100' },
    { id: 'cyber_grid', name: '사이버 네온 그리드', icon: '⚡', desc: 'SF 감성의 미래지향적 네온 벽지', cost: 140, previewBg: 'bg-slate-900 text-cyan-300' },
  ],
  flooring: [
    { id: 'wood_oak', name: '따스한 오크 원목 마루', icon: '🪵', desc: '자연스러운 갈색 나무 바닥', cost: 0 },
    { id: 'wood_cherry', name: '체리 브라운 마루', icon: '🟤', desc: '고급스럽고 깊은 체리목 바닥', cost: 50 },
    { id: 'pastel_tile', name: '파스텔 체크 타일', icon: '🏁', desc: '아기자기한 파스텔 체크 타일', cost: 70 },
    { id: 'soft_carpet', name: '푹신푹신 화이트 카펫', icon: '☁️', desc: '발이 푹 잠기는 극세사 카펫', cost: 90 },
    { id: 'marble_gold', name: '황금 마블 대리석', icon: '🏛️', desc: '궁전처럼 럭셔리한 대리석 바닥', cost: 130 },
    { id: 'tatami_mat', name: '포근한 다다미 바닥', icon: '🌾', desc: '자연의 풀향이 나는 편안한 바닥', cost: 80 },
  ],
  windowView: [
    { id: 'sunny_sky', name: '햇살 가득 맑은 하늘', icon: '☀️', desc: '뭉게구름과 밝은 햇살이 들어와요', cost: 0 },
    { id: 'night_moon', name: '초승달과 반짝이는 별', icon: '🌙', desc: '낭만적인 밤하늘 풍경', cost: 60 },
    { id: 'sakura_spring', name: '벚꽃 흩날리는 봄날', icon: '🌸', desc: '분홍빛 벚꽃잎이 창밖으로 날려요', cost: 80 },
    { id: 'snowy_winter', name: '소복소복 하얀 눈꽃', icon: '❄️', desc: '포근하게 눈이 내리는 겨울 풍경', cost: 90 },
    { id: 'rainbow_forest', name: '무지개 요정의 숲', icon: '🌈', desc: '찬란한 7색 무지개와 초록 숲', cost: 110 },
    { id: 'city_sunset', name: '노을빛 시티 야경', icon: '🌇', desc: '황혼의 붉은 노을과 빌딩 숲', cost: 130 },
  ],
  rug: [
    { id: 'circle_sun', name: '햇살 서클 러그', icon: '☀️', desc: '오렌지빛 따뜻한 스트라이프 러그', cost: 0 },
    { id: 'bear_rug', name: '아기 곰돌이 러그', icon: '🐻', desc: '곰돌이 얼굴 모양의 폭신한 러그', cost: 60 },
    { id: 'flower_pink', name: '핑크 플라워 러그', icon: '🌸', desc: '활짝 핀 꽃잎 모양의 예쁜 러그', cost: 70 },
    { id: 'star_magic', name: '마법 별자리 러그', icon: '⭐', desc: '황금 별 모양의 마법진 러그', cost: 100 },
    { id: 'heart_cloud', name: '하트 솜구름 러그', icon: '💖', desc: '몽실몽실 하트 모양 구름 러그', cost: 80 },
    { id: 'cat_paw_rug', name: '핑크 발바닥 러그', icon: '🐾', desc: '말랑말랑 젤리 발바닥 모양 러그', cost: 90 },
    { id: 'none', name: '러그 없음', icon: '🚫', desc: '바닥을 깔끔하게 비워둡니다', cost: 0 },
  ],
  furniture: [
    { id: 'cozy_sofa', name: '포근한 1인용 소파', icon: '🛋️', desc: '푹신한 등받이와 쿠션이 있는 소파', cost: 0 },
    { id: 'cat_tower', name: '원목 캣타워 & 해먹', icon: '🪜', desc: '올라가서 쉴 수 있는 다단 타워', cost: 80 },
    { id: 'arcade_box', name: '미니 오락기 (아케이드)', icon: '🕹️', desc: '레트로 게임을 즐길 수 있는 오락기', cost: 120 },
    { id: 'piano_mini', name: '클래식 미니 피아노', icon: '🎹', desc: '건반 소리가 울리는 예쁜 피아노', cost: 140 },
    { id: 'magic_tent', name: '인디언 감성 키즈 텐트', icon: '⛺', desc: '아늑한 나만의 아지트 텐트', cost: 110 },
    { id: 'gaming_desk', name: 'RGB 게이밍 데스크', icon: '🖥️', desc: '듀얼 모니터와 네온 키보드 세트', cost: 150 },
    { id: 'dessert_table', name: '애프터눈 티 디저트 상', icon: '🫖', desc: '달콤한 마카롱과 케이크 테이블', cost: 100 },
    { id: 'none', name: '가구 없음', icon: '🚫', desc: '가구 없이 넓게 사용해요', cost: 0 },
  ],
  wallDecor: [
    { id: 'family_photo', name: '반려동물 가족사진 액자', icon: '🖼️', desc: '소중한 발바닥 액자', cost: 0 },
    { id: 'neon_clock', name: '네온 하트 시계', icon: '⏰', desc: '벽에서 째깍째깍 빛나는 시계', cost: 50 },
    { id: 'plant_shelf', name: '원목 선반 & 미니 화분', icon: '🪴', desc: '귀여운 책들과 화분이 올려진 선반', cost: 60 },
    { id: 'gold_trophy', name: '타자 챔피언 황금 트로피', icon: '🏆', desc: '멋진 황금 트로피 진열장', cost: 100 },
    { id: 'party_garland', name: '알록달록 파티 가랜드', icon: '🎏', desc: '축제 분위기를 내는 삼각 깃발', cost: 70 },
    { id: 'led_keyboard_sign', name: 'LED 키보드 네온사인', icon: '⌨️', desc: '타자 마스터를 상징하는 네온사인', cost: 90 },
    { id: 'none', name: '벽 장식 없음', icon: '🚫', desc: '벽을 심플하게 비워둬요', cost: 0 },
  ],
  floorToy: [
    { id: 'play_ball', name: '통통 튀는 무지개 공', icon: '⚽', desc: '신나게 굴리고 노는 장난감 공', cost: 0 },
    { id: 'teddy_bear', name: '푹신한 갈색 테디베어', icon: '🧸', desc: '안고 잘 수 있는 귀여운 곰인형', cost: 50 },
    { id: 'robot_toy', name: '반짝반짝 꼬마 로봇', icon: '🤖', desc: '눈에 불이 들어오는 멋진 장난감', cost: 80 },
    { id: 'train_set', name: '칙칙폭폭 미니 기차', icon: '🚂', desc: '레일을 달리는 귀여운 기차', cost: 90 },
    { id: 'food_bowl_royal', name: '황금 보석 밥그릇', icon: '🥣', desc: '맛있는 특제 사료가 가득 담긴 그릇', cost: 110 },
    { id: 'magic_wand_stand', name: '별빛 요술봉 스탠드', icon: '🪄', desc: '반짝이는 마법 가루가 날리는 요술봉', cost: 85 },
    { id: 'none', name: '소품 없음', icon: '🚫', desc: '바닥 소품을 치웁니다', cost: 0 },
  ],
  lighting: [
    { id: 'warm_pendant', name: '클래식 앰버 펜던트등', icon: '💡', desc: '천장에서 내려오는 포근한 전등', cost: 0 },
    { id: 'disco_ball', name: '신나는 회전 미러볼', icon: '🪩', desc: '오색빛깔 빛을 뿜는 파티 미러볼', cost: 90 },
    { id: 'fairy_lights', name: '반짝반짝 페어리 전구선', icon: '✨', desc: '벽을 따라 물결치는 감성 조명', cost: 70 },
    { id: 'star_lamp', name: '은은한 달빛 무드등', icon: '⭐', desc: '포근한 수면을 돕는 별빛 조명', cost: 80 },
    { id: 'aurora_projector', name: '오로라 빔 프로젝터', icon: '🌌', desc: '천장에 춤추는 오로라 빛을 투사해요', cost: 130 },
    { id: 'none', name: '조명 없음', icon: '🚫', desc: '기본 자연광만 비춥니다', cost: 0 },
  ],
};

// Preset Recommended Sets
export const PRESET_THEMES: Array<{
  name: string;
  icon: string;
  desc: string;
  decor: RoomDecorState;
}> = [
  {
    name: '아늑한 오크 스위트홈',
    icon: '🏡',
    desc: '포근한 크림 벽지와 원목 가구의 따뜻한 기본 룸',
    decor: {
      wallpaper: 'warm_cream',
      flooring: 'wood_oak',
      windowView: 'sunny_sky',
      rug: 'circle_sun',
      furniture: 'cozy_sofa',
      wallDecor: 'family_photo',
      floorToy: 'play_ball',
      lighting: 'warm_pendant',
    },
  },
  {
    name: '달콤 딸기 공주 룸',
    icon: '🌸',
    desc: '딸기우유 핑크와 꽃잎 러그, 디저트 테이블 세트',
    decor: {
      wallpaper: 'pastel_pink',
      flooring: 'pastel_tile',
      windowView: 'sakura_spring',
      rug: 'flower_pink',
      furniture: 'dessert_table',
      wallDecor: 'party_garland',
      floorToy: 'teddy_bear',
      lighting: 'fairy_lights',
    },
  },
  {
    name: '은하수 우주 천문대',
    icon: '🌌',
    desc: '밤하늘 별자리와 오로라 조명, 황금 마법진 세트',
    decor: {
      wallpaper: 'night_stars',
      flooring: 'marble_gold',
      windowView: 'night_moon',
      rug: 'star_magic',
      furniture: 'piano_mini',
      wallDecor: 'gold_trophy',
      floorToy: 'magic_wand_stand',
      lighting: 'aurora_projector',
    },
  },
  {
    name: '프로 게이머 아케이드 룸',
    icon: '🕹️',
    desc: '사이버 네온과 레트로 오락기, 미러볼 파티룸',
    decor: {
      wallpaper: 'cyber_grid',
      flooring: 'soft_carpet',
      windowView: 'city_sunset',
      rug: 'heart_cloud',
      furniture: 'gaming_desk',
      wallDecor: 'led_keyboard_sign',
      floorToy: 'robot_toy',
      lighting: 'disco_ball',
    },
  },
];

export interface RoomDecorModalProps {
  isOpen: boolean;
  onClose: () => void;
  decor: RoomDecorState;
  unlockedDecors?: string[];
  userPoints: number;
  onSaveDecor: (newDecor: RoomDecorState) => void;
  onUnlockItem: (itemId: string, cost: number) => void;
  petName: string;
  isMaster?: boolean;
}

export const RoomDecorModal: React.FC<RoomDecorModalProps> = ({
  isOpen,
  onClose,
  decor,
  unlockedDecors = ['warm_cream', 'wood_oak', 'sunny_sky', 'circle_sun', 'cozy_sofa', 'family_photo', 'play_ball', 'warm_pendant', 'none'],
  userPoints = 0,
  onSaveDecor,
  onUnlockItem,
  petName,
  isMaster = false,
}) => {
  const [currentTab, setCurrentTab] = useState<DecorCategory>('wallpaper');
  const [tempDecor, setTempDecor] = useState<RoomDecorState>(decor);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    setTempDecor(decor);
  }, [decor, isOpen]);

  if (!isOpen) return null;

  const isItemUnlocked = (item: DecorItemMeta) => {
    if (item.cost === 0 || item.id === 'none') return true;
    return unlockedDecors.includes(item.id);
  };

  const handleSelectItem = (cat: DecorCategory, item: DecorItemMeta) => {
    setErrorMsg('');
    setSuccessMsg('');

    // If locked, prompt unlock with points (free for master)
    if (!isItemUnlocked(item)) {
      if (!isMaster && userPoints < item.cost) {
        soundManager.playError();
        setErrorMsg(
          `포인트가 부족합니다! (필요: ${item.cost}P / 보유: ${userPoints}P) 자리/단어/문장 연습이나 타자 게임을 플레이하여 포인트를 모아보세요! 🪙`
        );
        return;
      }

      // Unlock with points!
      soundManager.playLevelUp();
      onUnlockItem(item.id, isMaster ? 0 : item.cost);
      setSuccessMsg(
        isMaster
          ? `👑 마스터 권한으로 '${item.name}' 아이템을 즉시 무료 해금하여 착용했습니다!`
          : `🎉 축하합니다! '${item.name}' 아이템을 해금하여 착용했습니다! (-${item.cost}P)`
      );
      
      const updated = {
        ...tempDecor,
        [cat]: item.id as any,
      };
      setTempDecor(updated);
      setTimeout(() => setSuccessMsg(''), 3000);
      return;
    }

    // Equipping already unlocked item
    soundManager.playKeyClick(true);
    const updated = {
      ...tempDecor,
      [cat]: item.id as any,
    };
    setTempDecor(updated);
    setSuccessMsg(`'${item.name}' 아이템을 착용했습니다! ✨`);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const handleApplyPreset = (preset: typeof PRESET_THEMES[0]) => {
    // Check if any items in preset are locked
    let missingCost = 0;
    const lockedToUnlock: DecorItemMeta[] = [];

    (Object.keys(preset.decor) as DecorCategory[]).forEach((cat) => {
      const targetId = preset.decor[cat];
      const foundItem = DECOR_ITEMS[cat].find((i) => i.id === targetId);
      if (foundItem && !isItemUnlocked(foundItem)) {
        missingCost += foundItem.cost;
        lockedToUnlock.push(foundItem);
      }
    });

    if (missingCost > 0) {
      if (!isMaster && userPoints < missingCost) {
        soundManager.playError();
        setErrorMsg(
          `풀세트 해금에 필요한 포인트가 부족합니다! (필요: ${missingCost}P / 보유: ${userPoints}P)`
        );
        return;
      }

      // Unlock all required items
      lockedToUnlock.forEach((item) => {
        onUnlockItem(item.id, isMaster ? 0 : item.cost);
      });
      soundManager.playVictory();
      setSuccessMsg(
        isMaster
          ? `👑 마스터 권한으로 '${preset.name}' 풀세트의 모든 가구를 즉시 무료 해금하여 적용했습니다!`
          : `🎉 '${preset.name}' 풀세트의 모든 가구를 해금하여 적용했습니다! (-${missingCost}P)`
      );
    } else {
      soundManager.playSuccess();
      setSuccessMsg(`'${preset.name}' 테마가 적용되었습니다! ✨`);
    }

    setTempDecor(preset.decor);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleApply = () => {
    soundManager.playSuccess();
    onSaveDecor(tempDecor);
    onClose();
  };

  const handleReset = () => {
    const defaultDecor: RoomDecorState = {
      wallpaper: 'warm_cream',
      flooring: 'wood_oak',
      windowView: 'sunny_sky',
      rug: 'circle_sun',
      furniture: 'cozy_sofa',
      wallDecor: 'family_photo',
      floorToy: 'play_ball',
      lighting: 'warm_pendant',
    };
    setTempDecor(defaultDecor);
    setSuccessMsg('기본 가구 인테리어로 변경되었습니다.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-4 border-amber-300 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] relative arcade-card-glow">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-xs shadow-inner">
              <Sparkles className="w-6 h-6 text-yellow-100 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl tracking-tight text-white drop-shadow-xs flex items-center gap-2">
                <span>🏠 {petName}의 집안 꾸미기 & 가구 샵</span>
                <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded-full font-bold border border-white/40">
                  타자 포인트 전용
                </span>
              </h2>
              <p className="text-xs text-amber-100 font-bold">
                타자 연습으로 모은 포인트로 벽지, 바닥, 창문 풍경, 가구, 소품을 해금하고 인테리어하세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time Typing Points Badge */}
            <div className="bg-amber-500/90 border-2 border-yellow-200 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 text-white font-black text-sm shadow-md">
              <Coins className="w-4 h-4 text-yellow-200 animate-bounce" />
              <span>{userPoints.toLocaleString()}</span>
              <span className="text-[11px] text-yellow-100 font-bold">P</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-black text-sm cursor-pointer transition-all active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Recommendation Presets Bar */}
        <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none shrink-0">
          <div className="flex items-center gap-1 text-xs font-black text-amber-900 shrink-0">
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            <span>추천 풀세트:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {PRESET_THEMES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-slate-800 hover:text-amber-900 border border-amber-300 font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 whitespace-nowrap"
                title={preset.desc}
              >
                <span>{preset.icon}</span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Tab Navigation */}
        <div className="flex items-center gap-1.5 p-2.5 px-4 bg-slate-100 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0">
          {DECOR_CATEGORIES.map((cat) => {
            const isActive = currentTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCurrentTab(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-white shadow-md scale-105 ring-2 ring-amber-300'
                    : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Alerts / Success / Notice */}
        {errorMsg && (
          <div className="px-5 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 animate-shake shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="px-5 py-2 bg-teal-50 border-b border-teal-200 text-teal-800 text-xs font-black flex items-center gap-1.5 shrink-0">
            <Check className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Category Description Banner */}
        <div className="px-6 py-2 bg-amber-50/70 text-[11px] font-bold text-amber-900 flex items-center justify-between border-b border-amber-200/50 shrink-0">
          <span>{DECOR_CATEGORIES.find((c) => c.id === currentTab)?.desc}</span>
          <span className="text-amber-700 font-black">
            현재 착용: {DECOR_ITEMS[currentTab].find((i) => i.id === tempDecor[currentTab])?.name || '없음'}
          </span>
        </div>

        {/* Items Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/60">
          {DECOR_ITEMS[currentTab].map((item) => {
            const isEquipped = tempDecor[currentTab] === item.id;
            const unlocked = isItemUnlocked(item);
            const canAfford = userPoints >= item.cost;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectItem(currentTab, item)}
                className={`p-3.5 rounded-2xl border-2 transition-all flex items-center gap-3.5 text-left cursor-pointer relative ${
                  isEquipped
                    ? 'bg-amber-100/90 border-amber-500 shadow-md ring-2 ring-amber-400'
                    : unlocked
                    ? 'bg-white hover:bg-amber-50/60 border-slate-200 hover:border-amber-300'
                    : 'bg-slate-100/80 hover:bg-slate-200/80 border-slate-300 opacity-90'
                }`}
              >
                {/* Item Icon Box */}
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-inner relative ${
                    item.previewBg || 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {item.icon}
                  {!unlocked && (
                    <div className="absolute inset-0 bg-slate-950/40 rounded-2xl flex items-center justify-center backdrop-blur-2xs">
                      <Lock className="w-4 h-4 text-amber-300" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-sm text-slate-800 tracking-tight line-clamp-1">
                      {item.name}
                    </span>
                    {isEquipped && (
                      <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-white text-[10px] font-black">
                        착용중
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5 line-clamp-1">
                    {item.desc}
                  </p>

                  {/* Cost or Status Tag */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    {item.cost === 0 ? (
                      <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        기본 가구 (무료)
                      </span>
                    ) : unlocked ? (
                      <span className="text-[11px] font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-lg border border-sky-200 flex items-center gap-0.5">
                        <Check className="w-3 h-3 text-sky-600" />
                        보유중
                      </span>
                    ) : (
                      <span
                        className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg border flex items-center gap-1 ${
                          canAfford
                            ? 'text-amber-800 bg-amber-100 border-amber-300'
                            : 'text-slate-500 bg-slate-200 border-slate-300'
                        }`}
                      >
                        <Coins className="w-3 h-3 text-amber-600" />
                        <span>{item.cost} P 해금</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action / Checkmark */}
                {isEquipped ? (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : unlocked ? (
                  <button className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black border border-amber-300 shrink-0 cursor-pointer">
                    선택
                  </button>
                ) : (
                  <button
                    className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 cursor-pointer flex items-center gap-1 ${
                      canAfford
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    <span>해금</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 가구로 초기화</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-black text-xs text-slate-700 cursor-pointer transition-all active:scale-95"
            >
              취소
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>방 꾸미기 완료! ✨</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
