import { netCpm } from '../../utils/typingScore';
import { keyStageId } from '../../utils/activityLog';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PRACTICE_SET_POINTS } from '../../utils/pointRules';
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
  // 별은 단계마다 따로 10개 (1단계 1번 + 2단계 1번 ≠ 별 2개)
  const starScope = `key_${language}_${stage.id}`;
  const [currentStarsCount, setCurrentStarsCount] = useState(() => starMissionManager.getState(currentUser?.id, starScope).stars);
  useEffect(() => {
    setCurrentStarsCount(starMissionManager.getState(currentUser?.id, starScope).stars);
  }, [currentUser?.id, starScope]);
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
  // 첫 키를 누르면 시계 시작 (예전에는 시계가 시작되지 않아 타수가 0으로 남는 경우가 있었음)
  const [timerOn, setTimerOn] = useState(false);
  useEffect(() => {
    if (startTimeRef.current && !isFinished) {
      timerRef.current = window.setInterval(() => {
        const now = Date.now();
        const elapsedSec = Math.max(1, Math.floor((now - startTimeRef.current!) / 1000));

        setStats((prev) => {
          // 순타수 = 맞게 친 타수 ÷ 시간 (틀리게 누른 키는 빠짐)
          const cpm = netCpm(prev.correctStrokes || 0, elapsedSec);
          const totalAttempts = prev.correctCount + prev.errorCount;
          const accuracy = totalAttempts > 0 ? Math.round((prev.correctCount / totalAttempts) * 100) : 100;
          return {
            ...prev,
            elapsedSeconds: elapsedSec,
            cpm,
            accuracy,
          };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isFinished, timerOn]);

  /** 세트가 끝난 뒤 키를 더 눌러도 다시 끝나거나 별·기록이 또 쌓이지 않게 */
  const finishedRef = useRef(false);
  useEffect(() => {
    if (!isFinished) finishedRef.current = false;
  }, [isFinished]);

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const finishPractice = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    // 마지막 키까지 반영된 값으로 최종 타수·정확도 계산
    const s0 = statsRef.current;
    const el = startTimeRef.current ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)) : s0.elapsedSeconds;
    const attempts = s0.correctCount + s0.errorCount;
    const stats = { ...s0, elapsedSeconds: el, cpm: netCpm(s0.correctStrokes || 0, el), accuracy: attempts > 0 ? Math.round((s0.correctCount / attempts) * 100) : 100 };
    setStats(stats);
    setIsFinished(true);
    soundManager.playVictory();
    addTypingPracticePoints(PRACTICE_SET_POINTS, `${language === 'ko' ? '한글' : '영어'} 자리 (${stage.title}) 완주`);
    markQuestUnitDone(currentUser?.id, 'key-practice', stage.title, language);
    
    const isAccPassed = stats.accuracy >= 95;
    let earnedStar = false;
    let newStars = currentStarsCount;

    if (isAccPassed) {
      const starRes = starMissionManager.addStar(`${language === 'ko' ? '한글' : '영어'} 자리 (${stage.title}) 완주`, currentUser?.id, starScope);
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
    {
      // 한 세트를 끝까지 쳤을 때만 기록 (로그인 안 했으면 '게스트' 기록)
      recordPracticeHistory({
        userId: currentUser?.id || 'guest',
        userName: currentUser?.name || '게스트',
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
    if (finishedRef.current) return;
    let val = e.target.value;

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      setTimerOn(true);
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
          correctStrokes: (prev.correctStrokes || 0) + strokesAdded,
          combo: nextCombo,
          maxCombo: Math.max(prev.maxCombo, nextCombo),
        };
      });

      setInputVal('');
      if (sampleIndex + 1 < TOTAL_TRIALS) {
        setSampleIndex((prev) => prev + 1);
      } else {
        setTimeout(finishPractice, 0);
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
      if (e.repeat || finishedRef.current || inputVal.length === 0) return;

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
        setTimeout(finishPractice, 0);
      }
    }
  };

  const handleReset = () => {
    setSampleIndex(0);
    setInputVal('');
    setIsFinished(false);
    setTimerOn(false);
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
      setTimerOn(false);
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
    <div className="tp-typing-screen space-y-3">
      {/* Top Header & Language Selector */}
      <div className="pr-toolbar flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black text-[#2c1507] tracking-tight flex items-center gap-2 font-arcade">
            <span>자리 연습</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#4e2b14] text-[#ffe899] font-bold border-2 border-[#2c1507]">
              {stage.title}
            </span>
          </h2>
        </div>

        {/* Course, Language & Reset Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 코스 선택 */}
          <div className="pr-wood-group flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => { setPracticeCourse('3min'); handleReset(); }}
              className={`pr-wood-tab px-2.5 py-1 text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                practiceCourse === '3min' ? 'pr-wood-tab--active' : ''
              }`}
            >
              3분
            </button>
            <button
              type="button"
              onClick={() => { setPracticeCourse('5min'); handleReset(); }}
              className={`pr-wood-tab px-2.5 py-1 text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                practiceCourse === '5min' ? 'pr-wood-tab--green' : ''
              }`}
            >
              5분
            </button>
            <button
              type="button"
              onClick={() => { setPracticeCourse('10min'); handleReset(); }}
              className={`pr-wood-tab px-2.5 py-1 text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                practiceCourse === '10min' ? 'pr-wood-tab--blue' : ''
              }`}
            >
              10분
            </button>
          </div>

          {sampleIndex >= 10 && (
            <button
              type="button"
              onClick={finishPractice}
              className="tp-rpg-btn px-3 py-1.5 text-xs sm:text-sm bg-[#22c55e] text-[#052e16] cursor-pointer flex items-center gap-1 whitespace-nowrap"
              title="지금까지 연습한 결과로 완료합니다"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>완료하기</span>
            </button>
          )}

          <div className="pr-wood-group flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => {
                setLanguage('ko');
                setSelectedStageId(1);
                handleReset();
              }}
              className={`pr-wood-tab px-2.5 py-1 text-xs cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                language === 'ko' ? 'pr-wood-tab--blue' : ''
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
              className={`pr-wood-tab px-2.5 py-1 text-xs cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                language === 'en' ? 'pr-wood-tab--active' : ''
              }`}
            >
              <span>🇺🇸 영어 자리</span>
            </button>
          </div>
          {/* Quick Re-type Button */}
          <button
            type="button"
            onClick={handleReset}
            className="tp-rpg-btn tp-rpg-btn--gold px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            title="현재 단계를 처음부터 다시 칩니다"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>이 단계 다시 치기</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          16-BIT PIXEL RPG PRACTICE CONSOLE SHELL
         ========================================================================= */}
      <div className="pr-shell p-2.5 sm:p-3.5 relative">
        {/* Top Wooden Signboard Status Bar: 진행도 / 오타수 / 정확도 / 속도 */}
        <div className="pr-status-bar px-3.5 sm:px-5 py-2.5 mb-2.5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3.5 text-base sm:text-lg font-black">
          {/* 진행도 */}
          <div className="flex items-center gap-2">
            <span className="text-[#ffe899]">진행도</span>
            <div className="pr-gauge-track w-24 sm:w-36 h-4.5">
              <div
                className="pr-gauge-fill pr-gauge-fill--blue"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="w-14 text-right font-mono tabular-nums text-white text-base sm:text-lg">
              {progressPercent}%
            </span>
            <span className="min-w-[68px] text-center font-mono tabular-nums text-[#f7dca2] text-sm sm:text-base">({sampleIndex + 1}/{TOTAL_TRIALS})</span>
          </div>

          {/* 오타수 */}
          <div className="flex items-center gap-2">
            <span className="text-[#ffe899]">오타수</span>
            <div className="pr-status-chip px-3 py-0.5 font-mono tabular-nums font-black text-[#fda4af] text-base sm:text-lg min-w-[46px] text-center">
              {stats.errorCount}
            </div>
          </div>

          {/* 정확도 */}
          <div className="flex items-center gap-2">
            <span className="text-[#ffe899]">정확도</span>
            <div className="pr-gauge-track w-20 sm:w-28 h-4.5">
              <div
                className="pr-gauge-fill pr-gauge-fill--green"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
            <span className="w-14 text-right font-mono tabular-nums text-white text-base sm:text-lg">{stats.accuracy}%</span>
          </div>

          {/* 타수 / CPM */}
          <div className="flex items-center gap-2">
            <span className="text-[#ffe899]">속도</span>
            <span className="pr-status-chip min-w-[116px] text-center font-mono tabular-nums text-[#7dd3fc] px-3 py-0.5 text-base sm:text-lg font-black">
              {stats.cpm} <span className="text-sm text-[#e6cfa0]">타/분</span>
            </span>
          </div>
        </div>

        {/* =========================================================================
            FOREST MEADOW STAGE WITH PARCHMENT CARD & WOODEN SIGNPOST
           ========================================================================= */}
        <div className="pr-meadow-stage pr-meadow-stage--key p-3 sm:p-4 flex flex-col md:grid md:grid-cols-[minmax(44px,0.55fr)_auto_minmax(390px,1.45fr)] items-center gap-3 mb-2.5">
          {/* Left Spacer */}
          <div className="hidden md:flex items-center justify-end w-full z-10 pr-2">
            <div className="flex flex-col text-[#fff7dc] font-mono text-sm font-black drop-shadow-[1px_1px_0_#2c1507] select-none">
              <span>◀ ◀</span>
              <span>◀ ◀</span>
            </div>
          </div>

          {/* Target Big Key Card (Parchment Scroll) */}
          <div 
            onClick={() => inputRef.current?.focus()}
            className="pr-parchment-card pr-parchment-card--prompt w-[340px] sm:w-[420px] max-w-full text-center cursor-text z-10"
          >
            {/* Target Text */}
            <div className="h-[76px] sm:h-[84px] flex items-center justify-center overflow-hidden text-6xl sm:text-7xl font-black text-[#241106] tracking-wider select-none mb-1 font-mono leading-none" data-sample={currentSample}>
              {currentSample.split('').map((char, index) => {
                const isTyped = index < inputVal.length;
                const isMatch = isTyped && inputVal[index] === char;
                return (
                  <span
                    key={index}
                    className={
                      isMatch
                        ? 'text-[#0f766e]'
                        : isTyped
                        ? 'text-[#be123c]'
                        : 'text-[#241106]'
                    }
                  >
                    {char === ' ' ? '␣' : char}
                  </span>
                );
              })}
            </div>

            {/* Typing Line & Blinking Cursor Area */}
            <div className="h-[56px] flex items-center justify-center overflow-hidden text-4xl sm:text-5xl font-black text-[#0369a1] font-mono leading-none">
              <span>{inputVal}</span>
              <span className="inline-block w-2.5 h-6 bg-[#2c1507] ml-0.5 animate-pulse rounded-xs shrink-0" />
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

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full z-10 md:pl-2">
            {/* Next Key Preview on Wooden Signpost */}
            <div className="pr-signpost select-none">
              <div className="pr-signpost-board">
                <span className="pr-signpost-label">다음 글쇠</span>
                <span
                  className={`pr-signpost-word font-mono ${
                    nextSample ? 'pr-signpost-word--xl' : 'pr-signpost-word--xs'
                  }`}
                >
                  {nextSample === ' ' ? '␣' : nextSample || '완주 직전!'}
                </span>
              </div>
            </div>

            {/* Right Side: Wooden/Parchment Stage Setting & Stone Buttons [1]~[8] */}
            <div className="pr-stage-panel p-2.5 sm:p-3 flex flex-col items-center gap-2 z-10 w-full sm:w-auto">
              {/* Header: ◀ 단계 설정 ▶ */}
              <div className="pr-stage-panel-head flex items-center justify-between w-full gap-2 text-sm sm:text-base font-black">
                <button
                  type="button"
                  onClick={handlePrevStage}
                  className="pr-stone-btn p-1 cursor-pointer"
                  title="이전 단계"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="tracking-tight font-extrabold px-1">단계 설정</span>
                <button
                  type="button"
                  onClick={handleNextStage}
                  className="pr-stone-btn p-1 cursor-pointer"
                  title="다음 단계"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Mini Keyboard Diagram with Active Red Keys for Key Stages */}
              <div className="bg-[#2c1a0e] p-1.5 rounded-lg border-2 border-[#4a2a12]">
                <div className="space-y-0.5">
                  {/* Row 1 (Numbers) */}
                  <div className="flex gap-0.5 justify-center">
                    {[...Array(12)].map((_, i) => {
                      const isRed = currentStageNum === 8;
                      return (
                        <div
                          key={i}
                          className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500' : 'bg-[#6b5340]'}`}
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
                          className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500' : 'bg-[#6b5340]'}`}
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
                          className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-amber-400' : 'bg-[#6b5340]'}`}
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
                          className={`w-2.5 h-2 rounded-xs ${isRed ? 'bg-rose-500' : 'bg-[#6b5340]'}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Stone Stage Selector Buttons [1] ~ [8] */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((stageNum) => {
                  const isSelected = currentStageNum === stageNum;
                  return (
                    <button
                      key={stageNum}
                      type="button"
                      onClick={() => selectStageByNumber(stageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm font-black cursor-pointer flex items-center justify-center ${
                        isSelected ? 'pr-stone-btn--active' : 'pr-stone-btn'
                      }`}
                    >
                      {stageNum}
                    </button>
                  );
                })}
              </div>
              {/* 이 단계에서 모은 별 (단계마다 10번씩 완주해야 별 10개) */}
              <div className="flex items-center gap-0.5 text-xs sm:text-sm font-black text-[#8a4b08]" data-testid="stage-stars" title="정확도 95% 이상으로 이 단계를 완주할 때마다 별 1개">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={i < currentStarsCount ? 'text-[#f59e0b]' : 'text-[#cbb893]'}>★</span>
                ))}
                <span className="ml-1 text-[#4a2a12] font-mono tabular-nums">{currentStarsCount}/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Finished Overlay if practice completed */}
        {isFinished && (
          <div className="mb-3 p-5 pr-parchment-card text-center space-y-4">
            <div className="w-14 h-14 bg-[#fef3c7] rounded-xl flex items-center justify-center mx-auto text-[#b45309] border-2 border-[#3d220d]">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#2c1507] font-arcade">
                🎉 '{stage.title}' 완주 성공!
              </h3>
              <p className="text-xs text-[#5c3214] font-bold mt-1">
                평균 속도 <strong className="text-[#0f766e] font-black">{stats.cpm} CPM</strong> | 정확도 <strong className="text-[#0f766e] font-black">{stats.accuracy}%</strong> | +40P 획득!
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

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="tp-rpg-btn tp-rpg-btn--gold px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>🎯 직전 단계 다시 치기 (재도전)</span>
              </button>

              <button
                onClick={handleNextStage}
                className="tp-rpg-btn tp-rpg-btn--wood px-6 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
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
        practiceKind="key"
        keyStage={keyStageId(language, stage.id)}
        keyStageLabel={stage.title.split(':')[0]}
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

