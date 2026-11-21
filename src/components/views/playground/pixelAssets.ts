// Lightweight shared image cache & preloader for 16-bit pixel art playground games

const imgCache = new Map<string, HTMLImageElement>();

export function getPixelImg(src: string): HTMLImageElement {
  let img = imgCache.get(src);
  if (!img) {
    img = new Image();
    img.decoding = 'async';
    img.src = src;
    imgCache.set(src, img);
  }
  return img;
}

export function preloadPixelImgs(srcs: readonly string[]): void {
  for (const src of srcs) {
    getPixelImg(src);
  }
}

export function isImgReady(img: HTMLImageElement | undefined): img is HTMLImageElement {
  return Boolean(img && img.complete && img.naturalWidth > 0);
}
