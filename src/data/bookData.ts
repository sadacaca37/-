export interface BookItem {
  id: string;
  title: string;
  author: string;
  category: string;
  coverColor: string;
  bgGradient: string;
  description: string;
  totalPages: number;
  sentences: string[];
}

export const BOOK_CHALLENGE_LIST: BookItem[] = [
  {
    id: 'starry-night',
    title: '별 헤는 밤',
    author: '윤동주',
    category: '한국 현대시',
    coverColor: '#1E293B',
    bgGradient: 'from-slate-900 via-indigo-950 to-slate-900',
    description: '어두운 밤하늘 속에서 순수한 별과 따뜻한 그리움을 노래한 영원한 민족 시인의 대표작.',
    totalPages: 5,
    sentences: [
      '계절이 지나가는 하늘에는 가을로 가득 차 있습니다.',
      '나는 아무 걱정도 없이 가을 속의 별들을 다 헤일 듯합니다.',
      '가슴속에 하나 둘 새겨지는 별을 이제 다 못 헤는 것은',
      '쉬이 아침이 오는 까닭이요, 내일 밤이 남은 까닭이요,',
      '아직 나의 청춘이 다하지 않은 까닭입니다.',
      '별 하나에 추억과',
      '별 하나에 사랑과',
      '별 하나에 쓸쓸함과',
      '별 하나에 동경과',
      '별 하나에 시와',
      '별 하나에 어머니, 어머니,',
      '어머님, 나는 별 하나에 아름다운 말 한마디씩 불러 봅니다.'
    ]
  },
  {
    id: 'little-prince',
    title: '어린 왕자',
    author: '앙투안 드 생텍쥐페리',
    category: '세계 고전문학',
    coverColor: '#0369A1',
    bgGradient: 'from-sky-950 via-blue-950 to-indigo-950',
    description: '사막에서 만난 어린 왕자가 전하는 삶과 관계의 가장 소중한 비밀.',
    totalPages: 4,
    sentences: [
      '사막이 아름다운 것은 어딘가에 우물이 숨겨져 있기 때문이야.',
      '세상에서 가장 어려운 일은 사람이 사람의 마음을 얻는 일이란다.',
      '네가 오후 네 시에 온다면 난 세 시부터 행복해지기 시작할 거야.',
      '시간이 흐를수록 난 점점 더 행복해지겠지.',
      '가장 중요한 것은 눈에 보이지 않아. 오직 마음으로 보아야 올바르게 볼 수 있어.',
      '네 장미가 그토록 소중한 이유는 네가 그 꽃을 위해 쏟은 시간 때문이야.',
      '너는 네가 길들인 것에 언제까지나 책임을 져야 하는 법이란다.'
    ]
  },
  {
    id: 'grass-flower',
    title: '풀꽃',
    author: '나태주',
    category: '한국 서정시',
    coverColor: '#047857',
    bgGradient: 'from-emerald-950 via-teal-950 to-stone-900',
    description: '작고 소박한 일상의 존재들을 따스한 온기로 위로하는 국민 애송시.',
    totalPages: 3,
    sentences: [
      '자세히 보아야 예쁘다',
      '오래 보아야 사랑스럽다',
      '너도 그렇다',
      '기쁨이 머무는 자리에 바람이 불고',
      '꽃잎 하나 피어나는 것은 우주가 열리는 일이다.'
    ]
  },
  {
    id: 'verdant-praise',
    title: '신록예찬',
    author: '이양하',
    category: '한국 현대수필',
    coverColor: '#15803D',
    bgGradient: 'from-green-950 via-emerald-950 to-stone-900',
    description: '초여름 오월의 싱그러운 초록빛 잎사귀들과 생명의 찬연함을 노래한 명수필.',
    totalPages: 4,
    sentences: [
      '봄·여름·가을·겨울, 두루 사시를 통하여 자연의 아름다움과 웅대함에 감탄하지 않을 날이 없지마는,',
      '오월의 신록은 유독 사람의 마음에 청신한 기운을 불어넣어 준다.',
      '어린 나뭇잎들이 연한 비취색으로 돋아나는 모습을 보면 마음에 잔잔한 평화가 깃든다.',
      '눈을 들어 하늘을 우러러보고, 다시 고개를 돌려 산천을 바라보노라면 세상의 모든 시름이 씻겨 내려간다.'
    ]
  }
];
