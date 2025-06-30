import { Action, createSelector, Selector, State, StateContext } from "@ngxs/store";
import { IownershipState } from "./ownership.state.interface";
import { OWNERSHIP_STATE_DEFAULTS } from "./ownership.state-default.const";
import { Injectable } from "@angular/core";
import { OwnershipService } from "../services/ownership.service";
import { OwnershipActions } from "./ownership-actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, tap } from "rxjs";
import { IOwnershipItem } from "../interfaces/ownership-item.interface";

@State<IownershipState>({
  name: 'Ownership',
  defaults: OWNERSHIP_STATE_DEFAULTS,
})
@Injectable()
export class OwnershipState {
  constructor(
    private service: OwnershipService
  ){}

  @Action(OwnershipActions.RequestOwnership)
  public loadOwnership(ctx: StateContext<IownershipState>, action: OwnershipActions.RequestOwnership) {
    ctx.patchState({
      loadOwnershipStatus: RequestStatus.Pending
    });

    return this.service.getOwnershipInfo().pipe(
      tap((response) => {
        ctx.dispatch(new OwnershipActions.RequestOwnershipSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new OwnershipActions.RequestOwnershipFail()))
    )
  }

  @Action(OwnershipActions.RequestOwnershipSuccess)
  public loadListSuccess(ctx: StateContext<IownershipState>, action: OwnershipActions.RequestOwnershipSuccess) {
    ctx.patchState({
      loadOwnershipStatus: RequestStatus.Load,
      ownership: action.payload
    });
  }

  @Action(OwnershipActions.ResetOwnership)
  public resetOwnershipt(ctx: StateContext<IownershipState>) {
    ctx.setState(OWNERSHIP_STATE_DEFAULTS);
  }

  @Selector()
  static ownership(state: IownershipState) {
    return state.ownership;
  }

  static activeCollectionPlatforms = createSelector(
    [OwnershipState.ownership],
    (ownership: IOwnershipItem[]) => ownership.filter(item => item.have_count > 0).map(o => ({platform: o.platform, have_games: o.have_games}))
  );

  static activeWishlistPlatforms = createSelector(
    [OwnershipState.ownership],
    (ownership: IOwnershipItem[]) => ownership.filter(item => item.wish_count > 0).map(o => o.platform)
  );

  static hasRelease = (releaseId: number) =>
    createSelector([OwnershipState.ownership], (ownership: IOwnershipItem[]): boolean => {
      return ownership.some(item => item.have_ids.includes(releaseId));
  });

  static hasWish = (releaseId: number) =>
    createSelector([OwnershipState.ownership], (ownership: IOwnershipItem[]): boolean => {
      return ownership.some(item => item.wish_ids.includes(releaseId));
  });

  static hasBid = (releaseId: number) =>
    createSelector([OwnershipState.ownership], (ownership: IOwnershipItem[]): boolean => {
      return ownership.some(item => item.bid_ids.includes(releaseId));
  });
}