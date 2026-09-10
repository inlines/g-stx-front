import { OnboardingSound } from './onboarding-sound';

describe('Lightweight tutorial startup audio', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('unlocks silently, plays a bounded synthesized chime and stops on close', () => {
    const starts: number[] = [];
    const stops: number[] = [];
    const close = vi.fn().mockResolvedValue(undefined);
    const parameter = () => ({
      value: 0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    });
    vi.stubGlobal(
      'AudioContext',
      class {
        state = 'running';
        currentTime = 0;
        destination = {};
        close = close;
        resume = vi.fn().mockResolvedValue(undefined);
        createGain() {
          return { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() };
        }
        createOscillator() {
          return {
            frequency: parameter(),
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: (time: number) => starts.push(time),
            stop: (time: number) => stops.push(time),
          };
        }
      },
    );
    const sound = new OnboardingSound();
    sound.prepare();
    expect(starts).toHaveLength(0);
    sound.play();
    expect(starts).toHaveLength(7);
    expect(Math.max(...stops)).toBeLessThan(3);
    sound.stop();
    sound.stop();
    expect(close).toHaveBeenCalledOnce();
  });
  it('does not fail when Web Audio is unsupported', () => {
    vi.stubGlobal('AudioContext', undefined);
    const sound = new OnboardingSound();
    expect(() => {
      sound.prepare();
      sound.play();
      sound.stop();
    }).not.toThrow();
  });
});
