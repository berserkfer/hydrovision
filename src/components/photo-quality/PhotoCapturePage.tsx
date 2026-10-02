"use client";

import { useEffect, useState } from "react";
import { Camera, MapPin, Satellite, WifiOff } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContent } from "@/components/layout/PageContent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PhotoStepCapture } from "./PhotoStepCapture";
import type { RgbMeans } from "@/photo-quality/hydrocolor-formula";
import { HYDROCOLOR_CITATION, HYDROCOLOR_REPORTED_MEDIAN_ERROR_PERCENT, HYDROCOLOR_VALID_TURBIDITY_RANGE_NTU } from "@/photo-quality/hydrocolor-formula";
import { computeOfflinePhotoEstimate, type OfflinePhotoEstimateResult } from "@/photo-quality/photo-offline-estimate";
import { readCachedCalibration, writeCachedCalibration } from "@/photo-quality/local-calibration-cache";
import type { PhotoCalibrationParameterCode } from "@/photo-quality/photo-calibration.store";
import { usePhotoObservationSync } from "@/hooks/usePhotoObservationSync";
import type { PhotoObservationInput } from "@/photo-quality/photo-observation.types";

type ParameterChoice = PhotoCalibrationParameterCode;

const PARAMETER_LABELS: Record<ParameterChoice, string> = {
  turbidity: "Turbidez (NTU)",
  total_suspended_solids: "Sólidos Suspendidos Totales (mg/L)",
};

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return isOnline;
}

interface SatelliteReferenceState {
  loading: boolean;
  data: {
    found: boolean;
    sceneId?: string;
    acquisitionDate?: string;
    cloudPercentage?: number | null;
    ndti?: number | null;
    message: string;
  } | null;
}

export function PhotoCapturePage() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncing, saveObservation } = usePhotoObservationSync();

  const [parameterCode, setParameterCode] = useState<ParameterChoice>("turbidity");
  const [hasReferencePanel, setHasReferencePanel] = useState(true);

  const [waterRgb, setWaterRgb] = useState<RgbMeans | null>(null);
  const [skyRgb, setSkyRgb] = useState<RgbMeans | null>(null);
  const [cardRgb, setCardRgb] = useState<RgbMeans | null>(null);

  const [gps, setGps] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  const [wantsLabSample, setWantsLabSample] = useState(false);
  const [labValue, setLabValue] = useState("");
  const [labDate, setLabDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [result, setResult] = useState<OfflinePhotoEstimateResult | null>(null);
  const [satelliteRef, setSatelliteRef] = useState<SatelliteReferenceState>({ loading: false, data: null });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const readyToEstimate = waterRgb !== null && skyRgb !== null && (hasReferencePanel ? cardRgb !== null : true);

  function requestGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setGpsStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGpsStatus("granted");
      },
      () => setGpsStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  // Nivel 1 — se recalcula de inmediato, 100% local, apenas hay suficientes fotos.
  useEffect(() => {
    if (!readyToEstimate || !waterRgb || !skyRgb) return;
    const cached = readCachedCalibration(parameterCode);
    const estimate = computeOfflinePhotoEstimate({
      waterRgb,
      skyRgb,
      cardRgb,
      hasReferencePanel,
      isOnline,
      cachedCalibration: cached,
    });
    setResult(estimate);
  }, [readyToEstimate, waterRgb, skyRgb, cardRgb, hasReferencePanel, parameterCode, isOnline]);

  // Nivel 2/3 — mejora en línea: consulta calibración + referencia satelital, y si corresponde
  // sube el nivel mostrado. Nunca combina el índice satelital con el número de la foto.
  useEffect(() => {
    if (!readyToEstimate || !waterRgb || !skyRgb || !isOnline) return;
    let cancelled = false;

    (async () => {
      let labCalibrationSufficientNow = false;
      try {
        const res = await fetch(`/api/photo-quality/calibration?parameterCode=${parameterCode}`);
        if (res.ok) {
          const status = await res.json();
          labCalibrationSufficientNow = !!status.sufficient;
          if (status.sufficient && status.model) {
            writeCachedCalibration({
              parameterCode,
              coefficientA: status.model.coefficientA,
              coefficientB: status.model.coefficientB,
              validRange: status.validRange,
              n: status.n,
              r2: status.model.metrics.r2,
              cachedAt: new Date().toISOString(),
            });
          }
        }
      } catch {
        /* sin red real a mitad de camino — se queda en lo que ya se tenía */
      }

      let satelliteSceneFound = false;
      if (gps) {
        setSatelliteRef({ loading: true, data: null });
        try {
          const res = await fetch(
            `/api/photo-quality/satellite-reference?lat=${gps.latitude}&lng=${gps.longitude}&date=${new Date().toISOString()}`
          );
          if (res.ok) {
            const data = await res.json();
            satelliteSceneFound = !!data.found;
            if (!cancelled) setSatelliteRef({ loading: false, data });
          }
        } catch {
          if (!cancelled) setSatelliteRef({ loading: false, data: null });
        }
      }

      if (cancelled) return;
      const cached = readCachedCalibration(parameterCode);
      setResult(
        computeOfflinePhotoEstimate({
          waterRgb,
          skyRgb,
          cardRgb,
          hasReferencePanel,
          isOnline,
          cachedCalibration: cached,
          labCalibrationSufficientNow,
          satelliteSceneFound,
        })
      );
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToEstimate, isOnline, gps, parameterCode]);

  async function handleSave() {
    if (!result || !waterRgb || !skyRgb) return;
    setSaveMessage(null);

    const labSample =
      wantsLabSample && labValue.trim() !== ""
        ? { parameterCode, value: Number(labValue), labDate }
        : null;

    const input: PhotoObservationInput = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `obs-${Date.now()}`,
      capturedAt: new Date().toISOString(),
      gps,
      connectivityAtCapture: isOnline ? "online" : "offline",
      hasReferencePanel,
      waterRgb,
      skyRgb,
      cardRgb,
      rrs: result.rrs,
      qualitativeColorIndex: result.qualitativeColorIndex,
      turbidityNtu: result.turbidityNtu,
      turbiditySaturated: result.turbiditySaturated,
      confidenceLevel: result.confidence.level,
      formulaSource: result.confidence.formulaSource,
      confidenceLabel: result.confidence.label,
      satelliteReference: satelliteRef.data
        ? {
            found: satelliteRef.data.found,
            sceneId: satelliteRef.data.sceneId,
            acquisitionDate: satelliteRef.data.acquisitionDate,
            ndti: satelliteRef.data.ndti,
          }
        : null,
      labSample,
    };

    await saveObservation(input);
    setSaveMessage(
      isOnline
        ? "Guardado y sincronizado."
        : "Guardado en el dispositivo — se sincronizará automáticamente al recuperar conexión."
    );
  }

  return (
    <MainLayout>
      <PageContent>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-cyan-600" />
            <h1 className="text-xl font-bold">Estimación de calidad del agua por foto</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold ${
                isOnline ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"
              }`}
            >
              {isOnline ? "En línea" : <><WifiOff className="h-3 w-3" /> Sin conexión</>}
            </span>
            {pendingCount > 0 && (
              <span className="rounded-md bg-amber-500/15 px-2 py-1 font-semibold text-amber-700">
                {pendingCount} observación(es) pendiente(s) de sincronizar{syncing ? "…" : ""}
              </span>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Método HydroColor</CardTitle>
              <CardDescription>
                Basado en Leeuw &amp; Boss (2018) — validado dentro de ~{HYDROCOLOR_REPORTED_MEDIAN_ERROR_PERCENT}% de un
                turbidímetro profesional, rango válido ~{HYDROCOLOR_VALID_TURBIDITY_RANGE_NTU.min}–
                {HYDROCOLOR_VALID_TURBIDITY_RANGE_NTU.max} NTU. Toma 3 fotos: agua a ~40° (evita el reflejo del
                cielo), cielo despejado en la misma zona, y una cartulina gris 18% como referencia (opcional, pero
                necesaria para tener un valor calibrado en NTU).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="text-sm">
                Parámetro objetivo
                <select
                  className="ml-2 rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface)] px-2 py-1 text-sm"
                  value={parameterCode}
                  onChange={(e) => setParameterCode(e.target.value as ParameterChoice)}
                >
                  {Object.entries(PARAMETER_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {parameterCode === "total_suspended_solids" && (
                <p className="text-xs text-amber-700">
                  No existe una fórmula genérica publicada para SST desde una foto — solo se podrá estimar una vez
                  que exista calibración local suficiente (Nivel 3).
                </p>
              )}

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!hasReferencePanel}
                  onChange={(e) => setHasReferencePanel(!e.target.checked)}
                />
                No tengo cartulina de referencia (el resultado será solo un índice de color relativo, no NTU)
              </label>

              <PhotoStepCapture
                label="1. Foto del agua (~40° desde la vertical)"
                guidance="Apunta hacia el agua evitando tu propia sombra y el reflejo directo del cielo."
                onCaptured={(rgb) => setWaterRgb(rgb)}
              />
              <PhotoStepCapture
                label="2. Foto del cielo (misma zona, sin apuntar al sol)"
                guidance="Con el celular casi hacia arriba, en la misma dirección general."
                onCaptured={(rgb) => setSkyRgb(rgb)}
              />
              {hasReferencePanel && (
                <PhotoStepCapture
                  label="3. Foto de la cartulina gris 18%"
                  guidance="Misma luz, mismo ángulo que la foto del agua."
                  onCaptured={(rgb) => setCardRgb(rgb)}
                />
              )}

              <button
                type="button"
                onClick={requestGps}
                className="flex items-center gap-1.5 text-xs font-medium text-cyan-700 hover:text-cyan-900"
              >
                <MapPin className="h-3.5 w-3.5" />
                {gpsStatus === "granted" && gps
                  ? `Coordenadas: ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`
                  : gpsStatus === "denied"
                    ? "Ubicación no autorizada — se guardará sin GPS"
                    : gpsStatus === "requesting"
                      ? "Solicitando ubicación…"
                      : "Adjuntar ubicación GPS (opcional)"}
              </button>
            </CardContent>
          </Card>

          {result && (
            <Card className="border-cyan-200/60">
              <CardHeader>
                <CardTitle className="text-base">Resultado</CardTitle>
                <CardDescription>
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      result.confidence.level === "LEVEL_3"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : result.confidence.level === "LEVEL_2"
                          ? "bg-cyan-500/15 text-cyan-700"
                          : "bg-amber-500/15 text-amber-700"
                    }`}
                  >
                    {result.confidence.level === "LEVEL_3"
                      ? "Nivel 3 — Calibrado con laboratorio"
                      : result.confidence.level === "LEVEL_2"
                        ? "Nivel 2 — Con referencia satelital"
                        : "Nivel 1 — Estimación offline"}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-xs text-[var(--hv-foreground-muted)]">{result.confidence.label}</p>

                {result.qualitativeColorIndex !== null ? (
                  <p>
                    Índice de color (rojo/verde, sin calibrar): <strong>{result.qualitativeColorIndex}</strong> — no
                    es NTU, solo referencia relativa.
                  </p>
                ) : result.turbiditySaturated ? (
                  <p className="text-amber-700">Fuera del rango calibrado/válido — resultado poco confiable.</p>
                ) : result.turbidityNtu !== null ? (
                  <p className="text-2xl font-bold">
                    {result.turbidityNtu} <span className="text-sm font-normal">NTU</span>
                    {result.outOfCalibratedRange && (
                      <span className="ml-2 text-xs font-semibold text-amber-700">
                        Fuera del rango calibrado — resultado poco confiable.
                      </span>
                    )}
                  </p>
                ) : null}

                {satelliteRef.loading && (
                  <p className="flex items-center gap-1.5 text-xs text-[var(--hv-foreground-dim)]">
                    <Satellite className="h-3.5 w-3.5" /> Buscando escena Sentinel-2 de referencia…
                  </p>
                )}
                {satelliteRef.data && (
                  <div className="rounded-lg bg-[var(--hv-surface-secondary)] px-3 py-2 text-xs">
                    <p className="flex items-center gap-1.5 font-semibold text-[var(--hv-foreground)]">
                      <Satellite className="h-3.5 w-3.5" /> Referencia satelital (no combinada con el valor de la foto)
                    </p>
                    <p className="mt-1 text-[var(--hv-foreground-muted)]">{satelliteRef.data.message}</p>
                    {satelliteRef.data.found && (
                      <p className="mt-1 font-mono">NDTI = {satelliteRef.data.ndti}</p>
                    )}
                  </div>
                )}

                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={wantsLabSample} onChange={(e) => setWantsLabSample(e.target.checked)} />
                  Tengo un valor real medido en laboratorio de esta misma muestra (contribuye a la calibración)
                </label>
                {wantsLabSample && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      placeholder={`Valor real (${PARAMETER_LABELS[parameterCode]})`}
                      value={labValue}
                      onChange={(e) => setLabValue(e.target.value)}
                      className="w-40 rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface)] px-2 py-1 text-sm"
                    />
                    <input
                      type="date"
                      value={labDate}
                      onChange={(e) => setLabDate(e.target.value)}
                      className="rounded-lg border border-[var(--hv-border)] bg-[var(--hv-surface)] px-2 py-1 text-sm"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
                >
                  Guardar observación
                </button>
                {saveMessage && <p className="text-xs text-emerald-700">{saveMessage}</p>}
              </CardContent>
            </Card>
          )}

          <p className="text-[11px] text-[var(--hv-foreground-dim)]">{HYDROCOLOR_CITATION}</p>
        </div>
      </PageContent>
    </MainLayout>
  );
}
