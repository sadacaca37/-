import React from 'react';
import { IframeGame } from './IframeGame';

/** GitHub(sadacaca37/game) 원본을 그대로 빌드해 실행 */
export const SuperMarioGameWrapper: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/supermario/index.html" title="슈퍼마리오 (Web Bros)" icon="🍄" />
);
