export interface IPlatformItem {
  id: number;
  abbreviation: string;
  name: string;
  generation: number | null;
  total_games: number;
  europe_games?: number;
  america_games?: number;
  japan_games?: number;
  other_games?: number;
  user_games?: number;
  total_spent?: number;
}
