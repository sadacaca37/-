import React, { useState } from "react";
import { User, LogIn, UserPlus, LogOut, CheckCircle, Database, ShieldCheck, X } from "lucide-react";
import { authService } from "../game/AuthService";
import { UserAccount } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onUserChanged: (user: UserAccount | null) => void;
  onAutoSaveRequested?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onAutoSaveRequested,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        const res = await authService.register(username, password);
        if (res.success && res.user) {
          onUserChanged(res.user);
          onClose();
        } else {
          setError(res.error || "회원가입 실패");
        }
      } else {
        const res = await authService.login(username, password);
        if (res.success && res.user) {
          onUserChanged(res.user);
          onClose();
        } else {
          setError(res.error || "로그인 실패");
        }
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onUserChanged(null);
  };

  const handleManualSave = () => {
    if (onAutoSaveRequested) {
      onAutoSaveRequested();
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2500);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="auth-modal-content"
        className="w-full max-w-md bg-stone-900 border-2 border-stone-700 rounded-xl p-6 shadow-2xl text-stone-100 flex flex-col gap-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
        >
          <X size={20} />
        </button>

        {currentUser ? (
          // Logged in View
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  {currentUser.username}
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                    로그인됨
                  </span>
                </h3>
                <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                  <Database size={12} className="text-emerald-400" />
                  이 컴퓨터에 자동 저장 중
                </p>
              </div>
            </div>

            <div className="bg-stone-950/60 rounded-lg p-3.5 border border-stone-800 text-xs text-stone-300 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-400">데이터베이스 연동:</span>
                <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                  <CheckCircle size={13} /> 이 컴퓨터(브라우저)에 저장
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">저장 항목:</span>
                <span className="text-stone-200">설치/파괴 블록 좌표, 인벤토리, 체력, 위치</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-400">자동 저장 주기:</span>
                <span className="text-stone-200">블록 상호작용 시 실시간 + 5초 주기</span>
              </div>
            </div>

            {saveSuccessNotice && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle size={15} />
                플레이어 데이터와 맵 블록이 이 컴퓨터에 저장되었습니다!
              </div>
            )}

            <div className="flex gap-2.5 mt-2">
              <button
                id="manual-save-btn"
                type="button"
                onClick={handleManualSave}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Database size={16} />
                지금 즉시 저장
              </button>
              <button
                id="auth-logout-btn"
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-4 bg-stone-800 hover:bg-red-950 hover:text-red-300 text-stone-300 text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition border border-stone-700"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          // Login / Register Form
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="border-b border-stone-800 pb-2">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                {isRegisterMode ? "새 모험가 계정 생성 (회원가입)" : "모험가 로그인"}
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                아이디/비밀번호로 로그인하면 맵 블록 설치/파괴 내역과 인벤토리 소지품이 이 컴퓨터에 저장됩니다. (타자팡팡에 로그인하면 자동으로 내 이름으로 저장돼요)
              </p>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-lg text-xs text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">아이디</label>
              <input
                id="auth-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="예: Steve, Alex"
                required
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-stone-300">비밀번호</label>
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 4자 이상"
                required
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition mt-2 disabled:opacity-50"
            >
              {loading ? (
                <span>처리 중...</span>
              ) : isRegisterMode ? (
                <>
                  <UserPlus size={16} /> 회원가입 후 자동 로그인
                </>
              ) : (
                <>
                  <LogIn size={16} /> 로그인 및 데이터 불러오기
                </>
              )}
            </button>

            <div className="text-center mt-1">
              <button
                id="auth-toggle-mode-btn"
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError(null);
                }}
                className="text-xs text-stone-400 hover:text-emerald-400 underline transition"
              >
                {isRegisterMode
                  ? "이미 계정이 있으신가요? 기존 계정으로 로그인"
                  : "계정이 없으신가요? 새 계정 만들기 (회원가입)"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
