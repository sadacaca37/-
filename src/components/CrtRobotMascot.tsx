import React from 'react';

interface CrtRobotMascotProps {
  mode?: string;
  customTip?: string;
  className?: string;
  showSpeechBubble?: boolean;
}

export const CrtRobotMascot: React.FC<CrtRobotMascotProps> = ({
  className = '',
  customTip = '[팁퐁] 정확도 95% 이상이면 보너스 포인트 획득!',
  showSpeechBubble = true,
}) => {
  return (
    <div 
      className={`flex items-end gap-2 select-none pointer-events-auto ${className}`}
      title="타자팡팡 CRT 로봇 팁퐁이"
    >
      {/* Authentic Pixel CRT Monitor-Head Robot Typing on Mini Keyboard */}
      <div className="relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-200 hover:scale-105">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)]">
          {/* Antennas with gold sphere tips */}
          <line x1="32" y1="20" x2="22" y2="8" stroke="#5A6578" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="21" cy="7" r="4" fill="#FFD700" stroke="#8C6219" strokeWidth="1.5" />
          
          <line x1="68" y1="20" x2="78" y2="8" stroke="#5A6578" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="79" cy="7" r="4" fill="#FFD700" stroke="#8C6219" strokeWidth="1.5" />

          {/* Cute Cap on Monitor */}
          <path d="M30 19 Q 50 10 70 19" fill="#D97706" stroke="#451A03" strokeWidth="2" />
          <ellipse cx="65" cy="18" rx="14" ry="4" fill="#B45309" />

          {/* Robot Body / Torso */}
          <rect x="36" y="66" width="28" height="22" rx="4" fill="#4B5563" stroke="#111827" strokeWidth="2.5" />
          
          {/* Arms typing down on mini keyboard */}
          <path d="M36 72 Q 26 78 28 88" fill="none" stroke="#6B7280" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="28" cy="88" r="3.5" fill="#9CA3AF" stroke="#111827" strokeWidth="1.5" />
          
          <path d="M64 72 Q 74 78 72 88" fill="none" stroke="#6B7280" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="72" cy="88" r="3.5" fill="#9CA3AF" stroke="#111827" strokeWidth="1.5" />

          {/* Mini Keyboard under hands */}
          <rect x="22" y="86" width="56" height="12" rx="2.5" fill="#1F2937" stroke="#000000" strokeWidth="2" />
          {/* Mini Keys row 1 */}
          <rect x="25" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="31" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="37" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="43" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="49" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="55" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="61" y="88" width="4" height="3" rx="0.5" fill="#00D2FF" />
          <rect x="67" y="88" width="8" height="3" rx="0.5" fill="#FFD700" />
          {/* Mini Keys row 2 spacebar */}
          <rect x="34" y="93" width="28" height="3" rx="0.5" fill="#38BDF8" />

          {/* CRT Monitor Head Casing */}
          <rect x="16" y="20" width="68" height="48" rx="8" fill="#374151" stroke="#0F172A" strokeWidth="3" />
          <rect x="18" y="22" width="64" height="44" rx="6" fill="#4B5563" />
          
          {/* Monitor Screen Bezel */}
          <rect x="23" y="26" width="54" height="36" rx="5" fill="#111827" />
          
          {/* CRT Blue Screen Display with Soft Glow */}
          <rect x="25" y="28" width="50" height="32" rx="4" fill="#0F766E" />
          <rect x="27" y="30" width="46" height="28" rx="3" fill="#0284C7" />

          {/* Glowing Cyan/Yellow Smiling Eyes */}
          {/* Left Eye */}
          <path d="M33 42 Q 38 36 43 42" fill="none" stroke="#67E8F9" strokeWidth="3" strokeLinecap="round" />
          {/* Right Eye */}
          <path d="M57 42 Q 62 36 67 42" fill="none" stroke="#67E8F9" strokeWidth="3" strokeLinecap="round" />
          
          {/* Happy Smile Mouth */}
          <path d="M44 49 Q 50 54 56 49" fill="none" stroke="#67E8F9" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cheek Blushes */}
          <circle cx="32" cy="48" r="2.5" fill="#F43F5E" opacity="0.8" />
          <circle cx="68" cy="48" r="2.5" fill="#F43F5E" opacity="0.8" />

          {/* Tiny Power LED */}
          <circle cx="71" cy="62" r="1.5" fill="#34D399" />
        </svg>
      </div>

      {/* Speech Bubble per User Redesign Image 2 */}
      {showSpeechBubble && (
        <div className="relative bg-white text-slate-900 px-2.5 py-1 rounded-xl border-2 border-black text-[10px] sm:text-[11px] font-pixel shadow-[2px_2px_0_#000] whitespace-nowrap mb-2 animate-in fade-in duration-200">
          {customTip}
          {/* Bubble Pointer Tail to Robot */}
          <div className="absolute -left-1.5 bottom-2 w-2 h-2 bg-white border-l-2 border-b-2 border-black rotate-45" />
        </div>
      )}
    </div>
  );
};
