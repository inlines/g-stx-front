import { RequestStatus } from "@app/constants/request-status.const";
import { ICollectorItem } from "../interfaces/collector-item.interface";
import { IcollectionResponse } from "@app/states/collection/interfaces/collection-response.interface";
import { ICollectionItem } from "@app/states/collection/interfaces/collection-item.interface";

export interface IcollectorsState {
  collectorsList: ICollectorItem[];
  collectorsTotalCount: number;
  collectorsListRequestStatus: RequestStatus,
  collectorPropertiesRequestStatus: RequestStatus,
  loadedCollection: ICollectionItem[];
  collectionTotalCount: number;
  collectionPropertiesLogin: string | null;
}