// Stage Select Modal (1~10 Levels)

import React from 'react';
import { Layers, X, Play, ShieldAlert, Star } from 'lucide-react';
import { getStageData } from '../game/stages';

interface StageSelectModalProps {
  isOpen: boolean;
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onClose: () => void;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  isOpen,
  currentStageId,
  onSelectStage,
  onClose,
}) => {
  if (!isOpen) return null;

  const stages = Array.from({ length: 10 }, (_, i) => getStageData(i + 1));

  return (
    <div
      id="stage-select-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="stage-select-card"
        className="bg-white p-2 sm:p-3 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="bg-[#FDFDFD] border-2 border-gray-100 rounded-[32px] flex flex-col flex-1 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-2xl border-2 border-red-200 flex items-center justify-center shadow-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight italic text-gray-900 leading-tight">
                  STAGE SELECT <span className="text-red-600 font-extrabold not-italic font-mono">(1 ~ 10)</span>
                </h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Choose your next challenge
                </p>
              </div>
            </div>
            <button
              id="btn-close-stages"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stage Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stages.map((st) => {
                const isCurrent = st.id === currentStageId;
                const isBoss = st.id === 10;

                return (
                  <div
                    key={st.id}
                    onClick={() => onSelectStage(st.id)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden group flex flex-col justify-between ${
                      isBoss
                        ? 'bg-rose-50/70 border-red-400 shadow-sm hover:shadow-md hover:scale-[1.01]'
                        : isCurrent
                        ? 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-400/50'
                        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                            isBoss
                              ? 'bg-red-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-800 border border-gray-200'
                          }`}
                        >
                          STAGE {st.id}
                        </span>
                        {isBoss ? (
                          <span className="text-xs text-red-600 flex items-center gap-1 font-black">
                            <ShieldAlert className="w-4 h-4" /> BOSS
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" /> LV.{st.id}
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-base text-gray-900 group-hover:text-red-600 transition-colors mb-1 tracking-tight">
                        {st.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed font-medium">
                        {st.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs font-bold">
                      <span className="text-gray-400 font-mono">제한시간: {st.timeLimit}s</span>
                      <span className="flex items-center gap-1 text-red-600 group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                        <Play className="w-3.5 h-3.5 fill-red-600" /> 시작
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
            <button
              id="btn-close-stages-footer"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
