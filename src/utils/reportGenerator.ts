import { UserSession } from '../types';
import { summarizeMonth } from './activityLog';
import { readLocalActivity, StudentActivity } from './studentActivity';

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

/**
 * Draws the 4-Month Periodic Report Card on an HTML5 Canvas and returns a high-res PNG Data URL & Blob
 */
export async function generateReportCardImage(report: FourMonthStudentReport): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 1320;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Background Gradient (Cute Pastel Retro Arcade Theme)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 1320);
  bgGrad.addColorStop(0, '#FFF5F8');
  bgGrad.addColorStop(0.25, '#F0F9FF');
  bgGrad.addColorStop(0.8, '#FAF5FF');
  bgGrad.addColorStop(1, '#FFF1F2');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 960, 1320);

  // Outer Decorative Borders
  ctx.strokeStyle = '#F472B6';
  ctx.lineWidth = 14;
  ctx.strokeRect(20, 20, 920, 1280);

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 3;
  ctx.strokeRect(32, 32, 896, 1256);

  // Header Banner Ribbon
  const ribbonGrad = ctx.createLinearGradient(80, 50, 880, 50);
  ribbonGrad.addColorStop(0, '#EC4899');
  ribbonGrad.addColorStop(0.5, '#8B5CF6');
  ribbonGrad.addColorStop(1, '#3B82F6');
  ctx.fillStyle = ribbonGrad;
  roundRect(ctx, 60, 55, 840, 135, 24);
  ctx.fill();

  // Header Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ 타자팡팡 타자 성적표 ✨', 480, 100);

  ctx.font = '900 36px "Malgun Gothic", sans-serif';
  ctx.fillText(`${report.periodTitle}`, 480, 150);

  // Student Profile Card Box
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 6;
  roundRect(ctx, 60, 210, 840, 145, 20);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, 210, 840, 145, 20);
  ctx.stroke();

  // Student Avatar Circle / Emoji
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.arc(135, 282, 48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(report.avatarEmoji || '🐱', 135, 300);

  // Student Name & Info
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 30px "Malgun Gothic", sans-serif';
  ctx.fillText(`${report.studentName} (${report.grade || 3}학년)`, 205, 262);

  ctx.fillStyle = '#EC4899';
  ctx.font = 'bold 17px "Malgun Gothic", sans-serif';
  ctx.fillText(`칭호: [${report.levelTitle}]  •  평가 유형: [${report.speedTier}]`, 205, 296);

  ctx.fillStyle = '#64748B';
  ctx.font = '14px "Malgun Gothic", sans-serif';
  ctx.fillText(`학부모 연락처: ${report.parentPhone}  |  발행일: ${new Date().toLocaleDateString('ko-KR')}`, 205, 325);

  // Grade Medal Stamp
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(825, 282, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 34px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(report.gradeBadge, 825, 292);
  ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
  ctx.fillText(`${report.halfTerm} 종합`, 825, 310);

  // =========================================================================
  // SECTION 1: 4-MONTH MONTH-BY-MONTH SPEED GROWTH (4개월간 월별 타수 성장 추이)
  // =========================================================================
  const growthY = 375;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, growthY, 840, 315, 22);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 60, growthY, 840, 315, 22);
  ctx.stroke();

  // Growth Section Header Title
  ctx.fillStyle = '#0369A1';
  ctx.font = '900 20px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`📈 4개월간 월별 타자 속도 (${report.startMonth}월 ~ ${report.endMonth}월)`, 85, growthY + 36);

  // Growth Summary Badge Top-Right
  ctx.fillStyle = '#EC4899';
  ctx.font = '900 16px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    report.hasData ? `평균 타수: ${improvementText(report.totalImprovement)} (${report.startCpm}타 ➔ ${report.finalAvgCpm}타)` : '연습 기록 없음',
    875,
    growthY + 36,
  );

  // 4 Month Cards side-by-side
  const cardW = 185;
  const cardH = 175;
  const gap = 13;
  const startX = 82;
  const startCardY = growthY + 55;

  report.monthlyBreakdown.forEach((m, idx) => {
    const cx = startX + idx * (cardW + gap);
    const cy = startCardY;

    // Card background
    const bgColors = ['#F8FAFC', '#F0FDF4', '#EFF6FF', '#FAF5FF'];
    const borderColors = ['#CBD5E1', '#86EFAC', '#93C5FD', '#D8B4FE'];
    ctx.fillStyle = bgColors[idx];
    roundRect(ctx, cx, cy, cardW, cardH, 14);
    ctx.fill();
    ctx.strokeStyle = borderColors[idx];
    ctx.lineWidth = 2;
    roundRect(ctx, cx, cy, cardW, cardH, 14);
    ctx.stroke();

    // Month Pill Header
    ctx.fillStyle = idx === 3 ? '#9333EA' : idx === 2 ? '#2563EB' : idx === 1 ? '#16A34A' : '#475569';
    roundRect(ctx, cx + 12, cy + 12, cardW - 24, 26, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 13px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.monthLabel, cx + cardW / 2, cy + 29);

    // Monthly Average CPM (Big Number)
    ctx.fillStyle = '#0F172A';
    ctx.font = '900 24px "Malgun Gothic", sans-serif';
    ctx.fillText(`${m.avgCpm}`, cx + cardW / 2 - 12, cy + 74);
    ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('CPM', cx + cardW / 2 + 25, cy + 74);

    // Improvement Tag
    if (m.practiceCount <= 0) {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
      ctx.fillText('연습 기록 없음', cx + cardW / 2, cy + 96);
    } else if (m.improvement === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
      ctx.fillText('평균 타수', cx + cardW / 2, cy + 96);
    } else {
      ctx.fillStyle = m.improvement > 0 ? '#EC4899' : '#64748B';
      ctx.font = '900 13px "Malgun Gothic", sans-serif';
      ctx.fillText(improvementText(m.improvement), cx + cardW / 2, cy + 96);
    }

    // Monthly Peak & Accuracy
    ctx.fillStyle = '#475569';
    ctx.font = '11px "Malgun Gothic", sans-serif';
    ctx.fillText(m.practiceCount > 0 ? `최고 ${m.highestCpm}타 • 정확 ${m.accuracy}%` : '–', cx + cardW / 2, cy + 118);

    // Stage Step tag
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, cx + 8, cy + 130, cardW - 16, 32, 6);
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    roundRect(ctx, cx + 8, cy + 130, cardW - 16, 32, 6);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 10px "Malgun Gothic", sans-serif';
    ctx.fillText(m.stageEvaluation.split(' ')[0] + ' ' + (m.stageEvaluation.split(' ')[1] || ''), cx + cardW / 2, cy + 145);
    ctx.fillText(m.stageEvaluation.split(' ').slice(2).join(' '), cx + cardW / 2, cy + 157);
  });

  // Step connecting arrows between cards
  for (let i = 0; i < 3; i++) {
    const arrowX = startX + (i + 1) * cardW + i * gap + gap / 2;
    const arrowY = startCardY + 68;
    ctx.fillStyle = '#EC4899';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('➜', arrowX, arrowY);
  }

  // Growth Summary Text Bar inside Section 1
  ctx.fillStyle = '#F0FDF4';
  roundRect(ctx, 82, growthY + 242, 796, 56, 12);
  ctx.fill();
  ctx.strokeStyle = '#86EFAC';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 82, growthY + 242, 796, 56, 12);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.fillStyle = '#166534';
  ctx.font = '900 14px "Malgun Gothic", sans-serif';
  ctx.fillText(`⚡ 4개월 종합 분석: ${report.speedEvaluation}`, 98, growthY + 266);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
  ctx.fillText(
    `4개월 연습량: ${report.totalActiveDays}일 · ${report.totalKeystrokes.toLocaleString()}타 (${report.totalPracticeCount}세트 • ${report.totalPracticeMinutes}분)  |  최고 속도: ${report.highestCpm} CPM`,
    98,
    growthY + 287
  );

  // =========================================================================
  // SECTION 2: 4-AREA CURRICULUM PROGRESS TABLE (4대 영역 학습 진도표)
  // =========================================================================
  const progY = 710;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 60, progY, 840, 245, 22);
  ctx.fill();
  ctx.strokeStyle = '#F472B6';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 60, progY, 840, 245, 22);
  ctx.stroke();

  ctx.fillStyle = '#BE185D';
  ctx.font = '900 20px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`📋 4대 영역별 학습 진도표 (전체 진도율 ${report.curriculum.overallProgressPercent}%)`, 85, progY + 36);

  const stages = [
    report.curriculum.keyPractice,
    report.curriculum.wordPractice,
    report.curriculum.sentencePractice,
    report.curriculum.gamePractice,
  ];

  stages.forEach((st, idx) => {
    const sy = progY + 58 + idx * 44;

    // Stage Name
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
    ctx.fillText(st.name, 85, sy + 18);

    // Stage Subtitle
    ctx.fillStyle = '#94A3B8';
    ctx.font = '13px "Malgun Gothic", sans-serif';
    ctx.fillText(st.stageName, 220, sy + 18);

    // Progress Bar Background
    ctx.fillStyle = '#F1F5F9';
    roundRect(ctx, 440, sy + 4, 270, 18, 9);
    ctx.fill();

    // Progress Bar Fill
    const barW = Math.max(10, Math.round((st.progressPercent / 100) * 270));
    ctx.fillStyle = st.progressPercent >= 100 ? '#10B981' : '#EC4899';
    roundRect(ctx, 440, sy + 4, barW, 18, 9);
    ctx.fill();

    // Percentage & Status
    ctx.fillStyle = st.progressPercent >= 100 ? '#059669' : '#BE185D';
    ctx.font = '900 14px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${st.progressPercent}% [${st.status}]`, 855, sy + 18);
    ctx.textAlign = 'left';
  });

  // =========================================================================
  // SECTION 3: TEACHER 4-MONTH ASSESSMENT
  // =========================================================================
  const commentY = 975;
  ctx.fillStyle = '#FFFBEB';
  roundRect(ctx, 60, commentY, 840, 205, 22);
  ctx.fill();
  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 2.5;
  roundRect(ctx, 60, commentY, 840, 205, 22);
  ctx.stroke();

  ctx.fillStyle = '#B45309';
  ctx.font = '900 20px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`💌 담당 선생님의 ${report.halfTerm} 종합 총평`, 85, commentY + 38);

  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px "Malgun Gothic", sans-serif';
  wrapText(ctx, report.teacherComment, 85, commentY + 74, 790, 26);

  // Footer Signature & Slogan
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 15px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('타자팡팡 • 4개월간의 꾸준한 타자 훈련이 평생 가는 올바른 컴퓨터 습관을 만듭니다!', 480, 1245);

  // Convert to Blob & Data URL
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          blob,
        });
      }
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
