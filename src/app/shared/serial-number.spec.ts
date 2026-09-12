import { canonicalSerial, validSerial, displaySerials } from './serial-number';
describe('Serial format', () => {
  it('normalizes separators and case without losing edition suffixes', () => {
    expect(canonicalSerial(' cusa 02343/H/ITA ')).toBe('CUSA-02343/H/ITA');
    expect(canonicalSerial('ULES‑00718')).toBe('ULES-00718');
    for (const code of ['SLUS-20144GH', 'SLPM-65002-0', 'SCES-54330/ANZ', 'CUSA-02343/H/ITA'])
      expect(validSerial(code)).toBe(true);
  });
  it('rejects partial numbers, wildcards, mixed codes and Cyrillic', () => {
    for (const code of ['', 'CUSA-1234', 'CUSA-123456', '%', 'CUSA-12345 CUSA-12346', 'СUSA-12345'])
      expect(validSerial(code)).toBe(false);
  });
  it('deduplicates display variants while preserving order and damaged legacy records', () => {
    expect(displaySerials(['cusa12345', 'CUSA-12345', 'SLUS-12345', 'ULJMnnnnn'])).toEqual([
      'CUSA-12345',
      'SLUS-12345',
      'ULJMnnnnn',
    ]);
  });
});
