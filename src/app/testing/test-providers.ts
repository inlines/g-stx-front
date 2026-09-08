import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ENVIRONMENT } from '@app/environments/environment.token';
import { AuthState } from '@app/states/auth/states/auth.state';
import { ChatState } from '@app/states/chat/states/chat.state';
import { CollectionState } from '@app/states/collection/states/collection.state';
import { CollectorsState } from '@app/states/collectors/states/collectors.state';
import { OwnershipState } from '@app/states/ownership/states/ownership.state';
import { PlatformState } from '@app/states/platforms/states/platforms.state';
import { ProductsState } from '@app/states/products/states/products.state';
import { RegistrationState } from '@app/states/registration/states/registration.state';
import { provideStore } from '@ngxs/store';

export const TEST_PROVIDERS = [
  provideRouter([]),
  provideHttpClient(withXhr()),
  provideHttpClientTesting(),
  provideStore([
    AuthState,
    ProductsState,
    PlatformState,
    OwnershipState,
    CollectionState,
    CollectorsState,
    RegistrationState,
    ChatState,
  ]),
  { provide: ENVIRONMENT, useValue: { apiUrl: '/api', wsUrl: '/ws/' } },
];
