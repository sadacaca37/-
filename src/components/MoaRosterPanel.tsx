/**
 * 선생님: 모아팡 반 학생 명단 (타자팡 기록 보기 · 백업)
 *  - 학생 추가·이름 고치기는 모아팡 선생님 화면에서 (여기서는 보기만)
 */
import React, { useMemo, useState } from 'react';
import { UserSession } from '../types';
import { typangApi } from '../utils/apiClient';
import { askConfirm } from '../utils/dialog';
import { FunfunFreePanel } from './FunfunFreePanel';
import { setApprovals } from '../utils/tajaApproval';

interface Props {
  users: UserSession[];
  onRefresh: () => Promise<unknown>;
  onInspect: (u: UserSession) => void;
  onReport: (u: UserSession) => void;
}

export const MoaRosterPanel: React.FC<Props> = ({ users, onRefresh, onInspect, onReport }) => {
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingCount = users.filter((u) => u.role !== 'master' && !u.isApproved).length;
  const approve = async (ids: string[], on: boolean) => {
    setBusy(true);
    const ok = await setApprovals(ids, on);
    setBusy(false);
    say(ok ? (on ? `✅ ${ids.length}명을 승인했어요. 이제 포인트·기록이 저장돼요.` : '승인을 풀었어요. 이 학생은 이제 저장되지 않아요.') : '❌ 저장하지 못했어요. 선생님 계정으로 다시 로그인해 주세요.');
    void onRefresh();
  };
  const say = (m: string) => {
    setMsg(m);
    window.setTimeout(() => setMsg(''), 9000);
  };

  const groups = useMemo(() => {
    const map = new Map<string, UserSession[]>();
    for (const u of users) {
      if (u.role === 'master') continue;
      if (q && !u.name.includes(q.trim())) continue;
      if (onlyPending && u.isApproved) continue;
      const k = u.studentId || '반 없음';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(u);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [users, q, onlyPending]);

  const btn = 'px-3 py-1.5 rounded-lg text-[12px] font-black cursor-pointer';

  return (
    <div className="flex-1 flex flex-col space-y-3 overflow-hidden" data-testid="moa-roster">
      <div className="px-3.5 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs font-bold shrink-0 space-y-2">
        <div>
          🏫 학생은 모아팡 반 학생 그대로예요. 학생이 모아팡 첫 화면에서 <b>방번호 + 이름</b>으로 들어오면 여기에 저절로 생겨요. 반 만들기·이름 고치기는{' '}
          <a href="../teacher.html" className="underline text-sky-700">
            모아팡 선생님 화면
          </a>
          에서 해 주세요.
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`${btn} bg-emerald-700 text-white hover:bg-emerald-600`}
            data-testid="download-backup"
            onClick={async () => say((await typangApi.downloadBackup()) ? '✅ 전체 백업 파일을 받았어요. (학생 기록·명예의 전당·보고)' : '❌ 받지 못했어요. 다시 로그인해 주세요.')}
          >
            💾 전체 백업 받기
          </button>
          <label className={`${btn} bg-amber-600 text-white hover:bg-amber-500`}>
            ♻️ 예전 백업에서 명예의 전당·보고 가져오기
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              data-testid="restore-backup"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                if (!(await askConfirm(`'${file.name}' 백업의 명예의 전당 기록과 받은 보고를 합칠까요?\n(지금 기록은 지워지지 않아요)`, '합치기'))) return;
                try {
                  const r = await typangApi.restoreBackup(JSON.parse(await file.text()));
                  say(r.success ? `✅ ${r.message || '합쳤어요.'}` : `❌ ${r.message}`);
                } catch {
                  say('❌ 백업 파일을 읽지 못했어요. 받은 파일 그대로 올려 주세요.');
                }
              }}
            />
          </label>
          <button type="button" className={`${btn} bg-white border border-slate-300 text-slate-700 hover:bg-slate-100`} onClick={() => void onRefresh()}>
            🔄 새로 고침
          </button>
        </div>
        {msg && <div className="text-[12px]">{msg}</div>}
      </div>

      <FunfunFreePanel />

      {/* 승인: 승인한 학생만 아이디·포인트·기록이 저장됨 (Firebase 에 남아 업데이트해도 그대로) */}
      <div className="shrink-0 px-3.5 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-bold flex flex-wrap items-center gap-2" data-testid="approval-bar">
        <span>
          ✅ 승인한 학생만 아이디·포인트·기록이 저장돼요. 승인 전 학생도 타자는 칠 수 있어요. 지금 <b>승인 대기 {pendingCount}명</b>
        </span>
        <button
          type="button"
          className={`${btn} bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-40`}
          disabled={!pendingCount || busy}
          onClick={async () => {
            const ids = users.filter((u) => u.role !== 'master' && !u.isApproved).map((u) => u.id);
            if (!(await askConfirm(`승인 대기 학생 ${ids.length}명을 모두 승인할까요?`, '모두 승인'))) return;
            await approve(ids, true);
          }}
        >
          대기 학생 모두 승인
        </button>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} />
          승인 대기만 보기
        </label>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 찾기" className="shrink-0 w-full max-w-xs px-3 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold" />

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {!groups.length && <div className="py-10 text-center text-sm font-bold text-slate-400">아직 학생이 없어요. 학생이 모아팡에 들어오면 생겨요.</div>}
        {groups.map(([cls, list]) => (
          <section key={cls}>
            <h3 className="text-sm font-black text-slate-800 mb-1.5">
              {cls} <span className="text-slate-400">({list.length}명)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 font-black">
                  <tr>
                    <th className="px-3 py-2">승인</th>
                    <th className="px-3 py-2 text-left">이름</th>
                    <th className="px-3 py-2">학년</th>
                    <th className="px-3 py-2">최고 타수</th>
                    <th className="px-3 py-2">연습</th>
                    <th className="px-3 py-2">마지막</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className={`border-t border-slate-100 font-bold text-slate-700 ${u.isApproved ? '' : 'bg-amber-50/70'}`}>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        {u.isApproved ? (
                          <button
                            type="button"
                            disabled={busy}
                            title="누르면 승인을 풀어요"
                            className={`${btn} bg-emerald-100 text-emerald-800 hover:bg-emerald-200`}
                            onClick={async () => {
                              if (!(await askConfirm(`'${u.name}' 학생의 승인을 풀까요?\n풀면 이 학생의 포인트·기록이 더 이상 저장되지 않아요. (지금까지 저장된 것은 그대로)`, '승인 풀기'))) return;
                              await approve([u.id], false);
                            }}
                          >
                            ✅ 승인됨
                          </button>
                        ) : (
                          <button type="button" disabled={busy} className={`${btn} bg-amber-500 text-white hover:bg-amber-400`} onClick={() => void approve([u.id], true)} data-testid="approve-one">
                            승인하기
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {u.avatar} {u.name}
                      </td>
                      <td className="px-3 py-1.5 text-center">{u.grade ? `${u.grade}학년` : '-'}</td>
                      <td className="px-3 py-1.5 text-center">{u.highestCpm || '-'}</td>
                      <td className="px-3 py-1.5 text-center">{u.totalPracticeCount || 0}번</td>
                      <td className="px-3 py-1.5 text-center">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : '-'}</td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap space-x-1">
                        <button type="button" className={`${btn} bg-sky-100 text-sky-800 hover:bg-sky-200`} onClick={() => onInspect(u)}>
                          학습 현황
                        </button>
                        <button type="button" className={`${btn} bg-violet-100 text-violet-800 hover:bg-violet-200`} onClick={() => onReport(u)}>
                          성적표
                        </button>
                        <button
                          type="button"
                          className={`${btn} bg-rose-50 text-rose-700 hover:bg-rose-100`}
                          onClick={async () => {
                            if (!(await askConfirm(`'${u.name}' 학생의 타자팡 기록(포인트·연습 기록)을 지울까요?\n모아팡 이름·캐릭터는 그대로예요. 되돌릴 수 없어요.`, '지우기'))) return;
                            say((await typangApi.deleteUser(u.id)) ? `🗑️ ${u.name} 학생의 타자 기록을 지웠어요.` : '❌ 지우지 못했어요.');
                            void onRefresh();
                          }}
                        >
                          기록 지우기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
