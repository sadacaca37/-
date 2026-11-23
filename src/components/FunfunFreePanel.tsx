import React, { useEffect, useState } from 'react';
import { fetchFunfunFree, saveFunfunFree, isFreeActive, formatKDate, FunfunFreeInfo } from '../utils/funfunFree';

/** datetime-local 입력칸 값 <-> ms */
const toInput = (ms: number) => {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromInput = (s: string) => (s ? new Date(s).getTime() : 0);

/**
 * 마스터 관리실: 펀펀 플레이 무료 개방 기간 정하기
 * (예: 한 달에 한 번, 정한 날에는 포인트 없이 무제한)
 */
export const FunfunFreePanel: React.FC = () => {
  const [info, setInfo] = useState<FunfunFreeInfo | null>(null);
  const [from, setFrom] = useState(() => toInput(Date.now()));
  const [until, setUntil] = useState(() => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return toInput(d.getTime());
  });
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');
  const [more, setMore] = useState(false);

  useEffect(() => {
    void fetchFunfunFree().then((f) => {
      setInfo(f);
      if (f.freeUntil > Date.now()) {
        setFrom(toInput(f.freeFrom || Date.now()));
        setUntil(toInput(f.freeUntil));
        setNote(f.note || '');
      }
    });
  }, []);

  const apply = async (v: { freeFrom?: number; freeUntil?: number; note?: string; off?: boolean }, done: string) => {
    const r = await saveFunfunFree(v);
    if (r.success) {
      setInfo(r.info || null);
      setMsg(done);
    } else setMsg(`❌ ${r.message}`);
    setTimeout(() => setMsg(''), 6000);
  };

  const active = isFreeActive(info);
  const scheduled = !!info && info.freeUntil > Date.now() && info.freeFrom > Date.now();

  const todayEnd = () => {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return d.getTime();
  };

  const chip = 'px-2.5 py-1 rounded-lg font-black cursor-pointer';
  return (
    <div className="px-3 py-2 rounded-xl border-2 border-pink-300 bg-pink-50 text-xs font-bold text-pink-950 space-y-2 shrink-0" data-testid="funfun-free-panel">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[13px] font-black mr-1">🎡 펀펀 무료</span>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
            active ? 'bg-pink-500 text-white' : scheduled ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
          }`}
          data-testid="funfun-free-status"
        >
          {active ? `${formatKDate(info!.freeUntil)}까지` : scheduled ? `예약 ${formatKDate(info!.freeFrom)}~` : '꺼짐'}
        </span>
        <span className="flex-1" />
        <button type="button" onClick={() => apply({ freeFrom: Date.now(), freeUntil: todayEnd(), note }, '✅ 오늘 밤 11시 59분까지 무료로 열었어요.')} className={`${chip} bg-pink-500 hover:bg-pink-400 text-white`}>
          오늘 하루
        </button>
        <button type="button" onClick={() => apply({ freeFrom: Date.now(), freeUntil: Date.now() + 3600 * 1000, note }, '✅ 지금부터 1시간 무료로 열었어요.')} className={`${chip} bg-purple-500 hover:bg-purple-400 text-white`}>
          1시간
        </button>
        <button type="button" onClick={() => apply({ off: true }, '✅ 무료 개방을 껐어요.')} className={`${chip} bg-white border border-pink-300 text-pink-700`}>
          끄기
        </button>
        <button type="button" onClick={() => setMore((v) => !v)} className={`${chip} bg-white border border-slate-300 text-slate-600`}>
          {more ? '접기' : '기간 정하기'}
        </button>
      </div>

      {more && (
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-pink-800">시작</span>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2 py-1 rounded-lg border border-pink-300 bg-white text-slate-800" />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] text-pink-800">끝</span>
          <input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} className="px-2 py-1 rounded-lg border border-pink-300 bg-white text-slate-800" />
        </label>
        <label className="flex flex-col gap-0.5 flex-1 min-w-[160px]">
          <span className="text-[11px] text-pink-800">학생에게 보일 한마디 (선택)</span>
          <input
            type="text"
            value={note}
            maxLength={80}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 이달의 타자왕 축하 무료 개방!"
            className="px-2 py-1 rounded-lg border border-pink-300 bg-white text-slate-800"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const f = fromInput(from);
            const u = fromInput(until);
            if (!(u > f)) {
              setMsg('❌ 끝나는 시각이 시작 시각보다 뒤여야 해요.');
              return;
            }
            void apply({ freeFrom: f, freeUntil: u, note }, `✅ ${formatKDate(f)} ~ ${formatKDate(u)} 무료 개방을 정했어요.`);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-black cursor-pointer"
        >
          이 기간으로 저장
        </button>
      </div>
      )}
      {msg && <div className="text-[12px]">{msg}</div>}
    </div>
  );
};
