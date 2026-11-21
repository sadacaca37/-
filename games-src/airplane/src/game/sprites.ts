import { Player, Enemy, Bullet, PowerUpItem, Particle, BombEffect } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STAGE_BG_IMAGES, ENEMY_SHIP_IMAGES, PLAYER_PLANE_IMAGES } from './constants';

export class SpriteRenderer {
  private static bgImageCache: Record<number, HTMLImageElement> = {};
  private static enemyImageCache: Record<string, HTMLImageElement> = {};
  private static playerImageCache: Record<string, HTMLImageElement> = {};
  private static transparentEnemyCache: Record<string, HTMLCanvasElement> = {};
  private static transparentPlayerCache: Record<string, HTMLCanvasElement> = {};
  private static imagesInitialized: boolean = false;
  private static enemyImagesInitialized: boolean = false;
  private static playerImagesInitialized: boolean = false;

  public static initBgImages() {
    if (this.imagesInitialized || typeof window === 'undefined') return;
    this.imagesInitialized = true;
    for (const [stageStr, src] of Object.entries(STAGE_BG_IMAGES)) {
      const stageNum = Number(stageStr);
      const img = new Image();
      img.src = src;
      this.bgImageCache[stageNum] = img;
    }
  }

  // Chroma-Key Image Processor to remove dark/black background into 100% transparent PNG
  private static processChromaKey(img: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const w = img.naturalWidth || img.width || 256;
    const h = img.naturalHeight || img.height || 256;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.drawImage(img, 0, 0, w, h);
    try {
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

        if (brightness < 32) {
          data[i + 3] = 0; // Pure transparent
        } else if (brightness < 68) {
          const alphaRatio = (brightness - 32) / 36;
          data[i + 3] = Math.round(data[i + 3] * alphaRatio);
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Fallback if cross-origin
    }
    return canvas;
  }

  public static initEnemyImages() {
    if (this.enemyImagesInitialized || typeof window === 'undefined') return;
    this.enemyImagesInitialized = true;
    for (const [key, src] of Object.entries(ENEMY_SHIP_IMAGES)) {
      const img = new Image();
      img.src = src;
      if (img.complete && img.naturalWidth > 0) {
        this.transparentEnemyCache[key] = this.processChromaKey(img);
      } else {
        img.onload = () => {
          this.transparentEnemyCache[key] = this.processChromaKey(img);
        };
      }
      this.enemyImageCache[key] = img;
    }
  }

  public static initPlayerImages() {
    if (this.playerImagesInitialized || typeof window === 'undefined') return;
    this.playerImagesInitialized = true;
    for (const [planeId, src] of Object.entries(PLAYER_PLANE_IMAGES)) {
      const img = new Image();
      img.src = src;
      if (img.complete && img.naturalWidth > 0) {
        this.transparentPlayerCache[planeId] = this.processChromaKey(img);
      } else {
        img.onload = () => {
          this.transparentPlayerCache[planeId] = this.processChromaKey(img);
        };
      }
      this.playerImageCache[planeId] = img;
    }
  }

  // Get or dynamically create transparent player canvas
  public static getProcessedPlayerImage(planeId: string): HTMLCanvasElement | HTMLImageElement | null {
    this.initPlayerImages();
    if (this.transparentPlayerCache[planeId]) {
      return this.transparentPlayerCache[planeId];
    }
    const rawImg = this.playerImageCache[planeId];
    if (rawImg && rawImg.complete && rawImg.naturalWidth > 0) {
      const processed = this.processChromaKey(rawImg);
      this.transparentPlayerCache[planeId] = processed;
      return processed;
    }
    return null;
  }

  // Get or dynamically create transparent enemy canvas
  public static getProcessedEnemyImage(key: string): HTMLCanvasElement | HTMLImageElement | null {
    this.initEnemyImages();
    if (this.transparentEnemyCache[key]) {
      return this.transparentEnemyCache[key];
    }
    const rawImg = this.enemyImageCache[key];
    if (rawImg && rawImg.complete && rawImg.naturalWidth > 0) {
      const processed = this.processChromaKey(rawImg);
      this.transparentEnemyCache[key] = processed;
      return processed;
    }
    return null;
  }

  // Draw Parallax Scrolling Retro World with 10 Distinct Level Backgrounds
  public static drawBackground(
    ctx: CanvasRenderingContext2D,
    stageNumber: number,
    theme: 'RAILWAY_FOREST' | 'OCEAN' | 'FORTRESS' | 'SUNSET_CLOUDS' | 'NIGHT_BASE',
    scrollOffset: number,
    time: number
  ) {
    this.initBgImages();
    const bgImg = this.bgImageCache[stageNumber];

    if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
      // Seamless Parallax Loop for Level Background Image
      const scrollY = (scrollOffset * 0.9) % CANVAS_HEIGHT;
      const y1 = scrollY - CANVAS_HEIGHT;
      const y2 = scrollY;

      ctx.save();
      // Draw 2 vertically stacked tiles
      ctx.drawImage(bgImg, 0, y1, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.drawImage(bgImg, 0, y2, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Subtle Atmospheric Overlay per Stage
      this.drawStageAtmosphere(ctx, stageNumber, scrollOffset, time);
      ctx.restore();
    } else {
      // Fallback Procedural Background
      this.drawProceduralFallback(ctx, theme, scrollOffset, time);
    }

    // High Altitude Cumulus Cloud Layer
    this.drawCloudLayer(ctx, scrollOffset, time);
  }

  // Atmospheric Overlay Effects for the 10 Stages
  private static drawStageAtmosphere(
    ctx: CanvasRenderingContext2D,
    stageNumber: number,
    scrollOffset: number,
    time: number
  ) {
    if (stageNumber === 1) {
      // Stage 1: 푸른 하늘 (Sunny Sky Glimmer & White Whisps)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 4; i++) {
        const cx = (i * 130 + time * 20) % (CANVAS_WIDTH + 100) - 50;
        const cy = ((i * 160 + scrollOffset * 0.4) % CANVAS_HEIGHT);
        ctx.beginPath();
        ctx.arc(cx, cy, 40 + i * 15, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (stageNumber === 2) {
      // Stage 2: 심해 군항 (Deep Teal Water Caustics)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.06)';
      const waveY = (scrollOffset * 0.6) % 60 - 60;
      for (let y = waveY; y < CANVAS_HEIGHT; y += 60) {
        for (let x = 20; x < CANVAS_WIDTH; x += 80) {
          const wx = x + Math.sin((y + time * 40) * 0.05) * 10;
          ctx.fillRect(wx, y, 30, 2);
        }
      }
    } else if (stageNumber === 3) {
      // Stage 3: 사막 유적 (Golden Sand Haze & Heat Distortion)
      ctx.fillStyle = 'rgba(234, 179, 8, 0.08)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
      for (let i = 0; i < 6; i++) {
        const sx = (i * 90 + Math.sin(time + i) * 30) % CANVAS_WIDTH;
        const sy = (scrollOffset * 1.2 + i * 120) % CANVAS_HEIGHT;
        ctx.fillRect(sx, sy, 60, 4);
      }
    } else if (stageNumber === 4) {
      // Stage 4: 화산 지대 (Volcanic Ash Sparks & Lava Glow)
      ctx.fillStyle = 'rgba(220, 38, 38, 0.12)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Floating lava embers
      for (let i = 0; i < 15; i++) {
        const emberX = (i * 35 + Math.sin(time * 3 + i) * 20) % CANVAS_WIDTH;
        const emberY = CANVAS_HEIGHT - ((scrollOffset * 1.5 + i * 50) % CANVAS_HEIGHT);
        ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#ef4444';
        ctx.fillRect(emberX, emberY, 3, 3);
      }
    } else if (stageNumber === 5) {
      // Stage 5: 미래 도시 (Cyber Neon Grid Lines & Scanlines)
      ctx.fillStyle = 'rgba(168, 85, 247, 0.06)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
      const netY = (scrollOffset * 1.8) % 80 - 80;
      for (let y = netY; y < CANVAS_HEIGHT; y += 80) {
        ctx.fillRect(0, y, CANVAS_WIDTH, 1);
      }
    } else if (stageNumber === 6) {
      // Stage 6: 우주 기지 (Deep Cosmos Starfield Twinkle)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.15)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      for (let i = 0; i < 20; i++) {
        const starX = (i * 27 + (i % 3) * 11) % CANVAS_WIDTH;
        const starY = (scrollOffset * 0.3 + i * 35) % CANVAS_HEIGHT;
        const twinkle = Math.sin(time * 6 + i) > 0 ? 0.9 : 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
        ctx.fillRect(starX, starY, 2, 2);
      }
    } else if (stageNumber === 7) {
      // Stage 7: 폭풍의 바다 (Storm Rain & Occasional Lightning Flash)
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      // Lightning flash
      if (Math.sin(time * 0.7) > 0.96) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
      // Rain streaks
      ctx.fillStyle = 'rgba(147, 197, 253, 0.3)';
      for (let i = 0; i < 25; i++) {
        const rx = (i * 22 + Math.sin(i) * 30) % CANVAS_WIDTH;
        const ry = (scrollOffset * 3.5 + i * 30) % CANVAS_HEIGHT;
        ctx.fillRect(rx, ry, 1, 14);
      }
    } else if (stageNumber === 8) {
      // Stage 8: 천공의 섬 (Ethereal Floating Mist & Golden God Rays)
      ctx.fillStyle = 'rgba(254, 240, 138, 0.08)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (stageNumber === 9) {
      // Stage 9: 빙하 협곡 (Glacier Frost Blizzard Flurries)
      ctx.fillStyle = 'rgba(224, 242, 254, 0.1)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      for (let i = 0; i < 20; i++) {
        const fx = (i * 26 + Math.cos(time * 2 + i) * 20) % CANVAS_WIDTH;
        const fy = (scrollOffset * 1.8 + i * 40) % CANVAS_HEIGHT;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(fx, fy, 2, 2);
      }
    } else if (stageNumber === 10) {
      // Stage 10: 외계 행성 (Nebula Violet Cosmic Aurora & Energy Flux)
      ctx.fillStyle = 'rgba(147, 51, 234, 0.12)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const auroraPulse = Math.sin(time * 2) * 0.1 + 0.15;
      ctx.fillStyle = `rgba(236, 72, 153, ${auroraPulse})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  // Fallback Procedural Background if images are loading
  private static drawProceduralFallback(
    ctx: CanvasRenderingContext2D,
    theme: 'RAILWAY_FOREST' | 'OCEAN' | 'FORTRESS' | 'SUNSET_CLOUDS' | 'NIGHT_BASE',
    scrollOffset: number,
    time: number
  ) {
    if (theme === 'RAILWAY_FOREST') {
      ctx.fillStyle = '#0f3d20';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.drawForestBorder(ctx, scrollOffset);
      this.drawRailwayDepots(ctx, scrollOffset);
    } else if (theme === 'OCEAN') {
      ctx.fillStyle = '#0f3860';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (theme === 'FORTRESS') {
      ctx.fillStyle = '#1a222d';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else if (theme === 'SUNSET_CLOUDS') {
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      grad.addColorStop(0, '#c2410c');
      grad.addColorStop(1, '#f97316');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  // Draw Dense Pine Forest on Flanks
  private static drawForestBorder(ctx: CanvasRenderingContext2D, scrollOffset: number) {
    const treeSpacing = 40;
    const treeBaseY = (scrollOffset * 1.2) % treeSpacing - treeSpacing;

    for (let y = treeBaseY; y < CANVAS_HEIGHT + 40; y += treeSpacing) {
      // Left side trees
      for (let x = 12; x < 160; x += 32) {
        const offset = ((x * 17) % 20);
        this.drawPineTree(ctx, x, y + offset);
      }
      // Right side trees
      for (let x = CANVAS_WIDTH - 160; x < CANVAS_WIDTH - 12; x += 32) {
        const offset = ((x * 19) % 20);
        this.drawPineTree(ctx, x, y + offset);
      }
    }
  }

  private static drawPineTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.save();
    // Tree shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(x + 6, y + 8, 12, 0, Math.PI * 2);
    ctx.fill();

    // Pine Canopy Layers (3 tier green cones)
    ctx.fillStyle = '#14532d';
    ctx.beginPath();
    ctx.arc(x, y + 4, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x - 2, y - 2, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Draw Hangars, Depots & Watchtowers
  private static drawRailwayDepots(ctx: CanvasRenderingContext2D, scrollOffset: number) {
    const depotSpacing = 500;
    const depotY = (scrollOffset * 1.5) % depotSpacing - depotSpacing;

    for (let y = depotY; y < CANVAS_HEIGHT; y += depotSpacing) {
      // Left Hangar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(30, y, 70, 50);
      ctx.fillStyle = '#475569';
      ctx.fillRect(34, y + 4, 62, 42);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(40, y + 44, 50, 4);

      // Right Fuel Silos
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 60, y + 20, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH - 62, y + 18, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw Procedural Sandy Island with Palm Trees and Runways
  private static drawIsland(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
    ctx.save();
    // Island Shadow on Water
    ctx.fillStyle = 'rgba(10, 30, 50, 0.45)';
    ctx.beginPath();
    ctx.ellipse(x + 14, y + 14, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sandy Shoreline (Tan)
    ctx.fillStyle = '#e2b36e';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lush Green Interior
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.ellipse(x, y, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Darker Jungle Core
    ctx.fillStyle = '#1b4332';
    ctx.beginPath();
    ctx.ellipse(x - 6, y - 6, w * 0.28, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Airbase Runway Strip
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 12, y - h * 0.35, 24, h * 0.7);
    ctx.fillStyle = '#ffffff';
    for (let ry = y - h * 0.3; ry < y + h * 0.3; ry += 20) {
      ctx.fillRect(x - 2, ry, 4, 10);
    }

    ctx.restore();
  }

  // High altitude clouds
  private static drawCloudLayer(ctx: CanvasRenderingContext2D, scrollOffset: number, time: number) {
    ctx.save();
    const cloudSpeed = scrollOffset * 2.2;
    const spacing = 450;
    const baseY = (cloudSpeed) % spacing - spacing;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let y = baseY; y < CANVAS_HEIGHT + 100; y += spacing) {
      const cx = 140 + Math.sin(y * 0.01) * 80;
      ctx.beginPath();
      ctx.arc(cx, y, 65, 0, Math.PI * 2);
      ctx.arc(cx + 50, y + 10, 75, 0, Math.PI * 2);
      ctx.arc(cx - 40, y + 15, 55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Player Aircraft (P-38, Spitfire, Zero, Shinden)
  // -------------------------------------------------------------
  public static drawPlayer(ctx: CanvasRenderingContext2D, player: Player, time: number) {
    ctx.save();

    // Invincibility Blinking
    if (player.isInvincible && Math.floor(time * 25) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Loop-the-loop Evasion 360 Roll Animation
    let scale = 1.0;
    let rotationY = 0;
    if (player.isLooping) {
      // In loop: plane zooms up, flips, and lands back down
      const progress = player.loopProgress; // 0 to 1
      scale = 1.0 + Math.sin(progress * Math.PI) * 0.75;
      rotationY = progress * Math.PI * 2;
    }

    // Shadow projected below player on ocean/ground
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    const shadowDist = 28 * scale;
    ctx.translate(player.x + shadowDist * 0.5, player.y + shadowDist);
    ctx.scale(scale * 0.9, scale * 0.9);
    this.renderPlaneSprite(ctx, player.planeId, player.tilt, player.propellerAngle, true);
    ctx.restore();

    // Main Plane Body
    ctx.translate(player.x, player.y);
    ctx.scale(scale, scale);
    if (player.isLooping) {
      // Visual pitch flip for loop-the-loop
      ctx.scale(1, Math.cos(rotationY));
    }

    this.renderPlaneSprite(ctx, player.planeId, player.tilt, player.propellerAngle, false);

    // Jet / Engine Exhaust Flame
    const flameSize = 4 + Math.sin(time * 40) * 3;
    if (player.planeId === 'AV8_HARRIER') {
      // VTOL Side + Rear Thrusters
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-18, 4, 3, flameSize * 0.8);
      ctx.fillRect(15, 4, 3, flameSize * 0.8);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3, 18, 6, flameSize * 1.2);
    } else if (player.planeId === 'F4_PHANTOM') {
      // Twin Heavy J79 Turbojet Exhausts
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-7, 18, 5, flameSize * 1.3);
      ctx.fillRect(2, 18, 5, flameSize * 1.3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-5, 18, 2, flameSize * 0.7);
      ctx.fillRect(4, 18, 2, flameSize * 0.7);
    } else if (player.planeId === 'FA18_SUPER_HORNET') {
      // Twin Afterburners
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, 18, 4, flameSize * 1.2);
      ctx.fillRect(2, 18, 4, flameSize * 1.2);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-5, 20, 2, flameSize * 0.6);
      ctx.fillRect(3, 20, 2, flameSize * 0.6);
    } else if (player.planeId === 'F117_NIGHTHAWK') {
      // Slit Platypus Stealth Plasma Trail
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-8, 16, 16, 3 + Math.sin(time * 30) * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fillRect(-4, 18, 8, 2);
    } else if (player.planeId === 'X36') {
      // Hypersonic Experimental Dual Thruster
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-6, 18, 4, flameSize * 1.5);
      ctx.fillRect(2, 18, 4, flameSize * 1.5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-5, 19, 2, flameSize * 0.9);
      ctx.fillRect(3, 19, 2, flameSize * 0.9);
    } else {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-3, 18, 6, flameSize);
    }

    ctx.restore();

    // Draw Escort Sub-Drones (Options)
    if (player.options > 0) {
      for (let i = 0; i < player.options; i++) {
        const side = i === 0 ? -1 : 1;
        const optX = player.x + side * (32 + Math.sin(time * 8) * 4);
        const optY = player.y + 12 + Math.cos(time * 8 + i) * 4;

        ctx.save();
        ctx.translate(optX, optY);
        // Drone Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(6, 12, 12, 14);

        // Drone Body (Futuristic Mini-Fighter)
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(8, 6);
        ctx.lineTo(0, 4);
        ctx.lineTo(-8, 6);
        ctx.closePath();
        ctx.fill();

        // Glowing core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -2, 4, 4);

        // Mini thruster
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-1, 5, 2, 4 + Math.sin(time * 30) * 2);
        ctx.restore();
      }
    }

    // Player Identification Tag (1P in Amber/Cyan, 2P in Crimson/Emerald)
    ctx.save();
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const tagText = player.playerNumber === 2 ? '2P' : '1P';
    const tagColor = player.playerNumber === 2 ? '#ef4444' : '#38bdf8';
    const tagBg = player.playerNumber === 2 ? 'rgba(153, 27, 27, 0.85)' : 'rgba(12, 74, 110, 0.85)';
    
    // Mini Tag Background Pill
    ctx.fillStyle = tagBg;
    ctx.fillRect(player.x - 12, player.y - 28, 24, 12);
    ctx.strokeStyle = tagColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x - 12, player.y - 28, 24, 12);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, player.x, player.y - 19);
    ctx.restore();
  }

  // Public Preview Renderer for Hangar Selection UI
  public static drawPlanePreview(
    ctx: CanvasRenderingContext2D,
    planeId: string,
    width: number,
    height: number,
    scale: number = 1.6
  ) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);

    // Subtle Shadow
    ctx.save();
    ctx.translate(3, 4);
    this.renderPlaneSprite(ctx, planeId, 0, 0, true);
    ctx.restore();

    // Plane Body
    this.renderPlaneSprite(ctx, planeId, 0, 0, false);

    // Subtle Preview Flame
    if (planeId === 'F117_NIGHTHAWK') {
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-7, 16, 14, 3);
    } else if (
      planeId === 'F4_PHANTOM' ||
      planeId === 'FA18_SUPER_HORNET' ||
      planeId === 'X36'
    ) {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-7, 18, 4, 4);
      ctx.fillRect(3, 18, 4, 4);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-3, 18, 6, 4);
    }

    ctx.restore();
  }

  // Pure 16-Bit Pixel Plane Sprite Renderer for the Fighter Designs
  public static renderPlaneSprite(
    ctx: CanvasRenderingContext2D,
    planeId: string,
    tilt: number,
    propAngle: number,
    isShadow: boolean
  ) {
    const playerImg = this.getProcessedPlayerImage(planeId);
    if (playerImg) {
      if (isShadow) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      const size = 52;
      ctx.save();
      ctx.rotate(tilt * 0.15);
      ctx.drawImage(playerImg, -size / 2, -size / 2, size, size);
      ctx.restore();
      return;
    }

    if (isShadow) {
      ctx.fillStyle = '#000000';
    }

    if (planeId === 'AV8_HARRIER') {
      // 1. PHOENIX STRIKE (AV-8 Harrier VTOL - Orange & Pure White)
      const baseOrange = isShadow ? '#000000' : '#f97316'; // Vivid Phoenix Orange
      const pureWhite = isShadow ? '#000000' : '#ffffff';  // Crisp White fuselage
      const goldTrim = isShadow ? '#000000' : '#fbbf24';   // Gold accents
      const darkGrey = isShadow ? '#000000' : '#1e293b';

      // Swept Anhedral Wings
      ctx.fillStyle = baseOrange;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(26, 4);
      ctx.lineTo(24, 11);
      ctx.lineTo(6, 6);
      ctx.lineTo(-6, 6);
      ctx.lineTo(-24, 11);
      ctx.lineTo(-26, 4);
      ctx.closePath();
      ctx.fill();

      // Wing White Racing Stripes
      ctx.fillStyle = pureWhite;
      ctx.fillRect(-22, 5, 8, 4);
      ctx.fillRect(14, 5, 8, 4);
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-14, 3, 3, 7);
      ctx.fillRect(11, 3, 3, 7);

      // Fuselage Body
      ctx.fillStyle = pureWhite;
      ctx.fillRect(-6, -18, 12, 36);
      ctx.fillStyle = baseOrange;
      ctx.fillRect(-4, -14, 8, 26);

      // VTOL Side Exhaust Nozzles
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-9, -4, 3, 4);
      ctx.fillRect(-9, 4, 3, 4);
      ctx.fillRect(6, -4, 3, 4);
      ctx.fillRect(6, 4, 3, 4);

      // Aerodynamic Nose Cone
      ctx.fillStyle = baseOrange;
      ctx.beginPath();
      ctx.moveTo(-5, -16);
      ctx.lineTo(0, -22);
      ctx.lineTo(5, -16);
      ctx.closePath();
      ctx.fill();

      // Horizontal Stabilizers
      ctx.fillStyle = baseOrange;
      ctx.fillRect(-13, 14, 26, 4);

      // Bubble Cockpit
      ctx.fillStyle = isShadow ? '#000000' : '#38bdf8';
      ctx.fillRect(-3, -12, 6, 9);
      ctx.fillStyle = isShadow ? '#000000' : '#ffffff';
      ctx.fillRect(-2, -10, 2, 4);

    } else if (planeId === 'F4_PHANTOM') {
      // 2. F-4 PHANTOM II (Heavy Supersonic Fighter, Light Grey with Red Stripe)
      const baseGrey = isShadow ? '#000000' : '#cbd5e1'; // Light grey
      const darkGrey = isShadow ? '#000000' : '#64748b';
      const redStripe = isShadow ? '#000000' : '#ef4444'; // Red stripe
      const radomeBlack = isShadow ? '#000000' : '#1e293b';

      // Broad Swept Delta Wings with Outer Wing Dihedral (Upswept Wingtips)
      ctx.fillStyle = baseGrey;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(26, 7);
      ctx.lineTo(24, 13);
      ctx.lineTo(7, 10);
      ctx.lineTo(-7, 10);
      ctx.lineTo(-24, 13);
      ctx.lineTo(-26, 7);
      ctx.closePath();
      ctx.fill();

      // Wingtip Dihedral Panels (Upswept visual angle)
      ctx.fillStyle = darkGrey;
      ctx.fillRect(-26, 6, 6, 6);
      ctx.fillRect(20, 6, 6, 6);

      // Fuselage Body
      ctx.fillStyle = baseGrey;
      ctx.fillRect(-6, -18, 12, 36);

      // Center Fuselage Red Stripe Marking
      ctx.fillStyle = redStripe;
      ctx.fillRect(-5, -4, 10, 4);
      ctx.fillRect(-20, 8, 4, 3);
      ctx.fillRect(16, 8, 4, 3);

      // Large Sharp Radome Nose
      ctx.fillStyle = radomeBlack;
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.lineTo(0, -24);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();

      // Iconic Anhedral Tailplanes (Slanted Downwards)
      ctx.fillStyle = darkGrey;
      ctx.beginPath();
      ctx.moveTo(-16, 17);
      ctx.lineTo(0, 13);
      ctx.lineTo(16, 17);
      ctx.lineTo(14, 21);
      ctx.lineTo(-14, 21);
      ctx.closePath();
      ctx.fill();

      // Tandem Two-Seat Cockpit
      ctx.fillStyle = isShadow ? '#000000' : '#38bdf8';
      ctx.fillRect(-3, -14, 6, 6); // Pilot
      ctx.fillRect(-3, -6, 6, 5);  // WSO / RIO
      ctx.fillStyle = isShadow ? '#000000' : '#ffffff';
      ctx.fillRect(-2, -13, 2, 2);

      // Dual Air Intake Spikes
      ctx.fillStyle = darkGrey;
      ctx.fillRect(-8, -10, 2, 12);
      ctx.fillRect(6, -10, 2, 12);

    } else if (planeId === 'FA18_SUPER_HORNET') {
      // 3. FA-18E SUPER HORNET (Navy Blue / Steel Blue Carrier Ace)
      const navyBlue = isShadow ? '#000000' : '#0284c7';
      const lightBlue = isShadow ? '#000000' : '#38bdf8';
      const darkNavy = isShadow ? '#000000' : '#0f172a';
      const orangeAccent = isShadow ? '#000000' : '#f97316';

      // Curved Leading Edge Root Extensions (LEX) + Trapezoidal Wings
      ctx.fillStyle = lightBlue;
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(6, -4);
      ctx.lineTo(25, 4);
      ctx.lineTo(24, 11);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-24, 11);
      ctx.lineTo(-25, 4);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();

      // Wingtip Sidewinder Missiles
      ctx.fillStyle = orangeAccent;
      ctx.fillRect(-26, 2, 2, 10);
      ctx.fillRect(24, 2, 2, 10);

      // Center Fuselage
      ctx.fillStyle = navyBlue;
      ctx.fillRect(-5, -18, 10, 36);
      ctx.fillStyle = lightBlue;
      ctx.fillRect(-3, -14, 6, 24);

      // Sharp Nose
      ctx.fillStyle = darkNavy;
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.lineTo(0, -24);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();

      // Canted Twin Vertical Stabilizers (Angled outwards)
      ctx.fillStyle = navyBlue;
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.lineTo(-12, 18);
      ctx.lineTo(-7, 18);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(5, 6);
      ctx.lineTo(7, 18);
      ctx.lineTo(12, 18);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.fill();

      // Tail Stabilizers
      ctx.fillStyle = darkNavy;
      ctx.fillRect(-15, 15, 30, 3);

      // Bubble Canopy
      ctx.fillStyle = isShadow ? '#000000' : '#e0f2fe';
      ctx.fillRect(-3, -12, 6, 9);
      ctx.fillStyle = isShadow ? '#000000' : '#ffffff';
      ctx.fillRect(-2, -10, 2, 3);

    } else if (planeId === 'F117_NIGHTHAWK') {
      // 4. F-117 NIGHTHAWK (Stealth Diamond Faceted Fighter)
      const stealthBlack = isShadow ? '#000000' : '#0f172a';
      const facetDark = isShadow ? '#000000' : '#1e293b';
      const facetMid = isShadow ? '#000000' : '#334155';
      const cyanGlow = isShadow ? '#000000' : '#06b6d4';
      const goldCanopy = isShadow ? '#000000' : '#fbbf24';

      // Faceted Arrowhead / Diamond Stealth Geometry
      ctx.fillStyle = facetDark;
      ctx.beginPath();
      ctx.moveTo(0, -23); // Nose tip
      ctx.lineTo(26, 12); // Right wingtip
      ctx.lineTo(14, 14);
      ctx.lineTo(0, 19);  // Tail notch
      ctx.lineTo(-14, 14);
      ctx.lineTo(-26, 12); // Left wingtip
      ctx.closePath();
      ctx.fill();

      // Diamond Facet Shading on Wings
      ctx.fillStyle = facetMid;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(18, 8);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = stealthBlack;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(-18, 8);
      ctx.lineTo(0, 5);
      ctx.closePath();
      ctx.fill();

      // Central Faceted Ridge
      ctx.fillStyle = facetDark;
      ctx.fillRect(-4, -14, 8, 24);

      // V-Tail Fins (Canted outward)
      ctx.fillStyle = facetMid;
      ctx.fillRect(-7, 10, 3, 8);
      ctx.fillRect(4, 10, 3, 8);

      // Slit Platypus Stealth Exhaust Glow
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(-8, 16, 16, 2);

      // Faceted Gold Pyramid Canopy
      ctx.fillStyle = goldCanopy;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(3, -6);
      ctx.lineTo(-3, -6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isShadow ? '#000000' : '#ffffff';
      ctx.fillRect(-1, -10, 2, 2);

    } else if (planeId === 'F22_RAPTOR') {
      // 5. F-22 RAPTOR (5th Gen Stealth Air Superiority, Silver Titanium)
      const stealthSilver = isShadow ? '#000000' : '#94a3b8';
      const darkTitanium = isShadow ? '#000000' : '#475569';
      const lightEdge = isShadow ? '#000000' : '#cbd5e1';
      const goldCanopy = isShadow ? '#000000' : '#f59e0b';
      const cyanAccent = isShadow ? '#000000' : '#38bdf8';

      // Clipped Diamond Delta Wings
      ctx.fillStyle = darkTitanium;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(26, 6);
      ctx.lineTo(18, 13);
      ctx.lineTo(6, 11);
      ctx.lineTo(-6, 11);
      ctx.lineTo(-18, 13);
      ctx.lineTo(-26, 6);
      ctx.closePath();
      ctx.fill();

      // Wing Leading Edge Radar Absorbent Trim
      ctx.fillStyle = lightEdge;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(26, 6);
      ctx.lineTo(24, 7);
      ctx.lineTo(0, -12);
      ctx.lineTo(-24, 7);
      ctx.lineTo(-26, 6);
      ctx.closePath();
      ctx.fill();

      // Blended Chined Fuselage
      ctx.fillStyle = stealthSilver;
      ctx.fillRect(-6, -18, 12, 36);
      ctx.fillStyle = lightEdge;
      ctx.fillRect(-4, -14, 8, 24);

      // Stealth Nose Cone
      ctx.fillStyle = darkTitanium;
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.lineTo(0, -24);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();

      // Canted Stealth Vertical Twin Fins
      ctx.fillStyle = darkTitanium;
      ctx.beginPath();
      ctx.moveTo(-7, 6);
      ctx.lineTo(-11, 18);
      ctx.lineTo(-6, 18);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.lineTo(6, 18);
      ctx.lineTo(11, 18);
      ctx.lineTo(7, 6);
      ctx.closePath();
      ctx.fill();

      // 2D Vectoring Thrust Nozzle Trim
      ctx.fillStyle = cyanAccent;
      ctx.fillRect(-7, 17, 5, 2);
      ctx.fillRect(2, 17, 5, 2);

      // Gold Tinted Stealth Canopy
      ctx.fillStyle = goldCanopy;
      ctx.fillRect(-3, -12, 6, 8);
      ctx.fillStyle = isShadow ? '#000000' : '#ffffff';
      ctx.fillRect(-2, -10, 2, 3);

    } else if (planeId === 'VIOLET_SERAPH') {
      // 7. VIOLET SERAPH (Royal Purple & White, Heart Wings Interceptor)
      const royalPurple = isShadow ? '#000000' : '#9333ea';
      const brightViolet = isShadow ? '#000000' : '#c084fc';
      const pureWhite = isShadow ? '#000000' : '#ffffff';
      const pinkGlow = isShadow ? '#000000' : '#f472b6';

      // Seraph Wing Blades
      ctx.fillStyle = royalPurple;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(28, 4);
      ctx.lineTo(22, 14);
      ctx.lineTo(6, 12);
      ctx.lineTo(-6, 12);
      ctx.lineTo(-22, 14);
      ctx.lineTo(-28, 4);
      ctx.closePath();
      ctx.fill();

      // Violet Trim
      ctx.fillStyle = brightViolet;
      ctx.fillRect(-20, 4, 8, 4);
      ctx.fillRect(12, 4, 8, 4);

      // Fuselage Body
      ctx.fillStyle = pureWhite;
      ctx.fillRect(-6, -18, 12, 34);

      // Heart Insignia Centerpiece
      ctx.fillStyle = pinkGlow;
      ctx.fillRect(-3, -2, 6, 6);

      // Golden Canopy
      ctx.fillStyle = isShadow ? '#000000' : '#eab308';
      ctx.fillRect(-3, -12, 6, 8);
    } else {
      // 6. BOEING X-36 (Black & Gold Titan / Experimental Tailless)
      const pureWhite = isShadow ? '#000000' : '#f8fafc';
      const goldTrim = isShadow ? '#000000' : '#eab308';
      const darkChassis = isShadow ? '#000000' : '#1e293b';

      // Cranked Modified Tailless Delta Wings (No Vertical Tail!)
      ctx.fillStyle = goldTrim;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(26, 8);
      ctx.lineTo(20, 16);
      ctx.lineTo(6, 14);
      ctx.lineTo(-6, 14);
      ctx.lineTo(-20, 16);
      ctx.lineTo(-26, 8);
      ctx.closePath();
      ctx.fill();

      // Dark Inner Wing Aerodynamics
      ctx.fillStyle = darkChassis;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(20, 7);
      ctx.lineTo(16, 13);
      ctx.lineTo(0, 12);
      ctx.lineTo(-16, 13);
      ctx.lineTo(-20, 7);
      ctx.closePath();
      ctx.fill();

      // Forward Canard Foreplanes with Gold Trim
      ctx.fillStyle = goldTrim;
      ctx.beginPath();
      ctx.moveTo(-16, -14);
      ctx.lineTo(16, -14);
      ctx.lineTo(12, -10);
      ctx.lineTo(-12, -10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = pureWhite;
      ctx.fillRect(-10, -13, 20, 3);

      // Futuristic Chined Fuselage
      ctx.fillStyle = darkChassis;
      ctx.fillRect(-6, -18, 12, 34);

      // Gold Chevron Racing Stripes
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-4, -4, 8, 3);
      ctx.fillRect(-3, 2, 6, 2);

      // Sleek Experimental Nose
      ctx.fillStyle = pureWhite;
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.lineTo(0, -24);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();

      // Golden Experimental Canopy
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-3, -12, 6, 8);
      ctx.fillStyle = isShadow ? '#000000' : '#ffffff';
      ctx.fillRect(-2, -10, 2, 3);

      // Tailless Thrust Vectoring Exhaust Plate
      ctx.fillStyle = goldTrim;
      ctx.fillRect(-6, 16, 12, 2);
    }
  }

  // -------------------------------------------------------------
  // Draw Enemy Planes, Gunboats, and Bosses with Visual Image Sprites
  // -------------------------------------------------------------
  public static drawEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    this.initEnemyImages();

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    if (enemy.isBoss) {
      this.drawBoss(ctx, enemy, time);
      ctx.restore();
      return;
    }

    // Ground / Sea unit vs Airborne unit
    if (enemy.type === 'GUNBOAT' || enemy.type === 'BATTLESHIP' || enemy.type === 'ISLAND_TURRET') {
      ctx.rotate(enemy.rotation);
      this.drawGroundOrSeaEnemy(ctx, enemy, time);
      ctx.restore();
      return;
    }

    // Enemy planes face DOWNWARDS (Math.PI / 180 degrees) toward the player
    ctx.rotate(enemy.rotation + Math.PI);

    // 1. Soft Aircraft Shadow below plane
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(12, 16, enemy.width * 0.45, enemy.height * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Animated Jet Engine Thruster Flames (Rear afterburners shooting upward behind the enemy)
    this.drawEnemyThrusterFlames(ctx, enemy, time);

    // 3. Render High-Detail Image Sprite (Transparent PNG without black background)
    const imgKey = this.getEnemyImageKey(enemy);
    const transparentSprite = imgKey ? this.getProcessedEnemyImage(imgKey) : null;

    if (transparentSprite) {
      ctx.save();
      const w = enemy.width;
      const h = enemy.height;
      
      // Draw transparent image centered
      ctx.drawImage(transparentSprite, -w / 2, -h / 2, w, h);

      // Hit flash overlay when taking damage
      if (enemy.hp < enemy.maxHp) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(w, h) * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // High-Fidelity Procedural Fallback Sprite
      this.drawProceduralEnemyFallback(ctx, enemy, time);
    }

    ctx.restore();
  }

  // Determine Sprite Image Key per Enemy Class and Stage progression
  private static getEnemyImageKey(enemy: Enemy): string | null {
    if (enemy.spriteKey) return enemy.spriteKey;
    const stage = enemy.stageIndex !== undefined ? enemy.stageIndex : 0;
    const type = enemy.type;

    if (stage >= 5) {
      // High-tier space stages: advanced spacecraft armada
      if (type === 'SCOUT_GREEN') return 'BOSS_BLUE_CRESCENT';
      if (type === 'SCOUT_ORANGE') return 'BOSS_GREEN_SAUCER';
      if (type === 'SCOUT_DART') return 'BOSS_BLUE_CRESCENT';
      if (type === 'FIGHTER_RED') return 'BOSS_RED_THRUSTER';
      if (type === 'STEALTH_JET') return 'BOSS_PURPLE_VOID';
      if (type === 'HEAVY_BOMBER') return 'BOSS_RED_ORB';
    } else if (stage >= 2) {
      // Mid stages: mix of heavy alien and combat spacecraft
      if (type === 'SCOUT_GREEN') return 'SMALL_JET';
      if (type === 'SCOUT_ORANGE') return 'GOLD_FIGHTER';
      if (type === 'SCOUT_DART') return 'SMALL_JET';
      if (type === 'FIGHTER_RED') return 'RED_FIGHTER';
      if (type === 'STEALTH_JET') return 'BOSS_BLUE_CRESCENT';
      if (type === 'HEAVY_BOMBER') return 'HEAVY_CARRIER';
    } else {
      // Early stages
      if (type === 'SCOUT_GREEN') return 'SMALL_JET';
      if (type === 'SCOUT_ORANGE') return 'GOLD_FIGHTER';
      if (type === 'SCOUT_DART') return 'SMALL_JET';
      if (type === 'FIGHTER_RED') return 'RED_FIGHTER';
      if (type === 'STEALTH_JET') return 'ALIEN_VOID';
      if (type === 'HEAVY_BOMBER') return 'HEAVY_CARRIER';
    }
    return null;
  }

  // Draw Animated Plasma Thruster Flames
  private static drawEnemyThrusterFlames(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    const isHeavy = enemy.type === 'HEAVY_BOMBER';
    const flameLen = (isHeavy ? 14 : 8) + Math.sin(time * 28 + Number(enemy.id.replace(/\D/g, ''))) * 4;

    ctx.save();
    if (enemy.type === 'SCOUT_GREEN' || enemy.type === 'STEALTH_JET') {
      // Cyan / Blue Plasma
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.fillRect(-4, -enemy.height / 2 - flameLen, 8, flameLen);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -enemy.height / 2 - flameLen * 0.6, 4, flameLen * 0.6);
    } else if (enemy.type === 'SCOUT_ORANGE' || enemy.type === 'FIGHTER_RED') {
      // Twin Orange / Yellow Exhaust
      const offsets = [-enemy.width * 0.22, enemy.width * 0.22];
      offsets.forEach((ox) => {
        ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
        ctx.fillRect(ox - 3, -enemy.height / 2 - flameLen, 6, flameLen);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(ox - 1.5, -enemy.height / 2 - flameLen * 0.5, 3, flameLen * 0.5);
      });
    } else if (isHeavy) {
      // 4 Heavy Engine Pods
      const enginePods = [-28, -10, 10, 28];
      enginePods.forEach((ex) => {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.85)';
        ctx.fillRect(ex - 3, -enemy.height / 2 - flameLen, 6, flameLen);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ex - 1.5, -enemy.height / 2 - flameLen * 0.5, 3, flameLen * 0.5);
      });
    }
    ctx.restore();
  }

  // High-Fidelity Procedural Fallback
  private static drawProceduralEnemyFallback(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    if (enemy.type === 'SCOUT_GREEN') {
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-16, -3, 32, 6);
      ctx.fillRect(-5, -14, 10, 28);
      ctx.fillStyle = '#bbf7d0';
      ctx.fillRect(-3, -8, 6, 6);
    } else if (enemy.type === 'SCOUT_ORANGE') {
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(-20, -4, 40, 8);
      ctx.fillRect(-6, -16, 12, 32);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(-3, -10, 6, 6);
    } else if (enemy.type === 'FIGHTER_RED') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-24, -5, 48, 10);
      ctx.fillRect(-7, -18, 14, 36);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, -12, 8, 8);
    } else if (enemy.type === 'HEAVY_BOMBER') {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(-42, -10, 84, 20);
      ctx.fillRect(-14, -32, 28, 64);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-8, -26, 16, 52);
    } else if (enemy.type === 'STEALTH_JET') {
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(26, -16);
      ctx.lineTo(0, -10);
      ctx.lineTo(-26, -16);
      ctx.closePath();
      ctx.fill();
    } else if (enemy.type === 'SCOUT_DART') {
      // High-speed Dart Interceptor: Needle wing profile with glowing cyan accents
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(16, -18);
      ctx.lineTo(4, -14);
      ctx.lineTo(0, -20);
      ctx.lineTo(-4, -14);
      ctx.lineTo(-16, -18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-2, -8, 4, 16);
    }
  }

  // Draw Sea & Ground Targets (Gunboats, Island Turrets, Ground Artillery)
  private static drawGroundOrSeaEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, time: number) {
    if (enemy.type === 'GUNBOAT' || enemy.type === 'BATTLESHIP') {
      // Steel Gunboat with water wake
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.fillRect(-14, enemy.height * 0.4, 28, 10);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-18, -26, 36, 52);
      ctx.fillStyle = '#475569';
      ctx.fillRect(-14, -22, 28, 44);

      // Rotating Heavy Gun Turret
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -4, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#020617';
      ctx.fillRect(-2, -20, 4, 16);
    } else if (enemy.type === 'ISLAND_TURRET') {
      // Concrete Bunker Fortress Battery
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Twin Heavy Gun Barrels
      ctx.fillStyle = '#020617';
      ctx.fillRect(-5, -22, 3, 16);
      ctx.fillRect(2, -22, 3, 16);
    } else if (enemy.type === 'GROUND_ARTILLERY') {
      // Heavy Reinforced Hexagonal Ground Artillery Emplacement
      ctx.save();
      // Concrete reinforced bunker base
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      for (let a = 0; a < 6; a++) {
        const rad = (Math.PI / 3) * a;
        const hx = Math.cos(rad) * 28;
        const hy = Math.sin(rad) * 28;
        if (a === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner armored ring & hazard stripes
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Howitzer Artillery Cannons pointing towards player
      ctx.rotate(enemy.rotation || 0);
      ctx.fillStyle = '#020617';
      // Twin long-range rifled cannon barrels
      ctx.fillRect(-6, -32, 4, 24);
      ctx.fillRect(2, -32, 4, 24);
      // Muzzle brakes
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-7, -34, 6, 4);
      ctx.fillRect(1, -34, 6, 4);
      // Main central recoil mantlet
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-3, -8, 6, 4);
      ctx.restore();
    }
  }

  // -------------------------------------------------------------
  // Draw Massive Multi-Phase Bosses & Giant Space Dreadnought Motherships (10 Stages)
  // -------------------------------------------------------------
  public static drawBoss(ctx: CanvasRenderingContext2D, boss: Enemy, time: number) {
    const w = boss.width;
    const h = boss.height;
    const hpRatio = Math.max(0, boss.hp / boss.maxHp);
    const isEnraged = hpRatio < 0.4;

    // 1. Giant Mothership Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.ellipse(20, 28, w * 0.52, h * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Boss Multi-Thruster Mega Plasma Flames (Shooting upward behind the mothership)
    this.drawBossThrusterFlames(ctx, boss, time);

    // 3. Boss Dreadnought Mothership Body (Inverted to face downward towards player)
    let bossSpriteKey = 'BOSS_RED_THRUSTER';
    if (boss.type === 'BOSS_STAGE_1') {
      bossSpriteKey = 'BOSS_RED_THRUSTER';
    } else if (boss.type === 'BOSS_STAGE_2') {
      bossSpriteKey = 'BOSS_BLUE_CRESCENT';
    } else if (boss.type === 'BOSS_STAGE_3') {
      bossSpriteKey = 'BOSS_GREEN_SAUCER';
    } else if (boss.type === 'BOSS_STAGE_4') {
      bossSpriteKey = 'BOSS_RED_THRUSTER';
    } else if (boss.type === 'BOSS_STAGE_5') {
      bossSpriteKey = 'BOSS_BLUE_CRESCENT';
    } else if (boss.type === 'BOSS_STAGE_6') {
      bossSpriteKey = 'BOSS_RED_ORB';
    } else if (boss.type === 'BOSS_STAGE_7') {
      bossSpriteKey = 'BOSS_PURPLE_VOID';
    } else if (boss.type === 'BOSS_STAGE_8') {
      bossSpriteKey = 'BOSS_GREEN_SAUCER';
    } else if (boss.type === 'BOSS_STAGE_9') {
      bossSpriteKey = 'BOSS_RED_THRUSTER';
    } else if (boss.type === 'BOSS_STAGE_10') {
      bossSpriteKey = 'BOSS_PURPLE_VOID';
    }

    const bossSprite =
      this.getProcessedEnemyImage(bossSpriteKey) ||
      this.getProcessedEnemyImage('BOSS_CARRIER') ||
      this.getProcessedEnemyImage('HEAVY_CARRIER') ||
      this.getProcessedEnemyImage('ALIEN_VOID');

    ctx.save();
    // Rotate 180 degrees (Math.PI) so the menacing prow and forward plasma bays face the player
    ctx.rotate(Math.PI);

    if (bossSprite) {
      ctx.drawImage(bossSprite, -w / 2, -h / 2, w, h);
    } else {
      // High-Tech Cyber Dreadnought Fallback
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.48);
      ctx.lineTo(w * 0.45, h * 0.15);
      ctx.lineTo(w * 0.48, -h * 0.4);
      ctx.lineTo(w * 0.2, -h * 0.48);
      ctx.lineTo(-w * 0.2, -h * 0.48);
      ctx.lineTo(-w * 0.48, -h * 0.4);
      ctx.lineTo(-w * 0.45, h * 0.15);
      ctx.closePath();
      ctx.fill();

      // Armor plating
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-w * 0.35, -h * 0.35, w * 0.7, h * 0.7);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-w * 0.25, -h * 0.25, w * 0.5, h * 0.5);
    }

    // Glowing Hyperspace Reactor Core in the center of the mothership
    const corePulse = Math.sin(time * 8) * 0.2 + 0.8;
    ctx.fillStyle = isEnraged ? `rgba(239, 68, 68, ${corePulse})` : `rgba(56, 189, 248, ${corePulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    // Flight deck / Launch bay hazard lights
    ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.fillRect(-8, -h * 0.3, 16, h * 0.6);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.3);
    ctx.lineTo(0, h * 0.3);
    ctx.stroke();

    ctx.restore(); // Restore from rotation

    // 4. Battle Damage Visual FX (Smoke & Electrical Sparks at low HP)
    if (hpRatio < 0.75) {
      // Smoking Engines
      ctx.fillStyle = 'rgba(71, 85, 105, 0.6)';
      const smokeOffset = Math.sin(time * 15) * 6;
      ctx.beginPath();
      ctx.arc(-w * 0.25 + smokeOffset, -h * 0.15, 12, 0, Math.PI * 2);
      ctx.arc(w * 0.25 - smokeOffset, -h * 0.15, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    if (hpRatio < 0.4) {
      // Fiery bursts & electrical arcing
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-w * 0.18 + Math.sin(time * 30) * 4, -h * 0.2, 8, 8);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(w * 0.2 + Math.cos(time * 30) * 4, -h * 0.1, 7, 7);
    }

    // 5. Enraged Energy Shield Aura (<40% HP)
    if (isEnraged) {
      const shieldPulse = Math.sin(time * 12) * 0.2 + 0.4;
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${shieldPulse})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(w, h) * 0.55, 0, Math.PI * 2);
      ctx.stroke();
      // Outer ripple
      ctx.strokeStyle = `rgba(251, 191, 36, ${shieldPulse * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(w, h) * 0.58 + Math.sin(time * 15) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Destructible Multi-Turrets & Cannons
    if (boss.parts) {
      boss.parts.forEach((part) => {
        if (part.isDestroyed) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(part.offsetX - 12, part.offsetY - 12, 24, 24);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(part.offsetX - 5, part.offsetY - 5, 10, 10);
        } else {
          ctx.save();
          ctx.translate(part.offsetX, part.offsetY);
          ctx.rotate(part.angle);

          // Heavy Turret Base Armor
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();

          // Triple Plasma / Railgun Barrels
          ctx.fillStyle = '#020617';
          ctx.fillRect(-6, 0, 3, 24);
          ctx.fillRect(-1, 0, 3, 26);
          ctx.fillRect(4, 0, 3, 24);

          // Glowing Muzzle Charging Energy
          ctx.fillStyle = isEnraged ? '#ef4444' : '#eab308';
          ctx.fillRect(-7, 22, 5, 3);
          ctx.fillRect(-2, 24, 5, 3);
          ctx.fillRect(3, 22, 5, 3);
          ctx.restore();
        }
      });
    }

    // 7. Boss Nameplate & Massive Health Bar (HUD rendered above boss)
    ctx.save();
    const barWidth = Math.min(340, w * 0.85);
    const barHeight = 9;
    const barY = -h / 2 - 24;

    // Background Shadow Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(-barWidth / 2 - 2, barY - 2, barWidth + 4, barHeight + 4);
    ctx.strokeStyle = isEnraged ? '#ef4444' : '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(-barWidth / 2 - 2, barY - 2, barWidth + 4, barHeight + 4);

    // HP Gradient Fill
    const hpGrad = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
    if (isEnraged) {
      hpGrad.addColorStop(0, '#ef4444');
      hpGrad.addColorStop(1, '#f97316');
    } else {
      hpGrad.addColorStop(0, '#eab308');
      hpGrad.addColorStop(1, '#f59e0b');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(-barWidth / 2, barY, barWidth * hpRatio, barHeight);

    // HP Percentage Text
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${Math.round(hpRatio * 100)}%`, barWidth / 2, barY - 4);

    // Boss Name Tag
    if (boss.bossName) {
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = isEnraged ? '#fca5a5' : '#fef08a';
      ctx.fillText(`★ ${boss.bossName}`, -barWidth / 2, barY - 4);
    }
    ctx.restore();
  }

  // Draw Boss Multi-Engine Thruster Exhaust (Shooting upward into the sky behind the boss)
  private static drawBossThrusterFlames(ctx: CanvasRenderingContext2D, boss: Enemy, time: number) {
    const flameLen = 28 + Math.sin(time * 26) * 10;
    const w = boss.width;
    const h = boss.height;

    ctx.save();
    // 4 to 6 Heavy Engine Exhaust Pods
    const exhausts = [-w * 0.36, -w * 0.18, -w * 0.06, w * 0.06, w * 0.18, w * 0.36];
    exhausts.forEach((ox) => {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
      ctx.fillRect(ox - 6, -h / 2 - flameLen, 12, flameLen);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(ox - 3, -h / 2 - flameLen * 0.65, 6, flameLen * 0.65);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox - 1.5, -h / 2 - flameLen * 0.35, 3, flameLen * 0.35);
    });
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Projectiles & Bullets
  // -------------------------------------------------------------
  public static drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, time: number) {
    ctx.save();
    ctx.translate(b.x, b.y);

    if (b.owner === 'PLAYER' || b.owner === 'OPTION') {
      if (b.type === 'LASER') {
        // High energy glowing cyan laser beam
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(-5, -20, 10, 40);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-3, -18, 6, 36);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -16, 2, 32);
      } else if (b.type === 'HOMING_MISSILE') {
        // Green Plasma Missile (as seen in Image 3)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(4, 6);
        ctx.lineTo(0, 4);
        ctx.lineTo(-4, 6);
        ctx.closePath();
        ctx.fill();

        // White missile core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -6, 2, 8);

        // Rocket exhaust flame trail
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-1.5, 5, 3, 4 + Math.sin(time * 30) * 2);
      } else {
        // Iconic Golden-Orange Teardrop Flame Bullet (Image 3)
        // Outer flame halo
        ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 4);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();

        // Golden body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(3.5, 4);
        ctx.lineTo(0, 2.5);
        ctx.lineTo(-3.5, 4);
        ctx.closePath();
        ctx.fill();

        // White-hot core
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-1, -5, 2, 7);
      }
    } else {
      // Enemy Bullets: Glowing retro arcade orbs & needles (Classic 1945 Style)
      if (b.type === 'ENEMY_ORB') {
        // Glowing round bullet with outer red halo
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius + 3, 0, Math.PI * 2);
        ctx.fill();

        // Solid red/orange orb
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Bright yellow inner ring
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // White hot center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      } else if (b.type === 'ENEMY_NEEDLE') {
        // Fast needle dart
        const angle = Math.atan2(b.vy, b.vx);
        ctx.rotate(angle);
        ctx.fillStyle = '#ec4899';
        ctx.fillRect(-8, -2, 16, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -1, 8, 2);
      } else {
        // Heavy Plasma / Flak
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, b.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Collectible Power-Ups & Medals
  // -------------------------------------------------------------
  public static drawItem(ctx: CanvasRenderingContext2D, item: PowerUpItem, time: number) {
    ctx.save();
    ctx.translate(item.x, item.y);

    // Floating bounce
    const bobY = Math.sin(time * 6 + item.timer) * 3;
    ctx.translate(0, bobY);

    if (item.type === 'POWER_UP') {
      // Classic [ P ] Item Capsule (Red / Gold 3D box)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-8, -8, 16, 16);

      // Letter "P"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 1);
    } else if (item.type === 'BOMB') {
      // [ B ] Mega Bomb Item (Blue / Gold box)
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(-8, -8, 16, 16);

      // Letter "B"
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', 0, 1);
    } else if (item.type === 'OPTION') {
      // [ O ] Support Drone Capsule (Cyan / White)
      ctx.fillStyle = '#0891b2';
      ctx.fillRect(-12, -12, 24, 24);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-10, -10, 20, 20);
      ctx.fillStyle = '#0e7490';
      ctx.fillRect(-8, -8, 16, 16);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('O', 0, 1);
    } else if (item.type === 'MEDAL') {
      // 1945 Style Spinning Gold Medal
      const spinScale = Math.cos(time * 8);
      ctx.scale(spinScale, 1);

      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();

      // Engraved Star
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (item.type === 'SHIELD') {
      // Heart / Life Restore
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-4, -3, 6, 0, Math.PI);
      ctx.arc(4, -3, 6, 0, Math.PI);
      ctx.lineTo(0, 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Particles & Explosion Sparks
  // -------------------------------------------------------------
  public static drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'SQUARE') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'RING') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Mega Bomb Screen-Clearing Explosion Shockwaves
  // -------------------------------------------------------------
  public static drawBombEffect(ctx: CanvasRenderingContext2D, bomb: BombEffect) {
    ctx.save();
    const progress = 1 - bomb.duration / bomb.maxDuration;
    const currentRadius = bomb.maxRadius * Math.sin(progress * Math.PI * 0.5);

    // Expanding Blazing Energy Wave
    const grad = ctx.createRadialGradient(bomb.x, bomb.y, 0, bomb.x, bomb.y, currentRadius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.3, 'rgba(251, 191, 36, 0.7)');
    grad.addColorStop(0.7, 'rgba(239, 68, 68, 0.4)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();

    // Secondary Shockwave Ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(bomb.x, bomb.y, currentRadius * 0.95, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }
}
