import React from 'react';
import { motion } from 'motion/react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Monitor, Zap, HelpCircle } from 'lucide-react';
import { GameSettings } from '../types';
import { retroAudio } from '../audio/retroAudio';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onResume,
  onRestart,
  onReturnTitle,
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-[#020617]/90 backdrop-blur-md select-none font-mono text-slate-200">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col items-center shadow-[0_0_40px_rgba(0,0,0,0.85)]"
      >
        {/* Title */}
        <h1 className="text-xl font-bold text-amber-400 tracking-wider mb-0.5">
          TACTICAL HOLD (PAUSED)
        </h1>
        <div className="text-[10px] text-slate-400 mb-4 uppercase tracking-widest">MISSION IN FLIGHT SUSPENSION</div>

        {/* Settings Control Box */}
        <div className="w-full bg-[#020617] rounded p-3.5 border border-slate-800 space-y-3 mb-4 text-xs font-mono">
          {/* Sound FX Volume */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
              <span className="flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-amber-400" /> SFX VOLUME</span>
              <span className="text-amber-400 font-bold">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ soundVolume: val });
                retroAudio.setSoundVolume(val);
              }}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-sky-400" /> BGM VOLUME</span>
              <span className="text-sky-400 font-bold">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdateSettings({ musicVolume: val });
                retroAudio.setMusicVolume(val);
              }}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          {/* CRT Scanline Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Monitor className="w-3.5 h-3.5 text-emerald-400" /> CRT SCANLINES
            </span>
            <button
              onClick={() => onUpdateSettings({ scanlines: !settings.scanlines })}
              className={`px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer transition-colors ${
                settings.scanlines ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.scanlines ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* Auto-Fire Toggle */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> AUTO-FIRE MODE
            </span>
            <button
              onClick={() => onUpdateSettings({ autoFire: !settings.autoFire })}
              className={`px-2 py-0.5 rounded font-bold text-[10px] cursor-pointer transition-colors ${
                settings.autoFire ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.autoFire ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* Difficulty Preset Selector */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex justify-between text-slate-300 mb-1.5 text-[11px]">
              <span className="font-bold uppercase tracking-wider">DIFFICULTY LEVEL</span>
              <span className="text-amber-400 font-bold">{settings.difficulty}</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['EASY', 'NORMAL', 'HARD', 'INSANE'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => {
                    retroAudio.playShoot(1);
                    onUpdateSettings({ difficulty: diff });
                  }}
                  className={`py-1 rounded text-[9px] font-bold font-mono text-center cursor-pointer transition-all border ${
                    settings.difficulty === diff
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            onClick={onResume}
            className="w-full py-2.5 px-4 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            RESUME OPERATION
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            RESTART MISSION
          </button>

          <button
            onClick={onReturnTitle}
            className="w-full py-2 px-4 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            ABORT TO BRIEFING SCREEN
          </button>
        </div>
      </motion.div>
    </div>
  );
};
