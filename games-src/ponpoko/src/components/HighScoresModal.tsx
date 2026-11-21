import React from 'react';
import { Trophy, X, RotateCcw } from 'lucide-react';
import { HighScoreItem } from '../types';

interface HighScoresModalProps {
  highScores: HighScoreItem[];
  onClose: () => void;
  onReset: () => void;
}

export const HighScoresModal: React.FC<HighScoresModalProps> = ({
  highScores,
  onClose,
  onReset,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border-2 border-yellow-400 rounded-lg shadow-2xl p-5 text-white font-mono relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1 rounded hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-4 border-b border-gray-800 pb-3">
          <Trophy className="w-6 h-6 text-yellow-400 animate-bounce" />
          <h2 className="text-lg font-extrabold text-yellow-400 tracking-widest">
            RANKING (전당의 명예)
          </h2>
        </div>

        {/* High Score List */}
        <div className="space-y-2.5 my-4">
          {highScores.map((hs, idx) => (
            <div
              key={idx}
              className={`flex justify-between items-center p-2.5 rounded font-bold text-sm border ${
                idx === 0
                  ? 'bg-yellow-950/40 border-yellow-500 text-yellow-300'
                  : idx === 1
                  ? 'bg-gray-900/60 border-gray-400 text-gray-200'
                  : idx === 2
                  ? 'bg-amber-950/40 border-amber-600 text-amber-300'
                  : 'bg-gray-950 border-gray-800 text-gray-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-center text-xs px-1.5 py-0.5 rounded bg-black border border-current">
                  {hs.rank}
                </span>
                <span className="text-xs text-gray-400">{hs.date}</span>
              </div>
              <span className="text-base tracking-widest">
                {hs.score.toString().padStart(6, '0')}
              </span>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-6 pt-3 border-t border-gray-800 text-xs">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RESET SCORES
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold rounded tracking-wider cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
