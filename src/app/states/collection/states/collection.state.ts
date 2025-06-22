import { Action, Selector, State, StateContext } from "@ngxs/store";
import { ICollectionState } from "./collection.state.interface";
import { COLLECTION_STATE_DEFAULTS } from "./collection.state-default.const";
import { Injectable } from "@angular/core";
import { CollectionService } from "../services/collection.service";
import { CollectionActions } from "./collection-actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, Observable, tap } from "rxjs";
import { ICollectionItem } from "../interfaces/collection-item.interface";

@State<ICollectionState>({
  name: 'Collection',
  defaults: COLLECTION_STATE_DEFAULTS
})
@Injectable()
export class CollectionState {
  constructor(
    private service: CollectionService
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

  @Action(CollectionActions.GetCollectionRequest)
  public getCollectionRequest(ctx: StateContext<ICollectionState>, action: CollectionActions.GetCollectionRequest) {
    ctx.patchState({
      loadCollectionStatus: RequestStatus.Pending
    });

    return this.service.getCollection().pipe(
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

  @Selector()
  public static loadedCollection(state: ICollectionState): ICollectionItem[] {
    return state.loadedCollection;
  }
}