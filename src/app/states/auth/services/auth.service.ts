import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { IEnvironment } from '@app/environments/environment.interface';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { Observable } from 'rxjs';
import { ILoginPayload } from '../interfaces/login-payload.interface';
import { ILoginResponse } from '../interfaces/login-response.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authPath: string;

  constructor(
    private http: HttpClient,
    @Inject(ENVIRONMENT) private environment: IEnvironment,
  ) {
    this.authPath = `${this.environment.apiUrl}/login`;
  }

  public authRequest(payload: ILoginPayload): Observable<ILoginResponse> {
    return this.http.post<ILoginResponse>(this.authPath, payload);
  }
}
