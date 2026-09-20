import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { KOREAN_KEY_PRACTICE_STAGES, ENGLISH_KEY_PRACTICE_STAGES } from '../../data/practiceData';
import { getKeyGuideForChar, getActiveKeystrokeGuide, countKeystrokes } from '../../utils/hangul';
import { soundManager } from '../../utils/sound';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { TypingStats, UserSession, LeaderboardEntry } from '../../types';
import { RotateCcw, Award, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { recordPracticeHistory } from '../../utils/curriculumManager';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { TypingSpeedTrendChart } from '../TypingSpeedTrendChart';
import { MychewRewardModal } from '../MychewRewardModal';
import { PracticeSetResultModal } from '../PracticeSetResultModal';
import { starMissionManager } from '../../utils/starMissionManager';
import { markQuestUnitDone } from '../../utils/questProgress';

interface KeyPracticeViewProps {
  currentUser: UserSession | null;
  onRecordScore?: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  initialLanguage?: 'ko' | 'en';
  initialStageId?: number;
}

export const KeyPracticeView: React.FC<KeyPracticeViewProps> = ({
  currentUser,
  onRecordScore,
  initialLanguage = 'ko',
  initialStageId = 1,
}) => {
  const savedLastPractice = useMemo(() => dailyMissionsManager.getLastPractice(currentUser?.id), [currentUser]);

  const defaultLang = (savedLastPractice && savedLastPractice.mode === 'key-practice' && savedLastPractice.language)
    ? savedLastPractice.language
    : initialLanguage;

  const defaultStageId = (savedLastPractice && savedLastPractice.mode === 'key-practice' && typeof savedLastPractice.stageId === 'number')
    ? savedLastPractice.stageId
    : initialStageId;

  const [language, setLanguage] = useState<'ko' | 'en'>(defaultLang);
  const stages = language === 'ko' ? KOREAN_KEY_PRACTICE_STAGES : ENGLISH_KEY_PRACTICE_STAGES;

  const [selectedStageId, setSelectedStageId] = useState(defaultStageId);
  const stage = stages.find((s) => s.id === selectedStageId) || stages[0];
  const currentStageNum = stage.id;

  // Practice volume: 1회 약 5분 분량(60문항) 기본 탑재
  const [practiceCourse, setPracticeCourse] = useState<'5min' | '3min' | '10min'>('5min');
  const TOTAL_TRIALS = practiceCourse === '5min' ? 60 : practiceCourse === '3min' ? 35 : 120;

  const activeSamples = useMemo(() => {
    const list = [...stage.sampleList];
    while (list.length < TOTAL_TRIALS) {
      list.push(...stage.sampleList);
    }
    return list.slice(0, TOTAL_TRIALS);
  }, [stage.sampleList, TOTAL_TRIALS]);

  const [sampleIndex, setSampleIndex] = useState(0);
  const currentSample = activeSamples[sampleIndex] || activeSamples[0] || '';
  const nextSample = activeSamples[sampleIndex + 1] || '';
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showSetResultModal, setShowSetResultModal] = useState(false);
  const [starEarnedThisSet, setStarEarnedThisSet] = useState(false);
  const [currentStarsCount, setCurrentStarsCount] = useState(() => starMissionManager.getState(currentUser?.id).stars);

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
    return getActiveKeystrokeGuide(currentSample, inputVal);
  }, [currentSample, inputVal]);

  // Auto focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedStageId, sampleIndex, isFinished, language]);

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
    addTypingPracticePoints(40, `${language === 'ko' ? '한글' : '영어'} 자리 (${stage.title}) 완주`);
    markQuestUnitDone(currentUser?.id, 'key-practice', stage.title, language);
    
    const isAccPassed = stats.accuracy >= 95;
    let earnedStar = false;
    let newStars = currentStarsCount;

    if (isAccPassed) {
      const starRes = starMissionManager.addStar(`${language === 'ko' ? '한글' : '영어'} 자리 (${stage.title}) 완주`, currentUser?.id);
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
    
    // Flush buffered character strokes and update mission
    if (bufferedStrokesRef.current > 0) {
      dailyMissionsManager.incrementProgress('chars', bufferedStrokesRef.current, currentUser?.id);
      bufferedStrokesRef.current = 0;
    }
    dailyMissionsManager.incrementProgress('lesson', 1, currentUser?.id);
    dailyMissionsManager.saveLastPractice({
      mode: 'key-practice',
      modeTitle: '1단계: 자리 연습',
      stageTitle: stage.title,
      stageId: stage.id,
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
        mode: 'key-practice',
        modeTitle: `${language === 'ko' ? '한글' : '영어'} 자리 (${stage.title})`,
        language,
        stageTitle: stage.title,
        sampleText: stage.sampleList.slice(0, 5).join(', '),
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        errorCount: stats.errorCount,
        correctCount: stats.correctCount,
        totalKeystrokes: stats.totalKeystrokes,
        elapsedSeconds: stats.elapsedSeconds,
        stageId: stage.id,
      } as any);
    }

    if (onRecordScore) {
      onRecordScore({
        userName: currentUser ? currentUser.name : '게스트',
        mode: 'key' as any,
        modeTitle: `자리연습 (${stage.title})`,
        score: stats.cpm * 3 + stats.maxCombo * 20,
        cpm: stats.cpm,
        accuracy: stats.accuracy,
        details: `${stage.title} 완주`,
      });
    }
  };

  const EN_TO_KO_MAP: Record<string, string> = {
    a: 'ㅁ', b: 'ㅠ', c: 'ㅊ', d: 'ㅇ', e: 'ㄷ', f: 'ㄹ', g: 'ㅎ',
    h: 'ㅗ', i: 'ㅑ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ', m: 'ㅡ', n: 'ㅜ',
    o: 'ㅐ', p: 'ㅔ', q: 'ㅂ', r: 'ㄱ', s: 'ㄴ', t: 'ㅅ', u: 'ㅕ',
    v: 'ㅍ', w: 'ㅈ', x: 'ㅌ', y: 'ㅛ', z: 'ㅋ',
    Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    if (!val) {
      setInputVal('');
      setIsCorrectLastKey(null);
      return;
    }

    // User is backspacing / clearing
    if (val.length < inputVal.length) {
      setIsCorrectLastKey(null);
      setInputVal(val);
      return;
    }

    let lastTypedChar = val.slice(-1);
    const expectedChar = currentSample;

    // Auto-map English keys to Korean jamo if practicing Korean and user typed Latin character
    if (language === 'ko' && EN_TO_KO_MAP[lastTypedChar]) {
      lastTypedChar = EN_TO_KO_MAP[lastTypedChar];
    }

    const guide = getKeyGuideForChar(lastTypedChar);
    setActiveKeyCode(guide.code);
    setLastFingerUsed(guide.fingerName);

    const strokesAdded = countKeystrokes(lastTypedChar);
    bufferedStrokesRef.current += strokesAdded;

    if (lastTypedChar === expectedChar) {
      soundManager.playKeyClick(true);
      soundManager.playSuccess();
      setIsCorrectLastKey(true);

      setStats((prev) => {
        const nextCombo = prev.combo + 1;
        if (nextCombo % 5 === 0) {
          soundManager.playCombo(nextCombo);
        }
        return {
          ...prev,
          correctCount: prev.correctCount + 1,
          totalKeystrokes: prev.totalKeystrokes + strokesAdded,
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
        };
      });

      setInputVal('');
      if (sampleIndex + 1 < TOTAL_TRIALS) {
        setSampleIndex((prev) => prev + 1);
      } else {
        finishPractice();
      }
    } else {
      soundManager.playKeyClick(false);
      soundManager.playError();
      setIsCorrectLastKey(false);

      setStats((prev) => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        totalKeystrokes: prev.totalKeystrokes + strokesAdded,
        combo: 0,
      }));

      // Reset input buffer immediately so the next keypress does not merge into compound syllables
      setInputVal('');
    }

    setTimeout(() => {
      setActiveKeyCode(null);
    }, 200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      setIsCorrectLastKey(null);
      setInputVal('');
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.length === 0) return;

      if (inputVal === currentSample) {
        soundManager.playSuccess();
        setIsCorrectLastKey(true);
      } else {
        soundManager.playError();
        setIsCorrectLastKey(false);
      }

      if (sampleIndex + 1 < TOTAL_TRIALS) {
        setSampleIndex((prev) => prev + 1);
        setInputVal('');
      } else {
        finishPractice();
      }
    }
  };

  const handleReset = () => {
    setSampleIndex(0);
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
    const targetStage = stages.find((s) => s.id === stageNum) || stages[stageNum - 1];
    if (targetStage) {
      setSelectedStageId(targetStage.id);
      setSampleIndex(0);
      setInputVal('');
      setIsFinished(false);
      startTimeRef.current = null;
    }
  };

  const handlePrevStage = () => {
    const currentIndex = stages.findIndex((s) => s.id === selectedStageId);
    if (currentIndex > 0) {
      setSelectedStageId(stages[currentIndex - 1].id);
      handleReset();
    }
  };

  const handleNextStage = () => {
    const currentIndex = stages.findIndex((s) => s.id === selectedStageId);
    if (currentIndex < stages.length - 1) {
      setSelectedStageId(stages[currentIndex + 1].id);
      handleReset();
    } else if (language === 'ko') {
      // Transition to English stage 1
      setLanguage('en');
      setSelectedStageId(1);
      handleReset();
    }
  };

  const progressPercent = Math.round(((sampleIndex) / TOTAL_TRIALS) * 100);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 10 Star Progress & MyChew Mission Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-pink-50 via-amber-50 to-rose-50 p-3.5 sm:p-4 rounded-2xl border-2 border-pink-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-bounce">🍬</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-pink-700">5분 집중 자리 연습 코스</span>
              <span className="text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                1회 약 5분 소요 (60문항)
              </span>
              <span className="text-[11px] font-black text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                마이쮸 미션: 정확도 90% 이상 통과 시 지급!
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-medium mt-0.5">
              5분 동안 한 글쇠씩 집중하여 손가락 위치를 완벽히 익혀보세요!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 코스 선택기 */}
          <div className="flex bg-white/90 p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => { setPracticeCourse('3min'); handleReset(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                practiceCourse === '3min' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⏱️ 3분 (35문항)
            </button>
            <button
              type="button"
              onClick={() => { setPracticeCourse('5min'); handleReset(); }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                practiceCourse === '5min' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚡ 5분 표준 (60문항)
            </button>
            <button
              type="button"
              onClick={() => { setPracticeCourse('10min'); handleReset(); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                practiceCourse === '10min' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏆 10분 심화 (120문항)
            </button>
          </div>

          {/* 진행도 & 시간 표시기 */}
          <div className="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs">
            <span className="text-amber-500 text-sm">⭐</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold">진행도</span>
              <span className="font-mono font-black text-xs text-pink-700">
                {sampleIndex + 1}/{TOTAL_TRIALS} ({Math.round(((sampleIndex) / TOTAL_TRIALS) * 100)}%)
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold">경과 시간</span>
              <span className="font-mono font-black text-xs text-sky-700">
                {Math.floor(stats.elapsedSeconds / 60)}분 {String(stats.elapsedSeconds % 60).padStart(2, '0')}초
              </span>
            </div>
          </div>

          {sampleIndex >= 10 && (
            <button
              type="button"
              onClick={finishPractice}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
              title="지금까지 연습한 결과로 완료하고 보상을 확인합니다"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>완료하기 ({sampleIndex}개 완료)</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Header & Language Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></span>
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            <span>자리 연습</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold border border-sky-200">
              {stage.title}
            </span>
          </h2>
        </div>

        {/* Simultaneous Keyboard Status Badge & Language Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-400/50 text-xs font-black shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>⌨️ 키보드 동시 보기 [ON]</span>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setLanguage('ko');
                setSelectedStageId(1);
                handleReset();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                language === 'ko' ? 'bg-sky-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇰🇷 한글 자리</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                setSelectedStageId(1);
                handleReset();
              }}
              className={`px-3 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                language === 'en' ? 'bg-indigo-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🇺🇸 영어 자리</span>
            </button>
          </div>
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
          CLASSIC HANCOM TYPING CONSOLE CASING
         ========================================================================= */}
      <div className="bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 p-2.5 sm:p-4 rounded-3xl border-4 border-slate-300 shadow-2xl relative">
        {/* Top Status Strip: 진행도 / 오타수 / 정확도 / 속도 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-1.5 border border-slate-300 shadow-xs mb-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-black text-slate-700">
          {/* 진행도 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">진행도</span>
            <div className="w-24 sm:w-36 bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300 p-0.5">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-8 text-right font-black text-slate-800 text-xs">{progressPercent}%</span>
          </div>

          {/* 오타수 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">오타수</span>
            <div className="px-2.5 py-0.5 bg-slate-100 border border-slate-300 rounded-md font-mono font-black text-rose-600 text-xs min-w-[32px] text-center shadow-inner">
              {stats.errorCount}
            </div>
          </div>

          {/* 정확도 */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">정확도</span>
            <div className="w-20 sm:w-28 bg-slate-200 h-3 rounded-full overflow-hidden border border-slate-300 p-0.5">
              <div
                className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="w-8 text-right font-black text-slate-800 text-xs">{stats.accuracy}%</span>
          </div>

          {/* 타수 / CPM */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600">속도</span>
            <span className="font-mono text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 text-xs font-black">
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

          {/* Left / Center: Target Card & Next Preview */}
          <div className="hidden md:flex items-center justify-end w-full z-10 pr-2">
            {/* Left Dotted Arrows */}
            <div className="flex flex-col text-sky-200/80 font-mono text-sm select-none">
              <span>◀ ◀</span>
              <span>◀ ◀</span>
            </div>
          </div>

            {/* Target Big Word / Key Card (Elevated Silver/White Box) */}
            <div 
              onClick={() => inputRef.current?.focus()}
              className="bg-gradient-to-b from-white to-slate-100 rounded-2xl p-2.5 sm:p-3.5 border-3 border-slate-300 shadow-[0_6px_16px_rgba(0,0,0,0.15)] min-w-[180px] sm:min-w-[220px] text-center cursor-text relative"
            >
              {/* Target Text */}
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wider select-none mb-1 font-mono">
                {currentSample.split('').map((char, index) => {
                  const isTyped = index < inputVal.length;
                  const isMatch = isTyped && inputVal[index] === char;
                  return (
                    <span
                      key={index}
                      className={
                        isMatch
                          ? 'text-teal-600'
                          : isTyped
                          ? 'text-rose-500'
                          : 'text-slate-800'
                      }
                    >
                      {char === ' ' ? '␣' : char}
                    </span>
                  );
                })}
              </div>

              {/* Typing Line & Blinking Cursor Area */}
              <div className="min-h-[32px] flex items-center justify-center text-xl sm:text-2xl font-black text-sky-600 font-mono">
                <span>{inputVal}</span>
                <span className="inline-block w-2.5 h-6 bg-slate-900 ml-0.5 animate-pulse rounded-xs" />
              </div>

              {/* Hidden Real Input */}
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

            <div className="flex flex-col md:flex-row items-center justify-between gap-3 w-full z-10 md:pl-2">
            {/* Next Sample Preview on Aqua Background */}
            <div className="flex items-center gap-2 select-none">
              <div className="text-sky-200/90 font-mono text-lg">
                ◀
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs font-black text-sky-100 tracking-tight">다음 글쇠</span>
                <span className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] font-mono">
                  {nextSample || '완주 직전!'}
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

            {/* Mini Keyboard Diagram with Active Red Keys for Key Stages */}
            <div className="bg-slate-800 p-1.5 rounded-lg border border-slate-700 shadow-inner">
              <div className="space-y-0.5">
                {/* Row 1 (Numbers) */}
                <div className="flex gap-0.5 justify-center">
                  {[...Array(12)].map((_, i) => {
                    const isRed = currentStageNum === 8;
                    return (
                      <div
                        key={i}
                        className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500 shadow-xs' : 'bg-slate-600'}`}
                      />
                    );
                  })}
                </div>
                {/* Row 2 (Top Row) */}
                <div className="flex gap-0.5 justify-center">
                  {[...Array(11)].map((_, i) => {
                    const isRed = (currentStageNum === 2 && i < 5) || (currentStageNum === 3 && i >= 5) || (currentStageNum === 7 && (i < 5 || i >= 8)) || currentStageNum === 8;
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
                    const isRed = currentStageNum === 1 || currentStageNum === 6 || currentStageNum === 8;
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
                    const isRed = (currentStageNum === 4 && i < 4) || (currentStageNum === 5 && i >= 4) || currentStageNum === 8;
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
                        ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-md ring-1 ring-sky-300 font-extrabold scale-110'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                    }`}
                  >
                    {stageNum}
                  </button>
                );
              })}
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
                🎉 '{stage.title}' 완주 성공!
              </h3>
              <p className="text-xs text-slate-600 font-bold mt-1">
                평균 속도 <strong className="text-emerald-600 font-black">{stats.cpm} CPM</strong> | 정확도 <strong className="text-emerald-600 font-black">{stats.accuracy}%</strong> | +40P 획득!
              </p>
            </div>

            {/* Recharts Typing Speed Trend Chart */}
            <div className="max-w-md mx-auto">
              <TypingSpeedTrendChart
                currentCpm={stats.cpm}
                currentAccuracy={stats.accuracy}
                stageTitle={stage.title}
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
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95"
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
        title={`자리연습 (${stage.title})`}
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
        title={`자리연습 (${stage.title})`}
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

