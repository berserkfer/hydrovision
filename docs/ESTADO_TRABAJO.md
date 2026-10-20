# Estado de trabajo — HydroVision (bloque nocturno)

**Objetivo:** corregir la plataforma (no el documento administrativo) con tests y commits por bloque.

## Decisiones acordadas

- Cauce del dren → **ECA E2** por defecto, con opción **D1**.
- Zona marina → **ECA E3**.
- Efluentes P1–P5 → **LMP PTAR** por defecto, configurable por punto.
- Ventana de emparejamiento campo–satélite → **±3 días** (una sola constante).
- Píxel mezclado → no descartar: calcular `f_agua`, conservar `f_agua >= 0.5`, si hay menos de 3 píxeles devolver "sin píxeles de agua suficientes".
- Validación → **leave-one-date-out** como estrategia principal (métricas por fold, media ± desviación).
- **No tocar** el punto 7 (tablas administrativas del documento).

## Bloques

| # | Bloque | Estado |
|---|--------|--------|
| 1 | Motor normativo ECA/LMP | en curso |
| 2 | Ventana única ±3 días | pendiente |
| 3 | Fracción de agua / pureza de píxel | pendiente |
| 4 | Validación leave-one-date-out | pendiente |

## Reglas de trabajo

1. Un bloque = código + tests + `git commit`.
2. No inventar valores normativos: si un límite no se puede verificar en la norma, se marca `pending_verification` y no se usa para clasificar.
3. Actualizar este archivo al terminar cada bloque, indicando el punto exacto de reanudación.

## Reanudación

Si la sesión se corta: leer este archivo y `git log --oneline -5`, y continuar por el primer bloque no completado.

**Último punto de reanudación:** inicio del bloque 1 (motor normativo).
