import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { provideStore } from '@ngxs/store';
import { ProductsState } from '@app/states/products/states/products.state';
import { environment } from '@app/environments/environment';
import { ProductPropertiesResolver } from '@app/resolvers/product-properties.resolver';
import { RegistrationState } from '@app/states/registration/states/registration.state';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore(
      [
        ProductsState,
        RegistrationState
      ],
    ),
    ProductPropertiesResolver,
    {
      provide: 'environment',
      useValue: environment,
    },
  ],
};
