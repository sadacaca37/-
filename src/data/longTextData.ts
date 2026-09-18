export interface LongTextItem {
  id: string;
  title: string;
  titleKo?: string;
  titleEn?: string;
  author: string;
  authorKo?: string;
  authorEn?: string;
  language: 'ko' | 'en';
  category: 'poem' | 'novel' | 'essay' | 'quote' | 'classic' | 'speech';
  categoryLabel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  era?: string;
  tag?: string;
  quoteSummary?: string;
  description: string;
  paragraphs: string[];
}

import { KOREAN_LONG_TEXTS } from './longTextsKorean';
import { ENGLISH_LONG_TEXTS } from './longTextsEnglish';

export { KOREAN_LONG_TEXTS, ENGLISH_LONG_TEXTS };

export const LONG_TEXT_LIST: LongTextItem[] = [
  ...KOREAN_LONG_TEXTS,
  ...ENGLISH_LONG_TEXTS,
];
