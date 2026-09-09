import { ICompanyItem } from '@app/states/products/interfaces/company-item.interface';
import { AsyncPipe, DatePipe, Location, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CopyToClipboardDirective } from '@app/directives/copy-to-clipboard.directive';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatActions } from '@app/states/chat/states/chat-actions';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { IProductPropertiesResponse } from '@app/states/products/interfaces/product-properties-response.interface';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
import { ProductsState } from '@app/states/products/states/products.state';
import { NgbCarouselModule, NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngxs/store';
import { combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-product-properties',
  imports: [
    RouterLink,
    AsyncPipe,
    DatePipe,
    NgbCarouselModule,
    NgbTooltipModule,
    NgTemplateOutlet,
    CopyToClipboardDirective,
  ],
  templateUrl: './product-properties.component.html',
  styleUrl: './product-properties.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: true,
})
export class ProductPropertiesComponent implements OnInit {
  @ViewChild('bidsModal', { static: true }) bidsModalRef!: TemplateRef<unknown>;

  constructor(
    private readonly store: Store,
    private readonly modalService: NgbModal,
    private readonly params: ActivatedRoute,
    private location: Location,
  ) {
    this.failure$ = this.store.select(ProductsState.propertiesFailure);
    this.productProperties$ = this.store.select(ProductsState.productProperties);
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);
    this.collectionChanging$ = this.store.select(CollectionState.collectionChanging);
    this.releases$ = combineLatest([
      this.productProperties$,
      this.store.select(OwnershipState.ownership),
    ]).pipe(
      map(([properties, ownership]) => {
        const have = new Set(ownership.flatMap((item) => item.have_ids ?? []));
        const wish = new Set(ownership.flatMap((item) => item.wish_ids ?? []));
        const bid = new Set(ownership.flatMap((item) => item.bid_ids ?? []));
        return (properties?.releases ?? []).map((release) => ({
          ...release,
          owned: have.has(release.release_id),
          wished: wish.has(release.release_id),
          bided: bid.has(release.release_id),
        }));
      }),
    );
  }

  readonly failure$: Observable<{ failed: boolean; notFound: boolean }>;

  public platformId$!: Observable<number>;

  public sortedReleases$!: Observable<{ highlighted: IReleaseItem[]; others: IReleaseItem[] }>;

  public ngOnInit(): void {
    this.platformId$ = this.params.paramMap.pipe(map((params) => Number(params.get('platform') ?? 0)));
    this.sortedReleases$ = combineLatest([this.releases$, this.platformId$]).pipe(
      map(([releases, platformId]) => {
        if (!platformId || platformId === 0) {
          return { highlighted: [], others: releases };
        }

        const highlighted = releases.filter((r) => r.platform_id === platformId);
        const others = releases.filter((r) => r.platform_id !== platformId);

        return { highlighted, others };
      }),
    );

    this.productDevelopers$ = this.productProperties$.pipe(
      map((properties) => (properties?.companies || []).filter((c) => c.developer)),
    );

    this.productPublishers$ = this.productProperties$.pipe(
      map((properties) => (properties?.companies || []).filter((c) => c.publisher)),
    );
  }

  public selectedRelease!: IReleaseItem;

  public productProperties$: Observable<IProductPropertiesResponse | null>;

  public productDevelopers$!: Observable<ICompanyItem[] | null>;

  public productPublishers$!: Observable<ICompanyItem[] | null>;

  public collectionChanging$: Observable<boolean>;

  public isAuthorised$: Observable<boolean>;

  public releases$: Observable<IReleaseItem[]>;

  public addToCollection(release_id: number, product_id: number): void {
    this.store.dispatch(new CollectionActions.AddToCollectionRequest({ release_id, product_id }));
  }

  public addWish(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddWishRequest({ release_id }));
  }

  public addBid(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddBidRequest({ release_id }));
  }

  public removeBid(release_id: number): void {
    this.store.dispatch(new CollectionActions.RemoveBidRequest({ release_id }));
  }

  public openBidsModal(release: IReleaseItem) {
    this.selectedRelease = release;
    this.modalService.open(this.bidsModalRef, { centered: true });
  }

  public startChatWith(user: string) {
    this.modalService.dismissAll();
    this.store.dispatch(new ChatActions.SetRecepient(user));
    this.store.dispatch(new ChatActions.RequestMessages(user));
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }

  serialPreview(release: IReleaseItem): string {
    return (release.serial ?? []).slice(0, 3).join(' · ') + ((release.serial?.length ?? 0) > 3 ? ' · …' : '');
  }

  public goBack() {
    this.location.back();
  }
}
