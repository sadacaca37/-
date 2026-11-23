/**
 * 첫 화면 위: 타자 대회 알림 (곧 시작 · 진행 중 · 결과 발표)
 */
import React, { useEffect, useState } from 'react';
import { UserSession } from '../types';
import { Contest, ContestRanking, readContest } from '../utils/contest';
import { ContestModal } from './ContestModal';

export const ContestBanner: React.FC<{ user: UserSession | null; onLogin: () => void }> = ({ user, onLogin }) => {
  const [c, setC] = useState<Contest | null>(null);
  const [res, setRes] = useState<ContestRanking | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    const load = () =>
      void readContest().then(({ cur, results }) => {
        if (!alive) return;
        setC(cur);
        setRes(cur ? results[cur.id] : undefined);
      });
    load();
    const t = window.setInterval(load, 30000);
    const c2 = window.setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener('contest-updated', load);
    return () => {
      alive = false;
      window.clearInterval(t);
      window.clearInterval(c2);
      window.removeEventListener('contest-updated', load);
    };
  }, []);

  // 끝나고 하루가 지나면 알림을 감춤
  if (!c || now > c.endAt + 24 * 3600 * 1000) return null;
  const live = now >= c.startAt && now < c.endAt;
  const soon = now < c.startAt;
  const mm = (ms: number) => Math.max(0, Math.ceil(ms / 60000));
  const when = new Date(c.startAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <div className={`tp-contest ${live ? 'is-live' : ''}`} data-testid="contest-banner">
        <span className="tp-contest-flag" aria-hidden="true">🏁</span>
        <div className="tp-contest-text">
          <b>{c.title}</b>
          <span>
            {live
              ? `지금 대회 중! ${mm(c.endAt - now)}분 남았어요 · 딱 한 번 도전`
              : soon
                ? `${when} 시작 · ${Math.round((c.endAt - c.startAt) / 60000)}분 동안`
                : res
                  ? `결과 발표! ${res.ranking
                      .slice(0, 3)
                      .map((r) => `${['🥇', '🥈', '🥉'][r.place - 1]}${r.name}`)
                      .join(' ')}`
                  : '대회가 끝났어요. 곧 결과가 나와요!'}
          </span>
        </div>
        <button type="button" className="tp-contest-btn" onClick={() => setOpen(true)} data-testid="contest-open">
          {live ? '도전하기 ▶' : soon ? '미리 보기' : '결과 보기'}
        </button>
      </div>
      {open && <ContestModal contest={c} result={res} user={user} onClose={() => setOpen(false)} onLogin={onLogin} />}
    </>
  );
};
