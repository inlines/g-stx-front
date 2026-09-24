export interface CalendarGame {
  id: number;
  name: string;
  platform: number;
  day: string;
  image_url: string | null;
}
export interface CalendarResponse {
  start: string;
  items: CalendarGame[];
}
export interface CalendarDay {
  key: string;
  number: number;
  games: CalendarGame[];
}
export function calendarDays(
  start: string,
  offset: number,
  games: CalendarGame[],
  platform: number | null,
): (CalendarDay | null)[] {
  const [year, month] = start.split('-').map(Number);
  const first = new Date(Date.UTC(year, month - 1 + offset, 1));
  const days: (CalendarDay | null)[] = Array.from({ length: (first.getUTCDay() + 6) % 7 }, () => null);
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  for (let day = 1; day <= count; day++) {
    const key = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), day))
      .toISOString()
      .slice(0, 10);
    days.push({
      key,
      number: day,
      games: games.filter((g) => g.day === key && (!platform || g.platform === platform)),
    });
  }
  while (days.length % 7) days.push(null);
  return days;
}
