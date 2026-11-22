// ================= GAME: playable 1P (vs CPU) / 2P (local) =================
let T = 0, RT = 0, hitstop = 0, J, S, FIGHTERS = [], RATE_NOW = 1, QUAL = 1, ftAvg = 16;
const cam = { x: 0, y: -220, z: 1.2, r: 0, sx: 0, sy: 0, sr: 0, zz: 1.2 };
const cv = document.getElementById('c'); cv.width = SW; cv.height = SH;
const ctx = cv.getContext('2d');
const EM = mkCanvas(SW / 2, SH / 2), ex = EM.getContext('2d');
const B1 = mkCanvas(480, 270), b1 = B1.getContext('2d'), B2 = mkCanvas(240, 135), b2 = B2.getContext('2d'), B3 = mkCanvas(120, 68), b3 = B3.getContext('2d');
const HAS_FILTER = typeof ctx.filter === 'string';
let VIG;
function camX(c, p = 1, A = null, s = 1) {
  const z = p === 1 ? cam.zz : Math.pow(cam.zz, 0.35 + 0.65 * p);
  c.setTransform(s, 0, 0, s, 0, 0);
  c.translate(SW / 2 + cam.sx, SH / 2 + cam.sy); c.rotate(cam.r + cam.sr); c.scale(z, z);
  if (p === 1 || !A) c.translate(-cam.x, -cam.y); else c.translate(-(A.x + p * (cam.x - A.x)), -(A.y + p * (cam.y - A.y)));
}
function w2s(x, y) { const z = cam.zz, dx = (x - cam.x) * z, dy = (y - cam.y) * z, a = cam.r + cam.sr, c = Math.cos(a), s = Math.sin(a); return { x: SW / 2 + cam.sx + dx * c - dy * s, y: SH / 2 + cam.sy + dx * s + dy * c }; }
function panOf(x, y) { const p = w2s(x, y); return clamp((p.x / SW) * 2 - 1, -1, 1) * 0.7; }
function view() { const z = cam.zz, hw = SW / 2 / z * 1.3, hh = SH / 2 / z * 1.5; return { x0: cam.x - hw, x1: cam.x + hw, y0: cam.y - hh, y1: cam.y + hh }; }
function buildVig() { VIG = mkCanvas(SW, SH); const x = VIG.getContext('2d'); const g = x.createRadialGradient(SW / 2, SH / 2, SH * 0.38, SW / 2, SH / 2, SH * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); x.fillStyle = g; x.fillRect(0, 0, SW, SH); }

// ---------- live parameter tracks (game drives the rig directly) ----------
class Live { constructor(v) { this.v = v; } at() { return this.v; } key() { return this; } hold() { return this; } last() { return { t: 0, v: this.v }; } }
function mkFighters() {
  J = new Fighter('J', { idx: 0, col: BLUE, face: 1, lx: -260, surf: 'hall', sab: 0.75, body: [228, 222, 208], outline: 'rgba(10,12,26,0.95)', cloth: { at: 'hip', n: 6, len: 8, w0: 9, w1: 5, col: '#9a8a70', edge: 'rgba(10,12,26,0.8)' } });
  S = new Fighter('S', { idx: 1, col: RED, face: -1, lx: 260, surf: 'hall', sab: PI - 0.75, body: [26, 22, 30], outline: 'rgba(205,30,40,0.95)', cloth: { at: 'sh', n: 11, len: 11, w0: 13, w1: 30, col: '#0f080c', edge: 'rgba(150,20,30,0.7)' } });
  for (const F of [J, S]) for (const k in F.tr) F.tr[k] = new Live(F.tr[k].at(0));
  FIGHTERS = [J, S];
}

// ---------- input ----------
const KEY = {};
const KMAP = {
  p1: { l: ['KeyA'], r: ['KeyD'], u: ['KeyW'], g: ['KeyS'], a: ['KeyF'], h: ['KeyG'], f: ['KeyH'] },
  p2: { l: ['ArrowLeft'], r: ['ArrowRight'], u: ['ArrowUp'], g: ['ArrowDown'], a: ['KeyK', 'Numpad1'], h: ['KeyL', 'Numpad2'], f: ['Semicolon', 'Numpad3'] },
};
const BTN = ['l', 'r', 'u', 'g', 'a', 'h', 'f'];
const IN = [{}, {}], PREV = [{}, {}], PADPREV = [{}, {}];
let MENUKEY = {}, MENUPREV = {};
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
  KEY[e.code] = true; AU.init(); onAnyInput();
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
  if (GM.paused && e.code === 'KeyQ') { GM.paused = false; toMenu(); }
  if (GM.leaveAsk && e.code === 'KeyQ') { GM.leaveAsk = false; leaveOnline(); }
  if (GM.scene === 'menu' && GM.screen) lobbyKey(e);
});
window.addEventListener('keyup', e => { KEY[e.code] = false; });
window.addEventListener('blur', () => { for (const k in KEY) KEY[k] = false; });
function getPads() { try { return (navigator.getGamepads && navigator.getGamepads()) || []; } catch (e) { return []; } }
function padRead(i) {
  const pads = getPads(); const p = pads && pads[i]; if (!p || !p.buttons) return null;
  const b = k => !!(p.buttons[k] && p.buttons[k].pressed), ax = p.axes[0] || 0, ay = p.axes[1] || 0;
  return { l: ax < -0.45 || b(14), r: ax > 0.45 || b(15), u: b(0) || b(12) || ay < -0.75, g: b(4) || b(5) || b(6) || b(7) || b(13) || ay > 0.7, a: b(2), h: b(3), f: b(1), start: b(9) };
}
function readInputs() {
  const raw = [{}, {}];
  for (let i = 0; i < 2; i++) { const m = KMAP[i ? 'p2' : 'p1']; for (const n of BTN) raw[i][n] = m[n].some(c => KEY[c]); }
  for (let i = 0; i < 2; i++) { const p = padRead(i); if (p) { for (const n of BTN) raw[i][n] = raw[i][n] || p[n]; if (p.start && !PADPREV[i].start) togglePause(); PADPREV[i] = p; } }
  if (['1p', 'host', 'guest'].includes(GM.mode)) { for (const n of BTN) raw[0][n] = raw[0][n] || raw[1][n]; raw[1] = {}; }
  for (let i = 0; i < 2; i++) {
    const o = IN[i]; for (const n of BTN) { o[n] = !!raw[i][n]; o['p' + n] = o[n] && !PREV[i][n]; PREV[i][n] = o[n]; }
  }
  if (GM.mode === 'host') {
    const ri = NET.rin || {}, o = IN[1];
    for (const n of BTN) { o[n] = !!ri[n]; o['p' + n] = false; }
    for (const n of ['u', 'g', 'a', 'h', 'f']) { const c = (ri.c && ri.c[n]) || 0; if (c > NET.lastC[n]) { o['p' + n] = true; NET.lastC[n] = c; } }
  }
  // menu keys (keyboard + pads)
  const M = { up: KEY.KeyW || KEY.ArrowUp, down: KEY.KeyS || KEY.ArrowDown, left: KEY.KeyA || KEY.ArrowLeft, right: KEY.KeyD || KEY.ArrowRight, ok: KEY.Enter || KEY.Space || KEY.NumpadEnter || KEY.KeyF || KEY.KeyK };
  for (const p of getPads()) {
    if (!p || !p.buttons) continue; const b = k => !!(p.buttons[k] && p.buttons[k].pressed), ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    M.up = M.up || b(12) || ay < -0.6; M.down = M.down || b(13) || ay > 0.6; M.left = M.left || b(14) || ax < -0.6; M.right = M.right || b(15) || ax > 0.6; M.ok = M.ok || b(0) || b(2);
  }
  MENUKEY = M;
}
const mpress = n => MENUKEY[n] && !MENUPREV[n];

// ---------- moves (blade angles are relative: 0 forward, -π/2 up, +π/2 down) ----------
const MOVES = {
  l1: { w: 0.075, a: 0.07, r: 0.17, from: -2.45, to: 0.2, dir: 1, dmg: 7, kb: 240, stun: 0.26, bstun: 0.16, gdmg: 9, lean: 0.24, crouch: 14, lunge: 330, next: 'l2', type: 'mid', pow: 0.45 },
  l2: { w: 0.06, a: 0.07, r: 0.17, from: 1.95, to: -0.75, dir: -1, dmg: 7, kb: 240, stun: 0.26, bstun: 0.16, gdmg: 9, lean: 0.2, crouch: 16, lunge: 300, next: 'l3', type: 'mid', pow: 0.45 },
  l3: { w: 0.1, a: 0.08, r: 0.3, from: -2.95, to: 0.6, dir: 1, dmg: 11, kb: 640, stun: 0.42, bstun: 0.22, gdmg: 14, lean: 0.34, crouch: 18, lunge: 430, knock: true, type: 'mid', pow: 0.65 },
  heavy: { w: 0.24, a: 0.09, r: 0.36, from: -2.75, to: 0.8, dir: 1, dmg: 17, kb: 760, stun: 0.5, bstun: 0.3, gdmg: 40, chip: 3, lean: 0.4, crouch: 24, lunge: 560, knock: true, type: 'high', heavy: true, pow: 0.85 },
  low: { w: 0.11, a: 0.09, r: 0.26, from: 2.65, to: 0.15, dir: -1, dmg: 8, kb: 300, stun: 0.3, bstun: 0.18, gdmg: 10, lean: 0.34, crouch: 44, lunge: 280, type: 'low', pow: 0.5 },
  air: { w: 0.05, a: 0.13, r: 0.14, from: -2.3, to: 1.45, dir: 1, dmg: 10, kb: 380, stun: 0.32, bstun: 0.18, gdmg: 14, lean: 0.2, crouch: 10, lunge: 0, type: 'high', air: true, pow: 0.6 },
};
const IDLE_RHO = 0.72, GUARD_RHO = -1.5;
function unwrapTo(a, prev, dw) {
  if (!dw) return a + TAU * Math.round((prev - a) / TAU);
  while ((a - prev) * dw < -1e-6) a += TAU * dw;
  while ((a - prev) * dw > TAU + 1e-6) a -= TAU * dw;
  return a;
}
const ARENA = { x0: -925, x1: 925 }, LAND_H = -56, LIE_H = -16;

// ---------- player ----------
class Player {
  constructor(i, F) { this.i = i; this.F = F; this.reset(i ? 270 : -270, i ? -1 : 1, false); }
  reset(x, face, lit) {
    Object.assign(this, {
      x, hy: -80, vx: 0, vy: 0, ground: true, face, hp: 100, hpLag: 100, force: 35, guard: 100, state: 'idle', st: 0,
      mv: null, mvName: '', ph: '', pt: 0, rho: IDLE_RHO, rhoS: IDLE_RHO, rhoE: 0, toU: 0, rot: 0, spin: -1, spinDir: 1, airJump: 1, airAtk: false,
      queued: null, queueT: 0, gPress: -9, inv: 0, combo: 0, comboT: 0, flash: 0, ext: lit ? 1 : 0, connected: false, forceDone: false,
      prevB: null, lastFace: face, stunDur: 0, lieT: 0, ko: false, rotS: 0, hyS: 0, dmgTaken: 0,
    });
    this.tgt = { crouch: 12, stance: 60, lean: 0.06, reach: 1, grip: 0, offx: 3, offy: 52, tuck: 0.15, head: 0, gb: 0, gox: 22, goy: 2, w: 0, kick: 0 };
    this.pp = Object.assign({}, this.tgt);
    const F = this.F; F.trail.length = 0; F.ghosts.length = 0; F.cloth = null; F.mode = null; F.cp = null; F.hitFlash = 0; F.bl = null; F.lastF = null; F.modePrev = undefined;
    F.H = { x, y: -80 };
  }
  get hipY() { return this.ground ? this.F.H.y : this.hy; }
  get busy() { return !['idle', 'walk', 'guard', 'air'].includes(this.state); }
  facingTo(O) { return Math.sign(O.x - this.x) === this.face || Math.abs(O.x - this.x) < 8; }
  // ----- actions -----
  startAttack(name) {
    if (!this.ground) { if (this.airAtk) return; name = 'air'; this.airAtk = true; }
    else if (name === 'air') name = 'l1';
    const mv = MOVES[name]; this.state = 'attack'; this.mv = mv; this.mvName = name; this.ph = 'w'; this.pt = 0; this.rhoS = this.rho; this.connected = false; this.st = 0;
  }
  startForce() { this.state = 'force'; this.st = 0; this.force -= 50; this.forceDone = false; this.vx *= 0.3; }
  jump(I) {
    this.ground = false; this.hy = this.F.H.y; this.vy = -1010; this.state = 'air'; this.airJump = 1; this.airAtk = false; this.spin = -1;
    this.vx = ((I.r ? 1 : 0) - (I.l ? 1 : 0)) * 320;
    vfx('jump', this.x);
  }
  airFlip(I) {
    this.vy = -860; this.airJump = 0; this.spin = 0; const mvd = (I.r ? 1 : 0) - (I.l ? 1 : 0);
    if (mvd) this.vx = mvd * 360; this.spinDir = (mvd === 0 ? 1 : (mvd === this.face ? 1 : -1)) * this.face;
    vfx('whoosh', 1.2, this.x, this.hy); this.F.tr.ghost.v = 1;
  }
  knockdown(dir, vx, vy) {
    this.state = 'down'; this.st = 0; this.ground = false; this.hy = this.F.H.y; this.vx = dir * vx; this.vy = -vy; this.lieT = 0; this.mv = null; this.spin = -1;
    this.rotS = this.rot;
  }
  stunned(kind, dur) { this.state = kind; this.st = 0; this.stunDur = dur; this.mv = null; this.ph = ''; }
  // ----- per-frame logic -----
  update(dt, I, O) {
    const F = this.F, tg = this.tgt, fight = GM.phase === 'fight';
    this.st += dt; this.inv = Math.max(0, this.inv - dt); this.flash = Math.max(0, this.flash - dt * 6);
    if (fight) { this.force = Math.min(100, this.force + dt * 7); if (this.state !== 'guard') this.guard = Math.min(100, this.guard + dt * 24); }
    this.hpLag = this.hpLag > this.hp ? Math.max(this.hp, this.hpLag - dt * 45) : this.hp;
    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    if (this.queueT > 0) this.queueT -= dt; else this.queued = null;
    if (fight && !this.ko) {
      if (I.pg) this.gPress = T;
      if (I.pa) { this.queued = (I.g && this.ground) ? 'low' : 'a'; this.queueT = 0.24; }
      if (I.ph) { this.queued = 'heavy'; this.queueT = 0.24; }
      if (I.pf) { this.queued = 'force'; this.queueT = 0.2; }
    }
    Object.assign(tg, { crouch: 12, stance: 60, lean: 0.06, reach: 1, grip: 0, offx: 3, offy: 52, tuck: 0.15, head: 0, gb: 0, w: 0, kick: 0 });
    let rhoT = IDLE_RHO, rate = 14;
    const dxO = O.x - this.x;
    switch (this.state) {
      case 'idle': case 'walk': case 'guard': {
        if (Math.abs(dxO) > 6 && O.state !== 'down') this.face = Math.sign(dxO);
        const mvd = fight ? (I.r ? 1 : 0) - (I.l ? 1 : 0) : 0;
        const guarding = fight && I.g && this.guard > 0;
        const back = mvd * this.face < 0, sp = guarding ? 110 : (back ? 240 : 300);
        this.vx += (mvd * sp - this.vx) * Math.min(1, dt * 14);
        if (guarding && this.state !== 'guard') this.st = 0;
        this.state = guarding ? 'guard' : (mvd ? 'walk' : 'idle');
        if (fight && this.queued) {
          const q = this.queued; this.queued = null;
          if (q === 'force') { if (this.force >= 50) { this.startForce(); break; } }
          else { this.startAttack(q === 'a' ? 'l1' : q); break; }
        }
        if (fight && I.pu) { this.jump(I); break; }
        if (guarding) { rhoT = GUARD_RHO; Object.assign(tg, { crouch: 22, lean: -0.02, gb: 0.65, reach: 0.92, stance: 70 }); rate = 28; }
        else { tg.crouch = 12 + Math.sin(RT * 3.2 + this.i * 2) * 2.2; if (mvd) { tg.lean = back ? -0.04 : 0.12; tg.stance = 52; } }
        break;
      }
      case 'air': {
        if (Math.abs(dxO) > 6) this.face = Math.sign(dxO);
        const mvd = fight ? (I.r ? 1 : 0) - (I.l ? 1 : 0) : 0;
        this.vx += (mvd * 300 - this.vx) * Math.min(1, dt * 3.5);
        if (fight && I.pu && this.airJump > 0) this.airFlip(I);
        if (fight && this.queued && this.queued !== 'force' && !this.airAtk) { this.queued = null; this.startAttack('air'); break; }
        tg.tuck = this.spin >= 0 ? 0.95 : 0.6; tg.lean = 0.1; rhoT = -0.55;
        break;
      }
      case 'attack': {
        const mv = this.mv; this.pt += dt;
        if (this.ph === 'w') {
          const u = Math.min(1, this.pt / mv.w); this.rho = this.rhoS + wrapPi(mv.from - this.rhoS) * EASE.o3(u);
          Object.assign(tg, { lean: -0.06, crouch: mv.crouch * 0.6, stance: 64 });
          if (u >= 1) {
            this.ph = 'a'; this.pt = 0; this.rho = mv.from; this.toU = unwrapTo(mv.to, mv.from, mv.dir);
            if (this.ground) this.vx = this.face * mv.lunge * (mv.type === 'low' ? 0.8 : 1);
            vfx('whoosh', 0.5 + mv.pow, this.x, this.hipY); this.F.tr.ghost.v = mv.heavy ? 1 : 0;
          }
        } else if (this.ph === 'a') {
          const u = Math.min(1, this.pt / mv.a); this.rho = mv.from + (this.toU - mv.from) * (mv.air ? EASE.io(u) : EASE.i2(u) * 0.35 + u * 0.65);
          Object.assign(tg, { lean: mv.lean, crouch: mv.crouch, stance: mv.type === 'low' ? 84 : 76, w: 0.25 });
          if (u >= 1) { this.ph = 'r'; this.pt = 0; this.rhoE = this.rho; this.F.tr.ghost.v = 0; }
        } else {
          const u = Math.min(1, this.pt / mv.r); this.rho = this.rhoE + wrapPi(IDLE_RHO - this.rhoE) * EASE.io(u);
          Object.assign(tg, { lean: lerp(mv.lean, 0.06, u), crouch: lerp(mv.crouch, 12, u), stance: 66 });
          if (fight && this.queued === 'a' && mv.next && u > 0.2 && this.ground) { this.queued = null; this.startAttack(mv.next); break; }
          if (u >= 1) { this.state = this.ground ? 'idle' : 'air'; this.mv = null; }
        }
        if (this.ground) this.vx *= Math.exp(-dt * 7);
        if (!this.ground) { tg.tuck = 0.75; }
        rhoT = null;
        break;
      }
      case 'force': {
        const u = this.st;
        Object.assign(tg, { grip: 1, offx: u < 0.16 ? 8 : 64, offy: u < 0.16 ? 14 : -6, lean: u < 0.16 ? -0.08 : 0.26, stance: 76, crouch: 18 });
        rhoT = 2.25; rate = 16;
        if (u >= 0.16 && !this.forceDone) { this.forceDone = true; doForce(this, O); }
        if (u >= 0.55) this.state = this.ground ? 'idle' : 'air';
        if (this.ground) this.vx *= Math.exp(-dt * 8);
        break;
      }
      case 'hitstun': case 'bstun': case 'parried': case 'broken': {
        const k = this.state;
        if (k === 'hitstun') { Object.assign(tg, { lean: -0.32, head: -0.4, crouch: 22 }); rhoT = 1.7; rate = 10; }
        if (k === 'bstun') { Object.assign(tg, { lean: -0.12, crouch: 24, gb: 0.65, reach: 0.9, stance: 74 }); rhoT = GUARD_RHO; rate = 24; }
        if (k === 'parried') { Object.assign(tg, { lean: -0.3, head: -0.3, crouch: 16 }); rhoT = -2.6; rate = 18; }
        if (k === 'broken') { Object.assign(tg, { lean: 0.25, head: 0.45, crouch: 32 }); rhoT = 1.95; rate = 8; }
        if (this.ground) this.vx *= Math.exp(-dt * 6);
        if (this.st >= this.stunDur) { this.state = this.ground ? 'idle' : 'air'; if (k === 'broken') this.guard = 60; }
        break;
      }
      case 'down': {
        tg.tuck = 0.3; rhoT = 1.3; rate = 8;
        const tgtRot = -this.face * 1.45;
        if (!this.ground && this.hy < LIE_H - 1) { this.rot = lerp(this.rotS, tgtRot, EASE.o2(Math.min(1, this.st / 0.32))); }
        else {
          this.rot = tgtRot; this.lieT += dt;
          if (this.lieT > 0.6 && !this.ko && GM.phase !== 'over') { this.state = 'getup'; this.st = 0; this.rotS = this.rot; this.hyS = this.hy; }
        }
        break;
      }
      case 'getup': {
        const u = Math.min(1, this.st / 0.42), e = EASE.io(u);
        this.rot = lerp(this.rotS, 0, e); this.hy = lerp(this.hyS, -74, e); tg.tuck = lerp(0.3, 0.05, u); rhoT = IDLE_RHO;
        this.F.gameLandU = u;
        if (u >= 1) { this.ground = true; this.rot = 0; this.state = 'idle'; this.inv = 0.35; this.F.gameLandU = 0; }
        break;
      }
      case 'lock': {
        const L = GM.lock, adv = (this === L.a ? L.v : -L.v) / 12;
        Object.assign(tg, { lean: 0.28 + adv * 0.14, crouch: 22 - adv * 6, reach: 0.82, stance: 78, head: 0.1 });
        rhoT = -1.02 + Math.sin(RT * 34 + this.i) * 0.035; rate = 20;
        const want = (O.x + this.x) / 2 - this.face * 58; this.vx = (want - this.x) * 6;
        break;
      }
      case 'win': { Object.assign(tg, { lean: 0.02, crouch: 6, stance: 50, head: -0.15 }); rhoT = -1.62; rate = 6; this.vx *= Math.exp(-dt * 6); break; }
    }
    if (rhoT !== null) this.rho += wrapPi(rhoT - this.rho) * Math.min(1, dt * rate);
    // ----- physics -----
    if (this.ground) {
      this.x += this.vx * dt;
    } else if (this.state !== 'getup') {
      this.vy += G * dt; this.x += this.vx * dt; this.hy += this.vy * dt;
      if (this.spin >= 0) { this.spin += dt / 0.42; if (this.spin >= 1) { this.spin = -1; this.rot = 0; this.F.tr.ghost.v = 0; } else this.rot = this.spinDir * TAU * EASE.io(this.spin); }
      const landY = this.state === 'down' ? LIE_H : LAND_H;
      this.F.gameLandU = (this.state !== 'down' && this.vy > 0) ? clamp(1 - (landY - this.hy) / 70, 0, 1) : 0;
      if (this.hy >= landY && this.vy > 0) {
        this.hy = landY;
        if (this.state === 'down') {
          if (this.vy > 700) { this.vy = -this.vy * 0.28; vfx('land', this.x, 0.5, 0.2); }
          else { this.vy = 0; this.vx = 0; this.ground = false; this.hy = LIE_H; vfx('land', this.x, 0.42, 0); }
          if (this.vy === 0) this.vx = 0;
        } else {
          this.ground = true; this.vy = 0; this.rot = 0; this.spin = -1; this.pp.crouch = 32; this.F.gameLandU = 0; this.F.tr.ghost.v = 0;
          if (this.state === 'air') this.state = 'idle';
          if (this.state === 'attack' && this.mv && this.mv.air) { this.state = 'idle'; this.mv = null; }
          vfx('land', this.x, 0.25, 0);
        }
      }
    }
    if (this.state === 'down' && this.hy >= LIE_H && this.vy === 0) this.vx = 0;
    // walls
    if (this.x < ARENA.x0 || this.x > ARENA.x1) {
      const wx = this.x < ARENA.x0 ? ARENA.x0 : ARENA.x1;
      if (this.state === 'down' && Math.abs(this.vx) > 450) {
        const sx = wx < 0 ? -1000 : 1000; vfx('wall', sx, this.hipY); this.vx = -this.vx * 0.3; hitstop = Math.max(hitstop, 0.06);
      } else this.vx = 0;
      this.x = wx;
    }
  }
  apply(dt) {
    const F = this.F, tr = F.tr, k = 1 - Math.exp(-dt * 16);
    for (const n in this.tgt) this.pp[n] += (this.tgt[n] - this.pp[n]) * k;
    if (this.face !== this.lastFace) { F.trail.length = 0; this.prevB = null; this.lastFace = this.face; }
    tr.mode.v = this.ground ? 'ground' : 'air'; tr.face.v = this.face; tr.lx.v = this.x; tr.rot.v = this.rot;
    F.gameH = { x: this.x, y: this.hy };
    for (const n of ['crouch', 'stance', 'lean', 'reach', 'grip', 'offx', 'offy', 'tuck', 'head', 'gb', 'gox', 'goy', 'w', 'kick']) tr[n].v = this.pp[n];
    tr.sab.v = this.face > 0 ? this.rho + this.rot : PI - this.rho + this.rot;
    tr.ext.v = this.ext; F.hitFlash = this.flash;
  }
}

// ---------- combat resolution ----------
function segDist(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y) {
  const x = segX(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y); if (x) return { d: 0, x: x.x, y: x.y };
  let best = { d: 1e9 };
  const tst = (px, py, ax, ay, bx, by, onB) => { const q = closestPtSeg(px, py, ax, ay, bx, by), d = Math.hypot(q.x - px, q.y - py); if (d < best.d) best = { d, x: onB ? q.x : px, y: onB ? q.y : py }; };
  tst(a1x, a1y, b1x, b1y, b2x, b2y, true); tst(a2x, a2y, b1x, b1y, b2x, b2y, true); tst(b1x, b1y, a1x, a1y, a2x, a2y, false); tst(b2x, b2y, a1x, a1y, a2x, a2y, false);
  return best;
}
function sweep(Bp, B, n) {
  if (!Bp) return [B];
  const out = [], da = wrapPi(B.a - Bp.a);
  for (let k = 1; k <= n; k++) {
    const u = k / n, a = Bp.a + da * u, gx = lerp(Bp.gx, B.gx, u), gy = lerp(Bp.gy, B.gy, u), dx = Math.cos(a), dy = Math.sin(a), hl = lerp(Bp.hl, B.hl, u), L = lerp(Bp.L, B.L, u);
    out.push({ sx: gx + dx * hl, sy: gy + dy * hl, tx: gx + dx * (hl + L), ty: gy + dy * (hl + L), a });
  }
  return out;
}
function bodyHit(s, D) {
  const F = D.F; if (!F.L0) return null;
  const caps = [[F.H, F.C, 13], [F.C, F.Hd, 10], [F.Hd, F.Hd, 16], [F.H, { x: F.L0.jx, y: F.L0.jy }, 8], [{ x: F.L0.jx, y: F.L0.jy }, { x: F.L0.ex, y: F.L0.ey }, 7], [F.H, { x: F.L1.jx, y: F.L1.jy }, 8], [{ x: F.L1.jx, y: F.L1.jy }, { x: F.L1.ex, y: F.L1.ey }, 7]];
  let best = null;
  for (const c of caps) { const r = segDist(s.sx, s.sy, s.tx, s.ty, c[0].x, c[0].y, c[1].x, c[1].y); if (r.d < c[2] && (!best || r.d < best.d)) best = r; }
  return best;
}
function combat(A, D) {
  if (A.state !== 'attack' || A.ph !== 'a' || A.connected) return;
  const B = A.F.B; if (!B || B.ext < 0.5) return;
  const segs = sweep(A.prevB, B, 4), Db = D.F.B, mv = A.mv;
  const guardOK = D.state === 'guard' && mv.type !== 'low' && D.facingTo(A) && D.ground;
  const dActive = D.state === 'attack' && D.ph === 'a';
  for (const s of segs) {
    let bx = null; if (Db && Db.ext > 0.5) bx = segX(s.sx, s.sy, s.tx, s.ty, Db.sx, Db.sy, Db.tx, Db.ty);
    const bh = (D.state === 'down' || D.state === 'getup' || D.inv > 0) ? null : bodyHit(s, D);
    if (bx && dActive) { clashAct(A, D, bx); return; }
    if (guardOK && (bx || bh)) { let p = bx; if (!p) { const q = closestPtSeg(bh.x, bh.y, Db.sx, Db.sy, Db.tx, Db.ty); p = { x: q.x, y: q.y }; } block(A, D, p); return; }
    if (bx && D.state === 'attack') { deflect(A, D, bx); return; }
    if (bh) { hit(A, D, bh); return; }
  }
}
function recoil(P, amt = 0.35) { if (P.state !== 'attack') return; P.ph = 'r'; P.pt = 0; P.rhoE = P.rho - P.mv.dir * amt; P.connected = true; P.F.tr.ghost.v = 0; }
function sparks(x, y, pow, ang) { vfx('sparks', x, y, pow, ang); }
function sparksFx(x, y, pow, ang) {
  const n = 14 + pow * 60 | 0;
  for (let i = 0; i < n; i++) { const d = ang + RS() * PI / 2 + R(-1.1, 1.1), sp = R(150, 600 + 1000 * pow); FX.spark(x, y, Math.cos(d) * sp, Math.sin(d) * sp - R(0, 220), R(0.12, 0.4 + 0.45 * pow), R(1.3, 3)); }
  FX.flash(x, y, 26 + 70 * pow, 0.06 + 0.08 * pow, 'wh', 0.9); FX.flash(x, y, 50 + 140 * pow, 0.07 + 0.1 * pow, 'p', 0.25 + 0.25 * pow);
  if (pow > 0.55) FX.ring(x, y, 12, 700 + 800 * pow, 0.22 + 0.15 * pow, 3 + 5 * pow, [225, 220, 255]);
  FX.light(x, y, 260 + 360 * pow, [240, 230, 255], 0.3 + 0.5 * pow, 0.08 + 0.1 * pow);
  FX.screenFlash = Math.max(FX.screenFlash, 0.02 + 0.1 * pow * pow);
  FX.shake(0.12 + 0.45 * pow * pow); FX.punch += 0.015 + 0.045 * pow;
  AU.clash(pow, panOf(x, y));
}
function block(A, D, p) {
  const mv = A.mv;
  if (T - D.gPress < 0.14) { parry(A, D, p); return; }
  sparks(p.x, p.y, mv.pow * 0.85, A.F.B.a); hitstop = Math.max(hitstop, 0.04 + 0.06 * mv.pow);
  recoil(A); A.vx = -A.face * 90;
  D.guard -= mv.gdmg; D.hp = Math.max(0, D.hp - (mv.chip || 1)); if (mv.chip || 1) vfx('dmg', p.x, p.y, mv.chip || 1, 0); D.force = Math.min(100, D.force + 3);
  if (D.guard <= 0) { D.guard = 0; D.stunned('broken', 0.75); D.vx = A.face * 240; vfx('banner', '가드 브레이크!', D.i, 0.8); vfx('snap', D.x); }
  else { D.stunned('bstun', mv.bstun); D.vx = A.face * (mv.heavy ? 320 : 170); }
  checkKO(A, D, p);
}
function parry(A, D, p) {
  sparks(p.x, p.y, 0.9, A.F.B.a); hitstop = Math.max(hitstop, 0.1);
  vfx('parry', p.x, p.y);
  A.stunned('parried', 0.6); A.vx = -A.face * 260; A.connected = true;
  D.state = 'guard'; D.st = 0; D.force = Math.min(100, D.force + 15);
  slowmo(0.35, 0.3); vfx('banner', '패링!', D.i, 0.7);
}
function deflect(A, D, p) {
  sparks(p.x, p.y, A.mv.pow * 0.6, A.F.B.a); hitstop = Math.max(hitstop, 0.04);
  recoil(A); A.vx = -A.face * 120; D.vx = A.face * 120;
  if (D.state === 'attack') recoil(D, 0.2);
}
function clashAct(A, D, p) {
  const big = A.mv.heavy || D.mv.heavy;
  sparks(p.x, p.y, big ? 1.0 : 0.7, A.F.B.a); hitstop = Math.max(hitstop, big ? 0.12 : 0.08);
  A.connected = D.connected = true;
  if ((A.mv.heavy && D.mv.heavy) || (big && rnd() < 0.55)) { startLock(A, D); return; }
  recoil(A, 0.45); recoil(D, 0.45); A.vx = -A.face * 260; D.vx = -D.face * 260;
  vfx('banner', '맞부딪힘!', -1, 0.5);
}
function hit(A, D, h) {
  const mv = A.mv, counter = D.state === 'attack' && D.ph !== 'r';
  const dmg = Math.round(mv.dmg * (counter ? 1.3 : 1));
  D.hp = Math.max(0, D.hp - dmg); D.flash = 1; D.dmgTaken += dmg; A.connected = true;
  A.force = Math.min(100, A.force + 6); A.combo = (A.comboT > 0 ? A.combo : 0) + 1; A.comboT = 1.0;
  const x = h.x, y = h.y;
  vfx('hit', x, y, mv.pow); vfx('dmg', x, y - 30, dmg, counter ? 1 : 0);
  hitstop = Math.max(hitstop, 0.06 + 0.08 * mv.pow);
  if (counter) vfx('banner', '카운터!', A.i, 0.6);
  if (D.state === 'lock') endLock(null);
  if (D.hp <= 0) { checkKO(A, D, h); return; }
  if (mv.knock) { D.knockdown(A.face, mv.kb, mv.heavy ? 420 : 300); }
  else { D.stunned('hitstun', mv.stun); D.vx = A.face * mv.kb; if (!D.ground) { D.vy = Math.min(D.vy, -200); D.state = 'hitstun'; } }
}
function checkKO(A, D, p) {
  if (D.hp > 0 || D.ko || GM.phase !== 'fight') return;
  D.ko = true; D.knockdown(A.face, 820, 520);
  GM.phase = 'ko'; GM.pt = 0; GM.winner = A.i;
  slowmo(0.22, 1.3); hitstop = Math.max(hitstop, 0.25);
  vfx('ko', p.x, p.y); vfx('banner', 'K.O.', -1, 2.2, true);
}
function doForce(P, O) {
  const dx = (O.x - P.x) * P.face, dy = Math.abs(O.hipY - P.hipY);
  const inRange = dx > -30 && dx < 420 && dy < 180 && !['down', 'getup'].includes(O.state) && O.inv <= 0 && !O.ko;
  vfx('force', P.i, inRange);
  if (inRange) {
    O.hp = Math.max(0, O.hp - 8); O.flash = 1; vfx('dmg', O.F.C.x, O.F.C.y - 40, 8, 0); if (O.state === 'lock') endLock(null);
    if (O.hp <= 0) { checkKO(P, O, { x: O.F.C.x, y: O.F.C.y }); return; }
    O.knockdown(P.face, 1150, 420); vfx('banner', P.i ? '포스 번개!' : '포스 푸시!', P.i, 0.7); hitstop = Math.max(hitstop, 0.06);
  }
}
function forceFx(P, O, inRange) {
  const h = P.F.hand2;
  if (P.i === 0) {
    FX.ripple(h.x + P.face * 30, h.y, 0.55, 1.3); FX.ring(h.x, h.y, 10, 1300, 0.4, 7, [200, 215, 255]); FX.flash(h.x, h.y, 140, 0.18, 'c', 0.8);
    for (let i = 0; i < 50; i++) { const a = R(-0.35, 0.35), sp = R(900, 2200); FX.wind(h.x, h.y + R(-50, 50), Math.cos(a) * sp * P.face, Math.sin(a) * sp, R(0.2, 0.42)); }
    AU.push();
  } else {
    const L = FX.lit; L.on = true; L.I = 1; L.up = false; GM.litT = 0.28;
    L.src = () => ({ x: P.F.hand2.x + P.face * 6, y: P.F.hand2.y });
    L.tgt = () => inRange ? { x: O.F.C.x + R(-20, 20), y: O.F.C.y + R(-40, 30) } : { x: P.x + P.face * R(250, 400), y: P.hipY + R(-120, 40) };
    AU.thunder(); AU.push();
  }
  FX.shake(0.3);
}
function startLock(A, D) {
  GM.lock = { a: A, d: D, v: 0, t: 0 }; GM.phase = 'lock';
  for (const P of [A, D]) { P.state = 'lock'; P.st = 0; P.mv = null; P.vx = 0; P.F.tr.ghost.v = 0; }
  vfx('lock', 1); vfx('banner', '힘겨루기! 베기 연타!', -1, 1.2);
}
function endLock(winner) {
  const L = GM.lock; if (!L) return; GM.lock = null; vfx('lock', 0); GM.phase = 'fight';
  for (const P of [L.a, L.d]) if (P.state === 'lock') { P.state = 'idle'; P.vx = -P.face * 300; }
  if (winner) {
    const loser = winner === L.a ? L.d : L.a;
    const p = FX.lockP || { x: (L.a.x + L.d.x) / 2, y: -140 }; sparks(p.x, p.y, 1.0, 0);
    loser.stunned('broken', 0.7); loser.vx = winner.face * 520; winner.vx = 0; winner.force = Math.min(100, winner.force + 20);
    hitstop = Math.max(hitstop, 0.1); vfx('banner', '힘겨루기 승리!', winner.i, 0.9);
  } else { const p = FX.lockP || { x: 0, y: -140 }; sparks(p.x, p.y, 0.7, 0); }
}
// ---------- visual/sound events (replayed on the online guest) ----------
const VFX = {
  sparks: (x, y, pow, ang) => sparksFx(x, y, pow, ang),
  hit: (x, y, pow) => {
    for (let i = 0; i < 26 + pow * 30; i++) { const d = R(0, TAU), sp = R(150, 900); FX.spark(x, y, Math.cos(d) * sp, Math.sin(d) * sp - 120, R(0.1, 0.45), R(1.4, 2.8)); }
    FX.flash(x, y, 60 + 70 * pow, 0.12, 'o', 1); FX.flash(x, y, 30, 0.08, 'wh', 1); FX.smoke(x, y, R(-40, 40), -60, 22, 0.8, [80, 70, 70], 0.35);
    FX.light(x, y, 300, [255, 170, 90], 0.8, 0.12); FX.shake(0.2 + 0.4 * pow); FX.punch += 0.03 + 0.04 * pow;
    AU.nz({ type: 'bandpass', f: 1800, q: 1.2, dur: 0.3, g: 0.45, pan: panOf(x, y) }); AU.tone({ type: 'sine', f: 140, f2: 40, dur: 0.3, g: 0.6, pan: panOf(x, y) });
  },
  dmg: (x, y, n, big) => { GM.dmgs.push({ x, y, n, t: 0, big }); if (GM.dmgs.length > 12) GM.dmgs.shift(); },
  jump: (x) => { FX.dust(x, 0, 2, 26); AU.whoosh(0.8, panOf(x, -80)); },
  whoosh: (pow, x, y) => AU.whoosh(pow, panOf(x, y)),
  land: (x, pow, sh) => { FX.dust(x, 0, pow > 0.45 ? 4 : 1, 24 + 20 * pow); AU.land(pow, panOf(x, 0)); if (sh) FX.shake(sh); },
  wall: (sx, y) => { FX.shake(0.45); AU.crash(panOf(sx, -100)); FX.flash(sx, y, 120, 0.15, 'w', 0.5); for (let k = 0; k < 24; k++) FX.chip(sx, y + R(-60, 40), -Math.sign(sx) * R(100, 600), R(-500, 100), R(2, 5)); FX.dust(sx, y + 40, 3, 40); },
  snap: (x) => { AU.snap(panOf(x, -100)); FX.shake(0.4); },
  parry: (x, y) => { FX.ring(x, y, 10, 1600, 0.35, 8, [190, 230, 255]); FX.ripple(x, y, 0.35, 1); AU.tone({ type: 'sine', f: 2400, f2: 1800, dur: 0.5, g: 0.18 }); },
  ko: (x, y) => { FX.white = 0.55; FX.ring(x, y, 10, 2400, 0.3, 14, [255, 255, 255]); AU.final(); MUS.cue('silence'); for (let i = 0; i < 80; i++) { const d = R(0, TAU), sp = R(300, 1800); FX.spark(x, y, Math.cos(d) * sp, Math.sin(d) * sp, R(0.2, 1), 2.4); } },
  force: (i, inRange) => forceFx(PL[i], PL[1 - i], inRange),
  lock: (on) => { FX.lockOn = !!on; MUS.cue(on ? 'tense' : 'duel'); },
  ignite: (i) => ignite(PL[i]),
  banner: (text, side, dur, big) => banner(text, side, dur, big),
  music: (sec) => MUS.cue(sec),
  clashSnd: (pow) => AU.clash(pow, 0),
  round: (r) => { const keep = FX.sc ? FX.sc.slice(-40) : []; FX.reset(); FX.sc = keep; GM.msgs = []; GM.dmgs = []; },
  win: (w) => banner(winText(w), -1, 999, true),
};
function vfx(n, ...a) { VFX[n](...a); if (NET.role === 'host' && NET.live) NET.evq.push([n, a]); }
// ---------- ONLINE (PeerJS, host-authoritative) ----------
const ONLINE_KIND = window.LS_ONLINE === 'fb' ? 'fb' : 'peerjs';
const NET = {
  names: ['', ''], linkKind: '',
  role: null, live: false, peer: null, conn: null, code: '', status: '', err: '', evq: [], evin: [], snap: null, lastQ: -1, seq: 0,
  rin: null, lastC: null, myC: null, t0: 0, hs: 0,
  opts() { const q = new URLSearchParams(location.search), o = { debug: 0 }; if (q.get('peerhost')) { o.host = q.get('peerhost'); o.port = +(q.get('peerport') || 9000); o.path = q.get('peerpath') || '/'; o.secure = false; } return o; },
  ok() { return typeof window.Peer === 'function'; },
  connOpen() {
    if (this.role === 'host') { this.live = true; this.status = '연결됨!'; startMatch('host'); this.send({ y: 'start' }); }
    else this.status = '연결됨! 시작을 기다리는 중…';
  },
  genCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c = ''; for (let i = 0; i < 4; i++) c += A[Math.random() * A.length | 0]; return c; },
  reset() { this.close(); Object.assign(this, { evq: [], evin: [], snap: null, lastQ: -1, seq: 0, rin: null, lastC: { u: 0, g: 0, a: 0, h: 0, f: 0 }, myC: { u: 0, g: 0, a: 0, h: 0, f: 0 }, status: '', err: '', code: '', t0: 0, hs: 0 }); },
  host() {
    if (ONLINE_KIND === 'fb') { this.reset(); this.role = 'host'; FBN.host(); return; }
    this.reset(); this.role = 'host'; this.status = '서버에 연결하는 중…';
    if (!this.ok()) { this.status = this.err = '온라인 기능을 불러오지 못했어요.'; return; }
    const open = () => {
      this.code = this.genCode(); let peer;
      try { peer = this.peer = new Peer('lsduel-' + this.code, this.opts()); } catch (e) { this.fail(e); return; }
      peer.on('open', () => { if (this.peer === peer) this.status = '친구를 기다리는 중…'; });
      peer.on('connection', conn => { if (this.conn) { try { conn.close(); } catch (e) { } return; } this.attach(conn); });
      peer.on('error', e => { if (this.peer !== peer) return; if (e && e.type === 'unavailable-id') { try { peer.destroy(); } catch (x) { } open(); } else this.fail(e); });
      peer.on('disconnected', () => { if (this.peer === peer && !this.live) try { peer.reconnect(); } catch (e) { } });
    };
    open();
  },
  join(code) {
    if (ONLINE_KIND === 'fb') { this.reset(); this.role = 'guest'; this.code = code; this.t0 = performance.now(); FBN.join(code); return; }
    this.reset(); this.role = 'guest'; this.code = code; this.status = '방에 연결하는 중…'; this.t0 = performance.now();
    if (!this.ok()) { this.status = this.err = '온라인 기능을 불러오지 못했어요.'; return; }
    let peer; try { peer = this.peer = new Peer(this.opts()); } catch (e) { this.fail(e); return; }
    peer.on('open', () => { if (this.peer !== peer) return; this.attach(peer.connect('lsduel-' + code, { reliable: true, serialization: 'json' })); });
    peer.on('error', e => { if (this.peer === peer) this.fail(e); });
  },
  attach(conn) {
    this.conn = conn;
    conn.on('open', () => this.connOpen());
    conn.on('data', d => this.onData(d));
    conn.on('close', () => this.lost());
    conn.on('error', () => this.lost());
  },
  onData(d) {
    if (!d || !d.y) return;
    if (d.y === 'start' && this.role === 'guest') { this.live = true; startMatch('guest'); }
    else if (d.y === 's' && this.role === 'guest') { if (d.e && d.e.length) this.evin.push(...d.e); if (!this.snap || d.q > this.snap.q) this.snap = d; }
    else if (d.y === 'i' && this.role === 'host') this.rin = d;
    else if (d.y === 'bye') this.lost();
  },
  send(o) { try { if (this.conn && this.conn.open) this.conn.send(o); } catch (e) { } },
  fail(e, raw) {
    if (raw) { this.status = this.err = (e && e.message) || '연결 오류'; return; }
    const t = e && e.type;
    this.status = this.err = t === 'peer-unavailable' ? '방을 찾을 수 없어요. 코드를 확인해 주세요.'
      : (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') ? '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.'
      : t === 'browser-incompatible' ? '이 브라우저는 온라인 대전을 지원하지 않아요. 크롬이나 엣지를 써 주세요.'
      : '연결 오류: ' + (t || (e && e.message) || e);
  },
  lost() {
    if (!this.role) return; const wasLive = this.live; this.close();
    if (wasLive && GM.scene === 'fight') { GM.netLost = 2.8; banner('상대와 연결이 끊겼어요', -1, 2.8, false); }
    else if (GM.screen) this.status = this.err = '연결이 끊겼어요.';
  },
  close() { const c = this.conn, p = this.peer; this.conn = null; this.peer = null; this.live = false; this.role = null; this.names = ['', '']; try { if (c) c.close(); } catch (e) { } try { if (p) p.destroy(); } catch (e) { } if (ONLINE_KIND === 'fb') FBN.close(); },
};
NET.reset();
function leaveOnline() { NET.send({ y: 'bye' }); setTimeout(() => NET.close(), 80); NET.live = false; NET.role = null; toMenu(); }
const NKEYS = ['crouch', 'stance', 'lean', 'reach', 'grip', 'offx', 'offy', 'tuck', 'head', 'gb', 'gox', 'goy', 'w', 'kick'];
function snapP(P) {
  const q = v => Math.round(v * 100) / 100, pp = P.pp;
  return [q(P.x), q(P.hy), P.face, P.ground ? 1 : 0, q(P.rho), q(P.rot), q(P.ext), q(P.flash), Math.round(P.hp * 10) / 10, Math.round(P.hpLag * 10) / 10, Math.round(P.force), Math.round(P.guard), P.combo, q(P.comboT), P.state, ...NKEYS.map(k => q(pp[k])), P.F.tr.ghost.v, q(P.F.gameLandU || 0), P.ko ? 1 : 0];
}
function sendSnap() {
  const L = GM.lock;
  NET.send({ y: 's', q: ++NET.seq, r: Math.round(RATE_NOW * 100) / 100, h: hitstop > 0 ? 1 : 0, g: [GM.phase, Math.round(GM.timer * 10) / 10, GM.round, GM.wins[0], GM.wins[1], GM.winner, L ? (L.a.i === 0 ? L.v : -L.v) : null, Math.round(GM.pt * 100) / 100], p: [snapP(PL[0]), snapP(PL[1])], e: NET.evq });
  NET.evq = [];
}
function applySnap(sn) {
  const g = sn.g; GM.phase = g[0]; GM.timer = g[1]; GM.round = g[2]; GM.wins = [g[3], g[4]]; GM.winner = g[5]; GM.lockV = g[6]; GM.pt = g[7]; RATE_NOW = sn.r; NET.hs = sn.h;
  for (let i = 0; i < 2; i++) {
    const P = PL[i], a = sn.p[i];
    P.x = Math.abs(a[0] - P.x) > 220 ? a[0] : lerp(P.x, a[0], 0.75); P.hy = Math.abs(a[1] - P.hy) > 220 ? a[1] : lerp(P.hy, a[1], 0.75);
    P.face = a[2]; P.ground = !!a[3]; P.rho += wrapPi(a[4] - P.rho) * 0.85; P.rot = Math.abs(a[5] - P.rot) > 1.2 ? a[5] : lerp(P.rot, a[5], 0.85);
    P.ext = a[6]; P.flash = a[7]; P.hp = a[8]; P.hpLag = a[9]; P.force = a[10]; P.guard = a[11]; P.combo = a[12]; P.comboT = a[13]; P.state = a[14];
    NKEYS.forEach((k, j) => P.tgt[k] = a[15 + j]); P.F.tr.ghost.v = a[29]; P.F.gameLandU = a[30]; P.ko = !!a[31];
  }
}
function guestStep(dtR) {
  RT += dtR;
  FX.trauma = Math.max(0, FX.trauma - dtR * 1.4); FX.punch *= Math.exp(-dtR * 7); FX.screenFlash *= Math.exp(-dtR * 7); FX.white = Math.max(0, FX.white - dtR * 1.2);
  WS.planetFlash = Math.max(0, WS.planetFlash - dtR * 3);
  if (NET.snap && NET.snap.q !== NET.lastQ) { applySnap(NET.snap); NET.lastQ = NET.snap.q; }
  const ev = NET.evin; NET.evin = []; for (const [n, a] of ev) { try { VFX[n](...a); } catch (e) { } }
  const dt = NET.hs ? 0 : dtR * RATE_NOW; T += dt;
  for (const m of GM.msgs) m.t += dtR; GM.msgs = GM.msgs.filter(m => m.t < m.dur);
  for (const P of PL) P.apply(dt);
  FRAME++;
  for (const F of FIGHTERS) F.body(T, dt);
  for (const F of FIGHTERS) F.blade();
  for (const F of FIGHTERS) F.finish(T, dt, RATE_NOW);
  for (const F of FIGHTERS) FX.contacts(F, T, dt);
  lockSparks(dt);
  if (GM.litT > 0) { GM.litT -= dt; if (GM.litT <= 0) FX.lit.on = false; }
  updDeb(dt); FX.update(dt);
  camUpdate(dtR); audioFrame();
  for (const d of GM.dmgs) d.t += dtR; GM.dmgs = GM.dmgs.filter(d => d.t < 0.9);
  const I = IN[0]; for (const b of ['u', 'g', 'a', 'h', 'f']) if (I['p' + b]) NET.myC[b]++;
  if (mpress('ok') && GM.phase === 'over') NET.myC.a++;
  NET.send({ y: 'i', l: I.l ? 1 : 0, r: I.r ? 1 : 0, u: I.u ? 1 : 0, g: I.g ? 1 : 0, a: I.a ? 1 : 0, h: I.h ? 1 : 0, f: I.f ? 1 : 0, c: NET.myC });
}
// ---------- AI ----------
const AIL = [
  { react: 0.36, guard: 0.3, parry: 0.0, aggr: 0.4, combo: 0.25, jumpLow: 0.15, mash: 5.5, heavy: 0.12, low: 0.12, force: 0.12, name: '쉬움' },
  { react: 0.18, guard: 0.68, parry: 0.16, aggr: 0.63, combo: 0.6, jumpLow: 0.45, mash: 8.5, heavy: 0.18, low: 0.18, force: 0.25, name: '보통' },
  { react: 0.1, guard: 0.88, parry: 0.42, aggr: 0.78, combo: 0.9, jumpLow: 0.75, mash: 11.5, heavy: 0.22, low: 0.22, force: 0.4, name: '어려움' },
];
class AI {
  constructor(P, O, lvl) { this.P = P; this.O = O; this.L = AIL[lvl]; this.inp = {}; this.t = 0; this.move = 0; this.moveT = 0; this.holdG = 0; this.seen = null; this.react = 0; this.resp = 'none'; this.mashT = 0; this.wantCombo = 0; this.prev = {}; }
  update(dt) {
    const P = this.P, O = this.O, L = this.L, raw = { l: false, r: false, u: false, g: false, a: false, h: false, f: false };
    const dx = O.x - P.x, dist = Math.abs(dx), dir = Math.sign(dx) || P.face;
    if (GM.phase === 'lock' && P.state === 'lock') { this.mashT -= dt; if (this.mashT <= 0) { raw.a = !this.prev.a; this.mashT = 1 / L.mash * R(0.75, 1.25); } }
    else if (GM.phase === 'fight') {
      // react to an incoming attack
      const oAtk = O.state === 'attack' && O.ph !== 'r';
      if (oAtk && this.seen !== O.mv) {
        this.seen = O.mv; this.react = L.react * R(0.7, 1.3);
        const r = rnd(); this.resp = r < L.guard ? (O.mv.type === 'low' ? (rnd() < L.jumpLow ? 'jump' : 'none') : (rnd() < L.parry ? 'parry' : 'guard')) : 'none';
      }
      if (!oAtk) this.seen = null;
      if (oAtk && this.seen === O.mv && this.lastAtk !== O.mv) { this.lastAtk = O.mv; this.spam = Math.min(4, (this.spam || 0) + 1); }
      this.spam = Math.max(0, (this.spam || 0) - dt * 1.2);
      // punish openings: attacker recovering, stunned, or whiffing
      const open = (O.state === 'attack' && O.ph === 'r' && O.connected) || O.state === 'parried' || O.state === 'broken' || (O.state === 'attack' && O.ph === 'r' && !O.connected && dist > 150);
      if (open && dist < 250 && !P.busy && P.ground && rnd() < (L.aggr + 0.15) * dt * 14) { if (O.state === 'parried' || O.state === 'broken') raw.h = true; else raw.a = true; this.wantCombo = rnd() < L.combo ? 2 : 1; this.holdG = 0; }
      if (this.seen && this.react > 0) { this.react -= dt; if (this.react <= 0 && dist < 360 && !P.busy) { if (this.resp === 'guard') this.holdG = 0.32; if (this.resp === 'parry') this.holdG = 0.25; if (this.resp === 'jump' && P.ground) raw.u = true; } }
      if (O.state === 'force' && O.st < 0.12 && dist < 420 && rnd() < L.guard * dt * 8 && P.ground) raw.u = true;
      // plan
      this.t -= dt;
      if (this.t <= 0 && !P.busy && this.holdG <= 0) {
        this.t = R(0.08, 0.2); this.move = 0;
        // close range vs an aggressive opponent: guard pre-emptively
        const pre = dist < 250 && O.state !== 'down' && rnd() < L.guard * (0.25 + 0.15 * (this.spam || 0));
        if (pre) { this.holdG = R(0.25, 0.5); if ((this.spam || 0) > 2 && rnd() < L.aggr * 0.5) { raw.g = true; raw.a = true; } }
        const oDown = O.state === 'down' || O.state === 'getup';
        if (pre) { }
        else if (oDown) { this.move = dist < 220 ? -dir : (dist > 300 ? dir : 0); this.moveT = 0.2; }
        else if (dist > 300) {
          this.move = dir; this.moveT = R(0.15, 0.4);
          if (P.force >= 50 && dist < 400 && rnd() < L.force * 0.6) raw.f = true;
          else if (rnd() < 0.08) raw.u = true;
        } else if (dist > 205) { this.move = dir; this.moveT = R(0.1, 0.25); if (rnd() < 0.06) raw.u = true; }
        else if (dist < 110) { if (rnd() < 0.5) { this.move = -dir; this.moveT = 0.18; } else raw.a = true; }
        else {
          if (rnd() < L.aggr) {
            const r = rnd();
            if (O.state === 'guard' && r < 0.45) { raw.g = true; raw.a = true; }
            else if (r < L.heavy) raw.h = true;
            else if (r < L.heavy + L.low) { raw.g = true; raw.a = true; }
            else if (r < L.heavy + L.low + 0.08 && P.ground) { raw.u = true; this.wantAir = 0.18; }
            else { raw.a = true; this.wantCombo = rnd() < L.combo ? 2 : (rnd() < 0.5 ? 1 : 0); }
          } else if (rnd() < 0.35) { this.holdG = R(0.2, 0.5); }
          else { this.move = rnd() < 0.5 ? -dir : dir; this.moveT = R(0.1, 0.25); }
        }
      }
      // combo follow-up
      if (P.state === 'attack' && P.ph === 'r' && P.mv && P.mv.next && this.wantCombo > 0 && !this.prev.a) { raw.a = true; this.wantCombo--; }
      if (this.wantAir > 0) { this.wantAir -= dt; if (this.wantAir <= 0 && !P.ground) raw.a = true; }
      if (this.holdG > 0) { this.holdG -= dt; raw.g = true; }
      if (this.moveT > 0) { this.moveT -= dt; if (this.move > 0) raw.r = true; else if (this.move < 0) raw.l = true; }
    }
    const o = this.inp; for (const n of BTN) { o[n] = !!raw[n]; o['p' + n] = o[n] && !this.prev[n]; this.prev[n] = o[n]; }
    return o;
  }
}
// ---------- game state ----------
const GM = { dmgs: [], scene: 'menu', mode: 'demo', diff: 1, round: 1, wins: [0, 0], phase: 'intro', pt: 0, timer: 60, slowT: 0, slowR: 1, msgs: [], lock: null, winner: -1, menuSel: 0, paused: false, litT: 0, hits: [], over: false };
let PL = [], AIS = [null, null];
function banner(text, side, dur, big = false) { GM.msgs.push({ text, side, t: 0, dur, big }); if (GM.msgs.length > 4) GM.msgs.shift(); }
function slowmo(rate, dur) { GM.slowR = rate; GM.slowT = dur; }
function togglePause() { if (GM.scene !== 'fight') return; if (GM.mode === 'host' || GM.mode === 'guest') { GM.leaveAsk = !GM.leaveAsk; return; } if (GM.phase !== 'over') GM.paused = !GM.paused; }
function onAnyInput() { if (AU.ok && MUS.sec === 'off') MUS.cue(GM.scene === 'menu' ? 'intro' : 'duel'); }
function setupPlayers() {
  AIS = [null, null];
  if (GM.mode === 'demo') { AIS = [new AI(PL[0], PL[1], 1), new AI(PL[1], PL[0], 1)]; }
  if (GM.mode === '1p') AIS[1] = new AI(PL[1], PL[0], GM.diff);
}
function startRound() {
  vfx('round', GM.round);
  const lit = GM.round > 1 || GM.mode === 'demo';
  PL[0].reset(-270, 1, lit); PL[1].reset(270, -1, lit);
  GM.phase = 'intro'; GM.pt = 0; GM.timer = 60; GM.msgs = []; GM.lock = null; GM.winner = -1; GM.slowT = 0; hitstop = 0;
  setupPlayers();
  if (GM.mode !== 'demo') { vfx('banner', `ROUND ${GM.round}`, -1, 1.3, true); vfx('music', 'hush'); }
  cam.x = 0; cam.y = -230; cam.z = 1.15;
}
function startMatch(mode) {
  GM.mode = mode; GM.wins = [0, 0]; GM.round = 1; GM.scene = mode === 'demo' ? 'menu' : 'fight'; GM.paused = false;
  startRound();
  if (mode !== 'demo') { AU.init(); tryFullscreen(); GM.screen = null; GM.leaveAsk = false; }
}
function tryFullscreen() {
  try {
    const el = document.documentElement;
    if (document.fullscreenEnabled && !document.fullscreenElement && el.requestFullscreen) { const pr = el.requestFullscreen(); if (pr && pr.catch) pr.catch(() => { }); }
  } catch (e) { }
}
function toMenu() { GM.scene = 'menu'; GM.screen = null; GM.leaveAsk = false; GM.netLost = 0; if (NET.role && !NET.live) NET.close(); startMatch('demo'); MUS.cue('intro'); }
function ignite(P) {
  const F = P.F, B = F.B; if (!B) return; AU.ignite(F.idx, panOf(B.gx, B.gy));
  FX.flash(B.sx, B.sy, 150, 0.22, F.idx ? 'r' : 'b', 1); FX.light(B.sx, B.sy, 600, F.col, 1.1, 0.5); FX.shake(0.15);
  for (let i = 0; i < 18; i++) { const d = R(0, TAU), sp = R(100, 500); FX.spark(B.sx, B.sy, Math.cos(d) * sp, Math.sin(d) * sp, R(0.1, 0.3), 1.5); }
}
function roundFlow(dtR, dt) {
  GM.pt += dtR;
  for (const m of GM.msgs) m.t += dtR; GM.msgs = GM.msgs.filter(m => m.t < m.dur);
  const demo = GM.mode === 'demo';
  if (GM.phase === 'intro') {
    const tIgn = demo ? 0 : 1.0, tFight = demo ? 0.4 : 1.7;
    if (!demo && GM.round === 1) for (const P of PL) { if (GM.pt >= tIgn && P.ext === 0) { P.ext = 0.01; vfx('ignite', P.i); } }
    for (const P of PL) if (P.ext > 0 && P.ext < 1) P.ext = Math.min(1, P.ext + dtR / 0.16);
    if (GM.pt >= tFight - 0.25 && !GM.fightShown && !demo) { vfx('banner', 'FIGHT!', -1, 0.9, true); GM.fightShown = true; vfx('clashSnd', 0.4); }
    if (GM.pt >= tFight) { GM.phase = 'fight'; GM.pt = 0; GM.fightShown = false; if (!demo) vfx('music', 'duel'); }
  } else if (GM.phase === 'fight' || GM.phase === 'lock') {
    if (!demo) { GM.timer -= dt; if (GM.timer <= 0 && GM.phase === 'fight') { GM.timer = 0; timeUp(); } }
    if (GM.phase === 'lock') {
      const L = GM.lock; L.t += dt;
      const ia = L.a.i, idd = L.d.i;
      const pressA = (AIS[ia] ? AIS[ia].inp : IN[ia]), pressD = (AIS[idd] ? AIS[idd].inp : IN[idd]);
      if (pressA.pa || pressA.ph) L.v += 1; if (pressD.pa || pressD.ph) L.v -= 1;
      if (L.v >= 12) endLock(L.a); else if (L.v <= -12) endLock(L.d); else if (L.t > 3.2) endLock(null);
    }
  } else if (GM.phase === 'ko' || GM.phase === 'timeup') {
    if (GM.pt > 1.0) { const W = PL[GM.winner]; if (W && !W.ko && W.state !== 'win' && W.ground && !W.busy) { W.state = 'win'; W.st = 0; } }
    if (GM.pt > 1.2) for (const P of PL) if (P.ko && P.state === 'down' && P.ground === false && P.vy === 0) P.ext = Math.max(0, P.ext - dtR * 3);
    if (GM.pt > (demo ? 2.0 : 3.0)) {
      if (GM.winner >= 0) GM.wins[GM.winner]++;
      if (demo) { GM.round++; startRound(); return; }
      if (GM.wins[0] >= 2 || GM.wins[1] >= 2) { GM.phase = 'over'; GM.pt = 0; vfx('music', 'end'); vfx('win', GM.wins[0] >= 2 ? 0 : 1); }
      else { GM.round++; startRound(); }
    }
  } else if (GM.phase === 'over') {
    if (GM.pt > 1.0) { if (mpress('ok') || (GM.mode === 'host' && IN[1].pa)) startMatch(GM.mode); }
  }
}
function winText(w) { if (GM.mode === '1p' || GM.mode === 'host') return w === 0 ? '승리!' : '패배...'; if (GM.mode === 'guest') return w === 1 ? '승리!' : '패배...'; return w === 0 ? '1P 제다이 승리!' : '2P 시스 승리!'; }
function timeUp() {
  const [a, b] = PL; GM.phase = 'timeup'; GM.pt = 0; vfx('banner', 'TIME UP', -1, 1.8, true);
  GM.winner = a.hp > b.hp ? 0 : b.hp > a.hp ? 1 : -1;
  if (GM.winner >= 0) { const L = PL[1 - GM.winner]; L.stunned('broken', 9); }
  vfx('music', 'hush');
}
// ---------- main step ----------
function step(dtR) {
  RT += dtR;
  FX.trauma = Math.max(0, FX.trauma - dtR * 1.4); FX.punch *= Math.exp(-dtR * 7); FX.screenFlash *= Math.exp(-dtR * 7); FX.white = Math.max(0, FX.white - dtR * 1.2);
  WS.planetFlash = Math.max(0, WS.planetFlash - dtR * 3);
  if (rnd() < dtR * 0.5) { WS.planetFlash = R(0.3, 0.8); WS.pflash = { x: 260 + R(-450, 450), y: -860 + R(-400, 400) }; }
  if (GM.slowT > 0) { GM.slowT -= dtR; RATE_NOW = lerp(RATE_NOW, GM.slowR, 0.3); } else RATE_NOW = lerp(RATE_NOW, 1, 0.15);
  let dt = dtR * RATE_NOW;
  if (hitstop > 0) { hitstop -= dtR; dt = 0; }
  T += dt;
  const inputs = [AIS[0] ? AIS[0].update(dtR) : IN[0], AIS[1] ? AIS[1].update(dtR) : IN[1]];
  if (dt > 0) { PL[0].update(dt, inputs[0], PL[1]); PL[1].update(dt, inputs[1], PL[0]); }
  else { for (let i = 0; i < 2; i++) { const I = inputs[i]; if (I.pa && GM.phase === 'fight') { PL[i].queued = I.g && PL[i].ground ? 'low' : 'a'; PL[i].queueT = 0.24; } if (I.ph && GM.phase === 'fight') { PL[i].queued = 'heavy'; PL[i].queueT = 0.24; } if (I.pg) PL[i].gPress = T; } }
  // body pushbox (allow jumping over)
  const [a, b] = PL;
  if (Math.abs(a.x - b.x) < 66 && Math.abs(a.hipY - b.hipY) < 110 && a.state !== 'down' && b.state !== 'down') {
    const push = (66 - Math.abs(a.x - b.x)) / 2, s = Math.sign(a.x - b.x) || (a.face > 0 ? -1 : 1);
    a.x += s * push; b.x -= s * push; a.x = clamp(a.x, ARENA.x0, ARENA.x1); b.x = clamp(b.x, ARENA.x0, ARENA.x1);
  }
  roundFlow(dtR, dt);
  // rig
  for (const P of PL) P.apply(dt);
  FRAME++;
  for (const F of FIGHTERS) F.body(T, dt);
  for (const F of FIGHTERS) F.blade();
  for (const F of FIGHTERS) F.finish(T, dt, RATE_NOW);
  if (dt > 0 && (GM.phase === 'fight' || GM.phase === 'lock')) { combat(a, b); combat(b, a); }
  for (const P of PL) P.prevB = P.F.B ? Object.assign({}, P.F.B) : null;
  for (const F of FIGHTERS) FX.contacts(F, T, dt);
  lockSparks(dt);
  if (GM.litT > 0) { GM.litT -= dt; if (GM.litT <= 0) FX.lit.on = false; }
  updDeb(dt); FX.update(dt);
  if (dt > 0) { FX.emberAcc += dt * 6; while (FX.emberAcc > 1) { FX.emberAcc--; const V = view(); FX.ember(R(V.x0, V.x1), R(V.y0, V.y1), R(-10, 10), R(-15, 5), R(3, 6), R(0.6, 1.5)); } WIND.x = 50 + 40 * noise1(T * 0.7); WIND.y *= Math.exp(-dt * 3); }
  camUpdate(dtR); audioFrame();
  for (const d of GM.dmgs) d.t += dtR; GM.dmgs = GM.dmgs.filter(d => d.t < 0.9);
  if (GM.mode === 'host' && NET.live) sendSnap();
}
function lockSparks(dt) {
  if (!FX.lockOn || dt <= 0 || !J.B || !S.B) return;
  const A = J.B, B = S.B, p = segX(A.sx, A.sy, A.tx, A.ty, B.sx, B.sy, B.tx, B.ty) || segSegNear(A, B);
  for (let i = 0; i < 3; i++) { const d = R(0, TAU), sp = R(200, 900); FX.spark(p.x, p.y, Math.cos(d) * sp, Math.sin(d) * sp - 200, R(0.1, 0.4), R(1.2, 2.4)); }
  if (rnd() < 0.4) FX.flash(p.x, p.y, R(40, 100), 0.05, 'wh', 0.8); FX.light(p.x, p.y, 220, [255, 220, 255], 0.3, 0.04); FX.lockP = p;
}
function audioFrame() {
  if (AU.ok) {
    AU.update(RATE_NOW);
    for (const F of FIGHTERS) { const B = F.B; AU.setHum(F.idx, B ? B.ext * (GM.scene === 'menu' ? 0.35 : 1) : 0, F.tipSpeed, B ? panOf(B.gx, B.gy) : 0); }
    AU.setL('lock', FX.lockOn ? 0.22 + 0.2 * rnd() : 0, 0.02);
    AU.setL('zap', FX.lit.on ? 0.35 * rnd() : 0, 0.015);
    AU.L.buzz.g.gain.setTargetAtTime(FX.lit.on ? 0.12 : 0, AU.ctx.currentTime, 0.03);
    AU.setL('wind', 0.05, 0.5); AU.setL('reactor', 0, 0.5);
  }
}
function camUpdate(dtR) {
  const [a, b] = PL, dist = Math.abs(a.x - b.x);
  let zT = clamp(1250 / (dist + 520), 0.95, 1.6), xT = clamp((a.x + b.x) / 2, -560, 560);
  const top = Math.min(a.F.H.y, b.F.H.y);
  let yT = -270 / zT + Math.min(0, top + 130) * 0.55;
  if (GM.phase === 'lock' && FX.lockP) { zT = 2.1; xT = FX.lockP.x; yT = FX.lockP.y + 10; }
  if (GM.phase === 'ko' && GM.pt < 1.4) { const L = PL[1 - GM.winner]; if (L) { zT = 1.7; xT = (L.x + PL[GM.winner].x) / 2; yT = -200; } }
  if (GM.scene === 'menu') { zT = 1.05; yT = -300; xT = clamp((a.x + b.x) / 2, -300, 300) * 0.5; }
  const k = 1 - Math.exp(-dtR * (GM.phase === 'lock' ? 6 : 4));
  cam.x += (xT - cam.x) * k; cam.y += (yT - cam.y) * k; cam.z += (zT - cam.z) * k;
  const tr = FX.trauma * FX.trauma;
  cam.sx = noise1(RT * 23) * 38 * tr; cam.sy = noise1(RT * 23 + 57) * 38 * tr; cam.sr = noise1(RT * 17 + 91) * 0.04 * tr;
  cam.zz = cam.z * (1 + FX.punch); cam.r = 0;
}
// ---------- render ----------
function renderEmissive(V) {
  ex.setTransform(1, 0, 0, 1, 0, 0); ex.globalCompositeOperation = 'source-over'; ex.globalAlpha = 1; ex.fillStyle = '#000'; ex.fillRect(0, 0, SW / 2, SH / 2);
  drawBackground(ex, V, true);
  camX(ex, 1, null, 0.5);
  ex.fillStyle = '#000'; ex.fillRect(1000, -3000, 4000, 6000); ex.fillRect(-5000, -3000, 4000, 6000);
  ex.globalCompositeOperation = 'lighter';
  for (const F of FIGHTERS) { drawTrail(ex, F, true); drawBlade(ex, F, true); }
  if (FX.lockOn && FX.lockP) sprite(ex, SPR.w, FX.lockP.x, FX.lockP.y, 60, 0.8);
  ex.globalAlpha = 1; drawParticles(ex, true);
  ex.globalCompositeOperation = 'source-over'; ex.globalAlpha = 1;
}
function bloom(c) {
  for (const [dst, src, w, h] of [[b1, EM, 480, 270], [b2, B1, 240, 135], [b3, B2, 120, 68]]) {
    dst.filter = 'none'; dst.globalCompositeOperation = 'source-over'; dst.fillStyle = '#000'; dst.fillRect(0, 0, w, h);
    if (HAS_FILTER) dst.filter = 'blur(2px)'; dst.drawImage(src, 0, 0, w, h); dst.filter = 'none';
  }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'lighter';
  c.globalAlpha = 0.3; c.drawImage(EM, 0, 0, SW, SH); c.globalAlpha = 0.5; c.drawImage(B1, 0, 0, SW, SH); c.globalAlpha = 0.45; c.drawImage(B2, 0, 0, SW, SH);
  if (QUAL > 0) { c.globalAlpha = 0.38; c.drawImage(B3, 0, 0, SW, SH); }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function drawSideWall(c) {
  c.fillStyle = '#1f2439'; c.fillRect(-1060, -1800, 60, 4800);
  c.fillStyle = 'rgba(150,160,230,0.22)'; c.fillRect(-1003, -1800, 3, 1800);
  for (let y = -1700; y < 0; y += 180) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-1056, y, 52, 4); }
  c.fillStyle = 'rgba(80,200,255,0.5)'; for (let y = -1600; y < -500; y += 300) c.fillRect(-1004, y, 3, 120);
  c.save(); c.scale(-1, 1); drawBulkhead(c); c.restore();
}
function render() {
  const c = ctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, SW, SH);
  const V = view();
  drawBackground(c, V);
  camX(c);
  drawWorld(c, V);
  drawReflections(c);
  drawHallFloorTop(c, V);
  drawSideWall(c);
  drawScorch(c); drawEnvLights(c); drawDeb(c);
  for (const F of [S, J]) drawGhosts(c, F);
  for (const F of [S, J]) drawFighter(c, F);
  for (const F of [S, J]) { drawTrail(c, F); drawBlade(c, F); }
  drawParticles(c, false);
  drawForeground(c, V);
  renderEmissive(V); bloom(c);
  post(c);
  drawHUD(c);
}
function post(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  if (FX.screenFlash > 0.003) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(FX.flashCol, Math.min(0.8, FX.screenFlash)); c.fillRect(0, 0, SW, SH); c.globalCompositeOperation = 'source-over'; }
  if (FX.white > 0.002) {
    c.fillStyle = `rgba(255,255,255,${Math.min(1, FX.white)})`; c.fillRect(0, 0, SW, SH);
    const a = clamp((FX.white - 0.15) * 2, 0, 1); if (a > 0) { camX(c); for (const F of FIGHTERS) drawSil(c, F, a); c.setTransform(1, 0, 0, 1, 0, 0); }
  }
  c.drawImage(VIG, 0, 0);
  if (QUAL > 0) { c.globalAlpha = 0.04; const gx = (Math.random() * 256) | 0, gy = (Math.random() * 256) | 0; c.fillStyle = c.createPattern(PRE.grain, 'repeat'); c.translate(-gx, -gy); c.fillRect(0, 0, SW + 256, SH + 256); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; }
}
// ---------- HUD ----------
const FONT = '"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif';
function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function bar(c, x, y, w, h, frac, lag, col, flip) {
  c.fillStyle = 'rgba(0,0,0,0.55)'; rr(c, x - 3, y - 3, w + 6, h + 6, 6); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x, y, w, h);
  const fx = (f) => flip ? x + w * (1 - f) : x;
  c.fillStyle = 'rgba(255,240,200,0.85)'; c.fillRect(fx(lag), y, w * lag, h);
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(col.map(v => Math.min(255, v + 90)), 1)); g.addColorStop(1, rgba(col, 1));
  c.fillStyle = g; c.fillRect(fx(frac), y, w * frac, h);
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(fx(frac), y, w * frac, 3);
}
function playerName(i) { if (GM.mode === '1p') return i === 0 ? '제다이 · 나' : `시스 · CPU (${AIL[GM.diff].name})`; if (GM.mode === '2p') return i === 0 ? '1P 제다이' : '2P 시스'; if (GM.mode === 'host' || GM.mode === 'guest') { const me = GM.mode === 'host' ? 0 : 1, nm = NET.names[i]; return (i === 0 ? '제다이 · ' : '시스 · ') + (nm ? nm + (i === me ? ' (나)' : '') : (i === me ? '나' : '친구')); } return i === 0 ? '제다이' : '시스'; }
function drawHUD(c) {
  c.setTransform(1, 0, 0, 1, 0, 0); c.textBaseline = 'alphabetic';
  if (GM.scene === 'menu') { drawMenu(c); return; }
  const W = 690, H = 26, top = 54;
  for (let i = 0; i < 2; i++) {
    const P = PL[i], flip = i === 1, x = flip ? SW - 90 - W : 90, col = i ? [215, 40, 45] : [45, 140, 235];
    bar(c, x, top, W, H, P.hp / 100, P.hpLag / 100, col, flip);
    // force meter
    const fw = 300, fxp = flip ? x + W - fw : x, ff = P.force / 100;
    c.fillStyle = 'rgba(0,0,0,0.5)'; rr(c, fxp - 2, top + H + 10, fw + 4, 12, 4); c.fill();
    c.fillStyle = P.force >= 50 ? (i ? 'rgba(255,120,160,0.95)' : 'rgba(140,220,255,0.95)') : 'rgba(150,150,190,0.6)';
    c.fillRect(flip ? fxp + fw * (1 - ff) : fxp, top + H + 12, fw * ff, 8);
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(fxp + fw / 2 - 1, top + H + 11, 2, 10);
    // guard meter
    if (P.guard < 99) { const gw = 200 * P.guard / 100, gx = flip ? x + W - 200 : x; c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(gx, top + H + 26, 200, 5); c.fillStyle = P.guard < 30 ? '#ff7040' : '#e8e0c0'; c.fillRect(flip ? gx + 200 - gw : gx, top + H + 26, gw, 5); }
    c.font = `700 26px ${FONT}`; c.textAlign = flip ? 'right' : 'left'; c.fillStyle = '#fff';
    c.fillText(playerName(i), flip ? x + W : x, top - 12);
    c.font = `600 15px ${FONT}`; c.fillStyle = 'rgba(220,225,255,0.7)'; c.fillText('FORCE', flip ? fxp - 10 + 0 : fxp + fw + 10, top + H + 21);
    // round pips
    for (let k = 0; k < 2; k++) { const px = flip ? x + W - 330 - k * 26 : x + 330 + k * 26; c.beginPath(); c.arc(px, top - 20, 8, 0, TAU); c.fillStyle = GM.wins[i] > k ? (i ? '#ff5050' : '#5ab8ff') : 'rgba(255,255,255,0.15)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.5; c.stroke(); }
    if (P.combo >= 2 && P.comboT > 0) { c.font = `800 ${40 + Math.min(P.combo, 8) * 2}px ${FONT}`; c.textAlign = flip ? 'right' : 'left'; c.fillStyle = `rgba(255,230,140,${Math.min(1, P.comboT * 2)})`; c.fillText(`${P.combo} HIT`, flip ? SW - 90 : 90, 190); }
  }
  // timer
  c.fillStyle = 'rgba(0,0,0,0.6)'; rr(c, SW / 2 - 58, 30, 116, 74, 12); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.stroke();
  c.font = `800 52px ${FONT}`; c.textAlign = 'center'; c.fillStyle = GM.timer < 10 ? '#ff8060' : '#fff'; c.fillText(Math.ceil(GM.timer), SW / 2, 86);
  // lock tug-of-war
  const lockV = GM.mode === 'guest' ? GM.lockV : (GM.lock ? (GM.lock.a.i === 0 ? GM.lock.v : -GM.lock.v) : null);
  if (GM.phase === 'lock' && lockV !== null && lockV !== undefined) {
    const v = lockV / 12, w = 520, x = SW / 2 - w / 2, y = SH - 190;
    c.fillStyle = 'rgba(0,0,0,0.6)'; rr(c, x - 4, y - 4, w + 8, 32, 8); c.fill();
    c.fillStyle = '#3a8fe0'; c.fillRect(x, y, w * (0.5 + v / 2), 24); c.fillStyle = '#d83a40'; c.fillRect(x + w * (0.5 + v / 2), y, w * (0.5 - v / 2), 24);
    c.fillStyle = '#fff'; c.fillRect(x + w / 2 - 1, y - 6, 2, 36);
    c.font = `800 34px ${FONT}`; c.fillStyle = `rgba(255,255,255,${0.7 + 0.3 * Math.sin(RT * 18)})`; c.fillText(GM.mode === '2p' ? '베기 연타! (F / K)' : '베기 연타!', SW / 2, y - 20);
  }
  // banners
  for (const m of GM.msgs) {
    const u = m.t / m.dur, a = Math.min(1, m.t / 0.08) * Math.min(1, (m.dur - m.t) / 0.25), s = m.big ? 1 + 0.25 * Math.max(0, 1 - m.t / 0.15) : 1;
    c.save(); c.globalAlpha = a; c.textAlign = 'center';
    const x = m.side < 0 ? SW / 2 : (m.side === 0 ? SW * 0.27 : SW * 0.73), y = m.big ? SH * 0.42 : SH * 0.3;
    c.translate(x, y); c.scale(s, s);
    c.font = `900 ${m.big ? 130 : 56}px ${FONT}`; c.lineWidth = m.big ? 10 : 6; c.strokeStyle = 'rgba(0,0,0,0.75)'; c.strokeText(m.text, 0, 0);
    c.fillStyle = m.side === 0 ? '#bfe4ff' : m.side === 1 ? '#ffc0c0' : '#ffffff'; c.fillText(m.text, 0, 0);
    c.restore();
  }
  for (const d of GM.dmgs) {
    const p = w2s(d.x, d.y - d.t * 70), a = clamp(1 - d.t / 0.9, 0, 1) * Math.min(1, d.t * 12 + 0.3);
    c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.font = `900 ${d.big ? 54 : 40}px ${FONT}`; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.8)';
    c.strokeText('-' + d.n, p.x, p.y); c.fillStyle = d.big ? '#ffd24a' : (d.n <= 1 ? '#d8d8e0' : '#ff9a6a'); c.fillText('-' + d.n, p.x, p.y); c.restore();
  }
  if (GM.leaveAsk) { c.fillStyle = 'rgba(0,0,0,0.55)'; rr(c, SW / 2 - 330, SH - 150, 660, 70, 14); c.fill(); c.font = `700 30px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('Q: 대전 나가기     Esc: 계속하기', SW / 2, SH - 104); }
  if (GM.phase === 'over' && GM.pt > 1.0) {
    c.font = `600 30px ${FONT}`; c.textAlign = 'center'; c.fillStyle = `rgba(230,235,255,${0.6 + 0.3 * Math.sin(RT * 3)})`;
    c.fillText((GM.mode === 'host' || GM.mode === 'guest') ? 'Enter / 베기: 다시 하기 (둘 중 누구나)     Esc: 나가기' : 'Enter / 베기 버튼: 다시 하기     Esc: 메뉴', SW / 2, SH * 0.42 + 90);
  }
  if (GM.paused) {
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, SW, SH);
    c.font = `900 96px ${FONT}`; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('일시정지', SW / 2, SH / 2 - 120);
    c.font = `600 32px ${FONT}`; c.fillStyle = '#cfd6ff'; c.fillText('Esc / P : 계속하기      Q : 메뉴로 나가기', SW / 2, SH / 2 - 50);
    drawControls(c, SH / 2 + 40);
  }
}
function drawControls(c, y) {
  const col = (x, title, color, rows) => {
    c.fillStyle = 'rgba(0,0,0,0.55)'; rr(c, x, y, 620, 300, 16); c.fill(); c.strokeStyle = color; c.lineWidth = 2; c.stroke();
    c.font = `800 30px ${FONT}`; c.textAlign = 'left'; c.fillStyle = color; c.fillText(title, x + 28, y + 48);
    c.font = `500 24px ${FONT}`;
    rows.forEach((r, k) => { c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillText(r[0], x + 28, y + 92 + k * 34); c.fillStyle = '#fff'; c.fillText(r[1], x + 210, y + 92 + k * 34); });
  };
  col(SW / 2 - 650, '1P 제다이 (파랑)', '#6cc0ff', [['이동', 'A  D'], ['점프 / 공중제비', 'W  (공중에서 한 번 더)'], ['가드', 'S'], ['베기 (3연타 콤보)', 'F'], ['강공격', 'G'], ['포스', 'H  (게이지 절반)']]);
  col(SW / 2 + 30, '2P 시스 (빨강)', '#ff7070', [['이동', '←  →'], ['점프 / 공중제비', '↑'], ['가드', '↓'], ['베기', 'K  또는 숫자패드 1'], ['강공격', 'L  또는 숫자패드 2'], ['포스', ';  또는 숫자패드 3']]);
  c.font = `500 22px ${FONT}`; c.textAlign = 'center'; c.fillStyle = 'rgba(220,225,255,0.8)';
  c.fillText('가드 + 베기 = 하단 쓸기(가드 무시, 점프로 피함)  ·  맞기 직전 가드 = 패링  ·  강공격끼리 부딪히면 힘겨루기  ·  게임패드 2개 지원', SW / 2, y + 340);
}
const MENU_ITEMS = ONLINE_KIND === 'fb' ? ['1인 플레이  ·  컴퓨터와 대결', '2인 플레이  ·  한 컴퓨터에서 친구와', '👥 2인 대결  ·  방 만들기 (각자 컴퓨터)', '👥 2인 대결  ·  방 들어가기', 'diff'] : ['1인 플레이  ·  컴퓨터와 대결', '2인 플레이  ·  한 컴퓨터에서 친구와', '온라인  ·  방 만들기 (다른 컴퓨터와)', '온라인  ·  방 참가하기', 'diff'];
let menuBoxes = [];
function drawMenu(c) {
  c.fillStyle = 'rgba(2,3,10,0.55)'; c.fillRect(0, 0, SW, SH);
  c.textAlign = 'center';
  c.font = `900 112px ${FONT}`; c.lineWidth = 3;
  const g = c.createLinearGradient(SW / 2 - 500, 0, SW / 2 + 500, 0); g.addColorStop(0, '#6cc0ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(1, '#ff6060');
  c.fillStyle = g; c.fillText('LIGHTSABER DUEL', SW / 2, 190);
  c.font = `600 34px ${FONT}`; c.fillStyle = 'rgba(230,235,255,0.85)'; c.fillText('광선검 결투 — 졸라맨 제다이 vs 시스', SW / 2, 245);
  menuBoxes = [];
  if (GM.screen) { drawLobby(c); return; }
  MENU_ITEMS.forEach((it, k) => {
    const y = 290 + k * 74, sel = GM.menuSel === k, w = 760, x = SW / 2 - w / 2;
    c.fillStyle = sel ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.45)'; rr(c, x, y, w, 62, 14); c.fill();
    c.strokeStyle = sel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'; c.lineWidth = sel ? 3 : 1.5; c.stroke();
    c.font = `${sel ? 800 : 600} 32px ${FONT}`; c.fillStyle = sel ? '#fff' : 'rgba(230,235,255,0.75)';
    const txt = it === 'diff' ? `컴퓨터 난이도   ◀  ${AIL[GM.diff].name}  ▶` : it;
    c.fillText(txt, SW / 2, y + 42); menuBoxes.push({ x, y, w, h: 62, k });
    if (sel) { c.fillStyle = '#fff'; c.fillText('▶', x + 40, y + 42); }
  });
  c.font = `500 22px ${FONT}`; c.fillStyle = 'rgba(220,225,255,0.7)'; c.fillText('↑↓ / W S 선택 · Enter 또는 클릭으로 시작 · Esc 일시정지', SW / 2, 662);
  drawControls(c, 680);
}
function menuInput() {
  if (GM.screen) return;
  const n = MENU_ITEMS.length;
  if (mpress('up')) { GM.menuSel = (GM.menuSel + n - 1) % n; AU.tone({ type: 'sine', f: 900, dur: 0.06, g: 0.06 }); }
  if (mpress('down')) { GM.menuSel = (GM.menuSel + 1) % n; AU.tone({ type: 'sine', f: 900, dur: 0.06, g: 0.06 }); }
  if (GM.menuSel === 4) { if (mpress('left')) GM.diff = (GM.diff + 2) % 3; if (mpress('right')) GM.diff = (GM.diff + 1) % 3; }
  if (mpress('ok')) menuChoose(GM.menuSel);
}
function menuChoose(k) {
  if (k === 0) startMatch('1p'); else if (k === 1) startMatch('2p');
  else if (k === 2) { GM.screen = 'host'; NET.host(); }
  else if (k === 3) { GM.screen = 'join'; GM.joinCode = ''; NET.reset(); }
  else GM.diff = (GM.diff + 1) % 3;
}
const CODE_CH = ONLINE_KIND === 'fb' ? '0123456789' : 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function lobbyKey(e) {
  if (e.code === 'Escape') { NET.close(); NET.status = ''; GM.screen = null; MENUPREV.ok = true; return; }
  if (GM.screen !== 'join' || (NET.role && !NET.err)) return;
  if (e.code === 'Backspace') { GM.joinCode = GM.joinCode.slice(0, -1); NET.err = ''; NET.status = ''; e.preventDefault(); return; }
  if (e.code === 'Enter' || e.code === 'NumpadEnter') { if (GM.joinCode.length === 4) NET.join(GM.joinCode); return; }
  let ch = null;
  if (/^Key[A-Z]$/.test(e.code)) ch = e.code[3]; else if (/^(Digit|Numpad)[0-9]$/.test(e.code)) ch = e.code.slice(-1);
  if (ch && CODE_CH.includes(ch) && GM.joinCode.length < 4) { GM.joinCode += ch; NET.err = ''; NET.status = ''; }
}
function drawLobby(c) {
  const host = GM.screen === 'host', x = SW / 2 - 560, y = 300, w = 1120, h = 520;
  c.fillStyle = 'rgba(0,0,0,0.65)'; rr(c, x, y, w, h, 22); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; c.stroke();
  const FBK = ONLINE_KIND === 'fb';
  c.textAlign = 'center'; c.font = `800 44px ${FONT}`; c.fillStyle = '#fff'; c.fillText(FBK ? (host ? '👥 2인 대결 · 방 만들기' : '👥 2인 대결 · 방 들어가기') : (host ? '온라인 방 만들기' : '온라인 방 참가하기'), SW / 2, y + 70);
  let code = host ? NET.code : GM.joinCode;
  const showCode = host ? (NET.code && NET.status.indexOf('기다리') >= 0) : true;
  c.font = `600 28px ${FONT}`; c.fillStyle = 'rgba(220,228,255,0.85)';
  c.fillText(host ? (FBK ? '방 번호 — 친구에게 알려 주세요' : '방 코드 — 친구에게 알려 주세요') : (FBK ? '친구에게 받은 방 번호 4자리를 입력하세요' : '친구에게 받은 방 코드 4자리를 입력하세요'), SW / 2, y + 130);
  for (let k = 0; k < 4; k++) {
    const bx = SW / 2 - 230 + k * 120, by = y + 160;
    c.fillStyle = 'rgba(255,255,255,0.08)'; rr(c, bx, by, 100, 120, 14); c.fill();
    c.strokeStyle = (!host && k === code.length && !NET.role) ? `rgba(120,200,255,${0.5 + 0.5 * Math.sin(RT * 6)})` : 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.stroke();
    const ch = showCode ? (code[k] || '') : '·';
    c.font = `900 84px ${FONT}`; c.fillStyle = host ? '#8fd0ff' : '#fff'; c.fillText(ch, bx + 50, by + 90);
  }
  c.font = `600 30px ${FONT}`; c.fillStyle = NET.err ? '#ff9080' : '#ffe9a8';
  const st = NET.status || (host ? '' : (code.length === 4 ? (ONLINE_KIND === 'fb' ? 'Enter를 눌러 들어가기' : 'Enter를 눌러 참가') : ''));
  c.fillText(st, SW / 2, y + 340);
  c.font = `500 24px ${FONT}`; c.fillStyle = 'rgba(220,225,255,0.75)';
  c.fillText(host ? (FBK ? '친구가 자기 컴퓨터에서 타자팡 → 펀펀 플레이 → 광선검 결투 → 「방 들어가기」에 이 번호를 넣으면 바로 시작돼요.' : '친구가 다른 컴퓨터에서 이 게임 파일을 열고 → 「온라인 · 방 참가하기」 → 이 코드를 입력하면 바로 시작돼요.') : (FBK ? '숫자 키로 입력 · Backspace 지우기 · Enter 들어가기' : '글자/숫자 키로 입력 · Backspace 지우기 · Enter 참가'), SW / 2, y + 400);
  c.fillText(host ? '나는 제다이(파랑), 친구는 시스(빨강)입니다.  ·  Esc: 취소' : '나는 시스(빨강)로 들어갑니다. 조작은 WASD+F G H 또는 방향키+K L ;  ·  Esc: 취소', SW / 2, y + 440);
}
cv.addEventListener('pointerdown', e => {
  AU.init();
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * SW, y = (e.clientY - r.top) / r.height * SH;
  if (GM.scene === 'menu') { for (const b of menuBoxes) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { GM.menuSel = b.k; menuChoose(b.k); return; } }
  else if (GM.phase === 'over' && GM.pt > 1) startMatch(GM.mode);
});
window.addEventListener('keydown', e => { if (e.code === 'Escape' && GM.phase === 'over' && GM.scene === 'fight') { if (GM.mode === 'host' || GM.mode === 'guest') leaveOnline(); else toMenu(); } });
// ---------- boot ----------
function fit() { const w = window.innerWidth, h = window.innerHeight, s = Math.min(w / SW, h / SH); cv.style.width = (SW * s) + 'px'; cv.style.height = (SH * s) + 'px'; }
window.addEventListener('resize', fit);
buildSprites(); buildVig(); fit();
srand(Date.now() & 0xffffff);
FX.reset(); buildWorld(); mkFighters();
PL = [new Player(0, J), new Player(1, S)];
startMatch('demo');
let lastNow = performance.now();
let lastErr = null, errCount = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - lastNow) / 1000; lastNow = now; if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0;
  ftAvg += (dt * 1000 - ftAvg) * 0.03; if (ftAvg > 30 && RT > 3) QUAL = 0; else if (ftAvg < 18) QUAL = 1;
  try {
    readInputs();
    if (GM.scene === 'menu') menuInput();
    if (GM.netLost > 0) { GM.netLost -= dt; if (GM.netLost <= 0) toMenu(); }
    if (NET.role === 'guest' && !NET.live && !NET.err && NET.t0 && performance.now() - NET.t0 > (ONLINE_KIND === 'fb' ? 25000 : 15000)) NET.fail(ONLINE_KIND === 'fb' ? { message: '연결하지 못했어요. 방장 화면이 켜져 있는지 확인하고 다시 해 주세요.' } : { type: 'peer-unavailable' }, ONLINE_KIND === 'fb');
    if (GM.mode === 'guest') guestStep(dt); else if (!GM.paused) step(dt);
    render();
  } catch (e) {
    errCount++; if (!lastErr) console.error(e); lastErr = String(e && e.message || e);
    try { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.font = '20px monospace'; ctx.textAlign = 'left'; ctx.fillStyle = '#ff8080'; ctx.fillText('오류: ' + lastErr.slice(0, 120), 20, SH - 20); } catch (e2) { }
  }
  MENUPREV = Object.assign({}, MENUKEY);
}
window.GAME = { GM, NET, get PL() { return PL; }, step: (d) => { readInputs(); if (GM.scene === 'menu') menuInput(); if (GM.mode === 'guest') guestStep(d); else step(d); MENUPREV = Object.assign({}, MENUKEY); }, render, startMatch, KEY, menuChoose, lobbyKey: (code) => lobbyKey({ code, preventDefault() { } }) };
requestAnimationFrame(frame);
