import { Component } from '@angular/core';
import { PersonalLibraryComponent } from '../personal-library/personal-library.component';
@Component({
  selector: 'app-collection',
  imports: [PersonalLibraryComponent],
  templateUrl: './collection.component.html',
})
export class CollectionComponent {}
