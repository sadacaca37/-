import React from 'react';
import { IframeGame } from './IframeGame';

/** 비행기 슈팅 – 깃허브 원본 'airplane-game-v1' (Retro 1945 Air Combat) 빌드를 그대로 실행 */
export const AirplaneShootingGame: React.FC<{ onBack?: () => void; currentUser?: any }> = () => (
  <IframeGame src="games/airplane/index.html" title="비행기 슈팅 (1945 Air Combat)" icon="✈️" />
);
