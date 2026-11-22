// 제미나이로 만든 그림(아틀라스 한 장 + 배경 7장)을 불러와서 그려 주는 도우미.
// 그림이 다 불러와지기 전에는 Art.ready()가 false라서, 예전 코드 그림이 대신 나온다.
// 캐릭터·적 그림은 모두 "오른쪽을 보는" 모습으로 저장되어 있다.

import { ATLAS } from './atlas';

export const ATLAS_URL = new URL('../art/atlas.png', import.meta.url).href;

const BG_URLS: Record<string, string> = {
  grassland: new URL('../art/bg_grassland.webp', import.meta.url).href,
  underground: new URL('../art/bg_underground.webp', import.meta.url).href,
  sky: new URL('../art/bg_sky.webp', import.meta.url).href,
  canyon: new URL('../art/bg_canyon.webp', import.meta.url).href,
  mountain: new URL('../art/bg_mountain.webp', import.meta.url).href,
  lava: new URL('../art/bg_lava.webp', import.meta.url).href,
  boss_castle: new URL('../art/bg_castle.webp', import.meta.url).href,
};

let atlasReady = false;
const atlas = typeof Image !== 'undefined' ? new Image() : null;
if (atlas) {
  atlas.onload = () => {
    atlasReady = true;
  };
  atlas.src = ATLAS_URL;
}

const bgImages: Record<string, HTMLImageElement> = {};
const bgReady: Record<string, boolean> = {};
if (typeof Image !== 'undefined') {
  for (const [theme, url] of Object.entries(BG_URLS)) {
    const im = new Image();
    im.onload = () => {
      bgReady[theme] = true;
    };
    im.src = url;
    bgImages[theme] = im;
  }
}

// 색을 입힌 그림(불꽃 파워업 등)을 한 번만 만들어 두고 다시 씀
const tintCache = new Map<string, HTMLCanvasElement>();
function tinted(name: string, color: string): HTMLCanvasElement | null {
  const key = name + '|' + color;
  const hit = tintCache.get(key);
  if (hit) return hit;
  const r = ATLAS[name];
  if (!r || !atlas) return null;
  const c = document.createElement('canvas');
  c.width = r[2];
  c.height = r[3];
  const cx = c.getContext('2d');
  if (!cx) return null;
  cx.drawImage(atlas, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  cx.globalCompositeOperation = 'source-atop';
  cx.fillStyle = color;
  cx.fillRect(0, 0, r[2], r[3]);
  tintCache.set(key, c);
  return c;
}

// 줄였다 늘였다 할 때: 많이 줄이면 부드럽게, 크게 키우면 픽셀이 또렷하게
function smoothFor(ctx: CanvasRenderingContext2D, scale: number) {
  ctx.imageSmoothingEnabled = scale < 0.98;
  if (ctx.imageSmoothingEnabled) ctx.imageSmoothingQuality = 'high';
}

export const Art = {
  ready(): boolean {
    return atlasReady;
  },
  has(name: string): boolean {
    return atlasReady && name in ATLAS;
  },
  w(name: string): number {
    return ATLAS[name]?.[2] ?? 1;
  },
  h(name: string): number {
    return ATLAS[name]?.[3] ?? 1;
  },

  /** 그림 전체를 (x, y, w, h) 칸에 그린다. flip이면 좌우를 뒤집는다. */
  rect(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number, flip = false, tint?: string) {
    const r = ATLAS[name];
    if (!r || !atlas || !atlasReady) return;
    ctx.save();
    smoothFor(ctx, Math.min(w / r[2], h / r[3]));
    if (flip) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }
    const src = tint ? tinted(name, tint) : null;
    if (src) ctx.drawImage(src, 0, 0, r[2], r[3], x, y, w, h);
    else ctx.drawImage(atlas, r[0], r[1], r[2], r[3], x, y, w, h);
    ctx.restore();
  },

  /** 아래 가운데가 (cx, bottom)에 오도록, s배 크기로 그린다. 그린 너비·높이를 돌려준다. */
  foot(ctx: CanvasRenderingContext2D, name: string, cx: number, bottom: number, s: number, flip = false, tint?: string) {
    const w = this.w(name) * s;
    const h = this.h(name) * s;
    this.rect(ctx, name, cx - w / 2, bottom - h, w, h, flip, tint);
    return { w, h };
  },

  /** 가운데가 (cx, cy)에 오도록 너비 w에 맞춰 그린다. */
  center(ctx: CanvasRenderingContext2D, name: string, cx: number, cy: number, w: number, flip = false) {
    const h = (w * this.h(name)) / this.w(name);
    this.rect(ctx, name, cx - w / 2, cy - h / 2, w, h, flip);
    return h;
  },

  /** 그림의 일부분(비율 0~1)만 잘라서 (dx, dy, dw, dh)에 그린다. */
  part(
    ctx: CanvasRenderingContext2D,
    name: string,
    fx0: number,
    fy0: number,
    fx1: number,
    fy1: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) {
    const r = ATLAS[name];
    if (!r || !atlas || !atlasReady) return;
    const sx = r[0] + r[2] * fx0;
    const sy = r[1] + r[3] * fy0;
    const sw = r[2] * (fx1 - fx0);
    const sh = r[3] * (fy1 - fy0);
    ctx.save();
    smoothFor(ctx, Math.min(dw / sw, dh / sh));
    ctx.drawImage(atlas, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  },

  /** 가로로 긴 판(구름·나무판): 양쪽 끝은 그대로, 가운데만 늘린다. */
  sliced(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w: number, h: number, cap = 0.22) {
    const r = ATLAS[name];
    if (!r) return;
    const capW = Math.min(w / 2, h * (r[2] * cap) / r[3]);
    this.part(ctx, name, 0, 0, cap, 1, x, y, capW, h);
    this.part(ctx, name, cap, 0, 1 - cap, 1, x + capW, y, w - capW * 2, h);
    this.part(ctx, name, 1 - cap, 0, 1, 1, x + w - capW, y, capW, h);
  },

  /** 스테이지 배경 그림 (불러오기 전이면 null) */
  bg(theme: string): HTMLImageElement | null {
    const key = theme in BG_URLS ? theme : 'grassland';
    return bgReady[key] ? bgImages[key] : null;
  },
};
