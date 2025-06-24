import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  header?: string;
  body: string;
  classname?: string;
  delay?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];
  private _toastEvents = new Subject<Toast>();
  public toastEvents$ = this._toastEvents.asObservable();

  show(toast: Toast) {
    this.toasts.push(toast);
    this._toastEvents.next(toast);
  }

  remove(toast: Toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  clear() {
    this.toasts = [];
  }
}