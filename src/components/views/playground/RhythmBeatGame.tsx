import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Sparkles, 
  Flame, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Zap,
  Music
} from 'lucide-react';
import { soundManager } from '../../../utils/sound';
import { addTypingPracticePoints } from '../../../utils/tamagotchiStorage';
import confetti from 'canvas-confetti';

interface RhythmBeatGameProps {
  onBack?: () => void;
  currentUser?: any;
}

interface Note {
  id: number;
  word: string;
  lane: number; // 0, 1, 2, 3
  y: number; // 0 to 100 (%)
  speed: number;
  isHit: boolean;
}

const RHYTHM_WORDS = [
  '비트', '리듬', '템포', '그루브', '멜로디', 
  '드럼', '베이스', '신스', '드롭', '코러스',
  '바이브', '클랩', '스네어', '하이햇', '셔플',
  '어택', '에코', '하모니', '소울', '스윙'
];

const LANE_KEYS = ['D', 'F', 'J', 'K'];
const LANE_COLORS = [
  { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-400', glow: 'shadow-rose-500/50' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-400', glow: 'shadow-amber-500/50' },
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-400', glow: 'shadow-emerald-500/50' },
  { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-400', glow: 'shadow-cyan-500/50' },
];

export const RhythmBeatGame: React.FC<RhythmBeatGameProps> = ({ onBack, currentUser }) => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover' | 'victory'>('idle');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [fever, setFever] = useState<number>(0); // 0 - 100
  const [isFeverMode, setIsFeverMode] = useState<boolean>(false);
  const [hp, setHp] = useState<number>(100);
  const [judgment, setJudgment] = useState<{ text: string; color: string; id: number } | null>(null);
  const [inputVal, setInputVal] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [bpm, setBpm] = useState<number>(120);

  const notesRef = useRef<Note[]>([]);
  const [renderNotes, setRenderNotes] = useState<Note[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const nextNoteIdRef = useRef<number>(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const beatTimerRef = useRef<number | null>(null);

  // Simple Web Audio synth beat generator
  const playBeatSound = (freq = 150, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setFever(0);
    setIsFeverMode(false);
    setHp(100);
    setJudgment(null);
    setInputVal('');
    notesRef.current = [];
    setRenderNotes([]);
    nextNoteIdRef.current = 1;
    lastSpawnTimeRef.current = Date.now();
    inputRef.current?.focus();
    soundManager.playSuccess();
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    // Start background rhythm beat loop
    const beatInterval = (60 / bpm) * 1000;
    let beatStep = 0;
    beatTimerRef.current = window.setInterval(() => {
      if (beatStep % 4 === 0) {
        playBeatSound(180, 'sine', 0.12); // Kick
      } else if (beatStep % 4 === 2) {
        playBeatSound(420, 'triangle', 0.08); // Snare
      } else {
        playBeatSound(800, 'square', 0.03); // Hihat
      }
      beatStep++;
    }, beatInterval / 2);

    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      // Spawn notes periodically
      const now = Date.now();
      const spawnRate = isFeverMode ? 900 : 1300;
      if (now - lastSpawnTimeRef.current > spawnRate) {
        const lane = Math.floor(Math.random() * 4);
        const randomWord = RHYTHM_WORDS[Math.floor(Math.random() * RHYTHM_WORDS.length)];
        notesRef.current.push({
          id: nextNoteIdRef.current++,
          word: randomWord,
          lane,
          y: 0,
          speed: (isFeverMode ? 28 : 22) + (bpm - 100) * 0.08,
          isHit: false,
        });
        lastSpawnTimeRef.current = now;
      }

      // Update notes positions
      const nextNotes: Note[] = [];
      let missedCount = 0;

      for (const note of notesRef.current) {
        if (note.isHit) continue;
        const newY = note.y + note.speed * delta;

        if (newY >= 98) {
          // Missed note
          missedCount++;
        } else {
          nextNotes.push({ ...note, y: newY });
        }
      }

      if (missedCount > 0) {
        setCombo(0);
        setHp((prev) => {
          const nextHp = prev - missedCount * 12;
          if (nextHp <= 0) {
            setGameState('gameover');
            soundManager.playError();
            return 0;
          }
          return nextHp;
        });
        setFever((prev) => Math.max(0, prev - 15));
        setJudgment({ text: 'MISS!', color: 'text-rose-500', id: Date.now() });
        soundManager.playError();
      }

      notesRef.current = nextNotes;
      setRenderNotes([...nextNotes]);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (beatTimerRef.current) clearInterval(beatTimerRef.current);
    };
  }, [gameState, isFeverMode, bpm, soundEnabled]);

  // Fever Mode countdown
  useEffect(() => {
    if (fever >= 100 && !isFeverMode) {
      setIsFeverMode(true);
      soundManager.playVictory();
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      } catch {}
      const timer = setTimeout(() => {
        setIsFeverMode(false);
        setFever(0);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [fever, isFeverMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    setInputVal(val);

    // Find if any note matches typed word
    // Prioritize notes that are closest to the target judgment line (y around 70 - 90)
    let candidateIndex = -1;
    let bestY = -1;

    for (let i = 0; i < notesRef.current.length; i++) {
      const note = notesRef.current[i];
      if (!note.isHit && note.word === val && note.y >= 30) {
        if (note.y > bestY) {
          bestY = note.y;
          candidateIndex = i;
        }
      }
    }

    if (candidateIndex !== -1) {
      const hitNote = notesRef.current[candidateIndex];
      hitNote.isHit = true;

      // Calculate accuracy judgment based on y position (Target sweet spot is 75 - 88)
      let pts = 100;
      let judgeText = 'GOOD!';
      let judgeColor = 'text-amber-400';

      if (bestY >= 72 && bestY <= 90) {
        pts = 300;
        judgeText = 'PERFECT!!';
        judgeColor = 'text-cyan-400 font-black';
        soundManager.playKeyClick(true);
      } else if (bestY >= 58 && bestY <= 94) {
        pts = 200;
        judgeText = 'GREAT!';
        judgeColor = 'text-emerald-400';
        soundManager.playKeyClick(true);
      } else {
        pts = 100;
        judgeText = 'EARLY!';
        judgeColor = 'text-yellow-300';
      }

      if (isFeverMode) pts *= 2;

      setScore((prev) => prev + pts);
      setCombo((prev) => {
        const nextCombo = prev + 1;
        setMaxCombo((m) => Math.max(m, nextCombo));
        return nextCombo;
      });
      setFever((prev) => Math.min(100, prev + 12));
      setHp((prev) => Math.min(100, prev + 5));
      setJudgment({ text: judgeText, color: judgeColor, id: Date.now() });

      // Clean up matched note immediately
      notesRef.current = notesRef.current.filter((n) => n.id !== hitNote.id);
      setRenderNotes([...notesRef.current]);
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
              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[10px] font-black border border-purple-500/40">
                기본 플레이 · 무료
              </span>
              <span className="text-xs text-slate-400 font-bold">4-레인 리듬 배틀</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black font-arcade text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 flex items-center gap-2">
              <Music className="w-5 h-5 text-pink-400" />
              <span>리듬 비트 타자 배틀</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="비트 사운드 토글"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* BPM Selector */}
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-300">
            <span>BPM</span>
            <select
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="bg-transparent text-pink-400 font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value={100} className="bg-slate-900">100 (보통)</option>
              <option value={130} className="bg-slate-900">130 (빠름)</option>
              <option value={160} className="bg-slate-900">160 (광속)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Arcade Stage */}
      <div className={`relative rounded-3xl overflow-hidden border-2 transition-all ${
        isFeverMode 
          ? 'border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.4)] bg-slate-950' 
          : 'border-slate-800 shadow-2xl bg-slate-950'
      }`}>
        {/* HUD Header */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-400">SCORE</div>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-400">{score}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">COMBO</div>
            <div className="text-lg sm:text-xl font-black font-mono text-pink-400">
              {combo > 0 ? `🔥 ${combo}` : '-'}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">FEVER</div>
            <div className="w-full bg-slate-800 h-3 rounded-full mt-1.5 overflow-hidden p-0.5 border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${fever}%` }}
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400">SHIELD HP</div>
            <div className="w-full bg-slate-800 h-3 rounded-full mt-1.5 overflow-hidden p-0.5 border border-slate-700">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  hp > 50 ? 'bg-emerald-500' : hp > 25 ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                }`}
                style={{ width: `${hp}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4 Lanes Track Area */}
        <div className="relative h-[420px] sm:h-[460px] grid grid-cols-4 divide-x divide-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 overflow-hidden">
          {/* Lane Tracks */}
          {[0, 1, 2, 3].map((laneIndex) => (
            <div key={laneIndex} className="relative h-full flex flex-col justify-between">
              {/* Lane Header Key */}
              <div className="p-2 text-center border-b border-slate-800/40">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${LANE_COLORS[laneIndex].bg}/20 ${LANE_COLORS[laneIndex].text} border ${LANE_COLORS[laneIndex].border}/40`}>
                  LANE {laneIndex + 1}
                </span>
              </div>

              {/* Lane Hit Indicator at Bottom */}
              <div className="p-3 text-center border-t border-slate-800/50 bg-slate-900/40">
                <div className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center font-mono font-black text-sm border-2 ${LANE_COLORS[laneIndex].border} ${LANE_COLORS[laneIndex].text} bg-slate-900 shadow-inner`}>
                  {LANE_KEYS[laneIndex]}
                </div>
              </div>
            </div>
          ))}

          {/* Target Judgment Line (판정선) */}
          <div className="absolute left-0 right-0 top-[78%] h-1 bg-gradient-to-r from-pink-500 via-cyan-400 to-amber-400 shadow-[0_0_15px_rgba(236,72,153,0.8)] z-10 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-black font-arcade text-white/80 bg-slate-950/80 px-3 py-0.5 rounded-full border border-pink-500/40 shadow-xs">
              JUDGMENT LINE (타이핑 완타 구역)
            </span>
          </div>

          {/* Falling Beat Word Notes */}
          {renderNotes.map((note) => {
            const laneLeft = `${note.lane * 25}%`;
            return (
              <div
                key={note.id}
                className="absolute z-20 -translate-x-1/2 transition-transform duration-75 pointer-events-none"
                style={{
                  left: `calc(${laneLeft} + 12.5%)`,
                  top: `${note.y}%`,
                }}
              >
                <div className={`px-3 py-1.5 rounded-xl font-bold font-serif text-xs sm:text-sm text-white shadow-lg border-2 ${
                  LANE_COLORS[note.lane].border
                } ${LANE_COLORS[note.lane].bg} ${LANE_COLORS[note.lane].glow} flex items-center gap-1.5 animate-bounce-subtle`}>
                  <span>🎵</span>
                  <span className="font-black tracking-wide">{note.word}</span>
                </div>
              </div>
            );
          })}

          {/* Floating Judgment Popup */}
          {judgment && (
            <div 
              key={judgment.id}
              className="absolute left-1/2 top-[68%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none animate-in fade-in zoom-in duration-150"
            >
              <div className={`text-2xl sm:text-3xl font-black font-arcade ${judgment.color} drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]`}>
                {judgment.text}
              </div>
            </div>
          )}

          {/* Fever Aura Effect */}
          {isFeverMode && (
            <div className="absolute inset-0 border-4 border-pink-500/50 pointer-events-none z-10 animate-pulse flex items-start justify-center pt-8">
              <span className="px-4 py-1 rounded-full bg-pink-600 text-white font-black font-arcade text-sm shadow-xl tracking-widest animate-bounce">
                ⚡ FEVER MODE ACTIVE (2X SCORE) ⚡
              </span>
            </div>
          )}

          {/* Idle / Gameover / Victory Overlays */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-40 p-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500 text-purple-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                  🎵
                </div>
                <div>
                  <h2 className="text-2xl font-black font-arcade text-white">리듬 비트 타자 배틀</h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed font-medium">
                    비트에 맞춰 떨어지는 음악 단어 노트를 판정선에 맞춰 빠르게 타이핑하세요! 콤보를 모아 <strong>FEVER 모드</strong>를 발동하면 2배 보너스를 획득합니다.
                  </p>
                </div>
                <button
                  onClick={startGame}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:from-purple-400 hover:to-amber-400 text-white font-black font-arcade text-base shadow-xl transition-transform active:scale-95 cursor-pointer"
                >
                  START BEAT (게임 시작) 🚀
                </button>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-in fade-in">
              <div className="text-center space-y-4 max-w-sm">
                <div className="text-4xl">💥</div>
                <h2 className="text-2xl font-black font-arcade text-rose-400">STAGE FAILED</h2>
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="text-xs text-slate-400">최종 점수</div>
                  <div className="text-2xl font-black font-mono text-amber-400">{score} PTS</div>
                  <div className="text-xs text-slate-400">최대 콤보: {maxCombo} 연타</div>
                </div>
                <button
                  onClick={startGame}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black font-arcade text-sm shadow-lg transition active:scale-95 cursor-pointer"
                >
                  다시 도전하기 🔄
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Typing Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={handleInputChange}
              disabled={gameState !== 'playing'}
              placeholder={gameState === 'playing' ? '떨어지는 음악 단어를 입력하세요!' : '게임 시작을 눌러주세요'}
              className="w-full px-5 py-3 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white font-bold text-center text-base sm:text-lg focus:outline-none focus:border-pink-500 shadow-inner placeholder:text-slate-600"
              autoFocus
            />
          </div>

          <button
            onClick={startGame}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="게임 다시 시작"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
