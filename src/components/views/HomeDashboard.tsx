import React, { useState, useEffect, lazy, Suspense } from 'react';
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
// 그래프 라이브러리는 커서 따로 불러옴 (첫 화면 속도)
const PracticePerformanceChart = lazy(() => import('../PracticePerformanceChart').then((m) => ({ default: m.PracticePerformanceChart })));
import { TapangHome, RetroFrame } from './TapangHome';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { 
  getUserPracticeHistory, 
  deletePracticeHistoryRecord, 
  deletePracticeHistoryRecords 
} from '../../utils/curriculumManager';
import { askConfirm, showAlert } from '../../utils/dialog';

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

    // 연습은 새 창에서 하므로, 다른 창에서 저장된 기록도 바로 반영 (storage 이벤트 + 창으로 돌아올 때)
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith('typang_history_user_')) handleUpdated();
    };
    window.addEventListener('typing-history-updated', handleUpdated);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', handleUpdated);
    return () => {
      window.removeEventListener('typing-history-updated', handleUpdated);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', handleUpdated);
    };
  }, [currentUser]);

  // Handle single record delete
  const handleDeleteSingle = async (recordId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await askConfirm('이 연습 기록을 삭제하시겠습니까?')) {
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
  const handleDeleteSelected = async () => {
    if (selectedRecordIds.size === 0) return;
    if (await askConfirm(`선택한 ${selectedRecordIds.size}개의 연습 기록을 삭제하시겠습니까?`)) {
      const targetId = currentUser ? currentUser.id : 'guest';
      deletePracticeHistoryRecords(targetId, Array.from(selectedRecordIds));
      setSelectedRecordIds(new Set());
    }
  };


  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* TAPANG HOME (start screen · neon keyboard · quest map · scorecard) */}
      <TapangHome
        currentUser={currentUser}
        records={allUserRecords}
        onSelectMode={onSelectMode}
        onOpenAuth={onOpenAuth}
        onOpenProfile={onOpenProfile}
      />

      {/* 성장 그래프와 최근 기록은 로그인한 학생에게만 보여 줌 */}
      {currentUser && (
      <>
      <RetroFrame variant="arcade" tag="SCORE BOARD" title="성장 그래프">
      {/* RECHARTS WEEKLY / MONTHLY PRACTICE PERFORMANCE CHART */}
      <Suspense fallback={<div className="h-64 rounded-3xl bg-white/70 animate-pulse" />}>
      <PracticePerformanceChart
        records={allUserRecords}
        userName={currentUser?.name || '학생'}
      />
      </Suspense>
      </RetroFrame>

      <RetroFrame variant="grass" tag="SAVE DATA" title="최근 타자 기록">
      {/* RECENT TYPING HISTORY QUICK STRIP */}
      <div className="tp-recent-sheet p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#7c3e14] shrink-0" />
            <h2 className="text-lg font-black text-[#2e1607] font-arcade flex items-center gap-2">
              <span>내가 친 최근 타자 기록 (실시간 로그)</span>
            </h2>
            <span className="text-[11px] font-bold text-[#784b26] hidden sm:inline">
              (최신 기록은 맨 왼쪽에 정렬됩니다)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {recentRecords.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="tp-rpg-btn tp-rpg-btn--wood text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
                >
                  {selectedRecordIds.size === recentRecords.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#ffd54a]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-[#f7e3ba]" />
                  )}
                  <span>전체 선택</span>
                </button>

                {selectedRecordIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="tp-rpg-btn tp-rpg-btn--danger text-xs font-black flex items-center gap-1 px-3 py-1.5 cursor-pointer animate-in fade-in"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>선택된 {selectedRecordIds.size}개 삭제</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onOpenHistory}
              className="tp-rpg-btn tp-rpg-btn--gold text-xs font-black flex items-center gap-1 px-3 py-1.5 cursor-pointer"
            >
              <span>전체 타자 기록 확인 ({recentRecords.length > 0 ? recentRecords.length : 0}건)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentRecords.length === 0 ? (
          <div className="tp-rpg-empty p-7 text-center">
            <History className="w-8 h-8 text-[#9a6232] mx-auto mb-2" />
            <p className="text-xs font-extrabold text-[#3b1e08]">아직 완료한 타자 연습 기록이 없습니다.</p>
            <p className="text-[11px] text-[#6d4522] mt-1">자리 연습이나 짧은 글 연습을 완료하면 내가 친 문장과 속도가 맨 왼쪽에 실시간으로 기록됩니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {recentRecords.map((rec, idx) => {
              const isSelected = selectedRecordIds.has(rec.id);
              const isNewest = idx === 0;

              return (
                <div
                  key={rec.id}
                  onClick={onOpenHistory}
                  className={`tp-rpg-card cursor-pointer space-y-2 flex flex-col justify-between relative group ${
                    isSelected
                      ? 'tp-rpg-card--selected'
                      : isNewest
                      ? 'tp-rpg-card--new'
                      : ''
                  }`}
                >
                  {/* Leftmost newest banner */}
                  {isNewest && (
                    <div className="tp-rpg-new-ribbon">
                      <Flame className="w-3 h-3 text-[#ffe066]" />
                      <span>가장 최근 (NEW)</span>
                    </div>
                  )}

                  <div>
                    {/* Header with Selection Checkbox and Language/Date */}
                    <div className="flex items-center justify-between text-[11px] font-black mb-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(rec.id, e)}
                          className="p-1 rounded-md hover:bg-[#ead4a2] transition-colors"
                          title={isSelected ? '선택 해제' : '선택'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#8c2810]" />
                          ) : (
                            <Square className="w-4 h-4 text-[#7c532d] group-hover:text-[#3b1e08]" />
                          )}
                        </button>
                        <span className="font-bold text-[#5a3212]">
                          {rec.language === 'ko' ? '🇰🇷 한글' : '🇺🇸 영어'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[#78512c] tabular-nums">{rec.dateStr.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(rec.id, e)}
                          className="opacity-70 group-hover:opacity-100 hover:bg-[#fde2dc] hover:text-[#b91c1c] p-1 rounded-md text-[#7c532d] transition-all ml-1"
                          title="이 기록 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-xs text-[#261106] truncate mt-1">
                      {rec.modeTitle}
                    </h4>
                    {rec.sampleText && (
                      <p className="text-[11px] text-[#4b2910] font-mono font-medium truncate mt-1 bg-[#fffaf0] px-2 py-1.5 rounded border border-[#c9a469]">
                        "{rec.sampleText}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#cfa96e] text-xs font-black tabular-nums">
                    <span className="text-[#9a3412]">{rec.cpm} CPM</span>
                    <span className="text-[#166534]">{rec.accuracy}% 정확</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </RetroFrame>
      </>
      )}
    </div>
  );
};
