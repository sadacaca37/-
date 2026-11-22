# 잘라 낸 그림들을 한 장(아틀라스)으로 묶고 sprite-atlas.js를 만든다.
# python3 atlas.py <그림 폴더> <출력 sprite-atlas.js>
import sys, os, json, base64, io, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
HEIGHT = {'ally': 210, 'boss': 520}            # 그림 높이(픽셀): 아군·몬스터 210, 보스 520
RIM = {'soldier': (200, 40, 40), 'zombie': (120, 200, 70), 'fantasy': (230, 120, 40), 'robot': (70, 190, 230), 'boss': (230, 50, 40)}
items = []
for f in sorted(os.listdir(src)):
    if not f.endswith('.png'): continue
    name = f[:-4].replace('lastwar_', '')
    im = Image.open(os.path.join(src, f)).convert('RGBA')
    group = name.split('_')[0]
    h = HEIGHT.get(group, 210)
    if im.height != h: im = im.resize((max(1, round(im.width * h / im.height)), h), Image.LANCZOS)
    if group in RIM:   # 적은 얇은 테두리 빛으로 어두운 길에서도 잘 보이게
        a = np.asarray(im)[..., 3]
        grown = np.asarray(Image.fromarray(a).filter(ImageFilter.MaxFilter(5))).astype(np.float32)
        ring = np.clip(grown - a.astype(np.float32), 0, 255) * .8
        base = np.zeros((im.height, im.width, 4), np.uint8); base[..., :3] = RIM[group]; base[..., 3] = ring.astype(np.uint8)
        rimmed = Image.fromarray(base); rimmed.alpha_composite(im); im = rimmed
    items.append((name, im))
W = 2048; items.sort(key=lambda t: -t[1].height)
x = y = rowh = 0; pos = {}
for name, im in items:
    if x + im.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
    pos[name] = (x, y, im.width, im.height); x += im.width + 2; rowh = max(rowh, im.height)
H = y + rowh
atlas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for name, im in items: atlas.paste(im, pos[name][:2])
# 투명한 곳의 색을 주변 색으로 채워 가장자리 번짐 방지
arr = np.asarray(atlas).copy(); a = arr[..., 3] > 0
from scipy import ndimage
idx = ndimage.distance_transform_edt(~a, return_distances=False, return_indices=True)
arr[..., :3] = arr[..., :3][idx[0], idx[1]]
buf = io.BytesIO(); Image.fromarray(arr).save(buf, 'WEBP', quality=88, method=6, alpha_quality=100)
data = base64.b64encode(buf.getvalue()).decode()
with open(out, 'w') as f:
    f.write('// 자동 생성 파일 (tools/atlas.py): 제미나이 그림 묶음. 직접 고치지 말고 work/art/ 그림을 바꾼 뒤 다시 만든다.\n')
    f.write('const SPRITE_ATLAS={width:%d,height:%d,frames:%s,image:"data:image/webp;base64,%s"};\n' % (W, H, json.dumps(pos, separators=(',', ':')), data))
print('atlas', W, 'x', H, 'webp', len(buf.getvalue()) // 1024, 'KB', len(items), 'sprites')
