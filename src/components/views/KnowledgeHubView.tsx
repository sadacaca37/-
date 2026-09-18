import React from 'react';
import {
  Globe,
  Crown,
  BookOpen,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  CheckCircle2,
  Compass,
  Scroll,
  Music,
  Bookmark,
  Code2
} from 'lucide-react';
import { AppMode, UserSession } from '../../types';
import { soundManager } from '../../utils/sound';

interface KnowledgeHubViewProps {
  currentUser: UserSession | null;
  onSelectMode: (mode: AppMode) => void;
}

export const KnowledgeHubView: React.FC<KnowledgeHubViewProps> = ({
  currentUser,
  onSelectMode,
}) => {
  // Saved progress from localStorage
  const capitalsConquered = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('pangpang_conquered_capitals');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }, []);

  const kingsConquered = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('pangpang_conquered_kings');
      return saved ? JSON.parse(saved).length : 0;
    } catch {
      return 0;
    }
  }, []);

  const pythonLevel = React.useMemo(() => {
    try {
      const saved = localStorage.getItem(`pangpang_python_${currentUser?.id || 'guest'}_level`);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  }, [currentUser?.id]);

  const courses = [
    {
      id: 'python',
      mode: 'python-coding' as AppMode,
      title: '파이썬 코딩 타자',
      subtitle: '단어에서 문장까지 레벨업 코딩',
      tag: '프로그래밍 타자',
      badge: `Lv.${pythonLevel} 레벨업`,
      badgeColor: 'bg-sky-600 text-white',
      accentColor: 'from-sky-600 via-blue-600 to-indigo-700',
      borderColor: 'border-sky-200 hover:border-sky-400',
      bgCard: 'bg-gradient-to-br from-sky-50/80 via-white to-blue-50/40',
      icon: Code2,
      iconColor: 'text-sky-600',
      bgIcon: 'bg-sky-100',
      description: '파이썬 핵심 키워드 단어(print, def, for)부터 시작해 내장 함수, 실전 코드 문장, 알고리즘까지 레벨을 올리며 타이핑하는 코딩 타자 마스터 코스!',
      features: ['단어 ➔ 기초 문장 ➔ 실전 코드 단계별 학습', 'XP 적립 & 실시간 레벨업 시스템', '실제 파이썬 코드 에디터 UI & 구문 가이드'],
      progressText: `Lv.${pythonLevel} / 5 달성`,
      progressPercent: Math.round((pythonLevel / 5) * 100),
      pointReward: '+10P / 단어, +25P / 문장',
    },
    {
      id: 'capitals',
      mode: 'capital-journey' as AppMode,
      title: '세계 수도 정복',
      subtitle: '71개국 5대륙 완주 풀코스',
      tag: '세계 지리 퀴즈',
      badge: '71개국 실물 국기',
      badgeColor: 'bg-emerald-500 text-white',
      accentColor: 'from-emerald-500 to-teal-600',
      borderColor: 'border-emerald-200 hover:border-emerald-400',
      bgCard: 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40',
      icon: Globe,
      iconColor: 'text-emerald-600',
      bgIcon: 'bg-emerald-100',
      description: '아시아, 유럽, 아메리카, 아프리카, 오세아니아 71개국의 선명한 실물 국기와 수도를 맞히며 타자 실력과 세계 지식을 동시에 쌓는 글로벌 챌린지!',
      features: ['실물 국기 그래픽 & 초성 힌트', '확대된 5대륙 71개국 정복 맵', '문제당 팡팡 포인트 적립'],
      progressText: `${capitalsConquered} / 71개국 정복`,
      progressPercent: Math.round((capitalsConquered / 71) * 100),
      pointReward: '+5P / 문제당 (+100P 완주)',
    },
    {
      id: 'joseon',
      mode: 'joseon-journey' as AppMode,
      title: '조선 왕조 27대',
      subtitle: '태조부터 순종까지 500년 족보',
      tag: '한국사 족보 & 업적',
      badge: '27대 국왕 & 업적',
      badgeColor: 'bg-indigo-600 text-white',
      accentColor: 'from-indigo-600 to-purple-600',
      borderColor: 'border-indigo-200 hover:border-indigo-400',
      bgCard: 'bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/40',
      icon: Crown,
      iconColor: 'text-indigo-700',
      bgIcon: 'bg-indigo-100',
      description: '태정태세문단세 예성연중인명선 광인효현숙경영 정순헌철고순! 27대 왕의 기차 레일 맵을 질주하며 왕 이름과 핵심 업적 문장을 타자로 정복하세요.',
      features: ['끊김없는 4단 S자 연속 레일웨이', '1단계 왕 이름 퀴즈 (+5P)', '2단계 핵심 업적 타자 가이드 (+10P)'],
      progressText: `${kingsConquered} / 27대왕 정복`,
      progressPercent: Math.round((kingsConquered / 27) * 100),
      pointReward: '+15P / 왕당 (+100P 완주)',
    },
    {
      id: 'lyrics',
      mode: 'lyrics-challenge' as AppMode,
      title: 'K-POP 명곡 가사 챌린지',
      subtitle: '노래를 들으며 감성 가사 타이핑',
      tag: '감성 BGM 내장',
      badge: '10대 명곡 플레이',
      badgeColor: 'bg-pink-500 text-white',
      accentColor: 'from-pink-500 to-rose-600',
      borderColor: 'border-pink-200 hover:border-pink-400',
      bgCard: 'bg-gradient-to-br from-pink-50/80 via-white to-rose-50/40',
      icon: Music,
      iconColor: 'text-pink-600',
      bgIcon: 'bg-pink-100',
      description: '아이유 <밤편지>, BTS <봄날>, 잔나비, 악뮤, 뉴진스 등 한국인이 사랑하는 10대 명곡 가사를 아름다운 멜로디 BGM을 들으며 타이핑하는 힐링 챌린지!',
      features: ['실시간 신스/피아노 BGM 재생', '피아노 / 오르골 / 신스 음색 선택', '소절당 +5P, 완곡 시 +150P'],
      progressText: `10곡 준비 완료`,
      progressPercent: 100,
      pointReward: '+5P / 소절당 (+150P 완곡)',
    },
  ];

  const handleStart = (mode: AppMode) => {
    soundManager.play('achievement');
    onSelectMode(mode);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Knowledge Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {courses.map((course) => {
          const IconComponent = course.icon;
          return (
            <div
              key={course.id}
              onClick={() => handleStart(course.mode)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleStart(course.mode);
                }
              }}
              className={`flex flex-col justify-between rounded-3xl border-2 ${course.borderColor} ${course.bgCard} p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 active:scale-98 relative overflow-hidden group cursor-pointer`}
            >
              {/* Top Row: Icon & Badges */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${course.bgIcon} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                    <IconComponent className={`w-7 h-7 ${course.iconColor}`} />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs ${course.badgeColor}`}>
                      {course.badge}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500">
                      {course.tag}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-black text-gray-800 group-hover:text-blue-600 transition-colors mb-1">
                  {course.title}
                </h3>
                <p className="text-xs font-bold text-gray-500 mb-3">
                  {course.subtitle}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed mb-4 min-h-[48px]">
                  {course.description}
                </p>

                {/* Key Features Bullet List */}
                <div className="space-y-1.5 mb-5 bg-white/70 rounded-2xl p-3 border border-gray-100">
                  {course.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-gray-600">나의 정복 진행률</span>
                    <span className="text-blue-600">{course.progressText}</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${course.accentColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.max(4, course.progressPercent)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-amber-600 mb-3 px-1">
                  <span>완주 보상</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                    🪙 {course.pointReward}
                  </span>
                </div>

                <button
                  id={`btn-knowledge-${course.id}`}
                  onClick={() => handleStart(course.mode)}
                  className={`w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r ${course.accentColor} text-white font-black text-sm shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <span>코스 도전하기</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info & Tips Footer Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-gray-800 text-sm sm:text-base">
              지식 타자 완주 시 스페셜 마스터 뱃지 증정!
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              세계수도 71개국 완주 시 <strong>[세계 여행가]</strong>, 조선 27대 완주 시 <strong>[사관(史官)]</strong>, 필사 챌린지 완주 시 <strong>[문장가]</strong> 칭호가 부여됩니다.
            </p>
          </div>
        </div>

        <button
          onClick={() => onSelectMode('home')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors shrink-0 cursor-pointer"
        >
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
};
