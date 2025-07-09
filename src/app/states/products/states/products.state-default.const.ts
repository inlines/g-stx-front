import { RequestStatus } from "@app/constants/request-status.const";
import { IproductState } from "./products.state.interface";

export const PRODUCTS_STATE_DEFAULTS: IproductState = {
  productList: [],
  productsTotalCount: 0,
  productListRequestStatus: RequestStatus.NotInvoked,
  productListRequestParams: {limit: 18, cat: 6, offset: 0, ignore_digital: false},
  productProperties: null,
  productPropertiesRequestStatus: RequestStatus.NotInvoked,
}