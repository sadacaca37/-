import React from 'react';

/** CSS 변수 안의 그림 주소는 CSS 파일 기준으로 풀리므로, 페이지 기준 전체 주소로 바꿔 넘김 */
const sceneUrl = (src: string) => {
  try {
    return new URL(src, document.baseURI).href;
  } catch {
    return src;
  }
};

/** Shared retro cabinet frame used by the basic (기본) games. */
export const ArcadeShell: React.FC<{
  title: string;
  subtitle?: string;
  tone?: string;
  score?: number | string;
  best?: number | string;
  extra?: React.ReactNode;
  onBack?: () => void;
  onRestart?: () => void;
  children: React.ReactNode;
  controls?: React.ReactNode;
  /** 게임판 뒤 장면 그림 (놀이터 카드 그림 등) — 없으면 tone 색 */
  scene?: string;
}> = ({ title, subtitle, tone = '#ff5fae', score, best, extra, onBack, onRestart, children, controls, scene }) => {
  const screenRef = React.useRef<HTMLDivElement>(null);
  // bring the play screen into view once, so arrow-key games never start half off-screen
  React.useEffect(() => {
    const t = window.setTimeout(() => {
      try { screenRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch {}
    }, 250);
    return () => window.clearTimeout(t);
  }, []);
  return (
  <div className={`ac ${scene ? 'ac-scene' : ''}`} style={{ ['--ac' as any]: tone, ...(scene ? { ['--ac-scene' as any]: `url('${sceneUrl(scene)}')` } : {}) }}>
    <div className="ac-top">
      {onBack && (
        <button type="button" className="ac-btn" onClick={onBack}>
          ◀ 놀이터
        </button>
      )}
      <div className="ac-marquee">
        <span className="ac-title">{title}</span>
        {subtitle && <span className="ac-sub">{subtitle}</span>}
      </div>
      {onRestart && (
        <button type="button" className="ac-btn" onClick={onRestart}>
          ↺ 다시
        </button>
      )}
    </div>
    <div className="ac-hud">
      {score !== undefined && (
        <span className="ac-chip">
          SCORE <b>{score}</b>
        </span>
      )}
      {best !== undefined && (
        <span className="ac-chip ac-chip--gold">
          BEST <b>{best}</b>
        </span>
      )}
      {extra}
    </div>
    <div className="ac-screen" ref={screenRef}>{children}</div>
    {controls && <div className="ac-controls">{controls}</div>}
  </div>
  );
};

/** Canvas helper: crisp canvas that scales to its box on high-DPI screens */
export const useBest = (key: string): [number, (v: number) => void] => {
  const [best, setBest] = React.useState<number>(() => {
    try {
      return Number(localStorage.getItem(key) || '0');
    } catch {
      return 0;
    }
  });
  const save = React.useCallback(
    (v: number) => {
      setBest((b) => {
        if (v > b) {
          try {
            localStorage.setItem(key, String(v));
          } catch {}
          return v;
        }
        return b;
      });
    },
    [key],
  );
  return [best, save];
};

/** rounded rectangle path */
export const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/** big centered overlay text on a canvas */
export const overlay = (ctx: CanvasRenderingContext2D, W: number, H: number, title: string, sub: string, tone = '#ffd700') => {
  ctx.fillStyle = 'rgba(11,14,42,0.72)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = "32px 'Galmuri11', 'Jua', monospace";
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#0b0e2a';
  ctx.strokeText(title, W / 2, H / 2 - 18);
  ctx.fillStyle = tone;
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font = "15px 'Galmuri11', 'Jua', monospace";
  ctx.fillStyle = '#ffffff';
  const blink = Math.floor(Date.now() / 450) % 2 === 0;
  if (blink) ctx.fillText(sub, W / 2, H / 2 + 26);
};
