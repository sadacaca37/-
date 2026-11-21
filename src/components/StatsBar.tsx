import React from 'react';
import { Gauge, Clock, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { TypingStats } from '../types';

interface StatsBarProps {
  stats: TypingStats;
  targetGoalCpm?: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const errorRate = stats.totalKeystrokes > 0 
    ? Math.max(0, Math.round((stats.errorCount / stats.totalKeystrokes) * 100))
    : 0;

  return (
    <div 
      id="typing-stats-bar"
      className="pr-stats-bar p-2.5 sm:p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5"
    >
      {/* 1. 타수 (CPM) */}
      <div className="pr-stat-plaque p-2.5 sm:p-3 text-center">
        <p className="text-xs sm:text-sm text-[#5c3214] font-black tracking-wide mb-0.5 flex items-center justify-center gap-1">
          <Gauge className="w-4 h-4 text-[#0369a1] inline" />
          <span>타수 (CPM)</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-[#0369a1] font-mono tabular-nums tracking-tight font-arcade">
          {stats.cpm}
        </p>
      </div>

      {/* 2. 정확도 (%) */}
      <div className="pr-stat-plaque p-2.5 sm:p-3 text-center">
        <p className="text-xs sm:text-sm text-[#5c3214] font-black tracking-wide mb-0.5 flex items-center justify-center gap-1">
          <CheckCircle className="w-4 h-4 text-[#0f766e] inline" />
          <span>정확도 (%)</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-[#0f766e] font-mono tabular-nums tracking-tight font-arcade">
          {stats.accuracy}%
        </p>
      </div>

      {/* 3. 오타수 */}
      <div className="pr-stat-plaque p-2.5 sm:p-3 text-center">
        <p className="text-xs sm:text-sm text-[#5c3214] font-black tracking-wide mb-0.5 flex items-center justify-center gap-1">
          <AlertTriangle className="w-4 h-4 text-[#be123c] inline" />
          <span>오타수</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-[#be123c] font-mono tabular-nums tracking-tight font-arcade">
          {stats.errorCount}
          <span className="text-xs sm:text-sm text-[#9f1239] font-bold ml-1">({errorRate}%)</span>
        </p>
      </div>

      {/* 4. 진행시간 */}
      <div className="pr-stat-plaque p-2.5 sm:p-3 text-center">
        <p className="text-xs sm:text-sm text-[#5c3214] font-black tracking-wide mb-0.5 flex items-center justify-center gap-1">
          <Clock className="w-4 h-4 text-[#6d28d9] inline" />
          <span>진행시간</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-[#5b21b6] font-mono tabular-nums tracking-tight font-arcade">
          {formatTime(stats.elapsedSeconds)}
        </p>
      </div>

      {/* 5. 연속 콤보 */}
      <div className="col-span-2 sm:col-span-1 pr-stat-plaque p-2.5 sm:p-3 text-center">
        <p className="text-xs sm:text-sm text-[#5c3214] font-black tracking-wide mb-0.5 flex items-center justify-center gap-1">
          <Flame className="w-4 h-4 text-[#b45309] inline" />
          <span>연속 콤보</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-[#b45309] font-mono tabular-nums tracking-tight font-arcade">
          {stats.combo}
          <span className="text-xs text-[#78350f] font-black ml-1">Combo</span>
        </p>
      </div>
    </div>
  );
};
