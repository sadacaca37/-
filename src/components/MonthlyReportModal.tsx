import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Download, 
  Share2, 
  MessageSquare, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Award, 
  PhoneCall, 
  ChevronLeft, 
  ChevronRight,
  Info,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { UserSession } from '../types';
import { getMonthlyStudentReport, generateReportCardImage, FourMonthStudentReport, improvementText } from '../utils/reportGenerator';
import { fetchStudentActivity, StudentActivity } from '../utils/studentActivity';
import { soundManager } from '../utils/sound';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  targetUser?: UserSession | null; // For Master/Teacher viewing specific student
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  targetUser,
}) => {
  const effectiveUser = targetUser || currentUser;
  const [periodOffset, setPeriodOffset] = useState(0); // 0 = latest 4-month window, 1 = previous 4 months
  const [reportData, setReportData] = useState<FourMonthStudentReport | null>(null);
  const [reportImageUrl, setReportImageUrl] = useState<string | null>(null);
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [smsPhone, setSmsPhone] = useState(effectiveUser?.parentPhone || effectiveUser?.phone || '010-0000-0000');
  const [customComment, setCustomComment] = useState('');
  const [shareSuccessMsg, setShareSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && effectiveUser) {
      setSmsPhone(effectiveUser.parentPhone || effectiveUser.phone || '010-0000-0000');
      loadReport(periodOffset);
    }
  }, [isOpen, effectiveUser, periodOffset]);

  // 학생의 실제 학습 기록: 선생님이 다른 학생 것을 볼 때는 서버에서, 학생 본인은 이 브라우저에서
  const activityRef = React.useRef<{ id: string; data: StudentActivity } | null>(null);
  const loadReport = async (offset: number) => {
    setIsGenerating(true);
    setShareSuccessMsg('');
    try {
      const uid = effectiveUser?.id || '';
      if (uid && activityRef.current?.id !== uid) {
        const asMaster = currentUser?.role === 'master' && !!targetUser && targetUser.id !== currentUser.id;
        activityRef.current = { id: uid, data: await fetchStudentActivity(uid, asMaster) };
      }
      const stats = getMonthlyStudentReport(effectiveUser, offset, activityRef.current?.data);
      if (customComment) {
        stats.teacherComment = customComment;
      }
      setReportData(stats);
      const { dataUrl, blob } = await generateReportCardImage(stats);
      setReportImageUrl(dataUrl);
      setReportBlob(blob);
    } catch (err) {
      console.error('Failed to generate 4-month report card', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen || !effectiveUser) return null;

  // Prepare SMS Text Summary for the Growth Report
  const getSmsText = () => {
    if (!reportData) return '';
    const breakdownLines = reportData.monthlyBreakdown
      .map(
        (m) =>
          m.practiceCount > 0
            ? `• ${m.monthNumber}월: 평균 ${m.avgCpm}타${m.improvement ? ` (${improvementText(m.improvement)})` : ''} / 최고 ${m.highestCpm}타 / ${m.activeDays || 0}일 · ${m.practiceCount}세트 연습`
            : `• ${m.monthNumber}월: 연습 기록 없음`
      )
      .join('\n');

    return `[타자팡팡] 💌 ${reportData.studentName} 학생 ${reportData.year}년 ${reportData.halfTerm}(${reportData.startMonth}월~${reportData.endMonth}월) 타자 성적표

📈 월별 타자 기록:
${breakdownLines}

${
  reportData.hasData
    ? `🏆 평균 타수: ${reportData.startCpm}타 ➔ ${reportData.finalAvgCpm}타 (${improvementText(reportData.totalImprovement)})
🎯 최고 기록: ${reportData.highestCpm}타 (평균 정확도 ${reportData.avgAccuracy}%)
⌨️ 연습량: ${reportData.totalActiveDays}일 · ${reportData.totalPracticeCount}세트 · ${reportData.totalKeystrokes.toLocaleString()}타
`
    : ''
}📋 진도율: ${reportData.curriculum.overallProgressPercent}% (${reportData.curriculum.currentStageTitle})

선생님 총평: ${reportData.teacherComment}`;
  };

  // 1. Download image to phone / PC
  const handleDownloadImage = () => {
    if (!reportImageUrl || !reportData) return;
    soundManager.playSuccess();
    const link = document.createElement('a');
    link.href = reportImageUrl;
    link.download = `${reportData.studentName}_${reportData.year}년_${reportData.halfTerm}_(${reportData.startMonth}월-${reportData.endMonth}월)_타자성장성적표.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareSuccessMsg(`${reportData.year}년 ${reportData.halfTerm} 성적표 이미지가 기기에 다운로드되었습니다.`);
  };

  // 2. Web Share API (Direct to SMS / Kakao / Messenger on Mobile)
  const handleNativeShare = async () => {
    if (!reportBlob || !reportData) {
      handleDownloadImage();
      return;
    }

    const file = new File(
      [reportBlob],
      `${reportData.studentName}_${reportData.year}년_${reportData.halfTerm}_(${reportData.startMonth}월-${reportData.endMonth}월)_타자성장성적표.png`,
      {
        type: 'image/png',
      }
    );

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `${reportData.studentName} 학생의 ${reportData.year}년 ${reportData.halfTerm} 타자 성장 종합 성적표`,
          text: getSmsText(),
          files: [file],
        });
        soundManager.playSuccess();
        setShareSuccessMsg(`${reportData.year}년 ${reportData.halfTerm} 성적표가 성공적으로 공유되었습니다!`);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleDownloadImage();
        }
      }
    } else {
      // Fallback: Download & prompt SMS
      handleDownloadImage();
      handleSendSmsApp();
    }
  };

  // 3. Launch Default SMS App with Pre-filled Text
  const handleSendSmsApp = () => {
    const cleanPhone = smsPhone.replace(/[^0-9]/g, '');
    const smsBody = encodeURIComponent(getSmsText());
    soundManager.playKeyClick(true);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUri = isIOS ? `sms:${cleanPhone}&body=${smsBody}` : `sms:${cleanPhone}?body=${smsBody}`;
    
    window.location.href = smsUri;
    setShareSuccessMsg('기기의 기본 문자 앱이 열렸습니다. 발송 버튼을 눌러 학부모님께 전송해 주세요!');
  };

  // 4. Copy SMS text to clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(getSmsText());
    setCopiedText(true);
    soundManager.playKeyClick(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border-4 border-pink-300 overflow-hidden flex flex-col max-h-[96vh] h-[860px]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-sky-500 p-4 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center border border-white/40 shadow-xs shrink-0">
              <TrendingUp className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h2 className="font-arcade text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>{reportData ? `${reportData.year}년 ${reportData.halfTerm} 타자 성장 성적표 발송실` : '상반기/하반기 타자 성장 성적표 발송실'}</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full border border-white/30 font-bold">
                  {reportData?.halfTerm || '상/하반기'} 정기 발송
                </span>
              </h2>
              <p className="text-xs text-pink-100 font-medium">
                {effectiveUser.name} 학생({effectiveUser.grade || 3}학년)의 {reportData ? `${reportData.year}년 ${reportData.halfTerm}` : ''} 월별 타수 향상 추이와 4대 영역 진도표를 확인하고 학부모님께 전송합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector Bar */}
        <div className="bg-pink-50/90 px-4 py-2.5 border-b border-pink-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-600 shrink-0" />
            <span className="text-xs font-black text-slate-800">성적표 평가 학기:</span>
            <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-pink-200 shadow-2xs">
              <button
                onClick={() => setPeriodOffset((p) => p + 1)}
                className="p-1 rounded-lg hover:bg-pink-100 text-slate-600 cursor-pointer flex items-center gap-0.5 text-xs font-bold"
                title="이전 학기"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">이전 학기</span>
              </button>
              <span className="px-3 text-xs font-black text-pink-700">
                {reportData ? `${reportData.year}년 ${reportData.halfTerm} (${reportData.startMonth}월 ~ ${reportData.endMonth}월)` : '불러오는 중...'}
              </span>
              <button
                onClick={() => setPeriodOffset((p) => Math.max(0, p - 1))}
                disabled={periodOffset === 0}
                className={`p-1 rounded-lg text-slate-600 flex items-center gap-0.5 text-xs font-bold ${
                  periodOffset === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-pink-100 cursor-pointer'
                }`}
                title="다음 학기"
              >
                <span className="hidden sm:inline">최근 학기</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-pink-100 text-pink-700 border border-pink-300 px-2.5 py-0.5 rounded-full font-black text-xs flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-pink-600" />
              {reportData?.hasData ? `평균 타수 ${improvementText(reportData.totalImprovement)}` : '연습 기록 없음'}
            </span>
            <span className="bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded-full font-black text-xs">
              진도율 {reportData?.curriculum.overallProgressPercent || 0}%
            </span>
          </div>
        </div>

        {/* Modal Main Content (2-Column Grid) */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-50">
          
          {/* Left Column: High-Res Canvas 4-Month Report Card Image Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xs">
            <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                {reportData ? `${reportData.year}년 ${reportData.halfTerm} 성적표 카드 미리보기` : '성적표 카드 미리보기'}
              </span>
              <span className="text-[10px] text-slate-400 font-bold">960 x 1320 HD</span>
            </div>

            <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-pink-50/30 p-1">
              {isGenerating ? (
                <div className="text-center py-16">
                  <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-black text-pink-600">성장 데이터를 분석하여 성적표를 생성 중입니다...</p>
                </div>
              ) : reportImageUrl ? (
                <img
                  src={reportImageUrl}
                  alt={`${reportData?.year || ''}년 ${reportData?.halfTerm || ''} 타자 종합 성적표`}
                  className="max-h-[520px] w-auto object-contain rounded-lg shadow-md hover:scale-102 transition-transform cursor-pointer"
                  onClick={handleDownloadImage}
                  title="클릭하여 고화질 성적표 이미지 저장"
                />
              ) : null}
            </div>
          </div>

          {/* Right Column: Month-by-Month Visual Progression & SMS Transmission */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
            
            {/* 1. Recipient Phone Number */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-sky-500" />
                수신 학부모 휴대폰 번호
              </label>
              <input
                type="tel"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full px-3 py-2 text-sm font-black rounded-xl border-2 border-slate-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
              />
            </div>

            {/* 2. Month-by-Month Speed Growth Visual Breakdown (1월차 ~ 4월차) */}
            {reportData && (
              <div className="bg-gradient-to-br from-pink-50/80 to-purple-50/80 p-3 rounded-2xl border border-pink-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-pink-900 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-pink-600" />
                    4개월간 월별 타수 (실제 기록)
                  </span>
                  <span className="text-[11px] font-black text-pink-700">
                    {reportData.hasData ? `${reportData.startCpm}타 ➔ ${reportData.finalAvgCpm}타` : '연습 기록 없음'}
                  </span>
                </div>

                {/* 4 Step Cards */}
                <div className="grid grid-cols-4 gap-1.5">
                  {reportData.monthlyBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border text-center relative ${
                        idx === 3
                          ? 'bg-purple-100/80 border-purple-300 ring-2 ring-purple-200'
                          : idx === 2
                          ? 'bg-blue-50 border-blue-200'
                          : idx === 1
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-[10px] font-black text-slate-600 block">{item.monthNumber}월</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800 block my-0.5">
                        {item.avgCpm} <span className="text-[9px] font-bold text-slate-400">CPM</span>
                      </span>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.2 rounded-full inline-block ${
                          item.practiceCount <= 0 || item.improvement <= 0
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-pink-200 text-pink-800'
                        }`}
                      >
                        {item.practiceCount <= 0 ? '기록 없음' : item.improvement === 0 ? `${item.activeDays || 0}일 연습` : `${item.improvement > 0 ? '+' : ''}${item.improvement}타`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Growth Highlights */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-pink-200/60">
                  <span>최고 속도: <strong className="text-purple-700 font-black">{reportData.highestCpm}타</strong></span>
                  <span>4개월 연습: <strong className="text-pink-700 font-black">{reportData.totalActiveDays}일 · {reportData.totalKeystrokes.toLocaleString()}타</strong> ({reportData.totalPracticeCount}세트)</span>
                </div>
              </div>
            )}

            {/* 3. Text Message Preview / Edit */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-pink-500" />
                  학부모 발송 문자 내용 (4개월 성장 자동 요약)
                </label>
                <button
                  onClick={handleCopyText}
                  className="text-[11px] font-black text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  {copiedText ? '복사 완료!' : '문자 복사'}
                </button>
              </div>

              <textarea
                readOnly
                value={getSmsText()}
                rows={5}
                className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Feedback Info Box */}
            {shareSuccessMsg ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{shareSuccessMsg}</span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-medium flex items-start gap-1.5">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  <strong>안내:</strong> 이 성적표는 학생이 <strong>실제로 연습한 기록</strong>(월별 평균·최고 타수, 연습한 날 수, 끝낸 코스)으로 만들어져요. 연습하지 않은 달은 '기록 없음'으로 나와요.
                </span>
              </div>
            )}

            {/* 4. Action Buttons (Direct Share / SMS / Download) */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleNativeShare}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>문자/카톡으로 성적표 공유</span>
              </button>

              <button
                onClick={handleDownloadImage}
                className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>성적표 이미지 저장 (PNG)</span>
              </button>
            </div>

            {/* Open SMS App Button */}
            <button
              onClick={handleSendSmsApp}
              className="w-full py-2.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-extrabold text-xs flex items-center justify-center gap-1.5 border border-sky-300 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>기본 문자 앱으로 즉시 발송 ({smsPhone})</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
