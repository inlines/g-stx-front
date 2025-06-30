import { Routes } from '@angular/router';
import { RegistrationComponent } from '@app/components/registration/registration.component';
import { ProductListComponent } from '@app/components/product-list/product-list.component';
import { NotFoundComponent } from '@app/components/not-found/not-found.component';
import { ProductPropertiesComponent } from '@app/components/product-properties/product-properties.component';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';
import { LoginComponent } from '@app/components/login/login.component';
import { CollectionComponent } from '@app/components/collection/collection.component';
import { WishlistComponent } from '@app/components/wishlist/wishlist.component';
import { AboutComponent } from '@app/components/about/about.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
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
    path: 'login',
    loadComponent: () => LoginComponent,
  },
  {
    path: 'about',
    loadComponent: () => AboutComponent,
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'collection',
        loadComponent: () => CollectionComponent,
      },
      {
        path: 'wishlist',
        loadComponent: () => WishlistComponent,
      },
    ]
  },
  {
    path: '**',
    loadComponent: () => NotFoundComponent
  },
];
