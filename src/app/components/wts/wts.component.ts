import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PersonalListController } from '@app/shared/personal-list.controller';

@Component({
  selector: 'app-wts',
  providers: [PersonalListController],
  templateUrl: './wts.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './wts.component.scss',
})
export class WtsComponent {
  readonly list = inject(PersonalListController);
  constructor() {
    this.list.connect('wts');
  }
}
