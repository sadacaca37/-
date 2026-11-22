'use strict';
// ================= CORE =================
const SW = 1920, SH = 1080, TAU = Math.PI * 2, PI = Math.PI, G = 2000;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrapPi = a => { a = (a + PI) % TAU; if (a < 0) a += TAU; return a - PI; };
const EASE = {
  lin: x => x, step: x => 0, io: x => x * x * (3 - 2 * x),
  i2: x => x * x, o2: x => 1 - (1 - x) * (1 - x), i3: x => x * x * x, o3: x => 1 - (1 - x) ** 3,
  o4: x => 1 - (1 - x) ** 4, o5: x => 1 - (1 - x) ** 5, i4: x => x * x * x * x,
  io3: x => x < .5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2,
  back: x => { const c = 1.4, c3 = c + 1; return 1 + c3 * (x - 1) ** 3 + c * (x - 1) ** 2; },
};
let _seed = 1;
function srand(s) { _seed = (s >>> 0) || 1; }
function rnd() { _seed ^= _seed << 13; _seed >>>= 0; _seed ^= _seed >>> 17; _seed ^= _seed << 5; _seed >>>= 0; return _seed / 4294967296; }
const R = (a = 0, b = 1) => a + (b - a) * rnd();
const RS = () => rnd() < .5 ? -1 : 1;
function hash1(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
function noise1(x) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u); }
function rot2(x, y, a) { const c = Math.cos(a), s = Math.sin(a); return { x: x * c - y * s, y: x * s + y * c }; }
function segX(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
  const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) return null;
  const qx = cx - ax, qy = cy - ay;
  const t = (qx * sy - qy * sx) / den, u = (qx * ry - qy * rx) / den;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: ax + rx * t, y: ay + ry * t, t, u };
}
function closestPtSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L > 0 ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = clamp(t, 0, 1);
  return { x: ax + dx * t, y: ay + dy * t, t };
}
function segSegNear(a, b) { // a,b: {sx,sy,tx,ty}
  const c = [];
  let q = closestPtSeg(a.sx, a.sy, b.sx, b.sy, b.tx, b.ty); c.push([a.sx, a.sy, q.x, q.y]);
  q = closestPtSeg(a.tx, a.ty, b.sx, b.sy, b.tx, b.ty); c.push([a.tx, a.ty, q.x, q.y]);
  q = closestPtSeg(b.sx, b.sy, a.sx, a.sy, a.tx, a.ty); c.push([b.sx, b.sy, q.x, q.y]);
  q = closestPtSeg(b.tx, b.ty, a.sx, a.sy, a.tx, a.ty); c.push([b.tx, b.ty, q.x, q.y]);
  let best = null, bd = 1e9;
  for (const e of c) { const d = Math.hypot(e[0] - e[2], e[1] - e[3]); if (d < bd) { bd = d; best = e; } }
  return { x: (best[0] + best[2]) / 2, y: (best[1] + best[3]) / 2, d: bd };
}

// value can be number | function | {fn, near, off}
function V(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'function') return v();
  if (v && v.fn) { let a = v.fn(); if (v.near !== undefined) a += TAU * Math.round((v.near - a) / TAU); if (v.off) a += v.off; return a; }
  return v;
}
class Track {
  constructor(v) { this.k = [{ t: -1e9, v, e: 'step' }]; this.dirty = false; }
  key(t, v, e = 'io') { this.k.push({ t, v, e }); this.dirty = true; return this; }
  sort() { this.k.sort((a, b) => a.t - b.t); this.dirty = false; }
  last() { if (this.dirty) this.sort(); return this.k[this.k.length - 1]; }
  hold(t) { const l = this.last(); if (t > l.t + 1e-6) this.k.push({ t, v: l.v, e: 'lin' }); return this; }
  idx(t) { const k = this.k; let lo = 0, hi = k.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (k[m].t <= t) lo = m; else hi = m - 1; } return lo; }
  at(t) {
    if (this.dirty) this.sort();
    const k = this.k, i = this.idx(t), a = k[i], va = V(a.v);
    if (i === k.length - 1) return va;
    const b = k[i + 1]; if (b.e === 'step') return va;
    const u = (t - a.t) / (b.t - a.t);
    return va + (V(b.v) - va) * EASE[b.e](u);
  }
}
class STrack {
  constructor(v) { this.k = [{ t: -1e9, v }]; }
  key(t, v) { this.k.push({ t, v }); this.k.sort((a, b) => a.t - b.t); return this; }
  at(t) { const k = this.k; let lo = 0, hi = k.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (k[m].t <= t) lo = m; else hi = m - 1; } return k[lo].v; }
}
// event queue
let EVQ = [], evI = 0;
function ev(t, fn) { EVQ.push({ t, fn }); }
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
