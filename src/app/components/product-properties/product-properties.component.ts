import { UserBadgesService } from '@app/services/user-badges.service';
import { GameStatsComponent } from '../game-stats/game-stats.component';
import { ISimilarGame } from '@app/states/products/interfaces/product-properties-response.interface';
import { supportsReleaseActions } from '@app/shared/release-platforms';
import { SerialRequestComponent } from '../serial-request/serial-request.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { priceValidator } from '@app/shared/price-validator';
import { RequestStatus } from '@app/constants/request-status.const';
import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { NgbCarouselModule, NgbModal, NgbModalRef, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngxs/store';
import { combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-product-properties',
  imports: [
    GameStatsComponent,
    ReactiveFormsModule,
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
  @ViewChild('sellersModal', { static: true }) sellersModalRef!: TemplateRef<unknown>;

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
        const sales = new Set(ownership.flatMap((item) => item.wts_ids ?? []));
        return (properties?.releases ?? []).map((release) => ({
          ...release,
          owned: have.has(release.release_id),
          wished: wish.has(release.release_id),
          forSale: sales.has(release.release_id),
        }));
      }),
    );
  }

  readonly isAdmin$ = combineLatest([
    inject(UserBadgesService).admins$,
    inject(Store).select(AuthState.login),
  ]).pipe(map(([admins, login]) => !!login && admins.includes(login)));

  readonly failure$: Observable<{ failed: boolean; notFound: boolean }>;

  public platformId$!: Observable<number>;
  public similarGames$!: Observable<ISimilarGame[]>;

  public sortedReleases$!: Observable<{ highlighted: IReleaseItem[]; others: IReleaseItem[] }>;

  public ngOnInit(): void {
    this.platformId$ = this.params.paramMap.pipe(map((params) => Number(params.get('platform') ?? 0)));
    this.similarGames$ = combineLatest([this.productProperties$, this.platformId$]).pipe(
      map(([properties, platformId]) =>
        (properties?.similar_games ?? []).filter(
          (game) => !platformId || game.platform_ids.includes(platformId),
        ),
      ),
    );
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

  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('saleModal', { static: true }) saleModal!: TemplateRef<unknown>;
  readonly salePrice = new FormControl<number | null>(null, { validators: [priceValidator] });
  readonly saleCib = new FormControl(false, { nonNullable: true });
  sellingRelease: IReleaseItem | null = null;

  toggleSale(release: IReleaseItem): void {
    if (this.store.selectSnapshot(CollectionState.collectionChanging)) return;
    const ownership = this.store.selectSnapshot(OwnershipState.ownership);
    if (!ownership.some((item) => item.have_ids.includes(release.release_id))) return;
    if (ownership.some((item) => (item.wts_ids ?? []).includes(release.release_id))) {
      this.store.dispatch(new CollectionActions.RemoveWtsRequest({ release_id: release.release_id }));
      return;
    }
    this.sellingRelease = release;
    this.salePrice.reset(null);
    this.saleCib.reset(false);
    this.modalService.open(this.saleModal, { centered: true, ariaLabelledBy: 'product-sale-title' });
  }

  saveSale(): void {
    if (
      !this.sellingRelease ||
      this.salePrice.invalid ||
      this.store.selectSnapshot(CollectionState.collectionChanging)
    )
      return;
    this.store
      .dispatch(
        new CollectionActions.AddWtsRequest({
          release_id: this.sellingRelease.release_id,
          price: this.salePrice.value,
          cib: this.saleCib.value,
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.store.selectSnapshot(CollectionState.changeStatus) === RequestStatus.Load)
          this.modalService.dismissAll();
      });
  }

  public openSellersModal(release: IReleaseItem) {
    this.selectedRelease = release;
    this.modalService.open(this.sellersModalRef, { centered: true });
  }

  public startChatWith(user: string) {
    this.modalService.dismissAll();
    this.store.dispatch(new ChatActions.SetRecepient(user));
    this.store.dispatch(new ChatActions.RequestMessages(user));
    this.store.dispatch(new ChatActions.ToggleChatVisibility());
  }

  canSuggestSerial(release: IReleaseItem) {
    return supportsReleaseActions(release.platform_id);
  }
  suggestSerial(release: IReleaseItem, direct = false) {
    if (!this.canSuggestSerial(release) || !this.store.selectSnapshot(AuthState.isAuthorised)) return;
    const dialog: NgbModalRef = this.modalService.open(SerialRequestComponent, {
      centered: true,
      size: 'lg',
      ariaLabelledBy: 'serial-request-title',
      beforeDismiss: (): boolean => !dialog.componentInstance.busy,
    });
    dialog.componentInstance.direct = direct;
    dialog.componentInstance.productId =
      this.store.selectSnapshot(ProductsState.productProperties)?.product.id || 0;
    dialog.componentInstance.release = release;
    dialog.componentInstance.productName =
      this.store.selectSnapshot(ProductsState.productProperties)?.product.name || '';
  }

  suggestName(direct = false) {
    if (!this.store.selectSnapshot(AuthState.isAuthorised)) return;
    const product = this.store.selectSnapshot(ProductsState.productProperties)?.product;
    if (!product) return;
    const dialog: NgbModalRef = this.modalService.open(SerialRequestComponent, {
      centered: true,
      size: 'lg',
      ariaLabelledBy: 'serial-request-title',
      beforeDismiss: (): boolean => !dialog.componentInstance.busy,
    });
    dialog.componentInstance.direct = direct;
    dialog.componentInstance.kind = 'alternative_name';
    dialog.componentInstance.productId = product.id;
    dialog.componentInstance.productName = product.name;
    dialog.componentInstance.existingNames = product.alternative_names ?? [];
  }

  serialPreview(release: IReleaseItem): string {
    return (release.serial ?? []).slice(0, 3).join(' · ') + ((release.serial?.length ?? 0) > 3 ? ' · …' : '');
  }

  similarLink(game: ISimilarGame, selectedPlatform: number): (string | number | { platform: number })[] {
    const platform = game.platform_ids.includes(selectedPlatform)
      ? selectedPlatform
      : game.platform_ids.find(supportsReleaseActions);
    return platform ? ['/products', game.id, { platform }] : ['/products', game.id];
  }

  scrollSimilar(track: HTMLElement, direction: number): void {
    track.scrollBy({
      left: direction * track.clientWidth * 0.8,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  }

  public goBack() {
    this.location.back();
  }
}
