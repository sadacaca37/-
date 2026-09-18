import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { MasterModal } from './components/MasterModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { PracticeHistoryModal } from './components/PracticeHistoryModal';
import { HomeDashboard } from './components/views/HomeDashboard';
import { KeyPracticeView } from './components/views/KeyPracticeView';
import { WordPracticeView } from './components/views/WordPracticeView';
import { SentencePracticeView } from './components/views/SentencePracticeView';
import { LongTextPracticeView } from './components/views/LongTextPracticeView';
import { JourneyPracticeView } from './components/views/JourneyPracticeView';
import { KnowledgeHubView } from './components/views/KnowledgeHubView';
import { PythonPracticeView } from './components/views/PythonPracticeView';
import { WordCrushView } from './components/views/WordCrushView';
import { MoleGameView } from './components/views/MoleGameView';
import { RainGameView } from './components/views/RainGameView';
import { ShortcutQuizView } from './components/views/ShortcutQuizView';
import { LeaderboardView } from './components/views/LeaderboardView';
import { TamagotchiView } from './components/views/TamagotchiView';
import { PlaygroundHome } from './components/views/playground/PlaygroundHome';
import { MiniGamesHubView } from './components/views/MiniGamesHubView';
import { AppMode, UserSession, LeaderboardEntry } from './types';
import { PracticeWindowContainer } from './components/PracticeWindowContainer';
import { soundManager } from './utils/sound';
import { typangApi } from './utils/apiClient';
import { userPersistenceManager } from './utils/userPersistenceManager';

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

// Initial Seed Users for Student Approval Manager
const INITIAL_USERS_DB: UserSession[] = [
  {
    id: 'user_1',
    name: '김철수',
    studentId: 'student1',
    phone: '010-1111-2222',
    password: 'password123',
    avatar: '🐱',
    levelTitle: '타자 꿈나무',
    isApproved: true,
    role: 'student',
    createdAt: Date.now() - 86400000 * 3,
    lastLoginAt: Date.now() - 3600000,
    totalPracticeCount: 15,
    highestCpm: 420,
  },
  {
    id: 'user_2',
    name: '이영희',
    studentId: 'student2',
    phone: '010-3333-4444',
    password: 'happy2026!',
    avatar: '🐰',
    levelTitle: '점프 타자',
    isApproved: true,
    role: 'student',
    createdAt: Date.now() - 86400000 * 2,
    lastLoginAt: Date.now() - 7200000,
    totalPracticeCount: 8,
    highestCpm: 380,
  },
  {
    id: 'user_3',
    name: '박민수',
    studentId: 'minsu_park',
    phone: '010-5555-6666',
    password: 'minsu7788',
    avatar: '🐶',
    levelTitle: '열혈 연습생',
    isApproved: false, // Pending approval for teacher!
    role: 'student',
    createdAt: Date.now() - 1800000,
    lastLoginAt: Date.now() - 1800000,
    totalPracticeCount: 0,
    highestCpm: 0,
  },
  {
    id: 'user_4',
    name: '최지우',
    studentId: 'jiwoo_choi',
    phone: '010-7777-8888',
    password: 'jiwoo1234',
    avatar: '🦄',
    levelTitle: '전설의 타수',
    isApproved: false, // Pending approval for teacher!
    role: 'student',
    createdAt: Date.now() - 900000,
    lastLoginAt: Date.now() - 900000,
    totalPracticeCount: 0,
    highestCpm: 0,
  },
];

// Helper to detect initial mode synchronously from URL params (?mode=...)
const getInitialMode = (): AppMode => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode') as AppMode;
      if (urlMode) return urlMode;
    } catch {}
  }
  return 'home';
};

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
      // 1. Users DB (Permanently fixed across updates, registered students never lost)
      const localFixedUsers = userPersistenceManager.getLocalUsers();
      if (localFixedUsers.length > 0) {
        setUsersDb(localFixedUsers);
      } else {
        localStorage.setItem('typang_users_db', JSON.stringify(INITIAL_USERS_DB));
        localStorage.setItem('typang_registered_students_vault', JSON.stringify(INITIAL_USERS_DB));
        setUsersDb(INITIAL_USERS_DB);
      }

      // Safe Two-Way Reconciliation with Server: registered students are permanently preserved
      typangApi.getUsers().then(async (serverUsers) => {
        if (serverUsers && serverUsers.length > 0) {
          const merged = await userPersistenceManager.reconcileWithServer(serverUsers);
          setUsersDb(merged);
        }
      }).catch(() => {});

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
    if (isPracticeMode(mode) && !isPopupMode) {
      // Open dedicated popup browser window
      try {
        const url = `${window.location.origin}${window.location.pathname}?mode=${mode}&popup=true`;
        window.open(
          url,
          `typang_practice_${mode}`,
          'width=1280,height=920,left=80,top=40,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
        );
      } catch (e) {
        console.warn('Popup window open error or blocked:', e);
      }
    }
    setCurrentMode(mode);
  };

  // Count pending students for Master badge
  const pendingStudentsCount = usersDb.filter((u) => !u.isApproved && u.role !== 'master').length;

  return (
    <div className={`min-h-screen ${isPopupMode ? 'bg-slate-950 text-slate-100' : 'bg-transparent text-slate-800'} flex flex-col font-sans arcade-dot-bg`}>
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
      <main className={`flex-1 w-full mx-auto ${
        isPopupMode
          ? 'max-w-7xl p-1 sm:p-2'
          : ['key-practice', 'word-practice', 'sentence-practice', 'long-practice'].includes(currentMode)
          ? 'max-w-7xl px-2 sm:px-4 py-1.5 sm:py-2.5'
          : 'max-w-7xl px-3 sm:px-6 lg:px-8 py-6'
      }`}>
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
          <TamagotchiView
            currentUser={currentUser}
            onOpenProfile={() => setIsProfileOpen(true)}
            onBack={() => setCurrentMode('mini-games')}
          />
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
          <WordCrushView
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onBack={() => setCurrentMode('mini-games')}
          />
        )}

        {currentMode === 'mole-game' && (
          <MoleGameView
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onBack={() => setCurrentMode('mini-games')}
          />
        )}

        {currentMode === 'rain-game' && (
          <RainGameView
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onBack={() => setCurrentMode('mini-games')}
          />
        )}

        {currentMode === 'shortcut-quiz' && (
          <ShortcutQuizView
            currentUser={currentUser}
            onRecordScore={handleRecordScore}
            onBack={() => setCurrentMode('mini-games')}
          />
        )}

        {currentMode === 'leaderboard' && (
          <LeaderboardView
            entries={leaderboard}
            onClearLeaderboard={handleClearLeaderboard}
            onStartSentencePractice={() => setCurrentMode('sentence-practice')}
          />
        )}
      </main>

      {/* Footer: 타닥타닥 타자랜드 김은경 제작자 */}
      <footer className="mt-auto border-t-2 border-pink-200 bg-white/95 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-600 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-pink-500 font-bold text-base">🐾</span>
            <span className="font-black text-slate-900 font-arcade text-sm sm:text-base tracking-wide">
              타닥타닥 타자랜드
            </span>
            <span className="text-slate-300">|</span>
            <span className="font-black text-pink-600 font-arcade text-xs sm:text-sm bg-pink-50 px-2.5 py-1 rounded-lg border border-pink-200 shadow-2xs">
              김은경 제작자
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-500 font-bold">
            {currentUser?.role === 'master' && (
              <>
                <button
                  onClick={() => setIsMasterOpen(true)}
                  className="text-pink-600 hover:text-pink-700 underline font-black cursor-pointer"
                >
                  👑 마스터 관리실 (학생 승인/비밀번호)
                </button>
                <span>•</span>
              </>
            )}
            <span>투명 손가락 위치 가이드 • 타자 모험 아케이드</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Login / Register with Approval Notice) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Profile & Avatar Selector Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={handleUpdateProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        initialTab={profileInitialTab}
      />

      {/* Master / Teacher Console Modal */}
      <MasterModal
        isOpen={isMasterOpen}
        onClose={() => setIsMasterOpen(false)}
        currentUser={currentUser}
        onUpdateUsersList={handleUpdateUsersList}
        onMasterLogin={handleLoginSuccess}
        onOpenReportForUser={(student) => {
          setReportTargetUser(student);
          setIsReportOpen(true);
        }}
      />

      {/* Monthly Report Card Modal (SMS / MMS / Download) */}
      <MonthlyReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        currentUser={currentUser}
        targetUser={reportTargetUser}
      />

      {/* Student Typing Practice History Modal */}
      <PracticeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentUser={currentUser}
        onStartPractice={(mode) => {
          setCurrentMode(mode);
          setIsHistoryOpen(false);
        }}
      />
    </div>
  );
}
