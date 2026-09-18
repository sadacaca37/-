import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserSession, 
  AppMode,
  PracticeHistoryRecord
} from '../types';
import { 
  getUserPracticeHistory 
} from '../utils/curriculumManager';
import { 
  Zap, 
  Flame, 
  Target, 
  BarChart3, 
  Trophy, 
  Sparkles,
  TrendingUp,
  Activity,
  History
} from 'lucide-react';

interface StudentProgressCardProps {
  currentUser: UserSession | null;
  onSelectMode?: (mode: AppMode) => void;
  onOpenHistory: () => void;
  onOpenAuth?: () => void;
}

export const StudentProgressCard: React.FC<StudentProgressCardProps> = ({
  currentUser,
  onOpenHistory,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'ko' | 'en'>('all');
  const [records, setRecords] = useState<PracticeHistoryRecord[]>([]);

  // Load records and listen for real-time history updates
  const loadRecords = () => {
    const targetId = currentUser ? currentUser.id : 'guest';
    const list = getUserPracticeHistory(targetId);
    setRecords(list);
  };

  useEffect(() => {
    loadRecords();
    window.addEventListener('typing-history-updated', loadRecords);
    return () => window.removeEventListener('typing-history-updated', loadRecords);
  }, [currentUser]);

  // Compute detailed stats based on records & selectedLanguage
  const stats = useMemo(() => {
    const targetRecords = selectedLanguage === 'all' 
      ? records 
      : records.filter((r) => r.language === selectedLanguage);

    const totalCount = targetRecords.length;

    // Average CPM
    const avgCpm = totalCount > 0
      ? Math.round(targetRecords.reduce((sum, r) => sum + (r.cpm || 0), 0) / totalCount)
      : (currentUser?.averageCpm || 0);

    // Highest CPM
    const recordHighest = targetRecords.length > 0 
      ? Math.max(...targetRecords.map((r) => r.cpm || 0)) 
      : 0;
    const highestCpm = selectedLanguage === 'all'
      ? Math.max(recordHighest, currentUser?.highestCpm || 0)
      : recordHighest;

    // Average Accuracy
    const avgAccuracy = totalCount > 0
      ? (targetRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0) / totalCount).toFixed(1)
      : '100.0';

    const errorRate = (Math.max(0, 100 - parseFloat(avgAccuracy))).toFixed(1);

    // Language specific stats for sub-labels
    const koRecords = records.filter((r) => r.language === 'ko');
    const enRecords = records.filter((r) => r.language === 'en');

    const koAvg = koRecords.length > 0
      ? Math.round(koRecords.reduce((sum, r) => sum + (r.cpm || 0), 0) / koRecords.length)
      : 0;
    const koMax = koRecords.length > 0
      ? Math.max(...koRecords.map((r) => r.cpm || 0))
      : 0;
    const koAcc = koRecords.length > 0
      ? (koRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0) / koRecords.length).toFixed(1)
      : '100.0';

    const enAvg = enRecords.length > 0
      ? Math.round(enRecords.reduce((sum, r) => sum + (r.cpm || 0), 0) / enRecords.length)
      : 0;
    const enMax = enRecords.length > 0
      ? Math.max(...enRecords.map((r) => r.cpm || 0))
      : 0;
    const enAcc = enRecords.length > 0
      ? (enRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0) / enRecords.length).toFixed(1)
      : '100.0';

    // Skill tier assessment based on CPM
    let tierTitle = '새싹 타자';
    let tierColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (highestCpm >= 500) {
      tierTitle = '⚡ 번개손 마스터';
      tierColor = 'text-purple-700 bg-purple-100 border-purple-300';
    } else if (highestCpm >= 400) {
      tierTitle = '🦅 질주하는 매';
      tierColor = 'text-rose-700 bg-rose-100 border-rose-300';
    } else if (highestCpm >= 300) {
      tierTitle = '🐆 빠른 치타';
      tierColor = 'text-amber-800 bg-amber-100 border-amber-300';
    } else if (highestCpm >= 200) {
      tierTitle = '🦌 도약하는 사슴';
      tierColor = 'text-sky-700 bg-sky-100 border-sky-300';
    } else if (highestCpm >= 100) {
      tierTitle = '🐇 달리는 토끼';
      tierColor = 'text-teal-700 bg-teal-100 border-teal-300';
    }

    return {
      totalCount,
      avgCpm,
      highestCpm,
      avgAccuracy,
      errorRate,
      tierTitle,
      tierColor,
      koAvg,
      koMax,
      koAcc,
      koCount: koRecords.length,
      enAvg,
      enMax,
      enAcc,
      enCount: enRecords.length,
    };
  }, [records, selectedLanguage, currentUser]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border-3 border-sky-200 shadow-xl relative overflow-hidden space-y-6 arcade-card-glow">
      {/* Background Decorative Pattern */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-sky-100/50 via-purple-100/30 to-transparent rounded-bl-full pointer-events-none -z-0"></div>

      {/* Header Info with Language Filter Tab */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white text-xs font-black shadow-xs flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{currentUser ? `${currentUser.name} 학생 실시간 타자 통계` : '나의 실시간 타자 통계'}</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-extrabold flex items-center gap-1 ${stats.tierColor}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{stats.tierTitle}</span>
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-2 flex-wrap">
            <span>
              {currentUser ? (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">
                    {currentUser.name} 학생
                  </span>
                  <span>의 타수 · 최고 타수 · 정확도 통계</span>
                </>
              ) : (
                '타자 속도 · 최고 타수 · 정확도 종합 분석 통계'
              )}
            </span>
          </h2>
        </div>

        {/* Language Filter Segmented Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedLanguage('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedLanguage === 'all'
                  ? 'bg-white text-slate-900 shadow-xs scale-102 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 통계
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('ko')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedLanguage === 'ko'
                  ? 'bg-sky-500 text-white shadow-xs scale-102'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇰🇷 한글
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedLanguage === 'en'
                  ? 'bg-indigo-600 text-white shadow-xs scale-102'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇺🇸 영어
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenHistory}
            className="p-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 hover:text-purple-600 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title="전체 연습 상세 로그 보기"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Main Statistics Cards: 총 타자의 타수(평균), 최고 타수, 정확도 */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. 총 타자의 타수 (평균 타자 속도) */}
        <div className="bg-gradient-to-br from-sky-50 to-blue-50/80 rounded-2xl p-4 sm:p-5 border-2 border-sky-200 shadow-xs flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-sky-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-sky-600" />
              <span>총 타자 타수 (평균)</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-sky-200/80 text-sky-900 text-[10px] font-black">
              누적 {stats.totalCount}회
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-sky-700 font-mono tracking-tight">
                {stats.avgCpm}
              </span>
              <span className="text-sm font-bold text-sky-600">CPM (타/분)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-sky-100 text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>한글 {stats.koAvg} CPM</span>
            <span className="text-slate-300">|</span>
            <span>영어 {stats.enAvg} CPM</span>
          </div>
        </div>

        {/* 2. 최고 타수 */}
        <div className="bg-gradient-to-br from-amber-50 to-rose-50/70 rounded-2xl p-4 sm:p-5 border-2 border-amber-200 shadow-xs flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>최고 타수 (최고 기록)</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-black">
              TOP SPEED
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-amber-700 font-mono tracking-tight">
                {stats.highestCpm}
              </span>
              <span className="text-sm font-bold text-amber-600">CPM (타/분)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-100 text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>한글 최고 {stats.koMax} CPM</span>
            <span className="text-slate-300">|</span>
            <span>영어 최고 {stats.enMax} CPM</span>
          </div>
        </div>

        {/* 3. 정확도 */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 rounded-2xl p-4 sm:p-5 border-2 border-emerald-200 shadow-xs flex flex-col justify-between space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>평균 정확도</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-900 text-[10px] font-black">
              {parseFloat(stats.avgAccuracy) >= 95 ? '정밀 타건' : '오타 최소화'}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                {stats.avgAccuracy}%
              </span>
              <span className="text-xs font-bold text-emerald-600">
                (오타율 {stats.errorRate}%)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-100 text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span>한글 {stats.koAcc}%</span>
            <span className="text-slate-300">|</span>
            <span>영어 {stats.enAcc}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
