/**
 * 선생님 화면: 학생이 [선생님께 보내기]를 누르면 오른쪽 아래에 작은 알림 창이 떠서 누가 보냈는지 바로 보임
 *  - 선생님 계정으로 들어와 있을 때만, 이 화면을 연 뒤에 온 보고만 알림 (Firestore 실시간)
 */
import React, { useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { fs } from '../utils/moaFirebase';
import { soundManager } from '../utils/sound';

/** 이미 알린 보고 (학생·날짜마다 한 번만) — 여러 창·새로 고침에도 다시 안 뜨게 이 컴퓨터에 기억 */
const SEEN_KEY = 'taja_report_toast_seen';
function seenStore(): Record<string, number> {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
/** 처음이면 true (그리고 기억), 이미 알렸으면 false */
function claimToast(docId: string): boolean {
  const all = seenStore();
  if (all[docId]) return false;
  all[docId] = Date.now();
  // 사흘 지난 것은 정리
  const cut = Date.now() - 3 * 86400000;
  for (const k of Object.keys(all)) if (all[k] < cut) delete all[k];
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(all));
  } catch {}
  return true;
}

type Toast = { id: string; name: string; grade?: number; sets: number; avgCpm: number; acc: number; at: number };

export const ReportArrivalToasts: React.FC<{ active: boolean; onOpen: () => void }> = ({ active, onOpen }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seen = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!active) return;
    const since = Date.now() - 5000;
    const q = query(collection(fs, 'taja_reports'), where('sentAt', '>', since));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const fresh: Toast[] = [];
        snap.docChanges().forEach((ch) => {
          if (ch.type === 'removed') return;
          const v = ch.doc.data() as any;
          const sentAt = Number(v.sentAt) || 0;
          if (seen.current.has(ch.doc.id)) return; // 같은 학생의 같은 날 보고는 한 번만
          seen.current.set(ch.doc.id, sentAt);
          if (!claimToast(ch.doc.id)) return; // 다른 창·새로 고침에서 이미 알린 보고
          const s = v.summary || {};
          fresh.push({ id: `${ch.doc.id}_${sentAt}`, name: String(v.name || '학생'), grade: Number(v.grade) || undefined, sets: Number(s.sets) || 0, avgCpm: Number(s.avgCpm) || 0, acc: Number(s.avgAcc) || 0, at: sentAt });
        });
        if (!fresh.length) return;
        try {
          soundManager.play('pop');
        } catch {}
        setToasts((t) => [...fresh, ...t.filter((x) => !fresh.some((f) => f.name === x.name))].slice(0, 4));
        fresh.forEach((f) => window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== f.id)), 20000));
      },
      () => {},
    );
    return () => unsub();
  }, [active]);

  if (!active || !toasts.length) return null;
  return (
    <div className="fixed right-4 bottom-4 z-[90] flex flex-col gap-2 w-[min(92vw,340px)]" aria-live="polite" data-testid="report-toasts">
      {toasts.map((t) => (
        <div key={t.id} className="rounded-2xl border-4 border-[#5a3417] bg-[#fdf5dd] shadow-[0_6px_0_rgba(44,21,7,0.55)] p-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-2">
            <span className="text-2xl leading-none" aria-hidden="true">📮</span>
            <div className="flex-1 min-w-0">
              <div className="font-black text-[#3d220d] text-base truncate">
                {t.name}
                {t.grade ? ` (${t.grade}학년)` : ''} 학생이 보냈어요!
              </div>
              <div className="text-xs font-bold text-[#7a4a1e] mt-0.5">
                오늘 {t.sets}세트 · 평균 {t.avgCpm}타 · 정확도 {t.acc}% · {new Date(t.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <button type="button" className="text-[#7a4a1e] font-black px-1 cursor-pointer" aria-label="닫기" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>
              ✕
            </button>
          </div>
          <button
            type="button"
            className="mt-2 w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-sm border-2 border-[#3d220d] cursor-pointer"
            onClick={() => {
              setToasts((x) => x.filter((y) => y.id !== t.id));
              onOpen();
            }}
          >
            받은 보고 보기
          </button>
        </div>
      ))}
    </div>
  );
};
