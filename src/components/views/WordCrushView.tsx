import React, { useState, useEffect, useRef } from 'react';
import { GAME_POINTS } from '../../utils/pointRules';
import confetti from 'canvas-confetti';
import { WORD_CRUSH_LEVELS, WordCrushLevel, CrushWordBlock } from '../../data/practiceData';
import { soundManager } from '../../utils/sound';
import { UserSession, LeaderboardEntry } from '../../types';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
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
            addTypingPracticePoints(GAME_POINTS, `워드 크러시 Lv.${currentLevel.level} 클리어`);
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
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#151126] p-2 sm:p-4 overflow-y-auto flex flex-col space-y-3 animate-in fade-in'
          : 'space-y-4 animate-in fade-in duration-300 max-w-4xl mx-auto'
      }
    >
      {/* Top Navigation & Controls Bar */}
      <div className="mg-topbar flex items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                if (isFullscreen) setIsFullscreen(false);
                onBack();
              }}
              className="tp-rpg-btn tp-rpg-btn--wood flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#ffe066]" />
              <span>미니게임 목록</span>
            </button>
          )}

          <span className="font-arcade font-black text-sm text-[#2c1507]">
            워드 크러쉬
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundManager.play('pop');
              setIsFullscreen(!isFullscreen);
            }}
            className="tp-rpg-btn tp-rpg-btn--gold flex items-center gap-1.5 px-3 py-1.5 text-xs font-black cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? '창 복원' : '전체보기 전환'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="mg-banner p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#6e3d18]">
            <span>보석 동굴 퍼즐 타자</span>
            {!currentUser && (
              <>
                <span aria-hidden="true">·</span>
                <span>비로그인 자유 플레이</span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#2c1507] tracking-tight mt-0.5 font-arcade">
            워드 크러쉬 (7×7)
          </h1>
          <p className="text-xs sm:text-sm text-[#5c3314] font-medium">
            동굴 속 반짝이는 보석 블록의 단어를 빠르게 입력해 연속 콤보로 터뜨려 보세요!
          </p>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <div className="flex bg-[#e8cfa0] p-1 rounded-xl border-2 border-[#5c3314]">
            {WORD_CRUSH_LEVELS.map((lvl, idx) => (
              <button
                key={lvl.level}
                type="button"
                onClick={() => setCurrentLevelIdx(idx)}
                className={`px-3 py-1.5 rounded-lg font-black text-xs transition-colors cursor-pointer ${
                  currentLevelIdx === idx
                    ? 'bg-[#7b2cbf] text-white shadow-xs'
                    : 'text-[#3b1e08] hover:bg-[#f6e5c3]'
                }`}
              >
                Lv.{lvl.level}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRestart}
            className="tp-rpg-btn tp-rpg-btn--wood p-2.5 cursor-pointer"
            title="다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Game Stage (16-bit Pixel Crystal Gem Cavern) */}
      <div className="mg-stage relative rounded-2xl overflow-hidden border-4 border-[#2c1507] shadow-2xl p-3.5 sm:p-5 bg-[#1b1838] select-none">
        <img
          src="/assets/minigames/bg-crush.webp"
          alt=""
          aria-hidden="true"
          className="mg-stage-bg"
          referrerPolicy="no-referrer"
          draggable={false}
        />
        <div className="mg-stage-scrim mg-stage-scrim--cavern" aria-hidden="true" />

        <div className="relative z-10">
          {/* NON-OBSTRUCTING FLOATING COMBO & CRUSH NOTIFICATION BAR */}
          <div className="h-9 mb-2 flex items-center justify-center">
            {lastCrushedInfo && (
              <div className="animate-in zoom-in-90 fade-in duration-150 bg-[#fffaf0]/95 px-4 py-1 rounded-lg border-2 border-[#2c1507] shadow-md flex items-center gap-2 text-xs font-black">
                <span className="text-[#9b1c26]">💥 [{lastCrushedInfo.word}] CRUSH!</span>
                <span className="bg-[#ffe066] text-[#2c1507] px-2 py-0.5 rounded font-mono tabular-nums">
                  +{lastCrushedInfo.score}점
                </span>
                {lastCrushedInfo.combo >= 2 && (
                  <span className="text-[#c2410c] flex items-center gap-0.5 tabular-nums">
                    <Flame className="w-3.5 h-3.5 fill-[#ea580c]" />
                    {lastCrushedInfo.combo} 콤보!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
            {/* ================= LEFT HUD (Avatar & Timer) ================= */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between gap-3 select-none">
              {/* Level & Avatar Panel */}
              <div className="mg-side-panel flex-1 p-3 text-center space-y-1.5">
                <div className="text-[11px] font-black text-[#6e3d18]">
                  Lv.{currentLevel.level} · {currentLevel.title}
                </div>

                {/* Profile Icon Display */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl bg-[#fff8e6] border-2 border-[#5c3314] shadow-inner flex items-center justify-center text-4xl sm:text-5xl">
                  {currentUser?.avatar || (combo >= 3 ? '🤩' : isGameOver ? '😢' : '🙂')}
                </div>
                <p className="text-xs font-black text-[#2c1507]">
                  {currentUser?.name || '꼬마 게이머'}
                </p>
              </div>

              {/* Timer Panel */}
              <div className="mg-side-panel flex-1 p-3 text-center flex flex-col justify-center space-y-1">
                <div className="text-[11px] font-black text-[#6e3d18]">
                  남은 시간
                </div>
                <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-[#2c1507] tracking-wider">
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* ================= CENTER GEM STONE GRID (7x7 Matrix) ================= */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="bg-[#121024]/88 p-2.5 sm:p-3.5 rounded-2xl border-4 border-[#6c584c] shadow-[inset_0_0_0_2px_#3a2f4d,0_6px_0_rgba(10,8,20,0.7)] w-full max-w-[490px] aspect-square flex flex-col justify-between relative overflow-hidden">
                <div className="grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5 w-full h-full">
                  {Array.from({ length: 49 }).map((_, idx) => {
                    const row = Math.floor(idx / 7);
                    const col = idx % 7;

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
                            rounded-lg sm:rounded-xl 
                            flex items-center justify-center 
                            p-0.5 text-center 
                            font-black text-[11px] sm:text-sm 
                            cursor-pointer select-none 
                            transition-transform duration-150
                            ${getJellyStyle(block.color)}
                            ${
                              isExploding
                                ? 'scale-125 brightness-150 ring-3 ring-[#ffe066] z-30'
                                : isPrefixMatch
                                ? 'ring-3 ring-[#ffe066] scale-105 brightness-125 z-20'
                                : 'hover:scale-105'
                            }
                          `}
                        >
                          <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.95)] tracking-tight leading-tight">
                            {block.word}
                          </span>
                        </div>
                      );
                    }

                    // Empty cavern tile
                    return (
                      <div
                        key={`tile-${row}-${col}`}
                        className="rounded-lg sm:rounded-xl bg-[#1e1b38]/75 border border-[#3e3866]/60 flex items-center justify-center"
                      >
                        <div className="w-1.5 h-1.5 rounded-xs bg-[#8e86c8]/25" />
                      </div>
                    );
                  })}
                </div>

                {/* Cleared Overlay Modal */}
                {isLevelCleared && (
                  <div className="absolute inset-0 bg-[#120d22]/85 flex flex-col items-center justify-center p-5 text-center z-30 animate-in zoom-in-95">
                    <div className="mg-overlay-card max-w-xs w-full">
                      <div className="text-3xl mb-1">🏆</div>
                      <h3 className="text-2xl font-black text-[#2c1507] font-arcade">
                        STAGE CLEAR!
                      </h3>
                      <p className="text-xs text-[#5c3314] font-bold mt-1">
                        모든 보석 단어를 팡팡 터뜨렸습니다!
                      </p>
                      <p className="font-mono tabular-nums text-xl font-extrabold text-[#9a3412] mt-2">
                        획득 점수: +{score.toLocaleString()}점
                      </p>

                      <div className="flex gap-2 justify-center mt-4 flex-wrap">
                        <button
                          type="button"
                          onClick={handleRestart}
                          className="tp-rpg-btn tp-rpg-btn--wood px-4 py-2 text-xs font-bold cursor-pointer"
                        >
                          다시 하기
                        </button>
                        {currentLevelIdx + 1 < WORD_CRUSH_LEVELS.length && (
                          <button
                            type="button"
                            onClick={handleNextLevel}
                            className="tp-rpg-btn tp-rpg-btn--gold px-4 py-2 text-xs font-black flex items-center gap-1 cursor-pointer"
                          >
                            <span>다음 레벨</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Game Over Overlay */}
                {isGameOver && !isLevelCleared && (
                  <div className="absolute inset-0 bg-[#120d22]/85 flex flex-col items-center justify-center p-5 text-center z-30 animate-in zoom-in-95">
                    <div className="mg-overlay-card max-w-xs w-full">
                      <div className="text-3xl mb-1">⏳</div>
                      <h3 className="text-2xl font-black text-[#9b1c26] font-arcade">
                        시간 초과!
                      </h3>
                      <p className="text-xs text-[#5c3314] font-bold mt-1">
                        시간 내에 모든 보석 블록을 터뜨리지 못했습니다.
                      </p>
                      <button
                        type="button"
                        onClick={handleRestart}
                        className="mt-4 tp-rpg-btn tp-rpg-btn--gold px-5 py-2.5 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>다시 도전하기</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================= RIGHT HUD (Score / Combo / Stats) ================= */}
            <div className="lg:col-span-3 flex flex-row lg:flex-col justify-between gap-3 select-none">
              {/* Rank / Status Panel */}
              <div className="mg-side-panel flex-1 p-3 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-5 h-5 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <h4 className="font-black text-sm text-[#2c1507] font-arcade">
                  워드 크러쉬 랭킹
                </h4>
                <div className="border-t border-[#d8b882] pt-1.5 text-[11px] text-[#5c3314] leading-snug font-bold">
                  {currentUser ? (
                    <p className="text-[#8c2810]">
                      {currentUser.name} 님의 기록이 실시간 랭킹에 등록됩니다!
                    </p>
                  ) : (
                    <p>비로그인 플레이 중 (로그인 시 랭킹 등록)</p>
                  )}
                </div>
              </div>

              {/* Score & Dynamic Combo Box */}
              <div className="mg-side-panel flex-1 p-3 text-center space-y-2">
                <div>
                  <div className="text-[11px] font-black text-[#6e3d18]">
                    획득 점수
                  </div>
                  <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black text-[#9a3412] mt-0.5">
                    {score.toLocaleString()}
                  </div>
                </div>

                <div className="border-t border-[#d8b882] pt-1.5">
                  <div className="flex items-center justify-center gap-1 text-[#c2410c] font-black text-sm tabular-nums">
                    <Flame className="w-4 h-4 fill-[#ea580c] text-[#ea580c]" />
                    <span>{combo} COMBO</span>
                  </div>
                  <p className="text-[10px] text-[#6e3d18] font-bold mt-0.5 tabular-nums">
                    최대 콤보: {maxCombo}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BOTTOM INPUT BAR ================= */}
          <div className="mt-4 mg-input-bar p-3 sm:p-3.5 flex flex-col sm:flex-row items-center gap-2.5">
            <div className="flex-1 w-full relative">
              <input
                ref={inputRef}
                id="word-crush-input"
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isGameOver || isLevelCleared}
                placeholder="보석 블록 안의 단어를 빠르게 입력하세요! (Space / Enter)"
                className="w-full text-center sm:text-left pl-4 pr-14 py-2.5 text-lg font-black rounded-lg border-3 border-[#4a2810] focus:border-[#7b2cbf] outline-hidden bg-[#fffdf7] text-[#261106] placeholder-[#947252] shadow-inner font-arcade"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              {inputVal && (
                <span className="absolute right-3 top-3 px-2 py-0.5 bg-[#ffe066] text-[#2c1507] text-xs font-bold rounded border border-[#4a2810]">
                  입력 중
                </span>
              )}
            </div>

            <button
              type="button"
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
              className="tp-rpg-btn tp-rpg-btn--gold px-6 py-2.5 font-black text-sm whitespace-nowrap cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
