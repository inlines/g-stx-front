import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { IEnvironment } from "@app/environments/environment.interface";
import { Observable } from "rxjs";
import { IEditCollectionPayload } from "../interfaces/edit-collection-payload.interface";
import { ICollectionItem } from "../interfaces/collection-item.interface";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private readonly addToCollectionPath: string;
  private readonly removeFromCollectionPath: string;
  private readonly getCollectionPath: string;

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: IEnvironment,
  ) {
    this.addToCollectionPath = `${this.environment.apiUrl}/add_release`;
    this.getCollectionPath = `${this.environment.apiUrl}/collection`;
    this.removeFromCollectionPath = `${this.environment.apiUrl}/remove_release`;
  }

  public addToCollection(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.addToCollectionPath, payload);
  }

  public removeFromCollection(payload: IEditCollectionPayload): Observable<any> {
    return this.http.post<any>(this.removeFromCollectionPath, payload);
  }

  public getCollection(params: IProductListRequest): Observable<ICollectionItem[]> {
    return this.http.get<ICollectionItem[]>(this.getCollectionPath, {params: {...params}});
  }

}