import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  BookOpen, 
  FileText, 
  RotateCcw, 
  Trophy, 
  Volume2, 
  VolumeX, 
  User, 
  LogIn, 
  LogOut, 
  Sparkles,
  Timer,
  Crown,
  Gamepad2,
  MessageSquare,
  History,
  Coins,
  ChevronDown,
  ExternalLink,
  Globe,
  Landmark,
  GraduationCap
} from 'lucide-react';
import { AppMode, UserSession } from '../types';
import { pointsManager, MASTER_POINTS } from '../utils/pointsManager';
import { longUnlocked, SHORT_TO_LONG_CPM } from '../utils/longGate';
import { myTier } from '../utils/speedTier';
import { PixelIcon } from './views/TapangHome';
import { FUNFUN_ENTRY_POINTS, GAME_POINTS, PRACTICE_SET_POINTS } from '../utils/pointRules';
import { soundManager } from '../utils/sound';
import { MoaCharacter } from './MoaCharacter';


interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenProfile: (tab?: 'avatar' | 'account') => void;
  onOpenMaster: () => void;
  onOpenReport?: () => void;
  onOpenHistory?: () => void;
  /** 학생: 오늘 연습을 선생님께 보내는 창 열기 */
  onOpenSendReport?: () => void;
  /** 학생의 오늘 보고 상태: ready=쳤는데 아직 안 보냄, sent=보냄, checked=선생님 확인 */
  sendReportState?: 'none' | 'ready' | 'sent' | 'checked';
  /** 선생님: 아직 확인하지 않은 보고 수 */
  newReportsCount?: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  pendingStudentsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenProfile,
  onOpenMaster,
  onOpenReport,
  onOpenHistory,
  onOpenSendReport,
  sendReportState = 'none',
  newReportsCount = 0,
  soundEnabled,
  onToggleSound,
  pendingStudentsCount = 0,
}) => {
  const [userPoints, setUserPoints] = useState<number>(() => pointsManager.getPoints());
  const [masterVolume, setMasterVolume] = useState<number>(() => Math.round(soundManager.getVolume() * 100));
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());

  useEffect(() => {
    const handleVolumeSync = (e: any) => {
      if (e.detail) {
        setIsMuted(e.detail.isMuted);
        if (typeof e.detail.volume === 'number') {
          setMasterVolume(Math.round(e.detail.volume * 100));
        }
      }
    };
    window.addEventListener('volume-changed', handleVolumeSync);
    return () => window.removeEventListener('volume-changed', handleVolumeSync);
  }, []);

  const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMasterVolume(val);
    if (isMuted && val > 0) {
      soundManager.toggleMute();
      setIsMuted(false);
    }
    soundManager.setVolume(val / 100);
  };

  const handleMuteClick = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  useEffect(() => {
    setUserPoints(pointsManager.getPoints(currentUser?.id));
  }, [currentUser]);

  useEffect(() => {
    const handlePointsUpdate = (e: Event) => {
      // 'typing-points-earned' 의 detail.points 는 '이번에 받은 점수'라서 합계로 쓰면 안 됨 → 항상 지갑에서 다시 읽음
      void e;
      setUserPoints(pointsManager.getPoints(currentUser?.id));
    };

    window.addEventListener('points-updated', handlePointsUpdate);
    window.addEventListener('tamagotchi-updated', handlePointsUpdate);
    window.addEventListener('typing-points-earned', handlePointsUpdate);
    // 연습 창(새 창)에서 받은 포인트도 바로 반영
    window.addEventListener('storage', handlePointsUpdate);
    window.addEventListener('focus', handlePointsUpdate);
    return () => {
      window.removeEventListener('storage', handlePointsUpdate);
      window.removeEventListener('focus', handlePointsUpdate);
      window.removeEventListener('points-updated', handlePointsUpdate);
      window.removeEventListener('tamagotchi-updated', handlePointsUpdate);
      window.removeEventListener('typing-points-earned', handlePointsUpdate);
    };
  }, [currentUser]);

  // 계정 버튼 앞 그림: 내 타자 등급 (선생님은 왕관, 로그인 전은 웃는 얼굴)
  const tier = currentUser?.role === 'master' ? { emoji: '👑', title: '선생님' } : currentUser ? myTier(currentUser.id) : { emoji: '🙂', title: '' };

  // 위쪽 메뉴: 1~4단계 연습 → 지식 타자 → 게임 → 명예의 전당 (홈 지도 STAGE 순서와 같게)
  //  - 배지는 꼭 알아야 할 것(긴 글 잠금, 로그인 필요)만 남겨 좁은 화면에서도 한 줄~두 줄에 다 보이게
  type NavItem = { mode: AppMode; label: string; icon: any; color: string; badge?: string; step?: number; sep?: boolean };
  const navItems: NavItem[] = [
    { mode: 'key-practice', label: '자리 연습', icon: Keyboard, color: 'sky', step: 1 },
    { mode: 'word-practice', label: '낱말 연습', icon: BookOpen, color: 'mint', step: 2 },
    { mode: 'sentence-practice', label: '짧은 글', icon: FileText, color: 'pink', step: 3 },
    { mode: 'long-practice', label: '긴 글', icon: FileText, color: 'indigo', step: 4, badge: longUnlocked(currentUser) ? undefined : `🔒${SHORT_TO_LONG_CPM}타` },
    { mode: 'knowledge-hub', label: '지식 타자', icon: GraduationCap, color: 'purple', sep: true },
    { mode: 'mini-games', label: '미니타자게임', icon: Gamepad2, color: 'rose', sep: true },
    { mode: 'playground', label: '놀이터', icon: Sparkles, color: 'yellow', badge: currentUser ? undefined : '로그인' },
    { mode: 'leaderboard', label: '명예의 전당', icon: Trophy, color: 'yellow', sep: true },
  ];

  return (
    <header className="tp-nav sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#B2EBF2] shadow-xs">
      {/* Topmost Cute Announcement Strip */}
      <div className="tp-nav-strip relative bg-gradient-to-r from-[#4DD0E1] via-[#29B6F6] to-[#AB47BC] text-white text-[11px] sm:text-xs font-black py-1 px-3 text-center flex items-center justify-center gap-2 shadow-xs">
        <span className="animate-bounce">✨</span>
        <span className="tp-nav-strip-chip bg-white/20 px-2.5 py-0.5 rounded-full border border-white/40 font-black">
          🐾 타자팡 랜드
        </span>
        <span className="tp-nav-strip-text hidden sm:inline text-pink-100 font-bold">
          • 귀여운 동물 친구들과 함께하는 신나는 타자 모험! 💖
        </span>
        <span className="animate-bounce">✨</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* 대표 로고 두 개를 나란히: 타자팡(홈) · 모아팡(모아팡 첫 화면으로) */}
          <div className="tp-brands flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => onSelectMode('home')}
              className="tp-brand flex items-center gap-2 group text-left cursor-pointer"
              title="타자팡 홈"
            >
              <img src="./assets/brand/tajapang.webp" alt="" aria-hidden="true" className="tp-brand-icon" draggable={false} />
              <img src="./assets/brand/tajapang_word.webp" alt="타자팡" className="tp-brand-word" draggable={false} />
            </button>
            <span className="tp-brand-sep" aria-hidden="true">✦</span>
            <a href="../" className="tp-brand tp-brand--moa flex items-center gap-2 group no-underline" title="모아팡 첫 화면으로 가기" data-testid="nav-go-moapang">
              <img src="./assets/brand/moapang.webp" alt="" aria-hidden="true" className="tp-brand-icon" draggable={false} />
              <img src="./assets/brand/moapang_word.webp" alt="모아팡" className="tp-brand-word" draggable={false} />
            </a>
          </div>

          {/* Right Action Tools: Master Portal, Sound, Profile/Login */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">

            {/* Typing History Modal Button */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="tp-nbtn tp-nbtn--wood px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-black bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="내 계정 (캐릭터 꾸미기 · 내 정보 · 타자 기록 · 성적표)"
                data-testid="nav-records"
              >
                <span className="tp-tier-badge" title={tier.title} aria-hidden="true">{tier.emoji}</span>
                <span className="flex flex-col items-start leading-none">
                  <span>계정</span>
                  {currentUser && <span className="tp-tier-name">{tier.title}</span>}
                </span>
              </button>
            )}

            {/* 학생: 오늘 연습을 선생님께 보내기 */}
            {onOpenSendReport && currentUser && currentUser.role !== 'master' && (
              <button
                onClick={onOpenSendReport}
                data-testid="nav-send-report"
                className={`tp-nbtn relative px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-black border-2 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  sendReportState === 'ready'
                    ? 'bg-sky-500 hover:bg-sky-400 text-white border-sky-600 animate-pulse'
                    : sendReportState === 'none'
                    ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
                title="오늘 연습한 것을 선생님께 보내요"
              >
                <span>{sendReportState === 'checked' ? '💮' : '📮'}</span>
                <span className="hidden md:inline">{sendReportState === 'checked' ? '선생님 확인!' : sendReportState === 'sent' ? '오늘 보냄' : '선생님께 보내기'}</span>
                <span className="md:hidden">{sendReportState === 'sent' || sendReportState === 'checked' ? '보냄' : '보내기'}</span>
              </button>
            )}

            {/* Half-Year Report Card Button (For Parents & Students) */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="tp-nbtn tp-nbtn--neon px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-black bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border-2 border-pink-400"
                title="상반기/하반기 월별 타수 성장 & 진도표 학부모 알림 발송"
              >
                <MessageSquare className="w-3.5 h-3.5 text-yellow-300" />
                <span className="hidden md:inline"><span className="whitespace-nowrap">상·하반기</span> 성적표</span>
                <span className="md:hidden">성적표</span>
              </button>
            )}

            {/* Master Console Button (Only visible for Master teacher) */}
            {currentUser?.role === 'master' && (
              <button
                onClick={onOpenMaster}
                className="tp-nbtn tp-nbtn--neon relative px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm border-2 cursor-pointer bg-pink-500 text-white border-pink-600 arcade-btn-pink"
                title="마스터(선생님) 관리실 - 학생 승인 & 비밀번호 조회"
              >
                <PixelIcon name="crown" size={24} />
                <span className="hidden sm:inline">마스터 관리실</span>
                {pendingStudentsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-bounce shadow-xs">
                    {pendingStudentsCount}
                  </span>
                )}
                {newReportsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-white text-rose-600 text-[10px] font-black shadow-xs" title="아직 확인하지 않은 학생 보고" data-testid="nav-new-reports">
                    📮 {newReportsCount}
                  </span>
                )}
              </button>
            )}

            {/* Total Points Wallet Indicator (상단 마스터 관리실 옆 전체 보유 포인트) */}
            <div className="tp-pt-wrap">
            <button
              onClick={() => onOpenProfile('account')}
              className="tp-nbtn tp-nbtn--coin px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-100 hover:from-yellow-100 hover:to-amber-200 text-amber-950 border-2 border-yellow-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
              aria-label="내 포인트 (누르면 내 계정)"
            >
              <PixelIcon name="coin" size={26} className="group-hover:rotate-12 transition-transform" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] sm:text-[10px] font-black text-amber-800 leading-none">
                  포인트
                </span>
                <span className="font-extrabold text-xs sm:text-sm font-arcade tracking-tight text-amber-950 leading-tight whitespace-nowrap">
                  {userPoints >= MASTER_POINTS ? (
                    <>
                      ∞ <span className="text-[10px] font-black text-amber-700">무제한</span>
                    </>
                  ) : (
                    <>
                      {userPoints.toLocaleString()} <span className="text-[10px] font-black text-amber-700">P</span>
                    </>
                  )}
                </span>
              </div>
            </button>
            {/* 마우스를 올리면: 포인트 모으는 법 · 쓰는 곳 · 펀펀 플레이까지 남은 포인트 */}
            {userPoints < MASTER_POINTS && (
              <div className="tp-pt-tip" role="tooltip" data-testid="points-tip">
                <b>💰 포인트 모으는 법</b>
                <ul>
                  <li>⌨️ 타자 연습 한 세트 끝내기 +{PRACTICE_SET_POINTS}P</li>
                  <li>🎮 타자 게임 한 판 끝내기 +{GAME_POINTS}P</li>
                  <li>🏆 주간 랭킹 1~3등 선물</li>
                </ul>
                <b>🎁 쓰는 곳</b>
                <ul>
                  <li>🎢 놀이터 펀펀 플레이 10분 {FUNFUN_ENTRY_POINTS.toLocaleString()}P</li>
                </ul>
                {!currentUser ? (
                  <div className="tp-pt-goal">로그인해야 포인트가 모여요.</div>
                ) : userPoints < FUNFUN_ENTRY_POINTS ? (
                  <div className="tp-pt-goal">
                    펀펀 플레이까지 <b>{(FUNFUN_ENTRY_POINTS - userPoints).toLocaleString()}P</b> 남았어요!
                    <div className="tp-pt-bar"><i style={{ width: `${Math.round((userPoints / FUNFUN_ENTRY_POINTS) * 100)}%` }} /></div>
                  </div>
                ) : (
                  <div className="tp-pt-goal">펀펀 플레이에 들어갈 수 있어요! 🎉</div>
                )}
              </div>
            )}
            </div>

            {/* Global Fixed Volume Slider */}
            <div className="tp-nbtn tp-nbtn--crt flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-sky-50/90 border-2 border-sky-200 text-sky-700 shadow-xs">
              <button
                onClick={handleMuteClick}
                className="hover:scale-110 transition-transform cursor-pointer p-0.5"
                title={isMuted || masterVolume === 0 ? '음소거 해제' : '음소거'}
              >
                {isMuted || masterVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500" />
                ) : (
                  <Volume2 className="w-4 h-4 text-sky-600" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={isMuted ? 0 : masterVolume}
                onChange={handleVolumeSliderChange}
                className="w-14 sm:w-20 h-1.5 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-500"
                title="모든 소리 볼륨 조절"
              />
              <span className="text-[10px] font-black w-6 text-right text-sky-800">
                {isMuted ? '0%' : `${masterVolume}%`}
              </span>
            </div>

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onLogout}
                  className="tp-nbtn tp-nbtn--red p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-2 border-slate-200 hover:border-rose-200 transition-all text-xs font-bold cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAuth}
                  className="tp-nbtn tp-nbtn--start arcade-btn-sky text-white px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  <span>들어가기</span>
                </button>
                <button
                  onClick={() => {
                    try {
                      sessionStorage.setItem('taja_open_signup', '1');
                    } catch {}
                    onOpenAuth();
                  }}
                  data-testid="nav-signup"
                  className="tp-nbtn tp-nbtn--wood px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap bg-emerald-50 text-emerald-800 border-2 border-emerald-300"
                >
                  <span aria-hidden="true">✨</span>
                  <span>새로 가입하기</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Mode Tabs Bar (Scrollable for compact screens) */}
        <div className="tp-nav-tabs flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar border-t border-slate-100">
          <button
            onClick={() => onSelectMode('home')}
            className={`tp-tab ${currentMode === 'home' ? 'is-active' : ''} px-3.5 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              currentMode === 'home'
                ? 'bg-slate-900 text-white shadow-xs scale-105'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span>🏠 홈</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isMiniGame = (item.mode as any) === 'mini-games';
            const isMiniGameActive = ['mini-games', 'word-crush', 'mole-game', 'rain-game', 'shortcut-quiz', 'tamagotchi'].includes(currentMode);
            const isKnowledge = (item.mode as any) === 'knowledge-hub';
            const isKnowledgeActive = ['knowledge-hub', 'capital-journey', 'joseon-journey', 'transcription-challenge', 'lyrics-challenge', 'python-coding'].includes(currentMode);
            const isActive = isMiniGame ? isMiniGameActive : isKnowledge ? isKnowledgeActive : currentMode === item.mode;

            let activeStyles = 'bg-sky-500 text-white shadow-md border-sky-600 ring-2 ring-sky-200 scale-105';
            if (item.color === 'indigo') activeStyles = 'bg-indigo-600 text-white shadow-md border-indigo-700 ring-2 ring-indigo-200 scale-105';
            if (item.color === 'purple') activeStyles = 'bg-purple-600 text-white shadow-md border-purple-700 ring-2 ring-purple-200 scale-105';
            if (item.color === 'emerald') activeStyles = 'bg-emerald-600 text-white shadow-md border-emerald-700 ring-2 ring-emerald-200 scale-105';
            if (item.color === 'amber') activeStyles = 'bg-amber-600 text-white shadow-md border-amber-700 ring-2 ring-amber-200 scale-105';
            if (item.color === 'pink') activeStyles = 'bg-pink-500 text-white shadow-md border-pink-600 ring-2 ring-pink-200 scale-105';
            if (item.color === 'mint') activeStyles = 'bg-teal-500 text-white shadow-md border-teal-600 ring-2 ring-teal-200 scale-105';
            if (item.color === 'rose') activeStyles = 'bg-rose-500 text-white shadow-md border-rose-600 ring-2 ring-rose-200 scale-105';
            if (item.color === 'yellow') activeStyles = 'bg-amber-400 text-amber-950 font-black shadow-md border-amber-500 ring-2 ring-amber-200 scale-105';

            return (
              <React.Fragment key={item.mode}>
              {item.sep && <span className="tp-nav-sep" aria-hidden="true" />}
              <button
                onClick={() => {
                  if (item.mode === 'playground' && !currentUser) {
                    soundManager.play('error');
                    onOpenAuth();
                    return;
                  }
                  soundManager.play('click');
                  onSelectMode(item.mode);
                }}
                className={`tp-tab ${isActive ? 'is-active' : ''} px-3 py-1.5 rounded-xl font-extrabold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border relative cursor-pointer ${
                  isActive
                    ? activeStyles
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700'
                }`}
              >
                {item.step ? (
                  <span className="tp-step-no" aria-label={`${item.step}단계`}>{item.step}</span>
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color === 'rose' ? 'text-rose-500' : ''}`} />
                )}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`tp-tab-badge text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                    isActive ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
};
