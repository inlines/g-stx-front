import { Action, Selector, State, StateContext } from "@ngxs/store";
import { ICollectionState } from "./collection.state.interface";
import { COLLECTION_STATE_DEFAULTS } from "./collection.state-default.const";
import { Injectable } from "@angular/core";
import { CollectionService } from "../services/collection.service";
import { CollectionActions } from "./collection-actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, Observable, tap } from "rxjs";
import { ICollectionItem } from "../interfaces/collection-item.interface";
import { ToastService } from "@app/services/toast.service";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";
import { OwnershipActions } from "@app/states/ownership/states/ownership-actions";

@State<ICollectionState>({
  name: 'Collection',
  defaults: COLLECTION_STATE_DEFAULTS
})
@Injectable()
export class CollectionState {
  constructor(
    private service: CollectionService,
    private toastService: ToastService
  ){}

  @Action(CollectionActions.AddToCollectionRequest)
  public addToCollectionRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.AddToCollectionRequest) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Pending
    });

    return this.service.addToCollection(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new CollectionActions.AddToCollectionSuccess())
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.AddToCollectionFail()))
    )
  }

  @Action(CollectionActions.AddToCollectionSuccess)
  public addToCollectionSuccess(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Load
    });

    ctx.dispatch(new OwnershipActions.RequestOwnership());
    this.toastService.clear();
    this.toastService.show({
      body: 'Успешное добавление в коллекцию',
      classname: 'bg-success text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.AddToCollectionFail)
  public addToCollectionFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при добавлении в коллекцию',
      classname: 'bg-danger-subtle text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.RemoveFromCollectionRequest)
  public removeFromCollectionRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.RemoveFromCollectionRequest) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Pending
    });

    return this.service.removeFromCollection(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new CollectionActions.RemoveFromCollectionSuccess())
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.RemoveFromCollectionFail()))
    )
  }

  @Action(CollectionActions.RemoveFromCollectionSuccess)
  public removeFromCollectionSuccess(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Load
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Успешное удаление из коллекции',
      classname: 'bg-success text-light',
      delay: 500,
    });
    ctx.dispatch(new OwnershipActions.RequestOwnership());
    ctx.dispatch(new CollectionActions.GetCollectionRequest());
  }

  @Action(CollectionActions.RemoveFromCollectionFail)
  public removeFromCollectionFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при удалении из колеекции',
      classname: 'bg-danger-subtle text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.GetCollectionRequest)
  public getCollectionRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.GetCollectionRequest) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Pending
    });

    return this.service.getCollection(ctx.getState().collectionParams).pipe(
      tap((payload) => {
        ctx.dispatch(new CollectionActions.GetCollectionSuccess(payload))
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.GetCollectionFail()))
    )
  }

  @Action(CollectionActions.GetCollectionSuccess)
  public getCollectionSuccess(ctx: StateContext<ICollectionState>, action: CollectionActions.GetCollectionSuccess) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Load,
      loadedCollection: action.payload
    })
  }

  @Action(CollectionActions.GetCollectionFail)
  public getCollectionFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Error
    });
  }

  @Action(CollectionActions.SetCollectionParams)
  public setCollectionParams(ctx: StateContext<ICollectionState>, action: CollectionActions.SetCollectionParams) {
    const currentParams = ctx.getState().collectionParams;
    const newParams = {...currentParams, ...action.payload};
    if (!newParams.query) {
      delete newParams.query;
    }
    ctx.patchState({
      collectionParams: newParams
    });
  }

  @Selector()
  public static loadedCollection(state: ICollectionState): ICollectionItem[] {
    return state.loadedCollection;
  }

  @Selector()
  public static collectionParams(state: ICollectionState): IProductListRequest {
    return state.collectionParams;
  }
}