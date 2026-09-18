// Authentic Acoustic Piano Music Engine for Long Text Practice
// Web Audio API acoustic piano soundboard synthesis & peaceful classical piano masterworks

export interface NewAgeTrack {
  id: string;
  title: string;
  artist: string;
  tempo: number; // BPM
  mood: string;
  emoji: string;
  notes: { pitch: string; duration: number; time: number; velocity?: number }[];
  loopLength: number; // in seconds
}

// Frequency map (Hz) calibrated to standard A440 concert pitch
const NOTE_FREQ: Record<string, number> = {
  // Octave 2
  C2: 65.41, 'C#2': 69.30, D2: 73.42, 'D#2': 77.78, E2: 82.41, F2: 87.31, 'F#2': 92.50, G2: 98.00, 'G#2': 103.83, A2: 110.00, 'A#2': 116.54, B2: 123.47,
  // Octave 3
  C3: 130.81, 'C#3': 138.59, D3: 146.83, 'D#3': 155.56, E3: 164.81, F3: 174.61, 'F#3': 185.00, G3: 196.00, 'G#3': 207.65, A3: 220.00, 'A#3': 233.08, B3: 246.94,
  // Octave 4 (Middle C = C4)
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.00, 'G#4': 415.30, A4: 440.00, 'A#4': 466.16, B4: 493.88,
  // Octave 5
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, 'G#5': 830.61, A5: 880.00, 'A#5': 932.33, B5: 987.77,
  // Octave 6
  C6: 1046.50, 'C#6': 1108.73, D6: 1174.66, 'D#6': 1244.51, E6: 1318.51, F6: 1396.91, 'F#6': 1479.98, G6: 1567.98, A6: 1760.00
};

// 4 World-renowned Calming Acoustic Piano Masterpieces
export const NEW_AGE_TRACKS: NewAgeTrack[] = [
  {
    id: 'gymnopedie',
    title: '에릭 사티 - 짐노페디 1번 (Gymnopédie No.1)',
    artist: '클래식 피아노',
    tempo: 64,
    mood: '새벽녘 고요한 물결처럼 잔잔하고 사색적인 피아노',
    emoji: '🎹',
    loopLength: 28,
    notes: [
      // Measure 1: Gmaj7 chord accompaniment
      { pitch: 'G2', time: 0.0, duration: 4.0, velocity: 0.6 },
      { pitch: 'B3', time: 0.8, duration: 2.5, velocity: 0.4 },
      { pitch: 'D4', time: 0.8, duration: 2.5, velocity: 0.4 },
      { pitch: 'F#4', time: 0.8, duration: 2.5, velocity: 0.45 },
      { pitch: 'B3', time: 1.8, duration: 2.0, velocity: 0.35 },
      { pitch: 'D4', time: 1.8, duration: 2.0, velocity: 0.35 },
      { pitch: 'F#4', time: 1.8, duration: 2.0, velocity: 0.4 },

      // Measure 2: D chord
      { pitch: 'D2', time: 2.8, duration: 4.0, velocity: 0.6 },
      { pitch: 'A3', time: 3.6, duration: 2.5, velocity: 0.4 },
      { pitch: 'C#4', time: 3.6, duration: 2.5, velocity: 0.4 },
      { pitch: 'F#4', time: 3.6, duration: 2.5, velocity: 0.4 },
      { pitch: 'A3', time: 4.6, duration: 2.0, velocity: 0.35 },
      { pitch: 'C#4', time: 4.6, duration: 2.0, velocity: 0.35 },

      // Measure 3: Melody entrance (F#4 -> G4 -> F#4)
      { pitch: 'G2', time: 5.6, duration: 4.0, velocity: 0.55 },
      { pitch: 'B3', time: 6.4, duration: 2.5, velocity: 0.4 },
      { pitch: 'D4', time: 6.4, duration: 2.5, velocity: 0.4 },
      { pitch: 'F#4', time: 6.4, duration: 2.8, velocity: 0.75 }, // Melody
      { pitch: 'G4', time: 7.4, duration: 2.2, velocity: 0.7 }, // Melody

      // Measure 4: Melody continues (F#4 -> C#4)
      { pitch: 'D2', time: 8.4, duration: 4.0, velocity: 0.55 },
      { pitch: 'A3', time: 9.2, duration: 2.5, velocity: 0.4 },
      { pitch: 'C#4', time: 9.2, duration: 2.5, velocity: 0.4 },
      { pitch: 'F#4', time: 9.2, duration: 2.2, velocity: 0.7 },
      { pitch: 'C#4', time: 10.2, duration: 2.5, velocity: 0.7 },

      // Measure 5: B3 -> D4
      { pitch: 'G2', time: 11.4, duration: 4.0, velocity: 0.55 },
      { pitch: 'B3', time: 12.0, duration: 2.5, velocity: 0.65 },
      { pitch: 'D4', time: 13.0, duration: 2.5, velocity: 0.7 },

      // Measure 6: E4 cadence
      { pitch: 'D2', time: 14.2, duration: 4.0, velocity: 0.55 },
      { pitch: 'A3', time: 14.8, duration: 2.5, velocity: 0.4 },
      { pitch: 'C#4', time: 14.8, duration: 2.5, velocity: 0.4 },
      { pitch: 'E4', time: 14.8, duration: 3.5, velocity: 0.75 },

      // Measure 7: Gentle reprise phrase
      { pitch: 'G2', time: 17.0, duration: 4.0, velocity: 0.5 },
      { pitch: 'B3', time: 17.6, duration: 2.5, velocity: 0.4 },
      { pitch: 'D4', time: 17.6, duration: 2.5, velocity: 0.4 },
      { pitch: 'F#4', time: 18.2, duration: 2.5, velocity: 0.7 },
      { pitch: 'G4', time: 19.4, duration: 2.2, velocity: 0.7 },
      { pitch: 'A4', time: 20.6, duration: 2.8, velocity: 0.8 },

      // Measure 8: Warm ending chord
      { pitch: 'D2', time: 22.0, duration: 5.0, velocity: 0.55 },
      { pitch: 'A2', time: 22.2, duration: 5.0, velocity: 0.5 },
      { pitch: 'F#3', time: 22.6, duration: 4.5, velocity: 0.5 },
      { pitch: 'A3', time: 23.0, duration: 4.5, velocity: 0.55 },
      { pitch: 'D4', time: 23.4, duration: 4.5, velocity: 0.6 },
      { pitch: 'F#4', time: 24.0, duration: 4.0, velocity: 0.65 },
    ]
  },
  {
    id: 'canon-piano',
    title: '파헬벨 - 캐논 피아노 변주곡 (Canon in D)',
    artist: '클래식 피아노',
    tempo: 68,
    mood: '마음이 따스해지는 포근하고 평화로운 피아노 선율',
    emoji: '🕊️',
    loopLength: 24,
    notes: [
      // D
      { pitch: 'D2', time: 0.0, duration: 3.0, velocity: 0.6 },
      { pitch: 'A3', time: 0.3, duration: 2.0, velocity: 0.45 },
      { pitch: 'D4', time: 0.6, duration: 2.0, velocity: 0.5 },
      { pitch: 'F#4', time: 1.0, duration: 2.2, velocity: 0.7 },

      // A
      { pitch: 'A2', time: 2.4, duration: 3.0, velocity: 0.6 },
      { pitch: 'E3', time: 2.7, duration: 2.0, velocity: 0.45 },
      { pitch: 'A3', time: 3.0, duration: 2.0, velocity: 0.5 },
      { pitch: 'E4', time: 3.4, duration: 2.2, velocity: 0.7 },

      // Bm
      { pitch: 'B2', time: 4.8, duration: 3.0, velocity: 0.6 },
      { pitch: 'F#3', time: 5.1, duration: 2.0, velocity: 0.45 },
      { pitch: 'B3', time: 5.4, duration: 2.0, velocity: 0.5 },
      { pitch: 'D4', time: 5.8, duration: 2.2, velocity: 0.7 },

      // F#m
      { pitch: 'F#2', time: 7.2, duration: 3.0, velocity: 0.55 },
      { pitch: 'C#3', time: 7.5, duration: 2.0, velocity: 0.45 },
      { pitch: 'F#3', time: 7.8, duration: 2.0, velocity: 0.5 },
      { pitch: 'C#4', time: 8.2, duration: 2.2, velocity: 0.65 },

      // G
      { pitch: 'G2', time: 9.6, duration: 3.0, velocity: 0.6 },
      { pitch: 'D3', time: 9.9, duration: 2.0, velocity: 0.45 },
      { pitch: 'G3', time: 10.2, duration: 2.0, velocity: 0.5 },
      { pitch: 'B3', time: 10.6, duration: 2.2, velocity: 0.7 },

      // D/F#
      { pitch: 'D2', time: 12.0, duration: 3.0, velocity: 0.6 },
      { pitch: 'A2', time: 12.3, duration: 2.0, velocity: 0.45 },
      { pitch: 'F#3', time: 12.6, duration: 2.0, velocity: 0.5 },
      { pitch: 'A3', time: 13.0, duration: 2.2, velocity: 0.7 },

      // G -> A melody flourish
      { pitch: 'G2', time: 14.4, duration: 2.5, velocity: 0.6 },
      { pitch: 'B3', time: 14.8, duration: 2.0, velocity: 0.5 },
      { pitch: 'D4', time: 15.2, duration: 2.0, velocity: 0.65 },
      { pitch: 'G4', time: 15.6, duration: 2.0, velocity: 0.75 },

      // A7
      { pitch: 'A2', time: 16.8, duration: 3.5, velocity: 0.6 },
      { pitch: 'E3', time: 17.2, duration: 2.5, velocity: 0.5 },
      { pitch: 'C#4', time: 17.6, duration: 2.5, velocity: 0.65 },
      { pitch: 'A4', time: 18.2, duration: 3.0, velocity: 0.8 },
      { pitch: 'F#4', time: 19.4, duration: 2.5, velocity: 0.7 },
      { pitch: 'E4', time: 20.4, duration: 2.5, velocity: 0.65 },
      { pitch: 'D4', time: 21.4, duration: 2.5, velocity: 0.7 },
    ]
  },
  {
    id: 'clair-de-lune',
    title: '드뷔시 - 달빛 (Clair de Lune)',
    artist: '클래식 피아노',
    tempo: 58,
    mood: '밤하늘 은은한 달빛 아래 흐르는 서정적인 피아노',
    emoji: '🌙',
    loopLength: 26,
    notes: [
      // F - Ab - C arpeggio
      { pitch: 'F2', time: 0.0, duration: 4.0, velocity: 0.55 },
      { pitch: 'C3', time: 0.4, duration: 3.0, velocity: 0.4 },
      { pitch: 'Ab3', time: 0.8, duration: 2.5, velocity: 0.45 },
      { pitch: 'C4', time: 1.2, duration: 2.5, velocity: 0.5 },
      { pitch: 'Eb4', time: 1.8, duration: 2.5, velocity: 0.7 },
      { pitch: 'Ab4', time: 2.6, duration: 3.0, velocity: 0.75 },

      // Db maj
      { pitch: 'Db2', time: 4.2, duration: 4.5, velocity: 0.55 },
      { pitch: 'Ab2', time: 4.6, duration: 3.5, velocity: 0.4 },
      { pitch: 'F3', time: 5.0, duration: 3.0, velocity: 0.45 },
      { pitch: 'Db4', time: 5.5, duration: 2.5, velocity: 0.55 },
      { pitch: 'F4', time: 6.2, duration: 3.0, velocity: 0.75 },
      { pitch: 'Eb4', time: 7.4, duration: 2.5, velocity: 0.65 },

      // Bb minor
      { pitch: 'Bb2', time: 8.8, duration: 4.0, velocity: 0.55 },
      { pitch: 'F3', time: 9.2, duration: 3.0, velocity: 0.4 },
      { pitch: 'Db4', time: 9.6, duration: 2.5, velocity: 0.5 },
      { pitch: 'F4', time: 10.2, duration: 3.0, velocity: 0.7 },
      { pitch: 'Db5', time: 11.2, duration: 3.5, velocity: 0.8 },

      // Gb maj7
      { pitch: 'Gb2', time: 13.0, duration: 4.0, velocity: 0.55 },
      { pitch: 'Db3', time: 13.4, duration: 3.0, velocity: 0.4 },
      { pitch: 'Bb3', time: 13.8, duration: 2.5, velocity: 0.45 },
      { pitch: 'F4', time: 14.4, duration: 2.5, velocity: 0.65 },
      { pitch: 'Eb4', time: 15.4, duration: 2.5, velocity: 0.6 },

      // Db major coda
      { pitch: 'Db2', time: 17.0, duration: 5.0, velocity: 0.6 },
      { pitch: 'Ab2', time: 17.5, duration: 4.5, velocity: 0.5 },
      { pitch: 'F3', time: 18.0, duration: 4.0, velocity: 0.5 },
      { pitch: 'Ab3', time: 18.5, duration: 4.0, velocity: 0.55 },
      { pitch: 'Db4', time: 19.2, duration: 4.0, velocity: 0.65 },
      { pitch: 'F4', time: 20.0, duration: 4.0, velocity: 0.7 },
      { pitch: 'Ab4', time: 21.0, duration: 4.5, velocity: 0.75 },
    ]
  },
  {
    id: 'nocturne',
    title: '쇼팽 - 녹턴 9-2번 (Nocturne Op.9 No.2)',
    artist: '클래식 피아노',
    tempo: 62,
    mood: '서재의 온기를 머금은 감미롭고 우아한 피아노',
    emoji: '🕯️',
    loopLength: 26,
    notes: [
      // Eb
      { pitch: 'Eb2', time: 0.0, duration: 4.0, velocity: 0.6 },
      { pitch: 'G3', time: 0.5, duration: 2.0, velocity: 0.4 },
      { pitch: 'Bb3', time: 0.5, duration: 2.0, velocity: 0.4 },
      { pitch: 'Eb4', time: 0.5, duration: 2.0, velocity: 0.45 },
      { pitch: 'G3', time: 1.2, duration: 1.8, velocity: 0.35 },
      { pitch: 'Bb3', time: 1.2, duration: 1.8, velocity: 0.35 },
      { pitch: 'G4', time: 1.6, duration: 2.5, velocity: 0.8 }, // Chopin's iconic melody opening
      { pitch: 'G4', time: 2.8, duration: 1.5, velocity: 0.7 },

      // G7 -> Cm
      { pitch: 'G2', time: 3.8, duration: 3.5, velocity: 0.6 },
      { pitch: 'F3', time: 4.2, duration: 2.0, velocity: 0.4 },
      { pitch: 'B3', time: 4.2, duration: 2.0, velocity: 0.4 },
      { pitch: 'D4', time: 4.2, duration: 2.0, velocity: 0.45 },
      { pitch: 'Ab4', time: 4.8, duration: 2.0, velocity: 0.75 },
      { pitch: 'G4', time: 5.6, duration: 2.0, velocity: 0.7 },
      { pitch: 'F4', time: 6.4, duration: 2.0, velocity: 0.65 },

      // Cm -> Bb
      { pitch: 'C2', time: 7.4, duration: 3.5, velocity: 0.55 },
      { pitch: 'Eb3', time: 7.8, duration: 2.0, velocity: 0.4 },
      { pitch: 'G3', time: 7.8, duration: 2.0, velocity: 0.4 },
      { pitch: 'Eb4', time: 8.4, duration: 2.5, velocity: 0.75 },
      { pitch: 'D4', time: 9.4, duration: 2.0, velocity: 0.65 },

      // Bb7
      { pitch: 'Bb2', time: 10.6, duration: 3.5, velocity: 0.55 },
      { pitch: 'D3', time: 11.0, duration: 2.0, velocity: 0.4 },
      { pitch: 'Ab3', time: 11.0, duration: 2.0, velocity: 0.4 },
      { pitch: 'C4', time: 11.6, duration: 2.5, velocity: 0.7 },
      { pitch: 'Bb3', time: 12.6, duration: 2.5, velocity: 0.75 },

      // Eb Reprise
      { pitch: 'Eb2', time: 14.0, duration: 4.0, velocity: 0.6 },
      { pitch: 'Bb2', time: 14.4, duration: 3.0, velocity: 0.45 },
      { pitch: 'G3', time: 14.8, duration: 2.5, velocity: 0.5 },
      { pitch: 'Eb4', time: 15.4, duration: 3.0, velocity: 0.75 },
      { pitch: 'G4', time: 16.4, duration: 3.0, velocity: 0.8 },
      { pitch: 'Bb4', time: 17.6, duration: 3.5, velocity: 0.85 },

      // Delicate Outro Chords
      { pitch: 'Ab2', time: 19.5, duration: 4.0, velocity: 0.55 },
      { pitch: 'Eb3', time: 20.0, duration: 3.5, velocity: 0.45 },
      { pitch: 'C4', time: 20.5, duration: 3.5, velocity: 0.6 },
      { pitch: 'Eb4', time: 21.0, duration: 3.5, velocity: 0.65 },
      { pitch: 'Eb2', time: 22.0, duration: 4.5, velocity: 0.6 },
      { pitch: 'G3', time: 22.5, duration: 4.0, velocity: 0.55 },
      { pitch: 'Bb3', time: 22.8, duration: 4.0, velocity: 0.6 },
      { pitch: 'Eb4', time: 23.2, duration: 4.0, velocity: 0.65 },
    ]
  }
];

class NewAgeBgmEngine {
  private audioCtx: AudioContext | null = null;
  private isPlayingState: boolean = false;
  private currentTrackId: string = 'gymnopedie';
  private volume: number = 0.4;
  private masterGain: GainNode | null = null;
  private soundboardFilter: BiquadFilterNode | null = null;
  private scheduledTimeouts: number[] = [];
  private loopTimer: number | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Acoustic piano soundboard simulation (warm lowpass filtering around 2800 Hz)
      this.soundboardFilter = this.audioCtx.createBiquadFilter();
      this.soundboardFilter.type = 'lowpass';
      this.soundboardFilter.frequency.value = 2800;
      this.soundboardFilter.Q.value = 0.7; // Smooth natural roll-off

      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);

      this.soundboardFilter.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getCurrentTrack(): NewAgeTrack {
    return NEW_AGE_TRACKS.find((t) => t.id === this.currentTrackId) || NEW_AGE_TRACKS[0];
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
    this.notify();
  }

  public setTrack(trackId: string) {
    if (this.currentTrackId === trackId) return;
    this.currentTrackId = trackId;
    if (this.isPlayingState) {
      this.stopSchedule();
      this.scheduleCurrentTrack();
    }
    this.notify();
  }

  public play() {
    this.initCtx();
    if (this.isPlayingState) return;

    this.isPlayingState = true;
    this.scheduleCurrentTrack();
    this.notify();
  }

  public pause() {
    this.isPlayingState = false;
    this.stopSchedule();
    this.notify();
  }

  public toggle() {
    if (this.isPlayingState) {
      this.pause();
    } else {
      this.play();
    }
  }

  private stopSchedule() {
    this.scheduledTimeouts.forEach((id) => window.clearTimeout(id));
    this.scheduledTimeouts = [];
    if (this.loopTimer) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private scheduleCurrentTrack() {
    this.stopSchedule();
    if (!this.isPlayingState) return;

    const track = this.getCurrentTrack();

    // Schedule each note in the track
    track.notes.forEach((n) => {
      const delayMs = n.time * 1000;
      const tid = window.setTimeout(() => {
        if (!this.isPlayingState) return;
        this.playAcousticPianoNote(n.pitch, n.duration, n.velocity ?? 0.7);
      }, delayMs);
      this.scheduledTimeouts.push(tid);
    });

    // Schedule next loop iteration
    const loopDurationMs = track.loopLength * 1000;
    this.loopTimer = window.setTimeout(() => {
      if (this.isPlayingState) {
        this.scheduleCurrentTrack();
      }
    }, loopDurationMs);
  }

  /**
   * Authentic Physical Piano Acoustic Synthesis:
   * Real piano tone is built from a fast hammer felt strike (<5ms),
   * followed by fundamental string oscillation, warm 2nd harmonic, and gentle bell-like 3rd harmonic.
   * No weird sub-octaves or harsh synthesizers.
   */
  private playAcousticPianoNote(pitch: string, durationSec: number, velocity: number) {
    if (!this.audioCtx || !this.soundboardFilter) return;

    const freq = NOTE_FREQ[pitch];
    if (!freq) return;

    const now = this.audioCtx.currentTime;
    const noteGain = this.audioCtx.createGain();

    // Velocity scaling (gentle dynamics suitable for peaceful reading)
    const peakGain = 0.28 * Math.max(0.2, Math.min(1.0, velocity));

    // Acoustic Piano ADSR:
    // 1. Hammer strike attack (4ms)
    // 2. Initial string damping (decay to 65% over 120ms)
    // 3. Gentle exponential ring/sustain over note duration
    noteGain.gain.setValueAtTime(0.0001, now);
    noteGain.gain.exponentialRampToValueAtTime(peakGain, now + 0.005);
    noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.65, now + 0.12);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.8, durationSec));

    // Oscillator 1: Fundamental Sine (the core body of piano string)
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    // Oscillator 2: 2nd Harmonic (Octave up, ~30% gain for acoustic warmth)
    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    const osc2Gain = this.audioCtx.createGain();
    osc2Gain.gain.setValueAtTime(0.3, now);
    osc2Gain.gain.exponentialRampToValueAtTime(0.1, now + 0.3); // Harmonics decay faster than fundamental
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    // Oscillator 3: 3rd Harmonic (Octave + 5th, ~12% gain for delicate acoustic piano strike sparkle)
    const osc3 = this.audioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, now);
    const osc3Gain = this.audioCtx.createGain();
    osc3Gain.gain.setValueAtTime(0.12, now);
    osc3Gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc3.connect(osc3Gain);
    osc3Gain.connect(noteGain);

    osc1.connect(noteGain);
    noteGain.connect(this.soundboardFilter);

    const stopTime = now + Math.max(0.9, durationSec + 0.2);
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(stopTime);
    osc2.stop(stopTime);
    osc3.stop(stopTime);
  }
}

export const newAgeBgmEngine = new NewAgeBgmEngine();
