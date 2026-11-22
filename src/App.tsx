import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { GameFitStage } from './components/GameFitStage';
import { makeLeaderboardEntry, readCachedBoard, rememberMyRecord, saveCachedBoard, serverHeal, syncLeaderboard } from './utils/serverHeal';
import { progressSync } from './utils/progressSync';
import { activityTracker } from './utils/activityLog';
import { buildTodaySummary, fetchMyReports, fetchUncheckedCount } from './utils/dailyReport';
import { backupKeeper } from './utils/backupKeeper';
import { isApprovedNow } from './utils/session';
import { refreshMyApproval } from './utils/tajaApproval';
import { serverLogout } from './utils/funfunPass';
import { Navbar } from './components/Navbar';
import { MoaAuthModal } from './components/MoaAuthModal';
import { ReportArrivalToasts } from './components/ReportArrivalToasts';
import { GiftReceiver } from './components/GiftReceiver';
import { bestShortCpm, longUnlocked, SHORT_TO_LONG_CPM } from './utils/longGate';
import { AccountTabs, AccountTab } from './components/AccountTabs';
import { payWeeklyRankRewards } from './utils/rankRewards';
import { weekLabel } from './utils/weekBest';
import { authReady, clearMemberDress, isTeacherUser, MEMBER_CID, parseUserId, pickTaja, reloadMember, teacherSession } from './utils/moaFirebase';
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
const SendReportModal = lazy(() => import('./components/SendReportModal').then((m) => ({ default: m.SendReportModal })));
const PracticeHistoryModal = lazy(() => import('./components/PracticeHistoryModal').then((m) => ({ default: m.PracticeHistoryModal })));
const loadKeyPractice = () => import('./components/views/KeyPracticeView');
const loadWordPractice = () => import('./components/views/WordPracticeView');
const loadSentencePractice = () => import('./components/views/SentencePracticeView');
const loadLongPractice = () => import('./components/views/LongTextPracticeView');

const KeyPracticeView = lazy(() => loadKeyPractice().then((m) => ({ default: m.KeyPracticeView })));
const WordPracticeView = lazy(() => loadWordPractice().then((m) => ({ default: m.WordPracticeView })));
const SentencePracticeView = lazy(() => loadSentencePractice().then((m) => ({ default: m.SentencePracticeView })));
const LongTextPracticeView = lazy(() => loadLongPractice().then((m) => ({ default: m.LongTextPracticeView })));
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

const PRACTICE_PREFETCH: Record<string, () => Promise<unknown>> = {
  'key-practice': loadKeyPractice,
  'word-practice': loadWordPractice,
  'sentence-practice': loadSentencePractice,
  'long-practice': loadLongPractice,
  'transcription-challenge': loadLongPractice,
};




// Helper to detect initial mode synchronously from URL params (?mode=...)
/** 마크 친구 초대 링크(?mark=방코드)로 들어오면 코드를 기억해 두고 놀이터로 */
const MARK_INVITE_KEY = 'typang_mark_invite';
const readMarkInvite = (): string => {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = (params.get('mark') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (code) {
      sessionStorage.setItem(MARK_INVITE_KEY, code);
      params.delete('mark');
      const qs = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    }
    return code;
  } catch {
    return '';
  }
};

const getInitialMode = (): AppMode => {
  if (typeof window !== 'undefined') {
    if (readMarkInvite()) return 'playground';
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

const PRACTICE_WARM_IMAGES = [
  './assets/practice/wood-status-bar.webp',
  './assets/practice/wood-desk-bg.webp',
  './assets/practice/parchment-scroll.webp',
  './assets/practice/wood-signpost.webp',
  './assets/parchment-card.webp',
  './assets/practice/forest-meadow-bg.webp',
  './assets/practice/hand-left.webp',
  './assets/practice/hand-right.webp',
  './assets/footer-meadow.webp',
  './assets/minigames/bg-defense.webp',
  './assets/minigames/bg-pet.webp',
];

/** 팝업 연습 창은 해당 연습 청크를 즉시 병렬 로드, 홈 화면은 한가할 때 연습 4종·그림과 자주 여는 창을 미리 캐시 */
if (typeof window !== 'undefined') {
  try {
    const params = new URLSearchParams(window.location.search);
    const isPopupInit = params.get('popup') === 'true';
    const initMode = params.get('mode') || '';
    if (isPopupInit && PRACTICE_PREFETCH[initMode]) {
      PRACTICE_PREFETCH[initMode]().catch(() => {});
    } else if (!isPopupInit) {
      const warm = () => {
        [
          loadKeyPractice,
          loadWordPractice,
          loadSentencePractice,
          loadLongPractice,
          () => import('./components/ProfileModal'),
          () => import('./components/MasterModal'),
          () => import('./components/PracticeHistoryModal'),
          () => import('./components/views/playground/PlaygroundHome'),
          () => import('./components/views/KnowledgeHubView'),
          () => import('./components/views/MiniGamesHubView'),
          () => import('./components/views/LeaderboardView'),
        ].forEach((load, i) => setTimeout(() => load().catch(() => {}), i * 250));

        // 연습 창 배경·손·키보드 그림도 한가할 때 브라우저 캐시에 미리 담아 두어 팝업이 즉시 뜨게 함
        PRACTICE_WARM_IMAGES.forEach((src, i) => {
          setTimeout(() => {
            const img = new Image();
            img.src = src;
          }, 400 + i * 120);
        });
      };
      const idle = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1500));
      window.addEventListener('load', () => idle(warm, { timeout: 3000 }), { once: true });
    }
  } catch {}
}

/** 열려 있는 연습 창 (모드별로 하나) */
const openPracticeWindows = new Map<string, Window>();
/** 타자를 치는 화면: 흐림(유리) 효과를 꺼서 느린 컴퓨터에서도 빠르게 칠 때 화면이 버벅이거나 멈추지 않게 */
const TYPING_SCREENS = new Set<string>(['key-practice', 'word-practice', 'sentence-practice', 'long-practice', 'capital-journey', 'joseon-journey', 'lyrics-challenge', 'transcription-challenge', 'python-coding']);

const readInitialUser = (): UserSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('typang_current_user');
    return saved ? (JSON.parse(saved) as UserSession) : null;
  } catch {
    return null;
  }
};

const LOGIN_MODES = new Set<string>(['mini-games', 'tamagotchi', 'mole-game', 'rain-game', 'word-crush', 'shortcut-quiz', 'playground']);

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>(getInitialMode);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(readInitialUser);
  const isPopupMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('popup') === 'true';
  // 미니게임·놀이터는 타자팡 회원 로그인 뒤에만
  const loginGate = !currentUser && LOGIN_MODES.has(currentMode);
  // 짧은 글 250타 이상이어야 긴 글로 (선생님은 언제나)
  const longGate = (currentMode === 'long-practice' || currentMode === 'transcription-challenge') && !longUnlocked(currentUser);

  // 오늘의 연습 보고 상태: 학생 = 보냈는지/선생님이 확인했는지, 선생님 = 새 보고 수 (팝업 연습 창에서는 생략)
  useEffect(() => {
    if (isPopupMode) return;
    const uid = currentUser?.id;
    if (!uid) {
      setSendReportState('none');
      setNewReportsCount(0);
      return;
    }
    let alive = true;
    const refresh = async () => {
      if (currentUser?.role === 'master') {
        const n = await fetchUncheckedCount();
        if (alive) setNewReportsCount(n);
        return;
      }
      const today = buildTodaySummary(uid);
      const mine = await fetchMyReports(uid);
      if (!alive) return;
      const sent = mine.find((r) => r.day === today.day);
      if (sent && (sent.sets !== today.summary.sets || sent.keys < today.summary.keys - 50)) setSendReportState('ready'); // 보낸 뒤에 더 연습함
      else if (sent) setSendReportState(sent.checkedAt ? 'checked' : 'sent');
      else setSendReportState(today.active ? 'ready' : 'none');
    };
    void refresh();
    // 로그인 직후에는 서버에서 학생 자료를 받아 오는 중일 수 있어 몇 초 뒤에 다시 확인
    const early = [3000, 9000].map((ms) => window.setTimeout(() => void refresh(), ms));
    const t = window.setInterval(() => void refresh(), 60000);
    const onChange = () => void refresh();
    window.addEventListener('daily-report-updated', onChange);
    window.addEventListener('typing-history-updated', onChange);
    window.addEventListener('focus', onChange);
    return () => {
      alive = false;
      early.forEach((id) => window.clearTimeout(id));
      window.clearInterval(t);
      window.removeEventListener('daily-report-updated', onChange);
      window.removeEventListener('typing-history-updated', onChange);
      window.removeEventListener('focus', onChange);
    };
  }, [currentUser?.id, currentUser?.role]);

  // 학습 일지: 학생이 타자 연습 화면에서 실제로 친 글자 수·시간을 날짜별로 쌓음 (선생님 화면·성적표용)
  useEffect(() => {
    const isStudent = !!currentUser?.id && currentUser.role !== 'master';
    activityTracker.setContext(isStudent ? currentUser!.id : '', currentMode);
  }, [currentUser, currentMode]);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [profileInitialTab, setProfileInitialTab] = useState<'avatar' | 'account'>('account');
  const [isMasterOpen, setIsMasterOpen] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  // 오늘의 연습 보고: 학생은 [선생님께 보내기], 선생님은 관리실 버튼에 새 보고 수
  const [isSendReportOpen, setIsSendReportOpen] = useState<boolean>(false);
  const [sendReportState, setSendReportState] = useState<'none' | 'ready' | 'sent' | 'checked'>('none');
  const [newReportsCount, setNewReportsCount] = useState<number>(0);
  // 세트를 끝내면 화면 아래에 크게 뜨는 [선생님께 보내기]
  const [setDonePrompt, setSetDonePrompt] = useState<number>(0);
  useEffect(() => {
    const open = () => {
      setSetDonePrompt(0);
      setIsSendReportOpen(true);
    };
    const done = (e: Event) => setSetDonePrompt(Number((e as CustomEvent).detail?.sets) || 1);
    const sent = () => setSetDonePrompt(0);
    window.addEventListener('typang-open-send-report', open);
    window.addEventListener('typang-set-finished', done);
    window.addEventListener('daily-report-updated', sent);
    return () => {
      window.removeEventListener('typang-open-send-report', open);
      window.removeEventListener('typang-set-finished', done);
      window.removeEventListener('daily-report-updated', sent);
    };
  }, []);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [reportTargetUser, setReportTargetUser] = useState<UserSession | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const lastRecordRef = useRef<{ sig: string; at: number }>({ sig: '', at: 0 });
  const [usersDb, setUsersDb] = useState<UserSession[]>([]);

  const handleOpenProfile = (tab: 'avatar' | 'account' = 'account') => {
    setProfileInitialTab(tab);
    setIsProfileOpen(true);
  };
  // 내 계정 · 타자 기록 · 성적표를 한 창처럼 오가기
  const openAccount = (tab: AccountTab) => {
    setIsProfileOpen(tab === 'account');
    setIsHistoryOpen(tab === 'records');
    if (tab === 'report') setReportTargetUser(currentUserRef.current);
    setIsReportOpen(tab === 'report');
  };
  const acctTabs = (active: AccountTab) => (currentUserRef.current ? <AccountTabs active={active} onChange={openAccount} /> : null);

  // Initialize DB and sessions
  useEffect(() => {
    let deferTimer = 0;
    try {
      // 1. 학생 명단: 모아팡 반 학생들 (선생님만 받아 옴)
      setUsersDb(userPersistenceManager.getLocalUsers());
      const isPopup = new URLSearchParams(window.location.search).get('popup') === 'true';

      // 2. 명예의 전당 캐시 (즉시 읽기)
      const nowMonth = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 7).replace('-', '.');
      setLeaderboard(readCachedBoard().filter((e) => String(e.date || '').startsWith(nowMonth)));

      // 펀펀 플레이 입장 시 서버 로그인 확인표가 없으면(예전 로그인) 다시 로그인 창 열기
      window.addEventListener('typang-require-login', () => {
        progressSync.flush();
        progressSync.stop();
        localStorage.removeItem('typang_current_user');
        typangApi.clearMasterKey();
        setCurrentUser(null);
        setIsAuthOpen(true);
      });

      // 2. 지금 사용자: 선생님 계정 / 이 컴퓨터에 로그인해 둔 타자팡 회원(이름+전화번호)
      //    모아팡 방번호로만 들어온 학생은 로그인 없이 연습만 (저장 안 함, 미니게임·놀이터는 로그인 뒤에)
      const startSession = (u: UserSession) => {
        setCurrentUser(u);
        localStorage.setItem('typang_current_user', JSON.stringify(u));
        // 이 학생의 자료를 받아 와 이어서 쓰게 함
        if (u.role !== 'master')
          void progressSync.start(u.id).then((r) => {
            if (r.restored) window.dispatchEvent(new Event('storage'));
          });
      };
      let savedUser: UserSession | null = null;
      try {
        savedUser = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
      } catch {}
      const p0 = savedUser && savedUser.id !== 'master_admin' ? parseUserId(savedUser.id) : null;
      // 타자팡 회원이 아닌 예전 로그인(모아팡 방번호 학생 등)은 버림
      if (savedUser && savedUser.id !== 'master_admin' && (!p0 || p0.cid !== MEMBER_CID)) {
        localStorage.removeItem('typang_current_user');
        savedUser = null;
      }
      if (savedUser) setCurrentUser(savedUser); // 먼저 그려 두고 아래에서 확인
      void authReady().then(async () => {
        if (isTeacherUser()) {
          startSession(savedUser?.role === 'master' ? savedUser : teacherSession());
          typangApi.getUsers().then((list) => setUsersDb(list)).catch(() => {});
          return;
        }
        if (savedUser && savedUser.role !== 'master') {
          const u = await reloadMember(savedUser.id);
          if (u) startSession(u);
          else {
            // 승인이 풀렸거나 지워진 회원
            localStorage.removeItem('typang_current_user');
            setCurrentUser(null);
          }
          return;
        }
        if (savedUser?.role === 'master') {
          // 선생님 로그인이 풀렸으면 학생 화면으로
          localStorage.removeItem('typang_current_user');
          setCurrentUser(null);
        }
      });

      // 3. 서버 되살리기 + 접속 유지 (연습 팝업 창은 화면을 먼저 그린 뒤 가볍게 시작)
      const runBackgroundSync = () => {
        if (!isPopup) {
          // 선생님 컴퓨터: 전체 백업 자동 보관
          backupKeeper.start();
          window.addEventListener('typang-backup-restored', () => {
            typangApi.getUsers().then((serverUsers) => setUsersDb(serverUsers)).catch(() => {});
          });
        }
        serverHeal.start({
        onBoard: (list) => setLeaderboard(list),
        onServerRestart: () => progressSync.resync(),
        currentUserId: () => {
          try {
            const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
            return u && u.role !== 'master' ? String(u.id || '') : '';
          } catch {
            return '';
          }
        },
      });
      };
      if (isPopup) deferTimer = window.setTimeout(runBackgroundSync, 1000);
      else runBackgroundSync();
    } catch {
      // Fallback
    }
    return () => {
      if (deferTimer) window.clearTimeout(deferTimer);
    };
  }, [isPopupMode]);

  // 승인 전 학생: 선생님이 승인하면 저절로 저장이 시작되도록 30초마다·창으로 돌아올 때 확인
  useEffect(() => {
    if (!currentUser || currentUser.role === 'master' || currentUser.isApproved === true) return;
    let alive = true;
    const tick = async () => {
      if (!(await refreshMyApproval()) || !alive) return;
      try {
        const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
        if (u && u.id === currentUser.id) {
          setCurrentUser(u);
          if (u.isApproved) progressSync.resync();
        }
      } catch {}
    };
    void tick();
    const t = window.setInterval(() => void tick(), 30000);
    window.addEventListener('focus', tick);
    return () => {
      alive = false;
      window.clearInterval(t);
      window.removeEventListener('focus', tick);
    };
  }, [currentUser?.id, currentUser?.isApproved, currentUser?.role]);

  // 선생님(마스터)이 들어오면: 지난주 학년별 랭킹 1~3등에게 포인트(500·200·100P)를 아직 안 줬으면 자동으로 줌
  const [rankMsg, setRankMsg] = useState('');
  useEffect(() => {
    if (currentUser?.role !== 'master' || isPopupMode) return;
    const t = window.setTimeout(() => {
      void typangApi.getUsers().catch(() => {}); // 뒷자리 로그인 목록도 새로 맞춤
      void payWeeklyRankRewards()
        .then((r) => {
          if (r.weeks.length) setRankMsg(`🏆 ${r.weeks.map(weekLabel).join(', ')} 주간 랭킹 보상을 학년별 1~3등 ${r.count}명에게 보냈어요. (1등 500P · 2등 200P · 3등 100P)`);
        })
        .catch(() => {});
    }, 4000);
    return () => window.clearTimeout(t);
  }, [currentUser?.role, isPopupMode]);

  // 연습 단계에 들어가면(연습 창 포함) 이 컴퓨터에 기억 → 홈 지도 로봇이 그 단계로 감 (로그인 안 해도)
  useEffect(() => {
    if (!['key-practice', 'word-practice', 'sentence-practice', 'long-practice', 'transcription-challenge', 'knowledge-hub', 'leaderboard'].includes(currentMode)) return;
    if ((currentMode === 'long-practice' || currentMode === 'transcription-challenge') && !longUnlocked(currentUser)) return; // 잠긴 긴 글은 로봇이 가지 않음
    try {
      localStorage.setItem('taja_last_mode', currentMode);
    } catch {}
    window.dispatchEvent(new Event('last-practice-updated'));
  }, [currentMode]);

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  const handleLogout = () => {
    progressSync.flush(); // 나가기 전에 마지막으로 자료를 보관
    progressSync.stop();
    serverLogout();
    localStorage.removeItem('typang_current_user');
    clearMemberDress(); // 다음 사람이 이 컴퓨터를 쓰면 기본 캐릭터로
    typangApi.clearMasterKey();
    try {
      sessionStorage.setItem('taja_no_auto', '1'); // 이 창에서는 저절로 다시 들어가지 않게
    } catch {}
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: UserSession) => {
    try {
      sessionStorage.removeItem('taja_no_auto');
    } catch {}
    progressSync.stop();
    setCurrentUser(user);
    localStorage.setItem('typang_current_user', JSON.stringify(user));
    if (user.role === 'master') setTimeout(() => void backupKeeper.tick(), 300);
    // 다른 컴퓨터에서 하던 기록·포인트를 이어서 쓰도록 서버 자료를 받아 옴
    void progressSync.start(user.id).then((r) => {
      if (r.restored) window.dispatchEvent(new Event('storage'));
    });
  };

  // 관리실이 이 함수에 기대어 명단을 다시 받으므로, 매번 새 함수가 되지 않게 고정 (안 그러면 명단을 끝없이 다시 읽음)
  const currentUserRef = useRef<UserSession | null>(null);
  currentUserRef.current = currentUser;
  const handleUpdateUsersList = useCallback((updated: UserSession[]) => {
    setUsersDb(updated);
    const cu = currentUserRef.current;
    if (cu && cu.role !== 'master') {
      const matched = updated.find((u) => u.id === cu.id);
      if (matched) {
        setCurrentUser(matched);
        localStorage.setItem('typang_current_user', JSON.stringify(matched));
      }
    }
  }, []);

  const handleUpdateProfile = (updatedUser: UserSession) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('typang_current_user', JSON.stringify(updatedUser));
    // 학년·아바타는 모아팡 학생 기록에도 저장 (다른 컴퓨터에서도 그대로) — 선생님 승인 후에만
    if (parseUserId(updatedUser.id) && isApprovedNow()) void typangApi.updateUser(updatedUser.id, pickTaja(updatedUser as any) as Partial<UserSession>);

    const updatedDb = usersDb.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsersDb(updatedDb);
    localStorage.setItem('typang_users_db', JSON.stringify(updatedDb));
  };

  // Record score exclusively to Hall of Fame when logged in (Leaderboard is for sentence practice)
  const handleRecordScore = (entry: Omit<LeaderboardEntry, 'id' | 'date'>) => {
    // Only logged in members can have records permanently placed on the leaderboard
    if (!currentUser) return;
    // 선생님 승인 전 학생은 명예의 전당에 저장하지 않음
    if (!isApprovedNow()) return;

    // Only sentence practice goes to Hall of Fame
    if (entry.mode !== 'sentence') return;
    // 오류로 생긴 기록(말이 안 되는 타수)·같은 기록이 잇달아 들어오는 것은 받지 않음
    if (!(entry.cpm > 0) || entry.cpm > 1200) return;
    const sig = `${entry.cpm}|${entry.accuracy}|${entry.modeTitle}`;
    const last = lastRecordRef.current;
    if (last.sig === sig && Date.now() - last.at < 10000) return;
    lastRecordRef.current = { sig, at: Date.now() };

    const newRecord = makeLeaderboardEntry(entry, {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || '👑',
      grade: currentUser.grade && currentUser.grade >= 1 && currentUser.grade <= 6 ? currentUser.grade : undefined,
    } as Partial<LeaderboardEntry>);
    rememberMyRecord(currentUser.id, newRecord); // 서버가 비워져도 다시 올릴 수 있게 이 컴퓨터에도 적어 둠

    const updated = [newRecord, ...leaderboard].sort((a, b) => (b.cpm || 0) - (a.cpm || 0)).slice(0, 300);
    setLeaderboard(updated);
    saveCachedBoard(updated);

    // 서버에 저장 (내 기록 + 이 컴퓨터가 아는 순위표를 함께 맞춤 → 서버가 비어 있었어도 바로 채워짐)
    void syncLeaderboard().then((list) => {
      if (list) setLeaderboard(list);
    });

    // Update currentUser high stats
    const updatedUser: UserSession = {
      ...currentUser,
      totalPracticeCount: (currentUser.totalPracticeCount || 0) + 1,
      highestCpm: Math.max(currentUser.highestCpm || 0, entry.cpm || 0),
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('typang_current_user', JSON.stringify(updatedUser));
    if (parseUserId(updatedUser.id))
      void typangApi.updateUser(updatedUser.id, { totalPracticeCount: updatedUser.totalPracticeCount, highestCpm: updatedUser.highestCpm });

    const updatedDb = usersDb.map((u) => (u.id === updatedUser.id ? updatedUser : u));
    setUsersDb(updatedDb);
    localStorage.setItem('typang_users_db', JSON.stringify(updatedDb));
  };

  const handleClearLeaderboard = () => {
    setLeaderboard([]);
    saveCachedBoard([]);
  };

  const isPracticeMode = (mode: AppMode): mode is 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice' => {
    return ['key-practice', 'word-practice', 'sentence-practice', 'long-practice'].includes(mode);
  };

  const handleSelectMode = (mode: AppMode) => {
    // 짧은 글 250타 전에는 긴 글 창을 열지 않고 이 화면에서 안내
    if ((mode === 'long-practice' || mode === 'transcription-challenge') && !longUnlocked(currentUserRef.current)) {
      setCurrentMode(mode);
      return;
    }
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
          const scr = window.screen as Screen & { availLeft?: number; availTop?: number };
          const availW = scr?.availWidth || 1366;
          const availH = scr?.availHeight || 860;
          const popupW = Math.min(1320, Math.max(960, Math.round(availW * 0.94)));
          const popupH = Math.min(860, Math.max(660, Math.round(availH * 0.92)));
          const popupLeft = Math.max(0, Math.round((scr?.availLeft || 0) + (availW - popupW) / 2));
          const popupTop = Math.max(0, Math.round((scr?.availTop || 0) + (availH - popupH) / 2));
          const popup = window.open(
            url,
            `typang_practice_${mode}`,
            `width=${popupW},height=${popupH},left=${popupLeft},top=${popupTop},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
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

  const practiceFallback = (
    <div className="pr-popup-loading" aria-live="polite">
      <div className="pr-popup-loading-card">
        <span className="pr-popup-loading-dot" />
        <span>연습 책상 펼치는 중</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${isPopupMode ? 'tp-popup-root text-[#fff6dc]' : 'bg-transparent text-slate-800 arcade-dot-bg retro-cursor'} flex flex-col font-sans ${isPopupMode || TYPING_SCREENS.has(currentMode) ? 'tp-typing-screen' : ''}`}>
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
          onOpenHistory={() => openAccount('records')}
          onOpenSendReport={() => setIsSendReportOpen(true)}
          sendReportState={sendReportState}
          newReportsCount={newReportsCount}
          onLogout={handleLogout}
          soundEnabled={!isMuted}
          onToggleSound={handleToggleSound}
          pendingStudentsCount={pendingStudentsCount}
        />
      )}

      {/* 선생님 승인 전 학생: 타자는 칠 수 있지만 저장은 안 된다는 안내 */}
      {currentUser && currentUser.role !== 'master' && currentUser.isApproved !== true && (
        <div
          data-testid="approval-banner"
          className="mx-auto mt-2 w-[min(96%,1100px)] rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-center text-sm sm:text-base font-black text-amber-900 shadow-sm"
        >
          ⏳ 선생님 승인을 기다리고 있어요. 타자 연습은 할 수 있지만, <u>포인트와 기록은 선생님이 승인한 뒤부터 저장</u>돼요.
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full ${!isPopupMode && currentMode !== 'home' ? 'tp-skin' : ''} ${
        isPopupMode
          ? 'h-screen w-screen p-0 m-0 overflow-hidden'
          : ['key-practice', 'word-practice', 'sentence-practice', 'long-practice'].includes(currentMode)
          ? 'max-w-7xl px-2 sm:px-4 py-1.5 sm:py-2.5 mx-auto'
          : 'max-w-7xl px-3 sm:px-6 lg:px-8 py-6 mx-auto'
      }`}>
        {currentMode === 'key-practice' && (
          <PracticeWindowContainer
            mode="key-practice"
            title="1단계: 자리 연습"
            stepNumber="1"
            icon="⌨️"
            onClose={() => setCurrentMode('home')}
            showKeyboardSimultaneousBadge={true}
          >
            <Suspense fallback={null}>
              <KeyPracticeView
                currentUser={currentUser}
                onRecordScore={handleRecordScore}
              />
            </Suspense>
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
            <Suspense fallback={null}>
              <WordPracticeView
                currentUser={currentUser}
                onRecordScore={handleRecordScore}
              />
            </Suspense>
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
            <Suspense fallback={null}>
              <SentencePracticeView
                currentUser={currentUser}
                onRecordScore={handleRecordScore}
              />
            </Suspense>
          </PracticeWindowContainer>
        )}

        {longGate && (
          <div className="max-w-2xl mx-auto my-12 p-8 bg-white/95 rounded-3xl border-4 border-[#5a3417] shadow-xl text-center space-y-5 animate-fade-in" data-testid="long-gate">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 mx-auto flex items-center justify-center text-3xl shadow-inner">🔒</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 font-arcade">짧은 글 {SHORT_TO_LONG_CPM}타를 넘으면 긴 글이 열려요!</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-bold">
                지금 내 짧은 글 최고 기록은 <strong className="text-pink-600 text-lg">{bestShortCpm(currentUser)}타</strong>예요.
                <br />
                {SHORT_TO_LONG_CPM - bestShortCpm(currentUser) > 0 ? `${SHORT_TO_LONG_CPM - bestShortCpm(currentUser)}타만 더 빨라지면 긴 글 연습을 할 수 있어요. 화이팅!` : ''}
                {!currentUser && (
                  <>
                    <br />
                    로그인하면 내 기록이 저장돼요.
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button onClick={() => handleSelectMode('sentence-practice')} className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md cursor-pointer">
                📝 짧은 글 연습하러 가기
              </button>
              <button onClick={() => setCurrentMode('home')} className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer">
                홈으로
              </button>
            </div>
          </div>
        )}

        {(currentMode === 'long-practice' || currentMode === 'transcription-challenge') && !longGate && (
          <PracticeWindowContainer
            mode="long-practice"
            title="4단계: 긴 글 연습 (명작 완독)"
            stepNumber="4"
            icon="📜"
            onClose={() => setCurrentMode('home')}
          >
            <Suspense fallback={null}>
              <LongTextPracticeView
                currentUser={currentUser}
                onRecordScore={handleRecordScore}
              />
            </Suspense>
          </PracticeWindowContainer>
        )}

        <Suspense fallback={practiceFallback}>
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
            onOpenHistory={() => openAccount('records')}
          />
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

        {currentMode === 'mini-games' && !loginGate && (
          <MiniGamesHubView
            onSelectMode={(mode) => setCurrentMode(mode)}
            currentUser={currentUser}
          />
        )}

        {currentMode === 'tamagotchi' && !loginGate && (
          <GameFitStage title="다마고치 키우기" icon="🐣" onExit={() => setCurrentMode('mini-games')}>
            <TamagotchiView
              currentUser={currentUser}
              onOpenProfile={() => setIsProfileOpen(true)}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'playground' && currentUser && (
          <PlaygroundHome
            currentUser={currentUser}
            onSelectMode={(mode) => setCurrentMode(mode)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        )}

        {/* 미니게임·놀이터는 타자팡 로그인 뒤에 (모아팡 방번호로만 들어오면 연습만) */}
        {loginGate && (
          <div className="max-w-2xl mx-auto my-12 p-8 bg-white/95 rounded-3xl border-4 border-[#5a3417] shadow-xl text-center space-y-5 animate-fade-in" data-testid="login-gate">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 mx-auto flex items-center justify-center text-3xl shadow-inner">🔒</div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 font-arcade">미니게임과 놀이터는 로그인하고 할 수 있어요!</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-bold">
                자리·낱말·짧은 글·긴 글·지식 타자 연습은 로그인 없이도 할 수 있어요.
                <br />
                <strong>미니게임·놀이터</strong>는 <strong>이름 + 전화번호 뒷자리</strong>로 로그인해야 해요. 처음이면 [새로 가입하기] 후 선생님 승인을 기다려 주세요.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button onClick={() => setIsAuthOpen(true)} className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm shadow-md cursor-pointer">
                🔑 로그인
              </button>
              <button
                onClick={() => {
                  try {
                    sessionStorage.setItem('taja_open_signup', '1');
                  } catch {}
                  setIsAuthOpen(true);
                }}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md cursor-pointer"
              >
                ✨ 새로 가입하기
              </button>
              <button onClick={() => setCurrentMode('home')} className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm cursor-pointer">
                홈으로
              </button>
            </div>
          </div>
        )}

        {currentMode === 'word-crush' && !loginGate && (
          <GameFitStage title="워드 크러쉬" icon="🍬" onExit={() => setCurrentMode('mini-games')}>
            <WordCrushView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'mole-game' && !loginGate && (
          <GameFitStage title="두더지 타자 잡기" icon="🔨" onExit={() => setCurrentMode('mini-games')}>
            <MoleGameView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'rain-game' && !loginGate && (
          <GameFitStage title="산성비 (단어 소나기)" icon="🌧️" onExit={() => setCurrentMode('mini-games')}>
            <RainGameView
              currentUser={currentUser}
              onRecordScore={handleRecordScore}
              onBack={() => setCurrentMode('mini-games')}
            />
          </GameFitStage>
        )}

        {currentMode === 'shortcut-quiz' && !loginGate && (
          <GameFitStage title="단축키 디펜스" icon="⚡" onExit={() => setCurrentMode('mini-games')}>
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
      <MoaAuthModal
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
        tabs={acctTabs('account')}
      />}

      {/* 선생님: 학생이 보낸 보고가 오면 작은 알림 창 */}
      {!isPopupMode && <ReportArrivalToasts active={currentUser?.role === 'master'} onOpen={() => setIsMasterOpen(true)} />}
      {!isPopupMode && <GiftReceiver user={currentUser} />}
      {rankMsg && (
        <div className="fixed left-1/2 -translate-x-1/2 top-4 z-[96] max-w-[92vw] px-4 py-3 rounded-2xl border-4 border-[#5a3417] bg-[#fdf5dd] shadow-[0_6px_0_rgba(44,21,7,0.55)] text-sm font-black text-[#3d220d] flex items-center gap-3" data-testid="rank-paid">
          <span>{rankMsg}</span>
          <button type="button" className="px-2 text-[#7a4a1e] cursor-pointer" aria-label="닫기" onClick={() => setRankMsg('')}>
            ✕
          </button>
        </div>
      )}

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
        tabs={!reportTargetUser || reportTargetUser.id === currentUser?.id ? acctTabs('report') : null}
      />}

      {/* 세트를 끝냈을 때 화면 아래에 크게: 선생님께 보내기 */}
      {setDonePrompt > 0 && !isSendReportOpen && currentUser && currentUser.role !== 'master' && (
        <div className="fixed inset-x-0 bottom-4 z-[65] flex justify-center px-4 pointer-events-none" data-testid="set-done-prompt">
          <div className="pointer-events-auto w-full max-w-xl rounded-3xl bg-white border-4 border-sky-300 shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-center sm:text-left flex-1">
              <div className="text-xl sm:text-2xl font-black text-slate-900">🎉 오늘 {setDonePrompt}세트 끝!</div>
              <div className="text-sm font-bold text-slate-500">연습을 다 했으면 선생님께 보내 주세요.</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSetDonePrompt(0);
                setIsSendReportOpen(true);
              }}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-white text-xl sm:text-2xl font-black shadow-lg cursor-pointer whitespace-nowrap"
              data-testid="set-done-send"
            >
              📮 선생님께 보내기
            </button>
            <button type="button" onClick={() => setSetDonePrompt(0)} className="text-sm font-bold text-slate-400 hover:text-slate-600 cursor-pointer whitespace-nowrap">
              나중에
            </button>
          </div>
        </div>
      )}

      {/* 학생: 오늘 연습을 선생님께 보내는 창 */}
      {isSendReportOpen && currentUser && currentUser.role !== 'master' && (
        <SendReportModal isOpen={isSendReportOpen} onClose={() => setIsSendReportOpen(false)} currentUser={currentUser} />
      )}

      {/* Student Typing Practice History Modal */}
      {isHistoryOpen && <PracticeHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        currentUser={currentUser}
        tabs={acctTabs('records')}
        onSelectMode={(mode) => {
          setIsHistoryOpen(false);
          handleSelectMode(mode);
        }}
      />}
      </Suspense>
    </div>
  );
}
