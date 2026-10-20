# Estado de trabajo — HydroVision

**Objetivo:** correcciones de plataforma con tests y commits por bloque.

## Decisiones

- Cauce → **ECA E2** (opción D1); mar → **ECA E3**.
- P1 → **LMP PTAR**; P2–P5 → **LMP pesca**; P8 → excluido.
- Ventana campo–satélite → **±3 días**.
- Píxel mezclado → `f_agua` (NDWI, ventana 3×3), ≥ 0,5 y mínimo 3 píxeles.
- Validación → **leave-one-date-out**.
- No tocar el punto 7 del documento.

## Bloques

| # | Bloque | Estado | Commit |
|---|--------|--------|--------|
| 1 | Motor normativo ECA/LMP | ✅ | `5a1980f` |
| 1b | Página `/normativa` | ✅ | `864a8ba` |
| 2 | Ventana única ±3 días | ✅ | `b810aea` |
| 3 | Fracción de agua / pureza de píxel | ✅ | `092c785` |
| 4 | Validación leave-one-date-out | ✅ | `f3b57e7` |
| A | API normativa + selector de perfil | ✅ | `3ead7d0` |
| B | Scorecard de agua en vista satelital | ✅ | `8f8e7f3` |
| C | Marco normativo en el PDF | ✅ | `0010dfe` |
| D | Correcciones del documento de tesis (v2) | ✅ | `ca89931` |
| E | README, roadmap y estado del proyecto | ✅ | `958c1ab` |
| F | Typecheck de fixtures (`tsc --noEmit` limpio) | ✅ | `c1a4d66` |
| G | Anexos 3 y 4 del documento de tesis | ✅ | `5361f87` |
| H | CI de GitHub Actions y badge | ✅ | `54c1a2f` |
| I | Planificador de campañas (`/planificador`) | ✅ | `f217b09` |
| J | Caché STAC y rate limit satelital | ✅ | `967c525` |

## Verificación

- `npx vitest run` → 40 archivos, **348 tests pasan**.
- `npx tsc --noEmit` → sin errores.
- `npm run build` → OK, incluye `/planificador`.
- Revisión visual del .docx: anexos renderizados y verificados (31 páginas).

## Pendiente

- Revisión final del asesor y entrega.
- Revisión visual del resto del documento si se desea.

## Reanudación

Leer este archivo, el handoff y `git log --oneline -10`.

**Último punto:** revisión final del documento / CI opcional.
