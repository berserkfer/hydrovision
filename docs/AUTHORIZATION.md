# Autorización — Usuarios, Roles y Permisos

## Autenticación real (rama `rediseno`)

- **Inicio de sesión** con correo y contraseña: `POST /api/auth/login` (`{ email, password }`), página `/login`. Cierre: `POST /api/auth/logout`.
- **Contraseñas** con bcrypt (`bcryptjs`, coste `AUTH_BCRYPT_ROUNDS`, 12 por defecto) en la columna `usuarios.password_hash` (migración `20261021120000_auth_password_hash`). Nunca se guarda ni se registra la contraseña en claro.
- **Sesión** en cookie `hv_session`: `httpOnly`, `SameSite=Lax`, `Secure` fuera de desarrollo, firmada con HMAC-SHA256 (`AUTH_SECRET`, ≥ 32 caracteres, obligatorio fuera de desarrollo). Solo lleva el id de usuario y la expiración (`AUTH_SESSION_TTL_HOURS`, 8 h). El rol y el estado se leen de la base **en cada petición**, así que un cambio de rol o una desactivación aplica de inmediato en la API.
- **Rutas protegidas:** todas las rutas `/api/*`, salvo login y logout, exigen sesión. Sin sesión → **401**; rol insuficiente o cuenta inactiva → **403**. Las páginas pasan por `src/middleware.ts`: sin cookie válida redirigen a `/login` (el middleware solo verifica firma y expiración; la API además verifica rol y estado).
- **Usuario simulado** (`X-HydroVision-Dev-User` / `DEV_SIMULATED_USER_ID`): **solo con `NODE_ENV=development`**. En producción, test o cualquier otro entorno no tiene efecto y nunca asigna ADMIN.
- **Login sin base de datos:** responde **503** y lo explica; no simula un acceso. Sin `DATABASE_URL` solo existe el usuario simulado de desarrollo.
- **Fuerza bruta:** 10 intentos de login por minuto y cliente; mismo mensaje y mismo tiempo de respuesta para "correo inexistente" y "contraseña incorrecta".

### Primer ADMIN

```bash
# con DATABASE_URL configurada y la migración aplicada (npm run db:migrate:deploy)
HV_ADMIN_EMAIL="admin@institucion.pe" HV_ADMIN_PASSWORD="<contraseña segura>" npm run seed:admin
```

- La contraseña se lee solo del entorno (≥ 12 caracteres, letras y números); no hay contraseña por defecto.
- Si el correo ya existe con contraseña, solo se garantiza el rol ADMIN; `HV_ADMIN_RESET=true` la reemplaza.

### Pendiente

- La pantalla de usuarios (`/users`) todavía crea cuentas **sin contraseña**: esas cuentas no pueden iniciar sesión hasta que se defina un flujo para fijarla (invitación o restablecimiento).
- El middleware no consulta la base: un usuario desactivado con cookie vigente aún ve páginas (no la API) hasta que expire la sesión.

---

## Diseño original de roles y permisos (Sprint 3I)

## Modelos

| Modelo Prisma | Propósito |
|---------------|-----------|
| `Usuario` (`usuarios`) | Entidad **User** persistida (id, name→nombre, email, role→rol, status→activo/estado) |
| `Role` | Definición de rol (ADMIN, INVESTIGATOR, TECHNICIAN, VIEWER) |
| `Permission` | Permiso atómico del sistema |
| `RolePermission` | Relación N:M Role → Permission |

## Roles

| Código | Dominio legacy (`RolUsuario`) | Descripción |
|--------|----------------------------|-------------|
| `ADMIN` | `admin` | Acceso completo + gestión de usuarios |
| `INVESTIGATOR` | `researcher` | Datos científicos, import/export, auditoría |
| `TECHNICIAN` | `field_operator` | Registro y actualización de mediciones |
| `VIEWER` | `viewer` | Solo consulta |

## Permisos

`STATIONS_*`, `CAMPAIGNS_*`, `MEASUREMENTS_*`, `IMPORT_DATA`, `EXPORT_DATA`, `VIEW_AUDIT`, `MANAGE_USERS`

Fuente de verdad en código: `src/server/authorization/permissions.ts` (`ROLE_PERMISSION_MATRIX`).

## Matriz de acceso (resumen)

| Permiso | ADMIN | INVESTIGATOR | TECHNICIAN | VIEWER |
|---------|:-----:|:------------:|:----------:|:------:|
| STATIONS_VIEW | ✓ | ✓ | ✓ | ✓ |
| STATIONS_CREATE/UPDATE | ✓ | ✓ | — | — |
| STATIONS_DELETE | ✓ | — | — | — |
| CAMPAIGNS_* (CRUD) | ✓ | ✓* | VIEW | VIEW |
| MEASUREMENTS_VIEW | ✓ | ✓ | ✓ | ✓ |
| MEASUREMENTS_CREATE/UPDATE | ✓ | ✓ | ✓ | — |
| MEASUREMENTS_DELETE | ✓ | ✓ | — | — |
| IMPORT/EXPORT | ✓ | ✓ | — | — |
| VIEW_AUDIT | ✓ | ✓ | — | — |
| MANAGE_USERS | ✓ | — | — | — |

*Investigator: campañas sin DELETE.

## Arquitectura

```
UI (/users)
  → API (/api/users, /api/auth/context)
  → UserService / AuthorizationService
  → UserRepository (Usuario) + ROLE_PERMISSION_MATRIX
  → PostgreSQL (opcional) o mock store
```

Servicios:

- `PermissionService` — listado y matriz de permisos
- `RoleService` — roles y permisos por rol
- `AuthorizationService` — `hasPermission()`, `hasRole()`, `can()`

Guards: `requirePermission()` en rutas API críticas.

## Flujo de autorización (desarrollo)

1. `getSimulatedUserContext()` resuelve usuario desde:
   - Header `X-HydroVision-Dev-User`
   - Variable `DEV_SIMULATED_USER_ID`
   - Default: `usr-admin`
2. `AuthorizationService.assertPermission()` valida permiso + usuario activo.
3. Sin permiso → HTTP **403 FORBIDDEN**.

## Usuario simulado

Cuentas ficticias en seed y mock:

- `usr-admin`, `usr-investigador`, `usr-operador`, `usr-visor`, `usr-inactivo`

## Seguridad

- Sin contraseñas ni OAuth en este sprint.
- Permisos **no editables por usuario** en UI (solo vía rol).
- AuditLog registra creación, cambio de rol, activación/desactivación y baja lógica de usuarios.
- Registros de auditoría no modificables.

## Pendiente para autenticación real

- [ ] Sesión/JWT o NextAuth (u otro proveedor institucional)
- [ ] Hash de contraseñas (bcrypt/argon2) si aplica login local
- [ ] Middleware Next.js global
- [ ] Reemplazar `getSimulatedUserContext()` por sesión autenticada
- [ ] Revocación de tokens y MFA (según política institucional)

## Pruebas

```bash
npm run test
npm run lint
npm run build
```

Migración: `20250809010000_sprint_3i_roles_permissions`  
Seed: `npm run db:seed` (roles, permisos, usuarios ficticios)
