import React from 'react';
import { X } from 'lucide-react';

interface ParchmentModalContainerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-lg', 'max-w-3xl', 'max-w-5xl'
  maxHeight?: string;
  actions?: React.ReactNode;
}

/**
 * 16-Bit Retro Parchment Scroll Modal Container (#F5F5DC)
 * Styled with authentic wooden spindles, golden finial knobs, and vintage parchment paper
 * Inspired by tajapangpang_inventory_mockup.png
 */
export const ParchmentModalContainer: React.FC<ParchmentModalContainerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  icon,
  children,
  maxWidth = 'max-w-2xl',
  maxHeight = 'max-h-[92vh]',
  actions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#0F1026]/80 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      {/* Outer Scroll Frame with Spindles */}
      <div className={`relative w-full ${maxWidth} flex flex-col my-4 select-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.85)] animate-in zoom-in-95 duration-200`}>
        
        {/* ========================================================================= */}
        {/* 1. TOP WOODEN SCROLL SPINDLE WITH GOLDEN FINIAL KNOBS                    */}
        {/* ========================================================================= */}
        <div className="relative z-20 flex items-center justify-between -mb-1 px-1">
          {/* Left Golden Finial Knob */}
          <div className="flex items-center -ml-3">
            <div className="w-5 h-7 rounded-l-md bg-gradient-to-r from-[#D97706] to-[#F59E0B] border-2 border-[#451A03] shadow-[inset_0_1px_0_#FEF3C7,0_2px_4px_rgba(0,0,0,0.5)]" />
            <div className="w-3 h-5 bg-[#78350F] border-y-2 border-[#451A03]" />
          </div>

          {/* Wooden Roller Rod */}
          <div className="flex-1 h-5 mx-1 rounded-sm bg-gradient-to-b from-[#A86B3E] via-[#784E3D] to-[#4A2E1B] border-2 border-[#3E2419] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
            <div className="w-24 h-0.5 bg-[#FDE68A]/30 rounded-full" />
          </div>

          {/* Right Golden Finial Knob */}
          <div className="flex items-center -mr-3">
            <div className="w-3 h-5 bg-[#78350F] border-y-2 border-[#451A03]" />
            <div className="w-5 h-7 rounded-r-md bg-gradient-to-l from-[#D97706] to-[#F59E0B] border-2 border-[#451A03] shadow-[inset_0_1px_0_#FEF3C7,0_2px_4px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

        {/* Rolled Top Parchment Fold */}
        <div className="h-3 bg-gradient-to-b from-[#E2D4B7] to-[#F5F5DC] border-x-4 border-t-2 border-[#5C3A21] mx-2 rounded-t-lg shadow-inner z-10" />

        {/* ========================================================================= */}
        {/* 2. MAIN PARCHMENT BODY CANVAS (#F5F5DC)                                   */}
        {/* ========================================================================= */}
        <div className={`retro-parchment-modal mx-2 px-4 sm:px-7 py-5 flex flex-col ${maxHeight} overflow-hidden`}>
          {/* Corner Screws / Rivets */}
          <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#8B5A2B] border border-[#3E2419]" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#8B5A2B] border border-[#3E2419]" />
          <span className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#8B5A2B] border border-[#3E2419]" />
          <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#8B5A2B] border border-[#3E2419]" />

          {/* Header Row: Title, Badge, and Retro Bracket Close Button */}
          <div className="flex items-start justify-between gap-3 border-b-2 border-[#784E3D]/30 pb-3.5 mb-3 shrink-0">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 rounded-xl bg-[#FFFDF8] border-2 border-[#5C3A21] shadow-[2px_2px_0_#3E2419] shrink-0">
                  {icon}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {badge && (
                    <span className="px-2 py-0.5 rounded-xs bg-[#784E3D] text-[#FFFDF5] text-[10px] font-pixel border border-[#3E2419] shadow-[1px_1px_0_#20130D]">
                      {badge}
                    </span>
                  )}
                  {title && (
                    <h2 className="text-base sm:text-xl font-black text-[#3E2419] font-arcade tracking-tight flex items-center gap-1.5">
                      {title}
                    </h2>
                  )}
                </div>
                {subtitle && (
                  <p className="text-xs text-[#6E4731] font-bold font-arcade mt-0.5 leading-tight">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Retro Bracket Close Button: [ ✕ 닫기 ] */}
            <button
              type="button"
              onClick={onClose}
              className="retro-wood-btn px-2.5 py-1 text-xs font-pixel rounded-xs flex items-center gap-1 cursor-pointer shrink-0"
              title="창 닫기 (ESC)"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">닫기</span>
            </button>
          </div>

          {/* Scrollable Modal Content */}
          <div className="flex-1 overflow-y-auto pr-1 text-[#2D1A0E] font-arcade">
            {children}
          </div>

          {/* Optional Action Bar at Bottom of Parchment */}
          {actions && (
            <div className="pt-3 border-t-2 border-[#784E3D]/25 mt-2 flex items-center justify-end gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Rolled Bottom Parchment Fold */}
        <div className="h-3 bg-gradient-to-t from-[#E2D4B7] to-[#F5F5DC] border-x-4 border-b-2 border-[#5C3A21] mx-2 rounded-b-lg shadow-inner z-10" />

        {/* ========================================================================= */}
        {/* 3. BOTTOM WOODEN SCROLL SPINDLE WITH GOLDEN FINIAL KNOBS                 */}
        {/* ========================================================================= */}
        <div className="relative z-20 flex items-center justify-between -mt-1 px-1">
          {/* Left Golden Finial Knob */}
          <div className="flex items-center -ml-3">
            <div className="w-5 h-7 rounded-l-md bg-gradient-to-r from-[#D97706] to-[#F59E0B] border-2 border-[#451A03] shadow-[inset_0_1px_0_#FEF3C7,0_2px_4px_rgba(0,0,0,0.5)]" />
            <div className="w-3 h-5 bg-[#78350F] border-y-2 border-[#451A03]" />
          </div>

          {/* Wooden Roller Rod */}
          <div className="flex-1 h-5 mx-1 rounded-sm bg-gradient-to-b from-[#A86B3E] via-[#784E3D] to-[#4A2E1B] border-2 border-[#3E2419] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.6)] flex items-center justify-center">
            <div className="w-24 h-0.5 bg-[#FDE68A]/30 rounded-full" />
          </div>

          {/* Right Golden Finial Knob */}
          <div className="flex items-center -mr-3">
            <div className="w-3 h-5 bg-[#78350F] border-y-2 border-[#451A03]" />
            <div className="w-5 h-7 rounded-r-md bg-gradient-to-l from-[#D97706] to-[#F59E0B] border-2 border-[#451A03] shadow-[inset_0_1px_0_#FEF3C7,0_2px_4px_rgba(0,0,0,0.5)]" />
          </div>
        </div>

      </div>
    </div>
  );
};
