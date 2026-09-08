import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { listHttpParams } from '@app/shared/list-params';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { Observable } from 'rxjs';
import { IcollectionResponse } from '../interfaces/collection-response.interface';
import { IEditCollectionPayload } from '../interfaces/edit-collection-payload.interface';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly addToCollectionPath: string;
  private readonly removeFromCollectionPath: string;
  private readonly setReleasePricePath: string;

  private readonly addWishPath: string;
  private readonly removeWishPath: string;

  private readonly getCollectionPath: string;
  private readonly getWishlistPath: string;
  private readonly getWtsPath: string;

  private readonly addBidPath: string;
  private readonly removeBidPath: string;

  private readonly addWtsPath: string;
  private readonly removewtsPath: string;

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment: IEnvironment,
  ) {
    this.addToCollectionPath = `${this.environment.apiUrl}/add_release`;
    this.setReleasePricePath = `${this.environment.apiUrl}/set_release_price`;
    this.getCollectionPath = `${this.environment.apiUrl}/collection`;
    this.removeFromCollectionPath = `${this.environment.apiUrl}/remove_release`;

    this.addWishPath = `${this.environment.apiUrl}/add_wish`;
    this.removeWishPath = `${this.environment.apiUrl}/remove_wish`;
    this.getWishlistPath = `${this.environment.apiUrl}/wishlist`;

    this.addWtsPath = `${this.environment.apiUrl}/add_wts`;
    this.getWtsPath = `${this.environment.apiUrl}/wts`;
    this.removewtsPath = `${this.environment.apiUrl}/remove_wts`;

    this.addBidPath = `${this.environment.apiUrl}/add_bid`;
    this.removeBidPath = `${this.environment.apiUrl}/remove_bid`;
  }

  public addToCollection(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.addToCollectionPath, payload);
  }

  public setReleasePrice(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.setReleasePricePath, payload);
  }

  public removeFromCollection(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.removeFromCollectionPath, payload);
  }

  public addWish(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.addWishPath, payload);
  }

  public addWts(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.addWtsPath, payload);
  }

  public addBid(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.addBidPath, payload);
  }

  public removeWish(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.removeWishPath, payload);
  }

  public removeBid(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.removeBidPath, payload);
  }

  public removeWts(payload: IEditCollectionPayload): Observable<void> {
    return this.http.post<void>(this.removewtsPath, payload);
  }

  public getCollection(params: IProductListRequest): Observable<IcollectionResponse> {
    return this.http.get<IcollectionResponse>(this.getCollectionPath, { params: listHttpParams(params) });
  }

  public getWishlist(params: IProductListRequest): Observable<IcollectionResponse> {
    return this.http.get<IcollectionResponse>(this.getWishlistPath, { params: listHttpParams(params) });
  }

  public getWts(params: IProductListRequest): Observable<IcollectionResponse> {
    return this.http.get<IcollectionResponse>(this.getWtsPath, { params: listHttpParams(params) });
  }
}
