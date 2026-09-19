import React from 'react';
import { AppMode, UserSession } from '../types';
import { soundManager } from '../utils/sound';
import { Sparkles } from 'lucide-react';
import { pointsManager } from '../utils/pointsManager';

interface RetroRpgQuestMapProps {
  onSelectStage: (mode: AppMode) => void;
  currentUser?: UserSession | null;
}

export const RetroRpgQuestMap: React.FC<RetroRpgQuestMapProps> = ({ onSelectStage, currentUser }) => {
  const points = pointsManager.getBalance();

  const handleStageClick = (mode: AppMode) => {
    soundManager.play('achievement');
    onSelectStage(mode);
  };

  return (
    <div className="w-full relative select-none">
      {/* =========================================================================
          OUTER HEAVY WOOD ARCADE BOARD FRAME (황금빛 나무 테두리 + 금색 모서리 브래킷)
         ========================================================================= */}
      <div className="p-3 sm:p-5 rounded-3xl bg-[#6B401F] border-[6px] border-[#42220E] shadow-[0_12px_0_#2A1408,0_18px_32px_rgba(0,0,0,0.65)] relative overflow-hidden">
        {/* Brass corner brackets with rivets */}
        <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-[#FFD700] rounded-tl-md pointer-events-none z-30" />
        <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-[#FFD700] rounded-tr-md pointer-events-none z-30" />
        <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-[#FFD700] rounded-bl-md pointer-events-none z-30" />
        <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-[#FFD700] rounded-br-md pointer-events-none z-30" />

        {/* 4 Corner Screws */}
        <span className="absolute top-3.5 left-3.5 w-3.5 h-3.5 rounded-full bg-[#FFD700] border-2 border-[#8C6219] shadow-[inset_0_1px_1px_#FFF] z-30" />
        <span className="absolute top-3.5 right-3.5 w-3.5 h-3.5 rounded-full bg-[#FFD700] border-2 border-[#8C6219] shadow-[inset_0_1px_1px_#FFF] z-30" />
        <span className="absolute bottom-3.5 left-3.5 w-3.5 h-3.5 rounded-full bg-[#FFD700] border-2 border-[#8C6219] shadow-[inset_0_1px_1px_#FFF] z-30" />
        <span className="absolute bottom-3.5 right-3.5 w-3.5 h-3.5 rounded-full bg-[#FFD700] border-2 border-[#8C6219] shadow-[inset_0_1px_1px_#FFF] z-30" />

        {/* =========================================================================
            1. TOP WOODEN SIGNBOARD: "타자팡팡 퀘스트 맵!" (목업 이미지 상단 나무 간판)
           ========================================================================= */}
        <div className="flex justify-center mb-3 relative z-20">
          <div className="relative px-6 sm:px-12 py-2 sm:py-2.5 rounded-xl bg-gradient-to-b from-[#A05A2C] via-[#85451F] to-[#5A2C11] border-4 border-[#3A1A0A] shadow-[0_4px_0_#261005,0_6px_14px_rgba(0,0,0,0.5)]">
            {/* Brass corner tabs */}
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-[#FFD700] border border-[#8C6219] rounded-xs" />
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FFD700] border border-[#8C6219] rounded-xs" />
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-[#FFD700] border border-[#8C6219] rounded-xs" />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#FFD700] border border-[#8C6219] rounded-xs" />

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#FFBE1A] tracking-wider font-pixel text-center [text-shadow:_2px_2px_0_#000,_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_2px_2px_4px_rgba(0,0,0,0.6)]">
              타자팡팡 퀘스트 맵!
            </h2>
          </div>
        </div>

        {/* =========================================================================
            2. VIBRANT 16-BIT RPG MEADOW CANVAS (목업 이미지의 산뜻한 초원 & 흙길)
           ========================================================================= */}
        <div className="relative w-full rounded-2xl bg-[#4CD805] border-4 border-[#2E8B03] shadow-inner overflow-hidden min-h-[500px] sm:min-h-[560px] lg:min-h-[600px]">
          
          {/* 16-bit Grass Checkerboard subtle pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(#206802 2px, transparent 2px)',
              backgroundSize: '16px 16px',
            }}
          />

          {/* Top Pixel Clouds in Corners */}
          <div className="absolute top-2 left-6 flex gap-1 opacity-75 pointer-events-none">
            <div className="w-14 h-7 bg-white/95 rounded-full" />
            <div className="w-20 h-10 bg-white/95 rounded-full -ml-5 -mt-3" />
            <div className="w-12 h-7 bg-white/95 rounded-full -ml-4" />
          </div>
          <div className="absolute top-3 right-16 flex gap-1 opacity-75 pointer-events-none">
            <div className="w-16 h-8 bg-white/95 rounded-full" />
            <div className="w-22 h-11 bg-white/95 rounded-full -ml-5 -mt-3" />
            <div className="w-14 h-8 bg-white/95 rounded-full -ml-4" />
          </div>

          {/* Decorative Pixel Flower Clusters matching mockup */}
          {/* Top-Left Flowers */}
          <div className="absolute top-10 left-10 flex gap-1.5 text-base pointer-events-none select-none">
            <span className="drop-shadow-[1px_1px_0_#000]">🌸</span>
            <span className="drop-shadow-[1px_1px_0_#000]">🌼</span>
            <span className="drop-shadow-[1px_1px_0_#000]">🌺</span>
          </div>
          {/* Single Pink Flower near bottom-left */}
          <div className="absolute bottom-28 left-6 text-sm pointer-events-none select-none">
            <span className="drop-shadow-[1px_1px_0_#000]">🌸</span>
          </div>
          {/* Center-Bottom Flowers (Under the curved road) */}
          <div className="absolute bottom-10 left-[44%] flex gap-1.5 text-base pointer-events-none select-none">
            <span className="drop-shadow-[1px_1px_0_#000]">🌼</span>
            <span className="drop-shadow-[1px_1px_0_#000]">🌸</span>
            <span className="drop-shadow-[1px_1px_0_#000]">🌺</span>
          </div>

          {/* Decorative Rounded 16-Bit Pixel Bushes */}
          {/* Middle-Left Bushes */}
          <div className="absolute top-[36%] left-6 flex -space-x-2 pointer-events-none select-none opacity-90">
            <div className="w-10 h-9 rounded-full bg-[#278204] border-2 border-[#164D02] shadow-xs" />
            <div className="w-12 h-11 rounded-full bg-[#32A005] border-2 border-[#164D02] -mt-1 shadow-xs" />
          </div>
          {/* Bottom-Right Bushes */}
          <div className="absolute bottom-14 right-[28%] flex -space-x-2 pointer-events-none select-none opacity-90">
            <div className="w-11 h-10 rounded-full bg-[#278204] border-2 border-[#164D02] shadow-xs" />
            <div className="w-13 h-12 rounded-full bg-[#32A005] border-2 border-[#164D02] -mt-1 shadow-xs" />
          </div>

          {/* =========================================================================
              CLEAN GEOMETRIC WINDING DIRT TRAIL (목업과 100% 동일한 L자 굽은 황톳길)
              Start: (0, 490) -> (360, 490) -> (360, 240) -> (760, 240) -> Archway
             ========================================================================= */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
          >
            {/* Trail Dark Brown Outer Edge Shadow */}
            <path
              d="M -10,490 L 330,490 Q 380,490 380,440 L 380,270 Q 380,220 430,220 L 760,220 Q 800,220 820,260"
              fill="none"
              stroke="#75421B"
              strokeWidth="74"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Trail Main Warm Sandy Dirt Fill */}
            <path
              d="M -10,490 L 330,490 Q 380,490 380,440 L 380,270 Q 380,220 430,220 L 760,220 Q 800,220 820,260"
              fill="none"
              stroke="#C99454"
              strokeWidth="58"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Trail Center Texture Dashes */}
            <path
              d="M -10,490 L 330,490 Q 380,490 380,440 L 380,270 Q 380,220 430,220 L 760,220 Q 800,220 820,260"
              fill="none"
              stroke="#E2B77A"
              strokeWidth="12"
              strokeDasharray="16,24"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>

          {/* =========================================================================
              3. MAP INTERACTIVE NODES & STAGES (목업 위치 완벽 동기화)
             ========================================================================= */}

          {/* --- [START POINT]: Robot Mascot "여행을 시작해!" (화면 좌하단 길 위) --- */}
          <div className="absolute bottom-6 sm:bottom-8 left-3 sm:left-7 flex items-end gap-2 z-20">
            <div 
              onClick={() => handleStageClick('key-practice')}
              className="relative cursor-pointer group hover:scale-105 transition-transform"
              title="1단계 자리연습으로 이동!"
            >
              {/* Tank tread base robot */}
              <div className="w-14 sm:w-16 h-16 sm:h-18 bg-[#4B5563] rounded-xl border-3 border-black shadow-[3px_3px_0_#000] p-1 flex flex-col items-center justify-between">
                {/* Antenna */}
                <div className="w-1 h-3.5 bg-amber-400 -mt-4 border border-black rounded-full shadow-xs" />
                {/* Robot Monitor Face */}
                <div className="w-11 sm:w-13 h-8 sm:h-9 bg-[#A7F3D0] rounded-lg border-2 border-black flex items-center justify-center shadow-inner">
                  <span className="text-xs sm:text-sm font-black text-emerald-950 animate-pulse">◠‿◠</span>
                </div>
                {/* Tank Treads */}
                <div className="w-12 sm:w-14 h-3 bg-[#1F2937] rounded-sm border border-black flex items-center justify-around">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                </div>
              </div>

              {/* Speech bubble "여행을 시작해!" with pointer */}
              <div className="absolute -top-10 -left-1 bg-white px-2.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_#000] text-[10px] sm:text-[11px] font-pixel font-black text-slate-900 whitespace-nowrap animate-bounce">
                여행을 시작해!
                <div className="absolute -bottom-1.5 left-4 w-2 h-2 bg-white border-r-2 border-b-2 border-black rotate-45" />
              </div>
            </div>
          </div>

          {/* --- [STAGE 1]: 1 STAGE: 자리 연습 (하단 가로길 위) --- */}
          <div className="absolute bottom-16 sm:bottom-20 left-[18%] sm:left-[19%] z-20">
            <button
              type="button"
              onClick={() => handleStageClick('key-practice')}
              className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              {/* Wooden Signboard */}
              <div className="relative bg-[#8E5128] border-3 border-[#3A1E0B] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[3px_3px_0_#000] group-hover:border-[#FFD700] group-hover:shadow-[0_0_14px_rgba(255,215,0,0.7)] transition-all">
                {/* Red Flag on Top */}
                <div className="absolute -top-5 left-3 flex items-center">
                  <div className="w-0.5 h-6 bg-[#3A1E0B]" />
                  <div 
                    className="w-4 h-3 bg-[#E11D48] border border-black shadow-xs" 
                    style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} 
                  />
                </div>
                <div className="text-[10px] sm:text-[11px] font-pixel text-[#FFE699] font-black leading-tight drop-shadow-[1px_1px_0_#000]">
                  1 STAGE:
                </div>
                <div className="text-xs sm:text-sm font-pixel text-white font-black leading-tight drop-shadow-[1px_1px_0_#000] mt-0.5 whitespace-nowrap">
                  자리 연습
                </div>
              </div>
              {/* Wooden Post */}
              <div className="w-2.5 h-6 bg-[#5C3419] border-x-2 border-b-2 border-[#3A1E0B] -mt-0.5" />
            </button>
          </div>

          {/* --- [STAGE 2]: 2 STAGE: 낱말 연습 (길이 위로 꺾이는 우측 구간) --- */}
          <div className="absolute bottom-32 sm:bottom-40 left-[41%] sm:left-[42%] z-20">
            <button
              type="button"
              onClick={() => handleStageClick('word-practice')}
              className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              {/* Wooden Signboard */}
              <div className="relative bg-[#8E5128] border-3 border-[#3A1E0B] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[3px_3px_0_#000] group-hover:border-[#FFD700] group-hover:shadow-[0_0_14px_rgba(255,215,0,0.7)] transition-all">
                {/* Red Flag on Top */}
                <div className="absolute -top-5 left-3 flex items-center">
                  <div className="w-0.5 h-6 bg-[#3A1E0B]" />
                  <div 
                    className="w-4 h-3 bg-[#E11D48] border border-black shadow-xs"
                    style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} 
                  />
                </div>
                <div className="text-[10px] sm:text-[11px] font-pixel text-[#FFE699] font-black leading-tight drop-shadow-[1px_1px_0_#000]">
                  2 STAGE:
                </div>
                <div className="text-xs sm:text-sm font-pixel text-white font-black leading-tight drop-shadow-[1px_1px_0_#000] mt-0.5 whitespace-nowrap">
                  낱말 연습
                </div>
              </div>
              {/* Wooden Post */}
              <div className="w-2.5 h-6 bg-[#5C3419] border-x-2 border-b-2 border-[#3A1E0B] -mt-0.5" />
            </button>
          </div>

          {/* --- [STAGE 3]: 3 STAGE: 짧은 글 (상단 우측 꺾임목 위) --- */}
          <div className="absolute top-14 sm:top-20 left-[35%] sm:left-[36%] z-20">
            <button
              type="button"
              onClick={() => handleStageClick('sentence-practice')}
              className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              {/* Wooden Signboard */}
              <div className="relative bg-[#8E5128] border-3 border-[#3A1E0B] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[3px_3px_0_#000] group-hover:border-[#FFD700] group-hover:shadow-[0_0_14px_rgba(255,215,0,0.7)] transition-all">
                {/* Red Flag on Top */}
                <div className="absolute -top-5 left-3 flex items-center">
                  <div className="w-0.5 h-6 bg-[#3A1E0B]" />
                  <div 
                    className="w-4 h-3 bg-[#E11D48] border border-black shadow-xs"
                    style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} 
                  />
                </div>
                <div className="text-[10px] sm:text-[11px] font-pixel text-[#FFE699] font-black leading-tight drop-shadow-[1px_1px_0_#000]">
                  3 STAGE:
                </div>
                <div className="text-xs sm:text-sm font-pixel text-white font-black leading-tight drop-shadow-[1px_1px_0_#000] mt-0.5 whitespace-nowrap">
                  짧은 글
                </div>
              </div>
              {/* Wooden Post */}
              <div className="w-2.5 h-6 bg-[#5C3419] border-x-2 border-b-2 border-[#3A1E0B] -mt-0.5" />
            </button>
          </div>

          {/* --- [STAGE 4]: 4 STAGE: 긴 글 연습 (상단 직진 길 위) --- */}
          <div className="absolute top-14 sm:top-20 left-[55%] sm:left-[57%] z-20">
            <button
              type="button"
              onClick={() => handleStageClick('long-practice')}
              className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              {/* Wooden Signboard */}
              <div className="relative bg-[#8E5128] border-3 border-[#3A1E0B] rounded-lg px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[3px_3px_0_#000] group-hover:border-[#FFD700] group-hover:shadow-[0_0_14px_rgba(255,215,0,0.7)] transition-all">
                {/* Red Flag on Top */}
                <div className="absolute -top-5 left-3 flex items-center">
                  <div className="w-0.5 h-6 bg-[#3A1E0B]" />
                  <div 
                    className="w-4 h-3 bg-[#E11D48] border border-black shadow-xs"
                    style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} 
                  />
                </div>
                <div className="text-[10px] sm:text-[11px] font-pixel text-[#FFE699] font-black leading-tight drop-shadow-[1px_1px_0_#000]">
                  4 STAGE:
                </div>
                <div className="text-xs sm:text-sm font-pixel text-white font-black leading-tight drop-shadow-[1px_1px_0_#000] mt-0.5 whitespace-nowrap">
                  긴 글 연습
                </div>
              </div>
              {/* Wooden Post */}
              <div className="w-2.5 h-6 bg-[#5C3419] border-x-2 border-b-2 border-[#3A1E0B] -mt-0.5" />
            </button>
          </div>

          {/* --- [SPECIAL STAGE]: ✨ SPECIAL: 팡팡 지식 타자 ✨ (4단계 아래 풀밭 위) --- */}
          <div className="absolute bottom-24 sm:bottom-28 left-[54%] sm:left-[56%] z-20">
            <button
              type="button"
              onClick={() => handleStageClick('knowledge-hub')}
              className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1 active:translate-y-0 text-left"
            >
              {/* Sparkling Golden Signboard */}
              <div className="relative bg-gradient-to-b from-[#FFFDF0] to-[#FEF3C7] border-3 border-[#D97706] rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 shadow-[0_0_14px_rgba(245,158,11,0.65),3px_3px_0_#78350F] group-hover:scale-105 transition-all">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-pixel text-[#B45309] font-black">
                  <Sparkles className="w-3 h-3 text-[#F59E0B] animate-spin" />
                  <span>SPECIAL:</span>
                  <Sparkles className="w-3 h-3 text-[#F59E0B] animate-spin" />
                </div>
                <div className="text-xs sm:text-sm font-pixel text-[#78350F] font-black leading-tight drop-shadow-xs mt-0.5 whitespace-nowrap">
                  팡팡 지식 타자
                </div>
              </div>
              {/* Wooden Post */}
              <div className="w-2.5 h-5 bg-[#5C3419] border-x-2 border-b-2 border-[#3A1E0B] -mt-0.5" />
            </button>
          </div>

          {/* --- [STAGE 5]: GOLDEN ARCHWAY & TROPHY: 5 STAGE: 명예의 전당 (우측 종착점) --- */}
          <div className="absolute top-10 sm:top-14 right-3 sm:right-6 z-20">
            <button
              type="button"
              onClick={() => handleStageClick('leaderboard')}
              className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95 text-left"
            >
              {/* Radiating Sunburst & Golden Victory Arch */}
              <div className="relative flex flex-col items-center">
                {/* Glow behind trophy */}
                <div className="absolute -top-3 w-16 h-16 bg-yellow-300/60 rounded-full blur-md animate-pulse" />

                {/* Big Golden Trophy */}
                <div className="relative z-10 text-3xl sm:text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] -mb-1">
                  🏆
                </div>

                {/* Golden Stone Arch Pillars */}
                <div className="relative w-28 sm:w-34 pt-1 pb-2 px-1 border-t-8 border-x-6 border-[#F59E0B] rounded-t-3xl bg-[#FEF3C7]/95 shadow-[0_6px_0_#B45309] flex flex-col items-center">
                  {/* Arch Inner Wood Sign */}
                  <div className="bg-[#8E5128] border-2 border-[#3A1E0B] rounded-md px-2 py-1 w-full text-center shadow-[1px_1px_0_#000] group-hover:border-[#FFD700]">
                    <div className="text-[9px] sm:text-[10px] font-pixel text-[#FFD700] font-black leading-tight drop-shadow-[1px_1px_0_#000]">
                      5 STAGE:
                    </div>
                    <div className="text-xs sm:text-sm font-pixel text-white font-black leading-tight drop-shadow-[1px_1px_0_#000] mt-0.5 whitespace-nowrap">
                      명예의 전당
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* --- [BOTTOM RIGHT]: COIN / POUCH WALLET UI (우측 하단 코인 주머니 HUD) --- */}
          <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20">
            <div className="flex items-center gap-2 bg-[#5C3419] px-3.5 py-1.5 rounded-xl border-3 border-[#3E2419] shadow-[3px_3px_0_#000]">
              <div className="w-5 h-5 rounded-full bg-[#FFD700] border border-[#8C6219] flex items-center justify-center text-[10px] font-black text-amber-900 shadow-inner">
                🪙
              </div>
              <span className="font-mono text-sm sm:text-base font-black text-white">
                {points.toLocaleString()}
              </span>
              <span className="text-base sm:text-lg">💰</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
