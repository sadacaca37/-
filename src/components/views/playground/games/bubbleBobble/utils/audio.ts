// 8-Bit Retro Chiptune Audio Engine using Web Audio API

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private bgmVolume: number = 0.35;
  private sfxVolume: number = 0.5;

  private isBgmPlaying: boolean = false;
  private bgmLoopInterval: number | null = null;
  private currentBgmTempo: number = 160; // BPM

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.gain.value = this.isMuted ? 0 : this.bgmVolume;
      this.sfxGain.gain.value = this.isMuted ? 0 : this.sfxVolume;

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain && this.sfxGain) {
      this.bgmGain.gain.value = muted ? 0 : this.bgmVolume;
      this.sfxGain.gain.value = muted ? 0 : this.sfxVolume;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // --- SOUND EFFECTS (8-Bit Chiptune SFX) ---

  // Player Jump Sound (Boing / pitch slide up)
  public playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Shoot Bubble Sound (Pew!)
  public playShoot() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Trap Enemy in Bubble (Bloop)
  public playTrap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;

    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(500, now + 0.05);
    osc.frequency.setValueAtTime(700, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Pop Bubble (Pop!)
  public playPop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Fast noise burst + square drop
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);

    // Tone pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // Collect Fruit / Food (Ding-Ding high arpeggio)
  public playCollectFruit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.25, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.08);
    });
  }

  // Collect EXTEND Letter (Special Powerup Melody)
  public playExtendLetter() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.4, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.12);
    });
  }

  // Player Death (Descending sad chiptune)
  public playPlayerDeath() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const notes = [400, 350, 300, 250, 200, 150];

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.3, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.1);
    });
  }

  // Hurry Up Warning Bell
  public playHurryUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1760, now + 0.1);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Stage Clear Fanfare!
  public playStageClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Classic Arcade Victory Motif: C5 C5 C5 G4 A4 B4 C5
    const melody = [
      { note: 523.25, duration: 0.1, delay: 0 },
      { note: 523.25, duration: 0.1, delay: 0.12 },
      { note: 523.25, duration: 0.1, delay: 0.24 },
      { note: 659.25, duration: 0.15, delay: 0.36 },
      { note: 783.99, duration: 0.15, delay: 0.52 },
      { note: 1046.5, duration: 0.4, delay: 0.7 }
    ];

    melody.forEach((item) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(item.note, now + item.delay);

      gain.gain.setValueAtTime(0.35, now + item.delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + item.delay + item.duration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + item.delay);
      osc.stop(now + item.delay + item.duration);
    });
  }

  // Power-Up Triggered Fanfare (Score milestone / Item collected)
  public playPowerUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const arpeggio = [587.33, 739.99, 880.0, 1174.66, 1479.98, 1760.0]; // D5, F#5, A5, D6, F#6, A6

    arpeggio.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.4, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.04 + 0.1);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.1);
    });
  }

  // Grand Victory Fanfare when winning all 5 stages!
  public playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Triumphant multi-voice victory chords and fanfare
    const melody = [
      { note: 523.25, duration: 0.12, delay: 0 },       // C5
      { note: 523.25, duration: 0.12, delay: 0.14 },    // C5
      { note: 523.25, duration: 0.12, delay: 0.28 },    // C5
      { note: 659.25, duration: 0.18, delay: 0.42 },    // E5
      { note: 783.99, duration: 0.18, delay: 0.60 },    // G5
      { note: 1046.50, duration: 0.35, delay: 0.78 },   // C6
      { note: 880.00, duration: 0.15, delay: 1.15 },    // A5
      { note: 987.77, duration: 0.15, delay: 1.30 },    // B5
      { note: 1046.50, duration: 0.8, delay: 1.45 },    // C6 (held)
      { note: 1318.51, duration: 0.8, delay: 1.45 },    // E6 harmony
    ];

    melody.forEach((item) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(item.note, now + item.delay);

      gain.gain.setValueAtTime(0.4, now + item.delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + item.delay + item.duration);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + item.delay);
      osc.stop(now + item.delay + item.duration);
    });
  }

  // --- 8-BIT RETRO BGM SYNTHESIZER (Bubble Bobble Main Theme Loop) ---

  public startBgm(tempoMultiplier: number = 1.0) {
    this.init();
    if (this.isBgmPlaying && this.currentBgmTempo === 160 * tempoMultiplier) return;

    this.stopBgm();
    this.isBgmPlaying = true;

    if (!this.ctx || !this.bgmGain) return;

    // Bubble Bobble Classic Main Theme Note Sequences
    // Note frequencies in Hz
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, B5 = 987.77;

    // 8-bit Melody sequence (16th notes)
    const melodyPattern = [
      C5, E5, G5, C5,  E5, G5, C5, E5,  F5, E5, D5, C5,  D5, E5, F5, G5,
      E5, G5, C5, E5,  G5, C5, E5, G5,  A5, G5, F5, E5,  F5, G5, A5, B5,
      C5, C5, B4, C5,  D5, C5, B4, A4,  G4, G4, A4, B4,  C5, D5, E5, F5,
      G5, F5, E5, D5,  C5, D5, E5, C5,  D5, G4, A4, B4,  C5, 0,  C5, 0
    ];

    // Bassline (Triangle wave)
    const bassPattern = [
      C4, C4, E4, E4,  G4, G4, E4, E4,  F4, F4, D4, D4,  G4, G4, G4, G4,
      C4, C4, E4, E4,  G4, G4, C4, C4,  F4, F4, F4, F4,  G4, G4, G4, G4,
      A4, A4, F4, F4,  D4, D4, F4, F4,  G4, G4, E4, E4,  A4, A4, F4, F4,
      G4, G4, G4, G4,  C4, C4, E4, E4,  G4, G4, G4, G4,  C4, 0,  C4, 0
    ];

    const noteDuration = (60 / (160 * tempoMultiplier)) / 4; // 16th note duration
    let step = 0;

    const playStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

      const now = this.ctx.currentTime;

      // 1. Lead Melody Channel (Square Wave)
      const melNote = melodyPattern[step % melodyPattern.length];
      if (melNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(melNote, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + noteDuration * 0.85);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + noteDuration * 0.85);
      }

      // 2. Bass Channel (Triangle Wave)
      const bassNote = bassPattern[step % bassPattern.length];
      if (bassNote > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassNote / 2, now); // 1 octave down

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + noteDuration * 0.9);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + noteDuration * 0.9);
      }

      // 3. 8-Bit Noise Drum Channel (Kick on 0/8, Snare on 4/12, HiHat on others)
      if (step % 2 === 0) {
        const isSnare = (step % 8 === 4);
        const isKick = (step % 8 === 0);

        if (isKick) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);
          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
          osc.connect(gain);
          gain.connect(this.bgmGain);
          osc.start(now);
          osc.stop(now + 0.06);
        } else if (isSnare) {
          const bufSize = this.ctx.sampleRate * 0.04;
          const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
          const d = buffer.getChannelData(0);
          for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
          const noise = this.ctx.createBufferSource();
          noise.buffer = buffer;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
          noise.connect(gain);
          gain.connect(this.bgmGain);
          noise.start(now);
        }
      }

      step++;
    };

    const intervalTime = noteDuration * 1000;
    playStep();
    this.bgmLoopInterval = window.setInterval(playStep, intervalTime);
  }

  public stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmLoopInterval !== null) {
      clearInterval(this.bgmLoopInterval);
      this.bgmLoopInterval = null;
    }
  }
}

export const audioEngine = new RetroAudioEngine();
