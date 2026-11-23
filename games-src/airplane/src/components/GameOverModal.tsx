import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home, Trophy, Sparkles, Award } from 'lucide-react';
import { GameStats, PlaneId } from '../types';
import { retroAudio } from '../audio/retroAudio';

interface GameOverModalProps {
  stats: GameStats;
  planeId: PlaneId;
  credits: number;
  onContinue: () => void;
  onReturnTitle: () => void;
  onSaveScore: (name: string) => void;
  onOpenHighScores?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  planeId,
  credits,
  onContinue,
  onReturnTitle,
  onSaveScore,
  onOpenHighScores,
}) => {
  const [countdown, setCountdown] = useState(9);
  const [playerName, setPlayerName] = useState('ACE');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    onSaveScore(playerName.toUpperCase().slice(0, 4));
    setIsSaved(true);
    retroAudio.playPowerUp();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-5 bg-[#020617]/95 backdrop-blur-md select-none font-mono text-slate-200">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-[#0f172a] border border-red-500/50 rounded-lg p-5 flex flex-col items-center shadow-[0_0_40px_rgba(239,68,68,0.35)]"
      >
        {/* Game Over Title */}
        <h1 className="text-2xl font-bold text-red-500 tracking-wider mb-0.5 animate-pulse">
          MISSION TERMINATED
        </h1>
        <div className="text-[11px] text-slate-400 mb-3 uppercase tracking-widest">
          AIRCRAFT DOWN // DEBRIEFING
        </div>

        {/* Continue Countdown Badge */}
        <div className="flex flex-col items-center mb-3 bg-[#020617] px-6 py-1.5 rounded border border-slate-800">
          <div className="text-[11px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
            RESCUE SCRAMBLE COUNTDOWN
          </div>
          <div className="text-3xl font-black text-amber-400">
            {countdown > 0 ? countdown : '0'}
          </div>
        </div>

        {/* Score Breakdown Card */}
        <div className="w-full bg-[#020617] rounded p-3 border border-slate-800 space-y-1 text-xs font-mono mb-3">
          <div className="flex justify-between text-slate-400">
            <span>FINAL SCORE:</span>
            <span className="text-amber-400 font-bold text-sm">
              {stats.score.toLocaleString()} PTS
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>STAGE REACHED:</span>
            <span className="text-white font-bold">STAGE {stats.stageNumber} / 10</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>HOSTILES DOWNED:</span>
            <span className="text-red-400 font-bold">{stats.enemiesDestroyed} UNITS</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>MEDALS RECOVERED:</span>
            <span className="text-amber-300 font-bold">{stats.medalsCollected}</span>
          </div>
        </div>

        {/* High Score Initials Entry Form (Top 30 Ranking Input) */}
        {!isSaved ? (
          <form onSubmit={handleSave} className="w-full mb-3 flex flex-col items-center">
            <label className="text-[11px] text-amber-400 mb-1.5 flex items-center gap-1 font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> TOP 30 랭킹 등록 (이름/이니셜)
            </label>
            <div className="flex gap-2 w-full">
              <input
                type="text"
                maxLength={4}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                className="flex-1 bg-[#020617] border-2 border-amber-500/70 rounded px-3 py-1.5 text-center text-amber-300 font-bold text-base tracking-widest uppercase focus:outline-none focus:border-amber-400 shadow-inner"
                placeholder="ACE"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded active:scale-95 transition-all cursor-pointer uppercase shadow-[0_0_10px_rgba(245,158,11,0.4)]"
              >
                등록
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full bg-emerald-950/40 border border-emerald-500/50 rounded p-2 text-center text-xs text-emerald-400 mb-3 flex items-center justify-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> TOP 30 랭킹 등록 완료: [{playerName}]
          </div>
        )}

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          {onOpenHighScores && (
            <button
              onClick={onOpenHighScores}
              className="w-full py-2 px-3 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              TOP 30 랭킹 순위표 보기
            </button>
          )}

          <button
            onClick={onContinue}
            className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            DEPLOY BACKUP FIGHTER (CONTINUE)
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            RETURN TO BASE BRIEFING
          </button>
        </div>
      </motion.div>
    </div>
  );
};
