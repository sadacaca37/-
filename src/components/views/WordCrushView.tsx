import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { WORD_CRUSH_LEVELS, WordCrushLevel, CrushWordBlock } from '../../data/practiceData';
import { soundManager } from '../../utils/sound';
import { UserSession, LeaderboardEntry } from '../../types';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { CharacterAvatar, DEFAULT_AVATAR_CONFIG } from '../CharacterAvatar';
import { 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  Flame, 
  Star, 
  ChevronRight, 
  Award,
  Zap,
  Volume2,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface WordCrushViewProps {
  currentUser: UserSession | null;
  onRecordScore: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  onBack?: () => void;
}

export const WordCrushView: React.FC<WordCrushViewProps> = ({
  currentUser,
  onRecordScore,
  onBack,
}) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const currentLevel: WordCrushLevel = WORD_CRUSH_LEVELS[currentLevelIdx] || WORD_CRUSH_LEVELS[0];
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [blocks, setBlocks] = useState<CrushWordBlock[]>(() =>
    currentLevel.blocks.map((b, i) => ({
      ...b,
      id: `block_${currentLevel.level}_${i}_${b.word}`,
      isCrushed: false,
    }))
  );

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(currentLevel.timeLimit);
  const [inputVal, setInputVal] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelCleared, setIsLevelCleared] = useState(false);
  const [crushedCount, setCrushedCount] = useState(0);
  const [explodingBlockId, setExplodingBlockId] = useState<string | null>(null);
  const [lastCrushedInfo, setLastCrushedInfo] = useState<{ word: string; score: number; combo: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Sync Level change
  useEffect(() => {
    setBlocks(
      currentLevel.blocks.map((b, i) => ({
        ...b,
        id: `block_${currentLevel.level}_${i}_${b.word}`,
        isCrushed: false,
      }))
    );
    setTimeLeft(currentLevel.timeLimit);
    setIsGameOver(false);
    setIsLevelCleared(false);
    setInputVal('');
    setCombo(0);
    setCrushedCount(0);
    setLastCrushedInfo(null);
    inputRef.current?.focus();
  }, [currentLevelIdx]);

  // Main countdown timer
  useEffect(() => {
    if (isGameOver || isLevelCleared) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          soundManager.playError();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameOver, isLevelCleared]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const trimmed = val.trim();

    if (!trimmed) {
      setInputVal(val);
      return;
    }

    // Find if typed word matches any uncrushed block
    const targetIdx = blocks.findIndex((b) => !b.isCrushed && b.word === trimmed);

    if (targetIdx !== -1) {
      // DYNAMIC CANDY CRUSH BLAST ON THE TARGET BLOCK
      const targetBlock = blocks[targetIdx];
      setExplodingBlockId(targetBlock.id);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      setMaxCombo((prev) => Math.max(prev, nextCombo));

      const comboBonus = nextCombo * 50;
      const earned = targetBlock.score + comboBonus;
      setScore((prev) => prev + earned);
      setCrushedCount((prev) => prev + 1);

      // Save toast info into separate non-obstructing HUD toast
      setLastCrushedInfo({
        word: targetBlock.word,
        score: earned,
        combo: nextCombo,
      });

      // Play synthesized candy blast explosion sound
      soundManager.playCandyBlast();

      if (nextCombo >= 3) {
        soundManager.playCombo(nextCombo);
      }

      setInputVal('');

      // Mark crushed after pop animation
      setTimeout(() => {
        setBlocks((prev) => {
          const updated = prev.map((b) => (b.id === targetBlock.id ? { ...b, isCrushed: true } : b));
          const remaining = updated.filter((b) => !b.isCrushed);
          if (remaining.length === 0) {
            // Level cleared!
            setIsLevelCleared(true);
            soundManager.playVictory();
            addTypingPracticePoints(60, `워드 크러시 Lv.${currentLevel.level} 클리어`);
            try {
              confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.5 },
              });
            } catch {}

            if (currentUser) {
              onRecordScore({
                userName: currentUser.name,
                userAvatar: currentUser.avatar || '👑',
                mode: 'sentence', // leaderboard
                modeTitle: `워드 크러시 (${currentLevel.title})`,
                score: score + earned + timeLeft * 10,
                cpm: Math.round(((blocks.length * 3) / Math.max(1, currentLevel.timeLimit - timeLeft)) * 60),
                accuracy: 100,
                details: `Lv.${currentLevel.level} 클리어 (최대 ${nextCombo} 콤보)`,
              });
            }
          }
          return updated;
        });
        setExplodingBlockId(null);
      }, 150);
      return;
    }

    // Check maximum word length of remaining active blocks
    const activeBlocks = blocks.filter((b) => !b.isCrushed);
    const maxActiveLen = activeBlocks.length > 0 ? Math.max(...activeBlocks.map((b) => b.word.length)) : 6;

    if (val.length > maxActiveLen) {
      soundManager.playError();
      setInputVal('');
      return;
    }

    setInputVal(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      const match = blocks.some((b) => !b.isCrushed && b.word === trimmed);
      if (!match && trimmed.length > 0) {
        soundManager.playError();
        setCombo(0);
      }
      setInputVal('');
    }
  };

  const handleRestart = () => {
    setBlocks(
      currentLevel.blocks.map((b, i) => ({
        ...b,
        id: `block_${currentLevel.level}_${i}_${b.word}`,
        isCrushed: false,
      }))
    );
    setTimeLeft(currentLevel.timeLimit);
    setIsGameOver(false);
    setIsLevelCleared(false);
    setInputVal('');
    setCombo(0);
    setCrushedCount(0);
    setLastCrushedInfo(null);
    inputRef.current?.focus();
  };

  const handleNextLevel = () => {
    if (currentLevelIdx + 1 < WORD_CRUSH_LEVELS.length) {
      setCurrentLevelIdx((prev) => prev + 1);
    }
  };

  const getJellyStyle = (color: CrushWordBlock['color']) => {
    switch (color) {
      case 'red':
        return 'bg-gradient-to-b from-rose-500 to-pink-600 text-white border-2 border-rose-200 shadow-[0_4px_0_#be123c]';
      case 'blue':
        return 'bg-gradient-to-b from-sky-500 to-indigo-600 text-white border-2 border-sky-200 shadow-[0_4px_0_#1d4ed8]';
      case 'lime':
        return 'bg-gradient-to-b from-emerald-500 to-teal-600 text-white border-2 border-emerald-200 shadow-[0_4px_0_#047857]';
      case 'amber':
        return 'bg-gradient-to-b from-amber-400 to-orange-500 text-white border-2 border-amber-200 shadow-[0_4px_0_#c2410c]';
      case 'purple':
      default:
        return 'bg-gradient-to-b from-purple-500 to-pink-600 text-white border-2 border-purple-200 shadow-[0_4px_0_#7e22ce]';
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 p-2 sm:p-4 overflow-y-auto flex flex-col space-y-3 animate-in fade-in'
          : 'space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto'
      }
    >
      {/* Top Navigation & Controls Bar */}
      <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border-2 border-pink-300 shadow-sm">
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
              <ArrowLeft className="w-3.5 h-3.5 text-pink-600" />
              <span>미니게임 목록</span>
            </button>
          )}

          <span className="font-arcade font-black text-sm text-slate-800 flex items-center gap-1.5">
            <span>🍬</span>
            <span>워드 크러시</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.play('pop');
              setIsFullscreen(!isFullscreen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? '창 복원' : '전체보기 전환'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-pink-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 arcade-card-glow">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-black border border-pink-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>캔디 크러시 스타일 젤리 타자</span>
            </span>
            {!currentUser && (
              <span className="text-[11px] font-bold text-slate-400">
                (비로그인 자유 플레이)
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 font-arcade">
            🍬 워드 크러시 (Word Crush 7x7)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            젤리 블록 안의 단어를 빠르게 타이핑하여 연속 콤보로 팡팡 터뜨리세요!
          </p>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex bg-pink-50 p-1 rounded-2xl border-2 border-pink-200">
            {WORD_CRUSH_LEVELS.map((lvl, idx) => (
              <button
                key={lvl.level}
                onClick={() => setCurrentLevelIdx(idx)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  currentLevelIdx === idx
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'text-pink-700 hover:bg-pink-100'
                }`}
              >
                Lv.{lvl.level}
              </button>
            ))}
          </div>

          <button
            onClick={handleRestart}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-pink-50 text-slate-600 hover:text-pink-600 border-2 border-slate-200 hover:border-pink-200 transition-all shadow-xs cursor-pointer"
            title="다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="bg-gradient-to-b from-purple-900 via-slate-900 to-indigo-950 rounded-3xl p-4 sm:p-6 border-4 border-pink-300 shadow-2xl relative select-none">
        {/* NON-OBSTRUCTING FLOATING COMBO & CRUSH NOTIFICATION BAR */}
        <div className="h-10 mb-2 flex items-center justify-center">
          {lastCrushedInfo && (
            <div className="animate-in zoom-in-90 fade-in duration-200 bg-white/95 px-4 py-1.5 rounded-full border-2 border-pink-400 shadow-lg flex items-center gap-2 text-xs font-black">
              <span className="text-pink-600">💥 [{lastCrushedInfo.word}] CRUSH!</span>
              <span className="bg-amber-400 text-amber-950 px-2 py-0.2 rounded-md font-mono">
                +{lastCrushedInfo.score}점
              </span>
              {lastCrushedInfo.combo >= 2 && (
                <span className="text-orange-500 flex items-center gap-0.5">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  {lastCrushedInfo.combo} 콤보!
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* ================= LEFT HUD (Avatar & Timer) ================= */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-4 select-none">
            {/* Level & Avatar Panel */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border-4 border-pink-200 shadow-md text-center space-y-2 relative overflow-hidden">
              <div className="bg-pink-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-inner inline-block border border-pink-300">
                Lv.{currentLevel.level} - {currentLevel.title}
              </div>

              {/* Character Avatar Display */}
              <div className="w-20 h-20 mx-auto rounded-2xl bg-pink-50 border-2 border-pink-200 shadow-inner flex items-center justify-center overflow-hidden">
                <CharacterAvatar
                  config={currentUser?.avatarConfig || DEFAULT_AVATAR_CONFIG}
                  size="md"
                  mood={combo >= 3 ? 'ecstatic' : isGameOver ? 'crying' : 'happy'}
                  animate={true}
                />
              </div>
              <p className="text-xs font-black text-slate-800">
                {currentUser?.name || '꼬마 게이머'}
              </p>
            </div>

            {/* Timer Panel */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border-4 border-sky-200 shadow-md text-center space-y-1">
              <div className="bg-sky-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-inner inline-block border border-sky-300">
                남은 시간
              </div>
              <div className="font-mono text-3xl font-black text-slate-800 tracking-wider">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* ================= CENTER CANDY STONE GRID (7x7 Matrix - Crystal Clear & Unobstructed!) ================= */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            <div className="bg-slate-950/90 p-3 sm:p-4 rounded-3xl border-4 border-purple-300 shadow-2xl w-full max-w-[500px] aspect-square flex flex-col justify-between relative overflow-hidden">
              <div className="grid grid-cols-7 grid-rows-7 gap-1.5 sm:gap-2 w-full h-full">
                {Array.from({ length: 49 }).map((_, idx) => {
                  const row = Math.floor(idx / 7);
                  const col = idx % 7;

                  // Find block at (row, col)
                  const block = blocks.find((b) => b.row === row && b.col === col);

                  if (block && !block.isCrushed) {
                    const isExploding = explodingBlockId === block.id;
                    const isPrefixMatch = Boolean(
                      inputVal.trim() && block.word.startsWith(inputVal.trim())
                    );

                    return (
                      <div
                        key={block.id}
                        className={`
                          rounded-xl sm:rounded-2xl 
                          flex items-center justify-center 
                          p-1 text-center 
                          font-black text-xs sm:text-sm md:text-base 
                          cursor-pointer select-none 
                          transition-all duration-150
                          ${getJellyStyle(block.color)}
                          ${
                            isExploding
                              ? 'scale-125 brightness-150 ring-4 ring-yellow-300 z-30 shadow-2xl animate-ping'
                              : isPrefixMatch
                              ? 'ring-4 ring-yellow-300 scale-105 brightness-125 z-20 shadow-lg animate-bounce'
                              : 'hover:scale-105'
                          }
                        `}
                      >
                        <span className="drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] tracking-tight leading-tight">
                          {block.word}
                        </span>
                      </div>
                    );
                  }

                  // Empty background tile
                  return (
                    <div
                      key={`tile-${row}-${col}`}
                      className="rounded-xl sm:rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/20"></div>
                    </div>
                  );
                })}
              </div>

              {/* Cleared Overlay Modal */}
              {isLevelCleared && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-in zoom-in-95">
                  <div className="w-16 h-16 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-3xl mb-3 shadow-lg animate-bounce">
                    🏆
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-amber-300 font-arcade">
                    STAGE CLEAR!
                  </h3>
                  <p className="text-xs text-slate-200 mt-1">
                    모든 젤리 단어를 팡팡 터뜨렸습니다!
                  </p>
                  <p className="font-mono text-xl font-extrabold text-white mt-2">
                    획득 점수: +{score.toLocaleString()}점
                  </p>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleRestart}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      다시 하기
                    </button>
                    {currentLevelIdx + 1 < WORD_CRUSH_LEVELS.length && (
                      <button
                        onClick={handleNextLevel}
                        className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>다음 레벨</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Game Over Overlay */}
              {isGameOver && !isLevelCleared && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-in zoom-in-95">
                  <div className="text-4xl mb-2">⏳</div>
                  <h3 className="text-2xl font-black text-rose-400 font-arcade">
                    시간 초과!
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    시간 내에 모든 블록을 터뜨리지 못했습니다.
                  </p>
                  <button
                    onClick={handleRestart}
                    className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>다시 도전하기</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT HUD (Score / Combo / Stats) ================= */}
          <div className="lg:col-span-3 flex flex-col justify-between gap-4 select-none">
            {/* Rank / Status Panel */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border-4 border-amber-200 shadow-md text-center space-y-2 flex-1">
              <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <Star className="w-5 h-5 fill-amber-400" />
                <Star className="w-4 h-4 fill-amber-400" />
              </div>
              <h4 className="font-black text-base text-slate-800 tracking-wider font-arcade">
                워드 크러시 랭킹
              </h4>
              <div className="border-t border-amber-100 pt-2 text-[11px] text-slate-600 leading-relaxed font-medium">
                {currentUser ? (
                  <p className="font-bold text-pink-600">
                    {currentUser.name} 님의 기록이 실시간 랭킹에 등록됩니다!
                  </p>
                ) : (
                  <p className="text-slate-400">비로그인 플레이 중 (로그인 시 랭킹 등록)</p>
                )}
              </div>
            </div>

            {/* Score & Dynamic Combo Box */}
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border-4 border-pink-200 shadow-md text-center space-y-3">
              <div>
                <div className="bg-pink-500 text-white text-xs font-black px-3 py-0.5 rounded-full inline-block border border-pink-300 shadow-inner">
                  획득 점수
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-black text-pink-600 mt-1">
                  {score.toLocaleString()}
                </div>
              </div>

              <div className="border-t border-pink-100 pt-2">
                <div className="flex items-center justify-center gap-1.5 text-orange-500 font-black text-sm">
                  <Flame className="w-5 h-5 fill-orange-500 text-orange-500 animate-bounce" />
                  <span className="text-base">{combo} COMBO</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  최대 콤보: {maxCombo}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM INPUT BAR ================= */}
        <div className="mt-4 bg-white/90 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border-4 border-pink-300 shadow-lg flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <input
              ref={inputRef}
              id="word-crush-input"
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isGameOver || isLevelCleared}
              placeholder="블록 안의 단어를 빠르게 입력하세요! (Space / Enter)"
              className="w-full text-center sm:text-left pl-4 pr-12 py-3 text-lg font-black rounded-xl border-2 border-pink-300 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-hidden bg-pink-50/50 text-slate-800 placeholder-slate-400 shadow-inner font-arcade"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
            {inputVal && (
              <span className="absolute right-3 top-3 px-2 py-0.5 bg-pink-200 text-pink-800 text-xs font-bold rounded-lg animate-pulse">
                입력 중
              </span>
            )}
          </div>

          <button
            onClick={() => {
              const trimmed = inputVal.trim();
              const match = blocks.some((b) => !b.isCrushed && b.word === trimmed);
              if (!match && trimmed.length > 0) {
                soundManager.playError();
                setCombo(0);
              }
              setInputVal('');
              inputRef.current?.focus();
            }}
            className="px-6 py-3 rounded-xl arcade-btn-pink text-white font-black text-sm shadow-md active:translate-y-0.5 transition-all uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <span>확인</span>
          </button>
        </div>
      </div>
    </div>
  );
};
