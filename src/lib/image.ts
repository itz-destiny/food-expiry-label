/**
 * Downscales a photo to a JPEG data URI small enough to store inside a
 * Firestore document (documents are capped at 1 MiB).
 */
export async function compressImage(file: File, maxSize = 1100, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let dataUri = canvas.toDataURL('image/jpeg', quality);
  // Step quality down until it comfortably fits.
  for (let q = quality - 0.15; dataUri.length > 700_000 && q > 0.3; q -= 0.15) {
    dataUri = canvas.toDataURL('image/jpeg', q);
  }
  return dataUri;
}
