import React from 'react';
import { AnimalPetType, PetGrowthStage, PetMood } from '../types';

export interface AnimalPetProps {
  type: AnimalPetType;
  stage: PetGrowthStage;
  mood?: PetMood;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  animate?: boolean;
  isGrowing?: boolean;
  isLevelUp?: boolean;
  expProgress?: number; // 0 ~ 100%
}

export const PET_SPECIES_INFO: Record<
  AnimalPetType,
  {
    nameKo: string;
    sub: string;
    icon: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    favoriteFood: string;
    description: string;
    evolutionStory: Record<PetGrowthStage, string>;
  }
> = {
  shiba: {
    nameKo: '시바견 뽀삐',
    sub: 'Shiba Inu Dog',
    icon: '🐕',
    primaryColor: '#F59E0B',
    secondaryColor: '#FEF3C7',
    accentColor: '#D97706',
    favoriteFood: '맛있는 뼈다귀 & 소고기 간식',
    description: '충직하고 발랄한 강아지! 꼬리를 살랑살랑 흔들어요.',
    evolutionStory: {
      baby: '🍼 앙증맞은 쪽쪽이를 물고 꼬물거리는 아기 시바견!',
      child: '🎒 노란 유치원 모자를 쓰고 잔디밭을 뛰어다녀요.',
      teen: '🎧 게이밍 헤드폰과 멋진 반다나를 두른 활발한 청소년!',
      adult: '👑 황금 왕관과 챔피언 메달을 수여받은 늠름한 황금 시바 대장!',
    },
  },
  cat: {
    nameKo: '치즈냥이 냥이',
    sub: 'Cheese Cat',
    icon: '🐱',
    primaryColor: '#FB923C',
    secondaryColor: '#FFF7ED',
    accentColor: '#EA580C',
    favoriteFood: '고소한 참치캔 & 츄르',
    description: '호기심 많고 애교 넘치는 야옹이! 골골송을 불러요.',
    evolutionStory: {
      baby: '🍼 분홍 쪽쪽이를 문 말랑말랑 아기 젤리 고양이!',
      child: '🎒 노란 베레모와 물고기 크로스백을 맨 귀여운 유치원냥.',
      teen: '🎧 고양이귀 RGB 헤드셋을 끼고 리듬을 타는 힙한 고양이!',
      adult: '👑 찬란한 에메랄드 왕관과 로열 망토를 두른 귀족 치즈냥이!',
    },
  },
  rabbit: {
    nameKo: '베리 토끼 토토',
    sub: 'Berry Bunny',
    icon: '🐰',
    primaryColor: '#F472B6',
    secondaryColor: '#FDF2F8',
    accentColor: '#DB2777',
    favoriteFood: '아삭아삭 유기농 당근',
    description: '귀가 쫑긋! 깡총깡총 뛰어다니는 부드러운 아기 토끼.',
    evolutionStory: {
      baby: '🍼 딸기 쪽쪽이를 물고 볼을 오물거리는 아기 토끼.',
      child: '🎒 당근 주머니를 메고 꽃핀을 꽂은 발랄한 토끼.',
      teen: '🎧 네온 핑크 헤드폰과 리본을 착용한 팝스타 토끼!',
      adult: '👑 다이아몬드 티아라와 황금 당근 셉터를 든 달나라 토끼 여왕!',
    },
  },
  hamster: {
    nameKo: '볼빵빵 햄찌',
    sub: 'Chubby Hamster',
    icon: '🐹',
    primaryColor: '#FBBF24',
    secondaryColor: '#FEF9C3',
    accentColor: '#B45309',
    favoriteFood: '고소한 해바라기 씨앗',
    description: '볼 주머니 가득 간식을 숨겨두는 귀여운 햄스터!',
    evolutionStory: {
      baby: '🍼 볼 주머니가 빵빵한 초소형 솜뭉치 아기 햄찌!',
      child: '🎒 도토리 가방을 메고 해바라기씨를 모으는 꼬마 햄스터.',
      teen: '🎧 디제이 이어머프를 쓰고 쳇바퀴를 굴리는 스케이터 햄찌!',
      adult: '👑 황금 해바라기 왕관과 벨벳 로브를 걸친 햄스터 제국의 왕!',
    },
  },
  panda: {
    nameKo: '초코 판다 밍밍',
    sub: 'Choco Panda',
    icon: '🐼',
    primaryColor: '#1E293B',
    secondaryColor: '#F8FAFC',
    accentColor: '#0F172A',
    favoriteFood: '싱싱한 대나무 잎과 죽순',
    description: '뒹굴뒹굴 구르는 게 특기인 사랑스러운 자이언트 판다.',
    evolutionStory: {
      baby: '🍼 대나무 딸랑이를 쥔 뒹굴이 아기 판다 곰!',
      child: '🎒 대나무 물통을 챙겨 소풍 가는 귀여운 판다.',
      teen: '🎧 쿵푸 헤드밴드와 헤드폰을 착용한 열정 판다!',
      adult: '👑 태극 음양 보주와 황금 관을 쓴 전설의 쿵푸 판다 마스터!',
    },
  },
  bear: {
    nameKo: '테디 곰돌이 포포',
    sub: 'Teddy Bear',
    icon: '🐻',
    primaryColor: '#92400E',
    secondaryColor: '#FDE68A',
    accentColor: '#78350F',
    favoriteFood: '달콤한 꿀단지 & 블루베리',
    description: '포근하고 따뜻한 품을 가진 든든한 아기 곰.',
    evolutionStory: {
      baby: '🍼 꿀방울 무늬 턱받이를 한 포근한 아기 곰.',
      child: '🎒 꿀단지 보틀을 멘 호기심 많은 탐험가 꼬마 곰.',
      teen: '🎧 스트리트 후디와 힙합 헤드폰을 장착한 듬직한 청소년 곰!',
      adult: '👑 숲의 수호자 황금 뿔관과 골든 꿀 문장을 수여받은 곰 황제!',
    },
  },
  penguin: {
    nameKo: '남극 펭귄 핑구',
    sub: 'Antarctic Penguin',
    icon: '🐧',
    primaryColor: '#0F172A',
    secondaryColor: '#E0F2FE',
    accentColor: '#0284C7',
    favoriteFood: '싱싱한 빙하 은어',
    description: '뒤뚱뒤뚱 얼음판을 미끄러지듯 달리는 얼음나라 펭귄.',
    evolutionStory: {
      baby: '🍼 하늘색 얼음 쪽쪽이를 문 뽀송뽀송 아기 펭귄!',
      child: '🎒 노란 마린 세일러 모자를 쓴 귀여운 유치원 펭귄.',
      teen: '🎧 눈꽃 고글과 스노우보드 스카프를 두른 남극 라이더!',
      adult: '👑 영롱한 빙하 크리스탈 왕관과 황실 턱시도를 입은 남극의 황제!',
    },
  },
  fox: {
    nameKo: '아기여우 폭시',
    sub: 'Baby Red Fox',
    icon: '🦊',
    primaryColor: '#EA580C',
    secondaryColor: '#FFEDD5',
    accentColor: '#C2410C',
    favoriteFood: '달콤한 산딸기 & 머핀',
    description: '영리하고 똘망똘망한 눈망울과 풍성한 꼬리를 가진 여우.',
    evolutionStory: {
      baby: '🍼 방울 목걸이와 딸기 쪽쪽이를 문 요정 아기 여우.',
      child: '🎒 나뭇잎 가방을 메고 숲속을 누비는 영특한 여우.',
      teen: '🎧 붉은 불꽃 헤드폰과 닌자 머플러를 두른 날렵한 청소년 여우!',
      adult: '👑 삼미(Three-tail) 불꽃 꼬리와 황금 여우 왕관을 각성한 구미호 신수!',
    },
  },
  dragon: {
    nameKo: '초록 아기용 용용이',
    sub: 'Little Green Dragon',
    icon: '🐲',
    primaryColor: '#10B981',
    secondaryColor: '#D1FAE5',
    accentColor: '#047857',
    favoriteFood: '반짝이는 마법 마카롱',
    description: '작은 날개로 파닥거리며 작은 불꽃 하트를 뿜는 전설의 용!',
    evolutionStory: {
      baby: '🍼 불꽃 불티가 퐁퐁 솟는 앙증맞은 날개의 아기 드래곤!',
      child: '🎒 꼬마 마법 모자를 쓰고 날갯짓을 연습하는 견습 용.',
      teen: '🎧 번개 바이저와 강화된 에메랄드 날개를 장착한 청룡 드래곤!',
      adult: '👑 황금빛 거대 신룡 날개와 고대 드래곤 황금 보관을 쓴 드래곤 로드!',
    },
  },
  chick: {
    nameKo: '노랑 삐약이 삐약',
    sub: 'Yellow Chick',
    icon: '🐥',
    primaryColor: '#FACC15',
    secondaryColor: '#FEF08A',
    accentColor: '#CA8A04',
    favoriteFood: '달콤한 수수 곡물 & 젤리',
    description: '포슬포슬한 노란 솜털을 뽐내며 삐약삐약 노래해요.',
    evolutionStory: {
      baby: '🍼 알껍질 모자를 쓰고 새싹을 흔드는 포슬포슬 삐약이!',
      child: '🎒 노란 유치원 가방을 메고 합창단 연습을 하는 꼬마 새.',
      teen: '🎧 마이크 헤드셋과 데님 조끼를 입은 K-POP 아이돌 삐약이!',
      adult: '👑 태양 불사조의 황금 볏과 루비 날개를 펼친 찬란한 피닉스 로열!',
    },
  },
};

export const AnimalPet: React.FC<AnimalPetProps> = ({
  type,
  stage,
  mood = 'happy',
  size = 'md',
  className = '',
  animate = true,
  isGrowing = false,
  isLevelUp = false,
  expProgress = 0,
}) => {
  const info = PET_SPECIES_INFO[type] || PET_SPECIES_INFO.shiba;
  const uid = React.useId().replace(/:/g, '');

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-28 h-28',
    lg: 'w-44 h-44',
    xl: 'w-56 h-56',
    '2xl': 'w-72 h-72',
  };

  const isBaby = stage === 'baby';
  const isChild = stage === 'child';
  const isTeen = stage === 'teen';
  const isAdult = stage === 'adult';

  // Dynamic SVG scale based on stage progression (Baby=0.88, Child=0.96, Teen=1.04, Adult=1.12)
  const stageScale = isBaby ? 0.88 : isChild ? 0.96 : isTeen ? 1.04 : 1.12;

  // Additional subtle scale from current EXP percentage (0% to +4% physical growth)
  const dynamicExpScale = stageScale + (Math.min(100, Math.max(0, expProgress)) / 100) * 0.04;

  // Active transform animation class
  let animClass = '';
  if (isLevelUp) {
    animClass = 'animate-pet-levelup';
  } else if (isGrowing) {
    animClass = 'animate-pet-grow';
  } else if (animate) {
    if (mood === 'ecstatic' || mood === 'excited') {
      animClass = 'animate-bounce';
    } else if (mood === 'crying' || mood === 'stressed') {
      animClass = 'animate-pulse';
    } else if (mood === 'eating') {
      animClass = 'animate-pet-grow';
    } else {
      animClass = 'animate-pet-idle hover:scale-105 transition-transform duration-300';
    }
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${animClass} ${className}`}
      style={{
        transform: !isLevelUp && !isGrowing ? `scale(${dynamicExpScale})` : undefined,
        transformOrigin: 'bottom center',
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          {/* Pet Drop Shadow */}
          <filter id={`pet-shadow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="rgba(0,0,0,0.18)" />
          </filter>

          {/* Golden Glow Filter for Growth & Adult Stage */}
          <filter id={`gold-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.98  0 1 0 0 0.75  0 0 1 0 0.15  0 0 0 1 0"
            />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Radial Body Gradient */}
          <radialGradient id={`bodyGrad-${uid}`} cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="65%" stopColor={info.primaryColor} />
            <stop offset="100%" stopColor={info.accentColor} />
          </radialGradient>

          {/* Adult Radiant Solar Aura */}
          <radialGradient id={`adultAura-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE047" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ============================================================ */}
        {/* ADULT STAGE MAGNIFICENT CELESTIAL AURA BACKDROP */}
        {/* ============================================================ */}
        {isAdult && (
          <g id="adult-radiant-aura" className="animate-aura-spin">
            <circle cx="100" cy="100" r="95" fill={`url(#adultAura-${uid})`} />
            {/* 8 Radial Orbital Golden Star Sparks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
              const rad = (angle * Math.PI) / 180;
              const cx = 100 + Math.cos(rad) * 88;
              const cy = 100 + Math.sin(rad) * 88;
              return (
                <g key={idx} transform={`translate(${cx}, ${cy})`}>
                  <polygon
                    points="0,-8 2,-2 8,0 2,2 0,8 -2,2 -8,0 -2,-2"
                    fill="#FBBF24"
                    stroke="#D97706"
                    strokeWidth="1"
                    filter={`url(#gold-glow-${uid})`}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* ============================================================ */}
        {/* 1. TAILS & BACK ACCESSORIES (Stage Responsive) */}
        {/* ============================================================ */}
        <g id="pet-tail" className="animate-tail-wag">
          {/* --- SHIBA TAIL --- */}
          {type === 'shiba' && (
            <g>
              {isBaby ? (
                // Tiny stubby baby curled tail
                <circle cx="142" cy="132" r="10" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3" />
              ) : isAdult ? (
                // Grand double-curled fluffy golden tail with royal aura
                <g>
                  <path
                    d="M 136 138 C 175 130 195 90 170 78 C 145 68 152 110 134 126"
                    fill={info.primaryColor}
                    stroke="#2C1608"
                    strokeWidth="4"
                  />
                  <path d="M 170 78 C 160 88 155 95 168 106 C 178 102 182 92 170 78 Z" fill="#FEF3C7" />
                </g>
              ) : (
                // Standard curled shiba tail
                <path
                  d="M 138 135 C 165 125 175 100 160 95 C 145 90 148 115 136 128"
                  fill={info.primaryColor}
                  stroke="#2C1608"
                  strokeWidth="3.5"
                />
              )}
            </g>
          )}

          {/* --- CAT TAIL --- */}
          {type === 'cat' && (
            <g>
              {isBaby ? (
                // Tiny kitten swishing tail
                <path d="M 138 136 Q 160 135 156 120" stroke="#2C1608" strokeWidth="3" fill="none" strokeLinecap="round" />
              ) : isAdult ? (
                // Sleek aristocratic tail with gold ribbon
                <g>
                  <path
                    d="M 140 140 C 180 145 195 105 175 85 C 160 72 160 100 140 125"
                    fill={info.primaryColor}
                    stroke="#2C1608"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Gold Tail Ribbon */}
                  <circle cx="178" cy="90" r="5" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
                </g>
              ) : (
                <path
                  d="M 142 140 C 175 145 185 110 170 95 C 158 85 158 105 142 125"
                  fill={info.primaryColor}
                  stroke="#2C1608"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              )}
            </g>
          )}

          {/* --- RABBIT TAIL --- */}
          {type === 'rabbit' && (
            <g>
              <circle
                cx={isAdult ? 154 : 148}
                cy="138"
                r={isBaby ? 10 : isAdult ? 17 : 13}
                fill="#FFFFFF"
                stroke="#2C1608"
                strokeWidth="3"
              />
              {isAdult && <circle cx="154" cy="138" r="7" fill="#FDF2F8" />}
            </g>
          )}

          {/* --- FOX TAIL --- */}
          {type === 'fox' && (
            <g>
              {isAdult ? (
                // 3-Tail Divine Kitsune Flare
                <g>
                  {/* Tail 1 (Left) */}
                  <path d="M 125 140 C 170 170 195 120 185 95 C 170 80 150 110 125 130 Z" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3" />
                  {/* Tail 2 (Center) */}
                  <path d="M 135 135 C 185 140 205 90 180 65 C 160 45 145 90 130 115 Z" fill={info.accentColor} stroke="#2C1608" strokeWidth="3.5" />
                  <path d="M 180 65 C 170 75 165 82 175 92 C 185 90 190 80 180 65 Z" fill="#FFFFFF" />
                  {/* Tail 3 (Right) */}
                  <path d="M 130 145 C 165 185 190 150 170 130 Z" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3" />
                </g>
              ) : isBaby ? (
                // Small cute fox tail
                <path d="M 135 138 C 160 145 170 115 158 100 C 148 90 142 110 130 125 Z" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3" />
              ) : (
                <g>
                  <path
                    d="M 135 140 C 180 150 195 100 175 75 C 158 55 145 95 130 120 Z"
                    fill={info.primaryColor}
                    stroke="#2C1608"
                    strokeWidth="3.5"
                  />
                  <path d="M 175 75 C 165 85 160 92 170 102 C 180 100 185 90 175 75 Z" fill="#FFFFFF" />
                </g>
              )}
            </g>
          )}

          {/* --- DRAGON WINGS & TAIL --- */}
          {type === 'dragon' && (
            <g id="dragon-wings-tail">
              {isBaby ? (
                // Cute Tiny Baby Flutter Wings
                <g>
                  <path d="M 68 95 C 45 80 40 60 55 58 C 60 70 68 80 74 90 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" />
                  <path d="M 132 95 C 155 80 160 60 145 58 C 140 70 132 80 126 90 Z" fill="#34D399" stroke="#065F46" strokeWidth="2.5" />
                </g>
              ) : isAdult ? (
                // Grand Golden-Edge Dragon Wings & Flame Tail
                <g>
                  {/* Left Big Wing */}
                  <path d="M 55 95 C 15 70 0 25 35 18 C 45 45 60 70 70 90 Z" fill="#10B981" stroke="#064E3B" strokeWidth="4" />
                  <path d="M 35 18 L 45 45 L 30 50 Z" fill="#FBBF24" />
                  {/* Right Big Wing */}
                  <path d="M 145 95 C 185 70 200 25 165 18 C 155 45 140 70 130 90 Z" fill="#10B981" stroke="#064E3B" strokeWidth="4" />
                  <path d="M 165 18 L 155 45 L 170 50 Z" fill="#FBBF24" />
                  {/* Spiked Tail with Flame Tip */}
                  <path d="M 140 140 C 175 148 190 130 180 115 L 155 130 Z" fill={info.primaryColor} stroke="#064E3B" strokeWidth="3" />
                  <polygon points="180,115 195,110 188,125" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.5" />
                </g>
              ) : (
                // Standard Dragon Wings
                <g>
                  <path d="M 60 90 C 30 70 20 40 40 35 C 48 55 60 70 70 85 Z" fill="#34D399" stroke="#065F46" strokeWidth="3" />
                  <path d="M 140 90 C 170 70 180 40 160 35 C 152 55 140 70 130 85 Z" fill="#34D399" stroke="#065F46" strokeWidth="3" />
                  <path d="M 140 140 C 170 145 180 130 170 120 L 155 130 Z" fill={info.primaryColor} stroke="#065F46" strokeWidth="3" />
                </g>
              )}
            </g>
          )}

          {/* --- CHICK WINGS --- */}
          {type === 'chick' && (
            <g>
              {isAdult ? (
                // Golden Phoenix Wing Flares
                <g>
                  <path d="M 45 110 C 20 95 10 70 30 65 C 38 80 48 95 55 110 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="3" />
                  <path d="M 155 110 C 180 95 190 70 170 65 C 162 80 152 95 145 110 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="3" />
                </g>
              ) : null}
            </g>
          )}
        </g>

        {/* ============================================================ */}
        {/* 2. BODY BASE & FEET (Stage Sprite Proportions) */}
        {/* ============================================================ */}
        <g id="pet-body" filter={`url(#pet-shadow-${uid})`}>
          {/* Main Body Proportions */}
          <ellipse
            cx="100"
            cy={isBaby ? 112 : isChild ? 108 : isTeen ? 105 : 102}
            rx={isBaby ? 54 : isChild ? 58 : isTeen ? 62 : 66}
            ry={isBaby ? 52 : isChild ? 56 : isTeen ? 60 : 65}
            fill={`url(#bodyGrad-${uid})`}
            stroke="#2C1608"
            strokeWidth="4"
          />

          {/* Soft White/Pastel Tummy Patch */}
          <ellipse
            cx="100"
            cy={isBaby ? 122 : isChild ? 120 : isTeen ? 118 : 116}
            rx={isBaby ? 32 : isChild ? 35 : isTeen ? 38 : 42}
            ry={isBaby ? 30 : isChild ? 33 : isTeen ? 36 : 40}
            fill={info.secondaryColor}
            stroke="#2C1608"
            strokeWidth="2"
          />

          {/* Feet & Paws */}
          <g id="pet-feet">
            {/* Left Foot */}
            <ellipse
              cx={isBaby ? 76 : 74}
              cy={isBaby ? 152 : isAdult ? 158 : 155}
              rx={isBaby ? 13 : isAdult ? 17 : 15}
              ry={isBaby ? 9 : isAdult ? 12 : 11}
              fill={info.secondaryColor}
              stroke="#2C1608"
              strokeWidth="3"
            />
            {/* Right Foot */}
            <ellipse
              cx={isBaby ? 124 : 126}
              cy={isBaby ? 152 : isAdult ? 158 : 155}
              rx={isBaby ? 13 : isAdult ? 17 : 15}
              ry={isBaby ? 9 : isAdult ? 12 : 11}
              fill={info.secondaryColor}
              stroke="#2C1608"
              strokeWidth="3"
            />
          </g>

          {/* Front Paws / Arms */}
          <g id="pet-paws">
            <ellipse
              cx="62"
              cy={isBaby ? 118 : 114}
              rx={isBaby ? 8 : 11}
              ry={isBaby ? 10 : 13}
              fill={info.secondaryColor}
              stroke="#2C1608"
              strokeWidth="2.5"
            />
            <ellipse
              cx="138"
              cy={isBaby ? 118 : 114}
              rx={isBaby ? 8 : 11}
              ry={isBaby ? 10 : 13}
              fill={info.secondaryColor}
              stroke="#2C1608"
              strokeWidth="2.5"
            />
          </g>
        </g>

        {/* ============================================================ */}
        {/* 3. EARS & HEAD ACCESSORIES (Animated twitch) */}
        {/* ============================================================ */}
        <g id="pet-ears" className="animate-ear-twitch">
          {/* Shiba Inu Dog Ears */}
          {type === 'shiba' && (
            <>
              <polygon points="56,65 42,25 78,45" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <polygon points="56,60 48,32 72,46" fill="#FEF3C7" />
              <polygon points="144,65 158,25 122,45" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <polygon points="144,60 152,32 128,46" fill="#FEF3C7" />
            </>
          )}

          {/* Cat Ears */}
          {type === 'cat' && (
            <>
              <polygon points="54,65 38,28 76,46" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <polygon points="54,60 44,35 70,48" fill="#FDA4AF" />
              <polygon points="146,65 162,28 124,46" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <polygon points="146,60 156,35 130,48" fill="#FDA4AF" />
            </>
          )}

          {/* Rabbit Long Floppy/Upright Ears */}
          {type === 'rabbit' && (
            <>
              <ellipse
                cx="65"
                cy={isBaby ? 35 : 28}
                rx={isBaby ? 12 : 15}
                ry={isBaby ? 28 : 36}
                transform="rotate(-12 65 30)"
                fill={info.primaryColor}
                stroke="#2C1608"
                strokeWidth="3.5"
              />
              <ellipse
                cx="65"
                cy={isBaby ? 35 : 28}
                rx={isBaby ? 7 : 9}
                ry={isBaby ? 18 : 26}
                transform="rotate(-12 65 30)"
                fill="#FCE7F3"
              />
              <ellipse
                cx="135"
                cy={isBaby ? 35 : 28}
                rx={isBaby ? 12 : 15}
                ry={isBaby ? 28 : 36}
                transform="rotate(12 135 30)"
                fill={info.primaryColor}
                stroke="#2C1608"
                strokeWidth="3.5"
              />
              <ellipse
                cx="135"
                cy={isBaby ? 35 : 28}
                rx={isBaby ? 7 : 9}
                ry={isBaby ? 18 : 26}
                transform="rotate(12 135 30)"
                fill="#FCE7F3"
              />
            </>
          )}

          {/* Hamster / Bear Round Ears */}
          {(type === 'hamster' || type === 'bear' || type === 'panda') && (
            <>
              <circle cx="52" cy="52" r={isBaby ? 15 : 19} fill={type === 'panda' ? '#0F172A' : info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <circle cx="52" cy="52" r={isBaby ? 8 : 11} fill={type === 'panda' ? '#334155' : '#FDE68A'} />
              <circle cx="148" cy="52" r={isBaby ? 15 : 19} fill={type === 'panda' ? '#0F172A' : info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <circle cx="148" cy="52" r={isBaby ? 8 : 11} fill={type === 'panda' ? '#334155' : '#FDE68A'} />
            </>
          )}

          {/* Penguin Tuft */}
          {type === 'penguin' && (
            <g>
              <ellipse cx="100" cy="50" rx="6" ry="10" fill="#0F172A" stroke="#2C1608" strokeWidth="2" />
            </g>
          )}

          {/* Fox Ears */}
          {type === 'fox' && (
            <>
              <polygon points="50,70 32,20 80,45" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <polygon points="50,65 40,28 72,46" fill="#FFFFFF" />
              <polygon points="150,70 168,20 120,45" fill={info.primaryColor} stroke="#2C1608" strokeWidth="3.5" />
              <polygon points="150,65 160,28 128,46" fill="#FFFFFF" />
            </>
          )}

          {/* Dragon Horns */}
          {type === 'dragon' && (
            <>
              <polygon
                points={isAdult ? "65,55 45,15 80,42" : "65,55 52,25 78,45"}
                fill="#FBBF24"
                stroke="#78350F"
                strokeWidth="2.5"
              />
              <polygon
                points={isAdult ? "135,55 155,15 120,42" : "135,55 148,25 122,45"}
                fill="#FBBF24"
                stroke="#78350F"
                strokeWidth="2.5"
              />
            </>
          )}

          {/* Chick Sprout / Top Feather */}
          {type === 'chick' && (
            <g>
              {isAdult ? (
                // Golden Phoenix Triple Crest
                <g>
                  <path d="M 100 48 Q 80 15 95 10 Q 105 28 100 48" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
                  <path d="M 100 48 Q 100 8 106 6 Q 112 25 100 48" fill="#EF4444" stroke="#991B1B" strokeWidth="2" />
                  <path d="M 100 48 Q 120 15 105 10 Q 102 28 100 48" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
                </g>
              ) : (
                <g>
                  <path d="M 100 48 Q 90 25 100 18 Q 106 32 100 48" fill="#22C55E" stroke="#15803D" strokeWidth="2" />
                  <path d="M 100 48 Q 110 25 106 20" stroke="#15803D" strokeWidth="2" fill="none" />
                </g>
              )}
            </g>
          )}
        </g>

        {/* ============================================================ */}
        {/* 4. FACIAL EXPRESSIONS & EYES (Stage Scaled) */}
        {/* ============================================================ */}
        <g id="pet-face">
          {/* Panda Black Eye Patches */}
          {type === 'panda' && (
            <>
              <ellipse cx="76" cy="88" rx={isBaby ? 15 : 13} ry={isBaby ? 17 : 15} transform="rotate(-15 76 88)" fill="#0F172A" />
              <ellipse cx="124" cy="88" rx={isBaby ? 15 : 13} ry={isBaby ? 17 : 15} transform="rotate(15 124 88)" fill="#0F172A" />
            </>
          )}

          {/* Rosy Peach Cheeks / Shy Heart Cheeks */}
          {mood === 'shy' ? (
            <>
              {/* Heart shaped blush cheeks */}
              <path d="M 64 96 C 64 92 58 92 58 95 C 58 98 64 102 64 102 C 64 102 70 98 70 95 C 70 92 64 92 64 96 Z" fill="#F43F5E" />
              <path d="M 136 96 C 136 92 130 92 130 95 C 130 98 136 102 136 102 C 136 102 142 98 142 95 C 142 92 136 92 136 96 Z" fill="#F43F5E" />
            </>
          ) : (
            <>
              <ellipse cx="64" cy="98" rx={isBaby ? 12 : 9} ry={isBaby ? 7 : 5.5} fill="#F43F5E" opacity={mood === 'ecstatic' || mood === 'eating' ? 0.7 : 0.45} />
              <ellipse cx="136" cy="98" rx={isBaby ? 12 : 9} ry={isBaby ? 7 : 5.5} fill="#F43F5E" opacity={mood === 'ecstatic' || mood === 'eating' ? 0.7 : 0.45} />
            </>
          )}

          {/* ================= DYNAMIC EYES ================= */}
          {/* 1. ECSTATIC / EXCITED: Star eyes / Happy curved anime eyes */}
          {mood === 'ecstatic' || mood === 'excited' ? (
            <g id="star-sparkle-eyes">
              {/* Left Star Eye */}
              <ellipse cx="78" cy="86" rx={isBaby ? 11 : 9} ry={isBaby ? 12 : 10} fill="#1E1B4B" />
              {/* Sparkling 4-point Star Inside Eye */}
              <polygon points="78,79 80,84 85,86 80,88 78,93 76,88 71,86 76,84" fill="#FDE047" />
              <circle cx="83" cy="82" r="2.5" fill="#FFFFFF" />

              {/* Right Star Eye */}
              <ellipse cx="122" cy="86" rx={isBaby ? 11 : 9} ry={isBaby ? 12 : 10} fill="#1E1B4B" />
              <polygon points="122,79 124,84 129,86 124,88 122,93 120,88 115,86 120,84" fill="#FDE047" />
              <circle cx="127" cy="82" r="2.5" fill="#FFFFFF" />
            </g>
          ) : mood === 'wink' ? (
            <g id="wink-eyes">
              {/* Left Eye: Big sparkle */}
              <ellipse cx="78" cy="86" rx={isBaby ? 11 : 9} ry={isBaby ? 12 : 10} fill="#1E1B4B" />
              <circle cx="75" cy="82" r="4" fill="#FFFFFF" />
              <circle cx="81" cy="90" r="2.2" fill="#FFFFFF" />

              {/* Right Eye: Cute Wink curve */}
              <path d="M 114 86 Q 122 78 130 86" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 128 85 L 133 82" stroke="#1E1B4B" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : mood === 'proud' ? (
            <g id="proud-eyes">
              {/* Confident happy arch eyes with sparkle */}
              <path d="M 70 88 Q 78 77 86 88" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 114 88 Q 122 77 130 88" stroke="#1E1B4B" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Sparkle star on cheek */}
              <polygon points="144,78 145,81 148,82 145,83 144,86 143,83 140,82 143,81" fill="#F59E0B" />
            </g>
          ) : mood === 'eating' ? (
            <g id="eating-eyes">
              {/* Closed smiling happy arches */}
              <path d="M 70 87 Q 78 78 86 87" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 114 87 Q 122 78 130 87" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Cute little crumbs */}
              <circle cx="92" cy="106" r="1.5" fill="#D97706" />
              <circle cx="108" cy="107" r="1.5" fill="#D97706" />
            </g>
          ) : mood === 'sleepy' ? (
            <g id="sleepy-eyes">
              {/* Droopy half-closed sleepy eyes */}
              <path d="M 70 86 Q 78 92 86 86" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M 114 86 Q 122 92 130 86" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              {/* Floating Zzz */}
              <text x="140" y="75" fontSize="14" fontWeight="900" fill="#6366F1" opacity="0.9">Z</text>
              <text x="150" y="65" fontSize="10" fontWeight="900" fill="#818CF8" opacity="0.8">z</text>
            </g>
          ) : mood === 'surprised' ? (
            <g id="surprised-eyes">
              {/* Wide open big round eyes */}
              <circle cx="78" cy="85" r={isBaby ? 13 : 11} fill="#1E1B4B" />
              <circle cx="76" cy="83" r="5.5" fill="#FFFFFF" />
              <circle cx="82" cy="89" r="2.5" fill="#FFFFFF" />

              <circle cx="122" cy="85" r={isBaby ? 13 : 11} fill="#1E1B4B" />
              <circle cx="120" cy="83" r="5.5" fill="#FFFFFF" />
              <circle cx="126" cy="89" r="2.5" fill="#FFFFFF" />
              {/* Surprised exclamation marks */}
              <text x="100" y="48" textAnchor="middle" fontSize="18" fontWeight="900" fill="#EF4444">!</text>
            </g>
          ) : mood === 'curious' ? (
            <g id="curious-eyes">
              {/* One big eye, one slightly narrowed eye (head tilt curiosity) */}
              <ellipse cx="78" cy="85" rx={isBaby ? 11 : 9.5} ry={isBaby ? 12 : 10.5} fill="#1E1B4B" />
              <circle cx="75" cy="82" r="4" fill="#FFFFFF" />

              <ellipse cx="122" cy="87" rx={isBaby ? 10 : 8.5} ry={isBaby ? 9 : 7.5} fill="#1E1B4B" />
              <circle cx="120" cy="85" r="3" fill="#FFFFFF" />
              {/* Question mark float */}
              <text x="138" y="60" fontSize="16" fontWeight="900" fill="#3B82F6">?</text>
            </g>
          ) : mood === 'hungry' ? (
            <g id="hungry-eyes">
              {/* Begging puppy dog round teary eyes */}
              <ellipse cx="78" cy="86" rx={isBaby ? 11 : 9.5} ry={isBaby ? 12 : 10.5} fill="#1E1B4B" />
              <circle cx="75" cy="81" r="5" fill="#FFFFFF" />
              <circle cx="82" cy="89" r="3" fill="#FFFFFF" />
              <ellipse cx="78" cy="95" rx="8" ry="2.5" fill="#38BDF8" opacity="0.6" />

              <ellipse cx="122" cy="86" rx={isBaby ? 11 : 9.5} ry={isBaby ? 12 : 10.5} fill="#1E1B4B" />
              <circle cx="119" cy="81" r="5" fill="#FFFFFF" />
              <circle cx="126" cy="89" r="3" fill="#FFFFFF" />
              <ellipse cx="122" cy="95" rx="8" ry="2.5" fill="#38BDF8" opacity="0.6" />
            </g>
          ) : mood === 'stressed' ? (
            <g id="stressed-eyes">
              <path d="M 72 82 Q 78 88 84 82" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M 116 82 Q 122 88 128 82" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
              {/* Blue sweat drop */}
              <ellipse cx="140" cy="78" rx="4" ry="7" fill="#38BDF8" />
            </g>
          ) : mood === 'crying' ? (
            <g id="crying-eyes">
              <path d="M 72 86 Q 78 80 84 86" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <path d="M 116 86 Q 122 80 128 86" stroke="#1E1B4B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              {/* Gushing teardrops */}
              <path d="M 70 92 C 65 110 55 118 70 125 C 85 118 75 110 70 92 Z" fill="#38BDF8" opacity="0.85" />
              <path d="M 130 92 C 125 110 115 118 130 125 C 145 118 135 110 130 92 Z" fill="#38BDF8" opacity="0.85" />
            </g>
          ) : (
            // Default 'happy' / 'shy' / normal eyes
            <g id="sparkle-eyes">
              <ellipse cx="78" cy="86" rx={isBaby ? 11 : isChild ? 9.5 : 8.5} ry={isBaby ? 12 : isChild ? 10.5 : 9.5} fill="#1E1B4B" />
              <circle cx="75" cy="82" r={isBaby ? 5 : 3.8} fill="#FFFFFF" />
              <circle cx="81" cy="90" r="2.2" fill="#FFFFFF" />

              <ellipse cx="122" cy="86" rx={isBaby ? 11 : isChild ? 9.5 : 8.5} ry={isBaby ? 12 : isChild ? 10.5 : 9.5} fill="#1E1B4B" />
              <circle cx="119" cy="82" r={isBaby ? 5 : 3.8} fill="#FFFFFF" />
              <circle cx="125" cy="90" r="2.2" fill="#FFFFFF" />
            </g>
          )}

          {/* ================= NOSE & MOUTH EXPRESSIONS ================= */}
          {type === 'chick' || type === 'penguin' ? (
            <g id="beak-mouth">
              {mood === 'surprised' || mood === 'ecstatic' ? (
                // Wide open chirping beak
                <polygon points="100,83 87,95 113,95 100,102" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
              ) : mood === 'eating' ? (
                // Chewing beak
                <polygon points="100,86 88,93 112,93" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
              ) : (
                <polygon points="100,86 90,94 110,94" fill="#F97316" stroke="#C2410C" strokeWidth="2" />
              )}
            </g>
          ) : (
            <g id="nose-and-mouth">
              <ellipse cx="100" cy="92" rx="4.5" ry="3.5" fill="#2C1608" />
              
              {/* Dynamic mouth curves per mood */}
              {mood === 'ecstatic' || mood === 'surprised' ? (
                // Big open cheerful mouth with pink tongue
                <g>
                  <path d="M 92 97 Q 100 112 108 97 Z" fill="#EF4444" stroke="#2C1608" strokeWidth="2.5" />
                  <path d="M 95 105 Q 100 102 105 105" fill="#FDA4AF" />
                </g>
              ) : mood === 'eating' ? (
                // Chewing chubby mouth with cute puffed cheeks
                <path d="M 94 98 Q 100 104 106 98" stroke="#2C1608" strokeWidth="3" fill="#FDA4AF" strokeLinecap="round" />
              ) : mood === 'proud' ? (
                // Smug cat smile :3
                <path d="M 93 96 Q 97 101 100 96 Q 103 101 107 96" stroke="#2C1608" strokeWidth="3" fill="none" strokeLinecap="round" />
              ) : mood === 'hungry' ? (
                // Open drooling mouth
                <g>
                  <ellipse cx="100" cy="99" rx="4" ry="5" fill="#EF4444" stroke="#2C1608" strokeWidth="2" />
                  {/* Drool drop */}
                  <ellipse cx="104" cy="107" rx="2" ry="3.5" fill="#38BDF8" />
                </g>
              ) : mood === 'crying' || mood === 'stressed' ? (
                // Wobbly sad mouth :(
                <path d="M 94 102 Q 100 96 106 102" stroke="#2C1608" strokeWidth="3" fill="none" strokeLinecap="round" />
              ) : mood === 'sleepy' ? (
                // Tiny gentle sleeping mouth
                <path d="M 96 98 Q 100 100 104 98" stroke="#2C1608" strokeWidth="2" fill="none" strokeLinecap="round" />
              ) : (
                // Classic happy cute pet smile :3
                <path d="M 94 97 Q 100 102 100 95 Q 100 102 106 97" stroke="#2C1608" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              )}
            </g>
          )}

          {/* Cat Whiskers */}
          {type === 'cat' && (
            <g stroke="#2C1608" strokeWidth="2" strokeLinecap="round">
              <line x1="56" y1="92" x2="42" y2="90" />
              <line x1="56" y1="98" x2="40" y2="100" />
              <line x1="144" y1="92" x2="158" y2="90" />
              <line x1="144" y1="98" x2="160" y2="100" />
            </g>
          )}
        </g>

        {/* ============================================================ */}
        {/* 5. STAGE SPRITE ACCESSORIES (Distinct 4-Stage Evolution) */}
        {/* ============================================================ */}
        <g id="evolution-accessories">
          {/* ========================================= */}
          {/* --- STAGE 1: BABY (Lv.1~3) --- */}
          {/* ========================================= */}
          {isBaby && (
            <g id="baby-items">
              {/* Cute Baby Pacifier (쪽쪽이) */}
              <g transform="translate(0, 0)">
                <circle cx="100" cy="103" r="7.5" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
                <ellipse cx="100" cy="103" rx="4" ry="4" fill="#FFFFFF" />
                <circle cx="100" cy="112" r="4.5" fill="none" stroke="#38BDF8" strokeWidth="2.5" />
              </g>
              {/* Baby Ruffled Collar Bib */}
              <path d="M 85 116 Q 100 128 115 116" stroke="#FDA4AF" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* ========================================= */}
          {/* --- STAGE 2: CHILD (Lv.4~6) --- */}
          {/* ========================================= */}
          {isChild && (
            <g id="child-items">
              {/* Yellow Kindergarten Sun Hat (유치원 모자) */}
              <ellipse cx="100" cy="48" rx="30" ry="8" fill="#FACC15" stroke="#CA8A04" strokeWidth="2.5" />
              <path d="M 80 48 C 80 30 120 30 120 48 Z" fill="#FDE047" stroke="#CA8A04" strokeWidth="2.5" />
              {/* Hat Ribbon */}
              <line x1="80" y1="46" x2="120" y2="46" stroke="#EF4444" strokeWidth="3" />
              {/* Yellow Shoulder Crossbag */}
              <path d="M 66 114 L 128 146" stroke="#F59E0B" strokeWidth="3.5" />
              <circle cx="128" cy="144" r="9" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
              {/* Cute badge on bag */}
              <circle cx="128" cy="144" r="3.5" fill="#EF4444" />
            </g>
          )}

          {/* ========================================= */}
          {/* --- STAGE 3: TEEN (Lv.7~9) --- */}
          {/* ========================================= */}
          {isTeen && (
            <g id="teen-items">
              {/* Cool RGB Gaming Headphones */}
              <path d="M 45 65 C 45 20 155 20 155 65" fill="none" stroke="#6366F1" strokeWidth="7" strokeLinecap="round" />
              {/* Left Headphone Cup */}
              <rect x="38" y="56" width="16" height="25" rx="7" fill="#4F46E5" stroke="#312E81" strokeWidth="2.5" />
              <circle cx="46" cy="68" r="4" fill="#38BDF8" />
              {/* Right Headphone Cup */}
              <rect x="146" y="56" width="16" height="25" rx="7" fill="#4F46E5" stroke="#312E81" strokeWidth="2.5" />
              <circle cx="154" cy="68" r="4" fill="#38BDF8" />
              {/* Red Street Bandana / Scarf */}
              <polygon points="100,128 78,110 122,110" fill="#EF4444" stroke="#991B1B" strokeWidth="2.5" />
              <circle cx="100" cy="116" r="2.5" fill="#FFFFFF" />
            </g>
          )}

          {/* ========================================= */}
          {/* --- STAGE 4: ADULT (Lv.10+) --- */}
          {/* ========================================= */}
          {isAdult && (
            <g id="adult-items">
              {/* Sparkling Golden Royal Crown (황금 왕관) */}
              <polygon
                points="78,40 72,14 86,26 100,8 114,26 128,14 122,40"
                fill="#FBBF24"
                stroke="#B45309"
                strokeWidth="3"
                filter={`url(#gold-glow-${uid})`}
              />
              {/* Ruby, Sapphire & Emerald Jewels on Crown */}
              <circle cx="100" cy="18" r="3.5" fill="#EF4444" stroke="#991B1B" strokeWidth="1" />
              <circle cx="85" cy="25" r="3" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="1" />
              <circle cx="115" cy="25" r="3" fill="#10B981" stroke="#047857" strokeWidth="1" />
              {/* Crown Base Velvet Trim */}
              <rect x="76" y="37" width="48" height="6" rx="3" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="1.5" />

              {/* Gold Star Champion Medal on Chest */}
              <g transform="translate(100, 120)">
                {/* Red Blue Medal Ribbon */}
                <polygon points="-8,-14 0,0 -8,10" fill="#3B82F6" />
                <polygon points="8,-14 0,0 8,10" fill="#EF4444" />
                <circle cx="0" cy="4" r="11" fill="#FDE047" stroke="#B45309" strokeWidth="2.5" />
                <text x="0" y="8" textAnchor="middle" fontSize="12" fontWeight="900" fill="#78350F">★</text>
              </g>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
