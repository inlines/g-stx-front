import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { RequestStatus } from '@app/constants/request-status.const';

export interface IproductState {
  productList: IProductListItem[];
  productListRequestStatus: RequestStatus,
  productListRequestParams: IProductListRequest,
}