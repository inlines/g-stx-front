/** Original console-inspired startup chime, synthesized locally (no audio download). */
export class OnboardingSound {
  private context?: AudioContext;
  prepare(): void {
    this.stop();
    try {
      const Context =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context) return;
      this.context = new Context();
      // Called from the login gesture so Safari can unlock audio before the HTTP response.
      void this.context.resume().catch(() => {});
    } catch {
      /* Audio is optional and must never interrupt login. */
    }
  }
  play(): void {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const master = context.createGain();
    master.gain.value = 0.16;
    master.connect(context.destination);
    const start = context.currentTime + 0.03;
    const note = (
      frequency: number,
      offset: number,
      duration: number,
      volume: number,
      type: OscillatorType,
    ) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency * 0.98, start + offset);
      oscillator.frequency.exponentialRampToValueAtTime(frequency, start + offset + 0.15);
      gain.gain.setValueAtTime(0, start + offset);
      gain.gain.linearRampToValueAtTime(volume, start + offset + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + duration);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    };
    [130.81, 196, 261.63, 329.63].forEach((frequency, i) =>
      note(frequency, i * 0.07, 2.4 - i * 0.07, 0.32, 'triangle'),
    );
    [523.25, 783.99, 1046.5].forEach((frequency, i) => note(frequency, 0.6 + i * 0.24, 1.55, 0.18, 'sine'));
  }
  stop(): void {
    const context = this.context;
    this.context = undefined;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
