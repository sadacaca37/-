// 제미나이로 만든 그림(아틀라스 한 장 + 스테이지 배경 10장)을 불러와서 그려 주는 도우미.
// 그림이 다 불러와지기 전에는 Art.ready()가 false라서, 예전 코드 그림이 대신 나온다.
// 아틀라스 그림은 게임 화면의 2배 크기로 저장되어 있다 (캔버스도 2배 해상도로 그림).
// 캐릭터·적 그림은 모두 "오른쪽을 보는" 모습.

import { ATLAS, ATLAS_SIZE } from '../art/atlas';
import { Platform, Ladder } from '../types';

export const ATLAS_URL = new URL('../art/atlas.png', import.meta.url).href;
export { ATLAS_SIZE };

const BG_URLS = [
  new URL('../art/bg1.webp', import.meta.url).href,
  new URL('../art/bg2.webp', import.meta.url).href,
  new URL('../art/bg3.webp', import.meta.url).href,
  new URL('../art/bg4.webp', import.meta.url).href,
  new URL('../art/bg5.webp', import.meta.url).href,
  new URL('../art/bg6.webp', import.meta.url).href,
  new URL('../art/bg7.webp', import.meta.url).href,
  new URL('../art/bg8.webp', import.meta.url).href,
  new URL('../art/bg9.webp', import.meta.url).href,
  new URL('../art/bg10.webp', import.meta.url).href,
];

let atlasReady = false;
const atlas: HTMLImageElement | null = typeof Image !== 'undefined' ? new Image() : null;
if (atlas) {
  atlas.onload = () => {
    atlasReady = true;
  };
  atlas.src = ATLAS_URL;
}

// 배경은 처음 필요할 때 불러옴 (학교 컴퓨터에서 처음 열 때 가볍게)
const bgImages: (HTMLImageElement | null)[] = BG_URLS.map(() => null);
const bgReady: boolean[] = BG_URLS.map(() => false);
function bgIndex(stageId: number) {
  return (((stageId - 1) % BG_URLS.length) + BG_URLS.length) % BG_URLS.length;
}
function loadBg(i: number) {
  if (bgImages[i] || typeof Image === 'undefined') return;
  const im = new Image();
  im.onload = () => {
    bgReady[i] = true;
  };
  im.src = BG_URLS[i];
  bgImages[i] = im;
}
// 1스테이지 배경은 바로, 나머지는 조금 뒤에 천천히
loadBg(0);
if (typeof window !== 'undefined') {
  window.setTimeout(() => BG_URLS.forEach((_, i) => loadBg(i)), 1500);
}

// 스테이지별 발판·사다리 모양 (1~10, 그 뒤는 반복)
const LADDER_STYLE: Record<string, [string, string, string]> = {
  wood: ['#5A3416', '#A86A33', '#D59A55'],
  ice: ['#3E6E99', '#9FD3F2', '#DDF4FF'],
  steel: ['#374151', '#9CA3AF', '#E5E7EB'],
  lava: ['#3B1F1A', '#7A3E2A', '#C06A3E'],
  gold: ['#8A5A12', '#E8B93A', '#FFF1B0'],
};
const STAGE_LOOK: { tile: string; ladder: keyof typeof LADDER_STYLE }[] = [
  { tile: 'tile1', ladder: 'wood' }, // 당근 언덕 — 풀 덮인 흙
  { tile: 'tile2', ladder: 'wood' }, // 황혼의 체리 — 벚꽃 나무판
  { tile: 'tile3', ladder: 'wood' }, // 버섯 숲 — 이끼 통나무
  { tile: 'tile4', ladder: 'gold' }, // 황금 옥수수 — 짚단
  { tile: 'tile5', ladder: 'lava' }, // 화염 마왕성 — 용암 돌
  { tile: 'tile6', ladder: 'wood' }, // 황금 피라미드 — 사암 벽돌
  { tile: 'tile7', ladder: 'ice' }, // 수정 동굴 — 얼음
  { tile: 'tile8', ladder: 'wood' }, // 파인애플 유적 — 덩굴 돌
  { tile: 'tile9', ladder: 'steel' }, // 번개 성채 — 강철판
  { tile: 'tile10', ladder: 'gold' }, // 무지개 정상 — 구름
];

let layerCache: HTMLCanvasElement | null = null;
let layerKey = '';

export interface DrawOpts {
  flip?: boolean; // 왼쪽을 보게 (좌우 뒤집기)
  scale?: number;
  sx?: number; // 가로로만 늘이기/줄이기
  sy?: number;
  rot?: number;
  center?: boolean; // 기준점을 그림 한가운데로
  alpha?: number;
}

export const Art = {
  ready(): boolean {
    return atlasReady;
  },
  has(name: string): boolean {
    return atlasReady && name in ATLAS;
  },
  /** 화면 크기(게임 단위) */
  w(name: string): number {
    return (ATLAS[name]?.[2] ?? 2) / 2;
  },
  h(name: string): number {
    return (ATLAS[name]?.[3] ?? 2) / 2;
  },
  /** (x, y) = 기준점 위치. 기준점은 보통 그림 아래 가운데(발 밑). */
  draw(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, o: DrawOpts = {}): boolean {
    const r = ATLAS[name];
    if (!r || !atlas || !atlasReady) return false;
    const k = 0.5 * (o.scale ?? 1);
    const ax = o.center ? r[2] / 2 : r[4];
    const ay = o.center ? r[3] / 2 : r[5];
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((o.flip ? -1 : 1) * (o.sx ?? 1) * k, (o.sy ?? 1) * k);
    ctx.drawImage(atlas, r[0], r[1], r[2], r[3], -ax, -ay, r[2], r[3]);
    ctx.restore();
    return true;
  },

  /** 배경 + 사다리 + 발판을 미리 그려 둔 한 장 (스테이지가 바뀔 때만 새로 그림) */
  stageLayer(
    stageId: number,
    width: number,
    height: number,
    platforms: Platform[],
    ladders: Ladder[]
  ): HTMLCanvasElement | null {
    const i = bgIndex(stageId);
    loadBg(i);
    if (!atlasReady || !bgReady[i]) return null;
    const key = stageId + ':' + platforms.length + ':' + ladders.length;
    if (layerCache && layerKey === key) return layerCache;

    const c = layerCache || document.createElement('canvas');
    c.width = width * 2;
    c.height = height * 2;
    const g = c.getContext('2d');
    if (!g) return null;
    g.setTransform(2, 0, 0, 2, 0, 0);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(bgImages[i]!, 0, 0, width, height);
    // 앞쪽(발판·캐릭터)이 잘 보이게 배경을 살짝 어둡게
    g.fillStyle = 'rgba(0, 0, 10, 0.22)';
    g.fillRect(0, 0, width, height);

    const look = STAGE_LOOK[i];
    const [rail, railHi, rung] = LADDER_STYLE[look.ladder];
    // 사다리 (발판 뒤에)
    ladders.forEach((l) => {
      const h = l.yMax - l.yMin;
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(l.x + 1, l.yMin + 1, l.width, h);
      for (let y = l.yMin + 5; y < l.yMax; y += 9) {
        g.fillStyle = '#2A1A0E';
        g.fillRect(l.x + 2, y, l.width - 4, 3.5);
        g.fillStyle = rung;
        g.fillRect(l.x + 2, y, l.width - 4, 2.5);
      }
      for (const rx of [l.x, l.x + l.width - 4]) {
        g.fillStyle = rail;
        g.fillRect(rx, l.yMin, 4, h);
        g.fillStyle = railHi;
        g.fillRect(rx + 1, l.yMin, 1.5, h);
      }
    });

    // 발판: 제미나이 타일을 가로로 이어 붙임
    const t = ATLAS[look.tile];
    platforms.forEach((p) => {
      if (!t) return;
      if (look.tile === 'tile10') {
        // 구름: 뭉게뭉게 겹쳐 그리기
        const tw = t[2] / 2;
        const th = t[3] / 2;
        const step = tw * 0.62;
        for (let x = p.x - 4; x < p.x + p.width - tw * 0.4; x += step) {
          g.drawImage(atlas!, t[0], t[1], t[2], t[3], x, p.y - (th - p.height) / 2 - 1, tw, th);
        }
        return;
      }
      g.fillStyle = 'rgba(0,0,0,0.4)';
      g.fillRect(p.x + 2, p.y + p.height, p.width, 3);
      const tw = (t[2] / 2) * (p.height / (t[3] / 2));
      for (let x = p.x; x < p.x + p.width; x += tw) {
        const w = Math.min(tw, p.x + p.width - x);
        g.drawImage(atlas!, t[0], t[1], t[2] * (w / tw), t[3], x, p.y, w, p.height);
      }
      g.strokeStyle = 'rgba(10, 6, 20, 0.85)';
      g.lineWidth = 1;
      g.strokeRect(p.x + 0.5, p.y + 0.5, p.width - 1, p.height - 1);
      // 윗면을 밝게 — 어두운 배경에서도 발판이 잘 보이게
      g.fillStyle = 'rgba(255, 255, 255, 0.38)';
      g.fillRect(p.x + 1, p.y + 1, p.width - 2, 1.5);
    });

    layerCache = c;
    layerKey = key;
    return c;
  },
};
