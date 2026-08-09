/**
 * Pruebas de autorización — Sprint 3I
 */

import { describe, expect, it } from "vitest";
import { authorizationService } from "./authorization.service";
import type { AuthUserContext } from "./dev-user-context";
import { PERMISSIONS } from "./permissions";

function user(role: AuthUserContext["role"], status: AuthUserContext["status"] = "active"): AuthUserContext {
  return {
    id: `test-${role}`,
    name: "Test",
    email: "test@hydrovision.local",
    role,
    status,
    isSimulated: true,
  };
}

describe("ADMIN", () => {
  it("tiene todos los permisos", () => {
    const admin = user("ADMIN");
    for (const permission of PERMISSIONS) {
      expect(authorizationService.hasPermission(admin, permission)).toBe(true);
    }
  });
});

describe("INVESTIGATOR", () => {
  it("puede trabajar con datos científicos", () => {
    const investigator = user("INVESTIGATOR");
    expect(authorizationService.can(investigator, "MEASUREMENTS_CREATE")).toBe(true);
    expect(authorizationService.can(investigator, "IMPORT_DATA")).toBe(true);
    expect(authorizationService.can(investigator, "EXPORT_DATA")).toBe(true);
    expect(authorizationService.can(investigator, "VIEW_AUDIT")).toBe(true);
    expect(authorizationService.can(investigator, "MANAGE_USERS")).toBe(false);
    expect(authorizationService.can(investigator, "STATIONS_DELETE")).toBe(false);
  });
});

describe("TECHNICIAN", () => {
  it("puede registrar y actualizar mediciones", () => {
    const technician = user("TECHNICIAN");
    expect(authorizationService.can(technician, "MEASUREMENTS_CREATE")).toBe(true);
    expect(authorizationService.can(technician, "MEASUREMENTS_UPDATE")).toBe(true);
    expect(authorizationService.can(technician, "MEASUREMENTS_DELETE")).toBe(false);
    expect(authorizationService.can(technician, "IMPORT_DATA")).toBe(false);
    expect(authorizationService.can(technician, "STATIONS_VIEW")).toBe(true);
  });
});

describe("VIEWER", () => {
  it("solamente puede consultar", () => {
    const viewer = user("VIEWER");
    expect(authorizationService.can(viewer, "STATIONS_VIEW")).toBe(true);
    expect(authorizationService.can(viewer, "CAMPAIGNS_VIEW")).toBe(true);
    expect(authorizationService.can(viewer, "MEASUREMENTS_VIEW")).toBe(true);
    expect(authorizationService.can(viewer, "MEASUREMENTS_CREATE")).toBe(false);
    expect(authorizationService.can(viewer, "EXPORT_DATA")).toBe(false);
  });
});

describe("Usuarios inactivos", () => {
  it("no pueden ejecutar operaciones protegidas", () => {
    const inactiveAdmin = user("ADMIN", "inactive");
    expect(authorizationService.hasPermission(inactiveAdmin, "MANAGE_USERS")).toBe(false);
    expect(() => authorizationService.assertPermission(inactiveAdmin, "STATIONS_VIEW")).toThrow();
  });
});

describe("Permisos no autorizados", () => {
  it("assertPermission lanza error 403", () => {
    const viewer = user("VIEWER");
    expect(() => authorizationService.assertPermission(viewer, "MANAGE_USERS")).toThrow(
      /Permiso requerido/
    );
  });
});

describe("hasRole", () => {
  it("identifica el rol del usuario", () => {
    expect(authorizationService.hasRole(user("ADMIN"), "ADMIN")).toBe(true);
    expect(authorizationService.hasRole(user("ADMIN"), "VIEWER")).toBe(false);
  });
});
