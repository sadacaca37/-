// Korean Hangul Processing & Jamo Decomposition Utility
import { FingerType } from '../types';

export const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

export const JUNGSUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

export const JONGSUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

// Complex Vowel to Keystroke Jamos
export const COMPLEX_VOWEL_MAP: Record<string, string[]> = {
  'ㅘ': ['ㅗ', 'ㅏ'],
  'ㅙ': ['ㅗ', 'ㅐ'],
  'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'],
  'ㅞ': ['ㅜ', 'ㅔ'],
  'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ'],
};

// Complex Final Consonant to Keystroke Jamos
export const COMPLEX_JONG_MAP: Record<string, string[]> = {
  'ㄳ': ['ㄱ', 'ㅅ'],
  'ㄵ': ['ㄴ', 'ㅈ'],
  'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'],
  'ㄻ': ['ㄹ', 'ㅁ'],
  'ㄼ': ['ㄹ', 'ㅂ'],
  'ㄽ': ['ㄹ', 'ㅅ'],
  'ㄾ': ['ㄹ', 'ㅌ'],
  'ㄿ': ['ㄹ', 'ㅍ'],
  'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ'],
};

// Complex Jamo stroke counts
export const JAMO_KEYSTROKES: Record<string, number> = {
  'ㄱ': 1, 'ㄲ': 2, 'ㄴ': 1, 'ㄷ': 1, 'ㄸ': 2, 'ㄹ': 1, 'ㅁ': 1, 'ㅂ': 1, 'ㅃ': 2, 'ㅅ': 1,
  'ㅆ': 2, 'ㅇ': 1, 'ㅈ': 1, 'ㅉ': 2, 'ㅊ': 1, 'ㅋ': 1, 'ㅌ': 1, 'ㅍ': 1, 'ㅎ': 1,
  'ㅏ': 1, 'ㅐ': 1, 'ㅑ': 1, 'ㅒ': 2, 'ㅓ': 1, 'ㅔ': 1, 'ㅕ': 1, 'ㅖ': 2, 'ㅗ': 1,
  'ㅘ': 2, 'ㅙ': 3, 'ㅚ': 2, 'ㅛ': 1, 'ㅜ': 1, 'ㅝ': 2, 'ㅞ': 3, 'ㅟ': 2, 'ㅠ': 1,
  'ㅡ': 1, 'ㅢ': 2, 'ㅣ': 1,
  'ㄳ': 2, 'ㄵ': 2, 'ㄶ': 2, 'ㄺ': 2, 'ㄻ': 2, 'ㄼ': 2, 'ㄽ': 2, 'ㄾ': 2, 'ㄿ': 2, 'ㅀ': 2, 'ㅄ': 2
};

// Hangul character to 2-Set Keyboard KeyCode mapping
export const HANGUL_TO_KEYCODE: Record<string, { code: string; shift?: boolean; finger: FingerType; fingerName: string }> = {
  // Left Hand - Home Row
  'ㅁ': { code: 'KeyA', finger: 'left-pinky', fingerName: '왼손 새끼' },
  'ㄴ': { code: 'KeyS', finger: 'left-ring', fingerName: '왼손 약지' },
  'ㅇ': { code: 'KeyD', finger: 'left-middle', fingerName: '왼손 중지' },
  'ㄹ': { code: 'KeyF', finger: 'left-index', fingerName: '왼손 검지' },
  'ㅎ': { code: 'KeyG', finger: 'left-index', fingerName: '왼손 검지' },
  
  // Left Hand - Top Row
  'ㅂ': { code: 'KeyQ', finger: 'left-pinky', fingerName: '왼손 새끼' },
  'ㅃ': { code: 'KeyQ', shift: true, finger: 'left-pinky', fingerName: '왼손 새끼 (Shift)' },
  'ㅈ': { code: 'KeyW', finger: 'left-ring', fingerName: '왼손 약지' },
  'ㅉ': { code: 'KeyW', shift: true, finger: 'left-ring', fingerName: '왼손 약지 (Shift)' },
  'ㄷ': { code: 'KeyE', finger: 'left-middle', fingerName: '왼손 중지' },
  'ㄸ': { code: 'KeyE', shift: true, finger: 'left-middle', fingerName: '왼손 중지 (Shift)' },
  'ㄱ': { code: 'KeyR', finger: 'left-index', fingerName: '왼손 검지' },
  'ㄲ': { code: 'KeyR', shift: true, finger: 'left-index', fingerName: '왼손 검지 (Shift)' },
  'ㅅ': { code: 'KeyT', finger: 'left-index', fingerName: '왼손 검지' },
  'ㅆ': { code: 'KeyT', shift: true, finger: 'left-index', fingerName: '왼손 검지 (Shift)' },

  // Left Hand - Bottom Row
  'ㅋ': { code: 'KeyZ', finger: 'left-pinky', fingerName: '왼손 새끼' },
  'ㅌ': { code: 'KeyX', finger: 'left-ring', fingerName: '왼손 약지' },
  'ㅊ': { code: 'KeyC', finger: 'left-middle', fingerName: '왼손 중지' },
  'ㅍ': { code: 'KeyV', finger: 'left-index', fingerName: '왼손 검지' },

  // Right Hand - Home Row
  'ㅗ': { code: 'KeyH', finger: 'right-index', fingerName: '오른손 검지' },
  'ㅓ': { code: 'KeyJ', finger: 'right-index', fingerName: '오른손 검지' },
  'ㅏ': { code: 'KeyK', finger: 'right-middle', fingerName: '오른손 중지' },
  'ㅣ': { code: 'KeyL', finger: 'right-ring', fingerName: '오른손 약지' },
  ';': { code: 'Semicolon', finger: 'right-pinky', fingerName: '오른손 새끼' },

  // Right Hand - Top Row
  'ㅛ': { code: 'KeyY', finger: 'right-index', fingerName: '오른손 검지' },
  'ㅕ': { code: 'KeyU', finger: 'right-index', fingerName: '오른손 검지' },
  'ㅑ': { code: 'KeyI', finger: 'right-middle', fingerName: '오른손 중지' },
  'ㅐ': { code: 'KeyO', finger: 'right-ring', fingerName: '오른손 약지' },
  'ㅒ': { code: 'KeyO', shift: true, finger: 'right-ring', fingerName: '오른손 약지 (Shift)' },
  'ㅔ': { code: 'KeyP', finger: 'right-pinky', fingerName: '오른손 새끼' },
  'ㅖ': { code: 'KeyP', shift: true, finger: 'right-pinky', fingerName: '오른손 새끼 (Shift)' },

  // Right Hand - Bottom Row
  'ㅠ': { code: 'KeyB', finger: 'left-index', fingerName: '왼손 검지' },
  'ㅜ': { code: 'KeyN', finger: 'right-index', fingerName: '오른손 검지' },
  'ㅡ': { code: 'KeyM', finger: 'right-index', fingerName: '오른손 검지' },
  ',': { code: 'Comma', finger: 'right-middle', fingerName: '오른손 중지' },
  '.': { code: 'Period', finger: 'right-ring', fingerName: '오른손 약지' },
  '/': { code: 'Slash', finger: 'right-pinky', fingerName: '오른손 새끼' },
  ' ': { code: 'Space', finger: 'thumb', fingerName: '양손 엄지 (스페이스)' }
};

export const ENGLISH_TO_FINGER: Record<string, { code: string; finger: FingerType; fingerName: string }> = {
  'q': { code: 'KeyQ', finger: 'left-pinky', fingerName: '왼손 새끼' },
  'a': { code: 'KeyA', finger: 'left-pinky', fingerName: '왼손 새끼' },
  'z': { code: 'KeyZ', finger: 'left-pinky', fingerName: '왼손 새끼' },
  'w': { code: 'KeyW', finger: 'left-ring', fingerName: '왼손 약지' },
  's': { code: 'KeyS', finger: 'left-ring', fingerName: '왼손 약지' },
  'x': { code: 'KeyX', finger: 'left-ring', fingerName: '왼손 약지' },
  'e': { code: 'KeyE', finger: 'left-middle', fingerName: '왼손 중지' },
  'd': { code: 'KeyD', finger: 'left-middle', fingerName: '왼손 중지' },
  'c': { code: 'KeyC', finger: 'left-middle', fingerName: '왼손 중지' },
  'r': { code: 'KeyR', finger: 'left-index', fingerName: '왼손 검지' },
  'f': { code: 'KeyF', finger: 'left-index', fingerName: '왼손 검지' },
  'v': { code: 'KeyV', finger: 'left-index', fingerName: '왼손 검지' },
  't': { code: 'KeyT', finger: 'left-index', fingerName: '왼손 검지' },
  'g': { code: 'KeyG', finger: 'left-index', fingerName: '왼손 검지' },
  'b': { code: 'KeyB', finger: 'left-index', fingerName: '왼손 검지' },
  'y': { code: 'KeyY', finger: 'right-index', fingerName: '오른손 검지' },
  'h': { code: 'KeyH', finger: 'right-index', fingerName: '오른손 검지' },
  'n': { code: 'KeyN', finger: 'right-index', fingerName: '오른손 검지' },
  'u': { code: 'KeyU', finger: 'right-index', fingerName: '오른손 검지' },
  'j': { code: 'KeyJ', finger: 'right-index', fingerName: '오른손 검지' },
  'm': { code: 'KeyM', finger: 'right-index', fingerName: '오른손 검지' },
  'i': { code: 'KeyI', finger: 'right-middle', fingerName: '오른손 중지' },
  'k': { code: 'KeyK', finger: 'right-middle', fingerName: '오른손 중지' },
  'o': { code: 'KeyO', finger: 'right-ring', fingerName: '오른손 약지' },
  'l': { code: 'KeyL', finger: 'right-ring', fingerName: '오른손 약지' },
  'p': { code: 'KeyP', finger: 'right-pinky', fingerName: '오른손 새끼' },
};

/**
 * Decomposes text into atomic keystroke units (individual keys to be pressed sequentially)
 */
export function decomposeToAtomicKeystrokes(text: string): string[] {
  const result: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    // Complete Hangul Syllable (가 ~ 힣)
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const choIndex = Math.floor(syllableIndex / (21 * 28));
      const jungIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
      const jongIndex = syllableIndex % 28;

      // 1. Chosung
      const cho = CHOSUNG[choIndex];
      result.push(cho);

      // 2. Jungsung (handle compound vowels e.g. ㅘ = ㅗ + ㅏ)
      const jung = JUNGSUNG[jungIndex];
      if (COMPLEX_VOWEL_MAP[jung]) {
        result.push(...COMPLEX_VOWEL_MAP[jung]);
      } else {
        result.push(jung);
      }

      // 3. Jongsung (handle compound final consonants e.g. ㄳ = ㄱ + ㅅ)
      if (jongIndex > 0) {
        const jong = JONGSUNG[jongIndex];
        if (COMPLEX_JONG_MAP[jong]) {
          result.push(...COMPLEX_JONG_MAP[jong]);
        } else {
          result.push(jong);
        }
      }
    } else if (COMPLEX_VOWEL_MAP[char]) {
      result.push(...COMPLEX_VOWEL_MAP[char]);
    } else if (COMPLEX_JONG_MAP[char]) {
      result.push(...COMPLEX_JONG_MAP[char]);
    } else {
      result.push(char);
    }
  }

  return result;
}

/**
 * Decomposes a Korean syllable or string into standard Jamo components
 */
export function decomposeHangul(str: string): string[] {
  const result: string[] = [];

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);

    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const choIndex = Math.floor(syllableIndex / (21 * 28));
      const jungIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
      const jongIndex = syllableIndex % 28;

      result.push(CHOSUNG[choIndex]);
      result.push(JUNGSUNG[jungIndex]);
      if (jongIndex > 0) {
        result.push(JONGSUNG[jongIndex]);
      }
    } else {
      result.push(str[i]);
    }
  }

  return result;
}

/**
 * Calculates total keystrokes for a given string (handles English, Korean, digits, spaces)
 */
export function countKeystrokes(text: string): number {
  let strokes = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);

    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const cho = CHOSUNG[Math.floor(syllableIndex / (21 * 28))];
      const jung = JUNGSUNG[Math.floor((syllableIndex % (21 * 28)) / 28)];
      const jong = JONGSUNG[syllableIndex % 28];

      strokes += JAMO_KEYSTROKES[cho] || 1;
      strokes += JAMO_KEYSTROKES[jung] || 1;
      if (jong) {
        strokes += JAMO_KEYSTROKES[jong] || 1;
      }
    } else if (/[A-Z!@#$%^&*()_+{}|:"<>?~]/.test(char)) {
      strokes += 2;
    } else {
      strokes += 1;
    }
  }
  return Math.max(1, strokes);
}

/**
 * Reverses a string by syllable
 */
export function reverseWord(word: string): string {
  return word.split('').reverse().join('');
}

export interface KeyGuideResult {
  code: string;
  shift?: boolean;
  finger: FingerType;
  fingerName: string;
  charDisplay: string;
}

/**
 * Get the target key information and finger guide for a single atomic character / jamo
 */
export function getKeyGuideForChar(char: string | undefined): KeyGuideResult {
  if (!char) {
    return { code: 'Space', finger: 'thumb', fingerName: '양손 엄지', charDisplay: '스페이스' };
  }

  // If Korean syllable passed directly, take its initial consonant for fallback
  let targetUnit = char;
  const code = char.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const syllableIndex = code - 0xAC00;
    targetUnit = CHOSUNG[Math.floor(syllableIndex / (21 * 28))];
  }

  if (HANGUL_TO_KEYCODE[targetUnit]) {
    const item = HANGUL_TO_KEYCODE[targetUnit];
    return {
      code: item.code,
      shift: item.shift,
      finger: item.finger,
      fingerName: item.fingerName,
      charDisplay: targetUnit
    };
  }

  // English letters
  const lower = char.toLowerCase();
  if (ENGLISH_TO_FINGER[lower]) {
    const item = ENGLISH_TO_FINGER[lower];
    const isUpper = char !== lower && /[A-Z]/.test(char);
    return {
      code: item.code,
      shift: isUpper,
      finger: item.finger,
      fingerName: isUpper ? `${item.fingerName} + Shift` : item.fingerName,
      charDisplay: char
    };
  }

  if (/[0-9]/.test(char)) {
    const digitFingers: Record<string, { code: string; finger: FingerType; name: string }> = {
      '1': { code: 'Digit1', finger: 'left-pinky', name: '왼손 새끼' },
      '2': { code: 'Digit2', finger: 'left-ring', name: '왼손 약지' },
      '3': { code: 'Digit3', finger: 'left-middle', name: '왼손 중지' },
      '4': { code: 'Digit4', finger: 'left-index', name: '왼손 검지' },
      '5': { code: 'Digit5', finger: 'left-index', name: '왼손 검지' },
      '6': { code: 'Digit6', finger: 'right-index', name: '오른손 검지' },
      '7': { code: 'Digit7', finger: 'right-index', name: '오른손 검지' },
      '8': { code: 'Digit8', finger: 'right-middle', name: '오른손 중지' },
      '9': { code: 'Digit9', finger: 'right-ring', name: '오른손 약지' },
      '0': { code: 'Digit0', finger: 'right-pinky', name: '오른손 새끼' },
    };
    const mapped = digitFingers[char] || { code: `Digit${char}`, finger: 'right-index' as FingerType, name: '숫자열' };
    return {
      code: mapped.code,
      finger: mapped.finger,
      fingerName: mapped.name,
      charDisplay: char
    };
  }

  if (char === '.' || char === '>') {
    return { code: 'Period', shift: char === '>', finger: 'right-ring', fingerName: '오른손 약지', charDisplay: '.' };
  }
  if (char === ',' || char === '<') {
    return { code: 'Comma', shift: char === '<', finger: 'right-middle', fingerName: '오른손 중지', charDisplay: ',' };
  }
  if (char === ';' || char === ':') {
    return { code: 'Semicolon', shift: char === ':', finger: 'right-pinky', fingerName: '오른손 새끼', charDisplay: ';' };
  }
  if (char === '!' || char === '?') {
    return { code: 'Slash', shift: true, finger: 'right-pinky', fingerName: '오른손 새끼 + Shift', charDisplay: char };
  }
  if (char === '-' || char === '_') {
    return { code: 'Minus', shift: char === '_', finger: 'right-pinky', fingerName: '오른손 새끼', charDisplay: '-' };
  }

  return {
    code: 'Space',
    finger: 'thumb',
    fingerName: '양손 엄지 (스페이스바)',
    charDisplay: char === ' ' ? '스페이스' : char
  };
}

/**
 * Accurately tracks the target keystroke given full target text and user's current typed text
 * Decomposes both into atomic keystroke units so that intermediate consonants and vowels are accurately guided.
 */
export function getActiveKeystrokeGuide(targetText: string, typedText: string): KeyGuideResult {
  const targetKeystrokes = decomposeToAtomicKeystrokes(targetText);
  const typedKeystrokes = decomposeToAtomicKeystrokes(typedText);

  // If user has typed everything
  if (typedKeystrokes.length >= targetKeystrokes.length) {
    return {
      code: 'Space',
      finger: 'thumb',
      fingerName: '완료',
      charDisplay: '완료'
    };
  }

  const nextAtomicChar = targetKeystrokes[typedKeystrokes.length];
  return getKeyGuideForChar(nextAtomicChar);
}

/**
 * Extracts Korean Initial Consonants (Chosung) from a given word.
 * E.g., '서울' -> 'ㅅ ㅇ', '정종' -> 'ㅈ ㅈ', '워싱턴 D.C.' -> 'ㅇ ㅅ ㅌ D . C .'
 */
export function getWordChosung(text: string): string {
  return text
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const chosungIndex = Math.floor((code - 0xac00) / (21 * 28));
        return CHOSUNG[chosungIndex];
      }
      if (char === ' ') return ' ';
      return char;
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Checks if current input string is a valid prefix of target text,
 * correctly supporting Korean syllable composition (batchim transitions and atomic keystrokes).
 */
export function isHangulPrefix(target: string, input: string): boolean {
  if (!input) return true;
  if (target.startsWith(input)) return true;

  const targetStrokes = decomposeToAtomicKeystrokes(target);
  const inputStrokes = decomposeToAtomicKeystrokes(input);

  if (inputStrokes.length > targetStrokes.length) return false;

  for (let i = 0; i < inputStrokes.length; i++) {
    if (inputStrokes[i] !== targetStrokes[i]) {
      return false;
    }
  }
  return true;
}
