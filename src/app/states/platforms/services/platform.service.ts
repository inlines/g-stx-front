import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { IEnvironment } from "@app/environments/environment.interface";
import { Observable } from "rxjs";
import { IProductListRequest } from "@app/states/products/interfaces/product-list-request.interface";

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly platformPath: string;

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: IEnvironment,
  ) {
    this.platformPath = `${this.environment.apiUrl}/platforms`;
  }

  public getPlatforms(): Observable<any> {
    return this.http.get<any>(this.platformPath);
  }

}