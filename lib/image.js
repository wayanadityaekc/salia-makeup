// Shrink an image in the browser before uploading. Phone photos are often
// 3–10 MB; resizing to ~1600px and re-encoding as JPEG cuts that to a few
// hundred KB, so the upload (Bali → Railway US → Cloudinary) is much faster.
// The server + Cloudinary also cap size, but that only helps AFTER the bytes
// arrive — this cuts the bytes in flight.
//
// Falls back to the original file on anything it can't handle (e.g. HEIC that
// the browser can't decode), so an upload never breaks because of compression.
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
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file; // no gain → keep original
    const name = (file.name || "photo").replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
