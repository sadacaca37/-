import { UserSession } from '../types';
import { summarizeMonth } from './activityLog';
import { readLocalActivity, StudentActivity } from './studentActivity';
import { characterCanvas } from '../components/MoaCharacter';

export interface CurriculumStepInfo {
  name: string;
  stageName: string;
  progressPercent: number;
  status: '완료' | '학습중' | '도전중' | '시작 전';
}

export interface MonthlyGrowthItem {
  monthIndex: number; // 1, 2, 3, 4 (1월차 ~ 4월차)
  monthNumber: number; // e.g. 5, 6, 7, 8
  monthLabel: string; // e.g. "5월 (1월차)"
  avgCpm: number; // e.g. 150
  highestCpm: number; // e.g. 210
  improvement: number; // e.g. +0, +45, +55, +60
  accuracy: number; // e.g. 96.5%
  practiceCount: number; // e.g. 20
  completedSentences: number;
  stageEvaluation: string; // 예: "⌨️ 자리연습 8일 연습 · 23세트"
  activeDays?: number; // 그 달에 연습한 날 수
  keystrokes?: number; // 그 달에 친 글자 수
  minutes?: number; // 그 달 연습 시간(분)
}

export interface FourMonthStudentReport {
  year: number;
  halfTerm: '상반기' | '하반기';
  periodTitle: string; // e.g. "2026년 상반기 (3월~6월) 타자 성장 종합 성적표" or "2026년 하반기 (7월~10월) 타자 성장 종합 성적표"
  startMonth: number;
  endMonth: number;
  studentName: string;
  studentPhone: string;
  parentPhone: string;
  avatarEmoji?: string;
  avatarConfig?: any;
  levelTitle: string;
  grade?: number;

  // 4 individual consecutive months data
  monthlyBreakdown: MonthlyGrowthItem[];

  // 4-Month Summary metrics
  startCpm: number; // Month 1 average
  finalAvgCpm: number; // Month 4 average
  highestCpm: number; // Highest recorded CPM across 4 months
  totalImprovement: number; // finalAvgCpm - startCpm
  avgAccuracy: number;
  totalPracticeCount: number; // 4-month total practice sessions
  totalKeystrokes: number; // 4-month total keystrokes
  totalPracticeMinutes: number;
  speedTier: string;
  speedEvaluation: string;
  gradeBadge: 'S' | 'A+' | 'A' | 'B+' | '-';
  /** 이 기간에 끝까지 친 연습 기록이 하나라도 있는지 */
  hasData: boolean;
  /** 4개월 동안 연습한 날 수 */
  totalActiveDays: number;

  // Curriculum progress (진도표)
  curriculum: {
    keyPractice: CurriculumStepInfo;
    wordPractice: CurriculumStepInfo;
    sentencePractice: CurriculumStepInfo;
    gamePractice: CurriculumStepInfo;
    overallProgressPercent: number;
    currentStageTitle: string;
  };

  teacherComment: string;
}

// Backward compatibility alias
export type MonthlyTypingStats = FourMonthStudentReport;

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
/** "+43타 상승 ↑" / "12타 내려감 ↓" / "그대로" */
export const improvementText = (n: number) => (n > 0 ? `+${n}타 상승 ↑` : n < 0 ? `${Math.abs(n)}타 내려감 ↓` : '변동 없음');

const MODE_LABEL: Record<string, string> = { key: '⌨️ 자리연습', word: '📖 낱말연습', sent: '📝 짧은글', long: '📚 긴글', etc: '🎓 지식타자' };

/**
 * 4개월 성적표를 "실제 연습 기록"으로 만듦
 *  - activity: 학생의 학습 일지·진도 (선생님이 볼 때는 서버에서 받은 것, 학생 본인은 이 브라우저의 것)
 *  - 연습 기록이 없는 달은 0 으로, 기록이 전혀 없으면 hasData=false
 */
export function getMonthlyStudentReport(
  user: UserSession | null,
  targetPeriodOffset = 0,
  activity?: StudentActivity | null,
): FourMonthStudentReport {
  const now = new Date();
  // 4-month window ending month
  const endTargetDate = new Date(now.getFullYear(), now.getMonth() - targetPeriodOffset * 4, 1);
  const endMonth = endTargetDate.getMonth() + 1;
  const year = endTargetDate.getFullYear();

  // 4 consecutive months: (끝 달 - 3) ~ 끝 달, 해가 바뀌는 경우까지 정확히
  const monthList: { y: number; m: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(endTargetDate.getFullYear(), endTargetDate.getMonth() - i, 1);
    monthList.push({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }
  const startMonth = monthList[0].m;

  const studentName = user?.name || '학생';
  const studentPhone = user?.phone || '';
  const parentPhone = user?.parentPhone || user?.phone || '';
  const studentGrade = user?.grade || 3;

  const act = activity || (user?.id ? readLocalActivity(user.id) : null);
  const days = act?.days || {};

  let prevAvg = 0;
  const monthlyBreakdown: MonthlyGrowthItem[] = monthList.map(({ y, m }, idx) => {
    const sm = summarizeMonth(days, y, m);
    const has = sm.sets > 0;
    const improvement = has && prevAvg > 0 ? sm.avgCpm - prevAvg : 0;
    if (has) prevAvg = sm.avgCpm;
    const top = Object.entries(sm.byMode).sort((a, b) => b[1] - a[1])[0]?.[0];
    const stageEvaluation = has
      ? `${MODE_LABEL[top || 'etc'] || MODE_LABEL.etc} ${sm.activeDays}일 연습 · ${sm.sets}세트`
      : sm.activeDays > 0
      ? `✏️ 연습중 ${sm.activeDays}일 연습 · 완주 0세트`
      : '💤 기록없음 이 달은 연습하지 않았어요';
    return {
      monthIndex: idx + 1,
      monthNumber: m,
      monthLabel: `${m}월 (${idx + 1}월차)`,
      avgCpm: sm.avgCpm,
      highestCpm: sm.bestCpm,
      improvement,
      accuracy: sm.avgAcc,
      practiceCount: sm.sets,
      completedSentences: sm.sets,
      stageEvaluation,
      activeDays: sm.activeDays,
      keystrokes: sm.keys,
      minutes: sm.minutes,
    };
  });

  const withData = monthlyBreakdown.filter((m) => m.practiceCount > 0);
  const hasData = withData.length > 0;
  const startCpm = hasData ? withData[0].avgCpm : 0;
  const finalAvgCpm = hasData ? withData[withData.length - 1].avgCpm : 0;
  const highestCpm = Math.max(0, ...monthlyBreakdown.map((m) => m.highestCpm));
  const totalImprovement = finalAvgCpm - startCpm;
  const totalPracticeCount = monthlyBreakdown.reduce((acc, m) => acc + m.practiceCount, 0);
  const totalKeystrokes = monthlyBreakdown.reduce((acc, m) => acc + (m.keystrokes || 0), 0);
  const totalPracticeMinutes = monthlyBreakdown.reduce((acc, m) => acc + (m.minutes || 0), 0);
  const totalActiveDays = monthlyBreakdown.reduce((acc, m) => acc + (m.activeDays || 0), 0);
  const avgAccuracy = totalPracticeCount
    ? +(monthlyBreakdown.reduce((acc, m) => acc + m.accuracy * m.practiceCount, 0) / totalPracticeCount).toFixed(1)
    : 0;

  // 속도 유형 & 한 줄 분석 (실제 숫자 기준)
  let speedTier = '🌱 기초 다지기';
  let speedEvaluation = '';
  if (!hasData) {
    speedTier = '💤 기록 없음';
    speedEvaluation = '이 기간에는 끝까지 친 연습 기록이 없어요.';
  } else if (withData.length === 1) {
    speedTier = finalAvgCpm >= 250 ? '⚡ 빠른 손' : '🌱 기초 다지기';
    speedEvaluation = `${withData[0].monthNumber}월 평균 ${finalAvgCpm}타 · 최고 ${highestCpm}타 (${totalActiveDays}일 연습).`;
  } else if (totalImprovement >= 100) {
    speedTier = '🚀 폭풍 성장형';
    speedEvaluation = `${startCpm}타 → ${finalAvgCpm}타, ${signed(totalImprovement)}타! 크게 빨라졌어요.`;
  } else if (totalImprovement >= 30) {
    speedTier = '🌟 꾸준한 성장형';
    speedEvaluation = `${startCpm}타 → ${finalAvgCpm}타, ${signed(totalImprovement)}타 꾸준히 올랐어요.`;
  } else if (totalImprovement > -15) {
    speedTier = '🎯 안정 유지형';
    speedEvaluation = `평균 ${finalAvgCpm}타를 안정적으로 유지했어요 (${signed(totalImprovement)}타).`;
  } else {
    speedTier = '💪 다시 도전형';
    speedEvaluation = `${startCpm}타 → ${finalAvgCpm}타. 조금 더 자주 연습하면 금방 회복할 수 있어요.`;
  }

  let gradeBadge: FourMonthStudentReport['gradeBadge'] = '-';
  if (hasData) {
    if (finalAvgCpm >= 360) gradeBadge = 'S';
    else if (finalAvgCpm >= 260) gradeBadge = 'A+';
    else if (finalAvgCpm >= 170) gradeBadge = 'A';
    else gradeBadge = 'B+';
  }

  // 진도표: 실제로 끝낸 코스 수
  const q = act?.quest;
  const step = (name: string, mode: 'key-practice' | 'word-practice' | 'sentence-practice' | 'long-practice'): CurriculumStepInfo => {
    const done = q?.[mode]?.done || 0;
    const total = q?.[mode]?.total || 0;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { name, stageName: `${done} / ${total} 코스 완료`, progressPercent: pct, status: pct >= 100 ? '완료' : pct > 0 ? '학습중' : '시작 전' };
  };
  const keyPractice = step('자리 연습', 'key-practice');
  const wordPractice = step('낱말 연습', 'word-practice');
  const sentencePractice = step('짧은 글 연습', 'sentence-practice');
  const gamePractice = step('긴 글 연습', 'long-practice');
  const overallPct = act?.questPercent || 0;
  const currentStageTitle =
    keyPractice.progressPercent < 100
      ? '자리 연습 과정'
      : wordPractice.progressPercent < 100
      ? '낱말 연습 과정'
      : sentencePractice.progressPercent < 100
      ? '짧은 글 연습 과정'
      : gamePractice.progressPercent < 100
      ? '긴 글 연습 과정'
      : '전 과정 완료';

  // Half term determination (1~6월: 상반기, 7~12월: 하반기)
  const halfTerm: '상반기' | '하반기' = endMonth <= 6 || (startMonth <= 5 && endMonth <= 7) ? '상반기' : '하반기';
  const periodTitle = `${year}년 ${halfTerm} (${startMonth}월~${endMonth}월) 타자 성장 종합 성적표`;

  let teacherComment: string;
  if (!hasData) {
    teacherComment = `${studentName} 학생은 ${startMonth}월~${endMonth}월 동안 끝까지 친 타자 연습 기록이 아직 없습니다. 하루 10분씩 자리 연습부터 차근차근 시작해 보아요!`;
  } else {
    const growth =
      withData.length > 1
        ? totalImprovement > 0
          ? ` 평균 타수는 ${startCpm}타에서 ${finalAvgCpm}타로 ${totalImprovement}타 올랐습니다.`
          : totalImprovement < 0
          ? ` 평균 타수는 ${startCpm}타에서 ${finalAvgCpm}타로 조금 내려갔으니, 정확하게 치는 연습을 꾸준히 이어가면 좋겠습니다.`
          : ` 평균 타수는 ${finalAvgCpm}타를 유지했습니다.`
        : ` 평균 타수는 ${finalAvgCpm}타입니다.`;
    teacherComment = `${studentName} 학생(${studentGrade}학년)은 ${startMonth}월~${endMonth}월 동안 ${totalActiveDays}일, 모두 ${totalPracticeCount}세트(${totalKeystrokes.toLocaleString()}타)를 연습했습니다.${growth} 최고 기록은 ${highestCpm}타, 평균 정확도는 ${avgAccuracy}%이며 현재 ${currentStageTitle}(전체 진도 ${overallPct}%)을 진행하고 있습니다.`;
  }

  return {
    year,
    halfTerm,
    periodTitle,
    startMonth,
    endMonth,
    studentName,
    studentPhone,
    parentPhone,
    avatarEmoji: user?.avatar || '🐱',
    avatarConfig: user?.avatarConfig,
    levelTitle: user?.levelTitle || `${studentGrade}학년 타자 꿈나무`,
    grade: studentGrade,
    monthlyBreakdown,
    startCpm,
    finalAvgCpm,
    highestCpm,
    totalImprovement,
    avgAccuracy,
    totalPracticeCount,
    totalKeystrokes,
    totalPracticeMinutes,
    totalActiveDays,
    hasData,
    speedTier,
    speedEvaluation,
    gradeBadge,
    curriculum: {
      keyPractice,
      wordPractice,
      sentencePractice,
      gamePractice,
      overallProgressPercent: overallPct,
      currentStageTitle,
    },
    teacherComment,
  };
}

/* ====================== 성적표 그리기 (귀엽고 산뜻한 도트 느낌) ====================== */
const INK = '#1b2340';
const PASTEL = ['#ff9ec7', '#ffe066', '#7fe0b4', '#7cc8ff', '#c7a6ff'];
const FONT_DOT = '"Galmuri11", "Malgun Gothic", sans-serif';
const FONT_BODY = '"Noto Sans KR", "Malgun Gothic", sans-serif';

/** 계단처럼 모서리를 깎은 도트 상자 */
function dotBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, opts: { line?: string; t?: number; shadow?: boolean } = {}) {
  const t = opts.t ?? 4;
  const line = opts.line ?? INK;
  const step = (bx: number, by: number, bw: number, bh: number, c: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(bx + c, by, bw - 2 * c, bh);
    ctx.fillRect(bx, by + c, bw, bh - 2 * c);
    ctx.fillRect(bx + c / 2, by + c / 2, bw - c, bh - c);
  };
  if (opts.shadow !== false) step(x, y + 6, w, h, t * 2, 'rgba(27,35,64,0.22)');
  step(x, y, w, h, t * 2, line);
  step(x + t, y + t, w - 2 * t, h - 2 * t, t, fill);
}

/** 작은 도트 그림 (하트·별) */
const HEART = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000'];
const STAR = ['00010000', '00111000', '11111110', '01111100', '00111000', '01101100', '01000100'];
function dotSprite(ctx: CanvasRenderingContext2D, grid: string[], x: number, y: number, px: number, color: string) {
  grid.forEach((row, r) =>
    [...row].forEach((v, c) => {
      if (v !== '1') return;
      ctx.fillStyle = INK;
      ctx.fillRect(x + c * px - 1, y + r * px - 1, px + 2, px + 2);
    }),
  );
  grid.forEach((row, r) =>
    [...row].forEach((v, c) => {
      if (v !== '1') return;
      ctx.fillStyle = color;
      ctx.fillRect(x + c * px, y + r * px, px, px);
    }),
  );
}

/** 칸칸이 채우는 도트 진행 막대 */
function dotProgress(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pct: number, color: string) {
  dotBox(ctx, x, y, w, h, '#ffffff', { t: 3, shadow: false });
  const segs = 10;
  const gap = 3;
  const inner = w - 12;
  const sw = (inner - gap * (segs - 1)) / segs;
  const on = Math.round((Math.max(0, Math.min(100, pct)) / 100) * segs);
  for (let i = 0; i < segs; i++) {
    ctx.fillStyle = i < on ? color : '#e8eef7';
    ctx.fillRect(x + 6 + i * (sw + gap), y + 6, sw, h - 12);
    if (i < on) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(x + 6 + i * (sw + gap), y + 6, sw, 3);
    }
  }
}

export async function generateReportCardImage(report: FourMonthStudentReport, opts: { outfit?: any } = {}): Promise<{ dataUrl: string; blob: Blob }> {
  const W = 960;
  const H = 1320;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  ctx.imageSmoothingEnabled = false;
  try {
    await Promise.all([document.fonts.load(`700 20px "Galmuri11"`), document.fonts.load(`400 20px "Galmuri11"`)]);
  } catch {}

  // 1) 바탕: 연한 민트 + 물방울 도트
  ctx.fillStyle = '#eafaf3';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(124, 200, 255, 0.18)';
  for (let y = 12; y < H; y += 24) for (let x = (y / 24) % 2 ? 24 : 12; x < W; x += 24) ctx.fillRect(x, y, 4, 4);

  // 2) 테두리: 알록달록 도트 블록 띠 + 남색 선
  const M = 18; // 바깥 여백
  const B = 20; // 블록 크기
  ctx.fillStyle = INK;
  ctx.fillRect(M - 4, M - 4, W - 2 * M + 8, H - 2 * M + 8);
  let k = 0;
  for (let x = M; x < W - M; x += B, k++) {
    ctx.fillStyle = PASTEL[k % PASTEL.length];
    ctx.fillRect(x, M, Math.min(B, W - M - x) - 2, B - 2);
    ctx.fillStyle = PASTEL[(k + 2) % PASTEL.length];
    ctx.fillRect(x, H - M - B + 2, Math.min(B, W - M - x) - 2, B - 2);
  }
  k = 0;
  for (let y = M + B; y < H - M - B; y += B, k++) {
    ctx.fillStyle = PASTEL[(k + 1) % PASTEL.length];
    ctx.fillRect(M, y, B - 2, Math.min(B, H - M - B - y) - 2);
    ctx.fillStyle = PASTEL[(k + 3) % PASTEL.length];
    ctx.fillRect(W - M - B + 2, y, B - 2, Math.min(B, H - M - B - y) - 2);
  }
  // 안쪽 종이
  ctx.fillStyle = INK;
  ctx.fillRect(M + B, M + B, W - 2 * (M + B), H - 2 * (M + B));
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(M + B + 4, M + B + 4, W - 2 * (M + B) - 8, H - 2 * (M + B) - 8);
  ctx.fillStyle = 'rgba(255, 158, 199, 0.10)';
  for (let y = M + B + 16; y < H - M - B; y += 28) for (let x = M + B + ((y / 28) % 2 ? 30 : 16); x < W - M - B; x += 28) ctx.fillRect(x, y, 3, 3);
  // 네 모서리 하트·별
  dotSprite(ctx, HEART, 70, 70, 5, '#ff7eb6');
  dotSprite(ctx, STAR, W - 112, 70, 5, '#ffd43b');
  dotSprite(ctx, STAR, 68, H - 102, 4, '#7cc8ff');
  dotSprite(ctx, HEART, W - 100, H - 102, 4, '#7fe0b4');

  // 3) 제목: 타자팡 로고 글자 + "타자 성적표"
  const word = await loadImage('./assets/brand/tajapang_word.webp');
  ctx.imageSmoothingEnabled = true;
  const titleText = '타자 성적표';
  ctx.font = `700 46px ${FONT_DOT}`;
  const tw = ctx.measureText(titleText).width;
  const wordH = 70;
  const wordW = word ? (word.width / word.height) * wordH : 0;
  const totalW = wordW + (word ? 16 : 0) + tw;
  let tx = (W - totalW) / 2;
  if (word) {
    ctx.drawImage(word, tx, 78, wordW, wordH);
    tx += wordW + 16;
  }
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = INK;
  ctx.strokeText(titleText, tx, 132);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(titleText, tx, 132);
  ctx.imageSmoothingEnabled = false;
  // 기간 리본
  ctx.font = `700 18px ${FONT_DOT}`;
  const pw = ctx.measureText(report.periodTitle).width + 44;
  dotBox(ctx, (W - pw) / 2, 160, pw, 40, '#ffe066', { t: 3 });
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.fillText(report.periodTitle, W / 2, 187);

  // 4) 학생 카드 (지금 캐릭터)
  const pY = 222;
  dotBox(ctx, 80, pY, 800, 186, '#ffffff');
  // 캐릭터 무대
  dotBox(ctx, 100, pY + 18, 150, 150, '#dff4ff', { t: 3, shadow: false });
  ctx.fillStyle = 'rgba(27,35,64,0.18)';
  ctx.fillRect(130, pY + 148, 90, 8);
  const ch = await characterCanvas(opts.outfit, 256);
  if (ch) ctx.drawImage(ch, 0, 0, 256, 256, 103, pY + 14, 144, 144);
  else {
    ctx.font = '72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(report.avatarEmoji || '🐱', 175, pY + 120);
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `700 34px ${FONT_DOT}`;
  ctx.fillText(report.studentName, 276, pY + 62);
  const nw = ctx.measureText(report.studentName).width;
  dotBox(ctx, 276 + nw + 14, pY + 30, 92, 40, '#7cc8ff', { t: 3, shadow: false });
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 18px ${FONT_DOT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`${report.grade || 3}학년`, 276 + nw + 60, pY + 57);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8559a';
  ctx.font = `700 18px ${FONT_BODY}`;
  ctx.fillText(`🏅 ${report.levelTitle}`, 276, pY + 102);
  ctx.fillStyle = '#3d7a5c';
  ctx.fillText(`${report.speedTier}`, 276, pY + 132);
  ctx.fillStyle = '#7a86a3';
  ctx.font = `500 14px ${FONT_BODY}`;
  ctx.fillText(`발행일 ${new Date().toLocaleDateString('ko-KR')}`, 276, pY + 160);
  // 등급 도장
  dotBox(ctx, 740, pY + 30, 116, 124, '#ff9ec7');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = `700 44px ${FONT_DOT}`;
  ctx.lineWidth = 6;
  ctx.strokeStyle = INK;
  ctx.strokeText(report.gradeBadge, 798, pY + 100);
  ctx.fillText(report.gradeBadge, 798, pY + 100);
  ctx.fillStyle = INK;
  ctx.font = `700 14px ${FONT_DOT}`;
  ctx.fillText(`${report.halfTerm} 등급`, 798, pY + 136);

  // 5) 월별 막대그래프
  const gY = 430;
  const gH = 372;
  dotBox(ctx, 80, gY, 800, gH, '#ffffff');
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = `700 22px ${FONT_DOT}`;
  ctx.fillText(`📊 달마다 타자 속도 (${report.startMonth}월~${report.endMonth}월)`, 108, gY + 42);
  // 범례
  const legend = (x: number, color: string, label: string) => {
    ctx.fillStyle = INK;
    ctx.fillRect(x - 2, gY + 26, 20, 20);
    ctx.fillStyle = color;
    ctx.fillRect(x, gY + 28, 16, 16);
    ctx.fillStyle = INK;
    ctx.font = `700 14px ${FONT_DOT}`;
    ctx.fillText(label, x + 24, gY + 42);
  };
  legend(628, '#7cc8ff', '평균');
  legend(720, '#ff9ec7', '최고');
  // 차트 영역
  const cx0 = 150;
  const cx1 = 850;
  const cy0 = gY + 76; // 위
  const cy1 = gY + 246; // 바닥
  const maxVal = Math.max(100, ...report.monthlyBreakdown.map((m) => Math.max(m.highestCpm || 0, m.avgCpm || 0)));
  const top = Math.ceil((maxVal * 1.15) / 50) * 50;
  ctx.font = `400 12px ${FONT_DOT}`;
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const v = Math.round((top / 4) * i);
    const yy = cy1 - ((cy1 - cy0) * i) / 4;
    ctx.fillStyle = i === 0 ? INK : '#e3e9f3';
    if (i === 0) ctx.fillRect(cx0, yy, cx1 - cx0, 3);
    else for (let x = cx0; x < cx1; x += 10) ctx.fillRect(x, yy, 5, 2);
    ctx.fillStyle = '#7a86a3';
    ctx.fillText(`${v}`, cx0 - 10, yy + 4);
  }
  const groupW = (cx1 - cx0) / 4;
  const barW = 46;
  report.monthlyBreakdown.forEach((m, i) => {
    const gx = cx0 + groupW * i + groupW / 2;
    const bars: [number, string][] = [
      [m.avgCpm || 0, '#7cc8ff'],
      [m.highestCpm || 0, '#ff9ec7'],
    ];
    bars.forEach(([v, color], j) => {
      const bx = gx - barW - 3 + j * (barW + 6);
      const bh = Math.max(v > 0 ? 8 : 0, Math.round(((cy1 - cy0) * v) / top));
      if (bh > 0) {
        ctx.fillStyle = INK;
        ctx.fillRect(bx - 3, cy1 - bh - 3, barW + 6, bh + 3);
        ctx.fillStyle = color;
        ctx.fillRect(bx, cy1 - bh, barW, bh);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(bx, cy1 - bh, 8, bh);
        ctx.fillStyle = 'rgba(27,35,64,0.15)';
        ctx.fillRect(bx + barW - 6, cy1 - bh, 6, bh);
      }
      ctx.fillStyle = INK;
      ctx.font = `700 15px ${FONT_DOT}`;
      ctx.textAlign = 'center';
      ctx.fillText(v > 0 ? `${v}` : '-', bx + barW / 2, cy1 - bh - 10);
    });
    // 달 이름 + 변화
    ctx.fillStyle = INK;
    ctx.font = `700 17px ${FONT_DOT}`;
    ctx.fillText(`${m.monthNumber}월`, gx, cy1 + 26);
    ctx.font = `700 13px ${FONT_BODY}`;
    if (m.practiceCount <= 0) {
      ctx.fillStyle = '#a3adc2';
      ctx.fillText('기록 없음', gx, cy1 + 47);
    } else {
      ctx.fillStyle = m.improvement > 0 ? '#e8559a' : '#7a86a3';
      ctx.fillText(m.improvement ? improvementText(m.improvement) : `정확도 ${m.accuracy}%`, gx, cy1 + 47);
    }
  });
  // 요약 줄
  dotBox(ctx, 104, gY + gH - 70, 752, 52, '#eafaf3', { t: 3, shadow: false });
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2f6b4f';
  ctx.font = `700 15px ${FONT_BODY}`;
  ctx.fillText(
    report.hasData
      ? `⚡ 평균 ${report.startCpm}타 → ${report.finalAvgCpm}타 (${improvementText(report.totalImprovement)}) · 최고 ${report.highestCpm}타 · 정확도 ${report.avgAccuracy}%`
      : '⚡ 이 기간에는 아직 연습 기록이 없어요.',
    122,
    gY + gH - 48,
  );
  ctx.fillStyle = '#5a6b8a';
  ctx.font = `500 13px ${FONT_BODY}`;
  ctx.fillText(`연습량 ${report.totalActiveDays}일 · ${report.totalPracticeCount}세트 · ${report.totalPracticeMinutes}분 · ${report.totalKeystrokes.toLocaleString()}타`, 122, gY + gH - 28);

  // 6) 진도표
  const prY = 822;
  dotBox(ctx, 80, prY, 800, 214, '#ffffff');
  ctx.fillStyle = INK;
  ctx.font = `700 22px ${FONT_DOT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`🗺️ 단계별 진도 (전체 ${report.curriculum.overallProgressPercent}%)`, 108, prY + 42);
  const stages = [report.curriculum.keyPractice, report.curriculum.wordPractice, report.curriculum.sentencePractice, report.curriculum.gamePractice];
  const colors = ['#7cc8ff', '#7fe0b4', '#ffd43b', '#c7a6ff'];
  stages.forEach((st, i) => {
    const sy = prY + 64 + i * 36;
    ctx.fillStyle = INK;
    ctx.font = `700 15px ${FONT_BODY}`;
    ctx.textAlign = 'left';
    ctx.fillText(st.name, 108, sy + 19);
    ctx.fillStyle = '#8a94ab';
    ctx.font = `500 13px ${FONT_BODY}`;
    ctx.fillText(st.stageName, 236, sy + 19);
    dotProgress(ctx, 470, sy, 260, 28, st.progressPercent, st.progressPercent >= 100 ? '#3ccf8e' : colors[i]);
    ctx.fillStyle = st.progressPercent >= 100 ? '#1f9e66' : INK;
    ctx.font = `700 14px ${FONT_DOT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${st.progressPercent}% ${st.status}`, 852, sy + 19);
  });

  // 7) 선생님 한마디 (말풍선)
  const tY = 1056;
  dotBox(ctx, 80, tY, 800, 150, '#fff4fa');
  // 말풍선 꼬리
  ctx.fillStyle = INK;
  ctx.fillRect(128, tY - 14, 24, 18);
  ctx.fillStyle = '#fff4fa';
  ctx.fillRect(132, tY - 10, 16, 18);
  ctx.fillStyle = '#e8559a';
  ctx.font = `700 20px ${FONT_DOT}`;
  ctx.textAlign = 'left';
  ctx.fillText(`💌 선생님 한마디`, 108, tY + 40);
  ctx.fillStyle = '#3d4a66';
  ctx.font = `600 16px ${FONT_BODY}`;
  wrapText(ctx, report.teacherComment, 108, tY + 74, 744, 26);

  // 8) 아래 한 줄
  ctx.fillStyle = INK;
  ctx.font = `700 15px ${FONT_DOT}`;
  ctx.textAlign = 'center';
  ctx.fillText('★ 꾸준한 타자 연습이 평생 가는 컴퓨터 습관을 만들어요! ★', W / 2, 1256);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve({ dataUrl: canvas.toDataURL('image/png'), blob });
    }, 'image/png');
  });
}

/**
 * Utility helper to draw rounded rectangles
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Utility to wrap canvas multi-line text nicely
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

/** 그림 불러오기 (못 불러오면 null → 그림 없이 그림) */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}
