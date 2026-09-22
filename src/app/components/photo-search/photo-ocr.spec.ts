import { startOcr } from './photo-ocr';
const mocks = vi.hoisted(() => ({ parameters: vi.fn().mockResolvedValue(undefined), create: vi.fn() }));
vi.mock('tesseract.js', () => ({ default: { createWorker: mocks.create, PSM: { SPARSE_TEXT: '11' } } }));
describe('Production OCR module loading', () => {
  it('loads the CommonJS default export used by the production bundle', async () => {
    mocks.create.mockResolvedValue({ setParameters: mocks.parameters });
    await startOcr(() => {});
    expect(mocks.create).toHaveBeenCalledWith(
      'eng',
      1,
      expect.objectContaining({
        workerBlobURL: false,
        workerPath: '/ocr/worker.min.js',
        langPath: '/ocr/lang',
      }),
    );
    expect(mocks.parameters).toHaveBeenCalledWith({ tessedit_pageseg_mode: '11' });
  });
});
