import { RequestStatus } from "@app/constants/request-status.const";
import { IAuthState } from "./auth.state.interface";

export const AUTH_STATE_DEFAULTS: IAuthState = {
  authRequestStatus: RequestStatus.NotInvoked,
  login: null,
  token: null,
}