import React from 'react';

/** 한 세트가 끝난 뒤 "아직 안 친 곳"을 보여주는 목록 */
export interface TypingReviewItem {
  label: string; // 예: "3번째 문장", "2쪽"
  target: string;
  typed?: string; // 없으면 아예 치지 않음
  onGo?: () => void; // 그 문장/쪽으로 바로 가기
}

type Seg = { text: string; kind: 'ok' | 'wrong' | 'missing' };

/** 원문과 친 글자를 비교해서 맞음/오타/안 친 부분으로 나눔 */
export function diffTyping(target: string, typed = ''): Seg[] {
  const segs: Seg[] = [];
  const push = (ch: string, kind: Seg['kind']) => {
    const last = segs[segs.length - 1];
    if (last && last.kind === kind) last.text += ch;
    else segs.push({ text: ch, kind });
  };
  for (let i = 0; i < target.length; i++) {
    if (i >= typed.length) push(target[i], 'missing');
    else push(target[i], typed[i] === target[i] ? 'ok' : 'wrong');
  }
  return segs;
}

/** 끝까지 치지 않은(빠진 글자가 있는) 항목인지 */
export const isUnfinished = (target: string, typed?: string) => !typed || typed.replace(/\s+$/, '').length < target.replace(/\s+$/, '').length;

export const TypingReviewList: React.FC<{
  items: TypingReviewItem[];
  title?: string;
  emptyText?: string;
  tone?: 'amber' | 'stone';
}> = ({ items, title = '아직 안 친 곳', emptyText = '빠짐없이 모두 쳤어요! 👏', tone = 'amber' }) => {
  const border = tone === 'amber' ? 'border-amber-300 bg-white' : 'border-[#E4DCCB] bg-white';
  if (!items.length) {
    return (
      <div className={`rounded-2xl border-2 ${border} p-3 text-sm font-black text-emerald-700`} data-testid="review-empty">
        ✅ {emptyText}
      </div>
    );
  }
  const notTyped = items.filter((i) => !i.typed).length;
  const partial = items.length - notTyped;
  return (
    <div className={`rounded-2xl border-2 ${border} p-3 text-left`} data-testid="review-list">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <b className="text-sm font-black text-rose-600">📍 {title} ({items.length}곳)</b>
        <span className="text-[11px] font-bold text-slate-500">
          {notTyped > 0 && <>안 침 {notTyped} </>}
          {partial > 0 && <>· 덜 침 {partial}</>}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] font-bold text-slate-500">
        <span><i className="not-italic px-1 rounded bg-slate-200 text-slate-500 border border-dashed border-slate-400">회색</i> 안 친 글자</span>
        <span><i className="not-italic px-1 rounded bg-rose-100 text-rose-600 line-through">빨강</i> 틀린 글자</span>
      </div>
      <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {items.map((it, idx) => (
          <li key={idx} className="rounded-xl bg-slate-50 border border-slate-200 p-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-black text-slate-700">
                {it.label}{' '}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${it.typed ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>
                  {it.typed ? '덜 침' : '안 침'}
                </span>
              </span>
              {it.onGo && (
                <button
                  type="button"
                  onClick={it.onGo}
                  className="shrink-0 px-2 py-0.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black cursor-pointer"
                >
                  치러 가기 ▶
                </button>
              )}
            </div>
            <p className="text-xs leading-relaxed whitespace-pre-wrap break-keep font-medium">
              {diffTyping(it.target, it.typed).map((s, i) => (
                <span
                  key={i}
                  className={
                    s.kind === 'ok'
                      ? 'text-slate-800'
                      : s.kind === 'wrong'
                      ? 'bg-rose-100 text-rose-600 line-through decoration-2'
                      : 'bg-slate-200/80 text-slate-400 border-b-2 border-dashed border-slate-400'
                  }
                >
                  {s.text}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
