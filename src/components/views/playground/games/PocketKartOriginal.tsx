import React from 'react';
import { IframeGame } from './IframeGame';

/** 타자팡 카트 레이싱 – 포켓 카트 원본 그대로 실행 */
export const PocketKartOriginal: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/kartrider/index.html" title="타자팡 카트 레이싱" icon="🏎️" />
);
