import React from 'react';
import { IframeGame } from './IframeGame';

/** GitHub(sadacaca37/game) 원본을 그대로 빌드해 실행 */
export const BubbleBobbleGameWrapper: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="/games/bubblebobble/index.html" title="보글보글 (Bubble Bobble)" icon="🫧" />
);
