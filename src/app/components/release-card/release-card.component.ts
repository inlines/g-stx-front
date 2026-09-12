import { SerialListComponent } from '../serial-list/serial-list.component';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ICollectionItem } from '@app/states/collection/interfaces/collection-item.interface';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-release-card',
  imports: [SerialListComponent, CurrencyPipe, DatePipe, RouterLink, NgbTooltipModule],
  templateUrl: './release-card.component.html',
  styleUrl: './release-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReleaseCardComponent {
  @Input({ required: true }) item!: ICollectionItem;
  @Input() platform: number | null = null;
  @Input() collection = false;
  @Input() readOnly = false;
  @Input() saleMode = false;
  @Input() forSale = false;
  @Output() editSale = new EventEmitter<ICollectionItem>();
  @Output() toggleSale = new EventEmitter<ICollectionItem>();
  get productLink() {
    return this.platform === null
      ? ['/products', this.item.product_id]
      : ['/products', this.item.product_id, { platform: this.platform }];
  }
  @Input() busy = false;
  @Output() editPrice = new EventEmitter<ICollectionItem>();
  @Output() removeRelease = new EventEmitter<number>();
}
