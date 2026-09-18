import React from 'react';
import SuperMarioApp from './superMario/App';

interface SuperMarioGameWrapperProps {
  onBack?: () => void;
  currentUser?: any;
}

export const SuperMarioGameWrapper: React.FC<SuperMarioGameWrapperProps> = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center rounded-2xl overflow-hidden bg-slate-900 border-2 border-red-500/40 shadow-2xl p-2 sm:p-4">
      <div className="w-full max-w-[850px]">
        <SuperMarioApp />
      </div>
    </div>
  );
};
