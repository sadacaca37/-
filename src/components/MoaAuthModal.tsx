/**
 * 타자팡 들어가기 (모아팡과 같은 방식)
 *  - 학생: 방번호 + 이름 (모아팡에서 이미 들어왔으면 버튼 하나로)
 *  - 선생님: 모아팡 선생님 계정 비밀번호
 */
import React, { useEffect, useState } from 'react';
import { X, LogIn, Crown, ArrowLeft } from 'lucide-react';
import { UserSession } from '../types';
import { typangApi } from '../utils/apiClient';
import { enterByRoom, errText, getMoaSession, loadStudent, teacherResetMail, teacherSession, TEACHER_EMAIL, MoaSession } from '../utils/moaFirebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const MoaAuthModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [saved, setSaved] = useState<MoaSession | null>(null);
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [teacher, setTeacher] = useState(false);
  const [signup, setSignup] = useState(false);
  const [grade, setGrade] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const s = getMoaSession();
    setSaved(s);
    setRoom(s?.room || '');
    setName('');
    setPw('');
    setMsg('');
    setTeacher(false);
    let wantSignup = false;
    try {
      wantSignup = sessionStorage.getItem('taja_open_signup') === '1';
      sessionStorage.removeItem('taja_open_signup');
    } catch {}
    setSignup(wantSignup);
    setGrade(0);
  }, [isOpen]);

  if (!isOpen) return null;

  const run = async (f: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setMsg('');
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

  const quick = () => run(async () => done(await loadStudent(saved!)));

  const student = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup && !grade) return setMsg('학년을 골라 주세요.');
    run(async () => {
      const r = await enterByRoom(room.trim(), name, signup ? grade : 0);
      if (!r.ok || !r.user) return setMsg(r.message || '들어가지 못했어요.');
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
      setMsg(`${TEACHER_EMAIL} 메일로 비밀번호를 새로 정하는 링크를 보냈어요. (스팸함도 확인해 주세요)`);
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
              <h2 className="text-2xl font-black text-slate-900">{signup ? '✨ 타자팡 새로 가입하기' : '⌨️ 타자팡 들어가기'}</h2>
              <p className="text-sm font-bold text-slate-500 mt-1">
                {signup ? '방번호·이름·학년을 쓰면 가입 신청이 돼요. 선생님이 승인하면 포인트와 기록이 저장돼요.' : '모아팡과 같은 방번호와 이름으로 들어와요.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100" role="tablist">
              <button type="button" role="tab" aria-selected={!signup} onClick={() => { setSignup(false); setMsg(''); }} className={`py-2 rounded-xl font-black text-sm cursor-pointer ${!signup ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500'}`} data-testid="tab-enter">
                🔑 들어가기
              </button>
              <button type="button" role="tab" aria-selected={signup} onClick={() => { setSignup(true); setMsg(''); }} className={`py-2 rounded-xl font-black text-sm cursor-pointer ${signup ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`} data-testid="tab-signup">
                ✨ 새로 가입하기
              </button>
            </div>

            {saved && !signup && (
              <button
                type="button"
                onClick={quick}
                disabled={busy}
                className="w-full py-4 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 text-white font-black text-lg shadow-md flex items-center justify-center gap-2 cursor-pointer"
                data-testid="moa-quick"
              >
                <LogIn className="w-5 h-5" />
                {saved.className} · {saved.name} (으)로 들어가기
              </button>
            )}

            <form onSubmit={student} className="space-y-3">
              {saved && !signup && <div className="text-center text-xs font-bold text-slate-400">다른 이름이면 아래에 써 주세요</div>}
              <input
                value={room}
                onChange={(e) => setRoom(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                inputMode="numeric"
                placeholder="방번호 5자리"
                className={field}
                data-testid="moa-room"
                required
              />
              <input value={name} onChange={(e) => setName(e.target.value.slice(0, 10))} placeholder="내 이름" className={field} data-testid="moa-name" required />
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
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-black text-base shadow-md cursor-pointer"
                data-testid="moa-enter"
              >
                {busy ? (signup ? '가입하는 중…' : '들어가는 중…') : signup ? '가입 신청하고 들어가기' : '들어가기'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-black text-slate-900">👑 선생님 로그인</h2>
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

        {msg && <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold text-center" data-testid="moa-msg">{msg}</div>}

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm font-bold">
          <a href="../" className="flex items-center gap-1 text-slate-500 hover:text-sky-600">
            <ArrowLeft className="w-4 h-4" /> 모아팡으로
          </a>
          <button type="button" onClick={() => { setTeacher(!teacher); setMsg(''); }} className="flex items-center gap-1 text-slate-500 hover:text-pink-600 cursor-pointer">
            <Crown className="w-4 h-4" /> {teacher ? '학생으로 들어가기' : '선생님이에요'}
          </button>
        </div>
      </div>
    </div>
  );
};
