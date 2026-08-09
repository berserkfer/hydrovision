# Autorización — Usuarios, Roles y Permisos (Sprint 3I)

Arquitectura preparada para autenticación real futura. **No hay login ni contraseñas** en esta fase.

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
