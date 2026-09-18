import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Undo2, Play, Sparkles } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface Game2048Props {
  onBack?: () => void;
  currentUser?: any;
}

const TILE_COLORS: Record<number, { bg: string; text: string; size: string }> = {
  2: { bg: 'bg-[#EEE4DA]', text: 'text-[#776E65]', size: 'text-2xl sm:text-3xl' },
  4: { bg: 'bg-[#EDE0C8]', text: 'text-[#776E65]', size: 'text-2xl sm:text-3xl' },
  8: { bg: 'bg-[#F2B179]', text: 'text-white', size: 'text-2xl sm:text-3xl' },
  16: { bg: 'bg-[#F59563]', text: 'text-white', size: 'text-2xl sm:text-3xl' },
  32: { bg: 'bg-[#F67C5F]', text: 'text-white', size: 'text-2xl sm:text-3xl' },
  64: { bg: 'bg-[#F65E3B]', text: 'text-white', size: 'text-2xl sm:text-3xl' },
  128: { bg: 'bg-[#EDCF72]', text: 'text-white', size: 'text-xl sm:text-2xl' },
  256: { bg: 'bg-[#EDCC61]', text: 'text-white', size: 'text-xl sm:text-2xl' },
  512: { bg: 'bg-[#EDC850]', text: 'text-white', size: 'text-xl sm:text-2xl' },
  1024: { bg: 'bg-[#EDC53F]', text: 'text-white', size: 'text-lg sm:text-xl' },
  2048: { bg: 'bg-[#EDC22E]', text: 'text-white', size: 'text-lg sm:text-xl font-black' },
  4096: { bg: 'bg-[#3C3A32]', text: 'text-white', size: 'text-lg sm:text-xl font-black' }
};

export const Game2048: React.FC<Game2048Props> = ({ onBack }) => {
  const [board, setBoard] = useState<number[][]>(() => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  const [prevBoard, setPrevBoard] = useState<number[][] | null>(null);
  const [prevScore, setPrevScore] = useState<number>(0);

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('2048_high_score') || '0');
    } catch {
      return 0;
    }
  });

  const [hasWon, setHasWon] = useState<boolean>(false);
  const [keepPlaying, setKeepPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Add random tile (2 or 4) to empty spot
  const addRandomTile = (currentBoard: number[][]): number[][] => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const startNewGame = () => {
    let newBoard = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setPrevBoard(null);
    setScore(0);
    setHasWon(false);
    setKeepPlaying(false);
    setIsGameOver(false);
    soundManager.playSuccess();
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const checkGameOver = (currentBoard: number[][]): boolean => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < 3 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r < 3 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback(
    (direction: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN') => {
      if (isGameOver) return;
      if (hasWon && !keepPlaying) return;

      let moved = false;
      let gainedScore = 0;
      const newBoard = board.map((row) => [...row]);

      const slideRow = (row: number[]): number[] => {
        // Filter out zeroes
        let filtered = row.filter((val) => val !== 0);
        for (let i = 0; i < filtered.length - 1; i++) {
          if (filtered[i] === filtered[i + 1]) {
            filtered[i] *= 2;
            gainedScore += filtered[i];
            filtered.splice(i + 1, 1);
            if (filtered[i] === 2048 && !hasWon && !keepPlaying) {
              setHasWon(true);
              soundManager.playSuccess();
            }
          }
        }
        while (filtered.length < 4) {
          filtered.push(0);
        }
        return filtered;
      };

      if (direction === 'LEFT') {
        for (let r = 0; r < 4; r++) {
          const oldRow = newBoard[r];
          const nextRow = slideRow(oldRow);
          if (oldRow.some((val, idx) => val !== nextRow[idx])) moved = true;
          newBoard[r] = nextRow;
        }
      } else if (direction === 'RIGHT') {
        for (let r = 0; r < 4; r++) {
          const oldRow = [...newBoard[r]].reverse();
          const nextRow = slideRow(oldRow).reverse();
          if (newBoard[r].some((val, idx) => val !== nextRow[idx])) moved = true;
          newBoard[r] = nextRow;
        }
      } else if (direction === 'UP') {
        for (let c = 0; c < 4; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const nextCol = slideRow(col);
          if (col.some((val, idx) => val !== nextCol[idx])) moved = true;
          for (let r = 0; r < 4; r++) {
            newBoard[r][c] = nextCol[r];
          }
        }
      } else if (direction === 'DOWN') {
        for (let c = 0; c < 4; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const nextCol = slideRow(col);
          if (
            newBoard[3][c] !== nextCol[0] ||
            newBoard[2][c] !== nextCol[1] ||
            newBoard[1][c] !== nextCol[2] ||
            newBoard[0][c] !== nextCol[3]
          ) {
            moved = true;
          }
          newBoard[3][c] = nextCol[0];
          newBoard[2][c] = nextCol[1];
          newBoard[1][c] = nextCol[2];
          newBoard[0][c] = nextCol[3];
        }
      }

      if (moved) {
        soundManager.playClick();
        setPrevBoard(board);
        setPrevScore(score);

        const spawned = addRandomTile(newBoard);
        setBoard(spawned);

        const newScore = score + gainedScore;
        setScore(newScore);

        if (newScore > highScore) {
          setHighScore(newScore);
          try {
            localStorage.setItem('2048_high_score', String(newScore));
          } catch {}
        }

        if (checkGameOver(spawned)) {
          setIsGameOver(true);
          soundManager.playError();
        }
      }
    },
    [board, score, highScore, hasWon, keepPlaying, isGameOver]
  );

  const undoMove = () => {
    if (!prevBoard) return;
    setBoard(prevBoard);
    setScore(prevScore);
    setPrevBoard(null);
    setIsGameOver(false);
    soundManager.playClick();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          move('LEFT');
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          move('RIGHT');
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          move('UP');
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          move('DOWN');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center select-none animate-in fade-in duration-300">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>놀이터 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🔢</span>
          <h1 className="text-xl sm:text-2xl font-black font-arcade text-white tracking-wider">
            2048 퍼즐
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={undoMove}
            disabled={!prevBoard}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-30 cursor-pointer"
            title="되돌리기"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={startNewGame}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="새 게임"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="relative p-5 rounded-3xl bg-[#BBADA0] shadow-2xl flex flex-col items-center">
        {/* Score Header inside board */}
        <div className="w-full flex items-center justify-between mb-3 px-1">
          <div className="text-2xl font-black text-[#776E65] font-arcade">2048</div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-[#8F7A66] rounded-xl text-center shadow-xs">
              <div className="text-[9px] font-black text-[#EEE4DA] uppercase">SCORE</div>
              <div className="text-base font-black text-white font-mono">{score}</div>
            </div>
            <div className="px-3 py-1.5 bg-[#8F7A66] rounded-xl text-center shadow-xs">
              <div className="text-[9px] font-black text-[#EEE4DA] uppercase">BEST</div>
              <div className="text-base font-black text-white font-mono">{highScore}</div>
            </div>
          </div>
        </div>

        {/* 4x4 Grid */}
        <div
          className="relative bg-[#CDC1B4] rounded-2xl p-2.5 grid grid-cols-4 gap-2.5 shadow-inner"
          style={{ width: '310px', height: '310px' }}
        >
          {board.map((row, r) =>
            row.map((val, c) => {
              const tileStyle = val > 0 ? TILE_COLORS[val] || TILE_COLORS[4096] : null;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`w-full h-full rounded-xl flex items-center justify-center font-black transition-transform duration-75 select-none ${
                    val === 0
                      ? 'bg-[#E5DBCE]/60'
                      : `${tileStyle?.bg} ${tileStyle?.text} ${tileStyle?.size} shadow-md animate-in zoom-in-75`
                  }`}
                >
                  {val > 0 && val}
                </div>
              );
            })
          )}
        </div>

        {/* Overlays */}
        {hasWon && !keepPlaying && (
          <div className="absolute inset-0 bg-[#EDC22E]/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center z-30 animate-in zoom-in-95">
            <div className="text-4xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-3xl font-black text-white font-arcade mb-1">YOU WIN!</h2>
            <p className="text-xs text-white/90 font-bold mb-4">
              2048 타일을 완성하셨습니다! 계속해서 더 높은 숫자에 도전하시겠습니까?
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setKeepPlaying(true)}
                className="px-5 py-2.5 rounded-xl bg-white text-[#776E65] font-black text-xs shadow-md cursor-pointer hover:bg-slate-100"
              >
                계속 플레이
              </button>
              <button
                onClick={startNewGame}
                className="px-5 py-2.5 rounded-xl bg-[#8F7A66] text-white font-black text-xs shadow-md cursor-pointer hover:bg-[#776E65]"
              >
                새 게임
              </button>
            </div>
          </div>
        )}

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center z-30 animate-in zoom-in-95">
            <div className="text-4xl mb-2">💫</div>
            <h2 className="text-2xl font-black text-rose-500 font-arcade mb-1">GAME OVER</h2>
            <p className="text-xs text-slate-300 font-bold mb-4">
              더 이상 움직일 수 있는 타일이 없습니다.
            </p>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs shadow-lg active:scale-95 transition cursor-pointer"
            >
              다시 도전하기
            </button>
          </div>
        )}
      </div>

      {/* D-Pad Buttons for Mobile / Touch */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <button
          onClick={() => move('UP')}
          className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 text-white font-bold flex items-center justify-center text-xl shadow-md cursor-pointer"
        >
          ▲
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => move('LEFT')}
            className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 text-white font-bold flex items-center justify-center text-xl shadow-md cursor-pointer"
          >
            ◀
          </button>
          <button
            onClick={() => move('DOWN')}
            className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 text-white font-bold flex items-center justify-center text-xl shadow-md cursor-pointer"
          >
            ▼
          </button>
          <button
            onClick={() => move('RIGHT')}
            className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 text-white font-bold flex items-center justify-center text-xl shadow-md cursor-pointer"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
