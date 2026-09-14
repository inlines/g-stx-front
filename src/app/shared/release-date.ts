import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { RegionGroup } from './region-filter';

/** API values remain Unix seconds; presentation dates are milliseconds. */
export type ReleaseDates = Partial<Record<RegionGroup | 'all' | 'worldwide' | 'first', number | null>>;
export function selectedReleaseDate(dates: ReleaseDates, regions: readonly RegionGroup[]): number | null {
  const candidates = (regions.length ? regions.map((region) => dates[region]) : [dates.all])
    .filter((value): value is number => value != null && Number.isFinite(value));
  const seconds = candidates.length ? Math.min(...candidates) : dates.worldwide ?? dates.first ?? null;
  return seconds == null ? null : seconds * 1000;
}
export function withReleaseDate(item: ICollectionItem, regions: readonly RegionGroup[]): ICollectionItem {
  // Old API responses keep their existing per-copy date during a rolling deployment.
  return item.release_dates ? { ...item, release_date: selectedReleaseDate(item.release_dates, regions) } : item;
}
