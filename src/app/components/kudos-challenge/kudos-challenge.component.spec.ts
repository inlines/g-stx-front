import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { KudosService } from '@app/services/kudos.service';
import { KudosChallengeComponent } from './kudos-challenge.component';
describe('Kudos Challenge', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [KudosChallengeComponent], providers: TEST_PROVIDERS });
    TestBed.overrideProvider(KudosService, { useFactory: () => new KudosService() });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('renders the server ranking, links to collectors and does not request scores per row', () => {
    const fixture = TestBed.createComponent(KudosChallengeComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/kudos/challenge').flush([
      { user_login: 'winner', kudos: 100 },
      { user_login: 'runnerup', kudos: 20 },
    ]);
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('ol a');
    expect(links[0].getAttribute('href')).toBe('/collectors/winner');
    expect(links[1].getAttribute('href')).toBe('/collectors/runnerup');
    expect(links[0].querySelector('app-kudos').getAttribute('aria-label')).toBe('100 Kudos');
    http.expectNone((r) => r.url === '/api/kudos');
    fixture.destroy();
  });
  it('distinguishes an empty ranking from a failure and allows retry', () => {
    const fixture = TestBed.createComponent(KudosChallengeComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/kudos/challenge').flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Не удалось');
    fixture.componentInstance.load();
    http.expectOne('/api/kudos/challenge').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Станьте первым');
    fixture.destroy();
  });
});
