import React from 'react';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types';

interface RetroHUDProps {
  score: number;
  p2Score?: number;
  topScore: number;
  lives: number;
  p2Lives?: number;
  timeLeft: number;
  maxTime: number;
  stageName: string;
  stageSubtitle: string;
  creditCount: number;
  numPlayers?: 1 | 2;
  difficulty?: DifficultyLevel;
}

export const RetroHUD: React.FC<RetroHUDProps> = ({
  score,
  p2Score = 0,
  topScore,
  lives,
  p2Lives = 5,
  timeLeft,
  maxTime,
  stageName,
  stageSubtitle,
  creditCount,
  numPlayers = 1,
  difficulty = 'NORMAL',
}) => {
  const timePercent = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const diffConfig = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.NORMAL;

  return (
    <div className="w-full max-w-[560px] bg-black text-white font-mono p-2 select-none border-b-2 border-cyan-500/30">
      {/* Top Row: Score & High Score */}
      <div className="flex justify-between items-center text-xs sm:text-sm tracking-wider font-bold mb-1">
        {/* 1P Score Box */}
        <div className="p-1 rounded bg-red-950/80 border border-red-500">
          <span className="text-red-400 font-extrabold">1UP</span>
          <div className="text-white text-base mt-0.5">{score.toString().padStart(6, '0')}</div>
        </div>

        {/* High Score Box with Difficulty Indicator */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-yellow-400 font-bold">TOP</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-extrabold ${diffConfig.badgeBg}`} title={`난이도: ${diffConfig.koreanLabel} (${diffConfig.description})`}>
              {diffConfig.label}
            </span>
          </div>
          <div className="text-white text-base mt-0.5">{topScore.toString().padStart(6, '0')}</div>
        </div>

        {/* 2P Score Box or Stage Info */}
        {numPlayers === 2 ? (
          <div className="p-1 rounded text-right bg-blue-950/80 border border-cyan-400">
            <span className="text-cyan-400 font-extrabold">2UP</span>
            <div className="text-white text-base mt-0.5">{p2Score.toString().padStart(6, '0')}</div>
          </div>
        ) : (
          <div className="text-right text-pink-400">
            <span>{stageName}</span>
            <div className="text-yellow-300 text-xs sm:text-sm mt-0.5">{stageSubtitle}</div>
          </div>
        )}
      </div>

      {/* Time Gauge Bar */}
      <div className="w-full my-1 flex items-center gap-2">
        <span className="text-[11px] text-cyan-300 font-bold tracking-widest min-w-[36px]">TIME</span>
        <div className="flex-1 h-3.5 bg-gray-900 border border-cyan-400 p-0.5 rounded-none relative overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              timePercent < 25 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
        <span className="text-xs text-white font-mono w-6 text-right font-bold">{Math.ceil(timeLeft)}</span>
      </div>

      {/* Bottom Bar: Lives & Stage Info & Credit */}
      <div className="flex justify-between items-center text-xs mt-1 px-1">
        {/* 1P Lives */}
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-extrabold text-red-400">
            {numPlayers === 2 ? '1P:' : 'REST:'}
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: Math.max(0, lives) }).map((_, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-sm border border-black bg-red-600 relative flex items-center justify-center shadow-sm"
                title="1P Life"
              >
                <div className="w-2 h-2 bg-white rounded-full relative">
                  <div className="absolute top-0.5 left-0.5 w-1 h-0.5 bg-black rounded-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Name Banner */}
        <span className="text-yellow-300 font-bold text-xs">
          {stageName}
        </span>

        {/* 2P Lives or Credit */}
        {numPlayers === 2 ? (
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-extrabold text-cyan-400">2P:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: Math.max(0, p2Lives) }).map((_, i) => (
                <div
                  key={i}
                  className="w-3.5 h-3.5 rounded-sm border border-black bg-blue-600 relative flex items-center justify-center shadow-sm"
                  title="2P Life"
                >
                  <div className="w-2 h-2 bg-white rounded-full relative">
                    <div className="absolute top-0.5 left-0.5 w-1 h-0.5 bg-black rounded-xs" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-red-500 font-bold tracking-widest text-xs">
            CREDIT <span className="text-yellow-300">{creditCount.toString().padStart(2, '0')}</span>
          </div>
        )}
      </div>
    </div>
  );
};
