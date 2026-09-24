import { describe, it, expect } from 'vitest';
import { calendarDays, CalendarGame } from './calendar-model';
describe('release calendar', () => {
  it('starts weeks on Monday and fills leap February', () => {
    const days = calendarDays('2024-02-01', 0, [], null);
    expect(days.slice(0, 3)).toEqual([null, null, null]);
    expect(days.filter(Boolean)).toHaveLength(29);
    expect(days.length % 7).toBe(0);
  });
  it('rolls December forward into the next year', () => {
    expect(calendarDays('2026-12-01', 2, [], null).find(Boolean)?.key).toBe('2027-02-01');
  });
  it('groups games by UTC release day and filters platforms', () => {
    const games: CalendarGame[] = [
      { id: 1, name: 'A', day: '2026-09-01', platform: 48, image_url: null },
      { id: 1, name: 'A', day: '2026-09-01', platform: 167, image_url: null },
      { id: 2, name: 'B', day: '2026-10-01', platform: 167, image_url: null },
    ];
    expect(calendarDays('2026-09-01', 0, games, null).find(Boolean)?.games).toHaveLength(2);
    expect(calendarDays('2026-09-01', 0, games, 167).find(Boolean)?.games).toHaveLength(1);
  });
});
