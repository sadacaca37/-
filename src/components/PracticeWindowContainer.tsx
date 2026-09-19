import React from 'react';
import { X } from 'lucide-react';
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
  title,
  icon,
  onClose,
  children,
}) => {
  const handleClose = () => {
    soundManager.play('click');
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    }
    onClose();
  };

  return (
    <div className="w-full h-screen min-h-screen max-h-screen bg-slate-950 p-0 m-0 overflow-hidden flex flex-col">
      {/* Dedicated Practice Window Shell */}
      <div className="w-full h-full max-h-screen mx-auto bg-slate-900 border-none rounded-none overflow-hidden flex flex-col">
        {/* Window Title Bar (Compact, no extra controls) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 border-b-2 border-sky-500/30 flex items-center justify-between gap-2 select-none shrink-0">
          {/* Left: Close dot & Mode Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:bg-rose-600 border border-rose-600 flex items-center justify-center text-[8px] text-white opacity-90 hover:opacity-100 cursor-pointer shadow-xs transition-opacity"
              title="연습 창 닫기"
            >
              ✕
            </button>

            {/* Window Icon & Title */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-base sm:text-xl">{icon}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xs sm:text-sm font-black text-white font-arcade tracking-tight">
                  {title}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[9px] sm:text-[10px] font-black">
                  80% 고정 배율
                </span>
              </div>
            </div>
          </div>

          {/* Right Window Controls: Close button only */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-black transition-all cursor-pointer active:scale-95"
              title="창 닫기"
            >
              <X className="w-3.5 h-3.5" />
              <span>닫기</span>
            </button>
          </div>
        </div>

        {/* Practice Window Content Canvas - 80% scale with no scroll and no bottom margin */}
        <div className="flex-1 w-full bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden flex flex-col items-center justify-start p-0 m-0">
          <div
            style={{
              zoom: 0.8,
            }}
            className="w-full max-w-7xl mx-auto flex flex-col items-center justify-start px-2 pt-0 pb-0 m-0"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
