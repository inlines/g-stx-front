import { RegionGroup } from './region-filter';
import { Injectable } from '@angular/core';
import { CollectionSort } from './collection-filter';
export type LibraryKind = 'collection' | 'wishlist' | 'wts';
export interface LibraryView {
  regions: RegionGroup[];
  platform: number | null;
  query: string;
  searchMode?: 'name' | 'serial';
  sort: CollectionSort;
  page: number;
  size: number;
  scroll: number;
}
@Injectable({ providedIn: 'root' })
export class LibraryViewService {
  readonly collectorTabs = new Map<string, 'collection' | 'wts'>();
  private views = new Map<string, LibraryView>();
  get(kind: LibraryKind | `collector:${string}` | `collector-wts:${string}`): LibraryView {
    if (!this.views.has(kind))
      this.views.set(kind, { regions: [], platform: null, query: '', sort: 'name', page: 1, size: 24, scroll: 0 });
    return this.views.get(kind)!;
  }
}

export function mobileLibraryPager(): boolean {
  return window.innerWidth <= 767;
}

export function normalizeLibraryPageSize(view: LibraryView): boolean {
  if (!mobileLibraryPager() || view.size <= 48) return false;
  const offset = (view.page - 1) * view.size;
  view.size = 48;
  view.page = Math.floor(offset / view.size) + 1;
  return true;
}
