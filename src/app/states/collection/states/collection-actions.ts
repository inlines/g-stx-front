import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";
import { ICollectionItem } from "../interfaces/collection-item.interface";
import { IEditCollectionPayload } from "../interfaces/edit-collection-payload.interface";
import { CollectionActionList } from "./collection-action-list.const";
import { IcollectionResponse } from "../interfaces/collection-response.interface";

export namespace CollectionActions {
  export class AddToCollectionRequest {
    public static readonly type = CollectionActionList.ADD_REQUEST;

    constructor(public payload: IEditCollectionPayload) {}
  }

  export class AddToCollectionSuccess {
    public static readonly type = CollectionActionList.ADD_REQUEST_SUCCESS;
  }

  export class AddToCollectionFail {
    public static readonly type = CollectionActionList.ADD_REQUEST_FAIL;
  }

  export class AddWishRequest {
    public static readonly type = CollectionActionList.ADD_WISH_REQUEST;

    constructor(public payload: IEditCollectionPayload) {}
  }

  export class AddWishSuccess {
    public static readonly type = CollectionActionList.ADD_WISH_REQUEST_SUCCESS;
  }

  export class AddWishFail {
    public static readonly type = CollectionActionList.ADD_WISH_REQUEST_FAIL;
  }

  export class AddBidRequest {
    public static readonly type = CollectionActionList.ADD_BID_REQUEST;

    constructor(public payload: IEditCollectionPayload) {}
  }

  export class AddBidSuccess {
    public static readonly type = CollectionActionList.ADD_BID_REQUEST_SUCCESS;
  }

  export class AddBidFail {
    public static readonly type = CollectionActionList.ADD_WISH_REQUEST_FAIL;
  }

  export class RemoveFromCollectionRequest {
    public static readonly type = CollectionActionList.REMOVE_REQUEST;

    constructor(public payload: IEditCollectionPayload) {}
  }

  export class RemoveFromCollectionSuccess {
    public static readonly type = CollectionActionList.REMOVE_REQUEST_SUCCESS;
  }

  export class RemoveFromCollectionFail {
    public static readonly type = CollectionActionList.REMOVE_REQUEST_FAIL;
  }

  export class RemoveWishRequest {
    public static readonly type = CollectionActionList.REMOVE_WISH_REQUEST;

    constructor(public payload: IEditCollectionPayload) {}
  }

  export class RemoveWishSuccess {
    public static readonly type = CollectionActionList.REMOVE_WISH_REQUEST_SUCCESS;
  }

  export class RemoveWishFail {
    public static readonly type = CollectionActionList.REMOVE_WISH_REQUEST_FAIL;
  }

  export class RemoveBidRequest {
    public static readonly type = CollectionActionList.REMOVE_BID_REQUEST;

    constructor(public payload: IEditCollectionPayload) {}
  }

  export class RemoveBidSuccess {
    public static readonly type = CollectionActionList.REMOVE_BID_REQUEST_SUCCESS;
  }

  export class RemoveBidFail {
    public static readonly type = CollectionActionList.REMOVE_BID_REQUEST_FAIL;
  }

  export class GetCollectionRequest {
    public static readonly type = CollectionActionList.GET_COLLECTION_REQUEST;
  }

  export class GetCollectionFail {
    public static readonly type = CollectionActionList.GET_COLLECTION_FAIL;
  }

  export class GetCollectionSuccess {
    public static readonly type = CollectionActionList.GET_COLLECTION_SUCCESS;

    constructor(public payload: IcollectionResponse){
    }
  }

  export class SetCollectionParams {
    public static readonly type = CollectionActionList.SET_COLLECTION_PARAMS;
    constructor(public payload: IProductListRequest){
    }
  }
  export class GetWishlistRequest {
    public static readonly type = CollectionActionList.GET_WISHLIST_REQUEST;
  }

  export class GetWishlistFail {
    public static readonly type = CollectionActionList.GET_WISHLIST_FAIL;
  }

  export class GetWishlistSuccess {
    public static readonly type = CollectionActionList.GET_WISHLIST_SUCCESS;

    constructor(public payload: IcollectionResponse){
    }
  }

  export class SetWishlistParams {
    public static readonly type = CollectionActionList.SET_WISHLIST_PARAMS;
    constructor(public payload: IProductListRequest){
    }
  }
  
}