import React from 'react';
import { IframeGame } from './IframeGame';

/** 카트라이더 – 사용자 원본 '포켓카트_실행.html' 그대로 실행 */
export const PocketKartOriginal: React.FC<{ onBack?: () => void }> = () => (
  <IframeGame src="/games/pocketkart/index.html" title="카트라이더 (포켓 카트)" icon="🏎️" />
);
