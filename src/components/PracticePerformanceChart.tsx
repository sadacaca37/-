import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Calendar,
  Zap,
  Target,
  Sparkles,
  BarChart2,
  Clock,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { PracticeHistoryRecord } from '../types';

interface PracticePerformanceChartProps {
  records: PracticeHistoryRecord[];
  userName?: string;
  defaultView?: 'weekly' | 'monthly';
}

interface PeriodDataPoint {
  key: string;
  periodLabel: string;
  fullDateLabel: string;
  avgCpm: number;
  maxCpm: number;
  avgAcc: number;
  practiceCount: number;
  totalKeystrokes: number;
}

export const PracticePerformanceChart: React.FC<PracticePerformanceChartProps> = ({
  records,
  userName = '학생',
  defaultView = 'weekly',
}) => {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>(defaultView);
  const [languageFilter, setLanguageFilter] = useState<'all' | 'ko' | 'en'>('all');
  const [metricFilter, setMetricFilter] = useState<'all' | 'cpm' | 'acc'>('all');

  // Filter records by language
  const filteredRecords = useMemo(() => {
    if (languageFilter === 'all') return records;
    return records.filter((r) => r.language === languageFilter);
  }, [records, languageFilter]);

  // Aggregate weekly data (last 8 weeks)
  const weeklyData = useMemo<PeriodDataPoint[]>(() => {
    const points: PeriodDataPoint[] = [];
    const now = new Date();

    // Group into 8 weekly buckets (ending today, going backwards)
    for (let w = 7; w >= 0; w--) {
      const endOfBucket = new Date(now);
      endOfBucket.setDate(now.getDate() - w * 7);
      endOfBucket.setHours(23, 59, 59, 999);

      const startOfBucket = new Date(endOfBucket);
      startOfBucket.setDate(endOfBucket.getDate() - 6);
      startOfBucket.setHours(0, 0, 0, 0);

      const startTime = startOfBucket.getTime();
      const endTime = endOfBucket.getTime();

      // Week label
      const startM = startOfBucket.getMonth() + 1;
      const startD = startOfBucket.getDate();
      const endM = endOfBucket.getMonth() + 1;
      const endD = endOfBucket.getDate();
      const weekLabel = w === 0 ? '이번 주' : w === 1 ? '지난 주' : `${startM}/${startD}~${endM}/${endD}`;
      const fullDateLabel = `${startOfBucket.getFullYear()}.${startM}.${startD} ~ ${endOfBucket.getFullYear()}.${endM}.${endD}`;

      const inWeekRecords = filteredRecords.filter((r) => {
        const t = r.timestamp || (r.dateStr ? new Date(r.dateStr).getTime() : 0);
        return t >= startTime && t <= endTime;
      });

      if (inWeekRecords.length > 0) {
        const totalCpm = inWeekRecords.reduce((sum, r) => sum + (r.cpm || 0), 0);
        const maxCpm = Math.max(...inWeekRecords.map((r) => r.cpm || 0));
        const totalAcc = inWeekRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0);
        const totalKeystrokes = inWeekRecords.reduce((sum, r) => sum + (r.totalKeystrokes || 0), 0);

        points.push({
          key: `week_${w}`,
          periodLabel: weekLabel,
          fullDateLabel,
          avgCpm: Math.round(totalCpm / inWeekRecords.length),
          maxCpm,
          avgAcc: Math.round((totalAcc / inWeekRecords.length) * 10) / 10,
          practiceCount: inWeekRecords.length,
          totalKeystrokes,
        });
      } else {
        points.push({
          key: `week_${w}`,
          periodLabel: weekLabel,
          fullDateLabel,
          avgCpm: 0,
          maxCpm: 0,
          avgAcc: 0,
          practiceCount: 0,
          totalKeystrokes: 0,
        });
      }
    }

    return points;
  }, [filteredRecords]);

  // Aggregate monthly data (last 6 months)
  const monthlyData = useMemo<PeriodDataPoint[]>(() => {
    const points: PeriodDataPoint[] = [];
    const now = new Date();

    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const periodLabel = `${month}월`;
      const fullDateLabel = `${year}년 ${month}월`;

      const inMonthRecords = filteredRecords.filter((r) => {
        let recDate: Date | null = null;
        if (r.timestamp) {
          recDate = new Date(r.timestamp);
        } else if (r.dateStr) {
          recDate = new Date(r.dateStr);
        }
        if (!recDate || isNaN(recDate.getTime())) return false;
        return recDate.getFullYear() === year && recDate.getMonth() + 1 === month;
      });

      if (inMonthRecords.length > 0) {
        const totalCpm = inMonthRecords.reduce((sum, r) => sum + (r.cpm || 0), 0);
        const maxCpm = Math.max(...inMonthRecords.map((r) => r.cpm || 0));
        const totalAcc = inMonthRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0);
        const totalKeystrokes = inMonthRecords.reduce((sum, r) => sum + (r.totalKeystrokes || 0), 0);

        points.push({
          key: `month_${year}_${month}`,
          periodLabel,
          fullDateLabel,
          avgCpm: Math.round(totalCpm / inMonthRecords.length),
          maxCpm,
          avgAcc: Math.round((totalAcc / inMonthRecords.length) * 10) / 10,
          practiceCount: inMonthRecords.length,
          totalKeystrokes,
        });
      } else {
        points.push({
          key: `month_${year}_${month}`,
          periodLabel,
          fullDateLabel,
          avgCpm: 0,
          maxCpm: 0,
          avgAcc: 0,
          practiceCount: 0,
          totalKeystrokes: 0,
        });
      }
    }

    return points;
  }, [filteredRecords]);

  const activeData = viewMode === 'weekly' ? weeklyData : monthlyData;

  // Key KPI summary
  const summaryStats = useMemo(() => {
    const nonZeroPoints = activeData.filter((p) => p.practiceCount > 0);
    const totalPractice = nonZeroPoints.reduce((sum, p) => sum + p.practiceCount, 0);
    const totalKeystrokes = nonZeroPoints.reduce((sum, p) => sum + p.totalKeystrokes, 0);

    const highestOverallCpm = filteredRecords.length > 0
      ? Math.max(...filteredRecords.map((r) => r.cpm || 0))
      : 0;

    const overallAvgCpm = filteredRecords.length > 0
      ? Math.round(filteredRecords.reduce((sum, r) => sum + (r.cpm || 0), 0) / filteredRecords.length)
      : 0;

    const overallAvgAcc = filteredRecords.length > 0
      ? (filteredRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0) / filteredRecords.length).toFixed(1)
      : '100.0';

    // Calculate improvement comparing last 2 periods with activity
    let speedGrowth = 0;
    if (nonZeroPoints.length >= 2) {
      const latest = nonZeroPoints[nonZeroPoints.length - 1];
      const previous = nonZeroPoints[nonZeroPoints.length - 2];
      speedGrowth = latest.avgCpm - previous.avgCpm;
    }

    return {
      totalPractice,
      totalKeystrokes,
      highestOverallCpm,
      overallAvgCpm,
      overallAvgAcc,
      speedGrowth,
    };
  }, [activeData, filteredRecords]);

  // Custom rich Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: PeriodDataPoint = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700 text-xs min-w-[210px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-black text-slate-300">
            <span>{data.fullDateLabel}</span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded-full text-sky-400 font-bold">
              {data.practiceCount}회 연습
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                평균 타속
              </span>
              <span className="font-extrabold text-indigo-300 text-sm">
                {data.avgCpm} <span className="text-[10px] text-slate-400">타/분</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                최고 타속
              </span>
              <span className="font-extrabold text-amber-300 text-sm">
                {data.maxCpm} <span className="text-[10px] text-slate-400">타/분</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                평균 정확도
              </span>
              <span className="font-extrabold text-emerald-300 text-sm">
                {data.avgAcc}%
              </span>
            </div>

            {data.totalKeystrokes > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] text-slate-400">
                <span>총 입력 타수</span>
                <span className="font-mono text-slate-300">{data.totalKeystrokes.toLocaleString()}타</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              타자 성과 변화 그래프
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              {userName}의 성장 기록
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            월별 및 주별 타자 속도(CPM) 추이와 정확도(%) 변화를 한눈에 비교 분석합니다.
          </p>
        </div>

        {/* View Mode & Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Weekly / Monthly Toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>주별 보기 (최근 8주)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>월별 보기 (최근 6개월)</span>
            </button>
          </div>

          {/* Language filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setLanguageFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl cursor-pointer transition ${
                languageFilter === 'all'
                  ? 'bg-white text-slate-900 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => setLanguageFilter('ko')}
              className={`px-2.5 py-1.5 rounded-xl cursor-pointer transition ${
                languageFilter === 'ko'
                  ? 'bg-white text-rose-600 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              한글
            </button>
            <button
              type="button"
              onClick={() => setLanguageFilter('en')}
              className={`px-2.5 py-1.5 rounded-xl cursor-pointer transition ${
                languageFilter === 'en'
                  ? 'bg-white text-blue-600 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              영어
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Avg CPM */}
        <div className="p-3 sm:p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
            <span>평균 타자 속도</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-indigo-950 font-mono">
              {summaryStats.overallAvgCpm}
            </span>
            <span className="text-xs text-indigo-600 font-bold">타/분</span>
          </div>
          {summaryStats.speedGrowth !== 0 && (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-extrabold">
              <span className={summaryStats.speedGrowth > 0 ? 'text-emerald-600' : 'text-slate-500'}>
                {summaryStats.speedGrowth > 0 ? `+${summaryStats.speedGrowth}타 상승 🚀` : `${summaryStats.speedGrowth}타`}
              </span>
            </div>
          )}
        </div>

        {/* Highest CPM */}
        <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
            <span>최고 기록 타속</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
              {summaryStats.highestOverallCpm}
            </span>
            <span className="text-xs text-amber-600 font-bold">타/분</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-bold">
            역대 최고 달성 👑
          </div>
        </div>

        {/* Accuracy */}
        <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
            <span>평균 정확도</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
              {summaryStats.overallAvgAcc}
            </span>
            <span className="text-xs text-emerald-600 font-bold">%</span>
          </div>
          <div className="mt-1 text-[11px] font-bold text-emerald-700">
            {parseFloat(summaryStats.overallAvgAcc) >= 95 ? '95% 우수 정확도 달성 ✨' : '정확도 95% 이상 도전!'}
          </div>
        </div>

        {/* Total Sessions */}
        <div className="p-3 sm:p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-purple-900">
            <span>총 연습량</span>
            <Flame className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-purple-950 font-mono">
              {filteredRecords.length}
            </span>
            <span className="text-xs text-purple-600 font-bold">회 완주</span>
          </div>
          <div className="mt-1 text-[11px] text-purple-700 font-bold font-mono">
            {summaryStats.totalKeystrokes.toLocaleString()}타 누적
          </div>
        </div>
      </div>

      {/* Metric Display Selector */}
      <div className="flex items-center justify-end gap-2 text-xs font-bold">
        <span className="text-slate-400 mr-1 text-[11px]">차트 지표:</span>
        <button
          type="button"
          onClick={() => setMetricFilter('all')}
          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
            metricFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          전체 (타속 & 정확도)
        </button>
        <button
          type="button"
          onClick={() => setMetricFilter('cpm')}
          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
            metricFilter === 'cpm'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-indigo-700 border-indigo-200 hover:border-indigo-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
          타자 속도만 (CPM)
        </button>
        <button
          type="button"
          onClick={() => setMetricFilter('acc')}
          className={`px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
            metricFilter === 'acc'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-emerald-700 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          정확도만 (%)
        </button>
      </div>

      {/* Recharts Main Graph Container */}
      <div className="w-full h-80 sm:h-96 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeData}
            margin={{ top: 16, right: 20, left: -10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="cpmAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="accAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="periodLabel"
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              dy={6}
            />

            {/* Left Y-Axis for CPM (0 to max) */}
            <YAxis
              yAxisId="cpmAxis"
              orientation="left"
              domain={[0, (dataMax: number) => Math.max(200, Math.ceil(dataMax * 1.25))]}
              tick={{ fill: '#6366f1', fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              unit="타"
            />

            {/* Right Y-Axis for Accuracy % (50% to 100%) */}
            <YAxis
              yAxisId="accAxis"
              orientation="right"
              domain={[50, 100]}
              tick={{ fill: '#10b981', fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={false}
              unit="%"
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontWeight: 700 }}
            />

            {/* 1. Average CPM Area + Line */}
            {(metricFilter === 'all' || metricFilter === 'cpm') && (
              <Area
                yAxisId="cpmAxis"
                type="monotone"
                dataKey="avgCpm"
                name="평균 속도 (CPM)"
                stroke="#6366f1"
                strokeWidth={3}
                fill="url(#cpmAreaGrad)"
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }}
              />
            )}

            {/* 2. Highest CPM Line */}
            {(metricFilter === 'all' || metricFilter === 'cpm') && (
              <Line
                yAxisId="cpmAxis"
                type="monotone"
                dataKey="maxCpm"
                name="최고 속도 (CPM)"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#f59e0b', r: 3, strokeWidth: 1, stroke: '#ffffff' }}
              />
            )}

            {/* 3. Accuracy Line */}
            {(metricFilter === 'all' || metricFilter === 'acc') && (
              <Line
                yAxisId="accAxis"
                type="monotone"
                dataKey="avgAcc"
                name="평균 정확도 (%)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Smart Learning Growth Tip Banner */}
      <div className="p-3.5 bg-gradient-to-r from-sky-50 via-indigo-50/50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-black text-indigo-900">💡 성과 분석 팁: </span>
          {summaryStats.speedGrowth > 0 ? (
            <span>
              꾸준한 연습으로 타자 속도가 이전 대비{' '}
              <strong className="text-indigo-700 font-black">+{summaryStats.speedGrowth}타</strong> 증가했습니다!{' '}
              정확도 95% 이상을 유지하며 다음 단계로 전진해 보세요.
            </span>
          ) : (
            <span>
              정확도를 95% 이상으로 유지하는 연습을 거듭하면 손가락 근육 기억이 안정화되어 타자 속도가 자연스럽게 비약적으로 상승합니다.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
