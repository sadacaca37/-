import React from 'react';
import { IframeGame } from './IframeGame';

/** GitHub(sadacaca37/game) 원본을 그대로 빌드해 실행 */
export const PonpokoGameWrapper: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/ponpoko/index.html" title="너구리 (Ponpoko 1982)" icon="🦝" />
);
