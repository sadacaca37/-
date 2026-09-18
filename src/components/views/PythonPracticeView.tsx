import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Code2,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  Zap,
  Terminal,
  Layers
} from 'lucide-react';
import { PYTHON_LEVELS, PythonLevelConfig, PythonTypingItem } from '../../data/pythonTypingData';
import { TypingStats, UserSession, LeaderboardEntry, AppMode } from '../../types';
import { soundManager } from '../../utils/sound';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { recordPracticeHistory } from '../../utils/curriculumManager';
import { VirtualKeyboard } from '../VirtualKeyboard';
import { getKeyGuideForChar } from '../../utils/hangul';

interface PythonPracticeViewProps {
  currentUser: UserSession | null;
  onRecordScore?: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  onSelectMode?: (mode: AppMode) => void;
}

export const PythonPracticeView: React.FC<PythonPracticeViewProps> = ({
  currentUser,
  onRecordScore,
  onSelectMode,
}) => {
  // Load saved Python Level & XP from localStorage
  const storagePrefix = `pangpang_python_${currentUser?.id || 'guest'}`;

  const [userXp, setUserXp] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_xp`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [currentLevelNum, setCurrentLevelNum] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_level`);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(currentLevelNum);
  const [itemIndex, setItemIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');

  // Level Up Modal State
  const [levelUpModal, setLevelUpModal] = useState<{ isOpen: boolean; newLevel: number } | null>(null);

  // Live Stats
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
  const timerIntervalRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferedStrokesRef = useRef<number>(0);

  const activeLevelConfig = useMemo(() => {
    return PYTHON_LEVELS.find((l) => l.level === selectedLevelNum) || PYTHON_LEVELS[0];
  }, [selectedLevelNum]);

  const currentItem = useMemo(() => {
    return activeLevelConfig.items[itemIndex] || activeLevelConfig.items[0];
  }, [activeLevelConfig, itemIndex]);

  const nextItem = useMemo(() => {
    return activeLevelConfig.items[itemIndex + 1];
  }, [activeLevelConfig, itemIndex]);

  // Target key guide
  const targetGuide = useMemo(() => {
    if (!currentItem) return null;
    const targetChar = currentItem.code[inputVal.length];
    return targetChar ? getKeyGuideForChar(targetChar) : null;
  }, [currentItem, inputVal]);

  // Auto focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedLevelNum, itemIndex]);

  // Live timer for CPM
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
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Handle XP gain and Level Up check
  const addXp = (amount: number) => {
    const nextXp = userXp + amount;
    setUserXp(nextXp);
    localStorage.setItem(`${storagePrefix}_xp`, String(nextXp));

    // Check if new level unlocked
    const eligibleLevel = [...PYTHON_LEVELS].reverse().find((l) => nextXp >= l.unlockXp)?.level || 1;
    if (eligibleLevel > currentLevelNum) {
      setCurrentLevelNum(eligibleLevel);
      setSelectedLevelNum(eligibleLevel);
      localStorage.setItem(`${storagePrefix}_level`, String(eligibleLevel));
      setLevelUpModal({ isOpen: true, newLevel: eligibleLevel });
      soundManager.playVictory();
      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch {}
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!isTimerRunning && val.length > 0) {
      setIsTimerRunning(true);
    }

    const lastIdx = val.length - 1;
    if (lastIdx >= 0 && lastIdx < currentItem.code.length) {
      const isCharCorrect = val[lastIdx] === currentItem.code[lastIdx];
      bufferedStrokesRef.current += 1;

      if (isCharCorrect) {
        soundManager.playKeyClick(true);
        setStats((prev) => {
          const newCorrect = prev.correctCount + 1;
          const newTotal = prev.totalKeystrokes + 1;
          const newCombo = prev.combo + 1;
          const acc = Math.round((newCorrect / newTotal) * 100);
          return {
            ...prev,
            correctCount: newCorrect,
            totalKeystrokes: newTotal,
            combo: newCombo,
            maxCombo: Math.max(prev.maxCombo, newCombo),
            accuracy: acc,
          };
        });
      } else {
        soundManager.playError();
        setStats((prev) => {
          const newErrors = prev.errorCount + 1;
          const newTotal = prev.totalKeystrokes + 1;
          const acc = Math.round((prev.correctCount / newTotal) * 100);
          return {
            ...prev,
            errorCount: newErrors,
            totalKeystrokes: newTotal,
            combo: 0,
            accuracy: acc,
          };
        });
      }
    }

    setInputVal(val);

    // Auto complete when full text matches
    if (val === currentItem.code) {
      handleItemComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputVal.length > 0) {
      e.preventDefault();
      // Allow enter to advance if reasonably typed
      if (inputVal.trim() === currentItem.code.trim() || inputVal.length >= currentItem.code.length) {
        handleItemComplete();
      }
    }
  };

  const handleItemComplete = () => {
    soundManager.playSuccess();
    const xpReward = activeLevelConfig.type === 'word' ? 10 : 25;
    addXp(xpReward);

    // Missions progress
    if (bufferedStrokesRef.current > 0) {
      dailyMissionsManager.incrementProgress('chars', bufferedStrokesRef.current, currentUser?.id);
      bufferedStrokesRef.current = 0;
    }
    dailyMissionsManager.incrementProgress('lesson', 1, currentUser?.id);

    setInputVal('');

    // Advance to next item
    if (itemIndex + 1 < activeLevelConfig.items.length) {
      setItemIndex((prev) => prev + 1);
    } else {
      // Completed all items in current level set! Award set points at completion!
      const totalLevelPoints = activeLevelConfig.items.length * (activeLevelConfig.type === 'word' ? 10 : 25) + 50;
      addTypingPracticePoints(totalLevelPoints, `🐍 파이썬 Lv.${activeLevelConfig.level} 1세트 완주`);
      soundManager.playVictory();
      try {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } catch {}

      // If there is a next level, offer to advance
      if (selectedLevelNum < 5) {
        const nextLv = selectedLevelNum + 1;
        if (userXp >= (PYTHON_LEVELS.find((l) => l.level === nextLv)?.unlockXp || 0)) {
          setSelectedLevelNum(nextLv);
          setItemIndex(0);
        } else {
          setItemIndex(0);
        }
      } else {
        setItemIndex(0);
      }
    }
  };

  const nextLevelConfig = PYTHON_LEVELS.find((l) => l.level === currentLevelNum + 1);
  const xpCurrentTier = activeLevelConfig.unlockXp;
  const xpNextTier = nextLevelConfig ? nextLevelConfig.unlockXp : activeLevelConfig.unlockXp + 300;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((userXp - xpCurrentTier) / Math.max(1, xpNextTier - xpCurrentTier)) * 100))
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Toolbar with Python Brand */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 rounded-3xl p-4 sm:p-6 text-white border-2 border-sky-500/30 shadow-xl flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-500 to-yellow-400 flex items-center justify-center text-3xl shadow-lg border border-sky-400/40">
            🐍
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-yellow-400 text-slate-950 shadow-xs">
                지식 타자 코스
              </span>
              <span className="text-xs font-bold text-sky-300">
                파이썬(Python) 프로그래밍 레벨업
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight flex items-center gap-2">
              <span>파이썬 코딩 타자</span>
              <span className="text-xs font-mono font-bold text-yellow-300 bg-yellow-950/60 px-2 py-0.5 rounded-md border border-yellow-500/30">
                Lv.{currentLevelNum} {PYTHON_LEVELS.find((l) => l.level === currentLevelNum)?.title}
              </span>
            </h2>
          </div>
        </div>

        {/* XP & Level Status Bar */}
        <div className="flex flex-col items-end gap-1.5 relative z-10 min-w-[200px]">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-yellow-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-yellow-400" />
              <span>{userXp} XP</span>
            </span>
            {nextLevelConfig && (
              <span className="text-slate-400 text-[11px]">
                (다음 레벨까지 {Math.max(0, nextLevelConfig.unlockXp - userXp)} XP)
              </span>
            )}
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/80">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-blue-500 to-yellow-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Level Selector Pills (Lv.1 to Lv.5) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {PYTHON_LEVELS.map((lvl) => {
          const isUnlocked = userXp >= lvl.unlockXp;
          const isSelected = selectedLevelNum === lvl.level;

          return (
            <button
              key={lvl.level}
              type="button"
              disabled={!isUnlocked}
              onClick={() => {
                if (isUnlocked) {
                  setSelectedLevelNum(lvl.level);
                  setItemIndex(0);
                  setInputVal('');
                  soundManager.play('click');
                }
              }}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-start gap-1 text-left relative overflow-hidden cursor-pointer ${
                isSelected
                  ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-300'
                  : isUnlocked
                  ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  : 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  Lv.{lvl.level} {lvl.badge}
                </span>
                {!isUnlocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
              </div>

              <div className="font-black text-xs text-slate-800 mt-1 truncate w-full">
                {lvl.title}
              </div>
              <div className="text-[10px] text-slate-500 truncate w-full">
                {lvl.type === 'word' ? '단어 중심' : '실전 문장'}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Interactive Code Editor Typing Stage */}
      <div className="bg-slate-950 rounded-3xl p-5 sm:p-7 border-2 border-slate-800 shadow-2xl relative overflow-hidden space-y-4">
        {/* Editor Window Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-mono font-bold text-slate-400 ml-2">
              main.py · {activeLevelConfig.title} ({itemIndex + 1}/{activeLevelConfig.items.length})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              {stats.cpm} <span className="text-[10px]">CPM</span>
            </span>
            <span className="text-emerald-400 font-bold">{stats.accuracy}%</span>
            <span className="text-rose-400 font-bold">🔥 {stats.combo}</span>
          </div>
        </div>

        {/* Code Explanation Banner */}
        <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="text-slate-300 font-medium">
              💡 {currentItem.explanation}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500 shrink-0">
            {currentItem.category === 'keyword'
              ? '예약어 단어'
              : currentItem.category === 'function'
              ? '내장 함수 단어'
              : '파이썬 코드 문장'}
          </span>
        </div>

        {/* Active Code Display (Syntax Highlighting Aesthetic) */}
        <div className="bg-black/60 rounded-2xl p-6 sm:p-8 border border-slate-800/80 relative min-h-[140px] flex flex-col justify-center">
          <div className="text-xs font-mono text-slate-500 mb-2 select-none">
            &gt;&gt;&gt; # 아래 파이썬 코드를 정확하게 타이핑하세요
          </div>

          <div className="text-xl sm:text-3xl font-mono font-black tracking-normal leading-relaxed break-all">
            {currentItem.code.split('').map((char, idx) => {
              const isTyped = idx < inputVal.length;
              const isCurrent = idx === inputVal.length;
              const isCorrect = isTyped && inputVal[idx] === char;
              const isError = isTyped && inputVal[idx] !== char;

              let charClass = 'text-slate-400 border-b-2 border-transparent';
              if (isCorrect) {
                charClass = 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/40 rounded-xs';
              } else if (isError) {
                charClass = 'text-rose-400 border-b-2 border-rose-500 bg-rose-950/60 rounded-xs';
              } else if (isCurrent) {
                charClass = 'text-yellow-300 border-b-2 border-yellow-400 bg-yellow-500/20 rounded-xs animate-pulse';
              }

              return (
                <span key={idx} className={`${charClass} inline-block px-0.5 transition-colors`}>
                  {char === ' ' ? '\u00A0' : char}
                </span>
              );
            })}
          </div>

          {/* Transparent Input Box */}
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 w-full h-full opacity-0 cursor-text"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* Next Code Item Preview & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="text-slate-500 font-mono">
            {nextItem ? (
              <span>다음: <code className="text-slate-300 font-bold">{nextItem.code}</code></span>
            ) : (
              <span className="text-yellow-400 font-bold">🎉 마지막 항목입니다!</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                inputRef.current?.focus();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>다시 쓰기</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (itemIndex + 1 < activeLevelConfig.items.length) {
                  setItemIndex((prev) => prev + 1);
                  setInputVal('');
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-md"
            >
              <span>건너뛰기</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Keyboard Guide */}
      <VirtualKeyboard
        activeKey={targetGuide?.code || null}
        lastFingerUsed={targetGuide?.fingerName || ''}
        isCorrect={null}
      />

      {/* 5. LEVEL UP CELEBRATION MODAL */}
      {levelUpModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-slate-900 border-4 border-yellow-400 rounded-3xl max-w-sm w-full p-6 sm:p-7 text-center space-y-4 shadow-2xl relative text-white">
            <div className="w-20 h-20 rounded-3xl bg-yellow-400/20 text-yellow-300 mx-auto flex items-center justify-center text-4xl shadow-inner border-2 border-yellow-400 animate-bounce">
              🌟
            </div>

            <div className="space-y-1">
              <span className="text-xs font-black text-yellow-950 bg-yellow-400 px-3 py-1 rounded-full font-mono">
                LEVEL UP! 🚀
              </span>
              <h3 className="text-2xl font-black text-white mt-2">
                Lv.{levelUpModal.newLevel} 달성!
              </h3>
              <p className="text-xs text-slate-300">
                {PYTHON_LEVELS.find((l) => l.level === levelUpModal.newLevel)?.title}
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {PYTHON_LEVELS.find((l) => l.level === levelUpModal.newLevel)?.description}
            </p>

            <button
              type="button"
              onClick={() => setLevelUpModal(null)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-lg hover:brightness-105 transition cursor-pointer"
            >
              새로운 레벨 도전하기!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
