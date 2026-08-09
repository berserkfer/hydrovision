# HydroVision — Estado del Proyecto (MVP)

**Versión:** 0.1.0 · **Sprint:** 2J (Cierre MVP)  
**Fecha:** 2026-08-05  
**Estado:** ✅ Listo para Fase 2 — Integración con tecnologías reales  

---

## 1. Resumen del proyecto

**HydroVision** es una plataforma web de monitoreo ambiental del **Río Reque (Lambayeque, Perú)**. Permite visualizar estaciones de monitoreo, parámetros fisicoquímicos, cumplimiento ECA, índices satelitales simulados, mapas interactivos, reportes y evaluación ambiental integrada.

El MVP actual opera **100 % con datos simulados** mediante un store unificado, con arquitectura preparada para conectar **PostgreSQL (Prisma)**, **Google Earth Engine** y **APIs externas** sin reescribir la UI.

| Métrica | Valor |
|---------|-------|
| Rutas activas | 17 páginas + 3 API |
| Módulos implementados | 5 de 6 plataforma |
| Build producción | ✅ Verificado |
| TypeScript strict | ✅ Activo |
| Datos default | Mock (`DATA_SOURCE=mock`) |

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 15 App Router — src/app/                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Views + Components + Hooks (React 19 Client/Server)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌─────────────────┐   ┌──────────────────┐
│ repositories/ │   │ services/*       │   │ platform/modules │
│ (mock API)    │   │ (business logic) │   │ (nav + registry) │
└───────┬───────┘   └────────┬─────────┘   └──────────────────┘
        │                    │
        └────────────────────┼──────────────────────┐
                             ▼                      ▼
┌─────────────────────────────────────┐   ┌─────────────────────┐
│  providers/ → IDataProvider          │   │ lib/geospatial/     │
│  mock | database | gee | api         │   │ IGeospatialLayer…   │
└────────────────────────┬────────────┘   └─────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  data/mock/store.ts  |  database/ (Prisma — preparado)           │
└─────────────────────────────────────────────────────────────────┘
```

**Principios:**
- Modularidad por dominio (`platform/modules`)
- Provider pattern para fuentes de datos
- Factory pattern en motores (GIS, GEE, índices, satélite)
- Adapter layer (`legacy-adapter.ts`) entre store español y UI legacy inglesa
- Mapas Leaflet con `dynamic(..., { ssr: false })`

**Documentación relacionada:**
- `docs/MODULES.md` — Módulos Sprint 2B–2H
- `docs/TECHNICAL_AUDIT_V2.md` — Auditoría técnica Sprint 2I

---

## 3. Módulos implementados

### Core
| Elemento | Ruta / Ubicación |
|----------|------------------|
| Layout + Sidebar modular | `components/layout/` |
| Navegación | `platform/modules/navigation.ts` |
| Registry v1.6.0 | `platform/modules/registry.ts` |

### Monitoreo Ambiental (v1.6.0)
| Módulo | Ruta | Sprint |
|--------|------|--------|
| Dashboard ejecutivo | `/` | 2B+ |
| Estaciones de monitoreo | `/estaciones`, `/estaciones/[id]` | 2C |
| Muestreos | `/muestreos`, `/muestreos/[id]` | 2C |
| Campañas | `/campanas`, `/campanas/[id]` | 2D |
| Parámetros ECA | `/parametros`, `/parametros/[codigo]` | 2E |
| Reportes ambientales | `/reportes` | 2F |
| Evaluación ambiental | `/evaluacion-ambiental` | 2G |
| Centro geoespacial | `/centro-geoespacial` | 2H |
| Centro de indicadores | `/indicadores` | Legacy+ |
| Índices satelitales (contexto) | `/satelite` | Sprint 3 |
| Análisis temporal | `/analisis-temporal` | Legacy |
| Mapa interactivo GIS | `/mapa` | Legacy |

### Observación Satelital (v0.5.0)
| Elemento | Ruta |
|----------|------|
| Explorador Sentinel-2 simulado | `/satelite` |
| Satellite Index Engine | Dashboard |

### Inteligencia Ambiental (v0.3.0)
| Elemento | Ruta |
|----------|------|
| Evaluación de riesgo mock | `/indicadores` |
| Motor ejecutivo | Dashboard |

### Administración (v0.2.0)
| Elemento | Ruta |
|----------|------|
| Estado del sistema + GEE auth simulado | `/admin/system-status` |

---

## 4. Módulos pendientes

| Módulo | Estado UI | Fase estimada |
|--------|-----------|---------------|
| PostgreSQL en runtime | Schema + seed listos; UI usa mock | **Fase 2A** |
| Google Earth Engine real | Auth simulado; provider stub | **Fase 2B** |
| API externa REST | `FutureApiProvider` stub | Fase 3 |
| BioBalsa Inteligente | En desarrollo (sin ruta) | Fase 4 |
| Captación de neblina | Próximamente | Fase 4+ |
| Humedales artificiales | Próximamente | Fase 4+ |
| Restauración ecosistemas | Próximamente | Fase 4+ |
| Landsat dedicado | Próximamente | Fase 5 |
| Predicción IA | Próximamente | Fase 6 |
| Alertas automáticas | Próximamente | Fase 6 |
| Usuarios / RBAC | Próximamente | Fase 3 |

---

## 5. Tecnologías utilizadas

| Capa | Tecnología | Versión |
|------|------------|---------|
| Framework | Next.js (App Router) | 15.5.21 |
| UI | React | 19.1.2 |
| Lenguaje | TypeScript (strict) | 5.8.3 |
| Estilos | Tailwind CSS | 4.1.8 |
| Mapas | Leaflet + react-leaflet | 1.9.4 / 5.0.0 |
| Gráficos | Recharts | 2.15.3 |
| Iconos | lucide-react | 0.511.0 |
| ORM (preparado) | Prisma | 6.19.0 |
| Base de datos (preparado) | PostgreSQL | — |
| Satélite (preparado) | Google Earth Engine | Stub |

---

## 6. Estado actual

### ✅ Completado (MVP)

- [x] 17 rutas funcionales con build exitoso
- [x] Arquitectura modular documentada
- [x] Mock store unificado (`getDataStore()`)
- [x] Provider DI (mock / database / gee / api)
- [x] Prisma schema v2 + migraciones + seed
- [x] GEE auth simulado + admin system-status
- [x] Centro geoespacial con `IGeospatialLayerProvider`
- [x] Accesibilidad base (skip link, aria-current, aria-label)
- [x] Páginas globales: `not-found`, `error`, `loading`
- [x] Componente reutilizable `EmptyState`
- [x] ESLint configurado
- [x] Auditorías técnicas v1 y v2

### ⚠️ Deuda técnica conocida (no bloqueante)

- Dos stacks GEE (`services/gee/` vs `google-earth-engine/`)
- Cuatro implementaciones Leaflet (consolidar post-GEE)
- Shims deprecated en hot path (`lib/data/simulated.ts`)
- Imports mixtos `@/repositories` vs `@/lib/repositories`
- Código muerto sin uso: `Header.tsx`, `MapPlaceholder`, `useEnvironmentalRules`
- Nav duplicada hacia `/indicadores` y `/satelite`

### 🔒 Restricciones activas

- Sin conexión PostgreSQL en runtime UI
- Sin tiles satelitales reales
- Sin autenticación de usuarios
- Dashboard principal preservado (sin refactor estructural)

---

## 7. Próximas fases

### Fase 2 — Integración tecnologías reales

| Subfase | Objetivo | Prioridad |
|---------|----------|-----------|
| **2A** | Activar `DatabaseDataProvider` + bootstrap Prisma | Alta |
| **2B** | `GeeGeospatialLayerProvider` + tiles reales | Alta |
| **2C** | Unificar stack GEE bajo `google-earth-engine/` | Alta |
| **2D** | Migrar shims deprecated off hot path | Media |
| **2E** | `BaseLeafletMap` compartido | Media |

### Fase 3 — Inteligencia y operaciones

- RBAC / usuarios
- API externa
- Alertas automáticas
- Reportes PDF reales

### Fase 4+ — Tecnologías ambientales

- BioBalsa, neblina, humedales, restauración

---

## 8. Comandos de verificación

```bash
npm run dev          # http://localhost:3000
npm run lint         # ESLint (next/core-web-vitals)
npm run build        # Build producción
npm run test:providers  # Validar providers DI
npm run db:validate  # Validar schema Prisma
```

---

## 9. Checklist cierre MVP (Sprint 2J)

| Verificación | Estado |
|--------------|--------|
| Navegación — 17 rutas | ✅ |
| Componentes — sin regresiones | ✅ |
| Responsive — grids xl/lg/sm | ✅ |
| Accesibilidad — skip link, aria | ✅ |
| Rendimiento — mapas dynamic SSR off | ✅ |
| TypeScript — strict build | ✅ |
| Tailwind v4 — consistente | ✅ |
| Estados vacíos — EmptyState | ✅ |
| Estados carga — loading.tsx | ✅ |
| Manejo errores — error.tsx | ✅ |
| Lint configurado | ✅ (warnings hooks/img pendientes) |
| Build producción | ✅ |

---

**HydroVision MVP · Sprint 2J · Listo para Fase 2**
