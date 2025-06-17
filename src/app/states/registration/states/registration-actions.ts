import { IRegistrationPayload } from "../interfaces/registration-payload.interface";
import { RegistrationActionList } from "./registration-action-list.const";

export namespace RegistrationActions {
  export class RegisterRequest {
    public static readonly type = RegistrationActionList.REGISTER_REQUEST

    constructor(public payload: IRegistrationPayload) {
    }
  }

  export class RegisterRequestSuccess {
    public static readonly type = RegistrationActionList.REGISTER_REQUEST_SUCCESS
  }

  export class RegisterRequestFail {
    public static readonly type = RegistrationActionList.REGISTER_REQUEST_FAIL
  }
}