import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/sound';
import { 
  UserSession, 
  TamagotchiState, 
  AnimalPetType, 
  PetGrowthStage, 
  TamagotchiThemeType, 
  PetMood, 
  RoomDecorState 
} from '../../types';
import { AnimalPet, PET_SPECIES_INFO } from '../AnimalPet';
import { TamagotchiThemeBackground } from '../TamagotchiThemeBackground';
import { ThemeShopModal } from '../modals/ThemeShopModal';
import { RoomDecorModal } from '../modals/RoomDecorModal';
import { pointsManager } from '../../utils/pointsManager';
import { 
  Heart, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  Award, 
  Utensils, 
  Smile, 
  Moon, 
  BookOpen, 
  Zap, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Home,
  Sun,
  Palette,
  ChevronRight,
  TrendingUp,
  Gift,
  RefreshCw,
  Trophy,
  Volume2,
  Coins,
  Paintbrush,
  SmilePlus,
  ArrowLeft,
  Keyboard
} from 'lucide-react';
import { PlaygroundHeader } from './playground/PlaygroundHeader';

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
    timeLimit: 8,
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
    timeLimit: 9,
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
    timeLimit: 10,
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
    timeLimit: 9,
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
    timeLimit: 11,
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
    timeLimit: 10,
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
    timeLimit: 11,
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
    timeLimit: 13,
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
    timeLimit: 14,
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
    timeLimit: 11,
    rewardExp: 20,
    rewardHappy: 15,
    rewardHunger: -5,
    stressReduction: 60,
    successMessage: '포근하게 푹 자고 일어나 스트레스가 싹 날아갔어요! 💤🌙',
    failMessage: '잠투정하느라 잠을 설쳤어요 힝... 🥺',
  },
];

const INITIAL_TAMAGOTCHI: TamagotchiState = {
  name: '초롱이',
  petType: 'shiba',
  level: 1,
  exp: 0,
  maxExp: 100,
  happiness: 80,
  hunger: 70,
  stress: 10,
  cleanliness: 90,
  totalMissionsSuccess: 0,
  totalMissionsFailed: 0,
  mood: 'happy',
  lastFed: Date.now(),
  lastPlayed: Date.now(),
  homeTheme: 'warm_living',
  unlockedThemes: ['warm_living'],
  practicePoints: 200, // Initial bonus practice points for decoration & themes
  unlockedDecors: [
    'warm_cream',
    'wood_oak',
    'sunny_sky',
    'circle_sun',
    'cozy_sofa',
    'family_photo',
    'play_ball',
    'warm_pendant',
    'none',
  ],
  roomDecor: {
    wallpaper: 'warm_cream',
    flooring: 'wood_oak',
    rug: 'circle_sun',
    windowView: 'sunny_sky',
    wallDecor: 'family_photo',
    furniture: 'cozy_sofa',
    floorToy: 'play_ball',
    lighting: 'warm_pendant',
  },
};

export const TamagotchiView: React.FC<TamagotchiViewProps> = ({
  currentUser,
  onOpenProfile,
  isPlayground = false,
  onBack,
}) => {
  // Care mode: 'point' (타자 안 치고 포인트로 즉시 돌보기) or 'typing' (타자 미션 모드)
  const [careMode, setCareMode] = useState<'point' | 'typing'>('point');

  // Load saved pet state
  const [pet, setPet] = useState<TamagotchiState>(() => {
    try {
      const saved = localStorage.getItem('tamagotchi_animal_pet_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_TAMAGOTCHI,
          ...parsed,
          unlockedThemes: parsed.unlockedThemes || ['warm_living'],
          unlockedDecors: parsed.unlockedDecors || INITIAL_TAMAGOTCHI.unlockedDecors,
          practicePoints: parsed.practicePoints ?? 200,
          roomDecor: {
            ...INITIAL_TAMAGOTCHI.roomDecor!,
            ...(parsed.roomDecor || {}),
          },
        };
      }
    } catch {}
    return INITIAL_TAMAGOTCHI;
  });

  // Modals state
  const [showPetPicker, setShowPetPicker] = useState(false);
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
    '반가워요 주인님! 타자 연습으로 맛있는 간식을 주고 멋진 청년 동물로 키워주세요! 💖'
  );
  const [foodDropAnim, setFoodDropAnim] = useState(false);

  // Quick training typing mode (free typing growth)
  const [freeText, setFreeText] = useState('');
  const [freeFeedCount, setFreeFeedCount] = useState(0);

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

  // Determine stage from level:
  // 1 ~ 3: baby (아기)
  // 4 ~ 6: child (유아기)
  // 7 ~ 9: teen (청소년기)
  // 10+: adult (청년기 / 성체)
  const getPetStage = (lvl: number): PetGrowthStage => {
    if (lvl >= 10) return 'adult';
    if (lvl >= 7) return 'teen';
    if (lvl >= 4) return 'child';
    return 'baby';
  };

  const currentStage = getPetStage(pet.level);

  // Stage labels and descriptions
  const STAGE_LABELS: Record<PetGrowthStage, { title: string; badge: string; desc: string; icon: string }> = {
    baby: {
      title: '아기 (Baby)',
      badge: 'Lv.1 ~ 3',
      desc: '쪽쪽이를 문 사랑스러운 아기 시절! 보살핌이 많이 필요해요.',
      icon: '🍼',
    },
    child: {
      title: '유아기 (Child)',
      badge: 'Lv.4 ~ 6',
      desc: '노란 유치원 모자를 쓰고 호기심 가득 탐색하는 시기!',
      icon: '🎒',
    },
    teen: {
      title: '청소년기 (Teen)',
      badge: 'Lv.7 ~ 9',
      desc: '헤드폰과 반다나를 착용하고 활기 넘치는 청소년기!',
      icon: '🎧',
    },
    adult: {
      title: '청년기 / 성체 (Adult)',
      badge: 'Lv.10+ 완벽 성장',
      desc: '황금 왕관과 챔피언 메달을 수여받은 늠름하고 멋진 청년!',
      icon: '👑',
    },
  };

  // Save pet to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tamagotchi_animal_pet_v2', JSON.stringify(pet));
    } catch {}
  }, [pet]);

  // Sync when practice points or state changes elsewhere
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setPet((prev) => ({
          ...prev,
          ...e.detail,
          unlockedThemes: e.detail.unlockedThemes || prev.unlockedThemes || ['warm_living'],
          unlockedDecors: e.detail.unlockedDecors || prev.unlockedDecors || INITIAL_TAMAGOTCHI.unlockedDecors,
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
    const earnedPoints = 35;
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
    setSpeechBubble('헤헤~ 쓰다듬어 주셔서 기분이 너무 좋아요! 🐾💕');
  };

  // Quick Free-Typing Snack Feed
  const handleFreeType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFreeText(val);
    soundManager.playKeyClick(true);

    if (val.length >= 6) {
      // Trigger growth transform animation & floating badge
      setIsGrowing(true);
      const earnedPoints = 5;
      pointsManager.addPoints(earnedPoints, '자유 타자 간식 급여');
      triggerExpBadge(`+10 EXP ✨ (+${earnedPoints}P)`, 'text-amber-500');
      setTimeout(() => setIsGrowing(false), 750);

      // Feed instant snack
      setPet((prev) => {
        const nextExp = prev.exp + 10;
        let nextLvl = prev.level;
        let nextMax = prev.maxExp;
        let remExp = nextExp;

        if (nextExp >= prev.maxExp) {
          nextLvl += 1;
          remExp = nextExp - prev.maxExp;
          nextMax = Math.round(prev.maxExp * 1.35);
          soundManager.playSuccess();
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
          hunger: Math.min(100, prev.hunger + 8),
          happiness: Math.min(100, prev.happiness + 5),
          stress: Math.max(0, prev.stress - 3),
          practicePoints: pointsManager.getBalance(),
          mood: 'happy',
        };
      });

      setFreeFeedCount((c) => c + 1);
      setSpeechBubble(`우와! 타자를 쳐서 간식을 주셨어요! (+10 EXP, +5P) 냠냠! 🍖`);
      setFreeText('');
      setFoodDropAnim(true);
      setTimeout(() => setFoodDropAnim(false), 1000);
    }
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
      const existing = prev.unlockedDecors || INITIAL_TAMAGOTCHI.unlockedDecors || [];
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

  const handleSelectAnimal = (animalType: AnimalPetType) => {
    const info = PET_SPECIES_INFO[animalType];
    setPet((prev) => ({
      ...prev,
      petType: animalType,
      name: info.nameKo.split(' ')[1] || info.nameKo,
    }));
    setShowPetPicker(false);
    setSpeechBubble(`새로운 가족 ${info.nameKo}가 우리 집에 왔어요! 환영해주세요! 🎉`);
    soundManager.playVictory();
  };

  const handleResetPet = () => {
    if (window.confirm('정말로 다마고치를 1레벨 아기 상태로 초기화하시겠습니까?')) {
      setPet(INITIAL_TAMAGOTCHI);
      setSpeechBubble('다마고치가 새롭게 태어났어요! 🐣');
      setActiveMission(null);
    }
  };

  const petInfo = PET_SPECIES_INFO[pet.petType] || PET_SPECIES_INFO.shiba;
  const stageInfo = STAGE_LABELS[currentStage];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 max-w-5xl mx-auto pb-10">
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
          <span className="font-bold text-sm text-slate-800">🐣 타자 다마고치 케어 룸</span>
          <div className="w-16" />
        </div>
      )}

      {/* ================= TOP HEADER BANNER ================= */}
      <div className="bg-gradient-to-r from-amber-100 via-orange-50 to-rose-100 rounded-3xl p-5 sm:p-6 border-4 border-amber-200 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>10종 동물 펫 육성 시스템</span>
            </span>
            <span className="text-xs font-bold text-amber-900/70 bg-amber-200/50 px-2.5 py-0.5 rounded-lg">
              🍼 아기 → 🎒 유아기 → 🎧 청소년기 → 👑 청년기 진화!
            </span>
            {/* Practice Points Display */}
            <div className="bg-amber-100/80 border-2 border-amber-400 px-3 py-0.5 rounded-xl flex items-center gap-1 text-amber-950 font-black text-xs">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>보유 포인트: <strong>{(pet.practicePoints || 0).toLocaleString()}</strong> P</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🏡 아늑한 우리 집 다마고치 (Pet Home Studio)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium">
            타자를 치며 10종의 동물들을 키우고, 연습 포인트로 우주/바다/구름 배경을 해금하고 방을 꾸며보세요!
          </p>
        </div>

        {/* Action Buttons: Theme Shop, Room Decor, Pet Picker, Reset */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Theme Shop Button */}
          <button
            onClick={() => setShowThemeShop(true)}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-indigo-400"
          >
            <Palette className="w-4 h-4 text-amber-300" />
            <span>배경 테마 상점</span>
          </button>

          {/* Room Decor Button */}
          <button
            onClick={() => setShowRoomDecor(true)}
            className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-emerald-400"
          >
            <Paintbrush className="w-4 h-4 text-emerald-200" />
            <span>방 꾸미기</span>
          </button>

          {/* Species Picker Button */}
          <button
            onClick={() => setShowPetPicker(true)}
            className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-amber-400"
          >
            <span>동물 변경 (10종)</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetPet}
            title="다마고치 초기화"
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
          <div className="relative rounded-3xl overflow-hidden border-4 border-amber-300/80 shadow-2xl bg-[#FFFBEB] flex flex-col justify-between min-h-[460px]">
            
            {/* ================= DYNAMIC SVG THEME & DECOR BACKGROUND ================= */}
            <TamagotchiThemeBackground 
              theme={pet.homeTheme || 'warm_living'} 
              decor={pet.roomDecor} 
            />

            {/* ================= TOP HUD (Pet Stats, Stage, Info) ================= */}
            <div className="relative z-10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md border-b border-amber-200/70 shadow-xs">
              {/* Pet Identity & Stage */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-2xl shadow-inner">
                  {petInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-slate-800 tracking-tight">
                      {pet.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[11px] shadow-xs">
                      Lv.{pet.level}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[11px] border border-rose-200">
                      {stageInfo.icon} {stageInfo.title}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{petInfo.nameKo}</span>
                    <span>•</span>
                    <span className="text-amber-700">좋아하는 음식: {petInfo.favoriteFood}</span>
                  </p>
                </div>
              </div>

              {/* Real-time Status Bars */}
              <div className="flex items-center gap-4 text-xs font-bold">
                {/* Happiness */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-rose-600 mb-0.5">
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
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-600 mb-0.5">
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
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-indigo-600 mb-0.5">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>성장 EXP</span>
                    </span>
                    <span>{pet.exp}/{pet.maxExp}</span>
                  </div>
                  <div className="w-20 bg-indigo-100 h-2 rounded-full overflow-hidden border border-indigo-200">
                    <div className="bg-indigo-600 h-full transition-all" style={{ width: `${(pet.exp / pet.maxExp) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= MIDDLE PET STAGE & SPEECH ================= */}
            <div className="relative z-10 my-auto flex flex-col items-center justify-center p-4 py-8">
              {/* Dynamic Speech Bubble */}
              <div className="relative mb-4 bg-white/95 backdrop-blur-xs rounded-2xl px-5 py-2.5 border-2 border-amber-800/80 shadow-lg max-w-md text-center animate-in zoom-in-95 duration-200">
                <p className="text-xs sm:text-sm font-extrabold text-slate-800 leading-snug">
                  {speechBubble}
                </p>
                {/* Pointer arrow */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-amber-800/80 rotate-45"></div>
              </div>

              {/* Animal Pet Character (Rendered with 10 species & 4 growth stages) */}
              <div className="relative flex flex-col items-center">
                {/* Falling Snack Animation on typing success */}
                {foodDropAnim && (
                  <div className="absolute -top-12 animate-bounce z-20 text-3xl">
                    🍖 ✨ 🍓
                  </div>
                )}

                {/* Floating EXP Badges */}
                <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
                  {floatingBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`absolute top-0 -translate-x-1/2 animate-float-exp font-black text-sm drop-shadow-md whitespace-nowrap bg-white/90 px-3 py-1 rounded-full border-2 border-amber-400 shadow-md ${badge.color}`}
                      style={{ left: `${badge.left}%` }}
                    >
                      {badge.text}
                    </div>
                  ))}
                </div>

                <div 
                  onClick={handlePetTouch}
                  title="클릭하여 머리를 쓰다듬어주세요! 🐾 (하트 뿅뿅 & 기분 UP)"
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 group relative"
                >
                  <AnimalPet
                    type={pet.petType}
                    stage={previewStage || currentStage}
                    mood={pet.mood}
                    size="xl"
                    animate={true}
                    isGrowing={isGrowing}
                    isLevelUp={isLevelUp}
                    expProgress={(pet.exp / pet.maxExp) * 100}
                    className="transition-transform duration-300"
                  />
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-pink-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap pointer-events-none">
                    🐾 클릭해서 쓰담쓰담!
                  </div>
                </div>

                {/* Floor Shadow */}
                <div className="w-32 h-5 bg-amber-950/20 rounded-full mx-auto -mt-3 filter blur-[2px]"></div>

                {/* Mood Tag & Preview Mode Reset */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {previewStage ? (
                      <button
                        onClick={() => setPreviewStage(null)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-full border border-amber-600 shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>[{STAGE_LABELS[previewStage].title}] 미리보기 중 (현재로 복귀)</span>
                      </button>
                    ) : (
                      <>
                        {pet.mood === 'ecstatic' && (
                          <span className="px-3.5 py-1 bg-amber-400 text-amber-950 font-black text-xs rounded-full border-2 border-amber-600 shadow-sm animate-bounce">
                            ✨ 대행복 (Happy x 100!) ✨
                          </span>
                        )}
                        {pet.mood === 'happy' && (
                          <span className="px-3 py-1 bg-emerald-200 text-emerald-950 font-black text-xs rounded-full border border-emerald-400">
                            💖 기분 최고예요!
                          </span>
                        )}
                        {pet.mood === 'wink' && (
                          <span className="px-3.5 py-1 bg-pink-300 text-pink-950 font-black text-xs rounded-full border border-pink-500">
                            😉 깜찍한 윙크 발사!
                          </span>
                        )}
                        {pet.mood === 'proud' && (
                          <span className="px-3.5 py-1 bg-indigo-200 text-indigo-950 font-black text-xs rounded-full border border-indigo-400">
                            😎 으쓱으쓱! 나 완전 잘하지?
                          </span>
                        )}
                        {pet.mood === 'eating' && (
                          <span className="px-3.5 py-1 bg-orange-200 text-orange-950 font-black text-xs rounded-full border border-orange-400">
                            😋 냠냠 쩝쩝 꿀맛이에요!
                          </span>
                        )}
                        {pet.mood === 'excited' && (
                          <span className="px-3.5 py-1 bg-purple-200 text-purple-950 font-black text-xs rounded-full border border-purple-400 animate-bounce">
                            🚀 신나서 어깨춤이 절로!
                          </span>
                        )}
                        {pet.mood === 'sleepy' && (
                          <span className="px-3.5 py-1 bg-slate-200 text-slate-800 font-black text-xs rounded-full border border-slate-400">
                            😴 솔솔 졸음이 쏟아져요 zZ
                          </span>
                        )}
                        {pet.mood === 'shy' && (
                          <span className="px-3.5 py-1 bg-rose-200 text-rose-950 font-black text-xs rounded-full border border-rose-400">
                            😳 볼이 빨개졌어요 헤헤
                          </span>
                        )}
                        {pet.mood === 'surprised' && (
                          <span className="px-3.5 py-1 bg-yellow-200 text-yellow-950 font-black text-xs rounded-full border border-yellow-400 animate-pulse">
                            😲 깜짝이야! 대단해요!
                          </span>
                        )}
                        {pet.mood === 'curious' && (
                          <span className="px-3.5 py-1 bg-teal-200 text-teal-950 font-black text-xs rounded-full border border-teal-400">
                            🤔 갸우뚱? 이건 뭐예요?
                          </span>
                        )}
                        {pet.mood === 'hungry' && (
                          <span className="px-3.5 py-1 bg-amber-200 text-amber-950 font-black text-xs rounded-full border border-amber-400">
                            🤤 꼬르륵 배가 고파요~
                          </span>
                        )}
                        {pet.mood === 'stressed' && (
                          <span className="px-3 py-1 bg-rose-200 text-rose-950 font-black text-xs rounded-full border border-rose-400 animate-pulse">
                            ⚡ 스트레스 받는 중 (타자로 케어해줘요!)
                          </span>
                        )}
                        {pet.mood === 'crying' && (
                          <span className="px-3 py-1 bg-red-400 text-white font-black text-xs rounded-full border border-red-600 animate-bounce">
                            😭 엉엉~ 너무 힘들어요!
                          </span>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => setShowExpressionPanel((p) => !p)}
                      className="px-2.5 py-1 bg-white/90 hover:bg-white text-indigo-700 font-bold text-xs rounded-full border border-indigo-200 shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                    >
                      <SmilePlus className="w-3.5 h-3.5" />
                      <span>{showExpressionPanel ? '표정 닫기' : '표정 반응 놀이 (13종)'}</span>
                    </button>
                  </div>

                  {/* 13 Expressions Interactive Dock */}
                  {showExpressionPanel && (
                    <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border-2 border-indigo-200 shadow-lg flex flex-wrap items-center justify-center gap-1.5 max-w-lg animate-in zoom-in-95 duration-150">
                      {[
                        { mood: 'ecstatic' as PetMood, icon: '🤩', label: '대행복', speech: '와아아! 오늘 기분 완전 최고야!! 🌟' },
                        { mood: 'happy' as PetMood, icon: '😄', label: '행복', speech: '주인님과 함께해서 너무 행복해요! 💖' },
                        { mood: 'wink' as PetMood, icon: '😉', label: '윙크', speech: '찡긋! 저 깜찍하죠? 헤헤 💕' },
                        { mood: 'proud' as PetMood, icon: '😎', label: '자신감', speech: '훗, 내 타자 실력이면 문제없지! 🏆' },
                        { mood: 'eating' as PetMood, icon: '😋', label: '냠냠', speech: '맛있는 간식 꿀꺽! 더 주세요~ 🍖' },
                        { mood: 'excited' as PetMood, icon: '🚀', label: '신남', speech: '타자 칠 때마다 레벨업 쑥쑥! 신나요! ✨' },
                        { mood: 'sleepy' as PetMood, icon: '😴', label: '졸림', speech: '눈이 스르륵 감겨요... zZZ 💤' },
                        { mood: 'shy' as PetMood, icon: '😳', label: '부끄', speech: '칭찬해주시니 부끄러워요 헤헤 //ㅁ//' },
                        { mood: 'surprised' as PetMood, icon: '😲', label: '깜짝', speech: '우와아! 엄청난 타자 속도예요!! ⚡' },
                        { mood: 'curious' as PetMood, icon: '🤔', label: '호기심', speech: '갸우뚱? 다음 문장은 무엇일까요? 🐾' },
                        { mood: 'hungry' as PetMood, icon: '🤤', label: '배고픔', speech: '배에서 꼬르륵 소리가 나요 간식 줘요! 🍰' },
                        { mood: 'stressed' as PetMood, icon: '⚡', label: '당황', speech: '오타가 났어요 으앙! 다시 집중해볼게요!' },
                        { mood: 'crying' as PetMood, icon: '😭', label: '눈물', speech: '흑흑... 실수해도 토닥여주실거죠? 🥺' },
                      ].map((item) => (
                        <button
                          key={item.mood}
                          type="button"
                          onClick={() => handleTriggerMood(item.mood, item.speech)}
                          className={`px-2 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-90 ${
                            pet.mood === item.mood
                              ? 'bg-indigo-600 text-white shadow-xs scale-105'
                              : 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span className="text-[10px]">{item.label}</span>
                        </button>
                      ))}
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

        {/* Right Sidebar: Growth Tracker, 10 Pets Encyclopedia, Free Typing Dispenser (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Growth Stage Progression Card */}
          <div className="bg-white rounded-3xl p-5 border-3 border-amber-200 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-sm text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>성장 진화 단계 (클릭하여 미리보기)</span>
              </span>
              <span className="text-[11px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                현재 Lv.{pet.level} ({stageInfo.title.split(' ')[0]})
              </span>
            </div>

            {/* Stage Steps */}
            <div className="space-y-2">
              {(['baby', 'child', 'teen', 'adult'] as PetGrowthStage[]).map((st) => {
                const info = STAGE_LABELS[st];
                const isCurrent = currentStage === st;
                const isPreview = previewStage === st;
                const story = petInfo.evolutionStory[st];

                return (
                  <button
                    key={st}
                    onClick={() => {
                      if (previewStage === st) {
                        setPreviewStage(null);
                      } else {
                        setPreviewStage(st);
                        setSpeechBubble(`[${info.title}] ${story}`);
                      }
                    }}
                    className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      isPreview
                        ? 'bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-400'
                        : isCurrent
                        ? 'bg-amber-50/90 border-amber-400 shadow-xs'
                        : 'bg-slate-50 hover:bg-amber-50/40 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center shadow-inner shrink-0">
                      <AnimalPet type={pet.petType} stage={st} size="sm" animate={false} />
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
                        {story}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Free Typing Snack Machine (무한 간식 자판기) */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-3xl p-5 border-3 border-orange-200 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs sm:text-sm text-orange-950 flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-orange-600" />
                <span>무한 간식 자판기 (자유 타자)</span>
              </span>
              <span className="text-[10px] font-black text-orange-700 bg-white/80 px-2 py-0.5 rounded-full">
                간식 {freeFeedCount}회 지급!
              </span>
            </div>

            <p className="text-[11px] font-bold text-orange-900/80">
              아무 글자나 6글자 이상 타이핑하면 즉시 맛있는 간식과 +10 EXP를 먹고 쑥쑥 자랍니다!
            </p>

            <input
              type="text"
              value={freeText}
              onChange={handleFreeType}
              placeholder="여기에 자유롭게 아무 글이나 쳐보세요!"
              className="w-full px-3.5 py-2.5 text-xs font-black rounded-xl border-2 border-orange-300 focus:border-orange-500 bg-white text-slate-800 placeholder-slate-400 outline-hidden shadow-inner"
            />
          </div>

          {/* 3. 10 Animals Quick Gallery Preview */}
          <div className="bg-white rounded-3xl p-5 border-3 border-amber-200 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>10종 동물 도감</span>
              </span>
              <button
                onClick={() => setShowPetPicker(true)}
                className="text-[11px] font-black text-amber-600 hover:underline cursor-pointer flex items-center"
              >
                전체보기 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(PET_SPECIES_INFO) as AnimalPetType[]).map((key) => {
                const info = PET_SPECIES_INFO[key];
                const isSelected = pet.petType === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectAnimal(key)}
                    title={`${info.nameKo} 선택하기`}
                    className={`p-2 rounded-2xl border-2 flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-400 border-amber-600 scale-105 shadow-sm'
                        : 'bg-amber-50/50 hover:bg-amber-100 border-amber-200'
                    }`}
                  >
                    <span className="text-xl">{info.icon}</span>
                    <span className="text-[9px] font-black text-slate-700 truncate w-full text-center">
                      {info.nameKo.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 10 ANIMAL PET SELECTOR MODAL ================= */}
      {showPetPicker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border-4 border-amber-300 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>🐾 10종 동물 친구 선택하기 (입양 센터)</span>
                </h2>
                <p className="text-xs font-bold text-slate-500">
                  키우고 싶은 아기 동물을 골라보세요! 레벨과 경험치는 그대로 유지됩니다.
                </p>
              </div>
              <button
                onClick={() => setShowPetPicker(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 10 Pets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(PET_SPECIES_INFO) as AnimalPetType[]).map((key) => {
                const info = PET_SPECIES_INFO[key];
                const isSelected = pet.petType === key;
                return (
                  <div
                    key={key}
                    onClick={() => handleSelectAnimal(key)}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-500 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-amber-200 flex items-center justify-center shadow-inner shrink-0">
                      <AnimalPet type={key} stage={currentStage} size="sm" animate={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1 truncate">
                          <span>{info.icon}</span>
                          <span>{info.nameKo}</span>
                        </span>
                        {isSelected && (
                          <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded-full">
                            선택 중
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                        {info.description}
                      </p>
                      <p className="text-[10px] font-bold text-amber-700 mt-1">
                        🍗 {info.favoriteFood}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= EVOLUTION CONGRATULATIONS MODAL ================= */}
      {showEvolutionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-amber-100 via-white to-rose-100 rounded-3xl p-6 sm:p-8 border-4 border-amber-400 shadow-2xl max-w-md w-full text-center space-y-4 animate-in zoom-in-95">
            <div className="text-4xl animate-bounce">🎉 👑 🌟</div>
            <h2 className="text-xl font-black text-slate-900">
              축하합니다! 진화했습니다!
            </h2>
            <p className="text-xs sm:text-sm font-bold text-slate-600">
              {pet.name}이가 타자 훈련을 통해 <span className="text-amber-700 font-black">[{STAGE_LABELS[evolvedStage].title}]</span> 단계로 진화했습니다!
            </p>

            <div className="py-4 flex justify-center">
              <div className="p-4 rounded-full bg-amber-200/50 border-4 border-amber-300 shadow-inner">
                <AnimalPet type={pet.petType} stage={evolvedStage} size="lg" mood="ecstatic" />
              </div>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {STAGE_LABELS[evolvedStage].desc}
            </p>

            <button
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
          decor={pet.roomDecor || INITIAL_TAMAGOTCHI.roomDecor!}
          unlockedDecors={pet.unlockedDecors || INITIAL_TAMAGOTCHI.unlockedDecors}
          userPoints={pet.practicePoints || 0}
          onSaveDecor={handleSaveDecor}
          onUnlockItem={handleUnlockDecorItem}
          onClose={() => setShowRoomDecor(false)}
          petName={pet.name}
        />
      )}
    </div>
  );
};
