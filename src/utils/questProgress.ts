/**
 * 첫 화면 퀘스트맵의 "단계 완료" 진행도
 * - 각 단계의 모든 한글 코스(자리 8단계, 낱말 8단계, 짧은 글 주제, 긴 글 작품)를 한 번씩 끝까지 치면 완료
 * - 완료 기록은 사용자별로 브라우저에 저장하고, 예전 타자 기록(연습 기록)에서도 자동으로 채워 넣음
 */
import { PracticeHistoryRecord } from '../types';
import {
  KOREAN_KEY_PRACTICE_STAGES,
  KOREAN_WORD_PRACTICE_CATEGORIES,
  SENTENCE_PRACTICE_DATA,
} from '../data/practiceData';
import { KOREAN_LONG_TEXTS } from '../data/longTextData';

export type QuestMode = 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice';

const units: Record<QuestMode, string[]> = {
  'key-practice': KOREAN_KEY_PRACTICE_STAGES.map((s) => s.title),
  'word-practice': KOREAN_WORD_PRACTICE_CATEGORIES.map((c: any) => c.name),
  'sentence-practice': (SENTENCE_PRACTICE_DATA as any[]).map((c) => c.category).filter((c: string) => !c.includes('5분')),
  'long-practice': KOREAN_LONG_TEXTS.map((t) => t.id),
};

const key = (userId?: string) => `tp_quest_done_${userId || 'guest'}`;

const load = (userId?: string): Record<string, string[]> => {
  try {
    return JSON.parse(localStorage.getItem(key(userId)) || '{}') || {};
  } catch {
    return {};
  }
};

/** 한 코스를 끝까지 쳤을 때 호출 (한글 코스만 집계) */
export function markQuestUnitDone(userId: string | undefined, mode: QuestMode, unit: string, language: 'ko' | 'en' = 'ko') {
  if (language !== 'ko' || !units[mode].includes(unit)) return;
  const data = load(userId);
  const list = new Set(data[mode] || []);
  if (list.has(unit)) return;
  list.add(unit);
  data[mode] = [...list];
  try {
    localStorage.setItem(key(userId), JSON.stringify(data));
  } catch {}
  window.dispatchEvent(new CustomEvent('quest-progress-updated'));
}

export interface QuestStageProgress {
  done: number;
  total: number;
  complete: boolean;
}

export function getQuestProgress(userId: string | undefined, records: PracticeHistoryRecord[]): Record<QuestMode, QuestStageProgress> {
  const data = load(userId);
  const done: Record<QuestMode, Set<string>> = {
    'key-practice': new Set(data['key-practice'] || []),
    'word-practice': new Set(data['word-practice'] || []),
    'sentence-practice': new Set(data['sentence-practice'] || []),
    'long-practice': new Set(data['long-practice'] || []),
  };
  // 예전 기록에서 채우기: 자리/낱말은 코스를 끝낼 때만 기록이 남고, 긴 글은 '완독' 기록이 남음
  const longByLabel = new Map(KOREAN_LONG_TEXTS.map((t) => [`${t.author} - ${t.title}`, t.id]));
  for (const r of records) {
    if (r.language && r.language !== 'ko') continue;
    if (r.mode === 'key-practice' && units['key-practice'].includes(r.stageTitle)) done['key-practice'].add(r.stageTitle);
    else if (r.mode === 'word-practice' && units['word-practice'].includes(r.stageTitle)) done['word-practice'].add(r.stageTitle);
    else if ((r.modeTitle || '').startsWith('긴 글 완독') || r.mode === 'long-practice') {
      const id = longByLabel.get(r.stageTitle);
      if (id) done['long-practice'].add(id);
    }
  }
  const out = {} as Record<QuestMode, QuestStageProgress>;
  (Object.keys(units) as QuestMode[]).forEach((m) => {
    const total = units[m].length;
    const d = units[m].filter((u) => done[m].has(u)).length;
    out[m] = { done: d, total, complete: total > 0 && d >= total };
  });
  return out;
}
