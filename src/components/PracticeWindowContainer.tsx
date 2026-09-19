import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface PracticeWindowContainerProps {
  mode: 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice';
  title: string;
  stepNumber: string;
  icon: string;
  onClose: () => void;
  showKeyboardSimultaneousBadge?: boolean;
  children: React.ReactNode;
}

/**
 * All practice modes are laid out on one design canvas and scaled to fill the window.
 * The canvas width follows the window's aspect ratio so there are no empty side margins.
 */
const MIN_W = 1000;
const MAX_W = 1760;
const MAX_SCALE = 1.35;

export const PracticeWindowContainer: React.FC<PracticeWindowContainerProps> = ({ title, icon, stepNumber, onClose, children }) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const passes = useRef(0);
  const [fit, setFit] = useState({ scale: 1, top: 0, width: 1200 });

  const measure = useCallback(() => {
    const area = areaRef.current;
    const inner = innerRef.current;
    if (!area || !inner) return;
    const availW = Math.max(1, area.clientWidth - 16);
    const availH = Math.max(1, area.clientHeight - 12);
    const curW = inner.offsetWidth;
    const natW = Math.max(curW, inner.scrollWidth);
    // some views let children overflow their box, so measure the real painted bottom
    const rect = inner.getBoundingClientRect();
    const curScale = rect.height / Math.max(1, inner.offsetHeight) || 1;
    let paintedBottom = 0;
    inner.querySelectorAll<HTMLElement>('*').forEach((el) => {
      const b = el.getBoundingClientRect().bottom;
      if (b > paintedBottom) paintedBottom = b;
    });
    const overflowH = paintedBottom ? (paintedBottom - rect.top) / curScale + 8 : 0;
    const natH = Math.max(1, inner.scrollHeight, overflowH);
    // widen/narrow the canvas until its shape matches the window (a few passes max)
    let width = curW;
    if (passes.current < 4) {
      const ideal = Math.round(Math.min(MAX_W, Math.max(MIN_W, (availW / availH) * natH)));
      if (Math.abs(ideal - curW) > 24) {
        passes.current += 1;
        width = ideal;
      }
    }
    const scale = Math.max(0.3, Math.min(availW / natW, availH / natH, MAX_SCALE));
    const top = Math.max(0, (area.clientHeight - natH * scale) / 2);
    setFit((prev) =>
      Math.abs(prev.scale - scale) < 0.002 && Math.abs(prev.top - top) < 1 && prev.width === width ? prev : { scale, top, width },
    );
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => measure()) : null;
    if (ro) {
      if (areaRef.current) ro.observe(areaRef.current);
      if (innerRef.current) ro.observe(innerRef.current);
    }
    const onResize = () => {
      passes.current = 0;
      measure();
    };
    window.addEventListener('resize', onResize);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [measure]);

  const handleClose = () => {
    try {
      soundManager.play('click');
    } catch {}
    if (typeof window !== 'undefined' && window.opener) {
      window.close();
    }
    onClose();
  };

  return (
    <div className="tp-practice">
      {/* wooden HUD title bar */}
      <div className="tp-practice-bar">
        <span className="tp-practice-logo">
          <span className="tp-logo-a" data-text="타자">
            타자
          </span>
          <span className="tp-logo-b" data-text="팡팡">
            팡팡
          </span>
        </span>
        <span className="tp-practice-stage">STAGE {stepNumber}</span>
        <span className="tp-practice-title">
          <span className="text-lg sm:text-xl">{icon}</span>
          {title}
        </span>
        <span className="tp-practice-hearts" aria-hidden="true">
          ♥♥♥
        </span>
        <button type="button" onClick={handleClose} className="tp-practice-close" title="창 닫기">
          <X className="w-4 h-4" />
          <span>닫기</span>
        </button>
      </div>

      {/* auto-fit stage: content keeps one design size and is scaled to the window */}
      <div ref={areaRef} className="tp-practice-area">
        <div
          ref={innerRef}
          className="tp-practice-canvas"
          style={{
            width: fit.width,
            top: fit.top,
            transform: `translateX(-50%) scale(${fit.scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
