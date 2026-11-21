import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, X, Shield, Zap, Sparkles, Crosshair, ArrowUpDown, MousePointer } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 bg-[#020617]/95 backdrop-blur-md select-none font-mono text-slate-200">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-lg p-5 flex flex-col items-center shadow-[0_0_35px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider">FLIGHT MANUAL & AVIONICS MANUAL</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Keyboard Controls */}
        <div className="w-full mb-4">
          <div className="text-[10px] text-amber-400 font-bold mb-2 uppercase tracking-wider">★ PRIMARY FLIGHT CONTROLS</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#020617] border border-slate-800">
              <div className="text-slate-400 text-[10px] mb-1 font-bold">DIRECTIONAL THRUST</div>
              <div className="text-white font-bold flex items-center gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">W A S D</span>
                <span className="text-slate-500">/</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">ARROWS</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#020617] border border-slate-800">
              <div className="text-slate-400 text-[10px] mb-1 font-bold">PRIMARY CANNONS</div>
              <div className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">SPACE</span>
                <span className="text-slate-500">/</span>
                <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Z</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#020617] border border-slate-800">
              <div className="text-slate-400 text-[10px] mb-1 font-bold">TACTICAL MEGA BOMB</div>
              <div className="text-red-400 font-bold flex items-center gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">X KEY</span>
                <span className="text-[9px] text-slate-400">(AIR CLEAR)</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-[#020617] border border-slate-800">
              <div className="text-slate-400 text-[10px] mb-1 font-bold">360° EVASION LOOP</div>
              <div className="text-sky-400 font-bold flex items-center gap-1 text-[10px]">
                <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">C KEY</span>
                <span className="text-[9px] text-slate-400">(IFRAMES)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mouse / Mobile Drag Support */}
        <div className="w-full p-2.5 bg-[#020617] rounded border border-slate-800 text-xs font-mono mb-4">
          <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5 text-[10px] uppercase">
            <MousePointer className="w-3.5 h-3.5 text-emerald-400" /> DIRECT MOUSE & TOUCH TRACKING SUPPORTED
          </div>
          <div className="text-slate-400 text-[11px] leading-relaxed">
            Direct mouse cursor steering and screen touch drag are fully active. Mobile viewports automatically enable virtual flight yokes and ordnance buttons.
          </div>
        </div>

        {/* Item Capsules */}
        <div className="w-full mb-4">
          <div className="text-[10px] text-amber-400 font-bold mb-2 uppercase tracking-wider">★ AIRDROP REPLENISHMENT TYPES</div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center gap-2 p-1.5 bg-[#020617] rounded border border-slate-800">
              <span className="w-5 h-5 flex items-center justify-center bg-red-600 text-[10px] text-white rounded font-bold">P</span>
              <span className="text-slate-300">
                <strong className="text-amber-400">Weapon Upgrade:</strong> Expands cannon spread up to Level 5 + homing missiles
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-[#020617] rounded border border-slate-800">
              <span className="w-5 h-5 flex items-center justify-center bg-blue-600 text-[10px] text-white rounded font-bold">B</span>
              <span className="text-slate-300">
                <strong className="text-sky-400">Super Bomb:</strong> Wipes all screen projectiles and grants massive blast damage
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-[#020617] rounded border border-slate-800">
              <span className="w-5 h-5 flex items-center justify-center bg-cyan-600 text-[10px] text-white rounded font-bold">O</span>
              <span className="text-slate-300">
                <strong className="text-cyan-400">Escort Drone (Option):</strong> Twin wingmen providing synchronized beam support
              </span>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-[#020617] rounded border border-slate-800">
              <span className="w-5 h-5 flex items-center justify-center bg-amber-500 text-[10px] text-slate-950 rounded font-bold">★</span>
              <span className="text-slate-300">
                <strong className="text-amber-300">Distinguished Medal:</strong> Merit multiplier scoring bonuses (+500 ~ +5000)
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
        >
          CONFIRM & RETURN
        </button>
      </motion.div>
    </div>
  );
};
