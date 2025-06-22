import { RequestStatus } from "@app/constants/request-status.const";
import { ICollectionItem } from "../interfaces/collection-item.interface";

export interface ICollectionState {
  changeCollectionRequestStatus: RequestStatus;
  loadCollectionStatus: RequestStatus;
  loadedCollection: ICollectionItem[];
}