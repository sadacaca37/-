import React from 'react';
import { BodyPortal } from './GameFitStage';
import { SendReportCTA } from './SendReportCTA';
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
  /** 자리 연습이면 'key' (같은 자리 3번 = 1세트) */
  practiceKind?: 'key' | 'other';
  /** 자리 연습: 하루 세트를 채우려고 친 횟수 / 필요한 횟수(3) */
  runsInSet?: number;
  runsPerSet?: number;
  /** 자리 연습 단계 구분값과 이름 (같은 자리를 몇 번 쳤는지 세기) */
  keyStage?: string;
  keyStageLabel?: string;
}

export const PracticeSetResultModal: React.FC<PracticeSetResultModalProps> = ({
  runsInSet = 0,
  runsPerSet = 0,
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
  practiceKind = 'other',
  keyStage,
  keyStageLabel,
}) => {
  if (!isOpen) return null;

  const isAccuracyPassed = accuracy >= 95;
  const canAdvanceStage = modeType === 'key_word' ? currentStars >= 10 : true;

  // 연습 화면은 창 크기에 맞춰 축소되어 그려지므로, 결과 창은 축소되지 않도록 화면 맨 위(body)에 띄우고 글자도 크게
  return (
    <BodyPortal>
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 tp-result-big tp-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-amber-50 via-white to-pink-50 border-4 border-amber-300 rounded-3xl p-7 sm:p-9 shadow-2xl text-center space-y-5 overflow-x-hidden overflow-y-auto max-h-[94vh]">
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

        {/* 축하 그림 (제미나이): 보물상자·트로피 */}
        <div className="rp-hero mx-auto">
          <img src="./assets/report/victory.webp" alt="" aria-hidden="true" draggable={false} />
          <span className="rp-hero-badge">{modeType === 'key_word' ? (currentStars >= 10 ? '🎉' : '⭐') : isRecordBeat ? '🍬' : '🏆'}</span>
        </div>

        <div>
          <h3 className="text-3xl sm:text-4xl font-black text-stone-900">
            {modeType === 'key_word'
              ? (currentStars >= 10 ? '축하합니다! 10세트 모두 완료!' : '한 세트 완주 성공!')
              : (isRecordBeat ? '최고 타수 신기록 달성!' : '세트 연습 완료!')}
          </h3>
          <p className="text-base text-stone-600 font-medium mt-1">
            연습 결과를 확인하고 다음 단계로 진행하세요.
          </p>
        </div>

        {/* Key Stats Display: 타자수 & 오타수 & 정확도 */}
        <div className="grid grid-cols-3 gap-2 bg-white p-3.5 rounded-2xl border-2 border-amber-200 shadow-xs">
          {/* 타자수 */}
          <div className="bg-amber-50/80 rounded-xl p-2.5 border border-amber-100">
            <div className="text-sm font-bold text-stone-500">타수 (맞게 친 것)</div>
            <div className="text-4xl font-black text-amber-700 font-mono mt-0.5">
              {cpm} <span className="text-xs font-bold text-stone-400">타</span>
            </div>
          </div>

          {/* 오타수 */}
          <div className="bg-rose-50/80 rounded-xl p-2.5 border border-rose-100">
            <div className="text-sm font-bold text-stone-500">오타수</div>
            <div className="text-4xl font-black text-rose-600 font-mono mt-0.5">
              {errorCount} <span className="text-xs font-bold text-stone-400">개</span>
            </div>
          </div>

          {/* 정확도 */}
          <div className="bg-emerald-50/80 rounded-xl p-2.5 border border-emerald-100">
            <div className="text-sm font-bold text-stone-500">정확도</div>
            <div className="text-4xl font-black text-emerald-600 font-mono mt-0.5">
              {accuracy}%
            </div>
          </div>
        </div>

        {/* 거의 다 틀렸으면 한/영 키 안내 (영어로 치면 모두 오타가 됨) */}
        {cpm === 0 && errorCount > 20 && (
          <div className="rp-note rp-note--warn">⌨️ 글자가 모두 틀렸어요. 혹시 <b>영어</b>로 치고 있었나요? 키보드의 <b>한/영</b> 키를 눌러 한글로 바꾼 뒤 다시 쳐 보세요.</div>
        )}

        {/* 다 쳤으면 선생님께 보내기 (크게) */}
        <SendReportCTA kind={practiceKind} keyStage={keyStage} stageLabel={keyStageLabel} />

        {/* Rules & Rewards Evaluation Box */}
        {modeType === 'key_word' ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-amber-900 flex items-center gap-1">
                <span>{runsPerSet ? '하루 세트 현황 (10세트 모이면 마이쮸 & 다음 단계)' : '세트 현황 (10세트 완주 시 다음 단계 & 운지법 검사 → 마이쮸)'}</span>
              </span>
              <span className="text-base font-black text-amber-700 font-mono">
                {currentStars} / 10 세트
              </span>
            </div>

            {/* Visual 10 Stars Grid */}
            <div className="flex items-center justify-center gap-2 py-1 text-3xl">
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

            <div className="text-sm font-medium text-stone-700 leading-relaxed border-t border-amber-200/60 pt-2">
              {isAccuracyPassed ? (
                starsEarned ? (
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{runsPerSet ? `${runsPerSet}번 완주! 하루 세트 1개(별 1개)를 모았어요.` : '정확도 95% 이상 통과! 1세트(별 1개)가 적립되었어요.'}</span>
                  </div>
                ) : runsPerSet && currentStars < 10 ? (
                  <div className="text-sky-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      잘했어요! 이번 하루 세트 {runsInSet}/{runsPerSet}번. {runsPerSet - runsInSet}번 더 치면 별 1개!
                    </span>
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
              <p className="text-sm text-stone-500 font-medium">
                {runsPerSet
                  ? `💡 ${runsPerSet}번 치면 하루 세트 1개! 하루 세트 10개가 모이면 마이쮸를 받고 다음 단계로 가요. (앞으로 ${10 - currentStars}세트 남음)`
                  : `💡 10세트를 치면 다음 단계로 가요. 선생님께 운지법 검사를 받으면 마이쮸! (앞으로 ${10 - currentStars}세트 남음)`}
              </p>
            )}
          </div>
        ) : (
          /* Short / Long Text Rules Box */
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 space-y-2 text-left">
            <div className="flex items-center justify-between text-base font-bold text-pink-900">
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
            <span>{modeType === 'key_word' && !runsPerSet ? '🍬 운지법 검사 받고 마이쮸 받기!' : '🍬 마이쮸 받으러 가기! (선생님 검사)'}</span>
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
            className="flex-1 py-4 px-5 rounded-xl bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-700 font-bold text-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
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
              className="flex-1 py-4 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-sm"
            >
              <span>{modeType === 'key_word' && !canAdvanceStage ? '다음 세트 시작' : '다음 단계로'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
    </BodyPortal>
  );
};
