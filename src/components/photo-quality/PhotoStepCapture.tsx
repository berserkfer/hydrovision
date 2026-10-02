"use client";

import { useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { extractCenterAverageRgbFromCanvas } from "@/photo-quality/rgb-extraction";
import type { RgbMeans } from "@/photo-quality/hydrocolor-formula";

interface PhotoStepCaptureProps {
  label: string;
  guidance: string;
  onCaptured: (rgb: RgbMeans, previewUrl: string) => void;
  disabled?: boolean;
}

/**
 * Un paso de captura (agua / cielo / cartulina). Usa <input capture="environment"> — abre la
 * cámara del celular directamente en navegadores/SO que lo soportan; en los que no, cae al
 * selector de archivos normal (sigue funcionando, solo sin abrir la cámara de una).
 */
export function PhotoStepCapture({ label, guidance, onCaptured, disabled }: PhotoStepCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("No se pudo leer la imagen"));
        img.src = objectUrl;
      });
      const rgb = await extractCenterAverageRgbFromCanvas(img, img.naturalWidth, img.naturalHeight);
      if (!rgb) {
        setError("No se pudo extraer el color promedio de la foto — intenta de nuevo.");
        setProcessing(false);
        return;
      }
      setPreviewUrl(objectUrl);
      onCaptured(rgb, objectUrl);
    } catch {
      setError("Ocurrió un error procesando la foto.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-[var(--hv-foreground)]">{label}</p>
      <p className="text-xs text-[var(--hv-foreground-muted)]">{guidance}</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || processing}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--hv-border)] bg-[var(--hv-surface-secondary)] px-4 py-6 text-sm font-medium text-[var(--hv-foreground-muted)] transition-colors hover:border-cyan-400 hover:text-cyan-700 disabled:opacity-50"
      >
        {previewUrl ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        {processing ? "Procesando…" : previewUrl ? "Foto capturada — tocar para repetir" : "Tomar foto"}
      </button>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={label} className="h-24 w-full rounded-lg object-cover" />
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
