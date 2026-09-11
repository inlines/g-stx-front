export interface IProductListItem {
  id: number;
  total_rating?: number | null;
  total_rating_count?: number | null;
  local_players?: number | null;
  online_players?: number | null;
  local_multiplayer?: boolean | null;
  online_multiplayer?: boolean | null;
  /** Absent on older API versions: do not treat unknown as missing. */
  has_serials?: boolean;
  name: string;
  first_release_date: number | null;
  image_url: string | null;
  alternative_names: string[] | null;
}
