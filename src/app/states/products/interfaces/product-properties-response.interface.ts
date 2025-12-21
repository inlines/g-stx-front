import { ICompanyItem } from "./company-item.interface";
import { IProductDetails } from "./product-details.interface";
import { IReleaseItem } from "./release-item.interface";

export interface IProductPropertiesResponse {
  product: IProductDetails;
  companies: ICompanyItem[];
  releases: IReleaseItem[];
  screenshots: string[];
}