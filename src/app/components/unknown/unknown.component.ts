import { Component } from '@angular/core';
import { ProductListComponent } from '../product-list/product-list.component';

@Component({
  selector: 'app-unknown',
  imports: [ProductListComponent],
  template: `<header class="container py-3"><h1>Unknown</h1><p>Игры без серийников на выбранной платформе. Помогите их идентифицировать.</p></header><app-product-list [unknown]="true"/>`,
})
export class UnknownComponent {}
