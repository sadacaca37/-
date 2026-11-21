import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Zap, Sparkles, Volume2, VolumeX, Play, Coins, Trophy, HelpCircle, Users, User } from 'lucide-react';
import { HighScoreEntry, GameSettings, GameMode } from '../types';
import { retroAudio } from '../audio/retroAudio';

interface TitleScreenProps {
  onStart: (mode: GameMode) => void;
  onOpenScores: () => void;
  onOpenHowToPlay: () => void;
  credits: number;
  onInsertCoin: () => void;
  highScore: number;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  onOpenScores,
  onOpenHowToPlay,
  credits,
  onInsertCoin,
  highScore,
  settings,
  onUpdateSettings,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('1P');

  const difficulties: { id: GameSettings['difficulty']; label: string; desc: string; color: string }[] = [
    { id: 'EASY', label: 'EASY', desc: '4 Lives • 4 Bombs • Gentle Bullets', color: 'border-emerald-500/70 text-emerald-400 bg-emerald-950/40' },
    { id: 'NORMAL', label: 'NORMAL', desc: '3 Lives • 3 Bombs • Arcade Classic', color: 'border-amber-500/70 text-amber-400 bg-amber-950/40' },
    { id: 'HARD', label: 'HARD', desc: '3 Lives • 2 Bombs • High Density Flak', color: 'border-orange-500/70 text-orange-400 bg-orange-950/40' },
    { id: 'INSANE', label: 'INSANE', desc: '2 Lives • 1 Bomb • Apex Danmaku Hell', color: 'border-red-500/70 text-red-400 bg-red-950/40' },
  ];

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 sm:p-6 bg-[#020617]/90 backdrop-blur-xs select-none font-mono overflow-y-auto">
      {/* Top Tactical Briefing Bar */}
      <div className="w-full flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold uppercase tracking-wider">DEFENSE SQUADRON 1945</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[10px] uppercase">HI-SCORE:</span>
          <span className="text-amber-400 font-bold">{highScore.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 uppercase">CREDIT</span>
          <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-bold">{credits}</span>
        </div>
      </div>

      {/* Center Logo & Title */}
      <div className="flex flex-col items-center text-center my-auto w-full max-w-md">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="relative mb-3"
        >
          <div className="inline-block px-3 py-0.5 mb-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-widest uppercase">
            ★ PACIFIC AIR DEFENSE OPERATION ★
          </div>
          <h1 className="text-3xl sm:text-5xl font-arcade font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
            STRIKER
          </h1>
          <div className="text-base sm:text-lg font-tech font-extrabold tracking-widest text-slate-200 mt-0.5">
            AIR COMBAT 1945 : CO-OP SQUADRON
          </div>
        </motion.div>

        {/* 1P / 2P Mode Selector */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2 mb-3 text-left">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-400" /> 출격 모드 선택 (OPERATION MODE)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                retroAudio.playShoot(1);
                setSelectedMode('1P');
              }}
              className={`p-2 rounded border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                selectedMode === '1P'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <User className="w-3.5 h-3.5" /> 1인용 단독 작전
              </div>
              <span className="text-[9px] text-slate-400">1P SOLO PILOT</span>
            </button>

            <button
              onClick={() => {
                retroAudio.playShoot(1);
                setSelectedMode('2P');
              }}
              className={`p-2 rounded border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                selectedMode === '2P'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> 2인용 합동 작전
              </div>
              <span className="text-[9px] text-cyan-300/80 font-bold">2P DUAL CO-OP</span>
            </button>
          </div>

          {/* Quick Key Guide for Selected Mode */}
          <div className="mt-2 p-1.5 bg-slate-950 rounded border border-slate-800/80 text-[9px] text-slate-300 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold">1P 조작:</span>
              <span className="text-slate-300">이동: [WASD] | 발사: [J / SPACE] | 폭탄: [X] | 회전: [C]</span>
            </div>
            {selectedMode === '2P' && (
              <div className="flex items-center justify-between border-t border-slate-800 pt-0.5">
                <span className="text-cyan-400 font-bold">2P 조작:</span>
                <span className="text-slate-300">이동: [방향키 ↑↓←→] | 발사: [B / Num1] | 폭탄: [N / Num2] | 회전: [M / Num3]</span>
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Level Selector Box */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2 mb-3 text-left">
          <div className="flex justify-between items-center mb-1.5 px-0.5">
            <span className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> DIFFICULTY SETTING (난이도)
            </span>
            <span className="text-[9px] text-amber-400 font-bold">
              {settings.difficulty}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 mb-1">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => {
                  retroAudio.playShoot(1);
                  onUpdateSettings({ difficulty: diff.id });
                }}
                className={`py-1 px-1.5 rounded text-[10px] font-bold font-mono text-center transition-all cursor-pointer border ${
                  settings.difficulty === diff.id
                    ? diff.color + ' ring-1 ring-amber-400/50 shadow'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Action */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button
            id="start-game-btn"
            onClick={() => onStart(selectedMode)}
            className={`w-full py-2.5 sm:py-3 px-6 rounded font-arcade text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              selectedMode === '2P'
                ? 'bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
            }`}
          >
            <Play className="w-4 h-4 fill-slate-950" />
            {selectedMode === '2P' ? '2인용 합동 출격 (START 2P CO-OP)' : '1인용 단독 출격 (START 1P SOLO)'}
          </button>

          <button
            id="insert-coin-btn"
            onClick={onInsertCoin}
            className="w-full py-1.5 px-4 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-mono active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-400" />
            INSERT COIN [KEY: 5] (+1 CREDIT)
          </button>
        </div>

        {/* Secondary Buttons */}
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={onOpenHowToPlay}
            className="py-1.5 px-3 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
            FLIGHT MANUAL
          </button>
          <button
            onClick={onOpenScores}
            className="py-1.5 px-3 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            ACE RECORDS
          </button>
        </div>

        {/* Blinking Notice */}
        <div className="mt-3 text-[10px] sm:text-[11px] font-mono text-amber-300 animate-arcade-blink">
          PRESS [SPACE] OR CLICK 출격 TO BEGIN
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full text-center text-[10px] text-slate-500 border-t border-slate-800 pt-2 font-mono">
        © 1945-2026 TACTICAL AIR COMMAND. 2-PLAYER DUAL SQUADRON ACTIVE.
      </div>
    </div>
  );
};

