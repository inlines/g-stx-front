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
  serial: ['OLD-123'],
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
    expect(release.serial).toEqual(['OLD-123']);
    fixture.destroy();
  });
  it('prevents known duplicates and keeps server errors in the modal', () => {
    const { fixture, component, http } = setup();
    component.photo = new Blob(['jpeg']);
    component.readable = true;
    component.serial = 'old-123';
    component.submit();
    http.expectNone((r) => r.method === 'POST');
    expect(component.error).toContain('уже указан');
    component.serial = 'NEW-123';
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
