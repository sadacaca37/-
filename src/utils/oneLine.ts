/**
 * 짧은 글 연습: 긴 문장을 한 줄에 들어가는 길이로 나눔
 *  - 쉼표 뒤 → 이어 주는 말(…며, …고, …면, …서 등) 뒤 → 아무 띄어쓰기 순으로 나눌 자리를 찾고
 *  - 앞뒤 길이가 비슷해지는 자리를 고름
 */
const MAX = { ko: 28, en: 48 } as const;
const KO_JOIN = /(며|고|면|서|니|데|만|듯|럼|여|게|도|라|며,|고,)$/;

function splitOnce(s: string, max: number, lang: 'ko' | 'en'): string[] {
  const t = s.trim();
  if (t.length <= max) return [t];
  const spaces: number[] = [];
  for (let i = 1; i < t.length - 1; i++) if (t[i] === ' ') spaces.push(i);
  if (!spaces.length) return [t];
  const score = (i: number) => {
    const left = t.slice(0, i);
    const word = left.slice(left.lastIndexOf(' ') + 1);
    let bonus = 0;
    if (/[,;:]$/.test(left)) bonus = 12;
    else if (lang === 'ko' && KO_JOIN.test(word)) bonus = 6;
    else if (lang === 'en' && /^(and|but|so|because|when|while|that|which|to)$/i.test(t.slice(i + 1).split(' ')[0])) bonus = 5;
    const over = Math.max(0, i - max) + Math.max(0, t.length - i - 1 - max);
    return Math.abs(i - (t.length - i - 1)) * 0.5 + over * 3 - bonus;
  };
  const best = spaces.reduce((a, b) => (score(b) < score(a) ? b : a));
  return [...splitOnce(t.slice(0, best), max, lang), ...splitOnce(t.slice(best + 1), max, lang)];
}

export function splitForOneLine(sentences: string[], lang: 'ko' | 'en'): string[] {
  const max = MAX[lang] || 28;
  return sentences.flatMap((s) => splitOnce(String(s || ''), max, lang)).filter(Boolean);
}
