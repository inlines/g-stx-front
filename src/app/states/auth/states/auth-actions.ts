import { ILoginPayload } from "../interfaces/login-payload.interface";
import { ILoginResponse } from "../interfaces/login-response.interface";
import { AuthActionList } from "./auth-action-list.const";

export namespace AuthActions {
  export class LoginRequest {
    public static readonly type = AuthActionList.LOGIN_REQUEST;

    constructor(public payload: ILoginPayload) {
    }
  }

  export class LoginRequestSuccess {
    public static readonly type = AuthActionList.LOGIN_REQUEST_SUCCESS;

    constructor(public payload: ILoginResponse) {
    }
  }

  export class LoginRequestFail {
    public static readonly type = AuthActionList.LOGIN_REQUEST_FAIL;
  }

  export class Logout {
    public static readonly type = AuthActionList.LOGOUT;
  }
}