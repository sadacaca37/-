import React from 'react';
import { IframeGame } from './IframeGame';

/** 마크(블록 크래프트) – GAME/마크 원본 3D 복셀 게임 빌드를 그대로 실행 (월드는 이 컴퓨터에 자동 저장) */
export const BlockCraftGame: React.FC<{ onBack?: () => void; currentUser?: any }> = () => (
  <IframeGame src="games/blockcraft/index.html" title="마크 (블록 크래프트)" icon="⛏️" />
);
