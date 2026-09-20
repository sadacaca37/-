import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../../../utils/sound';
import { ArcadeShell, overlay, rr, useBest } from './games/ArcadeShell';

/* Endless stair climber: stairs zig-zag left/right. CLIMB keeps direction, TURN flips it.
   A timer bar drains constantly and refills a little on every correct step.
   Visuals: 5 altitude zones (city → clouds → sunset → aurora → space), 3D blocks,
   dust particles, floating score text, combo "FEVER" and a spinning fall. */
const W = 420;
const H = 600;
const STEP_W = 60;
const STEP_H = 30;
const DEPTH = 12;

type Zone = { name: string; top: string; bot: string; block: [string, string, string]; line: string };
const ZONES: Zone[] = [
  { name: '도시', top: '#56c2ff', bot: '#d8f4ff', block: ['#f2b36b', '#c9793a', '#8c4c1e'], line: '#5a2f10' },
  { name: '구름 위', top: '#7fd3ff', bot: '#f4fbff', block: ['#ffffff', '#cfe3f5', '#8fb1cf'], line: '#4b6a8a' },
  { name: '노을', top: '#ff8fb8', bot: '#ffd59a', block: ['#ffd76a', '#e6a93a', '#a86b12'], line: '#6b3f00' },
  { name: '오로라', top: '#1c2a6b', bot: '#5a3fa8', block: ['#8ff7d6', '#3fc9a8', '#1c7d69'], line: '#0b3d33' },
  { name: '우주', top: '#070b24', bot: '#231a55', block: ['#c6a8ff', '#8b6cf0', '#4d33a8'], line: '#1d1052' },
];
const ZONE_LEN = 60;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; c: string; s: number };
type Float = { x: number; y: number; t: string; life: number; c: string };

export const InfiniteStairsGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [best, saveBest] = useBest('tp_stairs_best');
  const [score, setScore] = useState(0);
  const g = useRef({
    state: 'title' as 'title' | 'play' | 'fall',
    stairs: [] as number[],
    idx: 0,
    dir: 1 as 1 | -1,
    time: 1,
    camY: 0,
    camX: 0,
    fallT: 0,
    last: 0,
    hop: 0,
    coins: new Set<number>(),
    got: 0,
    combo: 0,
    lastStepAt: 0,
    fever: 0,
    parts: [] as Particle[],
    floats: [] as Float[],
    shake: 0,
    stars: Array.from({ length: 70 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 1, p: Math.random() * 6 })),
  });

  if ((import.meta as any).env?.DEV) (window as any).__stairs = g;

  const extend = (n: number) => {
    const s = g.current;
    while (s.stairs.length < n) {
      const len = s.stairs.length;
      const prev = s.stairs[len - 1];
      const lastDir = len > 1 ? prev - s.stairs[len - 2] : 1;
      const d = len < 4 || Math.random() < 0.66 ? lastDir : -lastDir;
      s.stairs.push(prev + d);
      if (len > 5 && Math.random() < 0.16) s.coins.add(len);
    }
  };
  const total = () => g.current.idx + g.current.got * 5;

  const start = useCallback(() => {
    const s = g.current;
    s.stairs = [0, 1]; s.coins = new Set(); extend(60);
    s.idx = 0; s.dir = 1; s.time = 1; s.camY = 0; s.camX = 0; s.state = 'play'; s.hop = 0; s.got = 0;
    s.combo = 0; s.fever = 0; s.parts = []; s.floats = []; s.shake = 0;
    setScore(0);
    try { soundManager.play('click'); } catch {}
  }, []);

  const die = () => {
    const s = g.current;
    s.state = 'fall'; s.fallT = 0; s.shake = 10;
    saveBest(total());
    try { soundManager.play('error'); } catch {}
  };

  const step = useCallback((turn: boolean) => {
    const s = g.current;
    if (s.state !== 'play') { if (s.state === 'title' || s.fallT > 700) start(); return; }
    if (turn) s.dir = (s.dir * -1) as 1 | -1;
    const need = s.stairs[s.idx + 1] - s.stairs[s.idx];
    if (need !== s.dir) { die(); return; }
    const now = performance.now();
    s.combo = now - s.lastStepAt < 260 ? s.combo + 1 : 0;
    s.lastStepAt = now;
    if (s.combo === 25) { s.fever = 4000; s.floats.push({ x: W / 2, y: H / 2 - 60, t: 'FEVER!', life: 1, c: '#ff4fa3' }); }
    s.idx++; s.hop = 1;
    const refill = s.fever > 0 ? 0.11 : 0.08;
    s.time = Math.min(1, s.time + refill - Math.min(0.045, s.idx * 0.00035));
    // dust puff under the feet
    for (let i = 0; i < 6; i++) s.parts.push({ x: W / 2 + (Math.random() - 0.5) * 30, y: H - 170, vx: (Math.random() - 0.5) * 2.4, vy: -Math.random() * 1.6, life: 1, c: 'rgba(255,255,255,0.9)', s: 3 + Math.random() * 3 });
    if (s.coins.has(s.idx)) {
      s.coins.delete(s.idx); s.got++; s.time = Math.min(1, s.time + 0.12);
      s.floats.push({ x: W / 2, y: H - 230, t: '+5', life: 1, c: '#ffd700' });
      for (let i = 0; i < 12; i++) s.parts.push({ x: W / 2, y: H - 210, vx: Math.cos(i) * 3, vy: Math.sin(i) * 3 - 1, life: 1, c: '#ffe14d', s: 3 });
      try { soundManager.play('success' as any); } catch {}
    } else {
      try { soundManager.play('pop' as any); } catch {}
    }
    if (s.idx % ZONE_LEN === 0) s.floats.push({ x: W / 2, y: H / 2 - 20, t: `${ZONES[Math.min(ZONES.length - 1, s.idx / ZONE_LEN)].name} 도착!`, life: 1.4, c: '#ffffff' });
    extend(s.idx + 40);
    setScore(total());
  }, [start, saveBest]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp'].includes(e.key)) e.preventDefault();
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === 'j' || k === 'arrowup') step(false);
      else if (k === 'arrowleft' || k === 'f') step(true);
      else if (k === ' ' || k === 'enter') { const s = g.current; if (s.state === 'title' || (s.state === 'fall' && s.fallT > 700)) start(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [step, start]);

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    let raf = 0;

    const zoneAt = (i: number) => {
      const z = i / ZONE_LEN;
      const a = Math.min(ZONES.length - 1, Math.floor(z));
      const b = Math.min(ZONES.length - 1, a + 1);
      const t = a === b ? 0 : Math.max(0, Math.min(1, (z - a - 0.75) / 0.25));
      return { a: ZONES[a], b: ZONES[b], t };
    };

    const drawBlock = (x: number, y: number, i: number, coin: boolean, ts: number) => {
      const zi = Math.min(ZONES.length - 1, Math.floor(i / ZONE_LEN));
      const [top, front, side] = ZONES[zi].block;
      const line = ZONES[zi].line;
      // side (depth) face
      ctx.fillStyle = side;
      ctx.beginPath(); ctx.moveTo(x + STEP_W, y); ctx.lineTo(x + STEP_W + DEPTH, y - DEPTH * 0.6); ctx.lineTo(x + STEP_W + DEPTH, y + STEP_H - DEPTH * 0.6); ctx.lineTo(x + STEP_W, y + STEP_H); ctx.closePath(); ctx.fill();
      // top face
      ctx.fillStyle = top;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + DEPTH, y - DEPTH * 0.6); ctx.lineTo(x + STEP_W + DEPTH, y - DEPTH * 0.6); ctx.lineTo(x + STEP_W, y); ctx.closePath(); ctx.fill();
      // front face
      ctx.fillStyle = front; ctx.fillRect(x, y, STEP_W, STEP_H);
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, STEP_W, 4);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      if (zi === 0) { ctx.fillRect(x + STEP_W / 2 - 1, y + 4, 2, 12); ctx.fillRect(x, y + 15, STEP_W, 2); ctx.fillRect(x + 15, y + 17, 2, 13); ctx.fillRect(x + 44, y + 17, 2, 13); }
      else if (zi === 1) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x + 12, y + STEP_H, 10, Math.PI, 0); ctx.arc(x + 32, y + STEP_H, 12, Math.PI, 0); ctx.arc(x + 50, y + STEP_H, 9, Math.PI, 0); ctx.fill(); }
      else if (zi === 2) { ctx.fillRect(x + 8, y + 10, STEP_W - 16, 3); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 6, y + 6, 6, 3); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x + 6, y + 7, 4, 4); ctx.fillRect(x + STEP_W - 14, y + 16, 3, 3); ctx.fillStyle = zi === 4 ? 'rgba(255,120,240,0.5)' : 'rgba(255,255,255,0.3)'; ctx.fillRect(x, y + STEP_H - 5, STEP_W, 2); }
      ctx.strokeStyle = line; ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, STEP_W - 2, STEP_H - 2);
      if (coin) {
        const cy = y - 24 + Math.sin(ts / 180 + i) * 4;
        const sq = Math.abs(Math.cos(ts / 260 + i));
        ctx.fillStyle = 'rgba(255,215,0,0.3)'; ctx.beginPath(); ctx.arc(x + STEP_W / 2, cy, 15, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffc400'; ctx.beginPath(); ctx.ellipse(x + STEP_W / 2, cy, 10 * sq + 2, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 2; ctx.stroke();
        if (sq > 0.4) { ctx.fillStyle = '#fff59d'; ctx.fillRect(x + STEP_W / 2 - 2, cy - 6, 3, 10); }
      }
    };

    const drawHero = (x: number, y: number, dir: number, ts: number, legs: number, spin: number, fever: boolean) => {
      ctx.save(); ctx.translate(x, y);
      if (spin) ctx.rotate(spin);
      if (dir < 0) ctx.scale(-1, 1);
      const bob = Math.sin(ts / 110) * 1.2;
      if (fever) { ctx.fillStyle = 'rgba(255,79,163,0.25)'; ctx.beginPath(); ctx.arc(0, -34, 34 + Math.sin(ts / 60) * 3, 0, Math.PI * 2); ctx.fill(); }
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#1b2340';
      // cape
      ctx.fillStyle = fever ? '#ff4fa3' : '#ff4757';
      ctx.beginPath(); ctx.moveTo(-10, -32 + bob); ctx.quadraticCurveTo(-26, -18 + Math.sin(ts / 90) * 4, -22, -6); ctx.lineTo(-6, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
      // legs (alternate each step)
      ctx.fillStyle = '#1b2340';
      const l = legs ? 4 : -4;
      rr(ctx, -9 + l, -14, 7, 14, 2); ctx.fill(); rr(ctx, 2 - l, -14, 7, 14, 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-10 + l, -3, 9, 4); ctx.fillRect(1 - l, -3, 9, 4);
      // body
      ctx.fillStyle = '#38b6ff'; rr(ctx, -13, -36 + bob, 26, 24, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd700'; ctx.fillRect(-3, -32 + bob, 6, 6);
      // head
      ctx.fillStyle = '#ffe0bd'; ctx.beginPath(); ctx.arc(0, -48 + bob, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // helmet
      ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, -51 + bob, 15, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6b0'; ctx.fillRect(-9, -60 + bob, 6, 3);
      ctx.fillStyle = '#ff4757'; ctx.beginPath(); ctx.arc(0, -66 + bob, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // face
      ctx.fillStyle = '#1b2340';
      if (spin) { ctx.fillRect(3, -49 + bob, 5, 2); ctx.fillRect(-5, -49 + bob, 5, 2); }
      else { ctx.fillRect(4, -50 + bob, 3, 5); ctx.fillRect(-3, -50 + bob, 3, 5); }
      ctx.fillStyle = '#ff8ab3'; ctx.fillRect(8, -44 + bob, 4, 2); ctx.fillRect(-7, -44 + bob, 4, 2);
      ctx.restore();
    };

    const skyline = (baseY: number, col: string, seed: number, scale: number) => {
      ctx.fillStyle = col;
      let x = -20;
      let k = seed;
      while (x < W + 20) {
        k = (k * 9301 + 49297) % 233280;
        const bw = 26 + (k % 40) * scale;
        const bh = 60 + (k % 120) * scale;
        ctx.fillRect(x, baseY - bh, bw, bh + 400);
        if (scale > 0.8) { ctx.fillStyle = 'rgba(255,240,150,0.55)'; for (let wy = baseY - bh + 10; wy < baseY - 8; wy += 16) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if ((wx * 7 + wy) % 5 < 3) ctx.fillRect(wx, wy, 5, 7); ctx.fillStyle = col; }
        x += bw + 4;
      }
    };

    const frame = (ts: number) => {
      const s = g.current;
      const dt = s.last ? Math.min(50, ts - s.last) : 16; s.last = ts;
      if (s.state === 'play') {
        const drain = s.fever > 0 ? 0.00008 : 0.00016 + Math.min(0.00024, s.idx * 0.0000025);
        s.time -= dt * drain;
        if (s.fever > 0) s.fever -= dt;
        if (s.time <= 0) { s.time = 0; die(); }
      }
      if (s.state === 'fall') s.fallT += dt;
      s.hop = Math.max(0, s.hop - dt / 120);
      s.shake = Math.max(0, s.shake - dt / 40);

      const height = s.idx * STEP_H;
      s.camY += (height - s.camY) * 0.2;
      const heroCol = s.stairs.length ? s.stairs[s.idx] : 0;
      s.camX += (heroCol - s.camX) * 0.25;

      ctx.save();
      if (s.shake) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);

      // ---- sky ----
      const { a, b, t } = zoneAt(s.idx);
      const grd = ctx.createLinearGradient(0, 0, 0, H);
      grd.addColorStop(0, mix(a.top, b.top, t)); grd.addColorStop(1, mix(a.bot, b.bot, t));
      ctx.fillStyle = grd; ctx.fillRect(-20, -20, W + 40, H + 40);
      const alt = s.idx / ZONE_LEN;
      // stars (fade in from aurora onwards)
      const starA = Math.max(0, Math.min(1, alt - 2.6));
      if (starA > 0) {
        for (const st of s.stars) {
          const y = (st.y + s.camY * 0.05) % H;
          ctx.globalAlpha = starA * (0.5 + 0.5 * Math.sin(ts / 400 + st.p));
          ctx.fillStyle = '#ffffff'; ctx.fillRect(st.x, y, st.s, st.s);
        }
        ctx.globalAlpha = 1;
      }
      // sun / moon / planet
      if (alt < 2.5) {
        ctx.fillStyle = alt < 1.8 ? 'rgba(255,245,170,0.9)' : 'rgba(255,190,120,0.95)';
        ctx.beginPath(); ctx.arc(W - 70, 90 + alt * 40, 30, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,245,170,0.25)'; ctx.beginPath(); ctx.arc(W - 70, 90 + alt * 40, 46, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = '#ffb86b'; ctx.beginPath(); ctx.arc(80, 110, 34, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,230,180,0.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(80, 110, 58, 12, -0.3, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#e8e8f5'; ctx.beginPath(); ctx.arc(W - 70, 70, 16, 0, Math.PI * 2); ctx.fill();
      }
      // aurora ribbons
      if (alt > 2.7 && alt < 4.3) {
        ctx.globalAlpha = 0.35;
        for (let r = 0; r < 3; r++) {
          ctx.fillStyle = ['#5dffc9', '#7aa8ff', '#e07bff'][r];
          ctx.beginPath(); ctx.moveTo(0, 150 + r * 30);
          for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 140 + r * 30 + Math.sin(x / 50 + ts / 900 + r) * 18);
          ctx.lineTo(W, 190 + r * 30); ctx.lineTo(0, 190 + r * 30); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // city skyline (only near ground, scrolls away)
      const groundY = H - 120 + s.camY * 0.9;
      if (groundY - 260 < H) {
        skyline(H - 150 + s.camY * 0.35, 'rgba(120,150,200,0.45)', 7, 0.6);
        skyline(groundY - 20, '#3d4f7a', 3, 1);
        ctx.fillStyle = '#6cc04a'; ctx.fillRect(0, groundY, W, 400);
        ctx.fillStyle = '#4e9a32'; ctx.fillRect(0, groundY, W, 6);
      }
      // clouds (parallax)
      if (alt < 3) {
        for (let i = 0; i < 6; i++) {
          const y = ((i * 147 + s.camY * 0.45) % (H + 120)) - 60;
          const x = ((i * 113 + ts * 0.01 * (i % 2 ? 1 : -1)) % (W + 160) + W + 160) % (W + 160) - 80;
          ctx.fillStyle = alt > 1.8 ? 'rgba(255,220,235,0.8)' : 'rgba(255,255,255,0.9)';
          rr(ctx, x - 34, y, 80, 20, 10); ctx.fill(); rr(ctx, x - 12, y - 12, 40, 22, 11); ctx.fill();
        }
      }

      // ---- stairs ----
      const baseY = H - 170;
      const from = Math.max(0, s.idx - 8), to = Math.min(s.stairs.length - 1, s.idx + 22);
      for (let i = to; i >= from; i--) {
        const x = W / 2 - STEP_W / 2 + (s.stairs[i] - s.camX) * STEP_W;
        const y = baseY - (i * STEP_H - s.camY);
        if (y < -60 || y > H + 40) continue;
        drawBlock(x, y, i, s.coins.has(i), ts);
      }

      // ---- hero ----
      let hx = W / 2 + (heroCol - s.camX) * STEP_W, hy = baseY - (s.idx * STEP_H - s.camY) - s.hop * 12;
      let spin = 0;
      if (s.state === 'fall') { hy += (s.fallT / 4) ** 1.35; hx += s.dir * s.fallT * 0.1; spin = s.dir * s.fallT / 120; }
      if (s.stairs.length) drawHero(hx, hy, s.dir, ts, s.idx % 2, spin, s.fever > 0);

      // ---- particles & floats ----
      s.parts = s.parts.filter((p) => (p.life -= dt / 600) > 0);
      for (const p of s.parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; ctx.globalAlpha = p.life; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
      ctx.globalAlpha = 1;
      s.floats = s.floats.filter((f) => (f.life -= dt / 900) > 0);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const f of s.floats) {
        f.y -= 0.6; ctx.globalAlpha = Math.min(1, f.life * 1.5);
        ctx.font = "26px 'Galmuri11', monospace"; ctx.lineWidth = 5; ctx.strokeStyle = '#1b2340';
        ctx.strokeText(f.t, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.t, f.x, f.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // ---- HUD ----
      ctx.fillStyle = 'rgba(27,35,64,0.85)'; rr(ctx, 16, 14, W - 32, 26, 8); ctx.fill();
      const tc = s.fever > 0 ? '#ff4fa3' : s.time > 0.5 ? '#5ee05a' : s.time > 0.25 ? '#ffd83a' : '#ff4f5e';
      const tw = Math.max(0, (W - 44) * s.time);
      ctx.fillStyle = tc; rr(ctx, 22, 19, tw, 16, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; if (tw > 8) { rr(ctx, 24, 20, tw - 4, 5, 2); ctx.fill(); }
      if (s.time < 0.25 && s.state === 'play' && Math.floor(ts / 150) % 2) { ctx.strokeStyle = '#ff4f5e'; ctx.lineWidth = 3; rr(ctx, 16, 14, W - 32, 26, 8); ctx.stroke(); }

      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.font = "44px 'Galmuri11', monospace";
      ctx.lineWidth = 7; ctx.strokeStyle = '#1b2340'; ctx.strokeText(String(s.idx), W / 2, 52);
      ctx.fillStyle = '#ffffff'; ctx.fillText(String(s.idx), W / 2, 52);
      ctx.font = "13px 'Galmuri11', monospace";
      const zn = ZONES[Math.min(ZONES.length - 1, Math.floor(s.idx / ZONE_LEN))].name;
      ctx.fillStyle = 'rgba(27,35,64,0.75)'; rr(ctx, W / 2 - 46, 100, 92, 20, 10); ctx.fill();
      ctx.fillStyle = '#ffe14d'; ctx.fillText(`◆ ${zn}`, W / 2, 104);
      // coins & combo
      ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(27,35,64,0.75)'; rr(ctx, 16, 50, 70, 24, 12); ctx.fill();
      ctx.fillStyle = '#ffc400'; ctx.beginPath(); ctx.arc(30, 62, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = "14px 'Galmuri11', monospace"; ctx.fillText(`×${s.got}`, 42, 55);
      if (s.combo >= 5 && s.state === 'play') {
        ctx.textAlign = 'right'; ctx.font = "18px 'Galmuri11', monospace";
        ctx.lineWidth = 4; ctx.strokeStyle = '#1b2340'; ctx.strokeText(`${s.combo} COMBO`, W - 18, 54);
        ctx.fillStyle = s.fever > 0 ? '#ff4fa3' : '#7ff0ff'; ctx.fillText(`${s.combo} COMBO`, W - 18, 54);
      }

      if (s.state === 'title') overlay(ctx, W, H, '무한의 계단', 'SPACE · 버튼으로 시작  /  빠르게 25콤보 = FEVER', '#ffd700');
      if (s.state === 'fall' && s.fallT > 700) overlay(ctx, W, H, `${s.idx} 계단!`, `코인 ${s.got}개 · SPACE 다시 도전`, '#ff9ac2');
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveBest]);

  return (
    <ArcadeShell
      title="무한의 계단"
      subtitle="CLIMB · TURN · FEVER"
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
