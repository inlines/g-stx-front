/** A short original arcade slash, entirely synthesized; failure never blocks search. */
export class NinjaSound {
  private context?: AudioContext;
  prepare() {
    this.stop();
    try {
      const Audio =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Audio) return;
      this.context = new Audio();
      void this.context.resume().catch(() => {});
    } catch {
      /* Optional easter egg. */
    }
  }
  async play() {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    try {
      const at = ctx.currentTime;
      const tone = ctx.createOscillator(),
        volume = ctx.createGain();
      tone.type = 'triangle';
      tone.frequency.setValueAtTime(1400, at);
      tone.frequency.exponentialRampToValueAtTime(140, at + 0.18);
      tone.frequency.setValueAtTime(880, at + 0.2);
      tone.frequency.exponentialRampToValueAtTime(440, at + 0.28);
      volume.gain.setValueAtTime(0, at);
      volume.gain.linearRampToValueAtTime(0.1, at + 0.008);
      volume.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
      volume.gain.linearRampToValueAtTime(0.06, at + 0.205);
      volume.gain.exponentialRampToValueAtTime(0.001, at + 0.31);
      tone.connect(volume);
      volume.connect(ctx.destination);
      tone.start(at);
      tone.stop(at + 0.32);
      tone.onended = () => {
        tone.disconnect();
        volume.disconnect();
      };
      await new Promise<void>((resolve) => setTimeout(resolve, 340));
    } catch {
      /* Keep navigation working when audio is unavailable. */
    } finally {
      this.stop();
    }
  }
  stop() {
    const ctx = this.context;
    this.context = undefined;
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
  }
}
