# Sprint 2 — Autenticación Google Earth Engine

Documentación del sistema profesional de autenticación Service Account para HydroVision.

---

## Objetivo

Implementar autenticación desacoplada para Google Earth Engine **sin consumir imágenes**, **sin calcular índices** y **sin modificar la UI existente** (excepto panel interno `/admin/system-status`).

---

## Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  /admin/system-status          API Routes (server-only)       │
│  SystemStatusPanel             GET  /api/admin/system-status  │
│  Semáforos + Probar Conexión   POST /api/admin/gee/test-connection │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  SystemStatusService · GeeHealthService                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  EarthEngineAuthService (IEarthEngineAuth)                     │
│    ├── EnvironmentValidator (IEnvironmentValidator)            │
│    ├── CredentialValidator                                     │
│    └── EarthEngineTokenManager (ITokenProvider)                │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  GeeCredentialsRepository → src/config/gee.config.ts           │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│  Sprint 3: Google OAuth2 JWT → token real                      │
└──────────────────────────────────────────────────────────────┘
```

### Patrones

| Patrón | Implementación |
|--------|----------------|
| **SOLID / ISP** | Interfaces `IEarthEngineAuth`, `IEnvironmentValidator`, `ITokenProvider` |
| **Repository** | `GeeCredentialsRepository` |
| **Factory** | `GeeFactory.createAuto()` → mock o service_account |
| **DI** | `getEarthEngineAuthService()`, `getGeeProvider()` |
| **DRY** | Validación centralizada en `gee.config.ts` |

---

## Flujo de autenticación

### 1. Arranque del servidor

1. `EnvironmentValidator` lee `.env` vía `GeeCredentialsRepository`.
2. Si falta alguna variable → `validateGeeConfig()` retorna errores claros.
3. `EarthEngineAuthService.initialize()` **lanza excepción** si la configuración es inválida.
4. Si todo existe → mensaje `✅ Configuración válida`.

### 2. Panel de diagnóstico

1. Operador abre `/admin/system-status`.
2. El panel consulta `GET /api/admin/system-status`.
3. Se muestran semáforos: verde / amarillo / rojo.

### 3. Probar Conexión (simulado)

1. Operador pulsa **Probar Conexión**.
2. `POST /api/admin/gee/test-connection` ejecuta:
   - `EarthEngineAuthService.initialize()`
   - `EarthEngineTokenManager.getAccessToken()` → token simulado
3. Respuesta exitosa: conexión simulada OK.

### 4. Sprint 3 (futuro)

Reemplazar en `EarthEngineTokenManager.refreshAccessToken()`:

```typescript
// TODO Sprint 3: intercambiar JWT por access_token real vía Google OAuth2
```

---

## Variables necesarias

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `GOOGLE_CLIENT_EMAIL` | Sí | Email de la cuenta de servicio |
| `GOOGLE_PRIVATE_KEY` | Sí | Clave PEM (escapar `\n`) |
| `GOOGLE_PROJECT_ID` | Sí | ID del proyecto Google Cloud |
| `GOOGLE_EARTH_ENGINE_PROJECT` | Sí | Proyecto con Earth Engine habilitado |
| `GEE_INTEGRATION_ENABLED` | No | Default `true` |

---

## Buenas prácticas de seguridad

1. **Nunca** usar prefijo `NEXT_PUBLIC_` en credenciales.
2. Mantener `GOOGLE_PRIVATE_KEY` solo en `.env` del servidor.
3. No registrar la clave privada en logs ni respuestas API.
4. Rotar credenciales de cuenta de servicio periódicamente.
5. Limitar roles IAM al mínimo necesario para Earth Engine.
6. Restringir `/admin/*` con autenticación de operador en producción (Sprint futuro).
7. Ejecutar `npm run test:gee` en CI antes de despliegues.

---

## Preparación para conexión real (Sprint 3)

| Componente | Estado Sprint 2 | Sprint 3 |
|------------|-----------------|----------|
| `EnvironmentValidator` | ✓ Completo | Sin cambios |
| `CredentialValidator` | ✓ Formato PEM/email | Sin cambios |
| `EarthEngineTokenManager` | Token simulado | OAuth2 JWT real |
| `EarthEngineAuthService.testConnection()` | Simulación | Ping API GEE |
| `GEEImageService` | Mock | Colecciones reales |
| `GEEIndexService` | Mock | Cálculo NDWI/NDVI |

---

## Verificación

```powershell
npm run dev
npm run test:gee
```

Panel interno: [http://localhost:3000/admin/system-status](http://localhost:3000/admin/system-status)

---

## Estructura de archivos

```
src/services/google-earth-engine/auth/
├── interfaces/
├── repositories/
├── services/
│   ├── environment-validator.service.ts
│   ├── credential-validator.service.ts
│   ├── earth-engine-token-manager.ts
│   └── earth-engine-auth.service.ts
└── index.ts

src/app/admin/system-status/page.tsx
src/app/api/admin/system-status/route.ts
src/app/api/admin/gee/test-connection/route.ts
src/components/admin/
```
