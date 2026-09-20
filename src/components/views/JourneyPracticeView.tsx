import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  RotateCcw,
  Trophy,
  Sparkles,
  Award,
  Zap,
  Flame,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
  Lightbulb,
  Music,
  Play,
  Square as StopIcon,
  Volume2,
  VolumeX,
  Radio,
  BookOpen,
  ChevronRight,
  FastForward,
  Compass,
  Landmark,
  Crown,
  Feather,
  ArrowRight
} from 'lucide-react';
import { UserSession, TypingStats, AppMode } from '../../types';
import { CountryFlag } from '../CountryFlag';
import { KingFace } from '../KingFace';
import { WORLD_CAPITALS_DATA, JOSEON_KINGS_DATA, JOSEON_DETAILED_MAP } from '../../data/journeyData';
import { LYRIC_SONGS_DATA, LyricSongItem } from '../../data/lyricsData';
import { BOOK_CHALLENGE_LIST, BookItem } from '../../data/bookData';
import { soundManager } from '../../utils/sound';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { countKeystrokes, getWordChosung } from '../../utils/hangul';
import confetti from 'canvas-confetti';

interface JourneyPracticeViewProps {
  initialTab?: 'capitals' | 'joseon' | 'lyrics' | 'transcription' | 'book';
  currentUser: UserSession | null;
  onRecordScore?: (record: any) => void;
  onSelectMode?: (mode: AppMode) => void;
}

export const JourneyPracticeView: React.FC<JourneyPracticeViewProps> = ({
  initialTab = 'capitals',
  currentUser,
  onRecordScore,
  onSelectMode,
}) => {
  // Normalize initialTab ('transcription' is mapped to 'book' or 'lyrics')
  const resolvedInitialTab = initialTab === 'transcription' ? 'book' : initialTab;
  const [activeTab, setActiveTab] = useState<'capitals' | 'joseon' | 'lyrics' | 'book'>(resolvedInitialTab);

  // Floating bonus point alert
  const [bonusPointsAlert, setBonusPointsAlert] = useState<{ id: number; text: string; points: number } | null>(null);
  // Defer point awarding: accumulate points throughout the set, award only on full set completion
  const [accumulatedSetPoints, setAccumulatedSetPoints] = useState(0);
  // 한 세트 = 세계 수도 10문제 / 조선 국왕 5명. 세트를 끝까지 쳐야 모인 포인트를 한꺼번에 지급
  const SET_SIZE = { capitals: 10, joseon: 5 } as const;
  const SET_BONUS = 30;
  const [setDoneCount, setSetDoneCount] = useState(0);
  const [setRewardModal, setSetRewardModal] = useState<{ points: number; label: string } | null>(null);

  // 포인트 지갑은 적립할 때 1/6 로 줄여서 넣으므로(pointsManager), 화면에도 실제로 들어가는 값을 보여줌
  const realPts = (n: number) => (n > 0 ? Math.max(1, Math.round(n / 6)) : 0);

  const awardPoints = (points: number, reason: string) => {
    // Accumulate points in current set; actual points are awarded to user when the set completes!
    setAccumulatedSetPoints((prev) => prev + points);
    setBonusPointsAlert({ id: Date.now(), text: `${reason} (세트 완주 시 지급)`, points });
    setTimeout(() => {
      setBonusPointsAlert((prev) => (prev?.id ? null : prev));
    }, 2000);
  };

  /** 한 문제(수도 1개 / 국왕 1명)를 끝냈을 때: 세트가 다 차면 포인트 지급 */
  const countSetItem = (tab: 'capitals' | 'joseon', earned: number, isLastOfCourse: boolean) => {
    const next = setDoneCount + 1;
    if (isLastOfCourse) {
      setSetDoneCount(0);
      return; // 코스 마지막 문제는 finishCourse 에서 한꺼번에 지급
    }
    if (next >= SET_SIZE[tab]) {
      const total = accumulatedSetPoints + earned + SET_BONUS;
      if (currentUser?.id) {
        addTypingPracticePoints(total, `지식타자 (${tab === 'capitals' ? '세계 수도' : '조선 국왕'}) 1세트 완주`);
      }
      setAccumulatedSetPoints(0);
      setSetDoneCount(0);
      soundManager.play('fanfare');
      setSetRewardModal({
        points: total,
        label: tab === 'capitals' ? `세계 수도 ${SET_SIZE.capitals}문제` : `조선 국왕 ${SET_SIZE.joseon}명`,
      });
      setBonusPointsAlert({ id: Date.now(), text: '🎉 1세트 완주! 포인트 지급 완료!', points: total });
    } else {
      setSetDoneCount(next);
    }
  };

  // COMMON STATS & TIMER
  const [inputVal, setInputVal] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
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

  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showAnswerHint, setShowAnswerHint] = useState(false);

  // Quiz modes
  const [hideNameMode, setHideNameMode] = useState(false);
  const [hideChosungMode, setHideChosungMode] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const bufferedCharsRef = useRef<number>(0);

  // ==========================================
  // TAB 1: 세계 수도 정복 STATE
  // ==========================================
  const [capitalIndex, setCapitalIndex] = useState(0);
  const [selectedContinent, setSelectedContinent] = useState<string>('전체');
  const [conqueredCapitals, setConqueredCapitals] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('pangpang_conquered_capitals');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentCapital = WORLD_CAPITALS_DATA[capitalIndex] || WORLD_CAPITALS_DATA[0];

  // Filtered capitals for continent view
  const filteredCapitals = useMemo(() => {
    if (selectedContinent === '전체') return WORLD_CAPITALS_DATA;
    return WORLD_CAPITALS_DATA.filter((c) => c.continent === selectedContinent);
  }, [selectedContinent]);

  // ==========================================
  // TAB 2: 조선 왕조 27대 STATE
  // ==========================================
  const [kingIndex, setKingIndex] = useState(0);
  // 1단계: 왕 이름 맞히기 ('name'), 2단계: 핵심 업적 타자 ('achievement')
  const [joseonStep, setJoseonStep] = useState<'name' | 'achievement'>('name');
  const [conqueredKings, setConqueredKings] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('pangpang_conquered_kings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentKing = JOSEON_KINGS_DATA[kingIndex] || JOSEON_KINGS_DATA[0];

  // ==========================================
  // TAB 3: K-POP 명곡 가사 챌린지 STATE
  // ==========================================
  const [songIndex, setSongIndex] = useState(0);
  const [songLineIndex, setSongLineIndex] = useState(0);

  const currentSong = LYRIC_SONGS_DATA[songIndex] || LYRIC_SONGS_DATA[0];
  const currentSongLine = currentSong.lines[songLineIndex] || currentSong.lines[0];

  // ==========================================
  // TAB 4: 감성 필사 (책 모드 - https://www.hangul-tajawang.com/challenge) STATE
  // ==========================================
  const [bookIndex, setBookIndex] = useState(0);
  const [bookLineIndex, setBookLineIndex] = useState(0);
  const [conqueredBooks, setConqueredBooks] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pangpang_conquered_books');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentBook = BOOK_CHALLENGE_LIST[bookIndex] || BOOK_CHALLENGE_LIST[0];
  const currentBookLine = currentBook.sentences[bookLineIndex] || currentBook.sentences[0];

  // Current Joseon King Detailed Info
  const currentKingDetailed = JOSEON_DETAILED_MAP[kingIndex] || JOSEON_DETAILED_MAP[0];

  // "들어오면 다시 시작하게 해줘" -> Reset everything on initial mount or tab change
  useEffect(() => {
    setCapitalIndex(0);
    setKingIndex(0);
    setJoseonStep('name');
    setSongLineIndex(0);
    setBookLineIndex(0);
    setInputVal('');
    setIsCompleted(false);
    setIsTimerRunning(false);
    setShowAnswerHint(false);
    setAccumulatedSetPoints(0);
    setSetDoneCount(0);
    bufferedCharsRef.current = 0;
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
  }, [activeTab]);

  // Restart function
  const handleRestart = () => {
    setAccumulatedSetPoints(0);
    setSetDoneCount(0);
    setCapitalIndex(0);
    setKingIndex(0);
    setJoseonStep('name');
    setSongLineIndex(0);
    setBookLineIndex(0);
    setInputVal('');
    setIsCompleted(false);
    setIsTimerRunning(false);
    setShowAnswerHint(false);
    bufferedCharsRef.current = 0;
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

  // Expected answer calculation
  const currentExpectedAnswer = useMemo(() => {
    if (activeTab === 'capitals') {
      return currentCapital.capital.trim();
    } else if (activeTab === 'joseon') {
      if (joseonStep === 'name') {
        return currentKing.name.trim();
      } else {
        return (currentKingDetailed.headline || currentKing.achievement).trim();
      }
    } else if (activeTab === 'book') {
      return (currentBookLine || '').trim();
    } else {
      return currentSongLine.trim();
    }
  }, [activeTab, joseonStep, currentCapital, currentKingDetailed, currentKing, currentBookLine, currentSongLine]);

  // Focus input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeTab, capitalIndex, kingIndex, songIndex, songLineIndex, bookIndex, bookLineIndex, isCompleted]);

  // Live Timer Interval
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setStats((prev) => {
          const newElapsed = prev.elapsedSeconds + 1;
          const minutes = newElapsed / 60;
          const currentCpm = minutes > 0 ? Math.round(bufferedCharsRef.current / minutes) : 0;
          return {
            ...prev,
            elapsedSeconds: newElapsed,
            cpm: currentCpm,
          };
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning]);

  // Format Elapsed Time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Helper for normalizing quotes and spaces
  const normalizeLyricsText = (s: string) =>
    (s || '')
      .replace(/[’‘`]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/…/g, '...')
      .replace(/\s+/g, ' ')
      .trim();

  // Typing Input Change Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);

    if (!isTimerRunning && val.length > 0) {
      setIsTimerRunning(true);
    }

    if (val.length === 0) return;

    const targetSub = currentExpectedAnswer.substring(0, val.length);
    const isMatch = val === targetSub;
    const strokes = countKeystrokes(val.slice(-1));
    bufferedCharsRef.current += strokes;

    const normVal = normalizeLyricsText(val);
    const normTarget = normalizeLyricsText(currentExpectedAnswer);

    if (isMatch || normVal === normTarget) {
      soundManager.play('pop');
      setStats((prev) => {
        const newCombo = prev.combo + 1;
        const newMax = Math.max(prev.maxCombo, newCombo);
        return {
          ...prev,
          combo: newCombo,
          maxCombo: newMax,
          correctCount: prev.correctCount + 1,
          totalKeystrokes: prev.totalKeystrokes + strokes,
        };
      });

      // Auto-submit if exact answer reached (or normalized match)
      if (val.trim() === currentExpectedAnswer.trim() || normVal === normTarget) {
        handleStepSuccess(val.trim());
        return;
      }
    } else {
      soundManager.play('error');
      setStats((prev) => ({
        ...prev,
        errorCount: prev.errorCount + 1,
        combo: 0,
        totalKeystrokes: prev.totalKeystrokes + strokes,
      }));
    }

    // In lyrics or book mode: when length reaches or exceeds target, auto-advance smoothly!
    if ((activeTab === 'lyrics' || activeTab === 'book') && val.length >= currentExpectedAnswer.length) {
      handleStepSuccess(val.trim());
    }
  };

  // On Enter Key Press: Never get stuck on lyrics or book!
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.length === 0) return;

      const normVal = normalizeLyricsText(inputVal);
      const normTarget = normalizeLyricsText(currentExpectedAnswer);

      if (activeTab === 'lyrics' || activeTab === 'book') {
        // In lyrics and book mode, pressing Enter ALWAYS advances to next line smoothly
        handleStepSuccess(inputVal.trim());
      } else {
        if (inputVal.trim() === currentExpectedAnswer.trim() || normVal === normTarget) {
          handleStepSuccess(inputVal.trim());
        } else {
          soundManager.play('error');
        }
      }
    }
  };

  // Step Success Handler
  const handleStepSuccess = (finalInput: string) => {
    soundManager.play('success');

    // ================= TAB 1: CAPITALS =================
    if (activeTab === 'capitals') {
      if (!conqueredCapitals.includes(currentCapital.id)) {
        const updated = [...conqueredCapitals, currentCapital.id];
        setConqueredCapitals(updated);
        localStorage.setItem('pangpang_conquered_capitals', JSON.stringify(updated));
      }

      // 문제당 +5P 적립 (세트를 끝까지 쳐야 지급)
      awardPoints(5, `🌍 ${currentCapital.country} 수도 정복!`);
      countSetItem('capitals', 5, capitalIndex + 1 >= WORLD_CAPITALS_DATA.length);

      setInputVal('');
      setShowAnswerHint(false);

      if (capitalIndex + 1 < WORLD_CAPITALS_DATA.length) {
        setCapitalIndex((prev) => prev + 1);
      } else {
        finishCourse('capitals');
      }
    }

    // ================= TAB 2: JOSEON =================
    else if (activeTab === 'joseon') {
      if (joseonStep === 'name') {
        // 1단계: 왕조 이름 완료 -> 2단계: 핵심지식으로 진행
        awardPoints(4, `👑 [1단계] ${currentKing.name} 왕조 이름 입력 완료!`);
        setJoseonStep('achievement');
        setInputVal('');
        setShowAnswerHint(false);
      } else {
        // 2단계: 핵심지식 완료 -> 다음 왕으로 이동
        awardPoints(8, `👑 [2단계] 조선 ${currentKing.order}대 ${currentKing.name} 핵심지식 정복!`);
        countSetItem('joseon', 8, kingIndex + 1 >= JOSEON_DETAILED_MAP.length);
        if (!conqueredKings.includes(currentKing.order)) {
          const updated = [...conqueredKings, currentKing.order];
          setConqueredKings(updated);
          localStorage.setItem('pangpang_conquered_kings', JSON.stringify(updated));
        }

        setJoseonStep('name');
        setInputVal('');
        setShowAnswerHint(false);

        if (kingIndex + 1 < JOSEON_DETAILED_MAP.length) {
          setKingIndex((prev) => prev + 1);
        } else {
          finishCourse('joseon');
        }
      }
    }

    // ================= TAB 3: LYRICS =================
    else if (activeTab === 'lyrics') {
      awardPoints(5, `🎵 가사 완필!`);
      setInputVal('');

      if (songLineIndex + 1 < currentSong.lines.length) {
        const nextLine = songLineIndex + 1;
        setSongLineIndex(nextLine);
      } else {
        finishCourse('lyrics');
      }
    }

    // ================= TAB 4: BOOK (감성 필사 책 모드) =================
    else if (activeTab === 'book') {
      awardPoints(10, `📖 '${currentBook.title}' 필사 완료!`);
      setInputVal('');

      if (bookLineIndex + 1 < currentBook.sentences.length) {
        setBookLineIndex((prev) => prev + 1);
      } else {
        if (!conqueredBooks.includes(currentBook.id)) {
          const updated = [...conqueredBooks, currentBook.id];
          setConqueredBooks(updated);
          localStorage.setItem('pangpang_conquered_books', JSON.stringify(updated));
        }
        finishCourse('book');
      }
    }
  };

  // Finish Course and Show Celebration
  const finishCourse = (tab: 'capitals' | 'joseon' | 'lyrics' | 'book') => {
    setIsTimerRunning(false);
    setIsCompleted(true);
    soundManager.play('fanfare');

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });

    const finishPoints = tab === 'lyrics' || tab === 'book' ? 150 : 100;
    const totalSetPoints = accumulatedSetPoints + finishPoints;
    setEarnedPoints(totalSetPoints);

    if (currentUser?.id) {
      addTypingPracticePoints(totalSetPoints, `지식타자 (${tab}) 1세트 완주 포인트`);
    }
    setBonusPointsAlert({ id: Date.now(), text: '🎉 1세트 완주! 누적 포인트 일괄 지급 완료!', points: totalSetPoints });
    setAccumulatedSetPoints(0);

    dailyMissionsManager.incrementProgress('lesson', 1, currentUser?.id);
    dailyMissionsManager.incrementProgress('chars', stats.totalKeystrokes || 100, currentUser?.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in relative pb-16">
      {/* Floating Bonus Points Toast (Moved to bottom-right so it NEVER overlaps text) */}
      {bonusPointsAlert && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-black px-4 py-2.5 rounded-full shadow-2xl border-2 border-white flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-100" />
          <span className="text-xs">{bonusPointsAlert.text}</span>
          <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs text-amber-950 font-extrabold">
            +{realPts(bonusPointsAlert.points)} P
          </span>
        </div>
      )}

      {/* TOP HEADER: TITLE & SUB-NAV TABS */}
      <div className="bg-white rounded-3xl p-5 border-2 border-purple-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectMode && onSelectMode('knowledge-hub')}
            className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>허브로</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-100 text-purple-700">
                지식 타자 스튜디오
              </span>
              <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                🪙 한 세트를 끝까지 쳐야 포인트 지급!
              </span>
              {(activeTab === 'capitals' || activeTab === 'joseon') && (
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300" data-testid="set-progress">
                  세트 {setDoneCount}/{SET_SIZE[activeTab]} · 완주하면 +{realPts(accumulatedSetPoints + SET_BONUS)}P
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2 mt-0.5">
              {activeTab === 'capitals' && (
                <>
                  <Globe className="w-6 h-6 text-emerald-600" />
                  <span>세계 수도 정복 (71개국 풀코스)</span>
                </>
              )}
              {activeTab === 'joseon' && (
                <>
                  <Crown className="w-6 h-6 text-indigo-600" />
                  <span>조선 왕조 27대 (태정태세문단세 & 핵심 지식)</span>
                </>
              )}
              {activeTab === 'lyrics' && (
                <>
                  <Music className="w-6 h-6 text-pink-600" />
                  <span>K-POP 명곡 가사 챌린지</span>
                </>
              )}
              {activeTab === 'book' && (
                <>
                  <BookOpen className="w-6 h-6 text-amber-700" />
                  <span>감성 필사 책 챌린지 (한국·세계 명문학)</span>
                </>
              )}
            </h1>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TAB: 세계 수도 정복 (대형 실물 국기 + 확대된 5대륙 탐험 보드) */}
      {/* ========================================================================= */}
      {activeTab === 'capitals' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT (8 cols): Large Country Showcase Card + Expanded Continent Board */}
            <div className="lg:col-span-8 space-y-4">
              {/* TOP SHOWCASE CARD: Navy Night-sky gradient card with Real Country Flag */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 text-white shadow-lg border border-indigo-900/50 relative overflow-hidden">
                {/* Background world map watermark */}
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-10 -translate-y-10">
                  <Globe className="w-96 h-96 text-white" />
                </div>

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                    🌍 {currentCapital.continent} 대륙
                  </span>
                  <span className="text-xs font-bold text-indigo-300">
                    정복 완료 {conqueredCapitals.length} / 71개국
                  </span>
                </div>

                {/* Country Flag & Info Container */}
                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                  {/* REAL COUNTRY FLAG (Never broken on any browser) */}
                  <div className="relative group">
                    <CountryFlag
                      countryName={currentCapital.country}
                      flagEmoji={currentCapital.flag}
                      size="hero"
                      className="rounded-2xl border-4 border-white/90 shadow-2xl"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="text-center sm:text-left space-y-1">
                    <div className="text-xs text-indigo-300 font-mono">
                      {currentCapital.englishCountry} ({currentCapital.englishCapital})
                    </div>
                    <h2 className="text-3xl font-black tracking-tight text-white flex items-center justify-center sm:justify-start gap-3">
                      <span>{currentCapital.country}</span>
                    </h2>
                    <p className="text-sm text-indigo-200/90 leading-relaxed font-medium max-w-md pt-1">
                      💡 {currentCapital.clue}
                    </p>
                  </div>
                </div>
              </div>

              {/* EXPANDED CONTINENT BOARD: 71 Countries with Real Flags */}
              <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-black text-gray-900 text-base">
                      세계 71개국 탐험 지도 (국기 보드)
                    </h3>
                  </div>

                  {/* Continent Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['전체', '아시아', '유럽', '아메리카', '아프리카', '오세아니아'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedContinent(c)}
                        className={`px-3 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                          selectedContinent === c
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country Flag Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredCapitals.map((c) => {
                    const isConquered = conqueredCapitals.includes(c.id);
                    const isCurrent = currentCapital.id === c.id;

                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          const idx = WORLD_CAPITALS_DATA.findIndex((it) => it.id === c.id);
                          if (idx >= 0) {
                            setCapitalIndex(idx);
                            setInputVal('');
                          }
                        }}
                        className={`group relative p-2 rounded-2xl flex flex-col items-center justify-center text-center transition cursor-pointer border ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300 shadow-md scale-105 z-10'
                            : isConquered
                            ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-50 border-gray-200 hover:border-emerald-300 hover:bg-white'
                        }`}
                      >
                        <CountryFlag
                          countryName={c.country}
                          flagEmoji={c.flag}
                          size="md"
                          className="rounded shadow-xs mb-1"
                        />
                        <span className="text-[11px] font-bold text-gray-800 truncate w-full">
                          {c.country}
                        </span>
                        {isConquered && (
                          <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[9px] shadow-xs">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT (4 cols): HUD + Quiz Card + Big Input */}
            <div className="lg:col-span-4 space-y-4">
              {/* 4-Stat Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-1">진행도</div>
                  <div className="text-2xl font-black text-blue-600">
                    {capitalIndex + 1}/71
                  </div>
                </div>
                <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-1">현재 타수</div>
                  <div className="text-2xl font-black text-blue-600">
                    {stats.cpm} <span className="text-xs font-bold">타/분</span>
                  </div>
                </div>
                <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-1">경과 시간</div>
                  <div className="text-2xl font-black text-blue-600">
                    ⏱ {formatTime(stats.elapsedSeconds)}
                  </div>
                </div>
                <div className="bg-sky-50/80 border border-sky-100 rounded-2xl p-4 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-1">정확도</div>
                  <div className="text-2xl font-black text-blue-600">
                    {stats.accuracy}%
                  </div>
                </div>
              </div>

              {/* Mode Toggles */}
              <div className="flex gap-2">
                <button
                  onClick={() => setHideChosungMode(!hideChosungMode)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    hideChosungMode
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {hideChosungMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{hideChosungMode ? '초성 힌트 숨김' : '초성 힌트 켜짐'}</span>
                </button>
                <button
                  onClick={handleRestart}
                  className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="처음부터 다시 시작"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다시 시작</span>
                </button>
              </div>

              {/* QUIZ CARD */}
              <div className="bg-white rounded-3xl p-6 border-2 border-sky-300 shadow-sm space-y-5 text-center">
                <div>
                  <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                    수도 퀴즈
                  </span>
                  <h3 className="text-xl font-black text-gray-900 mt-2">
                    <span className="text-blue-600">{currentCapital.country}</span>의 수도는?
                  </h3>
                </div>

                {/* Chosung Hint Box */}
                <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-5 min-h-[90px] flex flex-col items-center justify-center">
                  {!hideChosungMode ? (
                    <div className="text-3xl font-black tracking-widest text-sky-700">
                      {getWordChosung(currentCapital.capital)}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-gray-400">초성 숨김 모드</div>
                  )}
                  {showAnswerHint && (
                    <div className="mt-2 text-sm font-black text-emerald-600 animate-fade-in">
                      정답: {currentCapital.capital}
                    </div>
                  )}
                </div>

                {/* Big Input */}
                <div className="space-y-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="수도를 입력하세요..."
                    className="w-full text-center text-xl font-black py-4 px-6 rounded-2xl border-2 border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition bg-white shadow-inner"
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400 px-2">
                    <span>엔터(Enter)로 제출</span>
                    <button
                      type="button"
                      onClick={() => setShowAnswerHint(!showAnswerHint)}
                      className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{showAnswerHint ? '힌트 닫기' : '정답 보기'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAB: 조선 왕조 27대 (끊김없는 4단 S자 레일 + 이미지 완벽 일치 UI) */}
      {/* ========================================================================= */}
      {activeTab === 'joseon' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT (8 cols): Continuous 4-Row S-Train Rail Map */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 pb-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-600" />
                  <h3 className="font-black text-gray-900 text-base">
                    조선 왕조 500년 27대 족보 레일 맵
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    정복 완료 {conqueredKings.length}/27
                  </span>
                </div>
              </div>

              {/* CONTINUOUS 4-ROW S-TRAIN TRACK (Zero Broken Connectors!) */}
              <div className="relative py-2 px-2 space-y-12">
                {/* ROW 1: Kings 1 ~ 7 (태정태세문단세) -> Left to Right */}
                <div className="relative">
                  <div className="text-xs font-bold text-purple-600 mb-2 pl-2 tracking-widest">
                    태 정 태 세 문 단 세
                  </div>
                  {/* Straight Rail Line */}
                  <div className="absolute top-[52px] left-6 right-6 h-3 bg-purple-600 rounded-full z-0 shadow-inner" />
                  {/* Right U-Turn Curve: 7 -> 8 (Connecting Row 1 right to Row 2 right) */}
                  <div className="absolute top-[52px] right-6 w-14 h-28 border-t-[10px] border-r-[10px] border-b-[10px] border-purple-600 rounded-r-3xl z-0 pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-7 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((order) => {
                      const kingDetail = JOSEON_DETAILED_MAP[order - 1];
                      const isConquered = conqueredKings.includes(order);
                      const isCurrent = kingIndex === order - 1;

                      return (
                        <div key={order} className="flex flex-col items-center text-center">
                          <div className="h-6 flex items-center justify-center">
                            {isCurrent && <span className="text-2xl animate-bounce">🚋</span>}
                          </div>
                          <button
                            onClick={() => {
                              setKingIndex(order - 1);
                              setInputVal('');
                            }}
                            className={`relative w-12 h-12 rounded-full overflow-visible flex items-center justify-center font-black transition cursor-pointer shadow-sm ${
                              isConquered
                                ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                                : isCurrent
                                ? 'bg-purple-600 text-white ring-4 ring-purple-300 scale-105'
                                : 'bg-white text-purple-400 border-2 border-purple-200 text-xs font-bold'
                            }`}
                          >
                            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"><KingFace order={order} size={46} className="absolute left-1/2 top-[2px] -translate-x-1/2" /></span>

                            <span className={`absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black grid place-items-center border-2 border-white ${isConquered ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>

                              {isConquered ? '✓' : order}

                            </span>
                          </button>
                          <div className="mt-1.5 min-h-[34px]">
                            {isConquered || isCurrent ? (
                              <>
                                <div className="text-xs font-black text-gray-900">
                                  {hideNameMode && isCurrent ? '???' : kingDetail.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono scale-90 -mt-0.5">
                                  {kingDetail.reignYears}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs font-black text-gray-300">.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ROW 2: Kings 8 ~ 14 (예성연중인명선) -> Continuous Track from Right to Left! */}
                <div className="relative">
                  <div className="text-xs font-bold text-purple-600 mb-2 pr-2 text-right tracking-widest">
                    예 성 연 중 인 명 선
                  </div>
                  {/* Straight Rail Line */}
                  <div className="absolute top-[52px] left-6 right-6 h-3 bg-purple-600 rounded-full z-0 shadow-inner" />
                  {/* Left U-Turn Curve: 14 -> 15 (Connecting Row 2 left to Row 3 left) */}
                  <div className="absolute top-[52px] left-6 w-14 h-28 border-t-[10px] border-l-[10px] border-b-[10px] border-purple-600 rounded-l-3xl z-0 pointer-events-none" />

                  {/* Render 14, 13, 12, 11, 10, 9, 8 from left to right so 8 aligns at right curve! */}
                  <div className="relative z-10 grid grid-cols-7 gap-2">
                    {[14, 13, 12, 11, 10, 9, 8].map((order) => {
                      const kingDetail = JOSEON_DETAILED_MAP[order - 1];
                      const isConquered = conqueredKings.includes(order);
                      const isCurrent = kingIndex === order - 1;

                      return (
                        <div key={order} className="flex flex-col items-center text-center">
                          <div className="h-6 flex items-center justify-center">
                            {isCurrent && <span className="text-2xl animate-bounce">🚋</span>}
                          </div>
                          <button
                            onClick={() => {
                              setKingIndex(order - 1);
                              setInputVal('');
                            }}
                            className={`relative w-12 h-12 rounded-full overflow-visible flex items-center justify-center font-black transition cursor-pointer shadow-sm ${
                              isConquered
                                ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                                : isCurrent
                                ? 'bg-purple-600 text-white ring-4 ring-purple-300 scale-105'
                                : 'bg-white text-purple-400 border-2 border-purple-200 text-xs font-bold'
                            }`}
                          >
                            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"><KingFace order={order} size={46} className="absolute left-1/2 top-[2px] -translate-x-1/2" /></span>

                            <span className={`absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black grid place-items-center border-2 border-white ${isConquered ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>

                              {isConquered ? '✓' : order}

                            </span>
                          </button>
                          <div className="mt-1.5 min-h-[34px]">
                            {isConquered || isCurrent ? (
                              <>
                                <div className="text-xs font-black text-gray-900">
                                  {hideNameMode && isCurrent ? '???' : kingDetail.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono scale-90 -mt-0.5">
                                  {kingDetail.reignYears}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs font-black text-gray-300">.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ROW 3: Kings 15 ~ 21 (광인효현숙경영) -> Left to Right */}
                <div className="relative">
                  <div className="text-xs font-bold text-purple-600 mb-2 pl-2 tracking-widest">
                    광 인 효 현 숙 경 영
                  </div>
                  {/* Straight Rail Line */}
                  <div className="absolute top-[52px] left-6 right-6 h-3 bg-purple-600 rounded-full z-0 shadow-inner" />
                  {/* Right U-Turn Curve: 21 -> 22 (Connecting Row 3 right to Row 4 right) */}
                  <div className="absolute top-[52px] right-6 w-14 h-28 border-t-[10px] border-r-[10px] border-b-[10px] border-purple-600 rounded-r-3xl z-0 pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-7 gap-2">
                    {[15, 16, 17, 18, 19, 20, 21].map((order) => {
                      const kingDetail = JOSEON_DETAILED_MAP[order - 1];
                      const isConquered = conqueredKings.includes(order);
                      const isCurrent = kingIndex === order - 1;

                      return (
                        <div key={order} className="flex flex-col items-center text-center">
                          <div className="h-6 flex items-center justify-center">
                            {isCurrent && <span className="text-2xl animate-bounce">🚋</span>}
                          </div>
                          <button
                            onClick={() => {
                              setKingIndex(order - 1);
                              setInputVal('');
                            }}
                            className={`relative w-12 h-12 rounded-full overflow-visible flex items-center justify-center font-black transition cursor-pointer shadow-sm ${
                              isConquered
                                ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                                : isCurrent
                                ? 'bg-purple-600 text-white ring-4 ring-purple-300 scale-105'
                                : 'bg-white text-purple-400 border-2 border-purple-200 text-xs font-bold'
                            }`}
                          >
                            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"><KingFace order={order} size={46} className="absolute left-1/2 top-[2px] -translate-x-1/2" /></span>

                            <span className={`absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black grid place-items-center border-2 border-white ${isConquered ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>

                              {isConquered ? '✓' : order}

                            </span>
                          </button>
                          <div className="mt-1.5 min-h-[34px]">
                            {isConquered || isCurrent ? (
                              <>
                                <div className="text-xs font-black text-gray-900">
                                  {hideNameMode && isCurrent ? '???' : kingDetail.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono scale-90 -mt-0.5">
                                  {kingDetail.reignYears}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs font-black text-gray-300">.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ROW 4: Kings 22 ~ 27 (정순헌철고순) -> Right to Left */}
                <div className="relative">
                  <div className="text-xs font-bold text-purple-600 mb-2 pr-2 text-right tracking-widest">
                    정 순 헌 철 고 순
                  </div>
                  {/* Straight Rail Line */}
                  <div className="absolute top-[52px] left-6 right-6 h-3 bg-purple-600 rounded-full z-0 shadow-inner" />

                  <div className="relative z-10 grid grid-cols-7 gap-2">
                    {/* Render 27, 26, 25, 24, 23, 22 from left to right */}
                    {[27, 26, 25, 24, 23, 22].map((order) => {
                      const kingDetail = JOSEON_DETAILED_MAP[order - 1];
                      const isConquered = conqueredKings.includes(order);
                      const isCurrent = kingIndex === order - 1;

                      return (
                        <div key={order} className="flex flex-col items-center text-center">
                          <div className="h-6 flex items-center justify-center">
                            {isCurrent && <span className="text-2xl animate-bounce">🚋</span>}
                          </div>
                          <button
                            onClick={() => {
                              setKingIndex(order - 1);
                              setInputVal('');
                            }}
                            className={`relative w-12 h-12 rounded-full overflow-visible flex items-center justify-center font-black transition cursor-pointer shadow-sm ${
                              isConquered
                                ? 'bg-purple-600 text-white ring-2 ring-purple-200'
                                : isCurrent
                                ? 'bg-purple-600 text-white ring-4 ring-purple-300 scale-105'
                                : 'bg-white text-purple-400 border-2 border-purple-200 text-xs font-bold'
                            }`}
                          >
                            <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"><KingFace order={order} size={46} className="absolute left-1/2 top-[2px] -translate-x-1/2" /></span>

                            <span className={`absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black grid place-items-center border-2 border-white ${isConquered ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'}`}>

                              {isConquered ? '✓' : order}

                            </span>
                          </button>
                          <div className="mt-1.5 min-h-[34px]">
                            {isConquered || isCurrent ? (
                              <>
                                <div className="text-xs font-black text-gray-900">
                                  {hideNameMode && isCurrent ? '???' : kingDetail.name}
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono scale-90 -mt-0.5">
                                  {kingDetail.reignYears}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs font-black text-gray-300">.</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Empty cell for 7-column grid alignment */}
                    <div />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT (4 cols): HUD + DIRECT HEADLINE TYPING (Pixel-Perfect Match with User Image) */}
            <div className="lg:col-span-4 space-y-4">
              {/* 4-Stat Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-0.5">진행</div>
                  <div className="text-2xl font-black text-blue-600">
                    {kingIndex + 1}/27
                  </div>
                </div>
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-0.5">현재 타수</div>
                  <div className="text-2xl font-black text-blue-600">
                    {stats.cpm}
                  </div>
                </div>
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-0.5">시간</div>
                  <div className="text-xl font-black text-gray-900">
                    ⏱ {formatTime(stats.elapsedSeconds)}
                  </div>
                </div>
                <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3.5 text-center">
                  <div className="text-xs font-bold text-gray-500 mb-0.5">정확도</div>
                  <div className="text-xl font-black text-gray-900">
                    {stats.accuracy}%
                  </div>
                </div>
              </div>

              {/* Blue Pill: Memorization Mode Button */}
              <button
                onClick={() => setHideNameMode(!hideNameMode)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-sm transition cursor-pointer"
              >
                {hideNameMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{hideNameMode ? '암기 모드 켜짐 (이름 가림)' : '👁 암기 모드 (이름 숨김)'}</span>
              </button>

              {/* Target Prompt Card (Soft Sky Blue) */}
              <div className="bg-blue-50/70 rounded-3xl p-6 border-2 border-blue-200 text-center space-y-3 shadow-xs">
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    joseonStep === 'name'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white text-purple-600 border-purple-300'
                  }`}>
                    {joseonStep === 'name' ? '👑 1단계 진행 중' : '👑 1단계 완료'}
                  </span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                    joseonStep === 'achievement'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-blue-600 border-blue-300'
                  }`}>
                    {joseonStep === 'achievement' ? '📜 2단계 진행 중' : '📜 2단계 대기'}
                  </span>
                </div>

                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-[118px] h-[118px] rounded-full bg-gradient-to-b from-amber-100 to-amber-200 border-4 border-amber-400 shadow-md overflow-hidden grid place-items-end justify-center">
                      <KingFace order={currentKing.order} size={112} title={hideNameMode ? '조선 국왕' : `조선 ${currentKing.order}대 ${currentKing.name}`} />
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-700 text-white text-[11px] font-black border-2 border-white whitespace-nowrap">
                      {hideNameMode ? `${currentKing.order}대 ???` : `${currentKing.order}대 ${currentKing.name}`}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-bold text-blue-700 flex items-center justify-center gap-1">
                  <span>📍</span>
                  <span>
                    제{currentKing.order}대 국왕 · {currentKingDetailed.reignYears} 재위
                  </span>
                </div>

                {joseonStep === 'name' ? (
                  <div className="space-y-1.5 py-2">
                    <span className="text-xs font-black text-purple-600 tracking-wider">
                      [1단계: 왕조 이름 먼저 치기]
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-purple-900 leading-tight tracking-tight">
                      {hideNameMode ? '???' : currentKing.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      본명: {currentKing.birthName || currentKingDetailed.subdesc.split('.')[0]}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-1">
                    <span className="text-xs font-black text-blue-600 tracking-wider">
                      [2단계: 핵심 지식 치기]
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                      {currentKingDetailed.headline}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {currentKingDetailed.subdesc}
                    </p>
                  </div>
                )}
              </div>

              {/* Big Centered Input Box */}
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    joseonStep === 'name'
                      ? `1단계: 왕조 이름 입력 (예: ${currentKing.name})`
                      : '2단계: 위 핵심 지식 문장을 그대로 입력하세요'
                  }
                  className="w-full text-center text-lg font-bold py-4 px-6 rounded-2xl border-2 border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition bg-white shadow-inner placeholder-gray-400 text-gray-800"
                  autoFocus
                />
                <div className="flex items-center justify-between text-xs text-gray-400 px-2">
                  <span className="font-bold text-purple-600">
                    {joseonStep === 'name' ? '👑 왕조 이름 먼저 입력' : '📜 핵심 지식 입력'}
                  </span>
                  <span className="font-bold text-blue-600">
                    {inputVal.length} / {currentExpectedAnswer.length}자
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Reference Table: "📖 조선 왕조 27대 한눈에 보기" */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-xl font-black text-blue-600 flex items-center gap-2">
                <span>📖</span>
                <span>조선 왕조 27대 한눈에 보기</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                시작하기 전이나 완주한 뒤 복습할 때 참고하세요. 표의 순서가 그대로 코스의 진행 순서입니다 (태정태세문단세 · 예성연중인명선 · 광인효현숙경영 · 정순헌철고순).
              </p>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-xs">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">순서</th>
                    <th className="py-3 px-4 w-28 text-center">이름</th>
                    <th className="py-3 px-4 w-32 text-center">시기</th>
                    <th className="py-3 px-6">핵심 지식</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {JOSEON_DETAILED_MAP.map((item, idx) => {
                    const isConquered = conqueredKings.includes(item.order);
                    const isCurrent = kingIndex === idx;

                    return (
                      <tr
                        key={item.order}
                        onClick={() => {
                          setKingIndex(idx);
                          setInputVal('');
                        }}
                        className={`transition cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-50/70 font-semibold'
                            : isConquered
                            ? 'bg-purple-50/30 hover:bg-gray-50'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold text-gray-500">
                          {isConquered ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-[10px]">
                              ✓
                            </span>
                          ) : (
                            item.order
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-gray-900">
                          {item.name}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-gray-500">
                          {item.reignYears}
                        </td>
                        <td className="py-3 px-6 text-xs text-gray-700">
                          <span className="font-bold text-gray-900 mr-2">
                            {item.headline}
                          </span>
                          <span className="text-gray-500">{item.subdesc}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TAB: K-POP 명곡 가사 챌린지 */}
      {/* ========================================================================= */}
      {activeTab === 'lyrics' && (
        <div className="space-y-6">
          {/* Song Info Header Card (노래 듣기 제거된 깔끔한 가사 타자 헤더) */}
          <div className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
                {currentSong.albumEmoji}
              </div>
              <div>
                <div className="text-xs font-bold text-pink-200 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" />
                  <span>K-POP 명곡 감성 가사 타자</span>
                </div>
                <div className="text-lg font-black text-white flex items-center gap-2">
                  <span>{currentSong.title}</span>
                  <span className="text-xs font-normal text-pink-200">
                    - {currentSong.artist} ({currentSong.year})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-xs text-xs font-bold text-pink-100">
              <span>가사 진행 소절:</span>
              <span className="text-white font-black text-sm">{songLineIndex + 1}</span>
              <span className="text-pink-300">/</span>
              <span className="text-white/90">{currentSong.lines.length} 소절</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT (4 cols): Song Playlist Selector */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-5 border-2 border-pink-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <Music className="w-5 h-5 text-pink-600" />
                <h3 className="font-black text-gray-900 text-base">
                  명곡 플레이리스트 (10선)
                </h3>
              </div>

              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {LYRIC_SONGS_DATA.map((song, idx) => {
                  const isSelected = songIndex === idx;

                  return (
                    <button
                      key={song.id}
                      onClick={() => {
                        setSongIndex(idx);
                        setSongLineIndex(0);
                        setInputVal('');
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center gap-3 transition cursor-pointer border text-left ${
                        isSelected
                          ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-200 shadow-xs'
                          : 'bg-gray-50 border-gray-100 hover:bg-pink-50/40 hover:border-pink-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-xs flex-shrink-0">
                        {song.albumEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-gray-900 truncate">
                          {song.title}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {song.artist} ({song.year})
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT (8 cols): Lyrics Typing Karaoke Stage */}
            <div className="lg:col-span-8 space-y-4">
              {/* 4-Stat Box */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-pink-50/80 border border-pink-100 rounded-2xl p-3 text-center">
                  <div className="text-[11px] font-bold text-gray-500 mb-0.5">가사 진행</div>
                  <div className="text-xl font-black text-pink-600">
                    {songLineIndex + 1}/{currentSong.lines.length}
                  </div>
                </div>
                <div className="bg-pink-50/80 border border-pink-100 rounded-2xl p-3 text-center">
                  <div className="text-[11px] font-bold text-gray-500 mb-0.5">현재 타수</div>
                  <div className="text-xl font-black text-pink-600">
                    {stats.cpm} <span className="text-[10px] font-bold">CPM</span>
                  </div>
                </div>
                <div className="bg-pink-50/80 border border-pink-100 rounded-2xl p-3 text-center">
                  <div className="text-[11px] font-bold text-gray-500 mb-0.5">시간</div>
                  <div className="text-xl font-black text-pink-600">
                    ⏱ {formatTime(stats.elapsedSeconds)}
                  </div>
                </div>
                <div className="bg-pink-50/80 border border-pink-100 rounded-2xl p-3 text-center">
                  <div className="text-[11px] font-bold text-gray-500 mb-0.5">정확도</div>
                  <div className="text-xl font-black text-pink-600">
                    {stats.accuracy}%
                  </div>
                </div>
              </div>

              {/* KARAOKE LYRICS SCREEN */}
              <div className="bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl border border-pink-900/40 space-y-6">
                {/* Song Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-pink-500/30 text-pink-300 border border-pink-400/30">
                      {currentSong.genre}
                    </span>
                    <span className="text-xs text-gray-400">{currentSong.mood}</span>
                  </div>
                  <span className="text-xs text-pink-300 font-bold">
                    라인당 +5P 적립 🎶
                  </span>
                </div>

                {/* Lyrics Display Sequence */}
                <div className="space-y-3 py-2">
                  {/* Previous Line (Done) */}
                  {songLineIndex > 0 && (
                    <div className="text-sm text-gray-500 font-medium flex items-center gap-2 transition">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{currentSong.lines[songLineIndex - 1]}</span>
                    </div>
                  )}

                  {/* ACTIVE CURRENT LINE */}
                  <div className="bg-pink-500/10 border-2 border-pink-500/60 rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
                    <div className="text-xs text-pink-300 font-bold mb-1">
                      지금 부를 가사 ({songLineIndex + 1}/{currentSong.lines.length})
                    </div>
                    <div className="text-2xl md:text-3xl font-black tracking-tight text-white leading-relaxed">
                      {currentSongLine}
                    </div>
                  </div>

                  {/* Next Line Preview */}
                  {songLineIndex + 1 < currentSong.lines.length && (
                    <div className="text-sm text-gray-500 font-medium text-center italic pt-1">
                      다음 가사: {currentSong.lines[songLineIndex + 1]}
                    </div>
                  )}
                </div>

                {/* Big Input Box with Next Line Button */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="가사를 입력하세요 (엔터 또는 완성 시 다음 소절)..."
                      className="flex-1 text-center text-xl font-black py-4 px-4 sm:px-6 rounded-2xl border-2 border-pink-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none transition bg-white text-gray-900 shadow-xl"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleStepSuccess(inputVal || currentSongLine)}
                      className="px-4 sm:px-6 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:brightness-110 active:scale-95 text-white font-black text-sm whitespace-nowrap shadow-xl transition flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="다음 소절로 넘어가기 (Enter)"
                    >
                      <span>다음 소절</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 px-2">
                    <span>💡 소절 완성 후 엔터(Enter)를 치거나 [다음 소절] 버튼을 누르면 즉시 넘어갑니다!</span>
                    <span className="text-pink-400 font-bold">
                      {inputVal.length} / {currentSongLine.length}자
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. TAB: 감성 필사 책 모드 (Open Book 펼쳐진 양장본 필사 스튜디오) */}
      {/* ========================================================================= */}
      {activeTab === 'book' && (
        <div className="space-y-6">
          {/* Notice: Moved to 긴 글 연습 */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shrink-0">
                📚
              </div>
              <div>
                <h4 className="font-serif font-black text-amber-950 text-base">
                  감성 필사 책이 [긴 글 연습]으로 완벽 통합되었습니다!
                </h4>
                <p className="text-xs text-stone-600 mt-0.5">
                  한국 대표 시·소설·명언 20편 추천 작품과 양면 펼침 책 디자인(왼쪽 원문 감상, 오른쪽 실시간 필사)을 만나보세요.
                </p>
              </div>
            </div>
            {onSelectMode && (
              <button
                onClick={() => onSelectMode('long-practice')}
                className="px-5 py-2.5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-black text-xs shadow-md transition shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>긴 글 &amp; 감성 필사 20편 바로가기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Top Book Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {BOOK_CHALLENGE_LIST.map((b, idx) => {
              const isSelected = bookIndex === idx;
              const isFinished = conqueredBooks.includes(b.id);

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setBookIndex(idx);
                    setBookLineIndex(0);
                    setInputVal('');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-amber-800 text-white shadow-md scale-102 ring-2 ring-amber-400'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                  <span className="font-serif font-black">{b.title}</span>
                  <span className="text-[11px] opacity-75">· {b.author}</span>
                  {isFinished && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* OPEN BOOK HARDCOVER CONTAINER (https://www.hangul-tajawang.com/challenge style) */}
          <div className="bg-[#2B231D] p-3 sm:p-6 rounded-[2.5rem] shadow-2xl border-4 border-[#1A1410] relative">
            {/* Classic Red Ribbon Bookmark 🔖 */}
            <div className="absolute -top-1 right-24 w-8 h-20 bg-gradient-to-b from-red-700 to-red-800 shadow-lg rounded-b-md z-30 pointer-events-none border-t border-red-900 flex items-end justify-center pb-1 text-white/90 text-[10px] font-bold">
              🔖
            </div>

            {/* Inner Two-Page Open Book Spread */}
            <div className="bg-[#FDFBF7] rounded-3xl grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden border border-[#E7E0D3] shadow-inner min-h-[580px]">
              {/* Central Spine Fold Shadow (desktop) */}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 pointer-events-none hidden lg:block bg-gradient-to-r from-transparent via-black/8 to-transparent z-20" />

              {/* ================= LEFT PAGE: Book Header, Author & Full Poem Display ================= */}
              <div className="p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#E7E0D3] flex flex-col justify-between relative bg-gradient-to-br from-[#FAF7F0] to-[#FDFBF7]">
                <div>
                  <div className="flex items-center justify-between text-xs text-amber-900/60 mb-3 font-serif">
                    <span className="bg-amber-100/70 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      {currentBook.category}
                    </span>
                    <span>필사 챌린지</span>
                  </div>

                  <h2 className="font-serif text-3xl sm:text-4xl font-black text-stone-900 tracking-tight leading-tight">
                    {currentBook.title}
                  </h2>
                  <p className="font-serif text-sm text-stone-600 mt-1 font-medium">
                    저자: {currentBook.author}
                  </p>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    {currentBook.description}
                  </p>

                  {/* Poem Excerpt Preview Box */}
                  <div className="mt-6 pt-5 border-t border-stone-200/80 space-y-2.5 font-serif text-sm leading-relaxed max-h-[280px] overflow-y-auto pr-2 scrollbar-thin">
                    {currentBook.sentences.map((line, lIdx) => {
                      const isCurrent = lIdx === bookLineIndex;
                      const isPast = lIdx < bookLineIndex;

                      return (
                        <div
                          key={lIdx}
                          className={`transition-all duration-300 px-3 py-1.5 rounded-xl ${
                            isCurrent
                              ? 'bg-amber-100 text-stone-900 font-bold shadow-xs scale-101 border-l-4 border-amber-700'
                              : isPast
                              ? 'text-stone-400 line-through opacity-70'
                              : 'text-stone-600'
                          }`}
                        >
                          <span className="text-[11px] text-stone-400 mr-2 font-mono">
                            {lIdx + 1}
                          </span>
                          <span>{line}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Left Page Footer */}
                <div className="mt-6 pt-4 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-400 font-serif">
                  <span>책 모드 · 아날로그 감성 필사</span>
                  <span>- Left Page -</span>
                </div>
              </div>

              {/* ================= RIGHT PAGE: Manuscript / Ruled Note Typing Area ================= */}
              <div className="p-6 sm:p-10 flex flex-col justify-between relative bg-[#FCFAF5]">
                <div className="space-y-6">
                  {/* Realtime Stats Header on Book Page */}
                  <div className="grid grid-cols-4 gap-2 bg-[#F4EFE6] p-3 rounded-2xl border border-[#E3DC CE]">
                    <div className="text-center">
                      <div className="text-[10px] text-stone-500 font-bold">진행도</div>
                      <div className="text-base font-black text-amber-900">
                        {bookLineIndex + 1}/{currentBook.sentences.length}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-stone-500 font-bold">타수</div>
                      <div className="text-base font-black text-amber-900">
                        {stats.cpm}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-stone-500 font-bold">정확도</div>
                      <div className="text-base font-black text-emerald-800">
                        {stats.accuracy}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-stone-500 font-bold">시간</div>
                      <div className="text-base font-black text-stone-800">
                        ⏱ {formatTime(stats.elapsedSeconds)}
                      </div>
                    </div>
                  </div>

                  {/* Target Sentence Card (Ruled Paper / Manuscript feel) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-stone-500">
                      <span className="font-serif font-bold text-amber-900 flex items-center gap-1.5">
                        <Feather className="w-3.5 h-3.5 text-amber-700" />
                        <span>필사할 문장 ({bookLineIndex + 1}행)</span>
                      </span>
                      <span className="text-[11px] font-mono">
                        글자 수: {currentBookLine.length}자
                      </span>
                    </div>

                    <div className="font-serif text-lg sm:text-xl font-black text-stone-900 leading-relaxed tracking-wide p-6 bg-[#FAF6EE] rounded-2xl border-2 border-[#E8E0D2] shadow-sm relative min-h-[90px] flex items-center">
                      <div className="flex flex-wrap">
                        {currentBookLine.split('').map((char, cIdx) => {
                          const userChar = inputVal[cIdx];
                          let colorClass = 'text-stone-800';

                          if (userChar !== undefined) {
                            colorClass =
                              userChar === char
                                ? 'text-emerald-700 bg-emerald-100/70 rounded-xs'
                                : 'text-rose-600 bg-rose-100/70 rounded-xs';
                          }

                          return (
                            <span key={cIdx} className={`${colorClass} transition-colors`}>
                              {char}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Typing Input */}
                  <div className="space-y-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputVal}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="위 명문장을 그대로 필사하세요..."
                      className="w-full text-center font-serif text-lg sm:text-xl font-bold py-4 px-6 rounded-2xl border-2 border-amber-600/80 focus:ring-4 focus:ring-amber-200 outline-none transition bg-white shadow-inner placeholder-stone-400 text-stone-900"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-xs text-stone-500 px-2">
                      <span>Enter 또는 문장 완성 시 다음 줄로 넘김</span>
                      <span className="font-bold text-amber-800">
                        {inputVal.length} / {currentBookLine.length}자
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Page Footer & Pagination Controls */}
                <div className="mt-6 pt-4 border-t border-stone-200/70 flex items-center justify-between text-xs text-stone-500 font-serif">
                  <button
                    onClick={() => {
                      if (bookLineIndex > 0) {
                        setBookLineIndex((prev) => prev - 1);
                        setInputVal('');
                      }
                    }}
                    disabled={bookLineIndex === 0}
                    className="hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                  >
                    ← 이전 문장
                  </button>
                  <span>
                    Page {bookLineIndex + 1} of {currentBook.sentences.length}
                  </span>
                  <button
                    onClick={() => {
                      if (bookLineIndex + 1 < currentBook.sentences.length) {
                        setBookLineIndex((prev) => prev + 1);
                        setInputVal('');
                      }
                    }}
                    className="hover:text-stone-900 cursor-pointer"
                  >
                    다음 문장 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COMPLETION MODAL */}
      {/* ======================================================== */}
      {setRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" data-testid="set-reward">
          <div className="bg-white rounded-3xl border-4 border-amber-300 max-w-sm w-full p-6 text-center space-y-3 shadow-2xl">
            <div className="text-5xl">🎉</div>
            <h3 className="text-xl font-black text-gray-900">1세트 완주!</h3>
            <p className="text-xs text-gray-500">{setRewardModal.label}를 끝까지 쳤어요. 모인 포인트를 지금 드려요!</p>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 font-black text-amber-700">
              🪙 +{realPts(setRewardModal.points)} P 지급 <span className="text-[11px] text-amber-600">(완주 보너스 포함)</span>
            </div>
            {!currentUser?.id && <p className="text-[11px] text-rose-500 font-bold">로그인하면 포인트가 저장돼요.</p>}
            <button
              type="button"
              onClick={() => {
                setSetRewardModal(null);
                setTimeout(() => inputRef.current?.focus(), 30);
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm cursor-pointer"
            >
              다음 세트 계속하기 ▶
            </button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border-2 border-amber-300 max-w-md w-full p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-full bg-amber-100 mx-auto flex items-center justify-center text-amber-600 mb-4 shadow-inner">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
              {activeTab === 'capitals'
                ? '세계 수도 71개국 완주!'
                : activeTab === 'joseon'
                ? '조선 27대 국왕 족보 & 핵심 지식 완주!'
                : activeTab === 'lyrics'
                ? 'K-POP 명곡 완곡 성공!'
                : `'${currentBook.title}' 감성 필사 완필!`}
            </span>

            <h3 className="text-2xl font-black text-gray-900 mt-2 mb-1">
              🎉 축하합니다! 완주 성공!
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              뛰어난 타자 실력과 멋진 지식으로 모든 과정을 완벽하게 정복했습니다.
            </p>

            {/* Score Badges */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                <div className="text-xs text-gray-500 font-bold">평균 타수</div>
                <div className="text-xl font-black text-blue-600">{stats.cpm} CPM</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100">
                <div className="text-xs text-gray-500 font-bold">평균 정확도</div>
                <div className="text-xl font-black text-emerald-600">{stats.accuracy}%</div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-6 flex items-center justify-center gap-2 text-amber-800 font-black text-sm">
              <span>🪙 특별 팡팡 포인트</span>
              <span className="text-amber-600 text-base">+{realPts(earnedPoints)} P 적립!</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleRestart}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md hover:brightness-110 cursor-pointer"
              >
                한 번 더 도전하기
              </button>
              <button
                onClick={() => onSelectMode && onSelectMode('knowledge-hub')}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 cursor-pointer"
              >
                지식 타자 허브로 이동
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
