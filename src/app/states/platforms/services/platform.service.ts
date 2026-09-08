import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { Observable } from 'rxjs';
import { IPlatformItem } from '../interfaces/platform-item.interface';

@Injectable({
  providedIn: 'root',
})
export class PlatformService {
  private readonly platformPath: string;

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment: IEnvironment,
  ) {
    this.platformPath = `${this.environment.apiUrl}/platforms`;
  }

  public getPlatforms(): Observable<IPlatformItem[]> {
    return this.http.get<IPlatformItem[]>(this.platformPath);
  }
}
