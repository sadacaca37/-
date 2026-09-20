import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

/** 페이지 안쪽 상자(확대·애니메이션)에 갇히지 않도록 화면 맨 위(body)에 띄움 */
export const BodyPortal: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  typeof document === 'undefined' ? <>{children}</> : createPortal(children, document.body);

/**
 * 게임 화면을 창 크기에 맞게 크게 키워 주는 상자.
 * 게임은 원래 크기로 그려 두고, 전체를 확대(scale)해서 빈 곳 없이 꽉 차게 보여 줌.
 */
export const FitToBox: React.FC<{ children: React.ReactNode; maxScale?: number; designWidth?: number }> = ({
  children,
  maxScale = 2.2,
  designWidth = 1100,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ s: 1, x: 0, y: 0 });

  const measure = useCallback(() => {
    const area = areaRef.current;
    const inner = innerRef.current;
    const child = inner?.firstElementChild as HTMLElement | null;
    if (!area || !inner || !child) return;
    const availW = Math.max(1, area.clientWidth - 12);
    const availH = Math.max(1, area.clientHeight - 12);
    // 게임 본체의 실제 크기 (확대와 상관없는 원래 크기)
    const cw = Math.max(1, child.offsetWidth, child.scrollWidth);
    const ch = Math.max(1, child.offsetHeight, child.scrollHeight);
    const cl = child.offsetLeft;
    const ct = child.offsetTop;
    const s = Math.max(0.35, Math.min(availW / cw, availH / ch, maxScale));
    const x = (area.clientWidth - cw * s) / 2 - cl * s;
    const y = Math.max(0, (area.clientHeight - ch * s) / 2) - ct * s;
    setFit((p) => (Math.abs(p.s - s) < 0.003 && Math.abs(p.x - x) < 1 && Math.abs(p.y - y) < 1 ? p : { s, x, y }));
  }, [maxScale]);

  useLayoutEffect(() => {
    measure();
    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure();
      });
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    if (ro && areaRef.current) ro.observe(areaRef.current);
    if (ro && innerRef.current?.firstElementChild) ro.observe(innerRef.current.firstElementChild);
    // 게임이 화면을 바꿀 때(시작 화면 → 게임 화면) 다시 맞춤
    const mo = typeof MutationObserver !== 'undefined' && innerRef.current ? new MutationObserver(schedule) : null;
    if (mo && innerRef.current) mo.observe(innerRef.current, { childList: true });
    window.addEventListener('resize', schedule);
    const t = window.setInterval(schedule, 1000);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      mo?.disconnect();
      window.removeEventListener('resize', schedule);
      window.clearInterval(t);
    };
  }, [measure]);

  return (
    <div ref={areaRef} className="relative w-full h-full overflow-hidden" data-testid="game-fit-area">
      <div
        ref={innerRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: designWidth,
          transformOrigin: '0 0',
          transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.s})`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** 미니게임을 화면 전체를 쓰는 큰 창으로 띄움 */
export const GameFitStage: React.FC<{ title: string; icon?: string; onExit: () => void; children: React.ReactNode }> = ({
  title,
  icon,
  onExit,
  children,
}) => (
  <BodyPortal>
  <div className="tp-skin fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-[#1b1440] to-[#0b0f3a]" data-testid="game-fit-stage">
    <div className="ifg-bar shrink-0">
      <span className="ifg-title">
        {icon && <span className="text-xl">{icon}</span>}
        {title}
      </span>
      <button type="button" className="ifg-btn" onClick={onExit} title="게임 나가기">
        <X className="w-4 h-4" />
        <span>나가기</span>
      </button>
    </div>
    <div className="flex-1 min-h-0">
      <FitToBox>{children}</FitToBox>
    </div>
  </div>
  </BodyPortal>
);
