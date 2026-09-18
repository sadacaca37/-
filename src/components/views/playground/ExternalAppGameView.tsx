import React, { useState, useRef } from 'react';
import { ArrowLeft, ExternalLink, RefreshCw, Sparkles, Check, Copy, Edit3, Maximize2 } from 'lucide-react';
import { soundManager } from '../../../utils/sound';

interface ExternalAppGameViewProps {
  appUrl: string;
  title: string;
  icon?: string;
  onBack: () => void;
}

export const ExternalAppGameView: React.FC<ExternalAppGameViewProps> = ({
  appUrl,
  title: initialTitle,
  icon: initialIcon = '🎮',
  onBack,
}) => {
  const [copied, setCopied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [title, setTitle] = useState(() => {
    try {
      const saved = localStorage.getItem(`typang_game_title_${appUrl}`);
      return saved || initialTitle;
    } catch {
      return initialTitle;
    }
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState(title);

  const handleLaunchDirect = () => {
    soundManager.play('achievement');
    window.open(appUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRefresh = () => {
    soundManager.play('click');
    setReloadKey((k) => k + 1);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      soundManager.play('achievement');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveTitle = () => {
    if (editTitleInput.trim()) {
      setTitle(editTitleInput.trim());
      try {
        localStorage.setItem(`typang_game_title_${appUrl}`, editTitleInput.trim());
      } catch {}
      soundManager.play('achievement');
    }
    setIsEditingTitle(false);
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl p-3 sm:p-4 border-2 border-purple-500/40 shadow-2xl space-y-3 animate-fade-in text-white flex flex-col min-h-[82vh]">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              soundManager.play('click');
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-black border border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
            title="놀이터로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4 text-pink-400" />
            <span>뒤로 가기</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">{initialIcon}</span>
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="px-2 py-1 text-xs sm:text-sm bg-slate-800 border border-purple-400 rounded-lg text-white font-bold"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-lg"
                >
                  저장
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black font-arcade text-sm sm:text-base tracking-wide">
                  {title}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
                  title="게임 이름 변경하기"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition-all cursor-pointer active:scale-95"
            title="게임 새로고침"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">새로고침</span>
          </button>

          <button
            type="button"
            onClick={handleLaunchDirect}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs sm:text-sm font-black transition-all cursor-pointer shadow-md hover:scale-102 active:scale-95"
          >
            <span>새 창 전체화면</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Game Screen - Direct Embed without clipped loading shapes */}
      <div className="w-full flex-1 rounded-2xl overflow-hidden bg-black border-2 border-purple-500/50 relative shadow-2xl flex flex-col min-h-[580px] sm:min-h-[640px]">
        <iframe
          key={reloadKey}
          ref={iframeRef}
          src={appUrl}
          title={title}
          className="w-full flex-1 border-0 bg-slate-950"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      </div>

      {/* Bottom info strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5 text-purple-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>로딩 지연 없이 바로 실행됩니다. 더 큰 화면을 원하시면 상단 '새 창 전체화면'을 누르세요.</span>
        </span>

        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer text-[11px]"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">주소 복사됨!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>게임 주소 복사</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

