import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../../../utils/sound';
import { ArcadeShell, overlay, useBest } from './games/ArcadeShell';

/* Classic falling-block puzzle: 7-bag, ghost piece, hold, 3 next pieces, wall kicks */
const COLS = 10;
const ROWS = 20;
const CELL = 28;
const SIDE = 128;
const W = COLS * CELL + SIDE * 2;
const H = ROWS * CELL;

type P = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
const SHAPES: Record<P, number[][]> = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};
const COLOR: Record<P, string> = {
  I: '#3ee0ff', O: '#ffd83a', T: '#b36bff', S: '#5ee05a', Z: '#ff4f5e', J: '#3f7bff', L: '#ff9a2e',
};
const LINE_SCORE = [0, 100, 300, 500, 800];

const rotate = (m: number[][]) => m[0].map((_, i) => m.map((r) => r[i]).reverse());
const shade = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(a >= 0 ? c + (255 - c) * a : c * (1 + a))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

interface Piece { t: P; m: number[][]; x: number; y: number }

export const TetrisGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [best, saveBest] = useBest('tp_tetris_best');
  const [hud, setHud] = useState({ score: 0, lines: 0, level: 1 });
  const g = useRef({
    board: [] as (P | 0)[][],
    bag: [] as P[],
    queue: [] as P[],
    cur: null as Piece | null,
    hold: null as P | null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    state: 'title' as 'title' | 'play' | 'pause' | 'over',
    dropAcc: 0,
    last: 0,
    flash: [] as number[],
    flashT: 0,
  });

  const nextType = () => {
    const s = g.current;
    if (!s.bag.length) s.bag = (['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as P[]).sort(() => Math.random() - 0.5);
    return s.bag.pop() as P;
  };
  const collide = (m: number[][], x: number, y: number) => {
    const b = g.current.board;
    for (let r = 0; r < m.length; r++)
      for (let c = 0; c < m[r].length; c++)
        if (m[r][c]) {
          const X = x + c, Y = y + r;
          if (X < 0 || X >= COLS || Y >= ROWS) return true;
          if (Y >= 0 && b[Y][X]) return true;
        }
    return false;
  };
  const spawn = (t?: P) => {
    const s = g.current;
    const type = t ?? (s.queue.shift() as P);
    while (s.queue.length < 3) s.queue.push(nextType());
    const m = SHAPES[type].map((r) => [...r]);
    s.cur = { t: type, m, x: Math.floor((COLS - m[0].length) / 2), y: type === 'I' ? -1 : 0 };
    s.canHold = true;
    if (collide(m, s.cur.x, s.cur.y)) {
      s.state = 'over';
      saveBest(s.score);
      try { soundManager.play('error'); } catch {}
    }
  };
  const start = useCallback(() => {
    const s = g.current;
    s.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    s.bag = []; s.queue = []; s.hold = null; s.score = 0; s.lines = 0; s.level = 1; s.dropAcc = 0; s.flash = [];
    while (s.queue.length < 3) s.queue.push(nextType());
    spawn();
    s.state = 'play';
    setHud({ score: 0, lines: 0, level: 1 });
    try { soundManager.play('click'); } catch {}
  }, []);

  const lock = () => {
    const s = g.current;
    const p = s.cur!;
    p.m.forEach((row, r) => row.forEach((v, c) => { if (v && p.y + r >= 0) s.board[p.y + r][p.x + c] = p.t; }));
    const full: number[] = [];
    s.board.forEach((row, r) => { if (row.every(Boolean)) full.push(r); });
    if (full.length) {
      s.flash = full; s.flashT = 180;
      s.lines += full.length;
      s.score += LINE_SCORE[full.length] * s.level;
      s.level = Math.floor(s.lines / 10) + 1;
      try { soundManager.play(full.length >= 4 ? 'achievement' : 'success' as any); } catch {}
    }
    setHud({ score: s.score, lines: s.lines, level: s.level });
    s.cur = null;
    if (!full.length) spawn();
  };
  const move = (dx: number) => { const s = g.current; if (s.cur && !collide(s.cur.m, s.cur.x + dx, s.cur.y)) s.cur.x += dx; };
  const turn = (dir: 1 | -1) => {
    const s = g.current; if (!s.cur || s.cur.t === 'O') return;
    let m = rotate(s.cur.m); if (dir < 0) m = rotate(rotate(m));
    for (const k of [0, -1, 1, -2, 2]) if (!collide(m, s.cur.x + k, s.cur.y)) { s.cur.m = m; s.cur.x += k; return; }
    if (!collide(m, s.cur.x, s.cur.y - 1)) { s.cur.m = m; s.cur.y -= 1; }
  };
  const soft = () => { const s = g.current; if (!s.cur) return; if (!collide(s.cur.m, s.cur.x, s.cur.y + 1)) { s.cur.y++; s.score += 1; } else lock(); };
  const hard = () => {
    const s = g.current; if (!s.cur) return;
    let d = 0; while (!collide(s.cur.m, s.cur.x, s.cur.y + 1)) { s.cur.y++; d++; }
    s.score += d * 2; lock();
  };
  const doHold = () => {
    const s = g.current; if (!s.cur || !s.canHold) return;
    const t = s.cur.t; const h = s.hold; s.hold = t;
    spawn(h ?? undefined); s.canHold = false;
  };

  /* input */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const s = g.current;
      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) e.preventDefault();
      if (s.state === 'title' || s.state === 'over') { if (e.key === ' ' || e.key === 'Enter') start(); return; }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { s.state = s.state === 'pause' ? 'play' : 'pause'; return; }
      if (s.state !== 'play' || !s.cur) return;
      if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
      else if (e.key === 'ArrowDown') soft();
      else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') turn(1);
      else if (e.key === 'z' || e.key === 'Z') turn(-1);
      else if (e.key === ' ') hard();
      else if (e.key === 'c' || e.key === 'C' || e.key === 'Shift') doHold();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [start]);

  /* loop + render */
  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    let raf = 0;

    const block = (x: number, y: number, col: string, size = CELL, alpha = 1) => {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col; ctx.fillRect(x, y, size, size);
      ctx.fillStyle = shade(col, 0.45); ctx.fillRect(x, y, size, size * 0.16); ctx.fillRect(x, y, size * 0.16, size);
      ctx.fillStyle = shade(col, -0.35); ctx.fillRect(x, y + size * 0.84, size, size * 0.16); ctx.fillRect(x + size * 0.84, y, size * 0.16, size);
      ctx.fillStyle = shade(col, 0.2); ctx.fillRect(x + size * 0.28, y + size * 0.28, size * 0.44, size * 0.44);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
      ctx.globalAlpha = 1;
    };
    const mini = (t: P | null, cx: number, cy: number, sz = 18) => {
      if (!t) return;
      const m = SHAPES[t];
      const cells: [number, number][] = [];
      m.forEach((r, ri) => r.forEach((v, ci) => v && cells.push([ci, ri])));
      const minX = Math.min(...cells.map((p) => p[0])), maxX = Math.max(...cells.map((p) => p[0]));
      const minY = Math.min(...cells.map((p) => p[1])), maxY = Math.max(...cells.map((p) => p[1]));
      const ox = cx - ((maxX - minX + 1) * sz) / 2, oy = cy - ((maxY - minY + 1) * sz) / 2;
      cells.forEach(([x, y]) => block(ox + (x - minX) * sz, oy + (y - minY) * sz, COLOR[t], sz));
    };
    const panel = (x: number, y: number, w: number, h: number, label: string) => {
      ctx.fillStyle = '#131a4a'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = '#6ff6ff'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
      ctx.fillStyle = '#6ff6ff'; ctx.font = "13px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(label, x + w / 2, y + 8);
    };

    const frame = (ts: number) => {
      const s = g.current;
      const dt = s.last ? Math.min(50, ts - s.last) : 16; s.last = ts;
      if (s.state === 'play') {
        if (s.flash.length) {
          s.flashT -= dt;
          if (s.flashT <= 0) {
            s.flash.sort((a, b) => a - b).forEach((r) => { s.board.splice(r, 1); s.board.unshift(Array(COLS).fill(0)); });
            s.flash = []; spawn();
          }
        } else if (s.cur) {
          s.dropAcc += dt;
          const speed = Math.max(70, 800 - (s.level - 1) * 70);
          if (s.dropAcc > speed) { s.dropAcc = 0; if (!collide(s.cur.m, s.cur.x, s.cur.y + 1)) s.cur.y++; else lock(); }
        }
      }
      // background
      ctx.fillStyle = '#0b0e2a'; ctx.fillRect(0, 0, W, H);
      const bx = SIDE;
      ctx.fillStyle = '#10163d'; ctx.fillRect(bx, 0, COLS * CELL, H);
      ctx.strokeStyle = 'rgba(111,246,255,0.08)'; ctx.lineWidth = 1;
      for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(bx + i * CELL + 0.5, 0); ctx.lineTo(bx + i * CELL + 0.5, H); ctx.stroke(); }
      for (let j = 1; j < ROWS; j++) { ctx.beginPath(); ctx.moveTo(bx, j * CELL + 0.5); ctx.lineTo(bx + COLS * CELL, j * CELL + 0.5); ctx.stroke(); }
      // board
      if (s.board.length) s.board.forEach((row, r) => row.forEach((v, c2) => {
        if (!v) return;
        const fl = s.flash.includes(r);
        block(bx + c2 * CELL, r * CELL, fl ? '#ffffff' : COLOR[v as P]);
      }));
      // ghost + current
      if (s.cur && s.state !== 'title') {
        let gy = s.cur.y; while (!collide(s.cur.m, s.cur.x, gy + 1)) gy++;
        s.cur.m.forEach((row, r) => row.forEach((v, c2) => {
          if (!v) return;
          if (gy + r >= 0) { ctx.strokeStyle = COLOR[s.cur!.t]; ctx.lineWidth = 2; ctx.globalAlpha = 0.6; ctx.strokeRect(bx + (s.cur!.x + c2) * CELL + 3, (gy + r) * CELL + 3, CELL - 6, CELL - 6); ctx.globalAlpha = 1; }
          if (s.cur!.y + r >= 0) block(bx + (s.cur!.x + c2) * CELL, (s.cur!.y + r) * CELL, COLOR[s.cur!.t]);
        }));
      }
      // frame lines
      ctx.strokeStyle = '#6ff6ff'; ctx.lineWidth = 3; ctx.strokeRect(bx - 1.5, -2, COLS * CELL + 3, H + 4);
      // side panels
      panel(12, 12, SIDE - 24, 100, 'HOLD');
      mini(s.hold, SIDE / 2, 70, 20);
      panel(12, 126, SIDE - 24, 190, 'LEVEL');
      ctx.fillStyle = '#ffd700'; ctx.font = "34px 'Galmuri11', monospace"; ctx.textBaseline = 'middle';
      ctx.fillText(String(s.level), SIDE / 2, 176);
      ctx.fillStyle = '#6ff6ff'; ctx.font = "13px 'Galmuri11', monospace"; ctx.fillText('LINES', SIDE / 2, 222);
      ctx.fillStyle = '#ffffff'; ctx.font = "24px 'Galmuri11', monospace"; ctx.fillText(String(s.lines), SIDE / 2, 252);
      ctx.fillStyle = '#6ff6ff'; ctx.font = "11px 'Galmuri11', monospace"; ctx.fillText('SCORE', SIDE / 2, 282);
      ctx.fillStyle = '#ffffff'; ctx.font = "15px 'Galmuri11', monospace"; ctx.fillText(String(s.score), SIDE / 2, 300);
      const nx = SIDE + COLS * CELL + 12;
      panel(nx, 12, SIDE - 24, 250, 'NEXT');
      s.queue.slice(0, 3).forEach((t, i) => mini(t, nx + (SIDE - 24) / 2, 70 + i * 66, i === 0 ? 20 : 16));
      ctx.fillStyle = '#9ec9ff'; ctx.font = "11px 'Galmuri11', monospace"; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ['← → 이동', '↑ / X 회전', '↓ 내리기', 'SPACE 떨구기', 'C 보관', 'P 멈춤'].forEach((t, i) => ctx.fillText(t, nx + 4, 290 + i * 20));
      ctx.textAlign = 'center';
      if (s.state === 'title') overlay(ctx, W, H, 'BLOCK PUZZLE', 'SPACE 로 시작!', '#6ff6ff');
      if (s.state === 'pause') overlay(ctx, W, H, 'PAUSE', 'P 로 계속하기');
      if (s.state === 'over') overlay(ctx, W, H, 'GAME OVER', `점수 ${s.score} · SPACE 다시`, '#ff4f5e');
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tap = (fn: () => void) => () => { const s = g.current; if (s.state !== 'play') { start(); return; } fn(); };

  return (
    <ArcadeShell
      title="테트리스"
      subtitle="CLASSIC FALLING BLOCKS"
      tone="#3ee0ff"
      score={hud.score}
      best={Math.max(best, hud.score)}
      extra={<span className="ac-chip">LV <b>{hud.level}</b></span>}
      onBack={onBack}
      onRestart={start}
      controls={
        <>
          <button className="ac-pad" onClick={tap(() => move(-1))}>◀</button>
          <button className="ac-pad" onClick={tap(() => turn(1))}>⟳</button>
          <button className="ac-pad" onClick={tap(() => move(1))}>▶</button>
          <button className="ac-pad" onClick={tap(soft)}>▼</button>
          <button className="ac-pad ac-pad--wide" onClick={tap(hard)}>DROP</button>
          <button className="ac-pad" onClick={tap(doHold)}>HOLD</button>
        </>
      }
    >
      <canvas ref={cv} style={{ width: W, maxWidth: '100%', aspectRatio: `${W} / ${H}` }} onClick={() => g.current.state !== 'play' && start()} />
    </ArcadeShell>
  );
};
