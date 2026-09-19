import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  History, 
  TrendingUp, 
  Award, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  Clock,
  Keyboard,
  BookOpen,
  FileText,
  Music,
  Lock,
  ShieldAlert,
  KeyRound,
  Target,
  Trophy,
  Flame,
  Star,
  Gauge,
  CheckSquare,
  Square
} from 'lucide-react';
import { UserSession, PracticeHistoryRecord, AppMode } from '../types';
import { 
  getUserPracticeHistory, 
  clearUserPracticeHistory, 
  verifyMasterAuth,
  deletePracticeHistoryRecord,
  deletePracticeHistoryRecords 
} from '../utils/curriculumManager';
import { WeeklyProgressChart } from './WeeklyProgressChart';
import { ParchmentModalContainer } from './ParchmentModalContainer';

interface PracticeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onSelectMode: (mode: AppMode) => void;
}

// Speed Tier Animal Badges for intuitive kid-friendly visuals
interface SpeedTier {
  minCpm: number;
  maxCpm: number;
  emoji: string;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  progressBarColor: string;
}

const SPEED_TIERS: SpeedTier[] = [
  { minCpm: 0, maxCpm: 99, emoji: '🐢', title: '아기 거북이', subtitle: '차근차근 자리를 익히는 타자 새싹 단계', badgeBg: 'bg-emerald-50', badgeText: 'text-emerald-800', badgeBorder: 'border-emerald-300', progressBarColor: 'from-emerald-400 to-teal-500' },
  { minCpm: 100, maxCpm: 199, emoji: '🐰', title: '날쌘 토끼', subtitle: '손가락 위치를 완벽하게 기억하며 도약 중!', badgeBg: 'bg-sky-50', badgeText: 'text-sky-800', badgeBorder: 'border-sky-300', progressBarColor: 'from-sky-400 to-blue-500' },
  { minCpm: 200, maxCpm: 299, emoji: '🐱', title: '질풍 고양이', subtitle: '낱말과 문장을 거침없이 타이핑하는 실력자', badgeBg: 'bg-purple-50', badgeText: 'text-purple-800', badgeBorder: 'border-purple-300', progressBarColor: 'from-purple-400 to-indigo-500' },
  { minCpm: 300, maxCpm: 399, emoji: '🦅', title: '바람 독수리', subtitle: '눈보다 빠른 속도로 화면을 질주하는 고수', badgeBg: 'bg-amber-50', badgeText: 'text-amber-800', badgeBorder: 'border-amber-300', progressBarColor: 'from-amber-400 to-orange-500' },
  { minCpm: 400, maxCpm: 499, emoji: '🚀', title: '번개 로켓', subtitle: '초광속 스피드로 오타 없이 치는 마스터!', badgeBg: 'bg-rose-50', badgeText: 'text-rose-800', badgeBorder: 'border-rose-300', progressBarColor: 'from-rose-400 to-pink-500' },
  { minCpm: 500, maxCpm: 9999, emoji: '👑', title: '불꽃 타자왕', subtitle: '전국 최고 랭킹의 전설적인 타이핑 챔피언', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-950', badgeBorder: 'border-yellow-400', progressBarColor: 'from-yellow-400 via-amber-500 to-red-500' },
];

export const PracticeHistoryModal: React.FC<PracticeHistoryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectMode,
}) => {
  const [historyList, setHistoryList] = useState<PracticeHistoryRecord[]>([]);
  const [filterLang, setFilterLang] = useState<'all' | 'ko' | 'en'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'key' | 'word' | 'sentence' | 'rhythm'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHistoryTab, setActiveHistoryTab] = useState<'chart' | 'list'>('chart');
  
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // Master Auth Modal state for resetting history
  const [showMasterAuthModal, setShowMasterAuthModal] = useState(false);
  const [masterInputPw, setMasterInputPw] = useState('');
  const [masterAuthError, setMasterAuthError] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const loadHistory = () => {
    const targetId = currentUser ? currentUser.id : 'guest';
    const records = getUserPracticeHistory(targetId);
    setHistoryList(records);
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setMasterAuthError('');
      setResetSuccessMsg('');
      setShowMasterAuthModal(false);
      setSelectedRecordIds(new Set());
    }
  }, [isOpen, currentUser]);

  // Listen for real-time history updates
  useEffect(() => {
    const handleUpdate = () => loadHistory();
    window.addEventListener('typing-history-updated', handleUpdate);
    return () => window.removeEventListener('typing-history-updated', handleUpdate);
  }, [currentUser]);

  const handleToggleSelect = (recordId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedRecordIds.size === filteredList.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(filteredList.map((r) => r.id)));
    }
  };

  const handleDeleteSingle = (recordId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('이 연습 기록을 삭제하시겠습니까?')) {
      const targetId = currentUser ? currentUser.id : 'guest';
      deletePracticeHistoryRecord(targetId, recordId);
      setSelectedRecordIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
      loadHistory();
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRecordIds.size === 0) return;
    if (window.confirm(`선택한 ${selectedRecordIds.size}개의 기록을 삭제하시겠습니까?`)) {
      const targetId = currentUser ? currentUser.id : 'guest';
      deletePracticeHistoryRecords(targetId, Array.from(selectedRecordIds));
      setSelectedRecordIds(new Set());
      loadHistory();
    }
  };

  const isMasterUser = currentUser?.role === 'master' || currentUser?.studentId === 'master' || currentUser?.name === '관리자';

  const handleOpenClearModal = () => {
    if (!currentUser) return;
    setMasterInputPw('');
    setMasterAuthError('');
    setShowMasterAuthModal(true);
  };

  const handleConfirmMasterClear = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser) return;

    if (isMasterUser || verifyMasterAuth(masterInputPw)) {
      clearUserPracticeHistory(currentUser.id);
      setHistoryList([]);
      setShowMasterAuthModal(false);
      setResetSuccessMsg('✅ 마스터 권한으로 타자 기록이 안전하게 초기화되었습니다.');
      setTimeout(() => setResetSuccessMsg(''), 4000);
    } else {
      setMasterAuthError('마스터 비밀번호가 올바르지 않습니다. (권한 없음)');
    }
  };

  // Filtered records
  const filteredList = useMemo(() => {
    return historyList.filter((item) => {
      if (filterLang !== 'all' && item.language !== filterLang) return false;
      if (filterMode === 'key' && !item.mode.includes('key')) return false;
      if (filterMode === 'word' && !item.mode.includes('word')) return false;
      if (filterMode === 'sentence' && !item.mode.includes('sentence')) return false;
      if (filterMode === 'rhythm' && !item.mode.includes('rhythm')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = (item.sampleText || '').toLowerCase().includes(q);
        const matchTitle = item.modeTitle.toLowerCase().includes(q) || (item.stageTitle || '').toLowerCase().includes(q);
        return matchText || matchTitle;
      }
      return true;
    });
  }, [historyList, filterLang, filterMode, searchQuery]);

  // Calculate aggregates
  const totalPracticeCount = historyList.length;
  const avgCpm = totalPracticeCount > 0 ? Math.round(historyList.reduce((acc, cur) => acc + cur.cpm, 0) / totalPracticeCount) : 0;
  const maxCpm = totalPracticeCount > 0 ? Math.max(...historyList.map((h) => h.cpm)) : 0;
  const avgAccuracy = totalPracticeCount > 0 ? Math.round(historyList.reduce((acc, cur) => acc + cur.accuracy, 0) / totalPracticeCount) : 100;
  const totalKeystrokes = historyList.reduce((acc, cur) => acc + (cur.totalKeystrokes || 0), 0);

  // Speed Tier Determination
  const currentTier = useMemo(() => {
    return SPEED_TIERS.find((t) => avgCpm >= t.minCpm && avgCpm <= t.maxCpm) || SPEED_TIERS[0];
  }, [avgCpm]);

  const nextTier = useMemo(() => {
    const currentIndex = SPEED_TIERS.findIndex((t) => t.title === currentTier.title);
    return currentIndex < SPEED_TIERS.length - 1 ? SPEED_TIERS[currentIndex + 1] : null;
  }, [currentTier]);

  // Progress to next tier
  const tierProgress = useMemo(() => {
    if (!nextTier) return 100;
    const range = nextTier.minCpm - currentTier.minCpm;
    const progress = avgCpm - currentTier.minCpm;
    return Math.min(100, Math.max(10, Math.round((progress / range) * 100)));
  }, [currentTier, nextTier, avgCpm]);

  // Recent 8 Practice Records for Visual Speed Trend
  const recentHistory = useMemo(() => {
    return [...historyList].slice(0, 8).reverse();
  }, [historyList]);

  if (!isOpen) return null;

  return (
    <ParchmentModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title="내 타자 기록장"
      badge={currentUser?.name || '게스트'}
      subtitle="내가 연습한 속도(CPM), 정확도, 동물 칭호를 한눈에 직관적으로 확인하세요!"
      icon={<History className="w-5 h-5 text-[#FFD700]" />}
      actions={
        totalPracticeCount > 0 ? (
          <button
            onClick={handleOpenClearModal}
            className="text-[11px] text-[#5C3A21] hover:text-rose-700 flex items-center gap-1 font-pixel transition-colors cursor-pointer bg-[#FFFDF5] hover:bg-rose-50 px-2.5 py-1 rounded-md border border-[#784E3D] shadow-xs"
            title="마스터 비밀번호 인증 후 기록 초기화가 가능합니다."
          >
            <Lock className="w-3.5 h-3.5 text-[#B45309]" />
            <span>[기록 초기화]</span>
          </button>
        ) : undefined
      }
    >
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 font-pixel text-[#451A03]">

        {/* Success Message Banner */}
        {resetSuccessMsg && (
          <div className="mt-3 p-3 bg-teal-50 border-2 border-teal-200 text-teal-800 rounded-2xl text-xs font-black flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{resetSuccessMsg}</span>
          </div>
        )}

        {/* =========================================================================
            1. INTUITIVE SPEED TIER & ANIMAL HERO BANNER
           ========================================================================= */}
        <div className={`mt-3 p-3.5 sm:p-4 rounded-3xl border-3 ${currentTier.badgeBorder} ${currentTier.badgeBg} shadow-sm flex flex-col md:flex-row items-center justify-between gap-4`}>
          {/* Left: Animal Character Icon & Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-4xl shrink-0">
              {currentTier.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 uppercase">
                  나의 타자 등급
                </span>
                <span className="text-xs font-black text-amber-600">
                  평균 {avgCpm} 타/분
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-arcade mt-0.5">
                {currentTier.title}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {currentTier.subtitle}
              </p>
            </div>
          </div>

          {/* Right: Next Tier Level Up Progress */}
          {nextTier && (
            <div className="w-full md:w-64 bg-white/90 p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1.5">
                <span className="flex items-center gap-1">
                  <span>다음 목표:</span>
                  <span className="text-sm">{nextTier.emoji}</span>
                  <span className="text-sky-700 font-extrabold">{nextTier.title}</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {nextTier.minCpm}타까지 {Math.max(0, nextTier.minCpm - avgCpm)}타 남음
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-300">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${currentTier.progressBarColor} transition-all duration-500`}
                  style={{ width: `${tierProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs: Chart vs List */}
        <div className="flex items-center gap-2 pt-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveHistoryTab('chart')}
            className={`px-4 py-2 text-xs font-black rounded-t-2xl border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeHistoryTab === 'chart'
                ? 'bg-white text-purple-700 border-purple-300 -mb-[2px] shadow-xs'
                : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span>주간 성장 그래프 (CPM 통계)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveHistoryTab('list')}
            className={`px-4 py-2 text-xs font-black rounded-t-2xl border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeHistoryTab === 'list'
                ? 'bg-white text-sky-700 border-sky-300 -mb-[2px] shadow-xs'
                : 'bg-slate-100 text-slate-500 border-transparent hover:bg-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>상세 기록 목록 ({historyList.length}건)</span>
          </button>
        </div>

        {activeHistoryTab === 'chart' ? (
          <div className="pt-3">
            <WeeklyProgressChart 
              records={historyList} 
              userName={currentUser?.name || '학생'} 
            />
          </div>
        ) : (
          <>
        {/* =========================================================================
            2. CUTE & INTUITIVE STATS CARDS GRID (With Simple Icons & Colors)
           ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-3">
          {/* Card 1: 총 연습 횟수 */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-sky-50 to-white border-2 border-sky-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              📊
            </div>
            <div>
              <span className="text-[11px] font-bold text-sky-700 block">총 연습 횟수</span>
              <div className="text-lg sm:text-xl font-black text-sky-950 font-mono">
                {totalPracticeCount} <span className="text-xs font-bold text-sky-600 font-sans">회</span>
              </div>
            </div>
          </div>

          {/* Card 2: 평균 타수 */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-teal-50 to-white border-2 border-teal-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              ⚡
            </div>
            <div>
              <span className="text-[11px] font-bold text-teal-700 block">평균 속도</span>
              <div className="text-lg sm:text-xl font-black text-teal-950 font-mono">
                {avgCpm} <span className="text-xs font-bold text-teal-600 font-sans">타/분</span>
              </div>
            </div>
          </div>

          {/* Card 3: 최고 타수 */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-amber-50 to-white border-2 border-amber-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center text-xl shadow-xs shrink-0">
              🏆
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-800 block">최고 기록</span>
              <div className="text-lg sm:text-xl font-black text-amber-950 font-mono">
                {maxCpm} <span className="text-xs font-bold text-amber-700 font-sans">타/분</span>
              </div>
            </div>
          </div>

          {/* Card 4: 평균 정확도 */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-pink-50 to-white border-2 border-pink-200 shadow-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              🎯
            </div>
            <div>
              <span className="text-[11px] font-bold text-pink-700 block">평균 정확도</span>
              <div className="text-lg sm:text-xl font-black text-pink-950 font-mono">
                {avgAccuracy} <span className="text-xs font-bold text-pink-600 font-sans">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. RECENT SPEED TREND MINI VISUAL BAR GRAPH
           ========================================================================= */}
        {recentHistory.length >= 2 && (
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-2">
              <span className="flex items-center gap-1 text-slate-800">
                <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                <span>최근 {recentHistory.length}회 타수 변화 그래프</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">오른쪽이 가장 최근 연습입니다</span>
            </div>

            <div className="flex items-end gap-2 h-14 pt-2 px-2">
              {recentHistory.map((rec, i) => {
                const maxVal = Math.max(100, maxCpm);
                const heightPercent = Math.max(15, Math.min(100, Math.round((rec.cpm / maxVal) * 100)));
                const isLatest = i === recentHistory.length - 1;

                return (
                  <div key={rec.id || i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                      {rec.cpm}타 ({rec.accuracy}%)
                    </div>

                    <div className="w-full bg-slate-200 rounded-t-lg overflow-hidden flex items-end h-10">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          isLatest
                            ? 'bg-gradient-to-t from-sky-500 to-teal-400 shadow-sm animate-pulse'
                            : 'bg-gradient-to-t from-sky-400 to-sky-300'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-black text-slate-600 font-mono">
                      {rec.cpm}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2.5 pt-1">
          {/* Language and Mode Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
            {/* Language filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setFilterLang('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filterLang === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => setFilterLang('ko')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filterLang === 'ko' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                🇰🇷 한글
              </button>
              <button
                type="button"
                onClick={() => setFilterLang('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filterLang === 'en' ? 'bg-indigo-500 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                🇺🇸 영어
              </button>
            </div>

            {/* Mode filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                전체 코스
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('key')}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'key' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                <span>⌨️ 자리</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('word')}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'word' ? 'bg-teal-500 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                <span>📖 낱말</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('sentence')}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  filterMode === 'sentence' ? 'bg-pink-500 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                <span>📝 짧은글</span>
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-52 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="친 내용 검색..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold focus:outline-hidden focus:border-sky-400"
            />
          </div>
        </div>

        {/* Selection & Batch Delete Bar */}
        {filteredList.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {selectedRecordIds.size === filteredList.length && filteredList.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-purple-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>전체 선택 ({selectedRecordIds.size}/{filteredList.length})</span>
              </button>
            </div>

            {selectedRecordIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-black flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>선택된 기록 {selectedRecordIds.size}개 삭제</span>
              </button>
            )}
          </div>
        )}

        {/* History List Scrollable View */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[200px]">
          {filteredList.length === 0 ? (
            <div className="py-12 text-center space-y-3 text-slate-400">
              <div className="text-4xl">📝</div>
              <p className="text-xs font-bold">
                {searchQuery
                  ? '검색어와 일치하는 타자 기록이 없습니다.'
                  : '아직 기록된 타자 연습 내역이 없습니다.\n지금 바로 자리 또는 낱말 연습을 시작해 보세요!'}
              </p>
            </div>
          ) : (
            filteredList.map((item) => {
              const isSelected = selectedRecordIds.has(item.id);
              // Icon for mode
              let modeIcon = '⌨️';
              let modeColor = 'bg-sky-100 text-sky-800 border-sky-200';
              if (item.mode.includes('word')) {
                modeIcon = '📖';
                modeColor = 'bg-teal-100 text-teal-800 border-teal-200';
              } else if (item.mode.includes('sentence') || item.mode.includes('long')) {
                modeIcon = '📝';
                modeColor = 'bg-pink-100 text-pink-800 border-pink-200';
              } else if (item.mode.includes('rhythm')) {
                modeIcon = '🎵';
                modeColor = 'bg-purple-100 text-purple-800 border-purple-200';
              }

              // Visual Accuracy Rating Stars
              const isPerfect = item.accuracy === 100;
              const isGreat = item.accuracy >= 90;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all space-y-2 shadow-2xs ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/50'
                      : 'border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50/20'
                  }`}
                >
                  {/* Header Strip */}
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelect(item.id, e)}
                        className="p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title={isSelected ? '선택 해제' : '선택'}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-purple-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <span className={`px-2 py-0.5 rounded-lg font-black text-xs border flex items-center gap-1 ${modeColor}`}>
                        <span>{modeIcon}</span>
                        <span>{item.modeTitle}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        item.language === 'ko' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {item.language === 'ko' ? '한글' : '영어'}
                      </span>

                      <span className="text-[11px] text-slate-400 font-medium">
                        • {item.dateStr}
                      </span>
                    </div>

                    {/* Rating Stamp & Individual Delete */}
                    <div className="flex items-center gap-2 text-xs font-black">
                      {isPerfect ? (
                        <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full border border-yellow-300 flex items-center gap-1">
                          <span>⭐ 100점 완벽!</span>
                        </span>
                      ) : isGreat ? (
                        <span className="text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-300 flex items-center gap-1">
                          <span>✨ 우수</span>
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          👍 연습 완료
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDeleteSingle(item.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="이 기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* What I Typed (Sample Text) */}
                  {item.sampleText && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800 select-all">
                      "{item.sampleText}"
                    </div>
                  )}

                  {/* Detailed Performance Metrics */}
                  <div className="flex items-center justify-between text-xs font-black flex-wrap gap-3 pt-0.5">
                    <div className="flex items-center gap-3.5 text-slate-600 flex-wrap">
                      <span className="flex items-center gap-1 bg-sky-50 text-sky-800 px-2.5 py-1 rounded-xl border border-sky-200">
                        <span>⚡</span>
                        <span>속도:</span>
                        <strong className="text-sky-700 font-mono text-sm">{item.cpm}</strong>
                        <span className="text-[10px] text-sky-600">CPM</span>
                      </span>

                      <span className="flex items-center gap-1 bg-teal-50 text-teal-800 px-2.5 py-1 rounded-xl border border-teal-200">
                        <span>🎯</span>
                        <span>정확도:</span>
                        <strong className="text-teal-700 font-mono text-sm">{item.accuracy}%</strong>
                      </span>

                      <span className="flex items-center gap-1 text-slate-400 font-medium hidden sm:inline-flex">
                        <Clock className="w-3 h-3" />
                        {item.elapsedSeconds}초 소요
                      </span>

                      {item.errorCount !== undefined && item.errorCount > 0 && (
                        <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200 text-[11px] font-bold">
                          오타 {item.errorCount}회
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectMode(item.mode);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-500 hover:text-white text-slate-700 border border-slate-300 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>다시 연습하기</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>
        )}

        {/* Master Auth Security Modal for History Reset */}
        {showMasterAuthModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-4 border-amber-300 relative space-y-4 arcade-card-glow">
              <button
                type="button"
                onClick={() => setShowMasterAuthModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border-2 border-amber-300 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 font-arcade">
                    🔒 마스터 전용 기록 초기화
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    학생의 기록 삭제는 선생님(마스터) 승인이 필요합니다.
                  </p>
                </div>
              </div>

              {masterAuthError && (
                <div className="p-3 bg-rose-50 border-2 border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{masterAuthError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmMasterClear} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>마스터 비밀번호 입력</span>
                    <span className="text-[10px] text-amber-600 font-bold">마스터 전용</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      autoFocus
                      value={masterInputPw}
                      onChange={(e) => setMasterInputPw(e.target.value)}
                      placeholder="마스터 관리자 비밀번호 입력"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 text-xs sm:text-sm font-bold bg-amber-50/40 outline-hidden"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    초기화 시 <strong>{currentUser?.name || '학생'}</strong>의 모든 타자 연습 및 속도 기록이 영구 삭제됩니다.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMasterAuthModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>기록 초기화 승인</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ParchmentModalContainer>
  );
};

