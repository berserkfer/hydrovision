# HydroVision — Importación de Datos (Sprint 3F)

Guía para importar mediciones ambientales desde archivos **CSV** y **Excel** hacia PostgreSQL.

## Formatos aceptados

| Extensión | MIME types comunes |
|-----------|-------------------|
| `.csv` | `text/csv`, `text/plain`, `application/csv` |
| `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `.xls` | `application/vnd.ms-excel` |

**Límite de tamaño:** 5 MB.  
**Seguridad:** no se ejecutan macros ni scripts; solo se parsea contenido tabular.

## Estructura esperada

Formato **long** (una fila = una medición):

```csv
station_code,campaign,date,parameter,value,unit,latitude,longitude,observations
E-01,CAMP-2025-01,2025-03-12,ph,7.42,—,-6.7041,-79.8432,Muestreo de campo
```

Archivo de ejemplo: [`docs/examples/hydrovision-water-quality-example.csv`](./examples/hydrovision-water-quality-example.csv)

## Mapeo de columnas

El sistema detecta automáticamente encabezados comunes. El usuario puede corregir manualmente:

| Campo destino | Alias reconocidos |
|---------------|-------------------|
| `station_code` | codigo_estacion, codigo, station_id |
| `station` | estacion, nombre_estacion |
| `date` | fecha, fecha_muestreo, sample_date |
| `parameter` | parametro, variable, analito |
| `value` | valor, resultado, medicion |
| `unit` | unidad |
| `latitude` | latitud, lat |
| `longitude` | longitud, lng, lon |
| `campaign` | campana, campaign_code |
| `observations` | observaciones, notas, comentario |

Ejemplo manual: columna `"pH"` → campo **parameter**.

## Validaciones

- **Obligatorios:** estación (código o nombre), fecha, parámetro, valor numérico
- **Fechas:** ISO `YYYY-MM-DD` o `DD/MM/YYYY`
- **Coordenadas:** latitud −90…90, longitud −180…180
- **Parámetros:** deben existir en catálogo (`Parameter`)
- **Estaciones:** deben existir (`Station.codigo`)
- **Campañas:** si se indica, debe existir; si no, se infiere la más reciente del río
- **Rangos:** advertencias para pH, temperatura, OD, turbidez, conductividad fuera de rangos típicos

## Flujo de importación

```
1. Usuario sube archivo (/import)
2. POST /api/import/preview → vista previa + mapeo sugerido
3. Usuario ajusta mapeo → POST /api/import/validate
4. Resumen: válidos / advertencias / errores
5. Usuario confirma "Importar datos"
6. POST /api/import/execute → transacción PostgreSQL
7. Registro en DataImport + historial
```

**No se guarda automáticamente.** Solo registros válidos y con advertencias se insertan; errores se rechazan.

## Manejo de errores

| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Archivo inválido, vacío o datos incorrectos |
| `DATABASE_ERROR` | Fallo en transacción PostgreSQL (rollback) |

Errores por fila se registran en `DataImport.errorLog`.

## Historial

Modelo `DataImport` almacena:

- Responsable, fecha, nombre y tamaño del archivo
- Total / válidos / advertencias / errores
- Importados / rechazados
- Estado: `pending`, `validated`, `completed`, `partial`, `failed`

Consulta: `GET /api/import/history`

## Arquitectura

```
ImportView → import.client.ts → /api/import/* → ImportService
  → CsvParser / ExcelParser / ImportValidator → ImportRepository → Prisma
```

## Servicios

| Servicio | Archivo |
|----------|---------|
| `ImportService` | `src/server/import/import.service.ts` |
| `CsvParser` | `src/server/import/csv-parser.ts` |
| `ExcelParser` | `src/server/import/excel-parser.ts` |
| `ImportValidator` | `src/server/import/import-validator.ts` |
