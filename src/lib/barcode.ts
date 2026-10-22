'use client';

import type { IScannerControls } from '@zxing/browser';

// The Shape Detection API isn't in TypeScript's DOM lib yet.
interface NativeDetector {
  detect(source: CanvasImageSource | ImageBitmap): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => NativeDetector;
  }
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];

/**
 * The browser's built-in detector exists on Android and macOS Chrome, but not
 * on Windows Chrome, Firefox or iOS Safari — there we fall back to ZXing.
 */
function nativeDetector(): NativeDetector | null {
  if (typeof window === 'undefined' || !window.BarcodeDetector) return null;
  try {
    return new window.BarcodeDetector({ formats: FORMATS });
  } catch {
    return null;
  }
}

async function zxingReader() {
  const { BrowserMultiFormatReader } = await import('@zxing/browser');
  return new BrowserMultiFormatReader();
}

/**
 * True for a well-formed EAN-8/UPC-A/EAN-13/GTIN-14 (check digit included).
 * Used to reject barcodes the AI misread from a photo.
 */
export function isValidGtin(code: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(code)) return false;
  const digits = [...code].map(Number);
  const check = digits.pop()!;
  const sum = digits.reverse().reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}

/** Reads a barcode from a photo. Resolves to null when none is found. */
export async function decodeBarcodeFromImage(file: Blob): Promise<string | null> {
  const native = nativeDetector();
  if (native) {
    try {
      const codes = await native.detect(await createImageBitmap(file));
      if (codes[0]?.rawValue) return codes[0].rawValue;
    } catch {
      // Fall through to ZXing.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const result = await (await zxingReader()).decodeFromImageUrl(url);
    return result.getText();
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Streams the camera into `video` and calls `onCode` once with the first
 * barcode seen. Returns a function that stops the camera.
 */
export async function scanFromCamera(video: HTMLVideoElement, onCode: (code: string) => void): Promise<() => void> {
  const constraints: MediaStreamConstraints = { video: { facingMode: { ideal: 'environment' } }, audio: false };
  const native = nativeDetector();

  if (native) {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    await video.play();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (stopped) return;
      try {
        const codes = await native.detect(video);
        if (codes[0]?.rawValue) {
          stopped = true;
          onCode(codes[0].rawValue);
          return;
        }
      } catch {
        // Frame not ready yet.
      }
      timer = setTimeout(tick, 250);
    };
    void tick();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
    };
  }

  const reader = await zxingReader();
  let done = false;
  const controls: IScannerControls = await reader.decodeFromConstraints(constraints, video, (result) => {
    if (result && !done) {
      done = true;
      onCode(result.getText());
    }
  });
  return () => controls.stop();
}
