export interface IPlatformItem {
  id: number;
  abbreviation: string;
  name: string;
  generation: number | null;
  total_games: number;
  user_games?: number;
}