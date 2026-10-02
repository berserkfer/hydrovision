"use client";

import Link from "next/link";
import { Camera } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { InfoBadge } from "@/components/ui/Badge";

/**
 * Tarjeta de acceso rápido, no el flujo completo de captura: el asistente de 3 fotos es un
 * wizard de varios pasos que necesita su propia pantalla, no un panel entre widgets del
 * dashboard — por eso mantiene su ruta dedicada (/foto) en vez de incrustarse aquí.
 */
export function PhotoQualityEntryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-cyan-600" />
          Foto de Calidad de Agua
        </CardTitle>
        <CardDescription>
          Estima turbidez desde 3 fotos del celular (agua, cielo, cartulina de referencia), con 3
          niveles de confianza explícitos y funcionamiento offline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <InfoBadge variant="default">Nivel 1 — offline</InfoBadge>
          <InfoBadge variant="info">Nivel 2 — + referencia satelital</InfoBadge>
          <InfoBadge variant="warning">Nivel 3 — calibrado localmente</InfoBadge>
        </div>
        <Link
          href="/foto"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--hv-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <Camera className="h-4 w-4" />
          Abrir módulo de foto
        </Link>
      </CardContent>
    </Card>
  );
}
