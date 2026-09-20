import React from 'react';
import { PlaygroundTamagotchi } from './PlaygroundTamagotchi';
import { TetrisGame } from './TetrisGame';
import { InfiniteStairsGame } from './InfiniteStairsGame';
import { Game2048 } from './Game2048';
import { SuikaGame } from './SuikaGame';
import { TanghuluGame } from './TanghuluGame';
import { JellyRunnerGame } from './JellyRunnerGame';
import { LastWarGameWrapper } from './games/LastWarGameWrapper';
import { PonpokoGameWrapper } from './games/PonpokoGameWrapper';
import { BubbleBobbleGameWrapper } from './games/BubbleBobbleGameWrapper';
import { SuperMarioGameWrapper } from './games/SuperMarioGameWrapper';
import { AirplaneShootingGame } from './games/AirplaneShootingGame';
import { PocketKartOriginal } from './games/PocketKartOriginal';
import { BlockCraftGame } from './games/BlockCraftGame';

export interface PlaygroundGameDef {
  id: string;
  title: string;
  category: '기본' | '펀펀' | '템플릿';
  icon: string; // emoji
  badgeLetter?: string;
  badgeBg?: string;
  author?: string;
  description?: string;
  date?: string;
  externalUrl?: string;
  component: React.ComponentType<any>;
}

/**
 * 🎮 플레이그라운드 등록 게임 목록
 * (깃허브 게임 7종 정식 수록 & 정상 구동)
 */
export const PLAYGROUND_GAMES: PlaygroundGameDef[] = [
  // --- 기본 게임 (비타자 유행 캐주얼 게임) ---
  {
    id: 'suika',
    title: '수박게임',
    category: '기본',
    icon: '🍉',
    component: SuikaGame,
  },
  {
    id: 'tanghulu',
    title: '탕후루 마스터',
    category: '기본',
    icon: '🍡',
    component: TanghuluGame,
  },
  {
    id: 'jelly-runner',
    title: '젤리 점프 러너',
    category: '기본',
    icon: '🏃',
    component: JellyRunnerGame,
  },
  {
    id: 'tetris',
    title: '테트리스',
    category: '기본',
    icon: '🧱',
    component: TetrisGame,
  },
  {
    id: 'infinite-stairs',
    title: '무한의 계단',
    category: '기본',
    icon: '🪜',
    component: InfiniteStairsGame,
  },
  {
    id: 'game-2048',
    title: '2048 퍼즐',
    category: '기본',
    icon: '🔢',
    component: Game2048,
  },
  {
    id: 'tamagotchi',
    title: '타자 다마고치 룸',
    category: '기본',
    icon: '🐾',
    component: PlaygroundTamagotchi,
  },

  // --- 펀펀 플레이 (깃허브 게임 7종 전면 교체 & 100% 정상 작동) ---
  {
    id: 'app-lastwar',
    title: '라스트워 (Bridge Assault 3D)',
    category: '펀펀',
    icon: '⚔️',
    description: '3D 돌파 액션 & 부대 증식 전략 아케이드 게임',
    component: LastWarGameWrapper,
  },
  {
    id: 'app-ponpoko',
    title: '너구리 (Ponpoko 1982)',
    category: '펀펀',
    icon: '🦝',
    description: '고전 오락실 명작 너구리 아케이드 복원판',
    component: PonpokoGameWrapper,
  },
  {
    id: 'app-bubble-bobble',
    title: '보글보글 (Bubble Bobble)',
    category: '펀펀',
    icon: '🫧',
    description: '버블 드래곤 방울 쏘기 고전 아케이드 명작',
    component: BubbleBobbleGameWrapper,
  },
  {
    id: 'app-super-mario',
    title: '슈퍼마리오 (Super Mario Bros)',
    category: '펀펀',
    icon: '🍄',
    description: '마리오 & 루이지 버섯 왕국 모험 횡스크롤 액션',
    component: SuperMarioGameWrapper,
  },
  {
    id: 'app-airplane-shooting',
    title: '비행기 슈팅 (1945 Air Combat)',
    category: '펀펀',
    icon: '✈️',
    description: '전투기 7종 · 스테이지 10개 · 보스전 1945 공중전 (깃허브 원본)',
    component: AirplaneShootingGame,
  },
  {
    id: 'app-pocket-kart',
    title: '카트라이더 (포켓 카트 GP)',
    category: '펀펀',
    icon: '🏎️',
    description: '캐릭터·카트를 골라 달리는 3D 드리프트 레이싱 (원본 그대로)',
    component: PocketKartOriginal,
  },
  {
    id: 'app-blockcraft',
    title: '마크 (블록 크래프트)',
    category: '펀펀',
    icon: '⛏️',
    description: '블록을 캐고 쌓는 3D 샌드박스 · 조합대 · 동물·몬스터 · 방 코드로 친구와 함께',
    component: BlockCraftGame,
  },
];

