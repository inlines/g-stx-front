import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-faq',
  imports: [NgbAccordionModule, RouterLink],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  standalone: true
})
export class FaqComponent {
  isFirstOpen = true;
}
