import React from 'react';
import { ATLAS } from '../art/atlas';
import { ATLAS_URL, ATLAS_SIZE } from '../utils/art';

// 아틀라스(제미나이 그림 모음)에서 그림 하나를 화면(HTML)에 보여 주는 작은 부품
export const ArtSprite: React.FC<{ name: string; height: number; flip?: boolean; className?: string; title?: string }> = ({
  name,
  height,
  flip,
  className,
  title,
}) => {
  const r = ATLAS[name];
  if (!r) return null;
  const k = height / r[3];
  return (
    <div
      className={className}
      title={title}
      style={{
        width: Math.round(r[2] * k),
        height,
        backgroundImage: `url(${ATLAS_URL})`,
        backgroundPosition: `${-r[0] * k}px ${-r[1] * k}px`,
        backgroundSize: `${ATLAS_SIZE.w * k}px ${ATLAS_SIZE.h * k}px`,
        backgroundRepeat: 'no-repeat',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    />
  );
};
