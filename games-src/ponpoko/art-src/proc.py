"""제미나이 그림 다듬기 도구 (build_art.py가 불러 씀).

  python3 proc.py assemble <이름> <조각파일...>     조각(base64) 이어 붙여 raw/<이름>.png 로 저장
  python3 proc.py key <이름> <green|magenta>          배경색 지우기 → raw/<이름>_key.png
  python3 proc.py split <이름> <행수>                 투명 아닌 덩어리별로 자르기 → raw/<이름>_NN.png
"""
import base64
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

import os
RAW = Path(os.environ.get('PONPOKO_ART_TMP', '/tmp/ponpoko-art'))


def assemble(name, files):
    parts = []
    for f in files:
        t = Path(f).read_text(errors='ignore')
        m = re.search(r'B64START(\d+)of(\d+):([A-Za-z0-9+/=]+)B64END', t)
        if not m:
            raise SystemExit(f'조각 표시 없음: {f}')
        parts.append((int(m.group(1)), int(m.group(2)), m.group(3)))
    parts.sort()
    total = parts[0][1]
    idx = [p[0] for p in parts]
    if idx != list(range(total)):
        raise SystemExit(f'조각이 모자람: {idx} / {total}')
    data = base64.b64decode(''.join(p[2] for p in parts))
    head = data[:16]
    ext = 'png' if head.startswith(b'\x89PNG') else 'webp' if head[8:12] == b'WEBP' else 'jpg'
    out = RAW / f'{name}.{ext}'
    out.write_bytes(data)
    im = Image.open(out)
    print(out, im.size, im.mode, len(data))


KEYS = {
    'green': np.array([0, 255, 0], float),
    'magenta': np.array([255, 0, 255], float),
    'blue': np.array([0, 0, 255], float),
}


def key(name, which, inner=70.0, outer=150.0):
    src = next(RAW.glob(f'{name}.*'))
    im = np.asarray(Image.open(src).convert('RGB')).astype(float)
    k = KEYS[which]
    # 배경색과 얼마나 다른지: 거리 + 색상 성분(초록이면 G가 R,B보다 얼마나 큰지)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    if which == 'green':
        dom = g - np.maximum(r, b)
    elif which == 'blue':
        dom = b - np.maximum(r, g)
    else:
        dom = np.minimum(r, b) - g
    dist = np.sqrt(((im - k) ** 2).sum(-1))
    a = np.clip((dist - inner) / (outer - inner), 0, 1)
    a = np.where(dom > 150, 0, a)
    # 가장자리 번짐 빼기 (despill)
    out = im.copy()
    if which == 'green':
        lim = np.maximum(r, b)
        out[..., 1] = np.where(g > lim, lim + (g - lim) * 0.15, g)
    elif which == 'blue':
        lim = np.maximum(r, g)
        out[..., 2] = np.where((b > lim) & (a < 0.99), lim + (b - lim) * 0.3, b)
    else:
        lim = g
        cap = np.maximum(g, (r + b) / 2 * 0.0 + g)
        mx = np.minimum(r, b)
        excess = np.clip(mx - g, 0, None)
        out[..., 0] = r - excess * (1 - a) * 0.9
        out[..., 2] = b - excess * (1 - a) * 0.9
    rgba = np.dstack([np.clip(out, 0, 255), a * 255]).astype(np.uint8)
    # 아주 옅은 점은 없앰
    rgba[..., 3][rgba[..., 3] < 24] = 0
    dst = RAW / f'{name}_key.png'
    Image.fromarray(rgba, 'RGBA').save(dst)
    print(dst, (a > 0.5).mean())


def segments(mask1d, min_gap, min_len):
    on = mask1d > 0
    segs, start, gap = [], None, 0
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            gap = 0
            end = i
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                segs.append((start, end + 1))
                start, gap = None, 0
    if start is not None:
        segs.append((start, end + 1))
    return [s for s in segs if s[1] - s[0] >= min_len]


def split(name, rows=1, min_gap=6):
    im = Image.open(RAW / f'{name}_key.png')
    a = np.asarray(im)[..., 3] > 40
    H, W = a.shape
    row_segs = segments(a.sum(1), min_gap, 20) if rows > 1 else [(0, H)]
    n = 0
    for (y0, y1) in row_segs:
        cols = segments(a[y0:y1].sum(0), min_gap, 12)
        for (x0, x1) in cols:
            sub = a[y0:y1, x0:x1]
            ys = np.where(sub.any(1))[0]
            box = (x0, y0 + ys[0], x1, y0 + ys[-1] + 1)
            crop = im.crop(box)
            dst = RAW / f'{name}_{n:02d}.png'
            crop.save(dst)
            print(dst.name, box, crop.size)
            n += 1


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'assemble':
        assemble(sys.argv[2], sys.argv[3:])
    elif cmd == 'key':
        key(sys.argv[2], sys.argv[3], *(float(x) for x in sys.argv[4:6]))
    elif cmd == 'split':
        split(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1, int(sys.argv[4]) if len(sys.argv) > 4 else 6)


def blobs(name, grow=6, min_area=400):
    """덩어리(가까운 조각끼리 묶음)마다 잘라 raw/<이름>_bNN.png 로 저장. 위→아래, 왼→오른 순서."""
    from scipy import ndimage
    im = Image.open(RAW / f'{name}_key.png')
    arr = np.asarray(im).copy()
    a = arr[..., 3] > 40
    grown = ndimage.binary_dilation(a, iterations=grow)
    lab, n = ndimage.label(grown)
    objs = ndimage.find_objects(lab)
    items = []
    for i, sl in enumerate(objs):
        m = (lab[sl] == i + 1) & a[sl]
        area = int(m.sum())
        if area < min_area:
            continue
        items.append((sl, i + 1, area))
    # 줄 나누기: 세로 가운데가 비슷하면 같은 줄
    items.sort(key=lambda t: (t[0][0].start + t[0][0].stop) / 2)
    rows = []
    for it in items:
        cy = (it[0][0].start + it[0][0].stop) / 2
        if rows and abs(cy - rows[-1][0]) < 0.5 * (it[0][0].stop - it[0][0].start):
            rows[-1][1].append(it)
        else:
            rows.append([cy, [it]])
    k = 0
    for _, row in rows:
        for sl, lid, area in sorted(row, key=lambda t: t[0][1].start):
            sub = arr[sl].copy()
            keep = lab[sl] == lid
            sub[..., 3] = np.where(keep, sub[..., 3], 0)
            ys, xs = np.where(sub[..., 3] > 40)
            sub = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
            dst = RAW / f'{name}_b{k:02d}.png'
            Image.fromarray(sub, 'RGBA').save(dst)
            print(dst.name, 'x', sl[1].start, 'y', sl[0].start, 'size', sub.shape[1], sub.shape[0], 'area', area)
            k += 1


if __name__ == '__main__' and sys.argv[1] == 'blobs':
    blobs(sys.argv[2], *(int(x) for x in sys.argv[3:5]))
