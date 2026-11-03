export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const largest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxDim / largest);
    if (scale === 1 && file.size < 1_000_000) {
      bitmap.close?.();
      return file;
    }
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((result) => canvas.toBlob(result, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    const name = `${(file.name || 'photo').replace(/\.\w+$/, '')}.jpg`;
    return new File([blob], name, { type: 'image/jpeg' });
  } catch (e) {
    return file;
  }
}
