import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { catalogParams, listHttpParams, normalizeListParams, sameListParams } from './list-params';

describe('List query contract', () => {
  it('removes unsupported persisted filters and normalizes the legacy sort', () => {
    const legacy = { cat: 6, query: '  Zelda  ', sort: 'popularity', developer: 'Konami', franschise: '2' };
    expect(listHttpParams(legacy as IProductListRequest)).toEqual({ cat: 6, query: 'Zelda', sort: 'name' });
  });
  it('omits missing values but retains false and zero', () => {
    expect(listHttpParams({ cat: 0, offset: 0, ignore_digital: false, query: '  ' })).toEqual({
      cat: 0,
      offset: 0,
      ignore_digital: false,
    });
  });
  it('restores a valid catalog without losing the saved page', () => {
    expect(catalogParams({ offset: 45 })).toEqual({
      cat: 6,
      offset: 45,
      limit: 15,
      sort: 'date',
      ignore_digital: true,
    });
  });
  it('preserves explicit unreleased switches and detects visibility changes', () => {
    expect(listHttpParams({ include_unreleased: false })).toEqual({ include_unreleased: false });
    expect(listHttpParams({ include_unreleased: true })).toEqual({ include_unreleased: true });
    expect(sameListParams({}, { include_unreleased: false })).toBe(true);
    expect(sameListParams({}, { include_unreleased: true })).toBe(false);
  });
  it('bounds invalid pagination and rejects non-finite values', () => {
    expect(normalizeListParams({ limit: -3, offset: -20, cat: NaN })).toEqual({ limit: 1, offset: 0 });
  });
  it('compares all supported filters independently of key order', () => {
    expect(sameListParams({ cat: 6, query: 'Mario' }, { query: 'Mario', cat: 6 })).toBe(true);
    expect(sameListParams({ ignore_digital: false }, { ignore_digital: true })).toBe(false);
  });
});
