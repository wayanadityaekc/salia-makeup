// Shrinks images before upload to cut bytes in flight; falls back to the original file (e.g. HEIC) so upload never breaks.
export async function compressImage(file, { maxDim = 1600, quality = 0.82 } = {}) {
  if (!file || !file.type || !file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const largest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, maxDim / largest);
    // Already small enough and modest file size → send as-is.
    if (scale === 1 && file.size < 1_000_000) {
      bitmap.close?.();
      return file;
    }
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    // No gain: keep original
    if (!blob || blob.size >= file.size) return file;
    const name = `${(file.name || "photo").replace(/\.\w+$/, "")}.jpg`;
    return new File([blob], name, { type: "image/jpeg" });
  } catch (e) {
    return file;
  }
}
