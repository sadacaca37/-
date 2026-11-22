/**
 * 타자팡 로그인 · 새로 가입하기
 *  - 학생: 이름 + 전화번호로 로그인 (선생님이 승인한 회원만)
 *  - 새로 가입하기: 이름 + 전화번호 + 학년 → 선생님(마스터) 승인 대기
 *  - 선생님: 모아팡 선생님 계정 비밀번호
 *  - 모아팡에서 방번호로 들어오면 로그인 없이 연습은 할 수 있고, 미니게임·놀이터·기록 저장은 로그인 뒤에
 */
import React, { useEffect, useState } from 'react';
import { X, LogIn, Crown, ArrowLeft } from 'lucide-react';
import { UserSession } from '../types';
import { typangApi } from '../utils/apiClient';
import { errText, loginMember, signupMember, teacherResetMail, teacherSession, TEACHER_EMAIL } from '../utils/moaFirebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

const LAST_NAME = 'taja_last_login_name';

export const MoaAuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [teacher, setTeacher] = useState(false);
  const [signup, setSignup] = useState(false);
  const [grade, setGrade] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let wantSignup = false;
    try {
      wantSignup = sessionStorage.getItem('taja_open_signup') === '1';
      sessionStorage.removeItem('taja_open_signup');
      setName(localStorage.getItem(LAST_NAME) || '');
    } catch {
      setName('');
    }
    setPhone('');
    setPw('');
    setMsg('');
    setOkMsg('');
    setTeacher(false);
    setSignup(wantSignup);
    setGrade(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMsg('');
    setOkMsg('');
    try {
      await f();
    } catch (e) {
      setMsg(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const done = (u: UserSession) => {
    onLoginSuccess(u);
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup && !grade) return setMsg('학년을 골라 주세요.');
    run(async () => {
      if (signup) {
        const r = await signupMember(name, phone, grade);
        if (!r.ok) return setMsg(r.message);
        setOkMsg(r.message);
        setSignup(false);
        setPhone('');
        return;
      }
      const r = await loginMember(name, phone);
      if (!r.ok || !r.user) return setMsg(r.message || '로그인하지 못했어요.');
      try {
        localStorage.setItem(LAST_NAME, r.user.name);
      } catch {}
      done(r.user);
    });
  };

  const master = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const r = await typangApi.masterLogin(pw);
      setPw('');
      if (!r.success) return setMsg(r.message || '비밀번호가 맞지 않아요.');
      done(teacherSession());
    });
  };

  const reset = () =>
    run(async () => {
      await teacherResetMail();
      setOkMsg(`${TEACHER_EMAIL} 메일로 비밀번호를 새로 정하는 링크를 보냈어요. (스팸함도 확인해 주세요)`);
    });

  const field = 'w-full px-4 py-3 rounded-2xl border-2 border-sky-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-100 text-lg font-black bg-sky-50/60 outline-hidden';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4" data-testid="moa-auth">
      <div className="relative w-full max-w-md rounded-3xl bg-white border-4 border-sky-300 shadow-2xl p-6 space-y-4">
        <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer" title="닫기">
          <X className="w-5 h-5" />
        </button>

        {!teacher ? (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">{signup ? '✨ 타자팡 새로 가입하기' : '⌨️ 타자팡 로그인'}</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">
                {signup ? '이름·전화번호·학년을 쓰면 가입 신청이 돼요. 선생님이 승인하면 로그인할 수 있어요.' : '이름과 전화번호로 로그인해요. 로그인하면 기록이 저장되고 미니게임·놀이터를 할 수 있어요.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100" role="tablist">
              <button type="button" role="tab" aria-selected={!signup} onClick={() => { setSignup(false); setMsg(''); }} className={`py-2 rounded-xl font-black text-sm cursor-pointer ${!signup ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`} data-testid="tab-enter">
                🔑 로그인
              </button>
              <button type="button" role="tab" aria-selected={signup} onClick={() => { setSignup(true); setMsg(''); setOkMsg(''); }} className={`py-2 rounded-xl font-black text-sm cursor-pointer ${signup ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`} data-testid="tab-signup">
                ✨ 새로 가입하기
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 10))} placeholder="이름" className={field} data-testid="moa-name" autoComplete="name" required />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, '').slice(0, 13))}
                inputMode="tel"
                placeholder="전화번호 (010-0000-0000)"
                className={field}
                data-testid="moa-phone"
                autoComplete="tel"
                required
              />
              {signup && (
                <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="학년">
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <button
                      key={g}
                      type="button"
                      role="radio"
                      aria-checked={grade === g}
                      onClick={() => setGrade(g)}
                      className={`py-2.5 rounded-xl border-2 font-black text-sm cursor-pointer ${grade === g ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'}`}
                    >
                      {g}학년
                    </button>
                  ))}
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className={`w-full py-3.5 rounded-2xl ${signup ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-sky-500 hover:bg-sky-600'} disabled:bg-slate-300 text-white font-black text-base shadow-md cursor-pointer flex items-center justify-center gap-2`}
                data-testid="moa-enter"
              >
                {!signup && <LogIn className="w-5 h-5" />}
                {busy ? '확인하는 중…' : signup ? '가입 신청하기' : '로그인'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">👑 선생님(마스터) 로그인</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">모아팡 선생님 계정 비밀번호를 써 주세요.</p>
            </div>
            <form onSubmit={master} className="space-y-3">
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" className={field} autoComplete="current-password" required autoFocus />
              <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-pink-500 hover:bg-pink-600 disabled:bg-slate-300 text-white font-black text-base shadow-md cursor-pointer">
                {busy ? '확인하는 중…' : '로그인'}
              </button>
            </form>
            <button type="button" onClick={reset} disabled={busy} className="block mx-auto text-sm font-bold text-pink-600 underline cursor-pointer">
              비밀번호를 잊었어요
            </button>
          </>
        )}

        {okMsg && <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold text-center" data-testid="moa-ok">{okMsg}</div>}
        {msg && <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold text-center" data-testid="moa-msg">{msg}</div>}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-bold">
          <a href="../" className="flex items-center gap-1 text-slate-500 hover:text-sky-600">
            <ArrowLeft className="w-4 h-4" /> 모아팡으로
          </a>
          <button type="button" onClick={() => { setTeacher(!teacher); setMsg(''); setOkMsg(''); }} className="flex items-center gap-1 text-slate-500 hover:text-pink-600 cursor-pointer">
            <Crown className="w-4 h-4" /> {teacher ? '학생으로 돌아가기' : '선생님이에요'}
          </button>
        </div>
      </div>
    </div>
  );
};
