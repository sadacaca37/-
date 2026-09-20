import React from 'react';

/**
 * 조선 국왕 얼굴 (직접 그린 캐릭터 그림)
 * 실제 어진(초상화)은 태조·영조·철종·고종·순종 등 몇 분만 남아 있어서,
 * 27대 모두를 같은 그림체로 그렸습니다. 익선관 + 곤룡포(대한제국 고종·순종은 황룡포) +
 * 가슴의 용 보(흉배), 그리고 왕마다 수염·나이·표정을 다르게 했습니다.
 */

type Beard = 'none' | 'thin' | 'goatee' | 'full' | 'long';
type Mood = 'smile' | 'calm' | 'serious' | 'sad' | 'stern';
interface Look {
  beard: Beard;
  mood: Mood;
  young?: boolean;
  old?: boolean;
  deposed?: boolean; // 연산군·광해군 (왕의 칭호 '군')
}

/** 왕마다 조금씩 다른 모습 (역사 속 이야기를 바탕으로 한 캐릭터 설정) */
const LOOKS: Record<number, Look> = {
  1: { beard: 'long', mood: 'stern', old: true }, // 태조
  2: { beard: 'full', mood: 'calm' }, // 정종
  3: { beard: 'full', mood: 'stern' }, // 태종
  4: { beard: 'goatee', mood: 'smile' }, // 세종
  5: { beard: 'thin', mood: 'calm' }, // 문종
  6: { beard: 'none', mood: 'sad', young: true }, // 단종
  7: { beard: 'full', mood: 'serious' }, // 세조
  8: { beard: 'none', mood: 'calm', young: true }, // 예종
  9: { beard: 'thin', mood: 'smile' }, // 성종
  10: { beard: 'goatee', mood: 'stern', deposed: true }, // 연산군
  11: { beard: 'thin', mood: 'calm' }, // 중종
  12: { beard: 'thin', mood: 'sad' }, // 인종
  13: { beard: 'goatee', mood: 'calm' }, // 명종
  14: { beard: 'full', mood: 'serious' }, // 선조
  15: { beard: 'goatee', mood: 'serious', deposed: true }, // 광해군
  16: { beard: 'full', mood: 'sad' }, // 인조
  17: { beard: 'full', mood: 'stern' }, // 효종
  18: { beard: 'thin', mood: 'calm' }, // 현종
  19: { beard: 'goatee', mood: 'serious' }, // 숙종
  20: { beard: 'thin', mood: 'sad' }, // 경종
  21: { beard: 'long', mood: 'calm', old: true }, // 영조
  22: { beard: 'goatee', mood: 'smile' }, // 정조
  23: { beard: 'none', mood: 'calm', young: true }, // 순조
  24: { beard: 'none', mood: 'calm', young: true }, // 헌종
  25: { beard: 'thin', mood: 'smile' }, // 철종
  26: { beard: 'full', mood: 'serious' }, // 고종 (대한제국 황제)
  27: { beard: 'thin', mood: 'sad' }, // 순종 (대한제국 황제)
};

export const KingFace: React.FC<{ order: number; size?: number; className?: string; title?: string }> = ({
  order,
  size = 96,
  className = '',
  title,
}) => {
  const look = LOOKS[order] || { beard: 'thin', mood: 'calm' };
  const emperor = order >= 26;
  const robe = emperor ? '#e8b21e' : '#c8242b';
  const robeDark = emperor ? '#b07f09' : '#8e1419';
  const skin = look.young ? '#ffe0c4' : '#f6cfa8';
  const cheek = '#ff9aa2';
  const hair = '#1b1b1b';
  const beardColor = look.old ? '#d9d9d9' : '#262626';
  const ink = '#2a1a12';

  const eyes = () => {
    switch (look.mood) {
      case 'smile':
        return (
          <>
            <path d="M38 55 q5 -5 10 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M62 55 q5 -5 10 0" stroke={ink} strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        );
      case 'sad':
        return (
          <>
            <ellipse cx="43" cy="56" rx="3" ry="3.6" fill={ink} />
            <ellipse cx="67" cy="56" rx="3" ry="3.6" fill={ink} />
            <circle cx="44" cy="55" r="1" fill="#fff" />
            <circle cx="68" cy="55" r="1" fill="#fff" />
          </>
        );
      default:
        return (
          <>
            <ellipse cx="43" cy="56" rx="3" ry="3.4" fill={ink} />
            <ellipse cx="67" cy="56" rx="3" ry="3.4" fill={ink} />
            <circle cx="44" cy="55" r="1" fill="#fff" />
            <circle cx="68" cy="55" r="1" fill="#fff" />
          </>
        );
    }
  };
  const brows = () => {
    if (look.mood === 'stern' || look.mood === 'serious')
      return (
        <>
          <path d="M36 47 L49 50" stroke={hair} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M74 47 L61 50" stroke={hair} strokeWidth="3.4" strokeLinecap="round" />
        </>
      );
    if (look.mood === 'sad')
      return (
        <>
          <path d="M37 50 L49 46" stroke={hair} strokeWidth="3" strokeLinecap="round" />
          <path d="M73 50 L61 46" stroke={hair} strokeWidth="3" strokeLinecap="round" />
        </>
      );
    return (
      <>
        <path d="M37 48 q6 -3 12 0" stroke={look.old ? '#cfcfcf' : hair} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M61 48 q6 -3 12 0" stroke={look.old ? '#cfcfcf' : hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    );
  };
  const mouth = () => {
    if (look.mood === 'smile') return <path d="M49 71 q6 6 12 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
    if (look.mood === 'sad') return <path d="M49 73 q6 -4 12 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
    if (look.mood === 'stern') return <path d="M49 72 h12" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />;
    return <path d="M50 71 q5 2 10 0" stroke={ink} strokeWidth="2.6" fill="none" strokeLinecap="round" />;
  };
  const beard = () => {
    const c = beardColor;
    switch (look.beard) {
      case 'thin':
        return (
          <>
            <path d="M44 67 q11 -5 22 0" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M55 76 v5" stroke={c} strokeWidth="2.6" strokeLinecap="round" />
          </>
        );
      case 'goatee':
        return (
          <>
            <path d="M42 67 q13 -7 26 0" stroke={c} strokeWidth="3.2" fill="none" strokeLinecap="round" />
            <path d="M51 77 q4 12 8 0 z" fill={c} />
          </>
        );
      case 'full':
        return (
          <>
            <path d="M41 67 q14 -8 28 0" stroke={c} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M38 70 q3 18 17 20 q14 -2 17 -20 q-4 8 -17 9 q-13 -1 -17 -9z" fill={c} />
          </>
        );
      case 'long':
        return (
          <>
            <path d="M41 67 q14 -8 28 0" stroke={c} strokeWidth="3.4" fill="none" strokeLinecap="round" />
            <path d="M40 72 q2 26 15 30 q13 -4 15 -30 q-5 8 -15 8 q-10 0 -15 -8z" fill={c} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 110 120"
      width={size}
      height={(size * 120) / 110}
      className={className}
      role="img"
      aria-label={title || `조선 ${order}대 국왕 캐릭터`}
    >
      {/* 곤룡포 */}
      <path d="M8 120 q4 -28 30 -34 h34 q26 6 30 34z" fill={robe} stroke={ink} strokeWidth="2.5" />
      <path d="M38 86 l17 16 l17 -16" fill="none" stroke="#fff5d6" strokeWidth="5" />
      <path d="M38 86 l17 16 l17 -16" fill="none" stroke={ink} strokeWidth="1.5" />
      <path d="M8 120 q4 -28 30 -34" fill="none" stroke={robeDark} strokeWidth="4" opacity="0.5" />
      {/* 가슴의 용 보(흉배) */}
      <circle cx="28" cy="106" r="9" fill="#f5c542" stroke={ink} strokeWidth="1.5" />
      <path d="M23 106 q5 -6 10 0 q-5 5 -10 0z" fill={robeDark} />
      <circle cx="82" cy="106" r="9" fill="#f5c542" stroke={ink} strokeWidth="1.5" />
      <path d="M77 106 q5 -6 10 0 q-5 5 -10 0z" fill={robeDark} />
      {/* 목 */}
      <rect x="47" y="78" width="16" height="10" fill={skin} />
      {/* 얼굴 */}
      <ellipse cx="55" cy="58" rx="27" ry="29" fill={skin} stroke={ink} strokeWidth="2.5" />
      {/* 귀 */}
      <ellipse cx="28" cy="60" rx="4" ry="6" fill={skin} stroke={ink} strokeWidth="2" />
      <ellipse cx="82" cy="60" rx="4" ry="6" fill={skin} stroke={ink} strokeWidth="2" />
      {brows()}
      {eyes()}
      {look.old && (
        <>
          <path d="M38 62 q4 2 8 0" stroke="#c9a07e" strokeWidth="1.5" fill="none" />
          <path d="M64 62 q4 2 8 0" stroke="#c9a07e" strokeWidth="1.5" fill="none" />
        </>
      )}
      <ellipse cx="38" cy="66" rx="5" ry="3" fill={cheek} opacity="0.55" />
      <ellipse cx="72" cy="66" rx="5" ry="3" fill={cheek} opacity="0.55" />
      <path d="M55 58 v7 q-2 1 -3 0" stroke="#c78f68" strokeWidth="2" fill="none" strokeLinecap="round" />
      {beard()}
      {mouth()}
      {/* 익선관 (날개 달린 왕의 모자) */}
      <path d="M28 40 q0 -26 27 -28 q27 2 27 28 z" fill="#161616" stroke={ink} strokeWidth="2" />
      <path d="M40 22 q15 -14 30 0 v8 h-30z" fill="#222" stroke="#000" strokeWidth="1.5" />
      <rect x="27" y="36" width="56" height="7" rx="3" fill="#2b2b2b" stroke="#000" strokeWidth="1.5" />
      {!look.deposed && (
        <>
          <ellipse cx="22" cy="24" rx="9" ry="6" transform="rotate(-25 22 24)" fill="#1e1e1e" stroke="#000" strokeWidth="1.5" />
          <ellipse cx="88" cy="24" rx="9" ry="6" transform="rotate(25 88 24)" fill="#1e1e1e" stroke="#000" strokeWidth="1.5" />
        </>
      )}
      <path d="M44 26 q11 -6 22 0" stroke="#5a5a5a" strokeWidth="1.5" fill="none" />
      {emperor && <circle cx="55" cy="30" r="3.5" fill="#f5c542" stroke="#000" strokeWidth="1" />}
    </svg>
  );
};
