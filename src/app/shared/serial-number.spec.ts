import { canonicalSerial, validSerial, displaySerials } from './serial-number';
describe('Serial format', () => {
  it('normalizes confirmed Saturn formats without losing region suffixes', () => {
    for (const [raw, expected] of [['gs9001','GS-9001'], ['t3101g','T-3101G'], ['mk81005-50','MK-81005-50'], ['81005','81005']]) {
      expect(canonicalSerial(raw)).toBe(expected);
      expect(validSerial(raw)).toBe(true);
    }
    for (const raw of ['GS-900', 'T-3101', 'MK-8100', 'T-3101G-5']) expect(validSerial(raw)).toBe(false);
  });
  it('normalizes separators and case without losing edition suffixes', () => {
    expect(canonicalSerial(' cusa 02343/H/ITA ')).toBe('CUSA-02343/H/ITA');
    expect(canonicalSerial('ULES‑00718')).toBe('ULES-00718');
    for (const code of ['SLUS-20144GH', 'SLPM-65002-0', 'SCES-54330/ANZ', 'CUSA-02343/H/ITA'])
      expect(validSerial(code)).toBe(true);
  });
  it('accepts PS1 Lightspan identifiers', () => {
    expect(canonicalSerial('lsp990121')).toBe('LSP-990121');
    expect(validSerial('LSP-990121')).toBe(true);
    expect(validSerial('LSP-99012')).toBe(false);
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
