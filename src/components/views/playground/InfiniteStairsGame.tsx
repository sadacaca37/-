import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../../../utils/sound';
import { ArcadeShell, overlay, rr, useBest } from './games/ArcadeShell';

/* Endless stair climber: stairs zig-zag left/right. CLIMB keeps direction, TURN flips it.
   A timer bar drains constantly and refills a little on every correct step. */
const W = 420;
const H = 560;
const STEP_W = 58;
const STEP_H = 30;

export const InfiniteStairsGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [best, saveBest] = useBest('tp_stairs_best');
  const [score, setScore] = useState(0);
  const g = useRef({
    state: 'title' as 'title' | 'play' | 'fall',
    stairs: [] as number[], // column index of each stair (x in step units)
    idx: 0, // stair the player stands on
    dir: 1 as 1 | -1, // facing
    time: 1, // 0..1
    camY: 0,
    fallT: 0,
    last: 0,
    hop: 0,
    coins: new Set<number>(),
    got: 0,
  });

  const extend = (n: number) => {
    const s = g.current;
    while (s.stairs.length < n) {
      const n = s.stairs.length;
      const prev = s.stairs[n - 1];
      const lastDir = n > 1 ? prev - s.stairs[n - 2] : 1;
      const d = n < 4 || Math.random() < 0.68 ? lastDir : -lastDir;
      s.stairs.push(prev + d);
      if (Math.random() < 0.18) s.coins.add(s.stairs.length - 1);
    }
  };
  const start = useCallback(() => {
    const s = g.current;
    s.stairs = [0, 1]; s.coins = new Set(); extend(60);
    s.idx = 0; s.dir = 1; s.time = 1; s.camY = 0; s.state = 'play'; s.hop = 0; s.got = 0;
    setScore(0);
    try { soundManager.play('click'); } catch {}
  }, []);

  const step = useCallback((turn: boolean) => {
    const s = g.current;
    if (s.state !== 'play') { start(); return; }
    if (turn) s.dir = (s.dir * -1) as 1 | -1;
    const need = s.stairs[s.idx + 1] - s.stairs[s.idx];
    if (need === s.dir) {
      s.idx++; s.hop = 1;
      s.time = Math.min(1, s.time + 0.085 - Math.min(0.05, s.idx * 0.0004));
      if (s.coins.has(s.idx)) { s.coins.delete(s.idx); s.got++; s.time = Math.min(1, s.time + 0.12); }
      extend(s.idx + 40);
      setScore(s.idx + s.got * 5);
      try { soundManager.play('pop' as any); } catch {}
    } else {
      s.state = 'fall'; s.fallT = 0;
      saveBest(s.idx + s.got * 5);
      try { soundManager.play('error'); } catch {}
    }
  }, [start, saveBest]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp'].includes(e.key)) e.preventDefault();
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'j' || k === 'arrowup') step(false);
      else if (k === 'arrowleft' || k === 'f') step(true);
      else if (k === ' ' || k === 'enter') { if (g.current.state !== 'play') start(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step, start]);

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    let raf = 0;

    const drawStep = (x: number, y: number, coin: boolean) => {
      // brick block
      ctx.fillStyle = '#c8733b'; ctx.fillRect(x, y, STEP_W, STEP_H);
      ctx.fillStyle = '#e8995a'; ctx.fillRect(x, y, STEP_W, 6);
      ctx.fillStyle = '#8a4a22'; ctx.fillRect(x, y + STEP_H - 5, STEP_W, 5);
      ctx.fillStyle = '#9c5a2c'; ctx.fillRect(x + STEP_W / 2 - 1, y + 6, 2, STEP_H - 11);
      ctx.strokeStyle = '#3d220d'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, STEP_W - 2, STEP_H - 2);
      if (coin) {
        const cy = y - 18 + Math.sin(Date.now() / 200) * 3;
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.ellipse(x + STEP_W / 2, cy, 9, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8a5a00'; ctx.stroke();
        ctx.fillStyle = '#fff59d'; ctx.fillRect(x + STEP_W / 2 - 3, cy - 5, 3, 8);
      }
    };
    const drawHero = (x: number, y: number, dir: number, t: number) => {
      // small original climber: round helmet kid with scarf
      ctx.save(); ctx.translate(x, y); if (dir < 0) ctx.scale(-1, 1);
      const bob = Math.sin(t / 90) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1b2340'; ctx.fillRect(-9, -14, 7, 14); ctx.fillRect(2, -14, 7, 14);
      ctx.fillStyle = '#38b6ff'; rr(ctx, -13, -36 + bob, 26, 24, 7); ctx.fill(); ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = '#ff4757'; ctx.fillRect(-13, -30 + bob, 26, 5); ctx.fillRect(-18, -29 + bob, 8, 12);
      ctx.fillStyle = '#ffe0bd'; ctx.beginPath(); ctx.arc(0, -48 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, -52 + bob, 15, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1b2340'; ctx.fillRect(4, -50 + bob, 3, 5); ctx.fillRect(-4, -50 + bob, 3, 5);
      ctx.fillStyle = '#ff8ab3'; ctx.fillRect(7, -44 + bob, 4, 2);
      ctx.restore();
    };

    const frame = (ts: number) => {
      const s = g.current;
      const dt = s.last ? Math.min(50, ts - s.last) : 16; s.last = ts;
      if (s.state === 'play') {
        s.time -= dt * (0.00016 + Math.min(0.00022, s.idx * 0.0000025));
        if (s.time <= 0) { s.time = 0; s.state = 'fall'; s.fallT = 0; saveBest(s.idx + s.got * 5); try { soundManager.play('error'); } catch {} }
      }
      if (s.state === 'fall') s.fallT += dt;
      s.hop = Math.max(0, s.hop - dt / 120);

      const height = s.idx * STEP_H;
      s.camY += (height - s.camY) * 0.2;
      // sky that darkens with height (day -> sunset -> space)
      const k = Math.min(1, s.idx / 220);
      const top = k < 0.5 ? mix('#5ec3ff', '#ff9ac2', k * 2) : mix('#ff9ac2', '#1a1a5c', (k - 0.5) * 2);
      const bot = k < 0.5 ? mix('#d9f3ff', '#ffd9a8', k * 2) : mix('#ffd9a8', '#4a2a8a', (k - 0.5) * 2);
      const grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, top); grd.addColorStop(1, bot);
      ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      // parallax clouds / stars
      for (let i = 0; i < 7; i++) {
        const y = ((i * 131 + s.camY * 0.3) % (H + 80)) - 40;
        const x = (i * 97) % W;
        if (k > 0.7) { ctx.fillStyle = '#fff'; ctx.fillRect(x, y, 3, 3); }
        else { ctx.fillStyle = 'rgba(255,255,255,0.85)'; rr(ctx, x - 30, y, 70, 18, 9); ctx.fill(); rr(ctx, x - 10, y - 10, 36, 18, 9); ctx.fill(); }
      }
      // stairs
      const heroCol = s.stairs.length ? s.stairs[s.idx] : 0;
      const baseX = W / 2 - STEP_W / 2;
      const baseY = H - 150;
      const from = Math.max(0, s.idx - 8), to = Math.min(s.stairs.length - 1, s.idx + 20);
      for (let i = from; i <= to; i++) {
        const x = baseX + (s.stairs[i] - heroCol) * STEP_W;
        const y = baseY - (i * STEP_H - s.camY);
        if (y < -40 || y > H + 40) continue;
        drawStep(x, y, s.coins.has(i));
      }
      // hero
      let hx = W / 2, hy = baseY - (s.idx * STEP_H - s.camY) - s.hop * 10;
      if (s.state === 'fall') { hy += (s.fallT / 4) ** 1.4; hx += s.dir * s.fallT * 0.08; }
      if (s.stairs.length) drawHero(hx, hy, s.dir, ts);
      // timer bar
      ctx.fillStyle = '#1b2340'; rr(ctx, 20, 16, W - 40, 22, 6); ctx.fill();
      const tc = s.time > 0.5 ? '#5ee05a' : s.time > 0.25 ? '#ffd83a' : '#ff4f5e';
      ctx.fillStyle = tc; rr(ctx, 24, 20, Math.max(0, (W - 48) * s.time), 14, 4); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = "34px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.lineWidth = 5; ctx.strokeStyle = '#1b2340'; ctx.strokeText(String(s.idx), W / 2, 50); ctx.fillText(String(s.idx), W / 2, 50);
      if (s.state === 'title') overlay(ctx, W, H, '무한의 계단', 'SPACE 또는 버튼으로 시작', '#ffd700');
      if (s.state === 'fall' && s.fallT > 700) overlay(ctx, W, H, `${s.idx} 계단!`, 'SPACE 다시 도전', '#ff9ac2');
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [saveBest]);

  return (
    <ArcadeShell
      title="무한의 계단"
      subtitle="CLIMB · TURN"
      tone="#ffd700"
      score={score}
      best={Math.max(best, score)}
      onBack={onBack}
      onRestart={start}
      controls={
        <>
          <button className="ac-pad ac-pad--big ac-pad--pink" onClick={() => step(true)}>
            ↺ 방향 전환 <small>(F / ←)</small>
          </button>
          <button className="ac-pad ac-pad--big ac-pad--blue" onClick={() => step(false)}>
            ⬆ 오르기 <small>(J / →)</small>
          </button>
        </>
      }
    >
      <canvas ref={cv} style={{ width: W, maxWidth: '100%', aspectRatio: `${W} / ${H}` }} />
    </ArcadeShell>
  );
};

function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
