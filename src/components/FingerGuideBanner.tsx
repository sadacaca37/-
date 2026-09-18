import React from 'react';
import { Hand, ArrowRight, Sparkles, Check, X } from 'lucide-react';

interface FingerGuideBannerProps {
  targetChar?: string;
  targetFingerName?: string;
  needsShift?: boolean;
  lastCharPressed?: string;
  lastFingerUsed?: string;
  isCorrectLastKey?: boolean | null;
}

export const FingerGuideBanner: React.FC<FingerGuideBannerProps> = ({
  targetChar,
  targetFingerName = '홈 포지션 대기',
  needsShift,
  lastCharPressed,
  lastFingerUsed,
  isCorrectLastKey,
}) => {
  // Check if target requires Shift
  const requiresShift = Boolean(
    needsShift ||
    (targetChar && ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'].includes(targetChar)) ||
    (targetChar && targetChar.length === 1 && /[A-Z]/.test(targetChar)) ||
    (targetFingerName && targetFingerName.includes('Shift'))
  );

  const isLeftHand = targetFingerName.includes('왼손');
  const shiftPinkyText = isLeftHand ? '오른손 새끼(Shift)' : '왼손 새끼(Shift)';
  const cleanTargetFingerName = targetFingerName.replace(/\s*\(\s*Shift\s*\)/i, '').replace(/\s*\+\s*Shift/i, '');

  return (
    <div 
      id="finger-guide-banner"
      className="bg-white rounded-3xl p-4 sm:p-5 shadow-md border-2 border-pink-200 flex flex-col md:flex-row items-center justify-between gap-4"
    >
      {/* Left: Recommended Target Finger Guide */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2.5 text-pink-700 bg-pink-50 px-5 py-2.5 rounded-2xl border-2 border-pink-200 shadow-xs flex-wrap">
          <Hand className="w-5 h-5 text-pink-500 animate-pulse shrink-0" />
          <span className="text-xs font-black text-slate-500">손가락 안내:</span>
          {requiresShift ? (
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 shadow-2xs">
                {shiftPinkyText}
              </span>
              <span className="text-xs font-black text-slate-400">+</span>
              <span className="text-base sm:text-lg font-black text-pink-700 underline decoration-pink-300 underline-offset-4">
                {cleanTargetFingerName}
              </span>
            </span>
          ) : (
            <span className="text-base sm:text-lg font-black text-pink-700 underline decoration-pink-300 underline-offset-4">
              {targetFingerName}
            </span>
          )}
          <span className="text-xs sm:text-sm text-slate-600 font-bold">
            로 {targetChar ? <strong className="text-slate-900 font-black bg-white px-2 py-0.5 rounded-lg border-2 border-pink-200 ml-1 shadow-2xs">'{targetChar}'</strong> : ''} 키를 누르세요!
          </span>
        </div>
      </div>

      {/* Right: Real-time Feedback on User's Pressed Key */}
      <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3 bg-sky-50/70 px-4 py-2 rounded-2xl border-2 border-sky-200">
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">실시간 자판 감지</span>
          {lastCharPressed ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-white border border-sky-200 text-slate-900 shadow-2xs">
                {lastCharPressed === ' ' ? 'Space' : lastCharPressed}
              </span>
              <ArrowRight className="w-3 h-3 text-sky-400" />
              <span className={`text-xs font-black ${
                isCorrectLastKey === false ? 'text-rose-600' : 'text-teal-600'
              }`}>
                {lastFingerUsed || '자판 감지됨'}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-400">자판을 누르면 손가락이 인식됩니다</span>
          )}
        </div>

        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 transition-all border-2 ${
          isCorrectLastKey === true 
            ? 'bg-teal-400 text-white border-teal-600 ring-2 ring-teal-200' 
            : isCorrectLastKey === false 
            ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-200 animate-shake' 
            : 'bg-slate-100 text-slate-400 border-slate-200'
        }`}>
          {isCorrectLastKey === true ? <Check className="w-4 h-4" /> : isCorrectLastKey === false ? <X className="w-4 h-4" /> : '•'}
        </div>
      </div>
    </div>
  );
};
