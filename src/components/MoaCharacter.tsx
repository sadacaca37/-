import React, { useEffect, useState } from 'react';
import { getMoaSession } from '../utils/moaFirebase';

/**
 * 모아팡 캐릭터 (모아팡 '캐릭터 꾸미기'에서 입힌 옷 그대로)
 *  - 그림은 모아팡의 js/avatar.js + assets/layers/*.png 를 그대로 씀 (타자팡은 모아팡 안 taja/ 에 있으므로 ../)
 *  - 모아팡 밖(미리보기 등)이거나 그림을 못 불러오면 fallback(이모지)을 보여 줌
 */
const MOA_ROOT = '../';
let loader: Promise<any> | null = null;

function loadAvatarLib(): Promise<any> {
  const w = window as any;
  if (w.MoaAvatar) return Promise.resolve(w.MoaAvatar);
  if (!loader)
    loader = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = MOA_ROOT + 'js/avatar.js';
      s.async = true;
      s.onload = () => {
        const A = (window as any).MoaAvatar;
        if (A) A.base = MOA_ROOT + 'assets/layers/';
        resolve(A || null);
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  return loader;
}

/** 지금 학생의 옷차림 (모아팡 입장 기록에 저장된 것) */
export function currentOutfit(): any | null {
  return getMoaSession()?.outfit || null;
}

/** 모아팡 캐릭터 꾸미기 화면으로 (다 꾸미면 타자팡으로 돌아옴) */
export const DRESS_URL = MOA_ROOT + 'dress.html?back=taja';
export const hasMoaCharacter = () => !!getMoaSession();

export const MoaCharacter: React.FC<{ size?: number; fallback?: React.ReactNode; className?: string }> = ({ size = 32, fallback = '🙂', className = '' }) => {
  const [src, setSrc] = useState('');
  const [rev, setRev] = useState(0);

  // 꾸미기에서 돌아오거나 다른 창에서 바꾸면 다시 그림
  useEffect(() => {
    const again = () => setRev((n) => n + 1);
    window.addEventListener('focus', again);
    window.addEventListener('storage', again);
    window.addEventListener('moa-outfit-changed', again);
    return () => {
      window.removeEventListener('focus', again);
      window.removeEventListener('storage', again);
      window.removeEventListener('moa-outfit-changed', again);
    };
  }, []);

  useEffect(() => {
    if (!getMoaSession()) {
      setSrc('');
      return;
    }
    let alive = true;
    void loadAvatarLib().then(async (A) => {
      if (!A || !alive) return;
      try {
        const o = A.clean(currentOutfit() || A.START);
        await A.ensure(o);
        if (!alive) return;
        const c: HTMLCanvasElement = A.thumb(o, 128);
        setSrc(c.toDataURL('image/png'));
      } catch {
        setSrc('');
      }
    });
    return () => {
      alive = false;
    };
  }, [rev]);

  if (!src)
    return (
      <span className={className} style={{ fontSize: Math.round(size * 0.6), lineHeight: 1 }} aria-hidden="true">
        {fallback}
      </span>
    );
  return (
    <img
      src={src}
      alt="내 캐릭터"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'contain' }}
      draggable={false}
    />
  );
};
