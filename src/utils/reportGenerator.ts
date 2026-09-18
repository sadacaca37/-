import { UserSession } from '../types';

export interface CurriculumStepInfo {
  name: string;
  stageName: string;
  progressPercent: number;
  status: '완료' | '학습중' | '도전중';
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
  stageEvaluation: string; // e.g. "기본 자리 완성", "낱말 속도 가속", "짧은 글 도약", "타자왕 달성"
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
  gradeBadge: 'S' | 'A+' | 'A' | 'B+';

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

/**
 * Calculates or synthesizes realistic 4-Month periodic metrics showing month-by-month speed growth
 */
export function getMonthlyStudentReport(user: UserSession | null, targetPeriodOffset = 0): FourMonthStudentReport {
  const now = new Date();
  // 4-month window ending month
  const endTargetDate = new Date(now.getFullYear(), now.getMonth() - targetPeriodOffset * 4, 1);
  const endMonth = endTargetDate.getMonth() + 1;
  const year = endTargetDate.getFullYear();

  // 4 consecutive months calculation: (endMonth - 3) to endMonth
  const months: number[] = [];
  for (let i = 3; i >= 0; i--) {
    let m = endMonth - i;
    while (m <= 0) m += 12;
    months.push(m);
  }
  const startMonth = months[0];

  const studentName = user?.name || '김철수';
  const studentPhone = user?.phone || '010-1234-5678';
  const parentPhone = user?.parentPhone || user?.phone || '010-9876-5432';
  const userPeakCpm = user?.highestCpm && user.highestCpm > 0 ? user.highestCpm : 420;
  const studentGrade = user?.grade || 3;
  const baseCount = user?.totalPracticeCount || 32;

  // Synthesize realistic 4-month progressive growth based on user's actual peak or grade
  const targetFinalAvg = Math.max(160, Math.round(userPeakCpm * 0.86));
  const targetStartAvg = Math.max(80, Math.round(targetFinalAvg * 0.58));
  const totalGrowth = targetFinalAvg - targetStartAvg;

  // Month-by-month step curve
  const stepDeltas = [0, Math.round(totalGrowth * 0.28), Math.round(totalGrowth * 0.34), Math.round(totalGrowth * 0.38)];
  
  const evaluations = [
    '🌱 기본 손가락 자리잡기 및 홈포지션 완성',
    '⚡ 낱말 타이핑 리듬감 형성 및 가속화',
    '📖 짧은 글 문장 완주 및 타건 집중력 도약',
    '👑 실전 타자왕 등극 및 오타율 1% 미만 달성',
  ];

  let runningAvg = targetStartAvg;
  const monthlyBreakdown: MonthlyGrowthItem[] = months.map((m, idx) => {
    if (idx > 0) {
      runningAvg += stepDeltas[idx];
    }
    const mHighest = idx === 3 ? userPeakCpm : Math.round(runningAvg * 1.22);
    const mAccuracy = +(96.2 + idx * 0.9 + Math.min(1.2, (userPeakCpm % 10) * 0.1)).toFixed(1);
    const mCount = Math.max(12, Math.round((baseCount / 4) * (0.8 + idx * 0.15)));
    const mImprovement = idx === 0 ? 0 : stepDeltas[idx];

    return {
      monthIndex: idx + 1,
      monthNumber: m,
      monthLabel: `${m}월 (${idx + 1}월차)`,
      avgCpm: runningAvg,
      highestCpm: mHighest,
      improvement: mImprovement,
      accuracy: Math.min(99.8, mAccuracy),
      practiceCount: mCount,
      completedSentences: Math.round(mCount * 8.5),
      stageEvaluation: evaluations[idx],
    };
  });

  const startCpm = monthlyBreakdown[0].avgCpm;
  const finalAvgCpm = monthlyBreakdown[3].avgCpm;
  const highestCpm = Math.max(...monthlyBreakdown.map((m) => m.highestCpm));
  const totalImprovement = finalAvgCpm - startCpm;
  const totalPracticeCount = monthlyBreakdown.reduce((acc, m) => acc + m.practiceCount, 0);
  const totalKeystrokes = Math.round(totalPracticeCount * finalAvgCpm * 4.6);
  const totalPracticeMinutes = Math.round(totalPracticeCount * 24);
  const avgAccuracy = +(monthlyBreakdown.reduce((acc, m) => acc + m.accuracy, 0) / 4).toFixed(1);

  // Speed Tier & Evaluation
  let speedTier = '⚡ 쾌속 타이핑 마스터';
  let speedEvaluation = `4개월간 시작 ${startCpm}타에서 ${finalAvgCpm}타로 총 +${totalImprovement}타의 가파른 속도 성장을 기록했습니다!`;
  if (totalImprovement >= 120) {
    speedTier = '🚀 초고속 폭풍성장형 마스터';
    speedEvaluation = `초기(${startCpm}타) 대비 4개월간 +${totalImprovement}타 폭발적 상승! 매달 비약적으로 실력이 향상되었습니다.`;
  } else if (totalImprovement >= 70) {
    speedTier = '🌟 안정형 계단식 도약형';
    speedEvaluation = `4개월 동안 월평균 +${Math.round(totalImprovement / 3)}타씩 꾸준히 상승하며 매우 탄탄한 타법을 확립했습니다.`;
  } else {
    speedTier = '🌱 기초 완성형 도약 준비';
    speedEvaluation = '정확한 손가락 자리를 완벽히 체득하여 다음 분기 폭발적인 속도 도약의 발판을 마련했습니다.';
  }

  let gradeBadge: 'S' | 'A+' | 'A' | 'B+' = 'A+';
  if (finalAvgCpm >= 360) gradeBadge = 'S';
  else if (finalAvgCpm >= 260) gradeBadge = 'A+';
  else if (finalAvgCpm >= 170) gradeBadge = 'A';
  else gradeBadge = 'B+';

  // Curriculum progress
  const keyPct = 100;
  const wordPct = Math.min(100, Math.round(75 + (totalPracticeCount % 25)));
  const sentPct = Math.min(100, Math.round(60 + (totalPracticeCount % 35)));
  const gamePct = Math.min(100, Math.round(70 + (totalPracticeCount % 25)));
  const overallPct = Math.round((keyPct + wordPct + sentPct + gamePct) / 4);

  // Half term determination (1~6월: 상반기, 7~12월: 하반기)
  const halfTerm: '상반기' | '하반기' = endMonth <= 6 || (startMonth <= 5 && endMonth <= 7) ? '상반기' : '하반기';
  const periodTitle = `${year}년 ${halfTerm} (${startMonth}월~${endMonth}월) 타자 성장 종합 성적표`;

  let teacherComment = `${studentName} 학생(${studentGrade}학년)은 지난 ${year}년 ${halfTerm}(${startMonth}월~${endMonth}월) 동안 총 ${totalPracticeCount}회의 타자 학습을 완수하여, 타수가 초기에 비해 +${totalImprovement}타 대폭 향상(최종 평균 ${finalAvgCpm}타/최고 ${highestCpm}타)되었습니다! 특히 매달 오타율을 줄이며 바른 손가락 자세가 완벽히 자리 잡았습니다.`;
  if (gradeBadge === 'S') {
    teacherComment = `👑 특급 칭찬! ${studentName} 학생은 ${year}년 ${halfTerm} 동안 시작 ${startCpm}타에서 ${finalAvgCpm}타(최고 ${highestCpm}타)로 총 +${totalImprovement}타의 눈부신 성장을 이루며 학년 최상위 [${speedTier}]로 선정되었습니다!`;
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
    levelTitle: user?.levelTitle || `${studentGrade}학년 타자 마스터`,
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
    speedTier,
    speedEvaluation,
    gradeBadge,
    curriculum: {
      keyPractice: { name: '자리 연습', stageName: '기본/윗/아랫자리', progressPercent: keyPct, status: '완료' },
      wordPractice: { name: '낱말 연습', stageName: '필수 어휘 & 초성', progressPercent: wordPct, status: wordPct >= 100 ? '완료' : '학습중' },
      sentencePractice: { name: '짧은 글 연습', stageName: '속담 & 명언 완주', progressPercent: sentPct, status: sentPct >= 100 ? '완료' : '학습중' },
      gamePractice: { name: '타자 게임 & 퀴즈', stageName: '두더지 & 산성비 & 단축키', progressPercent: gamePct, status: gamePct >= 100 ? '완료' : '도전중' },
      overallProgressPercent: overallPct,
      currentStageTitle: sentPct > 65 ? '짧은 글 완성 및 속도 가속화 과정' : '낱말 완성 및 문장 도전 과정',
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
  ctx.fillText('✨ 타닥타닥 타자랜드 타자 성적표 ✨', 480, 100);

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
  ctx.fillText(`📈 4개월간 월별 타구 속도 성장 추이 (${report.startMonth}월 ~ ${report.endMonth}월)`, 85, growthY + 36);

  // Growth Summary Badge Top-Right
  ctx.fillStyle = '#EC4899';
  ctx.font = '900 16px "Malgun Gothic", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`총 속도 성장: +${report.totalImprovement}타 상승 ↑ (${report.startCpm}타 ➔ ${report.finalAvgCpm}타)`, 875, growthY + 36);

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
    if (idx === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px "Malgun Gothic", sans-serif';
      ctx.fillText('초기 진단 타수', cx + cardW / 2, cy + 96);
    } else {
      ctx.fillStyle = '#EC4899';
      ctx.font = '900 13px "Malgun Gothic", sans-serif';
      ctx.fillText(`+${m.improvement}타 상승 ↑`, cx + cardW / 2, cy + 96);
    }

    // Monthly Peak & Accuracy
    ctx.fillStyle = '#475569';
    ctx.font = '11px "Malgun Gothic", sans-serif';
    ctx.fillText(`최고 ${m.highestCpm}타 • 정확 ${m.accuracy}%`, cx + cardW / 2, cy + 118);

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
  ctx.fillText(`⚡ 4개월 종합 속도 분석: ${report.speedEvaluation}`, 98, growthY + 266);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px "Malgun Gothic", sans-serif';
  ctx.fillText(
    `4개월 총 누적 연습량: ${report.totalKeystrokes.toLocaleString()}타 (${report.totalPracticeCount}회 완료 • ${report.totalPracticeMinutes}분 학습)  |  최고 속도: ${report.highestCpm} CPM`,
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
  ctx.fillText('타닥타닥 타자랜드 • 4개월간의 꾸준한 타자 훈련이 평생 가는 올바른 컴퓨터 습관을 만듭니다!', 480, 1245);

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
