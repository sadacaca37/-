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
        <div className="bg-[#0A0E1A] border-2 border-[#00D2FF] rounded-xl p-3 shadow-[0_0_16px_rgba(0,210,255,0.4)] text-xs font-pixel space-y-2 min-w-[210px] z-50">
          <div className="border-b border-[#1E293B] pb-1.5 flex items-center justify-between">
            <span className="font-black text-[#00D2FF] text-xs">
              [{data.periodLabel}]
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {data.practiceCount > 0 ? `${data.practiceCount}회 연습` : '기록 없음'}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5 text-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#00D2FF] inline-block shadow-[0_0_6px_#00D2FF]" />
                실시간/평균 타속
              </span>
              <span className="font-black text-[#00D2FF] font-mono">
                {data.avgCpm} <span className="text-[10px] text-slate-400">CPM</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#FFD700] inline-block shadow-[0_0_6px_#FFD700]" />
                최고 타수
              </span>
              <span className="font-black text-[#FFD700] font-mono">
                {data.maxCpm} <span className="text-[10px] text-slate-400">CPM</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#10B981] inline-block shadow-[0_0_6px_#10B981]" />
                정확도
              </span>
              <span className="font-black text-[#10B981] font-mono">
                {data.avgAcc}%
              </span>
            </div>

            {data.totalKeystrokes > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-[#1E293B] text-[10px] text-slate-400">
                <span>총 입력 타수</span>
                <span className="font-mono text-[#F8FAFC]">{data.totalKeystrokes.toLocaleString()}타</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0B0F19] rounded-2xl p-5 sm:p-7 border-4 border-[#1E293B] shadow-[0_10px_0_#06080F,0_0_24px_rgba(0,210,255,0.18)] relative overflow-hidden space-y-6 text-slate-100">
      {/* 4 Corner Neon Screws / Rivets */}
      <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#00D2FF] border border-[#0088AA] shadow-[0_0_6px_#00D2FF]" />
      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#00D2FF] border border-[#0088AA] shadow-[0_0_6px_#00D2FF]" />
      <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#00D2FF] border border-[#0088AA] shadow-[0_0_6px_#00D2FF]" />
      <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#00D2FF] border border-[#0088AA] shadow-[0_0_6px_#00D2FF]" />

      {/* Top Header & Controls */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-md bg-[#131B2E] text-[#00D2FF] text-xs font-pixel border-2 border-[#00D2FF]/60 shadow-[0_0_12px_rgba(0,210,255,0.3)] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>[ 📈 16-BIT 아케이드 타자 성과 분석 ]</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#1E293B] border border-[#334155] text-xs font-pixel text-[#FFD700] shadow-xs">
              PLAYER: {userName}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-arcade mt-1.5">
            16비트 레트로 네온 대시보드 : 주별 및 월별 실시간 타속 추이와 최고 타수, 정확도 변화를 분석합니다.
          </p>
        </div>

        {/* View Mode & Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Weekly / Monthly Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-[#0F172A] border-2 border-[#1E293B] gap-1 shadow-inner text-xs font-pixel">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-black border border-[#00D2FF] shadow-[0_0_10px_rgba(0,210,255,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>[주별 8주]</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white font-black border border-[#00D2FF] shadow-[0_0_10px_rgba(0,210,255,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>[월별 6개월]</span>
            </button>
          </div>

          {/* Language filter */}
          <div className="inline-flex p-1 rounded-xl bg-[#0F172A] border-2 border-[#1E293B] gap-1 shadow-inner text-xs font-pixel">
            <button
              type="button"
              onClick={() => setLanguageFilter('all')}
              className={`px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                languageFilter === 'all'
                  ? 'bg-[#1E293B] text-[#FFD700] border border-[#FFD700]/70 font-black shadow-[0_0_8px_rgba(255,215,0,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              [전체]
            </button>
            <button
              type="button"
              onClick={() => setLanguageFilter('ko')}
              className={`px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                languageFilter === 'ko'
                  ? 'bg-[#1E293B] text-[#00D2FF] border border-[#00D2FF]/70 font-black shadow-[0_0_8px_rgba(0,210,255,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              🇰🇷 [한글]
            </button>
            <button
              type="button"
              onClick={() => setLanguageFilter('en')}
              className={`px-2.5 py-1.5 rounded-md cursor-pointer transition ${
                languageFilter === 'en'
                  ? 'bg-[#1E293B] text-[#A855F7] border border-[#A855F7]/70 font-black shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              🇺🇸 [영어]
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards Grid: 실시간 타수, 최고 타수, 정확도 (16비트 네온 테마) */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. 실시간 타수 (Neon Cyan) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#071326]/90 border-2 border-[#00D2FF] shadow-[0_0_15px_rgba(0,210,255,0.3),inset_0_0_10px_rgba(0,210,255,0.1)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs font-pixel text-[#00D2FF]">
            <span className="font-black tracking-wide">실시간 타수</span>
            <Zap className="w-4 h-4 text-[#00D2FF] animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#00D2FF] font-mono [text-shadow:_0_0_10px_#00D2FF]">
              {summaryStats.overallAvgCpm}
            </span>
            <span className="text-xs text-[#38BDF8] font-pixel font-bold">CPM</span>
          </div>
          {summaryStats.speedGrowth !== 0 ? (
            <div className="mt-1 flex items-center gap-1 text-[11px] font-pixel font-bold">
              <span className={summaryStats.speedGrowth > 0 ? 'text-[#10B981]' : 'text-slate-400'}>
                {summaryStats.speedGrowth > 0 ? `+${summaryStats.speedGrowth}타 상승 🚀` : `${summaryStats.speedGrowth}타`}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-slate-400 font-pixel">
              실시간 타속 반영 ⚡
            </div>
          )}
        </div>

        {/* 2. 최고 타수 (Neon Gold) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#221804]/90 border-2 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.3),inset_0_0_10px_rgba(255,215,0,0.1)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs font-pixel text-[#FFD700]">
            <span className="font-black tracking-wide">최고 타수</span>
            <Award className="w-4 h-4 text-[#FFD700] animate-bounce" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#FFD700] font-mono [text-shadow:_0_0_10px_#FFD700]">
              {summaryStats.highestOverallCpm}
            </span>
            <span className="text-xs text-[#FDE047] font-pixel font-bold">CPM</span>
          </div>
          <div className="mt-1 text-[11px] text-[#FBBF24] font-pixel font-bold">
            역대 최고 신기록 👑
          </div>
        </div>

        {/* 3. 정확도 (Neon Emerald) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#041F16]/90 border-2 border-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3),inset_0_0_10px_rgba(16,185,129,0.1)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs font-pixel text-[#10B981]">
            <span className="font-black tracking-wide">정확도</span>
            <Target className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#10B981] font-mono [text-shadow:_0_0_10px_#10B981]">
              {summaryStats.overallAvgAcc}
            </span>
            <span className="text-xs text-[#34D399] font-pixel font-bold">%</span>
          </div>
          <div className="mt-1 text-[11px] font-pixel font-bold text-[#10B981]">
            {parseFloat(summaryStats.overallAvgAcc) >= 95 ? '95% 우수 정확도 ✨' : '정확도 95% 이상 도전!'}
          </div>
        </div>

        {/* 4. 총 연습량 (Neon Purple) */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-[#1A092E]/90 border-2 border-[#A855F7] shadow-[0_0_15px_rgba(168,85,247,0.3),inset_0_0_10px_rgba(168,85,247,0.1)] flex flex-col justify-between hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between text-xs font-pixel text-[#A855F7]">
            <span className="font-black tracking-wide">총 연습량</span>
            <Flame className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#A855F7] font-mono [text-shadow:_0_0_10px_#A855F7]">
              {filteredRecords.length}
            </span>
            <span className="text-xs text-[#C084FC] font-pixel font-bold">회 완주</span>
          </div>
          <div className="mt-1 text-[11px] text-[#C084FC] font-pixel font-bold font-mono">
            {summaryStats.totalKeystrokes.toLocaleString()}타 누적
          </div>
        </div>
      </div>

      {/* Metric Display Selector */}
      <div className="relative z-10 flex items-center justify-end gap-2 text-xs font-pixel">
        <span className="text-slate-400 mr-1 text-[11px]">[차트 지표] :</span>
        <button
          type="button"
          onClick={() => setMetricFilter('all')}
          className={`px-2.5 py-1 rounded-md border-2 transition cursor-pointer ${
            metricFilter === 'all'
              ? 'bg-[#1E293B] text-[#FFD700] border-[#FFD700] shadow-[0_0_8px_rgba(255,215,0,0.4)]'
              : 'bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-white'
          }`}
        >
          [전체 (타속 & 정확도)]
        </button>
        <button
          type="button"
          onClick={() => setMetricFilter('cpm')}
          className={`px-2.5 py-1 rounded-md border-2 transition cursor-pointer flex items-center gap-1.5 ${
            metricFilter === 'cpm'
              ? 'bg-[#071326] text-[#00D2FF] border-[#00D2FF] shadow-[0_0_8px_rgba(0,210,255,0.4)]'
              : 'bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-[#00D2FF]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#00D2FF] inline-block shadow-[0_0_4px_#00D2FF]" />
          [실시간 타수만]
        </button>
        <button
          type="button"
          onClick={() => setMetricFilter('acc')}
          className={`px-2.5 py-1 rounded-md border-2 transition cursor-pointer flex items-center gap-1.5 ${
            metricFilter === 'acc'
              ? 'bg-[#041F16] text-[#10B981] border-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              : 'bg-[#0F172A] text-slate-400 border-[#1E293B] hover:text-[#10B981]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block shadow-[0_0_4px_#10B981]" />
          [정확도만]
        </button>
      </div>

      {/* Recharts Main Graph Container (16-Bit CRT Arcade Screen Interior) */}
      <div className="relative z-10 w-full h-80 sm:h-96 pt-2 bg-[#050914] rounded-xl border-3 border-[#1E293B] p-3 shadow-[inset_0_0_24px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Subtle scanline overlay inside chart */}
        <div className="absolute inset-0 pointer-events-none opacity-20 crt-scanline-overlay" />

        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={activeData}
            margin={{ top: 16, right: 20, left: -10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="cpmAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#00D2FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />

            <XAxis
              dataKey="periodLabel"
              tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              dy={6}
            />

            {/* Left Y-Axis for CPM */}
            <YAxis
              yAxisId="cpmAxis"
              orientation="left"
              domain={[0, (dataMax: number) => Math.max(200, Math.ceil(dataMax * 1.25))]}
              tick={{ fill: '#00D2FF', fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              unit="타"
            />

            {/* Right Y-Axis for Accuracy % */}
            <YAxis
              yAxisId="accAxis"
              orientation="right"
              domain={[50, 100]}
              tick={{ fill: '#10B981', fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: '#334155' }}
              tickLine={false}
              unit="%"
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontWeight: 700 }}
            />

            {/* 1. Average / Real-time CPM Area + Line (Neon Cyan) */}
            {(metricFilter === 'all' || metricFilter === 'cpm') && (
              <Area
                yAxisId="cpmAxis"
                type="monotone"
                dataKey="avgCpm"
                name="실시간/평균 타속 (CPM)"
                stroke="#00D2FF"
                strokeWidth={3}
                fill="url(#cpmAreaGrad)"
                dot={{ fill: '#00D2FF', r: 4, strokeWidth: 2, stroke: '#050914' }}
                activeDot={{ r: 7, stroke: '#00D2FF', strokeWidth: 2, fill: '#ffffff' }}
              />
            )}

            {/* 2. Highest CPM Line (Neon Gold) */}
            {(metricFilter === 'all' || metricFilter === 'cpm') && (
              <Line
                yAxisId="cpmAxis"
                type="monotone"
                dataKey="maxCpm"
                name="최고 타수 (CPM)"
                stroke="#FFD700"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ fill: '#FFD700', r: 3, strokeWidth: 1, stroke: '#050914' }}
              />
            )}

            {/* 3. Accuracy Line (Neon Emerald) */}
            {(metricFilter === 'all' || metricFilter === 'acc') && (
              <Line
                yAxisId="accAxis"
                type="monotone"
                dataKey="avgAcc"
                name="정확도 (%)"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4, strokeWidth: 2, stroke: '#050914' }}
                activeDot={{ r: 7, stroke: '#10B981', strokeWidth: 2, fill: '#ffffff' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Smart Learning Growth Tip Banner (16-bit Neon style) */}
      <div className="relative z-10 p-3.5 bg-[#131B2E] rounded-xl border-2 border-[#1E293B] flex items-center gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-lg bg-[#1E293B] border border-[#00D2FF]/50 text-[#00D2FF] flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(0,210,255,0.3)]">
          <Sparkles className="w-5 h-5 text-[#00D2FF]" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed font-arcade font-bold">
          <span className="font-pixel text-[#00D2FF]">[ 💡 16-BIT 아케이드 분석 팁 ] : </span>
          {summaryStats.speedGrowth > 0 ? (
            <span>
              꾸준한 연습으로 타자 속도가 이전 대비{' '}
              <strong className="text-[#00D2FF] font-black">+{summaryStats.speedGrowth}타</strong> 증가했습니다!{' '}
              정확도 95% 이상을 유지하며 다음 퀘스트 맵으로 나아가 보세요.
            </span>
          ) : (
            <span>
              정확도를 95% 이상으로 유지하는 연습을 거듭하면 손가락 근육 기억이 안정화되어 실시간 타자 속도가 비약적으로 상승합니다.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
