export interface LyricNote {
  pitch: string; // e.g. 'C4', 'D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C5', 'REST', etc.
  duration: number; // in beats (0.5 = 8th note, 1.0 = quarter note, 1.5 = dotted quarter, etc.)
}

export interface LyricSongItem {
  id: string;
  title: string;
  artist: string;
  year: string;
  genre: string;
  mood: string;
  albumEmoji: string;
  bgGradient: string;
  badgeColor: string;
  tempo: number; // BPM
  melodyNotes: LyricNote[];
  lineMelodies: LyricNote[][]; // 소절별 진짜 멜로디 (가사말에 맞춘 음표)
  lines: string[];
}

export const LYRIC_SONGS_DATA: LyricSongItem[] = [
  {
    id: 'iu-night-letter',
    title: '밤편지',
    artist: '아이유 (IU)',
    year: '2017년',
    genre: '포크 / 어쿠스틱 발라드',
    mood: '서정적이고 고요한 밤의 고백',
    albumEmoji: '🌙',
    bgGradient: 'from-indigo-900 via-slate-800 to-sky-950',
    badgeColor: 'bg-indigo-500',
    tempo: 78,
    melodyNotes: [
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'B4', duration: 0.5 },
      { pitch: 'C5', duration: 0.5 },
      { pitch: 'B4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'G4', duration: 1.5 },
    ],
    lines: [
      '이 밤 그날의 반딧불을',
      '당신의 창 가까이 보낼게요',
      '음 좋은 꿈이길 바라요',
      '나 파도가 머물던 모래 위에',
      '적힌 글씨처럼',
      '그대가 멀리 사라져 버릴 것 같아',
      '늘 그리워 그리워',
      '여기 내 마음속에 모든 말을',
      '다 꺼내어 줄 순 없지만',
      '사랑한다는 말이에요'
    ],
    lineMelodies: [
      // 0: 이 밤 그날의 반딧불을
      [
        { pitch: 'G4', duration: 0.7 },
        { pitch: 'A4', duration: 0.7 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'G4', duration: 1.5 }
      ],
      // 1: 당신의 창 가까이 보낼게요
      [
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'E4', duration: 1.6 }
      ],
      // 2: 음 좋은 꿈이길 바라요
      [
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 3: 나 파도가 머물던 모래 위에
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 1.5 }
      ],
      // 4: 적힌 글씨처럼
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'D5', duration: 1.8 }
      ],
      // 5: 그대가 멀리 사라져 버릴 것 같아
      [
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 1.6 }
      ],
      // 6: 늘 그리워 그리워
      [
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'D5', duration: 1.0 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'G4', duration: 2.0 }
      ],
      // 7: 여기 내 마음속에 모든 말을
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 1.5 }
      ],
      // 8: 다 꺼내어 줄 순 없지만
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 1.6 }
      ],
      // 9: 사랑한다는 말이에요
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'G4', duration: 2.4 }
      ]
    ]
  },
  {
    id: 'bts-spring-day',
    title: '봄날 (Spring Day)',
    artist: '방탄소년단 (BTS)',
    year: '2017년',
    genre: '얼터너티브 힙합 / 팝',
    mood: '그리움과 다시 만날 희망',
    albumEmoji: '🌸',
    bgGradient: 'from-sky-900 via-teal-800 to-indigo-950',
    badgeColor: 'bg-pink-500',
    tempo: 108,
    melodyNotes: [
      { pitch: 'F4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'C5', duration: 1.0 },
      { pitch: 'C5', duration: 0.5 },
      { pitch: 'D5', duration: 0.5 },
      { pitch: 'C5', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'F4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 1.0 },
      { pitch: 'F4', duration: 0.5 },
      { pitch: 'D4', duration: 0.5 },
      { pitch: 'F4', duration: 2.0 },
    ],
    lines: [
      '보고 싶다 이렇게 말하니까 더 보고 싶다',
      '너희 사진을 보고 있어도 보고 싶다',
      '너무 야속한 시간 나는 우리가 밉다',
      '눈꽃이 떨어져요 또 조금씩 멀어져요',
      '보고 싶다 보고 싶다',
      '얼마나 기다려야 또 몇 밤을 더 새워야',
      '널 보게 될까 만나게 될까',
      '추운 겨울 끝을 지나 다시 봄날이 올 때까지',
      '꽃 피울 때까지 그곳에 좀 더 머물러줘',
      '머물러줘'
    ],
    lineMelodies: [
      // 0: 보고 싶다 이렇게 말하니까 더 보고 싶다
      [
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.9 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'D5', duration: 0.4 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.9 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'D4', duration: 0.5 },
        { pitch: 'F4', duration: 1.5 }
      ],
      // 1: 너희 사진을 보고 있어도 보고 싶다
      [
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.9 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'D5', duration: 0.4 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.9 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'D4', duration: 0.5 },
        { pitch: 'F4', duration: 1.5 }
      ],
      // 2: 너무 야속한 시간 나는 우리가 밉다
      [
        { pitch: 'D4', duration: 0.5 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'D4', duration: 1.5 }
      ],
      // 3: 눈꽃이 떨어져요 또 조금씩 멀어져요
      [
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'F5', duration: 0.8 },
        { pitch: 'E5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 1.6 }
      ],
      // 4: 보고 싶다 보고 싶다
      [
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F4', duration: 1.0 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F4', duration: 1.8 }
      ],
      // 5: 얼마나 기다려야 또 몇 밤을 더 새워야
      [
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'C5', duration: 1.6 }
      ],
      // 6: 널 보게 될까 만나게 될까
      [
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F4', duration: 1.0 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F4', duration: 1.8 }
      ],
      // 7: 추운 겨울 끝을 지나 다시 봄날이 올 때까지
      [
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'F5', duration: 0.8 },
        { pitch: 'E5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F4', duration: 1.6 }
      ],
      // 8: 꽃 피울 때까지 그곳에 좀 더 머물러줘
      [
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'F4', duration: 1.6 }
      ],
      // 9: 머물러줘
      [
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'F4', duration: 0.8 },
        { pitch: 'D4', duration: 0.8 },
        { pitch: 'F4', duration: 2.4 }
      ]
    ]
  },
  {
    id: 'jannabi-lovers',
    title: '주저하는 연인들을 위해',
    artist: '잔나비 (Jannabi)',
    year: '2019년',
    genre: '인디 록 / 빈티지 팝',
    mood: '레트로한 감성과 아련한 사랑',
    albumEmoji: '🪐',
    bgGradient: 'from-amber-950 via-stone-850 to-orange-950',
    badgeColor: 'bg-amber-600',
    tempo: 72,
    melodyNotes: [
      { pitch: 'C4', duration: 0.5 },
      { pitch: 'D4', duration: 0.5 },
      { pitch: 'E4', duration: 1.0 },
      { pitch: 'G4', duration: 1.0 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'E4', duration: 1.0 },
      { pitch: 'D4', duration: 1.0 },
      { pitch: 'C4', duration: 2.0 },
    ],
    lines: [
      '나는 읽기 쉬운 마음이야',
      '당신도 스윽 훑고 가셔요',
      '달랠 길 없는 외로운 마음 있지',
      '머물다 가셔요 음',
      '내게 긴 여운을 남겨줘요',
      '사랑을 사랑을 해줘요',
      '할 수 있다면 그럴 수만 있다면',
      '새하얀 빛으로 그댈 태워 띄울게요',
      '그러다 밤이 찾아오면',
      '우리 둘만의 별이 되어'
    ],
    lineMelodies: [
      // 0: 나는 읽기 쉬운 마음이야
      [
        { pitch: 'C4', duration: 0.6 },
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'E4', duration: 0.8 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 0.8 },
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'C4', duration: 1.8 }
      ],
      // 1: 당신도 스윽 훑고 가셔요
      [
        { pitch: 'C4', duration: 0.6 },
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'E4', duration: 0.8 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 2: 달랠 길 없는 외로운 마음 있지
      [
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 1.6 }
      ],
      // 3: 머물다 가셔요 음
      [
        { pitch: 'D4', duration: 0.7 },
        { pitch: 'E4', duration: 0.7 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'G4', duration: 2.2 }
      ],
      // 4: 내게 긴 여운을 남겨줘요
      [
        { pitch: 'C4', duration: 0.6 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 5: 사랑을 사랑을 해줘요
      [
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 6: 할 수 있다면 그럴 수만 있다면
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.6 }
      ],
      // 7: 새하얀 빛으로 그댈 태워 띄울게요
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 8: 그러다 밤이 찾아오면
      [
        { pitch: 'C5', duration: 0.7 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'C4', duration: 1.8 }
      ],
      // 9: 우리 둘만의 별이 되어
      [
        { pitch: 'C4', duration: 0.7 },
        { pitch: 'E4', duration: 0.7 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'C5', duration: 1.0 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C5', duration: 2.4 }
      ]
    ]
  },
  {
    id: 'akmu-how-can-i-love',
    title: '어떻게 이별까지 사랑하겠어, 널 사랑하는 거지',
    artist: 'AKMU (악뮤)',
    year: '2019년',
    genre: '포크 발라드',
    mood: '바다처럼 깊고 절절한 사랑의 울림',
    albumEmoji: '🌊',
    bgGradient: 'from-blue-950 via-cyan-900 to-slate-900',
    badgeColor: 'bg-blue-500',
    tempo: 75,
    melodyNotes: [
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'G#4', duration: 1.0 },
      { pitch: 'B4', duration: 1.0 },
      { pitch: 'G#4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'E4', duration: 2.0 },
    ],
    lines: [
      '일부러 몇 발자국 물러나',
      '내가 없이 혼자 걷는 널 바라본다',
      '옆자리 허전한 너의 풍경',
      '흑백 거리 가운데 넌 뒤돌아본다',
      '어떻게 내가 어떻게 너를',
      '이후에 우리 바다처럼 깊은 사랑이',
      '다 마를 때까지 기다리는 게 이별일 텐데',
      '어떻게 내가 어떻게 너를',
      '이별까지 사랑하겠어',
      '널 사랑하는 거지'
    ],
    lineMelodies: [
      // 0: 일부러 몇 발자국 물러나
      [
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 1: 내가 없이 혼자 걷는 널 바라본다
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.5 },
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'F#4', duration: 1.6 }
      ],
      // 2: 옆자리 허전한 너의 풍경
      [
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 3: 흑백 거리 가운데 넌 뒤돌아본다
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 4: 어떻게 내가 어떻게 너를
      [
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 5: 이후에 우리 바다처럼 깊은 사랑이
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D#5', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.6 }
      ],
      // 6: 다 마를 때까지 기다리는 게 이별일 텐데
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G#4', duration: 0.5 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'G#4', duration: 0.5 },
        { pitch: 'F#4', duration: 0.5 },
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.8 },
        { pitch: 'E4', duration: 2.0 }
      ],
      // 7: 어떻게 내가 어떻게 너를
      [
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G#4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 8: 이별까지 사랑하겠어
      [
        { pitch: 'B4', duration: 0.7 },
        { pitch: 'C#5', duration: 0.7 },
        { pitch: 'D#5', duration: 0.8 },
        { pitch: 'E5', duration: 1.0 },
        { pitch: 'D#5', duration: 0.7 },
        { pitch: 'C#5', duration: 0.7 },
        { pitch: 'B4', duration: 1.8 }
      ],
      // 9: 널 사랑하는 거지
      [
        { pitch: 'G#4', duration: 0.8 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'B4', duration: 1.0 },
        { pitch: 'G#4', duration: 0.8 },
        { pitch: 'F#4', duration: 0.8 },
        { pitch: 'E4', duration: 2.5 }
      ]
    ]
  },
  {
    id: 'lee-traffic-light',
    title: '신호등',
    artist: '이무진 (Lee Mu-jin)',
    year: '2021년',
    genre: '포크 팝 / 인디',
    mood: '청춘의 방황과 솔직한 고민',
    albumEmoji: '🚦',
    bgGradient: 'from-amber-950 via-yellow-950 to-red-950',
    badgeColor: 'bg-yellow-500',
    tempo: 122,
    melodyNotes: [
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'B4', duration: 0.5 },
      { pitch: 'B4', duration: 0.5 },
      { pitch: 'C5', duration: 0.5 },
      { pitch: 'B4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 1.0 },
    ],
    lines: [
      '붉은색 푸른색 그 사이 3초 그 짧은 시간',
      '노란색 빛을 내는 저기 저 신호등이',
      '내 머릿속을 텅 비워버려',
      '내가 빠른지도 느린지도 모르겠어',
      '그저 눈앞이 깜빡여',
      '이제야 목적지를 정했는데',
      '다 빨간불이잖아',
      '난 아직 출발도 못 했는데',
      '괴롭혀 괴롭혀 날',
      '저 신호등이 날 괴롭혀'
    ],
    lineMelodies: [
      // 0: 붉은색 푸른색 그 사이 3초 그 짧은 시간
      [
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 1.2 }
      ],
      // 1: 노란색 빛을 내는 저기 저 신호등이
      [
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 1.4 }
      ],
      // 2: 내 머릿속을 텅 비워버려
      [
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 1.6 }
      ],
      // 3: 내가 빠른지도 느린지도 모르겠어
      [
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'D4', duration: 0.4 },
        { pitch: 'E4', duration: 1.5 }
      ],
      // 4: 그저 눈앞이 깜빡여
      [
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 5: 이제야 목적지를 정했는데
      [
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'A4', duration: 1.5 }
      ],
      // 6: 다 빨간불이잖아
      [
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 7: 난 아직 출발도 못 했는데
      [
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 1.5 }
      ],
      // 8: 괴롭혀 괴롭혀 날
      [
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 9: 저 신호등이 날 괴롭혀
      [
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 2.2 }
      ]
    ]
  },
  {
    id: 'newjeans-ditto',
    title: 'Ditto',
    artist: 'NewJeans (뉴진스)',
    year: '2022년',
    genre: '볼티모어 클럽 / 댄스 팝',
    mood: '몽환적이고 아련한 겨울 Y2K 감성',
    albumEmoji: '🎧',
    bgGradient: 'from-zinc-900 via-stone-850 to-neutral-950',
    badgeColor: 'bg-zinc-600',
    tempo: 134,
    melodyNotes: [
      { pitch: 'F4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'C5', duration: 0.5 },
      { pitch: 'D5', duration: 0.5 },
      { pitch: 'C5', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'F4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 1.5 },
    ],
    lines: [
      'Stay in the middle Like you a little',
      'Don’t want no riddle 말해줘 say it back',
      'Oh say it ditto 아침은 너무 멀어',
      'So say it ditto 훌쩍 커버렸어',
      '함께한 기억처럼 널 보면',
      '내 마음은 어느새 여름 지나 가을',
      '기다렸지 all this time',
      'Do you want somebody Like I want somebody',
      '날 보고 웃었지만 Do you think about me now',
      'Yeah all the time yeah all the time'
    ],
    lineMelodies: [
      // 0: Stay in the middle Like you a little
      [
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 1.4 }
      ],
      // 1: Don’t want no riddle 말해줘 say it back
      [
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'F4', duration: 1.4 }
      ],
      // 2: Oh say it ditto 아침은 너무 멀어
      [
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'D5', duration: 0.4 },
        { pitch: 'F5', duration: 0.6 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 1.4 }
      ],
      // 3: So say it ditto 훌쩍 커버렸어
      [
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'D5', duration: 0.4 },
        { pitch: 'F5', duration: 0.6 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'F4', duration: 1.5 }
      ],
      // 4: 함께한 기억처럼 널 보면
      [
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 1.4 }
      ],
      // 5: 내 마음은 어느새 여름 지나 가을
      [
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'F5', duration: 0.6 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'F4', duration: 1.4 }
      ],
      // 6: 기다렸지 all this time
      [
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'F4', duration: 1.8 }
      ],
      // 7: Do you want somebody Like I want somebody
      [
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 1.4 }
      ],
      // 8: 날 보고 웃었지만 Do you think about me now
      [
        { pitch: 'D5', duration: 0.4 },
        { pitch: 'F5', duration: 0.5 },
        { pitch: 'D5', duration: 0.4 },
        { pitch: 'C5', duration: 0.4 },
        { pitch: 'A4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'F4', duration: 0.4 },
        { pitch: 'G4', duration: 0.4 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'C5', duration: 1.4 }
      ],
      // 9: Yeah all the time yeah all the time
      [
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'F4', duration: 1.0 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'F4', duration: 2.0 }
      ]
    ]
  },
  {
    id: 'yb-butterfly',
    title: '나는 나비',
    artist: 'YB (윤도현 밴드)',
    year: '2006년',
    genre: '모던 록 / 팝 록',
    mood: '가슴 벅찬 희망과 비상의 메시지',
    albumEmoji: '🦋',
    bgGradient: 'from-orange-950 via-amber-900 to-stone-900',
    badgeColor: 'bg-orange-600',
    tempo: 130,
    melodyNotes: [
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'B4', duration: 1.0 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'E4', duration: 2.0 },
    ],
    lines: [
      '내 모습이 보이지 않아',
      '앞길도 보이지 않아',
      '나는 아주 작은 애벌레',
      '살아가고 있어',
      '날개를 활짝 펴고',
      '세상을 자유롭게 날거야',
      '노래하며 춤추는',
      '화려한 나비처럼',
      '날개를 활짝 펴고',
      '자유롭게 날거야'
    ],
    lineMelodies: [
      // 0: 내 모습이 보이지 않아
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 1: 앞길도 보이지 않아
      [
        { pitch: 'E4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 2: 나는 아주 작은 애벌레
      [
        { pitch: 'E4', duration: 0.4 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 1.6 }
      ],
      // 3: 살아가고 있어
      [
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'E4', duration: 2.0 }
      ],
      // 4: 날개를 활짝 펴고
      [
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 1.6 }
      ],
      // 5: 세상을 자유롭게 날거야
      [
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'F#5', duration: 0.8 },
        { pitch: 'E5', duration: 0.6 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 1.8 }
      ],
      // 6: 노래하며 춤추는
      [
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 1.6 }
      ],
      // 7: 화려한 나비처럼
      [
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 8: 날개를 활짝 펴고
      [
        { pitch: 'B4', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.5 },
        { pitch: 'C5', duration: 0.5 },
        { pitch: 'B4', duration: 1.6 }
      ],
      // 9: 자유롭게 날거야
      [
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'E5', duration: 0.6 },
        { pitch: 'F#5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'E5', duration: 2.5 }
      ]
    ]
  },
  {
    id: 'buzz-thorn',
    title: '가시',
    artist: '버즈 (Buzz)',
    year: '2005년',
    genre: '록 발라드',
    mood: '노래방 전설의 락발라드 애절함',
    albumEmoji: '🎸',
    bgGradient: 'from-zinc-950 via-red-950 to-neutral-950',
    badgeColor: 'bg-red-700',
    tempo: 74,
    melodyNotes: [
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'B4', duration: 1.0 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'E4', duration: 2.0 },
    ],
    lines: [
      '가시처럼 깊게 박힌 기억은',
      '아파도 지울 수 없어',
      '너를 사랑했던 마음은',
      '여전히 그대로인데',
      '제발 가지 말라고 애원해도',
      '돌아서는 너의 뒷모습에',
      '내 가슴은 찢어질 듯 아파와',
      '잊으려 해도 잊을 수 없는',
      '너의 기억 속에 살아',
      '영원히 널 사랑해'
    ],
    lineMelodies: [
      // 0: 가시처럼 깊게 박힌 기억은
      [
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 1: 아파도 지울 수 없어
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.8 }
      ],
      // 2: 너를 사랑했던 마음은
      [
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 3: 여전히 그대로인데
      [
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 4: 제발 가지 말라고 애원해도
      [
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 5: 돌아서는 너의 뒷모습에
      [
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'F#5', duration: 0.8 },
        { pitch: 'E5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 1.8 }
      ],
      // 6: 내 가슴은 찢어질 듯 아파와
      [
        { pitch: 'E5', duration: 0.6 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.8 }
      ],
      // 7: 잊으려 해도 잊을 수 없는
      [
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 8: 너의 기억 속에 살아
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'C5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 9: 영원히 널 사랑해
      [
        { pitch: 'F#4', duration: 0.7 },
        { pitch: 'G4', duration: 0.7 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'B4', duration: 1.0 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'F#4', duration: 0.8 },
        { pitch: 'E4', duration: 2.5 }
      ]
    ]
  },
  {
    id: 'sung-every-moment',
    title: '너의 모든 순간',
    artist: '성시경 (Sung Si-kyung)',
    year: '2014년',
    genre: '발라드 / 드라마 OST',
    mood: '별에서 온 그대, 눈부시게 다정한 사랑',
    albumEmoji: '✨',
    bgGradient: 'from-slate-900 via-indigo-950 to-blue-950',
    badgeColor: 'bg-indigo-600',
    tempo: 70,
    melodyNotes: [
      { pitch: 'D4', duration: 0.5 },
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'G4', duration: 0.5 },
      { pitch: 'A4', duration: 1.0 },
      { pitch: 'B4', duration: 0.5 },
      { pitch: 'C#5', duration: 0.5 },
      { pitch: 'D5', duration: 1.5 },
    ],
    lines: [
      '이윽고 내가 한눈에 너를 알아봤을 때',
      '모든 건 분명 달라지고 있었어',
      '내 세상은 널 알기 전과 후로 나뉘어',
      '네가 숨 쉬면 따스한 바람이 불어와',
      '네가 웃으면 눈부신 햇살이 비쳐',
      '거기 있는 그대로 머물러줘',
      '너의 모든 순간 그게 나였으면 좋겠다',
      '생각만 해도 가슴이 차올라',
      '온통 너로 가득 차',
      '너의 모든 순간'
    ],
    lineMelodies: [
      // 0: 이윽고 내가 한눈에 너를 알아봤을 때
      [
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 1: 모든 건 분명 달라지고 있었어
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 2: 내 세상은 널 알기 전과 후로 나뉘어
      [
        { pitch: 'F#4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.8 }
      ],
      // 3: 네가 숨 쉬면 따스한 바람이 불어와
      [
        { pitch: 'D4', duration: 0.5 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.8 }
      ],
      // 4: 네가 웃으면 눈부신 햇살이 비쳐
      [
        { pitch: 'D4', duration: 0.5 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 5: 거기 있는 그대로 머물러줘
      [
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 1.8 }
      ],
      // 6: 너의 모든 순간 그게 나였으면 좋겠다
      [
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 7: 생각만 해도 가슴이 차올라
      [
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 8: 온통 너로 가득 차
      [
        { pitch: 'F#4', duration: 0.7 },
        { pitch: 'A4', duration: 0.7 },
        { pitch: 'D5', duration: 0.9 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 9: 너의 모든 순간
      [
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'F#4', duration: 0.8 },
        { pitch: 'E4', duration: 0.8 },
        { pitch: 'D4', duration: 0.8 },
        { pitch: 'E4', duration: 1.0 },
        { pitch: 'D4', duration: 2.5 }
      ]
    ]
  },
  {
    id: 'paul-kim-every-day',
    title: '모든 날, 모든 순간',
    artist: '폴킴 (Paul Kim)',
    year: '2018년',
    genre: '어쿠스틱 발라드 / OST',
    mood: '축가 1위, 진심 어린 사랑의 맹세',
    albumEmoji: '💐',
    bgGradient: 'from-amber-950 via-rose-950 to-stone-900',
    badgeColor: 'bg-rose-500',
    tempo: 72,
    melodyNotes: [
      { pitch: 'D4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'B4', duration: 1.0 },
      { pitch: 'A4', duration: 0.5 },
      { pitch: 'F#4', duration: 0.5 },
      { pitch: 'E4', duration: 0.5 },
      { pitch: 'D4', duration: 2.0 },
    ],
    lines: [
      '네가 없이 웃을 수 있을까',
      '생각만 해도 눈물이나',
      '힘겨운 날에도 너 하나만 있다면',
      '다시 힘을 내곤 해',
      '불안했던 내 삶에',
      '한 줄기 빛이 되어준',
      '모든 날 모든 순간 함께해',
      '햇살처럼 포근하게 감싸줘',
      '바람처럼 부드럽게 안아줘',
      '늘 곁에 있어줘'
    ],
    lineMelodies: [
      // 0: 네가 없이 웃을 수 있을까
      [
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 0.6 },
        { pitch: 'D4', duration: 1.8 }
      ],
      // 1: 생각만 해도 눈물이나
      [
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.8 }
      ],
      // 2: 힘겨운 날에도 너 하나만 있다면
      [
        { pitch: 'F#4', duration: 0.5 },
        { pitch: 'G4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F#4', duration: 1.8 }
      ],
      // 3: 다시 힘을 내곤 해
      [
        { pitch: 'E4', duration: 0.7 },
        { pitch: 'F#4', duration: 0.7 },
        { pitch: 'G4', duration: 0.8 },
        { pitch: 'F#4', duration: 0.7 },
        { pitch: 'E4', duration: 0.7 },
        { pitch: 'D4', duration: 2.0 }
      ],
      // 4: 불안했던 내 삶에
      [
        { pitch: 'F#4', duration: 0.7 },
        { pitch: 'A4', duration: 0.7 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'D5', duration: 1.0 },
        { pitch: 'C#5', duration: 1.8 }
      ],
      // 5: 한 줄기 빛이 되어준
      [
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 6: 모든 날 모든 순간 함께해
      [
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'G4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'E4', duration: 1.8 }
      ],
      // 7: 햇살처럼 포근하게 감싸줘
      [
        { pitch: 'D4', duration: 0.6 },
        { pitch: 'F#4', duration: 0.6 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'A4', duration: 1.8 }
      ],
      // 8: 바람처럼 부드럽게 안아줘
      [
        { pitch: 'D4', duration: 0.5 },
        { pitch: 'F#4', duration: 0.5 },
        { pitch: 'A4', duration: 0.6 },
        { pitch: 'B4', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'D5', duration: 0.8 },
        { pitch: 'E5', duration: 0.8 },
        { pitch: 'D5', duration: 0.6 },
        { pitch: 'C#5', duration: 0.6 },
        { pitch: 'B4', duration: 1.8 }
      ],
      // 9: 늘 곁에 있어줘
      [
        { pitch: 'A4', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'D5', duration: 1.0 },
        { pitch: 'C#5', duration: 0.8 },
        { pitch: 'B4', duration: 0.8 },
        { pitch: 'A4', duration: 1.0 },
        { pitch: 'D4', duration: 2.5 }
      ]
    ]
  }
];
