// Responsive On-Screen Touch Controls for Mobile & Tablet Play

import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Flame, Zap } from 'lucide-react';
import { KeyControls } from '../types';

interface TouchControlsProps {
  setKeys: React.Dispatch<React.SetStateAction<KeyControls>>;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ setKeys }) => {
  const handleTouch = (key: keyof KeyControls, state: boolean) => {
    setKeys((prev) => ({ ...prev, [key]: state }));
  };

  return (
    <div
      id="mobile-touch-controls"
      className="md:hidden flex items-center justify-between w-full max-w-xl mx-auto px-4 py-3 mt-2 select-none"
    >
      {/* D-Pad - Sleek Circular Console Hub */}
      <div className="relative w-36 h-36 flex items-center justify-center bg-white/95 rounded-full border-2 border-gray-200 shadow-md p-1">
        {/* Up */}
        <button
          id="btn-touch-up"
          type="button"
          onTouchStart={() => handleTouch('p1Up', true)}
          onTouchEnd={() => handleTouch('p1Up', false)}
          onMouseDown={() => handleTouch('p1Up', true)}
          onMouseUp={() => handleTouch('p1Up', false)}
          className="absolute top-1.5 left-1/2 -translate-x-1/2 w-11 h-11 bg-gray-50 active:bg-gray-200 rounded-xl flex items-center justify-center text-gray-800 border-2 border-gray-200 border-b-4 border-b-gray-300 shadow-sm"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Left */}
        <button
          id="btn-touch-left"
          type="button"
          onTouchStart={() => handleTouch('p1Left', true)}
          onTouchEnd={() => handleTouch('p1Left', false)}
          onMouseDown={() => handleTouch('p1Left', true)}
          onMouseUp={() => handleTouch('p1Left', false)}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-gray-50 active:bg-gray-200 rounded-xl flex items-center justify-center text-gray-800 border-2 border-gray-200 border-b-4 border-b-gray-300 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Center Pivot */}
        <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300" />

        {/* Right */}
        <button
          id="btn-touch-right"
          type="button"
          onTouchStart={() => handleTouch('p1Right', true)}
          onTouchEnd={() => handleTouch('p1Right', false)}
          onMouseDown={() => handleTouch('p1Right', true)}
          onMouseUp={() => handleTouch('p1Right', false)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-gray-50 active:bg-gray-200 rounded-xl flex items-center justify-center text-gray-800 border-2 border-gray-200 border-b-4 border-b-gray-300 shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Down */}
        <button
          id="btn-touch-down"
          type="button"
          onTouchStart={() => handleTouch('p1Down', true)}
          onTouchEnd={() => handleTouch('p1Down', false)}
          onMouseDown={() => handleTouch('p1Down', true)}
          onMouseUp={() => handleTouch('p1Down', false)}
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-11 h-11 bg-gray-50 active:bg-gray-200 rounded-xl flex items-center justify-center text-gray-800 border-2 border-gray-200 border-b-4 border-b-gray-300 shadow-sm"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>

      {/* Action Buttons (Attack / Jump) */}
      <div className="flex items-center gap-4">
        {/* Attack / Special / Shoot */}
        <div className="flex flex-col items-center">
          <button
            id="btn-touch-attack"
            type="button"
            onTouchStart={() => handleTouch('p1Attack', true)}
            onTouchEnd={() => handleTouch('p1Attack', false)}
            onMouseDown={() => handleTouch('p1Attack', true)}
            onMouseUp={() => handleTouch('p1Attack', false)}
            className="w-16 h-16 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-2xl border-2 border-amber-300 text-white font-black flex flex-col items-center justify-center shadow-[0_5px_0_0_#b45309] active:translate-y-1 active:shadow-[0_1px_0_0_#b45309] transition-all"
          >
            <Flame className="w-6 h-6 fill-white" />
            <span className="text-[10px] uppercase tracking-wider font-mono">B/공격</span>
          </button>
        </div>

        {/* Jump Button */}
        <div className="flex flex-col items-center">
          <button
            id="btn-touch-jump"
            type="button"
            onTouchStart={() => handleTouch('p1Jump', true)}
            onTouchEnd={() => handleTouch('p1Jump', false)}
            onMouseDown={() => handleTouch('p1Jump', true)}
            onMouseUp={() => handleTouch('p1Jump', false)}
            className="w-16 h-16 bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-2xl border-2 border-red-400 text-white font-black flex flex-col items-center justify-center shadow-[0_5px_0_0_#991b1b] active:translate-y-1 active:shadow-[0_1px_0_0_#991b1b] transition-all"
          >
            <Zap className="w-6 h-6 fill-white" />
            <span className="text-[10px] uppercase tracking-wider font-mono">A/점프</span>
          </button>
        </div>
      </div>
    </div>
  );
};
