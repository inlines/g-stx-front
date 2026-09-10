import { ChangeDetectionStrategy, Component, HostListener, Input, inject, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';

export function snowBoxes(items: readonly ICollectionItem[], limit: number) {
  const count = Math.min(items.length, limit);
  return Array.from({ length: count }, (_, i) => {
    const item = items[Math.floor((i * items.length) / count)];
    return {
      id: item.release_id,
      name: item.product_name,
      image: item.image_url,
      left: 4 + ((i * 37) % 82),
      duration: 22 + (i % 5) * 4,
      delay: -(i * 5.7 + 2),
      turn: i % 2 ? 1 : -1,
      size: 66 + (i % 4) * 12,
    };
  });
}

@Component({
  selector: 'app-collection-snow',
  standalone: true,
  templateUrl: './collection-snow.component.html',
  styleUrl: './collection-snow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionSnowComponent {
  readonly modal = inject(NgbActiveModal);
  readonly paused = signal(false);
  readonly hidden = signal(document.hidden);
  boxes: ReturnType<typeof snowBoxes> = [];
  @Input() set items(items: readonly ICollectionItem[]) {
    const mobile = window.matchMedia?.('(max-width: 767px)').matches;
    this.boxes = snowBoxes(items, mobile ? 8 : 16);
  }
  @HostListener('document:visibilitychange') visibilityChanged() {
    this.hidden.set(document.hidden);
  }
}
