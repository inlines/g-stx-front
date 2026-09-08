import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '@app/environments/environment';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { authInterceptor } from '@app/interceptors/auth.interceptor';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ProductsState } from '@app/states/products/states/products.state';
import { RegistrationState } from '@app/states/registration/states/registration.state';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { provideStore } from '@ngxs/store';
import { routes } from './app.routes';
import { ChatState } from './states/chat/states/chat.state';
import { CollectionState } from './states/collection/states/collection.state';
import { CollectorsState } from './states/collectors/states/collectors.state';
import { OwnershipState } from './states/ownership/states/ownership.state';
import { PlatformState } from './states/platforms/states/platforms.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),
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
        CollectorsState,
      ],
      withNgxsStoragePlugin({
        keys: ['Auth', 'Ownership', 'Products'],
      }),
    ),
    ProductPropertiesResolver,
    {
      provide: ENVIRONMENT,
      useValue: environment,
    },
  ],
};
