import { fetchFunfunFree, isFreeActive, formatKDate, FunfunFreeInfo } from '../../../utils/funfunFree';
import { requestFunPass, leaveFunPass } from '../../../utils/funfunPass';
import { FitToBox, BodyPortal } from '../../GameFitStage';
import { FUNFUN_ENTRY_POINTS } from '../../../utils/pointRules';
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
  const isMaster = currentUser?.role === 'master';
  const [playZone, setPlayZone] = useState<'basic' | 'funfun'>('basic');
  const [points, setPoints] = useState(pointsManager.getBalance());
  const [remainingSeconds, setRemainingSeconds] = useState(playgroundManager.getRemainingSeconds());
  const [selectedGameId, setSelectedGameId] = useState<string | null>(initialGameId || null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isFullView, setIsFullView] = useState(Boolean(initialGameId));
  // 선생님이 정한 펀펀 플레이 무료 개방 기간
  const [freeInfo, setFreeInfo] = useState<FunfunFreeInfo | null>(null);
  const [, setClock] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = () => void fetchFunfunFree().then((f) => alive && setFreeInfo(f));
    load();
    const t = window.setInterval(() => {
      load();
      setClock((c) => c + 1);
    }, 60000);
    window.addEventListener('funfun-free-updated', load);
    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener('funfun-free-updated', load);
    };
  }, []);
  const isFree = isFreeActive(freeInfo);
  const freeRef = React.useRef(isFree);
  freeRef.current = isFree;
  // 무료 개방이 끝나는 순간 다시 계산
  useEffect(() => {
    if (!freeInfo || !isFree) return;
    const ms = freeInfo.freeUntil - Date.now() + 500;
    if (ms <= 0 || ms > 2147483000) return;
    const t = window.setTimeout(() => setClock((c) => c + 1), ms);
    return () => window.clearTimeout(t);
  }, [freeInfo, isFree]);
  // 무료 개방이 끝났는데 충전한 시간이 없으면 펀펀 게임을 닫음
  const wasFreeRef = React.useRef(isFree);
  useEffect(() => {
    const was = wasFreeRef.current;
    wasFreeRef.current = isFree;
    if (!was || isFree || isMaster) return;
    if (playgroundManager.getRemainingSeconds() > 0) return;
    setSelectedGameId((cur) => {
      const g = PLAYGROUND_GAMES.find((x) => x.id === cur);
      if (g && g.category === '펀펀') {
        leaveFunPass();
        setIsFullView(false);
        setNotice('⏰ 펀펀 플레이 무료 개방 시간이 끝났어요. 이제는 포인트(10분 1,000P)로 들어갈 수 있어요.');
        setTimeout(() => setNotice(null), 6000);
        return null;
      }
      return cur;
    });
  });

  useEffect(() => {
    const handlePointsUpdate = () => setPoints(pointsManager.getBalance());
    const handleTick = (e: any) => setRemainingSeconds(e.detail.remainingSeconds);
    const handleTimeUpdated = (e: any) => {
      setRemainingSeconds(e.detail.remainingSeconds);
      setPoints(pointsManager.getBalance());
    };

    // 시간이 다 되면(포인트로 자동 연장도 안 되면) 펀펀 게임을 닫고 입장권 회수
    const handleExpired = () => {
      if (isMaster || freeRef.current) return;
      leaveFunPass();
      setSelectedGameId((cur) => {
        const g = PLAYGROUND_GAMES.find((x) => x.id === cur);
        if (g && g.category === '펀펀') {
          setIsFullView(false);
          setNotice('⏰ 펀펀 플레이 이용 시간이 끝났어요. 포인트(10분 1,000P)를 내면 다시 들어갈 수 있어요.');
          setTimeout(() => setNotice(null), 6000);
          return null;
        }
        return cur;
      });
    };
    // 시간을 연장하면 입장권도 연장
    const handleRenew = () => {
      void requestFunPass(playgroundManager.getRemainingSeconds());
    };

    window.addEventListener('points-updated', handlePointsUpdate);
    window.addEventListener('playground-tick', handleTick);
    window.addEventListener('playground-time-updated', handleTimeUpdated);
    window.addEventListener('playground-time-expired', handleExpired);
    window.addEventListener('playground-time-updated', handleRenew);

    return () => {
      window.removeEventListener('points-updated', handlePointsUpdate);
      window.removeEventListener('playground-tick', handleTick);
      window.removeEventListener('playground-time-updated', handleTimeUpdated);
      window.removeEventListener('playground-time-expired', handleExpired);
      window.removeEventListener('playground-time-updated', handleRenew);
    };
  }, [isMaster]);

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
    setIsFullView(true); // 게임은 처음부터 큰 창으로
    soundManager.play('achievement');
  };

  const handleLaunchFunfunGame = async (game: PlaygroundGameDef) => {
    soundManager.play('achievement');
    if (!currentUser) {
      setNotice('🔒 펀펀 플레이는 로그인해야 들어갈 수 있어요.');
      setTimeout(() => setNotice(null), 4000);
      return;
    }

    // 마스터가 아니면 1,000P 가 모여 있어야 펀펀 플레이 입장 가능 (무료 개방 기간은 예외)
    if (!isMaster && !isFree) {
      if (remainingSeconds <= 0) {
        if (pointsManager.getBalance() < FUNFUN_ENTRY_POINTS) {
          setNotice(
            `🔒 펀펀 플레이는 ${FUNFUN_ENTRY_POINTS.toLocaleString()}P 가 모여야 들어갈 수 있어요. (지금 ${pointsManager
              .getBalance()
              .toLocaleString()}P) 타자 연습 한 세트에 100P를 모아 보세요!`,
          );
          setTimeout(() => setNotice(null), 5000);
          return;
        }
        const res = playgroundManager.purchasePlayTime(10);
        if (!res.success) {
          setNotice(res.message);
          setTimeout(() => setNotice(null), 4000);
          return;
        }
      }
    }

    // 서버에서 게임 입장권 받기 (로그인 확인 + 남은 이용 시간만큼만 유효)
    const pass = await requestFunPass(isMaster || isFree ? 3600 : playgroundManager.getRemainingSeconds());
    if (pass === 'login') {
      setNotice('🔐 안전한 입장을 위해 한 번 더 로그인해 주세요. (로그인 후 다시 누르면 바로 들어가요, 충전한 시간은 그대로예요)');
      setTimeout(() => setNotice(null), 6000);
      window.dispatchEvent(new Event('typang-require-login'));
      return;
    }

    // Always select and activate game view immediately
    setSelectedGameId(game.id);
    setActiveFunfunGame(game);
    setIsFullView(true); // 게임은 처음부터 큰 창으로
    setNotice(`🚀 [${getGameTitle(game)}] 게임이 실행되었습니다! (로딩 지연 없음)`);
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
    const isBasic = BASIC_GAME_IDS.includes(activeGame.id);
    // 펀펀 게임은 원본 게임을 창(iframe)으로 띄우므로 크기만 꽉 채우면 됨
    const isIframeGame = activeGame.category === '펀펀';

    const gameView = (
      <div
        className={
          isFullView
            ? 'tp-skin fixed inset-0 z-[60] w-screen h-screen bg-slate-950 p-2 sm:p-4 flex flex-col overflow-hidden animate-fade-in'
            : 'max-w-6xl mx-auto px-3 sm:px-6 py-4 animate-fade-in min-h-[85vh] flex flex-col'
        }
      >
        <PlaygroundHeader
          gameTitle={activeGame.title}
          currentUser={currentUser}
          isBasicPlay={isBasic}
          freeUntil={isFree && freeInfo ? freeInfo.freeUntil : 0}
          isFullView={isFullView}
          onToggleFullView={() => setIsFullView(!isFullView)}
          onBack={() => {
            if (activeGame.category === '펀펀') leaveFunPass();
            setIsFullView(false);
            setSelectedGameId(null);
          }}
        />

        <div className={`relative w-full flex-1 min-h-0 ${isFullView ? 'pg-full overflow-hidden mt-2' : 'overflow-auto'}`}>
          {isFullView && !isIframeGame ? (
            // 기본 게임: 원래 크기로 그린 뒤 창에 꽉 차게 확대
            <FitToBox>
              <GameComponent
                currentUser={currentUser}
                onBack={() => {
                  setIsFullView(false);
                  setSelectedGameId(null);
                }}
                onOpenProfile={onOpenProfile}
              />
            </FitToBox>
          ) : (
            <GameComponent
              currentUser={currentUser}
              onBack={() => {
                setIsFullView(false);
                setSelectedGameId(null);
              }}
              onOpenProfile={onOpenProfile}
            />
          )}
        </div>
      </div>
    );
    // 큰 창일 때는 페이지 바깥(body)에 띄워서 화면 전체를 씀
    return isFullView ? <BodyPortal>{gameView}</BodyPortal> : gameView;
  }

  const funfunGames = PLAYGROUND_GAMES.filter((g) => g.category === '펀펀');
  let markInvite = '';
  try {
    markInvite = sessionStorage.getItem('typang_mark_invite') || '';
  } catch {}
  const markGame = PLAYGROUND_GAMES.find((g) => g.id === 'app-blockcraft');

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fade-in">
      {isFree && freeInfo && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg flex flex-wrap items-center justify-between gap-2" data-testid="funfun-free-banner">
          <div className="text-lg font-black">🎉 펀펀 플레이 무료 개방 중! 포인트 없이 무제한으로 즐겨요</div>
          <div className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
            {formatKDate(freeInfo.freeUntil)}까지{freeInfo.note ? ` · ${freeInfo.note}` : ''}
          </div>
        </div>
      )}
      {markInvite && markGame && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-xs" data-testid="mark-invite">
          <div className="text-sm font-black text-amber-900">
            ⛏️ 친구가 <b>마크</b> 방 <span className="font-mono text-amber-600">{markInvite}</span> 에 초대했어요!
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleLaunchFunfunGame(markGame)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-black cursor-pointer"
            >
              방에 들어가기
            </button>
            <button
              onClick={() => {
                try {
                  sessionStorage.removeItem('typang_mark_invite');
                } catch {}
                setNotice(null);
                setSelectedGameId(null);
              }}
              className="px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-bold cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      )}
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
