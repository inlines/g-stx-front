import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CalendarViewService {
  platform: number | null = null;
  month: string | null = null;
}
