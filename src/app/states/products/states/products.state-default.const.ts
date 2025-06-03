import { RequestStatus } from "@app/constants/request-status.const";
import { IproductState } from "./products.state.interface";

export const PRODUCTS_STATE_DEFAULTS: IproductState = {
  productList: [],
  productListRequestStatus: RequestStatus.NotInvoked,
  productListRequestParams: {},
  productProperties: null,
  productPropertiesRequestStatus: RequestStatus.NotInvoked,
}