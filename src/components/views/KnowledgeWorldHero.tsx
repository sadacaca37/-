/**
 * 지식 타자 월드 공통 머리 그림 (제미나이 그림 배너 + 큰 제목)
 */
import React from 'react';

export type KnowledgeWorld = 'python' | 'capitals' | 'joseon' | 'kpop';

export const WORLD_ART: Record<KnowledgeWorld, { img: string; tone: string; num: number; title: string; sub: string }> = {
  python: { img: './assets/knowledge/python.webp', tone: '#38b6ff', num: 1, title: '파이썬 코딩 타자', sub: '단어에서 문장까지 레벨업 코딩' },
  capitals: { img: './assets/knowledge/capitals.webp', tone: '#43c05a', num: 2, title: '세계 수도 정복', sub: '71개국 5대륙 완주 풀코스' },
  joseon: { img: './assets/knowledge/joseon.webp', tone: '#8a6cff', num: 3, title: '조선 왕조 27대', sub: '태정태세문단세 · 500년 족보' },
  kpop: { img: './assets/knowledge/kpop.webp', tone: '#ff6bb5', num: 4, title: 'K-POP 명곡 가사 챌린지', sub: '노래를 들으며 감성 가사 타이핑' },
};

export const KnowledgeWorldHero: React.FC<{ world: KnowledgeWorld; onBack?: () => void; children?: React.ReactNode }> = ({ world, onBack, children }) => {
  const w = WORLD_ART[world];
  return (
    <div className="kwh" style={{ ['--tone' as any]: w.tone }} data-testid="world-hero">
      <img className="kwh-art" src={w.img} alt="" aria-hidden="true" draggable={false} />
      <div className="kwh-shade" aria-hidden="true" />
      <div className="kwh-body">
        {onBack && (
          <button type="button" className="kwh-back" onClick={onBack}>
            ◀ 지식 월드
          </button>
        )}
        <span className="kwh-world">WORLD {w.num}</span>
        <h1 className="kwh-title">{w.title}</h1>
        <p className="kwh-sub">{w.sub}</p>
        {children && <div className="kwh-extra">{children}</div>}
      </div>
    </div>
  );
};
