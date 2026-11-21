import React, { useRef, useState, useEffect } from 'react';
import { Sparkles, Zap, RotateCcw, Crosshair } from 'lucide-react';

interface MobileControlsProps {
  onDirectionChange: (dx: number, dy: number) => void;
  onFirePress: (isDown: boolean) => void;
  onBombPress: () => void;
  onLoopPress: () => void;
  bombsCount: number;
  loopsCount: number;
  autoFire: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onFirePress,
  onBombPress,
  onLoopPress,
  bombsCount,
  loopsCount,
  autoFire,
}) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!joystickRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.hypot(dx, dy);
    const maxRadius = rect.width / 2 - 10;

    if (distance > 0) {
      const clampedDist = Math.min(distance, maxRadius);
      const angle = Math.atan2(dy, dx);
      const stickX = Math.cos(angle) * clampedDist;
      const stickY = Math.sin(angle) * clampedDist;
      setStickPos({ x: stickX, y: stickY });
      onDirectionChange(stickX / maxRadius, stickY / maxRadius);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setStickPos({ x: 0, y: 0 });
    onDirectionChange(0, 0);
  };

  return (
    <div className="w-full flex justify-between items-center px-4 py-2 pointer-events-auto select-none sm:hidden font-mono">
      {/* Virtual Joystick (Left) */}
      <div
        ref={joystickRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-24 h-24 rounded-full bg-[#020617]/90 border border-slate-700 flex items-center justify-center shadow-lg active:border-amber-500/80 touch-none"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="w-8 h-8 border border-dashed border-slate-500 rounded-full" />
        </div>
        {/* Joystick Thumb knob */}
        <div
          className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 shadow-md flex items-center justify-center transition-transform"
          style={{
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
          }}
        >
          <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-xs" />
        </div>
      </div>

      {/* Action Buttons (Right) */}
      <div className="flex items-center gap-2.5">
        {/* Loop / Evasion Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onLoopPress();
          }}
          disabled={loopsCount <= 0}
          className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center text-[8px] font-bold active:scale-95 transition-all cursor-pointer ${
            loopsCount > 0
              ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>LOOP</span>
        </button>

        {/* Super Bomb Button */}
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onBombPress();
          }}
          disabled={bombsCount <= 0}
          className={`w-12 h-12 rounded-full border flex flex-col items-center justify-center text-[9px] font-bold active:scale-95 transition-all cursor-pointer ${
            bombsCount > 0
              ? 'bg-red-600 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>BOMB</span>
        </button>

        {/* Primary Fire Button (If not autofire) */}
        {!autoFire && (
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              onFirePress(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              onFirePress(false);
            }}
            className="w-14 h-14 rounded-full bg-amber-500 border border-amber-300 text-slate-950 text-[10px] font-bold flex flex-col items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 transition-all cursor-pointer uppercase"
          >
            <Crosshair className="w-4 h-4" />
            <span>FIRE</span>
          </button>
        )}
      </div>
    </div>
  );
};
