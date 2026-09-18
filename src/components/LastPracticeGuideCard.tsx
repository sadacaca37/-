import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, 
  Play, 
  Sparkles, 
  Keyboard, 
  BookOpen, 
  FileText, 
  Target, 
  Clock,
  Zap,
  Flame
} from 'lucide-react';
import { AppMode, UserSession, PracticeHistoryRecord } from '../types';
import { dailyMissionsManager, LastPracticeLocation } from '../utils/dailyMissionsManager';
import { getUserPracticeHistory } from '../utils/curriculumManager';

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

  const modeDetails = getModeDetails(activePractice?.mode || 'key-practice');
  const IconComponent = modeDetails.icon;

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
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border-3 border-amber-200/90 shadow-xl relative overflow-hidden space-y-5 transition-all duration-300 hover:shadow-2xl">
      {/* Decorative bright ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-200/30 via-rose-200/20 to-sky-200/20 rounded-bl-full pointer-events-none -z-0"></div>
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-gradient-to-tr from-sky-200/20 via-pink-200/20 to-transparent rounded-full pointer-events-none -z-0"></div>

      {/* Top Header Strip with Korean / English Language Selector */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs font-black shadow-xs flex items-center gap-1.5 animate-pulse-soft">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>직전 연습 단계 바로가기</span>
          </span>

          {/* 한글 / 영어 선택 탭 */}
          <div className="inline-flex p-1 rounded-2xl bg-amber-100/80 border border-amber-300 gap-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedLang('ko')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLang === 'ko'
                  ? 'bg-sky-500 text-white shadow-xs scale-102'
                  : 'text-slate-700 hover:bg-white/80'
              }`}
            >
              <span>🇰🇷 한글</span>
              <span className="text-[10px] opacity-90">직전 단계</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang('en')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedLang === 'en'
                  ? 'bg-indigo-600 text-white shadow-xs scale-102'
                  : 'text-slate-700 hover:bg-white/80'
              }`}
            >
              <span>🇺🇸 영어</span>
              <span className="text-[10px] opacity-90">직전 단계</span>
            </button>
          </div>
        </div>

        {activePractice && timeFormatted ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedLang === 'ko' ? '한글' : '영어'} 최근 연습: <strong className="text-slate-700 font-bold">{timeFormatted}</strong></span>
          </div>
        ) : (
          <div className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
            ✨ {selectedLang === 'ko' ? '한글' : '영어'} 모드 선택됨
          </div>
        )}
      </div>

      {/* Main Interactive Guide Area */}
      <div className="relative z-10">
        {/* Last practiced stage summary card */}
        <div className="bg-gradient-to-br from-amber-50/70 via-rose-50/40 to-sky-50/50 rounded-2xl p-4 sm:p-6 border-2 border-amber-200/80 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${modeDetails.colorClass} text-white flex items-center justify-center shadow-md shrink-0`}>
                <IconComponent className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-black border ${modeDetails.badgeClass}`}>
                    {activePractice.modeTitle}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-black border ${
                    selectedLang === 'ko' ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-indigo-100 text-indigo-800 border-indigo-300'
                  }`}>
                    {selectedLang === 'ko' ? '🇰🇷 한글 모드' : '🇺🇸 영어 모드'}
                  </span>
                  {activePractice.isDefault && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[11px] font-black">
                      추천 시작 단계
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1.5">
                  {activePractice.stageTitle}
                </h3>
              </div>
            </div>
          </div>

          {/* Performance Stats of Last Practice */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-white/90 rounded-2xl p-3.5 border border-amber-100 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">직전 타수 (속도)</span>
              <span className="text-lg font-black text-sky-600 flex items-center gap-1.5 mt-1">
                <Zap className="w-5 h-5 text-sky-500" />
                {activePractice.cpm > 0 ? `${activePractice.cpm} CPM` : '도전 대기'}
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl p-3.5 border border-amber-100 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 block">직전 정확도</span>
              <span className="text-lg font-black text-emerald-600 flex items-center gap-1.5 mt-1">
                <Target className="w-5 h-5 text-emerald-500" />
                {activePractice.isDefault ? '100%' : `${activePractice.accuracy}%`}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white/90 rounded-2xl p-3.5 border border-amber-100 shadow-2xs flex flex-col justify-center">
              <span className="text-xs font-bold text-slate-500 block">추천 목표</span>
              <span className="text-xs sm:text-sm font-black text-amber-700 flex items-center gap-1.5 mt-1">
                <Flame className="w-4 h-4 text-amber-500" />
                {activePractice.accuracy < 95 && !activePractice.isDefault ? '정확도 95% 이상 달성' : '타수 +20타 올리기'}
              </span>
            </div>
          </div>

          {/* Direct Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleStartShortcut}
              className={`flex-1 px-6 py-3.5 rounded-2xl ${modeDetails.btnClass} font-black text-sm sm:text-base shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border-2 border-white/50`}
            >
              <Play className="w-5 h-5 fill-white" />
              <span>
                🎯 {selectedLang === 'ko' ? '한글' : '영어'} 직전 단계 바로가기 (원클릭 시작)
              </span>
            </button>

            <button
              type="button"
              onClick={handleStartShortcut}
              className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="처음부터 다시 연습합니다"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>처음부터 재도전</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
