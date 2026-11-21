// Score Submit Modal upon Game Over or Stage 10 Victory

import React, { useState } from 'react';
import { Trophy, Flame, Skull, Sparkles, Send } from 'lucide-react';
import { LeaderboardManager } from '../game/leaderboard';
import { PlayerMode } from '../types';

interface ScoreSubmitModalProps {
  isOpen: boolean;
  isVictory: boolean;
  score: number;
  stageReached: number;
  timeRemaining: number;
  mode: PlayerMode;
  onSubmitted: () => void;
  onRestart?: () => void;
  onGoToMenu?: () => void;
  onViewRankingOnly?: () => void;
}

export const ScoreSubmitModal: React.FC<ScoreSubmitModalProps> = ({
  isOpen,
  isVictory,
  score,
  stageReached,
  timeRemaining,
  mode,
  onSubmitted,
  onRestart,
  onGoToMenu,
  onViewRankingOnly,
}) => {
  const [nickname, setNickname] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nickname.trim() || 'MARIO_PLAYER';
    LeaderboardManager.addScore({
      name: finalName.toUpperCase(),
      score,
      stageReached,
      timeSeconds: Math.max(0, Math.floor(timeRemaining)),
      mode,
    });
    setHasSubmitted(true);
    onSubmitted();
  };

  return (
    <div
      id="score-submit-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="score-submit-card"
        className="bg-white p-2.5 sm:p-3 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden text-center"
      >
        <div className="bg-[#FDFDFD] border-2 border-gray-100 rounded-[32px] p-6 sm:p-8 flex flex-col items-center gap-5 shadow-sm">
          {/* Banner */}
          <div className="flex justify-center">
            {isVictory ? (
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl border-2 border-amber-300 flex items-center justify-center shadow-md">
                <Trophy className="w-8 h-8 fill-amber-500 text-amber-600" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-3xl border-2 border-red-300 flex items-center justify-center shadow-md">
                <Skull className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-3xl font-black italic tracking-tight text-gray-900 leading-tight">
              {isVictory ? (
                <span className="text-amber-600 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6" /> STAGE 10 ALL CLEAR!
                </span>
              ) : (
                <span className="text-red-600">GAME OVER</span>
              )}
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              {isVictory
                ? '대마왕 쿠파를 격파하고 피치 공주를 구출했습니다!'
                : '3개의 생명을 모두 소진했습니다. 랭킹을 확인하거나 다시 시작하세요!'}
            </p>
          </div>

          {/* Stats Summary */}
          <div className="w-full bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm space-y-2.5 text-xs font-bold text-gray-600">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 uppercase tracking-wider">최종 도달 스테이지:</span>
              <span className="font-black text-gray-900 font-mono">STAGE {stageReached}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 uppercase tracking-wider">플레이 모드:</span>
              <span className="font-black text-emerald-600 font-mono">{mode} MODE</span>
            </div>
            <div className="flex justify-between items-center pt-2.5 border-t border-gray-100">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">최종 종합 점수:</span>
              <span className="text-xl font-black text-red-600 font-mono tracking-tight">
                {score.toLocaleString()} PTS
              </span>
            </div>
          </div>

          {/* Name Input Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div>
              <label
                htmlFor="player-nickname"
                className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5 text-left"
              >
                🏆 명예의 전당 (TOP 30) 등록 닉네임:
              </label>
              <input
                id="player-nickname"
                type="text"
                maxLength={12}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: MARIO_PRO"
                required
                autoFocus
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 focus:border-red-500 rounded-xl text-gray-900 font-mono text-center font-black tracking-widest placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all text-base shadow-sm"
              />
            </div>

            <button
              id="btn-submit-score"
              type="submit"
              disabled={hasSubmitted}
              className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-sm uppercase tracking-wider shadow-[0_5px_0_0_#991b1b] active:translate-y-1 active:shadow-[0_1px_0_0_#991b1b] flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" /> 랭킹 등록하고 확인하기
            </button>
          </form>

          {/* Quick Action Navigation Buttons */}
          <div className="flex gap-2 w-full pt-1">
            {onViewRankingOnly && (
              <button
                id="btn-view-ranking-only"
                type="button"
                onClick={onViewRankingOnly}
                className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border-2 border-amber-300 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> 랭킹 확인
              </button>
            )}

            {onRestart && (
              <button
                id="btn-gameover-restart"
                type="button"
                onClick={onRestart}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-[0_3px_0_0_#065f46] active:translate-y-0.5 active:shadow-[0_1px_0_0_#065f46] flex items-center justify-center gap-1.5 uppercase"
              >
                다시 시작 (3목숨)
              </button>
            )}

            {onGoToMenu && (
              <button
                id="btn-gameover-menu"
                type="button"
                onClick={onGoToMenu}
                className="flex-1 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border-2 border-gray-200 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                메인 메뉴
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
