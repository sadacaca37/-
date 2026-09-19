import React from 'react';
import { IframeGame } from './IframeGame';

export const LastWarGameWrapper: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="/games/lastwar/index.html" title="라스트워: 브릿지 어썰트 3D" icon="⚔️" />
);
