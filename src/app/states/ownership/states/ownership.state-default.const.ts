import { RequestStatus } from "@app/constants/request-status.const";
import { IownershipState } from "./ownership.state.interface";

export const OWNERSHIP_STATE_DEFAULTS: IownershipState = {
  loadOwnershipStatus: RequestStatus.NotInvoked,
  ownership: [],
}