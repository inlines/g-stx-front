import { RegionGroup } from './region-filter';
import { Injectable } from '@angular/core';
import { CollectionSort } from './collection-filter';
export type LibraryKind = 'collection' | 'wishlist' | 'wts';
export interface LibraryView {
  regions: RegionGroup[];
  platform: number | null;
  query: string;
  sort: CollectionSort;
  page: number;
  size: number;
  scroll: number;
}
@Injectable({ providedIn: 'root' })
export class LibraryViewService {
  private views = new Map<string, LibraryView>();
  get(kind: LibraryKind | `collector:${string}` | `collector-wts:${string}`): LibraryView {
    if (!this.views.has(kind))
      this.views.set(kind, { regions: [], platform: null, query: '', sort: 'name', page: 1, size: 24, scroll: 0 });
    return this.views.get(kind)!;
  }
}
