import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlaneConfig, PlaneId, GameMode } from '../types';
import { PLANES, PLAYER_PLANE_IMAGES } from '../game/constants';
import { SpriteRenderer } from '../game/sprites';
import { Shield, Zap, Wind, Crosshair, Sparkles, Check, ChevronLeft, ChevronRight, Grid, Eye, Flame, Plane, Users, User } from 'lucide-react';
import { retroAudio } from '../audio/retroAudio';

interface PlaneSelectModalProps {
  mode?: GameMode;
  onSelect: (planeId1: PlaneId, planeId2?: PlaneId) => void;
  onBack: () => void;
}

// Mini Canvas Renderer for Pixel-Perfect Aircraft Sprite Preview
const PlaneCanvasPreview: React.FC<{
  planeId: string;
  width?: number;
  height?: number;
  scale?: number;
  className?: string;
}> = ({ planeId, width = 120, height = 90, scale = 1.6, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    let animId: number;

    const render = () => {
      SpriteRenderer.drawPlanePreview(ctx, planeId, width, height, scale);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [planeId, width, height, scale]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
};

// 무기 종류별 배지 색
const WEAPON_BADGE: Record<PlaneConfig['weapon'], string> = {
  WIDE: 'bg-orange-500/20 text-orange-300 border border-orange-400/50',
  FOCUS: 'bg-blue-500/20 text-blue-300 border border-blue-400/50',
  PIERCE: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50',
  HOMING: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50',
  SERAPH: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/50',
  LASER: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/50',
};

// 작은 능력치 막대
const StatBar: React.FC<{ label: string; value: number; max: number; color: string }> = ({ label, value, max, color }) => (
  <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
    <span className="w-8 shrink-0">{label}</span>
    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }} />
    </div>
  </div>
);

export const PlaneSelectModal: React.FC<PlaneSelectModalProps> = ({ mode = '1P', onSelect, onBack }) => {
  const planeList = Object.values(PLANES);
  const [selectedP1Index, setSelectedP1Index] = useState(0);
  const [selectedP2Index, setSelectedP2Index] = useState(1);
  const [activePilotTarget, setActivePilotTarget] = useState<1 | 2>(1);
  const [viewMode, setViewMode] = useState<'GRID' | 'INSPECT'>('GRID');

  const selectedIndex = activePilotTarget === 1 ? selectedP1Index : selectedP2Index;
  const currentPlane = planeList[selectedIndex];
  const p1Plane = planeList[selectedP1Index];
  const p2Plane = planeList[selectedP2Index];

  const handleSelectIndex = (idx: number) => {
    retroAudio.playShoot(1);
    if (activePilotTarget === 1) {
      setSelectedP1Index(idx);
      if (mode === '2P' && activePilotTarget === 1) {
        // Auto-focus 2P selection after picking 1P or let user toggle freely
      }
    } else {
      setSelectedP2Index(idx);
    }
  };

  const handlePrev = () => {
    retroAudio.playShoot(1);
    const newIdx = (selectedIndex - 1 + planeList.length) % planeList.length;
    if (activePilotTarget === 1) setSelectedP1Index(newIdx);
    else setSelectedP2Index(newIdx);
  };

  const handleNext = () => {
    retroAudio.playShoot(1);
    const newIdx = (selectedIndex + 1) % planeList.length;
    if (activePilotTarget === 1) setSelectedP1Index(newIdx);
    else setSelectedP2Index(newIdx);
  };

  const handleConfirm = () => {
    retroAudio.playPowerUp();
    if (mode === '2P') {
      onSelect(p1Plane.id, p2Plane.id);
    } else {
      onSelect(p1Plane.id);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-3 sm:p-5 bg-[#020617]/95 backdrop-blur-md select-none font-mono text-slate-200 overflow-y-auto">
      {/* Top Header Navigation */}
      <div className="w-full max-w-2xl flex justify-between items-center border-b border-slate-800 pb-2">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white text-xs flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded bg-slate-900/60 border border-slate-800"
        >
          <ChevronLeft className="w-4 h-4 text-amber-400" />
          <span className="hidden sm:inline">돌아가기</span>
          <span className="sm:hidden">BACK</span>
        </button>

        <div className="text-center">
          <div className="font-bold text-xs sm:text-sm text-amber-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Plane className="w-4 h-4 text-amber-400" />
            {mode === '2P' ? '2인용 합동 기체 편성 (2-PLAYER HANGAR)' : '전투기 격납고 (AIRCRAFT SELECTION)'}
          </div>
          <div className="text-[11px] text-slate-400">
            {mode === '2P'
              ? '1P와 2P의 출격 기체를 각각 선택하십시오 (총 6종목)'
              : '원하는 전투기 이미지를 확인하고 출격하십시오 (6기종 선택)'}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 bg-slate-900/90 border border-slate-800 p-0.5 rounded">
          <button
            onClick={() => setViewMode('GRID')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              viewMode === 'GRID' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="격납고 전체 보기 (Grid View)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('INSPECT')}
            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
              viewMode === 'INSPECT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="기체 상세 정보 (Inspect View)"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2P Pilot Target Selector Bar */}
      {mode === '2P' && (
        <div className="w-full max-w-2xl grid grid-cols-2 gap-2 mt-2">
          <button
            onClick={() => {
              retroAudio.playShoot(1);
              setActivePilotTarget(1);
            }}
            className={`p-2 rounded border flex items-center justify-between transition-all cursor-pointer ${
              activePilotTarget === 1
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-1.5 py-0.5 rounded">1P</span>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{p1Plane.koreanName}</div>
                <div className="text-[11px] text-slate-400">{p1Plane.name}</div>
              </div>
            </div>
            {activePilotTarget === 1 && <span className="text-[11px] text-amber-400 font-bold animate-pulse">선택 중 ◀</span>}
          </button>

          <button
            onClick={() => {
              retroAudio.playShoot(1);
              setActivePilotTarget(2);
            }}
            className={`p-2 rounded border flex items-center justify-between transition-all cursor-pointer ${
              activePilotTarget === 2
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500 text-slate-950 font-black text-[11px] px-1.5 py-0.5 rounded">2P</span>
              <div className="text-left">
                <div className="text-xs font-bold text-white">{p2Plane.koreanName}</div>
                <div className="text-[11px] text-slate-400">{p2Plane.name}</div>
              </div>
            </div>
            {activePilotTarget === 2 && <span className="text-[11px] text-cyan-400 font-bold animate-pulse">선택 중 ◀</span>}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-2xl my-auto py-2 flex flex-col items-center">
        {viewMode === 'GRID' ? (
          /* 6-Aircraft Interactive Grid View with Visual Real Photos */
          <div className="w-full flex flex-col items-center gap-2.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full">
              {planeList.map((plane, idx) => {
                const isP1 = idx === selectedP1Index;
                const isP2 = mode === '2P' && idx === selectedP2Index;
                const isCurrentActiveTarget = idx === selectedIndex;
                const planeImg = PLAYER_PLANE_IMAGES[plane.id];

                return (
                  <motion.div
                    key={plane.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectIndex(idx)}
                    data-plane-card={plane.id}
                    className={`relative rounded-lg p-2.5 flex flex-col items-center cursor-pointer transition-all border ${
                      isCurrentActiveTarget
                        ? activePilotTarget === 2
                          ? 'bg-slate-900 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                          : 'bg-slate-900 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : isP1 || isP2
                        ? 'bg-slate-900/90 border-slate-700 text-slate-200'
                        : 'bg-slate-950/70 hover:bg-slate-900/60 border-slate-800/90 text-slate-300'
                    }`}
                  >
                    {/* 무기 종류 배지 */}
                    <div className="w-full flex justify-between items-center mb-1">
                      <span className="text-xs">{plane.flag}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${WEAPON_BADGE[plane.weapon]}`}>
                        {plane.koreanType}
                      </span>
                    </div>

                    {/* Aircraft High-Res Image Display Container */}
                    <div className="w-full h-28 bg-[#020617] border border-slate-800 rounded flex items-center justify-center relative overflow-hidden mb-2 shadow-inner group">
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{
                          background: `radial-gradient(circle at center, ${plane.color}, transparent 70%)`,
                        }}
                      />
                      {planeImg ? (
                        <img
                          src={planeImg}
                          alt={plane.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-1 transform group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <PlaneCanvasPreview planeId={plane.id} width={96} height={72} scale={1.35} />
                      )}
                    </div>

                    {/* Plane Korean Name */}
                    <div className="text-center w-full">
                      <div className="font-bold text-[13px] text-white truncate">
                        {plane.koreanName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {plane.specialMove}
                      </div>
                    </div>

                    {/* Bomb Badge */}
                    <div className="mt-1.5 w-full text-center py-0.5 px-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-amber-300 font-semibold truncate flex items-center justify-center gap-1">
                      <Flame className="w-2.5 h-2.5 text-red-400 shrink-0" />
                      <span>폭탄 : {plane.koreanBombName}</span>
                    </div>

                    {/* 1P / 2P Selection Badges */}
                    <div className="absolute -top-1.5 right-1 flex gap-1">
                      {isP1 && (
                        <div className="bg-amber-400 text-slate-950 px-1 py-0.5 rounded text-[11px] font-black shadow-md flex items-center gap-0.5">
                          <span>1P</span>
                        </div>
                      )}
                      {isP2 && (
                        <div className="bg-cyan-400 text-slate-950 px-1 py-0.5 rounded text-[11px] font-black shadow-md flex items-center gap-0.5">
                          <span>2P</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Plane Quick Summary Bar */}
            <div className="w-full bg-[#0f172a] border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row gap-3 shadow-md">
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className="w-14 h-14 bg-slate-950 border border-slate-700 rounded flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={PLAYER_PLANE_IMAGES[currentPlane.id]}
                    alt={currentPlane.koreanName}
                    className="w-full h-full object-contain p-0.5"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-amber-400">{currentPlane.koreanName}</span>
                    <span className={`text-[11px] font-bold px-1.5 rounded ${WEAPON_BADGE[currentPlane.weapon]}`}>
                      {currentPlane.koreanType}
                    </span>
                    {mode === '2P' && (
                      <span className={`text-[11px] font-bold px-1 rounded ${activePilotTarget === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {activePilotTarget}P 기체로 지정
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-emerald-300 mt-1 leading-snug">👍 {currentPlane.strength}</div>
                  <div className="text-[12px] text-rose-300 leading-snug">⚠️ {currentPlane.weakness}</div>
                </div>
              </div>

              <div className="sm:w-40 shrink-0 flex flex-col justify-center gap-1">
                <StatBar label="화력" value={currentPlane.power} max={5} color="#fbbf24" />
                <StatBar label="속도" value={currentPlane.speed} max={6.5} color="#38bdf8" />
                <StatBar label="연사" value={currentPlane.fireRate} max={9.5} color="#34d399" />
                <StatBar label="폭탄" value={currentPlane.bombPower} max={175} color="#f87171" />
              </div>
            </div>
          </div>
        ) : (
          /* Inspect / Detailed Showcase Mode */
          <div className="relative w-full flex items-center justify-between">
            <button
              onClick={handlePrev}
              className="p-2 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Showcase Card */}
            <motion.div
              key={currentPlane.id}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-1 mx-2 sm:mx-3 bg-[#0f172a] border border-slate-800 rounded-lg p-4 flex flex-col items-center shadow-[0_0_30px_rgba(0,0,0,0.8)]"
            >
              {/* Type Badge & Flag */}
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>{currentPlane.flag}</span>
                  <span className="uppercase tracking-widest">{currentPlane.country}</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${WEAPON_BADGE[currentPlane.weapon]}`}>
                  {currentPlane.koreanType}
                </span>
              </div>

              {/* Plane Title */}
              <h2 className="text-base sm:text-lg font-bold text-white text-center tracking-wide mb-0.5">
                {currentPlane.koreanName} <span className="text-xs text-slate-400">({currentPlane.name})</span>
              </h2>
              <div className="text-xs text-amber-400 mb-2 font-semibold">
                CALLSIGN: "{currentPlane.codename}"
              </div>

              {/* Large High-Res Aircraft Image Display */}
              <div className="w-full max-w-[240px] h-36 bg-[#020617] border border-slate-700/80 rounded flex items-center justify-center relative overflow-hidden mb-3 shadow-inner">
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    background: `radial-gradient(circle at center, ${currentPlane.color}, transparent 70%)`,
                  }}
                />
                {PLAYER_PLANE_IMAGES[currentPlane.id] ? (
                  <img
                    src={PLAYER_PLANE_IMAGES[currentPlane.id]}
                    alt={currentPlane.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <PlaneCanvasPreview planeId={currentPlane.id} width={180} height={105} scale={1.8} />
                )}
              </div>

              {/* Stats Bars */}
              <div className="w-full space-y-1.5 mb-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5 text-[11px]">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> 화력 (FIREPOWER)</span>
                    <span className="text-amber-400 font-bold">LVL {currentPlane.power} / 5</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${(currentPlane.power / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5 text-[11px]">
                    <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-sky-400" /> 기동속도 (TOP SPEED)</span>
                    <span className="text-sky-400 font-bold">{currentPlane.speed} M/S</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-300"
                      style={{ width: `${(currentPlane.speed / 6.5) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5 text-[11px]">
                    <span className="flex items-center gap-1"><Crosshair className="w-3 h-3 text-emerald-400" /> 연사속도 (FIRE RATE)</span>
                    <span className="text-emerald-400 font-bold">{currentPlane.fireRate} ROUNDS/S</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                      style={{ width: `${(currentPlane.fireRate / 9.5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bomb & Special Move Info */}
              <div className="w-full bg-[#020617] rounded p-2.5 border border-slate-800 text-left space-y-1">
                <div className="text-[11px] text-red-400 font-bold flex items-center gap-1 uppercase">
                  <Sparkles className="w-3 h-3 text-red-400" /> 특수 폭탄 : {currentPlane.koreanBombName} ({currentPlane.bombName})
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">
                  {currentPlane.bombDesc}
                </div>
                <div className="text-[11px] text-amber-400 pt-1">
                  기체 특화 무장: <span className="text-slate-200">{currentPlane.specialMove}</span>
                </div>
                <div className="text-[12px] text-emerald-300 pt-1">👍 {currentPlane.strength}</div>
                <div className="text-[12px] text-rose-300">⚠️ {currentPlane.weakness}</div>
              </div>
            </motion.div>

            <button
              onClick={handleNext}
              className="p-2 rounded bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Scramble & Launch Action */}
      <div className="w-full max-w-2xl flex gap-2 pt-1 border-t border-slate-800/80">
        <button
          id="confirm-plane-btn"
          onClick={handleConfirm}
          className={`w-full py-3 px-6 rounded-lg font-black text-xs sm:text-sm active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider ${
            mode === '2P'
              ? 'bg-gradient-to-r from-amber-500 via-cyan-400 to-amber-500 hover:brightness-110 text-slate-950 shadow-[0_0_25px_rgba(6,182,212,0.5)]'
              : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]'
          }`}
        >
          <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
          {mode === '2P' ? (
            <span>2인 합동 즉시 출격 (1P: {p1Plane.koreanName} / 2P: {p2Plane.koreanName})</span>
          ) : (
            <span>선택 기체로 즉시 출격 ({currentPlane.koreanName})</span>
          )}
        </button>
      </div>
    </div>
  );
};

