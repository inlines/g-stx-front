import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { LibraryKind } from './library-view.service';
import { RegionCounts } from './region-filter';
import { EMPTY, expand, last, map } from 'rxjs';
import { unixMilliseconds } from './collection-filter';
export interface LibraryPage {
  items: ICollectionItem[]; total_count: number; unfiltered_total: number;
  platform_ids: number[]; owned_regions: RegionCounts;
}
export interface LibraryRequest { login?:string; cat?:number|null; regions?:string; query?:string; search_mode?:string; sort?:string; limit:number; offset:number; }
@Injectable({providedIn:'root'})
export class LibraryPageService {
  private readonly http=inject(HttpClient);
  private readonly api=inject(ENVIRONMENT).apiUrl;
  page(kind:LibraryKind, request:LibraryRequest) {
    let params=new HttpParams();
    for(const [key,value] of Object.entries(request)) if(value!=null) params=params.set(key,String(value));
    return this.http.get<LibraryPage>(`${this.api}/library/${kind}`,{params}).pipe(map(page=>({...page, items:page.items.map(item=>({...item,release_date:unixMilliseconds(item.release_date)}))})));
  }
  all(kind:LibraryKind, request:LibraryRequest) {
    const first={...request,limit:1000,offset:0};
    return this.page(kind,first).pipe(expand(page=>page.items.length>=page.total_count?EMPTY:this.page(kind,{...first,offset:page.items.length}).pipe(map(next=>{
      if(!next.items.length)throw new Error('Incomplete library export');
      return {...next,items:[...page.items,...next.items]};
    }))),last());
  }
}
