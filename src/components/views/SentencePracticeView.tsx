import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  BookOpen, 
  Timer, 
  Globe,
  Lock,
  CheckCircle2,
  Shuffle,
  ChevronRight,
  Keyboard
} from 'lucide-react';
import { SENTENCE_PRACTICE_DATA, ENGLISH_SENTENCE_PRACTICE_DATA } from '../../data/practiceData';
import { TypingStats, UserSession, LeaderboardEntry } from '../../types';
import { StatsBar } from '../StatsBar';
import { getKeyGuideForChar, getActiveKeystrokeGuide, isHangulPrefix, countKeystrokes } from '../../utils/hangul';
import { soundManager } from '../../utils/sound';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { recordPracticeHistory } from '../../utils/curriculumManager';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { TypingSpeedTrendChart } from '../TypingSpeedTrendChart';
import { MychewRewardModal } from '../MychewRewardModal';
import { PracticeSetResultModal } from '../PracticeSetResultModal';

interface SentencePracticeViewProps {
  currentUser: UserSession | null;
  onRecordScore: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
}

interface SentencePracticeProgress {
  categoryIndex: number;
  sentenceIndex: number;
  completedTotal: number;
  updatedAt: number;
}

const getSentenceProgressKey = (userId: string | undefined, lang: 'ko' | 'en') => {
  return `typang_sentence_progress_${userId || 'guest'}_${lang}`;
};

const loadSentenceProgress = (userId: string | undefined, lang: 'ko' | 'en'): SentencePracticeProgress | null => {
  try {
    const raw = localStorage.getItem(getSentenceProgressKey(userId, lang));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return null;
};

const saveSentenceProgress = (
  userId: string | undefined,
  lang: 'ko' | 'en',
  categoryIndex: number,
  sentenceIndex: number,
  completedTotal: number
) => {
  try {
    const data: SentencePracticeProgress = {
      categoryIndex,
      sentenceIndex,
      completedTotal,
      updatedAt: Date.now(),
    };
    localStorage.setItem(getSentenceProgressKey(userId, lang), JSON.stringify(data));
  } catch {}
};

export const SentencePracticeView: React.FC<SentencePracticeViewProps> = ({
  currentUser,
  onRecordScore,
}) => {
  // Language toggle: 'ko' or 'en'
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [hasResumed, setHasResumed] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  // 5-Min Challenge or Regular mode
  const [is5MinMode, setIs5MinMode] = useState(false);
  const [remainingTime5Min, setRemainingTime5Min] = useState(300); // 300 seconds = 5 mins
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Statistics
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

  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [lastKeyPressed, setLastKeyPressed] = useState<string | undefined>();
  const [lastFingerUsed, setLastFingerUsed] = useState<string | undefined>();
  const [isCorrectLastKey, setIsCorrectLastKey] = useState<boolean | null>(null);
  
  // Completed sentences in current continuous session
  const [completedInSession, setCompletedInSession] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  // MyChew Record High Score Reward
  const bestCpmKey = `pangpang_best_sentence_cpm_${currentUser?.id || 'guest'}_${language}`;
  const [bestCpm, setBestCpm] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(bestCpmKey) || '0', 10) || 0;
    } catch {
      return 0;
    }
  });
  const [showMychewModal, setShowMychewModal] = useState(false);
  const [showSetResultModal, setShowSetResultModal] = useState(false);
  const [setResultData, setSetResultData] = useState<{
    cpm: number;
    errorCount: number;
    accuracy: number;
    prevBest: number;
    isFirst: boolean;
    isBeat: boolean;
  }>({
    cpm: 0,
    errorCount: 0,
    accuracy: 100,
    prevBest: 0,
    isFirst: false,
    isBeat: false,
  });
  const [rewardStats, setRewardStats] = useState<{ cpm: number; prevBest: number; accuracy: number }>({
    cpm: 0,
    prevBest: 0,
    accuracy: 100,
  });

  const checkMychewRenewal = (currentCpm: number, currentAcc: number) => {
    if (currentCpm > bestCpm && currentCpm >= 40) {
      if (currentAcc >= 95) {
        setRewardStats({
          cpm: currentCpm,
          prevBest: bestCpm,
          accuracy: currentAcc,
        });
        setShowMychewModal(true);
        try {
          localStorage.setItem(bestCpmKey, currentCpm.toString());
        } catch {}
        setBestCpm(currentCpm);
      }
    }
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const bufferedCharsRef = useRef<number>(0);
  const sentenceSpeedCheckpointsRef = useRef<{ label: string; cpm: number; accuracy: number }[]>([]);

  // Load saved progress on mount or when user / language changes
  useEffect(() => {
    const saved = loadSentenceProgress(currentUser?.id, language);
    if (saved) {
      const activeData = language === 'ko' ? SENTENCE_PRACTICE_DATA : ENGLISH_SENTENCE_PRACTICE_DATA;
      const validCat = Math.min(saved.categoryIndex, Math.max(0, activeData.length - 1));
      const targetCatSentences = activeData[validCat]?.sentences || [];
      const validSent = Math.min(saved.sentenceIndex, Math.max(0, targetCatSentences.length - 1));
      setSelectedCategoryIndex(validCat);
      setSentenceIndex(validSent);
      if (saved.completedTotal > 0) {
        setCompletedInSession(saved.completedTotal);
      }
      setHasResumed(true);
    } else {
      setSelectedCategoryIndex(0);
      setSentenceIndex(0);
    }
  }, [currentUser?.id, language]);

  // Active dataset according to chosen language
  const activeDataset = language === 'ko' ? SENTENCE_PRACTICE_DATA : ENGLISH_SENTENCE_PRACTICE_DATA;
  const currentCategory = activeDataset[selectedCategoryIndex] || activeDataset[0];

  // Random problem mode for sentences
  const [isRandomOrder, setIsRandomOrder] = useState<boolean>(true);
  const [shuffledSentences, setShuffledSentences] = useState<string[]>([]);

  const shuffleSentenceList = (list: string[]) => {
    const array = [...list];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    if (currentCategory?.sentences) {
      if (isRandomOrder) {
        setShuffledSentences(shuffleSentenceList(currentCategory.sentences));
      } else {
        setShuffledSentences(currentCategory.sentences);
      }
      setSentenceIndex(0);
      setInputVal('');
    }
  }, [selectedCategoryIndex, isRandomOrder, currentCategory]);

  const activeSentences = isRandomOrder && shuffledSentences.length > 0 ? shuffledSentences : currentCategory.sentences;
  const currentSentence = activeSentences[sentenceIndex] || activeSentences[0] || '';

  // Target next character and finger guide accurately based on atomic strokes
  const targetGuide = useMemo(() => {
    return getActiveKeystrokeGuide(currentSentence, inputVal);
  }, [currentSentence, inputVal]);

  // Handle focus
  useEffect(() => {
    inputRef.current?.focus();
  }, [sentenceIndex, selectedCategoryIndex, is5MinMode, language]);

  // 5-minute Countdown Timer & General Elapsed Timer
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setStats((prev) => {
          const newElapsed = prev.elapsedSeconds + 1;
          const mins = newElapsed / 60;
          const currentCpm = mins > 0 ? Math.round((prev.correctCount * 60) / newElapsed) : 0;
          return {
            ...prev,
            elapsedSeconds: newElapsed,
            cpm: currentCpm,
          };
        });

        if (is5MinMode) {
          setRemainingTime5Min((prev) => {
            if (prev <= 1) {
              handleSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, is5MinMode]);

  // Handle sentence completion (advances regardless of typos, accurately penalizes accuracy)
  const handleSentenceSubmit = (typedVal: string) => {
    if (!typedVal) return;

    // Calculate mistakes in the current sentence
    const targetLen = currentSentence.length;
    let sentenceErrors = 0;
    let sentenceCorrect = 0;

    for (let i = 0; i < targetLen; i++) {
      if (i < typedVal.length) {
        if (typedVal[i] === currentSentence[i]) {
          sentenceCorrect += 1;
        } else {
          sentenceErrors += 1;
        }
      } else {
        // Missing characters count as errors
        sentenceErrors += 1;
      }
    }

    if (typedVal.length > targetLen) {
      sentenceErrors += (typedVal.length - targetLen);
    }

    // Update cumulative stats with actual errors & lowered accuracy
    setStats((prev) => {
      const newErrors = prev.errorCount + sentenceErrors;
      const newCorrect = prev.correctCount + sentenceCorrect;
      const newTotal = prev.totalKeystrokes + Math.max(typedVal.length, targetLen);
      const acc = newTotal > 0 ? Math.max(0, Math.round(((newTotal - newErrors) / newTotal) * 100)) : 100;
      const mins = prev.elapsedSeconds / 60;
      const cpm = mins > 0 ? Math.round((newCorrect * 60) / prev.elapsedSeconds) : prev.cpm;

      return {
        ...prev,
        errorCount: newErrors,
        correctCount: newCorrect,
        totalKeystrokes: newTotal,
        accuracy: acc,
        cpm,
      };
    });

    handleNextSentence(sentenceErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Start timer on first keystroke
    if (!isTimerRunning && val.length > 0) {
      setIsTimerRunning(true);
    }

    const prevVal = inputVal;

    // Check if input is a valid prefix of target sentence (handles Korean character composition)
    const isValidPrefix = isHangulPrefix(currentSentence, val);
    setIsCorrectLastKey(isValidPrefix);

    // Count actual typos across the typed input
    let currentErrors = 0;
    for (let i = 0; i < val.length; i++) {
      if (i === val.length - 1 && i < currentSentence.length) {
        const targetSub = currentSentence.slice(0, val.length);
        if (!isHangulPrefix(targetSub, val)) {
          currentErrors++;
        }
      } else if (i < currentSentence.length) {
        if (val[i] !== currentSentence[i]) {
          currentErrors++;
        }
      } else {
        currentErrors++;
      }
    }

    const totalChars = val.length;
    const totalStrokes = countKeystrokes(val);
    const acc = totalChars > 0 ? Math.max(0, Math.round(((totalChars - currentErrors) / totalChars) * 100)) : 100;

    // User backspaced
    if (val.length < prevVal.length) {
      setStats((prev) => ({
        ...prev,
        errorCount: currentErrors,
        accuracy: acc,
        combo: currentErrors === 0 ? prev.combo : 0,
      }));
      setInputVal(val);
      return;
    }

    const lastChar = val[val.length - 1];
    setLastKeyPressed(lastChar);

    if (lastChar) {
      const guide = getKeyGuideForChar(lastChar);
      if (guide) {
        setActiveKeyCode(guide.code);
        setLastFingerUsed(guide.fingerName);
        setTimeout(() => setActiveKeyCode(null), 180);
      }
    }

    if (isValidPrefix) {
      soundManager.playKeyClick(true);
      setStats((prev) => {
        const newCombo = currentErrors === 0 ? prev.combo + 1 : 0;
        return {
          ...prev,
          correctCount: Math.max(0, totalChars - currentErrors),
          errorCount: currentErrors,
          totalKeystrokes: totalStrokes,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
          accuracy: acc,
        };
      });
    } else {
      soundManager.playError();
      setStats((prev) => ({
        ...prev,
        errorCount: currentErrors,
        totalKeystrokes: totalStrokes,
        combo: 0,
        accuracy: acc,
      }));
    }

    setInputVal(val);

    // Buffer keystrokes in memory to eliminate input overhead for concurrent users
    bufferedCharsRef.current += 1;

    // Auto-advance ONLY when the sentence is exactly matched!
    // (Prevents cutting off unfinished Korean syllables like '하ㄴ' for '하늘')
    if (val === currentSentence) {
      handleSentenceSubmit(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputVal.length > 0) {
      e.preventDefault();
      handleSentenceSubmit(inputVal);
    }
  };

  const handleNextSentence = (recentSentenceErrors: number = 0) => {
    if (recentSentenceErrors === 0) {
      soundManager.playSuccess();
    } else {
      soundManager.playKeyClick(true);
    }

    const nextCompleted = completedInSession + 1;
    setCompletedInSession(nextCompleted);

    // Flush buffered character keystrokes only at sentence milestone
    if (bufferedCharsRef.current > 0) {
      dailyMissionsManager.incrementProgress('chars', bufferedCharsRef.current, currentUser?.id);
      bufferedCharsRef.current = 0;
    }
    dailyMissionsManager.saveLastPractice({
      mode: 'sentence-practice',
      modeTitle: is5MinMode ? '5분 마라톤' : '3단계: 짧은 글 연습',
      stageTitle: currentCategory.category,
      language,
      cpm: stats.cpm,
      accuracy: stats.accuracy,
    }, currentUser?.id, true);

    // Record speed checkpoint for trend chart
    sentenceSpeedCheckpointsRef.current.push({
      label: `${nextCompleted}문장`,
      cpm: stats.cpm,
      accuracy: stats.accuracy,
    });

    // Award typing practice points for Tamagotchi room decorating
    addTypingPracticePoints(10, '짧은 글 문장 완주');
    if (nextCompleted % 5 === 0) {
      dailyMissionsManager.incrementProgress('lesson', 1, currentUser?.id);
    }

    // Save to user practice history
    if (currentUser) {
      recordPracticeHistory({
        userId: currentUser.id,
        userName: currentUser.name,
        mode: 'sentence-practice',
        modeTitle: is5MinMode 
          ? `5분 마라톤 (${language === 'ko' ? '한글' : 'English'})` 
          : `짧은 글 [${language === 'ko' ? '한글' : 'EN'}] (${currentCategory.category})`,
        language,
        stageTitle: currentCategory.category,
        sampleText: currentSentence,
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        errorCount: stats.errorCount + recentSentenceErrors,
        correctCount: stats.correctCount,
        totalKeystrokes: stats.totalKeystrokes,
        elapsedSeconds: stats.elapsedSeconds,
      });
    }

    // Only logged-in users get recorded in the Hall of Fame Leaderboard
    if (currentUser && stats.cpm > 30) {
      onRecordScore({
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '⭐',
        mode: 'sentence',
        modeTitle: is5MinMode 
          ? `5분 마라톤 (${language === 'ko' ? '한글' : 'English'})` 
          : `짧은 글 [${language === 'ko' ? '한글' : 'EN'}] (${currentCategory.category})`,
        score: stats.cpm * 10 + stats.accuracy * 5 + nextCompleted * 100,
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        details: `${currentCategory.category} (${nextCompleted}문장 완주)`,
        completedSentences: nextCompleted,
      });
    }

    // Continuous advancement: advance within category, or trigger set result!
    let nextCategoryIdx = selectedCategoryIndex;
    let nextSentenceIdx = sentenceIndex + 1;

    if (nextSentenceIdx < activeSentences.length) {
      // Continue next sentence in same category
      setSentenceIndex(nextSentenceIdx);
      setInputVal('');
      saveSentenceProgress(currentUser?.id, language, nextCategoryIdx, nextSentenceIdx, nextCompleted);
    } else {
      // Reached the end of current category set:
      setIsTimerRunning(false);
      soundManager.playVictory();

      const finalCpm = stats.cpm;
      const finalErrors = stats.errorCount + recentSentenceErrors;
      const finalAccuracy = stats.accuracy;
      const isFirst = bestCpm === 0;
      const isBeat = !isFirst && finalCpm > bestCpm && finalAccuracy >= 95;

      if (isFirst && finalCpm > 0) {
        try {
          localStorage.setItem(bestCpmKey, finalCpm.toString());
        } catch {}
        setBestCpm(finalCpm);
      } else if (isBeat) {
        try {
          localStorage.setItem(bestCpmKey, finalCpm.toString());
        } catch {}
        setBestCpm(finalCpm);
      }

      setSetResultData({
        cpm: finalCpm,
        errorCount: finalErrors,
        accuracy: finalAccuracy,
        prevBest: bestCpm,
        isFirst,
        isBeat,
      });
      setShowSetResultModal(true);
    }
  };

  const handleNextSetFromModal = () => {
    setShowSetResultModal(false);
    if (is5MinMode) {
      setSentenceIndex(0);
      setInputVal('');
      resetSessionStats();
    } else if (selectedCategoryIndex + 1 < activeDataset.length) {
      const nextCategoryIdx = selectedCategoryIndex + 1;
      setSelectedCategoryIndex(nextCategoryIdx);
      setSentenceIndex(0);
      setInputVal('');
      resetSessionStats();
      saveSentenceProgress(currentUser?.id, language, nextCategoryIdx, 0, completedInSession);
    } else {
      saveSentenceProgress(currentUser?.id, language, 0, 0, completedInSession);
      handleSessionComplete();
    }
  };

  const handleRetrySetFromModal = () => {
    setShowSetResultModal(false);
    setSentenceIndex(0);
    setInputVal('');
    resetSessionStats();
  };

  const resetSessionStats = () => {
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
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    inputRef.current?.focus();
  };

  const handleSessionComplete = () => {
    setIsTimerRunning(false);
    setShowSummaryModal(true);
    soundManager.playVictory();
    addTypingPracticePoints(60, is5MinMode ? '5분 마라톤 완주' : '문장 연습 코스 완주');
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}

    // Only logged-in users get recorded in the Hall of Fame Leaderboard
    if (currentUser && stats.cpm > 30) {
      onRecordScore({
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '👑',
        mode: 'sentence',
        modeTitle: is5MinMode 
          ? `5분 마라톤 (${language === 'ko' ? '한글' : 'English'})` 
          : `짧은 글 [${language === 'ko' ? '한글' : 'EN'}] (${currentCategory.category})`,
        score: stats.cpm * 10 + stats.accuracy * 5 + (completedInSession || 1) * 100,
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        details: `${is5MinMode ? '5분 완주' : currentCategory.category} (${completedInSession || 1}문장 완료)`,
        completedSentences: completedInSession || 1,
      });
    }
  };

  const handleResetSession = () => {
    setInputVal('');
    setSentenceIndex(0);
    setCompletedInSession(0);
    setShowSummaryModal(false);
    setIsTimerRunning(false);
    setRemainingTime5Min(300);
    saveSentenceProgress(currentUser?.id, language, selectedCategoryIndex, 0, 0);
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
    inputRef.current?.focus();
  };

  const formatRemainingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden p-1 sm:p-2 select-none">
      {/* =========================================================================
          1. COMPACT TOP TOOLBAR (Language, Category, 5-Min, Shuffle, Retry, MyChew, Keyboard toggle)
         ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-1.5 shrink-0">
        {/* Left: Language, Category Dropdown & Shuffle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Language Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setLanguage('ko');
                setSelectedCategoryIndex(0);
                handleResetSession();
              }}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                language === 'ko' ? 'bg-pink-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇰🇷 한글
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setSelectedCategoryIndex(0);
                handleResetSession();
              }}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                language === 'en' ? 'bg-sky-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇺🇸 EN
            </button>
          </div>

          {/* Category Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedCategoryIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedCategoryIndex(idx);
                setSentenceIndex(0);
                setInputVal('');
                handleResetSession();
              }}
              className="text-xs font-bold text-slate-800 bg-pink-50 hover:bg-pink-100/80 border border-pink-200 rounded-lg px-2 py-1 pr-6 shadow-2xs focus:ring-1 focus:ring-pink-400 focus:outline-hidden cursor-pointer appearance-none max-w-[140px] sm:max-w-[200px] truncate"
            >
              {activeDataset.map((cat, idx) => (
                <option key={cat.id} value={idx}>
                  {cat.category} ({cat.sentences.length}문장)
                </option>
              ))}
            </select>
            <ChevronRight className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
          </div>

          {/* Random Sentence Shuffle */}
          <button
            type="button"
            onClick={() => {
              if (currentCategory?.sentences) {
                setShuffledSentences(shuffleSentenceList(currentCategory.sentences));
                setSentenceIndex(0);
                setInputVal('');
                handleResetSession();
              }
            }}
            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-black border border-purple-200 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            title="문장 순서를 무작위로 섞습니다"
          >
            <Shuffle className="w-3 h-3 text-purple-600" />
            <span className="hidden sm:inline">랜덤</span>
          </button>

          {/* 5-Min Marathon Switcher */}
          <button
            type="button"
            onClick={() => {
              setIs5MinMode((prev) => !prev);
              handleResetSession();
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all shadow-2xs cursor-pointer ${
              is5MinMode
                ? 'bg-amber-500 text-white ring-2 ring-amber-300 font-extrabold scale-105'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
            title="5분 동안 쉬지 않고 달리는 마라톤 타자 모드"
          >
            <Timer className="w-3 h-3 text-amber-600" />
            <span>{is5MinMode ? `5분 마라톤 (${formatRemainingTime(remainingTime5Min)})` : '5분 마라톤'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetSession}
            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black border border-slate-300 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            title="현재 테마를 처음부터 다시 칩니다"
          >
            <RotateCcw className="w-3 h-3 text-slate-600" />
            <span>다시</span>
          </button>
        </div>

        {/* Right: MyChew Target pill & Keyboard Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg bg-pink-50 border border-pink-200 text-[11px] font-bold text-pink-700">
            <span>🍬 마이쮸:</span>
            <span className="font-mono font-black text-purple-700">{bestCpm > 0 ? `${bestCpm} CPM 갱신` : '95% 이상'}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowKeyboard((prev) => !prev)}
            className={`px-2 py-1 rounded-lg border text-xs font-black transition cursor-pointer flex items-center gap-1 ${
              showKeyboard 
                ? 'bg-sky-500 text-white border-sky-600 shadow-2xs' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="가상 키보드 가이드 켜기/끄기"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">키보드 {showKeyboard ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CLASSIC HANCOM / ARCADE DISPLAY CONSOLE CASING (Scroll-Free)
         ========================================================================= */}
      <div className="flex-1 min-h-0 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 p-2 sm:p-2.5 rounded-2xl border-3 border-slate-300 shadow-md relative flex flex-col justify-between overflow-hidden my-1">
        {/* Top Status Strip: 진행도 / 완주 문장 / 오타수 / 정확도 / 타수 */}
        <div className="bg-white/85 backdrop-blur-xs rounded-lg px-2.5 py-1 border border-slate-300 shadow-xs mb-1.5 flex items-center justify-between gap-2 text-xs font-black text-slate-700 shrink-0">
          {/* 진행도 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 text-[11px]">문장</span>
            <span className="font-mono text-pink-700 bg-pink-50 px-1.5 py-0.2 rounded border border-pink-200 text-[11px] font-black">
              {sentenceIndex + 1} / {activeSentences.length}
            </span>
          </div>

          {/* 완주 문장 */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-600">완주</span>
            <span className="px-1.5 py-0.2 bg-teal-50 border border-teal-200 rounded font-mono font-black text-teal-700">
              {completedInSession}개
            </span>
          </div>

          {/* 오타수 */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-600">오타</span>
            <span className="px-1.5 py-0.2 bg-slate-100 border border-slate-300 rounded font-mono font-black text-rose-600">
              {stats.errorCount}
            </span>
          </div>

          {/* 정확도 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 text-[11px]">정확도</span>
            <div className="w-14 sm:w-20 bg-slate-200 h-2 rounded-full overflow-hidden border border-slate-300">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="font-mono text-slate-800 text-[11px]">{stats.accuracy}%</span>
          </div>

          {/* 타수 / CPM */}
          <div className="flex items-center gap-1">
            <span className="text-slate-600 text-[11px]">속도</span>
            <span className="font-mono text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 text-[11px] font-black">
              {stats.cpm} 타
            </span>
          </div>

          {/* 5분 타이머 표시 */}
          {is5MinMode && (
            <div className="flex items-center gap-1">
              <span className="text-amber-800 bg-amber-100 px-2 py-0.2 rounded border border-amber-300 font-mono text-[11px] font-black animate-pulse">
                ⏱ {formatRemainingTime(remainingTime5Min)}
              </span>
            </div>
          )}
        </div>

        {/* =========================================================================
            CYAN AQUA DISPLAY PANEL (Sentence Screen)
           ========================================================================= */}
        <div className={`bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400 rounded-xl p-2.5 sm:p-3.5 border-2 border-sky-500 shadow-inner flex flex-col justify-between gap-2 relative overflow-hidden shrink-0 ${
          showKeyboard ? 'h-36 sm:h-40' : 'flex-1 min-h-0'
        }`}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

          {/* Top Header inside Aqua Screen */}
          <div className="flex items-center justify-between z-10 text-xs font-bold text-sky-950 pb-1 border-b border-sky-300/60">
            <div className="flex items-center gap-2">
              <span className="bg-sky-100/90 text-sky-900 px-2 py-0.5 rounded-md border border-sky-200 text-[11px] font-black">
                {currentCategory.category}
              </span>
              <span className="text-[11px] text-sky-900/80 font-mono font-extrabold">
                {sentenceIndex + 1} / {activeSentences.length}
              </span>
              {hasResumed && (
                <span className="text-[10px] font-bold text-teal-900 bg-teal-100/80 px-1.5 py-0.2 rounded border border-teal-200">
                  이어하기 중
                </span>
              )}
            </div>

            {/* Target Character / Finger Quick Guidance */}
            {targetGuide && (
              <div className="hidden sm:flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded-md border border-sky-300 text-[11px]">
                <span className="text-slate-600 font-medium">다음 칠 글자:</span>
                <span className="font-mono font-black text-rose-600 bg-rose-50 px-1 rounded border border-rose-200">
                  {targetGuide.charDisplay === ' ' ? '␣(스페이스)' : targetGuide.charDisplay}
                </span>
                <span className="text-slate-500 font-bold">
                  [{targetGuide.fingerName || targetGuide.finger}]
                </span>
              </div>
            )}
          </div>

          {/* Target Sentence with Character-by-Character Highlighting */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="flex-1 flex items-center justify-center text-center p-2 bg-white/90 rounded-xl border border-sky-300 shadow-inner z-10 cursor-text overflow-hidden"
          >
            <div className="text-base sm:text-xl md:text-2xl font-black tracking-wide leading-relaxed font-arcade select-none break-keep max-w-3xl">
              {currentSentence.split('').map((char, index) => {
                let charStyle = 'text-slate-400';

                if (index < inputVal.length - 1) {
                  if (inputVal[index] === char) {
                    charStyle = 'text-teal-600 font-black';
                  } else {
                    charStyle = 'text-rose-500 font-black bg-rose-100 underline decoration-rose-500 decoration-2';
                  }
                } else if (index === inputVal.length - 1) {
                  if (inputVal[index] === char) {
                    charStyle = 'text-teal-600 font-black';
                  } else if (isHangulPrefix(char, inputVal[index])) {
                    charStyle = 'text-teal-600 font-black bg-sky-100/80 ring-2 ring-sky-300 rounded-xs';
                  } else {
                    charStyle = 'text-rose-500 font-black bg-rose-100 underline decoration-rose-500 decoration-2';
                  }
                } else if (index === inputVal.length) {
                  charStyle = 'text-slate-900 font-black bg-pink-200 ring-2 ring-pink-400 rounded-xs animate-pulse';
                }

                return (
                  <span key={index} className={`transition-colors px-0.5 ${charStyle}`}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* User Typing Input Field & Progress */}
          <div className="z-10 relative">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={language === 'ko' ? "위의 한글 문장을 타이핑하세요..." : "Type the sentence above..."}
                className="w-full text-sm sm:text-lg font-black px-3.5 py-1.5 sm:py-2 rounded-xl border-2 border-sky-400 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-hidden bg-white text-slate-800 tracking-wide font-arcade shadow-xs"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoFocus
              />

              {/* Progress Line */}
              <div className="w-full bg-sky-950/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 h-full transition-all duration-150 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((inputVal.length / Math.max(1, currentSentence.length)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. VIRTUAL KEYBOARD (Shown when showKeyboard is true) OR KEY GUIDE BANNER
           ========================================================================= */}
        {showKeyboard ? (
          <div className="mt-1 shrink-0">
            <VirtualKeyboard
              activeKeyCode={activeKeyCode}
              targetKey={targetGuide?.charDisplay || targetGuide?.code}
              targetKeyCode={targetGuide?.code}
              targetFinger={targetGuide?.finger}
              needsShift={targetGuide?.shift}
              lastFingerUsed={lastFingerUsed}
              isCorrectLastKey={isCorrectLastKey}
              isCorrect={isCorrectLastKey}
              showHandsOverlay={true}
            />
          </div>
        ) : (
          <div className="mt-1 bg-white/75 backdrop-blur-xs rounded-xl p-2 border border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold shrink-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black">
                💡 연습 꿀팁
              </span>
              <span className="text-[11px] text-slate-700">
                문장을 끝까지 치면 자동으로 다음 문장으로 넘어가요! 오타가 있어도 자연스럽게 타이핑하세요.
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
              <span>콤보:</span>
              <span className="font-black text-rose-600">🔥 {stats.combo}</span>
            </div>
          </div>
        )}
      </div>

      {/* Completion / Session Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border-4 border-pink-300 space-y-5 arcade-card-glow">
            <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 mx-auto flex items-center justify-center border-2 border-pink-300 shadow-md">
              <Trophy className="w-9 h-9 text-amber-500 animate-bounce" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-arcade">
                🎉 짧은 글 연습 완료!
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-bold">
                {currentUser ? (
                  <>기록이 <strong className="text-pink-600">명예의 전당</strong>에 성공적으로 반영되었습니다.</>
                ) : (
                  <>비로그인 상태입니다. 랭킹 등록을 원하시면 상단에서 로그인해 보세요!</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 bg-pink-50/70 p-4 rounded-2xl border-2 border-pink-200">
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block">최고 타수</span>
                <span className="text-2xl font-black text-pink-600 font-mono">{stats.cpm}</span>
                <span className="text-[10px] text-slate-400 block">CPM</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block">정확도</span>
                <span className="text-2xl font-black text-teal-600 font-mono">{stats.accuracy}%</span>
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 block">완주 문장</span>
                <span className="text-2xl font-black text-sky-600 font-mono">{completedInSession || 1}</span>
                <span className="text-[10px] text-slate-400 block">문장</span>
              </div>
            </div>

            {/* Recharts Typing Speed Trend Chart */}
            <TypingSpeedTrendChart
              currentCpm={stats.cpm}
              currentAccuracy={stats.accuracy}
              checkpoints={sentenceSpeedCheckpointsRef.current}
              stageTitle={currentCategory.category}
            />

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleResetSession}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-2 border-amber-300 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>🎯 직전 단계 다시 치기 (재도전)</span>
              </button>
              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  handleNextSentence();
                }}
                className="flex-1 py-3 rounded-2xl arcade-btn-pink text-white font-black text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>다음 문장 계속하기 ▶</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Set Result Modal (Set completion with CPM, errors, and Mychew eligibility) */}
      <PracticeSetResultModal
        isOpen={showSetResultModal}
        onClose={() => setShowSetResultModal(false)}
        title="3단계: 짧은 글 연습"
        cpm={setResultData.cpm}
        errorCount={setResultData.errorCount}
        accuracy={setResultData.accuracy}
        modeType="sentence_long"
        prevBestCpm={setResultData.prevBest}
        isFirstRecord={setResultData.isFirst}
        isRecordBeat={setResultData.isBeat}
        onClaimMychew={() => {
          setShowSetResultModal(false);
          setRewardStats({
            cpm: setResultData.cpm,
            prevBest: setResultData.prevBest,
            accuracy: setResultData.accuracy,
          });
          setShowMychewModal(true);
        }}
        onRetry={handleRetrySetFromModal}
        onNext={handleNextSetFromModal}
      />

      {/* MyChew High Score Reward Modal */}
      <MychewRewardModal
        isOpen={showMychewModal}
        onClose={() => setShowMychewModal(false)}
        type="cpm_renewal"
        accuracy={rewardStats.accuracy}
        isSuccess={rewardStats.accuracy >= 95}
        cpm={rewardStats.cpm}
        prevBestCpm={rewardStats.prevBest}
        title="짧은 글 타자 연습"
        onRetry={() => {
          setShowMychewModal(false);
          handleResetSession();
        }}
        onNext={() => {
          setShowMychewModal(false);
          handleNextSetFromModal();
        }}
      />
    </div>
  );
};
