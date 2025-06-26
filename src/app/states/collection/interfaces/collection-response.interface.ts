import { ICollectionItem } from "./collection-item.interface";

export interface IcollectionResponse {
  items: ICollectionItem[];
  total_count: number;
}