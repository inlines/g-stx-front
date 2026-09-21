/** Examples describe each console without rejecting valid regional prefixes or edition suffixes. */
export function serialExample(platform: number | null | undefined): string {
  switch (platform) {
    case 7:
      return 'SCES-00001';
    case 8:
      return 'SLES-50000';
    case 9:
      return 'BLES-00001';
    case 48:
      return 'CUSA-00001';
    case 167:
      return 'PPSA-00001';
    case 38:
      return 'ULES-00001';
    default:
      return 'CUSA-00001';
  }
}
/** Progressive mask. Never drop unrecognised content and accidentally search for another serial. */
export function formatSerialInput(value: string, deleting = false): string {
  const normalized = value
    .replace(/\s/g, '')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/[a-z]/g, (letter) => letter.toUpperCase());
  if (/^LSP\d/.test(normalized)) return normalized.replace(/^LSP/, 'LSP-');
  if (/^[A-Z]{4}\d/.test(normalized)) return normalized.replace(/^([A-Z]{4})/, '$1-');
  if (!deleting && /^(?:[A-Z]{4}|LSP)$/.test(normalized)) return normalized + '-';
  return normalized;
}
