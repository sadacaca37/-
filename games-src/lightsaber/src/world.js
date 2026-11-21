// ================= WORLD: surfaces, structures, debris =================
const SURF = {};
function mkSurf(id, fn, x0, x1) {
  SURF[id] = {
    id, fn, x0, x1, _t: NaN, _f: null,
    at(t) { if (t !== this._t) { this._t = t; this._f = this.fn(t); } return this._f; },
    point(lx, t) { const f = this.at(t), c = Math.cos(f.a), s = Math.sin(f.a); return { x: f.x + lx * c, y: f.y + lx * s }; },
    tan(t) { const f = this.at(t); return { x: Math.cos(f.a), y: Math.sin(f.a) }; },
    nrm(t) { const f = this.at(t); return { x: Math.sin(f.a), y: -Math.cos(f.a) }; },
    local(px, py, t) { const f = this.at(t), c = Math.cos(f.a), s = Math.sin(f.a); return (px - f.x) * c + (py - f.y) * s; },
  };
}
const C1 = { ox: 2150, oy: 180, len: 1090, swing: 22.3 };
const P3 = { cx: 1650, y: 1500, hw: 420 };
let C1A, C1WOB, WS;
function c1Angle(t) {
  let a = C1A.at(t);
  for (const w of C1WOB) if (t > w.t) { const d = t - w.t; a += w.a * Math.exp(-d * w.k) * Math.sin(TAU * w.f * d); }
  return a;
}
function buildWorld() {
  C1A = new Track(0); C1WOB = [];
  WS = { w1: [], w1Broken: -1, deb: [], cables: [], rails: [], cracks: [], stars: [], lamps: [], planetFlash: 0, pflash: { x: 0, y: 0 } };
  mkSurf('hall', () => ({ x: 0, y: 0, a: 0 }), -1500, 1000);
  mkSurf('c1', t => ({ x: C1.ox, y: C1.oy, a: c1Angle(t) }), -C1.len, 0);
  mkSurf('w2', () => ({ x: 2150, y: 180, a: -PI / 2 }), -1500, 1500);
  mkSurf('p3', () => ({ x: P3.cx, y: P3.y, a: 0 }), -P3.hw, P3.hw);
  // W1 breakable section
  const cols = 3, rows = 11, x0 = 1000, x1 = 1060, y0 = -440, y1 = 0, Pt = [];
  for (let i = 0; i <= cols; i++) { Pt[i] = []; for (let j = 0; j <= rows; j++) { const ix = i > 0 && i < cols, iy = j > 0 && j < rows; Pt[i][j] = { x: x0 + (x1 - x0) * i / cols + (ix ? R(-7, 7) : 0), y: y0 + (y1 - y0) * j / rows + (iy ? R(-13, 13) : 0) }; } }
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const v = [Pt[i][j], Pt[i + 1][j], Pt[i + 1][j + 1], Pt[i][j + 1]];
    const cx = v.reduce((s, p) => s + p.x, 0) / 4, cy = v.reduce((s, p) => s + p.y, 0) / 4;
    WS.w1.push({ v, cx, cy, alive: true });
  }
  WS.cables = [{ lx: -940 }, { lx: -530 }, { lx: -120 }].map(c => ({ ...c, cut: -1, yc: 0, x0: C1.ox + c.lx }));
  for (let lx = -1080; lx < -20; lx += 100) WS.rails.push({ a: lx, b: Math.min(lx + 100, -10), cut: -1 });
  for (let i = 0; i < 260; i++) WS.stars.push({ x: R(-2600, 2600), y: R(-2200, 300), s: R(0.6, 2.2), p: R(0, 10) });
  buildPrerender();
  for (let y = -1500; y < 2700; y += 540) for (const xx of [1100, 1400, 1900, 2200]) WS.lamps.push({ x: xx + R(-40, 40), y: y + 70, ph: R(0, 10) });
}
function floorBelow(x, y, t) {
  if (x > -1500 && x < 1000 && y < 40) return 0;
  if (t < C1.swing + 0.05 && x > 1060 && x < 2150) { const s = SURF.c1, lx = s.local(x, 180, t), p = s.point(lx, t); if (y < p.y + 30) return p.y; }
  if (x > P3.cx - P3.hw && x < P3.cx + P3.hw && y < P3.y + 40) return P3.y;
  return null;
}
// ---------- debris ----------
function addDeb(o) {
  const d = Object.assign({ a: 0, va: 0, vx: 0, vy: 0, col: '#2b3046', hot: 0, cut: null, kin: null, edge: 'rgba(150,160,200,0.28)' }, o);
  let r = 0; for (let i = 0; i < d.verts.length; i += 2) r = Math.max(r, Math.hypot(d.verts[i], d.verts[i + 1])); d.rad = r;
  WS.deb.push(d); return d;
}
function debWorld(d) { const c = Math.cos(d.a), s = Math.sin(d.a), out = []; for (let i = 0; i < d.verts.length; i += 2) { const x = d.verts[i], y = d.verts[i + 1]; out.push(d.x + x * c - y * s, d.y + x * s + y * c); } return out; }
function updDeb(dt) {
  for (const d of WS.deb) {
    if (d.kin && T < d.kin.until) {
      const k = d.kin, tau = T - k.t0; d.x = k.x + k.vx * tau; d.y = k.y + k.vy * tau + 0.5 * G * tau * tau; d.a = k.a + k.va * tau; d.vx = k.vx; d.vy = k.vy + G * tau; d.va = k.va; continue;
    }
    if (dt <= 0) continue;
    d.vy += G * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt;
    d.hot = Math.max(0, d.hot - dt * 0.3);
    let fy = floorBelow(d.x, d.y - d.rad, T); if (d.noP3 && fy === P3.y) fy = null;
    if (fy !== null) {
      const w = debWorld(d); let my = -1e9; for (let i = 1; i < w.length; i += 2) my = Math.max(my, w[i]);
      if (my > fy) { d.y -= (my - fy); if (d.vy > 0) { if (d.vy > 300 && d.rad > 10) { FX.dust(d.x, fy, 2, 40); } d.vy *= -0.22; d.vx *= 0.65; d.va *= 0.55; if (Math.abs(d.vy) < 50) d.vy = 0; } d.va *= 0.86; d.vx *= 0.93; }
    }
  }
  if (WS.deb.length > 0) WS.deb = WS.deb.filter(d => d.y < 3600 && Math.abs(d.x) < 6000);
}
function drawDeb(c) {
  for (const d of WS.deb) {
    c.save(); c.translate(d.x, d.y); c.rotate(d.a);
    c.beginPath(); for (let i = 0; i < d.verts.length; i += 2) c[i ? 'lineTo' : 'moveTo'](d.verts[i], d.verts[i + 1]); c.closePath();
    c.fillStyle = d.col; c.fill(); c.strokeStyle = d.edge; c.lineWidth = 1.5; c.stroke();
    if (d.cut && d.hot > 0.02) {
      c.globalCompositeOperation = 'lighter';
      for (const e of d.cut) {
        const n = d.verts.length / 2, i = e, j = (e + 1) % n;
        c.beginPath(); c.moveTo(d.verts[i * 2], d.verts[i * 2 + 1]); c.lineTo(d.verts[j * 2], d.verts[j * 2 + 1]);
        c.strokeStyle = `rgba(255,${120 + 100 * d.hot | 0},40,${0.9 * d.hot})`; c.lineWidth = 5; c.stroke();
        c.strokeStyle = `rgba(255,240,200,${d.hot})`; c.lineWidth = 1.8; c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }
}
// split a convex polygon debris by a world line (px,py,dx,dy) -> two debris with hot cut edges
function splitDeb(d, px, py, dx, dy, sep = 160) {
  const c = Math.cos(-d.a), s = Math.sin(-d.a);
  const lp = { x: (px - d.x) * c - (py - d.y) * s, y: (px - d.x) * s + (py - d.y) * c }, ld = { x: dx * c - dy * s, y: dx * s + dy * c };
  const n = d.verts.length / 2, A = [], B = [];
  const side = (x, y) => (x - lp.x) * ld.y - (y - lp.y) * ld.x;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, x1 = d.verts[i * 2], y1 = d.verts[i * 2 + 1], x2 = d.verts[j * 2], y2 = d.verts[j * 2 + 1];
    const s1 = side(x1, y1), s2 = side(x2, y2);
    if (s1 >= 0) A.push(x1, y1); else B.push(x1, y1);
    if ((s1 >= 0) !== (s2 >= 0)) { const u = s1 / (s1 - s2), ix = lerp(x1, x2, u), iy = lerp(y1, y2, u); A.push(ix, iy); B.push(ix, iy); }
  }
  if (A.length < 6 || B.length < 6) return;
  WS.deb.splice(WS.deb.indexOf(d), 1);
  const nx = -ld.y, ny = ld.x;
  for (const [P, sg] of [[A, 1], [B, -1]]) {
    let cx = 0, cy = 0, m = P.length / 2; for (let i = 0; i < P.length; i += 2) { cx += P[i]; cy += P[i + 1]; } cx /= m; cy /= m;
    const vv = []; for (let i = 0; i < P.length; i += 2) vv.push(P[i] - cx, P[i + 1] - cy);
    // the cut edge: consecutive verts that lie on the line
    const cut = []; for (let i = 0; i < m; i++) { const j = (i + 1) % m; if (Math.abs(side(P[i * 2], P[i * 2 + 1])) < 0.5 && Math.abs(side(P[j * 2], P[j * 2 + 1])) < 0.5) cut.push(i); }
    const w = rot2(cx, cy, d.a), wn = rot2(nx, ny, d.a);
    addDeb({ verts: vv, x: d.x + w.x, y: d.y + w.y, vx: d.vx + wn.x * sg * sep, vy: d.vy + wn.y * sg * sep, a: d.a, va: d.va + sg * R(1.5, 3), col: d.col, hot: 1, cut, edge: d.edge, noP3: d.noP3 });
  }
}
function breakW1(ix, iy, dirx) {
  WS.w1Broken = T;
  for (const ch of WS.w1) {
    const dd = Math.hypot(ch.cx - ix, ch.cy - iy);
    if (dd < 178) {
      ch.alive = false; const verts = []; for (const p of ch.v) verts.push(p.x - ch.cx, p.y - ch.cy);
      const sp = R(450, 1250) * (1 - dd / 300);
      addDeb({ verts, x: ch.cx, y: ch.cy, vx: dirx * sp + R(-80, 80), vy: (ch.cy - iy) * R(2, 4.5) - R(150, 450), va: R(-10, 10), col: '#262b40', noP3: true });
    }
  }
  for (let i = 0; i < 60; i++) { const a = R(-1.2, 1.2), sp = R(300, 1500); FX.chip(ix + R(-20, 20), iy + R(-120, 120), Math.cos(a) * sp * dirx, Math.sin(a) * sp - 200, R(2, 6)); }
  for (let i = 0; i < 26; i++) FX.smoke(ix + R(-40, 60), iy + R(-170, 100), R(-100, 500) * dirx, R(-150, 60), R(40, 90), R(1.2, 2.6), [120, 120, 140], 0.5);
}
// ---------- prerendered layers ----------
let PRE = {};
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function buildPrerender() {
  if (PRE.done) return; PRE.done = true;
  // planet
  const S = 1400, pc = mkCanvas(S, S), x = pc.getContext('2d'), r = 620, cx = S / 2, cy = S / 2;
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
  let g = x.createLinearGradient(0, cy - r, 0, cy + r); g.addColorStop(0, '#3b2f6b'); g.addColorStop(0.45, '#2c5a78'); g.addColorStop(0.7, '#4a3a7a'); g.addColorStop(1, '#1d2246');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  srand(77);
  for (let i = 0; i < 46; i++) {
    const y = cy - r + R(0, 2 * r), h = R(6, 40), a = R(0.05, 0.22);
    x.fillStyle = `rgba(${R(140, 230) | 0},${R(150, 220) | 0},${R(200, 255) | 0},${a})`;
    x.beginPath(); x.moveTo(0, y);
    for (let xx = 0; xx <= S; xx += 40) x.lineTo(xx, y + Math.sin(xx * 0.008 + i) * h * 0.4);
    for (let xx = S; xx >= 0; xx -= 40) x.lineTo(xx, y + h + Math.sin(xx * 0.01 + i * 2) * h * 0.4);
    x.fill();
  }
  // storm spot
  x.fillStyle = 'rgba(230,200,255,0.18)'; x.beginPath(); x.ellipse(cx + 170, cy + 120, 120, 50, 0.1, 0, TAU); x.fill();
  x.fillStyle = 'rgba(120,90,200,0.25)'; x.beginPath(); x.ellipse(cx + 175, cy + 122, 70, 26, 0.1, 0, TAU); x.fill();
  // terminator shading
  g = x.createRadialGradient(cx - 260, cy - 260, 60, cx + 120, cy + 120, r * 1.45);
  g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(0.8, 'rgba(3,3,15,0.7)'); g.addColorStop(1, 'rgba(2,2,10,0.95)');
  x.fillStyle = g; x.fillRect(0, 0, S, S); x.restore();
  // atmosphere rim
  x.globalCompositeOperation = 'lighter';
  g = x.createRadialGradient(cx, cy, r * 0.94, cx, cy, r * 1.08); g.addColorStop(0, 'rgba(120,170,255,0)'); g.addColorStop(0.4, 'rgba(120,170,255,0.35)'); g.addColorStop(1, 'rgba(120,170,255,0)');
  x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r * 1.08, 0, TAU); x.fill();
  PRE.planet = pc;
  // shaft back wall (world 900..2400 x, -1700..3000 y) at half scale
  const bw = mkCanvas(750, 2350), b = bw.getContext('2d');
  b.scale(0.5, 0.5); b.translate(-900, 1700);
  g = b.createLinearGradient(0, -1700, 0, 3000); g.addColorStop(0, '#0b0d15'); g.addColorStop(0.4, '#12141d'); g.addColorStop(0.68, '#221812'); g.addColorStop(0.86, '#4a200a'); g.addColorStop(1, '#7a3408');
  b.fillStyle = g; b.fillRect(900, -1700, 1500, 4700);
  srand(91);
  for (let y = -1700; y < 3000; y += 180) for (let xx = 900; xx < 2400; xx += 240) {
    b.strokeStyle = 'rgba(0,0,0,0.5)'; b.lineWidth = 4; b.strokeRect(xx + 4, y + 4, 232, 172);
    b.strokeStyle = 'rgba(170,180,215,0.09)'; b.lineWidth = 2; b.strokeRect(xx + 8, y + 8, 224, 164);
    if (rnd() < 0.25) { b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(xx + 30, y + 30, 180, 30); }
  }
  for (let y = -1600; y < 3000; y += 540) { b.fillStyle = '#06070b'; b.fillRect(900, y, 1500, 46); b.fillStyle = 'rgba(160,170,210,0.08)'; b.fillRect(900, y, 1500, 3); }
  for (const px of [1150, 1215, 2050, 2110]) { b.fillStyle = '#101219'; b.fillRect(px, -1700, 34, 4700); b.fillStyle = 'rgba(170,180,220,0.07)'; b.fillRect(px + 4, -1700, 5, 4700); for (let y = -1650; y < 3000; y += 300) { b.fillStyle = '#16181f'; b.fillRect(px - 5, y, 44, 16); } }
  PRE.shaftBack = bw;
  // film grain
  const gr = mkCanvas(256, 256), gx = gr.getContext('2d'), id = gx.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  gx.putImageData(id, 0, 0); PRE.grain = gr;
}
