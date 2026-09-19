import React from 'react';

interface RetroStageIconProps {
  stage: 1 | 2 | 3 | 4 | 5 | 'special' | string;
  className?: string;
  size?: number;
}

/**
 * 16-bit Retro Stage Icons matching tajapangpang_stage_icons (1).png:
 * - Stage 1: 16-bit Keyboard with pointing finger cursor
 * - Stage 2: Explosive Word Bomb with flying letters (A, B, C, D)
 * - Stage 3: Speed Runner Sneaker with flame fire
 * - Stage 4: Ancient Rolled Parchment Scroll with glowing feather quill
 * - Special: Earth globe wearing a royal golden crown
 * - Stage 5: Radiant Golden Champion Trophy with sparkle stars
 */
export const RetroStageIcon: React.FC<RetroStageIconProps> = ({
  stage,
  className = '',
  size = 48,
}) => {
  const normalized = String(stage).toLowerCase();

  // STAGE 1: Keycap & Pointing Finger Cursor
  if (normalized === '1' || normalized === 'key-practice') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
      >
        {/* Keyboard Base Shadow */}
        <rect x="8" y="14" width="48" height="36" rx="6" fill="#1E293B" stroke="#000" strokeWidth="2.5" />
        <rect x="10" y="16" width="44" height="30" rx="4" fill="#334155" />
        {/* Keycap 1 */}
        <rect x="14" y="20" width="10" height="9" rx="2" fill="#E2E8F0" stroke="#000" strokeWidth="1.5" />
        <rect x="14" y="20" width="10" height="3" fill="#F8FAFC" />
        {/* Keycap 2 (Active Cyan Highlight) */}
        <rect x="27" y="19" width="10" height="10" rx="2" fill="#00D2FF" stroke="#000" strokeWidth="2" />
        <rect x="28" y="20" width="8" height="3" fill="#E0F2FE" />
        {/* Keycap 3 */}
        <rect x="40" y="20" width="10" height="9" rx="2" fill="#E2E8F0" stroke="#000" strokeWidth="1.5" />
        {/* Spacebar */}
        <rect x="18" y="33" width="28" height="8" rx="2" fill="#CBD5E1" stroke="#000" strokeWidth="1.5" />
        {/* Pointing Hand Cursor */}
        <g transform="translate(24, 26)">
          <path
            d="M8 2V12L12 10L15 17L19 15L16 8L21 8L8 2Z"
            fill="#FFD700"
            stroke="#000"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M9 4L9 11L12 9.5L14.5 15L16.5 14L14 7.5L18 7.5L9 4Z" fill="#FFFBEB" />
        </g>
        {/* Sparkle */}
        <polygon points="50,10 52,14 56,16 52,18 50,22 48,18 44,16 48,14" fill="#00D2FF" stroke="#000" strokeWidth="1" />
      </svg>
    );
  }

  // STAGE 2: Word Bomb with flying letters (A, B, C, D)
  if (normalized === '2' || normalized === 'word-practice') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
      >
        {/* Bomb Sphere */}
        <circle cx="30" cy="38" r="18" fill="#1E1B4B" stroke="#000" strokeWidth="2.5" />
        <ellipse cx="24" cy="30" rx="5" ry="3" fill="#4338CA" />
        <circle cx="22" cy="27" r="1.5" fill="#FFFFFF" />
        {/* Bomb Cap */}
        <rect x="26" y="16" width="8" height="5" rx="1.5" fill="#64748B" stroke="#000" strokeWidth="2" />
        {/* Burning Fuse */}
        <path d="M30 16 Q 34 8 42 10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Spark Star on Fuse */}
        <polygon points="44,8 47,4 49,9 54,10 49,12 48,17 45,13 40,13" fill="#EF4444" stroke="#000" strokeWidth="1" />
        <polygon points="45,9 47,6 48,9 51,10 48,11 47,14 46,12 43,11" fill="#FEF08A" />
        {/* Flying Pixel Letter Tiles */}
        {/* Tile 'A' */}
        <g transform="translate(42, 28) rotate(12)">
          <rect width="13" height="13" rx="2.5" fill="#EF4444" stroke="#000" strokeWidth="1.5" />
          <text x="6.5" y="10" fill="#FFF" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">A</text>
        </g>
        {/* Tile 'B' */}
        <g transform="translate(40, 44) rotate(-10)">
          <rect width="12" height="12" rx="2.5" fill="#3B82F6" stroke="#000" strokeWidth="1.5" />
          <text x="6" y="9.5" fill="#FFF" fontSize="7.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">B</text>
        </g>
        {/* Tile 'C' */}
        <g transform="translate(6, 20) rotate(-15)">
          <rect width="11" height="11" rx="2" fill="#10B981" stroke="#000" strokeWidth="1.5" />
          <text x="5.5" y="8.5" fill="#FFF" fontSize="7" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">C</text>
        </g>
      </svg>
    );
  }

  // STAGE 3: Sneaker with Flame Fire
  if (normalized === '3' || normalized === 'sentence-practice') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
      >
        {/* Jet Flame Behind Heel */}
        <path
          d="M10 42 C 4 36, 6 24, 16 30 C 14 20, 24 16, 28 26 C 26 22, 32 20, 36 28 L 26 44 Z"
          fill="#EF4444"
          stroke="#000"
          strokeWidth="2"
        />
        <path
          d="M14 40 C 10 35, 12 28, 18 32 C 16 26, 23 23, 26 29 L 24 42 Z"
          fill="#F59E0B"
        />
        <path
          d="M18 38 C 16 34, 18 30, 21 32 C 20 28, 23 27, 24 31 L 22 40 Z"
          fill="#FEF08A"
        />
        {/* Retro Running Sneaker */}
        {/* Sneaker Body */}
        <path
          d="M20 38 L 26 26 L 36 26 L 40 32 L 54 36 C 58 38, 58 44, 52 46 L 18 46 C 14 46, 14 40, 20 38 Z"
          fill="#38B6FF"
          stroke="#000"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Sneaker Accent Stripes */}
        <path d="M30 28 L 38 42" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M35 28 L 43 42" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        {/* Sneaker Sole */}
        <rect x="16" y="44" width="40" height="6" rx="2" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
        <line x1="24" y1="44" x2="24" y2="50" stroke="#000" strokeWidth="1.5" />
        <line x1="36" y1="44" x2="36" y2="50" stroke="#000" strokeWidth="1.5" />
        <line x1="48" y1="44" x2="48" y2="50" stroke="#000" strokeWidth="1.5" />
      </svg>
    );
  }

  // STAGE 4: Ancient Rolled Parchment Scroll with Feather Quill
  if (normalized === '4' || normalized === 'long-practice') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
      >
        {/* Parchment Scroll Roll */}
        {/* Left Spindle Tip */}
        <circle cx="10" cy="22" r="3" fill="#D97706" stroke="#000" strokeWidth="1.5" />
        <circle cx="10" cy="46" r="3" fill="#D97706" stroke="#000" strokeWidth="1.5" />
        {/* Main Scroll Sheet (#F5F5DC Beige) */}
        <path
          d="M12 20 C 18 16, 26 22, 34 18 C 42 14, 48 18, 50 20 L 46 48 C 40 44, 34 50, 24 46 C 18 42, 14 46, 10 46 L 12 20 Z"
          fill="#F5F5DC"
          stroke="#5C3A21"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Scroll Lines (Text) */}
        <line x1="18" y1="28" x2="36" y2="28" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="34" x2="34" y2="34" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
        <line x1="18" y1="40" x2="28" y2="40" stroke="#8B5A2B" strokeWidth="2" strokeLinecap="round" />
        {/* Golden Quill Pen */}
        <g transform="translate(32, 8) rotate(22)">
          {/* Feather Blade */}
          <path
            d="M4 2 C 16 6, 18 20, 8 36 L 4 44 L 3 34 C -2 24, 0 8, 4 2 Z"
            fill="#F59E0B"
            stroke="#000"
            strokeWidth="2"
          />
          <path d="M4 2 L 4 44" stroke="#FFFBEB" strokeWidth="1.5" />
          {/* Quill Metal Nib */}
          <polygon points="3,44 5,44 4,50" fill="#E2E8F0" stroke="#000" strokeWidth="1" />
        </g>
        {/* Magical Sparkles */}
        <polygon points="52,14 54,18 58,20 54,22 52,26 50,22 46,20 50,18" fill="#FFD700" stroke="#000" strokeWidth="1" />
      </svg>
    );
  }

  // SPECIAL STAGE: Earth with King's Golden Crown
  if (normalized === 'special' || normalized === 'knowledge') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
      >
        {/* Earth Sphere */}
        <circle cx="32" cy="38" r="18" fill="#38BDF8" stroke="#000" strokeWidth="2.5" />
        {/* Continents (Green) */}
        <path
          d="M22 30 C 26 28, 30 32, 34 28 C 38 26, 42 30, 44 34 C 46 38, 40 42, 36 44 C 32 46, 26 44, 22 40 C 20 36, 18 34, 22 30 Z"
          fill="#22C55E"
          stroke="#000"
          strokeWidth="1"
        />
        <path d="M26 48 C 30 50, 36 50, 40 48 C 38 52, 30 52, 26 48 Z" fill="#22C55E" />
        {/* Royal Golden Crown */}
        <g transform="translate(18, 10)">
          <path
            d="M2 18 L 6 6 L 14 12 L 22 6 L 26 18 Z"
            fill="#FFD700"
            stroke="#000"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Crown Base */}
          <rect x="2" y="16" width="24" height="4" rx="1" fill="#F59E0B" stroke="#000" strokeWidth="1.5" />
          {/* Jewels */}
          <circle cx="6" cy="6" r="2" fill="#EF4444" stroke="#000" strokeWidth="1" />
          <circle cx="14" cy="12" r="2" fill="#3B82F6" stroke="#000" strokeWidth="1" />
          <circle cx="22" cy="6" r="2" fill="#10B981" stroke="#000" strokeWidth="1" />
        </g>
        {/* Orbit Ring */}
        <ellipse cx="32" cy="38" rx="24" ry="8" stroke="#FFD700" strokeWidth="2" strokeDasharray="3 3" fill="none" transform="rotate(-15 32 38)" />
      </svg>
    );
  }

  // STAGE 5: Radiant Golden Trophy with Sparkles
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] ${className}`}
    >
      {/* Trophy Pedestal Base */}
      <rect x="20" y="50" width="24" height="6" rx="2" fill="#3E2419" stroke="#000" strokeWidth="2" />
      <rect x="24" y="44" width="16" height="6" fill="#784E3D" stroke="#000" strokeWidth="1.5" />
      {/* Trophy Cup */}
      <path
        d="M20 18 L 44 18 C 44 32, 38 40, 32 44 C 26 40, 20 32, 20 18 Z"
        fill="#FFD700"
        stroke="#000"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Cup Highlight */}
      <path d="M24 22 L 26 34 C 28 38, 30 40, 32 41" stroke="#FFFBEB" strokeWidth="2.5" strokeLinecap="round" />
      {/* Left Handle */}
      <path
        d="M20 22 C 12 22, 10 32, 22 34"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M20 22 C 12 22, 10 32, 22 34"
        fill="none"
        stroke="#000"
        strokeWidth="2"
      />
      {/* Right Handle */}
      <path
        d="M44 22 C 52 22, 54 32, 42 34"
        fill="none"
        stroke="#F59E0B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M44 22 C 52 22, 54 32, 42 34"
        fill="none"
        stroke="#000"
        strokeWidth="2"
      />
      {/* Star Emblem on Cup */}
      <polygon
        points="32,24 34,29 39,29 35,32 37,37 32,34 27,37 29,32 25,29 30,29"
        fill="#FFF"
        stroke="#B45309"
        strokeWidth="1"
      />
      {/* Sparkles */}
      <polygon points="12,12 14,16 18,18 14,20 12,24 10,20 6,18 10,16" fill="#FFD700" stroke="#000" strokeWidth="1" />
      <polygon points="50,14 52,17 55,18 52,19 50,22 48,19 45,18 48,17" fill="#FFD700" stroke="#000" strokeWidth="1" />
    </svg>
  );
};
