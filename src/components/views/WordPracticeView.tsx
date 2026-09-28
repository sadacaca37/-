import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PRACTICE_SET_POINTS } from '../../utils/pointRules';
import confetti from 'canvas-confetti';
import { KOREAN_WORD_PRACTICE_CATEGORIES, ENGLISH_WORD_PRACTICE_CATEGORIES } from '../../data/practiceData';
import { getKeyGuideForChar, getActiveKeystrokeGuide, countKeystrokes, isHangulPrefix, decomposeToAtomicKeystrokes } from '../../utils/hangul';
import { soundManager } from '../../utils/sound';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { TypingStats, UserSession, LeaderboardEntry } from '../../types';
import { RotateCcw, Award, ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, Shuffle, CheckCircle2 } from 'lucide-react';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { recordPracticeHistory } from '../../utils/curriculumManager';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { TypingSpeedTrendChart } from '../TypingSpeedTrendChart';
import { MychewRewardModal } from '../MychewRewardModal';
import { PracticeSetResultModal } from '../PracticeSetResultModal';
import { starMissionManager } from '../../utils/starMissionManager';
import { markQuestUnitDone } from '../../utils/questProgress';

interface WordPracticeViewProps {
  currentUser: UserSession | null;
  onRecordScore?: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  initialLanguage?: 'ko' | 'en';
  initialCategoryId?: string;
}

export const WordPracticeView: React.FC<WordPracticeViewProps> = ({
  currentUser,
  onRecordScore,
  initialLanguage = 'ko',
  initialCategoryId,
}) => {
  const savedLastPractice = useMemo(() => dailyMissionsManager.getLastPractice(currentUser?.id), [currentUser]);

  const defaultLang = (savedLastPractice && savedLastPractice.mode === 'word-practice' && savedLastPractice.language)
    ? savedLastPractice.language
    : initialLanguage;

  const defaultCatId = (savedLastPractice && savedLastPractice.mode === 'word-practice' && typeof savedLastPractice.stageId === 'string')
    ? savedLastPractice.stageId
    : initialCategoryId;

  const [language, setLanguage] = useState<'ko' | 'en'>(defaultLang);
  const categories = language === 'ko' ? KOREAN_WORD_PRACTICE_CATEGORIES : ENGLISH_WORD_PRACTICE_CATEGORIES;

  const [selectedCatId, setSelectedCatId] = useState(
    defaultCatId || categories[0].id
  );
  const currentCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  // 별은 단계마다 따로 10개 (1단계 1번 + 2단계 1번 ≠ 별 2개)
  const starScope = `word_${language}_${currentCategory.id}`;
  const [currentStarsCount, setCurrentStarsCount] = useState(() => starMissionManager.getState(currentUser?.id, starScope).stars);
  useEffect(() => {
    setCurrentStarsCount(starMissionManager.getState(currentUser?.id, starScope).stars);
  }, [currentUser?.id, starScope]);
  const currentStageNum = currentCategory.stageNumber || (categories.findIndex((c) => c.id === selectedCatId) + 1);

  // Random problem mode (enabled by default per user request)
  const [isRandomOrder, setIsRandomOrder] = useState<boolean>(true);
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);

  // Fisher-Yates shuffle function
  const shuffleWordsList = (list: string[]) => {
    const array = [...list];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    if (isRandomOrder) {
      setShuffledWords(shuffleWordsList(currentCategory.words));
    } else {
      setShuffledWords(currentCategory.words);
    }
    setWordIndex(0);
    setInputVal('');
  }, [selectedCatId, isRandomOrder, currentCategory]);

  const activeWords = isRandomOrder && shuffledWords.length > 0 ? shuffledWords : currentCategory.words;
  // Practice volume: 1회 약 5분 분량(50단어) 기본 탑재
  const [practiceCourse, setPracticeCourse] = useState<'5min' | '3min' | '10min'>('5min');
  const TOTAL_TRIALS = practiceCourse === '5min' ? 50 : practiceCourse === '3min' ? 30 : 100;

  const trialWords = useMemo(() => {
    const list = [...activeWords];
    while (list.length < TOTAL_TRIALS) {
      list.push(...activeWords);
    }
    return list.slice(0, TOTAL_TRIALS);
  }, [activeWords, TOTAL_TRIALS]);

  const [wordIndex, setWordIndex] = useState(0);
  const currentWord = trialWords[wordIndex] || trialWords[0] || '';
  const nextWord = trialWords[wordIndex + 1] || '';
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showSetResultModal, setShowSetResultModal] = useState(false);
  const [starEarnedThisSet, setStarEarnedThisSet] = useState(false);


  const [inputVal, setInputVal] = useState('');
  const [activeKeyCode, setActiveKeyCode] = useState<string | null>(null);
  const [lastFingerUsed, setLastFingerUsed] = useState('');
  const [isCorrectLastKey, setIsCorrectLastKey] = useState<boolean | null>(null);

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

  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferedStrokesRef = useRef<number>(0);

  // Target next character and finger guide accurately based on atomic strokes
  const targetGuide = useMemo(() => {
    return getActiveKeystrokeGuide(currentWord, inputVal);
  }, [currentWord, inputVal]);

  // Auto focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedCatId, wordIndex, isFinished, language]);

  // Timer interval for real-time CPM
  useEffect(() => {
    if (startTimeRef.current && !isFinished) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.max(1, Math.floor((now - startTimeRef.current!) / 1000));

        setStats((prev) => {
          const cpm = Math.round((prev.totalKeystrokes / elapsedSec) * 60);
          return {
            ...prev,
            elapsedSeconds: elapsedSec,
            cpm,
          };
        });
      }, 300);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished]);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const finishPractice = () => {
    const stats = statsRef.current; // 마지막 낱말 채점까지 반영된 최신 값
    setIsFinished(true);
    soundManager.playVictory();
    addTypingPracticePoints(PRACTICE_SET_POINTS, `${language === 'ko' ? '한글' : '영어'} 낱말 (${currentCategory.name}) 완주`);
    markQuestUnitDone(currentUser?.id, 'word-practice', currentCategory.name, language);
    
    const isAccPassed = stats.accuracy >= 95;
    let earnedStar = false;
    let newStars = currentStarsCount;

    if (isAccPassed) {
      const starRes = starMissionManager.addStar(`${language === 'ko' ? '한글' : '영어'} 낱말 (${currentCategory.name}) 완주`, currentUser?.id, starScope);
      earnedStar = true;
      newStars = starRes.stars;
      setCurrentStarsCount(newStars);
    }
    setStarEarnedThisSet(earnedStar);

    // If 10 sets (10 stars) completed, student advances to next level and gets Mychew!
    if (newStars >= 10 && isAccPassed) {
      setShowRewardModal(true);
    } else {
      // Show set result modal displaying CPM, error count, accuracy, and star accumulation
      setShowSetResultModal(true);
    }

    // Flush buffered keystrokes and update lesson mission
    if (bufferedStrokesRef.current > 0) {
      dailyMissionsManager.incrementProgress('chars', bufferedStrokesRef.current, currentUser?.id);
      bufferedStrokesRef.current = 0;
    }
    dailyMissionsManager.incrementProgress('lesson', 1, currentUser?.id);
    dailyMissionsManager.saveLastPractice({
      mode: 'word-practice',
      modeTitle: '2단계: 낱말 연습',
      stageTitle: currentCategory.name,
      stageId: currentCategory.id,
      language,
      cpm: stats.cpm,
      accuracy: stats.accuracy,
    }, currentUser?.id, true);

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });

    // Record practice history
    {
      // 한 세트를 끝까지 쳤을 때만 기록 (로그인 안 했으면 '게스트' 기록)
      recordPracticeHistory({
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || '게스트',
        mode: 'word-practice',
        modeTitle: `${language === 'ko' ? '한글' : '영어'} 낱말 (${currentCategory.name})`,
        language,
        stageTitle: currentCategory.name,
        sampleText: currentCategory.words.slice(0, 5).join(', '),
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        errorCount: stats.errorCount,
        correctCount: stats.correctCount,
        totalKeystrokes: stats.totalKeystrokes,
        elapsedSeconds: stats.elapsedSeconds,
        categoryId: currentCategory.id,
      } as any);
    }

    if (onRecordScore) {
      onRecordScore({
        userName: currentUser ? currentUser.name : '게스트',
        mode: 'word' as any,
        modeTitle: `낱말연습 (${currentCategory.name})`,
        score: stats.cpm * 3 + stats.maxCombo * 20,
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        details: `${currentCategory.name} 완주`,
      });
    }
  };

  /**
   * 낱말 하나를 넘길 때(엔터·스페이스) 최종 입력으로 채점.
   * - 오타 수: 틀린 글자 + 빠진 글자 + 더 친 글자 (편집 거리, 세트 동안 누적)
   * - 정확도: 맞은 글자 수 ÷ 전체 글자 수 (전체 = 맞은 글자 + 오타)
   * 백스페이스로 고친 뒤 넘기면 그 낱말은 오타 0으로 계산됨
   */
  const [lastWordResult, setLastWordResult] = useState<{ word: string; typed: string; wrong: number } | null>(null);
  const composingRef = useRef(false);
  const pendingCommitRef = useRef(false);

  const commitWord = (typed: string, target: string) => {
    const t = target.trim();
    const v = typed.trim();
    // 편집 거리(바꿔 친 글자·빠진 글자·더 친 글자 수)
    const dp: number[][] = Array.from({ length: t.length + 1 }, (_, i) => [i, ...Array(v.length).fill(0)]);
    for (let j = 1; j <= v.length; j++) dp[0][j] = j;
    for (let i = 1; i <= t.length; i++) {
      for (let j = 1; j <= v.length; j++) {
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (t[i - 1] === v[j - 1] ? 0 : 1));
      }
    }
    const wrong = dp[t.length][v.length];
    const right = Math.max(0, Math.max(t.length, v.length) - wrong);
    setLastWordResult({ word: t, typed: v, wrong });
    setStats((prev) => {
      const errorCount = prev.errorCount + wrong;
      const correctCount = prev.correctCount + right;
      const totalChars = correctCount + errorCount;
      return {
        ...prev,
        errorCount,
        correctCount,
        accuracy: totalChars > 0 ? Math.max(0, Math.round((correctCount / totalChars) * 100)) : 100,
      };
    });
  };

  /** 엔터·스페이스로 낱말을 넘김 (다 치기 전에는 절대 자동으로 넘어가지 않음) */
  const submitWord = (typedRaw?: string) => {
    const typed = (typedRaw ?? inputRef.current?.value ?? inputVal).trim();
    if (!typed) {
      setInputVal('');
      return;
    }
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    if (typed === currentWord.trim()) {
      soundManager.playSuccess();
    } else {
      soundManager.playError();
    }
    commitWord(typed, currentWord);
    setInputVal('');
    if (inputRef.current) inputRef.current.value = '';
    setIsCorrectLastKey(null);
    if (wordIndex + 1 < TOTAL_TRIALS) {
      setWordIndex((prev) => prev + 1);
    } else {
      setTimeout(finishPractice, 0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    // 스페이스 = 이 낱말 다 쳤어요(낱말 안에 띄어쓰기가 있으면 그 자리까지는 글자로 받음)
    if (val.endsWith(' ')) {
      const body = val.slice(0, -1);
      const wordHasSpace = currentWord.includes(' ');
      if (!wordHasSpace || body.length >= currentWord.length) {
        if (!body.trim()) {
          setInputVal('');
          return;
        }
        pendingCommitRef.current = false;
        submitWord(body);
        return;
      }
    }
    val = val.replace(/^\s+/, '');

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const prevStrokes = decomposeToAtomicKeystrokes(inputVal);
    const currStrokes = decomposeToAtomicKeystrokes(val);
    const isValidPrefix = isHangulPrefix(currentWord, val);

    // Handle typo correction when user backspaces (including sub-syllable strokes):
    if (currStrokes.length < prevStrokes.length || val.length < inputVal.length) {
      setIsCorrectLastKey(isValidPrefix ? true : null);

      // 지우기(백스페이스)는 오타 수를 되돌리지 않음 — 오타는 세트 동안 계속 누적
      setInputVal(val);
      return;
    }

    // User typed new stroke(s)
    const lastTypedStroke = currStrokes[currStrokes.length - 1] || val[val.length - 1] || '';
    const guide = getKeyGuideForChar(lastTypedStroke);
    if (guide) {
      setActiveKeyCode(guide.code);
      setLastFingerUsed(guide.fingerName);
      setTimeout(() => {
        setActiveKeyCode(null);
      }, 200);
    }

    const strokesAdded = Math.max(1, currStrokes.length - prevStrokes.length);
    bufferedStrokesRef.current += strokesAdded;

    if (isValidPrefix) {
      soundManager.playKeyClick(true);
      setIsCorrectLastKey(true);

      setStats((prev) => {
        const nextCombo = prev.combo + 1;
        if (nextCombo % 5 === 0) {
          soundManager.playCombo(nextCombo);
        }
        return {
          ...prev,
          totalKeystrokes: prev.totalKeystrokes + strokesAdded,
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
        };
      });
    } else {
      soundManager.playKeyClick(false);
      soundManager.playError();
      setIsCorrectLastKey(false);

      // 오타는 여기서 세지 않음 — 낱말을 넘길 때(commitWord) 최종 입력으로 채점하므로,
      // 백스페이스로 고치면 오타로 남지 않음
      setStats((prev) => ({
        ...prev,
        totalKeystrokes: prev.totalKeystrokes + strokesAdded,
        combo: 0,
      }));
    }

    // 너무 길게 치면 더 이상 받지 않음(지워서 고치거나 엔터로 넘기기)
    const maxLen = currentWord.length + 3;
    setInputVal(val.length > maxLen ? val.slice(0, maxLen) : val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputVal.length <= 1) {
      setIsCorrectLastKey(null);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      // 한글 조합 중에 엔터 → 조합이 끝난 뒤 넘김(마지막 글자가 다음 낱말로 새지 않게)
      if (composingRef.current || (e.nativeEvent as any).isComposing || e.keyCode === 229) {
        pendingCommitRef.current = true;
        return;
      }
      pendingCommitRef.current = false;
      submitWord();
    }
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };
  const handleCompositionEnd = () => {
    composingRef.current = false;
    if (pendingCommitRef.current) {
      setTimeout(() => {
        if (!pendingCommitRef.current) return;
        pendingCommitRef.current = false;
        submitWord(inputRef.current?.value);
      }, 0);
    }
  };

  const handleReset = () => {
    setWordIndex(0);
    setInputVal('');
    setIsFinished(false);
    setLastWordResult(null);
    pendingCommitRef.current = false;
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
    inputRef.current?.focus();
  };

  const selectStageByNumber = (stageNum: number) => {
    const targetCat = categories.find((c) => c.stageNumber === stageNum) || categories[stageNum - 1];
    if (targetCat) {
      setSelectedCatId(targetCat.id);
      setWordIndex(0);
      setInputVal('');
      setIsFinished(false);
      startTimeRef.current = null;
    }
  };

  const handlePrevStage = () => {
    const currentIndex = categories.findIndex((c) => c.id === selectedCatId);
    if (currentIndex > 0) {
      setSelectedCatId(categories[currentIndex - 1].id);
      handleReset();
    }
  };

  const handleNextStage = () => {
    const currentIndex = categories.findIndex((c) => c.id === selectedCatId);
    if (currentIndex < categories.length - 1) {
      setSelectedCatId(categories[currentIndex + 1].id);
      handleReset();
    }
  };

  const progressPercent = Math.round(((wordIndex) / TOTAL_TRIALS) * 100);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Top Header & Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>낱말 연습</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold border border-teal-200">
              {currentCategory.name}
            </span>
          </h2>
        </div>

        {/* Simultaneous Keyboard Badge, Language Tabs & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 코스 선택 */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => { setPracticeCourse('3min'); handleReset(); }}
              className={`px-3 py-1 rounded-lg text-sm font-black transition-all cursor-pointer ${
                practiceCourse === '3min' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3분
            </button>
            <button
              type="button"
              onClick={() => { setPracticeCourse('5min'); handleReset(); }}
              className={`px-3 py-1 rounded-lg text-sm font-black transition-all cursor-pointer ${
                practiceCourse === '5min' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              5분
            </button>
            <button
              type="button"
              onClick={() => { setPracticeCourse('10min'); handleReset(); }}
              className={`px-3 py-1 rounded-lg text-sm font-black transition-all cursor-pointer ${
                practiceCourse === '10min' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              10분
            </button>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setLanguage('ko');
                setSelectedCatId(KOREAN_WORD_PRACTICE_CATEGORIES[0].id);
                handleReset();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                language === 'ko' ? 'bg-teal-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇰🇷 한글 낱말</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setSelectedCatId(ENGLISH_WORD_PRACTICE_CATEGORIES[0].id);
                handleReset();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                language === 'en' ? 'bg-indigo-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇺🇸 영어 낱말</span>
            </button>
          </div>

          {/* Random Question Shuffle Button */}
          <button
            type="button"
            onClick={() => {
              setShuffledWords(shuffleWordsList(currentCategory.words));
              setWordIndex(0);
              setInputVal('');
              handleReset();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="낱말 순서를 무작위로 섞어 랜덤하게 문제를 제시합니다"
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-600" />
            <span>🎲 낱말 랜덤 출제</span>
          </button>

          {/* Quick Re-type Button */}
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
            title="현재 단계를 처음부터 다시 칩니다"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>이 단계 다시 치기</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CLASSIC HANCOM TYPING CONSOLE CASING (As seen in the screenshot)
         ========================================================================= */}
      <div className="bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 p-2.5 sm:p-4 rounded-3xl border-4 border-slate-300 shadow-2xl relative">
        {/* Top Status Strip: 진행도 / 오타수 / 정확도 / 타수 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-1.5 border border-slate-300 shadow-xs mb-2 flex flex-wrap items-center justify-between gap-3 text-base sm:text-lg font-black text-slate-700">
          {/* 진행도 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">진행도</span>
            <div className="w-24 sm:w-36 bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300 p-0.5">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-16 text-right font-black text-slate-800 text-base">{progressPercent}%</span>
            <span className="font-mono text-slate-500 text-sm">({wordIndex + 1}/{TOTAL_TRIALS})</span>
          </div>

          {/* 오타수 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">오타수</span>
            <div className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono font-black text-rose-600 text-base min-w-[40px] text-center shadow-inner">
              {stats.errorCount}
            </div>
          </div>

          {/* 정확도 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">정확도</span>
            <div className="w-20 sm:w-28 bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300 p-0.5">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="w-14 text-right font-black text-slate-800 text-base">{stats.accuracy}%</span>
          </div>

          {/* 타수 / CPM */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">속도</span>
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs font-black">
              {stats.cpm} <span className="text-[10px] text-slate-500">타/분</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            CYAN AQUA DISPLAY PANEL (Classic Hancom Screen)
           ========================================================================= */}
        <div className="bg-gradient-to-r from-sky-400 via-cyan-400 to-sky-400 rounded-2xl p-2.5 sm:p-3.5 border-3 border-sky-500 shadow-inner flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-3 relative overflow-hidden mb-2.5">
          {/* Subtle Cyber / Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />

          {/* Left / Center: Target Word Card & Next Word Preview */}
          <div className="hidden md:flex items-center justify-end w-full z-10 pr-2">
            {/* Left Dotted Arrows */}
            <div className="flex flex-col text-sky-200/80 font-mono text-sm select-none">
              <span>◀ ◀</span>
              <span>◀ ◀</span>
            </div>
          </div>

            {/* Target Big Word Card (Elevated Silver/White Box) */}
            <div 
              onClick={() => inputRef.current?.focus()}
              className="bg-gradient-to-b from-white to-slate-100 rounded-2xl p-2.5 sm:p-3.5 border-3 border-slate-300 shadow-[0_6px_16px_rgba(0,0,0,0.15)] min-w-[180px] sm:min-w-[220px] text-center cursor-text relative"
            >
              {/* Target Word Text */}
              <div className="text-5xl sm:text-6xl font-black text-slate-900 tracking-wider select-none mb-1">
                {currentWord.split('').map((char, index) => {
                  let charState: 'matched' | 'composing' | 'error' | 'pending' = 'pending';
                  if (index < inputVal.length - 1) {
                    charState = inputVal[index] === char ? 'matched' : 'error';
                  } else if (index === inputVal.length - 1) {
                    if (inputVal[index] === char) {
                      charState = 'matched';
                    } else if (isHangulPrefix(char, inputVal[index])) {
                      charState = 'composing';
                    } else {
                      charState = 'error';
                    }
                  }

                  return (
                    <span
                      key={index}
                      className={
                        charState === 'matched'
                          ? 'text-teal-600'
                          : charState === 'composing'
                          ? 'text-sky-600 underline decoration-sky-400 decoration-2 underline-offset-4'
                          : charState === 'error'
                          ? 'text-rose-500'
                          : 'text-slate-800'
                      }
                    >
                      {char}
                    </span>
                  );
                })}
              </div>

              {/* Typing Line & Blinking Cursor Area */}
              <div className="min-h-[60px] flex items-center justify-center text-5xl sm:text-6xl font-black text-teal-600 tracking-wider" data-testid="typed-word">
                <span>{inputVal}</span>
                <span className="inline-block w-2.5 h-12 bg-slate-900 ml-0.5 animate-pulse rounded-xs" />
              </div>

              {/* 방금 친 낱말 결과 + 안내 */}
              <div className="mt-1 min-h-[28px] text-lg sm:text-xl font-black select-none" data-testid="word-feedback">
                {lastWordResult ? (
                  lastWordResult.wrong === 0 ? (
                    <span className="text-teal-600">✓ {lastWordResult.word} 정확해요!</span>
                  ) : (
                    <span className="text-rose-600">
                      ✗ {lastWordResult.word} → {lastWordResult.typed} (오타 {lastWordResult.wrong}개)
                    </span>
                  )
                ) : (
                  <span className="text-slate-400 text-base">다 치면 엔터나 스페이스를 눌러요</span>
                )}
              </div>

              {/* Hidden Real Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                className="opacity-0 absolute inset-0 w-full h-full cursor-text"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full z-10 md:pl-2">
            {/* Next Word Preview on Aqua Background */}
            <div className="flex items-center gap-2 select-none">
              <div className="text-sky-200/90 font-mono text-lg">
                ◀
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs font-black text-sky-100 tracking-tight">다음 낱말</span>
                <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                  {nextWord || '완주 직전!'}
                </span>
              </div>
            </div>

          {/* Right Side: Stage Setting (단계 설정), Mini Keyboard, Stage Buttons [1]~[8] */}
          <div className="bg-white/90 backdrop-blur-md rounded-xl p-3 border-2 border-sky-300 shadow-md flex flex-col items-center gap-2 z-10 w-full md:w-auto">
            {/* Header: ◀ 단계 설정 ▶ */}
            <div className="flex items-center justify-between w-full gap-2 text-xs font-black text-slate-800">
              <button
                type="button"
                onClick={handlePrevStage}
                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                title="이전 단계"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="tracking-tight text-slate-900 font-extrabold">단계 설정</span>
              <button
                type="button"
                onClick={handleNextStage}
                className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors"
                title="다음 단계"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mini Keyboard Diagram with Active Red Keys */}
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700 shadow-inner">
              <div className="space-y-0.5">
                {/* Row 1 */}
                <div className="flex gap-0.5 justify-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-2.5 h-2 bg-slate-600 rounded-xs" />
                  ))}
                </div>
                {/* Row 2 (Top Row) */}
                <div className="flex gap-0.5 justify-center">
                  {[...Array(11)].map((_, i) => {
                    const isRed = (currentStageNum === 2 && i < 5) || (currentStageNum === 3 && i >= 5);
                    return (
                      <div
                        key={i}
                        className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500 shadow-xs' : 'bg-slate-600'}`}
                      />
                    );
                  })}
                </div>
                {/* Row 3 (Home Row) */}
                <div className="flex gap-0.5 justify-center">
                  {[...Array(10)].map((_, i) => {
                    const isRed = currentStageNum === 1 || (currentStageNum === 8 && i % 2 === 0);
                    return (
                      <div
                        key={i}
                        className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500 shadow-xs animate-pulse' : 'bg-slate-600'}`}
                      />
                    );
                  })}
                </div>
                {/* Row 4 (Bottom Row) */}
                <div className="flex gap-0.5 justify-center">
                  {[...Array(9)].map((_, i) => {
                    const isRed = (currentStageNum === 4 && i < 4) || (currentStageNum === 5 && i >= 4);
                    return (
                      <div
                        key={i}
                        className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500 shadow-xs' : 'bg-slate-600'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stage Selector Buttons [1] ~ [8] */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((stageNum) => {
                const isSelected = currentStageNum === stageNum;
                return (
                  <button
                    key={stageNum}
                    type="button"
                    onClick={() => selectStageByNumber(stageNum)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md ring-1 ring-orange-300 font-extrabold scale-110'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {stageNum}
                  </button>
                );
              })}
            </div>
            {/* 이 단계에서 모은 별 (단계마다 10번씩 완주해야 별 10개) */}
            <div className="flex items-center gap-0.5 text-[11px] font-black text-amber-600" data-testid="stage-stars" title="정확도 95% 이상으로 이 단계를 완주할 때마다 별 1개">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={i < currentStarsCount ? 'text-amber-400' : 'text-slate-300'}>★</span>
              ))}
              <span className="ml-1 text-slate-600">{currentStarsCount}/10</span>
            </div>
          </div>
          </div>
        </div>

        {/* Finished Overlay if practice completed */}
        {isFinished && (
          <div className="mb-4 p-6 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-emerald-300 shadow-xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-300 shadow-xs">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                🎉 '{currentCategory.name}' 완주 성공!
              </h3>
              <p className="text-xs text-slate-600 font-bold mt-1">
                평균 속도 <strong className="text-emerald-600 font-black">{stats.cpm} CPM</strong> | 정확도 <strong className="text-emerald-600 font-black">{stats.accuracy}%</strong> | +50P 획득!
              </p>
            </div>

            {/* Recharts Typing Speed Trend Chart */}
            <div className="max-w-md mx-auto">
              <TypingSpeedTrendChart
                currentCpm={stats.cpm}
                currentAccuracy={stats.accuracy}
                stageTitle={currentCategory.name}
              />
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-amber-300 shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>🎯 직전 단계 다시 치기 (재도전)</span>
              </button>

              <button
                onClick={handleNextStage}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <span>다음 단계로 이동</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            CLASSIC HANCOM VIRTUAL KEYBOARD WITH ORANGE HAND OUTLINES
           ========================================================================= */}
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

      {/* Practice Set Result Modal: Displays CPM, error count, and star accumulation */}
      <PracticeSetResultModal
        isOpen={showSetResultModal}
        onClose={() => setShowSetResultModal(false)}
        title={`낱말연습 (${currentCategory.name})`}
        cpm={stats.cpm}
        errorCount={stats.errorCount}
        accuracy={stats.accuracy}
        modeType="key_word"
        currentStars={currentStarsCount}
        starsEarned={starEarnedThisSet}
        onRetry={() => {
          setShowSetResultModal(false);
          handleReset();
        }}
        onNext={() => {
          setShowSetResultModal(false);
          if (currentStarsCount >= 10) {
            handleNextStage();
          } else {
            handleReset();
          }
        }}
        onClaimMychew={() => {
          setShowSetResultModal(false);
          setShowRewardModal(true);
        }}
      />

      {/* MyChew Reward Modal for 10-star completion */}
      <MychewRewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        type="key_word_ten_stars"
        accuracy={stats.accuracy}
        isSuccess={stats.accuracy >= 95}
        cpm={stats.cpm}
        title={`낱말연습 (${currentCategory.name})`}
        onRetry={() => {
          setShowRewardModal(false);
          handleReset();
        }}
        onNext={() => {
          setShowRewardModal(false);
          handleNextStage();
        }}
      />
    </div>
  );
};

