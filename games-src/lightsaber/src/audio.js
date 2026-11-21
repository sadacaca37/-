// ================= AUDIO (all procedural, WebAudio) =================
const AU = {
  ctx: null, ok: false, rate: 1,
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') { try { const pr = this.ctx.resume(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } } return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    let c; try { c = this.ctx = new AC(); } catch (e) { return; }
    const m = this.master = c.createGain(); m.gain.value = 0.9;
    const lp = this.lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.4;
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.22;
    m.connect(lp); lp.connect(comp); comp.connect(c.destination);
    const verb = c.createConvolver(); verb.buffer = this.ir(3.2, 2.6);
    const vIn = this.vIn = c.createGain(); vIn.gain.value = 0.32; vIn.connect(verb); verb.connect(m);
    this.sfx = c.createGain(); this.sfx.gain.value = 1; this.sfx.connect(m); this.sfx.connect(vIn);
    this.mus = c.createGain(); this.mus.gain.value = 0.38; this.mus.connect(m); this.mus.connect(vIn);
    const nb = this.nbuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.hums = [this.mkHum(94), this.mkHum(77)];
    this.L = {
      wind: this.loop('lowpass', 420, 0.6), rumble: this.loop('lowpass', 110, 0.8),
      lock: this.loop('bandpass', 2700, 1.4), zap: this.loop('highpass', 2400, 0.7),
      reactor: this.loop('lowpass', 70, 1.5),
    };
    const bz = c.createOscillator(); bz.type = 'sawtooth'; bz.frequency.value = 58;
    const bzf = c.createBiquadFilter(); bzf.type = 'bandpass'; bzf.frequency.value = 340; bzf.Q.value = 2;
    const bzg = c.createGain(); bzg.gain.value = 0; bz.connect(bzf); bzf.connect(bzg); bzg.connect(this.sfx); bz.start();
    this.L.buzz = { g: bzg, fl: bzf };
    this.ok = true;
    MUS.init();
  },
  ir(dur, dec) {
    const c = this.ctx, n = c.sampleRate * dur | 0, b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, dec) * Math.min(1, i / 300); }
    return b;
  },
  curve(k) { const n = 1024, a = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; a[i] = Math.tanh(k * x) / Math.tanh(k); } return a; },
  src() { const s = this.ctx.createBufferSource(); s.buffer = this.nbuf; s.loop = true; s.start(0, Math.random() * 1.9); return s; },
  loop(type, f, q) { const c = this.ctx, s = this.src(), fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); g.connect(this.sfx); return { s, fl, g }; },
  setL(name, v, tc = 0.05) { if (!this.ok) return; this.L[name].g.gain.setTargetAtTime(v, this.ctx.currentTime, tc); },
  mkHum(f) {
    const c = this.ctx;
    const o1 = c.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = f;
    const o2 = c.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f * 1.007;
    const o3 = c.createOscillator(); o3.type = 'sine'; o3.frequency.value = f * 0.5;
    const mix = c.createGain(); mix.gain.value = 0.45; o1.connect(mix); o2.connect(mix);
    const g3 = c.createGain(); g3.gain.value = 0.9; o3.connect(g3); g3.connect(mix);
    const sh = c.createWaveShaper(); sh.curve = this.curve(2.2);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 3;
    const g = c.createGain(); g.gain.value = 0;
    const pan = c.createStereoPanner();
    mix.connect(sh); sh.connect(lp); lp.connect(g); g.connect(pan); pan.connect(this.sfx);
    const ns = this.src(); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 600; bp.Q.value = 1.3;
    const sg = c.createGain(); sg.gain.value = 0; ns.connect(bp); bp.connect(sg); sg.connect(pan);
    o1.start(); o2.start(); o3.start();
    return { o1, o2, o3, lp, g, sg, bp, pan, f };
  },
  setHum(i, level, speed, pan) {
    if (!this.ok) return; const h = this.hums[i], t = this.ctx.currentTime;
    const sp = clamp(speed / 2600, 0, 1), r = 0.55 + 0.45 * this.rate;
    h.g.gain.setTargetAtTime(level * (0.11 + 0.2 * sp), t, 0.02);
    const p = h.f * (1 + 0.16 * sp) * r;
    h.o1.frequency.setTargetAtTime(p, t, 0.03); h.o2.frequency.setTargetAtTime(p * 1.007, t, 0.03); h.o3.frequency.setTargetAtTime(p * 0.5, t, 0.03);
    h.lp.frequency.setTargetAtTime((520 + 2600 * sp) * r, t, 0.03);
    h.sg.gain.setTargetAtTime(level * 0.32 * sp * sp, t, 0.02); h.bp.frequency.setTargetAtTime((380 + 1900 * sp) * r, t, 0.03);
    h.pan.pan.setTargetAtTime(clamp(pan, -1, 1), t, 0.05);
  },
  out(node, pan, dest) {
    let last = node;
    if (pan) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); last = p; }
    last.connect(dest || this.sfx);
  },
  nz(o) {
    if (!this.ok) return; const c = this.ctx, t = c.currentTime + (o.t || 0);
    const s = c.createBufferSource(); s.buffer = this.nbuf; s.loop = true; s.playbackRate.value = o.rate || 1;
    const fl = c.createBiquadFilter(); fl.type = o.type || 'bandpass'; fl.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fd || o.dur)); fl.Q.value = o.q || 1;
    const g = c.createGain(), att = o.att || 0.003;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    s.connect(fl); fl.connect(g); this.out(g, o.pan, o.dest);
    s.start(t, Math.random() * 1.5); s.stop(t + o.dur + 0.05);
  },
  tone(o) {
    if (!this.ok) return; const c = this.ctx, t = c.currentTime + (o.t || 0);
    const os = c.createOscillator(); os.type = o.type || 'sine'; os.frequency.setValueAtTime(o.f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.fd || o.dur));
    const g = c.createGain(), att = o.att || 0.004;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.g, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
    let n = os;
    if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; os.connect(f); n = f; }
    n.connect(g); this.out(g, o.pan, o.dest);
    os.start(t); os.stop(t + o.dur + 0.05);
  },
  // ---------- SFX ----------
  ignite(i, pan) {
    const k = i ? 0.8 : 1;
    this.nz({ type: 'highpass', f: 2500, dur: 0.06, g: 0.7, pan });
    this.nz({ type: 'bandpass', f: 300 * k, f2: 3800 * k, dur: 0.38, g: 0.55, q: 1.5, pan });
    this.tone({ type: 'sawtooth', f: 40, f2: 94 * k, dur: 0.5, g: 0.35, lp: 900, pan });
    this.tone({ type: 'square', f: 1800 * k, f2: 300, dur: 0.12, g: 0.08, pan });
  },
  retract(i, pan) {
    this.nz({ type: 'bandpass', f: 3200, f2: 250, dur: 0.45, g: 0.45, q: 1.5, pan });
    this.tone({ type: 'sawtooth', f: 94, f2: 30, dur: 0.45, g: 0.3, lp: 700, pan });
  },
  clash(pow, pan) {
    const r = 0.55 + 0.45 * this.rate, P = clamp(pow, 0, 1.4);
    this.nz({ type: 'highpass', f: 1400 * r, dur: 0.06 + 0.12 * P, g: 0.45 + 0.5 * P, pan });
    this.nz({ type: 'bandpass', f: 2600 * r, q: 0.8, dur: 0.2 + 0.5 * P, g: 0.18 + 0.25 * P, pan, att: 0.01 });
    for (let i = 0; i < 3; i++) { const f = (600 + Math.random() * 1900) * r; this.tone({ type: 'square', f, f2: f * 0.55, dur: 0.08 + 0.1 * P, g: 0.05 + 0.05 * P, pan }); }
    this.tone({ type: 'sine', f: 150 * r, f2: 38, dur: 0.22 + 0.45 * P, g: 0.25 + 0.55 * P, pan });
    if (P > 0.7) this.tone({ type: 'sawtooth', f: 70 * r, f2: 25, dur: 0.8 * P, g: 0.3 * P, lp: 400 });
  },
  whoosh(pow, pan) { this.nz({ type: 'bandpass', f: 250, f2: 1600, fd: 0.12, dur: 0.28, g: 0.25 * pow, q: 1.2, pan, att: 0.05 }); },
  burn(pan) { this.nz({ type: 'bandpass', f: 3400, dur: 0.12, g: 0.13, q: 2, pan }); this.nz({ type: 'lowpass', f: 600, dur: 0.1, g: 0.08, pan }); },
  cut(pan) { this.nz({ type: 'bandpass', f: 4200, f2: 1200, dur: 0.35, g: 0.35, q: 1.8, pan }); this.tone({ type: 'square', f: 2200, f2: 900, dur: 0.15, g: 0.06, pan }); },
  snap(pan) { this.nz({ type: 'highpass', f: 3000, dur: 0.07, g: 0.8, pan }); this.tone({ type: 'triangle', f: 900, f2: 120, dur: 0.6, g: 0.25, pan }); this.tone({ type: 'sine', f: 90, f2: 30, dur: 0.7, g: 0.6 }); },
  push() {
    this.tone({ type: 'sine', f: 85, f2: 26, dur: 1.0, g: 0.9 });
    this.nz({ type: 'lowpass', f: 2500, f2: 180, dur: 0.9, g: 0.7, att: 0.02 });
    this.tone({ type: 'sawtooth', f: 50, f2: 30, dur: 0.6, g: 0.25, lp: 300 });
  },
  crash(pan) {
    this.nz({ type: 'lowpass', f: 3000, f2: 160, dur: 1.6, g: 1.0, pan });
    this.tone({ type: 'sine', f: 70, f2: 22, dur: 1.3, g: 1.0 });
    for (let i = 0; i < 26; i++) this.nz({ t: 0.05 + Math.random() * 1.6, type: 'bandpass', f: 900 + Math.random() * 3200, q: 4, dur: 0.05 + Math.random() * 0.08, g: 0.06 + Math.random() * 0.12, pan: pan + (Math.random() - .5) * .6 });
  },
  land(pow, pan) {
    this.tone({ type: 'sine', f: 110, f2: 35, dur: 0.18 + 0.4 * pow, g: 0.25 + 0.6 * pow, pan });
    this.nz({ type: 'lowpass', f: 1400, f2: 200, dur: 0.15 + 0.5 * pow, g: 0.15 + 0.45 * pow, pan });
  },
  step(pan, g = 0.05) { this.tone({ type: 'sine', f: 140, f2: 60, dur: 0.06, g, pan }); this.nz({ type: 'bandpass', f: 1800, q: 1, dur: 0.03, g: g * 0.6, pan }); },
  kick(pan) { this.tone({ type: 'sine', f: 160, f2: 50, dur: 0.25, g: 0.6, pan }); this.nz({ type: 'lowpass', f: 1200, dur: 0.12, g: 0.4, pan }); },
  explosion(pan) {
    this.nz({ type: 'lowpass', f: 4000, f2: 90, dur: 2.2, g: 1.0, pan });
    this.tone({ type: 'sine', f: 60, f2: 18, dur: 1.8, g: 1.0 });
    for (let i = 0; i < 14; i++) this.nz({ t: 0.3 + Math.random() * 1.6, type: 'bandpass', f: 700 + Math.random() * 2500, q: 3, dur: 0.06, g: 0.08, pan });
  },
  thunder() { this.nz({ type: 'lowpass', f: 300, f2: 60, dur: 2.5, g: 0.22, att: 0.2 }); },
  final() {
    this.tone({ type: 'sine', f: 55, f2: 16, dur: 4.0, g: 1.2 });
    this.tone({ type: 'sawtooth', f: 90, f2: 20, dur: 2.5, g: 0.5, lp: 500 });
    this.nz({ type: 'lowpass', f: 6000, f2: 70, dur: 3.5, g: 1.2 });
    this.nz({ type: 'highpass', f: 1500, dur: 0.25, g: 1.0 });
    this.tone({ type: 'sine', f: 3800, dur: 4.5, g: 0.035, att: 0.6 });
  },
  fizzle(pan) {
    for (let i = 0; i < 9; i++) this.nz({ t: i * 0.045 + Math.random() * 0.03, type: 'bandpass', f: 2500 + Math.random() * 2000, q: 2, dur: 0.04, g: 0.25, pan });
    this.tone({ t: 0.35, type: 'sawtooth', f: 77, f2: 20, dur: 0.4, g: 0.25, lp: 500, pan });
  },
  clatter(pan) { for (let i = 0; i < 5; i++) this.tone({ t: i * 0.11 + Math.random() * 0.04, type: 'triangle', f: 1800 + Math.random() * 1500, f2: 900, dur: 0.12, g: 0.1 / (i + 1), pan }); },
  update(rate) {
    if (!this.ok) return; this.rate = rate; const t = this.ctx.currentTime;
    this.lp.frequency.setTargetAtTime(rate < 0.6 ? 900 + 9000 * rate : 18000, t, 0.08);
  },
};

// ================= MUSIC (procedural score) =================
const MUS = {
  sec: 'off', step: 0, next: 0, timer: null, bpm: 148,
  CH: {
    Dm: { b: 73.42, c: [293.66, 349.23, 440, 587.33] }, Bb: { b: 58.27, c: [233.08, 293.66, 349.23, 466.16] },
    Gm: { b: 49.0, c: [196, 233.08, 293.66, 392] }, A: { b: 55.0, c: [220, 277.18, 329.63, 440] },
    D: { b: 73.42, c: [293.66, 369.99, 440, 587.33] }, C: { b: 65.41, c: [261.63, 329.63, 392, 523.25] },
  },
  PROG: ['Dm', 'Bb', 'Gm', 'A'],
  init() {
    const c = AU.ctx; this.out = AU.mus;
    this.dr = []; const dg = this.drG = c.createGain(); dg.gain.value = 0;
    const dlp = this.drLP = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 420; dlp.Q.value = 1; dg.connect(dlp); dlp.connect(this.out);
    for (let i = 0; i < 3; i++) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 73.42 * [1, 1.5, 2][i]; o.detune.value = (i - 1) * 7; o.connect(dg); o.start(); this.dr.push(o); }
    this.ch = []; const cg = this.chG = c.createGain(); cg.gain.value = 0; cg.connect(this.out);
    const f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 720; f1.Q.value = 5;
    const f2 = c.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1180; f2.Q.value = 7;
    const f3 = c.createBiquadFilter(); f3.type = 'bandpass'; f3.frequency.value = 2650; f3.Q.value = 9;
    const sum = c.createGain(); sum.gain.value = 1;
    const g3 = c.createGain(); g3.gain.value = 0.4; f3.connect(g3); g3.connect(cg); f1.connect(cg); f2.connect(cg);
    sum.connect(f1); sum.connect(f2); sum.connect(f3);
    for (let i = 0; i < 8; i++) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 293.66; o.detune.value = (i % 2 ? 9 : -9); o.connect(sum); o.start(); this.ch.push(o); }
    this.next = c.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 25);
  },
  chord(name, tc = 0.08) {
    if (!AU.ok) return; const ch = this.CH[name], t = AU.ctx.currentTime;
    this.dr[0].frequency.setTargetAtTime(ch.b, t, tc); this.dr[1].frequency.setTargetAtTime(ch.b * 1.5, t, tc); this.dr[2].frequency.setTargetAtTime(ch.b * 2, t, tc);
    for (let i = 0; i < 8; i++) this.ch[i].frequency.setTargetAtTime(ch.c[i % 4] * (i >= 4 ? 0.5 : 1), t, tc);
  },
  cue(sec) {
    this.sec = sec; if (!AU.ok) return; const t = AU.ctx.currentTime;
    const L = { off: [0, 0], intro: [0.5, 0], duel: [0.35, 0.0], tense: [0.5, 0.18], air: [0.35, 0.55], final: [0.45, 0.35], hush: [0.25, 0.12], silence: [0, 0], end: [0.3, 0.5] }[sec] || [0, 0];
    this.drG.gain.setTargetAtTime(L[0] * 0.5, t, sec === 'silence' ? 0.05 : 0.6);
    this.chG.gain.setTargetAtTime(L[1] * 0.13, t, sec === 'silence' ? 0.05 : 0.8);
    if (sec === 'end') this.chord('D', 1.2);
    if (sec === 'air') this.chord('Bb', 0.6);
    if (sec === 'intro' || sec === 'tense' || sec === 'hush') this.chord('Dm', 0.5);
  },
  tick() {
    if (!AU.ok || AU.ctx.state !== 'running') return;
    const c = AU.ctx, spb = 60 / this.bpm / 4;
    if (this.next < c.currentTime) this.next = c.currentTime + 0.02;
    while (this.next < c.currentTime + 0.12) { this.play(this.step, this.next - c.currentTime); this.next += spb; this.step++; }
  },
  play(i, dt) {
    const s = i % 16, bar = (i >> 4) % 4, sec = this.sec;
    const ch = this.CH[this.PROG[bar]];
    if (sec === 'duel' || sec === 'final') {
      if (s === 0) this.chordAt(this.PROG[bar], dt);
      const F = sec === 'final';
      if ([0, 6, 8, 11].includes(s) || (F && [3, 14].includes(s))) this.kick(dt, s === 0 ? 0.9 : 0.6);
      if (s === 4 || s === 12) this.snare(dt, 0.35);
      if (bar === 3 && s >= 12) this.tom(dt, 0.4, 160 - (s - 12) * 18);
      if (s % 2 === 0) { const seq = [1, 1, 2, 1, 1.5, 1, 2, 1.5]; this.pluck(dt, ch.b * 2 * seq[(s / 2) | 0], 0.22); }
      if (s === 0 && bar % 2 === 0) this.brass(dt, ch.c, F ? 0.13 : 0.09);
    } else if (sec === 'tense') {
      if (s === 0) this.kick(dt, 0.6); if (s === 3) this.kick(dt, 0.35);
    } else if (sec === 'intro') {
      if (s === 0 && bar % 2 === 0) this.kick(dt, 0.55, 0.9);
    }
  },
  chordAt(name, dt) { setTimeout(() => this.chord(name), Math.max(0, dt * 1000)); },
  kick(dt, g, len = 0.4) { AU.tone({ t: dt, type: 'sine', f: 120, f2: 38, fd: 0.25, dur: len, g, dest: this.out }); AU.nz({ t: dt, type: 'lowpass', f: 900, dur: 0.05, g: g * 0.4, dest: this.out }); },
  snare(dt, g) { AU.nz({ t: dt, type: 'highpass', f: 1300, dur: 0.16, g, dest: this.out }); AU.tone({ t: dt, type: 'triangle', f: 210, f2: 150, dur: 0.1, g: g * 0.6, dest: this.out }); },
  tom(dt, g, f) { AU.tone({ t: dt, type: 'sine', f, f2: f * 0.6, dur: 0.22, g, dest: this.out }); },
  pluck(dt, f, g) { AU.tone({ t: dt, type: 'sawtooth', f, dur: 0.16, g, lp: 900, dest: this.out }); },
  brass(dt, fs, g) { for (const f of fs) { AU.tone({ t: dt, type: 'sawtooth', f: f * 0.5, dur: 0.7, g, lp: 1400, att: 0.03, dest: this.out }); } },
};
