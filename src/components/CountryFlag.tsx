import React, { useState } from 'react';

// 71개국 한글 국가명 -> ISO 2자리 코드 매핑
// 국기 그림은 public/flags/ 에 들어 있는 SVG(flag-icons, MIT)를 씀 → 윈도우에서도, 인터넷이 막힌 학교에서도 선명하게 보임
const COUNTRY_ISO_MAP: Record<string, string> = {
  '대한민국': 'kr',
  '일본': 'jp',
  '중국': 'cn',
  '대만': 'tw',
  '몽골': 'mn',
  '베트남': 'vn',
  '태국': 'th',
  '필리핀': 'ph',
  '인도네시아': 'id',
  '말레이시아': 'my',
  '싱가포르': 'sg',
  '인도': 'in',
  '파키스탄': 'pk',
  '카자흐스탄': 'kz',
  '우즈베키스탄': 'uz',
  '튀르키예': 'tr',
  '영국': 'gb',
  '프랑스': 'fr',
  '독일': 'de',
  '이탈리아': 'it',
  '스페인': 'es',
  '포르투갈': 'pt',
  '스위스': 'ch',
  '네덜란드': 'nl',
  '벨기에': 'be',
  '오스트리아': 'at',
  '체코': 'cz',
  '헝가리': 'hu',
  '폴란드': 'pl',
  '그리스': 'gr',
  '스웨덴': 'se',
  '노르웨이': 'no',
  '핀란드': 'fi',
  '덴마크': 'dk',
  '아일랜드': 'ie',
  '우크라이나': 'ua',
  '러시아': 'ru',
  '크로아티아': 'hr',
  '루마니아': 'ro',
  '불가리아': 'bg',
  '미국': 'us',
  '캐나다': 'ca',
  '멕시코': 'mx',
  '쿠바': 'cu',
  '파나마': 'pa',
  '코스타리카': 'cr',
  '자메이카': 'jm',
  '도미니카공화국': 'do',
  '브라질': 'br',
  '아르헨티나': 'ar',
  '칠레': 'cl',
  '콜롬비아': 'co',
  '페루': 'pe',
  '우루과이': 'uy',
  '베네수엘라': 've',
  '볼리비아': 'bo',
  '이집트': 'eg',
  '남아프리카공화국': 'za',
  '케냐': 'ke',
  '모로코': 'ma',
  '가나': 'gh',
  '나이지리아': 'ng',
  '에티오피아': 'et',
  '탄자니아': 'tz',
  '알제리': 'dz',
  '세네갈': 'sn',
  '호주': 'au',
  '뉴질랜드': 'nz',
  '피지': 'fj',
  '파푸아뉴기니': 'pg',
  '사모아': 'ws',
  '팔라우': 'pw'
};

export function getCountryIso(countryName: string, flagEmoji?: string): string {
  if (COUNTRY_ISO_MAP[countryName]) {
    return COUNTRY_ISO_MAP[countryName];
  }
  if (flagEmoji) {
    const chars = Array.from(flagEmoji);
    if (chars.length >= 2) {
      const c1 = chars[0].codePointAt(0);
      const c2 = chars[1].codePointAt(0);
      if (c1 && c2 && c1 >= 127462 && c1 <= 127487 && c2 >= 127462 && c2 <= 127487) {
        return `${String.fromCharCode(c1 - 127397)}${String.fromCharCode(c2 - 127397)}`.toLowerCase();
      }
    }
  }
  return '';
}

interface CountryFlagProps {
  countryName: string;
  flagEmoji?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  countryName,
  flagEmoji,
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const iso = getCountryIso(countryName, flagEmoji);

  const sizeClasses = {
    sm: 'w-6 h-4 text-sm',
    md: 'w-9 h-6 text-xl',
    lg: 'w-14 h-9 text-3xl',
    xl: 'w-20 h-14 text-5xl',
    hero: 'w-32 h-20 text-6xl shadow-md',
  };

  if (!iso || hasError) {
    return (
      <span
        role="img"
        aria-label={`${countryName} 국기`}
        className={`inline-flex items-center justify-center font-emoji select-none ${className}`}
      >
        {flagEmoji || '🏳️'}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden rounded shadow-sm border border-slate-200/80 bg-slate-50 flex-shrink-0 ${sizeClasses[size]} ${className}`}
    >
      <img
        src={`flags/${iso}.svg`}
        alt={`${countryName} 국기`}
        className="w-full h-full object-cover select-none"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
