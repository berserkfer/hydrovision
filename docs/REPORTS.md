# Exportación y Reportes — Sprint 3G

Módulo **Exportación y Reportes** (`/reports`) para filtrar, previsualizar y exportar información ambiental de HydroVision en formatos CSV, Excel (.xlsx) y PDF.

## Formatos

| Formato | MIME | Contenido |
|---------|------|-----------|
| **CSV** | `text/csv; charset=utf-8` | Secciones: Estaciones, Campañas, Mediciones, Evaluaciones. BOM UTF-8 para Excel. |
| **Excel** | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | Hojas: Resumen, Estaciones, Campañas, Mediciones, Evaluaciones. |
| **PDF** | `application/pdf` | Reporte científico: portada, resumen, filtros, tablas, gráficos, evaluación, conclusiones. |

## Filtros

- Cuenca, río, estación, campaña
- Parámetro, categoría (fisicoquímico, orgánico, microbiológico, hidrológico)
- Estado ambiental (Cumple ECA, En alerta, No cumple)
- Fecha inicial y final

## Secciones personalizables

Checkboxes en la UI para incluir/excluir:

- Resumen, Estaciones, Mediciones, Gráficos, Evaluación ambiental, Conclusiones

## Estructura de archivos

```
src/server/reports/
  report.types.ts
  report-data.builder.ts
  report.service.ts
  report.repository.ts
  csv-export.service.ts
  excel-export.service.ts
  pdf-export.service.ts
  report.test.ts

src/app/api/reports/
  preview/route.ts
  export/route.ts
  history/route.ts
  filters/route.ts

src/components/export-reports/
  ExportReportsView.tsx
  ReportFilters.tsx
  ReportPreview.tsx
  ExportFormatSelector.tsx
  ReportSummary.tsx
  ReportCharts.tsx
  ExportHistory.tsx
```

## Flujo de generación

```
UI (/reports)
  → POST /api/reports/preview   (JSON: conteo, estadísticas, gráficos)
  → POST /api/reports/export    (binary: CSV | XLSX | PDF)
  → GET  /api/reports/history   (historial)
```

1. Usuario configura filtros y secciones.
2. **Vista previa** consulta `ReportService.preview()` → `buildExportPreview()`.
3. **Exportar** invoca `ReportService.export()` → servicios CSV/Excel/PDF.
4. Se registra en `ReportExport` (PostgreSQL) o historial en memoria (mock).

## Historial

Cada exportación guarda:

- Fecha, tipo de archivo, responsable
- Filtros y secciones (JSON)
- Cantidad de registros

Modelo Prisma: `ReportExport` — migración `20250808220000_sprint_3g_report_export`.

## Pruebas

```bash
npm run test
npm run lint
npm run build
```

Casos en `src/server/reports/report.test.ts`: sin registros, filtros, CSV, XLSX, PDF, fechas, volumen.

## Notas

- No modifica el Dashboard ni `/reportes` (Sprint 2F).
- No afecta `/import` (Sprint 3F).
- Datos desde mock store cuando la BD no está configurada.
