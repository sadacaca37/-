export type AppMode = 
  | 'home' 
  | 'key-practice' 
  | 'word-practice' 
  | 'sentence-practice' 
  | 'long-practice'
  | 'knowledge-hub'
  | 'capital-journey'
  | 'joseon-journey'
  | 'lyrics-challenge'
  | 'python-coding'
  | 'transcription-challenge'
  | 'mini-games'
  | 'tamagotchi'
  | 'playground'
  | 'word-crush'
  | 'mole-game'
  | 'rain-game'
  | 'shortcut-quiz' 
  | 'leaderboard';

export interface AvatarConfig {
  gender?: 'boy' | 'girl' | 'cute' | 'pet';
  skinColor: string;
  hairStyle: 
    | 'two_block_dandy'
    | 'comma_hair'
    | 'wolf_cut_messy'
    | 'center_part_wavy'
    | 'dandy_perm'
    | 'beanie_curls'
    | 'side_part_classic'
    | 'short_spiky'
    | 'blonde_curly_side_pony'
    | 'brown_curly_side_pony'
    | 'wavy_bob_bangs'
    | 'loose_wavy_twintails'
    | 'straight_half_up'
    | 'neat_straight_bob'
    | 'hime_cut'
    | 'blonde_wavy_headband'
    | 'beret_side_pony'
    | 'wavy_bob_cat_ears'
    | 'pink_pigtails_bows'
    | 'wavy_medium'
    | 'long_straight'
    | 'bob_cut'
    | 'ponytail'
    | 'twintail'
    | 'curly_perm'
    | 'short_pixie'
    | 'side_braid'
    | 'short' 
    | 'long' 
    | 'straight' 
    | 'curly' 
    | 'cap' 
    | 'beanie' 
    | 'comma' 
    | 'two_block' 
    | 'bob' 
    | 'beret' 
    | 'bun'
    | 'curly_bob'
    | 'yellow_ribbon'
    | 'straw_hat'
    | 'sailor_cap'
    | 'witch_hat'
    | 'rabbit_ribbon'
    | 'brown_ribbon'
    | 'frog_hood'
    | 'cherry_buns';
  hairColor: string;
  eyeType?: 'warm_sparkle' | 'cat_eyes' | 'soft_almond' | 'wink' | 'sparkle_star' | 'sleepy';
  eyeColor?: string; // Eye lens color (brown, blue, purple, emerald, pink, gray, amber)
  eyebrowType?: 'soft_arch' | 'straight' | 'bold' | 'soft_curved';
  eyebrowColor?: string;
  noseType?: 'subtle_dot' | 'line_shadow' | 'button' | 'none';
  mouthType?: 'gentle_smile' | 'open_smile' | 'cat_mouth' | 'neutral_pout' | 'grin';
  faceExpression: 'smile' | 'wink' | 'glasses' | 'sunglasses' | 'sparkle' | 'cool' | 'cat' | 'heart' | 'blush' | 'determined' | 'fire' | 'sleepy' | 'neutral';
  faceDeco?: 'none' | 'star' | 'heart' | 'cheek_star' | 'cheek_heart' | 'bandage' | 'freckles' | 'blush';
  topType?: 
    | 'casual_oversized_tee'
    | 'varsity_jacket'
    | 'streetwear_hoodie'
    | 'formal_blazer_tie'
    | 'denim_jacket'
    | 'bomber_ma1'
    | 'cable_knit'
    | 'school_cardigan'
    | 'football_jersey'
    | 'off_shoulder'
    | 'crop_top_floral'
    | 'white_tshirt'
    | 'oversized_hoodie'
    | 'trench_coat'
    | 'blazer'
    | 'crop_top_stripe'
    | 'tuxedo'
    | 'sundress'
    | 'gothic_jacket'
    | 'techwear_tank'
    | 'hanbok_top';
  topColor?: string;
  bottomType?: 
    | 'relaxed_baggy_jeans'
    | 'wide_cargo_pants'
    | 'tailored_slacks'
    | 'sporty_sweatpants'
    | 'cargo_shorts'
    | 'pleated_skirt'
    | 'leather_pants'
    | 'ripped_jeans'
    | 'yoga_pants'
    | 'denim_shorts'
    | 'boyfriend_jeans'
    | 'skater_skirt'
    | 'linen_shorts'
    | 'maxi_skirt';
  bottomColor?: string;
  outfit: 
    | 'custom_mix'
    | 'white_tshirt_jeans'
    | 'star_sweatshirt'
    | 'sailor_dress'
    | 'witch_robe'
    | 'steampunk_dress'
    | 'black_apron_dress'
    | 'alps_dress'
    | 'purple_hoodie'
    | 'school' 
    | 'hoodie' 
    | 'overalls' 
    | 'dress' 
    | 'sailor' 
    | 'sport' 
    | 'wizard' 
    | 'bomber' 
    | 'knit' 
    | 'suit' 
    | 'hanbok';
  outfitColor: string;
  outfitSubColor?: string;
  shoes: 'chunky_sneakers' | 'hightop_canvas' | 'leather_loafers' | 'combat_boots' | 'mary_jane' | 'slippers' | 'white_sneakers' | 'boots' | 'sneakers' | 'roller' | 'sandals' | 'loafers';
  shoesColor: string;
  bag: 'leather_handbag' | 'backpack' | 'crossbag' | 'tote' | 'wand' | 'keyboard' | 'boba' | 'book' | 'gamepad' | 'none';
  bagColor: string;
  accessory: 'glasses_round' | 'sunglasses' | 'beret' | 'beanie' | 'bucket_hat' | 'headphones' | 'ribbon' | 'hat' | 'star' | 'crown' | 'halo' | 'cat_ears' | 'star_pin' | 'ribbon_back' | 'hairpin_flower' | 'none';
  accessoryColor?: string;
  rotation?: number; // 0 (front), -1 (left), 1 (right)
  viewAngle?: 'front' | 'side' | 'back';
  backgroundScene?: 'terrace' | 'beach' | 'park' | 'city_night' | 'room' | 'forest';
  characterName?: string;
  decorSticker?: 'none' | 'sparkle_stars' | 'cherry_blossom' | 'floating_hearts' | 'music_notes' | 'bubbles';
}

export type AnimalPetType = 
  | 'shiba'    // 시바견 (강아지)
  | 'cat'      // 치즈 고양이
  | 'rabbit'   // 아기 토끼
  | 'hamster'  // 볼빵빵 햄스터
  | 'panda'    // 꼬마 판다
  | 'bear'     // 아기 곰
  | 'penguin'  // 남극 펭귄
  | 'fox'      // 아기 여우
  | 'dragon'   // 아기 드래곤 (용용이)
  | 'chick';   // 병아리 / 아기새

export type PetGrowthStage = 'baby' | 'child' | 'teen' | 'adult';

export type PetMood = 
  | 'ecstatic'  // 대행복 (반짝반짝 하트 & 점프)
  | 'happy'     // 행복 (생글생글 웃음)
  | 'wink'      // 윙크 & 애교
  | 'proud'     // 뿌듯 & 늠름 (자랑스러움)
  | 'eating'    // 냠냠 맛있게 먹는 중 (볼 빵빵)
  | 'excited'   // 흥분 & 신남 (별빛 눈망울)
  | 'sleepy'    // 졸림 & 꾸벅꾸벅 (Zzz)
  | 'shy'       // 수줍 & 발그레 (하트 볼)
  | 'surprised' // 깜짝 놀람 (동공 확장 & 입 떡벌림)
  | 'curious'   // 호기심 갸우뚱 (?_?)
  | 'hungry'    // 배고픔 (침 꼴깍 & 꼬르륵)
  | 'stressed'  // 지침 & 스트레스
  | 'crying';   // 엉엉 눈물

export type TamagotchiThemeType = 
  | 'warm_living'    // 포근한 스위트홈 (기본)
  | 'cosmic_space'   // 신비로운 은하수 우주선
  | 'deep_ocean'     // 아쿠아 바닷속 산호초
  | 'cloud_heaven'   // 둥실둥실 구름 위 파라다이스
  | 'fairy_forest'   // 반딧불이 요정의 숲
  | 'candy_land'     // 달콤 바삭 캔디랜드
  | 'crystal_castle'; // 크리스탈 얼음 왕국

export interface RoomDecorState {
  wallpaper: 'warm_cream' | 'pastel_pink' | 'sky_cloud' | 'night_stars' | 'mint_forest' | 'lavender_dream' | 'candy_sweet' | 'cyber_grid';
  flooring: 'wood_oak' | 'wood_cherry' | 'pastel_tile' | 'soft_carpet' | 'marble_gold' | 'tatami_mat';
  rug: 'bear_rug' | 'circle_sun' | 'flower_pink' | 'star_magic' | 'heart_cloud' | 'cat_paw_rug' | 'none';
  windowView: 'sunny_sky' | 'night_moon' | 'sakura_spring' | 'snowy_winter' | 'rainbow_forest' | 'city_sunset';
  wallDecor: 'family_photo' | 'neon_clock' | 'plant_shelf' | 'gold_trophy' | 'party_garland' | 'led_keyboard_sign' | 'none';
  furniture: 'cozy_sofa' | 'cat_tower' | 'arcade_box' | 'piano_mini' | 'magic_tent' | 'gaming_desk' | 'dessert_table' | 'none';
  floorToy: 'play_ball' | 'teddy_bear' | 'robot_toy' | 'train_set' | 'food_bowl_royal' | 'magic_wand_stand' | 'none';
  lighting: 'warm_pendant' | 'disco_ball' | 'fairy_lights' | 'star_lamp' | 'aurora_projector' | 'none';
}

export interface TamagotchiState {
  name: string;
  petType: AnimalPetType;
  level: number;
  exp: number;
  maxExp: number;
  happiness: number; // 0 ~ 100
  hunger: number;    // 0 ~ 100 (100 = 배부름)
  stress: number;    // 0 ~ 100 (높을수록 스트레스)
  cleanliness: number; // 0 ~ 100
  totalMissionsSuccess: number;
  totalMissionsFailed: number;
  mood: PetMood;
  lastFed: number;
  lastPlayed: number;
  homeTheme?: TamagotchiThemeType;
  unlockedThemes?: TamagotchiThemeType[];
  practicePoints?: number; // 타자 연습으로 획득한 테마 및 방 꾸미기 포인트
  unlockedDecors?: string[]; // 해금된 방 꾸미기 아이템 ID 목록
  roomDecor?: RoomDecorState;
}

export interface MonthlySpeedRecord {
  month: number;
  year: number;
  avgCpm: number;
  highestCpm: number;
  improvement: number; // 전월 대비 또는 시작 대비 상승량
  evaluation: string;
  practiceCount: number;
  completedSentences: number;
}

export interface UserSession {
  id: string;
  name: string;
  studentId?: string; // 학생 ID
  phone?: string;
  email?: string; // 학생 또는 복구용 이메일
  parentPhone?: string; // 학부모님 전화번호 (선택)
  grade?: number; // 1~6학년
  password?: string;
  avatar: string;
  avatarBg?: string;
  avatarConfig?: AvatarConfig;
  levelTitle?: string;
  nickname?: string;
  averageCpm?: number;
  isApproved?: boolean; // 마스터(선생님) 승인 여부
  role?: 'student' | 'master'; // 학생 or 마스터(선생님)
  createdAt: number;
  lastLoginAt: number;
  totalPracticeCount: number;
  highestCpm: number;
  curriculumProgress?: {
    currentStage: string;
    currentModule: 'key' | 'word' | 'sentence' | 'game';
    currentLanguage?: 'ko' | 'en';
    stepNumber: number;
    totalSteps: number;
    progressPercent: number;
    completedItemsCount: number;
    completedStepIds?: string[];
  };
  monthlySpeedRecords?: MonthlySpeedRecord[];
}

export interface PracticeHistoryRecord {
  id: string;
  userId: string;
  userName: string;
  mode: AppMode;
  modeTitle: string; // 예: "한글 자리 1단계 (홈 포지션)", "영어 낱말 (동물과 자연)", "한글 짧은 글 (속담)"
  language: 'ko' | 'en';
  stageTitle: string;
  sampleText?: string;
  cpm: number;
  accuracy: number;
  errorCount: number;
  correctCount?: number;
  totalKeystrokes: number;
  elapsedSeconds: number;
  timestamp: number;
  dateStr: string;
  feedback?: string;
}

export interface CurriculumStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  language: 'ko' | 'en';
  type: 'key' | 'word' | 'sentence';
  mode: AppMode;
  stageId?: number | string;
  categoryIndex?: number;
  description: string;
  badge: string;
  iconName?: string;
}

export interface MasterConfig {
  masterKey: string;
  masterEmail: string;
  masterName: string;
  masterPassword?: string;
  masterPhone?: string;
  isRegistered: boolean;
  registeredAt?: number;
  phone?: string;
}

export type FingerType = 
  | 'left-pinky' 
  | 'left-ring' 
  | 'left-middle' 
  | 'left-index' 
  | 'thumb' 
  | 'right-index' 
  | 'right-middle' 
  | 'right-ring' 
  | 'right-pinky';

export interface KeyData {
  code: string;
  charKo: string;
  charKoShift?: string;
  charEn: string;
  charEnShift?: string;
  display?: string;
  finger: FingerType;
  fingerName: string;
  width?: string;
  hand: 'left' | 'right' | 'both';
}

export interface TypingStats {
  cpm: number;
  accuracy: number;
  errorCount: number;
  correctCount: number;
  totalKeystrokes: number;
  elapsedSeconds: number;
  combo: number;
  maxCombo: number;
}

export interface LeaderboardEntry {
  id: string;
  userName: string;
  userAvatar?: string;
  grade?: number; // 1~6학년
  mode: 'sentence' | 'mole-game' | 'rain-game' | 'shortcut-quiz'; // 명예의 전당에는 짧은 글만 기록됨
  modeTitle: string;
  score: number;
  cpm: number;
  accuracy: number;
  date: string;
  details?: string;
  completedSentences?: number;
}

export interface ShortcutQuizItem {
  id: number;
  question: string;
  description: string;
  keys: string[];
  keysDisplay: string;
  category: '기본 단축키' | '웹 브라우저' | '윈도우 시스템' | '문서 작성';
  options?: string[];
  hint?: string;
}

export interface PracticeStage {
  id: number;
  title: string;
  subtitle: string;
  keys: string[];
  sampleList: string[];
}

export interface CapitalItem {
  id: number;
  country: string;
  capital: string;
  continent: '아시아' | '유럽' | '아메리카' | '아프리카' | '오세아니아';
  flag: string;
  clue: string;
  englishCountry?: string;
  englishCapital?: string;
}

export interface JoseonKingItem {
  order: number;
  name: string;
  birthName: string;
  reign: string;
  title: string;
  achievement: string;
  fullSentence: string;
  keyWords: string[];
  importance?: 'core' | 'notable';
  headline?: string;
  subdesc?: string;
}

