import React, { useState, useEffect } from 'react';
import { RefreshCw, Trophy, Skull, Crown, Sparkles, Award, Star, CheckCircle2, Home } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface GameOverModalProps {
  finalScoreP1: number;
  finalScoreP2?: number;
  roundReached: number;
  timeElapsedSeconds?: number;
  isVictory?: boolean;
  onRestart: () => void;
  onSubmitScore: (name: string, score: number) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  finalScoreP1,
  finalScoreP2,
  roundReached,
  timeElapsedSeconds = 0,
  isVictory = false,
  onRestart,
  onSubmitScore,
}) => {
  const [playerName, setPlayerName] = useState<string>(isVictory ? 'BUB' : 'AAA');
  const [selectedPlayer, setSelectedPlayer] = useState<'1P' | '2P'>('1P');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [submittedName, setSubmittedName] = useState<string>('');

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const highestScore =
    finalScoreP2 !== undefined
      ? selectedPlayer === '1P'
        ? finalScoreP1
        : finalScoreP2
      : finalScoreP1;

  useEffect(() => {
    if (isVictory) {
      audioEngine.stopBgm();
      audioEngine.playVictory();
    }
  }, [isVictory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    if (cleanName && !hasSubmitted) {
      onSubmitScore(cleanName.substring(0, 10), highestScore);
      setSubmittedName(cleanName.substring(0, 10));
      setHasSubmitted(true);
      audioEngine.playCollectFruit();
    }
  };

  const handleQuickName = (name: string) => {
    setPlayerName(name);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-4 text-white font-mono animate-fade-in select-none overflow-y-auto">
      {/* Decorative Celebration Confetti Particles for Victory */}
      {isVictory && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-10 text-yellow-300 animate-bounce text-2xl">✨</div>
          <div className="absolute top-1/3 right-12 text-pink-400 animate-pulse text-2xl">🎉</div>
          <div className="absolute bottom-1/4 left-16 text-emerald-400 animate-spin text-xl">⭐</div>
          <div className="absolute bottom-1/3 right-14 text-cyan-400 animate-bounce text-2xl">👑</div>
          <div className="absolute top-12 left-1/3 text-yellow-400 animate-ping text-base">★</div>
          <div className="absolute top-16 right-1/3 text-pink-300 animate-bounce text-lg">🎊</div>
        </div>
      )}

      <div
        className={`bento-card bento-card-active p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl relative overflow-hidden border-2 my-auto ${
          isVictory
            ? 'border-yellow-400/90 shadow-[0_0_50px_rgba(250,204,21,0.35)] bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900'
            : 'border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.25)] bg-slate-950'
        }`}
      >
        {isVictory ? (
          <>
            <div className="relative inline-block mb-3">
              <Crown className="w-20 h-20 text-yellow-400 mx-auto animate-bounce filter drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
              <Sparkles className="w-6 h-6 text-pink-400 absolute -top-1 -right-1 animate-spin" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-400 to-emerald-400 uppercase tracking-wider mb-1 glow-yellow">
              ★ GRAND VICTORY! ★
            </h2>
            <p className="text-yellow-300 font-bold text-sm sm:text-base tracking-widest mb-1 glow-yellow">
              버블보블 전 스테이지 올클리어! 우승을 축하합니다!
            </p>
            <p className="text-slate-400 text-xs tracking-wider mb-5">
              ALL 10 STAGES CLEARED • FINAL BOSS BARON DEFEATED
            </p>
          </>
        ) : (
          <>
            <Skull className="w-16 h-16 text-red-500 mx-auto mb-2 animate-pulse filter drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
            <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest mb-1 glow-pink">
              GAME OVER
            </h2>
            <p className="text-slate-400 font-bold text-xs tracking-widest mb-5">
              REACHED STAGE {roundReached} / 10
            </p>
          </>
        )}

        {/* Final Score Board */}
        <div className="bg-slate-900/90 border border-yellow-500/30 p-4 rounded-xl space-y-2.5 mb-5 shadow-inner">
          <div className="flex justify-between items-center text-slate-200">
            <span className="text-emerald-400 font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <Star className="w-4 h-4 text-emerald-400" /> 1P (BUB) FINAL SCORE:
            </span>
            <span className="text-yellow-300 font-black text-base sm:text-lg">
              {String(finalScoreP1).padStart(6, '0')} PTS
            </span>
          </div>

          {finalScoreP2 !== undefined && (
            <div className="flex justify-between items-center text-slate-200 border-t border-slate-800 pt-2">
              <span className="text-cyan-400 font-bold text-xs sm:text-sm flex items-center gap-1.5">
                <Star className="w-4 h-4 text-cyan-400" /> 2P (BOB) FINAL SCORE:
              </span>
              <span className="text-yellow-300 font-black text-base sm:text-lg">
                {String(finalScoreP2).padStart(6, '0')} PTS
              </span>
            </div>
          )}

          {timeElapsedSeconds > 0 && (
            <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-2 text-xs">
              <span className="font-mono">⏱️ PLAY TIME:</span>
              <span className="text-pink-400 font-mono font-bold">{formatTime(timeElapsedSeconds)}</span>
            </div>
          )}
        </div>

        {/* Name Registration Section */}
        {!hasSubmitted ? (
          <form
            onSubmit={handleSubmit}
            className="mb-6 bg-slate-900/90 p-4 sm:p-5 rounded-xl border-2 border-yellow-400/80 shadow-lg text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs sm:text-sm text-yellow-300 font-bold flex items-center gap-1.5 glow-yellow">
                <Award className="w-4 h-4 text-yellow-400" />
                {isVictory ? '👑 우승자 명예의 전당 이름 등록:' : '🏆 명예의 전당 기록 등록:'}
              </label>

              {finalScoreP2 !== undefined && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer('1P')}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      selectedPlayer === '1P'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1P
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPlayer('2P')}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      selectedPlayer === '2P'
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2P
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                maxLength={10}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={isVictory ? '우승자 이름' : '플레이어 이름'}
                className="flex-1 text-center font-black text-lg bg-slate-950 border-2 border-yellow-400 text-yellow-300 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-inner"
                autoFocus
              />
              <button
                type="submit"
                className="py-2.5 px-5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-lg border border-yellow-200 transition shadow-lg flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-4 h-4" />
                <span>등록 (ENTER)</span>
              </button>
            </div>

            {/* Quick preset name suggestions */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
              <span className="text-slate-400">빠른 입력:</span>
              {['BUB', 'BOB', 'CHAMP', 'HERO', '용사', '버블왕'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickName(preset)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 rounded border border-slate-700 font-bold transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </form>
        ) : (
          <div className="mb-6 bg-emerald-950/80 border-2 border-emerald-400 p-4 rounded-xl text-center animate-fade-in shadow-lg">
            <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-base sm:text-lg mb-1">
              <CheckCircle2 className="w-6 h-6 text-yellow-300" />
              <span>★ 명예의 전당 등록 완료! ★</span>
            </div>
            <p className="text-yellow-300 font-bold text-sm">
              우승자 [{submittedName}]님의 점수 {highestScore.toLocaleString()} PTS가 기록되었습니다!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base rounded-xl border-2 border-yellow-300 shadow-lg shadow-emerald-600/40 flex items-center justify-center gap-2 transform hover:scale-[1.02] transition"
          >
            <RefreshCw className="w-5 h-5" />
            <span>{isVictory ? '새 게임 시작' : '다시 플레이 (RETRY)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
