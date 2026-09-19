import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import { SpriteRenderer } from '../game/sprites';
import { KeyControls } from '../types';

interface GameCanvasProps {
  engine: GameEngine;
  keys: KeyControls;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, keys }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Enable crisp pixelated scaling
    ctx.imageSmoothingEnabled = false;

    let animId: number;

    const render = () => {
      const now = performance.now();
      const width = canvas.width;
      const height = canvas.height;

      // Update engine physics and game loop
      engine.update(keys);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // 0. Draw Parallax Background based on stage theme & environment
      drawBackground(ctx, engine, width, height, now);

      ctx.save();
      // Apply Camera Translation
      ctx.translate(-Math.floor(engine.cameraX), -Math.floor(engine.cameraY));

      const currentTheme = engine.stageData.theme;

      // 1. Draw Blocks with dynamic environmental ground/brick palettes
      for (const block of engine.blocks) {
        if (
          block.x + block.width >= engine.cameraX - 50 &&
          block.x <= engine.cameraX + width + 50
        ) {
          SpriteRenderer.drawBlock(ctx, block, now, currentTheme);
        }
      }

      // 2. Draw Items
      for (const item of engine.items) {
        SpriteRenderer.drawItem(ctx, item, now);
      }

      // 3. Draw Enemies
      for (const enemy of engine.enemies) {
        SpriteRenderer.drawEnemy(ctx, enemy, now);
      }

      // 4. Draw Yoshi Tongues
      for (const tongue of engine.yoshiTongues) {
        SpriteRenderer.drawYoshiTongue(ctx, tongue);
      }

      // 5. Draw Players (Mario, Luigi, Toad, Peach, Yoshi)
      for (const player of engine.players) {
        SpriteRenderer.drawPlayer(ctx, player, now);
      }

      // 6. Draw Projectiles
      for (const p of engine.projectiles) {
        SpriteRenderer.drawProjectile(ctx, p, now);
      }

      // 7. Draw Particles
      for (const particle of engine.particles) {
        SpriteRenderer.drawParticle(ctx, particle);
      }

      ctx.restore();

      // 8. Draw HUD Overlay (Fixed on screen)
      drawHUD(ctx, engine, width, height, now);

      // 9. Draw Boss Alert & Cutscene Dramatic Cinematic Overlay (Stage 10)
      if (engine.isCutsceneActive) {
        drawBossAlertCutscene(ctx, engine, width, height, now);
      }

      // 10. Draw Spectacular Stage Clear Celebration Overlay
      if (engine.state === 'STAGE_CLEAR') {
        drawStageClearCelebration(ctx, engine, width, height, now);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [engine, keys]);

  return (
    <canvas
      ref={canvasRef}
      id="mario-game-canvas"
      width={800}
      height={480}
      className="w-full h-auto max-h-[75vh] object-contain rounded-2xl shadow-xl border-4 border-gray-900 bg-black block mx-auto select-none ring-2 ring-black/10"
    />
  );
};

// Draw Parallax Themed Background & Dynamic Skies
function drawBackground(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  width: number,
  height: number,
  now: number
) {
  const theme = engine.stageData.theme;
  const camX = engine.cameraX;

  // Base background fill or gradient
  if (theme === 'underground') {
    // Subterranean Nighttime Midnight Cave Gradient
    const caveGrad = ctx.createLinearGradient(0, 0, 0, height);
    caveGrad.addColorStop(0, '#060814');
    caveGrad.addColorStop(0.5, '#0a0d20');
    caveGrad.addColorStop(1, '#020308');
    ctx.fillStyle = caveGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle cavern background bricks & stalactites
    ctx.fillStyle = 'rgba(0, 80, 160, 0.08)';
    for (let x = -((camX * 0.2) % 60); x < width; x += 60) {
      ctx.fillRect(x, 0, 30, height);
    }

    // Hanging crystal stalactites
    ctx.fillStyle = 'rgba(0, 180, 255, 0.15)';
    for (let sx = -((camX * 0.35) % 120); sx < width; sx += 120) {
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + 15, 45);
      ctx.lineTo(sx + 30, 0);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme === 'canyon') {
    // Warm Sunset Dusk Sky Gradient
    const canyonGrad = ctx.createLinearGradient(0, 0, 0, height);
    canyonGrad.addColorStop(0, '#4a154b');
    canyonGrad.addColorStop(0.4, '#c23b22');
    canyonGrad.addColorStop(0.75, '#f37324');
    canyonGrad.addColorStop(1, '#fdbb42');
    ctx.fillStyle = canyonGrad;
    ctx.fillRect(0, 0, width, height);

    // Distant Sandstone Mountain Silhouettes
    ctx.fillStyle = '#6a1b29';
    const mesaOffset = (camX * 0.25) % 320;
    for (let mx = -320; mx < width + 320; mx += 160) {
      const x = mx - mesaOffset;
      ctx.fillRect(x, height - 130, 100, 130);
      ctx.fillRect(x - 20, height - 90, 140, 90);
    }
  } else if (theme === 'mountain') {
    // Alpine Morning Sky Gradient
    const mtnGrad = ctx.createLinearGradient(0, 0, 0, height);
    mtnGrad.addColorStop(0, '#3a6699');
    mtnGrad.addColorStop(0.7, '#8fb3de');
    mtnGrad.addColorStop(1, '#d8e8f8');
    ctx.fillStyle = mtnGrad;
    ctx.fillRect(0, 0, width, height);

    // Snowcapped Alpine Mountain Peaks
    ctx.fillStyle = '#485568';
    const peakOffset = (camX * 0.3) % 400;
    for (let px = -400; px < width + 400; px += 200) {
      const x = px - peakOffset;
      ctx.beginPath();
      ctx.moveTo(x - 60, height - 30);
      ctx.lineTo(x + 50, height - 170);
      ctx.lineTo(x + 160, height - 30);
      ctx.closePath();
      ctx.fill();

      // Snow peak top
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + 25, height - 135);
      ctx.lineTo(x + 50, height - 170);
      ctx.lineTo(x + 75, height - 135);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#485568';
    }
  } else if (theme === 'lava' || theme === 'boss_castle') {
    // Volcanic Night Obsidian Sky
    const lavaGrad = ctx.createLinearGradient(0, 0, 0, height);
    lavaGrad.addColorStop(0, '#100508');
    lavaGrad.addColorStop(0.6, '#1c080d');
    lavaGrad.addColorStop(1, '#3a080d');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, 0, width, height);

    // Castle Dark Pillars
    ctx.fillStyle = '#1e1418';
    const pillarOffset = (camX * 0.3) % 180;
    for (let px = -180; px < width + 180; px += 120) {
      const x = px - pillarOffset;
      ctx.fillRect(x, 0, 40, height);
      ctx.fillStyle = '#2d1820';
      ctx.fillRect(x + 6, 0, 6, height);
      ctx.fillStyle = '#1e1418';
    }

    // Floating Ember Sparks
    ctx.fillStyle = '#ff5500';
    for (let i = 0; i < 8; i++) {
      const emberX = ((now * 0.05 + i * 110) % width);
      const emberY = height - 40 - ((now * 0.08 + i * 45) % 180);
      ctx.fillRect(emberX, emberY, 3, 3);
    }

    // Fiery Underglow
    const fieryGrad = ctx.createLinearGradient(0, height - 120, 0, height);
    fieryGrad.addColorStop(0, 'rgba(255, 68, 0, 0)');
    fieryGrad.addColorStop(1, 'rgba(255, 68, 0, 0.45)');
    ctx.fillStyle = fieryGrad;
    ctx.fillRect(0, height - 120, width, 120);
  } else {
    // Classic Grassland / Overworld & Sky
    ctx.fillStyle = engine.stageData.backgroundColor || '#5c94fc';
    ctx.fillRect(0, 0, width, height);

    // Parallax Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    const cloudOffset1 = (camX * 0.2 + now * 0.01) % 600;
    for (let cx = -600; cx < width + 600; cx += 300) {
      const x = cx - cloudOffset1;
      drawFluffyCloud(ctx, x, 60, 60);
      drawFluffyCloud(ctx, x + 150, 110, 45);
    }

    // Parallax Rolling Green Hills
    if (theme === 'grassland') {
      ctx.fillStyle = '#2db83d';
      const hillOffset = (camX * 0.4) % 400;
      for (let hx = -400; hx < width + 400; hx += 200) {
        const x = hx - hillOffset;
        ctx.beginPath();
        ctx.arc(x + 100, height - 40, 120, Math.PI, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#229930';
      const hillOffset2 = (camX * 0.6) % 300;
      for (let hx = -300; hx < width + 300; hx += 150) {
        const x = hx - hillOffset2;
        ctx.beginPath();
        ctx.arc(x + 75, height - 20, 80, Math.PI, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Dynamic Stage Clear Transition Background FX
  if (engine.state === 'STAGE_CLEAR') {
    const clearTimer = engine.stageClearTimer;
    const hue = engine.stageClearSkyHueShift || (clearTimer * 3) % 360;

    // 1. Radiant Rotating Celebration Sunburst Beams
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((now * 0.0008) % (Math.PI * 2));
    const rays = 16;
    for (let r = 0; r < rays; r++) {
      const angle = (r / rays) * Math.PI * 2;
      ctx.fillStyle = r % 2 === 0 ? `hsla(${hue}, 85%, 65%, 0.12)` : `hsla(${(hue + 45) % 360}, 90%, 75%, 0.05)`;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, width, angle, angle + (Math.PI * 2) / (rays * 2));
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // 2. Shimmering Rainbow Aurora Waves across the sky
    const auroraGrad = ctx.createLinearGradient(0, 0, width, height * 0.6);
    auroraGrad.addColorStop(0, `hsla(${hue}, 90%, 60%, 0.22)`);
    auroraGrad.addColorStop(0.33, `hsla(${(hue + 90) % 360}, 95%, 65%, 0.25)`);
    auroraGrad.addColorStop(0.66, `hsla(${(hue + 180) % 360}, 90%, 60%, 0.22)`);
    auroraGrad.addColorStop(1, `hsla(${(hue + 270) % 360}, 95%, 70%, 0.18)`);

    ctx.save();
    ctx.fillStyle = auroraGrad;
    for (let w = 0; w < 3; w++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let sx = 0; sx <= width; sx += 40) {
        const sy = 40 + w * 35 + Math.sin((now * 0.003) + sx * 0.015 + w) * 25;
        ctx.lineTo(sx, sy);
      }
      ctx.lineTo(width, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawFluffyCloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.arc(x + r * 0.4, y - r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

// Draw Pixel Retro HUD with Active Character Badge
function drawHUD(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  width: number,
  height: number,
  now: number
) {
  const p1 = engine.players[0];
  const p2 = engine.players[1];

  ctx.save();
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 4;

  const charNames: Record<string, string> = {
    mario: 'MARIO',
    luigi: 'LUIGI',
    toad: 'TOAD',
    peach: 'PEACH',
    yoshi: 'YOSHI',
  };

  const p1Name = p1 ? (charNames[p1.character] || 'MARIO') : 'MARIO';

  // Row 1: P1 Character & SCORE
  ctx.fillText(p1Name, 30, 24);
  const scoreStr = String(engine.totalScore).padStart(6, '0');
  ctx.fillText(scoreStr, 30, 40);

  // Lives (❤️ x 3)
  if (p1) {
    ctx.fillStyle = '#ff2244';
    ctx.fillText('❤️', 130, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`x${Math.max(0, p1.lives)}`, 150, 24);
    ctx.fillStyle = '#ffaaaa';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('LIVES', 130, 38);
    ctx.font = 'bold 13px "Courier New", monospace';
  }

  // Coins
  ctx.fillStyle = '#ffcc00';
  ctx.fillText('🪙', 230, 24);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`x${String(engine.totalCoins).padStart(2, '0')}`, 250, 24);

  // Power-up / Vehicle Badges
  if (p1 && p1.powerUp !== 'none') {
    const powerMap: Record<string, string> = {
      super: '🍄 SUPER',
      fire: '🔥 FIRE',
      propeller: '🚁 PROPELLER',
      squirrel: '🐿️ SQUIRREL',
      spiny_helmet: '🪖 SPINY',
    };
    ctx.fillStyle = '#ffdd44';
    ctx.fillText(powerMap[p1.powerUp] || '', 230, 40);
  }

  if (p1 && p1.vehicle !== 'none') {
    const vehMap: Record<string, string> = {
      yoshi: '🦖 YOSHI',
      clown_car: '🤡 CLOWN CAR',
      fire_clown_car: '🔥 FIRE CLOWN',
      dry_bones_shell: '💀 DRY BONES',
    };
    ctx.fillStyle = '#55ff55';
    ctx.fillText(vehMap[p1.vehicle] || '', 360, 40);
  }

  // World Stage Info
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`WORLD`, 500, 24);
  ctx.fillText(`STAGE ${engine.currentStageId}/10`, 500, 40);

  // Time
  ctx.fillText(`TIME`, 680, 24);
  const timeInt = Math.ceil(engine.timeRemaining);
  ctx.fillStyle = timeInt < 60 ? '#ff3333' : '#ffffff';
  ctx.fillText(String(timeInt).padStart(3, '0'), 680, 40);

  // 2P HUD
  if (p2) {
    const p2Name = charNames[p2.character] || 'LUIGI';
    ctx.fillStyle = '#33cc33';
    ctx.fillText(p2Name, 360, 24);
  }

  // Bowser Boss Health Bar (Stage 10)
  if (engine.currentStageId === 10) {
    const bowser = engine.enemies.find((e) => e.type === 'bowser');
    if (bowser && !bowser.isDead) {
      const barWidth = 260;
      const barHeight = 14;
      const bx = width / 2 - barWidth / 2;
      const by = height - 32;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(bx - 4, by - 16, barWidth + 8, barHeight + 20);

      ctx.fillStyle = '#ff3333';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('👑 KING BOWSER', width / 2, by - 4);

      // HP Bar background
      ctx.fillStyle = '#550000';
      ctx.fillRect(bx, by, barWidth, barHeight);

      // Current HP
      const hpRatio = Math.max(0, (bowser.health || 0) / (bowser.maxHealth || 25));
      ctx.fillStyle = hpRatio > 0.3 ? '#ff2200' : '#ff9900';
      ctx.fillRect(bx, by, barWidth * hpRatio, barHeight);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, barWidth, barHeight);
    }
  }

  ctx.restore();
}

// Dramatic Cinematic Boss Alert & Bowser Entrance Cutscene Overlay
function drawBossAlertCutscene(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  width: number,
  height: number,
  now: number
) {
  ctx.save();

  // 1. Cinematic Black Letterbox Bars (Top & Bottom)
  const barHeight = 44;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, barHeight);
  ctx.fillRect(0, height - barHeight, width, barHeight);

  // Red accent line on letterbox edges
  ctx.fillStyle = '#ff1100';
  ctx.fillRect(0, barHeight, width, 2);
  ctx.fillRect(0, height - barHeight - 2, width, 2);

  // 2. Flashing Red Warning Ambient Glow
  const isFlash = Math.floor(now / 150) % 2 === 0;
  if (isFlash) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.12)';
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Central BOSS ALERT Banner
  const alertCycle = Math.floor(now / 140) % 2;
  const centerY = height / 2 - 20;

  // Background ribbon
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.fillRect(0, centerY - 36, width, 72);
  ctx.fillStyle = isFlash ? '#ff0033' : '#ffcc00';
  ctx.fillRect(0, centerY - 36, width, 4);
  ctx.fillRect(0, centerY + 32, width, 4);

  // Warning Stripes
  ctx.fillStyle = isFlash ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 200, 0, 0.25)';
  const stripeOffset = (now * 0.1) % 40;
  for (let sx = -40; sx < width + 40; sx += 40) {
    ctx.beginPath();
    ctx.moveTo(sx + stripeOffset, centerY - 32);
    ctx.lineTo(sx + 20 + stripeOffset, centerY - 32);
    ctx.lineTo(sx + 10 + stripeOffset, centerY + 32);
    ctx.lineTo(sx - 10 + stripeOffset, centerY + 32);
    ctx.closePath();
    ctx.fill();
  }

  // Main Alert Text (Flashing)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 32px "Courier New", monospace, sans-serif';

  // Text Shadow
  ctx.fillStyle = '#000000';
  ctx.fillText('⚠️ BOSS ALERT ⚠️', width / 2 + 2, centerY + 2);

  // Flashing Color Text
  ctx.fillStyle = alertCycle === 0 ? '#ff1e27' : '#ffff00';
  ctx.fillText('⚠️ BOSS ALERT ⚠️', width / 2, centerY);

  // Subtitle
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('대마왕 쿠파 출현! (KING BOWSER APPEARS)', width / 2, centerY + 22);

  ctx.restore();
}

// Draw Spectacular Stage Clear Celebration Presentation & Iris Transition
function drawStageClearCelebration(
  ctx: CanvasRenderingContext2D,
  engine: GameEngine,
  width: number,
  height: number,
  now: number
) {
  const timer = engine.stageClearTimer;
  ctx.save();

  // 1. Stage Clear Banner
  const bannerY = 80;
  const bannerWidth = 420;
  const bannerHeight = 84;
  const bannerX = (width - bannerWidth) / 2;

  // Banner drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.fillRect(bannerX + 6, bannerY + 6, bannerWidth, bannerHeight);

  // Outer Golden Gradient Border
  const goldGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerWidth, bannerY + bannerHeight);
  goldGrad.addColorStop(0, '#ffe57f');
  goldGrad.addColorStop(0.5, '#ffb300');
  goldGrad.addColorStop(1, '#ff6f00');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(bannerX, bannerY, bannerWidth, bannerHeight);

  // Inner Dark Card
  ctx.fillStyle = '#1a1005';
  ctx.fillRect(bannerX + 4, bannerY + 4, bannerWidth - 8, bannerHeight - 8);

  // Shimmering Star Sparkles on banner edges
  const sparkAnim = (now * 0.005) % (Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(bannerX + 16, bannerY + 16, 3 + Math.sin(sparkAnim) * 1.5, 0, Math.PI * 2);
  ctx.arc(bannerX + bannerWidth - 16, bannerY + 16, 3 + Math.cos(sparkAnim) * 1.5, 0, Math.PI * 2);
  ctx.arc(bannerX + 16, bannerY + bannerHeight - 16, 3 + Math.cos(sparkAnim) * 1.5, 0, Math.PI * 2);
  ctx.arc(bannerX + bannerWidth - 16, bannerY + bannerHeight - 16, 3 + Math.sin(sparkAnim) * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Main Banner Header Text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 24px "Courier New", monospace, sans-serif';

  // Text shadow
  ctx.fillStyle = '#000000';
  ctx.fillText(`★ STAGE ${engine.currentStageId} CLEAR! ★`, width / 2 + 2, bannerY + 30);

  // Gold embossed text
  ctx.fillStyle = '#ffd54f';
  ctx.fillText(`★ STAGE ${engine.currentStageId} CLEAR! ★`, width / 2, bannerY + 28);

  // Subtitle
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#a5d6a7';
  ctx.fillText('CONGRATULATIONS! (스테이지 클리어!)', width / 2, bannerY + 58);

  // 2. Score Summary Box (Appears after frame 40)
  if (timer > 30) {
    const cardY = bannerY + bannerHeight + 14;
    const cardWidth = 340;
    const cardHeight = 64;
    const cardX = (width - cardWidth) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`TIME REMAINING:`, cardX + 16, cardY + 24);
    ctx.fillStyle = '#ffea00';
    ctx.fillText(`${Math.max(0, Math.floor(engine.timeRemaining))}`, cardX + 155, cardY + 24);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(`STAGE BONUS:`, cardX + 16, cardY + 44);
    ctx.fillStyle = '#00e676';
    ctx.fillText(`+${engine.stageClearScoreBonus.toLocaleString()} PTS`, cardX + 155, cardY + 44);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#80d8ff';
    ctx.fillText(`TOTAL: ${engine.totalScore.toLocaleString()}`, cardX + cardWidth - 16, cardY + 34);
  }

  // 3. Iris-Wipe Stage Transition Effect (Closing circle when timer > 190)
  if (timer >= 190) {
    const lead = engine.players[0];
    const playerScreenX = lead ? lead.x - engine.cameraX + lead.width / 2 : width / 2;
    const playerScreenY = lead ? lead.y - engine.cameraY + lead.height / 2 : height / 2;

    const progress = Math.min(1, (timer - 190) / 40); // 0 to 1
    const maxRadius = Math.sqrt(width * width + height * height);
    const currentRadius = Math.max(0, maxRadius * (1 - progress));

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.arc(playerScreenX, playerScreenY, currentRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Golden glowing ring along the iris edge
    if (currentRadius > 4) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(playerScreenX, playerScreenY, currentRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}
