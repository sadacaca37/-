#!/usr/bin/env node
/**
 * 광선검 결투 빌드: games-src/lightsaber/src 의 파일들을 한 파일로 합쳐
 * public/games/lightsaber/index.html 을 만든다.   (node games-src/lightsaber/build.mjs)
 *
 * 2인 대결(각자 컴퓨터)은 모아팡 Firebase 의 taja/duo/lightsaber/<방번호> 자리를 쓴다 (netfb.js).
 * 두 컴퓨터는 Firebase 로 만나고, 싸움 데이터는 둘 사이에 직접(WebRTC) 오간다. 직접 연결이 안 되면 Firebase 로 중계.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(DIR, 'src');
const OUT = path.resolve(DIR, '..', '..', 'public', 'games', 'lightsaber', 'index.html');
const FILES = ['core.js', 'audio.js', 'world.js', 'fighter.js', 'fx.js', 'env.js', 'netfb.js', 'game.js'];

const js = "window.LS_ONLINE = 'fb';\n" + FILES.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
const html = fs
  .readFileSync(path.join(SRC, 'shell.html'), 'utf8')
  .replace('<script>/*__LIB__*/</script>\n', '')
  .replace('/*__JS__*/', () => js)
  .replace('<title>Lightsaber Duel — Stick Figures</title>', '<title>광선검 결투 — 타자팡 펀펀 플레이</title>');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`광선검 결투 → ${path.relative(path.resolve(DIR, '..', '..'), OUT)} (${(html.length / 1024).toFixed(0)} KB)`);
