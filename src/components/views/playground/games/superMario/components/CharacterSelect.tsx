import React from 'react';
import { CharacterType } from '../types';
import { Sparkles, Zap, Feather, Wind } from 'lucide-react';
import { sound } from '../game/audio';

interface CharacterSelectProps {
  selectedCharacter: CharacterType;
  onSelect: (char: CharacterType) => void;
  label?: string;
}

interface CharInfo {
  id: CharacterType;
  name: string;
  krName: string;
  badge: string;
  color: string;
  accentBg: string;
  borderColor: string;
  trait: string;
  desc: string;
}

const CHARACTERS: CharInfo[] = [
  {
    id: 'mario',
    name: 'Mario',
    krName: '마리오',
    badge: 'M',
    color: '#E52521',
    accentBg: 'bg-red-500/10 text-red-600 border-red-200',
    borderColor: 'border-red-500 bg-red-50/50 ring-2 ring-red-400',
    trait: '밸런스 올라운더',
    desc: '균형 잡힌 기동성과 안정적인 점프력',
  },
  {
    id: 'luigi',
    name: 'Luigi',
    krName: '루이지',
    badge: 'L',
    color: '#00A651',
    accentBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    borderColor: 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-400',
    trait: '고공 하이 점프',
    desc: '가벼운 중력으로 더 높은 곳까지 도약',
  },
  {
    id: 'toad',
    name: 'Toad',
    krName: '키노피오',
    badge: '🍄',
    color: '#0055D4',
    accentBg: 'bg-blue-500/10 text-blue-600 border-blue-200',
    borderColor: 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400',
    trait: '스프린트 스피드',
    desc: '빠른 달리기 속도로 스테이지 질주',
  },
  {
    id: 'peach',
    name: 'Peach',
    krName: '피치공주',
    badge: '👑',
    color: '#F472B6',
    accentBg: 'bg-pink-500/10 text-pink-600 border-pink-200',
    borderColor: 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-400',
    trait: '드레스 공중 부양',
    desc: '점프 키를 유지하여 우아하게 공중 체공',
  },
  {
    id: 'yoshi',
    name: 'Yoshi',
    krName: '요시',
    badge: '🦖',
    color: '#16A34A',
    accentBg: 'bg-lime-500/10 text-lime-700 border-lime-200',
    borderColor: 'border-lime-500 bg-lime-50/50 ring-2 ring-lime-400',
    trait: '플러터 공중 점프',
    desc: '공중에서 점프를 추가 연타하여 날갯짓',
  },
];

export const CharacterSelect: React.FC<CharacterSelectProps> = ({
  selectedCharacter,
  onSelect,
  label = '플레이어 캐릭터 선택',
}) => {
  const handleSelect = (char: CharacterType) => {
    onSelect(char);
    sound.playCoin();
  };

  return (
    <div id="character-selection-box" className="w-full flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> {label}
        </span>
        <span className="text-[11px] font-bold text-gray-400 uppercase">
          5 Characters
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
        {CHARACTERS.map((char) => {
          const isSelected = selectedCharacter === char.id;
          return (
            <button
              key={char.id}
              id={`btn-select-char-${char.id}`}
              type="button"
              onClick={() => handleSelect(char.id)}
              className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 text-center cursor-pointer ${
                isSelected
                  ? `${char.borderColor} shadow-md scale-[1.03]`
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Badge Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border"
                style={{
                  backgroundColor: isSelected ? char.color : '#F3F4F6',
                  color: isSelected ? '#FFFFFF' : '#374151',
                  borderColor: isSelected ? 'transparent' : '#E5E7EB',
                }}
              >
                {char.badge}
              </div>

              {/* Character Title */}
              <div className="w-full">
                <div className="text-xs font-black text-gray-900 tracking-tight">
                  {char.krName}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {char.name}
                </div>
              </div>

              {/* Ability Perk Pill */}
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border whitespace-nowrap ${char.accentBg}`}
              >
                {char.trait}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
