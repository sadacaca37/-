import React from 'react';
import { IframeGame } from './IframeGame';

/** 포근숲 이야기 – 모아팡 캐릭터로 하는 스타듀밸리풍 2D 농장 게임 (친구와 함께·벌목·몬스터 사냥) (public/games/pogeunforest, 3D 라이브러리·모델은 같은 폴더에 들어 있음) */
export const PogeunForestGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/pogeunforest/index.html" title="포근숲 이야기" icon="🐭" />
);

/** Ashen Hollow – 쿼터뷰 액션 RPG (public/games/ashenhollow) */
export const AshenHollowGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/ashenhollow/index.html" title="Ashen Hollow" icon="🕯️" />
);

/** 바람의 섬 – 3D 액션 RPG, 4개 섬 이야기 (public/games/baramisland, 한 파일에 모두 들어 있음) */
export const BaramIslandGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/baramisland/index.html" title="바람의 섬" icon="🏝️" />
);

/** 광선검 결투 – 졸라맨 제다이 vs 시스, 컴퓨터 대결 · 한 컴퓨터 2인 · 👥 2인 대결 (public/games/lightsaber, 원본은 games-src/lightsaber) */
export const LightsaberDuelGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/lightsaber/index.html" title="광선검 결투" icon="⚔️" />
);

/** 불꽃 특공대 – 옆으로 가는 액션 슈팅 (public/games/flamesquad, 한 파일) */
export const FlameSquadGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/flamesquad/index.html" title="불꽃 특공대" icon="🔥" />
);

/** 뽀글뽀글 – 같은 색 방울 3개를 붙여 터뜨리는 방울 퍼즐 · 혼자 10판 · 컴퓨터 대결 · 한 키보드 둘이서 대결 (public/games/ppogeul, 한 파일, 그림은 코드로 그린 도트) */
export const PpogeulGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/ppogeul/index.html" title="뽀글뽀글" icon="🫧" />
);

/** 골목대장 대결: 1:1 격투 (캐릭터 8명·무대 6곳) — 11/25 모아팡에 먼저 올린 것을 원본에 옮김 */
export const GolmokGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/golmok/index.html" title="골목대장 대결" icon="🥊" />
);
