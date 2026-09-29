import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TEST_PROVIDERS } from '@app/testing/test-providers';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: TEST_PROVIDERS,
      imports: [LoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens at the top after rendering', async () => {
    const scroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const next = TestBed.createComponent(LoginComponent);
    next.detectChanges();
    await next.whenStable();
    expect(scroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
    next.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
