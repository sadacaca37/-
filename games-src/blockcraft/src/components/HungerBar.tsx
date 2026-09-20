import React from "react";
import { Drumstick } from "lucide-react";

interface HungerBarProps {
  hunger: number; // 0..20
  maxHunger?: number;
}

export const HungerBar: React.FC<HungerBarProps> = ({ hunger, maxHunger = 20 }) => {
  const totalIcons = Math.ceil(maxHunger / 2);
  const drumsticks = [];

  for (let i = totalIcons - 1; i >= 0; i--) {
    const val = (i + 1) * 2;
    const isFull = hunger >= val;
    const isHalf = hunger === val - 1;

    drumsticks.push(
      <div key={i} className="relative w-5 h-5 flex items-center justify-center">
        {/* Empty outline */}
        <Drumstick
          size={17}
          className="text-black/40 fill-black/30 absolute"
          strokeWidth={2.2}
        />

        {/* Full drumstick */}
        {isFull && (
          <Drumstick
            size={15}
            className="text-amber-800 fill-amber-600 transition-colors duration-150"
            strokeWidth={1.5}
          />
        )}

        {/* Half drumstick */}
        {isHalf && (
          <div className="w-2.5 h-4 overflow-hidden absolute right-0.5">
            <Drumstick
              size={15}
              className="text-amber-800 fill-amber-600 transition-colors duration-150"
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
    );
  }

  const isStarving = hunger <= 4;

  return (
    <div
      id="player-hunger-bar"
      className={`flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border transition-all duration-200 ${
        isStarving
          ? "border-amber-600 shadow-lg shadow-amber-600/30 animate-pulse"
          : "border-white/10"
      }`}
    >
      <span className="text-xs font-mono font-bold text-amber-300 min-w-[38px]">
        {Math.max(0, hunger)}/{maxHunger}
      </span>
      <div className="flex gap-0.5">{drumsticks}</div>
    </div>
  );
};
