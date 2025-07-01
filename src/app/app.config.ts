import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideStore } from '@ngxs/store';
import { ProductsState } from '@app/states/products/states/products.state';
import { environment } from '@app/environments/environment';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';
import { RegistrationState } from '@app/states/registration/states/registration.state';
import { AuthState } from '@app/states/auth/states/auth.state';
import { authInterceptor } from '@app/interceptors/auth.interceptor';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { CollectionState } from './states/collection/states/collection.state';
import { OwnershipState } from './states/ownership/states/ownership.state';
import { PlatformState } from './states/platforms/states/platforms.state';
import { ChatState } from './states/chat/states/chat.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor
      ])
    ),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore(
      [
        ProductsState,
        RegistrationState,
        AuthState,
        CollectionState,
        OwnershipState,
        PlatformState,
        ChatState,
      ],
      withNgxsStoragePlugin({
        keys: ['Auth', 'Ownership', 'Products']
      })
    ),
    ProductPropertiesResolver,
    {
      provide: 'environment',
      useValue: environment,
    },
  ],
};


