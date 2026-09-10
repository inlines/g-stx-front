import { photoDimensions, PHOTO_LIMIT, preparePhoto } from './prepare-photo';

describe('Evidence photo compression', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it('preserves portrait/landscape proportions and never enlarges small photos', () => {
    expect(photoDimensions(4000, 3000)).toEqual({ width: 2000, height: 1500 });
    expect(photoDimensions(3000, 4000)).toEqual({ width: 1500, height: 2000 });
    expect(photoDimensions(800, 600)).toEqual({ width: 800, height: 600 });
  });
  it('tries JPEG quality before shrinking dimensions, revoking the original URL', async () => {
    const revoked = vi.fn();
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL() {
          return 'blob:original';
        }
        static override revokeObjectURL = revoked;
      },
    );
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = 4000;
        naturalHeight = 3000;
        src = '';
        decode() {
          return Promise.resolve();
        }
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      fillStyle: '',
      fillRect() {},
      drawImage() {},
    } as unknown as CanvasRenderingContext2D);
    const attempts: Array<{ width: number; quality: number }> = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      callback,
      type,
      quality,
    ) {
      attempts.push({ width: this.width, quality: quality ?? 0 });
      callback(new Blob([new Uint8Array(attempts.length === 1 ? PHOTO_LIMIT + 1 : 100)], { type }));
    });
    const result = await preparePhoto(new File(['original'], 'photo.jpg', { type: 'image/jpeg' }));
    expect(result.size).toBe(100);
    expect(attempts).toEqual([
      { width: 2000, quality: 0.9 },
      { width: 2000, quality: 0.82 },
    ]);
    expect(revoked).toHaveBeenCalledWith('blob:original');
  });
  it('rejects unsupported input before decoding', async () => {
    await expect(preparePhoto(new File(['svg'], 'bad.svg', { type: 'image/svg+xml' }))).rejects.toThrow(
      'Выберите JPEG',
    );
  });
});
