import React from 'react';
import BubbleBobbleApp from './bubbleBobble/App';

interface BubbleBobbleGameWrapperProps {
  onBack?: () => void;
  currentUser?: any;
}

export const BubbleBobbleGameWrapper: React.FC<BubbleBobbleGameWrapperProps> = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/40 shadow-2xl p-2 sm:p-4">
      <div className="w-full max-w-[800px]">
        <BubbleBobbleApp />
      </div>
    </div>
  );
};
