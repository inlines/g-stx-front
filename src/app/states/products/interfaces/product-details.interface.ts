import { IProductListItem } from "./product-list-item.interface";

export interface IProductDetails extends IProductListItem {
  summary: string;
}