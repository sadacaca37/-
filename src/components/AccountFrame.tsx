/**
 * 내 계정 · 타자 기록 · 성적표가 함께 쓰는 창 틀
 *  - 세 탭 모두 같은 크기, 같은 나무 머리띠(제목·포인트·닫기), 같은 양피지 바탕
 *  - 탭을 바꿔도 창은 그대로 있고 안쪽만 바뀜 (창이 깜빡이거나 커졌다 작아지지 않음)
 *  - 안쪽 코드를 아직 못 받았어도 틀은 바로 뜨고 "여는 중" 표시
 */
import React, { Suspense, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { pointsManager } from '../utils/pointsManager';
import { TvBot } from './views/TapangHome';

export const AccountLoading: React.FC<{ text?: string }> = ({ text = '여는 중이에요…' }) => (
  <div className="acct-loading" aria-live="polite">
    <span className="acct-loading-dot" />
    <span>{text}</span>
  </div>
);

interface Props {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  tabs?: React.ReactNode;
  onClose: () => void;
  showPoints?: boolean;
  bubble?: string;
  testId?: string;
  children: React.ReactNode;
}

export const AccountFrame: React.FC<Props> = ({ title, sub, icon, tabs, onClose, showPoints = true, bubble, testId, children }) => {
  const [points, setPoints] = useState<number>(() => pointsManager.getBalance());
  useEffect(() => {
    const sync = () => setPoints(pointsManager.getBalance());
    window.addEventListener('points-updated', sync);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('points-updated', sync);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      className="tp-modal acct-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid={testId}
    >
      {bubble && (
        <div className="tp-modal-bot" aria-hidden="true">
          <TvBot size={110} bubble={bubble} bubbleSide="top" />
        </div>
      )}
      <div className="acct-win" role="dialog" aria-modal="true" aria-label={title}>
        <header className="acct-head">
          <div className="acct-head-l">
            <div className="acct-head-icon">{icon || '👤'}</div>
            <div className="min-w-0">
              <h1 className="acct-head-title">{title}</h1>
              {sub && <p className="acct-head-sub">{sub}</p>}
            </div>
          </div>
          <div className="acct-head-r">
            {showPoints && (
              <div className="acct-points" title="내 포인트">
                <span>🪙</span>
                <b>{points.toLocaleString()}</b>
                <small>P</small>
              </div>
            )}
            <button type="button" className="acct-close" onClick={onClose} aria-label="닫기" title="닫기 (Esc)">
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>
        {tabs}
        <div className="acct-body">
          <Suspense fallback={<AccountLoading />}>{children}</Suspense>
        </div>
      </div>
    </div>
  );
};

/** 각 탭 맨 위의 제목 줄 (세 탭 모두 같은 모양) */
export const AccountSection: React.FC<{ icon: React.ReactNode; title: React.ReactNode; desc?: React.ReactNode; right?: React.ReactNode }> = ({ icon, title, desc, right }) => (
  <div className="acct-sec">
    <div className="acct-sec-icon" aria-hidden="true">
      {icon}
    </div>
    <div className="acct-sec-text">
      <h2 className="acct-sec-title">{title}</h2>
      {desc && <p className="acct-sec-desc">{desc}</p>}
    </div>
    {right && <div className="acct-sec-right">{right}</div>}
  </div>
);
