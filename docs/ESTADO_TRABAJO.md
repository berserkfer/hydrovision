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

## Verificación

- `npx vitest run` → 36 archivos, **330 tests pasan**.
- `npm run build` → OK.

## Pendiente

Solo las correcciones del documento de tesis (ver `docs/HANDOFF_CLAUDE_CODE.md`, sección 6).

## Reanudación

Leer este archivo, el handoff y `git log --oneline -10`.

**Último punto:** correcciones del .docx (año 2027, autoría de Nizama, ECA/LMP, píxel mixto, tamaño muestral, ventana, validación, anexos).
