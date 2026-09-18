import React from 'react';

interface AvatarBodyProps {
  skinColor: string;
  viewAngle?: 'front' | 'side' | 'back';
  rotation?: number;
  uid: string;
  showKneeBlush?: boolean;
}

export const AvatarBody: React.FC<AvatarBodyProps> = ({
  skinColor = '#FFE7D6',
  viewAngle = 'front',
  rotation = 0,
  uid,
  showKneeBlush = true,
}) => {
  const lineStroke = '#3E2319';
  const strokeW = '2.2';

  // Front View Body (Soft Curved Anime Body matching 몸통만들기.png)
  if (viewAngle === 'front') {
    return (
      <g id="avatar-body-front">
        {/* Gradients for soft body depth */}
        <defs>
          <linearGradient id={`skinShade-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={skinColor} />
            <stop offset="85%" stopColor={skinColor} />
            <stop offset="100%" stopColor="rgba(225, 150, 130, 0.25)" />
          </linearGradient>
        </defs>

        {/* 1. LEGS BASE (Natural curving thighs, knees, calves, ankles and feet) */}
        <g id="body-legs">
          {/* Left Leg */}
          <path
            d="M 88 198 
               C 85 212, 84 228, 86 244 
               C 88 256, 88 274, 91 288 
               C 92 296, 91 304, 96 306 
               C 101 306, 103 298, 101 288 
               C 99 274, 101 256, 104 244 
               C 107 228, 114 214, 118 206
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Right Leg */}
          <path
            d="M 152 198 
               C 155 212, 156 228, 154 244 
               C 152 256, 152 274, 149 288 
               C 148 296, 149 304, 144 306 
               C 139 306, 137 298, 139 288 
               C 141 274, 139 256, 136 244 
               C 133 228, 126 214, 122 206
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Soft Knee Rosy Blush (from 몸통만들기.png) */}
          {showKneeBlush && (
            <g id="knee-blush" opacity="0.45">
              <ellipse cx="94" cy="245" rx="6" ry="5" fill="#F87171" />
              <ellipse cx="146" cy="245" rx="6" ry="5" fill="#F87171" />
            </g>
          )}
        </g>

        {/* 2. TORSO & WAIST (Soft hourglass chibi curve) */}
        <g id="body-torso">
          <path
            d="M 108 140 
               C 94 143, 86 150, 84 160 
               C 83 168, 86 178, 88 186 
               C 90 194, 88 202, 88 206 
               C 94 208, 112 210, 120 210 
               C 128 210, 146 208, 152 206 
               C 152 202, 150 194, 152 186 
               C 154 178, 157 168, 156 160 
               C 154 150, 146 143, 132 140 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Subtle navel dot */}
          <circle cx="120" cy="188" r="1" fill="#C27D68" opacity="0.6" />
        </g>

        {/* 3. ARMS & HANDS (Curved chibi arms with thumbs & fingers) */}
        <g id="body-arms">
          {/* Left Arm */}
          <path
            d="M 86 152 
               C 74 164, 68 184, 63 204 
               C 60 216, 56 226, 57 232 
               C 58 236, 64 237, 68 233 
               C 71 230, 71 224, 72 218 
               C 76 204, 81 184, 88 168 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Left Hand Thumb & Palm Soft Curve */}
          <path
            d="M 57 230 C 54 233, 56 237, 60 236 C 63 235, 65 231, 66 228"
            stroke={lineStroke}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Right Arm */}
          <path
            d="M 154 152 
               C 166 164, 172 184, 177 204 
               C 180 216, 184 226, 183 232 
               C 182 236, 176 237, 172 233 
               C 169 230, 169 224, 168 218 
               C 164 204, 159 184, 152 168 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Hand Thumb & Palm Soft Curve */}
          <path
            d="M 183 230 C 186 233, 184 237, 180 236 C 177 235, 175 231, 174 228"
            stroke={lineStroke}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </g>

        {/* 4. NECK */}
        <g id="body-neck">
          <path
            d="M 113 124 
               C 113 132, 114 138, 108 142 
               L 132 142 
               C 126 138, 127 132, 127 124 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Soft neck shadow */}
          <path
            d="M 113 124 C 117 129, 123 129, 127 124 C 126 130, 114 130, 113 124 Z"
            fill="rgba(194, 125, 104, 0.28)"
          />
        </g>

        {/* 5. HEAD BASE (Soft Rounded Anime Silhouette from 몸통만들기.png) */}
        <g id="body-head">
          <path
            d="M 68 76 
               C 64 34, 90 24, 120 24 
               C 150 24, 176 34, 172 76 
               C 174 98, 166 118, 144 126 
               C 134 130, 120 131, 120 131 
               C 120 131, 106 130, 96 126 
               C 74 118, 66 98, 68 76 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Left Ear */}
          <path
            d="M 70 73 C 58 73, 56 89, 69 93"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 65 79 C 62 82, 63 86, 67 87"
            stroke="#D98A73"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Right Ear */}
          <path
            d="M 170 73 C 182 73, 184 89, 171 93"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 175 79 C 178 82, 177 86, 173 87"
            stroke="#D98A73"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Soft Rosy Cheek Blush (matching image) */}
          <ellipse cx="84" cy="98" rx="11" ry="6" fill="#F87171" opacity="0.32" />
          <ellipse cx="156" cy="98" rx="11" ry="6" fill="#F87171" opacity="0.32" />
        </g>
      </g>
    );
  }

  // Back View Body (Soft Curved silhouette from back)
  if (viewAngle === 'back') {
    return (
      <g id="avatar-body-back">
        {/* Legs from behind */}
        <g id="back-legs">
          <path
            d="M 88 198 
               C 85 212, 84 228, 86 244 
               C 88 256, 88 274, 91 288 
               C 92 296, 91 304, 96 306 
               C 101 306, 103 298, 101 288 
               C 99 274, 101 256, 104 244 
               C 107 228, 114 214, 118 206 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 152 198 
               C 155 212, 156 228, 154 244 
               C 152 256, 152 274, 149 288 
               C 148 296, 149 304, 144 306 
               C 139 306, 137 298, 139 288 
               C 141 274, 139 256, 136 244 
               C 133 228, 126 214, 122 206 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Back knee crease lines */}
          <path d="M 91 250 Q 96 253 100 250" stroke="#D98A73" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
          <path d="M 140 250 Q 144 253 149 250" stroke="#D98A73" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* Torso & Back from behind */}
        <g id="back-torso">
          <path
            d="M 108 140 
               C 94 143, 86 150, 84 160 
               C 83 168, 86 178, 88 186 
               C 90 194, 88 202, 88 206 
               C 94 208, 112 210, 120 210 
               C 128 210, 146 208, 152 206 
               C 152 202, 150 194, 152 186 
               C 154 178, 157 168, 156 160 
               C 154 150, 146 143, 132 140 
               Z"
            fill={skinColor}
            stroke={lineStroke}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Spine subtle line */}
          <path d="M 120 148 L 120 182" stroke="#D98A73" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
        </g>

        {/* Arms from behind */}
        <path
          d="M 86 152 C 74 164, 68 184, 63 204 C 60 216, 56 226, 57 232 C 58 236, 64 237, 68 233 C 71 230, 71 224, 72 218 C 76 204, 81 184, 88 168 Z"
          fill={skinColor}
          stroke={lineStroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        <path
          d="M 154 152 C 166 164, 172 184, 177 204 C 180 216, 184 226, 183 232 C 182 236, 176 237, 172 233 C 169 230, 169 224, 168 218 C 164 204, 159 184, 152 168 Z"
          fill={skinColor}
          stroke={lineStroke}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* Neck from behind */}
        <path
          d="M 113 124 C 113 132, 114 138, 108 142 L 132 142 C 126 138, 127 132, 127 124 Z"
          fill={skinColor}
          stroke={lineStroke}
          strokeWidth={strokeW}
        />

        {/* Back of Head */}
        <path
          d="M 68 76 C 64 34, 90 24, 120 24 C 150 24, 176 34, 172 76 C 174 98, 166 118, 144 126 C 134 130, 120 131, 120 131 C 120 131, 106 130, 96 126 C 74 118, 66 98, 68 76 Z"
          fill={skinColor}
          stroke={lineStroke}
          strokeWidth={strokeW}
        />
        {/* Ears from behind */}
        <path d="M 70 73 C 60 73, 58 89, 69 93" fill={skinColor} stroke={lineStroke} strokeWidth={strokeW} />
        <path d="M 170 73 C 180 73, 182 89, 171 93" fill={skinColor} stroke={lineStroke} strokeWidth={strokeW} />
      </g>
    );
  }

  // Side View Body (3/4 Chibi profile)
  return (
    <g id="avatar-body-side">
      {/* Side Legs */}
      <path
        d="M 104 198 C 102 214, 103 232, 105 248 C 107 260, 107 274, 109 288 C 110 296, 109 304, 116 306 C 122 306, 123 298, 121 288 C 119 274, 120 256, 121 244 C 123 228, 125 214, 126 206 Z"
        fill={skinColor}
        stroke={lineStroke}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      {/* Side Torso */}
      <path
        d="M 104 142 C 96 148, 95 162, 98 176 C 100 186, 103 196, 104 206 L 132 206 C 134 196, 136 186, 134 176 C 131 162, 128 148, 124 142 Z"
        fill={skinColor}
        stroke={lineStroke}
        strokeWidth={strokeW}
      />
      {/* Side Arm */}
      <path
        d="M 112 152 C 118 168, 124 186, 128 206 C 130 218, 133 228, 130 234 C 128 238, 122 237, 120 231 C 118 226, 116 216, 114 204 C 110 188, 107 168, 106 154 Z"
        fill={skinColor}
        stroke={lineStroke}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      {/* Side Head & Profile Cheek */}
      <path
        d="M 94 72 C 92 36, 116 26, 140 28 C 162 30, 172 48, 170 76 C 168 94, 160 114, 144 124 C 132 130, 118 128, 112 124 C 98 116, 95 96, 94 72 Z"
        fill={skinColor}
        stroke={lineStroke}
        strokeWidth={strokeW}
      />
      <ellipse cx="148" cy="98" rx="8" ry="5" fill="#F87171" opacity="0.32" />
    </g>
  );
};
