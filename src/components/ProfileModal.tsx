import React, { useState, useEffect } from 'react';
import { MoaCharacter, DRESS_URL } from './MoaCharacter';
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
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  onOpenAuth,
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
                {isMoaStudent ? '내 정보' : '내 계정 & 비밀번호 확인'}
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 hidden sm:block">
                {isMoaStudent ? '모아팡 방번호·이름으로 들어온 내 정보' : '학생 계정 정보, 학년, 전화번호 및 4자리 비밀번호 확인'}
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

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
                {/* Left Column: Simple Emoji Profile & Stats Card */}
                <div className="pf-card pf-card--id md:col-span-5 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4">
                  <div className="pf-avatar relative w-28 h-28 rounded-2xl bg-gradient-to-b from-sky-100 to-indigo-100 border-2 border-sky-200 flex items-center justify-center shadow-inner">
                    {isMoaStudent ? (
                      <MoaCharacter size={104} fallback={profileEmoji} className="text-6xl select-none" />
                    ) : (
                      <span className="text-6xl select-none" role="img" aria-label="프로필 아이콘">
                        {profileEmoji}
                      </span>
                    )}
                    <div className="absolute -bottom-2 right-2 px-2 py-0.5 rounded-full bg-white/95 text-[10px] font-black text-slate-700 border border-slate-200 shadow-xs">
                      {currentUser.role === 'master' ? '👑 마스터' : `${editGrade}학년`}
                    </div>
                  </div>

                  {isMoaStudent && (
                    <a
                      href={DRESS_URL}
                      data-testid="go-dress"
                      className="px-4 py-2 rounded-2xl bg-pink-500 hover:bg-pink-400 text-white text-sm font-black shadow-sm border-2 border-pink-600 no-underline"
                      title="모아팡 캐릭터 꾸미기에서 옷을 입혀요. 다 꾸미면 타자팡으로 돌아와요"
                    >
                      👕 캐릭터 꾸미기
                    </a>
                  )}

                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-black text-slate-900 font-arcade">
                        {currentUser.name || editName || '학생'}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black border border-pink-200">
                        {currentUser.role === 'master' ? '마스터 관리자' : currentUser.levelTitle || '타자 꿈나무'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-1">
                      {currentUser.role === 'master'
                        ? '마스터 선생님 계정'
                        : `초등학교 ${editGrade}학년 • ${currentUser.studentId || '학생'}`}
                    </p>
                  </div>

                  {/* Account Approval Status */}
                  <div className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">계정 승인 상태</span>
                      {currentUser.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5" /> 승인 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                          ⏳ 승인 대기 중
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {currentUser.isApproved
                        ? '선생님 승인이 완료되어 모든 타자 연습 및 랭킹에 기록됩니다.'
                        : '선생님(마스터)의 승인 후 타자 랭킹에 공식 등록됩니다.'}
                    </p>
                  </div>

                  {/* Overall Stats */}
                  <div className="w-full grid grid-cols-2 gap-2 pt-1">
                    <div className="pf-stat pf-stat--sky p-3 bg-sky-50 rounded-2xl border border-sky-200 text-left">
                      <span className="text-[10px] font-extrabold text-sky-600 block">최고 타수</span>
                      <span className="text-base font-black text-sky-950 font-arcade">
                        {currentUser.highestCpm || 0}{' '}
                        <span className="text-[10px] font-bold text-sky-700">CPM</span>
                      </span>
                    </div>
                    <div className="pf-stat pf-stat--lav p-3 bg-purple-50 rounded-2xl border border-purple-200 text-left">
                      <span className="text-[10px] font-extrabold text-purple-600 block">누적 연습</span>
                      <span className="text-base font-black text-purple-950 font-arcade">
                        {currentUser.totalPracticeCount || 0}{' '}
                        <span className="text-[10px] font-bold text-purple-700">회</span>
                      </span>
                    </div>
                    <div className="pf-stat pf-stat--gold p-3 bg-amber-50 rounded-2xl border border-amber-200 text-left col-span-2 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-700 block">보유 타자 포인트</span>
                        <span className="text-base font-black text-amber-950 font-arcade">
                          {userPoints.toLocaleString()}{' '}
                          <span className="text-xs font-bold text-amber-700">P</span>
                        </span>
                      </div>
                      <span className="text-2xl">🪙</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Account Details & Password */}
                <div className="pf-card pf-card--form md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
                  {isMoaStudent ? (
                    <div className="space-y-4" data-testid="moa-account">
                      <div className="pb-3 border-b border-slate-100">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span>내 정보</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">모아팡에 들어온 방번호·이름 그대로예요. 비밀번호는 없어요.</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm font-black text-slate-800">
                        <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200">
                          <div className="text-[11px] text-slate-400">이름</div>
                          {currentUser?.name}
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200">
                          <div className="text-[11px] text-slate-400">반</div>
                          {currentUser?.studentId || '-'}
                        </div>
                      </div>
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
                                if (currentUser) {
                                  onUpdateUser({ ...currentUser, grade: g, levelTitle: `${g}학년 타자 꿈나무` });
                                  setAccountFeedback({ message: `✨ ${g}학년으로 저장했어요!`, type: 'success' });
                                  setTimeout(() => setAccountFeedback(null), 3000);
                                }
                              }}
                              className={`py-2 rounded-xl text-xs font-black border-2 cursor-pointer ${currentUser?.grade === g ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}
                            >
                              {g}학년
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold">이름을 바꾸려면 선생님께 말해 주세요. (다른 이름으로 들어오면 새 학생이 돼요)</p>
                    </div>
                  ) : (
                  <form onSubmit={handleSaveAccountInfo} className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-600" />
                          <span>학생 계정 정보 및 비밀번호</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {currentUser.role === 'master'
                            ? '👑 마스터 모드: 학생 및 관리자 정보를 자유롭게 수정할 수 있습니다.'
                            : '🔒 회원 정보(이름, 비밀번호 등)의 수정은 마스터 관리실에서만 가능합니다.'}
                        </p>
                      </div>
                      {currentUser.role !== 'master' && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black border border-amber-300">
                          조회 전용
                        </span>
                      )}
                    </div>

                    {currentUser.role !== 'master' && (
                      <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-2">
                        <span>🔒</span>
                        <span>
                          회원 정보는 홈페이지를 업데이트해도 안전하게 보존되며, 마스터(선생님) 계정으로 들어가야 수정할 수 있습니다.
                        </span>
                      </div>
                    )}

                    {/* 1. Student Name */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-pink-500" />
                        <span>학생 이름</span>
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="학생 이름 입력"
                        disabled={currentUser.role !== 'master'}
                        className={`w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-bold outline-hidden ${
                          currentUser.role !== 'master'
                            ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                            : 'bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-100'
                        }`}
                        required
                      />
                    </div>

                    {/* 2. Student ID */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-indigo-500" />
                          <span>로그인 아이디</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">고유 식별자</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={editStudentId}
                          className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-100 text-slate-700 font-mono text-xs sm:text-sm font-black outline-hidden cursor-not-allowed select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyId}
                          className="px-3.5 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-indigo-200 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0 active:scale-95"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedId ? '복사됨!' : '아이디 복사'}</span>
                        </button>
                      </div>
                    </div>

                    {/* 3. Password (PIN) */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>로그인 비밀번호 (4자리 숫자)</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            soundManager.play('pop');
                            setShowPassword(!showPassword);
                          }}
                          className="text-xs font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-1.5 bg-amber-200 hover:bg-amber-300 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>비밀번호 숨기기</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>비밀번호 확인하기</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          maxLength={4}
                          value={editPassword}
                          disabled={currentUser.role !== 'master'}
                          onChange={(e) => setEditPassword(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="4자리 숫자 비밀번호"
                          className={`w-full px-4 py-2.5 rounded-2xl border-2 border-amber-400 text-base font-black tracking-widest outline-hidden font-mono ${
                            currentUser.role !== 'master'
                              ? 'bg-amber-100/60 text-slate-600 cursor-not-allowed'
                              : 'bg-white text-slate-800 focus:border-amber-600 focus:ring-4 focus:ring-amber-200'
                          }`}
                          required
                        />
                      </div>
                      <p className="text-[11px] text-amber-900 font-medium">
                        {currentUser.role === 'master'
                          ? '💡 4자리 숫자 비밀번호를 수정한 후 아래 저장하기 버튼을 누르세요.'
                          : '💡 비밀번호 확인이 가능하며, 변경은 마스터 관리자에게 요청해주세요.'}
                      </p>
                    </div>

                    {/* 4. Phone Numbers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-sky-500" />
                          <span>학생 전화번호</span>
                        </label>
                        <input
                          type="text"
                          value={editPhone}
                          disabled={currentUser.role !== 'master'}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className={`w-full px-4 py-2 rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-bold outline-hidden ${
                            currentUser.role !== 'master'
                              ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                              : 'bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-100'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                          <span>학부모님 전화번호</span>
                        </label>
                        <input
                          type="text"
                          value={editParentPhone}
                          disabled={currentUser.role !== 'master'}
                          onChange={(e) => setEditParentPhone(e.target.value)}
                          placeholder="010-0000-0000"
                          className={`w-full px-4 py-2 rounded-2xl border-2 border-slate-200 text-xs sm:text-sm font-bold outline-hidden ${
                            currentUser.role !== 'master'
                              ? 'bg-slate-100 text-slate-600 cursor-not-allowed'
                              : 'bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100'
                          }`}
                        />
                      </div>
                    </div>

                    {/* 5. Grade Selection */}
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                        <span>학년</span>
                      </label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 5, 6].map((g) => (
                          <button
                            key={g}
                            type="button"
                            disabled={currentUser.role !== 'master'}
                            onClick={() => {
                              if (currentUser.role === 'master') {
                                soundManager.play('pop');
                                setEditGrade(g);
                              }
                            }}
                            className={`pf-grade ${editGrade === g ? 'is-on' : ''} py-2 rounded-xl text-xs font-black transition-all border-2 ${
                              editGrade === g
                                ? 'bg-purple-500 text-white border-purple-600 shadow-xs scale-102'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            } ${
                              currentUser.role !== 'master'
                                ? 'cursor-not-allowed opacity-90'
                                : 'cursor-pointer hover:bg-slate-100'
                            }`}
                          >
                            {g}학년
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Submit Save Button */}
                    <div className="pt-2">
                      {currentUser.role === 'master' ? (
                        <button
                          type="submit"
                          className="pf-save w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 hover:opacity-95 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 border-2 border-pink-300"
                        >
                          <Save className="w-4 h-4" />
                          <span>마스터 권한으로 저장하기</span>
                        </button>
                      ) : (
                        <div className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 font-bold">
                          👑 학생 정보 수정은 마스터 관리실에서만 가능합니다
                        </div>
                      )}
                    </div>
                  </form>
                  )}
                </div>
              </div>

              {/* Sound Effect Volume Control */}
              <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">타건 효과음 볼륨 조절</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      키보드 타건음, 정답 팡파레, 레벨업 사운드 크기를 조절합니다.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVolumeState(val);
                      soundManager.setVolume(val);
                    }}
                    className="w-32 sm:w-40 accent-sky-600 cursor-pointer"
                  />
                  <span className="text-xs font-black font-arcade text-sky-800 w-10 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => soundManager.play('achievement')}
                    className="px-3 py-1.5 bg-white text-sky-700 text-xs font-black rounded-xl border border-sky-200 hover:bg-sky-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    소리 테스트
                  </button>
                </div>
              </div>

              {/* Weekly Progress Chart */}
              <WeeklyProgressChart
                records={practiceRecords}
                userName={currentUser.name || editName || '학생'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
