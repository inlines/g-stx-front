import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { Observable } from 'rxjs';
import { ICollectorItem } from '../interfaces/collector-item.interface';

@Injectable({
  providedIn: 'root',
})
export class CollectorsService {
  private readonly getCollectorsPath: string;
  private readonly getCollectorsPropertiesPath: string;

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment: IEnvironment,
  ) {
    this.getCollectorsPath = `${this.environment.apiUrl}/collectors`;
    this.getCollectorsPropertiesPath = `${this.environment.apiUrl}/collection-by-login`;
  }

  public getCollectors(): Observable<ICollectorItem[]> {
    return this.http.get<ICollectorItem[]>(this.getCollectorsPath);
  }

  public getCollectorProperties(id: string): Observable<ICollectionItem[]> {
    return this.http.get<ICollectionItem[]>(`${this.getCollectorsPropertiesPath}/${id}`, {
      params: { cat: 0 },
    });
  }
}
