import React, { useEffect, useState } from 'react';
import { getMemberDress, getMoaSession, MEMBER_CID } from '../utils/moaFirebase';

/**
 * 모아팡 캐릭터 (모아팡 '캐릭터 꾸미기'에서 입힌 옷 그대로)
 *  - 그림은 모아팡의 js/avatar.js + assets/layers/*.png 를 그대로 씀 (타자팡은 모아팡 안 taja/ 에 있으므로 ../)
 *  - 모아팡 밖(미리보기 등)이거나 그림을 못 불러오면 fallback(이모지)을 보여 줌
 */
const MOA_ROOT = '../';
let loader: Promise<any> | null = null;

export function loadAvatarLib(): Promise<any> {
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

/** 지금 타자팡에 로그인한 사람이 타자팡 회원(이름+전화번호)인지 */
function isMemberNow(): boolean {
  try {
    const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
    return !!u && typeof u.id === 'string' && u.id.startsWith(`m_${MEMBER_CID}_`);
  } catch {
    return false;
  }
}

/** 지금 학생의 옷차림 (타자팡 회원이면 회원 옷, 모아팡 방번호로 들어왔으면 모아팡 옷) */
export const MASTER_OUTFIT_KEY = 'taja_master_outfit';
function isMasterUser(): boolean {
  try {
    const u = JSON.parse(localStorage.getItem('typang_current_user') || 'null');
    return !!u && (u.role === 'master' || u.id === 'master_admin');
  } catch {
    return false;
  }
}
export function currentOutfit(): any | null {
  if (isMasterUser()) {
    try {
      return JSON.parse(localStorage.getItem(MASTER_OUTFIT_KEY) || 'null');
    } catch {
      return null;
    }
  }
  if (isMemberNow()) return getMemberDress()?.outfit || null;
  return getMoaSession()?.outfit || null;
}

/** 모아팡 캐릭터 꾸미기 화면으로 (다 꾸미면 타자팡으로 돌아옴) */
export const DRESS_URL = MOA_ROOT + 'dress.html?back=taja';
export const dressUrl = () => (isMemberNow() && getMemberDress() ? DRESS_URL + '&who=member' : DRESS_URL);
export const hasMoaCharacter = () => !!getMoaSession() || (isMemberNow() && !!getMemberDress());

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

export type WalkDir = 'front' | 'back' | 'left' | 'right';

/**
 * 지도 위를 걸어 다니는 모아팡 캐릭터 (모아팡에서 입힌 옷 그대로, 걸을 때 발을 움직임)
 *  - 모아팡 캐릭터가 없으면 기본 옷차림으로 보여 줌
 */
export const MoaWalker: React.FC<{ size?: number; walking?: boolean; dir?: WalkDir; className?: string; fallback?: React.ReactNode }> = ({
  size = 64,
  walking = false,
  dir = 'front',
  className = '',
  fallback = null,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sheetRef = React.useRef<any>(null);
  const libRef = React.useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const again = () => setRev((n) => n + 1);
    window.addEventListener('moa-outfit-changed', again);
    window.addEventListener('storage', again);
    return () => {
      window.removeEventListener('moa-outfit-changed', again);
      window.removeEventListener('storage', again);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void loadAvatarLib().then(async (A) => {
      if (!alive) return;
      if (!A) return setFailed(true);
      try {
        const o = A.clean(currentOutfit() || A.START);
        await A.ensure(o);
        if (!alive) return;
        libRef.current = A;
        sheetRef.current = A.sheet(o);
        setReady(true);
      } catch {
        if (alive) setFailed(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [rev]);

  // 그리기: 걷는 중이면 발 움직임(4장)을 돌려 가며
  useEffect(() => {
    const c = canvasRef.current;
    const A = libRef.current;
    if (!ready || !c || !A || !sheetRef.current) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const px = Math.max(64, size * 2);
    c.width = px;
    c.height = px;
    let f = 0;
    const draw = () => A.drawFrame(ctx, sheetRef.current, dir, f, walking, px);
    draw();
    if (!walking) return;
    const t = window.setInterval(() => {
      f = (f + 1) % 4;
      draw();
    }, 140);
    return () => window.clearInterval(t);
  }, [ready, walking, dir, size]);

  if (failed) return <>{fallback}</>;
  return <canvas ref={canvasRef} className={className} style={{ width: size, height: size, imageRendering: 'pixelated', display: 'block' }} aria-label="내 모아팡 캐릭터" />;
};

/** 성적표 등에 그릴 캐릭터 그림 (정면, 서 있는 모습). 못 그리면 null */
export async function characterCanvas(outfit: any | null | undefined, size = 256): Promise<HTMLCanvasElement | null> {
  // outfit: undefined = 지금 로그인한 학생의 옷, null = 기본 옷
  try {
    const A = await loadAvatarLib();
    if (!A) return null;
    const o = A.clean((outfit === undefined ? currentOutfit() : outfit) || A.START);
    await A.ensure(o);
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    A.drawFrame(ctx, A.sheet(o), 'front', 0, false, size);
    return c;
  } catch {
    return null;
  }
}
