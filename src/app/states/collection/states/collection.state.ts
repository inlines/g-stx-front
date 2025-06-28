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
      classname: 'bg-danger text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.AddWishRequest)
  public addWishRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.AddWishRequest) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Pending
    });

    return this.service.addWish(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new CollectionActions.AddWishSuccess())
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.AddWishFail()))
    )
  }

  @Action(CollectionActions.AddWishSuccess)
  public addWishSuccess(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Load
    });

    ctx.dispatch(new OwnershipActions.RequestOwnership());
    this.toastService.clear();
    this.toastService.show({
      body: 'Успешное добавление в вишлист',
      classname: 'bg-success text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.AddWishFail)
  public addWishFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при добавлении в вишлист',
      classname: 'bg-danger text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.AddBidRequest)
  public addBidRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.AddBidRequest) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Pending
    });

    return this.service.addBid(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new CollectionActions.AddBidSuccess())
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.AddBidFail()))
    )
  }

  @Action(CollectionActions.AddBidSuccess)
  public addBidSuccess(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Load
    });

    ctx.dispatch(new OwnershipActions.RequestOwnership());
    this.toastService.clear();
    this.toastService.show({
      body: 'Успешное добавление бида',
      classname: 'bg-success text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.AddBidFail)
  public addBidFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при добавлении бида',
      classname: 'bg-danger text-light',
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
      classname: 'bg-danger text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.RemoveWishRequest)
  public removeWishRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.RemoveWishRequest) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Pending
    });

    return this.service.removeWish(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new CollectionActions.RemoveWishSuccess())
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.RemoveWishFail()))
    )
  }

  @Action(CollectionActions.RemoveWishSuccess)
  public removeWishSuccess(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Load
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Успешное удаление из вишлиста',
      classname: 'bg-success text-light',
      delay: 500,
    });
    ctx.dispatch(new OwnershipActions.RequestOwnership());
    ctx.dispatch(new CollectionActions.GetWishlistRequest());
  }

  @Action(CollectionActions.RemoveWishFail)
  public removeWishFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при удалении из вишлиста',
      classname: 'bg-danger text-light',
      delay: 500,
    });
  }

  @Action(CollectionActions.RemoveBidRequest)
  public removeBidRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.RemoveBidRequest) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Pending
    });

    return this.service.removeBid(action.payload).pipe(
      tap(() => {
        ctx.dispatch(new CollectionActions.RemoveBidSuccess())
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.RemoveBidFail()))
    )
  }

  @Action(CollectionActions.RemoveBidSuccess)
  public removeBidSuccess(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Load
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Успешное удаление бида',
      classname: 'bg-success text-light',
      delay: 500,
    });
    ctx.dispatch(new OwnershipActions.RequestOwnership());
  }

  @Action(CollectionActions.RemoveBidFail)
  public removeBidFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      changeCollectionRequestStatus: RequestStatus.Error
    });
    this.toastService.clear();
    this.toastService.show({
      body: 'Ошибка при удалении бида',
      classname: 'bg-danger text-light',
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
      loadedCollection: action.payload.items,
      collectionTotalCount: action.payload.total_count
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

  @Action(CollectionActions.GetWishlistRequest)
  public getWishlistRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.GetWishlistRequest) {
    ctx.patchState({
      loadWishlistStatus: RequestStatus.Pending
    });

    return this.service.getWishlist(ctx.getState().wishlistParams).pipe(
      tap((payload) => {
        ctx.dispatch(new CollectionActions.GetWishlistSuccess(payload))
      }),
      catchError((err, caught) => ctx.dispatch(new CollectionActions.GetWishlistFail()))
    )
  }

  @Action(CollectionActions.GetWishlistSuccess)
  public getWishlistSuccess(ctx: StateContext<ICollectionState>, action: CollectionActions.GetWishlistSuccess) {
    ctx.patchState({
      loadWishlistStatus: RequestStatus.Load,
      loadedWishlist: action.payload.items,
      wishlistTotalCount: action.payload.total_count
    })
  }

  @Action(CollectionActions.GetWishlistFail)
  public getWishlistFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      loadWishlistStatus: RequestStatus.Error
    });
  }

  @Action(CollectionActions.SetWishlistParams)
  public setWishlistParams(ctx: StateContext<ICollectionState>, action: CollectionActions.SetWishlistParams) {
    const currentParams = ctx.getState().wishlistParams;
    const newParams = {...currentParams, ...action.payload};
    if (!newParams.query) {
      delete newParams.query;
    }
    ctx.patchState({
      wishlistParams: newParams
    });
  }

  @Selector()
  public static loadedCollection(state: ICollectionState): ICollectionItem[] {
    return state.loadedCollection;
  }

  @Selector()
  public static totalCountCollection(state: ICollectionState): number {
    return state.collectionTotalCount;
  }

  @Selector()
  public static totalCountWishlist(state: ICollectionState): number {
    return state.wishlistTotalCount;
  }

  @Selector()
  public static collectionParams(state: ICollectionState): IProductListRequest {
    return state.collectionParams;
  }

  @Selector()
  public static loadedWishlist(state: ICollectionState): ICollectionItem[] {
    return state.loadedWishlist;
  }

  @Selector()
  public static wishlistParams(state: ICollectionState): IProductListRequest {
    return state.wishlistParams;
  }

  @Selector()
  public static collectionChanging(state: ICollectionState): boolean {
    return state.changeCollectionRequestStatus === RequestStatus.Pending;
  }
}