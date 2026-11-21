import { Player, Enemy, Item, Platform, Ladder, Spike, FruitType, Particle, FloatingScoreText } from '../types';

export class CanvasRenderer {
  // -------------------------------------------------------------
  // Draw Classic Arcade Raccoon (Ponpoko / 너구리)
  // -------------------------------------------------------------
  public static drawPlayer(ctx: CanvasRenderingContext2D, p: Player) {
    ctx.save();

    // Speed Boost After-Image Trail
    if (p.speedBoostTimer > 0) {
      const trailAlpha = 0.35 * (Math.sin(Date.now() / 80) + 1.2);
      ctx.save();
      ctx.globalAlpha = trailAlpha;
      ctx.fillStyle = '#FACC15'; // Golden speed blur
      const offX = p.facing === 'left' ? 10 : -10;
      ctx.fillRect(p.x + offX + 4, p.y + 4, p.width - 4, p.height - 4);
      ctx.restore();
    }

    ctx.translate(p.x, p.y);

    // Flashing when invulnerable
    if (p.invulnerableTimer > 0 && Math.floor(p.invulnerableTimer / 4) % 2 === 0) {
      ctx.restore();
      return;
    }

    // Hammer invincible sparkling aura
    if (p.hammerTimer > 0) {
      const auraColors = ['#FFD700', '#FF4500', '#00FFFF', '#FF1493'];
      const curColor = auraColors[Math.floor(Date.now() / 100) % auraColors.length];
      ctx.save();
      ctx.strokeStyle = curColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-4, -4, p.width + 8, p.height + 8);
      ctx.restore();
    }

    const isFacingLeft = p.facing === 'left';
    if (isFacingLeft && !p.isOnLadder) {
      ctx.scale(-1, 1);
      ctx.translate(-p.width, 0);
    }

    const anim = Math.floor(p.animFrame) % 4;
    const bodyColor = p.hammerTimer > 0 
      ? '#FFCC00' 
      : p.speedBoostTimer > 0 
      ? '#38BDF8' 
      : p.color === 'blue' 
      ? '#2563EB' 
      : p.color === 'gold' 
      ? '#EAB308' 
      : '#E52B20';

    // ---------------------------------------------------------
    // LADDER CLIMBING POSE (Back View / Climbing)
    // ---------------------------------------------------------
    if (p.isOnLadder) {
      const step = Math.floor(p.animFrame) % 2;

      // Bushy Striped Tail (Wagging at bottom)
      ctx.fillStyle = bodyColor;
      ctx.fillRect(step === 0 ? -2 : 16, 14, 8, 8);
      ctx.fillStyle = '#111111';
      ctx.fillRect(step === 0 ? 0 : 18, 16, 4, 4);

      // Main Back Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(3, 6, 16, 16);

      // Back of Head & Ears
      ctx.fillRect(4, 2, 14, 8);
      // Ears (Black tips, white inner)
      ctx.fillStyle = '#111111';
      ctx.fillRect(2, 0, 5, 5);
      ctx.fillRect(15, 0, 5, 5);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(3, 2, 2, 2);
      ctx.fillRect(16, 2, 2, 2);

      // White Paws on Ladder Rails/Rungs
      ctx.fillStyle = '#FFFFFF';
      if (step === 0) {
        ctx.fillRect(0, 4, 4, 4);  // Left hand up
        ctx.fillRect(18, 12, 4, 4); // Right hand down
        ctx.fillStyle = '#111111';
        ctx.fillRect(2, 21, 5, 4);  // Left foot
        ctx.fillRect(15, 19, 5, 4); // Right foot
      } else {
        ctx.fillRect(0, 12, 4, 4); // Left hand down
        ctx.fillRect(18, 4, 4, 4);  // Right hand up
        ctx.fillStyle = '#111111';
        ctx.fillRect(2, 19, 5, 4);  // Left foot
        ctx.fillRect(15, 21, 5, 4); // Right foot
      }

      ctx.restore();
      return;
    }

    // ---------------------------------------------------------
    // SIDE / FRONT VIEW (Running, Idle, Jumping)
    // ---------------------------------------------------------

    // 1. Bushy Striped Tail (Behind left side)
    const tailY = p.isJumping ? 10 : 12 + (anim % 2);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-6, tailY, 9, 8);
    ctx.fillStyle = '#111111'; // Black Stripes
    ctx.fillRect(-4, tailY + 2, 3, 8);
    ctx.fillRect(0, tailY + 2, 2, 8);

    // 2. Main Head & Body Silhouette
    ctx.fillStyle = bodyColor;
    ctx.fillRect(4, 5, 15, 17); // Head + Torso base

    // Pointy Ears
    ctx.fillStyle = '#111111'; // Ear outer edge
    ctx.fillRect(3, 0, 5, 6);
    ctx.fillRect(14, 0, 5, 6);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(4, 2, 3, 4);
    ctx.fillRect(15, 2, 3, 4);
    ctx.fillStyle = '#FFFFFF'; // Inner ear white
    ctx.fillRect(5, 2, 2, 2);
    ctx.fillRect(16, 2, 2, 2);

    // 3. Classic Big White Belly (너구리 큰 배)
    ctx.fillStyle = '#FFFFFF';
    const bellyW = p.vx !== 0 ? 10 : 9;
    ctx.fillRect(8, 11, bellyW, 10);
    // Light pink belly button / shading
    ctx.fillStyle = '#FFDDDD';
    ctx.fillRect(11, 15, 2, 2);

    // 4. Black Eye Mask & Snout
    ctx.fillStyle = '#111111'; // Black Mask
    ctx.fillRect(5, 5, 14, 5);

    // White Big Round Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(7, 6, 4, 4);
    ctx.fillRect(14, 6, 4, 4);

    // Black Pupils
    ctx.fillStyle = '#000000';
    const pupilOffX = p.vx > 0 ? 1 : p.vx < 0 ? -1 : 0;
    ctx.fillRect(8 + pupilOffX, 7, 2, 2);
    ctx.fillRect(15 + pupilOffX, 7, 2, 2);

    // White Snout & Black Nose
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(10, 8, 7, 4);
    ctx.fillStyle = '#111111';
    ctx.fillRect(14, 8, 3, 3); // Cute Nose

    // Cheek Rosy Blushes
    ctx.fillStyle = '#FF6688';
    ctx.fillRect(5, 9, 2, 2);

    // 5. White Paws / Hands
    ctx.fillStyle = '#FFFFFF';
    if (p.isJumping) {
      // Arms up in air
      ctx.fillRect(1, 4, 4, 4);
      ctx.fillRect(17, 4, 4, 4);
    } else if (p.vx !== 0) {
      // Pumping arms
      const armOff = (anim % 2) * 2;
      ctx.fillRect(3 + armOff, 11, 4, 4);
      ctx.fillRect(15 - armOff, 11, 4, 4);
    } else {
      // Resting hands
      ctx.fillRect(5, 12, 4, 4);
      ctx.fillRect(14, 12, 4, 4);
    }

    // 6. Feet / Shoes (Golden Boots if speed boosted)
    if (p.speedBoostTimer > 0) {
      ctx.fillStyle = '#F59E0B'; // Golden Speed Boots
      ctx.fillRect(2, 20, 7, 5);
      ctx.fillRect(13, 20, 7, 5);
      ctx.fillStyle = '#FFFFFF'; // Wing accents
      ctx.fillRect(0, 19, 3, 3);
      ctx.fillRect(19, 19, 3, 3);
    } else {
      ctx.fillStyle = '#111111';
      if (p.isJumping) {
        // Tucked feet
        ctx.fillRect(3, 20, 5, 4);
        ctx.fillRect(14, 20, 5, 4);
      } else if (p.vx !== 0) {
        // Running stride
        if (anim === 0 || anim === 2) {
          ctx.fillRect(2, 22, 6, 3);
          ctx.fillRect(13, 21, 5, 3);
        } else {
          ctx.fillRect(4, 21, 5, 3);
          ctx.fillRect(14, 22, 6, 3);
        }
      } else {
        // Standing idle
        ctx.fillRect(3, 22, 6, 3);
        ctx.fillRect(13, 22, 6, 3);
      }
    }

    // 7. Giant Super Hammer held by Raccoon
    if (p.hammerTimer > 0) {
      const hammerSwing = Math.sin(Date.now() / 90) * 0.4;
      ctx.save();
      ctx.translate(18, 8);
      ctx.rotate(hammerSwing);

      // Handle (Brown wood)
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-2, -18, 4, 24);
      
      // Hammer Head (Gold/Red metallic block)
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-10, -28, 20, 12);
      ctx.fillStyle = '#FACC15';
      ctx.fillRect(-12, -26, 4, 8);
      ctx.fillRect(8, -26, 4, 8);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-6, -26, 12, 4);

      // Star sparkle on hammer
      ctx.fillStyle = '#FFF';
      ctx.fillRect(6, -30, 3, 3);
      ctx.restore();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Custom Retro Stage Background Design
  // -------------------------------------------------------------
  public static drawBackground(
    ctx: CanvasRenderingContext2D,
    stageId: number,
    width: number,
    height: number,
    time: number
  ) {
    ctx.save();

    // Base background colors according to Stage theme
    if (stageId === 1) {
      // Stage 1: Deep Starry Night & Mountain Silhouettes
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#0a0a20');
      grad.addColorStop(0.6, '#151538');
      grad.addColorStop(1, '#050510');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Moon in top right
      ctx.fillStyle = '#FFEEAA';
      ctx.beginPath();
      ctx.arc(width - 60, 45, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0a20';
      ctx.beginPath();
      ctx.arc(width - 68, 41, 15, 0, Math.PI * 2);
      ctx.fill();

      // Twinkling Stars
      ctx.fillStyle = '#FFFFFF';
      const stars = [
        [30, 20], [90, 50], [150, 25], [220, 60], [310, 30],
        [380, 55], [450, 20], [500, 65], [70, 90], [180, 110],
        [340, 100], [490, 120], [120, 160], [280, 150], [420, 170]
      ];
      stars.forEach(([sx, sy], idx) => {
        const twinkle = (Math.sin(time * 3 + idx) + 1) / 2;
        ctx.globalAlpha = 0.3 + twinkle * 0.7;
        ctx.fillRect(sx, sy, idx % 3 === 0 ? 3 : 2, idx % 3 === 0 ? 3 : 2);
      });
      ctx.globalAlpha = 1.0;

      // Distant Mountain Silhouette
      ctx.fillStyle = '#101026';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(0, 360);
      ctx.lineTo(80, 320);
      ctx.lineTo(160, 350);
      ctx.lineTo(240, 300);
      ctx.lineTo(320, 340);
      ctx.lineTo(420, 290);
      ctx.lineTo(500, 330);
      ctx.lineTo(width, 310);
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

    } else if (stageId === 2) {
      // Stage 2: Sunset Synthwave / Arcade Twilight
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#1c0a2a');
      grad.addColorStop(0.5, '#3a1148');
      grad.addColorStop(1, '#0c0414');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Giant Neon Synth Sun
      const sunGrad = ctx.createLinearGradient(width / 2, 30, width / 2, 110);
      sunGrad.addColorStop(0, '#FFF500');
      sunGrad.addColorStop(1, '#FF0055');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, 70, 35, 0, Math.PI * 2);
      ctx.fill();

      // Sun Horizontal Cuts
      ctx.fillStyle = '#220830';
      ctx.fillRect(width / 2 - 38, 65, 76, 2);
      ctx.fillRect(width / 2 - 38, 72, 76, 3);
      ctx.fillRect(width / 2 - 38, 81, 76, 4);

      // Subtle Background Arcade Grid
      ctx.strokeStyle = 'rgba(255, 0, 128, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 120);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 120; y <= height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

    } else if (stageId === 3) {
      // Stage 3: Deep Emerald Forest / Magic Mushroom Atmosphere
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#041d14');
      grad.addColorStop(0.7, '#093625');
      grad.addColorStop(1, '#02120c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Floating Magic Spores / Fireflies
      for (let i = 0; i < 15; i++) {
        const fx = (i * 37 + Math.sin(time + i) * 20) % width;
        const fy = (i * 29 + Math.cos(time * 0.8 + i) * 15) % height;
        const opacity = (Math.sin(time * 2 + i) + 1) / 2;
        ctx.fillStyle = '#00FF88';
        ctx.globalAlpha = 0.2 + opacity * 0.6;
        ctx.beginPath();
        ctx.arc(fx, fy, 2 + (i % 2), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Tree Silhouettes
      ctx.fillStyle = '#031810';
      for (let tx = 20; tx < width; tx += 90) {
        ctx.fillRect(tx + 12, 280, 8, 140);
        ctx.beginPath();
        ctx.moveTo(tx, 300);
        ctx.lineTo(tx + 16, 240);
        ctx.lineTo(tx + 32, 300);
        ctx.closePath();
        ctx.fill();
      }

    } else if (stageId === 4) {
      // Stage 4: Cyber Arcade / Corn Field Horizon
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#101a08');
      grad.addColorStop(0.6, '#203310');
      grad.addColorStop(1, '#080d04');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Golden Moon & Stars
      ctx.fillStyle = '#FFE066';
      ctx.beginPath();
      ctx.arc(80, 50, 22, 0, Math.PI * 2);
      ctx.fill();

      // Background Pixel Bricks
      ctx.strokeStyle = 'rgba(255, 224, 102, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 0; y < height; y += 16) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 16) {
        const offset = (y / 16) % 2 === 0 ? 0 : 16;
        for (let x = offset; x < width; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 16);
          ctx.stroke();
        }
      }

    } else {
      // Stage 5: Lava Castle / Demon Palace Dungeon
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#2b0a0a');
      grad.addColorStop(0.7, '#481010');
      grad.addColorStop(1, '#1a0404');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Lava Crack Glow at bottom
      const lavaGlow = (Math.sin(time * 4) + 1) / 2;
      ctx.fillStyle = `rgba(255, 68, 0, ${0.15 + lavaGlow * 0.1})`;
      ctx.fillRect(0, height - 30, width, 30);

      // Castle Pillar Silhouettes
      ctx.fillStyle = '#1c0505';
      [40, 160, 280, 400, 500].forEach((px) => {
        ctx.fillRect(px, 0, 24, height);
        ctx.fillStyle = '#300a0a';
        ctx.fillRect(px + 4, 0, 4, height);
        ctx.fillStyle = '#1c0505';
      });
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Green Mouse Enemy (초록 생쥐)
  // -------------------------------------------------------------
  public static drawMouse(ctx: CanvasRenderingContext2D, m: Enemy) {
    ctx.save();
    ctx.translate(m.x, m.y);

    if (m.facing === 'left') {
      ctx.scale(-1, 1);
      ctx.translate(-m.width, 0);
    }

    // Green Arcade Body
    ctx.fillStyle = '#00E640';
    ctx.fillRect(2, 4, 16, 12);

    // Pink Round Ears
    ctx.fillStyle = '#FF77AA';
    ctx.fillRect(12, 1, 5, 5);

    // White/Black Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(13, 5, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(14, 6, 2, 2);

    // Snout / Pink Nose
    ctx.fillStyle = '#FF77AA';
    ctx.fillRect(17, 9, 3, 3);

    // Long Tail
    ctx.fillStyle = '#00E640';
    ctx.fillRect(-3, 11, 5, 2);
    ctx.fillRect(-5, 9, 3, 2);

    // Feet running
    ctx.fillStyle = '#111111';
    const step = Math.floor(m.animFrame) % 2;
    ctx.fillRect(3 + step * 2, 15, 4, 3);
    ctx.fillRect(11 - step * 2, 15, 4, 3);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Snake Enemy (뱀)
  // -------------------------------------------------------------
  public static drawSnake(ctx: CanvasRenderingContext2D, s: Enemy) {
    ctx.save();
    ctx.translate(s.x, s.y);

    if (s.facing === 'left') {
      ctx.scale(-1, 1);
      ctx.translate(-s.width, 0);
    }

    const wave = (Math.floor(s.animFrame) % 2) * 2;

    // Snake Coiled/Wavy Body (Brown / Yellow stripes)
    ctx.fillStyle = '#CC7722';
    ctx.fillRect(0, 6 - wave, 18, 8);
    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(4, 6 - wave, 3, 8);
    ctx.fillRect(10, 6 - wave, 3, 8);

    // Snake Head
    ctx.fillStyle = '#CC7722';
    ctx.fillRect(14, 2, 8, 10);

    // Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(17, 4, 3, 3);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(18, 5, 2, 2);

    // Red Flickering Tongue
    if (Math.floor(s.animFrame * 2) % 2 === 0) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(22, 7, 4, 2);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Bat Enemy (박쥐 - 날아다니는 적)
  // -------------------------------------------------------------
  public static drawBat(ctx: CanvasRenderingContext2D, b: Enemy) {
    ctx.save();
    ctx.translate(b.x, b.y);

    const flap = Math.floor(b.animFrame) % 2;

    // Purple bat body
    ctx.fillStyle = '#7C3AED';
    ctx.fillRect(8, 6, 8, 10);

    // Pointy Ears
    ctx.fillStyle = '#4C1D95';
    ctx.fillRect(8, 2, 3, 4);
    ctx.fillRect(13, 2, 3, 4);

    // Glowing Yellow Eyes
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(9, 8, 2, 2);
    ctx.fillRect(13, 8, 2, 2);

    // Wings
    ctx.fillStyle = '#6D28D9';
    if (flap === 0) {
      // Wings Up
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(0, 0);
      ctx.lineTo(4, 12);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(24, 0);
      ctx.lineTo(20, 12);
      ctx.closePath();
      ctx.fill();
    } else {
      // Wings Down
      ctx.beginPath();
      ctx.moveTo(8, 10);
      ctx.lineTo(0, 16);
      ctx.lineTo(4, 8);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(16, 10);
      ctx.lineTo(24, 16);
      ctx.lineTo(20, 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Frog Enemy (점핑 개구리)
  // -------------------------------------------------------------
  public static drawFrog(ctx: CanvasRenderingContext2D, f: Enemy) {
    ctx.save();
    ctx.translate(f.x, f.y);

    if (f.facing === 'left') {
      ctx.scale(-1, 1);
      ctx.translate(-f.width, 0);
    }

    // Lime Green Frog Body
    ctx.fillStyle = '#65A30D';
    ctx.fillRect(2, 6, 18, 12);

    // Big Frog Eyes on top
    ctx.fillStyle = '#84CC16';
    ctx.fillRect(4, 2, 5, 5);
    ctx.fillRect(13, 2, 5, 5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(5, 3, 3, 3);
    ctx.fillRect(14, 3, 3, 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(6, 4, 2, 2);
    ctx.fillRect(15, 4, 2, 2);

    // Yellow Belly
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(6, 11, 10, 6);

    // Folded hind legs
    ctx.fillStyle = '#4D7C0F';
    ctx.fillRect(0, 10, 4, 8);
    ctx.fillRect(18, 10, 4, 8);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Ghost / Wisp Enemy (도깨비불 / 유령)
  // -------------------------------------------------------------
  public static drawGhost(ctx: CanvasRenderingContext2D, g: Enemy) {
    ctx.save();
    ctx.translate(g.x, g.y);

    const anim = Math.floor(g.animFrame) % 3;

    // Glowing ethereal body
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(10, 8, 8, Math.PI, 0);
    ctx.lineTo(18, 16);
    ctx.lineTo(2, 16);
    ctx.closePath();
    ctx.fill();

    // Wavy ghost skirt
    ctx.fillStyle = '#0284C7';
    if (anim === 0) {
      ctx.fillRect(2, 16, 4, 3);
      ctx.fillRect(8, 16, 4, 4);
      ctx.fillRect(14, 16, 4, 3);
    } else {
      ctx.fillRect(4, 16, 4, 4);
      ctx.fillRect(10, 16, 4, 3);
      ctx.fillRect(16, 16, 2, 4);
    }

    // Glowing White & Dark Blue Eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(5, 6, 4, 4);
    ctx.fillRect(11, 6, 4, 4);
    ctx.fillStyle = '#0C4A6E';
    ctx.fillRect(7, 7, 2, 3);
    ctx.fillRect(13, 7, 2, 3);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Flame Demon Enemy (화염 정령)
  // -------------------------------------------------------------
  public static drawFlame(ctx: CanvasRenderingContext2D, fl: Enemy) {
    ctx.save();
    ctx.translate(fl.x, fl.y);

    const flicker = Math.sin(Date.now() / 70) * 2;

    // Outer Red Flame
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(10, 0 - flicker);
    ctx.lineTo(20, 18);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();

    // Middle Orange Core
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(10, 4 + flicker);
    ctx.lineTo(17, 18);
    ctx.lineTo(3, 18);
    ctx.closePath();
    ctx.fill();

    // Inner Yellow Heart
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(14, 18);
    ctx.lineTo(6, 18);
    ctx.closePath();
    ctx.fill();

    // Angry Fire Eyes
    ctx.fillStyle = '#111';
    ctx.fillRect(5, 10, 3, 3);
    ctx.fillRect(12, 10, 3, 3);

    ctx.restore();
  }

  // Generic Enemy Dispatcher
  public static drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    if (e.isDestroyed) return;
    switch (e.type) {
      case 'mouse':
        this.drawMouse(ctx, e);
        break;
      case 'snake':
        this.drawSnake(ctx, e);
        break;
      case 'bat':
        this.drawBat(ctx, e);
        break;
      case 'frog':
        this.drawFrog(ctx, e);
        break;
      case 'ghost':
        this.drawGhost(ctx, e);
        break;
      case 'flame':
        this.drawFlame(ctx, e);
        break;
      default:
        this.drawMouse(ctx, e);
    }
  }

  // -------------------------------------------------------------
  // Draw Red Tack / Spike (가시/압정)
  // -------------------------------------------------------------
  public static drawSpike(ctx: CanvasRenderingContext2D, spike: Spike) {
    if (spike.isDestroyed) return;

    ctx.save();
    ctx.translate(spike.x, spike.y);

    // Moving spike highlight
    if (spike.isMoving) {
      ctx.fillStyle = '#FFB703';
      ctx.fillRect(-2, spike.height, spike.width + 4, 2);
    }

    // Metallic Red Sharp Tack
    ctx.fillStyle = '#FF0033'; // Bright Red
    ctx.beginPath();
    ctx.moveTo(spike.width / 2, 0); // Sharp Top Tip
    ctx.lineTo(spike.width, spike.height);
    ctx.lineTo(0, spike.height);
    ctx.closePath();
    ctx.fill();

    // White Highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(spike.width / 2 - 1, 2, 2, 6);

    // Base Knob
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(-1, spike.height - 2, spike.width + 2, 3);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Food Items, Yellow Jars, & Power-Ups
  // -------------------------------------------------------------
  public static drawItem(ctx: CanvasRenderingContext2D, item: Item) {
    if (item.collected) return;

    ctx.save();
    ctx.translate(item.x, item.y);

    // Subtle bobbing / floating animation for power-ups
    const isPowerUp = item.type === 'power_speed' || item.type === 'power_hammer' || item.type === 'power_life';
    if (isPowerUp) {
      const bob = Math.sin(Date.now() / 150) * 2;
      ctx.translate(0, bob);
    }

    switch (item.type) {
      // ----------------- POWER UP 1: SPEED BOOTS -----------------
      case 'power_speed': {
        // Glowing Aura
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(9, 9, 11, 0, Math.PI * 2);
        ctx.fill();

        // Golden Lightning Boot
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(3, 8, 12, 8);
        ctx.fillRect(3, 3, 6, 7);
        // Wing feathers
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 2, 4, 3);
        ctx.fillRect(1, 5, 3, 2);
        // Lightning bolt icon
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.moveTo(9, 3);
        ctx.lineTo(6, 9);
        ctx.lineTo(9, 9);
        ctx.lineTo(7, 14);
        ctx.lineTo(12, 7);
        ctx.lineTo(9, 7);
        ctx.closePath();
        ctx.fill();
        break;
      }

      // ----------------- POWER UP 2: SUPER HAMMER -----------------
      case 'power_hammer': {
        // Sparkling Aura
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(10, 10, 12, 0, Math.PI * 2);
        ctx.fill();

        // Wooden Handle
        ctx.fillStyle = '#B45309';
        ctx.fillRect(8, 7, 4, 12);
        // Hammer Metal Head
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(1, 0, 18, 8);
        ctx.fillStyle = '#FACC15';
        ctx.fillRect(0, 1, 3, 6);
        ctx.fillRect(17, 1, 3, 6);
        // Star on center
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(8, 2, 4, 4);
        break;
      }

      // ----------------- POWER UP 3: 1-UP EXTRA LIFE -----------------
      case 'power_life': {
        // Golden Heart / Peach 1UP
        ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
        ctx.beginPath();
        ctx.arc(9, 9, 12, 0, Math.PI * 2);
        ctx.fill();

        // Red/Pink Heart
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.arc(5, 6, 5, 0, Math.PI * 2);
        ctx.arc(13, 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.lineTo(9, 17);
        ctx.lineTo(18, 7);
        ctx.closePath();
        ctx.fill();

        // "1UP" text inside
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('1UP', 9, 10);
        break;
      }

      case 'jar': {
        // Yellow Classic Jar (항아리)
        ctx.fillStyle = '#FFCC00'; // Gold yellow
        ctx.fillRect(2, 6, 16, 18);
        ctx.fillRect(0, 10, 20, 10);
        // Rim/Cap
        ctx.fillStyle = '#E6B800';
        ctx.fillRect(4, 2, 12, 4);
        ctx.fillStyle = '#111111';
        ctx.fillRect(6, 4, 8, 2); // Mouth opening
        break;
      }

      case 'carrot': {
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(8, 20);
        ctx.lineTo(2, 4);
        ctx.lineTo(14, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#00FF44';
        ctx.fillRect(4, 0, 3, 5);
        ctx.fillRect(9, 0, 3, 5);
        break;
      }

      case 'cherry': {
        ctx.fillStyle = '#FF0055';
        ctx.beginPath();
        ctx.arc(5, 12, 5, 0, Math.PI * 2);
        ctx.arc(13, 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#00EE44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(5, 8);
        ctx.lineTo(9, 2);
        ctx.lineTo(13, 8);
        ctx.stroke();
        break;
      }

      case 'mushroom': {
        ctx.fillStyle = '#FF2222';
        ctx.beginPath();
        ctx.arc(9, 8, 8, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(5, 4, 3, 3);
        ctx.fillRect(11, 4, 3, 3);
        ctx.fillStyle = '#FFEEDD';
        ctx.fillRect(6, 8, 6, 8);
        break;
      }

      case 'corn': {
        ctx.fillStyle = '#FFDD00';
        ctx.fillRect(4, 4, 8, 14);
        ctx.fillStyle = '#00CC44';
        ctx.fillRect(2, 12, 4, 8);
        ctx.fillRect(10, 12, 4, 8);
        break;
      }

      case 'watermelon': {
        ctx.fillStyle = '#009933';
        ctx.fillRect(0, 12, 18, 4);
        ctx.fillStyle = '#FF2244';
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(1, 12);
        ctx.lineTo(17, 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillRect(7, 6, 2, 2);
        ctx.fillRect(10, 8, 2, 2);
        break;
      }

      case 'strawberry': {
        ctx.fillStyle = '#FF0044';
        ctx.beginPath();
        ctx.arc(9, 9, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00DD44';
        ctx.fillRect(5, 0, 8, 4);
        ctx.fillStyle = '#FFFF00';
        ctx.fillRect(6, 6, 2, 2);
        ctx.fillRect(10, 10, 2, 2);
        break;
      }

      case 'banana': {
        ctx.fillStyle = '#FFE600';
        ctx.beginPath();
        ctx.arc(10, 4, 10, 0.2, Math.PI - 0.2);
        ctx.stroke();
        ctx.fillRect(2, 8, 14, 6);
        break;
      }

      case 'melon': {
        ctx.fillStyle = '#88EE33';
        ctx.beginPath();
        ctx.arc(9, 9, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(9, 9, 5, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      default: {
        ctx.fillStyle = '#FFCC00';
        ctx.fillRect(2, 2, 14, 14);
      }
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Particle Effects
  // -------------------------------------------------------------
  public static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    ctx.save();
    particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Floating Score & Bonus Texts
  // -------------------------------------------------------------
  public static drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingScoreText[]) {
    ctx.save();
    texts.forEach((t) => {
      ctx.globalAlpha = Math.max(0, t.opacity);
      ctx.fillStyle = t.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      // Outline for maximum retro contrast
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    });
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Platform & Ladder
  // -------------------------------------------------------------
  public static drawPlatformsAndLadders(
    ctx: CanvasRenderingContext2D,
    platforms: Platform[],
    ladders: Ladder[]
  ) {
    // 1. Draw Ladders First (Behind platforms)
    ladders.forEach((l) => {
      ctx.fillStyle = '#00DDFF'; // Arcade cyan blue ladder
      // Vertical rails
      ctx.fillRect(l.x, l.yMin, 3, l.yMax - l.yMin);
      ctx.fillRect(l.x + l.width - 3, l.yMin, 3, l.yMax - l.yMin);

      // Horizontal rungs
      const stepSize = 10;
      for (let y = l.yMin + 4; y < l.yMax; y += stepSize) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(l.x + 2, y, l.width - 4, 2);
      }
    });

    // 2. Draw Platforms
    platforms.forEach((p) => {
      // Platform beam (Cyan / Mint)
      ctx.fillStyle = '#00FFCC';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Top White Line Pattern (Retro dots or solid top)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(p.x, p.y, p.width, 3);

      // Bottom Dark Edge
      ctx.fillStyle = '#008888';
      ctx.fillRect(p.x, p.y + p.height - 3, p.width, 3);
    });
  }
}
