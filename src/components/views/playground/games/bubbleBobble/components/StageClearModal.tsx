import React from 'react';
import { Trophy, ArrowRight, Star } from 'lucide-react';

interface StageClearModalProps {
  round: number;
  scoreP1: number;
  scoreP2?: number;
  onNextStage: () => void;
}

export const StageClearModal: React.FC<StageClearModalProps> = ({
  round,
  scoreP1,
  scoreP2,
  onNextStage,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-white font-mono animate-fade-in select-none">
      <div className="bento-card bento-card-active p-6 max-w-md w-full text-center shadow-2xl relative overflow-hidden border-2 border-yellow-400">
        {/* Animated celebration glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse"></div>

        <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-2 animate-bounce" />

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-emerald-400 uppercase tracking-wider mb-1 glow-yellow">
          {round >= 10 ? '★ FINAL STAGE CLEAR! ★' : `ROUND ${round} CLEAR!`}
        </h2>
        <p className="text-emerald-400 font-bold text-xs tracking-widest mb-6">
          {round >= 10 ? 'FINAL BOSS DEFEATED • ALL 10 STAGES CLEARED!' : 'STAGE COMPLETED • BONUS +1,000 PTS'}
        </p>

        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-2 mb-6 text-sm">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 1P SCORE:
            </span>
            <span className="text-yellow-300 font-black text-base">
              {String(scoreP1).padStart(6, '0')}
            </span>
          </div>

          {scoreP2 !== undefined && (
            <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-2">
              <span className="flex items-center gap-1.5 font-bold text-cyan-400">
                <Star className="w-4 h-4 text-cyan-400 fill-cyan-400" /> 2P SCORE:
              </span>
              <span className="text-yellow-300 font-black text-base">
                {String(scoreP2).padStart(6, '0')}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onNextStage}
          className={`w-full py-3 px-6 text-white font-black text-base rounded-xl border-2 border-yellow-300 shadow-lg flex items-center justify-center gap-2 transform hover:scale-[1.02] transition ${
            round >= 10
              ? 'bg-gradient-to-r from-yellow-500 via-amber-500 to-pink-500 text-slate-950 shadow-yellow-500/50'
              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/40'
          }`}
        >
          <span>{round >= 10 ? '👑 우승 화면 & 명예의 전당 등록' : 'NEXT STAGE'}</span>
          <ArrowRight className={`w-5 h-5 ${round >= 10 ? 'text-slate-950' : 'text-yellow-300'}`} />
        </button>
      </div>
    </div>
  );
};
