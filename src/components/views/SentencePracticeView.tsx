import { RecordRuleNote } from '../RecordRuleNote';
import { accuracyOf, canAdvanceByEnter, canAdvanceBySpace, gradeLive, gradeText, isRecordable, netCpm } from '../../utils/typingScore';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PRACTICE_SET_POINTS } from '../../utils/pointRules';
import confetti from 'canvas-confetti';
import { 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  BookOpen, 
  Timer, 
  Globe,
  Lock,
  CheckCircle2
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
  // 손을 멈춘 동안(10초 이상)은 시간이 흐르지 않게 해서 타수가 엉뚱하게 낮아지지 않도록 함
  const lastKeyAtRef = useRef<number>(Date.now());
  /** 세트 결과 창이 뜬 뒤에는 Enter·스페이스를 더 눌러도 다시 넘어가거나 기록되지 않게 */
  const setFinishedRef = useRef(false);
  const sessionDoneRef = useRef(false);
  const [shortHint, setShortHint] = useState('');

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
      setFinishedRef.current = false;
    }
  }, [selectedCategoryIndex, isRandomOrder, currentCategory]);

  // 한 세트 = 짧은 글 20개 (선생님 요청). 섞기 모드면 세트마다 다른 20개
  const SET_SENTENCES = 20;
  const activeSentences = (isRandomOrder && shuffledSentences.length > 0 ? shuffledSentences : currentCategory.sentences).slice(0, SET_SENTENCES);
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
        const idle = Date.now() - lastKeyAtRef.current > 10000;
        setStats((prev) => {
          if (idle) return prev; // 쉬는 동안은 시간도 타수도 그대로
          const newElapsed = prev.elapsedSeconds + 1;
          const mins = newElapsed / 60;
          // 순타수 = 맞게 친 타수 ÷ 시간 (오타 글자는 빠짐)
          const currentCpm = netCpm(prev.correctStrokes || 0, newElapsed);
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

  /**
   * 이 세트에서 '넘긴 문장'들의 합계 (화면의 타수·오타·정확도는 이것 + 지금 치는 문장)
   *  - 타수는 맞게 친 글자만 셈 → 틀리게 치거나 스페이스만 눌러서는 타수가 올라가지 않음
   *  - 틀린 글자·빠뜨린 글자·더 친 글자는 모두 오타
   */
  const committedRef = useRef({ errors: 0, correct: 0, total: 0, strokes: 0 });
  const zeroCommitted = () => {
    committedRef.current = { errors: 0, correct: 0, total: 0, strokes: 0 };
  };
  // 문장 넘기기: 오타가 있어도 넘어가지만, 오타는 오타로 세고 타수에는 맞게 친 글자만 들어감
  const handleSentenceSubmit = (typedVal: string) => {
    if (!typedVal || setFinishedRef.current) return;
    const target = currentSentence.trimEnd();
    const typed = typedVal.replace(/\s+$/, '');
    // 절반도 안 치고 넘기는 것은 막음 (Enter 만 눌러 건너뛰기 방지)
    if (!canAdvanceByEnter(target, typed)) {
      setShortHint('문장을 끝까지 치고 넘어가요!');
      soundManager.playError();
      window.setTimeout(() => setShortHint(''), 1800);
      return;
    }
    const g = gradeText(target, typed);
    const c = committedRef.current;
    c.errors += g.errors;
    c.correct += g.correct;
    c.total += g.total;
    c.strokes += g.strokes;
    const acc = c.total > 0 ? Math.max(0, Math.round(((c.total - c.errors) / c.total) * 100)) : 100;

    setStats((prev) => ({
      ...prev,
      correctStrokes: c.strokes,
      errorCount: c.errors,
      correctCount: c.correct,
      totalKeystrokes: c.strokes,
      accuracy: acc,
      cpm: netCpm(c.strokes, prev.elapsedSeconds),
    }));

    saveTypedLog({ ...loadTypedLog(), [currentSentence]: typed });
    handleNextSentence(g.errors);
  };

  // 한글 조합 중에 Enter 를 누르면, 글자가 완성된 뒤에 넘김 (마지막 글자가 다음 문장으로 딸려 가지 않게)
  const composingRef = useRef(false);
  const pendingSubmitRef = useRef(false);
  const handleCompositionStart = () => {
    composingRef.current = true;
  };
  const handleCompositionEnd = () => {
    composingRef.current = false;
    if (!pendingSubmitRef.current) return;
    pendingSubmitRef.current = false;
    setTimeout(() => {
      const v = (inputRef.current?.value ?? '').replace(/\s+$/, '');
      if (v) handleSentenceSubmit(v);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setFinishedRef.current) return;
    const val = e.target.value;
    lastKeyAtRef.current = Date.now();

    // 문장을 끝까지 친 뒤 스페이스를 누르면 다음 문장으로 넘어감 (다 치기만 해서는 넘어가지 않음)
    //  (빠르게 치다 한두 글자를 빠뜨려도 끝에서 스페이스가 먹힘 — 빠뜨린 글자는 오타)
    if (val.endsWith(' ') && val.trim().length > 0 && canAdvanceBySpace(currentSentence, val.trimEnd())) {
      handleSentenceSubmit(val.trimEnd());
      return;
    }
    // 맨 앞에서 스페이스만 누른 것은 무시
    if (/^\s+$/.test(val)) {
      setInputVal('');
      return;
    }

    // Start timer on first keystroke
    if (!isTimerRunning && val.length > 0) {
      setIsTimerRunning(true);
    }

    const prevVal = inputVal;

    // Check if input is a valid prefix of target sentence (handles Korean character composition)
    const isValidPrefix = isHangulPrefix(currentSentence, val);
    setIsCorrectLastKey(isValidPrefix);

    // 지금 치는 문장: 오타 수와 맞게 친 타수 (마지막 글자는 한글 조합 중일 수 있어 앞부분이 맞으면 맞음으로)
    const lg = gradeLive(currentSentence, val, isHangulPrefix);
    const currentErrors = lg.errors;
    const currentCorrect = lg.correct;
    const currentStrokes = lg.strokes;

    const c = committedRef.current;
    const totalChars = c.total + val.length;
    const allErrors = c.errors + currentErrors;
    const acc = totalChars > 0 ? Math.max(0, Math.round(((totalChars - allErrors) / totalChars) * 100)) : 100;
    const live = {
      errorCount: allErrors,
      correctCount: c.correct + currentCorrect,
      correctStrokes: c.strokes + currentStrokes,
      totalKeystrokes: c.strokes + currentStrokes,
      accuracy: acc,
    };

    // User backspaced
    if (val.length < prevVal.length) {
      setStats((prev) => ({
        ...prev,
        ...live,
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
          ...live,
          combo: newCombo,
          maxCombo: Math.max(prev.maxCombo, newCombo),
        };
      });
    } else {
      soundManager.playError();
      setStats((prev) => ({
        ...prev,
        ...live,
        combo: 0,
      }));
    }

    setInputVal(val);

    // Buffer keystrokes in memory to eliminate input overhead for concurrent users
    bufferedCharsRef.current += 1;

    // 다 쳤어도 자동으로 넘어가지 않음: [Enter] 또는 [스페이스]를 눌러야 다음 문장으로 넘어감
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.repeat || setFinishedRef.current)) {
      e.preventDefault(); // Enter 를 꾹 누르고 있어도 한 번만
      return;
    }
    if (e.key === 'Enter' && inputVal.trim().length > 0) {
      e.preventDefault();
      if (composingRef.current || (e.nativeEvent as any).isComposing || e.keyCode === 229) {
        pendingSubmitRef.current = true; // 조합이 끝나면 넘김
        return;
      }
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
    // 문장 하나하나에는 포인트를 주지 않고, 한 세트를 끝낼 때 한 번에 지급
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
      if (setFinishedRef.current) return; // 이미 끝난 세트를 또 기록하지 않음
      setFinishedRef.current = true;
      setIsTimerRunning(false);
      setInputVal('');
      soundManager.playVictory();
      void recentSentenceErrors;

      // 맞게 친 타수 ÷ 시간 (넘긴 문장들의 합계로 바로 계산)
      const c = committedRef.current;
      const finalErrors = c.errors;
      const finalAccuracy = accuracyOf(c);
      const finalCpm = netCpm(c.strokes, stats.elapsedSeconds);
      // 최고 기록도 정확도 기준을 넘어야 남김 (오타가 많은 기록이 '최고 타수'가 되지 않게)
      const recordable = isRecordable(finalCpm, finalAccuracy);
      const isFirst = bestCpm === 0 && recordable;
      const isBeat = !isFirst && recordable && finalCpm > bestCpm && finalAccuracy >= 95;

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
              setFinishedRef.current = false;
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
          correctCount: c.correct,
          totalKeystrokes: c.strokes,
          elapsedSeconds: stats.elapsedSeconds,
        });
        // 명예의 전당: 한컴타자처럼 타수가 높을수록 정확도가 더 높아야 인정 (70~90%)
        if (currentUser && finalCpm > 30 && isRecordable(finalCpm, finalAccuracy)) {
          onRecordScore({
            userName: currentUser.name,
            userAvatar: currentUser.avatar || '⭐',
            mode: 'sentence',
            modeTitle: setTitle,
            score: finalCpm * 10 + finalAccuracy * 5 + activeSentences.length * 100,
            cpm: finalCpm,
            accuracy: finalAccuracy,
            details: `${currentCategory.category} (${activeSentences.length}문장 완주)`,
            errorCount: finalErrors,
            completedSentences: activeSentences.length,
            elapsedSeconds: stats.elapsedSeconds,
          });
        }
      }
      setShowSetResultModal(true);
  };

  const handleNextSetFromModal = () => {
    setFinishedRef.current = false;
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
    setFinishedRef.current = false;
    setShowSetResultModal(false);
    clearTypedLog();
    setSentenceIndex(0);
    setInputVal('');
    resetSessionStats();
  };

  const resetSessionStats = () => {
    zeroCommitted();
    sessionDoneRef.current = false;
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
    if (sessionDoneRef.current) return; // 5분이 끝나는 순간과 세트 끝이 겹쳐도 한 번만
    sessionDoneRef.current = true;
    setIsTimerRunning(false);
    setShowSummaryModal(true);
    soundManager.playVictory();
    addTypingPracticePoints(PRACTICE_SET_POINTS, is5MinMode ? '5분 마라톤 완주' : '짧은 글 1세트 완주');
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch {}

    // Only logged-in users get recorded in the Hall of Fame Leaderboard
    if (currentUser && isRecordable(stats.cpm, stats.accuracy)) {
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
        errorCount: stats.errorCount,
        completedSentences: completedInSession || 1,
        elapsedSeconds: stats.elapsedSeconds,
      });
    }
  };

  const handleResetSession = () => {
    setFinishedRef.current = false;
    sessionDoneRef.current = false;
    zeroCommitted();
    // 다시 시작할 때마다 문장 순서를 자동으로 새로 섞음
    if (currentCategory?.sentences) setShuffledSentences(shuffleSentenceList(currentCategory.sentences));
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
    <div className="tp-typing-screen space-y-3.5">
      {/* MyChew High Score Reward Mission Bar */}
      <div className="pr-toolbar px-3.5 py-2.5 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl leading-none">🍬</span>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black text-[#4d1d0c] font-arcade">마이쮸 신기록 보상 미션</span>
              <span className="text-[11px] font-black text-[#5c2c0e] bg-[#fde6a8] px-2 py-0.5 rounded-md border border-[#b88635]">
                타수 갱신 + 정확도 95% 이상 시 지급!
              </span>
            </div>
            <p className="text-[11px] text-[#5c3d22] font-bold mt-0.5">
              이전 최고 타수를 뛰어넘고 오타 없이(정확도 95% 이상) 치면 선생님 확인 후 마이쮸를 받아요!
            </p>
          </div>
        </div>

        <div className="pr-stat-plaque flex items-center gap-2 px-3 py-1.5">
          <span className="text-xs font-bold text-[#6e4622]">목표 기준 타수:</span>
          <span className="font-mono font-black text-sm text-[#a63016] tabular-nums">
            {bestCpm > 0 ? `${bestCpm} CPM` : '첫 완주 후 등록'}
          </span>
        </div>
      </div>

      {/* Top Banner: Mode, Language Switcher & 5-Min Switcher */}
      <div className="pr-toolbar p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-[#7c3518] text-[#fff6dc] text-[11px] font-black border border-[#3d220d] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#fde047]" />
              <span>명예의 전당 등록 전용 모드</span>
            </span>

            {/* Language Selector Indicator */}
            <span className="px-2.5 py-0.5 rounded-md bg-[#234d7a] text-[#fff8e2] text-[11px] font-black border border-[#14304d] flex items-center gap-1">
              <Globe className="w-3 h-3 text-[#93c5fd]" />
              <span>{language === 'ko' ? '🇰🇷 한글 모드' : '🇺🇸 영어 (English) 모드'}</span>
            </span>

            {!currentUser && (
              <span className="text-[11px] font-bold text-[#6e3a0e] bg-[#fef0c7] px-2 py-0.5 rounded-md border border-[#c69148] flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>비로그인 (자유 연습 모드 - 랭킹은 로그인 회원만 등록)</span>
              </span>
            )}
          </div>

          <h1 className="text-lg sm:text-xl font-black text-[#2c1507] tracking-tight mt-1 font-arcade">
            짧은 글 타자 연습
          </h1>
          <p className="text-xs text-[#5c3d22] font-bold">
            한글 또는 영어 문장을 자유롭게 선택하여 5분 이상 충분히 연습하고 <strong className="text-[#9e2a12]">명예의 전당</strong>에 도전하세요!
          </p>
        </div>

        {/* Language Toggle & 5-Min Marathon Switcher */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          {/* Language Toggle Wooden Switcher */}
          <div className="pr-wood-group flex items-center gap-1">
            <button
              onClick={() => {
                setLanguage('ko');
                setSelectedCategoryIndex(0);
                handleResetSession();
              }}
              className={`pr-wood-tab px-3 py-1.5 text-xs cursor-pointer ${
                language === 'ko' ? 'pr-wood-tab--active' : ''
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
              className={`pr-wood-tab px-3 py-1.5 text-xs cursor-pointer ${
                language === 'en' ? 'pr-wood-tab--blue' : ''
              }`}
            >
              🇺🇸 영어 짧은 글
            </button>
          </div>

          {/* 5-Min Marathon Button */}
          <button
            onClick={() => {
              setIs5MinMode((prev) => !prev);
              handleResetSession();
            }}
            className={`px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer ${
              is5MinMode ? 'tp-rpg-btn tp-rpg-btn--gold' : 'pr-stone-btn'
            }`}
          >
            <Timer className="w-4 h-4" />
            <span className="tabular-nums">
              {is5MinMode ? `🔥 5분 마라톤 (${formatRemainingTime(remainingTime5Min)})` : '⏱️ 5분 마라톤 모드'}
            </span>
          </button>

          <button
            onClick={handleResetSession}
            className="tp-rpg-btn tp-rpg-btn--wood px-3.5 py-2 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="현재 테마를 처음부터 다시 칩니다"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>이 단계 다시 치기</span>
          </button>
        </div>
      </div>

      {/* Category Selection Stone Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto tp-thin-scroll pb-1.5">
        {activeDataset.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategoryIndex(idx);
              setSentenceIndex(0);
              setInputVal('');
            }}
            className={`px-3.5 py-2 text-xs font-black whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedCategoryIndex === idx
                ? 'pr-stone-btn--active rounded-lg'
                : 'pr-stone-btn'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{cat.category}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
              selectedCategoryIndex === idx
                ? 'bg-[#3d220d]/15 text-[#2a1204]'
                : 'bg-[#2c1507]/12 text-[#3d220d]'
            }`}>
              {Math.min(SET_SENTENCES, cat.sentences.length)}문장
            </span>
          </button>
        ))}
      </div>

      {/* Real-time Stats Bar */}
      <StatsBar stats={stats} />

      {/* Main Sentence Display Box on Forest & Parchment Stage */}
      <div className="pr-shell p-3 sm:p-4 space-y-3">
        {/* Wooden Signboard Status Row */}
        <div className="pr-status-bar px-3.5 sm:px-5 py-2.5 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="pr-status-chip text-sm sm:text-base font-black px-3 py-1">
              📜 {currentCategory.category}
            </span>
            {/* 진행도 픽셀 게이지 */}
            <span className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-[#ffe9a8]">진행도</span>
              <span className="pr-gauge-track w-28 sm:w-40 h-4.5 inline-block align-middle">
                <span
                  className="pr-gauge-fill pr-gauge-fill--gold block"
                  style={{ width: `${Math.round((sentenceIndex / Math.max(1, activeSentences.length)) * 100)}%` }}
                />
              </span>
              <span className="min-w-[44px] text-right text-sm sm:text-base font-black text-white tabular-nums">
                {Math.round((sentenceIndex / Math.max(1, activeSentences.length)) * 100)}%
              </span>
              <span className="min-w-[100px] text-sm font-bold text-[#fde6a8] tabular-nums">
                ({sentenceIndex + 1} / {activeSentences.length} 문장)
              </span>
            </span>
            {hasResumed && (
              <span className="pr-status-chip text-xs font-black px-2.5 py-0.5 flex items-center gap-1 text-[#bbf7d0]">
                <Sparkles className="w-3.5 h-3.5 text-[#4ade80]" />
                <span>이전 위치 이어서 연습 중</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold">
            <span className="pr-status-chip px-3 py-1 text-[#fde68a] tabular-nums">
              누적 완주: {completedInSession} 문장
            </span>
            {is5MinMode && (
              <span className="pr-status-chip px-3 py-1 text-[#fca5a5] font-mono font-black tabular-nums">
                ⏱ 남은 시간: {formatRemainingTime(remainingTime5Min)}
              </span>
            )}
          </div>
        </div>

        {/* Forest Meadow Backdrop with Parchment Scroll Target & Input */}
        <div className="pr-meadow-stage pr-meadow-stage--sentence p-4 sm:p-6 space-y-4">
          {/* Target Sentence Parchment Scroll Card (fixed box height; only font size scales for long sentences) */}
          <div className="pr-parchment-card pr-parchment-card--sentence h-[144px] sm:h-[164px] overflow-hidden flex flex-col justify-center items-center text-center">
            <div
              data-testid="target-sentence"
              data-sentence={currentSentence}
              className={`${
                currentSentence.length > 36
                  ? 'text-xl sm:text-2xl md:text-3xl leading-snug'
                  : 'text-2xl sm:text-3xl md:text-4xl leading-relaxed'
              } font-extrabold tracking-wide font-arcade select-none`}
            >
              {currentSentence.split('').map((char, index) => {
                let charStyle = 'text-[#7d6242]';

                if (index < inputVal.length - 1) {
                  if (inputVal[index] === char) {
                    charStyle = 'text-[#0369a1] font-black';
                  } else {
                    charStyle = 'text-[#be123c] font-black bg-[#ffe4e6] underline decoration-[#e11d48]';
                  }
                } else if (index === inputVal.length - 1) {
                  if (inputVal[index] === char) {
                    charStyle = 'text-[#0369a1] font-black';
                  } else if (isHangulPrefix(char, inputVal[index])) {
                    charStyle = 'text-[#0369a1] font-black bg-[#e0f2fe] ring-2 ring-[#38bdf8] rounded-sm';
                  } else {
                    charStyle = 'text-[#be123c] font-black bg-[#ffe4e6] underline decoration-[#e11d48]';
                  }
                } else if (index === inputVal.length) {
                  charStyle = 'text-[#241106] font-black bg-[#fde047] ring-2 ring-[#b45309] rounded-sm animate-pulse';
                }

                return (
                  <span key={index} className={`px-0.5 ${charStyle}`}>
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
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder={language === 'ko' ? "문장을 다 치고 Enter 또는 스페이스를 누르면 다음 문장으로 넘어가요" : "Type the sentence, then press Enter or Space to go on"}
              className="block w-full text-center text-xl sm:text-2xl md:text-3xl font-black px-5 py-3.5 rounded-xl border-4 border-[#3d220d] focus:border-[#b45309] focus:ring-4 focus:ring-[#fde047]/70 outline-hidden bg-[#fffaf0] text-[#241106] tracking-wide font-arcade placeholder:text-base sm:placeholder:text-lg placeholder:text-[#8c6b48] shadow-[0_4px_0_#2c1507]"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            {shortHint && (
              <span className="absolute left-1/2 -translate-x-1/2 -top-4 px-3 py-1 rounded-lg bg-[#be123c] border-2 border-[#4c0519] text-white text-sm font-black pointer-events-none shadow" data-testid="short-hint">
                {shortHint}
              </span>
            )}

            {inputVal.length >= currentSentence.length && (
              <span className="absolute right-3 top-2 px-2.5 py-0.5 rounded-md bg-[#15803d] border border-[#052e16] text-white text-[11px] font-black pointer-events-none">
                Enter ↵ 또는 스페이스
              </span>
            )}

            {/* Pixel Progress Bar for Current Sentence */}
            <div className="pr-gauge-track w-full h-3.5 mt-3">
              <div
                className="pr-gauge-fill pr-gauge-fill--green"
                style={{
                  width: `${Math.min(100, Math.round((inputVal.length / currentSentence.length) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Completion / Session Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65">
          <div className="pr-parchment-card max-w-md w-full p-6 sm:p-7 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-[#fde68a] text-[#78350f] mx-auto flex items-center justify-center border-3 border-[#3d220d] shadow-[0_4px_0_#2c1507]">
              <Trophy className="w-9 h-9 text-[#b45309]" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-[#2c1507] tracking-tight font-arcade">
                🎉 짧은 글 연습 완료!
              </h3>
              <p className="text-xs text-[#5c3d22] mt-1 font-bold">
                {currentUser ? (
                  <>기록이 <strong className="text-[#9e2a12]">명예의 전당</strong>에 성공적으로 반영되었습니다.</>
                ) : (
                  <>비로그인 상태입니다. 랭킹 등록을 원하시면 상단에서 로그인해 보세요!</>
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="pr-stat-plaque p-3">
                <span className="text-[10px] font-extrabold text-[#6e4622] block">최고 타수</span>
                <span className="text-2xl font-black text-[#9e2a12] font-mono tabular-nums">{stats.cpm}</span>
                <span className="text-[10px] text-[#7c532c] block">CPM</span>
              </div>
              <div className="pr-stat-plaque p-3">
                <span className="text-[10px] font-extrabold text-[#6e4622] block">정확도</span>
                <span className="text-2xl font-black text-[#15803d] font-mono tabular-nums">{stats.accuracy}%</span>
              </div>
              <div className="pr-stat-plaque p-3">
                <span className="text-[10px] font-extrabold text-[#6e4622] block">완주 문장</span>
                <span className="text-2xl font-black text-[#0369a1] font-mono tabular-nums">{completedInSession || 1}</span>
                <span className="text-[10px] text-[#7c532c] block">문장</span>
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
                className="tp-rpg-btn tp-rpg-btn--wood flex-1 py-3 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>🎯 직전 단계 다시 치기</span>
              </button>
              <button
                onClick={() => {
                  setShowSummaryModal(false);
                  sessionDoneRef.current = false;
                  handleNextSentence();
                }}
                className="tp-rpg-btn tp-rpg-btn--gold flex-1 py-3 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer"
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
        review={
          <>
            <RecordRuleNote cpm={setResultData.cpm} accuracy={setResultData.accuracy} />
            <TypingReviewList items={reviewItems} title="아직 안 친 문장" emptyText="이번 세트의 문장을 빠짐없이 모두 쳤어요! 👏" />
          </>
        }
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
