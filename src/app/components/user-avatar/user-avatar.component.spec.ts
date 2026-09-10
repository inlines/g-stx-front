import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { UserBadgesService } from '@app/services/user-badges.service';
import { AdminService } from '@app/services/admin.service';
import { UserAvatarComponent } from './user-avatar.component';

describe('Administrator avatar crowns', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [UserAvatarComponent], providers: TEST_PROVIDERS });
    TestBed.overrideProvider(UserBadgesService, { useFactory: () => new UserBadgesService() });
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  function avatar(login: string) {
    const fixture = TestBed.createComponent(UserAvatarComponent);
    fixture.componentRef.setInput('login', login);
    fixture.detectChanges();
    return fixture;
  }
  it('shares one lookup across avatars and crowns only admins, including fallback avatars', () => {
    const admin = avatar('segasanshiro');
    const regular = avatar('collector');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/users/admin-badges').flush(['segasanshiro']);
    admin.detectChanges();
    regular.detectChanges();
    expect(admin.nativeElement.querySelector('svg')?.getAttribute('aria-label')).toBe('Администратор');
    expect(regular.nativeElement.querySelector('svg')).toBeNull();
    admin.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    admin.detectChanges();
    expect(admin.nativeElement.querySelector('span').textContent).toBe('S');
    expect(admin.nativeElement.querySelector('svg')).not.toBeNull();
    admin.componentRef.setInput('login', 'collector');
    admin.detectChanges();
    expect(admin.nativeElement.querySelector('svg')).toBeNull();
    admin.destroy();
    regular.destroy();
  });
  it('updates mounted avatars after promotion and deletion', () => {
    const fixture = avatar('collector');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/users/admin-badges').flush([]);
    TestBed.inject(AdminService).promote(2).subscribe();
    http
      .expectOne('/api/admin/users/2/promote')
      .flush({ id: 2, user_login: 'collector', is_admin: true, created_at: null });
    http.expectOne('/api/users/admin-badges').flush(['collector']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    TestBed.inject(AdminService).delete(2).subscribe();
    http.expectOne('/api/admin/users/2').flush(null);
    http.expectOne('/api/users/admin-badges').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    fixture.destroy();
  });
  it('keeps the avatar working when badges fail and recovers on refresh', () => {
    const fixture = avatar('segasanshiro');
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/users/admin-badges').flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    TestBed.inject(UserBadgesService).refresh();
    http.expectOne('/api/users/admin-badges').flush(['segasanshiro']);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
    fixture.destroy();
  });
});
