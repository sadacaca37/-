import React from 'react';
import PonpokoApp from './ponpoko/App';

interface PonpokoGameWrapperProps {
  onBack?: () => void;
  currentUser?: any;
}

export const PonpokoGameWrapper: React.FC<PonpokoGameWrapperProps> = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-neutral-950 border-2 border-yellow-500/40 shadow-2xl p-2 sm:p-4">
      <div className="w-full max-w-[620px]">
        <PonpokoApp />
      </div>
    </div>
  );
};
