# Estado de trabajo — HydroVision (bloque nocturno)

**Objetivo:** corregir la plataforma (no el documento administrativo) con tests y commits por bloque.

## Decisiones acordadas

- Cauce del dren → **ECA E2** por defecto, con opción **D1**.
- Zona marina → **ECA E3**.
- P1 → **LMP PTAR**; P2–P5 → **LMP pesca**; P8 (agua de proceso) → excluido.
- Ventana de emparejamiento campo–satélite → **±3 días** (una sola constante).
- Píxel mezclado → `f_agua` con NDWI en ventana 3×3; ≥ 0,5 y mínimo 3 píxeles.
- Validación → **leave-one-date-out**.
- **No tocar** el punto 7 (tablas administrativas del documento).

## Bloques

| # | Bloque | Estado | Commit |
|---|--------|--------|--------|
| 1 | Motor normativo ECA/LMP | ✅ completado | `5a1980f` |
| 1b | Página `/normativa` | ✅ completado | `864a8ba` |
| 2 | Ventana única ±3 días | ✅ completado | `b810aea` |
| 3 | Fracción de agua / pureza de píxel | ✅ completado | `092c785` |
| 4 | Validación leave-one-date-out | ✅ completado | `f3b57e7` |
| A | Integración normativa (selector, API, PDF) | pendiente | — |
| B | Scorecard visible en la vista satelital | pendiente | — |

## Verificación

- `npx vitest run` → 35 archivos, **324 tests pasan**.
- `npm run build` → OK, incluye `/normativa`.

## Pendiente para Claude Code

Ver `docs/HANDOFF_CLAUDE_CODE.md`, secciones 5 y 6.

## Reanudación

Leer este archivo, `docs/HANDOFF_CLAUDE_CODE.md` y `git log --oneline -8`.

**Último punto de reanudación:** bloque A (integración del motor normativo) o correcciones del documento de tesis.
