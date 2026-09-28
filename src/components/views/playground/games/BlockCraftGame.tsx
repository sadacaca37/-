import React, { useState } from 'react';
import { IframeGame } from './IframeGame';

/** 마크(블록 크래프트) – GAME/마크 원본 3D 복셀 게임 빌드를 그대로 실행 (월드는 이 컴퓨터에 자동 저장) */
export const BlockCraftGame: React.FC<{ onBack?: () => void; currentUser?: any }> = () => {
  // 친구 초대 링크로 들어왔으면 그 방 코드로 바로 참가
  const [src] = useState(() => {
    let code = '';
    try {
      code = sessionStorage.getItem('typang_mark_invite') || '';
      sessionStorage.removeItem('typang_mark_invite');
    } catch {}
    return code ? `games/blockcraft/index.html?room=${encodeURIComponent(code)}` : 'games/blockcraft/index.html';
  });
  return <IframeGame src={src} title="마크 (블록 크래프트)" icon="⛏️" />;
};
