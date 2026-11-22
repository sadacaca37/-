// 제미나이 그림 아틀라스에서 그림 하나를 잘라 작은 아이콘으로 보여 줌 (캐릭터 고르기·아이템 설명용)

import React from 'react';
import { ATLAS } from '../game/atlas';
import { ATLAS_URL } from '../game/art';

export const ArtIcon: React.FC<{ name: string; size: number; className?: string }> = ({ name, size, className }) => {
  const r = ATLAS[name];
  if (!r) return null;
  const s = size / Math.max(r[2], r[3]);
  return (
    <div
      aria-hidden
      className={className}
      style={{
        width: r[2] * s,
        height: r[3] * s,
        backgroundImage: `url(${ATLAS_URL})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${-r[0] * s}px ${-r[1] * s}px`,
        backgroundSize: `${1024 * s}px auto`,
      }}
    />
  );
};
