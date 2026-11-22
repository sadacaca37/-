// ================= FIGHTER (stick-figure rig with IK + foot planner) =================
const RIG = { thigh: 46, shin: 45, upper: 33, fore: 31, torso: 57, neck: 5, headR: 13.5, blade: 134, hilt: 12 };
const LEG = RIG.thigh + RIG.shin, ARM = RIG.upper + RIG.fore;
// grip offset (forward, down) from shoulder by blade angle relative to body (rho: 0 fwd, -pi/2 up)
const HILT_TAB = [[-PI, -16, 4], [-2.36, -10, -8], [-1.57, 15, 9], [-0.79, 34, 13], [0, 46, 18], [0.79, 40, 30], [1.57, 24, 40], [2.36, 4, 40], [PI, -16, 4]];
function hiltOff(rho) {
  rho = wrapPi(rho);
  for (let i = 0; i < HILT_TAB.length - 1; i++) { const a = HILT_TAB[i], b = HILT_TAB[i + 1]; if (rho <= b[0]) { const u = (rho - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; } }
  return [HILT_TAB[0][1], HILT_TAB[0][2]];
}
function ik2(ax, ay, bx, by, l1, l2, px, py) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
  const maxd = l1 + l2 - 0.05, mind = Math.abs(l1 - l2) + 2;
  let ex = bx, ey = by;
  if (d < 1e-6) { dx = 0; dy = 1; d = 1e-6; }
  if (d > maxd) { ex = ax + dx / d * maxd; ey = ay + dy / d * maxd; d = maxd; }
  else if (d < mind) { ex = ax + dx / d * mind; ey = ay + dy / d * mind; d = mind; }
  const ux = (ex - ax) / d, uy = (ey - ay) / d;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = ax + ux * a, my = ay + uy * a;
  const s = ((-uy) * px + ux * py) >= 0 ? 1 : -1;
  return { jx: mx + s * (-uy) * h, jy: my + s * ux * h, ex, ey };
}
let FRAME = 0;
class Fighter {
  constructor(id, o) {
    this.id = id; this.o = o; this.col = o.col; this.idx = o.idx;
    const tr = this.tr = {};
    tr.mode = new STrack('ground'); tr.surf = new STrack(o.surf); tr.face = new STrack(o.face);
    const N = (k, v) => tr[k] = new Track(v);
    N('lx', o.lx); N('crouch', 6); N('stance', 46); N('w', 0); N('lean', 0.03); N('rot', 0);
    N('sab', o.sab); N('sabRel', 0); N('reach', 1); N('grip', 1); N('offx', 3); N('offy', 52); N('ext', 0);
    N('tuck', 0.6); N('stick', 0); N('ghost', 0); N('proj', 1); N('head', 0); N('kick', 0); N('gb', 0); N('gox', 10); N('goy', -30);
    this.air = []; this.cx = o.lx; this.lastSab = o.sab; this.lastSabRaw = o.sab;
    this.feet = [{ lx: 0, step: null, s: 1 }, { lx: 0, step: null, s: 1 }];
    this.mode = null; this.surfId = null; this.H = { x: o.lx, y: -80 }; this.cp = null; this.vl = 0; this.prevLx = null;
    this.trail = []; this.ghosts = []; this.lastGhost = -9; this.cloth = null; this.clothAcc = 0;
    this.B = null; this._bf = -1; this._busy = false; this.tipPrev = null; this.tipSpeed = 0; this.t = 0;
    this.hiltCut = false; this.noHilt = false; this.alive = 1; this.extMul = 1;
  }
  faceAt(t) { return this.tr.face.at(t); }
  airSeg(t) { let s = null; for (const a of this.air) if (a.t0 <= t) s = a; return s; }
  airPos(seg, t) {
    const T = seg.t1 - seg.t0, tau = clamp(t - seg.t0, 0, T);
    if (!seg.p0) seg.p0 = seg.from ? seg.from() : { x: this.H.x, y: this.H.y };
    const p0 = seg.p0, p1 = seg.to();
    if (seg.kind === 'lin') { const u = EASE[seg.e || 'io'](tau / T); return { x: lerp(p0.x, p1.x, u), y: lerp(p0.y, p1.y, u) }; }
    const g = seg.g ?? G, vy = (p1.y - p0.y - 0.5 * g * T * T) / T;
    const ux = seg.ex ? EASE[seg.ex](tau / T) : tau / T;
    return { x: p0.x + (p1.x - p0.x) * ux, y: p0.y + vy * tau + 0.5 * g * tau * tau };
  }
  initFeet(s, lx, t, stance, w, fs) {
    const dF = lx + fs * stance * (0.5 - w), dB = lx - fs * stance * (0.5 + w);
    this.feet[0] = { lx: dF, step: null, s: 1 }; this.feet[1] = { lx: dB, step: null, s: 1 };
  }
  footW(ft, s, t) {
    if (ft.step) {
      const st = ft.step, u = clamp((t - st.t0) / st.dur, 0, 1); ft.s = u;
      const e = u * u * (3 - 2 * u), p1 = s.point(st.to, t), n = s.nrm(t), lift = st.lift * Math.sin(PI * u);
      return { x: lerp(st.fx, p1.x, e) + n.x * lift, y: lerp(st.fy, p1.y, e) + n.y * lift };
    }
    ft.s = 1; return s.point(ft.lx, t);
  }
  plan(t, dt, s, lx, fs, stance, w) {
    for (const ft of this.feet) if (ft.step && t >= ft.step.t0 + ft.step.dur) { ft.lx = ft.step.to; ft.step = null; this.onStep(s.point(ft.lx, t)); }
    if (dt <= 0) return;
    const lead = this.vl * 0.085;
    const dF = lx + fs * stance * (0.5 - w) + lead, dB = lx - fs * stance * (0.5 + w) + lead;
    const a = this.feet[0], b = this.feet[1];
    const la = a.step ? a.step.to : a.lx, lb = b.step ? b.step.to : b.lx;
    let ta, tb;
    if (Math.abs(la - dF) + Math.abs(lb - dB) <= Math.abs(la - dB) + Math.abs(lb - dF)) { ta = dF; tb = dB; } else { ta = dB; tb = dF; }
    const ea = a.step ? 0 : Math.abs(a.lx - ta), eb = b.step ? 0 : Math.abs(b.lx - tb);
    const go = (ft, tg, e) => {
      const sp = Math.abs(this.vl);
      const dur = clamp(0.1 + e / 1500 - sp / 10000, 0.07, 0.2), to = tg + this.vl * dur * 0.55;
      const p = this.footW(ft, s, t);
      ft.step = { t0: t, dur, fx: p.x, fy: p.y, to, lift: clamp(5 + e * 0.17, 5, 26) }; ft.s = 0;
    };
    const thr = 10;
    if (!a.step && !b.step) { if (ea > thr || eb > thr) { if (ea >= eb) go(a, ta, ea); else go(b, tb, eb); } }
    else { const big = Math.max(34, stance * 0.85); if (!a.step && ea > big) go(a, ta, ea); else if (!b.step && eb > big) go(b, tb, eb); }
  }
  onStep(p) {
    if (Math.abs(this.vl) > 420) { if (rnd() < 0.5) FX.dust(p.x, p.y, 1, 20); AU.step(panOf(p.x, p.y), 0.04); }
  }
  // ---- body pass ----
  body(t, dt) {
    this.t = t; const tr = this.tr; const mode = tr.mode.at(t); const f = this.f = tr.face.at(t);
    const rot = this.rot = tr.rot.at(t), crouch = tr.crouch.at(t), stance = tr.stance.at(t), w = tr.w.at(t);
    this.reach = tr.reach.at(t); this.ext = tr.ext.at(t) * this.extMul; this.proj = tr.proj.at(t); this.gb = tr.gb.at(t); this.gox = tr.gox.at(t); this.goy = tr.goy.at(t);
    let H; const sid = tr.surf.at(t);
    if (mode === 'ground') {
      const s = SURF[sid], lx = tr.lx.at(t);
      const tan = s.tan(t), fw = rot2(f, 0, rot), fs = (fw.x * tan.x + fw.y * tan.y) >= 0 ? 1 : -1;
      if (this.mode !== 'ground' || this.surfId !== sid) { this.prevLx = lx; this.vl = 0; this.initFeet(s, lx, t, stance, w, fs); }
      if (dt > 0) { const v = (lx - this.prevLx) / dt; this.vl += (v - this.vl) * (1 - Math.exp(-dt * 18)); }
      this.prevLx = lx;
      this.plan(t, dt, s, lx, fs, stance, w);
      const gp = s.point(lx, t), n = s.nrm(t), st = tr.stick.at(t);
      let ux = lerp(0, n.x, st), uy = lerp(-1, n.y, st); const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
      let h = 86 - crouch;
      this.F = [];
      for (const ft of this.feet) {
        const p = this.footW(ft, s, t); this.F.push(p);
        if (ft.step && ft.s < 0.55) continue;
        const dx = gp.x - p.x, dy = gp.y - p.y, du = dx * ux + dy * uy, dd = dx * dx + dy * dy, Rr = LEG - 0.6;
        const disc = du * du - (dd - Rr * Rr); const hm = disc >= 0 ? -du + Math.sqrt(disc) : -du;
        if (hm < h) h = hm;
      }
      h = Math.max(h, 16);
      H = { x: gp.x + ux * h, y: gp.y + uy * h };
      this.surf = s;
    } else {
      const seg = this.gameH ? null : this.airSeg(t);
      H = this.gameH ? { x: this.gameH.x, y: this.gameH.y } : (seg ? this.airPos(seg, t) : { x: this.H.x, y: this.H.y });
      const tk = tr.tuck.at(t);
      const a = rot2(f * lerp(stance * 0.36, 25, tk), lerp(LEG * 0.95, 36, tk), rot), b = rot2(f * lerp(-stance * 0.3, -8, tk), lerp(LEG * 0.96, 50, tk), rot);
      this.F = [{ x: H.x + a.x, y: H.y + a.y }, { x: H.x + b.x, y: H.y + b.y }];
      // approaching a landing: bring feet onto the exact spots they will be planted at
      if (seg && tr.mode.at(seg.t1 + 1e-4) === 'ground') {
        const pre = Math.min(0.1, (seg.t1 - seg.t0) * 0.4), u = (t - (seg.t1 - pre)) / pre;
        if (u > 0) {
          const t1 = seg.t1 + 1e-4, ls = SURF[tr.surf.at(t1)], llx = tr.lx.at(t1), lf = tr.face.at(t1), lrot = tr.rot.at(t1);
          const st = tr.stance.at(t1), lw = tr.w.at(t1), tan = ls.tan(t), fw = rot2(lf, 0, lrot), fs = (fw.x * tan.x + fw.y * tan.y) >= 0 ? 1 : -1;
          const pF = ls.point(llx + fs * st * (0.5 - lw), t), pB = ls.point(llx - fs * st * (0.5 + lw), t), e = Math.min(1, u) ** 2 * (3 - 2 * Math.min(1, u));
          this.F = [{ x: lerp(this.F[0].x, pF.x, e), y: lerp(this.F[0].y, pF.y, e) }, { x: lerp(this.F[1].x, pB.x, e), y: lerp(this.F[1].y, pB.y, e) }];
        }
      }
      if (this.gameH && this.gameLandU > 0) {
        const ls = SURF[tr.surf.at(t)], llx = ls.local(H.x, 0, t), e = sstep(0, 1, this.gameLandU);
        const pF = ls.point(llx + f * stance * (0.5 - w), t), pB = ls.point(llx - f * stance * (0.5 + w), t);
        this.F = [{ x: lerp(this.F[0].x, pF.x, e), y: lerp(this.F[0].y, pF.y, e) }, { x: lerp(this.F[1].x, pB.x, e), y: lerp(this.F[1].y, pB.y, e) }];
      }
      this.surf = null;
    }
    // smooth foot transitions between ground and air (no single-frame pops)
    if (this.lastF && this.modePrev !== undefined && this.modePrev !== mode) {
      let from = this.lastF.map(p => ({ x: p.x, y: p.y }));
      const d0 = Math.hypot(from[0].x - this.F[0].x, from[0].y - this.F[0].y) + Math.hypot(from[1].x - this.F[1].x, from[1].y - this.F[1].y);
      const d1 = Math.hypot(from[1].x - this.F[0].x, from[1].y - this.F[0].y) + Math.hypot(from[0].x - this.F[1].x, from[0].y - this.F[1].y);
      if (d1 < d0) from = [from[1], from[0]];
      if (mode === 'air') this.bl = { from, t0: t, dur: 0.1 };
    }
    this.modePrev = mode;
    if (this.bl) {
      const u = (t - this.bl.t0) / this.bl.dur;
      if (u >= 1 || u < 0) this.bl = null;
      else { const e = u * u * (3 - 2 * u); this.F = this.F.map((p, i) => ({ x: lerp(this.bl.from[i].x, p.x, e), y: lerp(this.bl.from[i].y, p.y, e) })); }
    }
    this.lastF = this.F.map(p => ({ x: p.x, y: p.y }));
    this.mode = mode; this.surfId = sid; this.H = H;
    const lean = tr.lean.at(t), ta = this.ta = rot + lean * f, tdx = Math.sin(ta), tdy = -Math.cos(ta);
    this.td = { x: tdx, y: tdy };
    const C = this.C = { x: H.x + tdx * RIG.torso, y: H.y + tdy * RIG.torso };
    this.Sh = { x: C.x - tdx * 5, y: C.y - tdy * 5 };
    const ha = ta + tr.head.at(t) * f, hr = RIG.neck + RIG.headR;
    this.Hd = { x: C.x + Math.sin(ha) * hr, y: C.y - Math.cos(ha) * hr }; this.ha = ha;
    // kick override: front foot (largest forward offset)
    const k = tr.kick.at(t);
    if (k > 0.001) {
      const fw = rot2(f, 0, rot); const d0 = (this.F[0].x - H.x) * fw.x + (this.F[0].y - H.y) * fw.y, d1 = (this.F[1].x - H.x) * fw.x + (this.F[1].y - H.y) * fw.y;
      const i = d0 >= d1 ? 0 : 1, kt = rot2(f * 82, 4, rot - 0.05 * f);
      this.F[i] = { x: lerp(this.F[i].x, H.x + kt.x, k), y: lerp(this.F[i].y, H.y + kt.y, k) };
    }
    const kp = rot2(f, 0.12, rot);
    this.L0 = ik2(H.x, H.y, this.F[0].x, this.F[0].y, RIG.thigh, RIG.shin, kp.x, kp.y);
    this.L1 = ik2(H.x, H.y, this.F[1].x, this.F[1].y, RIG.thigh, RIG.shin, kp.x, kp.y);
    const tx = H.x + tdx * 30, ty = H.y + tdy * 30;
    if (!this.cp) this.cp = { x: tx, y: ty }; else if (dt > 0) { const kk = 1 - Math.exp(-dt * 7); this.cp.x += (tx - this.cp.x) * kk; this.cp.y += (ty - this.cp.y) * kk; }
    this.ctr = { x: tx, y: ty };
  }
  // ---- blade (lazy, may depend on opponent) ----
  gripAt(a) {
    const f = this.f, rot = this.rot, rho = f > 0 ? a - rot : PI - a + rot, ho = hiltOff(rho), re = this.reach;
    let ox = f * ho[0] * re, oy = ho[1] * re;
    if (this.gb > 0.001) { ox = lerp(ox, f * this.gox, this.gb); oy = lerp(oy, this.goy, this.gb); }
    const o = rot2(ox, oy, rot); const d = Math.hypot(o.x, o.y), mx = ARM - 3;
    if (d > mx) { o.x *= mx / d; o.y *= mx / d; }
    return { x: this.Sh.x + o.x, y: this.Sh.y + o.y };
  }
  bladeAt(a) {
    const g = this.gripAt(a), dx = Math.cos(a), dy = Math.sin(a), pj = this.proj, L = RIG.blade * this.ext * pj, hl = RIG.hilt * pj;
    return { a, hl, gx: g.x, gy: g.y, dx, dy, hx: g.x - dx * hl, hy: g.y - dy * hl, sx: g.x + dx * hl, sy: g.y + dy * hl, tx: g.x + dx * (hl + L), ty: g.y + dy * (hl + L), L, ext: this.ext };
  }
  blade() {
    if (this._bf === FRAME) return this.B;
    if (this._busy) return this.B || this.bladeAt(this.lastA || 0);
    this._busy = true;
    const a = this.tr.sab.at(this.t) + this.rot * this.tr.sabRel.at(this.t);
    this.lastA = a; this.B = this.bladeAt(a);
    this._busy = false; this._bf = FRAME; return this.B;
  }
  bladePt(s) { const B = this.blade(), L = Math.max(B.L, RIG.blade * 0.6); return { x: B.sx + B.dx * L * s, y: B.sy + B.dy * L * s }; }
  aimAt(px, py) { let a = Math.atan2(py - this.Sh.y, px - this.Sh.x); for (let i = 0; i < 12; i++) { const g = this.gripAt(a), na = Math.atan2(py - g.y, px - g.x); a += wrapPi(na - a) * (i < 6 ? 1 : 0.5); } return a; }
  // ---- finish pass: arms, trail, cloth ----
  finish(t, dt, rate) {
    const B = this.blade(), f = this.f, rot = this.rot, g = this.tr.grip.at(t);
    const h1 = { x: B.gx + B.dx * 5 * this.proj, y: B.gy + B.dy * 5 * this.proj };
    let h2 = { x: B.gx - B.dx * 6 * this.proj, y: B.gy - B.dy * 6 * this.proj };
    if (this.noHilt) { h1.x = B.gx; h1.y = B.gy; }
    if (g > 0.001) { const o = rot2(f * this.tr.offx.at(t), this.tr.offy.at(t), rot); const O = { x: this.Sh.x + o.x, y: this.Sh.y + o.y }; h2 = { x: lerp(h2.x, O.x, g), y: lerp(h2.y, O.y, g) }; }
    const ep = rot2(-f * 0.35, 1, rot);
    this.A0 = ik2(this.Sh.x, this.Sh.y, h1.x, h1.y, RIG.upper, RIG.fore, ep.x, ep.y);
    this.A1 = ik2(this.Sh.x, this.Sh.y, h2.x, h2.y, RIG.upper, RIG.fore, ep.x, ep.y);
    this.hand2 = { x: this.A1.ex, y: this.A1.ey };
    // tip speed (apparent, real-time)
    if (this.tipPrev && dt > 0) { const v = Math.hypot(B.tx - this.tipPrev.x, B.ty - this.tipPrev.y) / dt * rate; this.tipSpeed += (v - this.tipSpeed) * 0.5; }
    else if (dt > 0) this.tipSpeed *= 0.8;
    this.tipPrev = { x: B.tx, y: B.ty };
    // trail
    if (dt > 0) {
      if (B.ext < 0.05) this.trail.length = 0;
      else { this.trail.push({ t, gx: B.gx, gy: B.gy, a: B.a, L: B.L, hl: RIG.hilt * this.proj }); while (this.trail.length > 2 && t - this.trail[0].t > 0.14) this.trail.shift(); }
    }
    // ghosts
    if (this.tr.ghost.at(t) > 0.5 && t - this.lastGhost > 0.024 && dt > 0) { this.lastGhost = t; this.ghosts.push({ t, P: this.pts() }); if (this.ghosts.length > 7) this.ghosts.shift(); }
    // cloth
    if (!this.cloth) this.initCloth();
    this.clothAcc += dt; let n = 0; const h = 1 / 240;
    while (this.clothAcc >= h && n < 40) { this.clothAcc -= h; n++; this.stepCloth(h); }
    if (n >= 40) this.clothAcc = 0;
  }
  pts() { return { H: this.H, C: this.C, Hd: this.Hd, L0: this.L0, L1: this.L1, A0: this.A0, A1: this.A1, Sh: this.Sh }; }
  clothAnchor() {
    const o = this.o.cloth;
    if (o.at === 'sh') { const b = rot2(-this.f * 3, 2, this.ta); return { x: this.Sh.x + b.x, y: this.Sh.y + b.y }; }
    const b = rot2(-this.f * 4, -8, this.ta); return { x: this.H.x + b.x, y: this.H.y + b.y };
  }
  initCloth() { const o = this.o.cloth, a = this.clothAnchor(); this.cloth = { n: o.n, L: o.len, p: [], q: [] }; for (let i = 0; i < o.n; i++) { this.cloth.p.push({ x: a.x - this.f * i * 2, y: a.y + i * o.len }); this.cloth.q.push({ x: a.x - this.f * i * 2, y: a.y + i * o.len }); } }
  stepCloth(h) {
    const c = this.cloth, a = this.clothAnchor(); c.p[0].x = a.x; c.p[0].y = a.y;
    const wx = WIND.x + noise1(this.t * 3 + this.idx * 9) * 300, wy = 1100;
    for (let i = 1; i < c.n; i++) { const p = c.p[i], q = c.q[i]; const vx = (p.x - q.x) * 0.985, vy = (p.y - q.y) * 0.985; q.x = p.x; q.y = p.y; p.x += vx + wx * h * h * (0.3 + i / c.n); p.y += vy + (wy + WIND.y) * h * h; }
    for (let it = 0; it < 5; it++) {
      for (let i = 1; i < c.n; i++) {
        const A = c.p[i - 1], B = c.p[i]; const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1e-6, k = (d - c.L) / d;
        if (i === 1) { B.x -= dx * k; B.y -= dy * k; } else { A.x += dx * k * 0.5; A.y += dy * k * 0.5; B.x -= dx * k * 0.5; B.y -= dy * k * 0.5; }
      }
      c.p[0].x = a.x; c.p[0].y = a.y;
    }
    // keep cape behind the body: push nodes away from torso front a little
    const fw = rot2(this.f, 0, this.rot);
    for (let i = 1; i < c.n; i++) { const p = c.p[i]; const d = (p.x - this.H.x) * fw.x + (p.y - this.H.y) * fw.y; if (d > 6) { p.x -= fw.x * (d - 6) * 0.3; p.y -= fw.y * (d - 6) * 0.3; } }
  }
}
