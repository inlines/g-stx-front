import { unixMilliseconds } from '@app/shared/collection-filter';
import { Injectable } from '@angular/core';
import { RequestStatus } from '@app/constants/request-status.const';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { catchError, tap } from 'rxjs';
import { ICollectorItem } from '../interfaces/collector-item.interface';
import { CollectorsService } from '../services/collectors.service';
import { CollectorsActions } from './collectors-actions';
import { COLLECTORS_STATE_DEFAULTS } from './collectors.state-default.const';
import { IcollectorsState } from './collectors.state.interface';

@State<IcollectorsState>({
  name: 'Collectors',
  defaults: COLLECTORS_STATE_DEFAULTS,
})
@Injectable()
export class CollectorsState {
  constructor(private service: CollectorsService) {}

  @Action(CollectorsActions.GetCollectorsRequest)
  public getCollectors(ctx: StateContext<IcollectorsState>) {
    ctx.patchState({
      collectorsListRequestStatus: RequestStatus.Pending,
    });

    return this.service.getCollectors().pipe(
      tap((response) => {
        ctx.dispatch(new CollectorsActions.GetCollectorsSuccess(response));
      }),
      catchError(() => ctx.dispatch(new CollectorsActions.GetCollectorsFail())),
    );
  }

  @Action(CollectorsActions.GetCollectorsSuccess)
  public getCollectorsSuccess(
    ctx: StateContext<IcollectorsState>,
    action: CollectorsActions.GetCollectorsSuccess,
  ) {
    ctx.patchState({
      collectorsListRequestStatus: RequestStatus.Load,
      collectorsList: action.payload,
    });
  }

  @Action(CollectorsActions.GetCollectorsPropertiesRequest, { cancelUncompleted: true })
  public loadProperties(
    ctx: StateContext<IcollectorsState>,
    action: CollectorsActions.GetCollectorsPropertiesRequest,
  ) {
    ctx.patchState({
      collectorPropertiesRequestStatus: RequestStatus.Pending,
      loadedCollection: [],
      collectionPropertiesLogin: action.payload,
      collectionTotalCount: 0,
    });
    return this.service.getCollectorProperties(action.payload).pipe(
      tap((response) => {
        ctx.dispatch(new CollectorsActions.GetCollectorsPropertiesSuccess(response));
      }),
      catchError(() => ctx.dispatch(new CollectorsActions.GetCollectorsPropertiesFail())),
    );
  }

  @Action(CollectorsActions.GetCollectorsPropertiesSuccess)
  public loadPropertiesSuccess(
    ctx: StateContext<IcollectorsState>,
    action: CollectorsActions.GetCollectorsPropertiesSuccess,
  ) {
    ctx.patchState({
      collectorPropertiesRequestStatus: RequestStatus.Load,
      collectionTotalCount: action.payload.length,
      loadedCollection: action.payload.map((item) => ({
        ...item,
        release_date: unixMilliseconds(item.release_date),
      })),
    });
  }

  @Action(CollectorsActions.GetCollectorsPropertiesFail)
  propertiesFail(ctx: StateContext<IcollectorsState>) {
    ctx.patchState({ collectorPropertiesRequestStatus: RequestStatus.Error });
  }

  @Action(CollectorsActions.GetCollectorsFail)
  public getCollectorsFail(ctx: StateContext<IcollectorsState>) {
    ctx.patchState({
      collectionPropertiesLogin: null,
      collectorsListRequestStatus: RequestStatus.Error,
    });
  }

  @Selector()
  static propertiesStatus(state: IcollectorsState): RequestStatus {
    return state.collectorPropertiesRequestStatus;
  }

  @Selector()
  public static collectors(state: IcollectorsState): ICollectorItem[] {
    return state.collectorsList;
  }

  @Selector()
  public static loadedCollection(state: IcollectorsState): ICollectionItem[] {
    return state.loadedCollection;
  }

  @Selector()
  public static collectorsLoading(state: IcollectorsState): boolean {
    return state.collectorsListRequestStatus === RequestStatus.Pending;
  }

  @Selector()
  public static collectorPropertiesLoaded(state: IcollectorsState): boolean {
    return state.collectorPropertiesRequestStatus === RequestStatus.Load;
  }

  @Selector()
  public static collectionPropertiesLogin(state: IcollectorsState): string {
    return state.collectionPropertiesLogin || '';
  }
}
