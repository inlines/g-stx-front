import { IProductListItem } from "./product-list-item.interface";

export interface IproductListResponse {
  total_count: number;
  items: IProductListItem[];
}