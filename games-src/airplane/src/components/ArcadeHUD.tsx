import React from 'react';
import { Player, Enemy, GameMode } from '../types';
import { Shield, Sparkles, Zap, AlertTriangle, Flame, RotateCcw } from 'lucide-react';
import { STAGES } from '../game/constants';

interface ArcadeHUDProps {
  player: Player;
  player2?: Player;
  gameMode?: GameMode;
  highScore: number;
  stageIndex: number;
  warningTimer: number;
  activeBoss?: Enemy;
  onPause: () => void;
}

export const ArcadeHUD: React.FC<ArcadeHUDProps> = ({
  player,
  player2,
  gameMode = '1P',
  highScore,
  stageIndex,
  warningTimer,
  activeBoss,
  onPause,
}) => {
  const currentStage = STAGES[stageIndex] || STAGES[0];
  const is2P = gameMode === '2P' && player2 !== undefined;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2 sm:p-3 select-none font-mono">
      {/* Top Header Stats */}
      <div className="w-full flex justify-between items-start text-xs text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] gap-2">
        {/* 1P Score */}
        <div className="flex flex-col items-start bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded border border-amber-500/40">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-black text-[10px] bg-amber-500/20 px-1 py-0.2 rounded">1P</span>
            <span className="text-white font-bold tracking-wider text-xs">
              {player.score.toLocaleString()}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
            <span>STAGE {stageIndex + 1}</span>
            <span className="text-amber-400 font-bold">
              {'★'.repeat(currentStage.dangerLevel)}
            </span>
          </div>
        </div>

        {/* Center: Record Hi-Score */}
        <div className="flex flex-col items-center bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded border border-slate-700/80">
          <div className="text-[9px] text-slate-400 tracking-wider">HI-SCORE</div>
          <div className="text-amber-400 font-bold text-xs">
            {Math.max(highScore, player.score, player2?.score || 0).toLocaleString()}
          </div>
        </div>

        {/* 2P Score or Pause button in 1P mode */}
        {is2P && player2 ? (
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded border border-cyan-500/40">
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-300 font-bold tracking-wider text-xs">
                  {player2.score.toLocaleString()}
                </span>
                <span className="text-cyan-400 font-black text-[10px] bg-cyan-500/20 px-1 py-0.2 rounded">2P</span>
              </div>
              <div className="text-[9px] text-slate-400">
                {player2.lives > 0 ? `${player2.lives} LIVES` : 'GAME OVER'}
              </div>
            </div>

            <button
              onClick={onPause}
              className="pointer-events-auto px-2 py-1 rounded bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-200 font-mono text-[9px] active:scale-95 transition-all cursor-pointer shadow"
            >
              PAUSE
            </button>
          </div>
        ) : (
          <button
            onClick={onPause}
            className="pointer-events-auto px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700 hover:bg-slate-700 text-slate-200 font-mono text-[10px] active:scale-95 transition-all cursor-pointer shadow"
          >
            PAUSE [ESC]
          </button>
        )}
      </div>

      {/* Boss Global Armor / HP Gauge at Top (Visible when Boss is present on screen) */}
      {activeBoss && (
        <div className="w-full max-w-md mx-auto mt-2 bg-slate-950/90 border border-amber-500/70 rounded p-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-xs flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              ★ BOSS: {activeBoss.bossName || 'FLAGSHIP DREADNOUGHT'}
            </span>
            <span className={activeBoss.hp / activeBoss.maxHp < 0.35 ? 'text-red-400 animate-pulse font-bold' : 'text-amber-300'}>
              {Math.max(0, Math.round(activeBoss.hp)).toLocaleString()} / {activeBoss.maxHp.toLocaleString()} HP ({Math.round(Math.max(0, activeBoss.hp) / activeBoss.maxHp * 100)}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 rounded-xs overflow-hidden border border-slate-700 relative">
            <div
              className={`h-full transition-all duration-75 ${
                activeBoss.hp / activeBoss.maxHp < 0.35
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 animate-pulse'
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, (activeBoss.hp / activeBoss.maxHp) * 100))}%` }}
            />
          </div>
        </div>
      )}

      {/* Boss Warning Emergency Alert Banner */}
      {warningTimer > 0 && (
        <div className="my-auto w-full py-2.5 bg-red-950/90 border-y-2 border-red-500 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(220,38,38,0.7)] animate-warning-flash">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-widest animate-bounce">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>CRITICAL ALERT // BOSS ENGAGEMENT</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-white text-xs sm:text-sm font-bold tracking-wider mt-0.5">
            HEAVY HOSTILE CAPITAL CRAFT DETECTED!
          </div>
          {activeBoss?.bossName && (
            <div className="text-amber-300 text-xs tracking-widest mt-0.5 uppercase font-mono">
              TARGET DESIGNATION: {activeBoss.bossName}
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls & Equipment HUD */}
      <div className="w-full flex justify-between items-end text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] gap-2">
        {/* 1P Equipment Panel */}
        <div className="flex flex-col gap-1 items-start bg-slate-900/90 backdrop-blur-xs p-2 rounded border border-amber-500/40">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[9px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-black">1P</span>
            <span className="text-[9px] text-slate-300 font-bold">
              {player.lives > 0 ? (
                <span>
                  {Array.from({ length: Math.max(0, player.lives) }).map((_, idx) => (
                    <span key={`p1-life-${idx}`} className="text-amber-400 text-xs mr-0.5">✈</span>
                  ))}
                </span>
              ) : (
                <span className="text-red-400">DOWN</span>
              )}
            </span>
          </div>

          {/* 1P Power Level & Stocks */}
          <div className="flex items-center gap-2 text-[9px]">
            <div className="flex items-center gap-0.5">
              <span className="text-amber-400 font-bold">PWR:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={`p1-pwr-${lvl}`}
                    className={`w-2.5 h-2 rounded-xs ${
                      player.powerLevel >= lvl ? 'bg-amber-400' : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-red-400 font-bold">B[X]:</span>
              <span className="text-white font-bold">{player.bombs}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-emerald-400 font-bold">L[C]:</span>
              <span className="text-white font-bold">{player.loopsRemaining}</span>
            </div>
          </div>
        </div>

        {/* 2P Equipment Panel (If 2P Mode) */}
        {is2P && player2 ? (
          <div className="flex flex-col gap-1 items-end bg-slate-900/90 backdrop-blur-xs p-2 rounded border border-cyan-500/40">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] text-slate-300 font-bold">
                {player2.lives > 0 ? (
                  <span>
                    {Array.from({ length: Math.max(0, player2.lives) }).map((_, idx) => (
                      <span key={`p2-life-${idx}`} className="text-cyan-400 text-xs mr-0.5">✈</span>
                    ))}
                  </span>
                ) : (
                  <span className="text-red-400">DOWN</span>
                )}
              </span>
              <span className="text-[9px] bg-cyan-500 text-slate-950 px-1 py-0.2 rounded font-black">2P</span>
            </div>

            {/* 2P Power Level & Stocks */}
            <div className="flex items-center gap-2 text-[9px]">
              <div className="flex items-center gap-1">
                <span className="text-emerald-400 font-bold">L[M/3]:</span>
                <span className="text-white font-bold">{player2.loopsRemaining}</span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-red-400 font-bold">B[N/2]:</span>
                <span className="text-white font-bold">{player2.bombs}</span>
              </div>

              <div className="flex items-center gap-0.5">
                <span className="text-cyan-400 font-bold">PWR:</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={`p2-pwr-${lvl}`}
                      className={`w-2.5 h-2 rounded-xs ${
                        player2.powerLevel >= lvl ? 'bg-cyan-400' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Single Player Right Stocks Display */
          <div className="flex flex-col gap-1 items-end bg-slate-900/80 backdrop-blur-xs p-2 rounded border border-slate-700/80">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-red-400 mr-1 font-bold">BOMB [X]:</span>
              {Array.from({ length: Math.max(0, player.bombs) }).map((_, idx) => (
                <span
                  key={`bomb-${idx}`}
                  className="w-3.5 h-3.5 bg-red-600 rounded-xs text-white font-mono text-[9px] font-bold flex items-center justify-center border border-red-400 shadow-[0_0_5px_rgba(239,68,68,0.7)]"
                >
                  B
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1 text-[9px]">
              <span className="text-emerald-400 font-bold">LOOP [C]:</span>
              {Array.from({ length: Math.max(0, player.loopsRemaining) }).map((_, idx) => (
                <span
                  key={`loop-${idx}`}
                  className="w-3.5 h-3.5 bg-emerald-500 rounded-full text-slate-950 font-mono text-[8px] font-bold flex items-center justify-center shadow-[0_0_5px_rgba(16,185,129,0.7)]"
                >
                  ↻
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

