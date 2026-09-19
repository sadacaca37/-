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
import { CharacterAvatar, DEFAULT_AVATAR_CONFIG } from './CharacterAvatar';
import { pointsManager } from '../utils/pointsManager';
import { soundManager } from '../utils/sound';


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
      const customEvt = e as CustomEvent;
      if (customEvt.detail?.points !== undefined) {
        setUserPoints(customEvt.detail.points);
      } else {
        setUserPoints(pointsManager.getPoints(currentUser?.id));
      }
    };

    window.addEventListener('points-updated', handlePointsUpdate);
    window.addEventListener('tamagotchi-updated', handlePointsUpdate);
    window.addEventListener('typing-points-earned', handlePointsUpdate);
    return () => {
      window.removeEventListener('points-updated', handlePointsUpdate);
      window.removeEventListener('tamagotchi-updated', handlePointsUpdate);
      window.removeEventListener('typing-points-earned', handlePointsUpdate);
    };
  }, [currentUser]);

  const navItems = [
    { mode: 'key-practice' as AppMode, label: '자리 연습', icon: Keyboard, color: 'sky' },
    { mode: 'word-practice' as AppMode, label: '낱말 연습', icon: BookOpen, color: 'mint' },
    { mode: 'sentence-practice' as AppMode, label: '짧은 글 (5분)', icon: FileText, color: 'pink', badge: '한/영' },
    { mode: 'long-practice' as AppMode, label: '긴 글 연습', icon: FileText, color: 'indigo', badge: '신규' },
    { mode: 'knowledge-hub' as AppMode, label: '지식 타자', icon: GraduationCap, color: 'purple', badge: '3대 코스' },
    { mode: 'mini-games' as any, label: '미니타자게임', icon: Gamepad2, color: 'rose', badge: '무료' },
    { 
      mode: 'playground' as AppMode, 
      label: '놀이터', 
      icon: Sparkles, 
      color: 'yellow', 
      badge: currentUser ? (currentUser?.role === 'master' ? '마스터 FREE' : '기본/펀펀') : '로그인 전용'
    },
    { mode: 'leaderboard' as AppMode, label: '명예의 전당', icon: Trophy, color: 'yellow', badge: '랭킹' },
  ];

  return (
    <header className="tp-nav sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-[#B2EBF2] shadow-xs">
      {/* Topmost Cute Announcement Strip */}
      <div className="tp-nav-strip bg-gradient-to-r from-[#4DD0E1] via-[#29B6F6] to-[#AB47BC] text-white text-[11px] sm:text-xs font-black py-1 px-3 text-center flex items-center justify-center gap-2 shadow-xs">
        <span className="animate-bounce">✨</span>
        <span className="tp-nav-strip-chip bg-white/20 px-2.5 py-0.5 rounded-full border border-white/40 font-black">
          🐾 팡팡 타자랜드
        </span>
        <span className="tp-nav-strip-text hidden sm:inline text-pink-100 font-bold">
          • 귀여운 동물 친구들과 함께하는 신나는 타자 모험! 💖
        </span>
        <span className="animate-bounce">✨</span>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Logo & Home Button */}
          <button
            onClick={() => onSelectMode('home')}
            className="flex items-center gap-2 sm:gap-3 group shrink-0 text-left cursor-pointer"
          >
            <div className="tp-nav-logo w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-pink-400 via-rose-400 to-sky-400 flex items-center justify-center text-white shadow-md border-2 border-pink-200 group-hover:scale-105 group-hover:rotate-3 transition-transform">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="tp-nav-title font-arcade text-lg sm:text-2xl font-black text-slate-800 tracking-tight group-hover:text-pink-600 transition-colors">
                  <span className="tp-nav-title-a">타자</span><span className="tp-nav-title-b text-pink-500">팡팡</span>
                </span>
                <span className="tp-nav-badge hidden md:inline-block px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black border border-pink-300">
                  PASTEL ARCADE
                </span>
              </div>
              <p className="tp-nav-sub text-[10px] sm:text-xs text-slate-400 font-bold hidden sm:block">
                손가락이 춤추는 알록달록 타자 모험 🐾
              </p>
            </div>
          </button>

          {/* Right Action Tools: Master Portal, Sound, Profile/Login */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Typing History Modal Button */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="tp-nbtn tp-nbtn--wood px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-black bg-purple-50 hover:bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="내가 친 타자 기록 및 CPM 통계 확인"
              >
                <History className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">타자 기록</span>
                <span className="md:hidden">기록</span>
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
                <span className="hidden md:inline">상·하반기 성적표</span>
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
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">마스터 관리실</span>
                {pendingStudentsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-bounce shadow-xs">
                    {pendingStudentsCount}
                  </span>
                )}
              </button>
            )}

            {/* Total Points Wallet Indicator (상단 마스터 관리실 옆 전체 보유 포인트) */}
            <button
              onClick={onOpenProfile}
              className="tp-nbtn tp-nbtn--coin px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-100 hover:from-yellow-100 hover:to-amber-200 text-amber-950 border-2 border-yellow-300 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 group"
              title="전체 보유 포인트 (클릭하여 아바타 꾸미기 및 상점 이동)"
            >
              <div className="w-5 h-5 rounded-full bg-yellow-400 border border-yellow-500 flex items-center justify-center text-xs shadow-2xs group-hover:rotate-12 transition-transform">
                🪙
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] sm:text-[10px] font-black text-amber-800 leading-none">
                  전체 보유 포인트
                </span>
                <span className="font-extrabold text-xs sm:text-sm font-arcade tracking-tight text-amber-950 leading-tight">
                  {userPoints.toLocaleString()} <span className="text-[10px] font-black text-amber-700">P</span>
                </span>
              </div>
            </button>

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
                  onClick={() => onOpenProfile('account')}
                  className="tp-nbtn tp-nbtn--wood flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 transition-all text-xs font-bold cursor-pointer"
                  title="내 계정 정보(이름/전화번호) & 4자리 비밀번호 확인/수정"
                >
                  <div className="w-8 h-8 rounded-xl bg-white border border-sky-200 shadow-2xs flex items-center justify-center overflow-hidden">
                    <CharacterAvatar
                      config={currentUser.avatarConfig || DEFAULT_AVATAR_CONFIG}
                      size="sm"
                      mood="happy"
                      animate={false}
                    />
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-extrabold text-slate-800 block leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-sky-600 font-bold">
                      {currentUser.role === 'master' ? '👑 마스터' : (currentUser.levelTitle || '타자 꿈나무')}
                    </span>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="tp-nbtn tp-nbtn--red p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-2 border-slate-200 hover:border-rose-200 transition-all text-xs font-bold cursor-pointer"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="tp-nbtn tp-nbtn--start arcade-btn-sky text-white px-3.5 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>로그인 / 학생등록</span>
              </button>
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
              <button
                key={item.mode}
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
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.color === 'rose' ? 'text-rose-500' : ''}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`tp-tab-badge text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                    isActive ? 'bg-white/30 text-white' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
