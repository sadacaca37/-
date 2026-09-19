// Full Super Mario Game Engine: Physics, Mechanics, Power-Ups, Vehicles & Co-op

import {
  GameState,
  PlayerMode,
  Player,
  Block,
  Enemy,
  ItemEntity,
  Projectile,
  YoshiTongue,
  Particle,
  StageData,
  KeyControls,
  PowerUpType,
  VehicleType,
  CharacterType,
} from '../types';
import { getStageData } from './stages';
import { sound } from './audio';

export class GameEngine {
  public state: GameState = 'MENU';
  public mode: PlayerMode = '1P';
  public currentStageId: number = 1;
  public stageData: StageData;
  public players: Player[] = [];
  public blocks: Block[] = [];
  public enemies: Enemy[] = [];
  public items: ItemEntity[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public yoshiTongues: YoshiTongue[] = [];

  public cameraX: number = 0;
  public cameraY: number = 0;
  public viewportWidth: number = 800;
  public viewportHeight: number = 480;

  public timeRemaining: number = 300;
  public isTimerActive: boolean = false;
  public stageClearTimer: number = 0;
  public gameOverTimer: number = 0;

  public totalCoins: number = 0;
  public totalScore: number = 0;
  public gameStartTime: number = 0;
  public gameElapsedTime: number = 0;

  public bossDefeated: boolean = false;
  public p1Character: CharacterType = 'mario';
  public p2Character: CharacterType = 'luigi';

  public isBridgeCollapsing: boolean = false;
  public bridgeCollapseTimer: number = 0;
  public bridgeBlocksToCollapse: Block[] = [];
  public screenShake: number = 0;

  // Boss Alert & Cutscene System (Stage 10)
  public isCutsceneActive: boolean = false;
  public cutsceneTimer: number = 0;
  public bossAlertFlash: boolean = false;
  public bowserIntroDone: boolean = false;

  // Stage Clear & Flagpole Animation Properties
  public stageClearSkyHueShift: number = 0;
  public stageClearScoreBonus: number = 0;
  public stageClearFireworksCount: number = 0;

  constructor() {
    this.stageData = getStageData(1);
  }

  public setCharacters(p1: CharacterType, p2: CharacterType = 'luigi') {
    this.p1Character = p1;
    this.p2Character = p2;
    if (this.players[0]) this.players[0].character = p1;
    if (this.players[1]) this.players[1].character = p2;
  }

  public initGame(mode: PlayerMode, stageId: number = 1) {
    this.mode = mode;
    this.currentStageId = stageId;
    this.totalScore = 0;
    this.totalCoins = 0;
    this.gameStartTime = Date.now();
    this.loadStage(stageId);
  }

  public loadStage(stageId: number) {
    this.currentStageId = stageId;
    this.stageData = JSON.parse(JSON.stringify(getStageData(stageId))); // Deep clone
    this.blocks = this.stageData.blocks;
    this.enemies = this.stageData.enemies;
    this.items = this.stageData.items;
    this.projectiles = [];
    this.particles = [];
    this.timeRemaining = this.stageData.timeLimit;
    this.isTimerActive = true;
    this.stageClearTimer = 0;
    this.gameOverTimer = 0;
    this.stageClearSkyHueShift = 0;
    this.stageClearScoreBonus = 0;
    this.stageClearFireworksCount = 0;
    this.bossDefeated = false;
    this.isBridgeCollapsing = false;
    this.bridgeCollapseTimer = 0;
    this.bridgeBlocksToCollapse = [];
    this.screenShake = 0;
    this.cameraX = 0;
    this.cameraY = 0;

    // Initialize players with chosen character
    this.players = [
      this.createPlayer(1, this.p1Character, this.stageData.playerSpawn.x, this.stageData.playerSpawn.y),
    ];

    if (this.mode === '2P') {
      this.players.push(
        this.createPlayer(2, this.p2Character, this.stageData.player2Spawn.x, this.stageData.player2Spawn.y)
      );
    }

    this.yoshiTongues = [
      {
        active: false,
        playerId: 1,
        x: 0,
        y: 0,
        length: 0,
        maxLength: 60,
        state: 'extending',
        facing: 'right',
      },
      {
        active: false,
        playerId: 2,
        x: 0,
        y: 0,
        length: 0,
        maxLength: 60,
        state: 'extending',
        facing: 'right',
      },
    ];

    // Check if stage has boss
    if (this.stageData.id === 10 || this.stageData.bossArena) {
      this.isCutsceneActive = true;
      this.cutsceneTimer = 0;
      this.bossAlertFlash = true;
      this.bowserIntroDone = false;
      sound.playBossAlert();
      // Position Bowser initially offscreen or high up for dramatic ground stomp
      const bowser = this.enemies.find((e) => e.type === 'bowser');
      if (bowser) {
        bowser.x = 840;
        bowser.y = -100; // Drops from sky!
        bowser.vy = 0;
      }
    } else {
      this.isCutsceneActive = false;
      this.cutsceneTimer = 0;
      this.bossAlertFlash = false;
      this.bowserIntroDone = true;
    }

    // Play appropriate BGM for theme
    let bgmTheme: 'overworld' | 'underground' | 'sky' | 'castle' | 'boss' = 'overworld';
    if (this.stageData.theme === 'underground') bgmTheme = 'underground';
    else if (this.stageData.theme === 'sky' || this.stageData.theme === 'canyon') bgmTheme = 'sky';
    else if (this.stageData.theme === 'lava' || this.stageData.theme === 'mountain') bgmTheme = 'castle';
    else if (this.stageData.theme === 'boss_castle') bgmTheme = 'boss';

    sound.playBgm(bgmTheme);
    this.state = 'PLAYING';
  }

  private createPlayer(id: number, character: CharacterType, x: number, y: number): Player {
    return {
      id,
      character,
      x,
      y,
      vx: 0,
      vy: 0,
      width: 24,
      height: 32,
      facing: 'right',
      isGrounded: false,
      isJumping: false,
      isCrouching: false,
      isGliding: false,
      isPropellerSpinning: false,
      propellerTimer: 0,
      canDoubleJump: true,
      flutterTimer: 0,
      isFluttering: false,
      isDeadBonesDucking: false,
      deadBonesTimer: 0,
      powerUp: 'none',
      vehicle: 'none',
      invincibleTimer: 0,
      starmanTimer: 0,
      lives: 3,
      coins: 0,
      score: 0,
      chargeTimer: 0,
      isCharging: false,
      isDead: false,
      deathTimer: 0,
      walkFrame: 0,
      animTimer: 0,
      respawnBubbleTimer: 0,
    };
  }

  // Update Game Loop (called ~60fps)
  public update(keys: KeyControls, dt: number = 1 / 60) {
    if (this.state !== 'PLAYING' && this.state !== 'STAGE_CLEAR' && this.state !== 'GAME_OVER') return;

    // Handle Boss Alert & Cutscene Sequence
    if (this.isCutsceneActive) {
      this.cutsceneTimer += 1;

      // During alert cutscene, update bowser landing & screen shakes
      const bowser = this.enemies.find((e) => e.type === 'bowser');
      if (bowser && !this.bowserIntroDone) {
        if (this.cutsceneTimer < 60) {
          // Camera centers on bridge arena
          this.cameraX += (600 - this.cameraX) * 0.08;
        } else if (this.cutsceneTimer < 120) {
          // Bowser drops rapidly from the sky!
          bowser.vy += 0.55;
          bowser.y += bowser.vy;
          if (bowser.y >= 316) {
            bowser.y = 316;
            bowser.vy = 0;
            bowser.isGrounded = true;
            this.bowserIntroDone = true;
            this.screenShake = 16;
            sound.playBump();
            sound.playBossRoar();
            this.addSmokePuff(bowser.x - 10, bowser.y + bowser.height - 8);
            this.addSmokePuff(bowser.x + bowser.width + 10, bowser.y + bowser.height - 8);
            this.addFloatingText('🔥 ROAAAR!! 🔥', bowser.x, bowser.y - 24, '#ff3300');
          }
        }
      }

      // Cutscene completes around ~150 frames (~2.5s)
      if (this.cutsceneTimer > 150) {
        this.isCutsceneActive = false;
        this.bossAlertFlash = false;
      }

      // Update Particles & Camera during cutscene
      this.updateParticles();
      if (this.screenShake > 0) {
        this.screenShake *= 0.9;
        if (this.screenShake < 0.2) this.screenShake = 0;
      }
      this.updateCamera();
      return;
    }

    // Handle timer countdown
    if (this.isTimerActive && this.state === 'PLAYING') {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.killAllPlayers();
      }
    }

    // Update Players
    this.players.forEach((player) => {
      this.updatePlayer(player, keys);
    });

    // Update Yoshi Tongues
    this.updateYoshiTongues();

    // Update Blocks (bump physics & moving platforms)
    this.updateBlocks();

    // Update Enemies
    this.updateEnemies();

    // Update Items
    this.updateItems();

    // Update Projectiles
    this.updateProjectiles();

    // Update Particles
    this.updateParticles();

    // Update Bridge Collapse sequence (Stage 10 Axe Trigger)
    if (this.isBridgeCollapsing) {
      this.updateBridgeCollapse();
    }

    // Check Stage Clear & Victory conditions
    this.checkStageProgress();

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    // Update Camera
    this.updateCamera();
  }

  private updatePlayer(player: Player, keys: KeyControls) {
    if (player.isDead) {
      player.deathTimer += 1;
      player.vy += 0.3;
      player.y += player.vy;

      // When death animation completes (~90 frames)
      if (player.deathTimer > 90) {
        if (player.lives > 0) {
          // Respawn player
          player.isDead = false;
          player.deathTimer = 0;
          player.x = this.stageData.playerSpawn.x;
          player.y = this.stageData.playerSpawn.y;
          player.vx = 0;
          player.vy = 0;
          player.powerUp = 'none';
          player.vehicle = 'none';
          player.height = 32;
          player.invincibleTimer = 120;

          // Resume stage background music
          const bgmType =
            this.stageData.theme === 'underground'
              ? 'underground'
              : this.stageData.theme === 'boss_castle' || this.stageData.theme === 'lava'
              ? 'castle'
              : this.stageData.theme === 'sky' || this.stageData.theme === 'canyon'
              ? 'sky'
              : 'overworld';
          sound.playBgm(bgmType);
        } else {
          // All lives exhausted -> Game Over
          if (this.state !== 'GAME_OVER') {
            this.handleGameOver();
          }
        }
      }
      return;
    }

    const isP1 = player.id === 1;
    const keyLeft = isP1 ? keys.p1Left : keys.p2Left;
    const keyRight = isP1 ? keys.p1Right : keys.p2Right;
    const keyUp = isP1 ? keys.p1Up : keys.p2Up;
    const keyDown = isP1 ? keys.p1Down : keys.p2Down;
    const keyJump = isP1 ? keys.p1Jump : keys.p2Jump;
    const keyAttack = isP1 ? keys.p1Attack : keys.p2Attack;

    // Handle Stage Clear Flagpole Slide & Walk Animation
    if (this.state === 'STAGE_CLEAR') {
      const pole = this.blocks.find((b) => b.type === 'flagpole');
      if (player.isSlidingPole) {
        player.vx = 0;
        player.vy = 0;
        // Slide down the pole smoothly
        player.y += 3.2;

        // Slide the flag down synchronously with player
        if (pole) {
          if (pole.flagY === undefined) pole.flagY = pole.y + 4;
          pole.flagY = Math.min(pole.y + pole.height - 32, pole.flagY + 3.2);
        }

        const bottomY = pole ? pole.y + pole.height - player.height : 368;
        if (player.y >= bottomY) {
          player.y = bottomY;
          player.isSlidingPole = false;
          player.isEnteringCastle = true;
          player.facing = 'right';
          player.vx = 2.2;
          player.vy = -3.8; // Hop off pole to the right
          player.isGrounded = false;
          sound.playBump();
          sound.playStageClear();
          this.addConfettiRain(35);
          this.addFloatingText('★ STAGE CLEAR! ★', player.x - 16, player.y - 44, '#ffff00');
        }
      } else if (player.isEnteringCastle) {
        // Player hops and walks towards castle / right side
        player.x += player.vx;
        player.walkFrame += 0.25;

        if (!player.isGrounded) {
          player.vy += 0.45;
          player.y += player.vy;
          for (const block of this.blocks) {
            if (block.type === 'ground' || block.type === 'hard_block') {
              if (this.checkOverlap(player, block) && player.vy > 0) {
                player.y = block.y - player.height;
                player.vy = 0;
                player.isGrounded = true;
              }
            }
          }
        }

        // After walking past the flagpole, stop and celebrate
        if (pole && player.x > pole.x + 130) {
          player.vx = 0;
          if (this.stageClearTimer % 12 === 0) {
            this.addStarSparkle(player.x + Math.random() * 30 - 15, player.y - Math.random() * 20);
          }
        }
      }
      return;
    }

    // Timers decrement
    if (player.invincibleTimer > 0) player.invincibleTimer -= 1;
    if (player.starmanTimer > 0) {
      player.starmanTimer -= 1;
      if (player.starmanTimer === 0) {
        sound.playBgm(this.stageData.theme === 'boss_castle' ? 'boss' : 'overworld');
      }
    }
    if (player.deadBonesTimer > 0) player.deadBonesTimer -= 1;

    // Dry Bones Shell "Play Dead" Mode
    if (player.vehicle === 'dry_bones_shell' && keyDown && player.isGrounded) {
      player.isDeadBonesDucking = true;
      player.deadBonesTimer = 180; // 3 seconds invulnerability
      player.vx = 0;
      return;
    } else {
      player.isDeadBonesDucking = false;
    }

    // Vehicle: Clown Car Free Flight Mechanics
    if (player.vehicle === 'clown_car' || player.vehicle === 'fire_clown_car') {
      const flightSpeed = 3.5;
      if (keyLeft) {
        player.vx = -flightSpeed;
        player.facing = 'left';
      } else if (keyRight) {
        player.vx = flightSpeed;
        player.facing = 'right';
      } else {
        player.vx *= 0.85;
      }

      if (keyUp) {
        player.vy = -flightSpeed;
      } else if (keyDown) {
        player.vy = flightSpeed;
      } else {
        player.vy *= 0.85;
      }

      player.x += player.vx;
      player.y += player.vy;

      // Bound within level
      player.x = Math.max(0, Math.min(this.stageData.width - player.width, player.x));
      player.y = Math.max(0, Math.min(this.stageData.height - player.height, player.y));

      // Clown Car Fireball Charge Shot
      if (keyAttack) {
        player.isCharging = true;
        player.chargeTimer += 1;
        if (player.chargeTimer === 40) {
          sound.playChargeFire();
        }
      } else if (player.isCharging) {
        // Release shot!
        if (player.chargeTimer >= 40) {
          this.shootChargeFireball(player);
        } else {
          this.shootFireball(player);
        }
        player.isCharging = false;
        player.chargeTimer = 0;
      }
      return;
    }

    // Standard Platformer Physics with Character Perks
    let accel = 0.35;
    let maxSpeed = 4.4;
    let baseJump = -9.6; // Refined jump height: easily clears 48-64px obstacle pipes and 80px platforms
    const friction = 0.85;
    let gravity = this.stageData.gravity;

    // Running / Dash boost if holding attack key or moving continuously
    const isRunning = keyAttack || Math.abs(player.vx) > 2.8;
    if (isRunning) {
      accel = 0.45;
      maxSpeed = 5.2;
    }

    if (player.character === 'toad') {
      maxSpeed = isRunning ? 5.6 : 4.6; // Toad runs faster
      accel = 0.40;
      baseJump = -9.2;
    } else if (player.character === 'luigi') {
      baseJump = -10.2; // Luigi jumps highest with gentle air time
      gravity *= 0.94;
    } else if (player.character === 'peach') {
      baseJump = -9.4;
      maxSpeed = isRunning ? 5.0 : 4.2;
    } else if (player.character === 'yoshi') {
      baseJump = -9.6;
      maxSpeed = isRunning ? 5.3 : 4.4;
    }

    // Horizontal Movement
    if (!player.isCrouching) {
      if (keyLeft) {
        player.vx -= accel;
        player.facing = 'left';
        if (player.isGrounded) player.walkFrame += 0.22;
      } else if (keyRight) {
        player.vx += accel;
        player.facing = 'right';
        if (player.isGrounded) player.walkFrame += 0.22;
      } else {
        player.vx *= friction;
        if (Math.abs(player.vx) < 0.05) player.vx = 0;
      }
    } else {
      // Crouching slide friction
      player.vx *= 0.93;
      if (Math.abs(player.vx) < 0.05) player.vx = 0;
    }
    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));

    // Coyote Time & Jump Buffer timers
    if (player.isGrounded) {
      player.coyoteTimer = 6; // 6 frames of grace after leaving ground
      player.peachFloatTimer = 0;
    } else {
      player.coyoteTimer = Math.max(0, (player.coyoteTimer ?? 0) - 1);
    }

    if (keyJump) {
      player.jumpBufferTimer = 5;
    } else {
      player.jumpBufferTimer = Math.max(0, (player.jumpBufferTimer ?? 0) - 1);
    }

    // Crouching / Ducking
    const isDuckKey = keyDown;
    if (isDuckKey && player.isGrounded && player.vehicle === 'none') {
      player.isCrouching = true;
      player.height = 24;
    } else {
      if (player.isCrouching) {
        player.isCrouching = false;
        player.height = player.powerUp === 'none' && player.vehicle === 'none' ? 32 : 48;
      }
    }

    // Jumping & Special Abilities
    const canInitiateJump = (player.isGrounded || (player.coyoteTimer ?? 0) > 0) && !player.isJumping;

    if (keyJump) {
      if (canInitiateJump) {
        player.isGrounded = false;
        player.coyoteTimer = 0;
        player.isJumping = true;
        player.vy = baseJump;
        player.canDoubleJump = true;
        player.flutterTimer = 0;
        player.peachFloatTimer = 0;
        sound.playJump(player.powerUp !== 'none');
      } else if (player.powerUp === 'propeller' && player.isJumping && !player.isPropellerSpinning && player.vy > -2) {
        // Propeller Rocket Launch!
        player.isPropellerSpinning = true;
        player.propellerTimer = 75;
        player.vy = -9.2;
        sound.playPropellerWhirl();
        this.addSmokePuff(player.x + player.width / 2, player.y + player.height);
      } else if (player.powerUp === 'squirrel' && !player.isGrounded) {
        if (player.canDoubleJump && player.vy > 0) {
          // Squirrel Air-Pop Boost!
          player.vy = -6.5;
          player.canDoubleJump = false;
          sound.playJump(true);
          this.addStarSparkle(player.x + player.width / 2, player.y + player.height);
        } else {
          // Glide
          player.isGliding = true;
          player.vy = Math.min(player.vy, 1.2);
        }
      } else if ((player.vehicle === 'yoshi' || player.character === 'yoshi') && !player.isGrounded && player.vy > 0) {
        // Yoshi Flutter Jump!
        if (player.flutterTimer < 20) {
          player.isFluttering = true;
          player.flutterTimer += 1;
          player.vy = -3.2;
          if (player.flutterTimer % 6 === 0) sound.playYoshiFlutter();
        }
      } else if (player.character === 'peach' && !player.isGrounded && player.vy > 0.5) {
        // Princess Peach Royal Dress Float! (Gentle controlled hover for ~0.6s)
        if ((player.peachFloatTimer ?? 0) < 36) {
          player.peachFloatTimer = (player.peachFloatTimer ?? 0) + 1;
          player.isGliding = true;
          player.vy = 0.8; // Controlled gentle hover descent
        }
      }
    } else {
      player.isJumping = false;
      player.isGliding = false;
      player.isFluttering = false;
      // Variable jump height cut (quick damping on button release for short hops)
      if (player.vy < -3.0) {
        player.vy *= 0.55;
      }
    }

    // Propeller spinning descent
    if (player.isPropellerSpinning) {
      player.propellerTimer -= 1;
      player.vy = Math.min(player.vy + 0.15, 1.4); // Slow helicopter float
      if (player.propellerTimer <= 0 || player.isGrounded) {
        player.isPropellerSpinning = false;
      }
    } else {
      // Normal Gravity
      player.vy += gravity;
    }

    // Cap falling speed
    player.vy = Math.min(player.vy, 10);

    // Apply Velocities
    player.x += player.vx;
    this.handleHorizontalCollisions(player);

    player.y += player.vy;
    this.handleVerticalCollisions(player);

    // Attack / Special actions
    if (keyAttack) {
      if (player.vehicle === 'yoshi') {
        // Yoshi tongue
        this.triggerYoshiTongue(player);
      } else if (player.powerUp === 'fire') {
        // Shoot fireball
        if (!player.isCharging) {
          this.shootFireball(player);
          player.isCharging = true;
        }
      } else if (!player.isCharging && (player.attackSpinTimer || 0) <= 0) {
        // Mario / Luigi spin tail / melee attack
        this.triggerSpinAttack(player);
        player.isCharging = true;
      }
    } else {
      player.isCharging = false;
    }

    if ((player.attackSpinTimer || 0) > 0) {
      player.attackSpinTimer = (player.attackSpinTimer || 0) - 1;
    }

    // Bound in level
    player.x = Math.max(0, Math.min(this.stageData.width - player.width, player.x));

    // Fall into pit
    if (player.y > this.stageData.height + 40) {
      this.killPlayer(player);
    }
  }

  private handleHorizontalCollisions(player: Player) {
    for (const block of this.blocks) {
      if (block.isDestroyed || block.type === 'lava' || block.type === 'castle_axe') continue;

      if (block.type === 'flagpole' || block.type === 'flag_top') {
        if (this.checkOverlap(player, block)) {
          this.triggerStageClear(player);
        }
        continue;
      }

      if (this.checkOverlap(player, block)) {
        if (player.vx > 0) {
          player.x = block.x - player.width;
          player.vx = 0;
        } else if (player.vx < 0) {
          player.x = block.x + block.width;
          player.vx = 0;
        }
      }
    }
  }

  private handleVerticalCollisions(player: Player) {
    player.isGrounded = false;

    for (const block of this.blocks) {
      if (block.isDestroyed) continue;

      // Special interaction: Lava
      if (block.type === 'lava') {
        if (this.checkOverlap(player, block)) {
          if (player.vehicle === 'dry_bones_shell') {
            // Float on lava safely!
            player.y = block.y - player.height;
            player.vy = 0;
            player.isGrounded = true;
          } else {
            this.killPlayer(player);
          }
        }
        continue;
      }

      // Spikes
      if (block.type === 'spikes') {
        if (this.checkOverlap(player, block)) {
          if (player.vehicle === 'yoshi') {
            // Yoshi can safely bounce on spikes!
            player.y = block.y - player.height;
            player.vy = -6;
            sound.playJump();
          } else {
            this.hitPlayer(player);
          }
        }
        continue;
      }

      // Castle Axe Switch (Stage 10 victory trigger)
      if (block.type === 'castle_axe') {
        if (this.checkOverlap(player, block)) {
          this.triggerAxeCut();
        }
        continue;
      }

      // Flagpole
      if (block.type === 'flagpole' || block.type === 'flag_top') {
        if (this.checkOverlap(player, block)) {
          this.triggerStageClear(player);
        }
        continue;
      }

      if (this.checkOverlap(player, block)) {
        if (player.vy > 0 && player.y + player.height - player.vy <= block.y + 6) {
          // Landing on top of block
          player.y = block.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
          player.flutterTimer = 0;
          player.canDoubleJump = true;
          player.isPropellerSpinning = false;
        } else if (player.vy < 0) {
          // Hitting block from below
          player.y = block.y + block.height;
          player.vy = 0;
          this.bumpBlock(block, player);
        }
      }
    }
  }

  private bumpBlock(block: Block, player: Player) {
    if (block.bumpOffset !== 0) return;

    if (block.type === 'question') {
      block.type = 'question_used';
      block.bumpOffset = -8;
      block.bumpVy = 2;
      sound.playBump();

      if (block.content) {
        this.spawnItem(block.x, block.y - 24, block.content);
      }
    } else if (block.type === 'brick') {
      block.bumpOffset = -6;
      block.bumpVy = 2;

      // Spiny Helmet or Super Mario breaks brick!
      if (player.powerUp === 'spiny_helmet' || player.powerUp !== 'none') {
        block.isDestroyed = true;
        sound.playBlockBreak();
        this.addBrickDebris(block.x, block.y);
        this.addScore(player, 50, block.x, block.y);
      } else {
        sound.playBump();
      }
    } else if (block.type === 'note_block') {
      block.bumpOffset = -10;
      block.bumpVy = 3;
      player.vy = -12; // Massive trampoline jump
      sound.playJump(true);
    }
  }

  private spawnItem(x: number, y: number, type: ItemEntity['type']) {
    if (type === 'coin') {
      this.totalCoins += 1;
      this.addScore(this.players[0], 200, x, y);
      sound.playCoin();
      this.addStarSparkle(x, y);
      return;
    }

    const item: ItemEntity = {
      id: 'item_' + Date.now() + Math.random(),
      x,
      y,
      vx: 1.0,
      vy: -2.8,
      width: 20,
      height: 20,
      type,
      isGrounded: false,
      spawnTimer: 24, // Generous emergence duration so it stays visible & collectible
      lifeTimer: 900, // ~15 seconds on-screen duration before despawning
    };
    this.items.push(item);
    sound.playPowerUp();
  }

  private updateBlocks() {
    this.blocks.forEach((block) => {
      // Block bump bounce return
      if (block.bumpOffset < 0) {
        block.bumpOffset += block.bumpVy;
        if (block.bumpOffset >= 0) {
          block.bumpOffset = 0;
        }
      }

      // Moving platforms
      if (block.type === 'moving_platform') {
        if (block.vx && block.minX !== undefined && block.maxX !== undefined) {
          block.x += block.vx;
          if (block.x <= block.minX || block.x >= block.maxX) {
            block.vx *= -1;
          }
        }
        if (block.vy && block.minY !== undefined && block.maxY !== undefined) {
          block.y += block.vy;
          if (block.y <= block.minY || block.y >= block.maxY) {
            block.vy *= -1;
          }
        }
      }
    });
  }

  private updateEnemies() {
    const stageDifficultyMult = 1 + (this.stageData.id - 1) * 0.08; // Stages 1~10 gradually speed up by up to 72%

    this.enemies.forEach((enemy) => {
      if (enemy.isDead) {
        enemy.deathTimer -= 1;
        return;
      }

      enemy.animTimer += 1;

      // Special Boss AI (King Bowser)
      if (enemy.type === 'bowser') {
        this.updateBowser(enemy);
        return;
      }

      // Dry Bones crumbling recovery
      if (enemy.type === 'dry_bones' && (enemy.bonesCrumpledTimer || 0) > 0) {
        enemy.bonesCrumpledTimer = (enemy.bonesCrumpledTimer || 0) - 1;
        return;
      }

      // Piranha Plant authentic pipe emergence & biting AI
      if (enemy.type === 'piranha_plant') {
        const pipeTopY = enemy.pipeTopY ?? enemy.y;
        const pipeBaseY = enemy.pipeBaseY ?? pipeTopY + 34;
        
        // Find closest player horizontal distance
        const nearestDist = this.players.reduce((minD, p) => {
          if (p.isDead) return minD;
          return Math.min(minD, Math.abs(p.x + p.width / 2 - (enemy.x + enemy.width / 2)));
        }, 9999);

        // State machine initialization
        if (!enemy.plantState) {
          enemy.plantState = 'hidden';
          enemy.plantStateTimer = 40;
          enemy.y = pipeBaseY;
        }

        enemy.plantStateTimer = (enemy.plantStateTimer || 0) - 1;

        if (enemy.plantState === 'hidden') {
          enemy.y = pipeBaseY;
          // Only emerge when player is not standing right on top of pipe (safe ambush distance)
          if (enemy.plantStateTimer <= 0) {
            if (nearestDist > 32) {
              enemy.plantState = 'emerging';
              enemy.plantStateTimer = 28;
            } else {
              enemy.plantStateTimer = 20; // wait while player is too close
            }
          }
        } else if (enemy.plantState === 'emerging') {
          enemy.y = Math.max(pipeTopY, enemy.y - 1.2);
          if (enemy.y <= pipeTopY || enemy.plantStateTimer <= 0) {
            enemy.y = pipeTopY;
            enemy.plantState = 'extended';
            enemy.plantStateTimer = Math.max(45, Math.floor(70 / stageDifficultyMult));
          }
        } else if (enemy.plantState === 'extended') {
          enemy.y = pipeTopY;
          if (enemy.plantStateTimer <= 0) {
            enemy.plantState = 'retreating';
            enemy.plantStateTimer = 28;
          }
        } else if (enemy.plantState === 'retreating') {
          enemy.y = Math.min(pipeBaseY, enemy.y + 1.2);
          if (enemy.y >= pipeBaseY || enemy.plantStateTimer <= 0) {
            enemy.y = pipeBaseY;
            enemy.plantState = 'hidden';
            enemy.plantStateTimer = Math.max(35, Math.floor(60 / stageDifficultyMult));
          }
        }

        // Piranha plant biting hazard interaction with players
        this.players.forEach((player) => {
          if (player.isDead) return;
          // Plant only inflicts damage when sufficiently emerged above pipe top
          if (enemy.y < pipeBaseY - 6 && this.checkOverlap(player, enemy)) {
            if (player.starmanTimer > 0 || player.isDeadBonesDucking) {
              this.defeatEnemy(enemy, player, 'star');
            } else {
              this.hitPlayer(player);
            }
          }
        });

        return;
      }

      // Bullet Bill flying horizontally with stage speed scaling
      if (enemy.type === 'bullet_bill') {
        enemy.x += enemy.vx * Math.min(1.5, stageDifficultyMult);
        return;
      }

      // Hammer Bro jumping and throwing (higher frequency on later stages)
      if (enemy.type === 'hammer_bro') {
        enemy.attackTimer = (enemy.attackTimer || 0) + 1;
        const throwInterval = Math.max(55, Math.floor(90 / stageDifficultyMult));
        if (enemy.attackTimer % throwInterval === 0) {
          this.throwHammer(enemy);
        }
        if (enemy.attackTimer % 110 === 0) {
          enemy.vy = -6.5;
        }
      }

      // Apply Enemy Physics
      enemy.vy += 0.4;
      enemy.y += enemy.vy;

      // Enemy horizontal movement with progressive stage speed
      if (enemy.type === 'koopa_shell' && enemy.isShellSpinning) {
        enemy.x += (enemy.shellSpeed || 5) * 1.1;
      } else {
        enemy.x += enemy.vx * Math.min(1.4, stageDifficultyMult);
      }

      // Enemy collision with solid blocks
      for (const block of this.blocks) {
        if (block.isDestroyed || block.type === 'lava' || block.type === 'flagpole') continue;

        if (this.checkOverlap(enemy, block)) {
          if (enemy.vy > 0 && enemy.y + enemy.height - enemy.vy <= block.y + 6) {
            enemy.y = block.y - enemy.height;
            enemy.vy = 0;
            enemy.isGrounded = true;
          } else {
            // Turn around on wall hit
            enemy.vx *= -1;
            enemy.facing = enemy.vx < 0 ? 'left' : 'right';
            if (enemy.type === 'koopa_shell') {
              enemy.shellSpeed = (enemy.shellSpeed || 5) * -1;
              sound.playBump();
            }
          }
        }
      }

      // If this enemy is a spinning Koopa shell, defeat any other enemies it collides with
      if (enemy.type === 'koopa_shell' && enemy.isShellSpinning) {
        this.enemies.forEach((other) => {
          if (other.id !== enemy.id && !other.isDead && this.checkOverlap(enemy, other)) {
            this.defeatEnemy(other, this.players[0], 'shell');
          }
        });
      }

      // Enemy interaction with Players
      this.players.forEach((player) => {
        if (player.isDead) return;

        if (this.checkOverlap(player, enemy)) {
          // Starman / Dry Bones play dead immunity
          if (player.starmanTimer > 0 || player.isDeadBonesDucking) {
            this.defeatEnemy(enemy, player, 'star');
            return;
          }

          // Stomp enemy from above
          const isStomping = player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 12;

          if (isStomping) {
            if (enemy.type === 'spiny') {
              if (player.powerUp === 'spiny_helmet') {
                // Spiny Helmet protects!
                player.vy = -7;
                sound.playStomp();
              } else {
                this.hitPlayer(player);
              }
            } else {
              this.stompEnemy(enemy, player);
            }
          } else {
            // Non-stomp side interaction: if touching a stationary Koopa shell, kick it!
            if (enemy.type === 'koopa_shell' && !enemy.isShellSpinning) {
              enemy.isShellSpinning = true;
              enemy.shellSpeed = player.x < enemy.x ? 7 : -7;
              sound.playBump();
              this.addScore(player, 200, enemy.x, enemy.y);
            } else {
              this.hitPlayer(player);
            }
          }
        }
      });
    });
  }

  private updateBowser(bowser: Enemy) {
    bowser.animTimer += 1;
    bowser.attackTimer = (bowser.attackTimer || 0) + 1;

    // If Bowser is falling into the lava chasm (defeated)
    if (bowser.isFallingInLava) {
      bowser.vy += 0.4;
      bowser.y += bowser.vy;
      bowser.x += bowser.vx;

      // Spawn lava splashes when hitting lava surface
      if (bowser.y >= 400 && bowser.y <= 460 && bowser.animTimer % 4 === 0) {
        this.addLavaSplash(bowser.x + bowser.width / 2, 420);
      }

      if (bowser.y > 520) {
        bowser.isDead = true;
        this.defeatBowser(bowser);
      }
      return;
    }

    // If the bridge is collapsing from the Axe cut
    if (this.isBridgeCollapsing) {
      bowser.vx = 0;
      // Check if Bowser still has a bridge under him
      const hasBridgeUnder = this.blocks.some(
        (b) => !b.isDestroyed && (b.type === 'bridge_chain' || b.id.startsWith('bridge_')) &&
               Math.abs((b.x + b.width / 2) - (bowser.x + bowser.width / 2)) < 36
      );

      if (!hasBridgeUnder && bowser.isGrounded) {
        // Fall into lava!
        bowser.isFallingInLava = true;
        bowser.vy = 2;
        bowser.vx = (Math.random() - 0.5) * 2;
        sound.playBossRoar();
        this.screenShake = 12;
      }
      return;
    }

    // Determine Bowser's Phase based on remaining health (Max 25)
    const hp = bowser.health || 25;
    let currentPhase = 1;
    if (hp <= 8) {
      currentPhase = 3;
    } else if (hp <= 17) {
      currentPhase = 2;
    }

    // Phase transition notification
    if (bowser.bossPhase !== currentPhase) {
      bowser.bossPhase = currentPhase;
      this.screenShake = 10;
      sound.playBossRoar();
      this.addFloatingText(
        currentPhase === 3 ? 'BOWSER ENRAGED!!' : 'PHASE ' + currentPhase,
        bowser.x + 10,
        bowser.y - 16,
        '#ff3300'
      );
    }

    // Turn facing towards closest player
    const targetPlayer = this.players.find((p) => !p.isDead) || this.players[0];
    if (targetPlayer) {
      bowser.facing = targetPlayer.x < bowser.x ? 'left' : 'right';
    }

    // Emit fire embers in Phase 3
    if (currentPhase === 3 && bowser.animTimer % 5 === 0) {
      this.addEmber(bowser.x + 20 + Math.random() * 24, bowser.y + 10 + Math.random() * 24);
    }

    // Compute dynamic bridge patrol boundaries
    const bridgeBlocks = this.blocks.filter(
      (b) => !b.isDestroyed && (b.type === 'bridge_chain' || b.id.startsWith('bridge_'))
    );
    const minBridgeX = bridgeBlocks.length > 0 ? Math.min(...bridgeBlocks.map((b) => b.x)) + 60 : 750;
    const maxBridgeX = bridgeBlocks.length > 0 ? Math.max(...bridgeBlocks.map((b) => b.x + b.width)) - 80 : 1580;

    // ============================================
    // PHASE 1: CASTLE GUARDIAN (HP 20~30)
    // ============================================
    if (currentPhase === 1) {
      // Steady pacing on bridge
      if (bowser.isGrounded) {
        const paceSpeed = 1.0;
        bowser.vx = bowser.facing === 'left' ? -paceSpeed : paceSpeed;

        // Dynamic bridge boundary limits
        if (bowser.x < minBridgeX) {
          bowser.vx = paceSpeed;
          bowser.facing = 'right';
        } else if (bowser.x > maxBridgeX) {
          bowser.vx = -paceSpeed;
          bowser.facing = 'left';
        }
      }

      // Short Hop every 180 frames
      if (bowser.attackTimer % 180 === 60 && bowser.isGrounded) {
        bowser.vy = -7.0;
        bowser.vx = (bowser.facing === 'left' ? -1.4 : 1.4);
      }

      // Fire breath charge & shoot
      const fireCycle = bowser.attackTimer % 160;
      if (fireCycle >= 130 && fireCycle < 160) {
        // Charging flame in throat
        bowser.fireChargeTimer = 160 - fireCycle;
        if (fireCycle % 4 === 0) {
          this.addEmber(
            bowser.facing === 'left' ? bowser.x - 4 : bowser.x + bowser.width + 4,
            bowser.y + 22
          );
        }
      } else if (fireCycle === 0) {
        // Unleash traveling flame breath
        this.shootBowserFire(bowser, 0);
        sound.playBossRoar();
      }
    }

    // ============================================
    // PHASE 2: ENRAGED HIGH LEAPER (HP 10~19)
    // ============================================
    else if (currentPhase === 2) {
      // Faster movement
      if (bowser.isGrounded) {
        const paceSpeed = 1.4;
        bowser.vx = bowser.facing === 'left' ? -paceSpeed : paceSpeed;

        if (bowser.x < minBridgeX - 20) {
          bowser.vx = paceSpeed;
          bowser.facing = 'right';
        } else if (bowser.x > maxBridgeX + 20) {
          bowser.vx = -paceSpeed;
          bowser.facing = 'left';
        }
      }

      // HIGH LEAP JUMP: Bowser leaps high (>140px up), providing huge clearance for Mario to run under or jump over!
      if (bowser.attackTimer % 140 === 40 && bowser.isGrounded) {
        bowser.vy = -11.5; // High towering leap!
        bowser.vx = bowser.facing === 'left' ? -2.5 : 2.5;
        bowser.isLeaping = true;
        sound.playJump();
      }

      // Double Fire Breath
      const fireCycle = bowser.attackTimer % 140;
      if (fireCycle === 0) {
        this.shootBowserFire(bowser, 0); // Low bridge flame
        this.shootBowserFire(bowser, -1.8); // High angled flame
        sound.playBossRoar();
      }
    }

    // ============================================
    // PHASE 3: DESPERATION FURY SHOWDOWN (HP 1~9)
    // ============================================
    else {
      // Aggressive agile pacing
      if (bowser.isGrounded) {
        const paceSpeed = 1.8;
        bowser.vx = bowser.facing === 'left' ? -paceSpeed : paceSpeed;

        if (bowser.x < minBridgeX - 30) {
          bowser.vx = paceSpeed;
          bowser.facing = 'right';
        } else if (bowser.x > maxBridgeX + 30) {
          bowser.vx = -paceSpeed;
          bowser.facing = 'left';
        }
      }

      // Dynamic High Leap & Cross
      if (bowser.attackTimer % 110 === 30 && bowser.isGrounded) {
        bowser.vy = -11.0;
        bowser.vx = bowser.facing === 'left' ? -3.0 : 3.0;
        bowser.isLeaping = true;
        sound.playJump();
      }

      // Throw Spinning Hammers in high arc
      if (bowser.attackTimer % 90 === 0) {
        this.throwBowserHammer(bowser);
      }

      // Rapid Fire Waves
      if (bowser.attackTimer % 100 === 0) {
        this.shootBowserFire(bowser, 0);
        this.shootBowserFire(bowser, -2.2);
        sound.playBossRoar();
      }
    }

    // Apply Gravity & Movement
    bowser.vy += 0.38;
    bowser.y += bowser.vy;
    bowser.x += bowser.vx;

    // Platform & Bridge collision
    bowser.isGrounded = false;
    for (const block of this.blocks) {
      if (block.isDestroyed || block.type === 'lava' || block.type === 'castle_axe') continue;
      if (this.checkOverlap(bowser, block)) {
        if (bowser.vy > 0 && bowser.y + bowser.height - bowser.vy <= block.y + 12) {
          bowser.y = block.y - bowser.height;
          bowser.vy = 0;
          bowser.isGrounded = true;

          // If landing from high leap: Ground-pound shockwave!
          if (bowser.isLeaping) {
            bowser.isLeaping = false;
            this.screenShake = 6;
            sound.playBump();
            this.addSmokePuff(bowser.x, bowser.y + bowser.height - 4);
            this.addSmokePuff(bowser.x + bowser.width, bowser.y + bowser.height - 4);
          }
        }
      }
    }
  }

  private shootBowserFire(bowser: Enemy, vyOffset: number = 0) {
    const dir = bowser.facing === 'left' ? -1 : 1;
    const fire: Projectile = {
      id: 'bf_' + Date.now() + Math.random(),
      x: bowser.x + (dir === -1 ? -24 : bowser.width + 4),
      y: bowser.y + 18,
      vx: dir * 4.8,
      vy: vyOffset,
      width: 32,
      height: 20,
      type: 'bowser_fire',
      ownerId: -1,
      lifeTimer: 240,
    };
    this.projectiles.push(fire);
  }

  private throwBowserHammer(bowser: Enemy) {
    const dir = bowser.facing === 'left' ? -1 : 1;
    for (let i = 0; i < 2; i++) {
      const hammer: Projectile = {
        id: 'bham_' + Date.now() + Math.random(),
        x: bowser.x + bowser.width / 2,
        y: bowser.y + 10,
        vx: dir * (2.2 + i * 1.5),
        vy: -7.5 - i * 1.5,
        width: 16,
        height: 16,
        type: 'hammer',
        ownerId: -1,
        lifeTimer: 200,
      };
      this.projectiles.push(hammer);
    }
  }

  private throwHammer(bro: Enemy) {
    const hammer: Projectile = {
      id: 'ham_' + Date.now() + Math.random(),
      x: bro.x + bro.width / 2,
      y: bro.y,
      vx: bro.facing === 'left' ? -2.5 : 2.5,
      vy: -6,
      width: 14,
      height: 14,
      type: 'hammer',
      ownerId: -1,
      lifeTimer: 180,
    };
    this.projectiles.push(hammer);
  }

  private stompEnemy(enemy: Enemy, player: Player) {
    player.vy = -7.5; // Bounce off enemy
    sound.playStomp();

    if (enemy.type === 'goomba') {
      enemy.isDead = true;
      enemy.deathTimer = 20;
      this.addScore(player, 500, enemy.x, enemy.y);
    } else if (enemy.type === 'koopa_green' || enemy.type === 'koopa_red') {
      enemy.type = 'koopa_shell';
      enemy.isShellSpinning = false;
      this.addScore(player, 500, enemy.x, enemy.y);
    } else if (enemy.type === 'koopa_shell') {
      if (!enemy.isShellSpinning) {
        enemy.isShellSpinning = true;
        enemy.shellSpeed = player.facing === 'left' ? -7 : 7;
      } else {
        enemy.isShellSpinning = false;
      }
    } else if (enemy.type === 'dry_bones') {
      enemy.bonesCrumpledTimer = 180; // Crumble into bones pile for 3 seconds
      sound.playBlockBreak();
    }
  }

  private defeatEnemy(enemy: Enemy, player: Player, reason: string) {
    enemy.isDead = true;
    enemy.deathTimer = 30;
    sound.playStomp();
    this.addStarSparkle(enemy.x, enemy.y);
    this.addScore(player, 1000, enemy.x, enemy.y);
  }

  private updateItems() {
    this.items.forEach((item) => {
      // Emergence phase rising out of question/brick block
      if (item.spawnTimer > 0) {
        item.spawnTimer -= 1;
        item.y -= 1.0;

        // Allow player to collect early while it is rising out of the block
        this.players.forEach((player) => {
          if (player.isDead) return;
          if (this.checkOverlap(player, item)) {
            this.collectItem(player, item);
          }
        });
        return;
      }

      // Life timer countdown (e.g., 15-20 seconds before disappearing)
      if (item.lifeTimer !== undefined) {
        item.lifeTimer -= 1;
      }

      item.vy += 0.35;
      item.y += item.vy;
      item.x += item.vx;

      // Platform collision
      for (const block of this.blocks) {
        if (block.isDestroyed || block.type === 'lava') continue;
        if (this.checkOverlap(item, block)) {
          if (item.vy > 0) {
            item.y = block.y - item.height;
            item.vy = 0;
            item.isGrounded = true;
          } else {
            item.vx *= -1;
          }
        }
      }

      // Player collection
      this.players.forEach((player) => {
        if (player.isDead) return;

        if (this.checkOverlap(player, item)) {
          this.collectItem(player, item);
        }
      });
    });

    // Keep items in the game as long as they haven't fallen into the pit and lifeTimer has not expired
    this.items = this.items.filter((item) => {
      if (item.spawnTimer > 0) return true;
      if (item.lifeTimer !== undefined && item.lifeTimer <= 0) return false;
      return item.y < this.stageData.height + 80;
    });
  }

  private triggerSpinAttack(player: Player) {
    player.attackSpinTimer = 18; // ~0.3s spin duration
    sound.playBump();

    // Melee attack hitbox around the player
    const attackHitbox = {
      x: player.x - 12,
      y: player.y - 4,
      width: player.width + 24,
      height: player.height + 8,
    };

    // Spin attack defeats nearby enemies (Goombas, Koopas, Spinies, Piranhas, etc.)
    this.enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      if (this.checkOverlap(attackHitbox, enemy)) {
        if (enemy.type === 'bowser') {
          enemy.health = (enemy.health || 20) - 1;
          sound.playBossHit();
          this.addStarSparkle(enemy.x + 20, enemy.y + 20);
          if (enemy.health <= 0) {
            this.defeatBowser(enemy);
          }
        } else {
          this.defeatEnemy(enemy, player, 'spin_attack');
        }
      }
    });

    // Spin attack can also bump/activate blocks nearby
    this.blocks.forEach((block) => {
      if (block.isDestroyed) return;
      if (this.checkOverlap(attackHitbox, block)) {
        if (block.type === 'question' || block.type === 'brick') {
          this.bumpBlock(block, player);
        }
      }
    });
  }

  private collectItem(player: Player, item: ItemEntity) {
    sound.playPowerUp();
    this.addScore(player, 1000, item.x, item.y);
    this.addStarSparkle(item.x, item.y);

    switch (item.type) {
      case 'super_mushroom':
        if (player.powerUp === 'none') {
          player.powerUp = 'super';
          player.height = 48;
          player.y -= 16;
          this.addFloatingText('SUPER MARIO!', player.x, player.y - 12, '#ff3333');
        }
        break;
      case 'fire_flower':
        if (player.powerUp === 'none') {
          player.y -= 16;
        }
        player.powerUp = 'fire';
        player.height = 48;
        this.addFloatingText('FIRE MARIO!', player.x, player.y - 12, '#ff8800');
        break;
      case 'propeller_mushroom':
        if (player.powerUp === 'none') player.y -= 16;
        player.powerUp = 'propeller';
        player.height = 48;
        this.addFloatingText('PROPELLER SUIT!', player.x, player.y - 12, '#ffaa00');
        break;
      case 'super_acorn':
        if (player.powerUp === 'none') player.y -= 16;
        player.powerUp = 'squirrel';
        player.height = 48;
        this.addFloatingText('FLYING SQUIRREL!', player.x, player.y - 12, '#8b5a2b');
        break;
      case 'spiny_shell':
        player.powerUp = 'spiny_helmet';
        player.height = 48;
        this.addFloatingText('SPINY HELMET!', player.x, player.y - 12, '#cc2200');
        break;
      case 'starman':
        player.starmanTimer = 450; // ~7.5 seconds
        sound.playBgm('star');
        this.addFloatingText('STAR POWER!', player.x, player.y - 12, '#ffd700');
        break;
      case 'yoshi_egg':
        player.vehicle = 'yoshi';
        this.addFloatingText('YOSHI RIDE!', player.x, player.y - 12, '#00cc44');
        break;
      case 'clown_car':
        player.vehicle = 'fire_clown_car';
        this.addFloatingText('KOOPA CLOWN CAR!', player.x, player.y - 12, '#ff6600');
        break;
      case 'dry_bones_shell':
        player.vehicle = 'dry_bones_shell';
        this.addFloatingText('DRY BONES SHELL!', player.x, player.y - 12, '#bbbbbb');
        break;
      case '1up_mushroom':
        player.lives += 1;
        this.addFloatingText('1UP!', player.x, player.y - 10, '#00ff00');
        break;
    }

    // Remove item from array
    this.items = this.items.filter((i) => i.id !== item.id);
  }

  private shootFireball(player: Player) {
    const activeFireballs = this.projectiles.filter((p) => p.ownerId === player.id && p.type === 'player_fireball');
    if (activeFireballs.length >= 2) return;

    sound.playFireball();
    const dir = player.facing === 'left' ? -1 : 1;
    const fireball: Projectile = {
      id: 'fb_' + Date.now(),
      x: player.x + (dir === 1 ? player.width : -10),
      y: player.y + 10,
      vx: dir * 5.5,
      vy: 1.5,
      width: 12,
      height: 12,
      type: 'player_fireball',
      ownerId: player.id,
      lifeTimer: 180,
      bounces: 0,
    };
    this.projectiles.push(fireball);
  }

  private shootChargeFireball(player: Player) {
    sound.playFireball();
    const dir = player.facing === 'left' ? -1 : 1;
    const fireball: Projectile = {
      id: 'cfb_' + Date.now(),
      x: player.x + (dir === 1 ? player.width : -24),
      y: player.y + 4,
      vx: dir * 7.5,
      vy: 0,
      width: 28,
      height: 28,
      type: 'charge_fireball',
      ownerId: player.id,
      lifeTimer: 240,
    };
    this.projectiles.push(fireball);
  }

  private updateProjectiles() {
    this.projectiles.forEach((p) => {
      p.lifeTimer -= 1;
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'player_fireball') {
        p.vy += 0.35;
        // Bounce on ground
        for (const block of this.blocks) {
          if (block.isDestroyed) continue;
          if (this.checkOverlap(p, block)) {
            if (p.vy > 0) {
              p.vy = -4.2;
            } else {
              p.lifeTimer = 0; // Disappear on wall
            }
          }
        }
      }

      // Hit Enemies
      if (p.ownerId > 0) {
        this.enemies.forEach((enemy) => {
          if (enemy.isDead) return;
          if (this.checkOverlap(p, enemy)) {
            if (enemy.type === 'bowser') {
              enemy.health = (enemy.health || 20) - (p.type === 'charge_fireball' ? 4 : 1);
              sound.playBossHit();
              this.addStarSparkle(enemy.x + 20, enemy.y + 20);
              if (enemy.health <= 0) {
                this.defeatBowser(enemy);
              }
            } else {
              this.defeatEnemy(enemy, this.players[0], 'fire');
            }
            if (p.type !== 'charge_fireball') {
              p.lifeTimer = 0;
            }
          }
        });
      }

      // Hit Players (Enemy bullets, bowser fire)
      if (p.ownerId < 0) {
        this.players.forEach((player) => {
          if (player.isDead) return;
          if (this.checkOverlap(p, player)) {
            this.hitPlayer(player);
            p.lifeTimer = 0;
          }
        });
      }
    });

    this.projectiles = this.projectiles.filter((p) => p.lifeTimer > 0);
  }

  private triggerYoshiTongue(player: Player) {
    const tongue = this.yoshiTongues.find((t) => t.playerId === player.id);
    if (!tongue || tongue.active) return;

    tongue.active = true;
    tongue.facing = player.facing;
    tongue.x = player.x + (player.facing === 'left' ? 0 : player.width);
    tongue.y = player.y + 12;
    tongue.length = 0;
    tongue.state = 'extending';
    sound.playYoshiTongue();
  }

  private updateYoshiTongues() {
    this.yoshiTongues.forEach((tongue) => {
      if (!tongue.active) return;
      const player = this.players.find((p) => p.id === tongue.playerId);
      if (!player) return;

      tongue.x = player.x + (tongue.facing === 'left' ? 0 : player.width);
      tongue.y = player.y + 12;

      if (tongue.state === 'extending') {
        tongue.length += 6;
        const tipX = tongue.facing === 'left' ? tongue.x - tongue.length : tongue.x + tongue.length;

        // Catch Enemy
        this.enemies.forEach((enemy) => {
          if (enemy.isDead || enemy.type === 'bowser') return;
          if (Math.abs(tipX - (enemy.x + enemy.width / 2)) < 16 && Math.abs(tongue.y - (enemy.y + enemy.height / 2)) < 16) {
            tongue.caughtEnemy = enemy;
            enemy.isDead = true;
            tongue.state = 'retracting';
          }
        });

        if (tongue.length >= tongue.maxLength) {
          tongue.state = 'retracting';
        }
      } else {
        tongue.length -= 6;
        if (tongue.length <= 0) {
          tongue.active = false;
          if (tongue.caughtEnemy) {
            sound.playYoshiSwallow();
            this.totalCoins += 2;
            this.addScore(player, 800, player.x, player.y);
            tongue.caughtEnemy = undefined;
          }
        }
      }
    });
  }

  private hitPlayer(player: Player) {
    if (player.invincibleTimer > 0 || player.starmanTimer > 0 || player.isDeadBonesDucking) return;

    if (player.vehicle !== 'none') {
      // Dismount vehicle
      player.vehicle = 'none';
      player.invincibleTimer = 90;
      sound.playPowerDown();
      return;
    }

    if (player.powerUp !== 'none') {
      // Downgrade power-up
      if (player.powerUp === 'fire') {
        player.powerUp = 'super';
        player.height = 48;
      } else {
        player.powerUp = 'none';
        player.height = 32;
      }
      player.invincibleTimer = 90;
      sound.playPowerDown();
    } else {
      this.killPlayer(player);
    }
  }

  private killPlayer(player: Player) {
    if (player.isDead) return;
    player.isDead = true;
    player.deathTimer = 0;
    player.vy = -9;
    player.lives -= 1;
    sound.playDeath();
  }

  private killAllPlayers() {
    this.players.forEach((p) => this.killPlayer(p));
  }

  private defeatBowser(bowser: Enemy) {
    if (this.bossDefeated) return;
    bowser.isDead = true;
    this.bossDefeated = true;
    sound.playBossRoar();
    this.screenShake = 14;

    const leadPlayer = this.players.find((p) => !p.isDead) || this.players[0];
    this.addScore(leadPlayer, 50000, bowser.x, bowser.y);
    this.addFloatingText('BOWSER DEFEATED! +50000', bowser.x - 20, bowser.y - 30, '#ffcc00');

    // Trigger clear transition
    this.triggerStageClear(leadPlayer);
  }

  private triggerAxeCut() {
    if (this.isBridgeCollapsing) return;
    this.isBridgeCollapsing = true;
    this.bridgeCollapseTimer = 0;
    this.screenShake = 8;
    sound.playBlockBreak();

    // Collect all bridge chain blocks and sort descending by X (from right to left)
    const bridgeBlocks = this.blocks.filter(
      (b) => !b.isDestroyed && (b.type === 'bridge_chain' || b.id.startsWith('bridge_'))
    );
    bridgeBlocks.sort((a, b) => b.x - a.x);
    this.bridgeBlocksToCollapse = bridgeBlocks;

    this.addStarSparkle(1140, 320);
    this.addFloatingText('AXE CUT!!', 1140, 290, '#ffdd00');
  }

  private updateBridgeCollapse() {
    this.bridgeCollapseTimer += 1;

    // Every 2 frames, collapse next bridge link
    if (this.bridgeCollapseTimer % 2 === 0 && this.bridgeBlocksToCollapse.length > 0) {
      const block = this.bridgeBlocksToCollapse.shift();
      if (block) {
        block.isDestroyed = true;
        this.blocks = this.blocks.filter((b) => b.id !== block.id);
        sound.playBlockBreak();
        this.addBrickDebris(block.x, block.y);
        this.addSmokePuff(block.x + 12, block.y);

        // Check if Bowser was standing over this section
        const bowser = this.enemies.find((e) => e.type === 'bowser');
        if (bowser && !bowser.isFallingInLava) {
          if (Math.abs(bowser.x + bowser.width / 2 - (block.x + block.width / 2)) < 30) {
            bowser.isFallingInLava = true;
            bowser.vy = 2;
            bowser.vx = (Math.random() - 0.5) * 2;
            sound.playBossRoar();
            this.screenShake = 12;
            this.addFloatingText('ROAAAR!!', bowser.x, bowser.y - 20, '#ff3300');
          }
        }
      }
    }

    // When all bridge blocks collapsed and bowser fell
    if (this.bridgeBlocksToCollapse.length === 0) {
      const bowser = this.enemies.find((e) => e.type === 'bowser');
      if (bowser && !bowser.isFallingInLava && !bowser.isDead) {
        bowser.isFallingInLava = true;
        bowser.vy = 3;
        sound.playBossRoar();
      }
    }
  }

  private triggerStageClear(player: Player) {
    if (this.state === 'STAGE_CLEAR' || this.state === 'VICTORY') return;
    
    if (this.currentStageId === 10) {
      this.state = 'VICTORY';
      this.isTimerActive = false;
      sound.playStageClear();
      const timeBonus = Math.floor(this.timeRemaining) * 50;
      const stageBonus = 100000;
      this.addScore(player, timeBonus + stageBonus, player.x, player.y - 20);
      return;
    }

    this.state = 'STAGE_CLEAR';
    this.isTimerActive = false;
    this.stageClearTimer = 0;
    this.stageClearFireworksCount = 0;

    // Find the flagpole block to attach player
    const pole = this.blocks.find((b) => b.type === 'flagpole');
    if (pole) {
      // Calculate grab height ratio for authentic classic points
      const grabRatio = Math.max(0, Math.min(1, 1 - (player.y - pole.y) / pole.height));
      let points = 100;
      let label = '100';
      if (grabRatio >= 0.85) {
        points = 5000;
        label = 'TOP 1-UP! 5000';
        player.lives += 1;
        sound.play1Up();
      } else if (grabRatio >= 0.65) {
        points = 2000;
        label = 'GREAT! 2000';
      } else if (grabRatio >= 0.45) {
        points = 1000;
        label = '1000';
      } else if (grabRatio >= 0.25) {
        points = 400;
        label = '400';
      }

      this.addScore(player, points, pole.x, player.y - 12);
      this.addFloatingText(label, pole.x - 10, player.y - 24, '#ffffff');

      // Attach player to flagpole
      player.x = pole.x + pole.width / 2 - player.width / 2;
      player.vx = 0;
      player.vy = 0;
      player.isSlidingPole = true;
      player.isEnteringCastle = false;
      player.facing = 'right';
      pole.flagY = pole.y + 4; // Start flag at top

      // Play flagpole slide sound
      sound.playFlagSlide();
    } else {
      sound.playStageClear();
    }

    // Stage bonus
    const stageBonus = this.currentStageId * 5000;
    this.stageClearScoreBonus = stageBonus;
    this.addScore(player, stageBonus, player.x, player.y - 20);
  }

  private handleGameOver() {
    if (this.state === 'GAME_OVER') return;
    this.state = 'GAME_OVER';
    this.isTimerActive = false;
    sound.playGameOver();
  }

  private checkStageProgress() {
    if (this.state === 'STAGE_CLEAR') {
      this.stageClearTimer += 1;
      this.stageClearSkyHueShift = (this.stageClearTimer * 2.5) % 360;

      // Time countdown bonus score conversion
      if (this.timeRemaining > 0) {
        const tick = Math.min(this.timeRemaining, 4);
        this.timeRemaining -= tick;
        this.totalScore += tick * 50;
        if (this.players[0]) this.players[0].score += tick * 50;
        if (this.stageClearTimer % 4 === 0) {
          sound.playCoin();
        }
      }

      // Celebratory Fireworks & Confetti Sequence
      const fwInterval = 28;
      if (
        this.stageClearTimer >= 40 &&
        this.stageClearTimer <= 200 &&
        this.stageClearTimer % fwInterval === 0
      ) {
        const lead = this.players[0];
        const cx = lead ? lead.x : this.cameraX + 400;
        const fx = cx - 150 + Math.random() * 300;
        const fy = 60 + Math.random() * 140;
        const colors = ['#ff2244', '#ffdd00', '#00ff66', '#00e5ff', '#ff00ff', '#ffffff'];
        const chosenColor = colors[this.stageClearFireworksCount % colors.length];
        this.addStageClearFirework(fx, fy, chosenColor);
        this.stageClearFireworksCount += 1;
        sound.playFireworks();
        this.addConfettiRain(18);
      }

      // Transition to next stage when celebration finishes
      if (this.stageClearTimer > 230) {
        if (this.currentStageId < 10) {
          this.loadStage(this.currentStageId + 1);
        } else {
          this.state = 'VICTORY';
        }
      }
    }
  }

  private updateCamera() {
    const leadPlayer = this.players.find((p) => !p.isDead) || this.players[0];
    if (!leadPlayer) return;

    // Target camera centering on player
    const targetX = leadPlayer.x - this.viewportWidth / 3;
    this.cameraX += (targetX - this.cameraX) * 0.1;
    this.cameraX = Math.max(0, Math.min(this.stageData.width - this.viewportWidth, this.cameraX));

    // Screen Shake effect
    if (this.screenShake > 0) {
      this.cameraX += (Math.random() - 0.5) * this.screenShake;
      this.cameraY = (Math.random() - 0.5) * this.screenShake;
    } else {
      this.cameraY = 0;
    }
  }

  private updateParticles() {
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.gravity) p.vy += p.gravity;
      p.alpha -= p.decay;
    });
    this.particles = this.particles.filter((p) => p.alpha > 0);
  }

  public addScore(player: Player, pts: number, x: number, y: number) {
    player.score += pts;
    this.totalScore += pts;
    this.addFloatingText(`+${pts}`, x, y - 8, '#ffdd00');
  }

  public addFloatingText(text: string, x: number, y: number, color: string) {
    this.particles.push({
      id: 'txt_' + Math.random(),
      x,
      y,
      vx: 0,
      vy: -0.8,
      color,
      size: 14,
      alpha: 1,
      decay: 0.02,
      type: 'floating_text',
      text,
    });
  }

  public addBrickDebris(x: number, y: number) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        id: 'deb_' + Math.random(),
        x: x + 6 + (i % 2) * 10,
        y: y + 6 + Math.floor(i / 2) * 10,
        vx: (i % 2 === 0 ? -2.5 : 2.5) + Math.random(),
        vy: -4 - Math.random() * 3,
        color: '#b84418',
        size: 6,
        alpha: 1,
        decay: 0.02,
        type: 'brick_debris',
        gravity: 0.35,
      });
    }
  }

  public addSmokePuff(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        id: 'smk_' + Math.random(),
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -0.5 - Math.random() * 1.2,
        color: '#ffffff',
        size: 6,
        alpha: 0.8,
        decay: 0.04,
        type: 'smoke',
      });
    }
  }

  public addStarSparkle(x: number, y: number) {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        id: 'spk_' + Math.random(),
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: ['#ffff00', '#ff0055', '#00ffff', '#ffffff'][i % 4],
        size: 4,
        alpha: 1,
        decay: 0.05,
        type: 'star_sparkle',
      });
    }
  }

  public addLavaSplash(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: 'lava_' + Math.random(),
        x: x + (Math.random() - 0.5) * 24,
        y: y - 4,
        vx: (Math.random() - 0.5) * 4,
        vy: -4 - Math.random() * 5,
        color: ['#ff2200', '#ff6600', '#ffcc00', '#ffffff'][Math.floor(Math.random() * 4)],
        size: 4 + Math.random() * 4,
        alpha: 1,
        decay: 0.03,
        type: 'brick_debris',
        gravity: 0.3,
      });
    }
  }

  public addEmber(x: number, y: number) {
    this.particles.push({
      id: 'emb_' + Math.random(),
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -1.5 - Math.random() * 1.5,
      color: Math.random() > 0.4 ? '#ff3300' : '#ffcc00',
      size: 3 + Math.random() * 2,
      alpha: 0.9,
      decay: 0.04,
      type: 'smoke',
    });
  }

  public addStageClearFirework(x: number, y: number, color: string = '#ffea00') {
    // Center flash ring
    this.particles.push({
      id: 'fw_ring_' + Math.random(),
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: 16,
      alpha: 1,
      decay: 0.08,
      type: 'ring',
    });

    // Radiant exploding sparks in circular burst
    const sparkCount = 28;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.2;
      const speed = 2.5 + Math.random() * 3.5;
      this.particles.push({
        id: 'fw_spk_' + Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3.5 + Math.random() * 2.5,
        alpha: 1,
        decay: 0.022 + Math.random() * 0.015,
        type: 'firework',
        gravity: 0.08,
      });
    }

    // Inner bright white sparks
    for (let j = 0; j < 10; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.0;
      this.particles.push({
        id: 'fw_in_' + Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#ffffff',
        size: 2.5,
        alpha: 1,
        decay: 0.035,
        type: 'star_sparkle',
      });
    }
  }

  public addConfettiRain(count: number = 20) {
    const cx = this.cameraX;
    const colors = ['#ff2255', '#ffcc00', '#00ff88', '#00d0ff', '#ff00ee', '#ffffff', '#ff9900'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        id: 'cnf_' + Math.random(),
        x: cx + Math.random() * this.viewportWidth,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 1.8 + Math.random() * 2.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 4,
        alpha: 1,
        decay: 0.008,
        type: 'confetti',
      });
    }
  }

  private checkOverlap(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}
