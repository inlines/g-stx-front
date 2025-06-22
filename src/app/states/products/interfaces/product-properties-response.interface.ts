import { IProductDetails } from "./product-details.interface";
import { IReleaseItem } from "./release-item.interface";

export interface IProductPropertiesResponse {
  product: IProductDetails;
  releases: IReleaseItem[];
  screenshots: string[];
}