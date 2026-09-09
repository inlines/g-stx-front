import { ValidatorFn, Validators } from '@angular/forms';

// Prices are whole, non-negative values stored as PostgreSQL INTEGER.
// Whether a price is required is decided by the form.
export const priceValidator: ValidatorFn = Validators.compose([
  Validators.min(0),
  Validators.max(2147483647),
  Validators.pattern(/^\d+$/),
])!;
