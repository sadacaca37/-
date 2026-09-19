import React, { useCallback, useEffect, useRef, useState } from 'react';
import { soundManager } from '../../../utils/sound';
import { ArcadeShell, overlay, rr, useBest } from './games/ArcadeShell';

/* Street-stall cooking game: fruits roll along the belt; press SPACE when the fruit the
   order needs is under the skewer. Five fruits → mash SPACE to coat in sugar → serve! */
const W = 720;
const H = 440;
const ZONE_X = 360;
const BELT_Y = 300;

type Kind = 'straw' | 'grape' | 'orange' | 'blue' | 'tomato';
const FRUIT: Record<Kind, { name: string; col: string; dark: string; r: number }> = {
  straw: { name: '딸기', col: '#ff4f6e', dark: '#9c1030', r: 20 },
  grape: { name: '샤인머스캣', col: '#a8e05a', dark: '#4a7a1a', r: 16 },
  orange: { name: '귤', col: '#ffa12e', dark: '#9a5200', r: 21 },
  blue: { name: '블루베리', col: '#5a6cff', dark: '#1f2a8a', r: 14 },
  tomato: { name: '방울토마토', col: '#ff3b3b', dark: '#8a1010', r: 17 },
};
const KINDS = Object.keys(FRUIT) as Kind[];

export const TanghuluGame: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const cv = useRef<HTMLCanvasElement>(null);
  const [best, saveBest] = useBest('tp_tanghulu_best');
  const [score, setScore] = useState(0);
  const g = useRef({
    state: 'title' as 'title' | 'skewer' | 'glaze' | 'serve' | 'over',
    order: [] as Kind[], stick: [] as Kind[],
    belt: [] as { x: number; k: Kind; hit?: number }[],
    spawn: 0, speed: 2.2, lives: 3, score: 0, served: 0,
    glaze: 0, glazeT: 0, serveT: 0, shake: 0, last: 0,
    msg: '' as string, msgT: 0,
  });

  const newOrder = () => {
    const s = g.current;
    s.order = Array.from({ length: 5 }, () => KINDS[Math.floor(Math.random() * KINDS.length)]);
    s.stick = []; s.belt = []; s.spawn = 0; s.state = 'skewer';
  };
  const start = useCallback(() => {
    const s = g.current;
    Object.assign(s, { lives: 3, score: 0, served: 0, speed: 2.2 });
    newOrder(); setScore(0);
    try { soundManager.play('click'); } catch {}
  }, []);

  const action = useCallback(() => {
    const s = g.current;
    if (s.state === 'title' || s.state === 'over') { start(); return; }
    if (s.state === 'glaze') { s.glaze = Math.min(1, s.glaze + 0.075); try { soundManager.play('pop' as any); } catch {} return; }
    if (s.state !== 'skewer') return;
    const need = s.order[s.stick.length];
    const inZone = s.belt.find((f) => !f.hit && Math.abs(f.x - ZONE_X) < 28);
    if (inZone && inZone.k === need) {
      inZone.hit = 1; s.stick.push(inZone.k); s.score += 20;
      s.msg = 'GOOD!'; s.msgT = 500;
      try { soundManager.play('pop' as any); } catch {}
      if (s.stick.length === 5) { s.state = 'glaze'; s.glaze = 0; s.glazeT = 3200; }
    } else {
      s.lives--; s.shake = 12; s.msg = inZone ? '다른 과일!' : 'MISS!'; s.msgT = 700;
      try { soundManager.play('error'); } catch {}
      if (s.lives <= 0) { s.state = 'over'; saveBest(s.score); }
    }
    setScore(s.score);
  }, [start, saveBest]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) action(); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [action]);

  useEffect(() => {
    const c = cv.current!; const ctx = c.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr);
    let raf = 0;

    const fruit = (x: number, y: number, k: Kind, glazeA = 0) => {
      const f = FRUIT[k];
      ctx.fillStyle = f.col; ctx.strokeStyle = f.dark; ctx.lineWidth = 3;
      if (k === 'straw') {
        ctx.beginPath(); ctx.moveTo(x - f.r, y - f.r * 0.5); ctx.quadraticCurveTo(x, y - f.r * 1.1, x + f.r, y - f.r * 0.5); ctx.quadraticCurveTo(x + f.r * 0.6, y + f.r, x, y + f.r * 1.1); ctx.quadraticCurveTo(x - f.r * 0.6, y + f.r, x - f.r, y - f.r * 0.5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#fff59d'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 9 + (i % 3) * 8, y - 4 + Math.floor(i / 3) * 9, 2, 3);
        ctx.fillStyle = '#3fa535'; ctx.beginPath(); ctx.moveTo(x - 10, y - f.r * 0.7); ctx.lineTo(x, y - f.r * 1.2); ctx.lineTo(x + 10, y - f.r * 0.7); ctx.fill();
      } else if (k === 'grape') {
        ctx.beginPath(); ctx.ellipse(x, y, f.r, f.r * 1.15, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(x, y, f.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (k === 'orange') { ctx.fillStyle = '#3fa535'; ctx.fillRect(x - 2, y - f.r - 4, 4, 6); }
        if (k === 'tomato') { ctx.fillStyle = '#3fa535'; ctx.beginPath(); ctx.arc(x, y - f.r + 2, 5, 0, Math.PI * 2); ctx.fill(); }
        if (k === 'blue') { ctx.fillStyle = f.dark; ctx.fillRect(x - 3, y - f.r + 2, 6, 3); }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.ellipse(x - f.r * 0.35, y - f.r * 0.35, f.r * 0.25, f.r * 0.35, -0.6, 0, Math.PI * 2); ctx.fill();
      if (glazeA > 0) {
        ctx.fillStyle = `rgba(255,236,170,${0.55 * glazeA})`; ctx.beginPath(); ctx.arc(x, y, f.r + 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${0.9 * glazeA})`; ctx.fillRect(x + f.r * 0.2, y - f.r * 0.6, 4, 4);
      }
    };

    const frame = (ts: number) => {
      const s = g.current;
      const dt = s.last ? Math.min(40, ts - s.last) : 16; s.last = ts;
      const k = dt / 16.67;
      if (s.state === 'skewer') {
        s.spawn -= dt;
        if (s.spawn <= 0) {
          const need = s.order[s.stick.length];
          const kind = Math.random() < 0.42 ? need : KINDS[Math.floor(Math.random() * KINDS.length)];
          s.belt.push({ x: -30, k: kind }); s.spawn = Math.max(520, 1100 - s.served * 60) + Math.random() * 300;
        }
        s.belt.forEach((f) => (f.x += s.speed * k * (f.hit ? 0 : 1)));
        s.belt = s.belt.filter((f) => f.x < W + 40 && !f.hit);
      } else if (s.state === 'glaze') {
        s.glazeT -= dt; s.glaze = Math.max(0, s.glaze - 0.0006 * dt);
        if (s.glaze >= 1) { s.state = 'serve'; s.serveT = 1400; s.served++; s.score += 100 + s.served * 20; s.speed = Math.min(6, 2.2 + s.served * 0.35); setScore(s.score); try { soundManager.play('achievement' as any); } catch {} }
        else if (s.glazeT <= 0) { s.lives--; s.msg = '설탕 실패!'; s.msgT = 900; if (s.lives <= 0) { s.state = 'over'; saveBest(s.score); } else { newOrder(); } }
      } else if (s.state === 'serve') {
        s.serveT -= dt; if (s.serveT <= 0) newOrder();
      }
      s.msgT -= dt; s.shake = Math.max(0, s.shake - k);

      ctx.save();
      if (s.shake) ctx.translate((Math.random() - 0.5) * s.shake, 0);
      // stall wall
      ctx.fillStyle = '#fff3d6'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#ffe2b0'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, 60, 20, BELT_Y - 90);
      // awning stripes
      for (let i = 0; i < W / 40 + 1; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff5fae'; ctx.beginPath(); ctx.moveTo(i * 40, 0); ctx.lineTo(i * 40 + 40, 0); ctx.lineTo(i * 40 + 40, 38); ctx.arc(i * 40 + 20, 38, 20, 0, Math.PI); ctx.fill(); }
      ctx.strokeStyle = '#7a1e4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 38); ctx.lineTo(W, 38); ctx.stroke();
      // order ticket
      ctx.fillStyle = '#ffffff'; rr(ctx, 20, 76, 250, 92, 10); ctx.fill(); ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#1b2340'; ctx.font = "14px 'Galmuri11', monospace"; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`주문서 #${s.served + 1}`, 34, 86);
      s.order.forEach((o, i) => { fruit(52 + i * 46, 136, o); if (i < s.stick.length) { ctx.strokeStyle = '#3fa535'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(38 + i * 46, 136); ctx.lineTo(48 + i * 46, 148); ctx.lineTo(68 + i * 46, 122); ctx.stroke(); } });
      if (s.state === 'skewer' && s.order[s.stick.length]) { ctx.strokeStyle = '#ff5fae'; ctx.lineWidth = 3; ctx.strokeRect(30 + s.stick.length * 46, 112, 44, 48); }
      // lives
      ctx.font = "24px sans-serif"; ctx.textAlign = 'right'; ctx.fillStyle = '#ff4f5e';
      ctx.fillText('♥'.repeat(Math.max(0, s.lives)) + '♡'.repeat(3 - Math.max(0, s.lives)), W - 20, 80);
      // skewer holder + stick
      const stickTop = 90, stickBot = BELT_Y - 30;
      ctx.fillStyle = '#d9a86a'; ctx.fillRect(ZONE_X - 3, stickTop, 6, stickBot - stickTop);
      ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 2; ctx.strokeRect(ZONE_X - 3, stickTop, 6, stickBot - stickTop);
      const ga = s.state === 'glaze' ? s.glaze : s.state === 'serve' ? 1 : 0;
      s.stick.forEach((kk, i) => fruit(ZONE_X, stickBot - 22 - i * 34, kk, ga));
      // conveyor belt
      ctx.fillStyle = '#3a3f55'; ctx.fillRect(0, BELT_Y, W, 44);
      ctx.fillStyle = '#50566b'; const off = (ts / 16 * (s.state === 'skewer' ? s.speed : 0)) % 30; for (let x = -off; x < W; x += 30) ctx.fillRect(x, BELT_Y + 6, 16, 32);
      ctx.fillStyle = '#1b2340'; ctx.fillRect(0, BELT_Y + 44, W, 8);
      // target zone
      ctx.strokeStyle = s.state === 'skewer' ? '#ffd700' : 'rgba(255,215,0,0.3)'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]); ctx.strokeRect(ZONE_X - 30, BELT_Y - 46, 60, 90); ctx.setLineDash([]);
      s.belt.forEach((f) => fruit(f.x, BELT_Y - 18, f.k));
      // counter
      ctx.fillStyle = '#b8783b'; ctx.fillRect(0, BELT_Y + 52, W, H - BELT_Y - 52);
      ctx.fillStyle = '#8a5a2e'; for (let x = 0; x < W; x += 60) ctx.fillRect(x, BELT_Y + 52, 4, H - BELT_Y - 52);
      // glaze meter
      if (s.state === 'glaze') {
        ctx.fillStyle = 'rgba(11,14,42,0.35)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffffff'; rr(ctx, W / 2 - 200, 186, 400, 80, 14); ctx.fill(); ctx.strokeStyle = '#1b2340'; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = '#1b2340'; ctx.font = "18px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SPACE 연타! 설탕 코팅!', W / 2, 208);
        ctx.fillStyle = '#eee'; rr(ctx, W / 2 - 180, 228, 360, 22, 8); ctx.fill();
        ctx.fillStyle = '#ffd36b'; rr(ctx, W / 2 - 180, 228, 360 * s.glaze, 22, 8); ctx.fill();
        ctx.fillStyle = '#ff4f5e'; ctx.fillRect(W / 2 - 180, 254, 360 * Math.max(0, s.glazeT / 3200), 4);
      }
      if (s.state === 'serve') {
        ctx.fillStyle = '#ffd700'; ctx.font = "40px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 6; ctx.strokeStyle = '#1b2340'; ctx.strokeText('완성! 판매 완료 ✨', W / 2, 60 + 170); ctx.fillText('완성! 판매 완료 ✨', W / 2, 60 + 170);
      }
      if (s.msgT > 0) { ctx.font = "22px 'Galmuri11', monospace"; ctx.textAlign = 'center'; ctx.fillStyle = s.msg === 'GOOD!' ? '#3fa535' : '#ff4f5e'; ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.strokeText(s.msg, ZONE_X, BELT_Y - 70); ctx.fillText(s.msg, ZONE_X, BELT_Y - 70); }
      ctx.restore();
      if (s.state === 'title') overlay(ctx, W, H, '탕후루 가게', '과일이 노란 칸에 오면 SPACE!', '#ff9ac2');
      if (s.state === 'over') overlay(ctx, W, H, '영업 종료!', `${s.score}점 · SPACE 다시`, '#ffd700');
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [saveBest]);

  return (
    <ArcadeShell
      title="탕후루 마스터"
      subtitle="SKEWER · GLAZE · SERVE"
      tone="#ff5fae"
      score={score}
      best={Math.max(best, score)}
      onBack={onBack}
      onRestart={start}
      controls={
        <button className="ac-pad ac-pad--big ac-pad--pink" onPointerDown={action}>
          🍡 꽂기 / 코팅 <small>(SPACE)</small>
        </button>
      }
    >
      <canvas ref={cv} style={{ width: W, maxWidth: '100%', aspectRatio: `${W} / ${H}` }} />
    </ArcadeShell>
  );
};
