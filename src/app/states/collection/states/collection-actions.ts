import { ICollectionItem } from "../interfaces/collection-item.interface";
import { IEditCollectionPayload } from "../interfaces/edit-collection-payload.interface";
import { CollectionActionList } from "./collection-action-list.const";

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

  export class GetCollectionRequest {
    public static readonly type = CollectionActionList.GET_COLLECTION_REQUEST;
  }

  export class GetCollectionFail {
    public static readonly type = CollectionActionList.GET_COLLECTION_FAIL;
  }

  export class GetCollectionSuccess {
    public static readonly type = CollectionActionList.GET_COLLECTION_SUCCESS;

    constructor(public payload: ICollectionItem[]){
    }
  }
}