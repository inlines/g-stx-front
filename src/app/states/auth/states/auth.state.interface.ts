import { RequestStatus } from "@app/constants/request-status.const";

export interface IAuthState {
  authRequestStatus: RequestStatus,
  login: string | null,
  token: string | null,
}