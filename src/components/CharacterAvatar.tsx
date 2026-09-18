import React from 'react';
import { AvatarConfig } from '../types';
import { AvatarBackgroundScene } from './AvatarBackgroundScene';
import { AvatarBody } from './avatar/AvatarBody';
import { AvatarHair } from './avatar/AvatarHair';
import { AvatarClothing } from './avatar/AvatarClothing';

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  gender: 'girl',
  characterName: '소다',
  skinColor: '#FFE7D6',
  hairStyle: 'blonde_curly_side_pony',
  hairColor: '#FDE047', // Blonde golden from image #1
  eyeType: 'warm_sparkle',
  eyeColor: '#7C3AED', // Amethyst purple anime eyes from image
  eyebrowType: 'soft_arch',
  eyebrowColor: '#5C382C',
  noseType: 'subtle_dot',
  mouthType: 'gentle_smile',
  faceExpression: 'smile',
  faceDeco: 'blush',
  topType: 'white_tshirt',
  topColor: '#FFFFFF',
  bottomType: 'pleated_skirt',
  bottomColor: '#5B84B1',
  outfit: 'custom_mix',
  outfitColor: '#FFFFFF',
  outfitSubColor: '#5B84B1',
  shoes: 'white_sneakers',
  shoesColor: '#FFFFFF',
  bag: 'leather_handbag',
  bagColor: '#FFFFFF',
  accessory: 'ribbon_back',
  accessoryColor: '#FFFFFF',
  rotation: 0,
  viewAngle: 'front',
  backgroundScene: 'terrace',
  decorSticker: 'none',
};

interface CharacterAvatarProps {
  config?: AvatarConfig | null;
  fallbackEmoji?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'stage';
  mood?: 'ecstatic' | 'happy' | 'normal' | 'hungry' | 'stressed' | 'crying' | 'eating' | 'sleeping';
  pose?: 'standing' | 'model' | 'cheer';
  className?: string;
  animate?: boolean;
  showStage?: boolean;
  showBackground?: boolean;
}

export const CharacterAvatar: React.FC<CharacterAvatarProps> = ({
  config,
  size = 'md',
  className = '',
  showBackground = false,
}) => {
  const avatar: AvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    ...(config || {}),
  };

  const sizeClasses = {
    xs: 'w-10 h-14',
    sm: 'w-16 h-24',
    md: 'w-28 h-40',
    lg: 'w-44 h-64',
    xl: 'w-60 h-84',
    '2xl': 'w-72 h-100',
    stage: 'w-full h-full min-h-[380px]',
  };

  const hairColor = avatar.hairColor || '#FDE047';
  const eyeColor = avatar.eyeColor || '#7C3AED';
  const skinColor = avatar.skinColor || '#FFE7D6';
  const eyebrowColor = avatar.eyebrowColor || '#5C382C';
  const topColor = avatar.topColor || avatar.outfitColor || '#FFFFFF';
  const bottomColor = avatar.bottomColor || avatar.outfitSubColor || '#5B84B1';
  const shoesColor = avatar.shoesColor || '#FFFFFF';
  const viewAngle = avatar.viewAngle || 'front'; // 'front' | 'side' | 'back'
  const rotation = avatar.rotation || 0; // -1: left, 0: front, 1: right
  const scene = avatar.backgroundScene || 'terrace';
  const sticker = avatar.decorSticker || 'none';

  // Unique ID for SVG gradients/filters
  const uid = React.useId().replace(/:/g, '');

  const hairStyle = avatar.hairStyle || 'blonde_curly_side_pony';
  const topType = avatar.topType || 'white_tshirt';
  const bottomType = avatar.bottomType || 'pleated_skirt';
  const eyeType = avatar.eyeType || 'warm_sparkle';
  const accessory = avatar.accessory || 'none';

  const lineStroke = '#2D170D';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
    >
      {/* Background Scene if requested */}
      {showBackground && <AvatarBackgroundScene scene={scene} />}

      {/* SVG Canvas for Character */}
      <svg
        viewBox="0 0 240 340"
        className="w-full h-full drop-shadow-sm overflow-visible relative z-10"
      >
        <defs>
          <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="rgba(15, 23, 42, 0.16)" />
          </filter>

          {/* Eye Iris Anime Sparkle Gradient */}
          <linearGradient id={`eyeGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="35%" stopColor={eyeColor} />
            <stop offset="75%" stopColor={eyeColor} />
            <stop offset="100%" stopColor="#DDD6FE" />
          </linearGradient>

          {/* Denim / Skirt Gradient */}
          <linearGradient id={`denimGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={bottomColor} />
            <stop offset="50%" stopColor={bottomColor} />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>

        {/* Floor Drop Shadow */}
        <g id="floor-shadow">
          <ellipse cx="120" cy="308" rx="54" ry="10" fill="rgba(71, 85, 105, 0.24)" />
          <ellipse cx="120" cy="308" rx="36" ry="6" fill="rgba(51, 65, 85, 0.22)" />
        </g>

        {/* Root Transform for Rotation Flipping & Centering */}
        <g
          id="avatar-root"
          transform={`translate(120, 170) scale(${rotation === -1 ? '-1, 1' : '1, 1'}) translate(-120, -170)`}
          filter={`url(#shadow-${uid})`}
        >
          {/* 1. BACK HAIR LAYER */}
          <AvatarHair
            hairStyle={hairStyle}
            hairColor={hairColor}
            viewAngle={viewAngle}
            layer="back"
            uid={uid}
          />

          {/* 2. BASE BODY (Graceful Bezier Curves from 몸통만들기.png) */}
          <AvatarBody
            skinColor={skinColor}
            viewAngle={viewAngle}
            rotation={rotation}
            uid={uid}
            showKneeBlush={true}
          />

          {/* 3. CLOTHING (Tops, Bottoms, Shoes, Accessories) */}
          <AvatarClothing
            topType={topType}
            topColor={topColor}
            bottomType={bottomType}
            bottomColor={bottomColor}
            shoes={avatar.shoes || 'chunky_sneakers'}
            shoesColor={shoesColor}
            bag={avatar.bag}
            accessory={accessory}
            viewAngle={viewAngle}
            gender={avatar.gender || 'boy'}
            uid={uid}
          />

          {/* 4. FACIAL FEATURES (Front & Side Views) */}
          {viewAngle !== 'back' && (
            <g id="avatar-face-features">
              {/* Eyebrows (Dynamic for Boy vs Girl) */}
              {avatar.gender === 'boy' ? (
                // Clean Straight/Dandy Eyebrows for Boys
                <g id="boy-eyebrows">
                  <path
                    d="M 74 74 C 84 70, 98 70, 104 74"
                    stroke={eyebrowColor}
                    strokeWidth="3.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 166 74 C 156 70, 142 70, 136 74"
                    stroke={eyebrowColor}
                    strokeWidth="3.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              ) : (
                // Soft Arched Anime Eyebrows for Girls
                <g id="girl-eyebrows">
                  <path
                    d="M 76 74 C 84 68, 96 68, 102 73"
                    stroke={eyebrowColor}
                    strokeWidth="2.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 164 74 C 156 68, 144 68, 138 73"
                    stroke={eyebrowColor}
                    strokeWidth="2.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              )}

              {/* Double Eyelid Creases */}
              <path
                d="M 78 78 C 84 75, 96 75, 100 78"
                stroke="#5A280B"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M 162 78 C 156 75, 144 75, 140 78"
                stroke="#5A280B"
                strokeWidth="1.4"
                fill="none"
                strokeLinecap="round"
              />

              {/* BIG ANIME GLITTERING EYES (with sparkles from image!) */}
              {eyeType !== 'wink' && eyeType !== 'sleepy' && (
                <>
                  {/* Left Eye */}
                  <g id="left-eye">
                    <path
                      d="M 74 86 C 80 76, 98 76, 104 86"
                      stroke={lineStroke}
                      strokeWidth="3.8"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 104 84 L 108 81"
                      stroke={lineStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <ellipse
                      cx="89"
                      cy="91"
                      rx="12"
                      ry="11"
                      fill="#FFFFFF"
                      stroke={lineStroke}
                      strokeWidth="1.5"
                    />
                    <ellipse cx="89" cy="91" rx="10" ry="11" fill={`url(#eyeGrad-${uid})`} />
                    <circle cx="89" cy="90" r="5" fill="#1E1B4B" />
                    {/* Big White Sparkle Highlights */}
                    <ellipse cx="85" cy="86" rx="4" ry="4.5" fill="#FFFFFF" />
                    <circle cx="94" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />
                    <path
                      d="M 80 98 C 88 101, 96 101, 100 98"
                      stroke="#5A280B"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </g>

                  {/* Right Eye */}
                  <g id="right-eye">
                    <path
                      d="M 136 86 C 142 76, 160 76, 166 86"
                      stroke={lineStroke}
                      strokeWidth="3.8"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 166 84 L 170 81"
                      stroke={lineStroke}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <ellipse
                      cx="151"
                      cy="91"
                      rx="12"
                      ry="11"
                      fill="#FFFFFF"
                      stroke={lineStroke}
                      strokeWidth="1.5"
                    />
                    <ellipse cx="151" cy="91" rx="10" ry="11" fill={`url(#eyeGrad-${uid})`} />
                    <circle cx="151" cy="90" r="5" fill="#1E1B4B" />
                    <ellipse cx="147" cy="86" rx="4" ry="4.5" fill="#FFFFFF" />
                    <circle cx="156" cy="95" r="2.5" fill="#FFFFFF" opacity="0.9" />
                    <path
                      d="M 140 98 C 148 101, 156 101, 160 98"
                      stroke="#5A280B"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </g>
                </>
              )}

              {/* Wink Eye */}
              {eyeType === 'wink' && (
                <>
                  <path
                    d="M 74 91 Q 89 80 104 91"
                    stroke={lineStroke}
                    strokeWidth="3.8"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <g id="right-eye-wink">
                    <ellipse
                      cx="151"
                      cy="91"
                      rx="12"
                      ry="11"
                      fill="#FFFFFF"
                      stroke={lineStroke}
                      strokeWidth="1.5"
                    />
                    <ellipse cx="151" cy="91" rx="10" ry="11" fill={`url(#eyeGrad-${uid})`} />
                    <ellipse cx="147" cy="86" rx="4" ry="4.5" fill="#FFFFFF" />
                  </g>
                </>
              )}

              {/* Sleepy Closed Eyes */}
              {eyeType === 'sleepy' && (
                <>
                  <path
                    d="M 74 92 Q 89 100 104 92"
                    stroke={lineStroke}
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 136 92 Q 151 100 166 92"
                    stroke={lineStroke}
                    strokeWidth="3.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Delicate Soft Nose Dot */}
              <circle cx="120" cy="99" r="1.8" fill="#B45309" opacity="0.7" />

              {/* Gentle Cute Smiling Mouth */}
              <path
                d="M 113 109 Q 120 115 127 109"
                stroke={lineStroke}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              <line
                x1="116"
                y1="114"
                x2="124"
                y2="114"
                stroke="#F43F5E"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
            </g>
          )}

          {/* 5. FRONT HAIR LAYER (Forehead bangs, crown braids, highlights, bows & accessories) */}
          <AvatarHair
            hairStyle={hairStyle}
            hairColor={hairColor}
            viewAngle={viewAngle}
            layer="front"
            uid={uid}
          />
        </g>

        {/* Decorative Floating Stickers */}
        {sticker === 'sparkle_stars' && (
          <g id="sticker-sparkles">
            {[
              { x: 35, y: 80, s: 0.8 },
              { x: 200, y: 70, s: 1 },
              { x: 45, y: 220, s: 0.7 },
              { x: 195, y: 230, s: 0.9 },
            ].map((st, i) => (
              <g key={i} transform={`translate(${st.x}, ${st.y}) scale(${st.s})`}>
                <polygon
                  points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3"
                  fill="#FDE047"
                  stroke="#F59E0B"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        )}

        {sticker === 'floating_hearts' && (
          <g id="sticker-hearts">
            {[
              { x: 30, y: 90, s: 0.8 },
              { x: 205, y: 110, s: 0.9 },
              { x: 50, y: 200, s: 0.7 },
            ].map((h, i) => (
              <path
                key={i}
                d="M 12,5 C 8,-2 0,0 0,7 C 0,14 12,20 12,20 C 12,20 24,14 24,7 C 24,0 16,-2 12,5 Z"
                fill="#FB7185"
                transform={`translate(${h.x}, ${h.y}) scale(${h.s})`}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
};
