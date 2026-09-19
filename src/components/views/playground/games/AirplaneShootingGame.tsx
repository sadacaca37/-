import React, { useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface AirplaneShootingGameProps {
  onBack?: () => void;
  currentUser?: any;
}

export const AirplaneShootingGame: React.FC<AirplaneShootingGameProps> = () => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const gameUrl = '/games/airplane1945/index.html';

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenNewTab = () => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden bg-[#070A12] border-3 border-[#784E3D] shadow-2xl">
      {/* 16-Bit Arcade Top Bar */}
      <div className="bg-[#101524] px-4 py-2 flex items-center justify-between border-b-2 border-[#784E3D] select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">✈️</span>
          <div>
            <h2 className="text-sm font-black text-[#00D2FF] font-arcade flex items-center gap-1.5 tracking-wider">
              <span>1945 에어 컴뱃 (비행기 슈팅)</span>
              <span className="px-2 py-0.5 rounded-md bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/40 text-[10px] font-bold">
                GitHub Engine
              </span>
            </h2>
            <p className="text-[11px] text-[#ADC8E0]">
              방향키/마우스(이동) · 자동발사 · SPACE/X(전탄 폭격) · P(화력 강화)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-[#1E2538] hover:bg-[#2A334E] text-[#00D2FF] border border-[#784E3D] transition-colors cursor-pointer"
            title="게임 다시 시작"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00D2FF] hover:bg-[#38B6FF] text-stone-900 border border-[#784E3D] text-xs font-black transition-all cursor-pointer shadow-sm"
            title="새 창에서 단독 전체화면으로 실행"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새 창에서 열기</span>
          </button>
        </div>
      </div>

      {/* Main Game iFrame */}
      <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center">
        <iframe
          key={iframeKey}
          src={gameUrl}
          title="1945 에어 컴뱃"
          className="w-full h-full border-0 block"
          allow="autoplay; fullscreen"
        />
      </div>
    </div>
  );
};

export default AirplaneShootingGame;
