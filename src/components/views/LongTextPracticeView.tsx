import { accuracyOf, addGrade, canAdvanceBySpace, emptyGrade, Grade, gradeLive, gradeText, netCpm } from '../../utils/typingScore';
import { SendReportCTA } from '../SendReportCTA';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PRACTICE_SET_POINTS } from '../../utils/pointRules';
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
import { isRecordable } from '../../utils/typingScore';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { newAgeBgmEngine, NEW_AGE_TRACKS } from '../../utils/newAgeBgmEngine';
import { MychewRewardModal } from '../MychewRewardModal';
import { TypingReviewList, TypingReviewItem } from '../TypingReviewList';
import { markQuestUnitDone } from '../../utils/questProgress';

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
  const [pickerOpen, setPickerOpen] = useState(false);

  // Filter texts by language and category
  // 지금 언어의 모든 작품 (현재 작품은 여기서 정함 — 갈래 단추는 목록만 걸러 보여 줌)
  const langTexts = useMemo(() => LONG_TEXT_LIST.filter((item) => item.language === language), [language]);
  const availableTexts = useMemo(() => {
    let list = langTexts;
    if (selectedCategory === 'poem') {
      list = list.filter((item) => item.category === 'poem');
    } else if (selectedCategory === 'novel') {
      list = list.filter((item) => item.category === 'novel');
    } else if (selectedCategory === 'quote') {
      list = list.filter((item) => item.category === 'quote' || item.category === 'essay' || item.category === 'speech');
    }
    return list;
  }, [langTexts, selectedCategory]);

  const [selectedTextId, setSelectedTextId] = useState<string>(() => {
    if (defaultTextId && LONG_TEXT_LIST.some((t) => t.id === defaultTextId)) {
      return defaultTextId;
    }
    return LONG_TEXT_LIST.find((t) => t.language === language)?.id || 'ko-seosi';
  });

  const currentText = useMemo(() => {
    return langTexts.find((t) => t.id === selectedTextId) || langTexts[0] || LONG_TEXT_LIST[0];
  }, [langTexts, selectedTextId]);

  // 언어를 바꾸면 그 언어의 첫 작품으로
  useEffect(() => {
    if (langTexts.length > 0 && !langTexts.some(t => t.id === selectedTextId)) {
      setSelectedTextId(langTexts[0].id);
      setPageIndex(0);
      setInputVal('');
      resetSessionStats();
    }
  }, [langTexts, selectedTextId]);

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
  // 쪽별로 친 내용 (끝까지 친 쪽 / 치다 만 쪽) → 한 편이 끝나면 '아직 안 친 쪽'을 보여줌
  type PageLog = Record<number, { typed: string; done: boolean }>;
  const pageLogKey = `tp_long_log_${currentUser?.id || 'guest'}_${currentText.id}`;
  const loadPageLog = (): PageLog => {
    try {
      return JSON.parse(localStorage.getItem(pageLogKey) || '{}') || {};
    } catch {
      return {};
    }
  };
  const [pageLog, setPageLog] = useState<PageLog>(loadPageLog);
  useEffect(() => {
    setPageLog(loadPageLog());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLogKey]);
  const writePageLog = (next: PageLog) => {
    setPageLog(next);
    try {
      localStorage.setItem(pageLogKey, JSON.stringify(next));
    } catch {}
  };
  const clearPageLog = () => {
    setPageLog({});
    try {
      localStorage.removeItem(pageLogKey);
    } catch {}
  };
  const reviewModeRef = useRef(false);
  const [missingPages, setMissingPages] = useState<number[]>([]);
  const findMissingPages = (log: PageLog) =>
    Array.from({ length: totalPages }, (_, i) => i).filter((i) => !log[i]?.done);

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
  /**
   * @param latestLog 방금 저장한 쪽 기록 (쪽을 다 치고 넘어갈 때 전달).
   *   전달하지 않으면 화면의 기록(pageLog)을 씀. 다 친 쪽을 '치다 만 쪽'으로 덮어쓰지 않게 하기 위함.
   */
  const turnPageTo = (newIndex: number, direction: 'next' | 'prev', latestLog?: PageLog) => {
    if (newIndex < 0 || newIndex >= totalPages) return;
    const log = latestLog || pageLog;
    if (inputVal && !log[pageIndex]?.done && inputVal.length > (log[pageIndex]?.typed || '').length) {
      writePageLog({ ...log, [pageIndex]: { typed: inputVal, done: false } });
    }
    setPageTurnDirection(direction);
    setIsPageTurning(true);
    soundManager.playPageTurn();
    setPageIndex(newIndex);
    setInputVal('');
    setTimeout(() => {
      setIsPageTurning(false);
      inputRef.current?.focus();
    }, 380);
  };

  /** 이 글에서 넘긴 쪽들의 합계 (화면의 타수·오타·정확도 = 이것 + 지금 치는 쪽) */
  const committedRef = useRef<Grade>(emptyGrade());

  const resetSessionStats = () => {
    committedRef.current = emptyGrade();
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
          // 순타수 = 맞게 친 타수 ÷ 시간 (오타 글자는 빠짐, 쪽이 바뀌어도 이어서 셈)
          const currentCPM = netCpm(prev.correctStrokes || 0, nextSec);
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

    // 한 쪽을 다 친 뒤 스페이스(또는 엔터)를 누르면 다음 쪽으로 넘어감 — 다 치기만 해서는 넘어가지 않음
    //  (빠르게 치다 몇 글자를 빠뜨렸거나 틀려도 끝에서 넘어감: 틀린·빠뜨린 글자는 오타로 셈 → 멈춘 것처럼 보이지 않게)
    if (/[ \n]$/.test(val) && val.length > inputVal.length) {
      const body = val.replace(/[ \n]+$/, '');
      if (body.length >= targetPageText.length || (canAdvanceBySpace(targetPageText, body) && val.length - 1 >= body.length && targetPageText[body.length] !== '\n')) {
        if (!composingRef.current) handlePageFinished(body);
        else {
          pendingFinishRef.current = true; // 한글 조합이 끝나면 넘김
          setInputVal(body);
        }
        return;
      }
    }

    // Start timer on first input
    if (!isTimerRunning && val.length > 0) {
      startTimeRef.current = startTimeRef.current || Date.now();
      setIsTimerRunning(true);
    }

    // 채점: 넘긴 쪽 합계 + 지금 치는 쪽 (마지막 글자는 한글 조합 중일 수 있음)
    const lg = gradeLive(targetPageText, val, isHangulPrefix);
    const c = committedRef.current;
    const all = addGrade(c, lg);
    const accuracy = accuracyOf(all);
    const currentErrors = lg.errors;
    const combo = currentErrors === 0 ? val.length : 0;

    setStats((prev) => ({
      ...prev,
      errorCount: all.errors,
      totalKeystrokes: all.strokes,
      correctStrokes: all.strokes,
      correctCount: all.correct,
      accuracy,
      cpm: netCpm(all.strokes, prev.elapsedSeconds),
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

    // 다 쳤어도 자동으로 넘어가지 않음: [Enter] 또는 [스페이스]를 눌러야 다음 쪽으로 넘어감
  };

  // 한글 조합 중에 Enter 를 누르면, 글자가 완성된 뒤에 넘김 (마지막 글자가 다음 쪽으로 딸려 가지 않게)
  const composingRef = useRef(false);
  const pendingFinishRef = useRef(false);
  const handleCompositionStart = () => {
    composingRef.current = true;
  };
  const handleCompositionEnd = () => {
    composingRef.current = false;
    if (!pendingFinishRef.current) return;
    pendingFinishRef.current = false;
    setTimeout(() => {
      const v = (inputRef.current?.value ?? '').replace(/[ \n]+$/, '');
      if (canAdvanceBySpace(targetPageText, v)) handlePageFinished(v);
    }, 0);
  };

  /** 다 친 뒤 Enter 를 더 눌러도 완독 기록이 또 쌓이지 않게 */
  const completedRef = useRef(false);
  useEffect(() => {
    if (!isCompletedModalOpen) completedRef.current = false;
  }, [isCompletedModalOpen]);

  const handlePageFinished = (typedArg?: string) => {
    if (completedRef.current) return;
    const typed = (typedArg ?? inputRef.current?.value ?? inputVal).replace(/[ \n]+$/, '');
    // 이 쪽 채점을 합계에 더함 (틀린·빠뜨린 글자는 오타)
    const g = gradeText(targetPageText, typed);
    committedRef.current = addGrade(committedRef.current, g);
    const c = committedRef.current;
    const acc = accuracyOf(c);
    setStats((prev) => ({
      ...prev,
      errorCount: c.errors,
      correctCount: c.correct,
      correctStrokes: c.strokes,
      totalKeystrokes: c.strokes,
      accuracy: acc,
      cpm: netCpm(c.strokes, prev.elapsedSeconds),
    }));
    soundManager.playPageTurn();

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

    const log: PageLog = { ...pageLog, [pageIndex]: { typed, done: true } };
    writePageLog(log);

    // 안 친 쪽 고치는 중이면: 다음 '안 친 쪽'으로 바로 이동
    if (reviewModeRef.current) {
      const rest = findMissingPages(log);
      if (rest.length) {
        setInputVal('');
        turnPageTo(rest[0], rest[0] > pageIndex ? 'next' : 'prev', log);
        return;
      }
      reviewModeRef.current = false;
      handleAllPagesCompleted(log);
      return;
    }

    // Check if next page exists
    if (pageIndex + 1 < totalPages) {
      turnPageTo(pageIndex + 1, 'next', log);
    } else {
      // Completed entire book!
      handleAllPagesCompleted(log);
    }
  };

  const handleAllPagesCompleted = (logArg?: PageLog) => {
    const log = logArg || pageLog;
    const missing = findMissingPages(log);
    setMissingPages(missing);
    setIsTimerRunning(false);
    setIsCompletedModalOpen(true);
    // 안 친 쪽이 있으면 완독 보상/기록 없이 목록만 보여줌
    if (missing.length) {
      soundManager.playPageTurn();
      return;
    }
    if (completedRef.current) return;
    completedRef.current = true;
    soundManager.playVictory();
    markQuestUnitDone(currentUser?.id, 'long-practice', currentText.id, language);
    clearPageLog();
    
    // 완독 포인트: 정확도 90% 이상일 때 (오타 수·정확도·타수는 이 글 전체 합계로)
    const cg = committedRef.current;
    const bookAcc = accuracyOf(cg);
    const bookCpm = netCpm(cg.strokes, stats.elapsedSeconds);
    if (bookAcc >= 90) {
      addTypingPracticePoints(PRACTICE_SET_POINTS, `긴 글 완독: ${currentText.title}`);
      checkMychewRenewal(bookCpm, bookAcc);
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
      mode: 'long-practice',
      modeTitle: `긴 글 완독: ${currentText.title} (${language === 'ko' ? '한글' : 'English'})`,
      language,
      stageTitle: `${currentText.author} - ${currentText.title}`,
      sampleText: currentText.paragraphs[0]?.slice(0, 50) + '...',
      cpm: bookCpm,
      accuracy: bookAcc,
      errorCount: cg.errors,
      correctCount: cg.correct,
      totalKeystrokes: cg.strokes,
      elapsedSeconds: stats.elapsedSeconds,
    });

    // 명예의 전당: 긴 글 한 편을 다 치면 기록 (짧은 글 기록과 합쳐 순위를 냄)
    if (currentUser && onRecordScore && language === 'ko' && bookCpm > 0 && isRecordable(bookCpm, bookAcc)) {
      onRecordScore({
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '📚',
        mode: 'long',
        modeTitle: `긴 글: ${currentText.title}`.slice(0, 60),
        score: bookCpm * 10 + bookAcc * 5,
        cpm: bookCpm,
        accuracy: bookAcc,
        errorCount: cg.errors,
        details: `${currentText.author} - ${currentText.title}`.slice(0, 80),
        elapsedSeconds: stats.elapsedSeconds,
      } as any);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.repeat || completedRef.current)) {
      e.preventDefault();
      return;
    }
    if (e.key === 'Enter') {
      // 쪽 끝에서 Enter: (거의) 다 쳤으면 오타가 있어도 넘어감 — 오타는 오타로 셈
      const nextChar0 = targetPageText[inputVal.length];
      if (nextChar0 !== '\n' && canAdvanceBySpace(targetPageText, inputVal.replace(/[ \n]+$/, ''))) {
        e.preventDefault();
        if (composingRef.current || (e.nativeEvent as any).isComposing || e.keyCode === 229) {
          pendingFinishRef.current = true; // 조합이 끝나면 넘김
          return;
        }
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
    } else if (canAdvanceBySpace(targetPageText, inputVal.replace(/[ \n]+$/, ''))) {
      handlePageFinished();
    } else {
      // 마지막 쪽에서 '다음'을 누르면 아직 안 친 쪽을 보여줌
      const log = inputVal && !pageLog[pageIndex]?.done ? { ...pageLog, [pageIndex]: { typed: inputVal, done: false } } : pageLog;
      if (log !== pageLog) writePageLog(log);
      handleAllPagesCompleted(log);
    }
  };

  return (
    <div className="tp-typing-screen space-y-2.5">
      {/* ========================================================================= */}
      {/* 1. ULTRA-COMPACT RPG WOODEN TOOLBAR: Book Selector + Piano + MyChew */}
      {/* ========================================================================= */}
      <div className="pr-toolbar p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 select-none">
        {/* Left: Book Meta & Selection */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#7c3f18] text-[#fde68a] flex items-center justify-center border-2 border-[#2c1507] shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="text-xs sm:text-sm font-black text-[#2c1507] font-serif truncate max-w-[200px] sm:max-w-xs">
              {currentText.title}
            </span>
            <span className="text-[11px] font-bold text-[#6e4622] font-serif hidden md:inline">
              {currentText.author} ({currentText.categoryLabel})
            </span>
          </div>

          {/* 작품 고르기: 누르면 갈래(시·소설·명언)별 작품 목록이 펼쳐짐 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="pr-stone-btn flex items-center gap-1 px-2.5 py-1 text-[12px] font-black text-[#2c1507] cursor-pointer"
              aria-expanded={pickerOpen}
            >
              📚 작품 고르기
              <span className="text-[10px] font-bold text-[#7c3f18]">({langTexts.length}편)</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${pickerOpen ? '-rotate-90' : 'rotate-90'}`} />
            </button>
            {pickerOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPickerOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 w-[min(640px,88vw)] rounded-2xl border-4 border-[#2c1507] bg-[#fff6dc] shadow-[0_6px_0_#2c1507] p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap gap-1">
                      {([
                        ['all', '전체'],
                        ['poem', '🌸 시'],
                        ['novel', '📖 소설'],
                        ['quote', '💬 명언·수필'],
                      ] as [CategoryFilter, string][]).map(([k, label]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelectedCategory(k)}
                          className={`px-2.5 py-1 rounded-lg border-2 border-[#3d220d] text-[12px] font-black cursor-pointer ${
                            selectedCategory === k ? 'bg-[#f59e0b] text-[#2c1507]' : 'bg-white text-[#6e4622] hover:bg-[#fdeec9]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {(['ko', 'en'] as const).map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLanguage(l)}
                          className={`px-2 py-1 rounded-lg border-2 border-[#3d220d] text-[11px] font-black cursor-pointer ${
                            language === l ? 'bg-[#2c1507] text-[#fde68a]' : 'bg-white text-[#6e4622]'
                          }`}
                        >
                          {l === 'ko' ? '한글' : 'English'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto tp-thin-scroll pr-1">
                    {availableTexts.map((item) => {
                      const on = item.id === selectedTextId;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedTextId(item.id);
                            setPageIndex(0);
                            setInputVal('');
                            resetSessionStats();
                            setPickerOpen(false);
                          }}
                          className={`text-left rounded-xl border-2 px-2.5 py-2 cursor-pointer transition-colors ${
                            on ? 'border-[#c2410c] bg-[#fde6a8]' : 'border-[#d6c4a1] bg-white hover:bg-[#fff1cf]'
                          }`}
                        >
                          <div className="text-[12.5px] font-black text-[#2c1507] leading-tight truncate">
                            {on ? '▶ ' : ''}
                            {item.title}
                          </div>
                          <div className="text-[10.5px] font-bold text-[#8a5a2b] truncate mt-0.5">
                            {item.author} · {item.categoryLabel}
                          </div>
                        </button>
                      );
                    })}
                    {availableTexts.length === 0 && (
                      <div className="col-span-full text-center text-[12px] font-bold text-[#8a5a2b] py-4">이 갈래에는 아직 작품이 없어요.</div>
                    )}
                  </div>
                </div>
              </>
            )}
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
            className="pr-stone-btn p-1.5 text-xs font-bold cursor-pointer"
            title="무작위 작품 추천"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#3d220d]" />
          </button>
        </div>

        {/* Right: Language, MyChew pill, and Piano Player */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="pr-wood-group flex items-center gap-0.5 text-[11px] font-bold">
            <button
              onClick={() => setLanguage('ko')}
              className={`pr-wood-tab px-2.5 py-0.5 cursor-pointer ${
                language === 'ko' ? 'pr-wood-tab--active' : ''
              }`}
            >
              한글
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`pr-wood-tab px-2.5 py-0.5 cursor-pointer ${
                language === 'en' ? 'pr-wood-tab--blue' : ''
              }`}
            >
              EN
            </button>
          </div>

          {/* MyChew Mission Plaque */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fde6a8] border-2 border-[#78350f] text-[11px] font-black text-[#4d1d0c]">
            <span>🍬 마이쮸:</span>
            <span className="font-mono text-[#9e2a12] tabular-nums">{bestCpm > 0 ? `${bestCpm}타 갱신` : '정확도 95%'}</span>
          </div>

          {/* Mini Classical Piano Player */}
          <div className="flex items-center gap-1.5 bg-[#3a1f0b] px-2 py-1 rounded-lg border-2 border-[#2c1507] text-[#fff6dc] text-xs shadow-[0_2px_0_#1f0e04]">
            <button
              type="button"
              onClick={handleToggleBgm}
              className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 cursor-pointer ${
                isBgmPlaying ? 'bg-[#fbbf24] text-[#2c1507] font-black' : 'bg-[#6b3b18] hover:bg-[#82481c] text-[#fff6dc]'
              }`}
              title={isBgmPlaying ? '피아노 일시정지' : '클래식 피아노 연주 듣기'}
            >
              {isBgmPlaying ? <Pause className="w-3 h-3 fill-[#2c1507]" /> : <Play className="w-3 h-3 fill-white" />}
              <span className="hidden sm:inline">{isBgmPlaying ? '피아노 🎶' : '피아노 켜기'}</span>
            </button>

            <select
              value={currentTrackId}
              onChange={(e) => handleTrackChange(e.target.value)}
              className="text-[11px] font-medium text-[#fff6dc] bg-[#522d15] border border-[#c69148] rounded-md px-1.5 py-0.5 focus:outline-none cursor-pointer max-w-[90px] sm:max-w-[120px] truncate"
              title="피아노 곡 선택"
            >
              {NEW_AGE_TRACKS.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#3a1f0b] text-[#fff6dc]">
                  {t.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => handleVolumeChange(bgmVolume > 0 ? 0 : 0.4)}
              className="text-[#fde68a] hover:text-white cursor-pointer"
              title={bgmVolume === 0 ? '음소거 해제' : '음소거'}
            >
              {bgmVolume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-300" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. AUTHENTIC BOOK HARDCOVER ON RPG WOODEN WORKBENCH DESK */}
      {/* ========================================================================= */}
      <div className="pr-book-desk">
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
                  <span className="flex items-center gap-1.5">
                    {/* 쪽별 진행: 초록=완성, 노랑=치다 만 쪽, 회색=아직 안 친 쪽 (누르면 그 쪽으로) */}
                    <span className="hidden sm:flex items-center gap-0.5" data-testid="page-dots">
                      {Array.from({ length: totalPages }, (_, p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => p !== pageIndex && turnPageTo(p, p > pageIndex ? 'next' : 'prev')}
                          title={`${p + 1}쪽 · ${pageLog[p]?.done ? '완성' : pageLog[p]?.typed ? '덜 침' : '안 침'}`}
                          className={`w-2.5 h-2.5 rounded-full border cursor-pointer ${
                            p === pageIndex ? 'ring-2 ring-amber-500 ring-offset-1' : ''
                          } ${pageLog[p]?.done ? 'bg-emerald-500 border-emerald-600' : pageLog[p]?.typed ? 'bg-amber-300 border-amber-500' : 'bg-stone-200 border-stone-300'}`}
                        />
                      ))}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-stone-400">
                      쪽 {pageIndex + 1} / {totalPages}
                    </span>
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
                <div className="text-sm sm:text-base font-serif leading-[2.1] text-[#2A231F] break-keep whitespace-pre-wrap tracking-normal" data-page-text={targetPageText}>
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
                <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 mb-1.5 border-b border-[#E4DCCB]/80 min-h-[30px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-800 text-white font-mono font-bold text-xs flex items-center justify-center shadow-2xs">
                      ✍️
                    </span>
                    <span className="font-serif font-black text-sm text-stone-800">
                      필사 노트 <span className="text-amber-800 font-mono text-xs">({pageIndex + 1}/{totalPages}쪽)</span>
                    </span>
                  </div>

                  {/* Page turning buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevPage}
                      disabled={pageIndex === 0}
                      className={`px-2 py-0.5 text-xs font-bold flex items-center gap-0.5 ${
                        pageIndex === 0
                          ? 'opacity-35 cursor-not-allowed text-stone-400 border border-stone-300 rounded'
                          : 'pr-stone-btn cursor-pointer'
                      }`}
                      title="이전 쪽으로 책장 넘기기"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>이전 쪽</span>
                    </button>

                    <button
                      onClick={handleResetPage}
                      className="pr-stone-btn px-2 py-0.5 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                      title="현재 쪽 다시 쓰기"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#4d2606]" />
                      <span>다시</span>
                    </button>

                    <button
                      onClick={handleNextPageManual}
                      className="tp-rpg-btn tp-rpg-btn--wood px-2.5 py-0.5 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                      title="다음 쪽으로 책장 넘기기"
                    >
                      <span>다음 쪽</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Indicator (Pixel Gauge) */}
                <div className="mb-1.5 h-[42px] flex flex-col justify-center">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-serif text-[#4d2c12] mb-0.5">
                    <span className="font-black text-[#78350f]">필사 진행도</span>
                    <span className="font-mono text-[#5c3d22] font-black text-xs sm:text-sm tabular-nums">
                      {Math.min(inputVal.length, targetPageText.length)} / {targetPageText.length}자 ({Math.round((Math.min(inputVal.length, targetPageText.length) / Math.max(1, targetPageText.length)) * 100)}%)
                    </span>
                  </div>
                  <div className="pr-gauge-track w-full h-3.5">
                    <div
                      className="pr-gauge-fill pr-gauge-fill--gold"
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
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
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

                  <div className="mt-1.5 h-[34px] flex items-center justify-center overflow-hidden">
                    {inputVal === targetPageText && stats.errorCount === 0 ? (
                      <div className="w-full py-1 px-2 bg-amber-100/90 border border-amber-300 rounded-lg text-center truncate">
                        <span className="text-xs font-bold text-amber-950 font-serif">
                          ✨ 이번 쪽 필사 완료! [Enter ↵] 또는 [스페이스]를 누르면 다음 쪽으로 넘어가요!
                        </span>
                      </div>
                    ) : stats.errorCount > 0 && inputVal.length >= targetPageText.length ? (
                      <div className="w-full py-1 px-2 bg-rose-100/90 border border-rose-300 rounded-lg text-center truncate">
                        <span className="text-xs font-bold text-rose-800 font-serif">
                          ⚠️ 오타가 {stats.errorCount}개 있습니다. 틀린 부분을 수정해야 완료할 수 있습니다!
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                {/* LIVE STATS HUD STRIP (RPG Parchment Plaques) */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  <div className="pr-stat-plaque p-2 text-center">
                    <div className="text-xs font-extrabold text-[#5c3214]">현재 타수</div>
                    <div className="text-base sm:text-lg font-black text-[#8f2d14] font-mono tabular-nums">
                      {stats.cpm} <span className="text-xs font-bold text-[#7c532c]">타</span>
                    </div>
                  </div>
                  <div className="pr-stat-plaque p-2 text-center">
                    <div className="text-xs font-extrabold text-[#5c3214]">정확도</div>
                    <div className="text-base sm:text-lg font-black text-[#15803d] font-mono tabular-nums">
                      {stats.accuracy}%
                    </div>
                  </div>
                  <div className="pr-stat-plaque p-2 text-center">
                    <div className="text-xs font-extrabold text-[#5c3214]">오타수</div>
                    <div className={`text-base sm:text-lg font-black font-mono tabular-nums ${stats.errorCount > 0 ? 'text-[#be123c]' : 'text-[#15803d]'}`}>
                      {stats.errorCount}개
                    </div>
                  </div>
                  <div className="pr-stat-plaque p-2 text-center">
                    <div className="text-xs font-extrabold text-[#5c3214]">시간</div>
                    <div className="text-sm sm:text-base font-black text-[#2c1507] font-mono pt-0.5 tabular-nums">
                      ⏱ {Math.floor(stats.elapsedSeconds / 60)}:{String(stats.elapsedSeconds % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="pr-stat-plaque p-2 text-center">
                    <div className="text-xs font-extrabold text-[#5c3214]">콤보</div>
                    <div className="text-base sm:text-lg font-black text-[#b45309] font-mono tabular-nums">
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
      </div>

      {/* ========================================================================= */}
      {/* 3. BOOK COMPLETION MODAL */}
      {/* ========================================================================= */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4">
          <div className="bg-[#FAF7EE] border-4 border-[#3d220d] rounded-2xl max-w-lg w-full p-6 sm:p-8 text-center space-y-5 shadow-[0_10px_0_#1f0e04] relative max-h-[92vh] overflow-y-auto">
            {/* Top-Right Close Button */}
            <button
              onClick={() => setIsCompletedModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition cursor-pointer"
              title="닫기"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>

            {missingPages.length > 0 ? (
              <div className="space-y-3 text-left" data-testid="long-missing">
                <div className="text-center space-y-1">
                  <div className="w-14 h-14 rounded-3xl bg-rose-100 mx-auto flex items-center justify-center text-3xl border-2 border-rose-300">📍</div>
                  <h3 className="text-xl font-serif font-black text-[#2A231F]">『{currentText.title}』 아직 안 친 쪽이 있어요</h3>
                  <p className="text-xs font-serif text-stone-600">
                    {totalPages}쪽 중 {totalPages - missingPages.length}쪽 완성 · 남은 쪽을 마저 치면 완독 인증서를 받아요!
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, p) => (
                    <span
                      key={p}
                      className={`w-8 h-8 rounded-lg grid place-items-center text-[11px] font-black border-2 ${
                        missingPages.includes(p)
                          ? pageLog[p]?.typed
                            ? 'bg-amber-100 border-amber-400 text-amber-800'
                            : 'bg-rose-100 border-rose-400 text-rose-700'
                          : 'bg-emerald-100 border-emerald-400 text-emerald-700'
                      }`}
                      title={missingPages.includes(p) ? (pageLog[p]?.typed ? '덜 침' : '안 침') : '완성'}
                    >
                      {missingPages.includes(p) ? p + 1 : '✓'}
                    </span>
                  ))}
                </div>
                <TypingReviewList
                  tone="stone"
                  title="아직 안 친 쪽"
                  items={missingPages.map((p): TypingReviewItem => ({
                    label: `${p + 1}쪽`,
                    target: cleanHanja(currentText.paragraphs[p] || ''),
                    typed: pageLog[p]?.typed || undefined,
                    onGo: () => {
                      reviewModeRef.current = true;
                      setIsCompletedModalOpen(false);
                      setInputVal('');
                      if (p !== pageIndex) turnPageTo(p, p > pageIndex ? 'next' : 'prev');
                      else setTimeout(() => inputRef.current?.focus(), 50);
                    },
                  }))}
                />
              </div>
            ) : (
            <>
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center text-3xl shadow-inner border-2 border-amber-300">
              📜
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-800 bg-amber-100 px-3.5 py-1 rounded-full font-serif border border-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-700" />
                완독 인증서 🏅 ({totalPages}문단 완주)
              </span>
              <h3 className="text-2xl font-serif font-black text-[#2A231F] mt-2">
                『{currentText.title}』 완독!
              </h3>
              <p className="text-xs font-serif text-stone-600">
                {currentText.author}의 아름다운 {totalPages}문단을 한 자 한 자 정성스레 필사했습니다.
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

            {/* 다 쳤으면 선생님께 보내기 (크게) */}
            <SendReportCTA />

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

            </>
            )}

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
                  clearPageLog();
                  reviewModeRef.current = false;
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
