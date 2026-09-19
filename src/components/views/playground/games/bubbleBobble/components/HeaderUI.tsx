import React from 'react';
import { Volume2, VolumeX, Pause, Play, Tv, RefreshCw } from 'lucide-react';
import { Player } from '../types';

interface HeaderUIProps {
  players: Player[];
  highScore: number;
  currentStage: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  crtEffect: boolean;
  onToggleCrt: () => void;
  onRestart: () => void;
}

export const HeaderUI: React.FC<HeaderUIProps> = ({
  players,
  highScore,
  currentStage,
  isMuted,
  onToggleMute,
  isPaused,
  onTogglePause,
  crtEffect,
  onToggleCrt,
  onRestart,
}) => {
  const p1 = players.find((p) => p.id === 1);
  const p2 = players.find((p) => p.id === 2);

  return (
    <header className="w-full max-w-6xl mx-auto p-2 sm:p-3 select-none">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-3 items-center">
        {/* Bento Cell 1: 1UP & 2UP Player HUD */}
        <div className="md:col-span-5 bento-card p-3 flex items-center justify-between gap-3">
          {/* 1UP Score & Lives */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-emerald-400 font-bold text-xs tracking-wider flex items-center gap-1.5 glow-green">
                <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-sm animate-pulse"></span>
                1UP
              </span>
              <span className="text-yellow-300 font-black text-base sm:text-lg tracking-widest font-mono">
                {p1 ? String(p1.score).padStart(6, '0') : '000000'}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] text-emerald-400 font-bold">LIVES:</span>
                {p1 &&
                  Array.from({ length: Math.max(0, p1.lives) }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block w-3 h-3 bg-emerald-500 rounded-full border border-emerald-200 shadow-sm"
                      title="Player 1 Life"
                    />
                  ))}
              </div>
              {/* P1 Active Power-Up Buffs */}
              {p1 && ((p1.powerupRapidTimer && p1.powerupRapidTimer > 0) || (p1.powerupRangeTimer && p1.powerupRangeTimer > 0)) && (
                <div className="flex items-center gap-1 mt-1">
                  {p1.powerupRapidTimer && p1.powerupRapidTimer > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-pink-900/80 border border-pink-500 text-pink-300 font-bold rounded animate-pulse">
                      ⚡RAPID {Math.ceil(p1.powerupRapidTimer / 60)}s
                    </span>
                  )}
                  {p1.powerupRangeTimer && p1.powerupRangeTimer > 0 && (
                    <span className="text-[9px] px-1.5 py-0.2 bg-sky-900/80 border border-sky-400 text-sky-200 font-bold rounded animate-pulse">
                      🎯RANGE {Math.ceil(p1.powerupRangeTimer / 60)}s
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2UP Score & Lives (if 2P active) */}
          {p2 ? (
            <div className="flex items-center gap-3 border-l border-slate-700/80 pl-3">
              <div className="flex flex-col">
                <span className="text-cyan-400 font-bold text-xs tracking-wider flex items-center gap-1.5 glow-cyan">
                  <span className="inline-block w-2.5 h-2.5 bg-cyan-400 rounded-sm animate-pulse"></span>
                  2UP
                </span>
                <span className="text-yellow-300 font-black text-base sm:text-lg tracking-widest font-mono">
                  {String(p2.score).padStart(6, '0')}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] text-cyan-400 font-bold">LIVES:</span>
                  {Array.from({ length: Math.max(0, p2.lives) }).map((_, i) => (
                    <span
                      key={i}
                      className="inline-block w-3 h-3 bg-cyan-400 rounded-full border border-cyan-100 shadow-sm"
                      title="Player 2 Life"
                    />
                  ))}
                </div>
                {/* P2 Active Power-Up Buffs */}
                {((p2.powerupRapidTimer && p2.powerupRapidTimer > 0) || (p2.powerupRangeTimer && p2.powerupRangeTimer > 0)) && (
                  <div className="flex items-center gap-1 mt-1">
                    {p2.powerupRapidTimer && p2.powerupRapidTimer > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-pink-900/80 border border-pink-500 text-pink-300 font-bold rounded animate-pulse">
                        ⚡RAPID {Math.ceil(p2.powerupRapidTimer / 60)}s
                      </span>
                    )}
                    {p2.powerupRangeTimer && p2.powerupRangeTimer > 0 && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-sky-900/80 border border-sky-400 text-sky-200 font-bold rounded animate-pulse">
                        🎯RANGE {Math.ceil(p2.powerupRangeTimer / 60)}s
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center text-xs text-slate-500 font-mono italic">
              PRESS 2P FOR CO-OP
            </div>
          )}
        </div>

        {/* Bento Cell 2: High Score & Round Indicator */}
        <div className="md:col-span-4 bento-card p-2.5 sm:p-3 flex items-center justify-center gap-3 bg-gradient-to-b from-slate-900/90 to-slate-950/90">
          <img
            src="/src/assets/images/bubble_bobble_logo_1785682921790.jpg"
            alt="Bub Logo"
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-lg border border-yellow-400 shadow-md object-cover hidden sm:block"
          />
          <div className="flex flex-col items-center">
            <span className="text-pink-400 font-bold text-[10px] tracking-widest uppercase glow-pink">
              HIGH SCORE
            </span>
            <span className="text-white font-black text-lg sm:text-xl tracking-widest font-mono">
              {String(highScore).padStart(6, '0')}
            </span>
            <div className="bg-pink-950/80 border border-pink-500/60 px-3 py-0.5 rounded-full text-[11px] text-pink-300 font-bold mt-0.5 shadow-sm">
              STAGE {currentStage} / 10
            </div>
          </div>
        </div>

        {/* Bento Cell 3: Action & Utility Buttons */}
        <div className="md:col-span-3 bento-card p-3 flex items-center justify-center gap-2">
          <button
            onClick={onToggleCrt}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
              crtEffect
                ? 'bg-pink-600/90 border-pink-400 text-white shadow-md shadow-pink-500/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="CRT Scanline Overlay"
          >
            <Tv className="w-4 h-4" />
            <span className="text-xs">CRT</span>
          </button>

          <button
            onClick={onToggleMute}
            className={`p-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition ${
              isMuted
                ? 'bg-red-900/80 border-red-500 text-red-200'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-xs">{isMuted ? 'OFF' : '8BIT'}</span>
          </button>

          <button
            onClick={onTogglePause}
            className="p-2 rounded-lg bg-amber-600/90 border border-amber-400 text-amber-100 hover:bg-amber-500 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="text-xs">{isPaused ? 'PLAY' : 'PAUSE'}</span>
          </button>

          <button
            onClick={onRestart}
            className="p-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-xs font-bold transition"
            title="Restart Game"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
