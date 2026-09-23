import { IcollectionResponse } from '@app/states/collection/interfaces/collection-response.interface';
import { ICollectorItem } from '../interfaces/collector-item.interface';
import { CollectorsActionList } from './collectors-action-list.const';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';

export namespace CollectorsActions {
  export class SelectCollector { static readonly type='[Collectors] Select paged library'; constructor(public payload:string){} }

  export class GetCollectorsRequest {
    public static readonly type = CollectorsActionList.GET_COLLECTORS;
  }

  export class GetCollectorsSuccess {
    public static readonly type = CollectorsActionList.GET_COLLECTORS_SUCCESS;

    constructor(public payload: ICollectorItem[]) {}
  }

  export class GetCollectorsFail {
    public static readonly type = CollectorsActionList.GET_COLLECTORS_FAIL;
  }

  export class GetCollectorsPropertiesRequest {
    public static readonly type = CollectorsActionList.GET_COLLECTORS_PROPERTIES;
    constructor(public payload: string) {}
  }

  export class GetCollectorsPropertiesSuccess {
    public static readonly type = CollectorsActionList.GET_COLLECTORS_PROPERTIES_SUCCESS;

    constructor(public payload: ICollectionItem[]) {}
  }

  export class GetCollectorsPropertiesFail {
    public static readonly type = CollectorsActionList.GET_COLLECTORS_PROPERTIES_FAIL;
  }
}
