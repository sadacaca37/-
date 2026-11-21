// Item & Power-Up / Vehicle Guide Modal

import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ItemGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideItem {
  name: string;
  badge: string;
  icon: string;
  desc: string;
  control: string;
}

const ITEMS_GUIDE: GuideItem[] = [
  {
    name: '슈퍼 버섯 (Super Mushroom)',
    badge: '성장 파워업',
    icon: '🍄',
    desc: '물음표 블록에서 생성되어 긴 여유 시간 동안 안정적으로 필드에 머뭅니다. 먹으면 슈퍼 마리오로 거대화하여 블록을 부수고 체력이 증가합니다.',
    control: '블록을 머리로 치거나 접촉하여 획득 (충분한 지속 시간 제공)',
  },
  {
    name: '스핀 회전 공격 (Spin Melee Attack)',
    badge: '기본 액션',
    icon: '💫',
    desc: '파이어 플라워가 없을 때도 공격 키로 전방위 360도 회전 타격을 가해 굼바, 엉금엉금, 뻐끔플라워 등 접근하는 적을 직접 격파합니다.',
    control: '공격키(F / X / Shift / L): 360도 스핀 타격 발동',
  },
  {
    name: '프로펠러 버섯 (Propeller Mushroom)',
    badge: '비행 파워업',
    icon: '🚁',
    desc: '머리의 프로펠러를 회전시켜 하늘 높이 로켓처럼 수직 상승한 뒤, 천천히 활공하며 하강합니다.',
    control: '공중에서 점프(W/↑) 또는 공격키(F/L)',
  },
  {
    name: '요시 (Yoshi) 탑승',
    badge: '특수 탑승물',
    icon: '🦖',
    desc: '요시에 탑승하여 적을 혓바닥으로 삼켜 코인으로 바꾸거나 뱉고, 공중에서 다리를 굴러 2단 플러터 점프가 가능합니다.',
    control: '공격키(F/L): 혓바닥 삼키기 | 점프 홀드: 2단 플러터 점프',
  },
  {
    name: '파이어 클라운 카 (Fire Clown Car)',
    badge: '비행 슈팅',
    icon: '🤡',
    desc: '360도 전방향 비행이 가능한 헬리콥터 보울입니다. 공격 버튼을 길게 모아 차징하면 거대한 관통 파이어볼을 발사합니다.',
    control: '상하좌우(WASD/방향키): 자유 비행 | 공격키 홀드 후 릴리즈: 차지 파이어볼',
  },
  {
    name: '드라이본즈 껍질 (Dry Bones Shell)',
    badge: '용암 특화',
    icon: '💀',
    desc: '치명적인 용암 위를 안전하게 배처럼 타고 다닐 수 있으며, 숙이기 조작 시 껍질 속에 숨어 무적(죽은 척) 상태가 됩니다.',
    control: '용암 위 부유 가능 | 아래키(S/↓): 껍질 속으로 들어가 무적화',
  },
  {
    name: '찌르기 껍질 모자 (Spiny Helmet)',
    badge: '헤드 가드',
    icon: '🪖',
    desc: '머리에 뾰족한 가시 모자를 장착하여 머리로 단단한 블록을 부수고, 위에서 떨어지는 적을 역으로 방어합니다.',
    control: '아래에서 블록 치기: 블록 파괴 | 가시돌이 밟기 면역',
  },
  {
    name: '슈퍼 도토리 / 날다람쥐 슈트 (Super Acorn)',
    badge: '활공 비행',
    icon: '🐿️',
    desc: '날다람쥐 날개로 공중에서 넓은 협곡을 수평 활공하며, 공중에서 한 번 더 팝업 점프로 높이를 회복합니다.',
    control: '공중에서 점프 홀드: 활공 | 공중에서 점프 1회 추가 탭: 에어 팝 점프',
  },
  {
    name: '파이어 플라워 (Fire Flower)',
    badge: '원거리 공격',
    icon: '🔥',
    desc: '지면을 통통 튀어가는 파이어볼을 투척하여 멀리 있는 굼바, 노코노코 등 적을 손쉽게 처치합니다.',
    control: '공격키(F/L): 통통 튀는 불꽃 탄환 발사',
  },
  {
    name: '슈퍼 스타 (Super Star)',
    badge: '무적 상태',
    icon: '⭐',
    desc: '일정 시간 동안 무지갯빛 오라와 함께 완전 무적 상태가 되며, 닿는 모든 적을 즉시 격파합니다.',
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
                        <span className="text-3xl p-1 bg-gray-50 rounded-xl border border-gray-100">{item.icon}</span>
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
