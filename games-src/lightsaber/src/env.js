// ================= ENVIRONMENT + FIGHTER RENDERING =================
const AH = { x: 0, y: -350 }, AS = { x: 1650, y: 700 };
function drawBackground(c, V, em = false) {
  const s = em ? 0.5 : 1;
  if (V.x0 < 1030) { c.save(); camX(c, 1, null, s); c.beginPath(); c.rect(-1e5, -1e5, 1030 + 1e5, 2e5); c.clip(); drawHallBG(c, V, em); c.restore(); }
  if (V.x1 > 1030) { c.save(); camX(c, 1, null, s); c.beginPath(); c.rect(1030, -1e5, 1e5, 2e5); c.clip(); drawShaftBG(c, V, em); c.restore(); }
}
function drawHallBG(c, V, em) {
  const s = em ? 0.5 : 1;
  if (!em) {
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const g = c.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#03051a'); g.addColorStop(0.6, '#0e1236'); g.addColorStop(1, '#1d1842');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH); c.restore();
    camX(c, 0.03, AH);
    for (const st of WS.stars) { c.globalAlpha = 0.35 + 0.35 * Math.sin(st.p + RT * 1.3); c.fillStyle = '#cfd8ff'; c.fillRect(st.x, st.y, st.s, st.s); }
    c.globalAlpha = 1;
  }
  camX(c, 0.1, AH, s);
  if (!em) { c.globalAlpha = 0.72; c.drawImage(PRE.planet, 260 - 700, -860 - 700); c.globalAlpha = 1; }
  if (WS.planetFlash > 0) { c.globalCompositeOperation = 'lighter'; sprite(c, SPR.p, WS.pflash.x, WS.pflash.y, 300, WS.planetFlash); sprite(c, SPR.w, WS.pflash.x, WS.pflash.y, 90, WS.planetFlash * 0.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  if (em) { c.globalCompositeOperation = 'lighter'; sprite(c, SPR.c, 260, -860, 760, 0.12); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; return; }
  // back wall with great round window
  camX(c, 0.4, AH);
  c.fillStyle = '#080a15'; c.beginPath(); c.rect(-5000, -4000, 10000, 4600); c.moveTo(880, -620); c.arc(0, -620, 880, 0, TAU, true); c.fill('evenodd');
  c.strokeStyle = '#11142a'; c.lineWidth = 50; c.beginPath(); c.arc(0, -620, 880, 0, TAU); c.stroke();
  c.strokeStyle = 'rgba(110,130,220,0.22)'; c.lineWidth = 3; c.beginPath(); c.arc(0, -620, 856, 0, TAU); c.stroke();
  c.strokeStyle = '#0d1024'; c.lineWidth = 16; c.beginPath(); c.arc(0, -620, 590, 0, TAU); c.stroke();
  c.beginPath(); c.arc(0, -620, 190, 0, TAU); c.lineWidth = 24; c.stroke();
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 190, -620 + Math.sin(a) * 190); c.lineTo(Math.cos(a) * 880, -620 + Math.sin(a) * 880); c.lineWidth = 13; c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.02)'; for (let x = -4000; x < 4000; x += 320) c.fillRect(x, -4000, 3, 4600);
  // mid pillars
  camX(c, 0.72, AH);
  c.fillStyle = '#070913'; c.fillRect(-4000, -40, 8000, 2000);
  for (let x = -2100; x < 1600; x += 430) {
    c.fillStyle = '#0b0d1b'; c.fillRect(x - 46, -2200, 92, 2200);
    c.fillStyle = 'rgba(120,140,230,0.13)'; c.fillRect(x + 40, -2200, 5, 2200);
    c.fillStyle = '#0e1122'; c.fillRect(x - 60, -120, 120, 120); c.fillRect(x - 60, -1000, 120, 40);
    const bl = 0.5 + 0.5 * Math.sin(RT * 2 + x); c.fillStyle = `rgba(90,200,255,${0.35 + 0.4 * bl})`; c.fillRect(x - 6, -760, 12, 12);
  }
  c.fillStyle = '#0a0c19'; c.fillRect(-4000, -1040, 8000, 26);
}
function shaftHide() { return WS.w1Broken < 0 ? 1 : clamp(1 - (T - WS.w1Broken) / 0.35, 0, 1); }
function drawShaftBG(c, V, em) {
  const s = em ? 0.5 : 1;
  if (shaftHide() >= 1) { if (!em) { camX(c); drawBulkhead(c); } return; }
  if (!em) {
    camX(c, 0.85, AS); c.drawImage(PRE.shaftBack, 900, -1700, 1500, 4700);
    for (const l of WS.lamps) { const b = Math.sin(RT * 3 + l.ph) > 0.2 ? 1 : 0.25; c.fillStyle = `rgba(255,170,60,${0.5 * b + 0.2})`; c.fillRect(l.x - 7, l.y - 4, 14, 8); }
  } else {
    camX(c, 0.85, AS, s); c.globalCompositeOperation = 'lighter';
    for (const l of WS.lamps) { const b = Math.sin(RT * 3 + l.ph) > 0.2 ? 1 : 0.25; sprite(c, SPR.o, l.x, l.y, 40, 0.5 * b); }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  if (!em) {
    // mid-depth structure: cross beams and pipes spanning the shaft
    camX(c, 0.92, AS);
    for (const [y, h, col] of [[-620, 26, '#0d0f16'], [-180, 14, '#11141c'], [640, 30, '#100f14'], [1080, 18, '#14110f'], [1980, 34, '#1a100a']]) {
      c.fillStyle = col; c.fillRect(1000, y, 1200, h); c.fillStyle = 'rgba(255,170,90,0.08)'; c.fillRect(1000, y + h - 2, 1200, 2);
      for (let x = 1080; x < 2150; x += 140) { c.fillStyle = col; c.fillRect(x, y + h, 10, 24); }
    }
    c.strokeStyle = '#0f1118'; c.lineWidth = 16; c.beginPath(); c.moveTo(1000, 300); c.bezierCurveTo(1400, 380, 1800, 260, 2200, 420); c.stroke();
    c.lineWidth = 4; c.strokeStyle = '#191c26'; for (const x of [1280, 1460, 1890]) { c.beginPath(); c.moveTo(x, -1800); c.quadraticCurveTo(x + 30, -900, x - 10, -640); c.stroke(); }
  }
  camX(c, 0.75, { x: 1650, y: 1100 }, s);
  c.globalCompositeOperation = 'lighter';
  sprite(c, SPR.o, 1650, 2750, 1500, em ? 0.3 : 0.7); sprite(c, SPR.y, 1650, 2750, 650, em ? 0.35 : 0.6);
  drawBeam(c, em);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
function drawBeam(c, em) {
  const x = 1650, y0 = -1800, y1 = 2900, fl = (0.85 + 0.15 * noise1(RT * 9)) * BEAM.I;
  if (fl <= 0.01) return;
  let g = c.createLinearGradient(x - 340, 0, x + 340, 0);
  g.addColorStop(0, 'rgba(255,130,40,0)'); g.addColorStop(0.5, `rgba(255,140,45,${0.11 * fl})`); g.addColorStop(1, 'rgba(255,130,40,0)');
  c.globalAlpha = 1; c.fillStyle = g; c.fillRect(x - 340, y0, 680, y1 - y0);
  g = c.createLinearGradient(x - 70, 0, x + 70, 0); g.addColorStop(0, 'rgba(255,190,90,0)'); g.addColorStop(0.5, `rgba(255,205,120,${0.22 * fl})`); g.addColorStop(1, 'rgba(255,190,90,0)');
  c.fillStyle = g; c.fillRect(x - 70, y0, 140, y1 - y0);
  c.fillStyle = `rgba(255,240,210,${(em ? 0.25 : 0.5) * fl})`; c.fillRect(x - 4 - 2 * BEAM.I, y0, 8 + 4 * BEAM.I, y1 - y0);
  const H = y1 - y0;
  for (let i = 0; i < 18; i++) { const y = y1 - ((RT * 700 + i * 260) % H); c.fillStyle = `rgba(255,220,160,${0.16 * fl})`; c.fillRect(x - 30, y, 60, 4); }
}
const BEAM = { I: 1, T: null };
// ---------- world plane ----------
function drawWorld(c, V) {
  if (V.x0 < 1070) drawHall(c, V);
  const hd = shaftHide();
  if (V.x1 > 1000 && hd < 1) drawShaft(c, V);
  if (V.x1 > 1000 && hd > 0) { c.globalAlpha = hd; drawBulkhead(c); c.globalAlpha = 1; }
}
function drawBulkhead(c) {
  c.fillStyle = '#0d1020'; c.fillRect(1000, -3000, 4000, 6000);
  for (let y = -2400; y < 2000; y += 240) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(1060, y, 4000, 6); c.fillStyle = 'rgba(120,140,220,0.05)'; c.fillRect(1060, y + 6, 4000, 2); }
  for (let x = 1180; x < 3000; x += 260) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, -3000, 5, 6000); }
  for (let y = -1200; y < 0; y += 240) { c.fillStyle = 'rgba(90,200,255,0.4)'; c.fillRect(1090, y, 80, 4); }
}
function drawHall(c, V) {
  const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#181d36'); g.addColorStop(0.1, '#0c0f1f'); g.addColorStop(1, '#030409');
  c.fillStyle = g; c.fillRect(-1500, 0, 2500, 3000);
}
function drawHallFloorTop(c, V) {
  // seams with fake perspective + edge highlight (after reflections)
  c.lineWidth = 1.5;
  for (let x = -1500; x <= 1000; x += 150) { c.strokeStyle = 'rgba(120,130,200,0.09)'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (x - cam.x) * 0.5, 160); c.stroke(); }
  for (const y of [18, 46, 92]) { c.fillStyle = `rgba(120,130,200,${0.06 - y * 0.0004})`; c.fillRect(-1500, y, 2500, 1.5); }
  c.fillStyle = 'rgba(160,175,240,0.4)'; c.fillRect(-1500, -1.5, 2500, 3);
  // W1 (hall/shaft divider)
  const col = '#1f2439';
  c.fillStyle = col; c.fillRect(1000, -1800, 60, 1360); c.fillRect(1000, 0, 60, 3000);
  if (WS.w1Broken < 0) c.fillRect(1000, -440, 60, 440);
  else for (const ch of WS.w1) if (ch.alive) { c.beginPath(); c.moveTo(ch.v[0].x, ch.v[0].y); for (let i = 1; i < 4; i++) c.lineTo(ch.v[i].x, ch.v[i].y); c.closePath(); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1; c.stroke(); }
  c.fillStyle = 'rgba(150,160,230,0.22)'; c.fillRect(998, -1800, 3, WS.w1Broken < 0 ? 1800 : 1500);
  c.fillStyle = 'rgba(255,170,80,0.12)'; c.fillRect(1058, -1800, 3, WS.w1Broken < 0 ? 4800 : 1500); if (WS.w1Broken >= 0) c.fillRect(1058, 0, 3, 3000);
  for (let y = -1700; y < 0; y += 180) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(1004, y, 52, 4); }
  // hazard stripe at wall base (hall side) shows before break
  c.fillStyle = 'rgba(80,200,255,0.5)'; for (let y = -1600; y < -500; y += 300) c.fillRect(1001, y, 3, 120);
}
function drawShaft(c, V) {
  // foundation under the hall (seen from the shaft)
  c.fillStyle = '#121624'; c.fillRect(-1500, 300, 2500, 2800);
  for (let y = 420; y < 3000; y += 240) { c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(-1500, y, 2500, 8); c.fillStyle = 'rgba(255,170,90,0.07)'; c.fillRect(-1500, y + 8, 2500, 2); }
  for (let x = 0; x < 1000; x += 200) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, 300, 6, 2800); }
  for (let y = 520; y < 2800; y += 480) for (let x = 120; x < 1000; x += 400) { c.fillStyle = `rgba(255,170,70,${0.4 + 0.3 * Math.sin(RT * 2 + x + y)})`; c.fillRect(x, y, 16, 6); }
  // W2 mass
  c.fillStyle = '#171b29'; c.fillRect(2150, -1800, 3000, 4800);
  for (let x = 2400; x < 5000; x += 220) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x, -1800, 6, 4800); }
  for (let y = -1300; y < 2800; y += 480) for (let x = 2350; x < 4000; x += 380) { c.fillStyle = `rgba(255,170,70,${0.35 + 0.3 * Math.sin(RT * 2.4 + x + y)})`; c.fillRect(x, y, 16, 6); }
  c.fillStyle = 'rgba(255,170,90,0.16)'; c.fillRect(2150, -1800, 3, 4800);
  for (let y = -1700; y < 2900; y += 180) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(2150, y, 80, 4); }
  c.fillStyle = '#20263a'; c.fillRect(2160, -1800, 16, 4800); c.fillStyle = 'rgba(200,210,255,0.08)'; c.fillRect(2163, -1800, 3, 4800);
  for (let y = -1650; y < 2900; y += 240) { c.fillStyle = '#272d44'; c.fillRect(2156, y, 26, 12); }
  // left lower mass pipes (shaft face of W1)
  c.fillStyle = '#1d2235'; c.fillRect(1062, 40, 14, 3000); c.fillStyle = 'rgba(200,210,255,0.07)'; c.fillRect(1072, 40, 3, 3000);
  // bracket
  if (T < C1.swing + 0.05) { c.fillStyle = '#2f3550'; c.fillRect(2110, 165, 42, 40); c.beginPath(); c.moveTo(2150, 205); c.lineTo(2150, 260); c.lineTo(2105, 205); c.fill(); }
  else { c.fillStyle = '#2f3550'; c.beginPath(); c.moveTo(2150, 165); c.lineTo(2128, 180); c.lineTo(2150, 230); c.fill(); }
  drawCables(c);
  drawC1(c);
  drawP3(c);
}
function drawCables(c) {
  c.lineCap = 'round';
  for (const cb of WS.cables) {
    const p = SURF.c1.point(cb.lx, T); const top = { x: cb.x0, y: -1800 };
    c.strokeStyle = '#3b4157'; c.lineWidth = 3.2;
    if (cb.cut < 0 || T < cb.cut) { c.beginPath(); c.moveTo(top.x, top.y); c.lineTo(p.x, p.y - 74); c.stroke(); continue; }
    const e = T - cb.cut;
    const yu = cb.yc - 700 * (1 - Math.exp(-e * 3.5)), sw = Math.sin(e * 14) * 26 * Math.exp(-e * 2.5);
    c.beginPath(); c.moveTo(top.x, top.y); c.quadraticCurveTo(top.x + sw, (top.y + yu) / 2, top.x + sw * 0.6, yu); c.stroke();
    const Lw = Math.max(20, (p.y - 74) - cb.yc), ey = Math.min(cb.yc + 0.5 * G * e * e, p.y - 74 + Lw * 0.85), ex = p.x + Math.sin(e * 6 + cb.lx) * 40 * Math.exp(-e * 1.2);
    c.beginPath(); c.moveTo(p.x, p.y - 74); c.quadraticCurveTo(p.x - 30 * Math.sin(e * 5), (p.y - 74 + ey) / 2, ex, ey); c.stroke();
  }
}
function drawC1(c) {
  const f = SURF.c1.at(T); c.save(); c.translate(f.x, f.y); c.rotate(f.a);
  c.lineCap = 'round';
  c.strokeStyle = '#424862'; c.lineWidth = 3.5;
  for (const r of WS.rails) if (r.cut < 0 || T < r.cut) { c.beginPath(); c.moveTo(r.a, -74); c.lineTo(r.b, -74); c.moveTo(r.a, -40); c.lineTo(r.b, -40); c.stroke(); }
  c.strokeStyle = '#4a5170'; c.lineWidth = 5;
  for (let lx = -1080; lx <= -10; lx += 100) { c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx, -76); c.stroke(); }
  c.fillStyle = '#2a3043'; c.fillRect(-C1.len, 0, C1.len, 13);
  c.fillStyle = 'rgba(180,190,235,0.4)'; c.fillRect(-C1.len, -1.5, C1.len, 2.5);
  c.strokeStyle = '#1f2436'; c.lineWidth = 4; c.beginPath(); c.moveTo(-C1.len, 13);
  for (let x = -C1.len, i = 0; x <= 0; x += 55, i++) c.lineTo(x, i % 2 ? 13 : 44);
  c.stroke(); c.beginPath(); c.moveTo(-C1.len, 44); c.lineTo(0, 44); c.stroke();
  for (let x = -1000; x < 0; x += 200) { c.fillStyle = `rgba(255,180,90,${0.5 + 0.3 * Math.sin(RT * 4 + x)})`; c.fillRect(x, 16, 8, 4); }
  c.restore();
}
function drawP3(c) {
  const x0 = P3.cx - P3.hw, x1 = P3.cx + P3.hw, y = P3.y;
  c.fillStyle = '#121620'; c.fillRect(1592, y + 40, 116, 1500);
  c.fillStyle = 'rgba(255,170,90,0.12)'; c.fillRect(1592, y + 40, 4, 1500); c.fillRect(1704, y + 40, 4, 1500);
  for (let yy = y + 120; yy < y + 1500; yy += 150) { c.fillStyle = `rgba(255,180,90,${0.45 + 0.25 * Math.sin(RT * 3 - yy * 0.01)})`; c.fillRect(1588, yy, 124, 5); }
  c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.lineTo(x1 - 46, y + 50); c.lineTo(x0 + 46, y + 50); c.closePath();
  const g = c.createLinearGradient(0, y, 0, y + 50); g.addColorStop(0, '#2a3042'); g.addColorStop(1, '#3a2418');
  c.fillStyle = g; c.fill();
  c.fillStyle = 'rgba(200,210,255,0.45)'; c.fillRect(x0, y - 1.5, x1 - x0, 3);
  for (let x = x0 + 60; x < x1 - 40; x += 70) { c.fillStyle = 'rgba(120,220,255,0.75)'; c.fillRect(x, y + 20, 22, 4); }
  for (const k of FX.cracks) {
    c.beginPath(); c.moveTo(k.pts[0], k.pts[1]); for (let i = 2; i < k.pts.length; i += 2) c.lineTo(k.pts[i], k.pts[i + 1]);
    c.strokeStyle = 'rgba(5,4,8,0.9)'; c.lineWidth = 3; c.stroke();
    const h = Math.exp(-(T - k.t) / 1.5); if (h > 0.02) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,150,60,${h * 0.8})`; c.lineWidth = 2; c.stroke(); c.globalCompositeOperation = 'source-over'; }
  }
}
function addCrack(x, y, n = 3) {
  for (let k = 0; k < n; k++) {
    const pts = [x, y]; let px = x, py = y, a = R(0.3, PI - 0.3); const len = R(40, 160);
    for (let d = 0; d < len; d += 14) { a += R(-0.5, 0.5); px += Math.cos(a) * 14 * RS() * 0.6 + R(-8, 8); py += Math.abs(Math.sin(a)) * 9; if (py > P3.y + 46) break; pts.push(px, py); }
    FX.cracks.push({ pts, t: T });
  }
}
function drawEnvLights(c) {
  c.globalCompositeOperation = 'lighter';
  for (const F of FIGHTERS) {
    const B = F.B; if (!B || B.ext < 0.03) continue;
    const mx = (B.sx + B.tx) / 2, my = (B.sy + B.ty) / 2, sp = F.idx ? SPR.r : SPR.b;
    sprite(c, sp, mx, my, 360, 0.2 * B.ext);
    const fy = floorBelow(mx, my, T);
    if (fy !== null && fy - my < 260) { c.save(); c.translate(mx, fy); c.scale(1, 0.22); sprite(c, sp, 0, 0, 300, 0.45 * B.ext * (1 - (fy - my) / 260)); c.restore(); }
  }
  for (const l of FX.lights) { const u = l.life / l.max; const sp = l.col[2] > l.col[0] ? (l.col[0] > 200 ? SPR.p : SPR.c) : (l.col[1] > 200 ? SPR.y : SPR.o); sprite(c, sp, l.x, l.y, l.r * 0.8, l.i * u * 0.3); }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
}
// ---------- fighters ----------
function lightAt(x, y) {
  let r = 0, g = 0, b = 0;
  for (const F of FIGHTERS) {
    const B = F.B; if (!B || B.ext < 0.03) continue;
    const q = closestPtSeg(x, y, B.sx, B.sy, B.tx, B.ty), d2 = (q.x - x) ** 2 + (q.y - y) ** 2, I = B.ext / (1 + d2 / 3600);
    r += F.col[0] * I; g += F.col[1] * I; b += F.col[2] * I;
  }
  for (const l of FX.lights) { const d2 = (l.x - x) ** 2 + (l.y - y) ** 2, I = l.i * (l.life / l.max) / (1 + d2 / (l.r * l.r * 0.2)); r += l.col[0] * I; g += l.col[1] * I; b += l.col[2] * I; }
  if (x > 1030) { const d = sstep(200, 2300, y) * BEAM.I; r += 120 * d; g += 60 * d; b += 15 * d; } else { r += 14; g += 18; b += 34; }
  const sf = FX.screenFlash * 200; r += sf; g += sf; b += sf;
  return [r, g, b];
}
function bodyCol(F, x, y, shade) {
  const L = lightAt(x, y), k = F.idx ? 0.34 : 0.4, base = F.o.body;
  if (F.idx) for (let i = 0; i < 3; i++) L[i] = L[i] / (1 + L[i] / 260);
  if (F.hitFlash > 0) { const h = F.hitFlash * 420; L[0] += h; L[1] += h * 0.85; L[2] += h * 0.7; }
  return `rgb(${clamp(base[0] * shade + L[0] * k, 0, 255) | 0},${clamp(base[1] * shade + L[1] * k, 0, 255) | 0},${clamp(base[2] * shade + L[2] * k, 0, 255) | 0})`;
}
function segPts(F, P) {
  P = P || F;
  return [
    { p: [P.H, { x: P.L1.jx, y: P.L1.jy }, { x: P.L1.ex, y: P.L1.ey }], w: 7, sh: 0.6 },
    { p: [P.Sh, { x: P.A1.jx, y: P.A1.jy }, { x: P.A1.ex, y: P.A1.ey }], w: 6.2, sh: 0.6 },
    { p: [P.H, P.C], w: 8.6, sh: 1 },
    { p: [P.C, P.Hd], w: 6, sh: 1 },
    { p: [P.H, { x: P.L0.jx, y: P.L0.jy }, { x: P.L0.ex, y: P.L0.ey }], w: 7.4, sh: 1, near: 1 },
    { p: [P.Sh, { x: P.A0.jx, y: P.A0.jy }, { x: P.A0.ex, y: P.A0.ey }], w: 6.8, sh: 1, near: 1 },
  ];
}
function strokePts(c, p) { c.beginPath(); c.moveTo(p[0].x, p[0].y); for (let i = 1; i < p.length; i++) c.lineTo(p[i].x, p[i].y); c.stroke(); }
function hoodPath(c, F) {
  const h = F.Hd, f = F.f, a = F.ha, P = (x, y) => { const r = rot2(f * x, y, a); return [h.x + r.x, h.y + r.y]; };
  c.beginPath(); c.arc(h.x, h.y, RIG.headR + 1.5, 0, TAU);
  const p0 = P(-4, -14), p1 = P(-22, -12), p2 = P(-13, 4); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(...P(-16, -18), p1[0], p1[1]); c.quadraticCurveTo(...P(-15, -4), p2[0], p2[1]); c.lineTo(...P(-6, 8)); c.closePath();
}
function drawCloth(c, F) {
  const cl = F.cloth; if (!cl) return; const o = F.o.cloth, n = cl.n;
  const L = [], Rr = [];
  for (let i = 0; i < n; i++) {
    const p = cl.p[i], q = cl.p[Math.min(n - 1, i + 1)], pp = cl.p[Math.max(0, i - 1)];
    const dx = q.x - pp.x, dy = q.y - pp.y, d = Math.hypot(dx, dy) || 1, w = lerp(o.w0, o.w1, i / (n - 1)) / 2;
    L.push([p.x - dy / d * w, p.y + dx / d * w]); Rr.push([p.x + dy / d * w, p.y - dx / d * w]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (const p of L) c.lineTo(p[0], p[1]); for (let i = n - 1; i >= 0; i--) c.lineTo(Rr[i][0], Rr[i][1]); c.closePath();
  c.fillStyle = o.col; c.fill(); c.strokeStyle = o.edge; c.lineWidth = 2; c.stroke();
}
function drawFighter(c, F, refl = false) {
  if (!F.A0) return;
  c.lineCap = 'round'; c.lineJoin = 'round';
  drawCloth(c, F);
  const S = segPts(F), sith = F.idx === 1;
  c.strokeStyle = F.o.outline; c.fillStyle = F.o.outline;
  for (const s of S) { c.lineWidth = s.w + 4.6; strokePts(c, s.p); }
  if (sith) { hoodPath(c, F); c.lineWidth = 4.6; c.stroke(); c.fill(); } else { c.beginPath(); c.arc(F.Hd.x, F.Hd.y, RIG.headR + 2.3, 0, TAU); c.fill(); }
  for (let i = 0; i < S.length; i++) {
    const s = S[i], m = s.p[1];
    c.strokeStyle = bodyCol(F, m.x, m.y, s.sh); c.lineWidth = s.w; strokePts(c, s.p);
    if (i === 3) {
      c.fillStyle = bodyCol(F, F.Hd.x, F.Hd.y, 1);
      if (sith) { hoodPath(c, F); c.fill('nonzero'); }
      else { c.beginPath(); c.arc(F.Hd.x, F.Hd.y, RIG.headR, 0, TAU); c.fill(); }
      if (sith && !refl) { const e = rot2(F.f * 7, -1, F.ha), e2 = rot2(F.f * 2.5, -1, F.ha); c.fillStyle = '#ffd040'; c.fillRect(F.Hd.x + e.x - 1.6, F.Hd.y + e.y - 1, 3.4, 2.2); c.fillRect(F.Hd.x + e2.x - 1.4, F.Hd.y + e2.y - 1, 2.8, 2); }
      drawHilt(c, F);
    }
  }
}
function drawHilt(c, F) {
  const B = F.B; if (F.noHilt || !B) return;
  c.lineCap = 'butt';
  const seg = (u0, u1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(lerp(B.hx, B.sx, u0), lerp(B.hy, B.sy, u0)); c.lineTo(lerp(B.hx, B.sx, u1), lerp(B.hy, B.sy, u1)); c.stroke(); };
  if (F.hiltCut) {
    seg(-0.05, 0.48, 7.5, '#0c0d12'); seg(0.56, 1.04, 7.5, '#0c0d12');
    seg(0, 0.48, 4.8, '#a7abb6'); seg(0.56, 1, 4.8, '#a7abb6');
    c.globalCompositeOperation = 'lighter'; seg(0.47, 0.49, 6, 'rgba(255,150,60,0.9)'); seg(0.55, 0.57, 6, 'rgba(255,150,60,0.9)'); c.globalCompositeOperation = 'source-over';
  } else {
    seg(-0.05, 1.05, 7.5, '#0c0d12'); seg(0, 1, 4.8, '#a7abb6'); seg(0.2, 0.55, 5, '#25272e'); seg(0.84, 1, 6, '#dfe2ea');
  }
  c.lineCap = 'round';
}
function drawBlade(c, F, em = false) {
  const B = F.B; if (!B || B.ext < 0.01) return;
  const col = F.col, fl = 1 + 0.07 * noise1(RT * 70 + F.idx * 40) + (F.flick || 0) * R(-0.5, 0.2);
  if (fl <= 0.05) return;
  c.lineCap = 'round';
  const ln = () => { c.beginPath(); c.moveTo(B.sx, B.sy); c.lineTo(B.tx, B.ty); c.stroke(); };
  c.globalCompositeOperation = 'lighter';
  if (em) { c.strokeStyle = rgba(col, 0.9); c.lineWidth = 15 * fl; ln(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 5; ln(); c.globalCompositeOperation = 'source-over'; return; }
  c.strokeStyle = rgba(col, 0.16); c.lineWidth = 19 * fl; ln();
  c.strokeStyle = rgba(col, 0.42); c.lineWidth = 10.5 * fl; ln();
  c.strokeStyle = rgba(col, 0.95); c.lineWidth = 6 * fl; ln();
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = '#ffffff'; c.lineWidth = 3.1 * fl; ln();
}
function drawTrail(c, F, em = false) {
  const tr = F.trail; if (tr.length < 2) return;
  const now = F.t, dur = 0.07, col = F.col;
  const sub = [];
  for (let i = 0; i < tr.length - 1; i++) {
    const a = tr[i], b = tr[i + 1]; if (now - b.t > dur) continue;
    let da = b.a - a.a; da = wrapPi(da);
    const n = Math.max(1, Math.ceil(Math.abs(da) / 0.1));
    for (let k = 0; k < n; k++) {
      const u = k / n; sub.push({ t: lerp(a.t, b.t, u), gx: lerp(a.gx, b.gx, u), gy: lerp(a.gy, b.gy, u), a: a.a + da * u, L: lerp(a.L, b.L, u), hl: lerp(a.hl, b.hl, u) });
    }
  }
  const last = tr[tr.length - 1]; sub.push(last);
  if (sub.length < 2) return;
  c.globalCompositeOperation = 'lighter';
  const P = s => { const dx = Math.cos(s.a), dy = Math.sin(s.a); return [s.gx + dx * (s.hl + s.L * 0.3), s.gy + dy * (s.hl + s.L * 0.3), s.gx + dx * (s.hl + s.L), s.gy + dy * (s.hl + s.L)]; };
  let prev = P(sub[0]);
  for (let i = 1; i < sub.length; i++) {
    const cur = P(sub[i]), age = now - sub[i].t, u = clamp(1 - age / dur, 0, 1);
    const ang = Math.abs(wrapPi(sub[i].a - sub[i - 1].a));
    if (ang < 0.004 && Math.hypot(cur[2] - prev[2], cur[3] - prev[3]) < 1.5) { prev = cur; continue; }
    const sp = clamp(ang / 0.12, 0.25, 1), a = u * u * sp * (em ? 0.4 : 0.24);
    c.fillStyle = rgba(col, a);
    c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(prev[2], prev[3]); c.lineTo(cur[2], cur[3]); c.lineTo(cur[0], cur[1]); c.closePath(); c.fill();
    if (!em && u > 0.4) {
      c.fillStyle = `rgba(255,255,255,${(u - 0.4) * 0.35})`;
      const m = 0.55;
      c.beginPath(); c.moveTo(lerp(prev[0], prev[2], m), lerp(prev[1], prev[3], m)); c.lineTo(prev[2], prev[3]); c.lineTo(cur[2], cur[3]); c.lineTo(lerp(cur[0], cur[2], m), lerp(cur[1], cur[3], m)); c.closePath(); c.fill();
    }
    prev = cur;
  }
  c.globalCompositeOperation = 'source-over';
}
function drawGhosts(c, F) {
  if (!F.ghosts.length) return;
  c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const g of F.ghosts) {
    const age = F.t - g.t; if (age > 0.16 || age < 0) continue; const a = (1 - age / 0.16) * 0.3;
    c.strokeStyle = rgba(F.col, a); c.fillStyle = rgba(F.col, a);
    for (const s of segPts(F, g.P)) { c.lineWidth = s.w + 1; strokePts(c, s.p); }
    c.beginPath(); c.arc(g.P.Hd.x, g.P.Hd.y, RIG.headR, 0, TAU); c.fill();
  }
  c.globalCompositeOperation = 'source-over';
}
function drawReflections(c) {
  c.save();
  c.beginPath(); c.rect(-1500, 0, 2500, 700); c.clip();
  c.transform(1, 0, 0, -1, 0, 0);
  c.globalAlpha = 0.2;
  for (const F of [S, J]) if (F.H.x < 1040 && F.H.y > -700) drawFighter(c, F, true);
  c.globalAlpha = 0.55;
  for (const F of [S, J]) if (F.H.x < 1040 && F.H.y > -700) { drawTrail(c, F); drawBlade(c, F); }
  c.globalAlpha = 1;
  c.restore();
  const g = c.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(12,15,30,0.15)'); g.addColorStop(0.5, 'rgba(10,12,25,0.75)'); g.addColorStop(1, 'rgba(6,7,14,1)');
  c.fillStyle = g; c.fillRect(-1500, 0, 2500, 420);
}
function drawForeground(c, V) {
  // near-camera parallax silhouettes
  if (cam.x < 900 && cam.y < 200) {
    camX(c, 1.55, { x: 0, y: -300 });
    c.fillStyle = '#020306';
    for (const x of [-1500, 1450]) { c.fillRect(x - 70, -2600, 140, 3200); }
  }
  camX(c);
}

function drawSil(c, F, a) {
  if (!F.A0) return; c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000'; c.fillStyle = '#000';
  for (const s of segPts(F)) { c.lineWidth = s.w + 3; strokePts(c, s.p); }
  c.beginPath(); c.arc(F.Hd.x, F.Hd.y, RIG.headR + 1.5, 0, TAU); c.fill();
  const B = F.B; if (B && B.ext > 0.02) { c.lineWidth = 7; c.beginPath(); c.moveTo(B.hx, B.hy); c.lineTo(B.tx, B.ty); c.stroke(); }
  drawCloth(c, F); c.restore();
}
