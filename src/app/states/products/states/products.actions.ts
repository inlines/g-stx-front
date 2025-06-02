import { IProductListItem } from "../interfaces/product-list-item.interface";
import { IProductListRequest } from "../interfaces/product-list-request.interface";
import { ProductsActionList } from "./products-action-list.const";

export namespace ProductsActions {
  export class SetRequestParams {
    public static readonly type = ProductsActionList.SET_REQUEST_PARAMS;

    constructor(public payload: IProductListRequest) {
    }
  }

  export class LoadList {
    public static readonly type = ProductsActionList.LOAD_LIST;
  }

  export class LoadListFail {
    public static readonly type = ProductsActionList.LOAD_LIST_FAIL;
  }

  export class LoadListSuccess {
    public static readonly type = ProductsActionList.LOAD_LIST_SUCCESS;

    constructor(public payload: IProductListItem[]) {
    }
  }
}