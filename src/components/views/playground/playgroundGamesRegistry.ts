import React from 'react';
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
import { CookieKingdomRun } from './games/CookieKingdomRun';
import { PogeunForestGame, AshenHollowGame, BaramIslandGame, LightsaberDuelGame, FlameSquadGame } from './games/NewFunfunGames';

export interface PlaygroundGameDef {
  id: string;
  title: string;
  category: '기본' | '펀펀' | '템플릿';
  icon: string; // emoji
  thumb?: string; // 16-bit pixel art thumbnail path
  badgeLetter?: string;
  badgeBg?: string;
  author?: string;
  description?: string;
  date?: string;
  externalUrl?: string;
  players?: number; // 한 번에 같이 할 수 있는 사람 수 (카드에 👥 표시)
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
    thumb: './assets/playground/thumb-suika.webp',
    component: SuikaGame,
  },
  {
    id: 'tanghulu',
    title: '탕후루 마스터',
    category: '기본',
    icon: '🍡',
    thumb: './assets/playground/thumb-tanghulu.webp',
    component: TanghuluGame,
  },
  {
    id: 'jelly-runner',
    title: '젤리 점프 러너',
    category: '기본',
    icon: '🏃',
    thumb: './assets/playground/thumb-jelly-runner.webp',
    component: JellyRunnerGame,
  },
  {
    id: 'tetris',
    title: '테트리스',
    category: '기본',
    icon: '🧱',
    thumb: './assets/playground/thumb-tetris.webp',
    component: TetrisGame,
  },
  {
    id: 'infinite-stairs',
    title: '무한의 계단',
    category: '기본',
    icon: '🪜',
    thumb: './assets/playground/thumb-infinite-stairs.webp',
    component: InfiniteStairsGame,
  },
  {
    id: 'game-2048',
    title: '2048 퍼즐',
    category: '기본',
    icon: '🔢',
    thumb: './assets/playground/thumb-2048.webp',
    component: Game2048,
  },

  // --- 펀펀 플레이 (이름은 우리말로 새로 지음) ---
  // 새 게임은 이 목록 맨 끝에 넣기 → 화면에서는 최신순(맨 끝에 넣은 게임이 맨 위)으로 보임
  {
    id: 'app-lastwar',
    players: 2,
    title: '다리 돌파 작전',
    category: '펀펀',
    icon: '⚔️',
    thumb: './assets/playground/thumb-lastwar.webp',
    description: '3D 다리 돌파 액션 · 문을 지나며 부대를 늘리는 전략 아케이드 · 👥 2인 대결',
    component: LastWarGameWrapper,
  },
  {
    id: 'app-ponpoko',
    players: 2,
    title: '숲속 사다리 모험',
    category: '펀펀',
    icon: '🦝',
    thumb: './assets/playground/thumb-ponpoko.webp',
    description: '사다리를 오르내리며 과일을 모으는 옛날 오락실 느낌 게임 · 👥 2인 대결',
    component: PonpokoGameWrapper,
  },
  {
    id: 'app-bubble-bobble',
    players: 2,
    title: '방울 용 대작전',
    category: '펀펀',
    icon: '🫧',
    thumb: './assets/playground/thumb-bubble.webp',
    description: '방울을 쏴서 몬스터를 가두고 터뜨리는 아케이드 게임 · 👥 2인 대결',
    component: BubbleBobbleGameWrapper,
  },
  {
    id: 'app-super-mario',
    players: 2,
    title: '버섯 숲 점프 모험',
    category: '펀펀',
    icon: '🍄',
    thumb: './assets/playground/thumb-mario.webp',
    description: '달리고 점프해서 길을 건너는 옆으로 가는 액션 게임 · 👥 2인 대결',
    component: SuperMarioGameWrapper,
  },
  {
    id: 'app-airplane-shooting',
    players: 2,
    title: '하늘 비행 대작전',
    category: '펀펀',
    icon: '✈️',
    thumb: './assets/playground/thumb-airplane.webp',
    description: '전투기 7종 · 스테이지 10개 · 보스전이 있는 비행 슈팅 · 👥 2인 대결',
    component: AirplaneShootingGame,
  },
  {
    id: 'app-pocket-kart',
    players: 2,
    title: '타자팡 카트 레이싱',
    category: '펀펀',
    icon: '🏎️',
    thumb: './assets/playground/thumb-kart.webp',
    description: '캐릭터·카트·트랙(사막·네온 시티·숲·좀비마을)을 골라 달리는 3D 드리프트 레이싱 · 별·부스터·점프·비행 · 👥 2인 대결',
    component: PocketKartOriginal,
  },
  {
    id: 'app-cookie-run',
    players: 2,
    title: '과자 왕국 런',
    category: '펀펀',
    icon: '🍪',
    thumb: './assets/playground/thumb-cookie.webp',
    description: '쿠키가 달리는 러너 게임 · 쿠키 4종 · 스테이지 4개 · 점프·2단 점프·슬라이드로 젤리와 코인 모으기 · 👥 2인 대결',
    component: CookieKingdomRun,
  },
  {
    id: 'app-blockcraft',
    players: 1,
    title: '블록 쌓기 월드',
    category: '펀펀',
    icon: '⛏️',
    thumb: './assets/playground/thumb-blockcraft.webp',
    description: '블록을 캐고 쌓는 3D 샌드박스 · 조합대 · 동물·몬스터',
    component: BlockCraftGame,
  },
  {
    id: 'app-pogeunforest',
    players: 10,
    title: '포근숲 이야기',
    category: '펀펀',
    icon: '🐭',
    thumb: './assets/playground/thumb-pogeunforest.webp',
    description: '모아팡 내 캐릭터로 하는 스타듀밸리풍 2D 농장 · 👥 친구 10명까지 함께(대화·밭 10곳) · 칼·도끼·활로 큰 몬스터 사냥·마을 습격 · 벌목 · 집 안 꾸미기 · 알·새끼 농장 동물과 반려동물 · 사계절·날씨·해와 달 · 이어하기 저장',
    component: PogeunForestGame,
  },
  {
    id: 'app-ashenhollow',
    players: 1,
    title: 'Ashen Hollow',
    category: '펀펀',
    icon: '🕯️',
    thumb: './assets/playground/thumb-ashenhollow.webp',
    description: '지하 3층까지 내려가 고대의 파수꾼을 쓰러뜨리는 쿼터뷰 액션 RPG · 화염구·치유 물약 · 보스전',
    component: AshenHollowGame,
  },
  {
    id: 'app-baramisland',
    players: 1,
    title: '바람의 섬',
    category: '펀펀',
    icon: '🏝️',
    thumb: './assets/playground/thumb-baramisland.webp',
    description: '네 개의 섬을 모험하는 3D 액션 RPG · 원소 공격 · 미션 · 보스 (컴퓨터 추천)',
    component: BaramIslandGame,
  },
  {
    id: 'app-lightsaber',
    players: 2,
    title: '광선검 결투',
    category: '펀펀',
    icon: '⚔️',
    thumb: './assets/playground/thumb-lightsaber.webp',
    description: '졸라맨 제다이와 시스의 광선검 대결 · 컴퓨터 대결 · 한 컴퓨터 2인 · 👥 2인 대결(각자 컴퓨터)',
    component: LightsaberDuelGame,
  },
  {
    id: 'app-flamesquad',
    players: 1,
    title: '불꽃 특공대',
    category: '펀펀',
    icon: '🔥',
    thumb: './assets/playground/thumb-flamesquad.webp',
    description: '총·수류탄·메카로 싸우며 나아가는 옆으로 가는 액션 슈팅 · 스테이지 5개 · 보스전 (사격 E · 점프 X · 수류탄 C)',
    component: FlameSquadGame,
  },
];

