// 8-bit / 16-bit Web Audio Synthesizer Engine for Mario Game
// Built with DynamicsCompressor to eliminate clipping & audio cracking

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private bgmInterval: number | null = null;
  private currentBgm: string | null = null;
  private scheduledTimeouts: number[] = [];

  constructor() {
    // Lazy initialized on first user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);

      // Dynamics Compressor to prevent clipping / cracking audio
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(24, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.35, this.ctx.currentTime);
    }
    if (muted) {
      this.stopAll();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopAll() {
    this.stopBgm();
    this.clearScheduledTimeouts();

    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore already stopped oscillators
      }
    });
    this.activeOscillators.clear();
  }

  private clearScheduledTimeouts() {
    this.scheduledTimeouts.forEach((id) => window.clearTimeout(id));
    this.scheduledTimeouts = [];
  }

  private safeTone(
    type: OscillatorType,
    freq: number,
    startTime: number,
    duration: number,
    gainLevel: number = 0.15,
    dest?: AudioNode
  ) {
    if (this.isMuted || !this.ctx || !this.masterGain) return null;
    if (freq <= 0) return null;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const safeGain = Math.max(0.0001, gainLevel);
    gain.gain.setValueAtTime(safeGain, startTime);
    gain.gain.linearRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(dest || this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {
        // ignore
      }
    };

    osc.start(startTime);
    osc.stop(startTime + duration);
    return osc;
  }

  public playJump(isSuper: boolean = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const startFreq = isSuper ? 175 : 145;
    const endFreq = isSuper ? 580 : 460;

    // Primary square sweep (retro punch)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(startFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.13);
    gain1.gain.setValueAtTime(0.13, now);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.14);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // Warm rounded triangle body (Wonder/SNES warmth)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(startFreq * 1.5, now);
    osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.2, now + 0.13);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.linearRampToValueAtTime(0.0001, now + 0.14);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    this.activeOscillators.add(osc1);
    this.activeOscillators.add(osc2);
    osc1.onended = () => {
      this.activeOscillators.delete(osc1);
      try { osc1.disconnect(); gain1.disconnect(); } catch {}
    };
    osc2.onended = () => {
      this.activeOscillators.delete(osc2);
      try { osc2.disconnect(); gain2.disconnect(); } catch {}
    };

    osc1.start(now);
    osc1.stop(now + 0.14);
    osc2.start(now);
    osc2.stop(now + 0.14);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    
    // Note 1: B5 (987.77 Hz)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.setValueAtTime(0.2, now + 0.075);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // Note 2: E6 (1318.51 Hz) + High harmonic shine
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.22, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    // Shimmer overtone (2637 Hz)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(2637.02, now + 0.08);
    gain3.gain.setValueAtTime(0.0001, now);
    gain3.gain.setValueAtTime(0.08, now + 0.08);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    osc3.connect(gain3);
    gain3.connect(this.masterGain);

    this.activeOscillators.add(osc1);
    this.activeOscillators.add(osc2);
    this.activeOscillators.add(osc3);

    osc1.onended = () => { this.activeOscillators.delete(osc1); };
    osc2.onended = () => { this.activeOscillators.delete(osc2); };
    osc3.onended = () => { this.activeOscillators.delete(osc3); };

    osc1.start(now);
    osc1.stop(now + 0.08);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.38);
    osc3.start(now + 0.08);
    osc3.stop(now + 0.28);
  }

  public playStomp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Punchy cartoon squash
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try { osc.disconnect(); gain.disconnect(); } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playPowerUp() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [330, 392, 659, 523, 587, 784, 1046];
    notes.forEach((freq, idx) => {
      this.safeTone('triangle', freq, now + idx * 0.05, 0.048, 0.18);
      this.safeTone('sine', freq * 2, now + idx * 0.05, 0.048, 0.06);
    });
  }

  public play1Up() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Classic 1-UP fanfare arpeggio: E4, G4, E5, C5, D5, G5
    const notes = [330, 392, 659, 523, 587, 784];
    notes.forEach((freq, idx) => {
      this.safeTone('triangle', freq, now + idx * 0.06, 0.055, 0.22);
      this.safeTone('sine', freq * 2, now + idx * 0.06, 0.055, 0.1);
    });
  }

  public playPowerDown() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [659, 587, 493, 440, 349, 261, 196];
    notes.forEach((freq, idx) => {
      this.safeTone('sawtooth', freq, now + idx * 0.06, 0.055, 0.14);
    });
  }

  public playFireball() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try { osc.disconnect(); gain.disconnect(); } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playChargeFire() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.38);
  }

  public playPropellerWhirl() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      this.safeTone('square', 400 + i * 80, now + i * 0.05, 0.045, 0.1);
    }
  }

  public playYoshiTongue() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playYoshiSwallow() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playYoshiFlutter() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.safeTone('triangle', 440, now, 0.04, 0.1);
    this.safeTone('triangle', 520, now + 0.045, 0.04, 0.1);
  }

  public playBlockBreak() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // 1. Initial sharp shatter crack (Square frequency drops rapidly)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.15);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // 2. High crunchy noise fragment
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(540, now);
    osc2.frequency.exponentialRampToValueAtTime(110, now + 0.11);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.linearRampToValueAtTime(0.0001, now + 0.11);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    this.activeOscillators.add(osc1);
    this.activeOscillators.add(osc2);
    osc1.onended = () => { this.activeOscillators.delete(osc1); };
    osc2.onended = () => { this.activeOscillators.delete(osc2); };

    osc1.start(now);
    osc1.stop(now + 0.15);
    osc2.start(now);
    osc2.stop(now + 0.11);
  }

  public playBump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';

    // Punchy hollow thud
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.085);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.085);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playBossRoar() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.18);
    osc.frequency.linearRampToValueAtTime(60, now + 0.45);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.48);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playBossAlert() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Siren high-low pulses
    for (let i = 0; i < 3; i++) {
      const t = now + i * 0.22;
      this.safeTone('sawtooth', 880, t, 0.09, 0.25);
      this.safeTone('sawtooth', 587, t + 0.1, 0.09, 0.25);
    }
  }

  public playBossHit() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    this.safeTone('square', 320, now, 0.08, 0.22);
    this.safeTone('square', 180, now + 0.08, 0.1, 0.22);
  }

  // Flagpole slide sound effect
  public playFlagSlide() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.9);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);

    this.activeOscillators.add(osc);
    osc.onended = () => {
      this.activeOscillators.delete(osc);
      try {
        osc.disconnect();
        gain.disconnect();
      } catch {}
    };

    osc.start(now);
    osc.stop(now + 0.9);
  }

  // Fireworks celebration pop & boom
  public playFireworks() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    // Whistle up
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.12);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.linearRampToValueAtTime(0.0001, now + 0.12);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);

    // Boom burst
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(160, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.35);
    gain2.gain.setValueAtTime(0.25, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);

    this.activeOscillators.add(osc1);
    this.activeOscillators.add(osc2);
    osc1.onended = () => { this.activeOscillators.delete(osc1); };
    osc2.onended = () => { this.activeOscillators.delete(osc2); };

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  }

  // Classic Mario Death Jingle (Plays cleanly when a life is lost)
  public playDeath() {
    if (this.isMuted) return;
    this.stopAll();
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 493.88, d: 0.14 }, // B4
      { f: 698.46, d: 0.14 }, // F5
      { f: 0, d: 0.04 },
      { f: 698.46, d: 0.14 }, // F5
      { f: 698.46, d: 0.18 }, // F5
      { f: 659.25, d: 0.18 }, // E5
      { f: 587.33, d: 0.18 }, // D5
      { f: 523.25, d: 0.35 }, // C5
    ];

    let t = now;
    notes.forEach((n) => {
      if (n.f > 0) {
        this.safeTone('triangle', n.f, t, n.d * 0.9, 0.22);
      }
      t += n.d;
    });
  }

  // Authentic Super Mario Flagpole Stage Clear Fanfare
  public playStageClear() {
    if (this.isMuted) return;
    this.stopAll();
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 196.0, d: 0.09 }, // G3
      { f: 261.63, d: 0.09 }, // C4
      { f: 329.63, d: 0.09 }, // E4
      { f: 392.0, d: 0.09 }, // G4
      { f: 523.25, d: 0.09 }, // C5
      { f: 659.25, d: 0.09 }, // E5
      { f: 783.99, d: 0.28 }, // G5
      { f: 659.25, d: 0.28 }, // E5

      { f: 207.65, d: 0.09 }, // G#3
      { f: 261.63, d: 0.09 }, // C4
      { f: 311.13, d: 0.09 }, // D#4
      { f: 415.3, d: 0.09 }, // G#4
      { f: 523.25, d: 0.09 }, // C5
      { f: 622.25, d: 0.09 }, // D#5
      { f: 830.61, d: 0.28 }, // G#5
      { f: 622.25, d: 0.28 }, // D#5

      { f: 233.08, d: 0.09 }, // A#3
      { f: 293.66, d: 0.09 }, // D4
      { f: 349.23, d: 0.09 }, // F4
      { f: 466.16, d: 0.09 }, // A#4
      { f: 587.33, d: 0.09 }, // D5
      { f: 698.46, d: 0.09 }, // F5
      { f: 932.33, d: 0.28 }, // A#5
      { f: 987.77, d: 0.12 }, // B5
      { f: 987.77, d: 0.12 }, // B5
      { f: 987.77, d: 0.12 }, // B5
      { f: 1046.5, d: 0.65 }, // C6
    ];

    let t = now;
    notes.forEach((n) => {
      if (n.f > 0) {
        this.safeTone('triangle', n.f, t, n.d * 0.88, 0.2);
        // Add subtle harmonic octave
        this.safeTone('sine', n.f * 0.5, t, n.d * 0.88, 0.1);
      }
      t += n.d;
    });
  }

  // Authentic Super Mario Game Over Melody
  public playGameOver() {
    if (this.isMuted) return;
    this.stopAll();
    this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const notes = [
      { f: 261.63, d: 0.18 }, // C4
      { f: 0, d: 0.06 },
      { f: 196.0, d: 0.18 }, // G3
      { f: 0, d: 0.06 },
      { f: 164.81, d: 0.22 }, // E3
      { f: 220.0, d: 0.18 }, // A3
      { f: 246.94, d: 0.18 }, // B3
      { f: 220.0, d: 0.18 }, // A3
      { f: 207.65, d: 0.18 }, // Ab3
      { f: 233.08, d: 0.18 }, // Bb3
      { f: 207.65, d: 0.18 }, // Ab3
      { f: 196.0, d: 0.45 }, // G3
    ];

    let t = now;
    notes.forEach((n) => {
      if (n.f > 0) {
        this.safeTone('triangle', n.f, t, n.d * 0.9, 0.2);
      }
      t += n.d;
    });
  }

  public playBgm(theme: 'overworld' | 'underground' | 'sky' | 'castle' | 'boss' | 'star') {
    if (this.currentBgm === theme) return;
    this.stopBgm();
    this.currentBgm = theme;
    if (this.isMuted) return;

    this.init();
    if (!this.ctx || !this.masterGain) return;

    let melody: { f: number; d: number }[] = [];
    let intervalMs = 2400;

    if (theme === 'overworld') {
      // Classic lively overworld tune
      melody = [
        { f: 659.25, d: 0.12 }, // E5
        { f: 659.25, d: 0.12 }, // E5
        { f: 0, d: 0.12 },
        { f: 659.25, d: 0.12 }, // E5
        { f: 0, d: 0.12 },
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 0, d: 0.12 },
        { f: 783.99, d: 0.24 }, // G5
        { f: 0, d: 0.24 },
        { f: 392.0, d: 0.24 }, // G4
      ];
      intervalMs = 2400;
    } else if (theme === 'underground') {
      melody = [
        { f: 261.63, d: 0.1 }, // C4
        { f: 523.25, d: 0.1 }, // C5
        { f: 233.08, d: 0.1 }, // A#3
        { f: 466.16, d: 0.1 }, // A#4
        { f: 220.0, d: 0.1 }, // A3
        { f: 440.0, d: 0.1 }, // A4
        { f: 207.65, d: 0.15 }, // G#3
      ];
      intervalMs = 2000;
    } else if (theme === 'castle' || theme === 'boss') {
      melody = [
        { f: 196.0, d: 0.1 }, // G3
        { f: 207.65, d: 0.1 }, // G#3
        { f: 220.0, d: 0.1 }, // A3
        { f: 233.08, d: 0.15 }, // A#3
        { f: 196.0, d: 0.1 },
        { f: 185.0, d: 0.1 },
        { f: 174.61, d: 0.2 }, // F3
      ];
      intervalMs = 1800;
    } else if (theme === 'star') {
      melody = [
        { f: 659, d: 0.08 },
        { f: 659, d: 0.08 },
        { f: 659, d: 0.08 },
        { f: 523, d: 0.08 },
        { f: 659, d: 0.08 },
        { f: 784, d: 0.12 },
        { f: 392, d: 0.12 },
      ];
      intervalMs = 900;
    } else {
      // Sky/Athletic
      melody = [
        { f: 523, d: 0.1 },
        { f: 659, d: 0.1 },
        { f: 784, d: 0.1 },
        { f: 1046, d: 0.15 },
        { f: 880, d: 0.1 },
        { f: 659, d: 0.1 },
      ];
      intervalMs = 1600;
    }

    const playPhrase = () => {
      if (this.isMuted || !this.ctx || !this.masterGain || this.currentBgm !== theme) return;
      const now = this.ctx.currentTime;
      let offset = 0;
      melody.forEach((note) => {
        if (!this.ctx || !this.masterGain || this.currentBgm !== theme) return;
        if (note.f > 0) {
          const oscType: OscillatorType = theme === 'star' ? 'sawtooth' : 'triangle';
          this.safeTone(oscType, note.f, now + offset, note.d * 0.85, 0.08);
        }
        offset += note.d + 0.04;
      });
    };

    playPhrase();
    this.bgmInterval = window.setInterval(playPhrase, intervalMs);
  }

  public stopBgm() {
    this.currentBgm = null;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }
}

export const sound = new SoundEngine();
