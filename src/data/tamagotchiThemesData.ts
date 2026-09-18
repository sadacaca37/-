import { TamagotchiThemeType } from '../types';

export interface ThemeMeta {
  id: TamagotchiThemeType;
  name: string;
  badge: string;
  cost: number;
  icon: string;
  desc: string;
  bgGradient: string;
  accentColor: string;
}

export const TAMAGOTCHI_THEMES: ThemeMeta[] = [
  {
    id: 'warm_living',
    name: '포근한 스위트홈',
    badge: '기본 제공',
    cost: 0,
    icon: '🏡',
    desc: '따스한 햇살이 드는 아치형 창문과 원목 가구가 어우러진 아늑한 거실',
    bgGradient: 'from-amber-100 via-orange-50 to-amber-200',
    accentColor: '#F59E0B',
  },
  {
    id: 'cosmic_space',
    name: '신비로운 은하수 우주선',
    badge: '100P 해금',
    cost: 100,
    icon: '🚀',
    desc: '창밖으로 지구와 토성이 보이는 은하수 속 최첨단 우주선 캡슐',
    bgGradient: 'from-indigo-950 via-purple-900 to-slate-950',
    accentColor: '#818CF8',
  },
  {
    id: 'deep_ocean',
    name: '아쿠아 바닷속 산호초',
    badge: '150P 해금',
    cost: 150,
    icon: '🌊',
    desc: '보글보글 공기방울과 빛나는 산호초, 신비한 해파리가 헤엄치는 바다',
    bgGradient: 'from-cyan-900 via-sky-800 to-blue-950',
    accentColor: '#38BDF8',
  },
  {
    id: 'cloud_heaven',
    name: '둥실둥실 구름 파라다이스',
    badge: '200P 해금',
    cost: 200,
    icon: '☁️',
    desc: '무지개 다리와 폭신한 솜사탕 구름 위에 지어진 하늘나라 놀이터',
    bgGradient: 'from-sky-300 via-indigo-100 to-pink-200',
    accentColor: '#EC4899',
  },
  {
    id: 'fairy_forest',
    name: '반딧불이 요정의 숲',
    badge: '250P 해금',
    cost: 250,
    icon: '🌲',
    desc: '반짝이는 반딧불이와 빛나는 야광 버섯이 비밀스럽게 빛나는 신비의 숲',
    bgGradient: 'from-emerald-950 via-teal-900 to-green-950',
    accentColor: '#34D399',
  },
  {
    id: 'candy_land',
    name: '달콤 바삭 캔디랜드',
    badge: '300P 해금',
    cost: 300,
    icon: '🍭',
    desc: '도넛 언덕과 롤리팝 사탕나무, 딸기 생크림 구름이 가득한 과자 나라',
    bgGradient: 'from-pink-300 via-rose-100 to-amber-200',
    accentColor: '#FB7185',
  },
  {
    id: 'crystal_castle',
    name: '크리스탈 얼음 왕국',
    badge: '350P 해금',
    cost: 350,
    icon: '🏰',
    desc: '환상적인 오로라와 영롱한 얼음 보석이 빛나는 겨울 궁전',
    bgGradient: 'from-sky-950 via-cyan-900 to-blue-900',
    accentColor: '#67E8F9',
  },
];
