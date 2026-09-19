import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Clock, 
  Coins, 
  ArrowLeft, 
  Sparkles, 
  Play, 
  Crown,
  ChevronRight,
  Code2
} from 'lucide-react';
import { UserSession } from '../../../types';
import { pointsManager } from '../../../utils/pointsManager';
import { playgroundManager, PLAYGROUND_MIN_POINTS } from './playgroundManager';
import { PLAYGROUND_GAMES, PlaygroundGameDef } from './playgroundGamesRegistry';
import { PlaygroundHeader } from './PlaygroundHeader';
import { soundManager } from '../../../utils/sound';

interface PlaygroundHomeProps {
  currentUser: UserSession | null;
  onSelectMode: (mode: any) => void;
  onOpenProfile?: () => void;
  initialGameId?: string | null;
}

const BASIC_GAME_IDS = [
  'tetris',
  'infinite-stairs',
  'retro-snake',
  'game-2048',
  'jumping-cat',
  'brick-breaker',
  'tamagotchi'
];

export const PlaygroundHome: React.FC<PlaygroundHomeProps> = ({
  currentUser,
  onSelectMode,
  onOpenProfile,
  initialGameId
}) => {
  const isMaster = 
    currentUser?.role === 'master' || 
    currentUser?.studentId === 'master' || 
    currentUser?.name === '마스터' || 
    currentUser?.name?.includes('마스터') ||
    currentUser?.id === 'master_admin_1' ||
    currentUser?.id?.includes('master') ||
    (typeof window !== 'undefined' && Boolean(localStorage.getItem('typang_master_key') || localStorage.getItem('typang_master_session')));

  const [playZone, setPlayZone] = useState<'basic' | 'funfun'>('basic');
  const [points, setPoints] = useState(pointsManager.getBalance());
  const [remainingSeconds, setRemainingSeconds] = useState(playgroundManager.getRemainingSeconds());
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId || null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFullView, setIsFullView] = useState(false);

  useEffect(() => {
    const handlePointsUpdate = () => setPoints(pointsManager.getBalance());
    const handleTick = (e: any) => setRemainingSeconds(e.detail.remainingSeconds);
    const handleTimeUpdated = (e: any) => {
      setRemainingSeconds(e.detail.remainingSeconds);
      setPoints(pointsManager.getBalance());
    };

    window.addEventListener('points-updated', handlePointsUpdate);
    window.addEventListener('playground-tick', handleTick);
    window.addEventListener('playground-time-updated', handleTimeUpdated);

    return () => {
      window.removeEventListener('points-updated', handlePointsUpdate);
      window.removeEventListener('playground-tick', handleTick);
      window.removeEventListener('playground-time-updated', handleTimeUpdated);
    };
  }, []);

  const activeGame = PLAYGROUND_GAMES.find((g) => g.id === selectedGameId);
  const [activeFunfunGame, setActiveFunfunGame] = useState<PlaygroundGameDef | null>(null);

  const getGameTitle = (game: PlaygroundGameDef) => {
    if (!game.externalUrl) return game.title;
    try {
      return localStorage.getItem(`typang_game_title_${game.externalUrl}`) || game.title;
    } catch {
      return game.title;
    }
  };

  const handleLaunchGame = (gameId: string) => {
    setSelectedGameId(gameId);
    soundManager.play('achievement');
  };

  const handleLaunchFunfunGame = (game: PlaygroundGameDef) => {
    soundManager.play('achievement');

    // If not master, check or charge 10 minutes (1,000P)
    if (!isMaster) {
      if (remainingSeconds <= 0) {
        // If user has enough points, purchase
        if (pointsManager.getBalance() >= 1000) {
          const res = playgroundManager.purchasePlayTime(10);
          if (!res.success) {
            setNotice(res.message);
            setTimeout(() => setNotice(null), 4000);
            return;
          }
        } else {
          // If student doesn't have points, give starter points bonus so they can play
          pointsManager.addPoints(1000, '놀이터 체험 보너스');
          playgroundManager.purchasePlayTime(10);
          setNotice('🎁 [체험 보너스] 1,000P가 무료 지급되어 10분 플레이가 시작되었습니다!');
        }
      }
    }

    // Always select and activate game view immediately
    setSelectedGameId(game.id);
    setActiveFunfunGame(game);
    if (isMaster) {
      setNotice(`👑 [마스터 프리패스] ${getGameTitle(game)} 게임이 즉시 실행되었습니다! (시간/포인트 제한 없음)`);
    } else {
      setNotice(`🚀 [${getGameTitle(game)}] 게임이 실행되었습니다! (로딩 지연 없음)`);
    }
    setTimeout(() => setNotice(null), 4000);

    // Also attempt new tab open if popup allowed
    if (game.externalUrl) {
      try {
        window.open(game.externalUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, running inside frame:', e);
      }
    }
  };

  // If a game is actively playing, render inside PlaygroundHeader with full-view toggle
  if (activeGame) {
    const GameComponent = activeGame.component;
    const isBasic = isMaster || activeGame.category === '기본' || BASIC_GAME_IDS.includes(activeGame.id);

    return (
      <div
        className={
          isFullView
            ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-950 p-2 sm:p-4 flex flex-col overflow-hidden animate-fade-in'
            : 'max-w-6xl mx-auto px-3 sm:px-6 py-4 animate-fade-in min-h-[85vh] flex flex-col'
        }
      >
        <PlaygroundHeader
          gameTitle={activeGame.title}
          currentUser={currentUser}
          isBasicPlay={isBasic}
          isFullView={isFullView}
          onToggleFullView={() => setIsFullView(!isFullView)}
          onBack={() => {
            setIsFullView(false);
            setSelectedGameId(null);
          }}
        />

        <div className="relative w-full flex-1 min-h-0 overflow-auto">
          <GameComponent
            currentUser={currentUser}
            onBack={() => {
              setIsFullView(false);
              setSelectedGameId(null);
            }}
            onOpenProfile={onOpenProfile}
          />
        </div>
      </div>
    );
  }

  const funfunGames = PLAYGROUND_GAMES.filter((g) => g.category === '펀펀');

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fade-in">
      {/* Top Banner & Return to Home */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs">
        <div>
          <button
            onClick={() => onSelectMode('home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>메인 홈으로 돌아가기</span>
          </button>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-arcade mt-1 flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-pink-500" />
            <span>놀이터 (Arcade Playground)</span>
          </h1>
        </div>

        {/* User Points Display */}
        <div className="flex items-center gap-2.5">
          <div className="px-4 py-2 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-xs text-left">
            <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-500" />
              <span>보유 포인트</span>
            </div>
            <div className="font-mono font-black text-base sm:text-lg text-amber-950">
              {points.toLocaleString()} P
            </div>
          </div>
        </div>
      </div>

      {/* Play Zone Tabs: 기본 플레이 vs 펀펀 플레이 */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setPlayZone('basic');
            soundManager.play('click');
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-arcade font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 ${
            playZone === 'basic'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-600 shadow-lg scale-102 ring-4 ring-emerald-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xl">🎮</span>
          <span>기본 플레이</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            playZone === 'basic' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
          }`}>
            포인트 차감 없음 (무료)
          </span>
        </button>

        <button
          onClick={() => {
            setPlayZone('funfun');
            soundManager.play('click');
          }}
          className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-arcade font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 cursor-pointer border-2 ${
            playZone === 'funfun'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-purple-600 shadow-lg scale-102 ring-4 ring-purple-100'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-xl">🎡</span>
          <span>펀펀 플레이</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            playZone === 'funfun' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-800'
          }`}>
            10분당 1,000P (새 창 연동)
          </span>
        </button>
      </div>

      {/* ZONE 1: 기본 플레이 (기존 7종 게임, 포인트 차감 없이 완전 무료) */}
      {playZone === 'basic' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base sm:text-lg font-black text-slate-800 font-arcade flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>기본 아케이드 게임 (포인트 차감 없음 · 무료)</span>
            </h2>
            <span className="text-xs text-slate-400 font-bold">아이콘을 클릭하면 바로 시작됩니다</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5 sm:gap-4">
            {PLAYGROUND_GAMES.filter((g) => g.category === '기본').map((game) => (
              <button
                key={game.id}
                onClick={() => {
                  soundManager.play('pop');
                  handleLaunchGame(game.id);
                }}
                className="group flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-3xl bg-white border-2 border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 cursor-pointer text-center"
                title={`${game.title} 시작하기`}
              >
                {/* 3D Tactile Arcade Icon Button */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 text-white shadow-md shadow-teal-100 flex flex-col items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative border-b-4 border-black/20">
                  <span className="text-3xl sm:text-4xl drop-shadow-md">{game.icon}</span>
                </div>

                {/* Game Title */}
                <h3 className="mt-3 font-black text-xs sm:text-sm text-slate-800 font-arcade group-hover:text-emerald-600 transition-colors leading-tight">
                  {game.title}
                </h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ZONE 2: 펀펀 플레이 (버블 리믹스 및 완성 앱 직관적 아이콘 구성) */}
      {playZone === 'funfun' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between px-1 gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-800 font-arcade flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>펀펀 플레이 아케이드</span>
            </h2>
            <span className="px-3 py-1 rounded-xl bg-purple-100 border border-purple-300 text-purple-800 text-xs font-black">
              ⭐ 5분 1,000P (원클릭 즉시 실행 · 로딩 지연 없음)
            </span>
          </div>

          {/* Active Running Game Banner if launched */}
          {activeFunfunGame && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 border-2 border-purple-400 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="text-3xl animate-bounce-short">{activeFunfunGame.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm sm:text-base font-arcade">{getGameTitle(activeFunfunGame)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">실행 중</span>
                  </div>
                  <p className="text-purple-200 text-xs mt-0.5">새 창 전체화면으로 즉시 실행되었습니다. (로딩 모양/지연 없음)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLaunchFunfunGame(activeFunfunGame)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>다시 열기</span>
                  <span>↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchGame(activeFunfunGame.id)}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-black flex items-center gap-1 shadow-md active:scale-95 cursor-pointer"
                >
                  <span>콘솔 보기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFunfunGame(null)}
                  className="text-purple-300 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {/* Clean Icon-Only Arcade Grid (No captures, no long descriptions) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {funfunGames.map((game) => {
              const displayTitle = getGameTitle(game);
              return (
                <div
                  key={game.id}
                  className="group p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-purple-500 hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-between text-center shadow-xs relative"
                >
                  <button
                    type="button"
                    onClick={() => handleLaunchFunfunGame(game)}
                    className="w-full flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
                    title={`${displayTitle} (전체화면 즉시 실행 - 로딩 모양 없음)`}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xs relative">
                      {game.icon}
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-xs flex items-center gap-0.5">
                        <span>즉시실행</span>
                        <span>↗</span>
                      </span>
                    </div>
                    <h3 className="mt-3 font-black text-xs sm:text-sm text-slate-800 font-arcade group-hover:text-purple-600 transition-colors leading-tight">
                      {displayTitle}
                    </h3>
                    <span className="mt-1 text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <span>바로 플레이</span>
                      <span>⚡</span>
                    </span>
                  </button>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 w-full flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleLaunchGame(game.id)}
                      className="text-[10px] text-slate-400 hover:text-purple-600 font-bold transition-colors cursor-pointer"
                    >
                      콘솔 모드
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
