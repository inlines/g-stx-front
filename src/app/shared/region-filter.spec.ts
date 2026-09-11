import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { itemRegion, matchesRegion, normalizeRegions, ownedRegionCounts, platformRegionCounts, toggleRegion } from './region-filter';

const item = (product_id: number, region_id: number | null, digital_only = false): ICollectionItem => ({
  product_id, region_id, digital_only, release_id: product_id,
  platform_name: 'PS4', product_name: 'Game', release_date: null,
  image_url: null, region_name: null, serial: [], price: null,
});

describe('Regional collection filters', () => {
  it('groups only North America as America, including Brazil and unknown in Other', () => {
    expect([1, 2, 5, 8, 10, null].map(id => itemRegion(item(1, id))))
      .toEqual(['europe', 'america', 'japan', 'other', 'other', 'other']);
  });
  it('counts unique games within each region and excludes digital copies', () => {
    expect(ownedRegionCounts([
      item(1, 1), item(1, 1), item(1, 2), item(2, 10),
      item(2, 5), item(3, null), item(4, 1, true),
    ])).toEqual({ europe: 1, america: 1, japan: 1, other: 2 });
  });
  it('uses a union of regions and restores all records when selection is cleared', () => {
    const items = [item(1, 1), item(2, 2), item(3, 10)];
    expect(items.filter(i => matchesRegion(i, ['europe', 'other'])).map(i => i.product_id)).toEqual([1, 3]);
    expect(items.filter(i => matchesRegion(i, []))).toEqual(items);
    expect(toggleRegion(toggleRegion([], 'america'), 'america')).toEqual([]);
  });
  it('canonicalizes persisted filters and does not report unknown totals as zero', () => {
    expect(normalizeRegions('other, europe,other,invalid')).toEqual(['europe', 'other']);
    expect(platformRegionCounts().europe).toBeUndefined();
  });
});
