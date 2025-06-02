export interface IProductListItem {
  id: number;
  name: string;
  summary: string;
  first_release_date: number | null;
  image_url: string | null
}