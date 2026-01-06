import { RequestStatus } from "@app/constants/request-status.const";
import { IproductState } from "./products.state.interface";

export const PRODUCTS_STATE_DEFAULTS: IproductState = {
  productList: [],
  productsTotalCount: 0,
  productListRequestStatus: RequestStatus.NotInvoked,
  productListRequestParams: {limit: 15, offset: 0, ignore_digital: true, sort: 'date'},
  productProperties: null,
  productPropertiesRequestStatus: RequestStatus.NotInvoked,
}