import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from '@app/services/toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toast-container',
  imports: [NgbToastModule, NgFor],
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  standalone: true,
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
