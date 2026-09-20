import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';

interface IframeGameProps {
  src: string;
  title: string;
  icon: string;
}

/**
 * Runs an original, unmodified GitHub/offline HTML game inside the site.
 * Keeps keyboard focus inside the game so arrow keys / space actually control it.
 */
export const IframeGame: React.FC<IframeGameProps> = ({ src, title, icon }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const focusGame = useCallback(() => {
    const f = frameRef.current;
    if (!f) return;
    try {
      f.focus();
      f.contentWindow?.focus();
    } catch {}
  }, []);

  // arrow keys / space must not scroll the outer page while a game is open.
  // 키가 게임 창이 아닌 바깥 페이지로 들어오면(포커스가 밖에 있을 때) 게임 창으로 그대로 넘겨 줌
  useEffect(() => {
    const forward = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Spacebar'].includes(e.key)) e.preventDefault();
      const w = frameRef.current?.contentWindow as (Window & typeof globalThis) | null | undefined;
      if (!w) return;
      try {
        const KE = (w as any).KeyboardEvent || KeyboardEvent;
        w.dispatchEvent(
          new KE(e.type, { key: e.key, code: e.code, keyCode: e.keyCode, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey, repeat: e.repeat, bubbles: true }),
        );
      } catch {}
      if (e.type === 'keydown') focusGame();
    };
    window.addEventListener('keydown', forward, { passive: false });
    window.addEventListener('keyup', forward);
    return () => {
      window.removeEventListener('keydown', forward);
      window.removeEventListener('keyup', forward);
    };
  }, [focusGame]);

  return (
    <div className="ifg">
      <div className="ifg-bar">
        <span className="ifg-title">
          <span className="text-xl">{icon}</span>
          {title}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ifg-btn"
            title="다시 시작"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button type="button" className="ifg-btn" onClick={() => window.open(src, '_blank', 'noopener')}>
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">새 탭 크게</span>
          </button>
        </div>
      </div>
      <div className="ifg-stage" onMouseDown={focusGame}>
        {loading && <div className="ifg-loading">LOADING…</div>}
        <iframe
          key={reloadKey}
          ref={frameRef}
          src={src}
          title={title}
          tabIndex={0}
          className="ifg-frame"
          allow="autoplay; fullscreen; gamepad; pointer-lock"
          onLoad={() => {
            setLoading(false);
            focusGame();
          }}
        />
      </div>
    </div>
  );
};
