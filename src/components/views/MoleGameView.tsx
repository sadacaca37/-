import React, { useState, useEffect, useRef } from 'react';
import { GAME_POINTS } from '../../utils/pointRules';
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
    addTypingPracticePoints(GAME_POINTS, `두더지 타자 (${score}점)`);
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
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#1f1309] p-2 sm:p-4 overflow-y-auto flex flex-col space-y-3 animate-in fade-in'
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

          <span className="font-arcade font-black text-sm text-[#2c1507] flex items-center gap-1.5">
            <span>두더지 타자 잡기</span>
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
            <span>풀밭 언덕 타자 게임</span>
            {!currentUser && (
              <>
                <span aria-hidden="true">·</span>
                <span>비로그인 자유 플레이</span>
              </>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-[#2c1507] tracking-tight mt-0.5 font-arcade">
            두더지 타자 잡기
          </h1>
          <p className="text-xs sm:text-sm text-[#5c3314] font-medium">
            풀밭 구멍에서 쏙쏙 튀어나오는 두더지의 단어를 빠르게 입력해 잡아 보세요!
          </p>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <div className="flex items-center p-1 bg-[#e8cfa0] rounded-xl border-2 border-[#5c3314]">
            {[1, 2, 3].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setLevel(lvl as 1 | 2 | 3);
                  if (isPlaying) startGame();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer ${
                  level === lvl
                    ? 'bg-[#2e7d32] text-white shadow-xs'
                    : 'text-[#3b1e08] hover:bg-[#f6e5c3]'
                }`}
              >
                {lvl === 1 ? '초급' : lvl === 2 ? '중급' : '고급'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={startGame}
            className="tp-rpg-btn tp-rpg-btn--gold px-5 py-2.5 font-black text-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? '다시하기' : '게임 시작'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Arena (16-bit Pixel Meadow Hill) */}
      <div className="mg-stage relative rounded-2xl overflow-hidden border-4 border-[#2c1507] shadow-2xl p-3.5 sm:p-6 bg-[#4b9a34]">
        <img
          src="/assets/minigames/bg-mole.webp"
          alt=""
          aria-hidden="true"
          className="mg-stage-bg"
          referrerPolicy="no-referrer"
          draggable={false}
        />
        <div className="mg-stage-scrim mg-stage-scrim--meadow" aria-hidden="true" />

        <div className="relative z-10">
          {/* HUD Info Bar */}
          <div className="mg-hud-bar flex items-center justify-between flex-wrap gap-2 p-3 sm:px-4 mb-5">
            {/* Lives */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-[#fff4d4] mr-1">생명:</span>
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart
                  key={i}
                  className={`w-5 h-5 transition-transform ${
                    i < lives
                      ? 'text-rose-400 fill-rose-500 scale-100'
                      : 'text-amber-950/60 fill-amber-950/40 scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Score & Combo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1 text-[#ffe066] font-black text-xs sm:text-sm tabular-nums">
                <Flame className="w-4 h-4 fill-[#ff9f1c] text-[#ffe066]" />
                <span>{combo} COMBO</span>
              </div>
              <div className="bg-[#fdf5dd] text-[#2c1507] font-mono tabular-nums text-sm sm:text-base font-black px-3.5 py-1 rounded-lg border-2 border-[#2c1507]">
                {score.toLocaleString()} 점
              </div>
            </div>
          </div>

          {/* 3x3 Mole Meadow Burrows */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-5 max-w-lg mx-auto py-1">
            {holes.map((hole) => {
              const isPrefixMatch = Boolean(
                inputVal.trim() && hole.isActive && !hole.isHit && hole.word.startsWith(inputVal.trim())
              );

              return (
                <div
                  key={hole.id}
                  className="mg-mole-hole relative aspect-square flex flex-col items-center justify-end overflow-visible pb-2"
                >
                  {/* Earthy Pixel Burrow Pit */}
                  <div className="mg-mole-pit" aria-hidden="true" />

                  {/* Mole Character Sprite */}
                  {hole.isActive && (
                    <div
                      className={`relative flex flex-col items-center justify-end z-10 select-none transition-transform duration-150 ${
                        hole.isHit
                          ? 'scale-90 translate-y-2'
                          : 'animate-in slide-in-from-bottom-6 duration-150'
                      }`}
                    >
                      {/* Hit Effect Badge */}
                      {hole.isHit && (
                        <div className="absolute -top-9 flex flex-col items-center z-30 pointer-events-none">
                          <span className="text-2xl sm:text-3xl drop-shadow-md">💥</span>
                          <span className="text-[11px] font-black text-[#ffe066] bg-[#2c1507]/95 px-2 py-0.5 rounded border border-[#ffe066] whitespace-nowrap">
                            +{hole.points} HIT!
                          </span>
                        </div>
                      )}

                      {/* High-Contrast Word Sign */}
                      <div
                        className={`mg-word-pill mb-1 whitespace-nowrap ${
                          hole.isHit
                            ? 'bg-rose-600 text-white border-[#2c1507]'
                            : isPrefixMatch
                            ? 'bg-[#ffe066] text-[#261106] border-[#2c1507] scale-105'
                            : 'bg-[#fffaf0] text-[#261106] border-[#2c1507]'
                        }`}
                      >
                        {hole.word}
                      </div>

                      {/* Original 16-bit Pixel Mole Sprite */}
                      <img
                        src="/assets/minigames/sprite-mole.webp"
                        alt="두더지"
                        className={`w-16 h-16 sm:w-22 sm:h-22 object-contain pointer-events-none select-none drop-shadow-[0_3px_0_rgba(36,17,6,0.55)] ${
                          hole.isHit ? 'brightness-125 -rotate-12' : ''
                        }`}
                        style={{ imageRendering: 'pixelated' }}
                        referrerPolicy="no-referrer"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Front Dirt Mound Rim */}
                  <div className="mg-mole-rim" aria-hidden="true" />
                </div>
              );
            })}
          </div>

          {/* Typing Input Box */}
          <div className="mt-5 mg-input-bar p-3 sm:p-3.5 flex flex-col sm:flex-row items-center gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!isPlaying || isGameOver}
              placeholder={isPlaying ? '두더지의 단어를 타이핑하세요!' : '게임 시작 버튼을 누르세요'}
              className="w-full text-center sm:text-left px-4 py-2.5 text-lg font-black rounded-lg border-3 border-[#4a2810] focus:border-[#2e7d32] outline-hidden bg-[#fffdf7] text-[#261106] placeholder-[#947252] shadow-inner font-arcade"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />

            <button
              type="button"
              onClick={() => {
                setInputVal('');
                inputRef.current?.focus();
              }}
              className="tp-rpg-btn tp-rpg-btn--wood px-5 py-2.5 font-black text-sm whitespace-nowrap cursor-pointer"
            >
              초기화
            </button>
          </div>
        </div>

        {/* Game Over / Start Prompt Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-[#1a1008]/75 flex flex-col items-center justify-center p-5 text-center z-30 animate-in fade-in">
            <div className="mg-overlay-card max-w-sm w-full">
              <img
                src="/assets/minigames/sprite-mole.webp"
                alt=""
                aria-hidden="true"
                className="w-20 h-20 mx-auto mb-2 object-contain"
                style={{ imageRendering: 'pixelated' }}
                referrerPolicy="no-referrer"
                draggable={false}
              />
              <h3 className="text-2xl font-black text-[#2c1507] font-arcade">
                {isGameOver ? 'GAME OVER!' : '두더지 타자 잡기'}
              </h3>
              <p className="text-xs sm:text-sm text-[#4a2810] font-bold mt-1.5 leading-relaxed">
                {isGameOver
                  ? `두더지를 놓쳐 생명이 모두 소진되었습니다! 최종 점수: ${score.toLocaleString()}점`
                  : '풀밭 구멍에서 올라오는 두더지의 단어를 빠르게 타이핑해 잡아 보세요!'}
              </p>

              <button
                type="button"
                onClick={startGame}
                className="mt-4 tp-rpg-btn tp-rpg-btn--gold px-7 py-3 font-black text-sm cursor-pointer"
              >
                {isGameOver ? '다시 도전하기' : '게임 시작하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
