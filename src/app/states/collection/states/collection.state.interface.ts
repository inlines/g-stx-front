import { RequestStatus } from '@app/constants/request-status.const';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { ICollectionItem } from '../interfaces/collection-item.interface';

export interface ICollectionState {
  changeCollectionRequestStatus: RequestStatus;
  loadCollectionStatus: RequestStatus;
  loadedCollection: ICollectionItem[];
  collectionTotalCount: number;
  collectionParams: IProductListRequest;

  loadWishlistStatus: RequestStatus;
  loadedWishlist: ICollectionItem[];
  wishlistTotalCount: number;
  wishlistParams: IProductListRequest;

  loadWtsStatus: RequestStatus;
  loadedWtslist: ICollectionItem[];
  wtsTotalCount: number;
  wtsParams: IProductListRequest;
}
