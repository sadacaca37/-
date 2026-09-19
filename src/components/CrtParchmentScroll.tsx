import React from 'react';

interface CrtParchmentScrollProps {
  text: string;
  subText?: string;
  isLarge?: boolean;
  theme?: 'gold' | 'blue';
  onClick?: () => void;
  renderCustomContent?: React.ReactNode;
}

export const CrtParchmentScroll: React.FC<CrtParchmentScrollProps> = ({
  text,
  subText,
  isLarge = true,
  theme = 'gold',
  onClick,
  renderCustomContent,
}) => {
  const isGold = theme === 'gold';

  if (isLarge) {
    return (
      <div 
        onClick={onClick}
        className="relative inline-flex items-center justify-center cursor-pointer select-none group"
      >
        {/* Left Scroll Roll End (Curly rolled parchment) */}
        <div className={`w-5 sm:w-7 h-24 sm:h-28 rounded-l-md border-3 border-black shadow-[2px_2px_0_#000] flex flex-col justify-between p-0.5 z-20 ${
          isGold 
            ? 'bg-gradient-to-r from-[#C2914F] via-[#DFB87A] to-[#E9CB95]' 
            : 'bg-gradient-to-r from-[#2B779E] via-[#48A5D6] to-[#71C7F2]'
        }`}>
          <div className="w-full h-3 rounded-t-sm bg-black/20" />
          <div className="w-full h-3 rounded-b-sm bg-black/20" />
        </div>

        {/* Scroll Upper Roll Knob */}
        <div className={`absolute -top-2 left-3 sm:left-4 w-4 sm:w-5 h-3.5 rounded-t-sm border-2 border-black z-10 ${
          isGold ? 'bg-[#9A6F32]' : 'bg-[#1E5C7D]'
        }`} />
        <div className={`absolute -bottom-2 left-3 sm:left-4 w-4 sm:w-5 h-3.5 rounded-b-sm border-2 border-black z-10 ${
          isGold ? 'bg-[#9A6F32]' : 'bg-[#1E5C7D]'
        }`} />

        {/* Main Parchment Body */}
        <div className={`min-w-[200px] sm:min-w-[280px] max-w-md h-20 sm:h-24 px-4 sm:px-8 py-2 border-y-3 border-black shadow-[3px_3px_0_#000] flex flex-col items-center justify-center relative z-10 ${
          isGold 
            ? 'bg-gradient-to-b from-[#FFF4CC] via-[#FDEAB2] to-[#F7D88D]' 
            : 'bg-gradient-to-b from-[#E0F2FE] via-[#BAE6FD] to-[#7DD3FC]'
        }`}>
          {/* Faint ancient scroll texture line */}
          <div className="absolute top-1 left-3 right-3 h-0.5 bg-black/10" />
          <div className="absolute bottom-1 left-3 right-3 h-0.5 bg-black/10" />

          {/* Main Target Content */}
          {renderCustomContent ? (
            renderCustomContent
          ) : (
            <div className="text-3xl sm:text-4xl md:text-5xl font-black tracking-widest text-[#24150E] font-arcade [text-shadow:_0_0_12px_rgba(255,215,0,0.8),_2px_2px_0_#FFF]">
              {text}
            </div>
          )}

          {subText && (
            <div className="text-xs sm:text-sm font-bold text-slate-700 font-mono mt-0.5">
              {subText}
            </div>
          )}
        </div>

        {/* Right Scroll Roll End */}
        <div className={`w-5 sm:w-7 h-24 sm:h-28 rounded-r-md border-3 border-black shadow-[2px_2px_0_#000] flex flex-col justify-between p-0.5 z-20 ${
          isGold 
            ? 'bg-gradient-to-l from-[#C2914F] via-[#DFB87A] to-[#E9CB95]' 
            : 'bg-gradient-to-l from-[#2B779E] via-[#48A5D6] to-[#71C7F2]'
        }`}>
          <div className="w-full h-3 rounded-t-sm bg-black/20" />
          <div className="w-full h-3 rounded-b-sm bg-black/20" />
        </div>

        {/* Scroll Upper Roll Knob */}
        <div className={`absolute -top-2 right-3 sm:right-4 w-4 sm:w-5 h-3.5 rounded-t-sm border-2 border-black z-10 ${
          isGold ? 'bg-[#9A6F32]' : 'bg-[#1E5C7D]'
        }`} />
        <div className={`absolute -bottom-2 right-3 sm:right-4 w-4 sm:w-5 h-3.5 rounded-b-sm border-2 border-black z-10 ${
          isGold ? 'bg-[#9A6F32]' : 'bg-[#1E5C7D]'
        }`} />
      </div>
    );
  }

  // Smaller Preview Scroll (Next Word)
  return (
    <div className="relative inline-flex items-center justify-center select-none opacity-90 hover:opacity-100 transition-opacity">
      {/* Scroll Rod Ends */}
      <div className="w-3 h-16 rounded-l-xs bg-[#2B779E] border-2 border-black z-20" />
      <div className="w-20 sm:w-24 h-14 bg-gradient-to-b from-[#BAE6FD] to-[#38BDF8] border-y-2 border-black shadow-[2px_2px_0_#000] flex flex-col items-center justify-center px-1 z-10">
        <span className="text-[9px] font-pixel text-[#0369A1] font-black -mt-1">다음</span>
        <span className="text-base sm:text-lg font-black text-[#0F172A] font-arcade tracking-tight truncate max-w-[70px]">
          {text || '완주!'}
        </span>
      </div>
      <div className="w-3 h-16 rounded-r-xs bg-[#2B779E] border-2 border-black z-20" />
    </div>
  );
};
