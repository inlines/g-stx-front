import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { IEnvironment } from "@app/environments/environment.interface";
import { Observable } from "rxjs";
import { IProductListItem } from "@app/states/products/interfaces/product-list-item.interface";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";
import { IProductPropertiesResponse } from "@app/states/products/interfaces/product-properties-response.interface";
import { IproductListResponse } from "../interfaces/product-list-response.interface";

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly productsPath: string;

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: IEnvironment,
  ) {
    this.productsPath = `${this.environment.apiUrl}/products`    
  }

  public productsRequest(params: IProductListRequest): Observable<IproductListResponse> {
    return this.http.get<IproductListResponse>(this.productsPath, {params: {...params}});
  }

  public productPropertiesRequest(id: string | number): Observable<IProductPropertiesResponse> {
    return this.http.get<IProductPropertiesResponse>(`${this.productsPath}/${id}`);
  }
}