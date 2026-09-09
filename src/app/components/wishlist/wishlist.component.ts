import { Component } from '@angular/core';
import { PersonalLibraryComponent } from '../personal-library/personal-library.component';
@Component({
  selector: 'app-wishlist',
  imports: [PersonalLibraryComponent],
  templateUrl: './wishlist.component.html',
})
export class WishlistComponent {}
