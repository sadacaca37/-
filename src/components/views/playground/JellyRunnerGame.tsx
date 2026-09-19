import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../../../utils/sound';
import { ArcadeShell, overlay, rr, useBest } from './games/ArcadeShell';

/* Side-scrolling endless runner: jump (double jump) over forks, slide under bars,
   collect jelly beans; energy drains over time and potions refill it. */
const W = 760;
const H = 400;
const GROUND = 320;

type Ob = { x: number; kind: 'spike' | 'spike2' | 'bar' | 'potion'; used?: boolean };
type Jelly = { x: number; y: number; big?: boolean; got?: boolean };

export const JellyRunnerGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [best, saveBest] = useBest('tp_runner_best');
  const [score, setScore] = useState(0);
  const g = useRef({
    state: 'title' as 'title' | 'play' | 'over',
    y: GROUND, vy: 0, jumps: 0, slide: false, slideT: 0,
    speed: 6, dist: 0, score: 0, hp: 1, hurt: 0,
    obs: [] as Ob[], jel: [] as Jelly[], nextX: 900,
    last: 0, t: 0, pops: [] as { x: number; y: number; t: number; txt: string }[],
  });

  const start = useCallback(() => {
    const s = g.current;
    Object.assign(s, { state: 'play', y: GROUND, vy: 0, jumps: 0, slide: false, slideT: 0, speed: 6, dist: 0, score: 0, hp: 1, hurt: 0, obs: [], jel: [], nextX: 700, pops: [] });
    setScore(0);
    try { soundManager.play('click'); } catch {}
  }, []);

  const jump = useCallback(() => {
    const s = g.current;
    if (s.state !== 'play') { start(); return; }
    if (s.jumps < 2) { s.vy = s.jumps === 0 ? -13.5 : -11.5; s.jumps++; s.slide = false; try { soundManager.play('pop' as any); } catch {} }
  }, [start]);
  const slide = useCallback((on: boolean) => {
    const s = g.current;
    if (s.state !== 'play') return;
    s.slide = on && s.y >= GROUND;
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
      if (e.repeat) return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'j' || e.key === 'J') jump();
      if (e.key === 'ArrowDown' || e.key === 'f' || e.key === 'F') slide(true);
      if (e.key === 'Enter' && g.current.state !== 'play') start();
    };
    const up = (e: KeyboardEvent) => { if (e.key === 'ArrowDown' || e.key === 'f' || e.key === 'F') slide(false); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [jump, slide, start]);

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    let raf = 0;

    const genChunk = () => {
      const s = g.current;
      const x = s.nextX;
      const r = Math.random();
      if (r < 0.34) {
        s.obs.push({ x, kind: 'spike' });
        for (let i = 0; i < 5; i++) s.jel.push({ x: x - 80 + i * 40, y: GROUND - 60 - Math.sin((i / 4) * Math.PI) * 70 });
      } else if (r < 0.52) {
        s.obs.push({ x, kind: 'spike2' });
        for (let i = 0; i < 7; i++) s.jel.push({ x: x - 110 + i * 40, y: GROUND - 70 - Math.sin((i / 6) * Math.PI) * 120 });
      } else if (r < 0.8) {
        s.obs.push({ x, kind: 'bar' });
        for (let i = 0; i < 5; i++) s.jel.push({ x: x - 40 + i * 30, y: GROUND - 22 });
      } else {
        for (let i = 0; i < 6; i++) s.jel.push({ x: x + i * 36, y: GROUND - 30, big: i === 5 });
        if (Math.random() < 0.45) s.obs.push({ x: x + 120, kind: 'potion' });
      }
      s.nextX += 300 + Math.random() * 220 - Math.min(80, s.dist / 800);
    };

    const drawHero = (x: number, y: number, sliding: boolean, t: number, hurt: number) => {
      // round gummy jelly bear-like blob (original)
      if (hurt > 0 && Math.floor(t / 80) % 2) return;
      ctx.save(); ctx.translate(x, y);
      const run = Math.sin(t / 60);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 5, 0, 0, Math.PI * 2); ctx.fill();
      const bw = sliding ? 50 : 38, bh = sliding ? 26 : 44;
      ctx.fillStyle = '#ff7eb6'; rr(ctx, -bw / 2, -bh, bw, bh, sliding ? 12 : 16); ctx.fill();
      ctx.strokeStyle = '#7a1e4a'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; rr(ctx, -bw / 2 + 6, -bh + 5, 10, bh * 0.4, 5); ctx.fill();
      if (!sliding) {
        ctx.fillStyle = '#ff7eb6'; ctx.beginPath(); ctx.arc(-12, -bh + 2, 7, 0, Math.PI * 2); ctx.arc(12, -bh + 2, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a1e4a'; ctx.fillRect(-12 + run * 3, -6, 8, 6); ctx.fillRect(4 - run * 3, -6, 8, 6);
      }
      ctx.fillStyle = '#1b2340';
      ctx.fillRect(4, -bh + (sliding ? 8 : 14), 4, 6); ctx.fillRect(13, -bh + (sliding ? 8 : 14), 4, 6);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(5, -bh + (sliding ? 8 : 14), 2, 2); ctx.fillRect(14, -bh + (sliding ? 8 : 14), 2, 2);
      ctx.fillStyle = '#ff3b6b'; ctx.fillRect(8, -bh + (sliding ? 17 : 24), 6, 2);
      ctx.restore();
    };
    const jellyBean = (x: number, y: number, big?: boolean) => {
      const r = big ? 13 : 8;
      ctx.fillStyle = big ? '#ffd700' : '#6ff6ff';
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.2, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = big ? '#8a5a00' : '#0b5a6b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - r * 0.4, y - r * 0.6, r * 0.35, r * 0.5);
    };

    const frame = (ts: number) => {
      const s = g.current;
      const dt = s.last ? Math.min(40, ts - s.last) / 16.67 : 1; s.last = ts; s.t = ts;
      if (s.state === 'play') {
        s.speed = 6 + Math.min(6, s.dist / 2500);
        const dx = s.speed * dt;
        s.dist += dx;
        s.hp -= 0.0009 * dt * (1 + s.dist / 20000);
        s.hurt = Math.max(0, s.hurt - dt);
        s.vy += 0.75 * dt; s.y += s.vy * dt;
        if (s.y >= GROUND) { s.y = GROUND; s.vy = 0; s.jumps = 0; }
        s.obs.forEach((o) => (o.x -= dx)); s.jel.forEach((j) => (j.x -= dx)); s.nextX -= dx;
        while (s.nextX < W + 200) genChunk();
        s.obs = s.obs.filter((o) => o.x > -80); s.jel = s.jel.filter((j) => j.x > -30 && !j.got);
        const hx = 150, hTop = s.slide ? s.y - 26 : s.y - 44;
        s.jel.forEach((j) => {
          if (Math.abs(j.x - hx) < 24 && j.y > hTop - 12 && j.y < s.y + 6) {
            j.got = true; s.score += j.big ? 50 : 10; if (j.big) s.hp = Math.min(1, s.hp + 0.03);
            s.pops.push({ x: j.x, y: j.y, t: 500, txt: j.big ? '+50' : '+10' });
          }
        });
        s.obs.forEach((o) => {
          if (o.used) return;
          const near = Math.abs(o.x - hx) < (o.kind === 'spike2' ? 40 : 26);
          if (!near) return;
          if (o.kind === 'potion') { if (s.y > GROUND - 90) { o.used = true; s.hp = Math.min(1, s.hp + 0.25); s.pops.push({ x: o.x, y: GROUND - 60, t: 700, txt: 'HP UP!' }); try { soundManager.play('success' as any); } catch {} } return; }
          const hit = o.kind === 'bar' ? !s.slide : s.y > GROUND - (o.kind === 'spike2' ? 64 : 40);
          if (hit && s.hurt <= 0) { o.used = true; s.hp -= 0.22; s.hurt = 50; try { soundManager.play('error'); } catch {} }
        });
        if (s.hp <= 0) { s.hp = 0; s.state = 'over'; saveBest(s.score + Math.floor(s.dist / 10)); }
        s.pops.forEach((p) => (p.t -= dt * 16.67)); s.pops = s.pops.filter((p) => p.t > 0);
        if (Math.floor(ts / 200) !== Math.floor((ts - 16) / 200)) setScore(s.score + Math.floor(s.dist / 10));
      }

      // sky & parallax
      const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7fd0ff'); sky.addColorStop(1, '#fff0c9');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      const par = (f: number, col: string, hgt: number, wid: number) => {
        ctx.fillStyle = col; const off = (s.dist * f) % wid;
        for (let x = -off - wid; x < W + wid; x += wid) { ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + wid / 2, GROUND - hgt, x + wid, GROUND); ctx.fill(); }
      };
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 5; i++) { const x = (i * 190 - (s.dist * 0.1)) % (W + 200); const xx = x < -120 ? x + W + 200 : x; rr(ctx, xx, 40 + (i % 3) * 30, 90, 22, 11); ctx.fill(); rr(ctx, xx + 20, 28 + (i % 3) * 30, 44, 22, 11); ctx.fill(); }
      par(0.2, '#b6e39a', 150, 320); par(0.45, '#8bd36c', 90, 220);
      // candy trees
      for (let i = 0; i < 6; i++) { const x = ((i * 170 - s.dist * 0.6) % (W + 170) + W + 170) % (W + 170) - 60; ctx.fillStyle = '#b8783b'; ctx.fillRect(x + 18, GROUND - 60, 8, 60); ctx.fillStyle = i % 2 ? '#ff9ac2' : '#ffd36b'; ctx.beginPath(); ctx.arc(x + 22, GROUND - 70, 24, 0, Math.PI * 2); ctx.fill(); }
      // ground tiles
      const off = s.dist % 40;
      ctx.fillStyle = '#5fc649'; ctx.fillRect(0, GROUND, W, 14);
      ctx.fillStyle = '#c98a4b'; ctx.fillRect(0, GROUND + 14, W, H - GROUND - 14);
      ctx.fillStyle = '#a86b33'; for (let x = -off; x < W; x += 40) ctx.fillRect(x, GROUND + 26, 20, 8);
      ctx.fillStyle = '#3fa535'; for (let x = -off; x < W; x += 20) ctx.fillRect(x, GROUND + 10, 10, 4);
      // obstacles
      s.obs.forEach((o) => {
        if (o.kind === 'spike' || o.kind === 'spike2') {
          const n = o.kind === 'spike' ? 1 : 2, hh = o.kind === 'spike' ? 40 : 64;
          for (let i = 0; i < n; i++) {
            const x = o.x - (n * 18) + i * 36;
            ctx.fillStyle = '#9aa7b8'; ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.lineTo(x + 18, GROUND - hh); ctx.lineTo(x + 36, GROUND); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = '#dfe6ef'; ctx.beginPath(); ctx.moveTo(x + 18, GROUND - hh); ctx.lineTo(x + 24, GROUND - hh / 2); ctx.lineTo(x + 18, GROUND - hh / 2); ctx.fill();
          }
        } else if (o.kind === 'bar') {
          ctx.fillStyle = '#8a5a2e'; ctx.fillRect(o.x - 34, GROUND - 150, 8, 150 - 36); ctx.fillRect(o.x + 26, GROUND - 150, 8, 150 - 36);
          ctx.fillStyle = '#ff4f5e'; rr(ctx, o.x - 44, GROUND - 76, 88, 36, 8); ctx.fill(); ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) ctx.fillRect(o.x - 38 + i * 22, GROUND - 70, 10, 24);
        } else if (!o.used) {
          ctx.fillStyle = '#ff4f5e'; rr(ctx, o.x - 12, GROUND - 76, 24, 30, 8); ctx.fill(); ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 3; ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(o.x - 3, GROUND - 70, 6, 18); ctx.fillRect(o.x - 9, GROUND - 64, 18, 6);
        }
      });
      s.jel.forEach((j) => !j.got && jellyBean(j.x, j.y, j.big));
      drawHero(150, s.y, s.slide, ts, s.hurt);
      s.pops.forEach((p) => { ctx.fillStyle = '#ffffff'; ctx.font = "14px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 3; ctx.strokeText(p.txt, p.x, p.y - (500 - p.t) / 20); ctx.fillText(p.txt, p.x, p.y - (500 - p.t) / 20); });
      // energy bar (heart + gauge)
      ctx.fillStyle = '#1b2340'; rr(ctx, 16, 14, 300, 26, 8); ctx.fill();
      ctx.fillStyle = s.hp > 0.3 ? '#ff5fae' : '#ff4f5e'; rr(ctx, 42, 19, Math.max(0, 268 * s.hp), 16, 5); ctx.fill();
      ctx.fillStyle = '#ff4f5e'; ctx.font = "20px sans-serif"; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('♥', 20, 28);
      ctx.fillStyle = '#1b2340'; ctx.font = "18px 'Galmuri11', monospace"; ctx.textAlign = 'right';
      ctx.fillText(`${Math.floor(s.dist / 10)}m`, W - 16, 28);
      if (s.state === 'title') overlay(ctx, W, H, '젤리 점프 러너', 'SPACE 점프(2단) · ↓ 슬라이드', '#ff9ac2');
      if (s.state === 'over') overlay(ctx, W, H, 'FINISH!', `${s.score + Math.floor(s.dist / 10)}점 · SPACE 다시`, '#ffd700');
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [saveBest]);

  return (
    <ArcadeShell
      title="젤리 점프 러너"
      subtitle="RUN · JUMP · SLIDE"
      tone="#ff9ac2"
      score={score}
      best={Math.max(best, score)}
      onBack={onBack}
      onRestart={start}
      controls={
        <>
          <button className="ac-pad ac-pad--big ac-pad--blue" onPointerDown={() => slide(true)} onPointerUp={() => slide(false)} onPointerLeave={() => slide(false)}>
            ⬇ 슬라이드 <small>(↓)</small>
          </button>
          <button className="ac-pad ac-pad--big ac-pad--pink" onPointerDown={jump}>
            ⬆ 점프 <small>(SPACE)</small>
          </button>
        </>
      }
    >
      <canvas ref={cv} style={{ width: W, maxWidth: '100%', aspectRatio: `${W} / ${H}` }} />
    </ArcadeShell>
  );
};
