import { RequestStatus } from "@app/constants/request-status.const";
import { ICollectionState } from "./collection.state.interface";


export const COLLECTION_STATE_DEFAULTS: ICollectionState = {
  changeCollectionRequestStatus: RequestStatus.NotInvoked,
  loadCollectionStatus:RequestStatus.NotInvoked,
  loadWishlistStatus:RequestStatus.NotInvoked,
  loadedCollection: [],
  collectionTotalCount: 0,
  collectionParams: {},
  wishlistParams: {},
  wishlistTotalCount: 0,
  loadedWishlist: [],
}