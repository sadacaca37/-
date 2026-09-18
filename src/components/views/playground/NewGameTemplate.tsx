import React, { useState } from 'react';
import { Sparkles, Code2, PlusCircle, Trophy, Play, CheckCircle2 } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface NewGameTemplateProps {
  onScoreEarned?: (score: number) => void;
}

export const NewGameTemplate: React.FC<NewGameTemplateProps> = ({ onScoreEarned }) => {
  const [clicks, setClicks] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);

  const handleClick = () => {
    soundManager.playKeyClick(true);
    const nextClicks = clicks + 1;
    setClicks(nextClicks);
    setCombo((prev) => prev + 1);

    if (nextClicks % 20 === 0) {
      soundManager.play('achievement');
      setLevel((prev) => prev + 1);
    }

    if (onScoreEarned) {
      onScoreEarned(10);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-purple-200">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-700 border border-purple-300">
              🛠️ 개발자 템플릿 & 스피드 탭
            </span>
            <span className="text-xs text-slate-400 font-bold">
              내가 만든 게임을 여기에 업데이트하여 계속 추가할 수 있습니다!
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 font-arcade mt-1">
            신규 게임 등록 슬롯 & 스피드 탭 샘플
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono font-black text-sm">
          <div className="px-3 py-1.5 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200">
            <span>레벨: {level}</span>
          </div>
          <div className="px-3 py-1.5 rounded-2xl bg-pink-50 text-pink-700 border border-pink-200">
            <span>클릭 수: {clicks}</span>
          </div>
        </div>
      </div>

      {/* Interactive Mini Game Area */}
      <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-sky-50 rounded-2xl p-8 border-2 border-dashed border-purple-300 text-center flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center text-4xl shadow-lg mb-4 hover:scale-110 hover:rotate-6 active:scale-90 transition-transform cursor-pointer"
          onClick={handleClick}
        >
          💎
        </div>

        <h4 className="text-lg font-black text-slate-800 mb-1 font-arcade">
          스피드 크리스탈 탭!
        </h4>
        <p className="text-xs text-slate-500 font-bold mb-4">
          크리스탈을 탭하면 레벨이 오르고 콤보 점수를 획득합니다.
        </p>

        <button
          onClick={handleClick}
          className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          크리스탈 터치! (+1)
        </button>
      </div>

      {/* How to add new games guide */}
      <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-2 text-slate-800 font-black text-sm">
          <Code2 className="w-4 h-4 text-purple-600" />
          <span>새 게임 추가하는 방법 가이드</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          1. <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-purple-600">src/components/views/playground/</code> 폴더에 새 컴포넌트(예: <code>MyNewGame.tsx</code>)를 만듭니다.<br />
          2. <code className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono text-purple-600">playgroundGamesRegistry.ts</code> 파일의 목록에 게임 제목과 컴포넌트를 등록하면 자동으로 플레이그라운드와 홈 화면에 반영됩니다!
        </p>
      </div>
    </div>
  );
};
