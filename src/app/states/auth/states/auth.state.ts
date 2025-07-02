import { Injectable } from "@angular/core";
import { AUTH_STATE_DEFAULTS } from "./auth.state-default.const";
import { IAuthState } from "./auth.state.interface";
import { Action, Selector, State, StateContext } from "@ngxs/store";
import { AuthService } from "../services/auth.service";
import { AuthActions } from "./auth-actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, tap } from "rxjs";
import { Router } from "@angular/router";
import { OwnershipActions } from "@app/states/ownership/states/ownership-actions";
import { ProductsActions } from "@app/states/products/states/products.actions";
import { ToastService } from "@app/services/toast.service";
import { ChatActions } from "@app/states/chat/states/chat-actions";


@State<IAuthState>({
  name: 'Auth',
  defaults: AUTH_STATE_DEFAULTS,
})
@Injectable()
export class AuthState {
  constructor(
      private service: AuthService,
      private toastService: ToastService,
      private router: Router
  ){}

  @Action(AuthActions.LoginRequest)
  public loginRequest(ctx: StateContext<IAuthState>, action: AuthActions.LoginRequest) {
    ctx.patchState({
      authRequestStatus: RequestStatus.Pending,
      login: action.payload.user_login,
      token: null
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

    ctx.dispatch(new OwnershipActions.RequestOwnership());

    // const state = ctx.getState();
    // if(state.login) {
    //   ctx.dispatch(new ChatActions.Connect(state.login));
    // }

    this.router.navigate(['/collection']);
  }

  @Action(AuthActions.LoginRequestFail)
  public loginRequestFail(ctx: StateContext<IAuthState>, action: AuthActions.LoginRequestFail) {
    ctx.patchState({
      authRequestStatus: RequestStatus.Error,
      login: null,
      token: null
    });

    this.toastService.show({
      body: 'Ошибка при авторизации, проверьте логин/пароль',
      classname: 'bg-danger text-light w-100',
      delay: 5000,
    });
  }

  @Action(AuthActions.Logout)
  public logout(ctx: StateContext<IAuthState>) {
    ctx.patchState({
      authRequestStatus: RequestStatus.NotInvoked,
      login: null,
      token: null
    });

    ctx.dispatch(new OwnershipActions.ResetOwnership());
    ctx.dispatch(new ProductsActions.ProductsReset());
    ctx.dispatch(new ChatActions.Reset());

    this.router.navigate(['/login']);
  }

  @Selector()
  public static token(state: IAuthState): string | null {
    return state.token;
  }

  @Selector()
  public static login(state: IAuthState): string | null {
    return state.login;
  }

  @Selector()
  public static isAuthorised(state: IAuthState): boolean {
    return !!state.login && !!state.token;
  }
}