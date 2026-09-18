// Web Audio API Sound Effects Engine (Zero external dependencies)

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGainNode: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;

  constructor() {
    const savedMuted = localStorage.getItem('typang_muted');
    this.isMuted = savedMuted === 'true';
    const savedVol = localStorage.getItem('typang_volume');
    if (savedVol !== null) {
      const parsed = parseFloat(savedVol);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        this.volume = parsed;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMasterDestination(ctx: AudioContext): AudioNode {
    if (!this.masterGainNode) {
      this.masterGainNode = ctx.createGain();
      const currentVal = this.isMuted ? 0 : this.volume;
      this.masterGainNode.gain.setValueAtTime(currentVal, ctx.currentTime);
      this.masterGainNode.connect(ctx.destination);
    }
    return this.masterGainNode;
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    localStorage.setItem('typang_volume', String(clamped));
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : clamped, this.ctx.currentTime);
    }
    window.dispatchEvent(new CustomEvent('volume-changed', { detail: { volume: clamped, isMuted: this.isMuted } }));
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('typang_muted', String(this.isMuted));
    if (this.masterGainNode && this.ctx) {
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    window.dispatchEvent(new CustomEvent('volume-changed', { detail: { volume: this.volume, isMuted: this.isMuted } }));
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Generic trigger helper for UI sounds
   */
  public play(type: 'click' | 'pop' | 'success' | 'achievement' | 'error' | 'coin' | 'swap' | 'fanfare'): void {
    if (this.isMuted) return;
    switch (type) {
      case 'click':
      case 'pop':
        this.playKeyClick(true);
        break;
      case 'success':
      case 'achievement':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
      case 'fanfare':
        this.playVictory();
        break;
      default:
        this.playKeyClick(true);
        break;
    }
  }

  public playClick(): void {
    this.play('click');
  }

  /**
   * Cute, soft water-drop / marimba pop sound on each keystroke (Gentle, cute & quiet)
   */
  public playKeyClick(isCorrect = true): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft rounded sine wave for adorable raindrop/marimba pop
      osc.type = 'sine';
      
      // Sweet playful pentatonic pitch range (C6~G6)
      const cutePitches = [880, 987.77, 1046.5, 1174.66, 1318.51];
      const randomPitch = cutePitches[Math.floor(Math.random() * cutePitches.length)];
      const baseFreq = isCorrect ? randomPitch : 310;

      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * (isCorrect ? 1.08 : 0.85), ctx.currentTime + 0.025);

      // Very quiet, gentle volume (0.016) so prolonged typing is pleasant and quiet
      gain.gain.setValueAtTime(0.016, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);

      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  /**
   * Cheerful success chime
   */
  public playSuccess(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.25);

        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));

        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.26);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Level up / Unlock fanfare
   */
  public playLevelUp(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73]; // A4, C#5, E5, A5, C#6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.35);

        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));

        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.36);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Gentle, soft error tap (not harsh)
   */
  public playError(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));

      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // ignore
    }
  }

  /**
   * Book page turning sound (Authentic realistic paper rustle & flutter)
   */
  public playPageTurn(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Duration of paper page turn
      const duration = 0.32;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Layer 1: Pink & brown noise for natural organic paper friction
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555;
        b1 = 0.99332 * b1 + white * 0.0750;
        b2 = 0.96900 * b2 + white * 0.1538;
        // subtle micro-flutter texture
        const flutter = 1 + 0.15 * Math.sin((i / bufferSize) * 45);
        data[i] = (b0 + b1 + b2) * 0.28 * flutter;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Resonant bandpass filter that sweeps as the page turns over
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(2600, now);
      bandpass.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      bandpass.frequency.exponentialRampToValueAtTime(650, now + duration);
      bandpass.Q.setValueAtTime(1.8, now);
      bandpass.Q.linearRampToValueAtTime(1.2, now + duration);

      // Highpass to remove low-end rumble
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(450, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.035); // initial paper lift
      gain.gain.linearRampToValueAtTime(0.18, now + 0.14); // mid-turn flutter
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // soft landing

      noiseSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(gain);
      gain.connect(this.getMasterDestination(ctx));

      noiseSource.start(now);
      noiseSource.stop(now + duration + 0.02);
    } catch {
      // ignore
    }
  }

  /**
   * Combo cheer sound
   */
  public playCombo(combo: number): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const baseFreq = 440 + Math.min(combo * 15, 600);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // ignore
    }
  }

  /**
   * Game clear / Victory fanfare
   */
  public playVictory(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.5, d: 0.35 }  // C6
      ];
      let time = ctx.currentTime;

      melody.forEach(m => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(m.f, time);

        gain.gain.setValueAtTime(0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + m.d);

        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));

        osc.start(time);
        osc.stop(time + m.d + 0.05);

        time += m.d;
      });
    } catch {
      // ignore
    }
  }

  /**
   * Word Crush dynamic candy explosion sound
   */
  public playCandyBlast(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Layer 1: Low punch thud
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(320, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.22);
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.getMasterDestination(ctx));
      osc1.start();
      osc1.stop(ctx.currentTime + 0.23);

      // Layer 2: Sparkling pop chimes
      [780, 1100, 1560].forEach((freq, idx) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        const startT = ctx.currentTime + idx * 0.03;
        osc2.frequency.setValueAtTime(freq, startT);
        osc2.frequency.exponentialRampToValueAtTime(freq * 1.6, startT + 0.12);
        gain2.gain.setValueAtTime(0.12, startT);
        gain2.gain.exponentialRampToValueAtTime(0.001, startT + 0.12);
        osc2.connect(gain2);
        gain2.connect(this.getMasterDestination(ctx));
        osc2.start(startT);
        osc2.stop(startT + 0.13);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Whack-a-Mole hammer smash sound
   */
  public playWhack(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.14);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.15);

      // Cheerful pop
      const popOsc = ctx.createOscillator();
      const popGain = ctx.createGain();
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(900, ctx.currentTime + 0.02);
      popOsc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.1);
      popGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.02);
      popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      popOsc.connect(popGain);
      popGain.connect(this.getMasterDestination(ctx));
      popOsc.start(ctx.currentTime + 0.02);
      popOsc.stop(ctx.currentTime + 0.11);
    } catch {
      // ignore
    }
  }

  /**
   * Acid Rain water bubble hit sound
   */
  public playRainHit(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // ignore
    }
  }

  /**
   * Hint chime
   */
  public playHint(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      [659.25, 880, 1174.66].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.18);
        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.19);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Rhythm Game: PERFECT hit sparkling chord
   */
  public playRhythmPerfect(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major 7th bright chord
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const startT = ctx.currentTime + idx * 0.02;
        osc.frequency.setValueAtTime(freq, startT);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, startT + 0.2);

        gain.gain.setValueAtTime(0.12, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.22);

        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));
        osc.start(startT);
        osc.stop(startT + 0.23);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Rhythm Game: GREAT hit chime
   */
  public playRhythmGreat(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      [587.33, 880, 1174.66].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startT = ctx.currentTime + idx * 0.03;
        osc.frequency.setValueAtTime(freq, startT);

        gain.gain.setValueAtTime(0.1, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.18);

        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));
        osc.start(startT);
        osc.stop(startT + 0.19);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Rhythm Game: GOOD hit chime
   */
  public playRhythmGood(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // ignore
    }
  }

  /**
   * Rhythm Game: Metronome / Beat pulse
   */
  public playRhythmBeat(isAccent = false): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = isAccent ? 330 : 220;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(isAccent ? 0.06 : 0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.getMasterDestination(ctx));
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // ignore
    }
  }

  /**
   * Rhythm Game: Fever mode activated
   */
  public playFever(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const arpeggio = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      arpeggio.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const startT = ctx.currentTime + idx * 0.04;
        osc.frequency.setValueAtTime(freq, startT);

        gain.gain.setValueAtTime(0.12, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.15);

        osc.connect(gain);
        gain.connect(this.getMasterDestination(ctx));
        osc.start(startT);
        osc.stop(startT + 0.16);
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager();
