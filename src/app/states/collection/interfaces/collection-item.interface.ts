export interface ICollectionItem {
  release_id: number;
  platform_id?: number;
  region_id?: number | null;
  digital_only?: boolean;
  release_date: number | null;
  platform_name: string;
  product_name: string;
  alternative_names?: string[] | null;
  image_url: string | null;
  region_name: string | null;
  product_id: number;
  serial: string[];
  price: number | null;
  cib?: boolean;
}
