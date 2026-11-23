/**
 * 타자팡 로그인 · 새로 가입하기
 *  - 학생: 이름 + 전화번호로 로그인 (선생님이 승인한 회원만)
 *  - 새로 가입하기: 이름 + 전화번호 + 학년 → 선생님(마스터) 승인 대기
 *  - 선생님: 모아팡 선생님 계정 비밀번호
 *  - 모아팡에서 방번호로 들어오면 로그인 없이 연습은 할 수 있고, 미니게임·놀이터·기록 저장은 로그인 뒤에
 */
import React, { useEffect, useState } from 'react';
import { LogIn, Crown, ArrowLeft } from 'lucide-react';
import { WoodDialog } from './WoodDialog';
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
        setOkMsg(`${r.message} 승인되면 이름과 전화번호 뒷자리 4자리로 로그인해요.`);
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

  const title = teacher ? '선생님(마스터) 로그인' : signup ? '타자팡 새로 가입하기' : '타자팡 로그인';
  const icon = teacher ? '👑' : signup ? '✨' : '⌨️';

  return (
    <WoodDialog title={title} icon={icon} onClose={onClose} testId="moa-auth">
      {!teacher ? (
        <>
          <p className="wd-lead">
            {signup ? '이름·전화번호·학년을 쓰면 가입 신청이 돼요. 선생님이 승인하면 로그인할 수 있어요.' : '이름과 전화번호 뒷자리 4자리로 로그인해요. 로그인하면 기록이 저장되고 미니게임·놀이터를 할 수 있어요.'}
          </p>

          <div className="wd-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={!signup} onClick={() => { setSignup(false); setMsg(''); }} className={`wd-tab ${!signup ? 'is-on' : ''}`} data-testid="tab-enter">
              🔑 로그인
            </button>
            <button type="button" role="tab" aria-selected={signup} onClick={() => { setSignup(true); setMsg(''); setOkMsg(''); }} className={`wd-tab ${signup ? 'is-on' : ''}`} data-testid="tab-signup">
              ✨ 새로 가입하기
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <input value={name} onChange={(e) => setName(e.target.value.slice(0, 10))} placeholder="이름" className="wd-input" data-testid="moa-name" autoComplete="name" required />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9-]/g, '').slice(0, 13))}
              inputMode="tel"
              placeholder={signup ? '전화번호 (010-0000-0000)' : '전화번호 뒷자리 4자리'}
              className="wd-input"
              data-testid="moa-phone"
              autoComplete="tel"
              required
            />
            {signup && (
              <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="학년">
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <button key={g} type="button" role="radio" aria-checked={grade === g} onClick={() => setGrade(g)} className={`wd-pick ${grade === g ? 'is-on' : ''}`}>
                    {g}학년
                  </button>
                ))}
              </div>
            )}
            <button type="submit" disabled={busy} className={`wd-btn wd-btn--block ${signup ? 'wd-btn--green' : 'wd-btn--sky'}`} data-testid="moa-enter">
              {!signup && <LogIn className="w-5 h-5" />}
              {busy ? '확인하는 중…' : signup ? '가입 신청하기' : '로그인'}
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="wd-lead">모아팡 선생님 계정 비밀번호를 써 주세요.</p>
          <form onSubmit={master} className="flex flex-col gap-2.5">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" className="wd-input" autoComplete="current-password" required autoFocus />
            <button type="submit" disabled={busy} className="wd-btn wd-btn--block wd-btn--pink">
              {busy ? '확인하는 중…' : '로그인'}
            </button>
          </form>
          <button type="button" onClick={reset} disabled={busy} className="wd-link mx-auto underline">
            비밀번호를 잊었어요
          </button>
        </>
      )}

      {okMsg && <div className="wd-note wd-note--ok" data-testid="moa-ok">{okMsg}</div>}
      {msg && <div className="wd-note wd-note--warn" data-testid="moa-msg">{msg}</div>}

      <div className="wd-foot">
        <a href="../" className="wd-link">
          <ArrowLeft className="w-4 h-4" /> 모아팡으로
        </a>
        <button type="button" onClick={() => { setTeacher(!teacher); setMsg(''); setOkMsg(''); }} className="wd-link">
          <Crown className="w-4 h-4" /> {teacher ? '학생으로 돌아가기' : '선생님이에요'}
        </button>
      </div>
    </WoodDialog>
  );
};
