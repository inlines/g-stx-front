import { RequestStatus } from "@app/constants/request-status.const";
import { IRegistrationState } from "./registration.state.interface";

export const REGISTARATION_STATE_DEFAULTS: IRegistrationState = {
  registrationRequestStatus: RequestStatus.NotInvoked
}