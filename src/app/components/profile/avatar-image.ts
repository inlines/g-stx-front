export function cropSquare(width: number, height: number, zoom: number, x: number, y: number) {
  const size = Math.min(width, height) / Math.max(1, zoom);
  const clamp = (value: number) => Math.max(0, Math.min(100, value)) / 100;
  return { x: (width - size) * clamp(x), y: (height - size) * clamp(y), size };
}

export async function pixelAvatar(
  image: HTMLImageElement,
  zoom: number,
  x: number,
  y: number,
  pixels: number,
): Promise<Blob> {
  const crop = cropSquare(image.naturalWidth, image.naturalHeight, zoom, x, y);
  const small = document.createElement('canvas');
  small.width = small.height = pixels;
  const context = small.getContext('2d');
  if (!context) throw new Error('Обработка изображения недоступна в этом браузере');
  context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, pixels, pixels);
  const output = document.createElement('canvas');
  output.width = output.height = 64;
  const result = output.getContext('2d')!;
  result.imageSmoothingEnabled = false;
  result.drawImage(small, 0, 0, 64, 64);
  return new Promise((resolve, reject) =>
    output.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Не удалось создать PNG'))),
      'image/png',
    ),
  );
}
