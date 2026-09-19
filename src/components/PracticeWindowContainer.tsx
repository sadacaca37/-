import React, { useState, useEffect } from 'react';
import { X, Sparkles, Heart, Volume2, ExternalLink, Minimize2 } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface PracticeWindowContainerProps {
  mode: 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice' | 'mini-games' | 'playground' | string;
  title: string;
  stepNumber?: string;
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
  showKeyboardSimultaneousBadge,
  children,
}) => {
  const handleClose = () => {
    soundManager.play('click');
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    }
    onClose();
  };

  const handleOpenNewWindow = () => {
    soundManager.play('click');
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?mode=${mode}&popup=true`;
      const pop = window.open(
        url,
        `typang_${mode}`,
        'width=1240,height=860,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
      );
      if (pop) {
        onClose();
      }
    }
  };

  // Keyboard shortcut: ESC to close popup window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isCrtProCabinet = mode === 'key-practice' || mode === 'word-practice';

  if (isCrtProCabinet) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-1 sm:p-2 md:p-3 overflow-y-auto flex items-center justify-center select-none"
        role="dialog"
        aria-modal="true"
      >
        {/* Background Retro Arcade Grid Atmosphere */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #3B426B 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />

        {/* Quick Exit Floating Button */}
        <button
          type="button"
          onClick={handleClose}
          className="fixed top-2 right-2 sm:top-3 sm:right-3 z-50 px-2.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white border-2 border-black/80 shadow-[0_4px_10px_rgba(0,0,0,0.7)] cursor-pointer transition-transform active:scale-95 flex items-center gap-1 text-xs font-pixel font-black"
          title="닫기 (ESC)"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">나가기</span>
        </button>

        <div className="w-full max-w-[1080px] my-auto relative z-10 flex flex-col items-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-1 sm:p-3 md:p-4 overflow-y-auto flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* Background Retro Arcade Grid Atmosphere */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #3B426B 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* ========================================================================= */}
      {/* RETRO CRT ARCADE MONITOR CASING (16비트 오락실 캐비닛 팝업 창) */}
      {/* ========================================================================= */}
      <div className="w-full max-w-[1140px] max-h-[96vh] bg-[#C5BFB8] rounded-[24px] sm:rounded-[32px] p-2 sm:p-3 flex flex-col border-4 sm:border-[6px] border-t-[#ECE6DE] border-l-[#ECE6DE] border-r-[#888179] border-b-[#888179] shadow-[0_24px_50px_rgba(0,0,0,0.9),inset_2px_2px_0_#FFF,inset_-3px_-3px_0_#6E6860] relative z-10 my-auto">
        
        {/* Top Monitor Ventilation Slits & Brand Stamping */}
        <div className="flex items-center justify-between px-3 pb-1.5 shrink-0">
          {/* Left top ventilation slots */}
          <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-4 h-1 bg-[#7E776F] rounded-full shadow-inner" />
            <div className="w-4 h-1 bg-[#7E776F] rounded-full shadow-inner" />
            <div className="w-4 h-1 bg-[#7E776F] rounded-full shadow-inner" />
          </div>

          {/* Center Brand Title */}
          <div className="flex items-center gap-1.5 font-pixel text-[10px] sm:text-[11px] font-black tracking-widest text-[#5C564F] drop-shadow-xs">
            <span>★ TYPANG CRT-PRO 1994 ★</span>
          </div>

          {/* Right top ventilation slots */}
          <div className="flex items-center gap-1.5 opacity-60">
            <div className="w-4 h-1 bg-[#7E776F] rounded-full shadow-inner" />
            <div className="w-4 h-1 bg-[#7E776F] rounded-full shadow-inner" />
            <div className="w-4 h-1 bg-[#7E776F] rounded-full shadow-inner" />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RECESSED DARK CRT DISPLAY BEZEL FRAME */}
        {/* ========================================================================= */}
        <div className="flex-1 w-full bg-[#1A1C26] rounded-xl sm:rounded-[20px] p-1.5 sm:p-2 border-3 sm:border-4 border-[#0E0F17] shadow-[inset_0_6px_20px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative">
          
          {/* CRT Screen Curved Glass Glow & Scanlines Layer */}
          <div className="crt-scanline-overlay pointer-events-none" />

          {/* ----------------------------------------------------------------------- */}
          {/* 1. TOP WOODEN SIGNBOARD STATUS HUD (나무 간판 헤더) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="wood-signboard px-3 py-1.5 sm:px-4 sm:py-2 border-b-3 border-[#3E2419] flex items-center justify-between gap-2 shrink-0 relative z-30 shadow-[0_3px_0_#20130D] rounded-t-xl mb-1">
            {/* Metal Corner Rivets */}
            <span className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
            <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />

            {/* Left: Window Icon & Title */}
            <div className="flex items-center gap-2 pl-2">
              <span className="text-lg sm:text-xl filter drop-shadow-[0_2px_0_#000]">{icon}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs sm:text-sm font-black text-[#FFD700] font-pixel pixel-text-shadow tracking-wider">
                  {title}
                </span>
                {stepNumber && (
                  <span className="px-1.5 py-0.2 rounded-xs bg-[#0F1026] text-[#00D2FF] border border-[#00D2FF]/50 text-[9px] font-pixel font-bold hidden sm:inline">
                    STEP {stepNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Center: Arcade Hearts & Status */}
            <div className="hidden md:flex items-center gap-2 bg-[#1B110C]/80 px-3 py-0.5 rounded-lg border border-[#8C6219]/60 shadow-inner">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-red-500 animate-pulse">❤️</span>
                <span className="text-red-500 animate-pulse">❤️</span>
                <span className="text-red-500">❤️</span>
              </div>
              <span className="text-[10px] font-pixel text-[#E5B55A] font-bold">
                16-BIT PRO ARCADE
              </span>
            </div>

            {/* Right: New Window Pop-out & Close Button */}
            <div className="flex items-center gap-2 pr-1">
              <button
                type="button"
                onClick={handleOpenNewWindow}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#38BDF8] border-2 border-[#38BDF8]/60 text-[11px] font-pixel shadow-[1px_1px_0_#000] active:translate-y-0.5 transition-all cursor-pointer"
                title="별도의 새 브라우저 창(팝업)으로 분리하여 열기"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>새 창으로 열기</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FF4757] hover:bg-[#E11D48] text-white border-2 border-black text-[11px] font-pixel shadow-[2px_2px_0_#000] active:translate-y-0.5 transition-all cursor-pointer"
                title="창 닫기 (ESC)"
              >
                <X className="w-3.5 h-3.5" />
                <span>닫기 (ESC)</span>
              </button>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* 2. INNER SCREEN CONTENT AREA (100% 스크롤 없이 밀착) */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex-1 w-full overflow-hidden flex flex-col relative bg-[#12131E] rounded-b-xl">
            <div className="flex-1 w-full h-full overflow-hidden flex flex-col justify-between">
              {children}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LOWER BEZEL HARDWARE CONTROLS (냉각 슬릿, 파워 LED, 스피커 그릴) */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-3 pt-1.5 shrink-0 select-none">
          {/* Left: Cooling Ventilation Slats */}
          <div className="flex items-center gap-1 bg-[#14151D]/25 px-2.5 py-0.5 rounded-md border border-[#888179]/40 shadow-inner">
            <div className="w-1 h-3 bg-[#524C45] rounded-xs shadow-inner" />
            <div className="w-1 h-3 bg-[#524C45] rounded-xs shadow-inner" />
            <div className="w-1 h-3 bg-[#524C45] rounded-xs shadow-inner" />
            <div className="w-1 h-3 bg-[#524C45] rounded-xs shadow-inner" />
          </div>

          {/* Center: Sound Holes */}
          <div className="hidden sm:flex items-center gap-1.5 opacity-50">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A453F]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A453F]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A453F]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#4A453F]" />
          </div>

          {/* Right: Power Switch & Status Green LED */}
          <div className="flex items-center gap-3 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-black text-[#5C564F]">POWER</span>
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
