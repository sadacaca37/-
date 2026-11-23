import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { GameStats } from '../types';
import { retroAudio } from '../audio/retroAudio';

interface StageClearModalProps {
  stats: GameStats;
  stageNumber: number;
  bombsRemaining: number;
  onNextStage: () => void;
}

export const StageClearModal: React.FC<StageClearModalProps> = ({
  stats,
  stageNumber,
  bombsRemaining,
  onNextStage,
}) => {
  const [tallyStep, setTallyStep] = useState(0);

  const stageClearBonus = stageNumber * 10000;
  const bombBonus = bombsRemaining * 3000;
  const medalBonus = stats.medalsCollected * 500;
  const totalBonus = stageClearBonus + bombBonus + medalBonus;

  // Calculate Rank S, A, B, C
  const rank = totalBonus > 35000 ? 'S' : totalBonus > 20000 ? 'A' : totalBonus > 10000 ? 'B' : 'C';
  const rankColor = rank === 'S' ? 'text-amber-400' : rank === 'A' ? 'text-emerald-400' : rank === 'B' ? 'text-sky-400' : 'text-slate-400';

  useEffect(() => {
    const timer = setTimeout(() => {
      setTallyStep(1);
      retroAudio.playMedal(1);
    }, 400);

    const timer2 = setTimeout(() => {
      setTallyStep(2);
      retroAudio.playMedal(3);
    }, 800);

    const timer3 = setTimeout(() => {
      setTallyStep(3);
      retroAudio.playPowerUp();
    }, 1200);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-[#020617]/95 backdrop-blur-md select-none font-mono text-slate-200">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-[#0f172a] border border-amber-500/60 rounded-lg p-5 flex flex-col items-center shadow-[0_0_35px_rgba(245,158,11,0.25)]"
      >
        {/* Title */}
        <div className="text-[11px] text-amber-400 tracking-widest uppercase mb-0.5 font-bold">
          ★ SECTOR {stageNumber} AIRSPACE SECURED ★
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wider mb-3">
          STAGE DEBRIEFING
        </h1>

        {/* Rank Badge */}
        <div className="flex items-center justify-center mb-3">
          <div className="w-14 h-14 rounded bg-[#020617] border border-amber-500/50 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="text-[8px] text-slate-400 uppercase font-bold">EVALUATION</span>
            <span className={`text-2xl font-bold ${rankColor}`}>{rank}</span>
          </div>
        </div>

        {/* Score Tally Board */}
        <div className="w-full bg-[#020617] rounded p-3.5 border border-slate-800 space-y-1.5 text-xs font-mono mb-4">
          <div className="flex justify-between text-slate-400">
            <span>SECTOR CLEAR BONUS:</span>
            <span className="text-amber-400 font-bold">
              +{stageClearBonus.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>ORDNANCE RESERVE ({bombsRemaining}x):</span>
            <span className="text-sky-400 font-bold">
              +{bombBonus.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>MEDAL RECOVERY ({stats.medalsCollected}x):</span>
            <span className="text-amber-300 font-bold">
              +{medalBonus.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
            <span className="font-bold text-white">TOTAL MERIT BONUS:</span>
            <span className="text-amber-400 text-sm font-bold">
              +{totalBonus.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Reward Grant Notice */}
        <div className="text-[11px] text-emerald-400 mb-4 flex items-center gap-1.5 font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5" /> REARMAMENT: +1 SUPER BOMB & +1 EVASION RESTOCKED
        </div>

        {/* Next Mission Button */}
        <button
          onClick={() => {
            retroAudio.playShoot(2);
            onNextStage();
          }}
          className="w-full py-2.5 px-6 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          SCRAMBLE TO NEXT THEATER
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </motion.div>
    </div>
  );
};
