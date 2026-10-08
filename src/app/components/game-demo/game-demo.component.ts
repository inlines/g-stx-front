import { LoadingPanelComponent } from '../loading-panel/loading-panel.component';
import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, TemplateRef, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngxs/store';
import { filter } from 'rxjs';
import { PageSwipeDirective } from '@app/directives/page-swipe.directive';
import { ProductsActions } from '@app/states/products/states/products.actions';
import { ProductsState } from '@app/states/products/states/products.state';
import { ProductPropertiesComponent } from '../product-properties/product-properties.component';

export interface DemoItem { id?: number; product_id?: number; platform_id?: number; release_id?: number; }

@Component({
  selector: 'app-game-demo',
  imports: [LoadingPanelComponent, AsyncPipe, PageSwipeDirective, ProductPropertiesComponent],
  templateUrl: './game-demo.component.html',
  styleUrl: './game-demo.component.scss',
})
export class GameDemoComponent implements OnChanges {
  @Input() items: readonly DemoItem[] | null = [];
  @Input() platform: number | null | undefined;
  @Input() offset = 0;
  @Input() limit = 1;
  @Input() total = 0;
  @Input() busy = false;
  @Input() failed = false;
  @Output() pageChange = new EventEmitter<number>();
  @Output() activeChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @ViewChild('dialog', {static: true}) dialog!: TemplateRef<unknown>;
  @ViewChild('content') content?: ElementRef<HTMLElement>;
  private readonly modals = inject(NgbModal);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private ref?: NgbModalRef;
  readonly failure$ = this.store.select(ProductsState.propertiesFailure);
  active = false;
  index = 0;
  shownOffset = 0;
  shownItems: readonly DemoItem[] = [];
  pending: {offset: number; direction: number} | null = null;
  pageError = false;
  detailBusy = false;
  get current() { return this.shownItems[this.index]; }
  get currentId() { return this.current?.product_id ?? this.current?.id; }
  get currentPlatform() { return this.current?.platform_id ?? this.platform ?? 0; }
  get pageNumber() { return Math.floor(this.shownOffset / this.limit) + 1; }
  get position() { return this.shownOffset + this.index + 1; }
  get blocked() { return this.busy || !!this.pending || this.detailBusy; }

  constructor() {
    inject(Router).events.pipe(filter(event => event instanceof NavigationStart), takeUntilDestroyed()).subscribe(() => this.close());
    this.destroyRef.onDestroy(() => this.ref?.dismiss());
  }
  ngOnChanges(): void {
    if (!this.active || this.busy) return;
    if (this.failed) {
      this.pageError = true;
      this.pending = null;
      return;
    }
    if (this.pending && this.offset !== this.pending.offset) return;
    if (this.pending || this.offset !== this.shownOffset) {
      const direction = this.pending?.direction ?? 1;
      this.shownItems = this.items ?? [];
      this.shownOffset = this.offset;
      this.index = direction < 0 ? Math.max(0, this.shownItems.length - 1) : 0;
      this.pending = null;
      this.pageError = false;
      this.load();
    }
  }
  open(): void {
    if (this.active || this.busy || this.failed || !this.items?.length) return;
    this.index = 0;
    this.shownOffset = this.offset;
    this.shownItems = this.items;
    this.pageError = false;
    this.pending = null;
    this.active = true;
    this.activeChange.emit(true);
    const ref = this.modals.open(this.dialog, {fullscreen: true, ariaLabelledBy: 'game-demo-title', windowClass: 'game-demo-window'});
    this.ref = ref;
    ref.hidden.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.ref = undefined;
      this.active = false;
      this.pending = null;
      this.activeChange.emit(false);
      this.closed.emit();
    });
    this.load(false);
  }
  close(): void { this.ref?.close(); }
  move(direction: number): void {
    if (!this.active || this.blocked) return;
    const index = this.index + direction;
    if (index >= 0 && index < this.shownItems.length) {
      this.index = index;
      this.pageError = false;
      this.load();
      return;
    }
    const offset = this.shownOffset + direction * this.limit;
    if (offset < 0 || offset >= this.total) return;
    this.pending = {offset, direction};
    this.pageError = false;
    this.pageChange.emit(Math.floor(offset / this.limit) + 1);
  }
  load(retainPrevious = true): void {
    if (this.currentId == null) return;
    if (this.content) this.content.nativeElement.scrollTop = 0;
    this.detailBusy = true;
    this.store.dispatch(new ProductsActions.LoadProperties(this.currentId, retainPrevious))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({next: () => { this.detailBusy = false; }, error: () => { this.detailBusy = false; }});
  }
  @HostListener('document:keydown', ['$event'])
  key(event: KeyboardEvent): void {
    if (!this.active || event.repeat || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target instanceof Element ? event.target : null;
    // Nested dialogs, forms and screenshot carousels own their keyboard controls.
    const top = Array.from(document.querySelectorAll('.modal.show')).at(-1);
    if (!top?.classList.contains('game-demo-window') || target?.closest('input,textarea,select,[contenteditable],ngb-carousel')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      this.move(event.key === 'ArrowRight' ? 1 : -1);
    }
  }
}
