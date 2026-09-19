import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, 
  Play, 
  Sparkles, 
  Target, 
  Clock,
  Zap,
  Flame,
  Keyboard,
  BookOpen,
  FileText
} from 'lucide-react';
import { AppMode, UserSession, PracticeHistoryRecord } from '../types';
import { dailyMissionsManager, LastPracticeLocation } from '../utils/dailyMissionsManager';
import { getUserPracticeHistory } from '../utils/curriculumManager';
import { RetroStageIcon } from './RetroStageIcons';

interface LastPracticeGuideCardProps {
  currentUser: UserSession | null;
  onSelectMode: (mode: AppMode) => void;
}

export const LastPracticeGuideCard: React.FC<LastPracticeGuideCardProps> = ({
  currentUser,
  onSelectMode,
}) => {
  const [selectedLang, setSelectedLang] = useState<'ko' | 'en'>('ko');
  const [lastPractice, setLastPractice] = useState<LastPracticeLocation | null>(() =>
    dailyMissionsManager.getLastPractice(currentUser?.id)
  );
  const [historyList, setHistoryList] = useState<PracticeHistoryRecord[]>([]);

  // Sync real-time updates
  const refreshPracticeState = () => {
    const saved = dailyMissionsManager.getLastPractice(currentUser?.id);
    setLastPractice(saved);

    const targetId = currentUser ? currentUser.id : 'guest';
    const records = getUserPracticeHistory(targetId);
    setHistoryList(records);
  };

  useEffect(() => {
    refreshPracticeState();

    window.addEventListener('last-practice-updated', refreshPracticeState);
    window.addEventListener('typing-history-updated', refreshPracticeState);

    return () => {
      window.removeEventListener('last-practice-updated', refreshPracticeState);
      window.removeEventListener('typing-history-updated', refreshPracticeState);
    };
  }, [currentUser]);

  // If user practiced recently, sync initial tab
  useEffect(() => {
    if (lastPractice?.language) {
      setSelectedLang(lastPractice.language);
    } else if (historyList.length > 0 && historyList[0].language) {
      setSelectedLang(historyList[0].language);
    }
  }, [lastPractice]);

  // Combined best info for the selected language
  const activePractice = useMemo(() => {
    const targetId = currentUser ? currentUser.id : 'guest';
    const savedLangPractice = dailyMissionsManager.getLastPracticeByLanguage(selectedLang, targetId);
    const langRecord = historyList.find((r) => r.language === selectedLang);

    if (savedLangPractice) {
      return {
        mode: savedLangPractice.mode,
        modeTitle: savedLangPractice.modeTitle,
        stageTitle: savedLangPractice.stageTitle || (selectedLang === 'ko' ? '기본자리' : 'Home Row'),
        stageId: savedLangPractice.stageId,
        language: selectedLang,
        cpm: savedLangPractice.cpm || (langRecord?.cpm) || 0,
        accuracy: savedLangPractice.accuracy || (langRecord?.accuracy) || 100,
        timestamp: savedLangPractice.timestamp || (langRecord?.timestamp) || Date.now(),
        isDefault: false,
      };
    }

    if (langRecord) {
      return {
        mode: langRecord.mode,
        modeTitle: langRecord.modeTitle,
        stageTitle: langRecord.stageTitle,
        stageId: (langRecord as any).stageId || (langRecord as any).categoryId,
        language: selectedLang,
        cpm: langRecord.cpm,
        accuracy: langRecord.accuracy,
        timestamp: langRecord.timestamp,
        isDefault: false,
      };
    }

    // Default stage for this language
    return {
      mode: 'key-practice' as AppMode,
      modeTitle: selectedLang === 'ko' ? '한글 자리 연습' : '영어 자리 연습',
      stageTitle: selectedLang === 'ko' ? '1단계: 기본자리 (ㅁㄴㅇㄹ ㅓㅏㅣ)' : '1단계: 기본자리 (ASDF JKL;)',
      stageId: 1,
      language: selectedLang,
      cpm: 0,
      accuracy: 100,
      timestamp: 0,
      isDefault: true,
    };
  }, [selectedLang, lastPractice, historyList, currentUser]);

  // Format relative time (e.g. 방금 전, 3분 전, 오늘 15:30)
  const timeFormatted = useMemo(() => {
    if (!activePractice || activePractice.isDefault || activePractice.timestamp === 0) return '';
    const diffSec = Math.max(0, Math.floor((Date.now() - activePractice.timestamp) / 1000));
    if (diffSec < 60) return '방금 전';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
    const d = new Date(activePractice.timestamp);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, [activePractice]);

  // Mode icon & theme color mapping
  const getModeDetails = (mode: AppMode) => {
    switch (mode) {
      case 'key-practice':
        return {
          icon: Keyboard,
          colorClass: 'from-sky-500 to-blue-600',
          badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
          accentBorder: 'border-sky-300',
          btnClass: 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white',
        };
      case 'word-practice':
        return {
          icon: BookOpen,
          colorClass: 'from-teal-500 to-emerald-600',
          badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
          accentBorder: 'border-teal-300',
          btnClass: 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white',
        };
      case 'sentence-practice':
        return {
          icon: FileText,
          colorClass: 'from-pink-500 to-rose-600',
          badgeClass: 'bg-pink-100 text-pink-800 border-pink-200',
          accentBorder: 'border-pink-300',
          btnClass: 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white',
        };
      case 'long-practice':
        return {
          icon: FileText,
          colorClass: 'from-purple-500 to-indigo-600',
          badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
          accentBorder: 'border-purple-300',
          btnClass: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white',
        };
      default:
        return {
          icon: Sparkles,
          colorClass: 'from-amber-500 to-orange-600',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          accentBorder: 'border-amber-300',
          btnClass: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white',
        };
    }
  };

  // Mode stage number mapping for RetroStageIcon
  const getStageNumber = (mode: AppMode): 1 | 2 | 3 | 4 | 5 => {
    switch (mode) {
      case 'key-practice':
        return 1;
      case 'word-practice':
        return 2;
      case 'sentence-practice':
        return 3;
      case 'long-practice':
        return 4;
      default:
        return 5;
    }
  };

  const stageNum = getStageNumber(activePractice?.mode || 'key-practice');

  const handleStartShortcut = () => {
    dailyMissionsManager.saveLastPractice({
      mode: activePractice.mode,
      modeTitle: activePractice.modeTitle,
      stageTitle: activePractice.stageTitle,
      language: selectedLang,
      stageId: activePractice.stageId,
      cpm: activePractice.cpm,
      accuracy: activePractice.accuracy,
    }, currentUser?.id);
    onSelectMode(activePractice.mode);
  };

  return (
    <div className="parchment-scroll rounded-2xl p-5 sm:p-7 border-4 border-[#784E3D] shadow-[0_8px_0_#3E2419,0_12px_24px_rgba(0,0,0,0.35)] relative overflow-hidden space-y-5">
      {/* Corner Metal Rivets */}
      <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
      <span className="absolute bottom-2.5 left-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />
      <span className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219]" />

      {/* Top Header Strip with Korean / English Language Selector */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#784E3D]/30 pb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-3.5 py-1 rounded-md bg-[#784E3D] text-[#FFD700] text-xs font-pixel border border-[#3E2419] shadow-[2px_2px_0_#3E2419] flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>[직전 연습 단계 바로가기]</span>
          </span>

          {/* 한글 / 영어 선택 탭 */}
          <div className="inline-flex p-1 rounded-xl bg-[#E6D7B9] border-2 border-[#784E3D] gap-1 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]">
            <button
              type="button"
              onClick={() => setSelectedLang('ko')}
              className={`px-3 py-1.5 rounded-md text-xs font-pixel transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLang === 'ko'
                  ? 'retro-wood-btn text-[#FFD700]'
                  : 'text-[#5C3A21] hover:bg-[#DDD0B0]'
              }`}
            >
              <span>🇰🇷 [한글]</span>
              <span className="text-[10px] opacity-90 font-mono">ST.{stageNum}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('en')}
              className={`px-3 py-1.5 rounded-md text-xs font-pixel transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLang === 'en'
                  ? 'retro-wood-btn text-[#FFD700]'
                  : 'text-[#5C3A21] hover:bg-[#DDD0B0]'
              }`}
            >
              <span>🇺🇸 [영어]</span>
              <span className="text-[10px] opacity-90 font-mono">ST.{stageNum}</span>
            </button>
          </div>
        </div>

        {activePractice && timeFormatted ? (
          <div className="flex items-center gap-1.5 text-xs text-[#5C3A21] font-arcade font-bold">
            <Clock className="w-3.5 h-3.5 text-[#B45309]" />
            <span>{selectedLang === 'ko' ? '한글' : '영어'} 최근 연습: <strong className="text-[#451A03] font-black">{timeFormatted}</strong></span>
          </div>
        ) : (
          <div className="text-xs text-[#92400E] font-pixel font-bold bg-[#FEF3C7] px-2.5 py-1 rounded-md border border-[#B45309]">
            ✨ {selectedLang === 'ko' ? '한글' : '영어'} 모드 선택됨
          </div>
        )}
      </div>

      {/* Main Interactive Guide Area */}
      <div className="relative z-10">
        {/* Last practiced stage summary card */}
        <div className="bg-[#FFFDF5] rounded-xl p-4 sm:p-6 border-3 border-[#784E3D] shadow-[3px_3px_0_#784E3D] space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 p-1 bg-[#E6D7B9] rounded-xl border-2 border-[#784E3D] shadow-xs">
                <RetroStageIcon stage={stageNum} size={56} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-xs text-[11px] font-pixel font-black border border-[#784E3D] bg-[#E6D7B9] text-[#451A03]">
                    {activePractice.modeTitle}
                  </span>
                  <span className={`px-2 py-0.5 rounded-xs text-[11px] font-pixel font-black border border-black text-white ${
                    selectedLang === 'ko' ? 'bg-[#38B6FF]' : 'bg-[#6366F1]'
                  }`}>
                    {selectedLang === 'ko' ? '🇰🇷 한글' : '🇺🇸 영어'}
                  </span>
                  {activePractice.isDefault && (
                    <span className="px-2 py-0.5 rounded-xs bg-[#FEF3C7] border border-[#B45309] text-[#92400E] text-[10px] font-pixel font-black">
                      추천 시작
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#451A03] font-arcade tracking-tight mt-1.5">
                  {activePractice.stageTitle}
                </h3>
              </div>
            </div>
          </div>

          {/* Performance Stats of Last Practice */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-[#FFFDF5] rounded-lg p-3 border-2 border-[#784E3D] shadow-xs">
              <span className="text-[11px] font-pixel text-[#5C3A21] block">직전 타수 (SPEED)</span>
              <span className="text-lg font-mono font-black text-[#0369A1] flex items-center gap-1.5 mt-1">
                <Zap className="w-4 h-4 text-[#0284C7]" />
                {activePractice.cpm > 0 ? `${activePractice.cpm} CPM` : '도전 대기'}
              </span>
            </div>
            <div className="bg-[#FFFDF5] rounded-lg p-3 border-2 border-[#784E3D] shadow-xs">
              <span className="text-[11px] font-pixel text-[#5C3A21] block">직전 정확도 (ACC)</span>
              <span className="text-lg font-mono font-black text-[#047857] flex items-center gap-1.5 mt-1">
                <Target className="w-4 h-4 text-[#059669]" />
                {activePractice.isDefault ? '100%' : `${activePractice.accuracy}%`}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-[#FFFDF5] rounded-lg p-3 border-2 border-[#784E3D] shadow-xs flex flex-col justify-center">
              <span className="text-[11px] font-pixel text-[#5C3A21] block">추천 목표 (TARGET)</span>
              <span className="text-xs font-pixel font-black text-[#B45309] flex items-center gap-1.5 mt-1">
                <Flame className="w-4 h-4 text-[#D97706]" />
                {activePractice.accuracy < 95 && !activePractice.isDefault ? '정확도 95% 이상' : '타수 +20타 올리기'}
              </span>
            </div>
          </div>

          {/* Direct Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleStartShortcut}
              className="flex-1 px-6 py-3 rounded-xl retro-gold-btn text-[#451A03] font-pixel text-sm sm:text-base font-black shadow-[0_4px_0_#78350F] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#451A03]" />
              <span>
                [ 🕹️ {selectedLang === 'ko' ? '한글' : '영어'} 직전 단계 바로 시작 ]
              </span>
            </button>

            <button
              type="button"
              onClick={handleStartShortcut}
              className="px-4 py-3 rounded-xl bg-[#E6D7B9] hover:bg-[#DDD0B0] text-[#5C3A21] border-2 border-[#784E3D] shadow-[2px_2px_0_#784E3D] font-pixel text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="처음부터 다시 연습합니다"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#784E3D]" />
              <span>[처음부터]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
