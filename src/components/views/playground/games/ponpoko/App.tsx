import React, { useState, useEffect } from 'react';
import { GameMode, HighScoreItem, DifficultyLevel, DIFFICULTY_CONFIGS } from './types';
import { STAGES } from './utils/stages';
import { RetroHUD } from './components/RetroHUD';
import { GameCanvas } from './components/GameCanvas';
import { AttractScreen } from './components/AttractScreen';
import { TouchControls } from './components/TouchControls';
import { HighScoresModal } from './components/HighScoresModal';
import { soundManager } from './utils/audio';
import { Tv, RefreshCw, Volume2, VolumeX, Trophy, Award, Share2, Check, Flame } from 'lucide-react';

const LOCAL_STORAGE_TOP_SCORE = 'ponpoko_top_score_1982';
const LOCAL_STORAGE_RANKINGS = 'ponpoko_rankings_1982';

const DEFAULT_RANKINGS: HighScoreItem[] = [
  { rank: '1ST', name: 'POKO', score: 93210, date: '1982-10-12' },
  { rank: '2ND', name: 'TANU', score: 65670, date: '1982-10-15' },
  { rank: '3RD', name: 'KONG', score: 54070, date: '1982-11-01' },
  { rank: '4TH', name: 'MARI', score: 33110, date: '1982-11-20' },
  { rank: '5TH', name: 'TAZO', score: 20770, date: '1982-12-05' },
];

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode>('TITLE');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('NORMAL');
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);

  // Player 1 State
  const [p1Score, setP1Score] = useState<number>(0);
  const [p1Lives, setP1Lives] = useState<number>(5);

  // Player 2 State
  const [p2Score, setP2Score] = useState<number>(0);
  const [p2Lives, setP2Lives] = useState<number>(5);

  const [currentStage, setCurrentStage] = useState<number>(1);
  const [topScore, setTopScore] = useState<number>(93210);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [maxTime, setMaxTime] = useState<number>(60);
  const [creditCount, setCreditCount] = useState<number>(2);
  const [scanlineEffect, setScanlineEffect] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showRankingsModal, setShowRankingsModal] = useState<boolean>(false);
  const [highScores, setHighScores] = useState<HighScoreItem[]>(DEFAULT_RANKINGS);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Mobile Touch Control State
  const [touchDir, setTouchDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  const [isTouchJumping, setIsTouchJumping] = useState<boolean>(false);

  // Load High Score from LocalStorage
  useEffect(() => {
    const savedTop = localStorage.getItem(LOCAL_STORAGE_TOP_SCORE);
    if (savedTop) {
      setTopScore(parseInt(savedTop, 10));
    }

    const savedRankings = localStorage.getItem(LOCAL_STORAGE_RANKINGS);
    if (savedRankings) {
      try {
        setHighScores(JSON.parse(savedRankings));
      } catch (e) {
        console.error('Failed to parse saved rankings', e);
      }
    }
  }, []);

  // Manage Background Music playback
  useEffect(() => {
    if (gameMode === 'PLAYING') {
      soundManager.startBGM();
    } else {
      soundManager.stopBGM();
    }
    return () => {
      soundManager.stopBGM();
    };
  }, [gameMode]);

  // Update Top Score
  const updateTopScoreCheck = (score: number) => {
    if (score > topScore) {
      setTopScore(score);
      localStorage.setItem(LOCAL_STORAGE_TOP_SCORE, score.toString());
    }
  };

  // Start New Game (1 Player or 2 Players Simultaneous)
  const handleStartGame = (mode: 1 | 2 = 1, startStageNum: number = 1) => {
    setNumPlayers(mode);
    setCurrentStage(startStageNum);

    // Reset P1
    setP1Score(0);
    setP1Lives(5);

    // Reset P2
    setP2Score(0);
    setP2Lives(5);

    setCreditCount((prev) => Math.max(0, prev - mode));
    soundManager.playJar();

    setGameMode('PLAYING');
  };

  // Stage Cleared Callback
  const handleStageCleared = (bonusScore: number) => {
    const newP1Score = p1Score + bonusScore;
    setP1Score(newP1Score);
    updateTopScoreCheck(newP1Score);

    if (numPlayers === 2) {
      const newP2Score = p2Score + bonusScore;
      setP2Score(newP2Score);
      updateTopScoreCheck(newP2Score);
    }

    if (currentStage < 5) {
      setCurrentStage((prev) => prev + 1);
    } else {
      setGameMode('STAGE_CLEAR');
      checkAndSaveHighScore(Math.max(newP1Score, p2Score));
    }
  };

  // Game Over Callback
  const handleGameOver = (p1Final: number, p2Final: number) => {
    const highestScore = Math.max(p1Final, p2Final);
    updateTopScoreCheck(highestScore);
    checkAndSaveHighScore(highestScore);
    setGameMode('GAME_OVER');
  };

  // Save High Score Ranking
  const checkAndSaveHighScore = (finalScore: number) => {
    if (finalScore <= 0) return;
    const today = new Date().toISOString().split('T')[0];
    const newScores = [...highScores, { rank: '', score: finalScore, date: today }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item, index) => {
        const ranks = ['1ST', '2ND', '3RD', '4TH', '5TH'];
        return { ...item, rank: ranks[index] };
      });

    setHighScores(newScores);
    localStorage.setItem(LOCAL_STORAGE_RANKINGS, JSON.stringify(newScores));
  };

  const handleResetRankings = () => {
    setHighScores(DEFAULT_RANKINGS);
    setTopScore(93210);
    localStorage.removeItem(LOCAL_STORAGE_RANKINGS);
    localStorage.removeItem(LOCAL_STORAGE_TOP_SCORE);
  };

  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const currentStageConfig = STAGES[currentStage - 1] || STAGES[0];

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-between p-2 sm:p-4 font-mono select-none">
      {/* Header Bar */}
      <header className="w-full max-w-[560px] flex items-center justify-between py-2 px-3 bg-neutral-900 border border-neutral-800 rounded-md mb-2 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <h1 className="text-sm sm:text-base font-extrabold text-yellow-400 tracking-wider">
            너구리 (PONPOKO 1982)
          </h1>
        </div>

        {/* Quick Utility Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Header Difficulty Toggle */}
          <button
            onClick={() => {
              const levels: DifficultyLevel[] = ['EASY', 'NORMAL', 'HARD', 'EXPERT'];
              const nextIndex = (levels.indexOf(difficulty) + 1) % levels.length;
              setDifficulty(levels[nextIndex]);
              soundManager.playStep();
            }}
            className={`p-1 px-2 rounded border font-extrabold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${DIFFICULTY_CONFIGS[difficulty].badgeBg}`}
            title={`난이도 변경: 클릭하여 전환 (${DIFFICULTY_CONFIGS[difficulty].label} - ${DIFFICULTY_CONFIGS[difficulty].koreanLabel})`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{DIFFICULTY_CONFIGS[difficulty].label}</span>
          </button>

          <button
            onClick={handleCopyShareLink}
            className="p-1.5 px-2 rounded border bg-neutral-800 text-yellow-300 border-yellow-500/50 hover:bg-neutral-700 flex items-center gap-1 cursor-pointer transition-all"
            title="게임 공유 URL 복사"
          >
            {copiedLink ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline text-[11px] font-bold">{copiedLink ? '복사됨!' : '공유'}</span>
          </button>

          <button
            onClick={() => setScanlineEffect(!scanlineEffect)}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              scanlineEffect ? 'bg-cyan-950 text-cyan-300 border-cyan-500' : 'bg-neutral-800 text-neutral-400 border-neutral-700'
            }`}
            title="CRT 스캔라인 효과 On/Off"
          >
            <Tv className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const muted = soundManager.toggleMute();
              setIsMuted(muted);
              if (!muted && gameMode === 'PLAYING') {
                soundManager.startBGM();
              } else {
                soundManager.stopBGM();
              }
            }}
            className={`p-1.5 rounded border transition-colors cursor-pointer ${
              isMuted ? 'bg-red-950 text-red-400 border-red-500' : 'bg-neutral-800 text-green-400 border-green-600'
            }`}
            title="사운드 On/Off"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Arcade Frame Wrapper */}
      <main className="w-full max-w-[560px] flex flex-col items-center relative shadow-2xl rounded-lg overflow-hidden border-4 border-neutral-800 bg-black">
        {/* CRT Scanline Retro Effect Overlay */}
        {scanlineEffect && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-30 opacity-70" />
        )}

        {/* Title / Attract Screen */}
        {gameMode === 'TITLE' && (
          <AttractScreen
            difficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            onStartGame={handleStartGame}
            onOpenHighScores={() => setShowRankingsModal(true)}
            topScore={topScore}
          />
        )}

        {/* Active Gameplay Screen */}
        {gameMode === 'PLAYING' && (
          <>
            <RetroHUD
              score={p1Score}
              p2Score={p2Score}
              topScore={topScore}
              lives={p1Lives}
              p2Lives={p2Lives}
              timeLeft={timeLeft}
              maxTime={maxTime}
              stageName={currentStageConfig.name}
              stageSubtitle={currentStageConfig.subtitle}
              creditCount={creditCount}
              numPlayers={numPlayers}
              difficulty={difficulty}
            />

            <GameCanvas
              currentStageId={currentStage}
              difficulty={difficulty}
              numPlayers={numPlayers}
              p1Score={p1Score}
              p2Score={p2Score}
              p1Lives={p1Lives}
              p2Lives={p2Lives}
              touchDirection={touchDir}
              isTouchJumping={isTouchJumping}
              onUpdateP1Score={(score) => {
                setP1Score(score);
                updateTopScoreCheck(score);
              }}
              onUpdateP2Score={(score) => {
                setP2Score(score);
                updateTopScoreCheck(score);
              }}
              onUpdateP1Lives={(lives) => setP1Lives(lives)}
              onUpdateP2Lives={(lives) => setP2Lives(lives)}
              onUpdateStageInfo={(stg, time, max) => {
                setTimeLeft(time);
                setMaxTime(max);
              }}
              onStageCleared={handleStageCleared}
              onGameOver={handleGameOver}
            />

            <TouchControls
              onDirectionPress={(dir) => setTouchDirection(dir)}
              onJumpPress={() => {
                setIsTouchJumping(true);
                setTimeout(() => setIsTouchJumping(false), 150);
              }}
            />
          </>
        )}

        {/* Game Over Screen Overlay */}
        {gameMode === 'GAME_OVER' && (
          <div className="w-full h-[460px] bg-black text-white p-6 flex flex-col items-center justify-center text-center relative z-20">
            <h2 className="text-3xl font-extrabold text-red-600 tracking-widest animate-pulse mb-1">
              GAME OVER
            </h2>
            <div className="mb-3">
              <span className={`text-[11px] px-2 py-0.5 rounded border font-extrabold ${DIFFICULTY_CONFIGS[difficulty].badgeBg}`}>
                {DIFFICULTY_CONFIGS[difficulty].label} ({DIFFICULTY_CONFIGS[difficulty].koreanLabel}) MODE
              </span>
            </div>

            {numPlayers === 2 ? (
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs bg-neutral-900/80 p-3 rounded-lg border border-neutral-700 mb-6">
                <div>
                  <span className="text-red-400 font-bold text-xs">1P SCORE (빨간)</span>
                  <div className="text-lg font-extrabold text-white">{p1Score.toString().padStart(6, '0')}</div>
                </div>
                <div>
                  <span className="text-cyan-400 font-bold text-xs">2P SCORE (파란)</span>
                  <div className="text-lg font-extrabold text-white">{p2Score.toString().padStart(6, '0')}</div>
                </div>
                <div className="col-span-2 border-t border-neutral-700 pt-1 text-yellow-300 font-extrabold text-xs">
                  {p1Score > p2Score ? '🏆 PLAYER 1 (빨간 너구리) WIN!' : p2Score > p1Score ? '🏆 PLAYER 2 (파란 너구리) WIN!' : 'DRAW GAME! (무승부)'}
                </div>
              </div>
            ) : (
              <>
                <p className="text-yellow-400 text-sm mb-1">FINAL SCORE (최종 점수)</p>
                <p className="text-2xl font-extrabold text-white mb-6 tracking-wider">
                  {p1Score.toString().padStart(6, '0')}
                </p>
              </>
            )}

            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={() => handleStartGame(numPlayers, 1)}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm rounded border-2 border-yellow-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                RETRY (다시하기)
              </button>
              <button
                onClick={() => setGameMode('TITLE')}
                className="py-3 px-4 bg-gray-800 hover:bg-gray-700 text-yellow-300 font-bold text-xs rounded border border-gray-600 cursor-pointer"
              >
                TITLE
              </button>
            </div>
          </div>
        )}

        {/* Stage Clear Victory Screen Overlay */}
        {gameMode === 'STAGE_CLEAR' && (
          <div className="w-full h-[460px] bg-black text-white p-6 flex flex-col items-center justify-center text-center relative z-20">
            <Award className="w-16 h-16 text-yellow-400 animate-bounce mb-2" />
            <h2 className="text-2xl font-extrabold text-yellow-400 tracking-widest mb-1">
              ALL 5 STAGES CLEARED!
            </h2>
            <div className="mb-2">
              <span className={`text-xs px-2.5 py-0.5 rounded border font-extrabold ${DIFFICULTY_CONFIGS[difficulty].badgeBg}`}>
                {DIFFICULTY_CONFIGS[difficulty].label} ({DIFFICULTY_CONFIGS[difficulty].koreanLabel}) 난이도 정복!
              </span>
            </div>
            <p className="text-pink-400 text-xs sm:text-sm mb-3">
              축하합니다! 모든 너구리가 열매를 정복했습니다!
            </p>
            <div className="text-white text-2xl font-extrabold tracking-widest mb-6">
              <div>1P: {p1Score.toString().padStart(6, '0')}</div>
              {numPlayers === 2 && <div className="text-cyan-300 mt-1">2P: {p2Score.toString().padStart(6, '0')}</div>}
            </div>

            <button
              onClick={() => setGameMode('TITLE')}
              className="py-3 px-8 bg-yellow-400 text-black font-extrabold text-sm rounded hover:bg-yellow-300 cursor-pointer shadow-xl tracking-wider"
            >
              BACK TO MAIN TITLE
            </button>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-[560px] mt-3 flex justify-between items-center text-[11px] text-neutral-400 px-1 border-t border-neutral-800 pt-2">
        <span>고전 아케이드 너구리(Ponpoko 1982) 복원판</span>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRankingsModal(true)}
            className="hover:text-yellow-400 flex items-center gap-1 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            RANKINGS
          </button>
        </div>
      </footer>

      {/* High Scores Leaderboard Modal */}
      {showRankingsModal && (
        <HighScoresModal
          highScores={highScores}
          onClose={() => setShowRankingsModal(false)}
          onReset={handleResetRankings}
        />
      )}
    </div>
  );
}
