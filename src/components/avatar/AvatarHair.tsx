import React from 'react';

interface AvatarHairProps {
  hairStyle: string;
  hairColor: string;
  viewAngle?: 'front' | 'side' | 'back';
  layer: 'back' | 'front';
  uid: string;
}

export const AvatarHair: React.FC<AvatarHairProps> = ({
  hairStyle = 'two_block_dandy',
  hairColor = '#1E293B',
  viewAngle = 'front',
  layer = 'front',
  uid,
}) => {
  const lineStroke = '#2D170D';
  const strokeW = '2.2';

  // Normalize style identifier
  const style = (() => {
    switch (hairStyle) {
      // Male / Unisex Styles
      case 'two_block_dandy':
      case 'two_block':
      case 'dandy':
        return 'two_block_dandy';

      case 'comma_hair':
      case 'comma':
        return 'comma_hair';

      case 'wolf_cut_messy':
      case 'wolf_cut':
      case 'wolf':
        return 'wolf_cut_messy';

      case 'center_part_wavy':
      case 'center_part':
        return 'center_part_wavy';

      case 'short_spiky':
      case 'short':
      case 'spiky':
      case '7':
        return 'short_spiky';

      case 'beanie_curls':
      case 'beanie':
        return 'beanie_curls';

      case 'side_part_classic':
      case 'classic_part':
        return 'side_part_classic';

      case 'dandy_perm':
      case 'shadow_perm':
        return 'dandy_perm';

      // Female Styles (1 ~ 12 & others)
      case '1':
      case 'blonde_curly_side_pony':
      case 'wavy_medium':
      case 'side_braid':
        return 'blonde_curly_side_pony';

      case '2':
      case 'brown_curly_side_pony':
        return 'brown_curly_side_pony';

      case '3':
      case 'wavy_bob_bangs':
      case 'curly_bob':
        return 'wavy_bob_bangs';

      case '4':
      case 'loose_wavy_twintails':
      case 'twintail':
        return 'loose_wavy_twintails';

      case '5':
      case 'straight_half_up':
        return 'straight_half_up';

      case '6':
      case 'neat_straight_bob':
      case 'bob_cut':
      case 'bob':
        return 'neat_straight_bob';

      case '8':
      case 'hime_cut':
      case 'long_straight':
      case 'long':
      case 'straight':
        return 'hime_cut';

      case '9':
      case 'blonde_wavy_headband':
      case 'curly_perm':
      case 'curly':
        return 'blonde_wavy_headband';

      case '10':
      case 'beret_side_pony':
      case 'beret':
        return 'beret_side_pony';

      case '11':
      case 'wavy_bob_cat_ears':
        return 'wavy_bob_cat_ears';

      case '12':
      case 'pink_pigtails_bows':
      case 'rabbit_ribbon':
        return 'pink_pigtails_bows';

      case 'ponytail':
      case 'high_ponytail':
        return 'ponytail';

      case 'cherry_buns':
      case 'buns':
        return 'cherry_buns';

      case 'short_pixie':
        return 'short_pixie';

      default:
        return 'two_block_dandy';
    }
  })();

  // =========================================================================
  // BACK HAIR LAYER (Behind Head & Body)
  // =========================================================================
  if (layer === 'back') {
    if (viewAngle === 'back') {
      // Full back hair display for 360 rotation
      return (
        <g id="hair-back-full">
          <path
            d="M 64 68 
               C 34 100, 28 160, 44 218 
               C 56 238, 80 230, 88 190 
               L 152 190 
               C 160 230, 184 238, 196 218 
               C 212 160, 206 100, 176 68 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 72 108 C 66 148, 74 186, 82 216" stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none" />
          <path d="M 168 108 C 174 148, 166 186, 158 216" stroke="rgba(0,0,0,0.18)" strokeWidth="2" fill="none" />
          <path d="M 120 86 C 116 128, 120 168, 120 204" stroke="rgba(0,0,0,0.15)" strokeWidth="2" fill="none" />
        </g>
      );
    }

    // Front / Side view - Hair background layer
    switch (style) {
      // Male Wolf Cut (Feathered layers showing behind neck & ears)
      case 'wolf_cut_messy':
        return (
          <g id="hair-back-wolf-cut">
            {/* Left feathered tufts */}
            <path
              d="M 66 78 
                 C 50 100, 46 130, 52 162 
                 C 56 168, 68 164, 76 148 
                 C 80 140, 86 140, 88 132 
                 L 152 132 
                 C 154 140, 160 140, 164 148 
                 C 172 164, 184 168, 188 162 
                 C 194 130, 190 100, 174 78 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinejoin="round"
            />
            {/* Winged tips */}
            <path d="M 52 140 C 44 148, 42 160, 48 166" stroke={lineStroke} strokeWidth="1.8" fill="none" />
            <path d="M 188 140 C 196 148, 198 160, 192 166" stroke={lineStroke} strokeWidth="1.8" fill="none" />
          </g>
        );

      // Male Two-block / Dandy / Perm back neck volume
      case 'two_block_dandy':
      case 'comma_hair':
      case 'center_part_wavy':
      case 'dandy_perm':
      case 'side_part_classic':
        return (
          <g id="hair-back-male-clean">
            <path
              d="M 68 76 
                 C 56 94, 58 118, 68 134 
                 C 76 140, 84 138, 88 130 
                 L 152 130 
                 C 156 138, 164 140, 172 134 
                 C 182 118, 184 94, 172 76 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
          </g>
        );

      // Female: 1 & 2: Curly Side Pony (Blonde or Brown)
      case 'blonde_curly_side_pony':
      case 'brown_curly_side_pony':
      case 'beret_side_pony':
        return (
          <g id="hair-back-side-pony">
            <path
              d="M 62 76 
                 C 36 106, 30 160, 46 220 
                 C 58 238, 82 232, 88 192 
                 L 152 192 
                 C 162 236, 188 244, 202 222 
                 C 218 166, 210 106, 178 76 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Side ponytail bundle on right */}
            <path
              d="M 172 90 
                 C 200 95, 218 130, 212 170 
                 C 206 206, 188 238, 174 246 
                 C 164 246, 168 226, 176 196 
                 C 182 170, 180 134, 168 106 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );

      // High Ponytail
      case 'ponytail':
        return (
          <g id="hair-back-ponytail">
            <path
              d="M 66 78 C 50 102, 48 136, 56 166 C 66 176, 82 174, 88 156 L 152 156 C 158 174, 174 176, 184 166 C 192 136, 190 102, 174 78 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            {/* High swinging ponytail from top */}
            <path
              d="M 120 34 
                 C 154 26, 186 52, 192 96 
                 C 198 140, 186 186, 172 208 
                 C 164 206, 168 178, 172 144 
                 C 176 108, 162 68, 134 46 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
          </g>
        );

      // Female: 3 & 11: Wavy Bob
      case 'wavy_bob_bangs':
      case 'wavy_bob_cat_ears':
        return (
          <g id="hair-back-wavy-bob">
            <path
              d="M 64 78 
                 C 40 102, 38 140, 48 174 
                 C 58 186, 78 184, 86 166 
                 L 154 166 
                 C 162 184, 182 186, 192 174 
                 C 202 140, 200 102, 176 78 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          </g>
        );

      // Female: 4: Loose Wavy Twintails
      case 'loose_wavy_twintails':
        return (
          <g id="hair-back-twintails">
            <path
              d="M 66 84 
                 C 26 92, 16 142, 28 190 
                 C 36 226, 52 248, 62 250 
                 C 68 248, 62 228, 54 196 
                 C 46 164, 52 126, 72 102 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
            <path
              d="M 174 84 
                 C 214 92, 224 142, 212 190 
                 C 204 226, 188 248, 178 250 
                 C 172 248, 178 228, 186 196 
                 C 194 164, 188 126, 168 102 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          </g>
        );

      // Female: 5: Straight Half-Up
      case 'straight_half_up':
        return (
          <g id="hair-back-straight-halfup">
            <path
              d="M 64 78 
                 C 48 110, 44 170, 48 230 
                 C 58 242, 78 238, 86 194 
                 L 154 194 
                 C 162 238, 182 242, 192 230 
                 C 196 170, 192 110, 176 78 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
              strokeLinecap="round"
            />
          </g>
        );

      // Female: 6: Neat Straight Bob
      case 'neat_straight_bob':
        return (
          <g id="hair-back-neat-bob">
            <path
              d="M 66 78 
                 C 50 102, 48 136, 56 166 
                 C 66 176, 82 174, 88 156 
                 L 152 156 
                 C 158 174, 174 176, 184 166 
                 C 192 136, 190 102, 174 78 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
          </g>
        );

      // Female: 8: Hime Cut Long Straight
      case 'hime_cut':
        return (
          <g id="hair-back-hime-cut">
            <path
              d="M 64 76 
                 C 44 116, 40 184, 44 246 
                 C 56 254, 76 250, 84 200 
                 L 156 200 
                 C 164 250, 184 254, 196 246 
                 C 200 184, 196 116, 176 76 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
          </g>
        );

      // Female: 9: Blonde Wavy Headband
      case 'blonde_wavy_headband':
        return (
          <g id="hair-back-wavy-headband">
            <path
              d="M 62 76 
                 C 32 110, 24 172, 42 236 
                 C 56 252, 82 244, 88 196 
                 L 152 196 
                 C 158 244, 184 252, 198 236 
                 C 216 172, 208 110, 178 76 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
          </g>
        );

      // Female: 12: Pink Pigtails Bows
      case 'pink_pigtails_bows':
        return (
          <g id="hair-back-pink-pigtails">
            <path
              d="M 66 82 
                 C 22 96, 12 152, 26 204 
                 C 38 238, 56 254, 68 252 
                 C 74 248, 68 226, 60 196 
                 C 52 164, 58 124, 74 100 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
            <path
              d="M 174 82 
                 C 218 96, 228 152, 214 204 
                 C 202 238, 184 254, 172 252 
                 C 166 248, 172 226, 180 196 
                 C 188 164, 182 124, 166 100 
                 Z"
              fill={hairColor}
              stroke={lineStroke}
              strokeWidth={strokeW}
            />
          </g>
        );

      default:
        return null;
    }
  }

  // =========================================================================
  // FRONT HAIR LAYER (Forehead bangs, textures, highlights & accessories)
  // =========================================================================
  return (
    <g id="hair-front-layer">
      {/* ------------------------------------------------------------------ */}
      {/* MALE 1: TWO-BLOCK DANDY CUT (깔끔한 댄디 투블럭 컷) */}
      {/* ------------------------------------------------------------------ */}
      {style === 'two_block_dandy' && (
        <g id="hair-male-two-block-dandy">
          {/* Voluminous layered crown & softly parted side bangs */}
          <path
            d="M 64 74 
               C 58 24, 88 16, 120 16 
               C 152 16, 182 24, 176 74 
               C 174 94, 162 108, 150 102 
               C 140 84, 134 68, 124 72 
               C 114 76, 102 96, 88 102 
               C 76 108, 66 94, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Soft natural shine highlight */}
          <path d="M 82 40 C 100 30, 140 30, 158 40" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Dandy hair texture lines */}
          <path d="M 104 36 C 108 54, 104 76, 94 92" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 136 36 C 132 54, 136 76, 146 92" stroke="rgba(0,0,0,0.2)" strokeWidth="2" fill="none" strokeLinecap="round" />

          {/* Clean neat sideburns */}
          <path d="M 66 78 C 60 92, 62 110, 68 122 L 72 120 C 70 106, 72 90, 76 78 Z" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />
          <path d="M 174 78 C 180 92, 178 110, 172 122 L 168 120 C 170 106, 168 90, 164 78 Z" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MALE 2: COMMA HAIR (아이돌 쉼표머리) */}
      {/* ------------------------------------------------------------------ */}
      {style === 'comma_hair' && (
        <g id="hair-male-comma">
          {/* Dynamic curved crown */}
          <path
            d="M 64 74 
               C 58 24, 88 16, 120 16 
               C 154 16, 184 26, 176 74 
               C 172 96, 158 104, 148 94 
               C 142 82, 138 60, 128 62 
               C 120 64, 118 78, 124 92 
               C 126 98, 120 104, 112 102 
               C 102 100, 94 88, 92 78 
               C 84 94, 74 98, 66 84 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Iconic Inward Comma Curve Bang */}
          <path
            d="M 112 66 C 114 84, 124 94, 120 100 C 114 104, 106 96, 108 80"
            stroke={lineStroke}
            strokeWidth="2.5"
            fill={hairColor}
            strokeLinejoin="round"
          />
          <path d="M 82 40 C 100 30, 140 30, 158 40" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Clean sharp sideburns */}
          <path d="M 66 78 C 60 94, 64 114, 70 124 L 74 122 C 70 106, 72 90, 76 78 Z" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />
          <path d="M 174 78 C 180 94, 176 114, 170 124 L 166 122 C 170 106, 168 90, 164 78 Z" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MALE 3: WOLF CUT MESSY (레이어드 울프컷) */}
      {/* ------------------------------------------------------------------ */}
      {style === 'wolf_cut_messy' && (
        <g id="hair-male-wolf-cut">
          {/* Choppy layered crown with spiky natural flow */}
          <path
            d="M 62 76 
               C 54 28, 86 16, 120 16 
               C 154 16, 186 28, 178 76 
               C 176 96, 164 106, 152 98 
               C 146 86, 142 66, 134 88 
               C 126 94, 120 94, 114 86 
               C 106 66, 100 84, 90 98 
               C 78 106, 68 92, 62 76 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Shaggy spiky tufts sticking out on sides */}
          <path d="M 58 64 L 48 74 L 62 76" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />
          <path d="M 182 64 L 192 74 L 178 76" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />
          <path d="M 116 16 L 122 8 L 128 16" fill={hairColor} stroke={lineStroke} strokeWidth="1.8" />

          {/* Highlights */}
          <path d="M 80 38 C 98 28, 142 28, 160 38" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MALE 4: CENTER PART WAVY (가르마 웨이브 펌) */}
      {/* ------------------------------------------------------------------ */}
      {style === 'center_part_wavy' && (
        <g id="hair-male-center-part">
          <path
            d="M 64 74 
               C 58 24, 88 16, 120 16 
               C 152 16, 182 24, 176 74 
               C 172 96, 160 110, 146 102 
               C 136 82, 134 54, 122 56 
               C 112 54, 104 82, 94 102 
               C 80 110, 68 96, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Center Parting Waves */}
          <path d="M 120 22 C 120 38, 114 54, 102 78" stroke="rgba(0,0,0,0.25)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 120 22 C 120 38, 126 54, 138 78" stroke="rgba(0,0,0,0.25)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 82 40 C 100 30, 140 30, 158 40" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MALE 5: DANDY VOLUME PERM (볼륨 쉐도우 펌) */}
      {style === 'dandy_perm' && (
        <g id="hair-male-dandy-perm">
          <path
            d="M 64 74 
               C 56 22, 88 14, 120 14 
               C 152 14, 184 22, 176 74 
               C 174 94, 162 106, 152 98 
               C 144 86, 140 72, 132 94 
               C 124 100, 116 100, 110 92 
               C 102 72, 96 86, 88 98 
               C 76 106, 66 94, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Shadow perm curly texture loops */}
          <path d="M 86 48 Q 94 40 102 46 Q 110 52 118 44" stroke="rgba(0,0,0,0.22)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 122 44 Q 130 52 138 46 Q 146 40 154 48" stroke="rgba(0,0,0,0.22)" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MALE 6: BEANIE & CURLS (스트릿 비니 & 컬리헤어) */}
      {style === 'beanie_curls' && (
        <g id="hair-male-beanie">
          {/* Forehead curls peeking under beanie */}
          <path
            d="M 68 84 
               C 74 98, 86 102, 94 94 
               C 102 84, 108 98, 118 98 
               C 128 98, 134 84, 142 94 
               C 150 102, 162 98, 172 84 
               L 168 76 
               L 72 76 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
          />
          {/* Streetwear Knitted Beanie Cap */}
          <path
            d="M 60 76 
               C 56 34, 84 12, 120 12 
               C 156 12, 184 34, 180 76 
               C 180 82, 60 82, 60 76 
               Z"
            fill="#1E293B"
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Beanie Fold / Ribbed Cuff */}
          <rect x="58" y="66" width="124" height="14" rx="4" fill="#334155" stroke={lineStroke} strokeWidth="2" />
          <line x1="120" y1="67" x2="120" y2="79" stroke="#475569" strokeWidth="1.5" />
          {/* Top Beanie Pom / Tip */}
          <ellipse cx="120" cy="12" rx="6" ry="4" fill="#1E293B" stroke={lineStroke} strokeWidth="1.5" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* MALE 7: CLASSIC SIDE PART (클래식 사이드 파트 포멀) */}
      {style === 'side_part_classic' && (
        <g id="hair-male-classic-part">
          <path
            d="M 64 74 
               C 58 24, 88 16, 120 16 
               C 152 16, 182 24, 176 74 
               C 174 92, 164 100, 154 94 
               C 142 80, 128 66, 108 66 
               C 92 66, 84 86, 76 96 
               C 68 100, 64 90, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Slick Side Parting Line */}
          <path d="M 108 20 C 108 38, 106 54, 98 66" stroke="rgba(0,0,0,0.3)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 80 40 C 98 30, 142 30, 160 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* FEMALE & UNISEX STYLES (1 ~ 12) */}
      {/* ------------------------------------------------------------------ */}

      {/* 1 & 2: Curly Side Pony (Blonde or Brown) with Ribbon Bow */}
      {(style === 'blonde_curly_side_pony' || style === 'brown_curly_side_pony' || style === 'beret_side_pony') && (
        <g id="hair-style-curly-side-pony">
          <path
            d="M 64 74 
               C 60 30, 90 22, 120 22 
               C 150 22, 180 30, 176 74 
               C 174 94, 162 116, 150 108 
               C 140 88, 134 58, 124 58 
               C 114 58, 98 84, 88 104 
               C 78 114, 66 94, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 84 46 C 102 36, 138 36, 156 46" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 88 40 Q 102 32, 114 34" stroke="rgba(0,0,0,0.22)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 126 34 Q 138 32, 152 40" stroke="rgba(0,0,0,0.22)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Face-framing side curls */}
          <path d="M 68 82 C 60 112, 68 152, 76 178 C 82 178, 86 148, 82 114 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 172 82 C 180 112, 174 152, 166 178 C 160 178, 156 148, 160 114 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />

          {/* Ribbon Bow on Side */}
          {style === 'blonde_curly_side_pony' && (
            <g transform="translate(162, 102)" id="white-ribbon-bow">
              <path d="M 0 0 C 16 -12, 22 6, 5 4 Z" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.5" />
              <path d="M 0 0 C -16 -12, -22 6, -5 4 Z" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1" />
              <path d="M 2 3 C 8 20, 12 36, 14 52" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          )}

          {style === 'brown_curly_side_pony' && (
            <g transform="translate(162, 102)" id="brown-ribbon-bow">
              <path d="M 0 0 C 16 -12, 22 6, 5 4 Z" fill="#78350F" stroke={lineStroke} strokeWidth="1.5" />
              <path d="M 0 0 C -16 -12, -22 6, -5 4 Z" fill="#78350F" stroke={lineStroke} strokeWidth="1.5" />
              <circle cx="0" cy="0" r="3.5" fill="#5A280B" stroke={lineStroke} strokeWidth="1" />
              <path d="M 2 3 C 8 20, 12 36, 14 52" stroke="#78350F" strokeWidth="4" fill="none" strokeLinecap="round" />
            </g>
          )}

          {/* Black Beret Hat */}
          {style === 'beret_side_pony' && (
            <g id="black-beret">
              <path
                d="M 72 44 
                   C 76 16, 120 10, 164 20 
                   C 188 26, 196 46, 178 56 
                   C 152 64, 96 60, 72 44 
                   Z"
                fill="#1E293B"
                stroke={lineStroke}
                strokeWidth="2.5"
              />
              <line x1="130" y1="12" x2="132" y2="6" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
              <g transform="translate(164, 62)">
                <path d="M 0 0 C 12 -8, 16 6, 4 3 Z" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.5" />
                <path d="M 0 0 C -12 -8, -16 6, -4 3 Z" fill="#FFFFFF" stroke={lineStroke} strokeWidth="1.5" />
                <path d="M 2 2 C 6 18, 10 32, 12 46" stroke="#FFFFFF" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              </g>
            </g>
          )}
        </g>
      )}

      {/* 3: Wavy Bob with Bangs */}
      {style === 'wavy_bob_bangs' && (
        <g id="hair-style-wavy-bob">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 172 88, 166 102, 154 98 
               C 146 82, 138 68, 130 96 
               C 124 100, 116 100, 110 96 
               C 102 68, 94 82, 86 98 
               C 74 102, 68 88, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 80 44 C 98 34, 142 34, 160 44" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 64 78 C 52 108, 54 146, 68 170 C 76 172, 82 154, 80 120 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 176 78 C 188 108, 186 146, 172 170 C 164 172, 158 154, 160 120 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
        </g>
      )}

      {/* 4: Loose Wavy Twintails */}
      {style === 'loose_wavy_twintails' && (
        <g id="hair-style-wavy-twintails">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 174 94, 164 112, 152 106 
               C 142 86, 136 60, 126 60 
               C 116 60, 102 86, 92 106 
               C 80 112, 66 94, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 82 46 C 100 36, 140 36, 158 46" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g transform="translate(62, 80)">
            <ellipse cx="0" cy="0" rx="7" ry="5" fill="#FDE68A" stroke={lineStroke} strokeWidth="1.5" />
            <path d="M -4 4 L -6 14" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g transform="translate(178, 80)">
            <ellipse cx="0" cy="0" rx="7" ry="5" fill="#FDE68A" stroke={lineStroke} strokeWidth="1.5" />
            <path d="M 4 4 L 6 14" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <path d="M 52 86 C 42 120, 46 170, 58 206 C 64 206, 68 180, 66 144 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 188 86 C 198 120, 194 170, 182 206 C 176 206, 172 180, 174 144 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
        </g>
      )}

      {/* 5: Straight Half-Up with Bow */}
      {style === 'straight_half_up' && (
        <g id="hair-style-halfup-bow">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 174 96, 160 114, 148 104 
               C 138 82, 134 54, 122 54 
               C 112 54, 96 82, 88 104 
               C 76 114, 66 96, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 84 46 C 102 36, 138 36, 156 46" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 68 80 C 62 120, 64 170, 72 216 L 78 214 C 74 170, 76 120, 80 88 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 172 80 C 178 120, 176 170, 168 216 L 162 214 C 166 170, 164 120, 160 88 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <g transform="translate(120, 36)" id="top-black-bow">
            <path d="M 0 0 C -18 -12, -24 6, -5 4 Z" fill="#0F172A" stroke={lineStroke} strokeWidth="1.5" />
            <path d="M 0 0 C 18 -12, 24 6, 5 4 Z" fill="#0F172A" stroke={lineStroke} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="4" fill="#0F172A" stroke={lineStroke} strokeWidth="1" />
          </g>
        </g>
      )}

      {/* 6: Neat Straight Bob */}
      {style === 'neat_straight_bob' && (
        <g id="hair-style-neat-bob">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 174 92, 166 104, 156 100 
               C 148 84, 140 64, 130 94 
               C 124 98, 116 98, 110 94 
               C 100 64, 92 84, 84 100 
               C 74 104, 66 92, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 80 44 C 98 34, 142 34, 160 44" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 66 78 C 56 104, 58 136, 70 162 C 78 164, 82 144, 80 114 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 174 78 C 184 104, 182 136, 170 162 C 162 164, 158 144, 160 114 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
        </g>
      )}

      {/* 7 / Short Spiky */}
      {style === 'short_spiky' && (
        <g id="hair-style-short-spiky">
          <path
            d="M 62 76 
               C 56 30, 88 18, 120 18 
               C 152 18, 184 30, 178 76 
               C 174 92, 166 106, 154 96 
               C 148 86, 142 66, 134 92 
               C 126 98, 118 98, 110 88 
               C 104 68, 98 84, 88 96 
               C 76 106, 68 92, 62 76 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 78 40 C 96 28, 144 28, 162 40" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 60 68 L 54 80 L 66 78" fill={hairColor} stroke={lineStroke} strokeWidth="1.5" />
          <path d="M 180 68 L 186 80 L 174 78" fill={hairColor} stroke={lineStroke} strokeWidth="1.5" />
          <path d="M 116 18 L 122 10 L 126 18" fill={hairColor} stroke={lineStroke} strokeWidth="1.5" />
        </g>
      )}

      {/* 8: Hime-cut with Long Straight Hair */}
      {style === 'hime_cut' && (
        <g id="hair-style-hime-cut">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 174 92, 166 94, 158 94 
               L 82 94 
               C 74 94, 66 92, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 84 46 C 102 36, 138 36, 156 46" stroke="rgba(255, 255, 255, 0.38)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M 66 84 L 64 126 L 80 126 L 82 84 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 174 84 L 176 126 L 160 126 L 158 84 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
        </g>
      )}

      {/* 9: Blonde Wavy Hair with Flower Headband */}
      {style === 'blonde_wavy_headband' && (
        <g id="hair-style-wavy-headband">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 174 94, 162 116, 150 108 
               C 140 88, 134 58, 124 58 
               C 114 58, 98 84, 88 104 
               C 78 114, 66 94, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 82 46 C 100 36, 140 36, 158 46" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M 64 68 C 76 42, 164 42, 176 68" stroke="#1E293B" strokeWidth="5.5" fill="none" strokeLinecap="round" />
          {[
            { x: 136, y: 46 },
            { x: 150, y: 52 },
            { x: 164, y: 62 },
          ].map((fl, i) => (
            <g key={i} transform={`translate(${fl.x}, ${fl.y})`}>
              <circle cx="-3" cy="0" r="2.5" fill="#FFFFFF" />
              <circle cx="3" cy="0" r="2.5" fill="#FFFFFF" />
              <circle cx="0" cy="-3" r="2.5" fill="#FFFFFF" />
              <circle cx="0" cy="3" r="2.5" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="2" fill="#FDE047" />
            </g>
          ))}
          <path d="M 68 82 C 60 114, 66 156, 76 182 C 82 182, 86 150, 82 114 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 172 82 C 180 114, 174 156, 164 182 C 158 182, 154 150, 158 114 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
        </g>
      )}

      {/* 11: Wavy Bob with Cat Ear Clips */}
      {style === 'wavy_bob_cat_ears' && (
        <g id="hair-style-cat-ear-bob">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 172 88, 166 102, 154 98 
               C 146 82, 138 68, 130 96 
               C 124 100, 116 100, 110 96 
               C 102 68, 94 82, 86 98 
               C 74 102, 68 88, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 80 44 C 98 34, 142 34, 160 44" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g transform="translate(82, 28)">
            <polygon points="0,0 -16,-18 4,-12" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
            <polygon points="-2,-2 -12,-14 1,-10" fill="#FDA4AF" />
          </g>
          <g transform="translate(158, 28)">
            <polygon points="0,0 16,-18 -4,-12" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
            <polygon points="2,-2 12,-14 -1,-10" fill="#FDA4AF" />
          </g>
          <g transform="translate(162, 72)">
            <line x1="0" y1="0" x2="14" y2="4" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="0" y1="6" x2="14" y2="10" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
      )}

      {/* 12: Two Large Pigtails with Bows */}
      {style === 'pink_pigtails_bows' && (
        <g id="hair-style-pink-pigtails">
          <path
            d="M 64 74 
               C 60 28, 90 22, 120 22 
               C 150 22, 180 28, 176 74 
               C 174 94, 164 112, 152 106 
               C 142 86, 136 60, 126 60 
               C 116 60, 102 86, 92 106 
               C 80 112, 66 94, 64 74 
               Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <path d="M 82 46 C 100 36, 140 36, 158 46" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <g transform="translate(60, 74)" id="left-pink-bow">
            <path d="M 0 0 C -18 -12, -22 8, -6 6 Z" fill="#FB7185" stroke={lineStroke} strokeWidth="1.5" />
            <path d="M 0 0 C 18 -12, 22 8, 6 6 Z" fill="#FB7185" stroke={lineStroke} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="4" fill="#F43F5E" stroke={lineStroke} strokeWidth="1" />
          </g>
          <g transform="translate(180, 74)" id="right-pink-bow">
            <path d="M 0 0 C -18 -12, -22 8, -6 6 Z" fill="#FB7185" stroke={lineStroke} strokeWidth="1.5" />
            <path d="M 0 0 C 18 -12, 22 8, 6 6 Z" fill="#FB7185" stroke={lineStroke} strokeWidth="1.5" />
            <circle cx="0" cy="0" r="4" fill="#F43F5E" stroke={lineStroke} strokeWidth="1" />
          </g>
          <path d="M 52 88 C 42 124, 46 172, 58 206 C 64 206, 68 180, 66 144 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
          <path d="M 188 88 C 198 124, 194 172, 182 206 C 176 206, 172 180, 174 144 Z" fill={hairColor} stroke={lineStroke} strokeWidth="2" />
        </g>
      )}

      {/* Ponytail Front */}
      {style === 'ponytail' && (
        <g id="hair-style-ponytail">
          <path
            d="M 64 74 C 60 26, 90 20, 120 20 C 150 20, 180 26, 176 74 C 172 90, 160 106, 148 98 C 138 78, 134 54, 122 54 C 112 54, 96 78, 88 98 C 76 106, 68 90, 64 74 Z"
            fill={hairColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
          />
          <path d="M 84 46 C 102 36, 138 36, 156 46" stroke="rgba(255, 255, 255, 0.55)" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Top Hair tie band */}
          <ellipse cx="120" cy="24" rx="8" ry="4" fill="#F43F5E" stroke={lineStroke} strokeWidth="1.5" />
        </g>
      )}
    </g>
  );
};
