// 빌드된 JS/CSS/HTML을 미리 압축(.br / .gz)해 두어, 30명이 동시에 접속해도 서버가 매번 압축하느라 느려지지 않게 함
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const dir = path.resolve('dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
let n = 0;
for (const f of walk(dir)) {
  if (!/\.(js|css|html|svg|json)$/.test(f) || f.endsWith('server.cjs')) continue;
  const buf = fs.readFileSync(f);
  if (buf.length < 1024) continue;
  fs.writeFileSync(f + '.gz', zlib.gzipSync(buf, { level: 9 }));
  fs.writeFileSync(f + '.br', zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }));
  n++;
}
console.log(`[precompress] ${n}개 파일 미리 압축 완료`);
