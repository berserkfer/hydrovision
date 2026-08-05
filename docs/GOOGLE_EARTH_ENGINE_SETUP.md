# Google Earth Engine — Sprint 1 · Preparación HydroVision

Documentación de la integración preparatoria con **Google Earth Engine (GEE)**. Este sprint **no consume imágenes reales**, **no implementa autenticación** y **no modifica la interfaz** de la plataforma.

---

## Objetivo

Dejar lista la arquitectura profesional para conectar HydroVision con GEE en sprints posteriores, siguiendo **Clean Architecture**, **SOLID**, **Dependency Injection** y **Repository Pattern**.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     HydroVision UI (sin cambios)               │
│          Mapa simulado · Layer Manager · Dashboard           │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  src/lib/gee/          Facade (health-check, client)         │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  src/services/google-earth-engine/                           │
│  ├── interfaces/     IGEEProvider, GEEAuthentication, ...    │
│  ├── providers/      MockGeeProvider (Sprint 1)              │
│  ├── services/       Mock* + GeeHealthService                │
│  ├── repositories/   GeeConfigRepository                     │
│  ├── gee.factory.ts  Factory Pattern                         │
│  └── index.ts        DI: getGeeProvider()                    │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  src/config/gee.config.ts   Validación de variables .env     │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  Sprint 2+   Autenticación service account · API GEE real      │
│  Sprint 3+   Exportaciones · PostgreSQL · capas GIS          │
└─────────────────────────────────────────────────────────────┘
```

### Patrones aplicados

| Patrón | Ubicación | Responsabilidad |
|--------|-----------|-----------------|
| **Interface Segregation** | `interfaces/` | Contratos pequeños por dominio |
| **Factory** | `gee.factory.ts` | Crear proveedor según modo |
| **Dependency Injection** | `index.ts` | `getGeeProvider()` / `setGeeProvider()` |
| **Repository** | `repositories/gee-config.repository.ts` | Acceso a configuración |
| **Facade** | `src/lib/gee/` | API simple para scripts y server |

### Módulo legacy (sin cambios)

El código existente en `src/services/gee/` y `src/lib/earth-engine/` sigue activo para compatibilidad con la UI actual. La nueva estructura convive hasta la migración en Sprint 2.

---

## Variables de entorno necesarias

| Variable | Descripción |
|----------|-------------|
| `GOOGLE_EARTH_ENGINE_PROJECT` | ID del proyecto Google Cloud con Earth Engine habilitado |
| `GOOGLE_SERVICE_ACCOUNT` | Ruta al JSON de cuenta de servicio o identificador |
| `GOOGLE_CLIENT_EMAIL` | Email `client_email` de la cuenta de servicio |
| `GOOGLE_PRIVATE_KEY` | Clave privada PEM (escapar `\n` en `.env`) |
| `GEE_INTEGRATION_ENABLED` | Opcional. Default `true`. `false` deshabilita preparación |

Copiar plantilla:

```powershell
copy .env.example .env
```

---

## Validación automática

El módulo `src/config/gee.config.ts` expone:

- `validateGeeConfig()` — lista variables faltantes y mensajes amigables
- `isGeeConfigured()` — booleano para gates server-side

Errores típicos (en español):

```
Faltan 4 variable(s) de entorno para Google Earth Engine.
• GOOGLE_EARTH_ENGINE_PROJECT: ID del proyecto Google Cloud...
• GOOGLE_PRIVATE_KEY: Clave privada de la cuenta de servicio (PEM)
Copie .env.example a .env, complete las variables y reinicie el servidor.
```

---

## Health Check

Ejecutar desde la raíz del proyecto:

```powershell
npm run test:gee
```

El health check reporta:

1. **Configuración correcta** — todas las variables presentes
2. **Variables faltantes** — listado explícito
3. **Estado del proveedor** — modo, disponibilidad, mensaje operativo

Estados posibles:

| Estado | Significado |
|--------|-------------|
| `healthy` | Variables completas + proveedor mock disponible |
| `unconfigured` | Faltan variables (normal en dev con mock) |
| `degraded` | Configuración parcial o proveedor no disponible |

Uso programático:

```typescript
import { runGeeHealthCheck, printGeeHealthReport } from "@/lib/gee";

const result = runGeeHealthCheck();
console.log(printGeeHealthReport());
```

---

## Flujo de autenticación (Sprint 2 — no implementado aún)

```
1. Operador completa variables GOOGLE_* en .env (servidor únicamente)
2. GeeConfigRepository valida presencia (Sprint 1 ✓)
3. GEEAuthentication.isConfigured() → true
4. [Sprint 2] ServiceAccountAuthService obtiene token OAuth2
5. [Sprint 2] GEEImageService / GEEIndexService llaman API REST GEE
6. [Sprint 3] Resultados persistidos en PostgreSQL + capas GIS
```

**Sprint 1:** `MockGeeAuthenticationService.isAuthenticated()` siempre retorna `false`.

---

## Buenas prácticas

1. **Nunca** exponer `GOOGLE_PRIVATE_KEY` al cliente Next.js (`NEXT_PUBLIC_*` prohibido).
2. Mantener `DATA_SOURCE=mock` hasta completar Sprint 2.
3. Ejecutar `npm run test:gee` en CI antes de desplegar entornos con GEE.
4. Rotar credenciales de cuenta de servicio cada 90 días.
5. Limitar roles IAM al mínimo: `roles/earthengine.admin` solo en entorno de procesamiento.
6. Usar región de interés (ROI) acotada a la cuenca del Río Reque para reducir cuotas.
7. Preferir `@/lib/gee` o `@/services/google-earth-engine` en código nuevo; evitar acoplar UI directamente.

---

## Estructura de archivos (Sprint 1)

```
src/
├── config/
│   └── gee.config.ts
├── lib/
│   └── gee/
│       ├── health-check.ts
│       └── index.ts
└── services/
    └── google-earth-engine/
        ├── interfaces/
        ├── types/
        ├── repositories/
        ├── services/
        ├── providers/
        ├── gee.factory.ts
        └── index.ts

scripts/
└── validate-gee.ts

docs/
└── GOOGLE_EARTH_ENGINE_SETUP.md
```

---

## Próximos sprints recomendados

| Sprint | Entregable |
|--------|------------|
| **Sprint 2** | Autenticación service account + cliente HTTP GEE + `ServiceAccountGeeProvider` |
| **Sprint 3** | Cálculo real NDWI/NDVI/MNDWI/NDTI + exportación GeoTIFF |
| **Sprint 4** | Integración con `GISFactory.create("gee")` y `gee-data.provider.ts` |
| **Sprint 5** | Sincronización PostgreSQL + pipeline `services/earth-engine/` (Python) |

---

## Verificación local

```powershell
npm run dev
npm run test:gee
npm run build
```

La plataforma debe compilar y seguir usando datos simulados en `/mapa` y dashboard.
