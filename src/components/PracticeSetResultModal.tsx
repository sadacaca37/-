import React from 'react';
import { 
  X, 
  RotateCcw, 
  ArrowRight, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  AlertCircle,
  Trophy
} from 'lucide-react';

export interface PracticeSetResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cpm: number;
  errorCount: number;
  accuracy: number;
  onRetry: () => void;
  onNext?: () => void;
  // Star progression props (Key & Word practice)
  modeType?: 'key_word' | 'sentence_long';
  currentStars?: number; // 0 to 10
  starsEarned?: boolean;
  // Speed renewal props (Sentence & Long practice)
  prevBestCpm?: number;
  isFirstRecord?: boolean;
  isRecordBeat?: boolean;
  onClaimMychew?: () => void;
  /** 세트가 끝난 뒤 아직 안 친 곳 목록 등 추가 내용 */
  review?: React.ReactNode;
}

export const PracticeSetResultModal: React.FC<PracticeSetResultModalProps> = ({
  isOpen,
  onClose,
  title,
  cpm,
  errorCount,
  accuracy,
  onRetry,
  onNext,
  modeType = 'key_word',
  currentStars = 0,
  starsEarned = false,
  prevBestCpm = 0,
  isFirstRecord = false,
  isRecordBeat = false,
  onClaimMychew,
  review,
}) => {
  if (!isOpen) return null;

  const isAccuracyPassed = accuracy >= 95;
  const canAdvanceStage = modeType === 'key_word' ? currentStars >= 10 : true;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-50 via-white to-pink-50 border-4 border-amber-300 rounded-3xl p-6 sm:p-7 shadow-2xl text-center space-y-4 overflow-x-hidden overflow-y-auto max-h-[92vh]">
        {/* Prominent Close Button at Top-Right */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-4 z-20 flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200 transition shadow-xs cursor-pointer font-bold text-xs"
          title="창 닫기"
          aria-label="창 닫기"
        >
          <X className="w-4 h-4" />
          <span>닫기</span>
        </button>

        {/* Top Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>{title} 한 세트 완주 결과</span>
        </div>

        {/* Big Icon */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-200 to-pink-200 mx-auto flex items-center justify-center text-3xl shadow-md ring-4 ring-amber-100">
          {modeType === 'key_word' ? (currentStars >= 10 ? '🎉' : '⭐') : (isRecordBeat ? '🍬' : '📊')}
        </div>

        <div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900">
            {modeType === 'key_word'
              ? (currentStars >= 10 ? '축하합니다! 10세트 모두 완료!' : '한 세트 완주 성공!')
              : (isRecordBeat ? '최고 타수 신기록 달성!' : '세트 연습 완료!')}
          </h3>
          <p className="text-xs text-stone-600 font-medium mt-1">
            연습 결과를 확인하고 다음 단계로 진행하세요.
          </p>
        </div>

        {/* Key Stats Display: 타자수 & 오타수 & 정확도 */}
        <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-xs">
          {/* 타자수 */}
          <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-100">
            <div className="text-[11px] font-bold text-stone-500">타자수 (속도)</div>
            <div className="text-xl font-black text-amber-700 font-mono mt-0.5">
              {cpm} <span className="text-xs font-bold text-stone-400">타</span>
            </div>
          </div>

          {/* 오타수 */}
          <div className="bg-rose-50/80 rounded-xl p-2.5 border border-rose-100">
            <div className="text-[11px] font-bold text-stone-500">오타수</div>
            <div className="text-xl font-black text-rose-600 font-mono mt-0.5">
              {errorCount} <span className="text-xs font-bold text-stone-400">개</span>
            </div>
          </div>

          {/* 정확도 */}
          <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-100">
            <div className="text-[11px] font-bold text-stone-500">정확도</div>
            <div className="text-xl font-black text-emerald-600 font-mono mt-0.5">
              {accuracy}%
            </div>
          </div>
        </div>

        {/* Rules & Rewards Evaluation Box */}
        {modeType === 'key_word' ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                <span>별 적립 현황 (10세트 완주 시 다음 단계 & 마이쮸)</span>
              </span>
              <span className="text-xs font-black text-amber-700 font-mono">
                {currentStars} / 10 세트
              </span>
            </div>

            {/* Visual 10 Stars Grid */}
            <div className="flex items-center justify-center gap-1.5 py-1 text-lg">
              {Array.from({ length: 10 }).map((_, i) => (
                <span 
                  key={i} 
                  className={`transition-all duration-300 ${
                    i < currentStars ? 'scale-110 drop-shadow-xs' : 'opacity-25 grayscale'
                  }`}
                >
                  ⭐
                </span>
              ))}
            </div>

            <div className="text-xs font-medium text-stone-700 leading-relaxed border-t border-amber-200/60 pt-2">
              {isAccuracyPassed ? (
                starsEarned ? (
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>정확도 95% 이상 통과! 별 1개가 성공적으로 적립되었습니다.</span>
                  </div>
                ) : (
                  <div className="text-amber-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>이미 10세트를 완료하여 별이 모두 모였습니다!</span>
                  </div>
                )
              ) : (
                <div className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>정확도가 95% 미만({accuracy}%)이라 이번 세트 별이 적립되지 않았습니다. 오타를 줄여 다시 도전해보세요!</span>
                </div>
              )}
            </div>

            {currentStars < 10 && (
              <p className="text-[11px] text-stone-500 font-medium">
                💡 10세트(별 10개)가 모이면 다음 단계로 갈 수 있고 마이쮸를 받습니다! (앞으로 {10 - currentStars}세트 남음)
              </p>
            )}
          </div>
        ) : (
          /* Short / Long Text Rules Box */
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 space-y-2 text-left">
            <div className="flex items-center justify-between text-xs font-bold text-pink-900">
              <span>이전 최고 기록: <strong>{prevBestCpm > 0 ? `${prevBestCpm} 타` : '측정 전 (첫 타자)'}</strong></span>
              <span>이번 달성 기록: <strong className="text-pink-600">{cpm} 타</strong></span>
            </div>

            <div className="text-xs text-stone-700 leading-relaxed font-medium">
              {isFirstRecord ? (
                <div className="p-2 rounded-xl bg-purple-100/70 text-purple-900 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>첫 번째 타자 기록({cpm}타)이 기준 기록으로 등록되었습니다! 두 번째 타자부터 이 기록을 넘고 정확도 95% 이상을 달성하면 마이쮸를 받아요!</span>
                </div>
              ) : isRecordBeat ? (
                <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-900 font-bold flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>이전 기록({prevBestCpm}타) 경신 & 정확도 95% 이상 통과! 마이쮸 획득 조건을 완벽히 달성했습니다! 🍬</span>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-amber-100/70 text-amber-900 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {cpm <= prevBestCpm 
                      ? `이전 최고 기록(${prevBestCpm}타)보다 더 빠르게 쳐야 마이쮸를 받을 수 있어요!`
                      : `정확도가 95% 이상이어야 마이쮸를 받을 수 있어요! (현재: ${accuracy}%)`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Claim Mychew button if condition met */}
        {((modeType === 'key_word' && currentStars >= 10) || (modeType === 'sentence_long' && isRecordBeat)) && onClaimMychew && (
          <button
            onClick={() => {
              onClose();
              onClaimMychew();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-sm shadow-lg transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer ring-2 ring-pink-300 animate-pulse"
          >
            <span>🍬 마이쮸 받으러 가기! (선생님 검사)</span>
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {review}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => {
              onClose();
              onRetry();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-700 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>다시 연습하기</span>
          </button>

          {onNext && (
            <button
              onClick={() => {
                if (modeType === 'key_word' && !canAdvanceStage) {
                  // If key_word and stars < 10, proceed to next set
                  onClose();
                  onRetry();
                } else {
                  onClose();
                  onNext();
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
            >
              <span>{modeType === 'key_word' && !canAdvanceStage ? '다음 세트 시작' : '다음 단계로'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
