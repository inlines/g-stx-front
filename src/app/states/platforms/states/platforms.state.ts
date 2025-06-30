import { Action, Selector, State, StateContext } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { IplatformState } from "./platforms.state.interface";
import { PLATFORM_STATE_DEFAULTS } from "./platforms.state-default.const";
import { PlatformService } from "../services/platform.service";
import { PlatformsActions } from "./platforms-actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, tap } from "rxjs";
import { ToastService } from "@app/services/toast.service";
import { IPlatformItem } from "../interfaces/platform-item.interface";

@State<IplatformState>({
  name: 'Platforms',
  defaults: PLATFORM_STATE_DEFAULTS,
})
@Injectable()
export class PlatformState {
  constructor(
    private service: PlatformService,
    private toastService: ToastService,
  ){}

  @Action(PlatformsActions.LoadPlaformsRequest)
  public loadPlatforms(ctx: StateContext<IplatformState>) {
    ctx.patchState({
      loadPlatformsStatus: RequestStatus.Pending
    });

    return this.service.getPlatforms().pipe(
      tap((response) => {
        ctx.dispatch(new PlatformsActions.LoadPlaformsRequestSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new PlatformsActions.LoadPlaformsRequestFail()))
    )
  }

  @Action(PlatformsActions.LoadPlaformsRequestSuccess)
  public loadListSuccess(ctx: StateContext<IplatformState>, action: PlatformsActions.LoadPlaformsRequestSuccess) {
    ctx.patchState({
      loadPlatformsStatus: RequestStatus.Load,
      platforms: action.payload
    });
  }

  @Action(PlatformsActions.LoadPlaformsRequestFail)
  public loadListFail(ctx: StateContext<IplatformState>) {
    ctx.patchState({
      loadPlatformsStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при загрузке платформ',
      classname: 'bg-danger text-light w-100',
      delay: 5000,
    });
  }

  @Selector()
  public static loadedPlatforms(state: IplatformState): IPlatformItem[] {
    return state.platforms;
  }
}
