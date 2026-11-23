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

/** 실제 어진(초상화)·사진이 전하는 왕 (퍼블릭 도메인 — public/kings/CREDITS.txt 참고)
 *  - 세조는 1935년 무렵 김은호가 원래 어진을 보고 그린 밑그림(초본)이 남아 있어 위키미디어 공용에서 불러옴 */
const WM = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/';
export const REAL_KING_PORTRAITS: Record<number, { src: string; caption: string; crop?: { scale: number; origin: string }; credit?: { by: string; license: string; page: string } }> = {
  1: { src: 'kings/taejo.webp', caption: '태조 어진 (1872년 모사본)' },
  7: {
    src: WM + '6/6c/%EC%84%B8%EC%A1%B0_%EC%96%B4%EC%A7%84_%EC%B4%88%EB%B3%B8.jpg/960px-%EC%84%B8%EC%A1%B0_%EC%96%B4%EC%A7%84_%EC%B4%88%EB%B3%B8.jpg',
    caption: '세조 어진 초본 (원래 어진을 보고 그린 밑그림)',
    crop: { scale: 4.2, origin: '50% 7%' },
    credit: { by: '김은호', license: '퍼블릭 도메인', page: 'https://commons.wikimedia.org/wiki/File:%EC%84%B8%EC%A1%B0_%EC%96%B4%EC%A7%84_%EC%B4%88%EB%B3%B8.jpg' },
  },
  21: { src: 'kings/yeongjo.webp', caption: '영조 어진 (1900년 모사본)' },
  25: { src: 'kings/cheoljong.webp', caption: '철종 어진 (1861년, 일부 불탐)' },
  26: { src: 'kings/gojong.webp', caption: '고종 어진' },
  27: { src: 'kings/sunjong.webp', caption: '순종 사진' },
};

/**
 * 어진(얼굴)이 전하지 않는 왕: 그 왕 때 가장 이름난 유적·유물·그림의 실제 사진 (위키미디어 공용에서 불러옴, 출처 표시)
 *  - 사진을 못 불러오면(인터넷 막힘 등) 같은 것을 그린 도트 그림(public/kings/relic_XX.png)을 대신 보여 줌
 */
type Credit = { by: string; license: string; page: string };
type Relic = { photo: string; src?: string; name: string; caption: string; credit: Credit; pos?: string };
const C = (by: string, license: string, file: string): Credit => ({ by, license, page: 'https://commons.wikimedia.org/wiki/File:' + file });
export const KING_RELICS: Record<number, Relic> = {
  2: { photo: WM + 'c/c3/Gyeongbokgung%28palace%29_Geunjeongjeon%28hall%29.jpg/330px-Gyeongbokgung%28palace%29_Geunjeongjeon%28hall%29.jpg', src: 'kings/relic_02.png', name: '경복궁 근정전', caption: '정종이 왕위에 오른 경복궁 근정전', credit: C('Brady Bellini', 'CC0', 'Gyeongbokgung(palace)_Geunjeongjeon(hall).jpg') },
  3: { photo: WM + 'a/a1/Donhwamun_Gate_Changdeokgung_1.jpg/330px-Donhwamun_Gate_Changdeokgung_1.jpg', src: 'kings/relic_03.png', name: '창덕궁 돈화문', caption: '태종 때(1405) 새로 지은 궁궐, 창덕궁의 정문 돈화문', credit: C('kallerna', 'CC BY-SA 4.0', 'Donhwamun_Gate_Changdeokgung_1.jpg') },
  4: { photo: WM + '6/67/Hunminjeongeum_Haerye_03.jpg/330px-Hunminjeongeum_Haerye_03.jpg', src: 'kings/relic_04.png', name: '훈민정음 해례본', caption: '세종 때(1446) 펴낸 훈민정음 해례본', credit: C('조선 정부', '퍼블릭 도메인', 'Hunminjeongeum_Haerye_03.jpg') },
  5: { photo: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Rain_Gauge_%EC%B8%A1%EC%9A%B0%EA%B8%B0.jpg', src: 'kings/relic_05.png', name: '측우기', caption: '문종이 세자 때(1441) 만든, 비의 양을 재는 측우기', credit: C('Gyeongmin Koh', 'CC BY-SA 4.0', 'Rain_Gauge_%EC%B8%A1%EC%9A%B0%EA%B8%B0.jpg'), pos: '50% 20%' },
  6: { photo: WM + '2/2f/CheongRyeongpo_Eoso.JPG/330px-CheongRyeongpo_Eoso.JPG', src: 'kings/relic_06.png', name: '영월 청령포', caption: '단종이 쫓겨나 머문 영월 청령포의 집(어소)', credit: C('Naturehead', 'CC BY-SA 3.0', 'CheongRyeongpo_Eoso.JPG') },
  7: { photo: WM + 'c/c0/Korea-Seoul-Tapgol_Park_10_Storied_Pagoda_at_Wongaksa_0095-06.JPG/330px-Korea-Seoul-Tapgol_Park_10_Storied_Pagoda_at_Wongaksa_0095-06.JPG', src: 'kings/relic_07.png', name: '원각사지 십층석탑', caption: '세조 때(1467) 세운 원각사지 십층석탑', credit: C('Steve46814', 'CC BY-SA 3.0', 'Korea-Seoul-Tapgol_Park_10_Storied_Pagoda_at_Wongaksa_0095-06.JPG') },
  8: { photo: WM + '6/65/%EA%B3%A0%EC%96%91_%EC%84%9C%EC%98%A4%EB%A6%89_%EC%B0%BD%EB%A6%89.jpg/330px-%EA%B3%A0%EC%96%91_%EC%84%9C%EC%98%A4%EB%A6%89_%EC%B0%BD%EB%A6%89.jpg', name: '창릉', caption: '예종이 잠든 창릉 (고양 서오릉)', credit: C('QWMN1409', 'CC BY-SA 4.0', '%EA%B3%A0%EC%96%91_%EC%84%9C%EC%98%A4%EB%A6%89_%EC%B0%BD%EB%A6%89.jpg') },
  9: { photo: WM + 'a/a3/Gyeongguk_daejeon_in_the_National_Museum_of_Korea_2016-11.jpg/330px-Gyeongguk_daejeon_in_the_National_Museum_of_Korea_2016-11.jpg', src: 'kings/relic_09.png', name: '경국대전', caption: '성종 때(1485) 완성한 나라의 법전, 경국대전', credit: C('猫猫的日记本', 'CC BY-SA 4.0', 'Gyeongguk_daejeon_in_the_National_Museum_of_Korea_2016-11.jpg') },
  10: { photo: WM + '5/5d/Gyeonghoeru_%28Royal_Banquet_Hall%29_at_Gyeongbokgung_Palace%2C_Seoul.jpg/330px-Gyeonghoeru_%28Royal_Banquet_Hall%29_at_Gyeongbokgung_Palace%2C_Seoul.jpg', src: 'kings/relic_10.png', name: '경복궁 경회루', caption: '연산군이 큰 잔치를 벌였던 경회루', credit: C('Frank Schulenburg', 'CC BY-SA 4.0', 'Gyeonghoeru_(Royal_Banquet_Hall)_at_Gyeongbokgung_Palace,_Seoul.jpg') },
  11: { photo: WM + '8/84/Sosu_Seowon_%287%29.jpg/330px-Sosu_Seowon_%287%29.jpg', src: 'kings/relic_11.png', name: '소수서원', caption: '중종 때(1543) 세운 우리나라 첫 서원(백운동서원)', credit: C('Kyle', 'CC BY 2.0', 'Sosu_Seowon_(7).jpg') },
  12: { photo: WM + '7/71/%EA%B3%A0%EC%96%91_%EC%84%9C%EC%82%BC%EB%A6%89_%ED%9A%A8%EB%A6%89_%EB%8A%A5%EC%B9%A8.jpg/330px-%EA%B3%A0%EC%96%91_%EC%84%9C%EC%82%BC%EB%A6%89_%ED%9A%A8%EB%A6%89_%EB%8A%A5%EC%B9%A8.jpg', name: '효릉', caption: '인종이 잠든 효릉 (고양 서삼릉)', credit: C('문화재청', '공공누리 제1유형', '%EA%B3%A0%EC%96%91_%EC%84%9C%EC%82%BC%EB%A6%89_%ED%9A%A8%EB%A6%89_%EB%8A%A5%EC%B9%A8.jpg') },
  13: { photo: WM + '3/35/Shin.Saimdang-Chochungdo-01.jpg/330px-Shin.Saimdang-Chochungdo-01.jpg', src: 'kings/relic_13.png', name: '신사임당 초충도', caption: '그 무렵 신사임당이 그린 풀과 벌레 그림, 초충도', credit: C('신사임당', '퍼블릭 도메인', 'Shin.Saimdang-Chochungdo-01.jpg') },
  14: { photo: WM + '2/2e/Geobukseon_reconstructed.jpg/330px-Geobukseon_reconstructed.jpg', src: 'kings/relic_14.png', name: '거북선', caption: '임진왜란 때 이순신 장군의 거북선 (다시 만든 배)', credit: C('Moody75', 'CC BY-SA 2.0', 'Geobukseon_reconstructed.jpg') },
  15: { photo: WM + '2/2f/Dongui_Bogam_in_museum.jpg/330px-Dongui_Bogam_in_museum.jpg', src: 'kings/relic_15.png', name: '동의보감', caption: '광해군 때(1610) 허준이 완성한 동의보감', credit: C('Salamander724', '퍼블릭 도메인', 'Dongui_Bogam_in_museum.jpg') },
  16: { photo: WM + '5/5e/Korea-Namhansanseong-06.jpg/330px-Korea-Namhansanseong-06.jpg', src: 'kings/relic_16.png', name: '남한산성', caption: '병자호란 때 인조가 피했던 남한산성', credit: C('Steve46814', 'CC BY-SA 3.0', 'Korea-Namhansanseong-06.jpg') },
  17: { photo: WM + 'd/d9/Royal_Tomb_of_King_Hyojong_23.jpg/330px-Royal_Tomb_of_King_Hyojong_23.jpg', name: '영릉', caption: '효종이 잠든 영릉 (여주)', credit: C('Altostratus', 'CC BY-SA 4.0', 'Royal_Tomb_of_King_Hyojong_23.jpg'), pos: '50% 40%' },
  18: { photo: WM + 'e/e6/%ED%98%BC%EC%B2%9C%EC%9D%98_%EB%B0%8F_%ED%98%BC%EC%B2%9C%EC%8B%9C%EA%B3%84.jpg/330px-%ED%98%BC%EC%B2%9C%EC%9D%98_%EB%B0%8F_%ED%98%BC%EC%B2%9C%EC%8B%9C%EA%B3%84.jpg', src: 'kings/relic_18.png', name: '혼천시계', caption: '현종 때(1669) 송이영이 만든 천문 시계, 혼천시계', credit: C('문화재청', 'CC BY-SA 4.0', '%ED%98%BC%EC%B2%9C%EC%9D%98_%EB%B0%8F_%ED%98%BC%EC%B2%9C%EC%8B%9C%EA%B3%84.jpg'), pos: '35% 25%' },
  19: { photo: WM + '4/4a/Sangpyeong_Tongbo_%28%E5%B8%B8%E5%B9%B3%E9%80%9A%E5%AF%B6%29_%E2%80%93_All_denominations_%28%E4%B8%80%E6%96%87%2C_%E4%BA%8C%E6%96%87%2C_%E4%BA%94%E6%96%87%2C_%E7%99%BE%E6%96%87%29_01.jpg/330px-Sangpyeong_Tongbo_%28%E5%B8%B8%E5%B9%B3%E9%80%9A%E5%AF%B6%29_%E2%80%93_All_denominations_%28%E4%B8%80%E6%96%87%2C_%E4%BA%8C%E6%96%87%2C_%E4%BA%94%E6%96%87%2C_%E7%99%BE%E6%96%87%29_01.jpg', src: 'kings/relic_19.png', name: '상평통보', caption: '숙종 때(1678) 전국에서 쓴 돈, 상평통보', credit: C('Donald Trung Quoc Don', 'CC BY-SA 4.0', 'Sangpyeong_Tongbo_(%E5%B8%B8%E5%B9%B3%E9%80%9A%E5%AF%B6)_%E2%80%93_All_denominations_(%E4%B8%80%E6%96%87,_%E4%BA%8C%E6%96%87,_%E4%BA%94%E6%96%87,_%E7%99%BE%E6%96%87)_01.jpg') },
  20: { photo: WM + '2/21/Uireung%2C2018.jpg/330px-Uireung%2C2018.jpg', name: '의릉', caption: '경종이 잠든 의릉 (서울 성북구)', credit: C('Tombus20032000', 'CC BY-SA 4.0', 'Uireung,2018.jpg') },
  22: { photo: WM + '4/4f/Paldalmun_hwaseong_suwon.JPG/330px-Paldalmun_hwaseong_suwon.JPG', src: 'kings/relic_22.png', name: '수원 화성', caption: '정조 때(1796) 쌓은 수원 화성 팔달문', credit: C('Kbarends', 'CC BY-SA 3.0', 'Paldalmun_hwaseong_suwon.JPG') },
  23: { photo: WM + '6/68/Korean_art-Donggwoldo_detail-Changdeokgung-Seonjeongjeon_and_its_vicinity-01.jpg/330px-Korean_art-Donggwoldo_detail-Changdeokgung-Seonjeongjeon_and_its_vicinity-01.jpg', src: 'kings/relic_23.png', name: '동궐도', caption: '순조 때(1830 무렵) 창덕궁·창경궁을 그린 동궐도', credit: C('도화서 화원들', '퍼블릭 도메인', 'Korean_art-Donggwoldo_detail-Changdeokgung-Seonjeongjeon_and_its_vicinity-01.jpg') },
  24: { photo: WM + '7/7a/Sehando_-_detail.jpg/330px-Sehando_-_detail.jpg', src: 'kings/relic_24.png', name: '세한도', caption: '헌종 때(1844) 김정희가 그린 세한도', credit: C('김정희', '퍼블릭 도메인', 'Sehando_-_detail.jpg') },
};

/** 그림 아래 출처 (사진을 쓴 경우) */
export function kingPictureCredit(order: number): Credit | null {
  const real = REAL_KING_PORTRAITS[order];
  if (real) return real.credit || null;
  return KING_RELICS[order]?.credit || null;
}

/** 이 왕을 나타내는 그림 설명 (어진이 있으면 어진, 없으면 그 시대 대표 유산) */
export function kingPictureCaption(order: number): string {
  const real = REAL_KING_PORTRAITS[order];
  if (real) return `📜 실제 모습: ${real.caption}`;
  const relic = KING_RELICS[order];
  return relic ? `🏯 어진이 전하지 않아 이 시대 대표 유산으로: ${relic.caption}` : '';
}

export const KingFace: React.FC<{ order: number; size?: number; className?: string; title?: string; drawnOnly?: boolean; fill?: boolean }> = ({
  order,
  size = 96,
  className = '',
  title,
  drawnOnly = false,
  fill = false,
}) => {
  const real = drawnOnly ? undefined : REAL_KING_PORTRAITS[order];
  const relic = drawnOnly || real ? undefined : KING_RELICS[order];
  // 사진을 못 불러오면 다음 그림으로 (왕이 바뀌면 처음부터 다시)
  const [bk, setBk] = React.useState<{ o: number; n: number }>({ o: order, n: 0 });
  const broken = bk.o === order ? bk.n : 0;
  const setBroken = (f: number | ((n: number) => number)) => setBk((p) => ({ o: order, n: typeof f === 'function' ? f(p.o === order ? p.n : 0) : f }));
  if (real && !(real.credit && broken)) {
    const crop = real.crop;
    return (
      <img
        src={real.src}
        alt={title || real.caption}
        title={title || real.caption}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        style={{
          ...(fill ? { width: '100%', height: '100%' } : { width: size, height: size }),
          objectPosition: '50% 50%',
          ...(crop ? { objectPosition: crop.origin, transform: `scale(${crop.scale})`, transformOrigin: crop.origin } : null),
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(1)}
      />
    );
  }
  if (relic && broken < (relic.src ? 2 : 1)) {
    const usePixel = broken === 1 && !!relic.src;
    return (
      <img
        src={usePixel ? relic.src : relic.photo}
        alt={title ? `${title} — ${relic.name}` : relic.caption}
        title={title || relic.caption}
        width={size}
        height={size}
        className={`kf-relic ${className}`}
        style={{
          ...(fill ? { width: '100%', height: '100%' } : { width: size, height: size }),
          objectFit: 'cover',
          objectPosition: relic.pos || '50% 50%',
          imageRendering: usePixel ? 'pixelated' : undefined,
        }}
        loading="lazy"
        referrerPolicy="no-referrer"
        draggable={false}
        onError={() => setBroken((b) => b + 1)}
      />
    );
  }
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
