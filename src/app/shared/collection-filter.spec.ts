import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { filterCollection, unixMilliseconds } from './collection-filter';

const item = (
  release_id: number,
  product_name: string,
  price: number | null,
  release_date: number | null,
): ICollectionItem => ({
  release_id,
  product_name,
  price,
  release_date,
  product_id: release_id,
  platform_name: 'PC',
  serial: [],
  region_name: null,
  image_url: null,
});

describe('Collection filtering', () => {
  const items = Object.freeze([
    item(1, 'Zelda', null, null),
    item(2, 'Mario', 20, 1000),
    item(3, 'mario 2', 0, 0),
  ]);
  it('trims and matches case-insensitively without changing its input', () => {
    expect(filterCollection(items, '  MARIO ', 'name').map((x) => x.release_id)).toEqual([2, 3]);
    expect(items.map((x) => x.release_id)).toEqual([1, 2, 3]);
  });
  it('treats zero as a real price and puts unknown prices last', () => {
    expect(filterCollection(items, '', 'price').map((x) => x.release_id)).toEqual([3, 2, 1]);
  });
  it('sorts real dates before unknown dates, including the Unix epoch', () => {
    expect(filterCollection(items, '', 'date').map((x) => x.release_id)).toEqual([3, 2, 1]);
    expect(unixMilliseconds(null)).toBeNull();
    expect(unixMilliseconds(0)).toBe(0);
    expect(unixMilliseconds(100)).toBe(100000);
  });
});
