import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Sparkles, Home, RotateCcw } from 'lucide-react';
import { GameStats, PlaneId } from '../types';
import { PLANES } from '../game/constants';
import { retroAudio } from '../audio/retroAudio';

interface VictoryModalProps {
  stats: GameStats;
  planeId: PlaneId;
  onReturnTitle: () => void;
  onPlayAgain: () => void;
  onSaveScore?: (name: string) => void;
  onOpenHighScores?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  stats,
  planeId,
  onReturnTitle,
  onPlayAgain,
  onSaveScore,
  onOpenHighScores,
}) => {
  const plane = PLANES[planeId] || PLANES.P38_LIGHTNING;
  const [playerName, setPlayerName] = useState('ACE');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    retroAudio.playStageClear();

    // Fireworks confetti bursts
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#ef4444'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#ef4444'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !onSaveScore) return;
    onSaveScore(playerName.toUpperCase().slice(0, 4));
    setIsSaved(true);
    retroAudio.playPowerUp();
  };

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#020617]/95 backdrop-blur-md select-none font-mono text-slate-200">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#0f172a] border border-amber-400 rounded-lg p-5 flex flex-col items-center shadow-[0_0_40px_rgba(245,158,11,0.3)] max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center gap-1.5 text-amber-400 text-[11px] tracking-widest uppercase mb-0.5 font-bold">
          <Trophy className="w-4 h-4 text-amber-400" /> THEATER CAMPAIGN COMPLETED
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider text-center mb-0.5">
          CAMPAIGN VICTORY
        </h1>
        <div className="text-xs text-sky-400 mb-3 uppercase tracking-wider text-center">
          ALL 10 SECTORS LIBERATED // SUPREME ACE PILOT
        </div>

        {/* Aircraft Badge */}
        <div className="flex items-center gap-2.5 bg-[#020617] px-4 py-1.5 rounded border border-slate-800 mb-3">
          <span className="text-xl">{plane.flag}</span>
          <div className="text-left">
            <div className="text-xs text-amber-400 font-bold">{plane.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">"{plane.codename}"</div>
          </div>
        </div>

        {/* Final Record Breakdown */}
        <div className="w-full bg-[#020617] rounded p-3.5 border border-slate-800 space-y-1.5 text-xs font-mono mb-3">
          <div className="flex justify-between text-slate-400">
            <span>FINAL TOTAL SCORE:</span>
            <span className="text-amber-400 text-sm font-bold">
              {stats.score.toLocaleString()} PTS
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>TOTAL HOSTILES SHOT DOWN:</span>
            <span className="text-red-400 font-bold">{stats.enemiesDestroyed} UNITS</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>DISTINGUISHED SERVICE MEDALS:</span>
            <span className="text-amber-300 font-bold">{stats.medalsCollected}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>TACTICAL BOMBS DEPLOYED:</span>
            <span className="text-sky-400 font-bold">{stats.bombsUsed}</span>
          </div>
        </div>

        {/* Name Registration for Top 30 Leaderboard */}
        {onSaveScore && (
          <div className="w-full mb-3">
            {!isSaved ? (
              <form onSubmit={handleSave} className="flex flex-col items-center">
                <label className="text-[11px] text-amber-400 mb-1 flex items-center gap-1 font-bold uppercase">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> TOP 30 명예의 전당 랭킹 등록
                </label>
                <div className="flex gap-2 w-full">
                  <input
                    type="text"
                    maxLength={4}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#020617] border-2 border-amber-500/70 rounded px-3 py-1 text-center text-amber-300 font-bold text-sm tracking-widest uppercase focus:outline-none focus:border-amber-400"
                    placeholder="ACE"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded active:scale-95 transition-all cursor-pointer uppercase shadow-[0_0_10px_rgba(245,158,11,0.4)]"
                  >
                    등록
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded p-1.5 text-center text-xs text-emerald-400 flex items-center justify-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 랭킹 등록 완료: [{playerName}]
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-emerald-400 mb-3 flex items-center gap-1.5 font-bold uppercase tracking-wider">
          <Award className="w-4 h-4" /> HIGHEST CITATION AWARDED // ACE OF ACES
        </div>

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
            onClick={onPlayAgain}
            className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <RotateCcw className="w-4 h-4" />
            RE-ENGAGE CAMPAIGN
          </button>
          <button
            onClick={onReturnTitle}
            className="w-full py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            RETURN TO COMMAND CENTER
          </button>
        </div>
      </motion.div>
    </div>
  );
};
