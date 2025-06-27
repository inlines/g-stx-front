import { IProductListItem } from '@app/states/products/interfaces/product-list-item.interface';
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";
import { IProductPropertiesResponse } from "@app/states/products/interfaces/product-properties-response.interface";
import { ProductsActionList } from "./products-action-list.const";
import { IproductListResponse } from '../interfaces/product-list-response.interface';

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

    constructor(public payload: IproductListResponse) {
    }
  }

  export class LoadProperties {
    public static readonly type = ProductsActionList.LOAD_PROPERTIES;

    constructor(public id: number | string) {
    }
  }

  export class LoadPropertiesSuccess {
    public static readonly type = ProductsActionList.LOAD_PROPERTIES_SUCCESS;

    constructor(public payload: IProductPropertiesResponse) {
    }
  }

  export class LoadPropertiesFail {
    public static readonly type = ProductsActionList.LOAD_PROPERTIES_FAIL;
  }

  export class ProductsReset {
    public static readonly type = ProductsActionList.RESET_PRODUCTS;
  }
}