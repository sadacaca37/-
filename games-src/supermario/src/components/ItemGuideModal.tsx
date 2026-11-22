// Item & Power-Up / Vehicle Guide Modal

import React from 'react';
import { ArtIcon } from './ArtIcon';
import { X, Sparkles } from 'lucide-react';

interface ItemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideItem {
  name: string;
  badge: string;
  icon: string;
  art?: string;
  desc: string;
  control: string;
}

const ITEMS_GUIDE: GuideItem[] = [
  {
    name: '딸기 (Super Berry)',
    badge: '성장 파워업',
    icon: '🍓',
    art: 'berry',
    desc: '별 블록에서 나와 한동안 필드에 머뭅니다. 먹으면 몸이 커져서 벽돌 블록을 부수고, 한 번 더 버틸 수 있어요.',
    control: '블록을 머리로 치거나 접촉하여 획득 (충분한 지속 시간 제공)',
  },
  {
    name: '스핀 회전 공격 (Spin Melee Attack)',
    badge: '기본 액션',
    icon: '💫',
    desc: '불꽃 고추가 없을 때도 공격 키로 360도 회전 타격을 해서 젤리 슬라임, 달팽이, 덥석꽃 등 다가오는 적을 직접 물리칩니다.',
    control: '공격키(F / X / Shift / L): 360도 스핀 타격 발동',
  },
  {
    name: '바람개비 모자 (Pinwheel Cap)',
    badge: '비행 파워업',
    icon: '🎐',
    art: 'pinwheel_cap',
    desc: '머리의 바람개비를 돌려 하늘 높이 솟아오른 뒤, 천천히 활공하며 내려옵니다.',
    control: '공중에서 점프(W/↑) 또는 공격키(F/L)',
  },
  {
    name: '보라 카멜레온 타기',
    badge: '특수 탑승물',
    icon: '🦎',
    art: 'cham_stand',
    desc: '카멜레온을 타고 긴 혀로 적을 삼켜 코인으로 바꾸거나 뱉습니다. 공중에서 점프를 꾹 누르면 잠깐 버둥거리며 조금 더 떠 있어요.',
    control: '공격키(F/L): 혀로 삼키기 | 점프 홀드: 버둥 점프(점프마다 한 번)',
  },
  {
    name: '불꽃 찻잔 (Fire Flying Cup)',
    badge: '비행 슈팅',
    icon: '☕',
    art: 'cup_fire',
    desc: '하늘을 마음대로 나는 찻잔입니다. 공격 버튼을 길게 모았다가 놓으면 거대한 관통 불덩이를 발사합니다.',
    control: '상하좌우(WASD/방향키): 자유 비행 | 공격키 홀드 후 릴리즈: 차지 불덩이',
  },
  {
    name: '돌 껍질 (Stone Shell)',
    badge: '용암 특화',
    icon: '🪨',
    art: 'stone_shell',
    desc: '뜨거운 용암 위를 배처럼 타고 다닐 수 있고, 숙이면 껍질 속에 숨어 무적 상태가 됩니다.',
    control: '용암 위 부유 가능 | 아래키(S/↓): 껍질 속으로 들어가 무적화',
  },
  {
    name: '가시 투구 (Spike Helmet)',
    badge: '헤드 가드',
    icon: '🪖',
    art: 'spike_helmet',
    desc: '머리에 뾰족한 가시 투구를 써서 머리로 단단한 블록을 부수고, 위에서 떨어지는 적을 막아 냅니다.',
    control: '아래에서 블록 치기: 블록 파괴 | 가시 딱정벌레 밟기 면역',
  },
  {
    name: '나뭇잎 망토 (Leaf Cape)',
    badge: '활공 비행',
    icon: '🍃',
    art: 'leaf_cape',
    desc: '나뭇잎 망토로 넓은 협곡을 수평으로 활공하고, 공중에서 한 번 더 점프해 높이를 되찾습니다.',
    control: '공중에서 점프 홀드: 활공 | 공중에서 점프 1회 추가 탭: 에어 팝 점프',
  },
  {
    name: '불꽃 고추 (Fire Chili)',
    badge: '원거리 공격',
    icon: '🌶️',
    art: 'chili',
    desc: '땅을 통통 튀어 가는 불꽃 탄환을 던져 멀리 있는 젤리 슬라임, 달팽이 등을 손쉽게 처치합니다.',
    control: '공격키(F/L): 통통 튀는 불꽃 탄환 발사',
  },
  {
    name: '무지개 별 (Rainbow Star)',
    badge: '무적 상태',
    icon: '⭐',
    art: 'star',
    desc: '일정 시간 동안 무지갯빛 오라와 함께 완전 무적 상태가 되며, 닿는 모든 적을 바로 물리칩니다.',
    control: '적과 직접 접촉하여 즉시 처치 (+1000점)',
  },
];

export const ItemGuideModal: React.FC<ItemGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="item-guide-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        id="item-guide-modal-card"
        className="bg-white p-2 sm:p-3 rounded-[40px] shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="bg-[#FDFDFD] border-2 border-gray-100 rounded-[32px] flex flex-col flex-1 overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl border-2 border-emerald-200 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight italic text-gray-900 leading-tight">
                  POWER-UPS & <span className="text-emerald-600 font-extrabold not-italic font-mono">VEHICLES</span>
                </h2>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Action items and special vehicles manual
                </p>
              </div>
            </div>
            <button
              id="btn-close-guide"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ITEMS_GUIDE.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-gray-100 hover:border-emerald-300 hover:shadow-md p-5 rounded-2xl space-y-3 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-1 bg-gray-50 rounded-xl border border-gray-100 w-11 h-11 flex items-center justify-center shrink-0">{item.art ? <ArtIcon name={item.art} size={32} /> : item.icon}</span>
                        <h3 className="font-black text-sm text-gray-900 leading-tight">{item.name}</h3>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-black uppercase tracking-wider">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                  <div className="pt-2.5 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-emerald-800">
                    <span className="text-gray-400 uppercase tracking-wider text-[10px] font-mono">조작:</span> {item.control}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
            <button
              id="btn-close-guide-footer"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-[0_3px_0_0_#065f46] active:translate-y-0.5 active:shadow-[0_1px_0_0_#065f46] transition-all"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
