import { Injectable } from '@angular/core';
import { CollectionSort } from './collection-filter';
export type LibraryKind = 'collection' | 'wishlist';
export interface LibraryView {
  query: string;
  sort: CollectionSort;
  page: number;
  size: number;
  scroll: number;
}
@Injectable({ providedIn: 'root' })
export class LibraryViewService {
  private views = new Map<string, LibraryView>();
  get(kind: LibraryKind | `collector:${string}`): LibraryView {
    if (!this.views.has(kind))
      this.views.set(kind, { query: '', sort: 'name', page: 1, size: 24, scroll: 0 });
    return this.views.get(kind)!;
  }
}
