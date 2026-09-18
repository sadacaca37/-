import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Bomb, 
  Trophy,
  Rocket
} from 'lucide-react';
import { soundManager } from '../../../utils/sound';
import { addTypingPracticePoints } from '../../../utils/tamagotchiStorage';
import confetti from 'canvas-confetti';

interface SpaceWordDefenseGameProps {
  onBack?: () => void;
  currentUser?: any;
}

interface Invader {
  id: number;
  word: string;
  x: number; // percentage (10 to 90)
  y: number; // percentage (0 to 100)
  speed: number;
  isBoss?: boolean;
  hp?: number;
  maxHp?: number;
}

const SPACE_WORDS = [
  '우주', '행성', '은하', '성운', '혜성', 
  '워프', '블랙홀', '레이저', '중력', '궤도',
  '광속', '안드로메다', '초신성', '오로라', '태양풍',
  '우주선', '스타더스트', '시공간', '성단', '펄서'
];

const BOSS_WORDS = [
  '인터스텔라', '우주정거장', '사건의지평선', '초거대블랙홀', '안드로메다은하'
];

export const SpaceWordDefenseGame: React.FC<SpaceWordDefenseGameProps> = ({ onBack, currentUser }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [wave, setWave] = useState<number>(1);
  const [shieldHp, setShieldHp] = useState<number>(100);
  const [bombCount, setBombCount] = useState<number>(2);
  const [inputVal, setInputVal] = useState<string>('');
  const [laserTarget, setLaserTarget] = useState<{ x: number; y: number } | null>(null);

  const invadersRef = useRef<Invader[]>([]);
  const [renderInvaders, setRenderInvaders] = useState<Invader[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const nextIdRef = useRef<number>(1);
  const lastSpawnRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setWave(1);
    setShieldHp(100);
    setBombCount(2);
    setInputVal('');
    invadersRef.current = [];
    setRenderInvaders([]);
    nextIdRef.current = 1;
    lastSpawnRef.current = Date.now();
    inputRef.current?.focus();
    soundManager.playSuccess();
  };

  const fireEmpBomb = () => {
    if (bombCount <= 0 || gameState !== 'playing') return;
    setBombCount((prev) => prev - 1);
    soundManager.playVictory();
    try {
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
    } catch {}
    
    // Eliminate all current invaders
    const count = invadersRef.current.length;
    setScore((prev) => prev + count * 100);
    invadersRef.current = [];
    setRenderInvaders([]);
  };

  // Game Animation Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const now = Date.now();
      const spawnInterval = Math.max(1200, 2600 - wave * 250);

      // Spawn new alien ships
      if (now - lastSpawnRef.current > spawnInterval) {
        const isBossSpawn = Math.random() < 0.15 && wave >= 2;
        const wordPool = isBossSpawn ? BOSS_WORDS : SPACE_WORDS;
        const randomWord = wordPool[Math.floor(Math.random() * wordPool.length)];
        const xPos = 12 + Math.random() * 76;

        invadersRef.current.push({
          id: nextIdRef.current++,
          word: randomWord,
          x: xPos,
          y: 0,
          speed: isBossSpawn ? 6 : 8 + wave * 1.5,
          isBoss: isBossSpawn,
        });

        lastSpawnRef.current = now;
      }

      // Update invaders positions
      const nextInvaders: Invader[] = [];
      let damageTaken = 0;

      for (const ship of invadersRef.current) {
        const nextY = ship.y + ship.speed * delta;
        if (nextY >= 92) {
          // Invader reached planetary defense shield
          damageTaken += ship.isBoss ? 25 : 15;
        } else {
          nextInvaders.push({ ...ship, y: nextY });
        }
      }

      if (damageTaken > 0) {
        soundManager.playError();
        setShieldHp((prev) => {
          const nextHp = prev - damageTaken;
          if (nextHp <= 0) {
            setGameState('gameover');
            soundManager.playError();
            return 0;
          }
          return nextHp;
        });
      }

      invadersRef.current = nextInvaders;
      setRenderInvaders([...nextInvaders]);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, wave]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setInputVal(val);

    // Check for target match
    const hitIndex = invadersRef.current.findIndex((inv) => inv.word === val);
    if (hitIndex !== -1) {
      const target = invadersRef.current[hitIndex];

      // Laser shot visual
      setLaserTarget({ x: target.x, y: target.y });
      setTimeout(() => setLaserTarget(null), 180);

      soundManager.playKeyClick(true);
      const points = target.isBoss ? 500 : 150;
      setScore((prev) => {
        const nextScore = prev + points;
        if (nextScore > wave * 1200) {
          setWave((w) => w + 1);
        }
        return nextScore;
      });

      invadersRef.current = invadersRef.current.filter((_, i) => i !== hitIndex);
      setRenderInvaders([...invadersRef.current]);
      setInputVal('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-300">
      {/* Header */}
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
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-black border border-cyan-500/40">
                기본 플레이 · 무료
              </span>
              <span className="text-xs text-slate-400 font-bold">SF 아케이드 디펜스</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-300 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-cyan-400" />
              <span>스페이스 워드 디펜스</span>
            </h1>
          </div>
        </div>

        {/* EMP Bomb Trigger Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={fireEmpBomb}
            disabled={bombCount <= 0 || gameState !== 'playing'}
            className={`px-3.5 py-1.5 rounded-xl font-black font-arcade text-xs flex items-center gap-1.5 transition ${
              bombCount > 0 && gameState === 'playing'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg hover:scale-105 active:scale-95 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Bomb className="w-4 h-4" />
            <span>EMP BOMB x{bombCount}</span>
          </button>
        </div>
      </div>

      {/* Galaxy Space Arena */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.2)] bg-slate-950">
        {/* HUD Info */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900/90 border-b border-slate-800 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-400">SCORE</div>
            <div className="text-lg font-black font-mono text-cyan-400">{score}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">SECTOR WAVE</div>
            <div className="text-lg font-black font-mono text-indigo-400">WAVE {wave}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">SHIELD</div>
            <div className="w-full bg-slate-800 h-3 rounded-full mt-1.5 overflow-hidden p-0.5 border border-slate-700">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  shieldHp > 50 ? 'bg-cyan-500' : shieldHp > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${shieldHp}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">ENEMIES</div>
            <div className="text-lg font-black font-mono text-rose-400">
              👾 {renderInvaders.length}
            </div>
          </div>
        </div>

        {/* Deep Space Background Canvas */}
        <div className="relative h-[430px] sm:h-[470px] overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black">
          {/* Subtle Twinkling Stars */}
          <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Invading UFO Ships */}
          {renderInvaders.map((ship) => (
            <div
              key={ship.id}
              className="absolute -translate-x-1/2 transition-transform duration-75 pointer-events-none z-20"
              style={{
                left: `${ship.x}%`,
                top: `${ship.y}%`,
              }}
            >
              <div className={`px-3 py-1.5 rounded-2xl flex flex-col items-center gap-1 shadow-xl border-2 ${
                ship.isBoss 
                  ? 'bg-rose-950/90 border-rose-400 text-rose-300 shadow-rose-500/50 scale-110 animate-pulse' 
                  : 'bg-slate-900/90 border-cyan-400 text-cyan-300 shadow-cyan-500/30'
              }`}>
                <span className="text-xl leading-none">
                  {ship.isBoss ? '🛸' : '👾'}
                </span>
                <span className="font-mono font-black text-xs sm:text-sm tracking-wider px-2 py-0.5 rounded-md bg-black/60 border border-white/10">
                  {ship.word}
                </span>
              </div>
            </div>
          ))}

          {/* Laser Beam Visual FX */}
          {laserTarget && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
              <line
                x1="50%"
                y1="100%"
                x2={`${laserTarget.x}%`}
                y2={`${laserTarget.y}%`}
                stroke="#22d3ee"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-pulse"
              />
            </svg>
          )}

          {/* Planet Defense Base at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-cyan-950/80 to-transparent border-t border-cyan-500/40 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-cyan-900/90 border-2 border-cyan-400 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(6,182,212,0.8)] -mb-7">
              🛰️
            </div>
          </div>

          {/* Idle / Gameover Overlays */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-40 p-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400 text-cyan-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                  🚀
                </div>
                <div>
                  <h2 className="text-2xl font-black font-arcade text-white">스페이스 워드 디펜스</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                    우주에서 침공해오는 외계 우주선의 단어를 빠르게 타이핑하여 레이저 포탑으로 격추하세요! 방어 쉴드를 지켜내고 은하계 섹터를 방어하세요.
                  </p>
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black font-arcade text-base shadow-xl transition-transform active:scale-95 cursor-pointer"
                >
                  START DEFENSE (방어 시작) 🛡️
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-in fade-in">
              <div className="text-center space-y-4 max-w-sm">
                <div className="text-4xl">💥</div>
                <h2 className="text-2xl font-black font-arcade text-rose-400">DEFENSE COMPROMISED</h2>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">방어 스코어</div>
                  <div className="text-2xl font-black font-mono text-cyan-400">{score} PTS</div>
                  <div className="text-xs text-slate-400">달성 웨이브: {wave} SECTOR</div>
                </div>
                <button
                  onClick={startGame}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-rose-500 text-white font-black font-arcade text-sm shadow-lg transition active:scale-95 cursor-pointer"
                >
                  기지 재구축 및 재도전 🔄
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            disabled={gameState !== 'playing'}
            placeholder={gameState === 'playing' ? '외계 우주선 단어를 타이핑하여 레이저 발사!' : '방어 시작 버튼을 눌러주세요'}
            className="flex-1 px-5 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-cyan-300 font-bold text-center text-base sm:text-lg focus:outline-none focus:border-cyan-400 shadow-inner placeholder:text-slate-600"
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
      </div>
    </div>
  );
};
