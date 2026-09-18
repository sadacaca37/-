import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, CheckCircle2, RotateCcw, ArrowRight, Award, Heart, X } from 'lucide-react';
import { soundManager } from '../utils/sound';

export interface MychewRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'key_word_ten_stars' | 'cpm_renewal';
  accuracy: number;
  isSuccess: boolean;
  cpm?: number;
  prevBestCpm?: number;
  title?: string;
  onRetry?: () => void;
  onNext?: () => void;
}

export const MychewRewardModal: React.FC<MychewRewardModalProps> = ({
  isOpen,
  onClose,
  type,
  accuracy,
  isSuccess,
  cpm = 0,
  prevBestCpm = 0,
  title,
  onRetry,
  onNext,
}) => {
  const [isTeacherApproved, setIsTeacherApproved] = useState(false);
  const [teacherStampTime, setTeacherStampTime] = useState<string | null>(null);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState<number | null>(null);

  // Reset state whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsTeacherApproved(false);
      setTeacherStampTime(null);
      setAutoCloseSeconds(null);
    }
  }, [isOpen]);

  // Handle auto-close countdown after teacher approval
  React.useEffect(() => {
    if (autoCloseSeconds === null) return;
    if (autoCloseSeconds <= 0) {
      onClose();
      return;
    }
    const timer = setTimeout(() => {
      setAutoCloseSeconds((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [autoCloseSeconds, onClose]);

  if (!isOpen) return null;

  const handleTeacherApprove = () => {
    setIsTeacherApproved(true);
    const now = new Date();
    const timeStr = `${now.getHours()}시 ${now.getMinutes()}분 ${now.getSeconds()}초`;
    setTeacherStampTime(timeStr);
    soundManager.playVictory();
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff69b4', '#ff1493', '#ffd700', '#00ff7f', '#00bfff'],
      });
    } catch {}

    // Auto-close automatically after 1 second as requested by user
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-rose-50 via-white to-pink-50 border-4 border-pink-300 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4 overflow-hidden">
        {/* Top-left Decorative Icon */}
        <span className="absolute top-3.5 left-4 text-xl select-none animate-pulse">⭐</span>

        {/* Prominent, Clearly Visible Close Button at Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-4 z-20 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-rose-100 text-stone-700 hover:text-pink-600 border border-pink-200 transition-all shadow-xs cursor-pointer font-bold text-xs group"
          title="창 닫기"
          aria-label="창 닫기"
        >
          <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>닫기</span>
        </button>

        {isSuccess ? (
          <>
            {/* SUCCESS STATE */}
            <div className="relative inline-block mx-auto mt-2">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-400 via-rose-300 to-yellow-200 flex items-center justify-center text-4xl shadow-lg ring-4 ring-pink-200 animate-bounce">
                🍬
              </div>
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[11px] font-black px-2 py-0.5 rounded-full border border-white shadow-xs">
                ⭐ 보상 획득!
              </span>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-black">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                <span>
                  {type === 'key_word_ten_stars' ? '10회 완성 미션 달성!' : '최고 타수 신기록 경신!'}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                선생님 검사받고 <span className="text-pink-600 underline decoration-pink-300 decoration-wavy">마이쮸</span> 받으세요! 🍬
              </h3>
              <p className="text-xs text-stone-600 font-medium">
                {type === 'key_word_ten_stars'
                  ? '총 10세트 타자를 모두 완료하고 정확도 95% 이상을 통과했습니다!'
                  : `이전 기록을 뛰어넘어 신기록을 세우고 정확도 95% 이상을 달성했습니다!`}
              </p>
            </div>

            {/* Achievement Stats Box */}
            <div className="p-3.5 rounded-2xl bg-white/90 border-2 border-pink-200 shadow-xs space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-pink-50/80 rounded-xl p-2 border border-pink-100">
                  <div className="text-[11px] font-bold text-stone-500">정확도</div>
                  <div className="text-lg font-black text-pink-600">
                    {accuracy}%{' '}
                    <span className="text-[10px] text-emerald-600 font-bold">
                      (95% 기준 통과 ✓)
                    </span>
                  </div>
                </div>

                <div className="bg-amber-50/80 rounded-xl p-2 border border-amber-100">
                  <div className="text-[11px] font-bold text-stone-500">
                    {type === 'cpm_renewal' ? '갱신된 최고 타수' : '달성 타수'}
                  </div>
                  <div className="text-lg font-black text-amber-800">
                    {cpm} <span className="text-xs font-bold text-stone-400">타</span>
                    {type === 'cpm_renewal' && prevBestCpm > 0 && (
                      <span className="text-[10px] text-purple-600 font-bold block">
                        (이전 {prevBestCpm}타 ➔ +{cpm - prevBestCpm}타)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {type === 'key_word_ten_stars' && (
                <div className="flex items-center justify-center gap-1 text-base pt-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className="text-amber-400">⭐</span>
                  ))}
                </div>
              )}
            </div>

            {/* Teacher Inspection Stamp Area */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-pink-50 border-2 border-dashed border-pink-300 relative">
              {isTeacherApproved ? (
                <div className="space-y-2.5 animate-in zoom-in-95 duration-200">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-100 text-red-700 rounded-full border-2 border-red-400 font-black text-sm shadow-xs">
                    <span>💮 선생님 확인 도장: 마이쮸 지급 완료!</span>
                  </div>
                  <div className="text-xs text-stone-700 font-bold">
                    달콤한 마이쮸를 맛있게 먹고 다음 연습도 화이팅! 🍬
                  </div>
                  {teacherStampTime && (
                    <div className="text-[10px] text-stone-400 font-mono">
                      확인 시각: {teacherStampTime} (잠시 후 창이 자동으로 꺼집니다)
                    </div>
                  )}

                  {/* Immediate close button */}
                  <div className="pt-1 flex items-center justify-center gap-2">
                    <button
                      onClick={onClose}
                      className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>마이쮸 받기 완료 (창 닫기)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-pink-900">
                    👩‍🏫 <strong>선생님께 화면을 보여드리고 아래 [마이쮸 받기]를 눌러주세요!</strong>
                  </div>
                  <button
                    onClick={handleTeacherApprove}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-pink-300"
                  >
                    <span>🍬 마이쮸 받기 (선생님 검사 확인)</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Action & Close Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {onRetry && (
                <button
                  onClick={() => {
                    onClose();
                    onRetry();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 도전하기</span>
                </button>
              )}
              {onNext && (
                <button
                  onClick={() => {
                    onClose();
                    onNext();
                  }}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-black text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>다음 단계로</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {/* Dedicated Close Button at the bottom */}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold text-xs transition flex items-center gap-1 cursor-pointer border border-pink-200"
              >
                <span>창 닫기</span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* FAILED CRITERIA (Accuracy < 90% or < 95%) */}
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center text-3xl shadow-inner border-2 border-amber-300 mt-2">
              💪
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
                <span>조금 더 연습해봐요!</span>
              </div>
              <h3 className="text-xl font-black text-stone-900">
                아쉬워요! 조금만 더 정확하게 쳐볼까요?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {type === 'key_word_ten_stars' ? (
                  <>
                    마이쮸를 받으려면 <strong>정확도 90% 이상</strong>이 필요해요.<br />
                    (현재 정확도: <strong className="text-rose-600">{accuracy}%</strong> / 오타를 줄여보세요!)
                  </>
                ) : (
                  <>
                    마이쮸를 받으려면 <strong>타수 갱신 + 정확도 95% 이상</strong>이 필요해요.<br />
                    (현재 정확도: <strong className="text-rose-600">{accuracy}%</strong>)
                  </>
                )}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              💡 천천히 오타 없이 정확하게 치는 연습을 하면 금방 달성할 수 있어요!
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {onRetry && (
                <button
                  onClick={() => {
                    onClose();
                    onRetry();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md transition hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 10번 도전하기</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                창 닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
