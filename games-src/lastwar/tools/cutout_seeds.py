# 서로 닿은 캐릭터를 씨앗 점에서 물을 채우듯 나눠 자르기
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage
from skimage.segmentation import watershed
src = sys.argv[1]; groups = [g.split(':') for g in sys.argv[2].split('|')]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32); r, g, b = im[..., 0], im[..., 1], im[..., 2]
m = np.minimum(r, b) - g
border = np.concatenate([m[:6].ravel(), m[-6:].ravel(), m[:, :6].ravel(), m[:, -6:].ravel()]); bgm = float(np.median(border))
hi, lo = bgm * .86, bgm * .4; alpha = np.clip((hi - m) / (hi - lo), 0, 1)
excess = np.clip(np.minimum(r, b) - g, 0, None); spill = excess * np.clip(0.75 + 0.6 * (1 - alpha), 0, 1)
out = im.copy(); out[..., 0] -= spill; out[..., 2] -= spill
alpha = ndimage.grey_erosion(alpha, size=(3, 3))
solid = ndimage.binary_opening(alpha > .5, iterations=1)
markers = np.zeros(solid.shape, np.int32)
for k, (name, pts) in enumerate(groups, 1):
    for p in pts.split(';'):
        x, y = map(int, p.split(',')); markers[max(0,y-3):y+4, max(0,x-3):x+4] = k
dist = ndimage.distance_transform_edt(solid)
seg = watershed(-dist, markers, mask=solid)
rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
for k, (name, _) in enumerate(groups, 1):
    mask = ndimage.binary_dilation(seg == k, iterations=1) & (alpha > 0)
    lab, n = ndimage.label(mask); sizes = ndimage.sum(mask, lab, range(1, n + 1)); mask = lab == (np.argmax(sizes) + 1)
    ys, xs = np.where(mask); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    piece = rgba[y0:y1, x0:x1].copy(); piece[..., 3] = (piece[..., 3] * mask[y0:y1, x0:x1]).astype(np.uint8)
    pad = 4; canvas = np.zeros((piece.shape[0] + 8, piece.shape[1] + 8, 4), np.uint8); canvas[pad:-pad, pad:-pad] = piece
    Image.fromarray(canvas).save(os.path.join(os.environ.get('OUT','work/art'),'lastwar_'+name+'.png')); print(name, canvas.shape[1], 'x', canvas.shape[0])
