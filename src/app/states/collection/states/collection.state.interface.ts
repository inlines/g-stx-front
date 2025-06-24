import { RequestStatus } from "@app/constants/request-status.const";
import { ICollectionItem } from "../interfaces/collection-item.interface";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";

export interface ICollectionState {
  changeCollectionRequestStatus: RequestStatus;
  loadCollectionStatus: RequestStatus;
  loadedCollection: ICollectionItem[];
  collectionParams: IProductListRequest;
}