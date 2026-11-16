/**
 * 타자 점수 계산 (모든 연습이 같은 기준을 씀) — 한컴타자 방식에 맞춤
 *
 *  - 타수: 1분 동안 '맞게 친' 자음·모음(키) 수 = 순타수
 *      · 틀리게 친 글자, 스페이스만 누른 것은 타수에 안 들어감
 *      · 오타를 내고 고치느라 쓴 시간도 시간에 들어가므로, 오타가 많으면 타수가 저절로 낮아짐
 *  - 오타: 예문과 비교해 바꿔 친 글자 + 빠뜨린 글자 + 더 친 글자 (편집 거리)
 *      · 한 글자를 빠뜨려도 뒤의 글자가 모두 틀린 것으로 밀려 세지지 않음
 *  - 정확도: (예문 글자 수 - 오타) ÷ 예문 글자 수
 *  - 기록 인정: 타수가 높을수록 정확도가 더 높아야 함 (한컴타자처럼 70~90%)
 */
import { countKeystrokes } from './hangul';

export interface Grade {
  /** 맞게 친 글자 수 */
  correct: number;
  /** 오타 수 (바꿔 친 + 빠뜨린 + 더 친 글자) */
  errors: number;
  /** 맞게 친 글자의 타수 (한글은 자음·모음 하나씩) */
  strokes: number;
  /** 채점한 글자 수 (예문 글자 수와 친 글자 수 중 큰 값) */
  total: number;
}

export const emptyGrade = (): Grade => ({ correct: 0, errors: 0, strokes: 0, total: 0 });

export function addGrade(a: Grade, b: Grade): Grade {
  return { correct: a.correct + b.correct, errors: a.errors + b.errors, strokes: a.strokes + b.strokes, total: a.total + b.total };
}

/**
 * 예문과 친 글을 맞춰 보기 (편집 거리)
 * @param openEnd true 면 예문 뒷부분은 아직 안 친 것으로 보고 오타로 세지 않음 (치는 중)
 */
function align(target: string, typed: string, openEnd: boolean): Grade & { end: number } {
  const n = target.length;
  const m = typed.length;
  if (!m) return { correct: 0, errors: openEnd ? 0 : n, strokes: 0, total: openEnd ? 0 : n, end: 0 };
  // 너무 긴 글은 앞에서부터 같은 부분을 잘라 내고 계산 (속도)
  let pre = 0;
  while (pre < n && pre < m && target[pre] === typed[pre]) pre++;
  let preStrokes = 0;
  for (let i = 0; i < pre; i++) preStrokes += countKeystrokes(target[i]);
  const t = target.slice(pre);
  const v = typed.slice(pre);
  if (!v.length) {
    const missing = openEnd ? 0 : t.length;
    return { correct: pre, errors: missing, strokes: preStrokes, total: openEnd ? pre : Math.max(n, m), end: pre };
  }
  // 친 글 쪽은 끝까지, 예문 쪽은 (openEnd 면) 어디서 끝나도 됨
  const tl = openEnd ? Math.min(t.length, v.length + 20) : t.length;
  const W = v.length + 1;
  const dp = new Uint16Array((tl + 1) * W);
  for (let j = 0; j <= v.length; j++) dp[j] = j;
  for (let i = 1; i <= tl; i++) {
    dp[i * W] = i;
    const ti = t.charCodeAt(i - 1);
    for (let j = 1; j <= v.length; j++) {
      const sub = dp[(i - 1) * W + j - 1] + (ti === v.charCodeAt(j - 1) ? 0 : 1);
      const del = dp[(i - 1) * W + j] + 1; // 예문 글자를 빠뜨림
      const ins = dp[i * W + j - 1] + 1; // 더 침
      dp[i * W + j] = sub < del ? (sub < ins ? sub : ins) : del < ins ? del : ins;
    }
  }
  let endI = tl;
  if (openEnd) {
    let best = Infinity;
    for (let i = 0; i <= tl; i++) {
      const c = dp[i * W + v.length];
      if (c < best || (c === best && Math.abs(i - v.length) < Math.abs(endI - v.length))) {
        best = c;
        endI = i;
      }
    }
  }
  // 거꾸로 따라가며 맞은 글자 세기
  let i = endI;
  let j = v.length;
  let correct = 0;
  let strokes = 0;
  while (i > 0 && j > 0) {
    const cur = dp[i * W + j];
    const same = t.charCodeAt(i - 1) === v.charCodeAt(j - 1);
    if (cur === dp[(i - 1) * W + j - 1] + (same ? 0 : 1)) {
      if (same) {
        correct++;
        strokes += countKeystrokes(t[i - 1]);
      }
      i--;
      j--;
    } else if (cur === dp[(i - 1) * W + j] + 1) i--;
    else j--;
  }
  const errors = dp[endI * W + v.length];
  const total = pre + Math.max(endI, v.length);
  return { correct: pre + correct, errors, strokes: preStrokes + strokes, total, end: pre + endI };
}

/** 다 친 줄 채점 */
export function gradeText(target: string, typed: string): Grade {
  const { end: _e, ...g } = align(target, typed, false);
  return g;
}

/**
 * 치는 중인 줄 채점 (아직 안 친 뒷부분은 오타로 세지 않음)
 *  - 마지막 글자는 한글 조합 중일 수 있으므로(예: '하' → '한'), 앞부분이 맞으면 오타로 세지 않음
 */
export function gradeLive(target: string, typed: string, isPrefix: (target: string, typed: string) => boolean): Grade {
  if (!typed) return emptyGrade();
  const full = align(target, typed, true);
  const last = typed[typed.length - 1];
  if (!full.errors || !/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7a3]/.test(last)) {
    const { end: _e, ...g } = full;
    return g;
  }
  // 마지막 글자를 '조합 중'으로 보고 다시 맞춰 봄: 그 자리에 올 예문 글자의 앞부분이면 오타가 아님
  const head = align(target, typed.slice(0, -1), true);
  const want = target.charAt(head.end);
  const composingOk = !!want && isPrefix(want, last);
  const alt: Grade = {
    correct: head.correct,
    errors: head.errors + (composingOk ? 0 : 1),
    strokes: head.strokes + (composingOk ? countKeystrokes(last) : 0),
    total: head.total + 1,
  };
  if (alt.errors <= full.errors) return alt;
  const { end: _e2, ...g } = full;
  return g;
}

export function accuracyOf(g: Pick<Grade, 'errors' | 'total'>): number {
  if (!g.total) return 100;
  return Math.max(0, Math.min(100, Math.round(((g.total - g.errors) / g.total) * 100)));
}

/** 순타수 = 맞게 친 타수 ÷ 시간(분) */
export function netCpm(correctStrokes: number, elapsedSec: number): number {
  if (!(elapsedSec > 0) || !(correctStrokes > 0)) return 0;
  return Math.max(0, Math.round((correctStrokes * 60) / elapsedSec));
}

/**
 * 기록으로 인정되는 최소 정확도 (한컴타자처럼 타수가 높을수록 더 정확해야 함)
 *  ~199타 70% · 200~399타 80% · 400타~ 90%
 */
export function requiredAccuracy(cpm: number): number {
  if (cpm >= 400) return 90;
  if (cpm >= 200) return 80;
  return 70;
}
export const isRecordable = (cpm: number, accuracy: number) => cpm > 0 && accuracy >= requiredAccuracy(cpm);

/**
 * 스페이스로 다음 줄로 넘어가도 되는지
 *  - 끝까지 쳤으면 넘어감
 *  - 거의 다 쳤고(빠뜨린 글자 10% 이하), 그 자리에 와야 할 글자가 띄어쓰기가 아니면 넘어감
 *    (빠르게 치다가 한두 글자를 빠뜨려도 스페이스가 안 먹혀 '멈춘 것처럼' 보이지 않게, 빠뜨린 글자는 오타로 셈)
 */
export function canAdvanceBySpace(target: string, typedTrimmed: string): boolean {
  const t = target.trimEnd();
  if (typedTrimmed.length >= t.length) return true;
  const slack = Math.max(1, Math.floor(t.length * 0.1));
  return typedTrimmed.length >= t.length - slack && t[typedTrimmed.length] !== ' ';
}

/** Enter 로 넘어가도 되는지: 절반은 쳐야 함 (Enter 만 눌러 건너뛰기 방지) */
export function canAdvanceByEnter(target: string, typed: string): boolean {
  const need = Math.ceil(target.replace(/\s/g, '').length / 2);
  return typed.replace(/\s/g, '').length >= need;
}
