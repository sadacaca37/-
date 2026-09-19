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
    <div className="parchment-scroll rounded-2xl p-5 sm:p-7 border-4 border-[#784E3D] shadow-[0_8px_0_#3E2419,0_12px_24px_rgba(0,0,0,0.35)] relative overflow-hidden space-y-6">
      {/* Corner Metal Rivets */}
      <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
      <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
      <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />

      {/* Header Info with Language Filter Tab */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#784E3D]/30 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-md bg-[#784E3D] text-[#FFD700] text-xs font-pixel border border-[#3E2419] shadow-[2px_2px_0_#3E2419] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{currentUser ? `${currentUser.name} 학생 실시간 타자 통계` : '나의 실시간 타자 통계'}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#FFFDF5] border-2 border-[#784E3D] text-xs font-pixel text-[#451A03] flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
              <span>{stats.tierTitle}</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-[#451A03] font-arcade mt-2 flex items-center gap-2 flex-wrap">
            <span>
              {currentUser ? (
                <>
                  <span className="text-[#B45309]">
                    [{currentUser.name} 학생]
                  </span>
                  <span> 실시간 타수 · 최고 타수 · 정확도 분석</span>
                </>
              ) : (
                '타자 속도 · 최고 타수 · 정확도 종합 분석 통계'
              )}
            </span>
          </h2>
        </div>

        {/* Language Filter Segmented Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-[#E6D7B9] border-2 border-[#784E3D] gap-1 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">
            <button
              type="button"
              onClick={() => setSelectedLanguage('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-pixel transition-all cursor-pointer ${
                selectedLanguage === 'all'
                  ? 'retro-wood-btn text-[#FFD700]'
                  : 'text-[#5C3A21] hover:bg-[#DDD0B0]'
              }`}
            >
              [전체]
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('ko')}
              className={`px-3 py-1.5 rounded-md text-xs font-pixel transition-all cursor-pointer ${
                selectedLanguage === 'ko'
                  ? 'retro-wood-btn text-[#FFD700]'
                  : 'text-[#5C3A21] hover:bg-[#DDD0B0]'
              }`}
            >
              🇰🇷 [한글]
            </button>
            <button
              type="button"
              onClick={() => setSelectedLanguage('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-pixel transition-all cursor-pointer ${
                selectedLanguage === 'en'
                  ? 'retro-wood-btn text-[#FFD700]'
                  : 'text-[#5C3A21] hover:bg-[#DDD0B0]'
              }`}
            >
              🇺🇸 [영어]
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-[#FFFDF5] hover:bg-[#FEF3C7] text-[#784E3D] border-2 border-[#784E3D] shadow-[2px_2px_0_#784E3D] transition-transform active:translate-y-0.5 cursor-pointer"
            title="전체 연습 상세 로그 보기"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Main Statistics Cards: 총 타자의 타수(평균), 최고 타수, 정확도 */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. 총 타자의 타수 (평균 타자 속도) */}
        <div className="bg-[#FFFDF5] rounded-xl p-4 sm:p-5 border-3 border-[#784E3D] shadow-[3px_3px_0_#784E3D] flex flex-col justify-between space-y-2 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-pixel text-[#451A03] flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#0284C7]" />
              <span>평균 타속 (SPEED)</span>
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-[#E0F2FE] border border-[#0284C7] text-[#0369A1] text-[10px] font-pixel font-bold">
              누적 {stats.totalCount}회
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#0369A1] font-mono tracking-tight">
                {stats.avgCpm}
              </span>
              <span className="text-xs font-bold text-[#0284C7] font-pixel">CPM (타/분)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#784E3D]/20 text-[11px] font-arcade font-bold text-[#5C3A21] flex items-center justify-between">
            <span>한글 {stats.koAvg} CPM</span>
            <span className="text-[#CBB58F]">|</span>
            <span>영어 {stats.enAvg} CPM</span>
          </div>
        </div>

        {/* 2. 최고 타수 */}
        <div className="bg-[#FFFDF5] rounded-xl p-4 sm:p-5 border-3 border-[#B45309] shadow-[3px_3px_0_#B45309] flex flex-col justify-between space-y-2 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-pixel text-[#92400E] flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-[#D97706]" />
              <span>최고 기록 (TOP SPEED)</span>
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-[#FEF3C7] border border-[#B45309] text-[#92400E] text-[10px] font-pixel font-bold">
              👑 BEST
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#B45309] font-mono tracking-tight">
                {stats.highestCpm}
              </span>
              <span className="text-xs font-bold text-[#D97706] font-pixel">CPM (타/분)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#B45309]/20 text-[11px] font-arcade font-bold text-[#5C3A21] flex items-center justify-between">
            <span>한글 최고 {stats.koMax} CPM</span>
            <span className="text-[#CBB58F]">|</span>
            <span>영어 최고 {stats.enMax} CPM</span>
          </div>
        </div>

        {/* 3. 정확도 */}
        <div className="bg-[#FFFDF5] rounded-xl p-4 sm:p-5 border-3 border-[#047857] shadow-[3px_3px_0_#047857] flex flex-col justify-between space-y-2 hover:-translate-y-0.5 transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-pixel text-[#065F46] flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#059669]" />
              <span>정확도 (ACCURACY)</span>
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-[#D1FAE5] border border-[#059669] text-[#065F46] text-[10px] font-pixel font-bold">
              {parseFloat(stats.avgAccuracy) >= 95 ? '정밀 타건' : '오타 최소화'}
            </span>
          </div>

          <div className="pt-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-[#047857] font-mono tracking-tight">
                {stats.avgAccuracy}%
              </span>
              <span className="text-xs font-bold text-[#059669] font-pixel">
                (오타율 {stats.errorRate}%)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#047857]/20 text-[11px] font-arcade font-bold text-[#5C3A21] flex items-center justify-between">
            <span>한글 {stats.koAcc}%</span>
            <span className="text-[#CBB58F]">|</span>
            <span>영어 {stats.enAcc}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
