import { Routes } from '@angular/router';
import { RegistrationComponent } from '@app/registration/registration.component';
import { ProductListComponent } from '@app/product-list/product-list.component';
import { NotFoundComponent } from '@app/not-found/not-found.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => ProductListComponent
  },
  {
    path: 'registration',
    loadComponent: () => RegistrationComponent
  },
  {
    path: '**',
    loadComponent: () => NotFoundComponent
  }
];
