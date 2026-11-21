import { PetGrowthStage, TamagotchiPetId } from '../types';

export type TamagotchiMoodSpriteKey = 'happy' | 'hungry' | 'sleepy' | 'sad';

export interface TamagotchiPetDef {
  id: TamagotchiPetId;
  name: string;
  species: string;
  tagline: string;
  emoji: string;
  cardTint: string;
  greeting: string;
  stages: Record<PetGrowthStage, string>;
  moods: Record<TamagotchiMoodSpriteKey, string>;
  stageDescs: Record<PetGrowthStage, string>;
}

const makeFolderSprites = (folder: string) => ({
  stages: {
    baby: `./assets/tamagotchi/${folder}/stage-egg.webp`,
    child: `./assets/tamagotchi/${folder}/stage-baby.webp`,
    teen: `./assets/tamagotchi/${folder}/stage-child.webp`,
    adult: `./assets/tamagotchi/${folder}/stage-adult.webp`,
  },
  moods: {
    happy: `./assets/tamagotchi/${folder}/mood-happy.webp`,
    hungry: `./assets/tamagotchi/${folder}/mood-hungry.webp`,
    sleepy: `./assets/tamagotchi/${folder}/mood-sleepy.webp`,
    sad: `./assets/tamagotchi/${folder}/mood-sad.webp`,
  },
});

export const TAMAGOTCHI_PETS: TamagotchiPetDef[] = [
  {
    id: 'tori',
    name: '토리',
    species: '숲속 토끼',
    tagline: '머리 위 새싹이 반짝이는 숲속 단짝',
    emoji: '🌱',
    cardTint: 'from-[#fef6dd] to-[#e9f5d8]',
    greeting: '반가워요! 맛있는 간식을 주고 함께 놀아주며 숲속 토끼 토리를 키워주세요! 🌿',
    stages: {
      baby: './assets/tamagotchi/stage-egg.webp',
      child: './assets/tamagotchi/stage-baby.webp',
      teen: './assets/tamagotchi/stage-child.webp',
      adult: './assets/tamagotchi/stage-adult.webp',
    },
    moods: {
      happy: './assets/tamagotchi/mood-happy.webp',
      hungry: './assets/tamagotchi/mood-hungry.webp',
      sleepy: './assets/tamagotchi/mood-sleepy.webp',
      sad: './assets/tamagotchi/mood-sad.webp',
    },
    stageDescs: {
      baby: '포근한 별무늬 알 속에서 작은 새싹이 고개를 내밀고 있어요!',
      child: '막 알에서 깨어난 동글동글한 아기 토리! 보살핌이 필요해요.',
      teen: '빨간 모험가 스카프를 두르고 활기차게 자라는 어린이 토리!',
      adult: '초록 망토와 황금 꽃봉오리를 피운 든든한 숲의 수호자 토리!',
    },
  },
  {
    id: 'dino',
    name: '공룡이',
    species: '아기 공룡',
    tagline: '씩씩한 모험심을 품은 초록 잎사귀 공룡',
    emoji: '🦕',
    cardTint: 'from-[#eefbe6] to-[#d6f5c9]',
    greeting: '크앙! 씩씩한 아기 공룡 공룡이와 함께 즐거운 타자 모험을 떠나요! 🌿',
    ...makeFolderSprites('dino'),
    stageDescs: {
      baby: '초록 점박이 정글 알 위에서 싱싱한 잎사귀가 흔들리고 있어요!',
      child: '껍질을 톡 깨고 나온 귀여운 아기 공룡이! 호기심이 가득해요.',
      teen: '하늘색 탐험 스카프를 두르고 성큼성큼 자라는 어린이 공룡이!',
      adult: '황금 월계관과 붉은 망토를 두른 멋진 숲의 대장 공룡이!',
    },
  },
  {
    id: 'cloud',
    name: '뭉게',
    species: '구름 양',
    tagline: '솜사탕처럼 폭신폭신한 하늘 구름 양',
    emoji: '☁️',
    cardTint: 'from-[#f0f7ff] to-[#dff0ff]',
    greeting: '메에~ 포근한 구름 양 뭉게와 둥실둥실 신나게 놀아요! ☁️✨',
    ...makeFolderSprites('cloud'),
    stageDescs: {
      baby: '파란 하늘에 하얀 구름 무늬가 그려진 몽글몽글 알이에요!',
      child: '구름 한 조각처럼 가볍고 보송보송한 아기 양 뭉게!',
      teen: '분홍 방울 리본을 달고 폴짝폴짝 뛰어다니는 어린이 뭉게!',
      adult: '작은 날개와 황금 별 왕관을 쓴 하늘의 수호 양 뭉게!',
    },
  },
  {
    id: 'star',
    name: '루나',
    species: '별 고양이',
    tagline: '밤하늘 반짝임을 꼬리에 담은 별 고양이',
    emoji: '🌙',
    cardTint: 'from-[#eef2ff] to-[#dde4ff]',
    greeting: '야옹~ 반짝이는 별 고양이 루나가 오늘도 힘차게 응원할게요! 🌙✨',
    ...makeFolderSprites('star'),
    stageDescs: {
      baby: '깊은 밤하늘 빛깔에 초승달이 반짝이는 신비로운 알이에요!',
      child: '별가루가 톡톡 묻은 조그마한 아기 별 고양이 루나!',
      teen: '황금 별 목걸이를 차고 꼬리를 흔드는 장난꾸러기 어린이 루나!',
      adult: '은하수 망토와 초승달 왕관을 두른 우아한 밤하늘 수호자 루나!',
    },
  },
  {
    id: 'fox',
    name: '불꽃이',
    species: '불꽃 여우',
    tagline: '따뜻한 모닥불 꼬리를 흔드는 활기찬 여우',
    emoji: '🦊',
    cardTint: 'from-[#fff3e6] to-[#ffe0c2]',
    greeting: '콩콩! 따뜻한 불꽃 여우 불꽃이와 에너지 넘치게 연습해 봐요! 🔥',
    ...makeFolderSprites('fox'),
    stageDescs: {
      baby: '따끈따끈한 불꽃 무늬가 감싸고 있는 주황빛 알이에요!',
      child: '폭신한 불꽃 꼬리를 살랑이는 귀여운 아기 여우 불꽃이!',
      teen: '초록 숲속 스카프를 두르고 빠르게 달리는 어린이 불꽃이!',
      adult: '황금빛 갈기와 타오르는 꼬리를 뽐내는 늠름한 어른 불꽃이!',
    },
  },
  {
    id: 'turtle',
    name: '꼬부',
    species: '바다 거북',
    tagline: '반짝이는 산호 등껍질을 가진 바다 탐험가',
    emoji: '🐢',
    cardTint: 'from-[#e6fbfa] to-[#ccf4f0]',
    greeting: '첨벙첨벙! 바다 거북 꼬부와 시원하고 즐거운 하루를 보내요! 🌊',
    ...makeFolderSprites('turtle'),
    stageDescs: {
      baby: '에메랄드 파도 무늬가 반짝이는 시원한 바다 알이에요!',
      child: '작은 등껍질을 메고 아장아장 걷는 아기 바다 거북 꼬부!',
      teen: '멋진 탐험 고글을 쓰고 바다를 누비는 어린이 거북 꼬부!',
      adult: '반짝이는 수정 등껍질과 황금 왕관을 쓴 바다의 수호자 꼬부!',
    },
  },
  {
    id: 'bee',
    name: '꾸리',
    species: '꿀벌 곰',
    tagline: '달콤한 꿀을 좋아하는 둥글둥글 꿀벌 곰',
    emoji: '🍯',
    cardTint: 'from-[#fff9e0] to-[#ffecad]',
    greeting: '윙윙~ 달콤한 꿀벌 곰 꾸리에게 맛있는 간식을 나눠주세요! 🍯💛',
    ...makeFolderSprites('bee'),
    stageDescs: {
      baby: '황금 벌집 무늬에 달콤한 꿀방울이 맺힌 포근한 알이에요!',
      child: '줄무늬 꿀벌 모자를 쏙 쓴 동글동글 아기 곰 꾸리!',
      teen: '빨간 리본과 작은 날개를 파닥이며 춤추는 어린이 꾸리!',
      adult: '황금 꿀벌 왕관과 포근한 망토를 걸친 꿀숲의 대장 꾸리!',
    },
  },
  {
    id: 'penguin',
    name: '핑키사',
    species: '펭귄 기사',
    tagline: '작은 투구를 쓰고 정의를 지키는 용감한 펭귄',
    emoji: '🛡️',
    cardTint: 'from-[#eaf4ff] to-[#d4e8ff]',
    greeting: '충성! 용감한 펭귄 기사 핑키사가 오늘의 훈련을 함께할게요! 🛡️❄️',
    ...makeFolderSprites('penguin'),
    stageDescs: {
      baby: '시원한 눈꽃 문양이 새겨진 반짝반짝 얼음 알이에요!',
      child: '보송보송한 솜털을 뽐내는 뒤뚱뒤뚱 아기 펭귄 핑키사!',
      teen: '반짝이는 은색 투구와 빨간 스카프를 두른 견습 기사 핑키사!',
      adult: '깃털 투구와 방패, 푸른 망토를 갖춘 당당한 얼음 기사 핑키사!',
    },
  },
  {
    id: 'mushroom',
    name: '버미',
    species: '버섯 요정',
    tagline: '빨간 물방울 모자를 쓴 아기자기 숲속 요정',
    emoji: '🍄',
    cardTint: 'from-[#fff0ed] to-[#ffdcd6]',
    greeting: '콩닥콩닥! 숲속 버섯 요정 버미와 재미있게 놀아주세요! 🍄🌿',
    ...makeFolderSprites('mushroom'),
    stageDescs: {
      baby: '초록 이끼와 작은 빨간 버섯이 돋아난 포근한 숲속 알이에요!',
      child: '작은 버섯 모자를 쓰고 아장아장 걸어다니는 아기 요정 버미!',
      teen: '초록 잎사귀 옷깃을 두른 명랑한 어린이 버섯 요정 버미!',
      adult: '황금빛 점무늬 모자와 도토리 지팡이를 든 지혜로운 숲의 현자 버미!',
    },
  },
  {
    id: 'dragon',
    name: '드라곤',
    species: '아기 용',
    tagline: '작은 날개로 하늘을 꿈꾸는 민트빛 아기 용',
    emoji: '🐉',
    cardTint: 'from-[#e8fcf5] to-[#ccf5e8]',
    greeting: '파닥파닥! 하늘을 꿈꾸는 아기 용 드라곤과 멋지게 성장해 봐요! 🐉✨',
    ...makeFolderSprites('dragon'),
    stageDescs: {
      baby: '비취빛 용 비늘과 황금 띠가 빛나는 신비로운 용의 알이에요!',
      child: '작은 뿔과 날개를 파닥이며 깨어난 아기 용 드라곤!',
      teen: '빨간 스카프를 휘날리며 날아오를 준비를 하는 어린이 드라곤!',
      adult: '황금 뿔과 넓은 날개, 빛나는 보석을 품은 하늘의 수호 용 드라곤!',
    },
  },
];

export const TAMAGOTCHI_PET_MAP: Record<TamagotchiPetId, TamagotchiPetDef> = TAMAGOTCHI_PETS.reduce(
  (acc, pet) => {
    acc[pet.id] = pet;
    return acc;
  },
  {} as Record<TamagotchiPetId, TamagotchiPetDef>
);

export function getTamagotchiPetDef(petId?: string): TamagotchiPetDef {
  if (petId && petId in TAMAGOTCHI_PET_MAP) {
    return TAMAGOTCHI_PET_MAP[petId as TamagotchiPetId];
  }
  return TAMAGOTCHI_PET_MAP.tori;
}
