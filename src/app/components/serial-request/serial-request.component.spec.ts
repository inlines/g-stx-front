import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TEST_PROVIDERS } from '@app/testing/test-providers';
import { SerialRequestComponent } from './serial-request.component';
import { IReleaseItem } from '@app/states/products/interfaces/release-item.interface';

const release: IReleaseItem = {
  release_id: 12,
  platform_id: 48,
  platform_name: 'PS4',
  release_region: 'Europe',
  release_date: null,
  release_status: 0,
  digital_only: false,
  serial: ['CUSA-00123'],
  seller_logins: [],
};
describe('Serial request form', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SerialRequestComponent],
      providers: [...TEST_PROVIDERS, NgbActiveModal],
    });
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL() {
          return 'blob:preview';
        }
        static override revokeObjectURL() {}
      },
    );
  });
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  function setup() {
    const fixture = TestBed.createComponent(SerialRequestComponent);
    fixture.componentRef.setInput('release', release);
    fixture.componentRef.setInput('productName', 'Game');
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance, http: TestBed.inject(HttpTestingController) };
  }
  it.each([false, true])(
    'saves a direct admin contribution without a photo (name=%s) and refreshes the game',
    (isName) => {
      const { fixture, component, http } = setup();
      fixture.componentRef.setInput('direct', true);
      fixture.componentRef.setInput('productId', 7);
      fixture.componentRef.setInput('kind', isName ? 'alternative_name' : 'serial');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('input[type=file]')).toBeNull();
      expect(fixture.nativeElement.querySelector('.readable')).toBeNull();
      component.serial = isName ? '日本語 Alias' : 'cusa-98765';
      component.submit();
      component.submit();
      const request = http.expectOne(
        isName ? '/api/admin/products/7/alternative-names' : '/api/admin/releases/12/serials',
      );
      expect(request.request.body).toEqual(isName ? { name: '日本語 Alias' } : { serial: 'CUSA-98765' });
      request.flush(null, { status: 204, statusText: 'No Content' });
      http
        .expectOne('/api/products/7')
        .flush({
          product: { id: 7, name: 'Game' },
          releases: [],
          screenshots: [],
          companies: [],
          franschises: [],
        });
      expect(component.sent).toBe(true);
      fixture.destroy();
    },
  );
  it('does not fall back to a photo-free user request if admin access is rejected', () => {
    const { fixture, component, http } = setup();
    fixture.componentRef.setInput('direct', true);
    component.serial = 'CUSA-12345';
    component.submit();
    http
      .expectOne('/api/admin/releases/12/serials')
      .flush({ error: 'Только для администратора' }, { status: 403, statusText: 'Forbidden' });
    expect(component.error).toBe('Только для администратора');
    expect(component.sent).toBe(false);
    http.expectNone((req) => req.url.includes('serial-requests'));
    fixture.destroy();
  });
  it('submits a Unicode alternative name with a photo and five-Kudos confirmation, without a release', () => {
    const fixture = TestBed.createComponent(SerialRequestComponent);
    fixture.componentRef.setInput('kind', 'alternative_name');
    fixture.componentRef.setInput('productId', 7);
    fixture.componentRef.setInput('productName', 'Game');
    fixture.componentRef.setInput('existingNames', ['Already known']);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.photo = new Blob(['jpeg'], { type: 'image/jpeg' });
    component.readable = true;
    component.serial = 'already KNOWN';
    component.submit();
    http.expectNone((r) => r.method === 'POST');
    component.serial = '  龍が如く   — Имя  ';
    component.submit();
    component.submit();
    const request = http.expectOne((r) => r.url === '/api/products/7/name-requests');
    expect(request.request.params.get('name')).toBe('龍が如く — Имя');
    expect(request.request.body).toBe(component.photo);
    request.flush({ id: 3, status: 'pending' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('+5 Kudos');
    expect(fixture.nativeElement.textContent).not.toContain('+10 Kudos');
    fixture.destroy();
  });
  it('requires a photo and readability confirmation, then submits only the prepared JPEG', () => {
    const { fixture, component, http } = setup();
    component.serial = '  cusa-12345 ';
    component.submit();
    http.expectNone((r) => r.method === 'POST');
    const photo = new Blob(['compressed'], { type: 'image/jpeg' });
    component.photo = photo;
    component.submit();
    http.expectNone((r) => r.method === 'POST');
    component.readable = true;
    component.submit();
    component.submit();
    const request = http.expectOne((r) => r.url === '/api/releases/12/serial-requests');
    expect(request.request.body).toBe(photo);
    expect(request.request.params.get('serial')).toBe('CUSA-12345');
    expect(request.request.headers.get('Content-Type')).toBe('image/jpeg');
    request.flush({ id: 1, status: 'pending' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Заявка отправлена');
    expect(release.serial).toEqual(['CUSA-00123']);
    fixture.destroy();
  });
  it('prevents known duplicates and keeps server errors in the modal', () => {
    const { fixture, component, http } = setup();
    component.photo = new Blob(['jpeg']);
    component.readable = true;
    component.serial = 'cusa00123';
    component.submit();
    http.expectNone((r) => r.method === 'POST');
    expect(component.error).toContain('уже указан');
    component.serial = 'CUSA-00124';
    component.submit();
    http
      .expectOne((r) => r.url.endsWith('/serial-requests'))
      .flush({ error: 'Уже ожидает рассмотрения' }, { status: 409, statusText: 'Conflict' });
    expect(component.error).toBe('Уже ожидает рассмотрения');
    expect(component.busy).toBe(false);
    expect(component.sent).toBe(false);
    fixture.destroy();
  });
  it('processes gallery selection and ignores a stale photo result after replacement', async () => {
    const { fixture, component } = setup();
    let finishFirst!: () => void;
    let images = 0;
    const second = new Blob(['second'], { type: 'image/jpeg' });
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 100;
        naturalHeight = 100;
        src = '';
        decode() {
          return ++images === 1 ? new Promise<void>((resolve) => (finishFirst = resolve)) : Promise.resolve();
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect() {},
      drawImage() {},
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementationOnce((callback) => callback(second))
      .mockImplementation((callback) => callback(new Blob(['old'], { type: 'image/jpeg' })));
    const firstFile = new File(['original'], 'one.jpg', { type: 'image/jpeg' });
    const pending = component.load(firstFile);
    await component.choose({
      target: { files: [new File(['new'], 'two.jpg', { type: 'image/jpeg' })], value: 'photo' },
    } as unknown as Event);
    finishFirst();
    await pending;
    expect(component.photo).toBe(second);
    expect(component.readable).toBe(false);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type=file]');
    expect(input.accept).toContain('image/jpeg');
    expect(input.hasAttribute('capture')).toBe(false);
    expect(fixture.nativeElement.querySelector('.preview-link').getAttribute('target')).toBe('_blank');
    fixture.destroy();
  });
});
