import React, { useState } from 'react';
import { Play, Volume2, VolumeX, Trophy, Users, User, Zap, Flame, ShieldAlert, Sparkles } from 'lucide-react';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types';
import { soundManager } from '../utils/audio';

interface AttractScreenProps {
  difficulty: DifficultyLevel;
  onSelectDifficulty: (level: DifficultyLevel) => void;
  onStartGame: (numPlayers: 1 | 2, startStage?: number) => void;
  onOpenHighScores: () => void;
  topScore: number;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({
  difficulty,
  onSelectDifficulty,
  onStartGame,
  onOpenHighScores,
  topScore,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [numPlayers, setNumPlayers] = useState<1 | 2>(1);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.startBGM();
    }
  };

  const handleStart = () => {
    soundManager.playJar();
    onStartGame(numPlayers, selectedStage);
  };

  const currentDiff = DIFFICULTY_CONFIGS[difficulty] || DIFFICULTY_CONFIGS.NORMAL;

  return (
    <div className="w-full max-w-[560px] bg-black text-white font-mono p-3 sm:p-4 flex flex-col items-center justify-between min-h-[500px] border-2 border-red-600 rounded-lg shadow-2xl relative overflow-hidden select-none">
      {/* Background Retro Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Header arcade info */}
      <div className="w-full flex justify-between items-center text-xs tracking-wider border-b border-gray-800 pb-2 z-10">
        <span className="text-cyan-400 font-bold">1UP 000000</span>
        <span className="text-yellow-400 font-bold">TOP SCORE {topScore.toString().padStart(6, '0')}</span>
        <span className="text-red-500 font-bold">SIGMA ENT. 1982</span>
      </div>

      {/* Dancing Raccoons Row */}
      <div className="flex gap-2.5 my-1.5 z-10 animate-bounce">
        {['P', 'O', 'N', 'P', 'O', 'K', 'O'].map((char, index) => (
          <div key={index} className="flex flex-col items-center">
            {/* Raccoon Icon */}
            <div className="w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center border border-white mb-1 shadow-md">
              <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1 bg-black rounded-xs" />
              </div>
            </div>
            <span className="text-yellow-300 font-extrabold text-sm sm:text-base tracking-widest">{char}</span>
          </div>
        ))}
      </div>

      {/* Classic Lyrics */}
      <div className="text-center my-0.5 bg-black/80 p-2 rounded-md border border-pink-500/40 z-10 shadow-lg">
        <p className="text-pink-400 font-bold text-[11px] mb-0.5 animate-pulse">
          ♪ LETS SING A SONG ♪
        </p>
        <p className="text-yellow-300 text-[11px] leading-relaxed tracking-wider font-bold">
          RUN RUN PONPOKO TO EAT THE FRUITS<br />
          JUMP BOUND AROUND WITH YOUR BIG BELLY OUT!
        </p>
      </div>

      {/* Difficulty Level Selector */}
      <div className="w-full bg-neutral-900/90 border border-purple-500/50 p-2 rounded-md my-1 z-10 text-center">
        <div className="flex justify-between items-center mb-1.5 px-1">
          <span className="text-purple-300 text-xs font-bold tracking-widest flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            DIFFICULTY LEVEL (난이도 선택)
          </span>
          <span className={`text-[11px] font-extrabold ${currentDiff.color}`}>
            {currentDiff.label} ({currentDiff.koreanLabel})
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {(['EASY', 'NORMAL', 'HARD', 'EXPERT'] as DifficultyLevel[]).map((lvl) => {
            const conf = DIFFICULTY_CONFIGS[lvl];
            const isSelected = difficulty === lvl;
            return (
              <button
                key={lvl}
                onClick={() => {
                  onSelectDifficulty(lvl);
                  soundManager.playStep();
                }}
                className={`py-1.5 px-1 rounded text-center transition-all cursor-pointer border ${
                  isSelected
                    ? `${conf.badgeBg} font-extrabold scale-102 shadow-md border-2`
                    : 'bg-neutral-800/80 text-gray-400 border-neutral-700 hover:text-gray-200 hover:bg-neutral-800'
                }`}
              >
                <div className="text-xs font-extrabold">{conf.label}</div>
                <div className="text-[10px] mt-0.5 opacity-90">{conf.koreanLabel}</div>
              </button>
            );
          })}
        </div>

        {/* Difficulty Specs Detail Bar */}
        <div className="mt-1.5 py-1 px-2 bg-black/60 rounded border border-neutral-800 text-[10px] text-gray-300 flex items-center justify-between">
          <span className="text-cyan-300 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" />
            적 이동 속도: <strong className="text-white">{(currentDiff.speedMultiplier * 100).toFixed(0)}%</strong>
          </span>
          <span className="text-purple-300 font-semibold">
            제한 시간: <strong className="text-white">{currentDiff.timeMultiplier > 1 ? `+${Math.round((currentDiff.timeMultiplier - 1) * 100)}%` : currentDiff.timeMultiplier < 1 ? `${Math.round((currentDiff.timeMultiplier - 1) * 100)}%` : '표준 100%'}</strong>
          </span>
        </div>
      </div>

      {/* Mode Selection (1 Player vs 2 Players) */}
      <div className="w-full bg-neutral-900/90 border border-yellow-500/50 p-2 rounded-md my-0.5 z-10 text-center">
        <span className="text-yellow-300 text-xs font-bold block mb-1.5 tracking-widest">
          GAME MODE SELECT (플레이어 모드)
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setNumPlayers(1)}
            className={`py-1.5 px-3 text-xs font-extrabold rounded flex items-center justify-center gap-2 border cursor-pointer transition-all ${
              numPlayers === 1
                ? 'bg-red-600 text-white border-yellow-300 shadow-lg scale-102'
                : 'bg-neutral-800 text-gray-400 border-neutral-700 hover:text-white'
            }`}
          >
            <User className="w-4 h-4 text-yellow-300" />
            1 PLAYER GAME
          </button>

          <button
            onClick={() => setNumPlayers(2)}
            className={`py-1.5 px-3 text-xs font-extrabold rounded flex items-center justify-center gap-2 border cursor-pointer transition-all ${
              numPlayers === 2
                ? 'bg-blue-600 text-white border-cyan-300 shadow-lg scale-102'
                : 'bg-neutral-800 text-gray-400 border-neutral-700 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-300" />
            2 PLAYERS (동시 2인용)
          </button>
        </div>
      </div>

      {/* Stage Selector (1 ~ 5) */}
      <div className="w-full bg-gray-900/90 border border-cyan-500/50 p-2 rounded-md my-0.5 z-10 text-center">
        <span className="text-cyan-300 text-xs font-bold block mb-1 tracking-widest">
          SELECT STARTING STAGE (시작 단계)
        </span>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((stg) => (
            <button
              key={stg}
              onClick={() => setSelectedStage(stg)}
              className={`px-3 py-1 text-xs font-bold rounded transition-all cursor-pointer ${
                selectedStage === stg
                  ? 'bg-yellow-400 text-black shadow-lg scale-105 border-2 border-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-600'
              }`}
            >
              STAGE {stg}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col gap-2 z-10 my-1">
        <button
          onClick={handleStart}
          className={`w-full py-2.5 font-extrabold text-sm sm:text-base tracking-widest rounded-md border-2 shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer ${
            numPlayers === 2
              ? 'bg-blue-600 hover:bg-blue-500 text-white border-cyan-300'
              : 'bg-red-600 hover:bg-red-500 text-white border-yellow-300'
          }`}
        >
          <Play className="w-5 h-5 fill-current text-yellow-300" />
          {numPlayers === 1 ? '1 PLAYER START' : '2 PLAYERS START'} (STAGE {selectedStage}) [{currentDiff.label}]
        </button>

        <div className="flex gap-2">
          <button
            onClick={onOpenHighScores}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-yellow-300 font-bold text-xs rounded border border-gray-600 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            HIGH SCORES
          </button>

          <button
            onClick={toggleSound}
            className={`py-2 px-3 font-bold text-xs rounded border flex items-center justify-center gap-1.5 cursor-pointer ${
              isMuted
                ? 'bg-gray-800 text-red-400 border-red-500'
                : 'bg-gray-800 text-green-400 border-green-500'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            {isMuted ? 'BGM OFF' : '🎵 BGM ON'}
          </button>
        </div>
      </div>

      {/* Controls & Power-Ups Guide Banner */}
      <div className="w-full mt-1 text-center text-[10px] text-gray-300 border-t border-gray-800 pt-1.5 z-10 leading-tight space-y-1">
        <div className="flex justify-around bg-neutral-900/80 py-1 px-2 rounded border border-neutral-700 text-[10px]">
          <span className="text-yellow-300 font-bold">⚡ 스피드부츠: 이동속도+55%</span>
          <span className="text-red-400 font-bold">🔨 슈퍼해머: 적/가시 분쇄(+300P)</span>
          <span className="text-pink-400 font-bold">💖 1-UP: 잔기+1</span>
          <span className="text-green-400 font-bold">🎯 회피: 공중점프보너스(+70P)</span>
        </div>
        <div><span className="text-red-400 font-bold">1P 조작:</span> 방향키/WASD = 이동 및 사다리 타기 | <span className="text-yellow-300 font-bold">Space / Z</span> = 점프</div>
        <div><span className="text-cyan-400 font-bold">2P 조작:</span> 키패드 4(좌), 6(우), 8(상), 2/5(하) | <span className="text-yellow-300 font-bold">0/Enter</span> = 점프</div>
      </div>
    </div>
  );
};
