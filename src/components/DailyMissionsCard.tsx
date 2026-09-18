import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Gift, Sparkles, Trophy, ChevronRight, Zap, Coins, Clock } from 'lucide-react';
import { DailyMission, dailyMissionsManager } from '../utils/dailyMissionsManager';
import { UserSession, AppMode } from '../types';
import { soundManager } from '../utils/sound';

interface DailyMissionsCardProps {
  currentUser: UserSession | null;
  onSelectMode: (mode: AppMode) => void;
}

export const DailyMissionsCard: React.FC<DailyMissionsCardProps> = ({ currentUser, onSelectMode }) => {
  const [missions, setMissions] = useState<DailyMission[]>(() =>
    dailyMissionsManager.getMissions(currentUser?.id)
  );
  const [celebrateId, setCelebrateId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMissions(dailyMissionsManager.getMissions(currentUser?.id));
    };

    handleUpdate();
    window.addEventListener('daily-missions-updated', handleUpdate);
    return () => window.removeEventListener('daily-missions-updated', handleUpdate);
  }, [currentUser]);

  const handleClaim = (missionId: string) => {
    const res = dailyMissionsManager.claimReward(missionId, currentUser?.id);
    if (res.success) {
      setCelebrateId(missionId);
      setTimeout(() => setCelebrateId(null), 2500);
      setMissions(dailyMissionsManager.getMissions(currentUser?.id));
    }
  };

  const completedCount = missions.filter((m) => m.current >= m.target).length;
  const claimedCount = missions.filter((m) => m.isClaimed).length;
  const allClear = missions.length > 0 && completedCount === missions.length;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 rounded-3xl p-5 sm:p-6 border-3 border-amber-300 shadow-md relative overflow-hidden">
      {/* Decorative Accent Background Icons */}
      <div className="absolute top-2 right-4 text-amber-200/40 text-7xl font-black select-none pointer-events-none">
        🎯
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400 border-2 border-amber-500 flex items-center justify-center text-white shadow-sm">
            <Target className="w-6 h-6 sm:w-7 sm:h-7 text-amber-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-800 font-arcade">
                오늘의 <span className="text-amber-600">일일 미션</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[11px] font-black border border-amber-300">
                {completedCount} / {missions.length} 완료
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold">
              매일 3가지 미션을 완료하고 보너스 <span className="text-pink-600 font-black">포인트(P)</span>를 모으세요!
            </p>
          </div>
        </div>

        {allClear && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 font-black text-xs shadow-xs border border-amber-500 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-900" />
            <span>오늘의 미션 ALL CLEAR! 🏆</span>
          </div>
        )}
      </div>

      {/* Mission Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {missions.map((mission) => {
          const isDone = mission.current >= mission.target;
          const isClaimed = mission.isClaimed;
          const pct = Math.min(100, Math.round((mission.current / mission.target) * 100));

          return (
            <div
              key={mission.id}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                isClaimed
                  ? 'bg-white/80 border-emerald-300 shadow-2xs opacity-85'
                  : isDone
                  ? 'bg-white border-amber-400 shadow-md ring-2 ring-amber-200 animate-in fade-in'
                  : 'bg-white/90 border-amber-200 shadow-2xs hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mission.icon}</span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {mission.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    🪙 +{mission.rewardPoints}P
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold mb-3 leading-snug">
                  {mission.description}
                </p>
              </div>

              <div>
                {/* Progress Bar */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                  <span>진행률</span>
                  <span className="font-extrabold text-amber-700">
                    {mission.current} / {mission.target} {mission.unit} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? 'bg-gradient-to-r from-amber-400 to-emerald-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Action / Claim Button */}
                {isClaimed ? (
                  <button
                    disabled
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black border border-emerald-200 flex items-center justify-center gap-1.5 cursor-default"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>보상 수령 완료</span>
                  </button>
                ) : isDone ? (
                  <button
                    onClick={() => handleClaim(mission.id)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-md border-2 border-amber-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all animate-bounce"
                  >
                    <Gift className="w-4 h-4 text-yellow-200" />
                    <span>보상 받기 (+{mission.rewardPoints}P)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (mission.type === 'chars') onSelectMode('key-practice');
                      else if (mission.type === 'game') onSelectMode('rhythm-game');
                      else onSelectMode('word-practice');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 text-xs font-bold border border-slate-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>도전하러 가기</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
