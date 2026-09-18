import React, { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  Sparkles, 
  Keyboard, 
  CheckCircle2, 
  RotateCcw,
  Monitor
} from 'lucide-react';
import { soundManager } from '../utils/sound';

interface PracticeWindowContainerProps {
  mode: 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice';
  title: string;
  stepNumber: string;
  icon: string;
  onClose: () => void;
  showKeyboardSimultaneousBadge?: boolean;
  children: React.ReactNode;
}

export const PracticeWindowContainer: React.FC<PracticeWindowContainerProps> = ({
  mode,
  title,
  stepNumber,
  icon,
  onClose,
  showKeyboardSimultaneousBadge = false,
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isStandalonePopup, setIsStandalonePopup] = useState(false);
  const [popupFeedback, setPopupFeedback] = useState<string | null>(null);
  const [viewScale, setViewScale] = useState<'compact' | 'tiny' | 'normal'>('compact');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('popup') === 'true') {
      setIsStandalonePopup(true);
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    soundManager.play('click');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleOpenBrowserWindow = () => {
    soundManager.play('click');
    const targetUrl = `${window.location.origin}${window.location.pathname}?mode=${mode}&popup=true`;
    const popup = window.open(
      targetUrl,
      `typang_practice_${mode}`,
      'width=1280,height=920,left=100,top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );

    if (popup) {
      setPopupFeedback('🚀 새로운 브라우저 창으로 타자 연습 창을 띄웠습니다!');
      setTimeout(() => setPopupFeedback(null), 4000);
    } else {
      setPopupFeedback('⚠️ 브라우저 팝업이 차단되었습니다. 현재 화면에서 계속 연습하실 수 있습니다.');
      setTimeout(() => setPopupFeedback(null), 5000);
    }
  };

  const handleClose = () => {
    soundManager.play('click');
    if (isStandalonePopup) {
      window.close();
    }
    onClose();
  };

  return (
    <div className={`w-full ${isStandalonePopup ? 'min-h-screen bg-slate-900 p-0 sm:p-1.5' : 'p-0 sm:p-1'}`}>
      {/* Dedicated Practice Window Shell */}
      <div className="w-full max-w-7xl mx-auto rounded-xl sm:rounded-2xl bg-slate-900/95 backdrop-blur-xl border-2 sm:border-3 border-sky-400/60 shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        {/* Window Title Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 border-b-2 border-sky-500/30 flex flex-wrap items-center justify-between gap-2 select-none shrink-0">
          {/* Left: Window dots & Mode Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* macOS Arcade Style Dots */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClose}
                className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 border border-rose-600 flex items-center justify-center text-[8px] text-white opacity-90 hover:opacity-100 cursor-pointer shadow-xs transition-opacity"
                title="연습 창 닫기 (홈으로)"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={handleOpenBrowserWindow}
                className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-500 border border-amber-500 flex items-center justify-center text-[8px] text-amber-950 opacity-90 hover:opacity-100 cursor-pointer shadow-xs transition-opacity"
                title="새 브라우저 창으로 분리하기"
              >
                +
              </button>
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 flex items-center justify-center text-[8px] text-white opacity-90 hover:opacity-100 cursor-pointer shadow-xs transition-opacity"
                title="전체화면"
              >
                ⛶
              </button>
            </div>

            {/* Window Icon & Title */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-2xl">{icon}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white font-arcade tracking-tight">
                  {title}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[9px] sm:text-[10px] font-black">
                  새 창 모드
                </span>
              </div>
            </div>
          </div>

          {/* Middle: Screen Fit Size Control (한눈에 보기 축소 옵션) */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-xl border border-sky-500/30 text-[10px] sm:text-[11px] font-bold">
            <span className="text-sky-300/80 px-1.5 hidden md:inline font-mono">화면 크기:</span>
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setViewScale('compact');
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                viewScale === 'compact'
                  ? 'bg-sky-500 text-white font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="한눈에 화면 전체가 다 들어오도록 컴팩트하게 맞춥니다 (기본)"
            >
              한눈에 쏙 (85%)
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setViewScale('tiny');
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                viewScale === 'tiny'
                  ? 'bg-sky-500 text-white font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="작은 노트북 창을 위해 더 작게 축소합니다"
            >
              초소형 (75%)
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setViewScale('normal');
              }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                viewScale === 'normal'
                  ? 'bg-sky-500 text-white font-black shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="100% 원본 크기"
            >
              100%
            </button>
          </div>

          {/* Right Window Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isStandalonePopup && (
              <button
                type="button"
                onClick={handleOpenBrowserWindow}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 text-xs font-black border border-sky-500/30 shadow-xs transition-all cursor-pointer active:scale-95"
                title="독립된 별도의 브라우저 새 창(팝업)으로 띄워 연습합니다"
              >
                <ExternalLink className="w-3 h-3" />
                <span>새 창 팝업</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1 sm:p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title={isFullscreen ? "전체화면 종료" : "전체화면으로 보기"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-black transition-all cursor-pointer active:scale-95"
              title="연습을 마치고 홈으로 돌아가기"
            >
              <X className="w-3.5 h-3.5" />
              <span>닫기</span>
            </button>
          </div>
        </div>

        {/* Feedback alert if popup opened or blocked */}
        {popupFeedback && (
          <div className="bg-sky-950/90 border-b border-sky-500/40 px-3 py-1.5 text-xs font-black text-sky-200 flex items-center justify-between animate-in slide-in-from-top-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              {popupFeedback}
            </span>
            <button
              type="button"
              onClick={() => setPopupFeedback(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              닫기
            </button>
          </div>
        )}

        {/* Practice Window Content Canvas */}
        <div className="p-1 sm:p-2 bg-gradient-to-b from-slate-900/60 to-slate-950/80 overflow-y-auto">
          <div
            style={{
              transform: viewScale === 'compact' ? 'scale(0.85)' : viewScale === 'tiny' ? 'scale(0.75)' : 'scale(1)',
              transformOrigin: 'top center',
              marginBottom: viewScale === 'compact' ? '-12%' : viewScale === 'tiny' ? '-22%' : '0',
            }}
            className="transition-transform duration-150"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
