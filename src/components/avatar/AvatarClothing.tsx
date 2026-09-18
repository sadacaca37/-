import React from 'react';

interface AvatarClothingProps {
  topType?: string;
  topColor?: string;
  bottomType?: string;
  bottomColor?: string;
  shoes?: string;
  shoesColor?: string;
  bag?: string;
  accessory?: string;
  viewAngle?: 'front' | 'side' | 'back';
  gender?: 'boy' | 'girl' | 'cute' | 'pet';
  uid: string;
}

export const AvatarClothing: React.FC<AvatarClothingProps> = ({
  topType = 'casual_oversized_tee',
  topColor = '#FFFFFF',
  bottomType = 'relaxed_baggy_jeans',
  bottomColor = '#5B84B1',
  shoes = 'chunky_sneakers',
  shoesColor = '#FFFFFF',
  bag = 'none',
  accessory = 'none',
  viewAngle = 'front',
  gender = 'boy',
  uid,
}) => {
  const lineStroke = '#2D170D';
  const strokeW = '2.2';

  // Normalize types
  const normalizedTop = (() => {
    switch (topType) {
      case 'white_tshirt':
      case 'casual_oversized_tee':
      case 'tshirt':
      case 'oversized_tee':
        return 'casual_oversized_tee';

      case 'varsity_jacket':
      case 'varsity':
      case 'stadium':
        return 'varsity_jacket';

      case 'streetwear_hoodie':
      case 'oversized_hoodie':
      case 'hoodie':
        return 'streetwear_hoodie';

      case 'blazer':
      case 'formal_blazer_tie':
      case 'suit':
        return 'formal_blazer_tie';

      case 'denim_jacket':
        return 'denim_jacket';

      case 'bomber_ma1':
      case 'bomber':
        return 'bomber_ma1';

      case 'cable_knit':
      case 'knit':
        return 'cable_knit';

      case 'school_cardigan':
      case 'school':
        return 'school_cardigan';

      case 'football_jersey':
      case 'sport':
        return 'football_jersey';

      case 'off_shoulder':
        return 'off_shoulder';

      case 'crop_top_floral':
      case 'crop_top':
        return 'crop_top_floral';

      case 'trench_coat':
        return 'trench_coat';

      case 'sundress':
      case 'dress':
        return 'sundress';

      case 'hanbok_top':
      case 'hanbok':
        return 'hanbok_top';

      default:
        return 'casual_oversized_tee';
    }
  })();

  const normalizedBottom = (() => {
    switch (bottomType) {
      case 'relaxed_baggy_jeans':
      case 'boyfriend_jeans':
      case 'jeans':
        return 'relaxed_baggy_jeans';

      case 'wide_cargo_pants':
      case 'cargo_pants':
      case 'cargo':
        return 'wide_cargo_pants';

      case 'tailored_slacks':
      case 'slacks':
        return 'tailored_slacks';

      case 'sporty_sweatpants':
      case 'sweatpants':
      case 'joggers':
        return 'sporty_sweatpants';

      case 'cargo_shorts':
      case 'shorts':
        return 'cargo_shorts';

      case 'pleated_skirt':
      case 'skater_skirt':
      case 'maxi_skirt':
        return 'pleated_skirt';

      case 'leather_pants':
        return 'leather_pants';

      case 'ripped_jeans':
        return 'ripped_jeans';

      case 'yoga_pants':
        return 'yoga_pants';

      case 'denim_shorts':
        return 'denim_shorts';

      default:
        return 'relaxed_baggy_jeans';
    }
  })();

  const normalizedShoes = (() => {
    switch (shoes) {
      case 'chunky_sneakers':
      case 'white_sneakers':
      case 'sneakers':
        return 'chunky_sneakers';

      case 'hightop_canvas':
        return 'hightop_canvas';

      case 'leather_loafers':
      case 'loafers':
        return 'leather_loafers';

      case 'combat_boots':
      case 'boots':
        return 'combat_boots';

      case 'mary_jane':
        return 'mary_jane';

      case 'slippers':
      case 'sandals':
        return 'slippers';

      default:
        return 'chunky_sneakers';
    }
  })();

  // =========================================================================
  // BACK VIEW CLOTHING
  // =========================================================================
  if (viewAngle === 'back') {
    return (
      <g id="avatar-clothing-back">
        {/* Pants / Skirt from behind */}
        {normalizedBottom === 'pleated_skirt' ? (
          <path
            d="M 88 188 
               C 86 184, 154 184, 152 188 
               C 158 206, 174 234, 170 236 
               C 166 238, 74 238, 70 236 
               C 66 234, 82 206, 88 188 
               Z"
            fill={bottomColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
          />
        ) : (
          <path
            d="M 86 186 
               C 84 182, 156 182, 154 186 
               C 158 214, 158 248, 156 280 
               L 134 280 
               C 134 250, 130 220, 120 208 
               C 110 220, 106 250, 106 280 
               L 84 280 
               C 82 248, 82 214, 86 186 
               Z"
            fill={bottomColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
          />
        )}

        {/* Top from behind with natural shoulder drape */}
        <path
          d="M 108 138 
             C 92 140, 84 148, 82 158 
             C 80 170, 84 186, 88 196 
             C 96 198, 144 198, 152 196 
             C 156 186, 160 170, 158 158 
             C 156 148, 148 140, 132 138 
             Z"
          fill={topColor}
          stroke={lineStroke}
          strokeWidth={strokeW}
        />
        {/* Sleeves from behind */}
        <path d="M 84 150 C 72 164, 66 184, 62 202 L 74 204 C 78 188, 84 170, 90 156 Z" fill={topColor} stroke={lineStroke} strokeWidth={strokeW} />
        <path d="M 156 150 C 168 164, 174 184, 178 202 L 166 204 C 162 188, 156 170, 150 156 Z" fill={topColor} stroke={lineStroke} strokeWidth={strokeW} />
      </g>
    );
  }

  // =========================================================================
  // FRONT VIEW CLOTHING
  // =========================================================================
  return (
    <g id="avatar-clothing-front">
      {/* ------------------------------------------------------------------- */}
      {/* 1. SOCKS & SHOES */}
      {/* ------------------------------------------------------------------- */}
      <g id="clothing-shoes-group">
        {/* A. Chunky Sneakers with Curved Thick Soles (청키 스니커즈) */}
        {normalizedShoes === 'chunky_sneakers' && (
          <g id="chunky-sneakers">
            {/* Left Sneaker */}
            <g id="left-sneaker">
              {/* Curved Chunky Sole */}
              <path
                d="M 82 296 
                   C 80 290, 88 282, 98 282 
                   C 108 282, 114 290, 114 298 
                   C 114 308, 80 310, 82 296 
                   Z"
                fill={shoesColor}
                stroke={lineStroke}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              {/* Dynamic Curved Wave Midsole */}
              <path d="M 82 300 Q 98 306 114 300" stroke="#0F172A" strokeWidth="2.5" fill="none" />
              {/* Sneaker Upper Details & Laces */}
              <path d="M 88 286 C 92 284, 104 284, 108 286" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M 88 290 C 92 288, 104 288, 108 290" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M 88 294 C 92 292, 104 292, 108 294" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <circle cx="98" cy="286" r="1.5" fill="#3B82F6" />
            </g>

            {/* Right Sneaker */}
            <g id="right-sneaker">
              <path
                d="M 126 298 
                   C 126 290, 132 282, 142 282 
                   C 152 282, 160 290, 158 296 
                   C 160 310, 126 308, 126 298 
                   Z"
                fill={shoesColor}
                stroke={lineStroke}
                strokeWidth={strokeW}
                strokeLinejoin="round"
              />
              <path d="M 126 300 Q 142 306 158 300" stroke="#0F172A" strokeWidth="2.5" fill="none" />
              <path d="M 132 286 C 136 284, 148 284, 152 286" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M 132 290 C 136 288, 148 288, 152 290" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M 132 294 C 136 292, 148 292, 152 294" stroke="#94A3B8" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <circle cx="142" cy="286" r="1.5" fill="#3B82F6" />
            </g>
          </g>
        )}

        {/* B. High-Top Canvas Sneakers (하이탑 캔버스) */}
        {normalizedShoes === 'hightop_canvas' && (
          <g id="hightop-canvas">
            {/* Left High Top */}
            <path
              d="M 86 276 
                 C 86 270, 102 270, 104 276 
                 L 110 294 
                 C 112 304, 82 306, 84 294 
                 Z"
              fill={shoesColor === '#FFFFFF' ? '#EF4444' : shoesColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* White Rubber Toe Cap */}
            <path d="M 84 294 C 84 304, 110 304, 110 294" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.8" />
            {/* Ankle Star Patch */}
            <circle cx="95" cy="282" r="3.5" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1" />
            <polygon points="95,280 96,283 93,281 97,281 94,283" fill="#EF4444" />

            {/* Right High Top */}
            <path
              d="M 136 276 
                 C 138 270, 154 270, 154 276 
                 L 156 294 
                 C 158 304, 128 306, 130 294 
                 Z"
              fill={shoesColor === '#FFFFFF' ? '#EF4444' : shoesColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <path d="M 130 294 C 130 304, 156 304, 156 294" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.8" />
            <circle cx="145" cy="282" r="3.5" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1" />
            <polygon points="145,280 146,283 143,281 147,281 144,283" fill="#EF4444" />
          </g>
        )}

        {/* C. Leather Loafers (클래식 로퍼) */}
        {normalizedShoes === 'leather_loafers' && (
          <g id="leather-loafers">
            <path
              d="M 84 288 
                 C 86 280, 108 280, 110 288 
                 C 112 298, 108 306, 96 306 
                 C 84 306, 82 298, 84 288 
                 Z"
              fill="#1E1B4B"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <rect x="88" y="286" width="18" height="5" rx="2" fill="#312E81" stroke="#FDE047" strokeWidth="1.2" />

            <path
              d="M 130 288 
                 C 132 280, 154 280, 156 288 
                 C 158 298, 154 306, 144 306 
                 C 132 306, 128 298, 130 288 
                 Z"
              fill="#1E1B4B"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <rect x="134" y="286" width="18" height="5" rx="2" fill="#312E81" stroke="#FDE047" strokeWidth="1.2" />
          </g>
        )}

        {/* D. Mary Jane & Frilly Socks (메리제인 & 프릴 양말) */}
        {normalizedShoes === 'mary_jane' && (
          <g id="mary-jane-shoes">
            {/* Frilly socks */}
            <path d="M 88 276 C 88 272, 102 272, 102 276 L 102 288 L 88 288 Z" fill="#F0F9FF" stroke={lineStroke} strokeWidth="1.8" />
            <path d="M 86 276 Q 95 272 104 276" stroke="#38BDF8" strokeWidth="2" fill="none" />
            <path d="M 138 276 C 138 272, 152 272, 152 276 L 152 288 L 138 288 Z" fill="#F0F9FF" stroke={lineStroke} strokeWidth="1.8" />
            <path d="M 136 276 Q 145 272 154 276" stroke="#38BDF8" strokeWidth="2" fill="none" />

            {/* Left Shoe */}
            <path
              d="M 84 288 C 86 280, 108 280, 110 288 C 112 298, 108 306, 96 306 C 84 306, 82 298, 84 288 Z"
              fill="#0F172A"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <path d="M 86 288 Q 97 292 108 288" stroke="#FFFFFF" strokeWidth="2" fill="none" />
            {/* Right Shoe */}
            <path
              d="M 130 288 C 132 280, 154 280, 156 288 C 158 298, 154 306, 144 306 C 132 306, 128 298, 130 288 Z"
              fill="#0F172A"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <path d="M 132 288 Q 143 292 154 288" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          </g>
        )}

        {/* E. Combat Boots (워커 부츠) */}
        {normalizedShoes === 'combat_boots' && (
          <g id="combat-boots">
            <path
              d="M 84 272 C 86 266, 106 266, 108 272 L 112 294 C 114 306, 80 306, 82 294 Z"
              fill="#1E293B"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <line x1="88" y1="276" x2="104" y2="276" stroke="#FDE047" strokeWidth="1.5" />
            <line x1="88" y1="282" x2="104" y2="282" stroke="#FDE047" strokeWidth="1.5" />

            <path
              d="M 132 272 C 134 266, 154 266, 156 272 L 158 294 C 160 306, 126 306, 128 294 Z"
              fill="#1E293B"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <line x1="136" y1="276" x2="152" y2="276" stroke="#FDE047" strokeWidth="1.5" />
            <line x1="136" y1="282" x2="152" y2="282" stroke="#FDE047" strokeWidth="1.5" />
          </g>
        )}

        {/* F. Casual Slippers (슬라이드) */}
        {normalizedShoes === 'slippers' && (
          <g id="casual-slippers">
            <ellipse cx="96" cy="298" rx="14" ry="7" fill="#E2E8F0" stroke={lineStroke} strokeWidth="2" />
            <path d="M 85 292 C 88 286, 104 286, 107 292 L 105 298 L 87 298 Z" fill="#0284C7" stroke={lineStroke} strokeWidth="1.8" />

            <ellipse cx="144" cy="298" rx="14" ry="7" fill="#E2E8F0" stroke={lineStroke} strokeWidth="2" />
            <path d="M 133 292 C 136 286, 152 286, 155 292 L 153 298 L 135 298 Z" fill="#0284C7" stroke={lineStroke} strokeWidth="1.8" />
          </g>
        )}
      </g>

      {/* ------------------------------------------------------------------- */}
      {/* 2. BOTTOMS (Natural curves, realistic denim/cotton folds) */}
      {/* ------------------------------------------------------------------- */}
      <g id="clothing-bottoms-group">
        {/* A. Relaxed Baggy Jeans / Boyfriend Jeans (와이드 배기 청바지) */}
        {(normalizedBottom === 'relaxed_baggy_jeans' || normalizedBottom === 'ripped_jeans') && (
          <g id="relaxed-baggy-jeans">
            {/* Natural curved denim silhouette flowing over knees to ankles */}
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 158 208, 160 242, 156 280 
                 L 132 280 
                 C 134 254, 130 224, 120 210 
                 C 110 224, 106 254, 108 280 
                 L 84 280 
                 C 80 242, 82 208, 88 186 
                 Z"
              fill={bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Denim Waistband & Fly Stitch */}
            <path d="M 88 190 Q 120 194 152 190" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" fill="none" />
            <line x1="120" y1="190" x2="120" y2="206" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
            {/* Curved Thigh & Knee Crease Folds */}
            <path d="M 86 236 Q 96 242 105 236" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 135 236 Q 144 242 154 236" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 86 260 Q 96 266 106 260" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M 134 260 Q 144 266 154 260" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Ripped knee holes if ripped_jeans */}
            {normalizedBottom === 'ripped_jeans' && (
              <g id="ripped-details">
                <rect x="90" y="240" width="12" height="4" rx="2" fill="#FFE7D6" stroke={lineStroke} strokeWidth="1.2" />
                <line x1="91" y1="242" x2="101" y2="242" stroke="#FFFFFF" strokeWidth="1" />
                <rect x="138" y="244" width="12" height="4" rx="2" fill="#FFE7D6" stroke={lineStroke} strokeWidth="1.2" />
              </g>
            )}

            {/* Rolled-up Cuffs */}
            <rect x="83" y="274" width="26" height="7" rx="2" fill="#E2E8F0" stroke={lineStroke} strokeWidth="1.8" />
            <rect x="131" y="274" width="26" height="7" rx="2" fill="#E2E8F0" stroke={lineStroke} strokeWidth="1.8" />
          </g>
        )}

        {/* B. Wide Street Cargo Pants (와이드 스트릿 카고팬츠) */}
        {normalizedBottom === 'wide_cargo_pants' && (
          <g id="wide-cargo-pants">
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 160 210, 164 246, 158 282 
                 L 132 282 
                 C 134 252, 130 224, 120 210 
                 C 110 224, 106 252, 108 282 
                 L 82 282 
                 C 76 246, 80 210, 88 186 
                 Z"
              fill={bottomColor === '#5B84B1' ? '#334155' : bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* 3D Cargo Flap Pockets on Thighs with Curved corners */}
            <g id="left-cargo-pocket">
              <rect x="74" y="226" width="16" height="22" rx="3" fill="#1E293B" stroke={lineStroke} strokeWidth="1.8" />
              <path d="M 73 226 L 91 226 L 89 232 L 75 232 Z" fill="#0F172A" stroke={lineStroke} strokeWidth="1.5" />
              <circle cx="82" cy="235" r="1.5" fill="#94A3B8" />
            </g>
            <g id="right-cargo-pocket">
              <rect x="150" y="226" width="16" height="22" rx="3" fill="#1E293B" stroke={lineStroke} strokeWidth="1.8" />
              <path d="M 149 226 L 167 226 L 165 232 L 151 232 Z" fill="#0F172A" stroke={lineStroke} strokeWidth="1.5" />
              <circle cx="158" cy="235" r="1.5" fill="#94A3B8" />
            </g>
            {/* Ankle Cinch Drawstrings */}
            <line x1="82" y1="280" x2="108" y2="280" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="132" y1="280" x2="158" y2="280" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* C. Tailored Slacks (테일러드 슬랙스) */}
        {normalizedBottom === 'tailored_slacks' && (
          <g id="tailored-slacks">
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 156 214, 154 250, 152 284 
                 L 134 284 
                 C 136 250, 132 222, 120 210 
                 C 108 222, 104 250, 106 284 
                 L 88 284 
                 C 84 250, 84 214, 88 186 
                 Z"
              fill={bottomColor === '#5B84B1' ? '#1E293B' : bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Crisp tailored crease lines down center of each leg */}
            <line x1="97" y1="196" x2="97" y2="282" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
            <line x1="143" y1="196" x2="143" y2="282" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          </g>
        )}

        {/* D. Sporty Sweatpants (사이드라인 조거팬츠) */}
        {normalizedBottom === 'sporty_sweatpants' && (
          <g id="sporty-sweatpants">
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 158 212, 156 248, 150 280 
                 L 134 280 
                 C 136 250, 132 222, 120 210 
                 C 108 222, 104 250, 106 280 
                 L 90 280 
                 C 82 248, 82 212, 88 186 
                 Z"
              fill={bottomColor === '#5B84B1' ? '#475569' : bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Side Racing Stripe with soft curves */}
            <path d="M 88 188 C 83 220, 84 254, 91 280" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
            <path d="M 152 188 C 157 220, 156 254, 149 280" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
            {/* Gathered Cuffed Ankles */}
            <rect x="88" y="276" width="18" height="6" rx="2" fill="#334155" stroke={lineStroke} strokeWidth="1.5" />
            <rect x="134" y="276" width="18" height="6" rx="2" fill="#334155" stroke={lineStroke} strokeWidth="1.5" />
          </g>
        )}

        {/* E. Cargo / Casual Shorts (카고 반바지) */}
        {normalizedBottom === 'cargo_shorts' && (
          <g id="cargo-shorts">
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 158 206, 160 228, 156 248 
                 L 132 248 
                 C 132 232, 128 218, 120 210 
                 C 112 218, 108 232, 108 248 
                 L 84 248 
                 C 80 228, 82 206, 88 186 
                 Z"
              fill={bottomColor === '#5B84B1' ? '#D97706' : bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Side flap pockets */}
            <rect x="76" y="218" width="12" height="16" rx="2" fill="#B45309" stroke={lineStroke} strokeWidth="1.5" />
            <rect x="152" y="218" width="12" height="16" rx="2" fill="#B45309" stroke={lineStroke} strokeWidth="1.5" />
          </g>
        )}

        {/* F. Pleated Tennis Skirt (플리츠 테니스 스커트 with Plaid Lines) */}
        {normalizedBottom === 'pleated_skirt' && (
          <g id="pleated-skirt">
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 158 206, 174 234, 170 236 
                 C 166 238, 74 238, 70 236 
                 C 66 234, 82 206, 88 186 
                 Z"
              fill={bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Plaid criss-cross accents */}
            <path d="M 74 226 Q 120 230 166 226" stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="5,3" fill="none" />
            <path d="M 78 212 Q 120 216 162 212" stroke="#FFFFFF" strokeWidth="1.8" strokeDasharray="5,3" fill="none" />
            {/* Soft pleat folds */}
            <line x1="90" y1="188" x2="84" y2="236" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
            <line x1="102" y1="188" x2="98" y2="236" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
            <line x1="114" y1="188" x2="114" y2="236" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
            <line x1="126" y1="188" x2="126" y2="236" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
            <line x1="138" y1="188" x2="142" y2="236" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
            <line x1="150" y1="188" x2="156" y2="236" stroke="rgba(0,0,0,0.22)" strokeWidth="1.5" />
          </g>
        )}

        {/* G. Leather / Yoga Skinny Pants (레더/요가 스키니) */}
        {(normalizedBottom === 'leather_pants' || normalizedBottom === 'yoga_pants') && (
          <g id="skinny-pants">
            <path
              d="M 88 186 
                 C 86 182, 154 182, 152 186 
                 C 156 214, 154 250, 150 284 
                 L 136 284 
                 C 138 250, 132 222, 120 210 
                 C 108 222, 102 250, 104 284 
                 L 90 284 
                 C 86 250, 84 214, 88 186 
                 Z"
              fill={normalizedBottom === 'leather_pants' ? '#0F172A' : bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Sleek sheen highlight */}
            {normalizedBottom === 'leather_pants' && (
              <>
                <path d="M 94 200 C 92 224, 94 250, 96 270" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 146 200 C 148 224, 146 250, 144 270" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" fill="none" />
              </>
            )}
          </g>
        )}

        {/* H. Denim Shorts (데님 숏팬츠) */}
        {normalizedBottom === 'denim_shorts' && (
          <g id="denim-shorts">
            <path
              d="M 88 186 C 86 182, 154 182, 152 186 C 156 204, 158 222, 154 238 L 132 238 C 130 224, 126 214, 120 210 C 114 214, 110 224, 108 238 L 86 238 C 82 222, 84 204, 88 186 Z"
              fill={bottomColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Frayed hem stitches */}
            <path d="M 86 238 Q 97 242 108 238" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeDasharray="3,2" />
            <path d="M 132 238 Q 143 242 154 238" stroke="#FFFFFF" strokeWidth="1.5" fill="none" strokeDasharray="3,2" />
          </g>
        )}
      </g>

      {/* ------------------------------------------------------------------- */}
      {/* 3. TOPS (Natural Bezier curves, realistic drape, stylish designs) */}
      {/* ------------------------------------------------------------------- */}
      <g id="clothing-tops-group">
        {/* A. Casual Oversized T-Shirt (오버핏 캐주얼 티셔츠) */}
        {normalizedTop === 'casual_oversized_tee' && (
          <g id="casual-oversized-tee">
            {/* Torso Drape */}
            <path
              d="M 108 138 
                 C 94 140, 84 146, 80 156 
                 C 78 170, 82 186, 86 196 
                 C 96 198, 144 198, 154 196 
                 C 158 186, 162 170, 160 156 
                 C 156 146, 146 140, 132 138 
                 Z"
              fill={topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Crewneck Ribbing with Smooth Curve */}
            <path d="M 112 138 C 112 144, 128 144, 128 138" stroke={lineStroke} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M 114 141 C 114 145, 126 145, 126 141" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />

            {/* Drop Shoulder Curved Short Sleeves */}
            <path
              d="M 80 152 
                 C 70 162, 64 174, 60 186 
                 L 72 190 
                 C 76 180, 80 170, 84 162 
                 Z"
              fill={topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <path
              d="M 160 152 
                 C 170 162, 176 174, 180 186 
                 L 168 190 
                 C 164 180, 160 170, 156 162 
                 Z"
              fill={topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />

            {/* Front Graphic / Typography (Wave Sunset or Minimal Box) */}
            <g transform="translate(112, 160)" id="tee-graphic">
              <circle cx="8" cy="8" r="7" fill="#F97316" opacity="0.85" />
              <path d="M 2 12 Q 8 8 14 12" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
              <rect x="2" y="16" width="12" height="2" rx="1" fill="#334155" />
            </g>

            {/* Natural hem curve folds */}
            <path d="M 88 194 Q 120 198 152 194" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" fill="none" />
          </g>
        )}

        {/* B. Varsity Stadium Jacket (바시티 스타디움 자켓) */}
        {normalizedTop === 'varsity_jacket' && (
          <g id="varsity-jacket">
            {/* Jacket Body */}
            <path
              d="M 108 138 
                 C 92 140, 82 148, 80 160 
                 C 78 174, 82 188, 86 198 
                 C 96 200, 144 200, 154 198 
                 C 158 188, 162 174, 160 160 
                 C 158 148, 148 140, 132 138 
                 Z"
              fill={topColor === '#FFFFFF' ? '#1E3A8A' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Striped Ribbed Collar */}
            <path d="M 112 138 C 112 144, 128 144, 128 138" stroke="#FBBF24" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 113 140 C 113 145, 127 145, 127 140" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

            {/* Two-Tone Curved Sleeves (Leather White) */}
            <path
              d="M 82 150 
                 C 72 164, 66 182, 62 202 
                 L 74 204 
                 C 78 188, 84 172, 90 158 
                 Z"
              fill="#FFFFFF"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <path
              d="M 158 150 
                 C 168 164, 174 182, 178 202 
                 L 166 204 
                 C 162 188, 156 172, 150 158 
                 Z"
              fill="#FFFFFF"
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Striped Cuffs */}
            <rect x="62" y="198" width="12" height="6" rx="2" fill="#FBBF24" stroke={lineStroke} strokeWidth="1.5" />
            <rect x="166" y="198" width="12" height="6" rx="2" fill="#FBBF24" stroke={lineStroke} strokeWidth="1.5" />

            {/* Varsity Letter 'A' Emblem & Snaps */}
            <g transform="translate(100, 156)">
              <rect x="-3" y="-3" width="12" height="12" rx="3" fill="#FBBF24" stroke={lineStroke} strokeWidth="1.2" />
              <text x="3" y="6" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#1E3A8A">S</text>
            </g>
            {/* Snap Buttons */}
            <circle cx="120" cy="154" r="2" fill="#FBBF24" stroke={lineStroke} strokeWidth="1" />
            <circle cx="120" cy="168" r="2" fill="#FBBF24" stroke={lineStroke} strokeWidth="1" />
            <circle cx="120" cy="182" r="2" fill="#FBBF24" stroke={lineStroke} strokeWidth="1" />
            {/* Curved Welt Pockets */}
            <path d="M 94 182 Q 102 188 108 184" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 146 182 Q 138 188 132 184" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Striped Bottom Rib */}
            <rect x="85" y="194" width="70" height="6" rx="2" fill="#FBBF24" stroke={lineStroke} strokeWidth="1.5" />
          </g>
        )}

        {/* C. Streetwear Oversized Hoodie (스트릿 오버핏 후드) */}
        {normalizedTop === 'streetwear_hoodie' && (
          <g id="streetwear-hoodie">
            {/* Hoodie Body with soft curved volume */}
            <path
              d="M 106 136 
                 C 90 140, 80 150, 78 162 
                 C 76 178, 80 196, 84 202 
                 C 94 204, 146 204, 156 202 
                 C 160 196, 164 178, 162 162 
                 C 160 150, 150 140, 134 136 
                 Z"
              fill={topColor === '#FFFFFF' ? '#475569' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Deep Relaxed Hood Drape Collar */}
            <path
              d="M 104 136 C 104 148, 120 152, 136 136 C 140 144, 100 144, 104 136 Z"
              fill={topColor === '#FFFFFF' ? '#334155' : topColor}
              stroke={lineStroke}
              strokeWidth="2"
            />
            {/* Curved Pouch Kangaroo Pocket */}
            <path
              d="M 98 174 
                 C 106 172, 134 172, 142 174 
                 L 138 198 
                 C 120 200, 120 200, 102 198 
                 Z"
              fill="rgba(0,0,0,0.12)"
              stroke={lineStroke}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            {/* Hanging Drawstrings with gentle wave curves */}
            <path d="M 114 142 C 112 152, 116 160, 112 168" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 126 142 C 128 152, 124 160, 128 168" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Roomy Sleeves */}
            <path d="M 80 148 C 70 162, 64 182, 60 202 L 72 204 C 76 188, 82 172, 88 156 Z" fill={topColor === '#FFFFFF' ? '#475569' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 160 148 C 170 162, 176 182, 180 202 L 168 204 C 164 188, 158 172, 152 156 Z" fill={topColor === '#FFFFFF' ? '#475569' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            {/* Ribbed Cuffs */}
            <rect x="59" y="198" width="14" height="6" rx="2" fill="rgba(0,0,0,0.2)" stroke={lineStroke} strokeWidth="1.5" />
            <rect x="167" y="198" width="14" height="6" rx="2" fill="rgba(0,0,0,0.2)" stroke={lineStroke} strokeWidth="1.5" />
          </g>
        )}

        {/* D. Formal Suit Blazer & Tie (테일러드 수트 & 넥타이) */}
        {normalizedTop === 'formal_blazer_tie' && (
          <g id="formal-blazer-tie">
            {/* Suit Torso */}
            <path
              d="M 108 138 
                 C 94 140, 84 146, 82 158 
                 C 80 172, 84 188, 88 198 
                 C 96 200, 144 200, 152 198 
                 C 156 188, 160 172, 158 158 
                 C 156 146, 146 140, 132 138 
                 Z"
              fill={topColor === '#FFFFFF' ? '#1E293B' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Inner White Shirt */}
            <polygon points="120,172 108,138 132,138" fill="#FFFFFF" />

            {/* Sleek Necktie with Knot & Angled Tip */}
            <polygon points="120,146 116,142 124,142" fill="#E11D48" stroke={lineStroke} strokeWidth="1.2" />
            <polygon points="120,146 116,172 120,178 124,172" fill="#E11D48" stroke={lineStroke} strokeWidth="1.5" />

            {/* Suit Lapels with Graceful Notched Curves */}
            <path d="M 108 138 L 102 154 L 110 156 L 120 174 L 108 174 Z" fill={topColor === '#FFFFFF' ? '#334155' : topColor} stroke={lineStroke} strokeWidth="1.8" />
            <path d="M 132 138 L 138 154 L 130 156 L 120 174 L 132 174 Z" fill={topColor === '#FFFFFF' ? '#334155' : topColor} stroke={lineStroke} strokeWidth="1.8" />

            {/* Pocket Square Handkerchief */}
            <line x1="94" y1="164" x2="104" y2="164" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />

            {/* Suit Sleeves */}
            <path d="M 82 150 C 72 164, 66 184, 62 202 L 74 204 C 78 188, 84 170, 90 156 Z" fill={topColor === '#FFFFFF' ? '#1E293B' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 158 150 C 168 164, 174 184, 178 202 L 166 204 C 162 188, 156 170, 150 156 Z" fill={topColor === '#FFFFFF' ? '#1E293B' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            {/* White Shirt Cuffs peeking out */}
            <rect x="62" y="200" width="12" height="4" rx="1" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.2" />
            <rect x="166" y="200" width="12" height="4" rx="1" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.2" />
          </g>
        )}

        {/* E. Vintage Denim Jacket (빈티지 청자켓) */}
        {normalizedTop === 'denim_jacket' && (
          <g id="denim-jacket">
            <path
              d="M 108 138 C 94 140, 84 146, 82 158 C 80 172, 84 188, 88 196 C 96 198, 144 198, 152 196 C 156 188, 160 172, 158 158 C 156 146, 146 140, 132 138 Z"
              fill={topColor === '#FFFFFF' ? '#2563EB' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Pointed Denim Collar */}
            <polygon points="120,146 106,138 114,146" fill="#1D4ED8" stroke={lineStroke} strokeWidth="1.5" />
            <polygon points="120,146 134,138 126,146" fill="#1D4ED8" stroke={lineStroke} strokeWidth="1.5" />
            {/* Dual Flap Pockets */}
            <rect x="92" y="156" width="12" height="10" rx="2" fill="#1D4ED8" stroke={lineStroke} strokeWidth="1.5" />
            <rect x="136" y="156" width="12" height="10" rx="2" fill="#1D4ED8" stroke={lineStroke} strokeWidth="1.5" />
            {/* Silver Button Placket */}
            <line x1="120" y1="146" x2="120" y2="194" stroke="#FDE047" strokeWidth="1.8" strokeDasharray="6,6" strokeLinecap="round" />
            {/* Sleeves */}
            <path d="M 82 150 C 72 164, 66 184, 62 202 L 74 204 C 78 188, 84 170, 90 156 Z" fill={topColor === '#FFFFFF' ? '#2563EB' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 158 150 C 168 164, 174 184, 178 202 L 166 204 C 162 188, 156 170, 150 156 Z" fill={topColor === '#FFFFFF' ? '#2563EB' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
          </g>
        )}

        {/* F. MA-1 Bomber Jacket (항공 점퍼) */}
        {normalizedTop === 'bomber_ma1' && (
          <g id="bomber-jacket">
            <path
              d="M 108 138 C 90 140, 80 150, 78 164 C 76 180, 80 196, 86 200 C 96 202, 144 202, 154 200 C 160 196, 164 180, 162 164 C 160 150, 150 140, 132 138 Z"
              fill={topColor === '#FFFFFF' ? '#14532D' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Center Front Metal Zipper */}
            <line x1="120" y1="140" x2="120" y2="198" stroke="#D1D5DB" strokeWidth="2.5" />
            {/* Left Arm Utility Zip Pocket (Iconic MA-1 Detail) */}
            <rect x="64" y="172" width="10" height="14" rx="2" fill="#052E16" stroke={lineStroke} strokeWidth="1.5" />
            <path d="M 72 178 L 74 190" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            {/* Sleeves */}
            <path d="M 80 148 C 68 162, 62 182, 58 202 L 70 204 C 74 188, 80 172, 86 156 Z" fill={topColor === '#FFFFFF' ? '#14532D' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 160 148 C 172 162, 178 182, 182 202 L 170 204 C 166 188, 160 172, 154 156 Z" fill={topColor === '#FFFFFF' ? '#14532D' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
          </g>
        )}

        {/* G. School Cardigan & Tie / Ribbon (스쿨 가디건) */}
        {normalizedTop === 'school_cardigan' && (
          <g id="school-cardigan">
            <path
              d="M 108 140 
                 C 94 142, 86 148, 84 158 
                 C 82 168, 86 182, 88 194 
                 C 94 196, 146 196, 152 194 
                 C 154 182, 158 168, 156 158 
                 C 154 148, 146 142, 132 140 
                 Z"
              fill={topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Sailor V-Neck */}
            <polygon points="120,166 108,140 132,140" fill="#1E3A8A" />
            <line x1="120" y1="140" x2="120" y2="166" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Tie / Sailor Ribbon */}
            <polygon points="120,154 110,146 110,158" fill="#1E40AF" stroke={lineStroke} strokeWidth="1.5" />
            <polygon points="120,154 130,146 130,158" fill="#1E40AF" stroke={lineStroke} strokeWidth="1.5" />
            <circle cx="120" cy="154" r="3" fill="#1E40AF" stroke={lineStroke} strokeWidth="1" />
            <path d="M 118 156 L 114 172" stroke="#1E40AF" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 122 156 L 126 172" stroke="#1E40AF" strokeWidth="3.5" strokeLinecap="round" />

            {/* Sleeves */}
            <path d="M 86 150 C 76 162, 70 178, 66 196 L 78 200 C 82 186, 86 170, 92 158 Z" fill={topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 154 150 C 164 162, 170 178, 174 196 L 162 200 C 158 186, 154 170, 148 158 Z" fill={topColor} stroke={lineStroke} strokeWidth={strokeW} />
          </g>
        )}

        {/* H. Cable Knit Sweater (도톰 꽈배기 니트) */}
        {normalizedTop === 'cable_knit' && (
          <g id="cable-knit-sweater">
            <path
              d="M 108 140 C 94 142, 84 150, 82 160 C 80 174, 84 188, 88 196 C 96 198, 144 198, 152 196 C 156 188, 160 174, 158 160 C 156 150, 146 142, 132 140 Z"
              fill={topColor === '#FFFFFF' ? '#DDD6FE' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Cable knit braided texture */}
            <path d="M 106 144 Q 108 170 106 194" stroke="rgba(0,0,0,0.15)" strokeWidth="2.2" strokeDasharray="5,4" fill="none" />
            <path d="M 120 144 Q 120 170 120 194" stroke="rgba(0,0,0,0.15)" strokeWidth="2.2" strokeDasharray="5,4" fill="none" />
            <path d="M 134 144 Q 132 170 134 194" stroke="rgba(0,0,0,0.15)" strokeWidth="2.2" strokeDasharray="5,4" fill="none" />
            {/* Sleeves */}
            <path d="M 84 150 C 74 164, 68 184, 64 204 L 76 206 C 80 190, 84 172, 90 156 Z" fill={topColor === '#FFFFFF' ? '#DDD6FE' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 156 150 C 166 164, 172 184, 176 204 L 164 206 C 160 190, 156 172, 150 156 Z" fill={topColor === '#FFFFFF' ? '#DDD6FE' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
          </g>
        )}

        {/* I. Sporty Jersey (스포티 져지) */}
        {normalizedTop === 'football_jersey' && (
          <g id="football-jersey">
            <path
              d="M 108 138 C 94 140, 84 146, 80 156 C 78 170, 82 186, 86 196 C 96 198, 144 198, 154 196 C 158 186, 162 170, 160 156 C 156 146, 146 140, 132 138 Z"
              fill={topColor === '#FFFFFF' ? '#DC2626' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Sport Number 07 */}
            <text x="120" y="174" fontSize="16" fontWeight="900" textAnchor="middle" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1">07</text>
            {/* Dual Sleeve Racing Stripes */}
            <path d="M 72 168 L 64 178" stroke="#FFFFFF" strokeWidth="3" />
            <path d="M 168 168 L 176 178" stroke="#FFFFFF" strokeWidth="3" />
            {/* Sleeves */}
            <path d="M 80 152 C 70 162, 64 174, 60 186 L 72 190 C 76 180, 80 170, 84 162 Z" fill={topColor === '#FFFFFF' ? '#DC2626' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 160 152 C 170 162, 176 174, 180 186 L 168 190 C 164 180, 160 170, 156 162 Z" fill={topColor === '#FFFFFF' ? '#DC2626' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
          </g>
        )}

        {/* J. Off-Shoulder Frill Blouse (오프숄더 블라우스) */}
        {normalizedTop === 'off_shoulder' && (
          <g id="off-shoulder-top">
            <path
              d="M 76 154 C 90 150, 150 150, 164 154 C 162 170, 156 186, 152 192 C 146 194, 94 194, 88 192 C 84 186, 78 170, 76 154 Z"
              fill={topColor === '#FFFFFF' ? '#FDA4AF' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Flowing Chest Frills */}
            <path d="M 76 154 Q 120 162 164 154" stroke="#F43F5E" strokeWidth="2.5" fill="none" />
            <path d="M 78 160 Q 120 168 162 160" stroke="#F43F5E" strokeWidth="1.5" fill="none" opacity="0.7" />
          </g>
        )}

        {/* K. Crop Top Floral (플라워 크롭탑) */}
        {normalizedTop === 'crop_top_floral' && (
          <g id="crop-top">
            <path
              d="M 108 140 C 94 142, 84 148, 82 156 C 80 166, 84 176, 88 180 C 96 182, 144 182, 152 180 C 156 176, 160 166, 158 156 C 156 148, 146 142, 132 140 Z"
              fill={topColor === '#FFFFFF' ? '#FEF08A' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <circle cx="106" cy="160" r="2.5" fill="#F43F5E" />
            <circle cx="134" cy="160" r="2.5" fill="#F43F5E" />
            <circle cx="120" cy="168" r="2.5" fill="#F43F5E" />
          </g>
        )}

        {/* L. Hanbok Jeogori (전통 한복 당의/저고리) */}
        {normalizedTop === 'hanbok_top' && (
          <g id="hanbok-jeogori">
            <path
              d="M 108 140 C 94 142, 84 150, 82 160 C 80 172, 84 184, 88 190 C 100 198, 140 198, 152 190 C 156 184, 160 172, 158 160 C 156 150, 146 142, 132 140 Z"
              fill={topColor === '#FFFFFF' ? '#A7F3D0' : topColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* Dongjeong Collar */}
            <polygon points="120,158 110,140 130,140" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.5" />
            {/* Goreum Ribbon Tie with Flowing Drape */}
            <path d="M 120 156 C 126 166, 128 178, 126 190" stroke="#F43F5E" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Curved Baerae Sleeves */}
            <path d="M 84 148 C 70 162, 64 180, 62 198 L 74 200 C 78 184, 86 168, 92 154 Z" fill={topColor === '#FFFFFF' ? '#A7F3D0' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
            <path d="M 156 148 C 170 162, 176 180, 178 198 L 166 200 C 162 184, 154 168, 148 154 Z" fill={topColor === '#FFFFFF' ? '#A7F3D0' : topColor} stroke={lineStroke} strokeWidth={strokeW} />
          </g>
        )}
      </g>

      {/* ------------------------------------------------------------------- */}
      {/* 4. BAGS & ACCESSORIES (Handbag, Crossbag, Backpack, etc.) */}
      {/* ------------------------------------------------------------------- */}
      <g id="clothing-bags-group">
        {/* Leather Handbag */}
        {bag === 'leather_handbag' && (
          <g transform="translate(164, 212)" id="bag-leather-handbag">
            <rect x="0" y="6" width="30" height="24" rx="5" fill="#FFFFFF" stroke={lineStroke} strokeWidth="2" />
            <path d="M 6 6 C 6 -4 24 -4 24 6" stroke="#1E40AF" strokeWidth="2.8" fill="none" strokeLinecap="round" />
            <path d="M 0 6 L 30 6 L 25 16 L 5 16 Z" fill="#F8FAFC" stroke={lineStroke} strokeWidth="1.5" />
            <rect x="12" y="14" width="6" height="5" rx="1" fill="#FDE047" stroke={lineStroke} strokeWidth="1" />
          </g>
        )}

        {/* Street Crossbody Sling Bag (스트릿 크로스백) */}
        {bag === 'crossbag' && (
          <g id="bag-crossbag">
            {/* Strap crossing chest with natural body curvature */}
            <path d="M 88 144 C 104 162, 136 188, 156 204" stroke="#0F172A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 88 144 C 104 162, 136 188, 156 204" stroke="#38BDF8" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Pouch on hip */}
            <g transform="translate(138, 186) rotate(15)">
              <rect x="0" y="0" width="28" height="18" rx="4" fill="#1E293B" stroke={lineStroke} strokeWidth="1.8" />
              <line x1="4" y1="6" x2="24" y2="6" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
              <circle cx="14" cy="12" r="2" fill="#38BDF8" />
            </g>
          </g>
        )}

        {/* Backpack Straps */}
        {bag === 'backpack' && (
          <g id="bag-backpack-straps">
            <path d="M 94 144 C 90 162, 88 184, 86 196" stroke="#475569" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 146 144 C 150 162, 152 184, 154 196" stroke="#475569" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Canvas Tote Bag */}
        {bag === 'tote' && (
          <g transform="translate(162, 206)" id="bag-canvas-tote">
            <rect x="0" y="8" width="28" height="32" rx="3" fill="#FEF3C7" stroke={lineStroke} strokeWidth="1.8" />
            <path d="M 6 8 C 6 -6 22 -6 22 8" stroke="#D97706" strokeWidth="2.5" fill="none" />
            <circle cx="14" cy="22" r="5" fill="#F43F5E" />
          </g>
        )}
      </g>

      {/* ------------------------------------------------------------------- */}
      {/* 5. ACCESSORIES ON HEAD / FACE (Glasses, Sunglasses, Headphones) */}
      {/* ------------------------------------------------------------------- */}
      <g id="clothing-accessories-group">
        {/* Round Metal Glasses */}
        {accessory === 'glasses_round' && (
          <g id="acc-glasses-round">
            <circle cx="102" cy="100" r="13" fill="rgba(255,255,255,0.2)" stroke="#D97706" strokeWidth="2" />
            <circle cx="138" cy="100" r="13" fill="rgba(255,255,255,0.2)" stroke="#D97706" strokeWidth="2" />
            <line x1="115" y1="100" x2="125" y2="100" stroke="#D97706" strokeWidth="2" />
            <line x1="89" y1="100" x2="72" y2="94" stroke="#D97706" strokeWidth="1.5" />
            <line x1="151" y1="100" x2="168" y2="94" stroke="#D97706" strokeWidth="1.5" />
          </g>
        )}

        {/* Chic Sunglasses */}
        {accessory === 'sunglasses' && (
          <g id="acc-sunglasses">
            <rect x="88" y="90" width="26" height="18" rx="4" fill="#0F172A" stroke={lineStroke} strokeWidth="2" />
            <rect x="126" y="90" width="26" height="18" rx="4" fill="#0F172A" stroke={lineStroke} strokeWidth="2" />
            <line x1="114" y1="96" x2="126" y2="96" stroke="#0F172A" strokeWidth="3" />
            <path d="M 92 94 L 102 104" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 130 94 L 140 104" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Gamer / Wireless Headphones */}
        {accessory === 'headphones' && (
          <g id="acc-headphones">
            {/* Curved Headband resting over crown */}
            <path d="M 64 74 C 74 24, 166 24, 176 74" stroke="#0F172A" strokeWidth="5.5" fill="none" strokeLinecap="round" />
            <path d="M 64 74 C 74 24, 166 24, 176 74" stroke="#38BDF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Left Ear Cushion */}
            <ellipse cx="64" cy="88" rx="7" ry="14" fill="#1E293B" stroke={lineStroke} strokeWidth="2" />
            <circle cx="64" cy="88" r="3" fill="#38BDF8" />
            {/* Right Ear Cushion */}
            <ellipse cx="176" cy="88" rx="7" ry="14" fill="#1E293B" stroke={lineStroke} strokeWidth="2" />
            <circle cx="176" cy="88" r="3" fill="#38BDF8" />
          </g>
        )}

        {/* Cat Ears Headband */}
        {accessory === 'cat_ears' && (
          <g id="acc-cat-ears">
            <path d="M 72 56 C 90 38, 150 38, 168 56" stroke="#0F172A" strokeWidth="3.5" fill="none" />
            <polygon points="76,46 62,18 90,34" fill="#1E293B" stroke={lineStroke} strokeWidth="1.8" />
            <polygon points="74,42 66,24 84,34" fill="#FDA4AF" />
            <polygon points="164,46 178,18 150,34" fill="#1E293B" stroke={lineStroke} strokeWidth="1.8" />
            <polygon points="166,42 174,24 156,34" fill="#FDA4AF" />
          </g>
        )}
      </g>
    </g>
  );
};
