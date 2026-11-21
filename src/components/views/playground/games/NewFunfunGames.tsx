import React from 'react';
import { IframeGame } from './IframeGame';

/** 포근숲 이야기 – 힐링 오픈월드 RPG (public/games/pogeunforest, 3D 라이브러리는 같은 폴더에 들어 있음) */
export const PogeunForestGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/pogeunforest/index.html" title="포근숲 이야기" icon="🌳" />
);

/** Ashen Hollow – 쿼터뷰 액션 RPG (public/games/ashenhollow) */
export const AshenHollowGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/ashenhollow/index.html" title="Ashen Hollow" icon="🕯️" />
);

/** 바람의 섬 – 3D 액션 RPG, 4개 섬 이야기 (public/games/baramisland, 한 파일에 모두 들어 있음) */
export const BaramIslandGame: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/baramisland/index.html" title="바람의 섬" icon="🏝️" />
);
