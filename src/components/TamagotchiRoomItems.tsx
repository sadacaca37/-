import React from 'react';
import { RoomDecorState } from '../types';

/**
 * 다마고치 방 소품 (제미나이로 그린 그림, public/assets/tamagotchi/decor/<id>.webp)
 *  - 배경 테마 그림 위에 올림. 좌표는 800×500 기준이고 배경 그림과 같은 방식(가운데 맞춤, 꽉 채우기)으로 잘림
 *  - 위쪽 약 100칸은 펫 정보 띠가 덮으므로 조명·벽 장식은 그 아래에 둠
 */
export const DECOR_IMG = (id: string) => `./assets/tamagotchi/decor/${id}.webp`;

type Box = { x: number; y: number; w: number; h: number };

/** 그림 크기(가로·세로 비율)에 맞춰 자리 잡기: 가로 w, 아래쪽 bottom 기준 */
const SIZES: Record<string, [number, number]> = {
  cozy_sofa: [149, 151], cat_tower: [168, 175], arcade_box: [107, 176], piano_mini: [157, 159], magic_tent: [172, 198], gaming_desk: [194, 182], dessert_table: [163, 177],
  circle_sun: [247, 194], bear_rug: [238, 179], flower_pink: [242, 180], star_magic: [248, 209], heart_cloud: [258, 161], cat_paw_rug: [248, 196],
  family_photo: [224, 171], neon_clock: [206, 181], plant_shelf: [245, 123], gold_trophy: [170, 210], party_garland: [295, 89], led_keyboard_sign: [252, 118],
  play_ball: [178, 173], teddy_bear: [188, 223], robot_toy: [128, 184], train_set: [247, 115], food_bowl_royal: [151, 112], magic_wand_stand: [87, 201],
  warm_pendant: [108, 167], disco_ball: [87, 163], fairy_lights: [167, 45], star_lamp: [99, 121], aurora_projector: [105, 147],
};
const ratio = (id: string) => {
  const s = SIZES[id];
  return s ? s[1] / s[0] : 1;
};

/** 가로 크기를 정하고 아래쪽(bottom)·가운데(cx)에 맞춤 */
const place = (id: string, cx: number, bottom: number, w: number): Box => {
  const h = w * ratio(id);
  return { x: cx - w / 2, y: bottom - h, w, h };
};

const FURNITURE_W: Record<string, number> = { arcade_box: 95, magic_tent: 165, gaming_desk: 180, cat_tower: 150 };
const TOY_W: Record<string, number> = { train_set: 150, magic_wand_stand: 55, robot_toy: 75, teddy_bear: 100, food_bowl_royal: 90, play_ball: 85 };
const WALL_W: Record<string, number> = { party_garland: 230, plant_shelf: 170, led_keyboard_sign: 160, gold_trophy: 85, family_photo: 130, neon_clock: 105 };

export const TamagotchiRoomItems: React.FC<{ decor?: RoomDecorState }> = ({ decor }) => {
  if (!decor) return null;
  const items: Array<{ id: string; box: Box; squash?: boolean }> = [];

  // 러그: 바닥 가운데, 펫 발밑 (바닥에 깔린 느낌으로 납작하게)
  if (decor.rug && decor.rug !== 'none') items.push({ id: decor.rug, box: { x: 400 - 165, y: 392, w: 330, h: 92 }, squash: true });

  // 벽 장식: 오른쪽 위 벽
  if (decor.wallDecor && decor.wallDecor !== 'none') {
    const w = WALL_W[decor.wallDecor] || 120;
    items.push({ id: decor.wallDecor, box: place(decor.wallDecor, 655, decor.wallDecor === 'party_garland' ? 215 : 285, w) });
  }

  // 천장 조명: 왼쪽 위 (가운데는 펫 말풍선 자리) / 요정 전구 줄은 가로로 길게
  if (decor.lighting && decor.lighting !== 'none') {
    if (decor.lighting === 'fairy_lights') items.push({ id: 'fairy_lights', box: { x: 230, y: 100, w: 340, h: 92 } });
    else {
      const w = decor.lighting === 'warm_pendant' ? 62 : 54;
      const h = w * ratio(decor.lighting);
      items.push({ id: decor.lighting, box: { x: 118 - w / 2, y: 96, w, h } });
    }
  }

  // 가구: 왼쪽 바닥
  if (decor.furniture && decor.furniture !== 'none') {
    const w = FURNITURE_W[decor.furniture] || 140;
    items.push({ id: decor.furniture, box: place(decor.furniture, 165, 470, w) });
  }

  // 장난감·소품: 오른쪽 바닥
  if (decor.floorToy && decor.floorToy !== 'none') {
    const w = TOY_W[decor.floorToy] || 90;
    items.push({ id: decor.floorToy, box: place(decor.floorToy, 650, 468, w) });
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 800 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {items.map(({ id, box, squash }) => (
          <image
            key={id}
            href={DECOR_IMG(id)}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            preserveAspectRatio={squash ? 'none' : 'xMidYMax meet'}
            style={{ imageRendering: 'pixelated' }}
          />
        ))}
      </svg>
    </div>
  );
};
