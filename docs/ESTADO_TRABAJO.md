# Estado de trabajo — HydroVision (bloque nocturno)

**Objetivo:** corregir la plataforma (no el documento administrativo) con tests y commits por bloque.

## Decisiones acordadas

- Cauce del dren → **ECA E2** por defecto, con opción **D1**.
- Zona marina → **ECA E3**.
- P1 → **LMP PTAR**; P2–P5 → **LMP pesca**; P8 (agua de proceso) → excluido.
- Ventana de emparejamiento campo–satélite → **±3 días** (una sola constante).
- Píxel mezclado → calcular `f_agua`, conservar `f_agua >= 0.5`, mínimo 3 píxeles.
- Validación → **leave-one-date-out** como estrategia principal.
- **No tocar** el punto 7 (tablas administrativas del documento).

## Bloques

| # | Bloque | Estado | Commit |
|---|--------|--------|--------|
| 1 | Motor normativo ECA/LMP | ✅ completado | `5a1980f` |
| 1b | Página `/normativa` | ✅ completado | `864a8ba` |
| 2 | Ventana única ±3 días | ✅ completado | `b810aea` |
| 3 | Fracción de agua / pureza de píxel | ✅ completado | pendiente de commit |
| 4 | Validación leave-one-date-out | en curso | — |
| 5 | Integración del motor (selector, API, PDF) | pendiente | — |

## Verificación

- `npx vitest run` → 33 archivos, **310 tests pasan**.
- `npm run build` → OK, incluye `/normativa`.

## Reglas de trabajo

1. Un bloque = código + tests + `git commit`.
2. No inventar valores normativos: si un límite no se puede verificar, `pendingVerification` y no clasifica.
3. Actualizar este archivo al terminar cada bloque.

## Reanudación

Leer este archivo, `docs/HANDOFF_CLAUDE_CODE.md` y `git log --oneline -5`; continuar por el primer bloque pendiente.

**Último punto de reanudación:** inicio del bloque 2 (ventana ±3 días).
