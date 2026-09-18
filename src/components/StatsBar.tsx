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
      className="bg-white rounded-3xl p-3 sm:p-4 border-2 border-pink-200 shadow-md grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3"
    >
      {/* 1. 타수 (CPM) */}
      <div className="bg-sky-50 rounded-2xl p-2.5 sm:p-3 text-center border-2 border-sky-200">
        <p className="text-[10px] sm:text-[11px] text-sky-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
          <Gauge className="w-3.5 h-3.5 text-sky-500 inline" />
          <span>타수 (CPM)</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-sky-600 font-mono tracking-tight font-arcade">
          {stats.cpm}
        </p>
      </div>

      {/* 2. 정확도 (%) */}
      <div className="bg-teal-50 rounded-2xl p-2.5 sm:p-3 text-center border-2 border-teal-200">
        <p className="text-[10px] sm:text-[11px] text-teal-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
          <CheckCircle className="w-3.5 h-3.5 text-teal-500 inline" />
          <span>정확도 (%)</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-teal-600 font-mono tracking-tight font-arcade">
          {stats.accuracy}%
        </p>
      </div>

      {/* 3. 오타수 */}
      <div className="bg-rose-50 rounded-2xl p-2.5 sm:p-3 text-center border-2 border-rose-200">
        <p className="text-[10px] sm:text-[11px] text-rose-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500 inline" />
          <span>오타수</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-rose-500 font-mono tracking-tight font-arcade">
          {stats.errorCount}
          <span className="text-[11px] text-rose-400 font-normal ml-1">({errorRate}%)</span>
        </p>
      </div>

      {/* 4. 진행시간 */}
      <div className="bg-purple-50 rounded-2xl p-2.5 sm:p-3 text-center border-2 border-purple-200">
        <p className="text-[10px] sm:text-[11px] text-purple-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5 text-purple-500 inline" />
          <span>진행시간</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-purple-700 font-mono tracking-tight font-arcade">
          {formatTime(stats.elapsedSeconds)}
        </p>
      </div>

      {/* 5. 연속 콤보 */}
      <div className="col-span-2 sm:col-span-1 bg-amber-50 rounded-2xl p-2.5 sm:p-3 text-center border-2 border-amber-200">
        <p className="text-[10px] sm:text-[11px] text-amber-700 font-extrabold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-500 inline" />
          <span>연속 콤보</span>
        </p>
        <p className="text-2xl sm:text-3xl font-black text-amber-600 font-mono tracking-tight font-arcade">
          {stats.combo}
          <span className="text-[10px] text-amber-700 font-black uppercase tracking-wider ml-1">Combo</span>
        </p>
      </div>
    </div>
  );
};
