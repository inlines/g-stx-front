import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ENVIRONMENT } from '@app/environments/environment.token';

export interface SerialRequest {
  id: number;
  kind?: 'serial' | 'alternative_name';
  release_id: number | null;
  product_id: number;
  product_name: string;
  platform_id: number;
  platform_name: string;
  region_id: number;
  region_name: string;
  release_date: number | null;
  digital_only: boolean;
  existing_serials: string[];
  submitter: string;
  serial: string;
  submitted_serial?: string;
  status: 'pending' | 'accepted';
  created_at: string;
  reviewed_at: string | null;
  reviewer: string | null;
}
@Injectable({ providedIn: 'root' })
export class SerialRequestsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ENVIRONMENT).apiUrl;
  submit(releaseId: number, serial: string, photo: Blob) {
    return this.http.post<{ id: number; status: 'pending' }>(
      `${this.api}/releases/${releaseId}/serial-requests`,
      photo,
      {
        params: { serial },
        headers: { 'Content-Type': 'image/jpeg' },
      },
    );
  }
  submitName(productId: number, name: string, photo: Blob) {
    return this.http.post<{ id: number; status: 'pending' }>(
      `${this.api}/products/${productId}/name-requests`,
      photo,
      { params: { name }, headers: { 'Content-Type': 'image/jpeg' } },
    );
  }
  list(status: 'pending' | 'accepted', offset: number, limit = 10) {
    return this.http.get<{ items: SerialRequest[]; total_count: number }>(
      `${this.api}/admin/serial-requests`,
      { params: { status, offset, limit } },
    );
  }
  photo(id: number) {
    return this.http.get(`${this.api}/admin/serial-requests/${id}/photo`, { responseType: 'blob' });
  }
  accept(id: number, serial: string) {
    return this.http.post<void>(`${this.api}/admin/serial-requests/${id}/accept`, { serial });
  }
  deleteArchived(id: number) {
    return this.http.delete<void>(`${this.api}/admin/serial-requests/${id}/archive`);
  }
  reject(id: number) {
    return this.http.delete<void>(`${this.api}/admin/serial-requests/${id}`);
  }
}
