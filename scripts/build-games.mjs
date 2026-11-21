#!/usr/bin/env node
/**
 * 펀펀 플레이 게임 빌드: games-src/<게임> 원본 → public/games/<게임> 완성본
 *
 *   node scripts/build-games.mjs                 모든 게임
 *   node scripts/build-games.mjs supermario      한 게임만 (여러 개도 됨)
 *
 * 카트라이더(kartrider)·과자 왕국 런(cookierun)은 빌드가 없는 게임이라
 * public/games/kartrider, public/games/cookierun 안의 파일을 바로 고친다.
 * 2인 대결 공용 파일은 public/games/_duo/duo.js (역시 바로 고침).
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = path.join(ROOT, 'games-src');
const OUT = path.join(ROOT, 'public', 'games');

/** 게임 목록: id = public/games 아래 폴더 이름 */
export const GAMES = {
  ponpoko: { name: '너구리', kind: 'vite' },
  bubblebobble: { name: '보글보글', kind: 'vite' },
  supermario: { name: '슈퍼마리오', kind: 'vite' },
  airplane: { name: '비행기 슈팅', kind: 'vite' },
  blockcraft: { name: '마크', kind: 'vite' },
  lastwar: { name: '라스트워', kind: 'lastwar' },
  kartrider: { name: '카트라이더', kind: 'static' },
  cookierun: { name: '과자 왕국 런', kind: 'static' },
};

const run = (cmd, args, cwd) => {
  const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npm' });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} 실패 (${cwd})`);
};

/** 타자팡 루트에 없는 패키지가 필요한 게임(마크의 three 등)만 그 폴더에서 따로 설치 */
function ensureDeps(dir) {
  const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const need = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  const req = createRequire(path.join(dir, 'package.json'));
  const missing = need.filter((n) => {
    try {
      req.resolve(n + '/package.json');
      return false;
    } catch {
      try {
        req.resolve(n);
        return false;
      } catch {
        return true;
      }
    }
  });
  if (missing.length) {
    console.log(`  · 패키지 설치: ${missing.join(', ')}`);
    run('npm', ['install', '--no-audit', '--no-fund', '--legacy-peer-deps'], dir);
  }
}

function build(id) {
  const g = GAMES[id];
  if (!g) throw new Error(`없는 게임: ${id} (가능: ${Object.keys(GAMES).join(', ')})`);
  const dir = path.join(SRC, id);
  console.log(`\n▶ ${g.name} (${id})`);
  if (g.kind === 'static') {
    console.log(`  빌드 없음 — public/games/${id} 파일을 바로 고치면 됩니다.`);
    return;
  }
  if (g.kind === 'lastwar') {
    fs.mkdirSync(path.join(dir, 'outputs'), { recursive: true });
    run(process.execPath, ['work/build.js'], dir);
    fs.mkdirSync(path.join(OUT, id), { recursive: true });
    fs.copyFileSync(path.join(dir, 'outputs', 'bridge-assault-3d.html'), path.join(OUT, id, 'index.html'));
    console.log(`  → public/games/${id}/index.html`);
    return;
  }
  ensureDeps(dir);
  const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  run(process.execPath, [vite, 'build', '--base=./', '--outDir', path.join(OUT, id), '--emptyOutDir', '--logLevel', 'warn'], dir);
  console.log(`  → public/games/${id}/`);
}

const ids = process.argv.slice(2);
for (const id of ids.length ? ids : Object.keys(GAMES)) build(id);
console.log('\n완료. 확인: npm run dev → http://localhost:3000 → 펀펀 플레이');
