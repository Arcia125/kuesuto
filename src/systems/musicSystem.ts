import { GameState, IMusicSystem } from '../models';

/**
 * Chiptune music sequencer — zero audio assets. Tracks are written as token strings
 * (one token per eighth note): "C5" starts a note, "-" ties/extends the previous
 * note, "." is a rest. A lookahead scheduler queues oscillator notes slightly ahead
 * of the clock each frame (the standard WebAudio pattern), so playback is glitch-free
 * regardless of frame rate.
 *
 * "Verdelight Overworld" — an ORIGINAL adventure theme in the spirit of 16-bit
 * Zelda scores (heroic melody, pumping bass, arpeggiated middle voice). 16 bars,
 * ~132 BPM, loops seamlessly.
 */

const TEMPO_BPM = 132;
const SECONDS_PER_EIGHTH = 60 / TEMPO_BPM / 2;
const LOOKAHEAD_S = 0.2;

// A section (8 bars): C C F C | Bb F C G — B section (8 bars): Am F C G | Am F G C
const MELODY = [
  'C5 .  C5 D5 E5 -  G5 - ',
  'E5 -  D5 C5 D5 -  -  . ',
  'F5 .  F5 G5 A5 -  C6 - ',
  'G5 -  E5 C5 E5 -  -  . ',
  'D5 .  D5 E5 F5 -  A5 - ',
  'A5 -  G5 F5 G5 -  -  . ',
  'E5 G5 C6 -  B4 G5 A5 B5',
  'C6 -  -  .  G4 A4 B4 . ',
  'A5 -  E5 -  C5 -  E5 - ',
  'F5 -  C5 -  A4 -  C5 - ',
  'G5 -  E5 -  C5 -  E5 - ',
  'D5 -  B4 -  G4 -  B4 - ',
  'A5 -  -  B5 C6 -  B5 A5',
  'F5 -  -  G5 A5 -  G5 F5',
  'G5 -  A5 B5 C6 -  D6 - ',
  'E6 -  C6 -  G5 -  .  . ',
].join(' ');

const ARP = [
  'C4 E4 G4 E4 C4 E4 G4 E4',
  'C4 E4 G4 E4 C4 E4 G4 E4',
  'C4 F4 A4 F4 C4 F4 A4 F4',
  'C4 E4 G4 E4 C4 E4 G4 E4',
  'D4 F4 A#4 F4 D4 F4 A#4 F4',
  'C4 F4 A4 F4 C4 F4 A4 F4',
  'C4 E4 G4 E4 C4 E4 G4 E4',
  'B3 D4 G4 D4 B3 D4 G4 D4',
  'A3 C4 E4 C4 A3 C4 E4 C4',
  'A3 C4 F4 C4 A3 C4 F4 C4',
  'C4 E4 G4 E4 C4 E4 G4 E4',
  'B3 D4 G4 D4 B3 D4 G4 D4',
  'A3 C4 E4 C4 A3 C4 E4 C4',
  'A3 C4 F4 C4 A3 C4 F4 C4',
  'B3 D4 G4 D4 B3 D4 G4 D4',
  'C4 E4 G4 E4 C4 E4 G4 E4',
].join(' ');

const BASS = [
  'C3 .  C3 .  G2 .  C3 . ',
  'C3 .  C3 .  G2 .  C3 . ',
  'F2 .  F2 .  C3 .  F2 . ',
  'C3 .  C3 .  G2 .  C3 . ',
  'A#2 . A#2 . F2 .  A#2 .',
  'F2 .  F2 .  C3 .  F2 . ',
  'C3 .  C3 .  G2 .  C3 . ',
  'G2 .  G2 .  D3 .  G2 . ',
  'A2 .  A2 .  E2 .  A2 . ',
  'F2 .  F2 .  C3 .  F2 . ',
  'C3 .  C3 .  G2 .  C3 . ',
  'G2 .  G2 .  D3 .  G2 . ',
  'A2 .  A2 .  E2 .  A2 . ',
  'F2 .  F2 .  C3 .  F2 . ',
  'G2 .  G2 .  D3 .  G2 . ',
  'C3 .  C3 .  G2 .  C3 . ',
].join(' ');

type TrackNote = { step: number; freq: number; durEighths: number };

const NOTE_OFFSETS: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const noteToFreq = (token: string): number => {
  const match = /^([A-G])(#?)(\d)$/.exec(token);
  if (!match) throw new Error(`Bad note token: ${token}`);
  const midi = 12 * (Number(match[3]) + 1) + NOTE_OFFSETS[match[1]] + (match[2] ? 1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
};

const parseTrack = (source: string): { notes: TrackNote[]; length: number } => {
  const tokens = source.trim().split(/\s+/);
  const notes: TrackNote[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '.' ) continue;
    if (token === '-') {
      if (notes.length) notes[notes.length - 1].durEighths++;
      continue;
    }
    notes.push({ step: i, freq: noteToFreq(token), durEighths: 1 });
  }
  return { notes, length: tokens.length };
};

export class MusicSystem implements IMusicSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private tracks: { notes: TrackNote[]; length: number; type: OscillatorType; vol: number }[] = [];
  private loopSteps = 0;
  private nextStepTime = 0;
  private step = 0;

  private ensure() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      // Music sits well under the SFX.
      this.master.gain.value = 0.05;
      this.master.connect(this.ctx.destination);

      const melody = parseTrack(MELODY);
      const arp = parseTrack(ARP);
      const bass = parseTrack(BASS);
      this.tracks = [
        { ...melody, type: 'square', vol: 1 },
        { ...arp, type: 'triangle', vol: 0.55 },
        { ...bass, type: 'triangle', vol: 0.9 },
      ];
      this.loopSteps = Math.max(melody.length, arp.length, bass.length);
      this.nextStepTime = this.ctx.currentTime + 0.1;
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx.state === 'running' ? this.ctx : null;
  }

  private scheduleNote(freq: number, at: number, durS: number, type: OscillatorType, vol: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    // Chip-style envelope: instant attack, slight decay, hard stop just before the
    // note length so consecutive same-pitch notes re-articulate.
    gain.gain.setValueAtTime(vol, at);
    gain.gain.linearRampToValueAtTime(vol * 0.6, at + durS * 0.7);
    gain.gain.linearRampToValueAtTime(0.0001, at + durS * 0.92);
    osc.connect(gain);
    gain.connect(this.master!);
    osc.start(at);
    osc.stop(at + durS);
  }

  private scheduleDrums(stepInBar: number, at: number) {
    const ctx = this.ctx!;
    // Kick on beats 1 and 3 (steps 0, 4): a fast sine drop.
    if (stepInBar === 0 || stepInBar === 4) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, at);
      osc.frequency.exponentialRampToValueAtTime(40, at + 0.09);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.9, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.1);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(at);
      osc.stop(at + 0.11);
    }
    // Hat on the off-eighths: a tick of filtered noise.
    if (stepInBar % 2 === 1) {
      const dur = 0.03;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 6000;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master!);
      src.start(at);
    }
  }

  public update = (gameState: GameState, _timeStamp: number) => {
    // Music plays while the game runs (chats included); mute follows the SFX toggle.
    if (!gameState.systems.gameState.inStates(['running']) || gameState.systems.sound.muted) {
      return;
    }
    const ctx = this.ensure();
    if (!ctx) return;

    // If we fell far behind (tab hidden, long freeze), jump the clock instead of
    // machine-gunning every missed note.
    if (this.nextStepTime < ctx.currentTime - 0.5) {
      this.nextStepTime = ctx.currentTime + 0.05;
    }

    while (this.nextStepTime < ctx.currentTime + LOOKAHEAD_S) {
      for (const track of this.tracks) {
        for (const note of track.notes) {
          if (note.step === this.step % track.length) {
            this.scheduleNote(note.freq, this.nextStepTime, note.durEighths * SECONDS_PER_EIGHTH, track.type, track.vol);
          }
        }
      }
      this.scheduleDrums(this.step % 8, this.nextStepTime);
      this.step = (this.step + 1) % this.loopSteps;
      this.nextStepTime += SECONDS_PER_EIGHTH;
    }
  };
}
