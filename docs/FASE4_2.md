# Fase 4.2 — Dashboard Ejecutivo para la Toma de Decisiones

**Proyecto:** HydroVision  
**Fecha:** Julio 2026  
**Estado:** Dashboard ejecutivo operativo · Datos simulados · GEE/IA/PostgreSQL **no conectados**

---

## 1. Objetivo

Transformar el Dashboard en una vista ejecutiva que permita a un ingeniero ambiental interpretar el estado de una cuenca en **menos de 30 segundos**, sin eliminar ni modificar la lógica de módulos existentes.

---

## 2. Arquitectura

```
src/services/executive/
├── executive.constants.ts           # Definición de parámetros ambientales
├── executive-kpi.service.ts         # KPIs agregados (estaciones, campañas, ECA…)
├── environmental-indicator.service.ts # Tarjetas de indicadores con tendencia
├── alert.service.ts                 # AlertService — alertas con explicación
├── executive-summary.service.ts     # Resumen ejecutivo lateral
├── action-recommendation.service.ts # Acciones según riesgo
├── executive-dashboard.engine.ts    # Orquestador (Facade)
└── index.ts

src/hooks/useExecutiveDashboard.ts
src/components/dashboard/executive/   # Componentes UI
src/types/executive.ts
```

### Flujo

```mermaid
flowchart TB
  A[StationSummary[]] --> B[ExecutiveDashboardEngine]
  C[DashboardStats] --> B
  D[RiverContext] --> B
  E[RiskEngine assessment] --> B
  B --> F[ExecutiveHeader]
  B --> G[ExecutiveKpiPanel]
  B --> H[EnvironmentalIndicatorsGrid]
  B --> I[EnvironmentalAlertsSection]
  B --> J[RecommendedActionsSection]
  B --> K[ExecutiveSummaryPanel]
```

### Principios

| Principio | Aplicación |
|-----------|------------|
| **SRP** | Cada servicio tiene una responsabilidad (KPIs, alertas, resumen…) |
| **OCP** | Nuevos indicadores se agregan en `executive.constants.ts` |
| **DRY** | Reutiliza `RiskEngine`, `classifyMeasurement`, `buildSparklineTrend` |
| **Clean Architecture** | UI solo consume `ExecutiveDashboardSnapshot` |

---

## 3. Componentes

### Encabezado ejecutivo (`ExecutiveHeader`)

- Nombre del proyecto: **HydroVision**
- Cuenca y río seleccionados
- Fecha del último monitoreo
- Estado general de calidad del agua (Óptimo / Aceptable / En alerta / Crítico)
- Nivel general de riesgo ambiental (del Risk Engine Fase 4.0)

### Panel KPI superior (`ExecutiveKpiPanel`)

| KPI | Fuente |
|-----|--------|
| Estaciones | `DashboardStats.totalStations` |
| Campañas | Mock store filtrado por río |
| Muestras | Mock store filtrado por estaciones del río |
| % Cumplimiento ECA | `compliantCount / totalStations × 100` |
| Riesgo promedio | `RiskEngine.index` |
| Última actualización | `DashboardStats.lastUpdate` |

### Indicadores ambientales (`EnvironmentalIndicatorsGrid`)

Tarjetas para: pH, OD, Temperatura, Conductividad, Turbidez, Caudal.

Cada tarjeta muestra:
- Valor promedio cuenca
- Estado ECA (Cumple / En alerta / No cumple)
- Icono + mini sparkline
- Tendencia (↑ ↓ →) y variación % vs monitoreo anterior simulado

### Resumen ejecutivo (`ExecutiveSummaryPanel`)

Panel lateral con:
- Estado de la cuenca
- Parámetros críticos
- Estaciones en alerta
- Estaciones fuera de ECA
- Nivel de riesgo general
- Recomendaciones prioritarias (del Risk Engine)

### Alertas ambientales (`EnvironmentalAlertsSection`)

Clasificación automática:
- 🟢 Normal
- 🟡 Atención
- 🟠 Advertencia
- 🔴 Crítico

Cada alerta incluye explicación contextual generada por `AlertService`.

### Acciones recomendadas (`RecommendedActionsSection`)

Lista numerada priorizada según nivel de riesgo (bajo → muy alto), complementada con recomendaciones del motor de riesgo.

---

## 4. Componentes conservados

El Dashboard **mantiene intactos**:

- `KpiCards` (ECA por estación)
- `EnvironmentalRiskCard` (Fase 4.0)
- `MapMonitoringSection`
- `TemporalChart`
- `MonitoringPointsTable`
- `SatelliteIndicesPreview`
- `ModuleStatusPanel`
- `StationDetailPanel` / `StationDetailEmpty`
- `MonitoringHeader` (usado en Campañas y Muestreos)

---

## 5. Mejoras visuales

- Encabezado oscuro tipo plataforma profesional (ArcGIS/Power BI)
- Animaciones `hv-animate-fade-in` y hover en tarjetas
- Grid responsive (1→2→3→6 columnas según viewport)
- Iconografía Lucide consistente
- Panel lateral sticky con resumen ejecutivo
- Espaciado uniforme (`space-y-6`, `gap-4/6`)

---

## 6. Preparación — Google Earth Engine

```typescript
// Futuro: enriquecer EnvironmentalIndicatorService
const satelliteTrend = await indicesCalculator.getTrend(stationId, dateRange);
// Agregar capa NDWI/NDTI en indicadores ambientales
```

- `AlertService` podrá incorporar alertas por índices satelitales
- Sin modificar componentes UI — solo extender servicios

---

## 7. Preparación — Inteligencia Artificial

```typescript
// Futuro: ActionRecommendationService delegará a IA
const aiActions = await recommendationEngine.suggestActions(watershedSnapshot);
// Combinar acciones basadas en reglas + sugerencias IA
```

- Baseline explicable (reglas ECA + riesgo) permanece para la tesis
- IA aportará predicciones y acciones complementarias

---

## 8. Verificación

```powershell
cd C:\Users\ferch\Projects\hydrovision
npm run dev
```

1. Abrir Dashboard (`/`)
2. Verificar encabezado ejecutivo con cuenca y riesgo
3. Confirmar KPIs, indicadores ambientales, alertas y acciones
4. Panel lateral "Resumen Ejecutivo" visible en desktop
5. Confirmar mapa, gráfico temporal, tabla y módulos previos operativos
6. Filtrar estación — datos se recalculan

---

## 9. Referencias

- Motor ejecutivo: `src/services/executive/executive-dashboard.engine.ts`
- Tipos: `src/types/executive.ts`
- Fase anterior: `docs/FASE4_1.md`
- Risk Engine: `docs/FASE4_0.md`
