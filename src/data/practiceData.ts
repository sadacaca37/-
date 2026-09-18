import { KeyData, PracticeStage, ShortcutQuizItem } from '../types';

export const KEYBOARD_LAYOUT: KeyData[][] = [
  // Number Row
  [
    { code: 'Backquote', charKo: '`', charKoShift: '~', charEn: '`', charEnShift: '~', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'Digit1', charKo: '1', charKoShift: '!', charEn: '1', charEnShift: '!', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'Digit2', charKo: '2', charKoShift: '@', charEn: '2', charEnShift: '@', finger: 'left-ring', fingerName: '왼약지', hand: 'left' },
    { code: 'Digit3', charKo: '3', charKoShift: '#', charEn: '3', charEnShift: '#', finger: 'left-middle', fingerName: '왼중지', hand: 'left' },
    { code: 'Digit4', charKo: '4', charKoShift: '$', charEn: '4', charEnShift: '$', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'Digit5', charKo: '5', charKoShift: '%', charEn: '5', charEnShift: '%', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'Digit6', charKo: '6', charKoShift: '^', charEn: '6', charEnShift: '^', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'Digit7', charKo: '7', charKoShift: '&', charEn: '7', charEnShift: '&', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'Digit8', charKo: '8', charKoShift: '*', charEn: '8', charEnShift: '*', finger: 'right-middle', fingerName: '오른중지', hand: 'right' },
    { code: 'Digit9', charKo: '9', charKoShift: '(', charEn: '9', charEnShift: '(', finger: 'right-ring', fingerName: '오른약지', hand: 'right' },
    { code: 'Digit0', charKo: '0', charKoShift: ')', charEn: '0', charEnShift: ')', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'Minus', charKo: '-', charKoShift: '_', charEn: '-', charEnShift: '_', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'Equal', charKo: '=', charKoShift: '+', charEn: '=', charEnShift: '+', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'Backspace', charKo: '←', charEn: 'Back', display: 'Backspace', width: 'w-16 sm:w-20', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
  ],
  // Top Row (QWERTY)
  [
    { code: 'Tab', charKo: 'Tab', charEn: 'Tab', display: 'Tab', width: 'w-14 sm:w-16', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'KeyQ', charKo: 'ㅂ', charKoShift: 'ㅃ', charEn: 'q', charEnShift: 'Q', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'KeyW', charKo: 'ㅈ', charKoShift: 'ㅉ', charEn: 'w', charEnShift: 'W', finger: 'left-ring', fingerName: '왼약지', hand: 'left' },
    { code: 'KeyE', charKo: 'ㄷ', charKoShift: 'ㄸ', charEn: 'e', charEnShift: 'E', finger: 'left-middle', fingerName: '왼중지', hand: 'left' },
    { code: 'KeyR', charKo: 'ㄱ', charKoShift: 'ㄲ', charEn: 'r', charEnShift: 'R', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'KeyT', charKo: 'ㅅ', charKoShift: 'ㅆ', charEn: 't', charEnShift: 'T', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'KeyY', charKo: 'ㅛ', charEn: 'y', charEnShift: 'Y', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'KeyU', charKo: 'ㅕ', charEn: 'u', charEnShift: 'U', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'KeyI', charKo: 'ㅑ', charEn: 'i', charEnShift: 'I', finger: 'right-middle', fingerName: '오른중지', hand: 'right' },
    { code: 'KeyO', charKo: 'ㅐ', charKoShift: 'ㅒ', charEn: 'o', charEnShift: 'O', finger: 'right-ring', fingerName: '오른약지', hand: 'right' },
    { code: 'KeyP', charKo: 'ㅔ', charKoShift: 'ㅖ', charEn: 'p', charEnShift: 'P', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'BracketLeft', charKo: '[', charKoShift: '{', charEn: '[', charEnShift: '{', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'BracketRight', charKo: ']', charKoShift: '}', charEn: ']', charEnShift: '}', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'Backslash', charKo: '\\', charKoShift: '|', charEn: '\\', charEnShift: '|', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
  ],
  // Home Row (ASDF)
  [
    { code: 'CapsLock', charKo: 'Caps', charEn: 'Caps', display: 'Caps', width: 'w-16 sm:w-20', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'KeyA', charKo: 'ㅁ', charEn: 'a', charEnShift: 'A', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'KeyS', charKo: 'ㄴ', charEn: 's', charEnShift: 'S', finger: 'left-ring', fingerName: '왼약지', hand: 'left' },
    { code: 'KeyD', charKo: 'ㅇ', charEn: 'd', charEnShift: 'D', finger: 'left-middle', fingerName: '왼중지', hand: 'left' },
    { code: 'KeyF', charKo: 'ㄹ', charEn: 'f', charEnShift: 'F', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'KeyG', charKo: 'ㅎ', charEn: 'g', charEnShift: 'G', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'KeyH', charKo: 'ㅗ', charEn: 'h', charEnShift: 'H', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'KeyJ', charKo: 'ㅓ', charEn: 'j', charEnShift: 'J', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'KeyK', charKo: 'ㅏ', charEn: 'k', charEnShift: 'K', finger: 'right-middle', fingerName: '오른중지', hand: 'right' },
    { code: 'KeyL', charKo: 'ㅣ', charEn: 'l', charEnShift: 'L', finger: 'right-ring', fingerName: '오른약지', hand: 'right' },
    { code: 'Semicolon', charKo: ';', charKoShift: ':', charEn: ';', charEnShift: ':', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'Quote', charKo: '\'', charKoShift: '"', charEn: '\'', charEnShift: '"', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'Enter', charKo: 'Enter', charEn: 'Enter', display: 'Enter ↵', width: 'w-18 sm:w-24', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
  ],
  // Bottom Row (ZXCV)
  [
    { code: 'ShiftLeft', charKo: 'Shift', charEn: 'Shift', display: 'Shift ⇧', width: 'w-20 sm:w-24', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'KeyZ', charKo: 'ㅋ', charEn: 'z', charEnShift: 'Z', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'KeyX', charKo: 'ㅌ', charEn: 'x', charEnShift: 'X', finger: 'left-ring', fingerName: '왼약지', hand: 'left' },
    { code: 'KeyC', charKo: 'ㅊ', charEn: 'c', charEnShift: 'C', finger: 'left-middle', fingerName: '왼중지', hand: 'left' },
    { code: 'KeyV', charKo: 'ㅍ', charEn: 'v', charEnShift: 'V', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'KeyB', charKo: 'ㅠ', charEn: 'b', charEnShift: 'B', finger: 'left-index', fingerName: '왼검지', hand: 'left' },
    { code: 'KeyN', charKo: 'ㅜ', charEn: 'n', charEnShift: 'N', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'KeyM', charKo: 'ㅡ', charEn: 'm', charEnShift: 'M', finger: 'right-index', fingerName: '오른검지', hand: 'right' },
    { code: 'Comma', charKo: ',', charKoShift: '<', charEn: ',', charEnShift: '<', finger: 'right-middle', fingerName: '오른중지', hand: 'right' },
    { code: 'Period', charKo: '.', charKoShift: '>', charEn: '.', charEnShift: '>', finger: 'right-ring', fingerName: '오른약지', hand: 'right' },
    { code: 'Slash', charKo: '/', charKoShift: '?', charEn: '/', charEnShift: '?', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
    { code: 'ShiftRight', charKo: 'Shift', charEn: 'Shift', display: 'Shift ⇧', width: 'w-20 sm:w-24', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
  ],
  // Space Row
  [
    { code: 'ControlLeft', charKo: 'Ctrl', charEn: 'Ctrl', display: 'Ctrl', width: 'w-14 sm:w-16', finger: 'left-pinky', fingerName: '왼새끼', hand: 'left' },
    { code: 'AltLeft', charKo: 'Alt', charEn: 'Alt', display: 'Alt', width: 'w-14 sm:w-16', finger: 'left-pinky', fingerName: '왼엄지', hand: 'left' },
    { code: 'Space', charKo: ' ', charEn: ' ', display: 'Space Bar (스페이스바)', width: 'flex-1 max-w-xl', finger: 'thumb', fingerName: '양손 엄지', hand: 'both' },
    { code: 'AltRight', charKo: '한/영', charEn: 'Alt', display: '한/영', width: 'w-14 sm:w-16', finger: 'right-pinky', fingerName: '오른엄지', hand: 'right' },
    { code: 'ControlRight', charKo: 'Ctrl', charEn: 'Ctrl', display: 'Ctrl', width: 'w-14 sm:w-16', finger: 'right-pinky', fingerName: '오른새끼', hand: 'right' },
  ]
];

export const FINGER_COLORS: Record<string, { bg: string; text: string; border: string; activeBg: string; name: string }> = {
  'left-pinky': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', activeBg: 'bg-purple-500', name: '왼손 새끼손가락' },
  'left-ring': { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300', activeBg: 'bg-indigo-500', name: '왼손 약지손가락' },
  'left-middle': { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-300', activeBg: 'bg-sky-500', name: '왼손 중지손가락' },
  'left-index': { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300', activeBg: 'bg-teal-500', name: '왼손 검지손가락' },
  'thumb': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', activeBg: 'bg-amber-500', name: '양손 엄지손가락' },
  'right-index': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', activeBg: 'bg-emerald-500', name: '오른손 검지손가락' },
  'right-middle': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300', activeBg: 'bg-cyan-500', name: '오른손 중지손가락' },
  'right-ring': { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300', activeBg: 'bg-pink-500', name: '오른손 약지손가락' },
  'right-pinky': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300', activeBg: 'bg-rose-500', name: '오른손 새끼손가락' },
};

// 1. 자리 연습 단계별 데이터 (한글 1~8단계) - 오직 한 글자씩(단일 키) 출제
export const KOREAN_KEY_PRACTICE_STAGES: PracticeStage[] = [
  {
    id: 1,
    title: '1단계: 기본 홈 포지션',
    subtitle: '키보드의 기준점! 왼손(ㅁㄴㅇㄹ)과 오른손(ㅓㅏㅣ;) 5분 한 글자씩 연습',
    keys: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';'],
    sampleList: [
      'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';',
      'ㅁ', 'ㅓ', 'ㄴ', 'ㅏ', 'ㅇ', 'ㅣ', 'ㄹ', ';',
      'ㄹ', 'ㅇ', 'ㄴ', 'ㅁ', ';', 'ㅣ', 'ㅏ', 'ㅓ',
      'ㅁ', 'ㄹ', 'ㄴ', 'ㅇ', 'ㅓ', 'ㅣ', 'ㅏ', ';',
      'ㅇ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅣ', 'ㅏ', ';', 'ㅓ',
      'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';',
      'ㅓ', 'ㅏ', 'ㅣ', ';', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ',
      'ㅁ', 'ㅓ', 'ㅇ', 'ㅣ', 'ㄴ', 'ㅏ', 'ㄹ', ';'
    ]
  },
  {
    id: 2,
    title: '2단계: 왼손 윗자리',
    subtitle: '왼손 손가락을 위로 뻗어 ㅂ, ㅈ, ㄷ, ㄱ, ㅅ 한 글자씩 연습',
    keys: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ'],
    sampleList: [
      'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ',
      'ㄱ', 'ㄷ', 'ㅂ', 'ㅅ', 'ㅈ', 'ㅇ', 'ㄹ', 'ㅁ', 'ㄴ',
      'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ',
      'ㅅ', 'ㄱ', 'ㄷ', 'ㅈ', 'ㅂ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ',
      'ㅂ', 'ㄷ', 'ㅅ', 'ㅈ', 'ㄱ', 'ㄴ', 'ㄹ', 'ㅁ', 'ㅇ',
      'ㄱ', 'ㅅ', 'ㅂ', 'ㅈ', 'ㄷ', 'ㄹ', 'ㅇ', 'ㄴ', 'ㅁ',
      'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㄱ', 'ㄷ', 'ㅅ', 'ㅂ'
    ]
  },
  {
    id: 3,
    title: '3단계: 오른손 윗자리',
    subtitle: '오른손 손가락을 위로 뻗어 ㅛ, ㅕ, ㅑ, ㅐ, ㅔ 한 글자씩 연습',
    keys: ['ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
    sampleList: [
      'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ',
      'ㅐ', 'ㅑ', 'ㅕ', 'ㅔ', 'ㅛ', 'ㅣ', 'ㅏ', 'ㅓ', 'ㅗ',
      'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅛ', 'ㅑ', 'ㅐ', 'ㅔ',
      'ㅕ', 'ㅔ', 'ㅛ', 'ㅐ', 'ㅑ', 'ㅓ', 'ㅏ', 'ㅣ', 'ㅗ',
      'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ',
      'ㅐ', 'ㅔ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅣ', 'ㅏ', 'ㅓ', 'ㅗ',
      'ㅑ', 'ㅛ', 'ㅔ', 'ㅕ', 'ㅐ', 'ㅗ', 'ㅣ', 'ㅏ', 'ㅓ'
    ]
  },
  {
    id: 4,
    title: '4단계: 왼손 아랫자리',
    subtitle: '왼손 손가락을 아래로 내려 ㅋ, ㅌ, ㅊ, ㅍ 한 글자씩 연습',
    keys: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ'],
    sampleList: [
      'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ',
      'ㅍ', 'ㅊ', 'ㅌ', 'ㅋ', 'ㄹ', 'ㅇ', 'ㄴ', 'ㅁ',
      'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅋ', 'ㅊ', 'ㅍ', 'ㅌ',
      'ㅌ', 'ㅍ', 'ㅋ', 'ㅊ', 'ㅁ', 'ㅇ', 'ㄴ', 'ㄹ',
      'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㄹ', 'ㄴ', 'ㅇ', 'ㅁ',
      'ㅍ', 'ㅌ', 'ㅊ', 'ㅋ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ',
      'ㅊ', 'ㅋ', 'ㅍ', 'ㅌ', 'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ'
    ]
  },
  {
    id: 5,
    title: '5단계: 오른손 아랫자리',
    subtitle: '오른손 손가락을 아래로 내려 ㅠ, ㅜ, ㅡ, 마침표, 쉼표 한 글자씩 연습',
    keys: ['ㅠ', 'ㅜ', 'ㅡ', ',', '.', 'ㅓ', 'ㅏ'],
    sampleList: [
      'ㅠ', 'ㅜ', 'ㅡ', ',', '.', 'ㅓ', 'ㅏ',
      'ㅡ', 'ㅜ', 'ㅠ', '.', ',', 'ㅏ', 'ㅓ',
      'ㅠ', 'ㅜ', 'ㅡ', ',', '.', 'ㅠ', 'ㅡ',
      '.', ',', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅓ', 'ㅏ',
      'ㅠ', 'ㅜ', 'ㅡ', ',', '.', 'ㅏ', 'ㅓ',
      'ㅡ', 'ㅠ', 'ㅜ', '.', ',', 'ㅠ', 'ㅜ',
      ',', '.', 'ㅡ', 'ㅜ', 'ㅠ', 'ㅓ', 'ㅏ'
    ]
  },
  {
    id: 6,
    title: '6단계: 가운데 자리 및 모음 확장',
    subtitle: '양손 검지 확장(ㅎ, ㅗ)과 가운데 모음 한 글자씩 집중 연습',
    keys: ['ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅜ', 'ㅡ'],
    sampleList: [
      'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅜ', 'ㅡ',
      'ㅗ', 'ㅎ', 'ㅏ', 'ㅓ', 'ㅡ', 'ㅜ',
      'ㅎ', 'ㅗ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ',
      'ㅜ', 'ㅡ', 'ㅎ', 'ㅗ', 'ㅏ', 'ㅓ',
      'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅜ', 'ㅡ',
      'ㅗ', 'ㅎ', 'ㅡ', 'ㅜ', 'ㅓ', 'ㅏ',
      'ㅎ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅏ', 'ㅓ'
    ]
  },
  {
    id: 7,
    title: '7단계: 쌍자음 및 Shift 글쇠',
    subtitle: 'Shift 키를 함께 누르는 ㅃ, ㅉ, ㄸ, ㄲ, ㅆ, ㅒ, ㅖ 한 글자씩 연습',
    keys: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'],
    sampleList: [
      'ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ',
      'ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅖ', 'ㅒ',
      'ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅃ', 'ㄲ',
      'ㅆ', 'ㅉ', 'ㄸ', 'ㅃ', 'ㅒ', 'ㅖ', 'ㄲ',
      'ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ',
      'ㄸ', 'ㅃ', 'ㄲ', 'ㅆ', 'ㅉ', 'ㅖ', 'ㅒ',
      'ㄲ', 'ㅆ', 'ㅃ', 'ㅉ', 'ㄸ', 'ㅒ', 'ㅖ'
    ]
  },
  {
    id: 8,
    title: '8단계: 숫자, 기호 & 전 글쇠 마스터',
    subtitle: '모든 자음, 모음, 숫자(0~9), 기호 한 글자씩 종합 마스터',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '?', '.'],
    sampleList: [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      '0', '9', '8', '7', '6', '5', '4', '3', '2', '1',
      '1', '3', '5', '7', '9', '2', '4', '6', '8', '0',
      '!', '?', '.', '1', '2', '3', '4', '5', '6', '7',
      '8', '9', '0', '!', '?', '.', '0', '8', '6', '4',
      '2', '9', '7', '5', '3', '1', '!', '?', '.', '1'
    ]
  }
];

export const KEY_PRACTICE_STAGES = KOREAN_KEY_PRACTICE_STAGES;

// 1-2. 자리 연습 단계별 데이터 (영어 English Key Practice Stages 1~8단계) - 오직 한 글자씩(단일 키) 출제
export const ENGLISH_KEY_PRACTICE_STAGES: PracticeStage[] = [
  {
    id: 1,
    title: 'Stage 1: Home Row Position',
    subtitle: '영문 키보드의 기준점! 왼손(ASDF)과 오른손(JKL;) 5분 한 글자씩 연습',
    keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    sampleList: [
      'a', 's', 'd', 'f', 'j', 'k', 'l', ';',
      'a', 'f', 's', 'd', 'j', ';', 'k', 'l',
      'l', 'k', 'j', ';', 'f', 'd', 's', 'a',
      'a', 's', 'd', 'f', 'j', 'k', 'l', ';',
      'd', 's', 'a', 'f', 'k', 'j', 'l', ';',
      'a', 's', 'd', 'f', 'j', 'k', 'l', ';',
      ';', 'l', 'k', 'j', 'f', 'd', 's', 'a'
    ]
  },
  {
    id: 2,
    title: 'Stage 2: Top Row Left',
    subtitle: '왼손 윗자리 Q, W, E, R, T 한 글자씩 연습',
    keys: ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f'],
    sampleList: [
      'q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f',
      't', 'r', 'e', 'w', 'q', 'f', 'd', 's', 'a',
      'q', 'w', 'e', 'r', 't', 'q', 'e', 't', 'w',
      'r', 'q', 'w', 'e', 'r', 't', 'a', 's', 'd',
      'q', 'w', 'e', 'r', 't', 'f', 'd', 's', 'a',
      'r', 't', 'w', 'e', 'q', 'a', 's', 'd', 'f'
    ]
  },
  {
    id: 3,
    title: 'Stage 3: Top Row Right',
    subtitle: '오른손 윗자리 Y, U, I, O, P 한 글자씩 연습',
    keys: ['y', 'u', 'i', 'o', 'p', 'j', 'k', 'l', ';'],
    sampleList: [
      'y', 'u', 'i', 'o', 'p', 'j', 'k', 'l', ';',
      'p', 'o', 'i', 'u', 'y', ';', 'l', 'k', 'j',
      'y', 'u', 'i', 'o', 'p', 'y', 'i', 'p', 'u',
      'o', 'y', 'u', 'i', 'o', 'p', 'j', 'k', 'l',
      'y', 'u', 'i', 'o', 'p', ';', 'l', 'k', 'j'
    ]
  },
  {
    id: 4,
    title: 'Stage 4: Bottom Row Left',
    subtitle: '왼손 아랫자리 Z, X, C, V 한 글자씩 연습',
    keys: ['z', 'x', 'c', 'v', 'a', 's', 'd', 'f'],
    sampleList: [
      'z', 'x', 'c', 'v', 'a', 's', 'd', 'f',
      'v', 'c', 'x', 'z', 'f', 'd', 's', 'a',
      'z', 'x', 'c', 'v', 'z', 'c', 'v', 'x',
      'v', 'z', 'x', 'c', 'v', 'a', 's', 'd',
      'z', 'x', 'c', 'v', 'f', 'd', 's', 'a'
    ]
  },
  {
    id: 5,
    title: 'Stage 5: Bottom Row Right',
    subtitle: '오른손 아랫자리 B, N, M, 쉼표, 마침표 한 글자씩 연습',
    keys: ['b', 'n', 'm', ',', '.', 'j', 'k', 'l'],
    sampleList: [
      'b', 'n', 'm', ',', '.', 'j', 'k', 'l',
      '.', ',', 'm', 'n', 'b', 'l', 'k', 'j',
      'b', 'n', 'm', ',', '.', 'b', 'n', 'm',
      'm', '.', 'n', 'm', ',', '.', 'j', 'k',
      'b', 'n', 'm', ',', '.', 'l', 'k', 'j'
    ]
  },
  {
    id: 6,
    title: 'Stage 6: Center Keys & Number Row',
    subtitle: '가운데 글쇠(G, H)와 상단 숫자 행(1~0) 한 글자씩 연습',
    keys: ['g', 'h', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    sampleList: [
      'g', 'h', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      '0', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'h', 'g',
      '1', '3', '5', '7', '9', '2', '4', '6', '8', '0', 'g', 'h',
      'g', 'h', 'g', 'h', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
    ]
  },
  {
    id: 7,
    title: 'Stage 7: Capital Letters',
    subtitle: 'Shift 키를 사용하는 영문 대문자 한 글자씩 집중 연습',
    keys: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    sampleList: [
      'A', 'S', 'D', 'F', 'J', 'K', 'L', 'Q', 'W',
      'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A',
      'S', 'D', 'F', 'J', 'K', 'L', 'Z', 'X', 'C',
      'V', 'B', 'N', 'M', 'Q', 'W', 'E', 'R', 'T',
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'
    ]
  },
  {
    id: 8,
    title: 'Stage 8: Comprehensive Master',
    subtitle: '전체 글쇠 한 글자씩 종합 마스터',
    keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '!', '?', '-', '_', '@', '#'],
    sampleList: [
      '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
      '!', '?', '-', '_', '@', '#', '1', '2', '3', '4',
      '5', '6', '7', '8', '9', '0', '!', '?', '-', '_'
    ]
  }
];

// 2. 낱말 연습 카테고리별 단어 리스트 (한글 1~8단계) - 5분 집중 연습 분량(60~75단어) 대폭 확장
export const KOREAN_WORD_PRACTICE_CATEGORIES = [
  {
    id: 'stage_1_home',
    stageNumber: 1,
    name: '1단계: 기본 자리 낱말',
    subtitle: '홈 포지션(ㅁㄴㅇㄹ ㅓㅏㅣ;)으로 타이핑하는 5분 어휘 연습',
    icon: 'Keyboard',
    color: 'sky',
    highlightedKeys: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅓ', 'ㅏ', 'ㅣ', ';'],
    words: [
      '마나님', '나라', '미나리', '머리', '미래', '사다리', '라디오', '아마도',
      '아이', '우리', '아리랑', '다리', '마디', '소리', '나무', '오이',
      '어미', '이응', '하나', '미소', '다시', '노래', '마음', '이마',
      '오리', '아기', '어머니', '누나', '사나이', '모리', '미인', '일기',
      '남아', '마라톤', '나리', '이란', '이리', '마리아', '나란히', '마마',
      '인민', '일어나', '이슬', '미소', '마을', '어린이', '미아', '일요일',
      '나비', '오솔길', '미역', '너구리', '어깨', '이모', '나침반', '마구간',
      '미술', '일등', '나그네', '아침', '어둠', '이슬비', '마중', '아지랑이',
      '어린양', '일손', '마구', '나팔꽃', '아저씨', '이웃', '마루', '나뭇잎'
    ]
  },
  {
    id: 'stage_2_top_left',
    stageNumber: 2,
    name: '2단계: 왼손 윗자리 낱말',
    subtitle: '왼손 윗글쇠(ㅂㅈㄷㄱㅅ)와 기본자리를 조합한 5분 단어 연습',
    icon: 'BookOpen',
    color: 'emerald',
    highlightedKeys: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ'],
    words: [
      '가자', '사자', '바다', '고기', '소리', '도시', '구름', '가게',
      '지구', '시장', '기자', '가방', '지도', '바람', '모자', '가을',
      '시계', '바구니', '거리', '도서관', '구두', '기차', '다람쥐', '자전거',
      '고구마', '보석', '주머니', '두더지', '바가지', '도자기', '비둘기', '비누',
      '감자', '수박', '소나무', '보물섬', '기린', '가마', '사탕', '비단',
      '지우개', '동물원', '사슴', '가습기', '보리', '저금통', '도토리', '기둥',
      '수건', '바위', '자석', '독수리', '거북이', '주사기', '소라', '비누방울',
      '자장가', '동화책', '사다리차', '비상구', '가을비', '도시락', '시골', '바다표범',
      '고드름', '주춧돌', '두루미', '거미줄', '가오리', '자라', '도깨비', '수선화'
    ]
  },
  {
    id: 'stage_3_top_right',
    stageNumber: 3,
    name: '3단계: 오른손 윗자리 낱말',
    subtitle: '오른손 윗글쇠(ㅛㅕㅑㅐㅔ)와 기본자리를 조합한 5분 단어 연습',
    icon: 'Cat',
    color: 'amber',
    highlightedKeys: ['ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅓ', 'ㅏ', 'ㅣ', ';'],
    words: [
      '야구', '여우', '배추', '해미', '요리', '개미', '학교', '태양',
      '유리', '모래', '새싹', '우주', '여름', '요구르트', '비행기', '해바라기',
      '코스모스', '이야기', '휴일', '화요일', '체육', '예술', '음악', '교실',
      '야구공', '요술봉', '여름방학', '개구리', '애국가', '새마을', '해돋이', '새소리',
      '여행', '태권도', '선생님', '세계', '메아리', '요리사', '여인', '배구',
      '해파리', '개나리', '제비', '냄비', '요람', '여객선', '배낭', '해녀',
      '새장', '메모장', '야자수', '요술램프', '여름휴가', '배움터', '해변', '개구쟁이',
      '새신발', '메밀꽃', '야생화', '요정', '여명', '배터리', '해산물', '개미굴',
      '새벽', '메뚜기', '야시장', '요트', '여울목', '배꽃', '해수욕장', '개울가'
    ]
  },
  {
    id: 'stage_4_bottom_left',
    stageNumber: 4,
    name: '4단계: 왼손 아랫자리 낱말',
    subtitle: '왼손 밑글쇠(ㅋㅌㅊㅍ)와 기본자리를 조합한 5분 단어 연습',
    icon: 'Utensils',
    color: 'rose',
    highlightedKeys: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ'],
    words: [
      '카드', '토끼', '치즈', '포도', '코끼리', '파란색', '친구', '커피',
      '축구', '타조', '카메라', '치마', '포크', '케이크', '파인애플', '초콜릿',
      '키보드', '택시', '텐트', '캠핑', '콘서트', '치약', '트럭', '피아노',
      '태극기', '파리', '기차표', '코스모스', '치타', '푸른하늘', '파도', '초록색',
      '풀밭', '탁구', '참새', '촛불', '크레파스', '풍선', '팽이', '패밀리',
      '파티', '치킨', '칼라', '카네이션', '토마토', '치료사', '포수', '코알라',
      '파수꾼', '친절', '커튼', '축제', '타이어', '카페', '칫솔', '포근함',
      '캐릭터', '파수', '초롱꽃', '키위', '태풍', '캠프파이어', '콘택트', '치즈케이크',
      '트랙터', '피리', '태평양', '파도타기', '코스피', '치악산', '포토존', '파란하늘'
    ]
  },
  {
    id: 'stage_5_bottom_right',
    stageNumber: 5,
    name: '5단계: 오른손 아랫자리 낱말',
    subtitle: '오른손 밑글쇠(ㅠㅜㅡ)와 기본자리를 조합한 5분 단어 연습',
    icon: 'Laptop',
    color: 'indigo',
    highlightedKeys: ['ㅠ', 'ㅜ', 'ㅡ', 'ㅓ', 'ㅏ', 'ㅣ', ';'],
    words: [
      '우유', '그림', '나무', '하늘', '구름', '마음', '사랑', '여름',
      '가을', '겨울', '봄날', '시냇물', '단풍잎', '눈사람', '무지개', '햇살',
      '풀밭', '호수', '바닷가', '은하수', '숲속', '산림', '들판', '별빛',
      '우산', '수영', '음악', '슬기', '단풍', '등대', '물방울', '느티나무',
      '유치원', '그네', '마루', '두루미', '풍경', '흐름', '우주선', '그림자',
      '나비목', '하모니카', '구슬', '마당', '사탕수수', '여우비', '가랑비', '겨울잠',
      '봄소식', '시냇가', '단팥빵', '눈꽃', '무당벌레', '햇비', '풀피리', '호롱불',
      '바다사자', '은방울꽃', '숲길', '산새', '들국화', '별똥별', '우체부', '그물',
      '나무꾼', '하늘소', '구름다리', '마술사', '사슴벌레', '여름낮', '가을들녘', '겨울밤'
    ]
  },
  {
    id: 'stage_6_center_vowels',
    stageNumber: 6,
    name: '6단계: 가운데 & 복합 모음',
    subtitle: '가운데 글쇠(ㅎ, ㅗ) 및 이중 모음(ㅘ, ㅝ, ㅢ, ㅚ 등) 5분 어휘',
    icon: 'Sparkles',
    color: 'violet',
    highlightedKeys: ['ㅎ', 'ㅗ', 'ㅑ', 'ㅐ', 'ㅔ', 'ㅘ', 'ㅝ', 'ㅢ'],
    words: [
      '한글', '화분', '회사', '의사', '과자', '왜가리', '희망', '호랑이',
      '환상', '광장', '황금', '황홀', '원숭이', '월요일', '관찰', '환경',
      '교환', '효도', '의자', '외투', '의복', '화폐', '회의', '귀걸이',
      '지혜', '화려함', '위대함', '의좋음', '월드컵', '황금열쇠', '희망차다', '외출',
      '외갓집', '화요일', '환영', '호수공원', '과수원', '원주민', '월급', '효자',
      '의무', '외식', '화석', '회의실', '귀마개', '지혜롭다', '화분받침', '위인전',
      '의형제', '원형', '월성', '효녀', '의원', '외국어', '화폐가치', '회담',
      '귀환', '호롱', '과목', '원두', '월드', '효행', '의논', '외교',
      '화답', '회상', '귀중품', '지혜선생', '화목', '위로', '의리', '외할머니'
    ]
  },
  {
    id: 'stage_7_double_consonants',
    stageNumber: 7,
    name: '7단계: 쌍자음 & 된소리',
    subtitle: 'Shift 키와 함께 누르는 쌍자음(ㅃ, ㅉ, ㄸ, ㄲ, ㅆ) 5분 단어',
    icon: 'Sparkle',
    color: 'pink',
    highlightedKeys: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'],
    words: [
      '뿌리', '찌개', '딸기', '꼬마', '씨앗', '빨강', '쑥쑥', '꿀벌',
      '떡볶이', '짝꿍', '뽀뽀', '깜짝', '똑똑', '깡충', '씩씩', '반짝',
      '통통', '까치', '뻐꾸기', '꽃다발', '꿈나라', '쌀밥', '씨름', '쪽지',
      '꼬리', '뚜껑', '썰매', '쌍둥이', '예절', '옛날', '빨간색', '꼬마신사',
      '반짝별', '씩씩이', '꽃가게', '꿈돌이', '쌀가마', '씨앗주머니', '쪽마루', '꼬투리',
      '뚜벅뚜벅', '썰매장', '쌍안경', '예술가', '옛이야기', '빨래', '찌르레기', '딸랑이',
      '꼬꼬댁', '씨나락', '빨대', '쑥버무리', '꿀단지', '떡국', '짝수', '뽀로로',
      '깜깜', '똑딱', '깡통', '씩씩함', '반짝반짝', '통통배', '까마귀', '뻐꾹',
      '꽃밭', '꿈결', '쌀알', '씨앗호떡', '쪽빛', '꼬마인형', '뚜껑열림', '썰물'
    ]
  },
  {
    id: 'stage_8_master_idioms',
    stageNumber: 8,
    name: '8단계: 사자성어 & 종합 마스터',
    subtitle: '모든 자모를 총동원한 고사성어 및 종합 어휘 5분 마스터',
    icon: 'Trophy',
    color: 'yellow',
    highlightedKeys: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅎ', 'ㅗ', 'ㅏ', 'ㅣ'],
    words: [
      '금상첨화', '일석이조', '대기만성', '역지사지', '무궁화', '대한민국', '동해물과',
      '고진감래', '칠전팔기', '유비무환', '온고지신', '새옹지마', '과유불급', '작심삼일',
      '다다익선', '백발백중', '일취월장', '천고마비', '동고동락', '학수고대', '심사숙고',
      '타산지석', '군계일학', '청출어람', '구사일생', '동분서주', '권토중래', '호연지기',
      '유유자적', '파죽지세', '절치부심', '배은망덕', '결초보은', '수수방관', '망양지탄',
      '조삼모사', '순망치한', '와신상담', '견마지로', '살신성인', '마이동풍', '동상이몽',
      '우공이산', '우후죽순', '풍전등화', '조변석개', '진퇴양난', '견리사의', '오리무중',
      '이심전심', '교언영색', '백년대계', '선공후사', '안빈낙도', '양호유환', '오월동주',
      '외유내강', '원화소복', '위기일발', '일모도원', '일망타진', '자승자박', '적반하장',
      '전광석화', '전화위복', '점입가경', '조령모개', '주마간산', '중과부적', '지록위마'
    ]
  }
];

export const WORD_PRACTICE_CATEGORIES = KOREAN_WORD_PRACTICE_CATEGORIES;

// 2-2. 낱말 연습 카테고리별 단어 리스트 (영어 English Words 1~8단계) - 5분 집중 분량 대폭 확장
export const ENGLISH_WORD_PRACTICE_CATEGORIES = [
  {
    id: 'stage_1_home_en',
    stageNumber: 1,
    name: '1단계: 기본 자리 영단어',
    subtitle: '홈 포지션(ASDF JKL;) 기본 자리 영단어 5분 집중 연습',
    icon: 'Keyboard',
    color: 'sky',
    highlightedKeys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'],
    words: [
      'all', 'fall', 'ask', 'glad', 'flask', 'salad', 'dark', 'leaf',
      'sad', 'lad', 'half', 'glass', 'dash', 'flash', 'hall', 'shark',
      'flag', 'lake', 'fade', 'jail', 'silk', 'sale', 'gold', 'flat',
      'gas', 'hat', 'jam', 'kill', 'last', 'land', 'lake', 'dish',
      'fish', 'milk', 'silk', 'desk', 'mask', 'task', 'feed', 'seed',
      'need', 'deed', 'feel', 'heel', 'lead', 'seal', 'deal', 'real',
      'meal', 'heal', 'held', 'self', 'half', 'safe', 'shed', 'shelf',
      'fame', 'game', 'lane', 'mail', 'sail', 'tail', 'rail', 'nail'
    ]
  },
  {
    id: 'stage_2_top_left_en',
    stageNumber: 2,
    name: '2단계: 왼손 윗자리 영단어',
    subtitle: '왼손 윗글쇠(QWERT)와 기본자리를 조합한 5분 영단어',
    icon: 'BookOpen',
    color: 'emerald',
    highlightedKeys: ['q', 'w', 'e', 'r', 't', 'a', 's', 'd', 'f'],
    words: [
      'red', 'tree', 'water', 'read', 'star', 'sweet', 'fast', 'great',
      'west', 'test', 'desk', 'rest', 'walk', 'step', 'draw', 'grow',
      'free', 'true', 'seat', 'grass', 'farm', 'wait', 'stay', 'snow',
      'ware', 'tear', 'wear', 'treat', 'street', 'waste', 'rate', 'taste',
      'warm', 'word', 'work', 'world', 'write', 'wrong', 'wall', 'wave',
      'wind', 'wild', 'wing', 'wood', 'wool', 'wish', 'wide', 'wire',
      'track', 'train', 'trade', 'trail', 'trust', 'truth', 'tower', 'team',
      'time', 'tail', 'tell', 'tall', 'table', 'taste', 'tiger', 'toast'
    ]
  },
  {
    id: 'stage_3_top_right_en',
    stageNumber: 3,
    name: '3단계: 오른손 윗자리 영단어',
    subtitle: '오른손 윗글쇠(YUIOP)와 기본자리를 조합한 5분 영단어',
    icon: 'Cat',
    color: 'amber',
    highlightedKeys: ['y', 'u', 'i', 'o', 'p', 'j', 'k', 'l', ';'],
    words: [
      'you', 'play', 'open', 'hope', 'happy', 'puppy', 'piano', 'group',
      'yellow', 'young', 'your', 'year', 'unit', 'pure', 'page', 'park',
      'paper', 'point', 'power', 'people', 'party', 'proud', 'quiet', 'queen',
      'pool', 'loop', 'pill', 'oil', 'lion', 'iron', 'pink', 'pony',
      'iron', 'icon', 'item', 'idea', 'into', 'join', 'joke', 'jump',
      'keep', 'king', 'kite', 'know', 'knot', 'knee', 'lamp', 'lime',
      'line', 'link', 'live', 'look', 'lord', 'loud', 'love', 'luck',
      'luna', 'lung', 'lyre', 'pink', 'plum', 'plus', 'poem', 'poet'
    ]
  },
  {
    id: 'stage_4_bottom_left_en',
    stageNumber: 4,
    name: '4단계: 왼손 아랫자리 영단어',
    subtitle: '왼손 밑글쇠(ZXCV)와 기본자리를 조합한 5분 영단어',
    icon: 'Utensils',
    color: 'rose',
    highlightedKeys: ['z', 'x', 'c', 'v', 'a', 's', 'd', 'f'],
    words: [
      'cat', 'van', 'zoo', 'zero', 'voice', 'clean', 'cave', 'river',
      'dance', 'visit', 'city', 'color', 'clock', 'chair', 'cover', 'cook',
      'car', 'camp', 'coat', 'cloud', 'corner', 'center', 'clear', 'cute',
      'zone', 'zeal', 'zinc', 'view', 'vase', 'vine', 'clam', 'clip',
      'card', 'care', 'cart', 'case', 'cash', 'cast', 'cent', 'chef',
      'chin', 'chip', 'chop', 'cite', 'clay', 'club', 'clue', 'coal',
      'coin', 'cold', 'comb', 'cone', 'cool', 'copy', 'cork', 'corn',
      'cost', 'cozy', 'crab', 'crop', 'crow', 'cube', 'cure', 'curl'
    ]
  },
  {
    id: 'stage_5_bottom_right_en',
    stageNumber: 5,
    name: '5단계: 오른손 아랫자리 영단어',
    subtitle: '오른손 밑글쇠(BNM)와 기본자리를 조합한 5분 영단어',
    icon: 'Laptop',
    color: 'indigo',
    highlightedKeys: ['b', 'n', 'm', 'j', 'k', 'l', ';'],
    words: [
      'box', 'name', 'moon', 'bird', 'warm', 'dream', 'music', 'king',
      'light', 'bright', 'night', 'mind', 'money', 'nature', 'number', 'nine',
      'morning', 'month', 'magic', 'memory', 'mother', 'marine', 'medal', 'model',
      'bank', 'bear', 'bell', 'belt', 'bend', 'best', 'bill', 'bite',
      'blow', 'blue', 'boat', 'body', 'boil', 'bold', 'bolt', 'bomb',
      'bond', 'bone', 'book', 'boot', 'born', 'boss', 'both', 'bowl',
      'nail', 'navy', 'near', 'neat', 'neck', 'nest', 'news', 'next',
      'nice', 'node', 'noon', 'nose', 'note', 'nova', 'baby', 'bean'
    ]
  },
  {
    id: 'stage_6_center_numbers_en',
    stageNumber: 6,
    name: '6단계: 가운데 글쇠 & 숫자 영단어',
    subtitle: '가운데 글쇠(G, H)와 상단 숫자 행(1~0) 5분 영단어',
    icon: 'Sparkles',
    color: 'violet',
    highlightedKeys: ['g', 'h', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    words: [
      'green', 'high', 'game', 'phone', 'first', 'second', 'third', 'house',
      'gold', 'silver', 'horse', 'heart', 'hotel', 'human', 'honor', 'heavy',
      'habit', 'happy', 'hello', 'honest', 'honey', 'hurry', 'hunter', 'hand',
      'gain', 'gate', 'gear', 'gift', 'girl', 'give', 'glow', 'glue',
      'goat', 'goal', 'good', 'gray', 'grid', 'grin', 'grip', 'gulf',
      'hair', 'hall', 'halo', 'hang', 'hard', 'hare', 'harp', 'hawk',
      'head', 'heal', 'heap', 'heat', 'help', 'herb', 'herd', 'hero',
      'hill', 'hint', 'hire', 'hive', 'hold', 'hole', 'home', 'hook'
    ]
  },
  {
    id: 'stage_7_capitals_school_en',
    stageNumber: 7,
    name: '7단계: 대문자 & 쉬프트 영단어',
    subtitle: 'Shift 키를 활용한 대문자 및 학교 생활 필수 5분 영단어',
    icon: 'Sparkle',
    color: 'pink',
    highlightedKeys: ['ShiftLeft', 'ShiftRight', 'a', 'b', 'c', 'd', 'e'],
    words: [
      'Korea', 'School', 'Teacher', 'Friend', 'Library', 'Science', 'Future',
      'Dream', 'Nature', 'World', 'Student', 'Classroom', 'Computer', 'English',
      'Monday', 'Friday', 'Sunday', 'Spring', 'Summer', 'Autumn', 'Winter', 'Rainbow',
      'Morning', 'Evening', 'Sunrise', 'Sunset', 'Galaxy', 'Universe', 'Planet',
      'Earth', 'Jupiter', 'Saturn', 'Mercury', 'Venus', 'Mars', 'Neptune', 'Pluto',
      'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December', 'Seoul', 'Tokyo', 'London',
      'Paris', 'Rome', 'Berlin', 'Madrid', 'Sydney', 'Cairo', 'Ottawa', 'Toronto'
    ]
  },
  {
    id: 'stage_8_advanced_proverbs_en',
    stageNumber: 8,
    name: '8단계: 영어 명언 & 마스터 종합',
    subtitle: '영어 격언 및 전 글쇠를 총동원한 5분 종합 마스터',
    icon: 'Trophy',
    color: 'yellow',
    highlightedKeys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
    words: [
      'Time is money', 'No pain no gain', 'Better late than never', 'Practice makes perfect',
      'Knowledge is power', 'Honesty is best', 'Never give up', 'Look before you leap',
      'Action speaks louder', 'Every cloud has silver', 'Birds of a feather', 'Easy come easy go',
      'Where there is a will', 'A friend in need', 'Two heads are better', 'All that glitters',
      'Beauty is in the eye', 'Better safe than sorry', 'Early bird catches worm', 'Fortune favors bold',
      'Great minds think alike', 'Haste makes waste', 'Laughter is best medicine', 'Live and learn',
      'Make hay while sun shines', 'Out of sight out of mind', 'Rome was not built in day', 'Slow and steady',
      'The pen is mightier', 'When in Rome do as Romans', 'You reap what you sow', 'Strike while iron is hot'
    ]
  }
];

// 3. 짧은 글 연습 데이터 (속담과 격언 위주, 각 카테고리별 30문장씩 엄선)
export const SENTENCE_PRACTICE_DATA = [
  {
    id: 1,
    category: '🔥 5분 연속 완주 마라톤 (지혜의 속담 30선)',
    description: '5분 동안 멈추지 않고 30개의 대표 속담과 격언을 연속으로 타이핑하여 지구력과 순발력을 기릅니다.',
    sentences: [
      '천 리 길도 한 걸음부터 시작하며 티끌이 모여 거대한 태산을 이룹니다.',
      '가는 말이 고와야 오는 말이 곱고 남을 배려하는 따뜻한 언어가 세상을 밝힙니다.',
      '시간은 금이라는 말처럼 지금 이 순간 집중하여 한 글자씩 정성껏 타이핑해 봅시다.',
      '시작이 반이라는 속담처럼 용기를 내어 첫걸음을 내딛는 순간 이미 절반은 이룬 것입니다.',
      '백지장도 맞들면 낫다는 말처럼 친구와 서로 도우면 어려운 일도 쉽게 해결됩니다.',
      '돌다리도 두들겨 보고 건너라는 말처럼 매사에 신중하고 꼼꼼하게 행동해야 합니다.',
      '고생 끝에 낙이 온다는 말처럼 힘든 노력을 견뎌내면 반드시 값진 보람이 찾아옵니다.',
      '아는 것이 힘이라는 격언처럼 끊임없이 배우고 탐구하는 자세가 가장 큰 재산입니다.',
      '낮말은 새가 듣고 밤말은 쥐가 들으니 늘 비밀을 지키고 정직하게 말해야 합니다.',
      '호랑이에게 물려가도 정신만 차리면 살아날 길이 열리듯 침착함이 최고의 무기입니다.',
      '말 한마디로 천 냥 빚을 갚는다는 속담처럼 온화하고 공손한 태도가 사람의 마음을 엽니다.',
      '원숭이도 나무에서 떨어질 때가 있으니 실패를 겪어도 기죽지 말고 다시 일어서야 합니다.',
      '세 살 적 버릇이 여든까지 가므로 어릴 때부터 바른 자세와 습관을 길러야 합니다.',
      '우물을 파도 한 우물을 파라는 교훈처럼 한 가지 일에 끈기를 갖고 매진해야 성공합니다.',
      '금강산도 식후경이라는 말처럼 든든하게 영양을 채우고 힘차게 연습에 임해 봅시다.',
      '티끌 모아 태산이 되듯 매일 10분씩 꾸준히 연습하면 눈부신 타자 실력을 갖추게 됩니다.',
      '누워서 떡 먹기처럼 쉬운 일이라도 방심하지 않고 최선을 다하는 것이 현명합니다.',
      '소 잃고 외양간 고치지 말고 문제가 생기기 전에 미리미리 꼼꼼히 대비해야 합니다.',
      '열 번 찍어 안 넘어가는 나무 없듯이 꺾이지 않는 불굴의 도전 정신이 기적을 만듭니다.',
      '바늘 도둑이 소도둑 된다는 말처럼 작은 거짓말이나 나쁜 습관도 경계해야 합니다.',
      '개구리 올챙이 적 생각 못 한다는 말처럼 성공했을 때도 늘 겸손한 자세를 잃지 맙시다.',
      '서당 개 삼 년이면 풍월을 읊듯이 좋은 환경에서 열심히 배우면 누구나 성장합니다.',
      '웃는 낯에 침 못 뱉는다는 속담처럼 밝은 미소는 모든 갈등을 눈 녹듯 녹여줍니다.',
      '발 없는 말이 천 리를 가므로 언제 어디서나 남의 험담을 삼가고 칭찬을 아끼지 맙시다.',
      '고래 싸움에 새우 등 터지지 않도록 지혜롭고 슬기로운 균형 감각을 길러야 합니다.',
      '배움에는 끝이 없고 나이가 없으니 언제나 겸손하게 지혜를 넓혀가는 것이 중요합니다.',
      '작은 물방울이 모여 큰 바다를 이루고 작은 실천이 모여 위대한 성취를 만듭니다.',
      '흔들리지 않고 피는 꽃이 없듯이 모든 시련은 우리를 더 강하고 굳건하게 만들어 줍니다.',
      '스스로를 믿고 당당하게 전진하면 세상 그 어떤 높은 벽도 거뜬히 뛰어넘을 수 있습니다.',
      '오늘 하루도 나 자신에게 아낌없는 응원을 보내며 행복하고 뜻깊은 결실을 맺어갑니다.'
    ]
  },
  {
    id: 2,
    category: '지혜의 전통 속담 30선',
    description: '선조들의 깊은 교훈과 인생의 나침반이 되어주는 대표 필수 전통 속담 30문장',
    sentences: [
      '가는 말이 고와야 오는 말이 곱다.',
      '티끌 모아 태산이라 작은 저축이 큰 부를 이룬다.',
      '시작이 반이니 망설이지 말고 도전하라.',
      '천 리 길도 한 걸음부터 차근차근 나아가야 한다.',
      '백지장도 맞들면 낫고 협동하면 힘이 솟는다.',
      '돌다리도 두들겨 보고 건너듯 신중함이 필요하다.',
      '고생 끝에 낙이 오니 인내하며 최선을 다하라.',
      '아는 것이 힘이요 지식은 삶의 등불이다.',
      '낮말은 새가 듣고 밤말은 쥐가 들으니 말을 삼가라.',
      '호랑이에게 물려가도 정신만 차리면 산다.',
      '등잔 밑이 어둡듯 가까운 곳을 먼저 살펴라.',
      '말 한마디로 천 냥 빚을 갚을 수 있다.',
      '원숭이도 나무에서 떨어질 때가 있는 법이다.',
      '세 살 적 버릇 여든까지 가니 좋은 습관을 들여라.',
      '우물을 파도 한 우물만 깊게 파야 맑은 물이 솟는다.',
      '소 잃고 외양간 고치지 말고 미리 예방하라.',
      '금강산도 식후경이라 즐거운 마음으로 시작하자.',
      '바늘 도둑이 소도둑 되니 정직함을 지켜라.',
      '개구리 올챙이 적 생각을 잊지 말고 겸손하라.',
      '열 번 찍어 안 넘어가는 나무는 없다.',
      '서당 개 삼 년이면 풍월을 읊는 법이다.',
      '웃는 얼굴에 침 못 뱉듯 상냥하게 대하라.',
      '발 없는 말이 천 리 가니 언행을 주의하라.',
      '하늘이 무너져도 솟아날 구멍은 반드시 있다.',
      '뱁새가 황새 따라가다 가랑이 찢어지니 분수를 지켜라.',
      '공든 탑이 무너지랴 정성을 다하면 이룬다.',
      '보기 좋은 떡이 먹기도 좋은 법이다.',
      '누워서 침 뱉기는 결국 자기 자신에게 돌아온다.',
      '믿는 도끼에 발등 찍히지 않도록 주의하라.',
      '길고 짧은 것은 대어 보아야 비로소 안다.'
    ]
  },
  {
    id: 3,
    category: '사자성어 & 명심보감 교훈 30선',
    description: '삶의 지혜와 덕목을 일깨워주는 명심보감 구절과 대표 고사성어 30문장',
    sentences: [
      '일석이조는 한 가지 일로 두 가지 이익을 얻음을 뜻합니다.',
      '고진감래는 쓴 것이 다하면 단맛이 찾아온다는 가르침입니다.',
      '대기만성은 큰 그릇은 늦게 완성되니 서두르지 말라는 뜻입니다.',
      '칠전팔기는 일곱 번 넘어져도 여덟 번 일어나는 불굴의 용기입니다.',
      '역지사지는 다른 사람의 처지에서 생각하고 배려하는 마음입니다.',
      '유비무환은 평소에 미리 준비하면 근심과 재난이 없음을 이릅니다.',
      '온고지신은 옛것을 익혀 미루어 새로운 지식을 얻는 지혜입니다.',
      '새옹지마는 인생의 길흉화복은 항상 바뀌므로 일희일비하지 말라는 뜻입니다.',
      '과유불급은 지나침은 오히려 미치지 못함과 같다는 중용의 도입니다.',
      '작심삼일을 넘어 꾸준하고 성실한 실천으로 목표를 이룹시다.',
      '타산지석은 남의 잘못에서도 배울 점을 찾아 나를 닦는 자세입니다.',
      '학수고대는 학의 목처럼 길게 빼고 간절히 기다리는 마음입니다.',
      '화룡점정은 마지막 가장 중요한 부분을 완성하여 빛을 내는 일입니다.',
      '금상첨화는 비단 위에 꽃을 더하듯 좋은 일에 기쁨이 더함을 뜻합니다.',
      '동고동락은 괴로움과 즐거움을 함께 나누는 진정한 우정입니다.',
      '다다익선은 많으면 많을수록 더욱 유익하고 좋다는 의미입니다.',
      '백발백중은 백 번 쏘아 백 번 모두 맞히는 뛰어난 솜씨입니다.',
      '일취월장은 날마다 나아가고 달마다 발전하는 배움의 즐거움입니다.',
      '천고마비는 하늘이 높고 푸르며 말이 살찌는 풍요로운 가을입니다.',
      '동문서답하지 않고 상대방의 말에 귀 기울여 진솔하게 답합시다.',
      '심사숙고하여 깊이 생각한 후 신중하게 올바른 결정을 내립니다.',
      '선견지명을 갖고 미래의 변화를 미리 내다보는 안목을 기릅니다.',
      '착한 일을 하는 사람에게는 하늘이 복을 내리고 악한 자는 벌을 받습니다.',
      '부모님께 효도하고 형제간에 우애하며 친구 간에 신의를 지킵니다.',
      '욕심을 버리고 스스로 만족할 줄 알면 평생 동안 부끄러움이 없습니다.',
      '황금을 모으는 것보다 자식에게 한 권의 책을 물려주는 것이 낫습니다.',
      '하루라도 책을 읽지 않으면 입안에 가시가 돋는다는 교훈을 새깁니다.',
      '남을 헐뜯는 말을 듣거든 가시를 안은 듯 조심하고 칭찬을 나눕니다.',
      '배움은 마치 물을 거슬러 올라가는 배와 같아서 쉬면 물러납니다.',
      '마음을 맑고 고요하게 닦으면 세상의 모든 이치를 밝게 볼 수 있습니다.'
    ]
  },
  {
    id: 4,
    category: '서정적인 동시 & 한국 문학 명구절 30선',
    description: '윤동주, 나태주, 정지용, 김소월 등 마음을 맑고 따뜻하게 가꿔주는 문학 30문장',
    sentences: [
      '자세히 보아야 예쁘다. 오래 보아야 사랑스럽다. 너도 그렇다.',
      '별 하나에 추억과 별 하나에 사랑과 별 하나에 쓸쓸함과 별 하나에 어머니.',
      '나 하늘로 돌아가리라. 새벽빛 와 닿으면 스러지는 이슬 더불어 손에 손을 잡고.',
      '하늘을 우러러 한 점 부끄럼이 없기를 잎새에 이는 바람에도 나는 괴로워했다.',
      '흔들리지 않고 피는 꽃이 어디 있으랴. 이 세상 그 어떤 아름다운 꽃들도 다 흔들리며 피었나니.',
      '향단아 그네를 밀어라. 바다로 배를 내밀듯이 바람 타고 높이높이 올라가자.',
      '넓은 벌 동쪽 끝으로 옛이야기 지줄대는 실개천이 휘돌아 나가고 얼룩백이 황소가 게으른 울음을 우는 곳.',
      '풀잎에도 상처가 있고 꽃잎에도 눈물이 있으니 서로를 보듬어 안아주어야 합니다.',
      '내가 그의 이름을 불러주기 전에는 그는 다만 하나의 몸짓에 지나지 않았다.',
      '눈 덮인 들판을 걸어갈 때 어지러이 걷지 마라. 오늘 나의 발자국은 뒤따르는 이의 이정표가 된다.',
      '산산이 부서진 이름이여! 허공 중에 헤어진 이름이여! 불러도 주인 없는 이름이여!',
      '엄마 걱정, 열무 삼십 단을 이고 시장에 간 우리 엄마 안 오시네. 해는 시든 지 오래고.',
      '나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리오리다.',
      '진달래꽃 아름 따다 가실 길에 뿌리오리다. 사뿐히 즈려밟고 가시옵소서.',
      '모란이 피기까지는 나는 아직 나의 봄을 기다리고 있을 테요.',
      '빼앗긴 들에도 봄은 오는가. 지금은 남의 땅, 빼앗긴 들에도 봄은 오는가.',
      '향기로운 봄바람이 살랑이며 나뭇가지마다 파릇파릇 연두색 새싹이 돋아납니다.',
      '푸른 바다 위로 하얀 갈매기들이 날개를 펴고 자유롭게 하늘을 날아오릅니다.',
      '달빛이 고요히 흐르는 밤이면 시냇물 소리가 맑은 은구슬처럼 귓가에 맴돕니다.',
      '동구 밖 과수원 길 아카시아 꽃이 활짝 폈네. 하얀 꽃 이파리 눈송이처럼 날리네.',
      '작은 새 한 마리가 처마 끝에 앉아 맑고 고운 목소리로 아침 노래를 부릅니다.',
      '가을 산은 붉은 단풍과 노란 은행잎으로 화려한 비단옷을 곱게 차려입었습니다.',
      '하얀 첫눈이 온 세상을 덮으면 아이들은 언덕에 모여 신나게 눈썰매를 탑니다.',
      '엄마 품처럼 따스한 햇살이 봄날의 잔디밭을 황금빛으로 가득 채워줍니다.',
      '어린 나무들이 비바람을 견디며 울창하고 푸른 거대한 숲을 이루어 갑니다.',
      '초롱초롱 빛나는 아이들의 눈망울 속에 미래의 찬란한 꿈과 희망이 담겨 있습니다.',
      '시냇물은 멈추지 않고 흘러 마침내 넓고 푸른 바다를 향해 당당히 나아갑니다.',
      '종소리가 은은하게 퍼져나가는 저녁노을 언덕길을 친구와 나란히 걸어갑니다.',
      '마음속에 고운 시 한 편을 품고 살아가면 매일매일이 아름다운 축제가 됩니다.',
      '사랑하는 사람들과 함께 나누는 따뜻한 온기가 온 세상을 포근하게 감싸줍니다.'
    ]
  },
  {
    id: 5,
    category: '신비한 자연 & 과학 탐험 30선',
    description: '우주, 지구, 동물, 생태계와 첨단 기술의 놀라운 비밀을 담은 과학 지식 30문장',
    sentences: [
      '태양계에는 수성, 금성, 지구, 화성, 목성, 토성, 천왕성, 해왕성 등 여덟 개의 행성이 있습니다.',
      '꿀벌은 꽃가루를 옮겨 열매를 맺게 돕는 지구 생태계의 소중하고 위대한 파수꾼입니다.',
      '북극의 오로라는 태양에서 날아온 전하 입자들이 지구 자기장과 부딪히며 만드는 빛의 예술입니다.',
      '컴퓨터의 이진법은 0과 1 두 가지 숫자로 세상의 모든 프로그램과 데이터를 표현합니다.',
      '나무는 광합성을 통해 이산화탄소를 흡수하고 우리에게 신선하고 맑은 산소를 선물해 줍니다.',
      '바다 깊은 곳 심해에는 스스로 신비로운 빛을 내는 발광 생물들이 살아가고 있습니다.',
      '지구 표면의 약 70퍼센트는 푸른 바다로 덮여 있으며 수많은 생명이 숨 쉬고 있습니다.',
      '빛의 속도는 1초에 약 30만 킬로미터로 지구를 일곱 바퀴 반이나 돌 수 있는 엄청난 빠르기입니다.',
      '공룡은 약 6600만 년 전 거대한 소행성 충돌로 인해 지구상에서 사라지게 되었습니다.',
      '인공위성은 지구 궤도를 돌며 일기 예보, GPS 위치 추적, 전 세계 통신을 가능하게 해 줍니다.',
      '화성은 표면에 산화철 성분이 많아 붉은 행성이라는 별명을 가지고 있습니다.',
      '달은 지구의 유일한 자연 위성이며 지구 주위를 약 27.3일 주기로 공전합니다.',
      '물은 섭씨 100도에서 끓어 수증기가 되고 섭씨 0도에서 얼어 단단한 얼음이 됩니다.',
      '인공지능은 방대한 데이터를 학습하여 인간의 언어를 이해하고 문제를 해결합니다.',
      '인체의 뼈는 성인 기준으로 약 206개이며 몸을 지탱하고 장기를 보호합니다.',
      '식물의 뿌리는 흙 속에서 물과 무기 양분을 흡수하여 줄기와 잎으로 전달합니다.',
      '지진은 지구 내부 판의 움직임으로 인해 지각에 쌓인 에너지가 방출되며 일어납니다.',
      '무지개는 공기 중의 물방울이 햇빛을 굴절시키고 반사하여 나타나는 아름다운 현상입니다.',
      '화산 폭발은 지하 깊은 곳의 마그마가 지표면을 뚫고 분출하며 용암을 만들어냅니다.',
      '철새들은 계절의 변화에 맞추어 수천 킬로미터를 날아 따뜻한 번식지로 이동합니다.',
      '남극 대륙은 지구상에서 가장 춥고 건조하며 바람이 강하게 부는 거대한 얼음 대륙입니다.',
      '현미경의 발명으로 우리는 육안으로 볼 수 없던 미시 세계의 세포와 세균을 관찰하게 되었습니다.',
      '태양 에너지는 풍력, 수력과 함께 미래 지구 환경을 지키는 친환경 청정 에너지입니다.',
      '우주 정거장은 인류가 무중력 상태에서 다양한 첨단 과학 실험을 수행하는 연구 기지입니다.',
      '인체의 혈액은 심장의 펌프 작용을 통해 온몸 구석구석 산소와 영양분을 공급합니다.',
      '산호초는 다양한 해양 생물들에게 안식처와 먹이를 제공하는 바다의 오아시스입니다.',
      '중력은 질량을 가진 모든 물체가 서로를 끌어당기는 우주의 기본적인 힘입니다.',
      '블랙홀은 빛조차 빠져나올 수 없을 만큼 극도로 강한 중력을 가진 신비한 천체입니다.',
      'DNA는 모든 생명체의 유전 정보를 담고 있는 이중 나선 구조의 생명 설계도입니다.',
      '과학과 기술의 발전은 인류의 삶을 더욱 풍요롭고 안전하게 만들어 가고 있습니다.'
    ]
  },
  {
    id: 6,
    category: '희망과 용기의 긍정 메시지 30선',
    description: '스스로에게 힘과 용기를 북돋아주고 활기를 불어넣는 따스한 응원 30문장',
    sentences: [
      '오늘 하루도 힘차고 활기차게 시작하며 긍정의 에너지를 가득 채워봅시다.',
      '매일 조금씩 연습하면 나의 타자 실력이 눈부시게 성장하고 발전합니다.',
      '실수를 두려워하지 않고 끝까지 포기하지 않는 당신이 가장 멋지고 자랑스럽습니다.',
      '올바른 손가락 자세가 빠르고 정확한 타자 마스터의 가장 확실한 지름길입니다.',
      '키보드를 보지 않고 화면을 보며 치는 습관이 타자 속도를 두 배로 높여줍니다.',
      '스스로를 믿고 한 걸음씩 나아가면 꿈꾸던 목표를 반드시 현실로 만들 수 있습니다.',
      '오늘의 작은 노력이 모여 내일의 찬란하고 위대한 성공을 이룹니다.',
      '언제나 긍정적인 마음으로 세상을 바라보면 주변에 기쁨과 행운이 가득 찾아옵니다.',
      '지치고 힘들 때는 깊은 호흡을 하고 잠시 쉬어가며 마음을 다독여도 괜찮습니다.',
      '당신은 세상에서 오직 하나뿐인 소중하고 특별하며 반짝이는 존재입니다.',
      '나만의 속도로 꾸준히 걸어가다 보면 어느새 정상이 눈앞에 펼쳐질 것입니다.',
      '어제의 나보다 오늘 한 걸음 더 성장한 나 자신에게 아낌없는 박수를 보냅니다.',
      '따뜻한 말 한마디와 밝은 미소가 친구들에게 큰 용기와 위로를 전해줍니다.',
      '어려운 고난은 우리를 더욱 성숙하고 지혜로운 사람으로 성장시키는 기회입니다.',
      '마음속에 심은 희망의 씨앗은 정성을 다해 가꾸면 아름다운 꽃을 피워냅니다.',
      '배움의 기쁨을 느끼며 새로운 지식을 탐구하는 매 순간이 소중한 축복입니다.',
      '스스로에게 관대하고 남에게 너그러운 사람이 진정으로 강하고 멋진 사람입니다.',
      '용기를 내어 도전하는 자에게는 언제나 새로운 가능성의 문이 활짝 열립니다.',
      '작은 감사함을 발견할 줄 아는 마음이 인생을 가장 풍요롭게 만들어 줍니다.',
      '끝없는 열정과 성실한 태도는 세상 어떤 재능보다 강력한 무기입니다.',
      '오늘 쏟은 땀방울은 머지않아 환한 웃음과 큰 결실로 되돌아올 것입니다.',
      '서로의 다름을 존중하고 격려할 때 우리는 함께 더 높이 날아오를 수 있습니다.',
      '꿈을 향해 내딛는 작은 발걸음 하나하나가 모두 의미 있고 가치 있는 전진입니다.',
      '마음의 창문을 활짝 열고 새로운 세상을 향해 당당하고 자신감 있게 나아갑시다.',
      '힘찬 박수와 응원을 보내며 오늘도 행복하고 유쾌한 하루를 완성해 갑니다.',
      '진정한 챔피언은 쓰러지지 않는 사람이 아니라 쓰러질 때마다 다시 일어서는 사람입니다.',
      '자신을 사랑하고 아끼는 마음이 모든 행복과 성공의 가장 튼튼한 뿌리가 됩니다.',
      '한 글자씩 정성껏 타이핑하며 집중력과 손가락의 유연함을 마음껏 길러보세요.',
      '함께 손잡고 응원하며 성장하는 타닥타닥 타자랜드에서 멋진 타자왕이 되어보세요.',
      '당신의 밝은 미래와 찬란한 내일을 온 마음을 다해 진심으로 응원합니다!'
    ]
  }
];

export interface EnglishSentenceCategory {
  id: number;
  category: string;
  description: string;
  sentences: string[];
}

export const ENGLISH_SENTENCE_PRACTICE_DATA: EnglishSentenceCategory[] = [
  {
    id: 1,
    category: '1. 영어 명언 & 지혜의 속담 30선',
    description: '전 세계의 대표적인 영어 속담과 인생 명언 30문장 타이핑',
    sentences: [
      'Practice makes perfect in typing and in every area of life.',
      'Where there is a will, there is always a way forward to success.',
      'Stay hungry, stay foolish, and never stop learning new things.',
      'Actions speak much louder and clearer than mere words.',
      'Every single moment is a fresh beginning filled with infinite possibility.',
      'Believe you can do it and you are already halfway there.',
      'No pain, no gain when building great habits and skills.',
      'Honesty is always the best policy in every situation.',
      'Slow and steady wins the race every single time.',
      'Success is not final, failure is not fatal: it is courage that counts.',
      'The secret of getting ahead in life is getting started right now.',
      'Do not count the days, make every single day count.',
      'Happiness depends upon ourselves and our positive perspective.',
      'Turn your wounds into wisdom and your dreams into bright reality.',
      'A journey of a thousand miles begins with a single brave step.',
      'Early to bed and early to rise makes a person healthy and wise.',
      'Better late than never when doing good deeds and learning.',
      'Birds of a feather flock together in friendship and harmony.',
      'Do not judge a book by its cover, look deep into character.',
      'Look before you leap and think carefully before taking action.',
      'A friend in need is a friend indeed who stays by your side.',
      'Knowledge is power when put into good and productive practice.',
      'Time flies like an arrow, so cherish every fleeting second.',
      'When in Rome, do as the Romans do with respect and courtesy.',
      'All that glitters is not gold, value true inner quality.',
      'An apple a day keeps the doctor away with good health.',
      'Laughter is the best medicine for body, mind, and soul.',
      'Every cloud has a silver lining filled with hope and light.',
      'Two heads are better than one when solving tough challenges.',
      'Keep your eyes on the stars and your feet firmly on the ground.'
    ]
  },
  {
    id: 2,
    category: '2. 일상 대화 & 긍정 메시지 30선',
    description: '일상 대화와 따스한 배려, 우정을 담은 실용 영어 문장 30선',
    sentences: [
      'A good friend is like warm sunshine on a cold cloudy day.',
      'Kind words can heal a broken heart and brighten someone entire day.',
      'Tomorrow is another beautiful day filled with great hope and joy.',
      'Listening carefully is the greatest gift you can offer to a true friend.',
      'A warm smile is the universal language of kindness across all cultures.',
      'Cherish every wonderful moment with the lovely people you care about.',
      'Sharing a delicious meal brings family and neighbors closer together.',
      'Always express your sincere gratitude to those who help you grow.',
      'Good manners and politeness open doors that money simply cannot.',
      'Friendship doubles our joyful moments and divides our painful grief.',
      'Enjoying a good cup of tea brings calm and peaceful tranquility.',
      'Reading books opens up new worlds of adventure and creative imagination.',
      'Taking a morning walk in the park refreshes the mind and body.',
      'Hard work always pays off when combined with steady patience and focus.',
      'Helping others without expecting anything in return is true nobility.',
      'Music has the magic power to connect hearts across all boundaries.',
      'Keep learning with a humble curiosity every single day of your life.',
      'Expressing your true feelings honestly builds trust and strong bonds.',
      'Taking care of nature and planting trees makes our planet cleaner.',
      'Celebrate small victories along the way toward your major dreams.',
      'A tidy room and organized desk create a peaceful environment for study.',
      'Always be polite, say please and thank you with genuine sincerity.',
      'Laughter shared with good friends creates unforgettable memories.',
      'Practice deep breathing and relax whenever you feel overwhelmed.',
      'Be proud of how far you have come and excited for what lies ahead.',
      'Kindness costs nothing, yet its value to the receiver is priceless.',
      'A warm hug can communicate more love and comfort than a thousand words.',
      'Keep your promises and always be a dependable and trustworthy friend.',
      'Stay true to your values and never compromise on what is right.',
      'Have confidence in your unique talents and shine brightly for the world.'
    ]
  },
  {
    id: 3,
    category: '3. 신비한 우주 & 자연 과학 30선',
    description: '경이로운 우주, 자연 생태계와 미래 과학 기술 영어 문장 30선',
    sentences: [
      'The Earth revolves around the bright Sun once every single year.',
      'Water is the essential driving force of all living nature on Earth.',
      'Stars shine brightest in the darkest and clearest midnight skies.',
      'Computers process billions of binary calculations in a single second.',
      'Honeybees play a vital role in pollinating blooming flowers and crops.',
      'The speed of light travels about three hundred thousand kilometers per second.',
      'Oceans cover more than seventy percent of our planet surface.',
      'Artificial intelligence transforms the way we learn, work, and create.',
      'The ozone layer shields our Earth from harmful solar ultraviolet radiation.',
      'Curiosity is the fundamental spark behind all great scientific discoveries.',
      'Mars is known as the Red Planet due to iron oxide on its surface.',
      'The Moon causes tidal waves in our oceans through gravitational pull.',
      'Rainforests produce a significant portion of oxygen for our planet.',
      'DNA carries the genetic code that defines all living organisms on Earth.',
      'Satellites orbiting space allow global communication, GPS, and weather forecasting.',
      'Volcanoes release molten magma from deep beneath the crust of the Earth.',
      'Photosynthesis allows green plants to convert sunlight into organic energy.',
      'Black holes possess gravity so strong that even light cannot escape them.',
      'Renewable solar and wind energy help protect our global atmosphere.',
      'Migratory birds navigate thousands of miles using the magnetic field of Earth.',
      'Microscopes reveal intricate worlds of single-celled organisms and atoms.',
      'Telescopes gaze deep into galaxies that formed billions of years ago.',
      'Robots assist humans in exploring hazardous environments and distant planets.',
      'Coral reefs are vibrant marine ecosystems teeming with colorful biodiversity.',
      'Gravity is the universal force that keeps planets revolving in orbit.',
      'Antarctica is the coldest, windiest, and driest continent on Earth.',
      'Sound travels faster through liquids and solids than through open air.',
      'Fossils provide valuable clues about ancient life and giant dinosaurs.',
      'Protecting our fragile biosphere ensures a flourishing future for all species.',
      'Scientific exploration continues to expand human frontiers of knowledge.'
    ]
  },
  {
    id: 4,
    category: '4. 세계 명작 문학 & 클래식 동화 30선',
    description: '어린 왕자, 이상한 나라의 앨리스, 클래식 명작 영어 문장 30선',
    sentences: [
      'Once upon a time in a peaceful and magical forest far away.',
      'The little prince looked up at the stars with pure wonder in his eyes.',
      'It is only with the heart that one can see rightly; what is essential is invisible.',
      'All our dreams can come true if we have the courage to pursue them.',
      'In a wonderland they lie, dreaming as the summer days go softly by.',
      'Not all those who wander are lost in the mysterious deep woods.',
      'There is no companion as loyal and enlightening as a classic storybook.',
      'Laughter is timeless, imagination has no age, and dreams are forever.',
      'Curiouser and curiouser cried Alice as she stepped into wonderland.',
      'You become responsible forever for what you have tamed with love.',
      'To infinity and beyond, where courage and imagination know no limits.',
      'A reader lives a thousand lives before he dies, the non-reader only one.',
      'Fairytales are more than true: not because they tell us dragons exist.',
      'They tell us that dragons can be beaten by courage and perseverance.',
      'The magical wardrobe opened into a snowy world of talking animals.',
      'The golden key unlocked the secret garden filled with blooming roses.',
      'Follow the yellow brick road toward the sparkling Emerald City.',
      'Peter Pan taught Wendy and her brothers how to fly using happy thoughts.',
      'The glass slipper fit Cinderella perfectly, changing her fate forever.',
      'Pinocchio learned that telling the truth is the secret to becoming real.',
      'Aladdin flew across starlit skies on his magical woven flying carpet.',
      'The wise owl perched on the ancient oak tree sharing ancient riddles.',
      'A brave knight defended the kingdom with honor, kindness, and loyalty.',
      'The gentle mermaid gazed toward the horizon dreaming of distant shores.',
      'Stories whisper timeless truths to those willing to listen with open hearts.',
      'Beauty is found within the kindness of a humble and loving heart.',
      'Every great adventure begins with a simple decision to explore the unknown.',
      'Words have the magical power to heal, inspire, and create whole worlds.',
      'Through every stormy night, a beacon of hope guides travelers safely home.',
      'May your life be a wonderful story written with courage, love, and wonder.'
    ]
  }
];

// 4. 낱말 거꾸로 치기 게임 데이터
export const REVERSE_WORDS_POOL = [
  { word: '나비', hint: '비나', level: 1, points: 100 },
  { word: '학교', hint: '교학', level: 1, points: 100 },
  { word: '사랑', hint: '랑사', level: 1, points: 100 },
  { word: '우주', hint: '주우', level: 1, points: 100 },
  { word: '바다', hint: '다바', level: 1, points: 100 },
  { word: '나무', hint: '무나', level: 1, points: 100 },
  { word: '하늘', hint: '늘하', level: 1, points: 100 },
  { word: '가방', hint: '방가', level: 1, points: 100 },
  { word: '사탕', hint: '탕사', level: 1, points: 100 },
  { word: '구름', hint: '름구', level: 1, points: 100 },
  { word: '바나나', hint: '나나바', level: 2, points: 200 },
  { word: '토마토', hint: '토마토', level: 2, points: 200 },
  { word: '기러기', hint: '기러기', level: 2, points: 200 },
  { word: '코끼리', hint: '리끼코', level: 2, points: 200 },
  { word: '다람쥐', hint: '쥐람다', level: 2, points: 200 },
  { word: '독수리', hint: '리수독', level: 2, points: 200 },
  { word: '돌고래', hint: '래고돌', level: 2, points: 200 },
  { word: '컴퓨터', hint: '터퓨컴', level: 2, points: 200 },
  { word: '무지개', hint: '개지무', level: 2, points: 200 },
  { word: '운동장', hint: '장동안', level: 2, points: 200 },
  { word: '대한민국', hint: '국민한대', level: 3, points: 350 },
  { word: '동해물과', hint: '과물해동', level: 3, points: 350 },
  { word: '샌드위치', hint: '치위드샌', level: 3, points: 350 },
  { word: '스파게티', hint: '티게파스', level: 3, points: 350 },
  { word: '아이스크림', hint: '림크스이아', level: 3, points: 400 },
  { word: '일석이조', hint: '조이석일', level: 3, points: 350 },
  { word: '고진감래', hint: '래감진고', level: 3, points: 350 },
  { word: '초등학교', hint: '교학등초', level: 3, points: 350 },
  { word: '프로그래밍', hint: '밍래그로프', level: 4, points: 500 },
  { word: '인공지능기술', hint: '술기능지공인', level: 4, points: 600 },
];

// 5. 키보드 단축키 퀴즈 데이터
export const SHORTCUT_QUIZ_DATA: ShortcutQuizItem[] = [
  {
    id: 1,
    question: '선택한 텍스트나 파일을 복사할 때 사용하는 단축키는?',
    description: '클립보드에 선택 영역을 복제합니다.',
    keys: ['Ctrl', 'C'],
    keysDisplay: 'Ctrl + C',
    category: '기본 단축키',
    options: ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z']
  },
  {
    id: 2,
    question: '복사하거나 잘라낸 내용을 원하는 위치에 붙여넣는 단축키는?',
    description: '클립보드의 내용을 현재 커서 위치에 삽입합니다.',
    keys: ['Ctrl', 'V'],
    keysDisplay: 'Ctrl + V',
    category: '기본 단축키',
    options: ['Ctrl + V', 'Ctrl + P', 'Ctrl + C', 'Ctrl + S']
  },
  {
    id: 3,
    question: '방금 한 실수를 되돌릴 때(실행 취소) 사용하는 마법의 단축키는?',
    description: '이전 상태로 한 단계 되돌립니다.',
    keys: ['Ctrl', 'Z'],
    keysDisplay: 'Ctrl + Z',
    category: '기본 단축키',
    options: ['Ctrl + Z', 'Ctrl + Y', 'Ctrl + U', 'Ctrl + A']
  },
  {
    id: 4,
    question: '문서나 화면의 모든 내용을 한 번에 전체 선택하는 단축키는?',
    description: 'All(전체)의 약자를 기억해보세요.',
    keys: ['Ctrl', 'A'],
    keysDisplay: 'Ctrl + A',
    category: '기본 단축키',
    options: ['Ctrl + A', 'Ctrl + S', 'Ctrl + D', 'Ctrl + F']
  },
  {
    id: 5,
    question: '작성 중인 소중한 문서를 컴퓨터에 저장하는 단축키는?',
    description: 'Save(저장)의 약자입니다.',
    keys: ['Ctrl', 'S'],
    keysDisplay: 'Ctrl + S',
    category: '기본 단축키',
    options: ['Ctrl + S', 'Ctrl + W', 'Ctrl + O', 'Ctrl + K']
  },
  {
    id: 6,
    question: '긴 문서나 웹페이지에서 특정 글자나 단어를 찾을 때 쓰는 단축키는?',
    description: 'Find(찾기) 검색창이 열립니다.',
    keys: ['Ctrl', 'F'],
    keysDisplay: 'Ctrl + F',
    category: '기본 단축키',
    options: ['Ctrl + F', 'Ctrl + G', 'Ctrl + H', 'Ctrl + E']
  },
  {
    id: 7,
    question: '웹 브라우저에서 현재 웹페이지를 새로고침(다시 불러오기)하는 키는?',
    description: 'F5 단독 또는 Ctrl + R로 동작합니다.',
    keys: ['F5'],
    keysDisplay: 'F5 (또는 Ctrl + R)',
    category: '웹 브라우저',
    options: ['F5', 'F1', 'F11', 'F12']
  },
  {
    id: 8,
    question: '웹 브라우저에서 새로운 탭(Tab)을 바로 열 때 사용하는 단축키는?',
    description: 'New Tab을 빠르게 생성합니다.',
    keys: ['Ctrl', 'T'],
    keysDisplay: 'Ctrl + T',
    category: '웹 브라우저',
    options: ['Ctrl + T', 'Ctrl + N', 'Ctrl + W', 'Ctrl + J']
  },
  {
    id: 9,
    question: '현재 보고 있는 브라우저 탭이나 문서 창을 즉시 닫는 단축키는?',
    description: '마우스로 X를 누르지 않고 빠르게 닫습니다.',
    keys: ['Ctrl', 'W'],
    keysDisplay: 'Ctrl + W',
    category: '웹 브라우저',
    options: ['Ctrl + W', 'Ctrl + Q', 'Ctrl + D', 'Ctrl + X']
  },
  {
    id: 10,
    question: '윈도우에서 화면의 원하는 부분을 지정하여 캡처하는 단축키는?',
    description: '윈도우 캡처 도구의 필수 단축키입니다.',
    keys: ['Win', 'Shift', 'S'],
    keysDisplay: 'Win + Shift + S',
    category: '윈도우 시스템',
    options: ['Win + Shift + S', 'Ctrl + Shift + S', 'Alt + PrtScn', 'Win + P']
  },
  {
    id: 11,
    question: '열려 있는 모든 창을 한 번에 최소화하고 바탕화면을 보는 단축키는?',
    description: 'Desktop(바탕화면)의 약자입니다.',
    keys: ['Win', 'D'],
    keysDisplay: 'Win + D',
    category: '윈도우 시스템',
    options: ['Win + D', 'Win + E', 'Win + M', 'Win + L']
  },
  {
    id: 12,
    question: '프로그램이 멈췄을 때 프로세스를 강제 종료할 수 있는 작업 관리자 단축키는?',
    description: '시스템 관리의 핵심 도구를 호출합니다.',
    keys: ['Ctrl', 'Shift', 'Esc'],
    keysDisplay: 'Ctrl + Shift + Esc',
    category: '윈도우 시스템',
    options: ['Ctrl + Shift + Esc', 'Ctrl + Alt + Del', 'Alt + F4', 'Win + R']
  }
];

// 6. 아바타 프로필 프리셋 (파스텔 레트로 아케이드)
export interface AvatarPreset {
  id: string;
  emoji: string;
  label: string;
  bg: string;
  border: string;
  levelTitle: string;
}

export const PREDEFINED_AVATARS: AvatarPreset[] = [
  { id: 'ghost', emoji: '👻', label: '꼬마 유령', bg: 'bg-purple-100', border: 'border-purple-300', levelTitle: '귀여운 타자단' },
  { id: 'cat', emoji: '🐱', label: '야옹이', bg: 'bg-pink-100', border: 'border-pink-300', levelTitle: '타자 꿈나무' },
  { id: 'dog', emoji: '🐶', label: '멍멍이', bg: 'bg-amber-100', border: 'border-amber-300', levelTitle: '열혈 연습생' },
  { id: 'rabbit', emoji: '🐰', label: '토끼', bg: 'bg-rose-100', border: 'border-rose-300', levelTitle: '점프 타자' },
  { id: 'bear', emoji: '🐻', label: '곰돌이', bg: 'bg-yellow-100', border: 'border-yellow-300', levelTitle: '우직한 타자' },
  { id: 'panda', emoji: '🐼', label: '판다', bg: 'bg-teal-100', border: 'border-teal-300', levelTitle: '대나무 타수' },
  { id: 'fox', emoji: '🦊', label: '여우', bg: 'bg-orange-100', border: 'border-orange-300', levelTitle: '재빠른 검지' },
  { id: 'lion', emoji: '🦁', label: '아기사자', bg: 'bg-amber-100', border: 'border-amber-400', levelTitle: '타자의 제왕' },
  { id: 'tiger', emoji: '🐯', label: '호랑이', bg: 'bg-yellow-100', border: 'border-yellow-400', levelTitle: '맹렬한 타자' },
  { id: 'unicorn', emoji: '🦄', label: '유니콘', bg: 'bg-fuchsia-100', border: 'border-fuchsia-300', levelTitle: '전설의 타수' },
  { id: 'rocket', emoji: '🚀', label: '우주선', bg: 'bg-sky-100', border: 'border-sky-300', levelTitle: '광속 타이핑' },
  { id: 'lightning', emoji: '⚡', label: '번개', bg: 'bg-yellow-100', border: 'border-yellow-400', levelTitle: '초고속 번개' },
  { id: 'crown', emoji: '👑', label: '타자왕', bg: 'bg-amber-100', border: 'border-amber-400', levelTitle: '명예의 1위' },
  { id: 'robot', emoji: '🤖', label: '로봇', bg: 'bg-cyan-100', border: 'border-cyan-300', levelTitle: '정확도 100%' },
  { id: 'game', emoji: '🎮', label: '게이머', bg: 'bg-indigo-100', border: 'border-indigo-300', levelTitle: '콤보 마스터' },
  { id: 'star', emoji: '🌟', label: '슈퍼스타', bg: 'bg-yellow-100', border: 'border-yellow-300', levelTitle: '빛나는 타자' },
];

// 7. 단어 뒤섞기 데이터
export interface WordScrambleItem {
  id: number;
  word: string;
  scrambled: string[];
  hint: string;
  category: string;
  difficulty: '쉬움' | '보통' | '도전';
}

export const WORD_SCRAMBLE_DATA: WordScrambleItem[] = [
  { id: 1, word: '토마토', scrambled: ['마', '토', '토'], hint: '빨갛고 맛있는 채소 겸 과일', category: '음식/채소', difficulty: '쉬움' },
  { id: 2, word: '다람쥐', scrambled: ['람', '쥐', '다'], hint: '도토리를 볼에 가득 모으는 동물', category: '동물', difficulty: '쉬움' },
  { id: 3, word: '기러기', scrambled: ['러', '기', '기'], hint: '앞으로 해도 뒤로 해도 똑같은 새', category: '동물/새', difficulty: '쉬움' },
  { id: 4, word: '무지개', scrambled: ['개', '무', '지'], hint: '비 온 뒤 하늘에 뜨는 일곱 빛깔', category: '자연', difficulty: '쉬움' },
  { id: 5, word: '우주선', scrambled: ['선', '우', '주'], hint: '달과 화성으로 날아가는 탐사선', category: '과학', difficulty: '쉬움' },
  { id: 6, word: '호랑이', scrambled: ['랑', '이', '호'], hint: '줄무늬가 멋진 숲속의 맹수', category: '동물', difficulty: '쉬움' },
  { id: 7, word: '태극기', scrambled: ['기', '태', '극'], hint: '대한민국의 자랑스러운 국기', category: '상식', difficulty: '쉬움' },
  { id: 8, word: '컴퓨터', scrambled: ['터', '컴', '퓨'], hint: '타자 연습을 하고 있는 이 기계', category: '디지털', difficulty: '쉬움' },
  { id: 9, word: '해바라기', scrambled: ['기', '해', '라', '바'], hint: '태양을 향해 고개를 드는 노란 꽃', category: '식물', difficulty: '보통' },
  { id: 10, word: '도서관', scrambled: ['관', '도', '서'], hint: '수많은 책과 지혜가 모여 있는 곳', category: '장소', difficulty: '보통' },
  { id: 11, word: '아이스크림', scrambled: ['크', '아', '림', '이', '스'], hint: '여름에 시원하고 달콤하게 먹는 디저트', category: '음식', difficulty: '도전' },
  { id: 12, word: '자전거', scrambled: ['거', '자', '전'], hint: '페달을 밟아 달리는 친환경 탈것', category: '교통', difficulty: '보통' },
  { id: 13, word: '대한민국', scrambled: ['국', '대', '한', '민'], hint: '우리가 살고 있는 아름다운 나라', category: '사회', difficulty: '보통' },
  { id: 14, word: '선생님', scrambled: ['님', '선', '생'], hint: '학교에서 우리를 바르게 가르쳐 주시는 분', category: '인물', difficulty: '쉬움' },
  { id: 15, word: '스마트폰', scrambled: ['폰', '스', '트', '마'], hint: '손안의 작은 컴퓨터 전화기', category: '디지털', difficulty: '보통' },
  { id: 16, word: '초콜릿', scrambled: ['릿', '초', '콜'], hint: '카카오로 만든 달콤 쌉싸름한 간식', category: '음식', difficulty: '보통' },
  { id: 17, word: '반딧불이', scrambled: ['이', '반', '불', '딧'], hint: '깜깜한 밤 꽁무니에서 반짝 빛을 내는 곤충', category: '곤충', difficulty: '도전' },
  { id: 18, word: '비행기', scrambled: ['기', '비', '행'], hint: '하늘 높은 곳을 날아 여행하는 교통수단', category: '교통', difficulty: '쉬움' },
  { id: 19, word: '텔레비전', scrambled: ['전', '텔', '비', '레'], hint: '뉴스나 재미있는 만화를 보는 전자제품', category: '가전', difficulty: '보통' },
  { id: 20, word: '별똥별', scrambled: ['별', '똥', '별'], hint: '밤하늘을 가르며 떨어지는 유성', category: '우주', difficulty: '보통' },
];

// 8. 60초 타임 챌린지 문단
export const TIMED_CHALLENGE_TEXTS: string[] = [
  '천 리 길도 한 걸음부터 시작하고 티끌 모아 태산이 됩니다. 매일 조금씩 올바른 손가락 자리로 연습하면 어느새 놀라운 타자 실력을 갖추게 됩니다.',
  '가는 말이 고와야 오는 말이 곱고 고래 싸움에 새우 등 터집니다. 말을 할 때나 글을 타이핑할 때 항상 따뜻하고 올바른 마음을 담아야 합니다.',
  '컴퓨터와 스마트폰이 가득한 세상에서 빠른 타자 속도는 여러분의 꿈과 생각을 자유롭게 펼칠 수 있는 가장 강력한 날개가 되어 줄 것입니다.',
  '봄바람이 살랑살랑 불어오고 파란 하늘에는 하얀 뭉게구름이 둥실 떠갑니다. 들판에는 노란 민들레가 활짝 피어나 향기로운 봄소식을 전합니다.',
  '실패를 두려워하지 말고 끈기 있게 도전하세요. 한 글자 한 글자 정성스럽게 입력하다 보면 오타는 줄어들고 타수는 저절로 높아집니다.',
  '맑은 시냇물이 졸졸 흐르고 작은 물고기들이 은빛 비늘을 반짝이며 헤엄칩니다. 자연 속에서 휴식을 취하며 새로운 에너지를 가득 채워보세요.',
];

// 9. 워드 크러시 사가 레벨
export interface CrushWordBlock {
  id: string;
  word: string;
  row: number;
  col: number;
  color: 'red' | 'blue' | 'lime' | 'amber' | 'purple';
  score: number;
  isCrushed?: boolean;
}

export interface WordCrushLevel {
  level: number;
  title: string;
  gridSize: number;
  timeLimit: number;
  targetScore: number;
  blocks: {
    word: string;
    row: number;
    col: number;
    color: 'red' | 'blue' | 'lime' | 'amber' | 'purple';
    score: number;
  }[];
}

export const WORD_CRUSH_LEVELS: WordCrushLevel[] = [
  {
    level: 1,
    title: '워드 크러시 1단계: 젤리 블록 격파',
    gridSize: 7,
    timeLimit: 180,
    targetScore: 2500,
    blocks: [
      { word: '주인공', row: 2, col: 2, color: 'red', score: 100 },
      { word: '누나', row: 2, col: 3, color: 'red', score: 80 },
      { word: '앞서', row: 2, col: 4, color: 'red', score: 80 },
      { word: '선배', row: 3, col: 2, color: 'red', score: 80 },
      { word: '논리', row: 3, col: 3, color: 'blue', score: 150 },
      { word: '한글', row: 3, col: 4, color: 'red', score: 80 },
      { word: '손가락', row: 4, col: 2, color: 'red', score: 100 },
      { word: '너무나', row: 4, col: 3, color: 'red', score: 100 },
      { word: '계속하다', row: 4, col: 4, color: 'blue', score: 200 },
    ],
  },
  {
    level: 2,
    title: '워드 크러시 2단계: 신선한 과일 팡팡',
    gridSize: 7,
    timeLimit: 180,
    targetScore: 3500,
    blocks: [
      { word: '사과', row: 1, col: 2, color: 'red', score: 90 },
      { word: '바나나', row: 1, col: 3, color: 'amber', score: 120 },
      { word: '포도', row: 1, col: 4, color: 'purple', score: 90 },
      { word: '딸기', row: 2, col: 2, color: 'red', score: 90 },
      { word: '수박', row: 2, col: 3, color: 'lime', score: 100 },
      { word: '오렌지', row: 2, col: 4, color: 'amber', score: 120 },
      { word: '복숭아', row: 3, col: 2, color: 'red', score: 120 },
      { word: '블루베리', row: 3, col: 3, color: 'blue', score: 180 },
      { word: '파인애플', row: 3, col: 4, color: 'amber', score: 200 },
      { word: '망고', row: 4, col: 3, color: 'amber', score: 110 },
      { word: '키위', row: 5, col: 3, color: 'lime', score: 90 },
    ],
  },
  {
    level: 3,
    title: '워드 크러시 3단계: 귀여운 동물 대탐험',
    gridSize: 7,
    timeLimit: 180,
    targetScore: 4500,
    blocks: [
      { word: '다람쥐', row: 1, col: 2, color: 'amber', score: 120 },
      { word: '호랑이', row: 1, col: 4, color: 'amber', score: 120 },
      { word: '사자', row: 2, col: 1, color: 'amber', score: 90 },
      { word: '토끼', row: 2, col: 3, color: 'red', score: 90 },
      { word: '코끼리', row: 2, col: 5, color: 'blue', score: 140 },
      { word: '기린', row: 3, col: 2, color: 'lime', score: 90 },
      { word: '판다곰', row: 3, col: 3, color: 'purple', score: 150 },
      { word: '돌고래', row: 3, col: 4, color: 'blue', score: 140 },
      { word: '펭귄', row: 4, col: 1, color: 'blue', score: 90 },
      { word: '캥거루', row: 4, col: 3, color: 'amber', score: 140 },
      { word: '하마', row: 4, col: 5, color: 'lime', score: 90 },
      { word: '얼룩말', row: 5, col: 3, color: 'purple', score: 130 },
    ],
  },
  {
    level: 4,
    title: '워드 크러시 4단계: 미래 IT 디지털 크러시',
    gridSize: 7,
    timeLimit: 180,
    targetScore: 6000,
    blocks: [
      { word: '인공지능', row: 1, col: 3, color: 'blue', score: 200 },
      { word: '알고리즘', row: 2, col: 2, color: 'purple', score: 220 },
      { word: '키보드', row: 2, col: 3, color: 'lime', score: 120 },
      { word: '클라우드', row: 2, col: 4, color: 'blue', score: 200 },
      { word: '데이터베이스', row: 3, col: 1, color: 'purple', score: 300 },
      { word: '네트워크', row: 3, col: 2, color: 'blue', score: 200 },
      { word: '인터넷', row: 3, col: 3, color: 'red', score: 130 },
      { word: '웹브라우저', row: 3, col: 4, color: 'amber', score: 250 },
      { word: '스마트폰', row: 3, col: 5, color: 'lime', score: 180 },
      { word: '소프트웨어', row: 4, col: 2, color: 'blue', score: 250 },
      { word: '프로그래밍', row: 4, col: 3, color: 'purple', score: 280 },
      { word: '사이버보안', row: 4, col: 4, color: 'red', score: 260 },
      { word: '메타버스', row: 5, col: 3, color: 'lime', score: 200 },
    ],
  },
];
