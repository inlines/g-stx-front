import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  readonly avatarVersion = signal(0);
  changePassword(old_password: string, new_password: string, confirm_password: string) {
    return this.http.post<void>(`${this.api}/profile/password`, {
      old_password,
      new_password,
      confirm_password,
    });
  }
  saveAvatar(blob: Blob) {
    return this.http
      .post<void>(`${this.api}/profile/avatar`, blob, { headers: { 'Content-Type': 'image/png' } })
      .pipe(tap(() => this.avatarVersion.update((version) => version + 1)));
  }
  avatarUrl(login: string) {
    return `${this.api}/avatars/${encodeURIComponent(login)}?v=${this.avatarVersion()}`;
  }
}
