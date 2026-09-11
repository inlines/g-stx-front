export interface IProductListItem {
  id: number;
  /** Absent on older API versions: do not treat unknown as missing. */
  has_serials?: boolean;
  name: string;
  first_release_date: number | null;
  image_url: string | null;
  alternative_names: string[] | null;
}
