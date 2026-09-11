import { RegionCounts } from '@app/shared/region-filter';
import { IProductListItem } from './product-list-item.interface';

export interface IproductListResponse {
  total_count: number;
  region_counts?: RegionCounts | null;
  items: IProductListItem[];
}
