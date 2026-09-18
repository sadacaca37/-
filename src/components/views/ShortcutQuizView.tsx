import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { SHORTCUT_QUIZ_DATA } from '../../data/practiceData';
import { soundManager } from '../../utils/sound';
import { UserSession, LeaderboardEntry, ShortcutQuizItem } from '../../types';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { 
  Zap, 
  CheckCircle2, 
  RotateCcw, 
  Award, 
  Sparkles, 
  HelpCircle, 
  Flame, 
  Keyboard, 
  Lightbulb,
  ArrowRight,
  Lock,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ShortcutQuizViewProps {
  currentUser: UserSession | null;
  onRecordScore: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  onBack?: () => void;
}

export const ShortcutQuizView: React.FC<ShortcutQuizViewProps> = ({
  currentUser,
  onRecordScore,
  onBack,
}) => {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard combination detection
  const [pressedCombo, setPressedCombo] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentQuiz: ShortcutQuizItem = SHORTCUT_QUIZ_DATA[questionIndex] || SHORTCUT_QUIZ_DATA[0];

  // Auto-focus container to listen to keyboard events
  useEffect(() => {
    containerRef.current?.focus();
  }, [questionIndex, isQuizComplete]);

  // Handle physical key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isQuizComplete || isCorrect === true) return;

    // Prevent default browser shortcuts (like Ctrl+S, Ctrl+P, Ctrl+F, Ctrl+A, Ctrl+Z, etc.) inside quiz
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.startsWith('F')) {
      e.preventDefault();
    }

    const currentPressed: string[] = [];
    if (e.ctrlKey) currentPressed.push('Ctrl');
    if (e.metaKey) currentPressed.push('Command');
    if (e.altKey) currentPressed.push('Alt');
    if (e.shiftKey) currentPressed.push('Shift');

    // Extract main key
    let mainKey = e.key;
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(mainKey)) {
      if (mainKey === ' ') mainKey = 'Space';
      else if (mainKey.length === 1) mainKey = mainKey.toUpperCase();
      currentPressed.push(mainKey);
    }

    setPressedCombo(currentPressed);

    // Check if the current pressed combination matches the target keys
    // target keys format: e.g. ["Ctrl", "C"] or ["Ctrl", "Shift", "T"] or ["Win", "V"] or ["F2"]
    if (currentPressed.length > 0 && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      const requiredKeys = currentQuiz.keys.map((k) => k.toLowerCase());
      const pressedKeysLower = currentPressed.map((k) => {
        if (k.toLowerCase() === 'command' || k.toLowerCase() === 'cmd' || k.toLowerCase() === 'win') return 'ctrl';
        return k.toLowerCase();
      });

      // Flexible check: Ctrl vs Command / Meta
      const matchesAll = requiredKeys.every((rk) => {
        if (rk === 'ctrl' || rk === 'command' || rk === 'cmd' || rk === 'win') {
          return pressedKeysLower.includes('ctrl') || pressedKeysLower.includes('command') || pressedKeysLower.includes('win');
        }
        return pressedKeysLower.includes(rk);
      });

      const sameLength = Math.abs(requiredKeys.length - pressedKeysLower.length) <= 0;

      if (matchesAll && sameLength) {
        // CORRECT ANSWER BY TYPING!
        setIsCorrect(true);
        soundManager.playSuccess();
        const points = 120 + streak * 30;
        setScore((prev) => prev + points);
        setStreak((prev) => {
          const next = prev + 1;
          setMaxStreak((m) => Math.max(m, next));
          return next;
        });

        // Delay to show green feedback, then advance to next question
        setTimeout(() => {
          advanceToNext();
        }, 900);
      } else {
        // INCORRECT KEY PRESSED -> Provide hint automatically
        setIsCorrect(false);
        soundManager.playError();
        soundManager.playHint();
        setShowHint(true);
        setHintMessage(`💡 힌트: '${currentQuiz.keysDisplay}' 키를 동시에 눌러보세요! (${currentQuiz.hint || currentQuiz.description})`);
        setStreak(0);

        setTimeout(() => {
          setIsCorrect(null);
        }, 1200);
      }
    }
  };

  const advanceToNext = () => {
    setPressedCombo([]);
    setIsCorrect(null);
    setShowHint(false);
    setHintMessage(null);

    if (questionIndex + 1 < SHORTCUT_QUIZ_DATA.length) {
      setQuestionIndex((prev) => prev + 1);
    } else {
      setIsQuizComplete(true);
      soundManager.playVictory();
      addTypingPracticePoints(50, '단축키 퀴즈 정복');
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}

      if (currentUser) {
        onRecordScore({
          userName: currentUser.name,
          userAvatar: currentUser.avatar || '⚡',
          mode: 'shortcut-quiz',
          modeTitle: '단축키 퀴즈 (키보드 실전 타이핑)',
          score: score,
          cpm: 0,
          accuracy: Math.round((score / (SHORTCUT_QUIZ_DATA.length * 120)) * 100),
          details: `${SHORTCUT_QUIZ_DATA.length}문제 정복 (최고 ${maxStreak}연속)`,
        });
      }
    }
  };

  const handleRestart = () => {
    setQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setPressedCombo([]);
    setIsCorrect(null);
    setShowHint(false);
    setHintMessage(null);
    setIsQuizComplete(false);
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 p-2 sm:p-4 overflow-y-auto flex flex-col space-y-3 outline-hidden select-none animate-in fade-in'
          : 'space-y-5 animate-in fade-in duration-300 max-w-3xl mx-auto outline-hidden select-none'
      }
    >
      {/* Top Navigation & Controls Bar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border-2 border-amber-300 shadow-sm">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={() => {
                soundManager.play('click');
                if (isFullscreen) setIsFullscreen(false);
                onBack();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" />
              <span>미니게임 목록</span>
            </button>
          )}

          <span className="font-arcade font-black text-sm text-slate-800 flex items-center gap-1.5">
            <span>⚡</span>
            <span>단축키 퀴즈</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.play('pop');
              setIsFullscreen(!isFullscreen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? '창 복원' : '전체보기 전환'}</span>
          </button>
        </div>
      </div>

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-3xl border-4 border-amber-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 arcade-card-glow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 border-2 border-amber-300 flex items-center justify-center shadow-xs">
            <Keyboard className="w-6 h-6 animate-pulse text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200">
                키보드 직접 타이핑 모드
              </span>
              {!currentUser && (
                <span className="text-[10px] font-bold text-slate-400">
                  (비로그인 자유 플레이)
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-arcade mt-0.5">
              실무 단축키 마스터 퀴즈
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="bg-amber-50 border-2 border-amber-300 px-3.5 py-1.5 rounded-2xl font-mono text-xs font-black text-amber-900 shadow-2xs">
            점수: <span className="text-amber-600 font-extrabold">{score}</span>점
          </div>
          <div className="bg-orange-50 border-2 border-orange-300 px-3.5 py-1.5 rounded-2xl font-mono text-xs font-black text-orange-800 shadow-2xs flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>{streak}연속</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Quiz Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-4 border-amber-200 shadow-xl relative overflow-hidden arcade-card-glow">
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6 border border-slate-200">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${((questionIndex + 1) / SHORTCUT_QUIZ_DATA.length) * 100}%` }}
          ></div>
        </div>

        {!isQuizComplete ? (
          <div className="space-y-6">
            {/* Category & Step Banner */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 font-black border border-amber-300">
                {currentQuiz.category}
              </span>
              <span>
                문제 <strong className="text-amber-700 text-sm font-black">{questionIndex + 1}</strong> / {SHORTCUT_QUIZ_DATA.length}
              </span>
            </div>

            {/* Question Text Prompt */}
            <div className="py-8 px-6 bg-gradient-to-b from-amber-50/70 to-orange-50/40 rounded-3xl border-2 border-amber-200/90 text-center space-y-2.5">
              <div className="text-xs font-extrabold text-amber-600 flex items-center justify-center gap-1">
                <span>🎯 단축키를 키보드로 직접 눌러보세요!</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug font-arcade">
                "{currentQuiz.question}"
              </h3>
              <p className="text-sm text-slate-600 font-medium max-w-lg mx-auto">
                {currentQuiz.description}
              </p>
            </div>

            {/* Live Key Detection Pad */}
            <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-3 min-h-36">
              <span className="text-xs font-bold text-slate-400">
                현재 누른 키 조합:
              </span>

              <div className="flex items-center gap-2 flex-wrap justify-center min-h-12">
                {pressedCombo.length > 0 ? (
                  pressedCombo.map((key, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-slate-400 font-black">+</span>}
                      <span className="px-4 py-2 bg-white text-slate-800 font-black text-lg sm:text-xl rounded-xl border-2 border-slate-300 shadow-md transform scale-105 animate-in zoom-in-90 font-mono">
                        {key}
                      </span>
                    </React.Fragment>
                  ))
                ) : (
                  <span className="text-sm font-bold text-slate-400 animate-pulse flex items-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    키보드에서 알맞은 단축키를 눌러보세요!
                  </span>
                )}
              </div>

              {/* Correct / Incorrect Live Feedback Indicator */}
              {isCorrect === true && (
                <div className="flex items-center gap-1.5 text-emerald-600 font-black text-sm bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-300 animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>🎉 정답입니다! 다음 문제로 이동합니다.</span>
                </div>
              )}

              {isCorrect === false && (
                <div className="flex items-center gap-1.5 text-rose-600 font-black text-sm bg-rose-50 px-4 py-1.5 rounded-full border border-rose-300 animate-shake">
                  <span>❌ 틀렸습니다! 아래 힌트를 확인하고 다시 눌러보세요.</span>
                </div>
              )}
            </div>

            {/* Hint Box (Shows automatically on error, or when clicked) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowHint((prev) => !prev);
                    soundManager.playHint();
                  }}
                  className="text-xs font-black text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors flex items-center gap-1.5"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showHint ? '힌트 접기' : '💡 정답 힌트 보기'}</span>
                </button>

                <span className="text-[11px] text-slate-400 font-medium">
                  단축키를 틀리면 자동으로 친절한 힌트가 나타납니다.
                </span>
              </div>

              {showHint && (
                <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in slide-in-from-top-2">
                  <span className="text-base">💡</span>
                  <div className="space-y-1">
                    <p className="font-extrabold text-amber-950">
                      정답 단축키: <span className="bg-amber-200 px-2 py-0.5 rounded-md font-mono text-amber-950 font-black">[{currentQuiz.keysDisplay}]</span>
                    </p>
                    <p className="text-amber-800 font-medium">
                      {currentQuiz.hint || currentQuiz.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Finished Quiz Screen */
          <div className="text-center py-8 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 border-2 border-amber-300 shadow-md">
              <Award className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-arcade">
                🎉 단축키 마스터 퀴즈 정복!
              </h3>
              <p className="text-sm text-slate-600">
                총 점수: <strong className="text-amber-600 font-black">{score} 점</strong> | 최고 연속: <strong className="text-orange-500 font-black">{maxStreak} 회</strong>
              </p>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-6 py-3 rounded-2xl arcade-btn-yellow text-amber-950 font-black text-sm shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>다시 도전하기</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
