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
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
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

  const trainingCards = [
    {
      mode: 'key-practice' as AppMode,
      title: '1단계: 자리 연습',
      tag: '새 창 · 키보드 동시 보기',
      badge: '새 창 모드 + 키보드 동시',
      desc: '기본 홈포지션부터 윗자리, 아랫자리, 쌍자음까지 새 창에서 키보드 자판과 사람 손가락 위치를 동시에 보며 마스터!',
      icon: Keyboard,
      level: '1~8단계 체계적 훈련',
      color: 'sky',
      border: 'border-sky-300 hover:border-sky-500 ring-2 ring-sky-100',
      bgIcon: 'bg-sky-100 text-sky-600',
    },
    {
      mode: 'word-practice' as AppMode,
      title: '2단계: 낱말 연습',
      tag: '새 창 · 키보드 동시 보기',
      badge: '새 창 모드 + 키보드 동시',
      desc: '초등 필수 어휘, 동물, 음식, 과학, 영단어를 새 창에서 가상 키보드 자판과 동시 매칭하며 타이핑!',
      icon: BookOpen,
      level: '한글/영어 어휘 테마',
      color: 'mint',
      border: 'border-teal-300 hover:border-teal-500 ring-2 ring-teal-100',
      bgIcon: 'bg-teal-100 text-teal-600',
    },
    {
      mode: 'sentence-practice' as AppMode,
      title: '3단계: 짧은 글 (5분)',
      tag: '새 창 5분 마라톤',
      badge: '새 창 모드',
      desc: '지혜로운 속담과 명언, 동시, 과학 문장뿐 아니라 영문 명언까지! 독립된 새 창에서 5분 연속 완주로 실력 업그레이드!',
      icon: FileText,
      level: '속담/명언/동시/과학',
      color: 'pink',
      border: 'border-pink-300 hover:border-pink-500',
      bgIcon: 'bg-pink-100 text-pink-600',
    },
    {
      mode: 'long-practice' as AppMode,
      title: '4단계: 긴 글 연습',
      tag: '새 창 명작 완독',
      badge: '새 창 모드',
      desc: '황순원의 <소나기>, 생텍쥐페리의 <어린 왕자>, 윤동주의 <별 헤는 밤>, <I Have a Dream> 등 독립된 새 창에서 한/영 명문장 완독!',
      icon: FileText,
      level: '한글/영어 명작 소설 & 수필',
      color: 'purple',
      border: 'border-indigo-300 hover:border-indigo-500 ring-2 ring-indigo-100',
      bgIcon: 'bg-indigo-100 text-indigo-600',
    },
    {
      mode: 'knowledge-hub' as AppMode,
      title: '스페셜: 팡팡 지식 타자',
      tag: '3대 지식 랜드',
      badge: '수도 · 역사 · 가사',
      desc: '세계 수도 71개국 정복, 조선 왕조 27대 국왕 족보 & 업적, K-POP 명곡 가사 챌린지 3대 코스를 미니게임처럼 즐겨보세요!',
      icon: GraduationCap,
      level: '세계지리 · 한국사 & 업적 · 명곡 가사 BGM 풀코스',
      color: 'purple',
      border: 'border-purple-300 hover:border-purple-500 ring-2 ring-purple-100',
      bgIcon: 'bg-purple-100 text-purple-700',
    },
    {
      mode: 'leaderboard' as AppMode,
      title: '5단계: 명예의 전당 (랭킹)',
      tag: '실시간 타수 순위표',
      badge: '명예의 전당',
      desc: '전체 학생 실시간 타자 속도 순위와 동물 칭호 티어를 확인하고 최고 기록에 도전하세요!',
      icon: Trophy,
      level: '실시간 타자 랭킹 순위표',
      color: 'yellow',
      border: 'border-amber-300 hover:border-amber-500 ring-2 ring-amber-100',
      bgIcon: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
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

      {/* RECENT TYPING HISTORY QUICK STRIP */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-md">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-purple-500 rounded-full"></div>
            <h2 className="text-lg font-black text-slate-900 font-arcade flex items-center gap-2">
              <History className="w-5 h-5 text-purple-500" />
              <span>내가 친 최근 타자 기록 (실시간 로그)</span>
            </h2>
            <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
              (최신 기록은 맨 왼쪽에 정렬됩니다)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {recentRecords.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {selectedRecordIds.size === recentRecords.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>전체 선택</span>
                </button>

                {selectedRecordIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="text-xs font-black text-white bg-rose-500 hover:bg-rose-600 flex items-center gap-1 px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer animate-in fade-in"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>선택된 {selectedRecordIds.size}개 삭제</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onOpenHistory}
              className="text-xs font-black text-purple-600 hover:text-purple-700 flex items-center gap-1 hover:underline cursor-pointer ml-1"
            >
              <span>전체 타자 기록 확인 ({recentRecords.length > 0 ? recentRecords.length : 0}건)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentRecords.length === 0 ? (
          <div className="p-8 text-center bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
            <History className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            <p className="text-xs font-extrabold text-slate-700">아직 완료한 타자 연습 기록이 없습니다.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">자리 연습이나 짧은 글 연습을 완료하면 내가 친 문장과 속도가 맨 왼쪽에 실시간으로 기록됩니다.</p>
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
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer space-y-2 flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-purple-100/90 border-2 border-purple-500 shadow-sm'
                      : isNewest
                      ? 'bg-gradient-to-br from-purple-50 via-sky-50/40 to-purple-50/60 border-2 border-purple-400 shadow-sm'
                      : 'bg-purple-50/60 border border-purple-200 hover:border-purple-400 hover:bg-purple-100/50'
                  }`}
                >
                  {/* Leftmost newest badge */}
                  {isNewest && (
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-300" />
                      <span>🔥 가장 최근 (NEW)</span>
                    </div>
                  )}

                  <div>
                    {/* Header with Selection Checkbox and Language/Date */}
                    <div className="flex items-center justify-between text-[10px] font-black mb-1 pt-1">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleToggleSelect(rec.id, e)}
                          className="p-1 rounded-md hover:bg-purple-200/60 transition-colors"
                          title={isSelected ? '선택 해제' : '선택'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                          )}
                        </button>
                        <span className={`px-2 py-0.5 rounded-md ${
                          rec.language === 'ko' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {rec.language === 'ko' ? '🇰🇷 한글' : '🇺🇸 영어'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">{rec.dateStr.split(' ')[0]}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSingle(rec.id, e)}
                          className="opacity-60 group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600 p-1 rounded-md text-slate-400 transition-all ml-1"
                          title="이 기록 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-xs text-slate-800 truncate mt-1">
                      {rec.modeTitle}
                    </h4>
                    {rec.sampleText && (
                      <p className="text-[11px] text-slate-600 font-mono font-medium truncate mt-1 bg-white p-1.5 rounded-lg border border-purple-100">
                        "{rec.sampleText}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-200 text-xs font-black">
                    <span className="text-sky-600">{rec.cpm} CPM</span>
                    <span className="text-teal-600">{rec.accuracy}% 정확</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRAINING STAGES & MODES LIST */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-6 bg-sky-500 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 font-arcade">단계별 타자 학습 코스</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.mode}
                onClick={() => onSelectMode(card.mode)}
                className={`group relative p-5 bg-white rounded-3xl border-2 ${card.border} shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-3 rounded-2xl ${card.bgIcon}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {card.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-black tracking-wider uppercase text-slate-600 mb-1 block">
                    {card.tag}
                  </span>
                  <h3 className="text-base font-black text-slate-900 mb-1.5 group-hover:text-sky-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-700">
                  <span>{card.level}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
