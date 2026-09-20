import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  Sparkles, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Crown,
  Key,
  Mail,
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Send
} from 'lucide-react';
import { UserSession } from '../types';
import { PREDEFINED_AVATARS } from '../data/practiceData';
import { 
  verifyMasterKey, 
  requestPasswordResetEmail, 
  verifyAndResetPasswordWithCode,
  resetPasswordByMasterKey,
  registerMasterAccount,
  getMasterConfig
} from '../utils/curriculumManager';
import { notifyStudentRegistered, typangSync, cleanDigits, getLast4 } from '../utils/excelStudentManager';
import { typangApi } from '../utils/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
  onOpenMasterModal?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenMasterModal,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot-pw' | 'register-master'>('login');
  
  // Login & Register Form State
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState<number>(3);
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PREDEFINED_AVATARS[0]);
  
  // Forgot Password / Password Reset State
  const [resetMethod, setResetMethod] = useState<'email' | 'master_key'>('email');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetTargetEmail, setResetTargetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [simulatedEmailNotice, setSimulatedEmailNotice] = useState('');

  // Register Master Account State
  const [masterRegName, setMasterRegName] = useState('');
  const [masterRegEmail, setMasterRegEmail] = useState('');
  const [masterRegPassword, setMasterRegPassword] = useState('');
  const [masterRegSecretKey, setMasterRegSecretKey] = useState('');
  const [masterRegPhone, setMasterRegPhone] = useState('');

  // Feedback Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Retrieve user database from localStorage
  const getUsersDb = (): UserSession[] => {
    try {
      const data = localStorage.getItem('typang_users_db');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveUsersDb = (users: UserSession[]) => {
    try {
      localStorage.setItem('typang_users_db', JSON.stringify(users));
      typangSync.broadcast('USERS_UPDATED', { count: users.length, timestamp: Date.now() });
    } catch (e) {
      console.error('Failed to save users db:', e);
    }
  };

  const clearMessages = () => {
    setErrorMsg('');
    setPendingApprovalMsg('');
    setSuccessMsg('');
    setSimulatedEmailNotice('');
  };

  // 1. Handle Login or Register Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    // Check if logging in as Master
    const rawKey = studentId.trim();
    if (activeTab === 'login' && (rawKey.toLowerCase() === 'master' || rawKey === '마스터' || rawKey === '선생님' || rawKey === '관리자')) {
      const masterCfg = getMasterConfig();
      const masterRes = await typangApi.masterLogin(password.trim());
      if (masterRes.success) {
        const masterSession: UserSession = {
          id: 'master_admin',
          name: masterCfg.masterName || '마스터 선생님',
          studentId: 'master',
          phone: masterCfg.masterPhone || '010-0000-0000',
          parentPhone: masterCfg.masterPhone || '010-0000-0000',
          password: password,
          avatar: '👑',
          role: 'master',
          isApproved: true,
          levelTitle: '최고 관리자',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          totalPracticeCount: 999,
          highestCpm: 999,
        };
        onLoginSuccess(masterSession);
        onClose();
        return;
      } else {
        setErrorMsg(masterRes.message || '선생님(마스터) 비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    if (activeTab === 'login') {
      // Login flow: match by Student Name (or ID / Master)
      const loginKey = rawKey;
      if (!loginKey) {
        setErrorMsg('학생 이름을 입력해 주세요. (선생님: master)');
        return;
      }
      if (!password.trim()) {
        setErrorMsg('비밀번호(학부모 전화번호 뒷자리 4개)를 입력해 주세요.');
        return;
      }

      try {
        // Try login via centralized typangApi (with automatic fallback to localStorage)
        const res = await typangApi.login(loginKey, password.trim());
        if (res.success && res.user) {
          if (!res.user.isApproved && res.user.role !== 'master') {
            setPendingApprovalMsg(
              `🔒 '${res.user.name}' 학생은 아직 선생님(마스터)의 가입 승인 대기 중입니다!\n선생님이 마스터 관리실에서 승인해 주신 후 바로 로그인하실 수 있습니다.`
            );
            return;
          }

          onLoginSuccess(res.user);
          onClose();
          return;
        } else if (res.pending) {
          setPendingApprovalMsg(`🔒 ${res.message}`);
          return;
        } else {
          setErrorMsg(res.message || `'${loginKey}' 계정 정보를 찾을 수 없거나 비밀번호가 일치하지 않습니다.`);
          return;
        }
      } catch (err: any) {
        setErrorMsg('로그인 처리 중 오류가 발생했습니다: ' + (err?.message || '다시 시도해 주세요.'));
      }
    } else if (activeTab === 'register') {
      // Registration flow: Name + Parent Phone only! Auto password (last 4 digits). No student ID!
      if (!name.trim()) {
        setErrorMsg('학생 이름을 입력해 주세요.');
        return;
      }
      if (!parentPhone.trim()) {
        setErrorMsg('부모님 전화번호를 입력해 주세요.');
        return;
      }

      const phoneDigits = cleanDigits(parentPhone);
      if (phoneDigits.length < 4) {
        setErrorMsg('부모님 전화번호를 정확히 입력해 주세요. (최소 4자리 이상)');
        return;
      }

      const cleanName = name.trim();
      const autoPw = getLast4(phoneDigits);

      try {
        const res = await typangApi.registerStudent({
          name: cleanName,
          parentPhone: parentPhone.trim(),
          phone: parentPhone.trim(),
          grade: grade,
          avatar: selectedAvatar.emoji,
          avatarBg: selectedAvatar.bg,
        });

        if (!res.success || !res.user) {
          setErrorMsg(res.message || '학생 등록에 실패했습니다. 다시 시도해 주세요.');
          return;
        }

        const newUser = res.user;
        if (res.pending || !newUser.isApproved) {
          setSuccessMsg(
            `📮 '${newUser.name}' 가입 신청이 접수되었어요!\n선생님이 마스터 관리실에서 승인하면 로그인할 수 있어요.\n🔑 비밀번호는 부모님 전화번호 뒷자리 [${autoPw}]입니다.`
          );
          return;
        }
        setSuccessMsg(`🎉 '${newUser.name}' 학생은 이미 등록되어 있어요. 비밀번호 [${autoPw}]로 로그인하세요!`);
        setActiveTab('login');
      } catch (err: any) {
        setErrorMsg('학생 등록 중 오류가 발생했습니다: ' + (err?.message || '다시 시도해 주세요.'));
      }
    }
  };

  // 2. Request Email Verification Code
  const handleRequestEmailCode = () => {
    clearMessages();
    if (!resetIdentifier.trim()) {
      setErrorMsg('비밀번호를 찾을 학생 이름 또는 아이디(전화번호)를 입력하세요.');
      return;
    }
    const result = requestPasswordResetEmail(resetIdentifier.trim(), resetTargetEmail.trim());
    if (result.success) {
      setCodeSent(true);
      setSuccessMsg(result.message);
      if (result.code) {
        setSimulatedEmailNotice(`[안내] 발송된 6자리 인증번호는 [ ${result.code} ] 입니다. 아래에 입력하세요.`);
      }
    } else {
      setErrorMsg(result.message);
    }
  };

  // 3. Confirm Password Reset via Email Code
  const handleConfirmEmailReset = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!verificationCode.trim()) {
      setErrorMsg('이메일로 발송된 6자리 인증코드를 입력해 주세요.');
      return;
    }
    if (!newResetPassword.trim() || newResetPassword.length < 4) {
      setErrorMsg('새 비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }

    const result = verifyAndResetPasswordWithCode(resetIdentifier.trim(), verificationCode.trim(), newResetPassword.trim());
    if (result.success) {
      setSuccessMsg('🎉 비밀번호가 성공적으로 변경되었습니다! 새 비밀번호로 로그인해 주세요.');
      setCodeSent(false);
      setVerificationCode('');
      setNewResetPassword('');
      setActiveTab('login');
    } else {
      setErrorMsg(result.message);
    }
  };

  // 4. Confirm Password Reset via Master Key
  const handleMasterKeyReset = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!resetIdentifier.trim()) {
      setErrorMsg('비밀번호를 재설정할 학생 아이디나 이름을 입력해 주세요.');
      return;
    }
    if (!masterKeyInput.trim()) {
      setErrorMsg('마스터(선생님) 보안키를 입력해 주세요.');
      return;
    }
    if (!newResetPassword.trim() || newResetPassword.length < 4) {
      setErrorMsg('새 비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }

    const result = resetPasswordByMasterKey(resetIdentifier.trim(), masterKeyInput.trim(), newResetPassword.trim());
    if (result.success) {
      setSuccessMsg('🎉 마스터 권한으로 학생 비밀번호가 성공적으로 재설정되었습니다!');
      setMasterKeyInput('');
      setNewResetPassword('');
      setActiveTab('login');
    } else {
      setErrorMsg(result.message);
    }
  };

  // 5. Register Teacher / Master Account
  const handleRegisterMasterAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!masterRegName.trim() || !masterRegEmail.trim() || !masterRegPassword.trim() || !masterRegSecretKey.trim()) {
      setErrorMsg('선생님 이름, 이메일, 로그인 비밀번호, 마스터키를 모두 입력해 주세요.');
      return;
    }
    if (masterRegPassword.length < 4 || masterRegSecretKey.length < 4) {
      setErrorMsg('비밀번호와 마스터키는 각각 4자리 이상으로 설정해 주세요.');
      return;
    }

    // 서버에서 현재 마스터 비밀번호(=마스터키)를 확인한 뒤에만 새 비밀번호로 바꿀 수 있음
    const auth = await typangApi.masterLogin(masterRegSecretKey.trim());
    if (!auth.success) {
      setErrorMsg('마스터키(현재 마스터 비밀번호)가 맞지 않아요. 처음이라면 기본값 1234 를 입력하세요.');
      return;
    }
    const changed = await typangApi.setMasterPassword(masterRegPassword.trim());
    if (!changed.success) {
      setErrorMsg(changed.message || '마스터 비밀번호를 바꾸지 못했어요.');
      return;
    }

    const result = registerMasterAccount({
      masterName: masterRegName.trim(),
      masterEmail: masterRegEmail.trim(),
      masterPassword: masterRegPassword.trim(),
      masterKey: masterRegSecretKey.trim(),
      masterPhone: masterRegPhone.trim() || '010-0000-0000',
    });

    if (result.success) {
      setSuccessMsg('👑 마스터 비밀번호를 바꿨어요! 이제 새 비밀번호로 관리실에 들어갈 수 있어요. (명단 고정 파일을 다시 받아 두면 재배포 후에도 유지됩니다)');
      setActiveTab('login');
    } else {
      setErrorMsg(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-2xl border-4 border-sky-200 relative my-8 arcade-card-glow max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors cursor-pointer"
          title="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5 shrink-0">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 border-2 border-sky-300 shadow-sm mb-2">
            <Sparkles className="w-6 h-6 text-sky-500 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-arcade">
            {activeTab === 'login' && '학생 로그인'}
            {activeTab === 'register' && '학생 가입 신청'}
            {activeTab === 'forgot-pw' && '비밀번호 찾기 & 재설정'}
            {activeTab === 'register-master' && '마스터(선생님) 등록'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {activeTab === 'login' && '부모님 전화번호와 뒷자리 4자리로 간편하게 로그인하세요!'}
            {activeTab === 'register' && '이름과 부모님 전화번호로 신청하면, 선생님이 승인한 뒤 로그인할 수 있어요. (비밀번호: 뒷 4자리)'}
            {activeTab === 'forgot-pw' && '이메일 인증 또는 선생님 마스터키로 비밀번호를 안전하게 찾으세요.'}
            {activeTab === 'register-master' && '선생님 전용 마스터키와 비밀번호를 안전하게 등록 및 관리합니다.'}
          </p>
        </div>

        {/* Main Tabs Navigation */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-4 border border-slate-200 shrink-0 gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              clearMessages();
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'login'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>로그인</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              clearMessages();
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'register'
                ? 'bg-pink-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>가입 신청</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('forgot-pw');
              clearMessages();
            }}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'forgot-pw'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>비번 찾기</span>
          </button>
        </div>

        {/* Alerts & Messages */}
        {errorMsg && (
          <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-start gap-2 animate-shake shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {simulatedEmailNotice && (
          <div className="mb-3 p-3 rounded-2xl bg-sky-50 border-2 border-sky-300 text-sky-900 text-xs font-black flex items-start gap-2 shrink-0">
            <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>{simulatedEmailNotice}</span>
          </div>
        )}

        {pendingApprovalMsg && (
          <div className="mb-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold space-y-2 shrink-0">
            <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm">
              <Clock className="w-4 h-4 animate-spin text-amber-600" />
              <span>선생님 승인 대기 중</span>
            </div>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {pendingApprovalMsg}
            </p>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3.5 rounded-2xl bg-teal-50 border-2 border-teal-300 text-teal-900 text-xs font-bold space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-teal-700 font-extrabold text-sm">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>완료</span>
            </div>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">
              {successMsg}
            </p>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {/* TAB 1 & 2: LOGIN OR REGISTER FORM */}
          {(activeTab === 'login' || activeTab === 'register') && (
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              {/* Avatar Selection (Only for Register) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    나만의 아바타 캐릭터 선택
                  </label>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-2 bg-pink-50/50 rounded-2xl border-2 border-pink-100">
                    {PREDEFINED_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`p-2 rounded-xl text-center border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          selectedAvatar.id === avatar.id
                            ? 'border-pink-500 bg-white ring-3 ring-pink-200 scale-105 shadow-xs'
                            : 'border-transparent bg-white/70 hover:bg-white hover:border-pink-200'
                        }`}
                      >
                        <span className="text-2xl">{avatar.emoji}</span>
                        <span className="text-[10px] font-extrabold text-slate-700 truncate w-full">
                          {avatar.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Name (Registration) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    학생 이름 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="학생 이름 입력 (예: 김하늘)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-pink-100 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-xs sm:text-sm font-bold bg-pink-50/40 outline-hidden"
                      required={activeTab === 'register'}
                    />
                  </div>
                </div>
              )}

              {/* Parent Phone (Registration) - NO separate ID needed! */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    부모님 전화번호 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="부모님 전화번호 (예: 010-1234-5678)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-pink-100 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-xs sm:text-sm font-bold bg-pink-50/40 outline-hidden"
                      required={activeTab === 'register'}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">
                    * 별도의 아이디는 없으며, 이 전화번호가 학생의 고유 식별 번호가 됩니다.
                  </p>
                </div>
              )}

              {/* Auto Password Info Box (Registration) */}
              {activeTab === 'register' && (
                <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl border-2 border-pink-200 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm">
                      🔑
                    </div>
                    <div>
                      <div className="text-xs font-black text-pink-900">비밀번호 자동 지정</div>
                      <div className="text-[10px] text-slate-600 font-medium">
                        부모님 전화번호 뒷자리 4자리로 자동 등록
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-white rounded-xl border-2 border-pink-300 font-mono font-black text-sm text-pink-600 shadow-2xs">
                    {cleanDigits(parentPhone).length >= 4 ? getLast4(parentPhone) : '••••'}
                  </div>
                </div>
              )}

              {/* Identifier for Login (Student Name or Master) */}
              {activeTab === 'login' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    학생 이름 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudentId(val);
                      }}
                      placeholder="학생 이름 입력 (예: 김철수) 또는 선생님: master"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-sky-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 text-xs sm:text-sm font-bold bg-sky-50/40 outline-hidden"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">
                    * 가입 시 등록한 학생 이름을 입력하세요. (선생님/관리자: master)
                  </p>
                </div>
              )}

              {/* Grade Selection (Only for registration) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    학년 선택
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 bg-sky-50/60 p-1.5 rounded-2xl border-2 border-sky-100">
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`py-2 text-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                          grade === g
                            ? 'bg-pink-500 text-white shadow-xs ring-2 ring-pink-200 scale-105'
                            : 'bg-white text-slate-700 hover:bg-pink-50'
                        }`}
                      >
                        {g}학년
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4-digit Password (Login only - in registration, it's auto-generated from phone!) */}
              {activeTab === 'login' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-extrabold text-slate-700">
                      비밀번호 (학부모 전화번호 뒷자리 4개) <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      maxLength={10}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="학부모 전화번호 뒷 4자리 (예: 2222)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-sky-100 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 text-xs sm:text-sm font-bold bg-sky-50/40 outline-hidden font-mono tracking-widest"
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-slate-400 font-medium">
                      학부모님 전화번호의 마지막 4자리입니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('forgot-pw');
                        clearMessages();
                      }}
                      className="text-[11px] text-purple-600 hover:text-purple-700 font-bold hover:underline cursor-pointer"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-3 px-4 rounded-2xl text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'login' ? 'arcade-btn-sky' : 'arcade-btn-pink'
                }`}
              >
                {activeTab === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>부모님 전화번호로 로그인</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>가입 신청하기 (선생님 승인 후 이용)</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: FORGOT PASSWORD / RESET PASSWORD */}
          {activeTab === 'forgot-pw' && (
            <div className="space-y-4">
              {/* Method Toggle */}
              <div className="flex bg-purple-50 p-1 rounded-xl border border-purple-200">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('email');
                    clearMessages();
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    resetMethod === 'email'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-purple-700 hover:text-purple-900'
                  }`}
                >
                  ✉️ 이메일 인증코드로 찾기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('master_key');
                    clearMessages();
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    resetMethod === 'master_key'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-purple-700 hover:text-purple-900'
                  }`}
                >
                  🔑 선생님 마스터키로 재설정
                </button>
              </div>

              {/* Option A: Email Verification Flow */}
              {resetMethod === 'email' ? (
                <form onSubmit={handleConfirmEmailReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      학생 아이디 또는 이름
                    </label>
                    <input
                      type="text"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="예: 김철수 또는 student1"
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-100 focus:border-purple-500 text-xs sm:text-sm font-bold bg-purple-50/30 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      등록 이메일 또는 학부모 연락처
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={resetTargetEmail}
                        onChange={(e) => setResetTargetEmail(e.target.value)}
                        placeholder="이메일 입력 (예: student@school.kr)"
                        className="flex-1 px-3.5 py-2 rounded-2xl border-2 border-purple-100 focus:border-purple-500 text-xs font-bold bg-purple-50/30 outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleRequestEmailCode}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-xs"
                      >
                        인증코드 받기
                      </button>
                    </div>
                  </div>

                  {codeSent && (
                    <div className="space-y-3 pt-2 border-t border-purple-100">
                      <div>
                        <label className="block text-xs font-extrabold text-purple-900 mb-1">
                          6자리 인증코드 입력
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="발송된 6자리 번호 입력"
                          maxLength={6}
                          className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-300 focus:border-purple-600 text-sm font-black tracking-widest text-center bg-white outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-purple-900 mb-1">
                          새로 설정할 비밀번호
                        </label>
                        <input
                          type="password"
                          value={newResetPassword}
                          onChange={(e) => setNewResetPassword(e.target.value)}
                          placeholder="새 비밀번호 (4자리 이상)"
                          className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-100 focus:border-purple-500 text-xs sm:text-sm font-bold bg-purple-50/30 outline-hidden"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                      >
                        새 비밀번호로 변경 완료
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                /* Option B: Reset with Teacher Master Key */
                <form onSubmit={handleMasterKeyReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      학생 아이디 또는 전화번호
                    </label>
                    <input
                      type="text"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                      placeholder="예: 010-1234-5678 또는 student1"
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-100 focus:border-purple-500 text-xs sm:text-sm font-bold bg-purple-50/30 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-purple-900 mb-1">
                      선생님 전용 마스터 보안키 (Master Key)
                    </label>
                    <input
                      type="password"
                      value={masterKeyInput}
                      onChange={(e) => setMasterKeyInput(e.target.value)}
                      placeholder="선생님만 아는 마스터키 입력"
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-200 focus:border-purple-500 text-xs sm:text-sm font-bold bg-purple-50/30 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      학생 새 비밀번호 입력
                    </label>
                    <input
                      type="password"
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="새 비밀번호 (4자리 이상)"
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-100 focus:border-purple-500 text-xs sm:text-sm font-bold bg-purple-50/30 outline-hidden"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    마스터 권한으로 비밀번호 즉시 재설정
                  </button>
                </form>
              )}

              {/* Master Registration Link */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register-master');
                    clearMessages();
                  }}
                  className="text-xs font-black text-pink-600 hover:text-pink-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>선생님 마스터 계정 등록 / 마스터키 변경하기</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: REGISTER MASTER / TEACHER ACCOUNT */}
          {activeTab === 'register-master' && (
            <form onSubmit={handleRegisterMasterAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  선생님 성함
                </label>
                <input
                  type="text"
                  value={masterRegName}
                  onChange={(e) => setMasterRegName(e.target.value)}
                  placeholder="예: 홍길동 선생님"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-xs sm:text-sm font-bold bg-amber-50/30 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  선생님 이메일 (비밀번호 분실 복구용)
                </label>
                <input
                  type="email"
                  value={masterRegEmail}
                  onChange={(e) => setMasterRegEmail(e.target.value)}
                  placeholder="예: teacher@school.kr"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-xs sm:text-sm font-bold bg-amber-50/30 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  선생님 로그인 비밀번호
                </label>
                <input
                  type="password"
                  value={masterRegPassword}
                  onChange={(e) => setMasterRegPassword(e.target.value)}
                  placeholder="마스터 관리실 입장 비밀번호 (4자리 이상)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-xs sm:text-sm font-bold bg-amber-50/30 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-amber-900 mb-1">
                  🔒 비밀 마스터키 (Master Secret Key - 학생 비번 초기화용)
                </label>
                <input
                  type="password"
                  value={masterRegSecretKey}
                  onChange={(e) => setMasterRegSecretKey(e.target.value)}
                  placeholder="공개되지 않는 비밀 마스터키 설정"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-400 focus:border-amber-600 text-xs sm:text-sm font-bold bg-white outline-hidden"
                  required
                />
                <p className="text-[11px] text-slate-500 font-bold mt-1">
                  * 마스터키는 외부에 절대 공개되지 않으며, 선생님 본인만 확인 및 변경할 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  선생님 연락처 (선택)
                </label>
                <input
                  type="tel"
                  value={masterRegPhone}
                  onChange={(e) => setMasterRegPhone(e.target.value)}
                  placeholder="예: 010-1234-5678"
                  className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-amber-200 focus:border-amber-500 text-xs sm:text-sm font-bold bg-amber-50/30 outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-md transition-all cursor-pointer border border-amber-600"
              >
                마스터 계정 및 비밀 마스터키 저장하기
              </button>
            </form>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>선생님이신가요?</span>
          <span className="text-slate-500 font-bold">
            이름에 <strong className="text-pink-600 font-black font-mono">'master'</strong> 입력 후 비밀번호로 로그인
          </span>
        </div>
      </div>
    </div>
  );
};
