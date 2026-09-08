import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { listHttpParams } from '@app/shared/list-params';
import { IProductListRequest } from '@app/states/products/interfaces/product-list-request.interface';
import { IProductPropertiesResponse } from '@app/states/products/interfaces/product-properties-response.interface';
import { Observable } from 'rxjs';
import { IproductListResponse } from '../interfaces/product-list-response.interface';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly productsPath: string;

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment: IEnvironment,
  ) {
    this.productsPath = `${this.environment.apiUrl}/products`;
  }

  public productsRequest(params: IProductListRequest): Observable<IproductListResponse> {
    return this.http.get<IproductListResponse>(this.productsPath, { params: listHttpParams(params) });
  }

  public productPropertiesRequest(id: string | number): Observable<IProductPropertiesResponse> {
    return this.http.get<IProductPropertiesResponse>(`${this.productsPath}/${id}`);
  }
}
