"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = ".csv,.xlsx,.xls";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileUploader({ onFileSelected, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      setSelected(file);
      onFileSelected(file);
    },
    [disabled, onFileSelected]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-cyan-500 bg-cyan-50/50" : "border-slate-200 bg-slate-50/40",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <UploadCloud className="mb-3 h-10 w-10 text-cyan-600" />
        <p className="text-sm font-medium text-slate-800">Arrastre y suelte su archivo aquí</p>
        <p className="mt-1 text-xs text-slate-500">Formatos: .csv, .xlsx, .xls · Máx. 5 MB</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          Seleccionar archivo
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {selected && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <FileSpreadsheet className="h-8 w-8 shrink-0 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{selected.name}</p>
            <p className="text-xs text-slate-500">
              {formatBytes(selected.size)} · {selected.type || "tipo desconocido"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
