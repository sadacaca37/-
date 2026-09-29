import React from 'react';
import { IframeGame } from './IframeGame';

/** 과자 왕국 런 – 깃허브 game 저장소 GAME/쿠키런 원본 그대로 실행 */
export const CookieKingdomRun: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/cookierun/index.html" title="과자 왕국 런" icon="🍪" />
);
