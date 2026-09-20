import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArcadeShell, overlay, rr, useBest } from './ArcadeShell';

/* 1945-style vertical scrolling shooter.
   Ocean + islands scroll underneath, the twin-boom fighter auto-fires, enemies come in waves
   (V formations, side sweeps, gun boats, heavy bombers) and a giant bomber boss closes each stage.
   Controls: arrows/WASD move · X/B bomb · P pause · drag on touch screens. */

const W = 432;
const H = 640;
const SCROLL = 1.1;

type Bullet = { x: number; y: number; vx: number; vy: number; r: number; dmg?: number };
type Kind = 'fighter' | 'zero' | 'bomber' | 'boat' | 'boss';
type Enemy = {
  kind: Kind; x: number; y: number; vx: number; vy: number; hp: number; max: number; t: number;
  cd: number; score: number; w: number; h: number; sway?: number; baseX?: number; hit: number; phase?: number; drop?: 'P' | 'B' | 'M';
};
type Item = { x: number; y: number; kind: 'P' | 'B' | 'M'; t: number; vx: number; vy: number };
type Boom = { x: number; y: number; t: number; size: number };
type Spark = { x: number; y: number; vx: number; vy: number; life: number; c: string };

const newState = () => ({
  state: 'title' as 'title' | 'play' | 'over' | 'clear' | 'pause',
  px: W / 2, py: H - 90, inv: 0, power: 1, bombs: 2, lives: 3, fireCd: 0,
  shots: [] as Bullet[], eshots: [] as Bullet[], enemies: [] as Enemy[], items: [] as Item[],
  booms: [] as Boom[], sparks: [] as Spark[],
  queue: [] as { at: number; fn: () => void }[],
  t: 0, waveCd: 1.5, stage: 1, boss: null as Enemy | null, warn: 0, clearT: 0,
  score: 0, flash: 0, shake: 0, scroll: 0,
  islands: Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * W, y: i * 200 - 100, r: 40 + Math.random() * 40, s: Math.random() })),
  clouds: Array.from({ length: 5 }, (_, i) => ({ x: Math.random() * W, y: i * 150, w: 90 + Math.random() * 80 })),
  keys: new Set<string>(),
  last: 0,
});

export const AirplaneShootingGame: React.FC<{ onBack?: () => void; currentUser?: any }> = ({ onBack }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [best, saveBest] = useBest('tp_1945_best');
  const [score, setScore] = useState(0);
  const [hud, setHud] = useState({ lives: 3, bombs: 2, power: 1, stage: 1 });
  const g = useRef(newState());
  const drag = useRef<{ x: number; y: number } | null>(null);
  if ((import.meta as any).env?.DEV) (window as any).__air = g;

  const start = useCallback(() => {
    const keys = g.current.keys;
    g.current = newState();
    g.current.keys = keys;
    g.current.state = 'play';
    setScore(0);
  }, []);

  const bomb = useCallback(() => {
    const s = g.current;
    if (s.state !== 'play' || s.bombs <= 0) return;
    s.bombs--; s.flash = 1; s.shake = 14; s.inv = Math.max(s.inv, 1500);
    s.eshots = [];
    for (const e of s.enemies) { e.hp -= e.kind === 'boss' ? 60 : 40; e.hit = 1; }
    for (let i = 0; i < 10; i++) s.booms.push({ x: Math.random() * W, y: Math.random() * H * 0.8, t: -i * 0.06, size: 30 + Math.random() * 20 });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
      const s = g.current;
      s.keys.add(k);
      if ((k === ' ' || k === 'enter') && (s.state === 'title' || s.state === 'over')) start();
      if ((k === 'x' || k === 'b') && !e.repeat) bomb();
      if (k === 'p' && !e.repeat) s.state = s.state === 'pause' ? 'play' : s.state === 'play' ? 'pause' : s.state;
    };
    const up = (e: KeyboardEvent) => g.current.keys.delete(e.key.toLowerCase());
    const blur = () => g.current.keys.clear();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [start, bomb]);

  useEffect(() => {
    const c = cv.current!;
    const ctx = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    let raf = 0;
    let lastHud = '';
    let lastScoreAt = 0;

    /* ---------------- spawning ---------------- */
    const add = (e: Partial<Enemy> & { kind: Kind; x: number; y: number }) => {
      const s = g.current;
      const lvl = 1 + (s.stage - 1) * 0.35;
      const base: Record<Kind, [number, number, number, number]> = {
        fighter: [2, 100, 30, 26], zero: [2, 150, 30, 26], bomber: [34, 1500, 90, 64], boat: [14, 800, 34, 70], boss: [700, 20000, 240, 150],
      };
      const [hp, sc, w, h] = base[e.kind];
      const HP = Math.round(hp * (e.kind === 'fighter' || e.kind === 'zero' ? 1 : lvl));
      s.enemies.push({ vx: 0, vy: 0, t: 0, cd: 1 + Math.random(), hit: 0, ...e, hp: HP, max: HP, score: sc, w, h } as Enemy);
    };
    const later = (sec: number, fn: () => void) => g.current.queue.push({ at: g.current.t + sec, fn });

    const wave = () => {
      const s = g.current;
      const r = Math.random();
      const sp = 1 + (s.stage - 1) * 0.15;
      if (r < 0.32) {
        const cx = 80 + Math.random() * (W - 160);
        [0, -1, 1, -2, 2].forEach((o, i) => add({ kind: 'fighter', x: cx + o * 34, y: -30 - Math.abs(o) * 26, vy: 2.1 * sp, sway: 0, drop: i === 0 && Math.random() < 0.35 ? 'P' : undefined }));
      } else if (r < 0.58) {
        const left = Math.random() < 0.5;
        const y = 60 + Math.random() * 120;
        for (let i = 0; i < 5; i++) later(i * 0.28, () => add({ kind: 'zero', x: left ? -24 : W + 24, y, vx: (left ? 3 : -3) * sp, vy: 0.5, drop: i === 4 && Math.random() < 0.3 ? 'P' : undefined }));
      } else if (r < 0.72) {
        add({ kind: 'boat', x: 50 + Math.random() * (W - 100), y: -50, vy: SCROLL, drop: 'M' });
      } else if (r < 0.84 && !s.enemies.some((e) => e.kind === 'bomber')) {
        add({ kind: 'bomber', x: 90 + Math.random() * (W - 180), y: -60, vy: 1, drop: Math.random() < 0.5 ? 'B' : 'P' });
      } else {
        const x = 60 + Math.random() * (W - 120);
        for (let i = 0; i < 4; i++) later(i * 0.35, () => add({ kind: 'fighter', x, y: -30, vy: 2.6 * sp, sway: 40 }));
      }
    };

    const aimed = (x: number, y: number, speed: number, spread = 0, n = 1, r = 5) => {
      const s = g.current;
      const a = Math.atan2(s.py - y, s.px - x);
      for (let i = 0; i < n; i++) {
        const aa = a + (i - (n - 1) / 2) * spread;
        s.eshots.push({ x, y, vx: Math.cos(aa) * speed, vy: Math.sin(aa) * speed, r });
      }
    };

    const explode = (x: number, y: number, size: number) => {
      const s = g.current;
      s.booms.push({ x, y, t: 0, size });
      for (let i = 0; i < Math.min(24, size / 2); i++) {
        const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * size / 12;
        s.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, c: Math.random() < 0.5 ? '#ffd23f' : '#ff7a2f' });
      }
    };

    const kill = (e: Enemy) => {
      const s = g.current;
      s.score += e.score;
      explode(e.x, e.y, e.kind === 'boss' ? 120 : e.kind === 'bomber' ? 60 : e.kind === 'boat' ? 45 : 28);
      if (e.drop) s.items.push({ x: e.x, y: e.y, kind: e.drop, t: 0, vx: (Math.random() - 0.5) * 1.5, vy: 1.2 });
      else if (Math.random() < 0.05) s.items.push({ x: e.x, y: e.y, kind: 'P', t: 0, vx: 0.8, vy: 1.2 });
      else if (Math.random() < 0.18) s.items.push({ x: e.x, y: e.y, kind: 'M', t: 0, vx: 0, vy: 1.5 });
      if (e.kind === 'boss') {
        s.boss = null; s.shake = 24; s.flash = 0.8;
        for (let i = 0; i < 8; i++) later(i * 0.15, () => explode(e.x + (Math.random() - 0.5) * 200, e.y + (Math.random() - 0.5) * 100, 60));
        s.eshots = [];
        s.state = 'clear'; s.clearT = 0;
      }
    };

    const playerHit = () => {
      const s = g.current;
      if (s.inv > 0) return;
      explode(s.px, s.py, 50); s.shake = 14;
      s.lives--; s.power = Math.max(1, s.power - 1); s.bombs = Math.max(s.bombs, 2);
      s.eshots = [];
      if (s.lives < 0) { s.lives = 0; s.state = 'over'; saveBest(s.score); return; }
      s.px = W / 2; s.py = H - 90; s.inv = 2600;
    };

    /* ---------------- drawing ---------------- */
    const drawSea = (s: ReturnType<typeof newState>) => {
      const sea = ctx.createLinearGradient(0, 0, 0, H);
      sea.addColorStop(0, '#1b5fa6'); sea.addColorStop(1, '#2d8fd0');
      ctx.fillStyle = sea; ctx.fillRect(-20, -20, W + 40, H + 40);
      ctx.fillStyle = 'rgba(255,255,255,0.13)';
      for (let row = 0; row < 18; row++) {
        const y = ((row * 42 + s.scroll) % (H + 42)) - 21;
        for (let i = 0; i < 6; i++) {
          const x = ((i * 83 + row * 37) % (W + 40)) - 20;
          ctx.fillRect(x, y, 18, 2); ctx.fillRect(x + 5, y + 3, 10, 2);
        }
      }
      for (const il of s.islands) {
        ctx.fillStyle = '#e8d38e'; blob(il.x, il.y, il.r + 8, il.s);
        ctx.fillStyle = '#4caf50'; blob(il.x, il.y, il.r, il.s);
        ctx.fillStyle = '#2e7d32'; blob(il.x - il.r * 0.2, il.y - il.r * 0.15, il.r * 0.55, il.s + 1);
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(il.x - il.r * 0.1, il.y - il.r * 0.3, 4, 4);
      }
    };
    const blob = (x: number, y: number, r: number, seed: number) => {
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const rr2 = r * (0.8 + 0.2 * Math.sin(a * 3 + seed * 6) + 0.08 * Math.cos(a * 5 + seed * 3));
        const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 * 0.75;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    };

    const shadow = (x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = 'rgba(0,20,50,0.28)';
      ctx.beginPath(); ctx.ellipse(x + 16, y + 26, w * 0.45, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    };

    const drawPlayer = (x: number, y: number, t: number) => {
      shadow(x, y, 44, 30);
      ctx.save(); ctx.translate(x, y);
      ctx.strokeStyle = '#1b2a3a'; ctx.lineWidth = 1.6;
      // wings
      ctx.fillStyle = '#b9c9d8'; rr(ctx, -24, -4, 48, 10, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e53935'; ctx.fillRect(-24, -2, 5, 6); ctx.fillRect(19, -2, 5, 6);
      // booms
      ctx.fillStyle = '#d6e1ec';
      rr(ctx, -15, -16, 7, 32, 3); ctx.fill(); ctx.stroke();
      rr(ctx, 8, -16, 7, 32, 3); ctx.fill(); ctx.stroke();
      // tail
      ctx.fillStyle = '#b9c9d8'; rr(ctx, -16, 13, 32, 5, 2); ctx.fill(); ctx.stroke();
      // center pod
      ctx.fillStyle = '#eef3f8'; ctx.beginPath(); ctx.ellipse(0, -3, 6, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#39b6ff'; ctx.beginPath(); ctx.ellipse(0, -6, 3.2, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(-1.5, -10, 1.5, 4);
      // propellers
      const pw = 9 * Math.abs(Math.sin(t / 25));
      ctx.fillStyle = 'rgba(40,40,40,0.55)';
      ctx.beginPath(); ctx.ellipse(-11.5, -18, pw, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(11.5, -18, pw, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      // exhaust flicker
      ctx.fillStyle = Math.floor(t / 60) % 2 ? '#ffd23f' : '#ff8a3d';
      ctx.fillRect(-13, 16, 3, 3 + Math.random() * 3); ctx.fillRect(10, 16, 3, 3 + Math.random() * 3);
      ctx.restore();
    };

    const drawFighter = (e: Enemy, t: number) => {
      shadow(e.x, e.y, 30, 20);
      ctx.save(); ctx.translate(e.x, e.y);
      if (e.kind === 'zero') ctx.rotate(Math.atan2(e.vy, e.vx) - Math.PI / 2);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.4;
      const body = e.hit > 0 ? '#ffffff' : e.kind === 'zero' ? '#c9c3a3' : '#4d7a3f';
      ctx.fillStyle = body; rr(ctx, -16, -2, 32, 8, 3); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      rr(ctx, -8, -13, 16, 4, 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffcf33'; ctx.fillRect(-14, 0, 4, 4); ctx.fillRect(10, 0, 4, 4);
      ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.ellipse(0, 4, 2.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(40,40,40,0.5)'; ctx.beginPath(); ctx.ellipse(0, 14, 8 * Math.abs(Math.sin(t / 20)), 1.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawBomber = (e: Enemy, t: number) => {
      shadow(e.x, e.y, 100, 60);
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
      const c = e.hit > 0 ? '#ffffff' : '#6b7b5a';
      ctx.fillStyle = c; rr(ctx, -46, -6, 92, 18, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 32, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      rr(ctx, -20, -30, 40, 8, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#4a573d';
      for (const ex of [-34, -18, 18, 34]) { rr(ctx, ex - 4, 6, 8, 14, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(30,30,30,0.5)'; ctx.beginPath(); ctx.ellipse(ex, 21, 7 * Math.abs(Math.sin(t / 22 + ex)), 1.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#4a573d'; }
      ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.ellipse(0, 22, 5, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffcf33'; ctx.fillRect(-42, 0, 8, 6); ctx.fillRect(34, 0, 8, 6);
      ctx.restore();
      hpBar(e.x - 36, e.y - 40, 72, e.hp / e.max);
    };

    const drawBoat = (e: Enemy) => {
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.moveTo(-14, 34); ctx.lineTo(-30, 70); ctx.lineTo(-20, 70); ctx.lineTo(0, 36); ctx.lineTo(20, 70); ctx.lineTo(30, 70); ctx.lineTo(14, 34); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
      ctx.fillStyle = e.hit > 0 ? '#ffffff' : '#8a939c';
      ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(15, -18); ctx.lineTo(15, 30); ctx.lineTo(-15, 30); ctx.lineTo(-15, -18); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6d757d'; rr(ctx, -8, 2, 16, 18, 3); ctx.fill(); ctx.stroke();
      const s = g.current;
      const a = Math.atan2(s.py - e.y, s.px - e.x);
      ctx.fillStyle = '#4a5157'; ctx.beginPath(); ctx.arc(0, -10, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.save(); ctx.rotate(a - Math.PI / 2); ctx.fillRect(-2, 0, 4, 16); ctx.restore();
      ctx.restore();
    };

    const drawBoss = (e: Enemy, t: number) => {
      shadow(e.x, e.y, 260, 150);
      ctx.save(); ctx.translate(e.x, e.y);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2.5;
      const c = e.hit > 0.5 ? '#8794a0' : '#5b6770';
      // main wing
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(-120, 0); ctx.lineTo(-100, -18); ctx.lineTo(100, -18); ctx.lineTo(120, 0); ctx.lineTo(100, 18); ctx.lineTo(-100, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
      // fuselage
      ctx.beginPath(); ctx.ellipse(0, 0, 22, 72, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      rr(ctx, -46, -66, 92, 14, 5); ctx.fill(); ctx.stroke();
      // engines
      for (const ex of [-88, -56, 56, 88]) {
        ctx.fillStyle = '#3f474e'; rr(ctx, ex - 9, 6, 18, 30, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(30,30,30,0.55)'; ctx.beginPath(); ctx.ellipse(ex, 38, 14 * Math.abs(Math.sin(t / 18 + ex)), 2.2, 0, 0, Math.PI * 2); ctx.fill();
      }
      // stripes & cockpit
      ctx.fillStyle = '#d32f2f'; ctx.fillRect(-116, -4, 20, 8); ctx.fillRect(96, -4, 20, 8);
      ctx.fillStyle = '#ffcf33'; ctx.fillRect(-20, 20, 40, 5);
      ctx.fillStyle = '#8fd3ff'; ctx.beginPath(); ctx.ellipse(0, 50, 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // turrets
      const blink = Math.floor(t / 150) % 2;
      for (const [tx, ty] of [[-70, -2], [70, -2], [-30, 8], [30, 8], [0, 30]]) {
        ctx.fillStyle = blink ? '#ff5252' : '#b71c1c'; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    };

    const hpBar = (x: number, y: number, w: number, p: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, w, 5);
      ctx.fillStyle = p > 0.5 ? '#6ee06a' : p > 0.25 ? '#ffd23f' : '#ff4f5e'; ctx.fillRect(x, y, w * Math.max(0, p), 5);
    };

    const drawItem = (it: Item, t: number) => {
      ctx.save(); ctx.translate(it.x, it.y);
      const col = it.kind === 'P' ? '#e53935' : it.kind === 'B' ? '#2e7d32' : '#f9a825';
      if (it.kind === 'M') {
        const sq = Math.abs(Math.cos(t / 200));
        ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = '#8a5a00'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, 10 * sq + 2, 11, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(0, 0, 16 + Math.sin(t / 120) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        rr(ctx, -13, -10, 26, 20, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = "bold 15px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it.kind, 0, 1);
      }
      ctx.restore();
    };

    /* ---------------- loop ---------------- */
    const frame = (ts: number) => {
      const s = g.current;
      const dt = s.last ? Math.min(50, ts - s.last) : 16; s.last = ts;
      const f = dt / 16.67;
      const playing = s.state === 'play' || s.state === 'clear';

      if (s.state !== 'pause') {
        s.scroll += SCROLL * f;
        for (const il of s.islands) { il.y += SCROLL * f; if (il.y - il.r > H) { il.y = -il.r - Math.random() * 200; il.x = Math.random() * W; il.r = 40 + Math.random() * 45; il.s = Math.random(); } }
        for (const cl of s.clouds) { cl.y += 2.4 * f; if (cl.y > H + 60) { cl.y = -80 - Math.random() * 100; cl.x = Math.random() * W; } }
      }

      if (playing) {
        s.t += dt / 1000;
        // queue
        s.queue = s.queue.filter((q) => { if (q.at <= s.t) { q.fn(); return false; } return true; });
        // waves / boss
        if (s.state === 'play') {
          if (!s.boss && s.t < 58) { s.waveCd -= dt / 1000; if (s.waveCd <= 0) { wave(); s.waveCd = Math.max(0.7, 1.35 - s.stage * 0.1); } }
          if (!s.boss && s.t >= 58 && s.warn === 0) s.warn = 3;
          if (s.warn > 0) { s.warn -= dt / 1000; if (s.warn <= 0) { s.warn = -1; add({ kind: 'boss', x: W / 2, y: -120, vy: 1.2, phase: 0 }); s.boss = s.enemies[s.enemies.length - 1]; } }
        }
        // player movement
        const k = s.keys;
        const sp = 4.6 * f;
        let dx = 0, dy = 0;
        if (k.has('arrowleft') || k.has('a')) dx -= 1;
        if (k.has('arrowright') || k.has('d')) dx += 1;
        if (k.has('arrowup') || k.has('w')) dy -= 1;
        if (k.has('arrowdown') || k.has('s')) dy += 1;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }
        s.px = Math.max(22, Math.min(W - 22, s.px + dx * sp));
        s.py = Math.max(40, Math.min(H - 30, s.py + dy * sp));
        s.inv = Math.max(0, s.inv - dt);
        // auto fire
        s.fireCd -= dt;
        if (s.fireCd <= 0 && s.state === 'play') {
          s.fireCd = 95;
          const P = s.power;
          s.shots.push({ x: s.px - 6, y: s.py - 20, vx: 0, vy: -13, r: 3 }, { x: s.px + 6, y: s.py - 20, vx: 0, vy: -13, r: 3 });
          if (P >= 2) s.shots.push({ x: s.px - 14, y: s.py - 12, vx: -1.6, vy: -12, r: 3 }, { x: s.px + 14, y: s.py - 12, vx: 1.6, vy: -12, r: 3 });
          if (P >= 3) s.shots.push({ x: s.px - 18, y: s.py - 6, vx: 0, vy: -13, r: 3 }, { x: s.px + 18, y: s.py - 6, vx: 0, vy: -13, r: 3 });
          if (P >= 4) s.shots.push({ x: s.px, y: s.py - 26, vx: 0, vy: -15, r: 5, dmg: 2 }, { x: s.px - 20, y: s.py, vx: -3, vy: -11, r: 3 }, { x: s.px + 20, y: s.py, vx: 3, vy: -11, r: 3 });
        }
        // shots
        for (const b of s.shots) { b.x += b.vx * f; b.y += b.vy * f; }
        s.shots = s.shots.filter((b) => b.y > -20 && b.x > -20 && b.x < W + 20);
        for (const b of s.eshots) { b.x += b.vx * f; b.y += b.vy * f; }
        s.eshots = s.eshots.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);

        // enemies
        const hard = 1 + (s.stage - 1) * 0.25;
        for (const e of s.enemies) {
          e.t += dt / 1000; e.hit = Math.max(0, e.hit - dt / 70);
          if (e.kind === 'fighter') {
            if (e.baseX === undefined) e.baseX = e.x;
            e.y += e.vy * f;
            if (e.sway) e.x = e.baseX + Math.sin(e.t * 3) * e.sway;
            e.cd -= dt / 1000;
            if (e.cd <= 0 && e.y > 40 && e.y < H * 0.6) { e.cd = 2.2 / hard + Math.random(); if (Math.random() < 0.55) aimed(e.x, e.y + 10, 3.2 * hard); }
          } else if (e.kind === 'zero') {
            e.x += e.vx * f; e.y += e.vy * f; e.vy += 0.035 * f;
            e.cd -= dt / 1000;
            if (e.cd <= 0 && e.y > 30) { e.cd = 3; aimed(e.x, e.y, 3.4 * hard); }
          } else if (e.kind === 'bomber') {
            if (e.t < 12) { if (e.y < 150) e.y += e.vy * f; e.x += Math.sin(e.t * 0.9) * 0.9 * f; }
            else e.y += 1.4 * f;
            e.cd -= dt / 1000;
            if (e.cd <= 0 && e.y > 60) { e.cd = 1.6 / hard; aimed(e.x, e.y + 30, 3 * hard, 0.22, 5, 5); }
          } else if (e.kind === 'boat') {
            e.y += e.vy * f;
            e.cd -= dt / 1000;
            if (e.cd <= 0 && e.y > 30 && e.y < H - 120) { e.cd = 1.7 / hard; aimed(e.x, e.y - 10, 3.3 * hard, 0.15, 3, 4.5); }
          } else if (e.kind === 'boss') {
            if (e.y < 150) e.y += e.vy * f;
            else {
              e.x = W / 2 + Math.sin(e.t * 0.6) * 90;
              e.cd -= dt / 1000;
              const ph = Math.floor(e.t / 4) % 3;
              if (e.cd <= 0) {
                if (ph === 0) { e.cd = 1.1 / hard; for (let i = 0; i < 13; i++) { const a = Math.PI / 2 + (i - 6) * 0.14; s.eshots.push({ x: e.x, y: e.y + 40, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, r: 5 }); } }
                else if (ph === 1) { e.cd = 0.35 / hard; aimed(e.x - 70, e.y, 4.4, 0.08, 3, 5); aimed(e.x + 70, e.y, 4.4, 0.08, 3, 5); }
                else { e.cd = 0.12 / hard; const a = e.t * 3.1; for (let i = 0; i < 2; i++) { const aa = a + i * Math.PI; s.eshots.push({ x: e.x, y: e.y + 10, vx: Math.cos(aa) * 3, vy: Math.sin(aa) * 3, r: 4.5 }); } }
              }
            }
          }
        }
        // collisions: shots vs enemies
        for (const b of s.shots) {
          for (const e of s.enemies) {
            if (e.hp <= 0) continue;
            if (Math.abs(b.x - e.x) < e.w / 2 && Math.abs(b.y - e.y) < e.h / 2) {
              e.hp -= b.dmg || 1; e.hit = 1;
              s.sparks.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.4, c: '#fff' });
              b.y = -999;
              s.score += 10;
              break;
            }
          }
        }
        for (const e of s.enemies) if (e.hp <= 0 && e.hp > -9999) { kill(e); e.hp = -99999; }
        s.enemies = s.enemies.filter((e) => e.hp > -9999 && e.y < H + 100 && e.x > -80 && e.x < W + 80);

        // player collisions
        if (s.state === 'play') {
          for (const b of s.eshots) if ((b.x - s.px) ** 2 + (b.y - s.py) ** 2 < (b.r + 4) ** 2) { b.y = 9999; playerHit(); break; }
          for (const e of s.enemies) if (e.kind !== 'boat' && Math.abs(e.x - s.px) < e.w / 2 - 4 && Math.abs(e.y - s.py) < e.h / 2 - 4) { if (e.kind !== 'boss') { e.hp = 0; } playerHit(); break; }
        }
        // items
        for (const it of s.items) {
          it.t += dt; it.x += it.vx * f; it.y += it.vy * f;
          if (it.x < 14 || it.x > W - 14) it.vx *= -1;
          const d2 = (it.x - s.px) ** 2 + (it.y - s.py) ** 2;
          if (d2 < 30 * 30) {
            if (it.kind === 'P') { if (s.power < 4) s.power++; else s.score += 1000; }
            else if (it.kind === 'B') s.bombs = Math.min(5, s.bombs + 1);
            else s.score += 500;
            s.sparks.push({ x: it.x, y: it.y, vx: 0, vy: -1, life: 1, c: it.kind === 'P' ? 'P' : it.kind === 'B' ? 'B' : '+500' });
            it.y = 9999;
          }
        }
        s.items = s.items.filter((it) => it.y < H + 30);

        if (s.state === 'clear') { s.clearT += dt; if (s.clearT > 3500) { s.stage++; s.t = 0; s.warn = 0; s.state = 'play'; s.shots = []; } }
      }

      s.flash = Math.max(0, s.flash - dt / 500);
      s.shake = Math.max(0, s.shake - dt / 50);
      for (const b of s.booms) b.t += dt / 650;
      s.booms = s.booms.filter((b) => b.t < 1);
      for (const p of s.sparks) { p.x += p.vx * f; p.y += p.vy * f; p.life -= dt / 700; }
      s.sparks = s.sparks.filter((p) => p.life > 0);

      /* ---- render ---- */
      ctx.save();
      if (s.shake) ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
      drawSea(s);
      for (const e of s.enemies) if (e.kind === 'boat') drawBoat(e);
      for (const it of s.items) drawItem(it, ts);
      for (const e of s.enemies) {
        if (e.kind === 'fighter' || e.kind === 'zero') drawFighter(e, ts);
        else if (e.kind === 'bomber') drawBomber(e, ts);
        else if (e.kind === 'boss') drawBoss(e, ts);
      }
      // player shots
      for (const b of s.shots) {
        ctx.fillStyle = b.dmg ? '#7ff0ff' : '#fff27a';
        rr(ctx, b.x - b.r / 1.5, b.y - 8, (b.r / 1.5) * 2, 16, 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(b.x - 1, b.y - 6, 2, 10);
      }
      if (s.state !== 'over' && s.lives >= 0 && !(s.inv > 0 && Math.floor(ts / 80) % 2)) drawPlayer(s.px, s.py, ts);
      // explosions
      for (const b of s.booms) {
        if (b.t < 0) continue;
        const r = b.size * (0.35 + b.t * 0.8);
        ctx.globalAlpha = 1 - b.t;
        ctx.fillStyle = b.t < 0.35 ? '#fff6b0' : '#ff9f3d';
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = b.t < 0.35 ? '#ffb13d' : 'rgba(90,90,90,0.8)';
        ctx.beginPath(); ctx.arc(b.x, b.y, r * 0.65, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      for (const p of s.sparks) {
        ctx.globalAlpha = Math.max(0, p.life);
        if (p.c.length <= 4 && !p.c.startsWith('#')) {
          ctx.font = "16px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#0b0e2a';
          ctx.strokeText(p.c === 'P' ? 'POWER UP!' : p.c === 'B' ? 'BOMB +1' : p.c, p.x, p.y); ctx.fillStyle = '#fff27a'; ctx.fillText(p.c === 'P' ? 'POWER UP!' : p.c === 'B' ? 'BOMB +1' : p.c, p.x, p.y);
        } else { ctx.fillStyle = p.c; ctx.fillRect(p.x - 2, p.y - 2, 4, 4); }
      }
      ctx.globalAlpha = 1;
      // enemy bullets (on top so they are always readable)
      for (const b of s.eshots) {
        ctx.fillStyle = '#ff3d7f'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe0ec'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 1.5, 0, Math.PI * 2); ctx.fill();
      }
      // clouds over everything
      for (const cl of s.clouds) {
        ctx.fillStyle = 'rgba(255,255,255,0.38)';
        ctx.beginPath(); ctx.ellipse(cl.x, cl.y, cl.w / 2, 26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cl.x - cl.w / 4, cl.y - 14, cl.w / 4, 20, 0, 0, Math.PI * 2); ctx.fill();
      }
      if (s.flash) { ctx.fillStyle = `rgba(255,255,255,${s.flash * 0.8})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();

      // HUD
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.font = "15px 'Galmuri11', monospace"; ctx.lineWidth = 4; ctx.strokeStyle = '#0b0e2a';
      const sc = String(s.score).padStart(7, '0');
      ctx.strokeText(`1UP ${sc}`, 12, 10); ctx.fillStyle = '#ffffff'; ctx.fillText(`1UP ${sc}`, 12, 10);
      ctx.textAlign = 'right'; ctx.strokeText(`STAGE ${s.stage}`, W - 12, 10); ctx.fillStyle = '#7ff0ff'; ctx.fillText(`STAGE ${s.stage}`, W - 12, 10);
      // lives & bombs
      for (let i = 0; i < s.lives; i++) { ctx.save(); ctx.translate(20 + i * 24, H - 22); ctx.scale(0.42, 0.42); ctx.fillStyle = '#d6e1ec'; ctx.strokeStyle = '#1b2a3a'; ctx.lineWidth = 3; rr(ctx, -24, -4, 48, 10, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, -3, 6, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
      for (let i = 0; i < s.bombs; i++) { ctx.fillStyle = '#2e7d32'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; rr(ctx, W - 28 - i * 22, H - 32, 16, 20, 5); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = "11px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.fillText('B', W - 20 - i * 22, H - 28); }
      ctx.textAlign = 'center'; ctx.font = "11px 'Galmuri11', monospace";
      ctx.fillStyle = 'rgba(11,14,42,0.6)'; rr(ctx, W / 2 - 42, H - 30, 84, 18, 9); ctx.fill();
      ctx.fillStyle = '#fff27a'; ctx.fillText(`POWER ${'■'.repeat(s.power)}${'□'.repeat(4 - s.power)}`, W / 2, H - 27);
      if (s.boss) {
        ctx.fillStyle = 'rgba(11,14,42,0.7)'; rr(ctx, 40, 32, W - 80, 12, 6); ctx.fill();
        ctx.fillStyle = '#ff4f5e'; rr(ctx, 42, 34, (W - 84) * Math.max(0, s.boss.hp / s.boss.max), 8, 4); ctx.fill();
      }
      if (s.warn > 0 && Math.floor(ts / 250) % 2) {
        ctx.fillStyle = 'rgba(255,40,60,0.28)'; ctx.fillRect(0, H / 2 - 40, W, 80);
        ctx.font = "34px 'Galmuri11', monospace"; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = '#0b0e2a';
        ctx.strokeText('WARNING!!', W / 2, H / 2); ctx.fillStyle = '#ff4f5e'; ctx.fillText('WARNING!!', W / 2, H / 2);
      }
      if (s.state === 'clear' && s.clearT > 900) {
        ctx.font = "30px 'Galmuri11', monospace"; ctx.textBaseline = 'middle'; ctx.lineWidth = 6; ctx.strokeStyle = '#0b0e2a';
        ctx.strokeText(`STAGE ${s.stage} CLEAR!`, W / 2, H / 2); ctx.fillStyle = '#ffd23f'; ctx.fillText(`STAGE ${s.stage} CLEAR!`, W / 2, H / 2);
      }
      if (s.state === 'title') overlay(ctx, W, H, '1945 공중전', 'SPACE 또는 화면 터치로 출격!', '#7ff0ff');
      if (s.state === 'over') overlay(ctx, W, H, 'GAME OVER', `${s.score}점 · SPACE 다시 출격`, '#ff4f5e');
      if (s.state === 'pause') overlay(ctx, W, H, 'PAUSE', 'P 키로 계속', '#ffffff');

      // sync React HUD (throttled)
      if (ts - lastScoreAt > 120) { lastScoreAt = ts; setScore(s.score); }
      const h = `${s.lives}|${s.bombs}|${s.power}|${s.stage}`;
      if (h !== lastHud) { lastHud = h; setHud({ lives: s.lives, bombs: s.bombs, power: s.power, stage: s.stage }); }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [saveBest]);

  /* touch / mouse drag steering */
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = g.current;
    if (s.state === 'title' || s.state === 'over') { start(); return; }
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const k = W / rect.width;
    const s = g.current;
    s.px = Math.max(22, Math.min(W - 22, s.px + (e.clientX - drag.current.x) * k * 1.2));
    s.py = Math.max(40, Math.min(H - 30, s.py + (e.clientY - drag.current.y) * k * 1.2));
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => { drag.current = null; };

  return (
    <ArcadeShell
      title="1945 공중전"
      subtitle="SHOOT · DODGE · BOMB"
      tone="#7ff0ff"
      score={score}
      best={Math.max(best, score)}
      extra={
        <>
          <span className="ac-chip">STAGE <b>{hud.stage}</b></span>
          <span className="ac-chip">✈ <b>{hud.lives}</b></span>
          <span className="ac-chip">💣 <b>{hud.bombs}</b></span>
        </>
      }
      onBack={onBack}
      onRestart={start}
      controls={
        <>
          <button className="ac-pad ac-pad--big ac-pad--blue" onClick={() => (g.current.state === 'play' ? null : start())}>
            ▶ 출격 <small>(SPACE)</small>
          </button>
          <button className="ac-pad ac-pad--big ac-pad--pink" onClick={bomb}>
            💣 폭탄 <small>(X)</small>
          </button>
        </>
      }
    >
      <canvas
        ref={cv}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{
          width: `min(calc(100vw - 64px), ${W}px, calc((100vh - 190px) * ${(W / H).toFixed(4)}))`,
          minWidth: 240,
          aspectRatio: `${W} / ${H}`,
          touchAction: 'none',
          cursor: 'crosshair',
        }}
      />
    </ArcadeShell>
  );
};
