import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Flame, Gamepad2 } from 'lucide-react';
import { GameMode } from '../types';

interface ControlsOverlayProps {
  mode: GameMode;
  onButtonDown: (player: 1 | 2, action: 'left' | 'right' | 'jump' | 'shoot') => void;
  onButtonUp: (player: 1 | 2, action: 'left' | 'right' | 'jump' | 'shoot') => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ mode, onButtonDown, onButtonUp }) => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-3 p-2 select-none">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* P1 Controls Bento Card */}
        <div className="bento-card p-3 flex items-center justify-between border-emerald-500/40 bg-slate-900/90">
          <div className="flex flex-col">
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 glow-green">
              <Gamepad2 className="w-4 h-4 text-emerald-400" /> P1 (BUB) CONTROLS
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">KEYBOARD: A / D OR ← / → (JUMP: W/↑, SHOOT: SPACE)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* D-Pad Left/Right */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onMouseDown={() => onButtonDown(1, 'left')}
                onMouseUp={() => onButtonUp(1, 'left')}
                onMouseLeave={() => onButtonUp(1, 'left')}
                onTouchStart={() => onButtonDown(1, 'left')}
                onTouchEnd={() => onButtonUp(1, 'left')}
                onTouchCancel={() => onButtonUp(1, 'left')}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg flex items-center justify-center text-white active:scale-95 transition shadow-sm"
                title="P1 Left (A / Left Arrow)"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <button
                onMouseDown={() => onButtonDown(1, 'right')}
                onMouseUp={() => onButtonUp(1, 'right')}
                onMouseLeave={() => onButtonUp(1, 'right')}
                onTouchStart={() => onButtonDown(1, 'right')}
                onTouchEnd={() => onButtonUp(1, 'right')}
                onTouchCancel={() => onButtonUp(1, 'right')}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-lg flex items-center justify-center text-white active:scale-95 transition shadow-sm"
                title="P1 Right (D / Right Arrow)"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Jump & Shoot */}
            <div className="flex items-center gap-1">
              <button
                onMouseDown={() => onButtonDown(1, 'jump')}
                onMouseUp={() => onButtonUp(1, 'jump')}
                onMouseLeave={() => onButtonUp(1, 'jump')}
                onTouchStart={() => onButtonDown(1, 'jump')}
                onTouchEnd={() => onButtonUp(1, 'jump')}
                onTouchCancel={() => onButtonUp(1, 'jump')}
                className="w-10 h-10 bg-amber-600 hover:bg-amber-500 active:bg-amber-400 rounded-lg text-white font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition border border-amber-300/80 shadow-sm"
                title="P1 Jump (W / Up Arrow)"
              >
                <ArrowUp className="w-4 h-4" />
                <span className="text-[8px]">JUMP</span>
              </button>

              <button
                onMouseDown={() => onButtonDown(1, 'shoot')}
                onMouseUp={() => onButtonUp(1, 'shoot')}
                onMouseLeave={() => onButtonUp(1, 'shoot')}
                onTouchStart={() => onButtonDown(1, 'shoot')}
                onTouchEnd={() => onButtonUp(1, 'shoot')}
                onTouchCancel={() => onButtonUp(1, 'shoot')}
                className="w-12 h-10 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 rounded-lg text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 transition border border-yellow-300 shadow-md shadow-emerald-500/40"
                title="P1 Shoot Bubble (SPACE / F)"
              >
                <Flame className="w-4 h-4 text-yellow-300" />
                <span className="text-[8px]">SHOOT</span>
              </button>
            </div>
          </div>
        </div>

        {/* P2 Controls Bento Card (if 2P mode) */}
        {mode === '2P' ? (
          <div className="bento-card p-3 flex items-center justify-between border-cyan-500/40 bg-slate-900/90">
            <div className="flex flex-col">
              <span className="text-cyan-400 font-bold text-xs flex items-center gap-1.5 glow-cyan">
                <Gamepad2 className="w-4 h-4 text-cyan-400" /> P2 (BOB) CONTROLS
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">KEYBOARD: ARROWS / SLASH</span>
            </div>

            <div className="flex items-center gap-2">
              {/* D-Pad Left/Right */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  onMouseDown={() => onButtonDown(2, 'left')}
                  onMouseUp={() => onButtonUp(2, 'left')}
                  onMouseLeave={() => onButtonUp(2, 'left')}
                  onTouchStart={() => onButtonDown(2, 'left')}
                  onTouchEnd={() => onButtonUp(2, 'left')}
                  onTouchCancel={() => onButtonUp(2, 'left')}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-lg flex items-center justify-center text-white active:scale-95 transition shadow-sm"
                  title="P2 Left (Left Arrow)"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                  onMouseDown={() => onButtonDown(2, 'right')}
                  onMouseUp={() => onButtonUp(2, 'right')}
                  onMouseLeave={() => onButtonUp(2, 'right')}
                  onTouchStart={() => onButtonDown(2, 'right')}
                  onTouchEnd={() => onButtonUp(2, 'right')}
                  onTouchCancel={() => onButtonUp(2, 'right')}
                  className="w-10 h-10 bg-slate-800 hover:bg-slate-700 active:bg-cyan-600 rounded-lg flex items-center justify-center text-white active:scale-95 transition shadow-sm"
                  title="P2 Right (Right Arrow)"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Jump & Shoot */}
              <div className="flex items-center gap-1">
                <button
                  onMouseDown={() => onButtonDown(2, 'jump')}
                  onMouseUp={() => onButtonUp(2, 'jump')}
                  onMouseLeave={() => onButtonUp(2, 'jump')}
                  onTouchStart={() => onButtonDown(2, 'jump')}
                  onTouchEnd={() => onButtonUp(2, 'jump')}
                  onTouchCancel={() => onButtonUp(2, 'jump')}
                  className="w-10 h-10 bg-amber-600 hover:bg-amber-500 active:bg-amber-400 rounded-lg text-white font-bold text-xs flex flex-col items-center justify-center active:scale-95 transition border border-amber-300/80 shadow-sm"
                  title="P2 Jump (Up Arrow)"
                >
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-[8px]">JUMP</span>
                </button>

                <button
                  onMouseDown={() => onButtonDown(2, 'shoot')}
                  onMouseUp={() => onButtonUp(2, 'shoot')}
                  onMouseLeave={() => onButtonUp(2, 'shoot')}
                  onTouchStart={() => onButtonDown(2, 'shoot')}
                  onTouchEnd={() => onButtonUp(2, 'shoot')}
                  onTouchCancel={() => onButtonUp(2, 'shoot')}
                  className="w-12 h-10 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-400 rounded-lg text-white font-black text-xs flex flex-col items-center justify-center active:scale-95 transition border border-yellow-300 shadow-md shadow-cyan-500/40"
                  title="P2 Shoot Bubble (/)"
                >
                  <Flame className="w-4 h-4 text-yellow-300" />
                  <span className="text-[8px]">SHOOT</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex bento-card p-3 items-center justify-center text-xs text-slate-500 italic">
            💡 2P CO-OP MODE IS AVAILABLE FROM TITLE SCREEN
          </div>
        )}
      </div>
    </div>
  );
};
