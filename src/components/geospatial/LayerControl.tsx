"use client";

import type { GeoLayerState } from "@/types/geospatial-center";

interface LayerControlProps {
  layers: GeoLayerState[];
  onToggle: (layerId: GeoLayerState["id"]) => void;
  className?: string;
}

export function LayerControl({ layers, onToggle, className = "" }: LayerControlProps) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur-sm ${className}`}
      aria-label="Control de capas del mapa"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Capas</p>
      <ul className="space-y-2">
        {layers.map((layer) => (
          <li key={layer.id}>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={layer.visible}
                onChange={() => onToggle(layer.id)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span>
                <span className="font-medium">{layer.label}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{layer.description}</span>
                {layer.source === "mock" && (
                  <span className="mt-0.5 block text-[10px] uppercase tracking-wide text-slate-400">
                    Simulado
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
