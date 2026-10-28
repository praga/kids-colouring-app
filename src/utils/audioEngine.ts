/**
 * 100% Offline Audio Engine using Web Audio API
 * Generates playful sound effects dynamically without loading any external .mp3 files.
 */

class KidAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('kids_colouring_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kids_colouring_muted', String(muted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Cheerful bubble pop on tool / color select
   */
  public playPop() {
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const startTime = ctx.currentTime;
    osc.type = 'sine';
    // Frequency sweeps quickly upward for a bouncy cartoon pop
    osc.frequency.setValueAtTime(420, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.08);

    gain.gain.setValueAtTime(0.28, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.1);
  }

  /**
   * Gentle bloop/splash for Paint Bucket flood fill
   */
  public playSplash() {
    const ctx = this.initContext();
    if (!ctx) return;

    const startTime = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(300, startTime);
    osc1.frequency.exponentialRampToValueAtTime(650, startTime + 0.06);
    osc1.frequency.exponentialRampToValueAtTime(220, startTime + 0.18);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(600, startTime);
    osc2.frequency.exponentialRampToValueAtTime(900, startTime + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(350, startTime + 0.18);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.2);
    osc2.stop(startTime + 0.2);
  }

  /**
   * Magical shimmering sparkle chime for Magic Brush
   */
  public playSparkle() {
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7 arpeggio
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const noteTime = now + idx * 0.04;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }

  /**
   * Soft whoosh / swoosh on page turn or undo
   */
  public playWhoosh() {
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Cheerful celebration fanfare when completing a page
   */
  public playFanfare() {
    const ctx = this.initContext();
    if (!ctx) return;

    // Happy fanfare notes: C5, E5, G5, C6 (chord hold)
    const melody = [
      { f: 523.25, d: 0.1, t: 0 },
      { f: 659.25, d: 0.1, t: 0.11 },
      { f: 783.99, d: 0.1, t: 0.22 },
      { f: 1046.5, d: 0.45, t: 0.33 }
    ];

    const now = ctx.currentTime;

    melody.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + n.t;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + n.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + n.d);
    });
  }
}

export const sound = new KidAudioEngine();
