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

/** 모아팡 미니 게임 – 모아팡 홈페이지의 미니 게임 화면(../games.html)을 그대로 띄움 (모아팡 파일은 고치지 않음) */
export const MoaMiniGames: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="../games.html" title="모아팡 미니 게임" icon="🎲" />
);
