import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { ToastContainerComponent } from './toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'game-stockx';
}
