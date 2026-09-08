import { Routes } from '@angular/router';
import { authGuard } from '@app/guards/auth.guard';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';
import { CollectorPropertiesResolver } from './resolvers/collector-properties.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('@app/components/product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('@app/components/product-properties/product-properties.component').then(
        (m) => m.ProductPropertiesComponent,
      ),
    resolve: {
      message: ProductPropertiesResolver,
    },
  },
  {
    path: 'collectors',
    loadComponent: () =>
      import('./components/collectors/collectors.component').then((m) => m.CollectorsComponent),
  },
  {
    path: 'collectors/:id',
    loadComponent: () =>
      import('./components/collector-properties/collector-properties.component').then(
        (m) => m.CollectorPropertiesComponent,
      ),
    resolve: {
      message: CollectorPropertiesResolver,
    },
  },
  {
    path: 'registration',
    loadComponent: () =>
      import('@app/components/registration/registration.component').then((m) => m.RegistrationComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('@app/components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'about',
    loadComponent: () => import('@app/components/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'faq',
    loadComponent: () => import('@app/components/faq/faq.component').then((m) => m.FaqComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'collection',
        loadComponent: () =>
          import('@app/components/collection/collection.component').then((m) => m.CollectionComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('@app/components/wishlist/wishlist.component').then((m) => m.WishlistComponent),
      },
      {
        path: 'wts',
        loadComponent: () => import('./components/wts/wts.component').then((m) => m.WtsComponent),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('@app/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
