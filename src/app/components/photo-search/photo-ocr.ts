import type { Worker } from 'tesseract.js';

export async function decodePhoto(file: File): Promise<HTMLImageElement> {
  if (file.size > 20 * 1024 * 1024) throw new Error('Фото слишком большое. Выберите файл до 20 МБ.');
  if (
    !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name) &&
    !/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)
  )
    throw new Error('Выберите JPEG, PNG, WebP или HEIC.');
  let blob: Blob = file;
  if (/\.(heic|heif)$/i.test(file.name) || /heic|heif/.test(file.type)) {
    const { heicTo } = await import('heic-to/csp');
    blob = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.95 });
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    if (
      img.naturalWidth * img.naturalHeight > 48_000_000 ||
      Math.min(img.naturalWidth, img.naturalHeight) < 64
    )
      throw new Error('Нужен снимок от 64 пикселей, не более 48 Мп.');
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function startOcr(progress: (value: number) => void): Promise<Worker> {
  const module = await import('tesseract.js');
  // Angular's production CommonJS wrapper exposes the API on default.
  const { createWorker, PSM } = module.default ?? module;
  const worker = await createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
    workerBlobURL: false,
    logger: (m) => {
      if (m.status === 'recognizing text') progress(m.progress);
    },
  });
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
  return worker;
}
