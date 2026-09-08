import { Injectable } from '@angular/core';
import { RequestStatus } from '@app/constants/request-status.const';
import { ToastService } from '@app/services/toast.service';
import { unixMilliseconds } from '@app/shared/collection-filter';
import { normalizeListParams, sameListParams } from '@app/shared/list-params';
import { OwnershipActions } from '@app/states/ownership/states/ownership-actions';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Action, Selector, State, StateContext, getActionTypeFromInstance } from '@ngxs/store';
import { Observable, catchError, switchMap, tap } from 'rxjs';
import { ICollectionItem } from '../interfaces/collection-item.interface';
import { CollectionService } from '../services/collection.service';
import { CollectionActions } from './collection-actions';
import { COLLECTION_STATE_DEFAULTS } from './collection.state-default.const';
import { ICollectionState } from './collection.state.interface';

@State<ICollectionState>({
  name: 'Collection',
  defaults: COLLECTION_STATE_DEFAULTS,
})
@Injectable()
export class CollectionState {
  constructor(
    private service: CollectionService,
    private toastService: ToastService,
  ) {}

  private mutation(
    ctx: StateContext<ICollectionState>,
    request: Observable<void>,
    success: object,
    failure: object,
  ) {
    ctx.patchState({ changeCollectionRequestStatus: RequestStatus.Pending });
    return request.pipe(
      switchMap(() => ctx.dispatch(success)),
      catchError(() => ctx.dispatch(failure)),
    );
  }

  @Action(CollectionActions.AddToCollectionRequest)
  addToCollection(ctx: StateContext<ICollectionState>, action: CollectionActions.AddToCollectionRequest) {
    return this.mutation(
      ctx,
      this.service.addToCollection(action.payload),
      new CollectionActions.AddToCollectionSuccess(),
      new CollectionActions.AddToCollectionFail(),
    );
  }

  @Action(CollectionActions.SetPriceRequest)
  setReleasePrice(ctx: StateContext<ICollectionState>, action: CollectionActions.SetPriceRequest) {
    return this.mutation(
      ctx,
      this.service.setReleasePrice(action.payload),
      new CollectionActions.SetPriceSuccess(),
      new CollectionActions.SetPriceFail(),
    );
  }

  @Action(CollectionActions.AddWishRequest)
  addWish(ctx: StateContext<ICollectionState>, action: CollectionActions.AddWishRequest) {
    return this.mutation(
      ctx,
      this.service.addWish(action.payload),
      new CollectionActions.AddWishSuccess(),
      new CollectionActions.AddWishFail(),
    );
  }

  @Action(CollectionActions.AddWtsRequest)
  addWts(ctx: StateContext<ICollectionState>, action: CollectionActions.AddWtsRequest) {
    return this.mutation(
      ctx,
      this.service.addWts(action.payload),
      new CollectionActions.AddWtsSuccess(),
      new CollectionActions.AddWtsFail(),
    );
  }

  @Action(CollectionActions.AddBidRequest)
  addBid(ctx: StateContext<ICollectionState>, action: CollectionActions.AddBidRequest) {
    return this.mutation(
      ctx,
      this.service.addBid(action.payload),
      new CollectionActions.AddBidSuccess(),
      new CollectionActions.AddBidFail(),
    );
  }

  @Action(CollectionActions.RemoveFromCollectionRequest)
  removeFromCollection(
    ctx: StateContext<ICollectionState>,
    action: CollectionActions.RemoveFromCollectionRequest,
  ) {
    return this.mutation(
      ctx,
      this.service.removeFromCollection(action.payload),
      new CollectionActions.RemoveFromCollectionSuccess(),
      new CollectionActions.RemoveFromCollectionFail(),
    );
  }

  @Action(CollectionActions.RemoveWishRequest)
  removeWish(ctx: StateContext<ICollectionState>, action: CollectionActions.RemoveWishRequest) {
    return this.mutation(
      ctx,
      this.service.removeWish(action.payload),
      new CollectionActions.RemoveWishSuccess(),
      new CollectionActions.RemoveWishFail(),
    );
  }

  @Action(CollectionActions.RemoveWtsRequest)
  removeWts(ctx: StateContext<ICollectionState>, action: CollectionActions.RemoveWtsRequest) {
    return this.mutation(
      ctx,
      this.service.removeWts(action.payload),
      new CollectionActions.RemoveWtsSuccess(),
      new CollectionActions.RemoveWtsFail(),
    );
  }

  @Action(CollectionActions.RemoveBidRequest)
  removeBid(ctx: StateContext<ICollectionState>, action: CollectionActions.RemoveBidRequest) {
    return this.mutation(
      ctx,
      this.service.removeBid(action.payload),
      new CollectionActions.RemoveBidSuccess(),
      new CollectionActions.RemoveBidFail(),
    );
  }

  @Action([
    CollectionActions.AddToCollectionSuccess,
    CollectionActions.SetPriceSuccess,
    CollectionActions.AddWishSuccess,
    CollectionActions.AddWtsSuccess,
    CollectionActions.AddBidSuccess,
    CollectionActions.RemoveFromCollectionSuccess,
    CollectionActions.RemoveWishSuccess,
    CollectionActions.RemoveWtsSuccess,
    CollectionActions.RemoveBidSuccess,
  ])
  mutationSuccess(ctx: StateContext<ICollectionState>, action: object) {
    ctx.patchState({ changeCollectionRequestStatus: RequestStatus.Load });
    const messages: Record<string, string> = {
      [CollectionActions.AddToCollectionSuccess.type]: 'Успешное добавление в коллекцию',
      [CollectionActions.SetPriceSuccess.type]: 'Цена сохранена',
      [CollectionActions.AddWishSuccess.type]: 'Успешное добавление в вишлист',
      [CollectionActions.AddWtsSuccess.type]: 'Успешное добавление в лист продаж',
      [CollectionActions.AddBidSuccess.type]: 'Успешное добавление бида',
      [CollectionActions.RemoveFromCollectionSuccess.type]: 'Успешное удаление из коллекции',
      [CollectionActions.RemoveWishSuccess.type]: 'Успешное удаление из вишлиста',
      [CollectionActions.RemoveWtsSuccess.type]: 'Успешное удаление из листа продаж',
      [CollectionActions.RemoveBidSuccess.type]: 'Успешное удаление бида',
    };
    this.toastService.clear();
    this.toastService.show({
      body: messages[getActionTypeFromInstance(action) ?? ''] ?? 'Операция завершена',
      classname: 'bg-success text-light',
      delay: 1500,
    });
    return ctx.dispatch(new OwnershipActions.RequestOwnership());
  }

  @Action([
    CollectionActions.AddToCollectionFail,
    CollectionActions.SetPriceFail,
    CollectionActions.AddWishFail,
    CollectionActions.AddWtsFail,
    CollectionActions.AddBidFail,
    CollectionActions.RemoveFromCollectionFail,
    CollectionActions.RemoveWishFail,
    CollectionActions.RemoveWtsFail,
    CollectionActions.RemoveBidFail,
  ])
  mutationFail(ctx: StateContext<ICollectionState>, action: object) {
    ctx.patchState({ changeCollectionRequestStatus: RequestStatus.Error });
    const messages: Record<string, string> = {
      [CollectionActions.AddToCollectionFail.type]: 'Ошибка при добавлении в коллекцию',
      [CollectionActions.SetPriceFail.type]: 'Ошибка при сохранении цены',
      [CollectionActions.AddWishFail.type]: 'Ошибка при добавлении в вишлист',
      [CollectionActions.AddWtsFail.type]: 'Ошибка при добавлении в лист продаж',
      [CollectionActions.AddBidFail.type]: 'Ошибка при добавлении бида',
      [CollectionActions.RemoveFromCollectionFail.type]: 'Ошибка при удалении из коллекции',
      [CollectionActions.RemoveWishFail.type]: 'Ошибка при удалении из вишлиста',
      [CollectionActions.RemoveWtsFail.type]: 'Ошибка при удалении из листа продаж',
      [CollectionActions.RemoveBidFail.type]: 'Ошибка при удалении бида',
    };
    this.toastService.clear();
    this.toastService.show({
      body: messages[getActionTypeFromInstance(action) ?? ''] ?? 'Операция завершена',
      classname: 'bg-danger text-light',
      delay: 1500,
    });
  }

  @Action(CollectionActions.GetCollectionRequest, { cancelUncompleted: true })
  public getCollectionRequest(
    ctx: StateContext<ICollectionState>,
    action: CollectionActions.GetCollectionRequest,
  ) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Pending,
    });

    return this.service.getCollection(ctx.getState().collectionParams).pipe(
      tap((payload) => {
        ctx.dispatch(new CollectionActions.GetCollectionSuccess(payload));
      }),
      catchError(() => ctx.dispatch(new CollectionActions.GetCollectionFail())),
    );
  }

  @Action(CollectionActions.GetCollectionSuccess)
  public getCollectionSuccess(
    ctx: StateContext<ICollectionState>,
    action: CollectionActions.GetCollectionSuccess,
  ) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Load,
      loadedCollection: action.payload.items.map((item) => ({
        ...item,
        release_date: unixMilliseconds(item.release_date),
      })),
      collectionTotalCount: action.payload.total_count,
    });
  }

  @Action(CollectionActions.GetCollectionFail)
  public getCollectionFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Error,
    });
  }

  @Action(CollectionActions.SetCollectionParams)
  public setCollectionParams(
    ctx: StateContext<ICollectionState>,
    action: CollectionActions.SetCollectionParams,
  ) {
    const currentParams = ctx.getState().collectionParams;
    const newParams = normalizeListParams({ ...currentParams, ...action.payload });
    if (sameListParams(currentParams, newParams)) return;
    ctx.patchState({
      collectionParams: newParams,
    });
  }

  @Action(CollectionActions.GetWishlistRequest, { cancelUncompleted: true })
  public getWishlistRequest(
    ctx: StateContext<ICollectionState>,
    action: CollectionActions.GetWishlistRequest,
  ) {
    ctx.patchState({
      loadWishlistStatus: RequestStatus.Pending,
    });

    return this.service.getWishlist(ctx.getState().wishlistParams).pipe(
      tap((payload) => {
        ctx.dispatch(new CollectionActions.GetWishlistSuccess(payload));
      }),
      catchError(() => ctx.dispatch(new CollectionActions.GetWishlistFail())),
    );
  }

  @Action(CollectionActions.GetWishlistSuccess)
  public getWishlistSuccess(
    ctx: StateContext<ICollectionState>,
    action: CollectionActions.GetWishlistSuccess,
  ) {
    ctx.patchState({
      loadWishlistStatus: RequestStatus.Load,
      loadedWishlist: action.payload.items.map((item) => ({
        ...item,
        release_date: unixMilliseconds(item.release_date),
      })),
      wishlistTotalCount: action.payload.total_count,
    });
  }

  @Action(CollectionActions.GetWishlistFail)
  public getWishlistFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      loadWishlistStatus: RequestStatus.Error,
    });
  }

  @Action(CollectionActions.GetWtsRequest, { cancelUncompleted: true })
  public getWtsRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.GetWtsRequest) {
    ctx.patchState({
      loadWtsStatus: RequestStatus.Pending,
    });

    return this.service.getWts(ctx.getState().wtsParams).pipe(
      tap((payload) => {
        ctx.dispatch(new CollectionActions.GetWtsSuccess(payload));
      }),
      catchError(() => ctx.dispatch(new CollectionActions.GetWtsFail())),
    );
  }

  @Action(CollectionActions.GetWtsSuccess)
  public getWtsSuccess(ctx: StateContext<ICollectionState>, action: CollectionActions.GetWtsSuccess) {
    ctx.patchState({
      loadWtsStatus: RequestStatus.Load,
      loadedWtslist: action.payload.items.map((item) => ({
        ...item,
        release_date: unixMilliseconds(item.release_date),
      })),
      wtsTotalCount: action.payload.total_count,
    });
  }

  @Action(CollectionActions.GetWtsFail)
  public getWtsFail(ctx: StateContext<ICollectionState>) {
    ctx.patchState({
      loadWtsStatus: RequestStatus.Error,
    });
  }

  @Action(CollectionActions.Reset)
  public reset(ctx: StateContext<ICollectionState>) {
    ctx.setState(COLLECTION_STATE_DEFAULTS);
  }

  @Action(CollectionActions.SetWishlistParams)
  public setWishlistParams(ctx: StateContext<ICollectionState>, action: CollectionActions.SetWishlistParams) {
    const currentParams = ctx.getState().wishlistParams;
    const newParams = normalizeListParams({ ...currentParams, ...action.payload });
    if (sameListParams(currentParams, newParams)) return;
    ctx.patchState({
      wishlistParams: newParams,
    });
  }

  @Action(CollectionActions.SetWtstParams)
  public setWtsParams(ctx: StateContext<ICollectionState>, action: CollectionActions.SetWtstParams) {
    const currentParams = ctx.getState().wtsParams;
    const newParams = normalizeListParams({ ...currentParams, ...action.payload });
    if (sameListParams(currentParams, newParams)) return;
    ctx.patchState({
      wtsParams: newParams,
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
  public static totalCountWts(state: ICollectionState): number {
    return state.wtsTotalCount;
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
  public static loadedWts(state: ICollectionState): ICollectionItem[] {
    return state.loadedWtslist;
  }

  @Selector()
  public static wishlistParams(state: ICollectionState): IProductListRequest {
    return state.wishlistParams;
  }

  @Selector()
  public static wtsParams(state: ICollectionState): IProductListRequest {
    return state.wtsParams;
  }

  @Selector()
  static changeStatus(state: ICollectionState): RequestStatus {
    return state.changeCollectionRequestStatus;
  }

  @Selector()
  public static collectionChanging(state: ICollectionState): boolean {
    return state.changeCollectionRequestStatus === RequestStatus.Pending;
  }
}
