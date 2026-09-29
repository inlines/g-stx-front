import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { AuthenticatedAvatarDirective } from './authenticated-avatar.directive';
import { authInterceptor } from '@app/interceptors/auth.interceptor';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
@Component({imports:[AuthenticatedAvatarDirective],template:'<img [authenticatedAvatar]="url" />'})
class Host { url='/api/avatars/alice'; }
describe('Authenticated avatar loading',()=>{
 it('sends Bearer, uses a blob URL and releases it on destroy',()=>{
  TestBed.configureTestingModule({imports:[Host],providers:[...TEST_PROVIDERS,provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
  const store=TestBed.inject(Store);store.reset({...store.snapshot(),Auth:{...store.snapshot().Auth,token:'session'}});
  const create=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:avatar');
  const revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
  const fixture=TestBed.createComponent(Host);fixture.detectChanges();
  const http=TestBed.inject(HttpTestingController);const req=http.expectOne('/api/avatars/alice');
  expect(req.request.headers.get('Authorization')).toBe('Bearer session');
  req.flush(new Blob(['image'],{type:'image/png'}));
  expect(create).toHaveBeenCalled();expect(fixture.nativeElement.querySelector('img').src).toBe('blob:avatar');
  fixture.destroy();expect(revoke).toHaveBeenCalledWith('blob:avatar');http.verify();
 });
});
