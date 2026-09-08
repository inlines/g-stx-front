import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RequestStatus } from '@app/constants/request-status.const';
import { ToastService } from '@app/services/toast.service';
import { Action, State, StateContext } from '@ngxs/store';
import { catchError, tap } from 'rxjs';
import { RegistrationService } from '../services/registration.service';
import { RegistrationActions } from './registration-actions';
import { REGISTARATION_STATE_DEFAULTS } from './registration.state-default.const';
import { IRegistrationState } from './registration.state.interface';

@State<IRegistrationState>({
  name: 'Registration',
  defaults: REGISTARATION_STATE_DEFAULTS,
})
@Injectable()
export class RegistrationState {
  constructor(
    private service: RegistrationService,
    private toastService: ToastService,
    private router: Router,
  ) {}

  @Action(RegistrationActions.RegisterRequest)
  public registerRequest(ctx: StateContext<IRegistrationState>, action: RegistrationActions.RegisterRequest) {
    ctx.patchState({
      registrationRequestStatus: RequestStatus.Pending,
    });

    return this.service.registerRequest(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new RegistrationActions.RegisterRequestSuccess());
      }),
      catchError(() => ctx.dispatch(new RegistrationActions.RegisterRequestFail())),
    );
  }

  @Action(RegistrationActions.RegisterRequestSuccess)
  public registerRequestSuccess(
    ctx: StateContext<IRegistrationState>,
    action: RegistrationActions.RegisterRequestSuccess,
  ) {
    ctx.patchState({
      registrationRequestStatus: RequestStatus.Load,
    });
    this.toastService.show({
      body: 'Регистрация прошла успешно, переход на форму логина',
      classname: 'bg-success text-light w-100',
      delay: 5000,
    });
    this.router.navigate(['/login']);
  }

  @Action(RegistrationActions.RegisterRequestFail)
  public registerRequestFail(
    ctx: StateContext<IRegistrationState>,
    action: RegistrationActions.RegisterRequestFail,
  ) {
    ctx.patchState({
      registrationRequestStatus: RequestStatus.Error,
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при регистрации, возможно такой логин уже есть',
      classname: 'bg-danger text-light w-100',
      delay: 5000,
    });
  }
}
