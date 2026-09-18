import React, { useState } from 'react';
import { Maximize2, ExternalLink, RefreshCw, Volume2, Shield } from 'lucide-react';

interface LastWarGameWrapperProps {
  onBack?: () => void;
}

export const LastWarGameWrapper: React.FC<LastWarGameWrapperProps> = () => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const gameUrl = '/games/lastwar/index.html';

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleOpenNewTab = () => {
    window.open(gameUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full min-h-[600px] flex flex-col rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-500/40 shadow-2xl">
      {/* Top Game Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-neutral-900 to-slate-900 px-4 py-2 flex items-center justify-between border-b border-amber-500/30 select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <div>
            <h2 className="text-sm font-black text-amber-300 font-arcade flex items-center gap-1.5">
              <span>라스트워: 브릿지 어썰트 3D</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                로컬 단독 실행 (정상 작동)
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              3D 돌파 액션 & 부대 증식 전략 게임 (깃허브 정식 수록)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="게임 다시 시작"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-black transition-all cursor-pointer"
            title="새 브라우저 창에서 최대 크기로 플레이"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새 탭에서 열기</span>
          </button>
        </div>
      </div>

      {/* Main Game iFrame Container */}
      <div className="relative flex-1 w-full bg-black">
        <iframe
          key={iframeKey}
          src={gameUrl}
          title="라스트워 게임"
          className="w-full h-full min-h-[580px] border-0"
          allow="autoplay; fullscreen; gamepad"
        />
      </div>
    </div>
  );
};
