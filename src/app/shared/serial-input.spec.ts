import { formatSerialInput, serialExample } from './serial-input';
import { validSerial } from './serial-number';
describe('serial input mask', () => {
  it('formats partial typing and lets the separator be deleted', () => {
    expect(formatSerialInput('bles')).toBe('BLES-');
    expect(formatSerialInput('bles', true)).toBe('BLES');
    expect(formatSerialInput('bles12')).toBe('BLES-12');
  });
  it('preserves regional and edition suffixes in pasted values', () => {
    for (const code of ['sles12345/H/ITA', 'cusa12345/ANZ', 'slus12345GH', 'lsp123456']) {
      expect(validSerial(formatSerialInput(code))).toBe(true);
    }
    expect(formatSerialInput(' cusa–12345/ANZ ')).toBe('CUSA-12345/ANZ');
  });
  it('does not silently convert damaged input to a different valid identifier', () => {
    expect(validSerial(formatSerialInput('BLES-12?345'))).toBe(false);
    expect(validSerial(formatSerialInput('BLES-123456'))).toBe(false);
    expect(validSerial(formatSerialInput('ßES12345'))).toBe(false);
  });
  it('provides valid examples for every active platform', () => {
    for (const id of [7, 8, 9, 48, 167, 38]) expect(validSerial(serialExample(id))).toBe(true);
    expect(serialExample(167)).toMatch(/^PPSA-/);
  });
});
