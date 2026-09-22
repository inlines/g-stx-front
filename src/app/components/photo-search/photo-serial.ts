import { canonicalSerial, validSerial } from '@app/shared/serial-number';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
import { RegionGroup } from '@app/shared/region-filter';

/** Only printed, complete candidates: never guess missing letters or replace O with 0. */
export function photoSerials(text: string): string[] {
  const normalized = text.toUpperCase().replace(/[‐‑‒–—−]/g, '-');
  const matches =
    normalized.match(
      /(?<![A-Z0-9])(?:[A-Z]{4}[\s-]*\d{5}(?:[A-Z]{1,4}|(?:[-/][A-Z0-9]{1,8}){1,3})?|LSP[\s-]*\d{6}|T[\s-]*\d{3,5}[GH](?:-\d{2})?|(?:GS|MK)[\s-]*\d{4,5}(?:-\d{2})?|\d{5}(?:-\d{2})?)(?![A-Z0-9])/g,
    ) ?? [];
  return [...new Set(matches.map(canonicalSerial).filter(validSerial))];
}
export function serialPlatform(serial: string): number | null {
  if (/^CUSA-/.test(serial)) return 48;
  if (/^PPSA-/.test(serial)) return 167;
  if (/^(?:UC|UL)/.test(serial)) return 38;
  if (/^(?:BC|BL|NP)/.test(serial)) return 9;
  if (/^(?:GS-|MK-|T-|\d)/.test(serial)) return 32;
  // SCES/SLES/SLPS etc. overlap between PS1 and PS2; let the user choose.
  return null;
}
export function releaseRegionGroup(region: string): RegionGroup {
  const value = region.toLowerCase().replaceAll(' ', '_');
  return value === 'europe'
    ? 'europe'
    : value === 'north_america'
      ? 'america'
      : value === 'japan'
        ? 'japan'
        : 'other';
}
export function matchingPhotoReleases(
  releases: IReleaseItem[],
  serial: string,
  platform: number,
): IReleaseItem[] {
  const code = canonicalSerial(serial);
  return releases.filter(
    (r) => r.platform_id === platform && r.serial?.some((s) => canonicalSerial(s) === code),
  );
}
