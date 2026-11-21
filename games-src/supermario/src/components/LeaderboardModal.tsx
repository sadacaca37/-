// Leaderboard Modal displaying Top 1~30 High Scores

import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, X, RotateCcw, Flame } from 'lucide-react';
import { LeaderboardEntry } from '../types';
import { LeaderboardManager } from '../game/leaderboard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart?: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, onRestart }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setEntries(LeaderboardManager.getEntries());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleReset = () => {
    if (window.confirm('랭킹 데이터를 초기화하시겠습니까?')) {
      const reset = LeaderboardManager.resetLeaderboard();
      setEntries(reset);
    }
  };

  return (
    <div
      id="leaderboard-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="leaderboard-modal-card"
        className="bg-white p-2 sm:p-3 rounded-[40px] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="bg-[#FDFDFD] border-2 border-gray-100 rounded-[32px] flex flex-col flex-1 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl border-2 border-amber-200 flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 fill-amber-500 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight italic text-gray-900 leading-tight">
                  HALL OF FAME <span className="text-red-600 font-extrabold not-italic font-mono">(TOP 30)</span>
                </h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  High Scores & Stage Achievements
                </p>
              </div>
            </div>
            <button
              id="btn-close-leaderboard"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Leaderboard Table */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 font-sans text-sm">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <span className="col-span-2 text-center font-mono">순위</span>
              <span className="col-span-4">플레이어</span>
              <span className="col-span-2 text-center">스테이지</span>
              <span className="col-span-2 text-right">점수</span>
              <span className="col-span-2 text-right">기록</span>
            </div>

            {entries.map((entry, idx) => {
              const rank = idx + 1;
              const isTop1 = rank === 1;
              const isTop2 = rank === 2;
              const isTop3 = rank === 3;

              return (
                <div
                  key={entry.id || idx}
                  className={`grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-2xl border transition-all ${
                    entry.isNew
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 animate-pulse'
                      : isTop1
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950 shadow-sm'
                      : isTop2
                      ? 'bg-slate-50 border-slate-300 text-slate-800 shadow-sm'
                      : isTop3
                      ? 'bg-orange-50/70 border-orange-200 text-orange-950 shadow-sm'
                      : 'bg-white border-gray-100 text-gray-700 hover:border-gray-200'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 flex items-center justify-center font-black">
                    {isTop1 ? (
                      <span className="flex items-center gap-1 text-amber-600 font-black text-sm">
                        <Trophy className="w-4 h-4 fill-amber-500 text-amber-600" /> 1위
                      </span>
                    ) : isTop2 ? (
                      <span className="flex items-center gap-1 text-slate-700 font-bold text-sm">
                        <Medal className="w-4 h-4 text-slate-500" /> 2위
                      </span>
                    ) : isTop3 ? (
                      <span className="flex items-center gap-1 text-amber-700 font-bold text-sm">
                        <Award className="w-4 h-4 text-amber-700" /> 3위
                      </span>
                    ) : (
                      <span className="text-gray-400 font-bold font-mono">{rank}</span>
                    )}
                  </div>

                  {/* Player Name */}
                  <div className="col-span-4 flex items-center gap-2 font-black truncate">
                    <span className="truncate text-gray-900 tracking-tight">{entry.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-bold">
                      {entry.mode || '1P'}
                    </span>
                  </div>

                  {/* Stage Reached */}
                  <div className="col-span-2 text-center text-xs">
                    {entry.stageReached === 10 ? (
                      <span className="text-emerald-700 font-black flex items-center justify-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> CLEAR
                      </span>
                    ) : (
                      <span className="text-gray-500 font-bold font-mono">STAGE {entry.stageReached}</span>
                    )}
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right font-black text-gray-900 font-mono tracking-tight text-sm">
                    {entry.score.toLocaleString()}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 text-right text-xs text-gray-400 font-mono truncate">
                    {entry.date}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white gap-2">
            <button
              id="btn-reset-leaderboard"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-red-600 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 랭킹 초기화
            </button>

            <div className="flex items-center gap-2">
              {onRestart && (
                <button
                  id="btn-leaderboard-restart"
                  onClick={() => {
                    onClose();
                    onRestart();
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs uppercase tracking-wide shadow-[0_3px_0_0_#065f46] active:translate-y-0.5 active:shadow-[0_1px_0_0_#065f46] transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 게임 다시 시작 (3목숨)
                </button>
              )}
              <button
                id="btn-confirm-leaderboard"
                onClick={onClose}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-[0_3px_0_0_#991b1b] active:translate-y-0.5 active:shadow-[0_1px_0_0_#991b1b] transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
