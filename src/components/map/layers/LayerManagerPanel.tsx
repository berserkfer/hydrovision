"use client";

import { useMemo } from "react";
import { ChevronDown, ChevronUp, Layers, RotateCcw } from "lucide-react";
import type { ManagedLayer } from "@/types/layers";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LayerManagerPanelProps {
  layers: ManagedLayer[];
  onToggle: (layerId: string) => void;
  onOpacityChange: (layerId: string, opacity: number) => void;
  onReset: () => void;
  className?: string;
}

const CATEGORY_LABELS: Record<ManagedLayer["category"], string> = {
  hydrographic: "Hidrografía",
  administrative: "Administrativo",
  satellite: "Satelital",
  analysis: "Análisis",
};

export function LayerManagerPanel({
  layers,
  onToggle,
  onOpacityChange,
  onReset,
  className,
}: LayerManagerPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    layers.find((l) => l.visible)?.id ?? layers[0]?.id ?? null
  );

  const grouped = useMemo(() => {
    const groups = new Map<ManagedLayer["category"], ManagedLayer[]>();
    for (const layer of layers) {
      const list = groups.get(layer.category) ?? [];
      list.push(layer);
      groups.set(layer.category, list);
    }
    return groups;
  }, [layers]);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div
      className={cn(
        "flex w-72 flex-col overflow-hidden rounded-xl border border-slate-700/80 bg-slate-900/95 text-slate-100 shadow-2xl backdrop-blur-md",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-700/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold">Layer Manager</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Restablecer capas"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <>
          <div className="max-h-64 overflow-y-auto px-2 py-2">
            {Array.from(grouped.entries()).map(([category, categoryLayers]) => (
              <div key={category} className="mb-3">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {CATEGORY_LABELS[category]}
                </p>
                <ul className="space-y-0.5">
                  {categoryLayers.map((layer) => (
                    <li key={layer.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLayerId(layer.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors",
                          selectedLayerId === layer.id
                            ? "bg-cyan-500/15 text-cyan-200"
                            : "hover:bg-slate-800"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={layer.visible}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggle(layer.id);
                          }}
                          className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/40"
                          aria-label={`Visibilidad ${layer.name}`}
                        />
                        <span className="min-w-0 flex-1 truncate">{layer.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {selectedLayer && (
            <div className="border-t border-slate-700/80 px-4 py-3">
              <p className="text-xs font-semibold text-slate-200">{selectedLayer.name}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                {selectedLayer.description}
              </p>

              <label className="mt-3 block">
                <span className="text-[10px] font-semibold uppercase text-slate-500">
                  Transparencia
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(selectedLayer.opacity * 100)}
                  onChange={(e) =>
                    onOpacityChange(selectedLayer.id, Number(e.target.value) / 100)
                  }
                  className="mt-1 w-full accent-cyan-500"
                />
              </label>

              {selectedLayer.legend.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] font-semibold uppercase text-slate-500">Leyenda</p>
                  <ul className="mt-1.5 space-y-1">
                    {selectedLayer.legend.map((item, index) => (
                      <li key={`${selectedLayer.id}-${item.label}-${index}`} className="flex items-center gap-2 text-[10px]">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-white/20"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-300">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
