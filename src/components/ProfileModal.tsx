import React, { useState, useRef, useEffect } from 'react';
import { TvBot } from './views/TapangHome';
import { 
  X, 
  Sparkles, 
  Dices, 
  RotateCcw, 
  Download, 
  Check, 
  Heart, 
  Shirt, 
  Smile, 
  Eye, 
  EyeOff,
  Image as ImageIcon, 
  Settings, 
  Undo2, 
  Palette, 
  Sparkle, 
  ChevronLeft, 
  ChevronRight,
  Bookmark,
  UserCheck,
  Star,
  User,
  Phone,
  Lock,
  Key,
  ShieldCheck,
  Save,
  Copy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Trophy,
  Coins,
  GraduationCap,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { AvatarConfig, UserSession, PracticeHistoryRecord } from '../types';
import { CharacterAvatar, DEFAULT_AVATAR_CONFIG } from './CharacterAvatar';
import { AvatarBackgroundScene } from './AvatarBackgroundScene';
import { soundManager } from '../utils/sound';
import { pointsManager, AVATAR_ITEM_PRICES } from '../utils/pointsManager';
import { getUserPracticeHistory } from '../utils/curriculumManager';
import { WeeklyProgressChart } from './WeeklyProgressChart';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onUpdateUser: (updatedUser: Partial<UserSession>) => void;
  onOpenAuth?: () => void;
  initialTab?: 'avatar' | 'account';
}

type MainCategory = 
  | 'hair' 
  | 'skin' 
  | 'eyes' 
  | 'top' 
  | 'bottom' 
  | 'accessory' 
  | 'background' 
  | 'decor';

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenAuth,
  initialTab = 'avatar',
}) => {
  // Main Tab: Avatar Maker vs Account Info vs Weekly Progress Chart
  const [mainTab, setMainTab] = useState<'avatar' | 'account' | 'progress'>(initialTab);

  // Sound volume state
  const [volume, setVolumeState] = useState<number>(() => soundManager.getVolume());

  // Practice Records for Weekly Progress Chart
  const [practiceRecords, setPracticeRecords] = useState<PracticeHistoryRecord[]>([]);

  // Student Account Info & Password State
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editStudentId, setEditStudentId] = useState(currentUser?.studentId || currentUser?.phone || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editParentPhone, setEditParentPhone] = useState(currentUser?.parentPhone || '');
  const [editGrade, setEditGrade] = useState<number>(currentUser?.grade || 3);
  const [editPassword, setEditPassword] = useState(currentUser?.password || '1234');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Main avatar configuration state
  const [config, setConfig] = useState<AvatarConfig>(() => {
    if (currentUser?.avatarConfig) {
      return {
        ...DEFAULT_AVATAR_CONFIG,
        ...currentUser.avatarConfig,
      };
    }
    return { ...DEFAULT_AVATAR_CONFIG };
  });

  // History stack for Undo
  const [history, setHistory] = useState<AvatarConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState<MainCategory>('hair');
  const [hairGenderFilter, setHairGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [activeRightTab, setActiveRightTab] = useState<'boy' | 'girl' | 'favorites' | 'my_characters' | 'girl_presets'>('boy');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [favAddedSuccess, setFavAddedSuccess] = useState(false);
  const [charName, setCharName] = useState<string>(config.characterName || currentUser?.nickname || '도윤');
  const [favorites, setFavorites] = useState<{ name: string; config: AvatarConfig }[]>(() => {
    try {
      const saved = localStorage.getItem('avatar_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Points & Shop State
  const [userPoints, setUserPoints] = useState<number>(() => pointsManager.getBalance());
  const [unlockedItems, setUnlockedItems] = useState<string[]>(() => pointsManager.getUnlockedAvatarItems());
  const [shopFeedback, setShopFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const avatarStageRef = useRef<HTMLDivElement>(null);

  // Sync with points manager
  useEffect(() => {
    const syncPoints = () => {
      setUserPoints(pointsManager.getBalance());
      setUnlockedItems(pointsManager.getUnlockedAvatarItems());
    };
    syncPoints();
    window.addEventListener('points-updated', syncPoints);
    window.addEventListener('avatar-items-updated', syncPoints);
    return () => {
      window.removeEventListener('points-updated', syncPoints);
      window.removeEventListener('avatar-items-updated', syncPoints);
    };
  }, []);

  // Sync student account data when modal opens or user updates
  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setMainTab(initialTab);
      }
      const targetId = currentUser?.id || 'guest';
      let recs = getUserPracticeHistory(targetId);
      if (recs.length === 0) {
        const guestRecs = getUserPracticeHistory('guest');
        if (guestRecs.length > 0) recs = guestRecs;
      }
      setPracticeRecords(recs);
      setVolumeState(soundManager.getVolume());
    }
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditStudentId(currentUser.studentId || currentUser.phone || '');
      setEditPhone(currentUser.phone || '');
      setEditParentPhone(currentUser.parentPhone || '');
      setEditGrade(currentUser.grade || 3);

      // Lookup real password from local DB if missing
      let resolvedPw = currentUser.password;
      if (!resolvedPw) {
        try {
          const raw = localStorage.getItem('typang_users_db');
          if (raw) {
            const db: UserSession[] = JSON.parse(raw);
            const found = db.find(u => u.id === currentUser.id || u.studentId === currentUser.studentId);
            if (found && found.password) {
              resolvedPw = found.password;
            }
          }
        } catch {}
      }
      setEditPassword(resolvedPw || '1234');
    }
  }, [currentUser, isOpen, initialTab]);

  const handleCopyId = () => {
    if (!editStudentId) return;
    navigator.clipboard.writeText(editStudentId);
    setCopiedId(true);
    soundManager.play('pop');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!editName.trim()) {
      setAccountFeedback({ message: '학생 이름을 정확히 입력해주세요.', type: 'error' });
      soundManager.play('error');
      return;
    }
    if (!editPassword.trim() || editPassword.trim().length !== 4) {
      setAccountFeedback({ message: '비밀번호는 4자리 숫자(PIN)로 입력해주세요.', type: 'error' });
      soundManager.play('error');
      return;
    }

    const updatedUserData: UserSession = {
      ...currentUser,
      name: editName.trim(),
      phone: editPhone.trim() || editStudentId.trim(),
      parentPhone: editParentPhone.trim(),
      grade: editGrade,
      password: editPassword.trim(),
    };

    onUpdateUser(updatedUserData);
    soundManager.play('fanfare');
    setAccountFeedback({ message: '✨ 학생 계정 정보와 비밀번호가 안전하게 저장되었습니다!', type: 'success' });
    setTimeout(() => setAccountFeedback(null), 4000);
  };

  // Price helper
  const getItemPrice = (itemId: string): number => {
    const p = AVATAR_ITEM_PRICES[itemId];
    if (!p) return 100;
    return typeof p === 'object' ? p.price : (typeof p === 'number' ? p : 100);
  };

  // Item Unlock or Select Handler
  const handleSelectOrUnlockItem = (itemId: string, onApply: () => void) => {
    // If item is already unlocked or free
    if (pointsManager.isAvatarItemUnlocked(itemId)) {
      soundManager.play('pop');
      onApply();
      return;
    }

    // Try to unlock using points
    const price = getItemPrice(itemId);
    const result = pointsManager.unlockAvatarItem(itemId);

    if (result.success) {
      soundManager.play('fanfare');
      setShopFeedback({ message: `🎉 ${result.message}! 바로 착용되었습니다.`, type: 'success' });
      onApply();
      setTimeout(() => setShopFeedback(null), 3500);
    } else {
      soundManager.play('error');
      setShopFeedback({ message: `🪙 ${result.message} (필요: ${price}P / 보유: ${userPoints}P)`, type: 'error' });
      setTimeout(() => setShopFeedback(null), 4000);
    }
  };

  // Sync with current user on modal open
  useEffect(() => {
    if (currentUser?.avatarConfig) {
      setConfig({
        ...DEFAULT_AVATAR_CONFIG,
        ...currentUser.avatarConfig,
      });
      if (currentUser.avatarConfig.characterName) {
        setCharName(currentUser.avatarConfig.characterName);
      }
    }
  }, [currentUser, isOpen]);

  // Helper to update config and push to history
  const updateConfig = (newChanges: Partial<AvatarConfig>) => {
    setHistory(prev => [...prev.slice(-10), config]);
    setConfig(prev => ({ ...prev, ...newChanges }));
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length === 0) return;
    soundManager.play('click');
    const prevConfig = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setConfig(prevConfig);
  };

  // Reset to default
  const handleReset = () => {
    soundManager.play('click');
    setHistory(prev => [...prev, config]);
    setConfig({ ...DEFAULT_AVATAR_CONFIG });
    setCharName('소다');
  };

  // Randomize all features
  const handleRandomize = () => {
    soundManager.play('pop');
    setHistory(prev => [...prev, config]);

    const hairs: AvatarConfig['hairStyle'][] = [
      'blonde_curly_side_pony',
      'brown_curly_side_pony',
      'wavy_bob_bangs',
      'loose_wavy_twintails',
      'straight_half_up',
      'neat_straight_bob',
      'short_spiky',
      'hime_cut',
      'blonde_wavy_headband',
      'beret_side_pony',
      'wavy_bob_cat_ears',
      'pink_pigtails_bows',
    ];
    const hairColors = ['#FDE047', '#5C382C', '#1E293B', '#991B1B', '#1E40AF', '#A855F7'];
    const skinColors = ['#FFF1F2', '#FFE7D6', '#FED7AA', '#D4A373', '#9A3412'];
    const eyeColors = ['#7C3AED', '#2563EB', '#059669', '#5C382C', '#0F172A', '#38BDF8', '#E11D48', '#D97706'];
    const eyeTypes: AvatarConfig['eyeType'][] = ['warm_sparkle', 'wink', 'sleepy', 'cat_eyes', 'sparkle_star'];
    const topTypes: AvatarConfig['topType'][] = ['white_tshirt', 'cable_knit', 'denim_jacket', 'oversized_hoodie', 'trench_coat', 'blazer', 'off_shoulder', 'hanbok_top'];
    const bottomTypes: AvatarConfig['bottomType'][] = ['pleated_skirt', 'boyfriend_jeans', 'leather_pants', 'ripped_jeans', 'yoga_pants', 'skater_skirt'];
    const backgrounds: AvatarConfig['backgroundScene'][] = ['terrace', 'beach', 'park', 'city_night', 'room', 'forest'];
    const stickers: AvatarConfig['decorSticker'][] = ['none', 'sparkle_stars', 'floating_hearts'];

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    setConfig(prev => ({
      ...prev,
      hairStyle: pick(hairs),
      hairColor: pick(hairColors),
      skinColor: pick(skinColors),
      eyeColor: pick(eyeColors),
      eyeType: pick(eyeTypes),
      topType: pick(topTypes),
      bottomType: pick(bottomTypes),
      backgroundScene: pick(backgrounds),
      decorSticker: pick(stickers),
    }));
  };

  // Add to Favorites
  const handleAddToFavorites = () => {
    soundManager.play('achievement');
    const newFav = { name: charName || '내 캐릭터', config };
    setFavorites(prev => {
      const next = [newFav, ...prev.filter(f => f.name !== newFav.name)].slice(0, 6);
      try {
        localStorage.setItem('avatar_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
    setFavAddedSuccess(true);
    setTimeout(() => setFavAddedSuccess(false), 2000);
  };

  // Apply and save avatar to profile
  const handleApply = () => {
    soundManager.play('fanfare');
    const finalConfig: AvatarConfig = {
      ...config,
      characterName: charName,
    };
    onUpdateUser({ avatarConfig: finalConfig });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  // Export character as PNG image
  const handleExportPNG = () => {
    soundManager.play('click');
    const svgEl = avatarStageRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);
      const imgURI = canvas.toDataURL('image/png');

      const a = document.createElement('a');
      a.download = `${charName || 'my_avatar'}_character.png`;
      a.href = imgURI;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = url;
  };

  if (!isOpen) return null;

  // Preset Palettes & Options
  const HAIR_COLORS = [
    { name: '블론드', value: '#FDE047' },
    { name: '초코 브라운', value: '#5C382C' },
    { name: '제트 블랙', value: '#1E293B' },
    { name: '와인 레드', value: '#991B1B' },
    { name: '네이비 블루', value: '#1E40AF' },
    { name: '라벤더 퍼플', value: '#A855F7' },
  ];

  const SKIN_COLORS = [
    { name: '페어 화이트', value: '#FFF1F2' },
    { name: '웜 크림', value: '#FFE7D6' },
    { name: '내추럴 베이지', value: '#FED7AA' },
    { name: '탠 브론즈', value: '#D4A373' },
    { name: '딥 브론즈', value: '#9A3412' },
  ];

  const EYE_COLORS = [
    { name: '아메시스트', value: '#7C3AED' },
    { name: '사파이어', value: '#2563EB' },
    { name: '에메랄드', value: '#059669' },
    { name: '초코', value: '#5C382C' },
    { name: '오닉스', value: '#0F172A' },
    { name: '스카이', value: '#38BDF8' },
    { name: '루비 핑크', value: '#E11D48' },
    { name: '앰버 골드', value: '#D97706' },
  ];

  const CLOTHING_COLORS = [
    { name: '화이트', value: '#FFFFFF' },
    { name: '데님 블루', value: '#5B84B1' },
    { name: '로즈 핑크', value: '#FDA4AF' },
    { name: '민트 그린', value: '#86EFAC' },
    { name: '라벤더', value: '#DDD6FE' },
    { name: '버터 옐로우', value: '#FEF08A' },
    { name: '차콜 블랙', value: '#1E293B' },
    { name: '베이지 브라운', value: '#D4A373' },
  ];

  // Boy Presets (6 Distinct Boys Styles)
  const BOY_PRESETS = [
    {
      id: 'boy_1',
      name: '도윤 (스트릿 캐주얼)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'boy',
        hairStyle: 'two_block_dandy',
        hairColor: '#1E293B',
        eyeColor: '#2563EB',
        topType: 'casual_oversized_tee',
        topColor: '#FFFFFF',
        bottomType: 'relaxed_baggy_jeans',
        bottomColor: '#5B84B1',
        shoes: 'chunky_sneakers',
        shoesColor: '#FFFFFF',
        bag: 'crossbag',
        backgroundScene: 'city_night',
      } as AvatarConfig,
    },
    {
      id: 'boy_2',
      name: '시우 (바시티 캠퍼스)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'boy',
        hairStyle: 'comma_hair',
        hairColor: '#5C382C',
        eyeColor: '#5C382C',
        topType: 'varsity_jacket',
        topColor: '#1E293B',
        bottomType: 'wide_cargo_pants',
        bottomColor: '#D4A373',
        shoes: 'hightop_canvas',
        shoesColor: '#1E293B',
        backgroundScene: 'terrace',
      } as AvatarConfig,
    },
    {
      id: 'boy_3',
      name: '민준 (힙합 오버핏 후디)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'boy',
        hairStyle: 'wolf_cut_messy',
        hairColor: '#1E293B',
        eyeColor: '#7C3AED',
        topType: 'streetwear_hoodie',
        topColor: '#3B82F6',
        bottomType: 'sporty_sweatpants',
        bottomColor: '#1E293B',
        shoes: 'chunky_sneakers',
        shoesColor: '#FFFFFF',
        accessory: 'headphones',
        backgroundScene: 'city_night',
      } as AvatarConfig,
    },
    {
      id: 'boy_4',
      name: '은우 (테일러드 수트)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'boy',
        hairStyle: 'side_part_classic',
        hairColor: '#1E293B',
        eyeColor: '#0F172A',
        topType: 'formal_blazer_tie',
        topColor: '#1E293B',
        bottomType: 'tailored_slacks',
        bottomColor: '#1E293B',
        shoes: 'leather_loafers',
        shoesColor: '#1E293B',
        backgroundScene: 'terrace',
      } as AvatarConfig,
    },
    {
      id: 'boy_5',
      name: '준서 (스포티 져지)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'boy',
        hairStyle: 'short_spiky',
        hairColor: '#5C382C',
        eyeColor: '#059669',
        topType: 'football_jersey',
        topColor: '#EF4444',
        bottomType: 'cargo_shorts',
        bottomColor: '#1E293B',
        shoes: 'chunky_sneakers',
        shoesColor: '#FFFFFF',
        backgroundScene: 'park',
      } as AvatarConfig,
    },
    {
      id: 'boy_6',
      name: '서진 (포근 꽈배기 니트)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'boy',
        hairStyle: 'center_part_wavy',
        hairColor: '#5C382C',
        eyeColor: '#D97706',
        topType: 'cable_knit',
        topColor: '#D4A373',
        bottomType: 'relaxed_baggy_jeans',
        bottomColor: '#5B84B1',
        shoes: 'leather_loafers',
        shoesColor: '#5C382C',
        accessory: 'glasses_round',
        backgroundScene: 'room',
      } as AvatarConfig,
    },
  ];

  // Girl Presets (6 Distinct Girls Styles)
  const GIRL_PRESETS = [
    {
      id: 'girl_1',
      name: '소다 (스쿨 가디건)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'blonde_curly_side_pony',
        hairColor: '#FDE047',
        eyeColor: '#7C3AED',
        topType: 'school_cardigan',
        topColor: '#1E293B',
        bottomType: 'pleated_skirt',
        bottomColor: '#5B84B1',
        shoes: 'white_sneakers',
        shoesColor: '#FFFFFF',
        bag: 'leather_handbag',
        backgroundScene: 'terrace',
      } as AvatarConfig,
    },
    {
      id: 'girl_2',
      name: '체리 (러블리 블라우스)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'hime_cut',
        hairColor: '#5C382C',
        eyeColor: '#E11D48',
        topType: 'off_shoulder',
        topColor: '#FDA4AF',
        bottomType: 'pleated_skirt',
        bottomColor: '#FB7185',
        shoes: 'mary_jane',
        shoesColor: '#1E293B',
        backgroundScene: 'park',
      } as AvatarConfig,
    },
    {
      id: 'girl_3',
      name: '루나 (사이버 스트릿)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'loose_wavy_twintails',
        hairColor: '#A855F7',
        eyeColor: '#38BDF8',
        topType: 'streetwear_hoodie',
        topColor: '#1E1B4B',
        bottomType: 'leather_pants',
        bottomColor: '#0F172A',
        shoes: 'combat_boots',
        shoesColor: '#0F172A',
        backgroundScene: 'city_night',
      } as AvatarConfig,
    },
    {
      id: 'girl_4',
      name: '유아 (플라워 크롭)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'neat_straight_bob',
        hairColor: '#1E40AF',
        eyeColor: '#2563EB',
        topType: 'crop_top_floral',
        topColor: '#FEF08A',
        bottomType: 'relaxed_baggy_jeans',
        bottomColor: '#5B84B1',
        shoes: 'slippers',
        shoesColor: '#FEF08A',
        backgroundScene: 'beach',
      } as AvatarConfig,
    },
    {
      id: 'girl_5',
      name: '하은 (포근 룸메이트)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'wavy_bob_bangs',
        hairColor: '#5C382C',
        eyeColor: '#059669',
        topType: 'cable_knit',
        topColor: '#DDD6FE',
        bottomType: 'yoga_pants',
        bottomColor: '#F472B6',
        accessory: 'cat_ears',
        backgroundScene: 'room',
      } as AvatarConfig,
    },
    {
      id: 'girl_6',
      name: '단비 (전통 당의 한복)',
      config: {
        ...DEFAULT_AVATAR_CONFIG,
        gender: 'girl',
        hairStyle: 'straight_half_up',
        hairColor: '#1E293B',
        eyeColor: '#059669',
        topType: 'hanbok_top',
        topColor: '#A7F3D0',
        bottomType: 'pleated_skirt',
        bottomColor: '#047857',
        shoes: 'mary_jane',
        shoesColor: '#FFFFFF',
        backgroundScene: 'forest',
      } as AvatarConfig,
    },
  ];

  // 6 Sceneries
  const BACKGROUND_SCENES = [
    { id: 'terrace', name: '유럽 꽃길 테라스', desc: 'Sunny Terrace', icon: '🏛️' },
    { id: 'beach', name: '푸른 여름 해변', desc: 'Summer Beach', icon: '🏖️' },
    { id: 'park', name: '벚꽃 만개 공원', desc: 'Sakura Park', icon: '🌸' },
    { id: 'city_night', name: '사이버펑크 야경', desc: 'Cyber Night', icon: '🌃' },
    { id: 'room', name: '포근한 핑크 룸', desc: 'Cozy Pastel Room', icon: '🛋️' },
    { id: 'forest', name: '신비로운 요정 숲', desc: 'Fairy Forest', icon: '🌲' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn tp-modal">
      <div className="tp-modal-bot" aria-hidden="true">
        <TvBot size={110} bubble="획득한 아이템을 장착해보세요!" bubbleSide="top" />
      </div>
      {/* Studio Card Frame */}
      <div className="relative w-full max-w-6xl h-[95vh] max-h-[860px] bg-[#EEF2F6] rounded-3xl shadow-2xl border-4 border-slate-300 flex flex-col overflow-hidden text-slate-800">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER (Exact Title, Mode Switcher & Top-Right Utility Buttons) */}
        {/* ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between px-3 sm:px-6 py-2.5 bg-white border-b border-slate-200 select-none shrink-0 gap-2">
          {/* Logo + Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sky-100 border-2 border-sky-400 flex items-center justify-center shadow-xs text-base sm:text-lg">
              🐱
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 font-sans">
                  {mainTab === 'avatar' ? 'MY AVATAR MAKER' : '내 계정 & 비밀번호 확인'}
                </h1>
                <span className="text-xs sm:text-sm">💕</span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hidden md:block">
                {mainTab === 'avatar' 
                  ? '✨ 나만의 특별한 캐릭터를 만들고 다마고치 방을 꾸며보세요!' 
                  : '✨ 학생 계정 정보, 등록된 전화번호 및 4자리 비밀번호 확인 및 수정'}
              </p>
            </div>
          </div>

          {/* Mode Switch Tabs: Avatar Maker vs Account Info vs Progress Chart */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                soundManager.play('click');
                setMainTab('avatar');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                mainTab === 'avatar'
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>아바타 꾸미기</span>
            </button>
            <button
              onClick={() => {
                soundManager.play('click');
                setMainTab('account');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                mainTab === 'account'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>내 계정 정보 & 비밀번호</span>
            </button>
            <button
              onClick={() => {
                soundManager.play('click');
                setMainTab('progress');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                mainTab === 'progress'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>주간 성장 그래프 (CPM)</span>
            </button>
          </div>

          {/* Top Right Utility Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Point Balance Badge */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-amber-50 border-2 border-amber-300 rounded-full shadow-2xs">
              <span className="text-xs sm:text-sm">🪙</span>
              <span className="text-xs font-black text-amber-950 font-arcade">
                {userPoints.toLocaleString()} <span className="text-[10px] font-bold text-amber-700">P</span>
              </span>
            </div>

            {mainTab === 'avatar' && (
              <>
                <button
                  onClick={handleRandomize}
                  className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full border border-slate-200 transition-all shadow-xs"
                >
                  <Dices className="w-3.5 h-3.5 text-purple-600" />
                  <span>랜덤</span>
                </button>
                <button
                  onClick={handleReset}
                  className="hidden sm:flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full border border-slate-200 transition-all shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>초기화</span>
                </button>
                <button
                  onClick={handleExportPNG}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-full border border-slate-200 transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">저장</span>
                </button>
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0}
                  className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30 rounded-full hover:bg-slate-100 transition-colors"
                  title="이전 되돌리기"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Shop Notification Toast Alert */}
        {shopFeedback && (
          <div className={`px-4 py-2 text-xs font-black flex items-center justify-between border-b animate-in fade-in slide-in-from-top-2 ${
            shopFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            <span>{shopFeedback.message}</span>
            <button onClick={() => setShopFeedback(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN BODY: ACCOUNT INFO VIEW vs AVATAR STUDIO BODY */}
        {/* ========================================================================= */}
        {mainTab === 'account' ? (
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-50/70">
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
              {/* Account Feedback Toast */}
              {accountFeedback && (
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm border-2 animate-in fade-in ${
                  accountFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300'
                }`}>
                  {accountFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{accountFeedback.message}</span>
                </div>
              )}

              {/* Main Grid: Student Identity Profile Card + Editable Form */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
                
                {/* Left Column: Student Avatar & Stats Card */}
                <div className="md:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                  <div className="relative w-36 h-44 rounded-2xl bg-gradient-to-b from-sky-100 to-indigo-100 border-2 border-sky-200 flex items-center justify-center overflow-hidden shadow-inner">
                    <CharacterAvatar config={config} size="md" mood="happy" animate={true} />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-xs text-[10px] font-black text-slate-700 border border-slate-200">
                      {currentUser?.role === 'master' ? '👑 마스터' : `${editGrade}학년`}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 font-arcade">
                        {currentUser?.name || editName || '학생'}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black border border-pink-200">
                        {currentUser?.role === 'master' ? '마스터 관리자' : (currentUser?.levelTitle || '타자 꿈나무')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      {currentUser?.role === 'master' ? '마스터 선생님 계정' : `초등학교 ${editGrade}학년 • ${currentUser?.studentId || '학생'}`}
                    </p>
                  </div>

                  {/* Account Approval Status Badge */}
                  <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">계정 승인 상태</span>
                      {currentUser?.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5" /> 승인 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          ⏳ 승인 대기 중
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {currentUser?.isApproved 
                        ? '선생님 승인이 완료되어 모든 타자 연습 및 랭킹에 기록됩니다.'
                        : '선생님(마스터)의 승인 후 타자 랭킹에 공식 등록됩니다.'}
                    </p>
                  </div>

                  {/* Overall Stats */}
                  <div className="w-full grid grid-cols-2 gap-2 pt-1">
                    <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-left">
                      <span className="text-[10px] font-extrabold text-sky-600 block">최고 타수</span>
                      <span className="text-base font-black text-sky-950 font-arcade">
                        {currentUser?.highestCpm || 0} <span className="text-[10px] font-bold text-sky-700">CPM</span>
                      </span>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-left">
                      <span className="text-[10px] font-extrabold text-purple-600 block">누적 연습</span>
                      <span className="text-base font-black text-purple-950 font-arcade">
                        {currentUser?.totalPracticeCount || 0} <span className="text-[10px] font-bold text-purple-700">회</span>
                      </span>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-700 block">보유 타자 포인트</span>
                        <span className="text-base font-black text-amber-950 font-arcade">
                          {userPoints.toLocaleString()} <span className="text-xs font-bold text-amber-700">P</span>
                        </span>
                      </div>
                      <span className="text-2xl">🪙</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Editable Account Details & Password Inspection */}
                <div className="md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                  <form onSubmit={handleSaveAccountInfo} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span>학생 계정 정보 및 비밀번호</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {currentUser?.role === 'master' 
                            ? '👑 마스터 모드: 학생 및 관리자 정보를 자유롭게 수정할 수 있습니다.'
                            : '🔒 회원 정보(이름, 비밀번호 등)의 수정은 마스터 관리실에서만 가능합니다.'}
                        </p>
                      </div>
                      {currentUser?.role !== 'master' && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                          조회 전용 (수정 제한)
                        </span>
                      )}
                    </div>

                    {currentUser?.role !== 'master' && (
                      <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-2">
                        <span>🔒</span>
                        <span>회원 정보는 홈페이지를 업데이트해도 안전하게 보존되며, 마스터(선생님) 계정으로 들어가야 수정할 수 있습니다.</span>
                      </div>
                    )}

                    {/* 1. Student Name */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-pink-500" />
                        <span>학생 이름</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="학생 이름 입력"
                        disabled={currentUser?.role !== 'master'}
                        className={`w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-bold outline-hidden ${
                          currentUser?.role !== 'master'
                            ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                            : 'bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-100'
                        }`}
                        required
                      />
                    </div>

                    {/* 2. Student ID (Read-only + Copy) */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-500" />
                          <span>로그인 아이디</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">고유 식별자</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={editStudentId}
                          className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-100 text-slate-700 font-mono text-xs sm:text-sm font-black outline-hidden cursor-not-allowed select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyId}
                          className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId ? '복사됨!' : '아이디 복사'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. Password (PIN) with Show/Hide Toggle */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>로그인 비밀번호 (4자리 숫자)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.play('pop');
                            setShowPassword(!showPassword);
                          }}
                          className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>비밀번호 숨기기</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>비밀번호 확인하기</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          maxLength={4}
                          value={editPassword}
                          disabled={currentUser?.role !== 'master'}
                          onChange={(e) => setEditPassword(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="4자리 숫자 비밀번호"
                          className={`w-full px-4 py-2.5 rounded-2xl border-2 border-amber-400 text-base font-black tracking-widest outline-hidden font-mono ${
                            currentUser?.role !== 'master'
                              ? 'bg-amber-100/60 text-slate-600 cursor-not-allowed'
                              : 'bg-white text-slate-800 focus:border-amber-600 focus:ring-4 focus:ring-amber-200'
                          }`}
                          required
                        />
                      </div>
                      <p className="text-[11px] text-amber-900 font-medium">
                        {currentUser?.role === 'master'
                          ? '💡 4자리 숫자 비밀번호를 수정한 후 아래 저장하기 버튼을 누르세요.'
                          : '💡 비밀번호 확인이 가능하며, 변경은 마스터 관리자에게 요청해주세요.'}
                      </p>
                    </div>

                    {/* 4. Student Phone & Parent Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-sky-500" />
                          <span>학생 전화번호</span>
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          disabled={currentUser?.role !== 'master'}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className={`w-full px-4 py-2 rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-bold outline-hidden ${
                            currentUser?.role !== 'master'
                              ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                              : 'bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>학부모님 전화번호</span>
                        </label>
                        <input
                          type="text"
                          value={editParentPhone}
                          disabled={currentUser?.role !== 'master'}
                          onChange={(e) => setEditParentPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className={`w-full px-4 py-2 rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-bold outline-hidden ${
                            currentUser?.role !== 'master'
                              ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                              : 'bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 5. Grade Selection */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                        <span>학년</span>
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <button
                            key={g}
                            type="button"
                            disabled={currentUser?.role !== 'master'}
                            onClick={() => {
                              if (currentUser?.role === 'master') {
                                soundManager.play('pop');
                                setEditGrade(g);
                              }
                            }}
                            className={`py-2 rounded-xl text-xs font-black transition-all border-2 ${
                              editGrade === g
                                ? 'bg-purple-500 text-white border-purple-600 shadow-xs scale-102'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            } ${currentUser?.role !== 'master' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:bg-slate-100'}`}
                          >
                            {g}학년
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Save Button or Master Notice */}
                    <div className="pt-2">
                      {currentUser?.role === 'master' ? (
                        <button
                          type="submit"
                          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border-2 border-pink-300"
                        >
                          <Save className="w-4 h-4" />
                          <span>마스터 권한으로 저장하기</span>
                        </button>
                      ) : (
                        <div className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-bold">
                          👑 학생 정보 수정은 마스터 관리실에서만 가능합니다
                        </div>
                      )}
                    </div>
                  </form>
                </div>

              </div>

              {/* Sound Effect Volume Control in Account/Settings */}
              <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">타건 효과음 볼륨 조절</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      키보드 타건음, 정답 팡파레, 레벨업 사운드 크기를 조절합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolumeState(val);
                      soundManager.setVolume(val);
                    }}
                    className="w-32 sm:w-40 accent-sky-600 cursor-pointer"
                  />
                  <span className="text-xs font-black font-arcade text-sky-800 w-10 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => soundManager.play('achievement')}
                    className="px-3 py-1.5 bg-white text-sky-700 text-xs font-black rounded-xl border border-sky-200 hover:bg-sky-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    소리 테스트
                  </button>
                </div>
              </div>

              {/* Weekly Progress Chart Embedded in Account Tab */}
              <WeeklyProgressChart 
                records={practiceRecords} 
                userName={currentUser?.name || editName || '학생'} 
              />
            </div>
          </div>
        ) : mainTab === 'progress' ? (
          /* ========================================================================= */
          /* 3. DEDICATED WEEKLY PROGRESS & CPM GROWTH TAB */
          /* ========================================================================= */
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-50/70">
            <div className="max-w-4xl mx-auto space-y-5">
              <WeeklyProgressChart 
                records={practiceRecords} 
                userName={currentUser?.name || editName || '학생'} 
              />
            </div>
          </div>
        ) : (
        /* ========================================================================= */
        /* 2. THREE-PANEL STUDIO BODY (Avatar Customizer) */
        /* ========================================================================= */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* ======================================================================= */}
          {/* LEFT COLUMN: CATEGORY SELECTOR BAR (Vertical Navigation) */}
          {/* ======================================================================= */}
          <div className="md:col-span-1 bg-white border-r border-slate-200 p-2 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0 select-none scrollbar-none">
            {[
              { id: 'hair', label: '머리', icon: '💇‍♂️', count: '20' },
              { id: 'skin', label: '얼굴색', icon: '👶', count: '5' },
              { id: 'eyes', label: '눈', icon: '👁️', count: '5' },
              { id: 'top', label: '상의', icon: '👕', count: '12' },
              { id: 'bottom', label: '하의', icon: '👖', count: '10' },
              { id: 'accessory', label: '신발&소품', icon: '👟', count: '17' },
              { id: 'background', label: '배경', icon: '🖼️', count: '6' },
              { id: 'decor', label: '꾸미기', icon: '⭐', count: '5' },
            ].map(tab => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundManager.play('click');
                    setActiveCategory(tab.id as MainCategory);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all relative shrink-0 ${
                    isActive
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-200 scale-102'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="text-xl mb-0.5">{tab.icon}</span>
                  <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">{tab.label}</span>
                  {tab.count && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full mt-0.5 ${
                        isActive ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ======================================================================= */}
          {/* CENTER-LEFT COLUMN: DETAILED OPTIONS FOR ACTIVE CATEGORY */}
          {/* ======================================================================= */}
          <div className="md:col-span-4 bg-[#F8FAFC] border-r border-slate-200 p-3 sm:p-4 overflow-y-auto flex flex-col gap-4">
            
            {/* === CATEGORY: 머리 (Hair) === */}
            {activeCategory === 'hair' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <span>💇‍♂️</span> 머리 스타일 (20종)
                    </span>
                  </div>

                  {/* Hair Gender Filter Tabs */}
                  <div className="flex items-center gap-1 mb-2.5 bg-slate-200/80 p-1 rounded-xl">
                    {[
                      { id: 'all', label: '전체 (20종)' },
                      { id: 'boy', label: '👦 소년 헤어 (8종)' },
                      { id: 'girl', label: '👧 소녀 헤어 (12종)' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => {
                          soundManager.play('click');
                          setHairGenderFilter(f.id as any);
                          if (f.id === 'boy') updateConfig({ gender: 'boy' });
                          if (f.id === 'girl') updateConfig({ gender: 'girl' });
                        }}
                        className={`flex-1 py-1 px-1.5 text-[10px] font-black rounded-lg transition-all ${
                          hairGenderFilter === f.id
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {[
                      // Boy hairstyles (8 items)
                      { id: 'two_block_dandy', gender: 'boy', num: 'B1', name: '댄디 투블럭 컷', sub: 'Two-block Dandy', icon: '👦', defColor: '#1E293B' },
                      { id: 'comma_hair', gender: 'boy', num: 'B2', name: '아이돌 쉼표머리', sub: 'Comma Hairstyle', icon: '🧑', defColor: '#5C382C' },
                      { id: 'wolf_cut_messy', gender: 'boy', num: 'B3', name: '레이어드 울프컷', sub: 'Messy Wolf Cut', icon: '🎸', defColor: '#1E293B' },
                      { id: 'center_part_wavy', gender: 'boy', num: 'B4', name: '가르마 웨이브 펌', sub: 'Center Part Wavy', icon: '🌊', defColor: '#5C382C' },
                      { id: 'dandy_perm', gender: 'boy', num: 'B5', name: '볼륨 쉐도우 펌', sub: 'Shadow Perm Volume', icon: '🧑‍🦱', defColor: '#5C382C' },
                      { id: 'beanie_curls', gender: 'boy', num: 'B6', name: '비니 & 컬리헤어', sub: 'Beanie with Curls', icon: '🧢', defColor: '#1E293B' },
                      { id: 'side_part_classic', gender: 'boy', num: 'B7', name: '클래식 포마드 컷', sub: 'Classic Side Part', icon: '👔', defColor: '#1E293B' },
                      { id: 'short_spiky', gender: 'boy', num: 'B8', name: '숏 스파이키 컷', sub: 'Short Spiky Layered', icon: '⚽', defColor: '#5C382C' },

                      // Girl hairstyles (12 items)
                      { id: 'blonde_curly_side_pony', gender: 'girl', num: 'G1', name: '블론드 사이드 포니', sub: 'Blonde Curly Side Pony', icon: '👱‍♀️', defColor: '#FDE047' },
                      { id: 'brown_curly_side_pony', gender: 'girl', num: 'G2', name: '초코 사이드 포니', sub: 'Brown Curly Side Pony', icon: '👩', defColor: '#5C382C' },
                      { id: 'wavy_bob_bangs', gender: 'girl', num: 'G3', name: '웨이브 볼륨 단발', sub: 'Wavy Bob with Bangs', icon: '💇‍♀️', defColor: '#5C382C' },
                      { id: 'loose_wavy_twintails', gender: 'girl', num: 'G4', name: '루즈 웨이브 트윈테일', sub: 'Loose Wavy Twin-tails', icon: '👧', defColor: '#FDE047' },
                      { id: 'straight_half_up', gender: 'girl', num: 'G5', name: '블랙 하프업 리본', sub: 'Straight Half-up Bow', icon: '🎀', defColor: '#1E293B' },
                      { id: 'neat_straight_bob', gender: 'girl', num: 'G6', name: '데님 블루 보브', sub: 'Neat Straight Bob', icon: '🫐', defColor: '#1E40AF' },
                      { id: 'hime_cut', gender: 'girl', num: 'G7', name: '클래식 롱 히메컷', sub: 'Hime-cut Long Black', icon: '👸', defColor: '#1E293B' },
                      { id: 'blonde_wavy_headband', gender: 'girl', num: 'G8', name: '플라워 헤어밴드', sub: 'Blonde Wavy Headband', icon: '🌸', defColor: '#FDE047' },
                      { id: 'beret_side_pony', gender: 'girl', num: 'G9', name: '블랙 베레모 포니', sub: 'Side Pony with Beret', icon: '🎨', defColor: '#FDE047' },
                      { id: 'wavy_bob_cat_ears', gender: 'girl', num: 'G10', name: '고양이 귀 클립 단발', sub: 'Cat Ear Clips Bob', icon: '🐱', defColor: '#5C382C' },
                      { id: 'pink_pigtails_bows', gender: 'girl', num: 'G11', name: '핑크 빅 리본 트윈', sub: 'Pink Pigtails Bows', icon: '💖', defColor: '#A855F7' },
                      { id: 'short_pixie', gender: 'girl', num: 'G12', name: '내추럴 숏 픽시', sub: 'Natural Short Pixie', icon: '✨', defColor: '#5C382C' },
                    ]
                      .filter(item => hairGenderFilter === 'all' || item.gender === hairGenderFilter)
                      .map(item => {
                        const isSelected = 
                          config.hairStyle === item.id || 
                          (item.id === 'blonde_curly_side_pony' && config.hairStyle === 'wavy_medium') ||
                          (item.id === 'loose_wavy_twintails' && config.hairStyle === 'twintail') ||
                          (item.id === 'neat_straight_bob' && config.hairStyle === 'bob_cut');
                        const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                        const price = getItemPrice(item.id);

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              handleSelectOrUnlockItem(item.id, () => {
                                updateConfig({ 
                                  hairStyle: item.id as any,
                                  gender: item.gender as any 
                                });
                              });
                            }}
                            className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all relative ${
                              isSelected
                                ? 'border-pink-500 bg-pink-50/80 shadow-xs ring-2 ring-pink-200'
                                : isUnlocked
                                ? 'border-slate-200 bg-white hover:bg-slate-50'
                                : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                            }`}
                          >
                            <div className="relative shrink-0">
                              <span className="text-2xl">{item.icon}</span>
                              <span className={`absolute -top-1 -left-1 px-1 rounded-full text-white text-[8px] font-black flex items-center justify-center ${
                                item.gender === 'boy' ? 'bg-sky-600' : 'bg-pink-600'
                              }`}>
                                {item.num}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                              {!isUnlocked ? (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                  <span>🔒</span> {price}P 해금
                                </span>
                              ) : (
                                <p className="text-[9px] text-slate-400 truncate">{item.sub}</p>
                              )}
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 shrink-0" />}
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Hair Color Selection */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>🎨</span> 머리 색상 (6종)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {HAIR_COLORS.map(c => {
                      const isSelected = config.hairColor === c.value;
                      return (
                        <button
                          key={c.name}
                          onClick={() => {
                            soundManager.play('pop');
                            updateConfig({ hairColor: c.value });
                          }}
                          className={`w-9 h-9 rounded-full border-2 transition-transform relative flex items-center justify-center shadow-xs ${
                            isSelected ? 'scale-115 border-pink-600 shadow-md ring-2 ring-pink-300' : 'border-white hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* === CATEGORY: 얼굴색 (Skin) === */}
            {activeCategory === 'skin' && (
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                  <span>👶</span> 얼굴색 선택 (5종)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {SKIN_COLORS.map(s => {
                    const isSelected = config.skinColor === s.value;
                    return (
                      <button
                        key={s.name}
                        onClick={() => {
                          soundManager.play('pop');
                          updateConfig({ skinColor: s.value });
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-pink-500 bg-pink-50/80 shadow-xs ring-2 ring-pink-200'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border border-slate-300 shadow-xs"
                            style={{ backgroundColor: s.value }}
                          />
                          <span className="text-xs font-bold text-slate-800">{s.name}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-pink-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === CATEGORY: 눈 (Eyes) === */}
            {activeCategory === 'eyes' && (
              <>
                <div>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>👁️</span> 눈 모양 & 표정 (5종)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'warm_sparkle', name: '초롱초롱 애니 큰눈', icon: '✨' },
                      { id: 'wink', name: '깜찍 윙크', icon: '😉' },
                      { id: 'sleepy', name: '나른한 눈감음', icon: '😌' },
                      { id: 'cat_eyes', name: '새침한 캣아이', icon: '😼' },
                      { id: 'sparkle_star', name: '반짝 별빛 눈', icon: '🌟' },
                    ].map(e => {
                      const isSelected = config.eyeType === e.id;
                      return (
                        <button
                          key={e.id}
                          onClick={() => {
                            soundManager.play('pop');
                            updateConfig({ eyeType: e.id as any });
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-2xl mb-1 block">{e.icon}</span>
                          <span className="text-xs font-bold text-slate-800">{e.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>🎨</span> 눈동자 렌즈 색상 (8종)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {EYE_COLORS.map(c => {
                      const isSelected = config.eyeColor === c.value;
                      return (
                        <button
                          key={c.name}
                          onClick={() => {
                            soundManager.play('pop');
                            updateConfig({ eyeColor: c.value });
                          }}
                          className={`w-8 h-8 rounded-full border-2 transition-transform relative flex items-center justify-center shadow-xs ${
                            isSelected ? 'scale-115 border-purple-600 shadow-md ring-2 ring-purple-300' : 'border-white hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* === CATEGORY: 상의 (Top) === */}
            {activeCategory === 'top' && (
              <>
                <div>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>👕</span> 자연스러운 곡선 상의 (12종)
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                    {[
                      { id: 'casual_oversized_tee', name: '오버핏 캐주얼 반팔티', sub: 'Oversized Tee', icon: '👕', tag: '남녀공용' },
                      { id: 'varsity_jacket', name: '바시티 스타디움 자켓', sub: 'Varsity Jacket', icon: '🧥', tag: '인기' },
                      { id: 'streetwear_hoodie', name: '스트릿 오버핏 후드', sub: 'Streetwear Hoodie', icon: '🧸', tag: '스트릿' },
                      { id: 'formal_blazer_tie', name: '테일러드 수트&넥타이', sub: 'Suit & Tie', icon: '👔', tag: '포멀' },
                      { id: 'denim_jacket', name: '빈티지 청자켓', sub: 'Denim Jacket', icon: '🧥', tag: '캐주얼' },
                      { id: 'bomber_ma1', name: 'MA-1 항공점퍼', sub: 'Bomber MA-1', icon: '🪂', tag: '밀리터리' },
                      { id: 'cable_knit', name: '포근 꽈배기 니트', sub: 'Cable Knit', icon: '🧶', tag: '포근' },
                      { id: 'school_cardigan', name: '스쿨 가디건 & 리본', sub: 'School Cardigan', icon: '🎀', tag: '스쿨룩' },
                      { id: 'football_jersey', name: '스포티 넘버링 져지', sub: 'Sports Jersey', icon: '⚽', tag: '스포티' },
                      { id: 'off_shoulder', name: '오프숄더 프릴 블라우스', sub: 'Off-shoulder', icon: '🌸', tag: '러블리' },
                      { id: 'crop_top_floral', name: '플라워 크롭탑', sub: 'Floral Crop', icon: '👚', tag: '서머' },
                      { id: 'hanbok_top', name: '전통 당의저고리', sub: 'Hanbok Top', icon: '👘', tag: '전통' },
                    ].map(item => {
                      const isSelected = 
                        config.topType === item.id ||
                        (item.id === 'school_cardigan' && config.topType === 'white_tshirt') ||
                        (item.id === 'streetwear_hoodie' && config.topType === 'oversized_hoodie') ||
                        (item.id === 'formal_blazer_tie' && config.topType === 'blazer');
                      const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                      const price = getItemPrice(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleSelectOrUnlockItem(item.id, () => {
                              updateConfig({ topType: item.id as any });
                            });
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all relative ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                              : isUnlocked
                              ? 'border-slate-200 bg-white hover:bg-slate-50'
                              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-2xl shrink-0">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                            {!isUnlocked ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                <span>🔒</span> {price}P 해금
                              </span>
                            ) : (
                              <span className="inline-block text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1 rounded">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>🎨</span> 상의 색상
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {CLOTHING_COLORS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => updateConfig({ topColor: c.value, outfitColor: c.value })}
                        className="w-7 h-7 rounded-full border border-slate-300 shadow-xs hover:scale-120 transition-transform"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* === CATEGORY: 하의 (Bottom) === */}
            {activeCategory === 'bottom' && (
              <>
                <div>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>👖</span> 자연스러운 곡선 하의 (10종)
                  </span>
                  <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                    {[
                      { id: 'relaxed_baggy_jeans', name: '와이드 배기 청바지', sub: 'Baggy Jeans', icon: '👖', tag: '인기' },
                      { id: 'wide_cargo_pants', name: '와이드 스트릿 카고', sub: 'Cargo Pants', icon: '🩳', tag: '스트릿' },
                      { id: 'tailored_slacks', name: '테일러드 슬랙스', sub: 'Tailored Slacks', icon: '👖', tag: '포멀' },
                      { id: 'sporty_sweatpants', name: '사이드라인 조거팬츠', sub: 'Jogger Pants', icon: '🏃', tag: '스포티' },
                      { id: 'cargo_shorts', name: '캐주얼 카고 반바지', sub: 'Cargo Shorts', icon: '🩳', tag: '서머' },
                      { id: 'pleated_skirt', name: '체크 플리츠 스커트', sub: 'Tennis Skirt', icon: '🩰', tag: '스쿨' },
                      { id: 'leather_pants', name: '시크 레더 팬츠', sub: 'Leather Skinny', icon: '🖤', tag: '시크' },
                      { id: 'ripped_jeans', name: '디스트로이드 진', sub: 'Ripped Jeans', icon: '👖', tag: '빈티지' },
                      { id: 'yoga_pants', name: '요가 레깅스', sub: 'Yoga Pants', icon: '🧘', tag: '피트니스' },
                      { id: 'denim_shorts', name: '데님 롤업 숏팬츠', sub: 'Denim Shorts', icon: '🩳', tag: '캐주얼' },
                    ].map(item => {
                      const isSelected = 
                        config.bottomType === item.id ||
                        (item.id === 'relaxed_baggy_jeans' && config.bottomType === 'boyfriend_jeans');
                      const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                      const price = getItemPrice(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleSelectOrUnlockItem(item.id, () => {
                              updateConfig({ bottomType: item.id as any });
                            });
                          }}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all relative ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                              : isUnlocked
                              ? 'border-slate-200 bg-white hover:bg-slate-50'
                              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-2xl shrink-0">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                            {!isUnlocked ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                <span>🔒</span> {price}P 해금
                              </span>
                            ) : (
                              <span className="inline-block text-[8px] font-bold text-sky-600 bg-sky-50 px-1 rounded">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>🎨</span> 하의 색상
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {CLOTHING_COLORS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => updateConfig({ bottomColor: c.value, outfitSubColor: c.value })}
                        className="w-7 h-7 rounded-full border border-slate-300 shadow-xs hover:scale-120 transition-transform"
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* === CATEGORY: 신발 & 소품 & 액세서리 === */}
            {activeCategory === 'accessory' && (
              <div className="flex flex-col gap-4">
                {/* 1. 신발 */}
                <div>
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>👟</span> 신발 컬렉션 (6종)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'chunky_sneakers', name: '청키 스트릿 스니커즈', icon: '👟' },
                      { id: 'hightop_canvas', name: '하이탑 캔버스화', icon: '👟' },
                      { id: 'leather_loafers', name: '클래식 가죽 로퍼', icon: '👞' },
                      { id: 'combat_boots', name: '워커 컴뱃 부츠', icon: '🥾' },
                      { id: 'mary_jane', name: '메리제인 & 프릴양말', icon: '👠' },
                      { id: 'slippers', name: '캐주얼 슬라이드', icon: '🩴' },
                    ].map(item => {
                      const isSelected = 
                        config.shoes === item.id ||
                        (item.id === 'chunky_sneakers' && config.shoes === 'white_sneakers');
                      const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                      const price = getItemPrice(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleSelectOrUnlockItem(item.id, () => {
                              updateConfig({ shoes: item.id as any });
                            });
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all relative ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                              : isUnlocked
                              ? 'border-slate-200 bg-white hover:bg-slate-50'
                              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 truncate block">{item.name}</span>
                            {!isUnlocked && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                <span>🔒</span> {price}P 해금
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 가방 */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>🎒</span> 가방 (5종)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'crossbag', name: '스트릿 크로스백', icon: '🎒' },
                      { id: 'backpack', name: '가죽 백팩', icon: '🎒' },
                      { id: 'leather_handbag', name: '클래식 화이트 핸드백', icon: '👜' },
                      { id: 'tote', name: '캔버스 토트백', icon: '🛍️' },
                      { id: 'none', name: '가방 미착용', icon: '🚫' },
                    ].map(item => {
                      const isSelected = config.bag === item.id;
                      const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                      const price = getItemPrice(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleSelectOrUnlockItem(item.id, () => {
                              updateConfig({ bag: item.id as any });
                            });
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all relative ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-200'
                              : isUnlocked
                              ? 'border-slate-200 bg-white hover:bg-slate-50'
                              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 truncate block">{item.name}</span>
                            {!isUnlocked && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                <span>🔒</span> {price}P 해금
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. 머리 & 페이스 액세서리 */}
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                    <span>🎀</span> 헤어 & 페이스 소품 (6종)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'headphones', name: '무선 게이밍 헤드셋', icon: '🎧' },
                      { id: 'glasses_round', name: '동글이 메탈 안경', icon: '👓' },
                      { id: 'sunglasses', name: '시크 선글라스', icon: '🕶️' },
                      { id: 'cat_ears', name: '고양이 귀 머리띠', icon: '🐱' },
                      { id: 'ribbon_back', name: '화이트 리본 보우', icon: '🎀' },
                      { id: 'none', name: '소품 없음', icon: '🚫' },
                    ].map(item => {
                      const isSelected = config.accessory === item.id;
                      const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                      const price = getItemPrice(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            handleSelectOrUnlockItem(item.id, () => {
                              updateConfig({ accessory: item.id as any });
                            });
                          }}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all relative ${
                            isSelected
                              ? 'border-pink-500 bg-pink-50/80 shadow-xs ring-2 ring-pink-200'
                              : isUnlocked
                              ? 'border-slate-200 bg-white hover:bg-slate-50'
                              : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-2xl">{item.icon}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 truncate block">{item.name}</span>
                            {!isUnlocked && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                <span>🔒</span> {price}P 해금
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* === CATEGORY: 배경 (Backgrounds) === */}
            {activeCategory === 'background' && (
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                  <span>🖼️</span> 배경 씬 선택 (6종)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {BACKGROUND_SCENES.map(sc => {
                    const isSelected = config.backgroundScene === sc.id;
                    const isUnlocked = pointsManager.isAvatarItemUnlocked(sc.id);
                    const price = getItemPrice(sc.id);

                    return (
                      <button
                        key={sc.id}
                        onClick={() => {
                          handleSelectOrUnlockItem(sc.id, () => {
                            updateConfig({ backgroundScene: sc.id as any });
                          });
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 shadow-xs ring-2 ring-sky-200'
                            : isUnlocked
                            ? 'border-slate-200 bg-white hover:bg-slate-50'
                            : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{sc.icon}</span>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-black text-slate-800">{sc.name}</p>
                              {!isUnlocked && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-700 bg-yellow-100 px-1.5 py-0.2 rounded-md">
                                  <span>🔒</span> {price}P 해금
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">{sc.desc}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* === CATEGORY: 꾸미기 (Decorations) === */}
            {activeCategory === 'decor' && (
              <div>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-2">
                  <span>⭐</span> 스티커 & 이펙트 (5종)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'sparkle_stars', name: '반짝이 별빛', icon: '✨' },
                    { id: 'floating_hearts', name: '둥실 하트', icon: '💖' },
                    { id: 'cherry_blossom', name: '흩날리는 벚꽃', icon: '🌸' },
                    { id: 'music_notes', name: '멜로디 음표', icon: '🎵' },
                    { id: 'none', name: '효과 없음', icon: '🚫' },
                  ].map(item => {
                    const isSelected = config.decorSticker === item.id;
                    const isUnlocked = pointsManager.isAvatarItemUnlocked(item.id);
                    const price = getItemPrice(item.id);

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSelectOrUnlockItem(item.id, () => {
                            updateConfig({ decorSticker: item.id as any });
                          });
                        }}
                        className={`p-3 rounded-xl border text-center transition-all relative ${
                          isSelected
                            ? 'border-pink-500 bg-pink-50/80 ring-2 ring-pink-200 shadow-xs'
                            : isUnlocked
                            ? 'border-slate-200 bg-white hover:bg-slate-50'
                            : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                        }`}
                      >
                        <span className="text-2xl mb-1 block">{item.icon}</span>
                        <span className="text-xs font-bold text-slate-800 block truncate">{item.name}</span>
                        {!isUnlocked && (
                          <span className="mt-1 inline-flex items-center gap-0.5 text-[8px] font-black text-amber-700 bg-yellow-100 px-1 py-0.2 rounded-md">
                            <span>🔒</span> {price}P
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* ======================================================================= */}
          {/* CENTER PREVIEW CANVAS STAGE (Full Character + Scenery + View Angles) */}
          {/* ======================================================================= */}
          <div className="md:col-span-4 bg-white flex flex-col items-center justify-between p-4 relative overflow-hidden border-r border-slate-200">
            
            {/* Top Floating View Angle & Gender Buttons */}
            <div className="w-full flex items-center justify-between z-20">
              {/* Gender Quick Switcher Pill */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200 shadow-xs">
                <button
                  onClick={() => {
                    soundManager.play('click');
                    updateConfig({ gender: 'boy' });
                    setHairGenderFilter('boy');
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
                    config.gender === 'boy'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👦</span>
                  <span>소년</span>
                </button>
                <button
                  onClick={() => {
                    soundManager.play('click');
                    updateConfig({ gender: 'girl' });
                    setHairGenderFilter('girl');
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 ${
                    config.gender === 'girl'
                      ? 'bg-pink-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👧</span>
                  <span>소녀</span>
                </button>
              </div>

              {/* View Angle Pill Selectors (앞모습, 옆모습, 뒷모습) */}
              <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-full border border-slate-300 shadow-sm">
                {[
                  { id: 'front', label: '앞모습', icon: '👶' },
                  { id: 'side', label: '옆모습', icon: '👧' },
                  { id: 'back', label: '뒷모습', icon: '👱' },
                ].map(angle => {
                  const isActive = (config.viewAngle || 'front') === angle.id;
                  return (
                    <button
                      key={angle.id}
                      onClick={() => {
                        soundManager.play('click');
                        setConfig(prev => ({ ...prev, viewAngle: angle.id as any }));
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold transition-all ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <span>{angle.icon}</span>
                      <span>{angle.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Character Stage with Live Background Scene */}
            <div 
              ref={avatarStageRef}
              className="flex-1 w-full flex items-center justify-center relative my-2 min-h-[360px] rounded-2xl overflow-hidden shadow-inner border border-slate-200"
            >
              <CharacterAvatar
                config={config}
                size="stage"
                showBackground={true}
                className="transform scale-100 hover:scale-102 transition-transform duration-200"
              />
            </div>

            {/* Character Name Input Bar */}
            <div className="w-full bg-[#F8FAFC] p-2 rounded-xl border border-slate-200 flex items-center justify-between gap-2 z-20 mb-3 shadow-xs">
              <span className="text-xs font-black text-slate-700 whitespace-nowrap flex items-center gap-1">
                ✏️ 캐릭터 이름
              </span>
              <input
                type="text"
                value={charName}
                maxLength={10}
                onChange={e => setCharName(e.target.value)}
                placeholder="이름 입력 (예: 도윤, 소다)"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-400 text-center"
              />
              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                {charName.length}/10
              </span>
            </div>

            {/* Bottom Action Bar (랜덤, 이전, 초기화, 저장, 즐겨찾기, 완료하기) */}
            <div className="w-full flex items-center gap-1.5 z-20">
              <button
                onClick={handleRandomize}
                className="flex-1 py-2 px-1 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                title="랜덤 생성"
              >
                <Dices className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">랜덤</span>
              </button>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                title="이전 선택"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">이전</span>
              </button>

              <button
                onClick={handleReset}
                className="py-2 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                title="초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleAddToFavorites}
                className="py-2 px-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1"
                title="즐겨찾기 추가"
              >
                <Heart className={`w-3.5 h-3.5 ${favAddedSuccess ? 'fill-white animate-ping' : ''}`} />
                <span className="hidden sm:inline">즐겨찾기</span>
              </button>

              <button
                onClick={handleApply}
                className="flex-2 py-2.5 px-3 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>저장 완료!</span>
                  </>
                ) : (
                  <>
                    <Sparkle className="w-4 h-4 text-amber-200 fill-amber-200" />
                    <span>완료하기</span>
                  </>
                )}
              </button>
            </div>

            {/* Bottom Cute Tagline */}
            <p className="text-[10px] text-slate-400 font-semibold text-center mt-2">
              ♥ 소년 & 소녀 다양한 스타일로 나만의 캐릭터를 만들어보세요! ♥
            </p>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT COLUMN: PRESETS (BOY / GIRL / FAVORITES) */}
          {/* ======================================================================= */}
          <div className="md:col-span-3 bg-[#F8FAFC] p-3 sm:p-4 overflow-y-auto flex flex-col gap-4">
            
            {/* 1. CHARACTER PRESETS (2x3 Grid with Boy / Girl / Favorites Tabs) */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col">
              {/* Header Tabs: [ 👦 소년 (6) ] | [ 👧 소녀 (6) ] | [ ⭐ 즐겨찾기 ] */}
              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveRightTab('my_characters')}
                    className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                      activeRightTab === 'my_characters'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    👦 소년 (6)
                  </button>
                  <button
                    onClick={() => setActiveRightTab('girl_presets')}
                    className={`px-2.5 py-1 rounded-full text-xs font-black transition-all ${
                      activeRightTab === 'girl_presets'
                        ? 'bg-pink-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    👧 소녀 (6)
                  </button>
                  <button
                    onClick={() => setActiveRightTab('favorites')}
                    className={`px-2 py-1 rounded-full text-xs font-black transition-all ${
                      activeRightTab === 'favorites'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ⭐
                  </button>
                </div>
              </div>

              {/* 2x3 Character Grid */}
              <div className="grid grid-cols-2 gap-2">
                {(activeRightTab === 'my_characters' 
                  ? BOY_PRESETS 
                  : activeRightTab === 'girl_presets' 
                  ? GIRL_PRESETS 
                  : favorites.length > 0 
                  ? favorites.map((fav, i) => ({ id: `fav_${i}`, name: fav.name, config: fav.config }))
                  : BOY_PRESETS
                ).map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      soundManager.play('pop');
                      setHistory(prev => [...prev, config]);
                      setConfig(p.config);
                      setCharName(p.name);
                    }}
                    className="relative bg-slate-50 hover:bg-sky-50/50 p-2 rounded-xl border border-slate-200 hover:border-sky-300 transition-all flex flex-col items-center group shadow-xs"
                  >
                    {/* Heart/Star Badge in Top-Right */}
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shadow-xs">
                      <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                    </div>

                    {/* Mini Avatar Preview */}
                    <div className="w-16 h-20 flex items-center justify-center my-0.5 pointer-events-none group-hover:scale-105 transition-transform">
                      <CharacterAvatar config={p.config} size="sm" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. BACKGROUND SELECTION (Carousel Cards) */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span>🖼️</span> 배경 선택 (6종)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">배경 탭 변경</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {BACKGROUND_SCENES.map(sc => {
                  const isSelected = config.backgroundScene === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        soundManager.play('pop');
                        updateConfig({ backgroundScene: sc.id as any });
                      }}
                      className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50 shadow-xs ring-2 ring-sky-200'
                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <span className="text-xl mb-0.5">{sc.icon}</span>
                      <span className="text-[9px] font-bold text-slate-800 truncate w-full">
                        {sc.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. RECENTLY USED ITEMS (Shelf) */}
            <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span>🕒</span> 카테고리 바로가기
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {[
                  { label: '머리', icon: '💇‍♂️', cat: 'hair' as MainCategory },
                  { label: '상의', icon: '👕', cat: 'top' as MainCategory },
                  { label: '하의', icon: '👖', cat: 'bottom' as MainCategory },
                  { label: '신발', icon: '👟', cat: 'accessory' as MainCategory },
                  { label: '배경', icon: '🖼️', cat: 'background' as MainCategory },
                  { label: '꾸미기', icon: '⭐', cat: 'decor' as MainCategory },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(item.cat)}
                    className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 hover:border-pink-400 flex flex-col items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-all group"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-[8px] font-bold text-slate-500">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
        )}

      </div>
    </div>
  );
};
