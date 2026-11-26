/**
 * 학생: [출석하기] (위 메뉴 단추 + 첫 화면 띠)
 *  - 하루에 한 번. 누르면 선생님 출석부(모아팡 문자함)에 올라가고, 선생님 문자함이 부모님께 출석 문자를 보냄
 */
import React, { useEffect, useState } from 'react';
import type { UserSession } from '../types';
import { attendNow, cachedAttend, loadAttend, timeText, type AttendInfo } from '../utils/attendance';

const isStudent = (u: UserSession | null) => !!u && u.role !== 'master';

function useAttend(u: UserSession | null): AttendInfo | null | undefined {
  const [info, setInfo] = useState(() => cachedAttend(u));
  useEffect(() => {
    if (!isStudent(u)) {
      setInfo(null);
      return;
    }
    const on = () => setInfo(cachedAttend(u));
    window.addEventListener('typang-attend-changed', on);
    if (cachedAttend(u) === undefined) loadAttend(u);
    else on();
    return () => window.removeEventListener('typang-attend-changed', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u?.id]);
  return info;
}

const smsLine = (st: string) =>
  st === 'delivered' || st === 'sent' || st === 'manual'
    ? '📱 부모님께 출석 문자도 갔어요.'
    : st === 'fail'
    ? '부모님 문자가 안 갔어요. 선생님께 말씀드려 주세요.'
    : st === 'nophone'
    ? '부모님 전화번호가 없어서 문자는 안 가요.'
    : '선생님 출석부에 올라갔어요.';

/* 출석 알림 창 (4초 뒤 저절로 닫힘) */
let showPop: ((p: { title: string; line: string; bad?: boolean }) => void) | null = null;
export const AttendPopup: React.FC = () => {
  const [p, setP] = useState<{ title: string; line: string; bad?: boolean } | null>(null);
  useEffect(() => {
    let t = 0;
    showPop = (x) => {
      setP(x);
      window.clearTimeout(t);
      t = window.setTimeout(() => setP(null), 4500);
    };
    return () => {
      showPop = null;
      window.clearTimeout(t);
    };
  }, []);
  if (!p) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 p-4" onClick={() => setP(null)} role="dialog" aria-modal="true" aria-label="출석">
      <div className={`w-[min(92vw,420px)] rounded-3xl border-4 bg-white px-6 py-6 text-center shadow-2xl ${p.bad ? 'border-rose-400' : 'border-emerald-400'}`}>
        <div className={`text-2xl sm:text-3xl font-black ${p.bad ? 'text-rose-700' : 'text-emerald-700'}`}>{p.title}</div>
        <div className="mt-3 text-base sm:text-lg font-bold text-slate-700">{p.line}</div>
        <button type="button" className="mt-5 rounded-2xl bg-slate-800 px-6 py-2.5 text-base font-black text-white" onClick={() => setP(null)}>
          확인
        </button>
      </div>
    </div>
  );
};

let busy = false;
async function onAttend(u: UserSession | null, info: AttendInfo | null | undefined) {
  if (busy) return;
  busy = true;
  try {
    if (info) {
      const now = (await loadAttend(u)) || info;
      showPop?.({ title: `✅ 오늘 ${timeText(now.at)}에 출석했어요`, line: smsLine(now.sms) });
      return;
    }
    const r = await attendNow(u);
    if (!r.ok) showPop?.({ title: '출석을 못 했어요', line: r.message || '잠시 뒤에 다시 눌러 주세요.', bad: true });
    else if (r.already) showPop?.({ title: `✅ 오늘 ${timeText(r.info!.at)}에 출석했어요`, line: smsLine(r.info!.sms) });
    else showPop?.({ title: `🎉 출석 완료! ${timeText(r.info!.at)}`, line: '선생님 출석부에 올라갔어요. 오늘도 신나게 타자 쳐요!' });
  } finally {
    busy = false;
  }
}

/** 위 메뉴 단추 */
export const AttendNavButton: React.FC<{ user: UserSession | null }> = ({ user }) => {
  const info = useAttend(user);
  if (!isStudent(user)) return null;
  const done = !!info;
  return (
    <button
      type="button"
      onClick={() => onAttend(user, info)}
      data-testid="nav-attend"
      className={`tp-nbtn relative px-2.5 sm:px-3 py-2 rounded-2xl text-xs font-black border-2 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
        done ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-500 animate-pulse'
      }`}
      title={done ? '오늘 출석했어요' : '눌러서 오늘 출석해요'}
    >
      <span>{done ? '✅' : '📋'}</span>
      <span className="hidden md:inline">{done ? '출석 완료' : '출석하기'}</span>
      <span className="md:hidden">{done ? '완료' : '출석'}</span>
    </button>
  );
};

/** 첫 화면 띠: 아직 출석 안 했을 때만 크게 */
export const AttendBanner: React.FC<{ user: UserSession | null }> = ({ user }) => {
  const info = useAttend(user);
  if (!isStudent(user) || info !== null) return null;
  return (
    <div
      data-testid="attend-banner"
      className="mx-auto mt-2 flex w-[min(96%,1100px)] flex-wrap items-center justify-center gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 px-4 py-2.5 text-center shadow-sm"
    >
      <span className="text-sm sm:text-base font-black text-amber-900">📋 {user!.name}, 오늘 왔으면 먼저 출석해요!</span>
      <button
        type="button"
        onClick={() => onAttend(user, null)}
        className="rounded-2xl border-2 border-amber-600 bg-amber-400 px-5 py-2 text-base sm:text-lg font-black text-amber-950 shadow-sm hover:bg-amber-300 active:scale-95"
      >
        출석하기 ✋
      </button>
    </div>
  );
};
