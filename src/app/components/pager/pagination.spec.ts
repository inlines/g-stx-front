import { buildPages } from './pagination';
describe('Pagination', () => {
  it('handles empty and one-page results', () => {
    expect(buildPages(0, 1, 5)).toEqual([]);
    expect(buildPages(1, 1, 5)).toEqual([1]);
  });
  it('creates a bounded window even for millions of pages', () => {
    expect(buildPages(1000000, 100, 1)).toEqual([1, '...', 99, 100, 101, '...', 1000000]);
  });
  it('does not repeat boundary pages', () => {
    expect(buildPages(4, 1, 1)).toEqual([1, 2, '...', 4]);
  });
});
