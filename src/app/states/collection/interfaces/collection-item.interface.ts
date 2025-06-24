export interface ICollectionItem {
  release_id: number;
  release_date: number | null;
  platform_name: string;
  product_name: string;
  image_url: string | null;
  region_name: string | null;
  product_id: number;
}