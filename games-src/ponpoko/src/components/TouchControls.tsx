import React from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Space } from 'lucide-react';

interface TouchControlsProps {
  onDirectionPress: (dir: 'left' | 'right' | 'up' | 'down' | null) => void;
  onJumpPress: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onDirectionPress,
  onJumpPress,
}) => {
  return (
    <div className="w-full max-w-[560px] bg-gray-950/90 p-3 border-t-2 border-cyan-500/40 flex justify-between items-center select-none touch-none rounded-b-lg">
      {/* On-Screen D-Pad */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Up Button */}
        <button
          onTouchStart={() => onDirectionPress('up')}
          onTouchEnd={() => onDirectionPress(null)}
          onMouseDown={() => onDirectionPress('up')}
          onMouseUp={() => onDirectionPress(null)}
          className="absolute top-0 w-10 h-10 bg-gray-800 border-2 border-cyan-400 active:bg-cyan-600 rounded flex items-center justify-center text-white cursor-pointer shadow-md"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Down Button */}
        <button
          onTouchStart={() => onDirectionPress('down')}
          onTouchEnd={() => onDirectionPress(null)}
          onMouseDown={() => onDirectionPress('down')}
          onMouseUp={() => onDirectionPress(null)}
          className="absolute bottom-0 w-10 h-10 bg-gray-800 border-2 border-cyan-400 active:bg-cyan-600 rounded flex items-center justify-center text-white cursor-pointer shadow-md"
        >
          <ArrowDown className="w-5 h-5" />
        </button>

        {/* Left Button */}
        <button
          onTouchStart={() => onDirectionPress('left')}
          onTouchEnd={() => onDirectionPress(null)}
          onMouseDown={() => onDirectionPress('left')}
          onMouseUp={() => onDirectionPress(null)}
          className="absolute left-0 w-10 h-10 bg-gray-800 border-2 border-cyan-400 active:bg-cyan-600 rounded flex items-center justify-center text-white cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Right Button */}
        <button
          onTouchStart={() => onDirectionPress('right')}
          onTouchEnd={() => onDirectionPress(null)}
          onMouseDown={() => onDirectionPress('right')}
          onMouseUp={() => onDirectionPress(null)}
          className="absolute right-0 w-10 h-10 bg-gray-800 border-2 border-cyan-400 active:bg-cyan-600 rounded flex items-center justify-center text-white cursor-pointer shadow-md"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Center Pivot */}
        <div className="w-8 h-8 bg-gray-900 border border-gray-700 rounded-full" />
      </div>

      {/* Jump Button */}
      <div className="flex flex-col items-center gap-1">
        <button
          onTouchStart={onJumpPress}
          onMouseDown={onJumpPress}
          className="w-20 h-20 bg-red-600 active:bg-red-500 border-4 border-yellow-300 rounded-full shadow-lg flex flex-col items-center justify-center text-white font-extrabold text-sm active:scale-95 transition-transform cursor-pointer"
        >
          <span className="text-yellow-300 text-xs">JUMP</span>
          <span className="text-[10px] text-gray-200">(점프)</span>
        </button>
      </div>
    </div>
  );
};
