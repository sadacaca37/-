import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const COMMON_PRACTICE_ASSETS = [
  '/assets/practice/wood-status-bar.webp',
  '/assets/practice/wood-desk-bg.webp',
  '/assets/practice/parchment-scroll.webp',
  '/assets/practice/wood-signpost.webp',
  '/assets/parchment-card.webp',
];

const MODE_PRELOAD_ASSETS: Record<PracticeWindowContainerProps['mode'], string[]> = {
  'key-practice': [
    ...COMMON_PRACTICE_ASSETS,
    '/assets/practice/forest-meadow-bg.webp',
    '/assets/practice/hand-left.webp',
    '/assets/practice/hand-right.webp',
  ],
  'word-practice': [
    ...COMMON_PRACTICE_ASSETS,
    '/assets/footer-meadow.webp',
    '/assets/practice/hand-left.webp',
    '/assets/practice/hand-right.webp',
  ],
  'sentence-practice': [
    ...COMMON_PRACTICE_ASSETS,
    '/assets/minigames/bg-defense.webp',
  ],
  'long-practice': [
    ...COMMON_PRACTICE_ASSETS,
    '/assets/minigames/bg-pet.webp',
  ],
};

function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(done, done);
      } else {
        done();
      }
    };
    img.onerror = done;
    img.src = src;
    if (img.complete) {
      if (typeof img.decode === 'function') {
        img.decode().then(done, done);
      } else {
        done();
      }
    }
  });
}

function preloadFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve();
  }
  const waitLinks = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
    .filter((link) => link.media === 'print')
    .map(
      (link) =>
        new Promise<void>((resolve) => {
          const done = () => resolve();
          link.addEventListener('load', done, { once: true });
          link.addEventListener('error', done, { once: true });
        })
    );

  const loadKnownFaces = () =>
    Promise.all([
      document.fonts.load('400 24px "Jua"').catch(() => []),
      document.fonts.load('700 18px "Noto Sans KR"').catch(() => []),
      document.fonts.load('900 24px "Noto Sans KR"').catch(() => []),
      document.fonts.ready.catch(() => undefined),
    ]).then(() => undefined);

  return Promise.all(waitLinks)
    .then(loadKnownFaces)
    .catch(() => undefined);
}

function waitWithCap(task: Promise<void>, capMs: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const timer = window.setTimeout(finish, capMs);
    task.then(() => {
      window.clearTimeout(timer);
      finish();
    }, () => {
      window.clearTimeout(timer);
      finish();
    });
  });
}

export const PracticeWindowContainer: React.FC<PracticeWindowContainerProps> = ({
  mode,
  title,
  icon,
  stepNumber,
  onClose,
  children,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const passes = useRef(0);
  const isReadyRef = useRef(false);
  const lastAreaSizeRef = useRef({ w: 0, h: 0 });
  const isPopupWindow = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('popup') === 'true';
  const [fit, setFit] = useState({ scale: 1, top: 0, width: 1200 });
  const [isReady, setIsReady] = useState(false);

  const measure = useCallback((): boolean => {
    const area = areaRef.current;
    const inner = innerRef.current;
    if (!area || !inner) return false;
    if (inner.childElementCount === 0 || inner.scrollHeight < 80) return false;

    const areaW = area.clientWidth;
    const areaH = area.clientHeight;
    if (areaW <= 0 || areaH <= 0) return false;

    lastAreaSizeRef.current = { w: areaW, h: areaH };

    const availW = Math.max(1, areaW - 16);
    const availH = Math.max(1, areaH - 12);
    const curW = inner.offsetWidth;
    const natW = Math.max(curW, inner.scrollWidth);
    // Measure real painted bottom while strictly ignoring modals and clipped/moving hand overlays
    const rect = inner.getBoundingClientRect();
    const curScale = rect.height / Math.max(1, inner.offsetHeight) || 1;
    let paintedBottom = 0;
    inner.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.closest('.fixed, [data-no-fit-measure], .pr-hands-layer, svg')) return;
      const b = el.getBoundingClientRect().bottom;
      if (b > paintedBottom) paintedBottom = b;
    });
    const overflowH = paintedBottom ? (paintedBottom - rect.top) / curScale + 8 : 0;
    const natH = Math.max(1, inner.scrollHeight, overflowH);
    // widen/narrow the canvas until its shape matches the window (a few passes max)
    let width = curW;
    let widthChanged = false;
    if (passes.current < 4) {
      const ideal = Math.round(Math.min(MAX_W, Math.max(MIN_W, (availW / availH) * natH)));
      if (Math.abs(ideal - curW) > 24) {
        passes.current += 1;
        width = ideal;
        widthChanged = true;
      }
    }
    const scale = Math.max(0.3, Math.min(availW / natW, availH / natH, MAX_SCALE));
    const top = Math.max(0, (areaH - natH * scale) / 2);
    setFit((prev) =>
      Math.abs(prev.scale - scale) < 0.002 && Math.abs(prev.top - top) < 1 && prev.width === width
        ? prev
        : { scale, top, width }
    );
    return !widthChanged;
  }, []);

  // Notify VirtualKeyboard & child overlays whenever scaled layout updates
  useLayoutEffect(() => {
    window.dispatchEvent(new Event('typang-stage-layout'));
  }, [fit.scale, fit.width, fit.top]);

  useLayoutEffect(() => {
    measure();
    // Only recalculate canvas scale when the outer viewport/window size actually changes.
    // Never observe innerRef so typing content updates can NEVER rescale or shift the screen.
    let raf = 0;
    const runConvergeMeasure = () => {
      const settled = measure();
      if (!settled && passes.current < 4) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          runConvergeMeasure();
        });
      }
    };
    const scheduleForViewportChange = () => {
      const area = areaRef.current;
      if (!area) return;
      if (
        isReadyRef.current &&
        Math.abs(area.clientWidth - lastAreaSizeRef.current.w) <= 2 &&
        Math.abs(area.clientHeight - lastAreaSizeRef.current.h) <= 2
      ) {
        return;
      }
      passes.current = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        runConvergeMeasure();
      });
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleForViewportChange) : null;
    if (ro && areaRef.current) {
      ro.observe(areaRef.current);
    }
    window.addEventListener('resize', scheduleForViewportChange);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener('resize', scheduleForViewportChange);
    };
  }, [measure]);

  // Preload all mode images + fonts and let layout converge silently before fading in once
  useEffect(() => {
    let cancelled = false;
    passes.current = 0;
    isReadyRef.current = false;
    setIsReady(false);

    const assets = MODE_PRELOAD_ASSETS[mode] || COMMON_PRACTICE_ASSETS;
    const preloadAll = Promise.all([
      Promise.all(assets.map(preloadImage)),
      preloadFonts(),
    ]).then(() => undefined);

    const waitForContentAndConverge = () => {
      let attempts = 0;
      const step = () => {
        if (cancelled) return;
        const inner = innerRef.current;
        const hasContent = !!inner && inner.childElementCount > 0 && inner.scrollHeight >= 100;
        if (!hasContent && attempts < 120) {
          attempts += 1;
          requestAnimationFrame(step);
          return;
        }
        const settled = measure();
        if (!settled && attempts < 125) {
          attempts += 1;
          requestAnimationFrame(step);
          return;
        }
        // Final two animation frames so VirtualKeyboard locks hand coordinates before reveal
        requestAnimationFrame(() => {
          if (cancelled) return;
          measure();
          window.dispatchEvent(new Event('typang-stage-layout'));
          requestAnimationFrame(() => {
            if (cancelled) return;
            window.dispatchEvent(new Event('typang-stage-layout'));
            isReadyRef.current = true;
            setIsReady(true);
            // Focus the active typing input cleanly once visible
            const focusTarget = innerRef.current?.querySelector<HTMLElement>(
              'input[type="text"], textarea'
            );
            if (focusTarget && (!document.activeElement || !innerRef.current?.contains(document.activeElement))) {
              try {
                focusTarget.focus({ preventScroll: true });
              } catch {
                focusTarget.focus();
              }
            }
          });
        });
      };
      requestAnimationFrame(step);
    };

    void waitWithCap(preloadAll, 1000).then(() => {
      if (!cancelled) waitForContentAndConverge();
    });

    return () => {
      cancelled = true;
    };
  }, [mode, measure]);

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
    <div
      className={`tp-practice ${isPopupWindow ? '' : 'tp-practice--inline'} ${
        isReady ? 'tp-practice--ready' : 'tp-practice--preparing'
      }`}
    >
      {/* Unified shell (background + wooden HUD + stage) fades in once after images, fonts, and layout are ready */}
      <div className={`tp-practice-shell tp-practice-shell--${mode}`}>
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
    </div>
  );
};
