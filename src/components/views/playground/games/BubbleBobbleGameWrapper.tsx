import React from 'react';
import { IframeGame } from './IframeGame';

/** GitHub(sadacaca37/game) 원본을 그대로 빌드해 실행 */
export const BubbleBobbleGameWrapper: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/bubblebobble/index.html" title="방울 용 대작전" icon="🫧" />
);
