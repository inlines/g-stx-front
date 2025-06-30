import { RequestStatus } from "@app/constants/request-status.const";
import { IplatformState } from "./platforms.state.interface";


export const PLATFORM_STATE_DEFAULTS: IplatformState = {
  loadPlatformsStatus: RequestStatus.NotInvoked,
  platforms: [],
}