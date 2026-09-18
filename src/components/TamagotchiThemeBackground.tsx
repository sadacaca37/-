import React from 'react';
import { TamagotchiThemeType, RoomDecorState } from '../types';

interface TamagotchiThemeBackgroundProps {
  theme?: TamagotchiThemeType;
  decor?: RoomDecorState;
}

export const TamagotchiThemeBackground: React.FC<TamagotchiThemeBackgroundProps> = ({
  theme = 'warm_living',
  decor,
}) => {
  // If no custom decor is passed, provide defaults
  const activeDecor: RoomDecorState = decor || {
    wallpaper: 'warm_cream',
    flooring: 'wood_oak',
    windowView: 'sunny_sky',
    rug: 'circle_sun',
    furniture: 'cozy_sofa',
    wallDecor: 'family_photo',
    floorToy: 'play_ball',
    lighting: 'warm_pendant',
  };

  // If a preset theme is selected (e.g. cosmic_space, deep_ocean) and user hasn't modified custom decor away from default,
  // we can show the immersive theme scene or combine with decor.
  // When theme is 'warm_living' (or custom mode), we render the full custom room with all chosen furniture and decor!
  const isCustomRoom = theme === 'warm_living' || !!decor;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      <svg
        viewBox="0 0 800 500"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* ================= SHARED GRADIENTS & PATTERNS ================= */}
          {/* Wallpaper Gradients */}
          <linearGradient id="wp_warm_cream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>

          <linearGradient id="wp_pastel_pink" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDF2F8" />
            <stop offset="60%" stopColor="#FCE7F3" />
            <stop offset="100%" stopColor="#FBCFE8" />
          </linearGradient>

          <linearGradient id="wp_sky_cloud" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="60%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#F0F9FF" />
          </linearGradient>

          <linearGradient id="wp_mint_forest" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D1FAE5" />
            <stop offset="60%" stopColor="#A7F3D0" />
            <stop offset="100%" stopColor="#6EE7B7" />
          </linearGradient>

          <linearGradient id="wp_lavender_dream" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3E8FF" />
            <stop offset="60%" stopColor="#E9D5FF" />
            <stop offset="100%" stopColor="#D8B4FE" />
          </linearGradient>

          <linearGradient id="wp_night_stars" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0F19" />
            <stop offset="50%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          <linearGradient id="wp_candy_sweet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE4E6" />
            <stop offset="50%" stopColor="#FFF1F2" />
            <stop offset="100%" stopColor="#FECDD3" />
          </linearGradient>

          <linearGradient id="wp_cyber_grid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Floor Gradients */}
          <linearGradient id="fl_wood_oak" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          <linearGradient id="fl_wood_cherry" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9A3412" />
            <stop offset="100%" stopColor="#7C2D12" />
          </linearGradient>

          <linearGradient id="fl_pastel_tile" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="100%" stopColor="#CCFBF1" />
          </linearGradient>

          <linearGradient id="fl_soft_carpet" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="fl_marble_gold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#FEF08A" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          <linearGradient id="fl_tatami" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ECFCCB" />
            <stop offset="100%" stopColor="#BEF264" />
          </linearGradient>

          {/* Lighting Glow Gradients */}
          <radialGradient id="warmLightGlow" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#FDE047" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="discoGlow" cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="#F472B6" stopOpacity="0.35" />
            <stop offset="30%" stopColor="#38BDF8" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#FBBF24" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="starGlow" cx="50%" cy="15%" r="60%">
            <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#818CF8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ==================================================== */}
        {/* 1. WALLPAPER BASE & PATTERNS (0 ~ 335px) */}
        {/* ==================================================== */}
        <g id="room-wallpaper">
          <rect
            x="0"
            y="0"
            width="800"
            height="340"
            fill={`url(#wp_${activeDecor.wallpaper || 'warm_cream'})`}
          />

          {/* Wallpaper specifics */}
          {activeDecor.wallpaper === 'warm_cream' && (
            <g opacity="0.15">
              <line x1="0" y1="80" x2="800" y2="80" stroke="#B45309" strokeWidth="1" />
              <line x1="0" y1="160" x2="800" y2="160" stroke="#B45309" strokeWidth="1" />
              <line x1="0" y1="240" x2="800" y2="240" stroke="#B45309" strokeWidth="1" />
            </g>
          )}

          {activeDecor.wallpaper === 'pastel_pink' && (
            <g opacity="0.25" fill="#F472B6">
              {[60, 180, 300, 420, 540, 660, 780].map((x) => (
                <g key={x}>
                  <circle cx={x} cy="60" r="4" />
                  <circle cx={x - 60} cy="120" r="4" />
                  <circle cx={x} cy="180" r="4" />
                  <circle cx={x - 60} cy="240" r="4" />
                  <circle cx={x} cy="300" r="4" />
                </g>
              ))}
            </g>
          )}

          {activeDecor.wallpaper === 'sky_cloud' && (
            <g opacity="0.6">
              <path d="M 80,80 Q 90,65 110,65 Q 125,50 145,60 Q 165,55 170,75 Q 185,80 180,95 L 75,95 Z" fill="#FFFFFF" />
              <path d="M 580,120 Q 590,105 610,105 Q 625,90 645,100 Q 665,95 670,115 Q 685,120 680,135 L 575,135 Z" fill="#FFFFFF" />
              <path d="M 320,60 Q 330,45 350,45 Q 365,30 385,40 Q 405,35 410,55 Q 425,60 420,75 L 315,75 Z" fill="#FFFFFF" opacity="0.7" />
            </g>
          )}

          {activeDecor.wallpaper === 'mint_forest' && (
            <g opacity="0.2" fill="#047857">
              {[80, 200, 320, 440, 560, 680].map((x) => (
                <g key={x} transform={`translate(${x}, 120)`}>
                  <path d="M 0,0 Q 15,-20 0,-40 Q -15,-20 0,0" />
                  <path d="M 40,80 Q 55,60 40,40 Q 25,60 40,80" />
                </g>
              ))}
            </g>
          )}

          {activeDecor.wallpaper === 'night_stars' && (
            <g>
              <circle cx="90" cy="50" r="2.5" fill="#FEF08A" opacity="0.9" />
              <circle cx="160" cy="110" r="1.5" fill="#FFFFFF" opacity="0.8" />
              <circle cx="260" cy="40" r="2" fill="#67E8F9" opacity="0.9" />
              <circle cx="370" cy="90" r="1.5" fill="#FFFFFF" opacity="0.7" />
              <circle cx="480" cy="50" r="3" fill="#FDE047" opacity="0.95" />
              <circle cx="590" cy="120" r="2" fill="#FFFFFF" opacity="0.8" />
              <circle cx="700" cy="60" r="2.5" fill="#A78BFA" opacity="0.9" />
              <circle cx="760" cy="140" r="1.5" fill="#FFFFFF" opacity="0.7" />
              {/* Constellation lines */}
              <line x1="90" y1="50" x2="160" y2="110" stroke="#818CF8" strokeWidth="0.8" opacity="0.4" />
              <line x1="480" y1="50" x2="590" y2="120" stroke="#818CF8" strokeWidth="0.8" opacity="0.4" />
            </g>
          )}

          {activeDecor.wallpaper === 'candy_sweet' && (
            <g opacity="0.3">
              {[0, 100, 200, 300, 400, 500, 600, 700].map((x) => (
                <line key={x} x1={x} y1="0" x2={x + 100} y2="340" stroke="#FB7185" strokeWidth="24" />
              ))}
            </g>
          )}

          {activeDecor.wallpaper === 'cyber_grid' && (
            <g opacity="0.35">
              {[40, 80, 120, 160, 200, 240, 280, 320].map((y) => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#06B6D4" strokeWidth="1" />
              ))}
              {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800].map((x) => (
                <line key={x} x1={x} y1="0" x2={x} y2="340" stroke="#06B6D4" strokeWidth="1" />
              ))}
            </g>
          )}

          {/* Wall Moulding Top & Baseboard */}
          <rect x="0" y="0" width="800" height="10" fill="#78350F" opacity="0.2" />
          <rect x="0" y="332" width="800" height="8" fill="#451A03" opacity="0.8" />
        </g>

        {/* ==================================================== */}
        {/* 2. FLOORING (340 ~ 500px) */}
        {/* ==================================================== */}
        <g id="room-flooring">
          <rect
            x="0"
            y="340"
            width="800"
            height="160"
            fill={`url(#fl_${activeDecor.flooring || 'wood_oak'})`}
          />

          {/* Flooring plank lines or tile seams */}
          {(activeDecor.flooring === 'wood_oak' || activeDecor.flooring === 'wood_cherry') && (
            <g opacity="0.3" stroke="#451A03" strokeWidth="1.5">
              <line x1="0" y1="375" x2="800" y2="375" />
              <line x1="0" y1="415" x2="800" y2="415" />
              <line x1="0" y1="455" x2="800" y2="455" />
              {/* Vertical wood stagger joints */}
              <line x1="180" y1="340" x2="180" y2="375" />
              <line x1="520" y1="340" x2="520" y2="375" />
              <line x1="340" y1="375" x2="340" y2="415" />
              <line x1="680" y1="375" x2="680" y2="415" />
              <line x1="140" y1="415" x2="140" y2="455" />
              <line x1="480" y1="415" x2="480" y2="455" />
            </g>
          )}

          {activeDecor.flooring === 'pastel_tile' && (
            <g opacity="0.3" stroke="#0D9488" strokeWidth="1.5">
              {[340, 380, 420, 460].map((y) => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} />
              ))}
              {[0, 80, 160, 240, 320, 400, 480, 560, 640, 720, 800].map((x) => (
                <line key={x} x1={x} y1="340" x2={x} y2="500" />
              ))}
            </g>
          )}

          {activeDecor.flooring === 'tatami_mat' && (
            <g stroke="#3F6212" strokeWidth="3" opacity="0.5">
              <line x1="266" y1="340" x2="266" y2="500" strokeWidth="6" stroke="#4D7C0F" />
              <line x1="533" y1="340" x2="533" y2="500" strokeWidth="6" stroke="#4D7C0F" />
              <line x1="0" y1="420" x2="800" y2="420" strokeWidth="4" stroke="#4D7C0F" />
            </g>
          )}

          {activeDecor.flooring === 'marble_gold' && (
            <g opacity="0.3" stroke="#CA8A04" strokeWidth="1.5">
              <path d="M 50,350 Q 150,420 300,390 T 550,460" fill="none" />
              <path d="M 250,340 Q 400,410 600,370 T 780,480" fill="none" />
            </g>
          )}
        </g>

        {/* ==================================================== */}
        {/* 3. WINDOW VIEW (Upper Left Wall) */}
        {/* ==================================================== */}
        <g id="room-window" transform="translate(85, 45)">
          {/* Window Sill / Arch Frame */}
          <rect x="-4" y="-4" width="148" height="178" rx="74" fill="#78350F" opacity="0.7" />
          <rect x="0" y="0" width="140" height="170" rx="70" fill="#0284C7" />
          
          {/* Window Mask Area for dynamic scenery */}
          <g>
            {/* View 1: Sunny Sky */}
            {activeDecor.windowView === 'sunny_sky' && (
              <g>
                <rect x="0" y="0" width="140" height="170" fill="#7DD3FC" />
                {/* Sun */}
                <circle cx="110" cy="35" r="22" fill="#FDE047" />
                <circle cx="110" cy="35" r="28" fill="#FEF08A" opacity="0.4" />
                {/* Clouds */}
                <circle cx="35" cy="65" r="20" fill="#FFFFFF" opacity="0.95" />
                <circle cx="65" cy="60" r="26" fill="#FFFFFF" opacity="0.95" />
                <circle cx="95" cy="70" r="18" fill="#FFFFFF" opacity="0.95" />
                <rect x="25" y="65" width="80" height="20" fill="#FFFFFF" opacity="0.95" />
                {/* Green grass hill at bottom */}
                <ellipse cx="70" cy="180" rx="90" ry="35" fill="#4ADE80" />
              </g>
            )}

            {/* View 2: Night Moon */}
            {activeDecor.windowView === 'night_moon' && (
              <g>
                <rect x="0" y="0" width="140" height="170" fill="#0F172A" />
                {/* Stars */}
                <circle cx="30" cy="40" r="1.5" fill="#FEF08A" />
                <circle cx="50" cy="80" r="1" fill="#FFFFFF" />
                <circle cx="100" cy="110" r="1.5" fill="#FFFFFF" />
                <circle cx="120" cy="60" r="2" fill="#FEF08A" />
                {/* Glowing Crescent Moon */}
                <circle cx="45" cy="45" r="20" fill="#FDE047" />
                <circle cx="53" cy="41" r="17" fill="#0F172A" />
              </g>
            )}

            {/* View 3: Sakura Spring */}
            {activeDecor.windowView === 'sakura_spring' && (
              <g>
                <rect x="0" y="0" width="140" height="170" fill="#FCE7F3" />
                {/* Distant Mountain */}
                <polygon points="70,70 10,170 130,170" fill="#CBD5E1" />
                <polygon points="70,70 50,105 90,105" fill="#FFFFFF" />
                {/* Sakura Branch & Blossom Petals */}
                <path d="M 0,30 Q 50,45 80,20" stroke="#78350F" strokeWidth="4" fill="none" />
                <circle cx="35" cy="35" r="8" fill="#F472B6" />
                <circle cx="65" cy="30" r="9" fill="#FB7185" />
                <circle cx="80" cy="20" r="6" fill="#F472B6" />
                {/* Drifting Petals */}
                <ellipse cx="45" cy="80" rx="4" ry="7" transform="rotate(30 45 80)" fill="#F472B6" />
                <ellipse cx="95" cy="110" rx="5" ry="8" transform="rotate(-40 95 110)" fill="#FB7185" />
                <ellipse cx="70" cy="140" rx="4" ry="6" transform="rotate(15 70 140)" fill="#F472B6" />
              </g>
            )}

            {/* View 4: Snowy Winter */}
            {activeDecor.windowView === 'snowy_winter' && (
              <g>
                <rect x="0" y="0" width="140" height="170" fill="#BAE6FD" />
                {/* Snowy Hill */}
                <ellipse cx="70" cy="170" rx="85" ry="40" fill="#FFFFFF" />
                {/* Pine Tree */}
                <polygon points="40,110 25,140 55,140" fill="#047857" />
                <polygon points="40,95 30,120 50,120" fill="#059669" />
                {/* Snowflakes */}
                <text x="80" y="50" fontSize="16">❄️</text>
                <text x="110" y="90" fontSize="12">❄️</text>
                <text x="60" y="80" fontSize="14">❄️</text>
                <text x="95" y="130" fontSize="10">❄️</text>
              </g>
            )}

            {/* View 5: Rainbow Forest */}
            {activeDecor.windowView === 'rainbow_forest' && (
              <g>
                <rect x="0" y="0" width="140" height="170" fill="#E0F2FE" />
                {/* Rainbow */}
                <circle cx="70" cy="130" r="58" fill="none" stroke="#EF4444" strokeWidth="4" opacity="0.8" />
                <circle cx="70" cy="130" r="54" fill="none" stroke="#F59E0B" strokeWidth="4" opacity="0.8" />
                <circle cx="70" cy="130" r="50" fill="none" stroke="#10B981" strokeWidth="4" opacity="0.8" />
                <circle cx="70" cy="130" r="46" fill="none" stroke="#3B82F6" strokeWidth="4" opacity="0.8" />
                <circle cx="70" cy="130" r="42" fill="none" stroke="#8B5CF6" strokeWidth="4" opacity="0.8" />
                {/* Trees */}
                <polygon points="25,120 10,165 40,165" fill="#15803D" />
                <polygon points="115,115 100,165 130,165" fill="#16A34A" />
              </g>
            )}

            {/* View 6: City Sunset */}
            {activeDecor.windowView === 'city_sunset' && (
              <g>
                <rect x="0" y="0" width="140" height="170" fill="url(#wp_candy_sweet)" />
                {/* Sunset Sun */}
                <circle cx="70" cy="90" r="28" fill="#F97316" opacity="0.9" />
                {/* Skyline Buildings */}
                <rect x="15" y="100" width="25" height="70" fill="#1E293B" />
                <rect x="45" y="70" width="30" height="100" fill="#0F172A" />
                <rect x="80" y="90" width="22" height="80" fill="#1E293B" />
                <rect x="105" y="110" width="25" height="60" fill="#334155" />
                {/* Tiny lit yellow windows */}
                <rect x="52" y="85" width="4" height="6" fill="#FEF08A" />
                <rect x="62" y="85" width="4" height="6" fill="#FEF08A" />
                <rect x="52" y="105" width="4" height="6" fill="#FEF08A" />
                <rect x="86" y="105" width="4" height="6" fill="#FEF08A" />
              </g>
            )}
          </g>

          {/* Window Panes Grid */}
          <line x1="70" y1="0" x2="70" y2="170" stroke="#FBBF24" strokeWidth="4" />
          <line x1="0" y1="95" x2="140" y2="95" stroke="#FBBF24" strokeWidth="4" />

          {/* Drapes / Curtains */}
          <path d="M 0,0 Q 25,85 0,170 L -6,170 L -6,0 Z" fill="#FDA4AF" opacity="0.9" />
          <path d="M 140,0 Q 115,85 140,170 L 146,170 L 146,0 Z" fill="#FDA4AF" opacity="0.9" />
          <line x1="-12" y1="-2" x2="152" y2="-2" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
        </g>

        {/* ==================================================== */}
        {/* 4. WALL DECOR (Upper Right Wall) */}
        {/* ==================================================== */}
        <g id="room-wall-decor">
          {activeDecor.wallDecor === 'family_photo' && (
            <g transform="translate(560, 50)">
              <rect x="0" y="0" width="90" height="110" rx="8" fill="#FFFFFF" stroke="#92400E" strokeWidth="6" />
              <rect x="8" y="8" width="74" height="94" rx="4" fill="#FEF3C7" />
              <text x="45" y="55" textAnchor="middle" fontSize="28">🐾</text>
              <text x="45" y="85" textAnchor="middle" fontSize="9" fontWeight="900" fill="#92400E">SWEET HOME</text>
            </g>
          )}

          {activeDecor.wallDecor === 'neon_clock' && (
            <g transform="translate(580, 55)">
              <circle cx="45" cy="45" r="42" fill="#1E1B4B" stroke="#EC4899" strokeWidth="4" filter="drop-shadow(0 0 8px #F43F5E)" />
              <circle cx="45" cy="45" r="3" fill="#F43F5E" />
              <line x1="45" y1="45" x2="45" y2="20" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
              <line x1="45" y1="45" x2="65" y2="45" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" />
              <text x="45" y="70" textAnchor="middle" fontSize="11" fill="#FEF08A" fontWeight="bold">💖 LOVE</text>
            </g>
          )}

          {activeDecor.wallDecor === 'plant_shelf' && (
            <g transform="translate(540, 90)">
              {/* Wooden Shelf */}
              <rect x="0" y="0" width="130" height="12" rx="3" fill="#B45309" stroke="#78350F" strokeWidth="2" />
              <polygon points="15,12 25,35 15,35" fill="#78350F" />
              <polygon points="115,12 105,35 115,35" fill="#78350F" />
              {/* Books */}
              <rect x="18" y="-32" width="10" height="32" fill="#EF4444" rx="2" />
              <rect x="30" y="-36" width="12" height="36" fill="#3B82F6" rx="2" />
              <rect x="44" y="-28" width="10" height="28" fill="#F59E0B" rx="2" />
              {/* Succulent Flower Pot */}
              <polygon points="80,0 75,-22 95,-22 90,0" fill="#EA580C" />
              <circle cx="85" cy="-28" r="10" fill="#22C55E" />
              <circle cx="80" cy="-24" r="6" fill="#15803D" />
              <circle cx="90" cy="-24" r="6" fill="#16A34A" />
            </g>
          )}

          {activeDecor.wallDecor === 'gold_trophy' && (
            <g transform="translate(560, 45)">
              <rect x="0" y="90" width="90" height="10" rx="3" fill="#B45309" />
              {/* Golden Trophy */}
              <polygon points="25,90 65,90 55,75 35,75" fill="#78350F" />
              <rect x="40" y="55" width="10" height="20" fill="#CA8A04" />
              <path d="M 25,20 Q 45,55 65,20 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="2" />
              <circle cx="45" cy="22" r="18" fill="#FACC15" />
              <text x="45" y="27" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#78350F">1st</text>
              <path d="M 25,25 Q 12,25 18,38 Q 24,50 32,45" fill="none" stroke="#CA8A04" strokeWidth="3" />
              <path d="M 65,25 Q 78,25 72,38 Q 66,50 58,45" fill="none" stroke="#CA8A04" strokeWidth="3" />
              {/* Red Ribbon */}
              <path d="M 38,70 L 45,85 L 52,70 Z" fill="#EF4444" />
            </g>
          )}

          {activeDecor.wallDecor === 'party_garland' && (
            <g transform="translate(0, 20)">
              <path d="M 0,10 Q 200,60 400,20 Q 600,60 800,10" fill="none" stroke="#64748B" strokeWidth="2" strokeDasharray="4 2" />
              {/* Triangle flags */}
              <polygon points="80,24 100,60 120,28" fill="#EF4444" />
              <polygon points="160,34 180,70 200,38" fill="#F59E0B" />
              <polygon points="240,36 260,72 280,34" fill="#10B981" />
              <polygon points="320,28 340,64 360,22" fill="#3B82F6" />
              <polygon points="440,24 460,60 480,28" fill="#EC4899" />
              <polygon points="520,34 540,70 560,38" fill="#8B5CF6" />
              <polygon points="600,36 620,72 640,34" fill="#F59E0B" />
              <polygon points="680,28 700,64 720,22" fill="#06B6D4" />
            </g>
          )}

          {activeDecor.wallDecor === 'led_keyboard_sign' && (
            <g transform="translate(540, 50)">
              <rect x="0" y="0" width="130" height="70" rx="10" fill="#0F172A" stroke="#06B6D4" strokeWidth="3" filter="drop-shadow(0 0 10px #06B6D4)" />
              <text x="65" y="32" textAnchor="middle" fontSize="13" fontWeight="900" fill="#38BDF8" letterSpacing="2">TYPE MASTER</text>
              <text x="65" y="55" textAnchor="middle" fontSize="18">⌨️ ⚡ 🎮</text>
            </g>
          )}
        </g>

        {/* ==================================================== */}
        {/* 5. CEILING LIGHTING */}
        {/* ==================================================== */}
        <g id="room-lighting">
          {activeDecor.lighting === 'warm_pendant' && (
            <g>
              <line x1="400" y1="0" x2="400" y2="55" stroke="#78350F" strokeWidth="3" />
              <path d="M 370,55 Q 400,35 430,55 L 435,70 L 365,70 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
              <ellipse cx="400" cy="70" rx="35" ry="8" fill="#FEF08A" />
              {/* Light glow on stage */}
              <ellipse cx="400" cy="180" rx="180" ry="120" fill="url(#warmLightGlow)" />
            </g>
          )}

          {activeDecor.lighting === 'disco_ball' && (
            <g>
              <line x1="400" y1="0" x2="400" y2="40" stroke="#94A3B8" strokeWidth="2" />
              <circle cx="400" cy="65" r="25" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="2" />
              {/* Mirror facets */}
              <rect x="382" y="48" width="8" height="8" fill="#CBD5E1" />
              <rect x="396" y="52" width="8" height="8" fill="#F8FAFC" />
              <rect x="410" y="48" width="8" height="8" fill="#CBD5E1" />
              <rect x="388" y="65" width="8" height="8" fill="#F8FAFC" />
              <rect x="404" y="65" width="8" height="8" fill="#E2E8F0" />
              {/* Party disco spotlights */}
              <ellipse cx="400" cy="220" rx="280" ry="180" fill="url(#discoGlow)" />
              <circle cx="280" cy="380" r="14" fill="#EC4899" opacity="0.4" />
              <circle cx="520" cy="390" r="16" fill="#38BDF8" opacity="0.4" />
              <circle cx="360" cy="440" r="18" fill="#FBBF24" opacity="0.4" />
            </g>
          )}

          {activeDecor.lighting === 'fairy_lights' && (
            <g transform="translate(0, 10)">
              <path d="M 0,0 Q 200,40 400,10 Q 600,40 800,0" fill="none" stroke="#475569" strokeWidth="2" />
              {[60, 140, 220, 300, 380, 460, 540, 620, 700, 780].map((x, i) => (
                <g key={x} transform={`translate(${x}, ${i % 2 === 0 ? 15 : 22})`}>
                  <circle cx="0" cy="0" r="6" fill={i % 3 === 0 ? '#FDE047' : i % 3 === 1 ? '#F472B6' : '#67E8F9'} opacity="0.95" filter="drop-shadow(0 0 6px #FDE047)" />
                </g>
              ))}
            </g>
          )}

          {activeDecor.lighting === 'star_lamp' && (
            <g transform="translate(400, 25)">
              <line x1="0" y1="-25" x2="0" y2="10" stroke="#CA8A04" strokeWidth="2" />
              {/* Crescent Moon Lamp */}
              <circle cx="0" cy="30" r="22" fill="#FDE047" filter="drop-shadow(0 0 10px #FDE047)" />
              <circle cx="7" cy="26" r="18" fill="#FEF3C7" />
              {/* Star Dangling below */}
              <line x1="0" y1="52" x2="0" y2="70" stroke="#CA8A04" strokeWidth="1.5" />
              <text x="0" y="85" textAnchor="middle" fontSize="18">⭐</text>
            </g>
          )}

          {activeDecor.lighting === 'aurora_projector' && (
            <g>
              {/* Ambient Aurora Wave Lights */}
              <path d="M 0,40 Q 200,10 400,60 T 800,30 L 800,160 Q 600,200 400,130 T 0,150 Z" fill="#34D399" opacity="0.25" />
              <path d="M 0,70 Q 250,30 500,80 T 800,50 L 800,180 Q 550,220 300,150 T 0,170 Z" fill="#A855F7" opacity="0.2" />
            </g>
          )}
        </g>

        {/* ==================================================== */}
        {/* 6. FLOOR RUG (Center Floor 360 ~ 440px) */}
        {/* ==================================================== */}
        <g id="room-rug">
          {activeDecor.rug === 'circle_sun' && (
            <g>
              <ellipse cx="400" cy="395" rx="190" ry="60" fill="#FED7AA" stroke="#FB923C" strokeWidth="6" strokeDasharray="8 6" opacity="0.9" />
              <ellipse cx="400" cy="395" rx="160" ry="48" fill="#FFEDD5" />
              <ellipse cx="400" cy="395" rx="70" ry="22" fill="#FDBA74" opacity="0.4" />
            </g>
          )}

          {activeDecor.rug === 'bear_rug' && (
            <g transform="translate(400, 395)">
              {/* Bear Ears */}
              <ellipse cx="-130" cy="-35" rx="35" ry="25" fill="#D97706" />
              <ellipse cx="-130" cy="-35" rx="22" ry="16" fill="#FDE68A" />
              <ellipse cx="130" cy="-35" rx="35" ry="25" fill="#D97706" />
              <ellipse cx="130" cy="-35" rx="22" ry="16" fill="#FDE68A" />
              {/* Head Base */}
              <ellipse cx="0" cy="0" rx="180" ry="58" fill="#B45309" stroke="#78350F" strokeWidth="4" />
              <ellipse cx="0" cy="0" rx="160" ry="48" fill="#D97706" />
              {/* Muzzle */}
              <ellipse cx="0" cy="10" rx="60" ry="26" fill="#FEF3C7" />
              <ellipse cx="0" cy="0" rx="18" ry="10" fill="#451A03" />
              {/* Eyes */}
              <circle cx="-50" cy="-12" r="7" fill="#451A03" />
              <circle cx="50" cy="-12" r="7" fill="#451A03" />
            </g>
          )}

          {activeDecor.rug === 'flower_pink' && (
            <g transform="translate(400, 395)">
              {/* 5 Blossom Petals */}
              <ellipse cx="0" cy="-35" rx="55" ry="30" fill="#F472B6" />
              <ellipse cx="-110" cy="-15" rx="55" ry="28" fill="#FB7185" />
              <ellipse cx="110" cy="-15" rx="55" ry="28" fill="#FB7185" />
              <ellipse cx="-70" cy="28" rx="55" ry="28" fill="#F472B6" />
              <ellipse cx="70" cy="28" rx="55" ry="28" fill="#F472B6" />
              {/* Center */}
              <ellipse cx="0" cy="0" rx="80" ry="38" fill="#FEF08A" stroke="#FBBF24" strokeWidth="4" />
              <text x="0" y="8" textAnchor="middle" fontSize="22">🌸</text>
            </g>
          )}

          {activeDecor.rug === 'star_magic' && (
            <g transform="translate(400, 395)">
              <ellipse cx="0" cy="0" rx="190" ry="58" fill="#1E1B4B" stroke="#FDE047" strokeWidth="5" />
              <ellipse cx="0" cy="0" rx="160" ry="46" fill="#312E81" />
              {/* 8-point Magic Star */}
              <polygon points="0,-42 35,-15 130,-15 55,10 85,38 0,20 -85,38 -55,10 -130,-15 -35,-15" fill="#FDE047" opacity="0.8" />
              <circle cx="0" cy="0" r="16" fill="#67E8F9" />
            </g>
          )}

          {activeDecor.rug === 'heart_cloud' && (
            <g transform="translate(400, 395)">
              <ellipse cx="-60" cy="-10" rx="90" ry="45" fill="#FDA4AF" />
              <ellipse cx="60" cy="-10" rx="90" ry="45" fill="#FDA4AF" />
              <polygon points="-130,-5 130,-5 0,45" fill="#FDA4AF" />
              <ellipse cx="0" cy="5" rx="140" ry="35" fill="#FFF1F2" />
              <text x="0" y="12" textAnchor="middle" fontSize="22">💖</text>
            </g>
          )}

          {activeDecor.rug === 'cat_paw_rug' && (
            <g transform="translate(400, 395)">
              <ellipse cx="0" cy="8" rx="110" ry="42" fill="#FFFFFF" stroke="#F472B6" strokeWidth="5" />
              {/* Main Pad */}
              <ellipse cx="0" cy="12" rx="55" ry="24" fill="#F472B6" />
              {/* 4 Toe Beans */}
              <ellipse cx="-75" cy="-12" rx="22" ry="14" fill="#FB7185" />
              <ellipse cx="-28" cy="-24" rx="24" ry="15" fill="#FB7185" />
              <ellipse cx="28" cy="-24" rx="24" ry="15" fill="#FB7185" />
              <ellipse cx="75" cy="-12" rx="22" ry="14" fill="#FB7185" />
            </g>
          )}
        </g>

        {/* ==================================================== */}
        {/* 7. FURNITURE (Left or Right Floor Area) */}
        {/* ==================================================== */}
        <g id="room-furniture">
          {activeDecor.furniture === 'cozy_sofa' && (
            <g transform="translate(25, 275)">
              {/* Armchair Base & Backrest */}
              <rect x="10" y="20" width="100" height="70" rx="20" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="3" />
              <rect x="0" y="55" width="25" height="40" rx="12" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="2" />
              <rect x="95" y="55" width="25" height="40" rx="12" fill="#60A5FA" stroke="#1D4ED8" strokeWidth="2" />
              {/* Seat Cushion */}
              <rect x="18" y="60" width="84" height="35" rx="14" fill="#93C5FD" />
              {/* Pillow */}
              <ellipse cx="60" cy="50" rx="20" ry="12" fill="#FEF08A" />
              <text x="60" y="54" textAnchor="middle" fontSize="10">⭐</text>
              {/* Sofa Wooden Legs */}
              <rect x="15" y="95" width="8" height="15" fill="#78350F" rx="2" />
              <rect x="97" y="95" width="8" height="15" fill="#78350F" rx="2" />
            </g>
          )}

          {activeDecor.furniture === 'cat_tower' && (
            <g transform="translate(25, 210)">
              {/* Base */}
              <rect x="10" y="150" width="110" height="18" rx="6" fill="#B45309" stroke="#78350F" strokeWidth="2" />
              {/* Scratching Posts */}
              <rect x="30" y="50" width="16" height="100" fill="#FDE68A" stroke="#CA8A04" strokeWidth="1.5" />
              <rect x="80" y="90" width="16" height="60" fill="#FDE68A" stroke="#CA8A04" strokeWidth="1.5" />
              {/* Mid Platform */}
              <rect x="65" y="80" width="55" height="12" rx="4" fill="#D97706" />
              {/* Top House/Pod */}
              <rect x="15" y="15" width="75" height="50" rx="10" fill="#D97706" stroke="#92400E" strokeWidth="2" />
              <circle cx="52" cy="40" r="16" fill="#451A03" />
              {/* Hanging Pom Pom */}
              <line x1="75" y1="27" x2="95" y2="55" stroke="#78350F" strokeWidth="1.5" />
              <circle cx="95" cy="55" r="7" fill="#F472B6" />
            </g>
          )}

          {activeDecor.furniture === 'arcade_box' && (
            <g transform="translate(25, 230)">
              {/* Main Cabinet */}
              <polygon points="10,140 10,20 85,20 105,45 80,85 100,140" fill="#1E293B" stroke="#06B6D4" strokeWidth="3" />
              {/* Marquee Header */}
              <rect x="15" y="25" width="65" height="18" fill="#082F49" rx="3" />
              <text x="47" y="38" textAnchor="middle" fontSize="10" fill="#38BDF8" fontWeight="bold">ARCADE</text>
              {/* Glowing CRT Screen */}
              <rect x="18" y="50" width="58" height="42" rx="6" fill="#047857" stroke="#10B981" strokeWidth="2" />
              <text x="47" y="76" textAnchor="middle" fontSize="18">👾</text>
              {/* Control Panel Deck & Joystick */}
              <rect x="15" y="96" width="70" height="16" fill="#334155" rx="3" />
              <circle cx="35" cy="104" r="5" fill="#EF4444" />
              <circle cx="55" cy="102" r="3.5" fill="#FBBF24" />
              <circle cx="68" cy="102" r="3.5" fill="#3B82F6" />
            </g>
          )}

          {activeDecor.furniture === 'piano_mini' && (
            <g transform="translate(25, 255)">
              {/* Piano Body */}
              <rect x="10" y="30" width="105" height="70" rx="8" fill="#18181B" stroke="#09090B" strokeWidth="2" />
              <rect x="15" y="10" width="95" height="25" rx="4" fill="#27272A" />
              {/* Music Sheet Stand */}
              <rect x="42" y="0" width="40" height="16" fill="#FEF3C7" rx="2" />
              <text x="62" y="12" textAnchor="middle" fontSize="10">🎵</text>
              {/* Keyboard Shelf */}
              <rect x="10" y="65" width="105" height="16" fill="#FFFFFF" stroke="#27272A" strokeWidth="1.5" />
              {/* Black keys */}
              {[20, 32, 50, 62, 74, 92].map((x) => (
                <rect key={x} x={x} y="65" width="7" height="10" fill="#000000" rx="1" />
              ))}
              {/* Piano Legs */}
              <rect x="18" y="100" width="8" height="18" fill="#18181B" />
              <rect x="99" y="100" width="8" height="18" fill="#18181B" />
            </g>
          )}

          {activeDecor.furniture === 'magic_tent' && (
            <g transform="translate(25, 230)">
              {/* Wooden Poles */}
              <line x1="20" y1="140" x2="65" y2="5" stroke="#B45309" strokeWidth="6" />
              <line x1="110" y1="140" x2="65" y2="5" stroke="#B45309" strokeWidth="6" />
              {/* Teepee Canvas Fabric */}
              <polygon points="65,15 15,140 115,140" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="2" />
              {/* Entrance Flap */}
              <polygon points="65,45 40,140 90,140" fill="#D97706" />
              <polygon points="65,55 50,140 80,140" fill="#78350F" />
              {/* Decorative Flags Top */}
              <circle cx="65" cy="8" r="8" fill="#F59E0B" />
              <polygon points="35,30 45,45 55,30" fill="#EF4444" />
              <polygon points="55,30 65,45 75,30" fill="#3B82F6" />
              <polygon points="75,30 85,45 95,30" fill="#10B981" />
            </g>
          )}

          {activeDecor.furniture === 'gaming_desk' && (
            <g transform="translate(20, 240)">
              {/* Desk Surface & Frame */}
              <rect x="10" y="60" width="115" height="12" rx="4" fill="#0F172A" stroke="#06B6D4" strokeWidth="2" />
              <rect x="18" y="72" width="8" height="50" fill="#334155" />
              <rect x="109" y="72" width="8" height="50" fill="#334155" />
              {/* Dual Monitors */}
              <rect x="15" y="18" width="50" height="38" rx="4" fill="#020617" stroke="#38BDF8" strokeWidth="2" />
              <rect x="68" y="18" width="50" height="38" rx="4" fill="#020617" stroke="#A855F7" strokeWidth="2" />
              <text x="40" y="42" textAnchor="middle" fontSize="16">🕹️</text>
              <text x="93" y="42" textAnchor="middle" fontSize="16">💬</text>
              {/* RGB Gaming PC Case on side */}
              <rect x="112" y="75" width="22" height="42" rx="4" fill="#1E1B4B" stroke="#EC4899" strokeWidth="2" />
              <line x1="116" y1="85" x2="130" y2="85" stroke="#22D3EE" strokeWidth="2" />
              <line x1="116" y1="95" x2="130" y2="95" stroke="#F43F5E" strokeWidth="2" />
            </g>
          )}

          {activeDecor.furniture === 'dessert_table' && (
            <g transform="translate(25, 270)">
              {/* Table Stand */}
              <ellipse cx="65" cy="55" rx="55" ry="18" fill="#FDF2F8" stroke="#F472B6" strokeWidth="3" />
              <rect x="61" y="60" width="8" height="45" fill="#F472B6" />
              <ellipse cx="65" cy="105" rx="30" ry="10" fill="#FDF2F8" stroke="#F472B6" strokeWidth="2" />
              {/* 3-Tier Dessert Stand */}
              <ellipse cx="65" cy="40" rx="32" ry="10" fill="#FEF08A" stroke="#FBBF24" strokeWidth="1.5" />
              <ellipse cx="65" cy="22" rx="22" ry="7" fill="#FEF08A" stroke="#FBBF24" strokeWidth="1.5" />
              <rect x="63" y="12" width="4" height="30" fill="#CA8A04" />
              {/* Macarons & Teapot */}
              <circle cx="54" cy="38" r="4" fill="#F472B6" />
              <circle cx="65" cy="38" r="4" fill="#34D399" />
              <circle cx="76" cy="38" r="4" fill="#60A5FA" />
              <text x="35" y="48" fontSize="16">🫖</text>
            </g>
          )}
        </g>

        {/* ==================================================== */}
        {/* 8. FLOOR TOY & PET ACCESSORIES (Right Floor 330 ~ 440px) */}
        {/* ==================================================== */}
        <g id="room-toys">
          {activeDecor.floorToy === 'play_ball' && (
            <g transform="translate(680, 360)">
              <circle cx="30" cy="30" r="28" fill="#EF4444" stroke="#DC2626" strokeWidth="2" />
              {/* Curved Rainbow segments */}
              <path d="M 30,2 Q 50,30 30,58" fill="#3B82F6" />
              <path d="M 30,2 Q 10,30 30,58" fill="#FACC15" />
              <circle cx="30" cy="30" r="8" fill="#FFFFFF" />
            </g>
          )}

          {activeDecor.floorToy === 'teddy_bear' && (
            <g transform="translate(675, 340)">
              {/* Ears */}
              <circle cx="15" cy="18" r="10" fill="#B45309" />
              <circle cx="15" cy="18" r="5" fill="#FDE68A" />
              <circle cx="55" cy="18" r="10" fill="#B45309" />
              <circle cx="55" cy="18" r="5" fill="#FDE68A" />
              {/* Head */}
              <circle cx="35" cy="32" r="22" fill="#D97706" />
              <circle cx="35" cy="38" r="10" fill="#FEF3C7" />
              <circle cx="35" cy="34" r="4" fill="#451A03" />
              <circle cx="27" cy="28" r="3" fill="#451A03" />
              <circle cx="43" cy="28" r="3" fill="#451A03" />
              {/* Red Bow tie */}
              <polygon points="35,52 25,46 25,58" fill="#EF4444" />
              <polygon points="35,52 45,46 45,58" fill="#EF4444" />
              {/* Body */}
              <ellipse cx="35" cy="68" rx="20" ry="24" fill="#B45309" />
              <ellipse cx="35" cy="68" rx="12" ry="15" fill="#FEF3C7" />
            </g>
          )}

          {activeDecor.floorToy === 'robot_toy' && (
            <g transform="translate(680, 335)">
              {/* Antenna */}
              <line x1="30" y1="5" x2="30" y2="18" stroke="#64748B" strokeWidth="3" />
              <circle cx="30" cy="5" r="4" fill="#EF4444" />
              {/* Head */}
              <rect x="15" y="18" width="30" height="24" rx="4" fill="#94A3B8" stroke="#475569" strokeWidth="2" />
              <circle cx="23" cy="28" r="4" fill="#38BDF8" />
              <circle cx="37" cy="28" r="4" fill="#38BDF8" />
              {/* Body */}
              <rect x="10" y="44" width="40" height="34" rx="5" fill="#64748B" stroke="#334155" strokeWidth="2" />
              <rect x="18" y="52" width="24" height="18" rx="2" fill="#1E293B" />
              <circle cx="24" cy="61" r="3" fill="#22C55E" />
              <circle cx="32" cy="61" r="3" fill="#EAB308" />
              {/* Arms & Treads */}
              <rect x="2" y="48" width="6" height="22" rx="3" fill="#94A3B8" />
              <rect x="52" y="48" width="6" height="22" rx="3" fill="#94A3B8" />
              <rect x="8" y="78" width="44" height="10" rx="3" fill="#334155" />
            </g>
          )}

          {activeDecor.floorToy === 'train_set' && (
            <g transform="translate(650, 360)">
              {/* Oval Track */}
              <ellipse cx="60" cy="35" rx="55" ry="20" fill="none" stroke="#78350F" strokeWidth="3" strokeDasharray="6 4" />
              {/* Locomotive Train */}
              <rect x="35" y="15" width="35" height="22" rx="4" fill="#EF4444" />
              <rect x="20" y="24" width="18" height="13" fill="#3B82F6" rx="2" />
              <rect x="58" y="10" width="8" height="12" fill="#1E293B" />
              <circle cx="32" cy="38" r="5" fill="#CA8A04" />
              <circle cx="48" cy="38" r="5" fill="#CA8A04" />
              <circle cx="62" cy="38" r="5" fill="#CA8A04" />
              {/* Steam puff */}
              <circle cx="62" cy="2" r="5" fill="#E2E8F0" opacity="0.8" />
              <circle cx="68" cy="-5" r="7" fill="#E2E8F0" opacity="0.6" />
            </g>
          )}

          {activeDecor.floorToy === 'food_bowl_royal' && (
            <g transform="translate(680, 375)">
              {/* Golden Bowl */}
              <ellipse cx="35" cy="25" rx="32" ry="12" fill="#CA8A04" />
              <path d="M 5,25 Q 35,55 65,25 Z" fill="#EAB308" stroke="#CA8A04" strokeWidth="2" />
              <ellipse cx="35" cy="23" rx="28" ry="9" fill="#92400E" />
              {/* Feast / Steak & Gems */}
              <ellipse cx="35" cy="21" rx="18" ry="6" fill="#D97706" />
              <circle cx="35" cy="38" r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="20" cy="34" r="3.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1" />
              <circle cx="50" cy="34" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1" />
              <text x="35" y="15" textAnchor="middle" fontSize="16">👑</text>
            </g>
          )}

          {activeDecor.floorToy === 'magic_wand_stand' && (
            <g transform="translate(685, 340)">
              {/* Stand Pedestal */}
              <polygon points="15,80 45,80 38,60 22,60" fill="#451A03" />
              {/* Star Wand */}
              <line x1="30" y1="20" x2="30" y2="65" stroke="#CA8A04" strokeWidth="4" strokeLinecap="round" />
              <text x="30" y="24" textAnchor="middle" fontSize="24">⭐</text>
              <text x="46" y="14" fontSize="14">✨</text>
              <text x="14" y="38" fontSize="12">✨</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
