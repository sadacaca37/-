import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface TetrisGameProps {
  onBack?: () => void;
  currentUser?: any;
}

const COLS = 10;
const ROWS = 20;

// Tetromino definitions
type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string; glow: string }> = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.6)' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.6)' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#f97316', glow: 'rgba(249, 115, 22, 0.6)' },
  O: { shape: [[1, 1], [1, 1]], color: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' }
};

const TETROMINO_KEYS: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

function getRandomTetromino(): TetrominoType {
  return TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
}

function rotateMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

// 10 Level Speed Table (ms per drop)
const LEVEL_SPEEDS = [
  800, // Level 1 (여유)
  720, // Level 2
  640, // Level 3
  560, // Level 4
  480, // Level 5 (표준)
  400, // Level 6
  320, // Level 7
  240, // Level 8 (스피드)
  170, // Level 9 (고속)
  110, // Level 10 (초고속 마스터)
];

export const TetrisGame: React.FC<TetrisGameProps> = ({ onBack }) => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );

  const [currentPiece, setCurrentPiece] = useState<{
    type: TetrominoType;
    shape: number[][];
    x: number;
    y: number;
  }>({
    type: 'T',
    shape: TETROMINOES.T.shape,
    x: 3,
    y: 0
  });

  const nextPieceRef = useRef<TetrominoType>(getRandomTetromino());
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);

  const [score, setScore] = useState<number>(0);
  const [lines, setLines] = useState<number>(0);
  const [selectedStartLevel, setSelectedStartLevel] = useState<number>(1);
  const [level, setLevel] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('tetris_high_score') || '0');
    } catch {
      return 0;
    }
  });

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const lastDropTimeRef = useRef<number>(0);

  const checkCollision = useCallback(
    (shape: number[][], posX: number, posY: number, testBoard: (string | null)[][]): boolean => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const newX = posX + c;
            const newY = posY + r;
            if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
            if (newY >= 0 && testBoard[newY][newX] !== null) return true;
          }
        }
      }
      return false;
    },
    []
  );

  const spawnNextPiece = useCallback(
    (prevBoard: (string | null)[][]) => {
      const type = nextPieceRef.current;
      nextPieceRef.current = getRandomTetromino();
      const shape = TETROMINOES[type].shape;
      const startX = Math.floor((COLS - shape[0].length) / 2);
      const startY = 0;

      if (checkCollision(shape, startX, startY, prevBoard)) {
        // Game Over
        setGameState('gameover');
        soundManager.playError();
        return;
      }

      setCurrentPiece({ type, shape, x: startX, y: startY });
      setCanHold(true);
    },
    [checkCollision]
  );

  const lockPiece = useCallback(() => {
    setBoard((prevBoard) => {
      const newBoard = prevBoard.map((row) => [...row]);
      const color = TETROMINOES[currentPiece.type].color;

      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const x = currentPiece.x + c;
            const y = currentPiece.y + r;
            if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
              newBoard[y][x] = color;
            }
          }
        }
      }

      // Check line clears
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (newBoard[r].every((cell) => cell !== null)) {
          newBoard.splice(r, 1);
          newBoard.unshift(Array(COLS).fill(null));
          cleared++;
          r++; // recheck same row index
        }
      }

      if (cleared > 0) {
        soundManager.playSuccess();
        const lineScores = [0, 100, 300, 500, 800];
        const addScore = (lineScores[cleared] || 100) * level;
        setScore((prev) => {
          const next = prev + addScore;
          if (next > highScore) {
            setHighScore(next);
            try {
              localStorage.setItem('tetris_high_score', String(next));
            } catch {}
          }
          return next;
        });
        setLines((prev) => {
          const nextLines = prev + cleared;
          // Progress level up to 10
          const calculatedLevel = Math.min(10, selectedStartLevel + Math.floor(nextLines / 10));
          setLevel(calculatedLevel);
          return nextLines;
        });
      } else {
        soundManager.playClick();
      }

      spawnNextPiece(newBoard);
      return newBoard;
    });
  }, [currentPiece, level, selectedStartLevel, highScore, spawnNextPiece]);

  const moveLeft = useCallback(() => {
    if (gameState !== 'playing') return;
    if (!checkCollision(currentPiece.shape, currentPiece.x - 1, currentPiece.y, board)) {
      setCurrentPiece((prev) => ({ ...prev, x: prev.x - 1 }));
      soundManager.playClick();
    }
  }, [gameState, currentPiece, board, checkCollision]);

  const moveRight = useCallback(() => {
    if (gameState !== 'playing') return;
    if (!checkCollision(currentPiece.shape, currentPiece.x + 1, currentPiece.y, board)) {
      setCurrentPiece((prev) => ({ ...prev, x: prev.x + 1 }));
      soundManager.playClick();
    }
  }, [gameState, currentPiece, board, checkCollision]);

  const rotate = useCallback(() => {
    if (gameState !== 'playing') return;
    const rotated = rotateMatrix(currentPiece.shape);
    // Wall kick attempts
    const kicks = [0, -1, 1, -2, 2];
    for (const offset of kicks) {
      if (!checkCollision(rotated, currentPiece.x + offset, currentPiece.y, board)) {
        setCurrentPiece((prev) => ({ ...prev, shape: rotated, x: prev.x + offset }));
        soundManager.playClick();
        return;
      }
    }
  }, [gameState, currentPiece, board, checkCollision]);

  const moveDown = useCallback(() => {
    if (gameState !== 'playing') return;
    if (!checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y + 1, board)) {
      setCurrentPiece((prev) => ({ ...prev, y: prev.y + 1 }));
      setScore((s) => s + 1);
    } else {
      lockPiece();
    }
  }, [gameState, currentPiece, board, checkCollision, lockPiece]);

  const hardDrop = useCallback(() => {
    if (gameState !== 'playing') return;
    let dropY = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, dropY + 1, board)) {
      dropY++;
    }
    const dropDistance = dropY - currentPiece.y;
    setScore((s) => s + dropDistance * 2);
    setCurrentPiece((prev) => ({ ...prev, y: dropY }));
    setTimeout(() => lockPiece(), 20);
  }, [gameState, currentPiece, board, checkCollision, lockPiece]);

  const handleHold = useCallback(() => {
    if (gameState !== 'playing' || !canHold) return;
    setCanHold(false);
    soundManager.playClick();

    if (!holdPiece) {
      setHoldPiece(currentPiece.type);
      spawnNextPiece(board);
    } else {
      const prevHold = holdPiece;
      setHoldPiece(currentPiece.type);
      const shape = TETROMINOES[prevHold].shape;
      const startX = Math.floor((COLS - shape[0].length) / 2);
      setCurrentPiece({
        type: prevHold,
        shape,
        x: startX,
        y: 0
      });
    }
  }, [gameState, canHold, holdPiece, currentPiece, board, spawnNextPiece]);

  const startGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(null)));
    setScore(0);
    setLines(0);
    setLevel(selectedStartLevel);
    setHoldPiece(null);
    setCanHold(true);

    const first = getRandomTetromino();
    nextPieceRef.current = getRandomTetromino();
    const shape = TETROMINOES[first].shape;
    setCurrentPiece({
      type: first,
      shape,
      x: Math.floor((COLS - shape[0].length) / 2),
      y: 0
    });
    setGameState('playing');
    soundManager.playSuccess();
    lastDropTimeRef.current = Date.now();
  };

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (e.code === 'Space' && (gameState === 'idle' || gameState === 'gameover')) {
          startGame();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
          e.preventDefault();
          rotate();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          moveDown();
          break;
        case 'Space':
          e.preventDefault();
          hardDrop();
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          e.preventDefault();
          handleHold();
          break;
        case 'KeyP':
        case 'Escape':
          e.preventDefault();
          setGameState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, moveLeft, moveRight, rotate, moveDown, hardDrop, handleHold]);

  // Main game loop (drop speed based on 10 Levels)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const currentSpeed = LEVEL_SPEEDS[Math.min(10, Math.max(1, level)) - 1] || 480;

    const interval = setInterval(() => {
      moveDown();
    }, currentSpeed);

    return () => clearInterval(interval);
  }, [gameState, level, moveDown]);

  // Ghost piece calculation
  const ghostY = React.useMemo(() => {
    if (gameState !== 'playing') return currentPiece.y;
    let y = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, y + 1, board)) {
      y++;
    }
    return y;
  }, [currentPiece, board, checkCollision, gameState]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center select-none animate-in fade-in duration-300">
      {/* Title & Back Button */}
      <div className="w-full flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>놀이터 홈</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🧱</span>
          <h1 className="text-xl sm:text-2xl font-black font-arcade text-white tracking-wider">
            클래식 테트리스 (Tetris)
          </h1>
        </div>

        <button
          onClick={() => {
            if (gameState === 'playing') setGameState('paused');
            else if (gameState === 'paused') setGameState('playing');
          }}
          disabled={gameState === 'idle' || gameState === 'gameover'}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-30 cursor-pointer"
        >
          {gameState === 'paused' ? '계속하기' : '일시정지'}
        </button>
      </div>

      {/* Game Layout (미리보기 제거 & 좌우 균형 레이아웃) */}
      <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-5">
        {/* Left Panel: Hold & Best Score */}
        <div className="w-full lg:w-44 flex lg:flex-col justify-between gap-3">
          {/* Hold Box */}
          <div className="flex-1 lg:flex-initial p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 text-center shadow-lg">
            <div className="text-[11px] font-black text-slate-400 font-arcade mb-2 uppercase tracking-wider">
              HOLD [C]
            </div>
            <div className="w-16 h-16 mx-auto bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center">
              {holdPiece && (
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${TETROMINOES[holdPiece].shape[0].length}, 12px)`
                  }}
                >
                  {TETROMINOES[holdPiece].shape.map((row, r) =>
                    row.map((cell, c) => (
                      <div
                        key={`${r}-${c}`}
                        className="w-3 h-3 rounded-xs"
                        style={{
                          backgroundColor: cell ? TETROMINOES[holdPiece].color : 'transparent'
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* High Score Box */}
          <div className="flex-1 lg:flex-initial p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-lg text-center">
            <div className="text-[10px] font-black text-amber-400 font-arcade flex items-center justify-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>BEST</span>
            </div>
            <div className="text-lg font-black text-white font-mono mt-0.5">
              {highScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Center: Tetris Board Canvas */}
        <div className="relative p-3 rounded-3xl bg-slate-950 border-4 border-indigo-600 shadow-2xl">
          <div
            className="grid gap-[1px] bg-slate-900/90 rounded-2xl p-1.5"
            style={{
              gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
              width: '280px',
              height: '560px'
            }}
          >
            {Array.from({ length: ROWS }).map((_, r) =>
              Array.from({ length: COLS }).map((_, c) => {
                let cellColor = board[r][c];
                let isCurrent = false;
                let isGhost = false;

                if (gameState === 'playing') {
                  // Active piece
                  const pr = r - currentPiece.y;
                  const pc = c - currentPiece.x;
                  if (
                    pr >= 0 &&
                    pr < currentPiece.shape.length &&
                    pc >= 0 &&
                    pc < currentPiece.shape[0].length &&
                    currentPiece.shape[pr][pc]
                  ) {
                    cellColor = TETROMINOES[currentPiece.type].color;
                    isCurrent = true;
                  }

                  // Ghost piece
                  const gr = r - ghostY;
                  if (
                    !isCurrent &&
                    gr >= 0 &&
                    gr < currentPiece.shape.length &&
                    pc >= 0 &&
                    pc < currentPiece.shape[0].length &&
                    currentPiece.shape[gr][pc]
                  ) {
                    isGhost = true;
                  }
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`rounded-[3px] transition-all ${
                      cellColor
                        ? 'border border-white/20 shadow-sm'
                        : isGhost
                        ? 'border border-white/30 bg-white/5'
                        : 'bg-slate-950/60 border border-slate-900/50'
                    }`}
                    style={{
                      backgroundColor: cellColor || (isGhost ? 'rgba(255,255,255,0.06)' : undefined)
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Overlay Screens: 레벨 10단계 선택기 포함 */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-2xl mb-2 border border-indigo-500/40 animate-bounce">
                🧱
              </div>
              <h2 className="text-xl font-black text-white font-arcade mb-1">TETRIS</h2>

              {/* 10단계 레벨 선택기 */}
              <div className="w-full max-w-xs bg-slate-900/90 p-3 rounded-2xl border border-slate-700 my-2">
                <div className="text-[11px] font-black text-amber-400 font-arcade mb-2">
                  시작 레벨 선택 (1 ~ 10단계)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => {
                        setSelectedStartLevel(lvl);
                        soundManager.play('click');
                      }}
                      className={`py-1.5 rounded-xl font-mono font-black text-xs transition cursor-pointer ${
                        selectedStartLevel === lvl
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md scale-105'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  현재 속도: Lv.{selectedStartLevel} ({LEVEL_SPEEDS[selectedStartLevel - 1]}ms)
                </div>
              </div>

              <button
                onClick={startGame}
                className="mt-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-sm shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>게임 시작 [SPACE]</span>
              </button>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
              <div className="text-4xl mb-2">💥</div>
              <h2 className="text-2xl font-black text-rose-500 font-arcade mb-1">GAME OVER</h2>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 my-3 w-48 text-center space-y-1">
                <div className="text-[10px] font-bold text-slate-400">최종 점수</div>
                <div className="text-xl font-black text-amber-400 font-mono">{score.toLocaleString()}</div>
                <div className="text-[10px] font-bold text-cyan-400 pt-1 border-t border-slate-800">
                  도달 레벨: Lv.{level} / {lines}줄 클리어
                </div>
              </div>
              <button
                onClick={startGame}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm shadow-lg active:scale-95 transition cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>다시 도전하기</span>
              </button>
            </div>
          )}

          {gameState === 'paused' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-2xl font-black text-amber-400 font-arcade mb-3">PAUSED</h2>
              <button
                onClick={() => setGameState('playing')}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow-md"
              >
                계속하기 [P]
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Level 10 Stages Gauge & Stats */}
        <div className="w-full lg:w-44 flex lg:flex-col justify-between gap-3">
          {/* Level 10 Progress Display */}
          <div className="flex-1 lg:flex-initial p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 shadow-lg text-center">
            <div className="text-[10px] font-black text-slate-400 font-arcade mb-1">
              LEVEL (10단계)
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              Lv.{level} <span className="text-xs text-slate-500 font-normal">/ 10</span>
            </div>

            {/* 10 Step Level Gauge */}
            <div className="grid grid-cols-10 gap-0.5 mt-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((lvl) => (
                <div
                  key={lvl}
                  className={`h-2 rounded-xs ${
                    lvl <= level
                      ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-xs'
                      : 'bg-slate-800'
                  }`}
                  title={`Level ${lvl}`}
                />
              ))}
            </div>
            <div className="text-[9px] text-slate-400 mt-1">
              속도: {LEVEL_SPEEDS[level - 1]}ms
            </div>
          </div>

          {/* Stats Box */}
          <div className="flex-1 lg:flex-initial p-4 rounded-2xl bg-slate-900 border-2 border-slate-700 space-y-2.5 shadow-lg text-center">
            <div>
              <div className="text-[10px] font-black text-slate-400 font-arcade">SCORE</div>
              <div className="text-lg font-black text-amber-400 font-mono">
                {score.toLocaleString()}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800">
              <div className="text-[10px] font-black text-slate-400 font-arcade">LINES</div>
              <div className="text-base font-black text-cyan-400 font-mono">{lines}</div>
            </div>
          </div>

          {/* Controls Mini Guide */}
          <div className="hidden lg:block p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
            <div>← / → : 이동</div>
            <div>↑ : 90도 회전</div>
            <div>↓ : 소프트 드롭</div>
            <div>SPACE : 하드 드롭</div>
            <div>C : 홀드</div>
          </div>
        </div>
      </div>

      {/* On-Screen Mobile/Touch D-Pad Controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-sm">
        <button
          onClick={moveLeft}
          className="w-12 h-12 rounded-xl bg-slate-800 active:bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md cursor-pointer"
        >
          ←
        </button>
        <button
          onClick={rotate}
          className="w-12 h-12 rounded-xl bg-indigo-600 active:bg-indigo-500 text-white font-bold flex items-center justify-center text-lg shadow-md cursor-pointer"
        >
          ⟳
        </button>
        <button
          onClick={moveRight}
          className="w-12 h-12 rounded-xl bg-slate-800 active:bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md cursor-pointer"
        >
          →
        </button>
        <button
          onClick={moveDown}
          className="w-12 h-12 rounded-xl bg-slate-800 active:bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-md cursor-pointer"
        >
          ↓
        </button>
        <button
          onClick={hardDrop}
          className="px-4 h-12 rounded-xl bg-amber-600 active:bg-amber-500 text-white font-black text-xs shadow-md cursor-pointer"
        >
          DROP
        </button>
        <button
          onClick={handleHold}
          className="px-3 h-12 rounded-xl bg-purple-700 active:bg-purple-600 text-white font-black text-xs shadow-md cursor-pointer"
        >
          HOLD
        </button>
      </div>
    </div>
  );
};
