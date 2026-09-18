import { LYRIC_SONGS_DATA, LyricNote } from '../data/lyricsData';

export type MelodyInstrument = 'piano' | 'musicbox' | 'synth';

// Standard Note to Frequency mapping (Hz)
const PITCH_FREQUENCIES: Record<string, number> = {
  C3: 130.81, 'C#3': 138.59, D3: 146.83, 'D#3': 155.56, E3: 164.81, F3: 174.61, 'F#3': 185.00, G3: 196.00, 'G#3': 207.65, A3: 220.00, 'A#3': 233.08, B3: 246.94,
  C4: 261.63, 'C#4': 277.18, D4: 293.66, 'D#4': 311.13, E4: 329.63, F4: 349.23, 'F#4': 369.99, G4: 392.00, 'G#4': 415.30, A4: 440.00, 'A#4': 466.16, B4: 493.88,
  C5: 523.25, 'C#5': 554.37, D5: 587.33, 'D#5': 622.25, E5: 659.25, F5: 698.46, 'F#5': 739.99, G5: 783.99, 'G#5': 830.61, A5: 880.00, 'A#5': 932.33, B5: 987.77,
  C6: 1046.50
};

class LyricsAudioPlayer {
  private audioCtx: AudioContext | null = null;
  private currentSongId: string | null = null;
  private currentLineIndex: number = -1;
  private activeNoteIndex: number = -1;
  private isPlayingState: boolean = false;
  private timerId: number | null = null;
  private volume: number = 0.5; // 0 to 1
  private instrument: MelodyInstrument = 'piano';
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private initCtx() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
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
    this.listeners.forEach(fn => fn());
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public getCurrentSongId(): string | null {
    return this.currentSongId;
  }

  public getCurrentLineIndex(): number {
    return this.currentLineIndex;
  }

  public getActiveNoteIndex(): number {
    return this.activeNoteIndex;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public setInstrument(inst: MelodyInstrument) {
    this.instrument = inst;
    this.notify();
  }

  public getInstrument(): MelodyInstrument {
    return this.instrument;
  }

  private playTone(freq: number, duration: number, startTime: number) {
    if (!this.audioCtx || this.volume <= 0) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    const overtone = ctx.createOscillator();
    const overtoneGain = ctx.createGain();

    if (this.instrument === 'musicbox') {
      // 맑고 영롱한 오르골 소리 (사인파 + 맑은 고음 배음)
      osc.type = 'sine';
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.4, startTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 1.8);

      overtoneGain.gain.setValueAtTime(0, startTime);
      overtoneGain.gain.linearRampToValueAtTime(this.volume * 0.15, startTime + 0.01);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 1.0);
    } else if (this.instrument === 'synth') {
      // 몽환적인 로파이 신스 (삼각파 + 따뜻한 서스테인)
      osc.type = 'triangle';
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 0.5, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 1.3);

      overtoneGain.gain.setValueAtTime(0, startTime);
      overtoneGain.gain.linearRampToValueAtTime(this.volume * 0.12, startTime + 0.04);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 1.3);
    } else {
      // 감성 피아노 톤 (자연스러운 피아노 해머 타건 및 잔향)
      osc.type = 'sine';
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.45, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 1.2);

      overtoneGain.gain.setValueAtTime(0, startTime);
      overtoneGain.gain.linearRampToValueAtTime(this.volume * 0.1, startTime + 0.02);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration * 0.6);
    }

    osc.frequency.setValueAtTime(freq, startTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    overtone.connect(overtoneGain);
    overtoneGain.connect(ctx.destination);

    osc.start(startTime);
    overtone.start(startTime);

    osc.stop(startTime + duration * 1.8);
    overtone.stop(startTime + duration * 1.8);
  }

  /**
   * 가사말 소절(line)에 정확히 맞춘 진짜 멜로디를 재생합니다.
   * 타자 치는 곳에서 곡 전체가 시작되는 게 아니라, 현재 타이핑할 가사말에 맞게 시작됩니다!
   */
  public playLyricLine(songId: string, lineIndex: number, loop: boolean = false) {
    this.initCtx();
    this.stop();

    const song = LYRIC_SONGS_DATA.find(s => s.id === songId);
    if (!song || !this.audioCtx) return;

    const validLineIdx = Math.max(0, Math.min(lineIndex, song.lines.length - 1));
    const notes: LyricNote[] =
      song.lineMelodies && song.lineMelodies[validLineIdx] && song.lineMelodies[validLineIdx].length > 0
        ? song.lineMelodies[validLineIdx]
        : song.melodyNotes;

    this.currentSongId = songId;
    this.currentLineIndex = validLineIdx;
    this.isPlayingState = true;
    this.activeNoteIndex = 0;
    this.notify();

    let noteIdx = 0;
    const beatSec = 60 / song.tempo;

    const playNextNote = () => {
      if (!this.isPlayingState || !this.audioCtx) return;

      if (noteIdx >= notes.length) {
        if (loop) {
          noteIdx = 0;
        } else {
          this.isPlayingState = false;
          this.activeNoteIndex = -1;
          this.notify();
          return;
        }
      }

      const currentNote = notes[noteIdx];
      const duration = currentNote.duration * beatSec;
      this.activeNoteIndex = noteIdx;
      this.notify();

      if (currentNote.pitch !== 'REST') {
        const freq = PITCH_FREQUENCIES[currentNote.pitch] || 440;
        this.playTone(freq, duration, this.audioCtx.currentTime);
      }

      noteIdx++;
      const nextDelayMs = duration * 1000;
      this.timerId = window.setTimeout(playNextNote, nextDelayMs);
    };

    playNextNote();
  }

  /**
   * 전체 곡 루프 재생 (기존 호환용)
   */
  public playSong(songId: string) {
    this.playLyricLine(songId, 0, true);
  }

  public stop() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.isPlayingState = false;
    this.activeNoteIndex = -1;
    this.notify();
  }

  public togglePlayLine(songId: string, lineIndex: number) {
    if (this.isPlayingState && this.currentSongId === songId && this.currentLineIndex === lineIndex) {
      this.stop();
    } else {
      this.playLyricLine(songId, lineIndex, false);
    }
  }

  public togglePlay(songId: string) {
    if (this.isPlayingState && this.currentSongId === songId) {
      this.stop();
    } else {
      this.playSong(songId);
    }
  }
}

export const lyricsAudioPlayer = new LyricsAudioPlayer();
