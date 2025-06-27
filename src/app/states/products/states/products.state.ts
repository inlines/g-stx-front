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
import { IProductPropertiesResponse } from "@app/states/products/interfaces/product-properties-response.interface";

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
    const newParams = {...currentParams, ...action.payload};
    if (!newParams.query) {
      delete newParams.query;
    }
    ctx.patchState({
      productListRequestParams: newParams
    });
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
      productList: action.payload.items.map(x => ({...x, first_release_date: (x.first_release_date || 0) * 1000})),
      productsTotalCount: action.payload.total_count,
    });
  }

  @Action(ProductsActions.LoadProperties)
  public loadProperties(ctx: StateContext<IproductState>, action: ProductsActions.LoadProperties) {
    ctx.patchState(
      {
        productPropertiesRequestStatus: RequestStatus.Pending,
        productProperties: null
      }
    );
    return this.service.productPropertiesRequest(action.id).pipe(
      tap((response) => {
        ctx.dispatch(new ProductsActions.LoadPropertiesSuccess(response))
      }),
      catchError((err, caught) => ctx.dispatch(new ProductsActions.LoadPropertiesFail()))
    )
  }

  @Action(ProductsActions.LoadPropertiesSuccess)
  public loadPropertiesSuccess(ctx: StateContext<IproductState>, action: ProductsActions.LoadPropertiesSuccess) {
    ctx.patchState({
      productPropertiesRequestStatus: RequestStatus.Load,
      productProperties: {
        product: {...action.payload.product, first_release_date: action.payload.product.first_release_date ? action.payload.product.first_release_date * 1000 : null},
        releases: action.payload.releases.map(x => ({...x, release_date: x.release_date ? x.release_date * 1000 : null})),
        screenshots: action.payload.screenshots.map(x => x.replace('t_thumb','t_1080p'))
      }
    });
  }

  @Action(ProductsActions.ProductsReset)
  public reset(ctx: StateContext<IproductState>) {
    ctx.setState(PRODUCTS_STATE_DEFAULTS);
  }

  @Selector()
  public static loadedProducts(state: IproductState): IProductListItem[] {
    return state.productList;
  }

  @Selector()
  public static totalCountProducts(state: IproductState): number {
    return state.productsTotalCount;
  }

  @Selector()
  public static productsParams(state: IproductState): IProductListRequest {
    return state.productListRequestParams;
  }

  @Selector()
  public static productPropertiesLoaded(state: IproductState): boolean {
    return state.productPropertiesRequestStatus === RequestStatus.Load;
  }

  @Selector()
  public static productProperties(state: IproductState): IProductPropertiesResponse | null {
    const res = state.productProperties;
    if(res?.product.image_url) {
      res.product.image_url = res.product.image_url?.replace('t_thumb','t_1080p')
    }
    return res;
  }
}