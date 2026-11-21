import React from 'react';
import { IframeGame } from './IframeGame';

export const LastWarGameWrapper: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="games/lastwar/index.html" title="다리 돌파 작전" icon="⚔️" />
);
