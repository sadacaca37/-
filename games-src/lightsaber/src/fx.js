// ================= FX: particles, flashes, scorch, lightning =================
const WIND = { x: 60, y: 0 };
function mkGlow(r, g, b, size = 128, soft = 1) {
  const c = mkCanvas(size, size), x = c.getContext('2d'), h = size / 2, gr = x.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.18 * soft, `rgba(${r},${g},${b},0.55)`);
  gr.addColorStop(0.5, `rgba(${r},${g},${b},0.14)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, size, size); return c;
}
function mkSmoke(r = 255, gg = 255, b = 255) {
  const s = 96, c = mkCanvas(s, s), x = c.getContext('2d'), g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, `rgba(${r},${gg},${b},0.55)`); g.addColorStop(0.5, `rgba(${r},${gg},${b},0.22)`); g.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  x.fillStyle = g; x.fillRect(0, 0, s, s); return c;
}
const SMK = {};
function smokeSpr(col) { const k = ((col[0] >> 4) << 8) | ((col[1] >> 4) << 4) | (col[2] >> 4); if (!SMK[k]) SMK[k] = mkSmoke(col[0], col[1], col[2]); return SMK[k]; }
const SPR = {};
function buildSprites() {
  SPR.w = mkGlow(255, 255, 255); SPR.b = mkGlow(70, 165, 255); SPR.r = mkGlow(255, 45, 35); SPR.o = mkGlow(255, 140, 40);
  SPR.y = mkGlow(255, 225, 150); SPR.p = mkGlow(205, 150, 255); SPR.c = mkGlow(150, 220, 255); SPR.smoke = mkSmoke();
  SPR.wh = mkGlow(255, 255, 255, 128, 2.2);
}
function sprite(c, s, x, y, r, a) { if (a <= 0.003) return; c.globalAlpha = Math.min(1, a); c.drawImage(s, x - r, y - r, r * 2, r * 2); }
const BLUE = [70, 165, 255], RED = [255, 40, 32];
const FX = {
  reset() {
    this.P = []; this.fl = []; this.rings = []; this.rip = []; this.sc = []; this.lights = [];
    this.screenFlash = 0; this.flashCol = [255, 255, 255]; this.white = 0; this.trauma = 0; this.punch = 0;
    this.burnT = {}; this.lockOn = false; this.lockI = 0; this.lit = { on: false, I: 0, regen: 0, bolts: [], src: null, tgt: null, hitBlade: true };
    this.cracks = []; this.emberAcc = 0; this.lastClash = null; this.misses = [];
  },
  spark(x, y, vx, vy, life, w = 2, hot = 1) { this.P.push({ k: 0, x, y, vx, vy, life, max: life, w, hot }); },
  chip(x, y, vx, vy, s) { this.P.push({ k: 1, x, y, vx, vy, life: R(1, 2.4), max: 2.4, s, a: R(0, 6), va: R(-14, 14) }); },
  smoke(x, y, vx, vy, r, life, col = [120, 120, 130], a = 0.4) { this.P.push({ k: 2, x, y, vx, vy, r, life, max: life, col, a0: a }); },
  ember(x, y, vx, vy, life, s) { this.P.push({ k: 3, x, y, vx, vy, life, max: life, s, ph: R(0, 9) }); },
  fire(x, y, vx, vy, r, life) { this.P.push({ k: 4, x, y, vx, vy, r, life, max: life }); },
  wind(x, y, vx, vy, life) { this.P.push({ k: 5, x, y, vx, vy, life, max: life }); },
  dust(x, y, n, r, col = [95, 95, 112], spd = 120) { for (let i = 0; i < n * 3; i++) { const s = RS(); this.smoke(x + R(-10, 10), y - R(2, 10), s * R(20, spd + r * 2), -R(5, 40), r * R(0.5, 1), R(0.5, 1.2), col, 0.26); } },
  flash(x, y, r, life, spr = 'w', a = 1) { this.fl.push({ x, y, r, life, max: life, spr, a }); },
  ring(x, y, r, vr, life, w, col) { this.rings.push({ x, y, r, vr, life, max: life, w, col }); },
  light(x, y, r, col, i, life) { this.lights.push({ x, y, r, col, i, life, max: life }); },
  ripple(x, y, life, str) { this.rip.push({ x, y, life, max: life, str }); },
  shake(a) { this.trauma = Math.min(1, this.trauma + a); },
  // ---------- clash ----------
  clash(A, D, pow = 0.5, o = {}) {
    const a = A.blade(), b = D.blade();
    let p = segX(a.sx, a.sy, a.tx, a.ty, b.sx, b.sy, b.tx, b.ty);
    if (!p) { p = segSegNear(a, b); if (p.d > 4) this.misses.push({ t: T, A: A.id, D: D.id, d: p.d }); if (window.DEBUG && p.d > 4) console.warn('CLASH MISS', T.toFixed(3), A.id, '->', D.id, p.d.toFixed(1)); }
    const x = p.x, y = p.y, P = pow;
    const n = 16 + P * 80 | 0, ang = Math.atan2(a.dy, a.dx);
    for (let i = 0; i < n; i++) {
      const side = RS(), d = ang + side * PI / 2 + R(-1.1, 1.1), sp = R(150, 700 + 1100 * P);
      this.spark(x, y, Math.cos(d) * sp, Math.sin(d) * sp - R(0, 250), R(0.12, 0.45 + 0.5 * P), R(1.3, 3.2));
    }
    for (let i = 0; i < 6 + P * 10; i++) { const d = R(0, TAU), sp = R(900, 2200) * P; this.spark(x, y, Math.cos(d) * sp, Math.sin(d) * sp, R(0.05, 0.12), 4); }
    this.flash(x, y, 26 + 70 * P, 0.06 + 0.08 * P, 'wh', 0.9);
    this.flash(x, y, 50 + 140 * P, 0.07 + 0.11 * P, 'p', 0.25 + 0.25 * P);
    if (P > 0.5) this.ring(x, y, 12, 800 + 900 * P, 0.25 + 0.2 * P, 3 + 6 * P, [225, 220, 255]);
    if (P > 0.85 && P < 1.3) this.ring(x, y, 8, 1800 * P, 0.3, 10 * P, [255, 255, 255]);
    this.light(x, y, 260 + 360 * P, [240, 230, 255], 0.3 + 0.5 * P, 0.08 + 0.12 * P);
    this.screenFlash = Math.max(this.screenFlash, (o.sf ?? 0.03) + 0.12 * P * P);
    this.shake(0.16 + 0.5 * P * P); this.punch += 0.02 + 0.055 * P;
    hitstop = Math.max(hitstop, o.hs ?? (0.022 + 0.1 * P * P));
    AU.clash(P, panOf(x, y));
    this.lastClash = { x, y, t: T };
    return p;
  },
  // ---------- blade vs environment ----------
  envLines(t) {
    const L = [{ id: 'hall', ax: -1500, ay: 0, bx: 1000, by: 0 }];
    if (WS.w1Broken < 0) L.push({ id: 'w1', ax: 1000, ay: -1500, bx: 1000, by: 0 }); else L.push({ id: 'w1', ax: 1000, ay: -1500, bx: 1000, by: -300 });
    if (t < C1.swing + 0.6) { const s = SURF.c1, a = s.point(-C1.len, t), b = s.point(0, t); L.push({ id: 'c1', ax: a.x, ay: a.y, bx: b.x, by: b.y, surf: 'c1' }); }
    L.push({ id: 'w2', ax: 2150, ay: -1500, bx: 2150, by: 2800 });
    L.push({ id: 'p3', ax: P3.cx - P3.hw, ay: P3.y, bx: P3.cx + P3.hw, by: P3.y });
    return L;
  },
  contacts(F, t, dt) {
    const B = F.B; if (!B || B.ext < 0.3 || dt <= 0) return;
    for (const l of this.envLines(t)) {
      const p = segX(B.sx, B.sy, B.tx, B.ty, l.ax, l.ay, l.bx, l.by); if (!p) continue;
      const key = F.id + l.id;
      const nx = -(l.by - l.ay), ny = (l.bx - l.ax), nl = Math.hypot(nx, ny);
      let ux = nx / nl, uy = ny / nl; if ((B.sx - p.x) * ux + (B.sy - p.y) * uy < 0) { ux = -ux; uy = -uy; }
      for (let i = 0; i < 4; i++) { const sp = R(150, 700); this.spark(p.x, p.y, ux * sp + R(-300, 300), uy * sp + R(-300, 100), R(0.15, 0.45), R(1.2, 2.4)); }
      this.flash(p.x, p.y, 40, 0.05, 'o', 0.9); this.light(p.x, p.y, 200, [255, 150, 60], 0.5, 0.06);
      // scorch
      let sc = this.burnT[key];
      let lp = { x: p.x, y: p.y };
      if (l.surf) { const s = SURF[l.surf], f = s.at(t), c = Math.cos(-f.a), sn = Math.sin(-f.a); lp = { x: (p.x - f.x) * c - (p.y - f.y) * sn, y: (p.x - f.x) * sn + (p.y - f.y) * c }; }
      if (sc && t - sc.tl < 0.06) { const lx = sc.pts[sc.pts.length - 2], ly = sc.pts[sc.pts.length - 1]; if (Math.hypot(lx - lp.x, ly - lp.y) > 2) sc.pts.push(lp.x, lp.y); sc.tl = t; }
      else { sc = { pts: [lp.x, lp.y, lp.x + 0.5, lp.y], tl: t, surf: l.surf || null }; this.sc.push(sc); this.burnT[key] = sc; }
      if (!sc.snd || t - sc.snd > 0.09) { sc.snd = t; AU.burn(panOf(p.x, p.y)); }
    }
  },
  // ---------- per-frame ----------
  update(dt) {
    const P = this.P;
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; p.life -= dt; if (dt <= 0) continue;
      if (p.k === 0) {
        p.vy += 1500 * dt; p.vx *= 1 - dt * 1.4; p.x += p.vx * dt; p.y += p.vy * dt;
        const fy = floorBelow(p.x, p.y - 4, T); if (fy !== null && p.y > fy && p.vy > 0) { p.y = fy; p.vy *= -0.33; p.vx *= 0.6; }
      } else if (p.k === 1) {
        p.vy += G * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        const fy = floorBelow(p.x, p.y - 4, T); if (fy !== null && p.y > fy && p.vy > 0) { p.y = fy; p.vy *= -0.3; p.vx *= 0.5; p.va *= 0.5; }
      } else if (p.k === 2) {
        const d = Math.exp(-dt * 2.2); p.vx *= d; p.vy = p.vy * d - 18 * dt; p.x += p.vx * dt + WIND.x * 0.15 * dt; p.y += p.vy * dt; p.r += dt * 45;
      } else if (p.k === 3) {
        p.vy -= 40 * dt; p.vx += noise1(p.ph + T * 2) * 60 * dt; p.x += (p.vx + WIND.x * 0.4) * dt; p.y += p.vy * dt;
      } else if (p.k === 5) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5;
      } else if (p.k === 4) {
        const d = Math.exp(-dt * 3); p.vx *= d; p.vy = p.vy * d - 120 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 70;
      }
    }
    if (dt > 0) { let j = 0; for (let i = 0; i < P.length; i++) if (P[i].life > 0) P[j++] = P[i]; P.length = j; if (P.length > 3500) P.splice(0, P.length - 3500); }
    for (const f of this.fl) f.life -= dt; this.fl = this.fl.filter(f => f.life > 0);
    for (const r of this.rings) { r.life -= dt; r.r += r.vr * dt * (r.life / r.max + 0.15); } this.rings = this.rings.filter(r => r.life > 0);
    for (const l of this.lights) l.life -= dt; this.lights = this.lights.filter(l => l.life > 0);
    for (const r of this.rip) r.life -= dt; this.rip = this.rip.filter(r => r.life > 0);
    // lightning
    const L = this.lit;
    if (L.on && dt > 0) {
      L.regen -= dt;
      if (L.regen <= 0) {
        L.regen = 0.035; L.bolts = [];
        const s = L.src(); const nb = 2 + (L.I > 0.6 ? 2 : 1);
        for (let i = 0; i < nb; i++) {
          let tg = L.tgt(i);
          const pts = boltPts(s.x, s.y, tg.x, tg.y, Math.hypot(tg.x - s.x, tg.y - s.y) * 0.16, 6);
          L.bolts.push({ pts, w: i === 0 ? 1 : 0.7 });
          for (let k = 0; k < 2; k++) { const j = 2 + (rnd() * (pts.length - 4) | 0); const bx = pts[j][0], by = pts[j][1], a = Math.atan2(tg.y - s.y, tg.x - s.x) + R(-1.2, 1.2), ln = R(30, 90); L.bolts.push({ pts: boltPts(bx, by, bx + Math.cos(a) * ln, by + Math.sin(a) * ln, ln * 0.25, 3), w: 0.4 }); }
          for (let k = 0; k < 3; k++) { const d = R(0, TAU), sp = R(200, 700); this.spark(tg.x, tg.y, Math.cos(d) * sp, Math.sin(d) * sp - 100, R(0.1, 0.3), 1.6); }
          this.light(tg.x, tg.y, 300, [150, 170, 255], 0.6 * L.I, 0.05);
        }
        this.light(s.x, s.y, 360, [160, 170, 255], 0.8 * L.I, 0.05);
        this.screenFlash = Math.max(this.screenFlash, 0.04 * L.I); this.flashCol = [170, 180, 255];
      }
    }
    if (!L.on) L.bolts = [];
  },
};
function boltPts(x0, y0, x1, y1, disp, det) {
  let pts = [[x0, y0], [x1, y1]];
  for (let l = 0; l < det; l++) {
    const np = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, o = R(-disp, disp);
      np.push([mx - dy / d * o, my + dx / d * o], b);
    }
    pts = np; disp *= 0.52;
  }
  return pts;
}
// ----- FX drawing -----
function drawParticles(c, em) {
  // smoke (normal blend) — skip on emissive
  if (!em) {
    for (const p of FX.P) if (p.k === 2) { const u = p.life / p.max; c.globalAlpha = Math.max(0, p.a0 * Math.min(1, u * 1.6) * Math.min(1, (1 - u) * 6 + 0.25)); c.drawImage(smokeSpr(p.col), p.x - p.r, p.y - p.r, p.r * 2, p.r * 2); }
    // tint smoke by color: cheap approximation via second pass not used
    c.globalAlpha = 1;
    for (const p of FX.P) if (p.k === 1) { c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillStyle = '#2c3046'; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7); c.restore(); }
  }
  c.globalCompositeOperation = 'lighter';
  // sparks bucketed
  const buckets = [[], [], [], []];
  for (const p of FX.P) if (p.k === 0) { const u = p.life / p.max; buckets[u > 0.75 ? 0 : u > 0.5 ? 1 : u > 0.25 ? 2 : 3].push(p); }
  const cols = ['rgba(255,255,245,1)', 'rgba(255,235,150,0.95)', 'rgba(255,170,60,0.85)', 'rgba(255,90,30,0.6)'];
  c.lineCap = 'round';
  for (let b = 0; b < 4; b++) {
    const L = buckets[b]; if (!L.length) continue;
    c.strokeStyle = cols[b]; c.lineWidth = (em ? 3.5 : 1.9) * (1 - b * 0.15); c.beginPath();
    for (const p of L) { const k = 0.022; c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * k, p.y - p.vy * k); }
    c.stroke();
  }
  for (const p of FX.P) {
    if (p.k === 3) { const u = p.life / p.max, fl = 0.6 + 0.4 * Math.sin(p.ph + T * 9); sprite(c, SPR.o, p.x, p.y, p.s * (em ? 5 : 3), u * fl * 0.9); }
    else if (p.k === 4) { const u = p.life / p.max; sprite(c, u > 0.6 ? SPR.y : SPR.o, p.x, p.y, p.r, u * 0.8); }
    else if (p.k === 5) { const u = p.life / p.max; c.globalAlpha = u * 0.5; c.strokeStyle = '#dfe6ff'; c.lineWidth = em ? 3 : 2; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06); c.stroke(); c.globalAlpha = 1; }
  }
  for (const f of FX.fl) { const u = f.life / f.max; sprite(c, SPR[f.spr], f.x, f.y, f.r * (1.15 - 0.15 * u) * (em ? 0.7 : 1), f.a * u * u * (em ? 0.3 : 1)); }
  c.globalAlpha = 1;
  for (const r of FX.rings) { const u = r.life / r.max; c.strokeStyle = rgba(r.col, u * u * 0.55); c.lineWidth = r.w * u * 0.7 + 0.5; c.beginPath(); c.arc(r.x, r.y, r.r, 0, TAU); c.stroke(); }
  // lightning
  for (const b of FX.lit.bolts) {
    const pts = b.pts, I = FX.lit.I;
    for (const [w, col] of [[11 * b.w, `rgba(120,140,255,${0.22 * I})`], [4.5 * b.w, `rgba(170,190,255,${0.7 * I})`], [1.6 * b.w, `rgba(255,255,255,${I})`]]) {
      c.strokeStyle = col; c.lineWidth = em ? w * 1.6 : w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    }
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
function drawScorch(c) {
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const s of FX.sc) {
    c.save();
    if (s.surf) { const f = SURF[s.surf].at(T); c.translate(f.x, f.y); c.rotate(f.a); }
    const pts = s.pts; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.strokeStyle = 'rgba(8,4,3,0.75)'; c.lineWidth = 6; c.stroke();
    const h = Math.exp(-(T - s.tl) / 1.6);
    if (h > 0.02) {
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(255,${90 + 120 * h | 0},${30 * h | 0},${0.85 * h})`; c.lineWidth = 5; c.stroke();
      if (h > 0.4) { c.strokeStyle = `rgba(255,240,200,${(h - 0.4)})`; c.lineWidth = 1.8; c.stroke(); }
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }
}
