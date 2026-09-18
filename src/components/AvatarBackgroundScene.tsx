import React from 'react';

interface AvatarBackgroundSceneProps {
  scene?: 'terrace' | 'beach' | 'park' | 'city_night' | 'room' | 'forest';
  className?: string;
}

export const AvatarBackgroundScene: React.FC<AvatarBackgroundSceneProps> = ({
  scene = 'terrace',
  className = '',
}) => {
  const uid = React.useId().replace(/:/g, '');

  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-2xl ${className}`}>
      <svg
        viewBox="0 0 400 560"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          {/* Terrace Gradients */}
          <linearGradient id={`terraceSky-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#BAE6FD" />
            <stop offset="45%" stopColor="#E0F2FE" />
            <stop offset="85%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>
          <linearGradient id={`terraceFloor-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Beach Gradients */}
          <linearGradient id={`beachSky-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="60%" stopColor="#BAE6FD" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>
          <linearGradient id={`beachSea-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#67E8F9" />
          </linearGradient>
          <linearGradient id={`beachSand-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>

          {/* Park Gradients */}
          <linearGradient id={`parkSky-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="50%" stopColor="#FCE7F3" />
            <stop offset="100%" stopColor="#FBCFE8" />
          </linearGradient>

          {/* City Night Gradients */}
          <linearGradient id={`citySky-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="40%" stopColor="#1E1B4B" />
            <stop offset="75%" stopColor="#4C1D95" />
            <stop offset="100%" stopColor="#831843" />
          </linearGradient>

          {/* Room Gradients */}
          <linearGradient id={`roomWall-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF1F2" />
            <stop offset="100%" stopColor="#FFE4E6" />
          </linearGradient>

          {/* Forest Gradients */}
          <linearGradient id={`forestSky-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#064E3B" />
            <stop offset="50%" stopColor="#065F46" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>

        {/* ======================================================== */}
        {/* SCENE 1: TERRACE (유럽 꽃길 테라스 - Reference Image Scene) */}
        {/* ======================================================== */}
        {scene === 'terrace' && (
          <g id="scene-terrace">
            {/* Sunny Sky */}
            <rect width="400" height="560" fill={`url(#terraceSky-${uid})`} />

            {/* Distant European Pastel Buildings */}
            <rect x="0" y="160" width="130" height="250" fill="#E2E8F0" opacity="0.6" />
            <polygon points="0,160 65,110 130,160" fill="#CBD5E1" opacity="0.6" />
            <rect x="270" y="140" width="130" height="270" fill="#FDE68A" opacity="0.4" />
            <polygon points="270,140 335,90 400,140" fill="#FCD34D" opacity="0.5" />
            
            {/* Distant Church Dome & Clocktower */}
            <rect x="170" y="150" width="60" height="180" fill="#E0E7FF" opacity="0.5" />
            <path d="M 170 150 C 170 100 230 100 230 150 Z" fill="#C7D2FE" opacity="0.5" />
            <rect x="198" y="70" width="4" height="30" fill="#A5B4FC" opacity="0.5" />

            {/* Classical White Marble Balustrade Arch & Pillars */}
            <rect x="0" y="100" width="45" height="360" fill="#FFFFFF" opacity="0.9" stroke="#E2E8F0" strokeWidth="2" />
            <rect x="355" y="100" width="45" height="360" fill="#FFFFFF" opacity="0.9" stroke="#E2E8F0" strokeWidth="2" />
            <path d="M 0 100 Q 200 40 400 100 L 400 140 Q 200 80 0 140 Z" fill="#FFFFFF" opacity="0.95" stroke="#E2E8F0" strokeWidth="2" />

            {/* Vintage Street Lamp (Left side like reference image!) */}
            <g transform="translate(10, 80)">
              {/* Lamp Post Pole */}
              <rect x="30" y="100" width="6" height="240" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
              {/* Lamp Head Lantern */}
              <polygon points="22,70 44,70 40,95 26,95" fill="#FEF08A" stroke="#64748B" strokeWidth="2" />
              <polygon points="18,70 48,70 33,52" fill="#64748B" />
              {/* Glowing Warm Light Bulb */}
              <circle cx="33" cy="82" r="8" fill="#FDE047" opacity="0.85" filter="drop-shadow(0 0 8px #FACC15)" />
              {/* Ornate Iron Curls */}
              <path d="M 33 110 C 15 110 15 130 33 130" stroke="#64748B" strokeWidth="2" fill="none" />
            </g>

            {/* Lush Pink Flower Pots & Climbing Ivy (Left & Right) */}
            <g transform="translate(-10, 260)">
              {/* Left Flower Bush */}
              <circle cx="40" cy="100" r="30" fill="#86EFAC" opacity="0.9" />
              <circle cx="55" cy="80" r="25" fill="#4ADE80" opacity="0.9" />
              <circle cx="30" cy="70" r="22" fill="#22C55E" opacity="0.8" />
              {/* Blooming Pink Roses */}
              <circle cx="45" cy="75" r="8" fill="#FB7185" />
              <circle cx="30" cy="95" r="7" fill="#F43F5E" />
              <circle cx="60" cy="90" r="6" fill="#FDA4AF" />
              <circle cx="50" cy="60" r="7" fill="#F43F5E" />
            </g>
            <g transform="translate(320, 260)">
              {/* Right Flower Bush */}
              <circle cx="50" cy="100" r="30" fill="#86EFAC" opacity="0.9" />
              <circle cx="35" cy="80" r="25" fill="#4ADE80" opacity="0.9" />
              <circle cx="60" cy="70" r="22" fill="#22C55E" opacity="0.8" />
              {/* Blooming Pink Roses */}
              <circle cx="40" cy="75" r="8" fill="#FB7185" />
              <circle cx="55" cy="95" r="7" fill="#F43F5E" />
              <circle cx="28" cy="90" r="6" fill="#FDA4AF" />
              <circle cx="42" cy="60" r="7" fill="#F43F5E" />
            </g>

            {/* Terrace Stone Paver Floor */}
            <rect x="0" y="440" width="400" height="120" fill={`url(#terraceFloor-${uid})`} />
            <line x1="0" y1="440" x2="400" y2="440" stroke="#94A3B8" strokeWidth="2" />
            {/* Grid Paver Lines */}
            <line x1="80" y1="440" x2="50" y2="560" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="160" y1="440" x2="140" y2="560" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="240" y1="440" x2="260" y2="560" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="320" y1="440" x2="350" y2="560" stroke="#CBD5E1" strokeWidth="1.5" />
            <line x1="0" y1="480" x2="400" y2="480" stroke="#E2E8F0" strokeWidth="1.5" />
            <line x1="0" y1="520" x2="400" y2="520" stroke="#E2E8F0" strokeWidth="1.5" />

            {/* Sunlight Beam Filter */}
            <polygon points="0,0 220,0 350,560 0,560" fill="#FFFBEB" opacity="0.12" />
          </g>
        )}

        {/* ======================================================== */}
        {/* SCENE 2: SUMMER BEACH (푸른 여름 해변) */}
        {/* ======================================================== */}
        {scene === 'beach' && (
          <g id="scene-beach">
            <rect width="400" height="280" fill={`url(#beachSky-${uid})`} />
            {/* Bright Sun */}
            <circle cx="330" cy="80" r="35" fill="#FEF08A" filter="drop-shadow(0 0 15px #FDE047)" />
            {/* White Clouds */}
            <ellipse cx="90" cy="80" rx="45" ry="18" fill="#FFFFFF" opacity="0.8" />
            <ellipse cx="120" cy="75" rx="30" ry="16" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="230" cy="110" rx="35" ry="14" fill="#FFFFFF" opacity="0.75" />

            {/* Ocean Sea */}
            <rect x="0" y="240" width="400" height="150" fill={`url(#beachSea-${uid})`} />
            {/* Ocean Waves */}
            <path d="M 0 290 Q 50 280 100 290 T 200 290 T 300 290 T 400 290" stroke="#E0F2FE" strokeWidth="3" fill="none" />
            <path d="M 0 330 Q 50 320 100 330 T 200 330 T 300 330 T 400 330" stroke="#FFFFFF" strokeWidth="4" fill="none" />

            {/* Sandy Shore */}
            <path d="M 0 370 Q 200 340 400 380 L 400 560 L 0 560 Z" fill={`url(#beachSand-${uid})`} />
            
            {/* Palm Tree */}
            <path d="M -20 400 Q 40 250 20 120" stroke="#92400E" strokeWidth="14" fill="none" strokeLinecap="round" />
            {/* Palm Fronds */}
            <path d="M 20 120 Q 90 80 140 130" stroke="#16A34A" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 20 120 Q 80 140 120 190" stroke="#22C55E" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 20 120 Q -20 70 -50 110" stroke="#15803D" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M 20 120 Q 10 50 60 40" stroke="#4ADE80" strokeWidth="6" fill="none" strokeLinecap="round" />

            {/* Beach Umbrella & Starfish */}
            <circle cx="340" cy="460" r="10" fill="#FB7185" />
          </g>
        )}

        {/* ======================================================== */}
        {/* SCENE 3: SAKURA PARK (벚꽃 만개 공원) */}
        {/* ======================================================== */}
        {scene === 'park' && (
          <g id="scene-park">
            <rect width="400" height="560" fill={`url(#parkSky-${uid})`} />
            {/* Distant Hills */}
            <path d="M 0 300 Q 120 220 250 280 T 400 270 L 400 560 L 0 560 Z" fill="#86EFAC" opacity="0.6" />
            <path d="M 0 360 Q 200 320 400 360 L 400 560 L 0 560 Z" fill="#4ADE80" opacity="0.8" />

            {/* Sakura Trees Canopy (Left & Right) */}
            <g>
              <circle cx="40" cy="130" r="75" fill="#FBCFE8" opacity="0.9" />
              <circle cx="90" cy="90" r="60" fill="#F472B6" opacity="0.8" />
              <circle cx="20" cy="70" r="50" fill="#FDA4AF" opacity="0.85" />
              <path d="M 30 380 L 40 180" stroke="#78350F" strokeWidth="12" strokeLinecap="round" />
            </g>
            <g>
              <circle cx="360" cy="130" r="75" fill="#FBCFE8" opacity="0.9" />
              <circle cx="310" cy="90" r="60" fill="#F472B6" opacity="0.8" />
              <circle cx="380" cy="70" r="50" fill="#FDA4AF" opacity="0.85" />
              <path d="M 370 380 L 360 180" stroke="#78350F" strokeWidth="12" strokeLinecap="round" />
            </g>

            {/* Park Stone Pathway */}
            <path d="M 120 560 L 170 360 L 230 360 L 280 560 Z" fill="#E2E8F0" />
            <line x1="120" y1="560" x2="170" y2="360" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="280" y1="560" x2="230" y2="360" stroke="#CBD5E1" strokeWidth="2" />

            {/* Falling Pink Petals */}
            {[
              { cx: 80, cy: 220 },
              { cx: 140, cy: 180 },
              { cx: 220, cy: 150 },
              { cx: 280, cy: 240 },
              { cx: 190, cy: 290 },
              { cx: 330, cy: 210 },
              { cx: 100, cy: 340 },
              { cx: 260, cy: 380 },
            ].map((p, i) => (
              <ellipse key={i} cx={p.cx} cy={p.cy} rx="5" ry="3" fill="#FB7185" transform={`rotate(${i * 35}, ${p.cx}, ${p.cy})`} opacity="0.8" />
            ))}
          </g>
        )}

        {/* ======================================================== */}
        {/* SCENE 4: CITY NIGHT SKYLINE (사이버펑크 야경 도시) */}
        {/* ======================================================== */}
        {scene === 'city_night' && (
          <g id="scene-city-night">
            <rect width="400" height="560" fill={`url(#citySky-${uid})`} />
            {/* Glowing Crescent Moon & Stars */}
            <path d="M 330 60 A 25 25 0 0 0 355 85 A 28 28 0 1 1 330 60 Z" fill="#FEF08A" filter="drop-shadow(0 0 10px #FDE047)" />
            {[
              { x: 50, y: 50, r: 2 },
              { x: 120, y: 80, r: 1.5 },
              { x: 210, y: 40, r: 2.5 },
              { x: 270, y: 90, r: 2 },
              { x: 90, y: 130, r: 1.8 },
              { x: 180, y: 110, r: 2 },
            ].map((s, idx) => (
              <circle key={idx} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF" opacity="0.9" />
            ))}

            {/* Towering Glowing Skyscrapers */}
            <rect x="20" y="200" width="60" height="300" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <rect x="90" y="140" width="75" height="360" fill="#1E1B4B" stroke="#C084FC" strokeWidth="1.5" />
            <rect x="175" y="180" width="55" height="320" fill="#172554" stroke="#60A5FA" strokeWidth="1" />
            <rect x="240" y="110" width="80" height="390" fill="#09090B" stroke="#F43F5E" strokeWidth="1.5" />
            <rect x="330" y="190" width="60" height="310" fill="#1E293B" stroke="#A78BFA" strokeWidth="1" />

            {/* Glowing Windows Matrix */}
            {[240, 270, 300, 330, 360, 390].map((y, rowIdx) => (
              <g key={rowIdx}>
                <rect x="100" y={y} width="10" height="12" fill="#FDE047" opacity="0.8" />
                <rect x="120" y={y} width="10" height="12" fill="#38BDF8" opacity="0.75" />
                <rect x="140" y={y} width="10" height="12" fill="#F43F5E" opacity="0.85" />
                <rect x="255" y={y - 50} width="12" height="14" fill="#67E8F9" opacity="0.9" />
                <rect x="285" y={y - 50} width="12" height="14" fill="#F472B6" opacity="0.85" />
              </g>
            ))}

            {/* Cyberpunk Ground Grid */}
            <rect x="0" y="440" width="400" height="120" fill="#030712" />
            <line x1="0" y1="440" x2="400" y2="440" stroke="#EC4899" strokeWidth="3" filter="drop-shadow(0 0 6px #F43F5E)" />
            <line x1="60" y1="440" x2="20" y2="560" stroke="#06B6D4" strokeWidth="1.5" />
            <line x1="150" y1="440" x2="120" y2="560" stroke="#06B6D4" strokeWidth="1.5" />
            <line x1="250" y1="440" x2="280" y2="560" stroke="#06B6D4" strokeWidth="1.5" />
            <line x1="340" y1="440" x2="380" y2="560" stroke="#06B6D4" strokeWidth="1.5" />
          </g>
        )}

        {/* ======================================================== */}
        {/* SCENE 5: COZY PASTEL ROOM (포근한 핑크 룸) */}
        {/* ======================================================== */}
        {scene === 'room' && (
          <g id="scene-room">
            <rect width="400" height="420" fill={`url(#roomWall-${uid})`} />
            {/* Big Sunny Window */}
            <rect x="110" y="60" width="180" height="200" rx="10" fill="#E0F2FE" stroke="#FFFFFF" strokeWidth="8" />
            <line x1="200" y1="60" x2="200" y2="260" stroke="#FFFFFF" strokeWidth="6" />
            <line x1="110" y1="160" x2="290" y2="160" stroke="#FFFFFF" strokeWidth="6" />
            {/* Clouds through window */}
            <ellipse cx="160" cy="120" rx="25" ry="12" fill="#FFFFFF" opacity="0.9" />
            <ellipse cx="230" cy="140" rx="20" ry="10" fill="#FFFFFF" opacity="0.8" />

            {/* Cute Pastel Garland Banner */}
            <path d="M 0 30 Q 100 65 200 30 Q 300 65 400 30" stroke="#F43F5E" strokeWidth="2" fill="none" />
            {[40, 90, 140, 190, 240, 290, 340].map((x, i) => (
              <polygon
                key={i}
                points={`${x-12},38 ${x+12},38 ${x},62`}
                fill={['#FDA4AF', '#BAE6FD', '#FEF08A', '#DDD6FE', '#A7F3D0', '#FBCFE8', '#FED7AA'][i % 7]}
                stroke="#FFFFFF"
                strokeWidth="1"
              />
            ))}

            {/* Wooden Floor & Plush Round Rug */}
            <rect x="0" y="420" width="400" height="140" fill="#FED7AA" />
            <ellipse cx="200" cy="480" rx="150" ry="50" fill="#FBCFE8" stroke="#F472B6" strokeWidth="3" />
            <ellipse cx="200" cy="480" rx="130" ry="42" fill="#FDF2F8" />
          </g>
        )}

        {/* ======================================================== */}
        {/* SCENE 6: FAIRY FOREST (신비로운 요정의 숲) */}
        {/* ======================================================== */}
        {scene === 'forest' && (
          <g id="scene-forest">
            <rect width="400" height="560" fill={`url(#forestSky-${uid})`} />
            {/* Giant Magic Tree Trunks */}
            <path d="M -30 0 C 40 180 20 380 40 560 L -50 560 Z" fill="#022C22" />
            <path d="M 430 0 C 360 180 380 380 360 560 L 450 560 Z" fill="#022C22" />
            
            {/* Glowing Magic Flora & Leaves */}
            <circle cx="60" cy="180" r="40" fill="#10B981" opacity="0.6" />
            <circle cx="340" cy="180" r="40" fill="#10B981" opacity="0.6" />
            
            {/* Glowing Mushrooms & Fireflies */}
            <ellipse cx="80" cy="460" rx="20" ry="14" fill="#F43F5E" />
            <ellipse cx="80" cy="460" rx="16" ry="10" fill="#FDA4AF" />
            <rect x="76" y="465" width="8" height="20" fill="#FEF08A" />

            {/* Fairy Lights Particles */}
            {[
              { x: 120, y: 150, r: 4, c: '#FEF08A' },
              { x: 280, y: 180, r: 5, c: '#67E8F9' },
              { x: 190, y: 240, r: 3.5, c: '#F472B6' },
              { x: 150, y: 350, r: 4.5, c: '#A7F3D0' },
              { x: 250, y: 320, r: 5, c: '#FDE047' },
              { x: 90, y: 280, r: 3, c: '#DDD6FE' },
            ].map((f, i) => (
              <g key={i}>
                <circle cx={f.x} cy={f.y} r={f.r * 2.5} fill={f.c} opacity="0.3" filter="blur(3px)" />
                <circle cx={f.x} cy={f.y} r={f.r} fill="#FFFFFF" />
              </g>
            ))}

            {/* Forest Moss Ground */}
            <path d="M 0 440 Q 200 410 400 440 L 400 560 L 0 560 Z" fill="#064E3B" />
          </g>
        )}
      </svg>
    </div>
  );
};
