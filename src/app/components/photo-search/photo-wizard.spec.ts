import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { of } from 'rxjs';
import { PHOTO_PROCESSOR, PhotoSearchComponent } from './photo-search.component';
import { ProductsService } from '@app/states/products/services/products.service';
const decodePhoto = vi.fn();
const startOcr = vi.fn();

describe('Photo wizard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: PHOTO_PROCESSOR, useValue: { decodePhoto, startOcr } },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
        { provide: Store, useValue: { dispatch: () => of(undefined) } },
        { provide: ProductsService, useValue: {} },
      ],
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save() {},
      translate() {},
      rotate() {},
      drawImage() {},
      restore() {},
      strokeRect() {},
    } as any);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });
  it('opens upload immediately without reading or updating tutorial visits', () => {
    const read=vi.spyOn(Storage.prototype,'getItem');
    const write=vi.spyOn(Storage.prototype,'setItem');
    const fixture=TestBed.createComponent(PhotoSearchComponent);
    expect(fixture.componentInstance.step()).toBe('upload');
    expect(read).not.toHaveBeenCalled();expect(write).not.toHaveBeenCalled();
    fixture.destroy();
  });
  it('continues working if browser storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('denied');
    });
    const fixture = TestBed.createComponent(PhotoSearchComponent);
    expect(fixture.componentInstance.step()).toBe('upload');
    fixture.destroy();
  });
  it('preserves the image and crop when going back, without retaining a stale crop center after reset', async () => {
    vi.mocked(decodePhoto).mockResolvedValue({ naturalWidth: 800, naturalHeight: 1200 } as HTMLImageElement);
    const fixture = TestBed.createComponent(PhotoSearchComponent),
      c = fixture.componentInstance;
    fixture.detectChanges();
    await c.upload({ target: { files: [new File(['x'], 'test.jpg')], value: 'x' } } as unknown as Event);
    fixture.detectChanges();
    expect(c.step()).toBe('crop');
    vi.spyOn(c.preview!.nativeElement, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 200,
      height: 300,
    } as DOMRect);
    c.selectPoint({ clientX: 100, clientY: 150 } as MouseEvent);
    expect(c.selected()).toBe(true);
    c.next();
    c.back();
    expect(c.step()).toBe('crop');
    expect(c.selected()).toBe(true);
    expect(c.hasPhoto()).toBe(true);
    c.resetCrop();
    c.resizeCrop();
    expect(c.selected()).toBe(false);
    fixture.destroy();
  });
  it('ignores a decoded image after the user has gone back', async () => {
    let resolve!: (image: HTMLImageElement) => void;
    vi.mocked(decodePhoto).mockReturnValue(new Promise((r) => (resolve = r)));
    const fixture = TestBed.createComponent(PhotoSearchComponent),
      c = fixture.componentInstance;
    const upload = c.upload({
      target: { files: [new File(['x'], 'test.jpg')], value: '' },
    } as unknown as Event);
    c.back();
    resolve({ naturalWidth: 800, naturalHeight: 1200 } as HTMLImageElement);
    await upload;
    expect(c.hasPhoto()).toBe(false);
    expect(c.busy()).toBe(false);
    fixture.destroy();
  });
  it('stale OCR cannot replace results after navigating back', async () => {
    vi.mocked(decodePhoto).mockResolvedValue({ naturalWidth: 800, naturalHeight: 1200 } as HTMLImageElement);
    let resolve!: (result: any) => void;
    const worker = { recognize: vi.fn(() => new Promise((r) => (resolve = r))), terminate: vi.fn() };
    vi.mocked(startOcr).mockResolvedValue(worker as any);
    const fixture = TestBed.createComponent(PhotoSearchComponent),
      c = fixture.componentInstance;
    fixture.detectChanges();
    await c.upload({ target: { files: [new File(['x'], 'test.jpg')], value: '' } } as unknown as Event);
    c.next();
    const recognition = c.recognize();
    await Promise.resolve();
    c.back();
    resolve({ data: { text: 'BLES 00072' } });
    await recognition;
    expect(c.step()).toBe('crop');
    expect(c.serial).toBe('');
    expect(c.candidates()).toEqual([]);
    expect(worker.terminate).toHaveBeenCalled();
    fixture.destroy();
  });
});
