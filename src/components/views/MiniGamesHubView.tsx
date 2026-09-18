import React from 'react';
import { 
  CloudRain, 
  Sparkles, 
  Zap, 
  ArrowLeft,
  Hammer,
  Heart
} from 'lucide-react';
import { AppMode, UserSession } from '../../types';
import { soundManager } from '../../utils/sound';

interface MiniGamesHubViewProps {
  onSelectMode: (mode: AppMode) => void;
  currentUser?: UserSession | null;
}

export const MiniGamesHubView: React.FC<MiniGamesHubViewProps> = ({ onSelectMode }) => {
  const games = [
    {
      id: 'mole-game' as AppMode,
      title: '두더지 타자 잡기',
      emoji: '🔨',
      icon: Hammer,
      bgColor: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-orange-200',
      borderTone: 'border-orange-300',
    },
    {
      id: 'word-crush' as AppMode,
      title: '워드 크러쉬',
      emoji: '🍬',
      icon: Sparkles,
      bgColor: 'from-pink-500 to-rose-600',
      shadowColor: 'shadow-pink-200',
      borderTone: 'border-pink-300',
    },
    {
      id: 'rain-game' as AppMode,
      title: '산성비 (단어 소나기)',
      emoji: '🌧️',
      icon: CloudRain,
      bgColor: 'from-sky-500 to-blue-600',
      shadowColor: 'shadow-blue-200',
      borderTone: 'border-sky-300',
    },
    {
      id: 'shortcut-quiz' as AppMode,
      title: '단축키 스피드 퀴즈',
      emoji: '⚡',
      icon: Zap,
      bgColor: 'from-purple-500 to-indigo-600',
      shadowColor: 'shadow-purple-200',
      borderTone: 'border-purple-300',
    },
    {
      id: 'tamagotchi' as AppMode,
      title: '다마고치 키우기',
      emoji: '🐣',
      icon: Heart,
      bgColor: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-teal-200',
      borderTone: 'border-teal-300',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-6 animate-in fade-in duration-200">
      {/* Clean Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <button
          onClick={() => {
            soundManager.play('click');
            onSelectMode('home');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>홈으로 돌아가기</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">🎮</span>
          <h1 className="text-base sm:text-lg font-black font-arcade text-slate-900">
            미니타자게임 센터
          </h1>
        </div>

        <div className="w-20" />
      </div>

      {/* Grid of Mini-Games: 5개 아이콘 클릭형 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-5">
        {games.map((game) => {
          return (
            <button
              key={game.id}
              onClick={() => {
                soundManager.play('pop');
                onSelectMode(game.id);
              }}
              className="group flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-white border-2 border-slate-200 hover:border-pink-500 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 active:scale-95 cursor-pointer text-center"
              title={`${game.title} 시작하기`}
            >
              {/* 3D Tactile Arcade Icon Button */}
              <div
                className={`w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br ${game.bgColor} text-white shadow-lg ${game.shadowColor} flex flex-col items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative border-b-4 border-black/20`}
              >
                <span className="text-3xl sm:text-4xl drop-shadow-md">{game.emoji}</span>
              </div>

              {/* Game Title */}
              <h3 className="mt-3 font-black text-xs sm:text-sm text-slate-800 font-arcade group-hover:text-pink-600 transition-colors leading-tight">
                {game.title}
              </h3>
            </button>
          );
        })}
      </div>
    </div>
  );
};
