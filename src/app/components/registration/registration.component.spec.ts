import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';

import { RegistrationComponent } from './registration.component';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
      imports: [RegistrationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('enforces the server password and login bounds before submitting', () => {
    component.form.setValue({ user_login: 'collector', password: '1234567', passwordAgain: '1234567' });
    expect(component.form.invalid).toBe(true);
    component.form.patchValue({ password: '12345678', passwordAgain: '12345678' });
    expect(component.form.valid).toBe(true);
    component.form.patchValue({ user_login: 'a'.repeat(65) });
    expect(component.form.invalid).toBe(true);
    component.form.patchValue({
      user_login: 'collector',
      password: 'a'.repeat(129),
      passwordAgain: 'a'.repeat(129),
    });
    expect(component.form.invalid).toBe(true);
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
