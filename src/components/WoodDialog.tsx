/**
 * 작은 팝업 창 공통 틀 (로그인·가입, 선생님께 보내기 등)
 *  - 내 계정 창(AccountFrame)과 같은 나무 머리띠 + 양피지 바탕 → 타자팡 모든 창이 한 모양
 *  - 뒤 흐림 없음, Esc·바깥 누르면 닫힘
 */
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  /** sm = 로그인처럼 좁은 창, md = 보고서처럼 넓은 창 */
  size?: 'sm' | 'md';
  testId?: string;
  /** 다른 창 위에 떠야 할 때 */
  zIndex?: number;
  children: React.ReactNode;
}

export const WoodDialog: React.FC<Props> = ({ title, sub, icon, onClose, size = 'sm', testId, zIndex = 80, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="wd-overlay"
      style={{ zIndex }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid={testId}
    >
      <div className={`wd-win wd-win--${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="wd-head">
          <div className="wd-head-l">
            {icon && <span className="wd-head-icon" aria-hidden="true">{icon}</span>}
            <div className="min-w-0">
              <h2 className="wd-title">{title}</h2>
              {sub && <p className="wd-sub">{sub}</p>}
            </div>
          </div>
          <button type="button" className="wd-close" onClick={onClose} title="닫기" aria-label="닫기">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="wd-body">{children}</div>
      </div>
    </div>
  );
};

/** 화면 안에 놓이는 안내 카드 (로그인해야 하는 곳, 잠긴 긴 글 등) */
export const WoodGate: React.FC<{ icon: React.ReactNode; title: React.ReactNode; children?: React.ReactNode; actions?: React.ReactNode; testId?: string }> = ({
  icon,
  title,
  children,
  actions,
  testId,
}) => (
  <div className="wd-gate" data-testid={testId}>
    <div className="wd-gate-icon" aria-hidden="true">{icon}</div>
    <h3 className="wd-gate-title">{title}</h3>
    {children && <div className="wd-gate-text">{children}</div>}
    {actions && <div className="wd-gate-actions">{actions}</div>}
  </div>
);
