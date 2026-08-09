/**
 * Cliente API — Usuarios (Sprint 3I)
 */

import { apiGet } from "./client";
import type { UserDto, UserListResponseDto } from "@/server/dto/user.dto";
import type { AppRole } from "@/server/authorization/roles";
import type { UserStatus } from "@/server/dto/user.dto";

function authHeaders(): HeadersInit {
  const devUser = typeof window !== "undefined" ? localStorage.getItem("hv-dev-user") : null;
  return devUser ? { "X-HydroVision-Dev-User": devUser } : {};
}

async function apiWithDevUser<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Error en la solicitud");
  }
  return payload.data as T;
}

export async function fetchUsers(): Promise<UserListResponseDto> {
  return apiWithDevUser("GET", "/api/users");
}

export async function createUser(input: {
  name: string;
  email: string;
  role: AppRole;
  institution: string;
  status?: UserStatus;
}) {
  return apiWithDevUser<UserDto>("POST", "/api/users", input);
}

export async function updateUser(
  id: string,
  input: Partial<{
    name: string;
    email: string;
    role: AppRole;
    institution: string;
    status: UserStatus;
  }>
) {
  return apiWithDevUser<UserDto>("PUT", `/api/users/${id}`, input);
}

export async function fetchAuthContext() {
  return apiGet<{
    user: { id: string; name: string; role: AppRole; status: UserStatus };
    permissions: string[];
    canManageUsers: boolean;
    devMode: boolean;
  }>("/api/auth/context");
}

export async function fetchPermissionMatrix() {
  return apiGet<{
    roles: unknown[];
    matrix: Array<{
      code: import("@/server/authorization/permissions").PermissionCode;
      label: string;
      category: string;
      roles: import("@/server/authorization/roles").AppRole[];
    }>;
  }>("/api/auth/context?mode=roles");
}
