import { tap } from 'rxjs';
import { UserBadgesService } from './user-badges.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';

export interface AdminUser {
  id: number;
  user_login: string;
  is_admin: boolean;
  created_at: string | null;
}
export interface AdminUsers {
  items: AdminUser[];
  total_count: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly badges = inject(UserBadgesService);
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  me() {
    return this.http.get<AdminUser>(`${this.api}/profile/me`);
  }
  users(query: string, offset: number, limit: number) {
    return this.http.get<AdminUsers>(`${this.api}/admin/users`, { params: { query, offset, limit } });
  }
  promote(id: number) {
    return this.http
      .post<AdminUser>(`${this.api}/admin/users/${id}/promote`, {})
      .pipe(tap(() => this.badges.refresh()));
  }
  delete(id: number) {
    return this.http.delete<void>(`${this.api}/admin/users/${id}`).pipe(tap(() => this.badges.refresh()));
  }
}
