/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, GameStatus, Player, HighScoreRecord } from './types';
import { HeaderUI } from './components/HeaderUI';
import { TitleScreen } from './components/TitleScreen';
import { ArcadeCanvas } from './components/ArcadeCanvas';
import { ControlsOverlay } from './components/ControlsOverlay';
import { StageClearModal } from './components/StageClearModal';
import { GameOverModal } from './components/GameOverModal';
import { audioEngine } from './utils/audio';
import { Trophy, RefreshCw, Volume2, Gamepad2, Info } from 'lucide-react';

const INITIAL_HIGH_SCORES: HighScoreRecord[] = [
  { name: 'BUB', score: 320000, round: 10, timeElapsedSeconds: 145, date: '2026-08-01' },
  { name: 'BOB', score: 280000, round: 10, timeElapsedSeconds: 168, date: '2026-08-01' },
  { name: 'TAI', score: 245000, round: 9, timeElapsedSeconds: 190, date: '2026-08-01' },
  { name: 'SES', score: 210000, round: 8, timeElapsedSeconds: 175, date: '2026-08-01' },
  { name: 'KIM', score: 180000, round: 7, timeElapsedSeconds: 160, date: '2026-08-01' },
  { name: 'LEE', score: 165000, round: 6, timeElapsedSeconds: 140, date: '2026-08-01' },
  { name: 'PAR', score: 150000, round: 5, timeElapsedSeconds: 120, date: '2026-08-01' },
  { name: 'CHO', score: 150000, round: 5, timeElapsedSeconds: 135, date: '2026-08-01' },
  { name: 'BAA', score: 130000, round: 4, timeElapsedSeconds: 110, date: '2026-08-01' },
  { name: 'XAA', score: 115000, round: 4, timeElapsedSeconds: 125, date: '2026-08-01' },
  { name: 'DRG', score: 98000, round: 3, timeElapsedSeconds: 95, date: '2026-08-01' },
  { name: 'BLU', score: 85000, round: 3, timeElapsedSeconds: 88, date: '2026-08-01' },
  { name: 'POP', score: 72000, round: 2, timeElapsedSeconds: 70, date: '2026-08-01' },
  { name: 'ZEN', score: 58000, round: 2, timeElapsedSeconds: 62, date: '2026-08-01' },
  { name: 'ACE', score: 45000, round: 1, timeElapsedSeconds: 40, date: '2026-08-01' },
];

export default function App() {
  const [mode, setMode] = useState<GameMode>('1P');
  const [status, setStatus] = useState<GameStatus>('TITLE');
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [crtEffect, setCrtEffect] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gamePlaySeconds, setGamePlaySeconds] = useState<number>(0);

  // Active Players state (for score & lives display in HUD)
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      color: 'green',
      x: 40,
      y: 340,
      width: 24,
      height: 24,
      vx: 0,
      vy: 0,
      facing: 'right',
      isGrounded: false,
      isJumping: false,
      shootingTimer: 0,
      invulnerableTimer: 0,
      score: 0,
      lives: 3,
      isDead: false,
      deathTimer: 0,
      speedMultiplier: 1,
      bubbleRange: 160,
      extendLetters: [],
    },
  ]);

  // High Scores Leaderboard with tie breaker logic (score desc, time asc)
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => {
    try {
      const saved = localStorage.getItem('bubble_dragons_high_scores_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.sort((a: HighScoreRecord, b: HighScoreRecord) => {
          if (b.score !== a.score) return b.score - a.score;
          return (a.timeElapsedSeconds ?? 99999) - (b.timeElapsedSeconds ?? 99999);
        });
      }
      return INITIAL_HIGH_SCORES;
    } catch {
      return INITIAL_HIGH_SCORES;
    }
  });

  const topHighScore = highScores.length > 0 ? highScores[0].score : 320000;

  // Active Timer Effect
  useEffect(() => {
    if (status !== 'PLAYING') return;
    const interval = setInterval(() => {
      setGamePlaySeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Key state map for virtual touch controls
  const [touchKeys, setTouchKeys] = useState<Record<string, boolean>>({});

  // Handle Virtual Touch Button Press
  const handleButtonDown = useCallback((player: 1 | 2, action: 'left' | 'right' | 'jump' | 'shoot') => {
    const keyName = `p${player}_${action}`;
    setTouchKeys((prev) => ({ ...prev, [keyName]: true }));
  }, []);

  const handleButtonUp = useCallback((player: 1 | 2, action: 'left' | 'right' | 'jump' | 'shoot') => {
    const keyName = `p${player}_${action}`;
    setTouchKeys((prev) => ({ ...prev, [keyName]: false }));
  }, []);

  // Audio Toggle
  const handleToggleMute = useCallback(() => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  }, []);

  // Pause Toggle
  const handleTogglePause = useCallback(() => {
    setStatus((prev) => {
      if (prev === 'PLAYING') {
        audioEngine.stopBgm();
        return 'PAUSED';
      }
      if (prev === 'PAUSED') {
        audioEngine.startBgm(1.0);
        return 'PLAYING';
      }
      return prev;
    });
  }, []);

  // Start New Game
  const handleStartGame = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode);
    setCurrentRound(1);
    setGamePlaySeconds(0);

    const initialP1: Player = {
      id: 1,
      color: 'green',
      x: 40,
      y: 320,
      width: 24,
      height: 24,
      vx: 0,
      vy: 0,
      facing: 'right',
      isGrounded: false,
      isJumping: false,
      shootingTimer: 0,
      invulnerableTimer: 60,
      score: 0,
      lives: 3,
      isDead: false,
      deathTimer: 0,
      speedMultiplier: 1,
      bubbleRange: 160,
      extendLetters: [],
      powerupRapidTimer: 0,
      powerupRangeTimer: 0,
      lastMilestoneScore: 0,
    };

    const initialPlayers: Player[] = [initialP1];

    if (selectedMode === '2P') {
      const initialP2: Player = {
        id: 2,
        color: 'blue',
        x: 480,
        y: 320,
        width: 24,
        height: 24,
        vx: 0,
        vy: 0,
        facing: 'left',
        isGrounded: false,
        isJumping: false,
        shootingTimer: 0,
        invulnerableTimer: 60,
        score: 0,
        lives: 3,
        isDead: false,
        deathTimer: 0,
        speedMultiplier: 1,
        bubbleRange: 160,
        extendLetters: [],
        powerupRapidTimer: 0,
        powerupRangeTimer: 0,
        lastMilestoneScore: 0,
      };
      initialPlayers.push(initialP2);
    }

    setPlayers(initialPlayers);
    setStatus('PLAYING');
    audioEngine.startBgm(1.0);
  }, []);

  // Stage Clear Callback
  const handleStageClear = useCallback((scoreP1: number, scoreP2?: number) => {
    setStatus('STAGE_CLEAR');
    audioEngine.stopBgm();
  }, []);

  // Progress to Next Stage (10 Stages Total)
  const handleNextStage = useCallback(() => {
    if (currentRound >= 10) {
      // Grand Victory!
      setStatus('VICTORY');
    } else {
      setCurrentRound((prev) => prev + 1);
      setStatus('PLAYING');
      audioEngine.startBgm(1.0);
    }
  }, [currentRound]);

  // Game Over Callback
  const handleGameOver = useCallback((p1Score: number, p2Score: number, round: number, isVictory: boolean) => {
    setStatus(isVictory ? 'VICTORY' : 'GAME_OVER');
  }, []);

  // Restart to Title
  const handleRestart = useCallback(() => {
    audioEngine.stopBgm();
    setStatus('TITLE');
    setCurrentRound(1);
    setGamePlaySeconds(0);
  }, []);

  // Submit High Score Record (Top 30, Tie Breaker: score desc, then timeElapsedSeconds asc)
  const handleSubmitScore = useCallback(
    (name: string, score: number) => {
      const newRecord: HighScoreRecord = {
        name,
        score,
        round: currentRound,
        timeElapsedSeconds: gamePlaySeconds,
        date: new Date().toISOString().split('T')[0],
      };

      const updated = [...highScores, newRecord]
        .sort((a, b) => {
          // 1. Higher score ranks first
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // 2. If tied score, faster time (smaller seconds) ranks higher
          const timeA = a.timeElapsedSeconds ?? 99999;
          const timeB = b.timeElapsedSeconds ?? 99999;
          return timeA - timeB;
        })
        .slice(0, 30);

      setHighScores(updated);
      try {
        localStorage.setItem('bubble_dragons_high_scores_v2', JSON.stringify(updated));
      } catch {
        // Local storage fallback
      }
    },
    [currentRound, gamePlaySeconds, highScores]
  );

  const p1FinalScore = players.find((p) => p.id === 1)?.score || 0;
  const p2FinalScore = players.find((p) => p.id === 2)?.score;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between selection:bg-pink-500 selection:text-white">
      {/* Top Arcade HUD Header */}
      <HeaderUI
        players={players}
        highScore={topHighScore}
        currentStage={currentRound}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isPaused={status === 'PAUSED'}
        onTogglePause={handleTogglePause}
        crtEffect={crtEffect}
        onToggleCrt={() => setCrtEffect(!crtEffect)}
        onRestart={handleRestart}
      />

      {/* Main Arcade View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 relative">
        {status === 'TITLE' && (
          <TitleScreen onStartGame={handleStartGame} highScores={highScores} />
        )}

        {(status === 'PLAYING' || status === 'PAUSED' || status === 'STAGE_CLEAR') && (
          <div className="relative w-full">
            <ArcadeCanvas
              mode={mode}
              status={status}
              currentStageNumber={currentRound}
              crtEffect={crtEffect}
              onStageClear={handleStageClear}
              onGameOver={handleGameOver}
              onUpdatePlayers={setPlayers}
              externalKeys={touchKeys}
            />

            {/* Paused Overlay */}
            {status === 'PAUSED' && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center font-mono">
                <h2 className="text-4xl font-black text-yellow-300 tracking-widest animate-pulse mb-4">
                  GAME PAUSED
                </h2>
                <button
                  onClick={handleTogglePause}
                  className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 font-bold text-lg rounded-lg border-2 border-yellow-300 shadow-lg shadow-emerald-600/50"
                >
                  RESUME GAME
                </button>
              </div>
            )}

            {/* Stage Clear Modal */}
            {status === 'STAGE_CLEAR' && (
              <StageClearModal
                round={currentRound}
                scoreP1={p1FinalScore}
                scoreP2={p2FinalScore}
                onNextStage={handleNextStage}
              />
            )}
          </div>
        )}

        {/* Game Over / Victory Modal */}
        {(status === 'GAME_OVER' || status === 'VICTORY') && (
          <GameOverModal
            finalScoreP1={p1FinalScore}
            finalScoreP2={p2FinalScore}
            roundReached={currentRound}
            timeElapsedSeconds={gamePlaySeconds}
            isVictory={status === 'VICTORY'}
            onRestart={handleRestart}
            onSubmitScore={handleSubmitScore}
          />
        )}

        {/* On-Screen Virtual Touch Gamepad */}
        {status === 'PLAYING' && (
          <ControlsOverlay mode={mode} onButtonDown={handleButtonDown} onButtonUp={handleButtonUp} />
        )}
      </main>

      {/* Bottom Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-2 px-4 text-center text-[11px] text-slate-500 font-mono">
        <p>1~2인용 버블 드래곤 레트로 게임 • 8비트 사운드와 도트 그래픽 • 버블보블 클래식 오마주</p>
      </footer>
    </div>
  );
}
