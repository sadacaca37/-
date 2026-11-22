/**
 * 선생님: 모아팡 반 학생 명단 (타자팡 기록 보기 · 백업)
 *  - 학생 추가·이름 고치기는 모아팡 선생님 화면에서 (여기서는 보기만)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { UserSession } from '../types';
import { typangApi } from '../utils/apiClient';
import { askConfirm } from '../utils/dialog';
import { FunfunFreePanel } from './FunfunFreePanel';
import { setApprovals } from '../utils/tajaApproval';
import { downloadMoaTemplate, readImportFile, importStudents } from '../utils/moaStudentImport';
import { fetchStudentFree, saveStudentFree, formatKDate } from '../utils/funfunFree';
import { readGiftTotals, sendGift } from '../utils/tajaGifts';
import { hasCheckPin, setCheckPin } from '../utils/teacherCheck';

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
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [freeMap, setFreeMap] = useState<Record<string, number>>({});
  const [giftTotals, setGiftTotals] = useState<Record<string, number>>({});
  const [giftP, setGiftP] = useState(500);
  const [giftNote, setGiftNote] = useState('');
  const [showPw, setShowPw] = useState(true);
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [newPin, setNewPin] = useState('');
  useEffect(() => {
    void hasCheckPin().then(setPinSet);
  }, []);
  const loadExtras = useCallback(() => {
    void fetchStudentFree().then(setFreeMap);
    void readGiftTotals().then(setGiftTotals);
  }, []);
  useEffect(() => loadExtras(), [loadExtras]);
  const toggle = (ids: string[], on: boolean) =>
    setSel((old) => {
      const n = new Set(old);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });
  const selUsers = users.filter((u) => sel.has(u.id));
  const selNames = selUsers.map((u) => u.name).slice(0, 6).join(', ') + (selUsers.length > 6 ? ` 외 ${selUsers.length - 6}명` : '');
  const todayEnd = () => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d.getTime();
  };
  const freeFor = async (until: number, label: string) => {
    if (!selUsers.length) return;
    if (until && !(await askConfirm(`${selNames}\n이 학생들에게 펀펀 플레이를 ${label} 무료로 열어 줄까요?`, '무료 개방'))) return;
    setBusy(true);
    const r = await saveStudentFree(selUsers.map((u) => u.id), until);
    setBusy(false);
    say(r.success ? (until ? `🎡 ${selUsers.length}명에게 ${label} 무료 개방! (${formatKDate(until)}까지)` : `🎡 ${selUsers.length}명의 무료 개방을 껐어요.`) : `❌ ${r.message}`);
    loadExtras();
  };
  const gift = async () => {
    if (!selUsers.length) return;
    const p = Math.round(giftP);
    if (!(await askConfirm(`${selNames}\n이 학생들에게 ${p.toLocaleString()}P씩 선물할까요?${giftNote ? `\n한마디: ${giftNote}` : ''}`, '선물 보내기'))) return;
    setBusy(true);
    const r = await sendGift(selUsers.map((u) => u.id), p, giftNote);
    setBusy(false);
    const pending = selUsers.filter((u) => !u.isApproved).length;
    say(r.success ? `🎁 ${selUsers.length}명에게 ${p.toLocaleString()}P씩 보냈어요. 학생 화면에 '선물 도착' 창이 떠요.${pending ? ` (승인 대기 ${pending}명은 승인된 뒤에 받아요)` : ''}` : `❌ ${r.message}`);
    if (r.success) setGiftNote('');
    loadExtras();
  };
  const pendingCount = users.filter((u) => u.role !== 'master' && !u.isApproved).length;
  const classNames = useMemo(() => [...new Set(users.filter((u) => u.role !== 'master').map((u) => u.studentId || '').filter(Boolean))], [users]);
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
          🏫 타자팡 회원은 <b>이름 + 전화번호 뒷자리 4자리</b>로 로그인해요. (가입할 때는 전화번호 전체) 학생이 [새로 가입하기]를 하면 아래에 <b>승인 대기</b>로 생기고, 선생님이 승인해야 로그인할 수 있어요. 엑셀로 올린 학생은 바로 승인돼요.
          <br />모아팡 방번호로 들어온 학생은 연습만 할 수 있고(저장 안 됨), 미니게임·놀이터는 회원 로그인 뒤에 할 수 있어요.
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
          <label className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`} data-testid="excel-upload">
            📥 엑셀로 학생 한꺼번에 올리기
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try {
                  const rows = await readImportFile(file);
                  if (!rows.length) return say("❌ 학생을 찾지 못했어요. 첫 줄에 '반 · 이름 · 학년 · 학부모 전화번호' 제목을 써 주세요. (양식 받기)");
                  if (!(await askConfirm(`엑셀에서 학생 ${rows.length}명을 읽었어요.\n모아팡 반에 넣고 바로 승인할까요?\n(이미 있는 학생은 학년·전화번호만 고쳐요)`, '올리기'))) return;
                  setBusy(true);
                  say('⏳ 올리는 중이에요…');
                  const r = await importStudents(rows, classNames.length === 1 ? classNames[0] : '');
                  setBusy(false);
                  say(`✅ 새 학생 ${r.created}명, 고친 학생 ${r.updated}명 (모두 승인됨)${r.skipped.length ? ` · 못 넣은 줄 ${r.skipped.length}개: ${r.skipped.slice(0, 5).join(', ')}${r.skipped.length > 5 ? ' …' : ''}` : ''}`);
                  void onRefresh();
                } catch {
                  setBusy(false);
                  say('❌ 엑셀 파일을 읽지 못했어요. 양식을 받아서 채워 주세요.');
                }
              }}
            />
          </label>
          <button type="button" className={`${btn} bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50`} onClick={() => void downloadMoaTemplate(classNames)}>
            📄 엑셀 양식 받기
          </button>
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

      {/* 낱말 연습 운지법 검사: 학생 화면에 선생님이 넣는 확인 번호 */}
      <form
        className="shrink-0 px-3.5 py-2.5 rounded-xl bg-rose-50 border-2 border-rose-200 text-rose-950 text-xs font-bold flex flex-wrap items-center gap-2"
        data-testid="check-pin"
        onSubmit={async (e) => {
          e.preventDefault();
          const r = await setCheckPin(newPin);
          if (r.success) {
            setPinSet(true);
            setNewPin('');
            say('🔢 선생님 확인 번호를 저장했어요. 학생 화면 운지법 검사 때 이 번호를 넣어 주세요.');
          } else say(`❌ ${r.message}`);
        }}
      >
        <span>🔢 선생님 확인 번호 (낱말 연습 운지법 검사 → 마이쮸):</span>
        <span className={pinSet ? 'text-emerald-700' : 'text-rose-600'}>{pinSet === null ? '' : pinSet ? '✅ 정해 둠' : '⚠️ 아직 없음 — 꼭 정해 주세요'}</span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="숫자 4~6자리"
          className="w-28 px-2 py-1 rounded border border-rose-300 text-center tracking-widest"
        />
        <button type="submit" disabled={newPin.length < 4} className={`${btn} bg-rose-500 text-white hover:bg-rose-400 disabled:opacity-40`}>
          {pinSet ? '번호 바꾸기' : '번호 정하기'}
        </button>
      </form>

      <div className="shrink-0 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 찾기" className="w-full max-w-xs px-3 py-2 rounded-xl border-2 border-slate-200 text-sm font-bold" />
        <label className="flex items-center gap-1 text-xs font-bold text-slate-600 cursor-pointer">
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} data-testid="show-pw" />
          🔑 비밀번호 보이기
        </label>
      </div>

      {/* 학생을 골라서: 포인트 선물 · 펀펀 플레이 무료 개방 */}
      <div className={`shrink-0 px-3.5 py-2.5 rounded-xl border-2 text-xs font-bold flex flex-wrap items-center gap-2 ${sel.size ? 'bg-violet-50 border-violet-300 text-violet-950' : 'bg-slate-50 border-slate-200 text-slate-500'}`} data-testid="select-bar">
        <span className="font-black">☑️ 고른 학생 {sel.size}명</span>
        {!sel.size && <span>아래 명단에서 학생 앞 네모 칸을 눌러 고르면 포인트 선물·무료 개방을 할 수 있어요.</span>}
        {sel.size > 0 && (
          <>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-amber-200">
              🎁
              <input type="number" min={1} max={100000} step={100} value={giftP} onChange={(e) => setGiftP(Number(e.target.value))} className="w-20 px-1.5 py-1 rounded border border-amber-200 text-right" data-testid="gift-points" />
              P
              <input value={giftNote} onChange={(e) => setGiftNote(e.target.value.slice(0, 40))} placeholder="한마디 (선택)" className="w-32 px-1.5 py-1 rounded border border-amber-200" />
              <button type="button" disabled={busy || giftP <= 0} className={`${btn} bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-40`} onClick={() => void gift()} data-testid="gift-send">
                포인트 선물
              </button>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-pink-200">
              🎡 무료 개방
              <button type="button" disabled={busy} className={`${btn} bg-pink-500 text-white hover:bg-pink-400`} onClick={() => void freeFor(todayEnd(), '오늘 하루')} data-testid="free-today">
                오늘 하루
              </button>
              <button type="button" disabled={busy} className={`${btn} bg-fuchsia-500 text-white hover:bg-fuchsia-400`} onClick={() => void freeFor(Date.now() + 3600000, '지금부터 1시간')}>
                1시간
              </button>
              <button type="button" disabled={busy} className={`${btn} bg-white border border-pink-300 text-pink-700 hover:bg-pink-50`} onClick={() => void freeFor(0, '')}>
                끄기
              </button>
            </span>
            <button type="button" className={`${btn} bg-white border border-slate-300 text-slate-600 hover:bg-slate-100`} onClick={() => setSel(new Set())}>
              고르기 풀기
            </button>
          </>
        )}
      </div>

      <div className="flex-1 min-h-0 max-h-[56vh] overflow-y-auto space-y-4 pr-1 rounded-xl bg-white/95">
        {!groups.length && <div className="py-10 text-center text-sm font-bold text-slate-400">아직 학생이 없어요. 학생이 모아팡에 들어오면 생겨요.</div>}
        {groups.map(([cls, list]) => (
          <section key={cls}>
            <h3 className="text-sm font-black text-slate-800 mb-1.5 flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="w-4 h-4" checked={list.every((u) => sel.has(u.id))} onChange={(e) => toggle(list.map((u) => u.id), e.target.checked)} title="이 반 모두 고르기" />
                {cls}
              </label>
              <span className="text-slate-400">({list.length}명)</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-xs bg-white">
                <thead className="bg-slate-50 text-slate-500 font-black">
                  <tr>
                    <th className="px-2 py-2 w-8"></th>
                    <th className="px-3 py-2">승인</th>
                    <th className="px-3 py-2 text-left">이름</th>
                    <th className="px-3 py-2">학년</th>
                    <th className="px-3 py-2">🔑 비밀번호(전화 뒷자리)</th>
                    <th className="px-3 py-2">최고 타수</th>
                    <th className="px-3 py-2">연습</th>
                    <th className="px-3 py-2">마지막</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u) => (
                    <tr key={u.id} className={`border-t border-slate-100 font-bold text-slate-700 ${sel.has(u.id) ? 'bg-violet-50' : u.isApproved ? '' : 'bg-amber-50/70'}`}>
                      <td className="px-2 py-1.5 text-center">
                        <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={sel.has(u.id)} onChange={(e) => toggle([u.id], e.target.checked)} data-testid="pick-one" aria-label={`${u.name} 고르기`} />
                      </td>
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
                          <span className="inline-flex gap-1">
                            <button type="button" disabled={busy} className={`${btn} bg-amber-500 text-white hover:bg-amber-400`} onClick={() => void approve([u.id], true)} data-testid="approve-one">
                              승인하기
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              className={`${btn} bg-white border border-rose-200 text-rose-600 hover:bg-rose-50`}
                              onClick={async () => {
                                if (!(await askConfirm(`'${u.name}' 학생의 가입 신청을 거절(삭제)할까요?`, '거절'))) return;
                                say((await typangApi.removeMember(u.id)) ? `🗑️ ${u.name} 학생의 가입 신청을 지웠어요.` : '❌ 지우지 못했어요.');
                                void onRefresh();
                              }}
                            >
                              거절
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        {u.avatar} {u.name}
                        {freeMap[u.id] > Date.now() && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-pink-100 text-pink-700 text-[10px] whitespace-nowrap" title={`${formatKDate(freeMap[u.id])}까지`}>
                            🎡 무료
                          </span>
                        )}
                        {giftTotals[u.id] > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] whitespace-nowrap" title="최근 넉 달 동안 선물한 포인트">
                            🎁 {giftTotals[u.id].toLocaleString()}P
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-center">{u.grade ? `${u.grade}학년` : '-'}</td>
                      <td className="px-3 py-1.5 text-center whitespace-nowrap">
                        {u.parentPhone ? (
                          showPw ? (
                            <span data-testid="pw-cell">
                              <b className="text-base font-mono text-rose-700 tracking-widest select-all">{u.parentPhone.replace(/[^0-9]/g, '').slice(-4)}</b>
                              <span className="ml-1.5 text-[10px] text-slate-400 font-mono">{u.parentPhone}</span>
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400" data-testid="pw-cell">••••</span>
                          )
                        ) : (
                          '-'
                        )}
                      </td>
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
