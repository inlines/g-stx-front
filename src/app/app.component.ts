import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { FooterComponent } from './components/footer/footer.component';
import { Store } from '@ngxs/store';
import { PlatformsActions } from './states/platforms/states/platforms-actions';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, ToastContainerComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'game-stockx';

  constructor(private store: Store) {}

  public ngOnInit(): void {
    this.store.dispatch(new PlatformsActions.LoadPlaformsRequest());
  }
}
