export const PHOTO_LIMIT = 700 * 1024;
export function photoDimensions(width: number, height: number, longest = 2000) {
  const scale = Math.min(1, longest / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
// Prefer JPEG quality reduction to shrinking small serial-number lettering.
// Never silently make an unreadably small image just to meet the byte limit.
export async function preparePhoto(file: File): Promise<Blob> {
  if (file.size > 15 * 1024 * 1024) throw new Error('Выберите фотографию до 15 МБ');
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type))
    throw new Error('Выберите JPEG, PNG, WebP или поддерживаемый браузером HEIC');
  const source = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = source;
    await image.decode().catch(() => {
      throw new Error(
        'Не удалось открыть фото. Попробуйте JPEG, PNG или WebP; для HEIC может потребоваться конвертация.',
      );
    });
    const { naturalWidth: width, naturalHeight: height } = image;
    if (Math.min(width, height) < 64 || width * height > 48_000_000)
      throw new Error('Нужно фото от 64 пикселей по каждой стороне и не более 48 Мп');
    const canvas = document.createElement('canvas');
    for (const longest of [2000, 1600, 1280]) {
      const size = photoDimensions(width, height, longest);
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Браузер не смог обработать фото');
      context.imageSmoothingQuality = 'high';
      context.fillStyle = '#fff';
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(image, 0, 0, size.width, size.height);
      for (const quality of [0.9, 0.82, 0.74]) {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/jpeg', quality),
        );
        if (blob?.type === 'image/jpeg' && blob.size <= PHOTO_LIMIT) return blob;
      }
    }
    throw new Error(
      'Не удалось сжать фото без сильной потери качества. Снимите серийник крупнее, без лишнего фона.',
    );
  } finally {
    URL.revokeObjectURL(source);
  }
}
