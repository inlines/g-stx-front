import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { IEnvironment } from "@app/environments/environment.interface";
import { Observable } from "rxjs";
import { ILoginPayload } from "../interfaces/login-payload.interface";


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly authPath: string;

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: IEnvironment,
  ) {
    this.authPath = `${this.environment.apiUrl}/login`
  }

  public authRequest(payload: ILoginPayload): Observable<any> {
    return this.http.post<any>(this.authPath, payload);
  }

}