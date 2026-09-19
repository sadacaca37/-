// Retro Pixel Art & Super Mario All-Stars Sprite Rendering Engine for Canvas

import { Player, Enemy, Block, ItemEntity, Projectile, YoshiTongue, Particle } from '../types';

export class SpriteRenderer {
  // Helper to draw a pixelated rectangle
  static drawPixelRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  // Draw Player (Mario, Luigi, Toad, Peach, or Yoshi with all power-ups & vehicles)
  static drawPlayer(ctx: CanvasRenderingContext2D, player: Player, now: number) {
    if (player.isDead) {
      this.drawDeadPlayer(ctx, player);
      return;
    }

    // Invincibility flashing / Starman rainbow
    if (player.invincibleTimer > 0 && Math.floor(now / 50) % 2 === 0) {
      if (player.starmanTimer <= 0) return; // Flash invisible briefly on damage
    }

    ctx.save();
    const x = Math.floor(player.x);
    const y = Math.floor(player.y);
    const isFacingLeft = player.facing === 'left';

    // Character-proportional scaling:
    // Peach: 1.22 (dainty, slender, elegant princess proportion - scaled down slightly)
    // Yoshi: 1.45 (cute, nimble companion scale)
    // Toad: 1.55 (compact mushroom companion)
    // Mario, Luigi: 1.75 (balanced heroic size)
    let charScale = 1.75;
    if (player.character === 'peach') {
      charScale = 1.22;
    } else if (player.character === 'yoshi') {
      charScale = 1.45;
    } else if (player.character === 'toad') {
      charScale = 1.55;
    }

    const isSmall = player.powerUp === 'none' && player.vehicle === 'none';
    const baseSpriteW = 20;
    const baseSpriteH = isSmall ? 24 : 36;

    // Anchor transform to player center-bottom on ground
    ctx.translate(x + player.width / 2, y + player.height);

    // Spin attack 360 degree rotational effect
    if ((player.attackSpinTimer || 0) > 0) {
      const spinAngle = ((18 - (player.attackSpinTimer || 0)) / 18) * Math.PI * 4;
      ctx.rotate(spinAngle);
      // Whirling attack slash trail
      ctx.strokeStyle = 'rgba(255, 230, 100, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -baseSpriteH / 2, baseSpriteW * 1.1, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.scale(isFacingLeft ? -charScale : charScale, charScale);
    // Align sprite's base feet at (0, 0)
    ctx.translate(-baseSpriteW / 2, -baseSpriteH);

    // If Starman active: rainbow glow filter / tint
    if (player.starmanTimer > 0) {
      const hues = ['#ff3366', '#ffcc00', '#33cc33', '#3399ff', '#cc33ff'];
      ctx.shadowColor = hues[Math.floor(now / 80) % hues.length];
      ctx.shadowBlur = 10;
    }

    // Draw Vehicle underneath player if any
    if (player.vehicle === 'yoshi') {
      this.drawYoshiMount(ctx, player, now);
    } else if (player.vehicle === 'clown_car' || player.vehicle === 'fire_clown_car') {
      this.drawClownCar(ctx, player, now);
    } else if (player.vehicle === 'dry_bones_shell') {
      this.drawDryBonesShell(ctx, player, now);
    }

    // If player is tucked inside Dry Bones Shell and ducking, skip drawing body
    if (player.vehicle === 'dry_bones_shell' && player.isDeadBonesDucking) {
      ctx.restore();
      return;
    }

    const h = baseSpriteH;
    const w = baseSpriteW;
    const yOffset = 0;

    // Draw Squirrel Gliding Wings if flying
    if (player.powerUp === 'squirrel' && (player.isGliding || !player.isGrounded)) {
      ctx.fillStyle = '#d2a679';
      ctx.beginPath();
      ctx.moveTo(-6, yOffset + 12);
      ctx.lineTo(w + 6, yOffset + 12);
      ctx.lineTo(w / 2, yOffset + h - 2);
      ctx.closePath();
      ctx.fill();
    }

    // Character-Specific Body Renderers
    switch (player.character) {
      case 'toad':
        this.drawToadCharacter(ctx, player, isSmall, w, h, yOffset, now);
        break;
      case 'peach':
        this.drawPeachCharacter(ctx, player, isSmall, w, h, yOffset, now);
        break;
      case 'yoshi':
        this.drawYoshiPlayable(ctx, player, isSmall, w, h, yOffset, now);
        break;
      case 'luigi':
        this.drawMarioOrLuigi(ctx, player, true, isSmall, w, h, yOffset, now);
        break;
      case 'mario':
      default:
        this.drawMarioOrLuigi(ctx, player, false, isSmall, w, h, yOffset, now);
        break;
    }

    // Charging Fire Clown Car Aura
    if (player.isCharging) {
      const chargeRatio = Math.min(1, player.chargeTimer / 45);
      ctx.strokeStyle = '#ff3300';
      ctx.lineWidth = 2 + chargeRatio * 3;
      ctx.beginPath();
      ctx.arc(w / 2, yOffset + h / 2, 16 + chargeRatio * 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Mario & Luigi Super Mario World (16-bit SNES) Authentic Renderer
  private static drawMarioOrLuigi(
    ctx: CanvasRenderingContext2D,
    player: Player,
    isLuigi: boolean,
    isSmall: boolean,
    w: number,
    h: number,
    yOffset: number,
    now: number
  ) {
    // 16-bit Super Mario World SNES Color Palette
    let capMain = isLuigi ? '#10b820' : '#de2020';
    let capHighlight = isLuigi ? '#58e060' : '#ff5a5a';
    let capShadow = isLuigi ? '#086810' : '#8c1414';

    let shirtMain = capMain;
    let shirtShadow = capShadow;

    let denimMain = isLuigi ? '#0070e0' : '#0088f8';
    let denimShadow = isLuigi ? '#003888' : '#0048a8';
    let denimHighlight = isLuigi ? '#40a8f8' : '#58c8f8';

    const skinTone = '#ffcca0';
    const skinShadow = '#c88858';
    const skinHighlight = '#ffe8d0';

    const bootMain = '#884818';
    const bootShadow = '#482008';
    const bootSole = '#cca050';

    if (player.powerUp === 'fire') {
      capMain = '#ffffff';
      capHighlight = '#ffffff';
      capShadow = '#b0c0d0';
      shirtMain = '#ffffff';
      shirtShadow = '#b0c0d0';
      denimMain = isLuigi ? '#10b820' : '#de2020';
      denimShadow = isLuigi ? '#086810' : '#8c1414';
      denimHighlight = isLuigi ? '#58e060' : '#ff5a5a';
    } else if (player.powerUp === 'propeller') {
      capMain = '#ff6600';
      capHighlight = '#ff9933';
      capShadow = '#aa3300';
      shirtMain = capMain;
      shirtShadow = capShadow;
    } else if (player.powerUp === 'squirrel') {
      capMain = '#8b5a2b';
      capHighlight = '#b07840';
      capShadow = '#503010';
      shirtMain = capMain;
      shirtShadow = capShadow;
    }

    const isMoving = Math.abs(player.vx) > 0.1 && player.isGrounded;
    const walkStep = isMoving ? Math.floor(player.walkFrame) % 4 : 0;
    const isJumping = !player.isGrounded && player.vehicle === 'none';

    // Small Mario vs Super Mario Rendering
    if (isSmall) {
      // ====================================================
      // SMALL MARIO (Authentic SMW 16x16 Proportions)
      // ====================================================
      const sy = yOffset + (player.isCrouching ? 6 : 0);

      // Red Cap
      ctx.fillStyle = capMain;
      ctx.fillRect(4, sy + 2, 16, 6);
      ctx.fillStyle = capHighlight;
      ctx.fillRect(6, sy + 1, 10, 2);
      ctx.fillStyle = capShadow;
      ctx.fillRect(4, sy + 7, 16, 1);
      // Cap Visor Brim
      ctx.fillStyle = capMain;
      ctx.fillRect(14, sy + 5, 6, 3);
      ctx.fillStyle = '#000000';
      ctx.fillRect(14, sy + 8, 6, 1);

      // Face & Nose
      ctx.fillStyle = skinTone;
      ctx.fillRect(6, sy + 8, 12, 6);
      ctx.fillStyle = skinHighlight;
      ctx.fillRect(15, sy + 9, 4, 3); // Round Nose
      ctx.fillStyle = '#000000';
      ctx.fillRect(15, sy + 8, 4, 1);
      ctx.fillRect(19, sy + 9, 1, 3);
      ctx.fillRect(15, sy + 12, 4, 1);

      // Eye & Mustache
      ctx.fillStyle = '#000000';
      ctx.fillRect(12, sy + 8, 2, 3); // Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(12, sy + 8, 1, 1); // Eye twinkle
      // Mustache
      ctx.fillStyle = '#000000';
      ctx.fillRect(10, sy + 11, 7, 2);
      ctx.fillRect(8, sy + 12, 3, 2);

      // Power-up accessories
      this.drawHeadgearAccessories(ctx, player, sy + 2, 12, w, now);

      if (!player.isCrouching) {
        // Torso / Overalls
        ctx.fillStyle = shirtMain;
        ctx.fillRect(6, sy + 14, 12, 4);
        ctx.fillStyle = denimMain;
        ctx.fillRect(8, sy + 14, 8, 5);
        ctx.fillStyle = denimShadow;
        ctx.fillRect(8, sy + 18, 8, 2);
        // Yellow Button
        ctx.fillStyle = '#ffd800';
        ctx.fillRect(9, sy + 15, 2, 2);

        // White Gloves
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, sy + 14, 3, 3);
        ctx.fillRect(17, sy + 14, 3, 3);

        // Legs / Boots
        if (isJumping) {
          // Jump Pose
          ctx.fillStyle = denimMain;
          ctx.fillRect(5, sy + 19, 5, 3);
          ctx.fillRect(14, sy + 18, 5, 3);
          ctx.fillStyle = bootMain;
          ctx.fillRect(3, sy + 21, 6, 3);
          ctx.fillRect(15, sy + 20, 6, 3);
        } else if (walkStep === 1 || walkStep === 3) {
          // Stride Pose
          ctx.fillStyle = denimMain;
          ctx.fillRect(6, sy + 19, 4, 2);
          ctx.fillRect(14, sy + 19, 4, 2);
          ctx.fillStyle = bootMain;
          ctx.fillRect(4, sy + 21, 6, 3);
          ctx.fillRect(14, sy + 21, 6, 3);
        } else {
          // Standing
          ctx.fillStyle = denimMain;
          ctx.fillRect(7, sy + 19, 10, 2);
          ctx.fillStyle = bootMain;
          ctx.fillRect(5, sy + 21, 14, 3);
        }
      } else {
        // Small Ducking
        ctx.fillStyle = denimMain;
        ctx.fillRect(6, sy + 14, 12, 6);
        ctx.fillStyle = bootMain;
        ctx.fillRect(4, sy + 18, 16, 4);
      }
      return;
    }

    // ====================================================
    // SUPER MARIO / FIRE MARIO / LUIGI (16-bit SMW Full Form)
    // ====================================================
    const headY = yOffset + (player.isCrouching ? 12 : 0);
    const headW = 18;

    // 1. CAP
    ctx.fillStyle = capMain;
    ctx.fillRect(4, headY, headW, 8);
    // Cap Top Highlight
    ctx.fillStyle = capHighlight;
    ctx.fillRect(7, headY - 2, 11, 3);
    ctx.fillRect(9, headY - 4, 7, 2);
    // Cap Base Shading
    ctx.fillStyle = capShadow;
    ctx.fillRect(4, headY + 7, headW, 2);

    // Visor Brim
    ctx.fillStyle = capMain;
    ctx.fillRect(14, headY + 5, 8, 4);
    ctx.fillStyle = capShadow;
    ctx.fillRect(14, headY + 8, 8, 1);
    ctx.fillStyle = '#000000';
    ctx.fillRect(14, headY + 9, 8, 1);

    // Cap Emblem (M / L on crisp white circle with subtle dark ring)
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(10, headY + 2.5, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, headY + 2.5, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isLuigi ? '#10b820' : '#de2020';
    ctx.font = '900 6.5px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isLuigi ? 'L' : 'M', 10, headY + 2.6);

    // Power-up accessories (Propeller, Spiny Helmet, etc.)
    this.drawHeadgearAccessories(ctx, player, headY, 14, w, now);

    // 2. FACE & FEATURES
    // Skin Base
    ctx.fillStyle = skinTone;
    ctx.fillRect(5, headY + 9, 14, 8);
    ctx.fillStyle = skinShadow;
    ctx.fillRect(5, headY + 15, 10, 2); // Chin shadow

    // Brown Sideburns / Back Hair
    ctx.fillStyle = '#502808';
    ctx.fillRect(2, headY + 8, 4, 7);
    ctx.fillRect(4, headY + 13, 3, 3);

    // SMW / Wonder Big Round Nose with 3D Highlight
    ctx.fillStyle = skinTone;
    ctx.fillRect(15, headY + 10, 6, 5);
    ctx.fillStyle = skinHighlight;
    ctx.fillRect(16, headY + 10, 3, 2);
    ctx.fillStyle = '#000000';
    ctx.fillRect(15, headY + 9, 6, 1);
    ctx.fillRect(21, headY + 10, 1, 5);
    ctx.fillRect(15, headY + 15, 6, 1);

    // Expressive High-Fidelity Eye (White sclera + Blue Iris + Pupil + Dual Shine)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, headY + 8, 4, 5);
    ctx.fillStyle = '#0070e0';
    ctx.fillRect(12, headY + 8, 3, 5);
    ctx.fillStyle = '#000000';
    ctx.fillRect(13, headY + 9, 2, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(12, headY + 8, 1, 2); // Main twinkle
    ctx.fillRect(14, headY + 11, 1, 1); // Secondary glint

    // Iconic Sculpted 3D Mustache
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, headY + 13, 10, 3);
    ctx.fillRect(7, headY + 14, 4, 3);
    ctx.fillRect(18, headY + 14, 3, 2);
    ctx.fillStyle = '#333333';
    ctx.fillRect(10, headY + 13, 8, 1); // Mustache top highlight

    // 3. BODY & OVERALLS
    if (!player.isCrouching) {
      const torsoY = headY + 17;
      const torsoH = isLuigi ? 11 : 9;

      // Red Shirt (Torso Underlay & Sleeves)
      ctx.fillStyle = shirtMain;
      ctx.fillRect(4, torsoY, w - 8, torsoH);
      ctx.fillStyle = shirtShadow;
      ctx.fillRect(4, torsoY + torsoH - 2, w - 8, 2);

      // Denim Overalls Body
      ctx.fillStyle = denimMain;
      ctx.fillRect(6, torsoY + 1, w - 12, torsoH + 1);
      // Suspenders Straps
      ctx.fillStyle = denimHighlight;
      ctx.fillRect(6, torsoY + 1, 3, torsoH);
      ctx.fillRect(w - 9, torsoY + 1, 3, torsoH);
      ctx.fillStyle = denimShadow;
      ctx.fillRect(9, torsoY + 3, w - 18, torsoH - 2);

      // Yellow Suspender Buttons (with 3D depth rim)
      ctx.fillStyle = '#ffd800';
      ctx.fillRect(6, torsoY + 3, 3, 3);
      ctx.fillRect(w - 9, torsoY + 3, 3, 3);
      ctx.fillStyle = '#664400';
      ctx.fillRect(7, torsoY + 4, 1, 1);
      ctx.fillRect(w - 8, torsoY + 4, 1, 1);

      // 4. ARMS, GLOVES & LEGS / BOOTS BY ANIMATION STATE
      const legY = torsoY + torsoH;

      if (isJumping) {
        // ============================================
        // ICONIC SMW JUMP POSE (Right Fist High in Air!)
        // ============================================
        // Right Arm thrusting straight UP with White Glove
        ctx.fillStyle = shirtMain;
        ctx.fillRect(w - 7, headY - 4, 5, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w - 8, headY - 10, 7, 7);
        ctx.fillStyle = '#c0c8d0';
        ctx.fillRect(w - 8, headY - 4, 7, 2); // Glove cuff

        // Left Arm trailing back
        ctx.fillStyle = shirtMain;
        ctx.fillRect(0, torsoY + 2, 5, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, torsoY + 6, 6, 6);

        // Legs: Front leg kicked forward, rear leg bent
        ctx.fillStyle = denimMain;
        ctx.fillRect(4, legY, 6, 5);
        ctx.fillRect(w - 9, legY - 3, 6, 5);
        ctx.fillStyle = denimShadow;
        ctx.fillRect(4, legY + 3, 6, 2);

        // Brown Boots
        ctx.fillStyle = bootMain;
        ctx.fillRect(1, legY + 4, 8, 5);
        ctx.fillRect(w - 10, legY + 1, 8, 5);
        ctx.fillStyle = bootSole;
        ctx.fillRect(1, legY + 8, 8, 1);
        ctx.fillRect(w - 10, legY + 5, 8, 1);
      } else if (isMoving) {
        // ============================================
        // 4-FRAME DYNAMIC SMW RUNNING STRIDE
        // ============================================
        if (walkStep === 0) {
          // Stride Contact: Left arm forward, right arm back
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(w - 4, torsoY + 2, 5, 5); // Front glove
          ctx.fillRect(0, torsoY + 6, 5, 5); // Rear glove

          ctx.fillStyle = denimMain;
          ctx.fillRect(3, legY, 6, 6);
          ctx.fillRect(w - 8, legY, 6, 6);
          ctx.fillStyle = bootMain;
          ctx.fillRect(1, legY + 5, 8, 4);
          ctx.fillRect(w - 9, legY + 5, 8, 4);
        } else if (walkStep === 1) {
          // Passing point (boots aligned)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, torsoY + 4, 5, 5);
          ctx.fillRect(w - 6, torsoY + 4, 5, 5);

          ctx.fillStyle = denimMain;
          ctx.fillRect(5, legY, w - 10, 6);
          ctx.fillStyle = bootMain;
          ctx.fillRect(3, legY + 5, w - 6, 4);
        } else if (walkStep === 2) {
          // Stride Extension: Right arm forward, left arm back
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, torsoY + 2, 5, 5);
          ctx.fillRect(w - 4, torsoY + 6, 5, 5);

          ctx.fillStyle = denimMain;
          ctx.fillRect(2, legY, 6, 6);
          ctx.fillRect(w - 7, legY - 1, 6, 6);
          ctx.fillStyle = bootMain;
          ctx.fillRect(0, legY + 5, 8, 4);
          ctx.fillRect(w - 8, legY + 4, 8, 4);
        } else {
          // Push-off Lean
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(2, torsoY + 3, 5, 5);
          ctx.fillRect(w - 5, torsoY + 5, 5, 5);

          ctx.fillStyle = denimMain;
          ctx.fillRect(4, legY, 6, 6);
          ctx.fillRect(w - 9, legY, 6, 6);
          ctx.fillStyle = bootMain;
          ctx.fillRect(2, legY + 5, 8, 4);
          ctx.fillRect(w - 10, legY + 5, 8, 4);
        }
      } else {
        // ============================================
        // SMW IDLE STANDING (Breathing Bob & Stance)
        // ============================================
        // White Gloves at Sides
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(1, torsoY + 3, 5, 6);
        ctx.fillRect(w - 6, torsoY + 3, 5, 6);
        ctx.fillStyle = '#c0c8d0';
        ctx.fillRect(1, torsoY + 7, 5, 2);
        ctx.fillRect(w - 6, torsoY + 7, 5, 2);

        // Legs / Overalls
        ctx.fillStyle = denimMain;
        ctx.fillRect(5, legY, w - 10, 6);
        ctx.fillStyle = denimShadow;
        ctx.fillRect(10, legY, 4, 6);

        // Brown Boots
        ctx.fillStyle = bootMain;
        ctx.fillRect(3, legY + 5, 7, 4);
        ctx.fillRect(w - 10, legY + 5, 7, 4);
        ctx.fillStyle = bootSole;
        ctx.fillRect(3, legY + 8, 7, 1);
        ctx.fillRect(w - 10, legY + 8, 7, 1);
      }
    } else {
      // ============================================
      // ICONIC SMW DUCKING / CROUCHING POSE
      // ============================================
      // Overalls compressed into compact protective ball
      ctx.fillStyle = denimMain;
      ctx.fillRect(3, headY + 12, w - 6, 10);
      ctx.fillStyle = denimShadow;
      ctx.fillRect(3, headY + 19, w - 6, 3);

      // Yellow Buttons on Ducked Overalls
      ctx.fillStyle = '#ffd800';
      ctx.fillRect(5, headY + 13, 3, 3);
      ctx.fillRect(w - 8, headY + 13, 3, 3);

      // White Gloves tucked in
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, headY + 15, 4, 4);
      ctx.fillRect(w - 5, headY + 15, 4, 4);

      // Brown Boots Flat on Ground
      ctx.fillStyle = bootMain;
      ctx.fillRect(1, headY + 21, w - 2, 5);
      ctx.fillStyle = bootSole;
      ctx.fillRect(1, headY + 25, w - 2, 1);
    }
  }

  // Toad (Signature Mushroom Cap with Red Polka Dots, Blue & Gold Vest, White Pants)
  private static drawToadCharacter(
    ctx: CanvasRenderingContext2D,
    player: Player,
    isSmall: boolean,
    w: number,
    h: number,
    yOffset: number,
    now: number
  ) {
    const isMoving = Math.abs(player.vx) > 0.1 && player.isGrounded;
    const walkStep = isMoving ? Math.floor(player.walkFrame) % 4 : 0;
    const headY = yOffset + (player.isCrouching ? 8 : 0);

    let capBgColor = '#ffffff';
    let dotColor = '#e52521';
    let vestColor = '#0044cc';

    if (player.powerUp === 'fire') {
      capBgColor = '#ffe6e6';
      dotColor = '#ff2200';
      vestColor = '#cc0000';
    } else if (player.powerUp === 'propeller') {
      vestColor = '#ff6600';
    }

    // Mushroom Cap
    ctx.fillStyle = capBgColor;
    ctx.beginPath();
    ctx.ellipse(w / 2, headY + 4, isSmall ? 10 : 13, isSmall ? 8 : 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Polka Dots on Mushroom Cap (3 front, 2 side)
    ctx.fillStyle = dotColor;
    ctx.beginPath();
    ctx.arc(w / 2, headY + 2, isSmall ? 3.5 : 4.5, 0, Math.PI * 2); // Center top
    ctx.arc(w / 2 - 6, headY + 6, isSmall ? 2.5 : 3.5, 0, Math.PI * 2); // Left
    ctx.arc(w / 2 + 6, headY + 6, isSmall ? 2.5 : 3.5, 0, Math.PI * 2); // Right
    ctx.fill();

    // Headgear accessories (Propeller, Spiny, etc.)
    this.drawHeadgearAccessories(ctx, player, headY - 4, 12, w, now);

    // Cute Round Face
    ctx.fillStyle = '#ffcca3';
    ctx.fillRect(4, headY + 9, w - 8, 6);

    // Big Oval Eyes & Rosy Cheeks
    ctx.fillStyle = '#000000';
    ctx.fillRect(w / 2 + 1, headY + 10, 2, 3);
    ctx.fillRect(w / 2 - 3, headY + 10, 2, 3);
    ctx.fillStyle = '#ff9999';
    ctx.fillRect(w / 2 + 4, headY + 12, 2, 2);
    ctx.fillRect(w / 2 - 6, headY + 12, 2, 2);

    if (!player.isCrouching) {
      // Blue Vest with Gold Yellow Trim
      const torsoY = headY + 15;
      const torsoH = isSmall ? 5 : 7;
      ctx.fillStyle = vestColor;
      ctx.fillRect(3, torsoY, w - 6, torsoH);
      ctx.fillStyle = '#ffcc00'; // Gold border
      ctx.fillRect(3, torsoY, 2, torsoH);
      ctx.fillRect(w - 5, torsoY, 2, torsoH);
      ctx.fillRect(w / 2 - 1, torsoY, 2, torsoH);

      // Puffy White Pants
      const legY = torsoY + torsoH;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, legY, w - 8, 5);

      // Brown Shoes
      ctx.fillStyle = '#804000';
      if (!player.isGrounded) {
        ctx.fillRect(1, legY + 4, 6, 4);
        ctx.fillRect(w - 7, legY + 2, 6, 4);
      } else if (walkStep === 1 || walkStep === 3) {
        ctx.fillRect(2, legY + 4, 5, 4);
        ctx.fillRect(w - 7, legY + 4, 5, 4);
      } else {
        ctx.fillRect(3, legY + 4, w - 6, 4);
      }
    } else {
      // Crouching
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(3, headY + 15, w - 6, 6);
      ctx.fillStyle = '#804000';
      ctx.fillRect(2, headY + 19, w - 4, 4);
    }
  }

  // Princess Peach (Golden Jeweled Crown, Flowing Blonde Hair, Elegant Pink Dress)
  private static drawPeachCharacter(
    ctx: CanvasRenderingContext2D,
    player: Player,
    isSmall: boolean,
    w: number,
    h: number,
    yOffset: number,
    now: number
  ) {
    const isMoving = Math.abs(player.vx) > 0.1 && player.isGrounded;
    const walkStep = isMoving ? Math.floor(player.walkFrame) % 4 : 0;
    const headY = yOffset + (player.isCrouching ? 8 : 0);

    let dressMainColor = '#ff77aa';
    let dressBustleColor = '#e52277';
    let hairColor = '#ffd033';

    if (player.powerUp === 'fire') {
      dressMainColor = '#ffffff';
      dressBustleColor = '#e52521';
    } else if (player.powerUp === 'propeller') {
      dressMainColor = '#ff9944';
      dressBustleColor = '#ff5500';
    }

    // Golden Jeweled Crown
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(w / 2 - 5, headY - 4, 10, 4);
    ctx.fillRect(w / 2 - 6, headY - 6, 3, 2);
    ctx.fillRect(w / 2 - 1, headY - 7, 3, 3);
    ctx.fillRect(w / 2 + 4, headY - 6, 3, 2);
    // Ruby & Sapphire Gems in Crown
    ctx.fillStyle = '#ff0033';
    ctx.fillRect(w / 2, headY - 3, 2, 2);
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(w / 2 - 4, headY - 3, 2, 2);
    ctx.fillRect(w / 2 + 3, headY - 3, 2, 2);

    this.drawHeadgearAccessories(ctx, player, headY - 4, 12, w, now);

    // Flowing Blonde Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(2, headY, w - 4, 8);
    ctx.fillRect(1, headY + 6, 4, 10); // Hair strand left
    ctx.fillRect(w - 5, headY + 6, 4, 10); // Hair strand right

    // Face / Skin
    ctx.fillStyle = '#ffe0c0';
    ctx.fillRect(5, headY + 3, w - 10, 8);

    // Blue Eyes & Smile
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(w / 2 + 1, headY + 5, 2, 3);
    ctx.fillStyle = '#ff3366';
    ctx.fillRect(w / 2 + 1, headY + 9, 2, 1);

    // Cyan Brooch on Neck
    ctx.fillStyle = '#00cccc';
    ctx.fillRect(w / 2 - 1, headY + 11, 3, 3);

    if (!player.isCrouching) {
      // Royal Gown Torso & Puffed Sleeves
      const torsoY = headY + 12;
      const torsoH = isSmall ? 6 : 9;
      ctx.fillStyle = dressMainColor;
      ctx.fillRect(4, torsoY, w - 8, torsoH);

      // Puffed Sleeves & White Gloves
      ctx.fillStyle = dressBustleColor;
      ctx.fillRect(1, torsoY, 4, 4);
      ctx.fillRect(w - 5, torsoY, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, torsoY + 4, 3, 4);
      ctx.fillRect(w - 4, torsoY + 4, 3, 4);

      // Magenta Waist Bustle
      ctx.fillStyle = dressBustleColor;
      ctx.fillRect(3, torsoY + torsoH - 2, w - 6, 3);

      // Flared Gown Skirt
      const skirtY = torsoY + torsoH;
      const isFloating = !player.isGrounded && player.vy < 1.0;
      const flare = isFloating ? 4 : (walkStep === 1 || walkStep === 3 ? 2 : 0);

      ctx.fillStyle = dressMainColor;
      ctx.beginPath();
      ctx.moveTo(3, skirtY);
      ctx.lineTo(w - 3, skirtY);
      ctx.lineTo(w - 1 + flare, skirtY + 8);
      ctx.lineTo(1 - flare, skirtY + 8);
      ctx.closePath();
      ctx.fill();

      // Pink Slippers
      ctx.fillStyle = dressBustleColor;
      ctx.fillRect(4, skirtY + 7, 5, 3);
      ctx.fillRect(w - 9, skirtY + 7, 5, 3);
    } else {
      // Crouching
      ctx.fillStyle = dressMainColor;
      ctx.fillRect(2, headY + 12, w - 4, 10);
      ctx.fillStyle = dressBustleColor;
      ctx.fillRect(3, headY + 20, w - 6, 3);
    }
  }

  // Yoshi (Playable Dinosaur with Rounded Snout, White Cheeks/Belly, Orange Saddle & Shoes)
  private static drawYoshiPlayable(
    ctx: CanvasRenderingContext2D,
    player: Player,
    isSmall: boolean,
    w: number,
    h: number,
    yOffset: number,
    now: number
  ) {
    const isMoving = Math.abs(player.vx) > 0.1 && player.isGrounded;
    const walkStep = isMoving ? Math.floor(player.walkFrame) % 4 : 0;
    const flutterSwing = player.isFluttering ? Math.sin(now / 15) * 5 : 0;
    const headY = yOffset + (player.isCrouching ? 8 : 0);

    let skinColor = '#22b14c';
    let saddleColor = '#e52521';
    let shoesColor = '#ff6600';

    if (player.powerUp === 'fire') {
      saddleColor = '#ffcc00';
      shoesColor = '#ff2200';
    }

    // Red Spines / Crest on Back of Head
    ctx.fillStyle = saddleColor;
    ctx.fillRect(0, headY, 4, 8);

    // Green Dinosaur Head & Snout
    ctx.fillStyle = skinColor;
    ctx.fillRect(4, headY - 2, w - 4, 12);
    ctx.fillRect(w - 4, headY + 2, 6, 8); // Big round snout

    // Big White Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, headY - 6, 6, 7);
    ctx.fillRect(w - 9, headY - 6, 6, 7);
    ctx.fillStyle = '#000000';
    ctx.fillRect(8, headY - 4, 2, 4);
    ctx.fillRect(w - 7, headY - 4, 2, 4);

    // White Round Cheeks
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w - 2, headY + 8, 4, 0, Math.PI * 2);
    ctx.fill();

    this.drawHeadgearAccessories(ctx, player, headY - 4, 12, w, now);

    if (!player.isCrouching) {
      const torsoY = headY + 12;
      const torsoH = isSmall ? 6 : 9;

      // Green Body
      ctx.fillStyle = skinColor;
      ctx.fillRect(4, torsoY, w - 8, torsoH);

      // Red Saddle Shell on Back
      ctx.fillStyle = saddleColor;
      ctx.fillRect(1, torsoY + 1, 4, 6);

      // White Belly
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 2, torsoY + 1, w / 2 - 4, torsoH - 1);

      // Yoshi Tail on Back
      ctx.fillStyle = skinColor;
      ctx.beginPath();
      ctx.moveTo(2, torsoY + torsoH - 2);
      ctx.lineTo(-3, torsoY + torsoH - 5);
      ctx.lineTo(2, torsoY + torsoH - 6);
      ctx.closePath();
      ctx.fill();

      // Orange Boots with Animated Flutter & Footsteps
      const legY = torsoY + torsoH;
      ctx.fillStyle = shoesColor;
      if (player.isFluttering) {
        ctx.fillRect(2, legY + 2 + flutterSwing, 7, 5);
        ctx.fillRect(w - 8, legY + 2 - flutterSwing, 7, 5);
      } else if (!player.isGrounded) {
        ctx.fillRect(1, legY + 4, 7, 5);
        ctx.fillRect(w - 8, legY + 2, 7, 5);
      } else if (walkStep === 1 || walkStep === 3) {
        ctx.fillRect(2, legY + 3, 6, 5);
        ctx.fillRect(w - 8, legY + 3, 6, 5);
      } else {
        ctx.fillRect(3, legY + 3, w - 6, 5);
      }
    } else {
      // Crouching
      ctx.fillStyle = skinColor;
      ctx.fillRect(3, headY + 12, w - 6, 8);
      ctx.fillStyle = saddleColor;
      ctx.fillRect(1, headY + 13, 3, 5);
      ctx.fillStyle = shoesColor;
      ctx.fillRect(2, headY + 18, w - 4, 4);
    }
  }

  // Draw power-up hats, propellers, and helmets
  private static drawHeadgearAccessories(
    ctx: CanvasRenderingContext2D,
    player: Player,
    headY: number,
    headSize: number,
    w: number,
    now: number
  ) {
    // Propeller Helmet
    if (player.powerUp === 'propeller') {
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(w / 2 - 3, headY - 6, 6, 4);
      const bladeOffset = Math.sin(now / 20) * 8;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w / 2 - bladeOffset, headY - 8, bladeOffset * 2, 2);
    }

    // Spiny Helmet on head
    if (player.powerUp === 'spiny_helmet') {
      ctx.fillStyle = '#cc2222';
      ctx.fillRect(2, headY - 2, headSize + 6, 5);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(w / 2, headY - 10);
      ctx.lineTo(w / 2 - 4, headY - 2);
      ctx.lineTo(w / 2 + 4, headY - 2);
      ctx.closePath();
      ctx.fill();
    }
  }

  static drawDeadPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    const dScale =
      player.character === 'peach'
        ? 1.45
        : player.character === 'yoshi'
        ? 1.45
        : player.character === 'toad'
        ? 1.55
        : 1.75;
    ctx.scale(dScale, dScale);
    ctx.translate(-10, -12);

    const colors: Record<string, string> = {
      mario: '#e52521',
      luigi: '#22b14c',
      toad: '#0044cc',
      peach: '#ff77aa',
      yoshi: '#22b14c',
    };

    const c = colors[player.character] || '#e52521';
    ctx.fillStyle = c;
    ctx.fillRect(2, 4, 16, 12);
    ctx.fillStyle = '#ffcca3';
    ctx.fillRect(4, 0, 12, 10);
    // Cap
    ctx.fillStyle = c;
    ctx.fillRect(2, 0, 16, 4);
    // X eyes
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('x x', 6, 8);
    ctx.restore();
  }

  static drawYoshiMount(ctx: CanvasRenderingContext2D, player: Player, now: number) {
    const isMoving = Math.abs(player.vx) > 0.1;
    const legSwing = isMoving ? Math.sin(now / 60) * 4 : 0;
    const flutterSwing = player.isFluttering ? Math.sin(now / 20) * 6 : 0;
    const baseW = 20;
    const baseH = player.powerUp === 'none' ? 24 : 36;

    // Yoshi green body
    ctx.fillStyle = '#00bb00';
    ctx.beginPath();
    ctx.ellipse(baseW / 2 + 2, baseH - 10, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yoshi White Belly
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(baseW / 2 + 5, baseH - 8, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yoshi Head/Snout
    ctx.fillStyle = '#00bb00';
    ctx.fillRect(baseW - 2, baseH - 24, 14, 12);
    // Yoshi Big White Eye
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(baseW - 2, baseH - 28, 8, 8);
    ctx.fillStyle = '#000000';
    ctx.fillRect(baseW + 2, baseH - 26, 3, 4);

    // Red Shell/Saddle
    ctx.fillStyle = '#e52521';
    ctx.fillRect(2, baseH - 20, 10, 6);

    // Orange Boots / Legs
    ctx.fillStyle = '#ff7700';
    ctx.fillRect(4, baseH - 6 + (player.isFluttering ? flutterSwing : legSwing), 8, 6);
    ctx.fillRect(baseW - 6, baseH - 6 - (player.isFluttering ? flutterSwing : legSwing), 8, 6);
  }

  static drawClownCar(ctx: CanvasRenderingContext2D, player: Player, now: number) {
    const isFire = player.vehicle === 'fire_clown_car';
    const bobbing = Math.sin(now / 150) * 2;
    const baseW = 20;
    const baseH = player.powerUp === 'none' ? 24 : 36;
    const cy = baseH - 14 + bobbing;

    ctx.fillStyle = isFire ? '#2b2b2b' : '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(baseW / 2, cy, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isFire ? '#e52521' : '#222222';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e52521';
    ctx.beginPath();
    ctx.arc(baseW / 2, cy, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.fillRect(baseW / 2 - 8, cy - 6, 4, 4);
    ctx.fillRect(baseW / 2 + 4, cy - 6, 4, 4);

    ctx.beginPath();
    ctx.strokeStyle = isFire ? '#ff7700' : '#e52521';
    ctx.lineWidth = 3;
    ctx.arc(baseW / 2, cy + 4, 8, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();

    const propOffset = Math.sin(now / 15) * 12;
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(baseW / 2 - propOffset, cy + 14, propOffset * 2, 3);
  }

  static drawDryBonesShell(ctx: CanvasRenderingContext2D, player: Player, now: number) {
    const baseW = 20;
    const baseH = player.powerUp === 'none' ? 24 : 36;
    const y = baseH - 18;
    ctx.fillStyle = '#404040';
    ctx.beginPath();
    ctx.ellipse(baseW / 2, y + 8, 14, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e0e0e0';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(baseW / 2 - 10 + i * 5, y + 2, 4, 8);
    }
  }

  static drawYoshiTongue(ctx: CanvasRenderingContext2D, tongue: YoshiTongue) {
    if (!tongue.active) return;
    ctx.save();
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tongue.x, tongue.y);
    const endX = tongue.facing === 'right' ? tongue.x + tongue.length : tongue.x - tongue.length;
    ctx.lineTo(endX, tongue.y);
    ctx.stroke();

    ctx.fillStyle = '#ff1144';
    ctx.beginPath();
    ctx.arc(endX, tongue.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Blocks with Dynamic Stage Theming
  static drawBlock(ctx: CanvasRenderingContext2D, block: Block, now: number, theme: string = 'grassland') {
    if (block.isDestroyed) return;
    ctx.save();
    const x = Math.floor(block.x);
    const y = Math.floor(block.y + block.bumpOffset);
    const w = block.width;
    const h = block.height;

    switch (block.type) {
      case 'ground': {
        // High-Fidelity Tiled Mario Ground with Brick Grid & Environmental Crust
        const tileSize = 24;

        let mortarColor = '#240a02';
        let brickBase = '#b84414';
        let brickHigh = '#f88c44';
        let brickShadow = '#681c04';
        let innerRivet = '#8c2c0a';

        if (theme === 'underground') {
          mortarColor = '#00122e';
          brickBase = '#0052a6';
          brickHigh = '#40d0f8';
          brickShadow = '#002662';
          innerRivet = '#003a80';
        } else if (theme === 'lava' || theme === 'boss_castle') {
          mortarColor = '#0e0a14';
          brickBase = '#2c2834';
          brickHigh = '#6a6478';
          brickShadow = '#14101a';
          innerRivet = '#1e1a26';
        } else if (theme === 'canyon') {
          mortarColor = '#3a1e06';
          brickBase = '#b86c26';
          brickHigh = '#f8b856';
          brickShadow = '#703a0a';
          innerRivet = '#8c4e16';
        } else if (theme === 'mountain') {
          mortarColor = '#18202c';
          brickBase = '#566072';
          brickHigh = '#98a8c0';
          brickShadow = '#303644';
          innerRivet = '#424a5a';
        }

        // 1. Mortar base background
        ctx.fillStyle = mortarColor;
        ctx.fillRect(x, y, w, h);

        // 2. Tile repeating brick blocks across the entire ground width and height
        for (let by = 0; by < h; by += tileSize) {
          const curH = Math.min(tileSize, h - by);
          const isTopRow = by === 0;

          for (let bx = 0; bx < w; bx += tileSize) {
            const curW = Math.min(tileSize, w - bx);
            const tx = x + bx;
            const ty = y + by;

            // Draw Brick Tile with 3D Bevel
            ctx.fillStyle = brickBase;
            ctx.fillRect(tx + 1, ty + 1, curW - 2, curH - 2);

            // 3D Top & Left Bevel Highlight
            ctx.fillStyle = brickHigh;
            ctx.fillRect(tx + 1, ty + 1, curW - 2, 2);
            ctx.fillRect(tx + 1, ty + 1, 2, curH - 2);

            // 3D Bottom & Right Bevel Shadow
            ctx.fillStyle = brickShadow;
            ctx.fillRect(tx + 1, ty + curH - 2, curW - 2, 2);
            ctx.fillRect(tx + curW - 2, ty + 1, 2, curH - 2);

            // Iconic Mario Ground Brick Detail: Center Recessed Panel / Rivets
            if (curW >= 14 && curH >= 14) {
              ctx.fillStyle = innerRivet;
              ctx.fillRect(tx + 4, ty + 4, curW - 8, curH - 8);
              ctx.fillStyle = brickBase;
              ctx.fillRect(tx + 5, ty + 5, curW - 10, curH - 10);

              // 4 Mini Corner Rivet Dots in brick tile
              ctx.fillStyle = brickShadow;
              ctx.fillRect(tx + 4, ty + 4, 2, 2);
              ctx.fillRect(tx + curW - 6, ty + 4, 2, 2);
              ctx.fillRect(tx + 4, ty + curH - 6, 2, 2);
              ctx.fillRect(tx + curW - 6, ty + curH - 6, 2, 2);
            }

            // Top-row Environmental Cap (Grass, Crystals, Snow, Sand, Obsidian)
            if (isTopRow) {
              if (theme === 'underground') {
                // Glowing Cyan Crystal Crust
                ctx.fillStyle = '#00d8f8';
                ctx.fillRect(tx, ty, curW, 3);
                ctx.fillStyle = '#90f8ff';
                ctx.fillRect(tx, ty, curW, 1);
                ctx.fillStyle = '#0080f0';
                ctx.fillRect(tx, ty + 3, curW, 2);
              } else if (theme === 'canyon') {
                // Golden Sand Ridge
                ctx.fillStyle = '#fce080';
                ctx.fillRect(tx, ty, curW, 3);
                ctx.fillStyle = '#e8a840';
                ctx.fillRect(tx, ty + 3, curW, 2);
              } else if (theme === 'mountain') {
                // Pristine Snow Cap
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(tx, ty, curW, 4);
                ctx.fillStyle = '#d0e4f8';
                ctx.fillRect(tx, ty + 4, curW, 2);
              } else if (theme === 'lava' || theme === 'boss_castle') {
                // Molten Iron & Basalt Rim
                ctx.fillStyle = '#ff5500';
                ctx.fillRect(tx, ty, curW, 3);
                ctx.fillStyle = '#ffaa00';
                ctx.fillRect(tx + 2, ty, curW - 4, 1);
                ctx.fillStyle = '#483c50';
                ctx.fillRect(tx, ty + 3, curW, 2);
              } else {
                // Classic Super Mario Lush Emerald Grass Turf
                ctx.fillStyle = '#78e820'; // Bright sunshine top
                ctx.fillRect(tx, ty, curW, 3);
                ctx.fillStyle = '#00a800'; // Lush deep emerald mid
                ctx.fillRect(tx, ty + 3, curW, 4);
                ctx.fillStyle = '#007000'; // Shadow rim
                ctx.fillRect(tx, ty + 7, curW, 1);

                // Hanging grass blade fringes
                ctx.fillStyle = '#00a800';
                ctx.fillRect(tx + 2, ty + 8, 3, 3);
                ctx.fillRect(tx + 8, ty + 8, 4, 4);
                ctx.fillRect(tx + 16, ty + 8, 3, 3);
                if (curW > 20) {
                  ctx.fillRect(tx + 20, ty + 8, 3, 2);
                }
              }
            }
          }
        }
        break;
      }

      case 'brick': {
        // High-Fidelity 3D Beveled Multi-Row Brick Block (Super Mario Wonder / SMW style)
        let baseColor = '#c24416';
        let highlightColor = '#ffa26a';
        let shadowColor = '#722006';
        let mortarColor = '#2e0a02';

        if (theme === 'underground') {
          baseColor = '#005bb8';
          highlightColor = '#50d8ff';
          shadowColor = '#002870';
          mortarColor = '#001230';
        } else if (theme === 'lava' || theme === 'boss_castle') {
          baseColor = '#322e3c';
          highlightColor = '#746e84';
          shadowColor = '#181420';
          mortarColor = '#0e0a12';
        } else if (theme === 'canyon') {
          baseColor = '#b86824';
          highlightColor = '#f0a850';
          shadowColor = '#6c380a';
          mortarColor = '#301804';
        }

        // 1. Mortar Base
        ctx.fillStyle = mortarColor;
        ctx.fillRect(x, y, w, h);

        // 2. Row 1 Bricks (Top: 2 bricks)
        const row1H = Math.floor(h / 2) - 2;
        const b1W = Math.floor(w / 2) - 2;

        // Top-Left Brick
        ctx.fillStyle = baseColor;
        ctx.fillRect(x + 1, y + 1, b1W, row1H);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x + 1, y + 1, b1W, 2);
        ctx.fillRect(x + 1, y + 1, 2, row1H);
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x + 1, y + row1H - 1, b1W, 2);
        ctx.fillRect(x + b1W - 1, y + 1, 2, row1H);

        // Top-Right Brick
        const b2X = x + b1W + 3;
        const b2W = w - (b1W + 4);
        ctx.fillStyle = baseColor;
        ctx.fillRect(b2X, y + 1, b2W, row1H);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(b2X, y + 1, b2W, 2);
        ctx.fillRect(b2X, y + 1, 2, row1H);
        ctx.fillStyle = shadowColor;
        ctx.fillRect(b2X, y + row1H - 1, b2W, 2);
        ctx.fillRect(b2X + b2W - 1, y + 1, 2, row1H);

        // 3. Row 2 Bricks (Bottom: Half, Full, Half)
        const row2Y = y + row1H + 3;
        const row2H = h - (row1H + 4);
        const halfW = Math.floor(w / 4) - 2;
        const midW = Math.floor(w / 2) - 2;

        // Bottom-Left Half-Brick
        ctx.fillStyle = baseColor;
        ctx.fillRect(x + 1, row2Y, halfW, row2H);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x + 1, row2Y, halfW, 2);
        ctx.fillRect(x + 1, row2Y, 2, row2H);
        ctx.fillStyle = shadowColor;
        ctx.fillRect(x + 1, row2Y + row2H - 1, halfW, 2);
        ctx.fillRect(x + halfW - 1, row2Y, 2, row2H);

        // Bottom-Center Full Brick
        const midX = x + halfW + 3;
        ctx.fillStyle = baseColor;
        ctx.fillRect(midX, row2Y, midW, row2H);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(midX, row2Y, midW, 2);
        ctx.fillRect(midX, row2Y, 2, row2H);
        ctx.fillStyle = shadowColor;
        ctx.fillRect(midX, row2Y + row2H - 1, midW, 2);
        ctx.fillRect(midX + midW - 1, row2Y, 2, row2H);

        // Bottom-Right Half-Brick
        const rHalfX = midX + midW + 3;
        const rHalfW = w - (rHalfX - x + 1);
        ctx.fillStyle = baseColor;
        ctx.fillRect(rHalfX, row2Y, rHalfW, row2H);
        ctx.fillStyle = highlightColor;
        ctx.fillRect(rHalfX, row2Y, rHalfW, 2);
        ctx.fillRect(rHalfX, row2Y, 2, row2H);
        ctx.fillStyle = shadowColor;
        ctx.fillRect(rHalfX, row2Y + row2H - 1, rHalfW, 2);
        ctx.fillRect(rHalfX + rHalfW - 1, row2Y, 2, row2H);

        // Subtle Stone Pores/Texture
        ctx.fillStyle = highlightColor;
        ctx.fillRect(x + 5, y + 5, 1, 1);
        ctx.fillRect(x + 22, y + 6, 1, 1);
        ctx.fillRect(x + 14, row2Y + 4, 1, 1);
        break;
      }

      case 'question': {
        // High-Fidelity Gleaming Wonder / SMW Gold Question Block
        const pulse = (Math.sin(now / 150) + 1) * 0.5;

        // 1. Outer Metallic Golden Frame
        ctx.fillStyle = '#b86000';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#ffcf33';
        ctx.fillRect(x + 1, y + 1, w - 2, 2);
        ctx.fillRect(x + 1, y + 1, 2, h - 2);
        ctx.fillStyle = '#6b3600';
        ctx.fillRect(x + 1, y + h - 2, w - 2, 2);
        ctx.fillRect(x + w - 2, y + 1, 2, h - 2);

        // 2. Central Golden Body
        ctx.fillStyle = '#fc9d1c';
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);

        // Top-left golden shine
        ctx.fillStyle = '#ffe566';
        ctx.fillRect(x + 3, y + 3, w - 6, 3);
        ctx.fillRect(x + 3, y + 3, 3, h - 6);

        // 3. Four Metallic Corner Rivet Screws with Specular Dots
        const rivets = [
          [x + 4, y + 4],
          [x + w - 8, y + 4],
          [x + 4, y + h - 8],
          [x + w - 8, y + h - 8],
        ];
        rivets.forEach(([rx, ry]) => {
          ctx.fillStyle = '#5c2800';
          ctx.fillRect(rx, ry, 4, 4);
          ctx.fillStyle = '#ffdf66';
          ctx.fillRect(rx, ry, 2, 2);
        });

        // 4. Glowing Embossed '?' Question Mark
        const qYOffset = Math.sin(now / 200) * 1.0;
        
        // Shadow
        ctx.fillStyle = '#6a2800';
        ctx.font = '900 18px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', x + w / 2 + 1.5, y + h / 2 + 1.5 + qYOffset);

        // White-Gold Question Mark Face
        ctx.fillStyle = pulse > 0.4 ? '#ffffff' : '#fff088';
        ctx.fillText('?', x + w / 2, y + h / 2 + qYOffset);
        break;
      }

      case 'question_used':
        // Metallic Brown/Bronze Recessed Used Block Plate
        ctx.fillStyle = '#4a2f18';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#8a6540';
        ctx.fillRect(x + 1, y + 1, w - 2, 2);
        ctx.fillRect(x + 1, y + 1, 2, h - 2);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(x + 1, y + h - 2, w - 2, 2);
        ctx.fillRect(x + w - 2, y + 1, 2, h - 2);

        // Sunken Darker Center
        ctx.fillStyle = '#684a2c';
        ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(x + 3, y + 3, w - 6, 2);
        ctx.fillRect(x + 3, y + 3, 2, h - 6);

        // Corner Rivets
        ctx.fillStyle = '#2a1808';
        ctx.fillRect(x + 4, y + 4, 3, 3);
        ctx.fillRect(x + w - 7, y + 4, 3, 3);
        ctx.fillRect(x + 4, y + h - 7, 3, 3);
        ctx.fillRect(x + w - 7, y + h - 7, 3, 3);
        break;

      case 'hard_block':
        // 3D Stone Block with Bevels and Rivet
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#c0c0c0';
        ctx.fillRect(x + 1, y + 1, w - 2, 3);
        ctx.fillRect(x + 1, y + 1, 3, h - 2);
        ctx.fillStyle = '#303030';
        ctx.fillRect(x + 1, y + h - 3, w - 2, 3);
        ctx.fillRect(x + w - 3, y + 1, 3, h - 2);
        ctx.fillStyle = '#505050';
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
        break;

      case 'pipe_top_left':
      case 'pipe_top_right':
      case 'pipe_body_left':
      case 'pipe_body_right': {
        const isLeft = block.type.includes('left');
        const isTop = block.type.includes('top');
        const basePipeColor = theme === 'underground' ? '#007888' : '#009e18';
        const brightPipeColor = theme === 'underground' ? '#00d8e8' : '#60e028';
        const darkPipeColor = theme === 'underground' ? '#003848' : '#005808';

        ctx.fillStyle = basePipeColor;
        ctx.fillRect(x, y, w, h);

        if (isLeft) {
          // Specular highlight band
          ctx.fillStyle = brightPipeColor;
          ctx.fillRect(x + 4, y, 6, h);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 6, y, 2, h);
          // Left edge shadow
          ctx.fillStyle = darkPipeColor;
          ctx.fillRect(x, y, 3, h);
        } else {
          // Right dark curve shadow
          ctx.fillStyle = darkPipeColor;
          ctx.fillRect(x + w - 8, y, 8, h);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(x + w - 4, y, 4, h);
        }

        if (isTop) {
          // Top Lip 3D Collar
          ctx.fillStyle = '#000000';
          ctx.fillRect(x, y, w, 3);
          ctx.fillStyle = 'rgba(0,0,0,0.4)';
          ctx.fillRect(x, y + 3, w, 2);
        }
        break;
      }

      case 'cloud_platform':
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 8, y + 12, 8, 0, Math.PI * 2);
        ctx.arc(x + w / 2, y + 8, 12, 0, Math.PI * 2);
        ctx.arc(x + w - 8, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a6c8e0';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;

      case 'moving_platform':
        ctx.fillStyle = '#f0a000';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#fff080';
        ctx.fillRect(x + 2, y + 2, w - 4, 3);
        ctx.fillStyle = '#905000';
        ctx.fillRect(x + 2, y + h - 4, w - 4, 2);
        break;

      case 'note_block': {
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#e52521';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
        // Musical note icon
        ctx.fillStyle = '#e52521';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♫', x + w / 2, y + h / 2);
        break;
      }

      case 'spikes':
        ctx.fillStyle = '#d0d0d0';
        for (let sx = 0; sx < w; sx += 8) {
          ctx.beginPath();
          ctx.moveTo(x + sx, y + h);
          ctx.lineTo(x + sx + 4, y);
          ctx.lineTo(x + sx + 8, y + h);
          ctx.closePath();
          ctx.fill();
        }
        break;

      case 'lava': {
        ctx.fillStyle = '#e52521';
        ctx.fillRect(x, y, w, h);
        // Animated bubbling lava top
        ctx.fillStyle = '#ffaa00';
        for (let lx = 0; lx < w; lx += 16) {
          const bubbleY = Math.sin((now + lx * 10) / 150) * 4;
          ctx.fillRect(x + lx, y + bubbleY, 14, 4);
        }
        break;
      }

      case 'flagpole': {
        // Flagpole Base Brick / Pedestal
        ctx.fillStyle = '#00aa33';
        ctx.fillRect(x + 2, y + h - 16, w - 4, 16);
        ctx.fillStyle = '#66ff66';
        ctx.fillRect(x + 4, y + h - 16, w - 8, 3);
        ctx.fillStyle = '#006622';
        ctx.fillRect(x + 2, y + h - 3, w - 4, 3);

        // Metallic Striped Pole Shaft
        ctx.fillStyle = '#008822';
        ctx.fillRect(x + w / 2 - 3, y, 6, h - 16);
        ctx.fillStyle = '#55ee77';
        ctx.fillRect(x + w / 2 - 2, y, 2, h - 16);
        ctx.fillStyle = '#005511';
        ctx.fillRect(x + w / 2 + 1, y, 2, h - 16);

        // Flag sliding position
        const currentFlagY = block.flagY !== undefined ? block.flagY : y + 6;
        const flagWave = Math.sin((now + x) / 100) * 3;

        // Draw Sliding Flag Banner
        ctx.fillStyle = '#00cc44';
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 2, currentFlagY);
        ctx.lineTo(x + w / 2 - 28, currentFlagY + 12 + flagWave);
        ctx.lineTo(x + w / 2 - 2, currentFlagY + 24);
        ctx.closePath();
        ctx.fill();

        // Flag White Border and Insignia
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 14, currentFlagY + 12 + flagWave * 0.5, 4, 0, Math.PI * 2);
        ctx.fill();

        // Top Golden Orb Finial
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 2, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'flag_top':
        // Top Finial
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 6, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 2, y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'castle_axe': {
        // Golden Base Platform
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(x + 2, y + h - 6, w - 4, 6);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(x + 4, y + h - 5, w - 8, 3);

        // Golden Axe Shaft
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(x + 8, y + 2, 4, h - 8);
        ctx.fillStyle = '#fff8dc';
        ctx.fillRect(x + 9, y + 2, 2, h - 8);

        // Steel Battle Axe Head with Silver Bevel
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(x + 12, y + 4);
        ctx.lineTo(x + w - 2, y + 12);
        ctx.lineTo(x + 12, y + 20);
        ctx.closePath();
        ctx.fill();

        // Sharp Blade Edge Highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Glowing Ruby Core / Switch Gem
        ctx.fillStyle = '#ff1133';
        ctx.beginPath();
        ctx.arc(x + 10, y + 12, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pulsing spark
        const spark = Math.sin(now / 120);
        if (spark > 0.4) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 9, y + 11, 2, 2);
        }
        break;
      }

      case 'bridge_chain': {
        // Wooden Bridge Plank with Heavy Iron Nails
        ctx.fillStyle = '#6e3b1c';
        ctx.fillRect(x, y + 4, w, h - 8);
        ctx.fillStyle = '#8b4d24';
        ctx.fillRect(x, y + 4, w, 2);
        ctx.fillStyle = '#4a2511';
        ctx.fillRect(x, y + h - 6, w, 2);

        // Iron Rivets / Studs
        ctx.fillStyle = '#222222';
        ctx.fillRect(x + 3, y + 8, 3, 3);
        ctx.fillRect(x + w - 6, y + 8, 3, 3);
        ctx.fillStyle = '#666666';
        ctx.fillRect(x + 4, y + 9, 1, 1);
        ctx.fillRect(x + w - 5, y + 9, 1, 1);

        // Suspended Chain Link underneath
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(x + w / 2 - 2, y + h - 4, 4, 4);
        ctx.fillStyle = '#666666';
        ctx.fillRect(x + w / 2 - 1, y + h - 3, 2, 2);
        break;
      }
    }
    ctx.restore();
  }

  // Draw Enemies
  static drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, now: number) {
    if (enemy.isDead && enemy.deathTimer <= 0) return;
    ctx.save();
    const x = Math.floor(enemy.x);
    const y = Math.floor(enemy.y);
    const isFacingLeft = enemy.facing === 'left';

    if (isFacingLeft) {
      ctx.translate(x + enemy.width, y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(x, y);
    }

    const w = enemy.width;
    const h = enemy.height;

    switch (enemy.type) {
      case 'goomba':
        if (enemy.isDead) {
          // Squashed Goomba (SMW flat defeat)
          ctx.fillStyle = '#8b3a0f';
          ctx.fillRect(2, h - 6, w - 4, 6);
          ctx.fillStyle = '#ffdfa0';
          ctx.fillRect(5, h - 8, w - 10, 4);
          ctx.fillStyle = '#000000';
          ctx.fillRect(7, h - 6, 2, 2);
          ctx.fillRect(w - 9, h - 6, 2, 2);
        } else {
          const walkOffset = Math.floor((now / 120) % 2) * 2;

          // 1. Brown Mushroom Cap (SMW palette)
          ctx.fillStyle = '#8b3a0f';
          ctx.beginPath();
          ctx.ellipse(w / 2, 9, 11, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#b8541a';
          ctx.fillRect(w / 2 - 6, 4, 12, 3);

          // 2. Cream Stem & Face
          ctx.fillStyle = '#ffdfa0';
          ctx.fillRect(4, 11, w - 8, 8);

          // 3. Fierce V-Angled Eyebrows & White Sclera Eyes
          ctx.fillStyle = '#000000';
          ctx.fillRect(5, 11, 4, 2);
          ctx.fillRect(6, 13, 2, 4);
          ctx.fillRect(w - 9, 11, 4, 2);
          ctx.fillRect(w - 8, 13, 2, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(5, 13, 1, 3);
          ctx.fillRect(w - 9, 13, 1, 3);

          // 4. Rounded Orange Walking Shoes
          ctx.fillStyle = '#d96b00';
          if (walkOffset === 0) {
            ctx.fillRect(2, h - 5, 7, 5);
            ctx.fillRect(w - 8, h - 4, 6, 4);
          } else {
            ctx.fillRect(2, h - 4, 6, 4);
            ctx.fillRect(w - 9, h - 5, 7, 5);
          }
          ctx.fillStyle = '#8b3a0f';
          ctx.fillRect(2, h - 1, 6, 1);
          ctx.fillRect(w - 8, h - 1, 6, 1);
        }
        break;

      case 'koopa_green':
      case 'koopa_red': {
        const isRed = enemy.type === 'koopa_red';
        const shellColor = isRed ? '#e52521' : '#00a300';
        const shellHighlight = isRed ? '#ff5544' : '#22cc22';
        const walk = Math.sin(now / 70) * 2;

        // Shell
        ctx.fillStyle = shellColor;
        ctx.beginPath();
        ctx.ellipse(w / 2 - 2, h - 10, 10, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hexagon Scutes
        ctx.fillStyle = shellHighlight;
        ctx.fillRect(w / 2 - 5, h - 13, 4, 4);
        ctx.fillRect(w / 2 + 1, h - 13, 4, 4);
        ctx.fillRect(w / 2 - 2, h - 8, 4, 4);

        // Head & Beak
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(w - 9, 4, 10, 10);
        ctx.fillRect(w - 2, 8, 4, 5);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w - 7, 5, 4, 5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(w - 5, 6, 2, 3);

        // Shoes
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(3, h - 4 + walk, 6, 4);
        ctx.fillRect(w - 8, h - 4 - walk, 6, 4);
        break;
      }

      case 'koopa_shell':
        ctx.fillStyle = '#00a300';
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, 11, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#22cc22';
        ctx.fillRect(w / 2 - 4, h / 2 - 4, 8, 8);
        break;

      case 'piranha_plant': {
        const bite = Math.sin(now / 90) * 3;
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.arc(w / 2, 12, 11, 0, Math.PI * 2);
        ctx.fill();

        // White Spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(w / 2 - 4, 7, 2.5, 0, Math.PI * 2);
        ctx.arc(w / 2 + 4, 8, 2.5, 0, Math.PI * 2);
        ctx.arc(w / 2, 15, 2, 0, Math.PI * 2);
        ctx.fill();

        // Teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(w / 2 - 8, 11 - bite, 16, 2);
        ctx.fillRect(w / 2 - 8, 15 + bite, 16, 2);
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(w / 2 - 6 + i * 4, 12 - bite, 2, 2);
          ctx.fillRect(w / 2 - 4 + i * 4, 14 + bite, 2, 2);
        }

        // Green Stem
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(w / 2 - 3, 22, 6, h - 22);
        ctx.fillStyle = '#33cc33';
        ctx.fillRect(w / 2 - 8, 24, 5, 3);
        ctx.fillRect(w / 2 + 3, 24, 5, 3);
        break;
      }

      case 'dry_bones':
        if (enemy.bonesCrumpledTimer && enemy.bonesCrumpledTimer > 0) {
          // Crumpled bone pile
          ctx.fillStyle = '#d0d0d0';
          ctx.fillRect(2, h - 8, w - 4, 8);
          ctx.fillStyle = '#909090';
          ctx.fillRect(6, h - 12, 8, 4);
        } else {
          // Skeletal Koopa
          ctx.fillStyle = '#404040';
          ctx.beginPath();
          ctx.ellipse(w / 2 - 2, h - 10, 10, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#e8e8e8';
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(6 + i * 4, h - 16, 2, 8);
          }
          // Skull Head
          ctx.fillStyle = '#e8e8e8';
          ctx.fillRect(w - 8, 4, 10, 10);
          ctx.fillStyle = '#000000';
          ctx.fillRect(w - 4, 6, 3, 3);
        }
        break;

      case 'hammer_bro':
        // Helmet
        ctx.fillStyle = '#008800';
        ctx.fillRect(w - 10, 2, 12, 6);
        ctx.fillStyle = '#ffcca3';
        ctx.fillRect(w - 8, 8, 8, 8);
        ctx.fillStyle = '#000000';
        ctx.fillRect(w - 2, 10, 2, 3);

        // Body & Shell
        ctx.fillStyle = '#008800';
        ctx.fillRect(4, 16, 12, 10);

        // Raised Hammer
        ctx.fillStyle = '#7a7a7a';
        ctx.fillRect(w - 4, 0, 8, 6);
        ctx.fillStyle = '#804000';
        ctx.fillRect(w - 2, 4, 3, 10);
        break;

      case 'bullet_bill':
        ctx.fillStyle = '#111118';
        ctx.beginPath();
        ctx.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(6, 4, w - 12, 2);
        ctx.fillRect(w - 9, 6, 6, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(w - 5, 7, 3, 4);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, h / 2 - 2, 8, 6);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(4, h / 2 + 2, 8, 2);
        break;

      case 'spiny':
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 8, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(w / 2, 2);
        ctx.lineTo(w / 2 - 3, 8);
        ctx.lineTo(w / 2 + 3, 8);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w / 2 - 6, 4);
        ctx.lineTo(w / 2 - 8, 9);
        ctx.lineTo(w / 2 - 4, 9);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(w / 2 + 6, 4);
        ctx.lineTo(w / 2 + 4, 9);
        ctx.lineTo(w / 2 + 8, 9);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(w - 6, h - 8, 6, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(w - 2, h - 7, 2, 2);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(3, h - 3, 5, 3);
        ctx.fillRect(w - 7, h - 3, 5, 3);
        break;

      case 'bowser': {
        const mouthOpen = (enemy.animTimer || 0) % 30 > 15;
        const isCharging = (enemy.fireChargeTimer || 0) > 0;
        const phase = enemy.bossPhase || 1;
        const isEnraged = phase >= 2;
        const isFury = phase === 3;
        const isFalling = enemy.isFallingInLava;

        // If falling into lava, apply flailing tilt & offset
        if (isFalling) {
          ctx.rotate((Math.sin(now / 50) * 15 * Math.PI) / 180);
        }

        // Fury / Phase 3 Fiery Aura Outline
        if (isFury) {
          ctx.shadowColor = '#ff2200';
          ctx.shadowBlur = 12 + Math.sin(now / 80) * 6;
        } else if (isEnraged) {
          ctx.shadowColor = '#ffaa00';
          ctx.shadowBlur = 6;
        }

        // 1. Spiky Koopa Shell (Green with orange/yellow spiked rim)
        const shellColor = isFury ? '#1a6600' : isEnraged ? '#007700' : '#008800';
        ctx.fillStyle = shellColor;
        ctx.beginPath();
        ctx.ellipse(24, 36, 22, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shell Rim
        ctx.strokeStyle = isFury ? '#ff3300' : isEnraged ? '#ff8800' : '#ffaa00';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // Shell Spikes (3D shaded cones)
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
          const sx = 14 + i * 8;
          const sy = 22 + i * 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#b0b0b0';
          ctx.fillRect(sx - 1, sy, 2, 4);
          ctx.fillStyle = '#ffffff';
        }

        // 2. Yellow Dragon Body & Ribbed Underbelly
        ctx.fillStyle = isFury ? '#e69900' : '#ffbb00';
        ctx.fillRect(28, 24, 24, 28);
        ctx.fillStyle = '#ffdd66';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(32, 28 + i * 8, 16, 4);
          ctx.fillStyle = '#d4a017';
          ctx.fillRect(32, 31 + i * 8, 16, 1);
          ctx.fillStyle = '#ffdd66';
        }

        // 3. Fierce Head, Mane & Horns
        ctx.fillStyle = shellColor;
        ctx.fillRect(38, 8, 20, 18);

        // White Horns
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(40, 8);
        ctx.lineTo(43, -4);
        ctx.lineTo(47, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Flaming Red Hair Mane (Animated flame strands)
        const flameOffset = Math.sin(now / 90) * 2;
        ctx.fillStyle = isFury ? '#ff1100' : '#e52521';
        ctx.fillRect(30, 2 + flameOffset, 10, 14);
        ctx.fillRect(33, -3 + flameOffset, 5, 8);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(32, 4 + flameOffset, 4, 8);

        // Fiery Glowing Eyes & Angry Brow
        ctx.fillStyle = isFury ? '#ffff00' : '#ff0000';
        ctx.fillRect(48, 11, 5, 5);
        ctx.fillStyle = '#000000';
        ctx.fillRect(50, 12, 2, 3);

        // Heavy Brow
        ctx.fillStyle = '#111111';
        ctx.fillRect(46, 9, 8, 3);

        // Snout, Jaws & Fangs
        ctx.fillStyle = isFury ? '#e69900' : '#ffbb00';
        const jawH = mouthOpen || isCharging ? 16 : 10;
        ctx.fillRect(46, 16, 16, jawH);

        // Fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(48, 16, 3, 4);
        ctx.fillRect(56, 16, 3, 4);
        if (mouthOpen || isCharging) {
          ctx.fillRect(50, 16 + jawH - 4, 3, 4);
          ctx.fillRect(56, 16 + jawH - 4, 3, 4);
        }

        // Fire Breath Charging Aura at mouth
        if (isCharging) {
          ctx.fillStyle = '#ff2200';
          ctx.beginPath();
          ctx.arc(62, 22, 7 + Math.sin(now / 30) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(62, 22, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Claws & Feet (Flailing if falling)
        const footW = 14;
        const footH = 10;
        const footY = isFalling ? 48 + Math.sin(now / 60) * 8 : 52;
        ctx.fillStyle = isFury ? '#e69900' : '#ffbb00';
        ctx.fillRect(22, footY, footW, footH);
        ctx.fillRect(40, footY, footW, footH);

        // Sharp White Claws
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(20, footY + 6, 4, 4);
        ctx.fillRect(26, footY + 6, 4, 4);
        ctx.fillRect(38, footY + 6, 4, 4);
        ctx.fillRect(44, footY + 6, 4, 4);

        // Reset shadow
        ctx.shadowBlur = 0;

        // 5. Boss Multi-Phase Health Bar & Title
        if (enemy.health !== undefined && enemy.maxHealth) {
          const barW = 60;
          const barH = 6;
          const barX = 2;
          const barY = -18;

          // Bar Background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(barX, barY, barW, barH);
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 1;
          ctx.strokeRect(barX, barY, barW, barH);

          // Fill Health
          const healthRatio = Math.max(0, enemy.health / enemy.maxHealth);
          const barFillColor = isFury ? '#ff1100' : isEnraged ? '#ff8800' : '#22cc44';
          ctx.fillStyle = barFillColor;
          ctx.fillRect(barX + 1, barY + 1, (barW - 2) * healthRatio, barH - 2);

          // Phase divider notches (at 1/3 and 2/3)
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(barX + barW * 0.33, barY, 1, barH);
          ctx.fillRect(barX + barW * 0.66, barY, 1, barH);

          // Phase text badge
          ctx.fillStyle = isFury ? '#ff3300' : '#ffd700';
          ctx.font = 'bold 6px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(
            isFury ? 'PHASE 3: FURY' : isEnraged ? 'PHASE 2: ENRAGED' : 'BOWSER',
            barX + barW / 2,
            barY - 3
          );
        }
        break;
      }
    }

    ctx.restore();
  }

  // Draw Items (Super Mushroom, Fire Flower, Propeller, Starman, Yoshi Egg, etc.)
  static drawItem(ctx: CanvasRenderingContext2D, item: ItemEntity, now: number) {
    ctx.save();
    const x = Math.floor(item.x);
    const y = Math.floor(item.y);
    const w = item.width;
    const h = item.height;

    switch (item.type) {
      case 'coin': {
        const coinSpin = Math.abs(Math.sin(now / 100));
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, (w / 2 - 2) * coinSpin, h / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        break;
      }

      case 'super_mushroom':
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 8, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + w / 2 - 3, y + 2, 6, 6);
        ctx.fillRect(x + 2, y + 6, 3, 3);
        ctx.fillRect(x + w - 5, y + 6, 3, 3);

        ctx.fillStyle = '#fce4a6';
        ctx.fillRect(x + 4, y + 8, w - 8, 10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 10, 2, 4);
        ctx.fillRect(x + w - 8, y + 10, 2, 4);
        break;

      case '1up_mushroom':
        ctx.fillStyle = '#00bb00';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 8, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + w / 2 - 3, y + 2, 6, 6);
        ctx.fillRect(x + 2, y + 6, 3, 3);
        ctx.fillRect(x + w - 5, y + 6, 3, 3);

        ctx.fillStyle = '#fce4a6';
        ctx.fillRect(x + 4, y + 8, w - 8, 10);
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 6, y + 10, 2, 4);
        ctx.fillRect(x + w - 8, y + 10, 2, 4);
        break;

      case 'fire_flower': {
        const glow = Math.floor(now / 80) % 2 === 0 ? '#ffcc00' : '#ffffff';
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 7, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + 7, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#00bb00';
        ctx.fillRect(x + w / 2 - 2, y + 12, 4, 6);
        ctx.fillRect(x + 2, y + 13, 4, 3);
        ctx.fillRect(x + w - 6, y + 13, 4, 3);
        break;
      }

      case 'propeller_mushroom':
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 9, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#fce4a6';
        ctx.fillRect(x + 5, y + 9, w - 10, 8);

        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + w / 2 - 2, y, 4, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + w / 2 - 7, y - 2, 14, 2);
        break;

      case 'super_acorn':
        ctx.fillStyle = '#5c3317';
        ctx.fillRect(x + 4, y + 2, w - 8, 5);
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(x + 3, y + 7, w - 6, 8);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(x + w / 2 - 2, y + 9, 4, 4);
        break;

      case 'spiny_shell':
        ctx.fillStyle = '#cc2222';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 2);
        ctx.lineTo(x + w / 2 - 4, y + 8);
        ctx.lineTo(x + w / 2 + 4, y + 8);
        ctx.closePath();
        ctx.fill();
        break;

      case 'starman': {
        const starHues = ['#ffcc00', '#ff3366', '#33cc33', '#3399ff'];
        ctx.fillStyle = starHues[Math.floor(now / 60) % starHues.length];
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w * 0.65, y + h * 0.4);
        ctx.lineTo(x + w, y + h * 0.4);
        ctx.lineTo(x + w * 0.72, y + h * 0.65);
        ctx.lineTo(x + w * 0.82, y + h);
        ctx.lineTo(x + w / 2, y + h * 0.75);
        ctx.lineTo(x + w * 0.18, y + h);
        ctx.lineTo(x + w * 0.28, y + h * 0.65);
        ctx.lineTo(x, y + h * 0.4);
        ctx.lineTo(x + w * 0.35, y + h * 0.4);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'yoshi_egg':
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00bb00';
        ctx.beginPath();
        ctx.arc(x + w / 2 - 2, y + h / 2 - 3, 3, 0, Math.PI * 2);
        ctx.arc(x + w / 2 + 3, y + h / 2 + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'clown_car':
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'dry_bones_shell':
        ctx.fillStyle = '#404040';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, 9, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 4, y + 6, 3, 6);
        ctx.fillRect(x + w - 7, y + 6, 3, 6);
        break;
    }
    ctx.restore();
  }

  // Draw Projectiles
  static drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile, now: number) {
    ctx.save();
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);

    if (p.type === 'player_fireball') {
      const isAlt = Math.floor(now / 50) % 2 === 0;
      ctx.fillStyle = isAlt ? '#ff3300' : '#ffcc00';
      ctx.beginPath();
      ctx.arc(x + p.width / 2, y + p.height / 2, p.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + p.width / 2, y + p.height / 2, p.width / 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'charge_fireball' || p.type === 'bowser_fire') {
      ctx.fillStyle = '#ff2200';
      ctx.beginPath();
      ctx.arc(x + p.width / 2, y + p.height / 2, p.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(x + p.width / 2, y + p.height / 2, p.width / 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'hammer') {
      ctx.translate(x + p.width / 2, y + p.height / 2);
      ctx.rotate((now * 0.015) % (Math.PI * 2));
      ctx.fillStyle = '#7a7a7a';
      ctx.fillRect(-6, -4, 12, 8);
      ctx.fillStyle = '#804000';
      ctx.fillRect(-2, 0, 4, 12);
    }
    ctx.restore();
  }

  // Draw Particles
  static drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);

    if (p.type === 'floating_text') {
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillStyle = p.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(p.text || '', Math.floor(p.x), Math.floor(p.y));
    } else if (p.type === 'brick_debris') {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    } else if (p.type === 'confetti') {
      // Shimmering colored ribbon confetti
      ctx.fillStyle = p.color;
      ctx.translate(Math.floor(p.x), Math.floor(p.y));
      ctx.rotate((p.x + p.y) * 0.1);
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else if (p.type === 'firework') {
      // Brilliant glowing firework burst spark with trail
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size, 0, Math.PI * 2);
      ctx.fill();

      // White hot core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(Math.floor(p.x), Math.floor(p.y), Math.max(1, p.size * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'star_sparkle') {
      // 4-Point Star
      ctx.fillStyle = p.color;
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(px, py - s);
      ctx.lineTo(px + s * 0.3, py - s * 0.3);
      ctx.lineTo(px + s, py);
      ctx.lineTo(px + s * 0.3, py + s * 0.3);
      ctx.lineTo(px, py + s);
      ctx.lineTo(px - s * 0.3, py + s * 0.3);
      ctx.lineTo(px - s, py);
      ctx.lineTo(px - s * 0.3, py - s * 0.3);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(Math.floor(p.x), Math.floor(p.y), p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
