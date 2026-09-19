import React, { useState } from 'react';
import { TvBot } from '../views/TapangHome';
import { 
  X, 
  Sparkles, 
  Lock, 
  Check, 
  Coins, 
  Palette, 
  Zap, 
  Crown,
  ChevronRight
} from 'lucide-react';
import { TamagotchiThemeType } from '../../types';
import { TAMAGOTCHI_THEMES, ThemeMeta } from '../../data/tamagotchiThemesData';
import { soundManager } from '../../utils/sound';

interface ThemeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: TamagotchiThemeType;
  unlockedThemes: TamagotchiThemeType[];
  userPoints: number;
  onSelectTheme: (theme: TamagotchiThemeType) => void;
  onUnlockTheme: (theme: TamagotchiThemeType, cost: number) => void;
  isMaster?: boolean;
}

export const ThemeShopModal: React.FC<ThemeShopModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  unlockedThemes = ['warm_living'],
  userPoints,
  onSelectTheme,
  onUnlockTheme,
  isMaster = false,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<TamagotchiThemeType>(currentTheme);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const currentThemeMeta = TAMAGOTCHI_THEMES.find((t) => t.id === selectedPreview) || TAMAGOTCHI_THEMES[0];
  const isUnlocked = unlockedThemes.includes(selectedPreview);
  const isCurrentlyApplied = currentTheme === selectedPreview;

  const handleApply = (themeId: TamagotchiThemeType) => {
    soundManager.playSuccess();
    onSelectTheme(themeId);
    setSuccessMsg(`'${currentThemeMeta.name}' 테마가 적용되었습니다!`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleBuyAndUnlock = (themeMeta: ThemeMeta) => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!isMaster && userPoints < themeMeta.cost) {
      soundManager.playError();
      setErrorMsg(`포인트가 부족합니다! (필요: ${themeMeta.cost}P / 보유: ${userPoints}P) 타자 연습을 완료하여 포인트를 모아보세요!`);
      return;
    }

    soundManager.playLevelUp();
    onUnlockTheme(themeMeta.id, isMaster ? 0 : themeMeta.cost);
    setSuccessMsg(isMaster ? `👑 마스터 권한으로 '${themeMeta.name}' 테마가 즉시 무료 해금되었습니다!` : `🎉 축하합니다! '${themeMeta.name}' 테마가 해금되었습니다!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 tp-modal">
      <div className="tp-modal-bot" aria-hidden="true">
        <TvBot size={110} bubble="포인트를 모아 테마를 구매하세요!" bubbleSide="top" />
      </div>
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border-4 border-indigo-200 relative max-h-[90vh] flex flex-col overflow-hidden arcade-card-glow">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center border-2 border-indigo-300 shadow-sm">
              <Palette className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-arcade flex items-center gap-2">
                <span>타마고치 배경 테마 상점</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold">
                  포인트 해금
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                타자 연습을 열심히 하고 모은 포인트로 우주, 바다, 구름 등 멋진 공간을 꾸며보세요!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Practice Points Badge */}
            <div className="bg-amber-50 border-2 border-amber-300 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-amber-900 font-black text-sm shadow-xs">
              <Coins className="w-4 h-4 text-amber-500" />
              <span>{userPoints.toLocaleString()}</span>
              <span className="text-[11px] text-amber-700">P</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold shrink-0 animate-shake">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-black shrink-0">
            {successMsg}
          </div>
        )}

        {/* Body: Grid of Themes */}
        <div className="my-4 flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {TAMAGOTCHI_THEMES.map((theme) => {
              const unlocked = unlockedThemes.includes(theme.id);
              const applied = currentTheme === theme.id;
              const isSelected = selectedPreview === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedPreview(theme.id)}
                  className={`p-4 rounded-2xl border-3 transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-3 ring-indigo-200'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl p-2 rounded-xl bg-white shadow-xs border border-slate-100">
                        {theme.icon}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-black text-slate-900 text-sm">{theme.name}</h4>
                          {applied && (
                            <span className="px-1.5 py-0.5 rounded-md bg-teal-500 text-white text-[10px] font-black">
                              사용중
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                          {theme.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Info & Action */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-black">
                      {theme.cost === 0 ? (
                        <span className="text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                          기본 테마
                        </span>
                      ) : unlocked ? (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200 flex items-center gap-1">
                          <Check className="w-3 h-3" /> 보유중
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-500" /> {theme.cost} P
                        </span>
                      )}
                    </div>

                    <div>
                      {unlocked ? (
                        <button
                          type="button"
                          disabled={applied}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(theme.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all flex items-center gap-1 ${
                            applied
                              ? 'bg-slate-100 text-slate-400 cursor-default'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          }`}
                        >
                          {applied ? '적용중' : '배경 적용하기'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyAndUnlock(theme);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-sm flex items-center gap-1 transition-all"
                        >
                          <Zap className="w-3 h-3" />
                          <span>{isMaster ? '마스터 무료 해금' : `${theme.cost}P로 해금`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Theme Details Banner */}
        <div className="p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border-2 border-indigo-100 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentThemeMeta.icon}</span>
            <div>
              <p className="text-xs font-black text-slate-800">
                선택됨: <span className="text-indigo-600">{currentThemeMeta.name}</span>
              </p>
              <p className="text-[11px] text-slate-500 font-medium">{currentThemeMeta.desc}</p>
            </div>
          </div>

          <div>
            {isUnlocked ? (
              <button
                type="button"
                disabled={isCurrentlyApplied}
                onClick={() => handleApply(currentThemeMeta.id)}
                className={`px-4 py-2 rounded-xl font-black text-xs shadow-md transition-all ${
                  isCurrentlyApplied
                    ? 'bg-teal-500 text-white cursor-default'
                    : 'arcade-btn-sky text-white'
                }`}
              >
                {isCurrentlyApplied ? '현재 적용된 테마' : '이 테마로 즉시 변경'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleBuyAndUnlock(currentThemeMeta)}
                className={`text-white px-4 py-2 rounded-xl font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isMaster ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400' : 'arcade-btn-pink'
                }`}
              >
                {isMaster ? <Crown className="w-3.5 h-3.5 text-yellow-200 animate-bounce" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isMaster ? '👑 마스터 무료 해금하기' : `${currentThemeMeta.cost}P 해금하기`}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
