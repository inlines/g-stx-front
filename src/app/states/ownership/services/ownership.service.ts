import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { Observable } from 'rxjs';
import { IOwnershipItem } from '../interfaces/ownership-item.interface';

@Injectable({
  providedIn: 'root',
})
export class OwnershipService {
  private readonly ownershipPath: string;

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment: IEnvironment,
  ) {
    this.ownershipPath = `${this.environment.apiUrl}/collection-stats`;
  }

  public getOwnershipInfo(): Observable<IOwnershipItem[]> {
    return this.http.get<IOwnershipItem[]>(this.ownershipPath);
  }
}
