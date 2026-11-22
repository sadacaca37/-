/**
 * 내 계정 · 타자 기록 · 성적표를 한 창처럼 오가는 탭
 */
import React from 'react';

export type AccountTab = 'account' | 'records' | 'report';

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'account', label: '👤 내 계정·캐릭터' },
  { id: 'records', label: '📖 타자 기록' },
  { id: 'report', label: '🏆 성적표' },
];

export const AccountTabs: React.FC<{ active: AccountTab; onChange: (t: AccountTab) => void }> = ({ active, onChange }) => (
  <nav className="acct-tabs" role="tablist" aria-label="내 계정 메뉴" data-testid="account-tabs">
    {TABS.map((t) => (
      <button
        key={t.id}
        type="button"
        role="tab"
        aria-selected={active === t.id}
        className={`acct-tab ${active === t.id ? 'is-on' : ''}`}
        onClick={() => active !== t.id && onChange(t.id)}
      >
        {t.label}
      </button>
    ))}
  </nav>
);
