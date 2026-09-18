import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Zap, 
  Target, 
  Sparkles,
  Info
} from 'lucide-react';
import { PracticeHistoryRecord } from '../types';

interface WeeklyProgressChartProps {
  records: PracticeHistoryRecord[];
  userName?: string;
}

interface DayData {
  dateKey: string;
  dayLabel: string;
  formattedDate: string;
  avgCpm: number;
  maxCpm: number;
  avgAccuracy: number;
  count: number;
}

export const WeeklyProgressChart: React.FC<WeeklyProgressChartProps> = ({
  records,
  userName = '학생'
}) => {
  const [metricMode, setMetricMode] = useState<'both' | 'cpm' | 'accuracy'>('both');
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);

  // Generate chart data for the last N days
  const chartData = useMemo(() => {
    const now = new Date();
    const days: DayData[] = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${date}`;
      const dayLabel = `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]})`;
      const formattedDate = `${year}.${month}.${date}`;

      // Filter user records for this date
      const dayRecords = records.filter(r => {
        if (!r.timestamp && !r.dateStr) return false;
        if (r.timestamp) {
          const recDate = new Date(r.timestamp);
          return (
            recDate.getFullYear() === year &&
            recDate.getMonth() === d.getMonth() &&
            recDate.getDate() === d.getDate()
          );
        }
        return r.dateStr?.includes(`${month}.${date}`) || r.dateStr?.includes(`${month}-${date}`);
      });

      if (dayRecords.length > 0) {
        const totalCpm = dayRecords.reduce((sum, r) => sum + (r.cpm || 0), 0);
        const maxCpm = Math.max(...dayRecords.map(r => r.cpm || 0));
        const totalAcc = dayRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0);

        days.push({
          dateKey,
          dayLabel,
          formattedDate,
          avgCpm: Math.round(totalCpm / dayRecords.length),
          maxCpm,
          avgAccuracy: Math.round(totalAcc / dayRecords.length),
          count: dayRecords.length
        });
      } else {
        // Even if no record on that day, show date with 0 for continuous timeline
        days.push({
          dateKey,
          dayLabel,
          formattedDate,
          avgCpm: 0,
          maxCpm: 0,
          avgAccuracy: 0,
          count: 0
        });
      }
    }

    // Check if user has zero records at all
    const hasAnyRecord = days.some(d => d.count > 0);
    if (!hasAnyRecord && records.length > 0) {
      // If timestamps had format difference, map available records
      return records.slice(-timeRange).map((r, idx) => ({
        dateKey: `session-${idx}`,
        dayLabel: r.dateStr || `${idx + 1}회차`,
        formattedDate: r.dateStr || `${idx + 1}회차`,
        avgCpm: r.cpm || 0,
        maxCpm: r.cpm || 0,
        avgAccuracy: r.accuracy || 0,
        count: 1
      }));
    }

    return days;
  }, [records, timeRange]);

  // Derived statistics
  const stats = useMemo(() => {
    const activeDays = chartData.filter(d => d.count > 0);
    if (activeDays.length === 0) {
      return {
        avgCpm: 0,
        maxCpm: 0,
        avgAccuracy: 0,
        totalPractices: 0,
        cpmGrowth: 0,
        activeDaysCount: 0
      };
    }

    const totalCpm = activeDays.reduce((sum, d) => sum + d.avgCpm, 0);
    const maxCpm = Math.max(...activeDays.map(d => d.maxCpm));
    const totalAcc = activeDays.reduce((sum, d) => sum + d.avgAccuracy, 0);
    const totalPractices = activeDays.reduce((sum, d) => sum + d.count, 0);

    const firstActive = activeDays[0];
    const lastActive = activeDays[activeDays.length - 1];
    const cpmGrowth = firstActive.avgCpm > 0 
      ? Math.round(((lastActive.avgCpm - firstActive.avgCpm) / firstActive.avgCpm) * 100)
      : 0;

    return {
      avgCpm: Math.round(totalCpm / activeDays.length),
      maxCpm,
      avgAccuracy: Math.round(totalAcc / activeDays.length),
      totalPractices,
      cpmGrowth,
      activeDaysCount: activeDays.length
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DayData;
      return (
        <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border-2 border-indigo-200 text-xs space-y-1.5 min-w-44">
          <div className="font-black text-slate-800 border-b border-slate-100 pb-1 flex items-center justify-between">
            <span>📅 {data.formattedDate}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              {data.count > 0 ? `${data.count}회 연습` : '연습 없음'}
            </span>
          </div>
          {data.count > 0 ? (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-indigo-600 font-bold">
                <span>평균 타수 (CPM):</span>
                <span className="font-extrabold font-arcade text-sm">{data.avgCpm} 타</span>
              </div>
              <div className="flex items-center justify-between text-pink-600 font-bold">
                <span>최고 타수 (CPM):</span>
                <span className="font-extrabold font-arcade text-sm">{data.maxCpm} 타</span>
              </div>
              <div className="flex items-center justify-between text-emerald-600 font-bold">
                <span>평균 정확도:</span>
                <span className="font-extrabold font-arcade text-sm">{data.avgAccuracy}%</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 font-medium py-1">이 날짜에는 완료된 타자 기록이 없습니다.</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 p-4 sm:p-5 rounded-3xl border-2 border-purple-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>{userName} 학생의 주간 타수(CPM) 성장 그래프</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-black">
                  실시간 통계
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                매일 꾸준히 쌓은 타자 속도와 정확도 향상 추이를 한눈에 확인합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {/* Range pills */}
          <div className="flex items-center p-1 bg-white rounded-2xl border border-purple-200 shadow-2xs">
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                timeRange === 7 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              최근 7일
            </button>
            <button
              onClick={() => setTimeRange(14)}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                timeRange === 14 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              최근 14일
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3 py-1 text-xs font-black rounded-xl transition-all cursor-pointer ${
                timeRange === 30 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              최근 30일
            </button>
          </div>

          {/* Metric View Mode */}
          <div className="flex items-center p-1 bg-white rounded-2xl border border-purple-200 shadow-2xs">
            <button
              onClick={() => setMetricMode('both')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                metricMode === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-500'
              }`}
              title="타수와 정확도 함께 보기"
            >
              종합
            </button>
            <button
              onClick={() => setMetricMode('cpm')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                metricMode === 'cpm' ? 'bg-indigo-600 text-white' : 'text-slate-500'
              }`}
              title="타수(CPM)만 보기"
            >
              타수
            </button>
            <button
              onClick={() => setMetricMode('accuracy')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
                metricMode === 'accuracy' ? 'bg-indigo-600 text-white' : 'text-slate-500'
              }`}
              title="정확도만 보기"
            >
              정확도
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 border-2 border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-indigo-700">주간 평균 타수</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-indigo-950 font-arcade">
              {stats.avgCpm}
            </span>
            <span className="text-xs font-bold text-indigo-600 ml-1">CPM</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-pink-50/70 border-2 border-pink-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-pink-700">주간 최고 타수</span>
            <Award className="w-4 h-4 text-pink-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-pink-950 font-arcade">
              {stats.maxCpm}
            </span>
            <span className="text-xs font-bold text-pink-600 ml-1">CPM</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/70 border-2 border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-emerald-700">평균 정확도</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-950 font-arcade">
              {stats.avgAccuracy}
            </span>
            <span className="text-xs font-bold text-emerald-600 ml-1">%</span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-amber-700">성장 추이 / 연습</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className={`text-xl sm:text-2xl font-black font-arcade ${
              stats.cpmGrowth >= 0 ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              {stats.cpmGrowth >= 0 ? `+${stats.cpmGrowth}%` : `${stats.cpmGrowth}%`}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              ({stats.totalPractices}회 완료)
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Container */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
          <span className="font-bold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>최근 {timeRange}일간 일자별 기록 변화</span>
          </span>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            {(metricMode === 'both' || metricMode === 'cpm') && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
                  <span className="text-slate-600">평균 CPM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block"></span>
                  <span className="text-slate-600">최고 CPM</span>
                </div>
              </>
            )}
            {(metricMode === 'both' || metricMode === 'accuracy') && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-slate-600">정확도 (%)</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full h-72 sm:h-80 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAvgCpm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="barPracticeCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#e0e7ff" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              
              <XAxis 
                dataKey="dayLabel" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              
              {/* Left Axis for CPM */}
              <YAxis 
                yAxisId="cpmAxis"
                domain={[0, (dataMax: number) => Math.max(500, Math.ceil(dataMax * 1.15 / 50) * 50)]}
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                unit=" 타"
              />

              {/* Right Axis for Accuracy & Counts */}
              <YAxis 
                yAxisId="accAxis"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#10b981', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                unit="%"
                hide={metricMode === 'cpm'}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Background bars for session volume */}
              <Bar 
                yAxisId="cpmAxis"
                dataKey="count" 
                fill="url(#barPracticeCount)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={28}
                name="연습 횟수"
              />

              {(metricMode === 'both' || metricMode === 'cpm') && (
                <>
                  <Area
                    yAxisId="cpmAxis"
                    type="monotone"
                    dataKey="avgCpm"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorAvgCpm)"
                    name="평균 CPM"
                    activeDot={{ r: 6, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                  <Line
                    yAxisId="cpmAxis"
                    type="monotone"
                    dataKey="maxCpm"
                    stroke="#ec4899"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#ec4899' }}
                    name="최고 CPM"
                  />
                </>
              )}

              {(metricMode === 'both' || metricMode === 'accuracy') && (
                <Line
                  yAxisId="accAxis"
                  type="monotone"
                  dataKey="avgAccuracy"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                  name="정확도 (%)"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tip strip */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>
            💡 <strong>타수 향상 꿀팁:</strong> 오타를 줄이고 정확도를 95% 이상으로 유지할 때 손가락 근육 기억이 안정되어 최고 타수(CPM)가 빠르게 상승합니다.
          </span>
        </div>
      </div>
    </div>
  );
};
