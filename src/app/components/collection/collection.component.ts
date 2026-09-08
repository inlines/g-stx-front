import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CollectionSort, filterCollection } from '@app/shared/collection-filter';
import { PersonalListController } from '@app/shared/personal-list.controller';
import { CollectionActions } from '@app/states/collection/states/collection-actions';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';

@Component({
  selector: 'app-collection',
  imports: [AsyncPipe, RouterModule, ReactiveFormsModule, DatePipe, NgbDropdownModule, CurrencyPipe],
  providers: [PersonalListController],
  templateUrl: './collection.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './collection.component.scss',
})
export class CollectionComponent {
  readonly list = inject(PersonalListController);
  private readonly modalService = inject(NgbModal);
  @ViewChild('priceModal', { static: true }) priceModalRef!: TemplateRef<unknown>;

  readonly queryForm = new FormGroup({ query: new FormControl('', { nonNullable: true }) });
  readonly priceControl = new FormControl(0, {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.min(0),
      Validators.max(2147483647),
    ],
  });
  readonly sortBy$ = new BehaviorSubject<CollectionSort>('name');
  readonly collection$;
  readonly displayCategories$;
  readonly filteredCollection$;
  setPriceProductName: string | null = null;
  private setPriceReleaseId: number | null = null;

  constructor() {
    this.list.connect('collection');
    this.collection$ = this.list.items$;
    this.displayCategories$ = this.list.platforms$;
    this.filteredCollection$ = combineLatest([
      this.collection$,
      this.queryForm.controls.query.valueChanges.pipe(startWith('')),
      this.sortBy$,
    ]).pipe(map(([items, query, sort]) => filterCollection(items, query, sort)));
  }

  get activeCategory() {
    return this.list.activeCategory;
  }
  get activeCategoryTotalSpent() {
    return this.list.totalSpent;
  }
  setActiveCategory(cat: number): void {
    this.list.select(cat);
  }
  setSort(sort: CollectionSort): void {
    this.sortBy$.next(sort);
  }

  remove(release_id: number, event: Event): void {
    event.stopImmediatePropagation();
    this.list.mutate(new CollectionActions.RemoveFromCollectionRequest({ release_id }));
  }

  setPrice(release_id: number, name: string, event: Event): void {
    event.stopImmediatePropagation();
    this.priceControl.setValue(0);
    this.setPriceProductName = name;
    this.setPriceReleaseId = release_id;
    this.modalService.open(this.priceModalRef, { centered: true });
  }

  sendPrice(): void {
    if (this.setPriceReleaseId == null || this.priceControl.invalid) return;
    this.list.mutate(
      new CollectionActions.SetPriceRequest({
        release_id: this.setPriceReleaseId,
        price: Number(this.priceControl.value),
      }),
      () => this.modalService.dismissAll(),
    );
  }
}
