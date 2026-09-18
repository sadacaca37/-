import React, { useState, useEffect, useRef, useMemo } from 'react';
import { KEYBOARD_LAYOUT, FINGER_COLORS } from '../data/practiceData';
import { FingerType } from '../types';

export interface VirtualKeyboardProps {
  activeKeyCode?: string | null;
  activeKey?: string | null;
  targetKey?: string | null;
  targetKeyCode?: string | null;
  targetFinger?: FingerType | null;
  needsShift?: boolean;
  lastFingerUsed?: string | null;
  isCorrectLastKey?: boolean | null;
  isCorrect?: boolean | null;
  showHandsOverlay?: boolean;
}

interface Point {
  x: number;
  y: number;
}

// 900x300 SVG canvas coordinate mapping matching the centered 15-unit keyboard layout
const KEY_COORDINATES: Record<string, { x: number; y: number; finger: string }> = {
  // Row 0 (Number row) - Y ≈ 30
  Backquote: { x: 107, y: 30, finger: 'left-pinky' },
  Digit1: { x: 157, y: 30, finger: 'left-pinky' },
  Digit2: { x: 207, y: 30, finger: 'left-ring' },
  Digit3: { x: 257, y: 30, finger: 'left-middle' },
  Digit4: { x: 307, y: 30, finger: 'left-index' },
  Digit5: { x: 357, y: 30, finger: 'left-index' },
  Digit6: { x: 407, y: 30, finger: 'right-index' },
  Digit7: { x: 457, y: 30, finger: 'right-index' },
  Digit8: { x: 507, y: 30, finger: 'right-middle' },
  Digit9: { x: 557, y: 30, finger: 'right-ring' },
  Digit0: { x: 607, y: 30, finger: 'right-pinky' },
  Minus: { x: 657, y: 30, finger: 'right-pinky' },
  Equal: { x: 707, y: 30, finger: 'right-pinky' },
  Backspace: { x: 771, y: 30, finger: 'right-pinky' },

  // Row 1 (Top row / QWERTY) - Y ≈ 84
  Tab: { x: 125, y: 84, finger: 'left-pinky' },
  KeyQ: { x: 185, y: 84, finger: 'left-pinky' },
  KeyW: { x: 235, y: 84, finger: 'left-ring' },
  KeyE: { x: 285, y: 84, finger: 'left-middle' },
  KeyR: { x: 335, y: 84, finger: 'left-index' },
  KeyT: { x: 385, y: 84, finger: 'left-index' },
  KeyY: { x: 435, y: 84, finger: 'right-index' },
  KeyU: { x: 485, y: 84, finger: 'right-index' },
  KeyI: { x: 535, y: 84, finger: 'right-middle' },
  KeyO: { x: 585, y: 84, finger: 'right-ring' },
  KeyP: { x: 635, y: 84, finger: 'right-pinky' },
  BracketLeft: { x: 685, y: 84, finger: 'right-pinky' },
  BracketRight: { x: 735, y: 84, finger: 'right-pinky' },
  Backslash: { x: 785, y: 84, finger: 'right-pinky' },

  // Row 2 (Home row / ASDF) - Y ≈ 138
  CapsLock: { x: 132, y: 138, finger: 'left-pinky' },
  KeyA: { x: 200, y: 138, finger: 'left-pinky' },
  KeyS: { x: 250, y: 138, finger: 'left-ring' },
  KeyD: { x: 300, y: 138, finger: 'left-middle' },
  KeyF: { x: 350, y: 138, finger: 'left-index' },
  KeyG: { x: 400, y: 138, finger: 'left-index' },
  KeyH: { x: 450, y: 138, finger: 'right-index' },
  KeyJ: { x: 500, y: 138, finger: 'right-index' },
  KeyK: { x: 550, y: 138, finger: 'right-middle' },
  KeyL: { x: 600, y: 138, finger: 'right-ring' },
  Semicolon: { x: 650, y: 138, finger: 'right-pinky' },
  Quote: { x: 700, y: 138, finger: 'right-pinky' },
  Enter: { x: 768, y: 138, finger: 'right-pinky' },

  // Row 3 (Bottom row / ZXCV) - Y ≈ 192
  ShiftLeft: { x: 149, y: 192, finger: 'left-pinky' },
  KeyZ: { x: 225, y: 192, finger: 'left-pinky' },
  KeyX: { x: 275, y: 192, finger: 'left-ring' },
  KeyC: { x: 325, y: 192, finger: 'left-middle' },
  KeyV: { x: 375, y: 192, finger: 'left-index' },
  KeyB: { x: 425, y: 192, finger: 'left-index' },
  KeyN: { x: 475, y: 192, finger: 'right-index' },
  KeyM: { x: 525, y: 192, finger: 'right-index' },
  Comma: { x: 575, y: 192, finger: 'right-middle' },
  Period: { x: 625, y: 192, finger: 'right-ring' },
  Slash: { x: 675, y: 192, finger: 'right-pinky' },
  ShiftRight: { x: 751, y: 192, finger: 'right-pinky' },

  // Row 4 (Space row) - Y ≈ 246
  Space: { x: 450, y: 246, finger: 'right-thumb' },
};

// Home row resting positions for all 10 fingers
const REST_POSITIONS: Record<string, Point> = {
  'left-pinky': { x: 200, y: 138 },
  'left-ring': { x: 250, y: 138 },
  'left-middle': { x: 300, y: 138 },
  'left-index': { x: 350, y: 138 },
  'left-thumb': { x: 405, y: 246 },

  'right-thumb': { x: 495, y: 246 },
  'right-index': { x: 500, y: 138 },
  'right-middle': { x: 550, y: 138 },
  'right-ring': { x: 600, y: 138 },
  'right-pinky': { x: 650, y: 138 },
};

// Builds a smooth, organic finger contour with natural anatomical taper, soft curves, and delicate fingernails
function buildFingerContour(
  bL: Point,
  bR: Point,
  tip: Point,
  radius: number = 12
) {
  const mx = (bL.x + bR.x) / 2;
  const my = (bL.y + bR.y) / 2;
  const dx = tip.x - mx;
  const dy = tip.y - my;
  const len = Math.max(10, Math.hypot(dx, dy));
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  // Natural anatomical finger proportions:
  // Taper gently from base to middle phalanx (PIP) and distal phalanx (DIP)
  const rTip = radius * 0.90;

  // Fingertip points with soft curvature
  const tL = { x: tip.x - nx * rTip, y: tip.y - ny * rTip };
  const tApex = { x: tip.x + ux * (rTip * 0.72), y: tip.y + uy * (rTip * 0.72) };
  const tR = { x: tip.x + nx * rTip, y: tip.y + ny * rTip };

  // Left side: smooth natural anatomical curve from base knuckle to fingertip
  const c1L = { x: bL.x + ux * (len * 0.38) - nx * (radius * 0.08), y: bL.y + uy * (len * 0.38) - ny * (radius * 0.08) };
  const c2L = { x: tL.x - ux * (len * 0.24) - nx * (radius * 0.03), y: tL.y - uy * (len * 0.24) - ny * (radius * 0.03) };
  const upSide = `C ${c1L.x.toFixed(1)} ${c1L.y.toFixed(1)}, ${c2L.x.toFixed(1)} ${c2L.y.toFixed(1)}, ${tL.x.toFixed(1)} ${tL.y.toFixed(1)}`;

  // Fingertip dome: gentle, soft rounded organic dome without sharp corners
  const cDome1 = { x: tL.x + ux * (rTip * 0.44), y: tL.y + uy * (rTip * 0.44) };
  const cDome2 = { x: tApex.x - nx * (rTip * 0.44), y: tApex.y - ny * (rTip * 0.44) };
  const cDome3 = { x: tApex.x + nx * (rTip * 0.44), y: tApex.y + ny * (rTip * 0.44) };
  const cDome4 = { x: tR.x + ux * (rTip * 0.44), y: tR.y + uy * (rTip * 0.44) };
  const dome = `C ${cDome1.x.toFixed(1)} ${cDome1.y.toFixed(1)}, ${cDome2.x.toFixed(1)} ${cDome2.y.toFixed(1)}, ${tApex.x.toFixed(1)} ${tApex.y.toFixed(1)} C ${cDome3.x.toFixed(1)} ${cDome3.y.toFixed(1)}, ${cDome4.x.toFixed(1)} ${cDome4.y.toFixed(1)}, ${tR.x.toFixed(1)} ${tR.y.toFixed(1)}`;

  // Right side: smooth natural anatomical curve from fingertip to base knuckle
  const c1R = { x: tR.x - ux * (len * 0.24) + nx * (radius * 0.03), y: tR.y - uy * (len * 0.24) + ny * (radius * 0.03) };
  const c2R = { x: bR.x + ux * (len * 0.38) + nx * (radius * 0.08), y: bR.y + uy * (len * 0.38) + ny * (radius * 0.08) };
  const downSide = `C ${c1R.x.toFixed(1)} ${c1R.y.toFixed(1)}, ${c2R.x.toFixed(1)} ${c2R.y.toFixed(1)}, ${bR.x.toFixed(1)} ${bR.y.toFixed(1)}`;

  // Fingernail center and orientation (natural, delicate placement with subtle gap from tip)
  const nailDist = len - rTip * 0.38;
  const nailCenter = { x: mx + ux * nailDist, y: my + uy * nailDist };
  const nailAngleDeg = (Math.atan2(uy, ux) * 180) / Math.PI;

  // PIP crease arc (gentle soft curve at 48% of finger length)
  const pipDist = len * 0.48;
  const pMidX = mx + ux * pipDist;
  const pMidY = my + uy * pipDist;
  const pW = radius * 0.42;
  const pL = { x: pMidX - nx * pW, y: pMidY - ny * pW };
  const pC = { x: pMidX + ux * 0.7, y: pMidY + uy * 0.7 };
  const pR = { x: pMidX + nx * pW, y: pMidY + ny * pW };
  const pipCrease = `M ${pL.x.toFixed(1)} ${pL.y.toFixed(1)} Q ${pC.x.toFixed(1)} ${pC.y.toFixed(1)} ${pR.x.toFixed(1)} ${pR.y.toFixed(1)}`;

  // DIP crease arc (gentle soft curve at 74% of finger length)
  const dipDist = len * 0.74;
  const dMidX = mx + ux * dipDist;
  const dMidY = my + uy * dipDist;
  const dW = radius * 0.36;
  const dL = { x: dMidX - nx * dW, y: dMidY - ny * dW };
  const dC = { x: dMidX + ux * 0.6, y: dMidY + uy * 0.6 };
  const dR = { x: dMidX + nx * dW, y: dMidY + ny * dW };
  const dipCrease = `M ${dL.x.toFixed(1)} ${dL.y.toFixed(1)} Q ${dC.x.toFixed(1)} ${dC.y.toFixed(1)} ${dR.x.toFixed(1)} ${dR.y.toFixed(1)}`;

  return {
    upSide,
    dome,
    downSide,
    pipCrease,
    dipCrease,
    tL,
    tR,
    tApex,
    nail: {
      cx: nailCenter.x,
      cy: nailCenter.y,
      rx: radius * 0.46,
      ry: radius * 0.32,
      angleDeg: nailAngleDeg,
    },
  };
}

// Generates smooth, continuous Left Hand path and individual finger data
function buildLeftHand(tips: Record<string, Point>) {
  const pBaseL = { x: 172, y: 242 };
  const pBaseR = { x: 216, y: 232 };
  const vPR = { x: 224, y: 235 };

  const rBaseL = { x: 232, y: 230 };
  const rBaseR = { x: 266, y: 226 };
  const vRM = { x: 274, y: 230 };

  const mBaseL = { x: 282, y: 226 };
  const mBaseR = { x: 316, y: 228 };
  const vMI = { x: 324, y: 231 };

  const iBaseL = { x: 332, y: 228 };
  const iBaseR = { x: 366, y: 236 };
  const vIT = { x: 372, y: 248 };

  const tBaseL = { x: 372, y: 248 };
  const tBaseR = { x: 345, y: 275 };

  const pinky = buildFingerContour(pBaseL, pBaseR, tips['left-pinky'] || REST_POSITIONS['left-pinky'], 11);
  const ring = buildFingerContour(rBaseL, rBaseR, tips['left-ring'] || REST_POSITIONS['left-ring'], 12);
  const middle = buildFingerContour(mBaseL, mBaseR, tips['left-middle'] || REST_POSITIONS['left-middle'], 12.5);
  const index = buildFingerContour(iBaseL, iBaseR, tips['left-index'] || REST_POSITIONS['left-index'], 12.5);
  const thumb = buildFingerContour(tBaseL, tBaseR, tips['left-thumb'] || REST_POSITIONS['left-thumb'], 13.5);

  const handPath = [
    `M 145 300`,
    `C 148 275, 158 255, ${pBaseL.x} ${pBaseL.y}`,
    pinky.upSide,
    pinky.dome,
    pinky.downSide,
    `Q ${vPR.x} ${vPR.y}, ${rBaseL.x} ${rBaseL.y}`,
    ring.upSide,
    ring.dome,
    ring.downSide,
    `Q ${vRM.x} ${vRM.y}, ${mBaseL.x} ${mBaseL.y}`,
    middle.upSide,
    middle.dome,
    middle.downSide,
    `Q ${vMI.x} ${vMI.y}, ${iBaseL.x} ${iBaseL.y}`,
    index.upSide,
    index.dome,
    index.downSide,
    `Q ${vIT.x} ${vIT.y}, ${tBaseL.x} ${tBaseL.y}`,
    thumb.upSide,
    thumb.dome,
    thumb.downSide,
    `C 338 285, 326 295, 315 300`,
    `C 260 306, 185 306, 145 300 Z`,
  ].join(' ');

  const palmCreases = [
    `M 368 252 Q 330 268 312 295`,
    `M 356 248 Q 280 255 200 252`,
    `M 320 236 Q 260 242 185 250`,
  ];

  return {
    handPath,
    palmCreases,
    fingers: {
      'left-pinky': { contour: pinky, bL: pBaseL, bR: pBaseR, tip: tips['left-pinky'] || REST_POSITIONS['left-pinky'] },
      'left-ring': { contour: ring, bL: rBaseL, bR: rBaseR, tip: tips['left-ring'] || REST_POSITIONS['left-ring'] },
      'left-middle': { contour: middle, bL: mBaseL, bR: mBaseR, tip: tips['left-middle'] || REST_POSITIONS['left-middle'] },
      'left-index': { contour: index, bL: iBaseL, bR: iBaseR, tip: tips['left-index'] || REST_POSITIONS['left-index'] },
      'left-thumb': { contour: thumb, bL: tBaseL, bR: tBaseR, tip: tips['left-thumb'] || REST_POSITIONS['left-thumb'] },
    },
  };
}

// Generates smooth, continuous Right Hand path and individual finger data
function buildRightHand(tips: Record<string, Point>) {
  const tBaseL = { x: 555, y: 275 };
  const tBaseR = { x: 528, y: 248 };
  const vIT = { x: 528, y: 248 };

  const iBaseL = { x: 534, y: 236 };
  const iBaseR = { x: 568, y: 228 };
  const vMI = { x: 576, y: 231 };

  const mBaseL = { x: 584, y: 228 };
  const mBaseR = { x: 618, y: 226 };
  const vRM = { x: 626, y: 230 };

  const rBaseL = { x: 634, y: 226 };
  const rBaseR = { x: 668, y: 230 };
  const vPR = { x: 676, y: 235 };

  const pBaseL = { x: 684, y: 232 };
  const pBaseR = { x: 728, y: 242 };

  const thumb = buildFingerContour(tBaseL, tBaseR, tips['right-thumb'] || REST_POSITIONS['right-thumb'], 13.5);
  const index = buildFingerContour(iBaseL, iBaseR, tips['right-index'] || REST_POSITIONS['right-index'], 12.5);
  const middle = buildFingerContour(mBaseL, mBaseR, tips['right-middle'] || REST_POSITIONS['right-middle'], 12.5);
  const ring = buildFingerContour(rBaseL, rBaseR, tips['right-ring'] || REST_POSITIONS['right-ring'], 12);
  const pinky = buildFingerContour(pBaseL, pBaseR, tips['right-pinky'] || REST_POSITIONS['right-pinky'], 11);

  const handPath = [
    `M 585 300`,
    `C 574 295, 562 285, ${tBaseL.x} ${tBaseL.y}`,
    thumb.upSide,
    thumb.dome,
    thumb.downSide,
    `Q ${vIT.x} ${vIT.y}, ${iBaseL.x} ${iBaseL.y}`,
    index.upSide,
    index.dome,
    index.downSide,
    `Q ${vMI.x} ${vMI.y}, ${mBaseL.x} ${mBaseL.y}`,
    middle.upSide,
    middle.dome,
    middle.downSide,
    `Q ${vRM.x} ${vRM.y}, ${rBaseL.x} ${rBaseL.y}`,
    ring.upSide,
    ring.dome,
    ring.downSide,
    `Q ${vPR.x} ${vPR.y}, ${pBaseL.x} ${pBaseL.y}`,
    pinky.upSide,
    pinky.dome,
    pinky.downSide,
    `C 742 255, 752 275, 755 300`,
    `C 715 306, 640 306, 585 300 Z`,
  ].join(' ');

  const palmCreases = [
    `M 532 252 Q 570 268 588 295`,
    `M 544 248 Q 620 255 700 252`,
    `M 580 236 Q 640 242 715 250`,
  ];

  return {
    handPath,
    palmCreases,
    fingers: {
      'right-thumb': { contour: thumb, bL: tBaseL, bR: tBaseR, tip: tips['right-thumb'] || REST_POSITIONS['right-thumb'] },
      'right-index': { contour: index, bL: iBaseL, bR: iBaseR, tip: tips['right-index'] || REST_POSITIONS['right-index'] },
      'right-middle': { contour: middle, bL: mBaseL, bR: mBaseR, tip: tips['right-middle'] || REST_POSITIONS['right-middle'] },
      'right-ring': { contour: ring, bL: rBaseL, bR: rBaseR, tip: tips['right-ring'] || REST_POSITIONS['right-ring'] },
      'right-pinky': { contour: pinky, bL: pBaseL, bR: pBaseR, tip: tips['right-pinky'] || REST_POSITIONS['right-pinky'] },
    },
  };
}

const VirtualKeyboardComponent: React.FC<VirtualKeyboardProps> = ({
  activeKeyCode,
  activeKey,
  targetKey,
  targetKeyCode,
  targetFinger,
  needsShift,
  lastFingerUsed,
  isCorrectLastKey,
  isCorrect,
  showHandsOverlay = true,
}) => {
  // Normalize target key & correct status
  const effectiveTargetKey = targetKey || targetKeyCode || activeKey || null;
  const effectiveIsCorrect = isCorrectLastKey !== undefined ? isCorrectLastKey : isCorrect;

  // Resolve target key code and target finger
  const { resolvedKeyCode, effectiveFinger } = useMemo(() => {
    let resolvedCode: string | null = null;
    let finger: FingerType | null = targetFinger || null;

    if (effectiveTargetKey) {
      for (const row of KEYBOARD_LAYOUT) {
        const found = row.find(
          (k) =>
            k.code === effectiveTargetKey ||
            k.charKo === effectiveTargetKey ||
            k.charKoShift === effectiveTargetKey ||
            k.charEn?.toLowerCase() === effectiveTargetKey.toLowerCase() ||
            k.charEnShift?.toLowerCase() === effectiveTargetKey.toLowerCase() ||
            (k.display && k.display.toLowerCase() === effectiveTargetKey.toLowerCase())
        );
        if (found) {
          resolvedCode = found.code;
          if (!finger) {
            finger = found.finger as FingerType;
          }
          break;
        }
      }
    }

    if (!resolvedCode && effectiveTargetKey) {
      if (KEY_COORDINATES[effectiveTargetKey]) {
        resolvedCode = effectiveTargetKey;
        if (!finger) {
          finger = KEY_COORDINATES[effectiveTargetKey].finger as FingerType;
        }
      }
    }

    return { resolvedKeyCode: resolvedCode, effectiveFinger: finger };
  }, [effectiveTargetKey, targetFinger]);

  // Determine which primary finger moves to which target coordinate
  const effectiveActiveFingerKey = useMemo(() => {
    if (resolvedKeyCode === 'Space') {
      return 'right-thumb';
    }
    if (effectiveFinger === 'thumb') {
      return 'right-thumb';
    }
    if (effectiveFinger) {
      return effectiveFinger;
    }
    if (resolvedKeyCode && KEY_COORDINATES[resolvedKeyCode]) {
      return KEY_COORDINATES[resolvedKeyCode].finger;
    }
    return null;
  }, [resolvedKeyCode, effectiveFinger]);

  // Check if target character requires Shift key (Hangul double consonants, English uppercase, symbols)
  const isShiftRequired = useMemo(() => {
    if (needsShift !== undefined && needsShift !== null) return Boolean(needsShift);
    if (!effectiveTargetKey) return false;

    // Korean shifted double consonants / complex vowels (ㅃ, ㅉ, ㄸ, ㄲ, ㅆ, ㅒ, ㅖ)
    const KOREAN_SHIFT_CHARS = ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'];
    if (KOREAN_SHIFT_CHARS.includes(effectiveTargetKey)) return true;

    // English uppercase letters (A-Z)
    if (typeof effectiveTargetKey === 'string') {
      if (effectiveTargetKey.length === 1 && /[A-Z]/.test(effectiveTargetKey)) {
        return true;
      }
      // Hangul syllable check: decompose to see if initial consonant is a double consonant
      const code = effectiveTargetKey.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const chosungIdx = Math.floor((code - 0xac00) / (21 * 28));
        const chosungChar = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'][chosungIdx];
        if (KOREAN_SHIFT_CHARS.includes(chosungChar)) return true;
      }
    }

    // Shifted symbols
    const SHIFT_SYMBOLS = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'];
    if (SHIFT_SYMBOLS.includes(effectiveTargetKey)) return true;

    // Check against KEYBOARD_LAYOUT shifted characters
    for (const row of KEYBOARD_LAYOUT) {
      const matchShift = row.find(
        (k) =>
          (k.charKoShift && k.charKoShift === effectiveTargetKey && k.charKoShift !== k.charKo) ||
          (k.charEnShift && k.charEnShift === effectiveTargetKey && k.charEnShift !== k.charEn)
      );
      if (matchShift) return true;
    }

    return false;
  }, [needsShift, effectiveTargetKey]);

  // Standard touch typing Shift rule:
  // If the target key is on the LEFT hand, the RIGHT PINKY presses ShiftRight.
  // If the target key is on the RIGHT hand, the LEFT PINKY presses ShiftLeft.
  const { activeShiftKeyCode, activeShiftFingerKey } = useMemo(() => {
    if (!isShiftRequired) {
      return { activeShiftKeyCode: null, activeShiftFingerKey: null };
    }
    const isLeftHand = effectiveActiveFingerKey?.startsWith('left');
    if (isLeftHand) {
      return { activeShiftKeyCode: 'ShiftRight', activeShiftFingerKey: 'right-pinky' };
    } else {
      return { activeShiftKeyCode: 'ShiftLeft', activeShiftFingerKey: 'left-pinky' };
    }
  }, [isShiftRequired, effectiveActiveFingerKey]);

  // Compute target coordinates for all 10 fingers
  // Active typing finger extends to target key, and pinky extends to Shift key if needed
  const targetPositions = useMemo<Record<string, Point>>(() => {
    const nextTargets: Record<string, Point> = { ...REST_POSITIONS };

    if (effectiveActiveFingerKey && resolvedKeyCode && KEY_COORDINATES[resolvedKeyCode]) {
      const keyCoord = KEY_COORDINATES[resolvedKeyCode];
      const isPressing = activeKeyCode === resolvedKeyCode;
      nextTargets[effectiveActiveFingerKey] = {
        x: keyCoord.x,
        y: keyCoord.y + (isPressing ? 3 : 0),
      };
    }

    if (activeShiftFingerKey && activeShiftKeyCode && KEY_COORDINATES[activeShiftKeyCode]) {
      const shiftCoord = KEY_COORDINATES[activeShiftKeyCode];
      const isShiftPressing = activeKeyCode === 'ShiftLeft' || activeKeyCode === 'ShiftRight' || activeKeyCode === activeShiftKeyCode;
      nextTargets[activeShiftFingerKey] = {
        x: shiftCoord.x,
        y: shiftCoord.y + (isShiftPressing ? 3 : 0),
      };
    }

    return nextTargets;
  }, [effectiveActiveFingerKey, resolvedKeyCode, activeKeyCode, activeShiftFingerKey, activeShiftKeyCode]);

  // 60fps smooth spring/lerp animated state for all fingers
  const [animatedTips, setAnimatedTips] = useState<Record<string, Point>>(REST_POSITIONS);
  const animatedTipsRef = useRef<Record<string, Point>>(REST_POSITIONS);
  animatedTipsRef.current = animatedTips;

  useEffect(() => {
    let animId: number;

    const animate = () => {
      let needsUpdate = false;
      const currentMap = animatedTipsRef.current;
      const updatedMap: Record<string, Point> = {};

      for (const [fKey, pos] of Object.entries(targetPositions)) {
        const target = pos as Point;
        const current = (currentMap[fKey] || target) as Point;
        const dx = target.x - current.x;
        const dy = target.y - current.y;

        // Smooth natural easing towards target (glide motion)
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          needsUpdate = true;
          updatedMap[fKey] = {
            x: current.x + dx * 0.22,
            y: current.y + dy * 0.22,
          };
        } else {
          updatedMap[fKey] = { x: target.x, y: target.y };
        }
      }

      if (needsUpdate) {
        setAnimatedTips(updatedMap);
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [targetPositions]);

  // Generate smooth hand paths based on current animated tip positions
  const leftHandData = useMemo(() => buildLeftHand(animatedTips), [animatedTips]);
  const rightHandData = useMemo(() => buildRightHand(animatedTips), [animatedTips]);

  // Target dot coordinates follow the active fingertip smoothly
  const activeTargetDot = useMemo(() => {
    if (!effectiveActiveFingerKey || !resolvedKeyCode) return null;
    return animatedTips[effectiveActiveFingerKey] || targetPositions[effectiveActiveFingerKey] || null;
  }, [effectiveActiveFingerKey, resolvedKeyCode, animatedTips, targetPositions]);

  // Shift target dot for pinky finger
  const activeShiftTargetDot = useMemo(() => {
    if (!activeShiftFingerKey || !activeShiftKeyCode) return null;
    return animatedTips[activeShiftFingerKey] || targetPositions[activeShiftFingerKey] || null;
  }, [activeShiftFingerKey, activeShiftKeyCode, animatedTips, targetPositions]);

  const isLeftAnyActive = effectiveActiveFingerKey?.startsWith('left') || activeShiftFingerKey === 'left-pinky';
  const isRightAnyActive = effectiveActiveFingerKey?.startsWith('right') || activeShiftFingerKey === 'right-pinky';

  // Active finger data for enhanced highlight
  const activeFingerData = useMemo(() => {
    if (!effectiveActiveFingerKey) return null;
    if (effectiveActiveFingerKey.startsWith('left')) {
      return (leftHandData.fingers as any)[effectiveActiveFingerKey] || null;
    }
    return (rightHandData.fingers as any)[effectiveActiveFingerKey] || null;
  }, [effectiveActiveFingerKey, leftHandData, rightHandData]);

  // Active Shift finger data (pinky) for dual finger reaching highlight
  const activeShiftFingerData = useMemo(() => {
    if (!activeShiftFingerKey) return null;
    if (activeShiftFingerKey === 'left-pinky') {
      return (leftHandData.fingers as any)['left-pinky'] || null;
    }
    return (rightHandData.fingers as any)['right-pinky'] || null;
  }, [activeShiftFingerKey, leftHandData, rightHandData]);

  return (
    <div 
      id="virtual-keyboard-container" 
      className="bg-white/95 backdrop-blur-md rounded-3xl p-3 sm:p-5 border-4 border-sky-200 shadow-xl select-none relative overflow-hidden arcade-card-glow"
    >
      {/* Keyboard Header / Finger Color Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b-2 border-sky-100 text-[10px] sm:text-xs font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-xs animate-pulse"></span>
          <span className="font-arcade text-slate-800 font-black">한컴 스타일 키보드 및 손가락 가이드</span>
          {effectiveFinger && (
            <span className="ml-2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 font-black shadow-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>목표 손가락: {FINGER_COLORS[effectiveFinger]?.name || effectiveFinger}</span>
            </span>
          )}
        </div>

        {/* Finger Legend */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>새끼</span>
          </span>
          <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>약지</span>
          </span>
          <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>중지</span>
          </span>
          <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>검지</span>
          </span>
          <span className="flex items-center gap-1 bg-slate-50 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>엄지</span>
          </span>
        </div>
      </div>

      {/* Keyboard Container with Integrated Real-time Human Hand Motion Overlay */}
      <div className="relative max-w-full overflow-x-auto no-scrollbar py-1">
        {/* Keyboard Rows */}
        <div className="space-y-1 sm:space-y-1.5 min-w-[620px] max-w-4xl mx-auto relative z-0">
          {KEYBOARD_LAYOUT.map((row, rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5">
              {row.map((key) => {
                const isMainTarget = resolvedKeyCode === key.code || effectiveTargetKey === key.code;
                const isShiftTarget = activeShiftKeyCode === key.code;
                const isTarget = isMainTarget || isShiftTarget;
                const isActive = activeKeyCode === key.code;

                let keyStateStyles = 'bg-gradient-to-b from-white to-slate-100 border-slate-300/80 text-slate-800 shadow-[0_2px_0_rgba(0,0,0,0.08)] hover:border-sky-300';

                if (isMainTarget) {
                  // Vibrant Target Key with warm orange glow & raised highlight
                  keyStateStyles = 'bg-gradient-to-b from-amber-50 to-amber-200 text-slate-950 border-amber-500 ring-4 ring-amber-300/80 shadow-[0_4px_12px_rgba(245,158,11,0.4)] font-black scale-105 z-20 animate-pulse';
                } else if (isShiftTarget) {
                  // Shift Target Key for Pinky finger guidance
                  keyStateStyles = 'bg-gradient-to-b from-amber-100 to-orange-200 text-orange-950 border-orange-500 ring-4 ring-orange-400/90 shadow-[0_4px_12px_rgba(249,115,22,0.45)] font-black scale-105 z-20 animate-pulse';
                } else if (isActive) {
                  // Currently pressed key feedback
                  if (effectiveIsCorrect === false) {
                    keyStateStyles = 'bg-rose-500 text-white border-rose-600 ring-4 ring-rose-300 shadow-xs translate-y-0.5 font-black z-20';
                  } else {
                    keyStateStyles = 'bg-emerald-400 text-slate-950 border-emerald-500 ring-4 ring-emerald-300 shadow-xs translate-y-0.5 font-black z-20';
                  }
                }

                const widthClass = key.width || 'w-8 sm:w-11';

                return (
                  <div
                    key={key.code}
                    id={`vk-key-${key.code}`}
                    className={`h-10 sm:h-12 ${widthClass} rounded-xl sm:rounded-2xl border-2 flex flex-col justify-between p-1 transition-all duration-150 cursor-default select-none relative ${keyStateStyles}`}
                  >
                    {/* Top Row inside Keycap: Shift char or empty */}
                    <div className="flex items-center justify-between w-full leading-none">
                      {key.charKoShift && key.charKoShift !== key.charKo ? (
                        <span className={`text-[9px] sm:text-[11px] font-black text-rose-500/90 leading-none ${isTarget ? 'text-amber-900 font-extrabold' : ''}`}>
                          {key.charKoShift}
                        </span>
                      ) : (
                        <span></span>
                      )}

                      {/* Display / Function Key Text */}
                      {key.display && (
                        <span className="text-[9px] sm:text-xs font-black truncate text-center w-full text-slate-700">
                          {key.display}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row inside Keycap: Main Korean Char & English Char */}
                    {!key.display && (
                      <div className="flex items-baseline justify-between w-full leading-none mt-auto">
                        {/* Main Hangul Char */}
                        <span className={`text-xs sm:text-base font-black leading-none ${isTarget ? 'text-slate-950 font-black' : 'text-slate-800'}`}>
                          {key.charKo}
                        </span>

                        {/* English / Secondary char */}
                        {key.charEn && key.charEn !== key.charKo && (
                          <span className={`text-[8px] sm:text-[10px] font-bold leading-none ${
                            isTarget ? 'text-amber-900 font-black' : 'text-slate-400'
                          }`}>
                            {key.charEn.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* =========================================================================
            SMOOTH HUMAN HANDS OVERLAY WITH DYNAMIC FINGER ELONGATION (한컴 타자 가이드)
           ========================================================================= */}
        {showHandsOverlay && (
          <div className="absolute inset-0 pointer-events-none z-10 min-w-[620px] max-w-4xl mx-auto">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 900 300"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Natural Translucent Skin Gradients for Left and Right Hands */}
                <linearGradient id="handSkinGradLeft" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.45" />
                  <stop offset="55%" stopColor="#fff7ed" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#fdba74" stopOpacity="0.22" />
                </linearGradient>

                <linearGradient id="handSkinGradRight" x1="100%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.45" />
                  <stop offset="55%" stopColor="#fff7ed" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#fdba74" stopOpacity="0.22" />
                </linearGradient>

                {/* Active Reaching Finger Luminous Gradient */}
                <linearGradient id="activeFingerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fdba74" stopOpacity="0.60" />
                  <stop offset="60%" stopColor="#fb923c" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity="0.35" />
                </linearGradient>

                {/* Active Shift Pinky Finger Luminous Gradient */}
                <linearGradient id="activeShiftFingerGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.60" />
                  <stop offset="60%" stopColor="#f97316" stopOpacity="0.48" />
                  <stop offset="100%" stopColor="#c2410c" stopOpacity="0.35" />
                </linearGradient>

                {/* Active Finger Radiant Glow */}
                <filter id="handOutlineGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(234, 88, 12, 0.75)" />
                </filter>
                <filter id="activeTargetDotGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="rgba(234, 88, 12, 0.9)" />
                  <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#ffffff" />
                </filter>
              </defs>

              {/* ======================= LEFT HAND (NATURAL ORGANIC OUTLINE & VOLUME) ======================= */}
              <g id="left-hand-group">
                {/* Left Hand Smooth Unified Outline with Soft Skin Fill */}
                <path
                  d={leftHandData.handPath}
                  fill="url(#handSkinGradLeft)"
                  stroke={isLeftAnyActive ? "#ea580c" : "#f97316"}
                  strokeWidth={isLeftAnyActive ? "2.0" : "1.6"}
                  strokeOpacity={isLeftAnyActive ? "0.85" : "0.60"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Left Hand Palm Creases */}
                {leftHandData.palmCreases.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="0.9"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                  />
                ))}

                {/* Left Hand Finger Joint Creases (부드러운 손가락 마디선) */}
                {Object.entries(leftHandData.fingers).map(([fKey, fData]: [string, any]) => (
                  <g key={fKey} opacity={effectiveActiveFingerKey === fKey ? 0.8 : 0.35}>
                    <path d={fData.contour.pipCrease} fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
                    <path d={fData.contour.dipCrease} fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
                  </g>
                ))}

                {/* Left Hand Fingernails (자연스러운 투명 손톱 디테일) */}
                {Object.entries(leftHandData.fingers).map(([fKey, fData]: [string, any]) => {
                  const nail = fData.contour.nail;
                  const isAct = effectiveActiveFingerKey === fKey;
                  return (
                    <ellipse
                      key={`nail-${fKey}`}
                      cx={nail.cx}
                      cy={nail.cy}
                      rx={nail.rx}
                      ry={nail.ry}
                      transform={`rotate(${nail.angleDeg}, ${nail.cx}, ${nail.cy})`}
                      fill={isAct ? "#fff1f2" : "#ffffff"}
                      fillOpacity={isAct ? "0.85" : "0.65"}
                      stroke="#ea580c"
                      strokeWidth={isAct ? "1.2" : "0.8"}
                      strokeOpacity={isAct ? "0.8" : "0.4"}
                    />
                  );
                })}
              </g>

              {/* ======================= RIGHT HAND (NATURAL ORGANIC OUTLINE & VOLUME) ======================= */}
              <g id="right-hand-group">
                {/* Right Hand Smooth Unified Outline with Soft Skin Fill */}
                <path
                  d={rightHandData.handPath}
                  fill="url(#handSkinGradRight)"
                  stroke={isRightAnyActive ? "#ea580c" : "#f97316"}
                  strokeWidth={isRightAnyActive ? "2.0" : "1.6"}
                  strokeOpacity={isRightAnyActive ? "0.85" : "0.60"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Right Hand Palm Creases */}
                {rightHandData.palmCreases.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="0.9"
                    strokeOpacity="0.25"
                    strokeLinecap="round"
                  />
                ))}

                {/* Right Hand Finger Joint Creases (부드러운 손가락 마디선) */}
                {Object.entries(rightHandData.fingers).map(([fKey, fData]: [string, any]) => (
                  <g key={fKey} opacity={effectiveActiveFingerKey === fKey ? 0.8 : 0.35}>
                    <path d={fData.contour.pipCrease} fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
                    <path d={fData.contour.dipCrease} fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
                  </g>
                ))}

                {/* Right Hand Fingernails (자연스러운 투명 손톱 디테일) */}
                {Object.entries(rightHandData.fingers).map(([fKey, fData]: [string, any]) => {
                  const nail = fData.contour.nail;
                  const isAct = effectiveActiveFingerKey === fKey;
                  return (
                    <ellipse
                      key={`nail-${fKey}`}
                      cx={nail.cx}
                      cy={nail.cy}
                      rx={nail.rx}
                      ry={nail.ry}
                      transform={`rotate(${nail.angleDeg}, ${nail.cx}, ${nail.cy})`}
                      fill={isAct ? "#fff1f2" : "#ffffff"}
                      fillOpacity={isAct ? "0.85" : "0.65"}
                      stroke="#ea580c"
                      strokeWidth={isAct ? "1.2" : "0.8"}
                      strokeOpacity={isAct ? "0.8" : "0.4"}
                    />
                  );
                })}
              </g>

              {/* ======================= 치고하는 손가락 강조 윤곽선 & 볼륨 (손가락이 길어져서 목표 키로 도달) ======================= */}
              {activeFingerData && (
                <g id="active-reaching-finger" filter="url(#handOutlineGlow)">
                  <path
                    d={`M ${activeFingerData.bL.x} ${activeFingerData.bL.y} ${activeFingerData.contour.upSide} ${activeFingerData.contour.dome} ${activeFingerData.contour.downSide} Z`}
                    fill="url(#activeFingerGrad)"
                    stroke="#ea580c"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={activeFingerData.contour.pipCrease}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                  />
                  <path
                    d={activeFingerData.contour.dipCrease}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                  />
                  {/* Active Reaching Finger Nail Accent */}
                  <ellipse
                    cx={activeFingerData.contour.nail.cx}
                    cy={activeFingerData.contour.nail.cy}
                    rx={activeFingerData.contour.nail.rx}
                    ry={activeFingerData.contour.nail.ry}
                    transform={`rotate(${activeFingerData.contour.nail.angleDeg}, ${activeFingerData.contour.nail.cx}, ${activeFingerData.contour.nail.cy})`}
                    fill="#fff1f2"
                    fillOpacity="0.9"
                    stroke="#ea580c"
                    strokeWidth="1.4"
                  />
                </g>
              )}

              {/* ======================= Shift 키를 누르는 새끼손가락 강조 (대문자/쌍자음 동시 가이드) ======================= */}
              {activeShiftFingerData && (
                <g id="active-shift-finger" filter="url(#handOutlineGlow)">
                  <path
                    d={`M ${activeShiftFingerData.bL.x} ${activeShiftFingerData.bL.y} ${activeShiftFingerData.contour.upSide} ${activeShiftFingerData.contour.dome} ${activeShiftFingerData.contour.downSide} Z`}
                    fill="url(#activeShiftFingerGrad)"
                    stroke="#ea580c"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={activeShiftFingerData.contour.pipCrease}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                  />
                  <path
                    d={activeShiftFingerData.contour.dipCrease}
                    fill="none"
                    stroke="#ea580c"
                    strokeWidth="1.2"
                    strokeOpacity="0.8"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx={activeShiftFingerData.contour.nail.cx}
                    cy={activeShiftFingerData.contour.nail.cy}
                    rx={activeShiftFingerData.contour.nail.rx}
                    ry={activeShiftFingerData.contour.nail.ry}
                    transform={`rotate(${activeShiftFingerData.contour.nail.angleDeg}, ${activeShiftFingerData.contour.nail.cx}, ${activeShiftFingerData.contour.nail.cy})`}
                    fill="#fff1f2"
                    fillOpacity="0.9"
                    stroke="#ea580c"
                    strokeWidth="1.4"
                  />
                </g>
              )}

              {/* ======================= 한컴 스타일 타겟 키 주황색 원형 점 표시 (손끝 위치 동기화 이동) ======================= */}
              {activeTargetDot && (
                <g filter="url(#activeTargetDotGlow)">
                  {/* Outer pulsing radar ring */}
                  <circle
                    cx={activeTargetDot.x}
                    cy={activeTargetDot.y}
                    r="16"
                    fill="#f97316"
                    opacity="0.25"
                    className="animate-ping origin-center"
                  />
                  {/* Hancom Solid Orange Target Marker */}
                  <circle
                    cx={activeTargetDot.x}
                    cy={activeTargetDot.y}
                    r="10.5"
                    fill="#ea580c"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  {/* Center highlight specular dot */}
                  <circle
                    cx={activeTargetDot.x - 2.5}
                    cy={activeTargetDot.y - 2.5}
                    r="3"
                    fill="#ffffff"
                    opacity="0.9"
                  />
                </g>
              )}

              {/* ======================= Shift 키 타겟 원형 점 표시 (새끼손가락 위치) ======================= */}
              {activeShiftTargetDot && (
                <g filter="url(#activeTargetDotGlow)">
                  <circle
                    cx={activeShiftTargetDot.x}
                    cy={activeShiftTargetDot.y}
                    r="14"
                    fill="#f97316"
                    opacity="0.25"
                    className="animate-ping origin-center"
                  />
                  <circle
                    cx={activeShiftTargetDot.x}
                    cy={activeShiftTargetDot.y}
                    r="9.5"
                    fill="#ea580c"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                  />
                  <circle
                    cx={activeShiftTargetDot.x - 2}
                    cy={activeShiftTargetDot.y - 2}
                    r="2.5"
                    fill="#ffffff"
                    opacity="0.9"
                  />
                </g>
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export const VirtualKeyboard = React.memo(VirtualKeyboardComponent);


