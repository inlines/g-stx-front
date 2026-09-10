import { Injector } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OnboardingComponent } from './onboarding.component';

export function openOnboarding(injector: Injector) {
  return injector.get(NgbModal).open(OnboardingComponent, {
    fullscreen: true,
    ariaLabelledBy: 'onboarding-title',
    windowClass: 'onboarding-window',
    backdrop: 'static',
  });
}
