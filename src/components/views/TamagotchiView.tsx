import React, { useState, useEffect, useRef } from 'react';
import { GAME_POINTS } from '../../utils/pointRules';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/sound';
import { 
  UserSession, 
  TamagotchiState, 
  PetGrowthStage, 
  TamagotchiThemeType, 
  PetMood, 
  RoomDecorState,
  TamagotchiPetId,
} from '../../types';
import { TamagotchiThemeBackground } from '../TamagotchiThemeBackground';
import { ThemeShopModal } from '../modals/ThemeShopModal';
import { RoomDecorModal } from '../modals/RoomDecorModal';
import { pointsManager } from '../../utils/pointsManager';
import {
  TAMAGOTCHI_PETS,
  getTamagotchiPetDef,
  TamagotchiMoodSpriteKey,
} from '../../data/tamagotchiPetsData';
import {
  INITIAL_TAMAGOTCHI_STATE,
  getStoredTamagotchi,
  saveStoredTamagotchi,
  switchTamagotchiPet,
  resetActiveTamagotchiPet,
} from '../../utils/tamagotchiStorage';
import { 
  Heart, 
  Sparkles, 
  RotateCcw, 
  Utensils, 
  Zap, 
  Clock, 
  Palette,
  TrendingUp,
  Coins,
  Paintbrush,
  SmilePlus,
  ArrowLeft,
  Keyboard,
  PawPrint,
  Check,
  X,
} from 'lucide-react';
import { askConfirm } from '../../utils/dialog';

type PetExpressionKey = 'normal' | TamagotchiMoodSpriteKey;

const EXPRESSION_META: Record<
  PetExpressionKey,
  {
    label: string;
    icon: string;
    badge: string;
    badgeClass: string;
    moodValue: PetMood;
    speech: string;
  }
> = {
  normal: {
    label: '기본',
    icon: '🙂',
    badge: '🌿 기분 평온해요!',
    badgeClass: 'bg-emerald-200 text-emerald-950 border-emerald-400',
    moodValue: 'happy',
    speech: '반가워요! 오늘도 아늑한 나무집에서 함께 즐겁게 놀아요! 🌿',
  },
  happy: {
    label: '행복',
    icon: '🤩',
    badge: '💖 행복 가득해요!',
    badgeClass: 'bg-amber-300 text-amber-950 border-amber-500',
    moodValue: 'ecstatic',
    speech: '와아아! 너무 행복해서 반짝반짝 기운이 넘쳐요!! ✨💕',
  },
  hungry: {
    label: '배고픔',
    icon: '🤤',
    badge: '🤤 꼬르륵 배가 고파요~',
    badgeClass: 'bg-orange-200 text-orange-950 border-orange-400',
    moodValue: 'hungry',
    speech: '배에서 꼬르륵 소리가 나요~ 맛있는 간식 주세요! 🍎',
  },
  sleepy: {
    label: '졸림',
    icon: '😴',
    badge: '😴 솔솔 졸음이 쏟아져요 zZ',
    badgeClass: 'bg-sky-200 text-sky-950 border-sky-400',
    moodValue: 'sleepy',
    speech: '눈이 스르륵 감겨요... 포근한 낮잠 자고 싶어요 💤',
  },
  sad: {
    label: '아픔/슬픔',
    icon: '😢',
    badge: '😢 아야야... 돌봐주세요!',
    badgeClass: 'bg-rose-200 text-rose-950 border-rose-400',
    moodValue: 'crying',
    speech: '훌쩍... 기운이 없어요. 쓰다듬어 주거나 쉬게 해주세요 🥺',
  },
};

interface TamagotchiViewProps {
  currentUser: UserSession | null;
  onOpenProfile?: () => void;
  isPlayground?: boolean;
  onBack?: () => void;
}

interface MissionItem {
  id: string;
  category: 'food' | 'play' | 'clean' | 'study' | 'sleep';
  categoryLabel: string;
  categoryIcon: string;
  prompt: string;
  timeLimit: number; // in seconds
  rewardExp: number;
  rewardHappy: number;
  rewardHunger: number;
  stressReduction: number;
  successMessage: string;
  failMessage: string;
}

const MISSIONS_DATABASE: MissionItem[] = [
  // 1. Food Missions (간식 주기)
  {
    id: 'food_1',
    category: 'food',
    categoryLabel: '맛있는 식사',
    categoryIcon: '🍖',
    prompt: '달콤한 딸기와 신선한 유기농 사료',
    timeLimit: 30,
    rewardExp: 20,
    rewardHappy: 20,
    rewardHunger: 30,
    stressReduction: 10,
    successMessage: '냠냠 쩝쩝! 너무 맛있어서 배가 든든해요! 💖',
    failMessage: '배가 고파서 꼬르륵 소리가 나요 힝... 😢',
  },
  {
    id: 'food_2',
    category: 'food',
    categoryLabel: '영양 간식',
    categoryIcon: '🍎',
    prompt: '바삭바삭 해바라기씨와 고소한 츄르',
    timeLimit: 30,
    rewardExp: 25,
    rewardHappy: 25,
    rewardHunger: 35,
    stressReduction: 15,
    successMessage: '꿀맛 간식 최고! 기운이 펄펄 솟아요! ✨',
    failMessage: '간식 시간이 지나버려서 아쉬워요 😭',
  },
  {
    id: 'food_3',
    category: 'food',
    categoryLabel: '특급 만찬',
    categoryIcon: '🍣',
    prompt: '연어 스테이크와 바닐라 아이스크림',
    timeLimit: 30,
    rewardExp: 30,
    rewardHappy: 30,
    rewardHunger: 40,
    stressReduction: 20,
    successMessage: '와아! 입안 가득 행복이 퍼져요! 🍰🎉',
    failMessage: '음식이 식어버렸어요 흑흑 💧',
  },

  // 2. Play Missions (놀아주기)
  {
    id: 'play_1',
    category: 'play',
    categoryLabel: '공놀이 & 산책',
    categoryIcon: '🎾',
    prompt: '거실에서 알록달록 털실 공 굴리기',
    timeLimit: 30,
    rewardExp: 30,
    rewardHappy: 40,
    rewardHunger: -10,
    stressReduction: 30,
    successMessage: '신나게 깡총깡총 뛰어놀아서 기분 최고예요! 🎾✨',
    failMessage: '혼자 심심하게 기다리다 지쳤어요... 😿',
  },
  {
    id: 'play_2',
    category: 'play',
    categoryLabel: '장난감 놀이',
    categoryIcon: '🪀',
    prompt: '살랑살랑 깃털 낚싯대로 탭댄스 추기',
    timeLimit: 33,
    rewardExp: 35,
    rewardHappy: 45,
    rewardHunger: -15,
    stressReduction: 35,
    successMessage: '꺄륵! 점프 실력이 쑥쑥 늘었어요! 💃🎈',
    failMessage: '발이 걸려 꽈당 넘어졌어요 으앙 💫',
  },

  // 3. Clean Missions (목욕 & 방 청소)
  {
    id: 'clean_1',
    category: 'clean',
    categoryLabel: '거품 목욕',
    categoryIcon: '🫧',
    prompt: '보글보글 딸기향 거품 목욕과 드라이',
    timeLimit: 30,
    rewardExp: 25,
    rewardHappy: 20,
    rewardHunger: 0,
    stressReduction: 40,
    successMessage: '털에서 향긋한 냄새가 솔솔 나요! 뽀송뽀송! 🫧✨',
    failMessage: '비눗방울이 눈에 들어가서 따가워요 흑흑 💦',
  },
  {
    id: 'clean_2',
    category: 'clean',
    categoryLabel: '아늑한 방 정리',
    categoryIcon: '🧹',
    prompt: '햇살 가득 아늑한 집 청소와 환기하기',
    timeLimit: 33,
    rewardExp: 25,
    rewardHappy: 25,
    rewardHunger: -5,
    stressReduction: 35,
    successMessage: '집이 반짝반짝 깨끗해져서 상쾌해요! 🧹🌟',
    failMessage: '방이 어지러워서 발을 찧었어요 아야! ⚡',
  },

  // 4. Study / Typing Training (성장 특훈)
  {
    id: 'study_1',
    category: 'study',
    categoryLabel: '타자 지능 훈련',
    categoryIcon: '📚',
    prompt: '티끌 모아 태산이고 노력은 배신하지 않는다',
    timeLimit: 39,
    rewardExp: 60,
    rewardHappy: 20,
    rewardHunger: -10,
    stressReduction: 10,
    successMessage: '지능이 쑥쑥 자라며 레벨업에 성큼 다가섰어요! 🧠💡',
    failMessage: '타자가 어려워서 머리가 지끈거려요 으악 💢',
  },
  {
    id: 'study_2',
    category: 'study',
    categoryLabel: '성장 명언 타자',
    categoryIcon: '📖',
    prompt: '한 걸음씩 나아가면 꿈꾸던 성체가 될 수 있어',
    timeLimit: 42,
    rewardExp: 70,
    rewardHappy: 25,
    rewardHunger: -10,
    stressReduction: 15,
    successMessage: '대성공! 멋진 청년 동물로 진화하는 중이에요! 🌟🏆',
    failMessage: '오타가 나서 공부를 다 못 마쳤어요 😢',
  },

  // 5. Sleep & Rest (자장가 휴식)
  {
    id: 'sleep_1',
    category: 'sleep',
    categoryLabel: '포근한 낮잠',
    categoryIcon: '💤',
    prompt: '푹신한 구름 쿠션에 누워 쿨쿨 꿈나라로',
    timeLimit: 33,
    rewardExp: 20,
    rewardHappy: 15,
    rewardHunger: -5,
    stressReduction: 60,
    successMessage: '포근하게 푹 자고 일어나 스트레스가 싹 날아갔어요! 💤🌙',
    failMessage: '잠투정하느라 잠을 설쳤어요 힝... 🥺',
  },
];

/** 배경 테마별 방 그림 (제미나이로 그린 것) */
const THEME_PICTURES: Record<string, string> = {
  warm_living: './assets/tamagotchi/themes/warm_living.webp',
  cosmic_space: './assets/tamagotchi/themes/cosmic_space.webp',
  deep_ocean: './assets/tamagotchi/themes/deep_ocean.webp',
  cloud_heaven: './assets/tamagotchi/themes/cloud_heaven.webp',
  fairy_forest: './assets/tamagotchi/themes/fairy_forest.webp',
  candy_land: './assets/tamagotchi/themes/candy_land.webp',
  crystal_castle: './assets/tamagotchi/themes/crystal_castle.webp',
};

export const TamagotchiView: React.FC<TamagotchiViewProps> = ({
  currentUser,
  onOpenProfile,
  isPlayground = false,
  onBack,
}) => {
  const userId = currentUser?.id ?? null;

  // Care mode: 'point' (타자 안 치고 포인트로 즉시 돌보기) or 'typing' (타자 미션 모드)
  const [careMode, setCareMode] = useState<'point' | 'typing'>('point');

  // Load saved pet state scoped per student
  const [pet, setPet] = useState<TamagotchiState>(() => getStoredTamagotchi(userId));
  const loadedUserIdRef = useRef<string | null>(userId);

  // Modals state (first-time students start directly on the 10-pet selector)
  const [showPetPicker, setShowPetPicker] = useState<boolean>(() => !getStoredTamagotchi(userId).hasChosenPet);
  const [showThemeShop, setShowThemeShop] = useState(false);
  const [showRoomDecor, setShowRoomDecor] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [showExpressionPanel, setShowExpressionPanel] = useState(false);
  const [evolvedStage, setEvolvedStage] = useState<PetGrowthStage>('baby');
  const [previewStage, setPreviewStage] = useState<PetGrowthStage | null>(null);

  // Animation triggers
  const [isGrowing, setIsGrowing] = useState(false);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [floatingBadges, setFloatingBadges] = useState<Array<{ id: number; text: string; color: string; left: number }>>([]);

  // Active mission state
  const [activeMission, setActiveMission] = useState<MissionItem | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [speechBubble, setSpeechBubble] = useState<string>(
    () => getTamagotchiPetDef(getStoredTamagotchi(userId).selectedPetId).greeting
  );
  const [foodDropAnim, setFoodDropAnim] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Trigger floating EXP badge
  const triggerExpBadge = (text: string, color: string = 'text-amber-500') => {
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 60) + 20; // 20% ~ 80%
    setFloatingBadges((prev) => [...prev, { id, text, color, left }]);
    setTimeout(() => {
      setFloatingBadges((prev) => prev.filter((b) => b.id !== id));
    }, 1200);
  };

  // Growth stages: Lv.1 알 -> Lv.2~4 아기 -> Lv.5~8 어린이 -> Lv.9+ 어른
  const getPetStage = (lvl: number): PetGrowthStage => {
    if (lvl >= 9) return 'adult';
    if (lvl >= 5) return 'teen';
    if (lvl >= 2) return 'child';
    return 'baby';
  };

  const activePetDef = getTamagotchiPetDef(pet.selectedPetId);
  const currentStage = getPetStage(pet.level);

  // Stage labels and descriptions (알 → 아기 → 어린이 → 어른)
  const STAGE_LABELS: Record<PetGrowthStage, { title: string; badge: string; desc: string; icon: string }> = {
    baby: {
      title: '알',
      badge: 'Lv.1',
      desc: activePetDef.stageDescs.baby,
      icon: '🥚',
    },
    child: {
      title: '아기',
      badge: 'Lv.2 ~ 4',
      desc: activePetDef.stageDescs.child,
      icon: '🌱',
    },
    teen: {
      title: '어린이',
      badge: 'Lv.5 ~ 8',
      desc: activePetDef.stageDescs.teen,
      icon: '🧣',
    },
    adult: {
      title: '어른',
      badge: 'Lv.9+ 완전 성장',
      desc: activePetDef.stageDescs.adult,
      icon: '👑',
    },
  };

  // Reload pet state cleanly when logged-in student changes
  useEffect(() => {
    if (loadedUserIdRef.current === userId) return;
    loadedUserIdRef.current = userId;
    const loaded = getStoredTamagotchi(userId);
    setPet(loaded);
    setShowPetPicker(!loaded.hasChosenPet);
    setPreviewStage(null);
    setActiveMission(null);
    setSpeechBubble(getTamagotchiPetDef(loaded.selectedPetId).greeting);
  }, [userId]);

  // Save pet to student-scoped storage whenever it changes
  useEffect(() => {
    if (loadedUserIdRef.current !== userId) return;
    saveStoredTamagotchi(pet, userId, true);
  }, [pet, userId]);

  // Sync when practice points or state changes elsewhere
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setPet((prev) => ({
          ...prev,
          ...e.detail,
          unlockedThemes: e.detail.unlockedThemes || prev.unlockedThemes || ['warm_living'],
          unlockedDecors: e.detail.unlockedDecors || prev.unlockedDecors || INITIAL_TAMAGOTCHI_STATE.unlockedDecors,
        }));
      }
    };
    window.addEventListener('tamagotchi-updated', handleUpdate);
    return () => window.removeEventListener('tamagotchi-updated', handleUpdate);
  }, []);

  // Handle active countdown timer
  useEffect(() => {
    if (!activeMission) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleMissionFail('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeMission]);

  // Start a mission
  const startMission = (category?: MissionItem['category']) => {
    let pool = MISSIONS_DATABASE;
    if (category) {
      pool = MISSIONS_DATABASE.filter((m) => m.category === category);
    }
    const selected = pool[Math.floor(Math.random() * pool.length)];

    setActiveMission(selected);
    setTimeLeft(selected.timeLimit);
    setInputVal('');
    setSpeechBubble(`시간 안에 아래 문장을 정확하게 타이핑해줘! (${selected.timeLimit}초)`);
    soundManager.playKeyClick(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeMission) return;
    const val = e.target.value;
    setInputVal(val);

    // Play click
    soundManager.playKeyClick(true);

    // Check if fully matched
    if (val === activeMission.prompt) {
      handleMissionSuccess();
    }
  };

  // Handle Mission Success
  const handleMissionSuccess = () => {
    if (!activeMission) return;
    if (timerRef.current) clearInterval(timerRef.current);

    soundManager.playVictory();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}

    setSpeechBubble(activeMission.successMessage);
    setFoodDropAnim(true);
    setTimeout(() => setFoodDropAnim(false), 1500);

    // Trigger growth animation and floating EXP badge
    setIsGrowing(true);
    const earnedPoints = GAME_POINTS;
    pointsManager.addPoints(earnedPoints, `${activeMission.categoryLabel} 미션 완수`);
    triggerExpBadge(`+${activeMission.rewardExp} EXP 🌟 (+${earnedPoints}P)`, 'text-amber-500 font-black');
    setTimeout(() => setIsGrowing(false), 800);

    // Update Pet Stats & Level
    setPet((prev) => {
      const newExp = prev.exp + activeMission.rewardExp;
      let newLevel = prev.level;
      let newMaxExp = prev.maxExp;
      let remainingExp = newExp;

      // Level up check
      if (newExp >= prev.maxExp) {
        newLevel += 1;
        remainingExp = newExp - prev.maxExp;
        newMaxExp = Math.round(prev.maxExp * 1.35);
        soundManager.playSuccess();
        setIsLevelUp(true);
        triggerExpBadge(`👑 LEVEL UP! Lv.${newLevel}`, 'text-rose-500 font-black text-lg');
        setTimeout(() => setIsLevelUp(false), 1200);

        // Check if stage evolved!
        const oldStage = getPetStage(prev.level);
        const newStage = getPetStage(newLevel);
        if (oldStage !== newStage) {
          setEvolvedStage(newStage);
          setShowEvolutionModal(true);
        }
      }

      const newHappy = Math.min(100, Math.max(0, prev.happiness + activeMission.rewardHappy));
      const newHunger = Math.min(100, Math.max(0, prev.hunger + activeMission.rewardHunger));
      const newStress = Math.max(0, prev.stress - activeMission.stressReduction);

      let mood: TamagotchiState['mood'] = 'happy';
      if (newHappy >= 85 && newStress <= 15) mood = 'ecstatic';
      else if (newStress >= 60) mood = 'stressed';

      return {
        ...prev,
        level: newLevel,
        exp: remainingExp,
        maxExp: newMaxExp,
        happiness: newHappy,
        hunger: newHunger,
        stress: newStress,
        practicePoints: pointsManager.getBalance(),
        totalMissionsSuccess: prev.totalMissionsSuccess + 1,
        mood,
        lastFed: Date.now(),
      };
    });

    setActiveMission(null);
    setInputVal('');
  };

  // Handle Mission Fail
  const handleMissionFail = (reason: 'timeout' | 'giveup') => {
    if (!activeMission) return;
    if (timerRef.current) clearInterval(timerRef.current);

    soundManager.playError();
    setSpeechBubble(activeMission.failMessage);

    // Increase Stress and decrease Happiness
    setPet((prev) => {
      const newStress = Math.min(100, prev.stress + 20);
      const newHappy = Math.max(0, prev.happiness - 15);
      const newHunger = Math.max(0, prev.hunger - 10);

      let mood: TamagotchiState['mood'] = 'stressed';
      if (newStress >= 70) mood = 'crying';

      return {
        ...prev,
        happiness: newHappy,
        hunger: newHunger,
        stress: newStress,
        totalMissionsFailed: prev.totalMissionsFailed + 1,
        mood,
      };
    });

    setActiveMission(null);
    setInputVal('');
  };

  // Point-Based Care (타자를 안 쳐도 포인트로 즉시 돌보기)
  const handlePointCare = (action: {
    name: string;
    cost: number;
    exp: number;
    happy: number;
    hunger: number;
    stressRed: number;
    clean?: number;
    speech: string;
    mood?: PetMood;
  }) => {
    const currentPts = pointsManager.getBalance();
    if (action.cost > 0 && currentPts < action.cost) {
      soundManager.play('error');
      setSpeechBubble(`포인트가 부족해요! (필요: ${action.cost}P / 보유: ${currentPts}P)`);
      return;
    }

    if (action.cost > 0) {
      const ok = pointsManager.spendPoints(action.cost, `다마고치 ${action.name}`);
      if (!ok) return;
    }

    soundManager.play('achievement');
    setSpeechBubble(action.speech);
    setFoodDropAnim(true);
    setTimeout(() => setFoodDropAnim(false), 1200);

    setIsGrowing(true);
    triggerExpBadge(`+${action.exp} EXP ✨ (-${action.cost}P)`, 'text-amber-500 font-black');
    setTimeout(() => setIsGrowing(false), 800);

    setPet((prev) => {
      const nextExp = prev.exp + action.exp;
      let nextLvl = prev.level;
      let nextMax = prev.maxExp;
      let remExp = nextExp;

      if (nextExp >= prev.maxExp) {
        nextLvl += 1;
        remExp = nextExp - prev.maxExp;
        nextMax = Math.round(prev.maxExp * 1.35);
        soundManager.playSuccess();
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        setIsLevelUp(true);
        triggerExpBadge(`👑 LEVEL UP! Lv.${nextLvl}`, 'text-rose-500 font-black text-lg');
        setTimeout(() => setIsLevelUp(false), 1200);

        const oldStage = getPetStage(prev.level);
        const newStage = getPetStage(nextLvl);
        if (oldStage !== newStage) {
          setEvolvedStage(newStage);
          setShowEvolutionModal(true);
        }
      }

      return {
        ...prev,
        level: nextLvl,
        exp: remExp,
        maxExp: nextMax,
        hunger: Math.min(100, prev.hunger + action.hunger),
        happiness: Math.min(100, prev.happiness + action.happy),
        cleanliness: action.clean !== undefined ? Math.min(100, prev.cleanliness + action.clean) : prev.cleanliness,
        stress: Math.max(0, prev.stress - action.stressRed),
        practicePoints: pointsManager.getBalance(),
        mood: action.mood || 'happy',
        lastFed: Date.now(),
      };
    });
  };

  // Direct Click Petting (무료 쓰다듬기)
  const handlePetTouch = () => {
    soundManager.play('success');
    triggerExpBadge(`💖 쓰담쓰담! (+3 EXP)`, 'text-pink-500 font-black');
    setPet((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 3),
      stress: Math.max(0, prev.stress - 2),
      exp: prev.exp + 3,
      mood: 'wink',
    }));
    setSpeechBubble('헤헤~ 쓰다듬어 주셔서 기분이 너무 좋아요! 💕');
  };


  // Expression Trigger with Dialog & Sound
  const handleTriggerMood = (mood: PetMood, speech: string) => {
    soundManager.playKeyClick(true);
    setPet((prev) => ({ ...prev, mood }));
    setSpeechBubble(speech);
  };

  // Theme Shop handlers
  const handleSelectTheme = (theme: TamagotchiThemeType) => {
    setPet((prev) => ({
      ...prev,
      homeTheme: theme,
    }));
  };

  const handleUnlockTheme = (theme: TamagotchiThemeType, cost: number) => {
    pointsManager.spendPoints(cost, `테마 해금`);
    setPet((prev) => {
      const existing = prev.unlockedThemes || ['warm_living'];
      const updatedThemes = existing.includes(theme) ? existing : [...existing, theme];
      return {
        ...prev,
        homeTheme: theme,
        unlockedThemes: updatedThemes,
        practicePoints: pointsManager.getBalance(),
      };
    });
  };

  // Room Decor Unlock handler
  const handleUnlockDecorItem = (itemId: string, cost: number) => {
    pointsManager.spendPoints(cost, `인테리어 소품 해금`);
    setPet((prev) => {
      const existing = prev.unlockedDecors || INITIAL_TAMAGOTCHI_STATE.unlockedDecors || [];
      const updatedDecors = existing.includes(itemId) ? existing : [...existing, itemId];
      return {
        ...prev,
        unlockedDecors: updatedDecors,
        practicePoints: pointsManager.getBalance(),
      };
    });
  };

  // Room Decor Save handler
  const handleSaveDecor = (newDecor: RoomDecorState) => {
    setPet((prev) => ({
      ...prev,
      roomDecor: newDecor,
    }));
    soundManager.playSuccess();
    setSpeechBubble('방 인테리어가 멋지게 바뀌었어요! 정말 마음에 들어요! ✨');
  };

  // Select / switch pet (preserves every pet's independent growth record)
  const handleSelectPet = (chosenId: TamagotchiPetId) => {
    const chosenDef = getTamagotchiPetDef(chosenId);
    const isFirstPick = !pet.hasChosenPet;
    const savedTarget = pet.pets?.[chosenId];

    if (pet.hasChosenPet && pet.selectedPetId === chosenId) {
      soundManager.play('pop');
      setShowPetPicker(false);
      return;
    }

    const switched = switchTamagotchiPet(pet, chosenId);
    setPet(switched);
    setPreviewStage(null);
    setActiveMission(null);
    setInputVal('');
    setShowPetPicker(false);

    if (savedTarget && (savedTarget.level > 1 || savedTarget.exp > 0)) {
      setSpeechBubble(
        `다시 만나서 반가워요! Lv.${savedTarget.level} ${chosenDef.name}와 이어서 함께 키워봐요! ${chosenDef.emoji}`
      );
    } else {
      setSpeechBubble(chosenDef.greeting);
    }

    if (isFirstPick) {
      soundManager.playSuccess();
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.55 } });
      } catch {}
    } else {
      soundManager.play('achievement');
    }
  };

  const handleResetPet = async () => {
    if (
      await askConfirm(
        `정말로 [${displayName}]를 1레벨 알 상태로 초기화하시겠습니까?\n(다른 펫의 성장 기록과 방 꾸미기 아이템은 그대로 유지됩니다.)`
      )
    ) {
      setPet((prev) => resetActiveTamagotchiPet(prev));
      setPreviewStage(null);
      setSpeechBubble(`${activePetDef.name}의 알이 새롭게 찾아왔어요! 따뜻하게 돌봐주세요 🥚✨`);
      setActiveMission(null);
    }
  };

  const activeStage = previewStage || currentStage;
  const stageInfo = STAGE_LABELS[currentStage];
  const displayName = pet.name || activePetDef.name;

  // Resolve 5 core state expressions (기본·행복·배고픔·졸림·아픔/슬픔)
  const activeExpression: PetExpressionKey = (() => {
    if (previewStage) return 'normal';
    if (pet.mood === 'crying' || pet.mood === 'stressed') return 'sad';
    if (pet.mood === 'hungry') return 'hungry';
    if (pet.mood === 'sleepy') return 'sleepy';
    if (
      pet.mood === 'ecstatic' ||
      pet.mood === 'excited' ||
      pet.mood === 'eating' ||
      pet.mood === 'wink' ||
      pet.mood === 'proud'
    ) {
      return 'happy';
    }
    // Stat-driven fallback when idle
    if (pet.stress >= 55) return 'sad';
    if (pet.hunger <= 30) return 'hungry';
    if (pet.happiness <= 35) return 'sleepy';
    if (pet.happiness >= 90 && pet.stress <= 15) return 'happy';
    return 'normal';
  })();

  const expressionInfo = EXPRESSION_META[activeExpression];

  // Show exact growth stage sprite on 'normal' (or while previewing stage), and expression sprite for live mood states
  const currentSpriteSrc =
    previewStage || activeExpression === 'normal'
      ? activePetDef.stages[activeStage]
      : activePetDef.moods[activeExpression];

  const getStageLabelShort = (lvl: number) => {
    const st = getPetStage(lvl);
    if (st === 'adult') return { icon: '👑', label: '어른' };
    if (st === 'teen') return { icon: '🧣', label: '어린이' };
    if (st === 'child') return { icon: '🌱', label: '아기' };
    return { icon: '🥚', label: '알' };
  };

  const raisedPetCount = TAMAGOTCHI_PETS.filter((p) => {
    if (pet.hasChosenPet && pet.selectedPetId === p.id) return true;
    return Boolean(pet.pets?.[p.id]);
  }).length;

  const renderPetCardsGrid = (isInitialScreen: boolean) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
      {TAMAGOTCHI_PETS.map((petDef) => {
        const isCurrent = pet.hasChosenPet && pet.selectedPetId === petDef.id;
        const savedRecord = isCurrent
          ? { level: pet.level, exp: pet.exp }
          : pet.pets?.[petDef.id];
        const hasRecord = Boolean(savedRecord);
        const cardLevel = savedRecord?.level ?? 1;
        const stageShort = getStageLabelShort(cardLevel);
        // Show the charming child-stage look by default, or the student's evolved adult sprite if already reached adult!
        const previewSpriteSrc =
          hasRecord && cardLevel >= 9
            ? petDef.stages.adult
            : petDef.stages.teen;

        return (
          <button
            key={petDef.id}
            type="button"
            onClick={() => handleSelectPet(petDef.id)}
            className={`group relative text-left rounded-2xl p-3 border-3 transition-all cursor-pointer flex flex-col justify-between bg-gradient-to-b ${petDef.cardTint} ${
              isCurrent
                ? 'border-[#b45309] ring-3 ring-amber-400/70 shadow-lg -translate-y-0.5'
                : 'border-[#c8a06b] hover:border-[#8f4c1a] hover:shadow-lg hover:-translate-y-0.5 shadow-sm'
            }`}
          >
            {/* Top status corner */}
            <div className="flex items-center justify-between gap-1 mb-1.5 min-h-[20px]">
              <span className="text-[11px] font-black text-[#6b3e19] truncate">
                {petDef.emoji} {petDef.species}
              </span>
              {isCurrent ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black shrink-0">
                  <Check className="w-3 h-3" />
                  선택됨
                </span>
              ) : hasRecord ? (
                <span className="px-1.5 py-0.5 rounded-md bg-[#4a2810] text-amber-200 text-[10px] font-black shrink-0">
                  Lv.{cardLevel} {stageShort.label}
                </span>
              ) : null}
            </div>

            {/* Pixel Sprite Showcase */}
            <div className="w-full aspect-square max-h-[116px] mx-auto my-1 rounded-xl bg-white/80 border-2 border-[#dfc39a] flex items-center justify-center p-2 shadow-inner overflow-hidden">
              <img
                src={previewSpriteSrc}
                alt={`${petDef.name} (${petDef.species})`}
                className="w-full h-full object-contain tg-pixel transition-transform duration-200 group-hover:scale-110"
                referrerPolicy="no-referrer"
                draggable={false}
              />
            </div>

            {/* Pet Name & Tagline */}
            <div className="mt-2 space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-sm text-[#3a1f0a] tracking-tight">
                  {petDef.name}
                </span>
                {isCurrent && (
                  <span className="text-[10px] font-extrabold text-amber-800">
                    Lv.{pet.level} {stageShort.icon}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-bold text-[#6e4b2a] leading-snug line-clamp-2 min-h-[30px]">
                {petDef.tagline}
              </p>
            </div>

            {/* Action Footer Bar */}
            <div
              className={`mt-2.5 py-1.5 px-2 rounded-xl text-center text-[11px] font-black transition-colors ${
                isCurrent
                  ? 'bg-amber-600 text-white'
                  : hasRecord
                  ? 'bg-[#6b3e19] group-hover:bg-[#4a2810] text-amber-100'
                  : 'bg-amber-500 group-hover:bg-amber-600 text-white shadow-xs'
              }`}
            >
              {isCurrent
                ? '현재 키우는 중'
                : hasRecord
                ? '이어서 키우기'
                : isInitialScreen
                ? '이 펫으로 시작!'
                : '이 펫 키우기'}
            </div>
          </button>
        );
      })}
    </div>
  );

  // ================= FIRST-TIME STUDENT: INITIAL 10-PET SELECTION SCREEN =================
  if (!pet.hasChosenPet) {
    return (
      <div className="tg space-y-5 animate-in fade-in duration-300 max-w-5xl mx-auto pb-10">
        {isPlayground && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>플레이그라운드 홈</span>
            </button>
            <span className="font-bold text-sm text-slate-800">🏡 타자 다마고치 케어 룸</span>
            <div className="w-16" />
          </div>
        )}

        <div className="rounded-3xl p-5 sm:p-7 border-4 border-[#6b3e19] bg-gradient-to-b from-[#fff7e2] via-[#fdf3d7] to-[#f7e5be] shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#dfc39a] pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#6b3e19] text-amber-100 text-xs font-black">
                <PawPrint className="w-3.5 h-3.5 text-amber-300" />
                <span>다마고치 펫 도감 · 총 10종</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#3a1f0a] tracking-tight">
                🐾 함께 키울 나만의 픽셀 펫을 골라주세요!
              </h1>
              <p className="text-xs sm:text-sm font-bold text-[#6e4b2a]">
                마음에 드는 펫을 선택하면 🥚 알부터 👑 어른까지 키울 수 있어요. 나중에 언제든 다른 펫으로 바꿔 키울 수도 있고, 각 펫의 기록은 따로 저장돼요!
              </p>
            </div>
            <div className="bg-white/90 border-2 border-[#c8a06b] px-3.5 py-2 rounded-xl flex items-center gap-1.5 text-[#5a3210] font-black text-xs shrink-0 self-start sm:self-center">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>보유 포인트 {(pet.practicePoints || 0).toLocaleString()} P</span>
            </div>
          </div>

          {renderPetCardsGrid(true)}
        </div>
      </div>
    );
  }

  return (
    <div className="tg space-y-5 animate-in fade-in duration-300 max-w-5xl mx-auto pb-10">
      {/* ================= PLAYGROUND MODE HEADER ================= */}
      {isPlayground && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>플레이그라운드 홈</span>
          </button>
          <span className="font-bold text-sm text-slate-800">🏡 타자 다마고치 케어 룸</span>
          <div className="w-16" />
        </div>
      )}

      {/* ================= TOP HEADER BANNER ================= */}
      <div className="tg-head bg-gradient-to-r from-amber-100 via-orange-50 to-rose-100 rounded-3xl p-4 sm:p-6 border-4 border-amber-200 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-xl bg-amber-600 text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <span>{activePetDef.emoji}</span>
              <span>{activePetDef.species} · {displayName}</span>
            </span>
            <span className="text-xs font-bold text-amber-900/80 bg-amber-200/70 px-2.5 py-0.5 rounded-lg">
              🥚 알 → 🌱 아기 → 🧣 어린이 → 👑 어른
            </span>
            {/* Practice Points Display */}
            <div className="bg-amber-100/90 border-2 border-amber-400 px-3 py-0.5 rounded-xl flex items-center gap-1 text-amber-950 font-black text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>보유 포인트: <strong>{(pet.practicePoints || 0).toLocaleString()}</strong> P</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏡 아늑한 나무집 다마고치</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            먹이 주기·놀아 주기·씻기기·방 꾸미기로 {activePetDef.species} <strong>{displayName}</strong>를 알에서 어른까지 키워보세요!
          </p>
        </div>

        {/* Action Buttons: Pet Picker, Theme Shop, Room Decor, Reset */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Pet Picker Button */}
          <button
            type="button"
            onClick={() => {
              soundManager.play('pop');
              setShowPetPicker(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-amber-400"
          >
            <span>🐾 펫 고르기</span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-800/70 text-[10px] font-black text-amber-100">
              10종
            </span>
          </button>

          {/* Theme Shop Button */}
          <button
            type="button"
            onClick={() => setShowThemeShop(true)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-indigo-400"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span>배경 테마 상점</span>
          </button>

          {/* Room Decor Button */}
          <button
            type="button"
            onClick={() => setShowRoomDecor(true)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-emerald-400"
          >
            <Paintbrush className="w-4 h-4 text-emerald-200" />
            <span>방 꾸미기</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetPet}
            title="현재 펫 초기화"
            className="p-2.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= MAIN HOME LIVING ROOM STAGE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cozy Home Living Room Stage (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Home Living Room Container */}
          <div className="tg-screen relative rounded-3xl overflow-hidden border-4 border-[#4a2810] shadow-2xl bg-[#6f4421] flex flex-col justify-between min-h-[460px]">
            
            {/* ================= 16-BIT PIXEL WOODEN COTTAGE ROOM / CUSTOM THEME ================= */}
            {/* 방 배경 = 배경 테마 그림(제미나이), 그 위에 내가 고른 가구·소품 */}
            <img
              key={pet.homeTheme || 'warm_living'}
              src={THEME_PICTURES[pet.homeTheme || 'warm_living'] || THEME_PICTURES.warm_living}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none select-none"
              style={{ imageRendering: 'pixelated' }}
              draggable={false}
            />
            <TamagotchiThemeBackground theme={pet.homeTheme} decor={pet.roomDecor} itemsOnly />

            {/* ================= TOP HUD (Pet Stats, Stage, Info) ================= */}
            <div className="relative z-10 p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-[#fdf5dd]/92 border-b-3 border-[#4a2810] shadow-xs">
              {/* Pet Identity & Stage */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-400 flex items-center justify-center p-1 overflow-hidden shadow-inner shrink-0">
                  <img
                    src={activePetDef.stages[currentStage]}
                    alt={`${displayName} ${stageInfo.title}`}
                    className="w-full h-full object-contain tg-pixel"
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-black text-sm sm:text-base text-slate-800 tracking-tight">
                      {displayName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[11px] shadow-xs">
                      Lv.{pet.level}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[11px] border border-rose-200">
                      {stageInfo.icon} {stageInfo.title}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>청결도 {pet.cleanliness}%</span>
                    <span>•</span>
                    <span className="text-amber-700">스트레스 {pet.stress}%</span>
                  </p>
                </div>
              </div>

              {/* Real-time Status Bars */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold">
                {/* Happiness */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-600 mb-0.5 gap-2">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      <span>행복도</span>
                    </span>
                    <span>{pet.happiness}%</span>
                  </div>
                  <div className="w-20 bg-rose-100 h-2 rounded-full overflow-hidden border border-rose-200">
                    <div className="bg-rose-500 h-full transition-all" style={{ width: `${pet.happiness}%` }}></div>
                  </div>
                </div>

                {/* Hunger */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-600 mb-0.5 gap-2">
                    <span className="flex items-center gap-1">
                      <Utensils className="w-3.5 h-3.5" />
                      <span>포만감</span>
                    </span>
                    <span>{pet.hunger}%</span>
                  </div>
                  <div className="w-20 bg-amber-100 h-2 rounded-full overflow-hidden border border-amber-200">
                    <div className="bg-amber-500 h-full transition-all" style={{ width: `${pet.hunger}%` }}></div>
                  </div>
                </div>

                {/* EXP */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-600 mb-0.5 gap-2">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>성장 EXP</span>
                    </span>
                    <span>{pet.exp}/{pet.maxExp}</span>
                  </div>
                  <div className="w-20 bg-indigo-100 h-2 rounded-full overflow-hidden border border-indigo-200">
                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${Math.min(100, (pet.exp / pet.maxExp) * 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= MIDDLE PIXEL PET STAGE & SPEECH ================= */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center px-3 py-5 sm:p-4 sm:py-7">
              {/* Dynamic Speech Bubble */}
              <div className="relative mb-3 bg-white/95 backdrop-blur-xs rounded-2xl px-4 py-2 sm:px-5 sm:py-2.5 border-2 border-amber-800/80 shadow-lg max-w-md text-center animate-in zoom-in-95 duration-200">
                <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                  {speechBubble}
                </p>
                {/* Pointer arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-amber-800/80 rotate-45"></div>
              </div>

              {/* 16-bit Original Pixel Pet Sprite */}
              <div className="relative flex flex-col items-center">
                {/* Falling Snack Animation on care/typing success */}
                {foodDropAnim && (
                  <div className="absolute -top-10 animate-bounce z-20 text-2xl sm:text-3xl pointer-events-none">
                    🍖 ✨ 🍓
                  </div>
                )}

                {/* Floating EXP Badges */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                  {floatingBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`absolute top-0 -translate-x-1/2 animate-float-exp font-black text-xs sm:text-sm drop-shadow-md whitespace-nowrap bg-white/92 px-3 py-1 rounded-full border-2 border-amber-400 shadow-md ${badge.color}`}
                      style={{ left: `${badge.left}%` }}
                    >
                      {badge.text}
                    </div>
                  ))}
                </div>

                <div
                  onClick={handlePetTouch}
                  title="클릭해서 쓰다듬어주세요! 💕 (행복도 & EXP UP)"
                  className="cursor-pointer group relative flex flex-col items-center"
                >
                  <div
                    className={`tg-pet-breathe ${
                      isLevelUp ? 'tg-pet-pop' : isGrowing ? 'tg-pet-hop' : ''
                    }`}
                  >
                    <img
                      src={currentSpriteSrc}
                      alt={`${displayName} (${STAGE_LABELS[activeStage].title} · ${expressionInfo.label})`}
                      className="tg-pet-sprite tg-pixel select-none"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-pink-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap pointer-events-none">
                    💖 클릭해서 쓰담쓰담!
                  </div>
                </div>

                {/* Soft Floor Shadow */}
                <div className="w-28 h-4 bg-amber-950/28 rounded-full mx-auto -mt-2 filter blur-[2px] pointer-events-none"></div>

                {/* Mood Badge, Stage Preview Reset & Expression Toggle */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {previewStage ? (
                      <button
                        type="button"
                        onClick={() => setPreviewStage(null)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-full border border-amber-600 shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>[{STAGE_LABELS[previewStage].title}] 미리보기 중 (현재로 복귀)</span>
                      </button>
                    ) : (
                      <span
                        className={`px-3 py-1 font-black text-xs rounded-full border shadow-xs ${expressionInfo.badgeClass}`}
                      >
                        {expressionInfo.badge}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowExpressionPanel((p) => !p)}
                      className="px-2.5 py-1 bg-white/92 hover:bg-white text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
                      <span>{showExpressionPanel ? '표정 닫기' : '표정 보기 (5종)'}</span>
                    </button>
                  </div>

                  {/* 5 State Expressions Dock (기본·행복·배고픔·졸림·아픔/슬픔) */}
                  {showExpressionPanel && (
                    <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl border-2 border-indigo-200 shadow-lg flex flex-wrap items-center justify-center gap-1.5 max-w-md animate-in zoom-in-95 duration-150">
                      {(['normal', 'happy', 'hungry', 'sleepy', 'sad'] as PetExpressionKey[]).map((key) => {
                        const item = EXPRESSION_META[key];
                        const isSelected = !previewStage && activeExpression === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setPreviewStage(null);
                              handleTriggerMood(item.moodValue, item.speech);
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ================= ACTIVE TYPING MISSION BOX ================= */}
            {activeMission && (
              <div className="relative z-10 m-4 bg-white/95 rounded-2xl p-4 border-3 border-amber-500 shadow-2xl animate-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-black text-xs text-amber-800">
                    <span className="text-base">{activeMission.categoryIcon}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300">
                      [{activeMission.categoryLabel}]
                    </span>
                    <span className="text-slate-600 font-bold">시간 안에 문장을 빠르고 정확하게 입력하세요!</span>
                  </div>
                  {/* Countdown */}
                  <div className="flex items-center gap-1.5 text-xs font-mono font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeLeft}초 남음</span>
                  </div>
                </div>

                {/* Target Prompt Box */}
                <div className="bg-slate-900 text-yellow-300 p-3 rounded-xl text-center font-mono font-black text-base sm:text-lg border-2 border-slate-700 shadow-inner">
                  {activeMission.prompt}
                </div>

                {/* Time Progress Bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / activeMission.timeLimit) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* ================= CARE MODE TABS (포인트 원클릭 케어 vs 타자 미션) ================= */}
          <div className="bg-white rounded-3xl p-2 border-3 border-amber-300 shadow-md">
            <div className="flex items-center gap-1.5 p-1 bg-amber-100/60 rounded-2xl">
              <button
                type="button"
                onClick={() => setCareMode('point')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  careMode === 'point'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md scale-[1.01]'
                    : 'text-amber-900 hover:bg-amber-200/50'
                }`}
              >
                <Coins className="w-4 h-4 text-yellow-200" />
                <span>🪙 포인트 원클릭 케어 (타자 안 치고 즉시 돌보기)</span>
              </button>

              <button
                type="button"
                onClick={() => setCareMode('typing')}
                className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  careMode === 'typing'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md scale-[1.01]'
                    : 'text-amber-900 hover:bg-amber-200/50'
                }`}
              >
                <Keyboard className="w-4 h-4 text-indigo-200" />
                <span>⌨️ 타자 미션 모드 (문장 입력으로 케어)</span>
              </button>
            </div>
          </div>

          {/* ================= POINT-BASED INSTANT CARE CONTROLS (타자 없이 포인트로!) ================= */}
          {careMode === 'point' ? (
            <div className="space-y-3">
              <div className="bg-amber-50/80 rounded-2xl p-3 border-2 border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>타자를 치지 않아도 모아둔 포인트로 즉시 밥을 주고 레벨업 시킬 수 있습니다!</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-black text-amber-800 bg-white px-2.5 py-1 rounded-xl border border-amber-300">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>{(pet.practicePoints || 0).toLocaleString()} P 보유</span>
                </div>
              </div>

              {/* 6 Point Care Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Meal */}
                <button
                  type="button"
                  onClick={() => handlePointCare({
                    name: '맛있는 식사',
                    cost: 100,
                    exp: 30,
                    happy: 20,
                    hunger: 35,
                    stressRed: 10,
                    speech: `냠냠! 영양 가득 맛있는 식사를 먹었어요! (+30 EXP, 배부름+35) 🍖`,
                    mood: 'eating',
                  })}
                  className="p-3.5 bg-gradient-to-b from-amber-50 via-orange-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 border-2 border-orange-300 rounded-2xl shadow-sm text-left flex items-center justify-between cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🍖</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-orange-950">맛있는 식사</div>
                      <div className="text-[10px] font-bold text-orange-700">배부름+35 • EXP+30</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-orange-500 text-white font-mono font-black text-xs shadow-xs whitespace-nowrap">
                    100 P
                  </span>
                </button>

                {/* 2. Snack */}
                <button
                  type="button"
                  onClick={() => handlePointCare({
                    name: '영양 츄르 간식',
                    cost: 50,
                    exp: 15,
                    happy: 25,
                    hunger: 20,
                    stressRed: 15,
                    speech: `달콤한 츄르 간식 꿀꺽! 기분이 정말 좋아요~ (+15 EXP, 스트레스-15) 🍎`,
                    mood: 'ecstatic',
                  })}
                  className="p-3.5 bg-gradient-to-b from-rose-50 via-pink-50 to-rose-100 hover:from-rose-100 hover:to-pink-200 border-2 border-rose-300 rounded-2xl shadow-sm text-left flex items-center justify-between cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🍎</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-rose-950">영양 츄르</div>
                      <div className="text-[10px] font-bold text-rose-700">행복도+25 • 간식+20</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500 text-white font-mono font-black text-xs shadow-xs whitespace-nowrap">
                    50 P
                  </span>
                </button>

                {/* 3. Play */}
                <button
                  type="button"
                  onClick={() => handlePointCare({
                    name: '신나는 공놀이',
                    cost: 80,
                    exp: 25,
                    happy: 40,
                    hunger: -5,
                    stressRed: 25,
                    speech: `우와! 장난감 공놀이 최고로 신나요!! 어깨춤이 절로! (+25 EXP, 행복+40) 🎾`,
                    mood: 'excited',
                  })}
                  className="p-3.5 bg-gradient-to-b from-sky-50 via-blue-50 to-blue-100 hover:from-sky-100 hover:to-blue-200 border-2 border-blue-300 rounded-2xl shadow-sm text-left flex items-center justify-between cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🎾</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-blue-950">신나는 공놀이</div>
                      <div className="text-[10px] font-bold text-blue-700">행복도+40 • 스트레스-25</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-500 text-white font-mono font-black text-xs shadow-xs whitespace-nowrap">
                    80 P
                  </span>
                </button>

                {/* 4. Bath */}
                <button
                  type="button"
                  onClick={() => handlePointCare({
                    name: '거품 목욕 & 털 빗기',
                    cost: 60,
                    exp: 20,
                    happy: 20,
                    hunger: 0,
                    stressRed: 20,
                    clean: 40,
                    speech: `보글보글 거품 목욕 끝! 털이 뽀송뽀송 윤기가 흘러요~ 🫧`,
                    mood: 'wink',
                  })}
                  className="p-3.5 bg-gradient-to-b from-teal-50 via-emerald-50 to-teal-100 hover:from-teal-100 hover:to-emerald-200 border-2 border-teal-300 rounded-2xl shadow-sm text-left flex items-center justify-between cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">🫧</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-teal-950">거품 목욕</div>
                      <div className="text-[10px] font-bold text-teal-700">청결도+40 • 뽀송뽀송</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white font-mono font-black text-xs shadow-xs whitespace-nowrap">
                    60 P
                  </span>
                </button>

                {/* 5. Special Training Growth */}
                <button
                  type="button"
                  onClick={() => handlePointCare({
                    name: '지능 레벨업 특훈',
                    cost: 120,
                    exp: 70,
                    happy: 15,
                    hunger: -10,
                    stressRed: 10,
                    speech: `똑똑해진 기분! 폭풍 성장하여 레벨업에 다가갔어요! (+70 EXP) 📚`,
                    mood: 'proud',
                  })}
                  className="p-3.5 bg-gradient-to-b from-purple-50 via-indigo-50 to-purple-100 hover:from-purple-100 hover:to-indigo-200 border-2 border-indigo-300 rounded-2xl shadow-sm text-left flex items-center justify-between cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">📚</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-indigo-950">레벨업 특훈</div>
                      <div className="text-[10px] font-bold text-indigo-700">대량 EXP+70 획득</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-600 text-white font-mono font-black text-xs shadow-xs whitespace-nowrap">
                    120 P
                  </span>
                </button>

                {/* 6. Nap */}
                <button
                  type="button"
                  onClick={() => handlePointCare({
                    name: '포근한 낮잠',
                    cost: 30,
                    exp: 10,
                    happy: 15,
                    hunger: -5,
                    stressRed: 100,
                    speech: `새근새근 꿀잠을 자고 일어났어요! 스트레스가 0%로 말끔히 회복됐어요~ zZZ 💤`,
                    mood: 'sleepy',
                  })}
                  className="p-3.5 bg-gradient-to-b from-slate-50 via-amber-50 to-slate-100 hover:from-slate-100 hover:to-amber-100 border-2 border-slate-300 rounded-2xl shadow-sm text-left flex items-center justify-between cursor-pointer transition-all active:scale-95 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl group-hover:scale-110 transition-transform">💤</span>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-slate-800">포근한 낮잠</div>
                      <div className="text-[10px] font-bold text-slate-600">스트레스 0% 완전 회복</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-600 text-white font-mono font-black text-xs shadow-xs whitespace-nowrap">
                    30 P
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= TYPING MISSION MODE ================= */
            <div className="space-y-3">
              {/* ================= TYPING INPUT BAR ================= */}
              <div className="bg-white rounded-3xl p-3.5 sm:p-4 border-3 border-amber-300 shadow-lg flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  disabled={!activeMission}
                  placeholder={
                    activeMission
                      ? '위의 미션 문장을 빠르고 정확하게 타이핑하세요!'
                      : '아래 5대 타자 훈련 버튼(식사/놀이/목욕/특훈/휴식)을 눌러 미션을 시작하세요!'
                  }
                  className="flex-1 px-4 py-3 text-sm sm:text-base font-black rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 outline-hidden bg-amber-50/30 text-slate-800 placeholder-slate-400"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />

                {activeMission ? (
                  <button
                    onClick={() => handleMissionFail('giveup')}
                    className="px-4 py-3 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-black text-xs rounded-2xl border border-slate-300 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    포기하기
                  </button>
                ) : (
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-black text-amber-700 px-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>미션 선택 대기 중</span>
                  </div>
                )}
              </div>

              {/* ================= 5 MAIN TYPING MISSIONS CONTROLS ================= */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                {/* 1. Food */}
                <button
                  onClick={() => startMission('food')}
                  disabled={Boolean(activeMission)}
                  className="p-3 bg-gradient-to-b from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 border-2 border-orange-300 rounded-2xl shadow-sm text-center flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-2xl">🍖</span>
                  <span className="font-black text-xs text-orange-950">간식 주기</span>
                  <span className="text-[10px] font-bold text-orange-700">배부름+EXP</span>
                </button>

                {/* 2. Play */}
                <button
                  onClick={() => startMission('play')}
                  disabled={Boolean(activeMission)}
                  className="p-3 bg-gradient-to-b from-sky-50 to-blue-100 hover:from-sky-100 hover:to-blue-200 border-2 border-blue-300 rounded-2xl shadow-sm text-center flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-2xl">🎾</span>
                  <span className="font-black text-xs text-blue-950">함께 놀기</span>
                  <span className="text-[10px] font-bold text-blue-700">행복도+기분UP</span>
                </button>

                {/* 3. Clean */}
                <button
                  onClick={() => startMission('clean')}
                  disabled={Boolean(activeMission)}
                  className="p-3 bg-gradient-to-b from-teal-50 to-emerald-100 hover:from-teal-100 hover:to-emerald-200 border-2 border-teal-300 rounded-2xl shadow-sm text-center flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="text-2xl">🫧</span>
                  <span className="font-black text-xs text-teal-950">거품 목욕</span>
                  <span className="text-[10px] font-bold text-teal-700">스트레스 해소</span>
                </button>

                {/* 4. Study / Fast Growth */}
                <button
                  onClick={() => startMission('study')}
                  disabled={Boolean(activeMission)}
                  className="p-3 bg-gradient-to-b from-purple-50 to-indigo-100 hover:from-purple-100 hover:to-indigo-200 border-2 border-indigo-300 rounded-2xl shadow-sm text-center flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50 col-span-1"
                >
                  <span className="text-2xl">📚</span>
                  <span className="font-black text-xs text-indigo-950">성장 특훈</span>
                  <span className="text-[10px] font-bold text-indigo-700">대량 EXP 획득</span>
                </button>

                {/* 5. Sleep */}
                <button
                  onClick={() => startMission('sleep')}
                  disabled={Boolean(activeMission)}
                  className="p-3 bg-gradient-to-b from-pink-50 to-rose-100 hover:from-pink-100 hover:to-rose-200 border-2 border-rose-300 rounded-2xl shadow-sm text-center flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95 disabled:opacity-50 col-span-2 sm:col-span-1"
                >
                  <span className="text-2xl">💤</span>
                  <span className="font-black text-xs text-rose-950">포근한 낮잠</span>
                  <span className="text-[10px] font-bold text-rose-700">스트레스 0 초기화</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Growth Stages & Expression Gallery (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Growth Stage Progression Card (알 → 아기 → 어린이 → 어른) */}
          <div className="bg-white rounded-3xl p-5 border-3 border-amber-200 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>성장 단계 (클릭 미리보기)</span>
              </span>
              <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                현재 Lv.{pet.level} ({stageInfo.title})
              </span>
            </div>

            <div className="space-y-2">
              {(['baby', 'child', 'teen', 'adult'] as PetGrowthStage[]).map((st) => {
                const info = STAGE_LABELS[st];
                const isCurrent = currentStage === st;
                const isPreview = previewStage === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      soundManager.play('pop');
                      if (previewStage === st) {
                        setPreviewStage(null);
                      } else {
                        setPreviewStage(st);
                        setSpeechBubble(`[${info.title}] ${info.desc}`);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      isPreview
                        ? 'bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-400'
                        : isCurrent
                        ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                        : 'bg-slate-50 hover:bg-amber-50/40 border-slate-200 opacity-85'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center p-1 shadow-inner shrink-0 overflow-hidden">
                      <img
                        src={activePetDef.stages[st]}
                        alt={`${displayName} ${info.title}`}
                        className="w-full h-full object-contain tg-pixel"
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-800 flex items-center gap-1">
                          <span>{info.icon}</span>
                          <span>{info.title}</span>
                        </span>
                        <span className="text-[10px] font-black text-slate-500">{info.badge}</span>
                      </div>
                      <p className="text-[10px] text-amber-900/80 font-medium leading-tight mt-0.5 line-clamp-1">
                        {info.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pet Mood Expressions Card (기본·행복·배고픔·졸림·아픔/슬픔) */}
          <div className="bg-white rounded-3xl p-5 border-3 border-amber-200 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{displayName} 상태별 표정</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500">누르면 표정 변경</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {(['normal', 'happy', 'hungry', 'sleepy', 'sad'] as PetExpressionKey[]).map((key) => {
                const item = EXPRESSION_META[key];
                const thumbSrc =
                  key === 'normal'
                    ? activePetDef.stages[currentStage]
                    : activePetDef.moods[key];
                const isSelected = !previewStage && activeExpression === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPreviewStage(null);
                      handleTriggerMood(item.moodValue, item.speech);
                    }}
                    title={`${item.label} 표정 보기`}
                    className={`p-1.5 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-300 border-amber-600 scale-105 shadow-sm'
                        : 'bg-amber-50/60 hover:bg-amber-100 border-amber-200'
                    }`}
                  >
                    <img
                      src={thumbSrc}
                      alt={item.label}
                      className="w-10 h-10 object-contain tg-pixel"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                    <span className="text-[9px] font-black text-slate-800 truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 10-PET PICKER MODAL ================= */}
      {showPetPicker && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
          onClick={() => setShowPetPicker(false)}
        >
          <div
            className="bg-gradient-to-b from-[#fff7e2] via-[#fdf3d7] to-[#f7e5be] rounded-3xl p-4 sm:p-6 border-4 border-[#6b3e19] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-[#dfc39a] pb-3.5">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#6b3e19] text-amber-100 text-[11px] font-black">
                    <PawPrint className="w-3.5 h-3.5 text-amber-300" />
                    <span>펫 도감 · 10종</span>
                  </span>
                  <span className="text-xs font-extrabold text-[#7a4b1f]">
                    키워본 펫 {raisedPetCount} / {TAMAGOTCHI_PETS.length}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-[#3a1f0a]">
                  🐾 함께 키울 펫 고르기
                </h2>
                <p className="text-xs font-bold text-[#6e4b2a]">
                  다른 펫으로 바꿔도 키우던 펫의 레벨과 성장 기록은 그대로 보관돼요!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPetPicker(false)}
                aria-label="닫기"
                className="p-2 rounded-xl bg-white/85 hover:bg-white text-[#5a3210] border-2 border-[#c8a06b] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {renderPetCardsGrid(false)}
          </div>
        </div>
      )}

      {/* ================= EVOLUTION CONGRATULATIONS MODAL ================= */}
      {showEvolutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-amber-100 via-white to-rose-100 rounded-3xl p-6 sm:p-8 border-4 border-amber-400 shadow-2xl max-w-md w-full text-center space-y-4 animate-in zoom-in-95">
            <div className="text-4xl animate-bounce">🎉 👑 🌟</div>
            <h2 className="text-xl font-black text-slate-900">
              축하합니다! 한 단계 성장했어요!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {displayName}가 <span className="text-amber-700 font-black">[{STAGE_LABELS[evolvedStage].title}]</span> 단계로 성장했어요!
            </p>

            <div className="py-3 flex justify-center">
              <div className="p-4 rounded-3xl bg-amber-200/50 border-4 border-amber-300 shadow-inner">
                <img
                  src={activePetDef.stages[evolvedStage]}
                  alt={STAGE_LABELS[evolvedStage].title}
                  className="w-36 h-36 object-contain tg-pixel"
                  referrerPolicy="no-referrer"
                  draggable={false}
                />
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {STAGE_LABELS[evolvedStage].desc}
            </p>

            <button
              type="button"
              onClick={() => setShowEvolutionModal(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-2xl shadow-md transition-all cursor-pointer"
            >
              계속 함께 키우기! 💖
            </button>
          </div>
        </div>
      )}

      {/* ================= THEME SHOP MODAL ================= */}
      {showThemeShop && (
        <ThemeShopModal
          isOpen={showThemeShop}
          currentTheme={pet.homeTheme || 'warm_living'}
          unlockedThemes={pet.unlockedThemes || ['warm_living']}
          userPoints={pet.practicePoints || 0}
          onSelectTheme={handleSelectTheme}
          onUnlockTheme={handleUnlockTheme}
          onClose={() => setShowThemeShop(false)}
        />
      )}

      {/* ================= ROOM DECOR MODAL ================= */}
      {showRoomDecor && (
        <RoomDecorModal
          isOpen={showRoomDecor}
          decor={pet.roomDecor || INITIAL_TAMAGOTCHI_STATE.roomDecor!}
          unlockedDecors={pet.unlockedDecors || INITIAL_TAMAGOTCHI_STATE.unlockedDecors}
          userPoints={pet.practicePoints || 0}
          onSaveDecor={handleSaveDecor}
          onUnlockItem={handleUnlockDecorItem}
          onClose={() => setShowRoomDecor(false)}
          petName={displayName}
        />
      )}
    </div>
  );
};
