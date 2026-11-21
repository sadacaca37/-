// 2인 대결: 두 사람이 각자 컴퓨터에서 방 번호로 들어와 같은 전장을 동시에 (공용 ../_duo/duo.js)
// build.js가 게임 스크립트 뒤에 붙임 → battle, scene, showStage, PLAYER_Z 같은 게임 변수를 그대로 씀
// 한 판 = 한 스테이지. 스테이지를 확보하면 완주, 병력이 0이 되면 탈락. 처치 수가 점수.
(function () {
  if (!window.Duo) return;
  var startBtn = $('#start'), retryBtn = $('#retry');
  var origStart = startBtn.onclick, origRetry = retryBtn.onclick;
  var nextIndex = function () {
    return battle.mode === 'stage_clear' ? battle.stageIndex + 1 : battle.mode === 'won' ? 0 : battle.stageIndex;
  };
  startBtn.onclick = function () {
    if (Duo.requestStart({ stage: nextIndex() })) return;
    origStart.call(startBtn);
  };
  retryBtn.onclick = function () {
    if (Duo.requestStart({ stage: battle.stageIndex })) return;
    origRetry.call(retryBtn);
  };
  var kills = function () {
    return (battle.totalKills || 0) + (battle.kills || 0);
  };
  Duo.init({
    game: 'lastwar',
    title: '다리 돌파 작전',
    mode: 'score',
    scoreLabel: '명 처치',
    hudStyle: 'top:auto;bottom:8px',
    onStart: function (s) {
      var idx = Math.max(0, Math.min(4, (s && s.stage) | 0));
      if (!(battle.mode === 'stage_clear' && idx === battle.stageIndex + 1)) showStage(idx);
      origStart.call(startBtn);
    },
  });

  // 친구 부대 표시: 파란 반투명 원 + 이름표 (내 길과 같은 자리에 겹쳐 보임)
  var ghost = new THREE.Group();
  var ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.12, 32), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35, depthWrite: false }));
  ghost.add(ring);
  var canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  var tex = new THREE.CanvasTexture(canvas);
  var tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  tag.scale.set(4.2, 0.8, 1);
  tag.position.y = 2.2;
  tag.renderOrder = 999;
  ghost.add(tag);
  ghost.visible = false;
  scene.add(ghost);
  var lastText = '';
  function setTag(text) {
    if (text === lastText) return;
    lastText = text;
    var x = canvas.getContext('2d');
    x.clearRect(0, 0, 512, 96);
    x.font = 'bold 44px system-ui,"Malgun Gothic",sans-serif';
    var w = Math.min(500, x.measureText(text).width + 36);
    x.fillStyle = 'rgba(8,145,178,.92)';
    x.fillRect(256 - w / 2, 10, w, 76);
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(text, 256, 50);
    tex.needsUpdate = true;
  }

  var lastMode = '';
  (function loop() {
    requestAnimationFrame(loop);
    var m = battle.mode;
    if (Duo.playing && m !== lastMode) {
      var k = kills();
      if (m === 'stage_clear' || m === 'won') Duo.finish({ cleared: true, score: k, label: k + '명 처치 · 병력 ' + battle.n });
      else if (m === 'lost') Duo.finish({ cleared: false, score: k, label: k + '명 처치' });
    }
    lastMode = m;
    if (Duo.playing && m === 'playing') {
      var kk = kills();
      Duo.send({ x: battle.x, n: battle.n, stage: battle.stageIndex, score: kk, label: kk + '명 · 병력 ' + battle.n });
    }
    var ps = Duo.inRoom ? Duo.peerState() : null;
    if (ps && ps.stage === battle.stageIndex && m === 'playing') {
      ghost.visible = true;
      ghost.position.set(ps.x, 0.06, PLAYER_Z - 0.6);
      var r = Math.max(0.8, Math.min(3.2, Math.sqrt(ps.n || 1) * 0.45));
      ring.scale.set(r, 1, r * 0.8);
      setTag('👥 ' + Duo.peerName + ' · 병력 ' + (ps.n | 0));
    } else ghost.visible = false;
  })();
})();
