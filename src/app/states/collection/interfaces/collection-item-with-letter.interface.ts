import { ICollectionItem } from "./collection-item.interface";

export interface ICollectionItemWithLetter {
  item: ICollectionItem;
  letter?: string;
  release_year?: string;
}