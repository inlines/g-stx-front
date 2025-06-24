import { OwnershipActionList } from "./ownership-action-list.const";

export namespace OwnershipActions {
  export class RequestOwnership {
    public static readonly type = OwnershipActionList.LOAD_OWNERSHIP;
  }

  export class RequestOwnershipSuccess {
    public static readonly type = OwnershipActionList.LOAD_OWNERSHIP_SUCCESS;
    constructor(public payload: any) {
    }
  }

  export class RequestOwnershipFail {
    public static readonly type = OwnershipActionList.LOAD_OWNERSHIP_FAIL;
  }

  export class ResetOwnership {
    public static readonly type = OwnershipActionList.RESET_OWNERSHIP;
  }
}