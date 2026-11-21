/*
 * 펀펀 플레이 2인 대결 (게임 7종 공용) — window.Duo
 *
 * 두 사람이 각자 컴퓨터에서 같은 게임을 열고, 한 명이 [방 만들기] → 4자리 번호를
 * 친구가 [들어가기]에 넣으면 연결. 방장이 게임을 시작하면 두 화면이 3·2·1 뒤 같이 시작.
 * 게임 중에는 상대 위치·점수가 오가고(상대는 반투명 유령으로 보임), 둘 다 끝나면 승패 표시.
 *
 * 게임에서 쓰는 법
 *   Duo.init({ game: 'supermario', title: '슈퍼마리오', mode: 'score' | 'race',
 *              onStart(settings, info) { ...같은 판 시작... } })
 *   if (Duo.requestStart(settings)) return;   // 방에 있으면 여기서 멈춤(방장은 카운트다운, 친구는 대기)
 *   Duo.send({ x, y, score, ... })            // 매 프레임 불러도 됨 (알아서 1초에 10번만 보냄)
 *   const p = Duo.peerState()                 // 상대 상태(부드럽게 이어 줌) 또는 null
 *   Duo.finish({ score, cleared, time })      // 판이 끝났을 때 한 번
 *   Duo.drawTag(ctx, x, y)                    // 캔버스에 상대 이름표
 */
(function () {
  'use strict';
  if (window.Duo) return;

  var Z = 2147483000;
  var cfg = { game: '', title: '', mode: 'score', onStart: null, scoreLabel: '점수', position: 'top-right', btnStyle: '', hudStyle: '', countdown: true };
  var listeners = {};
  var st = {
    via: '', // 'socket' | 'http'
    selfId: '',
    room: null, // { code, hostId, players:[{id,name,slot}], round }
    round: 0,
    playing: false,
    myResult: null,
    peerResult: null,
    peerGone: false,
    peerSnaps: [], // [{t, s}]
    lastSend: 0,
    pendingState: null,
  };
  var sock = null;
  var http = { pid: '', secret: '', outbox: [], running: false };

  function emit(name, a, b) {
    (listeners[name] || []).forEach(function (fn) {
      try {
        fn(a, b);
      } catch (e) {
        console.error(e);
      }
    });
  }

  /* ------------------------------------------------------------ 연결 */
  function loadScript(src) {
    return new Promise(function (ok) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () {
        ok(true);
      };
      s.onerror = function () {
        ok(false);
      };
      document.head.appendChild(s);
    });
  }

  var sockReady = null;
  function getSocket() {
    if (sockReady) return sockReady;
    sockReady = (async function () {
      if (!window.io) await loadScript('/socket.io/socket.io.min.js');
      if (!window.io) return null;
      try {
        sock = window.io('/duo', { path: '/socket.io', transports: ['websocket', 'polling'], reconnectionAttempts: 3, timeout: 4000 });
      } catch (e) {
        return null;
      }
      ['room', 'peer_left', 'start', 'st', 'fin', 'emote', 'notice'].forEach(function (ev) {
        sock.on(ev, function (d) {
          if (st.via === 'socket') onEvent(ev, d);
        });
      });
      sock.on('disconnect', function () {
        if (st.via === 'socket' && st.room) toast('연결이 잠깐 끊겼어요. 다시 연결하는 중…');
      });
      return await new Promise(function (ok) {
        if (sock.connected) return ok(sock);
        var t = setTimeout(function () {
          ok(null);
        }, 2500);
        sock.once('connect', function () {
          clearTimeout(t);
          ok(sock);
        });
      });
    })();
    return sockReady;
  }

  function sockAsk(ev, payload) {
    return new Promise(function (ok) {
      if (!sock || !sock.connected) return ok(null);
      sock.timeout(5000).emit(ev, payload, function (err, res) {
        ok(err ? null : res);
      });
    });
  }


  /* ------------------------------------------------------------ Firebase 길 (모아팡 안 타자팡: 서버 없음) */
  // 모아팡 Firebase(Realtime Database)의 taja/duo/<게임>/<방번호> 자리에서 두 사람이 만남.
  // 타자팡과 같은 주소라서 학생 로그인(익명)을 그대로 함께 씀.
  var FB_CFG = {
    apiKey: 'AIzaSyBlA9TN1BKvnsKrzuq2fMalCrATTeFgkUo',
    authDomain: 'moaboard-943a3.firebaseapp.com',
    projectId: 'moaboard-943a3',
    appId: '1:986530203160:web:b48121b7113f38a49c656d',
    databaseURL: 'https://moaboard-943a3-default-rtdb.asia-southeast1.firebasedatabase.app',
  };
  var FB_SDK = window.DUO_FB_SDK || 'https://www.gstatic.com/firebasejs/10.12.2/';
  var fb = null, fbReady = null, fbRoom = null; // fbRoom: { base, offs:[], code, host, players, offset, lastStart, finSeen }
  function getFb() {
    if (fbReady) return fbReady;
    fbReady = (async function () {
      try {
        var mods = await Promise.all([import(FB_SDK + 'firebase-app.js'), import(FB_SDK + 'firebase-auth.js'), import(FB_SDK + 'firebase-database.js')]);
        var A = mods[0], Au = mods[1], D = mods[2];
        var app = A.getApps().length ? A.getApp() : A.initializeApp(FB_CFG);
        var auth = Au.getAuth(app);
        var u = auth.currentUser || (await new Promise(function (ok) {
          var off = Au.onAuthStateChanged(auth, function (x) { off(); ok(x); });
          setTimeout(function () { ok(null); }, 4000);
        }));
        if (!u) u = (await Au.signInAnonymously(auth)).user;
        fb = { db: D.getDatabase(app), uid: u.uid, D: D };
        return fb;
      } catch (e) {
        console.warn('[duo] firebase', e);
        fbReady = null;
        return null;
      }
    })();
    return fbReady;
  }
  function fbErr(e) {
    var m = String((e && (e.code || e.message)) || e);
    if (/permission|PERMISSION/.test(m)) return '2인 대결 방 자리가 아직 열려 있지 않아요. 선생님이 Firebase 규칙에 taja/duo 를 추가해 주세요.';
    return '대결 방에 연결하지 못했어요. 잠시 뒤 다시 눌러 주세요.';
  }
  function fbView() {
    var r = fbRoom, list = [];
    Object.keys(r.players || {}).forEach(function (id) { var p = r.players[id] || {}; list.push({ id: id, name: String(p.name || '친구'), slot: p.slot === 2 ? 2 : 1 }); });
    list.sort(function (a, b) { return a.slot - b.slot; });
    var host = r.players && r.players[r.host] ? r.host : list.length ? list[0].id : r.host;
    return { game: cfg.game, code: r.code, hostId: host, round: r.lastStart || 0, players: list };
  }
  async function fbEnter(kind, code, name) {
    var f = await getFb();
    if (!f) return null;
    var D = f.D, db = f.db, now = Date.now();
    try {
      var base = '', data = null;
      if (kind === 'create') {
        for (var i = 0; i < 12 && !base; i++) {
          var c = String(1000 + Math.floor(Math.random() * 9000));
          var snap = await D.get(D.ref(db, 'taja/duo/' + cfg.game + '/' + c));
          var v = snap.val();
          var busy = v && v.players && Object.keys(v.players).length && now - (v.t || 0) < 3 * 3600 * 1000;
          if (!busy) { base = 'taja/duo/' + cfg.game + '/' + c; code = c; }
        }
        if (!base) return { success: false, error: '빈 방 번호를 찾지 못했어요. 다시 눌러 주세요.' };
        data = { host: f.uid, t: now, players: {} };
        data.players[f.uid] = { name: name || '친구1', slot: 1 };
        await D.set(D.ref(db, base), data);
      } else {
        base = 'taja/duo/' + cfg.game + '/' + code;
        var s2 = await D.get(D.ref(db, base));
        data = s2.val();
        var ids = data && data.players ? Object.keys(data.players) : [];
        if (!data || !ids.length) return { success: false, error: code + ' 번 방이 없어요. 번호와 게임이 맞는지 확인해 주세요.' };
        if (ids.length >= 2 && ids.indexOf(f.uid) < 0) return { success: false, error: '이 방은 벌써 2명이 꽉 찼어요.' };
        var other = data.players[ids[0]] || {};
        var slot = other.slot === 1 ? 2 : 1;
        var nm = name || '친구' + slot;
        if (other.name === nm) nm = nm + '(' + slot + ')';
        await D.set(D.ref(db, base + '/players/' + f.uid), { name: nm, slot: slot });
        data.players[f.uid] = { name: nm, slot: slot };
      }
      D.onDisconnect(D.ref(db, base + '/players/' + f.uid)).remove();
      D.onDisconnect(D.ref(db, base + '/st/' + f.uid)).remove();
      fbRoom = { base: base, code: code, host: data.host, players: data.players, offs: [], offset: 0, lastStart: 0, finSeen: {} };
      fbListen();
      return { success: true, selfId: f.uid, room: fbView() };
    } catch (e) {
      console.warn('[duo] enter', e);
      return { success: false, error: fbErr(e) };
    }
  }
  function fbListen() {
    var D = fb.D, db = fb.db, r = fbRoom, on = function (path, fn) { r.offs.push(D.onValue(D.ref(db, path), fn)); };
    var first = true;
    on('.info/serverTimeOffset', function (s) { r.offset = s.val() || 0; });
    on(r.base + '/host', function (s) { if (s.val()) r.host = s.val(); });
    on(r.base + '/players', function (s) {
      if (st.via !== 'fb' || fbRoom !== r) return;
      var before = Object.keys(r.players || {}).filter(function (id) { return id !== fb.uid; }).length;
      r.players = s.val() || {};
      var after = Object.keys(r.players).filter(function (id) { return id !== fb.uid; }).length;
      if (!r.players[fb.uid] && !first) return resetRoom('방이 닫혔어요.');
      first = false;
      if (after < before) onEvent('peer_left', { room: fbView() });
      else onEvent('room', fbView());
    });
    on(r.base + '/start', function (s) {
      var v = s.val();
      if (!v || st.via !== 'fb' || fbRoom !== r) return;
      if (!(v.round > r.lastStart)) return;
      var fresh = r.lastStart > 0 || Date.now() + r.offset - (v.at || 0) < 8000;
      r.lastStart = v.round;
      if (!fresh) return; // 들어오기 전에 시작한 판은 무시
      var waited = Date.now() + r.offset - (v.at || Date.now());
      onEvent('start', { round: v.round, settings: v.settings == null ? null : v.settings, seed: v.seed || 0, delay: Math.max(900, 3200 - Math.max(0, waited)) });
    });
    on(r.base + '/st', function (s) {
      var v = s.val() || {};
      Object.keys(v).forEach(function (id) { if (id !== fb.uid) onEvent('st', v[id]); });
    });
    on(r.base + '/fin', function (s) {
      var v = s.val() || {};
      Object.keys(v).forEach(function (id) {
        var x = v[id];
        if (id === fb.uid || !x || r.finSeen[id] === x.round) return;
        r.finSeen[id] = x.round;
        onEvent('fin', { round: x.round, result: x.result || null });
      });
    });
  }
  function fbSend(ev, data) {
    if (!fb || !fbRoom) return;
    var D = fb.D, db = fb.db, r = fbRoom, ref = function (p) { return D.ref(db, r.base + p); };
    var fail = function (e) { console.warn('[duo] send', ev, e); };
    if (ev === 'st') D.set(ref('/st/' + fb.uid), data).catch(fail);
    else if (ev === 'fin') D.set(ref('/fin/' + fb.uid), data).catch(fail);
    else if (ev === 'start') {
      var u = { fin: null, st: null, start: { round: (r.lastStart || 0) + 1, settings: data && data.settings != null ? data.settings : null, seed: Math.floor(Math.random() * 2147483647), at: D.serverTimestamp() } };
      D.update(ref(''), u).catch(function (e) { fail(e); toast(fbErr(e)); });
    } else if (ev === 'emote') toast('');
  }
  function fbLeave() {
    if (!fb || !fbRoom) return;
    var D = fb.D, db = fb.db, r = fbRoom;
    r.offs.forEach(function (off) { try { off(); } catch (e) {} });
    var others = Object.keys(r.players || {}).filter(function (id) { return id !== fb.uid; });
    var u = {};
    if (others.length) { u['players/' + fb.uid] = null; u['st/' + fb.uid] = null; if (r.host === fb.uid) u.host = others[0]; D.update(D.ref(db, r.base), u).catch(function () {}); }
    else D.remove(D.ref(db, r.base)).catch(function () {});
    fbRoom = null;
  }

  async function post(path, body) {
    try {
      var r = await fetch('/api/duo/' + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      if (r.status === 401) return { gone: true };
      if ((r.headers.get('content-type') || '').indexOf('application/json') < 0) return null;
      return await r.json();
    } catch (e) {
      return null;
    }
  }

  async function httpLoop() {
    if (http.running) return;
    http.running = true;
    var fails = 0;
    while (st.via === 'http' && http.pid) {
      var pid = http.pid;
      var events = http.outbox.splice(0, http.outbox.length);
      var j = await post('sync', { pid: pid, secret: http.secret, events: events });
      if (pid !== http.pid) break;
      if (j && j.gone) {
        resetRoom('방 연결이 끊겼어요. 다시 방을 만들거나 들어가 주세요.');
        break;
      }
      if (!j) {
        http.outbox = events.concat(http.outbox).slice(-20);
        if (++fails > 8) {
          resetRoom('인터넷 연결이 끊겨 방에서 나왔어요.');
          break;
        }
        await new Promise(function (ok) {
          setTimeout(ok, 800);
        });
        continue;
      }
      fails = 0;
      (j.events || []).forEach(function (e) {
        onEvent(e.event, e.data);
      });
    }
    http.running = false;
  }

  function sendRaw(ev, data) {
    if (!st.room) return;
    if (st.via === 'fb') return fbSend(ev, data);
    if (st.via === 'socket') {
      if (sock && sock.connected) sock.emit(ev, data);
      return;
    }
    if (st.via === 'http') {
      if (ev === 'st') {
        for (var i = http.outbox.length - 1; i >= 0; i--) if (http.outbox[i].event === 'st') http.outbox.splice(i, 1);
      }
      http.outbox.push({ event: ev, data: data });
    }
  }

  function myName() {
    try {
      var u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
      if (u && u.name) return String(u.name);
    } catch (e) {}
    try {
      var m = JSON.parse(localStorage.getItem('moa_session') || 'null');
      if (m && m.name) return String(m.name);
    } catch (e) {}
    return '';
  }

  async function enter(kind, code) {
    leaveRoom(true);
    setBusy(true);
    var payload = { game: cfg.game, code: code, name: myName() };
    var res = null;
    var via = 'fb';
    res = await fbEnter(kind, code, payload.name);
    if (!res) {
      via = 'socket';
      if (await getSocket()) res = await sockAsk(kind, payload);
    }
    if (!res) {
      via = 'http';
      res = await post(kind, payload);
    }
    setBusy(false);
    if (!res || res.gone) {
      var preview = location.protocol === 'file:' || /claude|usercontent|localhost-preview/.test(location.hostname);
      showError(preview ? '이 화면에는 대결 서버가 없어요. 타자팡 사이트에서 열어 주세요.' : '대결 방에 연결하지 못했어요. 인터넷을 확인하고 잠시 뒤 다시 눌러 주세요.');
      return false;
    }
    if (!res.success) {
      showError(res.error || '방에 들어가지 못했어요.');
      return false;
    }
    st.via = via;
    st.selfId = res.selfId;
    st.room = res.room;
    st.round = res.room.round || 0;
    st.peerGone = false;
    if (via === 'http') {
      http.pid = res.selfId;
      http.secret = res.secret;
      httpLoop();
    }
    render();
    emit('room', st.room);
    return true;
  }

  function leaveRoom(silent) {
    if (!st.room) return;
    if (st.via === 'fb') fbLeave();
    else if (st.via === 'socket') {
      if (sock && sock.connected) sock.emit('leave', null);
    } else if (st.via === 'http' && http.pid) {
      var body = JSON.stringify({ pid: http.pid, secret: http.secret, events: [{ event: 'leave', data: null }] });
      try {
        navigator.sendBeacon('/api/duo/sync', new Blob([body], { type: 'application/json' }));
      } catch (e) {}
    }
    http.pid = '';
    http.secret = '';
    http.outbox = [];
    st.via = '';
    st.room = null;
    st.playing = false;
    st.peerSnaps = [];
    if (!silent) render();
    emit('room', null);
  }

  function resetRoom(msg) {
    if (st.via === 'fb') fbLeave();
    st.via = '';
    http.pid = '';
    st.room = null;
    st.playing = false;
    st.peerSnaps = [];
    render();
    toast(msg);
    emit('room', null);
  }

  function peer() {
    if (!st.room) return null;
    for (var i = 0; i < st.room.players.length; i++) if (st.room.players[i].id !== st.selfId) return st.room.players[i];
    return null;
  }

  function onEvent(ev, d) {
    if (ev === 'room') {
      var hadPeer = !!peer();
      st.room = d;
      st.peerGone = false;
      render();
      if (!hadPeer && peer()) {
        toast('👋 ' + peer().name + ' 들어왔어요!');
        openPanel(true);
      }
      emit('room', st.room);
    } else if (ev === 'peer_left') {
      var p = peer();
      st.room = d.room;
      st.peerGone = true;
      st.peerSnaps = [];
      toast('😢 ' + (p ? p.name : '친구') + ' 나갔어요.');
      render();
      if (st.playing || st.myResult) showResult();
      emit('peerLeft');
      emit('room', st.room);
    } else if (ev === 'start') {
      beginRound(d);
    } else if (ev === 'st') {
      if (d && d.r === st.round) {
        st.peerSnaps.push({ t: performance.now(), s: d });
        if (st.peerSnaps.length > 3) st.peerSnaps.shift();
        updateHud();
      }
    } else if (ev === 'fin') {
      if (d && d.round === st.round) {
        st.peerResult = d.result || {};
        updateHud();
        if (st.myResult) showResult();
        else toast('🏁 ' + (peer() ? peer().name : '친구') + ' 먼저 끝났어요!');
      }
    } else if (ev === 'emote') {
      toast((peer() ? peer().name : '친구') + ' ' + (d && d.e));
    } else if (ev === 'notice') {
      toast(d && d.text);
    }
  }

  /* ------------------------------------------------------------ 대결 진행 */
  function beginRound(d) {
    st.round = d.round;
    st.myResult = null;
    st.peerResult = null;
    st.peerSnaps = [];
    st.playing = false;
    hideResult();
    closePanel();
    countdown(Math.max(1000, (d.delay || 3200) - 200), function () {
      st.playing = true;
      updateHud();
      if (typeof cfg.onStart === 'function') {
        try {
          cfg.onStart(d.settings, { round: d.round, seed: d.seed, isHost: isHost() });
        } catch (e) {
          console.error(e);
        }
      }
      emit('start', d.settings, { round: d.round, seed: d.seed });
    });
  }

  function isHost() {
    return !!(st.room && st.room.hostId === st.selfId);
  }

  function hasPeer() {
    return !!peer();
  }

  /* ------------------------------------------------------------ 화면 */
  var css =
    '.duo-btn{position:fixed;z-index:' + Z + ';top:8px;right:8px;font:700 13px/1 system-ui,"Malgun Gothic",sans-serif;padding:8px 12px;border-radius:999px;border:2px solid #fff;background:#7c3aed;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.35);cursor:pointer;opacity:.92}' +
    '.duo-btn.on{background:#16a34a}.duo-btn.wait{background:#f59e0b}.duo-btn:hover{opacity:1}' +
    '.duo-btn.tl{left:8px;right:auto}.duo-btn.bl{top:auto;bottom:8px;left:8px;right:auto}.duo-btn.br{top:auto;bottom:8px}' +
    '.duo-mask{position:fixed;inset:0;z-index:' + (Z + 1) + ';background:rgba(10,10,30,.55);display:flex;align-items:center;justify-content:center;font-family:system-ui,"Malgun Gothic",sans-serif}' +
    '.duo-card{width:min(360px,92vw);background:#fff;color:#1e1b4b;border-radius:18px;padding:18px 18px 14px;box-shadow:0 10px 40px rgba(0,0,0,.4);text-align:center}' +
    '.duo-card h3{margin:0 0 6px;font-size:19px}.duo-card p{margin:6px 0;font-size:13.5px;line-height:1.5;color:#4338ca}' +
    '.duo-code{font:900 44px/1.1 ui-monospace,Consolas,monospace;letter-spacing:6px;color:#7c3aed;margin:8px 0}' +
    '.duo-row{display:flex;gap:8px;margin-top:10px}.duo-row>*{flex:1}' +
    '.duo-card button{font:700 15px/1 system-ui,"Malgun Gothic",sans-serif;padding:12px 10px;border-radius:12px;border:0;cursor:pointer;background:#7c3aed;color:#fff}' +
    '.duo-card button.gray{background:#e5e7eb;color:#374151}.duo-card button.green{background:#16a34a}.duo-card button:disabled{opacity:.5}' +
    '.duo-card input{font:800 26px/1 ui-monospace,Consolas,monospace;letter-spacing:6px;text-align:center;width:100%;box-sizing:border-box;padding:10px;border:2px solid #c4b5fd;border-radius:12px;color:#1e1b4b}' +
    '.duo-err{color:#dc2626!important;font-weight:700}.duo-hr{height:1px;background:#e5e7eb;margin:12px 0}' +
    '.duo-hud{position:fixed;z-index:' + Z + ';top:8px;left:50%;transform:translateX(-50%);font:800 13px/1.2 system-ui,"Malgun Gothic",sans-serif;color:#fff;background:rgba(20,10,60,.72);border:2px solid rgba(255,255,255,.7);border-radius:12px;padding:5px 12px;pointer-events:none;white-space:nowrap;text-shadow:0 1px 2px #000}' +
    '.duo-hud b.me{color:#fde047}.duo-hud b.you{color:#67e8f9}' +
    '.duo-count{position:fixed;inset:0;z-index:' + (Z + 2) + ';display:flex;align-items:center;justify-content:center;pointer-events:none;font:900 120px/1 system-ui,sans-serif;color:#fff;text-shadow:0 0 18px #7c3aed,0 4px 0 #1e1b4b}' +
    '.duo-toast{position:fixed;z-index:' + (Z + 3) + ';left:50%;bottom:16px;transform:translateX(-50%);background:rgba(20,10,60,.88);color:#fff;font:700 14px/1.3 system-ui,"Malgun Gothic",sans-serif;padding:9px 16px;border-radius:999px;pointer-events:none;transition:opacity .3s}' +
    '.duo-res td{padding:4px 8px;font-size:14px}.duo-res{margin:8px auto;border-collapse:collapse}.duo-res tr.win td{font-weight:900;color:#16a34a}' +
    '.duo-big{font-size:34px;margin:2px 0}';

  var el = {};
  function ensureDom() {
    if (el.btn) return;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    el.btn = document.createElement('button');
    el.btn.className = 'duo-btn';
    el.btn.type = 'button';
    el.btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openPanel();
    });
    el.btn.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });
    if (cfg.btnStyle) el.btn.style.cssText = cfg.btnStyle;
    document.body.appendChild(el.btn);
    el.hud = document.createElement('div');
    el.hud.className = 'duo-hud';
    if (cfg.hudStyle) el.hud.style.cssText = cfg.hudStyle;
    el.hud.style.display = 'none';
    document.body.appendChild(el.hud);
    render();
  }

  function stopKeys(node) {
    ['keydown', 'keyup', 'keypress', 'mousedown', 'pointerdown', 'touchstart'].forEach(function (t) {
      node.addEventListener(t, function (e) {
        e.stopPropagation();
      });
    });
  }

  function render() {
    if (!el.btn) return;
    var pos = { 'top-left': 'tl', 'bottom-left': 'bl', 'bottom-right': 'br' }[cfg.position] || '';
    el.btn.className = 'duo-btn' + (pos ? ' ' + pos : '') + (st.room ? (hasPeer() ? ' on' : ' wait') : '');
    el.btn.textContent = !st.room ? '👥 2인 대결' : hasPeer() ? '👥 ' + st.room.code + ' · ' + peer().name : '👥 ' + st.room.code + ' 친구 기다리는 중';
    if (el.mask && el.mask.dataset.kind === 'panel') fillPanel();
    updateHud();
  }

  var busy = false;
  function setBusy(b) {
    busy = b;
    if (el.mask) el.mask.querySelectorAll('button').forEach(function (x) {
      x.disabled = b;
    });
  }
  function showError(msg) {
    openPanel(true);
    var e = el.mask && el.mask.querySelector('.duo-err');
    if (e) e.textContent = msg;
  }

  function mask(kind) {
    closePanel();
    el.mask = document.createElement('div');
    el.mask.className = 'duo-mask';
    el.mask.dataset.kind = kind;
    stopKeys(el.mask);
    el.mask.addEventListener('click', function (e) {
      if (e.target === el.mask && kind === 'panel') closePanel();
    });
    var card = document.createElement('div');
    card.className = 'duo-card';
    el.mask.appendChild(card);
    document.body.appendChild(el.mask);
    return card;
  }

  function openPanel() {
    ensureDom();
    if (el.mask && el.mask.dataset.kind === 'result') return;
    mask('panel');
    fillPanel();
  }

  function closePanel() {
    if (el.mask) el.mask.remove();
    el.mask = null;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function fillPanel() {
    var card = el.mask.firstChild;
    var t = esc(cfg.title || '게임');
    if (!st.room) {
      card.innerHTML =
        '<h3>👥 ' + t + ' 2인 대결</h3>' +
        '<p>두 사람이 <b>각자 컴퓨터</b>에서 이 게임을 열어요.<br>한 명은 방을 만들고, 다른 한 명은 방 번호를 넣어요.</p>' +
        '<div class="duo-row"><button data-a="create">🏠 방 만들기</button></div>' +
        '<div class="duo-hr"></div>' +
        '<input inputmode="numeric" maxlength="4" placeholder="0000" aria-label="방 번호">' +
        '<div class="duo-row"><button class="green" data-a="join">🚪 방 번호로 들어가기</button></div>' +
        '<p class="duo-err"></p><div class="duo-row"><button class="gray" data-a="close">닫기</button></div>';
      var inp = card.querySelector('input');
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 4);
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') card.querySelector('[data-a=join]').click();
      });
      setTimeout(function () {
        try {
          inp.focus();
        } catch (e) {}
      }, 50);
    } else if (!hasPeer()) {
      card.innerHTML =
        '<h3>🏠 방을 만들었어요</h3><p>친구에게 이 번호를 알려 주세요.<br>친구는 자기 컴퓨터에서 <b>' + t + '</b>을 열고 번호를 넣으면 돼요.</p>' +
        '<div class="duo-code">' + esc(st.room.code) + '</div><p>친구를 기다리는 중… ⏳</p>' +
        '<p class="duo-err"></p><div class="duo-row"><button class="gray" data-a="leave">방 나가기</button><button data-a="close">닫기</button></div>';
    } else if (isHost()) {
      card.innerHTML =
        '<h3>✅ ' + esc(peer().name) + ' 들어왔어요!</h3><div class="duo-code" style="font-size:26px">방 ' + esc(st.room.code) + '</div>' +
        '<p>이제 평소처럼 <b>스테이지(코스)를 고르고 시작</b>하세요.<br>시작하면 친구 화면도 3·2·1 뒤 <b>같은 판</b>이 같이 시작해요.</p>' +
        '<p>상대는 반투명으로 보이고, 위쪽에 두 사람 점수가 나와요.</p>' +
        '<p class="duo-err"></p><div class="duo-row"><button class="gray" data-a="leave">방 나가기</button><button class="green" data-a="close">좋아요!</button></div>';
    } else {
      card.innerHTML =
        '<h3>✅ 방에 들어왔어요!</h3><div class="duo-code" style="font-size:26px">방 ' + esc(st.room.code) + '</div>' +
        '<p>방장 <b>' + esc(peer().name) + '</b>님이 스테이지를 고르고 시작하면<br>내 화면도 3·2·1 뒤 <b>같은 판</b>이 시작돼요.</p>' +
        '<p>그동안 내 캐릭터(카트·비행기)는 미리 골라 두어도 돼요.</p>' +
        '<p class="duo-err"></p><div class="duo-row"><button class="gray" data-a="leave">방 나가기</button><button class="green" data-a="close">기다릴게요</button></div>';
    }
    card.querySelectorAll('button[data-a]').forEach(function (b) {
      b.disabled = busy;
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-a');
        if (a === 'close') closePanel();
        else if (a === 'leave') {
          leaveRoom();
          closePanel();
          toast('방에서 나왔어요. 이제 혼자 하기예요.');
        } else if (a === 'create') enter('create', '');
        else if (a === 'join') {
          var code = (card.querySelector('input').value || '').trim();
          if (code.length !== 4) return showError('방 번호 4자리를 넣어 주세요.');
          enter('join', code);
        }
      });
    });
  }

  var toastTimer = null;
  function toast(msg) {
    if (!msg) return;
    ensureDom();
    if (!el.toast) {
      el.toast = document.createElement('div');
      el.toast.className = 'duo-toast';
      document.body.appendChild(el.toast);
    }
    el.toast.textContent = msg;
    el.toast.style.opacity = '1';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.style.opacity = '0';
    }, 2600);
  }

  function countdown(ms, done) {
    ensureDom();
    var c = document.createElement('div');
    c.className = 'duo-count';
    document.body.appendChild(c);
    var end = performance.now() + ms;
    (function tick() {
      var left = end - performance.now();
      if (left <= 0) {
        c.textContent = cfg.countdown === false ? '' : 'GO!';
        setTimeout(function () {
          c.remove();
        }, 600);
        done();
        return;
      }
      c.textContent = cfg.countdown === false ? '친구와 같이 출발!' : String(Math.ceil(left / 1000));
      if (cfg.countdown === false) c.style.fontSize = '44px';
      requestAnimationFrame(tick);
    })();
  }

  function fmt(n) {
    n = Number(n) || 0;
    return Math.round(n).toLocaleString('ko-KR');
  }
  function fmtTime(ms) {
    ms = Number(ms) || 0;
    var s = ms / 1000;
    var m = Math.floor(s / 60);
    return (m ? m + '분 ' : '') + (s - m * 60).toFixed(1) + '초';
  }

  var hudTimer = 0;
  function updateHud() {
    if (!el.hud) return;
    var show = !!(st.room && hasPeer() && (st.playing || st.myResult));
    el.hud.style.display = show ? '' : 'none';
    if (!show) return;
    var now = performance.now();
    if (now - hudTimer < 150) return;
    hudTimer = now;
    var p = st.peerSnaps.length ? st.peerSnaps[st.peerSnaps.length - 1].s : null;
    var mine = st.pendingState || {};
    var peerTxt = st.peerResult ? '🏁' : p ? p.label || fmt(p.score) : '…';
    var meTxt = st.myResult ? '🏁' : mine.label || fmt(mine.score);
    el.hud.innerHTML = '<b class="me">나 ' + esc(meTxt) + '</b> &nbsp;vs&nbsp; <b class="you">' + esc(peer().name) + ' ' + esc(peerTxt) + '</b>';
  }

  function hideResult() {
    if (el.mask && el.mask.dataset.kind === 'result') closePanel();
  }

  /** 승패: 1 = 내가 이김, -1 = 짐, 0 = 비김 */
  function judge(a, b) {
    if (!b) return 1;
    if (!a) return -1;
    if (!!a.cleared !== !!b.cleared) return a.cleared ? 1 : -1;
    if (cfg.mode === 'race' && a.cleared && b.cleared) {
      var ta = Number(a.time) || 1e12;
      var tb = Number(b.time) || 1e12;
      return ta === tb ? 0 : ta < tb ? 1 : -1;
    }
    var sa = Number(a.score) || 0;
    var sb = Number(b.score) || 0;
    if (sa !== sb) return sa > sb ? 1 : -1;
    var xa = Number(a.time) || 0;
    var xb = Number(b.time) || 0;
    if (cfg.mode === 'race' && xa !== xb) return xa < xb ? 1 : -1;
    return 0;
  }

  function line(r) {
    if (!r) return '-';
    var parts = [];
    if (r.label) parts.push(r.label);
    else if (cfg.mode === 'race' && r.cleared && r.time) parts.push(fmtTime(r.time));
    else parts.push(fmt(r.score) + ' ' + cfg.scoreLabel);
    parts.push(r.cleared ? '완주' : '탈락');
    return parts.join(' · ');
  }

  function showResult() {
    ensureDom();
    if (!st.myResult) return;
    var waiting = !st.peerResult && !st.peerGone;
    var card = mask('result');
    var pname = peer() ? peer().name : '친구';
    if (waiting) {
      card.innerHTML =
        '<h3>🏁 내 판이 끝났어요</h3><p>' + esc(line(st.myResult)) + '</p><p>' + esc(pname) + '님은 아직 하는 중이에요… ⏳</p>' +
        '<div class="duo-row"><button class="gray" data-a="close">닫고 기다리기</button></div>';
    } else {
      var w = st.peerGone && !st.peerResult ? 1 : judge(st.myResult, st.peerResult);
      var head = w > 0 ? '<div class="duo-big">🏆</div><h3>이겼어요!</h3>' : w < 0 ? '<div class="duo-big">😢</div><h3>아쉽게 졌어요</h3>' : '<div class="duo-big">🤝</div><h3>비겼어요!</h3>';
      if (st.peerGone && !st.peerResult) head += '<p>친구가 나가서 내가 이겼어요.</p>';
      card.innerHTML =
        head +
        '<table class="duo-res"><tr class="' + (w > 0 ? 'win' : '') + '"><td>나</td><td>' + esc(line(st.myResult)) + '</td></tr>' +
        '<tr class="' + (w < 0 ? 'win' : '') + '"><td>' + esc(pname) + '</td><td>' + esc(st.peerResult ? line(st.peerResult) : '나감') + '</td></tr></table>' +
        (hasPeer() ? '<p>' + (isHost() ? '다시 하려면 스테이지를 고르고 시작하세요.' : '방장이 다시 시작하면 같이 시작돼요.') + '</p>' : '') +
        '<div class="duo-row"><button class="green" data-a="close">확인</button></div>';
    }
    card.querySelector('[data-a=close]').addEventListener('click', closePanel);
  }

  /* ------------------------------------------------------------ 공개 API */
  var Duo = {
    init: function (o) {
      Object.keys(o || {}).forEach(function (k) {
        cfg[k] = o[k];
      });
      if (document.body) ensureDom();
      else document.addEventListener('DOMContentLoaded', ensureDom);
      window.addEventListener('pagehide', function () {
        leaveRoom(true);
      });
      return Duo;
    },
    on: function (name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return Duo;
    },
    /** 방에 친구와 같이 있나 */
    get active() {
      return !!(st.room && hasPeer());
    },
    get inRoom() {
      return !!st.room;
    },
    get isHost() {
      return isHost();
    },
    /** 대결 판이 진행 중인가 (시작 ~ 내 결과 전) */
    get playing() {
      return st.playing && !st.myResult;
    },
    get round() {
      return st.round;
    },
    get peerName() {
      return peer() ? peer().name : '';
    },
    /**
     * 게임 시작 버튼에서 부름. true면 게임은 여기서 시작하지 말 것
     * (방장: 두 화면 카운트다운 뒤 onStart가 불림 / 친구: 방장을 기다림)
     */
    requestStart: function (settings) {
      if (!st.room) return false;
      if (!hasPeer()) {
        toast('친구가 아직 안 들어왔어요. 혼자 시작해요.');
        return false;
      }
      if (!isHost()) {
        toast('⏳ 방장(' + peer().name + ')이 시작하면 같이 시작돼요!');
        return true;
      }
      sendRaw('start', { settings: settings == null ? null : settings });
      return true;
    },
    /** 내 상태 보내기: 숫자 위주 작은 객체 (score는 위쪽 점수판에 나옴) */
    send: function (state) {
      if (!st.room || !st.playing || st.myResult || !hasPeer()) return;
      st.pendingState = state;
      var now = performance.now();
      var gap = st.via === 'http' ? 160 : 100;
      if (now - st.lastSend < gap) {
        updateHud();
        return;
      }
      st.lastSend = now;
      var s = {};
      for (var k in state) if (Object.prototype.hasOwnProperty.call(state, k)) s[k] = typeof state[k] === 'number' ? Math.round(state[k] * 100) / 100 : state[k];
      s.r = st.round;
      sendRaw('st', s);
      updateHud();
    },
    /** 상대 상태 (숫자는 지난 두 번 사이를 부드럽게 이어 줌). 없으면 null */
    peerState: function () {
      if (!st.room || !st.peerSnaps.length) return null;
      var snaps = st.peerSnaps;
      var last = snaps[snaps.length - 1];
      if (performance.now() - last.t > 4000) return null;
      if (snaps.length < 2) return last.s;
      var a = snaps[snaps.length - 2];
      var span = Math.max(30, last.t - a.t);
      var k = Math.min(1.6, (performance.now() - last.t) / span);
      var out = {};
      for (var key in last.s) {
        var v1 = last.s[key];
        var v0 = a.s[key];
        if (typeof v1 === 'number' && typeof v0 === 'number' && last.s.stage === a.s.stage && Math.abs(v1 - v0) < 2000 && key !== 'score') out[key] = v0 + (v1 - v0) * Math.min(1, 0.5 + k * 0.5);
        else out[key] = v1;
      }
      return out;
    },
    /** 판 끝: { score, cleared, time(ms), label } */
    finish: function (result) {
      if (!st.room || !st.playing || st.myResult) return;
      st.myResult = result || {};
      st.playing = false;
      sendRaw('fin', { round: st.round, result: st.myResult });
      updateHud();
      setTimeout(showResult, 900);
    },
    /** 캔버스에 상대 이름표 */
    drawTag: function (ctx, x, y, text) {
      var t = text || (peer() ? peer().name : '친구');
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.font = 'bold 12px system-ui, "Malgun Gothic", sans-serif';
      var w = ctx.measureText(t).width + 10;
      ctx.fillStyle = 'rgba(8,145,178,0.85)';
      ctx.fillRect(Math.round(x - w / 2), Math.round(y - 16), Math.round(w), 15);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t, Math.round(x), Math.round(y - 8.5));
      ctx.restore();
    },
    toast: toast,
    leave: function () {
      leaveRoom();
    },
    openPanel: openPanel,
  };
  window.Duo = Duo;
})();
