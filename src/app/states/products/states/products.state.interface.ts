import { RegionCounts } from '@app/shared/region-filter';
import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { RequestStatus } from '@app/constants/request-status.const';
import { IProductPropertiesResponse } from '@app/states/products/interfaces/product-properties-response.interface';

export interface IproductState {
  productList: IProductListItem[];
  productsTotalCount: number;
  regionCounts?: RegionCounts;
  productListRequestStatus: RequestStatus;
  displayedParams?: IProductListRequest;
  productListRequestParams: IProductListRequest;
  productProperties: IProductPropertiesResponse | null;
  productPropertiesErrorStatus: number | null;
  productPropertiesRequestStatus: RequestStatus;
}
