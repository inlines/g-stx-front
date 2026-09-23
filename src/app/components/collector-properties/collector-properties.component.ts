import { HostListener } from '@angular/core';
import { mobileLibraryPager, normalizeLibraryPageSize } from '@app/shared/library-view.service';
import { ListScrollService } from '@app/shared/list-scroll.service';
import { LibraryPageService, LibraryPage } from '@app/shared/library-page.service';
import { HorizontalFiltersDirective } from '@app/directives/horizontal-filters.directive';
import { scrollToContent } from '@app/shared/scroll-to-content';
import { withReleaseDate } from '@app/shared/release-date';
import { filterCollection } from '@app/shared/collection-filter';
import { LoadingPanelComponent } from '../loading-panel/loading-panel.component';
import { PageSwipeDirective } from '@app/directives/page-swipe.directive';
import { RegionFiltersComponent } from '../region-filters/region-filters.component';
import {
  matchesRegion,
  ownedRegionCounts,
  platformRegionCounts,
  RegionGroup,
  toggleRegion,
} from '@app/shared/region-filter';
import { KudosComponent } from '../kudos/kudos.component';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { CollectorsService } from '@app/states/collectors/services/collectors.service';
import { unixMilliseconds } from '@app/shared/collection-filter';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { AsyncPipe } from '@angular/common';
import { afterNextRender, DestroyRef, ElementRef, Injector, ViewChild, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RequestStatus } from '@app/constants/request-status.const';
import { LibraryViewService } from '@app/shared/library-view.service';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { CollectorsActions } from '@app/states/collectors/states/collectors-actions';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, combineLatest, map, switchMap, of, startWith, catchError, debounceTime, tap, shareReplay } from 'rxjs';
import { PagerComponent } from '../pager/pager.component';
import { ReleaseCardComponent } from '../release-card/release-card.component';
@Component({
  selector: 'app-collector-properties',
  imports: [HorizontalFiltersDirective,
    PageSwipeDirective,
    LoadingPanelComponent,
    RegionFiltersComponent,
    KudosComponent,
    UserAvatarComponent,
    RouterLink,
    AsyncPipe,
    PagerComponent,
    ReleaseCardComponent,
  ],
  templateUrl: './collector-properties.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './collector-properties.component.scss',
})
export class CollectorPropertiesComponent {
  @ViewChild('results') results?: ElementRef<HTMLElement>;
  private readonly injector = inject(Injector);
  private readonly store = inject(Store);
  private readonly views = inject(LibraryViewService);
  private readonly changes = new BehaviorSubject<void>(undefined);
  private readonly service = inject(LibraryPageService);
  private readonly restoreScroll = inject(ListScrollService).attach(inject(DestroyRef), this.injector);
  get mobilePager(): boolean { return mobileLibraryPager(); }
  @HostListener('window:resize')
  resizePager(): void {
    if (this.view && normalizeLibraryPageSize(this.view)) this.changes.next();
  }
  private pendingScroll=false;
  private contextKey='';
  private lastPage:LibraryPage={items:[],total_count:0,unfiltered_total:0,platform_ids:[],owned_regions:{}};
  private readonly selectedTab = new BehaviorSubject<'collection' | 'wts'>(this.views.collectorTabs.get(this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin) ?? '') ?? 'collection');
  private readonly reload = new BehaviorSubject(0);
  get tab() {
    return this.selectedTab.value;
  }
  selectTab(tab: 'collection' | 'wts'): void {
    this.views.collectorTabs.set(this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin) ?? '', tab);
    if (this.tab !== tab) this.selectedTab.next(tab);
  }
  readonly vm$=combineLatest([this.store.select(CollectorsState.collectionPropertiesLogin),this.selectedTab,this.changes,this.reload,this.store.select(PlatformState.loadedPlatforms)]).pipe(
    debounceTime(0),
    switchMap(([login,tab,,,platforms])=>{
      const view=this.views.get(tab==='wts'?`collector-wts:${login}`:`collector:${login}`);
      normalizeLibraryPageSize(view);
      const key=`${login}:${tab}:${view.platform}`;
      if(this.contextKey!==key){this.contextKey=key;this.lastPage={items:[],total_count:0,unfiltered_total:0,platform_ids:[],owned_regions:{}};}
      const request={login:login??undefined,cat:view.platform,regions:view.regions.join(','),sort:view.sort,limit:view.size,offset:(view.page-1)*view.size};
      return (login?this.service.page(tab,request):of(this.lastPage)).pipe(
        map(page=>({page,login,tab,platforms,view,loading:false,failed:false})),
        startWith({page:null,login,tab,platforms,view,loading:true,failed:false}),
        catchError(()=>of({page:null,login,tab,platforms,view,loading:false,failed:true})),
      );
    }),
    map(({page,login,tab,platforms,view,loading,failed})=>{
      if(page)this.lastPage=page;
      const data=page??this.lastPage;
      const pages=Math.max(1,Math.ceil(data.total_count/view.size));
      if(page&&view.page>pages){view.page=pages;this.changes.next();}
      return {login,tab,total:data.total_count,unfilteredTotal:data.unfiltered_total,platforms:platforms.filter(p=>data.platform_ids.includes(p.id)),selectedPlatform:view.platform,
        regions:view.regions,sort:view.sort,regionTotals:platformRegionCounts(platforms.find(p=>p.id===view.platform)),ownedRegions:data.owned_regions,
        offset:(view.page-1)*view.size,page:view.page,size:view.size,items:data.items.map(item=>({...item,platformId:item.platform_id??null})),loading,failed};
    }),
    tap(vm=>{if(!vm.loading&&!vm.failed&&this.restoreScroll()){this.pendingScroll=false;return;}if(!vm.loading&&!vm.failed&&this.pendingScroll){this.pendingScroll=false;afterNextRender(()=>scrollToContent(this.results?.nativeElement),{injector:this.injector});}}),
    shareReplay({bufferSize:1,refCount:true}),
  );
  sort(value: string): void {
    if (value !== 'name' && value !== 'date') return;
    this.view.sort = value;
    this.view.page = 1;
    this.changes.next();
  }
  selectPlatform(id: number | null): void {
    this.view.platform = id;
    if (id === null) this.view.regions = [];
    this.view.page = 1;
    this.changes.next();
  }
  toggleRegion(region: RegionGroup): void {
    this.view.regions = toggleRegion(this.view.regions, region);
    this.view.page = 1;
    this.changes.next();
  }
  page(page: number): void {
    this.pendingScroll=true;
    this.view.page = page;
    this.changes.next();

  }
  pageSize(size: string): void {
    this.view.size = this.mobilePager ? Math.min(48, Number(size)) : Number(size);
    this.view.page = 1;
    this.changes.next();
  }
  private get view() {
    return this.views.get(
      this.tab === 'wts'
        ? `collector-wts:${this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin)}`
        : `collector:${this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin)}`,
    );
  }
  retry():void {this.reload.next(this.reload.value+1);}
  startChatWith(): void {
    const user = this.store.selectSnapshot(CollectorsState.collectionPropertiesLogin);
    if (user) {
      this.store.dispatch(new ChatActions.SetRecepient(user));
      this.store.dispatch(new ChatActions.RequestMessages(user));
      this.store.dispatch(new ChatActions.ToggleChatVisibility());
    }
  }
}
