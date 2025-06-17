import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthState } from "@app/states/auth/states/auth.state";
import { Store } from "@ngxs/store";
import { Observable } from "rxjs";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  // constructor(
  //   private readonly store: Store
  // ){}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    //const token = this.store.selectSnapshot(AuthState.token);
    console.warn('***');
    debugger;
    // if (token) {
    //   const cloned = req.clone({
    //     headers: req.headers.set('Authorization', `Bearer ${token}`)
    //   });
    //   return next.handle(cloned);
    // }
    return next.handle(req);
  }
}