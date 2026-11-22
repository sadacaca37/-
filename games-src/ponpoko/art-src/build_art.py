"""제미나이 그림 → 너구리 게임용 그림 파일 만들기.

결과:
  games-src/ponpoko/src/art/atlas.png   캐릭터·적·아이템·발판 그림을 한 장에 모은 것
  games-src/ponpoko/src/art/atlas.ts    각 그림의 위치(x, y, 너비, 높이, 기준점 x, 기준점 y)
  games-src/ponpoko/src/art/bg1.webp ~ bg10.webp   스테이지 배경 (1120×840)

실행: python3 games-src/ponpoko/art-src/build_art.py   (numpy, pillow, opencv-python, scipy 필요)
원본: art-src/gemini/ — 2026-11-22 제미나이(gemini.google.com)로 그린 그림
  player.webp(너구리 동작 8개, 초록 배경) · enemies.webp(적 6, 자홍 배경) · fruits.png(과일 10, 파란 배경)
  objects.png(항아리·장화·망치·하트·가시, 초록 배경) · tiles.png(발판 타일 10, 자홍 배경) · bg1~10.webp(스테이지 배경)

아틀라스 그림은 게임 화면 크기의 2배로 저장한다 (캔버스를 2배 해상도로 그리기 때문).
"""
import colorsys
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
GEMINI = HERE / 'gemini'  # 제미나이에서 받은 원본 그림
OUT = HERE.parent / 'src' / 'art'
OUT.mkdir(parents=True, exist_ok=True)

# 1) 원본 → 배경색 지우기 → 하나씩 자르기 (임시 폴더)
import os
import shutil
import sys
RAW = Path(os.environ.setdefault('PONPOKO_ART_TMP', '/tmp/ponpoko-art'))
shutil.rmtree(RAW, ignore_errors=True)
RAW.mkdir(parents=True)
for f in GEMINI.iterdir():
    shutil.copy(f, RAW / f.name)
sys.path.insert(0, str(HERE))
import proc  # noqa: E402
for sheet, bgc, grow in [('player', 'green', 3), ('enemies', 'magenta', 3), ('fruits', 'blue', 2),
                         ('objects', 'green', 2), ('tiles', 'magenta', 2)]:
    proc.key(sheet, bgc)
    proc.blobs(sheet, grow)


def load(name):
    return Image.open(RAW / f'{name}.png').convert('RGBA')


def trim(im):
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 20)
    return im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))


def resize(im, w=None, h=None, scale=None):
    if scale is None:
        scale = (h / im.height) if h else (w / im.width)
    nw, nh = max(1, round(im.width * scale)), max(1, round(im.height * scale))
    # 알파를 미리 곱해서 줄여야 가장자리에 배경색 테두리가 안 생김
    arr = np.asarray(im).astype(np.float32) / 255.0
    rgb, a = arr[..., :3] * arr[..., 3:4], arr[..., 3:4]
    pre = np.concatenate([rgb, a], -1)
    small = cv2.resize(pre, (nw, nh), interpolation=cv2.INTER_AREA)
    a2 = small[..., 3:4]
    rgb2 = np.where(a2 > 1e-4, small[..., :3] / np.maximum(a2, 1e-4), 0)
    out = np.concatenate([np.clip(rgb2, 0, 1), np.clip(a2, 0, 1)], -1)
    return Image.fromarray((out * 255 + 0.5).astype(np.uint8), 'RGBA')


def fit(im, box):
    s = min(box / im.width, box / im.height)
    return resize(im, scale=s)


def recolor_vest_blue(im):
    """빨간 조끼 → 파란 조끼 (2P 너구리)."""
    arr = np.asarray(im).astype(np.float32) / 255.0
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    mx, mn = arr[..., :3].max(-1), arr[..., :3].min(-1)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-4), 0)
    hsv = np.zeros(arr.shape[:2] + (3,), np.float32)
    rgb8 = (arr[..., :3] * 255).astype(np.uint8)
    hsv = cv2.cvtColor(rgb8, cv2.COLOR_RGB2HSV_FULL).astype(np.float32)  # H 0~255
    h = hsv[..., 0] * 360 / 255
    red = ((h < 14) | (h > 340)) & (sat > 0.45) & (mx > 0.25) & (a > 0.1)
    hsv[..., 0] = np.where(red, 212 * 255 / 360, hsv[..., 0])
    hsv[..., 1] = np.where(red, np.minimum(255, hsv[..., 1] * 0.95), hsv[..., 1])
    hsv[..., 2] = np.where(red, np.minimum(255, hsv[..., 2] * 1.08 + 10), hsv[..., 2])
    rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB_FULL)
    out = np.dstack([rgb, (a * 255).astype(np.uint8)])
    return Image.fromarray(out, 'RGBA')


def head_center_x(im):
    a = np.asarray(im)[..., 3] > 60
    top = a[: max(1, int(a.shape[0] * 0.42))]
    ys, xs = np.where(top)
    return float(xs.mean()) if len(xs) else im.width / 2


sprites = {}  # 이름 → (그림, 기준점 x, 기준점 y)

# ---------------- 너구리 (게임 크기 2배: 서 있을 때 키 62px = 화면 31) ----------------
P = {'idle': 'player_b04', 'run0': 'player_b05', 'run1': 'player_b06', 'run2': 'player_b07',
     'run3': 'player_b08', 'jump': 'player_b00', 'climb': 'player_b01'}
s_player = 68 / load(P['idle']).height
for key, src in P.items():
    im = resize(trim(load(src)), scale=s_player)
    ax = head_center_x(im)
    if key == 'climb':
        ax = im.width / 2 + 6  # 뒷모습: 꼬리 쪽을 빼고 몸 가운데
    sprites[f'p1_{key}'] = (im, ax, im.height)
    sprites[f'p2_{key}'] = (recolor_vest_blue(im), ax, im.height)

# ---------------- 적 (2배 크기) ----------------
E = {'mouse': ('enemies_b00', 'w', 56), 'snake': ('enemies_b01', 'w', 56), 'bat': ('enemies_b02', 'w', 70),
     'frog': ('enemies_b03', 'w', 52), 'ghost': ('enemies_b04', 'w', 50), 'flame': ('enemies_b05', 'h', 56)}
for key, (src, mode, size) in E.items():
    im = trim(load(src))
    im = resize(im, w=size) if mode == 'w' else resize(im, h=size)
    sprites[f'en_{key}'] = (im, im.width / 2, im.height)

# ---------------- 과일 (가장 긴 쪽 44px = 화면 22) ----------------
F = ['carrot', 'cherry', 'mushroom', 'corn', 'watermelon', 'strawberry', 'banana', 'melon', 'grape', 'pineapple']
for i, key in enumerate(F):
    im = load(f'fruits_b{i:02d}')
    if key == 'pineapple':  # 제미나이 표시(반짝이) 조각 지우기
        arr = np.asarray(im).copy()
        h = arr.shape[0]
        r, g, b = arr[..., 0].astype(int), arr[..., 1].astype(int), arr[..., 2].astype(int)
        blu = (b > r + 10) & (b > g)
        arr[int(h * 0.75):, :, 3] = np.where(blu[int(h * 0.75):], 0, arr[int(h * 0.75):, :, 3])
        im = Image.fromarray(arr, 'RGBA')
    im = fit(trim(im), 44)
    sprites[f'it_{key}'] = (im, im.width / 2, im.height)

# ---------------- 물건 ----------------
O = {'jar': ('objects_b00', 'h', 54), 'boots': ('objects_b01', 'box', 44), 'hammer': ('objects_b02', 'h', 54),
     'heart': ('objects_b03', 'box', 42), 'spike': ('objects_b04', 'h', 36)}
for key, (src, mode, size) in O.items():
    im = trim(load(src))
    im = resize(im, h=size) if mode == 'h' else fit(im, size)
    sprites[f'ob_{key}'] = (im, im.width / 2, im.height)

# ---------------- 발판 타일 (높이 24px = 화면 12) ----------------
for i in range(10):
    im = trim(load(f'tiles_b{i:02d}'))
    w, h = im.size
    if i == 9:  # 구름: 통째로
        t = resize(im, h=30)
    else:
        l, r = (0.30, 0.94) if i == 2 else (0.07, 0.93)
        top = 0.06
        im = im.crop((int(w * l), int(h * top), int(w * r), int(h * 0.94)))
        arr = np.asarray(im).copy()
        arr[..., 3] = 255  # 타일 안쪽은 꽉 차게
        t = resize(Image.fromarray(arr, 'RGBA'), h=24)
    sprites[f'tile{i + 1}'] = (t, 0, t.height)

# ---------------- 아틀라스로 모으기 (줄 단위로 채우기) ----------------
W = 512
items = sorted(sprites.items(), key=lambda kv: -kv[1][0].height)
x = y = 0
row_h = 0
rects = {}
pad = 2
for name, (im, ax, ay) in items:
    if x + im.width + pad > W:
        x = 0
        y += row_h + pad
        row_h = 0
    rects[name] = [x, y, im.width, im.height, round(ax, 1), round(ay, 1)]
    x += im.width + pad
    row_h = max(row_h, im.height)
H = y + row_h
atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for name, (im, ax, ay) in sprites.items():
    r = rects[name]
    atlas.paste(im, (r[0], r[1]))
atlas.save(OUT / 'atlas.png', optimize=True)

lines = ['// 자동으로 만든 파일 (tools/build_art.py) — 손으로 고치지 않음',
         '// [x, y, 너비, 높이, 기준점x, 기준점y] — 아틀라스 그림은 게임 화면의 2배 크기',
         'export const ATLAS: Record<string, [number, number, number, number, number, number]> = {']
for name in sorted(rects):
    lines.append(f"  {name}: {json.dumps(rects[name])},")
lines.append('};')
lines.append(f'export const ATLAS_SIZE = {{ w: {W}, h: {H} }};')
(OUT / 'atlas.ts').write_text('\n'.join(lines) + '\n')
print('atlas', W, H, (OUT / 'atlas.png').stat().st_size)

# ---------------- 배경 10장: 제미나이 반짝이 표시 지우기 ----------------
for i in range(1, 11):
    im = np.asarray(Image.open(RAW / f'bg{i}.webp').convert('RGB'))
    # 왼쪽 옆 무늬를 가져와 덮고(무늬 유지), 가장자리는 부드럽게 섞기
    cx, cy, R, dx = 1010, 727, 36, 84
    fixed = im.copy().astype(np.float32)
    yy, xx = np.mgrid[cy - R - 8:cy + R + 8, cx - R - 8:cx + R + 8]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    w = np.clip((R + 8 - d) / 12, 0, 1)[..., None]
    patch = im[cy - R - 8:cy + R + 8, cx - R - 8 - dx:cx + R + 8 - dx].astype(np.float32)
    region = fixed[cy - R - 8:cy + R + 8, cx - R - 8:cx + R + 8]
    fixed[cy - R - 8:cy + R + 8, cx - R - 8:cx + R + 8] = region * (1 - w) + patch * w
    fixed = fixed.astype(np.uint8)
    Image.fromarray(fixed).save(OUT / f'bg{i}.webp', quality=84, method=6)
    print(f'bg{i}', (OUT / f'bg{i}.webp').stat().st_size)
