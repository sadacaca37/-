import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Feather, 
  Shuffle, 
  Check,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Award,
  Trophy
} from 'lucide-react';
import { LONG_TEXT_LIST, LongTextItem } from '../../data/longTextData';
import { TypingStats, UserSession, LeaderboardEntry } from '../../types';
import { soundManager } from '../../utils/sound';
import { countKeystrokes, isHangulPrefix } from '../../utils/hangul';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { recordPracticeHistory } from '../../utils/curriculumManager';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { newAgeBgmEngine, NEW_AGE_TRACKS } from '../../utils/newAgeBgmEngine';
import { MychewRewardModal } from '../MychewRewardModal';

interface LongTextPracticeViewProps {
  currentUser: UserSession | null;
  onRecordScore?: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  initialLanguage?: 'ko' | 'en';
}

type CategoryFilter = 'all' | 'poem' | 'novel' | 'quote';

// Helper to strip Hanja characters completely from long text typing practice while preserving newlines
export const cleanHanja = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/\([\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\s·,]+\)/g, '')
    .replace(/[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/g, '')
    .replace(/[^\S\r\n]{2,}/g, ' ')
    .trim();
};

export const LongTextPracticeView: React.FC<LongTextPracticeViewProps> = ({
  currentUser,
  onRecordScore,
  initialLanguage = 'ko',
}) => {
  const savedLastPractice = useMemo(() => dailyMissionsManager.getLastPractice(currentUser?.id), [currentUser]);

  const defaultLang = (savedLastPractice && savedLastPractice.mode === 'long-practice' && savedLastPractice.language)
    ? savedLastPractice.language
    : initialLanguage;

  const defaultTextId = (savedLastPractice && savedLastPractice.mode === 'long-practice' && typeof savedLastPractice.stageId === 'string')
    ? savedLastPractice.stageId
    : undefined;

  const [language, setLanguage] = useState<'ko' | 'en'>(defaultLang);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');

  // Filter texts by language and category
  const availableTexts = useMemo(() => {
    let list = LONG_TEXT_LIST.filter((item) => item.language === language);
    if (selectedCategory === 'poem') {
      list = list.filter((item) => item.category === 'poem');
    } else if (selectedCategory === 'novel') {
      list = list.filter((item) => item.category === 'novel');
    } else if (selectedCategory === 'quote') {
      list = list.filter((item) => item.category === 'quote' || item.category === 'essay' || item.category === 'speech');
    }
    return list;
  }, [language, selectedCategory]);

  const [selectedTextId, setSelectedTextId] = useState<string>(() => {
    if (defaultTextId && LONG_TEXT_LIST.some((t) => t.id === defaultTextId)) {
      return defaultTextId;
    }
    return availableTexts[0]?.id || 'ko-seosi';
  });

  const currentText = useMemo(() => {
    return availableTexts.find((t) => t.id === selectedTextId) || availableTexts[0] || LONG_TEXT_LIST[0];
  }, [availableTexts, selectedTextId]);

  // When language or category filter changes, ensure valid selected text
  useEffect(() => {
    if (availableTexts.length > 0 && !availableTexts.some(t => t.id === selectedTextId)) {
      setSelectedTextId(availableTexts[0].id);
      setPageIndex(0);
      setInputVal('');
      resetSessionStats();
    }
  }, [availableTexts, selectedTextId]);

  // Page index (Each page is a clean, continuous paragraph/stanza without internal splitting)
  const [pageIndex, setPageIndex] = useState<number>(0);
  const totalPages = Math.max(1, currentText.paragraphs.length);

  // Target text for current page is the clean text without artificial sub-card splitting
  const targetPageText = useMemo(() => {
    const raw = currentText.paragraphs[pageIndex] || currentText.paragraphs[0] || '';
    return cleanHanja(raw);
  }, [currentText, pageIndex]);

  const [inputVal, setInputVal] = useState<string>('');

  // Page turning animation states
  const [pageTurnDirection, setPageTurnDirection] = useState<'next' | 'prev' | null>(null);
  const [isPageTurning, setIsPageTurning] = useState<boolean>(false);

  // MyChew Record High Score Reward
  const bestCpmKey = `pangpang_best_long_cpm_${currentUser?.id || 'guest'}_${language}`;
  const [bestCpm, setBestCpm] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(bestCpmKey) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [showMychewModal, setShowMychewModal] = useState(false);
  const [rewardStats, setRewardStats] = useState<{ cpm: number; prevBest: number; accuracy: number }>({
    cpm: 0,
    prevBest: 0,
    accuracy: 100,
  });

  const [rewardEvaluation, setRewardEvaluation] = useState<{
    evaluated: boolean;
    isFirst: boolean;
    isBeat: boolean;
    prevBest: number;
  }>({
    evaluated: false,
    isFirst: false,
    isBeat: false,
    prevBest: 0,
  });

  const checkMychewRenewal = (currentCpm: number, currentAcc: number) => {
    const prev = bestCpm;
    if (prev === 0) {
      // First attempt: save baseline record. Mychew requires beating this record on subsequent attempts!
      try {
        localStorage.setItem(bestCpmKey, currentCpm.toString());
      } catch {}
      setBestCpm(currentCpm);
      setRewardEvaluation({
        evaluated: true,
        isFirst: true,
        isBeat: false,
        prevBest: 0,
      });
      return;
    }

    // 2nd attempt onwards: must beat previous record AND have >= 95% accuracy!
    const beat = currentCpm > prev && currentAcc >= 95;
    if (beat) {
      setRewardStats({
        cpm: currentCpm,
        prevBest: prev,
        accuracy: currentAcc,
      });
      try {
        localStorage.setItem(bestCpmKey, currentCpm.toString());
      } catch {}
      setBestCpm(currentCpm);
    }

    setRewardEvaluation({
      evaluated: true,
      isFirst: false,
      isBeat: beat,
      prevBest: prev,
    });
  };

  // Statistics across the entire long text
  const [stats, setStats] = useState<TypingStats>({
    cpm: 0,
    accuracy: 100,
    errorCount: 0,
    correctCount: 0,
    totalKeystrokes: 0,
    elapsedSeconds: 0,
    combo: 0,
    maxCombo: 0,
  });

  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const readingContainerRef = useRef<HTMLDivElement>(null);
  const writingContainerRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const bufferedCharsRef = useRef<number>(0);

  // New Age Ambient Piano BGM State
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);
  const [currentTrackId, setCurrentTrackId] = useState<string>(NEW_AGE_TRACKS[0].id);
  const [bgmVolume, setBgmVolume] = useState<number>(newAgeBgmEngine.getVolume());

  useEffect(() => {
    const unsub = newAgeBgmEngine.subscribe(() => {
      setIsBgmPlaying(newAgeBgmEngine.isPlaying());
      setCurrentTrackId(newAgeBgmEngine.getCurrentTrack().id);
      setBgmVolume(newAgeBgmEngine.getVolume());
    });
    return () => {
      unsub();
      newAgeBgmEngine.pause();
    };
  }, []);

  const handleToggleBgm = () => {
    newAgeBgmEngine.toggle();
  };

  const handleTrackChange = (trackId: string) => {
    newAgeBgmEngine.setTrack(trackId);
  };

  const handleVolumeChange = (vol: number) => {
    newAgeBgmEngine.setVolume(vol);
  };

  // Dual synchronized scroll between reading and writing containers
  const isSyncingScroll = useRef(false);

  const handleReadingScroll = () => {
    if (isSyncingScroll.current) return;
    if (readingContainerRef.current && writingContainerRef.current) {
      isSyncingScroll.current = true;
      writingContainerRef.current.scrollTop = readingContainerRef.current.scrollTop;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  const handleWritingScroll = () => {
    if (isSyncingScroll.current) return;
    if (writingContainerRef.current && readingContainerRef.current) {
      isSyncingScroll.current = true;
      readingContainerRef.current.scrollTop = writingContainerRef.current.scrollTop;
      requestAnimationFrame(() => {
        isSyncingScroll.current = false;
      });
    }
  };

  // Auto-scroll both containers synchronously as user types (exact same frame, zero latency)
  useEffect(() => {
    if (readingContainerRef.current && writingContainerRef.current) {
      const activeCharEl = document.getElementById(`long-char-${inputVal.length}`);
      if (activeCharEl) {
        const container = readingContainerRef.current;
        const writingContainer = writingContainerRef.current;

        const charOffsetTop = activeCharEl.offsetTop;
        const visibleHeight = container.clientHeight;

        if (charOffsetTop - container.scrollTop > visibleHeight - 90) {
          const newTop = charOffsetTop - visibleHeight + 110;
          isSyncingScroll.current = true;
          container.scrollTop = newTop;
          writingContainer.scrollTop = newTop;
          requestAnimationFrame(() => {
            isSyncingScroll.current = false;
          });
        } else if (charOffsetTop - container.scrollTop < 40 && container.scrollTop > 0) {
          const newTop = Math.max(0, charOffsetTop - 50);
          isSyncingScroll.current = true;
          container.scrollTop = newTop;
          writingContainer.scrollTop = newTop;
          requestAnimationFrame(() => {
            isSyncingScroll.current = false;
          });
        }
      }
    }
  }, [inputVal]);

  // Reset scroll position on page change
  useEffect(() => {
    if (readingContainerRef.current) {
      readingContainerRef.current.scrollTop = 0;
    }
    if (writingContainerRef.current) {
      writingContainerRef.current.scrollTop = 0;
    }
  }, [pageIndex, currentText.id]);

  // Turn page smoothly with sound and realistic page leaf animation
  const turnPageTo = (newIndex: number, direction: 'next' | 'prev') => {
    if (newIndex < 0 || newIndex >= totalPages) return;
    setPageTurnDirection(direction);
    setIsPageTurning(true);
    soundManager.playPageTurn();
    setPageIndex(newIndex);
    setInputVal('');
    startTimeRef.current = null;
    setTimeout(() => {
      setIsPageTurning(false);
      inputRef.current?.focus();
    }, 380);
  };

  const resetSessionStats = () => {
    setIsTimerRunning(false);
    startTimeRef.current = null;
    setStats({
      cpm: 0,
      accuracy: 100,
      errorCount: 0,
      correctCount: 0,
      totalKeystrokes: 0,
      elapsedSeconds: 0,
      combo: 0,
      maxCombo: 0,
    });
    setIsCompletedModalOpen(false);
  };

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, [pageIndex, selectedTextId, language]);

  // Live timer for CPM and duration
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setStats((prev) => {
          const nextSec = prev.elapsedSeconds + 1;
          const currentCPM = Math.round((prev.correctCount / Math.max(1, nextSec)) * 60);
          return {
            ...prev,
            elapsedSeconds: nextSec,
            cpm: currentCPM,
          };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // At the end of a source line, Space works like Enter: it moves to the next line
    let val = e.target.value;
    if (val.includes(' ')) {
      let fixed = '';
      for (let i = 0; i < val.length; i++) {
        fixed += val[i] === ' ' && targetPageText[i] === '\n' ? '\n' : val[i];
      }
      val = fixed;
    }

    // Start timer on first input
    if (!startTimeRef.current && val.length > 0) {
      startTimeRef.current = Date.now();
      setIsTimerRunning(true);
    }

    // Accurately calculate typos and correct keystrokes
    // Support Korean IME composing characters:
    let currentErrors = 0;
    let correctCharsCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (i === val.length - 1 && i < targetPageText.length) {
        // Current character might be mid-composition
        const targetSub = targetPageText.slice(0, val.length);
        if (!isHangulPrefix(targetSub, val)) {
          currentErrors++;
        } else {
          correctCharsCount++;
        }
      } else if (i < targetPageText.length) {
        if (val[i] !== targetPageText[i]) {
          currentErrors++;
        } else {
          correctCharsCount++;
        }
      } else {
        currentErrors++;
      }
    }

    const totalChars = val.length;
    const accuracy = totalChars > 0 
      ? Math.max(0, Math.round(((correctCharsCount) / Math.max(totalChars, 1)) * 100)) 
      : 100;

    const elapsedSec = Math.max(1, Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));
    const totalStrokes = countKeystrokes(val);
    const cpm = Math.round((totalStrokes / elapsedSec) * 60);
    const combo = currentErrors === 0 ? val.length : 0;

    setStats((prev) => ({
      ...prev,
      errorCount: currentErrors,
      totalKeystrokes: totalStrokes,
      correctCount: correctCharsCount,
      accuracy,
      cpm,
      combo,
      maxCombo: Math.max(prev.maxCombo, combo),
    }));

    setInputVal(val);

    // Only buffer characters if typed character was correct (typos and spaces never buffer points)
    if (val.length > inputVal.length) {
      const lastIndex = val.length - 1;
      const isCharCorrect = lastIndex < targetPageText.length && 
        (val[lastIndex] === targetPageText[lastIndex] || isHangulPrefix(targetPageText.slice(0, val.length), val));
      if (isCharCorrect && currentErrors === 0) {
        bufferedCharsRef.current += 1;
      }
    }

    // A page is only finished if 100% of characters match with zero errors!
    // Simply typing spaces or random letters will NEVER finish the page.
    if (val.length === targetPageText.length && currentErrors === 0 && val === targetPageText) {
      handlePageFinished();
    }
  };

  const handlePageFinished = () => {
    // Check for 0 errors and minimum 90% accuracy before awarding points
    if (stats.errorCount === 0 && stats.accuracy >= 90) {
      soundManager.playPageTurn();
      addTypingPracticePoints(20, '긴 글 한 쪽 필사 완주');
    } else {
      soundManager.playPageTurn();
    }

    // Flush buffered keystrokes at page completion
    if (bufferedCharsRef.current > 0) {
      dailyMissionsManager.incrementProgress('chars', bufferedCharsRef.current, currentUser?.id);
      bufferedCharsRef.current = 0;
    }
    dailyMissionsManager.saveLastPractice({
      mode: 'long-practice',
      modeTitle: '4단계: 긴 글 & 감성 필사',
      stageTitle: `${currentText.title} (${pageIndex + 1}/${totalPages}쪽)`,
      stageId: currentText.id,
      language,
      cpm: stats.cpm,
      accuracy: stats.accuracy,
    }, currentUser?.id, true);

    // Check if next page exists
    if (pageIndex + 1 < totalPages) {
      turnPageTo(pageIndex + 1, 'next');
    } else {
      // Completed entire book!
      handleAllPagesCompleted();
    }
  };

  const handleAllPagesCompleted = () => {
    setIsTimerRunning(false);
    setIsCompletedModalOpen(true);
    soundManager.playVictory();
    
    // Only award 120 completion points if accuracy >= 90%
    if (stats.accuracy >= 90 && stats.errorCount === 0) {
      addTypingPracticePoints(120, `긴 글 완독: ${currentText.title}`);
      checkMychewRenewal(stats.cpm, stats.accuracy);
    }
    
    // Flush buffered keystrokes if any remaining
    if (bufferedCharsRef.current > 0) {
      dailyMissionsManager.incrementProgress('chars', bufferedCharsRef.current, currentUser?.id);
      bufferedCharsRef.current = 0;
    }
    dailyMissionsManager.incrementProgress('lesson', 1, currentUser?.id);

    try {
      confetti({ particleCount: 130, spread: 80, origin: { y: 0.6 } });
    } catch {}

    // Record in history log
    const targetUserId = currentUser ? currentUser.id : 'guest';
    const targetUserName = currentUser ? currentUser.name : '게스트';
    recordPracticeHistory({
      userId: targetUserId,
      userName: targetUserName,
      mode: 'sentence-practice',
      modeTitle: `긴 글 완독: ${currentText.title} (${language === 'ko' ? '한글' : 'English'})`,
      language,
      stageTitle: `${currentText.author} - ${currentText.title}`,
      sampleText: currentText.paragraphs[0]?.slice(0, 50) + '...',
      cpm: stats.cpm,
      accuracy: stats.accuracy,
      errorCount: stats.errorCount,
      correctCount: stats.correctCount,
      totalKeystrokes: stats.totalKeystrokes,
      elapsedSeconds: stats.elapsedSeconds,
    });

    // Record on leaderboard if logged in
    if (currentUser && onRecordScore && stats.cpm > 30) {
      onRecordScore({
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '📜',
        mode: 'sentence',
        modeTitle: `긴 글: ${currentText.title}`,
        score: stats.cpm * 15 + stats.accuracy * 8 + currentText.paragraphs.length * 150,
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        details: `${currentText.title} (${currentText.paragraphs.length}문단 완독)`,
        completedSentences: currentText.paragraphs.length,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // Only advance on Enter if text strictly matches target text with 0 errors
      if (inputVal === targetPageText && stats.errorCount === 0) {
        e.preventDefault();
        handlePageFinished();
        return;
      }

      const nextChar = targetPageText[inputVal.length];
      if (nextChar === '\n') {
        // Natural Enter: allow textarea to insert '\n', exactly matching targetPageText[inputVal.length]
        return;
      }

      // Prevent accidental newlines:
      e.preventDefault();
    }
  };

  const handleResetPage = () => {
    setInputVal('');
    inputRef.current?.focus();
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      turnPageTo(pageIndex - 1, 'prev');
    }
  };

  const handleNextPageManual = () => {
    if (pageIndex + 1 < totalPages) {
      turnPageTo(pageIndex + 1, 'next');
    } else if (inputVal === targetPageText && stats.errorCount === 0) {
      handleAllPagesCompleted();
    }
  };

  return (
    <div className="space-y-2 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. ULTRA-COMPACT TOOLBAR: Book Selector + Piano + MyChew all in one */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Left: Book Meta & Selection */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-xs sm:text-sm font-black text-stone-900 font-serif truncate max-w-[200px] sm:max-w-xs">
              {currentText.title}
            </span>
            <span className="text-[11px] font-bold text-stone-500 font-serif hidden md:inline">
              {currentText.author} ({currentText.categoryLabel})
            </span>
          </div>

          {/* Compact Book Selector */}
          <div className="relative">
            <select
              value={selectedTextId}
              onChange={(e) => {
                setSelectedTextId(e.target.value);
                setPageIndex(0);
                setInputVal('');
                resetSessionStats();
              }}
              className="text-[11px] font-serif font-bold text-stone-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-lg px-2 py-1 pr-6 shadow-2xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer appearance-none max-w-[140px] sm:max-w-[180px] truncate"
            >
              {availableTexts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} - {item.author}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-stone-500 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
          </div>

          {/* Random Story Picker */}
          <button
            type="button"
            onClick={() => {
              const others = availableTexts.filter((t) => t.id !== selectedTextId);
              const pool = others.length > 0 ? others : availableTexts;
              const randomPick = pool[Math.floor(Math.random() * pool.length)];
              if (randomPick) {
                setSelectedTextId(randomPick.id);
                setPageIndex(0);
                setInputVal('');
                resetSessionStats();
              }
            }}
            className="p-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-bold border border-purple-200 transition cursor-pointer"
            title="무작위 작품 추천"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-600" />
          </button>
        </div>

        {/* Right: Language, MyChew pill, and Piano Player */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex items-center gap-0.5 bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px] font-bold">
            <button
              onClick={() => setLanguage('ko')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                language === 'ko' ? 'bg-amber-800 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              한글
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                language === 'en' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              EN
            </button>
          </div>

          {/* MyChew Mission Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-pink-50 border border-pink-200 text-[11px] font-bold text-pink-700">
            <span>🍬 마이쮸:</span>
            <span className="font-mono text-purple-700">{bestCpm > 0 ? `${bestCpm}타 갱신` : '정확도 95%'}</span>
          </div>

          {/* Mini Classical Piano Player */}
          <div className="flex items-center gap-1.5 bg-stone-900 px-2 py-1 rounded-lg border border-amber-800/40 text-stone-200 text-xs">
            <button
              type="button"
              onClick={handleToggleBgm}
              className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                isBgmPlaying ? 'bg-amber-400 text-amber-950 font-black animate-pulse' : 'bg-stone-700 hover:bg-stone-600 text-stone-200'
              }`}
              title={isBgmPlaying ? '피아노 일시정지' : '클래식 피아노 연주 듣기'}
            >
              {isBgmPlaying ? <Pause className="w-3 h-3 fill-amber-950" /> : <Play className="w-3 h-3 fill-white" />}
              <span className="hidden sm:inline">{isBgmPlaying ? '피아노 🎶' : '피아노 켜기'}</span>
            </button>

            <select
              value={currentTrackId}
              onChange={(e) => handleTrackChange(e.target.value)}
              className="text-[11px] font-medium text-amber-100 bg-stone-800 border border-amber-700/50 rounded-md px-1.5 py-0.5 shadow-2xs focus:outline-none cursor-pointer max-w-[90px] sm:max-w-[120px] truncate"
              title="피아노 곡 선택"
            >
              {NEW_AGE_TRACKS.map((t) => (
                <option key={t.id} value={t.id} className="bg-stone-900 text-stone-200">
                  {t.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleVolumeChange(bgmVolume > 0 ? 0 : 0.4)}
              className="text-stone-300 hover:text-amber-200 transition cursor-pointer"
              title={bgmVolume === 0 ? '음소거 해제' : '음소거'}
            >
              {bgmVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC BOOK HARDCOVER CASING */}
      {/* ========================================================================= */}
      <div className="book-leather-binding p-3 sm:p-5 lg:p-6 rounded-[2rem] relative select-none">
        {/* Antique Brass Corner Ornaments */}
        <div className="absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 rounded-tl-lg pointer-events-none shadow-2xs" />
        <div className="absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 rounded-tr-lg pointer-events-none shadow-2xs" />
        <div className="absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 rounded-bl-lg pointer-events-none shadow-2xs" />
        <div className="absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 rounded-br-lg pointer-events-none shadow-2xs" />

        {/* Gilded Inner Frame Line */}
        <div className="absolute inset-2 sm:inset-3 rounded-[1.7rem] border border-amber-500/20 pointer-events-none" />

        {/* Real Book Pages Depth / Stacked Paper Deckle Edges */}
        <div className="relative rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(55,25,10,0.3),3px_0_0_#F0EAE1,5px_0_0_#E4DCCE] border border-[#DDD3C2]">
          
          {/* Book Spread Container (Left & Right equal height) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[350px] lg:h-[424px] relative bg-[#FAF7EE]">
            
            {/* Realistic Book Spine Crease Divider */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-8 -ml-4 pointer-events-none z-20 book-spine-crease" />

            {/* ================================================================= */}
            {/* LEFT PAGE: 원문 감상 (오른쪽 필사 공간과 완벽한 수평 높이 일치) */}
            {/* ================================================================= */}
            <div className={`p-4 sm:p-5 flex flex-col justify-start border-b lg:border-b-0 lg:border-r border-[#E4DCCB] relative bg-[#FAF7EE] shadow-[inset_-10px_0_15px_rgba(0,0,0,0.02)] h-full overflow-hidden ${
              isPageTurning ? (pageTurnDirection === 'next' ? 'animate-page-turn-next' : 'animate-page-turn-prev') : ''
            }`}>
              <div>
                {/* Book Header Metadata - Height strictly matched with Right Page */}
                <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-[#E4DCCB]/80 text-xs font-serif text-stone-500 h-[28px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.2 rounded-full text-[10px]">
                      {currentText.categoryLabel || '문학 명작'}
                    </span>
                    {currentText.era && <span className="text-[11px]">{currentText.era}</span>}
                  </div>
                  <span className="font-mono text-[11px] font-bold text-stone-400">
                    쪽 {pageIndex + 1} / {totalPages}
                  </span>
                </div>

                {/* Title & Author - Height strictly matched with Right Page */}
                <div className="mb-1.5 h-[40px] flex flex-col justify-center">
                  <h2 className="text-sm sm:text-base font-serif font-black text-[#2A231F] tracking-tight flex items-baseline gap-2 truncate">
                    <span>{currentText.title}</span>
                    {currentText.titleEn && (
                      <span className="text-xs font-sans font-normal text-stone-500 italic">
                        ({currentText.titleEn})
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Feather className="w-3 h-3 text-amber-800" />
                    <span className="text-[11px] font-serif font-bold text-amber-900">
                      {currentText.author}
                    </span>
                  </div>
                </div>
              </div>

              {/* READING CONTAINER: 왼쪽 원문 영역 */}
              <div 
                ref={readingContainerRef}
                onScroll={handleReadingScroll}
                className="h-[250px] min-h-[250px] max-h-[250px] overflow-y-scroll scrollbar-thin my-1 p-3.5 sm:p-4 rounded-xl bg-[#FAF7EE] border-2 border-[#DDD3C2] shadow-2xs select-none"
              >
                <div className="text-sm sm:text-base font-serif leading-[2.1] text-[#2A231F] break-keep whitespace-pre-wrap tracking-normal">
                  {targetPageText.split('').map((char, charIdx) => {
                    const isTyped = charIdx < inputVal.length;
                    const isCurrent = charIdx === inputVal.length;

                    let borderClass = 'border-b-2 border-transparent pb-0.5';
                    if (isTyped) {
                      borderClass = 'border-b-2 border-[#2A231F] pb-0.5';
                    } else if (isCurrent) {
                      borderClass = 'border-b-2 border-amber-800 animate-pulse pb-0.5';
                    }

                    if (char === '\n') {
                      return (
                        <span key={charIdx} id={`long-char-${charIdx}`}>
                          {'\n'}
                        </span>
                      );
                    }

                    return (
                      <span
                        key={charIdx}
                        id={`long-char-${charIdx}`}
                        className={`${borderClass} text-[#2A231F] inline`}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Left Page Footer */}
              <div className="pt-1.5 mt-1 border-t border-[#E4DCCB]/80 flex items-center justify-between text-[11px] font-serif text-stone-500">
                <span className="truncate max-w-[200px]">
                  {currentText.description}
                </span>
                <span className="font-mono text-stone-400 text-[10px]">
                  - {pageIndex + 1} 쪽 (원문) -
                </span>
              </div>
            </div>

            {/* ================================================================= */}
            {/* RIGHT PAGE: 감성 필사 노트 (왼쪽 원문과 완벽한 수평 높이 일치) */}
            {/* ================================================================= */}
            <div className={`p-4 sm:p-5 flex flex-col justify-start relative bg-[#FAF7EE] shadow-[inset_10px_0_15px_rgba(0,0,0,0.02)] h-full overflow-hidden ${
              isPageTurning ? (pageTurnDirection === 'next' ? 'animate-page-turn-next' : 'animate-page-turn-prev') : ''
            }`}>
              <div>
                {/* Right Page Header: Controls */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-[#E4DCCB]/80 h-[28px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4.5 h-4.5 rounded-md bg-amber-800 text-white font-mono font-bold text-[10px] flex items-center justify-center shadow-2xs">
                      ✍️
                    </span>
                    <span className="font-serif font-black text-xs text-stone-800">
                      필사 노트 <span className="text-amber-800 font-mono text-[10px]">({pageIndex + 1}/{totalPages}쪽)</span>
                    </span>
                  </div>

                  {/* Page turning buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevPage}
                      disabled={pageIndex === 0}
                      className={`px-2 py-0.2 rounded-md text-[11px] font-bold transition flex items-center gap-0.5 ${
                        pageIndex === 0
                          ? 'opacity-30 cursor-not-allowed text-stone-400'
                          : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-2xs cursor-pointer'
                      }`}
                      title="이전 쪽으로 책장 넘기기"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>이전 쪽</span>
                    </button>

                    <button
                      onClick={handleResetPage}
                      className="px-2 py-0.2 rounded-md bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 text-[11px] font-bold transition flex items-center gap-0.5 shadow-2xs cursor-pointer"
                      title="현재 쪽 다시 쓰기"
                    >
                      <RotateCcw className="w-3 h-3 text-stone-500" />
                      <span>다시</span>
                    </button>

                    <button
                      onClick={handleNextPageManual}
                      className="px-2 py-0.2 rounded-md bg-amber-800 hover:bg-amber-900 text-white text-[11px] font-bold transition flex items-center gap-0.5 shadow-2xs cursor-pointer"
                      title="다음 쪽으로 책장 넘기기"
                    >
                      <span>다음 쪽</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="mb-1.5 h-[40px] flex flex-col justify-center">
                  <div className="flex items-center justify-between text-[11px] font-serif text-stone-600 mb-0.5">
                    <span className="font-bold text-amber-900">필사 진행도</span>
                    <span className="font-mono text-stone-500 font-medium text-[10px]">
                      {Math.min(inputVal.length, targetPageText.length)} / {targetPageText.length}자 ({Math.round((Math.min(inputVal.length, targetPageText.length) / Math.max(1, targetPageText.length)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-200/80 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-700 to-rose-700 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(((pageIndex + (inputVal.length / Math.max(1, targetPageText.length))) / totalPages) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* AUTHENTIC PLAIN PARCHMENT MANUSCRIPT AREA */}
              <div 
                ref={writingContainerRef}
                onClick={() => inputRef.current?.focus()}
                onScroll={handleWritingScroll}
                className="h-[250px] min-h-[250px] max-h-[250px] rounded-xl p-3.5 sm:p-4 cursor-text relative my-1 overflow-y-scroll scrollbar-thin transition-colors bg-[#FAF7EE] border-2 border-[#54321A] ring-1 ring-[#381F0D]/40 shadow-[inset_0_2px_8px_rgba(40,20,5,0.08),0_4px_12px_rgba(45,20,5,0.06)]"
              >
                {/* Transparent textarea capturing keystrokes and multiline enter */}
                <textarea
                  ref={inputRef}
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="absolute opacity-0 inset-0 w-full h-full cursor-text z-20 resize-none p-3.5 sm:p-4 font-serif text-sm sm:text-base leading-[2.1]"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />

                {/* Manuscript Handwriting Display */}
                <div className="relative z-10 select-none">
                  {inputVal.length === 0 ? (
                    <div className="font-serif text-sm sm:text-base leading-[2.1] text-stone-400 break-keep whitespace-pre-wrap tracking-normal">
                      <span>왼쪽 원문을 보며 이곳에 타이핑하세요...</span>
                      <span className="inline-block w-0.5 h-4 bg-amber-800 animate-pulse ml-1 align-middle" />
                    </div>
                  ) : (
                    /* Mirror of the source layout: every typed character sits exactly where its
                       source character is, so each typed line stays level with the original line. */
                    <div className="font-serif text-sm sm:text-base leading-[2.1] text-[#2A231F] break-keep whitespace-pre-wrap tracking-normal">
                      {targetPageText.split('').map((tChar, i) => {
                        if (i === inputVal.length) {
                          return (
                            <React.Fragment key={i}>
                              <span className="inline-block w-0.5 h-4 bg-amber-800 animate-pulse align-middle" />
                              <span className="text-transparent">{tChar}</span>
                            </React.Fragment>
                          );
                        }
                        if (tChar === '\n') {
                          const missed = i < inputVal.length && inputVal[i] !== '\n';
                          return (
                            <React.Fragment key={i}>
                              {missed && <span className="text-rose-500 text-xs">↵</span>}
                              {'\n'}
                            </React.Fragment>
                          );
                        }
                        if (i >= inputVal.length) {
                          return (
                            <span key={i} className="text-transparent">
                              {tChar}
                            </span>
                          );
                        }
                        const typed = inputVal[i] === '\n' ? ' ' : inputVal[i];
                        const isLast = i === inputVal.length - 1;
                        const ok = typed === tChar || (isLast && isHangulPrefix(targetPageText.slice(0, i + 1), inputVal.slice(0, i + 1)));
                        return (
                          <span key={i} className={ok ? '' : 'text-rose-600 bg-rose-100/70 rounded-sm'}>
                            {typed}
                          </span>
                        );
                      })}
                      {inputVal.length > targetPageText.length && (
                        <span className="text-rose-600 bg-rose-100/70">{inputVal.slice(targetPageText.length)}</span>
                      )}
                      {inputVal.length >= targetPageText.length && (
                        <span className="inline-block w-0.5 h-4 bg-amber-800 animate-pulse ml-0.5 align-middle" />
                      )}
                    </div>
                  )}

                  {inputVal === targetPageText && stats.errorCount === 0 && (
                    <div className="mt-2 p-1.5 bg-amber-100/90 border border-amber-300 rounded-lg text-center">
                      <span className="text-xs font-bold text-amber-950 font-serif">
                        ✨ 이번 쪽 필사 완료! [Enter ↵] 또는 [다음 쪽] 버튼을 누르세요!
                      </span>
                    </div>
                  )}

                  {stats.errorCount > 0 && inputVal.length >= targetPageText.length && (
                    <div className="mt-2 p-1.5 bg-rose-100/90 border border-rose-300 rounded-lg text-center">
                      <span className="text-xs font-bold text-rose-800 font-serif">
                        ⚠️ 오타가 {stats.errorCount}개 있습니다. 틀린 부분을 수정해야 완료할 수 있습니다!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {/* LIVE STATS HUD STRIP */}
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-1.5 text-center">
                    <div className="text-[9px] font-bold text-stone-500">현재 타수</div>
                    <div className="text-sm sm:text-base font-black text-amber-800 font-mono">
                      {stats.cpm} <span className="text-[9px] font-normal text-stone-400">타</span>
                    </div>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-1.5 text-center">
                    <div className="text-[9px] font-bold text-stone-500">정확도</div>
                    <div className="text-sm sm:text-base font-black text-amber-800 font-mono">
                      {stats.accuracy}%
                    </div>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-1.5 text-center">
                    <div className="text-[9px] font-bold text-stone-500">오타수</div>
                    <div className={`text-sm sm:text-base font-black font-mono ${stats.errorCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {stats.errorCount}개
                    </div>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-1.5 text-center">
                    <div className="text-[9px] font-bold text-stone-500">시간</div>
                    <div className="text-xs sm:text-sm font-black text-stone-700 font-mono pt-0.5">
                      ⏱ {Math.floor(stats.elapsedSeconds / 60)}:{String(stats.elapsedSeconds % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-lg p-1.5 text-center">
                    <div className="text-[10px] font-bold text-stone-500">콤보</div>
                    <div className="text-base sm:text-lg font-black text-rose-600 font-mono">
                      🔥 {stats.combo}
                    </div>
                  </div>
                </div>

                {/* Right Page Footer */}
                <div className="pt-2.5 mt-2 border-t border-[#E4DCCB]/80 flex items-center justify-between text-xs font-serif text-stone-500">
                  <span>타닥타닥 감성 필사 스튜디오</span>
                  <span className="font-mono text-stone-400 text-[11px]">
                    - {pageIndex + 1} 쪽 (필사) -
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOOK COMPLETION MODAL */}
      {/* ========================================================================= */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7EE] border-4 border-[#8C532B] rounded-3xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 shadow-2xl relative">
            {/* Top-Right Close Button */}
            <button
              onClick={() => setIsCompletedModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition cursor-pointer"
              title="닫기"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center text-3xl shadow-inner border-2 border-amber-300">
              📜
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full font-serif border border-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-700" />
                완독 인증서 🏅 (10문단 완주)
              </span>
              <h3 className="text-2xl font-serif font-black text-[#2A231F] mt-2">
                『{currentText.title}』 완독!
              </h3>
              <p className="text-xs font-serif text-stone-600">
                {currentText.author}의 아름다운 10문단을 한 자 한 자 정성스레 필사했습니다.
              </p>
            </div>

            {/* Achievement Stats - Comprehensive Typing Verification */}
            <div className="p-4 rounded-2xl bg-white border border-[#E4DCCB] text-center shadow-xs space-y-3">
              <div className="text-xs font-serif font-bold text-amber-900 flex items-center justify-center gap-1.5 pb-2 border-b border-stone-100">
                <Award className="w-4 h-4 text-amber-600" />
                <span>최종 타자수 &amp; 필사 결과 확인</span>
              </div>

              {/* Highlight Box: Total Keystrokes & Speed */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
                <div>
                  <div className="text-[11px] font-serif text-stone-500 font-medium">총 타자수</div>
                  <div className="text-2xl font-black font-mono text-amber-950 mt-0.5">
                    {stats.totalKeystrokes.toLocaleString()}<span className="text-sm font-serif font-bold ml-0.5">타</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-serif text-stone-500 font-medium">평균 타자 속도</div>
                  <div className="text-2xl font-black font-mono text-amber-950 mt-0.5">
                    {stats.cpm} <span className="text-xs font-normal font-sans">CPM</span>
                  </div>
                </div>
              </div>

              {/* Secondary Details: Accuracy, Paragraphs, Errors, Time */}
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="text-[10px] font-serif text-stone-400">정확도</div>
                  <div className="text-sm font-black font-mono text-stone-800 mt-0.5">
                    {stats.accuracy}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="text-[10px] font-serif text-stone-400">완주 문단</div>
                  <div className="text-sm font-black font-mono text-stone-800 mt-0.5">
                    {totalPages}/{totalPages}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="text-[10px] font-serif text-stone-400">오타 수</div>
                  <div className="text-sm font-black font-mono text-stone-800 mt-0.5">
                    {stats.errorCount}개
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div className="text-[10px] font-serif text-stone-400">소요 시간</div>
                  <div className="text-sm font-black font-mono text-stone-800 mt-0.5">
                    {Math.floor(stats.elapsedSeconds / 60)}:{String(stats.elapsedSeconds % 60).padStart(2, '0')}
                  </div>
                </div>
              </div>

              {/* Honor Title */}
              <div className="text-[11px] font-serif text-amber-800 font-medium pt-1">
                칭호: {stats.cpm >= 400 ? '🏆 신속정확 타자 마스터' : stats.cpm >= 300 ? '🎖️ 유려한 문학 명필가' : stats.cpm >= 200 ? '⭐ 숙련된 필사 작가' : stats.cpm >= 100 ? '✍️ 차분한 감성 필사가' : '🌱 따뜻한 첫걸음 필사가'}
              </div>
            </div>

            {/* Reward Notification & Mychew Status */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-amber-100/70 border border-amber-300 text-xs font-serif text-amber-950 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>완독 보상으로 <strong>+120 포인트</strong>를 획득했습니다!</span>
              </div>

              {/* Mychew Reward Evaluation Status */}
              {rewardEvaluation.evaluated && (
                <div className={`p-3.5 rounded-xl border text-xs font-serif ${
                  rewardEvaluation.isBeat 
                    ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-300 text-pink-950 shadow-xs'
                    : rewardEvaluation.isFirst
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{rewardEvaluation.isBeat ? '🍬' : '🎯'}</span>
                      <div>
                        <div className="font-bold">
                          {rewardEvaluation.isBeat ? (
                            <span className="text-pink-600 font-black">🎉 최고 타수 신기록 경신! 마이쮸 획득 조건 달성!</span>
                          ) : rewardEvaluation.isFirst ? (
                            <span className="text-blue-700 font-bold">첫 완독 기록 등록 완료! (기준: {stats.cpm}타)</span>
                          ) : (
                            <span className="text-stone-700 font-bold">마이쮸 도전 진행 중</span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {rewardEvaluation.isBeat ? (
                            `이전 ${rewardEvaluation.prevBest}타 ➔ 현재 ${stats.cpm}타 달성 (정확도 ${stats.accuracy}%로 95% 이상 통과!)`
                          ) : rewardEvaluation.isFirst ? (
                            `2번째 완독부터는 이 기록(${stats.cpm}타)보다 높고 정확도 95% 이상이어야 마이쮸를 받아요!`
                          ) : (
                            `이전 최고 기록(${rewardEvaluation.prevBest}타)보다 높고 정확도 95% 이상이어야 마이쮸를 받아요. (현재: ${stats.cpm}타 / ${stats.accuracy}%)`
                          )}
                        </p>
                      </div>
                    </div>

                    {rewardEvaluation.isBeat && (
                      <button
                        onClick={() => {
                          setIsCompletedModalOpen(false);
                          setShowMychewModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <span>🍬 마이쮸 받기</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => setIsCompletedModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-serif font-bold text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>확인 완료</span>
              </button>

              <button
                onClick={() => {
                  setPageIndex(0);
                  setInputVal('');
                  resetSessionStats();
                  setIsCompletedModalOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-serif font-bold text-sm transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>처음부터 다시 쓰기</span>
              </button>

              <button
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  const others = availableTexts.filter((t) => t.id !== selectedTextId);
                  const pool = others.length > 0 ? others : availableTexts;
                  const nextPick = pool[Math.floor(Math.random() * pool.length)];
                  if (nextPick) {
                    setSelectedTextId(nextPick.id);
                    setPageIndex(0);
                    setInputVal('');
                    resetSessionStats();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-serif font-bold text-sm transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>다른 작품 필사하기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🍬 MYCHEW HIGH-SCORE REWARD MODAL */}
      <MychewRewardModal
        isOpen={showMychewModal}
        onClose={() => setShowMychewModal(false)}
        type="cpm_renewal"
        cpm={rewardStats.cpm}
        prevBestCpm={rewardStats.prevBest}
        accuracy={rewardStats.accuracy}
        isSuccess={true}
      />
    </div>
  );
};
