import React, { useState, useEffect, useRef } from 'react';
import { GameMode, HighScoreRecord } from '../types';
import { Play, Users, User, Gamepad2, Award, Volume2, ShieldAlert } from 'lucide-react';
import { drawDragon } from '../utils/pixelArt';
import marqueeImg from '../assets/images/bubble_bobble_marquee_1785683300611.jpg';

const DragonAvatar: React.FC<{ color: 'green' | 'blue' }> = ({ color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    let frame = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawDragon(
        ctx,
        {
          color,
          facing: 'right',
          isJumping: false,
          shootingTimer: 0,
          invulnerableTimer: 0,
          x: 4,
          y: 4,
          width: 48,
          height: 48,
        },
        Math.floor(frame / 6)
      );
      frame++;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [color]);

  return <canvas ref={canvasRef} width={56} height={56} className="w-14 h-14" />;
};

interface TitleScreenProps {
  onStartGame: (mode: GameMode) => void;
  highScores: HighScoreRecord[];
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, highScores }) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('1P');
  const [showControls, setShowControls] = useState<boolean>(false);

  return (
    <div className="relative w-full max-w-5xl mx-auto p-4 sm:p-6 text-white font-mono select-none">
      {/* Background Animated Pixel Bubbles */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute top-10 left-10 w-12 h-12 rounded-full border-2 border-emerald-400 bg-emerald-500/20 animate-bounce"></div>
        <div className="absolute top-24 right-16 w-16 h-16 rounded-full border-2 border-cyan-400 bg-cyan-500/20 animate-pulse"></div>
        <div className="absolute bottom-16 left-20 w-10 h-10 rounded-full border-2 border-pink-400 bg-pink-500/20 animate-ping"></div>
        <div className="absolute bottom-28 right-24 w-14 h-14 rounded-full border-2 border-yellow-400 bg-yellow-500/20 animate-bounce"></div>
      </div>

      {/* Bento Grid Outer Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 relative z-10">
        {/* Bento Card 1: Main Title Banner (Span 12) */}
        <div className="md:col-span-12 bento-card p-4 sm:p-6 text-center relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 border-2 border-pink-500/60 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 text-left md:text-left">
            <p className="text-pink-400 font-bold tracking-[0.3em] text-xs sm:text-sm animate-pulse mb-1 glow-pink">
              TAITO 1986 CLASSIC RETRO HOMAGE
            </p>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-yellow-300 to-pink-500 drop-shadow-[0_4px_12px_rgba(236,72,153,0.8)] tracking-wider uppercase">
              BUBBLE DRAGONS
            </h1>
            <p className="text-yellow-300 font-bold text-sm sm:text-base mt-2 tracking-widest glow-yellow">
              버블보블 8비트 아케이드 (10 STAGES FULL EXPANSION)
            </p>
          </div>
          <div className="w-full md:w-80 h-36 rounded-xl overflow-hidden border-2 border-yellow-400/80 shadow-lg relative shrink-0">
            <img
              src={marqueeImg}
              alt="Bubble Bobble Arcade Marquee"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Bento Card 2: Player Character Selection (Span 6) */}
        <div className="md:col-span-6 bento-card p-5 flex flex-col justify-between items-center text-center">
          <span className="text-xs text-pink-400 font-bold tracking-widest mb-3 uppercase">CHARACTER SELECTION</span>
          <div className="flex items-center justify-center gap-6 my-2 w-full">
            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedMode('1P')}>
              <div className="w-16 h-16 bg-emerald-950/90 border-2 border-emerald-400 rounded-2xl flex items-center justify-center relative shadow-lg group-hover:scale-110 transition p-1 overflow-hidden">
                <DragonAvatar color="green" />
              </div>
              <span className="text-emerald-400 font-bold text-xs mt-2">1P: BUB (GREEN)</span>
            </div>

            <div className="text-pink-500 font-black text-xl animate-pulse">VS / CO-OP</div>

            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedMode('2P')}>
              <div className="w-16 h-16 bg-cyan-950/90 border-2 border-cyan-400 rounded-2xl flex items-center justify-center relative shadow-lg group-hover:scale-110 transition p-1 overflow-hidden">
                <DragonAvatar color="blue" />
              </div>
              <span className="text-cyan-400 font-bold text-xs mt-2">2P: BOB (BLUE)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">1P (W/A/S/D) & 2P (Arrows) 지원</p>
        </div>

        {/* Bento Card 3: Game Start Actions (Span 6) */}
        <div className="md:col-span-6 bento-card p-5 flex flex-col justify-center gap-3">
          <span className="text-xs text-emerald-400 font-bold tracking-widest text-center uppercase mb-1">SELECT MODE TO PLAY</span>
          <button
            onClick={() => {
              setSelectedMode('1P');
              onStartGame('1P');
            }}
            className={`py-3 px-6 rounded-xl font-black text-base sm:text-lg flex items-center justify-center gap-3 border-2 transition-all transform hover:scale-[1.02] shadow-lg ${
              selectedMode === '1P'
                ? 'bg-emerald-600 border-yellow-300 text-white shadow-emerald-500/40'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-emerald-400'
            }`}
          >
            <User className="w-5 h-5 text-yellow-300" />
            <span>1 PLAYER START</span>
          </button>

          <button
            onClick={() => {
              setSelectedMode('2P');
              onStartGame('2P');
            }}
            className={`py-3 px-6 rounded-xl font-black text-base sm:text-lg flex items-center justify-center gap-3 border-2 transition-all transform hover:scale-[1.02] shadow-lg ${
              selectedMode === '2P'
                ? 'bg-cyan-600 border-yellow-300 text-white shadow-cyan-500/40'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-cyan-400'
            }`}
          >
            <Users className="w-5 h-5 text-yellow-300" />
            <span>2 PLAYER CO-OP START</span>
          </button>
        </div>

        {/* Bento Card 4: Hall of Fame High Scores (Span 12 - TOP 30 LEADERBOARD) */}
        <div className="md:col-span-12 bento-card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3">
            <h3 className="text-sm sm:text-base text-pink-400 font-bold tracking-widest flex items-center gap-2 uppercase glow-pink">
              <Award className="w-5 h-5 text-yellow-400" /> HALL OF FAME LEADERBOARD (TOP 30)
            </h3>
            <span className="text-[11px] text-slate-400 font-sans">
              🏆 정렬 기준: 점수 높은 순 ➔ 동점 시 소요시간(클리어 타임) 빠른 순
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-pink-500/50 scrollbar-track-slate-950">
            <div className="grid grid-cols-12 text-[11px] font-bold text-slate-400 text-center border-b border-slate-800 pb-1.5 px-2">
              <span className="col-span-2 text-left">RANK</span>
              <span className="col-span-3 text-left">PLAYER</span>
              <span className="col-span-3 text-right">SCORE</span>
              <span className="col-span-2 text-center">TIME</span>
              <span className="col-span-2 text-right">STAGE</span>
            </div>

            {highScores.slice(0, 30).map((rec, i) => {
              const formatTime = (secs?: number) => {
                if (secs === undefined || secs === null || isNaN(secs)) return '--:--';
                const m = Math.floor(secs / 60);
                const s = secs % 60;
                return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
              };

              let rankBadge = `${i + 1}`;
              let rankColor = 'text-slate-400';
              if (i === 0) {
                rankBadge = '🥇 1';
                rankColor = 'text-yellow-300 font-bold';
              } else if (i === 1) {
                rankBadge = '🥈 2';
                rankColor = 'text-slate-200 font-bold';
              } else if (i === 2) {
                rankBadge = '🥉 3';
                rankColor = 'text-amber-500 font-bold';
              }

              return (
                <div
                  key={i}
                  className={`grid grid-cols-12 text-[12px] items-center px-2 py-1 rounded font-mono transition ${
                    i % 2 === 0 ? 'bg-slate-900/40' : 'bg-slate-950/40'
                  } hover:bg-pink-950/30`}
                >
                  <span className={`col-span-2 text-left ${rankColor}`}>{rankBadge}</span>
                  <span className="col-span-3 text-left text-yellow-200 font-bold truncate">
                    {rec.name}
                  </span>
                  <span className="col-span-3 text-right text-emerald-400 font-bold">
                    {String(rec.score).padStart(6, '0')}
                  </span>
                  <span className="col-span-2 text-center text-cyan-300 text-[11px]">
                    ⏱️ {formatTime(rec.timeElapsedSeconds)}
                  </span>
                  <span className="col-span-2 text-right text-pink-300 text-[11px]">
                    STAGE {rec.round}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bento Card 5: Controls Overlay Toggle (Span 12) */}
        <div className="md:col-span-12 bento-card p-4 flex flex-col sm:flex-row justify-between items-center text-center gap-3">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-yellow-400 animate-bounce" />
            <span className="text-xs font-bold text-slate-200">CONTROLS & KEYBOARD GUIDE</span>
          </div>
          <button
            onClick={() => setShowControls(!showControls)}
            className="px-4 py-2 bg-slate-800 border border-yellow-400/80 rounded-lg text-xs text-yellow-300 hover:bg-slate-700 font-bold transition flex items-center gap-1.5 shadow-md"
          >
            {showControls ? '조작법 닫기' : '키 조작법 보기'}
          </button>
        </div>

        {/* Key Controls Expansion Drawer inside Bento */}
        {showControls && (
          <div className="md:col-span-12 bento-card p-4 text-xs grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in border-yellow-400/80">
            <div className="bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-500/40">
              <h3 className="text-emerald-400 font-bold mb-2 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4" /> 1P (Green Bub) 조작키:
              </h3>
              <ul className="space-y-1 text-slate-200">
                <li><strong className="text-yellow-300">이동:</strong> A (좌) / D (우)</li>
                <li><strong className="text-yellow-300">점프:</strong> W 키</li>
                <li><strong className="text-yellow-300">버블 발사:</strong> SpaceBar 또는 F키</li>
              </ul>
            </div>

            <div className="bg-cyan-950/60 p-3.5 rounded-xl border border-cyan-500/40">
              <h3 className="text-cyan-400 font-bold mb-2 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4" /> 2P (Blue Bob) 조작키:
              </h3>
              <ul className="space-y-1 text-slate-200">
                <li><strong className="text-yellow-300">이동:</strong> ← (좌) / → (우) 화살표</li>
                <li><strong className="text-yellow-300">점프:</strong> ↑ 상단 화살표</li>
                <li><strong className="text-yellow-300">버블 발사:</strong> / (슬래시) 또는 Enter</li>
              </ul>
            </div>

            {/* Power-Up System Guide */}
            <div className="col-span-full bg-pink-950/60 p-3.5 rounded-xl border border-pink-500/40">
              <h3 className="text-pink-400 font-bold mb-1.5 text-sm flex items-center gap-1.5">
                🍬 파워업 시스템 (점수 달성 & 사탕 아이템):
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-200 text-[11px]">
                <li className="bg-slate-900/60 p-2 rounded border border-pink-500/30">
                  <strong className="text-pink-400">★ 5,000점 도달 보너스:</strong> 5,000점마다 버블 고속 연사 + 장거리 사거리 10초 파워업 자동 발동!
                </li>
                <li className="bg-slate-900/60 p-2 rounded border border-pink-500/30">
                  <strong className="text-pink-300">🍬 핑크 캔디 (Rapid):</strong> 발사 속도 2배 & 초고속 버블 (+1,000점)
                </li>
                <li className="bg-slate-900/60 p-2 rounded border border-sky-500/30">
                  <strong className="text-sky-300">🍬 블루 캔디 (Range):</strong> 화면 끝까지 뻗는 초장거리 버블 (+1,000점)
                </li>
              </ul>
            </div>
            <p className="col-span-full text-[11px] text-pink-300 text-center font-sans">
              💡 터치스크린/모바일 기기에서는 하단 가상 게임패드로 조작 가능합니다.
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-500 text-center mt-4">
        © 1986 TAITO / 2026 8-BIT RETRO BUBBLE GAME • SOUNDS GENERATED BY WEB AUDIO SYNTH
      </p>
    </div>
  );
};
