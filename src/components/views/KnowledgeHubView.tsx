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
import { PixelIcon, TvBot } from './TapangHome';

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

  const worldIcon: Record<string, string> = { python: 'code', capitals: 'globe', joseon: 'crown', lyrics: 'music' };
  const worldTone: Record<string, string> = { python: '#38b6ff', capitals: '#43c05a', joseon: '#8a6cff', lyrics: '#ff6bb5' };

  return (
    <div className="kw space-y-7">
      <header className="kw-head">
        <div className="kw-sign">
          <span className="kw-sign-cap kw-sign-cap--l" />
          <span className="kw-sign-cap kw-sign-cap--r" />
          팡팡 지식 월드
        </div>
        <div className="kw-sub">★ 월드를 골라 모험을 시작하세요 ★</div>
        <div className="kw-bot">
          <TvBot size={72} bubble={currentUser ? `${currentUser.name}, 어디로 갈까?` : '어디로 갈까?'} bubbleSide="top" />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {courses.map((course, idx) => {
          const segs = 10;
          const filled = Math.round((course.progressPercent / 100) * segs);
          return (
            <button
              key={course.id}
              type="button"
              onClick={() => handleStart(course.mode)}
              className="kw-card group"
              style={{ ['--tone' as any]: worldTone[course.id] }}
            >
              <span className="kw-world">WORLD {idx + 1}</span>
              <span className="kw-screen">
                <span className="kw-screen-icon">
                  <PixelIcon name={worldIcon[course.id]} size={64} />
                </span>
                <span className="kw-badge">{course.badge}</span>
              </span>
              <span className="kw-title">{course.title}</span>
              <span className="kw-subtitle">{course.subtitle}</span>
              <span className="kw-feats">
                {course.features.map((f) => (
                  <span key={f} className="kw-feat">
                    <i>▶</i>
                    {f}
                  </span>
                ))}
              </span>
              <span className="kw-progress">
                <span className="kw-progress-top">
                  <span>CLEAR</span>
                  <b>{course.progressText}</b>
                </span>
                <span className="kw-segs">
                  {Array.from({ length: segs }).map((_, i) => (
                    <i key={i} className={i < filled ? 'on' : ''} />
                  ))}
                </span>
              </span>
              <span className="kw-reward">
                <PixelIcon name="coin" size={16} />
                {course.pointReward}
              </span>
              <span className="kw-start">▶ START</span>
            </button>
          );
        })}
      </div>

      <div className="kw-foot">
        <PixelIcon name="trophy" size={34} />
        <p>
          월드를 완주하면 <b>[세계 여행가]</b> · <b>[사관(史官)]</b> · <b>[문장가]</b> 칭호를 받아요!
        </p>
        <button type="button" className="kw-home" onClick={() => onSelectMode('home')}>
          홈으로
        </button>
      </div>
    </div>
  );
};
