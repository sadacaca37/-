import React, { useState, useEffect } from 'react';
import { Clock, Coins, PlusCircle, ArrowLeft, Pause, Play, AlertCircle, Crown, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { playgroundManager, POINTS_PER_MINUTE } from './playgroundManager';
import { pointsManager } from '../../../utils/pointsManager';
import { soundManager } from '../../../utils/sound';
import { UserSession } from '../../../types';

interface PlaygroundHeaderProps {
  gameTitle: string;
  onBack: () => void;
  onSelectAnotherGame?: () => void;
  currentUser?: UserSession | null;
  isBasicPlay?: boolean;
  isFullView?: boolean;
  onToggleFullView?: () => void;
  /** 선생님이 정한 무료 개방 기간이면 끝나는 시각(ms) */
  freeUntil?: number;
}

export const PlaygroundHeader: React.FC<PlaygroundHeaderProps> = ({
  gameTitle,
  onBack,
  onSelectAnotherGame,
  currentUser,
  isBasicPlay = false,
  isFullView = false,
  onToggleFullView,
  freeUntil = 0,
}) => {
  const isMaster = currentUser?.role === 'master';
  const isFree = freeUntil > Date.now();
  const [remainingSeconds, setRemainingSeconds] = useState(playgroundManager.getRemainingSeconds());
  const [points, setPoints] = useState(pointsManager.getBalance());
  const [isPaused, setIsPaused] = useState(!playgroundManager.isTimerRunning());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // If master or basic play, do not run countdown or expire
    if (isMaster || isBasicPlay || isFree) return;

    // Start countdown if not started
    if (!isPaused && remainingSeconds > 0) {
      playgroundManager.startTimer();
    }

    const handleTick = (e: any) => {
      setRemainingSeconds(e.detail.remainingSeconds);
    };

    const handlePoints = () => {
      setPoints(pointsManager.getBalance());
    };

    const handleTimeUpdated = (e: any) => {
      setRemainingSeconds(e.detail.remainingSeconds);
      setIsPaused(false);
      setPoints(pointsManager.getBalance());
    };

    const handleExpired = () => {
      setRemainingSeconds(0);
      setIsPaused(true);
      setMessage('⏰ 펀펀 플레이 이용 시간이 종료되었습니다! 포인트를 사용해 시간을 연장해보세요 (10분 1,000P).');
    };

    const handleAutoRenewed = (e: any) => {
      setMessage(e.detail?.message || '🎮 10분이 경과하여 1,000P가 자동 차감되었습니다.');
      setTimeout(() => setMessage(null), 4000);
    };

    window.addEventListener('playground-tick', handleTick);
    window.addEventListener('points-updated', handlePoints);
    window.addEventListener('playground-time-updated', handleTimeUpdated);
    window.addEventListener('playground-time-expired', handleExpired);
    window.addEventListener('playground-auto-renewed', handleAutoRenewed);

    return () => {
      window.removeEventListener('playground-tick', handleTick);
      window.removeEventListener('points-updated', handlePoints);
      window.removeEventListener('playground-time-updated', handleTimeUpdated);
      window.removeEventListener('playground-time-expired', handleExpired);
      window.removeEventListener('playground-auto-renewed', handleAutoRenewed);
    };
  }, [isPaused, remainingSeconds, isMaster, isBasicPlay, isFree]);

  const handleAddTime = (minutes: number) => {
    const res = playgroundManager.purchasePlayTime(minutes);
    if (res.success) {
      soundManager.play('achievement');
      setMessage(res.message);
      setIsPaused(false);
      setTimeout(() => setMessage(null), 3500);
    } else {
      setMessage(res.message);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const togglePause = () => {
    if (isPaused) {
      if (remainingSeconds > 0) {
        playgroundManager.startTimer();
        setIsPaused(false);
      } else {
        handleAddTime(10);
      }
    } else {
      playgroundManager.pauseTimer();
      setIsPaused(true);
    }
  };

  const handleOpenNewWindow = () => {
    soundManager.play('click');
    const targetUrl = `${window.location.origin}${window.location.pathname}?mode=playground&popup=true`;
    const popup = window.open(
      targetUrl,
      'typang_playground_window',
      'width=1280,height=920,left=100,top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
    );
    if (popup) {
      setMessage('🚀 새로운 브라우저 창으로 놀이터를 열었습니다! (10분당 1,000P 시간 실시간 연동)');
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage('⚠️ 브라우저 팝업이 차단되었습니다. 주소창 우측에서 팝업을 허용해주세요.');
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const isLowTime = remainingSeconds > 0 && remainingSeconds <= 60;

  return (
    <div className="pg-header-bar px-3.5 py-2.5 mb-3 flex flex-wrap items-center justify-between gap-2.5">
      {/* Left: Back & Game Title */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => {
            playgroundManager.pauseTimer();
            onBack();
          }}
          className="tp-rpg-btn tp-rpg-btn--wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>플레이그라운드 홈</span>
        </button>

        <div className="h-4 w-px bg-[#c69148]/50 hidden sm:block" />

        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded font-black bg-[#fbbf24] text-[#2c1507] border border-[#3d220d]">
            PLAYGROUND
          </span>
          <h2 className="text-sm sm:text-base font-black tracking-tight text-[#fff8e2] font-arcade">
            {gameTitle}
          </h2>
        </div>
      </div>

      {/* Right: Time Countdown & Points recharge */}
      {isMaster || isFree ? (
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto flex-wrap">
          {onToggleFullView && (
            <button
              onClick={onToggleFullView}
              className="tp-rpg-btn tp-rpg-btn--wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
              title={isFullView ? "일반 화면으로 복원" : "전체화면 전체보기로 전환"}
            >
              {isFullView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullView ? "창 복원" : "전체보기 전환"}</span>
            </button>
          )}
          <div className="pr-status-chip flex items-center gap-2 px-3 py-1.5 text-[#fde68a] font-black text-xs sm:text-sm">
            <Crown className="w-4 h-4 text-[#fbbf24] shrink-0" />
            <span>
              {isMaster
                ? '👑 마스터 무제한 FREE (포인트 차감 없음)'
                : `🎉 무료 개방 중! ${new Date(freeUntil).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}까지 포인트 없이 무제한`}
            </span>
          </div>
          <div className="hidden md:flex pr-status-chip items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#fff6dc] tabular-nums">
            <span>보유: {points.toLocaleString()} P</span>
          </div>
        </div>
      ) : isBasicPlay ? (
        <div className="flex items-center gap-2 sm:gap-2.5 ml-auto flex-wrap">
          {onToggleFullView && (
            <button
              onClick={onToggleFullView}
              className="tp-rpg-btn tp-rpg-btn--wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
              title={isFullView ? "일반 화면으로 복원" : "전체화면 전체보기로 전환"}
            >
              {isFullView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullView ? "창 복원" : "전체보기 전환"}</span>
            </button>
          )}
          <div className="pr-status-chip flex items-center gap-2 px-3 py-1.5 text-[#86efac] font-black text-xs sm:text-sm">
            <span>🎮 기본 플레이 (포인트 차감 없음 · 무제한 무료)</span>
          </div>
          <div className="hidden md:flex pr-status-chip items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#fff6dc] tabular-nums">
            <span>보유: {points.toLocaleString()} P</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
          {onToggleFullView && (
            <button
              onClick={onToggleFullView}
              className="tp-rpg-btn tp-rpg-btn--wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
              title={isFullView ? "일반 화면으로 복원" : "전체화면 전체보기로 전환"}
            >
              {isFullView ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullView ? "창 복원" : "전체보기 전환"}</span>
            </button>
          )}
          {/* Real-time remaining countdown */}
          <div className={`pr-status-chip flex items-center gap-2 px-3 py-1.5 font-mono font-black text-sm sm:text-base tabular-nums ${
            remainingSeconds === 0
              ? 'text-[#fca5a5] border-[#ef4444]'
              : isLowTime
              ? 'text-[#fde047] border-[#f59e0b]'
              : 'text-[#fff6dc]'
          }`}>
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-[#fbbf24]' : 'text-[#fde68a]'}`} />
            <span>
              {remainingSeconds > 0 ? playgroundManager.formatTime(remainingSeconds) : '00:00 (시간종료)'}
            </span>

            <button
              onClick={togglePause}
              className="ml-1 p-1 hover:bg-white/10 rounded text-[#fde68a] hover:text-white cursor-pointer"
              title={isPaused ? '타이머 재개' : '타이머 일시정지'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Current Point Balance */}
          <div className="hidden md:flex pr-status-chip items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#fde68a] tabular-nums">
            <Coins className="w-3.5 h-3.5 text-[#fbbf24]" />
            <span>보유: {points.toLocaleString()} P</span>
          </div>

          {/* Quick add time buttons (10분에 1,000P) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddTime(10)}
              disabled={points < 1000}
              className="tp-rpg-btn tp-rpg-btn--gold px-3 py-1.5 disabled:opacity-40 text-xs font-black flex items-center gap-1 cursor-pointer"
              title="1,000 포인트로 10분 충전 (새 창 연동)"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+10분</span>
              <span className="text-[10px] opacity-85">(1,000P)</span>
            </button>

            <button
              onClick={() => handleAddTime(20)}
              disabled={points < 2000}
              className="tp-rpg-btn tp-rpg-btn--wood px-3 py-1.5 disabled:opacity-40 text-xs font-black flex items-center gap-1 cursor-pointer"
              title="2,000 포인트로 20분 충전"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#fde047]" />
              <span>+20분</span>
              <span className="text-[10px] opacity-85">(2,000P)</span>
            </button>

            {/* New Window Button for Playground */}
            <button
              onClick={handleOpenNewWindow}
              className="tp-rpg-btn tp-rpg-btn--wood px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="새 브라우저 창으로 열기 (시간 및 포인트 실시간 연동)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#fde68a]" />
              <span className="hidden sm:inline">새 창</span>
            </button>
          </div>
        </div>
      )}

      {/* Expired or Recharge Alert Message */}
      {message && (
        <div className="w-full mt-1 px-3 py-1.5 rounded-lg bg-[#7f1d1d] border-2 border-[#f87171] text-[#fee2e2] text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#fca5a5] shrink-0" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};
