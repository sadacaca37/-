import React, { useState, useEffect } from 'react';
import { MoaCharacter, MoaWalker } from './MoaCharacter';
import { CharacterDresser } from './CharacterDresser';
import { TvBot } from './views/TapangHome';
import {
  X,
  Eye,
  EyeOff,
  User,
  Phone,
  Lock,
  Key,
  ShieldCheck,
  Save,
  Copy,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Volume2,
  LogIn,
} from 'lucide-react';
import { UserSession, PracticeHistoryRecord } from '../types';
import { soundManager } from '../utils/sound';
import { pointsManager } from '../utils/pointsManager';
import { getUserPracticeHistory } from '../utils/curriculumManager';
import { WeeklyProgressChart } from './WeeklyProgressChart';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onUpdateUser: (updatedUser: Partial<UserSession>) => void;
  onOpenAuth?: () => void;
  initialTab?: 'avatar' | 'account';
  /** 내 계정·타자 기록·성적표 탭 */
  tabs?: React.ReactNode;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenAuth,
  tabs,
}) => {
  const [volume, setVolumeState] = useState<number>(() => soundManager.getVolume());
  const [practiceRecords, setPracticeRecords] = useState<PracticeHistoryRecord[]>([]);

  // Student Account Info & Password State
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editStudentId, setEditStudentId] = useState(currentUser?.studentId || currentUser?.phone || '');
  const [editPhone, setEditPhone] = useState(currentUser?.phone || '');
  const [editParentPhone, setEditParentPhone] = useState(currentUser?.parentPhone || '');
  const [editGrade, setEditGrade] = useState<number>(currentUser?.grade || 3);
  /** 모아팡 방번호+이름으로 들어온 학생 (비밀번호·전화번호 없음) */
  const isMoaStudent = !!currentUser && currentUser.role !== 'master' && /^m_/.test(currentUser.id);
  const [editPassword, setEditPassword] = useState(currentUser?.password || '1234');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userPoints, setUserPoints] = useState<number>(() => pointsManager.getBalance());

  useEffect(() => {
    const syncPoints = () => setUserPoints(pointsManager.getBalance());
    syncPoints();
    window.addEventListener('points-updated', syncPoints);
    return () => window.removeEventListener('points-updated', syncPoints);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const targetId = currentUser?.id || 'guest';
      let recs = getUserPracticeHistory(targetId);
      if (recs.length === 0) {
        const guestRecs = getUserPracticeHistory('guest');
        if (guestRecs.length > 0) recs = guestRecs;
      }
      setPracticeRecords(recs);
      setVolumeState(soundManager.getVolume());
      setUserPoints(pointsManager.getBalance());
    }

    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditStudentId(currentUser.studentId || currentUser.phone || '');
      setEditPhone(currentUser.phone || '');
      setEditParentPhone(currentUser.parentPhone || '');
      setEditGrade(currentUser.grade || 3);

      let resolvedPw = currentUser.password;
      if (!resolvedPw) {
        try {
          const raw = localStorage.getItem('typang_users_db');
          if (raw) {
            const db: UserSession[] = JSON.parse(raw);
            const found = db.find((u) => u.id === currentUser.id || u.studentId === currentUser.studentId);
            if (found && found.password) {
              resolvedPw = found.password;
            }
          }
        } catch {}
      }
      setEditPassword(resolvedPw || '1234');
    }
  }, [currentUser, isOpen]);

  const handleCopyId = () => {
    if (!editStudentId) return;
    navigator.clipboard.writeText(editStudentId);
    setCopiedId(true);
    soundManager.play('pop');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!editName.trim()) {
      setAccountFeedback({ message: '학생 이름을 정확히 입력해주세요.', type: 'error' });
      soundManager.play('error');
      return;
    }
    if (!editPassword.trim() || editPassword.trim().length !== 4) {
      setAccountFeedback({ message: '비밀번호는 4자리 숫자(PIN)로 입력해주세요.', type: 'error' });
      soundManager.play('error');
      return;
    }

    const updatedUserData: UserSession = {
      ...currentUser,
      name: editName.trim(),
      phone: editPhone.trim() || editStudentId.trim(),
      parentPhone: editParentPhone.trim(),
      grade: editGrade,
      password: editPassword.trim(),
    };

    onUpdateUser(updatedUserData);
    soundManager.play('fanfare');
    setAccountFeedback({ message: '✨ 학생 계정 정보와 비밀번호가 안전하게 저장되었습니다!', type: 'success' });
    setTimeout(() => setAccountFeedback(null), 4000);
  };

  if (!isOpen) return null;

  const profileEmoji = currentUser?.avatar || (currentUser?.role === 'master' ? '👑' : '🙂');

  return (
    <div className="tp-modal fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="tp-modal-bot" aria-hidden="true">
        <TvBot size={110} bubble="내 계정 정보를 확인해요!" bubbleSide="top" />
      </div>

      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#EEF2F6] rounded-3xl shadow-2xl border-4 border-slate-300 flex flex-col overflow-hidden text-slate-800">
        {/* TOP HEADER */}
        <header className="pf-head flex flex-wrap items-center justify-between px-4 sm:px-6 py-3 bg-white border-b border-slate-200 select-none shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-100 border-2 border-sky-400 flex items-center justify-center shadow-xs text-lg">
              {profileEmoji}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 font-sans">
                내 계정
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hidden sm:block">
                내 캐릭터 · 내 정보 · 타자 기록 · 성적표
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="pf-points flex items-center gap-1.5 px-3 py-1 bg-amber-50 border-2 border-amber-300 rounded-full shadow-2xs">
              <span className="text-sm">🪙</span>
              <span className="text-xs font-black text-amber-950 font-arcade">
                {userPoints.toLocaleString()} <span className="text-[10px] font-bold text-amber-700">P</span>
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {tabs}
        {/* BODY: ACCOUNT INFO ONLY */}
        <div className="pf-acct flex-1 p-3 sm:p-6 overflow-y-auto bg-slate-50/70">
          {!currentUser ? (
            <div className="max-w-md mx-auto my-8 bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-sky-50 border-2 border-sky-200 flex items-center justify-center text-4xl shadow-inner">
                🙂
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">로그인이 필요해요</h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  학생 계정으로 로그인하면 내 이름, 학년, 비밀번호와 연습 기록을 확인할 수 있어요.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                현재 보유 포인트: <span className="font-black">{userPoints.toLocaleString()} P</span>
              </div>
              {onOpenAuth && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>로그인 / 학생등록 하러 가기</span>
                </button>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
              {accountFeedback && (
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-sm border-2 animate-in fade-in ${
                    accountFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  {accountFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  )}
                  <span>{accountFeedback.message}</span>
                </div>
              )}

              {/* 모아팡과 같은 캐릭터 꾸미기 (옷장) */}
              <section className="pf-card bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-sm" data-testid="dress-section">
                <h3 className="text-lg font-black text-slate-900 mb-3">👕 캐릭터 꾸미기 <span className="text-xs font-bold text-slate-400">모아팡과 같은 옷장이에요</span></h3>
                <CharacterDresser user={currentUser} />
              </section>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
                {/* 왼쪽: 내 캐릭터 */}
                <div className="pf-card pf-card--id md:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
                  <div className="pf-avatar relative w-36 h-36 rounded-2xl bg-gradient-to-b from-sky-100 to-indigo-100 border-2 border-sky-200 flex items-center justify-center shadow-inner">
                    {currentUser.role === 'master' ? (
                      <span className="text-6xl select-none" aria-hidden="true">👑</span>
                    ) : (
                      <MoaWalker size={128} walking dir="front" fallback={<MoaCharacter size={120} fallback={profileEmoji} className="text-6xl select-none" />} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 font-arcade">{currentUser.name || '학생'}</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">
                      {currentUser.role === 'master' ? '선생님(마스터) 계정' : `${currentUser.grade || editGrade}학년 · ${currentUser.studentId || '타자팡 회원'}`}
                    </p>
                  </div>
                  <div className="w-full grid grid-cols-3 gap-2">
                    <div className="pf-stat pf-stat--sky p-2.5 bg-sky-50 rounded-2xl border border-sky-200">
                      <span className="text-[10px] font-extrabold text-sky-600 block">최고 타수</span>
                      <span className="text-base font-black text-sky-950 font-arcade">{currentUser.highestCpm || 0}</span>
                    </div>
                    <div className="pf-stat pf-stat--lav p-2.5 bg-purple-50 rounded-2xl border border-purple-200">
                      <span className="text-[10px] font-extrabold text-purple-600 block">연습</span>
                      <span className="text-base font-black text-purple-950 font-arcade">{currentUser.totalPracticeCount || 0}회</span>
                    </div>
                    <div className="pf-stat pf-stat--gold p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
                      <span className="text-[10px] font-extrabold text-amber-700 block">포인트</span>
                      <span className="text-base font-black text-amber-950 font-arcade">{currentUser.role === 'master' ? '∞' : userPoints.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 내 정보 (꼭 필요한 것만) */}
                <div className="pf-card pf-card--form md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm space-y-4" data-testid="moa-account">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    <span>내 정보</span>
                    {currentUser.role !== 'master' &&
                      (currentUser.isApproved ? (
                        <span className="ml-auto inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5" /> 승인됨
                        </span>
                      ) : (
                        <span className="ml-auto text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">⏳ 승인 기다리는 중</span>
                      ))}
                  </h3>
                  {currentUser.role === 'master' ? (
                    <p className="text-sm font-bold text-slate-600 leading-relaxed">
                      선생님 계정이에요. 학생 승인·명단·포인트 선물은 위쪽 <b>[👑 마스터 관리실]</b>에서 할 수 있어요.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-sm font-black text-slate-800">
                        <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200">
                          <div className="text-[11px] text-slate-400">이름</div>
                          {currentUser.name}
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200">
                          <div className="text-[11px] text-slate-400">반</div>
                          {currentUser.studentId || '-'}
                        </div>
                      </div>
                      {currentUser.parentPhone && (
                        <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-[11px] font-extrabold text-amber-800">🔑 로그인 비밀번호 (전화번호 뒷자리)</div>
                            <div className="text-lg font-black font-mono tracking-[0.3em] text-amber-950">
                              {showPassword ? currentUser.parentPhone.replace(/[^0-9]/g, '').slice(-4) : '••••'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-black cursor-pointer flex items-center gap-1"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showPassword ? '숨기기' : '보기'}
                          </button>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-extrabold text-slate-700 mb-1.5">내 학년 (명예의 전당 학년별 순위에 쓰여요)</div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {[1, 2, 3, 4, 5, 6].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                soundManager.play('click');
                                setEditGrade(g);
                                onUpdateUser({ ...currentUser, grade: g, levelTitle: `${g}학년 타자 꿈나무` });
                                setAccountFeedback({ message: `✨ ${g}학년으로 저장했어요!`, type: 'success' });
                                setTimeout(() => setAccountFeedback(null), 3000);
                              }}
                              className={`py-2 rounded-xl text-xs font-black border-2 cursor-pointer ${currentUser.grade === g ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                            >
                              {g}학년
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold">이름·전화번호를 바꾸려면 선생님께 말해 주세요.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
