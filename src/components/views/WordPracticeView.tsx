import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { KOREAN_WORD_PRACTICE_CATEGORIES, ENGLISH_WORD_PRACTICE_CATEGORIES } from '../../data/practiceData';
import { getKeyGuideForChar, getActiveKeystrokeGuide, countKeystrokes, isHangulPrefix, decomposeToAtomicKeystrokes } from '../../utils/hangul';
import { soundManager } from '../../utils/sound';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { TypingStats, UserSession, LeaderboardEntry } from '../../types';
import { RotateCcw, Award, ChevronLeft, ChevronRight, Volume2, VolumeX, Sparkles, Shuffle, CheckCircle2, Heart, X } from 'lucide-react';
import { CrtParchmentScroll } from '../CrtParchmentScroll';
import { CrtRobotMascot } from '../CrtRobotMascot';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { recordPracticeHistory } from '../../utils/curriculumManager';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { TypingSpeedTrendChart } from '../TypingSpeedTrendChart';
import { MychewRewardModal } from '../MychewRewardModal';
import { PracticeSetResultModal } from '../PracticeSetResultModal';
import { starMissionManager } from '../../utils/starMissionManager';

interface WordPracticeViewProps {
  currentUser: UserSession | null;
  onRecordScore?: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  initialLanguage?: 'ko' | 'en';
  initialCategoryId?: string;
  onClose?: () => void;
}

export const WordPracticeView: React.FC<WordPracticeViewProps> = ({
  currentUser,
  onRecordScore,
  initialLanguage = 'ko',
  initialCategoryId,
  onClose,
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
  const [currentStarsCount, setCurrentStarsCount] = useState(() => starMissionManager.getState(currentUser?.id).stars);
  const [isMuted, setIsMuted] = useState(() => soundManager.getMuted());

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

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
  const [maxCpm, setMaxCpm] = useState<number>(0);
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
          const totalAttempts = prev.correctCount + prev.errorCount;
          const accuracy = totalAttempts > 0 ? Math.round((prev.correctCount / totalAttempts) * 100) : 100;
          if (cpm > 0) {
            setMaxCpm((prevMax) => Math.max(prevMax, cpm));
          }
          return {
            ...prev,
            elapsedSeconds: elapsedSec,
            cpm,
            accuracy,
          };
        });
      }, 300);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished]);

  const finishPractice = () => {
    setIsFinished(true);
    soundManager.playVictory();
    addTypingPracticePoints(50, `${language === 'ko' ? '한글' : '영어'} 낱말 (${currentCategory.name}) 완주`);
    
    const isAccPassed = stats.accuracy >= 95;
    let earnedStar = false;
    let newStars = currentStarsCount;

    if (isAccPassed) {
      const starRes = starMissionManager.addStar(`${language === 'ko' ? '한글' : '영어'} 낱말 (${currentCategory.name}) 완주`, currentUser?.id);
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
    if (currentUser) {
      recordPracticeHistory({
        userId: currentUser.id,
        userName: currentUser.name,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const prevStrokes = decomposeToAtomicKeystrokes(inputVal);
    const currStrokes = decomposeToAtomicKeystrokes(val);
    const isValidPrefix = isHangulPrefix(currentWord, val);

    // Handle typo correction when user backspaces (including sub-syllable strokes):
    if (currStrokes.length < prevStrokes.length || val.length < inputVal.length) {
      setIsCorrectLastKey(isValidPrefix ? true : null);

      // Recalculate error count and accuracy on current state
      let currentErrors = 0;
      for (let i = 0; i < val.length; i++) {
        if (i === val.length - 1 && i < currentWord.length) {
          if (!isHangulPrefix(currentWord.slice(0, val.length), val)) {
            currentErrors++;
          }
        } else if (i < currentWord.length) {
          if (val[i] !== currentWord[i]) {
            currentErrors++;
          }
        } else {
          currentErrors++;
        }
      }

      setStats((prev) => {
        const totalAttempts = prev.correctCount + currentErrors;
        const accuracy = totalAttempts > 0 ? Math.max(0, Math.round((prev.correctCount / totalAttempts) * 100)) : 100;
        return {
          ...prev,
          errorCount: currentErrors,
          accuracy,
        };
      });

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
        const newCorrect = prev.correctCount + 1;
        const newTotal = prev.totalKeystrokes + strokesAdded;
        const totalAttempts = newCorrect + prev.errorCount;
        const accuracy = totalAttempts > 0 ? Math.round((newCorrect / totalAttempts) * 100) : 100;
        return {
          ...prev,
          correctCount: newCorrect,
          totalKeystrokes: newTotal,
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
          accuracy,
        };
      });
    } else {
      soundManager.playKeyClick(false);
      soundManager.playError();
      setIsCorrectLastKey(false);

      setStats((prev) => {
        const newErrors = prev.errorCount + 1;
        const newTotal = prev.totalKeystrokes + strokesAdded;
        const totalAttempts = prev.correctCount + newErrors;
        const accuracy = totalAttempts > 0 ? Math.round((prev.correctCount / totalAttempts) * 100) : 100;
        return {
          ...prev,
          errorCount: newErrors,
          totalKeystrokes: newTotal,
          combo: 0,
          accuracy,
        };
      });
    }

    // If typed length exceeds current word length, reset input as requested
    if (val.length > currentWord.length) {
      setInputVal('');
      return;
    }

    setInputVal(val);

    if (val === currentWord || val.trim() === currentWord.trim()) {
      soundManager.playSuccess();
      if (wordIndex + 1 < TOTAL_TRIALS) {
        setWordIndex((prev) => prev + 1);
        setInputVal('');
        setIsCorrectLastKey(null);
      } else {
        finishPractice();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputVal.length <= 1) {
      setIsCorrectLastKey(null);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.length === 0) return;

      // Even if typo exists, pressing Enter advances to next word
      if (inputVal === currentWord || inputVal.trim() === currentWord.trim()) {
        soundManager.playSuccess();
        setIsCorrectLastKey(true);
      } else {
        soundManager.playError();
        setIsCorrectLastKey(false);
      }

      if (wordIndex + 1 < TOTAL_TRIALS) {
        setWordIndex((prev) => prev + 1);
        setInputVal('');
        setIsCorrectLastKey(null);
      } else {
        finishPractice();
      }
    }
  };

  const handleReset = () => {
    setWordIndex(0);
    setInputVal('');
    setIsFinished(false);
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
    <div className="w-full max-w-5xl mx-auto flex flex-col justify-between select-none relative font-pixel">
      {/* =========================================================================
          AUTHENTIC CRT ARCADE CABINET (As per user reference image)
         ========================================================================= */}
      <div className="w-full bg-[#4A3222] p-2 sm:p-3 rounded-2xl sm:rounded-3xl border-4 sm:border-[6px] border-[#24150E] shadow-[0_16px_32px_rgba(0,0,0,0.8),inset_2px_2px_0_#7C583F,inset_-2px_-2px_0_#24150E] relative flex flex-col justify-between overflow-hidden">
        {/* Metal Screws / Rivets */}
        <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-xs z-30" />
        <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-xs z-30" />
        <span className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-xs z-30" />
        <span className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E5B55A] border border-[#8C6219] shadow-xs z-30" />

        {/* 1. TOP CABINET MARQUEE & HANGING WOODEN SIGN */}
        <div className="flex flex-col items-center shrink-0 mb-1.5 relative z-20">
          {/* Top Metal Badge: TYPANG CRT-PRO 1994 */}
          <div className="px-4 py-0.5 rounded-md bg-[#1E293B] border-2 border-[#E5B55A] shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex items-center gap-1.5 -mt-1">
            <span className="text-[10px] sm:text-[11px] font-black font-pixel text-[#FFE600] tracking-widest drop-shadow-[0_1px_2px_#000]">
              ★ TYPANG CRT-PRO 1994 ★
            </span>
          </div>

          {/* Hanging Metal Chain Links */}
          <div className="w-full max-w-md flex justify-between px-8 sm:px-12 -my-0.5 z-10">
            <div className="flex flex-col items-center">
              <span className="w-1.5 h-2 bg-gradient-to-b from-[#94A3B8] to-[#475569] rounded-xs border border-black/60 shadow-xs" />
              <span className="w-1.5 h-2 bg-gradient-to-b from-[#94A3B8] to-[#475569] rounded-xs border border-black/60 shadow-xs -mt-0.5" />
            </div>
            <div className="flex flex-col items-center">
              <span className="w-1.5 h-2 bg-gradient-to-b from-[#94A3B8] to-[#475569] rounded-xs border border-black/60 shadow-xs" />
              <span className="w-1.5 h-2 bg-gradient-to-b from-[#94A3B8] to-[#475569] rounded-xs border border-black/60 shadow-xs -mt-0.5" />
            </div>
          </div>

          {/* Hanging Wooden Signboard (HUD Header) */}
          <div className="w-full max-w-3xl bg-gradient-to-b from-[#B87D4B] via-[#8C5832] to-[#5C341A] px-2.5 sm:px-4 py-1.5 rounded-xl border-3 border-[#2A160A] shadow-[0_4px_8px_rgba(0,0,0,0.6),inset_1px_1px_0_#DF9E67] flex items-center justify-between gap-1.5 sm:gap-2 z-20 flex-wrap sm:flex-nowrap">
            {/* Left: 3 Red Pixel Hearts & Language Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-0.5">
                <span className="text-red-500 drop-shadow-[0_1px_2px_#000] text-xs sm:text-sm animate-pulse">❤️</span>
                <span className="text-red-500 drop-shadow-[0_1px_2px_#000] text-xs sm:text-sm animate-pulse">❤️</span>
                <span className="text-red-500 drop-shadow-[0_1px_2px_#000] text-xs sm:text-sm">❤️</span>
              </div>
              <div className="flex bg-[#20130D] p-0.5 rounded border border-[#8C6219]">
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('ko');
                    setSelectedCatId(KOREAN_WORD_PRACTICE_CATEGORIES[0].id);
                    handleReset();
                  }}
                  className={`px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-pixel font-bold cursor-pointer transition-all ${
                    language === 'ko' ? 'bg-[#FFE600] text-black shadow-xs font-black' : 'text-amber-200 hover:text-white'
                  }`}
                >
                  한글
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLanguage('en');
                    setSelectedCatId(ENGLISH_WORD_PRACTICE_CATEGORIES[0].id);
                    handleReset();
                  }}
                  className={`px-1.5 py-0.2 rounded text-[9px] sm:text-[10px] font-pixel font-bold cursor-pointer transition-all ${
                    language === 'en' ? 'bg-[#FFE600] text-black shadow-xs font-black' : 'text-amber-200 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Center: Stage Title & 1-8 Stage Number Selection Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 justify-center flex-wrap">
              <span className="text-xs sm:text-sm font-black font-arcade text-[#FFE57F] tracking-wide drop-shadow-[0_2px_0_#2A160A] whitespace-nowrap">
                2단계: 낱말 연습
              </span>
              {/* Interactive Stage Selector (1~8단계) */}
              <div className="flex items-center gap-1 bg-[#20130D]/80 p-0.5 rounded-lg border border-[#8C6219]">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((stageNum) => (
                  <button
                    key={stageNum}
                    type="button"
                    onClick={() => selectStageByNumber(stageNum)}
                    className={`w-5 h-5 sm:w-6 sm:h-5 rounded text-[10px] sm:text-[11px] font-pixel font-black transition-all cursor-pointer flex items-center justify-center ${
                      currentStageNum === stageNum
                        ? 'bg-[#FFE600] text-black shadow-[0_1px_0_#996600] scale-105 font-black'
                        : 'bg-[#4A3222] text-amber-200 hover:bg-[#63442E] hover:text-white border border-[#2A160A]'
                    }`}
                    title={`제 ${stageNum} 단계`}
                  >
                    {stageNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Shuffle + Sound + Re-try + Close Button */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShuffledWords(shuffleWordsList(currentCategory.words));
                  setWordIndex(0);
                  setInputVal('');
                  handleReset();
                }}
                className="p-1 rounded-md bg-[#3E2419] hover:bg-[#523121] text-[#FFE57F] border border-[#24150E] transition-all cursor-pointer shadow-xs"
                title="낱말 순서 랜덤 섞기"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-300" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 rounded-md bg-[#3E2419] hover:bg-[#523121] text-[#FFE57F] border border-[#24150E] transition-all cursor-pointer shadow-xs"
                title="처음부터 다시 치기"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={toggleSound}
                className="p-1 rounded-md bg-[#3E2419] hover:bg-[#523121] text-[#FFE57F] border border-[#24150E] transition-all cursor-pointer shadow-xs"
                title={isMuted ? '소리 켜기' : '소리 끄기'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md bg-[#E11D48] hover:bg-[#BE123C] text-white border border-black transition-all cursor-pointer shadow-xs"
                  title="닫기 (ESC)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. RECESSED CRT SCREEN DISPLAY (Cyan/Aqua Blue Glass) */}
        <div className="bg-[#121624] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border-4 border-[#1E2333] shadow-[inset_0_4px_16px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col justify-between mb-1.5">
          {/* Cyan Sky Screen Background */}
          <div className="bg-gradient-to-b from-[#1EA8E8] via-[#29B6F6] to-[#0288D1] rounded-lg p-2 sm:p-2.5 border-2 border-[#0369A1] relative overflow-hidden flex flex-col items-center">
            {/* Scanlines Effect */}
            <div className="crt-scanline-overlay pointer-events-none opacity-25" />

            {/* Stage Title Sub-badge: Dedicated Non-overlapping Header */}
            <div className="z-10 mb-1">
              <div className="bg-[#0369A1]/85 backdrop-blur-xs px-3 py-0.5 rounded-full border border-sky-200/40 text-[10px] sm:text-[11px] font-pixel text-white font-bold tracking-wide shadow-xs">
                {currentCategory.name} ({wordIndex + 1} / {TOTAL_TRIALS})
              </div>
            </div>

            {/* Target Word Parchment Scroll & Next Word Preview */}
            <div className="flex items-center justify-center gap-3 sm:gap-6 my-1 z-10 w-full">
              {/* Main Golden Parchment Scroll */}
              <div 
                onClick={() => inputRef.current?.focus()}
                className="cursor-text"
              >
                <CrtParchmentScroll
                  theme="gold"
                  isLarge={true}
                  text={currentWord}
                  renderCustomContent={
                    <div className="flex flex-col items-center justify-center">
                      {/* Highlighted Word Characters */}
                      <div className="text-3xl sm:text-4xl md:text-5xl font-black font-arcade tracking-wider select-none [text-shadow:_0_0_12px_rgba(255,215,0,0.8),_2px_2px_0_#FFF]">
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
                                  ? 'text-[#059669]'
                                  : charState === 'composing'
                                  ? 'text-[#0284C7] underline decoration-[#0284C7] decoration-3 underline-offset-4'
                                  : charState === 'error'
                                  ? 'text-[#E11D48]'
                                  : 'text-[#2A160A]'
                              }
                            >
                              {char}
                            </span>
                          );
                        })}
                      </div>

                      {/* Active Typed String & Cursor */}
                      <div className="min-h-[22px] flex items-center justify-center text-lg sm:text-xl font-black text-[#047857] font-mono mt-0.5">
                        <span>{inputVal}</span>
                        <span className="inline-block w-2 h-4 bg-[#2A160A] ml-0.5 animate-pulse rounded-xs" />
                      </div>
                    </div>
                  }
                />

                {/* Hidden Native Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-text"
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                />
              </div>

              {/* Next Word Preview Scroll */}
              <div className="hidden sm:block">
                <CrtParchmentScroll
                  theme="blue"
                  isLarge={false}
                  text={nextWord}
                />
              </div>
            </div>

            {/* Status Metrics Bar under Scrolls: 실시간 타수, 최고 타수, 정확도 */}
            <div className="w-full max-w-xl bg-[#0B1120]/85 backdrop-blur-xs rounded-xl px-3 py-1.5 border-2 border-sky-400/50 shadow-[0_0_12px_rgba(0,210,255,0.2)] flex items-center justify-between gap-1.5 text-xs font-pixel text-white z-10 mt-1 flex-wrap sm:flex-nowrap">
              {/* 진행도 */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sky-200 text-[10px] font-bold">진행</span>
                <div className="w-14 sm:w-20 bg-[#1E293B] h-2.5 rounded-full overflow-hidden border border-sky-400/40">
                  <div
                    className="bg-gradient-to-r from-[#00F0FF] to-[#00FF66] h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-[#00F0FF] font-black">{progressPercent}%</span>
              </div>

              {/* 실시간 타수 (Neon Cyan Badge) */}
              <div className="flex items-center gap-1 text-[10px] bg-sky-950/80 border border-sky-400/70 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(0,210,255,0.25)] shrink-0">
                <span className="text-[#00D2FF] font-black">⚡ 실시간 타수</span>
                <span className="font-mono text-[#00F0FF] font-black">
                  {stats.cpm} <span className="text-[9px] text-sky-300 font-normal">CPM</span>
                </span>
              </div>

              {/* 최고 타수 (Neon Gold Badge) */}
              <div className="flex items-center gap-1 text-[10px] bg-amber-950/80 border border-amber-400/70 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(255,215,0,0.25)] shrink-0">
                <span className="text-[#FFD700] font-black">👑 최고 타수</span>
                <span className="font-mono text-[#FFE600] font-black">
                  {Math.max(stats.cpm, maxCpm)} <span className="text-[9px] text-amber-200 font-normal">CPM</span>
                </span>
              </div>

              {/* 정확도 (Neon Emerald Badge) */}
              <div className="flex items-center gap-1 text-[10px] bg-emerald-950/80 border border-emerald-400/70 px-2 py-0.5 rounded-md shadow-[0_0_8px_rgba(16,185,129,0.25)] shrink-0">
                <span className="text-[#10B981] font-black">🎯 정확도</span>
                <span className="font-mono text-[#00FF66] font-black">
                  {stats.accuracy}%
                </span>
              </div>

              {/* 오타 */}
              <div className="flex items-center gap-1 text-[10px] shrink-0">
                <span className="text-rose-300">💔 오타</span>
                <span className="px-1.5 py-0.2 bg-rose-950/80 border border-rose-500 rounded font-mono font-black text-rose-400">
                  {stats.errorCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. TARGET FINGER & KEY GUIDE BANNER (가이드 글) */}
        <div className="flex justify-center my-1.5 relative z-20 shrink-0">
          <div className="px-5 py-1 rounded-full bg-[#20130D] border-2 border-[#E5B55A] shadow-[0_3px_6px_rgba(0,0,0,0.6)] flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black font-pixel text-[#FFE57F] tracking-wide">
              목표 손가락 : {targetGuide?.finger || '검지손가락'}
            </span>
            {targetGuide?.charDisplay && (
              <span className="px-2 py-0.2 rounded bg-[#FFE600] text-black font-black text-[10px] font-pixel">
                '{targetGuide.charDisplay}' 키
              </span>
            )}
          </div>
        </div>

        {/* Finished Overlay if practice completed */}
        {isFinished && (
          <div className="mb-4 p-5 bg-[#1E293B]/95 backdrop-blur-md rounded-2xl border-2 border-emerald-400 shadow-xl text-center space-y-3 animate-in zoom-in-95 duration-200 z-40">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 border border-emerald-400 shadow-xs">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#FFE600] font-pixel">
                🎉 '{currentCategory.name}' 완주 성공!
              </h3>
              <p className="text-xs text-slate-300 font-pixel mt-1">
                평균 속도 <strong className="text-emerald-400 font-black">{stats.cpm} CPM</strong> | 정확도 <strong className="text-emerald-400 font-black">{stats.accuracy}%</strong> | +50P 획득!
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
                className="px-4 py-2 rounded-xl bg-[#4A3222] hover:bg-[#5C3F2B] text-[#FFE57F] font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-[#E5B55A] shadow-xs"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>🎯 직전 단계 다시 치기 (재도전)</span>
              </button>

              <button
                onClick={handleNextStage}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95"
              >
                <span>다음 단계로 이동</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 4. VIRTUAL KEYBOARD WITH HANDS OVERLAY */}
        <div className="relative z-10 shrink-0">
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

        {/* 5. CRT ROBOT MASCOT IN BOTTOM-LEFT (with tip speech bubble per redesign image 2) */}
        <div className="absolute left-2.5 bottom-2 z-30 pointer-events-none sm:pointer-events-auto">
          <CrtRobotMascot showSpeechBubble={true} />
        </div>
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

