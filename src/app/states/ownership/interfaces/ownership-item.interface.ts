export interface IOwnershipItem {
  platform: number;

  have_count: number;
  have_games: number;
  have_ids: number[];

  wish_count: number;
  wish_ids: number[];

  bid_count: number;
  bid_ids: number[];
}