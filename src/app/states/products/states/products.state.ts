import { Action, Selector, State, StateContext } from "@ngxs/store";
import { IproductState } from "./products.state.interface";
import { PRODUCTS_STATE_DEFAULTS } from "./products.state-default.const";
import { Injectable } from "@angular/core";
import { ProductsService } from '@app/states/products/services/products.service';
import { ProductsActions } from "./products.actions";
import { RequestStatus } from "@app/constants/request-status.const";
import { catchError, Observable, tap } from "rxjs";
import { IProductListItem } from "@app/states/products/interfaces/product-list-item.interface";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";

@State<IproductState>({
  name: 'Products',
  defaults: PRODUCTS_STATE_DEFAULTS,
})
@Injectable()
export class ProductsState {
  constructor(
    private service: ProductsService
  ){}

  @Action(ProductsActions.SetRequestParams)  
  public setRequestParams(ctx: StateContext<IproductState>, action: ProductsActions.SetRequestParams) {
    const currentParams = ctx.getState().productListRequestParams;

    ctx.patchState({
      productListRequestParams: {...currentParams, ...action.payload}
    })
  }

  @Action(ProductsActions.LoadList)
  public loadList(ctx: StateContext<IproductState>, action: ProductsActions.LoadList) {
    ctx.patchState({
      productListRequestStatus: RequestStatus.Pending
    });

    const currentParams = ctx.getState().productListRequestParams;
    return this.service.productsRequest(currentParams).pipe(
      tap((response) => {
        ctx.dispatch(new ProductsActions.LoadListSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new ProductsActions.LoadListFail()))
    )
  }

  @Action(ProductsActions.LoadListSuccess)
  public loadListSuccess(ctx: StateContext<IproductState>, action: ProductsActions.LoadListSuccess) {
    ctx.patchState({
      productListRequestStatus: RequestStatus.Load,
      productList: action.payload.map(x => ({...x, first_release_date: (x.first_release_date || 0) * 1000}))
    });
  }

  @Selector()
  public static loadedProducts(state: IproductState): IProductListItem[] {
    return state.productList;
  }

  @Selector()
  public static productsParams(state: IproductState): IProductListRequest {
    return state.productListRequestParams;
  }
}