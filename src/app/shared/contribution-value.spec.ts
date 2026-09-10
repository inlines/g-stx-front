import { normalizeAlternativeName, validAlternativeName } from './contribution-value';
describe('Alternative name validation', () => {
  it('preserves languages/case and normalizes surrounding and repeated whitespace', () => {
    expect(normalizeAlternativeName('  龍が如く   — Игра  ')).toBe('龍が如く — Игра');
  });
  it('counts Unicode code points and rejects empty, excessive and control-character input', () => {
    expect(validAlternativeName('🎮'.repeat(200))).toBe(true);
    expect(validAlternativeName('名'.repeat(201))).toBe(false);
    expect(validAlternativeName('')).toBe(false);
    expect(validAlternativeName('bad\0name')).toBe(false);
  });
});
