import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { IEnvironment } from "@app/environments/environment.interface";
import { Observable } from "rxjs";
import { IEditCollectionPayload } from "../interfaces/edit-collection-payload.interface";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";
import { IcollectionResponse } from "../interfaces/collection-response.interface";

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly addToCollectionPath: string;
  private readonly removeFromCollectionPath: string;

  private readonly addWishPath: string;
  private readonly removeWishPath: string;

  private readonly getCollectionPath: string;
  private readonly getWishlistPath: string;

  private readonly addBidPath: string;
  private readonly removeBidPath: string;

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: IEnvironment,
  ) {
    this.addToCollectionPath = `${this.environment.apiUrl}/add_release`;
    this.getCollectionPath = `${this.environment.apiUrl}/collection`;
    this.removeFromCollectionPath = `${this.environment.apiUrl}/remove_release`;

    this.addWishPath = `${this.environment.apiUrl}/add_wish`;
    this.removeWishPath = `${this.environment.apiUrl}/remove_wish`;
    this.getWishlistPath = `${this.environment.apiUrl}/wishlist`;

    this.addBidPath = `${this.environment.apiUrl}/add_bid`;
    this.removeBidPath = `${this.environment.apiUrl}/remove_bid`;
  }

  public addToCollection(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.addToCollectionPath, payload);
  }

  public removeFromCollection(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.removeFromCollectionPath, payload);
  }

  public addWish(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.addWishPath, payload);
  }

  public addBid(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.addBidPath, payload);
  }

  public removeWish(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.removeWishPath, payload);
  }

  public removeBid(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.removeBidPath, payload);
  }

  public getCollection(params: IProductListRequest): Observable<IcollectionResponse> {
    return this.http.get<IcollectionResponse>(this.getCollectionPath, {params: {...params}});
  }

  public getWishlist(params: IProductListRequest): Observable<IcollectionResponse> {
    return this.http.get<IcollectionResponse>(this.getWishlistPath, {params: {...params}});
  }

}