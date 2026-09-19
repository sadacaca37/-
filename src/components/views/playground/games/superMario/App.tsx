/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Trophy,
  Volume2,
  VolumeX,
  HelpCircle,
  Layers,
  RotateCcw,
  Pause,
  Sparkles,
} from 'lucide-react';
import { GameEngine } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { TouchControls } from './components/TouchControls';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ScoreSubmitModal } from './components/ScoreSubmitModal';
import { ItemGuideModal } from './components/ItemGuideModal';
import { StageSelectModal } from './components/StageSelectModal';
import { CharacterSelect } from './components/CharacterSelect';
import { sound } from './game/audio';
import { KeyControls, CharacterType } from './types';

export default function App() {
  const engine = useMemo(() => new GameEngine(), []);

  // UI States
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'>('MENU');
  const [p1Character, setP1Character] = useState<CharacterType>('mario');
  const [isMuted, setIsMuted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showItemGuide, setShowItemGuide] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);
  const [showScoreSubmit, setShowScoreSubmit] = useState(false);

  // Key controls state
  const [keys, setKeys] = useState<KeyControls>({
    p1Left: false,
    p1Right: false,
    p1Up: false,
    p1Down: false,
    p1Jump: false,
    p1Attack: false,
    p2Left: false,
    p2Right: false,
    p2Up: false,
    p2Down: false,
    p2Jump: false,
    p2Attack: false,
  });

  // Keep game state synchronized with engine
  useEffect(() => {
    const interval = setInterval(() => {
      if (engine.state === 'GAME_OVER' && gameState !== 'GAME_OVER') {
        setGameState('GAME_OVER');
        setShowScoreSubmit(true);
      } else if (engine.state === 'VICTORY' && gameState !== 'VICTORY') {
        setGameState('VICTORY');
        setShowScoreSubmit(true);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [engine, gameState]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for game keys
      if (
        [
          'Space',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'KeyW',
          'KeyS',
          'KeyA',
          'KeyD',
          'KeyF',
          'KeyX',
          'KeyC',
          'KeyZ',
          'KeyJ',
          'KeyL',
          'ShiftLeft',
          'ShiftRight',
        ].includes(e.code)
      ) {
        e.preventDefault();
      }

      // Pause toggle (P or Escape)
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
          engine.state = 'PAUSED';
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
          engine.state = 'PLAYING';
        }
        return;
      }

      setKeys((prev) => {
        const next = { ...prev };
        // 1P Mode: Full support for Arrow Keys, WASD, Space for Jump, Down Arrow/S for Duck, F/X/Shift/C/J/Enter for Attack
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') next.p1Left = true;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') next.p1Right = true;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') next.p1Down = true;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') next.p1Jump = true;
        if (
          e.code === 'KeyF' ||
          e.code === 'KeyX' ||
          e.code === 'KeyC' ||
          e.code === 'ShiftLeft' ||
          e.code === 'ShiftRight' ||
          e.code === 'KeyJ' ||
          e.code === 'KeyL' ||
          e.code === 'Enter'
        ) {
          next.p1Attack = true;
        }
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = { ...prev };
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') next.p1Left = false;
        if (e.code === 'ArrowRight' || e.code === 'KeyD') next.p1Right = false;
        if (e.code === 'ArrowDown' || e.code === 'KeyS') next.p1Down = false;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'KeyZ') next.p1Jump = false;
        if (
          e.code === 'KeyF' ||
          e.code === 'KeyX' ||
          e.code === 'KeyC' ||
          e.code === 'ShiftLeft' ||
          e.code === 'ShiftRight' ||
          e.code === 'KeyJ' ||
          e.code === 'KeyL' ||
          e.code === 'Enter'
        ) {
          next.p1Attack = false;
        }
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, engine]);

  // Start game handler
  const handleStartGame = (stageId: number = 1) => {
    engine.setCharacters(p1Character, 'luigi');
    engine.initGame('1P', stageId);
    setGameState('PLAYING');
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    sound.setMuted(nextMute);
  };

  const handleRestart = () => {
    handleStartGame(engine.currentStageId);
  };

  const handleBackToMenu = () => {
    sound.stopBgm();
    setGameState('MENU');
    engine.state = 'MENU';
  };

  return (
    <div
      id="super-mario-app"
      className="min-h-screen bg-[#5C94FC] text-slate-900 flex flex-col items-center justify-between font-sans selection:bg-red-500 selection:text-white relative overflow-x-hidden"
    >
      {/* Decorative Parallax Background Elements (From Theme) */}
      <div className="absolute top-16 left-12 w-32 h-10 bg-white rounded-full opacity-60 pointer-events-none" />
      <div className="absolute top-28 left-1/3 w-48 h-14 bg-white rounded-full opacity-50 pointer-events-none hidden sm:block" />
      <div className="absolute top-20 right-16 w-40 h-12 bg-white rounded-full opacity-60 pointer-events-none" />
      <div className="absolute bottom-16 left-0 w-80 sm:w-[420px] h-44 bg-[#48D048] rounded-t-[100px] opacity-90 border-b-0 border-r-4 border-black/10 pointer-events-none" />
      <div className="absolute bottom-16 right-0 w-64 sm:w-[320px] h-36 bg-[#48D048] rounded-t-[80px] opacity-90 border-b-0 border-l-4 border-black/10 pointer-events-none" />
      <div className="absolute bottom-0 w-full h-16 bg-[#924E00] border-t-[6px] border-[#3CB000] pointer-events-none flex opacity-90">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="flex-1 border-r-2 border-black/10" />
        ))}
      </div>

      {/* Top Navigation Bar - Sleek Glass Header */}
      <header
        id="mario-top-header"
        className="w-full bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3 flex items-center justify-between z-30 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-[0_3px_0_0_#991b1b] border-2 border-red-400/50 italic">
            M
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight italic text-gray-900 flex items-center gap-1.5 leading-tight">
              SUPER MARIO <span className="text-red-600 font-extrabold not-italic font-mono">BROS.</span>
            </h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">
              Sleek Interface • High Performance Canvas Engine
            </p>
          </div>
        </div>

        {/* Global Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {gameState === 'PLAYING' && (
            <button
              id="btn-pause-game"
              onClick={() => {
                setGameState('PAUSED');
                engine.state = 'PAUSED';
              }}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border-2 border-gray-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wide"
            >
              <Pause className="w-3.5 h-3.5 text-gray-700" /> 일시정지
            </button>
          )}

          <button
            id="btn-show-stages"
            onClick={() => setShowStageSelect(true)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border-2 border-gray-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wide"
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" /> 스테이지 (1~10)
          </button>

          <button
            id="btn-show-guide"
            onClick={() => setShowItemGuide(true)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border-2 border-gray-200 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> 아이템 가이드
          </button>

          <button
            id="btn-show-leaderboard"
            onClick={() => setShowLeaderboard(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-900 text-xs font-bold rounded-xl border-2 border-amber-300 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 uppercase tracking-wide"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> 랭킹 (Top 30)
          </button>

          <button
            id="btn-toggle-sound"
            onClick={handleToggleMute}
            className="p-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border-2 border-gray-200 shadow-sm transition-all active:scale-95"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      </header>

      {/* Main Game Stage Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-5xl mx-auto z-20">
        {gameState === 'MENU' ? (
          /* Main Menu Screen - Sleek Interface Card */
          <div
            id="mario-main-menu"
            className="w-full max-w-xl bg-white/95 p-2.5 sm:p-3.5 rounded-[44px] shadow-2xl border border-white/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="bg-[#FDFDFD] border-2 border-gray-100 rounded-[36px] p-6 sm:p-10 flex flex-col items-center gap-6 text-center shadow-sm">
              {/* Title Section */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-50 text-red-600 rounded-full border border-red-200 text-xs font-bold uppercase tracking-[0.2em]">
                  <Sparkles className="w-3.5 h-3.5" /> High Performance JS Engine
                </div>
                <h2 className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tighter italic leading-none">
                  WEB <span className="text-red-600">BROS.</span>
                </h2>
                <p className="text-gray-400 font-bold tracking-[0.2em] uppercase text-xs">
                  10 STAGES • YOSHI • PROPELLER • CLOWN CAR • BOSS SHOWDOWN
                </p>
              </div>

              {/* Character Selection */}
              <div className="w-full flex flex-col gap-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80">
                <CharacterSelect
                  selectedCharacter={p1Character}
                  onSelect={setP1Character}
                  label="플레이어 캐릭터 선택"
                />
              </div>

              {/* Main Action Buttons */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  id="btn-start-game-main"
                  onClick={() => handleStartGame(1)}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 sm:py-5 px-8 rounded-2xl text-xl sm:text-2xl shadow-[0_6px_0_0_#991b1b] active:translate-y-1 active:shadow-[0_2px_0_0_#991b1b] transition-all uppercase tracking-wide flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-white" /> Start Journey
                </button>

                <div className="flex gap-3 w-full">
                  <button
                    id="btn-menu-stages"
                    onClick={() => setShowStageSelect(true)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm border-2 border-gray-200 shadow-sm uppercase tracking-wide hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Layers className="w-4 h-4 text-amber-500" /> Stages (1~10)
                  </button>

                  <button
                    id="btn-menu-leaderboard"
                    onClick={() => setShowLeaderboard(true)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm border-2 border-gray-200 shadow-sm uppercase tracking-wide hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" /> Ranking
                  </button>
                </div>
              </div>

              {/* Sleek Keycaps Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 border-t border-gray-100 pt-6 w-full">
                <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/80 rounded-2xl border border-gray-200/60">
                  <div className="px-3 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 border-b-4 border-b-gray-300 font-black text-gray-800 text-xs shadow-sm font-mono tracking-wider">
                    ← / → <span className="text-gray-400 text-[10px] ml-1">A / D</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    이동 (Move)
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/80 rounded-2xl border border-gray-200/60">
                  <div className="px-3 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 border-b-4 border-b-gray-300 font-black text-gray-800 text-xs shadow-sm font-mono tracking-wider">
                    SPACE <span className="text-gray-400 text-[10px] ml-1">↑ / W</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    점프 (Jump)
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/80 rounded-2xl border border-gray-200/60">
                  <div className="px-3 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 border-b-4 border-b-gray-300 font-black text-gray-800 text-xs shadow-sm font-mono tracking-wider">
                    ↓ <span className="text-gray-400 text-[10px] ml-1">/ S</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    웅크리기 (Duck)
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1.5 p-2 bg-gray-50/80 rounded-2xl border border-gray-200/60">
                  <div className="px-3 h-10 bg-white rounded-xl flex items-center justify-center border-2 border-gray-200 border-b-4 border-b-gray-300 font-black text-gray-800 text-xs shadow-sm font-mono tracking-wider">
                    F / X / SHIFT
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    공격/회전 (Attack)
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Active Playing Canvas & Controls */
          <div className="w-full flex flex-col items-center relative">
            <div className="w-full max-w-4xl bg-white/90 p-2 sm:p-3 rounded-[32px] shadow-2xl border border-white/60 backdrop-blur-md">
              {/* Game Canvas */}
              <GameCanvas engine={engine} keys={keys} />
            </div>

            {/* Mobile Touch On-Screen Controls */}
            <TouchControls setKeys={setKeys} />

            {/* Pause Overlay - Sleek Modal */}
            {gameState === 'PAUSED' && (
              <div
                id="paused-overlay"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
              >
                <div className="bg-white p-2.5 rounded-[40px] shadow-2xl max-w-md w-full">
                  <div className="bg-[#FDFDFD] border-2 border-gray-100 rounded-[32px] p-8 text-center space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-4xl font-black italic tracking-tight text-gray-900">
                        GAME PAUSED
                      </h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        P 키 또는 아래 버튼으로 게임을 재개하세요
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                      <button
                        id="btn-resume-game"
                        onClick={() => {
                          setGameState('PLAYING');
                          engine.state = 'PLAYING';
                        }}
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl text-lg shadow-[0_5px_0_0_#991b1b] active:translate-y-1 active:shadow-[0_1px_0_0_#991b1b] transition-all uppercase tracking-wide"
                      >
                        게임 계속하기
                      </button>
                      <div className="flex gap-3">
                        <button
                          id="btn-restart-stage"
                          onClick={handleRestart}
                          className="flex-1 bg-white hover:bg-gray-50 text-gray-800 font-bold py-3 rounded-xl border-2 border-gray-200 shadow-sm flex items-center justify-center gap-1.5 uppercase text-xs tracking-wide"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> 다시 시작
                        </button>
                        <button
                          id="btn-pause-menu"
                          onClick={handleBackToMenu}
                          className="flex-1 bg-white hover:bg-gray-50 text-red-600 font-bold py-3 rounded-xl border-2 border-gray-200 shadow-sm flex items-center justify-center uppercase text-xs tracking-wide"
                        >
                          메인 메뉴로
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full bg-white/80 backdrop-blur-sm border-t border-gray-200/80 px-4 py-2.5 text-center text-xs font-bold tracking-wider text-gray-500 uppercase z-30">
        Super Mario Action Web • Sleek Interface Edition • High Performance Canvas Engine
      </footer>

      {/* Modals */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        onRestart={handleRestart}
      />

      <ItemGuideModal
        isOpen={showItemGuide}
        onClose={() => setShowItemGuide(false)}
      />

      <StageSelectModal
        isOpen={showStageSelect}
        currentStageId={engine.currentStageId}
        onSelectStage={(stId) => {
          setShowStageSelect(false);
          handleStartGame(stId);
        }}
        onClose={() => setShowStageSelect(false)}
      />

      <ScoreSubmitModal
        isOpen={showScoreSubmit}
        isVictory={gameState === 'VICTORY'}
        score={engine.totalScore}
        stageReached={engine.currentStageId}
        timeRemaining={engine.timeRemaining}
        mode="1P"
        onSubmitted={() => {
          setShowScoreSubmit(false);
          setShowLeaderboard(true);
        }}
        onViewRankingOnly={() => {
          setShowScoreSubmit(false);
          setShowLeaderboard(true);
        }}
        onRestart={() => {
          setShowScoreSubmit(false);
          handleRestart();
        }}
        onGoToMenu={() => {
          setShowScoreSubmit(false);
          handleBackToMenu();
        }}
      />
    </div>
  );
}
