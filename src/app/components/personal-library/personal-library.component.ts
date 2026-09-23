import { HostListener } from '@angular/core';
import { mobileLibraryPager, normalizeLibraryPageSize } from '@app/shared/library-view.service';
import { ListScrollService } from '@app/shared/list-scroll.service';
import { LibraryPageService, LibraryPage, LibraryRequest } from '@app/shared/library-page.service';
import { HorizontalFiltersDirective } from '@app/directives/horizontal-filters.directive';
import { scrollToContent } from '@app/shared/scroll-to-content';
import { GameSearchComponent } from '../game-search/game-search.component';
import { withReleaseDate } from '@app/shared/release-date';
import { PagerComponent } from '../pager/pager.component';
import { LoadingPanelComponent } from '../loading-panel/loading-panel.component';
import { PageSwipeDirective } from '@app/directives/page-swipe.directive';
import { validSerial, SERIAL_HINT, SearchMode } from '@app/shared/serial-number';
import { RegionFiltersComponent } from '../region-filters/region-filters.component';
import {
  matchesRegion,
  ownedRegionCounts,
  platformRegionCounts,
  RegionGroup,
  toggleRegion,
} from '@app/shared/region-filter';
import { priceValidator } from '@app/shared/price-validator';
import { libraryCsv, LibraryCsvDownload } from '@app/shared/library-csv';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import {
  ElementRef,
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngxs/store';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, combineLatest, firstValueFrom, map, shareReplay, tap, switchMap, startWith, catchError, of, debounceTime } from 'rxjs';
import { RequestStatus } from '@app/constants/request-status.const';
import { filterCollection, CollectionSort } from '@app/shared/collection-filter';
import { LibraryKind, LibraryView, LibraryViewService } from '@app/shared/library-view.service';
import { PersonalListController } from '@app/shared/personal-list.controller';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { ReleaseCardComponent } from '../release-card/release-card.component';
import { buildPages } from '../pager/pagination';
@Component({
  selector: 'app-personal-library',
  imports: [HorizontalFiltersDirective,
    GameSearchComponent,
    PageSwipeDirective,
    LoadingPanelComponent,
    PagerComponent,
    RegionFiltersComponent,
    AsyncPipe,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    ReleaseCardComponent,
  ],
  providers: [PersonalListController],
  templateUrl: './personal-library.component.html',
  styleUrl: './personal-library.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class PersonalLibraryComponent implements OnInit, OnDestroy {
  @ViewChild('results') results?: ElementRef<HTMLElement>;
  @Input({ required: true }) kind!: LibraryKind;
  @ViewChild('copyModal', { static: true }) copyModal!: TemplateRef<unknown>;
  readonly copyCib = new FormControl<boolean|null>(null);
  readonly copySerial = new FormControl<string|null>(null);
  copyItem: ICollectionItem|null = null;
  @ViewChild('priceModal', { static: true }) priceModal!: TemplateRef<unknown>;
  @ViewChild('saleModal', { static: true }) saleModal!: TemplateRef<unknown>;
  readonly salePrice = new FormControl<number | null>(null, {
    validators: [priceValidator],
  });
  readonly saleCib = new FormControl(false, { nonNullable: true });
  sellingItem: ICollectionItem | null = null;
  readonly list = inject(PersonalListController);
  private readonly csvDownload = inject(LibraryCsvDownload);
  private readonly store = inject(Store);
  private readonly views = inject(LibraryViewService);
  private readonly modal = inject(NgbModal);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly pagesApi = inject(LibraryPageService);
  private pendingScroll = false;
  private loaded = false;
  private lastPage: LibraryPage = {items:[],total_count:0,unfiltered_total:0,platform_ids:[],owned_regions:{}};
  private readonly changes = new BehaviorSubject<void>(undefined);
  view!: LibraryView;
  readonly query = new FormControl('', { nonNullable: true });
  readonly price = new FormControl(0, {
    nonNullable: true,
    validators: [Validators.required, priceValidator],
  });
  readonly busy$ = this.store.select(CollectionState.collectionChanging);
  editing: ICollectionItem | null = null;
  vm$!: ReturnType<PersonalLibraryComponent['createView']>;
  private readonly restoreScroll = inject(ListScrollService).attach(this.destroyRef, this.injector);
  get mobilePager(): boolean { return mobileLibraryPager(); }
  @HostListener('window:resize')
  resizePager(): void {
    if (this.view && normalizeLibraryPageSize(this.view)) this.changes.next();
  }
  private snowOpening = false;
  private snowDialog?: ReturnType<NgbModal['open']>;
  ngOnInit(): void {
    this.view = this.views.get(this.kind);
    normalizeLibraryPageSize(this.view);
    this.query.setValue(this.view.query, { emitEvent: false });
    this.list.connect(this.kind, true);
    this.vm$ = this.createView();
    this.query.valueChanges.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef)).subscribe((query) => {
      this.view.query = query;
      this.view.page = 1;
      this.changes.next();
    });
  }
  private request(): LibraryRequest {
    return {cat:this.list.activeCategory, regions:this.view.regions.join(','), query:this.query.value, search_mode:this.view.searchMode??'name', sort:this.view.sort, limit:this.view.size, offset:(this.view.page-1)*this.view.size};
  }
  private createView() {
    return combineLatest([this.list.platforms$,this.changes]).pipe(
      debounceTime(0),
      switchMap(([platforms]) => this.pagesApi.page(this.kind,this.request()).pipe(
        map(page=>({page,platforms,loading:false,failed:false})),
        startWith({page:null,platforms,loading:true,failed:false}),
        catchError(()=>of({page:null,platforms,loading:false,failed:true})),
      )),
      map(({page,platforms,loading,failed})=>{
        if(page){this.lastPage=page;this.loaded=true;}
        const data=page??this.lastPage, pages=Math.max(1,Math.ceil(data.total_count/this.view.size));
        if(page&&this.view.page>pages){this.view.page=pages;this.changes.next();}
        const ownership=this.store.selectSnapshot(OwnershipState.ownership);
        return {regionTotals:platformRegionCounts(platforms.find(p=>p.id===this.list.activeCategory)),ownedRegions:data.owned_regions,
          exportCount:data.unfiltered_total,forSale:new Set(ownership.flatMap(item=>item.wts_ids??[])),items:data.items,total:data.total_count,
          start:(this.view.page-1)*this.view.size,pages,page:this.view.page,pageItems:buildPages(pages,this.view.page,1),loading,failed,ready:!loading&&!failed};
      }),
      tap(vm=>{
        if(vm.ready){
          if (this.restoreScroll()) { this.pendingScroll=false; return; }
          if (!this.pendingScroll) return;
          this.pendingScroll=false;
          afterNextRender(()=>scrollToContent(this.results?.nativeElement),{injector:this.injector});
        }
      }),shareReplay({bufferSize:1,refCount:true}),
    );
  }
  async openSnow(): Promise<void> {
    if (this.kind !== 'collection' || this.snowOpening || this.snowDialog) return;
    this.snowOpening = true;
    try {
      const vm = await firstValueFrom(this.vm$);
      if (!vm.ready) return;
      const items = vm.items.map((item) => ({ ...item }));
      const { CollectionSnowComponent } = await import('../collection-snow/collection-snow.component');
      if (this.destroyRef.destroyed) return;
      const dialog = this.modal.open(CollectionSnowComponent, {
        fullscreen: true,
        windowClass: 'collection-snow-window',
        ariaLabelledBy: 'collection-snow-title',
      });
      this.snowDialog = dialog;
      dialog.componentInstance.items = items;
      const clear = () => {
        if (this.snowDialog === dialog) this.snowDialog = undefined;
      };
      dialog.result.then(clear, clear);
    } catch {
      /* An optional animation chunk must not interrupt the collection page. */
    } finally {
      this.snowOpening = false;
    }
  }
  async exportCsv(): Promise<void> {
    if (!this.loaded) return;
    try {
      const page=await firstValueFrom(this.pagesApi.all(this.kind,{...this.request(),query:'',regions:''}));
      if(this.destroyRef.destroyed)return;
      const selling=new Set(this.store.selectSnapshot(OwnershipState.ownership).flatMap(i=>i.wts_ids??[]));
      this.csvDownload.save(libraryCsv(page.items,this.kind,selling),`${this.kind}-${this.list.activeCategory??'all'}-${new Date().toISOString().slice(0,10)}.csv`);
    } catch { this.retry(); }
  }
  readonly serialHint = SERIAL_HINT;
  get invalidSerial(): boolean {
    return this.view?.searchMode === 'serial' && !!this.query.value.trim() && !validSerial(this.query.value);
  }
  searchMode(value: SearchMode): void {
    this.view.searchMode = value;
    if (value === 'serial') this.view.regions = [];
    this.view.page = 1;
    this.changes.next();
  }
  clearFilters(): void {
    this.view.regions = [];
    this.query.setValue('');
  }
  toggleRegion(region: RegionGroup): void {
    this.view.regions = toggleRegion(this.view.regions, region);
    this.view.page = 1;
    this.changes.next();
  }
  selectPlatform(cat: number): void {
    if (cat === this.list.activeCategory) return;
    this.view.page = 1;
    this.view.scroll = 0;
    this.list.select(cat);
    this.changes.next();
  }
  sort(value: string): void {
    this.view.sort = value as CollectionSort;
    this.view.page = 1;
    this.changes.next();
  }
  pageSize(value: string): void {
    this.view.size = this.mobilePager ? Math.min(48, Number(value)) : Number(value);
    this.view.page = 1;
    this.changes.next();
  }
  page(value: number | string): void {
    this.pendingScroll = true;
    if (typeof value !== 'number') return;
    this.view.page = value;
    this.changes.next();

  }
  retry(): void { this.changes.next(); }
  private mutate(action:object, done?:()=>void):void {
    this.list.mutate(action,()=>{this.changes.next();done?.();});
  }
  remove(id: number): void {
    this.mutate(
      this.kind === 'collection'
        ? new CollectionActions.RemoveFromCollectionRequest({ release_id: id })
        : this.kind === 'wts'
          ? new CollectionActions.RemoveWtsRequest({ release_id: id })
          : new CollectionActions.RemoveWishRequest({ release_id: id }),
    );
  }
  toggleSale(item: ICollectionItem): void {
    if (this.kind !== 'collection' || this.store.selectSnapshot(CollectionState.collectionChanging)) return;
    const owned = this.store.selectSnapshot(OwnershipState.ownership);
    if (!owned.some((platform) => platform.have_ids.includes(item.release_id))) return;
    const selling = owned.some((platform) => (platform.wts_ids ?? []).includes(item.release_id));
    if (selling) {
      this.mutate(new CollectionActions.RemoveWtsRequest({ release_id: item.release_id }));
    } else {
      this.editSale(item);
    }
  }
  editSale(item: ICollectionItem): void {
    this.sellingItem = item;
    this.salePrice.reset(this.kind === 'wts' ? item.price : null);
    this.saleCib.reset(item.cib ?? false);
    this.modal.open(this.saleModal, { centered: true, ariaLabelledBy: 'library-sale-title' });
  }
  saveSale(): void {
    if (
      !this.sellingItem ||
      this.salePrice.invalid ||
      this.store.selectSnapshot(CollectionState.collectionChanging)
    )
      return;
    this.mutate(
      new CollectionActions.AddWtsRequest({
        release_id: this.sellingItem.release_id,
        price: this.salePrice.value,
        cib: this.saleCib.value,
      }),
      () => this.modal.dismissAll(),
    );
  }

  editCopy(item:ICollectionItem):void {
    this.copyItem=item;
    this.copyCib.setValue(item.cib??null);
    this.copySerial.setValue(item.selected_serial??(item.serial?.length===1?item.serial[0]:null));
    this.modal.open(this.copyModal,{centered:true,ariaLabelledBy:'library-copy-title'});
  }
  saveCopy():void {
    if(!this.copyItem||this.store.selectSnapshot(CollectionState.collectionChanging))return;
    this.mutate(new CollectionActions.SetCopyRequest({release_id:this.copyItem.release_id,selected_serial:this.copySerial.value,cib:this.copyCib.value}),()=>this.modal.dismissAll());
  }
  edit(item: ICollectionItem): void {
    this.editing = item;
    this.price.setValue(item.price ?? 0);
    this.modal.open(this.priceModal, { centered: true, ariaLabelledBy: 'library-price-title' });
  }
  savePrice(): void {
    if (!this.editing || this.price.invalid || this.store.selectSnapshot(CollectionState.collectionChanging))
      return;
    this.mutate(
      new CollectionActions.SetPriceRequest({
        release_id: this.editing.release_id,
        price: Number(this.price.value),
      }),
      () => this.modal.dismissAll(),
    );
  }
  ngOnDestroy(): void {
    this.snowDialog?.close();
    this.modal.dismissAll();
  }
}
