import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/sound';
import { UserSession, LeaderboardEntry } from '../../types';
import { addTypingPracticePoints } from '../../utils/tamagotchiStorage';
import { dailyMissionsManager } from '../../utils/dailyMissionsManager';
import { 
  Sparkles, 
  RotateCcw, 
  Trophy, 
  Heart, 
  Flame, 
  Award, 
  Zap, 
  Play, 
  Lock,
  ChevronRight,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface MoleGameViewProps {
  currentUser: UserSession | null;
  onRecordScore: (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => void;
  onBack?: () => void;
}

interface MoleHole {
  id: number;
  word: string;
  isActive: boolean;
  isHit: boolean;
  spawnTime: number;
  duration: number; // how long it stays up
  points: number;
}

const MOLE_WORDS_POOL = {
  1: ['하늘', '바람', '구름', '햇살', '나무', '바다', '꽃잎', '별빛', '초록', '나비', '달빛', '사과'],
  2: ['도토리', '무지개', '해바라기', '반딧불', '달팽이', '개구리', '다람쥐', '도라지', '방울새', '아침밥'],
  3: ['컴퓨터', '피아노', '스케치북', '알록달록', '반짝반짝', '둥실둥실', '산들바람', '초콜릿', '호두과자', '텔레비전'],
};

export const MoleGameView: React.FC<MoleGameViewProps> = ({
  currentUser,
  onRecordScore,
  onBack,
}) => {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [whackedCount, setWhackedCount] = useState(0);
  const [inputVal, setInputVal] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 9 holes (3x3)
  const [holes, setHoles] = useState<MoleHole[]>(() =>
    Array.from({ length: 9 }, (_, i) => ({
      id: i,
      word: '',
      isActive: false,
      isHit: false,
      spawnTime: 0,
      duration: 3500,
      points: 100,
    }))
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // Start / restart game
  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(5);
    setCombo(0);
    setMaxCombo(0);
    setWhackedCount(0);
    setInputVal('');
    setHoles(
      Array.from({ length: 9 }, (_, i) => ({
        id: i,
        word: '',
        isActive: false,
        isHit: false,
        spawnTime: 0,
        duration: level === 1 ? 4000 : level === 2 ? 3000 : 2200,
        points: 100 * level,
      }))
    );
    inputRef.current?.focus();
  };

  // Main game tick: spawn moles and check timeouts (clean, no recursive state updates)
  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      return;
    }

    gameLoopRef.current = window.setInterval(() => {
      const now = Date.now();
      let expiredCount = 0;

      setHoles((prevHoles) => {
        let updated = prevHoles.map((hole) => {
          // Check if active mole timed out without being hit
          if (hole.isActive && !hole.isHit && now - hole.spawnTime > hole.duration) {
            expiredCount++;
            return { ...hole, isActive: false, isHit: false, word: '' };
          }
          return hole;
        });

        // Chance to spawn a new mole in an inactive hole
        const activeCount = updated.filter((h) => h.isActive).length;
        const maxActive = level === 1 ? 2 : level === 2 ? 3 : 4;

        if (activeCount < maxActive && Math.random() < 0.6) {
          const inactiveHoles = updated.filter((h) => !h.isActive);
          if (inactiveHoles.length > 0) {
            const randomHole = inactiveHoles[Math.floor(Math.random() * inactiveHoles.length)];
            const wordPool = MOLE_WORDS_POOL[level];
            const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];

            // Ensure no duplicate word on screen
            const currentActiveWords = updated.filter((h) => h.isActive).map((h) => h.word);
            if (!currentActiveWords.includes(randomWord)) {
              updated = updated.map((h) =>
                h.id === randomHole.id
                  ? {
                      ...h,
                      isActive: true,
                      isHit: false,
                      word: randomWord,
                      spawnTime: now,
                      duration: level === 1 ? 3800 : level === 2 ? 2800 : 2000,
                      points: 100 * level,
                    }
                  : h
              );
            }
          }
        }

        return updated;
      });

      if (expiredCount > 0) {
        setCombo(0);
        setLives((l) => {
          const nextLives = Math.max(0, l - expiredCount);
          if (nextLives <= 0) {
            setTimeout(() => handleGameOver(), 0);
          }
          return nextLives;
        });
      }
    }, 400);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isGameOver, level]);

  const whackMole = (targetHole: typeof holes[0]) => {
    // WHACK!
    soundManager.playWhack();
    const nextCombo = combo + 1;
    setCombo(nextCombo);
    setMaxCombo((prev) => Math.max(prev, nextCombo));

    const earned = targetHole.points + nextCombo * 25;
    setScore((s) => s + earned);
    setWhackedCount((w) => w + 1);

    if (nextCombo >= 3) {
      soundManager.playCombo(nextCombo);
    }

    setHoles((prev) =>
      prev.map((h) =>
        h.id === targetHole.id ? { ...h, isHit: true } : h
      )
    );

    // Mole retreats after hit animation
    setTimeout(() => {
      setHoles((prev) =>
        prev.map((h) =>
          h.id === targetHole.id ? { ...h, isActive: false, isHit: false, word: '' } : h
        )
      );
    }, 350);

    setInputVal('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const trimmed = val.trim();

    if (!trimmed) {
      setInputVal(val);
      return;
    }

    // Check if trimmed matches any active mole
    const targetHole = holes.find((h) => h.isActive && !h.isHit && h.word === trimmed);

    if (targetHole) {
      whackMole(targetHole);
      return;
    }

    // Check maximum word length of active moles
    const activeMoles = holes.filter((h) => h.isActive && !h.isHit);
    const maxActiveLen = activeMoles.length > 0 ? Math.max(...activeMoles.map((m) => m.word.length)) : 6;

    // If typed length exceeds longest active word length, reset immediately
    if (val.length > maxActiveLen) {
      soundManager.playError();
      setInputVal('');
      return;
    }

    setInputVal(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = inputVal.trim();
      if (!trimmed) return;

      const targetHole = holes.find((h) => h.isActive && !h.isHit && h.word === trimmed);
      if (targetHole) {
        whackMole(targetHole);
      } else {
        soundManager.playError();
        setInputVal('');
      }
    }
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    soundManager.playError();

    const earnedPoints = Math.min(150, Math.max(15, Math.round(score / 40)));
    addTypingPracticePoints(earnedPoints, `두더지 타자 (${score}점)`);
    dailyMissionsManager.incrementProgress('game', 1, currentUser?.id);

    if (currentUser && score > 200) {
      onRecordScore({
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '🐹',
        mode: 'mole-game',
        modeTitle: `두더지 타자 (${level}단계)`,
        score: score,
        cpm: Math.round((whackedCount * 60) / 2),
        accuracy: 100,
        details: `두더지 ${whackedCount}마리 잡음 (최고 ${maxCombo}콤보)`,
      });
    }
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
      <div className="flex items-center justify-between gap-3 p-3 bg-white rounded-2xl border-2 border-emerald-300 shadow-sm">
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
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>미니게임 목록</span>
            </button>
          )}

          <span className="font-arcade font-black text-sm text-slate-800 flex items-center gap-1.5">
            <span>🐹</span>
            <span>두더지 타자</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.play('pop');
              setIsFullscreen(!isFullscreen);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? '창 복원' : '전체보기 전환'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-4 border-emerald-200 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 arcade-card-glow">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>신규 아케이드 타자 게임</span>
            </span>
            {!currentUser && (
              <span className="text-[11px] font-bold text-slate-400">
                (비로그인 자유 플레이)
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1 font-arcade">
            🐹 두더지 타자 게임 (Whack-a-Mole)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            땅속에서 쏙쏙 튀어나오는 두더지의 단어를 재빠르게 입력하여 망치로 뿅!
          </p>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <div className="flex items-center p-1 bg-emerald-50 rounded-2xl border border-emerald-200">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                onClick={() => {
                  setLevel(lvl as 1 | 2 | 3);
                  if (isPlaying) startGame();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  level === lvl
                    ? 'bg-emerald-500 text-white shadow-xs scale-105'
                    : 'text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {lvl === 1 ? '초급' : lvl === 2 ? '중급' : '고급'}
              </button>
            ))}
          </div>

          <button
            onClick={startGame}
            className="px-5 py-2.5 rounded-2xl arcade-btn-mint text-emerald-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-emerald-900" />}
            <span>{isPlaying ? '다시하기' : '게임 시작'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Arena */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-sky-200 via-emerald-100 to-amber-100 p-4 sm:p-8 border-4 border-emerald-300 shadow-2xl">
        {/* HUD Info Bar */}
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border-2 border-emerald-200 shadow-md mb-6">
          {/* Lives */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold text-slate-500 mr-1">생명:</span>
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-transform ${
                  i < lives
                    ? 'text-rose-500 fill-rose-500 scale-100'
                    : 'text-slate-300 fill-slate-200 scale-90'
                }`}
              />
            ))}
          </div>

          {/* Score & Combo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-orange-500 font-black text-xs sm:text-sm">
              <Flame className="w-4 h-4 fill-orange-500 animate-bounce" />
              <span>{combo} COMBO</span>
            </div>
            <div className="bg-emerald-500 text-white font-mono text-sm sm:text-base font-black px-4 py-1 rounded-xl shadow-inner border border-emerald-400">
              {score.toLocaleString()} 점
            </div>
          </div>
        </div>

        {/* 3x3 Mole Garden Holes */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto py-2">
          {holes.map((hole) => {
            const isPrefixMatch = Boolean(
              inputVal.trim() && hole.isActive && !hole.isHit && hole.word.startsWith(inputVal.trim())
            );

            return (
              <div
                key={hole.id}
                className="relative aspect-square rounded-3xl bg-gradient-to-b from-amber-800 via-amber-900 to-amber-950 border-4 border-amber-600 shadow-[inset_0_8px_16px_rgba(0,0,0,0.7)] flex items-end justify-center overflow-hidden pb-1"
              >
                {/* Hole Grass Trim */}
                <div className="absolute top-0 inset-x-0 h-4 bg-emerald-500/90 rounded-b-xl border-b-2 border-emerald-600 z-0" />

                {/* Mole Character */}
                {hole.isActive && (
                  <div
                    className={`flex flex-col items-center justify-center transition-all duration-150 z-10 select-none ${
                      hole.isHit
                        ? 'scale-90 rotate-12 brightness-110'
                        : 'animate-in slide-in-from-bottom-10 duration-200'
                    }`}
                  >
                    {/* Whack Hammer & Stars Animation */}
                    {hole.isHit && (
                      <div className="absolute -top-10 flex flex-col items-center z-30 animate-bounce">
                        <span className="text-4xl sm:text-5xl filter drop-shadow-lg">
                          🔨💥
                        </span>
                        <span className="text-xs font-black text-yellow-300 bg-slate-900/80 px-2 py-0.5 rounded-full mt-1 border border-yellow-400">
                          +100 HIT!
                        </span>
                      </div>
                    )}

                    {/* Word Tag Badge on Mole with Dynamic Prefix Glow */}
                    <div
                      className={`px-3 py-1 rounded-xl font-black text-xs sm:text-sm shadow-lg border-2 whitespace-nowrap mb-1.5 transition-all ${
                        hole.isHit
                          ? 'bg-rose-500 text-white border-rose-300 scale-110'
                          : isPrefixMatch
                          ? 'bg-yellow-300 text-slate-950 border-yellow-500 ring-4 ring-yellow-200 scale-110 animate-pulse font-extrabold'
                          : 'bg-amber-100 text-amber-950 border-amber-300 ring-2 ring-white'
                      }`}
                    >
                      {hole.word}
                    </div>

                    {/* Cute Mole Head with Animated Expressions */}
                    <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-t-full bg-gradient-to-b from-amber-500 to-amber-800 border-2 border-amber-900 flex flex-col items-center justify-start pt-1.5 shadow-md relative">
                      {hole.isHit ? (
                        // Dizzy Stunned Face
                        <div className="flex flex-col items-center">
                          <div className="flex gap-2 text-sm font-black text-slate-900 mt-1">
                            <span>😵</span>
                          </div>
                          <span className="text-[10px] text-amber-200 font-bold">💫 뿅!</span>
                        </div>
                      ) : (
                        // Happy Cute Mole Face
                        <>
                          <div className="flex gap-2.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-white"></span>
                            <span className="w-2 h-2 rounded-full bg-slate-900 ring-1 ring-white"></span>
                          </div>
                          <div className="w-3.5 h-2 rounded-full bg-rose-400 mt-1 shadow-xs"></div>
                          <div className="flex gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 bg-amber-100 rounded-xs"></span>
                            <span className="w-1.5 h-1.5 bg-amber-100 rounded-xs"></span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Game Over / Start Prompt Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white z-30 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-400 text-emerald-950 flex items-center justify-center text-3xl mb-3 shadow-lg animate-bounce">
              {isGameOver ? '🐹' : '🎮'}
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-300 font-arcade">
              {isGameOver ? 'GAME OVER!' : '두더지 타자 게임'}
            </h3>
            <p className="text-xs text-slate-200 mt-1 max-w-sm">
              {isGameOver
                ? `두더지를 놓쳐 생명이 모두 소진되었습니다! 최종 점수: ${score.toLocaleString()}점`
                : '두더지가 땅 위로 올라왔을 때 단어를 타이핑하여 망치로 뿅 잡으세요!'}
            </p>

            <button
              onClick={startGame}
              className="mt-5 px-8 py-3.5 rounded-2xl arcade-btn-mint text-emerald-950 font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {isGameOver ? '다시 도전하기' : '게임 시작하기'}
            </button>
          </div>
        )}

        {/* Typing Input Box */}
        <div className="mt-6 bg-white/95 backdrop-blur-xs p-3 sm:p-4 rounded-2xl border-4 border-emerald-300 shadow-lg flex flex-col sm:flex-row items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={!isPlaying || isGameOver}
            placeholder={isPlaying ? '두더지의 단어를 타이핑하세요!' : '게임 시작 버튼을 누르세요'}
            className="w-full text-center sm:text-left pl-4 pr-4 py-3 text-lg font-black rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-hidden bg-emerald-50/50 text-slate-800 placeholder-slate-400 shadow-inner font-arcade"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          <button
            onClick={() => {
              setInputVal('');
              inputRef.current?.focus();
            }}
            className="px-6 py-3 rounded-xl arcade-btn-mint text-emerald-950 font-black text-sm shadow-md whitespace-nowrap"
          >
            초기화
          </button>
        </div>
      </div>
    </div>
  );
};
