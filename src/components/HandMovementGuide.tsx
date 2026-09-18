import React from 'react';
import { FingerType } from '../types';
import { FINGER_COLORS } from '../data/practiceData';

interface HandMovementGuideProps {
  targetFinger: FingerType | null;
  targetKeyName?: string | null;
  activeFinger?: FingerType | null;
  className?: string;
  needsShift?: boolean;
}

export const HandMovementGuide: React.FC<HandMovementGuideProps> = ({
  targetFinger,
  targetKeyName,
  activeFinger,
  className = '',
  needsShift,
}) => {
  // Check if Shift is required for the target key
  const isShiftNeeded = Boolean(
    needsShift ||
    (targetKeyName && ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'].includes(targetKeyName)) ||
    (targetKeyName && targetKeyName.length === 1 && /[A-Z]/.test(targetKeyName))
  );

  // Determine which pinky presses Shift (opposite of the target finger's hand)
  const shiftPinky: FingerType | null = isShiftNeeded
    ? targetFinger?.startsWith('left')
      ? 'right-pinky'
      : 'left-pinky'
    : null;

  const leftFingers: { type: FingerType; label: string; short: string; height: string; offset: string }[] = [
    { type: 'left-pinky', label: '새끼', short: '새끼', height: 'h-11 sm:h-13', offset: 'mt-3' },
    { type: 'left-ring', label: '약지', short: '약지', height: 'h-14 sm:h-17', offset: 'mt-1' },
    { type: 'left-middle', label: '중지', short: '중지', height: 'h-16 sm:h-19', offset: 'mt-0' },
    { type: 'left-index', label: '검지', short: '검지', height: 'h-14 sm:h-17', offset: 'mt-1' },
    { type: 'thumb', label: '엄지', short: '엄지', height: 'h-10 sm:h-12', offset: 'mt-5 rotate-12' },
  ];

  const rightFingers: { type: FingerType; label: string; short: string; height: string; offset: string }[] = [
    { type: 'thumb', label: '엄지', short: '엄지', height: 'h-10 sm:h-12', offset: 'mt-5 -rotate-12' },
    { type: 'right-index', label: '검지', short: '검지', height: 'h-14 sm:h-17', offset: 'mt-1' },
    { type: 'right-middle', label: '중지', short: '중지', height: 'h-16 sm:h-19', offset: 'mt-0' },
    { type: 'right-ring', label: '약지', short: '약지', height: 'h-14 sm:h-17', offset: 'mt-1' },
    { type: 'right-pinky', label: '새끼', short: '새끼', height: 'h-11 sm:h-13', offset: 'mt-3' },
  ];

  const targetInfo = targetFinger ? FINGER_COLORS[targetFinger] : null;

  return (
    <div className={`bg-gradient-to-b from-sky-50/80 via-white/90 to-amber-50/70 rounded-3xl p-3 sm:p-4 border-2 border-sky-200 shadow-sm ${className}`}>
      {/* Title & Live Status */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-sky-100">
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base">🖐️</span>
          <span className="text-xs sm:text-sm font-black text-slate-800 font-arcade">
            자연스러운 손가락 실시간 운지 가이드
          </span>
        </div>

        {targetFinger && targetInfo ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-pink-300 shadow-2xs">
            {isShiftNeeded && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500 text-white animate-pulse">
                ⇧ Shift +
              </span>
            )}
            <span className={`w-2.5 h-2.5 rounded-full ${targetInfo.activeBg}`}></span>
            <span className="text-xs font-black text-pink-700">
              {targetInfo.name}
            </span>
            {targetKeyName && (
              <span className="text-xs font-black text-slate-900 bg-pink-100 px-1.5 py-0.2 rounded-md">
                [{targetKeyName}]
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-400">양손 홈포지션 준비</span>
        )}
      </div>

      {/* Two Hands Display */}
      <div className="flex items-end justify-center gap-6 sm:gap-16 pt-2 pb-3">
        {/* Left Hand */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black text-purple-700 mb-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 shadow-2xs">
            왼손 (Left)
          </span>

          <div className="flex items-end gap-1.5 sm:gap-2.5 px-3 pt-5 pb-2 rounded-t-3xl bg-gradient-to-b from-purple-50/40 to-purple-100/50 border-t-2 border-x-2 border-purple-200/70 backdrop-blur-xs relative shadow-xs">
            {leftFingers.map((f, i) => {
              const isTarget = targetFinger === f.type;
              const isShiftPinky = shiftPinky === f.type;
              const isActive = activeFinger === f.type;
              const colorData = FINGER_COLORS[f.type];

              let fingerStyle = `${colorData?.bg || 'bg-amber-50/90'} ${colorData?.border || 'border-amber-200'} text-slate-700 opacity-85 hover:opacity-100`;

              if (isTarget) {
                fingerStyle = 'bg-gradient-to-b from-pink-400 to-rose-500 border-pink-600 text-white shadow-lg ring-4 ring-pink-200 -translate-y-2.5 scale-110 z-20';
              } else if (isShiftPinky) {
                fingerStyle = 'bg-gradient-to-b from-amber-400 to-orange-500 border-orange-600 text-white shadow-lg ring-4 ring-amber-300 -translate-y-2.5 scale-110 z-20 animate-pulse';
              } else if (isActive) {
                fingerStyle = 'bg-teal-400 border-teal-600 text-white shadow-md -translate-y-1.5 scale-105 z-10';
              }

              return (
                <div
                  key={`left_${f.type}_${i}`}
                  className="flex flex-col items-center relative group"
                >
                  {/* Floating Indicator */}
                  {isTarget && (
                    <div className="absolute -top-6 text-pink-500 font-black text-xs animate-bounce flex flex-col items-center">
                      <span>👇</span>
                    </div>
                  )}
                  {isShiftPinky && (
                    <div className="absolute -top-6 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs animate-bounce flex items-center gap-0.5">
                      <span>⇧</span><span>Shift</span>
                    </div>
                  )}

                  {/* Finger Cylinder with Natural Curves */}
                  <div
                    className={`w-6 sm:w-8 ${f.height} ${f.offset} rounded-t-full border-2 transition-all duration-200 flex flex-col items-center justify-between pb-1 select-none ${fingerStyle}`}
                  >
                    {/* Natural Translucent Fingernail */}
                    <div
                      className={`w-3.5 sm:w-4.5 h-3 rounded-t-full mt-1 border transition-colors ${
                        isTarget || isShiftPinky
                          ? 'bg-white/80 border-white/90 shadow-2xs'
                          : 'bg-white/60 border-amber-100'
                      }`}
                    />

                    {/* Natural Knuckle Crease Line */}
                    <div className="w-3 h-0.5 rounded-full bg-black/10 my-auto"></div>

                    {/* Finger label */}
                    <span className="text-[9px] sm:text-[10px] font-black leading-none text-center">
                      {isShiftPinky ? 'Shift' : f.short}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Left Palm with Natural Curved Base */}
            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-purple-100/70 to-purple-200/50 rounded-b-2xl border-b-2 border-x-2 border-purple-200/70 flex items-center justify-center shadow-2xs">
              <span className="text-[9px] font-extrabold text-purple-500">손바닥</span>
            </div>
          </div>
        </div>

        {/* Right Hand */}
        <div className="flex flex-col items-center">
          <span className="text-[11px] font-black text-sky-700 mb-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 shadow-2xs">
            오른손 (Right)
          </span>

          <div className="flex items-end gap-1.5 sm:gap-2.5 px-3 pt-5 pb-2 rounded-t-3xl bg-gradient-to-b from-sky-50/40 to-sky-100/50 border-t-2 border-x-2 border-sky-200/70 backdrop-blur-xs relative shadow-xs">
            {rightFingers.map((f, i) => {
              const isTarget = targetFinger === f.type;
              const isShiftPinky = shiftPinky === f.type;
              const isActive = activeFinger === f.type;
              const colorData = FINGER_COLORS[f.type];

              let fingerStyle = `${colorData?.bg || 'bg-amber-50/90'} ${colorData?.border || 'border-amber-200'} text-slate-700 opacity-85 hover:opacity-100`;

              if (isTarget) {
                fingerStyle = 'bg-gradient-to-b from-pink-400 to-rose-500 border-pink-600 text-white shadow-lg ring-4 ring-pink-200 -translate-y-2.5 scale-110 z-20';
              } else if (isShiftPinky) {
                fingerStyle = 'bg-gradient-to-b from-amber-400 to-orange-500 border-orange-600 text-white shadow-lg ring-4 ring-amber-300 -translate-y-2.5 scale-110 z-20 animate-pulse';
              } else if (isActive) {
                fingerStyle = 'bg-teal-400 border-teal-600 text-white shadow-md -translate-y-1.5 scale-105 z-10';
              }

              return (
                <div
                  key={`right_${f.type}_${i}`}
                  className="flex flex-col items-center relative group"
                >
                  {/* Floating Indicator */}
                  {isTarget && (
                    <div className="absolute -top-6 text-pink-500 font-black text-xs animate-bounce flex flex-col items-center">
                      <span>👇</span>
                    </div>
                  )}
                  {isShiftPinky && (
                    <div className="absolute -top-6 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs animate-bounce flex items-center gap-0.5">
                      <span>⇧</span><span>Shift</span>
                    </div>
                  )}

                  {/* Finger Cylinder with Natural Curves */}
                  <div
                    className={`w-6 sm:w-8 ${f.height} ${f.offset} rounded-t-full border-2 transition-all duration-200 flex flex-col items-center justify-between pb-1 select-none ${fingerStyle}`}
                  >
                    {/* Natural Translucent Fingernail */}
                    <div
                      className={`w-3.5 sm:w-4.5 h-3 rounded-t-full mt-1 border transition-colors ${
                        isTarget || isShiftPinky
                          ? 'bg-white/80 border-white/90 shadow-2xs'
                          : 'bg-white/60 border-amber-100'
                      }`}
                    />

                    {/* Natural Knuckle Crease Line */}
                    <div className="w-3 h-0.5 rounded-full bg-black/10 my-auto"></div>

                    {/* Finger label */}
                    <span className="text-[9px] sm:text-[10px] font-black leading-none text-center">
                      {isShiftPinky ? 'Shift' : f.short}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Right Palm with Natural Curved Base */}
            <div className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-b from-sky-100/70 to-sky-200/50 rounded-b-2xl border-b-2 border-x-2 border-sky-200/70 flex items-center justify-center shadow-2xs">
              <span className="text-[9px] font-extrabold text-sky-500">손바닥</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
