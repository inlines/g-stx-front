import { libraryCsv } from './library-csv';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
const item: ICollectionItem = {
  release_id: 1,
  product_id: 2,
  product_name: 'Игра; "Deluxe"',
  platform_name: 'PS4',
  region_name: null,
  release_date: null,
  serial: ['ABC', 'XYZ'],
  image_url: null,
  price: 0,
  cib: true,
};
describe('Library CSV', () => {
  it('preserves Cyrillic, quotes, separators, all serials and zero prices', () => {
    const csv = libraryCsv([item], 'collection', new Set([1]));
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Игра; ""Deluxe"""');
    expect(csv).toContain('"ABC\nXYZ"');
    expect(csv).toContain(';"0";"Да"\r\n');
    expect(csv).not.toContain('1970');
  });
  it('exports sale price and CIB separately from purchase price', () => {
    const csv = libraryCsv([item], 'wts', new Set());
    expect(csv).toContain('Цена продажи');
    expect(csv).toContain('CIB');
    expect(csv).not.toContain('Цена покупки');
    expect(csv).toContain(';"0";"Да"');
  });
  it('uses UTC dates and neutralizes spreadsheet formulas in text', () => {
    const csv = libraryCsv(
      [{ ...item, product_name: '=1+1', serial: ['+123'], release_date: Date.UTC(2026, 8, 9) }],
      'wishlist',
      new Set(),
    );
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\'+123"');
    expect(csv).toContain('2026-09-09');
  });
});
