import React, { useState, useEffect, lazy, Suspense } from 'react';
import { GameFitStage } from './components/GameFitStage';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HomeDashboard } from './components/views/HomeDashboard';
import { TapangFooter, GutterBots } from './components/views/TapangHome';
import { AppMode, UserSession, LeaderboardEntry } from './types';
import { PracticeWindowContainer } from './components/PracticeWindowContainer';
import { soundManager } from './utils/sound';
import { typangApi } from './utils/apiClient';
import { userPersistenceManager } from './utils/userPersistenceManager';

// 첫 화면에 필요 없는 화면·창은 필요할 때 불러와서 처음 접속이 빨라지도록 분리
const ProfileModal = lazy(() => import('./components/ProfileModal').then((m) => ({ default: m.ProfileModal })));
const MasterModal = lazy(() => import('./components/MasterModal').then((m) => ({ default: m.MasterModal })));
const MonthlyReportModal = lazy(() => import('./components/MonthlyReportModal').then((m) => ({ default: m.MonthlyReportModal })));
const PracticeHistoryModal = lazy(() => import('./components/PracticeHistoryModal').then((m) => ({ default: m.PracticeHistoryModal })));
const KeyPracticeView = lazy(() => import('./components/views/KeyPracticeView').then((m) => ({ default: m.KeyPracticeView })));
const WordPracticeView = lazy(() => import('./components/views/WordPracticeView').then((m) => ({ default: m.WordPracticeView })));
const SentencePracticeView = lazy(() => import('./components/views/SentencePracticeView').then((m) => ({ default: m.SentencePracticeView })));
const LongTextPracticeView = lazy(() => import('./components/views/LongTextPracticeView').then((m) => ({ default: m.LongTextPracticeView })));
const JourneyPracticeView = lazy(() => import('./components/views/JourneyPracticeView').then((m) => ({ default: m.JourneyPracticeView })));
const KnowledgeHubView = lazy(() => import('./components/views/KnowledgeHubView').then((m) => ({ default: m.KnowledgeHubView })));
const PythonPracticeView = lazy(() => import('./components/views/PythonPracticeView').then((m) => ({ default: m.PythonPracticeView })));
const WordCrushView = lazy(() => import('./components/views/WordCrushView').then((m) => ({ default: m.WordCrushView })));
const MoleGameView = lazy(() => import('./components/views/MoleGameView').then((m) => ({ default: m.MoleGameView })));
const RainGameView = lazy(() => import('./components/views/RainGameView').then((m) => ({ default: m.RainGameView })));
const ShortcutQuizView = lazy(() => import('./components/views/ShortcutQuizView').then((m) => ({ default: m.ShortcutQuizView })));
const LeaderboardView = lazy(() => import('./components/views/LeaderboardView').then((m) => ({ default: m.LeaderboardView })));
const TamagotchiView = lazy(() => import('./components/views/TamagotchiView').then((m) => ({ default: m.TamagotchiView })));
const PlaygroundHome = lazy(() => import('./components/views/playground/PlaygroundHome').then((m) => ({ default: m.PlaygroundHome })));
const MiniGamesHubView = lazy(() => import('./components/views/MiniGamesHubView').then((m) => ({ default: m.MiniGamesHubView })));

// Initial Hall of Fame data (Strictly for Short Sentence Practice)
const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'lead_1',
    userName: '타자마스터',
    userAvatar: '👑',
    mode: 'sentence',
    modeTitle: '짧은 글 (5분 마라톤 완주)',
    score: 5800,
    cpm: 520,
    accuracy: 99,
    date: '2026.08.24',
    details: '5분 연속 완주 (18문장 완료)',
    completedSentences: 18,
  },
  {
    id: 'lead_2',
    userName: '초등타자왕',
    userAvatar: '⚡',
    mode: 'sentence',
    modeTitle: '짧은 글 (지혜의 속담)',
    score: 4900,
    cpm: 460,
    accuracy: 100,
    date: '2026.08.24',
    details: '속담 명언 (15문장 완주)',
    completedSentences: 15,
  },
  {
    id: 'lead_3',
    userName: '서정문학소녀',
    userAvatar: '🐱',
    mode: 'sentence',
    modeTitle: '짧은 글 (서정 동시 & 문학)',
    score: 4300,
    cpm: 410,
    accuracy: 98,
    date: '2026.08.23',
    details: '동시 문학 (12문장 완주)',
    completedSentences: 12,
  },
  {
    id: 'lead_4',
    userName: '과학탐험대',
    userAvatar: '🚀',
    mode: 'sentence',
    modeTitle: '짧은 글 (신비한 자연 과학)',
    score: 3850,
    cpm: 370,
    accuracy: 97,
    date: '2026.08.22',
    details: '자연 과학 (10문장 완주)',
    completedSentences: 10,
  },
  {
    id: 'lead_5',
    userName: '성실연습생',
    userAvatar: '🌟',
    mode: 'sentence',
    modeTitle: '짧은 글 (영문 속담 명언)',
    score: 3400,
    cpm: 330,
    accuracy: 99,
    date: '2026.08.21',
    details: '영문 속담 (10문장 완주)',
    completedSentences: 10,
  },
];


// Helper to detect initial mode synchronously from URL params (?mode=...)
const getInitialMode = (): AppMode => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode') as AppMode;
      const isPopup = params.get('popup') === 'true';
      if (urlMode) {
        // Practice modes are exclusively viewed in dedicated popup window
        if (['key-practice', 'word-practice', 'sentence-practice', 'long-practice'].includes(urlMode) && !isPopup) {
          return 'home';
        }
        return urlMode;
      }
    } catch {}
  }
  return 'home';
};

/** 첫 화면이 뜬 뒤 한가할 때 자주 여는 창들을 미리 받아 둠 → 처음 눌러도 바로 뜸 */
if (typeof window !== 'undefined') {
  const warm = () => {
    [
      () => import('./components/ProfileModal'),
      () => import('./components/MasterModal'),
      () => import('./components/PracticeHistoryModal'),
      () => import('./components/views/playground/PlaygroundHome'),
      () => import('./components/views/KnowledgeHubView'),
      () => import('./components/views/MiniGamesHubView'),
      () => import('./components/views/LeaderboardView'),
    ].forEach((load, i) => setTimeout(() => load().catch(() => {}), i * 400));
  };
  const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 2500));
  window.addEventListener('load', () => idle(warm, { timeout: 4000 }), { once: true });
}

/** 열려 있는 연습 창 (모드별로 하나) */
const openPracticeWindows = new Map<string, Window>();

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>(getInitialMode);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'avatar' | 'account'>('account');
  const [isMasterOpen, setIsMasterOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [reportTargetUser, setReportTargetUser] = useState<UserSession | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [usersDb, setUsersDb] = useState<UserSession[]>([]);

  const handleOpenProfile = (tab: 'avatar' | 'account' = 'account') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  };

  // Initialize DB and sessions
  useEffect(() => {
    try {
      // 1. 회원 명단: 서버(members.json 고정 명단)가 기준. 먼저 캐시로 그리고, 서버 명단으로 교체
      setUsersDb(userPersistenceManager.getLocalUsers());
      typangApi.getUsers().then((serverUsers) => setUsersDb(serverUsers)).catch(() => {});

      // 2. Current User Session
      const savedUser = localStorage.getItem('typang_current_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }

      // 3. Hall of Fame Leaderboard - Reset on the 1st of every month
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const storedMonth = localStorage.getItem('typang_leaderboard_month');

      if (storedMonth !== currentMonth) {
        // Reset on the 1st of the month
        localStorage.setItem('typang_leaderboard_month', currentMonth);
        localStorage.setItem('typang_leaderboard', JSON.stringify([]));
        setLeaderboard([]);
      } else {
        const savedLeaderboard = localStorage.getItem('typang_leaderboard');
        if (savedLeaderboard) {
          setLeaderboard(JSON.parse(savedLeaderboard));
        } else {
          setLeaderboard(INITIAL_LEADERBOARD);
          localStorage.setItem('typang_leaderboard', JSON.stringify(INITIAL_LEADERBOARD));
        }
      }

      // Sync leaderboard from server
      fetch('/api/leaderboard')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.leaderboard)) {
            setLeaderboard(data.leaderboard);
            localStorage.setItem('typang_leaderboard', JSON.stringify(data.leaderboard));
          }
        })
        .catch(() => {});
    } catch {
      // Fallback
    }
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const handleLogout = () => {
    localStorage.removeItem('typang_current_user');
    typangApi.clearMasterKey();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    localStorage.setItem('typang_current_user', JSON.stringify(user));
  };

  const handleUpdateUsersList = (updated: UserSession[]) => {
    setUsersDb(updated);
    // If currently logged in user got updated or revoked
    if (currentUser) {
      const matched = updated.find((u) => u.id === currentUser.id);
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('typang_current_user', JSON.stringify(matched));
      }
    }
  };

  const handleUpdateProfile = (updatedUser: UserSession) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('typang_current_user', JSON.stringify(updatedUser));

    const updatedDb = usersDb.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsersDb(updatedDb);
    localStorage.setItem('typang_users_db', JSON.stringify(updatedDb));
  };

  // Record score exclusively to Hall of Fame when logged in (Leaderboard is for sentence practice)
  const handleRecordScore = (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => {
    // Only logged in members can have records permanently placed on the leaderboard
    if (!currentUser) return;

    // Only sentence practice goes to Hall of Fame
    if (entry.mode !== 'sentence') return;

    const todayStr = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace('.', '');

    const newRecord: LeaderboardEntry = {
      ...entry,
      id: `lead_${Date.now()}`,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || '👑',
      date: todayStr || '2026.08.24',
    };

    const updated = [newRecord, ...leaderboard];
    setLeaderboard(updated);
    localStorage.setItem('typang_leaderboard', JSON.stringify(updated));

    // Update currentUser high stats
    const updatedUser: UserSession = {
      ...currentUser,
      totalPracticeCount: (currentUser.totalPracticeCount || 0) + 1,
      highestCpm: Math.max(currentUser.highestCpm || 0, entry.cpm || 0),
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('typang_current_user', JSON.stringify(updatedUser));

    const updatedDb = usersDb.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsersDb(updatedDb);
    localStorage.setItem('typang_users_db', JSON.stringify(updatedDb));
  };

  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    localStorage.removeItem('typang_leaderboard');
  };

  // Detect standalone popup window mode (?popup=true)
  const isPopupMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('popup') === 'true';

  const isPracticeMode = (mode: AppMode): mode is 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice' => {
    return ['key-practice', 'word-practice', 'sentence-practice', 'long-practice'].includes(mode);
  };

  const handleSelectMode = (mode: AppMode) => {
    if (isPracticeMode(mode)) {
      if (!isPopupMode) {
        // Open dedicated popup browser window; if the browser blocks popups, open it inside this page
        let opened = false;
        try {
          // 이미 열려 있는 연습 창이면 새로 불러오지 않고 앞으로만 가져옴 (여러 번 눌러도 버벅이지 않게)
          const existing = openPracticeWindows.get(mode);
          if (existing && !existing.closed) {
            existing.focus();
            return;
          }
          const url = `${window.location.origin}${window.location.pathname}?mode=${mode}&popup=true`;
          const popup = window.open(
            url,
            `typang_practice_${mode}`,
            'width=1320,height=880,left=80,top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no'
          );
          if (popup) {
            openPracticeWindows.set(mode, popup);
            popup.focus();
            opened = true;
          }
        } catch (e) {
          console.warn('Popup window open error or blocked:', e);
        }
        if (!opened) {
          setCurrentMode(mode);
          window.scrollTo({ top: 0 });
        }
        // Exclusively opens in new window, leaving underlying original mode intact
        return;
      }
    }
    setCurrentMode(mode);
  };

  // Count pending students for Master badge
  const pendingStudentsCount = usersDb.filter((u) => !u.isApproved && u.role !== 'master').length;

  return (
    <div className={`min-h-screen ${isPopupMode ? 'bg-slate-950 text-slate-100' : 'bg-transparent text-slate-800'} flex flex-col font-sans arcade-dot-bg ${isPopupMode ? '' : 'retro-cursor'}`}>
      {!isPopupMode && <GutterBots />}
      {/* Navigation Header with Creator Credit - Hidden in standalone popup window */}
      {!isPopupMode && (
        <Navbar
          currentMode={currentMode}
          onSelectMode={handleSelectMode}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenProfile={handleOpenProfile}
          onOpenMaster={() => {
            if (currentUser?.role === 'master') {
              setIsMasterOpen(true);
            }
          }}
          onOpenReport={() => {
            setReportTargetUser(currentUser);
            setIsReportOpen(true);
          }}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onLogout={handleLogout}
          soundEnabled={!isMuted}
          onToggleSound={handleToggleSound}
          pendingStudentsCount={pendingStudentsCount}
        />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${!isPopupMode && currentMode !== 'home' ? 'tp-skin' : ''} ${
        isPopupMode
          ? 'h-screen w-screen p-0 m-0 overflow-hidden'
          : ['key-practice', 'word-practice', 'sentence-practice', 'long-practice'].includes(currentMode)
          ? 'max-w-7xl px-2 sm:px-4 py-1.5 sm:py-2.5 mx-auto'
          : 'max-w-7xl px-3 sm:px-6 lg:px-8 py-6 mx-auto'
      }`}>
        <Suspense fallback={<div className="py-24 text-center text-sm font-black text-slate-500 animate-pulse">불러오는 중…</div>}>
        {currentMode === 'home' && (
          <HomeDashboard
            onSelectMode={handleSelectMode}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenProfile={handleOpenProfile}
            onOpenMaster={() => {
              if (currentUser?.role === 'master') {
                setIsMasterOpen(true);
              }
            }}
            onOpenReport={() => {
              setReportTargetUser(currentUser);
              setIsReportOpen(true);
            }}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        )}

        {currentMode === 'key-practice' && (
          <PracticeWindowContainer
            mode="key-practice"
            title="1단계: 자리 연습"
            stepNumber="1"
            icon="⌨️"
            onClose={() => setCurrentMode('home')}
            showKeyboardSimultaneousBadge={true}
          >
            <KeyPracticeView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
            />
          </PracticeWindowContainer>
        )}

        {currentMode === 'word-practice' && (
          <PracticeWindowContainer
            mode="word-practice"
            title="2단계: 낱말 연습"
            stepNumber="2"
            icon="📖"
            onClose={() => setCurrentMode('home')}
            showKeyboardSimultaneousBadge={true}
          >
            <WordPracticeView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
            />
          </PracticeWindowContainer>
        )}

        {currentMode === 'sentence-practice' && (
          <PracticeWindowContainer
            mode="sentence-practice"
            title="3단계: 짧은 글 연습 (5분 마라톤)"
            stepNumber="3"
            icon="📝"
            onClose={() => setCurrentMode('home')}
          >
            <SentencePracticeView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
            />
          </PracticeWindowContainer>
        )}

        {(currentMode === 'long-practice' || currentMode === 'transcription-challenge') && (
          <PracticeWindowContainer
            mode="long-practice"
            title="4단계: 긴 글 연습 (명작 완독)"
            stepNumber="4"
            icon="📜"
            onClose={() => setCurrentMode('home')}
          >
            <LongTextPracticeView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
            />
          </PracticeWindowContainer>
        )}

        {currentMode === 'knowledge-hub' && (
          <KnowledgeHubView
            currentUser={currentUser}
            onSelectMode={(mode) => setCurrentMode(mode)}
          />
        )}

        {currentMode === 'capital-journey' && (
          <JourneyPracticeView
            initialTab="capitals"
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onSelectMode={(mode) => setCurrentMode(mode)}
          />
        )}

        {currentMode === 'joseon-journey' && (
          <JourneyPracticeView
            initialTab="joseon"
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onSelectMode={(mode) => setCurrentMode(mode)}
          />
        )}

        {currentMode === 'lyrics-challenge' && (
          <JourneyPracticeView
            initialTab="lyrics"
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onSelectMode={(mode) => setCurrentMode(mode)}
          />
        )}

        {currentMode === 'python-coding' && (
          <PythonPracticeView
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onSelectMode={(mode) => setCurrentMode(mode)}
          />
        )}

        {currentMode === 'mini-games' && (
          <MiniGamesHubView
            onSelectMode={(mode) => setCurrentMode(mode)}
            currentUser={currentUser}
          />
        )}

        {currentMode === 'tamagotchi' && (
          <GameFitStage title="다마고치 키우기" icon="🐣" onExit={() => setCurrentMode('mini-games')}>
            <TamagotchiView
              currentUser={currentUser}
              onOpenProfile={() => setIsProfileOpen(true)}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'playground' && (
          currentUser ? (
            <PlaygroundHome
              currentUser={currentUser}
              onSelectMode={(mode) => setCurrentMode(mode)}
              onOpenProfile={() => setIsProfileOpen(true)}
            />
          ) : (
            <div className="max-w-2xl mx-auto my-12 p-8 bg-white/95 rounded-3xl border-2 border-pink-300 shadow-xl text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-pink-100 text-pink-500 mx-auto flex items-center justify-center text-3xl shadow-inner">
                🎡
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 font-arcade">
                  놀이터는 로그인 후 이용 가능합니다!
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  자리 연습, 낱말 연습, 짧은 글, 긴 글, 지식 타자, 미니게임은 로그인 없이도 바로 즐길 수 있습니다.<br />
                  <strong>놀이터(기본 플레이 &amp; 펀펀 플레이)</strong>는 내 포인트와 기록 관리를 위해 로그인이 필요합니다.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  ✨ 로그인 / 회원가입 하러 가기
                </button>
                <button
                  onClick={() => setCurrentMode('home')}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-all cursor-pointer"
                >
                  홈으로 돌아가기
                </button>
              </div>
            </div>
          )
        )}

        {currentMode === 'word-crush' && (
          <GameFitStage title="워드 크러쉬" icon="🍬" onExit={() => setCurrentMode('mini-games')}>
            <WordCrushView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'mole-game' && (
          <GameFitStage title="두더지 타자 잡기" icon="🔨" onExit={() => setCurrentMode('mini-games')}>
            <MoleGameView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'rain-game' && (
          <GameFitStage title="산성비 (단어 소나기)" icon="🌧️" onExit={() => setCurrentMode('mini-games')}>
            <RainGameView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'shortcut-quiz' && (
          <GameFitStage title="단축키 스피드 퀴즈" icon="⚡" onExit={() => setCurrentMode('mini-games')}>
            <ShortcutQuizView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboard}
            onClearLeaderboard={handleClearLeaderboard}
            onStartSentencePractice={() => handleSelectMode('sentence-practice')}
          />
        )}
        </Suspense>
      </main>

      {/* Footer: QUEST COMPLETE (김은경 제작자) - Hidden in standalone popup window */}
      {!isPopupMode && (
        <TapangFooter
          isMaster={currentUser?.role === 'master'}
          onOpenMaster={() => setIsMasterOpen(true)}
        />
      )}

      {/* Auth Modal (Login / Register with Approval Notice) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <Suspense fallback={null}>
      {/* Profile & Avatar Selector Modal */}
      {isProfileOpen && <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        initialTab={profileInitialTab}
      />}

      {/* Master / Teacher Console Modal */}
      {isMasterOpen && <MasterModal
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
        currentUser={currentUser}
        onUpdateUsersList={handleUpdateUsersList}
        onMasterLogin={handleLoginSuccess}
        onOpenReportForUser={(student) => {
          setReportTargetUser(student);
          setIsReportOpen(true);
        }}
      />}

      {/* Monthly Report Card Modal (SMS / MMS / Download) */}
      {isReportOpen && <MonthlyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentUser={currentUser}
        targetUser={reportTargetUser}
      />}

      {/* Student Typing Practice History Modal */}
      {isHistoryOpen && <PracticeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentUser={currentUser}
        onSelectMode={(mode) => {
          setIsHistoryOpen(false);
          handleSelectMode(mode);
        }}
      />}
      </Suspense>
    </div>
  );
}
