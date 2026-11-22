/**
 * 학생 화면: 선생님이 보낸 포인트 선물을 받아 지갑에 넣고 "선물 도착!" 창을 띄움
 */
import React, { useEffect, useState } from 'react';
import { UserSession } from '../types';
import { claimGifts, GiftArrival } from '../utils/tajaGifts';
import { progressSync } from '../utils/progressSync';
import { soundManager } from '../utils/sound';

export const GiftReceiver: React.FC<{ user: UserSession | null }> = ({ user }) => {
  const [got, setGot] = useState<GiftArrival | null>(null);
  const id = user && user.role !== 'master' && user.isApproved === true ? user.id : '';

  useEffect(() => {
    if (!id) return;
    let alive = true;
    let running = false;
    const tick = async () => {
      // 다른 컴퓨터 자료를 다 받은 뒤에만 (그래야 두 번 받지 않음)
      if (running || !progressSync.isReady(id)) return;
      running = true;
      try {
        const r = await claimGifts(id);
        if (r && alive) {
          progressSync.resync();
          setGot((old) => (old ? { total: old.total + r.total, notes: [...old.notes, ...r.notes] } : r));
          try {
            soundManager.play('fanfare');
          } catch {}
        }
      } finally {
        running = false;
      }
    };
    const first = window.setTimeout(() => void tick(), 2500);
    const t = window.setInterval(() => void tick(), 30000);
    window.addEventListener('focus', tick);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(t);
      window.removeEventListener('focus', tick);
    };
  }, [id]);

  if (!got) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-900/55 p-4" data-testid="gift-popup" onClick={() => setGot(null)}>
      <div className="w-full max-w-sm rounded-3xl border-4 border-[#5a3417] bg-[#fdf5dd] shadow-[0_8px_0_rgba(44,21,7,0.55)] p-6 text-center space-y-3 animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="text-6xl" aria-hidden="true">🎁</div>
        <div className="text-xl font-black text-[#3d220d]">선생님이 포인트를 선물했어요!</div>
        <div className="text-4xl font-black text-amber-600">+{got.total.toLocaleString()} P</div>
        {got.notes.length > 0 && <div className="text-sm font-bold text-[#7a4a1e] break-keep">💌 {got.notes.join(' · ')}</div>}
        <button type="button" className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black border-2 border-[#3d220d] cursor-pointer" onClick={() => setGot(null)}>
          고마워요!
        </button>
      </div>
    </div>
  );
};
