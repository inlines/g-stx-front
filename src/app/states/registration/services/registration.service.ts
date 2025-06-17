import { HttpClient } from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { IEnvironment } from "@app/environments/environment.interface";
import { Observable } from "rxjs";
import { IRegistrationPayload } from "../interfaces/registration-payload.interface";

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly registerPath: string;

  constructor(
    private http: HttpClient,
    @Inject('environment') private environment: IEnvironment,
  ) {
    this.registerPath = `${this.environment.apiUrl}/register`
  }

  public registerRequest(payload: IRegistrationPayload): Observable<any> {
    return this.http.post<any>(this.registerPath, payload);
  }

}