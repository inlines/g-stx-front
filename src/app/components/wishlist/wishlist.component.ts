import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PersonalListController } from '@app/shared/personal-list.controller';
import { CollectionActions } from '@app/states/collection/states/collection-actions';

@Component({
  selector: 'app-wishlist',
  imports: [AsyncPipe, RouterModule],
  providers: [PersonalListController],
  templateUrl: './wishlist.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './wishlist.component.scss',
})
export class WishlistComponent {
  readonly list = inject(PersonalListController);
  readonly collection$;
  readonly platforms$;
  constructor() {
    this.list.connect('wishlist');
    this.collection$ = this.list.items$;
    this.platforms$ = this.list.platforms$;
  }
  get activeCategory() {
    return this.list.activeCategory;
  }
  setActiveCategory(cat: number): void {
    this.list.select(cat);
  }
  remove(release_id: number, event: Event): void {
    event.stopImmediatePropagation();
    this.list.mutate(new CollectionActions.RemoveWishRequest({ release_id }));
  }
}
