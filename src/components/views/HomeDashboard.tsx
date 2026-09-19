import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  BookOpen, 
  FileText, 
  Zap, 
  Trophy, 
  ArrowRight, 
  Sparkles, 
  Flame, 
  Candy, 
  User, 
  Crown, 
  Gamepad2, 
  CloudRain, 
  HeartHandshake, 
  Heart,
  History,
  TrendingUp,
  CheckCircle2,
  ListOrdered,
  Layers,
  Award,
  Play,
  Clock,
  Trash2,
  CheckSquare,
  Square,
  Globe,
  Landmark,
  GraduationCap
} from 'lucide-react';
import { AppMode, UserSession, PracticeHistoryRecord } from '../../types';
import { CharacterAvatar, DEFAULT_AVATAR_CONFIG } from '../CharacterAvatar';
import { StudentProgressCard } from '../StudentProgressCard';
import { LastPracticeGuideCard } from '../LastPracticeGuideCard';
import { PracticePerformanceChart } from '../PracticePerformanceChart';
import { RetroTapongMascot } from '../RetroTapongMascot';
import { RetroRpgQuestMap } from '../RetroRpgQuestMap';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { soundManager } from '../../utils/sound';
import { 
  getUserPracticeHistory, 
  deletePracticeHistoryRecord, 
  deletePracticeHistoryRecords 
} from '../../utils/curriculumManager';

interface HomeDashboardProps {
  onSelectMode: (mode: AppMode) => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onOpenProfile?: (tab?: 'avatar' | 'account') => void;
  onOpenMaster?: () => void;
  onOpenReport?: () => void;
  onOpenHistory: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onSelectMode,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenMaster,
  onOpenReport,
  onOpenHistory,
}) => {
  const [recentRecords, setRecentRecords] = useState<PracticeHistoryRecord[]>([]);
  const [allUserRecords, setAllUserRecords] = useState<PracticeHistoryRecord[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [lastPractice, setLastPractice] = useState(() =>
    dailyMissionsManager.getLastPractice(currentUser?.id)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setLastPractice(dailyMissionsManager.getLastPractice(currentUser?.id));
    };
    handleUpdate();
    window.addEventListener('last-practice-updated', handleUpdate);
    return () => window.removeEventListener('last-practice-updated', handleUpdate);
  }, [currentUser]);

  const loadSortedRecords = () => {
    const targetId = currentUser ? currentUser.id : 'guest';
    const records = getUserPracticeHistory(targetId);
    setAllUserRecords(records);
    // Explicitly sort newest first (left-most position in grid)
    const sorted = [...records].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    setRecentRecords(sorted.slice(0, 4));
  };

  useEffect(() => {
    loadSortedRecords();
  }, [currentUser]);

  // Listen to typing history updates in real-time
  useEffect(() => {
    const handleUpdated = () => {
      loadSortedRecords();
    };

    window.addEventListener('typing-history-updated', handleUpdated);
    return () => window.removeEventListener('typing-history-updated', handleUpdated);
  }, [currentUser]);

  // Handle single record delete
  const handleDeleteSingle = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('이 연습 기록을 삭제하시겠습니까?')) {
      const targetId = currentUser ? currentUser.id : 'guest';
      deletePracticeHistoryRecord(targetId, recordId);
      setSelectedRecordIds((prev) => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  };

  // Handle toggle selection
  const handleToggleSelect = (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Handle select all / deselect all
  const handleToggleSelectAll = () => {
    if (selectedRecordIds.size === recentRecords.length) {
      setSelectedRecordIds(new Set());
    } else {
      setSelectedRecordIds(new Set(recentRecords.map((r) => r.id)));
    }
  };

  // Handle delete selected records
  const handleDeleteSelected = () => {
    if (selectedRecordIds.size === 0) return;
    if (window.confirm(`선택한 ${selectedRecordIds.size}개의 연습 기록을 삭제하시겠습니까?`)) {
      const targetId = currentUser ? currentUser.id : 'guest';
      deletePracticeHistoryRecords(targetId, Array.from(selectedRecordIds));
      setSelectedRecordIds(new Set());
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 16-BIT RETRO ARCADE HERO BANNER WITH TAPONG MASCOT & PRESS START CTA */}
      <div className="wood-signboard p-5 sm:p-7 rounded-2xl border-4 border-[#3E2419] shadow-[0_8px_0_#20130D,0_12px_24px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Metal Rivet Screws in 4 Corners */}
        <span className="absolute top-2.5 left-2.5 w-3 h-3 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
        <span className="absolute top-2.5 right-2.5 w-3 h-3 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
        <span className="absolute bottom-2.5 left-2.5 w-3 h-3 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />
        <span className="absolute bottom-2.5 right-2.5 w-3 h-3 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left: Mascot Robot Tapong & Title */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <RetroTapongMascot size="md" />
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-xs bg-[#FF4757] text-white text-[10px] font-pixel border border-black shadow-[1px_1px_0_#000] animate-pulse">
                  INSERT COIN
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-[#00D2FF] text-[#0F1026] text-[10px] font-pixel font-black border border-black shadow-[1px_1px_0_#000]">
                  16-BIT RETRO EDITION
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#FFD700] font-pixel tracking-wider pixel-text-shadow">
                타닥타닥 타자랜드 아케이드
              </h1>
              <p className="text-xs sm:text-sm text-[#F5F5DC] font-bold font-arcade leading-relaxed">
                80~90년대 고전 오락실 감성! 자리연습부터 긴글완독까지 16비트 타자 모험 ⚡
              </p>
            </div>
          </div>

          {/* Right: Glowing [ PRESS START ] CTA Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0">
            <button
              onClick={() => {
                soundManager.play('fanfare');
                onSelectMode('key-practice');
              }}
              className="arcade-cta-start px-6 py-3 rounded-xl font-pixel text-sm sm:text-base font-black flex items-center gap-2 cursor-pointer group"
            >
              <span className="text-lg group-hover:scale-125 transition-transform">🕹️</span>
              <span>[ PRESS START ]</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-[11px] font-pixel text-[#E5B55A]">
              ▶ 1단계 자리연습 바로 시작하기
            </span>
          </div>
        </div>
      </div>

      {/* 16-BIT WINDING RPG QUEST MAP (STAGE 1 ~ 5) */}
      <RetroRpgQuestMap onSelectStage={onSelectMode} currentUser={currentUser} />

      {/* STUDENT CURRICULUM ROADMAP & PROGRESS SECTION */}
      <StudentProgressCard
        currentUser={currentUser}
        onSelectMode={onSelectMode}
        onOpenHistory={onOpenHistory}
      />

      {/* LAST PRACTICED STAGE RE-TYPING & RESUME GUIDE CARD */}
      <LastPracticeGuideCard
        currentUser={currentUser}
        onSelectMode={onSelectMode}
      />

      {/* RECHARTS WEEKLY / MONTHLY PRACTICE PERFORMANCE CHART */}
      <PracticePerformanceChart
        records={allUserRecords}
        userName={currentUser?.name || '학생'}
      />

      {/* RECENT TYPING HISTORY QUICK STRIP (RETRO ARCADE SCOREBOARD) */}
      <div className="wood-signboard p-4 sm:p-6 rounded-2xl border-4 border-[#3E2419] shadow-[0_8px_0_#20130D,0_12px_24px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Corner Rivets */}
        <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
        <span className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
        <span className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b-2 border-[#5E3B2E] pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <h2 className="text-base sm:text-lg font-black text-[#FFD700] font-pixel flex items-center gap-2 pixel-text-shadow">
              <span>최근 타자 로그 (RECENT HIGH-SCORES)</span>
            </h2>
            <span className="text-[10px] font-pixel text-[#F5F5DC] hidden sm:inline">
              [최신 기록 좌측 정렬]
            </span>
          </div>

          <div className="flex items-center gap-2">
            {recentRecords.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-pixel text-[#F5F5DC] hover:text-white flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#24170E] border border-[#8C6219] transition-colors cursor-pointer"
                >
                  {selectedRecordIds.size === recentRecords.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#00D2FF]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>전체 선택</span>
                </button>

                {selectedRecordIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="text-xs font-pixel text-white bg-[#FF4757] hover:bg-[#E11D48] flex items-center gap-1 px-3 py-1.5 rounded-lg border border-black shadow-[2px_2px_0_#000] transition-colors cursor-pointer animate-in fade-in"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>선택 {selectedRecordIds.size}개 삭제</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onOpenHistory}
              className="text-xs font-pixel text-[#00D2FF] hover:text-cyan-300 flex items-center gap-1 cursor-pointer ml-1"
            >
              <span>전체 로그 ({recentRecords.length > 0 ? recentRecords.length : 0}건)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center parchment-scroll rounded-xl border-2 border-[#9C7D4E]">
            <History className="w-8 h-8 text-[#9C7D4E] mx-auto mb-2" />
            <p className="text-sm font-black text-[#5E3B2E] font-arcade">아직 완료한 타자 연습 기록이 없습니다.</p>
            <p className="text-xs text-[#784E3D] mt-0.5 font-arcade">자리 연습이나 짧은 글 연습을 완료하면 실시간으로 로그와 속도가 기록됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentRecords.map((rec, idx) => {
              const isSelected = selectedRecordIds.has(rec.id);
              const isNewest = idx === 0;

              return (
                <div
                  key={rec.id}
                  onClick={onOpenHistory}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer space-y-2 flex flex-col justify-between relative group border-2 ${
                    isSelected
                      ? 'bg-[#FEF3C7] border-[#B45309] shadow-[4px_4px_0_#000]'
                      : isNewest
                      ? 'parchment-scroll border-[#B45309] shadow-[4px_4px_0_#000]'
                      : 'parchment-scroll border-[#9C7D4E] shadow-[2px_2px_0_#000] hover:shadow-[4px_4px_0_#000] hover:-translate-y-0.5'
                  }`}
                >
                  {/* Leftmost newest badge */}
                  {isNewest && (
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-xs bg-[#FF4757] text-white text-[9px] font-pixel border border-black shadow-[1px_1px_0_#000] flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#FFD700]" />
                      <span>NEW</span>
                    </div>
                  )}

                  <div>
                    {/* Header with Selection Checkbox and Language/Date */}
                    <div className="flex items-center justify-between text-[10px] font-pixel mb-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(rec.id, e)}
                          className="p-0.5 rounded-xs hover:bg-black/10 transition-colors"
                          title={isSelected ? '선택 해제' : '선택'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#B45309]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <span className={`px-1.5 py-0.5 rounded-xs border border-black font-black ${
                          rec.language === 'ko' ? 'bg-[#38B6FF] text-white' : 'bg-[#6366F1] text-white'
                        }`}>
                          {rec.language === 'ko' ? '🇰🇷 한글' : '🇺🇸 영어'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-600 font-bold">{rec.dateStr.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(rec.id, e)}
                          className="opacity-60 group-hover:opacity-100 hover:text-[#FF4757] p-0.5 text-slate-500 transition-all ml-1"
                          title="이 기록 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-black text-xs text-slate-900 truncate mt-1 font-arcade">
                      {rec.modeTitle}
                    </h4>
                    {rec.sampleText && (
                      <p className="text-[11px] text-slate-700 font-arcade truncate mt-1 bg-white/80 p-1.5 rounded-lg border border-[#9C7D4E]/40">
                        "{rec.sampleText}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#9C7D4E]/40 text-xs font-pixel">
                    <span className="text-[#0284C7] font-black">{rec.cpm} CPM</span>
                    <span className="text-[#059669] font-black">{rec.accuracy}% 정확</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
