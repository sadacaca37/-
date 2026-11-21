/**
 * Retro Arcade Web Audio API Chiptune Synthesizer
 * 100% Reliable procedural 8-bit/16-bit sound & polyphonic BGM
 */

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  private isMuted: boolean = false;
  private soundVolume: number = 0.7;
  private musicVolume: number = 0.5;

  private currentBgmTrack: string | null = null;
  private bgmIntervalId: number | null = null;
  private bgmStep: number = 0;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  public setSoundVolume(volume: number) {
    this.soundVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMuted ? 0 : this.soundVolume, this.ctx.currentTime);
    }
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMuted ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Ensure AudioContext is active on user interaction
  private ensureContext(): boolean {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!this.ctx;
  }

  // Noise generator buffer cache
  private noiseBuffer: AudioBuffer | null = null;
  private getNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.noiseBuffer) {
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    }
    return this.noiseBuffer;
  }

  // SFX: Player Vulcan / Cannon
  public playShoot(power: number = 1) {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = power >= 3 ? 'sawtooth' : 'square';
    const baseFreq = 580 + power * 50;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.07);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // SFX: Laser Beam
  public playLaser() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // SFX: Homing Missile Fire
  public playMissile() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.1);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // SFX: Enemy Shoot
  public playEnemyShoot() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // SFX: Explosions
  public playExplosion(type: 'SMALL' | 'MEDIUM' | 'LARGE' | 'BOSS' = 'SMALL') {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const buffer = this.getNoiseBuffer();
    if (!buffer) return;

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const gain = this.ctx.createGain();

    let duration = 0.18;
    let startFreq = 750;
    let endFreq = 60;
    let volume = 0.28;

    if (type === 'MEDIUM') {
      duration = 0.3;
      startFreq = 600;
      volume = 0.4;
    } else if (type === 'LARGE') {
      duration = 0.55;
      startFreq = 420;
      volume = 0.55;
    } else if (type === 'BOSS') {
      duration = 1.1;
      startFreq = 500;
      volume = 0.75;
    }

    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    if (type === 'LARGE' || type === 'BOSS') {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(130, now);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + duration * 0.8);
      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
      subOsc.connect(subGain);
      subGain.connect(this.sfxGain);
      subOsc.start(now);
      subOsc.stop(now + duration * 0.8);
    }
  }

  // SFX: Power Up Item Collect
  public playPowerUp() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [330, 440, 554, 659, 880];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.035);
      gain.gain.setValueAtTime(0.18, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.035 + 0.07);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.07);
    });
  }

  // SFX: Score Medal Chime
  public playMedal(tier: number = 1) {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const baseFreq = 880 + tier * 160;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.12);
    osc2.stop(now + 0.12);
  }

  // SFX: Super Bomb Blast
  public playBomb() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    this.playExplosion('BOSS');
    const now = this.ctx.currentTime;

    const sirenOsc = this.ctx.createOscillator();
    const sirenGain = this.ctx.createGain();
    sirenOsc.type = 'sawtooth';
    sirenOsc.frequency.setValueAtTime(850, now);
    sirenOsc.frequency.linearRampToValueAtTime(180, now + 0.4);
    sirenGain.gain.setValueAtTime(0.35, now);
    sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    sirenOsc.connect(sirenGain);
    sirenGain.connect(this.sfxGain);
    sirenOsc.start(now);
    sirenOsc.stop(now + 0.45);
  }

  // SFX: Loop-the-loop Evasion Roll
  public playLoop() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.45);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  // SFX: Boss Warning Alarm Siren
  public playWarning() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const startTime = now + i * 0.4;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(460, startTime);
      osc.frequency.linearRampToValueAtTime(780, startTime + 0.18);
      osc.frequency.linearRampToValueAtTime(460, startTime + 0.36);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.36);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.36);
    }
  }

  // SFX: Insert Coin Credit
  public playCoin() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [987.77, 1318.51];

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.22, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.22);
    });
  }

  // SFX: Stage Clear Fanfare
  public playStageClear() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    this.stopBgm();
    const now = this.ctx.currentTime;
    const melody = [
      { f: 261.63, d: 0.14 },
      { f: 329.63, d: 0.14 },
      { f: 392.0, d: 0.14 },
      { f: 523.25, d: 0.32 },
      { f: 392.0, d: 0.14 },
      { f: 523.25, d: 0.55 },
    ];

    let t = now;
    melody.forEach((note) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + note.d);
      t += note.d + 0.02;
    });
  }

  // SFX: All Mission Victory Fanfare
  public playVictory() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    this.stopBgm();
    const now = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.16 }, // C5
      { f: 523.25, d: 0.16 }, // C5
      { f: 523.25, d: 0.16 }, // C5
      { f: 659.25, d: 0.35 }, // E5
      { f: 783.99, d: 0.22 }, // G5
      { f: 1046.5, d: 0.65 }, // C6
    ];

    let t = now;
    melody.forEach((note) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + note.d);
      t += note.d + 0.03;
    });
  }

  // SFX: Game Over Theme
  public playGameOver() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    this.stopBgm();
    const now = this.ctx.currentTime;
    const melody = [
      { f: 392.0, d: 0.22 },
      { f: 349.23, d: 0.22 },
      { f: 329.63, d: 0.22 },
      { f: 261.63, d: 0.55 },
    ];

    let t = now;
    melody.forEach((note) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + note.d);
      t += note.d + 0.03;
    });
  }

  // -------------------------------------------------------------
  // Dynamic Procedural Retro BGM Sequencer
  // -------------------------------------------------------------
  public playBgm(
    theme:
      | 'TITLE'
      | 'PLANE_SELECT'
      | 'STAGE1'
      | 'STAGE2'
      | 'STAGE3'
      | 'STAGE4'
      | 'STAGE_1'
      | 'STAGE_2'
      | 'STAGE_3'
      | 'STAGE_4'
      | 'BOSS'
      | 'STAGE_CLEAR'
      | 'VICTORY'
      | 'GAME_OVER'
  ) {
    if (theme === 'STAGE_CLEAR') {
      this.playStageClear();
      return;
    }
    if (theme === 'VICTORY') {
      this.playVictory();
      return;
    }
    if (theme === 'GAME_OVER') {
      this.playGameOver();
      return;
    }

    const normalizedTrack =
      theme === 'STAGE_1' ? 'STAGE1' :
      theme === 'STAGE_2' ? 'STAGE2' :
      theme === 'STAGE_3' ? 'STAGE3' :
      theme === 'STAGE_4' ? 'STAGE4' :
      theme === 'PLANE_SELECT' ? 'TITLE' : theme;

    if (this.currentBgmTrack === normalizedTrack && this.bgmIntervalId !== null) return;
    this.stopBgm();
    this.currentBgmTrack = normalizedTrack;

    if (!this.ensureContext()) return;

    const bpm = theme === 'BOSS' ? 154 : theme === 'STAGE2' ? 146 : 140;
    const stepDuration = 60 / bpm / 4; // 16th notes
    this.bgmStep = 0;

    const noteMap: { [k: string]: number } = {
      C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
      C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
      C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
      REST: 0,
    };

    // 32-step rich pattern sequences
    const stage1Bass = [
      'C3', 'C3', 'G2', 'C3', 'E3', 'C3', 'G3', 'C3',
      'F2', 'F3', 'C3', 'F3', 'G2', 'G3', 'D3', 'G3',
      'A2', 'A3', 'E3', 'A3', 'F2', 'F3', 'C3', 'F3',
      'G2', 'G3', 'D3', 'G3', 'G3', 'F3', 'E3', 'D3',
    ];

    const stage1Lead = [
      'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'G4', 'C5',
      'A4', 'C5', 'F5', 'E5', 'D5', 'REST', 'G4', 'B4',
      'C5', 'REST', 'E5', 'G5', 'A5', 'G5', 'F5', 'E5',
      'D5', 'F5', 'E5', 'D5', 'C5', 'REST', 'G4', 'REST',
    ];

    const stage1Arp = [
      'C5', 'G4', 'E4', 'G4', 'C5', 'G4', 'E4', 'G4',
      'F4', 'A4', 'C5', 'A4', 'G4', 'B4', 'D5', 'B4',
      'A4', 'C5', 'E5', 'C5', 'F4', 'A4', 'C5', 'A4',
      'G4', 'B4', 'D5', 'B4', 'C5', 'E5', 'G5', 'E5',
    ];

    const bossBass = [
      'D3', 'D3', 'D2', 'D3', 'F3', 'F3', 'C3', 'F3',
      'G3', 'G3', 'D3', 'G3', 'A3', 'G3', 'F3', 'E3',
      'D3', 'D3', 'A2', 'D3', 'F3', 'F3', 'D3', 'F3',
      'G3', 'G3', 'F3', 'G3', 'A3', 'A3', 'G3', 'F3',
    ];

    const bossLead = [
      'D4', 'F4', 'A4', 'D5', 'F5', 'D5', 'A4', 'F4',
      'G4', 'B4', 'D5', 'REST', 'A4', 'C5', 'E5', 'REST',
      'D5', 'REST', 'A4', 'F4', 'G4', 'A4', 'B4', 'C5',
      'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4',
    ];

    const titleLead = [
      'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'D4', 'F4',
      'A4', 'D5', 'A4', 'F4', 'E4', 'G4', 'C5', 'E5',
      'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4',
      'E4', 'G4', 'C5', 'D5', 'C5', 'REST', 'G4', 'REST',
    ];

    const titleBass = [
      'C3', 'G2', 'E2', 'G2', 'D3', 'A2', 'F2', 'A2',
      'E3', 'B2', 'G2', 'B2', 'F3', 'C3', 'A2', 'C3',
      'C3', 'G2', 'E2', 'G2', 'D3', 'A2', 'F2', 'A2',
      'G3', 'D3', 'B2', 'D3', 'C3', 'REST', 'C3', 'REST',
    ];

    const currentBassSeq = theme === 'BOSS' ? bossBass : theme === 'TITLE' ? titleBass : stage1Bass;
    const currentLeadSeq = theme === 'BOSS' ? bossLead : theme === 'TITLE' ? titleLead : stage1Lead;
    const currentArpSeq = theme === 'STAGE1' ? stage1Arp : null;

    this.bgmIntervalId = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      const now = this.ctx.currentTime;
      const stepIdx = this.bgmStep % 32;

      // 1. Bass channel
      const bassNote = currentBassSeq[stepIdx];
      if (bassNote && bassNote !== 'REST' && noteMap[bassNote]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(noteMap[bassNote], now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.88);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + stepDuration * 0.88);
      }

      // 2. Lead Melody channel
      const leadNote = currentLeadSeq[stepIdx];
      if (leadNote && leadNote !== 'REST' && noteMap[leadNote]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(noteMap[leadNote], now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.82);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + stepDuration * 0.82);
      }

      // 3. Arpeggio / Chiptune Countermelody
      if (currentArpSeq) {
        const arpNote = currentArpSeq[stepIdx];
        if (arpNote && arpNote !== 'REST' && noteMap[arpNote]) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(noteMap[arpNote], now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.7);
          osc.connect(gain);
          gain.connect(this.musicGain);
          osc.start(now);
          osc.stop(now + stepDuration * 0.7);
        }
      }

      // 4. Drums: Kick & Snare & Hi-Hat
      if (stepIdx % 4 === 2) {
        // Snare
        const noise = this.getNoiseBuffer();
        if (noise) {
          const src = this.ctx.createBufferSource();
          src.buffer = noise;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'highpass';
          filter.frequency.setValueAtTime(900, now);
          const dGain = this.ctx.createGain();
          dGain.gain.setValueAtTime(0.07, now);
          dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          src.connect(filter);
          filter.connect(dGain);
          dGain.connect(this.musicGain);
          src.start(now);
          src.stop(now + 0.08);
        }
      } else if (stepIdx % 2 === 0) {
        // Kick
        const kickOsc = this.ctx.createOscillator();
        const kGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(38, now + 0.06);
        kGain.gain.setValueAtTime(0.15, now);
        kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        kickOsc.connect(kGain);
        kGain.connect(this.musicGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.06);
      }

      this.bgmStep++;
    }, stepDuration * 1000);
  }

  public stopBgm() {
    if (this.bgmIntervalId !== null) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.currentBgmTrack = null;
  }
}

export const retroAudio = new RetroAudioEngine();

