import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { EMPTY, expand, last, map, Observable } from 'rxjs';
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
    return this.completeList(`${this.getCollectorsPropertiesPath}/${encodeURIComponent(id)}`);
  }

  public getCollectorWts(login: string): Observable<ICollectionItem[]> {
    return this.completeList(`${this.getCollectorsPath}/${encodeURIComponent(login)}/wts`);
  }

  private completeList(path: string): Observable<ICollectionItem[]> {
    const limit = 1000;
    const request = (offset: number) =>
      this.http.get<ICollectionItem[]>(path, {
        params: { cat: 0, limit, offset },
      });
    return request(0).pipe(
      map((batch) => ({ batch, items: batch })),
      expand(({ batch, items }) =>
        batch.length < limit
          ? EMPTY
          : request(items.length).pipe(map((next) => ({ batch: next, items: [...items, ...next] }))),
      ),
      last(),
      map((result) => result.items),
    );
  }
}
