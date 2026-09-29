import { adminGuard } from '@app/guards/admin.guard';
import { Routes } from '@angular/router';
import { authGuard } from '@app/guards/auth.guard';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';
import { CollectorPropertiesResolver } from './resolvers/collector-properties.resolver';

export const routes: Routes = [
  { path: 'release-calendar', canActivate: [authGuard], loadComponent: () => import('./components/release-calendar/release-calendar.component').then(m => m.ReleaseCalendarComponent) },
  { path: 'photo-search', canActivate: [authGuard], loadComponent: () => import('./components/photo-search/photo-search.component').then(m => m.PhotoSearchComponent) },
  { path: 'unknown', canActivate: [authGuard, adminGuard], loadComponent: () => import('./components/unknown/unknown.component').then(m => m.UnknownComponent) },
  {
    path: 'kudos-challenge', canActivate: [authGuard],
    loadComponent: () =>
      import('./components/kudos-challenge/kudos-challenge.component').then((m) => m.KudosChallengeComponent),
  },
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
    path: 'companies/:id', canActivate: [authGuard],
    data: { catalogKind: 'company' },
    loadComponent: () =>
      import('./components/catalog-group/catalog-group.component').then((m) => m.CatalogGroupComponent),
  },
  {
    path: 'franchises/:id', canActivate: [authGuard],
    loadComponent: () =>
      import('./components/catalog-group/catalog-group.component').then((m) => m.CatalogGroupComponent),
  },
  {
    path: 'products/:id', canActivate: [authGuard],
    loadComponent: () =>
      import('@app/components/product-properties/product-properties.component').then(
        (m) => m.ProductPropertiesComponent,
      ),
    resolve: {
      message: ProductPropertiesResolver,
    },
  },
  {
    path: 'collectors', canActivate: [authGuard],
    loadComponent: () =>
      import('./components/collectors/collectors.component').then((m) => m.CollectorsComponent),
  },
  {
    path: 'collectors/:id', canActivate: [authGuard],
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
    path: 'about', canActivate: [authGuard],
    loadComponent: () => import('@app/components/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: 'faq', canActivate: [authGuard],
    loadComponent: () => import('@app/components/faq/faq.component').then((m) => m.FaqComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then((m) => m.ProfileComponent),
      },
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
    path: '**', canActivate: [authGuard],
    loadComponent: () =>
      import('@app/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
