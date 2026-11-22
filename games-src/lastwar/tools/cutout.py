# 제미나이 그림(자홍 배경)에서 배경 지우기 + 캐릭터별로 잘라 work/art/lastwar_<이름>.png로 저장
# python3 tools/cutout.py <입력.png> <이름1,이름2,...> [최소면적비]  (Pillow·numpy·scipy 필요)
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage
src, names = sys.argv[1], sys.argv[2].split(',')
minfrac = float(sys.argv[3]) if len(sys.argv) > 3 else 0.08
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
m = np.minimum(r, b) - g                      # 자홍일수록 큼 (순수 자홍 = 255)
border = np.concatenate([m[:6].ravel(), m[-6:].ravel(), m[:, :6].ravel(), m[:, -6:].ravel()])
bgm = float(np.median(border))                # 이 그림의 배경 자홍 정도
hi, lo = bgm * .86, bgm * .4
alpha = np.clip((hi - m) / (hi - lo), 0, 1)   # 배경에 가까울수록 투명
# 가장자리 자홍 번짐 줄이기
# 자홍 반사광(보라 기운) 빼기: 빨강·파랑이 초록보다 함께 높은 만큼 줄임
excess = np.clip(np.minimum(r, b) - g, 0, None)
spill = excess * np.clip(0.75 + 0.6 * (1 - alpha), 0, 1)
out = im.copy(); out[..., 0] -= spill; out[..., 2] -= spill
alpha = ndimage.grey_erosion(alpha, size=(3, 3))   # 가장자리 1픽셀 깎기(분홍 테두리 제거)
solid = alpha > 0.5
solid = ndimage.binary_opening(solid, iterations=1)
lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=6))
objs = ndimage.find_objects(lab)
areas = ndimage.sum(solid, lab, range(1, n + 1))
keep = [i for i in range(n) if areas[i] >= minfrac * areas.max()]
keep.sort(key=lambda i: objs[i][1].start)
if len(keep) != len(names):
    print('WARNING: found', len(keep), 'characters, expected', len(names), [int(areas[i]) for i in keep])
rgba = np.dstack([np.clip(out, 0, 255), alpha * 255]).astype(np.uint8)
for name, i in zip(names, keep):
    sl = objs[i]; mask = (lab[sl] == i + 1)
    piece = rgba[sl].copy(); piece[..., 3] = (piece[..., 3] * mask).astype(np.uint8)
    pad = 4; h, w = piece.shape[:2]
    canvas = np.zeros((h + pad * 2, w + pad * 2, 4), np.uint8); canvas[pad:pad + h, pad:pad + w] = piece
    Image.fromarray(canvas).save(os.path.join(os.environ.get('OUT','work/art'),'lastwar_'+name+'.png'))
    print(name, canvas.shape[1], 'x', canvas.shape[0])
