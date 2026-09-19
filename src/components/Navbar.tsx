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
    <header className="sticky top-0 z-40 bg-[#0F1026] text-white border-b-4 border-black shadow-[0_4px_0_#082F49,0_8px_20px_rgba(0,0,0,0.8)] relative">
      {/* 16-bit Arcade Top Marquee Strip with HP Hearts and Announcement */}
      <div className="bg-[#151838] border-b-2 border-black text-[#FFD700] text-[11px] sm:text-xs font-pixel py-1.5 px-3 flex items-center justify-between gap-2 select-none">
        {/* Left: Arcade Life / HP Hearts Counter */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[#FF4757] font-black text-xs">HP</span>
          <div className="flex items-center gap-0.5 text-sm">
            <span className="animate-pulse inline-block">❤️</span>
            <span className="animate-pulse inline-block" style={{ animationDelay: '0.2s' }}>❤️</span>
            <span className="animate-pulse inline-block" style={{ animationDelay: '0.4s' }}>❤️</span>
          </div>
          <span className="hidden md:inline text-[#00D2FF] text-[10px] pl-1">
            [LIFE: 3/3 FULL]
          </span>
        </div>

        {/* Center: Marquee Flashing Title */}
        <div className="flex items-center gap-2">
          <span className="text-[#FF4757] animate-bounce">⚡</span>
          <span className="text-[#FFD700] font-black tracking-wider pixel-text-shadow">
            ★ 16-BIT RETRO ARCADE TYPING ADVENTURE ★
          </span>
          <span className="text-[#FF4757] animate-bounce">⚡</span>
        </div>

        {/* Right: Credits / Sound Mode Status */}
        <div className="flex items-center gap-2 text-[10px] text-[#78E08F]">
          <span className="hidden sm:inline">STAGE CLEAR BONUS: 2X</span>
          <span className="bg-[#00D2FF]/20 px-1.5 py-0.5 rounded-xs border border-[#00D2FF]/50 text-[#00D2FF]">
            16-BIT CHIP
          </span>
        </div>
      </div>

      {/* Main Arcade Control Panel Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2">
          {/* Pixel Arcade Logo & Home Button */}
          <button
            onClick={() => onSelectMode('home')}
            className="flex items-center gap-2 sm:gap-3 group shrink-0 text-left cursor-pointer active:translate-y-0.5 transition-transform"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#38B6FF] border-3 border-black flex items-center justify-center text-white shadow-[2px_2px_0_#000] group-hover:bg-[#00D2FF] transition-colors relative overflow-hidden">
              <span className="text-xl sm:text-2xl animate-pulse">🕹️</span>
              <div className="absolute inset-0 bg-white/10 pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-pixel text-base sm:text-xl font-black text-[#FFD700] tracking-wider pixel-text-shadow group-hover:text-yellow-300 transition-colors">
                  타닥타닥 <span className="text-[#00D2FF]">타자랜드</span>
                </span>
                <span className="px-1.5 py-0.5 rounded-xs bg-[#FF4757] text-white text-[9px] font-pixel border border-black shadow-[1px_1px_0_#000]">
                  16-BIT
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-[#78E08F] font-bold font-arcade hidden sm:block">
                80~90s 고전 오락실 감성 종합 타자 연습 ⚡
              </p>
            </div>
          </button>

          {/* Right Action Tools: Master Portal, Sound Toggle, Coin Wallet, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Typing History Modal Button */}
            {onOpenHistory && (
              <button
                onClick={onOpenHistory}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-pixel bg-[#1C1F4A] hover:bg-[#252A63] text-[#00D2FF] border-2 border-[#00D2FF] shadow-[2px_2px_0_#000] transition-all flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
                title="내가 친 타자 기록 및 CPM 통계 확인"
              >
                <History className="w-3.5 h-3.5 text-[#00D2FF]" />
                <span className="hidden md:inline">기록 로그</span>
                <span className="md:hidden">기록</span>
              </button>
            )}

            {/* Half-Year Report Card Button */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-pixel bg-gradient-to-b from-[#A855F7] to-[#7E22CE] text-white border-2 border-black shadow-[2px_2px_0_#000] hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
                title="상반기/하반기 월별 타수 성장 & 진도표 학부모 알림 발송"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#FFD700]" />
                <span className="hidden md:inline">성적표</span>
                <span className="md:hidden">성적</span>
              </button>
            )}

            {/* Master Console Button (Only visible for Master teacher) */}
            {currentUser?.role === 'master' && (
              <button
                onClick={onOpenMaster}
                className="relative px-3 py-1.5 sm:py-2 rounded-lg text-xs font-pixel transition-all flex items-center gap-1.5 shadow-[2px_2px_0_#000] border-2 border-black cursor-pointer bg-[#FF4757] hover:bg-[#E11D48] text-white active:translate-y-0.5"
                title="마스터(선생님) 관리실 - 학생 승인 & 비밀번호 조회"
              >
                <Crown className="w-4 h-4 text-[#FFD700]" />
                <span className="hidden sm:inline">마스터 관리</span>
                {pendingStudentsCount > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-[#FFD700] text-[#0F1026] text-[10px] font-black animate-bounce shadow-xs">
                    {pendingStudentsCount}
                  </span>
                )}
              </button>
            )}

            {/* Total Points Wallet Indicator: Arcade Coin Slot Style */}
            <button
              onClick={onOpenProfile}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#24170E] hover:bg-[#341F10] text-[#FFD700] border-2 border-[#E5B55A] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),2px_2px_0_#000] transition-all flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 group"
              title="전체 보유 코인 포인트 (클릭하여 아바타 꾸미기 및 상점 이동)"
            >
              <div className="w-5 h-5 rounded-full bg-[#FFD700] border border-black flex items-center justify-center text-xs shadow-2xs group-hover:rotate-180 transition-transform">
                🪙
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[9px] sm:text-[10px] font-pixel text-[#E5B55A] leading-none">
                  COINS
                </span>
                <span className="font-pixel text-xs sm:text-sm font-black text-[#FFD700] leading-tight">
                  {userPoints.toLocaleString()} <span className="text-[9px] text-[#F59E0B]">P</span>
                </span>
              </div>
            </button>

            {/* Retro Sound & BGM Toggle with Volume Slider */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151838] border-2 border-[#00D2FF]/50 text-[#00D2FF] shadow-[2px_2px_0_#000]">
              <button
                onClick={handleMuteClick}
                className="hover:scale-110 transition-transform cursor-pointer p-0.5"
                title={isMuted || masterVolume === 0 ? 'BGM/효과음 켜기' : 'BGM/효과음 끄기 (음소거)'}
              >
                {isMuted || masterVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#FF4757]" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#00D2FF]" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={isMuted ? 0 : masterVolume}
                onChange={handleVolumeSliderChange}
                className="w-12 sm:w-16 h-1.5 bg-[#0F1026] rounded-lg appearance-none cursor-pointer accent-[#00D2FF]"
                title="모든 사운드 볼륨 조절"
              />
              <span className="text-[9px] font-pixel w-6 text-right text-[#00D2FF]">
                {isMuted ? 'MUTE' : `${masterVolume}%`}
              </span>
            </div>

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenProfile('account')}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-lg bg-[#1C1F4A] hover:bg-[#252A63] border-2 border-[#38B6FF] transition-all text-xs font-pixel cursor-pointer active:translate-y-0.5"
                  title="내 계정 정보 & 비밀번호 조회"
                >
                  <div className="w-8 h-8 rounded-md bg-[#0F1026] border border-[#00D2FF] shadow-2xs flex items-center justify-center overflow-hidden">
                    <CharacterAvatar
                      config={currentUser.avatarConfig || DEFAULT_AVATAR_CONFIG}
                      size="sm"
                      mood="happy"
                      animate={false}
                    />
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="font-pixel text-xs text-white block leading-tight truncate max-w-[80px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] text-[#78E08F] font-pixel block">
                      {currentUser.role === 'master' ? '👑 MASTER' : (currentUser.levelTitle || 'PLAYER 1')}
                    </span>
                  </div>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 sm:p-2.5 rounded-lg bg-[#3F1318] hover:bg-[#5C1B24] text-[#FF4757] border-2 border-[#FF4757] transition-all text-xs cursor-pointer active:translate-y-0.5"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="arcade-cta-start px-3.5 py-1.5 sm:py-2 rounded-lg font-pixel text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer font-black"
              >
                <LogIn className="w-4 h-4" />
                <span>[ INSERT COIN ]</span>
              </button>
            )}
          </div>
        </div>

        {/* 16-bit Cartridge Style Navigation Bar */}
        <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar border-t-2 border-[#151838]">
          <button
            onClick={() => onSelectMode('home')}
            className={`px-3 py-1.5 rounded-lg font-pixel text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border-2 ${
              currentMode === 'home'
                ? 'bg-[#FFD700] text-[#0F1026] border-black shadow-[2px_2px_0_#000] font-black scale-105'
                : 'bg-[#151838] text-slate-300 border-black hover:bg-[#1E2350] hover:text-white'
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

            let activeClass = 'bg-[#00D2FF] text-[#0F1026] border-black shadow-[2px_2px_0_#000] scale-105 font-black';
            if (item.color === 'pink') activeClass = 'bg-[#FF4757] text-white border-black shadow-[2px_2px_0_#000] scale-105 font-black';
            if (item.color === 'yellow') activeClass = 'bg-[#FFD700] text-[#0F1026] border-black shadow-[2px_2px_0_#000] scale-105 font-black';
            if (item.color === 'mint') activeClass = 'bg-[#78E08F] text-[#064E3B] border-black shadow-[2px_2px_0_#000] scale-105 font-black';
            if (item.color === 'purple') activeClass = 'bg-[#A855F7] text-white border-black shadow-[2px_2px_0_#000] scale-105 font-black';
            if (item.color === 'indigo') activeClass = 'bg-[#6366F1] text-white border-black shadow-[2px_2px_0_#000] scale-105 font-black';
            if (item.color === 'rose') activeClass = 'bg-[#FB7185] text-[#4C0519] border-black shadow-[2px_2px_0_#000] scale-105 font-black';

            return (
              <button
                key={item.mode}
                onClick={() => {
                  soundManager.play('click');
                  onSelectMode(item.mode);
                }}
                className={`px-3 py-1.5 rounded-lg font-pixel text-xs whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border-2 relative cursor-pointer ${
                  isActive
                    ? activeClass
                    : 'bg-[#151838] text-slate-300 border-black hover:bg-[#1E2350] hover:text-white shadow-[1px_1px_0_#000]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-inherit' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-pixel font-black ${
                    isActive ? 'bg-black/30 text-inherit' : 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/40'
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
