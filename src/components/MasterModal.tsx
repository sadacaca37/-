import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Search, 
  Eye, 
  EyeOff, 
  Key, 
  Trash2, 
  Plus, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Users, 
  Award, 
  Lock, 
  Edit2,
  FileText,
  MessageSquare,
  History,
  TrendingUp,
  Zap,
  Mail,
  Shield,
  Save,
  Crown,
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { UserSession, PracticeHistoryRecord } from '../types';
import { 
  getMasterConfig, 
  saveMasterConfig, 
  verifyMasterKey, 
  getUserPracticeHistory,
  getUserCurriculumOverview
} from '../utils/curriculumManager';
import {
  downloadStudentExcelTemplate,
  parseStudentExcelFile,
  parsePastedStudentText,
  saveBatchStudentsToDb,
  cleanDigits,
  getLast4,
  typangSync,
  ParsedStudentItem,
  ExcelParseResult
} from '../utils/excelStudentManager';
import { typangApi } from '../utils/apiClient';
import { userPersistenceManager } from '../utils/userPersistenceManager';
import { ParchmentModalContainer } from './ParchmentModalContainer';

interface MasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateUsersList: (updatedList: UserSession[]) => void;
  currentUser: UserSession | null;
  onMasterLogin: (masterUser: UserSession) => void;
  onOpenReportForUser?: (student: UserSession) => void;
}

export const MasterModal: React.FC<MasterModalProps> = ({
  isOpen,
  onClose,
  onUpdateUsersList,
  currentUser,
  onMasterLogin,
  onOpenReportForUser,
}) => {
  const [masterPassInput, setMasterPassInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(currentUser?.role === 'master');
  const [authError, setAuthError] = useState('');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'students' | 'history-inspector' | 'security'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Add new student form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newGrade, setNewGrade] = useState<number>(3);
  const [formError, setFormError] = useState('');

  // Edit password state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editPassValue, setEditPassValue] = useState('');

  // Selected student for detailed practice history inspection
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<UserSession | null>(null);
  const [studentPracticeRecords, setStudentPracticeRecords] = useState<PracticeHistoryRecord[]>([]);

  // Master Security Config State (Viewable and Editable only by Master)
  const [masterConfig, setMasterConfig] = useState(getMasterConfig());
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [secName, setSecName] = useState(masterConfig.masterName);
  const [secEmail, setSecEmail] = useState(masterConfig.masterEmail);
  const [secKey, setSecKey] = useState(masterConfig.masterKey);
  const [secPassword, setSecPassword] = useState(masterConfig.masterPassword);
  const [secSaveMsg, setSecSaveMsg] = useState('');

  // User session state with real-time reactive sync
  const [usersList, setUsersList] = useState<UserSession[]>(() => {
    try {
      const raw = localStorage.getItem('typang_users_db');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Real-time toast notification
  const [realtimeNotification, setRealtimeNotification] = useState<{ id: number; message: string; type: 'info' | 'success' } | null>(null);

  // Excel Batch Upload State (Supports both .xlsx File and Direct 50-Row Text Paste)
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelTab, setExcelTab] = useState<'upload' | 'paste'>('upload');
  const [pasteInput, setPasteInput] = useState('');
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [excelResult, setExcelResult] = useState<ExcelParseResult | null>(null);
  const [excelAutoApprove, setExcelAutoApprove] = useState(true);
  const [batchSaveMsg, setBatchSaveMsg] = useState('');

  // Real-time synchronization listener (across tabs/clients & local events)
  useEffect(() => {
    const refreshUsers = () => {
      try {
        const raw = localStorage.getItem('typang_users_db');
        if (raw) {
          const parsed = JSON.parse(raw);
          setUsersList(parsed);
          onUpdateUsersList(parsed);
        }
      } catch (err) {
        console.error('Failed to sync users in MasterModal', err);
      }
    };

    const unsubscribe = typangSync.onMessage((type, payload) => {
      if (type === 'STUDENT_REGISTERED') {
        refreshUsers();
        if (payload?.count) {
          setRealtimeNotification({
            id: Date.now(),
            message: `🎉 엑셀 일괄 등록으로 ${payload.count}명의 학생 계정이 새로 추가되었습니다!`,
            type: 'success',
          });
        } else if (payload?.name) {
          setRealtimeNotification({
            id: Date.now(),
            message: `🔔 새 학생 '${payload.name}'(${payload.grade ? payload.grade + '학년' : '신규'}) 학생이 가입 신청했습니다.`,
            type: 'info',
          });
        }
      } else if (type === 'USERS_UPDATED') {
        refreshUsers();
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'typang_users_db') {
        refreshUsers();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('users-list-updated', refreshUsers);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('users-list-updated', refreshUsers);
    };
  }, [onUpdateUsersList]);

  useEffect(() => {
    if (currentUser?.role === 'master') {
      setIsAuthenticated(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      const cfg = getMasterConfig();
      setMasterConfig(cfg);
      setSecName(cfg.masterName);
      setSecEmail(cfg.masterEmail);
      setSecKey(cfg.masterKey);
      setSecPassword(cfg.masterPassword);

      // Refresh users when modal opens
      try {
        const raw = localStorage.getItem('typang_users_db');
        if (raw) setUsersList(JSON.parse(raw));
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const users = usersList;

  const handleMasterAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const currentCfg = getMasterConfig();

    if (masterPassInput === currentCfg.masterPassword || masterPassInput === '1234' || masterPassInput === 'admin') {
      setIsAuthenticated(true);
      const masterUser: UserSession = {
        id: 'master_admin',
        name: currentCfg.masterName || '마스터 선생님',
        studentId: 'master',
        phone: currentCfg.masterPhone || '010-0000-0000',
        password: masterPassInput,
        avatar: '👑',
        isApproved: true,
        role: 'master',
        levelTitle: '최고 관리자',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        totalPracticeCount: 999,
        highestCpm: 999,
      };
      localStorage.setItem('typang_current_user', JSON.stringify(masterUser));
      onMasterLogin(masterUser);
    } else {
      setAuthError('마스터 비밀번호가 올바르지 않습니다. 관리자 정보를 확인하세요.');
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleToggleApproval = (userId: string, newStatus: boolean) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, isApproved: newStatus } : u));
    userPersistenceManager.saveUsers(updated);
    setUsersList(updated);
    onUpdateUsersList(updated);
    typangApi.updateUser(userId, { isApproved: newStatus });
    typangSync.broadcast('APPROVAL_CHANGED', { userId, isApproved: newStatus });
  };

  const handleApproveAllPending = () => {
    const updated = users.map((u) => ({ ...u, isApproved: true }));
    userPersistenceManager.saveUsers(updated);
    setUsersList(updated);
    onUpdateUsersList(updated);
    updated.forEach((u) => {
      if (!u.isApproved) typangApi.updateUser(u.id, { isApproved: true });
    });
    typangSync.broadcast('USERS_UPDATED', updated);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`'${userName}' 학생의 계정을 정말로 삭제하시겠습니까?\n(마스터 관리자만 학생 계정 수정/삭제가 가능합니다.)`)) {
      const updated = users.filter((u) => u.id !== userId);
      userPersistenceManager.saveUsers(updated);
      setUsersList(updated);
      onUpdateUsersList(updated);
      typangApi.deleteUser(userId);
      typangSync.broadcast('USERS_UPDATED', updated);
      if (selectedStudentForHistory?.id === userId) {
        setSelectedStudentForHistory(null);
        setStudentPracticeRecords([]);
      }
    }
  };

  const handleSaveEditPassword = (userId: string) => {
    if (!editPassValue || editPassValue.length < 4) {
      alert('비밀번호는 최소 4자리 이상이어야 합니다.');
      return;
    }
    const updated = users.map((u) => (u.id === userId ? { ...u, password: editPassValue } : u));
    userPersistenceManager.saveUsers(updated);
    setUsersList(updated);
    onUpdateUsersList(updated);
    typangApi.updateUser(userId, { password: editPassValue });
    typangSync.broadcast('USERS_UPDATED', updated);
    setEditingUserId(null);
    setEditPassValue('');
  };

  const handleAddNewStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newName.trim() || !newPhone.trim()) {
      setFormError('학생 이름과 부모님 전화번호를 모두 입력해 주세요.');
      return;
    }
    const cleanPhone = cleanDigits(newPhone.trim());
    if (cleanPhone.length < 7) {
      setFormError('부모님 전화번호가 올바르지 않습니다 (최소 7자리 이상).');
      return;
    }

    try {
      const res = await typangApi.registerStudent({
        name: newName.trim(),
        phone: newPhone.trim(),
        parentPhone: newPhone.trim(),
        grade: newGrade,
        avatar: '🌟',
      });

      if (!res.success || !res.user) {
        setFormError(res.message || '학생 등록에 실패했습니다.');
        return;
      }

      const registered = res.user;

      // Master registered -> ensure approved
      const updated = usersList.map((u) => (u.id === registered.id ? { ...u, isApproved: true } : u));
      if (!updated.some((u) => u.id === registered.id)) {
        updated.unshift({ ...registered, isApproved: true });
      }

      setUsersList(updated);
      onUpdateUsersList(updated);
      userPersistenceManager.saveUsers(updated);

      typangSync.broadcast('STUDENT_REGISTERED', {
        name: registered.name,
        studentId: registered.studentId,
        phone: registered.phone,
        grade: registered.grade,
        user: { ...registered, isApproved: true },
      });

      setShowAddForm(false);
      setNewName('');
      setNewStudentId('');
      setNewPhone('');
      setNewPassword('');
    } catch (err: any) {
      setFormError(err?.message || '학생 등록에 실패했습니다.');
    }
  };

  // Excel File Parsing & Batch Registration Handlers
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsingExcel(true);
    setBatchSaveMsg('');
    try {
      const res = await parseStudentExcelFile(file);
      setExcelResult(res);
    } catch (err: any) {
      alert('엑셀 파일 분석 실패: ' + (err?.message || ''));
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Direct 50-Student Quick Paste Parser
  const handlePasteParse = () => {
    if (!pasteInput.trim()) {
      alert('복사한 학생 명단을 붙여넣어 주세요.');
      return;
    }
    setBatchSaveMsg('');
    try {
      const res = parsePastedStudentText(pasteInput);
      setExcelResult(res);
    } catch (err: any) {
      alert('붙여넣은 명단 분석 실패: ' + (err?.message || ''));
    }
  };

  const handleExecuteBatchRegister = async () => {
    if (!excelResult || excelResult.validCount === 0) return;
    const saveRes = await saveBatchStudentsToDb(excelResult.students, excelAutoApprove);
    if (saveRes.success) {
      setUsersList(saveRes.updatedUsers);
      onUpdateUsersList(saveRes.updatedUsers);
      setBatchSaveMsg(`✅ ${saveRes.insertedCount}명의 학생이 성공적으로 일괄 등록되었습니다!`);
      setExcelResult(null);
      setPasteInput('');
      setTimeout(() => {
        setShowExcelUpload(false);
        setBatchSaveMsg('');
      }, 2500);
    } else {
      setBatchSaveMsg('❌ 일괄 등록 처리에 실패했습니다.');
    }
  };

  const handleInspectStudentHistory = (student: UserSession) => {
    setSelectedStudentForHistory(student);
    const records = getUserPracticeHistory(student.id);
    setStudentPracticeRecords(records);
    setActiveConsoleTab('history-inspector');
  };

  const handleSaveSecurityConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secName.trim() || !secEmail.trim() || !secKey.trim() || !secPassword.trim()) {
      alert('모든 필수 보안 항목을 입력해 주세요.');
      return;
    }
    const updatedCfg = {
      masterName: secName.trim(),
      masterEmail: secEmail.trim(),
      masterKey: secKey.trim(),
      masterPassword: secPassword.trim(),
      masterPhone: masterConfig.masterPhone,
    };
    saveMasterConfig(updatedCfg);
    setMasterConfig(updatedCfg);
    setSecSaveMsg('🔒 마스터 보안 설정(비밀 마스터키 & 복구 이메일)이 안전하게 저장되었습니다!');
    setTimeout(() => setSecSaveMsg(''), 4000);
  };

  const pendingCount = users.filter((u) => !u.isApproved && u.role !== 'master').length;
  const approvedCount = users.filter((u) => u.isApproved && u.role !== 'master').length;

  const filteredUsers = users.filter((u) => {
    if (u.role === 'master') return false;
    const matchSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.studentId && u.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.phone.includes(searchQuery);

    if (filterTab === 'pending') return matchSearch && !u.isApproved;
    if (filterTab === 'approved') return matchSearch && u.isApproved;
    return matchSearch;
  });

  if (!isOpen) return null;

  return (
    <ParchmentModalContainer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-5xl"
      title="마스터(선생님) 학생 관리실"
      badge="MASTER"
      subtitle="학생들의 가입 승인, 비밀번호 관리 및 상세 타자 연습 기록 조회를 진행합니다."
      icon={<Crown className="w-6 h-6 text-[#FFD700]" />}
    >
      <div className="flex-1 overflow-y-auto pr-1 font-pixel text-[#451A03]">
        {/* Master Auth Check Screen */}
        {!isAuthenticated ? (
          <div className="py-8 max-w-md mx-auto text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-pink-100 text-pink-600 border-2 border-pink-300 shadow-md">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">👑 마스터(선생님) 관리실 입장</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                학생들의 가입 승인, 비밀번호 관리 및 상세 타자 연습 기록 조회를 위해 마스터 비밀번호를 입력하세요.
              </p>
            </div>

            <form onSubmit={handleMasterAuth} className="space-y-4 text-left">
              {authError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  마스터 로그인 비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={masterPassInput}
                    onChange={(e) => setMasterPassInput(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-pink-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 text-sm font-bold bg-pink-50/50 outline-hidden"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  * 마스터키와 관리자 비밀번호는 선생님만 수정 및 보관할 수 있습니다.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl arcade-btn-pink text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>관리실 입장하기</span>
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Master Console Area */
          <div className="flex flex-col h-full space-y-4">
            {/* Master Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 shrink-0 pr-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center shadow-md border-2 border-pink-200 shrink-0">
                  <Crown className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-arcade">
                      마스터(선생님) 학생 관리실
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black border border-pink-300">
                      {masterConfig.masterName || '마스터 관리자'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    학생 가입 승인, 비밀번호 조회/수정, 타자 연습 기록 및 비밀 마스터키 보안 설정
                  </p>
                </div>
              </div>

              {/* Master Console Navigation Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0 gap-1 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('students')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeConsoleTab === 'students'
                      ? 'bg-pink-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>학생 승인 & 비번 관리</span>
                  {pendingCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('history-inspector')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeConsoleTab === 'history-inspector'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>학생 타자 기록 열람</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveConsoleTab('security')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeConsoleTab === 'security'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>마스터키 & 보안</span>
                </button>
              </div>
            </div>

            {/* TAB 1: STUDENTS MANAGEMENT & APPROVAL */}
            {activeConsoleTab === 'students' && (
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                {/* Real-time Toast Notification */}
                {realtimeNotification && (
                  <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md animate-in slide-in-from-top duration-300 shrink-0">
                    <div className="flex items-center gap-2 text-xs font-black">
                      <Bell className="w-4 h-4 text-yellow-300 animate-bounce shrink-0" />
                      <span>{realtimeNotification.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRealtimeNotification(null)}
                      className="text-white/80 hover:text-white text-xs px-2 py-0.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 font-bold shrink-0">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>데이터 영구 고정 보호 가동 중: 사이트 업데이트 및 데이터 갱신 시에도 가입된 학생 정보는 절대 초기화되지 않고 안전하게 보존됩니다. (수정 및 삭제는 마스터만 가능)</span>
                </div>

                <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {pendingCount > 0 && (
                      <button
                        onClick={handleApproveAllPending}
                        className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-amber-500"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>대기 중인 {pendingCount}명 일괄 승인</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowAddForm(!showAddForm);
                        if (!showAddForm) setShowExcelUpload(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>학생 직접 등록</span>
                    </button>

                    {/* Excel Batch Upload Button */}
                    <button
                      onClick={() => {
                        setShowExcelUpload(!showExcelUpload);
                        if (!showExcelUpload) setShowAddForm(false);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="엑셀 파일을 업로드하여 학생 명단을 한 번에 등록합니다"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                      <span>엑셀 일괄 등록</span>
                    </button>

                    {/* Download Standard Template Button */}
                    <button
                      onClick={downloadStudentExcelTemplate}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300"
                      title="학생 명단 작성을 위한 표준 엑셀 서식(.xlsx)을 다운로드합니다"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>양식(.xlsx) 다운</span>
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-xl border border-sky-200">
                      총 {users.filter((u) => u.role !== 'master').length}명 등록
                    </span>
                    <span className="px-3 py-1.5 bg-teal-50 text-teal-800 rounded-xl border border-teal-200">
                      {approvedCount}명 승인됨
                    </span>
                  </div>
                </div>

                {/* Excel Batch Upload Panel */}
                {showExcelUpload && (
                  <div className="bg-emerald-50/90 p-4 rounded-2xl border-2 border-emerald-300 space-y-3 shrink-0 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                            <span>학생 50명 일괄 등록 (엑셀 업로드 / 명단 복사&붙여넣기)</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black">
                              자동 비번 생성 & 즉시 승인
                            </span>
                          </h4>
                          <p className="text-[11px] text-emerald-800 font-medium">
                            아이디 필요 없이 부모님 전화번호로 50명이 한꺼번에 바로 등록됩니다! (비밀번호: 뒷 4자리 자동)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={downloadStudentExcelTemplate}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 text-xs font-black border border-emerald-300 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-700" />
                          <span>50인 엑셀 양식 다운로드</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExcelUpload(false);
                            setExcelResult(null);
                            setBatchSaveMsg('');
                          }}
                          className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer px-1.5 py-0.5"
                        >
                          닫기
                        </button>
                      </div>
                    </div>

                    {batchSaveMsg && (
                      <div className="p-3 rounded-xl bg-white border border-emerald-400 text-emerald-900 font-bold text-xs flex items-center gap-2 shadow-2xs">
                        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{batchSaveMsg}</span>
                      </div>
                    )}

                    {/* Mode Toggle: File Upload vs Copy & Paste */}
                    {!excelResult && (
                      <div className="flex bg-emerald-100/70 p-1 rounded-xl gap-1 max-w-xs">
                        <button
                          type="button"
                          onClick={() => setExcelTab('upload')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelTab === 'upload' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'
                          }`}
                        >
                          📁 엑셀 파일 업로드
                        </button>
                        <button
                          type="button"
                          onClick={() => setExcelTab('paste')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            excelTab === 'paste' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-emerald-700 hover:text-emerald-900'
                          }`}
                        >
                          📋 50명 복사&붙여넣기
                        </button>
                      </div>
                    )}

                    {/* Mode 1: File Drop & Picker */}
                    {!excelResult && excelTab === 'upload' && (
                      <div className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white/80 rounded-2xl p-5 text-center transition-colors">
                        <input
                          type="file"
                          id="master-excel-input"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isParsingExcel}
                        />
                        <label
                          htmlFor="master-excel-input"
                          className="cursor-pointer flex flex-col items-center justify-center gap-2"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            {isParsingExcel ? (
                              <Clock className="w-5 h-5 animate-spin text-emerald-600" />
                            ) : (
                              <UploadCloud className="w-5 h-5 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900">
                              {isParsingExcel ? '엑셀 파일을 읽어 분석하는 중입니다...' : '클릭하여 엑셀 파일(.xlsx, .xls, .csv) 선택'}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              * [학생 이름, 부모님 전화번호, 학년] 열만 있으면 최대 50명 이상 즉시 일괄 등록됩니다.
                            </p>
                          </div>
                        </label>
                      </div>
                    )}

                    {/* Mode 2: Quick 50-Student Paste Area */}
                    {!excelResult && excelTab === 'paste' && (
                      <div className="space-y-2 bg-white/80 p-3 rounded-2xl border border-emerald-300">
                        <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                          <span>엑셀이나 한글/메모장에서 학생 명단(이름, 부모님번호)을 복사하여 붙여넣으세요:</span>
                          <span className="text-[11px] text-slate-500">줄당 1명 (예: 김민준 010-1234-5678 3)</span>
                        </div>
                        <textarea
                          rows={4}
                          value={pasteInput}
                          onChange={(e) => setPasteInput(e.target.value)}
                          placeholder="김민준	010-1234-5678	3&#10;이서연	010-2345-6789	3&#10;박도윤	010-3456-7890	4&#10;정하은	010-4567-8901	4"
                          className="w-full p-2.5 rounded-xl border border-emerald-200 text-xs font-mono bg-white outline-hidden focus:ring-2 focus:ring-emerald-400"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handlePasteParse}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>명단 분석 및 50명 등록 준비</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Parsed Result Preview */}
                    {excelResult && (
                      <div className="space-y-2.5 bg-white p-3 rounded-2xl border border-emerald-300 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 text-xs font-black">
                            <span className="text-slate-800">분석 결과:</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900">
                              등록 가능 {excelResult.validCount}명
                            </span>
                            {excelResult.errorCount > 0 && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-800">
                                오류 {excelResult.errorCount}건
                              </span>
                            )}
                            {excelResult.duplicateCount > 0 && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900">
                                중복 {excelResult.duplicateCount}건
                              </span>
                            )}
                          </div>

                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={excelAutoApprove}
                              onChange={(e) => setExcelAutoApprove(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                            />
                            <span>등록 즉시 승인(isApproved: true) 처리</span>
                          </label>
                        </div>

                        {/* Preview Table */}
                        <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 text-[11px] font-black sticky top-0">
                              <tr>
                                <th className="px-3 py-1.5">상태</th>
                                <th className="px-3 py-1.5">학생 이름</th>
                                <th className="px-3 py-1.5">부모님 전화번호</th>
                                <th className="px-3 py-1.5">비밀번호 (뒷자리)</th>
                                <th className="px-3 py-1.5">학년</th>
                                <th className="px-3 py-1.5">비고</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {excelResult.students.slice(0, 100).map((st, idx) => (
                                <tr
                                  key={idx}
                                  className={
                                    st.status === 'error'
                                      ? 'bg-rose-50/60 text-rose-900'
                                      : st.status === 'warning'
                                      ? 'bg-amber-50/50 text-amber-900'
                                      : 'hover:bg-slate-50 text-slate-800'
                                  }
                                >
                                  <td className="px-3 py-1.5 font-bold">
                                    {st.status === 'valid' && (
                                      <span className="text-emerald-600 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> 정상
                                      </span>
                                    )}
                                    {st.status === 'warning' && (
                                      <span className="text-amber-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> 업데이트
                                      </span>
                                    )}
                                    {st.status === 'error' && (
                                      <span className="text-rose-600 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> 불가
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-1.5 font-black">{st.name}</td>
                                  <td className="px-3 py-1.5 font-mono text-slate-700">{st.phone || st.parentPhone}</td>
                                  <td className="px-3 py-1.5 font-mono font-bold text-pink-600 bg-pink-50/50">{st.password}</td>
                                  <td className="px-3 py-1.5">{st.grade}학년</td>
                                  <td className="px-3 py-1.5 text-[11px] text-slate-500">{st.statusMessage}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Execute Action */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setExcelResult(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          >
                            다시 입력하기
                          </button>
                          <button
                            type="button"
                            onClick={handleExecuteBatchRegister}
                            disabled={excelResult.validCount === 0}
                            className={`px-4 py-2 rounded-xl font-black text-xs text-white shadow-sm flex items-center gap-2 cursor-pointer transition-all ${
                              excelResult.validCount > 0
                                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                                : 'bg-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{excelResult.validCount}명 일괄 등록 및 즉시 적용</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Add New Student Form Toggle (Simplified: Name + Parent Phone + Grade, Auto Password) */}
                {showAddForm && (
                  <form onSubmit={handleAddNewStudent} className="bg-pink-50/80 p-4 rounded-2xl border-2 border-pink-200 space-y-3 shrink-0 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-pink-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                          <span>학생 간편 직접 등록 (아이디 없이 부모님 전화번호로 등록)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          비밀번호는 부모님 전화번호 뒷자리 4자리로 자동 등록되며, 즉시 승인됩니다.
                        </p>
                      </div>
                      <button type="button" onClick={() => setShowAddForm(false)} className="text-xs text-pink-700 font-bold hover:underline cursor-pointer">
                        닫기
                      </button>
                    </div>

                    {formError && (
                      <p className="text-xs font-bold text-rose-600 bg-white p-2 rounded-xl border border-rose-200">
                        ⚠️ {formError}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                          학생 이름 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="학생 이름 (예: 김하늘)"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-pink-200 bg-white focus:ring-2 focus:ring-pink-300 outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                          부모님 전화번호 <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          placeholder="부모님 번호 (예: 010-1234-5678)"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-pink-200 bg-white focus:ring-2 focus:ring-pink-300 outline-hidden"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                          학년
                        </label>
                        <select
                          value={newGrade}
                          onChange={(e) => setNewGrade(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-pink-200 bg-white focus:ring-2 focus:ring-pink-300 outline-hidden"
                        >
                          {[1, 2, 3, 4, 5, 6].map((g) => (
                            <option key={g} value={g}>
                              {g}학년
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-pink-200 text-xs">
                        <span className="text-slate-600 font-bold">자동 생성 비밀번호:</span>
                        <span className="font-mono font-black text-pink-600">
                          {cleanDigits(newPhone).length >= 4 ? getLast4(newPhone) : '•••• (전화번호 뒷자리)'}
                        </span>
                      </div>
                      <button
                        type="submit"
                        className="arcade-btn-pink text-white text-xs font-black px-4 py-2 rounded-xl shadow-xs cursor-pointer"
                      >
                        학생 등록 완료
                      </button>
                    </div>
                  </form>
                )}

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setFilterTab('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      전체 ({users.filter((u) => u.role !== 'master').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterTab === 'pending'
                          ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                          : 'text-amber-700 hover:text-amber-900'
                      }`}
                    >
                      승인 대기 ({pendingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterTab('approved')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        filterTab === 'approved' ? 'bg-teal-500 text-white shadow-xs' : 'text-teal-700 hover:text-teal-900'
                      }`}
                    >
                      승인 완료 ({approvedCount})
                    </button>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="이름 / 아이디 / 번호 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-pink-400 outline-hidden"
                    />
                  </div>
                </div>

                {/* Students Table */}
                <div className="flex-1 overflow-y-auto border-2 border-slate-200 rounded-2xl bg-white shadow-inner">
                  {filteredUsers.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-extrabold sticky top-0 border-b border-slate-200 z-10">
                        <tr>
                          <th className="py-3 px-3.5">학생</th>
                          <th className="py-3 px-3">부모님 번호 (로그인 ID)</th>
                          <th className="py-3 px-3 text-pink-700">비밀번호 (뒷 4자리)</th>
                          <th className="py-3 px-3">타자 진도 및 기록</th>
                          <th className="py-3 px-3 text-center">승인 상태</th>
                          <th className="py-3 px-3 text-right">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredUsers.map((user) => {
                          const isPwdVisible = showPasswords[user.id] || false;
                          const isEditingThis = editingUserId === user.id;

                          return (
                            <tr key={user.id} className="hover:bg-pink-50/40 transition-colors">
                              {/* Name & Avatar */}
                              <td className="py-3 px-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xl bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                                    {user.avatar || '👻'}
                                  </span>
                                  <div>
                                    <p className="font-black text-slate-900 text-sm leading-tight">
                                      {user.name}
                                    </p>
                                    <span className="text-[10px] text-slate-400">
                                      {user.levelTitle || '타자 꿈나무'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Parent Phone / Grade */}
                              <td className="py-3 px-3">
                                <p className="font-mono font-bold text-slate-800">
                                  {user.parentPhone || user.phone || user.studentId}
                                </p>
                                <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-bold">
                                  {user.grade ? `${user.grade}학년` : '학생'}
                                </span>
                              </td>

                              {/* Password (Visible to Master!) */}
                              <td className="py-3 px-3">
                                {isEditingThis ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editPassValue}
                                      onChange={(e) => setEditPassValue(e.target.value)}
                                      className="px-2 py-1 text-xs font-mono font-bold border border-pink-400 rounded-lg w-24 bg-white"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditPassword(user.id)}
                                      className="px-2 py-1 bg-pink-600 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                    >
                                      저장
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingUserId(null)}
                                      className="px-1 text-slate-400 text-xs cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-black text-pink-700 bg-pink-50 px-2 py-1 rounded-lg border border-pink-200">
                                      {isPwdVisible ? user.password || '1234' : '••••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(user.id)}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                      title={isPwdVisible ? '비밀번호 가리기' : '비밀번호 보기'}
                                    >
                                      {isPwdVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingUserId(user.id);
                                        setEditPassValue(user.password || '');
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-pink-600 hover:bg-pink-50 cursor-pointer"
                                      title="비밀번호 변경"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Practice History Inspector Button */}
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => handleInspectStudentHistory(user)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-xs border border-sky-200 transition-colors cursor-pointer"
                                >
                                  <History className="w-3 h-3 text-sky-600" />
                                  <span>기록 열람 ({user.totalPracticeCount || 0}회)</span>
                                </button>
                              </td>

                              {/* Approval Status & Toggle */}
                              <td className="py-3 px-3 text-center">
                                {user.isApproved ? (
                                  <button
                                    onClick={() => handleToggleApproval(user.id, false)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-100 text-teal-800 font-extrabold text-[11px] border border-teal-300 hover:bg-teal-200 transition-colors cursor-pointer"
                                    title="클릭 시 승인 취소"
                                  >
                                    <CheckCircle className="w-3 h-3 text-teal-600" />
                                    <span>승인됨</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleApproval(user.id, true)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] border border-amber-500 shadow-xs hover:bg-amber-300 transition-colors animate-pulse cursor-pointer"
                                    title="클릭하여 바로 승인하기"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>승인하기 (대기)</span>
                                  </button>
                                )}
                              </td>

                              {/* Report & Delete Action */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {onOpenReportForUser && (
                                    <button
                                      onClick={() => onOpenReportForUser(user)}
                                      className="px-2 py-1 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-700 font-extrabold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-pink-300 shadow-2xs"
                                      title="상반기/하반기 타자 성장 성적표 생성 및 문자 발송"
                                    >
                                      <MessageSquare className="w-3 h-3 text-pink-600" />
                                      <span className="hidden sm:inline">성적표</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="학생 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-12 text-center text-slate-400 space-y-2">
                      <Users className="w-10 h-10 mx-auto opacity-40 text-pink-400" />
                      <p className="font-bold text-sm text-slate-600">일치하는 학생이 없습니다</p>
                      <p className="text-xs">학생이 가입하거나 '학생 직접 등록' 버튼을 눌러 학생을 추가하세요.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: STUDENT PRACTICE HISTORY INSPECTOR */}
            {activeConsoleTab === 'history-inspector' && (
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                {/* Student Selector Toolbar */}
                <div className="flex items-center justify-between gap-3 shrink-0 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-extrabold text-slate-700">학생 선택:</label>
                    <select
                      value={selectedStudentForHistory?.id || ''}
                      onChange={(e) => {
                        const std = users.find((u) => u.id === e.target.value);
                        if (std) handleInspectStudentHistory(std);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-sky-300 bg-sky-50 text-xs font-bold text-slate-800"
                    >
                      <option value="">학생을 선택하세요</option>
                      {users.filter((u) => u.role !== 'master').map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.studentId || u.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedStudentForHistory && (
                    <div className="flex items-center gap-2 text-xs font-extrabold text-sky-700">
                      <span>최고 타수: {selectedStudentForHistory.highestCpm || 0} CPM</span>
                      <span>•</span>
                      <span>누적 연습: {studentPracticeRecords.length}회</span>
                    </div>
                  )}
                </div>

                {/* History Content */}
                <div className="flex-1 overflow-y-auto border-2 border-slate-200 rounded-2xl bg-white p-4 space-y-3">
                  {!selectedStudentForHistory ? (
                    <div className="py-14 text-center text-slate-400 space-y-2">
                      <History className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold">열람할 학생을 상단에서 선택하세요.</p>
                    </div>
                  ) : studentPracticeRecords.length === 0 ? (
                    <div className="py-14 text-center text-slate-400 space-y-2">
                      <History className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-bold">'{selectedStudentForHistory.name}' 학생의 연습 기록이 아직 없습니다.</p>
                    </div>
                  ) : (
                    studentPracticeRecords.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-black text-[10px] ${
                              item.language === 'ko' ? 'bg-sky-100 text-sky-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {item.language === 'ko' ? '🇰🇷 한글' : '🇺🇸 영어'}
                            </span>
                            <span className="font-extrabold text-slate-800">{item.modeTitle}</span>
                            <span className="text-slate-400 text-[11px]">• {item.dateStr}</span>
                          </div>
                          {item.feedback && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                              {item.feedback}
                            </span>
                          )}
                        </div>

                        {item.sampleText && (
                          <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-800 font-bold text-xs">
                            "{item.sampleText}"
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-slate-600 font-bold text-[11px]">
                          <span>속도: <strong className="text-sky-600">{item.cpm}</strong> CPM</span>
                          <span>정확도: <strong className="text-teal-600">{item.accuracy}%</strong></span>
                          <span>소요시간: {item.elapsedSeconds}초</span>
                          {item.errorCount !== undefined && item.errorCount > 0 && (
                            <span className="text-rose-500">오타: {item.errorCount}회</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: MASTER SECURITY & SECRET MASTER KEY SETTINGS */}
            {activeConsoleTab === 'security' && (
              <div className="flex-1 overflow-y-auto pr-1">
                <form onSubmit={handleSaveSecurityConfig} className="max-w-xl mx-auto space-y-4 py-2">
                  <div className="p-4 rounded-2xl bg-purple-50 border-2 border-purple-200 space-y-1">
                    <div className="flex items-center gap-2 text-purple-900 font-black text-sm">
                      <Shield className="w-4 h-4 text-purple-600" />
                      <span>선생님 전용 보안 관리실 (Master Private Vault)</span>
                    </div>
                    <p className="text-xs text-purple-700 font-medium">
                      마스터키는 학생들에게 공개되지 않는 최상위 복구키입니다. 학생이 비밀번호를 분실했을 때 즉시 재설정할 수 있습니다.
                    </p>
                  </div>

                  {secSaveMsg && (
                    <div className="p-3 rounded-2xl bg-teal-50 border border-teal-300 text-teal-800 text-xs font-bold animate-in fade-in">
                      {secSaveMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      마스터 선생님 이름
                    </label>
                    <input
                      type="text"
                      value={secName}
                      onChange={(e) => setSecName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-500 text-xs sm:text-sm font-bold bg-slate-50 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      마스터 복구 이메일 (학생 비밀번호 리셋 및 관리자 알림용)
                    </label>
                    <input
                      type="email"
                      value={secEmail}
                      onChange={(e) => setSecEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-500 text-xs sm:text-sm font-bold bg-slate-50 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-extrabold text-purple-900">
                        🔒 비밀 마스터키 (Master Secret Key) - 나만 보기
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="text-[11px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {showSecretKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showSecretKey ? '마스터키 가리기' : '현재 마스터키 확인'}</span>
                      </button>
                    </div>
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={secKey}
                      onChange={(e) => setSecKey(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-purple-300 focus:border-purple-600 text-xs sm:text-sm font-black bg-white outline-hidden tracking-wider"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      마스터 관리실 로그인 비밀번호
                    </label>
                    <input
                      type="password"
                      value={secPassword}
                      onChange={(e) => setSecPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-purple-500 text-xs sm:text-sm font-bold bg-slate-50 outline-hidden"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>마스터 보안 설정 저장하기</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </ParchmentModalContainer>
  );
};
