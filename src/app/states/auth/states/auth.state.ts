import { Injectable } from "@angular/core";
import { AUTH_STATE_DEFAULTS } from "./auth.state-default.const";
import { IAuthState } from "./auth.state.interface";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { AuthService } from "../services/auth.service";
import { AuthActions } from "./auth-actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, tap } from "rxjs";


@State<IAuthState>({
  name: 'Auth',
  defaults: AUTH_STATE_DEFAULTS,
})
@Injectable()
export class AuthState {
  constructor(
      private service: AuthService
  ){}

  @Action(AuthActions.LoginRequest)
  public loginRequest(ctx: StateContext<IAuthState>, action: AuthActions.LoginRequest) {
    ctx.patchState({
      authRequestStatus: RequestStatus.Pending,
      login: action.payload.user_login
    });

    return this.service.authRequest(action.payload).pipe(
      tap((response) => {
        ctx.dispatch(new AuthActions.LoginRequestSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new AuthActions.LoginRequestFail()))
    );
  }

  @Action(AuthActions.LoginRequestSuccess)
  public loginRequestSuccess(ctx: StateContext<IAuthState>, action: AuthActions.LoginRequestSuccess) {
    ctx.patchState({
      authRequestStatus: RequestStatus.Load,
      token: action.payload.token,
    });
  }

  @Action(AuthActions.LoginRequestFail)
  public loginRequestFail(ctx: StateContext<IAuthState>, action: AuthActions.LoginRequestFail) {
    ctx.patchState({
      authRequestStatus: RequestStatus.Error,
      login: null
    });

    console.warn('AUTH FAIL');
  }

  @Selector()
  public static token(state: IAuthState): string | null {
    return state.token;
  }

  @Selector()
  public static login(state: IAuthState): string | null {
    return state.login;
  }
}