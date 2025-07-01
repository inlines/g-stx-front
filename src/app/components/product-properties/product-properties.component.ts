import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AuthState } from '@app/states/auth/states/auth.state';
import { IProductPropertiesResponse } from '@app/states/products/interfaces/product-properties-response.interface';
import { ProductsState } from '@app/states/products/states/products.state';
import { Store } from '@ngxs/store';
import { combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { NgbCarouselModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { ActivatedRoute } from '@angular/router';
import { ChatActions } from '@app/states/chat/states/chat-actions';

@Component({
  selector: 'app-product-properties',
  imports: [AsyncPipe, NgIf, DatePipe, NgFor, NgbCarouselModule, NgClass, NgTemplateOutlet],
  templateUrl: './product-properties.component.html',
  styleUrl: './product-properties.component.scss',
  standalone: true,
})
export class ProductPropertiesComponent implements OnInit {

  @ViewChild('bidsModal', { static: true }) bidsModalRef!: TemplateRef<any>;

  constructor(
    private readonly store: Store,
    private readonly modalService: NgbModal,
    private readonly params: ActivatedRoute,
  ){
    this.productProperties$ = this.store.select(ProductsState.productProperties);
    this.isAuthorised$ = this.store.select(AuthState.isAuthorised);
    this.collectionChanging$ = this.store.select(CollectionState.collectionChanging);
    this.releases$ = this.productProperties$.pipe(
    switchMap(properties => {
      if (!properties) return of([]);
        const releaseStreams = properties.releases.map(release =>
          (
            combineLatest([
              this.store.select(OwnershipState.hasRelease(release.release_id)),
              this.store.select(OwnershipState.hasWish(release.release_id)),
              this.store.select(OwnershipState.hasBid(release.release_id)),
            ])
          ).pipe(
            map(([owned, wished, bided]) => ({
              ...release,
              owned,
              wished,
              bided
            }))
          )
        );

        return releaseStreams.length > 0 ? combineLatest(releaseStreams) : of([]);
      })
    );

  }

  public platformId$!: Observable<number>;

  public sortedReleases$!: Observable<{highlighted:IReleaseItem[]; others:IReleaseItem[]}>;

  public ngOnInit(): void {
    this.platformId$ = of(parseInt(this.params.snapshot.paramMap.get('platform') || '0'));
    this.sortedReleases$ = combineLatest([this.releases$, this.platformId$]).pipe(
      map(([releases, platformId]) => {
        if (!platformId || platformId === 0) {
          return { highlighted: [], others: releases };
        }

        const highlighted = releases.filter(r => r.platform_id === platformId);
        const others = releases.filter(r => r.platform_id !== platformId);

        return { highlighted, others };
      })
    );
  }

  public selectedRelease!: IReleaseItem;

  public productProperties$: Observable<IProductPropertiesResponse | null>;

  public collectionChanging$: Observable<boolean>;

  public isAuthorised$: Observable<boolean>;

  public releases$: Observable<IReleaseItem[]>;

  public addToCollection(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddToCollectionRequest({release_id}))
  }

  public addWish(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddWishRequest({release_id}))
  }

  public addBid(release_id: number): void {
    this.store.dispatch(new CollectionActions.AddBidRequest({release_id}))
  }

  public removeBid(release_id: number): void {
    this.store.dispatch(new CollectionActions.RemoveBidRequest({release_id}))
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
}
