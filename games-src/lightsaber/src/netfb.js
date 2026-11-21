// ================= ONLINE via 모아팡 Firebase (타자팡 version) =================
// Rooms live at taja/duo/lightsaber/<4 digits> (same place and rules as the other 펀펀 플레이 2인 대결 games).
// Firebase only introduces the two computers; the fight data then goes straight between them (WebRTC).
// If a direct link cannot be made within a few seconds, data is relayed through Firebase instead.
// Everything a player writes goes under the room's st/<own uid> (the same per-player spot duo.js uses), so it fits the existing room rules.
const FBN = {
  CFG: {
    apiKey: 'AIzaSyBlA9TN1BKvnsKrzuq2fMalCrATTeFgkUo', authDomain: 'moaboard-943a3.firebaseapp.com', projectId: 'moaboard-943a3',
    appId: '1:986530203160:web:b48121b7113f38a49c656d', databaseURL: 'https://moaboard-943a3-default-rtdb.asia-southeast1.firebasedatabase.app',
  },
  GAME: 'lightsaber', fb: null, ready: null, base: '', offs: [], pc: null, dc: null, mode: '', role: '', timer: 0,
  relayT: 0, evId: 0, evBuf: [], lastEv: 0, lastInT: 0, lastIn: '', names: {}, uid: '', peerUid: '', gen: 0,
  sdk() { return window.LS_FB_SDK || 'https://www.gstatic.com/firebasejs/10.12.2/'; },
  get() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      try {
        const S = this.sdk();
        const [A, Au, D] = await Promise.all([import(S + 'firebase-app.js'), import(S + 'firebase-auth.js'), import(S + 'firebase-database.js')]);
        const app = A.getApps().length ? A.getApp() : A.initializeApp(this.CFG);
        const auth = Au.getAuth(app);
        let u = auth.currentUser || await new Promise(ok => { const off = Au.onAuthStateChanged(auth, x => { off(); ok(x); }); setTimeout(() => ok(null), 4000); });
        if (!u) u = (await Au.signInAnonymously(auth)).user;
        this.fb = { db: D.getDatabase(app), D }; this.uid = u.uid; return this.fb;
      } catch (e) { console.warn('[lightsaber] firebase', e); this.ready = null; return null; }
    })();
    return this.ready;
  },
  myName() {
    for (const k of ['typang_current_user', 'moa_session']) { try { const u = JSON.parse(localStorage.getItem(k) || 'null'); if (u && u.name) return String(u.name).slice(0, 10); } catch (e) { } }
    return '';
  },
  err(e) {
    const m = String((e && (e.code || e.message)) || e);
    if (/permission|PERMISSION/.test(m)) return '2인 대결 방 자리가 아직 열려 있지 않아요. 선생님이 Firebase 규칙에 taja/duo 를 추가해 주세요.';
    return '대결 방에 연결하지 못했어요. 인터넷을 확인하고 다시 해 주세요.';
  },
  ref(p) { return this.fb.D.ref(this.fb.db, this.base + p); },
  mine(p = '') { return this.ref('/st/' + this.uid + p); },
  theirs(p = '') { return this.ref('/st/' + this.peerUid + p); },
  hostSt(p = '') { return this.ref('/st/' + (this.role === 'host' ? this.uid : this.peerUid) + p); },
  on(p, fn, kind = 'onValue') { this.onR(this.ref(p), fn, kind); },
  onR(r, fn, kind = 'onValue') { this.offs.push(this.fb.D[kind](r, fn)); },
  // ---------- room ----------
  async host() {
    const gen = ++this.gen; this.role = 'host'; NET.status = '대결 방을 만드는 중…';
    const f = await this.get(); if (gen !== this.gen) return;
    if (!f) { NET.fail({ message: this.preview() ? '이 화면에서는 대결 방을 만들 수 없어요. 타자팡 사이트에서 열어 주세요.' : '대결 서버에 연결하지 못했어요. 인터넷을 확인해 주세요.' }, true); return; }
    const D = f.D, now = Date.now();
    try {
      let code = '';
      for (let i = 0; i < 12 && !code; i++) {
        const c = String(1000 + Math.floor(Math.random() * 9000)), v = (await D.get(D.ref(f.db, `taja/duo/${this.GAME}/${c}`))).val();
        const busy = v && v.players && Object.keys(v.players).length && now - (v.t || 0) < 3 * 3600 * 1000;
        if (!busy) code = c;
      }
      if (gen !== this.gen) return;
      if (!code) { NET.fail({ message: '빈 방 번호를 찾지 못했어요. 다시 눌러 주세요.' }, true); return; }
      this.base = `taja/duo/${this.GAME}/${code}`;
      const me = { name: this.myName() || '친구1', slot: 1 };
      await D.set(this.ref(''), { host: this.uid, t: now, players: { [this.uid]: me } });
      D.onDisconnect(this.ref('')).remove();
      NET.code = code; NET.status = '친구를 기다리는 중…'; this.names[this.uid] = me.name;
      let started = false;
      this.on('/players', s => {
        const ps = s.val() || {}; const others = Object.keys(ps).filter(id => id !== this.uid);
        for (const id in ps) this.names[id] = (ps[id] && ps[id].name) || '친구';
        if (others.length && !started) { started = true; this.peerUid = others[0]; NET.status = '친구가 들어왔어요! 연결하는 중…'; this.startRtc(true); }
        else if (!others.length && started) this.gone();
      });
    } catch (e) { console.warn(e); NET.fail({ message: this.err(e) }, true); }
  },
  async join(code) {
    const gen = ++this.gen; this.role = 'guest'; NET.status = '방에 들어가는 중…';
    const f = await this.get(); if (gen !== this.gen) return;
    if (!f) { NET.fail({ message: this.preview() ? '이 화면에서는 대결 방에 들어갈 수 없어요. 타자팡 사이트에서 열어 주세요.' : '대결 서버에 연결하지 못했어요. 인터넷을 확인해 주세요.' }, true); return; }
    const D = f.D;
    try {
      this.base = `taja/duo/${this.GAME}/${code}`;
      const v = (await D.get(this.ref(''))).val(); if (gen !== this.gen) return;
      const ids = v && v.players ? Object.keys(v.players) : [];
      if (!v || !ids.length) { NET.fail({ message: `${code} 번 방이 없어요. 번호를 확인해 주세요.` }, true); return; }
      if (ids.length >= 2 && !ids.includes(this.uid)) { NET.fail({ message: '이 방은 벌써 2명이 꽉 찼어요.' }, true); return; }
      const me = { name: this.myName() || '친구2', slot: 2 };
      await D.set(this.mine(), null).catch(() => { });
      await D.set(this.ref('/players/' + this.uid), me);
      D.onDisconnect(this.ref('/players/' + this.uid)).remove(); D.onDisconnect(this.mine()).remove();
      this.peerUid = v.host; this.names[this.uid] = me.name;
      for (const id of ids) this.names[id] = (v.players[id] && v.players[id].name) || '친구';
      NET.code = code; NET.status = '연결하는 중…';
      this.on('/players', s => { const ps = s.val() || {}; for (const id in ps) this.names[id] = (ps[id] && ps[id].name) || '친구'; if (!ps[this.peerUid] && NET.role) this.gone(); });
      this.startRtc(false);
    } catch (e) { console.warn(e); NET.fail({ message: this.err(e) }, true); }
  },
  preview() { return location.protocol === 'file:' || /claude|usercontent/.test(location.hostname); },
  // ---------- direct link (WebRTC) with Firebase as the introducer ----------
  startRtc(isHost) {
    const D = this.fb.D, gen = this.gen;
    this.onR(this.hostSt('/mode'), s => { if (s.val() === 'relay' && this.mode !== 'relay' && gen === this.gen) this.useRelay(); });
    if (typeof RTCPeerConnection !== 'function' || window.LS_NO_P2P) { if (isHost) D.set(this.mine('/mode'), 'relay').catch(() => { }); return; }
    const pc = this.pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] });
    pc.onicecandidate = e => { if (e.candidate && gen === this.gen) D.push(this.mine('/c'), JSON.stringify(e.candidate.toJSON())).catch(() => { }); };
    this.onR(this.theirs('/c'), s => { let c = s.val(); try { c = JSON.parse(c); } catch (e) { return; } if (c && this.pc === pc) pc.addIceCandidate(c).catch(() => { }); }, 'onChildAdded');
    const wire = dc => {
      this.dc = dc;
      dc.onopen = () => { if (this.mode === 'relay' || gen !== this.gen) return; this.mode = 'p2p'; clearTimeout(this.timer); this.opened(); };
      dc.onmessage = ev => { try { NET.onData(JSON.parse(ev.data)); } catch (e) { } };
      dc.onclose = () => { if (this.mode === 'p2p' && gen === this.gen) this.gone(); };
    };
    const desc = () => JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
    if (isHost) {
      wire(pc.createDataChannel('duel', { ordered: true }));
      pc.createOffer().then(o => pc.setLocalDescription(o)).then(() => D.set(this.mine('/o'), desc())).catch(e => console.warn(e));
      this.onR(this.theirs('/a'), s => { let a = s.val(); try { a = a && JSON.parse(a); } catch (e) { a = null; } if (a && this.pc === pc && !pc.currentRemoteDescription) pc.setRemoteDescription(a).catch(() => { }); });
      this.timer = setTimeout(() => { if (this.mode !== 'p2p' && gen === this.gen) D.set(this.mine('/mode'), 'relay').catch(() => { }); }, 6500);
    } else {
      pc.ondatachannel = e => wire(e.channel);
      this.onR(this.theirs('/o'), s => {
        let o = s.val(); try { o = o && JSON.parse(o); } catch (e) { o = null; }
        if (!o || this.pc !== pc || pc.currentRemoteDescription) return;
        pc.setRemoteDescription(o).then(() => pc.createAnswer()).then(a => pc.setLocalDescription(a))
          .then(() => D.set(this.mine('/a'), desc())).catch(e => console.warn(e));
      });
    }
  },
  // ---------- relay through Firebase (fallback) ----------
  useRelay() {
    if (this.mode === 'p2p') return;
    this.mode = 'relay'; clearTimeout(this.timer);
    try { if (this.pc) this.pc.close(); } catch (e) { } this.pc = null; this.dc = null;
    this.onR(this.theirs(this.role === 'host' ? '/i' : '/s'), s => { const v = s.val(); if (!v) return; let d; try { d = JSON.parse(v); } catch (e) { return; } this.relayIn(d); });
    this.onR(this.theirs('/m'), s => { const m = s.val(); if (m && m.y) NET.onData({ y: m.y }); }, 'onChildAdded');
    this.opened();
  },
  relayIn(d) {
    if (d.y === 's') { const e = (d.e || []).filter(x => x[0] > this.lastEv); if (e.length) this.lastEv = e[e.length - 1][0]; NET.onData({ y: 's', q: d.q, r: d.r, h: d.h, g: d.g, p: d.p, e: e.map(x => [x[1], x[2]]) }); }
    else NET.onData(d);
  },
  opened() {
    NET.conn = { open: true, send: o => this.send(o), close: () => { } };
    NET.names = [this.names[this.role === 'host' ? this.uid : this.peerUid] || '', this.names[this.role === 'host' ? this.peerUid : this.uid] || ''];
    NET.linkKind = this.mode === 'p2p' ? '직접 연결' : 'Firebase 중계';
    NET.connOpen();
  },
  send(o) {
    if (this.mode === 'p2p') { try { if (this.dc && this.dc.readyState === 'open') this.dc.send(JSON.stringify(o)); } catch (e) { } return; }
    if (this.mode !== 'relay' || !this.fb) return;
    const D = this.fb.D, now = performance.now();
    if (o.y === 's') {
      for (const ev of o.e || []) this.evBuf.push([++this.evId, ev[0], ev[1]]);
      if (this.evBuf.length > 80) this.evBuf.splice(0, this.evBuf.length - 80);
      if (now - this.relayT < 50) return; this.relayT = now;
      D.set(this.mine('/s'), JSON.stringify({ y: 's', q: o.q, r: o.r, h: o.h, g: o.g, p: o.p, e: this.evBuf.slice(-50) })).catch(() => { });
    } else if (o.y === 'i') {
      const k = JSON.stringify(o); if (k === this.lastIn && now - this.lastInT < 250) return;
      this.lastIn = k; this.lastInT = now; D.set(this.mine('/i'), k).catch(() => { });
    } else D.push(this.mine('/m'), { y: o.y }).catch(() => { });
  },
  gone() { if (NET.role) NET.lost(); },
  close() {
    this.gen++; clearTimeout(this.timer);
    for (const off of this.offs) { try { off(); } catch (e) { } } this.offs = [];
    try { if (this.pc) this.pc.close(); } catch (e) { } this.pc = null; this.dc = null;
    if (this.fb && this.base) {
      const D = this.fb.D;
      try { if (this.role === 'host') D.remove(this.ref('')).catch(() => { }); else if (this.role === 'guest') { D.remove(this.ref('/players/' + this.uid)).catch(() => { }); D.remove(this.mine()).catch(() => { }); } } catch (e) { }
    }
    Object.assign(this, { base: '', mode: '', role: '', evBuf: [], evId: 0, lastEv: 0, peerUid: '', names: {} });
  },
};
