// Web Audio API Rhythm Music & Drum Synthesizer Engine

export interface TrackMusicData {
  id: string;
  bpm: number;
  // Notes in semitones relative to C4 (or frequency numbers)
  chords: number[][]; // e.g. [ [C4, E4, G4], [G3, B3, D4], ... ]
  bassNotes: number[]; // e.g. [ C2, G2, A2, F2 ]
  melodyNotes: Array<{ note: number; beat: number; duration: number }>;
  drumPattern: {
    kickBeats: number[]; // 16th-note indices where kick hits (0 to 15 in a measure)
    snareBeats: number[];
    hihatBeats: number[];
  };
}

// Convert MIDI note number to Frequency (60 = Middle C4 = 261.63Hz)
function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// Built-in musical track sequences
export const TRACK_MUSIC_PRESETS: Record<string, TrackMusicData> = {
  nursery_beat: {
    id: 'nursery_beat',
    bpm: 80,
    // C - G - Am - F progression
    chords: [
      [60, 64, 67], // C major (C4, E4, G4)
      [55, 59, 62], // G major (G3, B3, D4)
      [57, 60, 64], // A minor (A3, C4, E4)
      [53, 57, 60], // F major (F3, A3, C4)
    ],
    bassNotes: [36, 43, 45, 41], // C2, G2, A2, F2
    // Twinkle Twinkle Little Star & Little Butterfly melody line
    melodyNotes: [
      // Measure 1 (C major): C C G G
      { note: 72, beat: 0, duration: 0.8 },
      { note: 72, beat: 1, duration: 0.8 },
      { note: 79, beat: 2, duration: 0.8 },
      { note: 79, beat: 3, duration: 0.8 },
      // Measure 2 (G major): A A G -
      { note: 81, beat: 4, duration: 0.8 },
      { note: 81, beat: 5, duration: 0.8 },
      { note: 79, beat: 6, duration: 1.8 },
      // Measure 3 (Am / F): F F E E
      { note: 77, beat: 8, duration: 0.8 },
      { note: 77, beat: 9, duration: 0.8 },
      { note: 76, beat: 10, duration: 0.8 },
      { note: 76, beat: 11, duration: 0.8 },
      // Measure 4: D D C -
      { note: 74, beat: 12, duration: 0.8 },
      { note: 74, beat: 13, duration: 0.8 },
      { note: 72, beat: 14, duration: 1.8 },
    ],
    drumPattern: {
      kickBeats: [0, 4, 8, 12], // 4-beat gentle kick
      snareBeats: [4, 12],       // Snare on 2 & 4
      hihatBeats: [0, 2, 4, 6, 8, 10, 12, 14], // 8th note shaker
    },
  },

  pop_groove: {
    id: 'pop_groove',
    bpm: 102,
    // Fmaj7 - G7 - Em7 - Am7 (Catchy Pop Groove)
    chords: [
      [53, 57, 60, 64], // Fmaj7
      [55, 59, 62, 65], // G7
      [52, 55, 59, 62], // Em7
      [57, 60, 64, 67], // Am7
    ],
    bassNotes: [41, 43, 40, 45], // F2, G2, E2, A2
    melodyNotes: [
      // Measure 1: Plucky Synth Riff
      { note: 69, beat: 0, duration: 0.4 },
      { note: 72, beat: 0.5, duration: 0.4 },
      { note: 76, beat: 1, duration: 0.8 },
      { note: 74, beat: 2, duration: 0.5 },
      { note: 72, beat: 2.5, duration: 0.5 },
      { note: 69, beat: 3, duration: 0.8 },

      // Measure 2:
      { note: 71, beat: 4, duration: 0.4 },
      { note: 74, beat: 4.5, duration: 0.4 },
      { note: 77, beat: 5, duration: 0.8 },
      { note: 76, beat: 6, duration: 0.5 },
      { note: 74, beat: 6.5, duration: 0.5 },
      { note: 71, beat: 7, duration: 0.8 },

      // Measure 3:
      { note: 67, beat: 8, duration: 0.4 },
      { note: 72, beat: 8.5, duration: 0.4 },
      { note: 76, beat: 9, duration: 0.8 },
      { note: 79, beat: 10, duration: 0.8 },
      { note: 76, beat: 11, duration: 0.8 },

      // Measure 4:
      { note: 81, beat: 12, duration: 0.6 },
      { note: 79, beat: 13, duration: 0.6 },
      { note: 76, beat: 14, duration: 0.6 },
      { note: 72, beat: 15, duration: 0.8 },
    ],
    drumPattern: {
      kickBeats: [0, 4, 8, 10, 12],
      snareBeats: [4, 12],
      hihatBeats: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  },

  turbo_arcade: {
    id: 'turbo_arcade',
    bpm: 120,
    // Dm - Bb - C - Am (High Energy Chiptune / Electro)
    chords: [
      [50, 53, 57], // Dm
      [46, 50, 53], // Bb
      [48, 52, 55], // C
      [45, 48, 52], // Am
    ],
    bassNotes: [38, 34, 36, 33], // D2, Bb1, C2, A1
    melodyNotes: [
      // Measure 1: 8-bit Hero Arpeggio
      { note: 74, beat: 0, duration: 0.3 },
      { note: 77, beat: 0.5, duration: 0.3 },
      { note: 81, beat: 1, duration: 0.3 },
      { note: 86, beat: 1.5, duration: 0.6 },
      { note: 81, beat: 2.5, duration: 0.3 },
      { note: 77, beat: 3, duration: 0.6 },

      // Measure 2:
      { note: 70, beat: 4, duration: 0.3 },
      { note: 74, beat: 4.5, duration: 0.3 },
      { note: 77, beat: 5, duration: 0.3 },
      { note: 82, beat: 5.5, duration: 0.6 },
      { note: 77, beat: 6.5, duration: 0.3 },
      { note: 74, beat: 7, duration: 0.6 },

      // Measure 3:
      { note: 72, beat: 8, duration: 0.3 },
      { note: 76, beat: 8.5, duration: 0.3 },
      { note: 79, beat: 9, duration: 0.3 },
      { note: 84, beat: 9.5, duration: 0.6 },
      { note: 79, beat: 10.5, duration: 0.3 },
      { note: 76, beat: 11, duration: 0.6 },

      // Measure 4:
      { note: 81, beat: 12, duration: 0.3 },
      { note: 84, beat: 12.5, duration: 0.3 },
      { note: 88, beat: 13, duration: 0.6 },
      { note: 86, beat: 14, duration: 0.6 },
      { note: 84, beat: 15, duration: 0.8 },
    ],
    drumPattern: {
      kickBeats: [0, 4, 8, 12],
      snareBeats: [4, 12],
      hihatBeats: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
  },

  english_pop: {
    id: 'english_pop',
    bpm: 92,
    // G - D - Em - C (Pop Anthem)
    chords: [
      [55, 59, 62], // G major
      [50, 54, 57], // D major
      [52, 55, 59], // E minor
      [48, 52, 55], // C major
    ],
    bassNotes: [43, 38, 40, 36], // G2, D2, E2, C2
    melodyNotes: [
      // Measure 1:
      { note: 71, beat: 0, duration: 0.7 },
      { note: 74, beat: 1, duration: 0.7 },
      { note: 79, beat: 2, duration: 1.2 },
      { note: 76, beat: 3.5, duration: 0.4 },

      // Measure 2:
      { note: 74, beat: 4, duration: 0.7 },
      { note: 71, beat: 5, duration: 0.7 },
      { note: 69, beat: 6, duration: 1.5 },

      // Measure 3:
      { note: 71, beat: 8, duration: 0.7 },
      { note: 74, beat: 9, duration: 0.7 },
      { note: 76, beat: 10, duration: 1.2 },
      { note: 79, beat: 11.5, duration: 0.4 },

      // Measure 4:
      { note: 83, beat: 12, duration: 0.7 },
      { note: 81, beat: 13, duration: 0.7 },
      { note: 79, beat: 14, duration: 1.8 },
    ],
    drumPattern: {
      kickBeats: [0, 4, 8, 12],
      snareBeats: [4, 12],
      hihatBeats: [0, 2, 4, 6, 8, 10, 12, 14],
    },
  },
};

export class RhythmMusicEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private currentTrack: TrackMusicData = TRACK_MUSIC_PRESETS.nursery_beat;
  private timerId: number | null = null;
  private nextBeatTime: number = 0;
  private current16thBeat: number = 0;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    const savedMute = localStorage.getItem('typang_muted');
    this.isMuted = savedMute === 'true';
  }

  public initContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && !this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && !this.noiseBuffer) {
      this.createNoiseBuffer();
    }
    return this.ctx;
  }

  private createNoiseBuffer(): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.28, this.ctx.currentTime);
    }
  }

  public setTrack(trackId: string): void {
    if (TRACK_MUSIC_PRESETS[trackId]) {
      this.currentTrack = TRACK_MUSIC_PRESETS[trackId];
    }
  }

  public start(trackId?: string): void {
    this.initContext();
    if (trackId && TRACK_MUSIC_PRESETS[trackId]) {
      this.currentTrack = TRACK_MUSIC_PRESETS[trackId];
    }
    this.stop();
    this.isPlaying = true;
    this.current16thBeat = 0;
    if (this.ctx) {
      this.nextBeatTime = this.ctx.currentTime + 0.05;
    }
    this.scheduler();
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private scheduler = (): void => {
    if (!this.isPlaying || !this.ctx) return;

    const secondsPer16th = (60 / this.currentTrack.bpm) / 4;
    const scheduleAheadTime = 0.15; // Schedule 150ms ahead

    while (this.nextBeatTime < this.ctx.currentTime + scheduleAheadTime) {
      this.schedule16thBeat(this.current16thBeat, this.nextBeatTime);
      this.nextBeatTime += secondsPer16th;
      this.current16thBeat = (this.current16thBeat + 1) % 64; // 4 measures loop (16 * 4 = 64 sixteenth notes)
    }

    this.timerId = window.setTimeout(this.scheduler, 25);
  };

  private schedule16thBeat(beatIndex: number, time: number): void {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const measureIndex = Math.floor(beatIndex / 16) % 4;
    const beatInMeasure = beatIndex % 16;
    const quarterBeat = beatIndex / 4; // Floating quarter beat (0 to 15.75)

    // 1. Play Kick Drum
    if (this.currentTrack.drumPattern.kickBeats.includes(beatInMeasure)) {
      this.playKick(time);
    }

    // 2. Play Snare Drum
    if (this.currentTrack.drumPattern.snareBeats.includes(beatInMeasure)) {
      this.playSnare(time);
    }

    // 3. Play Hi-Hat
    if (this.currentTrack.drumPattern.hihatBeats.includes(beatInMeasure)) {
      this.playHiHat(time, beatInMeasure % 4 === 0);
    }

    // 4. Play Chord Harmony (on each measure / bar start)
    if (beatInMeasure === 0) {
      const chord = this.currentTrack.chords[measureIndex] || this.currentTrack.chords[0];
      this.playChord(chord, time, (60 / this.currentTrack.bpm) * 3.8);
    }

    // 5. Play Bass Line (quarter note or eighth note pulse)
    if (beatInMeasure % 4 === 0) {
      const bassNote = this.currentTrack.bassNotes[measureIndex] || this.currentTrack.bassNotes[0];
      this.playBass(bassNote, time, (60 / this.currentTrack.bpm) * 0.8);
    } else if (beatInMeasure % 4 === 2 && this.currentTrack.bpm > 95) {
      // Octave bounce for upbeat tracks
      const bassNote = (this.currentTrack.bassNotes[measureIndex] || this.currentTrack.bassNotes[0]) + 12;
      this.playBass(bassNote, time, (60 / this.currentTrack.bpm) * 0.4);
    }

    // 6. Play Melody Notes
    const melodyMatches = this.currentTrack.melodyNotes.filter(
      (m) => Math.abs(m.beat * 4 - beatIndex) < 0.2
    );

    for (const m of melodyMatches) {
      this.playMelodyNote(m.note, time, m.duration * (60 / this.currentTrack.bpm));
    }
  }

  // --- Instrument Synthesizers ---

  private playKick(time: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.45, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  private playSnare(time: number): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;

    // Noise burst for snare snap
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(800, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.15);

    // Body tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.11);
  }

  private playHiHat(time: number, isAccented: boolean): void {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    const volume = isAccented ? 0.15 : 0.08;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isAccented ? 0.06 : 0.035));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
    noise.stop(time + 0.07);
  }

  private playBass(midiNote: number, time: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(midiToFreq(midiNote), time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);
    filter.frequency.exponentialRampToValueAtTime(120, time + duration);

    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private playChord(chordNotes: number[], time: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    for (const note of chordNotes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(midiToFreq(note), time);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    }
  }

  private playMelodyNote(midiNote: number, time: number, duration: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(midiToFreq(midiNote), time);

    // Warm chiptune / music box bell filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, time);
    filter.frequency.exponentialRampToValueAtTime(600, time + duration);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }
}

// Global Singleton for easy use
export const rhythmMusicEngine = new RhythmMusicEngine();
