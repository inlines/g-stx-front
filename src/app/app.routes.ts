import { Routes } from '@angular/router';
import { RegistrationComponent } from '@app/registration/registration.component';
import { ProductListComponent } from '@app/product-list/product-list.component';
import { NotFoundComponent } from '@app/not-found/not-found.component';
import { ProductPropertiesComponent } from '@app/product-properties/product-properties.component';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';

export const routes: Routes = [
  {
    path: '',
    //loadComponent: () => ProductListComponent,
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'products',
    loadComponent: () => ProductListComponent
  },
  {
    path: 'products/:id',
    loadComponent: () => ProductPropertiesComponent,
    resolve: {
      message: ProductPropertiesResolver
    }
  },
  {
    path: 'registration',
    loadComponent: () => RegistrationComponent,
  },
  {
    path: '**',
    loadComponent: () => NotFoundComponent
  }
];
