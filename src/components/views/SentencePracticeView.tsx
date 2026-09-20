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
  Shuffle
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
import { TypingReviewList, TypingReviewItem, isUnfinished } from '../TypingReviewList';
import { markQuestUnitDone } from '../../utils/questProgress';

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
  // 세트 안에서 문장별로 친 내용 (끝나면 '아직 안 친 곳'을 보여주기 위함)
  const [reviewItems, setReviewItems] = useState<TypingReviewItem[]>([]);
  const reviewModeRef = useRef(false);
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

  const typedLogKey = `tp_sentence_log_${currentUser?.id || 'guest'}_${language}_${is5MinMode ? 'm' : selectedCategoryIndex}`;
  const loadTypedLog = (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(typedLogKey) || '{}') || {};
    } catch {
      return {};
    }
  };
  const saveTypedLog = (log: Record<string, string>) => {
    try {
      localStorage.setItem(typedLogKey, JSON.stringify(log));
    } catch {}
  };
  const clearTypedLog = () => {
    try {
      localStorage.removeItem(typedLogKey);
    } catch {}
    reviewModeRef.current = false;
    setReviewItems([]);
  };

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

    saveTypedLog({ ...loadTypedLog(), [currentSentence]: typedVal });
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

    // 연습 기록·명예의 전당은 한 세트를 빠짐없이 끝까지 쳤을 때만 남김 (finishSet)

    // 치지 않은 문장 고치기 중이면: 다음 '안 친 문장'으로 바로 이동
    if (reviewModeRef.current) {
      const log = loadTypedLog();
      const nextMissing = activeSentences.findIndex((t) => isUnfinished(t, log[t]));
      if (nextMissing >= 0) {
        setSentenceIndex(nextMissing);
        setInputVal('');
        return;
      }
      reviewModeRef.current = false;
      finishSet(recentSentenceErrors);
      return;
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
      finishSet(recentSentenceErrors);
    }
  };

  // 한 세트(주제)를 끝까지 왔을 때: 결과 + 아직 안 친 문장 목록
  const finishSet = (recentSentenceErrors: number) => {
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
      const log = loadTypedLog();
      const missing: TypingReviewItem[] = [];
      activeSentences.forEach((t, i) => {
        if (isUnfinished(t, log[t])) {
          missing.push({
            label: `${i + 1}번째 문장`,
            target: t,
            typed: log[t],
            onGo: () => {
              reviewModeRef.current = true;
              setShowSetResultModal(false);
              setSentenceIndex(i);
              setInputVal('');
              setIsTimerRunning(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            },
          });
        }
      });
      setReviewItems(missing);
      if (!missing.length) {
        if (!is5MinMode) markQuestUnitDone(currentUser?.id, 'sentence-practice', currentCategory.category, language);
        const setTitle = is5MinMode
          ? `5분 마라톤 (${language === 'ko' ? '한글' : 'English'})`
          : `짧은 글 [${language === 'ko' ? '한글' : 'EN'}] (${currentCategory.category})`;
        recordPracticeHistory({
          userId: currentUser?.id || 'guest',
          userName: currentUser?.name || '게스트',
          mode: 'sentence-practice',
          modeTitle: setTitle,
          language,
          stageTitle: currentCategory.category,
          sampleText: activeSentences[0],
          cpm: finalCpm,
          accuracy: finalAccuracy,
          errorCount: finalErrors,
          correctCount: stats.correctCount,
          totalKeystrokes: stats.totalKeystrokes,
          elapsedSeconds: stats.elapsedSeconds,
        });
        if (currentUser && finalCpm > 30) {
          onRecordScore({
            userName: currentUser.name,
            userAvatar: currentUser.avatar || '⭐',
            mode: 'sentence',
            modeTitle: setTitle,
            score: finalCpm * 10 + finalAccuracy * 5 + activeSentences.length * 100,
            cpm: finalCpm,
            accuracy: finalAccuracy,
            details: `${currentCategory.category} (${activeSentences.length}문장 완주)`,
            completedSentences: activeSentences.length,
          });
        }
      }
      setShowSetResultModal(true);
  };

  const handleNextSetFromModal = () => {
    setShowSetResultModal(false);
    clearTypedLog();
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
    clearTypedLog();
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
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* MyChew High Score Reward Mission Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-pink-50 via-purple-50 to-rose-50 p-3.5 sm:p-4 rounded-2xl border-2 border-pink-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl animate-bounce">🍬</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-pink-700">마이쮸 신기록 보상 미션</span>
              <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                타수 갱신 + 정확도 95% 이상 시 지급!
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-0.5">
              이전 최고 타수를 뛰어넘고 오타 없이(정확도 95% 이상) 치면 선생님 확인 후 마이쮸를 받아요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/90 px-3.5 py-1.5 rounded-xl border border-pink-200 shadow-2xs">
          <span className="text-xs font-bold text-stone-500">목표 기준 타수:</span>
          <span className="font-mono font-black text-sm text-pink-600">{bestCpm > 0 ? `${bestCpm} CPM` : '첫 완주 후 등록'}</span>
        </div>
      </div>

      {/* Top Banner: Mode, Language Switcher & 5-Min Switcher */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-4 border-pink-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 arcade-card-glow">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-black border border-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>명예의 전당 등록 전용 모드</span>
            </span>

            {/* Language Selector Indicator */}
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-black border border-sky-300 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>{language === 'ko' ? '🇰🇷 한글 모드' : '🇺🇸 영어 (English) 모드'}</span>
            </span>

            {!currentUser && (
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>비로그인 (자유 연습 모드 - 랭킹은 로그인 회원만 등록)</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 font-arcade">
            짧은 글 타자 연습
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            한글 또는 영어 문장을 자유롭게 선택하여 5분 이상 충분히 연습하고 <strong className="text-pink-600">명예의 전당</strong>에 도전하세요!
          </p>
        </div>

        {/* Language Toggle & 5-Min Marathon Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Language Toggle Pills */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => {
                setLanguage('ko');
                setSelectedCategoryIndex(0);
                handleResetSession();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                language === 'ko'
                  ? 'bg-pink-500 text-white shadow-xs scale-105'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇰🇷 한글
            </button>
            <button
              onClick={() => {
                setLanguage('en');
                setSelectedCategoryIndex(0);
                handleResetSession();
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                language === 'en'
                  ? 'bg-sky-500 text-white shadow-xs scale-105'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🇺🇸 영어 짧은 글
            </button>
          </div>

          {/* Random Sentence Shuffle Button */}
          <button
            onClick={() => {
              if (currentCategory?.sentences) {
                setShuffledSentences(shuffleSentenceList(currentCategory.sentences));
                setSentenceIndex(0);
                setInputVal('');
                handleResetSession();
              }
            }}
            className="px-3.5 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-xs font-black border border-purple-300 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="문장 순서를 무작위로 섞어 랜덤하게 문제를 제시합니다"
          >
            <Shuffle className="w-4 h-4 text-purple-600" />
            <span>🎲 문장 랜덤 출제</span>
          </button>

          {/* 5-Min Marathon Button */}
          <button
            onClick={() => {
              setIs5MinMode((prev) => !prev);
              handleResetSession();
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-sm ${
              is5MinMode
                ? 'arcade-btn-yellow text-amber-950 ring-4 ring-amber-200 scale-105'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-2 border-amber-200'
            }`}
          >
            <Timer className="w-4 h-4 text-amber-600" />
            <span>
              {is5MinMode ? `🔥 5분 마라톤 (${formatRemainingTime(remainingTime5Min)})` : '⏱️ 5분 마라톤 모드'}
            </span>
          </button>

          <button
            onClick={handleResetSession}
            className="px-3.5 py-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            title="현재 테마를 처음부터 다시 칩니다"
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>이 단계 다시 치기</span>
          </button>
        </div>
      </div>

      {/* Category Selection Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {activeDataset.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategoryIndex(idx);
              setSentenceIndex(0);
              setInputVal('');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 border-2 ${
              selectedCategoryIndex === idx
                ? 'bg-pink-500 text-white border-pink-600 shadow-md scale-105 ring-2 ring-pink-200'
                : 'bg-white text-slate-700 border-pink-100 hover:border-pink-300 hover:bg-pink-50/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{cat.category}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              selectedCategoryIndex === idx ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-700'
            }`}>
              {cat.sentences.length}문장
            </span>
          </button>
        ))}
      </div>

      {/* Real-time Stats Bar */}
      <StatsBar stats={stats} />

      {/* Main Sentence Display Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-pink-200 shadow-xl space-y-6 relative overflow-hidden arcade-card-glow">
        {/* Header inside display: Sentence Progress & Category Description */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-pink-600 bg-pink-50 px-3 py-1 rounded-xl border border-pink-200">
              {currentCategory.category}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {sentenceIndex + 1} / {currentCategory.sentences.length} 문장
            </span>
            {hasResumed && (
              <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-600" />
                <span>이전 위치 이어서 연습 중</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-extrabold">
            <span className="text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              누적 완주: {completedInSession} 문장
            </span>
            {is5MinMode && (
              <span className="text-amber-700 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 font-mono font-black animate-pulse">
                남은 시간: {formatRemainingTime(remainingTime5Min)}
              </span>
            )}
          </div>
        </div>

        {/* Target Sentence with Character-by-Character Highlighting */}
        <div className="min-h-24 sm:min-h-28 flex flex-col justify-center items-center text-center p-4 bg-sky-50/50 rounded-2xl border-2 border-sky-100">
          <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide leading-relaxed font-arcade select-none">
            {currentSentence.split('').map((char, index) => {
              let charStyle = 'text-slate-400';

              if (index < inputVal.length - 1) {
                if (inputVal[index] === char) {
                  charStyle = 'text-sky-600 font-black';
                } else {
                  charStyle = 'text-rose-500 font-black bg-rose-100 underline decoration-rose-500';
                }
              } else if (index === inputVal.length - 1) {
                if (inputVal[index] === char) {
                  charStyle = 'text-sky-600 font-black';
                } else if (isHangulPrefix(char, inputVal[index])) {
                  charStyle = 'text-sky-600 font-black bg-sky-100/60 ring-2 ring-sky-300 rounded-sm';
                } else {
                  charStyle = 'text-rose-500 font-black bg-rose-100 underline decoration-rose-500';
                }
              } else if (index === inputVal.length) {
                charStyle = 'text-slate-900 font-black bg-pink-200 ring-2 ring-pink-400 rounded-sm animate-pulse';
              }

              return (
                <span key={index} className={`transition-colors px-0.5 ${charStyle}`}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>
        </div>

        {/* User Typing Input Field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={language === 'ko' ? "위의 한글 문장을 타이핑하세요 (오타가 있어도 자연스럽게 넘어가요!)..." : "Type the sentence above (typos won't block you)..."}
            className="block w-full text-center text-xl sm:text-2xl md:text-3xl font-black px-6 py-4 rounded-2xl border-4 border-pink-300 focus:border-pink-500 focus:ring-4 focus:ring-pink-200 outline-hidden bg-pink-50/30 text-slate-800 tracking-wide font-arcade placeholder:text-base sm:placeholder:text-lg placeholder:text-slate-400"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Quick Progress Bar for Current Sentence */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-pink-400 via-rose-400 to-sky-400 h-full transition-all duration-150 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((inputVal.length / currentSentence.length) * 100))}%`,
              }}
            ></div>
          </div>
        </div>
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
        review={<TypingReviewList items={reviewItems} title="아직 안 친 문장" emptyText="이번 세트의 문장을 빠짐없이 모두 쳤어요! 👏" />}
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
