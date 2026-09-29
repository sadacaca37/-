import React from 'react';
import { IframeGame } from './IframeGame';

/** 카트라이더 – GAME/카트라이더 원본(포켓 카트) 그대로 실행 */
export const PocketKartOriginal: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/kartrider/index.html" title="카트라이더" icon="🏎️" />
);
