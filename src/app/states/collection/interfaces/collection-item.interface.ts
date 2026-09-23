import type { ReleaseDates } from '@app/shared/release-date';
export interface ICollectionItem {
  release_id: number;
  platform_id?: number;
  region_id?: number | null;
  digital_only?: boolean;
  release_date: number | null;
  release_dates?: ReleaseDates;
  platform_name: string;
  product_name: string;
  alternative_names?: string[] | null;
  image_url: string | null;
  region_name: string | null;
  product_id: number;
  serial: string[];
  price: number | null;
  cib?: boolean | null;
  selected_serial?: string | null;
  purchase_price?: number | null;
  total_rating?: number | null;
  local_players?: number | null;
  online_players?: number | null;
  local_multiplayer?: boolean | null;
  online_multiplayer?: boolean | null;
}
