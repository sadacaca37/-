import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Trophy, 
  Flame,
  Grid
} from 'lucide-react';
import { soundManager } from '../../../utils/sound';
import confetti from 'canvas-confetti';

interface WordBlockPuzzleGameProps {
  onBack?: () => void;
  currentUser?: any;
}

const PUZZLE_WORDS = [
  '행복', '열정', '바다', '희망', '사탕', 
  '우정', '봄날', '사랑', '미소', '햇살',
  '바람', '구름', '별빛', '단풍', '노래',
  '하늘', '달콤', '새싹', '마음', '소망'
];

const BLOCK_COLORS = [
  'bg-pink-500 text-white shadow-pink-500/40 border-pink-400',
  'bg-amber-500 text-white shadow-amber-500/40 border-amber-400',
  'bg-emerald-500 text-white shadow-emerald-500/40 border-emerald-400',
  'bg-sky-500 text-white shadow-sky-500/40 border-sky-400',
  'bg-purple-500 text-white shadow-purple-500/40 border-purple-400',
];

export const WordBlockPuzzleGame: React.FC<WordBlockPuzzleGameProps> = ({ onBack, currentUser }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [combo, setCombo] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [activeWords, setActiveWords] = useState<string[]>([]);
  const [gridChars, setGridChars] = useState<string[][]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Generate a fresh 6x6 grid with assorted Korean letters
  const generateGrid = (words: string[]) => {
    const chars: string[] = [];
    words.forEach((w) => chars.push(...w.split('')));
    while (chars.length < 36) {
      const extraWord = PUZZLE_WORDS[Math.floor(Math.random() * PUZZLE_WORDS.length)];
      chars.push(...extraWord.split(''));
    }
    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    const matrix: string[][] = [];
    for (let r = 0; r < 6; r++) {
      matrix.push(chars.slice(r * 6, r * 6 + 6));
    }
    return matrix;
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(60);
    setCombo(0);
    setInputVal('');

    const initialWords = [
      PUZZLE_WORDS[Math.floor(Math.random() * PUZZLE_WORDS.length)],
      PUZZLE_WORDS[Math.floor(Math.random() * PUZZLE_WORDS.length)],
      PUZZLE_WORDS[Math.floor(Math.random() * PUZZLE_WORDS.length)],
    ];
    setActiveWords(initialWords);
    setGridChars(generateGrid(initialWords));

    inputRef.current?.focus();
    soundManager.playSuccess();
  };

  // Timer Countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('gameover');
          soundManager.playVictory();
          try {
            confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setInputVal(val);

    const hitIndex = activeWords.indexOf(val);
    if (hitIndex !== -1) {
      soundManager.playSuccess();
      const pts = 200 + combo * 50;

      setScore((s) => s + pts);
      setCombo((c) => c + 1);

      // Replace cleared word with a new one
      const remaining = activeWords.filter((_, idx) => idx !== hitIndex);
      const newWord = PUZZLE_WORDS[Math.floor(Math.random() * PUZZLE_WORDS.length)];
      const updatedWords = [...remaining, newWord];
      setActiveWords(updatedWords);
      setGridChars(generateGrid(updatedWords));

      setInputVal('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/40">
                기본 플레이 · 무료
              </span>
              <span className="text-xs text-slate-400 font-bold">블록 매치 타자 퍼즐</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-pink-400 to-rose-400 flex items-center gap-2">
              <Grid className="w-5 h-5 text-amber-400" />
              <span>단어 블록 퍼즐 팡팡</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-amber-300 font-mono">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{timeLeft}초 남음</span>
          </div>
        </div>
      </div>

      {/* Main Puzzle Container */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-slate-950 p-4 sm:p-6 space-y-5">
        {/* HUD Cards */}
        <div className="grid grid-cols-3 gap-3 bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-400">TOTAL SCORE</div>
            <div className="text-xl font-black font-mono text-amber-400">{score} PTS</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">CHAIN COMBO</div>
            <div className="text-xl font-black font-mono text-pink-400">
              {combo > 0 ? `💥 ${combo} 콤보` : '-'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">REMAINING TIME</div>
            <div className={`text-xl font-black font-mono ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              ⏱ {timeLeft}s
            </div>
          </div>
        </div>

        {/* Mission Target Words Floating Chips */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center space-y-2">
          <div className="text-xs font-bold text-slate-400">
            아래의 목표 단어를 타이핑하여 블록을 팡팡 터뜨리세요!
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {activeWords.map((word, idx) => (
              <div 
                key={idx}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-black font-serif text-base sm:text-lg shadow-lg border-2 border-amber-300 animate-bounce-subtle"
              >
                ✨ {word}
              </div>
            ))}
          </div>
        </div>

        {/* 6x6 Gem Letter Block Grid */}
        <div className="max-w-xs sm:max-w-sm mx-auto grid grid-cols-6 gap-1.5 p-3 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-inner">
          {gridChars.map((row, rIdx) =>
            row.map((char, cIdx) => {
              const colorClass = BLOCK_COLORS[(rIdx * 6 + cIdx) % BLOCK_COLORS.length];
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`aspect-square rounded-xl border flex items-center justify-center font-bold text-base sm:text-lg shadow-sm transition-transform duration-200 hover:scale-110 ${colorClass}`}
                >
                  {char}
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar */}
        <div className="max-w-md mx-auto flex items-center gap-3 pt-2">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            disabled={gameState !== 'playing'}
            placeholder={gameState === 'playing' ? '목표 단어를 입력하여 팡팡 터뜨리기!' : '게임 시작을 눌러주세요'}
            className="flex-1 px-5 py-3 rounded-2xl bg-slate-900 border-2 border-amber-500/60 text-amber-300 font-bold text-center text-base sm:text-lg focus:outline-none focus:border-amber-400 shadow-inner placeholder:text-slate-600"
            autoFocus
          />
          <button
            onClick={startGame}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="게임 리셋"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Overlays */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-40 p-4">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                🧩
              </div>
              <div>
                <h2 className="text-2xl font-black font-arcade text-white">단어 블록 퍼즐 팡팡</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                  퍼즐 그리드에 제시된 목표 단어를 빠르게 타이핑하여 블록을 팡팡 터뜨리세요! 연속 성공 시 콤보 폭발 보너스가 주어집니다.
                </p>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 text-white font-black font-arcade text-base shadow-xl transition-transform active:scale-95 cursor-pointer"
              >
                START PUZZLE (퍼즐 시작) 🧩
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-in fade-in">
            <div className="text-center space-y-4 max-w-sm">
              <div className="text-4xl">🎉</div>
              <h2 className="text-2xl font-black font-arcade text-amber-400">TIME UP! 완주 성공</h2>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">퍼즐 최종 점수</div>
                <div className="text-2xl font-black font-mono text-amber-400">{score} PTS</div>
                <div className="text-xs text-slate-400">최대 연쇄 콤보: {combo} 팡팡</div>
              </div>
              <button
                onClick={startGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-pink-500 text-white font-black font-arcade text-sm shadow-lg transition active:scale-95 cursor-pointer"
              >
                다시 팡팡 터뜨리기 🔄
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
