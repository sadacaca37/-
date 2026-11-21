import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
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

interface HandLayoutBox {
  left: number;
  top: number;
  width: number;
  height: number;
  rotateDeg: number;
  tips: Record<string, Point>;
}

interface OverlayMetrics {
  width: number;
  height: number;
  keyCenters: Record<string, Point>;
  leftHand: HandLayoutBox;
  rightHand: HandLayoutBox;
}

// Fallback finger assignment for every keycode when targetFinger isn't explicitly passed
const KEY_FINGER_MAP: Record<string, string> = {
  Backquote: 'left-pinky',
  Digit1: 'left-pinky',
  Digit2: 'left-ring',
  Digit3: 'left-middle',
  Digit4: 'left-index',
  Digit5: 'left-index',
  Digit6: 'right-index',
  Digit7: 'right-index',
  Digit8: 'right-middle',
  Digit9: 'right-ring',
  Digit0: 'right-pinky',
  Minus: 'right-pinky',
  Equal: 'right-pinky',
  Backspace: 'right-pinky',

  Tab: 'left-pinky',
  KeyQ: 'left-pinky',
  KeyW: 'left-ring',
  KeyE: 'left-middle',
  KeyR: 'left-index',
  KeyT: 'left-index',
  KeyY: 'right-index',
  KeyU: 'right-index',
  KeyI: 'right-middle',
  KeyO: 'right-ring',
  KeyP: 'right-pinky',
  BracketLeft: 'right-pinky',
  BracketRight: 'right-pinky',
  Backslash: 'right-pinky',

  CapsLock: 'left-pinky',
  KeyA: 'left-pinky',
  KeyS: 'left-ring',
  KeyD: 'left-middle',
  KeyF: 'left-index',
  KeyG: 'left-index',
  KeyH: 'right-index',
  KeyJ: 'right-index',
  KeyK: 'right-middle',
  KeyL: 'right-ring',
  Semicolon: 'right-pinky',
  Quote: 'right-pinky',
  Enter: 'right-pinky',

  ShiftLeft: 'left-pinky',
  KeyZ: 'left-pinky',
  KeyX: 'left-ring',
  KeyC: 'left-middle',
  KeyV: 'left-index',
  KeyB: 'left-index',
  KeyN: 'right-index',
  KeyM: 'right-index',
  Comma: 'right-middle',
  Period: 'right-ring',
  Slash: 'right-pinky',
  ShiftRight: 'right-pinky',

  Space: 'right-thumb',
};

// Keys where the hands rest cleanly on their home position (no translation needed)
const HOME_AND_SPACE_KEYS = new Set<string>([
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyF',
  'KeyJ',
  'KeyK',
  'KeyL',
  'Semicolon',
  'Space',
]);

type HandFeedbackState = {
  kind: 'idle' | 'tap' | 'shake';
  seq: number;
};

// Finger accent hex colors matching the 5-color legend (새끼·약지·중지·검지·엄지)
const FINGER_ACCENT_HEX: Record<string, string> = {
  'left-pinky': '#a855f7',
  'right-pinky': '#a855f7',
  'left-ring': '#0ea5e9',
  'right-ring': '#0ea5e9',
  'left-middle': '#14b8a6',
  'right-middle': '#14b8a6',
  'left-index': '#10b981',
  'right-index': '#10b981',
  'left-thumb': '#f59e0b',
  'right-thumb': '#f59e0b',
};

// Intrinsic pixel dimensions of public/assets/practice/hand-left.webp & hand-right.webp
const HAND_IMG_W = 320;
const HAND_IMG_H = 512;

// Measured fingertip pad centers inside the 320x512 hand-right.webp asset
const RIGHT_RAW_TIPS: Record<string, Point> = {
  'right-thumb': { x: 18, y: 212 },
  'right-index': { x: 81, y: 54 },
  'right-middle': { x: 155, y: 22 },
  'right-ring': { x: 218, y: 46 },
  'right-pinky': { x: 294, y: 104 },
};

// Exact horizontal mirror for hand-left.webp
const LEFT_RAW_TIPS: Record<string, Point> = {
  'left-pinky': { x: HAND_IMG_W - 294, y: 104 },
  'left-ring': { x: HAND_IMG_W - 218, y: 46 },
  'left-middle': { x: HAND_IMG_W - 155, y: 22 },
  'left-index': { x: HAND_IMG_W - 81, y: 54 },
  'left-thumb': { x: HAND_IMG_W - 18, y: 212 },
};

// Gentle natural typing angle: levels the 4 home fingers while angling thumbs over Spacebar
const LEFT_HAND_ROTATE_DEG = 7;
const RIGHT_HAND_ROTATE_DEG = -7;

/**
 * Matches exact CSS rendering order: scale raw (320x512) image to (boxW x boxH),
 * then rotate around box center (boxW/2, boxH/2) by rotateDeg.
 */
function projectRawTip(pt: Point, boxW: number, boxH: number, deg: number): Point {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = (pt.x / HAND_IMG_W) * boxW;
  const sy = (pt.y / HAND_IMG_H) * boxH;
  const cx = boxW / 2;
  const cy = boxH / 2;
  const dx = sx - cx;
  const dy = sy - cy;
  return {
    x: dx * cos - dy * sin + cx,
    y: dx * sin + dy * cos + cy,
  };
}

/**
 * Computes exact pixel box & rotated fingertip coordinates in unscaled stage CSS pixels
 * so the 4 home-row fingertips sit directly over the measured DOM centers of
 * KeyA/S/D/F (left) or KeyJ/K/L/; (right) and both thumbs rest directly over Spacebar.
 */
function computeHandBox(
  side: 'left' | 'right',
  homeKeyPts: Point[], // [A, S, D, F] for left, [J, K, L, ;] for right
  spaceKeyPt: Point | undefined
): HandLayoutBox {
  const rotateDeg = side === 'left' ? LEFT_HAND_ROTATE_DEG : RIGHT_HAND_ROTATE_DEG;
  const rawTips = side === 'left' ? LEFT_RAW_TIPS : RIGHT_RAW_TIPS;
  const homeKeys =
    side === 'left'
      ? ['left-pinky', 'left-ring', 'left-middle', 'left-index']
      : ['right-index', 'right-middle', 'right-ring', 'right-pinky'];
  const thumbKey = side === 'left' ? 'left-thumb' : 'right-thumb';

  // Step 1: initial rotation at 1:1 scale to solve least-squares horizontal fit across all 4 home keys
  const unitRotated: Record<string, Point> = {};
  for (const [k, pt] of Object.entries(rawTips)) {
    unitRotated[k] = projectRawTip(pt, HAND_IMG_W, HAND_IMG_H, rotateDeg);
  }

  const rawXs = homeKeys.map((k) => unitRotated[k].x);
  const targetXs = homeKeyPts.map((p) => p.x);
  const meanRawX = rawXs.reduce((a, b) => a + b, 0) / rawXs.length;
  const meanTargetX = targetXs.reduce((a, b) => a + b, 0) / targetXs.length;

  let num = 0;
  let den = 0;
  for (let i = 0; i < 4; i++) {
    num += (rawXs[i] - meanRawX) * (targetXs[i] - meanTargetX);
    den += (rawXs[i] - meanRawX) * (rawXs[i] - meanRawX);
  }
  // Slight fullness boost (1.08x) so each fingertip visually fills ~1 keycap while staying centered on all 4 home keys
  const baseScaleX = den > 1 ? num / den : 0.72;
  const scaleX = Math.max(0.45, baseScaleX * 1.08);

  // Step 2: compute vertical scale from real measured DOM distance (home row -> Spacebar)
  const targetHomeY = homeKeyPts.reduce((a, p) => a + p.y, 0) / homeKeyPts.length - 4;
  const unitHomeAvgY = homeKeys.reduce((a, k) => a + unitRotated[k].y, 0) / homeKeys.length;
  const unitHomeToThumbY = Math.max(40, unitRotated[thumbKey].y - unitHomeAvgY);

  let scaleY = scaleX * 0.88;
  if (spaceKeyPt && spaceKeyPt.y > targetHomeY + 30) {
    const desiredHomeToThumbY = spaceKeyPt.y - targetHomeY;
    const fittedScaleY = desiredHomeToThumbY / unitHomeToThumbY;
    // Clamp to keep hand anatomy completely natural while landing thumbs squarely on Spacebar
    scaleY = Math.max(scaleX * 0.8, Math.min(scaleX * 1.02, fittedScaleY));
  }

  const width = HAND_IMG_W * scaleX;
  const height = HAND_IMG_H * scaleY;

  // Step 3: project all 5 fingertips using the exact final CSS box dimensions + rotation
  const projected: Record<string, Point> = {};
  for (const [k, pt] of Object.entries(rawTips)) {
    projected[k] = projectRawTip(pt, width, height, rotateDeg);
  }

  const projHomeMeanX = homeKeys.reduce((a, k) => a + projected[k].x, 0) / homeKeys.length;
  const projHomeMeanY = homeKeys.reduce((a, k) => a + projected[k].y, 0) / homeKeys.length;

  const left = meanTargetX - projHomeMeanX;
  const top = targetHomeY - projHomeMeanY;

  const tips: Record<string, Point> = {};
  for (const [k, pt] of Object.entries(projected)) {
    tips[k] = {
      x: left + pt.x,
      y: top + pt.y,
    };
  }

  return { left, top, width, height, rotateDeg, tips };
}

const VirtualKeyboardComponent: React.FC<VirtualKeyboardProps> = ({
  activeKeyCode,
  activeKey,
  targetKey,
  targetKeyCode,
  targetFinger,
  needsShift,
  isCorrectLastKey,
  isCorrect,
  showHandsOverlay = true,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<OverlayMetrics | null>(null);

  // Measure actual DOM positions of all keycaps in stage's unscaled local CSS coordinate space
  // (immune to PracticeWindowContainer's outer transform: scale())
  const measureKeyboard = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const cssW = stage.offsetWidth;
    const cssH = stage.offsetHeight;
    const stageRect = stage.getBoundingClientRect();
    if (cssW <= 0 || cssH <= 0 || stageRect.width <= 0 || stageRect.height <= 0) return;

    const scaleX = stageRect.width / cssW;
    const scaleY = stageRect.height / cssH;

    const keyCenters: Record<string, Point> = {};
    const keyEls = stage.querySelectorAll<HTMLElement>('[data-vk-code]');
    keyEls.forEach((el) => {
      const code = el.dataset.vkCode;
      if (!code) return;
      const r = el.getBoundingClientRect();
      keyCenters[code] = {
        x: (r.left - stageRect.left + r.width / 2) / scaleX,
        y: (r.top - stageRect.top + r.height / 2) / scaleY,
      };
    });

    const keyA = keyCenters.KeyA;
    const keyS = keyCenters.KeyS;
    const keyD = keyCenters.KeyD;
    const keyF = keyCenters.KeyF;
    const keyJ = keyCenters.KeyJ;
    const keyK = keyCenters.KeyK;
    const keyL = keyCenters.KeyL;
    const keySemi = keyCenters.Semicolon;

    if (!keyA || !keyS || !keyD || !keyF || !keyJ || !keyK || !keyL || !keySemi) return;

    const leftHand = computeHandBox('left', [keyA, keyS, keyD, keyF], keyCenters.Space);
    const rightHand = computeHandBox('right', [keyJ, keyK, keyL, keySemi], keyCenters.Space);

    setMetrics({
      width: cssW,
      height: cssH,
      keyCenters,
      leftHand,
      rightHand,
    });
  }, []);

  useLayoutEffect(() => {
    measureKeyboard();
    const stage = stageRef.current;
    if (!stage) return;

    let rafId = 0;
    const scheduleMeasure = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        measureKeyboard();
      });
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleMeasure) : null;
    ro?.observe(stage);
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('typang-stage-layout', scheduleMeasure);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('typang-stage-layout', scheduleMeasure);
    };
  }, [measureKeyboard]);

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

    if (!resolvedCode && effectiveTargetKey && KEY_FINGER_MAP[effectiveTargetKey]) {
      resolvedCode = effectiveTargetKey;
      if (!finger) {
        finger = KEY_FINGER_MAP[effectiveTargetKey] as FingerType;
      }
    }

    return { resolvedKeyCode: resolvedCode, effectiveFinger: finger };
  }, [effectiveTargetKey, targetFinger]);

  // Determine which primary finger is responsible
  const effectiveActiveFingerKey = useMemo(() => {
    if (resolvedKeyCode === 'Space') return 'right-thumb';
    if (effectiveFinger === 'thumb') return 'right-thumb';
    if (effectiveFinger) return effectiveFinger;
    if (resolvedKeyCode && KEY_FINGER_MAP[resolvedKeyCode]) {
      return KEY_FINGER_MAP[resolvedKeyCode];
    }
    return null;
  }, [resolvedKeyCode, effectiveFinger]);

  // Check if target character requires Shift key (Hangul double consonants, English uppercase, symbols)
  const isShiftRequired = useMemo(() => {
    if (needsShift !== undefined && needsShift !== null) return Boolean(needsShift);
    if (!effectiveTargetKey) return false;

    const KOREAN_SHIFT_CHARS = ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ'];
    if (KOREAN_SHIFT_CHARS.includes(effectiveTargetKey)) return true;

    if (typeof effectiveTargetKey === 'string') {
      if (effectiveTargetKey.length === 1 && /[A-Z]/.test(effectiveTargetKey)) {
        return true;
      }
      const code = effectiveTargetKey.charCodeAt(0);
      if (code >= 0xac00 && code <= 0xd7a3) {
        const chosungIdx = Math.floor((code - 0xac00) / (21 * 28));
        const chosungChar = [
          'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
        ][chosungIdx];
        if (KOREAN_SHIFT_CHARS.includes(chosungChar)) return true;
      }
    }

    const SHIFT_SYMBOLS = ['~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '{', '}', '|', ':', '"', '<', '>', '?'];
    if (SHIFT_SYMBOLS.includes(effectiveTargetKey)) return true;

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

  // Opposite-hand pinky presses Shift
  const { activeShiftKeyCode, activeShiftFingerKey } = useMemo(() => {
    if (!isShiftRequired) {
      return { activeShiftKeyCode: null, activeShiftFingerKey: null };
    }
    const isLeftHand = effectiveActiveFingerKey?.startsWith('left');
    if (isLeftHand) {
      return { activeShiftKeyCode: 'ShiftRight', activeShiftFingerKey: 'right-pinky' };
    }
    return { activeShiftKeyCode: 'ShiftLeft', activeShiftFingerKey: 'left-pinky' };
  }, [isShiftRequired, effectiveActiveFingerKey]);

  // Compute per-hand translation delta so the responsible fingertip slides onto the target key.
  // Home keys (ㅁㄴㅇㄹ / ㅓㅏㅣ;) & Space return cleanly to home position (0, 0).
  // Unused other hand stays calmly on its home position (0, 0).
  const { leftDelta, rightDelta } = useMemo<{ leftDelta: Point; rightDelta: Point }>(() => {
    const zero: Point = { x: 0, y: 0 };
    if (!metrics) return { leftDelta: zero, rightDelta: zero };

    let nextLeft: Point = zero;
    let nextRight: Point = zero;

    const deltaFor = (fingerKey: string | null, keyCode: string | null): Point => {
      if (!fingerKey || !keyCode || HOME_AND_SPACE_KEYS.has(keyCode)) return zero;
      const targetPt = metrics.keyCenters[keyCode];
      const homeTip =
        fingerKey.startsWith('left')
          ? metrics.leftHand.tips[fingerKey]
          : metrics.rightHand.tips[fingerKey];
      if (!targetPt || !homeTip) return zero;
      return {
        x: targetPt.x - homeTip.x,
        y: targetPt.y - homeTip.y,
      };
    };

    if (effectiveActiveFingerKey && resolvedKeyCode) {
      if (effectiveActiveFingerKey.startsWith('left')) {
        nextLeft = deltaFor(effectiveActiveFingerKey, resolvedKeyCode);
      } else if (effectiveActiveFingerKey.startsWith('right')) {
        nextRight = deltaFor(effectiveActiveFingerKey, resolvedKeyCode);
      }
    }

    if (activeShiftFingerKey && activeShiftKeyCode) {
      if (activeShiftFingerKey.startsWith('left')) {
        nextLeft = deltaFor(activeShiftFingerKey, activeShiftKeyCode);
      } else if (activeShiftFingerKey.startsWith('right')) {
        nextRight = deltaFor(activeShiftFingerKey, activeShiftKeyCode);
      }
    }

    return { leftDelta: nextLeft, rightDelta: nextRight };
  }, [metrics, effectiveActiveFingerKey, resolvedKeyCode, activeShiftFingerKey, activeShiftKeyCode]);

  // Tactile keypress feedback per hand: brief 80ms downward tap (2-3px), or horizontal shake on wrong key
  const [leftFeedback, setLeftFeedback] = useState<HandFeedbackState>({ kind: 'idle', seq: 0 });
  const [rightFeedback, setRightFeedback] = useState<HandFeedbackState>({ kind: 'idle', seq: 0 });
  const activeHandRef = useRef<'left' | 'right'>('right');

  const triggerHandFeedback = useCallback((side: 'left' | 'right', kind: 'tap' | 'shake') => {
    const updater = (prev: HandFeedbackState): HandFeedbackState => ({
      kind,
      seq: prev.seq + 1,
    });
    if (side === 'left') {
      setLeftFeedback(updater);
    } else {
      setRightFeedback(updater);
    }
  }, []);

  // Track which hand is currently responsible (fallback when a pressed key isn't in KEY_FINGER_MAP)
  useEffect(() => {
    if (effectiveActiveFingerKey?.startsWith('left')) {
      activeHandRef.current = 'left';
    } else if (effectiveActiveFingerKey?.startsWith('right')) {
      activeHandRef.current = 'right';
    }
  }, [effectiveActiveFingerKey]);

  // React to activeKeyCode & correctness updates from practice views (tap on correct, shake on wrong)
  useEffect(() => {
    if (!activeKeyCode) return;
    const mappedFinger = KEY_FINGER_MAP[activeKeyCode];
    const side: 'left' | 'right' = mappedFinger
      ? mappedFinger.startsWith('left')
        ? 'left'
        : 'right'
      : activeHandRef.current;

    if (effectiveIsCorrect === false) {
      triggerHandFeedback(side, 'shake');
    } else {
      triggerHandFeedback(side, 'tap');
    }
  }, [activeKeyCode, effectiveIsCorrect, triggerHandFeedback]);

  // Also react directly to physical keydowns so rapid repeated presses of the same key always tap crisply
  useEffect(() => {
    if (!showHandsOverlay) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const mappedFinger = KEY_FINGER_MAP[e.code];
      if (!mappedFinger) return;
      // Ignore bare Shift presses unless Shift is actively part of the target
      if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && !activeShiftKeyCode) return;
      const side: 'left' | 'right' = mappedFinger.startsWith('left') ? 'left' : 'right';
      triggerHandFeedback(side, 'tap');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showHandsOverlay, activeShiftKeyCode, triggerHandFeedback]);

  const leftFeedbackClass =
    leftFeedback.kind === 'shake'
      ? leftFeedback.seq % 2 === 0
        ? 'pr-hand-feedback--shake-a'
        : 'pr-hand-feedback--shake-b'
      : leftFeedback.kind === 'tap'
      ? leftFeedback.seq % 2 === 0
        ? 'pr-hand-feedback--tap-a'
        : 'pr-hand-feedback--tap-b'
      : '';

  const rightFeedbackClass =
    rightFeedback.kind === 'shake'
      ? rightFeedback.seq % 2 === 0
        ? 'pr-hand-feedback--shake-a'
        : 'pr-hand-feedback--shake-b'
      : rightFeedback.kind === 'tap'
      ? rightFeedback.seq % 2 === 0
        ? 'pr-hand-feedback--tap-a'
        : 'pr-hand-feedback--tap-b'
      : '';

  // Moved fingertip coordinates stay locked to the gliding hand illustrations
  const movedActiveFingerTip = useMemo<Point | null>(() => {
    if (!metrics || !effectiveActiveFingerKey) return null;
    const isLeft = effectiveActiveFingerKey.startsWith('left');
    const baseTip = isLeft
      ? metrics.leftHand.tips[effectiveActiveFingerKey]
      : metrics.rightHand.tips[effectiveActiveFingerKey];
    if (!baseTip) return null;
    const delta = isLeft ? leftDelta : rightDelta;
    return { x: baseTip.x + delta.x, y: baseTip.y + delta.y };
  }, [metrics, effectiveActiveFingerKey, leftDelta, rightDelta]);

  const movedShiftFingerTip = useMemo<Point | null>(() => {
    if (!metrics || !activeShiftFingerKey) return null;
    const isLeft = activeShiftFingerKey.startsWith('left');
    const baseTip = isLeft
      ? metrics.leftHand.tips[activeShiftFingerKey]
      : metrics.rightHand.tips[activeShiftFingerKey];
    if (!baseTip) return null;
    const delta = isLeft ? leftDelta : rightDelta;
    return { x: baseTip.x + delta.x, y: baseTip.y + delta.y };
  }, [metrics, activeShiftFingerKey, leftDelta, rightDelta]);

  // Target key centers for the orange dot markers
  const targetDotGoal = useMemo<Point | null>(() => {
    if (!metrics || !resolvedKeyCode) return null;
    return metrics.keyCenters[resolvedKeyCode] || null;
  }, [metrics, resolvedKeyCode]);

  const shiftDotGoal = useMemo<Point | null>(() => {
    if (!metrics || !activeShiftKeyCode) return null;
    return metrics.keyCenters[activeShiftKeyCode] || null;
  }, [metrics, activeShiftKeyCode]);

  const activeFingerColor =
    (effectiveActiveFingerKey && FINGER_ACCENT_HEX[effectiveActiveFingerKey]) || '#ea580c';
  const shiftFingerColor =
    (activeShiftFingerKey && FINGER_ACCENT_HEX[activeShiftFingerKey]) || '#f97316';

  const isLeftAnyActive =
    Boolean(effectiveActiveFingerKey?.startsWith('left')) || activeShiftFingerKey === 'left-pinky';
  const isRightAnyActive =
    Boolean(effectiveActiveFingerKey?.startsWith('right')) || activeShiftFingerKey === 'right-pinky';

  return (
    <div
      id="virtual-keyboard-container"
      className="pr-kb-desk p-3 sm:p-4 select-none relative overflow-hidden"
    >
      {/* Keyboard Header / Finger Color Legend */}
      <div className="pr-kb-header min-h-[34px] flex flex-wrap items-center justify-between gap-2 mb-3 text-[10px] sm:text-xs font-bold">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-arcade text-[#fff6dc] font-black tracking-wide drop-shadow-[1px_1px_0_#261106]">
            키보드 및 손가락 가이드
          </span>
          {effectiveFinger && (
            <span className="min-w-[186px] justify-center whitespace-nowrap px-2.5 py-0.5 rounded-md bg-[#ffd859] text-[#2c1507] border-2 border-[#3d220d] font-black flex items-center gap-1">
              <span>목표 손가락: {FINGER_COLORS[effectiveFinger]?.name || effectiveFinger}</span>
            </span>
          )}
        </div>

        {/* Finger Legend (새끼·약지·중지·검지·엄지) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="pr-kb-legend-chip flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 border border-[#2c1507]"></span>
            <span>새끼</span>
          </span>
          <span className="pr-kb-legend-chip flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-500 border border-[#2c1507]"></span>
            <span>약지</span>
          </span>
          <span className="pr-kb-legend-chip flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 border border-[#2c1507]"></span>
            <span>중지</span>
          </span>
          <span className="pr-kb-legend-chip flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 border border-[#2c1507]"></span>
            <span>검지</span>
          </span>
          <span className="pr-kb-legend-chip flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-[#2c1507]"></span>
            <span>엄지</span>
          </span>
        </div>
      </div>

      {/* Keyboard Container with Illustrated Two-Hand Home-Row Overlay */}
      <div className="relative max-w-full overflow-x-auto no-scrollbar py-1">
        <div
          ref={stageRef}
          className="relative min-w-[620px] max-w-4xl mx-auto overflow-hidden rounded-xl pb-2.5"
        >
          {/* Keyboard Rows */}
          <div className="space-y-1 sm:space-y-1.5 relative z-0">
            {KEYBOARD_LAYOUT.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((key) => {
                  const isMainTarget = resolvedKeyCode === key.code || effectiveTargetKey === key.code;
                  const isShiftTarget = activeShiftKeyCode === key.code;
                  const isTarget = isMainTarget || isShiftTarget;
                  const isActive = activeKeyCode === key.code;

                  let keyStateStyles = key.display ? 'pr-key--fn' : 'pr-key';

                  if (isMainTarget) {
                    keyStateStyles = 'pr-key--target';
                  } else if (isShiftTarget) {
                    keyStateStyles = 'pr-key--shift';
                  } else if (isActive) {
                    if (effectiveIsCorrect === false) {
                      keyStateStyles = 'pr-key--err';
                    } else {
                      keyStateStyles = 'pr-key--ok';
                    }
                  }

                  const widthClass = key.width || 'w-8 sm:w-11';

                  return (
                    <div
                      key={key.code}
                      id={`vk-key-${key.code}`}
                      data-vk-code={key.code}
                      className={`h-10 sm:h-12 ${widthClass} rounded-lg sm:rounded-xl flex flex-col justify-between p-1 cursor-default select-none relative ${keyStateStyles}`}
                    >
                      {/* Keycap legends: main character centered, shift / English in the corners */}
                      {key.display ? (
                        <span className="absolute inset-0 flex items-center justify-center px-1 text-[9px] sm:text-xs font-black text-[#26170d] text-center leading-none">
                          {key.display}
                        </span>
                      ) : (
                        <>
                          {key.charKoShift && key.charKoShift !== key.charKo && (
                            <span
                              className={`absolute top-0.5 left-1 text-[8px] sm:text-[10px] font-black leading-none ${
                                isTarget ? 'text-[#7c2d12]' : 'text-[#b91c1c]'
                              }`}
                            >
                              {key.charKoShift}
                            </span>
                          )}
                          <span
                            className={`absolute inset-0 flex items-center justify-center text-sm sm:text-lg font-black leading-none ${
                              isActive && effectiveIsCorrect === false ? 'text-white' : 'text-[#241106]'
                            }`}
                          >
                            {key.charKo}
                          </span>
                          {key.charEn && key.charEn !== key.charKo && (
                            <span
                              className={`absolute bottom-0.5 right-1 text-[8px] sm:text-[10px] font-bold leading-none ${
                                isTarget ? 'text-[#78350f] font-black' : 'text-[#6e4a2b]'
                              }`}
                            >
                              {key.charEn.toUpperCase()}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* =========================================================================
              ILLUSTRATED TWO-HAND GUIDE OVERLAY (hand-left.webp / hand-right.webp)
             ========================================================================= */}
          {showHandsOverlay && metrics && (
            <div data-no-fit-measure="true" className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
              <div className="absolute inset-0 pr-hands-layer">
                {/* Left Hand Illustration (glides via translate3d to target key, returns home on home/space) */}
                <div
                  className="absolute pr-hand-mover"
                  style={{
                    left: `${metrics.leftHand.left}px`,
                    top: `${metrics.leftHand.top}px`,
                    width: `${metrics.leftHand.width}px`,
                    height: `${metrics.leftHand.height}px`,
                    transform: `translate3d(${leftDelta.x}px, ${leftDelta.y}px, 0)`,
                  }}
                >
                  <div className={`w-full h-full pr-hand-feedback ${leftFeedbackClass}`}>
                    <img
                      src="./assets/practice/hand-left.webp"
                      width={HAND_IMG_W}
                      height={HAND_IMG_H}
                      decoding="sync"
                      onLoad={measureKeyboard}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className={`w-full h-full max-w-none select-none pointer-events-none pr-hand-img ${
                        isLeftAnyActive ? 'pr-hand-img--active' : ''
                      }`}
                      style={{
                        transform: `rotate(${metrics.leftHand.rotateDeg}deg)`,
                        transformOrigin: 'center center',
                      }}
                    />
                  </div>
                </div>

                {/* Right Hand Illustration (glides via translate3d to target key, returns home on home/space) */}
                <div
                  className="absolute pr-hand-mover"
                  style={{
                    left: `${metrics.rightHand.left}px`,
                    top: `${metrics.rightHand.top}px`,
                    width: `${metrics.rightHand.width}px`,
                    height: `${metrics.rightHand.height}px`,
                    transform: `translate3d(${rightDelta.x}px, ${rightDelta.y}px, 0)`,
                  }}
                >
                  <div className={`w-full h-full pr-hand-feedback ${rightFeedbackClass}`}>
                    <img
                      src="./assets/practice/hand-right.webp"
                      width={HAND_IMG_W}
                      height={HAND_IMG_H}
                      decoding="sync"
                      onLoad={measureKeyboard}
                      alt=""
                      aria-hidden="true"
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className={`w-full h-full max-w-none select-none pointer-events-none pr-hand-img ${
                        isRightAnyActive ? 'pr-hand-img--active' : ''
                      }`}
                      style={{
                        transform: `rotate(${metrics.rightHand.rotateDeg}deg)`,
                        transformOrigin: 'center center',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Active Finger Highlight Ring & Orange Target Dot Overlay (glides in lockstep via CSS transform) */}
              <svg
                className="absolute inset-0 w-full h-full overflow-visible"
                viewBox={`0 0 ${metrics.width} ${metrics.height}`}
              >
                <defs>
                  <filter id="vkTargetDotGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3.5" floodColor="rgba(234, 88, 12, 0.9)" />
                    <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#ffffff" />
                  </filter>
                  <filter id="vkFingerHalo" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(234, 88, 12, 0.75)" />
                  </filter>
                </defs>

                {/* Primary Finger Color-Coded Highlight Ring (moves together with the active fingertip) */}
                {movedActiveFingerTip && (
                  <g
                    className="pr-vk-marker"
                    style={{
                      transform: `translate3d(${movedActiveFingerTip.x}px, ${movedActiveFingerTip.y}px, 0)`,
                    }}
                  >
                    <circle
                      cx={0}
                      cy={0}
                      r="16"
                      fill={activeFingerColor}
                      fillOpacity="0.32"
                      stroke="#ea580c"
                      strokeWidth="2.5"
                      filter="url(#vkFingerHalo)"
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r="6"
                      fill={activeFingerColor}
                      stroke="#ffffff"
                      strokeWidth="1.8"
                    />
                  </g>
                )}

                {/* Shift Pinky Color-Coded Highlight Ring (moves together with Shift pinky) */}
                {movedShiftFingerTip && (
                  <g
                    className="pr-vk-marker"
                    style={{
                      transform: `translate3d(${movedShiftFingerTip.x}px, ${movedShiftFingerTip.y}px, 0)`,
                    }}
                  >
                    <circle
                      cx={0}
                      cy={0}
                      r="14"
                      fill={shiftFingerColor}
                      fillOpacity="0.32"
                      stroke="#f97316"
                      strokeWidth="2.2"
                      filter="url(#vkFingerHalo)"
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r="5"
                      fill={shiftFingerColor}
                      stroke="#ffffff"
                      strokeWidth="1.6"
                    />
                  </g>
                )}

                {/* Primary Target Key Orange Dot Marker */}
                {targetDotGoal && (
                  <g
                    className="pr-vk-marker"
                    filter="url(#vkTargetDotGlow)"
                    style={{
                      transform: `translate3d(${targetDotGoal.x}px, ${targetDotGoal.y}px, 0)`,
                    }}
                  >
                    <circle
                      cx={0}
                      cy={0}
                      r="16"
                      fill="#f97316"
                      opacity="0.26"
                      className="animate-ping"
                      style={{ transformOrigin: '0px 0px' }}
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r="9.5"
                      fill="#ea580c"
                      stroke="#ffffff"
                      strokeWidth="2.4"
                    />
                    <circle
                      cx={-2.3}
                      cy={-2.3}
                      r="2.6"
                      fill="#ffffff"
                      opacity="0.92"
                    />
                  </g>
                )}

                {/* Shift Target Key Orange Dot Marker */}
                {shiftDotGoal && (
                  <g
                    className="pr-vk-marker"
                    filter="url(#vkTargetDotGlow)"
                    style={{
                      transform: `translate3d(${shiftDotGoal.x}px, ${shiftDotGoal.y}px, 0)`,
                    }}
                  >
                    <circle
                      cx={0}
                      cy={0}
                      r="14"
                      fill="#f97316"
                      opacity="0.25"
                      className="animate-ping"
                      style={{ transformOrigin: '0px 0px' }}
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r="8.5"
                      fill="#ea580c"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                    />
                    <circle
                      cx={-2}
                      cy={-2}
                      r="2.3"
                      fill="#ffffff"
                      opacity="0.92"
                    />
                  </g>
                )}
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const VirtualKeyboard = React.memo(VirtualKeyboardComponent);
