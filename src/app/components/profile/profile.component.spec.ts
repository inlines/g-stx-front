import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { ProfileComponent } from './profile.component';
import { ProfileService } from '@app/services/profile.service';
import { cropSquare } from './avatar-image';

describe('Profile', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProfileComponent], providers: TEST_PROVIDERS });
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
  });
  it('requires matching passwords, sends the old password and keeps errors in the form', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    component.password.setValue({ old: 'previous', next: 'new-password', confirm: 'different' });
    component.changePassword();
    expect(component.passwordError).toContain('не совпадают');
    const http = TestBed.inject(HttpTestingController);
    http.expectNone('/api/profile/password');
    component.password.controls.confirm.setValue('new-password');
    component.changePassword();
    const req = http.expectOne('/api/profile/password');
    expect(req.request.body).toEqual({
      old_password: 'previous',
      new_password: 'new-password',
      confirm_password: 'new-password',
    });
    req.flush({ error: 'Старый пароль неверен' }, { status: 400, statusText: 'Bad request' });
    expect(component.passwordError).toBe('Старый пароль неверен');
    expect(component.passwordBusy).toBe(false);
    component.changePassword();
    http.expectOne('/api/profile/password').flush(null);
    expect(component.password.controls.old.value).toBe('');
    expect(component.passwordSuccess).toBe('Пароль изменён');
    fixture.destroy();
  });
  it('sends only the prepared PNG and refreshes avatars only on successful replacement', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    const service = TestBed.inject(ProfileService);
    const http = TestBed.inject(HttpTestingController);
    component.blob = new Blob(['png'], { type: 'image/png' });
    component.saveAvatar();
    const req = http.expectOne('/api/profile/avatar');
    expect(req.request.body).toBe(component.blob);
    req.flush('Failure', { status: 500, statusText: 'Failure' });
    expect(service.avatarVersion()).toBe(0);
    expect(component.blob).not.toBeNull();
    component.saveAvatar();
    http.expectOne('/api/profile/avatar').flush(null);
    expect(service.avatarVersion()).toBe(1);
    expect(component.avatarSuccess).toBe('Аватар сохранён');
    fixture.destroy();
  });
  it('uses the same file-loading path for gallery selection and dropping a file', () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    const component = fixture.componentInstance;
    const load = vi.spyOn(component, 'loadFile').mockResolvedValue();
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
    component.fileSelected({ target: { files: [file], value: 'photo.jpg' } } as unknown as Event);
    component.drop({ preventDefault() {}, dataTransfer: { files: [file] } } as unknown as DragEvent);
    expect(load).toHaveBeenCalledTimes(2);
    expect(load).toHaveBeenLastCalledWith(file);
    fixture.destroy();
  });
  it.each([
    [1200, 600],
    [600, 1200],
    [600, 600],
  ])('keeps the crop square and within a %s×%s image', (w, h) => {
    for (const zoom of [1, 2, 4])
      for (const x of [0, 50, 100])
        for (const y of [0, 50, 100]) {
          const crop = cropSquare(w, h, zoom, x, y);
          expect(crop.size).toBe(Math.min(w, h) / zoom);
          expect(crop.x).toBeGreaterThanOrEqual(0);
          expect(crop.y).toBeGreaterThanOrEqual(0);
          expect(crop.x + crop.size).toBeLessThanOrEqual(w);
          expect(crop.y + crop.size).toBeLessThanOrEqual(h);
        }
  });
});
