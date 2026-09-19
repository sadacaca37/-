import React, { useState } from 'react';
import { soundManager } from '../utils/sound';

interface RetroTapongMascotProps {
  speech?: string;
  size?: 'sm' | 'md' | 'lg';
  showSpeech?: boolean;
  onClick?: () => void;
}

const TAPONG_QUOTES = [
  '삐빅! 16비트 타자 모험에 오신 걸 환영합니다! ⚡',
  '홈포지션 F, J키에 검지 손가락을 얹어보세요! 🐾',
  '차근차근 정확하게 치면 타수가 쑥쑥 올라가요! 🚀',
  '오늘도 [ PRESS START ] 눌러서 최고 기록 경신해봐요! 🏆',
  '삐리릭! 오타가 적을수록 보너스 코인이 쏟아집니다! 🪙',
  '피곤할 땐 [놀이터]에서 고전 오락실 게임 한 판! 🎮',
];

export const RetroTapongMascot: React.FC<RetroTapongMascotProps> = ({
  speech,
  size = 'md',
  showSpeech = true,
  onClick,
}) => {
  const [quoteIdx, setQuoteIdx] = useState(0);

  const currentSpeech = speech || TAPONG_QUOTES[quoteIdx];

  const handleClick = () => {
    soundManager.play('click');
    setQuoteIdx((prev) => (prev + 1) % TAPONG_QUOTES.length);
    if (onClick) onClick();
  };

  const scaleClasses = {
    sm: 'w-12 h-14',
    md: 'w-20 h-22',
    lg: 'w-28 h-32',
  }[size];

  return (
    <div className="inline-flex items-center gap-3 select-none">
      {/* Robot Tapong Mascot Graphic (Pure 16-bit Pixel Style) */}
      <div
        onClick={handleClick}
        className={`${scaleClasses} relative cursor-pointer group flex-shrink-0 transition-transform active:scale-95`}
        title="레트로 가이드 로봇 타퐁 (클릭하면 꿀팁을 알려줘요!)"
      >
        {/* Antenna */}
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF4757] border-2 border-black animate-pulse shadow-[0_0_8px_#FF4757]" />
          <div className="w-1 h-2 bg-slate-800 border-x border-black" />
        </div>

        {/* CRT Monitor Head */}
        <div className="w-full h-full bg-[#38B6FF] border-4 border-black rounded-xl p-1.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.4),4px_4px_0_#000] flex flex-col justify-between relative overflow-hidden group-hover:-translate-y-1 transition-transform">
          {/* Top Screws */}
          <div className="flex justify-between px-0.5">
            <span className="w-1.5 h-1.5 bg-[#FFD700] border border-black rounded-xs inline-block" />
            <span className="w-1.5 h-1.5 bg-[#FFD700] border border-black rounded-xs inline-block" />
          </div>

          {/* CRT Screen Display */}
          <div className="flex-1 bg-[#0F1026] border-2 border-black rounded-lg my-1 p-1 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Screen Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,210,255,0.05)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none" />

            {/* Glowing Pixel Eyes */}
            <div className="flex items-center gap-2 z-10">
              <div className="w-2 h-2.5 bg-[#00D2FF] border border-cyan-200 shadow-[0_0_6px_#00D2FF] group-hover:scale-y-20 transition-all" />
              <div className="w-2 h-2.5 bg-[#00D2FF] border border-cyan-200 shadow-[0_0_6px_#00D2FF] group-hover:scale-y-20 transition-all" />
            </div>

            {/* Pixel Smile */}
            <div className="w-3.5 h-1 bg-[#FFD700] rounded-xs mt-1 border-t border-amber-300 z-10" />
          </div>

          {/* Speaker Vent & Logo */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[8px] font-pixel text-[#0F1026] font-black">TAPONG</span>
            <div className="flex gap-0.5">
              <span className="w-1 h-1 bg-black rounded-full" />
              <span className="w-1 h-1 bg-black rounded-full" />
              <span className="w-1 h-1 bg-black rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 16-bit Pixel Speech Bubble */}
      {showSpeech && (
        <div className="relative bg-[#FFFFFF] border-3 border-black p-2.5 sm:p-3 rounded-xl shadow-[4px_4px_0_#000] max-w-xs sm:max-w-sm text-left">
          {/* Bubble Pointer Arrow */}
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[9px] border-r-black" />
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[7px] border-r-white z-10" />

          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-pixel text-[#00D2FF] bg-[#0F1026] px-1.5 py-0.5 rounded-xs border border-black">
              🤖 안내로봇 타퐁
            </span>
            <span className="text-[10px] text-slate-400 font-pixel">LV.99</span>
          </div>

          <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug font-arcade">
            {currentSpeech}
          </p>
        </div>
      )}
    </div>
  );
};
