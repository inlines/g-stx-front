import { OnboardingService } from './services/onboarding.service';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ChatComponent } from './components/chat/chat.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthState } from './states/auth/states/auth.state';
import { ChatState } from './states/chat/states/chat.state';
import { PlatformsActions } from './states/platforms/states/platforms-actions';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    ToastContainerComponent,
    FooterComponent,
    ChatComponent,
    AsyncPipe,
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'game-stockx';

  public isChatVisible$!: Observable<boolean>;
  public isAuthorized$!: Observable<boolean>;

  constructor(private store: Store, private onboarding: OnboardingService) {}

  public ngOnInit(): void {
    this.onboarding.start();
    this.store.dispatch(new PlatformsActions.LoadPlaformsRequest());
    this.isChatVisible$ = this.store.select(ChatState.visible);
    this.isAuthorized$ = this.store.select(AuthState.isAuthorised);
  }
}
