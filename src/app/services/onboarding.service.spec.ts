import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TestBed } from '@angular/core/testing';
import { Actions, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { AuthActions } from '@app/states/auth/states/auth-actions';
import { AuthState } from '@app/states/auth/states/auth.state';
import { OnboardingService } from './onboarding.service';

const mocks = { open: vi.fn() };

describe('First five successful logins onboarding', () => {
  let actions: Subject<unknown>, login: string, token: string;
  const emit = (action: unknown) => actions.next({ action, status: 'SUCCESSFUL' });
  const success = () => emit(new AuthActions.LoginRequestSuccess({ token }));
  beforeEach(() => {
    localStorage.clear();
    login = 'alice';
    token = 'token';
    actions = new Subject();
    mocks.open.mockReset();
    mocks.open.mockImplementation(() => ({ close: vi.fn(), result: new Promise(() => {}) }));
    TestBed.configureTestingModule({
      providers: [
        { provide: Actions, useValue: actions },
        { provide: NgbModal, useValue: mocks },
        {
          provide: Store,
          useValue: { selectSnapshot: (selector: unknown) => (selector === AuthState.login ? login : token) },
        },
      ],
    });
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it('ignores restoration and failed login, counts five per user, and does not resubscribe', async () => {
    const service = TestBed.inject(OnboardingService);
    service.start();
    service.start();
    emit(new AuthActions.LoginRequestFail());
    expect(mocks.open).not.toHaveBeenCalled();
    for (let i = 1; i <= 5; i++) {
      actions.next({
        action: new AuthActions.LoginRequest({ user_login: login, password: 'demo' }),
        status: 'DISPATCHED',
      });
      success();
      emit(new AuthActions.LoginRequest({ user_login: login, password: 'demo' }));
      await vi.waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(i));
    }
    success();
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(mocks.open).toHaveBeenCalledTimes(5);
    expect(localStorage.getItem('gstx:onboarding:logins:alice')).toBe('6');
    login = 'bob';
    success();
    await vi.waitFor(() => expect(mocks.open).toHaveBeenCalledTimes(6));
  });
  it('respects a persisted limit and cancels a pending import when logging out', async () => {
    localStorage.setItem('gstx:onboarding:logins:alice', '5');
    TestBed.inject(OnboardingService).start();
    success();
    login = 'bob';
    success();
    token = '';
    actions.next({ action: new AuthActions.Logout(), status: 'DISPATCHED' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(mocks.open).not.toHaveBeenCalled();
  });
  it('survives unavailable storage and malformed counts', () => {
    const service = TestBed.inject(OnboardingService);
    localStorage.setItem('gstx:onboarding:logins:alice', 'oops');
    expect(service['recordLogin']('alice')).toBe(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('blocked');
    });
    for (let i = 2; i <= 5; i++) expect(service['recordLogin']('alice')).toBe(true);
    expect(service['recordLogin']('alice')).toBe(false);
  });
});
