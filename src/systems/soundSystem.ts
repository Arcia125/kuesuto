import { EventEmitter, EVENTS } from '../events';
import { GameState, ISoundSystem } from '../models';

/**
 * Synthesized chiptune SFX — zero audio assets. Every effect is a short oscillator
 * and/or noise burst shaped with a gain envelope, wired to existing game events.
 * Browsers only allow audio after a user gesture, so the AudioContext is created
 * lazily and resumed on each attempt; sounds before the first input are dropped.
 */
export class SoundSystem implements ISoundSystem {
  public muted = false;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  public constructor(emitter: EventEmitter) {
    emitter.on(EVENTS.ATTACK_COMMAND, () => this.swish());
    emitter.on(EVENTS.DAMAGE, (_e, { target }) => {
      if (target.name === 'player') this.hurt();
      else this.thump();
    });
    emitter.on(EVENTS.DEATH, (_e, { entity }) => {
      if (entity.name === 'player') this.fallen();
      else this.squish();
    });
    emitter.on(EVENTS.LEVEL_UP, () => this.levelUp());
    emitter.on(EVENTS.CHAT, () => this.blip());
    emitter.on(EVENTS.CHAT_NEXT, () => this.blip());
    emitter.on(EVENTS.AREA_TRANSITION_START, () => this.whoosh());
  }

  public toggleMute = () => {
    this.muted = !this.muted;
  };

  public update = (_gameState: GameState, _timeStamp: number) => { };

  private ensure() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      // Quiet by design: SFX should sit under the player's attention, not on top.
      this.master.gain.value = 0.14;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.muted || this.ctx.state !== 'running') return null;
    return { ctx: this.ctx, master: this.master! };
  }

  private tone(freq: number, dur: number, opts: { type?: OscillatorType; endFreq?: number; delay?: number; vol?: number } = {}) {
    const a = this.ensure();
    if (!a) return;
    const { type = 'square', endFreq, delay = 0, vol = 1 } = opts;
    const t0 = a.ctx.currentTime + delay;
    const osc = a.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), t0 + dur);
    const gain = a.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(a.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, opts: { delay?: number; vol?: number; cutoff?: number } = {}) {
    const a = this.ensure();
    if (!a) return;
    const { delay = 0, vol = 1, cutoff = 2000 } = opts;
    const t0 = a.ctx.currentTime + delay;
    const buffer = a.ctx.createBuffer(1, Math.ceil(a.ctx.sampleRate * dur), a.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = a.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = a.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = a.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(a.master);
    src.start(t0);
  }

  // Sword swing: airy noise sweep.
  private swish() {
    this.noise(0.09, { vol: 0.5, cutoff: 4500 });
    this.tone(700, 0.08, { type: 'sawtooth', endFreq: 220, vol: 0.25 });
  }

  // Landing a hit on an enemy: short low thump.
  private thump() {
    this.tone(170, 0.1, { type: 'square', endFreq: 90, vol: 0.9 });
    this.noise(0.06, { vol: 0.5, cutoff: 900 });
  }

  // Taking a hit: sharper, longer, unmistakably "that was me".
  private hurt() {
    this.tone(330, 0.2, { type: 'square', endFreq: 110, vol: 1 });
    this.noise(0.12, { vol: 0.6, cutoff: 700 });
  }

  // Enemy death: descending squelch.
  private squish() {
    this.tone(420, 0.22, { type: 'triangle', endFreq: 70, vol: 0.9 });
  }

  // Player death: slow three-note fall.
  private fallen() {
    this.tone(440, 0.3, { type: 'triangle', vol: 0.9 });
    this.tone(330, 0.3, { type: 'triangle', delay: 0.28, vol: 0.9 });
    this.tone(220, 0.55, { type: 'triangle', delay: 0.56, vol: 0.9 });
  }

  // Level up: quick major arpeggio.
  private levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, 0.12, { type: 'square', delay: i * 0.09, vol: 0.7 }));
  }

  // Chat text advancing: tiny blip.
  private blip() {
    this.tone(880, 0.045, { type: 'triangle', vol: 0.5 });
  }

  // Map transition: rising airy sweep.
  private whoosh() {
    this.noise(0.35, { vol: 0.4, cutoff: 1600 });
    this.tone(180, 0.32, { type: 'sine', endFreq: 520, vol: 0.5 });
  }
}
