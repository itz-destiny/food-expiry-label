'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, ScanBarcode, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';

// The Shape Detection API isn't in TypeScript's DOM lib yet.
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource | ImageBitmap): Promise<DetectedBarcode[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
  }
}

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'];

function createDetector(): BarcodeDetectorLike | null {
  if (typeof window === 'undefined' || !window.BarcodeDetector) return null;
  try {
    return new window.BarcodeDetector({ formats: FORMATS });
  } catch {
    return null;
  }
}

/**
 * Search and Barcode Scanning Module: live camera scanning where the browser
 * supports BarcodeDetector, scanning from a photo, or typing the digits.
 */
export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  }, []);

  const finish = useCallback(
    (code: string) => {
      stop();
      setOpen(false);
      onDetected(code);
    },
    [onDetected, stop]
  );

  useEffect(() => {
    if (!open) return;
    const detector = createDetector();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const start = async () => {
      if (!detector) {
        setMessage('Live scanning isn’t supported in this browser. Scan from a photo or type the barcode digits instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreaming(true);
        }
        setMessage('Point the camera at the barcode.');
        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) return finish(codes[0].rawValue);
          } catch {
            // Frame not ready yet; try again.
          }
          timer = setTimeout(tick, 250);
        };
        void tick();
      } catch {
        setMessage('Camera access was blocked. Allow the camera, or scan from a photo instead.');
      }
    };
    void start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stop();
    };
  }, [open, finish, stop]);

  const scanPhoto = async (file: File) => {
    const detector = createDetector();
    if (!detector) {
      setMessage('This browser can’t read barcodes from photos. Type the digits under the barcode instead.');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const codes = await detector.detect(bitmap);
      if (codes[0]?.rawValue) finish(codes[0].rawValue);
      else setMessage('No barcode found in that photo. Try a closer, sharper shot.');
    } catch {
      setMessage('Couldn’t read that image.');
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-12 shrink-0 rounded-xl"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
      >
        <ScanBarcode /> <span className="hidden sm:inline">Scan barcode</span>
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              stop();
              setOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Scan a barcode"
              className="w-full max-w-md rounded-3xl border bg-surface p-5"
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <ScanBarcode className="h-5 w-5 text-primary" /> Scan barcode
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close scanner"
                  onClick={() => {
                    stop();
                    setOpen(false);
                  }}
                >
                  <X />
                </Button>
              </div>

              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl border bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
                <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-primary/70" />
                <div
                  className="pointer-events-none absolute inset-x-8 top-8 h-0.5 bg-primary"
                  style={{ animation: 'scan 2.4s ease-in-out infinite', ['--scan-distance' as string]: '180px' }}
                />
                {!streaming && (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <Camera className="h-10 w-10 opacity-40" />
                  </div>
                )}
              </div>

              {message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}

              <div className="mt-4 flex gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && scanPhoto(e.target.files[0])}
                />
                <Button type="button" variant="secondary" className="flex-1 rounded-xl" onClick={() => fileRef.current?.click()}>
                  <ImagePlus /> Scan from photo
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
