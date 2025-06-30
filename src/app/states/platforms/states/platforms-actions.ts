import { IPlatformItem } from "../interfaces/platform-item.interface";
import { PlatformsActionList } from "./platforms-action-list.const";

export namespace PlatformsActions {
  export class LoadPlaformsRequest {
    public static readonly type = PlatformsActionList.LOAD_PLATFORMS;
  }

  export class LoadPlaformsRequestFail {
    public static readonly type = PlatformsActionList.LOAD_PLATFORMS_FAIL;
  }

  export class LoadPlaformsRequestSuccess {
    public static readonly type = PlatformsActionList.LOAD_PLATFORMS_SUCCESS;

    constructor(
      public payload: IPlatformItem[]
    ){}
  }
}