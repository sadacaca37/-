import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../../../utils/sound';
import { ArcadeShell, useBest } from './games/ArcadeShell';

/* The classic 4x4 sliding-number puzzle with animated sliding tiles, merge pops, swipe & undo. */
type Tile = { id: number; v: number; r: number; c: number; merged?: boolean; isNew?: boolean; pop?: number };
const N = 4;
const COLORS: Record<number, [string, string]> = {
  2: ['#eee4da', '#776e65'], 4: ['#ede0c8', '#776e65'], 8: ['#f2b179', '#f9f6f2'], 16: ['#f59563', '#f9f6f2'],
  32: ['#f67c5f', '#f9f6f2'], 64: ['#f65e3b', '#f9f6f2'], 128: ['#edcf72', '#f9f6f2'], 256: ['#edcc61', '#f9f6f2'],
  512: ['#edc850', '#f9f6f2'], 1024: ['#edc53f', '#f9f6f2'], 2048: ['#edc22e', '#f9f6f2'],
};
let uid = 1;

const empties = (all: Tile[]) => {
  const tiles = all.filter((t) => !t.merged);
  const out: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!tiles.some((t) => t.r === r && t.c === c)) out.push([r, c]);
  return out;
};
const addRandom = (tiles: Tile[]) => {
  const e = empties(tiles);
  if (!e.length) return tiles;
  const [r, c] = e[Math.floor(Math.random() * e.length)];
  return [...tiles, { id: uid++, v: Math.random() < 0.9 ? 2 : 4, r, c, isNew: true }];
};
const canMove = (tiles: Tile[]) => {
  if (tiles.length < N * N) return true;
  const at = (r: number, c: number) => tiles.find((t) => t.r === r && t.c === c)?.v;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const v = at(r, c); if (v === at(r, c + 1) || v === at(r + 1, c)) return true; }
  return false;
};

export const Game2048: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [best, saveBest] = useBest('tp_2048_best');
  const [over, setOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepGoing, setKeepGoing] = useState(false);
  const hist = useRef<{ tiles: Tile[]; score: number } | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const tilesRef = useRef<Tile[]>([]);
  tilesRef.current = tiles;

  const start = useCallback(() => {
    uid = 1;
    setTiles(addRandom(addRandom([])));
    setScore(0); setOver(false); setWon(false); setKeepGoing(false); hist.current = null;
  }, []);
  useEffect(() => { start(); }, [start]);

  const move = useCallback((dir: 'L' | 'R' | 'U' | 'D') => {
    if (over || (won && !keepGoing)) return;
    {
      const prev = tilesRef.current;
      const cur = prev.filter((t) => !t.merged).map((t) => ({ ...t, isNew: false, pop: undefined }));
      const horiz = dir === 'L' || dir === 'R';
      const fwd = dir === 'L' || dir === 'U';
      let gained = 0; let moved = false;
      const next: Tile[] = [];
      for (let line = 0; line < N; line++) {
        const cells = cur
          .filter((t) => (horiz ? t.r === line : t.c === line))
          .sort((a, b) => (fwd ? 1 : -1) * ((horiz ? a.c : a.r) - (horiz ? b.c : b.r)));
        const placed: Tile[] = [];
        for (const t of cells) {
          const last = placed[placed.length - 1];
          if (last && last.v === t.v && !last.pop) {
            last.v *= 2; last.pop = uid++; gained += last.v; moved = true;
            next.push({ ...t, r: last.r, c: last.c, merged: true }); // ghost slides under, then disappears
            continue;
          }
          const idx = fwd ? placed.length : N - 1 - placed.length;
          const nt: Tile = horiz ? { ...t, r: line, c: idx } : { ...t, r: idx, c: line };
          if (nt.r !== t.r || nt.c !== t.c) moved = true;
          placed.push(nt);
        }
        next.push(...placed);
      }
      if (!moved) return;
      hist.current = { tiles: prev.filter((t) => !t.merged), score };
      const withNew = addRandom(next);
      if (gained) {
        setScore((sc) => { const ns = sc + gained; saveBest(ns); return ns; });
        try { soundManager.play('pop' as any); } catch {}
      }
      const alive = withNew.filter((t) => !t.merged);
      if (alive.some((t) => t.v >= 2048) && !won) setWon(true);
      if (!canMove(alive)) setOver(true);
      tilesRef.current = withNew;
      setTiles(withNew);
    }
  }, [over, won, keepGoing, score, saveBest]);

  // drop merged "ghost" tiles after the slide animation
  useEffect(() => {
    if (!tiles.some((t) => t.merged)) return;
    const id = window.setTimeout(() => setTiles((ts) => ts.filter((t) => !t.merged)), 130);
    return () => window.clearTimeout(id);
  }, [tiles]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const m: Record<string, 'L' | 'R' | 'U' | 'D'> = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D' };
      const d = m[e.key];
      if (d) { e.preventDefault(); move(d); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [move]);

  const undo = () => { if (hist.current) { setTiles(hist.current.tiles); setScore(hist.current.score); setOver(false); hist.current = null; } };
  const size = 'min(92vw, 440px)';

  return (
    <ArcadeShell
      title="2048 퍼즐"
      subtitle="SLIDE · MERGE · 2048"
      tone="#edc22e"
      score={score}
      best={Math.max(best, score)}
      extra={<button className="ac-chip ac-chip--btn" onClick={undo} disabled={!hist.current}>↶ 되돌리기</button>}
      onBack={onBack}
      onRestart={start}
      controls={
        <>
          <button className="ac-pad" onClick={() => move('L')}>◀</button>
          <button className="ac-pad" onClick={() => move('U')}>▲</button>
          <button className="ac-pad" onClick={() => move('D')}>▼</button>
          <button className="ac-pad" onClick={() => move('R')}>▶</button>
        </>
      }
    >
      <div
        className="g48"
        style={{ width: size, height: size }}
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x, dy = e.changedTouches[0].clientY - touch.current.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : dy > 0 ? 'D' : 'U');
          touch.current = null;
        }}
      >
        {Array.from({ length: N * N }).map((_, i) => (
          <div key={i} className="g48-cell" style={{ left: `calc(${(i % N) * 25}% + 6px)`, top: `calc(${Math.floor(i / N) * 25}% + 6px)` }} />
        ))}
        {tiles.map((t) => {
          const [bg, fg] = COLORS[t.v] || ['#3c3a32', '#f9f6f2'];
          const fs = t.v < 100 ? 44 : t.v < 1000 ? 36 : 28;
          return (
            <div
              key={t.id}
              className={`g48-tile ${t.isNew ? 'is-new' : ''} ${t.pop ? 'is-pop' : ''}`}
              style={{
                left: `calc(${t.c * 25}% + 6px)`,
                top: `calc(${t.r * 25}% + 6px)`,
                background: bg,
                color: fg,
                fontSize: `clamp(18px, ${fs / 4.4}vw, ${fs}px)`,
                zIndex: t.merged ? 1 : 2,
                boxShadow: t.v >= 128 ? `0 0 ${Math.min(30, Math.log2(t.v) * 3)}px rgba(243,215,116,0.6)` : undefined,
              }}
            >
              {t.v}
            </div>
          );
        })}
        {(over || (won && !keepGoing)) && (
          <div className={`g48-over ${won && !over ? 'is-win' : ''}`}>
            <b>{won && !over ? 'YOU WIN!' : 'GAME OVER'}</b>
            <span>{score}점</span>
            <div className="flex gap-2">
              {won && !over && <button onClick={() => setKeepGoing(true)}>계속하기</button>}
              <button onClick={start}>다시 하기</button>
            </div>
          </div>
        )}
      </div>
    </ArcadeShell>
  );
};
