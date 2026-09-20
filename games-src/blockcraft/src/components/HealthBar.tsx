import React from "react";
import { Heart } from "lucide-react";

interface HealthBarProps {
  health: number;
  maxHealth?: number;
  isHurt?: boolean;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  health,
  maxHealth = 20,
  isHurt = false,
}) => {
  const totalHearts = Math.ceil(maxHealth / 2);
  const hearts = [];

  for (let i = 0; i < totalHearts; i++) {
    const heartValue = (i + 1) * 2;
    const isFull = health >= heartValue;
    const isHalf = health === heartValue - 1;

    hearts.push(
      <div key={i} className="relative w-5 h-5 flex items-center justify-center">
        {/* Heart Background / Border */}
        <Heart
          size={18}
          className="text-black/40 fill-black/30 absolute"
          strokeWidth={2.5}
        />

        {/* Half or Full Heart */}
        {isFull && (
          <Heart
            size={16}
            className={`transition-colors duration-150 ${
              isHurt ? "text-white fill-white" : "text-red-600 fill-red-500"
            }`}
            strokeWidth={1.5}
          />
        )}

        {isHalf && (
          <div className="w-2.5 h-4 overflow-hidden absolute left-0.5">
            <Heart
              size={16}
              className={`transition-colors duration-150 ${
                isHurt ? "text-white fill-white" : "text-red-600 fill-red-500"
              }`}
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      id="player-health-bar"
      className={`flex items-center gap-1 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border transition-all duration-200 ${
        isHurt ? "border-red-500 shadow-lg shadow-red-500/30 scale-105" : "border-white/10"
      }`}
    >
      <div className="flex gap-0.5">{hearts}</div>
      <span className="text-xs font-mono font-bold text-white/90 ml-1.5 min-w-[42px]">
        {Math.max(0, health)}/{maxHealth}
      </span>
    </div>
  );
};
