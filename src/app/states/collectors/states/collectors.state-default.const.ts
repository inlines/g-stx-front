import { RequestStatus } from "@app/constants/request-status.const";
import { IcollectorsState } from "./collectors.state.interface";

export const COLLECTORS_STATE_DEFAULTS: IcollectorsState = {
  collectorsList: [],
  collectorsTotalCount: 0,
  collectorsListRequestStatus: RequestStatus.NotInvoked,
  collectorPropertiesRequestStatus: RequestStatus.NotInvoked,
  collectionTotalCount: 0,
  loadedCollection: [],
  collectionPropertiesLogin: null,
}