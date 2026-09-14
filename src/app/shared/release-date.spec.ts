import { selectedReleaseDate, withReleaseDate } from './release-date';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';

describe('Contextual release dates', () => {
  const dates = { all: 100, europe: 300, america: 400, japan: null, worldwide: 100, first: 10 };
  it('prefers the selected region even when worldwide and the original game are older', () => {
    expect(selectedReleaseDate(dates, ['europe'])).toBe(300000);
    expect(selectedReleaseDate(dates, ['america', 'europe'])).toBe(300000);
  });
  it('uses the platform minimum with no region and worldwide when a selected region has no date', () => {
    expect(selectedReleaseDate(dates, [])).toBe(100000);
    expect(selectedReleaseDate(dates, ['japan'])).toBe(100000);
  });
  it('uses the game date only after worldwide, never a date from an unselected region', () => {
    expect(selectedReleaseDate({ ...dates, worldwide: null }, ['japan'])).toBe(10000);
    expect(selectedReleaseDate({ ...dates, worldwide: null, first: null }, ['japan'])).toBeNull();
    expect(selectedReleaseDate({ first: 0 }, [])).toBe(0);
  });
  it('does not mutate the owned release or scale dates twice when the region changes', () => {
    const item = { release_date: 900000, release_dates: dates } as ICollectionItem;
    expect(withReleaseDate(item, ['europe']).release_date).toBe(300000);
    expect(withReleaseDate(withReleaseDate(item, ['europe']), ['america']).release_date).toBe(400000);
    expect(item.release_date).toBe(900000);
    expect(withReleaseDate({ ...item, release_dates: undefined }, []).release_date).toBe(900000);
  });
});
