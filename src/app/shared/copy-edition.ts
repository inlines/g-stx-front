import { canonicalSerial } from './serial-number';
export interface CopyEditionSource {
  selected_serial?: string | null;
  selected_edition?: string | null;
  serial_editions?: {serial: string; edition: string}[];
}
/** Resolve only the selected copy; conflicting catalogue editions remain unspecified. */
export function copyEdition(item: CopyEditionSource): string | null {
  const serial = item.selected_serial?.trim().toUpperCase();
  if (!serial) return item.selected_edition ?? null;
  const editions = [...new Set((item.serial_editions ?? [])
    .filter(e => canonicalSerial(e.serial) === canonicalSerial(serial)).map(e => e.edition))];
  if (editions.length === 1) return editions[0];
  if (item.selected_edition) return item.selected_edition;
  if (editions.length > 1) return null;
  if (/\/P(?:\/|$)/.test(serial)) return 'platinum';
  if (/\/E(?:\/|$)/.test(serial)) return 'essentials';
  return null;
}
