import {
  Player,
  Enemy,
  Bullet,
  PowerUpItem,
  Particle,
  FloatingText,
  BombEffect,
  GameState,
  PlaneId,
  GameSettings,
  GameStats,
  GameMode,
} from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLANES, STAGES } from './constants';
import { retroAudio } from '../audio/retroAudio';

export class GameEngine {
  public player: Player;
  public player2: Player | null = null;
  public gameMode: GameMode = '1P';
  public enemies: Enemy[] = [];
  public playerBullets: Bullet[] = [];
  public enemyBullets: Bullet[] = [];
  public items: PowerUpItem[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public bombEffects: BombEffect[] = [];

  public currentStageIndex: number = 0;
  public stageTimer: number = 0;
  public bossActive: boolean = false;
  public bossDefeated: boolean = false;
  public stageClearDelayTimer: number = 0;
  public warningTimer: number = 0;

  public scrollOffset: number = 0;
  public gameTime: number = 0;
  public screenShakeTime: number = 0;
  public screenShakeIntensity: number = 0;

  public stats: GameStats = {
    score: 0,
    player1Score: 0,
    player2Score: 0,
    stageNumber: 1,
    enemiesDestroyed: 0,
    totalEnemies: 0,
    shotsFired: 0,
    shotsHit: 0,
    medalsCollected: 0,
    bombsUsed: 0,
  };

  public settings: GameSettings;
  private nextItemId: number = 0;
  private nextBulletId: number = 0;
  private nextEnemyId: number = 0;
  private nextTextId: number = 0;
  private enemySpawnTimer: number = 0;

  constructor(
    planeId: PlaneId = 'AV8_HARRIER',
    settings: GameSettings,
    mode: GameMode = '1P',
    plane2Id: PlaneId = 'FA18_SUPER_HORNET'
  ) {
    this.settings = settings;
    this.gameMode = mode;
    const config1 = PLANES[planeId] || PLANES.AV8_HARRIER;
    const config2 = PLANES[plane2Id] || PLANES.FA18_SUPER_HORNET;

    // Adjust starting lives and bombs based on chosen difficulty
    let lives = 3;
    let bombs = 3;
    let loops = 3;
    if (settings.difficulty === 'EASY') {
      lives = 4;
      bombs = 3;
      loops = 3;
    } else if (settings.difficulty === 'HARD') {
      lives = 2;
      bombs = 2;
      loops = 2;
    } else if (settings.difficulty === 'INSANE') {
      lives = 2;
      bombs = 2;
      loops = 1;
    }

    const p1X = mode === '2P' ? CANVAS_WIDTH / 2 - 50 : CANVAS_WIDTH / 2;
    this.player = {
      playerNumber: 1,
      x: p1X,
      y: CANVAS_HEIGHT - 100,
      width: 44,
      height: 40,
      planeId: planeId,
      speed: config1.speed,
      powerLevel: 1, // Start at Level 1 and upgrade cleanly via POWER_UP pickups
      bombs,
      lives,
      maxLives: 5,
      score: 0,
      options: 0,
      isInvincible: true,
      invincibleTimer: 3.0,
      isLooping: false,
      loopProgress: 0,
      loopsRemaining: loops,
      tilt: 0,
      propellerAngle: 0,
      lastShotTime: 0,
      hitboxRadius: 5, // Precise retro tight hitbox
    };

    if (mode === '2P') {
      this.player2 = {
        playerNumber: 2,
        x: CANVAS_WIDTH / 2 + 50,
        y: CANVAS_HEIGHT - 100,
        width: 44,
        height: 40,
        planeId: plane2Id,
        speed: config2.speed,
        powerLevel: 1,
        bombs,
        lives,
        maxLives: 5,
        score: 0,
        options: 0,
        isInvincible: true,
        invincibleTimer: 3.0,
        isLooping: false,
        loopProgress: 0,
        loopsRemaining: loops,
        tilt: 0,
        propellerAngle: 0,
        lastShotTime: 0,
        hitboxRadius: 5,
      };
    } else {
      this.player2 = null;
    }
  }

  // Reset or Start New Game
  public restart(planeId: PlaneId, plane2Id: PlaneId = 'FA18_SUPER_HORNET', mode: GameMode = '1P') {
    this.gameMode = mode;
    const config1 = PLANES[planeId] || PLANES.AV8_HARRIER;
    const config2 = PLANES[plane2Id] || PLANES.FA18_SUPER_HORNET;
    let lives = 3;
    let bombs = 3;
    let loops = 3;
    if (this.settings.difficulty === 'EASY') {
      lives = 4;
      bombs = 3;
      loops = 3;
    } else if (this.settings.difficulty === 'HARD') {
      lives = 2;
      bombs = 2;
      loops = 2;
    } else if (this.settings.difficulty === 'INSANE') {
      lives = 2;
      bombs = 2;
      loops = 1;
    }

    const p1X = mode === '2P' ? CANVAS_WIDTH / 2 - 50 : CANVAS_WIDTH / 2;
    this.player = {
      playerNumber: 1,
      x: p1X,
      y: CANVAS_HEIGHT - 100,
      width: 44,
      height: 40,
      planeId: planeId,
      speed: config1.speed,
      powerLevel: 1, // Start at Level 1
      bombs,
      lives,
      maxLives: 5,
      score: 0,
      options: 0,
      isInvincible: true,
      invincibleTimer: 3.0,
      isLooping: false,
      loopProgress: 0,
      loopsRemaining: loops,
      tilt: 0,
      propellerAngle: 0,
      lastShotTime: 0,
      hitboxRadius: 5,
    };

    if (mode === '2P') {
      this.player2 = {
        playerNumber: 2,
        x: CANVAS_WIDTH / 2 + 50,
        y: CANVAS_HEIGHT - 100,
        width: 44,
        height: 40,
        planeId: plane2Id,
        speed: config2.speed,
        powerLevel: 1,
        bombs,
        lives,
        maxLives: 5,
        score: 0,
        options: 0,
        isInvincible: true,
        invincibleTimer: 3.0,
        isLooping: false,
        loopProgress: 0,
        loopsRemaining: loops,
        tilt: 0,
        propellerAngle: 0,
        lastShotTime: 0,
        hitboxRadius: 5,
      };
    } else {
      this.player2 = null;
    }

    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.items = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bombEffects = [];

    this.currentStageIndex = 0;
    this.stageTimer = 0;
    this.bossActive = false;
    this.bossDefeated = false;
    this.stageClearDelayTimer = 0;
    this.warningTimer = 0;
    this.scrollOffset = 0;
    this.gameTime = 0;

    this.stats = {
      score: 0,
      player1Score: 0,
      player2Score: mode === '2P' ? 0 : undefined,
      stageNumber: 1,
      enemiesDestroyed: 0,
      totalEnemies: 0,
      shotsFired: 0,
      shotsHit: 0,
      medalsCollected: 0,
      bombsUsed: 0,
    };

    retroAudio.playBgm('STAGE1');
  }

  // Proceed to Next Stage
  public nextStage() {
    // Clear any residual screen shake on stage transition
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
    this.currentStageIndex++;
    if (this.currentStageIndex >= STAGES.length) {
      return 'VICTORY';
    }
    this.stageTimer = 0;
    this.bossActive = false;
    this.bossDefeated = false;
    this.stageClearDelayTimer = 0;
    this.warningTimer = 0;
    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.items = [];
    this.stats.stageNumber = this.currentStageIndex + 1;

    // Reset 1P position and bonus items
    const p1X = this.gameMode === '2P' ? CANVAS_WIDTH / 2 - 50 : CANVAS_WIDTH / 2;
    this.player.x = p1X;
    this.player.y = CANVAS_HEIGHT - 100;
    this.player.bombs = Math.min(5, this.player.bombs + 1);
    this.player.loopsRemaining = Math.min(5, this.player.loopsRemaining + 1);
    this.player.isInvincible = true;
    this.player.invincibleTimer = 3.0;
    if (this.player.lives <= 0) {
      this.player.lives = 1;
      this.player.powerLevel = 1;
    }

    // Reset 2P position and bonus items
    if (this.player2) {
      this.player2.x = CANVAS_WIDTH / 2 + 50;
      this.player2.y = CANVAS_HEIGHT - 100;
      this.player2.bombs = Math.min(5, this.player2.bombs + 1);
      this.player2.loopsRemaining = Math.min(5, this.player2.loopsRemaining + 1);
      this.player2.isInvincible = true;
      this.player2.invincibleTimer = 3.0;
      if (this.player2.lives <= 0) {
        this.player2.lives = 1;
        this.player2.powerLevel = 1;
      }
    }

    const bgmKey = (this.currentStageIndex === 1 ? 'STAGE2' : this.currentStageIndex === 2 ? 'STAGE3' : 'STAGE4') as 'STAGE1' | 'STAGE2' | 'STAGE3' | 'STAGE4';
    retroAudio.playBgm(bgmKey);
    return 'PLAYING';
  }

  // Trigger 360 Loop-the-loop Evasion Maneuver
  public triggerLoop(playerNum: 1 | 2 = 1): boolean {
    const p = playerNum === 2 ? this.player2 : this.player;
    if (!p || p.lives <= 0 || p.isLooping || p.loopsRemaining <= 0) return false;
    p.isLooping = true;
    p.loopProgress = 0;
    p.loopsRemaining--;
    p.isInvincible = true;
    p.invincibleTimer = 1.6;
    retroAudio.playLoop();
    this.addFloatingText(p.x, p.y - 20, `${playerNum}P 360 LOOP!`, playerNum === 2 ? '#ef4444' : '#38bdf8');
    return true;
  }

  // Trigger Tactical Super Bomb
  public triggerBomb(playerNum: 1 | 2 = 1): boolean {
    const p = playerNum === 2 ? this.player2 : this.player;
    if (!p || p.lives <= 0 || p.bombs <= 0) return false;
    p.bombs--;
    this.stats.bombsUsed++;

    const config = PLANES[p.planeId] || PLANES.AV8_HARRIER;

    // Screen Shake (Smooth and gentle tactile rumble)
    this.triggerScreenShake(4.5, 0.35);

    // Bomb shockwave effect
    this.bombEffects.push({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: 10,
      maxRadius: 460,
      type: 'SUPER_BOMB',
      duration: 1.4,
      maxDuration: 1.4,
      damage: Math.round(config.bombPower * 1.5),
    });

    retroAudio.playBomb();
    this.addFloatingText(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2 - 40,
      `${playerNum}P BOMB: ${config.koreanBombName} (${config.bombName})`,
      config.accentColor || '#fbbf24'
    );

    // Cancel all enemy bullets into gold medals!
    for (const eb of this.enemyBullets) {
      if (Math.random() < 0.7) {
        this.spawnItem(eb.x, eb.y, 'MEDAL');
      }
      this.createExplosion(eb.x, eb.y, 4, '#fbbf24');
    }
    this.enemyBullets = [];

    // Damage all enemies
    const bombDmg = config.bombPower;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.hp -= bombDmg;
      this.createExplosion(e.x, e.y, 10, '#f97316');
      if (e.parts) {
        for (const part of e.parts) {
          part.hp -= 90;
          if (part.hp <= 0) part.isDestroyed = true;
        }
      }
      if (e.hp <= 0) {
        this.destroyEnemy(e, i, playerNum);
      }
    }

    // Temporary player invincibility (세라프는 무적 시간이 더 길어요)
    p.isInvincible = true;
    p.invincibleTimer = config.weapon === 'SERAPH' ? 3.6 : 2.4;

    return true;
  }

  // Shoot Player Weapons — 기체마다 다른 무기 (WIDE / FOCUS / PIERCE / HOMING / SERAPH / LASER)
  public shootPlayer(playerNum: 1 | 2 = 1) {
    const p = playerNum === 2 ? this.player2 : this.player;
    if (!p || p.lives <= 0 || p.isLooping) return;
    const now = this.gameTime;
    const config = PLANES[p.planeId] || PLANES.AV8_HARRIER;
    const fireInterval = 1 / config.fireRate;

    if (now - p.lastShotTime < fireInterval) return;
    p.lastShotTime = now;
    this.stats.shotsFired++;

    retroAudio.playShoot(p.powerLevel);

    const px = p.x;
    const py = p.y - 14;
    const lv = p.powerLevel;
    const color = config.color;
    const owner = playerNum === 2 ? 'PLAYER_2' : 'PLAYER_1';
    // 화력(power) 3~5 → 피해 배율
    const mult = config.power >= 5 ? 1.12 : config.power <= 3 ? 0.9 : 1.0;
    const fire = (
      dx: number, dy: number, vx: number, vy: number,
      type: 'VULCAN' | 'LASER' | 'HOMING_MISSILE', dmg: number, c: string = color, pierce = false
    ) => this.addPlayerBullet(px + dx, py + dy, vx, vy, type, Math.round(dmg * mult), c, pierce, owner);
    const missiles = (count: number, dmg: number) => {
      for (let k = 0; k < count; k++) {
        const side = k % 2 === 0 ? -1 : 1;
        const row = Math.floor(k / 2);
        fire(side * (14 + row * 6), 6 + row * 4, side * (0.8 + row * 0.5), -11, 'HOMING_MISSILE', dmg, '#fbbf24');
      }
    };

    switch (config.weapon) {
      case 'WIDE': {
        // 피닉스: 넓은 부채꼴 확산탄
        const ways = [3, 3, 5, 5, 7][lv - 1];
        const spread = [0.9, 1.2, 1.2, 1.5, 1.6][lv - 1];
        const dmg = [13, 14, 13, 14, 14][lv - 1];
        for (let k = 0; k < ways; k++) {
          const t = k - (ways - 1) / 2;
          fire(t * 5, Math.abs(t) * 2, t * spread, -13.5, 'VULCAN', dmg);
        }
        if (lv >= 4) missiles(2, 18);
        break;
      }
      case 'FOCUS': {
        // 블루 템페스트: 앞쪽 집중 화력
        const lines = [2, 3, 4, 4, 4][lv - 1];
        for (let k = 0; k < lines; k++) {
          const t = k - (lines - 1) / 2;
          fire(t * 7, Math.abs(t) * 3, 0, -15, 'VULCAN', 15 + (lv >= 3 ? 1 : 0));
        }
        if (lv >= 3) fire(0, -8, 0, -18, 'LASER', 18, '#93c5fd', true);
        if (lv >= 5) missiles(2, 20);
        break;
      }
      case 'PIERCE': {
        // 발키리: 적을 뚫고 지나가는 웨이브탄
        const ways = [2, 2, 3, 3, 5][lv - 1];
        for (let k = 0; k < ways; k++) {
          const t = k - (ways - 1) / 2;
          fire(t * 9, Math.abs(t) * 3, t * 0.7, -14, 'LASER', 19 + lv, '#34d399', true);
        }
        if (lv >= 4) {
          fire(-16, 6, -1.8, -12, 'VULCAN', 12);
          fire(16, 6, 1.8, -12, 'VULCAN', 12);
        }
        break;
      }
      case 'HOMING': {
        // 스텔스 스톰: 쌍발 발칸 + 처음부터 유도 미사일
        fire(-4, 0, 0, -15, 'VULCAN', 12);
        fire(4, 0, 0, -15, 'VULCAN', 12);
        if (lv >= 3) {
          fire(-10, 2, -0.6, -14, 'VULCAN', 11);
          fire(10, 2, 0.6, -14, 'VULCAN', 11);
        }
        missiles([1, 2, 2, 4, 4][lv - 1], [16, 16, 18, 18, 20][lv - 1]);
        break;
      }
      case 'SERAPH': {
        // 바이올렛 세라프: 가운데 레이저 + 양옆 하트 확산탄
        fire(0, -4, 0, -16, 'LASER', 15 + lv, '#e9d5ff', true);
        const side = [1, 1, 2, 2, 3][lv - 1];
        for (let k = 1; k <= side; k++) {
          fire(-6 - k * 4, k * 2, -k * 1.1, -13, 'VULCAN', 12, '#f472b6');
          fire(6 + k * 4, k * 2, k * 1.1, -13, 'VULCAN', 12, '#f472b6');
        }
        if (lv >= 4) missiles(2, 18);
        break;
      }
      case 'LASER':
      default: {
        // 블랙 골드 타이탄: 굵은 쌍둥이 관통 레이저 (느리지만 한 방이 셈)
        const beams = [2, 2, 3, 4, 4][lv - 1];
        for (let k = 0; k < beams; k++) {
          const t = k - (beams - 1) / 2;
          fire(t * 8, Math.abs(t) * 4, 0, -18, 'LASER', [28, 30, 30, 30, 32][lv - 1], '#fde047', true);
        }
        if (lv >= 2) {
          fire(-14, 4, -0.3, -15, 'VULCAN', 16);
          fire(14, 4, 0.3, -15, 'VULCAN', 16);
        }
        if (lv >= 5) missiles(2, 20);
        break;
      }
    }

    // Escort Sub-Drones Shoot
    if (p.options > 0) {
      for (let i = 0; i < p.options; i++) {
        const side = i === 0 ? -1 : 1;
        const optX = p.x + side * 30;
        const optY = p.y + 8;
        this.addPlayerBullet(optX, optY - 8, 0, -14, 'VULCAN', 11, '#38bdf8', false, 'OPTION');
      }
    }
  }

  private addPlayerBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: 'VULCAN' | 'LASER' | 'HOMING_MISSILE',
    damage: number,
    color: string,
    piercing: boolean = false,
    owner: 'PLAYER' | 'PLAYER_1' | 'PLAYER_2' | 'OPTION' = 'PLAYER_1'
  ) {
    this.playerBullets.push({
      id: `pb_${this.nextBulletId++}`,
      x,
      y,
      vx,
      vy,
      radius: type === 'LASER' ? 6 : 4,
      owner,
      type,
      damage,
      color,
      piercing,
    });
  }

  private addEnemyBullet(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: 'ENEMY_ORB' | 'ENEMY_NEEDLE' | 'ENEMY_HEAVY' = 'ENEMY_ORB',
    radius: number = 4
  ) {
    this.enemyBullets.push({
      id: `eb_${this.nextBulletId++}`,
      x,
      y,
      vx,
      vy,
      radius,
      owner: 'ENEMY',
      type,
      damage: 1,
      color: '#ef4444',
    });
  }

  // -------------------------------------------------------------
  // Main Game Loop Update (Delta Time)
  // -------------------------------------------------------------
  public update(
    dt: number,
    keys: { [k: string]: boolean },
    mousePos?: { x: number; y: number; isDown: boolean }
  ): GameState | null {
    this.gameTime += dt;
    this.stageTimer += dt;
    this.player.propellerAngle += dt * 35;
    if (this.player2) {
      this.player2.propellerAngle += dt * 35;
    }

    // Scrolling speed
    const currentStage = STAGES[this.currentStageIndex] || STAGES[0];
    this.scrollOffset += currentStage.bgSpeed * 60 * dt;

    // Screen Shake decay
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }

    // Player 1 Invincibility timer
    if (this.player.isInvincible) {
      this.player.invincibleTimer -= dt;
      if (this.player.invincibleTimer <= 0) {
        this.player.isInvincible = false;
      }
    }

    // Player 1 360 Loop-the-loop progression
    if (this.player.isLooping) {
      this.player.loopProgress += dt * 1.2;
      if (this.player.loopProgress >= 1.0) {
        this.player.isLooping = false;
        this.player.loopProgress = 0;
      }
    }

    // Player 2 Invincibility & Loop progression
    if (this.player2) {
      if (this.player2.isInvincible) {
        this.player2.invincibleTimer -= dt;
        if (this.player2.invincibleTimer <= 0) {
          this.player2.isInvincible = false;
        }
      }
      if (this.player2.isLooping) {
        this.player2.loopProgress += dt * 1.2;
        if (this.player2.loopProgress >= 1.0) {
          this.player2.isLooping = false;
          this.player2.loopProgress = 0;
        }
      }
    }

    // 1. Update Player Input & Movement
    this.updatePlayerMovement(dt, keys, mousePos);

    // 2. Player 1 Shooting
    if (this.player.lives > 0) {
      const p1Shooting = this.settings.autoFire ||
        keys['Space'] ||
        keys['KeyZ'] ||
        keys['KeyJ'] ||
        (this.gameMode === '1P' && mousePos && mousePos.isDown);
      if (p1Shooting) {
        this.shootPlayer(1);
      }
    }

    // Player 2 Shooting (2P Controls: Numpad 1, Key B, Slash, Key O)
    if (this.player2 && this.player2.lives > 0) {
      const p2Shooting = this.settings.autoFire ||
        keys['Numpad1'] ||
        keys['KeyB'] ||
        keys['Slash'] ||
        keys['KeyO'] ||
        keys['Numpad0'];
      if (p2Shooting) {
        this.shootPlayer(2);
      }
    }

    // 3. Update Bomb Effects
    for (let i = this.bombEffects.length - 1; i >= 0; i--) {
      const b = this.bombEffects[i];
      b.duration -= dt;
      if (b.duration <= 0) {
        this.bombEffects.splice(i, 1);
      }
    }

    // 4. Update Player Bullets
    this.updatePlayerBullets(dt);

    // 5. Update Enemy Waves & Spawning
    this.updateEnemySpawning(dt, currentStage);

    // 6. Update Enemies & Boss Behaviors
    this.updateEnemies(dt);

    // 7. Update Enemy Bullets
    this.updateEnemyBullets(dt);

    // 8. Update Items & Pickups
    this.updateItems(dt);

    // 9. Update Particles & Floating Text
    this.updateParticles(dt);

    // 10. Check Stage Clear or Game Over conditions
    const p1Dead = this.player.lives <= 0;
    const p2Dead = !this.player2 || this.player2.lives <= 0;

    if (this.gameMode === '1P' && p1Dead) {
      retroAudio.playGameOver();
      return 'GAME_OVER';
    } else if (this.gameMode === '2P' && p1Dead && p2Dead) {
      retroAudio.playGameOver();
      return 'GAME_OVER';
    }

    // Stage cannot clear unless the stage boss / flagship has been completely destroyed
    if (this.bossDefeated) {
      this.stageClearDelayTimer += dt;
      if (this.stageClearDelayTimer >= 1.6) {
        retroAudio.playStageClear();
        return 'STAGE_CLEAR';
      }
    }

    return null;
  }

  // Update Player Movement & Bounds
  private updatePlayerMovement(
    dt: number,
    keys: { [k: string]: boolean },
    mousePos?: { x: number; y: number; isDown: boolean }
  ) {
    // -------------------------------------------------------------
    // Player 1 Movement (WASD or Arrow Keys in 1P mode, WASD in 2P mode)
    // -------------------------------------------------------------
    if (this.player.lives > 0) {
      if (this.gameMode === '1P' && this.settings.controls === 'MOUSE' && mousePos) {
        // Mouse/Touch Direct Navigation for 1P
        const targetX = Math.max(24, Math.min(CANVAS_WIDTH - 24, mousePos.x));
        const targetY = Math.max(30, Math.min(CANVAS_HEIGHT - 40, mousePos.y));
        const speedFactor = 12 * dt;
        this.player.x += (targetX - this.player.x) * speedFactor;
        this.player.y += (targetY - this.player.y) * speedFactor;
        this.player.tilt = Math.max(-1, Math.min(1, (targetX - this.player.x) * 0.1));
      } else {
        let p1dx = 0;
        let p1dy = 0;

        if (keys['KeyA'] || (this.gameMode === '1P' && keys['ArrowLeft'])) p1dx -= 1;
        if (keys['KeyD'] || (this.gameMode === '1P' && keys['ArrowRight'])) p1dx += 1;
        if (keys['KeyW'] || (this.gameMode === '1P' && keys['ArrowUp'])) p1dy -= 1;
        if (keys['KeyS'] || (this.gameMode === '1P' && keys['ArrowDown'])) p1dy += 1;

        if (p1dx !== 0 && p1dy !== 0) {
          p1dx *= 0.7071;
          p1dy *= 0.7071;
        }

        this.player.tilt = p1dx;
        const p1MoveDist = this.player.speed * 60 * dt;
        this.player.x += p1dx * p1MoveDist;
        this.player.y += p1dy * p1MoveDist;

        this.player.x = Math.max(24, Math.min(CANVAS_WIDTH - 24, this.player.x));
        this.player.y = Math.max(30, Math.min(CANVAS_HEIGHT - 35, this.player.y));
      }
    }

    // -------------------------------------------------------------
    // Player 2 Movement (Arrow Keys exclusively in 2P mode)
    // -------------------------------------------------------------
    if (this.player2 && this.player2.lives > 0) {
      let p2dx = 0;
      let p2dy = 0;

      if (keys['ArrowLeft']) p2dx -= 1;
      if (keys['ArrowRight']) p2dx += 1;
      if (keys['ArrowUp']) p2dy -= 1;
      if (keys['ArrowDown']) p2dy += 1;

      if (p2dx !== 0 && p2dy !== 0) {
        p2dx *= 0.7071;
        p2dy *= 0.7071;
      }

      this.player2.tilt = p2dx;
      const p2MoveDist = this.player2.speed * 60 * dt;
      this.player2.x += p2dx * p2MoveDist;
      this.player2.y += p2dy * p2MoveDist;

      this.player2.x = Math.max(24, Math.min(CANVAS_WIDTH - 24, this.player2.x));
      this.player2.y = Math.max(30, Math.min(CANVAS_HEIGHT - 35, this.player2.y));
    }
  }

  // Update Player Bullets & Collisions with Enemies
  private updatePlayerBullets(dt: number) {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      const bulletPlayerNum = b.owner === 'PLAYER_2' ? 2 : 1;

      // Homing Missile Trajectory logic
      if (b.type === 'HOMING_MISSILE') {
        const target = this.findNearestEnemy(b.x, b.y);
        if (target) {
          const angle = Math.atan2(target.y - b.y, target.x - b.x);
          b.vx += Math.cos(angle) * 35 * dt;
          b.vy += Math.sin(angle) * 35 * dt;
          // Clamp speed
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          if (speed > 16) {
            b.vx = (b.vx / speed) * 16;
            b.vy = (b.vy / speed) * 16;
          }
        }
      }

      b.x += b.vx * 60 * dt;
      b.y += b.vy * 60 * dt;

      // Remove out of bounds bullets
      if (b.y < -30 || b.y > CANVAS_HEIGHT + 30 || b.x < -30 || b.x > CANVAS_WIDTH + 30) {
        this.playerBullets.splice(i, 1);
        continue;
      }

      // Check collision with Enemies
      let hit = false;
      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];

        // Boss part collision or main body collision
        if (e.isBoss && e.parts) {
          for (const p of e.parts) {
            if (p.isDestroyed) continue;
            const partWorldX = e.x + p.offsetX;
            const partWorldY = e.y + p.offsetY;
            const dist = Math.hypot(b.x - partWorldX, b.y - partWorldY);

            if (dist < p.width / 2 + b.radius) {
              if (b.piercing) {
                const key = e.id + ':' + p.id;
                if (b.hitIds?.includes(key)) continue;
                (b.hitIds ||= []).push(key);
              }
              p.hp -= b.damage;
              e.hitFlash = 0.08;
              this.stats.shotsHit++;
              this.createHitSparks(b.x, b.y, b.color);
              if (p.hp <= 0) {
                p.isDestroyed = true;
                this.addScore(500, bulletPlayerNum);
                this.createExplosion(partWorldX, partWorldY, 14, '#f97316');
                retroAudio.playExplosion('MEDIUM');
              }
              if (!b.piercing) {
                hit = true;
                break;
              }
            }
          }
        }

        const dist = Math.hypot(b.x - e.x, b.y - e.y);
        if (dist < e.width / 2 + b.radius) {
          if (b.piercing) {
            if (b.hitIds?.includes(e.id)) continue;
            (b.hitIds ||= []).push(e.id);
          }
          e.hp -= b.damage;
          e.hitFlash = 0.08;
          this.stats.shotsHit++;
          this.createHitSparks(b.x, b.y, b.color);

          if (e.hp <= 0) {
            this.destroyEnemy(e, j, bulletPlayerNum);
          }

          if (!b.piercing) {
            hit = true;
            break;
          }
        }
      }

      if (hit && !b.piercing) {
        this.playerBullets.splice(i, 1);
      }
    }
  }

  // Update Enemy Wave Spawning
  private updateEnemySpawning(dt: number, stage: typeof STAGES[0]) {
    if (this.bossActive || this.bossDefeated) return;

    this.enemySpawnTimer += dt;

    // Trigger Boss sequence when stage duration reaches threshold
    if (this.stageTimer >= stage.durationSeconds && !this.bossActive) {
      this.bossActive = true;
      this.warningTimer = 4.0;
      retroAudio.playWarning();
      retroAudio.playBgm('BOSS');
      this.spawnBoss(stage.bossType, stage.bossName);
      return;
    }

    // Stage-scaled wave spawning cadence (Relaxed and accessible in Stage 1)
    const baseStageInterval = this.currentStageIndex === 0 ? 2.8 : Math.max(1.1, 2.2 - this.currentStageIndex * 0.3);
    const diffMult = this.settings.difficulty === 'EASY' ? 1.3 : this.settings.difficulty === 'HARD' ? 0.85 : this.settings.difficulty === 'INSANE' ? 0.65 : 1.0;
    const spawnThreshold = baseStageInterval * diffMult;

    if (this.enemySpawnTimer >= spawnThreshold) {
      this.enemySpawnTimer = 0;

      // Stage-tailored wave selection
      if (this.currentStageIndex === 0) {
        // Stage 1: Introductory gentle waves with slower scouts and ample reaction time
        const wave = Math.floor(Math.random() * 5);
        if (wave === 0) this.spawnHeartSquadron();
        else if (wave === 1) this.spawnVSquadron();
        else if (wave === 2) this.spawnDartSquadron();
        else if (wave === 3) {
          this.spawnEnemy('SCOUT_GREEN', -20, 90, 1.8, 1.4, 'SWOOP_LEFT');
          this.spawnEnemy('SCOUT_GREEN', CANVAS_WIDTH + 20, 110, -1.8, 1.4, 'SWOOP_RIGHT');
        } else {
          const gx = 80 + Math.random() * (CANVAS_WIDTH - 160);
          this.spawnEnemy('ISLAND_TURRET', gx, -30, 0, 0.8, 'TURRET_AIM');
        }
      } else if (this.currentStageIndex === 1) {
        // Stage 2: Tactical naval & pincer combat with heavy artillery & dart fighters
        const wave = Math.floor(Math.random() * 6);
        if (wave === 0) this.spawnHeartSquadron();
        else if (wave === 1) {
          this.spawnEnemy('SCOUT_ORANGE', -20, 80, 3.2, 2.0, 'ZIGZAG');
          this.spawnEnemy('SCOUT_ORANGE', CANVAS_WIDTH + 20, 120, -3.2, 2.0, 'ZIGZAG');
        } else if (wave === 2) this.spawnVSquadron();
        else if (wave === 3) this.spawnDartSquadron();
        else if (wave === 4) {
          this.spawnEnemy('FIGHTER_RED', CANVAS_WIDTH * 0.3, -40, 0, 2.2, 'STRAIGHT');
          this.spawnEnemy('FIGHTER_RED', CANVAS_WIDTH * 0.7, -40, 0, 2.2, 'STRAIGHT');
        } else {
          const gx = 40 + Math.random() * (CANVAS_WIDTH - 80);
          this.spawnEnemy('GROUND_ARTILLERY', gx, -40, 0, 1.0, 'TURRET_AIM');
          if (Math.random() < 0.5) {
            this.spawnEnemy('GUNBOAT', gx > CANVAS_WIDTH / 2 ? gx - 100 : gx + 100, -50, 0, 1.0, 'TURRET_AIM');
          }
        }
      } else if (this.currentStageIndex === 2) {
        // Stage 3: Heavy coastal bomber wings & heavy flak artillery
        const wave = Math.floor(Math.random() * 6);
        if (wave === 0) {
          const bx = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 160;
          this.spawnEnemy('HEAVY_BOMBER', bx, -60, 0, 1.2, 'HOVER_RETREAT');
          this.spawnEnemy('FIGHTER_RED', bx - 55, -90, 0, 2.6, 'STRAIGHT');
          this.spawnEnemy('FIGHTER_RED', bx + 55, -90, 0, 2.6, 'STRAIGHT');
        } else if (wave === 1) this.spawnCircleDiveSquadron();
        else if (wave === 2) this.spawnDartSquadron();
        else if (wave === 3) this.spawnVSquadron();
        else if (wave === 4) {
          this.spawnEnemy('SCOUT_ORANGE', -20, 70, 3.6, 2.2, 'ZIGZAG');
          this.spawnEnemy('SCOUT_ORANGE', CANVAS_WIDTH + 20, 100, -3.6, 2.2, 'ZIGZAG');
          this.spawnEnemy('SCOUT_ORANGE', -20, 140, 3.6, 2.2, 'ZIGZAG');
        } else {
          const gx = 40 + Math.random() * (CANVAS_WIDTH - 80);
          this.spawnEnemy('GROUND_ARTILLERY', gx, -40, 0, 1.2, 'TURRET_AIM');
        }
      } else {
        // Stage 4+: Apex dogfight & bullet hell ambushes with elite artillery
        const wave = Math.floor(Math.random() * 6);
        if (wave === 0) this.spawnCircleDiveSquadron();
        else if (wave === 1) {
          const bx = CANVAS_WIDTH / 2 + (Math.random() - 0.5) * 160;
          this.spawnEnemy('HEAVY_BOMBER', bx, -60, 0, 1.3, 'HOVER_RETREAT');
          this.spawnEnemy('STEALTH_JET', bx - 60, -90, 0, 3.5, 'STRAIGHT');
          this.spawnEnemy('STEALTH_JET', bx + 60, -90, 0, 3.5, 'STRAIGHT');
        } else if (wave === 2) this.spawnDartSquadron();
        else if (wave === 3) this.spawnHeartSquadron();
        else if (wave === 4) {
          for (let k = 0; k < 3; k++) {
            this.spawnEnemy('STEALTH_JET', 60 + k * 80, -40 - k * 30, 0, 4.0, 'STRAIGHT');
          }
        } else {
          const gx1 = 50 + Math.random() * 100;
          const gx2 = CANVAS_WIDTH - 150 + Math.random() * 100;
          this.spawnEnemy('GROUND_ARTILLERY', gx1, -40, 0, 1.2, 'TURRET_AIM');
          this.spawnEnemy('GROUND_ARTILLERY', gx2, -60, 0, 1.2, 'TURRET_AIM');
          this.spawnEnemy('FIGHTER_RED', CANVAS_WIDTH / 2, -50, 0, 2.8, 'STRAIGHT');
        }
      }
    }
  }

  // Spawn Rapid Interceptor Dart Squadron
  private spawnDartSquadron() {
    const isStage1 = this.currentStageIndex === 0;
    const side = Math.random() > 0.5 ? 1 : -1;
    const startX = side === 1 ? -30 : CANVAS_WIDTH + 30;
    const targetVx = side === 1 ? (isStage1 ? 2.0 : 2.8) : (isStage1 ? -2.0 : -2.8);
    const speed = isStage1 ? 2.8 : (4.2 + this.currentStageIndex * 0.4);
    const count = isStage1 ? 3 : 4;

    for (let i = 0; i < count; i++) {
      this.spawnEnemy(
        'SCOUT_DART',
        startX + (side === 1 ? -i * 35 : i * 35),
        -40 - i * 40,
        targetVx,
        speed,
        'DART_SWOOP'
      );
      this.stats.totalEnemies++;
    }
  }

  // Spawn Iconic Heart Formation Squadron ("하트 편대")
  private spawnHeartSquadron() {
    // Stage 1: 12 fighters gently flying down; higher stages: 22 fighters
    const count = this.currentStageIndex === 0 ? 12 : 22;
    const centerX = CANVAS_WIDTH / 2;
    const baseY = -160;

    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      // Parametric heart formula
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));

      const worldX = centerX + hx * 8.5;
      const worldY = baseY + hy * 8.0;

      const type = i % 2 === 0 ? 'SCOUT_ORANGE' : 'SCOUT_GREEN';
      const behavior = i < count / 2 ? 'HEART_FORMATION_L' : 'HEART_FORMATION_R';

      const speed = this.currentStageIndex === 0 ? 1.6 : (2.4 + this.currentStageIndex * 0.3);
      this.spawnEnemy(type, worldX, worldY, 0, speed, behavior);
      this.stats.totalEnemies++;
    }
  }

  // Spawn V-Formation Squadron
  private spawnVSquadron() {
    const isStage1 = this.currentStageIndex === 0;
    const count = isStage1 ? 5 : 7;
    const centerX = 80 + Math.random() * (CANVAS_WIDTH - 160);

    for (let i = 0; i < count; i++) {
      const mid = Math.floor(count / 2);
      const rank = Math.abs(i - mid);
      const offsetX = (i - mid) * 36;
      const offsetY = -50 - rank * 30;
      const type = i === mid && !isStage1 ? 'FIGHTER_RED' : 'SCOUT_GREEN';
      const speed = isStage1 ? 2.0 : (2.8 + this.currentStageIndex * 0.3);

      this.spawnEnemy(type, centerX + offsetX, offsetY, 0, speed, 'V_FORMATION');
      this.stats.totalEnemies++;
    }
  }

  // Spawn Circle Dive Interceptors
  private spawnCircleDiveSquadron() {
    const side = Math.random() > 0.5 ? 1 : -1;
    const startX = side === 1 ? -40 : CANVAS_WIDTH + 40;
    const speed = 3.0 + this.currentStageIndex * 0.3;

    for (let i = 0; i < 5; i++) {
      this.spawnEnemy('STEALTH_JET', startX, -50 - i * 45, side * 3.5, speed, 'CIRCLE_DIVE');
      this.stats.totalEnemies++;
    }
  }

  // Spawn Specific Enemy Entity with Stage-by-Stage Level Scaling
  private spawnEnemy(
    type: Enemy['type'],
    x: number,
    y: number,
    vx: number,
    vy: number,
    behavior: Enemy['behavior']
  ) {
    let hp = 22;
    let width = 56;
    let height = 58;
    let score = 200;
    let shootInterval = 2.4;
    let isGroundOrSea = false;

    if (type === 'SCOUT_GREEN') {
      hp = 22;
      width = 56; // Scout Interceptor
      height = 58;
      score = 200;
      shootInterval = 2.4;
    } else if (type === 'SCOUT_ORANGE') {
      hp = 32;
      width = 64; // Heavy Twin-Engine Fighter
      height = 66;
      score = 350;
      shootInterval = 2.0;
    } else if (type === 'SCOUT_DART') {
      hp = 20;
      width = 50; // Dart Interceptor
      height = 54;
      score = 300;
      shootInterval = 1.8;
    } else if (type === 'FIGHTER_RED') {
      hp = 52;
      width = 72; // Red Interceptor
      height = 74;
      score = 500;
      shootInterval = 1.6;
    } else if (type === 'HEAVY_BOMBER') {
      hp = 190;
      width = 144; // Heavy Gunship
      height = 132;
      score = 1500;
      shootInterval = 1.4;
    } else if (type === 'STEALTH_JET') {
      hp = 46;
      width = 68; // Stealth Fighter
      height = 70;
      score = 600;
      shootInterval = 1.6;
    } else if (type === 'GROUND_ARTILLERY') {
      hp = 110;
      width = 76; // Ground Howitzer Bunker
      height = 76;
      score = 1200;
      shootInterval = 2.4;
      isGroundOrSea = true;
    } else if (type === 'GUNBOAT' || type === 'ISLAND_TURRET') {
      hp = 85;
      width = 80; // Coastal Battery
      height = 80;
      score = 800;
      shootInterval = 2.2;
      isGroundOrSea = true;
    }

    // 1. Stage-by-Stage Scaling
    const stageHpMult = 0.85 + this.currentStageIndex * 0.25;
    const stageIntervalMult = this.currentStageIndex === 0 ? 1.15 : Math.max(0.55, 1.0 - this.currentStageIndex * 0.12);
    hp *= stageHpMult;
    shootInterval *= stageIntervalMult;

    // Scale up physical size of attacking spacecraft in higher stages
    if (this.currentStageIndex >= 1) {
      const sizeScale = 1.0 + Math.min(0.5, this.currentStageIndex * 0.06);
      width *= sizeScale;
      height *= sizeScale;
    }

    // 2. Global Difficulty Scaling
    if (this.settings.difficulty === 'EASY') {
      hp *= 0.8;
      shootInterval *= 1.25;
    } else if (this.settings.difficulty === 'HARD') {
      hp *= 1.35;
      shootInterval *= 0.75;
    } else if (this.settings.difficulty === 'INSANE') {
      hp *= 1.6;
      shootInterval *= 0.55;
    }

    this.enemies.push({
      id: `enemy_${this.nextEnemyId++}`,
      type,
      x,
      y,
      vx,
      vy,
      width: Math.round(width),
      height: Math.round(height),
      hp: Math.round(hp),
      maxHp: Math.round(hp),
      scoreValue: score,
      shootTimer: Math.random() * shootInterval,
      shootInterval,
      patternTimer: 0,
      behavior,
      isGroundOrSea,
      rotation: 0,
      stageIndex: this.currentStageIndex,
    });
  }

  // Spawn Multi-Stage Boss with Substantial HP and Threat
  private spawnBoss(bossType: Enemy['type'], bossName: string) {
    const baseBossHps: Record<number, number> = {
      0: 3400,   // Stage 1: Introductory Sky Fortress (Substantial, epic boss battle)
      1: 6200,   // Stage 2: Heavy Sea Dreadnought
      2: 9600,   // Stage 3: Sphinx Titan Carrier
      3: 13500,  // Stage 4: Ignis Vulcan Flagship
      4: 18000,  // Stage 5: Neon Cyber Titan
      5: 23500,  // Stage 6: Orbital Deathstar Fortress
      6: 29500,  // Stage 7: Leviathan Plasma Flagship
      7: 36000,  // Stage 8: Sky Templar Mothership
      8: 44000,  // Stage 9: Frost Giant Dreadnought
      9: 54000,  // Stage 10: Nebula Apocalypse Final Boss
    };

    let bossHp = baseBossHps[this.currentStageIndex] || 3400 + this.currentStageIndex * 5000;
    // Colossal Dimensions for the Giant Space Dreadnought / Alien Motherships (fills screen width)
    const width = 360 + Math.min(90, this.currentStageIndex * 10);
    const height = 300 + Math.min(80, this.currentStageIndex * 8);

    if (this.settings.difficulty === 'EASY') bossHp *= 0.8;
    if (this.settings.difficulty === 'HARD') bossHp *= 1.35;
    if (this.settings.difficulty === 'INSANE') bossHp *= 1.6;

    const turretHp = this.currentStageIndex === 0 ? 380 : (480 + this.currentStageIndex * 220);
    const parts = [
      { id: 't1', offsetX: -Math.round(width * 0.28), offsetY: -Math.round(height * 0.14), width: 44, height: 44, hp: turretHp, maxHp: turretHp, isDestroyed: false, type: 'TURRET' as const, shootTimer: 1.2, angle: 0 },
      { id: 't2', offsetX: Math.round(width * 0.28), offsetY: -Math.round(height * 0.14), width: 44, height: 44, hp: turretHp, maxHp: turretHp, isDestroyed: false, type: 'TURRET' as const, shootTimer: 1.8, angle: 0 },
      { id: 't3', offsetX: 0, offsetY: Math.round(height * 0.22), width: 52, height: 52, hp: Math.round(turretHp * 1.4), maxHp: Math.round(turretHp * 1.4), isDestroyed: false, type: 'TURRET' as const, shootTimer: 2.2, angle: 0 },
      { id: 't4', offsetX: -Math.round(width * 0.40), offsetY: Math.round(height * 0.04), width: 36, height: 36, hp: Math.round(turretHp * 0.8), maxHp: Math.round(turretHp * 0.8), isDestroyed: false, type: 'TURRET' as const, shootTimer: 2.5, angle: 0 },
      { id: 't5', offsetX: Math.round(width * 0.40), offsetY: Math.round(height * 0.04), width: 36, height: 36, hp: Math.round(turretHp * 0.8), maxHp: Math.round(turretHp * 0.8), isDestroyed: false, type: 'TURRET' as const, shootTimer: 2.8, angle: 0 },
    ];

    this.enemies.push({
      id: `boss_${this.nextEnemyId++}`,
      type: bossType,
      x: CANVAS_WIDTH / 2,
      y: -160, // Fly in from deep space
      vx: 0,
      vy: 1.3,
      width,
      height,
      hp: Math.round(bossHp),
      maxHp: Math.round(bossHp),
      scoreValue: 50000 + this.currentStageIndex * 18000,
      shootTimer: 1.0,
      shootInterval: this.currentStageIndex === 0 ? 1.6 : Math.max(0.6, 1.2 - this.currentStageIndex * 0.06),
      patternTimer: 0,
      behavior: 'BOSS_PATTERN',
      isGroundOrSea: false,
      rotation: 0,
      isBoss: true,
      bossPhase: 1,
      bossName,
      parts,
    });
  }

  // Update Enemies AI & Bullet Fire Patterns
  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.patternTimer += dt;
      e.shootTimer += dt;
      if (e.hitFlash) e.hitFlash = Math.max(0, e.hitFlash - dt);

      // Rotate ground/sea battery barrels towards player
      if (e.type === 'GROUND_ARTILLERY' || e.type === 'ISLAND_TURRET' || e.type === 'GUNBOAT') {
        e.rotation = Math.atan2(this.player.y - e.y, this.player.x - e.x) - Math.PI / 2;
      }

      // Enemy Movement Patterns
      if (e.behavior === 'BOSS_PATTERN') {
        // Boss fly-in and hovering figure-8 dance
        // (새 보스 그림이 화면 위로 잘리지 않도록 조금 더 아래에서 맴돌아요)
        if (e.y < 140) {
          e.y += e.vy * 40 * dt;
        } else {
          e.x = CANVAS_WIDTH / 2 + Math.sin(e.patternTimer * 0.8) * 100;
          e.y = 140 + Math.cos(e.patternTimer * 1.6) * 30;
        }

        // Aim boss turrets at player
        if (e.parts) {
          for (const p of e.parts) {
            if (!p.isDestroyed) {
              const partX = e.x + p.offsetX;
              const partY = e.y + p.offsetY;
              p.angle = Math.atan2(this.player.y - partY, this.player.x - partX) - Math.PI / 2;

              p.shootTimer += dt;
              if (p.shootTimer >= 1.8) {
                p.shootTimer = 0;
                const angle = Math.atan2(this.player.y - partY, this.player.x - partX);
                this.addEnemyBullet(partX, partY, Math.cos(angle) * 4.2, Math.sin(angle) * 4.2, 'ENEMY_ORB');
                retroAudio.playEnemyShoot();
              }
            }
          }
        }
      } else if (e.behavior === 'HEART_FORMATION_L') {
        e.y += e.vy * 60 * dt;
        e.x -= Math.sin(e.patternTimer * 2.2) * 1.8;
      } else if (e.behavior === 'HEART_FORMATION_R') {
        e.y += e.vy * 60 * dt;
        e.x += Math.sin(e.patternTimer * 2.2) * 1.8;
      } else if (e.behavior === 'V_FORMATION') {
        e.y += e.vy * 60 * dt;
      } else if (e.behavior === 'CIRCLE_DIVE') {
        e.x += e.vx * 60 * dt;
        e.y += e.vy * 60 * dt;
        if (e.patternTimer > 0.6) {
          e.vy += 0.04;
        }
      } else if (e.behavior === 'DART_SWOOP') {
        e.x += e.vx * 60 * dt;
        e.y += e.vy * 60 * dt;
        if (e.patternTimer > 0.4) {
          e.vy += 0.08; // High speed dive acceleration
        }
      } else if (e.behavior === 'SWOOP_LEFT') {
        e.y += e.vy * 60 * dt;
        e.x += Math.sin(e.patternTimer * 3) * 3.5;
      } else if (e.behavior === 'SWOOP_RIGHT') {
        e.y += e.vy * 60 * dt;
        e.x -= Math.sin(e.patternTimer * 3) * 3.5;
      } else if (e.behavior === 'HOVER_RETREAT') {
        if (e.y < 150) {
          e.y += e.vy * 60 * dt;
        } else {
          e.x += Math.sin(e.patternTimer * 1.5) * 1.8;
          e.y += Math.sin(e.patternTimer * 2.0) * 0.4;
        }
      } else if (e.behavior === 'TURRET_AIM') {
        e.y += 1.4 * 60 * dt;
      } else if (e.behavior === 'ZIGZAG') {
        e.x += e.vx * 60 * dt;
        e.y += e.vy * 60 * dt;
        if (e.x < 30 || e.x > CANVAS_WIDTH - 30) e.vx = -e.vx;
      } else {
        e.x += e.vx * 60 * dt;
        e.y += e.vy * 60 * dt;
      }

      // Enemy Shooting logic
      if (e.shootTimer >= e.shootInterval && e.y > 20 && e.y < CANVAS_HEIGHT - 80) {
        e.shootTimer = 0;
        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);

        // Stage & Difficulty Bullet Speed Multipliers (Crisp, engaging arcade pacing)
        const stageSpeedFactor = 0.75 + this.currentStageIndex * 0.12;
        const diffSpeedFactor =
          this.settings.difficulty === 'EASY' ? 0.8 :
          this.settings.difficulty === 'HARD' ? 1.25 :
          this.settings.difficulty === 'INSANE' ? 1.45 : 1.0;
        const bulletSpeed = stageSpeedFactor * diffSpeedFactor;

        if (e.isBoss) {
          // Check Boss Phase 2 Enrage (HP < 40%)
          const isEnraged = e.hp < e.maxHp * 0.4;
          if (isEnraged && e.bossPhase === 1) {
            e.bossPhase = 2;
            this.triggerScreenShake(4.0, 0.35);
            this.addFloatingText(e.x, e.y - 40, 'BOSS PHASE 2: ENRAGED!', '#ef4444');
            retroAudio.playWarning();
          }

          const ringBaseCount = this.currentStageIndex === 0 ? 8 : (8 + this.currentStageIndex * 2);
          const ringCount = isEnraged ? ringBaseCount + 4 : ringBaseCount;
          const spd = (3.2 + this.currentStageIndex * 0.15) * bulletSpeed;

          // 1. Omnidirectional Radial Danmaku Rings
          for (let k = 0; k < ringCount; k++) {
            const spinSpeed = 0.45 + this.currentStageIndex * 0.15;
            const rad = (Math.PI * 2 / ringCount) * k + e.patternTimer * spinSpeed;
            this.addEnemyBullet(e.x, e.y, Math.cos(rad) * spd, Math.sin(rad) * spd, 'ENEMY_ORB', 4);
          }

          // 2. Stage-Specific Heavy Artillery & Secondary Spreads
          const stageIdx = this.currentStageIndex;
          if (stageIdx === 0) {
            // Stage 1: Dual aimed orb cannons
            this.addEnemyBullet(e.x - 20, e.y + 15, Math.cos(angle) * (3.6 * bulletSpeed), Math.sin(angle) * (3.6 * bulletSpeed), 'ENEMY_ORB', 4);
            this.addEnemyBullet(e.x + 20, e.y + 15, Math.cos(angle) * (3.6 * bulletSpeed), Math.sin(angle) * (3.6 * bulletSpeed), 'ENEMY_ORB', 4);
          } else if (stageIdx === 1) {
            // Stage 2: Twin 3-way spread salvos
            for (let k = -1; k <= 1; k++) {
              const spread = angle + k * 0.22;
              this.addEnemyBullet(e.x, e.y + 20, Math.cos(spread) * (4.2 * bulletSpeed), Math.sin(spread) * (4.2 * bulletSpeed), 'ENEMY_NEEDLE', 4);
            }
          } else if (stageIdx === 2) {
            // Stage 3: Flak cannons
            for (let k = -1; k <= 1; k++) {
              const spread = angle + k * 0.25;
              this.addEnemyBullet(e.x - 30, e.y + 20, Math.cos(spread) * (4.5 * bulletSpeed), Math.sin(spread) * (4.5 * bulletSpeed), 'ENEMY_NEEDLE', 4);
              this.addEnemyBullet(e.x + 30, e.y + 20, Math.cos(spread) * (4.5 * bulletSpeed), Math.sin(spread) * (4.5 * bulletSpeed), 'ENEMY_NEEDLE', 4);
            }
          } else if (stageIdx === 3) {
            // Stage 4: 5-way sweeping needle fan
            for (let k = -2; k <= 2; k++) {
              const spread = angle + k * 0.18 + Math.sin(e.patternTimer * 4) * 0.1;
              this.addEnemyBullet(e.x, e.y + 25, Math.cos(spread) * (4.8 * bulletSpeed), Math.sin(spread) * (4.8 * bulletSpeed), 'ENEMY_NEEDLE', 4);
            }
          } else if (stageIdx === 4) {
            // Stage 5: Cyber Neon 4-point cross barrage + rapid aimed needles
            for (let k = 0; k < 4; k++) {
              const crossAng = (Math.PI / 2) * k + e.patternTimer * 1.5;
              this.addEnemyBullet(e.x, e.y, Math.cos(crossAng) * (5.0 * bulletSpeed), Math.sin(crossAng) * (5.0 * bulletSpeed), 'ENEMY_NEEDLE', 5);
            }
            this.addEnemyBullet(e.x, e.y + 20, Math.cos(angle) * (5.2 * bulletSpeed), Math.sin(angle) * (5.2 * bulletSpeed), 'ENEMY_HEAVY', 6);
          } else if (stageIdx === 5) {
            // Stage 6: Orbital laser burst + 3-way double beam
            for (let k = -1; k <= 1; k++) {
              const spread = angle + k * 0.3;
              this.addEnemyBullet(e.x - 35, e.y, Math.cos(spread) * (5.2 * bulletSpeed), Math.sin(spread) * (5.2 * bulletSpeed), 'ENEMY_ORB', 5);
              this.addEnemyBullet(e.x + 35, e.y, Math.cos(spread) * (5.2 * bulletSpeed), Math.sin(spread) * (5.2 * bulletSpeed), 'ENEMY_ORB', 5);
            }
          } else if (stageIdx === 6) {
            // Stage 7: Storm Ocean lightning burst
            for (let k = -3; k <= 3; k++) {
              const spread = angle + k * 0.15;
              this.addEnemyBullet(e.x, e.y + 20, Math.cos(spread) * (5.4 * bulletSpeed), Math.sin(spread) * (5.4 * bulletSpeed), 'ENEMY_NEEDLE', 4);
            }
          } else if (stageIdx === 7) {
            // Stage 8: Floating Islands Blossom
            for (let k = 0; k < 8; k++) {
              const blAng = (Math.PI * 2 / 8) * k - e.patternTimer * 2.0;
              this.addEnemyBullet(e.x, e.y, Math.cos(blAng) * (4.2 * bulletSpeed), Math.sin(blAng) * (4.2 * bulletSpeed), 'ENEMY_ORB', 5);
            }
          } else if (stageIdx === 8) {
            // Stage 9: Glacier Frost Spiral
            for (let k = -2; k <= 2; k++) {
              const sp = angle + k * 0.2 + Math.cos(e.patternTimer * 3) * 0.15;
              this.addEnemyBullet(e.x, e.y + 20, Math.cos(sp) * (5.5 * bulletSpeed), Math.sin(sp) * (5.5 * bulletSpeed), 'ENEMY_HEAVY', 6);
            }
          } else {
            // Stage 10: Final Nebula Apocalypse Apex Danmaku
            for (let k = -3; k <= 3; k++) {
              const spread = angle + k * 0.14 + Math.sin(e.patternTimer * 5) * 0.12;
              this.addEnemyBullet(e.x, e.y + 25, Math.cos(spread) * (5.8 * bulletSpeed), Math.sin(spread) * (5.8 * bulletSpeed), 'ENEMY_HEAVY', 6);
            }
            if (isEnraged) {
              for (let k = 0; k < 12; k++) {
                const rad = (Math.PI * 2 / 12) * k - e.patternTimer * 3.0;
                this.addEnemyBullet(e.x, e.y, Math.cos(rad) * (3.8 * bulletSpeed), Math.sin(rad) * (3.8 * bulletSpeed), 'ENEMY_NEEDLE', 4);
              }
            }
          }
          retroAudio.playEnemyShoot();
        } else if (e.type === 'GROUND_ARTILLERY') {
          if (this.currentStageIndex === 0) {
            // Stage 1: Single slow aimed cannon shot
            this.addEnemyBullet(e.x, e.y, Math.cos(angle) * (3.2 * bulletSpeed), Math.sin(angle) * (3.2 * bulletSpeed), 'ENEMY_ORB', 4);
          } else {
            // Heavy Ground Howitzer Shell + radial flak burst in later stages
            const artSpd = 5.2 * bulletSpeed;
            this.addEnemyBullet(e.x, e.y, Math.cos(angle) * artSpd, Math.sin(angle) * artSpd, 'ENEMY_HEAVY', 6);
            for (let f = 0; f < 6; f++) {
              const flakAngle = (Math.PI * 2 / 6) * f + e.patternTimer * 0.5;
              this.addEnemyBullet(e.x, e.y, Math.cos(flakAngle) * (2.8 * bulletSpeed), Math.sin(flakAngle) * (2.8 * bulletSpeed), 'ENEMY_ORB', 4);
            }
          }
          retroAudio.playEnemyShoot();
        } else if (e.type === 'ISLAND_TURRET') {
          if (this.currentStageIndex === 0) {
            // Stage 1: Single slow aimed orb
            this.addEnemyBullet(e.x, e.y, Math.cos(angle) * (2.6 * bulletSpeed), Math.sin(angle) * (2.6 * bulletSpeed), 'ENEMY_ORB', 4);
          } else {
            // 4-way rotating cross spread + aimed needle
            for (let c = 0; c < 4; c++) {
              const crossAngle = (Math.PI / 2) * c + e.patternTimer * 1.2;
              this.addEnemyBullet(e.x, e.y, Math.cos(crossAngle) * (3.5 * bulletSpeed), Math.sin(crossAngle) * (3.5 * bulletSpeed), 'ENEMY_ORB', 4);
            }
            this.addEnemyBullet(e.x, e.y, Math.cos(angle) * (4.2 * bulletSpeed), Math.sin(angle) * (4.2 * bulletSpeed), 'ENEMY_NEEDLE', 4);
          }
          retroAudio.playEnemyShoot();
        } else if (e.type === 'GUNBOAT') {
          // Twin naval broadside cannons
          const b1 = angle - 0.18;
          const b2 = angle + 0.18;
          this.addEnemyBullet(e.x - 12, e.y, Math.cos(b1) * (3.6 * bulletSpeed), Math.sin(b1) * (3.6 * bulletSpeed), 'ENEMY_ORB', 4);
          this.addEnemyBullet(e.x + 12, e.y, Math.cos(b2) * (3.6 * bulletSpeed), Math.sin(b2) * (3.6 * bulletSpeed), 'ENEMY_ORB', 4);
          retroAudio.playEnemyShoot();
        } else if (e.type === 'SCOUT_DART') {
          // Gentle forward needle in early stage
          const dartSpd = (this.currentStageIndex === 0 ? 3.4 : 5.2) * bulletSpeed;
          this.addEnemyBullet(e.x, e.y, 0, dartSpd, 'ENEMY_NEEDLE', 4);
          retroAudio.playEnemyShoot();
        } else if (e.type === 'HEAVY_BOMBER') {
          // Sweeping needle fan
          const fanCount = this.currentStageIndex === 0 ? 3 : 5;
          const fanHalf = Math.floor(fanCount / 2);
          for (let k = -fanHalf; k <= fanHalf; k++) {
            const spreadAngle = angle + k * 0.22;
            this.addEnemyBullet(e.x, e.y + 10, Math.cos(spreadAngle) * (3.4 * bulletSpeed), Math.sin(spreadAngle) * (3.4 * bulletSpeed), 'ENEMY_NEEDLE', 4);
          }
          retroAudio.playEnemyShoot();
        } else if (e.type === 'FIGHTER_RED') {
          if (this.currentStageIndex === 0) {
            // Stage 1: Single aimed orb
            this.addEnemyBullet(e.x, e.y, Math.cos(angle) * (3.6 * bulletSpeed), Math.sin(angle) * (3.6 * bulletSpeed), 'ENEMY_ORB', 4);
          } else {
            // 3-way aimed cone spread
            for (let k = -1; k <= 1; k++) {
              const spread = angle + k * 0.20;
              this.addEnemyBullet(e.x, e.y, Math.cos(spread) * (4.2 * bulletSpeed), Math.sin(spread) * (4.2 * bulletSpeed), 'ENEMY_ORB', 4);
            }
          }
          retroAudio.playEnemyShoot();
        } else if (e.type === 'SCOUT_ORANGE' || e.type === 'STEALTH_JET') {
          // Direct aimed shot
          const shotSpd = (e.type === 'STEALTH_JET' ? 4.5 : 3.8) * bulletSpeed;
          this.addEnemyBullet(e.x, e.y, Math.cos(angle) * shotSpd, Math.sin(angle) * shotSpd, 'ENEMY_ORB', 4);
          retroAudio.playEnemyShoot();
        }
      }

      // Check collision with Player body (Ramming damage)
      // Check 1P
      if (this.player.lives > 0 && !this.player.isInvincible && !this.player.isLooping) {
        const dist = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (dist < (e.width + this.player.width) * 0.32) {
          this.playerHit(1);
        }
      }
      // Check 2P
      if (this.player2 && this.player2.lives > 0 && !this.player2.isInvincible && !this.player2.isLooping) {
        const dist = Math.hypot(e.x - this.player2.x, e.y - this.player2.y);
        if (dist < (e.width + this.player2.width) * 0.32) {
          this.playerHit(2);
        }
      }

      // Despawn if fallen off bottom
      if (!e.isBoss && (e.y > CANVAS_HEIGHT + 60 || e.x < -60 || e.x > CANVAS_WIDTH + 60)) {
        this.enemies.splice(i, 1);
      }
    }
  }

  // Update Enemy Bullets & Check Player Collision
  private updateEnemyBullets(dt: number) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.x += eb.vx * 60 * dt;
      eb.y += eb.vy * 60 * dt;

      // Remove out of screen bullets
      if (eb.y < -20 || eb.y > CANVAS_HEIGHT + 20 || eb.x < -20 || eb.x > CANVAS_WIDTH + 20) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Player 1 Collision with bullet
      if (this.player.lives > 0 && !this.player.isInvincible && !this.player.isLooping) {
        const dist = Math.hypot(eb.x - this.player.x, eb.y - this.player.y);
        if (dist < eb.radius + this.player.hitboxRadius) {
          this.enemyBullets.splice(i, 1);
          this.playerHit(1);
          continue;
        }
      }

      // Player 2 Collision with bullet
      if (this.player2 && this.player2.lives > 0 && !this.player2.isInvincible && !this.player2.isLooping) {
        const dist = Math.hypot(eb.x - this.player2.x, eb.y - this.player2.y);
        if (dist < eb.radius + this.player2.hitboxRadius) {
          this.enemyBullets.splice(i, 1);
          this.playerHit(2);
          continue;
        }
      }
    }
  }

  // Handle Player Damage / Loss of Life
  private playerHit(playerNum: 1 | 2 = 1) {
    const p = playerNum === 2 ? this.player2 : this.player;
    if (!p || p.lives <= 0) return;

    p.lives--;
    p.powerLevel = Math.max(1, p.powerLevel - 1);
    p.options = Math.max(0, p.options - 1);
    p.isInvincible = true;
    p.invincibleTimer = 3.5;

    // Clear danger bullets near the player upon respawn/hit to prevent immediate death traps
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      if (Math.hypot(eb.x - p.x, eb.y - p.y) < 180) {
        this.enemyBullets.splice(i, 1);
      }
    }

    this.triggerScreenShake(5.0, 0.3);
    this.createExplosion(p.x, p.y, 22, playerNum === 2 ? '#ef4444' : '#38bdf8');
    retroAudio.playExplosion('LARGE');

    // Scatter recovery power-up
    this.spawnItem(p.x, p.y - 40, 'POWER_UP');
  }

  // Destroy Enemy and Roll Item Drop
  private destroyEnemy(e: Enemy, index: number, hitByPlayerNum: 1 | 2 = 1) {
    this.enemies.splice(index, 1);
    this.stats.enemiesDestroyed++;
    this.addScore(e.scoreValue, hitByPlayerNum);

    // Explosions
    const size = e.isBoss ? 35 : e.type === 'HEAVY_BOMBER' ? 22 : 12;
    this.createExplosion(e.x, e.y, size, e.color || '#f97316');
    retroAudio.playExplosion(e.isBoss ? 'BOSS' : e.type === 'HEAVY_BOMBER' ? 'LARGE' : 'SMALL');

    if (e.isBoss) {
      this.bossDefeated = true;
      // Clear all active enemy bullets on screen when boss is defeated
      this.enemyBullets = [];
      // Multi-point catastrophic chain explosions across the giant spaceship hull
      for (let k = 0; k < 8; k++) {
        const ox = (Math.random() - 0.5) * (e.width * 0.8);
        const oy = (Math.random() - 0.5) * (e.height * 0.8);
        this.createExplosion(e.x + ox, e.y + oy, 28, '#f59e0b');
      }
      this.screenShakeTime = 0.6;
      this.screenShakeIntensity = 12;
      this.addFloatingText(e.x, e.y - 30, '★ MOTHERSHIP DESTROYED! ★', '#fbbf24');
      // Drop multiple high-value rewards
      for (let k = 0; k < 8; k++) {
        this.spawnItem(e.x + (Math.random() - 0.5) * 120, e.y + (Math.random() - 0.5) * 80, 'MEDAL');
      }
      this.spawnItem(e.x - 30, e.y, 'POWER_UP');
      this.spawnItem(e.x + 30, e.y, 'BOMB');
      return;
    }

    // Item Drop RNG (Extra generous in Stage 1)
    const roll = Math.random();
    const isStage1 = this.currentStageIndex === 0;
    const powerUpChance = isStage1 ? 0.26 : 0.14;
    const bombChance = isStage1 ? 0.18 : 0.10;
    const optionChance = isStage1 ? 0.16 : 0.08;
    const medalChance = isStage1 ? 0.35 : 0.40;

    if (roll < powerUpChance) {
      this.spawnItem(e.x, e.y, 'POWER_UP');
    } else if (roll < powerUpChance + bombChance) {
      this.spawnItem(e.x, e.y, 'BOMB');
    } else if (roll < powerUpChance + bombChance + optionChance) {
      this.spawnItem(e.x, e.y, 'OPTION');
    } else if (roll < powerUpChance + bombChance + optionChance + medalChance) {
      this.spawnItem(e.x, e.y, 'MEDAL');
    }
  }

  // Spawn Collectible Power-Up Item
  private spawnItem(x: number, y: number, type: PowerUpItem['type']) {
    this.items.push({
      id: `item_${this.nextItemId++}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 2.0,
      vy: 1.4,
      type,
      medalTier: 1,
      timer: 0,
      blinkTimer: 0,
    });
  }

  // Update Collectible Items
  private updateItems(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.timer += dt;
      item.x += item.vx * 40 * dt;
      item.y += item.vy * 40 * dt;

      // Bounce off screen walls
      if (item.x < 20 || item.x > CANVAS_WIDTH - 20) item.vx = -item.vx;

      // Check Collection by Player 1 (Generous 48px attraction distance)
      if (this.player.lives > 0) {
        const dist1 = Math.hypot(item.x - this.player.x, item.y - this.player.y);
        if (dist1 < 48) {
          this.collectItem(item, 1);
          this.items.splice(i, 1);
          continue;
        }
      }

      // Check Collection by Player 2 (Generous 48px attraction distance)
      if (this.player2 && this.player2.lives > 0) {
        const dist2 = Math.hypot(item.x - this.player2.x, item.y - this.player2.y);
        if (dist2 < 48) {
          this.collectItem(item, 2);
          this.items.splice(i, 1);
          continue;
        }
      }

      if (item.y > CANVAS_HEIGHT + 30) {
        this.items.splice(i, 1);
      }
    }
  }

  // Collect Power-up / Medal Item
  private collectItem(item: PowerUpItem, playerNum: 1 | 2 = 1) {
    const p = playerNum === 2 ? this.player2 : this.player;
    if (!p) return;

    if (item.type === 'POWER_UP') {
      if (p.powerLevel < 5) {
        p.powerLevel++;
        this.addFloatingText(item.x, item.y - 15, `${playerNum}P POWER UP Lv.${p.powerLevel}!`, '#facc15');
      } else {
        this.addScore(5000, playerNum);
        this.addFloatingText(item.x, item.y - 15, `${playerNum}P MAX POWER BONUS! +5000`, '#fbbf24');
      }
      retroAudio.playPowerUp();
    } else if (item.type === 'BOMB') {
      p.bombs = Math.min(5, p.bombs + 1);
      this.addFloatingText(item.x, item.y - 15, `${playerNum}P BOMB +1`, '#38bdf8');
      retroAudio.playPowerUp();
    } else if (item.type === 'OPTION') {
      p.options = Math.min(2, p.options + 1);
      this.addFloatingText(item.x, item.y - 15, `${playerNum}P ESCORT DRONE +1`, '#22d3ee');
      retroAudio.playPowerUp();
    } else if (item.type === 'MEDAL') {
      this.stats.medalsCollected++;
      const pts = 500;
      this.addScore(pts, playerNum);
      this.addFloatingText(item.x, item.y - 15, `+${pts}`, '#fde047');
      retroAudio.playMedal(item.medalTier);
    }
  }

  // Update Particles & Floating Text
  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      t.y += t.vy * 60 * dt;
      t.alpha = Math.max(0, t.life / 1.0);
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Trigger Screen Shake (Controlled and stabilized)
  public triggerScreenShake(intensity: number = 4.0, duration: number = 0.3) {
    if (!this.settings.screenShake) return;
    this.screenShakeIntensity = Math.min(intensity, 5.0);
    this.screenShakeTime = Math.min(duration, 0.35);
  }

  // Add Score
  public addScore(points: number, playerNum: 1 | 2 = 1) {
    if (playerNum === 2 && this.player2) {
      this.player2.score += points;
      this.stats.player2Score = this.player2.score;
    } else {
      this.player.score += points;
      this.stats.player1Score = this.player.score;
      this.stats.score = this.player.score;
    }
  }

  // Add Floating Text
  public addFloatingText(x: number, y: number, text: string, color: string = '#ffffff') {
    this.floatingTexts.push({
      id: `ft_${this.nextTextId++}`,
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -0.8,
      life: 1.0,
    });
  }

  // Create Explosion Particles
  public createExplosion(x: number, y: number, count: number, baseColor: string) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      const life = 0.3 + Math.random() * 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 6,
        color: Math.random() > 0.4 ? baseColor : '#ffffff',
        alpha: 1.0,
        life,
        maxLife: life,
        shape: Math.random() > 0.5 ? 'SQUARE' : 'CIRCLE',
      });
    }
  }

  // Create Bullet Hit Sparks
  public createHitSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 3.0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color,
        alpha: 1.0,
        life: 0.15,
        maxLife: 0.15,
        shape: 'SPARK',
      });
    }
  }

  // Find Nearest Target for Homing Missiles
  private findNearestEnemy(x: number, y: number): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    for (const e of this.enemies) {
      if (e.y < 0) continue; // Don't target off-screen
      const dist = Math.hypot(e.x - x, e.y - y);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    }
    return nearest;
  }
}
