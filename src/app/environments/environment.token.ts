import { InjectionToken } from '@angular/core';
import { IEnvironment } from './environment.interface';

export const ENVIRONMENT = new InjectionToken<IEnvironment>('environment');
