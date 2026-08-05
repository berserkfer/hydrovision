# Fase 4.6 — Preparación para Integración de Datos Reales

**Proyecto:** HydroVision  
**Fecha:** Julio 2026  
**Estado:** Capa de datos desacoplada · Mock activo · PostgreSQL/GEE/API **no conectados**

---

## 1. Objetivo

Separar completamente la **capa de datos** de la **capa de presentación**, permitiendo reemplazar datos simulados por PostgreSQL, Google Earth Engine o APIs externas **sin modificar componentes ni diseño visual**.

---

## 2. Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│  UI · Hooks · Services · Repositories                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ getDataStore()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  src/data/store-access.ts                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ getDataProvider()
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  DataProviderFactory.createWithFallback()                   │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────┬───────────┼───────────┬───────────┐
       ▼           ▼           ▼           ▼           ▼
   MockData   FutureDB    FutureGEE   FutureApi   (fallback)
   Provider   Provider    Provider    Provider    → mock
```

### Estructura de archivos

```
src/
├── config/
│   └── data-source.config.ts     # DATA_SOURCE global
├── types/
│   └── data-provider.ts          # IDataProvider, DataProviderSnapshot
├── data/
│   ├── mock/store.ts             # Única fuente mock (singleton)
│   └── store-access.ts           # getDataStore() — punto único de acceso
└── providers/
    ├── mock-data.provider.ts
    ├── future-database.provider.ts
    ├── future-earth-engine.provider.ts
    ├── future-api.provider.ts
    ├── data-provider.factory.ts
    ├── empty-data-store.ts
    ├── provider.utils.ts
    └── index.ts                  # getDataProvider(), DI singleton

scripts/
└── validate-data-providers.ts    # Pruebas de contrato

.env.example                      # DATA_SOURCE=mock
```

---

## 3. Patrones utilizados

| Patrón | Implementación | Propósito |
|--------|----------------|-----------|
| **Provider** | `IDataProvider` + 4 implementaciones | Abstracción del origen de datos |
| **Factory** | `DataProviderFactory` | Selección automática según `DATA_SOURCE` |
| **Dependency Injection** | `getDataProvider()` / `setDataProvider()` | Singleton intercambiable (tests, prod) |
| **Repository** | Repositorios existentes consumen `getDataStore()` | Acceso a dominio sin conocer el origen |
| **SOLID — DIP** | UI/Services dependen de `IDataProvider`, no de mock | Inversión de dependencias |
| **DRY** | `mockDataStore` centralizado en `store.ts` | Eliminación de duplicación |

---

## 4. Contrato IDataProvider

```typescript
interface IDataProvider {
  getMetadata(): DataProviderMetadata;
  getSnapshot(): DataProviderSnapshot;
  getStore(): HydroVisionDataStore;
  isAvailable(): boolean;
}
```

- **`getStore()`** — devuelve el almacén unificado `HydroVisionDataStore`.
- **`getSnapshot()`** — estructura validable (claves + conteos) para pruebas de contrato.
- **`isAvailable()`** — `true` solo para mock; proveedores futuros retornan `false` hasta conectar.

---

## 5. Configuración global

En `.env`:

```env
DATA_SOURCE=mock
```

| Valor | Comportamiento actual |
|-------|----------------------|
| `mock` | Datos simulados (default, producción actual) |
| `database` | Stub → fallback automático a `mock` con warning |
| `gee` | Stub → fallback automático a `mock` con warning |
| `api` | Stub → fallback automático a `mock` con warning |

Compatibilidad legacy: `USE_DATABASE=true` equivale a `DATA_SOURCE=database`.

Opcional en cliente Next.js: `NEXT_PUBLIC_DATA_SOURCE=mock`.

---

## 6. Cómo cambiar entre Mock y Google Earth Engine

### Hoy (Fase 4.6)

1. Mantener `DATA_SOURCE=mock` (recomendado).
2. Toda la app ya consume `getDataStore()` → sin cambios en UI.

### Futuro (Fase 5+)

1. Implementar `FutureEarthEngineProvider.getStore()` con cliente GEE real.
2. Implementar `isAvailable()` verificando credenciales (`GEE_PROJECT_ID`, etc.).
3. Cambiar `.env`:

   ```env
   DATA_SOURCE=gee
   GEE_PROJECT_ID="tu-proyecto"
   GOOGLE_APPLICATION_CREDENTIALS="/ruta/credentials.json"
   ```

4. Reiniciar la aplicación. `DataProviderFactory` seleccionará GEE sin tocar componentes.

---

## 7. Cómo conectar PostgreSQL

1. Completar `FutureDatabaseProvider.getStore()` usando Prisma Client.
2. Mapear entidades Prisma → `HydroVisionDataStore` (o evolucionar repositorios a consultas directas).
3. Implementar `isAvailable()` comprobando `DATABASE_URL` y conexión.
4. Configurar:

   ```env
   DATA_SOURCE=database
   DATABASE_URL="postgresql://user:pass@localhost:5432/hydrovision"
   ```

5. Ejecutar migraciones: `npm run db:migrate`.

---

## 8. Cómo conectar APIs externas

1. Implementar `FutureApiProvider.getStore()` agregando respuestas REST/GraphQL al shape `HydroVisionDataStore`.
2. Implementar `isAvailable()` según URL y autenticación configuradas.
3. Configurar:

   ```env
   DATA_SOURCE=api
   # Variables específicas de la API (Fase 5+)
   ```

---

## 9. Punto único de acceso (DRY)

**Antes:** múltiples archivos importaban `mockDataStore` directamente.

**Ahora:** toda la aplicación usa:

```typescript
import { getDataStore } from "@/data/store-access";

const store = getDataStore();
```

Únicos accesos directos a `mockDataStore`:

- `src/data/mock/store.ts` — definición
- `src/providers/mock-data.provider.ts` — inyección al provider mock
- `src/data/mock/index.ts` — re-export `@deprecated` por compatibilidad

---

## 10. Pruebas de contrato

```powershell
npm run test:providers
```

Valida que:

- Todos los proveedores exponen las mismas `storeKeys` (`DATA_STORE_KEYS`).
- `MockDataProvider` está disponible y contiene datos.
- Proveedores futuros no están disponibles y `getStore()` lanza error.
- `DataProviderFactory` registra las 4 fuentes y hace fallback a mock.

---

## 11. Inyección para tests

```typescript
import { setDataProvider, resetDataProvider, mockDataProvider } from "@/data/store-access";

beforeEach(() => setDataProvider(mockDataProvider));
afterEach(() => resetDataProvider());
```

---

## 12. Mejoras arquitectónicas aplicadas

| Mejora | Detalle |
|--------|---------|
| Centralización mock | Un solo `mockDataStore` en `store.ts` |
| Fallback seguro | Factory degrada a mock si el proveedor futuro no está listo |
| Snapshot de contrato | `getSnapshot()` permite validación automatizada |
| Compatibilidad | `USE_DATABASE` legacy mapeado a `database` |
| Deprecación gradual | `@deprecated` en re-export de `@/data/mock` |

---

## 13. Verificación

```powershell
cd C:\Users\ferch\Projects\hydrovision
npm run test:providers
npm run dev
npm run build
```

La interfaz permanece idéntica; solo cambia el origen de datos detrás de `IDataProvider`.

---

## 14. Restricciones respetadas

- Google Earth Engine **no conectado**
- PostgreSQL **no conectado**
- APIs externas **no conectadas**
- Funcionalidades existentes **preservadas**
- Diseño visual **sin cambios**
