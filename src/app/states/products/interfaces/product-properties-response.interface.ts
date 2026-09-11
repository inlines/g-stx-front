import { ICompanyItem } from './company-item.interface';
import { IFranschiseItem } from './franschise-item.interface';
import { IProductDetails } from './product-details.interface';
import { IReleaseItem } from './release-item.interface';

export interface IProductPropertiesResponse {
  product: IProductDetails;
  multiplayer?: IMultiplayerMode[];
  similar_games?: ISimilarGame[];
  companies: ICompanyItem[];
  releases: IReleaseItem[];
  screenshots: string[];
  franschises: IFranschiseItem[];
}

export interface IMultiplayerMode {
  platform_id: number | null;
  platform_name: string | null;
  local_players: number | null;
  online_players: number | null;
  local_multiplayer: boolean | null;
  online_multiplayer: boolean | null;
  offline_coop: boolean | null;
  online_coop: boolean | null;
  offline_coop_players: number | null;
  online_coop_players: number | null;
}
export interface ISimilarGame {
  id: number;
  name: string;
  image_url: string | null;
  platform_ids: number[];
}
