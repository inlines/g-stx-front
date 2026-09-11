import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { IPlatformItem } from '@app/states/platforms/interfaces/platform-item.interface';

export const REGION_GROUPS = ['europe', 'america', 'other'] as const;
export type RegionGroup = typeof REGION_GROUPS[number];
export type RegionCounts = Partial<Record<RegionGroup, number>>;
export function normalizeRegions(value?: string): RegionGroup[] {
  const values = new Set(value?.split(',').map((v) => v.trim()));
  return REGION_GROUPS.filter((r) => values.has(r));
}
export function toggleRegion(selected: readonly RegionGroup[], group: RegionGroup): RegionGroup[] {
  return REGION_GROUPS.filter((r) => r === group ? !selected.includes(r) : selected.includes(r));
}
export function itemRegion(item: ICollectionItem): RegionGroup {
  if (item.region_id !== undefined) return item.region_id === 1 ? 'europe' : item.region_id === 2 ? 'america' : 'other';
  const name = item.region_name?.trim().toLowerCase().replaceAll(' ', '_');
  return name === 'europe' ? 'europe' : name === 'north_america' ? 'america' : 'other';
}
export function matchesRegion(item: ICollectionItem, selected: readonly RegionGroup[]): boolean {
  return !selected.length || selected.includes(itemRegion(item));
}
export function ownedRegionCounts(items: readonly ICollectionItem[]): RegionCounts {
  return Object.fromEntries(REGION_GROUPS.map((region) => [region, new Set(items.filter((item) => !item.digital_only && itemRegion(item) === region).map((item) => item.product_id)).size]));
}
export function platformRegionCounts(platform?: IPlatformItem): RegionCounts {
  return { europe: platform?.europe_games, america: platform?.america_games, other: platform?.other_games };
}
