import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, X, Medal, Plane, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { HighScoreEntry } from '../types';
import { PLANES } from '../game/constants';

interface HighScoresModalProps {
  scores: HighScoreEntry[];
  onClose: () => void;
  onResetScores: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({ scores, onClose, onResetScores }) => {
  const [page, setPage] = useState<0 | 1 | 2>(0); // 0: 1-10, 1: 11-20, 2: 21-30

  const pageScores = scores.slice(page * 10, (page + 1) * 10);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-5 bg-[#020617]/95 backdrop-blur-md select-none font-mono text-slate-200">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-[#0f172a] border border-amber-500/40 rounded-lg p-5 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.85)] max-h-[92vh]"
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
            <div>
              <h2 className="text-sm font-black text-amber-400 tracking-wider uppercase">
                SKY VANGUARD // TOP 30 ACE LEADERBOARD
              </h2>
              <div className="text-[11px] text-slate-400">전 세계 에이스 파일럿 명예의 전당 (1~30위)</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 10-Unit Page Tabs */}
        <div className="w-full grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: 'TOP 1 - 10위', p: 0 },
            { label: 'TOP 11 - 20위', p: 1 },
            { label: 'TOP 21 - 30위', p: 2 },
          ].map((tab) => (
            <button
              key={tab.p}
              onClick={() => setPage(tab.p as 0 | 1 | 2)}
              className={`py-1 px-2 rounded text-[11px] font-bold cursor-pointer transition-all border ${
                page === tab.p
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-[#020617] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scores Table (10 per page) */}
        <div className="w-full space-y-1.5 mb-4 overflow-y-auto max-h-[50vh] pr-1">
          {pageScores.map((entry, idx) => {
            const overallRank = page * 10 + idx + 1;
            const plane = PLANES[entry.planeId] || PLANES.AV8_HARRIER;

            const isTop1 = overallRank === 1;
            const isTop2 = overallRank === 2;
            const isTop3 = overallRank === 3;

            const badgeBg = isTop1
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-300 font-black shadow-[0_0_8px_rgba(245,158,11,0.6)]'
              : isTop2
              ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 border-slate-200 font-black'
              : isTop3
              ? 'bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 border-amber-600 font-bold'
              : 'bg-[#020617] text-slate-400 border-slate-800';

            return (
              <div
                key={`${entry.name}-${entry.score}-${overallRank}`}
                className={`flex items-center justify-between p-2 rounded border text-xs font-mono transition-all ${
                  isTop1
                    ? 'bg-amber-500/10 border-amber-500/50'
                    : isTop2
                    ? 'bg-slate-500/10 border-slate-500/40'
                    : isTop3
                    ? 'bg-amber-900/15 border-amber-800/40'
                    : 'bg-[#020617] border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Rank & Pilot Name */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded border flex items-center justify-center text-[11px] shrink-0 ${badgeBg}`}
                  >
                    #{overallRank}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-300 font-black tracking-wider text-xs">
                        {entry.name}
                      </span>
                      {isTop1 && <span className="text-[11px] px-1 bg-amber-500 text-slate-950 font-bold rounded">CHAMPION</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                      <span>{plane.flag}</span>
                      <span className="text-slate-300">{plane.name.split(' ')[0]}</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-sky-400">STAGE {entry.stage || 1}</span>
                    </div>
                  </div>
                </div>

                {/* Score & Timestamp */}
                <div className="text-right">
                  <div className="text-white font-bold text-xs">
                    {entry.score.toLocaleString()} <span className="text-amber-400 text-[11px]">PTS</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{entry.date || '2026.08.28'}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="w-full flex justify-between items-center text-xs font-mono border-t border-slate-800 pt-3">
          <button
            onClick={onResetScores}
            className="text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer uppercase font-bold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            초기화 (RESET)
          </button>
          <button
            onClick={onClose}
            className="py-1.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-xs font-black cursor-pointer uppercase tracking-wider shadow-[0_0_10px_rgba(245,158,11,0.4)]"
          >
            확인 (CLOSE)
          </button>
        </div>
      </motion.div>
    </div>
  );
};
