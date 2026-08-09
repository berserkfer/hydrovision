/**
 * UserRepository — persistencia de usuarios (User = Usuario) — Sprint 3I
 */

import { isDatabaseConfigured } from "@/config/database.config";
import { MOCK_LAST_UPDATE } from "@/config";
import { getDataStore } from "@/data/store-access";
import { prisma } from "@/server/db";
import { ApiError } from "@/server/api/errors";
import type { CreateUserInput, UpdateUserInput, UserDto, UserStatus } from "@/server/dto/user.dto";
import { toAppRole, toRolUsuario } from "@/server/authorization/roles";
import { RolUsuario } from "@/constants/enums";

const mockOverlay = new Map<string, UserDto>();
const mockDeleted = new Set<string>();

function mapStatusToDb(status: UserStatus): { activo: boolean; estado: "active" | "inactive" } {
  return status === "active" ? { activo: true, estado: "active" } : { activo: false, estado: "inactive" };
}

function fromStoreUser(u: {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  institucion: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}): UserDto {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    role: toAppRole(u.rol),
    status: u.activo ? "active" : "inactive",
    institution: u.institucion,
    createdAt: u.createdAt ?? MOCK_LAST_UPDATE,
    updatedAt: u.updatedAt ?? MOCK_LAST_UPDATE,
  };
}

function allMockUsers(): UserDto[] {
  const base = getDataStore()
    .usuarios.filter((u) => !mockDeleted.has(u.id))
    .map(fromStoreUser);
  const merged = new Map<string, UserDto>();
  base.forEach((u) => merged.set(u.id, u));
  mockOverlay.forEach((u, id) => {
    if (!mockDeleted.has(id)) merged.set(id, u);
  });
  return Array.from(merged.values());
}

export class UserRepository {
  findAll(): UserDto[] {
    return allMockUsers().sort((a, b) => a.name.localeCompare(b.name));
  }

  findById(id: string): UserDto | null {
    return allMockUsers().find((u) => u.id === id) ?? null;
  }

  findByEmail(email: string): UserDto | null {
    const normalized = email.toLowerCase();
    return allMockUsers().find((u) => u.email.toLowerCase() === normalized) ?? null;
  }

  async create(input: CreateUserInput): Promise<UserDto> {
    if (this.findByEmail(input.email)) {
      throw ApiError.duplicate("Ya existe un usuario con ese email");
    }

    const id = `usr-${Date.now()}`;
    const now = new Date().toISOString();
    const user: UserDto = {
      id,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status ?? "active",
      institution: input.institution,
      createdAt: now,
      updatedAt: now,
    };

    if (isDatabaseConfigured()) {
      try {
        const dbStatus = mapStatusToDb(user.status);
        await prisma.usuario.create({
          data: {
            id,
            nombre: user.name,
            email: user.email,
            rol: toRolUsuario(user.role),
            institucion: user.institution,
            activo: dbStatus.activo,
            estado: dbStatus.estado,
            observaciones: "Usuario creado — Sprint 3I",
          },
        });
        return user;
      } catch {
        // mock fallback
      }
    }

    mockOverlay.set(id, user);
    return user;
  }

  async update(id: string, input: UpdateUserInput): Promise<UserDto> {
    const current = this.findById(id);
    if (!current) throw ApiError.notFound("Usuario", id);

    if (input.email && input.email !== current.email && this.findByEmail(input.email)) {
      throw ApiError.duplicate("Ya existe un usuario con ese email");
    }

    const updated: UserDto = {
      ...current,
      name: input.name ?? current.name,
      email: input.email ?? current.email,
      role: input.role ?? current.role,
      status: input.status ?? current.status,
      institution: input.institution ?? current.institution,
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseConfigured()) {
      try {
        const dbStatus = mapStatusToDb(updated.status);
        await prisma.usuario.update({
          where: { id },
          data: {
            nombre: updated.name,
            email: updated.email,
            rol: toRolUsuario(updated.role),
            institucion: updated.institution,
            activo: dbStatus.activo,
            estado: dbStatus.estado,
          },
        });
        return updated;
      } catch {
        // mock fallback
      }
    }

    mockOverlay.set(id, updated);
    return updated;
  }

  async softDelete(id: string): Promise<UserDto> {
    const current = this.findById(id);
    if (!current) throw ApiError.notFound("Usuario", id);

    const updated = await this.update(id, { status: "inactive" });
    mockDeleted.add(id);

    if (isDatabaseConfigured()) {
      try {
        await prisma.usuario.update({
          where: { id },
          data: { activo: false, estado: "inactive" },
        });
      } catch {
        // ignore
      }
    }

    return updated;
  }
}

export const userRepository = new UserRepository();

export function resetUserRepositoryMock(): void {
  mockOverlay.clear();
  mockDeleted.clear();
}
