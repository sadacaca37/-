import React from 'react';
import { ArrowLeft } from 'lucide-react';
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
      subtitle: '풀밭 언덕 두더지 퇴치',
      thumb: './assets/minigames/thumb-mole.webp',
      fallbackBg: '#4c9e36',
    },
    {
      id: 'word-crush' as AppMode,
      title: '워드 크러쉬',
      subtitle: '반짝이는 보석 동굴 퍼즐',
      thumb: './assets/minigames/thumb-crush.webp',
      fallbackBg: '#272452',
    },
    {
      id: 'rain-game' as AppMode,
      title: '산성비 (단어 소나기)',
      subtitle: '비구름 아래 마을 수비',
      thumb: './assets/minigames/thumb-rain.webp',
      fallbackBg: '#1c3e68',
    },
    {
      id: 'shortcut-quiz' as AppMode,
      title: '단축키 디펜스',
      subtitle: '성벽과 숲 단축키 방어',
      thumb: './assets/minigames/thumb-defense.webp',
      fallbackBg: '#2e3e6e',
    },
    {
      id: 'tamagotchi' as AppMode,
      title: '다마고치 키우기',
      subtitle: '아늑한 나무집 펫 육성',
      thumb: './assets/minigames/thumb-pet.webp',
      fallbackBg: '#7b4c24',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 animate-in fade-in duration-200">
      <section className="mg-hub qm-frame" aria-label="미니타자게임 센터">
        <span className="qm-cap qm-cap--tl" aria-hidden="true" />
        <span className="qm-cap qm-cap--tr" aria-hidden="true" />
        <span className="qm-cap qm-cap--bl" aria-hidden="true" />
        <span className="qm-cap qm-cap--br" aria-hidden="true" />

        <div className="mg-hub-inner">
          <img
            src="./assets/wood-frame.webp"
            alt=""
            aria-hidden="true"
            className="mg-hub-bg"
            referrerPolicy="no-referrer"
            draggable={false}
          />

          <div className="relative z-10 space-y-5 sm:space-y-6">
            {/* Top Guild Navigation Bar */}
            <div className="mg-hub-topbar">
              <button
                type="button"
                onClick={() => {
                  soundManager.play('click');
                  onSelectMode('home');
                }}
                className="tp-rpg-btn tp-rpg-btn--wood inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>홈으로 돌아가기</span>
              </button>

              <h1 className="mg-hub-title">미니타자게임 센터</h1>

              <div className="hidden sm:block w-28" aria-hidden="true" />
            </div>

            {/* 5 Mini-Game Cards with 16-bit Pixel RPG Illustrations */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              {games.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => {
                    soundManager.play('pop');
                    onSelectMode(game.id);
                  }}
                  className="mg-hub-card group text-center cursor-pointer"
                  title={`${game.title} 시작하기`}
                >
                  <div
                    className="mg-hub-thumb-wrap"
                    style={{ backgroundColor: game.fallbackBg }}
                  >
                    <img
                      src={game.thumb}
                      alt={game.title}
                      className="mg-hub-thumb"
                      referrerPolicy="no-referrer"
                      draggable={false}
                    />
                  </div>
                  <div className="mg-hub-meta">
                    <h3 className="mg-hub-card-title">{game.title}</h3>
                    <p className="mg-hub-card-sub">{game.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
