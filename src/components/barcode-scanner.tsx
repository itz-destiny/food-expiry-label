'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ImagePlus, ScanBarcode, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { decodeBarcodeFromImage, scanFromCamera } from '@/lib/barcode';

/**
 * Search and Barcode Scanning Module: live camera scanning or scanning from a
 * photo. Works in every modern browser (native detector or ZXing fallback).
 */
export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
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
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage('This browser can’t open the camera here. Scan from a photo instead.');
        return;
      }
      try {
        setMessage('Starting camera…');
        const stopCamera = await scanFromCamera(videoRef.current!, (code) => finish(code));
        if (cancelled) return stopCamera();
        stopRef.current = stopCamera;
        setStreaming(true);
        setMessage('Point the camera at the barcode and hold it steady.');
      } catch (err) {
        const name = (err as { name?: string })?.name;
        setMessage(
          name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow the camera in your browser, or scan from a photo instead.'
            : name === 'NotFoundError'
              ? 'No camera found on this device. Scan from a photo instead.'
              : 'Couldn’t start the camera. Scan from a photo instead.'
        );
      }
    };
    void start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [open, finish, stop]);

  const scanPhoto = async (file: File) => {
    setMessage('Reading the barcode from your photo…');
    const code = await decodeBarcodeFromImage(file);
    if (fileRef.current) fileRef.current.value = '';
    if (code) finish(code);
    else setMessage('No barcode found in that photo. Try a closer, sharper, well-lit shot of just the barcode.');
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
        <ScanBarcode /> <span className="sr-only sm:not-sr-only">Scan barcode</span>
      </Button>

      {/* Portal to <body> so the overlay sits above the fixed header, not inside the animated form. */}
      {typeof document !== 'undefined' &&
        createPortal(
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
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
